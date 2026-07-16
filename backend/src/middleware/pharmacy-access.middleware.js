import { query } from '../config/db.js';
import { ROLES } from '../config/roles.js';
import { ApiError } from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js';

/**
 * Ensures the caller is assigned to the pharmacy the request targets, closing
 * cross-tenant access between pharmacies. ADMIN bypasses the check.
 *
 * @param {(req: import('express').Request) => Promise<number|undefined>|number|undefined} getPharmacyId
 *   Resolves the pharmacy id for the request (from params, body, or a lookup).
 * @returns {import('express').RequestHandler}
 */
export const requirePharmacyAccess = (getPharmacyId) =>
  asyncHandler(async (req, _res, next) => {
    if (req.auth.role === ROLES.ADMIN) return next();

    const pharmacyId = await getPharmacyId(req);
    // A missing id means the target does not exist; reporting 403 here would let
    // a caller distinguish "not yours" from "not found" and probe for ids.
    if (pharmacyId == null) throw ApiError.notFound('Record not found.');

    const result = await query(
      'SELECT 1 FROM user_pharmacies WHERE user_id = $1 AND pharmacy_id = $2',
      [req.auth.sub, pharmacyId],
    );
    if (!result.rowCount) throw ApiError.forbidden('You are not assigned to this pharmacy.');

    return next();
  });
