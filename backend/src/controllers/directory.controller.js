import { ROLES } from '../config/roles.js';
import {
  findPharmaciesForOrder,
  listEps,
  listMedicines,
  listPharmacies,
} from '../repositories/directory.repository.js';
import { getSessionContext } from '../services/session.service.js';
import { ApiError } from '../utils/api-error.js';
import { sendSuccess } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';
import { query } from '../config/db.js';

/** GET /api/me — who am I, and which pharmacy/EPS/patient am I? */
export const getMe = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: 'Session context retrieved.',
    data: await getSessionContext(req.auth.sub),
  }),
);

/** GET /api/eps — EPS directory (public fields). */
export const getEpsDirectory = asyncHandler(async (_req, res) =>
  sendSuccess(res, { message: 'EPS list retrieved.', data: await listEps() }),
);

/** GET /api/medicines — medicine catalog. */
export const getMedicinesDirectory = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: 'Medicine list retrieved.',
    data: await listMedicines({ search: req.query.search }),
  }),
);

/**
 * GET /api/pharmacies — pharmacy directory.
 *
 * A patient only sees pharmacies contracted by their own EPS, so the list can
 * never contain a pharmacy the reservation endpoint would reject. Staff see all.
 */
export const getPharmaciesDirectory = asyncHandler(async (req, res) => {
  let epsId;

  if (req.auth.role === ROLES.PATIENT) {
    const patient = await query('SELECT eps_id FROM patients WHERE user_id = $1', [req.auth.sub]);
    if (!patient.rowCount) {
      throw ApiError.notFound('Create your patient profile before browsing pharmacies.');
    }
    epsId = patient.rows[0].eps_id;
  } else if (req.query.epsId) {
    epsId = Number(req.query.epsId);
  }

  const pharmacies = await listPharmacies({
    epsId,
    city: req.query.city,
    medicineId: req.query.medicineId ? Number(req.query.medicineId) : undefined,
  });

  return sendSuccess(res, { message: 'Pharmacy list retrieved.', data: pharmacies });
});

/**
 * GET /api/orders/:orderId/pharmacies — where can this order be collected?
 *
 * Returns each pharmacy of the order's EPS with per-medicine availability and an
 * `is_complete` flag, so the patient can pick one that can serve the whole order.
 */
export const getPharmaciesForOrder = asyncHandler(async (req, res) => {
  const order = await query(
    `SELECT medical_orders.id
     FROM medical_orders
     INNER JOIN patients ON patients.id = medical_orders.patient_id
     WHERE medical_orders.id = $1 AND patients.user_id = $2`,
    [req.params.orderId, req.auth.sub],
  );
  if (!order.rowCount) throw ApiError.notFound('Order not found.');

  const pharmacies = await findPharmaciesForOrder(req.params.orderId);
  return sendSuccess(res, {
    message: 'Pharmacies for order retrieved.',
    data: pharmacies.map((pharmacy) => ({
      id: pharmacy.id,
      name: pharmacy.name,
      address: pharmacy.address,
      city: pharmacy.city,
      hasWorkingHours: pharmacy.has_working_hours,
      isComplete: pharmacy.is_complete,
      items: pharmacy.items,
    })),
  });
});
