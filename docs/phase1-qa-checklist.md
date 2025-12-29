# Phase 1 Manual QA Checklist

Use this checklist after refactors to verify no UI or API regressions. Keep results per phase.

## Publications Dashboard (`/publications`)
- [ ] Stats load (indexed/processed/pending, total fines helper text).
- [ ] Filters update results (outcome, breach, risk, year).
- [ ] Table pagination works (next/prev/page size).
- [ ] Charts render (outcome, breach, risk, status, timeline).
- [ ] Deep insights load (case studies, breach summary, handbook stats).
- [ ] Modals open/close (entity history, year detail, case study).

## Enforcement (`/enforcement`)
- [ ] Stats load with and without filters.
- [ ] Filters update charts + top firms.
- [ ] Trend charts render; no console errors.

## Workspace (`/profile-hub` or wherever workspace is embedded)
- [ ] Pins add/remove; counts update.
- [ ] Saved searches create/load/delete.
- [ ] Custom alerts create/enable/disable/delete.
- [ ] Annotations open/complete/delete.
- [ ] Firm profile view/save/clear.

## Regulatory Analytics (`/regulatory-analytics`)
- [ ] Summary cards show totals.
- [ ] Charts render (monthly trend, authority, impact, sector burden).
- [ ] Drilldown modal opens with filtered list.

## Home (`/`)
- [ ] Status banner renders with stats.
- [ ] Priority panel renders (for you today).
- [ ] Calendar widget loads.
- [ ] Top fines widget renders (handles empty state).
- [ ] Profile modal opens and saves.

## AI Intelligence (`/ai-intelligence`)
- [ ] Hero insight renders; persona tabs switch.
- [ ] Risk pulse + quick stats render.
- [ ] Streams render and interactions (pins) work.

## Kanban (`/kanban`)
- [ ] Columns render; drag/drop works.
- [ ] Add item modal and dropdowns work.
- [ ] Dossier and policy modals open; link/unlink actions work.

## Weekly Briefing (`/weekly-roundup`)
- [ ] Page renders without CSS regressions (cards, typography).
