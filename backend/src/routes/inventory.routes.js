import { Router } from 'express';
import { adjustInventory, listInventory } from '../controllers/inventory.controller.js';
import { allowRoles } from '../middleware/auth.middleware.js';
import { requirePharmacyAccess } from '../middleware/pharmacy-access.middleware.js';
const router = Router();
router.get('/:pharmacyId', allowRoles('ADMIN', 'PHARMACY_OPERATOR'), requirePharmacyAccess((req) => req.params.pharmacyId), listInventory);
router.post('/:pharmacyId/adjustments', allowRoles('ADMIN', 'PHARMACY_OPERATOR'), requirePharmacyAccess((req) => req.params.pharmacyId), adjustInventory);
export default router;
