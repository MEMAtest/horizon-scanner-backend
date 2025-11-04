const dbService = require('../dbService')

function applyCategoryMethods(ServiceClass) {
  ServiceClass.prototype.getCategoryHotspots = async function(firmProfile = null) {
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

      const categoryActivity = {
        current: {},
        previous: {},
        baseline: {}
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

        const monthOverMonthChange = previousCount > 0
          ? ((currentCount - previousCount) / previousCount) * 100
          : currentCount > 0 ? 100 : 0

        const quarterOverQuarterChange = baselineCount > 0
          ? ((currentCount - baselineCount) / baselineCount) * 100
          : currentCount > 0 ? 100 : 0

        const isHotspot = monthOverMonthChange >= 20 || quarterOverQuarterChange >= 20
        const isUserRelevant = firmProfile
          ? this.isCategoryRelevantToFirm(category, firmProfile)
          : false

        hotspots.push({
          category,
          currentCount,
          previousCount,
          baselineCount,
          monthOverMonthChange: Math.round(monthOverMonthChange),
          quarterOverQuarterChange: Math.round(quarterOverQuarterChange),
          hotspotLevel: monthOverMonthChange >= 40 ? 'extreme'
            : monthOverMonthChange >= 25 ? 'high'
              : monthOverMonthChange >= 15 ? 'medium' : 'low',
          isHotspot,
          isUserRelevant,
          trend: this.calculateCategoryTrend(category, updates),
          topAuthorities: this.getCategoryAuthorities(category, updates),
          riskIndicators: this.getCategoryRiskIndicators(category, updates)
        })
      })

      hotspots.sort((a, b) => b.monthOverMonthChange - a.monthOverMonthChange)

      const result = {
        calculatedAt: new Date().toISOString(),
        categoryHotspots: hotspots,
        summary: this.generateCategoryHotspotSummary(hotspots, firmProfile)
      }

      this.setCache(cacheKey, result)
      return result
    } catch (error) {
      console.error('❌ Error analyzing category hotspots:', error)
      throw error
    }
  }

  ServiceClass.prototype.calculateCategoryTrend = function(category, updates) {
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

  ServiceClass.prototype.getCategoryAuthorities = function(category, updates) {
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

  ServiceClass.prototype.getCategoryRiskIndicators = function(category, updates) {
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

  ServiceClass.prototype.generateCategoryHotspotSummary = function(hotspots, firmProfile) {
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
}

module.exports = applyCategoryMethods
