import { apiGet, apiPost } from "./api.js";

/** EPS-operator API calls. All are scoped by `epsId` server-side. */

export const getDashboard = (epsId) => apiGet(`/dashboards/eps/${epsId}`);

export const listOrders = (epsId, params) => apiGet(`/eps/${epsId}/orders`, params);

/**
 * Issues an order.
 *
 * When `patientDocument` is not enrolled for this EPS, `patientFullName` and
 * `patientEmail` are required; the backend answers 422 otherwise and the form
 * reveals those fields.
 */
export const createOrder = (epsId, payload) => apiPost(`/eps/${epsId}/orders`, payload);

export const listMedicines = (params) => apiGet("/medicines", params);
