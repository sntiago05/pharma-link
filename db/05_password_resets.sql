-- Password reset tokens.
--
-- Idempotent and additive: safe to re-run.

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Only the SHA-256 digest is stored, never the token itself. A leaked database
  -- dump must not hand out working reset links, exactly as with eps.api_key_hash.
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  -- Stamped the moment the token is spent, which is what makes it single-use.
  used_at TIMESTAMPTZ,
  requested_ip VARCHAR(45),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- The lookup on redeem is by hash; UNIQUE already indexes it.
-- This one serves "invalidate every other live token for this user".
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user
  ON password_reset_tokens(user_id) WHERE used_at IS NULL;

-- Supports purging expired rows.
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires
  ON password_reset_tokens(expires_at);
