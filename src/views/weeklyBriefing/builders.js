const MAX_HIGHLIGHT_UPDATES = 10
const MAX_UPDATES_PER_GROUP = 4

function highlightContains(text, patterns) {
  if (!text) return false
  return patterns.some(pattern => text.includes(pattern))
}

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

function truncateText(value, limit = 220) {
  if (!value) return ''
  const trimmed = value.trim()
  if (trimmed.length <= limit) return trimmed
  return `${trimmed.slice(0, Math.max(0, limit - 1)).trim()}…`
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

function wrapRichText(content) {
  const trimmed = (content || '').trim()
  if (!trimmed) return ''
  return `<div class="briefing-rich-text">${trimmed}</div>`
}

function formatInlineRichText(text) {
  return escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
}

function renderStructuredMarkdown(source, {
  headingTag = 'h3',
  headingClass = 'briefing-rich-text__heading',
  paragraphClass = '',
  orderedListClass = '',
  unorderedListClass = ''
} = {}) {
  if (!source) return ''

  const headingAttr = headingClass ? ` class="${headingClass}"` : ''
  const paragraphAttr = paragraphClass ? ` class="${paragraphClass}"` : ''
  const orderedAttr = orderedListClass ? ` class="${orderedListClass}"` : ''
  const unorderedAttr = unorderedListClass ? ` class="${unorderedListClass}"` : ''

  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const nodes = []

  let paragraphBuffer = []
  let activeList = null

  const flushParagraph = () => {
    if (!paragraphBuffer.length) return
    const text = paragraphBuffer.join('\n').trim()
    if (text) {
      nodes.push({ type: 'paragraph', text })
    }
    paragraphBuffer = []
  }

  const flushList = () => {
    if (!activeList || !activeList.items.length) {
      activeList = null
      return
    }
    nodes.push(activeList)
    activeList = null
  }

  const ensureList = (listType) => {
    if (activeList && activeList.listType === listType) return
    flushParagraph()
    flushList()
    activeList = { type: 'list', listType, items: [] }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (!line) {
      flushParagraph()
      flushList()
      continue
    }

    const headingOnly = line.match(/^\*\*(.+?)\*\*$/)
    if (headingOnly) {
      flushParagraph()
      flushList()
      nodes.push({ type: 'heading', text: headingOnly[1].trim() })
      continue
    }

    const headingWithBody = line.match(/^\*\*(.+?)\*\*\s+(.*)$/)
    if (headingWithBody) {
      flushParagraph()
      flushList()
      nodes.push({ type: 'heading', text: headingWithBody[1].trim() })
      const remainder = headingWithBody[2].trim()
      if (remainder) {
        paragraphBuffer.push(remainder)
      }
      continue
    }

    const orderedMatch = line.match(/^(\d+)[.)]\s+(.*)$/)
    if (orderedMatch) {
      ensureList('ol')
      activeList.items.push(orderedMatch[2].trim())
      continue
    }

    const bulletMatch = line.match(/^[-*+•]\s+(.*)$/)
    if (bulletMatch) {
      ensureList('ul')
      activeList.items.push(bulletMatch[1].trim())
      continue
    }

    paragraphBuffer.push(line)
  }

  flushParagraph()
  flushList()

  return nodes.map(node => {
    if (node.type === 'heading') {
      return `<${headingTag}${headingAttr}>${formatInlineRichText(node.text)}</${headingTag}>`
    }

    if (node.type === 'paragraph') {
      const body = formatInlineRichText(node.text).replace(/\n+/g, '<br>')
      return `<p${paragraphAttr}>${body}</p>`
    }

    if (node.type === 'list') {
      const attr = node.listType === 'ol' ? orderedAttr : unorderedAttr
      const items = node.items
        .map(item => `<li>${formatInlineRichText(item)}</li>`)
        .join('\n')
      return `<${node.listType}${attr}>${items}</${node.listType}>`
    }

    return ''
  }).join('\n')
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
    // Remove unnecessary section wrappers from AI-generated content
    let cleaned = trimmed
      .replace(/<section class="briefing-section">/gi, '')
      .replace(/<\/section>/gi, '\n')
      .trim()
    return wrapRichText(cleaned)
  }

  const structured = renderStructuredMarkdown(trimmed)

  if (!structured) {
    const safe = escapeHtml(trimmed).replace(/\n/g, '<br>')
    return wrapRichText(`<p>${safe}</p>`)
  }

  return wrapRichText(structured)
}

function formatDateDisplay(value) {
  if (!value) return 'Unknown'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Unknown'
  return parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
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

  // Check if content is markdown-style (contains **text**)
  if (html.includes('**') && !html.includes('<')) {
    const structured = renderStructuredMarkdown(html, {
      headingTag: 'h3',
      headingClass: 'one-pager__heading',
      paragraphClass: '',
      orderedListClass: '',
      unorderedListClass: ''
    })
    return `<div class="one-pager">${structured}</div>`
  }

  // Handle HTML content
  return `<div class="one-pager">${html
    .replace(/<h4>/g, '<h3 class="one-pager__heading">')
    .replace(/<\/h4>/g, '</h3>')}</div>`
}

function buildOnePagerHighlights(briefing) {
  const pool = Array.isArray(briefing?.dataset?.highlightUpdates) && briefing.dataset.highlightUpdates.length > 0
    ? briefing.dataset.highlightUpdates
    : briefing?.dataset?.currentUpdates || []
  if (!Array.isArray(pool) || pool.length === 0) return ''

  const topThree = pool.slice(0, 3)
  const items = topThree.map((item, index) => {
    const authority = escapeHtml(item?.authority || 'Unknown authority')
    const title = escapeHtml(item?.title || 'No headline provided')
    const date = escapeHtml(formatDateDisplay(item?.published_date))
    return `
      <li class="executive-spotlights__item">
        <span class="executive-spotlights__index">${String(index + 1).padStart(2, '0')}</span>
        <div class="executive-spotlights__content">
          <span class="executive-spotlights__authority">${authority}</span>
          <span class="executive-spotlights__title">${title}</span>
          <span class="executive-spotlights__meta">${date}</span>
        </div>
      </li>
    `
  }).join('')

  return `
    <section class="executive-spotlights">
      <header class="executive-spotlights__header">
        <span class="executive-spotlights__label">Spotlight Signals</span>
        <h2 class="executive-spotlights__heading">What needs your attention first</h2>
      </header>
      <ul class="executive-spotlights__list">
        ${items}
      </ul>
    </section>
  `
}

function buildExecutiveOnePager(briefing) {
  if (!briefing?.artifacts?.onePager) {
    return '<div class="empty-state">Generate a briefing to view the one-pager.</div>'
  }

  const stats = briefing?.dataset?.stats || {}
  const impact = stats.byImpact || {}
  const metrics = buildOnePagerMetrics(briefing)
  const metricCards = metrics.map((metric, index) => `
        <article class="executive-panel" data-index="${index}">
          <span class="executive-panel__label">${escapeHtml(metric.label)}</span>
          <span class="executive-panel__value">${escapeHtml(String(metric.value ?? '—'))}</span>
          ${metric.helper ? `<span class="executive-panel__helper">${escapeHtml(metric.helper)}</span>` : ''}
        </article>
  `).join('')

  const coverage = briefing?.dateRange
    ? `${formatDateDisplay(briefing.dateRange.start)} — ${formatDateDisplay(briefing.dateRange.end)}`
    : 'Period unavailable'
  const generated = formatDateTimeDisplay(briefing?.generatedAt)
  const bodyHtml = stylizeOnePagerBody(briefing.artifacts.onePager)
  const spotlights = buildOnePagerHighlights(briefing)
  const heroTagline = [
    stats.totalUpdates != null ? `${stats.totalUpdates} regulatory developments analysed` : '',
    impact.Significant != null ? `${impact.Significant} flagged high-impact` : ''
  ].filter(Boolean).join(' · ') || 'Curated regulatory intelligence for your leadership team.'

  return `
    <article class="executive-brief">
      <header class="executive-hero">
        <span class="executive-hero__label">Weekly Regulatory Roundup</span>
        <h1 class="executive-hero__title">Executive Summary</h1>
        <p class="executive-hero__tagline">${escapeHtml(heroTagline)}</p>
        <div class="executive-hero__meta">
          <div class="executive-hero__meta-item">
            <span class="meta-label">Coverage</span>
            <span class="meta-value">${escapeHtml(coverage)}</span>
          </div>
          <div class="executive-hero__meta-item">
            <span class="meta-label">Published</span>
            <span class="meta-value">${escapeHtml(generated)}</span>
          </div>
        </div>
      </header>
      <section class="executive-panels">
        ${metricCards}
      </section>
      ${spotlights}
      <section class="executive-body">
        ${bodyHtml}
      </section>
    </article>
  `
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

module.exports = {
  MAX_HIGHLIGHT_UPDATES,
  MAX_UPDATES_PER_GROUP,
  buildExecutiveOnePager,
  buildInitialMetaHtml,
  buildInitialNarrativeHtml,
  buildInitialOnePagerHtml,
  buildInitialStatsHtml,
  buildInitialTeamBriefingHtml,
  buildInitialTimelineHtml,
  buildInitialUpdatesHtml,
  buildUpdateCardHtml,
  escapeAttribute,
  escapeHtml,
  formatDateDisplay,
  formatDateTimeDisplay,
  formatRichText,
  serialize,
  slugify,
  truncateText
}
