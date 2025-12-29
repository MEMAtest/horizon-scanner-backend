# Large File Modularization Plan (8 Phases)

## Scope (target files)
- `public/js/publications/dashboard-core.js`
- `src/routes/api/publications.js`
- `src/services/fcaEnforcementService.js`
- `public/js/workspaceModule.js`
- `src/routes/pages/regulatoryAnalyticsPage.js`
- `src/views/aiIntelligence/styles.js`
- `src/routes/pages/homePage.js`
- `src/views/kanban/scripts.js`
- `public/css/publications/components.css`
- `public/css/enforcement/components.css`
- `src/public/css/components.css`
- `public/css/weekly-briefing/components.css`

## Guardrails (to ensure nothing breaks)
- Preserve all route paths, exported function names, and class names.
- Preserve global objects and DOM IDs/classnames used by UI scripts and templates.
- Keep existing entry file paths working (thin wrappers call new modules).
- Avoid behavior changes; refactors are structural only.
- Add contract tests/snapshots where possible and use a manual QA checklist for key pages.

## Proposed breakdown per file

### `public/js/publications/dashboard-core.js`
Create `public/js/publications/dashboard/` and split by existing sections:
- `state.js` (shared state and defaults)
- `helpers.js` (formatters, utilities)
- `stats.js` (load/render stats)
- `insights.js` (insights rendering)
- `data.js` (notices load/filter)
- `table.js` (table rendering, pagination)
- `charts.js` (chart rendering)
- `modals.js` (modal logic)
- `events.js` (event listeners)
- `deepInsights.js` (case studies, breach summary, handbook stats)
- Keep `dashboard-core.js` as orchestrator exporting `PublicationsDashboard`.

### `src/routes/api/publications.js`
Expand `src/routes/api/publications/` (already has `helpers.js`, `status.js`):
- `index.js` (router assembly and export)
- `helpers.js` (shared middleware: `getDbPool`, `allowFallback`, `requirePipeline`)
- `status.js` (status + stats)
- `pipeline.js` (backfill/update/pause/resume/cancel)
- `notices.js` (CRUD + search)
- `insights.js` (outcomes, breaches, case studies, fines, etc.)
- `summary.js` (yearly breakdown, reoffenders, themes, summaries)
- Keep `setPipeline` export and route paths unchanged.

### `src/services/fcaEnforcementService.js`
Create `src/services/enforcement/`:
- `controlPlaybook.js` (static config)
- `scraping.js` (scraper orchestration)
- `ai.js` (AI processing)
- `filters.js` (filtering helpers)
- `trends.js` (trend calculations)
- `db.js` (queries and DB helpers)
- Keep `FCAEnforcementService` class interface unchanged.

### `public/js/workspaceModule.js`
Create `public/js/workspace/` modules:
- `state.js` (shared state)
- `pins.js` (pin logic)
- `bookmarks.js` (collections, saved bookmarks)
- `searches.js` (saved searches)
- `alerts.js` (custom alerts)
- `annotations.js` (annotation flows)
- `profile.js` (firm profile)
- `ui.js` (render helpers)
- `events.js` (event wiring)
- `init.js` (init/auto-init)
- Keep `WorkspaceModule` global and public API unchanged.

### `src/routes/pages/regulatoryAnalyticsPage.js`
Create `src/routes/pages/regulatory-analytics/`:
- `data.js` (fetch updates, filter options, sidebar)
- `analytics.js` (data aggregation and metrics)
- `render.js` (HTML template)
- `index.js` (exports `renderRegulatoryAnalyticsPage`)
- Keep route and HTML output stable (snapshot tests).

### `src/views/aiIntelligence/styles.js`
Create `src/views/aiIntelligence/styles/`:
- `tokens.js` (CSS variables)
- `layout.js` (page layout)
- `hero.js` (hero panel)
- `cards.js` (cards and widgets)
- `tables.js` (tables, grids)
- `utilities.js` (helpers)
- `index.js` concatenates and exports `getAiIntelligenceStyles`.

### `src/routes/pages/homePage.js`
Create `src/routes/pages/home/`:
- `data.js` (fetch updates, stats, AI insights)
- `widgets.js` (calendar, quick links)
- `render.js` (HTML template)
- `styles.js` (inline styles or extracted to CSS)
- `index.js` exports `renderHomePage`.

### `src/views/kanban/scripts.js`
Create `src/views/kanban/scripts/`:
- `state.js` (state and defaults)
- `render.js` (DOM rendering)
- `dragDrop.js` (DnD logic)
- `api.js` (server calls)
- `events.js` (listeners)
- `index.js` concatenates and exports `getKanbanScripts`.

### `public/css/publications/components.css`
Split into `public/css/publications/` partials:
- `tokens.css`, `layout.css`, `cards.css`, `tables.css`, `charts.css`, `modals.css`, `utilities.css`
- Keep `components.css` as an aggregator (`@import` or manual concatenation) so existing links remain valid.

### `public/css/enforcement/components.css`
Split into `public/css/enforcement/` partials:
- `tokens.css`, `layout.css`, `filters.css`, `tables.css`, `charts.css`, `modals.css`, `utilities.css`
- Keep `components.css` as aggregator.

### `src/public/css/components.css`
Split into `src/public/css/` partials:
- `tokens.css`, `layout.css`, `forms.css`, `buttons.css`, `tables.css`, `utilities.css`
- Keep `components.css` as aggregator.

### `public/css/weekly-briefing/components.css`
Split into `public/css/weekly-briefing/` partials:
- `tokens.css`, `layout.css`, `cards.css`, `tables.css`, `utilities.css`
- Keep `components.css` as aggregator.

## 8-phase execution plan

### Phase 1: Baseline and safety net
- Inventory public APIs, globals, DOM IDs, and CSS classnames used by the target files.
- Add minimal contract tests (Jest/Supertest) for critical routes and HTML snapshot tests for key pages.
- Create a manual QA checklist for publications dashboard, enforcement view, workspace, AI intelligence, and home.
- Exit criteria: tests pass; checklist drafted.

### Phase 2: Publications dashboard JS + publications CSS
- Split `public/js/publications/dashboard-core.js` into `public/js/publications/dashboard/`.
- Split `public/css/publications/components.css` into partials with aggregator.
- Exit criteria: dashboard loads; charts, table, filters, modals, deep insights still function.

### Phase 3: Publications API routes
- Split `src/routes/api/publications.js` into sub-routers in `src/routes/api/publications/`.
- Keep `setPipeline` and route paths unchanged.
- Exit criteria: API tests pass; no route regressions.

### Phase 4: FCA enforcement service
- Split `src/services/fcaEnforcementService.js` into `src/services/enforcement/` modules.
- Keep class interface, constructor, and method signatures unchanged.
- Exit criteria: enforcement endpoints still return data and integration tests pass.

### Phase 5: Workspace module
- Split `public/js/workspaceModule.js` into `public/js/workspace/` modules.
- Keep the `WorkspaceModule` global API unchanged.
- Exit criteria: pins, bookmarks, searches, alerts, and annotations still work.

### Phase 6: Regulatory analytics page + Home page
- Split `src/routes/pages/regulatoryAnalyticsPage.js` into smaller modules.
- Split `src/routes/pages/homePage.js` into smaller modules.
- Exit criteria: HTML snapshots unchanged and manual checks pass.

### Phase 7: AI intelligence styles + Kanban scripts
- Split `src/views/aiIntelligence/styles.js` into modular style functions.
- Split `src/views/kanban/scripts.js` into smaller script modules.
- Exit criteria: AI intelligence page and kanban interactions remain stable.

### Phase 8: Remaining CSS splits
- Split `public/css/enforcement/components.css`, `src/public/css/components.css`, and `public/css/weekly-briefing/components.css`.
- Keep aggregator files so existing HTML links do not change.
- Exit criteria: styles render identically in enforcement, weekly briefing, and shared UI pages.

## Smoke test status
- Full suite: `npm test` (25/25 suites passed; 89/89 tests).
