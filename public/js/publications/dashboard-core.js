/**
 * FCA Publications Dashboard Core
 *
 * Modular Structure:
 * - dashboard/helpers.js
 * - dashboard/stats.js
 * - dashboard/insights.js
 * - dashboard/notices.js
 * - dashboard/table.js
 * - dashboard/widgets.js
 * - dashboard/charts.js
 * - dashboard/modals.js
 * - dashboard/events.js
 * - dashboard/deepInsights.js
 */

import { applyHelpersMixin } from './dashboard/helpers.js'
import { applyStatsMixin } from './dashboard/stats.js'
import { applyInsightsMixin } from './dashboard/insights.js'
import { applyNoticesMixin } from './dashboard/notices.js'
import { applyTableMixin } from './dashboard/table.js'
import { applyWidgetsMixin } from './dashboard/widgets.js'
import { applyChartsMixin } from './dashboard/charts.js'
import { applyModalsMixin } from './dashboard/modals.js'
import { applyEventsMixin } from './dashboard/events.js'
import { applyDeepInsightsMixin } from './dashboard/deepInsights.js'

export class PublicationsDashboard {
  constructor() {
    this.charts = {}
    this.notices = []
    this.filteredNotices = []
    this.currentPage = 1
    this.pageSize = 20
    this.sortBy = 'notice_date'
    this.sortDir = 'desc'
    this.filters = {}
    this.stats = {}

    // Deep insights data
    this.caseStudies = []
    this.currentCaseIndex = 0
    this.breachSummary = []
    this.handbookStats = []
    this.fineModifiers = { aggravating: [], mitigating: [] }

    this.init()
  }

  async init() {
    try {
      await this.loadStats()
      await this.loadNotices()
      this.renderInsights()
      this.renderCharts()
      this.renderTopFines()
      this.setupEventListeners()

      // Load and render deep insights
      await this.loadDeepInsights()
      this.setupDeepInsightsEvents()

      console.log('[publications] Dashboard initialized')
    } catch (error) {
      console.error('[publications] Init error:', error)
    }
  }
}

applyHelpersMixin(PublicationsDashboard)
applyStatsMixin(PublicationsDashboard)
applyInsightsMixin(PublicationsDashboard)
applyNoticesMixin(PublicationsDashboard)
applyTableMixin(PublicationsDashboard)
applyWidgetsMixin(PublicationsDashboard)
applyChartsMixin(PublicationsDashboard)
applyModalsMixin(PublicationsDashboard)
applyEventsMixin(PublicationsDashboard)
applyDeepInsightsMixin(PublicationsDashboard)
