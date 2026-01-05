const { getCommonStyles } = require('../../templates/commonStyles')
const { getClientScripts } = require('../../templates/clientScripts')
const { getInternationalStyles } = require('./styles')
const { getInternationalIcon, wrapIconInContainer, getCanaryAnimationStyles } = require('../../../views/icons')
const { isFallbackSummary, selectSummary } = require('../../../utils/summaryUtils')

const COUNTRY_FLAGS = {
  // Americas
  US: '\u{1F1FA}\u{1F1F8}',
  Brazil: '\u{1F1E7}\u{1F1F7}',
  Mexico: '\u{1F1F2}\u{1F1FD}',
  // Europe
  France: '\u{1F1EB}\u{1F1F7}',
  Germany: '\u{1F1E9}\u{1F1EA}',
  Ireland: '\u{1F1EE}\u{1F1EA}',
  Netherlands: '\u{1F1F3}\u{1F1F1}',
  Spain: '\u{1F1EA}\u{1F1F8}',
  Italy: '\u{1F1EE}\u{1F1F9}',
  Sweden: '\u{1F1F8}\u{1F1EA}',
  Switzerland: '\u{1F1E8}\u{1F1ED}',
  EU: '\u{1F1EA}\u{1F1FA}',
  // Asia-Pacific
  Singapore: '\u{1F1F8}\u{1F1EC}',
  'Hong Kong': '\u{1F1ED}\u{1F1F0}',
  Australia: '\u{1F1E6}\u{1F1FA}',
  Japan: '\u{1F1EF}\u{1F1F5}',
  China: '\u{1F1E8}\u{1F1F3}',
  India: '\u{1F1EE}\u{1F1F3}',
  // Middle East
  UAE: '\u{1F1E6}\u{1F1EA}',
  'Saudi Arabia': '\u{1F1F8}\u{1F1E6}',
  Qatar: '\u{1F1F6}\u{1F1E6}',
  // Africa
  'South Africa': '\u{1F1FF}\u{1F1E6}',
  Nigeria: '\u{1F1F3}\u{1F1EC}',
  Egypt: '\u{1F1EA}\u{1F1EC}',
  Africa: '\u{1F30D}',
  // International
  International: '\u{1F30D}'
}

const REGION_ICON_SVGS = {
  all: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/></svg>',
  Europe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 20h16"/><path d="M6 20V9l6-4 6 4v11"/><path d="M9 20v-6h6v6"/></svg>',
  Americas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M10 14l2-6 2 6-2-1-2 1z"/></svg>',
  'Asia-Pacific': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M3 19c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/></svg>',
  Africa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="3"/><path d="M12 3v2M12 19v2M4.5 4.5l1.5 1.5M18 18l1.5 1.5M3 12h2M19 12h2M4.5 19.5l1.5-1.5M18 6l1.5-1.5"/></svg>',
  International: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg>'
}

function escapeHtml(text) {
  if (!text) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}


function formatDate(dateValue) {
  if (!dateValue) return 'Unknown'
  const date = new Date(dateValue)
  if (isNaN(date)) return 'Unknown'
  const now = new Date()
  const diffDays = Math.ceil((now - date) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays <= 7) return `${diffDays} days ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getRiskScoreInfo(update, level = 'Informational') {
  const rawScore = update.business_impact_score ?? update.businessImpactScore
  const numericScore = Number(rawScore)
  const hasScore = Number.isFinite(numericScore)
  const clampedScore = hasScore ? Math.min(10, Math.max(0, numericScore)) : null

  let variant
  if (clampedScore != null) {
    if (clampedScore >= 8) variant = 'risk-critical'
    else if (clampedScore >= 5) variant = 'risk-elevated'
    else variant = 'risk-low'
  } else {
    const normalizedLevel = (level || 'Informational').toLowerCase()
    if (normalizedLevel.includes('significant') || normalizedLevel.includes('high')) variant = 'risk-critical'
    else if (normalizedLevel.includes('moderate') || normalizedLevel.includes('medium')) variant = 'risk-elevated'
    else variant = 'risk-low'
  }

  let displayScore = null
  if (clampedScore != null) {
    const rounded = Math.round(clampedScore * 10) / 10
    displayScore = rounded.toFixed(1).replace(/\.0$/, '')
  }

  return { score: displayScore, label: level, variant }
}

function renderContentTypeBadge(update) {
  const rawType = update.content_type || update.contentType || 'OTHER'
  const normalized = String(rawType || 'OTHER').trim().toUpperCase() || 'OTHER'
  const badgeClass = normalized.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  const badgeText = normalized === 'OTHER' ? 'INFO' : normalized
  return `<span class="content-type-badge ${escapeHtml(badgeClass)}">${escapeHtml(badgeText)}</span>`
}

function renderRiskScoreBadge(update, level = 'Informational') {
  const { score, label, variant } = getRiskScoreInfo(update, level)
  if (score != null) {
    return `<div class="risk-score-badge ${escapeHtml(variant)}"><span class="risk-score-value">${escapeHtml(score)}</span><span class="risk-score-label">${escapeHtml(label)}</span></div>`
  }
  return `<div class="risk-score-badge ${escapeHtml(variant)}"><span class="risk-score-label">${escapeHtml(label)}</span></div>`
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
    return `<span class="sector-tag">${escapeHtml(value)}</span>`
  }).join('')
}

function computeAIFeatures(update) {
  const features = []
  if (update.business_impact_score && update.business_impact_score >= 7) {
    features.push(`<span class="ai-feature high-impact">High Impact (${update.business_impact_score}/10)</span>`)
  }
  if (update.urgency === 'High') {
    features.push('<span class="ai-feature urgent">Urgent</span>')
  }
  if (update.ai_confidence_score && update.ai_confidence_score >= 0.9) {
    features.push(`<span class="ai-feature high-confidence">AI Confidence ${Math.round(update.ai_confidence_score * 100)}%</span>`)
  }
  return features.join('')
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

function buildDetailItems(update) {
  const impactLevel = update.impact_level || update.impactLevel || 'Informational'
  const { score, label, variant } = getRiskScoreInfo(update, impactLevel)

  const impactScoreHtml = score != null
    ? `<span class="score-indicator ${escapeHtml(variant)}">${escapeHtml(score)}/10</span>`
    : escapeHtml(label)

  const fields = [
    { label: 'Regulatory Area', value: escapeHtml(update.area || update.sector || 'General Regulation') },
    { label: 'Impact Score', value: impactScoreHtml, isHtml: true },
    { label: 'Urgency', value: escapeHtml(update.urgency || 'Low') }
  ]

  const items = fields.map(field => `
    <div class="detail-item">
      <div class="detail-label">${field.label}</div>
      <div class="detail-value">${field.value}</div>
    </div>
  `).join('')

  return `<div class="update-details">${items}</div>`
}

function renderUpdateItem(update) {
  const impactLevel = update.impact_level || update.impactLevel || 'Informational'
  const country = update.country || 'International'
  const flag = COUNTRY_FLAGS[country] || '\u{1F30D}'
  const publishedDate = formatDate(update.published_date || update.publishedDate || update.fetchedDate)
  const summaryText = selectSummary(update) || 'No summary available'
  const hasAiSummary = update.ai_summary && !isFallbackSummary(update.ai_summary, update.headline)
  const updateId = escapeForInline(update.id || '')

  return `
    <div class="update-card" data-id="${escapeHtml(update.id || '')}" data-url="${escapeHtml(update.url || '')}" data-country="${escapeHtml(country)}" data-authority="${escapeHtml(update.authority || '')}" data-impact="${escapeHtml(impactLevel)}" data-urgency="${escapeHtml(update.urgency || '')}" data-date="${escapeHtml(update.published_date || update.publishedDate || '')}">
      <div class="update-header">
        <div class="update-meta-primary">
          <span class="authority-badge">${escapeHtml(update.authority || 'Unknown')}</span>
          <span class="date-badge">${escapeHtml(publishedDate)}</span>
          ${renderContentTypeBadge(update)}
        </div>
        <div class="update-meta-secondary">
          ${renderRiskScoreBadge(update, impactLevel)}
          <div class="update-actions">
            <button onclick="bookmarkUpdate('${updateId}')" class="action-btn action-btn-bookmark" title="Bookmark" aria-pressed="false">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            </button>
            <button onclick="shareUpdate('${updateId}')" class="action-btn" title="Share">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"></path>
                <polyline points="16 6 12 2 8 6"></polyline>
                <line x1="12" y1="2" x2="12" y2="15"></line>
              </svg>
            </button>
            <button onclick="viewDetails('${updateId}')" class="action-btn" title="Details">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <h3 class="update-headline">
        <a href="${escapeHtml(update.url || '#')}" target="_blank" rel="noopener noreferrer">
          ${escapeHtml(update.headline || update.title || 'Untitled update')}
        </a>
      </h3>

      <div class="update-summary">
        ${hasAiSummary ? '<span class="ai-badge">AI Analysis:</span> ' : ''}${escapeHtml(summaryText)}
      </div>

      ${buildDetailItems(update)}

      <div class="update-footer">
        <div class="sector-tags">${renderSectorTags(update)}</div>
      </div>
    </div>
  `
}

function renderCountryCard(country, data) {
  const flag = COUNTRY_FLAGS[country] || '\u{1F30D}'
  const authorities = data.authorities || []

  return `
    <div class="country-card" onclick="filterByCountry('${escapeHtml(country)}')">
      <div class="country-header">
        <span class="country-flag">${flag}</span>
        <span class="country-name">${escapeHtml(country)}</span>
        <span style="margin-left: auto; font-weight: 600; color: var(--accent-color);">${data.total}</span>
      </div>
      <div class="country-authorities">
        ${authorities.slice(0, 4).map(auth => `
          <span class="authority-tag">${escapeHtml(auth)}</span>
        `).join('')}
        ${authorities.length > 4 ? `<span class="authority-tag">+${authorities.length - 4} more</span>` : ''}
      </div>
    </div>
  `
}

function renderFilters({ currentFilters, filterOptions }) {
  const regionButtons = [
    { value: '', label: 'All Regions', icon: 'all' },
    { value: 'Europe', label: 'Europe', icon: 'Europe' },
    { value: 'Americas', label: 'Americas', icon: 'Americas' },
    { value: 'Asia-Pacific', label: 'Asia-Pacific', icon: 'Asia-Pacific' },
    { value: 'Africa', label: 'Africa', icon: 'Africa' },
    { value: 'International', label: 'International', icon: 'International' }
  ]
  const countries = filterOptions.countries || []
  const authorities = filterOptions.authorities || []
  const impactLevels = [
    { value: '', label: 'All impact levels' },
    { value: 'Significant', label: 'Significant' },
    { value: 'Moderate', label: 'Moderate' },
    { value: 'Informational', label: 'Informational' }
  ]
  const dateRanges = [
    { value: '', label: 'Any time' },
    { value: 'today', label: 'Today' },
    { value: '3d', label: 'Last 3 days' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' }
  ]

  return `
    <section class="filters-container">
      <div class="quick-filters" role="group" aria-label="Region filters">
        ${regionButtons.map(button => `
          <button type="button" class="quick-filter-btn ${button.value ? (currentFilters.region === button.value ? 'active' : '') : (!currentFilters.region ? 'active' : '')}" onclick="InternationalPage.filterByRegion('${escapeHtml(button.value)}')" aria-pressed="${button.value ? (currentFilters.region === button.value ? 'true' : 'false') : (!currentFilters.region ? 'true' : 'false')}">
            <span class="region-icon">${REGION_ICON_SVGS[button.icon] || ''}</span>
            <span>${escapeHtml(button.label)}</span>
          </button>
        `).join('')}
      </div>
      <form class="filters-grid" method="get" action="/international">
        <div class="filter-group">
          <label class="filter-label" for="country">Country</label>
          <select id="country" class="filter-select" name="country">
            <option value="">All countries</option>
            ${countries.map(c => `
              <option value="${escapeHtml(c.name)}" ${currentFilters.country === c.name ? 'selected' : ''}>${escapeHtml(c.name)} (${c.count})</option>
            `).join('')}
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label" for="authority">Authority</label>
          <select id="authority" class="filter-select" name="authority">
            <option value="">All authorities</option>
            ${authorities.map(a => `
              <option value="${escapeHtml(a.name)}" ${currentFilters.authority === a.name ? 'selected' : ''}>${escapeHtml(a.label || a.name)} (${a.count})</option>
            `).join('')}
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label" for="impact">Impact Level</label>
          <select id="impact" class="filter-select" name="impact">
            ${impactLevels.map(level => `
              <option value="${escapeHtml(level.value)}" ${currentFilters.impact === level.value ? 'selected' : ''}>${escapeHtml(level.label)}</option>
            `).join('')}
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label" for="search">Keyword search</label>
          <input id="search" class="filter-input" type="search" name="search" placeholder="Search updates..." value="${escapeHtml(currentFilters.search || '')}">
        </div>
        <div class="filter-group">
          <label class="filter-label" for="range">Date range</label>
          <select id="range" class="filter-select" name="range">
            ${dateRanges.map(r => `
              <option value="${escapeHtml(r.value)}" ${currentFilters.range === r.value ? 'selected' : ''}>${escapeHtml(r.label)}</option>
            `).join('')}
          </select>
        </div>
        <input type="hidden" name="region" value="${escapeHtml(currentFilters.region || '')}">
        <div class="filter-actions">
          <button class="btn btn-primary" type="submit">Apply Filters</button>
          <a class="btn btn-secondary" href="/international">Reset</a>
        </div>
      </form>
    </section>
  `
}

function renderInternationalPage({
  sidebar,
  region,
  country,
  stats,
  countryStats,
  updates,
  filterOptions,
  currentFilters,
  chartData = {}
}) {
  const regionCountries = Object.entries(countryStats)
    .filter(([c, data]) => !region || data.region === region)
    .sort((a, b) => b[1].total - a[1].total)

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>International Updates - Regulatory Intelligence Platform</title>
      <link rel="icon" type="image/png" href="/favicon.png">
      ${getCommonStyles()}
      ${getInternationalStyles()}
      <style>${getCanaryAnimationStyles()}</style>
    </head>
    <body>
      <div class="app-container">
        ${sidebar}

        <main class="main-content">
          <header class="page-header">
            <div class="page-header-left">
              ${wrapIconInContainer(getInternationalIcon())}
              <div>
                <h1>International Updates</h1>
                <p class="subtitle">Monitor regulatory developments across global jurisdictions with AI-powered analysis.</p>
              </div>
            </div>
          </header>

          <section class="stats-grid">
            <article class="stat-card">
              <span class="stat-number">${stats.total || 0}</span>
              <span class="stat-label">Total Updates</span>
            </article>
            <article class="stat-card">
              <span class="stat-number">${stats.thisWeek || 0}</span>
              <span class="stat-label">This Week</span>
            </article>
            <article class="stat-card">
              <span class="stat-number">${stats.highImpact || 0}</span>
              <span class="stat-label">High Impact</span>
            </article>
            <article class="stat-card">
              <span class="stat-number">${stats.countries || 0}</span>
              <span class="stat-label">Jurisdictions</span>
            </article>
          </section>

          <section class="charts-section">
            <div class="charts-grid-2x2">
              <div class="chart-card">
                <h3 class="chart-title">Updates by Region</h3>
                <div class="chart-container">
                  <canvas id="regionChart"></canvas>
                </div>
              </div>
              <div class="chart-card">
                <h3 class="chart-title">Top 10 International Authorities by Updates</h3>
                <div class="chart-container">
                  <canvas id="authoritiesChart"></canvas>
                </div>
              </div>
              <div class="chart-card">
                <h3 class="chart-title">Topics & Categories</h3>
                <div class="chart-container">
                  <canvas id="topicsChart"></canvas>
                </div>
              </div>
              <div class="chart-card">
                <h3 class="chart-title">30-Day International Trend</h3>
                <div class="chart-container">
                  <canvas id="trendChart"></canvas>
                </div>
              </div>
            </div>
          </section>

          ${renderFilters({ currentFilters: currentFilters || {}, filterOptions: filterOptions || {} })}

          <section class="jurisdictions-section">
            <button class="jurisdictions-toggle" onclick="toggleJurisdictions()" aria-expanded="false">
              <span class="toggle-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </span>
              <span class="toggle-text">${region ? `${COUNTRY_FLAGS[region] || '\u{1F30D}'} ${region} Jurisdictions` : '\u{1F30D} Jurisdictions by Region'}</span>
              <span class="toggle-count">${regionCountries.length} jurisdictions</span>
            </button>
            <div class="jurisdictions-content collapsed" id="jurisdictionsContent">
              <div class="country-grid">
              ${regionCountries.length > 0
    ? regionCountries.map(([c, data]) => renderCountryCard(c, data)).join('')
    : '<div class="no-updates"><p>No updates from this region yet.</p></div>'
              }
              </div>
            </div>
          </section>

          <section class="updates-container">
            <h2 class="section-title">
              ${country ? `Updates from ${COUNTRY_FLAGS[country] || ''} ${country}` : region ? `Updates from ${region}` : 'Recent Updates'}
              <span class="update-count">(${updates.length})</span>
            </h2>
            ${updates.length > 0
    ? updates.map(u => renderUpdateItem(u)).join('')
    : `
                <div class="no-updates">
                  <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                  <h3>No international updates found</h3>
                  <p>Try adjusting your filters or run a scrape to populate international data.</p>
                  <a href="/international" class="btn btn-secondary">Clear Filters</a>
                </div>
              `
            }
          </section>
        </main>
      </div>

      <script>
        // Initialize updates data for client-side filtering
        window.initialUpdates = ${JSON.stringify(updates.map(u => ({
          id: u.id,
          headline: u.headline || u.title,
          summary: u.summary,
          ai_summary: u.ai_summary,
          url: u.url,
          authority: u.authority,
          published_date: u.published_date || u.publishedDate,
          publishedDate: u.published_date || u.publishedDate,
          impact_level: u.impact_level || u.impactLevel,
          impactLevel: u.impact_level || u.impactLevel,
          urgency: u.urgency,
          area: u.area || u.regulatory_area || u.regulatoryArea,
          regulatory_area: u.regulatory_area || u.regulatoryArea || u.area,
          sector: u.sector,
          content_type: u.content_type || u.contentType,
          business_impact_score: u.business_impact_score,
          country: u.country,
          region: u.region,
          firm_types_affected: u.firm_types_affected,
          primarySectors: u.primarySectors || u.firm_types_affected
        })))};
        window.originalUpdates = window.initialUpdates.slice();
        window.filteredUpdates = window.initialUpdates.slice();
      </script>
      ${getClientScripts()}
      <script>
        const InternationalPage = {
          filterByRegion: function(region) {
            const url = new URL(window.location.href);
            if (region) {
              url.searchParams.set('region', region);
            } else {
              url.searchParams.delete('region');
            }
            url.searchParams.delete('country');
            window.location.href = url.toString();
          },
          filterByCountry: function(country) {
            const url = new URL(window.location.href);
            if (country) {
              url.searchParams.set('country', country);
            } else {
              url.searchParams.delete('country');
            }
            window.location.href = url.toString();
          }
        };
        function filterByCountry(country) {
          InternationalPage.filterByCountry(country);
        }
        window.InternationalPage = InternationalPage;

        // Toggle jurisdictions section
        function toggleJurisdictions() {
          const content = document.getElementById('jurisdictionsContent');
          const button = document.querySelector('.jurisdictions-toggle');
          const isExpanded = button.getAttribute('aria-expanded') === 'true';

          button.setAttribute('aria-expanded', !isExpanded);
          content.classList.toggle('collapsed');
          content.classList.toggle('expanded');
        }
      </script>

      <!-- Chart.js -->
      <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
      <script>
        // Chart data from server (escaped to prevent XSS)
        const chartData = ${JSON.stringify(chartData).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')};

        // Colors for charts
        const regionColors = {
          'Europe': '#3b82f6',
          'Americas': '#10b981',
          'Asia-Pacific': '#f59e0b',
          'Africa': '#8b5cf6',
          'International': '#6b7280',
          'Unknown': '#d1d5db'
        };

        document.addEventListener('DOMContentLoaded', function() {
          // Region Polar Area Chart
          const regionCtx = document.getElementById('regionChart');
          if (regionCtx && chartData.regionDistribution) {
            const distribution = chartData.regionDistribution;
            const labels = Object.keys(distribution);
            const values = Object.values(distribution);
            const colors = labels.map(r => regionColors[r] || '#6b7280');

            new Chart(regionCtx, {
              type: 'polarArea',
              data: {
                labels: labels,
                datasets: [{
                  data: values,
                  backgroundColor: colors.map(c => c.replace(')', ', 0.8)').replace('rgb', 'rgba').replace('#', 'rgba(').replace(/([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i, (m, r, g, b) => parseInt(r, 16) + ', ' + parseInt(g, 16) + ', ' + parseInt(b, 16))),
                  borderColor: colors,
                  borderWidth: 2
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                    labels: {
                      boxWidth: 12,
                      padding: 8,
                      font: { size: 11 },
                      usePointStyle: true,
                      pointStyle: 'circle'
                    }
                  }
                },
                scales: {
                  r: {
                    ticks: { display: false },
                    grid: { color: '#e5e7eb' }
                  }
                }
              }
            });
          }

          // Top Authorities Bar Chart
          const authCtx = document.getElementById('authoritiesChart');
          if (authCtx && chartData.topAuthorities && chartData.topAuthorities.length > 0) {
            const labels = chartData.topAuthorities.map(a => a[0]);
            const values = chartData.topAuthorities.map(a => a[1]);

            new Chart(authCtx, {
              type: 'bar',
              data: {
                labels: labels,
                datasets: [{
                  label: 'Updates',
                  data: values,
                  backgroundColor: 'rgba(59, 130, 246, 0.8)',
                  borderColor: '#3b82f6',
                  borderWidth: 1,
                  borderRadius: 4,
                  barThickness: 16
                }]
              },
              options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  x: {
                    beginAtZero: true,
                    grid: { color: '#f3f4f6' },
                    ticks: { stepSize: 10, font: { size: 10 } }
                  },
                  y: {
                    grid: { display: false },
                    ticks: {
                      font: { size: 10 },
                      callback: function(value) {
                        const label = this.getLabelForValue(value);
                        return label.length > 15 ? label.substring(0, 15) + '...' : label;
                      }
                    }
                  }
                }
              }
            });
          }

          // 30-Day Trend Line Chart
          const trendCtx = document.getElementById('trendChart');
          if (trendCtx && chartData.trendData && chartData.trendData.length > 0) {
            const labels = chartData.trendData.map(d => {
              const date = new Date(d[0]);
              return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
            });
            const values = chartData.trendData.map(d => d[1]);

            new Chart(trendCtx, {
              type: 'line',
              data: {
                labels: labels,
                datasets: [{
                  label: 'Updates',
                  data: values,
                  borderColor: '#3b82f6',
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  fill: true,
                  tension: 0.4,
                  pointRadius: 2,
                  pointBackgroundColor: '#3b82f6',
                  pointBorderColor: '#ffffff',
                  pointBorderWidth: 1,
                  pointHoverRadius: 5
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: {
                      maxTicksLimit: 7,
                      font: { size: 10 },
                      maxRotation: 0
                    }
                  },
                  y: {
                    beginAtZero: true,
                    grid: { color: '#f3f4f6' },
                    ticks: {
                      stepSize: 5,
                      font: { size: 10 }
                    }
                  }
                },
                interaction: {
                  intersect: false,
                  mode: 'index'
                }
              }
            });
          }

          // Topics/Categories Chart
          const topicsCtx = document.getElementById('topicsChart');
          if (topicsCtx && chartData.topTopics && chartData.topTopics.length > 0) {
            const labels = chartData.topTopics.map(t => t[0]);
            const values = chartData.topTopics.map(t => t[1]);

            const topicColors = [
              '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
              '#ef4444', '#06b6d4', '#ec4899', '#84cc16'
            ];

            new Chart(topicsCtx, {
              type: 'bar',
              data: {
                labels: labels,
                datasets: [{
                  label: 'Updates',
                  data: values,
                  backgroundColor: topicColors.slice(0, labels.length),
                  borderRadius: 4,
                  barThickness: 20
                }]
              },
              options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  x: {
                    beginAtZero: true,
                    grid: { color: '#f3f4f6' },
                    ticks: { font: { size: 10 } }
                  },
                  y: {
                    grid: { display: false },
                    ticks: {
                      font: { size: 10 },
                      callback: function(value) {
                        const label = this.getLabelForValue(value);
                        return label.length > 20 ? label.substring(0, 20) + '...' : label;
                      }
                    }
                  }
                }
              }
            });
          }
        });
      </script>
    </body>
    </html>
  `
}

module.exports = { renderInternationalPage }
