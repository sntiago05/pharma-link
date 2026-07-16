import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/api-error.js';

/**
 * Verifies the bearer token and populates `req.auth` with the JWT payload
 * (`sub` = user id, `role` = role name).
 */
export const authenticate = (req, _res, next) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return next(ApiError.unauthorized('Authentication token required.'));

  try {
    req.auth = jwt.verify(token, env.jwt.secret);
    return next();
  } catch {
    return next(ApiError.unauthorized('Invalid or expired token.'));
  }
};

/**
 * Restricts a route to the given roles.
 *
 * @param {string[]|string} roles Allowed role names (see `config/roles.js`).
 * @returns {import('express').RequestHandler}
 * @example router.get('/', authorize([ROLES.ADMIN, ROLES.EPS]), handler)
 */
export const authorize = (roles) => {
  const allowed = new Set(Array.isArray(roles) ? roles : [roles]);
  return (req, _res, next) =>
    allowed.has(req.auth?.role) ? next() : next(ApiError.forbidden('Insufficient permissions.'));
};

/**
 * Single-role shorthand for {@link authorize}.
 * @example router.post('/', requireRole(ROLES.ADMIN), handler)
 */
export const requireRole = (role) => authorize([role]);

/**
 * Variadic form kept so existing routes keep working unchanged.
 * @deprecated Prefer {@link authorize} with an array.
 */
export const allowRoles = (...roles) => authorize(roles);
