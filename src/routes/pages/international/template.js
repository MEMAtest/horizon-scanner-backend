const { getCommonStyles } = require('../../templates/commonStyles')
const { getClientScripts } = require('../../templates/clientScripts')
const { getInternationalStyles } = require('./styles')
const { getInternationalIcon, wrapIconInContainer, getCanaryAnimationStyles } = require('../../../views/icons')
const { isFallbackSummary, selectSummary, stripHtml } = require('../../../utils/summaryUtils')

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
  // International
  International: '\u{1F30D}'
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

function truncateSummary(text, maxLength = 280) {
  if (!text) return ''
  const cleaned = stripHtml(text)
  if (cleaned.length <= maxLength) return cleaned
  const truncated = cleaned.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  if (lastSpace > maxLength * 0.7) {
    return truncated.substring(0, lastSpace).trim() + '...'
  }
  return truncated.trim() + '...'
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
    <div class="update-card" data-id="${escapeHtml(update.id || '')}" data-country="${escapeHtml(country)}" data-authority="${escapeHtml(update.authority || '')}" data-impact="${escapeHtml(impactLevel)}">
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
        ${hasAiSummary ? '<span class="ai-badge">AI Analysis:</span> ' : ''}${escapeHtml(truncateSummary(summaryText))}
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
  const regions = ['Europe', 'Americas', 'Asia-Pacific', 'International']
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
        <button type="button" class="quick-filter-btn ${!currentFilters.region ? 'active' : ''}" onclick="InternationalPage.filterByRegion('')">All Regions</button>
        ${regions.map(r => `
          <button type="button" class="quick-filter-btn ${currentFilters.region === r ? 'active' : ''}" onclick="InternationalPage.filterByRegion('${escapeHtml(r)}')">${escapeHtml(r)}</button>
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
  currentFilters
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

          ${renderFilters({ currentFilters: currentFilters || {}, filterOptions: filterOptions || {} })}

          <section class="jurisdictions-section">
            <h2 class="section-title">
              ${region ? `${COUNTRY_FLAGS[region] || '\u{1F30D}'} ${region} Jurisdictions` : '\u{1F30D} Jurisdictions by Region'}
            </h2>
            <div class="country-grid">
              ${regionCountries.length > 0
    ? regionCountries.map(([c, data]) => renderCountryCard(c, data)).join('')
    : '<div class="no-updates"><p>No updates from this region yet.</p></div>'
              }
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

      ${getClientScripts()}
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
      </script>
    </body>
    </html>
  `
}

module.exports = { renderInternationalPage }
