import { apiGet, apiPost } from "./api.js";

/** Pharmacy-operator API calls. All are scoped by `pharmacyId` server-side. */

export const getDashboard = (pharmacyId) => apiGet(`/dashboards/pharmacy/${pharmacyId}`);

export const listInventory = (pharmacyId) => apiGet(`/inventory/${pharmacyId}`);

/** `quantity` is a signed delta: positive adds stock, negative removes it. */
export const adjustInventory = (pharmacyId, { medicineId, quantity, movementType }) =>
  apiPost(`/inventory/${pharmacyId}/adjustments`, { medicineId, quantity, movementType });

export const listReservations = (pharmacyId, params) =>
  apiGet(`/reservations/pharmacy/${pharmacyId}`, params);

export const confirmDelivery = (reservationId) => apiPost(`/deliveries/${reservationId}`);

export const markNoShow = (reservationId) => apiPost(`/reservations/${reservationId}/no-show`);

/** Medicine catalog, for the "add stock" picker. */
export const listMedicines = (params) => apiGet("/medicines", params);

export const setWorkingHours = (payload) => apiPost("/catalog/working-hours", payload);
