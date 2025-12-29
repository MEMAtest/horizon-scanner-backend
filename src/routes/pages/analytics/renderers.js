const { laneDefinitions } = require('./constants')
const { escapeHtml, formatList } = require('./utils')

const renderSummaryTiles = tiles => tiles.map(tile => `
        <div class="summary-card">
          <div class="summary-value">${escapeHtml(tile.value)}</div>
          <div class="summary-label">${escapeHtml(tile.label)}</div>
          ${tile.helper ? `<p class="summary-helper">${escapeHtml(tile.helper)}</p>` : ''}
        </div>
  `).join('')

const renderFilterForm = filters => `
      <form class="control-form" id="insightFilters">
        <label class="control-field">
          <span>Authority</span>
          <select name="authority">
            <option value="">All authorities</option>
            ${filters.authorities.map(option => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`).join('')}
          </select>
        </label>
        <label class="control-field">
          <span>Sector</span>
          <select name="sector">
            <option value="">All sectors</option>
            ${filters.sectors.map(option => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`).join('')}
          </select>
        </label>
        <label class="control-field">
          <span>Confidence</span>
          <select name="confidence">
            <option value="">All levels</option>
            ${filters.confidence.map(option => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`).join('')}
          </select>
        </label>
        <button type="reset" class="btn btn-reset">Reset</button>
      </form>
`

const renderInsightCard = prediction => {
  const authorities = prediction.context?.authorities || prediction.authorities || []
  const sectors = prediction.affected_sectors || prediction.context?.sectors || []
  const actions = (prediction.recommended_actions || []).slice(0, 2)
  const confidenceText = typeof prediction.confidence === 'number'
    ? `${Math.round(prediction.confidence)}% confidence`
    : 'Confidence unavailable'

  return `
        <article class="insight-card" data-prediction="${escapeHtml(prediction.id)}" data-lane="${escapeHtml(prediction.priority_lane)}" data-authorities="${escapeHtml((authorities || []).join('|'))}" data-sectors="${escapeHtml((sectors || []).join('|'))}" data-confidence="${escapeHtml(prediction.confidence_bucket || '')}">
          <header class="card-header">
            <div class="meta-row">
              <span class="meta-chip urgency-${escapeHtml(prediction.urgency || 'MEDIUM')}">${escapeHtml(prediction.urgency || 'Medium')} priority</span>
              <span class="meta-chip confidence">${escapeHtml(confidenceText)}</span>
              <span class="meta-chip window">${escapeHtml(prediction.timeframe || 'Timeline pending')}</span>
            </div>
            <h3>${escapeHtml(prediction.prediction_title)}</h3>
          </header>
          <div class="card-flags" data-flag-container></div>
          <p class="insight-why">${escapeHtml(prediction.why_this_matters || 'Intelligence summary pending additional evidence.')}</p>
          <dl class="insight-meta">
            <div class="meta-pair">
              <dt>Authorities</dt>
              <dd>${escapeHtml(formatList(authorities))}</dd>
            </div>
            <div class="meta-pair">
              <dt>Sectors</dt>
              <dd>${escapeHtml(formatList(sectors))}</dd>
            </div>
            <div class="meta-pair">
              <dt>Confidence bucket</dt>
              <dd>${escapeHtml(prediction.confidence_bucket || 'WATCHING')}</dd>
            </div>
          </dl>
          <div class="insight-actions">
            <h4>Next moves</h4>
            <ul class="insight-action-list">
              ${actions.length ? actions.map(item => `<li>${escapeHtml(item)}</li>`).join('') : '<li>No recommended actions provided yet.</li>'}
            </ul>
          </div>
          <footer class="card-footer">
            <button type="button" class="btn btn-primary" data-action="view-details" data-prediction="${escapeHtml(prediction.id)}">View details</button>
            <button type="button" class="btn btn-secondary" data-action="acknowledge" data-prediction="${escapeHtml(prediction.id)}">Acknowledge</button>
            <button type="button" class="btn btn-tertiary" data-action="delegate" data-prediction="${escapeHtml(prediction.id)}">Delegate</button>
          </footer>
        </article>
  `
}

const renderLaneColumn = (laneKey, items) => {
  const lane = laneDefinitions[laneKey]
  const cards = items.length
    ? items.map(renderInsightCard).join('')
    : `<div class="empty-state">
          <h4>No insights yet</h4>
          <p>We will surface new intelligence the moment qualifying evidence lands.</p>
        </div>`

  return `
    <section class="lane-column" data-lane="${lane.key}">
      <header>
        <h2>${escapeHtml(lane.title)}</h2>
        <p class="lane-description">${escapeHtml(lane.description)}</p>
      </header>
      <div class="lane-cards">
        ${cards}
      </div>
    </section>
  `
}

const renderHotspotList = hotspots => {
  if (!hotspots.length) {
    return '<li class="list-item muted">No hotspots detected right now.</li>'
  }

  return hotspots.map(item => {
    const severity = (item.severity || 'medium').toLowerCase()
    const label = escapeHtml(item.sector || item.name || 'Unknown')
    const change = typeof item.changePercent === 'number'
      ? `${item.changePercent}% change`
      : ''
    return `<li class="list-item severity-${escapeHtml(severity)}">
              <span class="item-label">${label}</span>
              <span class="item-meta">${change}</span>
            </li>`
  }).join('')
}

const renderAuthorityList = authorities => {
  if (!authorities.length) {
    return '<li class="list-item muted">No significant authority momentum.</li>'
  }

  return authorities.map(item => {
    const authority = escapeHtml(item.authority)
    const change = typeof item.changePercent === 'number'
      ? `${item.changePercent}%`
      : 'N/A'
    const recent = typeof item.recent === 'number'
      ? `${item.recent} updates`
      : 'N/A'
    return `<li class="list-item">
              <span class="item-label">${authority}</span>
              <span class="item-meta">${change} - ${recent}</span>
            </li>`
  }).join('')
}

const renderAlertsList = alerts => {
  if (!alerts.length) {
    return '<li class="list-item muted">No coordination or emergence alerts at this time.</li>'
  }

  return alerts.map(alert => {
    const severity = escapeHtml(alert.severity || 'medium')
    const message = escapeHtml(alert.message)
    const type = escapeHtml(alert.type || '')
    return `<li class="list-item severity-${severity}">
              <span class="item-label">${message}</span>
              <span class="item-meta">${type}</span>
            </li>`
  }).join('')
}

const renderSecondarySections = (momentum, hotspots, alerts) => `
      <section class="secondary-section">
        <h2>Hotspots & Momentum</h2>
        <div class="secondary-grid">
          <article class="secondary-card">
            <header>
              <h3>Sector hotspots</h3>
            </header>
            <ul class="list-grid">
              ${renderHotspotList(hotspots)}
            </ul>
          </article>
          <article class="secondary-card">
            <header>
              <h3>Authority velocity</h3>
            </header>
            <ul class="list-grid">
              ${renderAuthorityList(momentum.authorities || [])}
            </ul>
          </article>
          <article class="secondary-card">
            <header>
              <h3>Pattern alerts</h3>
            </header>
            <ul class="list-grid">
              ${renderAlertsList(alerts)}
            </ul>
          </article>
        </div>
      </section>
`

module.exports = {
  renderSummaryTiles,
  renderFilterForm,
  renderInsightCard,
  renderLaneColumn,
  renderHotspotList,
  renderAuthorityList,
  renderAlertsList,
  renderSecondarySections
}
