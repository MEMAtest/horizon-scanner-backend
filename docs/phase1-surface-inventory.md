# Phase 1 Surface Inventory

This inventory captures public APIs, DOM hooks, and integration points that must not change during modularization.

## `public/js/publications/dashboard-core.js`
- Public entry: `export class PublicationsDashboard` (instantiated by `public/js/publications/index.js`).
- External deps: `./modules/formatters.js`, `./modules/breachIcons.js`, global `Chart`.
- Fetch endpoints (must remain):
  - `/api/publications/status`
  - `/api/publications/stats`
  - `/api/publications/notices`
  - `/api/publications/insights/outcome-analysis`
  - `/api/publications/insights/outcome-breaches/:type`
  - `/api/publications/insights/breach-summary`
  - `/api/publications/insights/breach-analysis/:type`
  - `/api/publications/insights/case-studies`
  - `/api/publications/insights/case-studies/:id/similar`
  - `/api/publications/insights/risk-indicators`
  - `/api/publications/insights/handbook-stats`
  - `/api/publications/insights/common-findings`
  - `/api/publications/insights/yearly-breakdown`
  - `/api/publications/insights/year/:year/detailed`
  - `/api/publications/insights/reoffenders`
  - `/api/publications/insights/rule-citations`
  - `/api/publications/insights/timeline`
  - `/api/publications/summary/:year`
  - `/api/publications/entity/:name/history`
  - `/api/publications/entity/:name/summary`
- DOM IDs referenced (do not rename):
```
aggravating-factors-list
apply-filters
breach-callout
breach-detail-content
breach-detail-panel
breach-filter
breach-fines-bar-chart
breach-insight
breach-rankings
breach-treemap-chart
breach-type-grid
breach-year-filter
breachChart
case-dots
case-similar-section
case-study-spotlight
close-breach-detail
close-entity-history
close-modal
close-year-detail
close-year-modal
close-year-modal-btn
common-findings-list
detail-modal
entity-ai-summary
entity-history-header
entity-history-modal
entity-history-timeline
export-btn
fines-helper
fines-insight
fines-metrics
finesTimelineChart
handbook-bars
handbook-insight
indexed-helper
max-offences
mitigating-factors-list
modal-body
modal-entity-name
next-case
next-page
notices-table
notices-tbody
outcome-analysis-grid
outcome-bars
outcome-callout
outcome-filter
outcome-insight
outcome-insight-box
outcome-year-filter
outcomeChart
page-numbers
page-size
pagination-showing
peak-fines-year
peak-year
pending-helper
pipeline-status-value
prev-case
prev-page
processed-helper
recent-notices-list
refresh-btn
reoffenders-table
reoffenders-tbody
reset-filters
results-count
risk-filter
risk-indicators-list
riskChart
search-input
statusChart
takeaways-deep-grid
takeaways-list
timeline-callout
timeline-end-year
timeline-reset-btn
timeline-start-year
top-breach-stat
top-fines-deep-list
top-fines-list
top-outcome-stat
total-cases-stat
total-fines
total-fines-stat
total-indexed
total-pending
total-processed
total-reoffender-fines
total-reoffenders
year-breach-chart
year-comparison-chart
year-detail-actions
year-detail-avg-fine
year-detail-biggest
year-detail-biggest-amount
year-detail-biggest-breach
year-detail-biggest-entity
year-detail-cases-with-fines
year-detail-fines
year-detail-panel
year-detail-summary
year-detail-year
year-monthly-chart
year-outcome-chart
year-page-breach-chart
year-page-comparison-chart
year-page-monthly-chart
year-page-outcome-chart
year-summary-modal
year-timeline-bar
yearly-breakdown-grid
years-covered
```
- DOM classes referenced:
```
breach-breakdown
breach-filter-btn
case-dot
data-table
entity-action-card
expand-toggle
insight-tab
outcome-filter-btn
outcome-header
outcome-row
reoffender-row
risk-bar-row
risk-view-btn
sortable
status-indicator
tab-panel
timeline-month
timeline-point
tooltip
view-summary-btn
yearly-row
```

## `src/routes/api/publications.js`
- Exports: `router`, `setPipeline`.
- Route surface: status, stats, pipeline operations, notices CRUD, insights endpoints, yearly summary endpoints.
- Integration points: `pipeline` instance (methods referenced in routes), fallback `pg` pool if `DATABASE_URL` is present.

## `src/services/fcaEnforcementService.js`
- Export: `class FCAEnforcementService`.
- Public methods (do not rename):
```
initialize
runInitialScraping
updateEnforcementData
buildFilterWhereClause
getEnforcementStats
buildControlRecommendations
getRecentFines
getFinesTrends
getHeatmapData
getDistribution
searchFines
updateTrends
getTopFirms
getEnforcementInsights
getRepeatOffenders
getFinesByPeriod
getDistinctFirms
getFirmDetails
compareFirms
getSectorBenchmarks
getFirmPercentile
getPercentileRankings
getSectorAnalysis
getSectorTrends
getYearSummary
getYearStats
getDatasetAverages
getTopFirmsForYear
getCategoryBreakdownForYear
getMonthlyTimelineForYear
generateYearSummary
parseJsonbField
inferSectorFromFirmCategory
getCategoryContext
runScheduledUpdate
close
```

## `public/js/workspaceModule.js`
- Public entry: `window.WorkspaceModule` IIFE.
- Public API (do not rename):
```
init
refresh
togglePin
updateWorkspaceCounts
showPinnedItems
showSavedSearches
showCustomAlerts
showAnnotations
saveCurrentSearch
loadSearch
deleteSearch
createNewAlert
submitNewAlert
toggleAlert
deleteAlert
refreshAnnotations
openAnnotation
completeAnnotation
deleteAnnotation
showFirmProfile
saveFirmProfile
clearFirmProfile
closeModal
exportData
getPinnedUrls
getPinnedUpdateIds
getPinnedItems
isInitialized
ready
```
- Fetch endpoints (must remain):
  - `/api/workspace/pinned`
  - `/api/workspace/pin`
  - `/api/workspace/searches`
  - `/api/workspace/search`
  - `/api/workspace/alerts`
  - `/api/workspace/alert`
  - `/api/workspace/bookmark-collections`
  - `/api/workspace/stats`
  - `/api/annotations`
  - `/api/firm-profile`
  - `/api/regulatory-changes`
  - `/api/export`
- DOM IDs referenced:
```
alertAuthority
alertImpact
alertKeywords
alertName
annotationCount
annotationMeta
customAlertsCount
firmName
firmProfileBadge
firmSize
pinnedCount
savedSearchesCount
```
- DOM classes referenced:
```
annotation-actions
header-controls
modal-content
modal-overlay
pinned-toolbar-meta
```

## `src/views/kanban/scripts.js`
- Public entry: `getKanbanScripts()` used by `src/routes/pages/kanbanPage.js`.
- Fetch endpoints (must remain):
  - `/api/regulatory-changes`
  - `/api/dossiers`
  - `/api/policies`
  - `/api/workflow-templates/from-preset`
- DOM IDs referenced:
```
add-authority-dropdown-container
add-item-form
add-item-modal
add-sector-dropdown-container
detail-modal-body
detail-modal-footer
detail-modal-title
dossier-link-notes
dossier-list-container
item-detail-modal
kanban-dossier-modal
kanban-guidance
kanban-linked-items-container
kanban-policy-modal
linked-policies-container
policy-citation-notes
policy-list-container
stage-dropdown
unlink-confirm-message
unlink-confirm-modal
```
- DOM classes referenced:
```
active
drag-over
kanban-bookmark-btn
kanban-column
modal-overlay
multi-select-dropdown
new-value-preview
single-select-add-new
single-select-dropdown
single-select-list
single-select-option
single-select-search
single-select-value
toast-container
```

## `src/routes/pages/regulatoryAnalyticsPage.js`
- Export: `renderRegulatoryAnalyticsPage`.
- Route path: `/regulatory-analytics`.
- External deps: `dbService`, `getSidebar`, `getCommonStyles`, `getClientScripts`, Chart.js.
- DOM IDs rendered:
```
authorityChart
authorityComparisonChart
drilldownContent
drilldownModal
drilldownTitle
impactChart
impactTrendsChart
monthlyTrendChart
sectorBurdenChart
```

## `src/routes/pages/homePage.js`
- Export: `renderHomePage`.
- Route path: `/`.
- External deps: `dbService`, `firmPersonaService`, `calendarService`, `pg.Pool`.
- DOM IDs rendered:
```
canaryGold
canaryOrange
firmNameInput
firmProfileForm
firmProfileModal
firmSizeInput
messageContainer
saveProfileBtn
sectorGrid
shieldBlue
```

## `src/views/aiIntelligence/styles.js`
- Export: `getAiIntelligenceStyles`.
- Used by: `src/views/aiIntelligence/pageBuilder`.
- Key wrapper classes (non-exhaustive, preserve):
  - `app-container`, `main-content`, `hero-panel`, `hero-insight`, `hero-copy`, `hero-meta`
  - `hero-score`, `risk-pulse`, `quick-stats`, `persona-tabs`, `persona-panel`
  - `stream-card`, `workspace-card`, `timeline-section`, `theme-pill`
  - `profile-banner`, `data-onboarding-root`

## CSS monoliths (paths and consumers)
- `public/css/publications/components.css` (legacy; no direct reference found, keep stable).
- `public/css/enforcement/components.css` (legacy; no direct reference found, keep stable).
- `src/public/css/components.css` (referenced by `src/pages/DashboardPage.js`).
- `public/css/weekly-briefing/components.css` (referenced by `src/views/weeklyBriefing/assets.js`).
