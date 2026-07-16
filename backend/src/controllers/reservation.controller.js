import * as reservationService from '../services/reservation.service.js';
import { getAvailableSlots } from '../services/slot.service.js';
import { sendSuccess } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';

/**
 * Reservation HTTP layer.
 *
 * Controllers only translate HTTP to the service and back; the rules and
 * transactions live in services/reservation.service.js.
 *
 * Response shapes are unchanged from the previous implementation (`data` for
 * payloads, `message` for acknowledgements); `success` is added alongside.
 */

/** POST /api/reservations */
export const createReservation = asyncHandler(async (req, res) => {
  const reservation = await reservationService.createReservation({
    userId: req.auth.sub,
    orderId: req.body.orderId,
    pharmacyId: req.body.pharmacyId,
    reservationDate: req.body.reservationDate,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
  });

  res.locals.auditRecordId = reservation.id;
  return sendSuccess(res, { status: 201, message: 'Reservation created.', data: reservation });
});

/** GET /api/reservations/pharmacy/:pharmacyId */
export const listPharmacyReservations = asyncHandler(async (req, res) => {
  const reservations = await reservationService.listPharmacyReservations({
    pharmacyId: req.params.pharmacyId,
    status: req.query.status,
    date: req.query.date,
    limit: req.query.limit ?? 50,
    offset: req.query.offset ?? 0,
  });

  return sendSuccess(res, { message: 'Reservations retrieved.', data: reservations });
});

/** GET /api/reservations/me — the authenticated patient's reservations. */
export const listMyReservations = asyncHandler(async (req, res) => {
  const reservations = await reservationService.listMyReservations({
    userId: req.auth.sub,
    status: req.query.status,
    limit: req.query.limit ?? 50,
    offset: req.query.offset ?? 0,
  });

  return sendSuccess(res, { message: 'Reservations retrieved.', data: reservations });
});

/** DELETE /api/reservations/:id */
export const cancelReservation = asyncHandler(async (req, res) => {
  const reservation = await reservationService.cancelReservation({
    reservationId: req.params.id,
    userId: req.auth.sub,
  });

  res.locals.auditRecordId = reservation.id;
  // Message text preserved verbatim: clients may match on it.
  return sendSuccess(res, { message: 'Reservation cancelled.' });
});

/** GET /api/reservations/pharmacy/:pharmacyId/availability?date=YYYY-MM-DD */
export const availableSlots = asyncHandler(async (req, res) => {
  const slots = await getAvailableSlots(req.params.pharmacyId, req.query.date);
  return sendSuccess(res, { message: 'Available slots retrieved.', data: slots });
});

/** GET /api/pharmacies/:id/available-slots?date=YYYY-MM-DD (same data, spec-named route) */
export const availableSlotsByPharmacy = asyncHandler(async (req, res) => {
  const slots = await getAvailableSlots(req.params.id, req.query.date);
  return sendSuccess(res, { message: 'Available slots retrieved.', data: slots });
});

/** PUT /api/reservations/:id/reschedule */
export const rescheduleReservation = asyncHandler(async (req, res) => {
  const reservation = await reservationService.rescheduleReservation({
    reservationId: req.params.id,
    userId: req.auth.sub,
    reservationDate: req.body.reservationDate,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
  });

  res.locals.auditRecordId = reservation.id;
  return sendSuccess(res, { message: 'Reservation rescheduled.', data: reservation });
});

/** POST /api/reservations/:id/no-show */
export const markNoShow = asyncHandler(async (req, res) => {
  const reservation = await reservationService.markNoShow({ reservationId: req.params.id });

  res.locals.auditRecordId = reservation.id;
  return sendSuccess(res, { message: 'Reservation marked as no-show.' });
});
