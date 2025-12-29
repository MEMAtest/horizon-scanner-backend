const { renderWeeklyBriefingModal } = require('../../../views/weeklyBriefing/sections/modals')
const { getPersonaSummaries } = require('../../../config/firmPersonas')
const { getSidebarIcons } = require('./icons')
const { getRecentUpdateCounts } = require('./data')
const { generateFallbackSidebar } = require('./fallback')
const { formatRelativeTime } = require('./utils')
const { renderSidebarTemplate } = require('./template')

async function getSidebar(currentPage = '', options = {}) {
  const { user, persona } = options

  try {
    console.log('Tools Generating clean sidebar...')

    // Get recent update counts for live counters
    const recentCounts = await getRecentUpdateCounts()
    const personaPresets = getPersonaSummaries()
    const icons = getSidebarIcons()
    const lastSync = formatRelativeTime(new Date())

    return renderSidebarTemplate({
      currentPage,
      user,
      persona,
      personaPresets,
      recentCounts,
      icons,
      lastSync,
      weeklyBriefingModal: renderWeeklyBriefingModal()
    })
  } catch (error) {
    console.error('[error] Error generating sidebar:', error)
    return generateFallbackSidebar(currentPage)
  }
}

module.exports = { getSidebar }
