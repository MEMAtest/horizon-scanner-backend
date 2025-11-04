const dbService = require('../../services/dbService')
const aiAnalyzer = require('../../services/aiAnalyzer')

function registerAiRoutes(router) {
  router.get('/ai/analysis-progress', async (req, res) => {
  try {
    console.log('Analytics API: Getting AI analysis progress')

    const totalUpdates = await dbService.getTotalUpdatesCount()
    const analyzedUpdates = await dbService.getAnalyzedUpdatesCount()

    const progress = totalUpdates > 0 ? (analyzedUpdates / totalUpdates) * 100 : 0

    res.json({
      success: true,
      totalUpdates,
      analyzedUpdates,
      progress: progress.toFixed(2),
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('X API Error getting AI analysis progress:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      totalUpdates: 0,
      analyzedUpdates: 0,
      progress: 0
    })
  }
  })

  router.get('/ai/insights', async (req, res) => {
  try {
    console.log('Brain API: Getting AI insights')

    const limit = parseInt(req.query.limit) || 10
    const insights = await dbService.getRecentAIInsights(limit)

    res.json({
      success: true,
      insights,
      count: insights.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('X API Error getting AI insights:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      insights: []
    })
  }
  })

  router.get('/ai/weekly-roundup', async (req, res) => {
  try {
    console.log('Note API: Generating AI weekly roundup')

    const updates = await dbService.getEnhancedUpdates({
      range: 'week',
      limit: 100
    })

    if (updates.length === 0) {
      return res.json({
        success: true,
        roundup: {
          weekSummary: 'No updates available for this week.',
          keyThemes: [],
          topAuthorities: [],
          highImpactUpdates: [],
          sectorInsights: {},
          upcomingDeadlines: [],
          weeklyPriorities: [],
          totalUpdates: 0,
          generatedAt: new Date().toISOString()
        }
      })
    }

    const roundup = await aiAnalyzer.generateWeeklyRoundup(updates)

    res.json({
      success: true,
      roundup,
      sourceUpdates: updates.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('X API Error generating weekly roundup:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      roundup: null
    })
  }
  })

  router.get('/ai/authority-spotlight/:authority', async (req, res) => {
  try {
    const authority = req.params.authority

    const updates = await dbService.getEnhancedUpdates({
      authority,
      range: 'month',
      limit: 50
    })

    if (updates.length === 0) {
      return res.json({
        success: true,
        spotlight: {
          authority,
          focusAreas: [],
          activityLevel: 'low',
          keyInitiatives: [],
          enforcementTrends: 'No recent activity',
          upcomingActions: [],
          totalUpdates: 0,
          analysisDate: new Date().toISOString()
        }
      })
    }

    const spotlight = await generateAuthoritySpotlight(authority, updates)

    res.json({
      success: true,
      spotlight,
      sourceUpdates: updates.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('X API Error generating authority spotlight:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      spotlight: null
    })
  }
  })

  router.get('/ai/sector-analysis/:sector', async (req, res) => {
  try {
    const sector = req.params.sector
    console.log(`Firm API: Generating sector analysis for: ${sector}`)

    const updates = await dbService.getEnhancedUpdates({
      sector,
      range: 'month',
      limit: 50
    })

    if (updates.length === 0) {
      return res.json({
        success: true,
        analysis: {
          sector,
          regulatoryPressure: 'low',
          keyThemes: [],
          complianceFocus: [],
          businessImpact: 'low',
          recommendations: [],
          totalUpdates: 0,
          analysisDate: new Date().toISOString()
        }
      })
    }

    const analysis = await generateSectorAnalysis(sector, updates)

    res.json({
      success: true,
      analysis,
      sourceUpdates: updates.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('X API Error generating sector analysis:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      analysis: null
    })
  }
  })

  router.get('/ai/trend-analysis', async (req, res) => {
  try {
    console.log('Growth API: Generating trend analysis')

    const period = req.query.period || 'month'
    const limit = parseInt(req.query.limit) || 100

    const updates = await dbService.getEnhancedUpdates({
      range: period,
      limit
    })

    if (updates.length === 0) {
      return res.json({
        success: true,
        trends: {
          period,
          emergingThemes: [],
          authorityActivity: {},
          sectorImpact: {},
          compliancePriorities: [],
          totalUpdates: 0,
          analysisDate: new Date().toISOString()
        }
      })
    }

    const trends = await generateTrendAnalysis(updates, period)

    res.json({
      success: true,
      trends,
      sourceUpdates: updates.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('X API Error generating trend analysis:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      trends: null
    })
  }
  })

  router.get('/ai/early-warnings', async (req, res) => {
  try {
    console.log('Outlook Generating AI early warnings...')

    const updates = await dbService.getAllUpdates()
    const firmProfile = await dbService.getFirmProfile()

    const warnings = await generateEarlyWarnings(updates, firmProfile)

    res.json({
      success: true,
      warnings,
      metadata: {
        generatedAt: new Date().toISOString(),
        firmProfile: !!firmProfile,
        dataPoints: updates.length
      }
    })
  } catch (error) {
    console.error('Error generating early warnings:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      warnings: []
    })
  }
  })
}

async function generateEarlyWarnings(updates, firmProfile) {
  const warnings = []

  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  updates.forEach(update => {
    if (update.keyDates && update.keyDates.includes('deadline')) {
      warnings.push({
        type: 'deadline',
        urgency: 'High',
        title: `Upcoming deadline: ${update.headline}`,
        description: `${update.authority} has a consultation deadline approaching`,
        date: update.keyDates,
        action: 'Review and submit response if applicable',
        url: update.url
      })
    }

    if (update.impactLevel === 'Significant' && update.urgency === 'High') {
      warnings.push({
        type: 'high-impact',
        urgency: 'High',
        title: `High impact regulation: ${update.headline}`,
        description: update.impact,
        sectors: update.primarySectors || [],
        action: 'Immediate review and impact assessment required',
        url: update.url
      })
    }
  })

  const authorityActivity = {}
  updates.forEach(update => {
    if (update.authority) {
      authorityActivity[update.authority] = (authorityActivity[update.authority] || 0) + 1
    }
  })

  Object.entries(authorityActivity).forEach(([authority, count]) => {
    if (count >= 5) {
      warnings.push({
        type: 'authority-activity',
        urgency: 'Medium',
        title: `Increased ${authority} activity`,
        description: `${authority} has published ${count} updates recently, indicating heightened regulatory focus`,
        action: 'Monitor for emerging themes and prepare for potential changes',
        count
      })
    }
  })

  if (firmProfile && firmProfile.primarySectors) {
    firmProfile.primarySectors.forEach(sector => {
      const sectorUpdates = updates.filter(u =>
        u.primarySectors && u.primarySectors.includes(sector)
      )

      if (sectorUpdates.length >= 3) {
        warnings.push({
          type: 'sector-focus',
          urgency: 'Medium',
          title: `Regulatory focus on ${sector}`,
          description: `${sectorUpdates.length} recent updates affecting ${sector} sector`,
          action: 'Review sector-specific compliance requirements',
          updateCount: sectorUpdates.length
        })
      }
    })
  }

  warnings.sort((a, b) => {
    const urgencyOrder = { High: 0, Medium: 1, Low: 2 }
    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
  })

  return warnings.slice(0, 10)
}

async function generateAuthoritySpotlight(authority, updates) {
  console.log(`Authority Generating spotlight analysis for ${authority}`)

  try {
    const activityLevel = updates.length > 20
      ? 'high'
      : updates.length > 10 ? 'moderate' : 'low'

    const focusAreas = extractFocusAreas(updates)
    const enforcementTrends = analyzeEnforcementTrends(updates)
    const keyInitiatives = extractKeyInitiatives(updates)

    return {
      authority,
      focusAreas: focusAreas.slice(0, 5),
      activityLevel,
      keyInitiatives: keyInitiatives.slice(0, 3),
      enforcementTrends,
      upcomingActions: [],
      totalUpdates: updates.length,
      analysisDate: new Date().toISOString(),
      confidence: 0.8
    }
  } catch (error) {
    console.error('Error generating authority spotlight:', error)
    return {
      authority,
      focusAreas: [],
      activityLevel: 'unknown',
      keyInitiatives: [],
      enforcementTrends: 'Analysis unavailable',
      upcomingActions: [],
      totalUpdates: updates.length,
      analysisDate: new Date().toISOString(),
      confidence: 0.3
    }
  }
}

async function generateSectorAnalysis(sector, updates) {
  console.log(`Firm Generating sector analysis for ${sector}`)

  try {
    const highImpactCount = updates.filter(u =>
      u.impactLevel === 'Significant' ||
            u.business_impact_score >= 7
    ).length

    const regulatoryPressure = highImpactCount > updates.length * 0.3
      ? 'high'
      : highImpactCount > updates.length * 0.1 ? 'moderate' : 'low'

    const keyThemes = extractKeyThemes(updates)
    const complianceFocus = extractComplianceFocus(updates)
    const recommendations = generateSectorRecommendations(regulatoryPressure, keyThemes)

    return {
      sector,
      regulatoryPressure,
      keyThemes: keyThemes.slice(0, 5),
      complianceFocus: complianceFocus.slice(0, 5),
      businessImpact: regulatoryPressure === 'high' ? 'significant' : regulatoryPressure,
      recommendations,
      totalUpdates: updates.length,
      analysisDate: new Date().toISOString(),
      confidence: 0.8
    }
  } catch (error) {
    console.error('Error generating sector analysis:', error)
    return {
      sector,
      regulatoryPressure: 'unknown',
      keyThemes: [],
      complianceFocus: [],
      businessImpact: 'unknown',
      recommendations: [],
      totalUpdates: updates.length,
      analysisDate: new Date().toISOString(),
      confidence: 0.3
    }
  }
}

async function generateTrendAnalysis(updates, period) {
  console.log(`Growth Generating trend analysis for ${period} period`)

  try {
    const emergingThemes = extractEmergingThemes(updates)

    const authorityActivity = {}
    updates.forEach(update => {
      const auth = update.authority
      if (!authorityActivity[auth]) {
        authorityActivity[auth] = { count: 0, highImpact: 0 }
      }
      authorityActivity[auth].count++
      if (update.impactLevel === 'Significant' || update.business_impact_score >= 7) {
        authorityActivity[auth].highImpact++
      }
    })

    const sectorImpact = {}
    updates.forEach(update => {
      const sectors = update.firm_types_affected || update.primarySectors || []
      sectors.forEach(sector => {
        if (!sectorImpact[sector]) {
          sectorImpact[sector] = { updates: 0, avgImpact: 0 }
        }
        sectorImpact[sector].updates++
        sectorImpact[sector].avgImpact += update.business_impact_score || 0
      })
    })

    Object.keys(sectorImpact).forEach(sector => {
      sectorImpact[sector].avgImpact =
                sectorImpact[sector].avgImpact / sectorImpact[sector].updates
    })

    return {
      period,
      emergingThemes: emergingThemes.slice(0, 5),
      authorityActivity,
      sectorImpact,
      compliancePriorities: extractCompliancePriorities(updates),
      totalUpdates: updates.length,
      analysisDate: new Date().toISOString(),
      confidence: 0.8
    }
  } catch (error) {
    console.error('Error generating trend analysis:', error)
    return {
      period,
      emergingThemes: [],
      authorityActivity: {},
      sectorImpact: {},
      compliancePriorities: [],
      totalUpdates: updates.length,
      analysisDate: new Date().toISOString(),
      confidence: 0.3
    }
  }
}

function extractFocusAreas(updates) {
  const keywords = {}

  updates.forEach(update => {
    const text = (update.headline + ' ' + (update.summary || update.ai_summary || '')).toLowerCase()

    const focusPatterns = [
      'capital requirements', 'conduct', 'consumer protection', 'market abuse',
      'financial crime', 'operational resilience', 'governance', 'reporting',
      'prudential', 'remuneration', 'data protection', 'competition'
    ]

    focusPatterns.forEach(pattern => {
      if (text.includes(pattern)) {
        keywords[pattern] = (keywords[pattern] || 0) + 1
      }
    })
  })

  return Object.entries(keywords)
    .sort(([, a], [, b]) => b - a)
    .map(([keyword]) => keyword)
}

function analyzeEnforcementTrends(updates) {
  const enforcementKeywords = ['fine', 'penalty', 'enforcement', 'sanction', 'breach']
  const enforcementCount = updates.filter(update => {
    const text = (update.headline + ' ' + (update.summary || update.ai_summary || '')).toLowerCase()
    return enforcementKeywords.some(keyword => text.includes(keyword))
  }).length

  const trend = enforcementCount > updates.length * 0.2
    ? 'increasing'
    : enforcementCount > 0 ? 'stable' : 'decreasing'

  return `${trend} (${enforcementCount} enforcement-related updates)`
}

function extractKeyInitiatives(updates) {
  const initiatives = []

  updates.forEach(update => {
    const text = update.headline.toLowerCase()

    if (text.includes('consultation')) {
      initiatives.push({
        initiative: 'Consultation Process',
        description: 'Active stakeholder engagement on new regulations',
        impact: 'Regulatory development and industry input'
      })
    }

    if (text.includes('guidance') || text.includes('supervisory')) {
      initiatives.push({
        initiative: 'Supervisory Guidance',
        description: 'Enhanced regulatory clarity and expectations',
        impact: 'Improved compliance understanding'
      })
    }

    if (text.includes('review') || text.includes('assessment')) {
      initiatives.push({
        initiative: 'Regulatory Review',
        description: 'Evaluation of existing frameworks',
        impact: 'Potential policy changes and updates'
      })
    }
  })

  return initiatives.slice(0, 3)
}

function extractKeyThemes(updates) {
  const themes = {}

  updates.forEach(update => {
    const text = (update.headline + ' ' + (update.area || '')).toLowerCase()

    const themePatterns = [
      'digital transformation', 'sustainability', 'climate risk', 'crypto',
      'open banking', 'consumer duty', 'operational resilience', 'cyber security',
      'machine learning', 'artificial intelligence', 'brexit', 'international'
    ]

    themePatterns.forEach(theme => {
      if (text.includes(theme.toLowerCase())) {
        themes[theme] = (themes[theme] || 0) + 1
      }
    })
  })

  return Object.entries(themes)
    .sort(([, a], [, b]) => b - a)
    .map(([theme]) => theme)
}

function extractComplianceFocus(updates) {
  const focusAreas = {}

  updates.forEach(update => {
    if (update.area) {
      focusAreas[update.area] = (focusAreas[update.area] || 0) + 1
    }

    if (update.ai_tags) {
      update.ai_tags.forEach(tag => {
        if (tag.startsWith('area:')) {
          const area = tag.replace('area:', '').replace('-', ' ')
          focusAreas[area] = (focusAreas[area] || 0) + 1
        }
      })
    }
  })

  return Object.entries(focusAreas)
    .sort(([, a], [, b]) => b - a)
    .map(([area]) => area)
}

function generateSectorRecommendations(pressure, themes) {
  const recommendations = []

  if (pressure === 'high') {
    recommendations.push('Prioritize compliance review and gap analysis')
    recommendations.push('Consider additional compliance resources')
  }

  if (themes.includes('operational resilience')) {
    recommendations.push('Strengthen operational resilience frameworks')
  }

  if (themes.includes('consumer duty')) {
    recommendations.push('Review customer treatment and outcome monitoring')
  }

  if (themes.includes('digital transformation')) {
    recommendations.push('Assess technology risk management capabilities')
  }

  recommendations.push('Monitor regulatory developments closely')

  return recommendations.slice(0, 4)
}

function extractEmergingThemes(updates) {
  const themes = {}
  const recentUpdates = updates.slice(0, Math.min(50, updates.length))

  recentUpdates.forEach(update => {
    if (update.ai_tags) {
      update.ai_tags.forEach(tag => {
        themes[tag] = (themes[tag] || 0) + 1
      })
    }

    const headline = update.headline.toLowerCase()
    const emergingKeywords = [
      'digital', 'ai', 'machine learning', 'crypto', 'sustainability',
      'climate', 'esg', 'resilience', 'cyber', 'data protection'
    ]

    emergingKeywords.forEach(keyword => {
      if (headline.includes(keyword)) {
        themes[keyword] = (themes[keyword] || 0) + 1
      }
    })
  })

  return Object.entries(themes)
    .sort(([, a], [, b]) => b - a)
    .map(([theme]) => theme)
}

function extractCompliancePriorities(updates) {
  const priorities = []

  const highImpactUpdates = updates.filter(u =>
    u.impactLevel === 'Significant' || u.business_impact_score >= 7
  )

  if (highImpactUpdates.length > 0) {
    priorities.push(`Review ${highImpactUpdates.length} high-impact regulatory changes`)
  }

  const upcomingDeadlines = updates.filter(u => u.compliance_deadline)
  if (upcomingDeadlines.length > 0) {
    priorities.push(`Prepare for ${upcomingDeadlines.length} upcoming compliance deadlines`)
  }

  const enforcementUpdates = updates.filter(u =>
    u.ai_tags && u.ai_tags.includes('type:enforcement')
  )
  if (enforcementUpdates.length > 0) {
    priorities.push(`Learn from ${enforcementUpdates.length} recent enforcement actions`)
  }

  priorities.push('Maintain ongoing regulatory monitoring')

  return priorities.slice(0, 5)
}

module.exports = registerAiRoutes
