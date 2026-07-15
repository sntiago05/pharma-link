import { pool, query } from '../config/db.js';

export const createOrder = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { orderNumber, issueDate, expirationDate, details } = req.body;
    if (!orderNumber || !issueDate || !expirationDate || !Array.isArray(details) || !details.length) {
      return res.status(400).json({ message: 'orderNumber, dates and at least one detail are required.' });
    }
    await client.query('BEGIN');
    const patient = await client.query('SELECT id, eps_id FROM patients WHERE user_id = $1', [req.auth.sub]);
    if (!patient.rowCount) { const e = new Error('Patient profile not found.'); e.statusCode = 404; throw e; }
    const order = await client.query(
      `INSERT INTO medical_orders (patient_id, eps_id, order_number, issue_date, expiration_date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [patient.rows[0].id, patient.rows[0].eps_id, orderNumber, issueDate, expirationDate],
    );
    for (const detail of details) {
      if (!Number.isInteger(detail.medicineId) || !Number.isInteger(detail.quantity) || detail.quantity < 1) {
        const e = new Error('Each detail needs a valid medicineId and positive quantity.'); e.statusCode = 400; throw e;
      }
      await client.query('INSERT INTO order_details (order_id, medicine_id, quantity) VALUES ($1, $2, $3)', [order.rows[0].id, detail.medicineId, detail.quantity]);
    }
    await client.query('COMMIT');
    res.status(201).json({ data: order.rows[0] });
  } catch (error) { await client.query('ROLLBACK'); next(error); } finally { client.release(); }
};

export const listMyOrders = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT medical_orders.* FROM medical_orders INNER JOIN patients ON patients.id = medical_orders.patient_id
       WHERE patients.user_id = $1 ORDER BY medical_orders.created_at DESC`, [req.auth.sub],
    );
    res.json({ data: result.rows });
  } catch (error) { next(error); }
};
