# FCA Fines Scraper Refactor (2025-03)

## Scope
- Broke the 1.2k-line `src/services/fcaFinesScraper.js` into mixins under `src/services/fcaFines/` (base helpers, utilities, structured scraping, news/RSS scraping, database, orchestrator).
- The scraper entry class now wires the mixins and keeps the constructor/exports identical for `FCAEnforcementService`.

## Outcomes
- Parsing/normalisation helpers live in `utils.js`, enabling targeted testing of amount/date/category logic.
- Structured and news scraping flows are isolated, so future tweaks to Puppeteer selectors or RSS parsing don’t touch persistence code.
- Yearly orchestration now consistently returns `{ total, new }`, fixing the silent NaN bug when structured pages succeed.

## Tests
- `npm test`

## Follow-ups
- Add unit coverage around `parseAmountFromText`/`extractBreachCategories` to guard against format regressions.
- Consider reusing a shared Puppeteer launcher to reduce browser spin-up time when scraping multiple years.
