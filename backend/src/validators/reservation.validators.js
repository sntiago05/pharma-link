import { body } from 'express-validator';
import {
  dateQuery,
  futureDateBody,
  idBody,
  idParam,
  timeBody,
} from './common.validators.js';

/** Rejects `endTime <= startTime`, mirroring the reservations CHECK constraint. */
const endAfterStart = () =>
  timeBody('endTime').bail().custom((value, { req }) => {
    if (req.body.startTime && value <= req.body.startTime) {
      throw new Error('endTime must be later than startTime.');
    }
    return true;
  });

export const createReservationRules = [
  idBody('orderId'),
  idBody('pharmacyId'),
  futureDateBody('reservationDate', 'Reservations cannot be created in the past.'),
  timeBody('startTime'),
  endAfterStart(),
];

export const rescheduleReservationRules = [
  idParam('id'),
  futureDateBody('reservationDate', 'Reservations cannot be moved to the past.'),
  timeBody('startTime'),
  endAfterStart(),
];

export const reservationIdRules = [idParam('id')];

export const availableSlotsRules = [
  idParam('pharmacyId'),
  dateQuery('date'),
];

export const listPharmacyReservationsRules = [idParam('pharmacyId')];

/** `GET /pharmacies/:id/available-slots?date=` — same rules, id under `:id`. */
export const pharmacySlotsByIdRules = [idParam('id'), dateQuery('date')];
