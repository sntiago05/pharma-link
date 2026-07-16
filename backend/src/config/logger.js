import winston from 'winston';
import { env, isProduction } from './env.js';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const humanFormat = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
  const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${ts} ${level}: ${stack || message}${extra}`;
});

/**
 * Application logger.
 *
 * Development prints colourised, human-readable lines; production emits JSON so
 * a log collector can parse it. Errors also go to `logs/error.log`, all levels
 * to `logs/combined.log` (both git-ignored).
 */
export const logger = winston.createLogger({
  level: env.logLevel,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    isProduction ? json() : combine(colorize(), humanFormat),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error', format: json() }),
    new winston.transports.File({ filename: 'logs/combined.log', format: json() }),
  ],
  exitOnError: false,
});

/** Stream adapter so Morgan writes through Winston at the `http` level. */
export const morganStream = {
  write: (message) => logger.http(message.trim()),
};
