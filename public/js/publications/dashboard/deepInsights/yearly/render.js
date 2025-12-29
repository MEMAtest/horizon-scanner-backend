export function renderYearlyBreakdown() {
  const container = document.getElementById('yearly-breakdown-grid')
  if (!container || !this.yearlyBreakdown) return

  const years = this.yearlyBreakdown
  if (years.length === 0) {
    container.innerHTML = '<div class="empty-deep">No yearly data available</div>'
    return
  }

  // Update stats
  const yearsCount = years.length
  const peakYear = years.reduce((max, y) => y.totalCount > max.totalCount ? y : max, years[0])
  const peakFinesYear = years.reduce((max, y) => y.totalFines > max.totalFines ? y : max, years[0])

  document.getElementById('years-covered').textContent = yearsCount
  document.getElementById('peak-year').textContent = `${peakYear.year} (${this.formatNumber(peakYear.totalCount)})`
  document.getElementById('peak-fines-year').textContent = `${peakFinesYear.year} (${this.formatCurrency(peakFinesYear.totalFines)})`

  // Find max for bar scaling
  const maxCount = Math.max(...years.map(y => y.totalCount))

  // Outcome type labels
  const outcomeLabels = {
    cancellation: 'Cancellations',
    fine: 'Fines',
    prohibition: 'Prohibitions',
    restriction: 'Restrictions',
    censure: 'Censures',
    warning: 'Warnings',
    supervisory_notice: 'Supervisory',
    public_statement: 'Statements',
    voluntary_requirement: 'Voluntary',
    other: 'Other'
  }

  container.innerHTML = years.map(year => {
    const widthPercent = (year.totalCount / maxCount * 100).toFixed(0)

    // Get outcome breakdown
    const outcomes = Object.entries(year.outcomes || {})
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 4)
      .map(([type, data]) => `${outcomeLabels[type] || type}: ${data.count}`)
      .join(' · ')

    return `
          <div class="yearly-row" data-year="${year.year}">
            <div class="yearly-year">
              <span class="year-number">${year.year}</span>
              <button class="view-summary-btn" data-year="${year.year}" title="View ${year.year} Annual Summary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
              </button>
            </div>
            <div class="yearly-bar-container">
              <div class="yearly-bar" style="width: ${widthPercent}%"></div>
            </div>
            <div class="yearly-stats">
              <span class="yearly-count">${this.formatNumber(year.totalCount)} actions</span>
              <span class="yearly-fines">${this.formatCurrency(year.totalFines)}</span>
            </div>
            <div class="yearly-breakdown-summary">${outcomes || 'No breakdown available'}</div>
            ${year.biggestCase ? `
              <div class="yearly-biggest-case">
                <span class="biggest-label">Biggest:</span>
                <span class="biggest-entity">${year.biggestCase.entityName}</span>
                <span class="biggest-fine">${this.formatCurrency(year.biggestCase.fineAmount)}</span>
              </div>
            ` : ''}
          </div>
        `
  }).join('')

  // Add click handlers for year detail panel (inline on page)
  container.querySelectorAll('.view-summary-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      const year = btn.dataset.year
      this.showYearDetailInline(parseInt(year))
    })
  })

  // Also make entire row clickable
  container.querySelectorAll('.yearly-row').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('.view-summary-btn')) return
      const year = row.dataset.year
      this.showYearDetailInline(parseInt(year))
    })
  })

  // Setup close button for year detail panel
  document.getElementById('close-year-detail')?.addEventListener('click', () => {
    this.hideYearDetailPanel()
  })
}
