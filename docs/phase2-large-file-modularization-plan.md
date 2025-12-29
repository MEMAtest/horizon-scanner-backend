# Phase 2 Large File Modularization Plan (3 Phases)

## Scope (target files)
- `public/js/publications/dashboard/deepInsights.js`
- `public/css/enforcement/components.css`
- `src/public/css/components.css`
- `public/css/weekly-briefing/components.css`
- `src/services/webScraper.js`
- `src/routes/api/publications/insights.js`
- `src/services/db/policies.js`
- `src/services/intelligenceDashboardService.js`
- `src/views/dashboard/styles.js`
- `src/views/watchLists/scripts.js`
- `src/views/kanban/styles.js`

## Guardrails (do not break behavior)
- Preserve entry paths, exported names, and globals (wrappers stay in place).
- Preserve DOM IDs, class names, data attributes, and CSS selector order.
- Keep output string order identical for script/style generators.
- No behavior changes; refactor only.
- Add/adjust tests only to validate the refactor; no new features.

## Phase 1: Frontend assets (JS/CSS)

### `public/js/publications/dashboard/deepInsights.js`
Target: `public/js/publications/dashboard/deepInsights/`
- `data.js` (load and hydrate deep insight data).
- `outcomes.js` (outcome analysis + breach breakdown).
- `events.js` (event wiring and helpers).
- `risk.js` (risk indicator rendering).
- `fines.js` (fine modifiers and top fines).
- `findings.js` (common findings rendering).
- `caseStudies.js` (case study spotlight + similar cases).
- `breaches.js` (breach grid + charts + detail panel).
- `handbook.js` (handbook rule cards + matching).
- `takeaways.js` (takeaway cards).
- `yearly.js` (yearly breakdown + inline/modal charts).
- `reoffenders.js` (reoffenders table + entity history).
- `index.js` (orchestrates and exposes existing API).
Keep `deepInsights.js` as a thin wrapper that exports the same public surface.

### `public/css/enforcement/components.css`
Target: `public/css/enforcement/`
- `_base.css`, `_timeline.css`, `_modals.css`, `_database.css`,
  `_search.css`, `_benchmarking.css`, `_leaderboard.css`, `_responsive.css`.
Keep `components.css` as an aggregator with stable import order.

### `src/public/css/components.css`
Target: `src/public/css/`
- `navigation.css`, `filters.css`, `counters.css`, `search.css`,
  `responsive-components.css`.
Keep `components.css` as an aggregator with stable import order.

### `public/css/weekly-briefing/components.css`
Target: `public/css/weekly-briefing/`
- `cards.css`, `status-card.css`, `tabs.css`, `snapshot.css`,
  `updates-modal.css`, `weekly-modal.css`.
Keep `components.css` as an aggregator with stable import order.

### `src/views/dashboard/styles.js`
Target: `src/views/dashboard/styles/`
- `layout.js`, `modals.js`, `index.js`.
`styles.js` becomes a wrapper that re-exports the existing style builder.

### `src/views/watchLists/scripts.js`
Target: `src/views/watchLists/scripts/`
- `state.js`, `mainCore.js`, `mainMatches.js`, `mainLinks.js`, `index.js`.
`scripts.js` becomes a wrapper that re-exports the existing script builder.

### `src/views/kanban/styles.js`
Target: `src/views/kanban/styles/`
- `layout.js`, `modals.js`, `interactions.js`, `index.js`.
`styles.js` becomes a wrapper that re-exports the existing style builder.

Exit criteria:
- String outputs for `styles.js` and `scripts.js` match byte-for-byte.
- CSS aggregators load same selectors in the same order.
- Targeted tests pass (see Validation section).

### Phase 1 status
- Completed.
- Smoke test: `npm test` (25/25 suites, 89/89 tests).
- String-equivalence checks: dashboard styles, kanban styles, watchlists scripts.

## Phase 2: Service layer

### `src/services/webScraper.js`
Target: `src/services/webScraperSources/`
- `utils.js` (shared helpers, axios/cheerio/rss, normalizeAuthority).
- `tpr.js`, `sfo.js`, `ico.js`, `frc.js`, `fos.js`, `jmlsg.js`, `fca.js`,
  `fatf.js`, `boePra.js`, `eba.js`, `gambling.js`, `hse.js`, `ofcom.js`, `sra.js`.
Keep `src/services/webScraper.js` as a wrapper that exports the same public API.

### `src/services/intelligenceDashboardService.js`
Target: `src/services/intelligenceDashboard/`
- `constants.js` (caps + thresholds).
- `dates.js` (date helpers + extract/group update dates).
- `updates.js` (normalization, personas, deadlines, daily cap).
- `risk.js` (risk scoring + labels).
- `streams.js` (relevance bucketing + pinning + rebalance).
- `annotations.js` (task/timeline helpers).
- `persona.js` (priority ranking + persona briefings).
- `summary.js` (executive summary + focus + hero insight + themes).
- `snapshot.js` (client snapshot shaping).
- `service.js` (getDailySnapshot orchestration).
- `index.js` (service exports).
Keep `src/services/intelligenceDashboardService.js` as a wrapper with the same exports.

Exit criteria:
- Existing tests for intelligence and analytics services pass.
- No changes to service inputs/outputs beyond formatting normalization.

### Phase 2 status
- Completed.
- Smoke test: `npm test` (25/25 suites, 89/89 tests).
- Scraper smoke test: `node scripts/smoke-web-scrapers.js` (pass confirmed).

## Phase 3: API + DB modules

### `src/routes/api/publications/insights.js`
Target: `src/routes/api/publications/insights/`
- `handlers.js` (route handlers).
- `queries.js` (SQL/DB access).
- `validation.js` (input checks and defaults).
- `index.js` (router setup).
Keep route paths and response shapes unchanged.

### `src/services/db/policies.js`
Target: `src/services/db/policies/`
- `queries.js` (CRUD SQL).
- `mappers.js` (row-to-object mapping).
- `validators.js` (input validation).
- `index.js` (public exports).
Keep exported functions and behavior unchanged.

Exit criteria:
- API contract tests pass.
- No response schema changes.

### Phase 3 status
- Completed.
- Refactors: `src/routes/api/publications/insights.js` and `src/services/db/policies.js` (both now module folders + wrappers).
- Smoke test: `npm test` (25/25 suites, 89/89 tests).

## Validation (per phase)
- Jest targeted tests and snapshots:
  - Publications: `tests/publicationsApi.test.js`.
  - Dashboard/weekly-briefing/watchlists: existing render tests plus any new snapshot checks.
- String-equivalence checks for `styles.js`/`scripts.js` outputs before/after.
- Manual smoke checks (optional): enforcement dashboard, weekly briefing, watchlists UI.
