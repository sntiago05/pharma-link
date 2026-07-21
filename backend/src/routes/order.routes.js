import { Router } from 'express';
import { getPharmaciesForOrder } from '../controllers/directory.controller.js';
import { createOrder, listMyOrders } from '../controllers/order.controller.js';
import { ROLES } from '../config/roles.js';
import { audit } from '../middleware/audit.middleware.js';
import { authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { idParam } from '../validators/common.validators.js';
import { createOrderRules } from '../validators/order.validators.js';

const router = Router();

/**
 * @openapi
 * /orders/{orderId}/pharmacies:
 *   get:
 *     tags: [Orders]
 *     summary: Where can this order be collected?
 *     description: >
 *       For each pharmacy contracted by the order's EPS, reports whether it can
 *       serve the whole order (`isComplete`) and the required vs available units
 *       per medicine. This is the list the patient picks from before choosing a
 *       slot; `isComplete: false` means a reservation there would fail on stock.
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       200:
 *         description: Pharmacies with availability for the order.
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
 *                           address: { type: string }
 *                           city: { type: string }
 *                           hasWorkingHours: { type: boolean }
 *                           isComplete:
 *                             type: boolean
 *                             description: True when every medicine has enough free stock.
 *                           items:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 medicineId: { type: integer }
 *                                 code: { type: string }
 *                                 name: { type: string }
 *                                 required: { type: integer }
 *                                 available: { type: integer }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404:
 *         description: The order does not exist or does not belong to the caller.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get(
  '/:orderId/pharmacies',
  authorize([ROLES.PATIENT]),
  validate([idParam('orderId')]),
  getPharmaciesForOrder,
);

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
