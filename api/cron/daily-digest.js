// api/cron/daily-digest.js
// Serverless trigger for the daily digest email, intended for Vercel Cron.
// ENHANCED: Fetches fresh regulatory data before building and sending digest

const { sendDailyDigest, parseRecipients } = require('../../src/services/dailyDigestService')

module.exports = async (req, res) => {
  const startTime = Date.now()

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ success: false, error: 'Method Not Allowed' })
  }

  const authHeader = req.headers.authorization
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  if (process.env.ENABLE_DAILY_DIGEST !== 'true') {
    return res.status(409).json({ success: false, error: 'Daily digest scheduling disabled' })
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ success: false, error: 'RESEND_API_KEY not configured' })
  }

  const recipients = parseRecipients(process.env.DAILY_DIGEST_RECIPIENTS)
  if (recipients.length === 0) {
    return res.status(500).json({ success: false, error: 'DAILY_DIGEST_RECIPIENTS not configured' })
  }

  // Track data refresh results
  let dataRefreshResults = {
    attempted: false,
    success: false,
    newUpdates: 0,
    totalProcessed: 0,
    duration: 0,
    error: null
  }

  try {
    // STEP 1: Fetch fresh regulatory data
    console.log('📡 DailyDigest: Starting data refresh before digest generation...')
    const refreshStartTime = Date.now()

    try {
      const rssFetcher = require('../../src/services/rssFetcher')
      dataRefreshResults.attempted = true

      const fetchResults = await rssFetcher.fetchAllFeeds()

      dataRefreshResults.success = true
      dataRefreshResults.newUpdates = fetchResults.newUpdates || 0
      dataRefreshResults.totalProcessed = fetchResults.total || 0
      dataRefreshResults.duration = Date.now() - refreshStartTime

      console.log(`✅ DailyDigest: Data refresh completed in ${dataRefreshResults.duration}ms`)
      console.log(`   📊 New updates: ${dataRefreshResults.newUpdates}`)
      console.log(`   📊 Sources processed: ${dataRefreshResults.totalProcessed}`)
    } catch (refreshError) {
      // Log error but continue with digest using existing data
      dataRefreshResults.error = refreshError.message
      dataRefreshResults.duration = Date.now() - refreshStartTime

      console.error('⚠️ DailyDigest: Data refresh failed, proceeding with existing data')
      console.error(`   Error: ${refreshError.message}`)
      console.error(`   Duration before failure: ${dataRefreshResults.duration}ms`)
    }

    // STEP 2: Build and send digest with fresh (or existing) data
    console.log('📧 DailyDigest: Building and sending digest email...')
    const digestStartTime = Date.now()

    const result = await sendDailyDigest({
      recipients,
      persona: process.env.DIGEST_PERSONA,
      brand: {
        title: process.env.DIGEST_BRAND_TITLE,
        footer: process.env.DIGEST_BRAND_FOOTER
      }
    })

    const digestDuration = Date.now() - digestStartTime
    const totalDuration = Date.now() - startTime

    console.log(`✅ DailyDigest: Email sent successfully in ${digestDuration}ms`)
    console.log(`⏱️ DailyDigest: Total execution time: ${totalDuration}ms`)

    return res.status(200).json({
      success: true,
      dispatchedAt: new Date().toISOString(),
      insightCount: result.insightCount || 0,
      recipients: result.recipients,
      dataRefresh: dataRefreshResults,
      performance: {
        dataRefreshMs: dataRefreshResults.duration,
        digestBuildMs: digestDuration,
        totalMs: totalDuration
      }
    })
  } catch (error) {
    const totalDuration = Date.now() - startTime

    console.error('❌ DailyDigest: Cron handler failed')
    console.error(`   Error: ${error.message}`)
    console.error(`   Duration: ${totalDuration}ms`)

    return res.status(500).json({
      success: false,
      error: error.message,
      dataRefresh: dataRefreshResults,
      performance: {
        totalMs: totalDuration
      }
    })
  }
}
