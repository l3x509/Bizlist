// src/agent.js
// ============================================================
// BIZNIS BOSTON — AI Agent
// Claude processes every incoming message here.
// Detects language, understands intent, matches category,
// searches the database, and returns a formatted response.
// ============================================================

import Anthropic from '@anthropic-ai/sdk';
import { config } from './config.js';
import {
  searchBusinesses,
  logSearch,
  logZeroResult,
  logLeads,
  incrementUserSearches,
  upsertUser,
} from './database.js';
import {
  welcome,
  menu,
  optOut,
  noResults,
  notUnderstood,
  audioNotSupported,
  error,
  formatResults,
} from './messages.js';
import { sanitizeQuery } from './privacy.js';

const anthropic = new Anthropic({ apiKey: config.anthropic.apiKey });

// ── SYSTEM PROMPT ─────────────────────────────────────────
// Tells Claude exactly what BIZNIS is and how to analyze queries

const SYSTEM_PROMPT = `You are the intent detection engine for BIZNIS Boston — a WhatsApp directory service for the Haitian community in Greater Boston, Massachusetts.

Your ONLY job is to analyze incoming messages and return a JSON object. You never respond conversationally. You only return JSON.

Supported languages: Haitian Creole, French, English. Users often mix languages.

Available categories (use EXACTLY these names):
- Sèvis Legal
- Sèvis Taks
- Sante
- Imobilye
- Transpò
- Manje
- Bote
- Lekòl
- Legliz
- Voye Kòb
- Konstriksyon
- Lòt

Return ONLY this JSON object, no markdown, no explanation, no preamble:
{
  "language": "creole" | "french" | "english",
  "intent": "search" | "greeting" | "menu" | "stop" | "unclear",
  "category": "exact category name from the list above or null",
  "subcategory": "more specific service if clear or null",
  "confidence": 0.0 to 1.0,
  "normalized_query": "the search in simple english words"
}

Rules:
- Greetings like bonjou, bonswa, hello, hi, hey = intent "greeting"
- MENU, MENI, AIDE, HELP = intent "menu"
- STOP, ARETE = intent "stop"
- Any real service search = intent "search" with matching category
- If you cannot determine the category with confidence > 0.5, use intent "unclear"
- Always detect the PRIMARY language even if the message mixes languages
- Haitian Creole phrases: "mwen bezwen" = I need, "ki kote" = where, "jwenn" = find`;

// ── MAIN AGENT FUNCTION ───────────────────────────────────

/**
 * Process an incoming WhatsApp message end-to-end.
 * Returns the response string to send back to the user.
 *
 * @param {string} userText    - Raw message text from user
 * @param {string} anonymousId - Hashed user ID for tracking
 * @returns {Promise<string>}  - Response message to send
 */
export async function processMessage(userText, anonymousId) {
  try {

    // ── Step 1: Detect intent with Claude ─────────────────
    const intent = await detectIntent(userText);

    console.log(`[Agent] Intent: ${intent.intent} | Lang: ${intent.language} | Category: ${intent.category} | Confidence: ${intent.confidence}`);

    // ── Step 2: Handle special intents ────────────────────

    if (intent.intent === 'greeting') {
      await upsertUser(anonymousId, intent.language);
      return welcome[intent.language] || welcome.creole;
    }

    if (intent.intent === 'menu') {
      return menu[intent.language] || menu.creole;
    }

    if (intent.intent === 'stop') {
      return optOut[intent.language] || optOut.creole;
    }

    if (intent.intent === 'unclear' || !intent.category) {
      await logSearch({
        anonymousUserId:  anonymousId,
        rawQuery:         sanitizeQuery(userText),
        detectedLanguage: intent.language,
        categoryMatched:  null,
        resultsCount:     0,
        hadResults:       false,
      });
      return notUnderstood[intent.language] || notUnderstood.creole;
    }

    // ── Step 3: Search Supabase ────────────────────────────
    const businesses = await searchBusinesses(intent.category);
    const hadResults = businesses.length > 0;

    // ── Step 4: Log the search (research data) ────────────
    await logSearch({
      anonymousUserId:  anonymousId,
      rawQuery:         sanitizeQuery(userText),
      detectedLanguage: intent.language,
      categoryMatched:  intent.category,
      resultsCount:     businesses.length,
      hadResults:       hadResults,
    });

    // ── Step 5: Log zero results separately ───────────────
    if (!hadResults) {
      await logZeroResult(
        anonymousId,
        sanitizeQuery(userText),
        intent.language
      );
    }

    // ── Step 6: Log leads for paid businesses ─────────────
    if (hadResults) {
      const paidBusinessIds = businesses
        .filter(b => b.tier === 'premium' || b.tier === 'spotlight')
        .map(b => b.id);

      if (paidBusinessIds.length > 0) {
        await logLeads(paidBusinessIds, anonymousId, intent.category);
      }
    }

    // ── Step 7: Increment user search counter ─────────────
    await incrementUserSearches(anonymousId);

    // ── Step 8: Return formatted response ─────────────────
    if (!hadResults) {
      return noResults(intent.category, intent.language);
    }

    return formatResults(businesses, intent.category, intent.language);

  } catch (err) {
    console.error('[Agent] processMessage error:', err.message);
    return error.creole;
  }
}

// ── INTENT DETECTION ──────────────────────────────────────

/**
 * Call Claude to detect language, intent, and category.
 * Returns a structured intent object.
 *
 * @param {string} userText - Raw message from user
 * @returns {Promise<object>} - Intent object
 */
async function detectIntent(userText) {
  try {
    const response = await anthropic.messages.create({
      model:      config.anthropic.model,
      max_tokens: config.anthropic.maxTokens,
      system:     SYSTEM_PROMPT,
      messages: [
        {
          role:    'user',
          content: userText,
        },
      ],
    });

    const raw = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');

    // Strip any accidental markdown fences
    const clean = raw.replace(/```json|```/g, '').trim();

    return JSON.parse(clean);

  } catch (err) {
    console.error('[Agent] detectIntent error:', err.message);
    // Safe fallback — treat as unclear
    return {
      language:         'creole',
      intent:           'unclear',
      category:         null,
      subcategory:      null,
      confidence:       0,
      normalized_query: userText,
    };
  }
}

// ── AUDIO HANDLER ─────────────────────────────────────────

/**
 * Handle incoming audio/voice messages.
 * Currently returns a prompt to type instead.
 * Future: integrate Whisper transcription here.
 *
 * @param {string} language - Detected or default language
 * @returns {string}        - Response message
 */
export function handleAudio(language = 'creole') {
  return audioNotSupported[language] || audioNotSupported.creole;
}
