// server.js
// ============================================================
// BIZLIST — Main Server
// Express app, Twilio webhook handler,
// incoming message processor, health check.
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

// ── Exit interceptor ───────────────────────────────────────
process.on('exit', (code) => {
  console.error(`[Server] ⚠️  Process exiting with code ${code}`);
});

const _originalExit = process.exit.bind(process);
process.exit = (code) => {
  console.error(`[Server] 🚨 process.exit(${code}) called — stack trace:`);
  console.trace();
  _originalExit(code);
};

// ── Validate environment on startup ───────────────────────
validateConfig();

const app = express();

// ── Body parsers ──────────────────────────────────────────
// Twilio webhooks: application/x-www-form-urlencoded
// Admin endpoints: application/json
// Both coexist — Express picks based on Content-Type header
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// ── In-memory debug buffer ─────────────────────────────────
const debugBuffer = [];
function pushDebug(payload) {
  debugBuffer.unshift({ time: new Date().toISOString(), payload });
  if (debugBuffer.length > 20) debugBuffer.pop();
}

// ── Health Check ──────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status:  'ok',
    service: 'BizList',
    version: '1.0.0',
    time:    new Date().toISOString(),
  });
});

// ── Webhook GET ───────────────────────────────────────────
// Twilio does not use GET verification like Meta.
// Kept for health checks and Railway probes.
app.get('/webhook', (req, res) => {
  res.json({ status: 'ok', message: 'BizList webhook active' });
});

// ── Incoming Message Handler ──────────────────────────────
// Twilio sends form-encoded POST for every incoming message.
// Must respond 200 quickly — Twilio retries without fast ack.

app.post('/webhook', async (req, res) => {

  // Respond immediately — processing is async
  res.sendStatus(200);

  // Log raw payload — if you see this, Twilio IS hitting Railway
  console.log('[Webhook] 📨 POST received at', new Date().toISOString());
  console.log('[Webhook] Body:', JSON.stringify(req.body, null, 2));
  pushDebug(req.body);

  try {
    const message = extractMessage(req.body);

    if (!message) {
      console.log('[Webhook] ⏭️  Non-message event — skipping');
      return;
    }

    const { from, messageId, type, text } = message;
    console.log(`[Webhook] 💬 From ...${from.slice(-4)} | type: ${type}`);

    await markAsRead(messageId); // no-op for Twilio

    const anonymousId = anonymizePhone(from);

    // ── STOP command ───────────────────────────────────────
    if (text && config.commands.stop.includes(text.trim().toUpperCase())) {
      console.log(`[Webhook] 🛑 STOP from ...${from.slice(-4)}`);
      await optOutUser(anonymousId);
      await sendMessage(from, optOut.creole);
      return;
    }

    // ── Opt-in check ───────────────────────────────────────
    const optedIn = await isUserOptedIn(anonymousId);
    if (!optedIn) {
      console.log(`[Webhook] 🔄 Re-subscribing ...${from.slice(-4)}`);
    }

    // ── Audio ──────────────────────────────────────────────
    if (type === 'audio') {
      console.log('[Webhook] 🎤 Audio not supported');
      await sendMessage(from, handleAudio('creole'));
      return;
    }

    // ── Unsupported type ───────────────────────────────────
    if (type !== 'text' || !text) {
      console.log(`[Webhook] ⚠️  Unsupported type: ${type}`);
      return;
    }

    // ── Process with Claude ────────────────────────────────
    console.log(`[Webhook] 🤖 Processing: "${text.slice(0, 60)}"`);
    const response = await processMessage(text, anonymousId);
    await sendMessage(from, response);
    console.log(`[Webhook] ✅ Response sent to ...${from.slice(-4)}`);

  } catch (err) {
    console.error('[Webhook] ❌ Error:', err);
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

// Last 20 raw webhook payloads — use to diagnose Twilio issues
app.get('/admin/debug', (req, res) => {
  if (!requireAdminKey(req, res)) return;
  res.json({ count: debugBuffer.length, buffer: debugBuffer });
});

// Community needs — feeds TwinZile research pipeline
app.get('/admin/needs', async (req, res) => {
  if (!requireAdminKey(req, res)) return;
  const needs = await getCommunityNeeds(50);
  res.json({ data: needs });
});

// Business lead report
app.get('/admin/leads', async (req, res) => {
  if (!requireAdminKey(req, res)) return;
  const report = await getBusinessLeadReport();
  res.json({ data: report });
});

// Manual pipeline test — no WhatsApp needed
// POST /admin/test  { "from": "15551234567", "text": "doktè kreyòl Boston" }
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

// ── Signal handlers ───────────────────────────────────────
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received — shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received');
  process.exit(0);
});

// ── Start Server ──────────────────────────────────────────
const PORT = parseInt(process.env.PORT) || config.port || 8080;
console.log(`[Server] Starting on port ${PORT}...`);

const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║             BIZLIST v1.0.0             ║
║   Haitian Business Directory Agent    ║
╠════════════════════════════════════════╣
║  Status:  Running                      ║
║  Port:    ${PORT}                             ║
║  Env:     ${config.environment}                ║
║  Webhook: POST /webhook                ║
║  Health:  GET /                        ║
║  Debug:   GET /admin/debug             ║
╚════════════════════════════════════════╝
  `);
});

server.on('error', (err) => {
  console.error('💥 Server failed to start:', err);
  process.exit(1);
});

export default app;
