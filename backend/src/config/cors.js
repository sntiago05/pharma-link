import { env } from './env.js';

/**
 * CORS options driven by `CORS_ORIGINS`.
 *
 * When unset, the default `*` reproduces the previous `app.use(cors())`
 * behaviour exactly, so nothing breaks for clients that work today. Setting an
 * explicit origin list locks the API down and enables credentialed requests
 * (a wildcard origin and credentials are mutually exclusive per the CORS spec).
 */
const allowAll = env.cors.origins.includes('*');

export const corsOptions = {
  origin: allowAll ? '*' : env.cors.origins,
  credentials: !allowAll,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
  maxAge: 86400,
};
