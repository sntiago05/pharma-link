import { query } from '../config/db.js';
import { ROLES } from '../config/roles.js';
import { ApiError } from '../utils/api-error.js';

/**
 * Session context for the authenticated user.
 *
 * The JWT carries only `sub` and `role`, which is not enough for a client to
 * know *which* pharmacy or EPS an operator belongs to — and every scoped
 * endpoint needs that id in its path. Rather than widen the token (a JWT cannot
 * be revoked when an assignment changes), the client asks for it here after
 * login and the answer always reflects the current database state.
 *
 * @param {number} userId
 * @returns {Promise<object>} User plus the ids relevant to their role.
 */
export const getSessionContext = async (userId) => {
  const result = await query(
    `SELECT users.id, users.full_name, users.email, users.active, roles.name AS role
     FROM users
     INNER JOIN roles ON roles.id = users.role_id
     WHERE users.id = $1`,
    [userId],
  );

  const user = result.rows[0];
  // The token verified, but the account may have been deleted or disabled since.
  if (!user || !user.active) throw ApiError.unauthorized('Account is no longer active.');

  const context = {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    role: user.role,
  };

  if (user.role === ROLES.PATIENT) {
    const patient = await query(
      `SELECT patients.id, patients.eps_id, patients.document, patients.phone, eps.name AS eps_name
       FROM patients
       LEFT JOIN eps ON eps.id = patients.eps_id
       WHERE patients.user_id = $1`,
      [userId],
    );
    // Null when the account exists but the profile step was never completed;
    // the UI uses this to send the user to the profile form first.
    context.patient = patient.rows[0]
      ? {
          id: patient.rows[0].id,
          epsId: patient.rows[0].eps_id,
          epsName: patient.rows[0].eps_name,
          document: patient.rows[0].document,
          phone: patient.rows[0].phone,
        }
      : null;
  }

  if (user.role === ROLES.PHARMACY) {
    const pharmacy = await query(
      `SELECT pharmacies.id, pharmacies.name, pharmacies.city
       FROM user_pharmacies
       INNER JOIN pharmacies ON pharmacies.id = user_pharmacies.pharmacy_id
       WHERE user_pharmacies.user_id = $1`,
      [userId],
    );
    context.pharmacy = pharmacy.rows[0] ?? null;
  }

  if (user.role === ROLES.EPS) {
    const eps = await query(
      `SELECT eps.id, eps.name, eps.nit
       FROM user_eps
       INNER JOIN eps ON eps.id = user_eps.eps_id
       WHERE user_eps.user_id = $1`,
      [userId],
    );
    context.eps = eps.rows[0] ?? null;
  }

  return context;
};
