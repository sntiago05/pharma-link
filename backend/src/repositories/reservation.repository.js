import { query } from '../config/db.js';

/**
 * Loads an order owned by a user and locks it for the transaction.
 *
 * `FOR UPDATE OF medical_orders` locks only the order row: a bare `FOR UPDATE`
 * would also try to lock the joined `patients` row, serialising unrelated
 * requests from the same patient for no benefit.
 *
 * Returns the row regardless of status/expiry so the service can explain exactly
 * why it is not reservable, instead of collapsing every cause into one 404.
 */
export const findOrderForUpdate = async ({ orderId, userId }, client) => {
  const result = await client.query(
    `SELECT medical_orders.id,
            medical_orders.eps_id,
            medical_orders.status,
            medical_orders.expiration_date,
            medical_orders.order_number,
            medical_orders.cancellation_count,
            medical_orders.reschedule_count,
            medical_orders.expiration_date < CURRENT_DATE AS is_expired
     FROM medical_orders
     INNER JOIN patients ON patients.id = medical_orders.patient_id
     WHERE medical_orders.id = $1 AND patients.user_id = $2
     FOR UPDATE OF medical_orders`,
    [orderId, userId],
  );
  return result.rows[0];
};

/** True when the pharmacy is contracted by the EPS that issued the order. */
export const isPharmacyLinkedToEps = async ({ epsId, pharmacyId }, client) => {
  const result = await client.query(
    'SELECT 1 FROM eps_pharmacies WHERE eps_id = $1 AND pharmacy_id = $2 AND active = TRUE',
    [epsId, pharmacyId],
  );
  return result.rowCount > 0;
};

/**
 * Locks the pharmacy row.
 *
 * Serialises all reservation writes for one pharmacy, which is what makes the
 * slot capacity check safe: without it, two concurrent requests could both read
 * a count below capacity and both insert.
 */
export const lockPharmacy = async (pharmacyId, client) => {
  await client.query('SELECT id FROM pharmacies WHERE id = $1 FOR UPDATE', [pharmacyId]);
};

/** Line items of an order. */
export const findOrderDetails = async (orderId, client) => {
  const runner = client ? client.query.bind(client) : query;
  const result = await runner(
    'SELECT medicine_id, quantity FROM order_details WHERE order_id = $1',
    [orderId],
  );
  return result.rows;
};

export const insertReservation = async (
  { orderId, pharmacyId, reservationDate, startTime, endTime },
  client,
) => {
  const result = await client.query(
    `INSERT INTO reservations (order_id, pharmacy_id, reservation_date, start_time, end_time)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [orderId, pharmacyId, reservationDate, startTime, endTime],
  );
  return result.rows[0];
};

/** Loads a reservation owned by a user and locks it. */
export const findReservationForUpdate = async ({ reservationId, userId }, client) => {
  const result = await client.query(
    `SELECT reservations.*,
            medical_orders.expiration_date,
            medical_orders.reschedule_count,
            medical_orders.cancellation_count,
            medical_orders.order_number,
            medical_orders.status AS order_status
     FROM reservations
     INNER JOIN medical_orders ON medical_orders.id = reservations.order_id
     INNER JOIN patients ON patients.id = medical_orders.patient_id
     WHERE reservations.id = $1 AND patients.user_id = $2
     FOR UPDATE OF reservations, medical_orders`,
    [reservationId, userId],
  );
  return result.rows[0];
};

/** Loads any reservation by id and locks it (staff paths: delivery, no-show). */
export const findReservationByIdForUpdate = async (reservationId, client) => {
  const result = await client.query(
    `SELECT reservations.*, medical_orders.order_number
     FROM reservations
     INNER JOIN medical_orders ON medical_orders.id = reservations.order_id
     WHERE reservations.id = $1
     FOR UPDATE OF reservations`,
    [reservationId],
  );
  return result.rows[0];
};

export const updateReservationStatus = async ({ reservationId, status }, client) => {
  const result = await client.query(
    'UPDATE reservations SET status = $1 WHERE id = $2 RETURNING *',
    [status, reservationId],
  );
  return result.rows[0];
};

export const moveReservation = async (
  { reservationId, reservationDate, startTime, endTime },
  client,
) => {
  const result = await client.query(
    `UPDATE reservations SET reservation_date = $1, start_time = $2, end_time = $3
     WHERE id = $4 RETURNING *`,
    [reservationDate, startTime, endTime, reservationId],
  );
  return result.rows[0];
};

export const updateOrderStatus = async ({ orderId, status }, client) => {
  await client.query('UPDATE medical_orders SET status = $1 WHERE id = $2', [status, orderId]);
};

export const incrementCancellationCount = async (orderId, client) => {
  await client.query(
    `UPDATE medical_orders SET status = 'PENDING', cancellation_count = cancellation_count + 1
     WHERE id = $1`,
    [orderId],
  );
};

export const incrementRescheduleCount = async (orderId, client) => {
  await client.query(
    'UPDATE medical_orders SET reschedule_count = reschedule_count + 1 WHERE id = $1',
    [orderId],
  );
};

/**
 * A patient's own reservations, with pharmacy and order context.
 *
 * Includes the medicines held by each reservation so the list can be rendered in
 * one request instead of one lookup per row.
 */
export const findByPatientUser = async ({ userId, status, limit = 50, offset = 0 }) => {
  const conditions = ['patients.user_id = $1'];
  const params = [userId];

  if (status) { params.push(status); conditions.push(`reservations.status = $${params.length}`); }

  params.push(limit, offset);
  const result = await query(
    `SELECT reservations.*,
            medical_orders.order_number,
            medical_orders.expiration_date,
            medical_orders.cancellation_count,
            medical_orders.reschedule_count,
            pharmacies.name AS pharmacy_name,
            pharmacies.address AS pharmacy_address,
            pharmacies.city AS pharmacy_city,
            COALESCE(
              JSON_AGG(
                JSON_BUILD_OBJECT('medicineId', medicines.id, 'code', medicines.code,
                                  'name', medicines.name, 'quantity', reservation_inventory.quantity)
                ORDER BY medicines.name
              ) FILTER (WHERE medicines.id IS NOT NULL),
              '[]'
            ) AS items
     FROM reservations
     INNER JOIN medical_orders ON medical_orders.id = reservations.order_id
     INNER JOIN patients ON patients.id = medical_orders.patient_id
     INNER JOIN pharmacies ON pharmacies.id = reservations.pharmacy_id
     LEFT JOIN reservation_inventory ON reservation_inventory.reservation_id = reservations.id
     LEFT JOIN medicines ON medicines.id = reservation_inventory.medicine_id
     WHERE ${conditions.join(' AND ')}
     GROUP BY reservations.id, medical_orders.order_number, medical_orders.expiration_date,
              medical_orders.cancellation_count, medical_orders.reschedule_count,
              pharmacies.name, pharmacies.address, pharmacies.city
     ORDER BY reservations.reservation_date DESC, reservations.start_time DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  return result.rows;
};

/** Reservations for a pharmacy, with patient and order context. */
export const findByPharmacy = async ({ pharmacyId, status, date, limit = 50, offset = 0 }) => {
  const conditions = ['reservations.pharmacy_id = $1'];
  const params = [pharmacyId];

  if (status) { params.push(status); conditions.push(`reservations.status = $${params.length}`); }
  if (date) { params.push(date); conditions.push(`reservations.reservation_date = $${params.length}`); }

  params.push(limit, offset);
  const result = await query(
    `SELECT reservations.*,
            medical_orders.order_number,
            users.full_name AS patient_name,
            patients.document AS patient_document
     FROM reservations
     INNER JOIN medical_orders ON medical_orders.id = reservations.order_id
     INNER JOIN patients ON patients.id = medical_orders.patient_id
     INNER JOIN users ON users.id = patients.user_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY reservations.reservation_date, reservations.start_time
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  return result.rows;
};
