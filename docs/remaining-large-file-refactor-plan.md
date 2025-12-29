# Remaining Large File Refactor Plan

## Scope (remaining >= 1k lines)
- `public/js/publications/dashboard/deepInsights/yearly.js`
- `public/js/enforcement/modules/stats.js`
- `src/views/aiIntelligence/scripts.js`
- `src/views/calendar/styles.js`
- `src/components/SearchInterface.js`
- `src/routes/templates/sidebar.js`
- `src/routes/pages/analyticsPage.js`
- `src/routes/pages/sectorIntelligencePage.js`
- `src/services/db/watchLists.js`
- `src/services/db/workspace.js`
- `src/services/db/regulatoryChanges.js`
- `src/services/relevanceService.js`

## Guardrails
- Preserve entry paths and exported names (wrappers stay in place).
- Preserve DOM IDs, class names, data attributes, and CSS selector order.
- Keep output strings and HTML assembly order identical.
- No behavior changes; refactor only.
- Run `npm test` after each phase.

## Phase 1: Yearly breakdown module split
Target: `public/js/publications/dashboard/deepInsights/yearly/`
- `render.js` (yearly grid rendering + row click wiring).
- `panel.js` (inline year detail panel show/hide).
- `summary.js` (AI summary fetch + fallback summary generation).
- `chartsInline.js` (inline chart + timeline rendering).
- `modal.js` (year summary modal + modal chart rendering).
- `index.js` (exports).
Keep `public/js/publications/dashboard/deepInsights/yearly.js` as a wrapper.

Exit criteria:
- Same DOM output for yearly grid/panels/modals.
- No changes to event wiring or dataset keys.
- `npm test` passes.

## Phase 2: Client dashboard scripts
Targets:
- `public/js/enforcement/modules/stats.js`
- `src/views/aiIntelligence/scripts.js`

Split into:
- `state.js` (state + constants),
- `data.js` (transform/normalize),
- `charts.js` (chart configs + render),
- `render.js` (DOM render),
- `events.js` (handlers + wiring),
- `index.js` (exports).
Keep original files as wrappers.

Exit criteria:
- Client behavior and chart rendering unchanged.
- `npm test` passes.

## Phase 3: Styles + component split
Targets:
- `src/views/calendar/styles.js`
- `src/components/SearchInterface.js`

Calendar styles:
- `styles/layout.js`, `styles/grid.js`, `styles/cards.js`,
  `styles/modals.js`, `styles/responsive.js`, `styles/index.js`.

SearchInterface:
- `SearchInterface/Header.js`, `Filters.js`, `Results.js`, `Pagination.js`,
  `hooks/useSearchState.js`, `index.js` (wrapper).

Exit criteria:
- Styles output matches byte-for-byte.
- Component props/exports unchanged.
- `npm test` passes.

## Phase 4: Server templates/pages
Targets:
- `src/routes/templates/sidebar.js`
- `src/routes/pages/analyticsPage.js`
- `src/routes/pages/sectorIntelligencePage.js`

Split into:
- `data.js` (load + normalize),
- `sections.js` (HTML section builders),
- `render.js` (page assembly),
- `index.js` (wrapper).

Exit criteria:
- HTML output unchanged.
- `npm test` passes.

## Phase 5: DB services (user data)
Targets:
- `src/services/db/watchLists.js`
- `src/services/db/workspace.js`

Split into:
- `queries.js` (SQL + params),
- `mappers.js` (row to object),
- `validators.js` (defaults + input cleanup),
- `json.js` (fallback helpers),
- `index.js` (attach methods),
- wrapper file retains original exports.

Exit criteria:
- Return shapes unchanged.
- JSON fallback unchanged.
- `npm test` passes.

## Phase 6: Core services
Targets:
- `src/services/db/regulatoryChanges.js`
- `src/services/relevanceService.js`

Split into:
- regulatoryChanges: `queries.js`, `mappers.js`, `validators.js`, `json.js`, `index.js`.
- relevanceService: `normalization.js`, `scoring.js`, `weights.js`, `deadlines.js`, `index.js`.

Exit criteria:
- Scoring outputs unchanged for same input.
- `npm test` passes.

## Validation (per phase)
- Run `npm test`.
- Add focused string/HTML diff checks if output is generated inline.
