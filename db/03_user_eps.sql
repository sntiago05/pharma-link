-- Links an EPS operator to the EPS they work for.
--
-- Mirrors `user_pharmacies`, which already scopes PHARMACY_OPERATOR users to a
-- pharmacy. No equivalent existed for EPS_OPERATOR, so there was no way to tell
-- which EPS an operator belongs to. The EPS dashboard needs that link: without
-- it, any EPS operator could read every other EPS's statistics.
--
-- Idempotent and additive: safe to re-run.

CREATE TABLE IF NOT EXISTS user_eps (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  eps_id INTEGER NOT NULL REFERENCES eps(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- user_id is the primary key, so the EPS-side lookup needs its own index.
CREATE INDEX IF NOT EXISTS idx_user_eps_eps_id ON user_eps(eps_id);
