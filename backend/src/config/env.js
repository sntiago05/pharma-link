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

  /** Public URL of the frontend. Used to build the password reset link. */
  appUrl: (process.env.APP_URL || 'http://localhost:5173').replace(/\/+$/, ''),

  mail: {
    from: process.env.MAIL_FROM || 'PharmaLink <no-reply@pharmalink.local>',
    /**
     * SMTP settings. When host is unset in development the mailer falls back to
     * an Ethereal test account, so the reset flow is demonstrable with no setup.
     * In production the absence of a host is a hard failure instead.
     */
    host: process.env.MAIL_HOST,
    port: toInt(process.env.MAIL_PORT, 587),
    secure: process.env.MAIL_SECURE === 'true',
    user: process.env.MAIL_USER,
    password: process.env.MAIL_PASSWORD,
  },

  passwordReset: {
    /** How long a reset link stays valid. Short by design: it is a bearer credential. */
    ttlMinutes: toInt(process.env.PASSWORD_RESET_TTL_MINUTES, 60),
  },
};

export const isProduction = env.nodeEnv === 'production';
