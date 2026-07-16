import { apiDelete, apiGet, apiPost, apiPut } from "./api.js";

/** Patient-facing API calls. */

/** The caller's patient profile, or null when it has not been created yet. */
export async function getProfile() {
  try {
    return await apiGet("/patients/me");
  } catch (error) {
    // 404 here is a normal state (registered but profile pending), not a failure.
    if (error.status === 404) return null;
    throw error;
  }
}

export const createProfile = ({ epsId, document, phone }) =>
  apiPost("/patients/me", { epsId, document, phone: phone || null });

/** EPS directory, for the profile form. */
export const listEps = () => apiGet("/eps");

/** The caller's orders, with medicines and any active reservation. */
export const listMyOrders = () => apiGet("/orders/me");

/** Pharmacies that can serve a given order, with per-medicine availability. */
export const listPharmaciesForOrder = (orderId) => apiGet(`/orders/${orderId}/pharmacies`);

/** Pharmacies contracted by the patient's EPS. */
export const listPharmacies = (params) => apiGet("/pharmacies", params);

/** Free slots at a pharmacy on a date. */
export const listSlots = (pharmacyId, date) =>
  apiGet(`/pharmacies/${pharmacyId}/available-slots`, { date });

export const createReservation = (payload) => apiPost("/reservations", payload);

export const listMyReservations = (params) => apiGet("/reservations/me", params);

export const cancelReservation = (id) => apiDelete(`/reservations/${id}`);

export const rescheduleReservation = (id, payload) =>
  apiPut(`/reservations/${id}/reschedule`, payload);
