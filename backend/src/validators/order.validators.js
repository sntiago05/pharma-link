import { body } from 'express-validator';
import { dateBody, stringBody } from './common.validators.js';

export const createOrderRules = [
  stringBody('orderNumber', { min: 1, max: 100 }),
  dateBody('issueDate'),
  dateBody('expirationDate').bail().custom((value, { req }) => {
    // Mirrors the medical_orders CHECK constraint, so the client gets a 422 with
    // a clear field instead of a 400 from a database constraint violation.
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
