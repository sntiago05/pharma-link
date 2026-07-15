import { Router } from 'express';
import { createOrder, listMyOrders } from '../controllers/order.controller.js';
import { allowRoles } from '../middleware/auth.middleware.js';
const router = Router();
router.get('/me', allowRoles('PATIENT'), listMyOrders);
router.post('/', allowRoles('PATIENT'), createOrder);
export default router;
