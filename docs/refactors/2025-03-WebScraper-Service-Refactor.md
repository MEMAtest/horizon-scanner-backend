# Web Scraper Service Refactor (2025-03)

## Scope
- Split the 1.5k-line `src/services/webScraperService.js` into modular mixins under `src/services/webScraper/` covering base HTTP/rate-limiting helpers, FCA scraping, simple sources (TPR/SFO), international feeds, FATF automation, shared processing, statistics/orchestration, and health checks.
- Main service now constructs shared state (HTTP client, FCA config, stats) and composes functionality via `apply*` modules, keeping the external API untouched.

## Outcomes
- Each scraping concern lives in a focused module (<400 lines), making future source updates or new provider integrations manageable.
- Shared helpers (`base.js`) consolidate rate limiting, request retries, URL/date parsing, and DOM extraction so all modules reuse the same logic.
- Orchestrator continues to run the full pipeline but now delegates to mixins, preserving DB persistence, AI enrichment, and stats reporting while staying under size limits.

## Tests
- `npm test`
- `node scripts/run-smart-briefing-smoke.js` *(still relies on cached data; OpenRouter access remains down so Smart Briefing/email digest output is empty.)*

## Follow-ups
- With analytics and scraper modularised, revisit the dashboard cards styling to ensure data renders as expected in the UI (current environment shows blank cards).
- Evaluate other large files (`src/services/fcaFinesScraper.js`, `src/services/predictiveIntelligenceService.js`) for similar break-up when time permits.
