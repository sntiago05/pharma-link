import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { sendError } from '../utils/api-response.js';

const limitHandler = (_req, res) =>
  sendError(res, { status: 429, message: 'Too many requests. Please try again later.' });

/** Baseline limiter for the whole API. */
export const apiLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitHandler,
});

/**
 * Tighter limiter for credential endpoints, to slow down brute-force attempts.
 * `skipSuccessfulRequests` means a legitimate user who logs in successfully does
 * not burn through their quota; only failures count.
 */
export const authLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: limitHandler,
});

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/** Recursively strips prototype-polluting keys and null bytes from strings. */
const clean = (value) => {
  if (Array.isArray(value)) return value.map(clean);

  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (FORBIDDEN_KEYS.has(key)) {
        delete value[key];
        continue;
      }
      value[key] = clean(value[key]);
    }
    return value;
  }

  // Null bytes truncate strings in some C-backed drivers and log sinks.
  return typeof value === 'string' ? value.replace(/\0/g, '') : value;
};

/**
 * Sanitises request input against prototype pollution and null-byte injection.
 *
 * Mutates in place rather than reassigning: in Express 5 `req.query` is a getter
 * with no setter, so `req.query = {...}` throws.
 *
 * Field-level sanitisation (trim, normalizeEmail, escape) lives in the
 * per-route validators, where the expected shape of each field is known.
 */
export const sanitizeRequest = (req, _res, next) => {
  if (req.body) clean(req.body);
  if (req.query) clean(req.query);
  if (req.params) clean(req.params);
  return next();
};
