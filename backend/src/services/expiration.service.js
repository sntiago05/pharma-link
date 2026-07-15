import { pool } from '../config/db.js';

export const expireOrders = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const reservations = await client.query(`UPDATE reservations SET status = 'EXPIRED' WHERE status = 'RESERVED' AND order_id IN (SELECT id FROM medical_orders WHERE expiration_date < CURRENT_DATE) RETURNING id, pharmacy_id`);
    for (const reservation of reservations.rows) {
      const items = await client.query('SELECT medicine_id, quantity FROM reservation_inventory WHERE reservation_id = $1', [reservation.id]);
      for (const item of items.rows) await client.query('UPDATE pharmacy_inventory SET reserved_quantity = reserved_quantity - $1 WHERE pharmacy_id = $2 AND medicine_id = $3', [item.quantity, reservation.pharmacy_id, item.medicine_id]);
    }
    await client.query("UPDATE medical_orders SET status = 'EXPIRED' WHERE expiration_date < CURRENT_DATE AND status <> 'DELIVERED'");
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
};
