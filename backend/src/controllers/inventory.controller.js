import { pool, query } from '../config/db.js';

export const listInventory = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT pharmacy_inventory.pharmacy_id, medicines.id AS medicine_id, medicines.code, medicines.name,
       pharmacy_inventory.stock_quantity, pharmacy_inventory.reserved_quantity,
       pharmacy_inventory.stock_quantity - pharmacy_inventory.reserved_quantity AS available_quantity
       FROM pharmacy_inventory INNER JOIN medicines ON medicines.id = pharmacy_inventory.medicine_id
       WHERE pharmacy_inventory.pharmacy_id = $1 ORDER BY medicines.name`, [req.params.pharmacyId],
    );
    res.json({ data: result.rows });
  } catch (error) { next(error); }
};

export const adjustInventory = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { medicineId, quantity, movementType = 'ADJUSTMENT' } = req.body;
    if (!Number.isInteger(medicineId) || !Number.isInteger(quantity) || quantity === 0) return res.status(400).json({ message: 'medicineId and a non-zero integer quantity are required.' });
    await client.query('BEGIN');
    await client.query(`INSERT INTO pharmacy_inventory (pharmacy_id, medicine_id, stock_quantity)
      VALUES ($1, $2, 0) ON CONFLICT (pharmacy_id, medicine_id) DO NOTHING`, [req.params.pharmacyId, medicineId]);
    const inventory = await client.query(`UPDATE pharmacy_inventory SET stock_quantity = stock_quantity + $1, updated_at = CURRENT_TIMESTAMP
      WHERE pharmacy_id = $2 AND medicine_id = $3 AND stock_quantity + $1 >= reserved_quantity RETURNING *`, [quantity, req.params.pharmacyId, medicineId]);
    if (!inventory.rowCount) { const error = new Error('Adjustment would make stock lower than reserved quantity.'); error.statusCode = 409; throw error; }
    await client.query('INSERT INTO inventory_movements (pharmacy_id, medicine_id, movement_type, quantity) VALUES ($1, $2, $3, $4)', [req.params.pharmacyId, medicineId, movementType === 'IN' ? 'IN' : 'ADJUSTMENT', quantity]);
    await client.query('COMMIT'); res.json({ data: inventory.rows[0] });
  } catch (error) { await client.query('ROLLBACK'); next(error); } finally { client.release(); }
};
