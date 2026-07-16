import { findAuditLogs } from '../repositories/audit.repository.js';
import { sendSuccess } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';

/** GET /api/audit-logs — ADMIN only. */
export const listAuditLogs = asyncHandler(async (req, res) => {
  const logs = await findAuditLogs({
    userId: req.query.userId,
    table: req.query.table,
    action: req.query.action,
    limit: req.query.limit ?? 50,
    offset: req.query.offset ?? 0,
  });

  return sendSuccess(res, { message: 'Audit logs retrieved.', data: logs });
});
