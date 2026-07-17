import { Router } from 'express';
import {
  forgotPasswordController,
  loginController,
  registerController,
  resetPasswordController,
} from '../controllers/auth.controller.js';
import { audit } from '../middleware/audit.middleware.js';
import { authLimiter } from '../middleware/security.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  forgotPasswordRules,
  loginRules,
  registerRules,
  resetPasswordRules,
} from '../validators/auth.validators.js';

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

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset link
 *     description: |
 *       Emails a single-use link that expires (60 minutes by default).
 *
 *       Always answers 202 with the same body, whether or not the address has an
 *       account: a different answer would let a caller discover who is
 *       registered, and on a health platform that is sensitive on its own.
 *
 *       Requesting a new link invalidates any previous one. Accounts are also
 *       throttled to 5 links per hour on top of the per-IP rate limit.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email, example: paciente@pharmalink.local }
 *     responses:
 *       202:
 *         description: Accepted. Sent only if the address matches an account.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *             example:
 *               success: true
 *               message: Si el correo corresponde a una cuenta, te enviamos un enlace para restablecer la contraseña.
 *               data: null
 *       422: { $ref: '#/components/responses/ValidationError' }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 *       500: { $ref: '#/components/responses/ServerError' }
 */
router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordRules),
  audit({ action: 'REQUEST_PASSWORD_RESET', table: 'password_reset_tokens' }),
  forgotPasswordController,
);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Set a new password using an emailed token
 *     description: |
 *       Redeems the token from the reset link. The token is single-use and dies
 *       on success, along with any other live link for that account.
 *
 *       Returns no session on purpose: the user signs in again with the new
 *       password. Unknown, expired and already-used tokens all return the same
 *       message, so a stale token reveals nothing.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:
 *                 type: string
 *                 description: The `token` query parameter from the emailed link.
 *                 example: 9f2c1a...64-hex-chars
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: NuevaClave123
 *     responses:
 *       200:
 *         description: Password updated.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *             example:
 *               success: true
 *               message: Tu contraseña fue actualizada. Ya puedes iniciar sesión.
 *               data: null
 *       400:
 *         description: The link is invalid, expired or already used.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */
router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordRules),
  audit({ action: 'RESET_PASSWORD', table: 'users' }),
  resetPasswordController,
);

export default router;
