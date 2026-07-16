import { apiDelete, apiGet, apiPost, apiPut } from "./api.js";

/** Admin API calls against the `/catalog` surface plus the audit trail. */

export const listCatalog = (type) => apiGet(`/catalog/${type}`);
export const getCatalogItem = (type, id) => apiGet(`/catalog/${type}/${id}`);
export const createCatalog = (type, payload) => apiPost(`/catalog/${type}`, payload);
export const updateCatalog = (type, id, payload) => apiPut(`/catalog/${type}/${id}`, payload);
export const deleteCatalog = (type, id) => apiDelete(`/catalog/${type}/${id}`);

export const linkEpsPharmacy = (epsId, pharmacyId) =>
  apiPost("/catalog/eps-pharmacies", { epsId, pharmacyId });

export const setWorkingHours = (payload) => apiPost("/catalog/working-hours", payload);

export const listAuditLogs = (params) => apiGet("/audit-logs", params);

export const getPharmacyDashboard = (pharmacyId) => apiGet(`/dashboards/pharmacy/${pharmacyId}`);
export const getEpsDashboard = (epsId) => apiGet(`/dashboards/eps/${epsId}`);
