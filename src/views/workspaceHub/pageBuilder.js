const { getWorkspaceHubStyles } = require('./styles')
const { getWorkspaceHubScripts } = require('./scripts')
const { getProfileIcon, wrapIconInContainer, getCanaryAnimationStyles } = require('../icons')

function buildWorkspaceHubPage({
  sidebar,
  clientScripts,
  commonStyles,
  pinnedItems,
  bookmarkCollections,
  stats,
  userId
}) {
  const workspaceHubStyles = getWorkspaceHubStyles()
  const workspaceHubScripts = getWorkspaceHubScripts({ pinnedItems, bookmarkCollections, userId })
  const canaryStyles = getCanaryAnimationStyles()
  const pageIcon = wrapIconInContainer(getProfileIcon())

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Profile Hub - RegCanary</title>
      ${commonStyles}
      ${workspaceHubStyles}
      <style>${canaryStyles}</style>
    </head>
    <body>
      ${sidebar}
      <main class="main-content">
        <div class="workspace-hub-page">
          <header class="page-header">
            <div class="page-header-left">
              ${pageIcon}
              <div>
                <h1>Profile Hub</h1>
                <p class="subtitle">Bookmarks, collections, and personal workflow shortcuts</p>
              </div>
            </div>
            <div class="header-actions">
              <a class="btn btn-secondary" href="/dashboard">Intelligence Feed</a>
              <a class="btn btn-secondary" href="/watch-lists">Watch Lists</a>
              <a class="btn btn-secondary" href="/dossiers">Dossiers</a>
              <a class="btn btn-secondary" href="/policies">Policies</a>
              <a class="btn btn-primary" href="/kanban">Change Board</a>
            </div>
          </header>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon blue">★</div>
              <div class="stat-value">${stats?.pinnedItems || 0}</div>
              <div class="stat-label">Bookmarks</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon purple">▦</div>
              <div class="stat-value">${stats?.bookmarkCollections || 0}</div>
              <div class="stat-label">Collections</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon green">🔎</div>
              <div class="stat-value">${stats?.savedSearches || 0}</div>
              <div class="stat-label">Saved searches</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon amber">🔔</div>
              <div class="stat-value">${stats?.activeAlerts || 0}</div>
              <div class="stat-label">Active alerts</div>
            </div>
          </div>

          <div class="hub-grid">
            <section class="hub-panel">
              <div class="panel-header">
                <div>
                  <h2>Collections</h2>
                  <p class="panel-subtitle">Personal, Professional, and custom folders</p>
                </div>
                <div class="panel-actions">
                  <button class="btn-small" id="hubNewCollectionBtn">New</button>
                </div>
              </div>
              <div id="workspaceHubCollections" class="collections-list">
                <div class="loading-placeholder">Loading collections...</div>
              </div>
            </section>

	            <section class="hub-panel">
	              <div class="panel-header">
	                <div>
	                  <h2>Bookmarks</h2>
	                  <p class="panel-subtitle">Star an update anywhere to save it here</p>
	                </div>
	                <div class="panel-actions">
	                  <input id="workspaceHubSearch" class="hub-search" placeholder="Search bookmarks..." />
	                  <button class="btn-small" id="hubAddUrlBtn">Add URL</button>
	                  <button class="btn-small" id="hubRefreshBtn">Refresh</button>
	                </div>
	              </div>
	              <div id="workspaceHubBookmarks" class="bookmarks-list">
	                <div class="loading-placeholder">Loading bookmarks...</div>
	              </div>
	            </section>
          </div>
        </div>
      </main>

      ${clientScripts}
      ${workspaceHubScripts}
    </body>
    </html>
  `
}

module.exports = { buildWorkspaceHubPage }
