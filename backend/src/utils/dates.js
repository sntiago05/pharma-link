import { env } from '../config/env.js';

/**
 * Date helpers anchored to the configured business timezone.
 *
 * `new Date().toISOString().slice(0, 10)` resolves "today" in UTC, which is a
 * day ahead of Colombia (UTC-5) for the last five hours of every local day.
 * That made late-evening same-day reservations look like past dates. These
 * helpers resolve the civil date in `APP_TIMEZONE` instead.
 */

/**
 * Current civil date in the business timezone, as `YYYY-MM-DD`.
 * @returns {string}
 */
export const today = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: env.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

/**
 * @param {string} date `YYYY-MM-DD`
 * @returns {boolean} True when `date` is strictly before today.
 */
export const isPastDate = (date) => date < today();

/** Minutes since midnight for a `HH:MM` or `HH:MM:SS` string. */
export const toMinutes = (time) => {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
};

/** Formats minutes since midnight back to `HH:MM`. */
export const toTimeLabel = (minutes) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
