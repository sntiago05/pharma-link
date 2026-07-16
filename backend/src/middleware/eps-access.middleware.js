import { query } from '../config/db.js';
import { ROLES } from '../config/roles.js';
import { ApiError } from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js';

/**
 * Ensures an EPS operator only reaches data of the EPS they are assigned to,
 * via the `user_eps` link table. ADMIN bypasses the check.
 *
 * @param {(req: import('express').Request) => Promise<number|undefined>|number|undefined} getEpsId
 * @returns {import('express').RequestHandler}
 */
export const requireEpsAccess = (getEpsId) =>
  asyncHandler(async (req, _res, next) => {
    if (req.auth.role === ROLES.ADMIN) return next();

    const epsId = await getEpsId(req);
    if (epsId == null) throw ApiError.notFound('Record not found.');

    const result = await query(
      'SELECT 1 FROM user_eps WHERE user_id = $1 AND eps_id = $2',
      [req.auth.sub, epsId],
    );
    if (!result.rowCount) throw ApiError.forbidden('You are not assigned to this EPS.');

    return next();
  });
