import { Router } from 'express';
import { createPatientProfile, getMyPatientProfile } from '../controllers/patient.controller.js';
import { ROLES } from '../config/roles.js';
import { audit } from '../middleware/audit.middleware.js';
import { authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createPatientProfileRules } from '../validators/patient.validators.js';

const router = Router();

/**
 * @openapi
 * /patients/me:
 *   get:
 *     tags: [Patients]
 *     summary: Get the caller's patient profile
 *     responses:
 *       200:
 *         description: Patient profile.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/PatientProfile' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   post:
 *     tags: [Patients]
 *     summary: Create the caller's patient profile
 *     description: >
 *       Links the account to an EPS and a document number. Required before
 *       creating orders. One profile per user; the document must be unique.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [epsId, document]
 *             properties:
 *               epsId: { type: integer, example: 1 }
 *               document: { type: string, example: '1020304050' }
 *               phone: { type: string, nullable: true, example: '3001234567' }
 *     responses:
 *       201:
 *         description: Patient profile created.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/PatientProfile' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       409:
 *         description: The profile or document already exists.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.get('/me', authorize([ROLES.PATIENT]), getMyPatientProfile);

router.post(
  '/me',
  authorize([ROLES.PATIENT]),
  validate(createPatientProfileRules),
  audit({ action: 'CREATE', table: 'patients' }),
  createPatientProfile,
);

export default router;
