# Horizon Scanner (RegCanary) - Project Knowledge

## Project Overview

Regulatory intelligence platform monitoring 19+ sources with AI-powered analysis. Node.js/Express (vanilla JS), PostgreSQL (Hetzner), multi-provider AI.
**Prod:** https://regcanary.com | **Deploy:** Vercel (serverless + scheduled crons)

## Key Commands

```bash
npm run dev              # Nodemon auto-reload dev server
npm start                # Production server
npm test                 # Jest tests
npm run test:watch       # Jest watch mode
npm run test:coverage    # Coverage report
npm run test:playwright  # Playwright E2E
npm run lint             # ESLint (src/routes, src/services, src/utils)
npm run lint:fix         # Auto-fix lint issues
npm run validate         # System validation
npm run digest:send      # Send daily digest email
npm run digest:test      # Test daily digest
npm run cleanup          # Database cleanup
npm run refresh          # Manual data refresh
npm run stats            # Show statistics
npm run monitor:scrapes  # Monitor scraping health
npm run health           # Check service health (ports 3000-3002)
```

## Architecture

- **Runtime:** Node.js + Express (vanilla JavaScript, NOT TypeScript)
- **Database:** PostgreSQL on Hetzner (`horizon_scanning` DB, `horizon_app` user)
- **AI providers (priority order):**
  1. Anthropic Claude (primary, best quality)
  2. DeepSeek (secondary, cheap)
  3. OpenRouter (tertiary, no rate limits)
  4. Groq `llama-3.3-70b-versatile` (fallback, free but rate-limited)
- **Scraping:** 38 Puppeteer scrapers + Cheerio HTML parsers
- **Email:** Resend API for daily/weekly digests
- **Views:** Handlebars templates (server-rendered)
- **Deployment:** Vercel serverless functions + 9 scheduled cron jobs

## Directory Structure

```
src/
├── index.js                # Express server entry point
├── database.js             # PostgreSQL pool management
├── ai/                     # AI prompt templates & confidence scoring
├── config/                 # Intelligence thresholds, sector mapping, firm personas
├── scrapers/
│   ├── puppeteer/          # 38 Puppeteer-based scrapers (FCA, FATF, EIOPA, etc.)
│   ├── cheerio/            # HTML parsing scrapers (static sites)
│   ├── fcaAdvancedScraper.js  # Multi-stage FCA enforcement scraper
│   ├── internationalScraper.js
│   └── puppeteerScraper.js    # Puppeteer orchestrator
├── services/               # 219+ service files
│   ├── aiAnalyzer.js       # Main AI engine (modular mixin architecture)
│   ├── aiAnalyzer/         # 15+ AI plugin modules
│   ├── dbService.js        # Database operations
│   ├── dailyDigestService.js  # Email digest generation
│   ├── rssFetcher.js       # RSS feed service
│   ├── relevance/          # Relevance scoring modules
│   └── ...                 # Intelligence, pattern recognition, trends, etc.
├── routes/
│   ├── api/                # 31 API route handlers
│   └── pages/              # Page routes
├── views/                  # Handlebars templates
├── middleware/             # Express middleware (auth)
├── utils/                  # Utility functions
└── public/                 # Static assets (CSS, JS, images)

api/                        # Vercel serverless functions
├── cron/                   # 9 scheduled tasks
│   ├── daily-digest.js     # 10:00 UTC
│   ├── rss-refresh.js      # 09:00 UTC
│   ├── fca-enforcement.js  # 09:05 UTC
│   ├── bank-news-refresh.js # 09:15 UTC
│   ├── web-scraping-refresh.js # 09:30 UTC
│   ├── puppeteer-refresh.js # 09:45 UTC
│   ├── weekly-newsletter.js # Fri 17:00 UTC
│   ├── smart-briefing.js   # Fri 15:00 UTC
│   └── scrape-monitor.js   # 12:00 UTC
└── index.js                # Main API handler

scripts/                    # 53+ utility/maintenance scripts
sql/                        # Database schemas
```

## Key Files

| File | Purpose |
|------|---------|
| `src/index.js` | Express server entry, route registration |
| `src/database.js` | PostgreSQL pool with SSL handling |
| `src/services/aiAnalyzer.js` | Main AI analysis engine (mixin architecture) |
| `src/services/dbService.js` | All database operations |
| `src/services/dailyDigestService.js` | Daily email digest generation |
| `src/config/intelligenceConfig.js` | AI thresholds, scoring weights, notification settings |
| `api/cron/*.js` | Vercel scheduled tasks |

## API Routes

**Core:** `/api/updates`, `/api/analytics`, `/api/ai`
**Dashboard:** `/api/dashboard/stats` (NOT `/api/publications` — returns 404)
**Health:** `/api/health`
**Recent:** `/api/updates/recent`
**FCA:** `/api/enforcement`

## Environment Variables

**Required:**
```
DATABASE_URL=postgresql://horizon_app:PASSWORD@89.167.95.173:5432/horizon_scanning?sslmode=no-verify
PORT=3000
CRON_SECRET=<random-secret>
```

**AI providers (at least one required):**
```
DEEPSEEK_API_KEY=           # Primary (cheap, good quality)
ANTHROPIC_API_KEY=          # Best quality
OPENROUTER_API_KEY=         # No rate limits
GROQ_API_KEY=               # Free but rate-limited fallback
```

**Email:**
```
RESEND_API_KEY=
DAILY_DIGEST_RECIPIENTS=email1@example.com,email2@example.com
DIGEST_FROM_EMAIL=RegCanary <noreply@regcanary.com>
ENABLE_DAILY_DIGEST=true
```

**Optional:**
```
COOKIE_SECRET=              # Session encryption
SLACK_WEBHOOK_URL=          # Scrape failure alerts
NODE_ENV=development|production
```

## Gotchas

- **This is vanilla JavaScript** — no TypeScript, no compilation needed. `npm run build` is a no-op
- **Use `regulatory_updates` table** (6,353 rows), NOT `updates` table (308 rows — different/older dataset)
- **Freshness column:** Use `created_at` for timestamps (NOT `scraped_at`). Table has `scrape_date` but for timestamp queries use `created_at`
- **API routes:** `/api/health`, `/api/updates/recent`, `/api/dashboard/stats` — NOT `/api/publications` (404)
- **Groq model:** Use `llama-3.3-70b-versatile` (NOT `llama-3.1-70b-versatile` — retired)
- **SSL:** Use `sslmode=no-verify` for Hetzner self-signed cert
- **Vercel function timeouts:** 120-300 seconds (max 5 min for web scraping crons)
- **AI rate limiting:** Min 500ms between Anthropic/DeepSeek calls, 1000ms for Groq

## Database

- **Host:** 89.167.95.173 (Hetzner), user `horizon_app`, DB `horizon_scanning`
- **Key tables:**
  - `regulatory_updates` (6,353 rows) — Main regulatory updates
  - `fca_publications_index` (18k+) — FCA publication search results
  - `fca_enforcement_notices` — Processed enforcement data
  - `fca_fines` (316+) — FCA fines with AI analysis
  - `fca_publication_full_text` — Full text for search (GIN indexed)
  - `entity_summaries` — AI-generated entity summary cache
  - `fca_annual_summaries` — Year-by-year enforcement analysis
  - `weekly_briefings` — Persistent weekly briefing snapshots
- **SSL:** Self-signed cert (TLSv1.3, valid until 2036)

## AI Configuration

```javascript
// From config/intelligenceConfig.js
confidenceThresholds: { minimum: 0.3, medium: 0.6, high: 0.8, critical: 0.9 }
relevanceWeights: { sector: 0.4, firmType: 0.3, jurisdiction: 0.2, size: 0.1 }
aiModel: { defaultModel: 'groq-llama', maxTokens: 4000, temperature: 0.3 }
```

## Regulatory Sources (19+)

UK: FCA (Dear CEO letters, papers, enforcement), PRA | EU: EIOPA, ESMA, EU Council, CONSOB | Global: FATF, IOSCO, BCBS, Egmont Group | Markets: LSE, Aquis | Asia: SEBI, RBI | Middle East, Africa, Americas scrapers
