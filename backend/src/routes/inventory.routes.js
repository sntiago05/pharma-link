import { Router } from 'express';
import { adjustInventory, listInventory } from '../controllers/inventory.controller.js';
import { ROLES } from '../config/roles.js';
import { audit } from '../middleware/audit.middleware.js';
import { authorize } from '../middleware/auth.middleware.js';
import { requirePharmacyAccess } from '../middleware/pharmacy-access.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { adjustInventoryRules, listInventoryRules } from '../validators/inventory.validators.js';

const router = Router();

const pharmacyOfParams = (req) => Number(req.params.pharmacyId);

/**
 * @openapi
 * /inventory/{pharmacyId}:
 *   get:
 *     tags: [Inventory]
 *     summary: List a pharmacy's stock
 *     description: >
 *       `available_quantity` is `stock_quantity - reserved_quantity`: the units
 *       that can still be reserved. Restricted to operators of that pharmacy.
 *     parameters:
 *       - in: path
 *         name: pharmacyId
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       200:
 *         description: Inventory.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/InventoryItem' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.get(
  '/:pharmacyId',
  authorize([ROLES.ADMIN, ROLES.PHARMACY]),
  validate(listInventoryRules),
  requirePharmacyAccess(pharmacyOfParams),
  listInventory,
);

/**
 * @openapi
 * /inventory/{pharmacyId}/adjustments:
 *   post:
 *     tags: [Inventory]
 *     summary: Register an entry or adjustment
 *     description: >
 *       `quantity` is a signed delta: positive adds stock, negative removes it.
 *       An adjustment that would leave stock below the quantity already reserved
 *       for patients is rejected with 409. Every adjustment is written to the
 *       movement ledger and the audit log.
 *     parameters:
 *       - in: path
 *         name: pharmacyId
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AdjustInventoryRequest' }
 *     responses:
 *       200:
 *         description: Inventory adjusted.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       400:
 *         description: The medicine does not exist.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       409:
 *         description: Adjustment would make stock lower than reserved quantity.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.post(
  '/:pharmacyId/adjustments',
  authorize([ROLES.ADMIN, ROLES.PHARMACY]),
  validate(adjustInventoryRules),
  requirePharmacyAccess(pharmacyOfParams),
  audit({
    action: 'ADJUST_INVENTORY',
    table: 'pharmacy_inventory',
    metadata: (req) => ({
      medicineId: req.body.medicineId,
      quantity: req.body.quantity,
      movementType: req.body.movementType ?? 'ADJUSTMENT',
    }),
  }),
  adjustInventory,
);

export default router;
