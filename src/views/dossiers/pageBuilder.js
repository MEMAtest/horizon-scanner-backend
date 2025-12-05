const { getDossierStyles } = require('./styles')
const { getDossierScripts } = require('./scripts')
const {
  renderStatsCards,
  renderFilterBar,
  renderDossiersGrid,
  renderCreateModal,
  renderTimelineModal,
  renderLinkSelectorModal
} = require('./components')

function buildDossiersPage({
  sidebar,
  clientScripts,
  commonStyles,
  dossiers,
  stats,
  connectionCounts = {}
}) {
  const dossierStyles = getDossierStyles()
  const dossierScripts = getDossierScripts({ dossiers, stats })

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Research Dossiers - RegCanary</title>
      ${commonStyles}
      ${dossierStyles}
    </head>
    <body>
      ${sidebar}
      <main class="main-content">
        <div class="dossiers-page">
          <header class="page-header">
            <div>
              <h1>Research Dossiers</h1>
              <p class="subtitle">Collect and organize evidence for regulatory research</p>
            </div>
            <div class="header-actions">
              <button class="btn btn-primary" onclick="DossierPage.openCreateModal()">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                New Dossier
              </button>
            </div>
          </header>

          ${renderStatsCards(stats)}

          ${renderFilterBar()}

          ${renderDossiersGrid(dossiers, connectionCounts)}
        </div>
      </main>

      ${renderCreateModal()}
      ${renderTimelineModal()}
      ${renderLinkSelectorModal()}

      ${clientScripts}
      ${dossierScripts}
    </body>
    </html>
  `
}

module.exports = { buildDossiersPage }
