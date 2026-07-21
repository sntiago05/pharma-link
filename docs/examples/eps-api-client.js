/**
 * Example: EPS API Client for PharmaLink
 * 
 * This demonstrates how an external EPS (electronic prescription system)
 * would authenticate and send orders to PharmaLink using X-API-Key.
 * 
 * Usage:
 *   node docs/examples/eps-api-client.js
 */

import fetch from 'node-fetch';

class EPSClient {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Send a prescription order to PharmaLink
   * @param {Object} orderData - Order details (orderNumber, patientDocument, medicines, etc.)
   * @returns {Promise<Object>} Response from PharmaLink
   */
  async sendOrder(orderData) {
    try {
      const response = await fetch(`${this.baseUrl}/api/integrations/eps/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          `${response.status}: ${data.message || 'Unknown error'}`
        );
      }

      return data;
    } catch (error) {
      console.error('Failed to send order:', error.message);
      throw error;
    }
  }

  /**
   * Send an order for a new patient (pre-enrollment)
   */
  async sendOrderForNewPatient(orderNumber, patientData, medicines) {
    return this.sendOrder({
      orderNumber,
      patientDocument: patientData.document,
      patientFullName: patientData.fullName,
      patientEmail: patientData.email,
      patientPhone: patientData.phone,
      issueDate: new Date().toISOString().split('T')[0],
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      details: medicines,
    });
  }

  /**
   * Send an order for an existing patient
   */
  async sendOrderForExistingPatient(orderNumber, patientDocument, medicines) {
    return this.sendOrder({
      orderNumber,
      patientDocument,
      issueDate: new Date().toISOString().split('T')[0],
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      details: medicines,
    });
  }
}

/**
 * Demo execution
 */
async function runDemo() {
  const BASE_URL = process.env.PHARMALINK_URL || 'http://localhost:4000';
  const API_KEY = process.env.EPS_API_KEY || 'eps-demo-key';

  const client = new EPSClient(BASE_URL, API_KEY);

  console.log('=== PharmaLink EPS Integration Demo ===\n');

  try {
    // Example 1: Existing patient
    console.log('1. Sending order for existing patient...');
    const result1 = await client.sendOrderForExistingPatient(
      'EPS-NODE-001',
      '1020304050',
      [
        { medicineCode: 'MED-001', quantity: 2 },
        { medicineCode: 'MED-002', quantity: 1 },
      ]
    );
    console.log('Success:', result1.data?.order_number);
    console.log('Status:', result1.data?.status);
    console.log();

    // Example 2: New patient (pre-enrollment)
    console.log('2. Sending order for new patient (auto pre-enrollment)...');
    const result2 = await client.sendOrderForNewPatient(
      'EPS-NODE-002',
      {
        document: '9999888877',
        fullName: 'Ana López García',
        email: 'ana.lopez@example.com',
        phone: '3008765432',
      },
      [{ medicineCode: 'MED-003', quantity: 1 }]
    );
    console.log('Success:', result2.data?.order_number);
    console.log('Status:', result2.data?.status);
    console.log();

    // Example 3: Idempotent update (same orderNumber)
    console.log('3. Updating the first order (idempotent)...');
    const result3 = await client.sendOrderForExistingPatient(
      'EPS-NODE-001',
      '1020304050',
      [
        { medicineCode: 'MED-001', quantity: 3 },
        { medicineCode: 'MED-002', quantity: 2 },
      ]
    );
    console.log('Success:', result3.data?.order_number);
    console.log('Updated quantity of MED-001 to 3');
    console.log();

    console.log('=== All demos completed successfully ===');
  } catch (error) {
    console.error('Demo failed:', error.message);
    process.exit(1);
  }
}

// Run demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDemo();
}

export { EPSClient };
