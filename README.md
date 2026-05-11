# BIZNIS Boston 🇭🇹
### Haitian Business Directory — WhatsApp AI Agent

A WhatsApp AI agent that helps the Boston Haitian community find
Haitian businesses and professionals in Greater Boston.
Responds in Haitian Creole, French, and English.

---

## Project Structure

```
biznis-boston/
├── src/
│   ├── server.js      ← Main Express server + webhook handler
│   ├── agent.js       ← Claude AI intent detection + query processing
│   ├── messages.js    ← All bot responses (Creole / French / English)
│   ├── database.js    ← All Supabase operations
│   ├── whatsapp.js    ← Meta Cloud API client
│   ├── privacy.js     ← Phone anonymization + query sanitization
│   ├── config.js      ← All settings and constants
│   └── test.js        ← Local test runner (no WhatsApp needed)
├── .env.example       ← Environment variable template
├── .gitignore
├── package.json
├── railway.toml       ← Railway deployment config
└── README.md
```

---

## Setup — Step by Step

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Fill in all values in `.env` — see comments in the file for where to get each one.

### 3. Set up Supabase
- Go to supabase.com → create project named `biznis-boston`
- SQL Editor → New Query → paste `biznis_supabase_setup.sql` → Run
- Copy your `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` to `.env`

### 4. Set up Meta / WhatsApp
- Go to developers.facebook.com
- Create App → Business type
- Add WhatsApp product
- Copy `META_ACCESS_TOKEN` and `PHONE_NUMBER_ID` to `.env`

### 5. Test locally
```bash
npm test
```
This runs all test queries through the AI agent without needing WhatsApp.

### 6. Run locally
```bash
npm run dev
```
Server starts on `http://localhost:3000`

### 7. Deploy to Railway
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```
Then set all environment variables in Railway dashboard.

### 8. Connect webhook to Meta
- Your Railway URL will be: `https://your-app.railway.app`
- In Meta dashboard: WhatsApp → Configuration → Webhook
- Webhook URL: `https://your-app.railway.app/webhook`
- Verify token: whatever you set as `WEBHOOK_VERIFY_TOKEN`
- Subscribe to: `messages`

---

## Environment Variables

| Variable | Where to get it |
|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |
| `SUPABASE_URL` | supabase.com → project → Settings → API |
| `SUPABASE_SERVICE_KEY` | supabase.com → project → Settings → API |
| `META_ACCESS_TOKEN` | developers.facebook.com → WhatsApp → API Setup |
| `PHONE_NUMBER_ID` | developers.facebook.com → WhatsApp → API Setup |
| `WEBHOOK_VERIFY_TOKEN` | Make this up — must match Meta webhook settings |
| `HASH_SALT` | Make this up — long random string |
| `ADMIN_KEY` | Make this up — protects /admin endpoints |

---

## Commands the Bot Understands

| Command | Action |
|---|---|
| `MENU` / `MENI` / `HELP` | Show all categories |
| `STOP` / `ARETE` | Unsubscribe |
| Any service name | Search directory |

---

## Admin Endpoints

These require `x-admin-key` header matching your `ADMIN_KEY` env variable.

```bash
# See what community is searching for that you don't have listed
curl https://your-app.railway.app/admin/needs \
  -H "x-admin-key: YOUR_ADMIN_KEY"

# See leads per business (use for upgrade pitch)
curl https://your-app.railway.app/admin/leads \
  -H "x-admin-key: YOUR_ADMIN_KEY"
```

---

## Adding Businesses

Go to Supabase → Table Editor → businesses → Insert row.

Key fields:
- `name` — Business name
- `category` — Must match exactly: `Sèvis Legal`, `Sèvis Taks`, `Sante`, `Imobilye`, `Transpò`, `Manje`, `Bote`, `Lekòl`, `Legliz`, `Voye Kòb`, `Konstriksyon`, `Lòt`
- `tier` — `free`, `standard`, `premium`, `spotlight`
- `is_verified` — true/false
- `is_active` — true/false (set false to hide a listing)
- `languages_spoken` — array e.g. `{Kreyòl,English,Français}`

---

## Monetization Tiers

| Tier | Monthly Price | Position |
|---|---|---|
| Free | $0 | Last |
| Standard | $29 | Middle |
| Premium | $79 | First + ⭐ badge |
| Spotlight | $149 | Top + ⭐ badge |

---

## Monthly Tasks

1. Check `community_needs` view — what are people searching for you don't have?
2. Check `business_lead_report` view — which free businesses got leads? Pitch them upgrades.
3. Verify all active listings still have correct phone numbers.
4. Add new businesses from community referrals.
