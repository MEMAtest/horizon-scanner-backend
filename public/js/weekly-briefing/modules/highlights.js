function applyHighlightsMixin(klass) {
  Object.assign(klass.prototype, {
    classifyHighlightItem(update) {
      const title = this.normalizeHighlightText(update?.title)
      const summary = this.normalizeHighlightText(update?.summary)
      const tags = Array.isArray(update?.tags) ? this.normalizeHighlightText(update.tags.join(' ')) : ''
      const combined = [title, summary, tags].filter(Boolean).join(' ')

      if (this.highlightTextContains(combined, ['enforcement', 'penalty', 'penalties', 'fine', 'fined', 'sanction', 'ban', 'prohibition', 'censure', 'disciplinary'])) {
        return 'enforcement'
      }
      if (this.highlightTextContains(combined, ['consultation', 'call for evidence', 'feedback statement', 'discussion paper', 'request for comment', 'call for views'])) {
        return 'consultation'
      }
      if (this.highlightTextContains(combined, ['speech', 'speaking', 'remarks', 'address', 'keynote', 'fireside', 'conference', 'summit'])) {
        return 'speech'
      }
      return 'other'
    },

    buildHighlightMetaChips(update) {
      const impact = update?.impact_level || 'Informational'
      const urgency = update?.urgency || 'Low'
      const impactKey = this.highlightSlug(impact)
      const urgencyKey = this.highlightSlug(urgency)
      const chips = [
        `<span class="highlight-chip impact-${impactKey}">Impact: ${this.escapeHtml(impact)}</span>`,
        `<span class="highlight-chip urgency-${urgencyKey}">Urgency: ${this.escapeHtml(urgency)}</span>`
      ]
      if (update?.business_impact_score) {
        chips.push(`<span class="highlight-chip score">Impact score: ${this.escapeHtml(String(update.business_impact_score))}</span>`)
      }
      return chips.join('')
    },

    buildHighlightCardHtml(update, categoryKey) {
      const theme = this.highlightThemes[categoryKey] || this.highlightThemes.other
      const authority = this.escapeHtml(update?.authority || 'Unknown authority')
      const date = this.formatDate(update?.published_date)
      const title = (update?.title || '').trim()
      const titleClass = title ? 'highlight-title' : 'highlight-title highlight-title--empty'
      const summary = this.truncateHighlightSummary(update?.summary || '', 220)
      const summaryHtml = summary ? this.escapeHtml(summary) : 'Summary not available.'
      const metaChips = this.buildHighlightMetaChips(update)
      const link = update?.url
        ? `<a class="highlight-link" href="${this.escapeHtml(update.url)}" target="_blank" rel="noopener">View source</a>`
        : ''

      return `
        <article class="highlight-card highlight-card--${theme.key}">
          <header class="highlight-card__header">
            <span class="highlight-chip authority">${authority}</span>
            <span class="highlight-chip date">${this.escapeHtml(date)}</span>
          </header>
          <div class="highlight-card__meta">${metaChips}</div>
          <h3 class="${titleClass}">${title ? this.escapeHtml(title) : 'No headline provided'}</h3>
          <p class="highlight-summary">${summaryHtml}</p>
          ${link ? `<footer class="highlight-card__footer">${link}</footer>` : ''}
        </article>
      `
    },

    buildHighlightGroupHtml(key, items) {
      const theme = this.highlightThemes[key] || this.highlightThemes.other
      const limitedItems = items.slice(0, this.MAX_UPDATES_PER_GROUP)
      const cards = limitedItems.map(item => this.buildHighlightCardHtml(item, key)).join('')
      return `
        <section class="highlight-group highlight-group--${theme.key}">
          <header class="highlight-group__header" style="--highlight-accent:${theme.accent};--highlight-tint:${theme.tint}">
            <span class="highlight-pill">${this.escapeHtml(theme.label)}</span>
            <span class="highlight-count">${items.length} highlight${items.length === 1 ? '' : 's'}</span>
          </header>
          <div class="highlight-list">
            ${cards}
          </div>
        </section>
      `
    },

    renderHighlights(updates) {
      const container = document.getElementById('updates-container')
      const list = Array.isArray(updates) ? updates.slice(0, this.MAX_HIGHLIGHT_UPDATES) : []

      if (typeof window.renderUpdatesList === 'function') {
        window.renderUpdatesList(list)
        return
      }

      if (!container) return
      container.className = 'updates-container cards-view'

      if (list.length === 0) {
        container.innerHTML = '<div class="empty-state">No highlighted updates available.</div>'
        return
      }

      if (typeof window.generateUpdateCard === 'function') {
        container.innerHTML = list.map(update => window.generateUpdateCard(update)).join('')
      } else {
        container.innerHTML = list.map(update => `
          <div class="update-card">
            <h3 class="update-card__title">${this.escapeHtml(update.headline || 'Update')}</h3>
            <p class="update-card__summary">${this.escapeHtml(update.summary || '')}</p>
          </div>
        `).join('')
      }
    },

    renderHighlightsSafe(updates) {
      const list = Array.isArray(updates) ? updates : []
      this.renderHighlights(list)
      return list
    }
  })
}

export { applyHighlightsMixin }
