import { Router } from 'express';
import { query } from 'express-validator';
import { getMedicinesDirectory, getMe } from '../controllers/directory.controller.js';
import { validate } from '../middleware/validate.middleware.js';

/**
 * Read-only directory routes for authenticated end users.
 *
 * These complement `/api/catalog/*` (admin, full columns) with the subset a
 * patient may safely see. They are mounted individually in app.js.
 */

export const meRouter = Router();

/**
 * @openapi
 * /me:
 *   get:
 *     tags: [Session]
 *     summary: Session context for the authenticated user
 *     description: >
 *       Resolves who the caller is and, depending on their role, which pharmacy,
 *       EPS or patient profile they are attached to. The JWT only carries `sub`
 *       and `role`, so clients call this after login to learn the ids the scoped
 *       endpoints need in their paths.
 *
 *
 *       For a PATIENT, `patient` is `null` when the profile step is still
 *       pending. For operators, `pharmacy` / `eps` are `null` when no assignment
 *       exists yet.
 *     responses:
 *       200:
 *         description: Session context.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         id: { type: integer }
 *                         fullName: { type: string }
 *                         email: { type: string, format: email }
 *                         role: { $ref: '#/components/schemas/Role' }
 *                         patient:
 *                           type: object
 *                           nullable: true
 *                           properties:
 *                             id: { type: integer }
 *                             epsId: { type: integer }
 *                             epsName: { type: string }
 *                             document: { type: string }
 *                             phone: { type: string, nullable: true }
 *                         pharmacy:
 *                           type: object
 *                           nullable: true
 *                           properties:
 *                             id: { type: integer }
 *                             name: { type: string }
 *                             city: { type: string }
 *                         eps:
 *                           type: object
 *                           nullable: true
 *                           properties:
 *                             id: { type: integer }
 *                             name: { type: string }
 *                             nit: { type: string }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
meRouter.get('/', getMe);

export const medicineRouter = Router();

/**
 * @openapi
 * /medicines:
 *   get:
 *     tags: [Directory]
 *     summary: Medicine catalog
 *     description: >
 *       Readable by any authenticated user. The admin surface for creating and
 *       editing medicines is `/catalog/medicines`.
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Case-insensitive match on name or code.
 *     responses:
 *       200:
 *         description: Medicines.
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
 *                           code: { type: string }
 *                           name: { type: string }
 *                           presentation: { type: string }
 *                           description: { type: string }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
medicineRouter.get(
  '/',
  validate([
    query('search').optional().isString().trim().isLength({ max: 100 })
      .withMessage('search must be at most 100 characters.'),
  ]),
  getMedicinesDirectory,
);
