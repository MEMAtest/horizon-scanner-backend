const dbService = require('../../services/dbService')
const predictiveIntelligenceService = require('../../services/predictiveIntelligenceService')

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

module.exports = registerAnalyticsRoutes
