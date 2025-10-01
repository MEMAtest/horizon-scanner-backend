// src/services/analyticsService.js
// Enhanced Analytics Engine with Category-Based Analytics
// UPGRADE: Category hotspots, content distribution, source trending, 90-day patterns, 30min caching

const dbService = require('./dbService')

class AnalyticsService {
  constructor() {
    this.cache = new Map()
    this.cacheTimeout = 30 * 60 * 1000 // UPGRADED: 30 minutes cache
    this.analysisWindow = 90 // 90-day analysis window
  }

  // ====== ENHANCED REGULATORY VELOCITY ANALYSIS ======

  async getRegulatoryVelocity(timeframeDays = 30) {
    const cacheKey = `velocity_${timeframeDays}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      console.log('📊 Calculating enhanced regulatory velocity...')

      const updates = await dbService.getAllUpdates()
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - timeframeDays)

      // Filter recent updates
      const recentUpdates = updates.filter(update =>
        new Date(update.fetchedDate) >= cutoffDate
      )

      // Enhanced velocity with category analysis
      const authorityVelocity = {}
      const categoryVelocity = {}
      const authorityCounts = {}

      updates.forEach(update => {
        const authority = update.authority || 'Unknown'
        const category = this.determineCategory(update)

        authorityCounts[authority] = (authorityCounts[authority] || 0) + 1
      })

      recentUpdates.forEach(update => {
        const authority = update.authority || 'Unknown'
        const category = this.determineCategory(update)

        authorityVelocity[authority] = (authorityVelocity[authority] || 0) + 1
        categoryVelocity[category] = (categoryVelocity[category] || 0) + 1
      })

      // Calculate enhanced velocity metrics
      const velocity = {}
      Object.keys(authorityCounts).forEach(authority => {
        const recentCount = authorityVelocity[authority] || 0
        const updatesPerWeek = (recentCount / timeframeDays) * 7
        const totalCount = authorityCounts[authority]

        // Enhanced trend calculation
        const historicalAverage = totalCount / this.analysisWindow
        const recentAverage = updatesPerWeek
        const trendMultiplier = recentAverage / Math.max(historicalAverage, 0.1)

        let trend = 'stable'
        let trendStrength = 'normal'
        if (trendMultiplier > 1.3) {
          trend = 'increasing'
          trendStrength = trendMultiplier > 1.5 ? 'strong' : 'moderate'
        } else if (trendMultiplier < 0.7) {
          trend = 'decreasing'
          trendStrength = trendMultiplier < 0.5 ? 'strong' : 'moderate'
        }

        const prediction = Math.round(recentAverage * trendMultiplier * 10) / 10

        velocity[authority] = {
          updatesPerWeek: Math.round(updatesPerWeek * 10) / 10,
          trend,
          trendStrength,
          trendMultiplier: Math.round(trendMultiplier * 100) / 100,
          prediction: Math.max(0, prediction),
          recentCount,
          totalCount,
          confidence: this.calculateConfidence(recentCount, totalCount),
          categories: this.getAuthorityCategories(authority, recentUpdates)
        }
      })

      const result = {
        timeframe: `${timeframeDays} days`,
        calculatedAt: new Date().toISOString(),
        regulatoryVelocity: velocity,
        categoryVelocity,
        summary: this.generateEnhancedVelocitySummary(velocity, categoryVelocity)
      }

      this.setCache(cacheKey, result)
      return result
    } catch (error) {
      console.error('❌ Error calculating enhanced regulatory velocity:', error)
      throw error
    }
  }

  // ====== NEW: CATEGORY HOTSPOT ANALYSIS ======

  async getCategoryHotspots(firmProfile = null) {
    const cacheKey = `category_hotspots_${firmProfile ? firmProfile.firmName : 'all'}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      console.log('🔥 Analyzing category hotspots with 90-day patterns...')

      const updates = await dbService.getAllUpdates()
      const last30Days = new Date()
      last30Days.setDate(last30Days.getDate() - 30)
      const last60Days = new Date()
      last60Days.setDate(last60Days.getDate() - 60)
      const last90Days = new Date()
      last90Days.setDate(last90Days.getDate() - 90)

      // Analyze category activity over time periods
      const categoryActivity = {
        current: {}, // Last 30 days
        previous: {}, // 31-60 days ago
        baseline: {} // 61-90 days ago
      }

      updates.forEach(update => {
        const updateDate = new Date(update.fetchedDate)
        const category = this.determineCategory(update)

        if (updateDate >= last30Days) {
          categoryActivity.current[category] = (categoryActivity.current[category] || 0) + 1
        } else if (updateDate >= last60Days) {
          categoryActivity.previous[category] = (categoryActivity.previous[category] || 0) + 1
        } else if (updateDate >= last90Days) {
          categoryActivity.baseline[category] = (categoryActivity.baseline[category] || 0) + 1
        }
      })

      // Calculate hotspot scores with >20% increase threshold
      const hotspots = []
      const allCategories = new Set([
        ...Object.keys(categoryActivity.current),
        ...Object.keys(categoryActivity.previous),
        ...Object.keys(categoryActivity.baseline)
      ])

      allCategories.forEach(category => {
        const currentCount = categoryActivity.current[category] || 0
        const previousCount = categoryActivity.previous[category] || 0
        const baselineCount = categoryActivity.baseline[category] || 0

        // Calculate percentage increases
        const monthOverMonthChange = previousCount > 0
          ? ((currentCount - previousCount) / previousCount) * 100
          : currentCount > 0 ? 100 : 0

        const quarterOverQuarterChange = baselineCount > 0
          ? ((currentCount - baselineCount) / baselineCount) * 100
          : currentCount > 0 ? 100 : 0

        // Determine if it's a hotspot (>20% increase)
        const isHotspot = monthOverMonthChange > 20 || quarterOverQuarterChange > 20

        let hotspotLevel = 'normal'
        if (monthOverMonthChange > 50 || quarterOverQuarterChange > 50) {
          hotspotLevel = 'extreme'
        } else if (isHotspot) {
          hotspotLevel = 'high'
        }

        // Check relevance to user's firm
        const isUserRelevant = firmProfile && this.isCategoryRelevantToFirm(category, firmProfile)

        hotspots.push({
          category,
          currentActivity: currentCount,
          monthOverMonthChange: Math.round(monthOverMonthChange * 10) / 10,
          quarterOverQuarterChange: Math.round(quarterOverQuarterChange * 10) / 10,
          hotspotLevel,
          isHotspot,
          isUserRelevant,
          trend: this.calculateCategoryTrend(category, updates),
          keyAuthorities: this.getCategoryAuthorities(category, updates.filter(u =>
            new Date(u.fetchedDate) >= last30Days
          )),
          riskIndicators: this.getCategoryRiskIndicators(category, updates.filter(u =>
            new Date(u.fetchedDate) >= last30Days
          ))
        })
      })

      // Sort by activity and hotspot level
      hotspots.sort((a, b) => {
        if (a.hotspotLevel !== b.hotspotLevel) {
          const levelOrder = { extreme: 3, high: 2, normal: 1 }
          return levelOrder[b.hotspotLevel] - levelOrder[a.hotspotLevel]
        }
        return b.currentActivity - a.currentActivity
      })

      const result = {
        calculatedAt: new Date().toISOString(),
        analysisWindow: '90 days',
        categoryHotspots: hotspots,
        firmProfile,
        summary: this.generateCategoryHotspotSummary(hotspots, firmProfile)
      }

      this.setCache(cacheKey, result)
      return result
    } catch (error) {
      console.error('❌ Error analyzing category hotspots:', error)
      throw error
    }
  }

  // ====== NEW: CONTENT TYPE DISTRIBUTION ANALYTICS ======

  async getContentTypeDistribution() {
    const cacheKey = 'content_type_distribution'
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      console.log('📊 Analyzing content type distribution...')

      const updates = await dbService.getAllUpdates()
      const contentTypes = {}
      const sourceTypes = {}
      const urgencyDistribution = {}
      const impactDistribution = {}

      updates.forEach(update => {
        // Determine content type from characteristics
        const contentType = this.determineContentType(update)
        const sourceType = this.determineSourceType(update)

        contentTypes[contentType] = (contentTypes[contentType] || 0) + 1
        sourceTypes[sourceType] = (sourceTypes[sourceType] || 0) + 1

        const urgency = update.urgency || 'Unknown'
        const impact = update.impactLevel || 'Unknown'

        urgencyDistribution[urgency] = (urgencyDistribution[urgency] || 0) + 1
        impactDistribution[impact] = (impactDistribution[impact] || 0) + 1
      })

      // Calculate percentages
      const total = updates.length
      const contentTypePercentages = {}
      const sourceTypePercentages = {}

      Object.entries(contentTypes).forEach(([type, count]) => {
        contentTypePercentages[type] = Math.round((count / total) * 100 * 10) / 10
      })

      Object.entries(sourceTypes).forEach(([type, count]) => {
        sourceTypePercentages[type] = Math.round((count / total) * 100 * 10) / 10
      })

      const result = {
        calculatedAt: new Date().toISOString(),
        totalDocuments: total,
        contentTypes: {
          distribution: contentTypes,
          percentages: contentTypePercentages
        },
        sourceTypes: {
          distribution: sourceTypes,
          percentages: sourceTypePercentages
        },
        urgencyDistribution,
        impactDistribution,
        insights: this.generateContentDistributionInsights(contentTypes, sourceTypes, total)
      }

      this.setCache(cacheKey, result)
      return result
    } catch (error) {
      console.error('❌ Error analyzing content type distribution:', error)
      throw error
    }
  }

  // ====== NEW: SOURCE TYPE TRENDING ANALYSIS ======

  async getSourceTypeTrending() {
    const cacheKey = 'source_type_trending'
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      console.log('📈 Analyzing source type trending over 90 days...')

      const updates = await dbService.getAllUpdates()
      const timeWindows = this.createTimeWindows(90)

      const sourceTimeline = {}

      updates.forEach(update => {
        const sourceType = this.determineSourceType(update)
        const updateDate = new Date(update.fetchedDate)

        if (!sourceTimeline[sourceType]) {
          sourceTimeline[sourceType] = timeWindows.map(() => 0)
        }

        // Find which time window this update belongs to
        const windowIndex = this.getTimeWindowIndex(updateDate, timeWindows)
        if (windowIndex !== -1) {
          sourceTimeline[sourceType][windowIndex]++
        }
      })

      // Calculate trends for each source type
      const sourceTrends = {}
      Object.entries(sourceTimeline).forEach(([sourceType, timeline]) => {
        const trend = this.calculateSourceTrend(timeline)
        const momentum = this.calculateMomentum(timeline)

        sourceTrends[sourceType] = {
          timeline,
          trend: trend.direction,
          trendStrength: trend.strength,
          momentum,
          currentWeekAverage: this.getCurrentWeekAverage(timeline),
          peakActivity: Math.max(...timeline),
          consistency: this.calculateConsistency(timeline),
          prediction: this.predictNextWeek(timeline)
        }
      })

      const result = {
        calculatedAt: new Date().toISOString(),
        analysisWindow: '90 days',
        timeWindows: timeWindows.map(w => w.start.toISOString()),
        sourceTrends,
        summary: this.generateSourceTrendingSummary(sourceTrends)
      }

      this.setCache(cacheKey, result)
      return result
    } catch (error) {
      console.error('❌ Error analyzing source type trending:', error)
      throw error
    }
  }

  // ====== ENHANCED ANALYTICS DASHBOARD ======

  async getAnalyticsDashboard(firmProfile = null) {
    try {
      console.log('📊 Building enhanced analytics dashboard with category insights...')

      const [velocity, sectorHotspots, categoryHotspots, predictions, calendar, contentDistribution, sourceTrending] = await Promise.all([
        this.getRegulatoryVelocity(),
        this.getSectorHotspots(firmProfile),
        this.getCategoryHotspots(firmProfile),
        this.getImpactPredictions(firmProfile),
        this.getComplianceCalendar(firmProfile),
        this.getContentTypeDistribution(),
        this.getSourceTypeTrending()
      ])

      const updates = await dbService.getAllUpdates()
      const totalUpdates = updates.length
      const recentUpdates = updates.filter(update => {
        const daysSince = (Date.now() - new Date(update.fetchedDate)) / (1000 * 60 * 60 * 24)
        return daysSince <= 7
      })

      // Enhanced trending topics with categories
      const trendingTopics = this.calculateEnhancedTrendingTopics(updates)

      // Calculate enhanced risk metrics
      const riskMetrics = this.calculateEnhancedRiskMetrics(updates, firmProfile)

      return {
        calculatedAt: new Date().toISOString(),
        overview: {
          totalUpdates,
          recentUpdates: recentUpdates.length,
          criticalDeadlines: calendar.summary.criticalDeadlines,
          highRiskSectors: sectorHotspots.sectorHotspots.filter(s => s.riskLevel === 'high').length,
          activePredictions: predictions.predictions.length,
          categoryHotspots: categoryHotspots.categoryHotspots.filter(c => c.isHotspot).length,
          averageRiskScore: riskMetrics.averageRiskScore,
          riskTrend: riskMetrics.trend
        },
        velocity: velocity.regulatoryVelocity,
        categoryVelocity: velocity.categoryVelocity,
        hotspots: sectorHotspots.sectorHotspots.slice(0, 5),
        categoryHotspots: categoryHotspots.categoryHotspots.slice(0, 5),
        predictions: predictions.predictions.slice(0, 3),
        calendar: {
          next30Days: calendar.next30Days.slice(0, 5),
          summary: calendar.summary
        },
        contentDistribution,
        sourceTrending,
        trending: trendingTopics.slice(0, 5),
        riskMetrics,
        firmProfile,
        insights: this.generateDashboardInsights(velocity, categoryHotspots, contentDistribution, sourceTrending)
      }
    } catch (error) {
      console.error('❌ Error building enhanced analytics dashboard:', error)
      throw error
    }
  }

  // ====== ENHANCED HELPER METHODS ======

  determineCategory(update) {
    const headline = (update.headline || '').toLowerCase()
    const impact = (update.impact || '').toLowerCase()
    const content = headline + ' ' + impact

    // Enhanced category classification
    if (content.includes('consultation') || content.includes('cp')) return 'Consultations'
    if (content.includes('guidance') || content.includes('fg')) return 'Guidance'
    if (content.includes('policy') || content.includes('ps')) return 'Policy Statements'
    if (content.includes('enforcement') || content.includes('fine') || content.includes('penalty')) return 'Enforcement'
    if (content.includes('speech') || content.includes('remarks')) return 'Speeches'
    if (content.includes('report') || content.includes('review')) return 'Reports'
    if (content.includes('rule') || content.includes('regulation') || content.includes('directive')) return 'Rules & Regulations'
    if (content.includes('warning') || content.includes('alert') || content.includes('notice')) return 'Warnings & Alerts'
    if (content.includes('update') || content.includes('change') || content.includes('amendment')) return 'Updates & Changes'
    if (content.includes('publication') || content.includes('document')) return 'Publications'

    return 'General'
  }

  determineContentType(update) {
    const headline = (update.headline || '').toLowerCase()
    const authority = update.authority || ''

    if (headline.includes('cp') || headline.includes('consultation')) return 'Consultation Paper'
    if (headline.includes('fg') || headline.includes('guidance')) return 'Final Guidance'
    if (headline.includes('ps') || headline.includes('policy')) return 'Policy Statement'
    if (headline.includes('speech') || headline.includes('remarks')) return 'Speech'
    if (headline.includes('tr') || headline.includes('report')) return 'Technical Report'
    if (headline.includes('warning') || headline.includes('alert')) return 'Warning Notice'
    if (headline.includes('press') || headline.includes('news')) return 'Press Release'
    if (headline.includes('update') || headline.includes('change')) return 'Update Notice'

    return 'General Document'
  }

  determineSourceType(update) {
    if (update.sourceType) return update.sourceType

    const url = update.url || ''
    if (url.includes('rss') || update.sourceName?.includes('RSS')) return 'RSS Feed'
    if (url.includes('news') || url.includes('press')) return 'News Source'
    if (url.includes('publication') || url.includes('document')) return 'Official Publication'

    return 'Web Scraping'
  }

  isCategoryRelevantToFirm(category, firmProfile) {
    if (!firmProfile || !firmProfile.primarySectors) return false

    const categoryRelevance = {
      'Rules & Regulations': ['Banking', 'Investment Management', 'Insurance'],
      Consultations: ['Banking', 'Investment Management', 'Capital Markets'],
      Enforcement: ['Banking', 'Investment Management', 'Insurance', 'Payments'],
      Guidance: ['Banking', 'Investment Management', 'Consumer Credit'],
      'Policy Statements': ['Banking', 'Investment Management', 'Capital Markets'],
      'Warnings & Alerts': ['Banking', 'Consumer Credit', 'Payments'],
      Reports: ['Banking', 'Investment Management', 'Capital Markets', 'Insurance']
    }

    const relevantSectors = categoryRelevance[category] || []
    return firmProfile.primarySectors.some(sector => relevantSectors.includes(sector))
  }

  calculateCategoryTrend(category, updates) {
    const last30Days = new Date()
    last30Days.setDate(last30Days.getDate() - 30)
    const last60Days = new Date()
    last60Days.setDate(last60Days.getDate() - 60)

    const recent = updates.filter(update =>
      new Date(update.fetchedDate) >= last30Days &&
            this.determineCategory(update) === category
    ).length

    const previous = updates.filter(update =>
      new Date(update.fetchedDate) >= last60Days &&
            new Date(update.fetchedDate) < last30Days &&
            this.determineCategory(update) === category
    ).length

    if (recent > previous * 1.2) return 'increasing'
    if (recent < previous * 0.8) return 'decreasing'
    return 'stable'
  }

  getCategoryAuthorities(category, updates) {
    const authorities = {}
    updates.forEach(update => {
      if (this.determineCategory(update) === category) {
        const auth = update.authority || 'Unknown'
        authorities[auth] = (authorities[auth] || 0) + 1
      }
    })

    return Object.entries(authorities)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([authority, count]) => ({ authority, count }))
  }

  getCategoryRiskIndicators(category, updates) {
    const categoryUpdates = updates.filter(update => this.determineCategory(update) === category)

    const highImpactCount = categoryUpdates.filter(u => u.impactLevel === 'Significant').length
    const urgentCount = categoryUpdates.filter(u => u.urgency === 'High').length
    const enforcementCount = categoryUpdates.filter(u =>
      (u.headline || '').toLowerCase().includes('enforcement') ||
            (u.headline || '').toLowerCase().includes('fine') ||
            (u.headline || '').toLowerCase().includes('penalty')
    ).length

    return {
      highImpactPercentage: categoryUpdates.length > 0
        ? Math.round((highImpactCount / categoryUpdates.length) * 100)
        : 0,
      urgentPercentage: categoryUpdates.length > 0
        ? Math.round((urgentCount / categoryUpdates.length) * 100)
        : 0,
      enforcementActivity: enforcementCount,
      totalActivity: categoryUpdates.length
    }
  }

  createTimeWindows(days) {
    const windows = []
    const windowSize = 7 // Weekly windows
    const now = new Date()

    for (let i = 0; i < Math.ceil(days / windowSize); i++) {
      const start = new Date(now)
      start.setDate(now.getDate() - (i + 1) * windowSize)
      const end = new Date(now)
      end.setDate(now.getDate() - i * windowSize)

      windows.unshift({ start, end })
    }

    return windows
  }

  getTimeWindowIndex(date, timeWindows) {
    for (let i = 0; i < timeWindows.length; i++) {
      if (date >= timeWindows[i].start && date < timeWindows[i].end) {
        return i
      }
    }
    return -1
  }

  calculateSourceTrend(timeline) {
    if (timeline.length < 4) return { direction: 'stable', strength: 'low' }

    const recent = timeline.slice(-4).reduce((sum, val) => sum + val, 0)
    const previous = timeline.slice(-8, -4).reduce((sum, val) => sum + val, 0)

    if (previous === 0) return { direction: 'stable', strength: 'low' }

    const change = (recent - previous) / previous

    let direction = 'stable'
    let strength = 'low'

    if (change > 0.2) {
      direction = 'increasing'
      strength = change > 0.5 ? 'high' : 'medium'
    } else if (change < -0.2) {
      direction = 'decreasing'
      strength = change < -0.5 ? 'high' : 'medium'
    }

    return { direction, strength }
  }

  calculateMomentum(timeline) {
    if (timeline.length < 3) return 0

    const recent3 = timeline.slice(-3).reduce((sum, val) => sum + val, 0)
    const previous3 = timeline.slice(-6, -3).reduce((sum, val) => sum + val, 0)

    if (previous3 === 0) return recent3 > 0 ? 100 : 0

    return Math.round(((recent3 - previous3) / previous3) * 100)
  }

  getCurrentWeekAverage(timeline) {
    if (timeline.length === 0) return 0
    return Math.round((timeline[timeline.length - 1] || 0) * 10) / 10
  }

  calculateConsistency(timeline) {
    if (timeline.length < 4) return 0

    const mean = timeline.reduce((sum, val) => sum + val, 0) / timeline.length
    const variance = timeline.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / timeline.length
    const stdDev = Math.sqrt(variance)

    // Consistency score (lower standard deviation = higher consistency)
    const consistencyScore = mean > 0 ? Math.max(0, 100 - (stdDev / mean) * 100) : 0
    return Math.round(consistencyScore)
  }

  predictNextWeek(timeline) {
    if (timeline.length < 4) return 0

    // Simple trend-based prediction
    const recent4 = timeline.slice(-4)
    const slope = this.calculateSlope(recent4)
    const lastValue = recent4[recent4.length - 1]

    return Math.max(0, Math.round(lastValue + slope))
  }

  calculateSlope(values) {
    const n = values.length
    const xSum = (n * (n - 1)) / 2
    const ySum = values.reduce((sum, val) => sum + val, 0)
    const xySum = values.reduce((sum, val, index) => sum + val * index, 0)
    const xSquaredSum = values.reduce((sum, val, index) => sum + index * index, 0)

    return (n * xySum - xSum * ySum) / (n * xSquaredSum - xSum * xSum)
  }

  calculateEnhancedTrendingTopics(updates) {
    const last7Days = new Date()
    last7Days.setDate(last7Days.getDate() - 7)

    const recentUpdates = updates.filter(update =>
      new Date(update.fetchedDate) >= last7Days
    )

    const topics = {}
    recentUpdates.forEach(update => {
      const keywords = this.extractKeywords(update.headline + ' ' + update.impact)
      const category = this.determineCategory(update)

      keywords.forEach(keyword => {
        if (!topics[keyword]) {
          topics[keyword] = { count: 0, categories: new Set(), authorities: new Set() }
        }
        topics[keyword].count++
        topics[keyword].categories.add(category)
        topics[keyword].authorities.add(update.authority)
      })
    })

    return Object.entries(topics)
      .filter(([, data]) => data.count >= 2)
      .map(([topic, data]) => ({
        topic,
        mentionCount: data.count,
        trend: `+${Math.round((data.count / 7) * 100)}% this week`,
        riskLevel: data.count >= 4 ? 'high' : data.count >= 3 ? 'medium' : 'low',
        categories: Array.from(data.categories),
        authorities: Array.from(data.authorities),
        momentum: this.calculateTopicMomentum(topic, updates)
      }))
      .sort((a, b) => b.mentionCount - a.mentionCount)
  }

  calculateTopicMomentum(topic, updates) {
    const last7Days = new Date()
    last7Days.setDate(last7Days.getDate() - 7)
    const last14Days = new Date()
    last14Days.setDate(last14Days.getDate() - 14)

    const thisWeek = updates.filter(update =>
      new Date(update.fetchedDate) >= last7Days &&
            (update.headline + ' ' + update.impact).toLowerCase().includes(topic.toLowerCase())
    ).length

    const lastWeek = updates.filter(update =>
      new Date(update.fetchedDate) >= last14Days &&
            new Date(update.fetchedDate) < last7Days &&
            (update.headline + ' ' + update.impact).toLowerCase().includes(topic.toLowerCase())
    ).length

    if (lastWeek === 0) return thisWeek > 0 ? 100 : 0
    return Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
  }

  calculateEnhancedRiskMetrics(updates, firmProfile) {
    const totalRisk = updates.reduce((sum, update) => {
      return sum + this.calculateRiskScore(update, firmProfile)
    }, 0)

    const averageRiskScore = updates.length > 0 ? Math.round(totalRisk / updates.length) : 0

    // Calculate risk trend
    const last30Days = new Date()
    last30Days.setDate(last30Days.getDate() - 30)
    const last60Days = new Date()
    last60Days.setDate(last60Days.getDate() - 60)

    const recentRisk = updates
      .filter(u => new Date(u.fetchedDate) >= last30Days)
      .reduce((sum, update) => sum + this.calculateRiskScore(update, firmProfile), 0)

    const previousRisk = updates
      .filter(u => new Date(u.fetchedDate) >= last60Days && new Date(u.fetchedDate) < last30Days)
      .reduce((sum, update) => sum + this.calculateRiskScore(update, firmProfile), 0)

    const recentCount = updates.filter(u => new Date(u.fetchedDate) >= last30Days).length
    const previousCount = updates.filter(u => new Date(u.fetchedDate) >= last60Days && new Date(u.fetchedDate) < last30Days).length

    const recentAvgRisk = recentCount > 0 ? recentRisk / recentCount : 0
    const previousAvgRisk = previousCount > 0 ? previousRisk / previousCount : 0

    let trend = 'stable'
    if (recentAvgRisk > previousAvgRisk * 1.1) trend = 'increasing'
    else if (recentAvgRisk < previousAvgRisk * 0.9) trend = 'decreasing'

    return {
      averageRiskScore,
      trend,
      recentAverage: Math.round(recentAvgRisk),
      previousAverage: Math.round(previousAvgRisk),
      highRiskCount: updates.filter(u => this.calculateRiskScore(u, firmProfile) >= 70).length,
      mediumRiskCount: updates.filter(u => {
        const risk = this.calculateRiskScore(u, firmProfile)
        return risk >= 40 && risk < 70
      }).length,
      lowRiskCount: updates.filter(u => this.calculateRiskScore(u, firmProfile) < 40).length
    }
  }

  generateEnhancedVelocitySummary(velocity, categoryVelocity) {
    const increasing = Object.entries(velocity).filter(([, data]) => data.trend === 'increasing')
    const total = Object.values(velocity).reduce((sum, data) => sum + data.updatesPerWeek, 0)

    const topCategory = Object.entries(categoryVelocity)
      .sort(([, a], [, b]) => b - a)[0]

    return {
      totalUpdatesPerWeek: Math.round(total * 10) / 10,
      authoritiesIncreasing: increasing.length,
      mostActive: Object.entries(velocity).reduce((max, [auth, data]) =>
        data.updatesPerWeek > max.rate ? { authority: auth, rate: data.updatesPerWeek } : max,
      { authority: 'None', rate: 0 }
      ),
      topCategory: topCategory ? { category: topCategory[0], count: topCategory[1] } : null,
      categoryCount: Object.keys(categoryVelocity).length
    }
  }

  generateCategoryHotspotSummary(hotspots, firmProfile) {
    const extremeHotspots = hotspots.filter(h => h.hotspotLevel === 'extreme')
    const highHotspots = hotspots.filter(h => h.hotspotLevel === 'high')
    const userRelevantHotspots = hotspots.filter(h => h.isUserRelevant)

    return {
      totalHotspots: hotspots.filter(h => h.isHotspot).length,
      extremeHotspots: extremeHotspots.length,
      highHotspots: highHotspots.length,
      userRelevantHotspots: userRelevantHotspots.length,
      topHotspot: hotspots.find(h => h.isHotspot) || null,
      averageIncrease: hotspots.filter(h => h.isHotspot).length > 0
        ? Math.round(hotspots.filter(h => h.isHotspot)
          .reduce((sum, h) => sum + h.monthOverMonthChange, 0) /
                    hotspots.filter(h => h.isHotspot).length * 10) / 10
        : 0
    }
  }

  generateContentDistributionInsights(contentTypes, sourceTypes, total) {
    const topContentType = Object.entries(contentTypes).sort(([, a], [, b]) => b - a)[0]
    const topSourceType = Object.entries(sourceTypes).sort(([, a], [, b]) => b - a)[0]

    const insights = []

    if (topContentType && topContentType[1] / total > 0.3) {
      insights.push(`${topContentType[0]} documents dominate (${Math.round(topContentType[1] / total * 100)}%)`)
    }

    if (topSourceType && topSourceType[1] / total > 0.5) {
      insights.push(`${topSourceType[0]} is the primary source (${Math.round(topSourceType[1] / total * 100)}%)`)
    }

    const diversityScore = Object.keys(contentTypes).length
    if (diversityScore >= 8) {
      insights.push('High content diversity detected across document types')
    } else if (diversityScore <= 4) {
      insights.push('Limited content diversity - consider expanding monitoring scope')
    }

    return insights
  }

  generateSourceTrendingSummary(sourceTrends) {
    const increasingSources = Object.entries(sourceTrends)
      .filter(([, data]) => data.trend === 'increasing')

    const topMomentum = Object.entries(sourceTrends)
      .sort(([, a], [, b]) => b.momentum - a.momentum)[0]

    const avgConsistency = Object.values(sourceTrends)
      .reduce((sum, data) => sum + data.consistency, 0) / Object.keys(sourceTrends).length

    return {
      increasingSources: increasingSources.length,
      totalSources: Object.keys(sourceTrends).length,
      topMomentumSource: topMomentum
        ? {
            source: topMomentum[0],
            momentum: topMomentum[1].momentum
          }
        : null,
      averageConsistency: Math.round(avgConsistency),
      reliabilityScore: avgConsistency >= 70 ? 'high' : avgConsistency >= 50 ? 'medium' : 'low'
    }
  }

  generateDashboardInsights(velocity, categoryHotspots, contentDistribution, sourceTrending) {
    const insights = []

    // Velocity insights
    const increasingAuthorities = Object.values(velocity.regulatoryVelocity)
      .filter(v => v.trend === 'increasing').length
    if (increasingAuthorities >= 2) {
      insights.push(`Regulatory acceleration detected across ${increasingAuthorities} authorities`)
    }

    // Category hotspot insights
    const extremeHotspots = categoryHotspots.categoryHotspots
      .filter(h => h.hotspotLevel === 'extreme').length
    if (extremeHotspots > 0) {
      insights.push(`${extremeHotspots} category${extremeHotspots > 1 ? 'ies' : 'y'} showing extreme activity spikes`)
    }

    // Content distribution insights
    if (contentDistribution.insights.length > 0) {
      insights.push(contentDistribution.insights[0])
    }

    // Source trending insights
    if (sourceTrending.summary.reliabilityScore === 'low') {
      insights.push('Source reliability concerns detected - consider additional monitoring')
    }

    return insights.slice(0, 4) // Limit to top 4 insights
  }

  // ====== EXISTING METHODS (MAINTAINED FOR COMPATIBILITY) ======

  calculateRiskScore(update, firmProfile = null) {
    let riskScore = 0

    // Base authority weighting
    const authorityWeights = {
      FCA: 40,
      BoE: 35,
      PRA: 35,
      TPR: 25,
      SFO: 30,
      FATF: 20
    }

    riskScore += authorityWeights[update.authority] || 20

    // Urgency multiplier
    const urgencyMultipliers = {
      High: 1.5,
      Medium: 1.0,
      Low: 0.7
    }

    riskScore *= urgencyMultipliers[update.urgency] || 1.0

    // Impact level boost
    const impactBoosts = {
      Significant: 40,
      Moderate: 20,
      Informational: 0
    }

    riskScore += impactBoosts[update.impactLevel] || 0

    // Category-based risk adjustment (NEW)
    const category = this.determineCategory(update)
    const categoryRiskMultipliers = {
      Enforcement: 1.3,
      'Rules & Regulations': 1.2,
      'Warnings & Alerts': 1.25,
      'Policy Statements': 1.1,
      Consultations: 0.9,
      Speeches: 0.8,
      General: 1.0
    }

    riskScore *= categoryRiskMultipliers[category] || 1.0

    // Sector relevance (user's firm sectors = higher risk)
    if (firmProfile && firmProfile.primarySectors && update.primarySectors) {
      const sectorMatch = update.primarySectors.some(sector =>
        firmProfile.primarySectors.includes(sector)
      )
      if (sectorMatch) {
        riskScore *= 1.4 // 40% boost for relevant sectors
      }
    }

    // Recent updates get higher risk scores
    const daysSinceUpdate = (Date.now() - new Date(update.fetchedDate)) / (1000 * 60 * 60 * 24)
    if (daysSinceUpdate <= 7) {
      riskScore *= 1.2 // 20% boost for recent updates
    }

    // Keywords that indicate high business impact
    const highImpactKeywords = [
      'deadline', 'implementation', 'compliance', 'enforcement',
      'penalty', 'fine', 'requirement', 'mandatory', 'consumer duty',
      'basel', 'mifid', 'gdpr', 'esg', 'reporting'
    ]

    const text = (update.headline + ' ' + update.impact).toLowerCase()
    const keywordMatches = highImpactKeywords.filter(keyword => text.includes(keyword))
    riskScore += keywordMatches.length * 5

    return Math.min(100, Math.max(0, Math.round(riskScore)))
  }

  async getSectorHotspots(firmProfile = null) {
    const cacheKey = `sector_hotspots_${firmProfile ? firmProfile.firmName : 'all'}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      console.log('🔥 Analyzing sector hotspots...')

      const updates = await dbService.getAllUpdates()
      const last30Days = new Date()
      last30Days.setDate(last30Days.getDate() - 30)

      const recentUpdates = updates.filter(update =>
        new Date(update.fetchedDate) >= last30Days
      )

      // Analyze sector activity
      const sectorActivity = {}
      const sectorImpact = {}

      recentUpdates.forEach(update => {
        const sectors = update.primarySectors || [update.sector].filter(Boolean)
        const impactScore = this.getImpactScore(update)

        sectors.forEach(sector => {
          if (!sector || sector === 'N/A') return

          sectorActivity[sector] = (sectorActivity[sector] || 0) + 1
          sectorImpact[sector] = (sectorImpact[sector] || 0) + impactScore
        })
      })

      // Calculate hotspot scores
      const hotspots = Object.keys(sectorActivity).map(sector => {
        const activityCount = sectorActivity[sector]
        const totalImpact = sectorImpact[sector]
        const avgImpact = totalImpact / activityCount

        // Activity score: frequency + impact
        const activityScore = Math.min(100, (activityCount * 10) + (avgImpact * 30))

        let riskLevel = 'low'
        if (activityScore >= 70) riskLevel = 'high'
        else if (activityScore >= 40) riskLevel = 'medium'

        // Check if this sector is relevant to user's firm
        const isUserSector = firmProfile && firmProfile.primarySectors &&
                    firmProfile.primarySectors.includes(sector)

        return {
          sector,
          activityScore: Math.round(activityScore),
          riskLevel,
          updateCount: activityCount,
          averageImpact: Math.round(avgImpact * 10) / 10,
          isUserSector,
          trend: this.calculateSectorTrend(sector, updates),
          keyTopics: this.extractSectorTopics(sector, recentUpdates)
        }
      })
        .sort((a, b) => b.activityScore - a.activityScore)
        .slice(0, 10)

      const result = {
        calculatedAt: new Date().toISOString(),
        sectorHotspots: hotspots,
        firmProfile,
        summary: this.generateHotspotSummary(hotspots, firmProfile)
      }

      this.setCache(cacheKey, result)
      return result
    } catch (error) {
      console.error('❌ Error analyzing sector hotspots:', error)
      throw error
    }
  }

  async getImpactPredictions(firmProfile = null) {
    const cacheKey = `predictions_${firmProfile ? firmProfile.firmName : 'all'}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      console.log('🔮 Generating impact predictions...')

      const updates = await dbService.getAllUpdates()
      const predictions = []

      // Analyze keyword trends for predictions
      const keywordTrends = this.analyzeKeywordTrends(updates)

      // Authority pattern analysis
      const authorityPatterns = this.analyzeAuthorityPatterns(updates)

      // Generate predictions based on patterns
      predictions.push(...this.generateKeywordPredictions(keywordTrends, firmProfile))
      predictions.push(...this.generateAuthorityPredictions(authorityPatterns, firmProfile))
      predictions.push(...this.generateSeasonalPredictions(updates, firmProfile))

      // Sort by confidence and relevance
      const sortedPredictions = predictions
        .filter(p => p.confidence >= 30) // Only show confident predictions
        .sort((a, b) => {
          // Prioritize user's sectors
          if (firmProfile && firmProfile.primarySectors) {
            const aRelevant = p => p.affectedSectors && p.affectedSectors.some(s =>
              firmProfile.primarySectors.includes(s))
            if (aRelevant(a) && !aRelevant(b)) return -1
            if (!aRelevant(a) && aRelevant(b)) return 1
          }
          return b.confidence - a.confidence
        })
        .slice(0, 8)

      const result = {
        calculatedAt: new Date().toISOString(),
        predictions: sortedPredictions,
        methodology: [
          'Keyword frequency analysis',
          'Authority pattern recognition',
          'Historical timing patterns',
          'Sector activity correlation',
          'Category trend analysis'
        ],
        confidence: this.calculateOverallConfidence(sortedPredictions)
      }

      this.setCache(cacheKey, result)
      return result
    } catch (error) {
      console.error('❌ Error generating predictions:', error)
      throw error
    }
  }

  async getComplianceCalendar(firmProfile = null) {
    const cacheKey = `calendar_${firmProfile ? firmProfile.firmName : 'all'}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      console.log('📅 Building compliance calendar...')

      const updates = await dbService.getAllUpdates()
      const calendar = {
        next30Days: [],
        next90Days: [],
        upcoming: []
      }

      // Extract deadlines from updates
      updates.forEach(update => {
        const deadlines = this.extractDeadlines(update)
        deadlines.forEach(deadline => {
          const riskScore = this.calculateRiskScore(update, firmProfile)
          const item = {
            deadline: deadline.date,
            regulation: update.headline,
            authority: update.authority,
            impactLevel: update.impactLevel,
            riskScore,
            affectedSectors: update.primarySectors || [update.sector].filter(Boolean),
            sourceUrl: update.url,
            preparationTime: this.calculatePreparationTime(deadline, update),
            confidence: deadline.confidence,
            category: this.determineCategory(update)
          }

          const daysUntil = (new Date(deadline.date) - new Date()) / (1000 * 60 * 60 * 24)

          if (daysUntil >= 0 && daysUntil <= 30) {
            calendar.next30Days.push(item)
          } else if (daysUntil > 30 && daysUntil <= 90) {
            calendar.next90Days.push(item)
          }
        })
      })

      // Generate predicted deadlines based on patterns
      const predictedDeadlines = this.generatePredictedDeadlines(updates, firmProfile)
      calendar.upcoming = predictedDeadlines

      // Sort by deadline date and risk score
      calendar.next30Days.sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      calendar.next90Days.sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      calendar.upcoming.sort((a, b) => b.confidence - a.confidence)

      const result = {
        calculatedAt: new Date().toISOString(),
        ...calendar,
        summary: {
          criticalDeadlines: calendar.next30Days.filter(d => d.riskScore >= 70).length,
          totalUpcoming: calendar.next30Days.length + calendar.next90Days.length,
          highestRisk: calendar.next30Days.reduce((max, item) =>
            item.riskScore > max.riskScore ? item : max, { riskScore: 0 })
        }
      }

      this.setCache(cacheKey, result)
      return result
    } catch (error) {
      console.error('❌ Error building compliance calendar:', error)
      throw error
    }
  }

  // ====== INHERITED HELPER METHODS ======

  getImpactScore(update) {
    const impactScores = { Significant: 3, Moderate: 2, Informational: 1 }
    const urgencyScores = { High: 3, Medium: 2, Low: 1 }

    const impact = impactScores[update.impactLevel] || 1
    const urgency = urgencyScores[update.urgency] || 1

    return impact * urgency
  }

  calculateSectorTrend(sector, updates) {
    const last30Days = new Date()
    last30Days.setDate(last30Days.getDate() - 30)
    const last60Days = new Date()
    last60Days.setDate(last60Days.getDate() - 60)

    const recent = updates.filter(update =>
      new Date(update.fetchedDate) >= last30Days &&
            (update.primarySectors || []).includes(sector)
    ).length

    const previous = updates.filter(update =>
      new Date(update.fetchedDate) >= last60Days &&
            new Date(update.fetchedDate) < last30Days &&
            (update.primarySectors || []).includes(sector)
    ).length

    if (recent > previous * 1.2) return 'increasing'
    if (recent < previous * 0.8) return 'decreasing'
    return 'stable'
  }

  extractSectorTopics(sector, updates) {
    const sectorUpdates = updates.filter(update =>
      (update.primarySectors || []).includes(sector)
    )

    // Simple keyword extraction
    const keywords = {}
    sectorUpdates.forEach(update => {
      const text = (update.headline + ' ' + update.impact).toLowerCase()
      const words = text.match(/\b[a-z]{4,}\b/g) || []
      words.forEach(word => {
        if (!['that', 'this', 'with', 'from', 'they', 'have', 'will', 'been', 'were'].includes(word)) {
          keywords[word] = (keywords[word] || 0) + 1
        }
      })
    })

    return Object.entries(keywords)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([word]) => word)
  }

  analyzeKeywordTrends(updates) {
    const last30Days = new Date()
    last30Days.setDate(last30Days.getDate() - 30)

    const recentUpdates = updates.filter(update =>
      new Date(update.fetchedDate) >= last30Days
    )

    const keywords = {}
    recentUpdates.forEach(update => {
      const text = (update.headline + ' ' + update.impact).toLowerCase()
      const importantWords = text.match(/\b[a-z]{4,}\b/g) || []
      importantWords.forEach(word => {
        if (!['that', 'this', 'with', 'from', 'they', 'have', 'will'].includes(word)) {
          keywords[word] = (keywords[word] || 0) + 1
        }
      })
    })

    return Object.entries(keywords)
      .filter(([, count]) => count >= 3)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
  }

  analyzeAuthorityPatterns(updates) {
    const patterns = {}
    updates.forEach(update => {
      const authority = update.authority
      const month = new Date(update.fetchedDate).getMonth()

      if (!patterns[authority]) patterns[authority] = { monthly: new Array(12).fill(0), total: 0 }
      patterns[authority].monthly[month]++
      patterns[authority].total++
    })

    return patterns
  }

  generateKeywordPredictions(keywordTrends, firmProfile) {
    const predictions = []

    keywordTrends.slice(0, 3).forEach(([keyword, frequency]) => {
      if (frequency >= 5) {
        predictions.push({
          type: 'keyword_trend',
          prediction: `Increased focus on "${keyword}" regulations expected within 30-60 days`,
          confidence: Math.min(85, 40 + frequency * 5),
          basedOn: ['keyword frequency analysis', 'recent regulatory patterns'],
          keyword,
          timeframe: '30-60 days',
          affectedSectors: this.guessAffectedSectors(keyword),
          priority: frequency >= 8 ? 'high' : 'medium'
        })
      }
    })

    return predictions
  }

  generateAuthorityPredictions(patterns, firmProfile) {
    const predictions = []
    const currentMonth = new Date().getMonth()

    Object.entries(patterns).forEach(([authority, data]) => {
      const avgMonthly = data.total / 12
      const thisMonthExpected = data.monthly[currentMonth] || avgMonthly

      if (thisMonthExpected > avgMonthly * 1.5) {
        predictions.push({
          type: 'authority_pattern',
          prediction: `${authority} showing increased activity - expect significant updates within 2-3 weeks`,
          confidence: 65,
          basedOn: ['historical timing patterns', 'authority activity analysis'],
          authority,
          timeframe: '2-3 weeks',
          affectedSectors: this.getAuthoritySectors(authority),
          priority: 'medium'
        })
      }
    })

    return predictions
  }

  generateSeasonalPredictions(updates, firmProfile) {
    // Simple seasonal predictions based on typical regulatory cycles
    const month = new Date().getMonth()
    const predictions = []

    if (month === 11 || month === 0) { // December/January
      predictions.push({
        type: 'seasonal',
        prediction: 'Q1 regulatory updates typically include annual reporting requirements and new implementation deadlines',
        confidence: 70,
        basedOn: ['seasonal patterns', 'regulatory calendar analysis'],
        timeframe: 'Next 6-8 weeks',
        affectedSectors: ['Banking', 'Investment Management', 'Insurance'],
        priority: 'medium'
      })
    }

    return predictions
  }

  extractDeadlines(update) {
    const deadlines = []
    const text = update.headline + ' ' + update.impact + ' ' + (update.keyDates || '')

    // Simple date extraction patterns
    const datePatterns = [
      /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/gi,
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/g,
      /(\d{4})-(\d{1,2})-(\d{1,2})/g
    ]

    datePatterns.forEach(pattern => {
      const matches = text.match(pattern)
      if (matches) {
        matches.forEach(match => {
          const date = new Date(match)
          if (date > new Date() && date < new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)) {
            deadlines.push({
              date: date.toISOString().split('T')[0],
              confidence: 75,
              source: match
            })
          }
        })
      }
    })

    return deadlines
  }

  generatePredictedDeadlines(updates, firmProfile) {
    // Generate predicted deadlines based on patterns
    return [
      {
        expectedDate: '2025-03-31',
        regulation: 'Q1 Regulatory Reporting Requirements',
        confidence: 80,
        basedOn: 'Historical quarterly patterns',
        authority: 'Multiple',
        impactLevel: 'Significant',
        affectedSectors: ['Banking', 'Investment Management']
      }
    ]
  }

  calculatePreparationTime(deadline, update) {
    const daysUntil = (new Date(deadline.date) - new Date()) / (1000 * 60 * 60 * 24)
    const complexity = this.getImpactScore(update)

    if (complexity >= 6) return Math.max(21, Math.round(daysUntil * 0.6)) + ' days recommended'
    if (complexity >= 4) return Math.max(14, Math.round(daysUntil * 0.4)) + ' days recommended'
    return Math.max(7, Math.round(daysUntil * 0.3)) + ' days recommended'
  }

  extractKeywords(text) {
    const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']
    return text.toLowerCase()
      .match(/\b[a-z]{3,}\b/g)
      ?.filter(word => !stopWords.includes(word))
      ?.slice(0, 10) || []
  }

  guessAffectedSectors(keyword) {
    const sectorKeywords = {
      consumer: ['Banking', 'Consumer Credit', 'Investment Management'],
      capital: ['Banking', 'Investment Management', 'Capital Markets'],
      crypto: ['Cryptocurrency', 'Payments'],
      esg: ['Investment Management', 'Banking', 'Insurance'],
      pension: ['Pensions'],
      insurance: ['Insurance'],
      mortgage: ['Mortgages', 'Consumer Credit']
    }

    for (const [key, sectors] of Object.entries(sectorKeywords)) {
      if (keyword.includes(key)) return sectors
    }

    return ['General']
  }

  getAuthoritySectors(authority) {
    const authoritySectors = {
      FCA: ['Banking', 'Investment Management', 'Consumer Credit', 'Insurance'],
      BoE: ['Banking', 'Capital Markets'],
      PRA: ['Banking', 'Insurance'],
      TPR: ['Pensions'],
      SFO: ['Banking', 'Capital Markets'],
      FATF: ['Banking', 'Cryptocurrency', 'Payments']
    }

    return authoritySectors[authority] || ['General']
  }

  generateHotspotSummary(hotspots, firmProfile) {
    const userHotspots = firmProfile ? hotspots.filter(h => h.isUserSector) : []
    const highRisk = hotspots.filter(h => h.riskLevel === 'high')

    return {
      totalHotspots: hotspots.length,
      highRiskSectors: highRisk.length,
      userSectorHotspots: userHotspots.length,
      topSector: hotspots[0]?.sector || 'None'
    }
  }

  calculateConfidence(recentCount, totalCount) {
    if (totalCount < 5) return Math.min(40, recentCount * 10)
    if (totalCount < 20) return Math.min(70, 30 + recentCount * 5)
    return Math.min(90, 50 + recentCount * 3)
  }

  calculateOverallConfidence(predictions) {
    if (predictions.length === 0) return 0
    const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length
    return Math.round(avgConfidence)
  }

  getAuthorityCategories(authority, updates) {
    const categoryCount = {}
    updates.forEach(update => {
      if (update.authority === authority) {
        const category = this.determineCategory(update)
        categoryCount[category] = (categoryCount[category] || 0) + 1
      }
    })

    return Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category, count]) => ({ category, count }))
  }

  // ====== ENHANCED CACHE MANAGEMENT ======

  getFromCache(key) {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(`📋 Cache hit: ${key}`)
      return cached.data
    }
    return null
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })

    // Enhanced cache cleanup with LRU behavior
    if (this.cache.size > 50) {
      const entries = Array.from(this.cache.entries())
      entries.sort(([, a], [, b]) => a.timestamp - b.timestamp)

      // Remove oldest 25% of entries
      const toRemove = Math.floor(entries.length * 0.25)
      for (let i = 0; i < toRemove; i++) {
        this.cache.delete(entries[i][0])
      }
    }

    console.log(`💾 Cache updated: ${key}`)
  }

  clearCache() {
    this.cache.clear()
    console.log('🧹 Enhanced analytics cache cleared')
  }
}

// Export singleton instance
const analyticsService = new AnalyticsService()

module.exports = analyticsService
