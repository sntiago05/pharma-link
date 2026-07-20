# Integration Testing Guide

This document explains how to test both internal (demo) and external (production) pharmacy integrations.

## Quick Start

### 1. Demo Mode (Internal Inventory)

The default setup uses `internal://inventory`, which means no external API calls are made.

**Start PharmaLink:**
```bash
docker compose up
```

**Create a demo order (via EPS API):**
```bash
bash docs/examples/eps-api-client.sh
```

or with Node.js:
```bash
node docs/examples/eps-api-client.js
```

All reservations will use the mock pharmacy responses (always succeed).

---

### 2. Testing with External Pharmacy API

To test how PharmaLink consumes an external pharmacy API:

#### Step 1: Start the Mock Pharmacy Server

```bash
node docs/examples/mock-pharmacy-server.js
```

Output:
```
╔══════════════════════════════════════════════════════╗
║   Mock Pharmacy API Server                           ║
╠══════════════════════════════════════════════════════╣
║ URL: http://localhost:3001                           ║
║ API Key: Bearer pharmacy-test-key-123                ║
╠══════════════════════════════════════════════════════╣
║ Endpoints:                                            ║
║   POST   /availability  - Check medicine stock       ║
║   POST   /reserve       - Block medicines            ║
║   POST   /deliver       - Confirm delivery           ║
║   GET    /health        - Health check               ║
║   GET    /inventory     - Debug: current stock       ║
╚══════════════════════════════════════════════════════╝
```

#### Step 2: Update a Pharmacy in PharmaLink

Configure a pharmacy to use the mock API by updating `pharmacies.inventory_api_url`:

**Via SQL:**
```sql
UPDATE pharmacies
SET inventory_api_url = 'http://localhost:3001',
    api_key = 'pharmacy-test-key-123'
WHERE id = 1;
```

**Or via database client:**
```bash
psql -h localhost -U pharmalink_user -d pharmalink_db
```

```sql
-- Check current pharmacy config
SELECT id, name, inventory_api_url, api_key FROM pharmacies;

-- Update to use mock pharmacy
UPDATE pharmacies
SET inventory_api_url = 'http://localhost:3001',
    api_key = 'pharmacy-test-key-123'
WHERE id = 1;
```

#### Step 3: Create a Reservation

Now when a patient creates a reservation at this pharmacy, PharmaLink will:
1. Call `POST http://localhost:3001/availability` to check stock
2. Call `POST http://localhost:3001/reserve` to block medicines
3. Call `POST http://localhost:3001/deliver` when pharmacist confirms delivery

**Test via UI:**
- Log in as a patient
- Create a prescription order
- Try to reserve at the pharmacy
- Watch the mock pharmacy server logs

**Or via API call:**
```bash
curl -X POST http://localhost:4000/api/reservations \
  -H "Authorization: Bearer $PATIENT_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": 1,
    "pharmacyId": 1,
    "reservationDate": "2026-07-25",
    "startTime": "09:00",
    "endTime": "09:30"
  }'
```

---

## Testing Failure Scenarios

### Scenario 1: Out of Stock

The mock pharmacy has limited stock:
- MED-001: 50 units
- MED-002: 30 units
- MED-003: 5 units
- MED-004: 15 units

Try to reserve more than available:
```bash
curl -X POST http://localhost:3001/reserve \
  -H "Authorization: Bearer pharmacy-test-key-123" \
  -H "Content-Type: application/json" \
  -d '{
    "reservationId": "TEST-001",
    "reservationDate": "2026-07-25",
    "startTime": "09:00",
    "endTime": "09:30",
    "medicines": [
      { "medicineCode": "MED-003", "quantity": 10 }
    ]
  }'
```

**Expected: 409 Conflict**
```json
{
  "success": false,
  "message": "One or more medicines are out of stock"
}
```

### Scenario 2: Invalid API Key

```bash
curl -X POST http://localhost:3001/availability \
  -H "Authorization: Bearer wrong-key" \
  -H "Content-Type: application/json" \
  -d '{"medicines": [{"medicineCode": "MED-001", "quantity": 1}]}'
```

**Expected: 401 Unauthorized**
```json
{
  "success": false,
  "message": "Invalid or missing API key. Use Authorization: Bearer pharmacy-test-key-123"
}
```

### Scenario 3: Pharmacy API Timeout (no mock running)

Stop the mock pharmacy server, then try to create a reservation.

```bash
pkill -f "mock-pharmacy-server"
```

PharmaLink should:
1. Attempt to call http://localhost:3001/availability
2. Timeout after 5 seconds
3. Return a 503 Service Unavailable error to the patient

**Expected response:**
```json
{
  "success": false,
  "message": "Could not verify medicine availability with the pharmacy. Please try again later."
}
```

---

## Configuration Patterns

### Pattern 1: Internal Inventory (Demo)

```javascript
const pharmacy = {
  id: 1,
  name: 'Farmacia Central',
  inventory_api_url: 'internal://inventory',  // ← Demo mode
  api_key: null,  // Not used
};
```

**Behavior:** All calls return mock success responses. No network activity.

---

### Pattern 2: External Pharmacy API

```javascript
const pharmacy = {
  id: 2,
  name: 'Farmacia Moderna',
  inventory_api_url: 'https://farmacia-moderna.com/api/inventory',  // ← Real URL
  api_key: 'sk_live_pharmacy_secret_key_here',
};
```

**Behavior:** PharmaLink makes real HTTP calls to the pharmacy's API using Bearer token.

---

### Pattern 3: Development/Staging (Mock API)

```javascript
const pharmacy = {
  id: 3,
  name: 'Test Pharmacy',
  inventory_api_url: 'http://localhost:3001',  // ← Mock server (for testing)
  api_key: 'pharmacy-test-key-123',
};
```

**Behavior:** PharmaLink calls the mock server. Useful for development and CI/CD testing.

---

## Full Integration Test Flow

### Prerequisites
- PharmaLink running on http://localhost:4000
- Mock pharmacy running on http://localhost:3001
- A patient JWT token (login first or check seed data)

### Test Steps

```bash
#!/bin/bash

# 1. Start services
docker compose up -d
sleep 3
node docs/examples/mock-pharmacy-server.js &
MOCK_PID=$!

# 2. Update pharmacy to use mock
psql -h localhost -U pharmalink_user -d pharmalink_db -c \
  "UPDATE pharmacies SET inventory_api_url = 'http://localhost:3001', api_key = 'pharmacy-test-key-123' WHERE id = 1;"

# 3. Get a patient token (using demo account)
PATIENT_JWT=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"paciente@pharmalink.local","password":"Admin1234"}' \
  | jq -r '.data.token')

# 4. Create an order
ORDER=$(curl -s -X POST http://localhost:4000/api/orders \
  -H "Authorization: Bearer $PATIENT_JWT" \
  -H "Content-Type: application/json" \
  -d '{"medicines":[{"code":"MED-001","quantity":2}]}')

ORDER_ID=$(echo $ORDER | jq -r '.data.id')

# 5. Create a reservation (this will call mock pharmacy)
curl -X POST http://localhost:4000/api/reservations \
  -H "Authorization: Bearer $PATIENT_JWT" \
  -H "Content-Type: application/json" \
  -d "{
    \"orderId\": $ORDER_ID,
    \"pharmacyId\": 1,
    \"reservationDate\": \"2026-07-25\",
    \"startTime\": \"09:00\",
    \"endTime\": \"09:30\"
  }" | jq .

# 6. Verify mock pharmacy was called
echo "Mock pharmacy server logs above show /availability and /reserve calls"

# 7. Cleanup
kill $MOCK_PID
docker compose down
```

---

## Debugging

### View Mock Pharmacy Requests

The mock server logs all requests:

```
POST /availability
  medicines: [{"medicineCode": "MED-001", "quantity": 2}]
  ✓ 200 OK

POST /reserve
  reservationId: "RES-42"
  ✓ 200 OK

POST /deliver
  reservationId: "RES-42"
  ✓ 200 OK
```

### Check Pharmacy Configuration

```bash
# Via curl to PharmaLink API
curl -H "Authorization: Bearer $ADMIN_JWT" \
  http://localhost:4000/api/admin/pharmacies | jq '.[] | {id, name, inventory_api_url}'

# Via SQL
psql -h localhost -U pharmalink_user -d pharmalink_db \
  -c "SELECT id, name, inventory_api_url FROM pharmacies;"
```

### Verify Connection to Mock Pharmacy

```bash
# Health check
curl http://localhost:3001/health | jq .

# View current inventory
curl -H "Authorization: Bearer pharmacy-test-key-123" \
  http://localhost:3001/inventory | jq .
```

---

## Next Steps

1. **Implement real client integration:** Copy `docs/examples/pharmacy-inventory-client.js` to `backend/src/services/` and integrate it into the reservation service.

2. **Add error handling:** Implement retries, circuit breaker, and fallback logic for pharmacy API failures.

3. **Production setup:** Document how to configure real pharmacy API keys and URLs for production pharmacies.

4. **Monitoring:** Add logging and metrics for pharmacy API calls to track success/failure rates.
