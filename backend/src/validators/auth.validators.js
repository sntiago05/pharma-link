import { body } from 'express-validator';
import { emailBody, passwordBody, stringBody } from './common.validators.js';

export const registerRules = [
  stringBody('fullName', { min: 3, max: 150 })
    .withMessage('Full name must contain at least 3 characters.'),
  emailBody(),
  passwordBody(),
  stringBody('document', { min: 3, max: 30 }),
  body('phone').optional({ values: 'null' }).isString().trim().isLength({ max: 20 }),
];

export const loginRules = [emailBody(), passwordBody()];

export const forgotPasswordRules = [emailBody()];

export const resetPasswordRules = [
  // 32 random bytes rendered as hex; the exact shape is checked so a malformed
  // value is rejected before it reaches a database lookup.
  body('token')
    .isString().withMessage('El enlace no es válido.')
    .bail()
    .trim()
    .matches(/^[a-f0-9]{64}$/i).withMessage('El enlace no es válido.'),
  passwordBody(),
];
