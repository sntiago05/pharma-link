import {
  countReservationsByStartTime,
  countReservationsInSlot,
  findWorkingHours,
  pharmacyExists,
} from '../repositories/schedule.repository.js';
import { ApiError } from '../utils/api-error.js';
import { toMinutes, toTimeLabel, today } from '../utils/dates.js';

/**
 * Appointment-slot rules.
 *
 * A pharmacy's working day is divided into fixed blocks of `slot_duration`
 * minutes from `opening_time`, each accepting `capacity_per_slot` reservations.
 * A slot disappears from availability once it is full.
 *
 * This module is the single source of truth for slot maths: both the
 * availability endpoints and the reservation write path use it, so a slot can
 * never be offered by one and rejected by the other.
 */

/**
 * @typedef {object} Slot
 * @property {string} startTime `HH:MM`
 * @property {string} endTime `HH:MM`
 * @property {number} availableCapacity Remaining places.
 */

/**
 * Every slot in the working day, whether free or not.
 * @param {import('../repositories/schedule.repository.js').WorkingHours} hours
 * @returns {Array<{ startMinutes: number, startTime: string, endTime: string }>}
 */
export const buildDaySlots = (hours) => {
  const slots = [];
  const closing = toMinutes(hours.closing_time);

  // `+ slot_duration <= closing` keeps the last block inside working hours: a
  // slot that would run past closing time is not offered.
  for (let start = toMinutes(hours.opening_time); start + hours.slot_duration <= closing; start += hours.slot_duration) {
    slots.push({
      startMinutes: start,
      startTime: toTimeLabel(start),
      endTime: toTimeLabel(start + hours.slot_duration),
    });
  }
  return slots;
};

/**
 * Available slots for a pharmacy on a date.
 *
 * Past dates return an empty list rather than an error: "no availability" is the
 * truthful answer and it keeps calendar UIs simple. Slots already past on the
 * current day are filtered out for the same reason.
 *
 * @param {number} pharmacyId
 * @param {string} date `YYYY-MM-DD`
 * @returns {Promise<Slot[]>}
 * @throws {ApiError} 404 when the pharmacy or its working hours do not exist.
 */
export const getAvailableSlots = async (pharmacyId, date) => {
  const hours = await findWorkingHours(pharmacyId);
  if (!hours) {
    if (!(await pharmacyExists(pharmacyId))) throw ApiError.notFound('Pharmacy not found.');
    throw ApiError.notFound('Working hours not found.');
  }

  if (date < today()) return [];

  const used = await countReservationsByStartTime(pharmacyId, date);

  return buildDaySlots(hours)
    .map((slot) => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
      availableCapacity: hours.capacity_per_slot - (used.get(slot.startTime) ?? 0),
    }))
    .filter((slot) => slot.availableCapacity > 0);
};

/**
 * Asserts a requested time is inside working hours and still has capacity.
 * Call inside the reservation transaction, after locking the pharmacy row.
 *
 * @param {object} request
 * @param {number} request.pharmacyId
 * @param {string} request.date
 * @param {string} request.startTime
 * @param {string} request.endTime
 * @param {number} [request.excludeReservationId] Reservation being rescheduled.
 * @param {import('pg').PoolClient} client Transaction client.
 * @throws {ApiError} 400 outside working hours, 409 when the slot is full.
 */
export const assertSlotIsBookable = async (
  { pharmacyId, date, startTime, endTime, excludeReservationId },
  client,
) => {
  const hours = await findWorkingHours(pharmacyId, client);
  if (!hours) throw ApiError.badRequest('Pharmacy working hours are not configured.');

  const opening = toMinutes(hours.opening_time);
  const closing = toMinutes(hours.closing_time);
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);

  if (start < opening || end > closing) {
    throw ApiError.badRequest('Reservation is outside working hours.');
  }

  // The slot grid is authoritative: accepting an arbitrary start time would let a
  // caller book 08:07 and slip past the capacity counter, which groups by
  // start_time and would see that as a slot of its own.
  const validStart = buildDaySlots(hours).some((slot) => slot.startMinutes === start);
  if (!validStart) {
    throw ApiError.badRequest(
      `startTime must match a ${hours.slot_duration}-minute slot starting at ${hours.opening_time.slice(0, 5)}.`,
    );
  }

  const count = await countReservationsInSlot(
    { pharmacyId, date, startTime, excludeReservationId },
    client,
  );
  if (count >= hours.capacity_per_slot) {
    throw ApiError.conflict('No remaining capacity for this time slot.');
  }
};
