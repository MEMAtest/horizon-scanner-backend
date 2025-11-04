# Page Routes Modularisation (2025-03)

## Scope
- Split `src/routes/pageRoutes.js` into thin route wiring plus dedicated page renderers.
- Extracted update detail, AI Intelligence, test diagnostics, and about pages into standalone modules with shared helpers (`src/utils/dateHelpers.js`, `src/views/aiIntelligence/*`).
- Preserved original service integrations (db, annotations, relevance, Smart Briefing), only reshaping layout generation.

## Outcomes
- `src/routes/pageRoutes.js` now 33 lines; each page renderer < 1k lines.
- AI Intelligence page rendered through reusable builders (`components`, `styles`, `scripts`) to enable targeted testing.
- Added documentation of shared date formatting helper for reuse across views.
- Maintained existing API/service calls; no environment variables or endpoints changed.

## Tests
- `npm test`
- `node scripts/run-smart-briefing-smoke.js` *(fails to reach openrouter.ai; narrative generation still blocked in current environment).*

## Follow-ups
- Restore outbound access to OpenRouter (or supply local fallback) so Smart Briefing / email digest rebuild succeeds.
- Next large targets: `src/routes/pages/dashboardPage.js` (~1.9k lines) and `src/services/analyticsService.js` (~1.5k lines).
