const applyCacheMethods = require('./analytics/cache')
const applyHelperMethods = require('./analytics/helpers')
const applyVelocityMethods = require('./analytics/velocity')
const applyCategoryMethods = require('./analytics/categories')
const applyContentMethods = require('./analytics/content')
const applySourceMethods = require('./analytics/sources')
const applyDashboardMethods = require('./analytics/dashboard')
const applySectorMethods = require('./analytics/sectors')
const applyPredictionMethods = require('./analytics/predictions')
const applyCalendarMethods = require('./analytics/calendar')

class AnalyticsService {
  constructor() {
    this.cache = new Map()
    this.cacheTimeout = 30 * 60 * 1000
    this.analysisWindow = 90
  }
}

applyHelperMethods(AnalyticsService)
applyCacheMethods(AnalyticsService)
applyVelocityMethods(AnalyticsService)
applyCategoryMethods(AnalyticsService)
applyContentMethods(AnalyticsService)
applySourceMethods(AnalyticsService)
applyDashboardMethods(AnalyticsService)
applySectorMethods(AnalyticsService)
applyPredictionMethods(AnalyticsService)
applyCalendarMethods(AnalyticsService)

module.exports = new AnalyticsService()
