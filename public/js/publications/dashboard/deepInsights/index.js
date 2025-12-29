import { loadDeepInsights } from './data.js'
import {
  renderDeepQuickStats,
  renderOutcomeAnalysis,
  setupOutcomeAccordionHandlers,
  fetchAndRenderBreachBreakdown
} from './outcomes.js'
import { scrollToTable, setupDeepInsightsEvents } from './events.js'
import { renderRiskIndicators } from './risk.js'
import { renderDeepTopFines, renderFineModifiers } from './fines.js'
import { renderCommonFindings } from './findings.js'
import { renderCaseStudySpotlight, renderCurrentCase, loadSimilarCases } from './caseStudies.js'
import { renderBreachTypeGrid, initBreachCharts, showBreachDetail } from './breaches.js'
import { renderHandbookBars, findMatchingRule } from './handbook.js'
import { renderDeepTakeaways } from './takeaways.js'
import {
  renderYearlyBreakdown,
  showYearDetailInline,
  loadYearSummary,
  generateBasicYearSummary,
  generateYearInsight,
  formatBreachType,
  updateYearTimeline,
  hideYearDetailPanel,
  initYearInlineCharts,
  openYearSummaryModal,
  initYearModalCharts
} from './yearly.js'
import { renderReoffenders, showEntityHistory, fetchEntityAISummary } from './reoffenders.js'

export function applyDeepInsightsMixin(klass) {
  Object.assign(klass.prototype, {
    loadDeepInsights,
    renderDeepQuickStats,
    renderOutcomeAnalysis,
    setupOutcomeAccordionHandlers,
    fetchAndRenderBreachBreakdown,
    scrollToTable,
    renderRiskIndicators,
    renderDeepTopFines,
    renderCommonFindings,
    renderFineModifiers,
    renderCaseStudySpotlight,
    renderCurrentCase,
    renderBreachTypeGrid,
    initBreachCharts,
    showBreachDetail,
    renderHandbookBars,
    renderDeepTakeaways,
    setupDeepInsightsEvents,
    renderYearlyBreakdown,
    showYearDetailInline,
    loadYearSummary,
    generateBasicYearSummary,
    generateYearInsight,
    formatBreachType,
    updateYearTimeline,
    hideYearDetailPanel,
    initYearInlineCharts,
    openYearSummaryModal,
    initYearModalCharts,
    renderReoffenders,
    showEntityHistory,
    loadSimilarCases,
    fetchEntityAISummary
  })
}
