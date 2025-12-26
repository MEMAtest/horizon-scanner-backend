const { renderHeaderSection } = require('./sections/header')
const { renderStatsSection } = require('./sections/stats')
const { renderInsightsSection } = require('./sections/insights')
const { renderChartsSection } = require('./sections/charts')
const { renderTableSection } = require('./sections/table')
const {
  getPublicationsStyles,
  getPublicationsHeadScripts,
  getPublicationsRuntimeScripts
} = require('./assets')

function renderPublicationsPage({
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
        <title>Regulatory Notices - RegCanary</title>
        ${commonStyles}
        ${getPublicationsStyles()}
        ${getPublicationsHeadScripts()}
      </head>
      <body>
        <div class="app-container">
          ${sidebar}
          <main class="main-content">
            ${renderHeaderSection()}
            ${renderStatsSection()}
            ${renderInsightsSection()}
            ${renderChartsSection()}
            ${renderTableSection()}
          </main>
        </div>
        ${commonClientScripts}
        ${getPublicationsRuntimeScripts()}
      </body>
    </html>
  `
}

module.exports = {
  renderPublicationsPage
}
