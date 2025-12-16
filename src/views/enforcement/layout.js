const {
  renderHeaderSection
} = require('./sections/header')
const {
  renderStatsSection,
  renderPatternSection
} = require('./sections/stats')
const { renderYearlyOverviewSection } = require('./sections/yearlyOverview')
const { renderDistributionSection } = require('./sections/distribution')
const { renderHeatmapSection } = require('./sections/heatmap')
const { renderCategoryMixSection } = require('./sections/categoryMix')
const { renderControlPlaybookSection } = require('./sections/controlPlaybook')
const { renderFinesSection } = require('./sections/fines')
const { renderTrendsSection } = require('./sections/trends')
const { renderTopFirmsSection } = require('./sections/topFirms')
const { renderAdvancedAnalyticsSection } = require('./sections/advancedAnalytics')
const {
  getEnforcementStyles,
  getEnforcementHeadScripts,
  getEnforcementRuntimeScripts
} = require('./assets')

function renderEnforcementPage({
  sidebar,
  commonStyles,
  commonClientScripts
}) {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>FCA Enforcement Dashboard - RegCanary</title>
        ${commonStyles}
        ${getEnforcementStyles()}
        ${getEnforcementHeadScripts()}
      </head>
      <body>
        <div class="app-container">
          ${sidebar}
          <main class="main-content">
            ${renderHeaderSection()}
            ${renderStatsSection()}
            ${renderPatternSection()}
            ${renderYearlyOverviewSection()}
            ${renderAdvancedAnalyticsSection()}  <!-- PHASE 4: MOVED UP - after Yearly Overview -->
            ${renderDistributionSection()}
            ${renderHeatmapSection()}
            ${renderCategoryMixSection()}
            ${renderFinesSection()}
            ${renderTrendsSection()}
            ${renderTopFirmsSection()}
            ${renderControlPlaybookSection()}    <!-- PHASE 4: MOVED DOWN - before end -->
          </main>
        </div>
        ${commonClientScripts}
        ${getEnforcementRuntimeScripts()}
      </body>
    </html>
  `
}

module.exports = {
  renderEnforcementPage
}
