const { formatDateDisplay } = require('../../utils/dateHelpers')
const { normalizeSectorName } = require('../../utils/sectorTaxonomy')
const {
  escapeHtml,
  generatePredictiveBadges,
  getUpdateKey,
  getVelocityForUpdate
} = require('./helpers')

function renderPersonaFilters(personaCounts) {
  return `
    <div class="persona-switcher">
      <button class="persona-filter active" data-persona-filter="all" type="button">
        <span>All Updates</span>
        <span class="persona-count">${personaCounts.all}</span>
      </button>
      <button class="persona-filter" data-persona-filter="executive" type="button">
        <span>Executive Briefings</span>
        <span class="persona-count">${personaCounts.executive}</span>
      </button>
      <button class="persona-filter" data-persona-filter="analyst" type="button">
        <span>Research Analysts</span>
        <span class="persona-count">${personaCounts.analyst}</span>
      </button>
      <button class="persona-filter" data-persona-filter="operations" type="button">
        <span>Operations Desk</span>
        <span class="persona-count">${personaCounts.operations}</span>
      </button>
    </div>
  `
}

function renderWorkspaceSummary({ pinnedItems, savedSearches, customAlerts, annotationSummary, totalUpdates }) {
  const activeAlerts = customAlerts.filter(alert => alert.isActive).length
  const annotationsMeta = annotationSummary.total > 0
    ? `${annotationSummary.tasks} tasks • ${annotationSummary.flagged} briefs`
    : 'Notes & actions'

  return `
    <div class="workspace-summary">
      <div class="workspace-card" onclick="WorkspaceModule.showPinnedItems()">
        <div class="workspace-card-icon">📌</div>
        <div class="workspace-card-body">
          <span class="workspace-card-label">Pinned Updates</span>
          <span class="workspace-card-count" id="pinnedCount">${pinnedItems.length}</span>
          <span class="workspace-card-meta">Saved for action</span>
        </div>
      </div>

      <div class="workspace-card" onclick="WorkspaceModule.showSavedSearches()">
        <div class="workspace-card-icon">🔍</div>
        <div class="workspace-card-body">
          <span class="workspace-card-label">Saved Searches</span>
          <span class="workspace-card-count" id="savedSearchesCount">${savedSearches.length}</span>
          <span class="workspace-card-meta">Curated filters</span>
        </div>
      </div>

      <div class="workspace-card" onclick="WorkspaceModule.showCustomAlerts()">
        <div class="workspace-card-icon">🔔</div>
        <div class="workspace-card-body">
          <span class="workspace-card-label">Active Alerts</span>
          <span class="workspace-card-count" id="customAlertsCount">${activeAlerts}</span>
          <span class="workspace-card-meta">Watching thresholds</span>
        </div>
      </div>

      <div class="workspace-card" onclick="WorkspaceModule.showAnnotations()">
        <div class="workspace-card-icon">🗂️</div>
        <div class="workspace-card-body">
          <span class="workspace-card-label">Saved Actions</span>
          <span class="workspace-card-count" id="annotationCount">${annotationSummary.total}</span>
          <span class="workspace-card-meta" id="annotationMeta">${annotationsMeta}</span>
        </div>
      </div>

      <div class="workspace-card" onclick="refreshIntelligence()">
        <div class="workspace-card-icon">🔄</div>
        <div class="workspace-card-body">
          <span class="workspace-card-label">Total Updates</span>
          <span class="workspace-card-count">${totalUpdates}</span>
          <span class="workspace-card-meta">Live in feed</span>
        </div>
      </div>
    </div>
  `
}

function renderUpdateStreams({ categorized, pinnedItems, personaMap, velocityLookup }) {
  const sections = [
    {
      id: 'high',
      indicatorClass: 'relevance-high',
      title: 'Target High Relevance to Your Firm',
      updates: categorized.high
    },
    {
      id: 'medium',
      indicatorClass: 'relevance-medium',
      title: 'Analytics Medium Relevance',
      updates: categorized.medium
    },
    {
      id: 'low',
      indicatorClass: 'relevance-low',
      title: 'News Background Intelligence',
      updates: categorized.low
    }
  ]

  const renderedSections = sections
    .filter(section => Array.isArray(section.updates) && section.updates.length > 0)
    .map(section => `
      <div class="stream-container">
        <div class="stream-header">
          <div class="stream-title">
            <div class="relevance-indicator ${section.indicatorClass}"></div>
            ${section.title}
          </div>
          <span class="stream-count">${section.updates.length} updates</span>
        </div>
        <div class="stream-content">
          ${section.updates.slice(0, 10).map(update => renderUpdateItem(update, pinnedItems, personaMap, velocityLookup)).join('')}
        </div>
      </div>
    `)
    .join('')

  if (renderedSections) {
    return `<div class="relevance-streams">${renderedSections}</div>`
  }

  return `
    <div class="relevance-streams">
      <div class="stream-container">
        <p style="text-align: center; color: #6b7280; padding: 40px;">
          No updates available. Click "Refresh Data" to fetch the latest regulatory updates.
        </p>
      </div>
    </div>
  `
}

function renderUpdateItem(update, pinnedItems = [], personaMap = {}, velocityLookup = {}) {
  const key = getUpdateKey(update)
  const personas = personaMap[key] && personaMap[key].length > 0 ? personaMap[key] : ['analyst']
  const isPinned = pinnedItems.some(p => (p.update_url || p.updateUrl) === update.url)
  const headlineText = (update.headline || 'Untitled Update').replace(/\s+/g, ' ').trim()
  const summarySource =
    update.ai_summary ||
    update.aiSummary ||
    update.summary ||
    update.impact ||
    update.description ||
    ''
  const summaryText = summarySource.length > 260 ? `${summarySource.slice(0, 257).trim()}...` : summarySource.trim()
  const published = update.publishedDate || update.published_date || update.fetchedDate || update.createdAt
  const deadline = update.compliance_deadline || update.complianceDeadline || null
  const impactLevel = update.impactLevel || update.impact_level || 'Informational'
  const relevanceScore = update.relevanceScore || update.relevance_score || null
  const authority = update.authority || 'Unknown'

  const sectorCandidates = []
  const sectorFields = [
    'primarySectors',
    'primary_sectors',
    'sectors',
    'sectorTags',
    'sector_tags',
    'aiSectors',
    'ai_sectors'
  ]

  sectorFields.forEach(field => {
    const value = update[field]
    if (Array.isArray(value)) {
      sectorCandidates.push(...value)
    } else if (typeof value === 'string' && value.trim()) {
      sectorCandidates.push(value)
    }
  })

  if (update.sector) {
    sectorCandidates.push(update.sector)
  }

  const normalizedSectors = Array.from(
    new Set(
      sectorCandidates
        .map(normalizeSectorName)
        .filter(Boolean)
    )
  )

  const primarySector = normalizedSectors[0] || ''
  const velocity = getVelocityForUpdate(update, velocityLookup)
  const predictiveBadges = generatePredictiveBadges(update)

  const personaBadges = personas
    .map(persona => `<span class="persona-badge persona-${persona}">${persona.charAt(0).toUpperCase() + persona.slice(1)}</span>`)
    .join('')

  const chips = [
    `<span class="meta-chip meta-authority">${escapeHtml(authority)}</span>`,
    `<span class="meta-chip meta-impact">${escapeHtml(impactLevel)}</span>`
  ]

  if (relevanceScore) {
    chips.push(`<span class="meta-chip meta-score">${relevanceScore}% relevance</span>`)
  }

  if (primarySector) {
    chips.push(`<span class="meta-chip meta-sector">${escapeHtml(primarySector)}</span>`)
  }

  if (deadline) {
    chips.push(`<span class="meta-chip meta-deadline">Deadline ${formatDateDisplay(deadline)}</span>`)
  }

  chips.push(`<span class="meta-chip meta-date">${formatDateDisplay(published)}</span>`)

  return `
    <div class="update-item" 
      data-update-key="${key}"
      data-update-id="${escapeHtml(update.id || update.update_id || '')}"
      data-update-url="${escapeHtml(update.url || '')}"
      data-personas="${personas.join(' ')}"
      data-headline="${escapeHtml(headlineText)}"
      data-authority="${escapeHtml(authority)}"
      data-impact="${escapeHtml(impactLevel)}"
      data-deadline="${deadline ? formatDateDisplay(deadline) : ''}"
      data-summary="${escapeHtml(summarySource || '')}"
      data-published="${escapeHtml(published || '')}"
      data-sector-list="${escapeHtml(JSON.stringify(normalizedSectors))}"
      data-url="${escapeHtml(update.url || '')}">
      <div class="update-content">
        <div class="update-headline">
          <a href="${escapeHtml(update.url || '#')}" target="_blank" rel="noopener" class="update-link">
            ${escapeHtml(headlineText)}
          </a>
        </div>
        <div class="update-meta">
          ${personaBadges}
          ${chips.join('')}
        </div>
        ${summaryText ? `<p class="update-summary">${escapeHtml(summaryText)}</p>` : ''}
        ${(velocity || predictiveBadges.length)
          ? `
            <div class="update-insights">
              ${velocity ? `<span class="velocity-indicator velocity-${velocity.trend}">${velocity.icon} ${escapeHtml(velocity.label)}</span>` : ''}
              ${predictiveBadges.length ? `<div class="predictive-badges">${predictiveBadges.map(badge => `<span class="predictive-badge">${escapeHtml(badge)}</span>`).join('')}</div>` : ''}
            </div>
          ` : ''}
      </div>
      <div class="quick-action-bar">
        <button class="quick-action" data-action="flag" onclick="IntelligencePage.flagForBrief('${key}')">Flag Brief</button>
        <button class="quick-action" data-action="note" onclick="IntelligencePage.addNote('${key}')">Add Note</button>
        <button class="quick-action" data-action="assign" onclick="IntelligencePage.assign('${key}')">Assign</button>
        <button class="quick-action" data-action="task" onclick="IntelligencePage.createTask('${key}')">Create Task</button>
        <button class="quick-action pin-btn ${isPinned ? 'pinned' : ''}"
          data-action="pin"
          aria-pressed="${isPinned ? 'true' : 'false'}"
          title="${isPinned ? 'Unpin this update' : 'Pin this update'}"
          onclick="IntelligencePage.togglePin('${key}')">
          ${isPinned ? 'Pinned' : 'Pin'}
        </button>
      </div>
    </div>
  `
}

module.exports = {
  renderPersonaFilters,
  renderUpdateStreams,
  renderWorkspaceSummary
}
