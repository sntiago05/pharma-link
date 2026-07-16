import { Router } from 'express';
import { availableSlotsByPharmacy } from '../controllers/reservation.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { pharmacySlotsByIdRules } from '../validators/reservation.validators.js';

const router = Router();

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
