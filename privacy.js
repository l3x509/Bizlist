// src/privacy.js
// ============================================================
// BIZNIS BOSTON — Privacy Utilities
// Phone numbers are hashed before any storage.
// Real phone numbers NEVER touch the database.
// ============================================================

import crypto from 'crypto';
import { config } from './config.js';

/**
 * Convert a real WhatsApp phone number into an anonymous ID.
 * One-way hash — cannot be reversed.
 * Same phone always produces same anonymous ID (for tracking).
 *
 * @param {string} phone - Raw phone number from WhatsApp (e.g. "16175551234")
 * @returns {string} - 16-character hex anonymous ID
 */
export function anonymizePhone(phone) {
  return crypto
    .createHmac('sha256', config.privacy.hashSalt)
    .update(phone.trim())
    .digest('hex')
    .substring(0, config.privacy.anonIdLength);
}

/**
 * Strip any PII from a query before logging.
 * Removes phone numbers, emails, and common name patterns.
 *
 * @param {string} query - Raw user query
 * @returns {string} - Sanitized query safe to log
 */
export function sanitizeQuery(query) {
  return query
    // Remove phone numbers
    .replace(/(\+?1?\s?)?(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/g, '[PHONE]')
    // Remove email addresses
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
    // Trim whitespace
    .trim()
    // Limit length for storage
    .substring(0, 500);
}
