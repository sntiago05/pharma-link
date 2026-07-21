/**
 * Operational error carrying an HTTP status and an optional list of details.
 *
 * The global error handler distinguishes these from unexpected crashes: an
 * ApiError message is safe to return to the client, anything else is not.
 */
export class ApiError extends Error {
  /**
   * @param {number} statusCode HTTP status to respond with.
   * @param {string} message Client-safe message.
   * @param {Array<object>} [errors] Field-level details for the `errors` array.
   */
  constructor(statusCode, message, errors = []) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(message, errors = []) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Authentication token required.') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Insufficient permissions.') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Record not found.') {
    return new ApiError(404, message);
  }

  static conflict(message) {
    return new ApiError(409, message);
  }

  static unprocessable(message, errors = []) {
    return new ApiError(422, message, errors);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, message);
  }
}
