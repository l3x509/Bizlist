// server.js
// ============================================================
// BIZNIS BOSTON — Main Server
// Express app, Meta webhook verification,
// incoming message handler, health check.
// ============================================================

import 'dotenv/config';
import express        from 'express';
import { config, validateConfig }                    from './config.js';
import { extractMessage, sendMessage, markAsRead }   from './whatsapp.js';
import { processMessage, handleAudio }               from './agent.js';
import { anonymizePhone }                            from './privacy.js';
import {
  optOutUser,
  isUserOptedIn,
  getCommunityNeeds,
  getBusinessLeadReport,
}                                                    from './database.js';
import { optOut }                                    from './messages.js';

// ── Process-level crash handlers ──────────────────────────
// These catch ANY unhandled error or rejected promise and log
// it before the process exits. Without these, Railway shows
// "Stopping Container" with no explanation.
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION — process will exit');
  console.error(err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION at:', promise);
  console.error('Reason:', reason);
  process.exit(1);
});

// ── Validate environment on startup ───────────────────────
// Logs exactly which env vars are missing if any
validateConfig();

const app = express();
app.use(express.json());

// ── In-memory debug buffer ─────────────────────────────────
// Stores last 20 raw webhook payloads for /admin/debug
// Clears on server restart — production diagnostics only
const debugBuffer = [];
function pushDebug(payload) {
  debugBuffer.unshift({ time: new Date().toISOString(), payload });
  if (debugBuffer.length > 20) debugBuffer.pop();
}

// ── Health Check ──────────────────────────────────────────
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
    console.log('[Webhook] ✅ Verification successful');
    res.status(200).send(challenge);
  } else {
    console.warn('[Webhook] ❌ Verification failed — token mismatch');
    console.warn('[Webhook] Received token:', token);
    res.sendStatus(403);
  }
});

// ── Incoming Message Handler ──────────────────────────────
// Meta sends a POST for every incoming WhatsApp message.
// MUST respond 200 immediately — Meta retries if no fast ack.

app.post('/webhook', async (req, res) => {

  // ── Step 1: Respond to Meta immediately ─────────────────
  // This must happen before any async work.
  // If Meta doesn't get 200 within ~5 seconds it retries.
  res.sendStatus(200);

  // ── Step 2: Log raw payload ──────────────────────────────
  // This is the most important diagnostic line.
  // If you see this in Railway logs, Meta IS sending POSTs.
  // If you never see this, the problem is upstream (Meta not sending).
  console.log('[Webhook] 📨 POST received at', new Date().toISOString());
  console.log('[Webhook] Raw body:', JSON.stringify(req.body, null, 2));

  // Store in debug buffer for /admin/debug endpoint
  pushDebug(req.body);

  try {
    // ── Step 3: Extract message ──────────────────────────
    // Meta sends many non-message events (delivery receipts,
    // read receipts, status updates). extractMessage() returns
    // null for all of those — that is expected and normal.
    const message = extractMessage(req.body);

    if (!message) {
      // Log what type of event this was so we know Meta IS delivering
      const entry   = req.body?.entry?.[0];
      const changes = entry?.changes?.[0];
      const field   = changes?.field;
      const value   = changes?.value;

      if (value?.statuses) {
        const status = value.statuses[0];
        console.log(`[Webhook] 📋 Status update: ${status?.status} for message ${status?.id}`);
      } else {
        console.log(`[Webhook] ⏭️  Non-message event, field: ${field} — skipping`);
      }
      return;
    }

    // ── Step 4: Process actual message ──────────────────
    const { from, messageId, type, text, audio } = message;

    console.log(`[Webhook] 💬 Message from ...${from.slice(-4)} | type: ${type} | id: ${messageId}`);

    // Mark message as read (blue checkmarks)
    await markAsRead(messageId);

    // Anonymize before any DB operations
    const anonymousId = anonymizePhone(from);

    // ── Handle STOP command ─────────────────────────────
    if (text && config.commands.stop.includes(text.trim().toUpperCase())) {
      console.log(`[Webhook] 🛑 STOP command from ...${from.slice(-4)}`);
      await optOutUser(anonymousId);
      await sendMessage(from, optOut.creole);
      return;
    }

    // ── Check opt-in status ─────────────────────────────
    const optedIn = await isUserOptedIn(anonymousId);
    if (!optedIn) {
      console.log(`[Webhook] 🔄 Re-subscribing user ${anonymousId}`);
    }

    // ── Handle audio messages ───────────────────────────
    if (type === 'audio') {
      console.log(`[Webhook] 🎤 Audio message — sending not-supported response`);
      await sendMessage(from, handleAudio('creole'));
      return;
    }

    // ── Handle unsupported message types ────────────────
    if (type !== 'text' || !text) {
      console.log(`[Webhook] ⚠️  Unsupported message type: ${type}`);
      return;
    }

    // ── Process text message with AI agent ──────────────
    console.log(`[Webhook] 🤖 Processing: "${text.slice(0, 60)}..."`);
    const response = await processMessage(text, anonymousId);
    await sendMessage(from, response);

    console.log(`[Webhook] ✅ Response sent to ...${from.slice(-4)}`);

  } catch (err) {
    // Log full stack — err.message alone hides too much
    console.error('[Webhook] ❌ Handler error:', err);
  }
});

// ── Admin Endpoints ───────────────────────────────────────

function requireAdminKey(req, res) {
  const key = req.headers['x-admin-key'];
  if (key !== process.env.ADMIN_KEY) {
    res.sendStatus(401);
    return false;
  }
  return true;
}

// Last 20 raw webhook payloads — use this to diagnose Meta issues
app.get('/admin/debug', (req, res) => {
  if (!requireAdminKey(req, res)) return;
  res.json({
    count:   debugBuffer.length,
    buffer:  debugBuffer,
  });
});

// Community needs — feeds TwinZile research pipeline
app.get('/admin/needs', async (req, res) => {
  if (!requireAdminKey(req, res)) return;
  const needs = await getCommunityNeeds(50);
  res.json({ data: needs });
});

// Business lead report — used for upgrade pitch
app.get('/admin/leads', async (req, res) => {
  if (!requireAdminKey(req, res)) return;
  const report = await getBusinessLeadReport();
  res.json({ data: report });
});

// Manual test — simulate a message without WhatsApp
// POST /admin/test with { "from": "15551234567", "text": "doktè kreyòl" }
app.post('/admin/test', async (req, res) => {
  if (!requireAdminKey(req, res)) return;

  const { from = 'test_user', text = 'bonjou' } = req.body;

  try {
    const anonymousId = anonymizePhone(from);
    const response    = await processMessage(text, anonymousId);
    res.json({ input: text, response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Start Server ──────────────────────────────────────────
// Log before listen so we know exactly where a crash happens
console.log(`[Server] Starting on port ${config.port}...`);

const server = app.listen(config.port, () => {
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
║  Debug:   GET /admin/debug             ║
╚════════════════════════════════════════╝
  `);
});

// Catch port-in-use and other listen errors
server.on('error', (err) => {
  console.error('💥 Server failed to start:', err);
  process.exit(1);
});

export default app;
