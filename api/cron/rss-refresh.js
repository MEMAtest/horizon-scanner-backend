// api/cron/rss-refresh.js
// Serverless trigger for RSS feed refresh, intended for Vercel Cron.
// Fetches fresh regulatory updates from all configured RSS sources.

const rssFetcher = require('../../src/services/rssFetcher')

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
    console.log('🔄 RSS Refresh: Starting feed fetch...')

    // Fetch all RSS feeds with fast mode to stay within Vercel timeout (120s)
    const summary = await rssFetcher.fetchAllFeeds({
      fastMode: true,
      maxDurationMs: 100000, // Stop after 100s to leave buffer
      concurrency: 15, // Process 15 feeds in parallel
      timeoutMs: 8000 // 8s timeout per feed
    })

    const duration = Date.now() - startTime

    console.log(`✅ RSS Refresh: Completed in ${duration}ms`)
    console.log(`   Total sources: ${summary.total}`)
    console.log(`   Successful: ${summary.successful}`)
    console.log(`   Failed: ${summary.failed}`)
    console.log(`   New updates: ${summary.newUpdates}`)

    return res.status(200).json({
      success: true,
      completedAt: new Date().toISOString(),
      summary: {
        totalSources: summary.total,
        successful: summary.successful,
        failed: summary.failed,
        newUpdates: summary.newUpdates,
        durationMs: duration
      }
    })
  } catch (error) {
    const duration = Date.now() - startTime

    console.error('❌ RSS Refresh: Failed')
    console.error(`   Error: ${error.message}`)
    console.error(`   Duration: ${duration}ms`)

    return res.status(500).json({
      success: false,
      error: error.message,
      durationMs: duration
    })
  }
}
