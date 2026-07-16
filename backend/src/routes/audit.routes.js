import { Router } from 'express';
import { query } from 'express-validator';
import { listAuditLogs } from '../controllers/audit.controller.js';
import { ROLES } from '../config/roles.js';
import { authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { paginationQuery } from '../validators/common.validators.js';

const router = Router();

/**
 * ADMIN only: the audit trail records who did what across every tenant, so it is
 * deliberately not exposed to pharmacy or EPS operators.
 *
 * @openapi
 * /audit-logs:
 *   get:
 *     tags: [Audit]
 *     summary: Query the audit trail (ADMIN only)
 *     description: >
 *       Records creates, updates, deletes, delivery confirmations, reservation
 *       cancellations and inventory changes, with the acting user, IP, endpoint
 *       and timestamp. Newest first.
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: table
 *         schema: { type: string }
 *         example: reservations
 *       - in: query
 *         name: action
 *         schema: { type: string }
 *         example: CONFIRM_DELIVERY
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/OffsetParam'
 *     responses:
 *       200:
 *         description: Audit entries.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: integer }
 *                           user_id: { type: integer, nullable: true }
 *                           action: { type: string, example: CONFIRM_DELIVERY }
 *                           table_name: { type: string, example: deliveries }
 *                           record_id: { type: string, nullable: true }
 *                           ip_address: { type: string, nullable: true }
 *                           endpoint: { type: string }
 *                           http_method: { type: string, example: POST }
 *                           status_code: { type: integer, example: 201 }
 *                           metadata: { type: object, nullable: true }
 *                           created_at: { type: string, format: date-time }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.get(
  '/',
  authorize([ROLES.ADMIN]),
  validate([
    ...paginationQuery(),
    query('userId').optional().isInt({ min: 1 })
      .withMessage('userId must be a positive integer.').toInt(),
    query('table').optional().isString().trim().isLength({ max: 60 })
      .withMessage('table must be at most 60 characters.'),
    query('action').optional().isString().trim().isLength({ max: 40 })
      .withMessage('action must be at most 40 characters.'),
  ]),
  listAuditLogs,
);

export default router;
