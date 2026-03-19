// api/cron/scrape-monitor.js
// Serverless trigger for scrape health monitoring, intended for Vercel Cron.
// Checks all configured sources for staleness, errors, and attempts auto-fixes.

const scrapeMonitorService = require('../../src/services/scrapeMonitorService')

module.exports = async (req, res) => {
  const startTime = Date.now()

  // Vercel Cron uses GET, manual triggers use POST - accept both
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).json({ success: false, error: 'Method Not Allowed' })
  }

  // Optional: Add authentication for manual triggers
  const authHeader = req.headers.authorization
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  try {
    console.log('🔍 Scrape Monitor: Starting health check...')

    const result = await scrapeMonitorService.runMonitor({
      runType: 'vercel-cron',
      fastMode: true
    })

    const duration = Date.now() - startTime

    if (!result.success) {
      console.error(`❌ Scrape Monitor: Failed - ${result.error}`)
      return res.status(500).json({
        success: false,
        error: result.error,
        durationMs: duration
      })
    }

    console.log(`✅ Scrape Monitor: Completed in ${duration}ms`)
    console.log(`   Total sources: ${result.totals.totalSources}`)
    console.log(`   Success: ${result.totals.successSources}`)
    console.log(`   Errors: ${result.totals.errorSources}`)
    console.log(`   Stale: ${result.totals.staleSources}`)
    console.log(`   Fixed: ${result.totals.fixedSources}`)

    return res.status(200).json({
      success: true,
      completedAt: new Date().toISOString(),
      runId: result.runId,
      summary: {
        totalSources: result.totals.totalSources,
        successSources: result.totals.successSources,
        errorSources: result.totals.errorSources,
        staleSources: result.totals.staleSources,
        fixedSources: result.totals.fixedSources,
        newUpdates: result.totals.newUpdates,
        issues: result.issues.length,
        durationMs: duration
      }
    })
  } catch (error) {
    const duration = Date.now() - startTime

    console.error('❌ Scrape Monitor: Failed')
    console.error(`   Error: ${error.message}`)
    console.error(`   Duration: ${duration}ms`)

    return res.status(500).json({
      success: false,
      error: error.message,
      durationMs: duration
    })
  }
}
