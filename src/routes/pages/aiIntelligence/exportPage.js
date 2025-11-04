const intelligenceDashboardService = require('../../../services/intelligenceDashboardService')
const { buildAiIntelligenceExportPage } = require('../../../views/aiIntelligence/exportBuilder')

async function renderAiIntelligenceExportPage(req, res) {
  try {
    const snapshot = await intelligenceDashboardService.getDailySnapshot()
    const html = buildAiIntelligenceExportPage(snapshot)

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
    res.send(html)
  } catch (error) {
    console.error('X Error rendering AI intelligence export page:', error)
    res.status(500).send('Unable to generate export at this time.')
  }
}

module.exports = renderAiIntelligenceExportPage
