/**
 * Dashboard Charts - Chart.js based visualizations
 * Charts: Radar (Regulatory Dimensions), Polar Area (Impact), Line (Timeline), Bar (Regulator Cadence)
 */

/**
 * Calculate radar chart data - regulatory content types comparison
 */
function calculateRadarData(updates = []) {
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

  const categories = ['Enforcement', 'Consultation', 'Guidance', 'Policy Statement', 'Speech']
  const thisMonth = { Enforcement: 0, Consultation: 0, Guidance: 0, 'Policy Statement': 0, Speech: 0 }
  const lastMonth = { Enforcement: 0, Consultation: 0, Guidance: 0, 'Policy Statement': 0, Speech: 0 }

  updates.forEach(update => {
    const contentType = update.content_type || update.contentType || 'Other'
    const dateStr = update.published_date || update.publishedDate || update.fetchedDate
    if (!dateStr) return

    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) return

    // Map content types to categories
    let category = null
    if (contentType.toLowerCase().includes('enforcement') || contentType.toLowerCase().includes('fine')) {
      category = 'Enforcement'
    } else if (contentType.toLowerCase().includes('consult')) {
      category = 'Consultation'
    } else if (contentType.toLowerCase().includes('guidance') || contentType.toLowerCase().includes('guideline')) {
      category = 'Guidance'
    } else if (contentType.toLowerCase().includes('policy') || contentType.toLowerCase().includes('statement')) {
      category = 'Policy Statement'
    } else if (contentType.toLowerCase().includes('speech') || contentType.toLowerCase().includes('remark')) {
      category = 'Speech'
    }

    if (!category) return

    if (date >= thisMonthStart) {
      thisMonth[category]++
    } else if (date >= lastMonthStart && date <= lastMonthEnd) {
      lastMonth[category]++
    }
  })

  return {
    labels: categories,
    thisMonth: categories.map(c => thisMonth[c]),
    lastMonth: categories.map(c => lastMonth[c])
  }
}

/**
 * Calculate impact distribution - Significant/Moderate/Informational
 */
function calculateImpactDistribution(updates = []) {
  const distribution = { Significant: 0, Moderate: 0, Informational: 0 }

  updates.forEach(update => {
    const impact = (update.impactLevel || update.impact_level || 'Informational')
    if (impact === 'Significant' || impact === 'Critical' || impact === 'High') {
      distribution.Significant++
    } else if (impact === 'Moderate' || impact === 'Medium') {
      distribution.Moderate++
    } else {
      distribution.Informational++
    }
  })

  return distribution
}

/**
 * Calculate 30-day timeline - daily update counts
 */
function calculate30DayTimeline(updates = []) {
  const timeline = {}
  const now = new Date()

  // Initialize all 30 days with 0
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime())
    d.setDate(now.getDate() - i)
    const key = d.toISOString().split('T')[0]
    timeline[key] = 0
  }

  // Count updates per day
  updates.forEach(update => {
    const dateStr = update.published_date || update.publishedDate || update.fetchedDate || update.createdAt
    if (!dateStr) return
    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) return
    const key = date.toISOString().split('T')[0]
    if (Object.prototype.hasOwnProperty.call(timeline, key)) {
      timeline[key]++
    }
  })

  return Object.entries(timeline)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }))
}

/**
 * Calculate regulator cadence - top regulators by activity
 */
function calculateRegulatorCadence(updates = []) {
  const authorityCounts = {}

  updates.forEach(update => {
    const authority = update.authority || 'Unknown'
    if (authority && authority !== 'Unknown') {
      authorityCounts[authority] = (authorityCounts[authority] || 0) + 1
    }
  })

  // Sort by count and return top 8 most active regulators
  return Object.entries(authorityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }))
}

/**
 * Render all dashboard charts
 */
function renderDashboardCharts(updates = []) {
  const radarData = calculateRadarData(updates)
  const impactData = calculateImpactDistribution(updates)
  const timelineData = calculate30DayTimeline(updates)
  const regulatorCadence = calculateRegulatorCadence(updates)

  // Prepare chart data as JSON (escaped to prevent XSS)
  const chartDataJson = JSON.stringify({
    radar: {
      labels: radarData.labels,
      thisMonth: radarData.thisMonth,
      lastMonth: radarData.lastMonth
    },
    impact: {
      labels: ['Significant', 'Moderate', 'Informational'],
      values: [impactData.Significant, impactData.Moderate, impactData.Informational],
      colors: ['rgba(220, 38, 38, 0.8)', 'rgba(245, 158, 11, 0.8)', 'rgba(59, 130, 246, 0.8)'],
      borderColors: ['#dc2626', '#f59e0b', '#3b82f6']
    },
    timeline: {
      labels: timelineData.map(d => {
        const date = new Date(d.date)
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      }),
      values: timelineData.map(d => d.count)
    },
    regulatorCadence: {
      labels: regulatorCadence.map(a => a.name),
      values: regulatorCadence.map(a => a.count)
    }
  }).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')

  return `
    <section class="dashboard-charts-section collapsed">
      <div class="charts-header charts-toggle" onclick="toggleChartsSection()">
        <h2 class="charts-title">Analytics Overview</h2>
        <span class="charts-toggle-icon">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path class="chevron-path" d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </div>
      <div class="dashboard-charts-grid">
        <!-- Radar Chart - Regulatory Dimensions -->
        <div class="dashboard-chart-card">
          <div class="chart-card-header">
            <h3 class="chart-card-title">Regulatory Dimensions</h3>
            <p class="chart-card-subtitle">Content types: This month vs Last month</p>
          </div>
          <div class="chart-canvas-container">
            <canvas id="radarChart"></canvas>
          </div>
        </div>

        <!-- Polar Area - Impact Distribution -->
        <div class="dashboard-chart-card">
          <div class="chart-card-header">
            <h3 class="chart-card-title">Impact Distribution</h3>
            <p class="chart-card-subtitle">Updates by severity level</p>
          </div>
          <div class="chart-canvas-container">
            <canvas id="impactChart"></canvas>
          </div>
        </div>

        <!-- Line Chart - 30-Day Timeline -->
        <div class="dashboard-chart-card">
          <div class="chart-card-header">
            <h3 class="chart-card-title">30-Day Activity</h3>
            <p class="chart-card-subtitle">Regulatory updates over time</p>
          </div>
          <div class="chart-canvas-container timeline-chart">
            <canvas id="timelineChart"></canvas>
          </div>
        </div>

        <!-- Bar Chart - Regulator Cadence -->
        <div class="dashboard-chart-card">
          <div class="chart-card-header">
            <h3 class="chart-card-title">Regulator Cadence</h3>
            <p class="chart-card-subtitle">Most active regulators</p>
          </div>
          <div class="chart-canvas-container">
            <canvas id="regulatorCadenceChart"></canvas>
          </div>
        </div>
      </div>
    </section>

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
      (function() {
        const chartData = ${chartDataJson};
        let chartsInitialized = false;

        // Toggle function for collapsible charts
        window.toggleChartsSection = function() {
          const section = document.querySelector('.dashboard-charts-section');
          if (section) {
            section.classList.toggle('collapsed');
            // Initialize charts on first expand
            if (!section.classList.contains('collapsed') && !chartsInitialized) {
              initializeCharts();
            }
          }
        };

        function initializeCharts() {
          if (chartsInitialized) return;
          chartsInitialized = true;

          // Radar Chart - Regulatory Dimensions
          const radarCtx = document.getElementById('radarChart');
          if (radarCtx) {
            new Chart(radarCtx, {
              type: 'radar',
              data: {
                labels: chartData.radar.labels,
                datasets: [
                  {
                    label: 'This Month',
                    data: chartData.radar.thisMonth,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderWidth: 2,
                    pointBackgroundColor: '#3b82f6',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#3b82f6'
                  },
                  {
                    label: 'Last Month',
                    data: chartData.radar.lastMonth,
                    borderColor: '#94a3b8',
                    backgroundColor: 'rgba(148, 163, 184, 0.2)',
                    borderWidth: 2,
                    pointBackgroundColor: '#94a3b8',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#94a3b8'
                  }
                ]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { boxWidth: 12, padding: 10, font: { size: 11 } }
                  },
                  tooltip: {
                    backgroundColor: '#1f2937',
                    titleFont: { size: 11 },
                    bodyFont: { size: 11 },
                    padding: 8,
                    cornerRadius: 6
                  }
                },
                scales: {
                  r: {
                    angleLines: { color: '#e5e7eb' },
                    grid: { color: '#e5e7eb' },
                    pointLabels: { font: { size: 10 } },
                    ticks: { display: false },
                    beginAtZero: true
                  }
                }
              }
            });
          }

          // Polar Area - Impact Distribution
          const impactCtx = document.getElementById('impactChart');
          if (impactCtx) {
            new Chart(impactCtx, {
              type: 'polarArea',
              data: {
                labels: chartData.impact.labels,
                datasets: [{
                  data: chartData.impact.values,
                  backgroundColor: chartData.impact.colors,
                  borderColor: chartData.impact.borderColors,
                  borderWidth: 2
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { boxWidth: 12, padding: 10, font: { size: 11 }, usePointStyle: true, pointStyle: 'circle' }
                  },
                  tooltip: {
                    backgroundColor: '#1f2937',
                    titleFont: { size: 11 },
                    bodyFont: { size: 11 },
                    padding: 8,
                    cornerRadius: 6
                  }
                },
                scales: {
                  r: {
                    ticks: { display: false },
                    grid: { color: '#e5e7eb' }
                  }
                }
              }
            });
          }

          // Line Chart - 30-Day Timeline
          const timelineCtx = document.getElementById('timelineChart');
          if (timelineCtx) {
            new Chart(timelineCtx, {
              type: 'line',
              data: {
                labels: chartData.timeline.labels,
                datasets: [{
                  label: 'Updates',
                  data: chartData.timeline.values,
                  borderColor: '#3b82f6',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  borderWidth: 2,
                  fill: true,
                  tension: 0.4,
                  pointRadius: 0,
                  pointHoverRadius: 4,
                  pointHoverBackgroundColor: '#3b82f6'
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: '#1f2937',
                    titleFont: { size: 11 },
                    bodyFont: { size: 11 },
                    padding: 8,
                    cornerRadius: 6
                  }
                },
                scales: {
                  x: {
                    display: true,
                    grid: { display: false },
                    ticks: { font: { size: 9 }, maxRotation: 45, maxTicksLimit: 8 }
                  },
                  y: {
                    display: true,
                    beginAtZero: true,
                    grid: { color: '#f1f5f9' },
                    ticks: { font: { size: 10 }, stepSize: 1 }
                  }
                },
                interaction: { intersect: false, mode: 'index' }
              }
            });
          }

          // Bar Chart - Regulator Cadence
          const cadenceCtx = document.getElementById('regulatorCadenceChart');
          if (cadenceCtx) {
            new Chart(cadenceCtx, {
              type: 'bar',
              data: {
                labels: chartData.regulatorCadence.labels,
                datasets: [{
                  data: chartData.regulatorCadence.values,
                  backgroundColor: [
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(74, 222, 128, 0.8)',
                    'rgba(134, 239, 172, 0.8)',
                    'rgba(187, 247, 208, 0.8)',
                    'rgba(209, 250, 229, 0.8)',
                    'rgba(220, 252, 231, 0.8)',
                    'rgba(236, 253, 245, 0.8)'
                  ],
                  borderRadius: 4,
                  borderSkipped: false
                }]
              },
              options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: '#1f2937',
                    titleFont: { size: 11 },
                    bodyFont: { size: 11 },
                    padding: 8,
                    cornerRadius: 6,
                    callbacks: {
                      label: function(context) {
                        return context.raw + ' updates';
                      }
                    }
                  }
                },
                scales: {
                  x: {
                    display: true,
                    grid: { color: '#f1f5f9' },
                    ticks: { font: { size: 10 } }
                  },
                  y: {
                    display: true,
                    grid: { display: false },
                    ticks: { font: { size: 9, weight: '500' } }
                  }
                }
              }
            });
          }
        }
      })();
    </script>
  `
}

module.exports = { renderDashboardCharts }
