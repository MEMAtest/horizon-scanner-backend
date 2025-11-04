const { escapeHtml } = require('./helpers')
const { getAiIntelligenceStyles } = require('./styles')
const { getAiIntelligenceScripts } = require('./scripts')
const { formatDateDisplay } = require('../../utils/dateHelpers')

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) return '0'
  return Number(value).toLocaleString('en-GB')
}

function renderRiskPulse(snapshot = {}) {
  const { score = 0, label = 'Stable', delta = 0, components = [] } = snapshot.riskPulse || {}
  const deltaLabel = delta === 0 ? 'No change' : delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)
  const trendClass = delta > 0 ? 'pulse-up' : delta < 0 ? 'pulse-down' : 'pulse-flat'
  const componentList = Array.isArray(components) && components.length
    ? `<div class="pulse-breakdown">
        <span class="pulse-breakdown-title">Why ${score.toFixed(1)}?</span>
        ${components
            .map(component => `
              <span class="pulse-breakdown-item">
                <strong>${escapeHtml(component.label)}</strong>
                <span>${Number(component.score || 0).toFixed(1)} • weight ${(component.weight * 100).toFixed(0)}%</span>
              </span>
            `)
            .join('')}
      </div>`
    : ''

  return `
    <section class="risk-pulse">
      <div class="pulse-gauge" role="img" aria-label="Risk pulse score ${score}">
        <svg viewBox="0 0 120 120">
          <defs>
            <linearGradient id="pulseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#38bdf8" />
              <stop offset="100%" stop-color="#0ea5e9" />
            </linearGradient>
          </defs>
          <circle class="pulse-track" cx="60" cy="60" r="50" />
          <circle class="pulse-meter" cx="60" cy="60" r="50" stroke-dasharray="${Math.min(
            314,
            (score / 10) * 314
          )} 314" />
          <text x="60" y="68" class="pulse-score">${score.toFixed(1)}</text>
        </svg>
      </div>
      <div class="pulse-details">
        <span class="pulse-label">${escapeHtml(label)}</span>
        <span class="pulse-delta ${trendClass}">
          <span class="pulse-delta-icon"></span>
          ${escapeHtml(deltaLabel)}
        </span>
        <p class="pulse-focus">${escapeHtml(snapshot.focusHeadline || snapshot.heroInsight?.summary || 'Monitoring in progress.')}</p>
        ${componentList}
      </div>
    </section>
  `
}

function renderQuickStats(stats = {}) {
  const entries = [
    { label: 'Total updates', value: formatNumber(stats.totalUpdates || 0) },
    { label: 'High impact', value: formatNumber(stats.highImpact || 0) },
    { label: 'Active authorities', value: formatNumber(stats.activeAuthorities || 0) },
    { label: 'Imminent deadlines', value: formatNumber(stats.deadlinesSoon || 0) },
    { label: 'Urgent updates', value: formatNumber(stats.urgentUpdates || 0) }
  ]

  return `
    <section class="quick-stats" aria-label="Daily intelligence statistics">
      ${entries
        .map(
          entry => `
            <div class="quick-stat-card">
              <span class="quick-stat-value">${entry.value}</span>
              <span class="quick-stat-label">${escapeHtml(entry.label)}</span>
            </div>
          `
        )
        .join('')}
    </section>
  `
}

function renderExecutiveSummary(summaryText) {
  if (!summaryText) return ''
  return `
    <section class="executive-summary">
      <header>
        <h2>Executive Summary</h2>
        <button type="button" class="summary-refresh" onclick="window.RegCanaryIntelligence?.regenerateSummary()">
          Regenerate
        </button>
      </header>
      <p>${escapeHtml(summaryText)}</p>
    </section>
  `
}

function renderHeroInsight(hero = {}, riskPulse = {}) {
  if (!hero) return ''

  const related = Array.isArray(hero.relatedSignals) && hero.relatedSignals.length
    ? `<ul class="hero-related">${hero.relatedSignals.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
    : ''

  const components = Array.isArray(riskPulse.components) ? riskPulse.components : []
  const confidence = components.find(component => component.label.toLowerCase().includes('impact'))
  const confidenceLabel = confidence ? `${confidence.score.toFixed(1)}/10` : 'N/A'

  return `
    <section class="hero-insight">
      <div class="hero-copy">
        <h1>${escapeHtml(hero.headline || 'Hero insight unavailable')}</h1>
        <p class="hero-summary">${escapeHtml(hero.summary || 'No narrative available.')}</p>
        <div class="hero-recommendation">
          <strong>Recommended action:</strong>
          <span>${escapeHtml(hero.recommendation || 'Monitor developments and await further signals.')}</span>
        </div>
        ${related}
      </div>
      <div class="hero-meta">
        <div class="hero-score">
          <span class="hero-score-label">Signal score</span>
          <span class="hero-score-value">${escapeHtml((riskPulse.score || 0).toFixed ? riskPulse.score.toFixed(1) : String(riskPulse.score || 0))}</span>
          <span class="hero-score-confidence">Confidence ${escapeHtml(confidenceLabel)}</span>
        </div>
        <button type="button" class="hero-transparency" onclick="window.RegCanaryIntelligence?.showRiskExplain()">Why this score?</button>
      </div>
    </section>
  `
}

function renderStreamCard(update) {
  const personas = Array.isArray(update.personas) ? update.personas : []
  const personaChips = personas
    .map(persona => `<span class="persona-chip persona-${escapeHtml(persona)}">${escapeHtml(persona)}</span>`)
    .join('')

  const published = update.publishedAt ? formatDateDisplay(update.publishedAt) : 'Unknown'
  const isPinned = update.isPinned ? 'true' : 'false'
  const pinActiveClass = update.isPinned ? ' is-pinned' : ''
  const pinSymbol = update.isPinned ? '★' : '☆'
  const cardUrlAttr = update.url ? ` data-url="${escapeHtml(update.url)}"` : ''

  return `
    <article class="stream-card" data-update-id="${escapeHtml(update.updateId || '')}"${cardUrlAttr} data-pinned="${isPinned}">
      <header>
        <span class="card-authority">${escapeHtml(update.authority || 'Unknown')}</span>
        <span class="card-urgency urgency-${escapeHtml((update.urgency || 'Low').toLowerCase())}">
          ${escapeHtml(update.urgency || 'Low')}
        </span>
      </header>
      <h3>
        <a href="${escapeHtml(update.url || '#')}" target="_blank" rel="noopener">
          ${escapeHtml(update.headline || 'Untitled update')}
        </a>
      </h3>
      <p class="card-summary">${escapeHtml(update.summary || 'Summary not available.')}</p>
      <footer>
        <div class="card-metadata">
          <span class="card-published">Published ${escapeHtml(published)}</span>
          ${personaChips}
          ${update.primarySector ? `<span class="sector-tag">${escapeHtml(update.primarySector)}</span>` : ''}
        </div>
        <div class="card-actions">
          <span class="card-next-step">${escapeHtml(update.nextStep || 'Monitor developments')}</span>
          <div class="card-buttons">
            <button type="button" class="icon-btn pin-toggle${pinActiveClass}" data-action="pin" data-update-id="${escapeHtml(
              update.updateId || ''
            )}" data-pinned="${isPinned}" aria-pressed="${isPinned}" title="${
              update.isPinned ? 'Unpin update' : 'Pin update'
            }">${pinSymbol}</button>
            <button type="button" class="icon-btn" data-action="annotate" data-update-id="${escapeHtml(
              update.updateId || ''
            )}">✎</button>
            <button type="button" class="icon-btn" data-action="share" data-update-id="${escapeHtml(
              update.updateId || ''
            )}">⇪</button>
          </div>
        </div>
      </footer>
    </article>
  `
}

function renderStreamColumn(title, stream = [], key = '') {
  if (!stream.length) return ''
  return `
    <section class="stream-column" data-stream-key="${escapeHtml(key)}">
      <header class="stream-header">
        <h3>${escapeHtml(title)}</h3>
        <span class="stream-count">${stream.length} updates</span>
      </header>
      <div class="stream-list">
        ${stream.map(renderStreamCard).join('')}
      </div>
    </section>
  `
}

function renderStreams(streams = {}, workspace = {}, timeline = [], themes = []) {
  const priorityFeed = [...(streams.high || [])]
    .concat((streams.medium || []).map(update => ({ ...update, bucketOverride: 'medium' })))
    .concat((streams.low || []).map(update => ({ ...update, bucketOverride: 'low' })))
    .sort((a, b) => {
      const rank = value => (value.bucketOverride === 'medium' ? 1 : value.bucketOverride === 'low' ? 2 : 0)
      const bucketDiff = rank(a) - rank(b)
      if (bucketDiff !== 0) return bucketDiff
      return streamTimestamp(b.publishedAt) - streamTimestamp(a.publishedAt)
    })

  const sidebar = [renderStreamColumn('Medium relevance', streams.medium, 'medium'), renderStreamColumn('Background intelligence', streams.low, 'low')]
  sidebar.push(renderWorkspacePulse(workspace))
  sidebar.push(renderTimeline(timeline))
  if (themes && themes.length) {
    sidebar.push(renderThemes(themes))
  }

  return `
    <section class="streams-split" aria-label="Daily intelligence">
      <div class="priority-feed">
        <header class="section-header"><h2>Priority feed</h2></header>
        <div class="priority-list">
          ${priorityFeed.map(renderStreamCard).join('') || '<p class="empty">No priority updates available.</p>'}
        </div>
      </div>
      <aside class="action-sidebar">
        ${sidebar.join('')}
      </aside>
    </section>
  `
}

function streamTimestamp(value) {
  if (!value) return 0
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

function renderPersonaTabs(personas = {}) {
  const personaOrder = ['executive', 'analyst', 'operations']
  const tabs = personaOrder
    .filter(persona => personas[persona])
    .map(
      persona => `
        <button type="button" class="persona-tab" data-persona="${persona}">
          <span class="persona-tab-label">${persona.charAt(0).toUpperCase() + persona.slice(1)}</span>
          <span class="persona-tab-count">${formatNumber(personas[persona].count)}</span>
        </button>
      `
    )
    .join('')

  const panels = personaOrder
    .filter(persona => personas[persona])
    .map(persona => {
      const data = personas[persona]
      const briefing = data.briefing || {}
      const actions = Array.isArray(briefing.nextSteps) && briefing.nextSteps.length
        ? `<ol class="persona-brief-list">${briefing.nextSteps.map(step => `<li>${escapeHtml(step)}</li>`).join('')}</ol>`
        : '<div class="persona-empty">No spotlight updates for this persona right now. Pin or annotate items to surface them here.</div>'
      return `
        <div class="persona-panel" data-persona-panel="${persona}">
          <div class="persona-metrics">
            <div><span class="metric-label">Updates</span><span class="metric-value">${formatNumber(
              data.count
            )}</span></div>
            <div><span class="metric-label">Pinned</span><span class="metric-value">${formatNumber(
              data.pins || 0
            )}</span></div>
            <div><span class="metric-label">Open tasks</span><span class="metric-value">${formatNumber(
              data.openTasks || 0
            )}</span></div>
          </div>
          <div class="persona-briefing">
            <p>${escapeHtml(briefing.summary || 'No priority actions detected.')}</p>
            ${actions}
          </div>
        </div>
      `
    })
    .join('')

  return `
    <section class="persona-intelligence">
      <header>
        <h2>Persona Intelligence</h2>
        <div class="persona-tabs">${tabs}</div>
      </header>
      <div class="persona-panels">
        ${panels}
      </div>
    </section>
  `
}

function renderWorkspacePulse(workspace = {}) {
  const cards = [
    {
      key: 'pinned',
      label: 'Pinned updates',
      value: formatNumber((workspace.pinnedItems || []).length),
      meta: 'Saved for follow-up',
      action: "WorkspaceModule && WorkspaceModule.showPinnedItems && WorkspaceModule.showPinnedItems()"
    },
    {
      key: 'searches',
      label: 'Saved searches',
      value: formatNumber((workspace.savedSearches || []).length),
      meta: 'Reusable filters',
      action: "WorkspaceModule && WorkspaceModule.showSavedSearches && WorkspaceModule.showSavedSearches()"
    },
    {
      key: 'alerts',
      label: 'Active alerts',
      value: formatNumber((workspace.customAlerts || []).filter(alert => alert.isActive).length),
      meta: 'Monitoring thresholds',
      action: "WorkspaceModule && WorkspaceModule.showCustomAlerts && WorkspaceModule.showCustomAlerts()"
    },
    {
      key: 'tasks',
      label: 'Open actions',
      value: formatNumber(workspace.tasks || 0),
      meta: 'Annotations requiring action',
      action: "WorkspaceModule && WorkspaceModule.showAnnotations && WorkspaceModule.showAnnotations()"
    }
  ]

  return `
    <section class="workspace-pulse">
      <header>
        <h2>Workspace Pulse</h2>
        <p>Snapshot of team activity and outstanding actions</p>
      </header>
      <div class="workspace-grid">
        ${cards
          .map(
            card => `
          <button type="button" class="workspace-card" data-workspace-card="${escapeHtml(card.key)}" onclick="${card.action}">
            <span class="workspace-value">${card.value}</span>
            <span class="workspace-label">${escapeHtml(card.label)}</span>
            <span class="workspace-meta">${escapeHtml(card.meta)}</span>
          </button>
        `
          )
          .join('')}
      </div>
    </section>
  `
}

function renderTimeline(timeline = []) {
  if (!timeline.length) {
    return `
      <section class="intelligence-timeline">
        <header><h2>Compliance Timeline</h2></header>
        <p class="timeline-empty">No upcoming deadlines detected within the next 30 days.</p>
      </section>
    `
  }

  const items = timeline
    .map(event => {
      const dateLabel = formatDateDisplay(event.date)
      return `
        <li class="timeline-item timeline-${escapeHtml((event.urgency || 'low').toLowerCase())}">
          <span class="timeline-date">${escapeHtml(dateLabel)}</span>
          <div>
            <strong>${escapeHtml(event.title || 'Compliance deadline')}</strong>
            <span>${escapeHtml(event.authority || 'Regulator')}</span>
          </div>
        </li>
      `
    })
    .join('')

  return `
    <section class="intelligence-timeline">
      <header><h2>Compliance Timeline</h2></header>
      <ul class="timeline-list">
        ${items}
      </ul>
    </section>
  `
}

function renderThemes(themes = []) {
  if (!themes.length) return ''
  return `
    <section class="emerging-themes">
      <header><h2>Emerging Themes</h2></header>
      <div class="theme-cloud">
        ${themes
          .map(
            theme => `
              <span class="theme-chip">
                ${escapeHtml(theme.label)}
                <span class="theme-support">${formatNumber(theme.support)}</span>
              </span>
            `
          )
          .join('')}
      </div>
    </section>
  `
}

function buildAiIntelligencePage({
  sidebar,
  snapshot,
  workspaceBootstrapScripts,
  clientScripts,
  commonStyles
}) {
  const data = snapshot || {}
  const themes = data.layoutConfig?.showThemes === false ? [] : (data.themes || [])
  const styles = getAiIntelligenceStyles()
  const scripts = getAiIntelligenceScripts(data)

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AI Intelligence - Regulatory Intelligence Platform</title>
      ${commonStyles}
      ${workspaceBootstrapScripts}
      ${styles}
    </head>
    <body>
      <div class="app-container">
        ${sidebar}

        <main class="main-content">
          <header class="hero-panel">
            <div class="hero-headline">
              <span class="hero-title">AI Intelligence Brief</span>
          <span class="hero-date">${formatDateDisplay(data.snapshotDate || new Date())}</span>
            </div>
            <div class="hero-actions">
              <button type="button" class="export-btn" onclick="window.RegCanaryIntelligence?.exportOnePager()">Export one-pager</button>
            </div>
          </header>

          ${renderHeroInsight(data.heroInsight || {}, data.riskPulse || {})}
          ${renderRiskPulse(data)}
          ${renderQuickStats(data.quickStats)}
          ${renderStreams(data.streams || {}, data.workspace || {}, data.timeline || [], themes)}
          ${renderPersonaTabs(data.personas || {})}
        </main>
      </div>
      <script>
        window.intelligenceSnapshot = ${JSON.stringify(data).replace(/</g, '\\u003c')};
      </script>
      ${clientScripts}
      ${scripts}
    </body>
    </html>
  `
}

module.exports = { buildAiIntelligencePage }
