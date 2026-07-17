import { body } from 'express-validator';
import { idBody, idParam, optionalStringBody, stringBody, timeBody } from './common.validators.js';

/**
 * Catalog validation rules.
 *
 * These mirror the fields listed in catalog.controller.js `handlers[type].fields`
 * and keep the existing "all creation fields are required" behaviour, so no
 * request that succeeds today starts failing.
 */

const url = (name) =>
  body(name)
    .isString().withMessage(`${name} must be a string.`)
    .bail()
    .trim()
    .isLength({ min: 1, max: 500 }).withMessage(`${name} is required.`);

export const createRules = {
  eps: [
    stringBody('name', { min: 2, max: 150 }),
    stringBody('nit', { min: 5, max: 30 }),
    stringBody('apiKey', { min: 8, max: 255 })
      .withMessage('apiKey must contain at least 8 characters.'),
  ],
  pharmacies: [
    stringBody('name', { min: 2, max: 150 }),
    stringBody('nit', { min: 5, max: 30 }),
    stringBody('address', { min: 1, max: 200 }),
    stringBody('city', { min: 1, max: 80 }),
    // Not `isURL`: the seed data uses the `internal://inventory` scheme, which
    // isURL rejects. Existing rows must stay creatable.
    url('inventoryApiUrl'),
    stringBody('apiKey', { min: 1, max: 255 }),
    body('parentPharmacyId').optional({ values: 'null' }).isInt({ min: 1 })
      .withMessage('parentPharmacyId must be a valid pharmacy id.').toInt(),
    body('epsIds').optional().isArray().withMessage('epsIds must be an array.'),
    body('epsIds.*').optional().isInt({ min: 1 }).withMessage('Each epsIds item must be valid.').toInt(),
  ],
  medicines: [
    stringBody('code', { min: 1, max: 40 }),
    stringBody('name', { min: 2, max: 150 }),
    stringBody('presentation', { min: 1, max: 100 }),
    stringBody('description', { min: 1, max: 1000 }),
  ],
};

/** Update rules: every field optional, but validated when present. */
export const updateRules = {
  eps: [
    idParam('id'),
    optionalStringBody('name', { max: 150 }),
    optionalStringBody('nit', { max: 30 }),
    optionalStringBody('apiKeyHash', { max: 64 }),
    body('active').optional().isBoolean().withMessage('active must be a boolean.').toBoolean(),
  ],
  pharmacies: [
    idParam('id'),
    optionalStringBody('name', { max: 150 }),
    optionalStringBody('nit', { max: 30 }),
    optionalStringBody('address', { max: 200 }),
    optionalStringBody('city', { max: 80 }),
    optionalStringBody('inventoryApiUrl', { max: 500 }),
    optionalStringBody('apiKey', { max: 255 }),
    body('parentPharmacyId').optional({ values: 'null' }).isInt({ min: 1 })
      .withMessage('parentPharmacyId must be a valid pharmacy id.').toInt(),
    body('active').optional().isBoolean().withMessage('active must be a boolean.').toBoolean(),
  ],
  medicines: [
    idParam('id'),
    optionalStringBody('code', { max: 40 }),
    optionalStringBody('name', { max: 150 }),
    optionalStringBody('presentation', { max: 100 }),
    optionalStringBody('description', { max: 1000 }),
  ],
};

export const catalogIdRules = [idParam('id')];

export const deleteCatalogRules = [
  idParam('id'),
  body('adminPassword').optional().isString().withMessage('adminPassword must be a string.'),
];

export const linkEpsPharmacyRules = [idBody('epsId'), idBody('pharmacyId')];

export const workingHoursRules = [
  idBody('pharmacyId'),
  timeBody('openingTime'),
  timeBody('closingTime').bail().custom((value, { req }) => {
    if (req.body.openingTime && value <= req.body.openingTime) {
      throw new Error('closingTime must be later than openingTime.');
    }
    return true;
  }),
  body('slotDuration')
    .isInt({ min: 5, max: 480 })
    .withMessage('slotDuration must be between 5 and 480 minutes.')
    .toInt(),
  body('capacityPerSlot')
    .isInt({ min: 1, max: 1000 })
    .withMessage('capacityPerSlot must be an integer greater than 0.')
    .toInt(),
];
