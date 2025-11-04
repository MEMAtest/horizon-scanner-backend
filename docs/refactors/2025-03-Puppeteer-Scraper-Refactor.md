# Puppeteer Scraper Refactor (2025-03)

## Scope
- Split the 1.1k-line `src/scrapers/puppeteerScraper.js` into focused modules under `src/scrapers/puppeteer/` for browser lifecycle, FATF scraping, Aquis scraping, LSE scraping, utilities, and orchestration.
- Entry file now wires the mixins and exposes the same instance API (`scrapeFATF`, `scrapeAquis`, `scrapeLSE`, `scrapeAll`) previously used by downstream services.

## Outcomes
- Browser setup/teardown lives in `browser.js` and shared helpers (`wait`, `autoScroll`) in `utils.js`, reducing duplication inside each site scraper.
- Site-specific logic (FATF, Aquis, LSE) resides in separate modules, making it easier to extend selectors or rate limits without touching unrelated code.
- `scrapeAll` orchestrator simply delegates to the modular methods, clarifying the aggregation flow and keeping the public contract intact.

## Tests
- `npm test`

## Follow-ups
- Consider extracting repeated HTML-cleaning helpers (e.g., FATF title/date parsing) into shared utilities for potential reuse by other scrapers.
- Add smoke tests exercising the puppeteer modules via mocked pages to catch selector regressions early.
