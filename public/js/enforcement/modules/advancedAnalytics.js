/**
 * Advanced Analytics Module
 * Handles expand/collapse and year selector functionality
 */

function applyAdvancedAnalyticsMixin(klass) {
  Object.assign(klass.prototype, {

    /**
     * Initialize advanced analytics section
     */
    initAdvancedAnalytics() {
      const toggleBtn = document.getElementById('toggle-advanced-analytics')
      const content = document.getElementById('advanced-analytics-content')
      const yearSelector = document.getElementById('year-summary-selector')
      const openBtn = document.getElementById('open-year-summary')

      if (!toggleBtn || !content) return

      // Toggle expand/collapse
      let isExpanded = false
      toggleBtn.addEventListener('click', () => {
        isExpanded = !isExpanded
        if (isExpanded) {
          content.style.display = 'block'
          toggleBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z"/>
            </svg>
            Collapse
          `
        } else {
          content.style.display = 'none'
          toggleBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
            </svg>
            Expand
          `
        }
      })

      // Year selector change handler
      if (yearSelector && openBtn) {
        yearSelector.addEventListener('change', (e) => {
          const selectedYear = e.target.value
          if (selectedYear) {
            openBtn.disabled = false
          } else {
            openBtn.disabled = true
          }
        })

        // Open year summary button
        openBtn.addEventListener('click', () => {
          const selectedYear = yearSelector.value
          if (selectedYear) {
            console.log('[advanced-analytics] Opening year summary for:', selectedYear)
            this.showYearSummary(parseInt(selectedYear, 10))
          }
        })
      }

      // Scroll-to-section buttons
      const scrollButtons = document.querySelectorAll('.scroll-to-section')
      scrollButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const targetId = e.currentTarget.dataset.target
          const targetSection = document.getElementById(targetId)
          if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        })
      })

      // Leaderboard button
      const leaderboardBtn = document.getElementById('load-leaderboard-btn')
      if (leaderboardBtn) {
        leaderboardBtn.addEventListener('click', () => {
          this.loadLeaderboard()
        })
      }

      // Bubble chart button
      const bubbleChartBtn = document.getElementById('load-bubble-chart-btn')
      if (bubbleChartBtn) {
        bubbleChartBtn.addEventListener('click', () => {
          this.loadSectorBubbleChart()
        })
      }

      // Sector trends button
      const sectorTrendsBtn = document.getElementById('load-sector-trends-btn')
      if (sectorTrendsBtn) {
        sectorTrendsBtn.addEventListener('click', () => {
          this.loadSectorTrends()
        })
      }

      // Metric toggle buttons for sector trends
      const metricBtns = document.querySelectorAll('.metric-btn')
      metricBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          metricBtns.forEach(b => b.classList.remove('active'))
          e.target.classList.add('active')
          this.currentSectorTrendMetric = e.target.dataset.metric
          if (this.sectorTrendsData) {
            this.renderSectorTrendsChart()
          }
        })
      })

      console.log('[advanced-analytics] Advanced Analytics section initialized')
    },

    /**
     * Load and display the Top Offenders Leaderboard
     */
    async loadLeaderboard() {
      const resultsContainer = document.getElementById('leaderboard-results')
      if (!resultsContainer) return

      resultsContainer.style.display = 'block'
      resultsContainer.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Loading leaderboard...</p></div>'

      try {
        const response = await fetch('/api/enforcement/percentile-rankings?limit=20')
        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Failed to load leaderboard')
        }

        this.renderLeaderboard(data.rankings)

      } catch (error) {
        console.error('[leaderboard] Error:', error)
        resultsContainer.innerHTML = '<div class="error-state"><p>Failed to load leaderboard. Please try again.</p></div>'
      }
    },

    /**
     * Render the leaderboard table with tier badges and percentile bars
     */
    renderLeaderboard(rankings) {
      const resultsContainer = document.getElementById('leaderboard-results')
      if (!resultsContainer || !rankings || rankings.length === 0) {
        resultsContainer.innerHTML = '<div class="empty-state"><p>No ranking data available.</p></div>'
        return
      }

      const tableRows = rankings.map(firm => {
        const pctValue = Math.round(firm.percentile || 0)

        return `
          <tr class="leaderboard-row" onclick="window.enforcementDashboard.showFirmDetails('${this.escapeHtml(firm.firm_name)}')">
            <td class="col-rank">
              <span class="rank-number">${firm.medal || ''} ${firm.rank}</span>
            </td>
            <td class="col-firm">
              <strong>${this.escapeHtml(firm.firm_name)}</strong>
            </td>
            <td class="col-total">
              <span class="amount-value">${this.formatCurrency(firm.total_amount)}</span>
            </td>
            <td class="col-count">${firm.fine_count}</td>
            <td class="col-tier">
              <span class="tier-badge-small" style="background: ${firm.tier_color};">${firm.tier}</span>
            </td>
            <td class="col-percentile">
              <div class="mini-percentile-track">
                <div class="mini-percentile-fill" style="width: ${pctValue}%; background: ${firm.tier_color};"></div>
              </div>
              <span class="percentile-value">${pctValue}%</span>
            </td>
          </tr>
        `
      }).join('')

      resultsContainer.innerHTML = `
        <div class="leaderboard-table-wrapper">
          <table class="leaderboard-table">
            <thead>
              <tr>
                <th class="col-rank">Rank</th>
                <th class="col-firm">Firm</th>
                <th class="col-total">Total Fines</th>
                <th class="col-count">#</th>
                <th class="col-tier">Tier</th>
                <th class="col-percentile">Percentile</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
      `
    },

    // Sector Bubble Chart state
    sectorBubbleChart: null,
    sectorAnalysisData: null,

    /**
     * Load and display the Sector Bubble Chart
     */
    async loadSectorBubbleChart() {
      const container = document.getElementById('bubble-chart-container')
      if (!container) return

      container.style.display = 'block'
      container.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Loading sector data...</p></div>'

      try {
        const response = await fetch('/api/enforcement/sector-analysis')
        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Failed to load sector data')
        }

        this.sectorAnalysisData = data.sectors
        container.innerHTML = `
          <div class="bubble-chart-wrapper">
            <canvas id="sector-bubble-chart"></canvas>
          </div>
          <div class="bubble-chart-legend" id="bubble-chart-legend"></div>
        `
        this.renderSectorBubbleChart()

      } catch (error) {
        console.error('[bubble-chart] Error:', error)
        container.innerHTML = '<div class="error-state"><p>Failed to load sector data. Please try again.</p></div>'
      }
    },

    /**
     * Render the Sector Bubble Chart using Chart.js
     */
    renderSectorBubbleChart() {
      const canvas = document.getElementById('sector-bubble-chart')
      const legendContainer = document.getElementById('bubble-chart-legend')
      if (!canvas || !this.sectorAnalysisData || this.sectorAnalysisData.length === 0) return

      // Destroy existing chart
      if (this.sectorBubbleChart) {
        this.sectorBubbleChart.destroy()
      }

      // Calculate bubble sizes (normalize to reasonable range)
      const maxTotal = Math.max(...this.sectorAnalysisData.map(s => s.total_amount))
      const minBubbleSize = 8
      const maxBubbleSize = 40

      // Build datasets - one per sector for proper legend
      const datasets = this.sectorAnalysisData.map(sector => {
        const normalizedSize = minBubbleSize + (sector.total_amount / maxTotal) * (maxBubbleSize - minBubbleSize)

        return {
          label: sector.sector,
          data: [{
            x: sector.fine_count,
            y: sector.avg_amount,
            r: normalizedSize,
            sector: sector.sector,
            total: sector.total_amount,
            breach: sector.dominant_breach
          }],
          backgroundColor: sector.color + '99', // Add transparency
          borderColor: sector.color,
          borderWidth: 2,
          hoverBackgroundColor: sector.color,
          hoverBorderWidth: 3
        }
      })

      const ctx = canvas.getContext('2d')
      this.sectorBubbleChart = new Chart(ctx, {
        type: 'bubble',
        data: { datasets },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: 1.8,
          plugins: {
            title: {
              display: true,
              text: 'Sector Enforcement Exposure',
              font: { size: 16, weight: 'bold' }
            },
            legend: {
              display: false // We'll use custom legend
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const data = context.raw
                  return [
                    `Sector: ${data.sector}`,
                    `Fine Count: ${data.x}`,
                    `Avg Fine: £${this.formatCurrency(data.y)}`,
                    `Total: £${this.formatCurrency(data.total)}`,
                    `Top Breach: ${data.breach}`
                  ]
                }
              }
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Number of Fines',
                font: { weight: 'bold' }
              },
              min: 0
            },
            y: {
              title: {
                display: true,
                text: 'Average Fine Amount (£)',
                font: { weight: 'bold' }
              },
              min: 0,
              ticks: {
                callback: (value) => '£' + this.formatCurrency(value)
              }
            }
          },
          onClick: (event, elements) => {
            if (elements.length > 0) {
              const datasetIndex = elements[0].datasetIndex
              const sector = this.sectorAnalysisData[datasetIndex]
              if (sector) {
                console.log('[bubble-chart] Clicked sector:', sector.sector)
                // Could trigger dashboard filter here
                alert(`Selected: ${sector.sector}\n\nTotal Fines: £${this.formatCurrency(sector.total_amount)}\nFine Count: ${sector.fine_count}\nDominant Breach: ${sector.dominant_breach}`)
              }
            }
          }
        }
      })

      // Render custom legend
      this.renderBubbleChartLegend(legendContainer)
    },

    /**
     * Render custom legend for bubble chart
     */
    renderBubbleChartLegend(container) {
      if (!container || !this.sectorAnalysisData) return

      // Get unique breach categories with colors
      const breachCategories = {}
      this.sectorAnalysisData.forEach(sector => {
        if (!breachCategories[sector.dominant_breach]) {
          breachCategories[sector.dominant_breach] = sector.color
        }
      })

      const legendItems = Object.entries(breachCategories).map(([breach, color]) => `
        <div class="legend-item">
          <span class="legend-color" style="background: ${color};"></span>
          <span class="legend-label">${breach}</span>
        </div>
      `).join('')

      container.innerHTML = `
        <div class="legend-title">Dominant Breach Category</div>
        <div class="legend-items">${legendItems}</div>
        <div class="legend-note">Bubble size = Total fine amount</div>
      `
    },

    // Sector Trends state
    sectorTrendsChart: null,
    sectorTrendsData: null,
    currentSectorTrendMetric: 'amount',

    /**
     * Load and display the Sector Historical Trends
     */
    async loadSectorTrends() {
      const container = document.getElementById('sector-trends-container')
      if (!container) return

      container.style.display = 'block'
      container.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Loading sector trends...</p></div>'

      try {
        const response = await fetch('/api/enforcement/sector-trends')
        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Failed to load sector trends')
        }

        this.sectorTrendsData = data
        container.innerHTML = `
          <div class="sector-trends-chart-wrapper">
            <canvas id="sector-trends-chart"></canvas>
          </div>
          <div class="sector-trends-legend" id="sector-trends-legend"></div>
          <div class="sector-trends-summary" id="sector-trends-summary"></div>
        `
        this.renderSectorTrendsChart()
        this.renderSectorTrendsSummary()

      } catch (error) {
        console.error('[sector-trends] Error:', error)
        container.innerHTML = '<div class="error-state"><p>Failed to load sector trends. Please try again.</p></div>'
      }
    },

    /**
     * Render the Sector Trends Line Chart using Chart.js
     */
    renderSectorTrendsChart() {
      const canvas = document.getElementById('sector-trends-chart')
      const legendContainer = document.getElementById('sector-trends-legend')
      if (!canvas || !this.sectorTrendsData) return

      const { years, sectors } = this.sectorTrendsData
      const metric = this.currentSectorTrendMetric

      // Destroy existing chart
      if (this.sectorTrendsChart) {
        this.sectorTrendsChart.destroy()
      }

      // Build datasets for each sector
      const datasets = sectors.map(sector => ({
        label: sector.name,
        data: sector.data.map(d => metric === 'amount' ? d.total_amount : d.fine_count),
        borderColor: sector.color,
        backgroundColor: sector.color + '20',
        fill: false,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2
      }))

      const ctx = canvas.getContext('2d')
      this.sectorTrendsChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: years,
          datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: 2.5,
          interaction: {
            mode: 'index',
            intersect: false
          },
          plugins: {
            title: {
              display: true,
              text: metric === 'amount'
                ? 'Sector Enforcement Trends - Total Fine Amount (£)'
                : 'Sector Enforcement Trends - Number of Fines',
              font: { size: 16, weight: 'bold' }
            },
            legend: {
              display: false // We'll use custom legend
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const value = context.parsed.y
                  if (metric === 'amount') {
                    return `${context.dataset.label}: £${this.formatCurrency(value)}`
                  }
                  return `${context.dataset.label}: ${value} fines`
                }
              }
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Year',
                font: { weight: 'bold' }
              }
            },
            y: {
              title: {
                display: true,
                text: metric === 'amount' ? 'Total Fines (£)' : 'Number of Fines',
                font: { weight: 'bold' }
              },
              beginAtZero: true,
              ticks: {
                callback: (value) => metric === 'amount'
                  ? '£' + this.formatCurrency(value)
                  : value
              }
            }
          },
          onClick: (event, elements) => {
            if (elements.length > 0) {
              const datasetIndex = elements[0].datasetIndex
              const sector = sectors[datasetIndex]
              if (sector) {
                console.log('[sector-trends] Clicked sector:', sector.name)
              }
            }
          }
        }
      })

      // Render custom legend
      this.renderSectorTrendsLegend(legendContainer)
    },

    /**
     * Render custom legend for sector trends chart
     */
    renderSectorTrendsLegend(container) {
      if (!container || !this.sectorTrendsData) return

      const { sectors } = this.sectorTrendsData
      const metric = this.currentSectorTrendMetric

      const legendItems = sectors.map(sector => {
        const value = metric === 'amount'
          ? `£${this.formatCurrency(sector.totalAmount)}`
          : `${sector.totalCount} fines`

        return `
          <div class="sector-legend-item">
            <span class="sector-legend-color" style="background: ${sector.color};"></span>
            <span class="sector-legend-name">${sector.name}</span>
            <span class="sector-legend-value">${value}</span>
          </div>
        `
      }).join('')

      container.innerHTML = `
        <div class="sector-legend-grid">${legendItems}</div>
      `
    },

    /**
     * Render summary statistics for sector trends
     */
    renderSectorTrendsSummary() {
      const container = document.getElementById('sector-trends-summary')
      if (!container || !this.sectorTrendsData) return

      const { sectors, summary } = this.sectorTrendsData

      // Calculate totals
      const totalAmount = sectors.reduce((sum, s) => sum + s.totalAmount, 0)
      const totalCount = sectors.reduce((sum, s) => sum + s.totalCount, 0)

      // Find highest growth sector (comparing first and last 3 years)
      let highestGrowthSector = { name: 'N/A', growth: 0 }
      sectors.forEach(sector => {
        const earlyYears = sector.data.slice(0, 3).reduce((sum, d) => sum + d.total_amount, 0)
        const lateYears = sector.data.slice(-3).reduce((sum, d) => sum + d.total_amount, 0)
        if (earlyYears > 0) {
          const growth = ((lateYears - earlyYears) / earlyYears) * 100
          if (growth > highestGrowthSector.growth) {
            highestGrowthSector = { name: sector.name, growth }
          }
        }
      })

      container.innerHTML = `
        <div class="trends-summary-grid">
          <div class="trends-summary-card">
            <div class="summary-label">Sectors Tracked</div>
            <div class="summary-value">${summary.totalSectors}</div>
          </div>
          <div class="trends-summary-card">
            <div class="summary-label">Year Range</div>
            <div class="summary-value">${summary.yearRange}</div>
          </div>
          <div class="trends-summary-card">
            <div class="summary-label">Top Sector by Volume</div>
            <div class="summary-value">${summary.topSector}</div>
          </div>
          <div class="trends-summary-card">
            <div class="summary-label">Highest Growth</div>
            <div class="summary-value">${highestGrowthSector.name}</div>
            <div class="summary-subvalue">${highestGrowthSector.growth > 0 ? '+' : ''}${Math.round(highestGrowthSector.growth)}%</div>
          </div>
        </div>
      `
    }

  })
}

export { applyAdvancedAnalyticsMixin }
