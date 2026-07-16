import { Router } from 'express';
import {
  createCatalog,
  deleteCatalog,
  getCatalogItem,
  linkEpsPharmacy,
  listCatalog,
  setWorkingHours,
  updateCatalog,
} from '../controllers/catalog.controller.js';
import { ROLES, STAFF_ROLES } from '../config/roles.js';
import { audit } from '../middleware/audit.middleware.js';
import { authorize } from '../middleware/auth.middleware.js';
import { requirePharmacyAccess } from '../middleware/pharmacy-access.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  catalogIdRules,
  createRules,
  linkEpsPharmacyRules,
  updateRules,
  workingHoursRules,
} from '../validators/catalog.validators.js';

const router = Router();

const staff = authorize(STAFF_ROLES);
const admin = authorize([ROLES.ADMIN]);

/**
 * @openapi
 * /catalog/eps:
 *   get:
 *     tags: [Catalog]
 *     summary: List EPS
 *     description: Readable by any staff role. Never returns `api_key_hash`.
 *     responses:
 *       200: { description: EPS list., content: { application/json: { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *   post:
 *     tags: [Catalog]
 *     summary: Create an EPS (ADMIN)
 *     description: >
 *       `apiKey` is the plaintext key the EPS will send as `X-API-Key`. It is
 *       stored only as a SHA-256 digest and is never returned again, so capture
 *       it from this request.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, nit, apiKey]
 *             properties:
 *               name: { type: string, example: EPS Sura }
 *               nit: { type: string, example: '890903407-9' }
 *               apiKey: { type: string, minLength: 8, example: sura-secret-key }
 *     responses:
 *       201: { description: EPS created., content: { application/json: { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       409: { $ref: '#/components/responses/Conflict' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 *
 * /catalog/eps/{id}:
 *   get:
 *     tags: [Catalog]
 *     summary: Get an EPS
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer, minimum: 1 } }]
 *     responses:
 *       200: { description: EPS., content: { application/json: { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   put:
 *     tags: [Catalog]
 *     summary: Update an EPS (ADMIN)
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer, minimum: 1 } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               nit: { type: string }
 *               active: { type: boolean }
 *     responses:
 *       200: { description: EPS updated., content: { application/json: { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     tags: [Catalog]
 *     summary: Delete an EPS (ADMIN)
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer, minimum: 1 } }]
 *     responses:
 *       204: { description: Deleted. No body. }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { description: Still referenced by other records. }
 *
 * /catalog/pharmacies:
 *   get:
 *     tags: [Catalog]
 *     summary: List pharmacies
 *     responses:
 *       200: { description: Pharmacy list., content: { application/json: { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *   post:
 *     tags: [Catalog]
 *     summary: Create a pharmacy (ADMIN)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, nit, address, city, inventoryApiUrl, apiKey]
 *             properties:
 *               name: { type: string, example: Farmacia Central }
 *               nit: { type: string, example: '901234567-8' }
 *               address: { type: string, example: 'Calle 10 # 20-30' }
 *               city: { type: string, example: Bogotá }
 *               inventoryApiUrl: { type: string, example: 'internal://inventory' }
 *               apiKey: { type: string }
 *     responses:
 *       201: { description: Pharmacy created., content: { application/json: { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       409: { $ref: '#/components/responses/Conflict' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 *
 * /catalog/pharmacies/{id}:
 *   get:
 *     tags: [Catalog]
 *     summary: Get a pharmacy
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer, minimum: 1 } }]
 *     responses:
 *       200: { description: Pharmacy., content: { application/json: { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   put:
 *     tags: [Catalog]
 *     summary: Update a pharmacy (ADMIN)
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer, minimum: 1 } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               address: { type: string }
 *               city: { type: string }
 *               active: { type: boolean }
 *     responses:
 *       200: { description: Pharmacy updated., content: { application/json: { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     tags: [Catalog]
 *     summary: Delete a pharmacy (ADMIN)
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer, minimum: 1 } }]
 *     responses:
 *       204: { description: Deleted. No body. }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *
 * /catalog/medicines:
 *   get:
 *     tags: [Catalog]
 *     summary: List medicines
 *     responses:
 *       200: { description: Medicine list., content: { application/json: { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *   post:
 *     tags: [Catalog]
 *     summary: Create a medicine (ADMIN)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, name, presentation, description]
 *             properties:
 *               code: { type: string, example: MED-004 }
 *               name: { type: string, example: Ibuprofeno 400 mg }
 *               presentation: { type: string, example: Tabletas x 30 }
 *               description: { type: string, example: Antiinflamatorio }
 *     responses:
 *       201: { description: Medicine created., content: { application/json: { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       409: { $ref: '#/components/responses/Conflict' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 *
 * /catalog/medicines/{id}:
 *   get:
 *     tags: [Catalog]
 *     summary: Get a medicine
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer, minimum: 1 } }]
 *     responses:
 *       200: { description: Medicine., content: { application/json: { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   put:
 *     tags: [Catalog]
 *     summary: Update a medicine (ADMIN)
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer, minimum: 1 } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code: { type: string }
 *               name: { type: string }
 *               presentation: { type: string }
 *               description: { type: string }
 *     responses:
 *       200: { description: Medicine updated., content: { application/json: { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     tags: [Catalog]
 *     summary: Delete a medicine (ADMIN)
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer, minimum: 1 } }]
 *     responses:
 *       204: { description: Deleted. No body. }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *
 * /catalog/eps-pharmacies:
 *   post:
 *     tags: [Catalog]
 *     summary: Link an EPS to a pharmacy (ADMIN)
 *     description: >
 *       A patient can only reserve at pharmacies contracted by their order's EPS.
 *       Re-linking an existing pair reactivates it.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [epsId, pharmacyId]
 *             properties:
 *               epsId: { type: integer, example: 1 }
 *               pharmacyId: { type: integer, example: 1 }
 *     responses:
 *       201: { description: Linked., content: { application/json: { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 *
 * /catalog/working-hours:
 *   post:
 *     tags: [Catalog]
 *     summary: Set a pharmacy's working hours and slot capacity
 *     description: >
 *       Upsert. Defines the appointment grid: blocks of `slotDuration` minutes
 *       from `openingTime`, each accepting `capacityPerSlot` reservations.
 *       Restricted to operators of that pharmacy (ADMIN may set any).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/WorkingHoursRequest' }
 *     responses:
 *       200: { description: Working hours saved., content: { application/json: { schema: { $ref: '#/components/schemas/SuccessResponse' } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */

/**
 * Registers the standard five CRUD routes for a catalog type.
 *
 * Reads are open to staff; writes are ADMIN-only, matching the previous rules.
 */
const registerCrud = (type) => {
  router.get(`/${type}`, staff, listCatalog(type));
  router.post(
    `/${type}`,
    admin,
    validate(createRules[type]),
    audit({ action: 'CREATE', table: type === 'eps' ? 'eps' : type }),
    createCatalog(type),
  );
  router.get(`/${type}/:id`, staff, validate(catalogIdRules), getCatalogItem(type));
  router.put(
    `/${type}/:id`,
    admin,
    validate(updateRules[type]),
    audit({ action: 'UPDATE', table: type === 'eps' ? 'eps' : type }),
    updateCatalog(type),
  );
  router.delete(
    `/${type}/:id`,
    admin,
    validate(catalogIdRules),
    audit({ action: 'DELETE', table: type === 'eps' ? 'eps' : type }),
    deleteCatalog(type),
  );
};

['eps', 'pharmacies', 'medicines'].forEach(registerCrud);

router.post(
  '/eps-pharmacies',
  admin,
  validate(linkEpsPharmacyRules),
  audit({ action: 'LINK', table: 'eps_pharmacies' }),
  linkEpsPharmacy,
);

router.post(
  '/working-hours',
  authorize([ROLES.ADMIN, ROLES.PHARMACY]),
  validate(workingHoursRules),
  // Previously missing: a pharmacy operator could rewrite any pharmacy's opening
  // hours and slot capacity, including ones they are not assigned to.
  requirePharmacyAccess((req) => Number(req.body.pharmacyId)),
  audit({ action: 'SET_WORKING_HOURS', table: 'working_hours' }),
  setWorkingHours,
);

export default router;
