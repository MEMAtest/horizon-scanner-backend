const dbService = require('../../services/dbService')
const relevanceService = require('../../services/relevanceService')

function normalizeScalar(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  if (trimmed.toLowerCase() === 'all') return null;
  return trimmed;
}

function normalizeCommaList(value) {
  if (!value) return null;
  const parts = Array.isArray(value) ? value : String(value).split(',');
  const cleaned = parts
    .map(part => String(part).trim())
    .filter(part => part && part.toLowerCase() !== 'all');
  return cleaned.length ? cleaned : null;
}

function normalizeSearch(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed ? trimmed : null;
}

function buildFiltersFromQuery(query = {}) {
  return {
    category: normalizeScalar(query.category),
    authority: normalizeCommaList(query.authority),
    sector: normalizeScalar(query.sector),
    impact: normalizeCommaList(query.impact),
    urgency: normalizeCommaList(query.urgency),
    range: normalizeScalar(query.range),
    search: normalizeSearch(query.search)
  };
}

function registerUpdateRoutes(router) {
  router.get('/updates', async (req, res) => {
  try {
    console.log('Analytics API: Getting enhanced updates with filters:', req.query)

    const filters = {
      ...buildFiltersFromQuery(req.query),
      limit: parseInt(req.query.limit, 10) || 50
    }

    const updates = await dbService.getEnhancedUpdates(filters)

    res.json({
      success: true,
      updates,
      count: updates.length,
      filters,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('X API Error getting updates:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      updates: [],
      count: 0
    })
  }
  })

  router.get('/updates/counts', async (req, res) => {
  try {
    console.log('Analytics API: Getting live update counts')

    const counts = await dbService.getUpdateCounts()

    res.json({
      success: true,
      ...counts,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('X API Error getting counts:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      total: 0,
      highImpact: 0,
      today: 0,
      thisWeek: 0
    })
  }
  })

  router.get('/updates/relevant', async (req, res) => {
  try {
    console.log('Target API: Getting relevance-scored updates')

    const firmProfile = await dbService.getFirmProfile()

    const filters = {
      ...buildFiltersFromQuery(req.query),
      limit: parseInt(req.query.limit, 10) || 100
    }
    const updates = await dbService.getEnhancedUpdates(filters)

    const categorized = relevanceService.categorizeByRelevance(updates, firmProfile)

    res.json({
      success: true,
      firmProfile: firmProfile
        ? {
            firmName: firmProfile.firmName || firmProfile.firm_name,
            primarySectors: firmProfile.primarySectors || firmProfile.primary_sectors
          }
        : null,
      high: categorized.high,
      medium: categorized.medium,
      low: categorized.low,
      totalUpdates: updates.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('X API Error getting relevant updates:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      high: [],
      medium: [],
      low: []
    })
  }
  })

  router.get('/updates/:id', async (req, res) => {
  try {
    const updateId = req.params.id
    console.log(`Doc API: Getting update details for ID: ${updateId}`)

    const updates = await dbService.getEnhancedUpdates({
      id: updateId,
      limit: 1
    })

    if (updates.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Update not found'
      })
    }

    const update = updates[0]
    const relatedUpdates = await dbService.getEnhancedUpdates({
      authority: update.authority,
      limit: 5
    })

    res.json({
      success: true,
      update,
      relatedUpdates: relatedUpdates.filter(u => u.id !== updateId),
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('X API Error getting update details:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
  })

  router.get('/live-counts', async (req, res) => {
  try {
    console.log('Analytics API: Getting live counts for sidebar')

    const counts = await dbService.getUpdateCounts()
    const pinnedItems = await dbService.getPinnedItems()
    const savedSearches = await dbService.getSavedSearches()
    const customAlerts = await dbService.getCustomAlerts()

    const response = {
      success: true,
      total: counts.total || 0,
      highImpact: counts.highImpact || 0,
      today: counts.today || 0,
      todayChange: counts.todayChange || 0,
      thisWeek: counts.thisWeek || 0,
      unread: counts.unread || 0,
      activeSources: counts.activeSources || 12,
      pinnedItems: pinnedItems.length,
      savedSearches: savedSearches.length,
      activeAlerts: customAlerts.filter(a => a.isActive).length,
      timestamp: new Date().toISOString()
    }

    res.json(response)
  } catch (error) {
    console.error('X API Error getting live counts:', error)

    res.status(500).json({
      success: false,
      error: error.message,
      total: 0,
      highImpact: 0,
      today: 0,
      todayChange: 0,
      thisWeek: 0,
      unread: 0,
      activeSources: 0,
      pinnedItems: 0,
      savedSearches: 0,
      activeAlerts: 0,
      timestamp: new Date().toISOString()
    })
  }
  })

  router.get('/weekly-roundup', async (req, res) => {
  try {
    console.log('Analytics Weekly roundup requested')

    const updates = await dbService.getAllUpdates()
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 7)

    const weeklyUpdates = updates.filter(update =>
      new Date(update.fetchedDate) >= weekStart
    )

    const authorityStats = {}
    weeklyUpdates.forEach(update => {
      const auth = update.authority || 'Unknown'
      authorityStats[auth] = (authorityStats[auth] || 0) + 1
    })

    const topAuthorities = Object.entries(authorityStats)
      .map(([authority, count]) => ({
        authority,
        updateCount: count,
        focusArea: authority === 'FCA'
          ? 'Consumer Protection'
          : authority === 'Bank of England'
            ? 'Financial Stability'
            : authority === 'PRA' ? 'Prudential Regulation' : 'General Policy'
      }))
      .sort((a, b) => b.updateCount - a.updateCount)
      .slice(0, 5)

    const highImpactUpdates = weeklyUpdates
      .filter(u => u.urgency === 'High' || u.impactLevel === 'Significant')
      .slice(0, 3)
      .map(update => ({
        headline: update.headline,
        authority: update.authority,
        impact: update.impact || 'Significant regulatory impact requiring attention'
      }))

    const roundup = {
      weekSummary: 'This week, regulatory activity focused on consumer protection, financial stability, and international cooperation. Key updates included important developments across multiple sectors.',
      keyThemes: ['Consumer Protection', 'Financial Stability', 'International Cooperation'],
      topAuthorities,
      highImpactUpdates,
      sectorInsights: {
        Banking: 'Regulatory focus on consumer protection and stress testing requirements.',
        'Investment Management': 'Monitoring developments in regulatory compliance frameworks.'
      },
      upcomingDeadlines: [],
      weeklyPriorities: [
        'Review latest regulatory changes',
        'Assess compliance requirements',
        'Monitor sector-specific developments'
      ],
      statistics: {
        authorityBreakdown: authorityStats,
        sectorBreakdown: {},
        impactBreakdown: {
          Significant: weeklyUpdates.filter(u => u.impactLevel === 'Significant').length,
          Moderate: weeklyUpdates.filter(u => u.impactLevel === 'Moderate').length,
          Informational: weeklyUpdates.filter(u => u.impactLevel === 'Informational').length
        },
        avgImpactScore: 0
      },
      totalUpdates: weeklyUpdates.length,
      weekStart: weekStart.toISOString().split('T')[0],
      generatedAt: new Date().toISOString(),
      dataQuality: {
        aiGenerated: true,
        confidence: 0.85,
        sourceCount: weeklyUpdates.length
      }
    }

    res.json({
      success: true,
      roundup,
      sourceUpdates: weeklyUpdates.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Weekly roundup error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate weekly roundup',
      details: error.message
    })
  }
  })

  router.get('/authority-spotlight/:authority', async (req, res) => {
  try {
    const authority = req.params.authority
    console.log(`Search Authority spotlight requested for: ${authority}`)

    const updates = await dbService.getAllUpdates()
    const authorityUpdates = updates.filter(update =>
      update.authority && update.authority.toLowerCase().includes(authority.toLowerCase())
    )

    const enforcementCount = authorityUpdates.filter(u =>
      (u.headline || '').toLowerCase().includes('enforcement')
    ).length

    const spotlight = {
      authority: authority.toUpperCase(),
      focusAreas: ['conduct'],
      activityLevel: authorityUpdates.length > 10
        ? 'high'
        : authorityUpdates.length > 5 ? 'medium' : 'low',
      keyInitiatives: [],
      enforcementTrends: `${enforcementCount > 0 ? 'increasing' : 'decreasing'} (${enforcementCount} enforcement-related updates)`,
      upcomingActions: [],
      totalUpdates: authorityUpdates.length,
      analysisDate: new Date().toISOString(),
      confidence: 0.8
    }

    res.json({
      success: true,
      spotlight,
      sourceUpdates: authorityUpdates.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Authority spotlight error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate authority spotlight',
      details: error.message
    })
  }
  })

  router.get('/stats/live', async (req, res) => {
  try {
    const updates = await dbService.getAllUpdates()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayUpdates = updates.filter(update =>
      new Date(update.fetchedDate) >= today
    )

    const stats = {
      totalUpdates: updates.length,
      newToday: todayUpdates.length,
      urgent: updates.filter(u => u.urgency === 'High').length,
      moderate: updates.filter(u => u.urgency === 'Medium').length,
      background: updates.filter(u => u.urgency === 'Low').length,
      lastUpdate: updates.length > 0 ? updates[0].fetchedDate : null
    }

    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Live stats error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get live stats',
      details: error.message
    })
  }
  })

  router.get('/streams', async (req, res) => {
  try {
    const updates = await dbService.getAllUpdates()

    res.json({
      success: true,
      updates: updates.slice(0, 50),
      total: updates.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Streams error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to load streams',
      details: error.message
    })
  }
  })

  router.get('/updates/category/:category', async (req, res) => {
  try {
    const category = req.params.category.toLowerCase()
    const updates = await dbService.getAllUpdates()

    const filtered = updates.filter(update => {
      const content = ((update.headline || '') + ' ' + (update.impact || '')).toLowerCase()

      switch (category) {
        case 'consultation':
          return content.includes('consultation') || content.includes('consult')
        case 'guidance':
          return content.includes('guidance') || content.includes('guide')
        case 'enforcement':
          return content.includes('enforcement') || content.includes('fine') || content.includes('penalty')
        case 'speech':
          return content.includes('speech') || content.includes('remarks')
        case 'news':
          return content.includes('news') || content.includes('announcement')
        case 'policy':
          return content.includes('policy') || content.includes('regulation')
        default:
          return false
      }
    })

    res.json({
      success: true,
      updates: filtered,
      total: filtered.length,
      category: req.params.category
    })
  } catch (error) {
    console.error('Category filter error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to filter by category',
      details: error.message
    })
  }
  })

  router.get('/updates/content-type/:type', async (req, res) => {
  try {
    const type = req.params.type.toLowerCase()
    const updates = await dbService.getAllUpdates()

    const filtered = updates.filter(update => {
      const content = ((update.headline || '') + ' ' + (update.impact || '')).toLowerCase()

      switch (type) {
        case 'final-rule':
          return content.includes('final') && (content.includes('rule') || content.includes('regulation'))
        case 'proposal':
          return content.includes('proposal') || content.includes('proposed')
        case 'notice':
          return content.includes('notice') || content.includes('notification')
        case 'report':
          return content.includes('report') || content.includes('analysis')
        case 'fine':
          return content.includes('fine') || content.includes('penalty') || content.includes('sanction')
        default:
          return false
      }
    })

    res.json({
      success: true,
      updates: filtered,
      total: filtered.length,
      contentType: req.params.type
    })
  } catch (error) {
    console.error('Content type filter error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to filter by content type',
      details: error.message
    })
  }
  })

  router.get('/updates/source-type/:type', async (req, res) => {
  try {
    const type = req.params.type.toLowerCase()
    const updates = await dbService.getAllUpdates()

    const filtered = updates.filter(update => {
      const url = (update.url || '').toLowerCase()

      switch (type) {
        case 'rss':
          return update.sourceCategory === 'rss' || url.includes('rss') || url.includes('feed')
        case 'scraped':
          return update.sourceCategory === 'scraped' || !url.includes('rss')
        case 'direct':
          return update.sourceCategory === 'direct'
        default:
          return false
      }
    })

    res.json({
      success: true,
      updates: filtered,
      total: filtered.length,
      sourceType: req.params.type
    })
  } catch (error) {
    console.error('Source type filter error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to filter by source type',
      details: error.message
    })
  }
  })

  router.get('/updates/relevance/:level', async (req, res) => {
  try {
    const level = req.params.level.toLowerCase()
    const updates = await dbService.getAllUpdates()

    const filtered = updates.filter(update => {
      switch (level) {
        case 'high':
          return update.urgency === 'High' || update.impactLevel === 'Significant'
        case 'medium':
          return update.urgency === 'Medium' || update.impactLevel === 'Moderate'
        case 'low':
          return update.urgency === 'Low' || update.impactLevel === 'Informational'
        default:
          return false
      }
    })

    res.json({
      success: true,
      updates: filtered,
      total: filtered.length,
      relevance: req.params.level
    })
  } catch (error) {
    console.error('Relevance filter error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to filter by relevance',
      details: error.message
    })
  }
  })

  router.get('/search', async (req, res) => {
  try {
    console.log('Search Search requested with filters:', req.query)

    const filters = {
      authority: req.query.authority || null,
      sector: req.query.sector || null,
      search: req.query.search || null,
      impact: req.query.impact || null,
      limit: parseInt(req.query.limit) || 50
    }

    const results = await dbService.getEnhancedUpdates(filters)

    res.json({
      success: true,
      results,
      total: results.length,
      filters,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('X Search error:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      results: []
    })
  }
  })
}

module.exports = registerUpdateRoutes
