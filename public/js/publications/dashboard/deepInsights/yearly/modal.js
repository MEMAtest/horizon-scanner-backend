export async function openYearSummaryModal(year) {
  // Find the year data from loaded breakdown
  const yearData = this.yearlyBreakdown?.find(y => y.year === year)
  if (!yearData) {
    console.error('[publications] Year data not found:', year)
    return
  }

  // Create modal if it doesn't exist
  let modal = document.getElementById('year-summary-modal')
  if (!modal) {
    modal = document.createElement('div')
    modal.id = 'year-summary-modal'
    modal.className = 'year-summary-modal-overlay'
    document.body.appendChild(modal)
  }

  // Show loading state
  modal.innerHTML = `
        <div class="year-summary-modal-content year-modal-loading">
          <div class="loading-spinner"></div>
          <span>Loading ${year} data...</span>
        </div>
      `
  modal.style.display = 'flex'
  document.body.style.overflow = 'hidden'

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

  // Get outcome labels and colors
  const outcomeLabels = {
    cancellation: 'Cancellations',
    fine: 'Fines',
    prohibition: 'Prohibitions',
    restriction: 'Restrictions',
    censure: 'Public Censures',
    warning: 'Warnings',
    supervisory_notice: 'Supervisory Notices',
    public_statement: 'Public Statements',
    voluntary_requirement: 'Voluntary Requirements',
    other: 'Other'
  }

  const outcomeColors = {
    cancellation: '#ef4444',
    fine: '#f59e0b',
    prohibition: '#f97316',
    restriction: '#eab308',
    censure: '#84cc16',
    warning: '#14b8a6',
    supervisory_notice: '#06b6d4',
    public_statement: '#22c55e',
    voluntary_requirement: '#3b82f6',
    other: '#64748b'
  }

  // Try to fetch AI summary if available
  let summaryHtml = ''
  try {
    const summaryRes = await fetch(`/api/publications/summary/${year}`)
    const summaryData = await summaryRes.json()
    if (summaryData.success && summaryData.data?.summary_html) {
      summaryHtml = `
            <div class="year-summary-narrative">
              <h4>Executive Summary</h4>
              <div class="summary-prose">${summaryData.data.summary_html}</div>
            </div>
          `
    }
  } catch (err) {
    console.log('[publications] No AI summary available for', year)
  }

  // Build modal content with charts
  modal.innerHTML = `
        <div class="year-summary-modal-content year-modal-enhanced">
          <button class="year-modal-close" id="close-year-modal">&times;</button>

          <div class="year-modal-header">
            <h2>FCA Enforcement Activity</h2>
            <div class="year-modal-year">${year}</div>
          </div>

          <div class="year-modal-stats">
            <div class="year-modal-stat">
              <span class="stat-value">${this.formatNumber(yearData.totalCount)}</span>
              <span class="stat-label">Enforcement Actions</span>
            </div>
            <div class="year-modal-stat">
              <span class="stat-value">${this.formatCurrency(yearData.totalFines)}</span>
              <span class="stat-label">Total Fines</span>
            </div>
            <div class="year-modal-stat">
              <span class="stat-value">${yearData.finesWithAmount || 0}</span>
              <span class="stat-label">Cases with Fines</span>
            </div>
            <div class="year-modal-stat">
              <span class="stat-value">${detailedData?.totals?.avgFine ? this.formatCurrency(detailedData.totals.avgFine) : 'N/A'}</span>
              <span class="stat-label">Avg Fine</span>
            </div>
          </div>

          ${yearData.biggestCase ? `
            <div class="year-modal-biggest">
              <h4>Largest Fine</h4>
              <div class="biggest-case-detail">
                <span class="biggest-entity">${yearData.biggestCase.entityName}</span>
                <span class="biggest-amount">${this.formatCurrency(yearData.biggestCase.fineAmount)}</span>
                <span class="biggest-breach">${yearData.biggestCase.breachType || 'Unknown breach'}</span>
              </div>
            </div>
          ` : ''}

          <!-- Charts Grid -->
          <div class="year-modal-charts">
            <div class="year-chart-card">
              <h4>Monthly Activity</h4>
              <canvas id="year-monthly-chart"></canvas>
            </div>
            <div class="year-chart-card">
              <h4>Outcome Distribution</h4>
              <canvas id="year-outcome-chart"></canvas>
            </div>
            <div class="year-chart-card">
              <h4>Breach Types</h4>
              <canvas id="year-breach-chart"></canvas>
            </div>
            <div class="year-chart-card">
              <h4>Year-over-Year Comparison</h4>
              <canvas id="year-comparison-chart"></canvas>
            </div>
          </div>

          ${summaryHtml}

          <div class="year-modal-actions">
            <button class="btn btn-secondary" onclick="window.print()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 9V2h12v7"/>
                <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
              Print
            </button>
            <button class="btn btn-primary" id="close-year-modal-btn">Close</button>
          </div>
        </div>
      `

  // Initialize charts if data available
  if (detailedData) {
    this.initYearModalCharts(detailedData, outcomeLabels, outcomeColors)
  }

  // Close handlers
  const closeModal = () => {
    // Destroy charts before closing
    if (this.yearModalCharts) {
      Object.values(this.yearModalCharts).forEach(chart => chart?.destroy())
      this.yearModalCharts = null
    }
    modal.style.display = 'none'
    document.body.style.overflow = ''
  }

  document.getElementById('close-year-modal').onclick = closeModal
  document.getElementById('close-year-modal-btn').onclick = closeModal
  modal.onclick = (e) => {
    if (e.target === modal) closeModal()
  }

  // ESC key closes modal
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeModal()
      document.removeEventListener('keydown', escHandler)
    }
  }
  document.addEventListener('keydown', escHandler)
}

export function initYearModalCharts(data, outcomeLabels, outcomeColors) {
  // Destroy any existing charts
  if (this.yearModalCharts) {
    Object.values(this.yearModalCharts).forEach(chart => chart?.destroy())
  }
  this.yearModalCharts = {}

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    }
  }

  // Chart 1: Monthly Activity (Bar Chart)
  const monthlyCtx = document.getElementById('year-monthly-chart')
  if (monthlyCtx && data.monthly) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthlyData = new Array(12).fill(0)
    data.monthly.forEach(m => {
      if (m.month >= 1 && m.month <= 12) {
        monthlyData[m.month - 1] = m.count
      }
    })

    this.yearModalCharts.monthly = new Chart(monthlyCtx, {
      type: 'bar',
      data: {
        labels: monthNames,
        datasets: [{
          label: 'Actions',
          data: monthlyData,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        ...chartOptions,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              font: { size: 10 }
            },
            grid: { color: 'rgba(0,0,0,0.05)' }
          },
          x: {
            ticks: { font: { size: 10 } },
            grid: { display: false }
          }
        }
      }
    })
  }

  // Chart 2: Outcome Distribution (Doughnut Chart)
  const outcomeCtx = document.getElementById('year-outcome-chart')
  if (outcomeCtx && data.outcomes) {
    const outcomeData = Object.entries(data.outcomes).filter(([_, v]) => v > 0)
    const labels = outcomeData.map(([k]) => outcomeLabels[k] || k)
    const values = outcomeData.map(([_, v]) => v)
    const colors = outcomeData.map(([k]) => outcomeColors[k] || '#94a3b8')

    this.yearModalCharts.outcome = new Chart(outcomeCtx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        ...chartOptions,
        cutout: '60%',
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 8,
              font: { size: 10 }
            }
          }
        }
      }
    })
  }

  // Chart 3: Breach Types (Horizontal Bar Chart)
  const breachCtx = document.getElementById('year-breach-chart')
  if (breachCtx && data.breachTypes && data.breachTypes.length > 0) {
    // Take top 6 breach types
    const topBreaches = data.breachTypes.slice(0, 6)
    const breachLabels = topBreaches.map(b => {
      // Truncate long labels
      const label = b.breach_type || 'Unknown'
      return label.length > 20 ? label.substring(0, 18) + '...' : label
    })
    const breachValues = topBreaches.map(b => b.count)

    // Color gradient for bars
    const breachColors = [
      'rgba(239, 68, 68, 0.8)',
      'rgba(249, 115, 22, 0.8)',
      'rgba(234, 179, 8, 0.8)',
      'rgba(34, 197, 94, 0.8)',
      'rgba(59, 130, 246, 0.8)',
      'rgba(139, 92, 246, 0.8)'
    ]

    this.yearModalCharts.breach = new Chart(breachCtx, {
      type: 'bar',
      data: {
        labels: breachLabels,
        datasets: [{
          data: breachValues,
          backgroundColor: breachColors.slice(0, breachValues.length),
          borderRadius: 4
        }]
      },
      options: {
        ...chartOptions,
        indexAxis: 'y',
        scales: {
          x: {
            beginAtZero: true,
            ticks: { stepSize: 1, font: { size: 10 } },
            grid: { color: 'rgba(0,0,0,0.05)' }
          },
          y: {
            ticks: { font: { size: 10 } },
            grid: { display: false }
          }
        }
      }
    })
  }

  // Chart 4: Year-over-Year Comparison (Line Chart)
  const comparisonCtx = document.getElementById('year-comparison-chart')
  if (comparisonCtx && data.comparison) {
    const currentYear = data.totals?.year || new Date().getFullYear()
    const prevYear = currentYear - 1

    // Build monthly comparison data
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentData = new Array(12).fill(0)
    const prevData = new Array(12).fill(0)

    // Current year data
    if (data.monthly) {
      data.monthly.forEach(m => {
        if (m.month >= 1 && m.month <= 12) {
          currentData[m.month - 1] = m.count
        }
      })
    }

    // Previous year data
    if (data.comparison.monthly) {
      data.comparison.monthly.forEach(m => {
        if (m.month >= 1 && m.month <= 12) {
          prevData[m.month - 1] = m.count
        }
      })
    }

    this.yearModalCharts.comparison = new Chart(comparisonCtx, {
      type: 'line',
      data: {
        labels: monthNames,
        datasets: [
          {
            label: String(currentYear),
            data: currentData,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.3,
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: 'rgb(59, 130, 246)'
          },
          {
            label: String(prevYear),
            data: prevData,
            borderColor: 'rgb(156, 163, 175)',
            backgroundColor: 'rgba(156, 163, 175, 0.1)',
            fill: true,
            tension: 0.3,
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 3,
            pointBackgroundColor: 'rgb(156, 163, 175)'
          }
        ]
      },
      options: {
        ...chartOptions,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 8,
              font: { size: 10 }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, font: { size: 10 } },
            grid: { color: 'rgba(0,0,0,0.05)' }
          },
          x: {
            ticks: { font: { size: 10 } },
            grid: { display: false }
          }
        }
      }
    })
  }
}
