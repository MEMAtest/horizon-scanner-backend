function applyDataMixin(klass) {
  Object.assign(klass.prototype, {
    async loadPreview(range) {
      try {
        if (this.dom.previewSummaryEl) {
          this.dom.previewSummaryEl.innerHTML = '<div class="empty-state">Loading weekly snapshot…</div>'
        }
        const params = new URLSearchParams()
        const desiredStart = range?.start || (this.dom.previewStartInput && this.dom.previewStartInput.value)
        const desiredEnd = range?.end || (this.dom.previewEndInput && this.dom.previewEndInput.value)
        if (desiredStart) params.set('start', desiredStart)
        if (desiredEnd) params.set('end', desiredEnd)
        const response = await fetch('/api/weekly-roundup/preview' + (params.size ? `?${params.toString()}` : ''))
        if (!response.ok) throw new Error('Failed to load preview')
        const data = await response.json()
        if (!data.success || !data.preview) throw new Error('No preview data available')
        this.state.previewRange = { start: data.preview.weekStart, end: data.preview.weekEnd }
        if (this.dom.previewStartInput) this.dom.previewStartInput.value = data.preview.weekStart
        if (this.dom.previewEndInput) this.dom.previewEndInput.value = data.preview.weekEnd

        const impact = data.preview.impactSummary || {}
        const authorities = Array.isArray(data.preview.topAuthorities) ? data.preview.topAuthorities : []
        const highlights = authorities.length
          ? `<ul class="preview-highlight-list">${authorities.map(item => `
              <li>
                <span class="preview-highlight-authority">${this.escapeHtml(item.authority || 'Unknown')}</span>
                <span class="preview-highlight-meta">${this.escapeHtml(String(item.count || 0))} updates</span>
              </li>
            `).join('')}</ul>`
          : '<p class="preview-empty">No authority breakdown available.</p>'

        if (this.dom.previewSummaryEl) {
          this.dom.previewSummaryEl.innerHTML = [
            '<div class="preview-grid">',
            `  <div class="preview-stat"><span class="preview-stat__label">Coverage</span><span class="preview-stat__value">${this.escapeHtml(this.formatDate(data.preview.weekStart))} — ${this.escapeHtml(this.formatDate(data.preview.weekEnd))}</span></div>`,
            `  <div class="preview-stat"><span class="preview-stat__label">Total updates</span><span class="preview-stat__value">${this.escapeHtml(String(data.preview.totalUpdates))}</span></div>`,
            `  <div class="preview-stat"><span class="preview-stat__label">High impact</span><span class="preview-stat__value">${this.escapeHtml(String(impact.significant || 0))}</span></div>`,
            `  <div class="preview-stat"><span class="preview-stat__label">Moderate</span><span class="preview-stat__value">${this.escapeHtml(String(impact.moderate || 0))}</span></div>`,
            '</div>',
            `<div><span class="preview-stat__label preview-top-authorities">Top authorities</span>${highlights}</div>`,
            '<p class="preview-note">Generation will reuse cached outputs unless force regenerate stays on.</p>'
          ].join('')
        }
      } catch (error) {
        console.error(error)
        if (this.dom.previewSummaryEl) {
          this.dom.previewSummaryEl.innerHTML = `<div class="empty-state">Unable to load preview: ${this.escapeHtml(error.message)}</div>`
        }
      }
    },

    async triggerRun() {
      const startValue = this.dom.previewStartInput ? this.dom.previewStartInput.value : ''
      const endValue = this.dom.previewEndInput ? this.dom.previewEndInput.value : ''
      if (!startValue || !endValue) {
        this.showToast('Select a date range before generating the briefing.', 'warning')
        return
      }

      const payload = {
        start: startValue,
        end: endValue,
        force: this.dom.previewForceCheckbox ? Boolean(this.dom.previewForceCheckbox.checked) : false
      }

      // Abort after 115s — slightly under the 120s Vercel function timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 115000)
      let progressTimer = null

      try {
        if (this.dom.confirmBtn) this.dom.confirmBtn.disabled = true
        if (this.dom.assembleBtn) this.dom.assembleBtn.disabled = true
        this.hideModal()
        this.updateRunStatus({ message: 'Generating briefing — this typically takes 30–90 seconds…', progress: 10 })

        // Simulate progress while waiting for the synchronous POST
        const startTime = Date.now()
        progressTimer = setInterval(() => {
          const elapsed = Math.floor((Date.now() - startTime) / 1000)
          const progress = Math.min(90, Math.floor((elapsed / 90) * 85) + 10)
          this.updateRunStatus({ message: 'Generating briefing — this typically takes 30–90 seconds…', progress })
        }, 3000)

        const response = await fetch('/api/weekly-briefings/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        })

        clearInterval(progressTimer)
        clearTimeout(timeoutId)

        let data
        try {
          data = await response.json()
        } catch {
          throw new Error(`Server returned ${response.status}: ${response.statusText}`)
        }

        if (!response.ok || data.success === false) {
          const reason = data.error || data.message || 'Briefing generation failed'
          if (data.timedOut) {
            this.updateRunStatus({ message: 'Generation is taking longer than expected. It may appear on your next page load.', progress: 95 })
            this.showToast('Generation is still in progress. Refresh the page shortly.', 'warning')
          } else {
            throw new Error(reason)
          }
          if (this.dom.confirmBtn) this.dom.confirmBtn.disabled = false
          if (this.dom.assembleBtn) this.dom.assembleBtn.disabled = false
          return
        }

        // Success — load the briefing
        this.updateRunStatus({ message: 'Briefing ready!', progress: 100 })
        await this.loadLatestBriefing(data.briefingId)
        try {
          await this.refreshAnnotationsFromServer()
        } catch (err) {
          console.warn('Annotation refresh failed:', err.message)
        }
        await this.loadMetrics()
        this.showToast(data.cacheHit ? 'Loaded cached briefing.' : 'Smart Briefing generated successfully.', 'success')
      } catch (error) {
        clearInterval(progressTimer)
        clearTimeout(timeoutId)
        console.error(error)

        if (error.name === 'AbortError') {
          this.updateRunStatus({ message: 'Generation is taking longer than expected. It may appear on your next page load.', progress: 0 })
          this.showToast('Generation is taking longer than expected. Refresh the page in a minute.', 'warning')
        } else {
          const message = (error && error.message) || 'Unable to start briefing generation'
          const friendly = /failed to fetch|network/i.test(message)
            ? 'Unable to reach the briefing service. Please confirm the API is running and try again.'
            : message
          this.updateRunStatus({ state: 'failed', message: friendly, progress: 0 })
          this.showToast(friendly, 'error', false)
        }
      } finally {
        if (this.dom.confirmBtn) this.dom.confirmBtn.disabled = false
        if (this.dom.assembleBtn) this.dom.assembleBtn.disabled = false
      }
    },

    async loadLatestBriefing(briefingId) {
      try {
        let url = '/api/weekly-briefings/latest'
        if (briefingId) {
          url = `/api/weekly-briefings/${encodeURIComponent(briefingId)}`
        }
        const response = await fetch(url)

        // 404 is expected when no briefing exists yet - don't treat as error
        if (response.status === 404) {
          console.log('[WeeklyBriefing] No briefing available yet')
          return
        }

        if (!response.ok) throw new Error('Failed to fetch latest briefing')
        const payload = await response.json()
        const briefing = payload.briefing || payload
        if (!briefing) throw new Error('No briefing returned')
        this.renderBriefing(briefing)
        this.state.current = briefing
        try {
          await this.refreshAnnotationsFromServer()
        } catch (error) {
          console.warn('[WeeklyBriefing] ⚠️ Annotation refresh failed:', error.message)
        }
        await this.refreshRecent()
        document.title = `Weekly Smart Briefing ${this.formatDate(briefing.dateRange?.start)} — ${this.formatDate(briefing.dateRange?.end)}`
      } catch (error) {
        console.error('[WeeklyBriefing] ❌ Failed to load briefing:', error)
        // Don't show toast on page load, only when explicitly requested
        if (briefingId) {
          this.showToast(error.message || 'Unable to load briefing', 'error')
        }
      }
    },

    async refreshRecent() {
      try {
        const response = await fetch('/api/weekly-briefings?limit=5')
        if (!response.ok) return
        const payload = await response.json()
        if (payload.success && Array.isArray(payload.briefings)) {
          this.state.recent = payload.briefings
          this.renderRecentBriefings()
        }
      } catch (error) {
        console.warn('Unable to refresh recent briefings:', error.message)
      }
    }
  })
}

export { applyDataMixin }
