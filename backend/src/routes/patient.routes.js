import { Router } from 'express';
import { createPatientProfile, getMyPatientProfile } from '../controllers/patient.controller.js';
import { allowRoles } from '../middleware/auth.middleware.js';
const router = Router();
router.get('/me', allowRoles('PATIENT'), getMyPatientProfile);
router.post('/me', allowRoles('PATIENT'), createPatientProfile);
export default router;
