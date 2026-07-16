import { Router } from 'express';
import { query } from 'express-validator';
import { getEpsDirectory } from '../controllers/directory.controller.js';
import { createOrder, listOrders } from '../controllers/eps-order.controller.js';
import { ROLES } from '../config/roles.js';
import { audit } from '../middleware/audit.middleware.js';
import { authorize } from '../middleware/auth.middleware.js';
import { requireEpsAccess } from '../middleware/eps-access.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { paginationQuery } from '../validators/common.validators.js';
import { createEpsOrderRules, listEpsOrdersRules } from '../validators/eps-order.validators.js';

const router = Router();

const epsOfParams = (req) => Number(req.params.epsId);

/**
 * @openapi
 * /eps:
 *   get:
 *     tags: [Directory]
 *     summary: EPS directory
 *     description: >
 *       Active EPS with public fields only (`id`, `name`, `nit`). Any
 *       authenticated user may read it: a patient needs it to pick their EPS when
 *       creating their profile. Credentials are never exposed here — the admin
 *       surface is `/catalog/eps`.
 *     responses:
 *       200:
 *         description: EPS list.
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
 *                           name: { type: string }
 *                           nit: { type: string }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/', getEpsDirectory);

/**
 * @openapi
 * /eps/{epsId}/orders:
 *   get:
 *     tags: [EPS]
 *     summary: List the EPS's orders
 *     description: >
 *       Orders issued by this EPS with patient and medicine context. An EPS
 *       operator only sees the EPS they are linked to via `user_eps`.
 *     parameters:
 *       - in: path
 *         name: epsId
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: status
 *         schema: { $ref: '#/components/schemas/OrderStatus' }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Matches order number, patient document or patient name.
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/OffsetParam'
 *     responses:
 *       200:
 *         description: Orders.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/MedicalOrder' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 *   post:
 *     tags: [EPS]
 *     summary: Issue a medical order (EPS operator)
 *     description: >
 *       The browser-facing equivalent of the `X-API-Key` webhook
 *       `POST /integrations/eps/orders`: same action, but authenticated with a
 *       JWT and scoped to the operator's own EPS.
 *
 *
 *       If `patientDocument` is not enrolled for this EPS, send
 *       `patientFullName` and `patientEmail` to enrol them (422 otherwise).
 *       Unlike the webhook, a duplicate `orderNumber` is rejected with 409 rather
 *       than upserted, since a human re-submitting a form means a mistake.
 *     parameters:
 *       - in: path
 *         name: epsId
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderNumber, patientDocument, issueDate, expirationDate, details]
 *             properties:
 *               orderNumber: { type: string, example: 'ORD-2026-014' }
 *               patientDocument: { type: string, example: '1020304050' }
 *               patientFullName: { type: string, description: Required for a new patient. }
 *               patientEmail: { type: string, format: email, description: Required for a new patient. }
 *               patientPhone: { type: string, nullable: true }
 *               issueDate: { type: string, format: date }
 *               expirationDate: { type: string, format: date }
 *               details:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [medicineId, quantity]
 *                   properties:
 *                     medicineId: { type: integer }
 *                     quantity: { type: integer, minimum: 1 }
 *     responses:
 *       201:
 *         description: Order created.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/MedicalOrder' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       409:
 *         description: The order number already exists.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.get(
  '/:epsId/orders',
  authorize([ROLES.ADMIN, ROLES.EPS]),
  validate([
    ...listEpsOrdersRules,
    ...paginationQuery(),
    query('status').optional()
      .isIn(['PENDING', 'RESERVED', 'DELIVERED', 'CANCELLED', 'EXPIRED'])
      .withMessage('status must be a valid order status.'),
    query('search').optional().isString().trim().isLength({ max: 100 })
      .withMessage('search must be at most 100 characters.'),
  ]),
  requireEpsAccess(epsOfParams),
  listOrders,
);

router.post(
  '/:epsId/orders',
  authorize([ROLES.ADMIN, ROLES.EPS]),
  validate(createEpsOrderRules),
  requireEpsAccess(epsOfParams),
  audit({ action: 'CREATE', table: 'medical_orders' }),
  createOrder,
);

export default router;
