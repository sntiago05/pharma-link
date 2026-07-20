/**
 * Mock Pharmacy API Server
 * 
 * This is a mock implementation of what a real pharmacy's inventory API
 * would look like. PharmaLink would call this when pharmacy.inventory_api_url
 * points to a real external API.
 * 
 * Usage:
 *   node docs/examples/mock-pharmacy-server.js
 * 
 * The server listens on http://localhost:3001
 * Protect all endpoints with Bearer token: "pharmacy-test-key-123"
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());

// Configuration
const PORT = 3001;
const EXPECTED_API_KEY = 'pharmacy-test-key-123';

// In-memory storage for demo
const inventory = {
  'MED-001': { name: 'Aspirin', available: 50 },
  'MED-002': { name: 'Ibuprofen', available: 30 },
  'MED-003': { name: 'Paracetamol', available: 5 },
  'MED-004': { name: 'Amoxicillin', available: 15 },
};

const reservations = new Map();

// Middleware: Authentication via Bearer token
app.use((req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (token !== EXPECTED_API_KEY) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or missing API key. Use Authorization: Bearer pharmacy-test-key-123',
    });
  }

  next();
});

// === ENDPOINTS ===

/**
 * POST /availability
 * Check if medicines are available in this pharmacy
 */
app.post('/availability', (req, res) => {
  const { medicines } = req.body;

  if (!Array.isArray(medicines)) {
    return res.status(400).json({
      success: false,
      message: 'medicines must be an array',
    });
  }

  const items = medicines.map((med) => {
    const stock = inventory[med.medicineCode];
    if (!stock) {
      return {
        medicineCode: med.medicineCode,
        available: 0,
      };
    }
    return {
      medicineCode: med.medicineCode,
      available: stock.available,
    };
  });

  // All medicines must have sufficient stock
  const allAvailable = items.every((item) => {
    const requested = medicines.find((m) => m.medicineCode === item.medicineCode);
    return item.available >= requested.quantity;
  });

  res.json({
    success: true,
    available: allAvailable,
    items,
  });
});

/**
 * POST /reserve
 * Block/reserve medicines for a specific time slot
 * This simulates "putting a hold" on inventory
 */
app.post('/reserve', (req, res) => {
  const { reservationId, reservationDate, startTime, endTime, medicines } = req.body;

  // Validate required fields
  if (!reservationId || !medicines || !Array.isArray(medicines)) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: reservationId, medicines (array)',
    });
  }

  // Check if all medicines are available
  const canReserve = medicines.every((med) => {
    const stock = inventory[med.medicineCode];
    return stock && stock.available >= med.quantity;
  });

  if (!canReserve) {
    return res.status(409).json({
      success: false,
      message: 'One or more medicines are out of stock',
    });
  }

  // Deduct from inventory (simulate blocking)
  medicines.forEach((med) => {
    if (inventory[med.medicineCode]) {
      inventory[med.medicineCode].available -= med.quantity;
    }
  });

  // Store reservation for later delivery confirmation
  reservations.set(reservationId, {
    id: reservationId,
    date: reservationDate,
    startTime,
    endTime,
    medicines,
    status: 'RESERVED',
    reservedAt: new Date().toISOString(),
  });

  res.status(200).json({
    success: true,
    reservationId,
    blocked: true,
    message: 'Medicines reserved successfully',
    confirmationCode: `CONF-${uuidv4()}`,
  });
});

/**
 * POST /deliver
 * Mark medicines as delivered (reduce from reserved stock)
 * Called by PharmaLink when pharmacist confirms handoff to patient
 */
app.post('/deliver', (req, res) => {
  const { reservationId, deliveredBy, deliveredAt, medicines } = req.body;

  if (!reservationId || !deliveredBy) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: reservationId, deliveredBy',
    });
  }

  const reservation = reservations.get(reservationId);
  if (!reservation) {
    return res.status(404).json({
      success: false,
      message: 'Reservation not found',
    });
  }

  if (reservation.status === 'DELIVERED') {
    return res.status(409).json({
      success: false,
      message: 'Reservation already marked as delivered',
    });
  }

  // Update reservation status
  reservation.status = 'DELIVERED';
  reservation.deliveredBy = deliveredBy;
  reservation.deliveredAt = deliveredAt || new Date().toISOString();

  res.json({
    success: true,
    message: 'Delivery confirmed and inventory updated',
    reservation,
  });
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Mock Pharmacy API is running',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /inventory
 * List current inventory (debugging only, requires API key)
 */
app.get('/inventory', (req, res) => {
  res.json({
    success: true,
    inventory: Object.entries(inventory).map(([code, data]) => ({
      medicineCode: code,
      name: data.name,
      available: data.available,
    })),
  });
});

/**
 * Error handling
 */
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message,
  });
});

// === START SERVER ===
app.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════════════════════╗`);
  console.log(`║   Mock Pharmacy API Server                           ║`);
  console.log(`╠══════════════════════════════════════════════════════╣`);
  console.log(`║ URL: http://localhost:${PORT}                      ║`);
  console.log(`║ API Key: Bearer pharmacy-test-key-123                ║`);
  console.log(`╠══════════════════════════════════════════════════════╣`);
  console.log(`║ Endpoints:                                            ║`);
  console.log(`║   POST   /availability  - Check medicine stock       ║`);
  console.log(`║   POST   /reserve       - Block medicines            ║`);
  console.log(`║   POST   /deliver       - Confirm delivery           ║`);
  console.log(`║   GET    /health        - Health check               ║`);
  console.log(`║   GET    /inventory     - Debug: current stock       ║`);
  console.log(`╚══════════════════════════════════════════════════════╝\n`);

  console.log('Sample medicines in inventory:');
  Object.entries(inventory).forEach(([code, data]) => {
    console.log(`  ${code}: ${data.name} (${data.available} units)`);
  });
  console.log('\n');
});

export { app };
