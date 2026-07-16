import { query } from '../config/db.js';
import { recordMovement } from '../repositories/inventory.repository.js';
import { ApiError } from '../utils/api-error.js';
import { sendSuccess } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { withTransaction } from '../utils/transaction.js';

/** GET /api/inventory/:pharmacyId */
export const listInventory = asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT pharmacy_inventory.pharmacy_id,
            medicines.id AS medicine_id, medicines.code, medicines.name,
            pharmacy_inventory.stock_quantity,
            pharmacy_inventory.reserved_quantity,
            pharmacy_inventory.stock_quantity - pharmacy_inventory.reserved_quantity AS available_quantity
     FROM pharmacy_inventory
     INNER JOIN medicines ON medicines.id = pharmacy_inventory.medicine_id
     WHERE pharmacy_inventory.pharmacy_id = $1
     ORDER BY medicines.name`,
    [req.params.pharmacyId],
  );

  return sendSuccess(res, { message: 'Inventory retrieved.', data: result.rows });
});

/**
 * POST /api/inventory/:pharmacyId/adjustments
 *
 * `quantity` is a signed delta: positive adds stock, negative removes it.
 */
export const adjustInventory = asyncHandler(async (req, res) => {
  const { medicineId, quantity, movementType = 'ADJUSTMENT' } = req.body;
  const pharmacyId = req.params.pharmacyId;

  const inventory = await withTransaction(async (client) => {
    // The medicine FK would catch this, but as a 23503 mapped to a vague
    // "related record does not exist"; naming the field is more useful.
    const medicine = await client.query('SELECT 1 FROM medicines WHERE id = $1', [medicineId]);
    if (!medicine.rowCount) throw ApiError.badRequest(`Medicine ${medicineId} does not exist.`);

    await client.query(
      `INSERT INTO pharmacy_inventory (pharmacy_id, medicine_id, stock_quantity)
       VALUES ($1, $2, 0) ON CONFLICT (pharmacy_id, medicine_id) DO NOTHING`,
      [pharmacyId, medicineId],
    );

    // The `>= reserved_quantity` guard lives in the UPDATE so a concurrent
    // reservation cannot slip between a check and the write and leave stock
    // below what is already promised to patients.
    const updated = await client.query(
      `UPDATE pharmacy_inventory
       SET stock_quantity = stock_quantity + $1, updated_at = CURRENT_TIMESTAMP
       WHERE pharmacy_id = $2 AND medicine_id = $3 AND stock_quantity + $1 >= reserved_quantity
       RETURNING *`,
      [quantity, pharmacyId, medicineId],
    );
    if (!updated.rowCount) {
      throw ApiError.conflict('Adjustment would make stock lower than reserved quantity.');
    }

    await recordMovement(
      {
        pharmacyId,
        medicineId,
        movementType: movementType === 'IN' ? 'IN' : 'ADJUSTMENT',
        quantity,
      },
      client,
    );

    return updated.rows[0];
  });

  res.locals.auditRecordId = `${pharmacyId}:${medicineId}`;
  return sendSuccess(res, { message: 'Inventory adjusted.', data: inventory });
});
