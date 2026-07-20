# PharmaLink API Integration Examples

Este documento describe cómo integrar sistemas externos (EPS y farmacias) con PharmaLink mediante ejemplos prácticos.

## 1. EPS Integration: Enviar órdenes médicas a PharmaLink

### Flujo general
1. La EPS (sistema externo) autentica usando `X-API-Key` (no JWT).
2. Envía un POST a `/api/integrations/eps/orders` con datos de la orden.
3. PharmaLink valida la clave, crea o actualiza la orden, y responde con el estado.

### API Key de la EPS
- **Demo key**: `eps-demo-key`
- **Almacenamiento en BD**: `eps.api_key_hash` (SHA-256, no se guarda el valor en claro)
- **Validación**: el middleware `authenticateEpsApi` hashea el header `X-API-Key` recibido y lo compara contra `api_key_hash`.

### Ejemplo 1.1: cURL - Crear una orden desde una EPS externa

```bash
#!/bin/bash
# Script de ejemplo: eps-order-client.sh
# Simula una EPS externa enviando una orden a PharmaLink

BASE_URL="http://localhost:4000"
EPS_API_KEY="eps-demo-key"  # La clave real que la EPS tiene

curl -X POST "$BASE_URL/api/integrations/eps/orders" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $EPS_API_KEY" \
  -d '{
    "orderNumber": "EPS-2026-DEMO-001",
    "patientDocument": "1234567890",
    "patientFullName": "Juan Pérez",
    "patientEmail": "juan.perez@example.com",
    "patientPhone": "3001234567",
    "issueDate": "2026-07-20",
    "expirationDate": "2026-08-20",
    "details": [
      {
        "medicineCode": "MED-001",
        "quantity": 2
      },
      {
        "medicineCode": "MED-002",
        "quantity": 1
      }
    ]
  }'
```

**Respuesta esperada (201 Created):**
```json
{
  "success": true,
  "message": "Order received.",
  "data": {
    "id": 42,
    "order_number": "EPS-2026-DEMO-001",
    "patient_id": 99,
    "eps_id": 1,
    "status": "PENDING",
    "created_at": "2026-07-20T15:30:00Z"
  }
}
```

### Ejemplo 1.2: Node.js - Cliente EPS

```javascript
// File: docs/examples/eps-api-client.js
// Simula llamadas desde un sistema EPS a PharmaLink

const https = require('https');

class EPSClient {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async sendOrder(orderData) {
    return new Promise((resolve, reject) => {
      const url = new URL('/api/integrations/eps/orders', this.baseUrl);
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
      };

      const req = https.request(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (res.statusCode >= 400) {
              reject(new Error(`${res.statusCode}: ${json.message}`));
            } else {
              resolve(json);
            }
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.write(JSON.stringify(orderData));
      req.end();
    });
  }
}

// Uso:
async function demo() {
  const client = new EPSClient('http://localhost:4000', 'eps-demo-key');
  
  try {
    const result = await client.sendOrder({
      orderNumber: 'EPS-2026-DEMO-002',
      patientDocument: '9876543210',
      patientFullName: 'María García',
      patientEmail: 'maria@example.com',
      issueDate: '2026-07-20',
      expirationDate: '2026-08-20',
      details: [
        { medicineCode: 'MED-003', quantity: 1 }
      ]
    });
    console.log('Orden creada:', result.data);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

demo();
```

### Retries e Idempotencia
- Si la EPS reenvía la misma `orderNumber`, PharmaLink actualiza el pedido existente (no duplica).
- Útil para reintentos seguros en caso de timeout.

---

## 2. Pharmacy Integration: PharmaLink consumiendo API de farmacia

### Flujo general
1. Al crear/confirmar una reserva, PharmaLink consulta `inventory_api_url` de la farmacia.
2. Usa `api_key` de la farmacia para autenticar la solicitud saliente.
3. Solicita disponibilidad, bloquea inventario, o confirma entrega.
4. Si la farmacia responde (200), continúa; si falla (5xx), PharmaLink rechaza la operación.

### Contrato esperado de la API de Farmacia

PharmaLink hace solicitudes a la farmacia en este formato:

#### 2.1 Consultar disponibilidad

```
POST {inventory_api_url}/availability
Authorization: Bearer {api_key}
Content-Type: application/json

{
  "medicines": [
    { "medicineCode": "MED-001", "quantity": 2 },
    { "medicineCode": "MED-002", "quantity": 1 }
  ]
}
```

**Respuesta esperada (200):**
```json
{
  "success": true,
  "available": true,
  "items": [
    { "medicineCode": "MED-001", "available": 2 },
    { "medicineCode": "MED-002", "available": 1 }
  ]
}
```

#### 2.2 Bloquear inventario (al confirmar reserva)

```
POST {inventory_api_url}/reserve
Authorization: Bearer {api_key}
Content-Type: application/json

{
  "reservationId": "RES-2026-12345",
  "reservationDate": "2026-07-22",
  "startTime": "08:00",
  "endTime": "08:30",
  "medicines": [
    { "medicineCode": "MED-001", "quantity": 2 },
    { "medicineCode": "MED-002", "quantity": 1 }
  ]
}
```

**Respuesta esperada (200):**
```json
{
  "success": true,
  "reservationId": "RES-2026-12345",
  "blocked": true,
  "message": "Medicines reserved successfully"
}
```

#### 2.3 Confirmar entrega (cuando se marca como entregada)

```
POST {inventory_api_url}/deliver
Authorization: Bearer {api_key}
Content-Type: application/json

{
  "reservationId": "RES-2026-12345",
  "deliveredBy": "Juan Farmacéutico",
  "deliveredAt": "2026-07-22T08:15:00Z",
  "medicines": [
    { "medicineCode": "MED-001", "quantity": 2 },
    { "medicineCode": "MED-002", "quantity": 1 }
  ]
}
```

**Respuesta esperada (200):**
```json
{
  "success": true,
  "message": "Delivery confirmed and inventory updated"
}
```

---

## 3. Implementación en PharmaLink

### 3.1 Cliente HTTP para consumir farmacia (esqueleto)

```javascript
// File: backend/src/services/pharmacy-inventory-client.js
// Cliente para consumir APIs de farmacia

import fetch from 'node-fetch';
import { logger } from '../config/logger.js';
import { ApiError } from '../utils/api-error.js';

export class PharmacyInventoryClient {
  constructor(inventoryApiUrl, apiKey) {
    this.baseUrl = inventoryApiUrl;
    this.apiKey = apiKey;
  }

  async checkAvailability(medicines) {
    if (this.baseUrl === 'internal://inventory') {
      // Demostración: si es local, retorna disponibilidad simulada
      return {
        success: true,
        available: true,
        items: medicines.map(m => ({ ...m, available: m.quantity }))
      };
    }

    try {
      const res = await fetch(`${this.baseUrl}/availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ medicines }),
        timeout: 5000,
      });

      if (!res.ok) {
        throw new Error(`Pharmacy API returned ${res.status}`);
      }

      return await res.json();
    } catch (error) {
      logger.error('Pharmacy availability check failed', { error: error.message, url: this.baseUrl });
      throw ApiError.serviceUnavailable(
        'Could not verify availability with the pharmacy. Please try again later.'
      );
    }
  }

  async reserve(reservationData) {
    if (this.baseUrl === 'internal://inventory') {
      return { success: true, blocked: true };
    }

    try {
      const res = await fetch(`${this.baseUrl}/reserve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(reservationData),
        timeout: 5000,
      });

      if (!res.ok) {
        throw new Error(`Pharmacy API returned ${res.status}`);
      }

      return await res.json();
    } catch (error) {
      logger.error('Pharmacy reserve call failed', { error: error.message });
      throw ApiError.serviceUnavailable('Could not reserve medicines at the pharmacy.');
    }
  }

  async deliver(deliveryData) {
    if (this.baseUrl === 'internal://inventory') {
      return { success: true };
    }

    try {
      const res = await fetch(`${this.baseUrl}/deliver`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(deliveryData),
        timeout: 5000,
      });

      if (!res.ok) {
        throw new Error(`Pharmacy API returned ${res.status}`);
      }

      return await res.json();
    } catch (error) {
      logger.error('Pharmacy deliver call failed', { error: error.message });
      throw ApiError.serviceUnavailable('Could not confirm delivery with the pharmacy.');
    }
  }
}
```

### 3.2 Uso en el flujo de reserva

```javascript
// Ejemplo de cómo usaría el cliente en reservation.service.js

import { PharmacyInventoryClient } from './pharmacy-inventory-client.js';

export const createReservation = async ({ orderId, pharmacyId, date, startTime, endTime }, client) => {
  // Obtener detalles de la orden
  const order = await getOrder(orderId);
  const pharmacy = await getPharmacy(pharmacyId);

  // Crear cliente para la farmacia
  const inventoryClient = new PharmacyInventoryClient(pharmacy.inventory_api_url, pharmacy.api_key);

  // 1. Verificar disponibilidad EN LA FARMACIA
  const medicines = order.details.map(d => ({
    medicineCode: d.medicine.code,
    quantity: d.quantity,
  }));
  const availability = await inventoryClient.checkAvailability(medicines);
  
  if (!availability.available) {
    throw ApiError.conflict('Pharmacy does not have sufficient stock.');
  }

  // 2. Crear la reserva EN PHARMALINK (tabla local)
  const reservation = await query(
    `INSERT INTO reservations (order_id, pharmacy_id, reservation_date, start_time, end_time, status)
     VALUES ($1, $2, $3, $4, $5, 'RESERVED') RETURNING *`,
    [orderId, pharmacyId, date, startTime, endTime]
  );

  // 3. Bloquear inventario EN LA FARMACIA
  const blockResult = await inventoryClient.reserve({
    reservationId: `RES-${reservation.rows[0].id}`,
    reservationDate: date,
    startTime,
    endTime,
    medicines,
  });

  if (!blockResult.success) {
    // Si falla el bloqueo en la farmacia, revertir la reserva local
    await query('DELETE FROM reservations WHERE id = $1', [reservation.rows[0].id]);
    throw ApiError.conflict('Failed to reserve medicines at the pharmacy.');
  }

  return reservation.rows[0];
};
```

---

## 4. Mock Pharmacy Server (para testing)

Para probar PharmaLink sin una API de farmacia real, puedes usar este servidor mock:

```javascript
// File: docs/examples/mock-pharmacy-server.js
// Servidor mock que simula una farmacia externa

const express = require('express');
const app = express();
app.use(express.json());

// Middleware de autenticación
app.use((req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token !== 'pharmacy-test-key-123') {
    return res.status(401).json({ success: false, message: 'Invalid API key' });
  }
  next();
});

// Simulación de inventario en memoria
const inventory = {
  'MED-001': 50,
  'MED-002': 30,
  'MED-003': 5,
};

// Endpoint: Consultar disponibilidad
app.post('/availability', (req, res) => {
  const { medicines } = req.body;
  const items = medicines.map(m => ({
    medicineCode: m.medicineCode,
    available: inventory[m.medicineCode] || 0,
  }));
  const available = items.every(i => i.available >= medicines.find(m => m.medicineCode === i.medicineCode).quantity);
  
  res.json({
    success: true,
    available,
    items,
  });
});

// Endpoint: Bloquear inventario
app.post('/reserve', (req, res) => {
  const { medicines } = req.body;
  
  // Decrementar stock (simulación)
  medicines.forEach(m => {
    if (inventory[m.medicineCode]) {
      inventory[m.medicineCode] -= m.quantity;
    }
  });

  res.json({
    success: true,
    blocked: true,
    message: 'Medicines reserved successfully',
  });
});

// Endpoint: Confirmar entrega
app.post('/deliver', (req, res) => {
  // En una farmacia real, aquí se confirmaría la entrega en su sistema
  res.json({
    success: true,
    message: 'Delivery confirmed and inventory updated',
  });
});

// Escuchar en puerto 3001
app.listen(3001, () => {
  console.log('Mock Pharmacy API listening on http://localhost:3001');
  console.log('API Key: pharmacy-test-key-123');
});
```

**Usar el mock:**
```bash
node docs/examples/mock-pharmacy-server.js &
# Luego crear una farmacia en PharmaLink con:
# - inventoryApiUrl: http://localhost:3001
# - apiKey: pharmacy-test-key-123
```

---

## 5. Resumen

| Componente | Autenticación | Dirección | Almacenamiento | Ejemplo |
|-----------|---------------|-----------|------------------|---------|
| **EPS** | X-API-Key (header) | Entrante: EPS → PharmaLink | Hash SHA-256 en `eps.api_key_hash` | `eps-demo-key` |
| **Farmacia** | Bearer token (header) | Saliente: PharmaLink → Farmacia | Texto en `pharmacies.api_key` | `pharmacy-test-key-123` |

- **Demo**: `internal://inventory` ≈ lógica local en PharmaLink (no necesita red).
- **Producción**: URLs reales (https://farmacia.com/api/inventory) + claves reales.

---

## 6. Próximos pasos (recomendado)

1. Implementar `PharmacyInventoryClient` completo en backend (descomentar llamadas reales cuando inventory_api_url ≠ internal://inventory).
2. Añadir circuit breaker / retry logic para fallos de red.
3. Documentar en Swagger cómo las farmacias deben exponer sus APIs.
4. Crear tests de integración con el mock pharmacy server.
