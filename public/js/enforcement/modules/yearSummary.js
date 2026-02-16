/**
 * Year Summary Modal Module
 * Provides comprehensive year deep-dive analysis
 */

let yearSummaryChartInstances = {}

function applyYearSummaryMixin(klass) {
  Object.assign(klass.prototype, {

    /**
     * Show year summary modal
     */
    async showYearSummary(year) {
      try {
        // Create modal container
        const modal = document.createElement('div')
        modal.className = 'modal-overlay'
        modal.id = 'year-summary-modal'
        modal.innerHTML = `
          <div class="modal-container year-summary-modal">
            <div class="modal-header">
              <h2 class="modal-title">Year ${year} - Enforcement Summary</h2>
              <button class="modal-close" id="close-year-summary">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div class="modal-body" id="year-summary-body">
              <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading year summary...</p>
              </div>
            </div>
          </div>
        `

        document.body.appendChild(modal)

        // Close button handler
        document.getElementById('close-year-summary').addEventListener('click', () => {
          this.destroyYearSummaryCharts()
          modal.remove()
        })

        // ESC key handler
        const escHandler = (e) => {
          if (e.key === 'Escape') {
            this.destroyYearSummaryCharts()
            modal.remove()
            document.removeEventListener('keydown', escHandler)
          }
        }
        document.addEventListener('keydown', escHandler)

        // Click outside to close
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            this.destroyYearSummaryCharts()
            modal.remove()
          }
        })

        // Fetch year summary data
        const response = await fetch(`/api/enforcement/year-summary/${year}`)
        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Failed to load year summary')
        }

        // Render content
        this.renderYearSummaryContent(year, data.summary)

      } catch (error) {
        console.error('Error showing year summary:', error)
        const bodyEl = document.getElementById('year-summary-body')
        if (bodyEl) {
          bodyEl.innerHTML = `
            <div class="error-message">
              <p>Failed to load year summary: ${error.message}</p>
            </div>
          `
        }
      }
    },

    /**
     * Render complete year summary content
     */
    renderYearSummaryContent(year, summary) {
      const bodyEl = document.getElementById('year-summary-body')
      if (!bodyEl) return

      bodyEl.innerHTML = `
        <div class="year-summary-content">
          ${this.renderAISummarySection(summary.aiSummary)}
          ${this.renderYearStatsSection(year, summary.yearStats, summary.priorYearStats, summary.datasetAverages)}
          ${this.renderTopFirmsSection(summary.topFirms)}
          <div class="year-summary-dual-section">
            ${this.renderCategorySection(summary.categoryBreakdown)}
            ${this.renderMonthlyTimelineSection(year, summary.monthlyTimeline)}
          </div>
        </div>
      `

      // Initialize charts after DOM is ready
      setTimeout(() => {
        this.initializeCategoryChart(summary.categoryBreakdown)
        this.initializeMonthlyTimelineChart(year, summary.monthlyTimeline)
      }, 100)
    },

    /**
     * Render AI-generated summary section
     */
    renderAISummarySection(aiSummary) {
      const hasSummary = aiSummary && (aiSummary.paragraph1 || aiSummary.paragraph2)

      return `
        <div class="year-summary-section ai-summary-section">
          <h3 class="section-subtitle">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            Executive Summary
          </h3>
          <div class="ai-summary-text">
            ${hasSummary
              ? `<p>${aiSummary.paragraph1 || ''}</p><p>${aiSummary.paragraph2 || ''}</p>`
              : '<p class="empty-state" style="text-align:left;font-style:italic;color:#64748b;">Executive summary is being generated. Refresh the page in a few moments.</p>'
            }
          </div>
        </div>
      `
    },

    /**
     * Render year statistics comparison section
     */
    renderYearStatsSection(year, yearStats, priorYearStats, datasetAverages) {
      if (!yearStats) return ''

      const fineCount = parseInt(yearStats.fine_count) || 0
      const totalAmount = parseFloat(yearStats.total_amount) || 0
      const avgFine = parseFloat(yearStats.average_fine) || 0
      const dominantCategory = yearStats.dominant_category || 'N/A'

      // Calculate vs prior year
      const priorFineCount = parseInt(priorYearStats?.fine_count) || 0
      const priorTotalAmount = parseFloat(priorYearStats?.total_amount) || 0

      const countChange = priorFineCount > 0
        ? ((fineCount - priorFineCount) / priorFineCount * 100)
        : null
      const amountChange = priorTotalAmount > 0
        ? ((totalAmount - priorTotalAmount) / priorTotalAmount * 100)
        : null

      // Calculate vs dataset average
      const datasetAvgAmount = parseFloat(datasetAverages?.avg_total_per_year) || 0
      const vsDatasetAvg = datasetAvgAmount > 0
        ? ((totalAmount - datasetAvgAmount) / datasetAvgAmount * 100)
        : null

      const formatDelta = (delta) => {
        if (delta === null) return '<span class="delta-neutral">N/A</span>'
        const sign = delta >= 0 ? '+' : ''
        const className = delta >= 0 ? 'delta-positive' : 'delta-negative'
        const arrow = delta >= 0 ? '↑' : '↓'
        return `<span class="${className}">${arrow} ${sign}${delta.toFixed(1)}%</span>`
      }

      return `
        <div class="year-summary-section stats-section">
          <h3 class="section-subtitle">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="20" x2="12" y2="10"></line>
              <line x1="18" y1="20" x2="18" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="16"></line>
            </svg>
            Key Statistics
          </h3>
          <div class="year-stats-grid">
            <div class="year-stat-card">
              <div class="stat-label">Total Fines Amount</div>
              <div class="stat-value">£${(totalAmount / 1000000).toFixed(1)}m</div>
              <div class="stat-delta">
                <span class="delta-label">vs ${year - 1}:</span>
                ${formatDelta(amountChange)}
              </div>
            </div>

            <div class="year-stat-card">
              <div class="stat-label">Number of Fines</div>
              <div class="stat-value">${fineCount}</div>
              <div class="stat-delta">
                <span class="delta-label">vs ${year - 1}:</span>
                ${formatDelta(countChange)}
              </div>
            </div>

            <div class="year-stat-card">
              <div class="stat-label">Average Fine</div>
              <div class="stat-value">£${(avgFine / 1000).toFixed(0)}k</div>
              <div class="stat-delta">
                <span class="delta-label">vs dataset avg:</span>
                ${formatDelta(vsDatasetAvg)}
              </div>
            </div>

            <div class="year-stat-card">
              <div class="stat-label">Dominant Category</div>
              <div class="stat-value dominant-category">${dominantCategory}</div>
              <div class="stat-delta">
                <span class="category-badge">${dominantCategory}</span>
              </div>
            </div>
          </div>
        </div>
      `
    },

    /**
     * Render top firms section
     */
    renderTopFirmsSection(topFirms) {
      if (!topFirms || topFirms.length === 0) {
        return `
          <div class="year-summary-section top-firms-section">
            <h3 class="section-subtitle">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              Top Firms Fined
            </h3>
            <p class="empty-state">No firm data available for this year.</p>
          </div>
        `
      }

      const medals = ['🥇', '🥈', '🥉']

      const tableRows = topFirms.slice(0, 10).map((firm, index) => {
        const rank = index + 1
        const medal = index < 3 ? medals[index] : rank
        const totalAmount = parseFloat(firm.total_amount) || 0
        const fineCount = parseInt(firm.fine_count) || 0

        // Parse breach categories from JSONB
        let categories = []
        if (firm.breach_categories) {
          try {
            let parsed = firm.breach_categories
            if (typeof parsed === 'string') parsed = JSON.parse(parsed)
            if (typeof parsed === 'string') parsed = JSON.parse(parsed)
            categories = Array.isArray(parsed) ? parsed : [parsed]
          } catch (e) {
            categories = []
          }
        }

        const uniqueCategories = [...new Set(categories.filter(Boolean))]
        const categoryBadges = uniqueCategories.slice(0, 3).map(cat =>
          `<span class="mini-badge">${cat}</span>`
        ).join('')

        return `
          <tr>
            <td class="rank-cell">${medal}</td>
            <td class="firm-name-cell">${firm.firm_name || 'Unknown'}</td>
            <td class="amount-cell">£${(totalAmount / 1000000).toFixed(2)}m</td>
            <td class="count-cell">${fineCount}</td>
            <td class="categories-cell">${categoryBadges || '<span class="empty-text">N/A</span>'}</td>
          </tr>
        `
      }).join('')

      return `
        <div class="year-summary-section top-firms-section">
          <h3 class="section-subtitle">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            Top Firms Fined
          </h3>
          <div class="top-firms-table-wrapper">
            <table class="top-firms-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Firm</th>
                  <th>Total Amount</th>
                  <th>Fines</th>
                  <th>Categories</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </div>
        </div>
      `
    },

    /**
     * Render category breakdown section
     */
    renderCategorySection(categoryBreakdown) {
      if (!categoryBreakdown || categoryBreakdown.length === 0) {
        return `
          <div class="year-summary-section category-section">
            <h3 class="section-subtitle">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="14.31" y1="8" x2="20.05" y2="17.94"></line>
                <line x1="9.69" y1="8" x2="21.17" y2="8"></line>
                <line x1="7.38" y1="12" x2="13.12" y2="2.06"></line>
                <line x1="9.69" y1="16" x2="3.95" y2="6.06"></line>
                <line x1="14.31" y1="16" x2="2.83" y2="16"></line>
                <line x1="16.62" y1="12" x2="10.88" y2="21.94"></line>
              </svg>
              Category Breakdown
            </h3>
            <p class="empty-state">No category data available.</p>
          </div>
        `
      }

      const tableRows = categoryBreakdown.map(cat => {
        const totalAmount = parseFloat(cat.total_amount) || 0
        const percentage = parseFloat(cat.percentage) || 0
        return `
          <tr>
            <td class="category-name-cell">${cat.category || 'Unknown'}</td>
            <td class="category-count-cell">${parseInt(cat.fine_count) || 0}</td>
            <td class="category-amount-cell">£${(totalAmount / 1000000).toFixed(2)}m</td>
            <td class="category-pct-cell">
              <div class="percentage-bar-wrapper">
                <div class="percentage-bar" style="width: ${percentage}%"></div>
                <span class="percentage-text">${percentage.toFixed(1)}%</span>
              </div>
            </td>
          </tr>
        `
      }).join('')

      return `
        <div class="year-summary-section category-section">
          <h3 class="section-subtitle">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="14.31" y1="8" x2="20.05" y2="17.94"></line>
              <line x1="9.69" y1="8" x2="21.17" y2="8"></line>
              <line x1="7.38" y1="12" x2="13.12" y2="2.06"></line>
              <line x1="9.69" y1="16" x2="3.95" y2="6.06"></line>
              <line x1="14.31" y1="16" x2="2.83" y2="16"></line>
              <line x1="16.62" y1="12" x2="10.88" y2="21.94"></line>
            </svg>
            Category Breakdown
          </h3>
          <div class="category-breakdown-container">
            <div class="category-chart-wrapper">
              <canvas id="category-donut-chart"></canvas>
            </div>
            <div class="category-table-wrapper">
              <table class="category-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Count</th>
                    <th>Amount</th>
                    <th>% of Year</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `
    },

    /**
     * Render monthly timeline section
     */
    renderMonthlyTimelineSection(year, monthlyTimeline) {
      if (!monthlyTimeline || monthlyTimeline.length === 0) {
        return `
          <div class="year-summary-section timeline-section">
            <h3 class="section-subtitle">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Monthly Timeline
            </h3>
            <p class="empty-state">No monthly data available.</p>
          </div>
        `
      }

      return `
        <div class="year-summary-section timeline-section">
          <h3 class="section-subtitle">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Monthly Timeline - ${year}
          </h3>
          <div class="monthly-timeline-container">
            <canvas id="monthly-timeline-chart"></canvas>
          </div>
        </div>
      `
    },

    /**
     * Initialize category donut chart
     */
    initializeCategoryChart(categoryBreakdown) {
      const canvas = document.getElementById('category-donut-chart')
      if (!canvas || !categoryBreakdown || categoryBreakdown.length === 0) return

      // Destroy existing chart
      if (yearSummaryChartInstances.categoryChart) {
        yearSummaryChartInstances.categoryChart.destroy()
      }

      const labels = categoryBreakdown.map(cat => cat.category || 'Unknown')
      const data = categoryBreakdown.map(cat => parseInt(cat.fine_count) || 0)

      // Color palette (matching enforcement theme)
      const colors = [
        '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
        '#10b981', '#06b6d4', '#6366f1', '#f43f5e'
      ]

      const ctx = canvas.getContext('2d')
      yearSummaryChartInstances.categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: colors.slice(0, labels.length),
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          cutout: '65%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 12,
                font: { size: 11 },
                usePointStyle: true
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || ''
                  const value = context.parsed || 0
                  const total = context.dataset.data.reduce((a, b) => a + b, 0)
                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
                  return `${label}: ${value} (${percentage}%)`
                }
              }
            }
          }
        }
      })
    },

    /**
     * Initialize monthly timeline bar chart
     */
    initializeMonthlyTimelineChart(year, monthlyTimeline) {
      const canvas = document.getElementById('monthly-timeline-chart')
      if (!canvas || !monthlyTimeline || monthlyTimeline.length === 0) return

      // Destroy existing chart
      if (yearSummaryChartInstances.timelineChart) {
        yearSummaryChartInstances.timelineChart.destroy()
      }

      const labels = monthlyTimeline.map(m => m.month_name || '')
      const fineCounts = monthlyTimeline.map(m => parseInt(m.fine_count) || 0)
      const totalAmounts = monthlyTimeline.map(m => parseFloat(m.total_amount) || 0)

      const ctx = canvas.getContext('2d')
      yearSummaryChartInstances.timelineChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Number of Fines',
              data: fineCounts,
              backgroundColor: '#3b82f6',
              borderColor: '#2563eb',
              borderWidth: 1,
              yAxisID: 'y'
            },
            {
              label: 'Total Amount (£m)',
              data: totalAmounts.map(amt => amt / 1000000),
              type: 'line',
              borderColor: '#8b5cf6',
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              borderWidth: 2,
              fill: true,
              tension: 0.3,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false
          },
          plugins: {
            legend: {
              position: 'top',
              labels: {
                padding: 12,
                font: { size: 12 },
                usePointStyle: true
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || ''
                  if (label) {
                    label += ': '
                  }
                  if (context.parsed.y !== null) {
                    if (context.datasetIndex === 0) {
                      label += context.parsed.y
                    } else {
                      label += '£' + context.parsed.y.toFixed(2) + 'm'
                    }
                  }
                  return label
                }
              }
            }
          },
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              title: {
                display: true,
                text: 'Number of Fines'
              },
              beginAtZero: true,
              ticks: {
                precision: 0
              }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              title: {
                display: true,
                text: 'Total Amount (£m)'
              },
              beginAtZero: true,
              grid: {
                drawOnChartArea: false
              }
            }
          }
        }
      })
    },

    /**
     * Destroy all year summary charts
     */
    destroyYearSummaryCharts() {
      if (yearSummaryChartInstances.categoryChart) {
        yearSummaryChartInstances.categoryChart.destroy()
        yearSummaryChartInstances.categoryChart = null
      }
      if (yearSummaryChartInstances.timelineChart) {
        yearSummaryChartInstances.timelineChart.destroy()
        yearSummaryChartInstances.timelineChart = null
      }
    }

  })
}

export { applyYearSummaryMixin }
