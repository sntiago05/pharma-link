import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import authRoutes from './src/routes/auth.routes.js';
import catalogRoutes from './src/routes/catalog.routes.js';
import patientRoutes from './src/routes/patient.routes.js';
import orderRoutes from './src/routes/order.routes.js';
import reservationRoutes from './src/routes/reservation.routes.js';
import deliveryRoutes from './src/routes/delivery.routes.js';
import epsIntegrationRoutes from './src/routes/eps-integration.routes.js';
import inventoryRoutes from './src/routes/inventory.routes.js';
import { authenticate } from './src/middleware/auth.middleware.js';
import { expireOrders } from './src/services/expiration.service.js';
import { query } from './src/config/db.js';

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/integrations/eps', epsIntegrationRoutes);
app.use('/api/catalog', authenticate, catalogRoutes);
app.use('/api/patients', authenticate, patientRoutes);
app.use('/api/orders', authenticate, orderRoutes);
app.use('/api/reservations', authenticate, reservationRoutes);
app.use('/api/deliveries', authenticate, deliveryRoutes);
app.use('/api/inventory', authenticate, inventoryRoutes);

app.get('/health', async (_req, res, next) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    next(error);
  }
});

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.code === '23505') return res.status(409).json({ message: 'A record with that value already exists.' });
  if (error.code === '23503') return res.status(400).json({ message: 'A related record does not exist.' });
  if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  expireOrders().catch(console.error);
  setInterval(() => expireOrders().catch(console.error), 60 * 60 * 1000);
});
