const { renderHeaderSection } = require('./sections/header')
const { renderMainContent } = require('./sections/mainContent')
const { renderSidebar } = require('./sections/sidebar')
const { renderModals } = require('./sections/modals')
const {
  getWeeklyBriefingStyles,
  getWeeklyBriefingRuntimeScripts
} = require('./assets')

function renderWeeklyBriefingPage({
  sidebar,
  commonStyles,
  clientScripts,
  sections,
  serialized,
  sidebarData = {}
}) {
  const { metaHtml, narrativeHtml, updatesHtml, onePagerHtml } = sections
  const { briefing, recent, initialUpdates, configSeed } = serialized

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Weekly Regulatory Roundup - Horizon Scanner</title>
        ${commonStyles}
        ${getWeeklyBriefingStyles()}
      </head>
      <body>
        <div class="app-container">
          ${sidebar}
          <main class="main-content">
            <div class="briefing-shell">
              ${renderHeaderSection(metaHtml)}
              <div class="report-grid">
                <div class="report-main">
                  ${renderMainContent({
                    onePagerHtml,
                    narrativeHtml,
                    updatesHtml
                  })}
                </div>
                ${renderSidebar(sidebarData)}
              </div>
            </div>
          </main>
        </div>
        ${renderModals()}
        <script>
          window.initialUpdates = ${initialUpdates};
        </script>
        <script>
          window.__SMART_BRIEFING__ = ${briefing};
          window.__SMART_BRIEFING_LIST__ = ${recent};
          window.__SMART_BRIEFING_CONFIG__ = ${configSeed};
        </script>
        ${clientScripts}
        ${getWeeklyBriefingRuntimeScripts()}
      </body>
    </html>
  `
}

function buildConfigSeed({ maxHighlightUpdates, maxUpdatesPerGroup }) {
  return JSON.stringify({
    maxHighlightUpdates,
    maxUpdatesPerGroup
  })
}

module.exports = {
  renderWeeklyBriefingPage,
  buildConfigSeed
}
