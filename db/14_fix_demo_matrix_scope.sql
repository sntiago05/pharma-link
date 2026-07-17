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
