import { query } from '../config/db.js';
import { createHash } from 'node:crypto';

export const authenticateEpsApi = async (req, res, next) => {
  try {
    const apiKey = req.header('X-API-Key');
    if (!apiKey) return res.status(401).json({ message: 'X-API-Key header is required.' });
    const apiKeyHash = createHash('sha256').update(apiKey).digest('hex');
    const result = await query('SELECT id, name FROM eps WHERE api_key_hash = $1 AND active = TRUE', [apiKeyHash]);
    if (!result.rowCount) return res.status(401).json({ message: 'Invalid EPS API key.' });
    req.eps = result.rows[0];
    return next();
  } catch (error) { return next(error); }
};
