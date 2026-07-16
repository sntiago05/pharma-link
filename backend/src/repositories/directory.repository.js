import { query } from '../config/db.js';

/**
 * Read-only directory of catalog data for authenticated end users.
 *
 * Separate from catalog.repository concerns on purpose: `/api/catalog/*` is the
 * admin surface and returns operational columns, while these queries expose only
 * fields that are safe for a patient to see. Credentials (`api_key`,
 * `api_key_hash`) and internal endpoints (`inventory_api_url`) are never
 * selected here.
 */

/** EPS list for profile creation. Active only. */
export const listEps = async () => {
  const result = await query(
    'SELECT id, name, nit FROM eps WHERE active = TRUE ORDER BY name',
  );
  return result.rows;
};

/** Medicine catalog. */
export const listMedicines = async ({ search } = {}) => {
  const params = [];
  let where = '';

  if (search) {
    params.push(`%${search}%`);
    where = `WHERE name ILIKE $1 OR code ILIKE $1`;
  }

  const result = await query(
    `SELECT id, code, name, presentation, description
     FROM medicines ${where} ORDER BY name`,
    params,
  );
  return result.rows;
};

/**
 * Pharmacies visible to a caller.
 *
 * When `epsId` is given (the patient's EPS), only pharmacies contracted by that
 * EPS are returned — the same rule the reservation service enforces, so the UI
 * cannot offer a pharmacy that would then be rejected with
 * "Pharmacy is not associated with the order EPS".
 *
 * `hasWorkingHours` lets the UI hide pharmacies that cannot take appointments
 * yet instead of sending the user to an empty slot list.
 */
export const listPharmacies = async ({ epsId, city, medicineId } = {}) => {
  const conditions = ['pharmacies.active = TRUE'];
  const params = [];
  let joins = '';

  if (epsId != null) {
    params.push(epsId);
    joins += ` INNER JOIN eps_pharmacies ON eps_pharmacies.pharmacy_id = pharmacies.id
               AND eps_pharmacies.eps_id = $${params.length} AND eps_pharmacies.active = TRUE`;
  }

  if (medicineId != null) {
    params.push(medicineId);
    joins += ` INNER JOIN pharmacy_inventory ON pharmacy_inventory.pharmacy_id = pharmacies.id
               AND pharmacy_inventory.medicine_id = $${params.length}
               AND pharmacy_inventory.stock_quantity - pharmacy_inventory.reserved_quantity > 0`;
  }

  if (city) {
    params.push(city);
    conditions.push(`pharmacies.city ILIKE $${params.length}`);
  }

  const result = await query(
    `SELECT pharmacies.id, pharmacies.name, pharmacies.address, pharmacies.city,
            working_hours.opening_time, working_hours.closing_time,
            working_hours.slot_duration, working_hours.capacity_per_slot,
            (working_hours.pharmacy_id IS NOT NULL) AS has_working_hours
     FROM pharmacies
     LEFT JOIN working_hours ON working_hours.pharmacy_id = pharmacies.id
     ${joins}
     WHERE ${conditions.join(' AND ')}
     ORDER BY pharmacies.name`,
    params,
  );
  return result.rows;
};

/**
 * Availability of an order's medicines at each pharmacy of its EPS.
 *
 * Answers the question the patient actually has — "where can I pick this order
 * up?" — in one query, rather than making the UI fan out one inventory request
 * per pharmacy. `is_complete` is true only when every line of the order can be
 * served in full, which is exactly the condition the reservation will check.
 */
export const findPharmaciesForOrder = async (orderId) => {
  const result = await query(
    `WITH order_lines AS (
       SELECT order_details.medicine_id, order_details.quantity
       FROM order_details WHERE order_details.order_id = $1
     ),
     eps_of_order AS (
       SELECT eps_id FROM medical_orders WHERE id = $1
     )
     SELECT pharmacies.id,
            pharmacies.name,
            pharmacies.address,
            pharmacies.city,
            (working_hours.pharmacy_id IS NOT NULL) AS has_working_hours,
            BOOL_AND(
              COALESCE(pharmacy_inventory.stock_quantity - pharmacy_inventory.reserved_quantity, 0)
                >= order_lines.quantity
            ) AS is_complete,
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'medicineId', medicines.id,
                'code', medicines.code,
                'name', medicines.name,
                'required', order_lines.quantity,
                'available', COALESCE(pharmacy_inventory.stock_quantity - pharmacy_inventory.reserved_quantity, 0)
              ) ORDER BY medicines.name
            ) AS items
     FROM eps_pharmacies
     INNER JOIN eps_of_order ON eps_of_order.eps_id = eps_pharmacies.eps_id
     INNER JOIN pharmacies ON pharmacies.id = eps_pharmacies.pharmacy_id AND pharmacies.active = TRUE
     CROSS JOIN order_lines
     INNER JOIN medicines ON medicines.id = order_lines.medicine_id
     LEFT JOIN pharmacy_inventory ON pharmacy_inventory.pharmacy_id = pharmacies.id
       AND pharmacy_inventory.medicine_id = order_lines.medicine_id
     LEFT JOIN working_hours ON working_hours.pharmacy_id = pharmacies.id
     WHERE eps_pharmacies.active = TRUE
     GROUP BY pharmacies.id, pharmacies.name, pharmacies.address, pharmacies.city, working_hours.pharmacy_id
     ORDER BY is_complete DESC, pharmacies.name`,
    [orderId],
  );
  return result.rows;
};
