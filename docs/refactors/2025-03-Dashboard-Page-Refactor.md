# Dashboard Page Refactor (2025-03)

## Scope
- Broke the 1.9k-line `src/routes/pages/dashboardPage.js` into modular view layers under `src/views/dashboard/`.
- Introduced reusable helpers (`helpers.js`), presentational components (`components.js`), scoped styles (`styles.js`), and script bootstrap (`scripts.js`).
- Route now focuses on data loading/normalisation and delegates HTML assembly to `buildDashboardPage`.
- Tests updated to point at the new helper exports.

## Outcomes
- Dashboard route trimmed to ~150 lines while keeping original service calls (`dbService`, sidebar/client assets).
- View helpers expose the utility functions previously exported from the massive route file, keeping test coverage intact.
- Inline script now packages state via `window.dashboardInitialState` while preserving legacy globals (`window.initialUpdates`, etc.) for client modules.
- Shared date/string helpers live alongside the view, reducing duplication across future dashboard components.

## Tests
- `npm test`
- `node scripts/run-smart-briefing-smoke.js` *(completes via cached JSON fallback; AI narrative generation still blocked by missing OpenRouter connectivity, so digest outputs remain empty.)*

## Follow-ups
- Split remaining large modules: `src/routes/templates/commonStyles.js`, `src/services/analyticsService.js`, `src/services/webScraperService.js`, etc.
- Restore outbound access to `openrouter.ai` (or provide an alternative LLM endpoint) so Smart Briefing/email digest generation produces narratives again.
