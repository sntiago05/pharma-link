import { env } from '../config/env.js';

/** Escapes user-supplied text before it goes into the HTML body. */
const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Password reset email.
 *
 * The link is the credential, so the copy states the expiry and tells the reader
 * what to do if they did not ask for it. A plain-text part is always included:
 * many clients (and spam filters) treat HTML-only mail as suspicious.
 *
 * @param {object} input
 * @param {string} input.fullName
 * @param {string} input.resetUrl
 * @param {number} input.expiresInMinutes
 */
export const passwordResetEmail = ({ fullName, resetUrl, expiresInMinutes }) => {
  const name = escapeHtml(fullName || 'Hola');
  const url = escapeHtml(resetUrl);

  const subject = 'Restablece tu contraseña de PharmaLink';

  const text = [
    `${fullName || 'Hola'},`,
    '',
    'Recibimos una solicitud para restablecer la contraseña de tu cuenta de PharmaLink.',
    'Abre este enlace para crear una nueva contraseña:',
    '',
    resetUrl,
    '',
    `El enlace caduca en ${expiresInMinutes} minutos y solo puede usarse una vez.`,
    '',
    'Si no solicitaste este cambio, ignora este correo: tu contraseña seguirá igual.',
    '',
    '— PharmaLink',
  ].join('\n');

  const html = `
    <div style="margin:0;padding:24px;background:#f8fafc;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
      <table role="presentation" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #e2e8f0;">
        <tr><td>
          <p style="margin:0 0 4px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;">Pharma Link</p>
          <h1 style="margin:0 0 16px;font-size:22px;color:#0D4D44;">Restablece tu contraseña</h1>

          <p style="margin:0 0 16px;font-size:15px;color:#334155;">${name},</p>
          <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.6;">
            Recibimos una solicitud para restablecer la contraseña de tu cuenta.
            Pulsa el botón para crear una nueva.
          </p>

          <p style="margin:0 0 24px;text-align:center;">
            <a href="${url}"
               style="display:inline-block;padding:14px 28px;border-radius:28px;background:#0D4D44;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">
              Crear nueva contraseña
            </a>
          </p>

          <p style="margin:0 0 8px;font-size:13px;color:#64748b;line-height:1.6;">
            El enlace caduca en <strong>${expiresInMinutes} minutos</strong> y solo puede usarse una vez.
          </p>
          <p style="margin:0 0 24px;font-size:13px;color:#64748b;line-height:1.6;">
            Si no solicitaste este cambio, ignora este correo: tu contraseña seguirá igual.
          </p>

          <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;word-break:break-all;">
            ¿El botón no funciona? Copia esta dirección en tu navegador:<br>${url}
          </p>
        </td></tr>
      </table>
    </div>
  `;

  return { subject, text, html };
};

/** Builds the frontend URL that redeems a reset token. */
export const buildResetUrl = (token) =>
  `${env.appUrl}/reset-password?token=${encodeURIComponent(token)}`;
