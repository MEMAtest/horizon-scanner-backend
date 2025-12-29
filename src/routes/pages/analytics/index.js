const { getSidebar } = require('../../templates/sidebar')
const predictiveIntelligenceService = require('../../../services/predictiveIntelligenceService')
const { getPredictiveIcon, wrapIconInContainer, getCanaryAnimationStyles } = require('../../../views/icons')
const { escapeHtml } = require('./utils')
const { buildAnalyticsViewModel } = require('./data')
const { renderAnalyticsPage } = require('./template')

const analyticsPage = async (req, res) => {
  try {
    const predictiveData = await predictiveIntelligenceService.getPredictiveDashboard()
    const sidebarHtml = await getSidebar('analytics')

    // Generate canary icon
    const canaryStyles = getCanaryAnimationStyles()
    const pageIcon = wrapIconInContainer(getPredictiveIcon())

    const {
      lanes,
      summaryTiles,
      filters,
      momentum,
      hotspots,
      alerts,
      clientPayload
    } = buildAnalyticsViewModel(predictiveData)

    const html = renderAnalyticsPage({
      sidebarHtml,
      pageIcon,
      summaryTiles,
      filters,
      lanes,
      momentum,
      hotspots,
      alerts,
      clientPayload,
      canaryStyles
    })

    res.send(html)
  } catch (error) {
    console.error('Analytics page error:', error)
    res.status(500).send(`
            <div style="padding: 2rem; text-align: center; font-family: system-ui;">
                <h1>Analytics Dashboard Error</h1>
                <p style="color: #6b7280; margin: 1rem 0;">${escapeHtml(error.message)}</p>
                <a href="/" style="color: #3b82f6; text-decoration: none;"><- Back to Home</a>
            </div>
        `)
  }
}

module.exports = analyticsPage
