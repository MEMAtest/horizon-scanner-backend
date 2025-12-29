const { getCommonStyles } = require('../../templates/commonStyles')
const { getCommonClientScripts } = require('../../templates/clientScripts')
const { getAnalyticsPageStyles } = require('./styles')
const { serializeForScript } = require('./utils')
const {
  renderSummaryTiles,
  renderFilterForm,
  renderLaneColumn,
  renderSecondarySections
} = require('./renderers')

function renderAnalyticsPage({
  sidebarHtml,
  pageIcon,
  summaryTiles,
  filters,
  lanes,
  momentum,
  hotspots,
  alerts,
  clientPayload,
  canaryStyles
}) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Predictive Analytics Dashboard</title>
  ${getCommonStyles()}
${getAnalyticsPageStyles(canaryStyles)}
</head>
<body class="predictive-dashboard">
  ${sidebarHtml}
  <main class="predictive-main" id="predictiveMain">
    <header class="predictive-header">
      <div class="header-copy">
        ${pageIcon}
        <div class="header-copy-text">
          <h1>Predictive Analytics Dashboard</h1>
          <p class="subtitle">Prioritised regulatory intelligence and actions</p>
        </div>
      </div>
      <div class="header-actions">
        <button type="button" class="btn btn-primary" id="downloadOnePager">Download One-Pager</button>
      </div>
    </header>

    <section class="summary-section">
      <div class="summary-grid">
        ${renderSummaryTiles(summaryTiles)}
      </div>
    </section>

    <section class="control-bar">
      ${renderFilterForm(filters)}
    </section>

    <section class="lanes-grid">
      ${renderLaneColumn('act_now', lanes.act_now)}
      ${renderLaneColumn('prepare_next', lanes.prepare_next)}
      ${renderLaneColumn('plan_horizon', lanes.plan_horizon)}
    </section>

    ${renderSecondarySections(momentum, hotspots, alerts)}
  </main>

  <div class="insight-drawer" id="insightDrawer" aria-hidden="true">
    <div class="drawer-overlay" data-drawer-close="true"></div>
    <aside class="drawer-panel" role="dialog" aria-labelledby="drawerTitle">
      <header class="drawer-header">
        <h2 id="drawerTitle">Insight details</h2>
        <button class="drawer-close" data-drawer-close="true" aria-label="Close insight details">x</button>
      </header>
      <div class="drawer-body" id="drawerBody">
        <p class="drawer-placeholder">Select an insight to review the evidence trail, accuracy history, and recommended playbook.</p>
      </div>
    </aside>
  </div>

  ${getCommonClientScripts()}
  <script>
    window.predictiveDashboard = ${serializeForScript(clientPayload)};
  </script>
  <script src="/js/predictive-dashboard.js"></script>
</body>
</html>
    `
}

module.exports = { renderAnalyticsPage }
