import { body } from 'express-validator';
import {
  dateBody,
  idParam,
  optionalStringBody,
  stringBody,
} from './common.validators.js';

export const createEpsOrderRules = [
  idParam('epsId'),
  stringBody('orderNumber', { min: 1, max: 100 }),
  stringBody('patientDocument', { min: 3, max: 30 }),
  // Only required when the patient is unknown; the service decides, since that
  // depends on database state.
  optionalStringBody('patientFullName', { max: 150 }),
  body('patientEmail').optional({ values: 'null' })
    .isEmail().withMessage('patientEmail must be a valid email.')
    .bail()
    .customSanitizer((value) => value.trim().toLowerCase()),
  optionalStringBody('patientPhone', { max: 20 }),
  dateBody('issueDate'),
  dateBody('expirationDate').bail().custom((value, { req }) => {
    if (req.body.issueDate && value < req.body.issueDate) {
      throw new Error('expirationDate must be on or after issueDate.');
    }
    return true;
  }),
  body('details').isArray({ min: 1 }).withMessage('details must contain at least one item.'),
  body('details.*.medicineId').isInt({ min: 1 })
    .withMessage('Each detail needs a valid medicineId.').toInt(),
  body('details.*.quantity').isInt({ min: 1 })
    .withMessage('Each detail needs a positive integer quantity.').toInt(),
];

export const listEpsOrdersRules = [idParam('epsId')];
