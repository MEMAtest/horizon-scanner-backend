// api/cron/web-scraping-refresh.js
// Slow-mode cron for medium/low priority web scrapers that are skipped by rss-refresh (fastMode).
// Runs without fastMode, filtered to web_scraping type only, excludes bank_news.

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
    console.log('🌐 Web Scraping Refresh: Starting slow-mode web scraper fetch...')

    const summary = await rssFetcher.fetchAllFeeds({
      // No fastMode — allows medium/low priority web scrapers
      typeFilter: 'web_scraping',
      excludeSourceCategory: 'bank_news', // Bank news has its own cron
      maxDurationMs: 95000, // Stop at 95s to leave buffer for response
      concurrency: 15, // Higher concurrency since each scraper is independent
      timeoutMs: 10000 // 10s per source to avoid slow ones blocking the batch
    })

    const duration = Date.now() - startTime

    // Extract per-source failures for visibility
    const failures = summary.bySource
      ? Object.values(summary.bySource)
          .filter(s => s.status === 'error' || s.status === 'empty')
          .map(s => ({ name: s.name, authority: s.authority, status: s.status, error: s.error || null, durationMs: s.durationMs }))
      : []

    console.log(`✅ Web Scraping Refresh: Completed in ${duration}ms`)
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
      mode: 'web_scraping_slow',
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

    console.error('❌ Web Scraping Refresh: Failed')
    console.error(`   Error: ${error.message}`)
    console.error(`   Duration: ${duration}ms`)

    return res.status(500).json({
      success: false,
      error: error.message,
      durationMs: duration
    })
  }
}
