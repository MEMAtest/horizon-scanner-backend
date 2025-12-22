const { getWorkspaceHubStyles } = require('./styles')
const { getWorkspaceHubScripts } = require('./scripts')
const { getProfileIcon, wrapIconInContainer, getCanaryAnimationStyles } = require('../icons')

function buildWorkspaceHubPage({
  sidebar,
  clientScripts,
  commonStyles,
  pinnedItems,
  bookmarkCollections,
  savedSearches,
  customAlerts,
  upcomingEvents,
  stats,
  userId
}) {
  const workspaceHubStyles = getWorkspaceHubStyles()
  const workspaceHubScripts = getWorkspaceHubScripts({
    pinnedItems,
    bookmarkCollections,
    savedSearches,
    customAlerts,
    upcomingEvents,
    userId
  })
  const canaryStyles = getCanaryAnimationStyles()
  const pageIcon = wrapIconInContainer(getProfileIcon())

  // Generate widgets
  const upcomingEventsWidget = renderUpcomingEventsWidget(upcomingEvents || [])
  const bookmarkThemesWidget = renderBookmarkThemesWidget(pinnedItems || [])
  const activityGraphWidget = renderActivityGraphWidget()
  const savedSearchesWidget = renderSavedSearchesWidget(savedSearches || [])

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
                <p class="subtitle">Your personal command center for regulatory intelligence</p>
              </div>
            </div>
            <div class="header-actions">
              <button class="btn btn-secondary" id="hubRefreshAllBtn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
                Refresh
              </button>
              <a class="btn btn-primary" href="/kanban">Change Board</a>
            </div>
          </header>

          <!-- Top Widgets Row: Events + Themes -->
          <div class="widgets-row">
            ${upcomingEventsWidget}
            ${bookmarkThemesWidget}
          </div>

          <!-- Second Row: Activity Graph (full width) -->
          <div class="widgets-row single">
            ${activityGraphWidget}
          </div>

          <!-- Main Content Grid: Collections & Bookmarks -->
          <div class="hub-grid">
            <section class="hub-panel">
              <div class="panel-header">
                <div>
                  <h2>Collections</h2>
                  <p class="panel-subtitle">Organize your bookmarks</p>
                </div>
                <div class="panel-actions">
                  <button class="btn-small" id="hubNewCollectionBtn">+ New</button>
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
                  <p class="panel-subtitle">Star updates anywhere to save them here</p>
                </div>
                <div class="panel-actions">
                  <input id="workspaceHubSearch" class="hub-search" placeholder="Search bookmarks..." />
                  <button class="btn-small" id="hubAddUrlBtn">+ Add URL</button>
                </div>
              </div>
              <div id="workspaceHubBookmarks" class="bookmarks-list">
                <div class="loading-placeholder">Loading bookmarks...</div>
              </div>
            </section>
          </div>

          <!-- Bottom: Saved Searches (horizontal row) -->
          ${savedSearchesWidget}
        </div>
      </main>

      ${clientScripts}
      ${workspaceHubScripts}
    </body>
    </html>
  `
}

/**
 * Render Upcoming Events Widget - Event Cards
 */
function renderUpcomingEventsWidget(events) {
  const safeEvents = Array.isArray(events) ? events : []
  const now = new Date()

  // Sort by priority (critical first) then by date
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
  const sortedEvents = [...safeEvents]
    .filter(e => e.eventDate && new Date(e.eventDate) >= now)
    .sort((a, b) => {
      const priorityDiff = (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3)
      if (priorityDiff !== 0) return priorityDiff
      return new Date(a.eventDate) - new Date(b.eventDate)
    })
    .slice(0, 3)

  // Count critical events this week
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const criticalThisWeek = safeEvents.filter(e => {
    const eventDate = new Date(e.eventDate)
    return eventDate <= oneWeekFromNow && (e.priority === 'critical' || e.priority === 'high')
  }).length

  const priorityDots = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢'
  }

  const eventsHtml = sortedEvents.length > 0
    ? sortedEvents.map(event => {
        const eventDate = new Date(event.eventDate)
        const daysUntil = Math.ceil((eventDate - now) / (24 * 60 * 60 * 1000))
        const daysText = daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`
        const dot = priorityDots[event.priority] || '🟡'
        const authority = event.authority || 'Unknown'

        return `
          <div class="event-card" onclick="window.location.href='/regulatory-calendar'">
            <div class="event-priority">${dot}</div>
            <div class="event-info">
              <span class="event-title">${escapeHtml(truncate(event.title, 35))}</span>
              <span class="event-meta">${escapeHtml(authority)} · ${daysText}</span>
            </div>
          </div>
        `
      }).join('')
    : '<div class="empty-events">No upcoming events</div>'

  return `
    <div class="widget upcoming-events-widget">
      <div class="widget-header">
        <h3>
          <span class="widget-icon">📅</span>
          Upcoming Events
        </h3>
        <a href="/regulatory-calendar" class="widget-link">View All →</a>
      </div>
      <div class="widget-body">
        <div class="event-cards">
          ${eventsHtml}
        </div>
        <div class="widget-stats-row">
          <span class="widget-stat ${criticalThisWeek > 0 ? 'critical' : ''}">
            🔴 ${criticalThisWeek} critical this week
          </span>
          <span class="widget-stat">
            📋 ${safeEvents.length} total
          </span>
        </div>
      </div>
    </div>
  `
}

/**
 * Render Bookmark Themes Widget - Horizontal Stacked Bar
 */
function renderBookmarkThemesWidget(pinnedItems) {
  const safeItems = Array.isArray(pinnedItems) ? pinnedItems : []

  // Count topics
  const themeCounts = {}
  for (const item of safeItems) {
    const metadata = item.metadata && typeof item.metadata === 'object' ? item.metadata : {}
    const topic = metadata.topicArea || metadata.topic_area || metadata.topic || 'Uncategorized'
    themeCounts[topic] = (themeCounts[topic] || 0) + 1
  }

  const sortedThemes = Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const themeCount = Object.keys(themeCounts).length
  const total = safeItems.length || 1

  // Theme colors and abbreviations
  const themeConfig = {
    'Consumer Duty': { color: '#3b82f6', abbr: 'CD' },
    'Operational Resilience': { color: '#10b981', abbr: 'OpRes' },
    'Financial Crime / AML': { color: '#ef4444', abbr: 'AML' },
    'Sanctions': { color: '#f97316', abbr: 'Sanc' },
    'Capital & Liquidity': { color: '#8b5cf6', abbr: 'Cap' },
    'Conduct & Market Abuse': { color: '#ec4899', abbr: 'Cond' },
    'Payments': { color: '#14b8a6', abbr: 'Pay' },
    'Data Protection': { color: '#6b7280', abbr: 'DP' },
    'ESG / Sustainability': { color: '#059669', abbr: 'ESG' },
    'Uncategorized': { color: '#94a3b8', abbr: 'Other' }
  }

  const defaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  const barHtml = sortedThemes.length > 0
    ? `<div class="stacked-bar">
        ${sortedThemes.map(([theme, count], i) => {
          const config = themeConfig[theme] || { color: defaultColors[i % 5], abbr: theme.slice(0, 4) }
          const widthPercent = (count / total) * 100
          return `
            <div class="bar-segment"
                 style="width: ${widthPercent}%; background: ${config.color};"
                 title="${theme}: ${count} bookmarks">
              <span class="segment-label">${config.abbr}</span>
              <span class="segment-count">(${count})</span>
            </div>
          `
        }).join('')}
      </div>`
    : '<div class="empty-themes">No bookmarks yet</div>'

  return `
    <div class="widget bookmark-themes-widget">
      <div class="widget-header">
        <h3>
          <span class="widget-icon">📊</span>
          Bookmark Themes
        </h3>
      </div>
      <div class="widget-body">
        ${barHtml}
        <div class="widget-footer-stats">
          ${safeItems.length} bookmarks across ${themeCount} themes
        </div>
      </div>
    </div>
  `
}

/**
 * Render Activity Graph Widget - 30-day SVG Line Chart
 */
function renderActivityGraphWidget() {
  // The actual data will be populated client-side from localStorage
  // This renders the container with SVG chart structure
  return `
    <div class="widget activity-graph-widget">
      <div class="widget-header">
        <h3>
          <span class="widget-icon">⚡</span>
          Activity (Last 30 Days)
        </h3>
      </div>
      <div class="widget-body">
        <div class="activity-chart" id="activityChart">
          <svg viewBox="0 0 400 100" preserveAspectRatio="none" class="chart-svg">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:0.3"/>
                <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:0.05"/>
              </linearGradient>
            </defs>
            <!-- Grid lines -->
            <line x1="0" y1="25" x2="400" y2="25" class="grid-line"/>
            <line x1="0" y1="50" x2="400" y2="50" class="grid-line"/>
            <line x1="0" y1="75" x2="400" y2="75" class="grid-line"/>
            <!-- Area fill -->
            <path id="activityArea" class="chart-area" d="M0,100 L0,100 L400,100 Z"/>
            <!-- Line -->
            <path id="activityLine" class="chart-line" d="M0,100 L400,100"/>
            <!-- Data points (populated by JS) -->
            <g id="activityPoints"></g>
          </svg>
          <div class="chart-labels">
            <span class="chart-label-start" id="chartStartDate">30 days ago</span>
            <span class="chart-label-end" id="chartEndDate">Today</span>
          </div>
        </div>
        <div class="chart-stats">
          <span class="chart-stat">Peak: <strong id="activityPeak">0</strong> actions</span>
          <span class="chart-stat">Avg: <strong id="activityAvg">0</strong>/day</span>
          <span class="chart-stat">Total: <strong id="activityTotal">0</strong></span>
        </div>
      </div>
    </div>
  `
}

/**
 * Render Saved Searches Widget - Horizontal Bottom Row
 */
function renderSavedSearchesWidget(savedSearches) {
  const safeSearches = Array.isArray(savedSearches) ? savedSearches.slice(0, 6) : []

  const searchesHtml = safeSearches.length > 0
    ? safeSearches.map(search => {
        const name = search.search_name || search.searchName || 'Unnamed Search'
        const lastRun = search.last_run || search.lastRun || search.created_at || search.createdAt
        const formattedDate = lastRun ? formatRelativeDate(lastRun) : 'Never run'
        return `
          <div class="search-card" data-search-id="${escapeHtml(search.id)}">
            <div class="search-card-name">${escapeHtml(truncate(name, 20))}</div>
            <div class="search-card-meta">${escapeHtml(formattedDate)}</div>
            <div class="search-card-actions">
              <button class="search-btn run" title="Run search" data-action="run">▶ Run</button>
              <button class="search-btn alert" title="Create alert" data-action="alert">🔔</button>
            </div>
          </div>
        `
      }).join('')
    : '<div class="empty-searches">No saved searches yet. Save a search from the dashboard to see it here.</div>'

  return `
    <div class="saved-searches-section">
      <div class="section-header">
        <h3>
          <span class="widget-icon">🔍</span>
          Saved Searches
        </h3>
        <button class="btn-small" id="saveCurrentSearchBtn">+ Save Current</button>
      </div>
      <div class="search-cards-row" id="savedSearchesList">
        ${searchesHtml}
      </div>
      <div class="section-hint">▶ Run search · 🔔 Convert to alert</div>
    </div>
  `
}

/**
 * Truncate text
 */
function truncate(str, length) {
  if (!str) return ''
  if (str.length <= length) return str
  return str.substring(0, length) + '...'
}

/**
 * Format relative date
 */
function formatRelativeDate(dateStr) {
  if (!dateStr) return 'Unknown'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return 'Unknown'

  const now = new Date()
  const diffMs = now - date
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
  if (!text) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

module.exports = { buildWorkspaceHubPage }
