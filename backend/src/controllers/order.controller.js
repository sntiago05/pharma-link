import { query } from '../config/db.js';
import { ApiError } from '../utils/api-error.js';
import { sendSuccess } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { withTransaction } from '../utils/transaction.js';

/** POST /api/orders — a patient records one of their own orders. */
export const createOrder = asyncHandler(async (req, res) => {
  const { orderNumber, issueDate, expirationDate, details } = req.body;

  const order = await withTransaction(async (client) => {
    const patient = await client.query(
      'SELECT id, eps_id FROM patients WHERE user_id = $1',
      [req.auth.sub],
    );
    if (!patient.rowCount) throw ApiError.notFound('Patient profile not found.');

    const created = await client.query(
      `INSERT INTO medical_orders (patient_id, eps_id, order_number, issue_date, expiration_date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [patient.rows[0].id, patient.rows[0].eps_id, orderNumber, issueDate, expirationDate],
    );

    // Shape and quantity of each detail are already checked by the validator.
    for (const detail of details) {
      await client.query(
        'INSERT INTO order_details (order_id, medicine_id, quantity) VALUES ($1, $2, $3)',
        [created.rows[0].id, detail.medicineId, detail.quantity],
      );
    }

    return created.rows[0];
  });

  res.locals.auditRecordId = order.id;
  return sendSuccess(res, { status: 201, message: 'Order created.', data: order });
});

/**
 * GET /api/orders/me — the caller's orders, newest first.
 *
 * Every previously returned column is preserved; `items`, `eps_name` and
 * `active_reservation` are added so a list can be rendered without one extra
 * request per order.
 */
export const listMyOrders = asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT medical_orders.*,
            eps.name AS eps_name,
            medical_orders.expiration_date < CURRENT_DATE AS is_expired,
            COALESCE(
              JSON_AGG(
                JSON_BUILD_OBJECT('medicineId', medicines.id, 'code', medicines.code,
                                  'name', medicines.name, 'presentation', medicines.presentation,
                                  'quantity', order_details.quantity)
                ORDER BY medicines.name
              ) FILTER (WHERE medicines.id IS NOT NULL),
              '[]'
            ) AS items,
            (
              SELECT JSON_BUILD_OBJECT(
                       'id', reservations.id,
                       'pharmacyId', reservations.pharmacy_id,
                       'pharmacyName', pharmacies.name,
                       'reservationDate', reservations.reservation_date,
                       'startTime', reservations.start_time,
                       'status', reservations.status
                     )
              FROM reservations
              INNER JOIN pharmacies ON pharmacies.id = reservations.pharmacy_id
              WHERE reservations.order_id = medical_orders.id AND reservations.status = 'RESERVED'
              LIMIT 1
            ) AS active_reservation
     FROM medical_orders
     INNER JOIN patients ON patients.id = medical_orders.patient_id
     LEFT JOIN eps ON eps.id = medical_orders.eps_id
     LEFT JOIN order_details ON order_details.order_id = medical_orders.id
     LEFT JOIN medicines ON medicines.id = order_details.medicine_id
     WHERE patients.user_id = $1
     GROUP BY medical_orders.id, eps.name
     ORDER BY medical_orders.created_at DESC`,
    [req.auth.sub],
  );

  return sendSuccess(res, { message: 'Orders retrieved.', data: result.rows });
});
