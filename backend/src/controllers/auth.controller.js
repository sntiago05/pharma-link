import * as authService from '../services/auth.service.js';
import * as passwordResetService from '../services/password-reset.service.js';
import { sendSuccess } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';

/**
 * POST /api/auth/register
 *
 * Response keeps `user` at the top level (the original shape) and mirrors it
 * under `data`, so existing clients and the documented envelope both work.
 */
export const registerController = asyncHandler(async (req, res) => {
  const user = await authService.register({
    fullName: req.body.fullName,
    email: req.body.email,
    password: req.body.password,
  });

  res.locals.auditRecordId = user.id;
  return sendSuccess(res, {
    status: 201,
    message: 'Account created.',
    data: { user },
    extra: { user },
  });
});

/**
 * POST /api/auth/login
 *
 * `token` and `user` stay at the top level for compatibility and are also
 * exposed under `data`.
 */
export const loginController = asyncHandler(async (req, res) => {
  const { token, user } = await authService.login({
    email: req.body.email,
    password: req.body.password,
  });

  return sendSuccess(res, {
    message: 'Login successful.',
    data: { token, user },
    extra: { token, user },
  });
});

/**
 * POST /api/auth/forgot-password
 *
 * Answers 202 with the same body whether or not the address has an account.
 * Anything else would let a caller enumerate registered users, and on a health
 * platform simply having an account is sensitive information.
 */
export const forgotPasswordController = asyncHandler(async (req, res) => {
  await passwordResetService.requestPasswordReset({
    email: req.body.email,
    ip: req.ip,
  });

  return sendSuccess(res, {
    status: 202,
    message: 'Si el correo corresponde a una cuenta, te enviamos un enlace para restablecer la contraseña.',
  });
});

/**
 * POST /api/auth/reset-password
 *
 * Redeems the emailed token and sets the new password. Deliberately returns no
 * session: the user signs in again, which proves the new password works and
 * keeps this endpoint from being a way to obtain a token.
 */
export const resetPasswordController = asyncHandler(async (req, res) => {
  await passwordResetService.resetPassword({
    token: req.body.token,
    password: req.body.password,
  });

  return sendSuccess(res, {
    message: 'Tu contraseña fue actualizada. Ya puedes iniciar sesión.',
  });
});
