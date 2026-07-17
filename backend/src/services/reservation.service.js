import { query } from '../config/db.js';
import {
  consumeStock,
  findMedicineNames,
  findReservationItems,
  holdStock,
  linkReservationItem,
  recordMovement,
  releaseStock,
} from '../repositories/inventory.repository.js';
import {
  findByPatientUser,
  findByPharmacy,
  findOrderDetails,
  findOrderForUpdate,
  findReservationByIdForUpdate,
  findReservationForUpdate,
  incrementCancellationCount,
  incrementRescheduleCount,
  insertReservation,
  isPharmacyLinkedToEps,
  lockPharmacy,
  moveReservation,
  updateOrderStatus,
  updateReservationStatus,
} from '../repositories/reservation.repository.js';
import { ApiError } from '../utils/api-error.js';
import { withTransaction } from '../utils/transaction.js';
import { NOTIFICATION_TYPES, notifyReservationEvent } from './notification.service.js';
import { assertSlotIsBookable } from './slot.service.js';

/**
 * Reservation business rules.
 *
 * Limits are named constants rather than inline literals so the rule is stated
 * once and reads the same in the code and the error message.
 */

/** A patient may cancel a given order at most this many times. */
export const MAX_CANCELLATIONS = 3;

/**
 * A patient may reschedule a given order at most this many times.
 *
 * Was effectively 3 (`reschedule_count < 3`), which contradicted the documented
 * rule of "no more than 2".
 */
export const MAX_RESCHEDULES = 2;

/**
 * Rejects an order that cannot be reserved, with the specific reason.
 * @param {object} order Row from findOrderForUpdate.
 */
const assertOrderIsReservable = (order) => {
  if (!order) throw ApiError.notFound('Order not found.');

  // Checked before status: an order can sit at PENDING and still be past its
  // expiry if the hourly expiration job has not run yet.
  if (order.is_expired || order.status === 'EXPIRED') {
    throw ApiError.badRequest('The order has expired and can no longer be reserved.');
  }

  const byStatus = {
    DELIVERED: 'The order was already delivered and cannot be reserved again.',
    RESERVED: 'The order already has an active reservation. Cancel it before reserving again.',
    CANCELLED: 'The order was cancelled and cannot be reserved.',
  };
  if (byStatus[order.status]) throw ApiError.conflict(byStatus[order.status]);

  if (order.status !== 'PENDING') {
    throw ApiError.conflict(`The order is not available for reservation (status: ${order.status}).`);
  }
};

const toDateOnly = (value) => (value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10));

const assertReservationBeforeExpiration = ({ reservationDate, expirationDate }) => {
  if (toDateOnly(reservationDate) > toDateOnly(expirationDate)) {
    throw ApiError.badRequest('Reservation date cannot be after the order expiration date.');
  }
};

/**
 * Explains a failed stock hold.
 *
 * `holdStock` returns false for two different situations that deserve different
 * answers, so the cause is resolved only on the failure path — keeping the happy
 * path to a single UPDATE.
 *
 * @throws {ApiError} Always.
 */
const throwStockError = async ({ pharmacyId, medicineId, quantity }, client) => {
  const medicine = (await findMedicineNames([medicineId], client)).get(medicineId);
  const label = medicine ? `${medicine.name} (${medicine.code})` : `medicine ${medicineId}`;

  const inventory = await client.query(
    `SELECT stock_quantity - reserved_quantity AS available
     FROM pharmacy_inventory WHERE pharmacy_id = $1 AND medicine_id = $2`,
    [pharmacyId, medicineId],
  );

  if (!inventory.rowCount) {
    throw ApiError.conflict(`This pharmacy does not carry ${label}.`);
  }

  throw ApiError.conflict(
    `Insufficient stock of ${label}: ${inventory.rows[0].available} available, ${quantity} required.`,
  );
};

/** Releases every hold of a reservation and records the movements. */
const releaseReservationStock = async ({ reservationId, pharmacyId }, client) => {
  const items = await findReservationItems(reservationId, client);
  for (const item of items) {
    await releaseStock({ pharmacyId, medicineId: item.medicine_id, quantity: item.quantity }, client);
    await recordMovement(
      {
        pharmacyId,
        medicineId: item.medicine_id,
        movementType: 'RELEASE',
        quantity: item.quantity,
        reservationId,
      },
      client,
    );
  }
};

/**
 * Creates a reservation, holding the order's stock at the chosen pharmacy.
 *
 * Enforces: order exists and belongs to the patient, is not expired, not already
 * delivered or reserved, the pharmacy is contracted by the order's EPS, the slot
 * is within working hours and has capacity, and every medicine has free stock.
 *
 * All of it, plus the stock hold and the notification, is one transaction: a
 * partial failure must never leave stock held for a reservation that does not exist.
 *
 * @param {object} input
 * @param {number} input.userId Authenticated patient user id.
 * @returns {Promise<object>} The created reservation row.
 */
export const createReservation = async ({
  userId, orderId, pharmacyId, reservationDate, startTime, endTime,
}) =>
  withTransaction(async (client) => {
    const order = await findOrderForUpdate({ orderId, userId }, client);
    assertOrderIsReservable(order);
    assertReservationBeforeExpiration({ reservationDate, expirationDate: order.expiration_date });

    if (!(await isPharmacyLinkedToEps({ epsId: order.eps_id, pharmacyId }, client))) {
      throw ApiError.badRequest('Pharmacy is not associated with the order EPS.');
    }

    await lockPharmacy(pharmacyId, client);
    await assertSlotIsBookable({ pharmacyId, date: reservationDate, startTime, endTime }, client);

    const details = await findOrderDetails(orderId, client);
    if (!details.length) throw ApiError.badRequest('The order has no medicines to reserve.');

    const reservation = await insertReservation(
      { orderId, pharmacyId, reservationDate, startTime, endTime },
      client,
    );

    for (const detail of details) {
      const held = await holdStock(
        { pharmacyId, medicineId: detail.medicine_id, quantity: detail.quantity },
        client,
      );
      if (!held) {
        await throwStockError(
          { pharmacyId, medicineId: detail.medicine_id, quantity: detail.quantity },
          client,
        );
      }

      await linkReservationItem(
        { reservationId: reservation.id, medicineId: detail.medicine_id, quantity: detail.quantity },
        client,
      );
      await recordMovement(
        {
          pharmacyId,
          medicineId: detail.medicine_id,
          movementType: 'RESERVATION',
          quantity: -detail.quantity,
          reservationId: reservation.id,
        },
        client,
      );
    }

    await updateOrderStatus({ orderId, status: 'RESERVED' }, client);

    await notifyReservationEvent(
      {
        type: NOTIFICATION_TYPES.RESERVATION_CREATED,
        reservationId: reservation.id,
        orderId,
        date: reservationDate,
        startTime,
      },
      client,
    );

    return reservation;
  });

/**
 * Cancels a patient's reservation and releases the held stock.
 * The order returns to PENDING so it can be reserved elsewhere.
 */
export const cancelReservation = async ({ reservationId, userId }) =>
  withTransaction(async (client) => {
    const reservation = await findReservationForUpdate({ reservationId, userId }, client);
    if (!reservation) throw ApiError.notFound('Reservation not found.');

    if (reservation.status !== 'RESERVED') {
      throw ApiError.conflict(`Only active reservations can be cancelled (status: ${reservation.status}).`);
    }

    // Checked before mutating so the limit message is precise, instead of the
    // previous behaviour where the guard lived in the UPDATE's WHERE clause and
    // a blocked cancellation surfaced as a misleading 404.
    if (reservation.cancellation_count >= MAX_CANCELLATIONS) {
      throw ApiError.conflict(
        `This order reached the limit of ${MAX_CANCELLATIONS} cancellations and cannot be cancelled again.`,
      );
    }

    await updateReservationStatus({ reservationId, status: 'CANCELLED' }, client);
    await releaseReservationStock({ reservationId, pharmacyId: reservation.pharmacy_id }, client);
    await incrementCancellationCount(reservation.order_id, client);

    await notifyReservationEvent(
      {
        type: NOTIFICATION_TYPES.RESERVATION_CANCELLED,
        reservationId,
        orderId: reservation.order_id,
        date: reservation.reservation_date,
        startTime: reservation.start_time,
      },
      client,
    );

    return reservation;
  });

/**
 * Moves a reservation to a new slot at the same pharmacy.
 *
 * Stock stays held throughout: the medicines do not change, only the time, so
 * releasing and re-holding would risk losing the stock to another patient.
 */
export const rescheduleReservation = async ({
  reservationId, userId, reservationDate, startTime, endTime,
}) =>
  withTransaction(async (client) => {
    const reservation = await findReservationForUpdate({ reservationId, userId }, client);
    if (!reservation) throw ApiError.notFound('Reservation not found.');

    if (reservation.status !== 'RESERVED') {
      throw ApiError.conflict(`Only active reservations can be rescheduled (status: ${reservation.status}).`);
    }

    if (reservation.reschedule_count >= MAX_RESCHEDULES) {
      throw ApiError.conflict(
        `This order reached the limit of ${MAX_RESCHEDULES} reschedules and cannot be moved again.`,
      );
    }

    assertReservationBeforeExpiration({
      reservationDate,
      expirationDate: reservation.expiration_date,
    });

    await lockPharmacy(reservation.pharmacy_id, client);
    await assertSlotIsBookable(
      {
        pharmacyId: reservation.pharmacy_id,
        date: reservationDate,
        startTime,
        endTime,
        excludeReservationId: reservationId,
      },
      client,
    );

    const updated = await moveReservation(
      { reservationId, reservationDate, startTime, endTime },
      client,
    );
    await incrementRescheduleCount(reservation.order_id, client);

    await notifyReservationEvent(
      {
        type: NOTIFICATION_TYPES.RESERVATION_RESCHEDULED,
        reservationId,
        orderId: reservation.order_id,
        date: reservationDate,
        startTime,
      },
      client,
    );

    return updated;
  });

/** Marks a reservation as NO_SHOW (pharmacy staff) and releases the stock. */
export const markNoShow = async ({ reservationId }) =>
  withTransaction(async (client) => {
    const reservation = await findReservationByIdForUpdate(reservationId, client);
    if (!reservation) throw ApiError.notFound('Reservation not found.');

    if (reservation.status !== 'RESERVED') {
      throw ApiError.conflict(`Only active reservations can be marked as no-show (status: ${reservation.status}).`);
    }

    await updateReservationStatus({ reservationId, status: 'NO_SHOW' }, client);
    await releaseReservationStock({ reservationId, pharmacyId: reservation.pharmacy_id }, client);
    await updateOrderStatus({ orderId: reservation.order_id, status: 'PENDING' }, client);

    await notifyReservationEvent(
      {
        type: NOTIFICATION_TYPES.RESERVATION_NO_SHOW,
        reservationId,
        orderId: reservation.order_id,
        date: reservation.reservation_date,
        startTime: reservation.start_time,
      },
      client,
    );

    return reservation;
  });

/**
 * Confirms delivery: ships the held stock, closes the reservation and the order.
 * @param {number} input.deliveredBy Operator user id.
 */
export const confirmDelivery = async ({ reservationId, deliveredBy }) =>
  withTransaction(async (client) => {
    const reservation = await findReservationByIdForUpdate(reservationId, client);
    if (!reservation) throw ApiError.notFound('Reservation not found.');

    if (reservation.status !== 'RESERVED') {
      throw ApiError.conflict(`Only active reservations can be delivered (status: ${reservation.status}).`);
    }

    const items = await findReservationItems(reservationId, client);
    for (const item of items) {
      await consumeStock(
        { pharmacyId: reservation.pharmacy_id, medicineId: item.medicine_id, quantity: item.quantity },
        client,
      );
      await recordMovement(
        {
          pharmacyId: reservation.pharmacy_id,
          medicineId: item.medicine_id,
          movementType: 'DELIVERY',
          quantity: -item.quantity,
          reservationId,
        },
        client,
      );
    }

    const result = await client.query(
      `INSERT INTO deliveries (reservation_id, delivered_at, delivered_by)
       VALUES ($1, CURRENT_TIMESTAMP, $2) RETURNING *`,
      [reservationId, String(deliveredBy)],
    );

    await updateReservationStatus({ reservationId, status: 'COMPLETED' }, client);
    await updateOrderStatus({ orderId: reservation.order_id, status: 'DELIVERED' }, client);

    await notifyReservationEvent(
      {
        type: NOTIFICATION_TYPES.RESERVATION_DELIVERED,
        reservationId,
        orderId: reservation.order_id,
        date: reservation.reservation_date,
        startTime: reservation.start_time,
      },
      client,
    );

    return result.rows[0];
  });

/** Lists reservations for a pharmacy. */
export const listPharmacyReservations = async (filters) => findByPharmacy(filters);

/** Lists the authenticated patient's own reservations. */
export const listMyReservations = async (filters) => findByPatientUser(filters);

/** Resolves the pharmacy that owns a reservation (for access checks). */
export const findReservationPharmacyId = async (reservationId) => {
  const result = await query('SELECT pharmacy_id FROM reservations WHERE id = $1', [reservationId]);
  return result.rows[0]?.pharmacy_id;
};
