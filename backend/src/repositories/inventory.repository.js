import { query } from '../config/db.js';

/**
 * Inventory writes.
 *
 * Every mutation here is expected to run inside a transaction, so `client` is
 * required rather than optional: a stock change that is not paired with its
 * movement record and reservation row would corrupt the ledger.
 */

/** Items held by a reservation. */
export const findReservationItems = async (reservationId, client) => {
  const result = await client.query(
    'SELECT medicine_id, quantity FROM reservation_inventory WHERE reservation_id = $1',
    [reservationId],
  );
  return result.rows;
};

/**
 * Holds stock for a reservation.
 *
 * The `stock_quantity - reserved_quantity >= $1` guard is inside the UPDATE on
 * purpose: checking availability with a separate SELECT would leave a window for
 * two concurrent reservations to both pass the check and oversell. Zero rows
 * updated means either no inventory row or not enough free stock.
 *
 * @returns {Promise<boolean>} True when the hold succeeded.
 */
export const holdStock = async ({ pharmacyId, medicineId, quantity }, client) => {
  const result = await client.query(
    `UPDATE pharmacy_inventory
     SET reserved_quantity = reserved_quantity + $1, updated_at = CURRENT_TIMESTAMP
     WHERE pharmacy_id = $2 AND medicine_id = $3 AND stock_quantity - reserved_quantity >= $1
     RETURNING *`,
    [quantity, pharmacyId, medicineId],
  );
  return result.rowCount > 0;
};

/** Releases a hold without shipping the goods (cancel, no-show, expiry). */
export const releaseStock = async ({ pharmacyId, medicineId, quantity }, client) => {
  await client.query(
    `UPDATE pharmacy_inventory
     SET reserved_quantity = reserved_quantity - $1, updated_at = CURRENT_TIMESTAMP
     WHERE pharmacy_id = $2 AND medicine_id = $3`,
    [quantity, pharmacyId, medicineId],
  );
};

/** Ships held stock: drops both the hold and the physical stock. */
export const consumeStock = async ({ pharmacyId, medicineId, quantity }, client) => {
  await client.query(
    `UPDATE pharmacy_inventory
     SET stock_quantity = stock_quantity - $1,
         reserved_quantity = reserved_quantity - $1,
         updated_at = CURRENT_TIMESTAMP
     WHERE pharmacy_id = $2 AND medicine_id = $3`,
    [quantity, pharmacyId, medicineId],
  );
};

/** Appends to the immutable movement ledger. */
export const recordMovement = async (
  { pharmacyId, medicineId, movementType, quantity, reservationId = null },
  client,
) => {
  const runner = client ? client.query.bind(client) : query;
  await runner(
    `INSERT INTO inventory_movements (pharmacy_id, medicine_id, movement_type, quantity, reservation_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [pharmacyId, medicineId, movementType, quantity, reservationId],
  );
};

/** Links a reservation to the quantity it holds of a medicine. */
export const linkReservationItem = async ({ reservationId, medicineId, quantity }, client) => {
  await client.query(
    'INSERT INTO reservation_inventory (reservation_id, medicine_id, quantity) VALUES ($1, $2, $3)',
    [reservationId, medicineId, quantity],
  );
};

/** Medicine names for a set of ids, for error messages. */
export const findMedicineNames = async (medicineIds, client) => {
  const runner = client ? client.query.bind(client) : query;
  const result = await runner(
    'SELECT id, code, name FROM medicines WHERE id = ANY($1::int[])',
    [medicineIds],
  );
  return new Map(result.rows.map((row) => [row.id, row]));
};
