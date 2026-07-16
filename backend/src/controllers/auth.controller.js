import * as authService from '../services/auth.service.js';
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
