import nodemailer from 'nodemailer';
import { env, isProduction } from './env.js';
import { logger } from './logger.js';

/**
 * Outbound email.
 *
 * Development with no SMTP configured falls back to an Ethereal test account:
 * nodemailer creates a throwaway inbox on the fly and every message gets a
 * preview URL, which is logged. Nothing is delivered to a real address, so the
 * reset flow is demonstrable without credentials and without the risk of mailing
 * a real person from a dev box.
 *
 * Production requires real SMTP settings and fails fast without them, so a
 * misconfigured deploy cannot silently swallow password reset emails.
 */

/** Lazily created and reused: building a transport opens a connection pool. */
let transportPromise;

const createTransport = async () => {
  if (env.mail.host) {
    return nodemailer.createTransport({
      host: env.mail.host,
      port: env.mail.port,
      secure: env.mail.secure,
      auth: env.mail.user ? { user: env.mail.user, pass: env.mail.password } : undefined,
    });
  }

  if (isProduction) {
    throw new Error('MAIL_HOST is not configured. Refusing to send email in production.');
  }

  const account = await nodemailer.createTestAccount();
  logger.info('No MAIL_HOST set: using an Ethereal test account for outbound email.', {
    user: account.user,
  });

  return nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: { user: account.user, pass: account.pass },
  });
};

const getTransport = () => {
  // Cache the promise, not the transport, so concurrent callers share one
  // in-flight Ethereal account creation instead of each making their own.
  transportPromise ??= createTransport().catch((error) => {
    // Do not cache a failure: the next call should retry rather than inherit it.
    transportPromise = undefined;
    throw error;
  });
  return transportPromise;
};

/**
 * Sends an email.
 *
 * @param {object} message
 * @param {string} message.to
 * @param {string} message.subject
 * @param {string} message.text Plain-text body (some clients show only this).
 * @param {string} [message.html]
 * @returns {Promise<{ messageId: string, previewUrl: string|false }>}
 */
export const sendMail = async ({ to, subject, text, html }) => {
  const transport = await getTransport();
  const info = await transport.sendMail({ from: env.mail.from, to, subject, text, html });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    logger.info(`Email preview (Ethereal): ${previewUrl}`, { to, subject });
  }

  return { messageId: info.messageId, previewUrl };
};
