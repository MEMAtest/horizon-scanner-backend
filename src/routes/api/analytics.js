const dbService = require('../../services/dbService')
const predictiveIntelligenceService = require('../../services/predictiveIntelligenceService')
const XLSX = require('xlsx')

function registerAnalyticsRoutes(router) {
  router.get('/analytics', async (req, res) => {
  try {
    console.log('Analytics API: Getting analytics dashboard...')

    let firmProfile = null
    if (req.query.profile) {
      try {
        firmProfile = JSON.parse(req.query.profile)
      } catch (parseError) {
        console.warn('Analytics Invalid profile query parameter, ignoring:', parseError.message)
      }
    }

    const dashboard = await predictiveIntelligenceService.getPredictiveDashboard(firmProfile)

    res.json({
      success: true,
      dashboard,
      source: 'predictive',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('X Predictive analytics error:', error)

    const emptyDashboard = {
      overview: { totalUpdates: 0, averageRiskScore: 0, activePredictions: 0, hotspotCount: 0 },
      velocity: {},
      hotspots: [],
      predictions: []
    }

    try {
      const legacyAnalyticsService = require('../../services/analyticsService')
      const legacyDashboard = await legacyAnalyticsService.getAnalyticsDashboard()
      return res.json({
        success: true,
        dashboard: legacyDashboard,
        source: 'legacy',
        warning: 'Predictive analytics temporarily unavailable; served legacy analytics.',
        timestamp: new Date().toISOString()
      })
    } catch (fallbackError) {
      console.warn('Analytics Legacy analytics fallback unavailable:', fallbackError.message)
    }

    res.status(503).json({
      success: false,
      error: 'Predictive analytics unavailable',
      dashboard: emptyDashboard,
      source: 'none',
      timestamp: new Date().toISOString()
    })
  }
  })

  router.get('/analytics/dashboard', async (req, res) => {
  try {
    console.log('Analytics API: Getting dashboard analytics')

    const stats = await dbService.getDashboardStatistics()
    const filterOptions = await dbService.getFilterOptions()

    res.json({
      success: true,
      statistics: stats,
      filterOptions,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('X API Error getting dashboard analytics:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      statistics: null
    })
  }
  })

  router.get('/analytics/impact-distribution', async (req, res) => {
  try {
    console.log('Analytics API: Getting impact distribution analytics')

    const updates = await dbService.getEnhancedUpdates({
      range: req.query.period || 'month',
      limit: 500
    })

    const distribution = calculateImpactDistribution(updates)

    res.json({
      success: true,
      distribution,
      sourceUpdates: updates.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('X API Error getting impact distribution:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      distribution: null
    })
  }
  })

  router.get('/analytics/preview', async (req, res) => {
  try {
    const updates = await dbService.getAllUpdates()

    const analytics = {
      totalUpdates: updates.length,
      averageRiskScore: 5.2,
      topSectors: ['Banking', 'Investment Management', 'Insurance'],
      recentTrends: ['Increasing enforcement activity', 'Focus on consumer protection']
    }

    res.json({
      success: true,
      analytics,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Analytics preview error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to load analytics preview',
      details: error.message
    })
  }
  })

  router.post('/analytics/refresh', async (req, res) => {
  try {
    const updates = await dbService.getAllUpdates()
    res.json({
      success: true,
      message: 'Analytics refreshed successfully',
      dashboard: {
        totalUpdates: updates.length,
        averageRiskScore: 5.2
      }
    })
  } catch (error) {
    console.error('Analytics refresh error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to refresh analytics',
      details: error.message
    })
  }
  })

  // Export regulatory updates as CSV
  router.get('/analytics/export/csv', async (req, res) => {
    try {
      console.log('Analytics API: Exporting updates as CSV')

      const updates = await dbService.getEnhancedUpdates({ limit: 10000 })

      // Build CSV content
      const headers = [
        'Title',
        'Authority',
        'Published Date',
        'Impact Level',
        'Sector',
        'Document Type',
        'Summary',
        'URL'
      ]

      const rows = updates.map(update => [
        escapeCsvField(update.title),
        escapeCsvField(update.authority),
        update.published_date ? new Date(update.published_date).toISOString().split('T')[0] : '',
        escapeCsvField(update.impact_level || 'Medium'),
        escapeCsvField(update.sector || ''),
        escapeCsvField(update.document_type || ''),
        escapeCsvField(update.ai_summary || update.summary || ''),
        escapeCsvField(update.source_url || '')
      ])

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename=regulatory_updates_${new Date().toISOString().split('T')[0]}.csv`)
      res.send(csv)
    } catch (error) {
      console.error('CSV export error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to export CSV',
        details: error.message
      })
    }
  })

  // Export regulatory updates as Excel
  router.get('/analytics/export/excel', async (req, res) => {
    try {
      console.log('Analytics API: Exporting updates as Excel')

      const updates = await dbService.getEnhancedUpdates({ limit: 10000 })

      // Prepare data for Excel
      const data = updates.map(update => ({
        'Title': update.title || '',
        'Authority': update.authority || '',
        'Published Date': update.published_date ? new Date(update.published_date).toISOString().split('T')[0] : '',
        'Impact Level': update.impact_level || 'Medium',
        'Sector': update.sector || '',
        'Document Type': update.document_type || '',
        'Summary': update.ai_summary || update.summary || '',
        'URL': update.source_url || ''
      }))

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(data)

      // Set column widths
      ws['!cols'] = [
        { wch: 50 },  // Title
        { wch: 20 },  // Authority
        { wch: 12 },  // Date
        { wch: 12 },  // Impact
        { wch: 20 },  // Sector
        { wch: 15 },  // Doc Type
        { wch: 60 },  // Summary
        { wch: 40 }   // URL
      ]

      XLSX.utils.book_append_sheet(wb, ws, 'Regulatory Updates')

      // Generate buffer
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      res.setHeader('Content-Disposition', `attachment; filename=regulatory_updates_${new Date().toISOString().split('T')[0]}.xlsx`)
      res.send(buffer)
    } catch (error) {
      console.error('Excel export error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to export Excel',
        details: error.message
      })
    }
  })

  // Export analytics summary as Excel
  router.get('/analytics/export/summary', async (req, res) => {
    try {
      console.log('Analytics API: Exporting analytics summary as Excel')

      const updates = await dbService.getEnhancedUpdates({ limit: 10000 })

      // Calculate analytics
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      // Authority stats
      const authorityStats = {}
      const sectorStats = {}
      const impactStats = { High: 0, Medium: 0, Low: 0 }
      const monthlyStats = {}

      updates.forEach(update => {
        // Authority
        const auth = update.authority || 'Unknown'
        if (!authorityStats[auth]) authorityStats[auth] = { total: 0, recent: 0 }
        authorityStats[auth].total++
        if (new Date(update.published_date) >= thirtyDaysAgo) authorityStats[auth].recent++

        // Sector
        const sector = update.sector || 'General'
        if (!sectorStats[sector]) sectorStats[sector] = { total: 0, recent: 0 }
        sectorStats[sector].total++
        if (new Date(update.published_date) >= thirtyDaysAgo) sectorStats[sector].recent++

        // Impact
        const impact = normalizeImpact(update.impact_level)
        impactStats[impact]++

        // Monthly
        const date = new Date(update.published_date || update.created_at)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (!monthlyStats[monthKey]) monthlyStats[monthKey] = 0
        monthlyStats[monthKey]++
      })

      // Create workbook
      const wb = XLSX.utils.book_new()

      // Summary sheet
      const summaryData = [
        { Metric: 'Total Publications', Value: updates.length },
        { Metric: 'Last 30 Days', Value: updates.filter(u => new Date(u.published_date) >= thirtyDaysAgo).length },
        { Metric: 'High Impact', Value: impactStats.High },
        { Metric: 'Medium Impact', Value: impactStats.Medium },
        { Metric: 'Low Impact', Value: impactStats.Low },
        { Metric: 'Active Regulators', Value: Object.keys(authorityStats).length },
        { Metric: 'Active Sectors', Value: Object.keys(sectorStats).length }
      ]
      const summaryWs = XLSX.utils.json_to_sheet(summaryData)
      summaryWs['!cols'] = [{ wch: 20 }, { wch: 15 }]
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary')

      // Authorities sheet
      const authData = Object.entries(authorityStats)
        .sort((a, b) => b[1].total - a[1].total)
        .map(([name, stats]) => ({ Authority: name, 'Total Publications': stats.total, 'Last 30 Days': stats.recent }))
      const authWs = XLSX.utils.json_to_sheet(authData)
      authWs['!cols'] = [{ wch: 30 }, { wch: 18 }, { wch: 15 }]
      XLSX.utils.book_append_sheet(wb, authWs, 'By Authority')

      // Sectors sheet
      const sectorData = Object.entries(sectorStats)
        .sort((a, b) => b[1].total - a[1].total)
        .map(([name, stats]) => ({ Sector: name, 'Total Publications': stats.total, 'Last 30 Days': stats.recent }))
      const sectorWs = XLSX.utils.json_to_sheet(sectorData)
      sectorWs['!cols'] = [{ wch: 30 }, { wch: 18 }, { wch: 15 }]
      XLSX.utils.book_append_sheet(wb, sectorWs, 'By Sector')

      // Monthly trends sheet
      const monthlyData = Object.entries(monthlyStats)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-12)
        .map(([month, count]) => ({ Month: month, Publications: count }))
      const monthlyWs = XLSX.utils.json_to_sheet(monthlyData)
      monthlyWs['!cols'] = [{ wch: 12 }, { wch: 12 }]
      XLSX.utils.book_append_sheet(wb, monthlyWs, 'Monthly Trends')

      // Generate buffer
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      res.setHeader('Content-Disposition', `attachment; filename=regulatory_analytics_summary_${new Date().toISOString().split('T')[0]}.xlsx`)
      res.send(buffer)
    } catch (error) {
      console.error('Summary export error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to export summary',
        details: error.message
      })
    }
  })
}

function calculateImpactDistribution(updates) {
  const distribution = {
    byLevel: { Significant: 0, Moderate: 0, Informational: 0 },
    byScore: {},
    byAuthority: {},
    bySector: {},
    timeline: []
  }

  updates.forEach(update => {
    const level = update.impactLevel || 'Informational'
    distribution.byLevel[level] = (distribution.byLevel[level] || 0) + 1

    const score = update.business_impact_score || 0
    const scoreRange = `${Math.floor(score)}-${Math.floor(score) + 1}`
    distribution.byScore[scoreRange] = (distribution.byScore[scoreRange] || 0) + 1

    const authority = update.authority
    if (!distribution.byAuthority[authority]) {
      distribution.byAuthority[authority] = { total: 0, highImpact: 0 }
    }
    distribution.byAuthority[authority].total++
    if (level === 'Significant' || score >= 7) {
      distribution.byAuthority[authority].highImpact++
    }

    const sectors = update.firm_types_affected || update.primarySectors || []
    sectors.forEach(sector => {
      if (!distribution.bySector[sector]) {
        distribution.bySector[sector] = { total: 0, avgImpact: 0 }
      }
      distribution.bySector[sector].total++
      distribution.bySector[sector].avgImpact += score
    })
  })

  Object.keys(distribution.bySector).forEach(sector => {
    const data = distribution.bySector[sector]
    data.avgImpact = data.total > 0 ? data.avgImpact / data.total : 0
  })

  return distribution
}

// Helper to escape CSV fields
function escapeCsvField(field) {
  if (!field) return ''
  const str = String(field)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

// Helper to normalize impact level
function normalizeImpact(rawImpact) {
  if (!rawImpact) return 'Medium'
  const impact = String(rawImpact).toLowerCase().trim()
  if (['high', 'significant', 'critical', 'severe'].includes(impact)) return 'High'
  if (['low', 'informational', 'minor', 'negligible'].includes(impact)) return 'Low'
  return 'Medium'
}

module.exports = registerAnalyticsRoutes
