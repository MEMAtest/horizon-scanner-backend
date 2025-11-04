const dbService = require('../dbService')

function applySourceMethods(ServiceClass) {
  ServiceClass.prototype.getSourceTypeTrending = async function() {
    const cacheKey = 'source_trending'
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      console.log('🌐 Analyzing source type trending with momentum and consistency...')

      const updates = await dbService.getAllUpdates()
      const timeWindows = this.createTimeWindows(90)

      const sourceTimelines = {}

      updates.forEach(update => {
        const sourceType = this.determineSourceType(update)
        const updateDate = new Date(update.fetchedDate)
        const windowIndex = this.getTimeWindowIndex(updateDate, timeWindows)

        if (windowIndex !== -1) {
          if (!sourceTimelines[sourceType]) {
            sourceTimelines[sourceType] = new Array(timeWindows.length).fill(0)
          }
          sourceTimelines[sourceType][windowIndex] += 1
        }
      })

      const sourceTrends = {}
      Object.entries(sourceTimelines).forEach(([source, timeline]) => {
        const trendDetails = this.calculateSourceTrend(timeline)
        const momentumScore = this.calculateMomentum(timeline)

        sourceTrends[source] = {
          timeline,
          trend: trendDetails.direction,
          trendStrength: trendDetails.strength,
          momentum: momentumScore,
          consistency: this.calculateConsistency(timeline),
          currentWeekAverage: this.getCurrentWeekAverage(timeline),
          prediction: this.predictNextWeek(timeline),
          lastUpdated: new Date().toISOString()
        }
      })

      const result = {
        calculatedAt: new Date().toISOString(),
        sourceTrends,
        summary: this.generateSourceTrendingSummary(sourceTrends)
      }

      this.setCache(cacheKey, result)
      return result
    } catch (error) {
      console.error('❌ Error analyzing source trends:', error)
      throw error
    }
  }

  ServiceClass.prototype.createTimeWindows = function(days) {
    const windows = []
    const windowSize = 7
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

  ServiceClass.prototype.getTimeWindowIndex = function(date, timeWindows) {
    for (let i = 0; i < timeWindows.length; i++) {
      if (date >= timeWindows[i].start && date < timeWindows[i].end) {
        return i
      }
    }
    return -1
  }

  ServiceClass.prototype.calculateSourceTrend = function(timeline) {
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

  ServiceClass.prototype.calculateMomentum = function(timeline) {
    if (timeline.length < 3) return 0

    const recent3 = timeline.slice(-3).reduce((sum, val) => sum + val, 0)
    const previous3 = timeline.slice(-6, -3).reduce((sum, val) => sum + val, 0)

    if (previous3 === 0) return recent3 > 0 ? 100 : 0

    return Math.round(((recent3 - previous3) / previous3) * 100)
  }

  ServiceClass.prototype.getCurrentWeekAverage = function(timeline) {
    if (timeline.length === 0) return 0
    return Math.round((timeline[timeline.length - 1] || 0) * 10) / 10
  }

  ServiceClass.prototype.calculateConsistency = function(timeline) {
    if (timeline.length < 4) return 0

    const mean = timeline.reduce((sum, val) => sum + val, 0) / timeline.length
    const variance = timeline.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / timeline.length
    const stdDev = Math.sqrt(variance)

    const consistencyScore = mean > 0 ? Math.max(0, 100 - (stdDev / mean) * 100) : 0
    return Math.round(consistencyScore)
  }

  ServiceClass.prototype.predictNextWeek = function(timeline) {
    if (timeline.length < 4) return 0

    const recent4 = timeline.slice(-4)
    const slope = this.calculateSlope(recent4)
    const lastValue = recent4[recent4.length - 1]

    return Math.max(0, Math.round(lastValue + slope))
  }

  ServiceClass.prototype.calculateSlope = function(values) {
    const n = values.length
    const xSum = (n * (n - 1)) / 2
    const ySum = values.reduce((sum, val) => sum + val, 0)
    const xySum = values.reduce((sum, val, index) => sum + val * index, 0)
    const xSquaredSum = values.reduce((sum, val, index) => sum + index * index, 0)

    return (n * xySum - xSum * ySum) / (n * xSquaredSum - xSum * xSum)
  }

  ServiceClass.prototype.generateSourceTrendingSummary = function(sourceTrends) {
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
}

module.exports = applySourceMethods
