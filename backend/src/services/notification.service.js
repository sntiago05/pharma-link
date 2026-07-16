import { query } from '../config/db.js';
import { logger } from '../config/logger.js';
import { insertNotifications } from '../repositories/notification.repository.js';

/**
 * Domain notifications.
 *
 * Every emit function takes the transaction `client` of the action that caused
 * it, so the notification commits or rolls back together with the event. A
 * cancelled reservation must never leave a "reservation cancelled" notice
 * behind, and a committed one must always produce its notice.
 */

export const NOTIFICATION_TYPES = Object.freeze({
  RESERVATION_CREATED: 'RESERVATION_CREATED',
  RESERVATION_CANCELLED: 'RESERVATION_CANCELLED',
  RESERVATION_RESCHEDULED: 'RESERVATION_RESCHEDULED',
  RESERVATION_DELIVERED: 'RESERVATION_DELIVERED',
  RESERVATION_NO_SHOW: 'RESERVATION_NO_SHOW',
  ORDER_EXPIRED: 'ORDER_EXPIRED',
});

/**
 * Resolves who should hear about a reservation: the patient who owns the order
 * plus the operators assigned to the pharmacy.
 * @returns {Promise<{ patientUserId: number, pharmacyUserIds: number[], pharmacyName: string, orderNumber: string }|undefined>}
 */
const resolveReservationAudience = async (reservationId, client) => {
  const runner = client ? client.query.bind(client) : query;
  const result = await runner(
    `SELECT patients.user_id            AS patient_user_id,
            pharmacies.name             AS pharmacy_name,
            medical_orders.order_number AS order_number,
            COALESCE(
              ARRAY_AGG(user_pharmacies.user_id) FILTER (WHERE user_pharmacies.user_id IS NOT NULL),
              '{}'
            ) AS pharmacy_user_ids
     FROM reservations
     INNER JOIN medical_orders  ON medical_orders.id = reservations.order_id
     INNER JOIN patients        ON patients.id = medical_orders.patient_id
     INNER JOIN pharmacies      ON pharmacies.id = reservations.pharmacy_id
     LEFT  JOIN user_pharmacies ON user_pharmacies.pharmacy_id = reservations.pharmacy_id
     WHERE reservations.id = $1
     GROUP BY patients.user_id, pharmacies.name, medical_orders.order_number`,
    [reservationId],
  );

  const row = result.rows[0];
  if (!row) return undefined;

  return {
    patientUserId: row.patient_user_id,
    pharmacyUserIds: row.pharmacy_user_ids,
    pharmacyName: row.pharmacy_name,
    orderNumber: row.order_number,
  };
};

const formatDate = (date) => (date instanceof Date ? date.toISOString().slice(0, 10) : String(date));
const formatTime = (time) => String(time).slice(0, 5);

/** Message templates, one per event. */
const TEMPLATES = {
  [NOTIFICATION_TYPES.RESERVATION_CREATED]: (ctx) => ({
    title: 'Reserva confirmada',
    patient: `Tu reserva de la orden ${ctx.orderNumber} en ${ctx.pharmacyName} quedó agendada para el ${formatDate(ctx.date)} a las ${formatTime(ctx.startTime)}.`,
    pharmacy: `Nueva reserva para la orden ${ctx.orderNumber} el ${formatDate(ctx.date)} a las ${formatTime(ctx.startTime)}.`,
  }),
  [NOTIFICATION_TYPES.RESERVATION_CANCELLED]: (ctx) => ({
    title: 'Reserva cancelada',
    patient: `Cancelaste la reserva de la orden ${ctx.orderNumber} en ${ctx.pharmacyName}. La orden vuelve a estar pendiente.`,
    pharmacy: `Se canceló la reserva de la orden ${ctx.orderNumber} del ${formatDate(ctx.date)}. El stock fue liberado.`,
  }),
  [NOTIFICATION_TYPES.RESERVATION_RESCHEDULED]: (ctx) => ({
    title: 'Reserva reprogramada',
    patient: `Tu reserva de la orden ${ctx.orderNumber} en ${ctx.pharmacyName} quedó reprogramada para el ${formatDate(ctx.date)} a las ${formatTime(ctx.startTime)}.`,
    pharmacy: `La reserva de la orden ${ctx.orderNumber} se movió al ${formatDate(ctx.date)} a las ${formatTime(ctx.startTime)}.`,
  }),
  [NOTIFICATION_TYPES.RESERVATION_DELIVERED]: (ctx) => ({
    title: 'Medicamento entregado',
    patient: `Se confirmó la entrega de la orden ${ctx.orderNumber} en ${ctx.pharmacyName}.`,
    pharmacy: `Entrega confirmada para la orden ${ctx.orderNumber}.`,
  }),
  [NOTIFICATION_TYPES.RESERVATION_NO_SHOW]: (ctx) => ({
    title: 'Reserva marcada como no asistida',
    patient: `No se registró tu asistencia a la reserva de la orden ${ctx.orderNumber} en ${ctx.pharmacyName}. La orden vuelve a estar pendiente.`,
    pharmacy: `La reserva de la orden ${ctx.orderNumber} se marcó como no asistida y el stock fue liberado.`,
  }),
};

/**
 * Emits the notifications for a reservation event.
 *
 * @param {object} event
 * @param {string} event.type One of {@link NOTIFICATION_TYPES}.
 * @param {number} event.reservationId
 * @param {number} event.orderId
 * @param {string|Date} [event.date] Reservation date, for the message body.
 * @param {string} [event.startTime]
 * @param {import('pg').PoolClient} client Transaction client of the causing action.
 */
export const notifyReservationEvent = async (
  { type, reservationId, orderId, date, startTime },
  client,
) => {
  const audience = await resolveReservationAudience(reservationId, client);
  if (!audience) {
    // The reservation vanished mid-transaction; the caller's own checks will fail.
    logger.warn('Skipped notification: reservation not found', { reservationId, type });
    return;
  }

  const template = TEMPLATES[type]({
    ...audience,
    date,
    startTime,
  });

  const recipients = [
    {
      userId: audience.patientUserId,
      type,
      title: template.title,
      message: template.patient,
      orderId,
      reservationId,
    },
    ...audience.pharmacyUserIds
      // A pharmacy operator who is also the patient would otherwise get both copies.
      .filter((userId) => userId !== audience.patientUserId)
      .map((userId) => ({
        userId,
        type,
        title: template.title,
        message: template.pharmacy,
        orderId,
        reservationId,
      })),
  ];

  await insertNotifications(recipients, client);
};

/**
 * Emits one ORDER_EXPIRED notification per expired order.
 * @param {Array<{ id: number, order_number: string, user_id: number }>} orders
 * @param {import('pg').PoolClient} client
 */
export const notifyOrdersExpired = async (orders, client) => {
  await insertNotifications(
    orders.map((order) => ({
      userId: order.user_id,
      type: NOTIFICATION_TYPES.ORDER_EXPIRED,
      title: 'Orden vencida',
      message: `Tu orden ${order.order_number} venció y ya no puede reservarse. Comunícate con tu EPS para renovarla.`,
      orderId: order.id,
      reservationId: null,
    })),
    client,
  );
};
