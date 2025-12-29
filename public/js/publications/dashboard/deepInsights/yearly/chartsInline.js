export function updateYearTimeline(detailedData) {
  const timelineBar = document.getElementById('year-timeline-bar')
  if (!timelineBar || !detailedData?.monthlyData) return

  // Get monthly counts
  const monthlyData = detailedData.monthlyData || []
  const monthlyCounts = new Array(12).fill(0)

  // Parse monthly data
  monthlyData.forEach(m => {
    const month = parseInt(m.month) - 1  // 0-indexed
    if (month >= 0 && month < 12) {
      monthlyCounts[month] = parseInt(m.count) || 0
    }
  })

  // Calculate activity levels (0-5)
  const maxCount = Math.max(...monthlyCounts, 1)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  // Update each month bar
  const monthElements = timelineBar.querySelectorAll('.timeline-month')
  monthElements.forEach((el, i) => {
    const count = monthlyCounts[i]
    const activity = count === 0 ? 0 : Math.min(Math.ceil((count / maxCount) * 5), 5)

    el.setAttribute('data-activity', activity)

    // Add tooltip
    let tooltip = el.querySelector('.tooltip')
    if (!tooltip) {
      tooltip = document.createElement('div')
      tooltip.className = 'tooltip'
      el.appendChild(tooltip)
    }
    tooltip.textContent = `${monthNames[i]}: ${count} action${count !== 1 ? 's' : ''}`
  })
}

export function initYearInlineCharts(data, year) {
  // Destroy any existing inline charts
  if (this.yearInlineCharts) {
    Object.values(this.yearInlineCharts).forEach(chart => chart?.destroy())
  }
  this.yearInlineCharts = {}

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
  const monthlyCtx = document.getElementById('year-page-monthly-chart')
  if (monthlyCtx && data.monthly) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthlyData = new Array(12).fill(0)
    data.monthly.forEach(m => {
      if (m.month >= 1 && m.month <= 12) {
        monthlyData[m.month - 1] = m.count
      }
    })

    this.yearInlineCharts.monthly = new Chart(monthlyCtx, {
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
            ticks: { stepSize: 1 }
          }
        }
      }
    })
  }

  // Chart 2: Outcome Distribution (Doughnut)
  const outcomeCtx = document.getElementById('year-page-outcome-chart')
  if (outcomeCtx && data.outcomes) {
    // Handle both array format [{type, count}] and object format {type: count}
    let outcomeData = []
    if (Array.isArray(data.outcomes)) {
      outcomeData = data.outcomes
        .filter(o => o.count > 0)
        .sort((a, b) => b.count - a.count)
    } else {
      outcomeData = Object.entries(data.outcomes)
        .filter(([_, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([type, count]) => ({ type, count }))
    }

    if (outcomeData.length > 0) {
      this.yearInlineCharts.outcome = new Chart(outcomeCtx, {
        type: 'doughnut',
        data: {
          labels: outcomeData.map(o => outcomeLabels[o.type] || o.type),
          datasets: [{
            data: outcomeData.map(o => o.count),
            backgroundColor: outcomeData.map(o => outcomeColors[o.type] || '#64748b'),
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          ...chartOptions,
          cutout: '60%',
          plugins: {
            legend: {
              display: true,
              position: 'right',
              labels: { boxWidth: 12, font: { size: 10 } }
            }
          }
        }
      })
    }
  }

  // Chart 3: Breach Types (Horizontal Bar)
  const breachCtx = document.getElementById('year-page-breach-chart')
  if (breachCtx && data.breaches) {
    // Handle both array format [{type, count}] and object format {type: count}
    let breachData = []
    if (Array.isArray(data.breaches)) {
      breachData = data.breaches
        .filter(b => b.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)
    } else {
      breachData = Object.entries(data.breaches)
        .filter(([_, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([type, count]) => ({ type, count }))
    }

    const breachLabels = {
      PRINCIPLES: 'Principles',
      AML: 'AML',
      SYSTEMS_CONTROLS: 'Systems & Controls',
      MARKET_ABUSE: 'Market Abuse',
      MIS_SELLING: 'Mis-selling',
      CLIENT_MONEY: 'Client Money',
      CONDUCT: 'Conduct',
      PRUDENTIAL: 'Prudential',
      FINANCIAL_CRIME: 'Financial Crime'
    }

    if (breachData.length > 0) {
      this.yearInlineCharts.breach = new Chart(breachCtx, {
        type: 'bar',
        data: {
          labels: breachData.map(b => breachLabels[b.type] || b.type),
          datasets: [{
            label: 'Cases',
            data: breachData.map(b => b.count),
            backgroundColor: 'rgba(139, 92, 246, 0.8)',
            borderColor: 'rgb(139, 92, 246)',
            borderWidth: 1,
            borderRadius: 4
          }]
        },
        options: {
          ...chartOptions,
          indexAxis: 'y',
          scales: {
            x: { beginAtZero: true, ticks: { stepSize: 1 } }
          }
        }
      })
    }
  }

  // Chart 4: Year-over-Year Comparison (Line)
  const comparisonCtx = document.getElementById('year-page-comparison-chart')
  if (comparisonCtx && this.yearlyBreakdown) {
    // Get last 5 years of data for comparison
    const recentYears = this.yearlyBreakdown
      .filter(y => y.year <= year && y.year >= year - 4)
      .sort((a, b) => a.year - b.year)

    this.yearInlineCharts.comparison = new Chart(comparisonCtx, {
      type: 'line',
      data: {
        labels: recentYears.map(y => y.year),
        datasets: [
          {
            label: 'Actions',
            data: recentYears.map(y => y.totalCount),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.3,
            yAxisID: 'y'
          },
          {
            label: 'Fines (£M)',
            data: recentYears.map(y => (y.totalFines || 0) / 1000000),
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true,
            tension: 0.3,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        ...chartOptions,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: { boxWidth: 12, font: { size: 10 } }
          }
        },
        scales: {
          y: {
            type: 'linear',
            position: 'left',
            beginAtZero: true,
            title: { display: true, text: 'Actions', font: { size: 10 } }
          },
          y1: {
            type: 'linear',
            position: 'right',
            beginAtZero: true,
            grid: { drawOnChartArea: false },
            title: { display: true, text: 'Fines (£M)', font: { size: 10 } }
          }
        }
      }
    })
  }
}
