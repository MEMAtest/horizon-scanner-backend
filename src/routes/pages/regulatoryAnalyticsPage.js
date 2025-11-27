const { getSidebar } = require('../templates/sidebar')
const { getClientScripts } = require('../templates/clientScripts')
const { getCommonStyles } = require('../templates/commonStyles')
const dbService = require('../../services/dbService')

function resolveUserId(req) {
  const headerUser = req.headers['x-user-id']
  if (headerUser && typeof headerUser === 'string' && headerUser.trim()) {
    return headerUser.trim()
  }
  return 'default'
}

async function renderRegulatoryAnalyticsPage(req, res) {
  try {
    console.log('[Analytics] Rendering regulatory analytics dashboard...')

    const userId = resolveUserId(req)

    // Get analytics data
    const [
      updates,
      filterOptions,
      sidebar
    ] = await Promise.all([
      dbService.getEnhancedUpdates({ limit: 1000 }),
      dbService.getFilterOptions(),
      getSidebar('regulatory-analytics')
    ])

    // Calculate analytics data
    const analyticsData = calculateAnalytics(updates)

    const commonStyles = getCommonStyles()
    const clientScripts = getClientScripts()

    const html = buildAnalyticsPage({
      sidebar,
      commonStyles,
      clientScripts,
      analyticsData,
      filterOptions
    })

    res.send(html)
  } catch (error) {
    console.error('[Analytics] Error rendering page:', error)
    res.status(500).send(renderAnalyticsError(error))
  }
}

function calculateAnalytics(updates) {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  // Monthly data for the last 12 months
  const monthlyData = {}
  const authorityData = {}
  const sectorData = {}
  const impactData = { high: 0, medium: 0, low: 0 }

  updates.forEach(update => {
    const date = new Date(update.published_date || update.created_at)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    // Monthly counts
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { total: 0, high: 0, medium: 0, low: 0 }
    }
    monthlyData[monthKey].total++
    const impact = (update.impact_level || 'medium').toLowerCase()
    if (monthlyData[monthKey][impact] !== undefined) {
      monthlyData[monthKey][impact]++
    }

    // Authority counts
    const authority = update.authority || 'Unknown'
    if (!authorityData[authority]) {
      authorityData[authority] = { total: 0, recent: 0 }
    }
    authorityData[authority].total++
    if (date >= thirtyDaysAgo) {
      authorityData[authority].recent++
    }

    // Sector counts
    const sector = update.sector || 'General'
    if (!sectorData[sector]) {
      sectorData[sector] = { total: 0, recent: 0 }
    }
    sectorData[sector].total++
    if (date >= thirtyDaysAgo) {
      sectorData[sector].recent++
    }

    // Impact distribution
    if (impactData[impact] !== undefined) {
      impactData[impact]++
    }
  })

  // Sort monthly data and get last 12 months
  const sortedMonths = Object.keys(monthlyData).sort().slice(-12)
  const monthlyChartData = sortedMonths.map(key => ({
    month: key,
    ...monthlyData[key]
  }))

  // Get top authorities
  const topAuthorities = Object.entries(authorityData)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10)
    .map(([name, data]) => ({ name, ...data }))

  // Get top sectors
  const topSectors = Object.entries(sectorData)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10)
    .map(([name, data]) => ({ name, ...data }))

  // Calculate velocity (change in last 30 days vs previous 30 days)
  const last30Days = updates.filter(u => new Date(u.published_date || u.created_at) >= thirtyDaysAgo).length
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
  const previous30Days = updates.filter(u => {
    const date = new Date(u.published_date || u.created_at)
    return date >= sixtyDaysAgo && date < thirtyDaysAgo
  }).length
  const velocityChange = previous30Days > 0 ? Math.round(((last30Days - previous30Days) / previous30Days) * 100) : 0

  return {
    summary: {
      totalUpdates: updates.length,
      last30Days,
      last90Days: updates.filter(u => new Date(u.published_date || u.created_at) >= ninetyDaysAgo).length,
      velocityChange,
      highImpact: impactData.high,
      activeAuthorities: Object.keys(authorityData).length,
      activeSectors: Object.keys(sectorData).length
    },
    monthlyChartData,
    topAuthorities,
    topSectors,
    impactDistribution: impactData
  }
}

function buildAnalyticsPage({ sidebar, commonStyles, clientScripts, analyticsData, filterOptions }) {
  const { summary, monthlyChartData, topAuthorities, topSectors, impactDistribution } = analyticsData

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Regulatory Analytics - Horizon Scanner</title>
      ${commonStyles}
      <script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>
      <style>
        .analytics-page {
          padding: 24px;
          min-height: 100vh;
          background: #f8fafc;
        }

        .analytics-header {
          margin-bottom: 24px;
        }

        .analytics-header h1 {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        .header-subtitle {
          color: #64748b;
          font-size: 14px;
          margin: 0;
        }

        /* Summary Cards */
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .summary-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #e2e8f0;
        }

        .summary-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .summary-card-label {
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
        }

        .summary-card-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .summary-card-icon svg {
          width: 18px;
          height: 18px;
        }

        .summary-card-value {
          font-size: 32px;
          font-weight: 700;
          color: #1e293b;
          line-height: 1;
        }

        .summary-card-change {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          margin-top: 8px;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .summary-card-change.positive {
          background: #f0fdf4;
          color: #16a34a;
        }

        .summary-card-change.negative {
          background: #fef2f2;
          color: #dc2626;
        }

        .summary-card-change.neutral {
          background: #f8fafc;
          color: #64748b;
        }

        /* Charts Grid */
        .charts-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
          margin-bottom: 24px;
        }

        @media (max-width: 1200px) {
          .charts-grid {
            grid-template-columns: 1fr;
          }
        }

        .chart-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #e2e8f0;
        }

        .chart-card.full-width {
          grid-column: 1 / -1;
        }

        .chart-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .chart-card-title {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .chart-card-subtitle {
          font-size: 13px;
          color: #64748b;
          margin: 4px 0 0 0;
        }

        .chart-container {
          min-height: 300px;
        }

        /* Top Items Lists */
        .top-items-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        @media (max-width: 1200px) {
          .top-items-grid {
            grid-template-columns: 1fr;
          }
        }

        .top-items-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #e2e8f0;
        }

        .top-items-header {
          margin-bottom: 16px;
        }

        .top-items-title {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .top-items-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .top-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #f1f5f9;
        }

        .top-item:last-child {
          border-bottom: none;
        }

        .top-item-rank {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          background: #f1f5f9;
          color: #64748b;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
        }

        .top-item-rank.gold {
          background: #fef3c7;
          color: #d97706;
        }

        .top-item-rank.silver {
          background: #f1f5f9;
          color: #64748b;
        }

        .top-item-rank.bronze {
          background: #ffedd5;
          color: #ea580c;
        }

        .top-item-name {
          flex: 1;
          font-weight: 500;
          color: #1e293b;
          font-size: 14px;
        }

        .top-item-stats {
          display: flex;
          gap: 16px;
        }

        .top-item-stat {
          text-align: right;
        }

        .top-item-stat-value {
          font-weight: 600;
          color: #1e293b;
          font-size: 14px;
        }

        .top-item-stat-label {
          font-size: 11px;
          color: #94a3b8;
        }

        .top-item-bar {
          height: 4px;
          background: #e2e8f0;
          border-radius: 2px;
          margin-top: 4px;
          overflow: hidden;
        }

        .top-item-bar-fill {
          height: 100%;
          border-radius: 2px;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
        }

        /* Insights Panel */
        .insights-panel {
          background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%);
          border-radius: 12px;
          padding: 24px;
          margin-top: 24px;
          color: white;
        }

        .insights-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 16px 0;
        }

        .insights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }

        .insight-item {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 16px;
        }

        .insight-item-icon {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }

        .insight-item-icon svg {
          width: 16px;
          height: 16px;
        }

        .insight-item-title {
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .insight-item-text {
          font-size: 13px;
          opacity: 0.9;
          line-height: 1.5;
        }
      </style>
    </head>
    <body>
      ${sidebar}
      <main class="main-content">
        <div class="analytics-page">
          <header class="analytics-header">
            <h1>Regulatory Analytics Dashboard</h1>
            <p class="header-subtitle">Publications by source, regulator, sector, and trends over time</p>
          </header>

          <!-- Summary Cards -->
          <div class="summary-grid">
            <div class="summary-card">
              <div class="summary-card-header">
                <span class="summary-card-label">Total Publications</span>
                <div class="summary-card-icon" style="background: #eff6ff;">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M9 9h6M9 13h6M9 17h4"/>
                  </svg>
                </div>
              </div>
              <div class="summary-card-value">${summary.totalUpdates.toLocaleString()}</div>
              <div class="summary-card-change neutral">All time</div>
            </div>

            <div class="summary-card">
              <div class="summary-card-header">
                <span class="summary-card-label">Last 30 Days</span>
                <div class="summary-card-icon" style="background: #f0fdf4;">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
              </div>
              <div class="summary-card-value">${summary.last30Days.toLocaleString()}</div>
              <div class="summary-card-change ${summary.velocityChange >= 0 ? 'positive' : 'negative'}">
                ${summary.velocityChange >= 0 ? '+' : ''}${summary.velocityChange}% vs prev 30d
              </div>
            </div>

            <div class="summary-card">
              <div class="summary-card-header">
                <span class="summary-card-label">High Impact</span>
                <div class="summary-card-icon" style="background: #fef2f2;">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
              </div>
              <div class="summary-card-value">${summary.highImpact.toLocaleString()}</div>
              <div class="summary-card-change neutral">Requires attention</div>
            </div>

            <div class="summary-card">
              <div class="summary-card-header">
                <span class="summary-card-label">Active Regulators</span>
                <div class="summary-card-icon" style="background: #f5f3ff;">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2">
                    <path d="M12 4 4.5 7.5v11h15v-11L12 4z"/>
                    <path d="M7.5 10.5v6M12 10.5v6M16.5 10.5v6"/>
                  </svg>
                </div>
              </div>
              <div class="summary-card-value">${summary.activeAuthorities}</div>
              <div class="summary-card-change neutral">Publishing content</div>
            </div>
          </div>

          <!-- Charts -->
          <div class="charts-grid">
            <div class="chart-card full-width">
              <div class="chart-card-header">
                <div>
                  <h3 class="chart-card-title">Monthly Publication Trends</h3>
                  <p class="chart-card-subtitle">Total publications by month with impact breakdown</p>
                </div>
              </div>
              <div class="chart-container" id="monthlyTrendChart"></div>
            </div>

            <div class="chart-card">
              <div class="chart-card-header">
                <div>
                  <h3 class="chart-card-title">Publications by Regulator</h3>
                  <p class="chart-card-subtitle">Top 10 most active authorities</p>
                </div>
              </div>
              <div class="chart-container" id="authorityChart"></div>
            </div>

            <div class="chart-card">
              <div class="chart-card-header">
                <div>
                  <h3 class="chart-card-title">Impact Distribution</h3>
                  <p class="chart-card-subtitle">Breakdown by impact level</p>
                </div>
              </div>
              <div class="chart-container" id="impactChart"></div>
            </div>
          </div>

          <!-- Top Items Lists -->
          <div class="top-items-grid">
            <div class="top-items-card">
              <div class="top-items-header">
                <h3 class="top-items-title">Top Regulators by Volume</h3>
              </div>
              <ul class="top-items-list">
                ${topAuthorities.slice(0, 8).map((auth, i) => `
                  <li class="top-item">
                    <span class="top-item-rank ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}">${i + 1}</span>
                    <span class="top-item-name">${escapeHtml(auth.name)}</span>
                    <div class="top-item-stats">
                      <div class="top-item-stat">
                        <div class="top-item-stat-value">${auth.total}</div>
                        <div class="top-item-stat-label">Total</div>
                      </div>
                      <div class="top-item-stat">
                        <div class="top-item-stat-value">${auth.recent}</div>
                        <div class="top-item-stat-label">30d</div>
                      </div>
                    </div>
                  </li>
                `).join('')}
              </ul>
            </div>

            <div class="top-items-card">
              <div class="top-items-header">
                <h3 class="top-items-title">Top Sectors by Coverage</h3>
              </div>
              <ul class="top-items-list">
                ${topSectors.slice(0, 8).map((sector, i) => `
                  <li class="top-item">
                    <span class="top-item-rank ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}">${i + 1}</span>
                    <span class="top-item-name">${escapeHtml(sector.name)}</span>
                    <div class="top-item-stats">
                      <div class="top-item-stat">
                        <div class="top-item-stat-value">${sector.total}</div>
                        <div class="top-item-stat-label">Total</div>
                      </div>
                      <div class="top-item-stat">
                        <div class="top-item-stat-value">${sector.recent}</div>
                        <div class="top-item-stat-label">30d</div>
                      </div>
                    </div>
                  </li>
                `).join('')}
              </ul>
            </div>
          </div>

          <!-- Insights Panel -->
          <div class="insights-panel">
            <h3 class="insights-title">Key Insights</h3>
            <div class="insights-grid">
              <div class="insight-item">
                <div class="insight-item-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </div>
                <div class="insight-item-title">Activity Velocity</div>
                <div class="insight-item-text">
                  ${summary.velocityChange >= 0
                    ? `Regulatory activity has increased by ${summary.velocityChange}% compared to the previous period. Stay vigilant for new requirements.`
                    : `Regulatory activity has decreased by ${Math.abs(summary.velocityChange)}% compared to the previous period.`
                  }
                </div>
              </div>
              <div class="insight-item">
                <div class="insight-item-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 8v4l2 2"/>
                  </svg>
                </div>
                <div class="insight-item-title">High Impact Focus</div>
                <div class="insight-item-text">
                  ${summary.highImpact} publications marked as high impact require immediate attention and action planning.
                </div>
              </div>
              <div class="insight-item">
                <div class="insight-item-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 4 4.5 7.5v11h15v-11L12 4z"/>
                  </svg>
                </div>
                <div class="insight-item-title">Regulator Coverage</div>
                <div class="insight-item-text">
                  Monitoring ${summary.activeAuthorities} active regulators across ${summary.activeSectors} sectors for comprehensive coverage.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      ${clientScripts}
      <script>
        const analyticsData = {
          monthlyChartData: ${JSON.stringify(monthlyChartData)},
          topAuthorities: ${JSON.stringify(topAuthorities)},
          impactDistribution: ${JSON.stringify(impactDistribution)}
        };

        // Monthly Trend Chart (Area + Bar combo)
        const monthlyOptions = {
          series: [
            {
              name: 'Total',
              type: 'area',
              data: analyticsData.monthlyChartData.map(d => d.total)
            },
            {
              name: 'High Impact',
              type: 'bar',
              data: analyticsData.monthlyChartData.map(d => d.high)
            }
          ],
          chart: {
            height: 320,
            type: 'line',
            toolbar: { show: false },
            fontFamily: 'Inter, system-ui, sans-serif'
          },
          stroke: {
            width: [3, 0],
            curve: 'smooth'
          },
          fill: {
            type: ['gradient', 'solid'],
            gradient: {
              shadeIntensity: 1,
              opacityFrom: 0.4,
              opacityTo: 0.1,
              stops: [0, 90, 100]
            }
          },
          colors: ['#3b82f6', '#ef4444'],
          xaxis: {
            categories: analyticsData.monthlyChartData.map(d => {
              const [year, month] = d.month.split('-');
              return new Date(year, month - 1).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
            }),
            labels: { style: { colors: '#64748b', fontSize: '12px' } }
          },
          yaxis: {
            labels: { style: { colors: '#64748b', fontSize: '12px' } }
          },
          legend: {
            position: 'top',
            horizontalAlign: 'right'
          },
          tooltip: {
            shared: true,
            intersect: false
          },
          grid: {
            borderColor: '#f1f5f9',
            strokeDashArray: 4
          }
        };

        const monthlyChart = new ApexCharts(document.querySelector("#monthlyTrendChart"), monthlyOptions);
        monthlyChart.render();

        // Authority Chart (Horizontal Bar)
        const authorityOptions = {
          series: [{
            name: 'Publications',
            data: analyticsData.topAuthorities.slice(0, 8).map(a => a.total)
          }],
          chart: {
            type: 'bar',
            height: 320,
            toolbar: { show: false },
            fontFamily: 'Inter, system-ui, sans-serif'
          },
          plotOptions: {
            bar: {
              borderRadius: 4,
              horizontal: true,
              distributed: true,
              dataLabels: { position: 'top' }
            }
          },
          colors: ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'],
          dataLabels: {
            enabled: true,
            offsetX: 20,
            style: { fontSize: '12px', colors: ['#1e293b'] }
          },
          xaxis: {
            categories: analyticsData.topAuthorities.slice(0, 8).map(a => a.name),
            labels: { style: { colors: '#64748b', fontSize: '12px' } }
          },
          yaxis: {
            labels: { style: { colors: '#1e293b', fontSize: '12px' } }
          },
          legend: { show: false },
          grid: {
            borderColor: '#f1f5f9',
            strokeDashArray: 4
          }
        };

        const authorityChart = new ApexCharts(document.querySelector("#authorityChart"), authorityOptions);
        authorityChart.render();

        // Impact Distribution Chart (Donut)
        const impactOptions = {
          series: [
            analyticsData.impactDistribution.high,
            analyticsData.impactDistribution.medium,
            analyticsData.impactDistribution.low
          ],
          chart: {
            type: 'donut',
            height: 320,
            fontFamily: 'Inter, system-ui, sans-serif'
          },
          labels: ['High Impact', 'Medium Impact', 'Low Impact'],
          colors: ['#ef4444', '#f59e0b', '#10b981'],
          plotOptions: {
            pie: {
              donut: {
                size: '60%',
                labels: {
                  show: true,
                  total: {
                    show: true,
                    label: 'Total',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#64748b'
                  }
                }
              }
            }
          },
          dataLabels: {
            enabled: true,
            formatter: function(val, opts) {
              return opts.w.config.series[opts.seriesIndex];
            }
          },
          legend: {
            position: 'bottom',
            fontSize: '13px'
          },
          stroke: { width: 2, colors: ['#fff'] }
        };

        const impactChart = new ApexCharts(document.querySelector("#impactChart"), impactOptions);
        impactChart.render();
      </script>
    </body>
    </html>
  `
}

function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function renderAnalyticsError(error) {
  return `
    <!DOCTYPE html>
    <html>
      <head><title>Error - Regulatory Analytics</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>Error Loading Analytics</h1>
        <p>Unable to load the regulatory analytics dashboard. Please try refreshing.</p>
        <p><a href="/regulatory-analytics">Try Again</a></p>
        <small>Error: ${error.message}</small>
      </body>
    </html>
  `
}

module.exports = { renderRegulatoryAnalyticsPage }
