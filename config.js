// src/config.js
// ============================================================
// BIZNIS BOSTON — Central Configuration
// All constants live here. Change settings in one place.
// ============================================================

export const config = {

  // ── Server ────────────────────────────────────────────────
  port: process.env.PORT || 3000,
  environment: process.env.NODE_ENV || 'development',

  // ── Anthropic ─────────────────────────────────────────────
  anthropic: {
    model: 'claude-sonnet-4-5',
    maxTokens: 1000,
    apiKey: process.env.ANTHROPIC_API_KEY,
  },

  // ── Supabase ──────────────────────────────────────────────
  supabase: {
    url: process.env.SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
  },

  // ── Meta / WhatsApp ───────────────────────────────────────
  meta: {
    accessToken: process.env.META_ACCESS_TOKEN,
    phoneNumberId: process.env.PHONE_NUMBER_ID,
    webhookVerifyToken: process.env.WEBHOOK_VERIFY_TOKEN,
    apiVersion: 'v19.0',
    get apiUrl() {
      return `https://graph.facebook.com/${this.apiVersion}`;
    },
  },

  // ── Privacy ───────────────────────────────────────────────
  privacy: {
    hashSalt: process.env.HASH_SALT,
    anonIdLength: 16,
  },

  // ── Directory Settings ────────────────────────────────────
  directory: {
    maxResultsPerSearch: 5,
    defaultCity: 'Boston',
    supportedLanguages: ['creole', 'french', 'english'],
  },

  // ── Business Categories ───────────────────────────────────
  // These match exactly what is in your Supabase database
  categories: [
    { key: 'Sèvis Legal',      emoji: '⚖️',  keywords: ['avoka', 'lawyer', 'legal', 'imigrasyon', 'immigration', 'notè', 'notary', 'daca', 'green card'] },
    { key: 'Sèvis Taks',       emoji: '💰',  keywords: ['taks', 'tax', 'kontab', 'accountant', 'impôt', 'itin', 'irs'] },
    { key: 'Sante',            emoji: '🏥',  keywords: ['doktè', 'doctor', 'médecin', 'dantis', 'dentist', 'enfimyè', 'nurse', 'famasi', 'pharmacy', 'sante', 'health'] },
    { key: 'Imobilye',         emoji: '🏠',  keywords: ['kay', 'house', 'maison', 'apaman', 'apartment', 'imobilye', 'real estate', 'mortgage', 'lwaye', 'rent'] },
    { key: 'Transpò',          emoji: '🚗',  keywords: ['machin', 'car', 'voiture', 'mekanik', 'mechanic', 'déménagement', 'moving', 'transpò', 'transport'] },
    { key: 'Manje',            emoji: '🍽️', keywords: ['manje', 'food', 'nourriture', 'resto', 'restaurant', 'traiteur', 'catering', 'griot', 'diri', 'boutik'] },
    { key: 'Bote',             emoji: '💇',  keywords: ['cheve', 'hair', 'salon', 'bèl', 'beauty', 'trese', 'braid', 'zong', 'nail', 'bab', 'barber'] },
    { key: 'Lekòl',            emoji: '📚',  keywords: ['lekòl', 'school', 'école', 'timoun', 'children', 'enfant', 'gadri', 'daycare', 'lessons', 'tuteur', 'tutor'] },
    { key: 'Legliz',           emoji: '⛪',  keywords: ['legliz', 'church', 'église', 'pastè', 'pastor', 'prè', 'prayer', 'lapriyè'] },
    { key: 'Voye Kòb',         emoji: '💸',  keywords: ['voye kòb', 'transfer', 'argent', 'money', 'remittance', 'ayiti', 'haiti', 'shipping', 'livraison'] },
    { key: 'Konstriksyon',     emoji: '🔨',  keywords: ['konstriksyon', 'construction', 'plonmye', 'plumber', 'elektrisyen', 'electrician', 'reparasyon', 'repair', 'contractor'] },
    { key: 'Lòt',              emoji: '🔍',  keywords: [] },
  ],

  // ── Special Commands ──────────────────────────────────────
  commands: {
    menu:      ['MENU', 'MENI', 'AIDE', 'HELP', 'OPSYON'],
    stop:      ['STOP', 'ARETE', 'ARRÊT', 'UNSUBSCRIBE'],
    start:     ['START', 'KÒMANSE', 'BONJOU', 'BONSWA', 'HELLO', 'HI'],
  },

};

// ── Validate Required Environment Variables ────────────────
export function validateConfig() {
  const required = [
    ['ANTHROPIC_API_KEY',   config.anthropic.apiKey],
    ['SUPABASE_URL',        config.supabase.url],
    ['SUPABASE_SERVICE_KEY',config.supabase.serviceKey],
    ['META_ACCESS_TOKEN',   config.meta.accessToken],
    ['PHONE_NUMBER_ID',     config.meta.phoneNumberId],
    ['WEBHOOK_VERIFY_TOKEN',config.meta.webhookVerifyToken],
    ['HASH_SALT',           config.privacy.hashSalt],
  ];

  const missing = required
    .filter(([, val]) => !val)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n  ${missing.join('\n  ')}\n` +
      `Copy .env.example to .env and fill in all values.`
    );
  }
}
