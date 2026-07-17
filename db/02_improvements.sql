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
