import { Router } from 'express';
import { confirmDelivery } from '../controllers/delivery.controller.js';
import { ROLES } from '../config/roles.js';
import { audit } from '../middleware/audit.middleware.js';
import { authorize } from '../middleware/auth.middleware.js';
import { requirePharmacyAccess } from '../middleware/pharmacy-access.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { findReservationPharmacyId } from '../services/reservation.service.js';
import { idParam } from '../validators/common.validators.js';

const router = Router();

/**
 * @openapi
 * /deliveries/{reservationId}:
 *   post:
 *     tags: [Deliveries]
 *     summary: Confirm delivery of a reservation
 *     description: >
 *       The pharmacy confirms the patient collected their medicines. Deducts the
 *       held stock from inventory, closes the reservation as `COMPLETED`, marks
 *       the order `DELIVERED` and notifies the patient. Restricted to operators
 *       of the pharmacy that owns the reservation.
 *     parameters:
 *       - in: path
 *         name: reservationId
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       201:
 *         description: Delivery confirmed.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Delivery' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409:
 *         description: The reservation is not active (already delivered or cancelled).
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.post(
  '/:reservationId',
  authorize([ROLES.ADMIN, ROLES.PHARMACY]),
  validate([idParam('reservationId')]),
  // Replaces the previous inline dynamic `import('../config/db.js')`, which ran a
  // module resolution and an ad-hoc query on every delivery request.
  requirePharmacyAccess((req) => findReservationPharmacyId(req.params.reservationId)),
  audit({ action: 'CONFIRM_DELIVERY', table: 'deliveries' }),
  confirmDelivery,
);

export default router;
