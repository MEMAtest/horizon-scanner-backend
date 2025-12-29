export function applyStatsMixin(klass) {
  Object.assign(klass.prototype, {
    async loadStats() {
      try {
        // Load both status and stats endpoints in parallel
        const [statusResponse, statsResponse] = await Promise.all([
          fetch('/api/publications/status'),
          fetch('/api/publications/stats')
        ])
  
        const statusData = await statusResponse.json()
        const statsData = await statsResponse.json()
  
        if (statusData.success) {
          this.renderStats(statusData, statsData?.data)
        }
      } catch (error) {
        console.error('[publications] Failed to load stats:', error)
      }
    },
    renderStats(data, finesData = null) {
      // Store stats for later use
      this.stats = data
      this.finesStats = finesData
  
      // Update stat cards
      const indexed = data.index?.total || 0
      const processed = data.index?.byStatus?.processed || 0
      const pending = (data.index?.byStatus?.pending || 0) +
                     (data.index?.byStatus?.parsing || 0) +
                     (data.index?.byStatus?.downloading || 0)
  
      document.getElementById('total-indexed').textContent = this.formatNumber(indexed)
      document.getElementById('total-processed').textContent = this.formatNumber(processed)
      document.getElementById('total-pending').textContent = this.formatNumber(pending)
  
      // Update Total Fines from stats API (not calculated from paginated notices)
      if (finesData?.fines) {
        const totalFines = finesData.fines.total || 0
        const finesCount = finesData.fines.count || 0
        document.getElementById('total-fines').textContent = this.formatCurrency(totalFines)
  
        const finesHelper = document.getElementById('fines-helper')
        if (finesHelper) {
          finesHelper.textContent = `${this.formatNumber(finesCount)} cases with financial penalties`
        }
      }
  
      // Add helper text
      const indexedHelper = document.getElementById('indexed-helper')
      if (indexedHelper) indexedHelper.textContent = 'FCA publications indexed'
  
      const processedHelper = document.getElementById('processed-helper')
      if (processedHelper) processedHelper.textContent = 'AI-analysed enforcement notices'
  
      const pendingHelper = document.getElementById('pending-helper')
      if (pendingHelper) {
        // These are non-enforcement docs that can't be AI-classified
        pendingHelper.textContent = pending > 0 ? 'Non-enforcement docs' : 'Pipeline complete'
      }
  
      // Update pipeline status with indicator
      // Note: "pending" includes non-enforcement docs that can't be AI-classified
      // Show "Complete" if we have processed enforcement notices
      const statusEl = document.getElementById('pipeline-status-value')
      const statusIndicator = document.querySelector('.status-indicator')
  
      if (processed > 0) {
        // All processable enforcement notices have been analysed
        statusEl.textContent = 'Complete'
        if (statusIndicator) statusIndicator.classList.remove('processing')
      } else if (indexed > 0) {
        statusEl.textContent = 'Ready to process'
        if (statusIndicator) statusIndicator.classList.add('processing')
      } else {
        statusEl.textContent = 'Ready'
        if (statusIndicator) statusIndicator.classList.remove('processing')
      }
    }
  })
}
