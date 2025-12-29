export async function showYearDetailInline(year) {
  const panel = document.getElementById('year-detail-panel')
  if (!panel) return

  // Find the year data from loaded breakdown
  const yearData = this.yearlyBreakdown?.find(y => y.year === year)
  if (!yearData) {
    console.error('[publications] Year data not found:', year)
    return
  }

  // Show panel with loading state
  panel.style.display = 'block'

  // Scroll to panel smoothly
  setTimeout(() => {
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, 100)

  // Update year title
  document.getElementById('year-detail-year').textContent = year

  // Show loading state for summary
  const summaryEl = document.getElementById('year-detail-summary')
  summaryEl.innerHTML = `
        <div class="summary-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
          Executive Summary
        </div>
        <div class="summary-loading">Loading year summary...</div>
      `

  // Fetch detailed year data for charts
  let detailedData = null
  try {
    const res = await fetch(`/api/publications/insights/year/${year}/detailed`)
    const result = await res.json()
    if (result.success) {
      detailedData = result.data
    }
  } catch (err) {
    console.error('[publications] Error fetching year details:', err)
  }

  // Update stats
  document.getElementById('year-detail-actions').textContent = this.formatNumber(yearData.totalCount)
  document.getElementById('year-detail-fines').textContent = this.formatCurrency(yearData.totalFines)
  document.getElementById('year-detail-cases-with-fines').textContent = yearData.finesWithAmount || 0
  document.getElementById('year-detail-avg-fine').textContent = detailedData?.totals?.avgFine
    ? this.formatCurrency(detailedData.totals.avgFine)
    : 'N/A'

  // Update biggest case
  const biggestEl = document.getElementById('year-detail-biggest')
  if (yearData.biggestCase) {
    document.getElementById('year-detail-biggest-entity').textContent = yearData.biggestCase.entityName
    document.getElementById('year-detail-biggest-amount').textContent = this.formatCurrency(yearData.biggestCase.fineAmount)
    document.getElementById('year-detail-biggest-breach').textContent = yearData.biggestCase.breachType || 'Unknown breach'
    biggestEl.style.display = 'block'
  } else {
    biggestEl.style.display = 'none'
  }

  // Fetch AI summary (use pre-generated if available)
  this.loadYearSummary(year, summaryEl)

  // Initialize charts if data available
  if (detailedData) {
    this.initYearInlineCharts(detailedData, year)
    this.updateYearTimeline(detailedData)
  }

  // Highlight selected year row
  document.querySelectorAll('.yearly-row').forEach(row => {
    row.classList.toggle('selected', row.dataset.year === String(year))
  })
}

export function hideYearDetailPanel() {
  const panel = document.getElementById('year-detail-panel')
  if (panel) {
    panel.style.display = 'none'
  }

  // Destroy charts
  if (this.yearInlineCharts) {
    Object.values(this.yearInlineCharts).forEach(chart => chart?.destroy())
    this.yearInlineCharts = null
  }

  // Remove selected state from rows
  document.querySelectorAll('.yearly-row').forEach(row => {
    row.classList.remove('selected')
  })
}
