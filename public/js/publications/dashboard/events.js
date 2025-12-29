export function applyEventsMixin(klass) {
  Object.assign(klass.prototype, {
    setupEventListeners() {
      // Filters
      document.getElementById('apply-filters')?.addEventListener('click', () => this.applyFilters())
      document.getElementById('reset-filters')?.addEventListener('click', () => this.resetFilters())
      document.getElementById('search-input')?.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') this.applyFilters()
      })
  
      // Sorting
      document.querySelectorAll('.data-table th.sortable').forEach(th => {
        th.addEventListener('click', () => this.sortNotices(th.dataset.sort))
      })
  
      // Pagination - use server-side pagination
      document.getElementById('prev-page')?.addEventListener('click', () => {
        if (this.currentPage > 1) {
          this.goToPage(this.currentPage - 1)
        }
      })
      document.getElementById('next-page')?.addEventListener('click', () => {
        const total = this.totalNotices || this.filteredNotices.length
        const totalPages = Math.ceil(total / this.pageSize)
        if (this.currentPage < totalPages) {
          this.goToPage(this.currentPage + 1)
        }
      })
      document.getElementById('page-size')?.addEventListener('change', (e) => {
        this.pageSize = parseInt(e.target.value)
        this.currentPage = 1
        this.renderTable()
      })
  
      // Modal
      document.getElementById('close-modal')?.addEventListener('click', () => this.closeModal())
      document.getElementById('detail-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'detail-modal') this.closeModal()
      })
  
      // Refresh
      document.getElementById('refresh-btn')?.addEventListener('click', () => {
        this.loadStats()
        this.loadNotices()
      })
  
      // Export
      document.getElementById('export-btn')?.addEventListener('click', () => this.exportCsv())
    },
    resetFilters() {
      document.getElementById('search-input').value = ''
      document.getElementById('outcome-filter').value = ''
      document.getElementById('breach-filter').value = ''
      document.getElementById('risk-filter').value = ''
      this.filteredNotices = [...this.notices]
      this.currentPage = 1
      this.renderTable()
    },
    exportCsv() {
      const headers = ['Entity Name', 'FRN', 'Outcome', 'Fine Amount', 'Breach Type', 'Risk Score', 'Date', 'Summary']
      const rows = this.filteredNotices.map(n => [
        n.entity_name || '',
        n.frn || '',
        n.outcome_type || '',
        n.fine_amount || '',
        n.primary_breach_type || '',
        n.risk_score || '',
        n.notice_date || '',
        (n.ai_summary || '').replace(/"/g, '""')
      ])
  
      const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
  
      const a = document.createElement('a')
      a.href = url
      a.download = `fca-publications-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
  
  })
}
