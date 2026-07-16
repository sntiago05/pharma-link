import { Router } from 'express';
import { loginController, registerController } from '../controllers/auth.controller.js';
import { audit } from '../middleware/audit.middleware.js';
import { authLimiter } from '../middleware/security.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { loginRules, registerRules } from '../validators/auth.validators.js';

const router = Router();

// These are the only unauthenticated write endpoints, so they carry the stricter
// rate limit to slow down credential stuffing and mass account creation.

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a patient account
 *     description: >
 *       Creates a user with the PATIENT role. The patient profile (EPS and
 *       document) is created separately with `POST /patients/me`.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/RegisterRequest' }
 *     responses:
 *       201:
 *         description: Account created.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     user: { $ref: '#/components/schemas/User' }
 *       409: { $ref: '#/components/responses/Conflict' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */
router.post(
  '/register',
  authLimiter,
  validate(registerRules),
  audit({ action: 'REGISTER', table: 'users' }),
  registerController,
);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Authenticate and obtain a JWT
 *     description: >
 *       Returns a signed JWT. Send it as `Authorization: Bearer <token>`.
 *       `token` and `user` also appear at the top level for backwards
 *       compatibility with existing clients.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/LoginRequest' }
 *     responses:
 *       200:
 *         description: Login successful.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/LoginResponse' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */
router.post('/login', authLimiter, validate(loginRules), loginController);

export default router;
