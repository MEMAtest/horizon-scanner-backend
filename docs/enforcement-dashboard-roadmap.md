# Enforcement Dashboard Remediation Roadmap

## Data Alignment
- [x] Unify filter handling so stats cards, fines table, category insights, and trends all reflect the same filtered dataset.
- [x] When filters include years, request `/api/enforcement/trends?years=…` and `/api/enforcement/search` with matching params if local cache cannot satisfy the query.
- [x] Surface active filters beside the section heading and provide a clear option to reset.

## Trends Experience
- [x] Rework layout spacing so the summary row aligns with the top grid of the dashboard.
- [x] Replace the risk score column with a more meaningful indicator (e.g. change versus previous period or category mix share).
- [x] Add inline search or quick chips (e.g. fine size, sector) scoped to the trends table.
- [ ] Enable period-level drill downs that filter the fines table or open a detail drawer.

## Category Focus Chart
- [x] Bind the chart dataset to current filters (years, breach type, etc.) so values match the stats cards.
- [x] Enable hover tooltips highlighting fine count, total amount, and YoY change.
- [x] Add legend toggles or highlight interactions to focus on a single category and expose change vs baseline year.

## Top Fined Firms Panel
- [x] Introduce filter controls (year, sector, breach type) and link selections to the fines table.
- [x] Expand firm metrics with average penalty, most recent fine details, and enforcement velocity.
- [x] Remove the unused risk score column; replace with a compliance pressure indicator if data allows.

## Sidebar Refresh
- [x] Replace placeholder text “icons” with consistent SVG icons and align each nav item onto a single line.
- [x] Tighten spacing, apply subtle hover states, and ensure the active item styling matches the platform aesthetic.

## Additional Enhancements
- [x] Add a trends-specific quick search bar.
- [ ] Offer saved view/export presets for trends analytics.
- [x] Ensure category summaries, trends insights, and export CSVs share the same filtered totals.
