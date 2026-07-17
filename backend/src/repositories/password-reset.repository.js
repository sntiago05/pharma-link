import { query } from '../config/db.js';

/**
 * Password reset tokens.
 *
 * Only digests are handled here: the plaintext token exists solely in the email.
 */

/** Stores a token digest for a user. */
export const insertToken = async ({ userId, tokenHash, expiresAt, requestedIp }, client) => {
  const runner = client ? client.query.bind(client) : query;
  const result = await runner(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, requested_ip)
     VALUES ($1, $2, $3, $4)
     RETURNING id, user_id, expires_at`,
    [userId, tokenHash, expiresAt, requestedIp ?? null],
  );
  return result.rows[0];
};

/**
 * Marks every live token of a user as used.
 *
 * Called when a new link is issued and again after a successful reset, so only
 * the newest link ever works and any link an attacker may hold dies with it.
 */
export const invalidateUserTokens = async (userId, client) => {
  const runner = client ? client.query.bind(client) : query;
  const result = await runner(
    `UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP
     WHERE user_id = $1 AND used_at IS NULL`,
    [userId],
  );
  return result.rowCount;
};

/**
 * Finds a live token by digest and locks it.
 *
 * `FOR UPDATE` closes the race where the same link is redeemed twice at once:
 * the second transaction waits, then sees used_at set and rejects.
 *
 * @returns {Promise<{ id: number, user_id: number, email: string, full_name: string }|undefined>}
 */
export const findLiveTokenForUpdate = async (tokenHash, client) => {
  const result = await client.query(
    `SELECT password_reset_tokens.id,
            password_reset_tokens.user_id,
            users.email,
            users.full_name,
            users.active
     FROM password_reset_tokens
     INNER JOIN users ON users.id = password_reset_tokens.user_id
     WHERE password_reset_tokens.token_hash = $1
       AND password_reset_tokens.used_at IS NULL
       AND password_reset_tokens.expires_at > CURRENT_TIMESTAMP
     FOR UPDATE OF password_reset_tokens`,
    [tokenHash],
  );
  return result.rows[0];
};

/** Spends a token. */
export const markTokenUsed = async (id, client) => {
  await client.query(
    'UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = $1',
    [id],
  );
};

/** Updates a user's password hash. */
export const updateUserPassword = async ({ userId, passwordHash }, client) => {
  const runner = client ? client.query.bind(client) : query;
  await runner('UPDATE users SET password = $1 WHERE id = $2', [passwordHash, userId]);
};

/**
 * How many links a user requested since a moment.
 *
 * Backs the per-account throttle. The IP rate limiter alone would not stop a
 * distributed attempt to flood one person's inbox.
 */
export const countRecentTokens = async ({ userId, since }) => {
  const result = await query(
    'SELECT COUNT(*)::int AS count FROM password_reset_tokens WHERE user_id = $1 AND created_at > $2',
    [userId, since],
  );
  return result.rows[0].count;
};

/** Deletes spent or expired rows. Housekeeping; not required for correctness. */
export const purgeStaleTokens = async () => {
  const result = await query(
    `DELETE FROM password_reset_tokens
     WHERE expires_at < CURRENT_TIMESTAMP - INTERVAL '7 days'
        OR used_at < CURRENT_TIMESTAMP - INTERVAL '7 days'`,
  );
  return result.rowCount;
};
