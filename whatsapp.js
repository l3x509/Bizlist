// whatsapp.js
// ============================================================
// BIZLIST — WhatsApp Client (Twilio)
// Handles sending messages and parsing incoming webhooks.
// Replaces Meta Cloud API implementation.
// To switch back to Meta: swap this file for the Meta version.
// ============================================================

import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken  = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER; // whatsapp:+14155238886

let _client;

function getClient() {
  if (!_client) {
    if (!accountSid || !authToken) {
      throw new Error('Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN');
    }
    _client = twilio(accountSid, authToken);
  }
  return _client;
}

// ── Extract message from Twilio webhook ───────────────────
// Twilio sends form-encoded POST bodies with these fields:
//   From:       whatsapp:+18572295384
//   To:         whatsapp:+14155238886
//   Body:       the message text
//   MessageSid: unique message ID
//   NumMedia:   number of attached media files

export function extractMessage(body) {
  const from      = body?.From;
  const messageId = body?.MessageSid;
  const text      = body?.Body;
  const numMedia  = parseInt(body?.NumMedia || '0');

  // Not a real message event
  if (!from || !messageId) return null;

  // Strip whatsapp: prefix for consistent phone number handling
  const cleanFrom = from.replace('whatsapp:', '');

  // Determine message type
  let type = 'text';
  if (numMedia > 0) {
    const mediaType = body?.MediaContentType0 || '';
    if (mediaType.startsWith('audio/')) {
      type = 'audio';
    } else {
      type = 'media'; // image, video, document — unsupported
    }
  }

  return {
    from:      cleanFrom,
    messageId,
    type,
    text:      text?.trim() || null,
    audio:     null,
  };
}

// ── Send a WhatsApp message ────────────────────────────────
export async function sendMessage(to, text) {
  const client = getClient();

  // Ensure whatsapp: prefix
  const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

  // Twilio has a 1600 character limit per message
  // Split long responses into chunks
  const chunks = splitMessage(text);

  for (const chunk of chunks) {
    const message = await client.messages.create({
      from: fromNumber,
      to:   toFormatted,
      body: chunk,
    });
    console.log(`[WhatsApp] ✅ Sent ${message.sid} to ...${to.slice(-4)}`);
  }
}

// ── Mark message as read ──────────────────────────────────
// Twilio WhatsApp sandbox does not support read receipts.
// This is a no-op to keep the same interface as the Meta version.
export async function markAsRead(messageId) {
  return;
}

// ── Audio not supported message ───────────────────────────
export function handleAudio(lang) {
  const responses = {
    creole:  'Nou pa ka resevwa mesaj vwa pou kounye a. Tanpri ekri kesyon ou.',
    french:  'Nous ne pouvons pas recevoir de messages vocaux. Veuillez écrire votre question.',
    english: 'We cannot receive voice messages right now. Please type your question.',
  };
  return responses[lang] || responses.creole;
}

// ── Split long messages ───────────────────────────────────
// Twilio limit is 1600 chars. Split on newlines where possible.
function splitMessage(text, maxLength = 1500) {
  if (text.length <= maxLength) return [text];

  const chunks = [];
  const lines  = text.split('\n');
  let current  = '';

  for (const line of lines) {
    if ((current + '\n' + line).length > maxLength) {
      if (current) chunks.push(current.trim());
      current = line;
    } else {
      current = current ? current + '\n' + line : line;
    }
  }

  if (current) chunks.push(current.trim());
  return chunks;
}
