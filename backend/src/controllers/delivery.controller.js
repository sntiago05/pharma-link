import { pool } from '../config/db.js';

export const confirmDelivery = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const reservation = await client.query(`SELECT * FROM reservations WHERE id = $1 AND status = 'RESERVED' FOR UPDATE`, [req.params.reservationId]);
    if (!reservation.rowCount) { const error = new Error('Active reservation not found.'); error.statusCode = 404; throw error; }
    const row = reservation.rows[0];
    const items = await client.query('SELECT medicine_id, quantity FROM reservation_inventory WHERE reservation_id = $1', [row.id]);
    for (const item of items.rows) {
      await client.query(`UPDATE pharmacy_inventory SET stock_quantity = stock_quantity - $1, reserved_quantity = reserved_quantity - $1, updated_at = CURRENT_TIMESTAMP WHERE pharmacy_id = $2 AND medicine_id = $3`, [item.quantity, row.pharmacy_id, item.medicine_id]);
      await client.query(`INSERT INTO inventory_movements (pharmacy_id, medicine_id, movement_type, quantity, reservation_id) VALUES ($1, $2, 'DELIVERY', $3, $4)`, [row.pharmacy_id, item.medicine_id, -item.quantity, row.id]);
    }
    const result = await client.query(`INSERT INTO deliveries (reservation_id, delivered_at, delivered_by) VALUES ($1, CURRENT_TIMESTAMP, $2) RETURNING *`, [row.id, req.auth.sub]);
    await client.query("UPDATE reservations SET status = 'COMPLETED' WHERE id = $1", [row.id]);
    await client.query("UPDATE medical_orders SET status = 'DELIVERED' WHERE id = $1", [row.order_id]);
    await client.query('COMMIT'); return res.status(201).json({ data: result.rows[0] });
  } catch (error) { await client.query('ROLLBACK'); return next(error); } finally { client.release(); }
};
