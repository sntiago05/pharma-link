-- 12_expand_demo_pharmacies.sql only stocked the first 4 medicines per branch.
-- This fills in the remaining 6 (MED-005..MED-010) so every one of the 18
-- demo branches carries the full 10-medicine catalog. Additive and idempotent.
INSERT INTO pharmacy_inventory (pharmacy_id, medicine_id, stock_quantity)
SELECT branch.id, medicine.id, 10 + ((branch.id * medicine.id) % 91)
FROM pharmacies branch
CROSS JOIN (SELECT id FROM medicines ORDER BY id OFFSET 4) medicine
WHERE branch.parent_pharmacy_id IS NOT NULL
ON CONFLICT (pharmacy_id, medicine_id) DO NOTHING;
