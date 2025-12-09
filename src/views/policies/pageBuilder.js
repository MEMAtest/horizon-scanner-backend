const { getPolicyStyles } = require('./styles')
const { getPolicyScripts } = require('./scripts')
const {
  renderStatsCards,
  renderFilterBar,
  renderPoliciesList,
  renderCreateModal,
  renderViewModal,
  renderLinkSelectorModal
} = require('./components')

function buildPoliciesPage({
  sidebar,
  clientScripts,
  commonStyles,
  policies,
  stats,
  connectionCounts = {}
}) {
  const policyStyles = getPolicyStyles()
  const policyScripts = getPolicyScripts({ policies, stats })

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Policy Library - RegCanary</title>
      ${commonStyles}
      ${policyStyles}
    </head>
    <body>
      ${sidebar}
      <main class="main-content">
        <div class="policies-page">
          <header class="page-header">
            <div>
              <h1>Policy Library</h1>
              <p class="subtitle">Manage your regulatory policies with version control and approval workflows</p>
            </div>
            <div class="header-actions">
              <button class="btn btn-primary" data-action="create">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                New Policy
              </button>
            </div>
          </header>

          ${renderStatsCards(stats)}

          ${renderFilterBar()}

          ${renderPoliciesList(policies, connectionCounts)}
        </div>
      </main>

      ${renderCreateModal()}
      ${renderViewModal()}
      ${renderLinkSelectorModal()}

      ${clientScripts}
      ${policyScripts}
    </body>
    </html>
  `
}

module.exports = { buildPoliciesPage }
