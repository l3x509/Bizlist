// src/server.js
// ============================================================
// BIZNIS BOSTON — Main Server
// Express app, Meta webhook verification,
// incoming message handler, health check.
// ============================================================

import 'dotenv/config';
import express        from 'express';
import { config, validateConfig } from './config.js';
import { extractMessage, sendMessage, markAsRead } from './whatsapp.js';
import { processMessage, handleAudio }              from './agent.js';
import { anonymizePhone }                           from './privacy.js';
import { optOutUser, isUserOptedIn }                from './database.js';
import { optOut }                                   from './messages.js';

// ── Validate environment on startup ───────────────────────
validateConfig();

const app = express();
app.use(express.json());

// ── Health Check ──────────────────────────────────────────
// Railway and Meta both ping this to verify the server is alive

app.get('/', (req, res) => {
  res.json({
    status:  'ok',
    service: 'BIZNIS Boston',
    version: '1.0.0',
    time:    new Date().toISOString(),
  });
});

// ── Meta Webhook Verification ─────────────────────────────
// Meta sends a GET request when you first set up the webhook.
// Must respond with the challenge token to verify ownership.

app.get('/webhook', (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.meta.webhookVerifyToken) {
    console.log('[Webhook] Verification successful');
    res.status(200).send(challenge);
  } else {
    console.warn('[Webhook] Verification failed — token mismatch');
    res.sendStatus(403);
  }
});

// ── Incoming Message Handler ──────────────────────────────
// Meta sends a POST for every incoming WhatsApp message.
// MUST respond 200 immediately — Meta retries if no fast response.

app.post('/webhook', async (req, res) => {

  // Respond to Meta immediately — processing happens async
  res.sendStatus(200);

  try {
    const message = extractMessage(req.body);

    // Ignore non-message events (status updates, etc.)
    if (!message) return;

    const { from, messageId, type, text, audio } = message;

    console.log(`[Webhook] Message from ${from.slice(-4)} | type: ${type}`);

    // Mark message as read (shows blue checkmarks)
    await markAsRead(messageId);

    // Anonymize the phone number before any DB operations
    const anonymousId = anonymizePhone(from);

    // ── Handle STOP command ─────────────────────────────
    if (text && config.commands.stop.includes(text.trim().toUpperCase())) {
      await optOutUser(anonymousId);
      await sendMessage(from, optOut.creole);
      return;
    }

    // ── Check opt-in status ─────────────────────────────
    const optedIn = await isUserOptedIn(anonymousId);
    if (!optedIn) {
      // User previously unsubscribed — re-subscribe them on contact
      // (WhatsApp policy: if they message you, they're re-opting in)
      console.log(`[Webhook] Re-subscribing user ${anonymousId}`);
    }

    // ── Handle audio messages ───────────────────────────
    if (type === 'audio') {
      await sendMessage(from, handleAudio('creole'));
      return;
    }

    // ── Handle unsupported message types ────────────────
    if (type !== 'text' || !text) {
      console.log(`[Webhook] Unsupported message type: ${type}`);
      return;
    }

    // ── Process text message with AI agent ──────────────
    const response = await processMessage(text, anonymousId);
    await sendMessage(from, response);

    console.log(`[Webhook] Response sent to ${from.slice(-4)}`);

  } catch (err) {
    console.error('[Webhook] Handler error:', err.message);
    // Don't crash — just log. Meta already got the 200.
  }
});

// ── Admin Endpoints ───────────────────────────────────────
// Simple read-only analytics endpoints.
// Protect these with a secret key in production.

app.get('/admin/needs', async (req, res) => {
  const key = req.headers['x-admin-key'];
  if (key !== process.env.ADMIN_KEY) {
    return res.sendStatus(401);
  }

  const { getCommunityNeeds } = await import('./database.js');
  const needs = await getCommunityNeeds(50);
  res.json({ data: needs });
});

app.get('/admin/leads', async (req, res) => {
  const key = req.headers['x-admin-key'];
  if (key !== process.env.ADMIN_KEY) {
    return res.sendStatus(401);
  }

  const { getBusinessLeadReport } = await import('./database.js');
  const report = await getBusinessLeadReport();
  res.json({ data: report });
});

// ── Start Server ──────────────────────────────────────────
app.listen(config.port, () => {
  console.log(`
╔════════════════════════════════════════╗
║         BIZNIS BOSTON v1.0.0           ║
║   Haitian Business Directory Agent    ║
╠════════════════════════════════════════╣
║  Status:  Running                      ║
║  Port:    ${config.port}                          ║
║  Env:     ${config.environment}                ║
║  Webhook: POST /webhook                ║
║  Health:  GET /                        ║
╚════════════════════════════════════════╝
  `);
});

export default app;
