// src/routes/pages/analyticsPage.js

const { getCommonStyles } = require('../templates/commonStyles')
const { getSidebar } = require('../templates/sidebar')
const { getCommonClientScripts } = require('../templates/clientScripts')
const predictiveIntelligenceService = require('../../services/predictiveIntelligenceService')
const { getPredictiveIcon, wrapIconInContainer, getCanaryAnimationStyles } = require('../../views/icons')

const laneDefinitions = {
  act_now: {
    key: 'act_now',
    title: 'Act Now (<=14 days)',
    description: 'Immediate exposures where action inside two weeks prevents regulatory escalation.'
  },
  prepare_next: {
    key: 'prepare_next',
    title: 'Prepare Next (15-45 days)',
    description: 'Signals that need ownership in the next month to stay ahead of anticipated moves.'
  },
  plan_horizon: {
    key: 'plan_horizon',
    title: 'Plan Horizon (45-90 days)',
    description: 'Themes to shape the strategic roadmap and stakeholder planning window.'
  }
}

const fallbackLaneByBucket = bucket => {
  switch (bucket) {
    case 'imminent':
      return 'act_now'
    case 'near':
      return 'prepare_next'
    default:
      return 'plan_horizon'
  }
}

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const formatList = (items = []) => {
  if (!items || !items.length) return '-'
  return items.join(', ')
}

const serializeForScript = value =>
  JSON.stringify(value).replace(/</g, '\\u003c')

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

const analyticsPage = async (req, res) => {
  try {
    const predictiveData = await predictiveIntelligenceService.getPredictiveDashboard()
    const sidebarHtml = await getSidebar('analytics')

    // Generate canary icon
    const canaryStyles = getCanaryAnimationStyles()
    const pageIcon = wrapIconInContainer(getPredictiveIcon())

    const predictions = predictiveData?.predictions || { imminent: [], nearTerm: [], strategic: [] }
    const flattenPredictions = [
      ...(predictions.imminent || []),
      ...(predictions.nearTerm || []),
      ...(predictions.strategic || [])
    ].map(prediction => ({
      ...prediction,
      priority_lane: prediction.priority_lane || fallbackLaneByBucket(prediction.lane_bucket)
    }))

    const lanes = {
      act_now: [],
      prepare_next: [],
      plan_horizon: []
    }

    flattenPredictions.forEach(prediction => {
      const laneKey = laneDefinitions[prediction.priority_lane] ? prediction.priority_lane : fallbackLaneByBucket(prediction.lane_bucket)
      lanes[laneKey].push(prediction)
    })

    Object.keys(lanes).forEach(laneKey => {
      lanes[laneKey] = lanes[laneKey]
        .sort((a, b) => (b.priority_score || b.confidence || 0) - (a.priority_score || a.confidence || 0))
    })

    const uniqueAuthorities = new Set()
    const uniqueSectors = new Set()
    const uniqueBuckets = new Set()

    flattenPredictions.forEach(prediction => {
      (prediction.context?.authorities || prediction.authorities || []).forEach(authority => {
        if (authority) uniqueAuthorities.add(authority)
      })
      ;(prediction.affected_sectors || prediction.context?.sectors || []).forEach(sector => {
        if (sector) uniqueSectors.add(sector)
      })
      if (prediction.confidence_bucket) uniqueBuckets.add(prediction.confidence_bucket)
    })

    const confidenceValues = flattenPredictions.filter(pred => typeof pred.confidence === 'number').map(pred => pred.confidence)
    const averageConfidence = confidenceValues.length
      ? Math.round(confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length)
      : null

    const highRiskSectors = (predictiveData?.momentum?.sectors || []).filter(item => ['high', 'critical'].includes((item.severity || '').toLowerCase()))

    const summaryTiles = [
      { label: 'Total insights', value: flattenPredictions.length.toString() },
      { label: 'Act now (<=14d)', value: lanes.act_now.length.toString() },
      { label: 'Prepare next (15-45d)', value: lanes.prepare_next.length.toString() },
      { label: 'High-risk sectors', value: highRiskSectors.length.toString(), helper: 'Monitoring for regulatory heat' }
    ]

    if (averageConfidence !== null) {
      summaryTiles.splice(1, 0, { label: 'Average confidence', value: `${averageConfidence}%`, helper: 'Weighted across live predictions' })
    }

    const filters = {
      authorities: Array.from(uniqueAuthorities).sort(),
      sectors: Array.from(uniqueSectors).sort(),
      confidence: Array.from(uniqueBuckets).sort()
    }

    const momentum = predictiveData?.momentum || { authorities: [], topics: [], sectors: [] }
    const hotspots = (momentum.sectors || []).slice(0, 5)
    const alerts = (predictiveData?.alerts || []).slice(0, 6)

    const clientPayload = {
      generatedAt: predictiveData?.generatedAt,
      summary: summaryTiles,
      lanes,
      filters,
      momentum,
      alerts
    }

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Predictive Analytics Dashboard</title>
  ${getCommonStyles()}
  <style>
    ${canaryStyles}
    :root {
      color-scheme: light;
    }

    body.predictive-dashboard {
      margin: 0;
      font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f3f4f6;
      color: #0f172a;
      display: flex;
      min-height: 100vh;
    }

    .predictive-main {
      flex: 1;
      margin-left: 280px;
      padding: 32px 40px 48px;
      background: #f8fafc;
      box-sizing: border-box;
    }

    .predictive-header {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: 1rem;
    }

    .header-copy {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-copy-text {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .header-copy h1 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 700;
      color: #0f172a;
    }

    .header-copy .subtitle {
      margin: 4px 0 0 0;
      color: #64748b;
      font-size: 0.9rem;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .header-actions .btn {
      white-space: nowrap;
    }

    .summary-section {
      margin-top: 1.75rem;
    }

    .summary-grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    }

    .summary-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 1.25rem;
      box-shadow: 0 10px 20px -18px rgba(15, 23, 42, 0.3);
    }

    .summary-value {
      font-size: 1.65rem;
      font-weight: 700;
      color: #1d4ed8;
    }

    .summary-label {
      margin-top: 0.25rem;
      font-size: 0.95rem;
      color: #475569;
    }

    .summary-helper {
      margin: 0.6rem 0 0;
      font-size: 0.8rem;
      color: #64748b;
    }

    .control-bar {
      margin-top: 2.5rem;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 18px 30px -28px rgba(15, 23, 42, 0.35);
    }

    .control-form {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      align-items: flex-end;
    }

    .control-field {
      display: flex;
      flex-direction: column;
      min-width: 200px;
      gap: 0.4rem;
      font-size: 0.85rem;
      color: #475569;
    }

    .control-field select {
      padding: 0.55rem 0.75rem;
      border-radius: 10px;
      border: 1px solid #cbd5f5;
      background: #f8fafc;
      font-size: 0.95rem;
      color: #1f2937;
    }

    .btn {
      border-radius: 999px;
      border: 1px solid transparent;
      padding: 0.55rem 1rem;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-reset {
      margin-left: auto;
      background: #eef2ff;
      color: #4338ca;
      border-color: #c7d2fe;
    }

    .btn-reset:hover {
      background: #e0e7ff;
    }

    .lanes-grid {
      margin-top: 2.5rem;
      display: grid;
      gap: 1.5rem;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      align-items: start;
    }

    .lane-column {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      padding: 1.75rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      min-height: 320px;
      box-shadow: 0 18px 32px -30px rgba(15, 23, 42, 0.4);
    }

    .lane-column h2 {
      margin: 0;
      font-size: 1.3rem;
      color: #0f172a;
    }

    .lane-description {
      margin-top: 0.35rem;
      font-size: 0.9rem;
      color: #64748b;
    }

    .lane-cards {
      display: flex;
      flex-direction: column;
      gap: 1.1rem;
    }

    .insight-card {
      background: linear-gradient(150deg, #ffffff 0%, #f8fbff 100%);
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 1.25rem 1.25rem 1.1rem;
      display: flex;
      flex-direction: column;
      gap: 0.9rem;
      position: relative;
      transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
    }

    .insight-card.is-hidden {
      display: none;
    }

    .insight-card.is-acknowledged {
      border-color: #bfdbfe;
      background: linear-gradient(150deg, #eff6ff 0%, #ffffff 100%);
      opacity: 0.85;
    }

    .insight-card.is-delegated {
      border-color: #fde68a;
      background: linear-gradient(150deg, #fff7ed 0%, #ffffff 100%);
    }

    .insight-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 16px 30px -26px rgba(15, 23, 42, 0.45);
    }

    .card-header h3 {
      margin: 0.4rem 0 0;
      font-size: 1.05rem;
      line-height: 1.4;
      color: #111827;
    }

    .meta-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .card-flags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      min-height: 0.5rem;
    }

    .flag-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      background: #eef2ff;
      color: #3730a3;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.2rem 0.55rem;
      border-radius: 999px;
    }

    .flag-pill.flag-acknowledged {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .flag-pill.flag-delegated {
      background: #fef3c7;
      color: #9a3412;
    }

    .meta-chip {
      background: #eef2ff;
      color: #4338ca;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 999px;
      padding: 0.25rem 0.6rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .meta-chip.confidence {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .meta-chip.window {
      background: #ede9fe;
      color: #6d28d9;
    }

    .meta-chip.urgency-CRITICAL {
      background: #fee2e2;
      color: #b91c1c;
    }

    .meta-chip.urgency-HIGH {
      background: #fef3c7;
      color: #92400e;
    }

    .meta-chip.urgency-MEDIUM {
      background: #e0f2fe;
      color: #075985;
    }

    .insight-why {
      margin: 0;
      color: #4b5563;
      font-size: 0.95rem;
      line-height: 1.5;
    }

    .insight-meta {
      display: grid;
      gap: 0.35rem;
      font-size: 0.85rem;
      color: #475569;
    }

    .meta-pair {
      display: flex;
      gap: 0.5rem;
    }

    .meta-pair dt {
      font-weight: 600;
      min-width: 110px;
      color: #1f2937;
    }

    .meta-pair dd {
      margin: 0;
      flex: 1;
    }

    .insight-actions h4 {
      margin: 0 0 0.4rem;
      font-size: 0.85rem;
      color: #1d4ed8;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .insight-action-list {
      margin: 0;
      padding-left: 1.1rem;
      color: #374151;
      font-size: 0.85rem;
      line-height: 1.4;
    }

    .card-footer {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
    }

    .btn-primary {
      background: #1d4ed8;
      color: white;
    }

    .btn-primary:hover {
      background: #1e40af;
    }

    .btn-secondary {
      background: #f1f5f9;
      color: #0f172a;
      border-color: #cbd5e1;
    }

    .btn-secondary:hover {
      background: #e2e8f0;
    }

    .btn-tertiary {
      background: #fff7ed;
      color: #9a3412;
      border-color: #fed7aa;
    }

    .btn-tertiary:hover {
      background: #ffedd5;
    }

    .empty-state {
      background: #f8fafc;
      border: 1px dashed #cbd5f5;
      border-radius: 12px;
      padding: 1.25rem;
      text-align: center;
      color: #64748b;
    }

    .empty-state h4 {
      margin: 0 0 0.4rem;
      font-size: 1rem;
      color: #1f2937;
    }

    .secondary-section {
      margin-top: 3rem;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      padding: 1.75rem;
      box-shadow: 0 18px 36px -32px rgba(15, 23, 42, 0.45);
    }

    .secondary-section h2 {
      margin: 0 0 1.25rem;
      font-size: 1.35rem;
      color: #0f172a;
    }

    .secondary-grid {
      display: grid;
      gap: 1.25rem;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    }

    .secondary-card {
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      background: #f8fafc;
      padding: 1.25rem;
    }

    .secondary-card h3 {
      margin: 0 0 0.75rem;
      font-size: 1rem;
      color: #1f2937;
    }

    .list-grid {
      margin: 0;
      padding: 0;
      list-style: none;
      display: grid;
      gap: 0.65rem;
    }

    .list-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.85rem;
      padding: 0.55rem 0.6rem;
      border-radius: 10px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
    }

    .list-item .item-label {
      font-weight: 600;
      color: #0f172a;
    }

    .list-item .item-meta {
      color: #64748b;
    }

    .list-item.muted {
      justify-content: center;
      color: #94a3b8;
      font-style: italic;
    }

    .list-item.severity-critical {
      border-color: #fecaca;
      background: #fff1f2;
      color: #b91c1c;
    }

    .list-item.severity-high {
      border-color: #fed7aa;
      background: #fff7ed;
      color: #9a3412;
    }

    .insight-drawer {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 1200;
    }

    .insight-drawer.is-visible {
      pointer-events: auto;
    }

    .insight-drawer .drawer-overlay {
      position: absolute;
      inset: 0;
      background: rgba(15, 23, 42, 0.4);
      opacity: 0;
      transition: opacity 0.24s ease;
    }

    .insight-drawer.is-visible .drawer-overlay {
      opacity: 1;
    }

    .insight-drawer .drawer-panel {
      position: absolute;
      top: 0;
      right: 0;
      width: min(420px, 100%);
      height: 100%;
      background: #ffffff;
      box-shadow: -24px 0 40px -32px rgba(15, 23, 42, 0.45);
      transform: translateX(100%);
      transition: transform 0.26s ease;
      display: flex;
      flex-direction: column;
    }

    .insight-drawer.is-visible .drawer-panel {
      transform: translateX(0);
    }

    .drawer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .drawer-body {
      padding: 1.25rem 1.5rem 2rem;
      overflow-y: auto;
      flex: 1;
    }

    .drawer-placeholder {
      color: #64748b;
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .drawer-section {
      margin-bottom: 1.5rem;
    }

    .drawer-section h3 {
      margin: 0 0 0.6rem;
      font-size: 0.95rem;
      color: #1f2937;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .drawer-section ul {
      margin: 0;
      padding-left: 1.1rem;
      color: #374151;
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .drawer-section li {
      margin-bottom: 0.4rem;
    }

    .drawer-section .evidence-item {
      margin-bottom: 0.6rem;
      padding: 0.55rem 0.65rem;
      border-radius: 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
    }

    .drawer-subtext {
      display: block;
      margin-top: 0.25rem;
      color: #64748b;
      font-size: 0.8rem;
    }

    .drawer-empty {
      color: #94a3b8;
      font-size: 0.85rem;
      font-style: italic;
    }

    .drawer-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.55rem;
      border-radius: 999px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .drawer-badge.severity-critical {
      background: #fee2e2;
      color: #b91c1c;
    }

    .drawer-badge.severity-high {
      background: #fef3c7;
      color: #92400e;
    }

    .drawer-badge.severity-medium {
      background: #e0f2fe;
      color: #0369a1;
    }

    .drawer-badge.severity-low {
      background: #dcfce7;
      color: #166534;
    }

    .drawer-close {
      background: transparent;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      color: #64748b;
    }

    @media (max-width: 1280px) {
      .predictive-main {
        margin-left: 260px;
        padding: 28px 28px 40px;
      }
    }

    @media (max-width: 1024px) {
      body.predictive-dashboard {
        flex-direction: column;
      }

      .predictive-main {
        margin-left: 0;
        padding: 24px 20px 36px;
      }

      .summary-section {
        margin-top: 1.25rem;
      }

      .summary-grid {
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      }

      .lanes-grid {
        grid-template-columns: 1fr;
      }

      .control-form {
        flex-direction: column;
        align-items: stretch;
      }

      .control-field {
        min-width: 100%;
      }

      .btn-reset {
        align-self: flex-start;
        margin-left: 0;
      }
    }
  </style>
</head>
<body class="predictive-dashboard">
  ${sidebarHtml}
  <main class="predictive-main" id="predictiveMain">
    <header class="predictive-header">
      <div class="header-copy">
        ${pageIcon}
        <div class="header-copy-text">
          <h1>Predictive Analytics Dashboard</h1>
          <p class="subtitle">Prioritised regulatory intelligence and actions</p>
        </div>
      </div>
      <div class="header-actions">
        <button type="button" class="btn btn-primary" id="downloadOnePager">Download One-Pager</button>
      </div>
    </header>

    <section class="summary-section">
      <div class="summary-grid">
        ${renderSummaryTiles(summaryTiles)}
      </div>
    </section>

    <section class="control-bar">
      ${renderFilterForm(filters)}
    </section>

    <section class="lanes-grid">
      ${renderLaneColumn('act_now', lanes.act_now)}
      ${renderLaneColumn('prepare_next', lanes.prepare_next)}
      ${renderLaneColumn('plan_horizon', lanes.plan_horizon)}
    </section>

    ${renderSecondarySections(momentum, hotspots, alerts)}
  </main>

  <div class="insight-drawer" id="insightDrawer" aria-hidden="true">
    <div class="drawer-overlay" data-drawer-close="true"></div>
    <aside class="drawer-panel" role="dialog" aria-labelledby="drawerTitle">
      <header class="drawer-header">
        <h2 id="drawerTitle">Insight details</h2>
        <button class="drawer-close" data-drawer-close="true" aria-label="Close insight details">x</button>
      </header>
      <div class="drawer-body" id="drawerBody">
        <p class="drawer-placeholder">Select an insight to review the evidence trail, accuracy history, and recommended playbook.</p>
      </div>
    </aside>
  </div>

  ${getCommonClientScripts()}
  <script>
    window.predictiveDashboard = ${serializeForScript(clientPayload)};
  </script>
  <script src="/js/predictive-dashboard.js"></script>
</body>
</html>
    `

    res.send(html)
  } catch (error) {
    console.error('Analytics page error:', error)
    res.status(500).send(`
            <div style="padding: 2rem; text-align: center; font-family: system-ui;">
                <h1>Analytics Dashboard Error</h1>
                <p style="color: #6b7280; margin: 1rem 0;">${escapeHtml(error.message)}</p>
                <a href="/" style="color: #3b82f6; text-decoration: none;"><- Back to Home</a>
            </div>
        `)
  }
}

module.exports = analyticsPage
