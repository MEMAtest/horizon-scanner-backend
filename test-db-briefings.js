require('dotenv').config()
const db = require('./src/services/dbService')

async function testDatabaseBriefings() {
  console.log('Testing database briefings functionality...\n')

  // Wait for DB to initialize
  await new Promise(resolve => setTimeout(resolve, 1000))

  if (!db.pool) {
    console.error('❌ Database pool not available')
    console.log('DATABASE_URL configured:', !!process.env.DATABASE_URL)
    process.exit(1)
  }

  console.log('✅ Database pool available\n')

  try {
    // Test 1: List existing briefings
    console.log('Test 1: Listing existing briefings...')
    const briefings = await db.listWeeklyBriefings(5)
    console.log(`Found ${briefings.length} briefings`)
    briefings.forEach((b, i) => {
      console.log(`  ${i + 1}. ${b.id} - ${b.generatedAt}`)
    })
    console.log()

    // Test 2: Get latest briefing
    console.log('Test 2: Getting latest briefing...')
    const latest = await db.getLatestWeeklyBriefing()
    if (latest) {
      console.log(`✅ Latest briefing: ${latest.id}`)
      console.log(`   Generated: ${latest.generatedAt}`)
      console.log(`   Updates: ${latest.dataset?.currentUpdates?.length || 0}`)
    } else {
      console.log('⚠️  No briefings found in database')
    }
    console.log()

    // Test 3: Test save functionality
    console.log('Test 3: Testing save functionality...')
    const crypto = require('crypto')
    const testBriefing = {
      id: crypto.randomUUID(),
      generatedAt: new Date().toISOString(),
      dateRange: {
        start: '2025-01-18',
        end: '2025-01-25'
      },
      dataset: {
        currentUpdates: []
      },
      artifacts: {
        onePager: { html: '<p>Test</p>' },
        narrative: { html: '<p>Test narrative</p>' }
      },
      metadata: {
        test: true
      }
    }

    const saved = await db.saveWeeklyBriefing(testBriefing)
    if (saved) {
      console.log('✅ Test briefing saved successfully')

      // Verify we can retrieve it
      const retrieved = await db.getWeeklyBriefing(testBriefing.id)
      if (retrieved && retrieved.id === testBriefing.id) {
        console.log('✅ Test briefing retrieved successfully')
      } else {
        console.log('❌ Failed to retrieve test briefing')
      }
    } else {
      console.log('❌ Failed to save test briefing')
    }

    console.log('\n✅ All database tests completed')
    process.exit(0)

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

testDatabaseBriefings()
