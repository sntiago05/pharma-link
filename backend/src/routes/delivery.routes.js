import { Router } from 'express';
import { confirmDelivery } from '../controllers/delivery.controller.js';
import { allowRoles } from '../middleware/auth.middleware.js';
import { requirePharmacyAccess } from '../middleware/pharmacy-access.middleware.js';
const router = Router();
router.post('/:reservationId', allowRoles('ADMIN', 'PHARMACY_OPERATOR'), requirePharmacyAccess(async (req) => {
  const { query } = await import('../config/db.js');
  const result = await query('SELECT pharmacy_id FROM reservations WHERE id = $1', [req.params.reservationId]);
  return result.rows[0]?.pharmacy_id;
}), confirmDelivery);
export default router;
