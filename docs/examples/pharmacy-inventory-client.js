/**
 * Pharmacy Inventory Client
 * 
 * This service handles communication with external pharmacy inventory APIs.
 * It abstracts the difference between:
 * 
 * 1. Demo mode: inventory_api_url = "internal://inventory"
 *    → Uses internal logic (no network calls)
 * 
 * 2. Production mode: inventory_api_url = "https://pharmacy.com/api/inventory"
 *    → Makes actual HTTP calls with Bearer token authentication
 * 
 * Usage:
 *   const client = new PharmacyInventoryClient(pharmacy.inventory_api_url, pharmacy.api_key);
 *   const availability = await client.checkAvailability(medicines);
 */

import fetch from 'node-fetch';
import { logger } from '../config/logger.js';
import { ApiError } from '../utils/api-error.js';

export class PharmacyInventoryClient {
  constructor(inventoryApiUrl, apiKey) {
    this.baseUrl = inventoryApiUrl;
    this.apiKey = apiKey;
    this.isInternal = inventoryApiUrl === 'internal://inventory';
    this.timeout = 5000; // 5 second timeout for external APIs
  }

  /**
   * Check medicine availability
   * @param {Array} medicines - Array of {medicineCode, quantity}
   * @returns {Object} { success: boolean, available: boolean, items: Array }
   */
  async checkAvailability(medicines) {
    if (this.isInternal) {
      return this._mockAvailability(medicines);
    }

    try {
      const response = await this._request('/availability', {
        medicines,
      });

      if (!response.success || response.available === false) {
        return response;
      }

      return response;
    } catch (error) {
      logger.error('Pharmacy availability check failed', {
        url: this.baseUrl,
        error: error.message,
      });
      throw ApiError.serviceUnavailable(
        'Could not verify medicine availability with the pharmacy. Please try again later.'
      );
    }
  }

  /**
   * Reserve/block medicines for a time slot
   * @param {Object} reservationData - Reservation details with medicines
   * @returns {Object} { success: boolean, blocked: boolean }
   */
  async reserve(reservationData) {
    if (this.isInternal) {
      return this._mockReserve(reservationData);
    }

    try {
      const response = await this._request('/reserve', reservationData);

      if (!response.success) {
        logger.warn('Pharmacy reserve call failed', {
          url: this.baseUrl,
          response,
        });
        throw new Error(response.message || 'Failed to reserve medicines');
      }

      return response;
    } catch (error) {
      logger.error('Pharmacy reserve failed', {
        url: this.baseUrl,
        error: error.message,
      });
      throw ApiError.conflict(
        'Could not reserve medicines at the pharmacy. They may be out of stock.'
      );
    }
  }

  /**
   * Confirm delivery of medicines
   * @param {Object} deliveryData - Delivery confirmation details
   * @returns {Object} { success: boolean }
   */
  async deliver(deliveryData) {
    if (this.isInternal) {
      return this._mockDeliver(deliveryData);
    }

    try {
      const response = await this._request('/deliver', deliveryData);

      if (!response.success) {
        logger.warn('Pharmacy deliver call failed', {
          url: this.baseUrl,
          response,
        });
        throw new Error(response.message || 'Failed to confirm delivery');
      }

      return response;
    } catch (error) {
      logger.error('Pharmacy deliver failed', {
        url: this.baseUrl,
        error: error.message,
      });
      throw ApiError.serviceUnavailable('Could not confirm delivery with the pharmacy.');
    }
  }

  // ============ Private Methods ============

  /**
   * Make HTTP request to pharmacy API
   * @private
   */
  async _request(endpoint, body) {
    const url = new URL(endpoint, this.baseUrl).toString();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error details');
        throw new Error(
          `Pharmacy API returned ${response.status}: ${errorText}`
        );
      }

      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // ============ Mock Implementations (Demo Mode) ============

  /**
   * Mock: Simulate availability check
   * @private
   */
  _mockAvailability(medicines) {
    // Demo: assume all medicines are always available
    const items = medicines.map((m) => ({
      medicineCode: m.medicineCode,
      available: m.quantity, // Simplification: always have exact quantity
    }));

    return {
      success: true,
      available: true,
      items,
      demo: true, // Mark as demo mode
    };
  }

  /**
   * Mock: Simulate reservation
   * @private
   */
  _mockReserve(reservationData) {
    // Demo: always succeed
    return {
      success: true,
      blocked: true,
      reservationId: reservationData.reservationId,
      message: 'Medicines reserved successfully (demo)',
      demo: true,
    };
  }

  /**
   * Mock: Simulate delivery confirmation
   * @private
   */
  _mockDeliver(deliveryData) {
    // Demo: always succeed
    return {
      success: true,
      message: 'Delivery confirmed and inventory updated (demo)',
      demo: true,
    };
  }
}

// ============ Factory Function ============

/**
 * Create a pharmacy inventory client for a specific pharmacy
 * @param {Object} pharmacy - Pharmacy record with inventory_api_url and api_key
 * @returns {PharmacyInventoryClient}
 */
export function createPharmacyInventoryClient(pharmacy) {
  return new PharmacyInventoryClient(
    pharmacy.inventory_api_url || 'internal://inventory',
    pharmacy.api_key || null
  );
}

/**
 * Usage example in a reservation service:
 * 
 * import { createPharmacyInventoryClient } from './pharmacy-inventory-client.js';
 * 
 * const pharmacy = await getPharmacy(pharmacyId);
 * const client = createPharmacyInventoryClient(pharmacy);
 * 
 * // Check availability
 * const availability = await client.checkAvailability([
 *   { medicineCode: 'MED-001', quantity: 2 }
 * ]);
 * 
 * if (!availability.available) {
 *   throw new Error('Medicines not available');
 * }
 * 
 * // Reserve medicines
 * const reservation = await client.reserve({
 *   reservationId: `RES-${Date.now()}`,
 *   reservationDate: '2026-07-22',
 *   startTime: '08:00',
 *   endTime: '08:30',
 *   medicines: [...],
 * });
 * 
 * // Later, confirm delivery
 * await client.deliver({
 *   reservationId,
 *   deliveredBy: 'Juan Pharmacist',
 *   deliveredAt: new Date().toISOString(),
 *   medicines: [...],
 * });
 */
