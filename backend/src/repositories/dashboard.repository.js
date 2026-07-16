import { query } from '../config/db.js';

/**
 * Dashboard aggregates.
 *
 * Each dashboard is one round trip: the counters are computed as
 * `COUNT(*) FILTER (WHERE ...)` over a single scan instead of one query per
 * metric. The supporting indexes are in db/02_improvements.sql.
 *
 * `date` is passed in from the service rather than using CURRENT_DATE, so "today"
 * means today in the business timezone and not in the database's UTC clock.
 */

/**
 * Reservation and delivery counters for a pharmacy.
 * @param {number} pharmacyId
 * @param {string} date `YYYY-MM-DD` treated as "today".
 */
export const getPharmacyReservationStats = async (pharmacyId, date) => {
  const result = await query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'RESERVED')                                AS pending_reservations,
       COUNT(*) FILTER (WHERE reservation_date = $2::date)                         AS reservations_today,
       COUNT(*) FILTER (WHERE reservation_date = $2::date AND status = 'RESERVED') AS pending_reservations_today,
       COUNT(*) FILTER (WHERE status = 'CANCELLED')                                AS cancellations,
       COUNT(*) FILTER (WHERE status = 'CANCELLED' AND reservation_date = $2::date) AS cancellations_today,
       COUNT(*) FILTER (WHERE status = 'NO_SHOW')                                  AS no_shows,
       COUNT(*) FILTER (WHERE status = 'COMPLETED')                                AS completed_reservations,
       COUNT(*)                                                                    AS total_reservations
     FROM reservations
     WHERE pharmacy_id = $1`,
    [pharmacyId, date],
  );
  return result.rows[0];
};

/**
 * Deliveries confirmed on a date at a pharmacy.
 *
 * `delivered_at` is a TIMESTAMPTZ, so it is converted to the business timezone
 * before taking its date; comparing the raw timestamp would attribute deliveries
 * made after 19:00 local (00:00 UTC) to the following day.
 */
export const getPharmacyDeliveryStats = async (pharmacyId, date, timezone) => {
  const result = await query(
    `SELECT
       COUNT(*) FILTER (WHERE (deliveries.delivered_at AT TIME ZONE $3)::date = $2::date) AS deliveries_today,
       COUNT(*)                                                                            AS total_deliveries
     FROM deliveries
     INNER JOIN reservations ON reservations.id = deliveries.reservation_id
     WHERE reservations.pharmacy_id = $1`,
    [pharmacyId, date, timezone],
  );
  return result.rows[0];
};

/**
 * Stock health for a pharmacy.
 * @param {number} threshold Stock at or below this is "low".
 */
export const getPharmacyInventoryStats = async (pharmacyId, threshold) => {
  const result = await query(
    `SELECT
       COUNT(*)                                                                  AS tracked_medicines,
       COUNT(*) FILTER (WHERE stock_quantity = 0)                                AS out_of_stock,
       COUNT(*) FILTER (WHERE stock_quantity > 0 AND stock_quantity <= $2)       AS low_stock,
       COUNT(*) FILTER (WHERE stock_quantity - reserved_quantity = 0
                          AND stock_quantity > 0)                                AS fully_reserved,
       COALESCE(SUM(stock_quantity), 0)                                          AS total_units,
       COALESCE(SUM(reserved_quantity), 0)                                       AS reserved_units
     FROM pharmacy_inventory
     WHERE pharmacy_id = $1`,
    [pharmacyId, threshold],
  );
  return result.rows[0];
};

/** The medicines behind the low-stock / out-of-stock counters. */
export const getPharmacyStockAlerts = async (pharmacyId, threshold) => {
  const result = await query(
    `SELECT medicines.id, medicines.code, medicines.name,
            pharmacy_inventory.stock_quantity,
            pharmacy_inventory.reserved_quantity,
            pharmacy_inventory.stock_quantity - pharmacy_inventory.reserved_quantity AS available_quantity,
            CASE WHEN pharmacy_inventory.stock_quantity = 0 THEN 'OUT_OF_STOCK' ELSE 'LOW_STOCK' END AS alert
     FROM pharmacy_inventory
     INNER JOIN medicines ON medicines.id = pharmacy_inventory.medicine_id
     WHERE pharmacy_inventory.pharmacy_id = $1 AND pharmacy_inventory.stock_quantity <= $2
     ORDER BY pharmacy_inventory.stock_quantity, medicines.name`,
    [pharmacyId, threshold],
  );
  return result.rows;
};

/**
 * Order counters for an EPS.
 *
 * `expired` counts orders already past their expiration date as well as those
 * flagged EXPIRED, because the flag is only applied by the hourly job and would
 * otherwise under-report between runs.
 */
export const getEpsOrderStats = async (epsId, date) => {
  const result = await query(
    `SELECT
       COUNT(*)                                                     AS total_orders,
       COUNT(*) FILTER (WHERE status = 'PENDING')                   AS pending_orders,
       COUNT(*) FILTER (WHERE status = 'RESERVED')                  AS reserved_orders,
       COUNT(*) FILTER (WHERE status = 'DELIVERED')                 AS delivered_orders,
       COUNT(*) FILTER (WHERE status = 'CANCELLED')                 AS cancelled_orders,
       COUNT(*) FILTER (WHERE status = 'EXPIRED'
                           OR (status <> 'DELIVERED' AND expiration_date < $2::date)) AS expired_orders,
       COUNT(*) FILTER (WHERE created_at::date = $2::date)          AS orders_created_today,
       COUNT(DISTINCT patient_id)                                   AS total_patients,
       COUNT(DISTINCT patient_id) FILTER (WHERE status = 'DELIVERED') AS patients_served
     FROM medical_orders
     WHERE eps_id = $1`,
    [epsId, date],
  );
  return result.rows[0];
};

/** Pharmacies contracted by an EPS, with their delivery volume. */
export const getEpsPharmacyBreakdown = async (epsId) => {
  const result = await query(
    `SELECT pharmacies.id, pharmacies.name, pharmacies.city,
            COUNT(reservations.id) FILTER (WHERE reservations.status = 'COMPLETED') AS deliveries,
            COUNT(reservations.id) FILTER (WHERE reservations.status = 'RESERVED')  AS active_reservations
     FROM eps_pharmacies
     INNER JOIN pharmacies ON pharmacies.id = eps_pharmacies.pharmacy_id
     LEFT JOIN reservations ON reservations.pharmacy_id = pharmacies.id
       AND reservations.order_id IN (SELECT id FROM medical_orders WHERE eps_id = $1)
     WHERE eps_pharmacies.eps_id = $1 AND eps_pharmacies.active = TRUE
     GROUP BY pharmacies.id, pharmacies.name, pharmacies.city
     ORDER BY pharmacies.name`,
    [epsId],
  );
  return result.rows;
};

/** True when the pharmacy exists. */
export const pharmacyExists = async (pharmacyId) => {
  const result = await query('SELECT 1 FROM pharmacies WHERE id = $1', [pharmacyId]);
  return result.rowCount > 0;
};

/** True when the EPS exists. */
export const epsExists = async (epsId) => {
  const result = await query('SELECT 1 FROM eps WHERE id = $1', [epsId]);
  return result.rowCount > 0;
};
