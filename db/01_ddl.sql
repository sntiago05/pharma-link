-- PharmaLink: complete schema and development seed data.
-- This file is intended for a NEW PostgreSQL database.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE roles (id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, name VARCHAR(50) NOT NULL UNIQUE);
CREATE TABLE users (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  role_id INTEGER NOT NULL REFERENCES roles(id), full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE, password VARCHAR(255) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE eps (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(150) NOT NULL, nit VARCHAR(30) NOT NULL UNIQUE,
  api_key_hash VARCHAR(64) NOT NULL UNIQUE, active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE pharmacies (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(150) NOT NULL, nit VARCHAR(30) UNIQUE, address VARCHAR(200), city VARCHAR(80),
  inventory_api_url TEXT NOT NULL, api_key VARCHAR(255), active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE user_pharmacies (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id), created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE patients (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id), eps_id INTEGER NOT NULL REFERENCES eps(id),
  document VARCHAR(30) NOT NULL UNIQUE, phone VARCHAR(20)
);
CREATE TABLE eps_pharmacies (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, eps_id INTEGER NOT NULL REFERENCES eps(id),
  pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id), active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(eps_id, pharmacy_id)
);
CREATE TABLE medicines (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, code VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL, presentation VARCHAR(100), description TEXT
);
CREATE TABLE medical_orders (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, patient_id INTEGER NOT NULL REFERENCES patients(id),
  eps_id INTEGER NOT NULL REFERENCES eps(id), order_number VARCHAR(100) NOT NULL UNIQUE,
  issue_date DATE NOT NULL, expiration_date DATE NOT NULL CHECK (expiration_date >= issue_date),
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','RESERVED','DELIVERED','CANCELLED','EXPIRED')),
  cancellation_count INTEGER NOT NULL DEFAULT 0 CHECK (cancellation_count >= 0),
  reschedule_count INTEGER NOT NULL DEFAULT 0 CHECK (reschedule_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE order_details (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES medical_orders(id) ON DELETE CASCADE,
  medicine_id INTEGER NOT NULL REFERENCES medicines(id), quantity INTEGER NOT NULL CHECK (quantity > 0), UNIQUE(order_id, medicine_id)
);
CREATE TABLE working_hours (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, pharmacy_id INTEGER NOT NULL UNIQUE REFERENCES pharmacies(id),
  opening_time TIME NOT NULL, closing_time TIME NOT NULL, slot_duration INTEGER NOT NULL CHECK (slot_duration > 0),
  capacity_per_slot INTEGER NOT NULL CHECK (capacity_per_slot > 0), CHECK (closing_time > opening_time)
);
CREATE TABLE reservations (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES medical_orders(id),
  pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id), reservation_date DATE NOT NULL, start_time TIME NOT NULL,
  end_time TIME NOT NULL, status VARCHAR(30) NOT NULL DEFAULT 'RESERVED' CHECK (status IN ('RESERVED','CANCELLED','COMPLETED','NO_SHOW','EXPIRED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, CHECK (end_time > start_time)
);
CREATE TABLE deliveries (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, reservation_id INTEGER NOT NULL UNIQUE REFERENCES reservations(id),
  delivered_at TIMESTAMPTZ, delivered_by VARCHAR(150)
);
CREATE TABLE pharmacy_inventory (
  pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id), medicine_id INTEGER NOT NULL REFERENCES medicines(id),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0 AND reserved_quantity <= stock_quantity),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (pharmacy_id, medicine_id)
);
CREATE TABLE reservation_inventory (
  reservation_id INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE, medicine_id INTEGER NOT NULL REFERENCES medicines(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0), PRIMARY KEY (reservation_id, medicine_id)
);
CREATE TABLE inventory_movements (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id),
  medicine_id INTEGER NOT NULL REFERENCES medicines(id),
  movement_type VARCHAR(30) NOT NULL CHECK (movement_type IN ('IN','ADJUSTMENT','RESERVATION','RELEASE','DELIVERY')),
  quantity INTEGER NOT NULL CHECK (quantity <> 0), reservation_id INTEGER REFERENCES reservations(id), created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE eps_api_requests (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, eps_id INTEGER NOT NULL REFERENCES eps(id), order_number VARCHAR(100),
  received_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, status_code INTEGER NOT NULL, payload JSONB NOT NULL
);

CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_patients_eps_id ON patients(eps_id);
CREATE INDEX idx_orders_patient_id ON medical_orders(patient_id);
CREATE INDEX idx_orders_eps_id ON medical_orders(eps_id);
CREATE INDEX idx_order_details_medicine_id ON order_details(medicine_id);
CREATE INDEX idx_reservations_pharmacy_date ON reservations(pharmacy_id, reservation_date);
CREATE INDEX idx_inventory_movements_pharmacy_id ON inventory_movements(pharmacy_id);
CREATE INDEX idx_eps_api_requests_eps_id ON eps_api_requests(eps_id);

INSERT INTO roles (name) VALUES ('ADMIN'), ('PATIENT'), ('PHARMACY_OPERATOR') ON CONFLICT (name) DO NOTHING;
-- Development account: admin@pharmalink.local / Admin1234. Change or remove outside local development.
INSERT INTO users (role_id, full_name, email, password)
SELECT id, 'PharmaLink Administrator', 'admin@pharmalink.local', '$2b$12$oAQYkV3fUpMZqDX8USd7Wu65OAPQiq2syp3e9unKpoXwZwSMbaQba' FROM roles WHERE name = 'ADMIN';
-- Development EPS API key: eps-demo-key. Send it in X-API-Key; do not use it outside development.
INSERT INTO eps (name, nit, api_key_hash) VALUES ('EPS Demo', '900123456-7', encode(digest('eps-demo-key', 'sha256'), 'hex'));
INSERT INTO pharmacies (name, nit, address, city, inventory_api_url) VALUES ('Farmacia Central Demo', '901234567-8', 'Calle 10 # 20-30', 'Bogota', 'internal://inventory');
INSERT INTO eps_pharmacies (eps_id, pharmacy_id) VALUES (1, 1);
INSERT INTO working_hours (pharmacy_id, opening_time, closing_time, slot_duration, capacity_per_slot) VALUES (1, '08:00', '17:00', 30, 3);
INSERT INTO medicines (code, name, presentation, description) VALUES
  ('MED-001', 'Acetaminofen 500 mg', 'Tabletas x 100', 'Analgesico y antipiretico'),
  ('MED-002', 'Losartan 50 mg', 'Tabletas x 30', 'Antihipertensivo'),
  ('MED-003', 'Metformina 850 mg', 'Tabletas x 30', 'Antidiabetico');
INSERT INTO pharmacy_inventory (pharmacy_id, medicine_id, stock_quantity) VALUES (1, 1, 200), (1, 2, 100), (1, 3, 100);
INSERT INTO inventory_movements (pharmacy_id, medicine_id, movement_type, quantity) VALUES (1, 1, 'IN', 200), (1, 2, 'IN', 100), (1, 3, 'IN', 100);
