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

  // Intelligence widgets (2 widgets only)
  const deadlineRunwayWidget = renderDeadlineRunwayWidget()
  const authorityTrackerWidget = renderAuthorityTrackerWidget()

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
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
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

          <!-- Intelligence Widgets Row: Runway + Authority -->
          <div class="widgets-row intelligence-row">
            ${deadlineRunwayWidget}
            ${authorityTrackerWidget}
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
  const calendarMarkup = buildEventsCalendarMarkup(safeEvents, now)

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
  const criticalEventsThisWeek = safeEvents.filter(e => {
    if (!e.eventDate) return false
    const eventDate = new Date(e.eventDate)
    return eventDate >= now && eventDate <= oneWeekFromNow && String(e.priority || '').toLowerCase() === 'critical'
  })
  const criticalThisWeek = criticalEventsThisWeek.length
  const criticalTooltip = criticalThisWeek
    ? criticalEventsThisWeek
        .map(event => `- ${event.title || 'Critical event'}`)
        .join('\n')
    : 'No critical events this week'
  const criticalLink = '/regulatory-calendar?view=agenda&priority=critical'

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

  // Custom SVG icon - calendar with dot
  const calendarIcon = `<svg class="widget-icon-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
    <circle cx="12" cy="15" r="2" fill="#3b82f6" stroke="#3b82f6"/>
  </svg>`

  return `
    <div class="widget upcoming-events-widget">
      <div class="widget-header">
        <h3>
          ${calendarIcon}
          Upcoming Events
        </h3>
        <div class="widget-controls">
          <div class="widget-toggle" role="tablist" aria-label="Upcoming events view">
            <button class="widget-toggle-btn active" type="button" data-events-toggle="list">List</button>
            <button class="widget-toggle-btn" type="button" data-events-toggle="calendar">Calendar</button>
          </div>
          <a href="/regulatory-calendar" class="widget-link">View All →</a>
        </div>
      </div>
      <div class="widget-body">
        <div class="events-view events-list active" data-events-view="list">
          <div class="event-cards">
            ${eventsHtml}
          </div>
          <div class="widget-stats-row">
            <span class="widget-stat widget-stat-tooltip ${criticalThisWeek > 0 ? 'critical' : ''}" data-tooltip="${escapeHtml(criticalTooltip)}" tabindex="0">
            🔴 ${criticalThisWeek} critical this week
            </span>
            <span class="widget-stat">
              📋 ${safeEvents.length} total
            </span>
            <a class="widget-stat-link" href="${criticalLink}">View critical →</a>
          </div>
        </div>
        <div class="events-view events-calendar" data-events-view="calendar">
          ${calendarMarkup}
        </div>
      </div>
    </div>
  `
}

function buildEventsCalendarMarkup(events, now) {
  const safeNow = now instanceof Date && !isNaN(now) ? new Date(now) : new Date()
  safeNow.setHours(0, 0, 0, 0)
  const dayOfWeek = safeNow.getDay()
  const mondayOffset = (dayOfWeek + 6) % 7
  const startDate = new Date(safeNow)
  startDate.setDate(safeNow.getDate() - mondayOffset)

  const totalDays = 35
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + totalDays - 1)

  const eventsByDate = {}
  events.forEach(event => {
    if (!event || !event.eventDate) return
    const date = new Date(event.eventDate)
    if (isNaN(date)) return
    const key = date.toISOString().split('T')[0]
    if (!eventsByDate[key]) eventsByDate[key] = []
    eventsByDate[key].push(event)
  })

  const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const todayKey = safeNow.toISOString().split('T')[0]
  const priorityRank = { critical: 3, high: 2, medium: 1, low: 0 }

  const cells = []
  for (let i = 0; i < totalDays; i += 1) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    const dateKey = date.toISOString().split('T')[0]
    const items = eventsByDate[dateKey] || []
    const isToday = dateKey === todayKey
    const isPast = date < safeNow

    let topPriority = null
    let topPriorityRank = -1
    items.forEach(item => {
      const priority = (item.priority || 'medium').toLowerCase()
      const rank = priorityRank[priority] ?? 0
      if (rank > topPriorityRank) {
        topPriorityRank = rank
        topPriority = priority
      }
    })

    const tooltip = items.length
      ? items.slice(0, 3).map(item => escapeHtml(item.title || 'Event')).join(' • ') +
        (items.length > 3 ? ` +${items.length - 3} more` : '')
      : ''

    cells.push(`
      <div class="calendar-cell${isToday ? ' today' : ''}${isPast ? ' muted' : ''}"${tooltip ? ` title="${tooltip}"` : ''}>
        <div class="calendar-date">
          <span>${date.getDate()}</span>
          ${items.length ? `<span class="calendar-count">${items.length}</span>` : ''}
        </div>
        ${items.length ? `<span class="calendar-dot priority-${topPriority || 'medium'}"></span>` : '<span class="calendar-dot empty"></span>'}
      </div>
    `)
  }

  const startLabel = startDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
  const endLabel = endDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
  const rangeLabel = startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`

  return `
    <div class="events-calendar-wrap">
      <div class="calendar-header">
        <span class="calendar-title">${escapeHtml(rangeLabel)}</span>
        <span class="calendar-subtitle">Next 5 weeks</span>
      </div>
      <div class="calendar-weekdays">
        ${weekdayLabels.map(label => `<span>${label}</span>`).join('')}
      </div>
      <div class="calendar-grid">
        ${cells.join('')}
      </div>
    </div>
  `
}

/**
 * Render Bookmark Themes Widget - Chart.js Doughnut Chart
 */
function renderBookmarkThemesWidget(pinnedItems) {
  const safeItems = Array.isArray(pinnedItems) ? pinnedItems : []

  // Count topics
  const themeCounts = {}
  for (const item of safeItems) {
    const metadata = item.metadata && typeof item.metadata === 'object' ? item.metadata : {}
    const topic = normalizeThemeLabel(metadata.topicArea || metadata.topic_area || metadata.topic || '')
    themeCounts[topic] = (themeCounts[topic] || 0) + 1
  }

  const themeCount = Object.keys(themeCounts).length

  const chartHtml = safeItems.length > 0
    ? `<div class="chart-card">
        <div class="chart-container" style="height: 180px;">
          <canvas id="bookmarkThemesChart"></canvas>
        </div>
      </div>`
    : '<div class="empty-themes">No bookmarks yet</div>'

  // Custom SVG icon - pie/doughnut chart
  const themesIcon = `<svg class="widget-icon-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 3v9l6.5 6.5"/>
    <path d="M12 12L5.5 18.5"/>
    <circle cx="12" cy="12" r="3" fill="#3b82f6" stroke="#3b82f6"/>
  </svg>`

  return `
    <div class="widget bookmark-themes-widget">
      <div class="widget-header">
        <h3>
          ${themesIcon}
          Bookmark Themes
        </h3>
      </div>
      <div class="widget-body">
        ${chartHtml}
        <div class="widget-footer-stats">
          ${safeItems.length} bookmarks across ${themeCount} themes
        </div>
      </div>
    </div>
  `
}

/**
 * Render Activity Graph Widget - Chart.js Bar Chart
 */
function renderActivityGraphWidget() {
  // Custom SVG icon - activity/pulse line
  const activityIcon = `<svg class="widget-icon-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 12h4l3-9 4 18 3-9h4"/>
    <circle cx="20" cy="12" r="2" fill="#3b82f6" stroke="#3b82f6"/>
  </svg>`

  // The actual data will be populated client-side from localStorage
  // This renders the container with Chart.js canvas
  return `
    <div class="widget activity-graph-widget">
      <div class="widget-header">
        <h3>
          ${activityIcon}
          Activity (Last 30 Days)
        </h3>
      </div>
      <div class="widget-body">
        <div class="chart-card activity-chart-card">
          <div class="chart-container" style="height: 120px;">
            <canvas id="activityChart"></canvas>
          </div>
          <div class="chart-stats">
            <span class="chart-stat">Peak: <strong id="activityPeak">0</strong> actions</span>
            <span class="chart-stat">Avg: <strong id="activityAvg">0</strong>/day</span>
            <span class="chart-stat">Total: <strong id="activityTotal">0</strong></span>
          </div>
        </div>
      </div>
    </div>
  `
}

/**
 * Render Deadline Runway Widget - Stacked horizontal bar of upcoming deadlines
 */
function renderDeadlineRunwayWidget() {
  // Custom SVG icon - timeline/runway style
  const runwayIcon = `<svg class="widget-icon-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 12h18"/>
    <path d="M3 12l4-4v8l-4-4"/>
    <circle cx="10" cy="12" r="1.5" fill="currentColor"/>
    <circle cx="15" cy="12" r="1.5" fill="currentColor"/>
    <circle cx="20" cy="12" r="1.5" fill="currentColor"/>
    <path d="M10 8v-2" stroke-width="1.4"/>
    <path d="M15 8v-3" stroke-width="1.4"/>
    <path d="M20 8v-4" stroke-width="1.4"/>
  </svg>`

  return `
    <div class="widget deadline-runway-widget">
      <div class="widget-header">
        <h3>
          ${runwayIcon}
          Deadline Runway
        </h3>
        <span class="widget-period">Upcoming</span>
      </div>
      <div class="widget-body">
        <div class="runway-chart-container" style="position: relative; height: 140px;">
          <canvas id="deadlineRunwayChart"></canvas>
        </div>
        <div class="runway-totals" id="runwayTotals">
          <span class="runway-total" id="totalDeadlines">Loading...</span>
        </div>
      </div>
    </div>
  `
}

/**
 * Render Authority Tracker Widget - Horizontal bar chart with momentum indicators
 */
function renderAuthorityTrackerWidget() {
  // Custom SVG icon - authority/building with pulse style
  const authorityIcon = `<svg class="widget-icon-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 3L4 7v13h16V7l-8-4z"/>
    <path d="M8 11v5"/>
    <path d="M12 11v5"/>
    <path d="M16 11v5"/>
    <path d="M4 20h16"/>
    <circle cx="19" cy="5" r="2.5" fill="#3b82f6" stroke="#3b82f6"/>
    <path d="M19 3v4M17 5h4" stroke="#fff" stroke-width="1.2"/>
  </svg>`

  return `
    <div class="widget authority-tracker-widget">
      <div class="widget-header">
        <h3>
          ${authorityIcon}
          Authority Activity
        </h3>
        <span class="widget-period">Last 30 days</span>
      </div>
      <div class="widget-body">
        <div class="authority-chart-container" style="position: relative; height: 180px;">
          <canvas id="authorityTrackerChart"></canvas>
        </div>
        <div class="authority-momentum-legend">
          <span class="momentum-item"><span class="momentum-arrow up">▲</span>Increasing</span>
          <span class="momentum-item"><span class="momentum-arrow stable">●</span>Stable</span>
          <span class="momentum-item"><span class="momentum-arrow down">▼</span>Decreasing</span>
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

  // Custom SVG icon - search/magnifier
  const searchIcon = `<svg class="widget-icon-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="11" cy="11" r="7"/>
    <path d="M21 21l-4.35-4.35"/>
    <path d="M11 8v6M8 11h6" stroke-width="1.4"/>
  </svg>`

  return `
    <div class="saved-searches-section">
      <div class="section-header">
        <h3>
          ${searchIcon}
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

function normalizeThemeLabel(value) {
  const raw = value != null ? String(value).trim() : ''
  if (!raw) return 'Other'
  const lowered = raw.toLowerCase()
  if (lowered === 'uncategorized' || lowered === 'uncategorised') {
    return 'Other'
  }
  return raw
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
