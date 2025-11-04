const { escapeHtml } = require('./helpers')
const { formatDateDisplay } = require('../../utils/dateHelpers')

function summarizeExecutive(snapshot) {
  if (!snapshot || !snapshot.executiveSummary) {
    return 'No executive summary available for this date.'
  }
  return snapshot.executiveSummary
}

function pickTopUpdates(streams, limit = 5) {
  if (!streams) return []
  const pool = [
    ...(Array.isArray(streams.high) ? streams.high : []),
    ...(Array.isArray(streams.medium) ? streams.medium.slice(0, Math.max(0, limit - (streams.high || []).length)) : [])
  ]
  return pool.slice(0, limit)
}

function buildQuickStats(stats = {}) {
  const entries = [
    { label: 'Total updates', value: stats.totalUpdates || 0 },
    { label: 'High impact', value: stats.highImpact || 0 },
    { label: 'Active authorities', value: stats.activeAuthorities || 0 },
    { label: 'Imminent deadlines', value: stats.deadlinesSoon || 0 },
    { label: 'Urgent updates', value: stats.urgentUpdates || 0 }
  ]

  return entries
    .map(
      entry => `
        <div class="stat-card">
          <div class="stat-value">${escapeHtml(String(entry.value))}</div>
          <div class="stat-label">${escapeHtml(entry.label)}</div>
        </div>
      `
    )
    .join('')
}

function buildUpdateList(updates = []) {
  if (!updates.length) {
    return '<p class="empty">No priority updates to report for this day.</p>'
  }

  return `
    <ol class="update-list">
      ${updates
        .map(update => {
          const published = update.publishedAt ? formatDateDisplay(update.publishedAt) : 'Unknown date'
          return `
            <li>
              <div class="update-headline">
                <strong>${escapeHtml(update.headline || 'Untitled update')}</strong>
                <span>${escapeHtml(update.authority || 'Unknown authority')}</span>
              </div>
              <div class="update-meta">
                <span>${escapeHtml(published)}</span>
                <span>${escapeHtml(update.urgency || 'Low')} urgency</span>
                <span>${escapeHtml(update.impactLevel || 'Informational')} impact</span>
              </div>
              <p>${escapeHtml(update.summary || 'Summary unavailable.')}</p>
            </li>
          `
        })
        .join('')}
    </ol>
  `
}

function buildPersonaHighlights(personas = {}) {
  const keys = ['executive', 'analyst', 'operations']
  if (!keys.some(key => personas[key] && personas[key].count)) {
    return '<p class="empty">No persona-specific actions recorded for this date.</p>'
  }

  return `
    <div class="persona-table">
      <table>
        <thead>
          <tr>
            <th>Persona</th>
            <th>Updates surfaced</th>
            <th>Pinned</th>
            <th>Open actions</th>
          </tr>
        </thead>
        <tbody>
          ${keys
            .map(key => {
              const entry = personas[key] || {}
              const label = key.charAt(0).toUpperCase() + key.slice(1)
              return `
                <tr>
                  <td>${escapeHtml(label)}</td>
                  <td>${escapeHtml(String(entry.count || 0))}</td>
                  <td>${escapeHtml(String(entry.pins || 0))}</td>
                  <td>${escapeHtml(String(entry.openTasks || 0))}</td>
                </tr>
              `
            })
            .join('')}
        </tbody>
      </table>
    </div>
  `
}

function buildTimeline(timeline = []) {
  if (!timeline.length) {
    return '<p class="empty">No compliance deadlines within the next 30 days.</p>'
  }

  return `
    <ul class="timeline">
      ${timeline
        .slice(0, 5)
        .map(item => {
          const date = formatDateDisplay(item.date)
          return `
            <li>
              <strong>${escapeHtml(date)}</strong>
              <span>${escapeHtml(item.title || 'Compliance deadline')}</span>
              <span>${escapeHtml(item.authority || '')}</span>
            </li>
          `
        })
        .join('')}
    </ul>
  `
}

function buildThemes(themes = []) {
  if (!themes.length) {
    return '<p class="empty">No emerging themes identified.</p>'
  }

  return `
    <ul class="themes">
      ${themes
        .slice(0, 6)
        .map(theme => `<li><strong>${escapeHtml(theme.label)}</strong> — ${escapeHtml(String(theme.support))} signals</li>`)
        .join('')}
    </ul>
  `
}

function buildAiIntelligenceExportPage(snapshot, options = {}) {
  const dateLabel = formatDateDisplay(snapshot.snapshotDate || new Date())
  const riskPulse = snapshot.riskPulse || {}
  const statsHtml = buildQuickStats(snapshot.quickStats || {})
  const topUpdates = buildUpdateList(pickTopUpdates(snapshot.streams, 5))
  const executiveSummary = summarizeExecutive(snapshot)
  const personaHighlights = buildPersonaHighlights(snapshot.personas)
  const timeline = buildTimeline(snapshot.timeline)
  const themes = buildThemes(snapshot.themes)
  const logoSource = options.logoSource || '/images/regcanary-logo.png'
  const helperMessage = options.bannerMessage ? `<div class="export-banner">${escapeHtml(options.bannerMessage)}</div>` : ''

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>RegCanary AI Intelligence One-Pager – ${escapeHtml(dateLabel)}</title>
        <style>
          :root {
            color-scheme: light;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            margin: 0;
            padding: 24mm;
            background: #f8fafc;
            color: #0f172a;
          }
          @page {
            size: A4;
            margin: 18mm;
          }
          h1, h2, h3 {
            margin: 0 0 12px;
            color: #0f172a;
          }
          h1 {
            font-size: 24px;
            letter-spacing: -0.01em;
          }
          h2 {
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }
          p {
            margin: 0 0 12px;
            line-height: 1.5;
          }
          .page {
            background: #fff;
            border-radius: 16px;
            padding: 28px;
            box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
          }
          header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }
          header img {
            height: 42px;
          }
          .risk-pulse {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border-radius: 16px;
            padding: 18px 24px;
            color: #f8fafc;
            margin-bottom: 20px;
          }
          .risk-score {
            font-size: 36px;
            font-weight: 700;
          }
          .risk-meta {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .risk-label {
            font-size: 14px;
            opacity: 0.9;
          }
          .risk-delta {
            font-size: 12px;
            padding: 4px 10px;
            border-radius: 999px;
            background: rgba(248, 250, 252, 0.15);
            width: fit-content;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 18px;
          }
          .stat-cards {
            display: grid;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 12px;
          }
          .stat-card {
            background: #f1f5f9;
            border-radius: 12px;
            padding: 12px;
            text-align: center;
          }
          .stat-value {
            font-size: 18px;
            font-weight: 700;
            color: #0f172a;
          }
          .stat-label {
            font-size: 11px;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            color: #475569;
          }
          section {
            margin-bottom: 22px;
            page-break-inside: avoid;
          }
          .update-list {
            margin: 0;
            padding-left: 16px;
            display: grid;
            gap: 12px;
          }
          .update-list li {
            line-height: 1.45;
          }
          .update-headline {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            font-size: 13px;
            color: #1e293b;
          }
          .update-meta {
            display: flex;
            gap: 16px;
            font-size: 11px;
            color: #475569;
            margin: 4px 0;
          }
          .persona-table table {
            width: 100%;
            border-collapse: collapse;
          }
          .persona-table th,
          .persona-table td {
            border: 1px solid #e2e8f0;
            padding: 8px 10px;
            font-size: 12px;
            text-align: left;
          }
          .timeline {
            margin: 0;
            padding-left: 16px;
            font-size: 12px;
            color: #1e293b;
            display: grid;
            gap: 8px;
          }
          .timeline li span {
            display: block;
            color: #475569;
          }
          .themes {
            margin: 0;
            padding-left: 16px;
            font-size: 12px;
            display: grid;
            gap: 6px;
          }
          .empty {
            font-size: 12px;
            color: #64748b;
            font-style: italic;
          }

          .export-banner {
            background: #e0f2fe;
            color: #0369a1;
            border-radius: 10px;
            padding: 10px 14px;
            font-size: 11px;
            margin-bottom: 16px;
            letter-spacing: 0.02em;
          }
          footer {
            margin-top: 16px;
            font-size: 10px;
            color: #94a3b8;
            text-align: right;
          }
        </style>
      </head>
      <body>
        <div class="page">
          <header>
            <img src="${escapeHtml(logoSource)}" alt="RegCanary" />
            <div>
              <h1>AI Intelligence One-Pager</h1>
              <div>${escapeHtml(dateLabel)}</div>
            </div>
          </header>
          ${helperMessage}

          <div class="risk-pulse">
            <div class="risk-meta">
              <div class="risk-label">${escapeHtml(riskPulse.label || 'Stable')}</div>
              <div class="risk-delta">${riskPulse.delta >= 0 ? '+' : ''}${escapeHtml(String(riskPulse.delta || 0))} vs baseline</div>
            </div>
            <div class="risk-score">${escapeHtml(String(riskPulse.score || 0))}</div>
          </div>

          <section>
            <h2>Executive Summary</h2>
            <p>${escapeHtml(executiveSummary)}</p>
          </section>

          <section>
            <h2>Daily Signals</h2>
            <div class="stat-cards">
              ${statsHtml}
            </div>
          </section>

          <section>
            <h2>Priority Updates</h2>
            ${topUpdates}
          </section>

          <section class="grid">
            <div>
              <h2>Persona Highlights</h2>
              ${personaHighlights}
            </div>
            <div>
              <h2>Upcoming Deadlines</h2>
              ${timeline}
            </div>
          </section>

          <section>
            <h2>Emerging Themes</h2>
            ${themes}
          </section>

          <footer>
            Generated by RegCanary Intelligence • ${escapeHtml(new Date().toLocaleString('en-GB'))}
          </footer>
        </div>
        ${options.autoPrint ? '<script>window.addEventListener("load",function(){window.print();});</script>' : ''}
      </body>
    </html>
  `
}

module.exports = {
  buildAiIntelligenceExportPage
}
