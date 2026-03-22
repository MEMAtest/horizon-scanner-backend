// api/cron/puppeteer-refresh.js
// Cron for Puppeteer-based scrapers that require JavaScript rendering.
// Uses @sparticuz/chromium for serverless Chromium on Vercel.
// Runs with low concurrency since Puppeteer is memory-heavy.

const rssFetcher = require('../../src/services/rssFetcher')

module.exports = async (req, res) => {
  const startTime = Date.now()

  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).json({ success: false, error: 'Method Not Allowed' })
  }

  const authHeader = req.headers.authorization
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  try {
    console.log('🤖 Puppeteer Refresh: Starting puppeteer-based scraper fetch...')

    const summary = await rssFetcher.fetchAllFeeds({
      typeFilter: 'puppeteer',
      maxDurationMs: 270000, // Stop at 270s to leave buffer for response (300s Vercel limit)
      concurrency: 3, // Low concurrency — Puppeteer is memory-heavy
      timeoutMs: 30000 // 30s per source (puppeteer pages are slower to load)
    })

    const duration = Date.now() - startTime

    // Extract per-source failures for visibility
    const failures = summary.bySource
      ? Object.values(summary.bySource)
          .filter(s => s.status === 'error' || s.status === 'empty')
          .map(s => ({ name: s.name, authority: s.authority, status: s.status, error: s.error || null, durationMs: s.durationMs }))
      : []

    console.log(`✅ Puppeteer Refresh: Completed in ${duration}ms`)
    console.log(`   Total sources: ${summary.total}`)
    console.log(`   Successful: ${summary.successful}`)
    console.log(`   Failed: ${summary.failed}`)
    console.log(`   New updates: ${summary.newUpdates}`)
    if (failures.length > 0) {
      console.log(`   Failures: ${failures.map(f => f.name).join(', ')}`)
    }

    return res.status(200).json({
      success: true,
      completedAt: new Date().toISOString(),
      mode: 'puppeteer',
      summary: {
        totalSources: summary.total,
        successful: summary.successful,
        failed: summary.failed,
        newUpdates: summary.newUpdates,
        timedOut: summary.timedOut || false,
        durationMs: duration
      },
      failures
    })
  } catch (error) {
    const duration = Date.now() - startTime

    console.error('❌ Puppeteer Refresh: Failed')
    console.error(`   Error: ${error.message}`)
    console.error(`   Duration: ${duration}ms`)

    return res.status(500).json({
      success: false,
      error: error.message,
      durationMs: duration
    })
  }
}
