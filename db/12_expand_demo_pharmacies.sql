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
