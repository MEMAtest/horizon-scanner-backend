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

/**
 * Normalize impact level values from various formats to high/medium/low
 * Handles: Significant/Moderate/Informational, High/Medium/Low, numbers, etc.
 */
function normalizeImpactLevel(rawImpact) {
  if (!rawImpact) return 'medium'

  const impact = String(rawImpact).toLowerCase().trim()

  // Map various formats to standard high/medium/low
  const highValues = ['high', 'significant', 'critical', 'severe', '3', 'major']
  const lowValues = ['low', 'informational', 'minor', 'negligible', '1', 'minimal']

  if (highValues.includes(impact)) return 'high'
  if (lowValues.includes(impact)) return 'low'

  // Default to medium for: medium, moderate, normal, 2, etc.
  return 'medium'
}

async function renderRegulatoryAnalyticsPage(req, res) {
  try {
    console.log('[Analytics] Rendering regulatory analytics dashboard...')

    // Ensure dbService is initialized
    if (!dbService.isInitialized) {
      console.log('[Analytics] Waiting for database initialization...')
      await dbService.waitForInitialization()
    }

    const userId = resolveUserId(req)

    // Get analytics data with individual error handling
    let updates = []
    let filterOptions = { authorities: [], sectors: [] }
    let sidebar = ''

    try {
      updates = await dbService.getEnhancedUpdates({ limit: 1000 })
      console.log(`[Analytics] Retrieved ${updates.length} updates`)
    } catch (error) {
      console.error('[Analytics] Error getting updates:', error)
      // Continue with empty array
    }

    try {
      filterOptions = await dbService.getFilterOptions()
      console.log(`[Analytics] Retrieved filter options: ${filterOptions.authorities?.length || 0} authorities, ${filterOptions.sectors?.length || 0} sectors`)
    } catch (error) {
      console.error('[Analytics] Error getting filter options:', error)
      // Continue with empty options
    }

    try {
      sidebar = await getSidebar('regulatory-analytics')
    } catch (error) {
      console.error('[Analytics] Error getting sidebar:', error)
      sidebar = '<div></div>' // Empty sidebar
    }

    // Calculate analytics data
    const analyticsData = calculateAnalytics(updates)

    const commonStyles = getCommonStyles()
    const clientScripts = getClientScripts()

    const html = buildAnalyticsPage({
      sidebar,
      commonStyles,
      clientScripts,
      analyticsData,
      filterOptions,
      updates
    })

    res.send(html)
  } catch (error) {
    console.error('[Analytics] Error rendering page:', error)
    console.error('[Analytics] Error stack:', error.stack)
    res.status(500).send(renderAnalyticsError(error))
  }
}

function calculateAnalytics(updates) {
  // Ensure updates is always an array
  const safeUpdates = Array.isArray(updates) ? updates : []

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  // Monthly data for the last 12 months
  const monthlyData = {}
  const authorityData = {}
  const sectorData = {}
  const impactData = { high: 0, medium: 0, low: 0 }

  safeUpdates.forEach(update => {
    const date = new Date(update.published_date || update.created_at)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    // Monthly counts
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { total: 0, high: 0, medium: 0, low: 0 }
    }
    monthlyData[monthKey].total++
    const impact = normalizeImpactLevel(update.impact_level)
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

    // Impact distribution (use normalized impact)
    const impactForDist = normalizeImpactLevel(update.impact_level)
    if (impactData[impactForDist] !== undefined) {
      impactData[impactForDist]++
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
  const last30Days = safeUpdates.filter(u => new Date(u.published_date || u.created_at) >= thirtyDaysAgo).length
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
  const previous30Days = safeUpdates.filter(u => {
    const date = new Date(u.published_date || u.created_at)
    return date >= sixtyDaysAgo && date < thirtyDaysAgo
  }).length
  const velocityChange = previous30Days > 0 ? Math.round(((last30Days - previous30Days) / previous30Days) * 100) : 0

  // NEW: Calculate sector compliance burden (avg publications per month)
  const sectorBurden = Object.entries(sectorData)
    .map(([name, data]) => ({
      name,
      total: data.total,
      recent: data.recent,
      avgPerMonth: Math.round(data.total / 12), // Assume 12 months of data
      percentOfTotal: Math.round((data.total / safeUpdates.length) * 100)
    }))
    .sort((a, b) => b.avgPerMonth - a.avgPerMonth)
    .slice(0, 15)

  // NEW: Calculate weekly activity heatmap for authorities
  const weeklyActivity = {}
  const weeksAgo = (weeks) => new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000)

  for (let i = 0; i < 12; i++) {
    const weekStart = weeksAgo(i + 1)
    const weekEnd = weeksAgo(i)
    const weekKey = `Week ${12 - i}`

    weeklyActivity[weekKey] = {}
    safeUpdates.forEach(update => {
      const date = new Date(update.published_date || update.created_at)
      if (date >= weekStart && date < weekEnd) {
        const auth = update.authority || 'Unknown'
        weeklyActivity[weekKey][auth] = (weeklyActivity[weekKey][auth] || 0) + 1
      }
    })
  }

  // NEW: Impact severity trends over time
  const impactTrends = sortedMonths.map(monthKey => {
    const data = monthlyData[monthKey]
    return {
      month: monthKey,
      highCount: data.high,
      mediumCount: data.medium,
      lowCount: data.low,
      highPercentage: Math.round((data.high / data.total) * 100),
      severityScore: (data.high * 3 + data.medium * 2 + data.low * 1) / data.total
    }
  })

  // NEW: Authority comparison data
  const authorityComparison = Object.entries(authorityData)
    .map(([name, data]) => ({
      name,
      total: data.total,
      recent: data.recent,
      trend: data.recent > (data.total / 12) ? 'increasing' : 'decreasing',
      marketShare: Math.round((data.total / safeUpdates.length) * 100),
      velocity: data.recent - Math.round(data.total / 12)
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  // NEW: Sector cross-analysis (which sectors are most active together)
  const sectorPairs = {}
  safeUpdates.forEach(update => {
    const sector = update.sector || 'General'
    const authority = update.authority || 'Unknown'
    const key = `${sector}|${authority}`
    sectorPairs[key] = (sectorPairs[key] || 0) + 1
  })

  const topSectorAuthorityPairs = Object.entries(sectorPairs)
    .map(([key, count]) => {
      const [sector, authority] = key.split('|')
      return { sector, authority, count }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)

  // NEW: Publication velocity metrics
  const velocityMetrics = {
    current30Days: last30Days,
    previous30Days,
    change: velocityChange,
    avgPerDay: Math.round(last30Days / 30),
    peakDay: 0, // Would need daily data
    projection90Days: Math.round(last30Days * 3 * (1 + velocityChange / 100))
  }

  return {
    summary: {
      totalUpdates: safeUpdates.length,
      last30Days,
      last90Days: safeUpdates.filter(u => new Date(u.published_date || u.created_at) >= ninetyDaysAgo).length,
      velocityChange,
      highImpact: impactData.high,
      activeAuthorities: Object.keys(authorityData).length,
      activeSectors: Object.keys(sectorData).length
    },
    monthlyChartData,
    topAuthorities,
    topSectors,
    impactDistribution: impactData,
    // NEW ANALYTICS DATA
    sectorBurden,
    weeklyActivity,
    impactTrends,
    authorityComparison,
    topSectorAuthorityPairs,
    velocityMetrics
  }
}

function buildAnalyticsPage({ sidebar, commonStyles, clientScripts, analyticsData, filterOptions, updates }) {
  const {
    summary, monthlyChartData, topAuthorities, topSectors, impactDistribution,
    sectorBurden, weeklyActivity, impactTrends, authorityComparison, topSectorAuthorityPairs, velocityMetrics
  } = analyticsData
  // Ensure updates is always an array
  const safeUpdates = Array.isArray(updates) ? updates : []

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Regulatory Analytics - Horizon Scanner</title>
      ${commonStyles}
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
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

        /* Export buttons */
        .export-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .export-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .export-btn:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .export-btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: white;
          border-color: transparent;
        }

        .export-btn-primary:hover {
          opacity: 0.9;
          border-color: transparent;
          background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
        }

        .export-btn svg {
          flex-shrink: 0;
        }

        /* Drill-down modal */
        .drilldown-modal {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1000;
          justify-content: center;
          align-items: center;
        }

        .drilldown-modal.active {
          display: flex;
        }

        .drilldown-content {
          background: white;
          border-radius: 16px;
          width: 90%;
          max-width: 800px;
          max-height: 80vh;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .drilldown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
        }

        .drilldown-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
        }

        .drilldown-close {
          width: 32px;
          height: 32px;
          border: none;
          background: #f1f5f9;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
        }

        .drilldown-close:hover {
          background: #e2e8f0;
          color: #374151;
        }

        .drilldown-body {
          padding: 24px;
          overflow-y: auto;
          max-height: calc(80vh - 80px);
        }

        .drilldown-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .drilldown-item {
          padding: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          transition: all 0.15s ease;
        }

        .drilldown-item:hover {
          border-color: #3b82f6;
          background: #f8fafc;
        }

        .drilldown-item-title {
          font-weight: 600;
          color: #1e293b;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .drilldown-item-meta {
          font-size: 12px;
          color: #64748b;
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .drilldown-item a {
          color: #3b82f6;
          text-decoration: none;
        }

        .drilldown-item a:hover {
          text-decoration: underline;
        }

        .drilldown-empty {
          text-align: center;
          color: #64748b;
          padding: 32px;
        }

        /* Clickable chart cursor */
        .chart-container canvas {
          cursor: pointer;
        }

        /* NEW: Hover highlight for interactive elements */
        .hover-highlight {
          transition: all 0.2s ease;
        }

        .hover-highlight:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border-color: #6366f1 !important;
        }
      </style>
    </head>
    <body>
      ${sidebar}
      <main class="main-content">
        <div class="analytics-page">
          <header class="analytics-header">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
              <div>
                <h1>Regulatory Analytics Dashboard</h1>
                <p class="header-subtitle">Publications by source, regulator, sector, and trends over time</p>
              </div>
              <div class="export-buttons">
                <button onclick="exportData('csv')" class="export-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                  Export CSV
                </button>
                <button onclick="exportData('excel')" class="export-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                  Export Excel
                </button>
                <button onclick="exportData('summary')" class="export-btn export-btn-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Full Report
                </button>
              </div>
            </div>
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
              <div class="chart-container">
                <canvas id="monthlyTrendChart"></canvas>
              </div>
            </div>

            <div class="chart-card">
              <div class="chart-card-header">
                <div>
                  <h3 class="chart-card-title">Publications by Regulator</h3>
                  <p class="chart-card-subtitle">Top 10 most active authorities</p>
                </div>
              </div>
              <div class="chart-container">
                <canvas id="authorityChart"></canvas>
              </div>
            </div>

            <div class="chart-card">
              <div class="chart-card-header">
                <div>
                  <h3 class="chart-card-title">Impact Distribution</h3>
                  <p class="chart-card-subtitle">Breakdown by impact level</p>
                </div>
              </div>
              <div class="chart-container">
                <canvas id="impactChart"></canvas>
              </div>
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

          <!-- NEW: Advanced Analytics Widgets -->
          <div class="charts-grid" style="margin-top: 2rem;">
            <!-- Sector Compliance Burden Widget -->
            <div class="chart-card">
              <div class="chart-card-header">
                <div>
                  <h3 class="chart-card-title">Sector Compliance Burden</h3>
                  <p class="chart-card-subtitle">Average publications per month by sector - Click to drill down</p>
                </div>
              </div>
              <div class="chart-container">
                <canvas id="sectorBurdenChart" style="cursor: pointer;"></canvas>
              </div>
              <div style="padding: 1rem; background: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 0.875rem;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem;">
                  ${sectorBurden.slice(0, 6).map(sector => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: white; border-radius: 4px; border: 1px solid #e5e7eb; cursor: pointer;"
                         onclick="drillDownSector('${escapeHtml(sector.name)}')"
                         class="hover-highlight">
                      <span style="font-weight: 500; color: #374151;">${escapeHtml(sector.name)}</span>
                      <span style="color: #6366f1; font-weight: 600;">${sector.avgPerMonth}/mo</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- Impact Severity Trends Widget -->
            <div class="chart-card">
              <div class="chart-card-header">
                <div>
                  <h3 class="chart-card-title">Impact Severity Trends</h3>
                  <p class="chart-card-subtitle">High-impact publication rate over time - Click for details</p>
                </div>
              </div>
              <div class="chart-container">
                <canvas id="impactTrendsChart" style="cursor: pointer;"></canvas>
              </div>
              <div style="padding: 1rem; background: #fef2f2; border-top: 1px solid #fecaca;">
                <div style="display: flex; justify-content: space-around; text-align: center;">
                  <div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: #dc2626;">
                      ${Math.round(impactTrends[impactTrends.length - 1]?.highPercentage || 0)}%
                    </div>
                    <div style="font-size: 0.75rem; color: #991b1b;">High Impact This Month</div>
                  </div>
                  <div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: #ea580c;">
                      ${impactTrends[impactTrends.length - 1]?.severityScore.toFixed(2) || '0'}
                    </div>
                    <div style="font-size: 0.75rem; color: #9a3412;">Severity Score</div>
                  </div>
                  <div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: ${impactTrends.length >= 2 && impactTrends[impactTrends.length - 1]?.highPercentage > impactTrends[impactTrends.length - 2]?.highPercentage ? '#dc2626' : '#10b981'};">
                      ${impactTrends.length >= 2 ? (impactTrends[impactTrends.length - 1]?.highPercentage > impactTrends[impactTrends.length - 2]?.highPercentage ? '↑' : '↓') : '−'}
                    </div>
                    <div style="font-size: 0.75rem; color: #78350f;">Trend</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Authority Comparison Widget -->
            <div class="chart-card">
              <div class="chart-card-header">
                <div>
                  <h3 class="chart-card-title">Authority Activity Comparison</h3>
                  <p class="chart-card-subtitle">Regulatory velocity by authority - Click to compare</p>
                </div>
              </div>
              <div class="chart-container">
                <canvas id="authorityComparisonChart" style="cursor: pointer;"></canvas>
              </div>
              <div style="padding: 1rem; background: #f9fafb; border-top: 1px solid #e5e7eb;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.875rem;">
                  ${authorityComparison.slice(0, 4).map(auth => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: white; border-radius: 6px; border: 1px solid #e5e7eb; cursor: pointer;"
                         onclick="drillDownAuthority('${escapeHtml(auth.name)}')"
                         class="hover-highlight">
                      <div>
                        <div style="font-weight: 600; color: #111827; margin-bottom: 0.25rem;">${escapeHtml(auth.name)}</div>
                        <div style="font-size: 0.75rem; color: #6b7280;">
                          ${auth.marketShare}% market share · ${auth.trend}
                        </div>
                      </div>
                      <div style="text-align: right;">
                        <div style="font-weight: 700; color: ${auth.velocity >= 0 ? '#10b981' : '#ef4444'};">
                          ${auth.velocity >= 0 ? '+' : ''}${auth.velocity}
                        </div>
                        <div style="font-size: 0.75rem; color: #9ca3af;">velocity</div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>

          <!-- NEW: Publication Velocity Dashboard -->
          <div class="chart-card full-width" style="margin-top: 2rem;">
            <div class="chart-card-header">
              <div>
                <h3 class="chart-card-title">Publication Velocity Dashboard</h3>
                <p class="chart-card-subtitle">Detailed analysis of regulatory activity rate</p>
              </div>
            </div>
            <div style="padding: 1.5rem;">
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
                <div style="padding: 1.25rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; color: white;">
                  <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem;">Current 30-Day Rate</div>
                  <div style="font-size: 2.5rem; font-weight: 700;">${velocityMetrics.current30Days}</div>
                  <div style="font-size: 0.75rem; opacity: 0.8; margin-top: 0.5rem;">publications</div>
                </div>
                <div style="padding: 1.25rem; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 12px; color: white;">
                  <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem;">Velocity Change</div>
                  <div style="font-size: 2.5rem; font-weight: 700;">${velocityMetrics.change >= 0 ? '+' : ''}${velocityMetrics.change}%</div>
                  <div style="font-size: 0.75rem; opacity: 0.8; margin-top: 0.5rem;">vs previous period</div>
                </div>
                <div style="padding: 1.25rem; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); border-radius: 12px; color: white;">
                  <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem;">Daily Average</div>
                  <div style="font-size: 2.5rem; font-weight: 700;">${velocityMetrics.avgPerDay}</div>
                  <div style="font-size: 0.75rem; opacity: 0.8; margin-top: 0.5rem;">publications/day</div>
                </div>
                <div style="padding: 1.25rem; background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); border-radius: 12px; color: white;">
                  <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem;">90-Day Projection</div>
                  <div style="font-size: 2.5rem; font-weight: 700;">${velocityMetrics.projection90Days}</div>
                  <div style="font-size: 0.75rem; opacity: 0.8; margin-top: 0.5rem;">estimated publications</div>
                </div>
              </div>
            </div>
          </div>

          <!-- NEW: Weekly Activity Heatmap -->
          <div class="chart-card full-width" style="margin-top: 2rem;">
            <div class="chart-card-header">
              <div>
                <h3 class="chart-card-title">Weekly Regulatory Activity Heatmap</h3>
                <p class="chart-card-subtitle">Authority activity patterns over the last 12 weeks - Darker = More Active</p>
              </div>
            </div>
            <div style="padding: 1.5rem; overflow-x: auto;">
              <div style="display: grid; grid-template-columns: 120px repeat(12, 1fr); gap: 4px; font-size: 0.75rem;">
                <!-- Header Row -->
                <div style="padding: 0.5rem; font-weight: 600; color: #6b7280;"></div>
                ${Object.keys(weeklyActivity).map((week, i) => `
                  <div style="padding: 0.5rem; text-align: center; font-weight: 600; color: #6b7280; writing-mode: vertical-rl; transform: rotate(180deg);">
                    ${week}
                  </div>
                `).join('')}

                <!-- Data Rows -->
                ${topAuthorities.slice(0, 10).map(auth => {
                  const weeks = Object.keys(weeklyActivity);
                  const authMax = Math.max(...weeks.map(w => weeklyActivity[w][auth.name] || 0));

                  return `
                    <div style="display: contents;">
                      <div style="padding: 0.75rem; font-weight: 500; color: #111827; background: #f9fafb; display: flex; align-items: center;">
                        ${escapeHtml(auth.name)}
                      </div>
                      ${weeks.map(week => {
                        const count = weeklyActivity[week][auth.name] || 0;
                        const intensity = authMax > 0 ? count / authMax : 0;
                        const color = intensity === 0 ? '#f3f4f6' :
                                     intensity < 0.25 ? '#dbeafe' :
                                     intensity < 0.5 ? '#93c5fd' :
                                     intensity < 0.75 ? '#3b82f6' : '#1e40af';
                        const textColor = intensity >= 0.5 ? '#ffffff' : '#1f2937';

                        return `
                          <div style="padding: 0.75rem; text-align: center; background: ${color}; color: ${textColor}; font-weight: 600; border-radius: 4px; cursor: pointer; transition: transform 0.2s;"
                               onmouseover="this.style.transform='scale(1.1)'; this.style.zIndex='10'"
                               onmouseout="this.style.transform='scale(1)'; this.style.zIndex='1'"
                               title="${auth.name} - ${week}: ${count} publications">
                            ${count > 0 ? count : '·'}
                          </div>
                        `;
                      }).join('')}
                    </div>
                  `;
                }).join('')}
              </div>
              <div style="margin-top: 1.5rem; padding: 1rem; background: #f9fafb; border-radius: 8px; display: flex; justify-content: center; align-items: center; gap: 2rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span style="font-weight: 600; color: #374151;">Intensity:</span>
                  <div style="display: flex; gap: 0.25rem; align-items: center;">
                    <div style="width: 24px; height: 24px; background: #f3f4f6; border-radius: 4px;"></div>
                    <span style="color: #6b7280; font-size: 0.75rem;">None</span>
                    <div style="width: 24px; height: 24px; background: #dbeafe; border-radius: 4px; margin-left: 0.5rem;"></div>
                    <span style="color: #6b7280; font-size: 0.75rem;">Low</span>
                    <div style="width: 24px; height: 24px; background: #93c5fd; border-radius: 4px; margin-left: 0.5rem;"></div>
                    <span style="color: #6b7280; font-size: 0.75rem;">Medium</span>
                    <div style="width: 24px; height: 24px; background: #3b82f6; border-radius: 4px; margin-left: 0.5rem;"></div>
                    <span style="color: #6b7280; font-size: 0.75rem;">High</span>
                    <div style="width: 24px; height: 24px; background: #1e40af; border-radius: 4px; margin-left: 0.5rem;"></div>
                    <span style="color: #6b7280; font-size: 0.75rem;">Very High</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- NEW: Sector-Authority Heat Map -->
          <div class="chart-card full-width" style="margin-top: 2rem;">
            <div class="chart-card-header">
              <div>
                <h3 class="chart-card-title">Sector-Authority Activity Matrix</h3>
                <p class="chart-card-subtitle">Top sector-regulator pairs by volume - Click to drill down</p>
              </div>
            </div>
            <div style="padding: 1.5rem; overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
                <thead>
                  <tr style="background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                    <th style="padding: 0.75rem; text-align: left; font-weight: 600; color: #374151;">Rank</th>
                    <th style="padding: 0.75rem; text-align: left; font-weight: 600; color: #374151;">Sector</th>
                    <th style="padding: 0.75rem; text-align: left; font-weight: 600; color: #374151;">Authority</th>
                    <th style="padding: 0.75rem; text-align: right; font-weight: 600; color: #374151;">Publications</th>
                    <th style="padding: 0.75rem; text-align: right; font-weight: 600; color: #374151;">Activity</th>
                  </tr>
                </thead>
                <tbody>
                  ${topSectorAuthorityPairs.slice(0, 15).map((pair, i) => `
                    <tr style="border-bottom: 1px solid #f3f4f6; cursor: pointer; transition: background 0.2s;"
                        onclick="drillDownPair('${escapeHtml(pair.sector)}', '${escapeHtml(pair.authority)}')"
                        onmouseover="this.style.background='#f9fafb'"
                        onmouseout="this.style.background='transparent'">
                      <td style="padding: 0.75rem;">
                        <span style="display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center; border-radius: 50%; background: ${i < 3 ? '#fef3c7' : '#f3f4f6'}; color: ${i < 3 ? '#92400e' : '#6b7280'}; font-weight: 600; font-size: 0.75rem;">
                          ${i + 1}
                        </span>
                      </td>
                      <td style="padding: 0.75rem; font-weight: 500; color: #111827;">${escapeHtml(pair.sector)}</td>
                      <td style="padding: 0.75rem; color: #6b7280;">${escapeHtml(pair.authority)}</td>
                      <td style="padding: 0.75rem; text-align: right; font-weight: 600; color: #6366f1;">${pair.count}</td>
                      <td style="padding: 0.75rem; text-align: right;">
                        <div style="background: #e0e7ff; height: 6px; border-radius: 3px; overflow: hidden;">
                          <div style="background: #6366f1; height: 100%; width: ${(pair.count / topSectorAuthorityPairs[0].count) * 100}%;"></div>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
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

      <!-- Drill-down Modal -->
      <div id="drilldownModal" class="drilldown-modal" onclick="if(event.target === this) closeDrilldown()">
        <div class="drilldown-content">
          <div class="drilldown-header">
            <h3 id="drilldownTitle">Publications</h3>
            <button class="drilldown-close" onclick="closeDrilldown()">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="drilldown-body">
            <div id="drilldownContent" class="drilldown-list"></div>
          </div>
        </div>
      </div>

      ${clientScripts}
      <script>
        const analyticsData = {
          monthlyChartData: ${JSON.stringify(monthlyChartData)},
          topAuthorities: ${JSON.stringify(topAuthorities)},
          impactDistribution: ${JSON.stringify(impactDistribution)},
          rawUpdates: ${JSON.stringify(safeUpdates.slice(0, 500).map(u => ({
            title: u.title,
            authority: u.authority,
            sector: u.sector,
            impact_level: u.impact_level,
            published_date: u.published_date,
            source_url: u.source_url
          })))}
        };

        // Chart.js color palette (matching Enforcement page)
        const chartColors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444'];

        // Monthly Trend Chart (Mixed: Line + Bar)
        const monthlyCtx = document.getElementById('monthlyTrendChart').getContext('2d');
        const monthlyLabels = analyticsData.monthlyChartData.map(d => {
          const [year, month] = d.month.split('-');
          return new Date(year, month - 1).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
        });

        new Chart(monthlyCtx, {
          type: 'bar',
          data: {
            labels: monthlyLabels,
            datasets: [
              {
                type: 'line',
                label: 'Total Publications',
                data: analyticsData.monthlyChartData.map(d => d.total),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                tension: 0.35,
                fill: true,
                yAxisID: 'y'
              },
              {
                type: 'bar',
                label: 'High Impact',
                data: analyticsData.monthlyChartData.map(d => d.high),
                backgroundColor: 'rgba(239, 68, 68, 0.7)',
                borderColor: '#ef4444',
                borderWidth: 1,
                borderRadius: 6,
                yAxisID: 'y'
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            plugins: {
              legend: {
                position: 'top',
                align: 'end',
                labels: { usePointStyle: true, padding: 20 }
              },
              tooltip: {
                backgroundColor: 'rgba(30, 41, 59, 0.95)',
                titleColor: '#fff',
                bodyColor: '#fff',
                padding: 12,
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1
              }
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { color: '#64748b' }
              },
              y: {
                beginAtZero: true,
                grid: { color: '#f1f5f9' },
                ticks: { color: '#64748b' }
              }
            },
            onClick: (event, elements) => {
              if (elements.length > 0) {
                const index = elements[0].index;
                const monthData = analyticsData.monthlyChartData[index];
                showDrilldown('month', monthData.month, monthData);
              }
            }
          }
        });

        // Authority Chart (Horizontal Bar)
        const authorityCtx = document.getElementById('authorityChart').getContext('2d');
        const authData = analyticsData.topAuthorities.slice(0, 8);

        new Chart(authorityCtx, {
          type: 'bar',
          data: {
            labels: authData.map(a => a.name),
            datasets: [{
              label: 'Publications',
              data: authData.map(a => a.total),
              backgroundColor: chartColors.map(c => c + 'cc'),
              borderColor: chartColors,
              borderWidth: 1,
              borderRadius: 6
            }]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: 'rgba(30, 41, 59, 0.95)',
                titleColor: '#fff',
                bodyColor: '#fff',
                padding: 12
              }
            },
            scales: {
              x: {
                beginAtZero: true,
                grid: { color: '#f1f5f9' },
                ticks: { color: '#64748b' }
              },
              y: {
                grid: { display: false },
                ticks: { color: '#1e293b' }
              }
            },
            onClick: (event, elements) => {
              if (elements.length > 0) {
                const index = elements[0].index;
                const authority = authData[index];
                showDrilldown('authority', authority.name, authority);
              }
            }
          }
        });

        // Impact Distribution Chart (Doughnut)
        const impactCtx = document.getElementById('impactChart').getContext('2d');
        const impactData = [
          analyticsData.impactDistribution.high,
          analyticsData.impactDistribution.medium,
          analyticsData.impactDistribution.low
        ];
        const impactTotal = impactData.reduce((a, b) => a + b, 0);

        new Chart(impactCtx, {
          type: 'doughnut',
          data: {
            labels: ['High Impact', 'Medium Impact', 'Low Impact'],
            datasets: [{
              data: impactData,
              backgroundColor: [
                'rgba(239, 68, 68, 0.8)',
                'rgba(245, 158, 11, 0.8)',
                'rgba(34, 197, 94, 0.8)'
              ],
              borderColor: ['#ef4444', '#f59e0b', '#22c55e'],
              borderWidth: 2,
              hoverOffset: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
              legend: {
                position: 'bottom',
                labels: { usePointStyle: true, padding: 20 }
              },
              tooltip: {
                backgroundColor: 'rgba(30, 41, 59, 0.95)',
                titleColor: '#fff',
                bodyColor: '#fff',
                padding: 12,
                callbacks: {
                  label: function(context) {
                    const value = context.raw;
                    const percentage = ((value / impactTotal) * 100).toFixed(1);
                    return context.label + ': ' + value + ' (' + percentage + '%)';
                  }
                }
              }
            },
            onClick: (event, elements) => {
              if (elements.length > 0) {
                const index = elements[0].index;
                const impactLabels = ['high', 'medium', 'low'];
                const impactLevel = impactLabels[index];
                showDrilldown('impact', impactLevel, { count: impactData[index] });
              }
            }
          }
        });

        // NEW: Sector Burden Chart
        const sectorBurdenCtx = document.getElementById('sectorBurdenChart').getContext('2d');
        const sectorBurdenData = ${JSON.stringify(sectorBurden)};
        new Chart(sectorBurdenCtx, {
          type: 'bar',
          data: {
            labels: sectorBurdenData.map(s => s.name),
            datasets: [{
              label: 'Avg Publications/Month',
              data: sectorBurdenData.map(s => s.avgPerMonth),
              backgroundColor: 'rgba(99, 102, 241, 0.8)',
              borderColor: '#6366f1',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: 'rgba(30, 41, 59, 0.95)',
                callbacks: {
                  label: function(context) {
                    const sector = sectorBurdenData[context.dataIndex];
                    return [
                      'Avg/Month: ' + sector.avgPerMonth,
                      'Total: ' + sector.total,
                      'Market Share: ' + sector.percentOfTotal + '%'
                    ];
                  }
                }
              }
            },
            scales: {
              y: { beginAtZero: true, title: { display: true, text: 'Avg Publications/Month' } }
            },
            onClick: (event, elements) => {
              if (elements.length > 0) {
                const sector = sectorBurdenData[elements[0].index];
                drillDownSector(sector.name);
              }
            }
          }
        });

        // NEW: Impact Trends Chart
        const impactTrendsCtx = document.getElementById('impactTrendsChart').getContext('2d');
        const impactTrendsData = ${JSON.stringify(impactTrends)};
        new Chart(impactTrendsCtx, {
          type: 'line',
          data: {
            labels: impactTrendsData.map(t => t.month),
            datasets: [
              {
                label: 'High Impact %',
                data: impactTrendsData.map(t => t.highPercentage),
                borderColor: '#dc2626',
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
              },
              {
                label: 'Severity Score',
                data: impactTrendsData.map(t => t.severityScore * 20), // Scale for visibility
                borderColor: '#ea580c',
                backgroundColor: 'rgba(234, 88, 12, 0.1)',
                borderWidth: 2,
                borderDash: [5, 5],
                fill: false,
                tension: 0.4
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'top' },
              tooltip: {
                backgroundColor: 'rgba(30, 41, 59, 0.95)',
                callbacks: {
                  label: function(context) {
                    if (context.datasetIndex === 0) {
                      return 'High Impact: ' + context.parsed.y + '%';
                    } else {
                      return 'Severity Score: ' + (context.parsed.y / 20).toFixed(2);
                    }
                  }
                }
              }
            },
            scales: {
              y: { beginAtZero: true, max: 100 }
            }
          }
        });

        // NEW: Authority Comparison Chart
        const authCompCtx = document.getElementById('authorityComparisonChart').getContext('2d');
        const authCompData = ${JSON.stringify(authorityComparison)};
        new Chart(authCompCtx, {
          type: 'bar',
          data: {
            labels: authCompData.map(a => a.name),
            datasets: [
              {
                label: 'Total Publications',
                data: authCompData.map(a => a.total),
                backgroundColor: 'rgba(99, 102, 241, 0.6)',
                borderColor: '#6366f1',
                borderWidth: 2
              },
              {
                label: 'Recent (30d)',
                data: authCompData.map(a => a.recent),
                backgroundColor: 'rgba(16, 185, 129, 0.6)',
                borderColor: '#10b981',
                borderWidth: 2
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'top' },
              tooltip: {
                backgroundColor: 'rgba(30, 41, 59, 0.95)',
                callbacks: {
                  afterLabel: function(context) {
                    const auth = authCompData[context.dataIndex];
                    return 'Trend: ' + auth.trend + ' | Velocity: ' + auth.velocity;
                  }
                }
              }
            },
            scales: {
              y: { beginAtZero: true }
            },
            onClick: (event, elements) => {
              if (elements.length > 0) {
                const auth = authCompData[elements[0].index];
                drillDownAuthority(auth.name);
              }
            }
          }
        });

        // NEW: Drill-down functions for new widgets
        function drillDownSector(sectorName) {
          const filtered = analyticsData.rawUpdates.filter(u => u.sector === sectorName);
          showDrilldown('sector', sectorName, { count: filtered.length });
        }

        function drillDownAuthority(authorityName) {
          showDrilldown('authority', authorityName, {});
        }

        function drillDownPair(sector, authority) {
          const modal = document.getElementById('drilldownModal');
          const title = document.getElementById('drilldownTitle');
          const content = document.getElementById('drilldownContent');

          const filtered = analyticsData.rawUpdates.filter(u =>
            u.sector === sector && u.authority === authority
          );

          title.textContent = sector + ' × ' + authority + ' (' + filtered.length + ' publications)';

          if (filtered.length === 0) {
            content.innerHTML = '<div class="drilldown-empty">No publications found</div>';
          } else {
            content.innerHTML = filtered.slice(0, 50).map(update => {
              const date = update.published_date ? new Date(update.published_date).toLocaleDateString('en-GB') : 'Unknown';
              return '<div class="drilldown-item">' +
                '<div class="drilldown-item-title">' + escapeHtml(update.title || 'Untitled') + '</div>' +
                '<div class="drilldown-item-meta">' +
                  '<span>' + escapeHtml(update.authority || 'Unknown') + '</span>' +
                  '<span>' + date + '</span>' +
                  '<span>' + escapeHtml(update.impact_level || 'Unknown') + '</span>' +
                  (update.source_url ? '<a href="' + escapeHtml(update.source_url) + '" target="_blank">View</a>' : '') +
                '</div>' +
              '</div>';
            }).join('');
          }

          modal.classList.add('active');
        }

        // Drilldown modal functions
        function showDrilldown(type, value, data) {
          const modal = document.getElementById('drilldownModal');
          const title = document.getElementById('drilldownTitle');
          const content = document.getElementById('drilldownContent');

          // Filter updates based on type
          let filteredUpdates = [];
          let titleText = '';

          if (type === 'month') {
            titleText = 'Publications for ' + formatMonth(value);
            const [year, month] = value.split('-');
            filteredUpdates = analyticsData.rawUpdates.filter(u => {
              if (!u.published_date) return false;
              const d = new Date(u.published_date);
              return d.getFullYear() === parseInt(year) && (d.getMonth() + 1) === parseInt(month);
            });
          } else if (type === 'authority') {
            titleText = 'Publications by ' + value;
            filteredUpdates = analyticsData.rawUpdates.filter(u => u.authority === value);
          } else if (type === 'sector') {
            titleText = 'Publications in ' + value + ' Sector';
            filteredUpdates = analyticsData.rawUpdates.filter(u => u.sector === value);
          } else if (type === 'impact') {
            const displayLevel = value.charAt(0).toUpperCase() + value.slice(1);
            titleText = displayLevel + ' Impact Publications';
            filteredUpdates = analyticsData.rawUpdates.filter(u => {
              const level = normalizeImpactLevel(u.impact_level);
              return level === value;
            });
          }

          title.textContent = titleText + ' (' + filteredUpdates.length + ')';

          if (filteredUpdates.length === 0) {
            content.innerHTML = '<div class="drilldown-empty">No publications found</div>';
          } else {
            content.innerHTML = filteredUpdates.slice(0, 50).map(update => {
              const date = update.published_date ? new Date(update.published_date).toLocaleDateString('en-GB') : 'Unknown date';
              return '<div class="drilldown-item">' +
                '<div class="drilldown-item-title">' + escapeHtml(update.title) + '</div>' +
                '<div class="drilldown-item-meta">' +
                  '<span>' + escapeHtml(update.authority || 'Unknown') + '</span>' +
                  '<span>' + date + '</span>' +
                  '<span>' + escapeHtml(update.sector || 'General') + '</span>' +
                  (update.source_url ? '<a href="' + escapeHtml(update.source_url) + '" target="_blank">View Source</a>' : '') +
                '</div>' +
              '</div>';
            }).join('');

            if (filteredUpdates.length > 50) {
              content.innerHTML += '<div class="drilldown-empty">Showing 50 of ' + filteredUpdates.length + ' publications</div>';
            }
          }

          modal.classList.add('active');
        }

        function closeDrilldown() {
          document.getElementById('drilldownModal').classList.remove('active');
        }

        function normalizeImpactLevel(rawImpact) {
          if (!rawImpact) return 'medium';
          const impact = String(rawImpact).toLowerCase().trim();
          if (['high', 'significant', 'critical', 'severe'].includes(impact)) return 'high';
          if (['low', 'informational', 'minor', 'negligible'].includes(impact)) return 'low';
          return 'medium';
        }

        function formatMonth(monthStr) {
          const [year, month] = monthStr.split('-');
          return new Date(year, month - 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
        }

        function escapeHtml(str) {
          if (!str) return '';
          const div = document.createElement('div');
          div.textContent = str;
          return div.innerHTML;
        }

        // Export functionality
        function exportData(type) {
          const endpoints = {
            csv: '/api/analytics/export/csv',
            excel: '/api/analytics/export/excel',
            summary: '/api/analytics/export/summary'
          };

          const url = endpoints[type];
          if (!url) return;

          // Show loading state on button
          const btn = event.target.closest('.export-btn');
          const originalText = btn.innerHTML;
          btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12"/></svg> Exporting...';
          btn.disabled = true;

          // Trigger download
          const link = document.createElement('a');
          link.href = url;
          link.click();

          // Reset button after delay
          setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
          }, 2000);
        }
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
