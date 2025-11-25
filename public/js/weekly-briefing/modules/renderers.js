function applyRenderMixin(klass) {
  Object.assign(klass.prototype, {
    renderStructuredMarkdown(text, {
      headingTag = 'h3',
      headingClass = 'briefing-rich-text__heading',
      paragraphClass = '',
      orderedListClass = '',
      unorderedListClass = ''
    } = {}) {
      if (!text) return ''

      const headingAttr = headingClass ? ` class="${headingClass}"` : ''
      const paragraphAttr = paragraphClass ? ` class="${paragraphClass}"` : ''
      const orderedAttr = orderedListClass ? ` class="${orderedListClass}"` : ''
      const unorderedAttr = unorderedListClass ? ` class="${unorderedListClass}"` : ''

      const lines = text.replace(/\r\n/g, '\n').split('\n')
      const nodes = []

      let paragraphBuffer = []
      let activeList = null

      const flushParagraph = () => {
        if (!paragraphBuffer.length) return
        const body = paragraphBuffer.join('\n').trim()
        if (body) {
          nodes.push({ type: 'paragraph', text: body })
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

      const formatInline = (value) => this.escapeHtml(value).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

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
          if (remainder) paragraphBuffer.push(remainder)
          continue
        }

        const orderedMatch = line.match(/^(\d+)[.)]\s+(.*)$/)
        if (orderedMatch) {
          ensureList('ol')
          activeList.items.push(formatInline(orderedMatch[2].trim()))
          continue
        }

        const bulletMatch = line.match(/^[-*+•]\s+(.*)$/)
        if (bulletMatch) {
          ensureList('ul')
          activeList.items.push(formatInline(bulletMatch[1].trim()))
          continue
        }

        paragraphBuffer.push(line)
      }

      flushParagraph()
      flushList()

      return nodes.map(node => {
        if (node.type === 'heading') {
          return `<${headingTag}${headingAttr}>${formatInline(node.text)}</${headingTag}>`
        }

        if (node.type === 'paragraph') {
          const body = formatInline(node.text).replace(/\n+/g, '<br>')
          return `<p${paragraphAttr}>${body}</p>`
        }

        if (node.type === 'list') {
          const attr = node.listType === 'ol' ? orderedAttr : unorderedAttr
          const items = node.items.map(item => `<li>${item}</li>`).join('\n')
          return `<${node.listType}${attr}>${items}</${node.listType}>`
        }

        return ''
      }).join('\n')
    },

    updateRunStatus(status) {
      const runStatusEl = this.dom.runStatusEl
      if (!runStatusEl) return
      if (!status) {
        runStatusEl.classList.remove('active')
        runStatusEl.style.display = 'none'
        runStatusEl.innerHTML = ''
        return
      }

      runStatusEl.classList.add('active')
      runStatusEl.style.display = 'block'

      const state = status.state || 'processing'
      const message = status.message || 'Processing your request...'
      const progress = status.progress || 0
      const isCompleted = state === 'completed'
      const isFailed = state === 'failed'
      const isProcessing = !isCompleted && !isFailed

      // Beautiful loading UI with progress bar
      runStatusEl.innerHTML = `
        <div class="briefing-status-card ${isProcessing ? 'processing' : ''} ${isCompleted ? 'completed' : ''} ${isFailed ? 'failed' : ''}">
          <div class="status-header">
            <div class="status-icon">
              ${isProcessing ? `
                <svg class="spinner" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle class="spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" />
                </svg>
              ` : isCompleted ? `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="#10b981" />
                  <path d="M7 12l3 3 7-7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              ` : `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="#ef4444" />
                  <path d="M8 8l8 8M16 8l-8 8" stroke="white" stroke-width="2" stroke-linecap="round" />
                </svg>
              `}
            </div>
            <div class="status-text">
              <div class="status-title">${this.escapeHtml(state.toUpperCase())}</div>
              <div class="status-message">${this.escapeHtml(message)}</div>
            </div>
          </div>
          ${isProcessing ? `
            <div class="progress-bar-container">
              <div class="progress-bar">
                <div class="progress-bar-fill" style="width: ${progress}%"></div>
              </div>
              <div class="progress-text">${progress}%</div>
            </div>
            <div class="status-steps">
              <div class="step ${progress >= 20 ? 'completed' : 'active'}">
                <span class="step-dot"></span>
                <span class="step-label">Fetching updates</span>
              </div>
              <div class="step ${progress >= 40 ? 'completed' : progress >= 20 ? 'active' : ''}">
                <span class="step-dot"></span>
                <span class="step-label">Analyzing content</span>
              </div>
              <div class="step ${progress >= 60 ? 'completed' : progress >= 40 ? 'active' : ''}">
                <span class="step-dot"></span>
                <span class="step-label">Generating insights</span>
              </div>
              <div class="step ${progress >= 80 ? 'completed' : progress >= 60 ? 'active' : ''}">
                <span class="step-dot"></span>
                <span class="step-label">Creating briefing</span>
              </div>
              <div class="step ${progress >= 100 ? 'completed' : progress >= 80 ? 'active' : ''}">
                <span class="step-dot"></span>
                <span class="step-label">Finalizing</span>
              </div>
            </div>
          ` : ''}
          ${status.cacheHit ? '<div class="status-badge">Using cached results</div>' : ''}
        </div>
      `
    },

    formatRichTextClient(text, fallbackHtml) {
      if (!text) {
        return fallbackHtml || '<div class="empty-state">Content not available.</div>'
      }
      const trimmed = text.trim()
      if (!trimmed) {
        return fallbackHtml || '<div class="empty-state">Content not available.</div>'
      }
      if (/[<][a-zA-Z]+/.test(trimmed)) {
        return trimmed.includes('briefing-rich-text')
          ? trimmed
          : `<div class="briefing-rich-text">${trimmed}</div>`
      }
      const structured = this.renderStructuredMarkdown(trimmed)
      if (!structured) {
        const safe = this.escapeHtml(trimmed).replace(/\n/g, '<br>')
        return `<div class="briefing-rich-text"><p>${safe}</p></div>`
      }
      return `<div class="briefing-rich-text">${structured}</div>`
    },

    renderNarrative(briefing) {
      const container = document.getElementById('narrativeContent')
      if (!container) return
      const narrative = briefing?.artifacts?.narrative
      container.innerHTML = this.formatRichTextClient(narrative, '<div class="empty-state">Run “Assemble This Week” to generate the narrative briefing.</div>')
    },

    deriveStats(briefing) {
      const stats = briefing?.dataset?.stats
      if (stats && typeof stats.totalUpdates === 'number') {
        const impact = stats.byImpact || {}
        return {
          totalUpdates: stats.totalUpdates,
          byImpact: {
            Significant: impact.Significant || 0,
            Moderate: impact.Moderate || 0,
            Informational: impact.Informational || 0
          }
        }
      }

      const updates = Array.isArray(briefing?.dataset?.currentUpdates) ? briefing.dataset.currentUpdates : []
      const derivedImpact = updates.reduce((acc, update) => {
        const raw = (update?.impact_level || update?.impact || '').toString().toLowerCase()
        if (raw.includes('significant') || raw.includes('high')) {
          acc.Significant += 1
        } else if (raw.includes('moderate')) {
          acc.Moderate += 1
        } else {
          acc.Informational += 1
        }
        return acc
      }, { Significant: 0, Moderate: 0, Informational: 0 })

      return {
        totalUpdates: updates.length,
        byImpact: derivedImpact
      }
    },

    renderStats(briefing) {
      const container = document.getElementById('statsList')
      if (!container) return
      const stats = this.deriveStats(briefing)
      const impact = stats.byImpact || { Significant: 0, Moderate: 0, Informational: 0 }
      container.innerHTML = [
        `<li class="stat-item"><span>Total updates</span><strong>${this.escapeHtml(String(stats.totalUpdates || 0))}</strong></li>`,
        `<li class="stat-item"><span>High impact</span><strong>${this.escapeHtml(String(impact.Significant || 0))}</strong></li>`,
        `<li class="stat-item"><span>Moderate</span><strong>${this.escapeHtml(String(impact.Moderate || 0))}</strong></li>`,
        `<li class="stat-item"><span>Informational</span><strong>${this.escapeHtml(String(impact.Informational || 0))}</strong></li>`
      ].join('')
    },

    findFallbackBriefingId(currentId) {
      const list = Array.isArray(this.state.recent) ? this.state.recent : []
      for (const entry of list) {
        if (!entry || !entry.id) continue
        if (entry.id === currentId) continue
        this._fallbackAttempts = this._fallbackAttempts || new Set()
        if (this._fallbackAttempts.has(entry.id)) continue
        return entry.id
      }
      return null
    },

    queueFallbackLoad(id) {
      if (!id) return
      this._fallbackAttempts = this._fallbackAttempts || new Set()
      if (this._fallbackAttempts.has(id)) return
      this._fallbackAttempts.add(id)
      Promise.resolve()
        .then(() => this.loadLatestBriefing(id))
        .catch(error => console.error('Fallback briefing load failed:', error))
    },

    renderTimeline(briefing) {
      const container = document.getElementById('timelineContent')
      if (!container) return
      const timeline = briefing?.dataset?.historyTimeline
      if (!Array.isArray(timeline) || timeline.length === 0) {
        container.innerHTML = '<div class="empty-state">Timeline populates when a briefing is generated.</div>'
        return
      }
      const rows = timeline.slice(-8).map(entry => `
        <div class="timeline-item">
          <span>${this.escapeHtml(this.formatDate(entry.date))}</span>
          <strong>${this.escapeHtml(String(entry.count || 0))}</strong>
        </div>
      `).join('')
      container.innerHTML = rows
    },

    renderChangeDetection(briefing) {
      const container = document.getElementById('changeContent')
      if (!container) return
      const changes = briefing?.dataset?.changeDetection
      if (!Array.isArray(changes) || changes.length === 0) {
        container.innerHTML = '<div class="empty-state">No change analysis yet.</div>'
        return
      }
      container.innerHTML = changes.slice(0, 6).map(change => `
        <article class="change-card">
          <header>
            <span class="change-metric">${this.escapeHtml(change.metric || 'Signal')}</span>
            <span class="change-value">${this.escapeHtml(String(change.value || '0'))}</span>
          </header>
          <p>${this.escapeHtml(change.summary || '')}</p>
        </article>
      `).join('')
    },

    collectOnePagerUpdates(briefing) {
      const pool = Array.isArray(briefing?.dataset?.highlightUpdates) && briefing.dataset.highlightUpdates.length > 0
        ? briefing.dataset.highlightUpdates
        : briefing?.dataset?.currentUpdates || []
      if (!Array.isArray(pool)) return []
      return pool.slice(0, 3)
    },

    buildOnePagerMetricsClient(briefing) {
      const stats = this.deriveStats(briefing)
      const impact = stats.byImpact || {}
      const updatesPool = this.collectOnePagerUpdates(briefing)
      const urgentCount = updatesPool.filter(update => {
        const urgency = (update?.urgency || '').toString().toLowerCase()
        return urgency.includes('high') || urgency.includes('urgent')
      }).length
      const authoritiesCount = Array.from(
        new Set(
          updatesPool
            .map(update => update?.authority)
            .filter(Boolean)
        )
      ).length

      return [
        { icon: 'radar', value: stats.totalUpdates ?? 0, label: 'Updates monitored', helper: 'Tracked this cycle' },
        { icon: 'alert', value: impact.Significant ?? 0, label: 'High-impact notices', helper: 'Require immediate review' },
        { icon: 'clock', value: urgentCount, label: 'Urgent signals', helper: 'Flagged for rapid follow-up' },
        { icon: 'building', value: authoritiesCount, label: 'Active authorities', helper: 'Issuing updates this week' }
      ]
    },

    stylizeOnePagerBodyClient(html) {
      if (!html) return ''
      if (html.includes('**') && !html.includes('<')) {
        const structured = this.renderStructuredMarkdown(html, {
          headingTag: 'h3',
          headingClass: 'one-pager__heading'
        })
        return `<div class="one-pager">${structured}</div>`
      }
      const normalised = html
        .replace(/<h4>/g, '<h3 class="one-pager__heading">')
        .replace(/<\/h4>/g, '</h3>')
      return normalised.includes('one-pager')
        ? normalised
        : `<div class="one-pager">${normalised}</div>`
    },

    buildOnePagerSpotlightsClient(briefing) {
      const pool = this.collectOnePagerUpdates(briefing)
      if (!Array.isArray(pool) || pool.length === 0) return ''
      const items = pool.map((item, index) => `
        <li class="executive-spotlights__item">
          <span class="executive-spotlights__index">${String(index + 1).padStart(2, '0')}</span>
          <div class="executive-spotlights__content">
            <span class="executive-spotlights__authority">${this.escapeHtml(item?.authority || 'Unknown authority')}</span>
            <span class="executive-spotlights__title">${this.escapeHtml(item?.title || 'No headline provided')}</span>
            <span class="executive-spotlights__meta">${this.escapeHtml(this.formatDate(item?.published_date))}</span>
          </div>
        </li>
      `).join('')
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
    },

    buildExecutiveOnePagerHtmlClient(briefing) {
      if (!briefing?.artifacts?.onePager) {
        return '<div class="empty-state">Generate a briefing to view the one-pager.</div>'
      }
      const stats = this.deriveStats(briefing)
      const metrics = this.buildOnePagerMetricsClient(briefing)
      const metricCards = metrics.map((metric, index) => `
        <article class="executive-panel" data-index="${index}">
          <span class="executive-panel__label">${this.escapeHtml(metric.label)}</span>
          <span class="executive-panel__value">${this.escapeHtml(String(metric.value ?? '—'))}</span>
          ${metric.helper ? `<span class="executive-panel__helper">${this.escapeHtml(metric.helper)}</span>` : ''}
        </article>
      `).join('')

      const coverage = briefing?.dateRange
        ? `${this.formatDate(briefing.dateRange.start)} — ${this.formatDate(briefing.dateRange.end)}`
        : 'Period unavailable'
      const generated = this.formatDateTime(briefing?.generatedAt)
      const bodyHtml = this.stylizeOnePagerBodyClient(briefing.artifacts.onePager)
      const spotlights = this.buildOnePagerSpotlightsClient(briefing)
      const heroTagline = [
        stats.totalUpdates != null ? `${stats.totalUpdates} regulatory developments analysed` : '',
        stats.byImpact?.Significant != null ? `${stats.byImpact.Significant} flagged high-impact` : ''
      ].filter(Boolean).join(' · ') || 'Curated regulatory intelligence for your leadership team.'

      return `
        <article class="executive-brief">
          <header class="executive-hero">
            <span class="executive-hero__label">Weekly Regulatory Roundup</span>
            <h1 class="executive-hero__title">Executive Summary</h1>
            <p class="executive-hero__tagline">${this.escapeHtml(heroTagline)}</p>
            <div class="executive-hero__meta">
              <div class="executive-hero__meta-item">
                <span class="meta-label">Coverage</span>
                <span class="meta-value">${this.escapeHtml(coverage)}</span>
              </div>
              <div class="executive-hero__meta-item">
                <span class="meta-label">Published</span>
                <span class="meta-value">${this.escapeHtml(generated)}</span>
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
    },

    renderOnePager(briefing) {
      const container = document.getElementById('onePagerContent')
      if (!container) return
      container.innerHTML = this.buildExecutiveOnePagerHtmlClient(briefing)
    },

    renderTeamBriefing(briefing) {
      const container = document.getElementById('teamBriefingContent')
      if (!container) return
      const copy = briefing?.artifacts?.teamBriefing
      container.innerHTML = this.formatRichTextClient(copy, '<div class="empty-state">Team briefing notes appear after generation.</div>')
    },

    renderAnnotations() {
      const container = this.dom.annotationListEl
      if (!container) return

      const annotations = Array.isArray(this.state.annotations) ? this.state.annotations : []
      const filtered = annotations.filter(annotation => {
        if (this.state.annotationFilter === 'all') return true
        return (annotation.status || 'analyzing') === this.state.annotationFilter
      })

      if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state">No annotations match the selected view.</div>'
        return
      }

      container.innerHTML = ''
      filtered.forEach(annotation => {
        const item = document.createElement('div')
        item.className = 'annotation-item'
        const status = annotation.status || 'analyzing'
        const author = annotation.author || 'Unknown'
        const timestamp = annotation.updated_at || annotation.created_at
        const tags = Array.isArray(annotation.tags) ? annotation.tags : []
        const assigned = Array.isArray(annotation.assigned_to) ? annotation.assigned_to : []
        const links = Array.isArray(annotation.linked_resources) ? annotation.linked_resources : []

        const headerHtml = [
          `<span class="annotation-meta">Update ${this.escapeHtml(annotation.update_id || 'n/a')}</span>`,
          `<span class="${this.statusClass(status)}">${this.statusLabel(status)}</span>`
        ].join('')

        const bodyHtml = this.escapeHtml(annotation.content || '').replace(/\n/g, '<br>')
        const metaParts = [
          this.visibilityLabel(annotation.visibility),
          this.escapeHtml(author),
          this.escapeHtml(this.formatDateTime(timestamp))
        ]

        let html = ''
        html += `<div class="annotation-header">${headerHtml}</div>`
        html += `<div class="annotation-body">${bodyHtml}</div>`
        html += `<div class="annotation-meta">${metaParts.join(' · ')}</div>`

        if (tags.length > 0) {
          html += `<div class="annotation-tags">${tags.map(tag => `<span class="annotation-tag">${this.escapeHtml(tag)}</span>`).join('')}</div>`
        }

        if (assigned.length > 0) {
          html += `<div class="annotation-meta annotation-assigned">Assigned: ${assigned.map(value => this.escapeHtml(value)).join(', ')}</div>`
        }

        if (links.length > 0) {
          html += `<div class="annotation-meta annotation-links">Links: ${links.map(resource => `<a href="${this.escapeAttribute(resource)}" target="_blank">${this.escapeHtml(resource)}</a>`).join(', ')}</div>`
        }

        item.innerHTML = html
        container.appendChild(item)
      })
    },

    renderMetrics() {
      const runsEl = this.dom.metricsRunsEl
      const cacheEl = this.dom.metricsCacheEl
      const tokensEl = this.dom.metricsTokensEl
      const durationEl = this.dom.metricsDurationEl
      if (!runsEl || !cacheEl || !tokensEl || !durationEl) return

      const metrics = this.state.metrics || {}
      runsEl.textContent = this.escapeHtml(String(metrics.total_runs || 0))
      cacheEl.textContent = this.escapeHtml(`${metrics.cache_hit_rate || 0}%`)
      tokensEl.textContent = this.escapeHtml(String(metrics.tokens_last_run || 0))
      durationEl.textContent = this.escapeHtml(metrics.last_run_duration ? this.formatDuration(metrics.last_run_duration) : '—')
    },

    renderRecentBriefings() {
      const container = document.getElementById('recentBriefingsList')
      if (!container) return
      const list = Array.isArray(this.state.recent) ? this.state.recent : []
      if (list.length === 0) {
        container.innerHTML = '<li>No previous briefings found</li>'
        return
      }
      container.innerHTML = list.map(item => `
        <li>
          <strong>${this.escapeHtml(item.title || `Briefing ${item.id || ''}`)}</strong>
          <span>${this.escapeHtml(this.formatDate(item.generatedAt || item.created_at))}</span>
        </li>
      `).join('')
    },

    renderMeta(briefing) {
      const metaEl = this.dom.metaEl
      if (!metaEl) return
      if (!briefing) {
        metaEl.innerHTML = '<span>No briefing assembled yet</span>'
        return
      }
      const parts = []
      if (briefing.dateRange) {
        parts.push(`Coverage ${this.formatDate(briefing.dateRange.start)} — ${this.formatDate(briefing.dateRange.end)}`)
      }
      parts.push(`Generated ${this.formatDate(briefing.generatedAt)}`)
      if (briefing.metadata?.totals?.currentUpdates) {
        parts.push(`${briefing.metadata.totals.currentUpdates} updates analysed`)
      }
      if (briefing.dataset?.highlightUpdates?.length) {
        parts.push(`${briefing.dataset.highlightUpdates.length} priority items surfaced`)
      }
      if (briefing.dataset?.samplingWindowDays) {
        parts.push(`Sampling window ${briefing.dataset.samplingWindowDays} days`)
      }
      metaEl.innerHTML = parts.map(text => `<span>${this.escapeHtml(text)}</span>`).join('')
    },

    renderBriefing(briefing) {
      const stats = this.deriveStats(briefing)
      if ((stats.totalUpdates || 0) === 0) {
        const fallbackId = this.findFallbackBriefingId(briefing?.id)
        if (fallbackId) {
          this.queueFallbackLoad(fallbackId)
          return
        }
      }
      this.state.current = briefing
      if (Array.isArray(briefing?.dataset?.currentUpdates)) {
        window.initialUpdates = briefing.dataset.currentUpdates.map(update => ({ ...update }))
      }
      this.renderMeta(briefing)
      this.renderOnePager(briefing)
      this.renderNarrative(briefing)
      this.renderStats(briefing)
      this.renderTimeline(briefing)
      this.renderChangeDetection(briefing)
      this.renderTeamBriefing(briefing)
      this.renderHighlightsSafe(briefing?.dataset?.highlightUpdates || [])
      this.renderAnnotations()
    }
  })
}

export { applyRenderMixin }
