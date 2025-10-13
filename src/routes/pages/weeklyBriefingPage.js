// Weekly Smart Briefing Page Renderer

const smartBriefingService = require('../../services/smartBriefingService')
const { getSidebar } = require('../templates/sidebar')
const { getCommonStyles } = require('../templates/commonStyles')
const { getClientScripts } = require('../templates/clientScripts')

const MAX_HIGHLIGHT_UPDATES = 10

function serialize(value) {
  return JSON.stringify(value || null).replace(/</g, '\\u003c')
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttribute(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatRichText(value, fallbackMessage) {
  if (!value) {
    return fallbackMessage
      ? `<div class="empty-state">${escapeHtml(fallbackMessage)}</div>`
      : ''
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return fallbackMessage
      ? `<div class="empty-state">${escapeHtml(fallbackMessage)}</div>`
      : ''
  }

  if (/[<][a-zA-Z]+/.test(trimmed)) {
    return trimmed
  }

  const blocks = trimmed.split(/\n{2,}/g).map(block => block.trim()).filter(Boolean)
  if (blocks.length === 0) {
    return `<p>${escapeHtml(trimmed).replace(/\n/g, '<br>')}</p>`
  }
  return blocks.map(block => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`).join('')
}

function formatDateDisplay(value) {
  if (!value) return 'Unknown'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Unknown'
  return parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function buildInitialNarrativeHtml(briefing) {
  if (!briefing?.artifacts?.narrative) {
    return '<div class="empty-state">Run "Assemble This Week" to generate the narrative briefing.</div>'
  }
  return formatRichText(briefing.artifacts.narrative, 'Run "Assemble This Week" to generate the narrative briefing.')
}

function buildInitialOnePagerHtml(briefing) {
  if (!briefing?.artifacts?.onePager) {
    return '<div class="empty-state">Generate a briefing to view the one-pager.</div>'
  }
  return formatRichText(briefing.artifacts.onePager, 'Generate a briefing to view the one-pager.')
}

function buildInitialTeamBriefingHtml(briefing) {
  if (!briefing?.artifacts?.teamBriefing) {
    return '<div class="empty-state">Team briefing notes appear after generation.</div>'
  }
  return formatRichText(briefing.artifacts.teamBriefing, 'Team briefing notes appear after generation.')
}

function buildInitialStatsHtml(briefing) {
  const stats = briefing?.dataset?.stats
  if (!stats) {
    return [
      '<li class="stat-item"><span>Total updates</span><strong>0</strong></li>',
      '<li class="stat-item"><span>High impact</span><strong>0</strong></li>',
      '<li class="stat-item"><span>Moderate</span><strong>0</strong></li>',
      '<li class="stat-item"><span>Informational</span><strong>0</strong></li>'
    ].join('')
  }

  const impact = stats.byImpact || { Significant: 0, Moderate: 0, Informational: 0 }
  return [
    `<li class="stat-item"><span>Total updates</span><strong>${escapeHtml(String(stats.totalUpdates || 0))}</strong></li>`,
    `<li class="stat-item"><span>High impact</span><strong>${escapeHtml(String(impact.Significant || 0))}</strong></li>`,
    `<li class="stat-item"><span>Moderate</span><strong>${escapeHtml(String(impact.Moderate || 0))}</strong></li>`,
    `<li class="stat-item"><span>Informational</span><strong>${escapeHtml(String(impact.Informational || 0))}</strong></li>`
  ].join('')
}

function buildInitialTimelineHtml(briefing) {
  const timeline = briefing?.dataset?.historyTimeline
  if (!Array.isArray(timeline) || timeline.length === 0) {
    return '<div class="empty-state">Timeline populates when a briefing is generated.</div>'
  }
  return timeline.slice(-8).map(entry => `
        <div class="timeline-item">
            <span>${escapeHtml(formatDateDisplay(entry.date))}</span>
            <strong>${escapeHtml(String(entry.count || 0))}</strong>
        </div>
    `).join('')
}

function buildInitialUpdatesHtml(briefing) {
  const sourceUpdates = Array.isArray(briefing?.dataset?.highlightUpdates) && briefing.dataset.highlightUpdates.length > 0
    ? briefing.dataset.highlightUpdates
    : briefing?.dataset?.currentUpdates

  const updates = Array.isArray(sourceUpdates)
    ? sourceUpdates.slice(0, MAX_HIGHLIGHT_UPDATES)
    : []

  if (updates.length === 0) {
    return '<div class="empty-state">No updates found. Try refreshing the briefing.</div>'
  }

  return updates.map(update => {
    const tags = Array.isArray(update.tags) ? update.tags.slice(0, 4) : []
    const sectors = Array.isArray(update.sectors) ? update.sectors.slice(0, 3) : []
    const badges = [...tags, ...sectors]
    const link = update.url
      ? `<a class="panel-link" href="${escapeAttribute(update.url)}" target="_blank" rel="noopener">Open source →</a>`
      : ''

    return `
        <article class="update-card">
            <header class="update-card__header">
                <span class="update-badge">${escapeHtml(update.authority || 'Unknown')}</span>
                <span class="update-meta">${escapeHtml(formatDateDisplay(update.published_date))}</span>
            </header>
            <h3 class="update-headline">${escapeHtml(update.title || 'Untitled update')}</h3>
            <p class="update-summary">${escapeHtml((update.summary || '').slice(0, 320))}</p>
            <div class="update-meta-row">
                <span>${escapeHtml(update.impact_level || 'Informational')}</span>
                <span>${escapeHtml(update.urgency || 'Low urgency')}</span>
                ${update.business_impact_score ? `<span>Impact score: ${escapeHtml(String(update.business_impact_score))}</span>` : ''}
            </div>
            ${badges.length ? `<div class="update-tags">${badges.map(tag => `<span class="chip">${escapeHtml(tag)}</span>`).join('')}</div>` : ''}
            ${link}
        </article>
    `
  }).join('')
}

function buildInitialMetaHtml(briefing) {
  if (!briefing) {
    return '<span>No briefing assembled yet</span>'
  }
  const parts = []
  if (briefing.dateRange) {
    parts.push(`Coverage ${formatDateDisplay(briefing.dateRange.start)} — ${formatDateDisplay(briefing.dateRange.end)}`)
  }
  parts.push(`Generated ${formatDateDisplay(briefing.generatedAt)}`)
  if (briefing.metadata?.totals?.currentUpdates) {
    parts.push(`${briefing.metadata.totals.currentUpdates} updates analysed`)
  }
  if (briefing.dataset?.highlightUpdates?.length) {
    parts.push(`${briefing.dataset.highlightUpdates.length} priority items surfaced`)
  }
  if (briefing.dataset?.samplingWindowDays) {
    parts.push(`Sampling window ${briefing.dataset.samplingWindowDays} days`)
  }
  return parts.map(text => `<span>${escapeHtml(text)}</span>`).join('')
}

module.exports = async function renderWeeklyBriefingPage(req, res) {
  try {
    const sidebar = await getSidebar('weekly-roundup')
    let latestBriefing = null
    try {
      latestBriefing = await smartBriefingService.getLatestBriefing()
      if (latestBriefing) {
        console.log('[weekly-briefing] Loaded latest briefing', latestBriefing.id, 'with', latestBriefing?.dataset?.currentUpdates?.length || 0, 'updates')
      } else {
        console.log('[weekly-briefing] No stored briefing found')
      }
    } catch (error) {
      console.warn('[weekly-briefing] Failed to load latest briefing:', error.message)
      latestBriefing = null
    }
    const recentBriefings = await smartBriefingService.listBriefings(5).catch(() => [])

    const initialNarrativeHtml = buildInitialNarrativeHtml(latestBriefing)
    const initialStatsHtml = buildInitialStatsHtml(latestBriefing)
    const initialTimelineHtml = buildInitialTimelineHtml(latestBriefing)
    const initialUpdatesHtml = buildInitialUpdatesHtml(latestBriefing)
    const initialOnePagerHtml = buildInitialOnePagerHtml(latestBriefing)
    const initialTeamBriefingHtml = buildInitialTeamBriefingHtml(latestBriefing)
    const initialMetaHtml = buildInitialMetaHtml(latestBriefing)

    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Weekly Smart Briefing - Horizon Scanner</title>
            ${getCommonStyles()}
            <style>
                .briefing-header {
                    background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
                    color: white;
                    padding: 36px;
                    border-radius: 16px;
                    margin-bottom: 28px;
                }
                .briefing-header h1 {
                    font-size: 2rem;
                    font-weight: 700;
                    margin-bottom: 12px;
                }
                .briefing-meta {
                    display: flex;
                    gap: 18px;
                    flex-wrap: wrap;
                    font-size: 0.95rem;
                    opacity: 0.85;
                }
                .briefing-toolbar {
                    display: flex;
                    gap: 12px;
                    margin-top: 24px;
                    flex-wrap: wrap;
                }
                .btn {
                    padding: 12px 18px;
                    border-radius: 10px;
                    font-weight: 600;
                    border: none;
                    cursor: pointer;
                    transition: all 0.18s ease;
                }
                .btn-primary {
                    background: #3b82f6;
                    color: white;
                }
                .btn-primary:disabled {
                    cursor: not-allowed;
                    background: #93c5fd;
                }
                .btn-secondary {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    border: 1px solid rgba(255, 255, 255, 0.25);
                }
                .btn-secondary:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .status-banner {
                    margin-bottom: 16px;
                    padding: 12px 16px;
                    border-radius: 10px;
                    border: 1px solid #d1d5db;
                    background: #f9fafb;
                    color: #1f2937;
                    display: none;
                }
                .status-banner.success { border-color: #34d399; background: #ecfdf5; color: #047857; }
                .status-banner.error { border-color: #f87171; background: #fef2f2; color: #b91c1c; }
                .status-banner.info { border-color: #93c5fd; background: #eff6ff; color: #1d4ed8; }
                .briefing-layout {
                    display: grid;
                    grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
                    gap: 24px;
                }
                .card {
                    background: white;
                    border-radius: 14px;
                    border: 1px solid #e5e7eb;
                    padding: 22px;
                    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
                }
                .card h2,
                .card h3 {
                    margin: 0 0 12px;
                    font-weight: 600;
                    color: #111827;
                }
                .card h2 { font-size: 1.25rem; }
                .card h3 { font-size: 1.05rem; }
                .empty-state {
                    padding: 24px;
                    text-align: center;
                    color: #6b7280;
                    border: 1px dashed #d1d5db;
                    border-radius: 12px;
                    background: #f9fafb;
                }
                .narrative-content p {
                    margin-bottom: 14px;
                    line-height: 1.65;
                    color: #1f2937;
                }
                .narrative-content h4 {
                    margin-top: 22px;
                    margin-bottom: 12px;
                    font-weight: 700;
                    color: #0f172a;
                }
                .updates-card {
                    margin-top: 24px;
                }
                .updates-container {
                    display: grid;
                    gap: 16px;
                }
                .update-card {
                    border: 1px solid #e5e7eb;
                    border-radius: 14px;
                    padding: 20px 22px;
                    background: #ffffff;
                    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .update-card__header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 12px;
                    font-size: 0.85rem;
                    color: #475569;
                }
                .update-badge {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 4px 10px;
                    border-radius: 999px;
                    background: #e0e7ff;
                    color: #1d4ed8;
                    font-weight: 600;
                    font-size: 0.75rem;
                    letter-spacing: 0.05em;
                }
                .update-headline {
                    margin: 0;
                    font-size: 1.05rem;
                    font-weight: 600;
                    color: #0f172a;
                }
                .update-summary {
                    margin: 0;
                    color: #475569;
                    line-height: 1.5;
                    font-size: 0.95rem;
                }
                .update-meta-row {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    font-size: 0.82rem;
                    color: #64748b;
                }
                .update-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                .chip {
                    display: inline-flex;
                    align-items: center;
                    padding: 4px 10px;
                    border-radius: 999px;
                    background: #edf2ff;
                    color: #1e3a8a;
                    font-size: 0.75rem;
                    font-weight: 500;
                    letter-spacing: 0.04em;
                }
                .panel-link {
                    display: inline-flex;
                    align-items: center;
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: #1d4ed8;
                    text-decoration: none;
                    gap: 6px;
                }
                .panel-link:hover {
                    text-decoration: underline;
                }
                .briefing-section + .briefing-section {
                    margin-top: 18px;
                }
                .briefing-section h4 {
                    margin: 0 0 8px;
                    font-size: 1rem;
                    font-weight: 600;
                    color: #0f172a;
                }
                .briefing-section p {
                    margin: 0 0 10px;
                    color: #475569;
                    line-height: 1.6;
                }
                .briefing-section ul {
                    margin: 0;
                    padding-left: 18px;
                    color: #475569;
                }
                .chip-row {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-top: 6px;
                }
                .metric-chip {
                    display: inline-flex;
                    align-items: center;
                    padding: 4px 10px;
                    background: #e2e8f0;
                    border-radius: 999px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: #1f2937;
                }
                .one-pager h4,
                .team-briefing h4 {
                    margin: 18px 0 10px;
                    font-size: 1rem;
                    font-weight: 600;
                    color: #0f172a;
                }
                .one-pager ul,
                .team-briefing ul {
                    margin: 0 0 12px;
                    padding-left: 18px;
                    color: #475569;
                    line-height: 1.55;
                }
                .one-pager ul li,
                .team-briefing ul li {
                    margin-bottom: 6px;
                }
                .updates-container.cards-view .update-card {
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                    padding: 18px 20px;
                    background: #ffffff;
                    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
                }
                .updates-container.cards-view .update-card:hover {
                    border-color: #c7d2fe;
                    box-shadow: 0 14px 28px rgba(59, 130, 246, 0.12);
                }
                .change-grid {
                    display: grid;
                    gap: 14px;
                }
                .change-card {
                    border: 1px solid #e5e7eb;
                    border-radius: 10px;
                    padding: 14px;
                    background: #f9fafb;
                }
                .change-card h4 {
                    font-size: 1rem;
                    margin-bottom: 6px;
                    color: #1f2937;
                }
                .change-card ul {
                    margin: 0;
                    padding-left: 18px;
                    color: #4b5563;
                }
                .stat-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    display: grid;
                    gap: 10px;
                }
                .stat-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 12px;
                    background: #f3f4f6;
                    border-radius: 10px;
                }
                .timeline {
                    max-height: 260px;
                    overflow-y: auto;
                }
                .timeline-item {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    padding: 10px 12px;
                    border-radius: 10px;
                    background: #f9fafb;
                    border: 1px solid #e5e7eb;
                }
                .recent-list {
                    list-style: none;
                    margin: 0;
                    padding: 0;
                    display: grid;
                    gap: 8px;
                }
                .recent-list li {
                    padding: 12px 14px;
                    border-radius: 10px;
                    border: 1px solid #e5e7eb;
                    background: #f8fafc;
                    font-size: 0.95rem;
                    color: #1f2937;
                }
                .recent-list span {
                    display: block;
                    font-size: 0.8rem;
                    color: #6b7280;
                    margin-top: 4px;
                }
                .annotation-toolbar {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                    margin-bottom: 12px;
                }
                .annotation-filter {
                    flex: 1;
                    padding: 8px 10px;
                    border-radius: 8px;
                    border: 1px solid #d1d5db;
                    font-size: 0.9rem;
                    color: #1f2937;
                    background: white;
                }
                .annotation-list {
                    display: grid;
                    gap: 10px;
                    max-height: 280px;
                    overflow-y: auto;
                }
                .annotation-item {
                    border: 1px solid #e5e7eb;
                    border-radius: 10px;
                    padding: 12px;
                    background: #f9fafb;
                }
                .annotation-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 6px;
                }
                .annotation-status {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 2px 8px;
                    border-radius: 999px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.02em;
                }
                .annotation-status.analyzing { background: #fef3c7; color: #b45309; }
                .annotation-status.assigned { background: #dbeafe; color: #1d4ed8; }
                .annotation-status.reviewed { background: #dcfce7; color: #047857; }
                .annotation-status-na { background: #e5e7eb; color: #374151; }
                .annotation-meta {
                    font-size: 0.8rem;
                    color: #6b7280;
                }
                .annotation-body {
                    margin: 8px 0;
                    color: #1f2937;
                    line-height: 1.4;
                    white-space: pre-wrap;
                }
                .annotation-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                    margin-top: 8px;
                }
                .annotation-tag {
                    padding: 2px 8px;
                    background: #e0f2fe;
                    color: #0369a1;
                    border-radius: 999px;
                    font-size: 0.75rem;
                }
                .metrics-grid {
                    display: grid;
                    gap: 10px;
                }
                .metric-card {
                    border: 1px solid #e5e7eb;
                    border-radius: 10px;
                    padding: 12px;
                    background: #f9fafb;
                }
                .metric-label {
                    font-size: 0.85rem;
                    color: #6b7280;
                    margin-bottom: 4px;
                }
                .metric-value {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: #1f2937;
                }
                .run-status {
                    margin-top: 18px;
                    padding: 12px 16px;
                    border-radius: 10px;
                    border: 1px solid #bfdbfe;
                    background: #eff6ff;
                    color: #1d4ed8;
                    font-size: 0.95rem;
                    display: none;
                }
                .run-status.active { display: block; }
                .modal-backdrop {
                    position: fixed;
                    inset: 0;
                    background: rgba(15, 23, 42, 0.55);
                    display: none;
                    align-items: center;
                    justify-content: center;
                    z-index: 50;
                }
                .modal-backdrop.visible { display: flex; }
                .modal {
                    background: white;
                    border-radius: 16px;
                    width: min(720px, 94vw);
                    max-height: 88vh;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 20px 60px rgba(15, 23, 42, 0.25);
                }
                .modal header {
                    padding: 20px 24px;
                    border-bottom: 1px solid #e5e7eb;
                }
                .modal header h2 {
                    margin: 0;
                    font-size: 1.25rem;
                }
                .modal .modal-body {
                    padding: 20px 24px;
                    overflow-y: auto;
                }
                .modal footer {
                    padding: 20px 24px;
                    border-top: 1px solid #f1f5f9;
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                }
                .preview-grid {
                    display: grid;
                    gap: 16px;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                }
                .preview-card {
                    padding: 16px;
                    border-radius: 10px;
                    border: 1px solid #e5e7eb;
                    background: #f9fafb;
                }
                .preview-card h3 {
                    margin-top: 0;
                    margin-bottom: 10px;
                    font-size: 1rem;
                    color: #0f172a;
                }
                .preview-card p { margin: 0; color: #4b5563; font-size: 0.95rem; }
                .hidden { display: none !important; }
                @media (max-width: 1180px) {
                    .briefing-layout {
                        grid-template-columns: 1fr;
                    }
                }
                @media print {
                    body { background: white; }
                    .sidebar, .briefing-toolbar, .run-status, .status-banner, .modal-backdrop { display: none !important; }
                    .main-content { padding: 0; box-shadow: none; }
                    .card { break-inside: avoid; box-shadow: none; border: 1px solid #d1d5db; }
                }
            </style>
        </head>
        <body>
            <div class="app-container">
                ${sidebar}
                <main class="main-content">
                    <div class="briefing-header">
                        <h1>Weekly Smart Briefing</h1>
                        <div class="briefing-meta" id="briefingMeta">
                            ${initialMetaHtml}
                        </div>
                        <div class="briefing-toolbar">
                            <button class="btn btn-primary" id="assembleBtn">Assemble This Week</button>
                            <button class="btn btn-secondary" id="printBtn" disabled>Publish &amp; Print</button>
                            <button class="btn btn-secondary" id="refreshBtn">Refresh Latest</button>
                        </div>
                        <div class="run-status" id="runStatus"></div>
                    </div>

                    <div id="statusToast" class="status-banner"></div>

                    <div class="briefing-layout">
                        <section class="card" id="narrativeCard">
                            <h2>Week's Story</h2>
                            <div class="narrative-content" id="narrativeContent">
                                ${initialNarrativeHtml}
                            </div>
                            <div class="updates-card">
                                <h3 style="margin-top:24px;">Flagged Updates</h3>
                                <div class="updates-container" id="updates-container">
                                    ${initialUpdatesHtml}
                                </div>
                            </div>
                        </section>
                        <aside class="side-panel">
                            <section class="card">
                                <h3>Snapshot Stats</h3>
                                <ul class="stat-list" id="statsList">
                                    ${initialStatsHtml}
                                </ul>
                            </section>
                            <section class="card">
                                <h3>Recent Briefings</h3>
                                <ul class="recent-list" id="recentBriefingsList">
                                    <li>No previous briefings found</li>
                                </ul>
                            </section>
                            <section class="card">
                                <h3>Team Annotations</h3>
                                <div class="annotation-toolbar">
                                    <select class="annotation-filter" id="annotationFilter">
                                        <option value="all">All statuses</option>
                                        <option value="analyzing">Needs analysis</option>
                                        <option value="assigned">Assigned</option>
                                        <option value="reviewed">Reviewed</option>
                                        <option value="n/a">Not applicable</option>
                                    </select>
                                    <button class="btn btn-secondary" id="addAnnotationBtn" type="button">Add Annotation</button>
                                </div>
                                <div class="annotation-list" id="annotationList">
                                    <div class="empty-state">Annotations will appear once generated.</div>
                                </div>
                            </section>
                            <section class="card">
                                <h3>Run Metrics</h3>
                                <div class="metrics-grid" id="metricsGrid">
                                    <div class="metric-card">
                                        <div class="metric-label">Total runs</div>
                                        <div class="metric-value" id="metricRuns">0</div>
                                    </div>
                                    <div class="metric-card">
                                        <div class="metric-label">Cache hit rate</div>
                                        <div class="metric-value" id="metricCache">0%</div>
                                    </div>
                                    <div class="metric-card">
                                        <div class="metric-label">Tokens last run</div>
                                        <div class="metric-value" id="metricTokens">0</div>
                                    </div>
                                    <div class="metric-card">
                                        <div class="metric-label">Last run duration</div>
                                        <div class="metric-value" id="metricDuration">—</div>
                                    </div>
                                </div>
                            </section>
                        </aside>
                    </div>
                    <div class="briefing-layout" style="margin-top:24px;">
                        <section class="card" id="changeCard">
                            <h2>Change Map</h2>
                            <div class="change-grid" id="changeContent">
                                <div class="empty-state">No change analysis yet.</div>
                            </div>
                        </section>
                        <section class="card">
                            <h2>Timeline</h2>
                            <div class="timeline" id="timelineContent">
                                ${initialTimelineHtml}
                            </div>
                        </section>
                    </div>
                    <div class="briefing-layout" style="margin-top:24px;">
                        <section class="card">
                            <h2>Executive One-Pager</h2>
                            <div class="narrative-content" id="onePagerContent">
                                ${initialOnePagerHtml}
                            </div>
                        </section>
                        <section class="card">
                            <h2>Team Briefing</h2>
                            <div class="narrative-content" id="teamBriefingContent">
                                ${initialTeamBriefingHtml}
                            </div>
                        </section>
                    </div>
                </main>
            </div>

            <div class="modal-backdrop" id="assembleModal">
                <div class="modal">
                    <header>
                        <h2>Assemble This Week</h2>
                        <p style="margin:6px 0 0;color:#6b7280;font-size:0.95rem;">Review the scope before triggering the Smart Briefing generation.</p>
                    </header>
                    <div class="modal-body" id="previewContent">
                        <div class="empty-state">Loading weekly snapshot…</div>
                    </div>
                    <footer>
                        <button class="btn" id="cancelAssemble">Cancel</button>
                        <button class="btn btn-primary" id="confirmAssemble">Generate Briefing</button>
                    </footer>
                </div>
            </div>

            <div class="modal-backdrop" id="annotationModal">
                <div class="modal">
                    <header>
                        <h2>New Annotation</h2>
                        <p style="margin:6px 0 0;color:#6b7280;font-size:0.95rem;">Capture context for the team. Fields in bold are required.</p>
                    </header>
                    <form class="modal-body" id="annotationForm">
                        <div style="display:grid;gap:12px;">
                            <label>
                                <span style="display:block;font-weight:600;margin-bottom:4px;">Update ID *</span>
                                <input list="annotationUpdateOptions" name="update_id" id="annotationUpdateId" required class="annotation-filter" style="width:100%;">
                                <datalist id="annotationUpdateOptions"></datalist>
                            </label>
                            <label>
                                <span style="display:block;font-weight:600;margin-bottom:4px;">Visibility</span>
                                <select name="visibility" id="annotationVisibility" class="annotation-filter" style="width:100%;">
                                    <option value="team">Team</option>
                                    <option value="all">All</option>
                                    <option value="private">Private</option>
                                </select>
                            </label>
                            <label>
                                <span style="display:block;font-weight:600;margin-bottom:4px;">Status</span>
                                <select name="status" id="annotationStatus" class="annotation-filter" style="width:100%;">
                                    <option value="analyzing">Needs analysis</option>
                                    <option value="assigned">Assigned</option>
                                    <option value="reviewed">Reviewed</option>
                                    <option value="n/a">Not applicable</option>
                                </select>
                            </label>
                            <label>
                                <span style="display:block;font-weight:600;margin-bottom:4px;">Content *</span>
                                <textarea name="content" id="annotationContent" rows="5" required style="width:100%;border:1px solid #d1d5db;border-radius:8px;padding:10px;font-size:0.95rem;"></textarea>
                            </label>
                            <label>
                                <span style="display:block;font-weight:600;margin-bottom:4px;">Tags (comma separated)</span>
                                <input type="text" name="tags" id="annotationTags" class="annotation-filter" style="width:100%;">
                            </label>
                            <label>
                                <span style="display:block;font-weight:600;margin-bottom:4px;">Assign to (comma separated)</span>
                                <input type="text" name="assigned_to" id="annotationAssigned" class="annotation-filter" style="width:100%;">
                            </label>
                            <label>
                                <span style="display:block;font-weight:600;margin-bottom:4px;">Linked resources (comma separated URLs)</span>
                                <input type="text" name="linked_resources" id="annotationResources" class="annotation-filter" style="width:100%;">
                            </label>
                        </div>
                    </form>
                    <footer>
                        <button class="btn" id="cancelAnnotation">Cancel</button>
                        <button class="btn btn-primary" id="saveAnnotation" form="annotationForm" type="submit">Save Annotation</button>
                    </footer>
                </div>
            </div>

            <script>
                window.initialUpdates = ${serialize((latestBriefing?.dataset?.highlightUpdates && latestBriefing.dataset.highlightUpdates.length > 0)
                  ? latestBriefing.dataset.highlightUpdates
                  : (latestBriefing?.dataset?.currentUpdates || []))};
            </script>
            ${getClientScripts()}
            <script>
                window.__SMART_BRIEFING__ = ${serialize(latestBriefing)};
                window.__SMART_BRIEFING_LIST__ = ${serialize(recentBriefings)};
            </script>
            <script>
                (function() {
                    const state = {
                        current: window.__SMART_BRIEFING__ || null,
                        recent: window.__SMART_BRIEFING_LIST__ || [],
                        polling: null,
                        previewRange: null,
                        annotations: [],
                        annotationFilter: 'all',
                        annotationVisibility: ['team', 'all'],
                        metrics: null
                    };

                    const assembleBtn = document.getElementById('assembleBtn');
                    const printBtn = document.getElementById('printBtn');
                    const refreshBtn = document.getElementById('refreshBtn');
                    const statusToast = document.getElementById('statusToast');
                    const runStatusEl = document.getElementById('runStatus');
                    const metaEl = document.getElementById('briefingMeta');
                    const modal = document.getElementById('assembleModal');
                    const previewContent = document.getElementById('previewContent');
                    const confirmBtn = document.getElementById('confirmAssemble');
                    const cancelBtn = document.getElementById('cancelAssemble');
                    const annotationFilterEl = document.getElementById('annotationFilter');
                    const annotationListEl = document.getElementById('annotationList');
                    const addAnnotationBtn = document.getElementById('addAnnotationBtn');
                    const annotationModal = document.getElementById('annotationModal');
                    const annotationForm = document.getElementById('annotationForm');
                    const cancelAnnotationBtn = document.getElementById('cancelAnnotation');
                    const annotationUpdateOptions = document.getElementById('annotationUpdateOptions');
                    const metricsRunsEl = document.getElementById('metricRuns');
                    const metricsCacheEl = document.getElementById('metricCache');
                    const metricsTokensEl = document.getElementById('metricTokens');
                    const metricsDurationEl = document.getElementById('metricDuration');

                    function escapeHtml(value) {
                        return String(value || '')
                            .replace(/&/g, '&amp;')
                            .replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;')
                            .replace(/"/g, '&quot;')
                            .replace(/'/g, '&#39;');
                    }

                    function formatDate(value) {
                        if (!value) return 'Unknown';
                        const date = new Date(value);
                        if (isNaN(date)) return 'Unknown';
                        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                    }

                    function formatDateTime(value) {
                        if (!value) return 'Unknown';
                        const date = new Date(value);
                        if (isNaN(date)) return 'Unknown';
                        return date.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                    }

                    function formatDuration(ms) {
                        if (!ms || Number.isNaN(ms)) return '—';
                        const seconds = Math.round(ms / 1000);
                        if (seconds < 60) return seconds + 's';
                        const minutes = Math.floor(seconds / 60);
                        const remaining = seconds % 60;
                        return minutes + 'm ' + remaining + 's';
                    }

                    function visibilityLabel(value) {
                        switch (value) {
                          case 'all':
                            return 'All teams';
                          case 'private':
                            return 'Private';
                          default:
                            return 'Team';
                        }
                    }

                    function statusClass(value) {
                        if (value === 'assigned') return 'annotation-status assigned';
                        if (value === 'reviewed') return 'annotation-status reviewed';
                        if (value === 'n/a') return 'annotation-status annotation-status-na';
                        return 'annotation-status analyzing';
                    }

                    function statusLabel(value) {
                        switch (value) {
                          case 'assigned':
                            return 'Assigned';
                          case 'reviewed':
                            return 'Reviewed';
                          case 'n/a':
                            return 'Not applicable';
                          default:
                            return 'Needs analysis';
                        }
                    }

                    function showToast(message, type = 'info', autoHide = true) {
                        statusToast.textContent = message;
                        statusToast.className = 'status-banner ' + type;
                        statusToast.style.display = 'block';
                        if (autoHide) {
                            setTimeout(() => {
                                statusToast.style.display = 'none';
                            }, 5000);
                        }
                    }

                    function updateRunStatus(status) {
                        if (!status) {
                            runStatusEl.classList.remove('active');
                            runStatusEl.textContent = '';
                            return;
                        }
                        runStatusEl.classList.add('active');
                        const parts = [status.state ? status.state.toUpperCase() : 'IN PROGRESS'];
                        if (status.message) parts.push('– ' + status.message);
                        if (status.cacheHit) parts.push('(cache hit)');
                        runStatusEl.textContent = parts.join(' ');
                    }

                    function formatRichTextClient(text, fallbackHtml) {
                        if (!text) return fallbackHtml || '<div class="empty-state">No content generated.</div>';
                        const trimmed = text.trim();
                        if (!trimmed) return fallbackHtml || '<div class="empty-state">No content generated.</div>';
                        if (/[<][a-zA-Z]+/.test(trimmed)) return trimmed;
                        const blocks = trimmed.split(/\\n{2,}/g).map(block => block.trim()).filter(Boolean);
                        if (blocks.length === 0) {
                            return '<p>' + escapeHtml(trimmed).replace(/\\n/g, '<br>') + '</p>';
                        }
                        return blocks.map(block => '<p>' + escapeHtml(block).replace(/\\n/g, '<br>') + '</p>').join('');
                    }

                    function renderNarrative(briefing) {
                        const container = document.getElementById('narrativeContent');
                        if (!briefing || !briefing.artifacts || !briefing.artifacts.narrative) {
                            console.log('[briefing] renderNarrative fallback', Boolean(briefing), Boolean(briefing?.artifacts));
                            container.innerHTML = '<div class="empty-state">Run "Assemble This Week" to generate the narrative briefing.</div>';
                            return;
                        }
                        const narrative = briefing.artifacts.narrative;
                        console.log('[briefing] renderNarrative length', narrative.length);
                        container.innerHTML = formatRichTextClient(narrative, '<div class="empty-state">Run "Assemble This Week" to generate the narrative briefing.</div>');
                    }

                    function renderStats(briefing) {
                        const list = document.getElementById('statsList');
                        if (!briefing || !briefing.dataset || !briefing.dataset.stats) {
                            list.innerHTML = '<li class="stat-item"><span>Total updates</span><strong>0</strong></li>' +
                                '<li class="stat-item"><span>High impact</span><strong>0</strong></li>' +
                                '<li class="stat-item"><span>Moderate</span><strong>0</strong></li>' +
                                '<li class="stat-item"><span>Informational</span><strong>0</strong></li>';
                            return;
                        }
                        const stats = briefing.dataset.stats;
                        list.innerHTML = '';
                        const impact = stats.byImpact || { Significant: 0, Moderate: 0, Informational: 0 };
                        const items = [
                            { label: 'Total updates', value: stats.totalUpdates || 0 },
                            { label: 'High impact', value: impact.Significant || 0 },
                            { label: 'Moderate', value: impact.Moderate || 0 },
                            { label: 'Informational', value: impact.Informational || 0 }
                        ];
                        items.forEach(item => {
                            const li = document.createElement('li');
                            li.className = 'stat-item';
                            li.innerHTML = '<span>' + escapeHtml(item.label) + '</span><strong>' + escapeHtml(String(item.value)) + '</strong>';
                            list.appendChild(li);
                        });
                    }

                    function renderTimeline(briefing) {
                        const container = document.getElementById('timelineContent');
                        const timeline = briefing && briefing.dataset && briefing.dataset.historyTimeline;
                        if (!timeline || timeline.length === 0) {
                            container.innerHTML = '<div class="empty-state">Timeline populates when a briefing is generated.</div>';
                            return;
                        }
                        container.innerHTML = '';
                        timeline.forEach(entry => {
                            const div = document.createElement('div');
                            div.className = 'timeline-item';
                            div.innerHTML = '<span>' + escapeHtml(formatDate(entry.date)) + '</span><strong>' + escapeHtml(String(entry.count)) + '</strong>';
                            container.appendChild(div);
                        });
                    }

                    function renderChangeDetection(briefing) {
                        const container = document.getElementById('changeContent');
                        const change = briefing && briefing.artifacts && briefing.artifacts.changeDetection;
                        if (!change) {
                            container.innerHTML = '<div class="empty-state">No change analysis yet.</div>';
                            return;
                        }
                        const categories = [
                            { key: 'new_themes', label: 'New Themes' },
                            { key: 'accelerating', label: 'Accelerating' },
                            { key: 'resolving', label: 'Resolving' },
                            { key: 'shifting_focus', label: 'Shifting Focus' },
                            { key: 'correlations', label: 'Correlation Patterns' }
                        ];
                        container.innerHTML = '';
                        categories.forEach(category => {
                            const card = document.createElement('div');
                            card.className = 'change-card';
                            const items = Array.isArray(change[category.key]) ? change[category.key] : [];
                            let html = '<h4>' + escapeHtml(category.label) + '</h4>';
                            if (items.length === 0) {
                                html += '<p style="color:#6b7280;">No items flagged.</p>';
                            } else {
                                html += '<ul>' + items.map(item => {
                                    const confidence = typeof item.confidence === 'number' ? ' (confidence ' + Math.round(item.confidence * 100) + '%)' : '';
                                    const evidence = item.evidence && item.evidence.length ? '<br><small>Evidence: ' + item.evidence.map(id => escapeHtml(String(id))).join(', ') + '</small>' : '';
                                    const notes = item.notes ? '<br><small>' + escapeHtml(item.notes) + '</small>' : '';
                                    return '<li><strong>' + escapeHtml(item.topic || 'Topic') + '</strong>' + confidence + ': ' + escapeHtml(item.summary || '') + evidence + notes + '</li>';
                                }).join('') + '</ul>';
                            }
                            card.innerHTML = html;
                            container.appendChild(card);
                        });
                    }

                    function renderOnePager(briefing) {
                        const container = document.getElementById('onePagerContent');
                        if (!briefing || !briefing.artifacts || !briefing.artifacts.onePager) {
                            container.innerHTML = '<div class="empty-state">Generate a briefing to view the one-pager.</div>';
                            return;
                        }
                        container.innerHTML = formatRichTextClient(briefing.artifacts.onePager, '<div class="empty-state">Generate a briefing to view the one-pager.</div>');
                    }

                    function renderTeamBriefing(briefing) {
                        const container = document.getElementById('teamBriefingContent');
                        if (!briefing || !briefing.artifacts || !briefing.artifacts.teamBriefing) {
                            container.innerHTML = '<div class="empty-state">Team briefing notes appear after generation.</div>';
                            return;
                        }
                        container.innerHTML = formatRichTextClient(briefing.artifacts.teamBriefing, '<div class="empty-state">Team briefing notes appear after generation.</div>');
                    }

                    function renderAnnotations() {
                        if (!annotationListEl) return;

                        const annotations = Array.isArray(state.annotations) ? state.annotations : [];
                        const filtered = annotations.filter(annotation => {
                            if (state.annotationFilter === 'all') return true;
                            return (annotation.status || 'analyzing') === state.annotationFilter;
                        });

                        if (filtered.length === 0) {
                            annotationListEl.innerHTML = '<div class="empty-state">No annotations match the selected view.</div>';
                            return;
                        }

                        annotationListEl.innerHTML = '';
                        filtered.forEach(annotation => {
                            const item = document.createElement('div');
                            item.className = 'annotation-item';
                            const status = annotation.status || 'analyzing';
                            const author = annotation.author || 'Unknown';
                            const timestamp = annotation.updated_at || annotation.created_at;
                            const tags = Array.isArray(annotation.tags) ? annotation.tags : [];
                            const assigned = Array.isArray(annotation.assigned_to) ? annotation.assigned_to : [];
                            const links = Array.isArray(annotation.linked_resources) ? annotation.linked_resources : [];

                            let html = '';
                            html += '<div class="annotation-header">';
                            html += '<span class="annotation-meta">Update ' + escapeHtml(annotation.update_id || 'n/a') + '</span>';
                            html += '<span class="' + statusClass(status) + '">' + statusLabel(status) + '</span>';
                            html += '</div>';

                            const body = escapeHtml(annotation.content || '').replace(/\n/g, '<br>');
                            html += '<div class="annotation-body">' + body + '</div>';
                            html += '<div class="annotation-meta">' + visibilityLabel(annotation.visibility) + ' · ' + escapeHtml(author) + ' · ' + escapeHtml(formatDateTime(timestamp)) + '</div>';

                            if (tags.length > 0) {
                                html += '<div class="annotation-tags">' + tags.map(tag => '<span class="annotation-tag">' + escapeHtml(tag) + '</span>').join('') + '</div>';
                            }

                            if (assigned.length > 0) {
                                html += '<div class="annotation-meta" style="margin-top:6px;">Assigned: ' + assigned.map(escapeHtml).join(', ') + '</div>';
                            }

                            if (links.length > 0) {
                                html += '<div class="annotation-meta" style="margin-top:6px;">Links: ' + links.map(resource => '<a href="' + escapeAttribute(resource) + '" target="_blank">' + escapeHtml(resource) + '</a>').join(', ') + '</div>';
                            }

                            item.innerHTML = html;
                            annotationListEl.appendChild(item);
                        });
                    }

                    function populateAnnotationUpdateOptions() {
                        if (!annotationUpdateOptions) return;
                        annotationUpdateOptions.innerHTML = '';
                        const pool = Array.isArray(state.current?.dataset?.highlightUpdates) && state.current.dataset.highlightUpdates.length > 0
                            ? state.current.dataset.highlightUpdates
                            : state.current?.dataset?.currentUpdates;
                        if (!Array.isArray(pool)) return;
                        const fragment = document.createDocumentFragment();
                        pool.forEach(update => {
                            if (!update || !update.id) return;
                            const option = document.createElement('option');
                            option.value = update.id;
                            const title = update.title ? update.title.slice(0, 60) : 'Untitled update';
                            option.label = update.id + ' - ' + title;
                            fragment.appendChild(option);
                        });
                        annotationUpdateOptions.appendChild(fragment);
                    }

                    function openAnnotationModal() {
                        if (!annotationModal) return;
                        annotationForm.reset();
                        annotationModal.classList.add('visible');
                    }

                    function closeAnnotationModal() {
                        if (!annotationModal) return;
                        annotationModal.classList.remove('visible');
                    }

                    async function refreshAnnotationsFromServer() {
                        const pool = Array.isArray(state.current?.dataset?.highlightUpdates) && state.current.dataset.highlightUpdates.length > 0
                            ? state.current.dataset.highlightUpdates
                            : state.current?.dataset?.currentUpdates;
                        if (!Array.isArray(pool)) return;
                        const ids = pool
                            .map(update => update.id)
                            .filter(Boolean);
                        if (ids.length === 0) {
                            state.annotations = [];
                            renderAnnotations();
                            return;
                        }

                        const visibility = Array.isArray(state.annotationVisibility) && state.annotationVisibility.length > 0
                            ? state.annotationVisibility.join(',')
                            : '';

                        const annotationsUrl = '/api/annotations?updateId=' + encodeURIComponent(ids.join(',')) + '&visibility=' + encodeURIComponent(visibility);
                        const response = await fetch(annotationsUrl);
                        if (!response.ok) {
                            throw new Error('Failed to load annotations');
                        }
                        const payload = await response.json();
                        if (payload.success && Array.isArray(payload.annotations)) {
                            state.annotations = payload.annotations;
                            renderAnnotations();
                        }
                    }

                    async function loadMetrics() {
                        try {
                            const response = await fetch('/api/weekly-briefings/metrics');
                            if (!response.ok) throw new Error('Failed to load metrics');
                            const payload = await response.json();
                            if (payload.success) {
                                state.metrics = payload.metrics;
                                renderMetrics();
                            }
                        } catch (error) {
                            console.warn('Unable to load metrics:', error.message);
                        }
                    }

                    function renderMetrics() {
                        if (!state.metrics) {
                            metricsRunsEl.textContent = '0';
                            metricsCacheEl.textContent = '0%';
                            metricsTokensEl.textContent = '0';
                            metricsDurationEl.textContent = '—';
                            return;
                        }

                        const totals = state.metrics.totals || { runs: 0, cacheHits: 0, totalTokens: 0 };
                        const lastRun = state.metrics.lastRun || null;
                        const runCount = totals.runs || 0;
                        const cacheRate = runCount > 0 ? Math.round(((totals.cacheHits || 0) / runCount) * 100) : 0;
                        metricsRunsEl.textContent = runCount;
                        metricsCacheEl.textContent = cacheRate + '%';
                        metricsTokensEl.textContent = lastRun?.usage?.totalTokens || 0;
                        metricsDurationEl.textContent = formatDuration(lastRun?.durationMs);
                    }
                    function renderRecentBriefings() {
                        const list = document.getElementById('recentBriefingsList');
                        if (!state.recent || state.recent.length === 0) {
                            list.innerHTML = '<li>No previous briefings found</li>';
                            return;
                        }
                        list.innerHTML = '';
                        state.recent.forEach(item => {
                            const li = document.createElement('li');
                            const range = item.dateRange ? formatDate(item.dateRange.start) + ' — ' + formatDate(item.dateRange.end) : 'Unknown period';
                            li.innerHTML = escapeHtml(range) + '<span>' + escapeHtml(formatDateTime(item.generatedAt)) + '</span>';
                            list.appendChild(li);
                        });
                    }

                    function renderMeta(briefing) {
                        if (!briefing) {
                            metaEl.innerHTML = '<span>No briefing assembled yet</span>';
                            printBtn.disabled = true;
                            return;
                        }
                        const parts = [];
                        if (briefing.dateRange) {
                            parts.push('Coverage ' + formatDate(briefing.dateRange.start) + ' — ' + formatDate(briefing.dateRange.end));
                        }
                        parts.push('Generated ' + formatDateTime(briefing.generatedAt));
                        if (briefing.metadata?.totals) {
                            parts.push((briefing.metadata.totals.currentUpdates || 0) + ' updates analysed');
                        }
                        if (Array.isArray(briefing.dataset?.highlightUpdates) && briefing.dataset.highlightUpdates.length) {
                            parts.push(briefing.dataset.highlightUpdates.length + ' priority items surfaced');
                        }
                        if (briefing.dataset?.samplingWindowDays) {
                            parts.push('Sampling window ' + briefing.dataset.samplingWindowDays + ' days');
                        }
                        metaEl.innerHTML = parts.map(text => '<span>' + escapeHtml(text) + '</span>').join('');
                        printBtn.disabled = false;
                    }

                    function renderBriefing(briefing) {
                        console.log('[briefing] renderBriefing invoked', briefing ? {
                            hasArtifacts: Boolean(briefing?.artifacts),
                            hasNarrative: Boolean(briefing?.artifacts?.narrative),
                            highlightUpdates: Array.isArray(briefing?.dataset?.highlightUpdates) ? briefing.dataset.highlightUpdates.length : 0,
                            currentUpdates: Array.isArray(briefing?.dataset?.currentUpdates) ? briefing.dataset.currentUpdates.length : 0
                        } : null);
                        state.current = briefing;
                        state.annotationVisibility = briefing?.metadata?.annotationVisibility || ['team', 'all'];
                        state.annotations = Array.isArray(briefing?.dataset?.annotations)
                            ? briefing.dataset.annotations
                            : [];

                        const highlightSource = Array.isArray(briefing?.dataset?.highlightUpdates) && briefing.dataset.highlightUpdates.length > 0
                            ? briefing.dataset.highlightUpdates
                            : briefing?.dataset?.currentUpdates;

                        const currentUpdates = Array.isArray(highlightSource)
                            ? highlightSource.map(update => ({ ...update }))
                            : [];

                        console.log('[briefing] Received', currentUpdates.length, 'highlighted updates from briefing dataset');

                        if (!state.current.dataset) {
                            state.current.dataset = {};
                        }
                        state.current.dataset.highlightUpdates = currentUpdates.map(update => ({ ...update }));

                        if (typeof window !== 'undefined') {
                            window.initialUpdates = currentUpdates.map(update => ({ ...update }));
                        }

                        if (Array.isArray(window.originalUpdates)) {
                            window.originalUpdates.length = 0;
                            window.originalUpdates.push(...currentUpdates.map(update => ({ ...update })));
                        } else {
                            window.originalUpdates = currentUpdates.map(update => ({ ...update }));
                        }

                        if (Array.isArray(window.filteredUpdates)) {
                            window.filteredUpdates.length = 0;
                            window.filteredUpdates.push(...(window.originalUpdates || []));
                        } else {
                            window.filteredUpdates = (window.originalUpdates || []).map(update => ({ ...update }));
                        }

                        console.log('[briefing] Synced shared update buffers:', {
                            initial: Array.isArray(window.initialUpdates) ? window.initialUpdates.length : 0,
                            original: Array.isArray(window.originalUpdates) ? window.originalUpdates.length : 0,
                            filtered: Array.isArray(window.filteredUpdates) ? window.filteredUpdates.length : 0
                        });

                        if (typeof applyCurrentFilters === 'function') {
                            applyCurrentFilters();
                        } else if (typeof renderUpdatesList === 'function') {
                            renderUpdatesList(window.filteredUpdates || currentUpdates);
                        }

                        renderMeta(briefing);
                        renderNarrative(briefing);
                        renderStats(briefing);
                        renderTimeline(briefing);
                        renderChangeDetection(briefing);
                        renderOnePager(briefing);
                        renderTeamBriefing(briefing);
                        renderAnnotations();
                        populateAnnotationUpdateOptions();
                        renderMetrics();
                    }

                    function hideModal() {
                        modal.classList.remove('visible');
                    }

                    function showModal() {
                        modal.classList.add('visible');
                    }

                    async function loadPreview() {
                        try {
                            previewContent.innerHTML = '<div class="empty-state">Loading weekly snapshot…</div>';
                            const response = await fetch('/api/weekly-roundup/preview');
                            if (!response.ok) throw new Error('Failed to load preview');
                            const data = await response.json();
                            if (!data.success || !data.preview) throw new Error('No preview data available');
                            state.previewRange = { start: data.preview.weekStart, end: data.preview.weekEnd };
                            const impact = data.preview.impactSummary || {};
                            previewContent.innerHTML = [
                                '<div class="preview-grid">',
                                '    <div class="preview-card">',
                                '        <h3>Coverage</h3>',
                                '        <p>' + escapeHtml(formatDate(data.preview.weekStart)) + ' to ' + escapeHtml(formatDate(data.preview.weekEnd)) + '</p>',
                                '    </div>',
                                '    <div class="preview-card">',
                                '        <h3>Total Updates</h3>',
                                '        <p><strong>' + escapeHtml(String(data.preview.totalUpdates)) + '</strong> collected across the period.</p>',
                                '    </div>',
                                '    <div class="preview-card">',
                                '        <h3>Impact Mix</h3>',
                                '        <p>' + escapeHtml(String(impact.significant || 0)) + ' significant, ' + escapeHtml(String(impact.moderate || 0)) + ' moderate.</p>',
                                '    </div>',
                                '</div>',
                                '<p style="margin-top:18px;color:#4b5563;">Generation will reuse cached outputs when inputs match. You can proceed to trigger the Smart Briefing or cancel to adjust data first.</p>'
                            ].join('');
                        } catch (error) {
                            console.error(error);
                            previewContent.innerHTML = '<div class="empty-state">Unable to load preview: ' + escapeHtml(error.message) + '</div>';
                        }
                    }

                    async function triggerRun() {
                        if (!state.previewRange) {
                            showToast('Preview missing. Please reopen the Assemble flow.', 'error');
                            return;
                        }
                        confirmBtn.disabled = true;
                        assembleBtn.disabled = true;
                        showToast('Smart Briefing generation started…', 'info');
                        hideModal();
                        try {
                            const response = await fetch('/api/weekly-briefings/run', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    date_range: state.previewRange,
                                    include_annotations: true,
                                    annotation_visibility: ['team', 'all'],
                                    prompt_version: 'smart-briefing-v1',
                                    force_regenerate: true
                                })
                            });
                            if (!response.ok) throw new Error('Failed to trigger run');
                            const payload = await response.json();
                            if (!payload.success || !payload.status) throw new Error('Run status unavailable');
                            updateRunStatus(payload.status);
                            pollRun(payload.status.runId);
                        } catch (error) {
                            console.error(error);
                            assembleBtn.disabled = false;
                            showToast(error.message || 'Failed to trigger run', 'error', false);
                            updateRunStatus(null);
                            try {
                                console.log('[briefing] Falling back to cached briefing after run failure');
                                await loadLatestBriefing();
                            } catch (loadError) {
                                console.warn('[briefing] Fallback load failed:', loadError.message);
                            }
                        } finally {
                            confirmBtn.disabled = false;
                        }
                    }

                    async function pollRun(runId) {
                        if (!runId) return;
                        if (state.polling) clearInterval(state.polling);
                        state.polling = setInterval(async () => {
                            try {
                                const response = await fetch('/api/weekly-briefings/run/' + runId);
                                if (!response.ok) throw new Error('Status fetch failed');
                                const payload = await response.json();
                                if (!payload.success) throw new Error(payload.error || 'Status error');
                                updateRunStatus(payload.status);
                                if (payload.status.state === 'completed') {
                                    clearInterval(state.polling);
                                    assembleBtn.disabled = false;
                                    await loadLatestBriefing(payload.status.briefingId);
                                    try {
                                        await refreshAnnotationsFromServer();
                                    } catch (error) {
                                        console.warn('Annotation refresh failed:', error.message);
                                    }
                                    await loadMetrics();
                                    showToast(payload.status.cacheHit ? 'Loaded cached briefing.' : 'Smart Briefing generated successfully.', 'success');
                                } else if (payload.status.state === 'failed') {
                                    clearInterval(state.polling);
                                    assembleBtn.disabled = false;
                                    showToast(payload.status.error || 'Briefing generation failed.', 'error', false);
                                }
                            } catch (error) {
                                console.error(error);
                                clearInterval(state.polling);
                                assembleBtn.disabled = false;
                                showToast(error.message || 'Status check failed', 'error', false);
                            }
                        }, 3000);
                    }

                    async function loadLatestBriefing(briefingId) {
                        try {
                            let url = '/api/weekly-briefings/latest';
                            if (briefingId) {
                                url = '/api/weekly-briefings/' + briefingId;
                            }
                            const response = await fetch(url);
                            if (!response.ok) throw new Error('Failed to fetch latest briefing');
                            const payload = await response.json();
                            const briefing = payload.briefing || payload;
                            if (!briefing) throw new Error('No briefing returned');
                            renderBriefing(briefing);
                            state.current = briefing;
                            try {
                                await refreshAnnotationsFromServer();
                            } catch (error) {
                                console.warn('Annotation refresh failed:', error.message);
                            }
                            await refreshRecent();
                            document.title = 'Weekly Smart Briefing ' + formatDate(briefing.dateRange?.start) + ' — ' + formatDate(briefing.dateRange?.end);
                        } catch (error) {
                            console.error(error);
                            showToast(error.message || 'Unable to load latest briefing', 'error');
                        }
                    }

                    async function refreshRecent() {
                        try {
                            const response = await fetch('/api/weekly-briefings?limit=5');
                            if (!response.ok) return;
                            const payload = await response.json();
                            if (payload.success && Array.isArray(payload.briefings)) {
                                state.recent = payload.briefings;
                                renderRecentBriefings();
                            }
                        } catch (error) {
                            console.warn('Unable to refresh recent briefings:', error.message);
                        }
                    }

                    assembleBtn.addEventListener('click', async () => {
                        showModal();
                        await loadPreview();
                    });

                    confirmBtn.addEventListener('click', triggerRun);
                    cancelBtn.addEventListener('click', () => {
                        hideModal();
                    });

                    modal.addEventListener('click', (event) => {
                        if (event.target === modal) hideModal();
                    });

                    printBtn.addEventListener('click', () => {
                        if (state.current) {
                            window.print();
                        }
                    });

                    refreshBtn.addEventListener('click', async () => {
                        assembleBtn.disabled = true;
                        try {
                            await loadLatestBriefing();
                            try {
                                await refreshAnnotationsFromServer();
                            } catch (error) {
                                console.warn('Annotation refresh failed:', error.message);
                            }
                            await loadMetrics();
                            showToast('Latest briefing refreshed.', 'success');
                        } catch (error) {
                            console.error(error);
                        } finally {
                            assembleBtn.disabled = false;
                        }
                    });

                    if (annotationFilterEl) {
                        annotationFilterEl.addEventListener('change', () => {
                            state.annotationFilter = annotationFilterEl.value || 'all';
                            renderAnnotations();
                        });
                    }

                    if (addAnnotationBtn) {
                        addAnnotationBtn.addEventListener('click', () => {
                            populateAnnotationUpdateOptions();
                            openAnnotationModal();
                        });
                    }

                    if (cancelAnnotationBtn) {
                        cancelAnnotationBtn.addEventListener('click', event => {
                            event.preventDefault();
                            closeAnnotationModal();
                        });
                    }

                    if (annotationModal) {
                        annotationModal.addEventListener('click', event => {
                            if (event.target === annotationModal) {
                                closeAnnotationModal();
                            }
                        });
                    }

                    if (annotationForm) {
                        annotationForm.addEventListener('submit', async event => {
                            event.preventDefault();
                            const formData = new FormData(annotationForm);
                            const body = {
                                update_id: formData.get('update_id'),
                                visibility: formData.get('visibility') || 'team',
                                status: formData.get('status') || 'analyzing',
                                content: formData.get('content') || '',
                                tags: (formData.get('tags') || '')
                                    .split(',')
                                    .map(tag => tag.trim())
                                    .filter(Boolean),
                                assigned_to: (formData.get('assigned_to') || '')
                                    .split(',')
                                    .map(value => value.trim())
                                    .filter(Boolean),
                                linked_resources: (formData.get('linked_resources') || '')
                                    .split(',')
                                    .map(value => value.trim())
                                    .filter(Boolean)
                            };

                            if (!body.update_id || !body.content) {
                                showToast('Update ID and content are required.', 'error');
                                return;
                            }

                            try {
                                const response = await fetch('/api/annotations', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(body)
                                });
                                if (!response.ok) throw new Error('Failed to save annotation');
                                const payload = await response.json();
                                if (!payload.success) throw new Error(payload.error || 'Failed to save annotation');

                                closeAnnotationModal();
                                showToast('Annotation saved.', 'success');
                                try {
                                    await refreshAnnotationsFromServer();
                                } catch (error) {
                                    console.warn('Annotation refresh failed:', error.message);
                                }
                            } catch (error) {
                                console.error(error);
                                showToast(error.message || 'Failed to save annotation', 'error', false);
                            }
                        });
                    }

                    if (state.current) {
                        renderBriefing(state.current);
                        refreshAnnotationsFromServer().catch(error => {
                            console.warn('Annotation refresh failed:', error.message);
                        });
                    } else {
                        loadLatestBriefing().catch(error => {
                            console.warn('Initial briefing load failed:', error.message);
                        });
                    }

                    renderRecentBriefings();
                    loadMetrics();
                })();
            </script>
        </body>
        </html>
    `

    res.send(html)
  } catch (error) {
    console.error('Error rendering weekly smart briefing page:', error)
    res.status(500).send(`
            <div style="padding: 2rem; text-align: center; font-family: system-ui;">
                <h1>Error - Weekly Smart Briefing</h1>
                <p style="color: #6b7280; margin: 1rem 0;">${error.message}</p>
                <a href="/dashboard" style="color: #3b82f6; text-decoration: none;">&lt;- Back to Dashboard</a>
            </div>
        `)
  }
}
