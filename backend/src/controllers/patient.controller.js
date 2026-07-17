import { query } from '../config/db.js';
import { ApiError } from '../utils/api-error.js';
import { sendSuccess } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { withTransaction } from '../utils/transaction.js';

/** POST /api/patients/me — creates the caller's patient profile. */
export const createPatientProfile = asyncHandler(async (req, res) => {
  const { epsId, document, phone } = req.body;

  const patient = await withTransaction(async (client) => {
    const existingForUser = await client.query(
      'SELECT id FROM patients WHERE user_id = $1',
      [req.auth.sub],
    );
    if (existingForUser.rowCount) throw ApiError.conflict('Patient profile already exists.');

    const preEnrolled = await client.query(
      `SELECT id, user_id FROM patients
       WHERE eps_id = $1 AND document = $2
       FOR UPDATE`,
      [epsId, document],
    );

    if (preEnrolled.rowCount) {
      if (preEnrolled.rows[0].user_id) {
        throw ApiError.conflict('This document is already linked to a patient account.');
      }

      const linked = await client.query(
        `UPDATE patients
         SET user_id = $1, phone = COALESCE($2, phone)
         WHERE id = $3
         RETURNING id, user_id, eps_id, document, phone`,
        [req.auth.sub, phone || null, preEnrolled.rows[0].id],
      );
      return linked.rows[0];
    }

    const created = await client.query(
      `INSERT INTO patients (user_id, eps_id, document, phone) VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, eps_id, document, phone`,
      [req.auth.sub, epsId, document, phone || null],
    );
    return created.rows[0];
  });

  res.locals.auditRecordId = patient.id;
  return sendSuccess(res, {
    status: 201,
    message: 'Patient profile created.',
    data: patient,
  });
});

/** GET /api/patients/me */
export const getMyPatientProfile = asyncHandler(async (req, res) => {
  const result = await query(
    'SELECT id, user_id, eps_id, document, phone FROM patients WHERE user_id = $1',
    [req.auth.sub],
  );
  if (!result.rowCount) throw ApiError.notFound('Patient profile not found.');

  return sendSuccess(res, { message: 'Patient profile retrieved.', data: result.rows[0] });
});
