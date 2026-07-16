import { Router } from 'express';
import { createOrder, listMyOrders } from '../controllers/order.controller.js';
import { ROLES } from '../config/roles.js';
import { audit } from '../middleware/audit.middleware.js';
import { authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createOrderRules } from '../validators/order.validators.js';

const router = Router();

/**
 * @openapi
 * /orders/me:
 *   get:
 *     tags: [Orders]
 *     summary: List the caller's medical orders
 *     description: Newest first. Includes cancellation and reschedule counters.
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
 */
router.get('/me', authorize([ROLES.PATIENT]), listMyOrders);

/**
 * @openapi
 * /orders:
 *   post:
 *     tags: [Orders]
 *     summary: Create a medical order for the caller
 *     description: >
 *       Requires an existing patient profile. The EPS is taken from that profile.
 *       Orders issued by an EPS arrive through `POST /integrations/eps/orders`
 *       instead.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateOrderRequest' }
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
 *       404:
 *         description: The caller has no patient profile yet.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       409: { $ref: '#/components/responses/Conflict' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.post(
  '/',
  authorize([ROLES.PATIENT]),
  validate(createOrderRules),
  audit({ action: 'CREATE', table: 'medical_orders' }),
  createOrder,
);

export default router;
