const intelligenceDashboardService = require('../../services/intelligenceDashboardService')

function registerIntelligenceRoutes(router) {
  router.get('/intelligence/daily', async (req, res) => {
    try {
      const rawSnapshot = await intelligenceDashboardService.getDailySnapshot({
        filters: {
          authority: req.query.authority ? String(req.query.authority).split(',').map(value => value.trim()).filter(Boolean) : undefined,
          sector: req.query.sector || undefined
        }
      })

      const clientSnapshot = intelligenceDashboardService.buildClientSnapshot(rawSnapshot)

      res.json({
        success: true,
        snapshot: clientSnapshot
      })
    } catch (error) {
      console.error('[intelligence] Failed to build daily snapshot:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })
}

module.exports = registerIntelligenceRoutes
