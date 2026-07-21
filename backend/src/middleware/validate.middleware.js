import { validationResult } from 'express-validator';
import { ApiError } from '../utils/api-error.js';

/**
 * Terminates an express-validator chain: collects the failures and rejects the
 * request with 422 before the controller runs.
 *
 * Usage: `router.post('/', validate(createReservationRules), controller)`.
 *
 * @param {import('express-validator').ValidationChain[]} rules
 * @returns {import('express').RequestHandler[]} Rules followed by the check.
 */
export const validate = (rules) => [
  ...rules,
  (req, _res, next) => {
    const result = validationResult(req);
    if (result.isEmpty()) return next();

    const errors = result.array().map((error) => ({
      field: error.path ?? error.param,
      message: error.msg,
      location: error.location,
    }));

    return next(ApiError.unprocessable('Validation failed.', errors));
  },
];
