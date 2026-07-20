#!/bin/bash
# Demo script: EPS client calling PharmaLink with X-API-Key
# Usage: bash docs/examples/eps-api-client.sh

BASE_URL="${1:-http://localhost:4000}"
EPS_API_KEY="${2:-eps-demo-key}"

echo "=== PharmaLink EPS Integration Demo ==="
echo "Base URL: $BASE_URL"
echo "EPS API Key: $EPS_API_KEY"
echo ""

# Example 1: Create a new order for an enrolled patient
echo "1. Creating an order for an enrolled patient (document 1020304050)..."
curl -X POST "$BASE_URL/api/integrations/eps/orders" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $EPS_API_KEY" \
  -d '{
    "orderNumber": "EPS-CURL-001",
    "patientDocument": "1020304050",
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
  }' | jq .
echo ""

# Example 2: Create an order for a new patient (must provide name and email)
echo "2. Creating an order for a NEW patient (pre-enrollment)..."
curl -X POST "$BASE_URL/api/integrations/eps/orders" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $EPS_API_KEY" \
  -d '{
    "orderNumber": "EPS-CURL-002",
    "patientDocument": "9999888877",
    "patientFullName": "Carlos Rodriguez",
    "patientEmail": "carlos.rodriguez@example.com",
    "patientPhone": "3009999999",
    "issueDate": "2026-07-20",
    "expirationDate": "2026-08-20",
    "details": [
      {
        "medicineCode": "MED-003",
        "quantity": 1
      }
    ]
  }' | jq .
echo ""

# Example 3: Update an existing order (same orderNumber)
echo "3. Updating the first order (idempotent)..."
curl -X POST "$BASE_URL/api/integrations/eps/orders" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $EPS_API_KEY" \
  -d '{
    "orderNumber": "EPS-CURL-001",
    "patientDocument": "1020304050",
    "issueDate": "2026-07-20",
    "expirationDate": "2026-08-25",
    "details": [
      {
        "medicineCode": "MED-001",
        "quantity": 3
      },
      {
        "medicineCode": "MED-002",
        "quantity": 2
      }
    ]
  }' | jq .
echo ""

# Example 4: Test invalid API key
echo "4. Testing with invalid API key (should return 401)..."
curl -X POST "$BASE_URL/api/integrations/eps/orders" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: wrong-key-12345" \
  -d '{
    "orderNumber": "EPS-CURL-003",
    "patientDocument": "1111111111",
    "issueDate": "2026-07-20",
    "expirationDate": "2026-08-20",
    "details": [{ "medicineCode": "MED-001", "quantity": 1 }]
  }' | jq .
echo ""

echo "=== Demo completed ==="
