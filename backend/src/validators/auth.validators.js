import { emailBody, passwordBody, stringBody } from './common.validators.js';

export const registerRules = [
  stringBody('fullName', { min: 3, max: 150 })
    .withMessage('Full name must contain at least 3 characters.'),
  emailBody(),
  passwordBody(),
];

export const loginRules = [emailBody(), passwordBody()];
