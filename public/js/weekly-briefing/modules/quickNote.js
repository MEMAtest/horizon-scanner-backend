function applyQuickNoteMixin(klass) {
  Object.assign(klass.prototype, {
    loadQuickNoteDefaults() {
      if (typeof window === 'undefined' || !window.localStorage) {
        return { recipient: '', firm: '', sender: '' }
      }
      try {
        const raw = window.localStorage.getItem(this.QUICK_NOTE_STORAGE_KEY)
        if (!raw) {
          return { recipient: '', firm: '', sender: '' }
        }
        const parsed = JSON.parse(raw)
        return {
          recipient: this.cleanText(parsed.recipient),
          firm: this.cleanText(parsed.firm),
          sender: this.cleanText(parsed.sender)
        }
      } catch (error) {
        console.warn('Quick note defaults load failed:', error)
        return { recipient: '', firm: '', sender: '' }
      }
    },

    saveQuickNoteDefaults(overrides) {
      if (typeof window === 'undefined' || !window.localStorage) {
        return
      }
      try {
        const payload = {
          recipient: this.cleanText(overrides.recipient),
          firm: this.cleanText(overrides.firm),
          sender: this.cleanText(overrides.sender)
        }
        window.localStorage.setItem(this.QUICK_NOTE_STORAGE_KEY, JSON.stringify(payload))
      } catch (error) {
        console.warn('Quick note defaults save failed:', error)
      }
    },

    extractSummaryBullets(summary) {
      const clean = this.cleanText(summary)
      if (!clean) return []
      const segments = clean
        .split(/(?<=[.!?])\s+/)
        .map(segment => segment.trim())
        .filter(Boolean)
      if (segments.length === 0) {
        return [clean.length > 180 ? `${clean.slice(0, 177).trimEnd()}…` : clean]
      }
      return segments.slice(0, 3).map(segment => {
        return segment.length > 180 ? `${segment.slice(0, 177).trimEnd()}…` : segment
      })
    },

    resolveUpdateById(updateId, updateUrl) {
      const id = this.cleanText(updateId)
      const url = this.cleanText(updateUrl)
      if (!id && !url) return null

      const pools = [
        this.state.current?.dataset?.highlightUpdates,
        this.state.current?.dataset?.currentUpdates,
        window.filteredUpdates,
        window.originalUpdates,
        window.initialUpdates
      ]

      for (const pool of pools) {
        if (!Array.isArray(pool)) continue
        const match = pool.find(update => {
          if (!update) return false
          const updateIdentifier = update.id || update.update_id || update.note_id || update.original_id
          if (id && String(updateIdentifier) === id) return true
          if (url && update.url && update.url === url) return true
          return false
        })
        if (match) return match
      }
      return null
    },

    buildQuickNoteBase(payload = {}, resolved = null) {
      const source = resolved || {}
      const summaryCandidate = payload.summary ||
        source.ai_summary ||
        source.summary ||
        source.description ||
        ''
      const summary = this.cleanText(summaryCandidate)

      return {
        id: this.cleanText(payload.updateId || source.id || source.update_id || ''),
        headline: this.cleanText(payload.headline || source.headline || source.title || ''),
        authority: this.cleanText(payload.authority || source.authority || ''),
        summary,
        bullets: this.extractSummaryBullets(summary),
        impact: this.cleanText(payload.impact || source.impact_level || source.impactLevel || ''),
        urgency: this.cleanText(payload.urgency || source.urgency || ''),
        published: this.cleanText(payload.published || source.published_date || source.publishedDate || source.created_at || source.createdAt || ''),
        url: this.cleanText(payload.url || source.url || ''),
        regulatoryArea: this.cleanText(payload.regulatoryArea || source.regulatory_area || source.regulatoryArea || source.area || '')
      }
    },

    buildQuickNoteContent(base, overrides = {}) {
      const recipient = this.cleanText(overrides.recipient || this.quickNoteState.defaults.recipient || 'client')
      const firm = this.cleanText(overrides.firm || this.quickNoteState.defaults.firm || 'the team')
      const sender = this.cleanText(overrides.sender || this.quickNoteState.defaults.sender || 'Horizon Scanner Team')
      const lines = [
        `Hi ${recipient},`,
        '',
        `Here’s a quick note for ${firm}:`,
        ''
      ]

      if (base.headline) {
        lines.push(`• ${base.headline}`)
      }

      if (Array.isArray(base.bullets) && base.bullets.length) {
        lines.push('')
        base.bullets.forEach(bullet => {
          lines.push(`  - ${bullet}`)
        })
      } else if (base.summary) {
        lines.push('')
        lines.push(base.summary)
      }

      const metaParts = []
      if (base.authority) metaParts.push(`Authority: ${base.authority}`)
      if (base.impact) metaParts.push(`Impact: ${base.impact}`)
      if (base.urgency) metaParts.push(`Urgency: ${base.urgency}`)
      if (base.regulatoryArea) metaParts.push(`Focus: ${base.regulatoryArea}`)
      if (metaParts.length > 0) {
        lines.push('')
        lines.push(metaParts.join(' • '))
      }
      if (base.url) {
        lines.push('')
        lines.push(`Source: ${base.url}`)
      }
      lines.push('')
      lines.push(`— ${sender}`)

      return lines.join('\n').replace(/\n{3,}/g, '\n\n')
    },

    syncQuickNoteDefaultsFromInputs() {
      this.quickNoteState.defaults = {
        recipient: this.dom.quickNoteRecipientInput ? this.cleanText(this.dom.quickNoteRecipientInput.value) : this.quickNoteState.defaults.recipient,
        firm: this.dom.quickNoteFirmInput ? this.cleanText(this.dom.quickNoteFirmInput.value) : this.quickNoteState.defaults.firm,
        sender: this.dom.quickNoteSenderInput ? this.cleanText(this.dom.quickNoteSenderInput.value) : this.quickNoteState.defaults.sender
      }
    },

    updateQuickNotePreview(force = false) {
      if (!this.quickNoteElementsReady || !this.quickNoteState.base || !this.dom.quickNoteContentInput) return
      if (!force && this.quickNoteState.userEdited && this.dom.quickNoteContentInput.value !== this.quickNoteState.lastGeneratedContent) {
        return
      }

      const overrides = {
        recipient: this.dom.quickNoteRecipientInput ? this.dom.quickNoteRecipientInput.value : '',
        firm: this.dom.quickNoteFirmInput ? this.dom.quickNoteFirmInput.value : '',
        sender: this.dom.quickNoteSenderInput ? this.dom.quickNoteSenderInput.value : ''
      }

      const content = this.buildQuickNoteContent(this.quickNoteState.base, overrides)
      this.quickNoteState.lastGeneratedContent = content
      this.quickNoteState.userEdited = false
      this.dom.quickNoteContentInput.value = content
    },

    closeQuickNoteComposer() {
      if (this.dom.quickNoteModal) {
        this.dom.quickNoteModal.classList.remove('visible')
      }
      this.syncQuickNoteDefaultsFromInputs()
      this.saveQuickNoteDefaults(this.quickNoteState.defaults)
      this.quickNoteState.activeUpdateId = null
      this.quickNoteState.activeUpdate = null
      this.quickNoteState.base = null
      this.quickNoteState.userEdited = false
    },

    openQuickNoteComposer(payload = {}) {
      if (!this.quickNoteElementsReady) {
        this.showToast('Quick notes are not available on this view.', 'warning')
        return
      }

      const resolved = this.resolveUpdateById(payload.updateId, payload.url)
      const base = this.buildQuickNoteBase(payload, resolved)
      if (!base.id && resolved && resolved.id) {
        base.id = this.cleanText(resolved.id)
      }

      this.quickNoteState.activeUpdateId = base.id
      this.quickNoteState.activeUpdate = resolved
      this.quickNoteState.base = base
      this.quickNoteState.userEdited = false
      this.quickNoteState.lastGeneratedContent = ''

      if (this.dom.quickNoteRecipientInput) this.dom.quickNoteRecipientInput.value = this.quickNoteState.defaults.recipient || ''
      if (this.dom.quickNoteFirmInput) this.dom.quickNoteFirmInput.value = this.quickNoteState.defaults.firm || ''
      if (this.dom.quickNoteSenderInput) this.dom.quickNoteSenderInput.value = this.quickNoteState.defaults.sender || ''

      this.updateQuickNotePreview(true)

      if (this.dom.quickNoteModal) {
        this.dom.quickNoteModal.classList.add('visible')
      }
      setTimeout(() => {
        if (this.dom.quickNoteRecipientInput) {
          this.dom.quickNoteRecipientInput.focus()
        }
      }, 0)
    },

    registerQuickNoteGlobal() {
      if (this.quickNoteElementsReady) {
        window.openQuickNoteComposer = payload => this.openQuickNoteComposer(payload)
      } else {
        window.openQuickNoteComposer = () => {
          this.showToast('Quick notes are not available on this page.', 'warning')
        }
      }
    }
  })
}

export { applyQuickNoteMixin }
