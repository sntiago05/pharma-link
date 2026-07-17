import { query } from '../config/db.js';
import { logger } from '../config/logger.js';
import { ApiError } from '../utils/api-error.js';
import { sendSuccess } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { withTransaction } from '../utils/transaction.js';

/** Records the inbound request for traceability, outside any transaction. */
const logEpsRequest = async ({ epsId, orderNumber, statusCode, payload }) => {
  try {
    await query(
      `INSERT INTO eps_api_requests (eps_id, order_number, status_code, payload)
       VALUES ($1, $2, $3, $4)`,
      [epsId, orderNumber ?? null, statusCode, payload],
    );
  } catch (error) {
    // Never let the audit trail write mask the real outcome of the request.
    logger.error('Failed to record EPS API request', { epsId, orderNumber, error: error.message });
  }
};

/**
 * Enrols a patient the EPS has sent for the first time.
 *
 * This creates only the patient domain row. It intentionally does not create a
 * user or hidden password; the patient links the row after registering.
 */
const enrolPatient = async ({ epsId, document, fullName, email, phone }, client) => {
  if (!fullName || !email) {
    throw ApiError.unprocessable(
      'New patients require patientFullName and patientEmail for enrolment.',
    );
  }

  const patient = await client.query(
    `INSERT INTO patients (user_id, eps_id, document, phone, full_name, email)
     VALUES (NULL, $1, $2, $3, $4, $5) RETURNING id`,
    [epsId, document, phone ?? null, fullName, email.toLowerCase()],
  );

  return patient.rows[0];
};

/**
 * POST /api/integrations/eps/orders
 *
 * Receives a medical order from an authenticated EPS, enrolling the patient if
 * they are new. Re-sending the same `orderNumber` updates the existing order
 * (upsert), so an EPS retry is safe and does not duplicate orders.
 */
export const receiveOrder = asyncHandler(async (req, res) => {
  const {
    orderNumber, patientDocument, patientFullName, patientEmail, patientPhone,
    issueDate, expirationDate, details,
  } = req.body;

  try {
    const order = await withTransaction(async (client) => {
      const existing = await client.query(
        'SELECT id FROM patients WHERE eps_id = $1 AND document = $2',
        [req.eps.id, patientDocument],
      );

      const patient = existing.rowCount
        ? existing.rows[0]
        : await enrolPatient(
            {
              epsId: req.eps.id,
              document: patientDocument,
              fullName: patientFullName,
              email: patientEmail,
              phone: patientPhone,
            },
            client,
          );

      const upserted = await client.query(
        `INSERT INTO medical_orders (patient_id, eps_id, order_number, issue_date, expiration_date, status)
         VALUES ($1, $2, $3, $4, $5, 'PENDING')
         ON CONFLICT (order_number) DO UPDATE SET
           issue_date = EXCLUDED.issue_date,
           expiration_date = EXCLUDED.expiration_date,
           status = 'PENDING'
         RETURNING id, order_number, status`,
        [patient.id, req.eps.id, orderNumber, issueDate, expirationDate],
      );

      // Details are replaced wholesale so a resend is authoritative rather than
      // additive; an order whose medicines changed must not keep the old lines.
      await client.query('DELETE FROM order_details WHERE order_id = $1', [upserted.rows[0].id]);

      for (const detail of details) {
        const medicine = await client.query(
          'SELECT id FROM medicines WHERE code = $1',
          [detail.medicineCode],
        );
        if (!medicine.rowCount) {
          throw ApiError.badRequest(`Medicine ${detail.medicineCode} does not exist.`);
        }

        await client.query(
          'INSERT INTO order_details (order_id, medicine_id, quantity) VALUES ($1, $2, $3)',
          [upserted.rows[0].id, medicine.rows[0].id, detail.quantity],
        );
      }

      return upserted.rows[0];
    });

    await logEpsRequest({
      epsId: req.eps.id,
      orderNumber,
      statusCode: 201,
      payload: req.body,
    });

    res.locals.auditRecordId = order.id;
    return sendSuccess(res, { status: 201, message: 'Order received.', data: order });
  } catch (error) {
    await logEpsRequest({
      epsId: req.eps.id,
      orderNumber,
      statusCode: error.statusCode || 500,
      payload: req.body,
    });
    throw error;
  }
});
