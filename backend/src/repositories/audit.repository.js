import { query } from '../config/db.js';

/**
 * Persists one audit entry.
 *
 * Accepts an optional `client` so the write can join a caller's transaction; it
 * defaults to the pool, which is what the audit middleware uses (it runs after
 * the response, outside any transaction).
 *
 * @param {object} entry
 * @param {number|null} entry.userId
 * @param {string} entry.action
 * @param {string|null} [entry.table]
 * @param {string|number|null} [entry.recordId]
 * @param {string|null} [entry.ip]
 * @param {string|null} [entry.endpoint]
 * @param {string|null} [entry.method]
 * @param {number|null} [entry.statusCode]
 * @param {object|null} [entry.metadata]
 * @param {import('pg').PoolClient} [client]
 */
export const insertAuditLog = async (entry, client) => {
  const runner = client ? client.query.bind(client) : query;
  await runner(
    `INSERT INTO audit_logs
       (user_id, action, table_name, record_id, ip_address, endpoint, http_method, status_code, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      entry.userId ?? null,
      entry.action,
      entry.table ?? null,
      entry.recordId != null ? String(entry.recordId) : null,
      entry.ip ?? null,
      entry.endpoint ?? null,
      entry.method ?? null,
      entry.statusCode ?? null,
      entry.metadata ? JSON.stringify(entry.metadata) : null,
    ],
  );
};

/**
 * Lists audit entries, newest first, with optional filters.
 * @param {object} [filters]
 * @param {number} [filters.userId]
 * @param {string} [filters.table]
 * @param {string} [filters.action]
 * @param {number} [filters.limit=50]
 * @param {number} [filters.offset=0]
 */
export const findAuditLogs = async ({ userId, table, action, limit = 50, offset = 0 } = {}) => {
  const conditions = [];
  const params = [];

  if (userId != null) { params.push(userId); conditions.push(`audit_logs.user_id = $${params.length}`); }
  if (table) { params.push(table); conditions.push(`audit_logs.table_name = $${params.length}`); }
  if (action) { params.push(action); conditions.push(`audit_logs.action = $${params.length}`); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(limit, offset);

  const result = await query(
    `SELECT audit_logs.*, users.full_name AS user_full_name, users.email AS user_email
     FROM audit_logs
     LEFT JOIN users ON users.id = audit_logs.user_id
     ${where}
     ORDER BY audit_logs.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  return result.rows;
};
