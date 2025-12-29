export function applyChartsMixin(klass) {
  Object.assign(klass.prototype, {
    renderCharts() {
      this.renderOutcomeChart()
      this.renderBreachChart()
      this.renderRiskChart()
      this.renderStatusChart()
      this.renderRecentNotices()
      this.setupChartYearFilters()
    },
    setupChartYearFilters() {
      // Get years from notices
      const years = [...new Set(
        this.notices
          .filter(n => n.notice_date)
          .map(n => new Date(n.notice_date).getFullYear())
      )].sort((a, b) => a - b)
  
      if (years.length === 0) return
  
      // Populate outcome year filter
      const outcomeFilter = document.getElementById('outcome-year-filter')
      if (outcomeFilter) {
        outcomeFilter.innerHTML = '<option value="">All Years</option>' +
          years.map(y => `<option value="${y}">${y}</option>`).join('')
        outcomeFilter.addEventListener('change', () => this.renderOutcomeChart(outcomeFilter.value))
      }
  
      // Populate breach year filter
      const breachFilter = document.getElementById('breach-year-filter')
      if (breachFilter) {
        breachFilter.innerHTML = '<option value="">All Years</option>' +
          years.map(y => `<option value="${y}">${y}</option>`).join('')
        breachFilter.addEventListener('change', () => this.renderBreachChart(breachFilter.value))
      }
    },
    renderOutcomeChart(filterYear = '') {
      const canvas = document.getElementById('outcomeChart')
      if (!canvas) return
  
      // Filter notices by year if specified
      let filteredNotices = this.notices
      if (filterYear) {
        filteredNotices = this.notices.filter(n => {
          const year = n.notice_date ? new Date(n.notice_date).getFullYear() : null
          return year === parseInt(filterYear)
        })
      }
  
      const outcomes = {}
      filteredNotices.forEach(n => {
        const type = n.outcome_type || 'other'
        outcomes[type] = (outcomes[type] || 0) + 1
      })
  
      const labels = Object.keys(outcomes)
      const data = Object.values(outcomes)
      const colors = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#6b7280']
  
      // Find top outcome for callout
      const callout = document.getElementById('outcome-callout')
      if (data.length === 0) {
        if (callout) callout.innerHTML = '<span class="callout-highlight">No data</span>'
        return
      }
  
      const maxIndex = data.indexOf(Math.max(...data))
      const topOutcome = labels[maxIndex]
      const topPercent = ((data[maxIndex] / filteredNotices.length) * 100).toFixed(1)
  
      if (callout) {
        const filterNote = filterYear ? ` (${filterYear})` : ''
        callout.innerHTML = `<span class="callout-highlight">Top Outcome:</span> ${topOutcome.charAt(0).toUpperCase() + topOutcome.slice(1)} (${topPercent}%)${filterNote}`
      }
  
      // Destroy existing chart
      if (this.charts.outcome) {
        this.charts.outcome.destroy()
      }
  
      this.charts.outcome = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
          datasets: [{
            data,
            backgroundColor: colors.slice(0, labels.length),
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } }
        }
      })
    },
    renderBreachChart(filterYear = '') {
      const canvas = document.getElementById('breachChart')
      if (!canvas) return
  
      // Filter notices by year if specified
      let filteredNotices = this.notices
      if (filterYear) {
        filteredNotices = this.notices.filter(n => {
          const year = n.notice_date ? new Date(n.notice_date).getFullYear() : null
          return year === parseInt(filterYear)
        })
      }
  
      const breaches = {}
      filteredNotices.forEach(n => {
        const type = n.primary_breach_type || 'Unknown'
        breaches[type] = (breaches[type] || 0) + 1
      })
  
      const labels = Object.keys(breaches)
      const data = Object.values(breaches)
      const colors = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']
  
      // Find top breach for callout
      const callout = document.getElementById('breach-callout')
      if (data.length === 0) {
        if (callout) callout.innerHTML = '<span class="callout-highlight">No data</span>'
        return
      }
  
      const maxIndex = data.indexOf(Math.max(...data))
      const topBreach = labels[maxIndex]
      const topPercent = ((data[maxIndex] / filteredNotices.length) * 100).toFixed(1)
  
      if (callout) {
        const filterNote = filterYear ? ` (${filterYear})` : ''
        callout.innerHTML = `<span class="callout-highlight">Most Common:</span> ${topBreach} (${topPercent}%)${filterNote}`
      }
  
      // Destroy existing chart
      if (this.charts.breach) {
        this.charts.breach.destroy()
      }
  
      this.charts.breach = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: colors.slice(0, labels.length)
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right' }
          }
        }
      })
    },
    renderRiskChart() {
      const canvas = document.getElementById('riskChart')
      if (!canvas) return
  
      const riskBands = { 'High (70+)': 0, 'Medium (40-69)': 0, 'Low (0-39)': 0 }
      this.notices.forEach(n => {
        const score = n.risk_score || 0
        if (score >= 70) riskBands['High (70+)']++
        else if (score >= 40) riskBands['Medium (40-69)']++
        else riskBands['Low (0-39)']++
      })
  
      this.charts.risk = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: Object.keys(riskBands),
          datasets: [{
            data: Object.values(riskBands),
            backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } }
        }
      })
    },
    async renderStatusChart() {
      const canvas = document.getElementById('statusChart')
      if (!canvas) return
  
      try {
        const response = await fetch('/api/publications/status')
        const data = await response.json()
  
        const statuses = data.index?.byStatus || {}
        const labels = Object.keys(statuses)
        const values = Object.values(statuses)
        const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280']
  
        this.charts.status = new Chart(canvas, {
          type: 'doughnut',
          data: {
            labels: labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
            datasets: [{
              data: values,
              backgroundColor: colors.slice(0, labels.length)
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'right' }
            }
          }
        })
      } catch (error) {
        console.error('[publications] Failed to render status chart:', error)
      }
    },
    async renderFinesTimelineChart() {
      const canvas = document.getElementById('finesTimelineChart')
      if (!canvas) return
  
      // Fetch fines timeline data from API (full dataset, not limited notices)
      try {
        const response = await fetch('/api/publications/insights/timeline')
        const result = await response.json()
  
        if (!result.success || !result.data || result.data.length === 0) {
          const callout = document.getElementById('timeline-callout')
          if (callout) {
            callout.innerHTML = '<span class="callout-highlight">Peak Year:</span> No fine data available'
          }
          return
        }
  
        // Store full timeline data for filtering
        this.finesTimelineData = result.data
          .filter(d => d.year && d.totalFines > 0)
          .sort((a, b) => a.year - b.year)
  
        // Populate year filter dropdowns
        this.populateTimelineFilters()
  
        // Setup filter event listeners
        this.setupTimelineFilterEvents()
  
        // Render chart with all data
        this.updateTimelineChart()
      } catch (error) {
        console.error('[publications] Failed to load fines timeline:', error)
        const callout = document.getElementById('timeline-callout')
        if (callout) {
          callout.innerHTML = '<span class="callout-highlight">Peak Year:</span> Failed to load data'
        }
      }
    },
    populateTimelineFilters() {
      const startSelect = document.getElementById('timeline-start-year')
      const endSelect = document.getElementById('timeline-end-year')
      const outcomeFilter = document.getElementById('outcome-year-filter')
      const breachFilter = document.getElementById('breach-year-filter')
  
      if (!this.finesTimelineData) return
  
      const years = this.finesTimelineData.map(d => d.year).sort((a, b) => a - b)
      const minYear = years[0]
      const maxYear = years[years.length - 1]
  
      // Populate timeline range filters
      if (startSelect && endSelect) {
        startSelect.innerHTML = '<option value="">From</option>'
        endSelect.innerHTML = '<option value="">To</option>'
        for (let year = minYear; year <= maxYear; year++) {
          startSelect.innerHTML += `<option value="${year}">${year}</option>`
          endSelect.innerHTML += `<option value="${year}">${year}</option>`
        }
      }
  
      // Populate year filters for other charts
      const yearOptions = '<option value="">All Years</option>' +
        years.map(y => `<option value="${y}">${y}</option>`).join('')
  
      if (outcomeFilter) outcomeFilter.innerHTML = yearOptions
      if (breachFilter) breachFilter.innerHTML = yearOptions
    },
    setupTimelineFilterEvents() {
      const startSelect = document.getElementById('timeline-start-year')
      const endSelect = document.getElementById('timeline-end-year')
      const resetBtn = document.getElementById('timeline-reset-btn')
  
      if (startSelect) {
        startSelect.addEventListener('change', () => this.updateTimelineChart())
      }
      if (endSelect) {
        endSelect.addEventListener('change', () => this.updateTimelineChart())
      }
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          if (startSelect) startSelect.value = ''
          if (endSelect) endSelect.value = ''
          this.updateTimelineChart()
        })
      }
  
      // Setup outcome chart filter
      const outcomeFilter = document.getElementById('outcome-year-filter')
      if (outcomeFilter) {
        outcomeFilter.addEventListener('change', () => this.renderOutcomeChart(outcomeFilter.value))
      }
  
      // Setup breach chart filter
      const breachFilter = document.getElementById('breach-year-filter')
      if (breachFilter) {
        breachFilter.addEventListener('change', () => this.renderBreachChart(breachFilter.value))
      }
    },
    updateTimelineChart() {
      const canvas = document.getElementById('finesTimelineChart')
      if (!canvas || !this.finesTimelineData) return
  
      const startYear = document.getElementById('timeline-start-year')?.value
      const endYear = document.getElementById('timeline-end-year')?.value
  
      // Filter data by year range
      let filteredData = [...this.finesTimelineData]
      if (startYear) {
        filteredData = filteredData.filter(d => d.year >= parseInt(startYear))
      }
      if (endYear) {
        filteredData = filteredData.filter(d => d.year <= parseInt(endYear))
      }
  
      const years = filteredData.map(d => String(d.year))
      const amounts = filteredData.map(d => d.totalFines)
  
      // Find peak year for callout
      const callout = document.getElementById('timeline-callout')
      if (amounts.length === 0) {
        if (callout) {
          callout.innerHTML = '<span class="callout-highlight">Peak Year:</span> No data in range'
        }
        return
      }
  
      const maxAmount = Math.max(...amounts)
      const peakYearIndex = amounts.indexOf(maxAmount)
      const peakYear = years[peakYearIndex]
  
      if (callout) {
        const filterNote = (startYear || endYear) ? ' (filtered)' : ''
        callout.innerHTML = `<span class="callout-highlight">Peak Year:</span> ${peakYear} (${this.formatCurrency(maxAmount)})${filterNote}`
      }
  
      // Destroy existing chart if any
      if (this.charts.timeline) {
        this.charts.timeline.destroy()
      }
  
      this.charts.timeline = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: years,
          datasets: [{
            label: 'Total Fines',
            data: amounts,
            backgroundColor: years.map((y, i) => amounts[i] === maxAmount ? '#f59e0b' : '#3b82f6'),
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => `£${(ctx.raw / 1000000).toFixed(1)}M`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => '£' + (value / 1000000).toFixed(0) + 'M'
              }
            }
          }
        }
      })
    }
  
  })
}
