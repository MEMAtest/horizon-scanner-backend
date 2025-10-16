#!/usr/bin/env node

/**
 * scripts/send-daily-digest.js
 * Utility script to trigger the daily digest on demand.
 *
 * Usage:
 *   RESEND_API_KEY=... DAILY_DIGEST_RECIPIENTS="alice@example.com" node scripts/send-daily-digest.js
 */

require('dotenv').config()

const { sendDailyDigest } = require('../src/services/dailyDigestService')

async function main() {
  try {
    const recipientsEnv = process.env.DAILY_DIGEST_RECIPIENTS
    const recipients = recipientsEnv ? recipientsEnv.split(',').map(email => email.trim()).filter(Boolean) : []

    if (recipients.length === 0) {
      throw new Error('No recipients provided. Set DAILY_DIGEST_RECIPIENTS="user@example.com"')
    }

    const persona = process.env.DIGEST_PERSONA || 'Executive'

    console.log(`📬 Sending daily digest to ${recipients.length} recipient(s) as ${persona} view...`)
    const result = await sendDailyDigest({
      recipients,
      persona,
      brand: {
        title: process.env.DIGEST_BRAND_TITLE,
        footer: process.env.DIGEST_BRAND_FOOTER
      }
    })

    console.log('✅ Digest dispatched:', result)
    process.exit(0)
  } catch (error) {
    console.error('❌ Failed to send daily digest:', error.message)
    process.exit(1)
  }
}

main()
