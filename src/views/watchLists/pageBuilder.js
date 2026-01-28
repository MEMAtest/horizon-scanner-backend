const { getWatchListStyles } = require('./styles')
const { getWatchListScripts } = require('./scripts')
const {
  renderStatsCards,
  renderWatchListsGrid,
  renderCreateModal,
  renderMatchesModal,
  renderLinkSelectorModal
} = require('./components')
const { getWatchListsIcon, wrapIconInContainer, getCanaryAnimationStyles } = require('../icons')

function buildWatchListsPage({
  sidebar,
  clientScripts,
  commonStyles,
  watchLists,
  stats,
  connectionCounts = {}
}) {
  const watchListStyles = getWatchListStyles()
  const watchListScripts = getWatchListScripts({ watchLists, stats })
  const canaryStyles = getCanaryAnimationStyles()
  const pageIcon = wrapIconInContainer(getWatchListsIcon())

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Fine Directory - RegCanary</title>
      ${commonStyles}
      ${watchListStyles}
      <style>${canaryStyles}</style>
    </head>
    <body>
      ${sidebar}
      <main class="main-content">
        <div class="watch-lists-page">
          <header class="page-header">
            <div class="page-header-left">
              ${pageIcon}
              <div>
                <h1>Fine Directory</h1>
                <p class="subtitle">Track and monitor FCA enforcement actions and fines</p>
              </div>
            </div>
            <div class="header-actions">
              <button class="btn btn-primary" onclick="WatchListPage.openCreateModal()">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Create Fine Monitor
              </button>
            </div>
          </header>

          ${renderStatsCards(stats)}

          ${renderWatchListsGrid(watchLists, connectionCounts)}
        </div>
      </main>

      ${renderCreateModal()}
      ${renderMatchesModal()}
      ${renderLinkSelectorModal()}

      ${clientScripts}
      ${watchListScripts}
    </body>
    </html>
  `
}

module.exports = { buildWatchListsPage }
