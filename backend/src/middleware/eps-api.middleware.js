import { createHash } from 'node:crypto';
import { query } from '../config/db.js';
import { ApiError } from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js';

/**
 * Authenticates a partner EPS by the `X-API-Key` header.
 *
 * The key is stored only as a SHA-256 hash, so the lookup hashes the incoming
 * value and matches on the digest. Populates `req.eps` with `{ id, name }`.
 */
export const authenticateEpsApi = asyncHandler(async (req, _res, next) => {
  const apiKey = req.header('X-API-Key');
  if (!apiKey) throw ApiError.unauthorized('X-API-Key header is required.');

  const apiKeyHash = createHash('sha256').update(apiKey).digest('hex');
  const result = await query(
    'SELECT id, name FROM eps WHERE api_key_hash = $1 AND active = TRUE',
    [apiKeyHash],
  );
  if (!result.rowCount) throw ApiError.unauthorized('Invalid EPS API key.');

  req.eps = result.rows[0];
  return next();
});
