import { applyStatsMixin } from './modules/stats.js'
import { applyFinesMixin } from './modules/fines.js'
import { applyTrendsMixin } from './modules/trends.js'
import { applyTopFirmsMixin } from './modules/topFirms.js'
import { applyFiltersMixin } from './modules/filters.js'
import { applyEventsMixin } from './modules/events.js'
import { applyUtilsMixin } from './modules/utils.js'
import { applyModalsMixin } from './modules/modals.js'
import { applyDistributionMixin } from './modules/distribution.js'
import { applyHeatmapMixin } from './modules/heatmap.js'
import { applyYearSummaryMixin } from './modules/yearSummary.js'
import { applyAdvancedAnalyticsMixin } from './modules/advancedAnalytics.js'
import { applyFirmComparisonMixin } from './modules/firmComparison.js'

class EnforcementDashboard {
  constructor() {
    this.charts = {}
    this.baseStats = null
    this.baseYearlyOverview = []
    this.baseControlRecommendations = []
    this.baseCategoryTrends = []
    this.allFines = []
    this.latestFilteredFines = []
    this.latestFilteredTotal = 0
    this.trendCache = {}
    this.latestTrendsData = []
    this.trendSearchTerm = ''
    this.latestTopFirms = []
    this.topFirmSearchTerm = ''
    this.currentTrendPeriod = 'monthly'
    this.filteredSummary = null
    this.defaultTableRowLimit = 50
    this.tableRowLimit = this.defaultTableRowLimit
    this.showAllFines = false
    this.isFilterActive = false
    this.currentFilterParams = {}
    this.init()
  }

  async init() {
    console.log('[init] Initializing enforcement dashboard...')

    this.initModals()
    await this.loadStats()
    await this.loadRecentFines()
    await this.loadTrends()
    await this.loadTopFirms()
    await this.loadDistribution()
    await this.loadHeatmap()

    this.setupEventListeners()
    this.initAdvancedAnalytics()
    this.initFirmComparison()

    console.log('[ready] Enforcement dashboard initialized')
  }
}

applyUtilsMixin(EnforcementDashboard)
applyFiltersMixin(EnforcementDashboard)
applyStatsMixin(EnforcementDashboard)
applyFinesMixin(EnforcementDashboard)
applyTrendsMixin(EnforcementDashboard)
applyTopFirmsMixin(EnforcementDashboard)
applyEventsMixin(EnforcementDashboard)
applyModalsMixin(EnforcementDashboard)
applyDistributionMixin(EnforcementDashboard)
applyHeatmapMixin(EnforcementDashboard)
applyYearSummaryMixin(EnforcementDashboard)
applyAdvancedAnalyticsMixin(EnforcementDashboard)
applyFirmComparisonMixin(EnforcementDashboard)

export { EnforcementDashboard }
