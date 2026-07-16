import { query } from '../config/db.js';
import { ApiError } from '../utils/api-error.js';
import { sendSuccess } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';

/** POST /api/patients/me — creates the caller's patient profile. */
export const createPatientProfile = asyncHandler(async (req, res) => {
  const { epsId, document, phone } = req.body;

  const result = await query(
    `INSERT INTO patients (user_id, eps_id, document, phone) VALUES ($1, $2, $3, $4)
     RETURNING id, user_id, eps_id, document, phone`,
    [req.auth.sub, epsId, document, phone || null],
  );

  res.locals.auditRecordId = result.rows[0].id;
  return sendSuccess(res, {
    status: 201,
    message: 'Patient profile created.',
    data: result.rows[0],
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
