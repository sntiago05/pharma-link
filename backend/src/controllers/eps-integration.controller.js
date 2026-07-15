import { pool } from '../config/db.js';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';

export const receiveOrder = async (req, res, next) => {
  const client = await pool.connect();
  const { orderNumber, patientDocument, patientFullName, patientEmail, patientPhone, issueDate, expirationDate, details } = req.body;
  try {
    if (!orderNumber || !patientDocument || !issueDate || !expirationDate || !Array.isArray(details) || !details.length) {
      return res.status(400).json({ message: 'orderNumber, patientDocument, dates and details are required.' });
    }
    await client.query('BEGIN');
    const patient = await client.query('SELECT id FROM patients WHERE eps_id = $1 AND document = $2', [req.eps.id, patientDocument]);
    if (!patient.rowCount) {
      if (!patientFullName || !patientEmail) { const error = new Error('New patients require patientFullName and patientEmail for enrolment.'); error.statusCode = 422; throw error; }
      const role = await client.query("SELECT id FROM roles WHERE name = 'PATIENT'");
      const user = await client.query('INSERT INTO users (role_id, full_name, email, password) VALUES ($1, $2, $3, $4) RETURNING id', [role.rows[0].id, patientFullName, patientEmail.toLowerCase(), await bcrypt.hash(randomUUID(), 12)]);
      patient.rows.push((await client.query('INSERT INTO patients (user_id, eps_id, document, phone) VALUES ($1, $2, $3, $4) RETURNING id', [user.rows[0].id, req.eps.id, patientDocument, patientPhone || null])).rows[0]);
    }
    const order = await client.query(
      `INSERT INTO medical_orders (patient_id, eps_id, order_number, issue_date, expiration_date, status)
       VALUES ($1, $2, $3, $4, $5, 'PENDING')
       ON CONFLICT (order_number) DO UPDATE SET issue_date = EXCLUDED.issue_date,
         expiration_date = EXCLUDED.expiration_date, status = 'PENDING'
       RETURNING id, order_number, status`,
      [patient.rows[0].id, req.eps.id, orderNumber, issueDate, expirationDate],
    );
    await client.query('DELETE FROM order_details WHERE order_id = $1', [order.rows[0].id]);
    for (const detail of details) {
      if (!detail.medicineCode || !Number.isInteger(detail.quantity) || detail.quantity < 1) { const error = new Error('Every detail requires medicineCode and positive quantity.'); error.statusCode = 400; throw error; }
      const medicine = await client.query('SELECT id FROM medicines WHERE code = $1', [detail.medicineCode]);
      if (!medicine.rowCount) { const error = new Error(`Medicine ${detail.medicineCode} does not exist.`); error.statusCode = 400; throw error; }
      await client.query('INSERT INTO order_details (order_id, medicine_id, quantity) VALUES ($1, $2, $3)', [order.rows[0].id, medicine.rows[0].id, detail.quantity]);
    }
    await client.query('INSERT INTO eps_api_requests (eps_id, order_number, status_code, payload) VALUES ($1, $2, 201, $3)', [req.eps.id, orderNumber, req.body]);
    await client.query('COMMIT');
    return res.status(201).json({ data: order.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    try { await client.query('INSERT INTO eps_api_requests (eps_id, order_number, status_code, payload) VALUES ($1, $2, $3, $4)', [req.eps.id, orderNumber || null, error.statusCode || 500, req.body]); } catch { /* preserve original error */ }
    return next(error);
  } finally { client.release(); }
};
