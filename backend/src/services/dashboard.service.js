import { env } from '../config/env.js';
import {
  epsExists,
  getEpsOrderStats,
  getEpsPharmacyBreakdown,
  getPharmacyDeliveryStats,
  getPharmacyInventoryStats,
  getPharmacyReservationStats,
  getPharmacyStockAlerts,
  pharmacyExists,
} from '../repositories/dashboard.repository.js';
import { ApiError } from '../utils/api-error.js';
import { today } from '../utils/dates.js';

/**
 * Dashboard aggregation.
 *
 * `COUNT(*)` comes back from pg as a string (counts are bigint, which does not
 * fit JS numbers safely), so every counter is coerced here. Returning them raw
 * would make clients do arithmetic on strings — `"3" + 1 === "31"`.
 */
const toNumbers = (row) =>
  Object.fromEntries(Object.entries(row).map(([key, value]) => [key, Number(value)]));

/**
 * Pharmacy dashboard: reservations, deliveries and stock health.
 * @param {number} pharmacyId
 * @returns {Promise<object>}
 */
export const getPharmacyDashboard = async (pharmacyId) => {
  if (!(await pharmacyExists(pharmacyId))) throw ApiError.notFound('Pharmacy not found.');

  const date = today();
  const threshold = env.lowStockThreshold;

  const [reservations, deliveries, inventory, alerts] = await Promise.all([
    getPharmacyReservationStats(pharmacyId, date),
    getPharmacyDeliveryStats(pharmacyId, date, env.timezone),
    getPharmacyInventoryStats(pharmacyId, threshold),
    getPharmacyStockAlerts(pharmacyId, threshold),
  ]);

  const reservationCounts = toNumbers(reservations);
  const deliveryCounts = toNumbers(deliveries);
  const inventoryCounts = toNumbers(inventory);

  return {
    pharmacyId: Number(pharmacyId),
    date,
    lowStockThreshold: threshold,
    reservations: {
      pending: reservationCounts.pending_reservations,
      today: reservationCounts.reservations_today,
      pendingToday: reservationCounts.pending_reservations_today,
      cancellations: reservationCounts.cancellations,
      cancellationsToday: reservationCounts.cancellations_today,
      noShows: reservationCounts.no_shows,
      completed: reservationCounts.completed_reservations,
      total: reservationCounts.total_reservations,
    },
    deliveries: {
      today: deliveryCounts.deliveries_today,
      total: deliveryCounts.total_deliveries,
    },
    inventory: {
      trackedMedicines: inventoryCounts.tracked_medicines,
      lowStock: inventoryCounts.low_stock,
      outOfStock: inventoryCounts.out_of_stock,
      fullyReserved: inventoryCounts.fully_reserved,
      totalUnits: inventoryCounts.total_units,
      reservedUnits: inventoryCounts.reserved_units,
      availableUnits: inventoryCounts.total_units - inventoryCounts.reserved_units,
    },
    stockAlerts: alerts.map((alert) => ({
      medicineId: alert.id,
      code: alert.code,
      name: alert.name,
      stockQuantity: alert.stock_quantity,
      reservedQuantity: alert.reserved_quantity,
      availableQuantity: alert.available_quantity,
      alert: alert.alert,
    })),
  };
};

/**
 * EPS dashboard: order lifecycle and patients served.
 * @param {number} epsId
 * @returns {Promise<object>}
 */
export const getEpsDashboard = async (epsId) => {
  if (!(await epsExists(epsId))) throw ApiError.notFound('EPS not found.');

  const date = today();
  const [orders, pharmacies] = await Promise.all([
    getEpsOrderStats(epsId, date),
    getEpsPharmacyBreakdown(epsId),
  ]);

  const counts = toNumbers(orders);

  return {
    epsId: Number(epsId),
    date,
    orders: {
      created: counts.total_orders,
      createdToday: counts.orders_created_today,
      pending: counts.pending_orders,
      reserved: counts.reserved_orders,
      delivered: counts.delivered_orders,
      cancelled: counts.cancelled_orders,
      expired: counts.expired_orders,
    },
    patients: {
      total: counts.total_patients,
      served: counts.patients_served,
    },
    pharmacies: pharmacies.map((pharmacy) => ({
      id: pharmacy.id,
      name: pharmacy.name,
      city: pharmacy.city,
      deliveries: Number(pharmacy.deliveries),
      activeReservations: Number(pharmacy.active_reservations),
    })),
  };
};
