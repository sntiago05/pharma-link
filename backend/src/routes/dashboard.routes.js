import { Router } from 'express';
import { epsDashboard, pharmacyDashboard } from '../controllers/dashboard.controller.js';
import { ROLES } from '../config/roles.js';
import { authorize } from '../middleware/auth.middleware.js';
import { requireEpsAccess } from '../middleware/eps-access.middleware.js';
import { requirePharmacyAccess } from '../middleware/pharmacy-access.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { idParam } from '../validators/common.validators.js';

const router = Router();

/**
 * @openapi
 * /dashboards/pharmacy/{pharmacyId}:
 *   get:
 *     tags: [Dashboards]
 *     summary: Pharmacy statistics
 *     description: >
 *       Pending reservations, reservations and deliveries today, cancellations,
 *       no-shows, plus stock health (low stock, out of stock) and the list of
 *       medicines behind those alerts. "Today" is resolved in `APP_TIMEZONE`.
 *       Restricted to operators of that pharmacy.
 *     parameters:
 *       - in: path
 *         name: pharmacyId
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       200:
 *         description: Dashboard.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/PharmacyDashboard' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.get(
  '/pharmacy/:pharmacyId',
  authorize([ROLES.ADMIN, ROLES.PHARMACY]),
  validate([idParam('pharmacyId')]),
  requirePharmacyAccess((req) => Number(req.params.pharmacyId)),
  pharmacyDashboard,
);

/**
 * @openapi
 * /dashboards/eps/{epsId}:
 *   get:
 *     tags: [Dashboards]
 *     summary: EPS statistics
 *     description: >
 *       Orders created, delivered, expired and pending, patients served, and a
 *       per-pharmacy breakdown. `expired` counts orders past their expiration
 *       date even if the hourly job has not flagged them yet. An EPS operator
 *       only sees the EPS they are linked to through `user_eps`.
 *     parameters:
 *       - in: path
 *         name: epsId
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       200:
 *         description: Dashboard.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/EpsDashboard' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.get(
  '/eps/:epsId',
  authorize([ROLES.ADMIN, ROLES.EPS]),
  validate([idParam('epsId')]),
  // Scoped through user_eps (db/03_user_eps.sql), so an EPS operator cannot read
  // another EPS's figures.
  requireEpsAccess((req) => Number(req.params.epsId)),
  epsDashboard,
);

export default router;
