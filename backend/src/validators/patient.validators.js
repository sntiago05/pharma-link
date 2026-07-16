import { idBody, optionalStringBody, stringBody } from './common.validators.js';

export const createPatientProfileRules = [
  idBody('epsId'),
  stringBody('document', { min: 3, max: 30 }),
  optionalStringBody('phone', { max: 20 }),
];
