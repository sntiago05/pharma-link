import { apiDelete, apiGet, apiPost, apiPut } from "./api.js";

/** Admin API calls against the `/catalog` surface plus the audit trail. */

export const listCatalog = (type) => apiGet(`/catalog/${type}`);
export const listEpsPharmacies = (epsId) => apiGet(`/catalog/eps/${epsId}/pharmacies`);
export const getCatalogItem = (type, id) => apiGet(`/catalog/${type}/${id}`);
export const createCatalog = (type, payload) => apiPost(`/catalog/${type}`, payload);
export const updateCatalog = (type, id, payload) => apiPut(`/catalog/${type}/${id}`, payload);
export const deleteCatalog = (type, id, payload) => apiDelete(`/catalog/${type}/${id}`, payload);
export const listUsers = () => apiGet('/catalog/users');
export const updateUserRole = (id, payload) => apiPut(`/catalog/users/${id}/role`, payload);
export const updateUserStatus = (id, active) => apiPut(`/catalog/users/${id}/status`, { active });
export const listBranchChangeRequests = () => apiGet('/catalog/branch-change-requests');
export const reviewBranchChangeRequest = (id, decision) => apiPut(`/catalog/branch-change-requests/${id}`, { decision });
export const deleteUser = (id, payload) => apiDelete(`/catalog/users/${id}`, payload);

export const linkEpsPharmacy = (epsId, pharmacyId) =>
  apiPost("/catalog/eps-pharmacies", { epsId, pharmacyId });

export const setWorkingHours = (payload) => apiPost("/catalog/working-hours", payload);

export const listAuditLogs = (params) => apiGet("/audit-logs", params);

export const getPharmacyDashboard = (pharmacyId) => apiGet(`/dashboards/pharmacy/${pharmacyId}`);
export const getEpsDashboard = (epsId) => apiGet(`/dashboards/eps/${epsId}`);
