const dbService = require('../dbService')

function applyPredictionMethods(ServiceClass) {
  ServiceClass.prototype.getImpactPredictions = async function(firmProfile = null) {
    const cacheKey = `predictions_${firmProfile ? firmProfile.firmName : 'all'}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      console.log('🔮 Generating impact predictions...')

      const updates = await dbService.getAllUpdates()
      const predictions = []

      const keywordTrends = this.analyzeKeywordTrends(updates)
      const authorityPatterns = this.analyzeAuthorityPatterns(updates)

      predictions.push(...this.generateKeywordPredictions(keywordTrends, firmProfile))
      predictions.push(...this.generateAuthorityPredictions(authorityPatterns, firmProfile))
      predictions.push(...this.generateSeasonalPredictions(updates, firmProfile))

      const sortedPredictions = predictions
        .filter(p => p.confidence >= 30)
        .sort((a, b) => {
          if (firmProfile && firmProfile.primarySectors) {
            const isRelevant = entry =>
              entry.affectedSectors && entry.affectedSectors.some(s => firmProfile.primarySectors.includes(s))
            if (isRelevant(a) && !isRelevant(b)) return -1
            if (!isRelevant(a) && isRelevant(b)) return 1
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

  ServiceClass.prototype.analyzeKeywordTrends = function(updates) {
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

  ServiceClass.prototype.analyzeAuthorityPatterns = function(updates) {
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

  ServiceClass.prototype.generateKeywordPredictions = function(keywordTrends, firmProfile) {
    const predictions = []

    keywordTrends.slice(0, 3).forEach(([keyword, trendFrequency]) => {
      if (trendFrequency >= 5) {
        predictions.push({
          type: 'keyword_trend',
          prediction: `Increased focus on "${keyword}" regulations expected within 30-60 days`,
          confidence: Math.min(85, 40 + trendFrequency * 5),
          basedOn: ['keyword frequency analysis', 'recent regulatory patterns'],
          keyword,
          timeframe: '30-60 days',
          affectedSectors: this.guessAffectedSectors(keyword),
          priority: trendFrequency >= 8 ? 'high' : 'medium'
        })
      }
    })

    return predictions
  }

  ServiceClass.prototype.generateAuthorityPredictions = function(patterns, firmProfile) {
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

  ServiceClass.prototype.generateSeasonalPredictions = function(updates, firmProfile) {
    const month = new Date().getMonth()
    const predictions = []

    if (month === 11 || month === 0) {
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
}

module.exports = applyPredictionMethods
