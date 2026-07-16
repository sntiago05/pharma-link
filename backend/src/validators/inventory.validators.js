import { body } from 'express-validator';
import { idBody, idParam } from './common.validators.js';

export const listInventoryRules = [idParam('pharmacyId')];

export const adjustInventoryRules = [
  idParam('pharmacyId'),
  idBody('medicineId'),
  // Not `quantityBody`: an adjustment is a signed delta. Negative removes stock,
  // positive adds it; zero is meaningless and the DB CHECK rejects it anyway.
  body('quantity')
    .isInt().withMessage('quantity must be an integer.')
    .bail()
    .toInt()
    .custom((value) => {
      if (value === 0) throw new Error('quantity must be a non-zero integer.');
      return true;
    }),
  body('movementType').optional()
    .isIn(['IN', 'ADJUSTMENT']).withMessage("movementType must be 'IN' or 'ADJUSTMENT'."),
];
