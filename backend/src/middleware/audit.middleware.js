import { logger } from '../config/logger.js';
import { insertAuditLog } from '../repositories/audit.repository.js';

/**
 * Records an audit entry once the response has been sent.
 *
 * Two deliberate choices:
 *  - It runs on the `finish` event, so it never adds latency to the response and
 *    a failure in the audit write can never fail the user's request (it is
 *    logged instead).
 *  - It only records successful responses (2xx). A rejected request changed
 *    nothing, so recording it as an action would be misleading; failures are
 *    already captured by the error logger.
 *
 * The affected record id is resolved from `res.locals.auditRecordId` (set by the
 * controller once it knows the id) or from an explicit `recordId` resolver.
 *
 * @param {object} options
 * @param {string} options.action e.g. 'CREATE', 'UPDATE', 'DELETE', 'CONFIRM_DELIVERY'.
 * @param {string} [options.table] Affected table name.
 * @param {(req: import('express').Request, res: import('express').Response) => string|number|undefined} [options.recordId]
 * @param {(req: import('express').Request) => object} [options.metadata] Extra context to store.
 * @returns {import('express').RequestHandler}
 */
export const audit = ({ action, table, recordId, metadata }) => (req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode >= 400) return;

    const entry = {
      userId: req.auth?.sub ? Number(req.auth.sub) : null,
      action,
      table,
      recordId: recordId?.(req, res) ?? res.locals.auditRecordId,
      ip: req.ip,
      endpoint: req.originalUrl,
      method: req.method,
      statusCode: res.statusCode,
      metadata: metadata?.(req) ?? null,
    };

    insertAuditLog(entry).catch((error) =>
      logger.error('Failed to write audit log', { action, table, error: error.message }),
    );
  });

  return next();
};
