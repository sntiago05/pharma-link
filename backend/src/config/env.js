import 'dotenv/config';

/**
 * Central, validated access to environment configuration.
 *
 * Only the database variables and JWT_SECRET are mandatory; every setting added
 * by later improvements falls back to a safe default so existing `.env` files
 * keep working without edits.
 */

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toList = (value, fallback) => {
  if (!value) return fallback;
  const items = value.split(',').map((item) => item.trim()).filter(Boolean);
  return items.length ? items : fallback;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toInt(process.env.PORT, 4000),

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },

  cors: {
    // `*` mirrors the previous `app.use(cors())` behaviour when unset.
    origins: toList(process.env.CORS_ORIGINS, ['*']),
  },

  rateLimit: {
    windowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    max: toInt(process.env.RATE_LIMIT_MAX, 300),
    authMax: toInt(process.env.AUTH_RATE_LIMIT_MAX, 10),
  },

  logLevel: process.env.LOG_LEVEL || 'info',

  /** IANA timezone used to resolve "today" for past-date rules and dashboards. */
  timezone: process.env.APP_TIMEZONE || 'America/Bogota',

  lowStockThreshold: toInt(process.env.LOW_STOCK_THRESHOLD, 10),
};

export const isProduction = env.nodeEnv === 'production';
