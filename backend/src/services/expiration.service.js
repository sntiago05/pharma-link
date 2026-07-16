import { logger } from '../config/logger.js';
import {
  findReservationItems,
  recordMovement,
  releaseStock,
} from '../repositories/inventory.repository.js';
import { withTransaction } from '../utils/transaction.js';
import { notifyOrdersExpired } from './notification.service.js';

/**
 * Expires medical orders past their expiration date and frees any stock their
 * reservations were holding.
 *
 * Runs hourly from app.js. The whole sweep is one transaction so stock is never
 * left held by a reservation that has already been marked EXPIRED.
 *
 * @returns {Promise<{ expiredOrders: number, releasedReservations: number }>}
 */
export const expireOrders = async () =>
  withTransaction(async (client) => {
    // Reservations first: their stock must be released before the orders they
    // belong to are closed.
    const reservations = await client.query(
      `UPDATE reservations SET status = 'EXPIRED'
       WHERE status = 'RESERVED'
         AND order_id IN (SELECT id FROM medical_orders WHERE expiration_date < CURRENT_DATE)
       RETURNING id, pharmacy_id`,
    );

    for (const reservation of reservations.rows) {
      const items = await findReservationItems(reservation.id, client);
      for (const item of items) {
        await releaseStock(
          {
            pharmacyId: reservation.pharmacy_id,
            medicineId: item.medicine_id,
            quantity: item.quantity,
          },
          client,
        );
        // The original sweep decremented reserved_quantity without recording a
        // movement, so expired holds vanished from the ledger and the movement
        // history no longer reconciled with the stock figures.
        await recordMovement(
          {
            pharmacyId: reservation.pharmacy_id,
            medicineId: item.medicine_id,
            movementType: 'RELEASE',
            quantity: item.quantity,
            reservationId: reservation.id,
          },
          client,
        );
      }
    }

    const orders = await client.query(
      `UPDATE medical_orders SET status = 'EXPIRED'
       WHERE expiration_date < CURRENT_DATE AND status <> 'DELIVERED' AND status <> 'EXPIRED'
       RETURNING id, order_number, patient_id`,
    );

    if (orders.rowCount) {
      // Resolve the notification recipients (the patients' user accounts).
      const recipients = await client.query(
        `SELECT medical_orders.id, medical_orders.order_number, patients.user_id
         FROM medical_orders
         INNER JOIN patients ON patients.id = medical_orders.patient_id
         WHERE medical_orders.id = ANY($1::int[])`,
        [orders.rows.map((order) => order.id)],
      );
      await notifyOrdersExpired(recipients.rows, client);
    }

    const summary = {
      expiredOrders: orders.rowCount,
      releasedReservations: reservations.rowCount,
    };

    if (summary.expiredOrders || summary.releasedReservations) {
      logger.info('Order expiration sweep completed', summary);
    }

    return summary;
  });
