// Test script for FATF, Aquis, and LSE Puppeteer scrapers
// Run with: node test-puppeteer-scrapers.js

const puppeteerScraper = require('./src/scrapers/puppeteerScraper')

async function testScrapers() {
  console.log('\n🚀 Testing Puppeteer Scrapers for FATF, Aquis, and LSE\n')
  console.log('=' .repeat(70))

  const results = {
    fatf: { success: false, items: 0, error: null },
    aquis: { success: false, items: 0, error: null },
    lse: { success: false, items: 0, error: null }
  }

  // Test FATF
  console.log('\n🌍 Testing FATF Scraper...\n')
  try {
    const fatfItems = await puppeteerScraper.scrapeFATF()
    results.fatf.success = true
    results.fatf.items = fatfItems.length

    console.log(`✅ FATF: Successfully scraped ${fatfItems.length} items`)

    if (fatfItems.length > 0) {
      const sample = fatfItems[0]
      console.log('\n📄 Sample FATF Item:')
      console.log(`   Title: ${sample.headline}`)
      console.log(`   URL: ${sample.url}`)
      console.log(`   Authority: ${sample.authority}`)
      console.log(`   Content: ${sample.raw_data?.fullContent?.slice(0, 150)}...`)
    }
  } catch (error) {
    results.fatf.error = error.message
    console.error(`❌ FATF failed: ${error.message}`)
  }

  // Test Aquis
  console.log('\n\n📊 Testing Aquis Exchange Scraper...\n')
  try {
    const aquisItems = await puppeteerScraper.scrapeAquis()
    results.aquis.success = true
    results.aquis.items = aquisItems.length

    console.log(`✅ Aquis: Successfully scraped ${aquisItems.length} items`)

    if (aquisItems.length > 0) {
      const sample = aquisItems[0]
      console.log('\n📄 Sample Aquis Item:')
      console.log(`   Title: ${sample.headline}`)
      console.log(`   URL: ${sample.url}`)
      console.log(`   Authority: ${sample.authority}`)
      console.log(`   Company: ${sample.raw_data?.company}`)
      console.log(`   Date: ${sample.raw_data?.originalDate}`)
    }
  } catch (error) {
    results.aquis.error = error.message
    console.error(`❌ Aquis failed: ${error.message}`)
  }

  // Test LSE
  console.log('\n\n📈 Testing LSE Scraper...\n')
  try {
    const lseItems = await puppeteerScraper.scrapeLSE()
    results.lse.success = true
    results.lse.items = lseItems.length

    console.log(`✅ LSE: Successfully scraped ${lseItems.length} items`)

    if (lseItems.length > 0) {
      const sample = lseItems[0]
      console.log('\n📄 Sample LSE Item:')
      console.log(`   Title: ${sample.headline}`)
      console.log(`   URL: ${sample.url}`)
      console.log(`   Authority: ${sample.authority}`)
      console.log(`   Content: ${sample.raw_data?.fullContent?.slice(0, 150)}...`)
    }
  } catch (error) {
    results.lse.error = error.message
    console.error(`❌ LSE failed: ${error.message}`)
  }

  // Close browser
  await puppeteerScraper.closeBrowser()

  // Print summary
  console.log('\n\n' + '='.repeat(70))
  console.log('📊 TEST SUMMARY')
  console.log('='.repeat(70))

  console.log(`\n🌍 FATF:`)
  console.log(`   Status: ${results.fatf.success ? '✅ SUCCESS' : '❌ FAILED'}`)
  console.log(`   Items: ${results.fatf.items}`)
  if (results.fatf.error) console.log(`   Error: ${results.fatf.error}`)

  console.log(`\n📊 Aquis Exchange:`)
  console.log(`   Status: ${results.aquis.success ? '✅ SUCCESS' : '❌ FAILED'}`)
  console.log(`   Items: ${results.aquis.items}`)
  if (results.aquis.error) console.log(`   Error: ${results.aquis.error}`)

  console.log(`\n📈 LSE:`)
  console.log(`   Status: ${results.lse.success ? '✅ SUCCESS' : '❌ FAILED'}`)
  console.log(`   Items: ${results.lse.items}`)
  if (results.lse.error) console.log(`   Error: ${results.lse.error}`)

  const successCount = [results.fatf.success, results.aquis.success, results.lse.success].filter(Boolean).length
  const totalItems = results.fatf.items + results.aquis.items + results.lse.items

  console.log(`\n🎯 Overall Results:`)
  console.log(`   Success Rate: ${successCount}/3 scrapers`)
  console.log(`   Total Items: ${totalItems}`)

  console.log('\n' + '='.repeat(70))

  if (successCount === 3) {
    console.log('\n✅ ALL TESTS PASSED! All 3 scrapers are working correctly.\n')
    process.exit(0)
  } else {
    console.log('\n⚠️  SOME TESTS FAILED. Please review errors above.\n')
    process.exit(1)
  }
}

// Run tests
testScrapers().catch(error => {
  console.error('\n❌ Test execution failed:', error)
  process.exit(1)
})
