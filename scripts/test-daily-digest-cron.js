#!/usr/bin/env node
// scripts/test-daily-digest-cron.js
// Test script for the enhanced daily digest cron job with data refresh

require('dotenv').config()

async function testDailyDigestCron() {
  console.log('🧪 Testing Enhanced Daily Digest Cron Job')
  console.log('=' .repeat(60))
  console.log('')

  // Load the cron handler
  const cronHandler = require('../api/cron/daily-digest.js')

  // Create mock request and response objects
  const mockReq = {
    method: 'POST',
    headers: {
      authorization: process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : undefined
    }
  }

  let responseStatus = 200
  let responseData = null

  const mockRes = {
    status: (code) => {
      responseStatus = code
      return mockRes
    },
    json: (data) => {
      responseData = data
      console.log('\n📋 Cron Job Response:')
      console.log('Status:', responseStatus)
      console.log(JSON.stringify(data, null, 2))
    },
    setHeader: () => {}
  }

  // Check environment variables
  console.log('🔍 Environment Configuration:')
  console.log(`   ENABLE_DAILY_DIGEST: ${process.env.ENABLE_DAILY_DIGEST}`)
  console.log(`   AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? '✓ Configured' : '✗ Missing'}`)
  console.log(`   AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? '✓ Configured' : '✗ Missing'}`)
  console.log(`   AWS_SES_REGION: ${process.env.AWS_SES_REGION || process.env.AWS_REGION || 'eu-west-2 (default)'}`)
  console.log(`   DAILY_DIGEST_RECIPIENTS: ${process.env.DAILY_DIGEST_RECIPIENTS || '✗ Not set'}`)
  console.log(`   CRON_SECRET: ${process.env.CRON_SECRET ? '✓ Configured' : '✗ Not set'}`)
  console.log(`   DIGEST_PERSONA: ${process.env.DIGEST_PERSONA || 'Executive (default)'}`)
  console.log('')

  // Validate configuration
  if (process.env.ENABLE_DAILY_DIGEST !== 'true') {
    console.log('⚠️ WARNING: ENABLE_DAILY_DIGEST is not set to "true"')
    console.log('   The cron job will return a 409 error')
    console.log('')
  }

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.log('⚠️ WARNING: AWS credentials are not configured')
    console.log('   The cron job will return a 500 error')
    console.log('')
  }

  if (!process.env.DAILY_DIGEST_RECIPIENTS) {
    console.log('⚠️ WARNING: DAILY_DIGEST_RECIPIENTS is not configured')
    console.log('   The cron job will return a 500 error')
    console.log('')
  }

  console.log('🚀 Executing cron handler...')
  console.log('')

  const startTime = Date.now()

  try {
    await cronHandler(mockReq, mockRes)

    const duration = Date.now() - startTime
    console.log('')
    console.log('=' .repeat(60))
    console.log(`✅ Test completed in ${duration}ms`)

    if (responseData && responseData.success) {
      console.log('')
      console.log('📊 Summary:')
      console.log(`   Insights sent: ${responseData.insightCount}`)
      console.log(`   Recipients: ${responseData.recipients?.length || 0}`)

      if (responseData.dataRefresh) {
        console.log('')
        console.log('📡 Data Refresh:')
        console.log(`   Attempted: ${responseData.dataRefresh.attempted}`)
        console.log(`   Success: ${responseData.dataRefresh.success}`)
        console.log(`   New updates: ${responseData.dataRefresh.newUpdates}`)
        console.log(`   Sources processed: ${responseData.dataRefresh.totalProcessed}`)
        console.log(`   Duration: ${responseData.dataRefresh.duration}ms`)

        if (responseData.dataRefresh.error) {
          console.log(`   Error: ${responseData.dataRefresh.error}`)
        }
      }

      if (responseData.performance) {
        console.log('')
        console.log('⏱️ Performance:')
        console.log(`   Data refresh: ${responseData.performance.dataRefreshMs}ms`)
        console.log(`   Digest build: ${responseData.performance.digestBuildMs}ms`)
        console.log(`   Total: ${responseData.performance.totalMs}ms`)
      }
    } else {
      console.log('')
      console.log('❌ Test failed:')
      console.log(`   Error: ${responseData?.error || 'Unknown error'}`)
    }

    console.log('=' .repeat(60))

  } catch (error) {
    const duration = Date.now() - startTime
    console.log('')
    console.log('=' .repeat(60))
    console.log(`❌ Test failed after ${duration}ms`)
    console.error('Error:', error.message)
    console.error(error.stack)
    console.log('=' .repeat(60))
    process.exit(1)
  }
}

// Run the test
if (require.main === module) {
  testDailyDigestCron()
    .then(() => {
      console.log('\n✅ Test script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Test script failed:', error)
      process.exit(1)
    })
}

module.exports = testDailyDigestCron
