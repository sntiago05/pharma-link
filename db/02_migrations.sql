
-- ==== SOURCE: 02_improvements.sql ====

-- PharmaLink: additive improvements over 01_ddl.sql.
--
-- This file is idempotent on purpose. It runs in two situations:
--   * automatically, by the Docker entrypoint, on a brand-new volume (after 01_ddl.sql);
--   * manually, via `npm run db:migrate`, against an already-populated database.
-- Re-running it must never fail and never destroy data, so every statement is
-- guarded with IF NOT EXISTS / ON CONFLICT. Do not add destructive statements here.

-- ---------------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------------
-- catalog.routes.js already authorises EPS_OPERATOR, but 01_ddl.sql never
-- inserted it: the role only existed if `npm run db:seed` happened to be run.
-- Registering it here makes the schema self-consistent.
INSERT INTO roles (name) VALUES ('ADMIN'), ('PATIENT'), ('PHARMACY_OPERATOR'), ('EPS_OPERATOR')
  ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(40) NOT NULL CHECK (type IN (
    'RESERVATION_CREATED',
    'RESERVATION_CANCELLED',
    'RESERVATION_RESCHEDULED',
    'RESERVATION_DELIVERED',
    'RESERVATION_NO_SHOW',
    'ORDER_EXPIRED'
  )),
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  -- Kept nullable with ON DELETE SET NULL: a notification is a historical record
  -- and must survive the deletion of the entity that triggered it.
  order_id INTEGER REFERENCES medical_orders(id) ON DELETE SET NULL,
  reservation_id INTEGER REFERENCES reservations(id) ON DELETE SET NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Serves the main query: a user's notifications, newest first.
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
-- Partial index for the unread badge; far smaller than a full index on read_at.
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE read_at IS NULL;

-- ---------------------------------------------------------------------------
-- Audit log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- ON DELETE SET NULL, never CASCADE: deleting a user must not erase the trail
  -- of what they did. NULL also covers unauthenticated actions (EPS API).
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(40) NOT NULL,
  table_name VARCHAR(60),
  record_id VARCHAR(60),
  ip_address VARCHAR(45),          -- 45 chars fits IPv6 and IPv4-mapped IPv6.
  endpoint VARCHAR(200),
  http_method VARCHAR(10),
  status_code INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- ---------------------------------------------------------------------------
-- Missing indexes on existing tables
-- ---------------------------------------------------------------------------
-- reservations.order_id backs the order->reservation joins in cancel/reschedule
-- and the FK itself; PostgreSQL does not index FK columns automatically.
CREATE INDEX IF NOT EXISTS idx_reservations_order_id ON reservations(order_id);
-- Partial index for the hot path: active reservations for a pharmacy on a date
-- (capacity checks and available-slots run this on every reservation attempt).
CREATE INDEX IF NOT EXISTS idx_reservations_active_slot
  ON reservations(pharmacy_id, reservation_date, start_time) WHERE status = 'RESERVED';
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);

-- expireOrders() scans by expiration_date and status on every hourly run.
CREATE INDEX IF NOT EXISTS idx_orders_expiration_status ON medical_orders(expiration_date, status);
CREATE INDEX IF NOT EXISTS idx_orders_status ON medical_orders(status);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_reservation_id ON inventory_movements(reservation_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created ON inventory_movements(created_at DESC);
-- user_pharmacies is keyed by user_id; the pharmacy-side lookup had no index.
CREATE INDEX IF NOT EXISTS idx_user_pharmacies_pharmacy_id ON user_pharmacies(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_eps_pharmacies_pharmacy_id ON eps_pharmacies(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_medicine_id ON pharmacy_inventory(medicine_id);

-- ---------------------------------------------------------------------------
-- Patient pre-enrolment and pharmacy branches
-- ---------------------------------------------------------------------------
-- EPS operators can issue an order for a real patient before that person has a
-- PharmaLink account. Keep the patient record, but do not create hidden
-- credentials. Later, when the patient registers, /patients/me links the user
-- to this pre-enrolled row.
ALTER TABLE patients ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS full_name VARCHAR(150);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS email VARCHAR(150);

-- A row in pharmacies remains the operational location used by inventory,
-- schedules and reservations. parent_pharmacy_id lets several locations be
-- grouped as branches of one pharmacy brand without changing those FKs.
ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS parent_pharmacy_id INTEGER REFERENCES pharmacies(id);
CREATE INDEX IF NOT EXISTS idx_pharmacies_parent_id ON pharmacies(parent_pharmacy_id);

-- ==== SOURCE: 03_user_eps.sql ====

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

-- ==== SOURCE: 05_password_resets.sql ====

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

-- ==== SOURCE: 06_pharmacy_change_requests.sql ====

-- Approval queue for branch-management changes proposed by matrix operators.
CREATE TABLE IF NOT EXISTS pharmacy_change_requests (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id),
  requested_by INTEGER NOT NULL REFERENCES users(id),
  action VARCHAR(20) NOT NULL CHECK (action IN ('ACTIVATE', 'DEACTIVATE', 'DELETE')),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_change_requests_pending
  ON pharmacy_change_requests (status, created_at DESC);

-- ==== SOURCE: 08_unique_pending_branch_requests.sql ====

-- A branch may have one pending request per action. Different actions (for
-- example deactivation and deletion) remain independently requestable.
WITH duplicated AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY pharmacy_id, action ORDER BY created_at, id) AS position
  FROM pharmacy_change_requests
  WHERE status = 'PENDING'
)
UPDATE pharmacy_change_requests
SET status = 'REJECTED', reviewed_at = CURRENT_TIMESTAMP
WHERE id IN (SELECT id FROM duplicated WHERE position > 1);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_branch_request
  ON pharmacy_change_requests (pharmacy_id, action)
  WHERE status = 'PENDING';

-- ==== SOURCE: 09_branch_request_notification_type.sql ====

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
  'RESERVATION_CREATED', 'RESERVATION_CANCELLED', 'RESERVATION_RESCHEDULED',
  'RESERVATION_DELIVERED', 'RESERVATION_NO_SHOW', 'ORDER_EXPIRED',
  'BRANCH_REQUEST_REVIEWED'
));

-- ==== SOURCE: 10_remove_user_contact_details.sql ====

-- Contact data belongs to patient profiles, not generic user accounts.
DROP INDEX IF EXISTS idx_users_document_unique;
ALTER TABLE users DROP COLUMN IF EXISTS document;
ALTER TABLE users DROP COLUMN IF EXISTS phone;

-- ==== SOURCE: 11_expand_demo_catalog.sql ====

-- Extra catalog data for local demos. Idempotent and additive.
INSERT INTO eps (name, nit, api_key_hash)
VALUES
  ('EPS Andina', '901000001-1', encode(digest('eps-andina-key', 'sha256'), 'hex')),
  ('EPS Caribe', '901000002-2', encode(digest('eps-caribe-key', 'sha256'), 'hex'))
ON CONFLICT (nit) DO NOTHING;

INSERT INTO medicines (code, name, presentation, description) VALUES
 ('MED-004','Amoxicilina 500 mg','Cápsulas x 21','Antibiótico'),
 ('MED-005','Atorvastatina 20 mg','Tabletas x 30','Hipolipemiante'),
 ('MED-006','Omeprazol 20 mg','Cápsulas x 30','Protección gástrica'),
 ('MED-007','Salbutamol','Inhalador','Broncodilatador'),
 ('MED-008','Loratadina 10 mg','Tabletas x 10','Antihistamínico'),
 ('MED-009','Diclofenaco 50 mg','Tabletas x 20','Antiinflamatorio'),
 ('MED-010','Amlodipino 5 mg','Tabletas x 30','Antihipertensivo')
ON CONFLICT (code) DO NOTHING;

-- ==== SOURCE: 12_expand_demo_pharmacies.sql ====

-- Six matrices (two per EPS) and three branches for each matrix.
INSERT INTO pharmacies (name, nit, address, city, inventory_api_url)
SELECT 'Farmacia ' || eps.name || ' ' || series.n,
       '910' || lpad(eps.id::text, 3, '0') || lpad(series.n::text, 2, '0'),
       'Dirección matriz ' || series.n, 'Bogotá', 'internal://inventory'
FROM eps CROSS JOIN generate_series(1, 2) AS series(n)
ON CONFLICT (nit) DO NOTHING;

INSERT INTO eps_pharmacies (eps_id, pharmacy_id)
SELECT eps.id, pharmacies.id FROM eps
INNER JOIN pharmacies ON pharmacies.name LIKE 'Farmacia ' || eps.name || ' %'
ON CONFLICT (eps_id, pharmacy_id) DO UPDATE SET active = TRUE;

INSERT INTO pharmacies (name, nit, address, city, inventory_api_url, parent_pharmacy_id)
SELECT parent.name || ' - Sede ' || series.n,
       parent.nit || '-' || series.n,
       'Dirección sede ' || series.n, parent.city, 'internal://inventory', parent.id
FROM pharmacies parent CROSS JOIN generate_series(1, 3) AS series(n)
WHERE parent.parent_pharmacy_id IS NULL AND parent.name LIKE 'Farmacia %'
ON CONFLICT (nit) DO NOTHING;

INSERT INTO pharmacy_inventory (pharmacy_id, medicine_id, stock_quantity)
SELECT branch.id, medicine.id, 10 + ((branch.id * medicine.id) % 91)
FROM pharmacies branch CROSS JOIN (SELECT id FROM medicines ORDER BY id LIMIT 4) medicine
WHERE branch.parent_pharmacy_id IS NOT NULL
ON CONFLICT (pharmacy_id, medicine_id) DO NOTHING;

INSERT INTO working_hours (pharmacy_id, opening_time, closing_time, slot_duration, capacity_per_slot)
SELECT id,
  CASE id % 3 WHEN 0 THEN '08:00'::time WHEN 1 THEN '14:00'::time ELSE '00:00'::time END,
  CASE id % 3 WHEN 0 THEN '14:00'::time WHEN 1 THEN '23:00'::time ELSE '23:59'::time END,
  CASE id % 3 WHEN 0 THEN 15 WHEN 1 THEN 30 ELSE 60 END,
  3
FROM pharmacies WHERE parent_pharmacy_id IS NOT NULL
ON CONFLICT (pharmacy_id) DO NOTHING;

-- ==== SOURCE: 13_expand_demo_inventory.sql ====

-- 12_expand_demo_pharmacies.sql only stocked the first 4 medicines per branch.
-- This fills in the remaining 6 (MED-005..MED-010) so every one of the 18
-- demo branches carries the full 10-medicine catalog. Additive and idempotent.
INSERT INTO pharmacy_inventory (pharmacy_id, medicine_id, stock_quantity)
SELECT branch.id, medicine.id, 10 + ((branch.id * medicine.id) % 91)
FROM pharmacies branch
CROSS JOIN (SELECT id FROM medicines ORDER BY id OFFSET 4) medicine
WHERE branch.parent_pharmacy_id IS NOT NULL
ON CONFLICT (pharmacy_id, medicine_id) DO NOTHING;

-- ==== SOURCE: 14_fix_demo_matrix_scope.sql ====

-- 12_expand_demo_pharmacies.sql matches sede parents with
-- `name LIKE 'Farmacia %'`, which also catches the baseline "Farmacia Central
-- Demo" pharmacy from 01_ddl.sql. That gave it 3 unintended demo sedes on top
-- of the 6 matrices / 18 sedes meant for the 3 seeded EPS, so a fresh database
-- ends up with 7 matrices / 21 sedes instead of 6 / 18.
--
-- This removes exactly those 3 accidental sedes (identified by the
-- "<central-nit>-<n>" pattern 12_expand_demo_pharmacies.sql generated for
-- them) and their dependent rows. Safe on a database that never had the bug
-- (the DELETEs simply match zero rows).
DELETE FROM pharmacy_inventory
WHERE pharmacy_id IN (
  SELECT sede.id FROM pharmacies sede
  INNER JOIN pharmacies parent ON parent.id = sede.parent_pharmacy_id
  WHERE parent.nit = '901234567-8' AND sede.nit LIKE parent.nit || '-_'
);

DELETE FROM working_hours
WHERE pharmacy_id IN (
  SELECT sede.id FROM pharmacies sede
  INNER JOIN pharmacies parent ON parent.id = sede.parent_pharmacy_id
  WHERE parent.nit = '901234567-8' AND sede.nit LIKE parent.nit || '-_'
);

DELETE FROM pharmacies sede
USING pharmacies parent
WHERE parent.id = sede.parent_pharmacy_id
  AND parent.nit = '901234567-8'
  AND sede.nit LIKE parent.nit || '-_';
