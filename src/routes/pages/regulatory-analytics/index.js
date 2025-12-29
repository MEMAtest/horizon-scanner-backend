const { getClientScripts } = require('../../templates/clientScripts')
const { getCommonStyles } = require('../../templates/commonStyles')
const { getAnalyticsIcon, wrapIconInContainer, getCanaryAnimationStyles } = require('../../../views/icons')
const { calculateAnalytics } = require('./analytics')
const { loadRegulatoryAnalyticsData } = require('./data')
const { buildAnalyticsPage, renderAnalyticsError } = require('./render')

async function renderRegulatoryAnalyticsPage(req, res) {
  try {
    const { updates, filterOptions, sidebar } = await loadRegulatoryAnalyticsData(req)

    // Calculate analytics data
    const analyticsData = calculateAnalytics(updates)

    const commonStyles = getCommonStyles()
    const clientScripts = getClientScripts()

    // Generate canary icon for this page
    const canaryStyles = getCanaryAnimationStyles()
    const pageIcon = wrapIconInContainer(getAnalyticsIcon())

    const html = buildAnalyticsPage({
      sidebar,
      commonStyles,
      clientScripts,
      analyticsData,
      filterOptions,
      updates,
      canaryStyles,
      pageIcon
    })

    res.send(html)
  } catch (error) {
    console.error('[Analytics] Error rendering page:', error)
    console.error('[Analytics] Error stack:', error.stack)
    res.status(500).send(renderAnalyticsError(error))
  }
}

module.exports = { renderRegulatoryAnalyticsPage }
