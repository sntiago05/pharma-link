import { Router } from 'express';
import { query } from 'express-validator';
import { getPharmaciesDirectory } from '../controllers/directory.controller.js';
import { availableSlotsByPharmacy } from '../controllers/reservation.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { pharmacySlotsByIdRules } from '../validators/reservation.validators.js';

const router = Router();

/**
 * @openapi
 * /pharmacies:
 *   get:
 *     tags: [Pharmacies]
 *     summary: Pharmacy directory
 *     description: >
 *       Active pharmacies with public fields and their working hours. A PATIENT
 *       only sees pharmacies contracted by their own EPS, so the list can never
 *       contain one that the reservation endpoint would reject; staff see all and
 *       may filter with `epsId`.
 *
 *
 *       `has_working_hours` is false when the pharmacy cannot take appointments
 *       yet — the UI should not offer it for booking.
 *     parameters:
 *       - in: query
 *         name: epsId
 *         schema: { type: integer, minimum: 1 }
 *         description: Staff only. Ignored for patients, who are scoped to their own EPS.
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *       - in: query
 *         name: medicineId
 *         schema: { type: integer, minimum: 1 }
 *         description: Keep only pharmacies with free stock of this medicine.
 *     responses:
 *       200:
 *         description: Pharmacies.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: integer }
 *                           name: { type: string }
 *                           address: { type: string }
 *                           city: { type: string }
 *                           opening_time: { type: string, nullable: true }
 *                           closing_time: { type: string, nullable: true }
 *                           slot_duration: { type: integer, nullable: true }
 *                           capacity_per_slot: { type: integer, nullable: true }
 *                           has_working_hours: { type: boolean }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404:
 *         description: The patient has no profile yet, so their EPS is unknown.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get(
  '/',
  validate([
    query('epsId').optional().isInt({ min: 1 }).withMessage('epsId must be a positive integer.').toInt(),
    query('medicineId').optional().isInt({ min: 1 }).withMessage('medicineId must be a positive integer.').toInt(),
    query('city').optional().isString().trim().isLength({ max: 80 })
      .withMessage('city must be at most 80 characters.'),
  ]),
  getPharmaciesDirectory,
);

/**
 * The spec-named availability route. It serves the same data as the existing
 * `GET /api/reservations/pharmacy/:pharmacyId/availability`, which is kept
 * working so current clients do not break; both delegate to slot.service.js.
 *
 * @openapi
 * /pharmacies/{id}/available-slots:
 *   get:
 *     tags: [Pharmacies]
 *     summary: Available appointment slots for a date
 *     description: >
 *       Returns only slots that still have capacity. A slot is a block of
 *       `slot_duration` minutes from the pharmacy's opening time, accepting
 *       `capacity_per_slot` reservations; full slots are omitted. Past dates
 *       return an empty list.
 *
 *
 *       `startTime` from this response is what `POST /reservations` expects:
 *       times off the slot grid are rejected.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *         description: Pharmacy id.
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
 *             example:
 *               success: true
 *               message: Available slots retrieved.
 *               data:
 *                 - { startTime: '08:00', endTime: '08:30', availableCapacity: 3 }
 *                 - { startTime: '08:30', endTime: '09:00', availableCapacity: 1 }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404:
 *         description: Pharmacy or its working hours do not exist.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.get('/:id/available-slots', validate(pharmacySlotsByIdRules), availableSlotsByPharmacy);

export default router;
