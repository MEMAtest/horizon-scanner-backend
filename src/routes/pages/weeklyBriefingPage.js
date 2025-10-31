// Weekly Smart Briefing Page Renderer

const smartBriefingService = require('../../services/smartBriefingService')
const { getSidebar } = require('../templates/sidebar')
const { getCommonStyles } = require('../templates/commonStyles')
const { getClientScripts } = require('../templates/clientScripts')

const MAX_HIGHLIGHT_UPDATES = 10
const MAX_UPDATES_PER_GROUP = 4

// const HIGHLIGHT_THEMES = {
//   enforcement: {
//     key: 'enforcement',
//     label: 'Enforcements & Penalties',
//     accent: '#dc2626',
//     tint: '#fee2e2'
//   },
//   consultation: {
//     key: 'consultation',
//     label: 'Consultations & Calls for Input',
//     accent: '#0284c7',
//     tint: '#e0f2fe'
//   },
//   speech: {
//     key: 'speech',
//     label: 'Speeches & Remarks',
//     accent: '#7c3aed',
//     tint: '#ede9fe'
//   },
//   other: {
//     key: 'other',
//     label: 'Strategic Signals',
//     accent: '#334155',
//     tint: '#e2e8f0'
//   }
// }

// const HIGHLIGHT_CATEGORY_ORDER = ['enforcement', 'consultation', 'speech', 'other']

// function normalizeText(value) {
//   return typeof value === 'string' ? value.toLowerCase() : ''
// }

function highlightContains(text, patterns) {
  if (!text) return false
  return patterns.some(pattern => text.includes(pattern))
}

// function classifyHighlight(update) {
//   const title = normalizeText(update?.title)
//   const summary = normalizeText(update?.summary)
//   const joinedTags = Array.isArray(update?.tags) ? normalizeText(update.tags.join(' ')) : ''
//   const combined = [title, summary, joinedTags].filter(Boolean).join(' ')

//   if (highlightContains(combined, ['enforcement', 'penalty', 'penalties', 'fine', 'fined', 'sanction', 'ban', 'prohibition', 'censure', 'disciplinary'])) {
//     return 'enforcement'
//   }
//   if (highlightContains(combined, ['consultation', 'call for evidence', 'feedback statement', 'discussion paper', 'request for comment', 'call for views'])) {
//     return 'consultation'
//   }
//   if (highlightContains(combined, ['speech', 'speaking', 'remarks', 'address', 'keynote', 'fireside', 'conference', 'summit'])) {
//     return 'speech'
//   }
//   return 'other'
// }

function classifyCardTheme(update) {
  const text = [
    update.title,
    update.summary,
    Array.isArray(update.tags) ? update.tags.join(' ') : ''
  ].filter(Boolean).join(' ').toLowerCase()

  if (highlightContains(text, ['enforcement', 'penalty', 'penalties', 'fine', 'fined', 'sanction', 'ban', 'prohibition', 'censure', 'disciplinary'])) {
    return { key: 'enforcement', label: 'Enforcement action' }
  }
  if (highlightContains(text, ['consultation', 'call for evidence', 'feedback statement', 'discussion paper', 'request for comment', 'call for views'])) {
    return { key: 'consultation', label: 'Consultation insight' }
  }
  if (highlightContains(text, ['speech', 'remarks', 'address', 'keynote', 'fireside', 'conference', 'summit'])) {
    return { key: 'speech', label: 'Leadership remarks' }
  }
  return { key: 'other', label: 'Strategic signal' }
}

function slugify(value) {
  const normalized = typeof value === 'string' ? value.toLowerCase() : ''
  const slug = normalized.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  return slug || 'info'
}

function buildUpdateCardHtml(update) {
  const theme = classifyCardTheme(update)
  const authority = escapeHtml(update.authority || 'Unknown authority')
  const date = escapeHtml(formatDateDisplay(update.published_date))
  const headline = (update.title || update.headline || '').trim()
  const aiSummary = (update.ai_summary || '').trim()
  const summarySource = (aiSummary || update.summary || '').replace(/\s+/g, ' ').trim()
  const summary = truncateText(summarySource, 320) || 'Summary not available.'
  const impactLevel = update.impact_level || 'Informational'
  const urgency = update.urgency || 'Low'
  const impactKey = slugify(impactLevel)
  const urgencyKey = slugify(urgency)
  const regulatoryArea = update.regulatory_area || update.regulatoryArea || ''
  const idAttr = escapeAttribute(String(update.id || ''))
  const urlAttr = escapeAttribute(update.url || '')
  const headlineAttr = escapeAttribute(headline)
  const summaryAttr = escapeAttribute(summarySource)
  const authorityAttr = escapeAttribute(update.authority || '')
  const impactAttr = escapeAttribute(impactLevel)
  const urgencyAttr = escapeAttribute(urgency)
  const publishedAttr = escapeAttribute(update.published_date || update.publishedDate || update.created_at || '')
  const regulatoryAttr = escapeAttribute(regulatoryArea)
  const titleHtml = headline
    ? `<h3 class="update-card__title"><a href="${escapeAttribute(update.url || '#')}" target="_blank" rel="noopener">${escapeHtml(headline)}</a></h3>`
    : '<h3 class="update-card__title update-card__title--empty">No headline provided</h3>'
  const summaryHtml = `<p class="update-card__summary">${escapeHtml(summary)}</p>`
  const scoreHtml = update.business_impact_score
    ? `<span class="meta-pill score-pill">Impact score: ${escapeHtml(String(update.business_impact_score))}</span>`
    : ''
  const linkHtml = update.url
    ? `<a class="update-card__source" href="${escapeAttribute(update.url)}" target="_blank" rel="noopener">View source</a>`
    : ''

  return `
    <div class="update-card" data-update-id="${idAttr}" data-update-url="${urlAttr}" data-id="${idAttr}" data-url="${urlAttr}" data-headline="${headlineAttr}" data-summary="${summaryAttr}" data-authority="${authorityAttr}" data-impact="${impactAttr}" data-urgency="${urgencyAttr}" data-published="${publishedAttr}" data-regulatory-area="${regulatoryAttr}">
      <header class="update-card__top">
        <div class="update-card__chips">
          <span class="update-chip authority-chip">${authority}</span>
          <span class="update-chip date-chip">${date}</span>
        </div>
        <span class="update-chip category-chip category-${theme.key}">${escapeHtml(theme.label)}</span>
      </header>
      <div class="update-card__title-row">
        ${titleHtml}
      </div>
      ${summaryHtml}
      <div class="update-card__meta-row">
        <span class="meta-pill impact-${impactKey}">Impact: ${escapeHtml(impactLevel)}</span>
        <span class="meta-pill urgency-${urgencyKey}">Urgency: ${escapeHtml(urgency)}</span>
        ${scoreHtml}
      </div>
      <footer class="update-card__footer">
        <div class="update-card__actions">
          <button class="action-btn update-action-btn bookmark-btn" data-update-id="${idAttr}" title="Bookmark" aria-label="Bookmark"><svg width="16" height="16" fill="currentColor"><path d="M3 3a2 2 0 012-2h6a2 2 0 012 2v11l-5-3-5 3V3z"/></svg></button>
          <button class="action-btn update-action-btn share-btn" data-update-id="${idAttr}" data-update-url="${urlAttr}" title="Share" aria-label="Share"><svg width="16" height="16" fill="currentColor"><path d="M11 2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zm-9 9a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0zm9 0a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0z"/></svg></button>
          <button class="action-btn update-action-btn details-btn" data-update-id="${idAttr}" data-update-url="${urlAttr}" title="View details" aria-label="View details"><svg width="16" height="16" fill="currentColor"><path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/><path fill-rule="evenodd" d="M1.38 8C2.77 5.44 5.23 3.5 8 3.5c2.77 0 5.23 1.94 6.62 4.5-1.39 2.56-3.85 4.5-6.62 4.5-2.77 0-5.23-1.94-6.62-4.5zm9.12 0a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/></svg></button>
          <button class="action-btn update-action-btn quick-note-btn" data-update-id="${idAttr}" data-update-url="${urlAttr}" title="Create quick note" aria-label="Create quick note"><svg width="16" height="16" fill="currentColor"><path d="M4 1.5H3a2 2 0 00-2 2V14a2 2 0 002 2h10a2 2 0 002-2V3.5a2 2 0 00-2-2h-1v1h1a1 1 0 011 1V14a1 1 0 01-1 1H3a1 1 0 01-1-1V3.5a1 1 0 011-1h1v-1z"/><path d="M9.5 1a.5.5 0 01.5.5v1a.5.5 0 01-.5.5h-3a.5.5 0 01-.5-.5v-1a.5.5 0 01.5-.5h3zm-3-1A1.5 1.5 0 005 1.5v1A1.5 1.5 0 006.5 4h3A1.5 1.5 0 0011 2.5v-1A1.5 1.5 0 009.5 0h-3z"/></svg></button>
        </div>
        ${linkHtml}
      </footer>
    </div>
  `
}

function truncateText(value, limit = 220) {
  if (!value) return ''
  const trimmed = value.trim()
  if (trimmed.length <= limit) return trimmed
  return `${trimmed.slice(0, Math.max(0, limit - 1)).trim()}…`
}

// function buildHighlightMetaChips(update) {
//   const impact = (update?.impact_level || 'Informational').toString()
//   const urgency = (update?.urgency || 'Low').toString()
//   const impactKey = impact.toLowerCase().replace(/[^a-z]+/g, '-')
//   const urgencyKey = urgency.toLowerCase().replace(/[^a-z]+/g, '-')
//   const chips = [
//     `<span class="highlight-chip impact-${impactKey}">Impact: ${escapeHtml(impact)}</span>`,
//     `<span class="highlight-chip urgency-${urgencyKey}">Urgency: ${escapeHtml(urgency)}</span>`
//   ]
//   if (update?.business_impact_score) {
//     chips.push(`<span class="highlight-chip score">Impact score: ${escapeHtml(String(update.business_impact_score))}</span>`)
//   }
//   return chips.join('')
// }

// function buildHighlightCard(update, categoryKey) {
//   const theme = HIGHLIGHT_THEMES[categoryKey] || HIGHLIGHT_THEMES.other
//   const authority = escapeHtml(update?.authority || 'Unknown authority')
//   const date = escapeHtml(formatDateDisplay(update?.published_date))
//   const title = (update?.title || '').trim()
//   const titleClass = title ? 'highlight-title' : 'highlight-title highlight-title--empty'
//   const safeTitle = title ? escapeHtml(title) : 'No headline provided'
//   const summary = truncateText(update?.summary || '', 220)
//   const summaryHtml = summary ? escapeHtml(summary) : 'Summary not available.'
//   const metaChips = buildHighlightMetaChips(update)
//   const link = update?.url
//     ? `<a class="highlight-link" href="${escapeAttribute(update.url)}" target="_blank" rel="noopener">View source</a>`
//     : ''

//   return `
//     <article class="highlight-card highlight-card--${theme.key}">
//       <header class="highlight-card__header">
//         <span class="highlight-chip authority">${authority}</span>
//         <span class="highlight-chip date">${date}</span>
//       </header>
//       <div class="highlight-card__meta">${metaChips}</div>
//       <h3 class="${titleClass}">${safeTitle}</h3>
//       <p class="highlight-summary">${summaryHtml}</p>
//       ${link ? `<footer class="highlight-card__footer">${link}</footer>` : ''}
//     </article>
//   `
// }

// function buildHighlightGroup(key, items) {
//   const theme = HIGHLIGHT_THEMES[key] || HIGHLIGHT_THEMES.other
//   const limitedItems = items.slice(0, MAX_UPDATES_PER_GROUP)
//   const cards = limitedItems.map(item => buildHighlightCard(item, key)).join('')
//   return `
//     <section class="highlight-group highlight-group--${theme.key}">
//       <header class="highlight-group__header" style="--highlight-accent:${theme.accent};--highlight-tint:${theme.tint}">
//         <span class="highlight-pill">${escapeHtml(theme.label)}</span>
//         <span class="highlight-count">${items.length} highlight${items.length === 1 ? '' : 's'}</span>
//       </header>
//       <div class="highlight-list">
//         ${cards}
//       </div>
//     </section>
//   `
// }

const ONE_PAGER_ICONS = {
  radar: `
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" focusable="false">
        <g fill="none" stroke="currentColor" stroke-width="1.6">
          <circle cx="14" cy="14" r="11" opacity="0.2"></circle>
          <circle cx="14" cy="14" r="7" opacity="0.35"></circle>
          <circle cx="14" cy="14" r="3"></circle>
          <path d="M14 3v4"></path>
          <path d="M20.5 7.5l-2.8 2.8"></path>
          <path d="M24 14h-4"></path>
        </g>
      </svg>
  `,
  alert: `
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" focusable="false">
        <g fill="none" stroke="currentColor" stroke-width="1.6">
          <path d="M14 4l10 18H4z" opacity="0.25"></path>
          <path d="M14 10v6" stroke-linecap="round"></path>
          <circle cx="14" cy="19.5" r="1.2" fill="currentColor" stroke="none"></circle>
        </g>
      </svg>
  `,
  clock: `
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" focusable="false">
        <g fill="none" stroke="currentColor" stroke-width="1.6">
          <circle cx="14" cy="14" r="10" opacity="0.25"></circle>
          <path d="M14 8v6l4 2" stroke-linecap="round"></path>
        </g>
      </svg>
  `,
  building: `
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" focusable="false">
        <g fill="none" stroke="currentColor" stroke-width="1.6">
          <rect x="6" y="9" width="16" height="14" rx="1.6" opacity="0.25"></rect>
          <path d="M10 9V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4" opacity="0.4"></path>
          <path d="M10 14.5h2m4 0h2m-8 4h2m4 0h2" stroke-linecap="round"></path>
        </g>
      </svg>
  `
}

function getOnePagerIcon(key) {
  return ONE_PAGER_ICONS[key] || ''
}

function formatDateTimeDisplay(value) {
  if (!value) return 'Unknown'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Unknown'
  return parsed.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function buildOnePagerMetrics(briefing) {
  const stats = briefing?.dataset?.stats || {}
  const impact = stats.byImpact || {}
  const updatesPool = Array.isArray(briefing?.dataset?.highlightUpdates) && briefing.dataset.highlightUpdates.length > 0
    ? briefing.dataset.highlightUpdates
    : briefing?.dataset?.currentUpdates || []

  const urgentCount = Array.isArray(updatesPool)
    ? updatesPool.filter(update => {
      const urgency = (update?.urgency || '').toString().toLowerCase()
      return urgency.includes('high') || urgency.includes('urgent')
    }).length
    : 0

  const authoritiesCount = Array.isArray(updatesPool)
    ? Array.from(new Set(updatesPool.map(update => update?.authority).filter(Boolean))).length
    : 0

  return [
    {
      icon: 'radar',
      value: stats.totalUpdates ?? 0,
      label: 'Updates monitored',
      helper: 'Tracked this cycle'
    },
    {
      icon: 'alert',
      value: impact.Significant ?? 0,
      label: 'High-impact notices',
      helper: 'Require immediate review'
    },
    {
      icon: 'clock',
      value: urgentCount,
      label: 'Urgent signals',
      helper: 'Flagged for rapid follow-up'
    },
    {
      icon: 'building',
      value: authoritiesCount,
      label: 'Active authorities',
      helper: 'Issuing updates this week'
    }
  ]
}

function stylizeOnePagerBody(html) {
  if (!html) return ''
  return html
    .replace(/<h4>/g, '<h3 class="one-pager__heading">')
    .replace(/<\/h4>/g, '</h3>')
}

function buildOnePagerHighlights(briefing) {
  const pool = Array.isArray(briefing?.dataset?.highlightUpdates) && briefing.dataset.highlightUpdates.length > 0
    ? briefing.dataset.highlightUpdates
    : briefing?.dataset?.currentUpdates || []
  if (!Array.isArray(pool) || pool.length === 0) return ''

  const topThree = pool.slice(0, 3)
  const items = topThree.map(item => {
    const authority = escapeHtml(item?.authority || 'Unknown authority')
    const title = escapeHtml(item?.title || 'No headline provided')
    const date = escapeHtml(formatDateDisplay(item?.published_date))
    return `
      <li class="executive-highlight">
        <span class="executive-highlight__authority">${authority}</span>
        <span class="executive-highlight__title">${title}</span>
        <span class="executive-highlight__meta">${date}</span>
      </li>
    `
  }).join('')

  return `
    <section class="executive-sheet__spotlights">
      <h3 class="executive-sheet__section-title">Spotlight Briefings</h3>
      <ul class="executive-highlight-list">
        ${items}
      </ul>
    </section>
  `
}

function buildExecutiveOnePager(briefing) {
  if (!briefing?.artifacts?.onePager) {
    return '<div class="empty-state">Generate a briefing to view the one-pager.</div>'
  }

  const metrics = buildOnePagerMetrics(briefing)
  const metricCards = metrics.map(metric => `
        <div class="executive-metric">
          <div class="executive-metric__icon">${getOnePagerIcon(metric.icon)}</div>
          <div class="executive-metric__content">
            <span class="executive-metric__value">${escapeHtml(String(metric.value ?? '—'))}</span>
            <span class="executive-metric__label">${escapeHtml(metric.label)}</span>
            ${metric.helper ? `<span class="executive-metric__helper">${escapeHtml(metric.helper)}</span>` : ''}
          </div>
        </div>
  `).join('')

  const coverage = briefing?.dateRange
    ? `${formatDateDisplay(briefing.dateRange.start)} — ${formatDateDisplay(briefing.dateRange.end)}`
    : 'Period unavailable'
  const generated = formatDateTimeDisplay(briefing?.generatedAt)
  const bodyHtml = stylizeOnePagerBody(briefing.artifacts.onePager)
  const spotlights = buildOnePagerHighlights(briefing)

  return `
    <article class="executive-sheet">
      <header class="executive-sheet__masthead">
        <div class="executive-sheet__brand">
          <div class="executive-sheet__mark">HS</div>
          <div>
            <div class="executive-sheet__brand-name">Horizon Scanner</div>
            <div class="executive-sheet__brand-subtitle">Weekly Smart Brief</div>
          </div>
        </div>
        <div class="executive-sheet__meta">
          <div class="executive-sheet__meta-item">
            <span class="executive-sheet__meta-label">Coverage</span>
            <span class="executive-sheet__meta-value">${escapeHtml(coverage)}</span>
          </div>
          <div class="executive-sheet__meta-item">
            <span class="executive-sheet__meta-label">Published</span>
            <span class="executive-sheet__meta-value">${escapeHtml(generated)}</span>
          </div>
        </div>
      </header>
      <section class="executive-sheet__metrics">
        ${metricCards}
      </section>
      ${spotlights}
      <section class="executive-sheet__body">
        ${bodyHtml}
      </section>
    </article>
  `
}

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
  return buildExecutiveOnePager(briefing)
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

  const cards = updates.map(update => buildUpdateCardHtml(update)).join('')
  return cards
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
                    gap: 18px;
                    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                }
                .updates-container.highlight-mode {
                    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                }
                .update-card {
                    border: 1px solid #e2e8f0 !important;
                    border-radius: 20px;
                    padding: 22px 24px;
                    background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%) !important;
                    box-shadow: 0 28px 60px -40px rgba(30, 41, 59, 0.5) !important;
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .update-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 32px 70px -42px rgba(30, 64, 175, 0.45) !important;
                }
                .update-card__top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 12px;
                    flex-wrap: wrap;
                }
                .update-card__chips {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                .update-card__title-row {
                    margin: 0;
                }
                .update-chip {
                    display: inline-flex;
                    align-items: center;
                    padding: 4px 12px;
                    border-radius: 999px;
                    font-size: 0.78rem;
                    font-weight: 600;
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                    background: #f1f5f9;
                    color: #1f2937;
                }
                .authority-chip {
                    background: #e0e7ff;
                    color: #1d4ed8;
                }
                .date-chip {
                    background: #f8fafc;
                    color: #475569;
                }
                .category-chip {
                    background: #ede9fe;
                    color: #6d28d9;
                }
                .category-chip.category-enforcement {
                    background: #fee2e2;
                    color: #b91c1c;
                }
                .category-chip.category-consultation {
                    background: #e0f2fe;
                    color: #0369a1;
                }
                .category-chip.category-speech {
                    background: #ede9fe;
                    color: #6d28d9;
                }
                .category-chip.category-other {
                    background: #e2e8f0;
                    color: #334155;
                }
                .update-card__title {
                    margin: 0;
                    font-size: 1.05rem;
                    font-weight: 600;
                    color: #111827;
                }
                .update-card__title a {
                    color: inherit;
                    text-decoration: none;
                }
                .update-card__title a:hover {
                    text-decoration: underline;
                }
                .update-card__title--empty {
                    color: #64748b;
                    font-style: italic;
                }
                .update-card__summary {
                    margin: 0;
                    color: #475569;
                    line-height: 1.55;
                    font-size: 0.95rem;
                }
                .update-card__meta-row {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                }
                .meta-pill {
                    display: inline-flex;
                    align-items: center;
                    padding: 6px 12px;
                    border-radius: 12px;
                    font-size: 0.78rem;
                    font-weight: 600;
                    letter-spacing: 0.04em;
                    background: #f1f5f9;
                    color: #1e293b;
                }
                .meta-pill.impact-significant,
                .meta-pill.impact-high,
                .meta-pill.impact-hot-high-impact-10-10 {
                    background: #fee2e2;
                    color: #b91c1c;
                }
                .meta-pill.impact-moderate {
                    background: #fef3c7;
                    color: #b45309;
                }
                .meta-pill.urgency-high,
                .meta-pill.urgency-alert-urgent {
                    background: #fee2e2;
                    color: #b91c1c;
                }
                .meta-pill.urgency-medium {
                    background: #fef3c7;
                    color: #b45309;
                }
                .meta-pill.urgency-low {
                    background: #dcfce7;
                    color: #166534;
                }
                .meta-pill.score-pill {
                    background: #fef9c3;
                    color: #92400e;
                }
                .update-card__footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 12px;
                    margin-top: 4px;
                }
                .update-card__actions {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }
                .update-action-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 12px;
                    border-radius: 10px;
                    border: 1px solid #cbd5e1;
                    background: #ffffff;
                    color: #1f2937;
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.18s ease;
                }
                .update-action-btn:hover {
                    background: #f1f5f9;
                }
                .update-card__source {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: #1d4ed8;
                    text-decoration: none;
                }
                .update-card__source::after {
                    content: '↗';
                    font-size: 0.8em;
                    margin-left: 4px;
                }
                .quick-note-modal {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .quick-note-grid {
                    display: grid;
                    gap: 12px;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                }
                .quick-note-grid label {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    font-size: 0.85rem;
                    color: #475569;
                }
                .quick-note-grid input {
                    border: 1px solid #cbd5e1;
                    border-radius: 8px;
                    padding: 8px 10px;
                    font-size: 0.9rem;
                    color: #0f172a;
                    background: #ffffff;
                }
                #quickNoteContent {
                    width: 100%;
                    border: 1px solid #cbd5e1;
                    border-radius: 10px;
                    padding: 12px;
                    font-size: 0.95rem;
                    line-height: 1.5;
                    resize: vertical;
                    min-height: 220px;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                    color: #0f172a;
                }
                .quick-note-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    flex-wrap: wrap;
                    width: 100%;
                }
                .quick-note-actions .btn-secondary {
                    background: #f1f5f9;
                    color: #1f2937;
                    border: 1px solid #cbd5e1;
                }
                .quick-note-actions .btn-secondary:hover {
                    background: #e2e8f0;
                }
                .preview-note {
                    margin: 0;
                    font-size: 0.85rem;
                    color: #475569;
                }
                .preview-modal {
                    display: flex;
                    flex-direction: column;
                    gap: 18px;
                }
                .preview-controls {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 16px;
                    align-items: flex-end;
                    border-bottom: 1px solid #e2e8f0;
                    padding-bottom: 18px;
                }
                .preview-field {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    font-size: 0.85rem;
                    color: #475569;
                }
                .preview-field input {
                    border: 1px solid #cbd5e1;
                    border-radius: 8px;
                    padding: 8px 10px;
                    font-size: 0.9rem;
                    color: #0f172a;
                    background: #ffffff;
                }
                .preview-quick {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                .preview-quick-btn {
                    border: 1px solid #cbd5e1;
                    border-radius: 10px;
                    padding: 6px 12px;
                    background: #ffffff;
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: #1f2937;
                    cursor: pointer;
                    transition: all 0.18s ease;
                }
                .preview-quick-btn:hover {
                    background: #e0e7ff;
                    border-color: #1d4ed8;
                    color: #1d4ed8;
                }
                .preview-options {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                    flex-wrap: wrap;
                    margin-left: auto;
                }
                .preview-checkbox {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.85rem;
                    color: #475569;
                }
                .preview-checkbox input {
                    width: 16px;
                    height: 16px;
                }
                .preview-refresh {
                    margin-left: auto;
                }
                .preview-summary {
                    display: grid;
                    gap: 14px;
                }
                .preview-grid {
                    display: grid;
                    gap: 12px;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                }
                .preview-stat {
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 16px;
                    background: #f8fafc;
                }
                .preview-stat__label {
                    display: block;
                    font-size: 0.78rem;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    color: #64748b;
                    margin-bottom: 6px;
                }
                .preview-stat__value {
                    display: block;
                    font-size: 1.15rem;
                    font-weight: 700;
                    color: #1f2937;
                }
                .preview-highlight-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    display: grid;
                    gap: 10px;
                }
                .preview-highlight-list li {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 12px;
                    padding-bottom: 8px;
                    border-bottom: 1px solid #e2e8f0;
                    font-size: 0.9rem;
                    color: #334155;
                }
                .preview-highlight-list li:last-child {
                    border-bottom: none;
                    padding-bottom: 0;
                }
                .preview-highlight-authority {
                    font-weight: 600;
                    color: #1d4ed8;
                }
                .preview-highlight-meta {
                    font-size: 0.8rem;
                    color: #94a3b8;
                }
                .preview-note {
                    margin: 0;
                    font-size: 0.85rem;
                    color: #475569;
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
                .team-briefing h4 {
                    margin: 18px 0 10px;
                    font-size: 1rem;
                    font-weight: 600;
                    color: #0f172a;
                }
                .team-briefing ul {
                    margin: 0 0 12px;
                    padding-left: 18px;
                    color: #475569;
                    line-height: 1.55;
                }
                .team-briefing ul li {
                    margin-bottom: 6px;
                }
                .executive-sheet {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 24px;
                    padding: 32px 36px;
                    box-shadow: 0 32px 60px -42px rgba(30, 41, 59, 0.45);
                    display: flex;
                    flex-direction: column;
                    gap: 28px;
                    color: #0f172a;
                }
                .executive-sheet__masthead {
                    display: flex;
                    justify-content: space-between;
                    gap: 24px;
                    border-bottom: 1px solid #e2e8f0;
                    padding-bottom: 20px;
                }
                .executive-sheet__brand {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .executive-sheet__mark {
                    width: 46px;
                    height: 46px;
                    border-radius: 14px;
                    background: linear-gradient(135deg, #1d4ed8 0%, #312e81 100%);
                    color: #ffffff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    letter-spacing: 0.08em;
                    font-size: 0.95rem;
                }
                .executive-sheet__brand-name {
                    font-size: 1.25rem;
                    font-weight: 700;
                    letter-spacing: 0.02em;
                }
                .executive-sheet__brand-subtitle {
                    font-size: 0.9rem;
                    color: #64748b;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                }
                .executive-sheet__meta {
                    display: grid;
                    gap: 10px;
                    align-content: flex-start;
                    min-width: 220px;
                }
                .executive-sheet__meta-item {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .executive-sheet__meta-label {
                    font-size: 0.8rem;
                    font-weight: 600;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    color: #94a3b8;
                }
                .executive-sheet__meta-value {
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: #1f2937;
                }
                .executive-sheet__metrics {
                    display: grid;
                    gap: 18px;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                }
                .executive-metric {
                    display: flex;
                    gap: 14px;
                    padding: 18px 20px;
                    border: 1px solid #e2e8f0;
                    border-radius: 18px;
                    background: #f8fafc;
                    box-shadow: 0 18px 32px -30px rgba(15, 23, 42, 0.35);
                }
                .executive-metric__icon {
                    width: 44px;
                    height: 44px;
                    border-radius: 14px;
                    background: #e0e7ff;
                    color: #1d4ed8;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .executive-metric__icon svg {
                    width: 26px;
                    height: 26px;
                }
                .executive-metric__content {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .executive-metric__value {
                    font-size: 1.65rem;
                    font-weight: 700;
                    color: #0f172a;
                    letter-spacing: -0.01em;
                }
                .executive-metric__label {
                    font-size: 0.95rem;
                    color: #334155;
                    font-weight: 600;
                }
                .executive-metric__helper {
                    font-size: 0.8rem;
                    color: #64748b;
                }
                .executive-sheet__spotlights {
                    border: 1px solid #e2e8f0;
                    border-radius: 18px;
                    padding: 20px 22px;
                    background: #ffffff;
                }
                .executive-sheet__section-title {
                    margin: 0 0 12px;
                    font-size: 1rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: #1f2937;
                }
                .executive-highlight-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    display: grid;
                    gap: 12px;
                }
                .executive-highlight {
                    display: grid;
                    grid-template-columns: minmax(0, 160px) minmax(0, 1fr) auto;
                    gap: 12px;
                    align-items: center;
                    padding: 8px 0;
                    border-bottom: 1px solid #e2e8f0;
                }
                .executive-highlight:last-child {
                    border-bottom: none;
                }
                .executive-highlight__authority {
                    font-weight: 600;
                    color: #1d4ed8;
                    font-size: 0.9rem;
                }
                .executive-highlight__title {
                    font-size: 0.95rem;
                    color: #334155;
                }
                .executive-highlight__meta {
                    font-size: 0.8rem;
                    color: #94a3b8;
                    text-align: right;
                }
                .executive-sheet__body {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .one-pager {
                    display: grid;
                    gap: 18px;
                }
                .one-pager__heading {
                    margin: 0 0 8px;
                    font-size: 1.05rem;
                    font-weight: 700;
                    letter-spacing: 0.04em;
                    text-transform: uppercase;
                    color: #1f2937;
                }
                .one-pager p {
                    margin: 0;
                    font-size: 0.95rem;
                    color: #334155;
                    line-height: 1.6;
                }
                .one-pager ul {
                    margin: 0;
                    padding-left: 20px;
                    font-size: 0.95rem;
                    color: #334155;
                    line-height: 1.6;
                }
                .one-pager ul li {
                    margin-bottom: 8px;
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
                    body { background: #ffffff !important; margin: 0 !important; }
                    .app-container { display: block !important; background: #ffffff !important; }
                    .sidebar, .briefing-toolbar, .run-status, .status-banner, .modal-backdrop, .briefing-header, .briefing-layout:first-of-type, .briefing-layout:nth-of-type(2) { display: none !important; }
                    .main-content { margin: 0 !important; padding: 0 !important; box-shadow: none !important; border: none !important; background: #ffffff !important; }
                    .card { display: none !important; }
                    #onePagerCard { display: block !important; border: none !important; box-shadow: none !important; padding: 0 !important; }
                    #onePagerCard h2 { display: none !important; }
                    #onePagerCard .executive-sheet { border: none !important; box-shadow: none !important; padding: 24px 32px !important; }
                    #onePagerCard .executive-metric { background: #f5f7fb !important; box-shadow: none !important; border: 1px solid #e2e8f0 !important; }
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

                    <section class="card" id="onePagerCard" style="margin-bottom:24px;">
                        <h2>Executive One-Pager</h2>
                        <div class="narrative-content" id="onePagerContent">
                            ${initialOnePagerHtml}
                        </div>
                    </section>

                    <div class="briefing-layout">
                        <section class="card" id="narrativeCard">
                            <h2>Week's Story</h2>
                            <div class="narrative-content" id="narrativeContent">
                                ${initialNarrativeHtml}
                            </div>
                            <div class="updates-card">
                                <h3 style="margin-top:24px;">Flagged Updates</h3>
                                <div class="updates-container cards-view" id="updates-container">
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
                    <section class="card" style="margin-top:24px;">
                        <h2>Team Briefing</h2>
                        <div class="narrative-content" id="teamBriefingContent">
                            ${initialTeamBriefingHtml}
                        </div>
                    </section>
                </main>
            </div>

            <div class="modal-backdrop" id="assembleModal">
                <div class="modal">
                    <header>
                        <h2>Assemble This Week</h2>
                        <p style="margin:6px 0 0;color:#6b7280;font-size:0.95rem;">Review the scope before triggering the Smart Briefing generation.</p>
                    </header>
                    <div class="modal-body preview-modal">
                        <div class="preview-controls">
                            <div class="preview-field">
                                <span>Start date</span>
                                <input type="date" id="previewStart" required>
                            </div>
                            <div class="preview-field">
                                <span>End date</span>
                                <input type="date" id="previewEnd" required>
                            </div>
                            <div class="preview-quick">
                                <button type="button" class="preview-quick-btn" data-preview-range="7">Last 7 days</button>
                                <button type="button" class="preview-quick-btn" data-preview-range="14">Last 14 days</button>
                                <button type="button" class="preview-quick-btn" data-preview-range="30">Last 30 days</button>
                            </div>
                            <div class="preview-options">
                                <label class="preview-checkbox">
                                    <input type="checkbox" id="previewForce" checked>
                                    <span>Force regenerate (ignore cache)</span>
                                </label>
                                <button type="button" class="btn btn-secondary preview-refresh" id="refreshPreview">Update Preview</button>
                            </div>
                        </div>
                        <div class="preview-summary" id="previewSummary">
                            <div class="empty-state">Loading weekly snapshot…</div>
                        </div>
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

            <div class="modal-backdrop" id="quickNoteModal">
                <div class="modal">
                    <header>
                        <h2>Compose Quick Note</h2>
                        <p style="margin:6px 0 0;color:#6b7280;font-size:0.95rem;">Use this template to brief clients or internal stakeholders on high-impact updates.</p>
                    </header>
                    <form class="modal-body quick-note-modal" id="quickNoteForm">
                        <div class="quick-note-grid">
                            <label>
                                <span>Recipient name</span>
                                <input type="text" id="quickNoteRecipient" placeholder="e.g. Brian" autocomplete="off">
                            </label>
                            <label>
                                <span>Client or team</span>
                                <input type="text" id="quickNoteFirm" placeholder="e.g. First Sentinel" autocomplete="off">
                            </label>
                            <label>
                                <span>Sender</span>
                                <input type="text" id="quickNoteSender" placeholder="Horizon Scanner Team" autocomplete="off">
                            </label>
                        </div>
                        <label style="font-weight:600;color:#1f2937;">Note preview</label>
                        <textarea id="quickNoteContent" rows="12" required></textarea>
                    </form>
                    <footer>
                        <div class="quick-note-actions">
                            <button class="btn" id="cancelQuickNote" type="button">Cancel</button>
                            <button class="btn btn-secondary" id="copyQuickNote" type="button">Copy</button>
                            <button class="btn btn-primary" id="saveQuickNote" form="quickNoteForm" type="submit">Save Quick Note</button>
                        </div>
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
                    const previewSummaryEl = document.getElementById('previewSummary');
                    const previewStartInput = document.getElementById('previewStart');
                    const previewEndInput = document.getElementById('previewEnd');
                    const previewForceCheckbox = document.getElementById('previewForce');
                    const refreshPreviewBtn = document.getElementById('refreshPreview');
                    const previewQuickButtons = document.querySelectorAll('.preview-quick-btn');
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
                    const quickNoteModal = document.getElementById('quickNoteModal');
                    const quickNoteForm = document.getElementById('quickNoteForm');
                    const quickNoteRecipientInput = document.getElementById('quickNoteRecipient');
                    const quickNoteFirmInput = document.getElementById('quickNoteFirm');
                    const quickNoteSenderInput = document.getElementById('quickNoteSender');
                    const quickNoteContentInput = document.getElementById('quickNoteContent');
                    const quickNoteCopyBtn = document.getElementById('copyQuickNote');
                    const quickNoteCancelBtn = document.getElementById('cancelQuickNote');
                    const quickNoteSaveBtn = document.getElementById('saveQuickNote');

                    const MAX_HIGHLIGHT_UPDATES = ${MAX_HIGHLIGHT_UPDATES};
                    const MAX_UPDATES_PER_GROUP = ${MAX_UPDATES_PER_GROUP};
                    const highlightThemes = {
                        enforcement: { key: 'enforcement', label: 'Enforcements & Penalties', accent: '#dc2626', tint: '#fee2e2' },
                        consultation: { key: 'consultation', label: 'Consultations & Calls for Input', accent: '#0284c7', tint: '#e0f2fe' },
                        speech: { key: 'speech', label: 'Speeches & Remarks', accent: '#7c3aed', tint: '#ede9fe' },
                        other: { key: 'other', label: 'Strategic Signals', accent: '#334155', tint: '#e2e8f0' }
                    };
                    const highlightCategoryOrder = ['enforcement', 'consultation', 'speech', 'other'];

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

                    if (refreshPreviewBtn) {
                        refreshPreviewBtn.addEventListener('click', () => {
                            const start = previewStartInput ? previewStartInput.value : '';
                            const end = previewEndInput ? previewEndInput.value : '';
                            if (!start || !end) {
                                showToast('Select both start and end dates.', 'error');
                                return;
                            }
                            loadPreview({ start, end });
                        });
                    }

                    if (previewQuickButtons && previewQuickButtons.length) {
                        previewQuickButtons.forEach(button => {
                            button.addEventListener('click', () => {
                                const rangeDays = Number(button.getAttribute('data-preview-range') || '7');
                                const endDate = previewEndInput && previewEndInput.value
                                    ? new Date(previewEndInput.value + 'T00:00:00')
                                    : new Date();
                                const startDate = new Date(endDate);
                                startDate.setDate(startDate.getDate() - (rangeDays - 1));
                                if (previewStartInput) previewStartInput.value = toInputDate(startDate);
                                if (previewEndInput) previewEndInput.value = toInputDate(endDate);
                                loadPreview({ start: previewStartInput.value, end: previewEndInput.value });
                            });
                        });
                    }

                    function formatDuration(ms) {
                        if (!ms || Number.isNaN(ms)) return '—';
                        const seconds = Math.round(ms / 1000);
                        if (seconds < 60) return seconds + 's';
                        const minutes = Math.floor(seconds / 60);
                        const remaining = seconds % 60;
                        return minutes + 'm ' + remaining + 's';
                    }

                    function toInputDate(value) {
                        if (!value) return '';
                        const date = value instanceof Date ? value : new Date(value);
                        if (Number.isNaN(date.getTime())) return '';
                        const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
                        return offsetDate.toISOString().slice(0, 10);
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

                    function normalizeHighlightText(value) {
                        return typeof value === 'string' ? value.toLowerCase() : '';
                    }

                    function highlightSlug(value) {
                        return normalizeHighlightText(value).replace(/[^a-z0-9]+/g, '-');
                    }

                    function highlightTextContains(text, patterns) {
                        if (!text) return false;
                        return patterns.some(pattern => text.includes(pattern));
                    }

                    function classifyHighlightItem(update) {
                        const title = normalizeHighlightText(update?.title);
                        const summary = normalizeHighlightText(update?.summary);
                        const tags = Array.isArray(update?.tags) ? normalizeHighlightText(update.tags.join(' ')) : '';
                        const combined = [title, summary, tags].filter(Boolean).join(' ');

                        if (highlightTextContains(combined, ['enforcement', 'penalty', 'penalties', 'fine', 'fined', 'sanction', 'ban', 'prohibition', 'censure', 'disciplinary'])) {
                            return 'enforcement';
                        }
                        if (highlightTextContains(combined, ['consultation', 'call for evidence', 'feedback statement', 'discussion paper', 'request for comment', 'call for views'])) {
                            return 'consultation';
                        }
                        if (highlightTextContains(combined, ['speech', 'speaking', 'remarks', 'address', 'keynote', 'fireside', 'conference', 'summit'])) {
                            return 'speech';
                        }
                        return 'other';
                    }

                    function truncateHighlightSummary(value, limit = 220) {
                        if (!value) return '';
                        const trimmed = value.trim();
                        if (trimmed.length <= limit) return trimmed;
                        return trimmed.slice(0, Math.max(0, limit - 1)).trim() + '…';
                    }

                    function buildHighlightMetaChips(update) {
                        const impact = update?.impact_level || 'Informational';
                        const urgency = update?.urgency || 'Low';
                        const impactKey = highlightSlug(impact);
                        const urgencyKey = highlightSlug(urgency);
                        const chips = [
                            '<span class="highlight-chip impact-' + impactKey + '">Impact: ' + escapeHtml(impact) + '</span>',
                            '<span class="highlight-chip urgency-' + urgencyKey + '">Urgency: ' + escapeHtml(urgency) + '</span>'
                        ];
                        if (update?.business_impact_score) {
                            chips.push('<span class="highlight-chip score">Impact score: ' + escapeHtml(String(update.business_impact_score)) + '</span>');
                        }
                        return chips.join('');
                    }

                    function buildHighlightCardHtml(update, categoryKey) {
                        const theme = highlightThemes[categoryKey] || highlightThemes.other;
                        const authority = escapeHtml(update?.authority || 'Unknown authority');
                        const date = escapeHtml(formatDate(update?.published_date));
                        const title = (update?.title || '').trim();
                        const titleClass = title ? 'highlight-title' : 'highlight-title highlight-title--empty';
                        const summary = truncateHighlightSummary(update?.summary || '', 220);
                        const summaryHtml = summary ? escapeHtml(summary) : 'Summary not available.';
                        const chipsHtml = buildHighlightMetaChips(update);
                        const link = update?.url
                            ? '<a class="highlight-link" href="' + escapeAttribute(update.url) + '" target="_blank" rel="noopener">View source</a>'
                            : '';

                        return [
                            '<article class="highlight-card highlight-card--' + theme.key + '">',
                            '  <header class="highlight-card__header">',
                            '    <span class="highlight-chip authority">' + authority + '</span>',
                            '    <span class="highlight-chip date">' + date + '</span>',
                            '  </header>',
                            '  <div class="highlight-card__meta">' + chipsHtml + '</div>',
                            '  <h3 class="' + titleClass + '">' + (title ? escapeHtml(title) : 'No headline provided') + '</h3>',
                            '  <p class="highlight-summary">' + summaryHtml + '</p>',
                            link ? '  <footer class="highlight-card__footer">' + link + '</footer>' : '',
                            '</article>'
                        ].join('');
                    }

                    function buildHighlightGroupHtml(key, items) {
                        const theme = highlightThemes[key] || highlightThemes.other;
                        const limited = items.slice(0, MAX_UPDATES_PER_GROUP);
                        const cards = limited.map(item => buildHighlightCardHtml(item, key)).join('');
                        return [
                            '<section class="highlight-group highlight-group--' + theme.key + '">',
                            '  <header class="highlight-group__header" style="--highlight-accent:' + theme.accent + ';--highlight-tint:' + theme.tint + '">',
                            '    <span class="highlight-pill">' + escapeHtml(theme.label) + '</span>',
                            '    <span class="highlight-count">' + items.length + ' highlight' + (items.length === 1 ? '' : 's') + '</span>',
                            '  </header>',
                            '  <div class="highlight-list">',
                                cards,
                            '  </div>',
                            '</section>'
                        ].join('');
                    }

                    function renderHighlights(updates) {
                        const container = document.getElementById('updates-container');
                        const list = Array.isArray(updates) ? updates.slice(0, MAX_HIGHLIGHT_UPDATES) : [];
                        if (typeof window.renderUpdatesList === 'function') {
                            window.renderUpdatesList(list);
                            return;
                        }
                        if (!container) return;
                        container.className = 'updates-container cards-view';
                        if (list.length === 0) {
                            container.innerHTML = '<div class="empty-state">No highlighted updates available.</div>';
                            return;
                        }
                        if (typeof window.generateUpdateCard === 'function') {
                            container.innerHTML = list.map(update => window.generateUpdateCard(update)).join('');
                        } else {
                            container.innerHTML = list.map(update => '<div class="update-card"><h3 class="update-card__title">' + escapeHtml(update.headline || 'Update') + '</h3><p class="update-card__summary">' + escapeHtml(update.summary || '') + '</p></div>').join('');
                        }
                    }

                    function renderHighlightsSafe(updates) {
                        const list = Array.isArray(updates) ? updates : [];
                        renderHighlights(list);
                        return list;
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

                    const QUICK_NOTE_STORAGE_KEY = 'weekly_quick_note_defaults_v1';
                    const quickNoteElementsReady = Boolean(quickNoteModal && quickNoteForm && quickNoteContentInput);
                    const quickNoteState = {
                        activeUpdateId: null,
                        activeUpdate: null,
                        base: null,
                        userEdited: false,
                        defaults: loadQuickNoteDefaults(),
                        lastGeneratedContent: ''
                    };

                    function cleanText(value) {
                        if (value == null) return '';
                        return typeof value === 'string' ? value.trim() : String(value).trim();
                    }

                    function loadQuickNoteDefaults() {
                        if (typeof window === 'undefined' || !window.localStorage) {
                            return { recipient: '', firm: '', sender: '' };
                        }
                        try {
                            const raw = window.localStorage.getItem(QUICK_NOTE_STORAGE_KEY);
                            if (!raw) {
                                return { recipient: '', firm: '', sender: '' };
                            }
                            const parsed = JSON.parse(raw);
                            return {
                                recipient: cleanText(parsed.recipient),
                                firm: cleanText(parsed.firm),
                                sender: cleanText(parsed.sender)
                            };
                        } catch (error) {
                            console.warn('Quick note defaults load failed:', error);
                            return { recipient: '', firm: '', sender: '' };
                        }
                    }

                    function saveQuickNoteDefaults(overrides) {
                        if (typeof window === 'undefined' || !window.localStorage) {
                            return;
                        }
                        try {
                            const payload = {
                                recipient: cleanText(overrides.recipient),
                                firm: cleanText(overrides.firm),
                                sender: cleanText(overrides.sender)
                            };
                            window.localStorage.setItem(QUICK_NOTE_STORAGE_KEY, JSON.stringify(payload));
                        } catch (error) {
                            console.warn('Quick note defaults save failed:', error);
                        }
                    }

                    function extractSummaryBullets(summary) {
                        const clean = cleanText(summary);
                        if (!clean) return [];
                        // Split on sentence endings followed by whitespace
                        const segments = clean.split(/(?<=[.!?])\\s+/).map(segment => segment.trim()).filter(Boolean);
                        if (segments.length === 0) {
                            return [clean.length > 180 ? clean.slice(0, 177).trimEnd() + '…' : clean];
                        }
                        return segments.slice(0, 3).map(segment => {
                            return segment.length > 180 ? segment.slice(0, 177).trimEnd() + '…' : segment;
                        });
                    }

                    function resolveUpdateById(updateId, updateUrl) {
                        const id = cleanText(updateId);
                        const url = cleanText(updateUrl);
                        if (!id && !url) return null;
                        const pools = [
                            state.current?.dataset?.highlightUpdates,
                            state.current?.dataset?.currentUpdates,
                            window.filteredUpdates,
                            window.originalUpdates,
                            window.initialUpdates
                        ];
                        for (const pool of pools) {
                            if (!Array.isArray(pool)) continue;
                            const match = pool.find(update => {
                                if (!update) return false;
                                const updateIdentifier = update.id || update.update_id || update.note_id || update.original_id;
                                if (id && String(updateIdentifier) === id) return true;
                                if (url && update.url && update.url === url) return true;
                                return false;
                            });
                            if (match) return match;
                        }
                        return null;
                    }

                    function buildQuickNoteBase(payload = {}, resolved = null) {
                        const source = resolved || {};
                        const summaryCandidate = payload.summary ||
                            source.ai_summary ||
                            source.summary ||
                            source.description ||
                            '';
                        const summary = cleanText(summaryCandidate);
                        return {
                            id: cleanText(payload.updateId || source.id || source.update_id || ''),
                            headline: cleanText(payload.headline || source.headline || source.title || ''),
                            authority: cleanText(payload.authority || source.authority || ''),
                            summary,
                            bullets: extractSummaryBullets(summary),
                            impact: cleanText(payload.impact || source.impact_level || source.impactLevel || ''),
                            urgency: cleanText(payload.urgency || source.urgency || ''),
                            published: cleanText(payload.published || source.published_date || source.publishedDate || source.created_at || source.createdAt || ''),
                            url: cleanText(payload.url || source.url || ''),
                            regulatoryArea: cleanText(payload.regulatoryArea || source.regulatory_area || source.regulatoryArea || source.area || '')
                        };
                    }

                    function buildQuickNoteContent(base, overrides = {}) {
                        if (!base) return '';
                        const recipient = cleanText(overrides.recipient) || 'team';
                        const firm = cleanText(overrides.firm);
                        const sender = cleanText(overrides.sender) || 'Horizon Scanner Team';
                        const lines = [];
                        const greetingSuffix = firm ? ' (' + firm + ')' : '';
                        lines.push('Hi ' + recipient + greetingSuffix + ',');
                        lines.push('');
                        const headlinePart = base.headline || 'a regulatory update';
                        const authorityPart = base.authority ? ' from ' + base.authority : '';
                        const datePart = base.published ? ' (' + formatDate(base.published) + ')' : '';
                        lines.push('Quick heads-up on ' + headlinePart + authorityPart + datePart + '.');
                        if (Array.isArray(base.bullets) && base.bullets.length > 0) {
                            lines.push('');
                            lines.push('Key points:');
                            base.bullets.forEach(bullet => {
                                lines.push('- ' + bullet);
                            });
                        } else if (base.summary) {
                            lines.push('');
                            lines.push(base.summary);
                        }
                        const metaParts = [];
                        if (base.impact) metaParts.push('Impact: ' + base.impact);
                        if (base.urgency) metaParts.push('Urgency: ' + base.urgency);
                        if (base.regulatoryArea) metaParts.push('Focus: ' + base.regulatoryArea);
                        if (metaParts.length > 0) {
                            lines.push('');
                            lines.push(metaParts.join(' • '));
                        }
                        if (base.url) {
                            lines.push('');
                            lines.push('Source: ' + base.url);
                        }
                        lines.push('');
                        lines.push('— ' + sender);
                        return lines.join('\\n').replace(/\\n{3,}/g, '\\n\\n');
                    }

                    function syncQuickNoteDefaultsFromInputs() {
                        quickNoteState.defaults = {
                            recipient: quickNoteRecipientInput ? cleanText(quickNoteRecipientInput.value) : quickNoteState.defaults.recipient,
                            firm: quickNoteFirmInput ? cleanText(quickNoteFirmInput.value) : quickNoteState.defaults.firm,
                            sender: quickNoteSenderInput ? cleanText(quickNoteSenderInput.value) : quickNoteState.defaults.sender
                        };
                    }

                    function updateQuickNotePreview(force = false) {
                        if (!quickNoteElementsReady || !quickNoteState.base || !quickNoteContentInput) return;
                        if (!force && quickNoteState.userEdited && quickNoteContentInput.value !== quickNoteState.lastGeneratedContent) {
                            return;
                        }
                        const overrides = {
                            recipient: quickNoteRecipientInput ? quickNoteRecipientInput.value : '',
                            firm: quickNoteFirmInput ? quickNoteFirmInput.value : '',
                            sender: quickNoteSenderInput ? quickNoteSenderInput.value : ''
                        };
                        const content = buildQuickNoteContent(quickNoteState.base, overrides);
                        quickNoteState.lastGeneratedContent = content;
                        quickNoteState.userEdited = false;
                        quickNoteContentInput.value = content;
                    }

                    function closeQuickNoteComposer() {
                        if (quickNoteModal) {
                            quickNoteModal.classList.remove('visible');
                        }
                        syncQuickNoteDefaultsFromInputs();
                        saveQuickNoteDefaults(quickNoteState.defaults);
                        quickNoteState.activeUpdateId = null;
                        quickNoteState.activeUpdate = null;
                        quickNoteState.base = null;
                        quickNoteState.userEdited = false;
                    }

                    function openQuickNoteComposer(payload = {}) {
                        if (!quickNoteElementsReady) {
                            showToast('Quick notes are not available on this view.', 'warning');
                            return;
                        }
                        const resolved = resolveUpdateById(payload.updateId, payload.url);
                        const base = buildQuickNoteBase(payload, resolved);
                        if (!base.id && resolved && resolved.id) {
                            base.id = cleanText(resolved.id);
                        }
                        quickNoteState.activeUpdateId = base.id;
                        quickNoteState.activeUpdate = resolved;
                        quickNoteState.base = base;
                        quickNoteState.userEdited = false;
                        quickNoteState.lastGeneratedContent = '';
                        if (quickNoteRecipientInput) quickNoteRecipientInput.value = quickNoteState.defaults.recipient || '';
                        if (quickNoteFirmInput) quickNoteFirmInput.value = quickNoteState.defaults.firm || '';
                        if (quickNoteSenderInput) quickNoteSenderInput.value = quickNoteState.defaults.sender || '';
                        updateQuickNotePreview(true);
                        if (quickNoteModal) {
                            quickNoteModal.classList.add('visible');
                        }
                        setTimeout(() => {
                            if (quickNoteRecipientInput) {
                                quickNoteRecipientInput.focus();
                            }
                        }, 0);
                    }

                    if (quickNoteElementsReady) {
                        window.openQuickNoteComposer = openQuickNoteComposer;
                    } else {
                        window.openQuickNoteComposer = () => {
                            showToast('Quick notes are not available on this page.', 'warning');
                        };
                    }

                    if (quickNoteElementsReady) {
                        if (quickNoteContentInput) {
                            quickNoteContentInput.addEventListener('input', () => {
                                quickNoteState.userEdited = true;
                            });
                        }
                        const quickNoteInputs = [
                            quickNoteRecipientInput,
                            quickNoteFirmInput,
                            quickNoteSenderInput
                        ].filter(Boolean);
                        quickNoteInputs.forEach(input => {
                            input.addEventListener('input', () => {
                                syncQuickNoteDefaultsFromInputs();
                                updateQuickNotePreview();
                            });
                            input.addEventListener('blur', () => {
                                syncQuickNoteDefaultsFromInputs();
                                saveQuickNoteDefaults(quickNoteState.defaults);
                            });
                        });
                        if (quickNoteCopyBtn && quickNoteContentInput) {
                            quickNoteCopyBtn.addEventListener('click', async () => {
                                const text = quickNoteContentInput.value;
                                if (!text) {
                                    showToast('Nothing to copy yet.', 'warning');
                                    return;
                                }
                                try {
                                    if (navigator.clipboard && navigator.clipboard.writeText) {
                                        await navigator.clipboard.writeText(text);
                                    } else {
                                        const helper = document.createElement('textarea');
                                        helper.value = text;
                                        helper.setAttribute('readonly', '');
                                        helper.style.position = 'absolute';
                                        helper.style.left = '-9999px';
                                        document.body.appendChild(helper);
                                        helper.select();
                                        document.execCommand('copy');
                                        document.body.removeChild(helper);
                                    }
                                    showToast('Quick note copied to clipboard.', 'success');
                                } catch (error) {
                                    console.warn('Clipboard copy failed:', error);
                                    showToast('Unable to copy note.', 'error', false);
                                }
                            });
                        }
                        if (quickNoteCancelBtn) {
                            quickNoteCancelBtn.addEventListener('click', () => {
                                closeQuickNoteComposer();
                            });
                        }
                        if (quickNoteModal) {
                            quickNoteModal.addEventListener('click', event => {
                                if (event.target === quickNoteModal) {
                                    closeQuickNoteComposer();
                                }
                            });
                        }
                        document.addEventListener('keydown', event => {
                            if (event.key === 'Escape' && quickNoteModal && quickNoteModal.classList.contains('visible')) {
                                closeQuickNoteComposer();
                            }
                        });
                        if (quickNoteForm && quickNoteContentInput) {
                            quickNoteForm.addEventListener('submit', async event => {
                                event.preventDefault();
                                if (!quickNoteState.activeUpdateId) {
                                    showToast('Select an update before saving a quick note.', 'error');
                                    return;
                                }
                                const content = cleanText(quickNoteContentInput.value);
                                if (!content) {
                                    showToast('Add some content to the quick note.', 'error');
                                    return;
                                }
                                syncQuickNoteDefaultsFromInputs();
                                const recipient = quickNoteState.defaults.recipient;
                                const firm = quickNoteState.defaults.firm;
                                const sender = quickNoteState.defaults.sender || 'Horizon Scanner Team';
                                const linkedResources = quickNoteState.base && quickNoteState.base.url ? [quickNoteState.base.url] : [];
                                const payload = {
                                    update_id: quickNoteState.activeUpdateId,
                                    visibility: 'team',
                                    status: 'reviewed',
                                    content,
                                    origin_page: 'weekly-briefing',
                                    action_type: 'quick-note',
                                    annotation_type: 'quick-note',
                                    tags: ['quick-note'],
                                    linked_resources: linkedResources,
                                    context: {
                                        type: 'quick-note',
                                        recipient,
                                        firm,
                                        sender,
                                        generated_at: new Date().toISOString(),
                                        impact: quickNoteState.base?.impact || '',
                                        urgency: quickNoteState.base?.urgency || '',
                                        regulatory_area: quickNoteState.base?.regulatoryArea || ''
                                    }
                                };
                                if (sender) {
                                    payload.author = sender;
                                }
                                let buttonDisabled = false;
                                if (quickNoteSaveBtn) {
                                    quickNoteSaveBtn.disabled = true;
                                    quickNoteSaveBtn.textContent = 'Saving...';
                                    buttonDisabled = true;
                                }
                                try {
                                    const response = await fetch('/api/annotations', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(payload)
                                    });
                                    if (!response.ok) {
                                        throw new Error('Failed to save quick note');
                                    }
                                    const result = await response.json();
                                    if (!result.success) {
                                        throw new Error(result.error || 'Failed to save quick note');
                                    }
                                    saveQuickNoteDefaults(quickNoteState.defaults);
                                    closeQuickNoteComposer();
                                    showToast('Quick note saved to annotations.', 'success');
                                    try {
                                        await refreshAnnotationsFromServer();
                                    } catch (error) {
                                        console.warn('Unable to refresh annotations:', error);
                                    }
                                } catch (error) {
                                    console.error('Quick note save failed:', error);
                                    showToast(error.message || 'Unable to save quick note.', 'error', false);
                                } finally {
                                    if (buttonDisabled && quickNoteSaveBtn) {
                                        quickNoteSaveBtn.disabled = false;
                                        quickNoteSaveBtn.textContent = 'Save Quick Note';
                                    }
                                }
                            });
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

                    const ONE_PAGER_ICON_SVGS = {
                        radar: '<svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="14" cy="14" r="11" opacity="0.2"></circle><circle cx="14" cy="14" r="7" opacity="0.35"></circle><circle cx="14" cy="14" r="3"></circle><path d="M14 3v4"></path><path d="M20.5 7.5l-2.8 2.8"></path><path d="M24 14h-4"></path></g></svg>',
                        alert: '<svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.6"><path d="M14 4l10 18H4z" opacity="0.25"></path><path d="M14 10v6" stroke-linecap="round"></path><circle cx="14" cy="19.5" r="1.2" fill="currentColor" stroke="none"></circle></g></svg>',
                        clock: '<svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="14" cy="14" r="10" opacity="0.25"></circle><path d="M14 8v6l4 2" stroke-linecap="round"></path></g></svg>',
                        building: '<svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.6"><rect x="6" y="9" width="16" height="14" rx="1.6" opacity="0.25"></rect><path d="M10 9V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4" opacity="0.4"></path><path d="M10 14.5h2m4 0h2m-8 4h2m4 0h2" stroke-linecap="round"></path></g></svg>'
                    };

                    function getOnePagerIconSvg(key) {
                        return ONE_PAGER_ICON_SVGS[key] || '';
                    }

                    function collectOnePagerUpdates(briefing) {
                        if (!briefing || !briefing.dataset) return [];
                        if (Array.isArray(briefing.dataset.highlightUpdates) && briefing.dataset.highlightUpdates.length > 0) {
                            return briefing.dataset.highlightUpdates.slice();
                        }
                        if (Array.isArray(briefing.dataset.currentUpdates)) {
                            return briefing.dataset.currentUpdates.slice();
                        }
                        return [];
                    }

                    function buildOnePagerMetricsClient(briefing) {
                        const stats = briefing?.dataset?.stats || {};
                        const impact = stats.byImpact || {};
                        const updates = collectOnePagerUpdates(briefing);
                        const urgentCount = updates.filter(update => {
                            const urgency = String(update?.urgency || '').toLowerCase();
                            return urgency.includes('high') || urgency.includes('urgent');
                        }).length;
                        const authorities = Array.from(new Set(updates.map(update => update?.authority).filter(Boolean))).length;

                        return [
                            { icon: 'radar', value: stats.totalUpdates ?? 0, label: 'Updates monitored', helper: 'Tracked this cycle' },
                            { icon: 'alert', value: impact.Significant ?? 0, label: 'High-impact notices', helper: 'Require immediate review' },
                            { icon: 'clock', value: urgentCount, label: 'Urgent signals', helper: 'Flagged for rapid follow-up' },
                            { icon: 'building', value: authorities, label: 'Active authorities', helper: 'Issuing updates this week' }
                        ];
                    }

                    function stylizeOnePagerBodyClient(html) {
                        if (!html) return '';
                        return html.replace(/<h4>/g, '<h3 class="one-pager__heading">').replace(/<\\/h4>/g, '</h3>');
                    }

                    function buildOnePagerSpotlightsClient(briefing) {
                        const updates = collectOnePagerUpdates(briefing);
                        if (!updates.length) return '';
                        const highlightItems = updates.slice(0, 3).map(item => {
                            const authority = escapeHtml(item?.authority || 'Unknown authority');
                            const headline = escapeHtml(item?.title || 'No headline provided');
                            const date = escapeHtml(formatDate(item?.published_date));
                            return [
                                '<li class="executive-highlight">',
                                '<span class="executive-highlight__authority">' + authority + '</span>',
                                '<span class="executive-highlight__title">' + headline + '</span>',
                                '<span class="executive-highlight__meta">' + date + '</span>',
                                '</li>'
                            ].join('');
                        }).join('');

                        return [
                            '<section class="executive-sheet__spotlights">',
                            '<h3 class="executive-sheet__section-title">Spotlight Briefings</h3>',
                            '<ul class="executive-highlight-list">' + highlightItems + '</ul>',
                            '</section>'
                        ].join('');
                    }

                    function buildExecutiveOnePagerHtmlClient(briefing) {
                        if (!briefing || !briefing.artifacts || !briefing.artifacts.onePager) {
                            return '<div class="empty-state">Generate a briefing to view the one-pager.</div>';
                        }

                        const coverage = briefing.dateRange
                            ? escapeHtml(formatDate(briefing.dateRange.start) + ' — ' + formatDate(briefing.dateRange.end))
                            : 'Period unavailable';
                        const generated = escapeHtml(formatDateTime(briefing.generatedAt));
                        const metrics = buildOnePagerMetricsClient(briefing).map(metric => [
                            '<div class="executive-metric">',
                                '<div class="executive-metric__icon">' + getOnePagerIconSvg(metric.icon) + '</div>',
                                '<div class="executive-metric__content">',
                                    '<span class="executive-metric__value">' + escapeHtml(String(metric.value ?? '—')) + '</span>',
                                    '<span class="executive-metric__label">' + escapeHtml(metric.label) + '</span>',
                                    metric.helper ? '<span class="executive-metric__helper">' + escapeHtml(metric.helper) + '</span>' : '',
                                '</div>',
                            '</div>'
                        ].join('')).join('');
                        const spotlights = buildOnePagerSpotlightsClient(briefing);
                        const body = stylizeOnePagerBodyClient(briefing.artifacts.onePager);

                        return [
                            '<article class="executive-sheet">',
                                '<header class="executive-sheet__masthead">',
                                    '<div class="executive-sheet__brand">',
                                        '<div class="executive-sheet__mark">HS</div>',
                                        '<div>',
                                            '<div class="executive-sheet__brand-name">Horizon Scanner</div>',
                                            '<div class="executive-sheet__brand-subtitle">Weekly Smart Brief</div>',
                                        '</div>',
                                    '</div>',
                                    '<div class="executive-sheet__meta">',
                                        '<div class="executive-sheet__meta-item">',
                                            '<span class="executive-sheet__meta-label">Coverage</span>',
                                            '<span class="executive-sheet__meta-value">' + coverage + '</span>',
                                        '</div>',
                                        '<div class="executive-sheet__meta-item">',
                                            '<span class="executive-sheet__meta-label">Published</span>',
                                            '<span class="executive-sheet__meta-value">' + generated + '</span>',
                                        '</div>',
                                    '</div>',
                                '</header>',
                                '<section class="executive-sheet__metrics">' + metrics + '</section>',
                                spotlights,
                                '<section class="executive-sheet__body">' + body + '</section>',
                            '</article>'
                        ].join('');
                    }

                    function renderOnePager(briefing) {
                        const container = document.getElementById('onePagerContent');
                        if (!container) return;
                        container.innerHTML = buildExecutiveOnePagerHtmlClient(briefing);
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

                            const body = escapeHtml(annotation.content || '').replace(/\\n/g, '<br>');
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
                            Promise.resolve(applyCurrentFilters()).catch(error => {
                                console.warn('applyCurrentFilters failed:', error);
                                if (typeof renderUpdatesList === 'function') {
                                    renderUpdatesList(window.filteredUpdates || currentUpdates);
                                }
                            });
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

                    async function loadPreview(range) {
                        try {
                            if (previewSummaryEl) {
                                previewSummaryEl.innerHTML = '<div class="empty-state">Loading weekly snapshot…</div>';
                            }
                            const params = new URLSearchParams();
                            const desiredStart = range?.start || (previewStartInput && previewStartInput.value);
                            const desiredEnd = range?.end || (previewEndInput && previewEndInput.value);
                            if (desiredStart) params.set('start', desiredStart);
                            if (desiredEnd) params.set('end', desiredEnd);
                            const response = await fetch('/api/weekly-roundup/preview' + (params.size ? ('?' + params.toString()) : ''));
                            if (!response.ok) throw new Error('Failed to load preview');
                            const data = await response.json();
                            if (!data.success || !data.preview) throw new Error('No preview data available');
                            state.previewRange = { start: data.preview.weekStart, end: data.preview.weekEnd };
                            if (previewStartInput) previewStartInput.value = data.preview.weekStart;
                            if (previewEndInput) previewEndInput.value = data.preview.weekEnd;

                            const impact = data.preview.impactSummary || {};
                            const authorities = Array.isArray(data.preview.topAuthorities) ? data.preview.topAuthorities : [];
                            const highlights = authorities.length
                                ? '<ul class="preview-highlight-list">' + authorities.map(item => {
                                    return '<li><span class="preview-highlight-authority">' + escapeHtml(item.authority || 'Unknown') + '</span><span class="preview-highlight-meta">' + escapeHtml(String(item.count || 0)) + ' updates</span></li>';
                                  }).join('') + '</ul>'
                                : '<p style="margin:0;color:#64748b;">No authority breakdown available.</p>';

                            if (previewSummaryEl) {
                                previewSummaryEl.innerHTML = [
                                    '<div class="preview-grid">',
                                    '  <div class="preview-stat">',
                                    '    <span class="preview-stat__label">Coverage</span>',
                                    '    <span class="preview-stat__value">' + escapeHtml(formatDate(data.preview.weekStart)) + ' — ' + escapeHtml(formatDate(data.preview.weekEnd)) + '</span>',
                                    '  </div>',
                                    '  <div class="preview-stat">',
                                    '    <span class="preview-stat__label">Total updates</span>',
                                    '    <span class="preview-stat__value">' + escapeHtml(String(data.preview.totalUpdates)) + '</span>',
                                    '  </div>',
                                    '  <div class="preview-stat">',
                                    '    <span class="preview-stat__label">High impact</span>',
                                    '    <span class="preview-stat__value">' + escapeHtml(String(impact.significant || 0)) + '</span>',
                                    '  </div>',
                                    '  <div class="preview-stat">',
                                    '    <span class="preview-stat__label">Moderate</span>',
                                    '    <span class="preview-stat__value">' + escapeHtml(String(impact.moderate || 0)) + '</span>',
                                    '  </div>',
                                    '</div>',
                                    '<div>',
                                    '  <span class="preview-stat__label" style="display:block;margin:12px 0 6px;">Top authorities</span>',
                                    highlights,
                                    '</div>',
                                    '<p class="preview-note">Generation will reuse cached outputs unless force regenerate stays on.</p>'
                                ].join('');
                            }
                        } catch (error) {
                            console.error(error);
                            if (previewSummaryEl) {
                                previewSummaryEl.innerHTML = '<div class="empty-state">Unable to load preview: ' + escapeHtml(error.message) + '</div>';
                            }
                        }
                    }

                    async function triggerRun() {
                        const startValue = previewStartInput ? previewStartInput.value : '';
                        const endValue = previewEndInput ? previewEndInput.value : '';
                        if (!startValue || !endValue) {
                            showToast('Select a date range before generating.', 'error');
                            confirmBtn.disabled = false;
                            assembleBtn.disabled = false;
                            return;
                        }
                        state.previewRange = { start: startValue, end: endValue };
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
                                    force_regenerate: previewForceCheckbox ? previewForceCheckbox.checked : true
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
                        if (previewForceCheckbox) previewForceCheckbox.checked = true;
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
