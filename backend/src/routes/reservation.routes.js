import { Router } from 'express';
import { query } from 'express-validator';
import {
  availableSlots,
  cancelReservation,
  createReservation,
  listMyReservations,
  listPharmacyReservations,
  markNoShow,
  rescheduleReservation,
} from '../controllers/reservation.controller.js';
import { ROLES } from '../config/roles.js';
import { audit } from '../middleware/audit.middleware.js';
import { authorize } from '../middleware/auth.middleware.js';
import { requirePharmacyAccess, requirePharmacyOrParentAccess } from '../middleware/pharmacy-access.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { findReservationPharmacyId } from '../services/reservation.service.js';
import { paginationQuery } from '../validators/common.validators.js';
import {
  availableSlotsRules,
  createReservationRules,
  listPharmacyReservationsRules,
  rescheduleReservationRules,
  reservationIdRules,
} from '../validators/reservation.validators.js';

const router = Router();

/** Resolves the pharmacy owning the reservation in `:id`, for access checks. */
const pharmacyOfReservation = (req) => findReservationPharmacyId(req.params.id);

/**
 * @openapi
 * /reservations/me:
 *   get:
 *     tags: [Reservations]
 *     summary: List the caller's own reservations
 *     description: >
 *       Newest first, including the pharmacy, the order number and the medicines
 *       held by each reservation, plus the cancellation and reschedule counters
 *       so the UI can disable those actions once a limit is reached.
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { $ref: '#/components/schemas/ReservationStatus' }
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/OffsetParam'
 *     responses:
 *       200:
 *         description: Reservations.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Reservation' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.get(
  '/me',
  authorize([ROLES.PATIENT]),
  validate([
    ...paginationQuery(),
    query('status').optional()
      .isIn(['RESERVED', 'CANCELLED', 'COMPLETED', 'NO_SHOW', 'EXPIRED'])
      .withMessage('status must be a valid reservation status.'),
  ]),
  listMyReservations,
);

/**
 * @openapi
 * /reservations:
 *   post:
 *     tags: [Reservations]
 *     summary: Reserve an order's medicines at a pharmacy
 *     description: |
 *       Books a slot and holds the order's stock at the pharmacy.
 *
 *       Business rules enforced:
 *       * The order must exist and belong to the caller.
 *       * An expired order cannot be reserved.
 *       * An order already delivered, reserved or cancelled cannot be reserved.
 *       * The pharmacy must be contracted by the order's EPS.
 *       * The date cannot be in the past.
 *       * `startTime` must match a slot from the availability endpoint and the
 *         slot must still have capacity.
 *       * Every medicine must have enough free stock at that pharmacy.
 *
 *       On success the order moves to `RESERVED` and a notification is created.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateReservationRequest' }
 *     responses:
 *       201:
 *         description: Reservation created.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Reservation' }
 *       400:
 *         description: Expired order, unlinked pharmacy, or outside working hours.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409:
 *         description: Order not reservable, slot full, or insufficient stock.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.post(
  '/',
  authorize([ROLES.PATIENT]),
  validate(createReservationRules),
  audit({ action: 'CREATE', table: 'reservations' }),
  createReservation,
);

/**
 * @openapi
 * /reservations/{id}:
 *   delete:
 *     tags: [Reservations]
 *     summary: Cancel a reservation
 *     description: >
 *       Releases the held stock and returns the order to `PENDING` so it can be
 *       reserved again. An order may be cancelled at most 3 times.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       200:
 *         description: Reservation cancelled.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *             example: { success: true, message: 'Reservation cancelled.', data: null }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409:
 *         description: Not active, or the 3-cancellation limit was reached.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.delete(
  '/:id',
  authorize([ROLES.PATIENT]),
  validate(reservationIdRules),
  audit({ action: 'CANCEL_RESERVATION', table: 'reservations' }),
  cancelReservation,
);

/**
 * @openapi
 * /reservations/{id}/reschedule:
 *   put:
 *     tags: [Reservations]
 *     summary: Move a reservation to another slot
 *     description: >
 *       Changes the date and time at the same pharmacy. The stock stays held.
 *       An order may be rescheduled at most 2 times. The new slot must be in the
 *       future, within working hours and have capacity.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/RescheduleReservationRequest' }
 *     responses:
 *       200:
 *         description: Reservation rescheduled.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Reservation' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409:
 *         description: Slot full, not active, or the 2-reschedule limit was reached.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.put(
  '/:id/reschedule',
  authorize([ROLES.PATIENT]),
  validate(rescheduleReservationRules),
  audit({ action: 'UPDATE', table: 'reservations' }),
  rescheduleReservation,
);

/**
 * @openapi
 * /reservations/{id}/no-show:
 *   post:
 *     tags: [Reservations]
 *     summary: Mark a reservation as no-show
 *     description: >
 *       Pharmacy staff record that the patient did not collect. Releases the held
 *       stock and returns the order to `PENDING`. Restricted to operators of the
 *       pharmacy that owns the reservation.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       200:
 *         description: Reservation marked as no-show.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
router.post(
  '/:id/no-show',
  authorize([ROLES.ADMIN, ROLES.PHARMACY]),
  validate(reservationIdRules),
  // Previously missing: any pharmacy operator could mark a reservation of a
  // pharmacy they are not assigned to as no-show, releasing its stock.
  requirePharmacyAccess(pharmacyOfReservation),
  audit({ action: 'NO_SHOW', table: 'reservations' }),
  markNoShow,
);

/**
 * @openapi
 * /reservations/pharmacy/{pharmacyId}/availability:
 *   get:
 *     tags: [Reservations]
 *     summary: Available slots (original route)
 *     description: >
 *       Identical payload to `GET /pharmacies/{id}/available-slots`. Kept for
 *       backwards compatibility; new clients should prefer the latter.
 *     parameters:
 *       - in: path
 *         name: pharmacyId
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *       - $ref: '#/components/parameters/DateQueryParam'
 *     responses:
 *       200:
 *         description: Available slots.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Slot' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
// Availability is readable by any authenticated user: patients need it to book.
router.get('/pharmacy/:pharmacyId/availability', validate(availableSlotsRules), availableSlots);

/**
 * @openapi
 * /reservations/pharmacy/{pharmacyId}:
 *   get:
 *     tags: [Reservations]
 *     summary: List a pharmacy's reservations
 *     description: >
 *       Restricted to operators assigned to that pharmacy (ADMIN sees all), since
 *       the rows include patient names and document numbers.
 *     parameters:
 *       - in: path
 *         name: pharmacyId
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: status
 *         schema: { $ref: '#/components/schemas/ReservationStatus' }
 *       - in: query
 *         name: date
 *         schema: { type: string, format: date }
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/OffsetParam'
 *     responses:
 *       200:
 *         description: Reservations.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Reservation' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.get(
  '/pharmacy/:pharmacyId',
  authorize([ROLES.ADMIN, ROLES.PHARMACY]),
  validate([
    ...listPharmacyReservationsRules,
    ...paginationQuery(),
    query('status').optional()
      .isIn(['RESERVED', 'CANCELLED', 'COMPLETED', 'NO_SHOW', 'EXPIRED'])
      .withMessage('status must be a valid reservation status.'),
    query('date').optional().matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage('date must use the YYYY-MM-DD format.'),
  ]),
  // Previously missing: an operator could list another pharmacy's reservations,
  // exposing patient names and documents across tenants.
  requirePharmacyOrParentAccess((req) => Number(req.params.pharmacyId)),
  listPharmacyReservations,
);

export default router;
