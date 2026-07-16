import { body, param, query } from 'express-validator';
import { today } from '../utils/dates.js';

/**
 * Reusable validation fragments.
 *
 * Every rule here is intentionally strict about types, because the controllers
 * pass values straight to parameterised SQL where a wrong type surfaces as a
 * confusing 500 (`invalid input syntax for type integer`) instead of a 422.
 */

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Positive integer route parameter, e.g. `/:id`. */
export const idParam = (name = 'id') =>
  param(name).isInt({ min: 1 }).withMessage(`${name} must be a positive integer.`).toInt();

/** Positive integer body field. */
export const idBody = (name) =>
  body(name).isInt({ min: 1 }).withMessage(`${name} must be a positive integer.`).toInt();

/** Quantity: integer >= 1. */
export const quantityBody = (name = 'quantity') =>
  body(name).isInt({ min: 1 }).withMessage(`${name} must be an integer greater than 0.`).toInt();

/** `YYYY-MM-DD` date, validated as a real calendar date. */
export const dateField = (chain, name) =>
  chain
    .matches(DATE_PATTERN).withMessage(`${name} must use the YYYY-MM-DD format.`)
    .bail()
    .isISO8601({ strict: true }).withMessage(`${name} must be a valid calendar date.`);

export const dateBody = (name) => dateField(body(name), name);
export const dateQuery = (name) => dateField(query(name), name);

/**
 * A date that must not be in the past, resolved in the business timezone.
 * @see utils/dates.js for why UTC is not used here.
 */
export const futureDateBody = (name, message) =>
  dateBody(name).bail().custom((value) => {
    if (value < today()) throw new Error(message ?? `${name} cannot be in the past.`);
    return true;
  });

/** `HH:MM` or `HH:MM:SS` time. */
export const timeBody = (name) =>
  body(name).matches(TIME_PATTERN).withMessage(`${name} must use the HH:MM 24-hour format.`);

/**
 * Email rule.
 *
 * Normalisation is deliberately limited to `trim().toLowerCase()`, matching the
 * existing `normalizeEmail` helper in auth.controller.js. express-validator's
 * `.normalizeEmail()` is NOT used: it strips Gmail sub-addresses, so an account
 * registered as `user+tag@gmail.com` would be stored under one address and
 * looked up under another, locking the user out.
 */
export const emailBody = (name = 'email') =>
  body(name)
    .isString().withMessage('A valid email is required.')
    .bail()
    .trim()
    .isEmail().withMessage('A valid email is required.')
    .bail()
    .isLength({ max: 150 }).withMessage('Email must be at most 150 characters.')
    .customSanitizer((value) => value.toLowerCase());

/**
 * Password rule.
 *
 * Deliberately kept at "at least 8 characters" to match the existing
 * `validateCredentials` check: tightening it would lock out accounts that were
 * registered under the old rule and can still log in today.
 */
export const passwordBody = (name = 'password') =>
  body(name)
    .isString().withMessage('Password must contain at least 8 characters.')
    .bail()
    .isLength({ min: 8, max: 128 }).withMessage('Password must contain at least 8 characters.');

/** Non-empty trimmed string with a length bound. */
export const stringBody = (name, { min = 1, max = 150 } = {}) =>
  body(name)
    .isString().withMessage(`${name} must be a string.`)
    .bail()
    .trim()
    .isLength({ min, max }).withMessage(`${name} must be between ${min} and ${max} characters.`);

/** Optional trimmed string; absent or null passes. */
export const optionalStringBody = (name, { max = 150 } = {}) =>
  body(name).optional({ values: 'null' })
    .isString().withMessage(`${name} must be a string.`)
    .bail()
    .trim()
    .isLength({ max }).withMessage(`${name} must be at most ${max} characters.`);

/** Standard pagination: `?limit=&offset=`. */
export const paginationQuery = () => [
  query('limit').optional().isInt({ min: 1, max: 100 })
    .withMessage('limit must be an integer between 1 and 100.').toInt(),
  query('offset').optional().isInt({ min: 0 })
    .withMessage('offset must be an integer greater than or equal to 0.').toInt(),
];
