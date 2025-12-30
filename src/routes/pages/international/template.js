const { getCommonStyles } = require('../../templates/commonStyles')
const { getClientScripts } = require('../../templates/clientScripts')
const { getInternationalStyles } = require('./styles')

const COUNTRY_FLAGS = {
  US: '\u{1F1FA}\u{1F1F8}',
  France: '\u{1F1EB}\u{1F1F7}',
  Germany: '\u{1F1E9}\u{1F1EA}',
  Ireland: '\u{1F1EE}\u{1F1EA}',
  Netherlands: '\u{1F1F3}\u{1F1F1}',
  Spain: '\u{1F1EA}\u{1F1F8}',
  Italy: '\u{1F1EE}\u{1F1F9}',
  Sweden: '\u{1F1F8}\u{1F1EA}',
  EU: '\u{1F1EA}\u{1F1FA}',
  Singapore: '\u{1F1F8}\u{1F1EC}',
  'Hong Kong': '\u{1F1ED}\u{1F1F0}',
  Australia: '\u{1F1E6}\u{1F1FA}',
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

function truncateSummary(text, maxLength = 200) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

function renderUpdateItem(update) {
  const impactLevel = update.impact_level || update.impactLevel || 'Informational'
  const impactClass = impactLevel === 'Significant' ? 'high' : impactLevel === 'Moderate' ? 'medium' : 'low'
  const country = update.country || 'International'
  const flag = COUNTRY_FLAGS[country] || '\u{1F30D}'

  return `
    <div class="update-item">
      <div class="update-meta">
        <span class="update-authority">${escapeHtml(update.authority)}</span>
        <span class="update-country">${flag} ${escapeHtml(country)}</span>
        <span class="update-date">${formatDate(update.published_date || update.publishedDate)}</span>
        <span class="impact-badge ${impactClass}">${impactLevel}</span>
      </div>
      <div class="update-title">
        <a href="${escapeHtml(update.url)}" target="_blank" rel="noopener noreferrer">
          ${escapeHtml(update.headline || update.title)}
        </a>
      </div>
      <div class="update-summary">
        ${escapeHtml(truncateSummary(update.ai_summary || update.summary))}
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

function renderInternationalPage({
  sidebar,
  region,
  stats,
  countryStats,
  updates
}) {
  const regions = ['Europe', 'Americas', 'Asia-Pacific', 'International']
  const regionCountries = Object.entries(countryStats)
    .filter(([country, data]) => !region || data.region === region)
    .sort((a, b) => b[1].total - a[1].total)

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>International Intelligence - Regulatory Intelligence Platform</title>
      ${getCommonStyles()}
      ${getInternationalStyles()}
    </head>
    <body>
      <div class="app-container">
        ${sidebar}

        <main class="main-content">
          <header class="international-header">
            <a href="/" class="back-link">&larr; Back to Home</a>
            <h1>
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.8">
                <circle cx="12" cy="12" r="10"/>
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              International Regulatory Intelligence
              <span class="new-badge">NEW</span>
            </h1>
            <p>Monitor regulatory developments across global jurisdictions</p>
          </header>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">${stats.total || 0}</div>
              <div class="stat-label">International Updates</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.thisWeek || 0}</div>
              <div class="stat-label">This Week</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.highImpact || 0}</div>
              <div class="stat-label">High Impact</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.countries || 0}</div>
              <div class="stat-label">Jurisdictions</div>
            </div>
          </div>

          <div class="region-tabs">
            <a href="/international" class="region-tab ${!region ? 'active' : ''}">All Regions</a>
            ${regions.map(r => `
              <a href="/international?region=${encodeURIComponent(r)}" class="region-tab ${region === r ? 'active' : ''}">${r}</a>
            `).join('')}
          </div>

          <h2 class="section-title">
            ${region ? `${COUNTRY_FLAGS[region] || '\u{1F30D}'} ${region} Jurisdictions` : '\u{1F30D} All Jurisdictions'}
          </h2>

          <div class="country-grid">
            ${regionCountries.length > 0
    ? regionCountries.map(([country, data]) => renderCountryCard(country, data)).join('')
    : '<div class="no-updates"><p>No updates from this region yet. Run a scrape to populate international data.</p></div>'
            }
          </div>

          <div class="updates-section">
            <h2 class="section-title">
              Recent Updates ${region ? `from ${region}` : '(All Regions)'}
            </h2>
            <div class="update-list">
              ${updates.length > 0
    ? updates.map(u => renderUpdateItem(u)).join('')
    : `
                  <div class="no-updates">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M12 2v20M2 12h20"/>
                      <circle cx="12" cy="12" r="10"/>
                    </svg>
                    <p>No international updates found yet.</p>
                    <p style="font-size: 0.875rem;">Run a scrape to populate data from international sources.</p>
                  </div>
                `
              }
            </div>
          </div>
        </main>
      </div>

      ${getClientScripts()}
      <script>
        function filterByCountry(country) {
          window.location.href = '/international?country=' + encodeURIComponent(country);
        }
      </script>
    </body>
    </html>
  `
}

module.exports = { renderInternationalPage }
