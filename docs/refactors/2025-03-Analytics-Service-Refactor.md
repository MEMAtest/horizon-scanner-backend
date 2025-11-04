# Analytics Service Refactor (2025-03)

## Scope
- Broke the 1.5k-line `src/services/analyticsService.js` into mixins under `src/services/analytics/` covering velocity, hotspots, content distribution, source trends, dashboard assembly, sector analysis, predictions, calendar, caching, and shared helpers.
- Main service now instantiates a lean class composed via `apply*` modules while keeping cache timing and 90-day analysis window untouched.
- Modules reuse `dbService` and helper utilities, preserving all logging and data shapes returned to existing routes/tests.

## Outcomes
- Each analytic concern is isolated (<400 lines), making future edits to predictions, calendar, or velocity logic straightforward.
- Shared helper methods (category classification, risk scoring, confidence calculations, sector utilities) centralised in `helpers.js` for consistent behaviour across modules.
- Consumers continue importing `analyticsService` with identical API surface; caching behaviour unchanged.

## Tests
- `npm test`
- `node scripts/run-smart-briefing-smoke.js` *(still served from cached JSON fallback; OpenRouter connectivity remains offline, so briefing narratives stay empty.)*

## Follow-ups
- Consider extracting timeline/window utilities into a shared helper if other services start reusing them.
- Next large files to target: `src/services/webScraperService.js`, `src/services/fcaFinesScraper.js`, and `src/services/predictiveIntelligenceService.js`.
