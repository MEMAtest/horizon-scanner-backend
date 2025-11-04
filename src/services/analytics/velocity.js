const dbService = require('../dbService')

function applyVelocityMethods(ServiceClass) {
  ServiceClass.prototype.getRegulatoryVelocity = async function(timeframeDays = 30) {
    const cacheKey = `velocity_${timeframeDays}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      console.log('📊 Calculating enhanced regulatory velocity...')

      const updates = await dbService.getAllUpdates()
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - timeframeDays)

      const recentUpdates = updates.filter(update =>
        new Date(update.fetchedDate) >= cutoffDate
      )

      const authorityVelocity = {}
      const categoryVelocity = {}
      const authorityCounts = {}

      updates.forEach(update => {
        const authority = update.authority || 'Unknown'
        authorityCounts[authority] = (authorityCounts[authority] || 0) + 1
      })

      recentUpdates.forEach(update => {
        const authority = update.authority || 'Unknown'
        const category = this.determineCategory(update)

        authorityVelocity[authority] = (authorityVelocity[authority] || 0) + 1
        categoryVelocity[category] = (categoryVelocity[category] || 0) + 1
      })

      const velocity = {}
      Object.keys(authorityCounts).forEach(authority => {
        const recentCount = authorityVelocity[authority] || 0
        const updatesPerWeek = (recentCount / timeframeDays) * 7
        const totalCount = authorityCounts[authority]

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

  ServiceClass.prototype.generateEnhancedVelocitySummary = function(velocity, categoryVelocity) {
    const increasing = Object.entries(velocity).filter(([, data]) => data.trend === 'increasing')
    const total = Object.values(velocity).reduce((sum, data) => sum + data.updatesPerWeek, 0)

    const topCategoryEntry = Object.entries(categoryVelocity)
      .sort(([, a], [, b]) => b - a)[0]

    return {
      totalUpdatesPerWeek: Math.round(total * 10) / 10,
      authoritiesIncreasing: increasing.length,
      mostActive: Object.entries(velocity).reduce((max, [auth, data]) =>
        data.updatesPerWeek > max.rate ? { authority: auth, rate: data.updatesPerWeek } : max,
      { authority: 'None', rate: 0 }
      ),
      topCategory: topCategoryEntry ? { category: topCategoryEntry[0], count: topCategoryEntry[1] } : null,
      categoryCount: Object.keys(categoryVelocity).length
    }
  }
}

module.exports = applyVelocityMethods
