const {
  computeAIFeatures,
  formatDateDisplay,
  isFallbackSummary,
  sanitizeHtml,
  selectSummary,
  truncateText
} = require('./helpers')
const { getAuthorityDisplayName } = require('../../utils/authorityRegistry')

function renderProfileSelector(profiles = [], selectedProfileId = null) {
  if (!profiles || profiles.length === 0) {
    return `
      <div class="profile-selector">
        <select id="business-line-profile" class="profile-select" onchange="DashboardPage.changeProfile(this.value)">
          <option value="">All Business Lines</option>
        </select>
        <button type="button" class="profile-manage-link" onclick="openProfileModal()" title="Manage Profiles">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 3v18M3 12h18"/>
          </svg>
        </button>
      </div>
    `
  }

  const selectedProfile = profiles.find(p =>
    String(p.id) === String(selectedProfileId)
  )

  const options = profiles.map(profile => {
    const isSelected = String(profile.id) === String(selectedProfileId)
    const colorDot = profile.color
      ? `<span class="profile-color-dot" style="background-color: ${sanitizeHtml(profile.color)}"></span>`
      : ''
    return `
      <option value="${sanitizeHtml(String(profile.id))}" ${isSelected ? 'selected' : ''}>
        ${sanitizeHtml(profile.name)}${profile.isDefault ? ' (Default)' : ''}
      </option>
    `
  }).join('')

  const profileInfo = selectedProfile
    ? `<div class="profile-info">
        ${selectedProfile.sectors && selectedProfile.sectors.length > 0
    ? `<span class="profile-sectors">${selectedProfile.sectors.slice(0, 2).map(s => sanitizeHtml(s)).join(', ')}${selectedProfile.sectors.length > 2 ? '...' : ''}</span>`
    : ''}
       </div>`
    : ''

  return `
    <div class="profile-selector">
      <div class="profile-select-wrapper">
        ${selectedProfile && selectedProfile.color
    ? `<span class="profile-color-indicator" style="background-color: ${sanitizeHtml(selectedProfile.color)}"></span>`
    : ''}
        <select id="business-line-profile" class="profile-select" onchange="DashboardPage.changeProfile(this.value)">
          <option value="">All Business Lines</option>
          ${options}
        </select>
      </div>
      ${profileInfo}
      <button type="button" class="profile-manage-link" onclick="openProfileModal()" title="Manage Profiles">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </button>
    </div>
  `
}

function renderStatsGrid(stats) {
  const aiCoverage = stats.totalUpdates > 0
    ? Math.round((stats.aiAnalyzed / stats.totalUpdates) * 100)
    : 0

  const impactTrend =
    stats.impactChange > 0 ? 'positive' : stats.impactChange < 0 ? 'negative' : 'neutral'
  const impactLabel =
    stats.impactChange === 0
      ? 'Stable week'
      : `${stats.impactChange > 0 ? '↗' : '↘'} ${Math.abs(stats.impactChange)}% vs last week`

  return `
    <section class="stats-grid">
      ${renderStatCard('Total Updates', stats.totalUpdates, stats.newToday ? `+${stats.newToday} today` : '', stats.newToday ? 'positive' : 'neutral')}
      ${renderStatCard('High Impact', stats.highImpact, impactLabel, impactTrend)}
      ${renderStatCard('AI Analyzed', stats.aiAnalyzed, `${aiCoverage}% coverage`, aiCoverage >= 60 ? 'positive' : 'neutral')}
      ${renderStatCard('Active Authorities', stats.activeAuthorities, stats.newAuthorities ? `+${stats.newAuthorities} this week` : '', stats.newAuthorities ? 'positive' : 'neutral')}
    </section>
  `
}

function renderStatCard(label, value, changeLabel, changeType = 'neutral') {
  return `
    <article class="stat-card">
      <span class="stat-number">${sanitizeHtml(String(value))}</span>
      <span class="stat-label">${sanitizeHtml(label)}</span>
      ${changeLabel ? `<div class="stat-change ${sanitizeHtml(changeType)}">${sanitizeHtml(changeLabel)}</div>` : ''}
    </article>
  `
}

function renderQuickFilters(activeCategory = 'all') {
  const quickOptions = [
    { value: 'all', label: 'All' },
    { value: 'consultations', label: 'Consultations' },
    { value: 'enforcement', label: 'Enforcement' },
    { value: 'guidance', label: 'Guidance' },
    { value: 'policy', label: 'Policy' },
    { value: 'speeches', label: 'Speeches' },
    { value: 'deadlines', label: 'Deadlines' },
    { value: 'high-impact', label: 'High Impact' }
  ]

  return `
    <div class="quick-filters" role="group" aria-label="Quick category filters">
      ${quickOptions.map(option => `
        <button
          type="button"
          class="quick-filter-btn ${option.value === activeCategory ? 'active' : ''}"
          data-filter="${sanitizeHtml(option.value)}"
          aria-pressed="${option.value === activeCategory ? 'true' : 'false'}"
        >
          ${sanitizeHtml(option.label)}
        </button>
      `).join('')}
    </div>
  `
}

function renderFilters({ filterOptions, currentFilters }) {
  return `
    <section class="filters-container">
      ${renderQuickFilters(currentFilters.category || 'all')}
      <form class="filters-grid" method="get" action="/dashboard">
        ${renderFilterSelect('Category', 'category', renderFilterOptionList([
    { value: 'all', label: 'All categories' },
    { value: 'high-impact', label: 'High impact' },
    { value: 'consultations', label: 'Consultations' },
    { value: 'enforcement', label: 'Enforcement actions' },
    { value: 'deadlines', label: 'Upcoming deadlines' }
  ], currentFilters.category))}
        ${renderFilterSelect('Authority', 'authority', renderAuthorityOptions(filterOptions.authorities, currentFilters.authority))}
        ${renderFilterSelect('Sector', 'sector', renderSectorOptions(filterOptions.sectors, currentFilters.sector))}
        ${renderFilterSelect('Impact Level', 'impact', renderFilterOptionList([
    { value: '', label: 'All impact levels' },
    { value: 'Significant', label: 'Significant' },
    { value: 'Moderate', label: 'Moderate' },
    { value: 'Informational', label: 'Informational' }
  ], currentFilters.impact))}
        <div class="filter-group">
          <label class="filter-label" for="search">Keyword search</label>
          <input id="search" class="filter-input" type="search" name="search" placeholder="Search updates..." value="${sanitizeHtml(currentFilters.search || '')}">
        </div>
        <div class="filter-group">
          <label class="filter-label" for="range">Date range</label>
          <select id="range" class="filter-select" name="range">
            ${renderFilterOptionList([
    { value: '', label: 'Any time' },
    { value: 'today', label: 'Today' },
    { value: '3d', label: 'Last 3 days' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' }
  ], currentFilters.range)}
          </select>
        </div>
        <div class="filter-actions">
          <button class="btn btn-primary" type="submit">Apply Filters</button>
          <a class="btn btn-secondary" href="/dashboard">Reset</a>
        </div>
      </form>
      ${renderActiveFilterTags(currentFilters)}
    </section>
  `
}

function renderFilterSelect(label, name, optionsHtml) {
  return `
    <div class="filter-group">
      <label class="filter-label" for="${sanitizeHtml(name)}">${sanitizeHtml(label)}</label>
      <select id="${sanitizeHtml(name)}" class="filter-select" name="${sanitizeHtml(name)}">
        ${optionsHtml}
      </select>
    </div>
  `
}

function renderFilterOptionList(options, selectedValue) {
  return options.map(option => `
    <option value="${sanitizeHtml(option.value)}" ${option.value === selectedValue ? 'selected' : ''}>
      ${sanitizeHtml(option.label)}
    </option>
  `).join('')
}

function renderAuthorityOptions(authorities = [], selectedAuthority) {
  const items = authorities.length
    ? authorities
    : [
        { name: 'FCA', label: getAuthorityDisplayName('FCA'), count: 0 },
        { name: 'PRA', label: getAuthorityDisplayName('PRA'), count: 0 },
        { name: 'Bank of England', label: getAuthorityDisplayName('Bank of England'), count: 0 }
      ]

  return ['<option value="">All authorities</option>']
    .concat(
      items.map(({ name, label, count }) => `
        <option value="${sanitizeHtml(name)}" ${name === selectedAuthority ? 'selected' : ''}>
          ${sanitizeHtml(label || name)} (${count})
        </option>
      `)
    )
    .join('')
}

function renderSectorOptions(sectors = [], selectedSector) {
  return ['<option value="">All sectors</option>']
    .concat(
      sectors.map(({ name, count }) => `
        <option value="${sanitizeHtml(name)}" ${name === selectedSector ? 'selected' : ''}>
          ${sanitizeHtml(name)} (${count})
        </option>
      `)
    )
    .join('')
}

function renderActiveFilterTags(filters) {
  const tags = []
  if (filters.authority) tags.push(renderFilterTag('Authority', filters.authority, 'authority'))
  if (filters.sector) tags.push(renderFilterTag('Sector', filters.sector, 'sector'))
  if (filters.impact) tags.push(renderFilterTag('Impact', filters.impact, 'impact'))
  if (filters.search) tags.push(renderFilterTag('Search', filters.search, 'search'))
  if (filters.range) tags.push(renderFilterTag('Range', filters.range, 'range'))

  if (!tags.length) return ''

  return `
    <div class="filters-tags">
      ${tags.join('')}
    </div>
  `
}

function renderFilterTag(label, value, field) {
  return `
    <span class="filter-tag" data-filter-field="${sanitizeHtml(field)}">
      <strong>${sanitizeHtml(label)}:</strong> ${sanitizeHtml(value)}
      <button type="button" onclick="DashboardPage.removeFilter('${sanitizeHtml(field)}')">×</button>
    </span>
  `
}

function renderUpdatesList(updates = []) {
  if (!updates.length) {
    return `
      <div class="no-updates">
        <div class="no-updates-icon">Inbox</div>
        <h3>No updates found</h3>
        <p>Try adjusting your filters or search criteria.</p>
        <button onclick="DashboardPage.clearAllFilters()" class="btn btn-secondary">Clear All Filters</button>
      </div>
    `
  }

  return updates.map(update => renderUpdateCard(update)).join('')
}

function renderUpdateCard(update) {
  const impactLevel = update.impactLevel || update.impact_level || 'Informational'
  const urgency = update.urgency || 'Low'
  const publishedDate = formatDateDisplay(update.publishedDate || update.published_date || update.fetchedDate || update.createdAt)
  const summaryText = selectSummary(update) || 'No summary available'
  const details = buildDetailItems(update)
  const features = computeAIFeatures(update)
  const riskBadge = renderRiskScoreBadge(update, impactLevel)
  const contentBadge = renderContentTypeBadge(update)

  return `
    <div
      class="update-card"
      data-id="${sanitizeHtml(update.id || '')}"
      data-url="${sanitizeHtml(update.url || '')}"
      data-authority="${sanitizeHtml(update.authority || '')}"
      data-impact="${sanitizeHtml(impactLevel)}"
      data-urgency="${sanitizeHtml(urgency)}"
      data-date="${sanitizeHtml(getIsoDate(update))}"
    >
      <div class="update-header">
        <div class="update-meta-primary">
          <span class="authority-badge">${sanitizeHtml(update.authority || 'Unknown')}</span>
          <span class="date-badge">${sanitizeHtml(publishedDate)}</span>
          ${contentBadge}
        </div>
        <div class="update-meta-secondary">
          <div class="update-actions">
            <button onclick="addToDossier('${escapeForInline(update.id)}')" class="action-btn action-btn-dossier" title="Add to Dossier">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
            </button>
            <button onclick="linkToPolicy('${escapeForInline(update.id)}')" class="action-btn action-btn-policy" title="Link to Policy">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            </button>
            <button onclick="bookmarkUpdate('${escapeForInline(update.id)}')" class="action-btn action-btn-bookmark" title="Bookmark" aria-pressed="false">☆</button>
            <button onclick="shareUpdate('${escapeForInline(update.id)}')" class="action-btn" title="Share">Link</button>
            <button onclick="viewDetails('${escapeForInline(update.id)}')" class="action-btn" title="Details">View</button>
          </div>
        </div>
      </div>

      <h3 class="update-headline">
        <a href="${sanitizeHtml(update.url || '#')}" target="_blank" rel="noopener">
          ${sanitizeHtml(update.headline || 'Untitled update')}
        </a>
      </h3>

      <div class="update-summary">
        ${update.ai_summary && update.ai_summary.trim() && !isFallbackSummary(update.ai_summary) ? '<span class="ai-badge">🤖 AI Analysis:</span> ' : ''}${sanitizeHtml(summaryText)}
      </div>

      ${details}

      <div class="update-footer">
        <div class="sector-tags">${renderSectorTags(update)}</div>
        <div class="ai-features">${features}</div>
      </div>
    </div>
  `
}

function renderContentTypeBadge(update) {
  const rawType = update.content_type || update.contentType || 'OTHER'
  const normalized = String(rawType || 'OTHER').trim().toUpperCase() || 'OTHER'
  const badgeClass = normalized.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  const badgeText = normalized === 'OTHER' ? 'INFO' : normalized
  return `<span class="content-type-badge ${sanitizeHtml(badgeClass)}">${sanitizeHtml(badgeText)}</span>`
}

function getRiskScoreInfo(update, level = 'Informational') {
  const baseline = level || 'Informational'
  const normalizedLevel = baseline.toLowerCase()
  const rawScore = update.business_impact_score ?? update.businessImpactScore
  const numericScore = Number(rawScore)
  const hasScore = Number.isFinite(numericScore)
  const clampedScore = hasScore ? Math.min(10, Math.max(0, numericScore)) : null

  let variant
  if (clampedScore != null) {
    if (clampedScore >= 8) {
      variant = 'risk-critical'
    } else if (clampedScore >= 5) {
      variant = 'risk-elevated'
    } else {
      variant = 'risk-low'
    }
  } else if (normalizedLevel.includes('significant') || normalizedLevel.includes('high')) {
    variant = 'risk-critical'
  } else if (normalizedLevel.includes('moderate') || normalizedLevel.includes('medium')) {
    variant = 'risk-elevated'
  } else {
    variant = 'risk-low'
  }

  let displayScore = null
  if (clampedScore != null) {
    const rounded = Math.round(clampedScore * 10) / 10
    displayScore = rounded.toFixed(1).replace(/\.0$/, '')
  }

  return {
    score: displayScore,
    label: baseline,
    variant
  }
}

function renderRiskScoreBadge(update, level = 'Informational') {
  const { score, label, variant } = getRiskScoreInfo(update, level)
  const labelHtml = label ? `<span class="risk-score-label">${sanitizeHtml(label)}</span>` : ''

  if (score != null) {
    return `<div class="risk-score-badge ${sanitizeHtml(variant)}"><span class="risk-score-value">${sanitizeHtml(score)}</span>${labelHtml}</div>`
  }

  return `<div class="risk-score-badge ${sanitizeHtml(variant)}"><span class="risk-score-label">${sanitizeHtml(label)}</span></div>`
}

function renderSectorTags(update) {
  const sectors = Array.isArray(update.primarySectors)
    ? update.primarySectors
    : Array.isArray(update.firm_types_affected)
      ? update.firm_types_affected
      : update.sector
        ? [update.sector]
        : []

  return sectors.slice(0, 3).map(sector => {
    const value = String(sector ?? '').trim()
    const label = sanitizeHtml(value)
    return `<span class="sector-tag" data-sector="${label}">${label}</span>`
  }).join('')
}

function getIsoDate(update) {
  const value = update.publishedDate || update.published_date || update.fetchedDate || update.createdAt
  const parsed = value ? new Date(value) : null
  return parsed && !Number.isNaN(parsed) ? parsed.toISOString() : ''
}

function buildDetailItems(update) {
  const impactLevel = update.impactLevel || update.impact_level || 'Informational'
  const { score, label, variant } = getRiskScoreInfo(update, impactLevel)

  const impactScoreHtml = score != null
    ? `<span class="score-indicator ${sanitizeHtml(variant)}">${sanitizeHtml(score)}/10</span> <span class="score-label">${sanitizeHtml(label)}</span>`
    : sanitizeHtml(label)

  const fields = [
    { label: 'Regulatory Area', value: sanitizeHtml(update.area || 'General') },
    {
      label: 'Impact Score',
      value: impactScoreHtml,
      isHtml: true
    },
    update.urgency && {
      label: 'Urgency',
      value: sanitizeHtml(update.urgency)
    },
    update.keyDates && {
      label: 'Key Dates',
      value: sanitizeHtml(update.keyDates)
    },
    update.compliance_deadline && {
      label: 'Compliance Deadline',
      value: sanitizeHtml(formatDateDisplay(update.compliance_deadline || update.complianceDeadline))
    },
    update.complianceActions && {
      label: 'Required Actions',
      value: sanitizeHtml(update.complianceActions)
    }
  ].filter(Boolean)

  if (!fields.length) return ''

  const items = fields.map(field => `
    <div class="detail-item">
      <div class="detail-label">${field.label}</div>
      <div class="detail-value">${field.value}</div>
    </div>
  `).join('')

  return `
    <div class="update-details">
      ${items}
    </div>
  `
}

function escapeForInline(value) {
  const raw = value == null ? '' : String(value)
  return raw
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
}

function renderProfileModal() {
  return `
    <div id="profile-modal" class="modal-overlay" style="display: none;">
      <div class="modal-container">
        <div class="modal-header">
          <h2>Manage Business Line Profiles</h2>
          <button type="button" class="modal-close" onclick="closeProfileModal()">&times;</button>
        </div>
        <div class="modal-body">
          <div id="profile-list" class="profile-list">
            <div class="loading">Loading profiles...</div>
          </div>
          <div class="profile-form" id="profile-form" style="display: none;">
            <h3 id="profile-form-title">Create New Profile</h3>
            <input type="hidden" id="profile-id" value="">
            <div class="form-group">
              <label for="profile-name">Profile Name</label>
              <input type="text" id="profile-name" placeholder="e.g., Retail Banking" required>
            </div>
            <div class="form-group">
              <label for="profile-description">Description</label>
              <textarea id="profile-description" placeholder="Describe this business line..."></textarea>
            </div>
            <div class="form-group">
              <label for="profile-color">Color</label>
              <input type="color" id="profile-color" value="#3b82f6">
            </div>
            <div class="form-group">
              <label for="profile-sectors">Sectors (comma-separated)</label>
              <input type="text" id="profile-sectors" placeholder="Banking, Insurance, Payments">
            </div>
            <div class="form-group">
              <label for="profile-regulators">Regulators (comma-separated)</label>
              <input type="text" id="profile-regulators" placeholder="FCA, PRA, Bank of England">
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" id="profile-default"> Set as default profile
              </label>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" onclick="cancelProfileForm()">Cancel</button>
              <button type="button" class="btn btn-primary" onclick="saveProfile()">Save Profile</button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-primary" onclick="showProfileForm()">+ Add New Profile</button>
        </div>
      </div>
    </div>
  `
}

module.exports = {
  renderFilters,
  renderProfileModal,
  renderProfileSelector,
  renderStatCard,
  renderStatsGrid,
  renderUpdateCard,
  renderUpdatesList
}
