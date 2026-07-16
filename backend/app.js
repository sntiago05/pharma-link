import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import 'dotenv/config';

import { query } from './src/config/db.js';
import { corsOptions } from './src/config/cors.js';
import { env, isProduction } from './src/config/env.js';
import { logger, morganStream } from './src/config/logger.js';
import { swaggerSpec } from './src/config/swagger.js';

import { authenticate } from './src/middleware/auth.middleware.js';
import { errorHandler, notFoundHandler } from './src/middleware/error.middleware.js';
import { apiLimiter, sanitizeRequest } from './src/middleware/security.middleware.js';

import auditRoutes from './src/routes/audit.routes.js';
import authRoutes from './src/routes/auth.routes.js';
import catalogRoutes from './src/routes/catalog.routes.js';
import dashboardRoutes from './src/routes/dashboard.routes.js';
import deliveryRoutes from './src/routes/delivery.routes.js';
import epsIntegrationRoutes from './src/routes/eps-integration.routes.js';
import inventoryRoutes from './src/routes/inventory.routes.js';
import notificationRoutes from './src/routes/notification.routes.js';
import orderRoutes from './src/routes/order.routes.js';
import patientRoutes from './src/routes/patient.routes.js';
import pharmacyRoutes from './src/routes/pharmacy.routes.js';
import reservationRoutes from './src/routes/reservation.routes.js';

import { expireOrders } from './src/services/expiration.service.js';
import { sendSuccess } from './src/utils/api-response.js';
import { asyncHandler } from './src/utils/async-handler.js';

const app = express();

// Needed for correct client IPs (rate limiting and audit logs) behind a proxy.
// Value 1 = trust one hop; widen it only to match the real deployment.
app.set('trust proxy', 1);

// --- Security and parsing -------------------------------------------------
app.use(helmet());
app.use(cors(corsOptions));
// Body size cap: without one, a single request can buffer unbounded memory.
app.use(express.json({ limit: '100kb' }));
app.use(sanitizeRequest);

// --- Observability --------------------------------------------------------
// `:response-time` gives per-request latency; logs flow through Winston.
app.use(
  morgan(isProduction ? 'combined' : 'dev', {
    stream: morganStream,
    skip: (req) => req.path === '/health',
  }),
);

// --- Documentation --------------------------------------------------------
app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'PharmaLink API',
    swaggerOptions: { persistAuthorization: true },
  }),
);

// --- Routes ---------------------------------------------------------------
app.use('/api', apiLimiter);

// Unauthenticated: auth has its own stricter limiter, the EPS webhook uses X-API-Key.
app.use('/api/auth', authRoutes);
app.use('/api/integrations/eps', epsIntegrationRoutes);

// JWT-protected.
app.use('/api/catalog', authenticate, catalogRoutes);
app.use('/api/patients', authenticate, patientRoutes);
app.use('/api/orders', authenticate, orderRoutes);
app.use('/api/pharmacies', authenticate, pharmacyRoutes);
app.use('/api/reservations', authenticate, reservationRoutes);
app.use('/api/deliveries', authenticate, deliveryRoutes);
app.use('/api/inventory', authenticate, inventoryRoutes);
app.use('/api/dashboards', authenticate, dashboardRoutes);
app.use('/api/notifications', authenticate, notificationRoutes);
app.use('/api/audit-logs', authenticate, auditRoutes);

app.get(
  '/health',
  asyncHandler(async (_req, res) => {
    await query('SELECT 1');
    // `status` and `database` stay at the top level: probes already read them.
    return sendSuccess(res, {
      message: 'Service healthy.',
      data: { status: 'ok', database: 'connected' },
      extra: { status: 'ok', database: 'connected' },
    });
  }),
);

// --- Error handling (must be last) ---------------------------------------
app.use(notFoundHandler);
app.use(errorHandler);

// --- Startup --------------------------------------------------------------
const EXPIRATION_INTERVAL_MS = 60 * 60 * 1000;

const startExpirationJob = () => {
  const run = () =>
    expireOrders().catch((error) =>
      logger.error('Order expiration sweep failed', { error: error.message, stack: error.stack }),
    );

  run();
  const timer = setInterval(run, EXPIRATION_INTERVAL_MS);
  // Do not hold the event loop open just for this timer.
  timer.unref();
};

if (!env.jwt.secret) {
  // Fail fast: without a secret every token verification throws, so the API
  // would accept registrations and then reject every authenticated request.
  logger.error('JWT_SECRET is not set. Refusing to start.');
  process.exit(1);
}

const server = app.listen(env.port, () => {
  logger.info(`PharmaLink API listening on port ${env.port}`, {
    env: env.nodeEnv,
    docs: `http://localhost:${env.port}/api/docs`,
  });
  startExpirationJob();
});

/** Stops accepting connections and lets in-flight requests finish. */
const shutdown = (signal) => {
  logger.info(`${signal} received, shutting down.`);
  server.close(() => process.exit(0));
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
