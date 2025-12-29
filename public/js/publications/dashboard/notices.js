export function applyNoticesMixin(klass) {
  Object.assign(klass.prototype, {
    async loadNotices(filters = {}) {
      try {
        // Build query params - use server-side pagination
        const params = new URLSearchParams()
        const pageSize = this.pageSize || 20
        const offset = ((this.currentPage || 1) - 1) * pageSize
        params.set('limit', String(pageSize))
        params.set('offset', String(offset))
        params.set('sortBy', this.sortBy || 'notice_date')
        params.set('sortOrder', this.sortDir || 'desc')
  
        // Add filters
        if (filters.search) params.set('entity_name', filters.search)
        if (filters.outcome_type) params.set('outcome_type', filters.outcome_type)
        if (filters.breach_type) params.set('breach_type', filters.breach_type)
  
        const response = await fetch(`/api/publications/notices?${params}`)
        const data = await response.json()
  
        if (data.success) {
          this.notices = data.notices || []
          this.filteredNotices = [...this.notices]
          // Store server-side total for pagination
          this.totalNotices = data.pagination?.total || this.notices.length
          this.renderTable()
        }
      } catch (error) {
        console.error('[publications] Failed to load notices:', error)
        this.renderEmptyTable('Failed to load notices')
      }
    },
    updateFinesCount() {
      const noticesWithFines = this.notices.filter(n => n.fine_amount && n.fine_amount > 0)
      const finesCount = noticesWithFines.length
      const totalFines = noticesWithFines.reduce((sum, n) => sum + Number(n.fine_amount || 0), 0)
  
      // Update count
      document.getElementById('total-fines').textContent = this.formatCurrency(totalFines)
  
      // Update helper text
      const finesHelper = document.getElementById('fines-helper')
      if (finesHelper) {
        finesHelper.textContent = `${this.formatNumber(finesCount)} cases with financial penalties`
      }
    },
    applyFilters() {
      const searchInput = document.getElementById('search-input')?.value?.trim() || ''
      const outcomeFilter = document.getElementById('outcome-filter')?.value || ''
      const breachFilter = document.getElementById('breach-filter')?.value || ''
      const riskFilter = document.getElementById('risk-filter')?.value || ''
  
      // Use server-side search for entity name
      const filters = {}
      if (searchInput) filters.search = searchInput
      if (outcomeFilter) filters.outcome_type = outcomeFilter
      if (breachFilter) filters.breach_type = breachFilter
  
      // Store current filters for pagination
      this.currentFilters = filters
      this.currentPage = 1
  
      // Show loading state
      const tbody = document.getElementById('notices-tbody')
      if (tbody) {
        tbody.innerHTML = `
          <tr class="loading-row">
            <td colspan="8">
              <div class="loading-state">
                <div class="loading-spinner"></div>
                <span>Searching...</span>
              </div>
            </td>
          </tr>
        `
      }
  
      // Load filtered notices from server
      this.loadNotices(filters).then(() => {
        // Apply client-side risk filter (not supported by API)
        if (riskFilter) {
          this.filteredNotices = this.notices.filter(notice => {
            const score = notice.risk_score || 0
            if (riskFilter === 'high' && score < 70) return false
            if (riskFilter === 'medium' && (score < 40 || score >= 70)) return false
            if (riskFilter === 'low' && score >= 40) return false
            return true
          })
          this.renderTable()
        }
        this.updateResultsCount()
      })
  
      this.currentPage = 1
    }
  })
}
