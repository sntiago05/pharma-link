/**
 * Wraps an async route handler so rejected promises reach the global error
 * middleware, removing the repeated `try { ... } catch (error) { next(error) }`
 * block from every controller.
 *
 * @param {(req, res, next) => Promise<unknown>} handler
 * @returns {import('express').RequestHandler}
 */
export const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);
