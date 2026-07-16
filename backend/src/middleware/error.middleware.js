import { logger } from '../config/logger.js';
import { isProduction } from '../config/env.js';
import { ApiError } from '../utils/api-error.js';
import { sendError } from '../utils/api-response.js';

/**
 * Maps PostgreSQL SQLSTATE codes to client-safe responses.
 * Keys are quoted because pg reports `code` as a string and some codes are not
 * valid identifiers (`22P02`).
 */
const PG_ERRORS = {
  '23505': { status: 409, message: 'A record with that value already exists.' },
  '23503': { status: 400, message: 'A related record does not exist.' },
  '23514': { status: 400, message: 'A value violates a database constraint.' },
  '22P02': { status: 400, message: 'Invalid input syntax for one of the parameters.' },
  '22007': { status: 400, message: 'Invalid date or time format.' },
};

/** 404 handler for unmatched routes. Must be registered after all routers. */
export const notFoundHandler = (req, _res, next) =>
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));

/**
 * Global error handler. Produces the consistent envelope
 * `{ success: false, message, errors: [] }` for every failure.
 *
 * Only ApiError messages are echoed back. Unexpected errors are logged with
 * their stack but answered with a generic message, so internals (SQL text,
 * file paths, driver details) never reach the client.
 */
// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity (4 args).
export const errorHandler = (error, req, res, _next) => {
  const pg = PG_ERRORS[error.code];

  let status = 500;
  let message = 'Internal server error';
  let errors = [];

  if (error instanceof ApiError || error.isOperational) {
    status = error.statusCode || 500;
    message = error.message;
    errors = error.errors || [];
  } else if (pg) {
    status = pg.status;
    message = pg.message;
  } else if (error.statusCode) {
    // Errors thrown by existing controllers as `Object.assign(new Error(msg), { statusCode })`.
    status = error.statusCode;
    message = error.message;
  }

  const context = {
    method: req.method,
    url: req.originalUrl,
    status,
    userId: req.auth?.sub,
  };

  if (status >= 500) {
    logger.error(error.message, { ...context, stack: error.stack, code: error.code });
  } else {
    logger.warn(message, context);
  }

  // Never leak the raw message of an unexpected 500 to the client.
  if (status >= 500 && !isProduction) {
    errors = [{ message: error.message, code: error.code }];
  }

  return sendError(res, { status, message, errors });
};
