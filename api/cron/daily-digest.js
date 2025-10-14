// api/cron/daily-digest.js
// Serverless trigger for the daily digest email, intended for Vercel Cron.

const { sendDailyDigest, parseRecipients } = require('../../src/services/dailyDigestService')

module.exports = async (req, res) => {
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

  try {
    const result = await sendDailyDigest({
      recipients,
      persona: process.env.DIGEST_PERSONA,
      brand: {
        title: process.env.DIGEST_BRAND_TITLE,
        footer: process.env.DIGEST_BRAND_FOOTER
      }
    })

    return res.status(200).json({
      success: true,
      dispatchedAt: new Date().toISOString(),
      insightCount: result.insightCount || 0,
      recipients: result.recipients
    })
  } catch (error) {
    console.error('DailyDigest Cron handler failed:', error)
    return res.status(500).json({ success: false, error: error.message })
  }
}
