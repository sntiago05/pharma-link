import { Router } from 'express';
import { receiveOrder } from '../controllers/eps-integration.controller.js';
import { authenticateEpsApi } from '../middleware/eps-api.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { receiveOrderRules } from '../validators/eps-integration.validators.js';

const router = Router();

/**
 * Partner-facing route. Authenticated by `X-API-Key` (not JWT), so it is mounted
 * outside the `authenticate` middleware in app.js.
 *
 * @openapi
 * /integrations/eps/orders:
 *   post:
 *     tags: [Integrations]
 *     summary: Receive a medical order from an EPS
 *     description: >
 *       Authenticated with `X-API-Key`, not a JWT. If the patient is unknown they
 *       are enrolled automatically, which is why `patientFullName` and
 *       `patientEmail` are required for a new document (422 otherwise).
 *
 *
 *       Re-sending the same `orderNumber` updates the existing order and replaces
 *       its lines, so retries are safe and do not duplicate orders. Every request
 *       is recorded in `eps_api_requests`, including failures.
 *     security:
 *       - epsApiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/EpsOrderRequest' }
 *     responses:
 *       201:
 *         description: Order received.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         id: { type: integer }
 *                         order_number: { type: string }
 *                         status: { $ref: '#/components/schemas/OrderStatus' }
 *       400:
 *         description: A medicine code does not exist.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         description: Missing or invalid X-API-Key.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422:
 *         description: Validation failed, or a new patient lacks name/email.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/orders', authenticateEpsApi, validate(receiveOrderRules), receiveOrder);

export default router;
