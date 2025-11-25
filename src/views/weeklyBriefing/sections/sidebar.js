const { sanitizeHtml } = require('../helpers')

function renderSidebar({ stats, recentBriefings = [], metrics = {}, annotations = {} }) {
  return `
    <aside class="report-sidebar">
      ${renderSnapshotStats(stats)}
      ${renderRecentBriefings(recentBriefings)}
      ${renderMetricsSummary(metrics)}
      ${renderAnnotationsSummary(annotations)}
    </aside>
  `
}

function renderSnapshotStats(stats = {}) {
  return `
    <div class="sidebar-card">
      <h3 class="sidebar-card-title">Snapshot Stats</h3>
      <div class="stats-list">
        ${renderStatItem('Total Updates', stats.totalUpdates || 0, '', 'all')}
        ${renderStatItem('High Impact', stats.highImpact || 0, 'accent', 'high-impact')}
        ${renderStatItem('Moderate', stats.moderate || 0, '', 'moderate')}
        ${renderStatItem('Informational', stats.informational || 0, '', 'informational')}
      </div>
    </div>
  `
}

function renderStatItem(label, value, variant = '', filter = '') {
  const isClickable = filter && value > 0
  const clickableClass = isClickable ? 'stat-item-clickable' : ''
  const dataAttr = isClickable ? `data-filter="${filter}"` : ''
  const role = isClickable ? 'role="button" tabindex="0"' : ''

  return `
    <div class="stat-item ${variant ? `stat-item-${variant}` : ''} ${clickableClass}" ${dataAttr} ${role}>
      <span class="stat-value">${sanitizeHtml(String(value))}</span>
      <span class="stat-label">${sanitizeHtml(label)}</span>
      ${isClickable ? '<span class="stat-arrow">→</span>' : ''}
    </div>
  `
}

function renderQuickActions() {
  return `
    <div class="sidebar-card">
      <h3 class="sidebar-card-title">Quick Actions</h3>
      <div class="quick-actions-list">
        <button onclick="assembleBriefing()" class="quick-action-btn">
          <span class="action-icon">📋</span>
          <span>Assemble Briefing</span>
        </button>
        <button onclick="refreshData()" class="quick-action-btn">
          <span class="action-icon">🔄</span>
          <span>Refresh Data</span>
        </button>
        <button onclick="window.print()" class="quick-action-btn">
          <span class="action-icon">🖨️</span>
          <span>Print Report</span>
        </button>
      </div>
    </div>
  `
}

function renderRecentBriefings(briefings) {
  if (!briefings || !Array.isArray(briefings) || briefings.length === 0) {
    return `
      <div class="sidebar-card">
        <h3 class="sidebar-card-title">Recent Briefings</h3>
        <p class="sidebar-empty">No recent briefings</p>
      </div>
    `
  }

  return `
    <div class="sidebar-card">
      <h3 class="sidebar-card-title">Recent Briefings</h3>
      <div class="briefing-list">
        ${briefings.slice(0, 5).map(briefing => `
          <a href="/weekly-briefing/${sanitizeHtml(briefing.id)}" class="briefing-item">
            <span class="briefing-date">${sanitizeHtml(briefing.date || 'Unknown')}</span>
            <span class="briefing-title">${sanitizeHtml(briefing.title || 'Untitled')}</span>
          </a>
        `).join('')}
      </div>
    </div>
  `
}

function renderMetricsSummary(metrics) {
  return `
    <div class="sidebar-card">
      <h3 class="sidebar-card-title">Key Metrics</h3>
      <div class="metrics-grid">
        ${renderMetricItem('Coverage', metrics.coverage || '0%')}
        ${renderMetricItem('Velocity', metrics.velocity || 'Normal')}
        ${renderMetricItem('Alerts', metrics.alerts || 0)}
      </div>
    </div>
  `
}

function renderMetricItem(label, value) {
  return `
    <div class="metric-item">
      <div class="metric-value">${sanitizeHtml(String(value))}</div>
      <div class="metric-label">${sanitizeHtml(label)}</div>
    </div>
  `
}

function renderAnnotationsSummary(annotations) {
  const total = annotations.total || 0
  const flagged = annotations.flagged || 0
  const actionRequired = annotations.actionRequired || 0

  return `
    <div class="sidebar-card">
      <h3 class="sidebar-card-title">Workspace</h3>
      <div class="workspace-summary">
        <div class="workspace-item">
          <span class="workspace-count">${sanitizeHtml(String(total))}</span>
          <span class="workspace-label">Total Items</span>
        </div>
        ${flagged > 0 ? `
          <div class="workspace-item accent">
            <span class="workspace-count">${sanitizeHtml(String(flagged))}</span>
            <span class="workspace-label">Flagged</span>
          </div>
        ` : ''}
        ${actionRequired > 0 ? `
          <div class="workspace-item urgent">
            <span class="workspace-count">${sanitizeHtml(String(actionRequired))}</span>
            <span class="workspace-label">Action Needed</span>
          </div>
        ` : ''}
      </div>
    </div>
  `
}

module.exports = { renderSidebar }
