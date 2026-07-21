import { query } from '../config/db.js';

/**
 * @typedef {object} WorkingHours
 * @property {string} opening_time
 * @property {string} closing_time
 * @property {number} slot_duration Minutes per slot.
 * @property {number} capacity_per_slot Reservations allowed per slot.
 */

/**
 * Working hours for a pharmacy, or undefined when not configured.
 * @param {number} pharmacyId
 * @param {import('pg').PoolClient} [client]
 * @returns {Promise<WorkingHours|undefined>}
 */
export const findWorkingHours = async (pharmacyId, client) => {
  const runner = client ? client.query.bind(client) : query;
  const result = await runner(
    `SELECT pharmacy_id, opening_time, closing_time, slot_duration, capacity_per_slot
     FROM working_hours WHERE pharmacy_id = $1`,
    [pharmacyId],
  );
  return result.rows[0];
};

/**
 * Active reservation count per start time for a pharmacy on a date.
 * @returns {Promise<Map<string, number>>} Keyed by `HH:MM`.
 */
export const countReservationsByStartTime = async (pharmacyId, date, client) => {
  const runner = client ? client.query.bind(client) : query;
  const result = await runner(
    `SELECT start_time, COUNT(*)::int AS count
     FROM reservations
     WHERE pharmacy_id = $1 AND reservation_date = $2 AND status = 'RESERVED'
     GROUP BY start_time`,
    [pharmacyId, date],
  );
  return new Map(result.rows.map((row) => [row.start_time.slice(0, 5), row.count]));
};

/**
 * Active reservations in one slot.
 * @param {number} [excludeReservationId] Ignored when counting for a reschedule,
 *   so a reservation does not count against the slot it is moving into.
 */
export const countReservationsInSlot = async (
  { pharmacyId, date, startTime, excludeReservationId },
  client,
) => {
  const runner = client ? client.query.bind(client) : query;
  const result = await runner(
    `SELECT COUNT(*)::int AS count FROM reservations
     WHERE pharmacy_id = $1 AND reservation_date = $2 AND start_time = $3
       AND status = 'RESERVED' AND ($4::int IS NULL OR id <> $4)`,
    [pharmacyId, date, startTime, excludeReservationId ?? null],
  );
  return result.rows[0].count;
};

/** True when a pharmacy exists and is active. */
export const pharmacyExists = async (pharmacyId) => {
  const result = await query('SELECT 1 FROM pharmacies WHERE id = $1 AND active = TRUE', [pharmacyId]);
  return result.rowCount > 0;
};
