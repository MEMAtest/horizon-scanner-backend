export function applyWidgetsMixin(klass) {
  Object.assign(klass.prototype, {
    renderTopFines() {
      const container = document.getElementById('top-fines-list')
      if (!container) return
  
      // Sort notices by fine amount (descending) and take top 5
      const topFines = [...this.notices]
        .filter(n => n.fine_amount && n.fine_amount > 0)
        .sort((a, b) => Number(b.fine_amount) - Number(a.fine_amount))
        .slice(0, 5)
  
      if (topFines.length === 0) {
        container.innerHTML = '<div class="empty-widget">No fines data available</div>'
        return
      }
  
      container.innerHTML = topFines.map((notice, i) => `
        <div class="top-fine-item" onclick="publicationsDashboard.showDetail('${notice.publication_id}')">
          <div class="top-fine-rank">${i + 1}</div>
          <div class="top-fine-details">
            <div class="top-fine-entity">${this.escapeHtml(notice.entity_name || 'Unknown')}</div>
            <div class="top-fine-meta">${notice.outcome_type || 'Fine'} • ${notice.notice_date ? new Date(notice.notice_date).getFullYear() : 'N/A'}</div>
          </div>
          <div class="top-fine-amount">${this.formatCurrency(notice.fine_amount)}</div>
        </div>
      `).join('')
    },
    renderRecentNotices() {
      const container = document.getElementById('recent-notices-list')
      if (!container) return
  
      // Sort by date and take most recent 5
      const recentNotices = [...this.notices]
        .filter(n => n.notice_date)
        .sort((a, b) => new Date(b.notice_date) - new Date(a.notice_date))
        .slice(0, 5)
  
      if (recentNotices.length === 0) {
        container.innerHTML = '<div class="empty-widget">No recent notices</div>'
        return
      }
  
      container.innerHTML = recentNotices.map(notice => `
        <div class="recent-notice-item" onclick="publicationsDashboard.showDetail('${notice.publication_id}')">
          <div class="recent-notice-icon">
            <span class="outcome-dot outcome-${notice.outcome_type || 'other'}"></span>
          </div>
          <div class="recent-notice-details">
            <div class="recent-notice-entity">${this.escapeHtml(notice.entity_name || 'Unknown')}</div>
            <div class="recent-notice-meta">
              ${notice.outcome_type || 'Unknown'}
              ${notice.fine_amount ? '• ' + this.formatCurrency(notice.fine_amount) : ''}
              • ${new Date(notice.notice_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>
      `).join('')
    }
  })
}
