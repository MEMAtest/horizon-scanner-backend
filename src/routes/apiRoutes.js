const express = require('express')

const weeklyRoundupRoutes = require('./weeklyRoundup')
const smartBriefingRoutes = require('./smartBriefingRoutes')
const enforcementRoutes = require('./api/enforcement')

const registerAnalyticsRoutes = require('./api/analytics')
const registerAnnotationRoutes = require('./api/annotations')
const registerReportRoutes = require('./api/reports')
const registerWorkspaceRoutes = require('./api/workspace')
const registerUpdateRoutes = require('./api/updates')
const registerAiRoutes = require('./api/ai')
const registerSystemRoutes = require('./api/system')
const registerMiscRoutes = require('./api/misc')
const registerIntelligenceRoutes = require('./api/intelligence')

const router = express.Router()

router.use('/', weeklyRoundupRoutes)
router.use('/', smartBriefingRoutes)
router.use('/enforcement', enforcementRoutes)

registerAnalyticsRoutes(router)
registerAnnotationRoutes(router)
registerReportRoutes(router)
registerWorkspaceRoutes(router)
registerUpdateRoutes(router)
registerAiRoutes(router)
registerSystemRoutes(router)
registerMiscRoutes(router)
registerIntelligenceRoutes(router)

module.exports = router
