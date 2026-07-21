import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { sendMail } from '../config/mailer.js';
import {
  countRecentTokens,
  findLiveTokenForUpdate,
  insertToken,
  invalidateUserTokens,
  markTokenUsed,
  updateUserPassword,
} from '../repositories/password-reset.repository.js';
import { findByEmailWithPassword } from '../repositories/user.repository.js';
import { ApiError } from '../utils/api-error.js';
import { buildResetUrl, passwordResetEmail } from '../utils/email-templates.js';
import { withTransaction } from '../utils/transaction.js';

/**
 * Password reset.
 *
 * The token is a bearer credential: whoever holds it can take the account. That
 * shapes every decision here — it is random, hashed at rest, short-lived,
 * single-use, and superseded by the next request.
 */

/** Cost factor for bcrypt, matching auth.service.js and existing stored hashes. */
const BCRYPT_ROUNDS = 12;

/** 32 random bytes = 256 bits of entropy; not guessable. */
const TOKEN_BYTES = 32;

/** Max links per account per hour, on top of the per-IP rate limit. */
const MAX_REQUESTS_PER_HOUR = 5;

const normalizeEmail = (email) => email.trim().toLowerCase();

/** Tokens are compared and stored by digest, never in the clear. */
const hashToken = (token) => createHash('sha256').update(token).digest('hex');

/**
 * Issues a reset link for an email address.
 *
 * Always resolves, and always with the same outcome, whether or not the address
 * belongs to an account. Reporting "no such user" would turn this endpoint into
 * a way to discover which people are registered — for a health platform, the
 * mere fact that someone has an account is sensitive.
 *
 * @param {object} input
 * @param {string} input.email
 * @param {string} [input.ip] Recorded for auditing.
 * @returns {Promise<{ previewUrl: string|false|null }>} `previewUrl` is only ever
 *   set with the Ethereal dev transport; it is not exposed by the controller.
 */
export const requestPasswordReset = async ({ email, ip }) => {
  const user = await findByEmailWithPassword(normalizeEmail(email));

  // Unknown address, or a deactivated account: stop, but tell the caller nothing.
  if (!user || !user.active) {
    logger.info('Password reset requested for an unknown or inactive address', { ip });
    return { previewUrl: null };
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  if ((await countRecentTokens({ userId: user.id, since: oneHourAgo })) >= MAX_REQUESTS_PER_HOUR) {
    // Silent stop: answering differently here would leak that the account exists.
    logger.warn('Password reset throttled for account', { userId: user.id, ip });
    return { previewUrl: null };
  }

  const token = randomBytes(TOKEN_BYTES).toString('hex');
  const expiresAt = new Date(Date.now() + env.passwordReset.ttlMinutes * 60 * 1000);

  await withTransaction(async (client) => {
    // Supersede any earlier link, so a user who clicks "resend" invalidates the
    // previous email rather than leaving several working links alive.
    await invalidateUserTokens(user.id, client);
    await insertToken(
      { userId: user.id, tokenHash: hashToken(token), expiresAt, requestedIp: ip },
      client,
    );
  });

  const { subject, text, html } = passwordResetEmail({
    fullName: user.full_name,
    resetUrl: buildResetUrl(token),
    expiresInMinutes: env.passwordReset.ttlMinutes,
  });

  try {
    const { previewUrl } = await sendMail({ to: user.email, subject, text, html });
    logger.info('Password reset email sent', { userId: user.id });
    return { previewUrl };
  } catch (error) {
    // The token is already stored, so a delivery failure would otherwise leave a
    // live credential nobody can use. Burn it and surface the failure.
    await invalidateUserTokens(user.id).catch(() => {});
    logger.error('Failed to send password reset email', { userId: user.id, error: error.message });
    throw ApiError.internal('No se pudo enviar el correo de restablecimiento. Intenta más tarde.');
  }
};

/**
 * Redeems a token and sets the new password.
 *
 * @param {object} input
 * @param {string} input.token Plaintext token from the emailed link.
 * @param {string} input.password New password.
 * @returns {Promise<{ email: string }>}
 * @throws {ApiError} 400 when the token is unknown, expired or already spent.
 */
export const resetPassword = async ({ token, password }) =>
  withTransaction(async (client) => {
    const row = await findLiveTokenForUpdate(hashToken(token), client);

    // One message for unknown, expired and spent alike: distinguishing them tells
    // an attacker holding a stale token whether it was ever real.
    if (!row) throw ApiError.badRequest('El enlace no es válido o ya caducó. Solicita uno nuevo.');
    if (!row.active) throw ApiError.badRequest('El enlace no es válido o ya caducó. Solicita uno nuevo.');

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await updateUserPassword({ userId: row.user_id, passwordHash }, client);

    await markTokenUsed(row.id, client);
    // Also kill any other live link for this account: if an attacker requested
    // one, the real owner resetting their password must revoke it.
    await invalidateUserTokens(row.user_id, client);

    logger.info('Password reset completed', { userId: row.user_id });
    return { email: row.email };
  });
