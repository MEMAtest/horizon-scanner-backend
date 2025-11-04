const { renderStatsGrid, renderFilters, renderUpdatesList } = require('./components')
const { getDashboardStyles } = require('./styles')
const { getDashboardScripts } = require('./scripts')

function buildDashboardPage({
  sidebar,
  stats,
  updates,
  filterOptions,
  currentFilters,
  clientScripts,
  commonStyles
}) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>RegCanary - Regulatory Intelligence Dashboard</title>
      <link rel="icon" type="image/png" href="/favicon.png">
      ${commonStyles}
      ${getDashboardStyles()}
    </head>
    <body>
      <div class="app-container">
        ${sidebar}
        <main class="main-content">
          <header class="dashboard-header">
            <img src="/images/regcanary-sidebar-full.png" alt="RegCanary" class="dashboard-logo" />
            <p class="dashboard-subtitle">
              Real-time regulatory monitoring with AI-powered analysis and business impact intelligence.
            </p>
            ${renderStatsGrid(stats)}
          </header>
          ${renderFilters({ filterOptions, currentFilters })}
          <section class="updates-container">
            ${renderUpdatesList(updates)}
          </section>
        </main>
      </div>
      ${clientScripts}
      ${getDashboardScripts({ updates, stats, filterOptions, currentFilters })}
    </body>
    </html>
  `
}

module.exports = { buildDashboardPage }
