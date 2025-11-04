function registerMiscRoutes(router) {
  router.post('/alerts', async (req, res) => {
  try {
    const alertData = req.body

    res.json({
      success: true,
      message: 'Alert created successfully',
      alertId: Date.now().toString(),
      alert: alertData
    })
  } catch (error) {
    console.error('Alert creation error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create alert',
      details: error.message
    })
  }
  })

  router.get('/test', async (req, res) => {
  try {
    console.log('Test API: Test endpoint accessed')

    res.json({
      success: true,
      message: 'AI Regulatory Intelligence Platform API is operational',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      features: [
        'Enhanced Updates with AI Analysis',
        'Real-time Impact Scoring',
        'Sector-specific Intelligence',
        'Authority Spotlight Analysis',
        'Weekly AI Roundups',
        'Trend Analysis',
        'Early Warning System (Phase 1.2)',
        'Proactive Intelligence',
        'Phase 1.3 Workspace Management'
      ]
    })
  } catch (error) {
    console.error('X API Test failed:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
  })
}

module.exports = registerMiscRoutes
