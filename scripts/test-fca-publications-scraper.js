#!/usr/bin/env node
// scripts/test-fca-publications-scraper.js
// Test script for FCA publications scraping (Dear CEO letters, etc.)

const fcaAdvancedScraper = require('../src/scrapers/fcaAdvancedScraper')

async function testFCAPublicationsScraper() {
  console.log('🧪 Testing FCA Publications Scraper (Dear CEO Letters & More)')
  console.log('='.repeat(70))
  console.log('')

  const startTime = Date.now()

  try {
    // Test individual scraping targets
    const targetsToTest = [
      'dearCEOLetters',
      'marketWatch',
      'portfolioLetters',
      'supervisoryNotices',
      'thematicReviews',
      'discussionPapers',
      'regulatoryRoundups',
      'occasionalPapers'
    ]

    const results = {}

    for (const targetKey of targetsToTest) {
      const targetConfig = fcaAdvancedScraper.scrapingTargets[targetKey]

      if (!targetConfig) {
        console.log(`⚠️  Target "${targetKey}" not found in scraper configuration`)
        continue
      }

      console.log(`\n📋 Testing: ${targetConfig.name}`)
      console.log(`   URL: ${targetConfig.urls[0]}`)
      console.log(`   Scraping...`)

      try {
        const items = await fcaAdvancedScraper.scrapeTarget(targetConfig, targetKey)

        results[targetKey] = {
          success: true,
          itemCount: items.length,
          items: items.slice(0, 3) // Store first 3 items for inspection
        }

        console.log(`   ✅ Success: ${items.length} items found`)

        if (items.length > 0) {
          console.log(`   Sample item:`)
          console.log(`      - ${items[0].headline.substring(0, 80)}...`)
          console.log(`      - URL: ${items[0].url}`)
          if (items[0].raw_data?.sector) {
            console.log(`      - Sector: ${items[0].raw_data.sector}`)
          }
          if (items[0].raw_data?.topic) {
            console.log(`      - Topic: ${items[0].raw_data.topic}`)
          }
        }
      } catch (error) {
        results[targetKey] = {
          success: false,
          error: error.message
        }
        console.log(`   ❌ Failed: ${error.message}`)
      }

      // Rate limiting between tests
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    const duration = Date.now() - startTime
    const minutes = Math.floor(duration / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)

    console.log('')
    console.log('='.repeat(70))
    console.log('📊 TEST SUMMARY')
    console.log('='.repeat(70))
    console.log('')

    const successCount = Object.values(results).filter(r => r.success).length
    const totalTests = Object.keys(results).length

    console.log(`Total Tests: ${totalTests}`)
    console.log(`✅ Passed: ${successCount}`)
    console.log(`❌ Failed: ${totalTests - successCount}`)
    console.log(`⏱️  Duration: ${minutes}m ${seconds}s`)
    console.log('')

    console.log('RESULTS BY TARGET:')
    console.log('')

    Object.entries(results).forEach(([key, result]) => {
      const icon = result.success ? '✅' : '❌'
      const status = result.success
        ? `${result.itemCount} items found`
        : `Error: ${result.error}`

      console.log(`${icon} ${fcaAdvancedScraper.scrapingTargets[key]?.name || key}`)
      console.log(`   ${status}`)
    })

    console.log('')
    console.log('='.repeat(70))

    if (successCount === totalTests) {
      console.log('✅ ALL TESTS PASSED!')
      process.exit(0)
    } else {
      console.log(`⚠️  ${totalTests - successCount} test(s) failed`)
      process.exit(1)
    }

  } catch (error) {
    const duration = Date.now() - startTime
    console.log('')
    console.log('='.repeat(70))
    console.log(`❌ Test suite failed after ${duration}ms`)
    console.error('Error:', error.message)
    console.error(error.stack)
    console.log('='.repeat(70))
    process.exit(1)
  }
}

// Run the test
if (require.main === module) {
  testFCAPublicationsScraper()
    .catch((error) => {
      console.error('\n❌ Test script failed:', error)
      process.exit(1)
    })
}

module.exports = testFCAPublicationsScraper
