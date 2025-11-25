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

      try {
        if (this.dom.confirmBtn) this.dom.confirmBtn.disabled = true
        if (this.dom.assembleBtn) this.dom.assembleBtn.disabled = true
        this.updateRunStatus({ message: 'Submitting request…' })
        const response = await fetch('/api/weekly-briefings/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!response.ok) throw new Error('Failed to start briefing generation')
        const data = await response.json()

        if (!data || data.success === false) {
          const reason = (data && (data.error || data.message)) || 'Failed to start briefing generation'
          throw new Error(reason)
        }

        const runId =
          data.runId ||
          data.run_id ||
          data.id ||
          data.jobId ||
          (data.status && data.status.runId)

        if (!runId) {
          const notice = data && data.message
            ? data.message
            : 'Generation request acknowledged. Results will appear once processing completes.'
          this.hideModal()
          this.updateRunStatus({ message: notice })
          this.showToast(notice, 'info')
          if (this.dom.confirmBtn) this.dom.confirmBtn.disabled = false
          if (this.dom.assembleBtn) this.dom.assembleBtn.disabled = false
          return
        }

        this.hideModal()
        this.updateRunStatus({ message: 'Generation started' })
        this.pollRun(runId)
      } catch (error) {
        console.error(error)
        if (this.dom.confirmBtn) this.dom.confirmBtn.disabled = false
        if (this.dom.assembleBtn) this.dom.assembleBtn.disabled = false
        this.showToast(error.message || 'Unable to start briefing generation', 'error', false)
      }
    },

    async pollRun(runId) {
      if (!runId) return
      if (this.state.polling) {
        clearInterval(this.state.polling)
      }

      // Initialize progress tracking
      let pollCount = 0
      const startTime = Date.now()

      this.state.polling = setInterval(async () => {
        try {
          pollCount++
          const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)

          const response = await fetch(`/api/weekly-briefings/run/${encodeURIComponent(runId)}`)

          // Handle 404 - run may have expired or been cleaned up
          if (response.status === 404) {
            console.warn('[WeeklyBriefing] ⚠️ Run status not found, stopping polling')
            clearInterval(this.state.polling)
            if (this.dom.assembleBtn) this.dom.assembleBtn.disabled = false
            this.updateRunStatus({ state: 'failed', message: 'Generation status unavailable. The briefing may still be processing.', progress: 0 })
            return
          }

          if (!response.ok) throw new Error('Failed to check status')
          const payload = await response.json()

          // Calculate progress based on elapsed time and poll count
          // Assume typical generation takes 30-90 seconds
          let estimatedProgress = Math.min(95, Math.floor((elapsedSeconds / 60) * 100))

          // Add incremental progress per poll
          estimatedProgress = Math.min(95, estimatedProgress + (pollCount * 5))

          // Override with server-provided progress if available
          const serverProgress = payload.status?.progress
          const progress = serverProgress !== undefined ? serverProgress : estimatedProgress

          const statusWithProgress = {
            ...payload.status,
            progress: progress
          }

          this.updateRunStatus(statusWithProgress)

          if (!payload.status) return
          if (payload.status.state === 'completed') {
            // Show 100% completion
            this.updateRunStatus({ ...payload.status, progress: 100 })

            clearInterval(this.state.polling)
            if (this.dom.assembleBtn) this.dom.assembleBtn.disabled = false
            await this.loadLatestBriefing(payload.status.briefingId)
            try {
              await this.refreshAnnotationsFromServer()
            } catch (error) {
              console.warn('Annotation refresh failed:', error.message)
            }
            await this.loadMetrics()
            this.showToast(payload.status.cacheHit ? 'Loaded cached briefing.' : 'Smart Briefing generated successfully.', 'success')
          } else if (payload.status.state === 'failed') {
            clearInterval(this.state.polling)
            if (this.dom.assembleBtn) this.dom.assembleBtn.disabled = false
            this.showToast(payload.status.error || 'Briefing generation failed.', 'error', false)
          }
        } catch (error) {
          console.error(error)
          clearInterval(this.state.polling)
          if (this.dom.assembleBtn) this.dom.assembleBtn.disabled = false
          const message = (error && error.message) || 'Status check failed'
          const friendly = /failed to fetch|network/i.test(message)
            ? 'Unable to reach the briefing service. Please confirm the API is running and try again.'
            : message
          this.updateRunStatus({ state: 'failed', message: friendly, progress: 0 })
          this.showToast(friendly, 'error', false)
        }
      }, 3000)
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
