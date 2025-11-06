// api/cron/daily-digest.js
// Serverless trigger for the daily digest email, intended for Vercel Cron.
// ENHANCED: Fetches fresh regulatory data before building and sending digest

const { sendDailyDigest, parseRecipients } = require('../../src/services/dailyDigestService')

module.exports = async (req, res) => {
  const startTime = Date.now()

  // Vercel Cron uses GET, manual triggers use POST - accept both
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', ['GET', 'POST'])
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
    // Skip data refresh on Vercel cron (causes timeout, rely on scheduled RSS fetcher)
    console.log('📧 DailyDigest: Building and sending digest email from existing database...')
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
