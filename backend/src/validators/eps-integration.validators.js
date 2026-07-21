import { body } from 'express-validator';
import { dateBody, optionalStringBody, stringBody } from './common.validators.js';
import { today } from '../utils/dates.js';

/**
 * Rules for the inbound EPS order webhook.
 *
 * `patientFullName` / `patientEmail` stay optional here because they are only
 * required when the patient is unknown to PharmaLink. That is a data-dependent
 * rule the controller resolves against the database (returning 422), so it
 * cannot be expressed as a stateless validation.
 */
export const receiveOrderRules = [
  stringBody('orderNumber', { min: 1, max: 100 }),
  stringBody('patientDocument', { min: 3, max: 30 }),
  optionalStringBody('patientFullName', { max: 150 }),
  body('patientEmail').optional({ values: 'null' })
    .isEmail().withMessage('patientEmail must be a valid email.')
    .bail()
    .customSanitizer((value) => value.trim().toLowerCase()),
  optionalStringBody('patientPhone', { max: 20 }),
  dateBody('issueDate').bail().custom((value) => {
    if (value < today()) {
      throw new Error('issueDate cannot be before today.');
    }
    return true;
  }),
  dateBody('expirationDate').bail().custom((value, { req }) => {
    if (value < today()) {
      throw new Error('expirationDate cannot be before today.');
    }
    if (req.body.issueDate && value < req.body.issueDate) {
      throw new Error('expirationDate must be on or after issueDate.');
    }
    return true;
  }),
  body('details').isArray({ min: 1 }).withMessage('details must contain at least one item.'),
  body('details.*.medicineCode').isString().withMessage('Each detail requires a medicineCode.')
    .bail().trim().notEmpty().withMessage('Each detail requires a medicineCode.'),
  body('details.*.quantity').isInt({ min: 1 })
    .withMessage('Each detail requires a positive integer quantity.').toInt(),
];
