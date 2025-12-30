const { getHandbookStyles } = require('./styles')
const { getHandbookScripts } = require('./scripts')
const { getHandbookIcon, wrapIconInContainer, getCanaryAnimationStyles } = require('../icons')

function buildHandbookPage({ sidebar, clientScripts, commonStyles }) {
  const handbookStyles = getHandbookStyles()
  const handbookScripts = getHandbookScripts()
  const canaryStyles = getCanaryAnimationStyles()
  const pageIcon = wrapIconInContainer(getHandbookIcon())

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>FCA Handbook Explorer - RegCanary</title>
      ${commonStyles}
      ${handbookStyles}
      <style>${canaryStyles}</style>
    </head>
    <body>
      ${sidebar}
      <main class="main-content">
        <div class="handbook-page">
          <header class="page-header">
            <div class="page-header-left">
              ${pageIcon}
              <div>
                <h1>FCA Handbook Explorer</h1>
                <p class="subtitle">Browse FCA handbook sourcebooks, chapters, and provisions.</p>
              </div>
            </div>
            <div class="header-actions">
              <div class="ingest-status" id="handbookIngestStatus">Loading ingest status...</div>
            </div>
          </header>

          <section class="handbook-controls">
            <div class="control-group">
              <label for="handbookSourcebookSelect">Sourcebook</label>
              <select id="handbookSourcebookSelect">
                <option value="">Loading...</option>
              </select>
            </div>
            <form id="handbookSearchForm" class="search-group">
              <div class="control-group" style="flex: 1;">
                <label for="handbookSearchInput">Search</label>
                <input id="handbookSearchInput" type="search" placeholder="Search handbook content..." />
              </div>
              <button type="submit" class="btn btn-primary">Search</button>
              <button type="button" class="btn" id="handbookClearSearch">Clear</button>
            </form>
          </section>

          <section class="handbook-search-results handbook-panel" id="handbookSearchResults">
            <div class="panel-header">
              <span>Search Results</span>
              <span class="meta">Click a result to view details</span>
            </div>
            <div class="panel-body" id="handbookSearchResultsBody"></div>
          </section>

          <div class="handbook-layout">
            <aside class="handbook-panel handbook-outline">
              <div class="panel-header">
                <span>Outline</span>
                <span class="meta">Chapters & sections</span>
              </div>
              <div class="panel-body" id="handbookOutline">
                <div class="loading-state">Loading outline...</div>
              </div>
            </aside>

            <section class="handbook-panel handbook-content">
              <div class="panel-header">
                <div>
                  <div class="content-header-title" id="handbookContentTitle">Select a section</div>
                  <div class="content-subtitle" id="handbookContentMeta"></div>
                </div>
              </div>
              <div class="panel-body" id="handbookContentBody">
                <div class="content-placeholder">Choose a section from the outline or search for a provision.</div>
              </div>
            </section>
          </div>
        </div>
      </main>

      ${clientScripts}
      ${handbookScripts}
    </body>
    </html>
  `
}

module.exports = { buildHandbookPage }
