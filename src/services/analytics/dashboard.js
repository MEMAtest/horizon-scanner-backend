const dbService = require('../dbService')

function applyDashboardMethods(ServiceClass) {
  ServiceClass.prototype.getAnalyticsDashboard = async function(firmProfile = null) {
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

      const trendingTopics = this.calculateEnhancedTrendingTopics(updates)
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

  ServiceClass.prototype.calculateEnhancedTrendingTopics = function(updates) {
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

  ServiceClass.prototype.calculateTopicMomentum = function(topic, updates) {
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

  ServiceClass.prototype.calculateEnhancedRiskMetrics = function(updates, firmProfile) {
    const totalRisk = updates.reduce((sum, update) => {
      return sum + this.calculateRiskScore(update, firmProfile)
    }, 0)

    const averageRiskScore = updates.length > 0 ? Math.round(totalRisk / updates.length) : 0

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

  ServiceClass.prototype.generateDashboardInsights = function(velocity, categoryHotspots, contentDistribution, sourceTrending) {
    const insights = []

    const increasingAuthorities = Object.values(velocity.regulatoryVelocity)
      .filter(v => v.trend === 'increasing').length
    if (increasingAuthorities >= 2) {
      insights.push(`Regulatory acceleration detected across ${increasingAuthorities} authorities`)
    }

    const extremeHotspots = categoryHotspots.categoryHotspots
      .filter(h => h.hotspotLevel === 'extreme').length
    if (extremeHotspots > 0) {
      insights.push(`${extremeHotspots} category${extremeHotspots > 1 ? 'ies' : 'y'} showing extreme activity spikes`)
    }

    if (contentDistribution.insights.length > 0) {
      insights.push(contentDistribution.insights[0])
    }

    if (sourceTrending.summary.reliabilityScore === 'low') {
      insights.push('Source reliability concerns detected - consider additional monitoring')
    }

    return insights.slice(0, 4)
  }
}

module.exports = applyDashboardMethods
