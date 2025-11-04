const dbService = require('./dbService')

const {
  MAX_LOOKBACK_DAYS
} = require('./predictiveIntelligence/constants')

const applyUtilityMethods = require('./predictiveIntelligence/utils')
const applyStatsMethods = require('./predictiveIntelligence/stats')
const applyPredictionMethods = require('./predictiveIntelligence/predictions')
const applyMomentumMethods = require('./predictiveIntelligence/momentum')

class PredictiveIntelligenceService {
  constructor() {
    this.cache = new Map()
    this.cacheTTL = 30 * 60 * 1000 // 30 minutes
  }

  getFromCache(key) {
    const entry = this.cache.get(key)
    if (!entry) return null
    if (Date.now() - entry.timestamp > this.cacheTTL) {
      this.cache.delete(key)
      return null
    }
    return entry.value
  }

  setCache(key, value) {
    this.cache.set(key, { value, timestamp: Date.now() })
  }

  async getPredictiveDashboard(firmProfile = null) {
    const cacheKey = `predictive_dashboard_${firmProfile ? firmProfile.firmName || 'firm' : 'all'}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    const updates = await dbService.getAllUpdates()
    const now = new Date()
    const cutoff = new Date(now.getTime() - MAX_LOOKBACK_DAYS * 24 * 60 * 60 * 1000)

    const relevantUpdates = updates
      .filter(update => {
        const date = new Date(update.publishedDate || update.published_date || update.fetchedDate || update.createdAt)
        return !isNaN(date) && date >= cutoff
      })
      .map(update => {
        const parsedDate = new Date(update.publishedDate || update.published_date || update.fetchedDate || update.createdAt)
        const sectors = this.collectSectors(update)
        const stage = this.detectStage(update)
        const tokens = this.tokenize(`${update.headline || ''} ${update.ai_summary || update.summary || ''}`)
        const deadline = this.getDeadline(update)

        return {
          ...update,
          parsedDate,
          sectors,
          stage,
          tokens,
          deadline
        }
      })

    const topicStats = this.buildTopicStats(relevantUpdates, now)
    const authorityStats = this.buildAuthorityStats(relevantUpdates, now)
    const sectorStats = this.buildSectorStats(relevantUpdates, now)

    const predictions = this.buildPredictions({ topicStats, authorityStats, sectorStats, updates: relevantUpdates, now, firmProfile })
    const momentum = this.buildMomentumIndicators({ topicStats, authorityStats, sectorStats, now })
    const alerts = this.buildPatternAlerts({ topicStats, authorityStats, sectorStats, now })

    const dashboard = {
      generatedAt: now.toISOString(),
      predictions,
      momentum,
      alerts,
      methodology: [
        'Rolling 90-day topic velocity analysis',
        'Authority publication behaviour profiling',
        'Emergent terminology detection',
        'Cross-authority coordination mapping',
        'Historical timing validation'
      ]
    }

    this.setCache(cacheKey, dashboard)
    return dashboard
  }
}

applyUtilityMethods(PredictiveIntelligenceService)
applyStatsMethods(PredictiveIntelligenceService)
applyPredictionMethods(PredictiveIntelligenceService)
applyMomentumMethods(PredictiveIntelligenceService)

module.exports = new PredictiveIntelligenceService()
