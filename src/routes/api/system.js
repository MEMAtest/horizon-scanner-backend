const dbService = require('../../services/dbService')
const aiAnalyzer = require('../../services/aiAnalyzer')

function registerSystemRoutes(router) {
  router.get('/health', async (req, res) => {
  try {
    console.log('Search API: Health check requested')

    const dbHealth = await dbService.healthCheck()
    const aiHealth = await aiAnalyzer.healthCheck()

    const overallStatus = dbHealth.status === 'healthy' && aiHealth.status === 'healthy'
      ? 'healthy'
      : 'degraded'

    res.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth,
        aiAnalyzer: aiHealth
      },
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development'
    })
  } catch (error) {
    console.error('X API Health check failed:', error)
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
  })

  router.get('/aws-check', (req, res) => {
    res.json({
      AWS_ACCESS_KEY_ID: !!process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: !!process.env.AWS_SECRET_ACCESS_KEY,
      AWS_REGION: process.env.AWS_REGION || null,
      AWS_SES_REGION: process.env.AWS_SES_REGION || null,
      DIGEST_FROM_EMAIL: process.env.DIGEST_FROM_EMAIL || null,
      DAILY_DIGEST_RECIPIENTS: process.env.DAILY_DIGEST_RECIPIENTS || null,
      ENABLE_DAILY_DIGEST: process.env.ENABLE_DAILY_DIGEST || null,
      keyIdPrefix: process.env.AWS_ACCESS_KEY_ID ? process.env.AWS_ACCESS_KEY_ID.substring(0, 4) + '...' : null
    })
  })

  router.get('/status', async (req, res) => {
  try {
    console.log('Analytics API: System status requested')

    const stats = await dbService.getSystemStatistics()
    const counts = await dbService.getUpdateCounts()

    res.json({
      success: true,
      status: 'operational',
      statistics: stats,
      liveCounters: counts,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('X API Status check failed:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      status: 'error'
    })
  }
  })

  router.get('/system-status', async (req, res) => {
  try {
    console.log('Search API: System status check requested')

    const dbHealth = await dbService.healthCheck()
    const aiHealth = await aiAnalyzer.healthCheck()

    res.json({
      overall: {
        status: dbHealth.status === 'healthy' && aiHealth.status === 'healthy' ? 'healthy' : 'degraded'
      },
      database: {
        connected: dbHealth.status === 'healthy',
        ...dbHealth
      },
      api: {
        healthy: true,
        version: '2.0.0'
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('System status error:', error)
    res.status(503).json({
      overall: { status: 'error' },
      database: { connected: false },
      api: { healthy: false },
      error: error.message
    })
  }
  })

  router.post('/refresh', async (req, res) => {
  try {
    console.log('Refresh Refresh endpoint called')

    const rssFetcher = require('../../services/rssFetcher')
    const results = await rssFetcher.fetchAllFeeds()

    res.json({
      success: true,
      message: 'Refresh completed successfully',
      newArticles: results.newUpdates || 0,
      totalProcessed: results.total || 0,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Refresh error:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
  })

  router.post('/manual-refresh', async (req, res) => {
  try {
    const manualRefreshService = require('../../services/manualRefreshService')
    const options = req.body || {}

    console.log('Signal Manual refresh API called with options:', options)

    const result = await manualRefreshService.performManualRefresh(options)

    res.json(result)
  } catch (error) {
    console.error('Manual refresh API error:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
  })

  router.get('/refresh-status', async (req, res) => {
  try {
    const manualRefreshService = require('../../services/manualRefreshService')

    const status = manualRefreshService.getRefreshStatus()
    const counts = await manualRefreshService.getSystemCounts()

    res.json({
      ...status,
      counts
    })
  } catch (error) {
    console.error('Refresh status API error:', error)
    res.status(500).json({
      error: error.message
    })
  }
  })
}

module.exports = registerSystemRoutes
