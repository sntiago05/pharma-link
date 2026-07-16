import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { query } from '../config/db.js';
import { ROLES } from '../config/roles.js';
import { ApiError } from '../utils/api-error.js';
import { withTransaction } from '../utils/transaction.js';

/**
 * Orders issued by an EPS operator through the web UI.
 *
 * This is the same domain action as the `X-API-Key` webhook in
 * eps-integration.controller.js, but reached with a JWT by a human. The webhook
 * is machine-to-machine and identifies the EPS by its key; here the EPS comes
 * from the operator's `user_eps` link, which the route enforces.
 */

/**
 * Finds an EPS's patient by document, enrolling them if unknown.
 *
 * An EPS legitimately knows patients PharmaLink has never seen, so the operator
 * can create the account inline. The password is random and unusable: the
 * patient must set their own credentials through the normal flow.
 */
const resolvePatient = async ({ epsId, document, fullName, email, phone }, client) => {
  const existing = await client.query(
    'SELECT id FROM patients WHERE eps_id = $1 AND document = $2',
    [epsId, document],
  );
  if (existing.rowCount) return existing.rows[0];

  if (!fullName || !email) {
    throw ApiError.unprocessable(
      'This document is not enrolled yet. Provide patientFullName and patientEmail to create it.',
      [{ field: 'patientDocument', message: 'Unknown patient for this EPS.' }],
    );
  }

  const role = await client.query('SELECT id FROM roles WHERE name = $1', [ROLES.PATIENT]);
  const user = await client.query(
    'INSERT INTO users (role_id, full_name, email, password) VALUES ($1, $2, $3, $4) RETURNING id',
    [role.rows[0].id, fullName, email.toLowerCase(), await bcrypt.hash(randomUUID(), 12)],
  );
  const patient = await client.query(
    'INSERT INTO patients (user_id, eps_id, document, phone) VALUES ($1, $2, $3, $4) RETURNING id',
    [user.rows[0].id, epsId, document, phone ?? null],
  );
  return patient.rows[0];
};

/**
 * Creates a medical order on behalf of an EPS.
 *
 * @param {object} input
 * @param {number} input.epsId Taken from the operator's link, never the body.
 * @returns {Promise<object>} The created order with its details.
 */
export const createEpsOrder = async ({
  epsId, orderNumber, patientDocument, patientFullName, patientEmail, patientPhone,
  issueDate, expirationDate, details,
}) =>
  withTransaction(async (client) => {
    const patient = await resolvePatient(
      {
        epsId,
        document: patientDocument,
        fullName: patientFullName,
        email: patientEmail,
        phone: patientPhone,
      },
      client,
    );

    const duplicate = await client.query(
      'SELECT id FROM medical_orders WHERE order_number = $1',
      [orderNumber],
    );
    if (duplicate.rowCount) {
      throw ApiError.conflict(`Order ${orderNumber} already exists.`);
    }

    const order = await client.query(
      `INSERT INTO medical_orders (patient_id, eps_id, order_number, issue_date, expiration_date, status)
       VALUES ($1, $2, $3, $4, $5, 'PENDING') RETURNING *`,
      [patient.id, epsId, orderNumber, issueDate, expirationDate],
    );

    for (const detail of details) {
      const medicine = await client.query('SELECT id FROM medicines WHERE id = $1', [detail.medicineId]);
      if (!medicine.rowCount) {
        throw ApiError.badRequest(`Medicine ${detail.medicineId} does not exist.`);
      }
      await client.query(
        'INSERT INTO order_details (order_id, medicine_id, quantity) VALUES ($1, $2, $3)',
        [order.rows[0].id, detail.medicineId, detail.quantity],
      );
    }

    return order.rows[0];
  });

/** Lists an EPS's orders with patient and medicine context. */
export const listEpsOrders = async ({ epsId, status, search, limit = 50, offset = 0 }) => {
  const conditions = ['medical_orders.eps_id = $1'];
  const params = [epsId];

  if (status) { params.push(status); conditions.push(`medical_orders.status = $${params.length}`); }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(medical_orders.order_number ILIKE $${params.length}
                      OR patients.document ILIKE $${params.length}
                      OR users.full_name ILIKE $${params.length})`);
  }

  params.push(limit, offset);
  const result = await query(
    `SELECT medical_orders.*,
            users.full_name AS patient_name,
            patients.document AS patient_document,
            COALESCE(
              JSON_AGG(
                JSON_BUILD_OBJECT('medicineId', medicines.id, 'code', medicines.code,
                                  'name', medicines.name, 'quantity', order_details.quantity)
                ORDER BY medicines.name
              ) FILTER (WHERE medicines.id IS NOT NULL),
              '[]'
            ) AS items
     FROM medical_orders
     INNER JOIN patients ON patients.id = medical_orders.patient_id
     INNER JOIN users ON users.id = patients.user_id
     LEFT JOIN order_details ON order_details.order_id = medical_orders.id
     LEFT JOIN medicines ON medicines.id = order_details.medicine_id
     WHERE ${conditions.join(' AND ')}
     GROUP BY medical_orders.id, users.full_name, patients.document
     ORDER BY medical_orders.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  return result.rows;
};
