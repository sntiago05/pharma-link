import { pool, query } from '../config/db.js';

export const createReservation = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { orderId, pharmacyId, reservationDate, startTime, endTime } = req.body;
    if (![orderId, pharmacyId, reservationDate, startTime, endTime].every(Boolean)) return res.status(400).json({ message: 'Reservation fields are required.' });
    if (reservationDate < new Date().toISOString().slice(0, 10)) return res.status(400).json({ message: 'Reservations cannot be created in the past.' });
    await client.query('BEGIN');
    const order = await client.query(
      `SELECT medical_orders.id, medical_orders.eps_id FROM medical_orders
       INNER JOIN patients ON patients.id = medical_orders.patient_id
       WHERE medical_orders.id = $1 AND patients.user_id = $2 AND medical_orders.status = 'PENDING'
       AND medical_orders.expiration_date >= CURRENT_DATE FOR UPDATE`, [orderId, req.auth.sub],
    );
    if (!order.rowCount) { const e = new Error('Eligible order not found.'); e.statusCode = 404; throw e; }
    const association = await client.query('SELECT 1 FROM eps_pharmacies WHERE eps_id = $1 AND pharmacy_id = $2 AND active = TRUE', [order.rows[0].eps_id, pharmacyId]);
    if (!association.rowCount) { const e = new Error('Pharmacy is not associated with the order EPS.'); e.statusCode = 400; throw e; }
    await client.query('SELECT id FROM pharmacies WHERE id = $1 FOR UPDATE', [pharmacyId]);
    const hours = await client.query('SELECT * FROM working_hours WHERE pharmacy_id = $1', [pharmacyId]);
    if (!hours.rowCount) { const e = new Error('Pharmacy working hours are not configured.'); e.statusCode = 400; throw e; }
    const validTime = await client.query('SELECT $1::time >= $2::time AND $3::time <= $4::time AS valid', [startTime, hours.rows[0].opening_time, endTime, hours.rows[0].closing_time]);
    if (!validTime.rows[0].valid) { const e = new Error('Reservation is outside working hours.'); e.statusCode = 400; throw e; }
    const capacity = await client.query(`SELECT COUNT(*)::int AS count FROM reservations WHERE pharmacy_id = $1 AND reservation_date = $2 AND start_time = $3 AND status = 'RESERVED'`, [pharmacyId, reservationDate, startTime]);
    if (capacity.rows[0].count >= hours.rows[0].capacity_per_slot) { const e = new Error('No remaining capacity for this time slot.'); e.statusCode = 409; throw e; }
    const result = await client.query(`INSERT INTO reservations (order_id, pharmacy_id, reservation_date, start_time, end_time) VALUES ($1, $2, $3, $4, $5) RETURNING *`, [orderId, pharmacyId, reservationDate, startTime, endTime]);
    const details = await client.query('SELECT medicine_id, quantity FROM order_details WHERE order_id = $1', [orderId]);
    for (const detail of details.rows) {
      const inventory = await client.query(`UPDATE pharmacy_inventory SET reserved_quantity = reserved_quantity + $1, updated_at = CURRENT_TIMESTAMP
        WHERE pharmacy_id = $2 AND medicine_id = $3 AND stock_quantity - reserved_quantity >= $1 RETURNING *`, [detail.quantity, pharmacyId, detail.medicine_id]);
      if (!inventory.rowCount) { const e = new Error('Insufficient pharmacy inventory.'); e.statusCode = 409; throw e; }
      await client.query('INSERT INTO reservation_inventory (reservation_id, medicine_id, quantity) VALUES ($1, $2, $3)', [result.rows[0].id, detail.medicine_id, detail.quantity]);
      await client.query(`INSERT INTO inventory_movements (pharmacy_id, medicine_id, movement_type, quantity, reservation_id)
        VALUES ($1, $2, 'RESERVATION', $3, $4)`, [pharmacyId, detail.medicine_id, -detail.quantity, result.rows[0].id]);
    }
    await client.query("UPDATE medical_orders SET status = 'RESERVED' WHERE id = $1", [orderId]);
    await client.query('COMMIT'); res.status(201).json({ data: result.rows[0] });
  } catch (error) { await client.query('ROLLBACK'); next(error); } finally { client.release(); }
};

export const listPharmacyReservations = async (req, res, next) => {
  try { res.json({ data: (await query('SELECT * FROM reservations WHERE pharmacy_id = $1 ORDER BY reservation_date, start_time', [req.params.pharmacyId])).rows }); } catch (error) { next(error); }
};

export const cancelReservation = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE reservations SET status = 'CANCELLED' WHERE id = $1 AND status = 'RESERVED' AND order_id IN
      (SELECT medical_orders.id FROM medical_orders INNER JOIN patients ON patients.id = medical_orders.patient_id WHERE patients.user_id = $2 AND medical_orders.cancellation_count < 3)
       RETURNING order_id`, [req.params.id, req.auth.sub],
    );
    if (!result.rowCount) { const error = new Error('Active reservation not found.'); error.statusCode = 404; throw error; }
    const reservation = await client.query('SELECT pharmacy_id FROM reservations WHERE id = $1', [req.params.id]);
    const inventory = await client.query('SELECT medicine_id, quantity FROM reservation_inventory WHERE reservation_id = $1', [req.params.id]);
    for (const item of inventory.rows) {
      await client.query('UPDATE pharmacy_inventory SET reserved_quantity = reserved_quantity - $1, updated_at = CURRENT_TIMESTAMP WHERE pharmacy_id = $2 AND medicine_id = $3', [item.quantity, reservation.rows[0].pharmacy_id, item.medicine_id]);
      await client.query(`INSERT INTO inventory_movements (pharmacy_id, medicine_id, movement_type, quantity, reservation_id) VALUES ($1, $2, 'RELEASE', $3, $4)`, [reservation.rows[0].pharmacy_id, item.medicine_id, item.quantity, req.params.id]);
    }
    await client.query("UPDATE medical_orders SET status = 'PENDING', cancellation_count = cancellation_count + 1 WHERE id = $1", [result.rows[0].order_id]);
    await client.query('COMMIT'); return res.json({ message: 'Reservation cancelled.' });
  } catch (error) { await client.query('ROLLBACK'); return next(error); } finally { client.release(); }
};

export const availableSlots = async (req, res, next) => {
  try {
    const { pharmacyId } = req.params; const { date } = req.query;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return res.status(400).json({ message: 'A date (YYYY-MM-DD) is required.' });
    const hours = await query('SELECT opening_time, closing_time, slot_duration, capacity_per_slot FROM working_hours WHERE pharmacy_id = $1', [pharmacyId]);
    if (!hours.rowCount) return res.status(404).json({ message: 'Working hours not found.' });
    const occupied = await query(`SELECT start_time, COUNT(*)::int AS count FROM reservations WHERE pharmacy_id = $1 AND reservation_date = $2 AND status = 'RESERVED' GROUP BY start_time`, [pharmacyId, date]);
    const used = new Map(occupied.rows.map((row) => [row.start_time.slice(0, 5), row.count]));
    const h = hours.rows[0]; const toMinutes = (time) => { const [hour, minute] = time.split(':').map(Number); return hour * 60 + minute; };
    const slots = []; const end = toMinutes(h.closing_time);
    for (let time = toMinutes(h.opening_time); time + h.slot_duration <= end; time += h.slot_duration) {
      const label = `${String(Math.floor(time / 60)).padStart(2, '0')}:${String(time % 60).padStart(2, '0')}`;
      const available = h.capacity_per_slot - (used.get(label) || 0);
      if (available > 0) slots.push({ startTime: label, endTime: `${String(Math.floor((time + h.slot_duration) / 60)).padStart(2, '0')}:${String((time + h.slot_duration) % 60).padStart(2, '0')}`, availableCapacity: available });
    }
    return res.json({ data: slots });
  } catch (error) { return next(error); }
};

export const rescheduleReservation = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { reservationDate, startTime, endTime } = req.body;
    if (![reservationDate, startTime, endTime].every(Boolean)) return res.status(400).json({ message: 'New date and times are required.' });
    if (reservationDate < new Date().toISOString().slice(0, 10)) return res.status(400).json({ message: 'Reservations cannot be moved to the past.' });
    await client.query('BEGIN');
    const reservation = await client.query(`SELECT reservations.* FROM reservations INNER JOIN medical_orders ON medical_orders.id = reservations.order_id INNER JOIN patients ON patients.id = medical_orders.patient_id WHERE reservations.id = $1 AND patients.user_id = $2 AND reservations.status = 'RESERVED' AND medical_orders.reschedule_count < 3 FOR UPDATE`, [req.params.id, req.auth.sub]);
    if (!reservation.rowCount) { const error = new Error('Active reservation not found.'); error.statusCode = 404; throw error; }
    const row = reservation.rows[0]; await client.query('SELECT id FROM pharmacies WHERE id = $1 FOR UPDATE', [row.pharmacy_id]);
    const hours = await client.query('SELECT * FROM working_hours WHERE pharmacy_id = $1', [row.pharmacy_id]);
    const valid = hours.rowCount && (await client.query('SELECT $1::time >= $2::time AND $3::time <= $4::time AS valid', [startTime, hours.rows[0].opening_time, endTime, hours.rows[0].closing_time])).rows[0].valid;
    if (!valid) { const error = new Error('Reservation is outside working hours.'); error.statusCode = 400; throw error; }
    const count = await client.query(`SELECT COUNT(*)::int AS count FROM reservations WHERE pharmacy_id = $1 AND reservation_date = $2 AND start_time = $3 AND status = 'RESERVED' AND id <> $4`, [row.pharmacy_id, reservationDate, startTime, row.id]);
    if (count.rows[0].count >= hours.rows[0].capacity_per_slot) { const error = new Error('No remaining capacity for this time slot.'); error.statusCode = 409; throw error; }
    const result = await client.query('UPDATE reservations SET reservation_date = $1, start_time = $2, end_time = $3 WHERE id = $4 RETURNING *', [reservationDate, startTime, endTime, row.id]);
    await client.query('UPDATE medical_orders SET reschedule_count = reschedule_count + 1 WHERE id = $1', [row.order_id]);
    await client.query('COMMIT'); return res.json({ data: result.rows[0] });
  } catch (error) { await client.query('ROLLBACK'); return next(error); } finally { client.release(); }
};

export const markNoShow = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const reservation = await client.query(`UPDATE reservations SET status = 'NO_SHOW' WHERE id = $1 AND status = 'RESERVED' RETURNING order_id, pharmacy_id, id`, [req.params.id]);
    if (!reservation.rowCount) { const error = new Error('Active reservation not found.'); error.statusCode = 404; throw error; }
    const row = reservation.rows[0]; const items = await client.query('SELECT medicine_id, quantity FROM reservation_inventory WHERE reservation_id = $1', [row.id]);
    for (const item of items.rows) {
      await client.query('UPDATE pharmacy_inventory SET reserved_quantity = reserved_quantity - $1 WHERE pharmacy_id = $2 AND medicine_id = $3', [item.quantity, row.pharmacy_id, item.medicine_id]);
      await client.query("INSERT INTO inventory_movements (pharmacy_id, medicine_id, movement_type, quantity, reservation_id) VALUES ($1, $2, 'RELEASE', $3, $4)", [row.pharmacy_id, item.medicine_id, item.quantity, row.id]);
    }
    await client.query("UPDATE medical_orders SET status = 'PENDING' WHERE id = $1", [row.order_id]); await client.query('COMMIT');
    return res.json({ message: 'Reservation marked as no-show.' });
  } catch (error) { await client.query('ROLLBACK'); return next(error); } finally { client.release(); }
};
