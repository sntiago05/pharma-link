/**
 * Response envelope helpers.
 *
 * Backwards-compatibility contract: the envelope is ADDITIVE. `success` and
 * `message` are new, but `data` stays exactly where it already was, and legacy
 * top-level keys (`token`, `user`, ...) are preserved via `extra` so existing
 * clients keep reading the same paths. Do not move a key that a client may
 * already depend on — add it in both places instead.
 */

/**
 * @param {import('express').Response} res
 * @param {object} [options]
 * @param {number} [options.status=200] HTTP status code.
 * @param {string} [options.message='OK'] Human-readable outcome.
 * @param {*} [options.data=null] Payload, exposed as `data`.
 * @param {object} [options.extra={}] Legacy top-level keys to mirror.
 */
export const sendSuccess = (res, { status = 200, message = 'OK', data = null, extra = {} } = {}) =>
  res.status(status).json({ success: true, message, data, ...extra });

/**
 * @param {import('express').Response} res
 * @param {object} options
 * @param {number} [options.status=400] HTTP status code.
 * @param {string} options.message Client-safe error message.
 * @param {Array<object>} [options.errors=[]] Field-level details.
 */
export const sendError = (res, { status = 400, message, errors = [] }) =>
  res.status(status).json({ success: false, message, errors });
