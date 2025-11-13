const intelligenceDashboardService = require('../../services/intelligenceDashboardService')
const telemetryService = require('../../services/telemetryService')
const profileService = require('../../services/profileService')

function resolveUserId(req) {
  const headerUser = req.headers['x-user-id']
  if (headerUser && typeof headerUser === 'string' && headerUser.trim()) {
    return headerUser.trim()
  }
  if (req.user && req.user.id) {
    return req.user.id
  }
  return 'default'
}

function registerIntelligenceRoutes(router) {
  router.get('/intelligence/daily', async (req, res) => {
    try {
      const rawSnapshot = await intelligenceDashboardService.getDailySnapshot({
        filters: {
          authority: req.query.authority ? String(req.query.authority).split(',').map(value => value.trim()).filter(Boolean) : undefined,
          sector: req.query.sector || undefined
        },
        userId: resolveUserId(req)
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

  router.post('/intelligence/events', async (req, res) => {
    try {
      const userId = resolveUserId(req)
      const profile = await profileService.getActiveProfile(userId)
      if (!profile || !profile.id) {
        return res.status(400).json({
          success: false,
          error: 'Profile not established for telemetry capture'
        })
      }
      const event = await telemetryService.recordEvent({
        ...req.body,
        userId,
        profileId: profile.id
      })
      res.status(201).json({
        success: true,
        event
      })
    } catch (error) {
      console.error('[intelligence] telemetry error:', error)
      res.status(400).json({
        success: false,
        error: error.message || 'Unable to record event'
      })
    }
  })
}

module.exports = registerIntelligenceRoutes
