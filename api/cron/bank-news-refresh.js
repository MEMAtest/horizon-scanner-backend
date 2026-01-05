// api/cron/bank-news-refresh.js
// Serverless trigger for Bank News refresh, intended for Vercel Cron.

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
    console.log('🏦 Bank News Refresh: Starting bank feed fetch...')

    const summary = await rssFetcher.fetchAllFeeds({ sourceCategory: 'bank_news' })

    const duration = Date.now() - startTime

    console.log(`✅ Bank News Refresh: Completed in ${duration}ms`)
    console.log(`   Total sources: ${summary.total}`)
    console.log(`   Successful: ${summary.successful}`)
    console.log(`   Failed: ${summary.failed}`)
    console.log(`   New updates: ${summary.newUpdates}`)

    return res.status(200).json({
      success: true,
      completedAt: new Date().toISOString(),
      sourceCategory: 'bank_news',
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

    console.error('❌ Bank News Refresh: Failed')
    console.error(`   Error: ${error.message}`)
    console.error(`   Duration: ${duration}ms`)

    return res.status(500).json({
      success: false,
      error: error.message,
      durationMs: duration
    })
  }
}
