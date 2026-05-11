// src/whatsapp.js
// ============================================================
// BIZNIS BOSTON — WhatsApp / Meta Cloud API Client
// All outgoing message calls live here.
// ============================================================

import { config } from './config.js';

const BASE_URL = `${config.meta.apiUrl}/${config.meta.phoneNumberId}/messages`;

/**
 * Send a plain text message via WhatsApp Cloud API.
 *
 * @param {string} to   - Recipient phone number (e.g. "16175551234")
 * @param {string} body - Message text (supports WhatsApp markdown: *bold*, _italic_)
 * @returns {Promise<object>} - Meta API response
 */
export async function sendMessage(to, body) {
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.meta.accessToken}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type:    'individual',
        to:                to,
        type:              'text',
        text: {
          preview_url: false,
          body:        body,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[WhatsApp] Send error:', JSON.stringify(data));
    }

    return data;

  } catch (error) {
    console.error('[WhatsApp] Network error:', error.message);
    throw error;
  }
}

/**
 * Mark an incoming message as read.
 * Shows the double blue checkmark to the user.
 *
 * @param {string} messageId - The message ID from the webhook payload
 */
export async function markAsRead(messageId) {
  try {
    await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.meta.accessToken}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status:            'read',
        message_id:        messageId,
      }),
    });
  } catch (error) {
    // Non-critical — don't crash if this fails
    console.warn('[WhatsApp] markAsRead failed:', error.message);
  }
}

/**
 * Extract the message details from a Meta webhook payload.
 * Returns null if no actionable message found.
 *
 * @param {object} body - Raw webhook POST body from Meta
 * @returns {object|null} - { from, messageId, type, text, audio } or null
 */
export function extractMessage(body) {
  try {
    const entry   = body?.entry?.[0];
    const change  = entry?.changes?.[0];
    const value   = change?.value;
    const message = value?.messages?.[0];

    if (!message) return null;

    return {
      from:      message.from,
      messageId: message.id,
      type:      message.type,
      text:      message.type === 'text'  ? message.text?.body      : null,
      audio:     message.type === 'audio' ? message.audio?.id       : null,
      timestamp: message.timestamp,
    };

  } catch {
    return null;
  }
}
