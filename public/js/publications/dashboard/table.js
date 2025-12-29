export function applyTableMixin(klass) {
  Object.assign(klass.prototype, {
    sortNotices(column) {
      if (this.sortBy === column) {
        this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'
      } else {
        this.sortBy = column
        this.sortDir = 'desc'
      }
  
      // Reset to first page and fetch from server with new sort order
      this.currentPage = 1
      this.loadNotices(this.currentFilters || {})
      this.updateSortIndicators()
    },
    renderTable() {
      const tbody = document.getElementById('notices-tbody')
      if (!tbody) return
  
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      const pageNotices = this.filteredNotices.slice(start, end)
  
      if (pageNotices.length === 0) {
        this.renderEmptyTable('No notices found')
        return
      }
  
      tbody.innerHTML = pageNotices.map(notice => this.renderTableRow(notice)).join('')
      this.renderPagination()
      this.updateResultsCount()
    },
    renderTableRow(notice) {
      const fineAmount = notice.fine_amount
        ? `£${Number(notice.fine_amount).toLocaleString()}`
        : '<span class="fine-amount no-fine">-</span>'
  
      const riskClass = notice.risk_score >= 70 ? 'risk-high'
        : notice.risk_score >= 40 ? 'risk-medium'
        : 'risk-low'
  
      const outcomeClass = `outcome-${notice.outcome_type || 'other'}`
  
      const noticeDate = notice.notice_date
        ? new Date(notice.notice_date).toLocaleDateString('en-GB')
        : '-'
  
      return `
        <tr class="clickable" onclick="publicationsDashboard.showDetail('${notice.publication_id}')">
          <td><strong>${this.escapeHtml(notice.entity_name || 'Unknown')}</strong></td>
          <td>${notice.frn || '-'}</td>
          <td><span class="outcome-badge ${outcomeClass}">${notice.outcome_type || 'other'}</span></td>
          <td class="fine-amount">${fineAmount}</td>
          <td>${notice.primary_breach_type || '-'}</td>
          <td><span class="risk-badge ${riskClass}">${notice.risk_score || 0}</span></td>
          <td>${noticeDate}</td>
          <td>
            ${notice.pdf_url ? `<a href="${notice.pdf_url}" target="_blank" class="action-btn view-pdf" onclick="event.stopPropagation()">PDF</a>` : ''}
            <button class="action-btn" onclick="event.stopPropagation(); publicationsDashboard.showDetail('${notice.publication_id}')">Details</button>
          </td>
        </tr>
      `
    },
    renderEmptyTable(message) {
      const tbody = document.getElementById('notices-tbody')
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8">
              <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                <h3>${message}</h3>
                <p>Try adjusting your filters or run a backfill to populate data.</p>
              </div>
            </td>
          </tr>
        `
      }
    },
    renderPagination() {
      // Use server-side total for accurate total pages
      const total = this.totalNotices || this.filteredNotices.length
      const totalPages = Math.ceil(total / this.pageSize)
      const prevBtn = document.getElementById('prev-page')
      const nextBtn = document.getElementById('next-page')
      const pageNumbers = document.getElementById('page-numbers')
  
      if (prevBtn) prevBtn.disabled = this.currentPage <= 1
      if (nextBtn) nextBtn.disabled = this.currentPage >= totalPages
  
      if (pageNumbers) {
        let pages = []
        // Show up to 5 page numbers centered around current page
        let startPage = Math.max(1, this.currentPage - 2)
        let endPage = Math.min(totalPages, startPage + 4)
        if (endPage - startPage < 4) {
          startPage = Math.max(1, endPage - 4)
        }
        for (let i = startPage; i <= endPage; i++) {
          pages.push(`<span class="page-num ${i === this.currentPage ? 'active' : ''}" onclick="publicationsDashboard.goToPage(${i})">${i}</span>`)
        }
        pageNumbers.innerHTML = pages.join('')
      }
  
      const showingEl = document.getElementById('pagination-showing')
      if (showingEl) {
        // Use server-side total for accurate pagination
        const total = this.totalNotices || this.filteredNotices.length
        const start = total > 0 ? (this.currentPage - 1) * this.pageSize + 1 : 0
        const end = Math.min((this.currentPage - 1) * this.pageSize + this.filteredNotices.length, total)
        showingEl.textContent = `Showing ${start}-${end} of ${this.formatNumber(total)}`
      }
    },
    updateResultsCount() {
      const countEl = document.getElementById('results-count')
      if (countEl) {
        // Use server-side total for accurate count
        const total = this.totalNotices || this.filteredNotices.length
        countEl.textContent = `${this.formatNumber(total)} notices found`
      }
    },
    updateSortIndicators() {
      document.querySelectorAll('.data-table th.sortable').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc')
        if (th.dataset.sort === this.sortBy) {
          th.classList.add(`sort-${this.sortDir}`)
        }
      })
    },
    goToPage(page) {
      this.currentPage = page
      // Fetch new page data from server
      this.loadNotices(this.currentFilters || {})
    }
  
  })
}
