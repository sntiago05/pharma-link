-- PharmaLink: demo users and data for manual testing.
--
-- Password for EVERY user below: Admin1234
-- The hash is the same verified bcrypt digest that 01_ddl.sql uses for the
-- admin account, so these credentials are guaranteed to work.
--
-- Idempotent: safe to run as many times as you want. It never deletes anything.
--
-- NOT auto-run: this file lives in scripts/, not db/, so neither the Docker
-- entrypoint nor `npm run db:migrate` will pick it up. Demo accounts must never
-- appear in a real database by accident.
--
-- Run it with:  npm run db:seed:demo

BEGIN;

-- ---------------------------------------------------------------------------
-- 0. Base catalog
-- ---------------------------------------------------------------------------
-- 01_ddl.sql already inserts "EPS Demo", "Farmacia Central Demo", 3 medicines,
-- their inventory and working hours. These guards re-create them only if you
-- started from an empty or partially cleaned database.

INSERT INTO eps (name, nit, api_key_hash)
SELECT 'EPS Demo', '900123456-7', encode(digest('eps-demo-key', 'sha256'), 'hex')
WHERE NOT EXISTS (SELECT 1 FROM eps);

INSERT INTO pharmacies (name, nit, address, city, inventory_api_url)
SELECT 'Farmacia Central Demo', '901234567-8', 'Calle 10 # 20-30', 'Bogota', 'internal://inventory'
WHERE NOT EXISTS (SELECT 1 FROM pharmacies);

-- A second pharmacy, to see the cross-pharmacy isolation working: the operator
-- below is assigned only to the first one and gets 403 on this one.
INSERT INTO pharmacies (name, nit, address, city, inventory_api_url)
VALUES ('Farmacia Norte Demo', '902222222-1', 'Carrera 50 # 80-15', 'Bogota', 'internal://inventory')
ON CONFLICT (nit) DO NOTHING;

INSERT INTO medicines (code, name, presentation, description) VALUES
  ('MED-001', 'Acetaminofen 500 mg', 'Tabletas x 100', 'Analgesico y antipiretico'),
  ('MED-002', 'Losartan 50 mg', 'Tabletas x 30', 'Antihipertensivo'),
  ('MED-003', 'Metformina 850 mg', 'Tabletas x 30', 'Antidiabetico')
ON CONFLICT (code) DO NOTHING;

-- Both pharmacies serve the EPS. Without this link a patient cannot reserve:
-- the API rejects it with "Pharmacy is not associated with the order EPS".
INSERT INTO eps_pharmacies (eps_id, pharmacy_id)
SELECT eps.id, pharmacies.id
FROM eps CROSS JOIN pharmacies
WHERE eps.name = 'EPS Demo' AND pharmacies.nit IN ('901234567-8', '902222222-1')
ON CONFLICT (eps_id, pharmacy_id) DO UPDATE SET active = TRUE;

-- Working hours define the appointment grid: blocks of 30 min from 08:00 to
-- 17:00, 3 reservations each. Without a row here the pharmacy takes no bookings.
INSERT INTO working_hours (pharmacy_id, opening_time, closing_time, slot_duration, capacity_per_slot)
SELECT id, '08:00', '17:00', 30, 3 FROM pharmacies WHERE nit = '901234567-8'
ON CONFLICT (pharmacy_id) DO NOTHING;

INSERT INTO working_hours (pharmacy_id, opening_time, closing_time, slot_duration, capacity_per_slot)
SELECT id, '07:00', '13:00', 20, 2 FROM pharmacies WHERE nit = '902222222-1'
ON CONFLICT (pharmacy_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 1. Users (password: Admin1234)
-- ---------------------------------------------------------------------------

INSERT INTO users (role_id, full_name, email, password)
SELECT roles.id, data.full_name, data.email,
       '$2b$12$oAQYkV3fUpMZqDX8USd7Wu65OAPQiq2syp3e9unKpoXwZwSMbaQba'
FROM (VALUES
  ('PATIENT',           'Laura Gomez',   'paciente@pharmalink.local'),
  ('PHARMACY_OPERATOR', 'Carlos Ruiz',   'farmacia@pharmalink.local'),
  ('EPS_OPERATOR',      'Marta Salazar', 'eps@pharmalink.local')
) AS data(role_name, full_name, email)
INNER JOIN roles ON roles.name = data.role_name
ON CONFLICT (email) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Role links
-- ---------------------------------------------------------------------------
-- An operator with no link here cannot do anything: GET /api/me returns
-- pharmacy/eps as null and the panel says the account is not assigned.

-- Pharmacy operator -> Farmacia Central Demo only.
INSERT INTO user_pharmacies (user_id, pharmacy_id)
SELECT users.id, pharmacies.id
FROM users CROSS JOIN pharmacies
WHERE users.email = 'farmacia@pharmalink.local' AND pharmacies.nit = '901234567-8'
ON CONFLICT (user_id) DO UPDATE SET pharmacy_id = EXCLUDED.pharmacy_id;

-- EPS operator -> EPS Demo.
INSERT INTO user_eps (user_id, eps_id)
SELECT users.id, eps.id
FROM users CROSS JOIN eps
WHERE users.email = 'eps@pharmalink.local' AND eps.name = 'EPS Demo'
ON CONFLICT (user_id) DO UPDATE SET eps_id = EXCLUDED.eps_id;

-- Patient profile: the EPS plus the document. Without it the patient panel
-- cannot list pharmacies (it needs the EPS to filter by).
INSERT INTO patients (user_id, eps_id, document, phone)
SELECT users.id, eps.id, '1020304050', '3001234567'
FROM users CROSS JOIN eps
WHERE users.email = 'paciente@pharmalink.local' AND eps.name = 'EPS Demo'
ON CONFLICT (user_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Stock
-- ---------------------------------------------------------------------------

INSERT INTO pharmacy_inventory (pharmacy_id, medicine_id, stock_quantity)
SELECT pharmacies.id, medicines.id, 200
FROM pharmacies CROSS JOIN medicines
WHERE pharmacies.nit IN ('901234567-8', '902222222-1')
ON CONFLICT (pharmacy_id, medicine_id) DO NOTHING;

-- MED-003 is left at 5 units in Farmacia Central so the "low stock" alert on the
-- pharmacy dashboard has something to show (the default threshold is 10).
UPDATE pharmacy_inventory SET stock_quantity = 5
WHERE pharmacy_id = (SELECT id FROM pharmacies WHERE nit = '901234567-8')
  AND medicine_id = (SELECT id FROM medicines WHERE code = 'MED-003')
  AND stock_quantity > 5
  AND reserved_quantity <= 5;

-- ---------------------------------------------------------------------------
-- 4. Medical orders for the patient
-- ---------------------------------------------------------------------------
-- Three orders covering the states worth testing: two reservable and one already
-- expired (so it is rejected with "The order has expired").

INSERT INTO medical_orders (patient_id, eps_id, order_number, issue_date, expiration_date, status)
SELECT patients.id, patients.eps_id, data.order_number, data.issue_date, data.expiration_date, 'PENDING'
FROM patients
INNER JOIN users ON users.id = patients.user_id AND users.email = 'paciente@pharmalink.local'
CROSS JOIN (VALUES
  ('ORD-DEMO-001', CURRENT_DATE,      CURRENT_DATE + 60),
  ('ORD-DEMO-002', CURRENT_DATE,      CURRENT_DATE + 30),
  -- Already past its expiration date: the hourly job will flag it EXPIRED.
  ('ORD-DEMO-003', CURRENT_DATE - 90, CURRENT_DATE - 1)
) AS data(order_number, issue_date, expiration_date)
ON CONFLICT (order_number) DO NOTHING;

-- ORD-DEMO-001: two medicines, both in stock -> reservable.
INSERT INTO order_details (order_id, medicine_id, quantity)
SELECT medical_orders.id, medicines.id, data.quantity
FROM medical_orders
CROSS JOIN (VALUES ('MED-001', 2), ('MED-002', 1)) AS data(code, quantity)
INNER JOIN medicines ON medicines.code = data.code
WHERE medical_orders.order_number = 'ORD-DEMO-001'
ON CONFLICT (order_id, medicine_id) DO NOTHING;

-- ORD-DEMO-002: asks for 20 units of MED-003, which only has 5 in Farmacia
-- Central -> that pharmacy shows "Stock insuficiente" and cannot be selected,
-- while Farmacia Norte (200 units) can.
INSERT INTO order_details (order_id, medicine_id, quantity)
SELECT medical_orders.id, medicines.id, 20
FROM medical_orders
INNER JOIN medicines ON medicines.code = 'MED-003'
WHERE medical_orders.order_number = 'ORD-DEMO-002'
ON CONFLICT (order_id, medicine_id) DO NOTHING;

-- ORD-DEMO-003: expired.
INSERT INTO order_details (order_id, medicine_id, quantity)
SELECT medical_orders.id, medicines.id, 1
FROM medical_orders
INNER JOIN medicines ON medicines.code = 'MED-001'
WHERE medical_orders.order_number = 'ORD-DEMO-003'
ON CONFLICT (order_id, medicine_id) DO NOTHING;

COMMIT;

-- ---------------------------------------------------------------------------
-- Summary
-- ---------------------------------------------------------------------------
SELECT roles.name AS rol, users.full_name AS nombre, users.email AS usuario, 'Admin1234' AS password
FROM users
INNER JOIN roles ON roles.id = users.role_id
WHERE users.email IN (
  'admin@pharmalink.local',
  'paciente@pharmalink.local',
  'farmacia@pharmalink.local',
  'eps@pharmalink.local'
)
ORDER BY roles.name;
