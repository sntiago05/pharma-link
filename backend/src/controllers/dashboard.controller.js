import { getEpsDashboard, getPharmacyDashboard } from '../services/dashboard.service.js';
import { sendSuccess } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';

/** GET /api/dashboards/pharmacy/:pharmacyId */
export const pharmacyDashboard = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: 'Pharmacy dashboard retrieved.',
    data: await getPharmacyDashboard(req.params.pharmacyId),
  }),
);

/** GET /api/dashboards/eps/:epsId */
export const epsDashboard = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: 'EPS dashboard retrieved.',
    data: await getEpsDashboard(req.params.epsId),
  }),
);
