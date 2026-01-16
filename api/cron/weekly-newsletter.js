// api/cron/weekly-newsletter.js
// Serverless trigger for the weekly analytical newsletter

const { sendWeeklyNewsletter } = require('../../src/services/weeklyNewsletterService')

module.exports = async (req, res) => {
  const startTime = Date.now()

  // Vercel Cron uses GET, manual triggers use POST - accept both
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).json({ success: false, error: 'Method Not Allowed' })
  }

  // Auth check for non-Vercel cron requests
  const authHeader = req.headers.authorization
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  try {
    console.log('📬 Weekly Newsletter: Starting generation...')

    // Use same recipients as daily digest, or separate weekly list
    const recipients = process.env.WEEKLY_NEWSLETTER_RECIPIENTS ||
                       process.env.DAILY_DIGEST_RECIPIENTS

    if (!recipients) {
      return res.status(200).json({
        success: false,
        skipped: true,
        reason: 'No recipients configured (set WEEKLY_NEWSLETTER_RECIPIENTS or DAILY_DIGEST_RECIPIENTS)'
      })
    }

    const result = await sendWeeklyNewsletter({
      recipients,
      brand: {
        title: process.env.DIGEST_BRAND_TITLE || 'RegCanary',
        footer: process.env.DIGEST_BRAND_FOOTER || 'RegCanary — Regulatory Intelligence for Financial Services'
      }
    })

    const duration = Date.now() - startTime

    if (result.skipped) {
      return res.status(200).json({
        success: true,
        skipped: true,
        reason: result.reason,
        durationMs: duration
      })
    }

    console.log(`✅ Weekly Newsletter: Sent to ${result.recipients?.length || 0} recipient(s)`)

    return res.status(200).json({
      success: true,
      completedAt: new Date().toISOString(),
      durationMs: duration,
      articleCount: result.articleCount,
      recipients: result.recipients,
      generatedAt: result.generatedAt
    })
  } catch (error) {
    console.error('❌ Weekly Newsletter failed:', error.message)

    return res.status(500).json({
      success: false,
      error: error.message,
      durationMs: Date.now() - startTime
    })
  }
}
