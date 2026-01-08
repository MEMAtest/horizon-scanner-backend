// api/cron/daily-digest.js
// Serverless trigger for the daily digest email + FCA enforcement scrape.
// Combines both tasks to stay within Hobby plan's 2 cron limit.

const { sendDailyDigest, parseRecipients } = require('../../src/services/dailyDigestService')
const FCAFinesScraper = require('../../src/services/fcaFinesScraper')
const rssFetcher = require('../../src/services/rssFetcher')

/**
 * Run FCA enforcement scrape (current year only for speed)
 */
async function runFcaEnforcementScrape() {
  if (!process.env.DATABASE_URL) {
    console.log('⚠️ FCA Enforcement: Skipping - no DATABASE_URL')
    return { skipped: true, reason: 'No DATABASE_URL' }
  }

  let scraper = null
  try {
    console.log('⚖️ FCA Enforcement: Starting incremental scrape...')

    scraper = new FCAFinesScraper({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })

    await scraper.initializeDatabase()

    const currentYear = new Date().getFullYear()
    const result = await scraper.startScraping({
      startYear: currentYear,
      endYear: currentYear,
      useHeadless: true,
      forceScrape: false
    })

    console.log(`✅ FCA Enforcement: ${result.newFines} new fines found`)
    return {
      success: true,
      totalProcessed: result.totalFines,
      newFines: result.newFines,
      errors: result.errors?.length || 0
    }
  } catch (error) {
    console.error('❌ FCA Enforcement failed:', error.message)
    return { success: false, error: error.message }
  } finally {
    if (scraper?.db) {
      try { await scraper.db.end() } catch (e) { /* ignore */ }
    }
  }
}

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

  const results = {
    enforcement: null,
    dataRefresh: null,
    digest: null
  }
  const performance = {
    dataRefreshMs: null,
    digestBuildMs: null,
    totalMs: null
  }

  // 1. Run FCA Enforcement scrape (skip by default - fca-enforcement cron runs at 9:05 AM)
  // Note: Puppeteer doesn't work on Vercel serverless, so this would fail anyway
  const skipFca = process.env.SKIP_DIGEST_FCA !== 'false'
  if (skipFca) {
    console.log('⚖️ FCA Enforcement: Skipping (runs separately at 9:05 AM)')
    results.enforcement = { skipped: true, reason: 'Skipped by default (separate cron at 9:05 AM)' }
  } else {
    try {
      results.enforcement = await runFcaEnforcementScrape()
    } catch (error) {
      results.enforcement = { success: false, error: error.message }
    }
  }

  // 2. Refresh regulatory data before building digest (skip by default - rss-refresh runs at 9:00 AM)
  // Note: Skipping saves ~60+ seconds since data is already fresh from the 9 AM cron
  const skipRefresh = process.env.SKIP_DIGEST_REFRESH !== 'false'
  const refreshStart = Date.now()

  if (skipRefresh) {
    console.log('📡 DailyDigest: Skipping data refresh (runs separately at 9:00 AM)')
    results.dataRefresh = { skipped: true, reason: 'Skipped by default (separate cron at 9:00 AM)' }
  } else {
    try {
      console.log('📡 DailyDigest: Starting data refresh before digest generation...')
      const summary = await rssFetcher.fetchAllFeeds({ fastMode: true })
      const refreshDuration = Date.now() - refreshStart

      results.dataRefresh = {
        attempted: true,
        success: true,
        newUpdates: summary.newUpdates,
        totalProcessed: summary.total,
        successful: summary.successful,
        failed: summary.failed,
        durationMs: refreshDuration
      }
      performance.dataRefreshMs = refreshDuration

      console.log(`✅ DailyDigest: Data refresh completed in ${refreshDuration}ms`)
      console.log(`   📊 New updates: ${summary.newUpdates}`)
    } catch (error) {
      const refreshDuration = Date.now() - refreshStart
      results.dataRefresh = {
        attempted: true,
        success: false,
        error: error.message,
        durationMs: refreshDuration
      }
      performance.dataRefreshMs = refreshDuration
      console.warn('⚠️ DailyDigest: Data refresh failed, proceeding with existing data')
      console.warn(`   Error: ${error.message}`)
    }
  }

  // 3. Send daily digest email
  if (process.env.ENABLE_DAILY_DIGEST !== 'true') {
    results.digest = { skipped: true, reason: 'ENABLE_DAILY_DIGEST not true' }
  } else if (!process.env.RESEND_API_KEY) {
    results.digest = { skipped: true, reason: 'RESEND_API_KEY not configured' }
  } else {
    const recipients = parseRecipients(process.env.DAILY_DIGEST_RECIPIENTS)
    if (recipients.length === 0) {
      results.digest = { skipped: true, reason: 'No recipients configured' }
    } else {
      try {
        console.log('📧 DailyDigest: Building and sending digest email...')
        const digestStart = Date.now()

        const digestResult = await sendDailyDigest({
          recipients,
          persona: process.env.DIGEST_PERSONA,
          brand: {
            title: process.env.DIGEST_BRAND_TITLE,
            footer: process.env.DIGEST_BRAND_FOOTER
          }
        })
        performance.digestBuildMs = Date.now() - digestStart

        console.log(`✅ DailyDigest: Email sent to ${recipients.length} recipients`)
        results.digest = {
          success: true,
          insightCount: digestResult.insightCount || 0,
          recipients: digestResult.recipients
        }
      } catch (error) {
        console.error('❌ DailyDigest failed:', error.message)
        results.digest = { success: false, error: error.message }
      }
    }
  }

  const duration = Date.now() - startTime
  performance.totalMs = duration
  const overallSuccess = (results.enforcement?.success || results.enforcement?.skipped) &&
                         (results.digest?.success || results.digest?.skipped)
  const insightCount = results.digest?.insightCount || 0
  const recipients = results.digest?.recipients || []

  return res.status(overallSuccess ? 200 : 500).json({
    success: overallSuccess,
    completedAt: new Date().toISOString(),
    durationMs: duration,
    insightCount,
    recipients,
    dataRefresh: results.dataRefresh,
    performance,
    results
  })
}
