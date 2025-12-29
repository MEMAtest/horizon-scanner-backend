import { loadStats, loadStatsWithFilters } from './load.js'
import { renderStats, renderFinesTimeline, renderFilteredStats, renderStatsError } from './render.js'
import { populateFilters, handleYearClick, handleCategoryClick, updateHeaderMeta } from './filters.js'
import { renderPatternCards, derivePatternsFromFines, buildFallbackStats } from './patterns.js'
import { renderYearlyOverview, renderCategoryTrends, renderControlPlaybook } from './charts.js'

function applyStatsMixin(klass) {
  Object.assign(klass.prototype, {
    loadStats,
    loadStatsWithFilters,
    renderStats,
    renderFinesTimeline,
    renderFilteredStats,
    renderStatsError,
    populateFilters,
    handleYearClick,
    handleCategoryClick,
    updateHeaderMeta,
    renderPatternCards,
    derivePatternsFromFines,
    buildFallbackStats,
    renderYearlyOverview,
    renderCategoryTrends,
    renderControlPlaybook
  })
}

export { applyStatsMixin }
