#!/usr/bin/env node
// Preview Daily Digest Email
// Generates a preview of the daily digest email for testing

const fs = require('fs')
const path = require('path')
const dailyDigestService = require('../src/services/dailyDigestService')

async function previewDigest() {
  console.log('📧 Generating Daily Digest Preview...\n')

  try {
    // Use extended window for testing (7 days = 168 hours) to capture existing data
    const TESTING_WINDOW_HOURS = parseInt(process.env.DIGEST_ROLLING_WINDOW_HOURS) || 168
    const digestDate = new Date()

    console.log(`📅 Digest Date: ${digestDate.toISOString()}`)
    console.log(`⏰ Rolling Window: ${TESTING_WINDOW_HOURS} hours (${TESTING_WINDOW_HOURS / 24} days)\n`)

    // Build the digest payload
    console.log('🔧 Building digest payload...')
    const payload = await dailyDigestService.buildDigestPayload({
      digestDate,
      rollingWindowHours: TESTING_WINDOW_HOURS,
      limit: 200, // Increased to account for digest history filtering
      personaLabel: process.env.DIGEST_PERSONA || 'Executive',
      brand: {
        title: process.env.DIGEST_BRAND_TITLE || 'MEMA Regulatory Intelligence',
        footer: process.env.DIGEST_BRAND_FOOTER || 'Sent for QA – not for redistribution.'
      }
    })

    console.log(`✅ Payload built successfully`)
    console.log(`📊 Insights found: ${payload.insights.length}`)
    console.log(`📈 Metrics:`)
    console.log(`   - HIGH IMPACT: ${payload.metrics.highCount}`)
    console.log(`   - ENFORCEMENT: ${payload.metrics.mediumCount}`)
    console.log(`   - MONITOR: ${payload.metrics.lowCount}`)
    console.log(`   - AUTHORITIES: ${payload.metrics.uniqueAuthorities}\n`)

    if (payload.insights.length > 0) {
      console.log('📝 Sample insights:')
      payload.insights.slice(0, 3).forEach((insight, i) => {
        console.log(`   ${i + 1}. ${insight.headline || 'Untitled'} (Score: ${insight.relevanceScore})`)
      })
      console.log()
    }

    // Generate email HTML
    console.log('📧 Generating email HTML...')
    const { buildDailyDigestEmail } = require('../src/templates/emails/dailyDigestEmail-classic')
    const email = buildDailyDigestEmail({
      date: digestDate,
      summary: payload.summary,
      insights: payload.insights,
      metrics: payload.metrics,
      personaLabel: payload.personaLabel,
      brand: payload.brand
    })

    // Save HTML preview
    const previewPath = path.join(__dirname, '../tmp/digest-preview.html')
    const tmpDir = path.dirname(previewPath)

    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true })
    }

    fs.writeFileSync(previewPath, email.html)
    console.log(`✅ HTML preview saved to: ${previewPath}`)

    // Save text version
    const textPath = path.join(__dirname, '../tmp/digest-preview.txt')
    fs.writeFileSync(textPath, email.text)
    console.log(`✅ Text preview saved to: ${textPath}`)

    // Save JSON payload for debugging
    const jsonPath = path.join(__dirname, '../tmp/digest-payload.json')
    fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2))
    console.log(`✅ JSON payload saved to: ${jsonPath}`)

    console.log(`\n📊 Summary:`)
    console.log(`   Subject: ${email.subject}`)
    console.log(`   HTML Size: ${(email.html.length / 1024).toFixed(2)} KB`)
    console.log(`   Text Size: ${(email.text.length / 1024).toFixed(2)} KB`)
    console.log(`\n✅ Preview generation complete!`)
    console.log(`\n💡 Tip: Open ${previewPath} in your browser to see the email`)

  } catch (error) {
    console.error('❌ Error generating digest preview:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Run preview
previewDigest()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
