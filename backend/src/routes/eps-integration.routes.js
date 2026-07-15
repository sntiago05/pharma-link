import { Router } from 'express';
import { receiveOrder } from '../controllers/eps-integration.controller.js';
import { authenticateEpsApi } from '../middleware/eps-api.middleware.js';
const router = Router();
router.post('/orders', authenticateEpsApi, receiveOrder);
export default router;
