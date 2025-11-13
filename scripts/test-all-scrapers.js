#!/usr/bin/env node
// Comprehensive test script for all data sources (RSS feeds, web scrapers, Puppeteer)
require('dotenv').config()

const rssFetcher = require('../src/services/rssFetcher')
const puppeteerScraper = require('../src/scrapers/puppeteerScraper')

async function testAllScrapers() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('   COMPREHENSIVE SCRAPER TEST')
  console.log('═══════════════════════════════════════════════════════════════\n')

  const startTime = Date.now()
  const results = {
    total: 0,
    successful: 0,
    failed: 0,
    byType: {
      rss: { total: 0, success: 0, failed: 0 },
      web_scraping: { total: 0, success: 0, failed: 0 },
      puppeteer: { total: 0, success: 0, failed: 0 }
    },
    sources: []
  }

  try {
    // Get all feed sources
    console.log('📊 Step 1: Loading feed sources configuration...\n')
    const feedSources = rssFetcher.getFeedSources()
    results.total = feedSources.length

    console.log(`Found ${feedSources.length} active sources:`)
    console.log(`   📰 RSS feeds: ${feedSources.filter(s => s.type === 'rss').length}`)
    console.log(`   🌐 Web scraping: ${feedSources.filter(s => s.type === 'web_scraping').length}`)
    console.log(`   🤖 Puppeteer: ${feedSources.filter(s => s.type === 'puppeteer').length}`)
    console.log()

    console.log('═══════════════════════════════════════════════════════════════')
    console.log('📊 Step 2: Testing ALL sources (this may take a few minutes)...\n')

    // Test all sources using the orchestrator
    const fetchResult = await rssFetcher.fetchAllFeeds({ fastMode: false })

    console.log('\n✅ Fetch Complete!\n')
    console.log('═══════════════════════════════════════════════════════════════')
    console.log('📊 Step 3: Analyzing Results\n')

    // Calculate statistics
    results.successful = fetchResult.successful || 0
    results.failed = fetchResult.failed || 0

    console.log('Overall Results:')
    console.log(`   ✅ Successful: ${results.successful}/${results.total}`)
    console.log(`   ❌ Failed: ${results.failed}/${results.total}`)
    console.log(`   📝 New Updates: ${fetchResult.newUpdates || 0}`)
    console.log()

    // Show breakdown by authority
    if (fetchResult.byAuthority) {
      console.log('═══════════════════════════════════════════════════════════════')
      console.log('📊 Results by Authority:\n')

      const authorities = Object.entries(fetchResult.byAuthority)
        .sort((a, b) => b[1].count - a[1].count)

      authorities.forEach(([authority, data]) => {
        const status = data.success ? '✅' : '❌'
        const count = data.count || 0
        console.log(`${status} ${authority}: ${count} items`)
      })
      console.log()
    }

    // Test Puppeteer scrapers specifically
    console.log('═══════════════════════════════════════════════════════════════')
    console.log('📊 Step 4: Testing Puppeteer Scrapers Individually\n')

    const puppeteerTests = [
      { name: 'FATF', fn: () => puppeteerScraper.scrapeFATFPuppeteer() },
      { name: 'Aquis Exchange', fn: () => puppeteerScraper.scrapeAquisExchange() },
      { name: 'LSE RNS', fn: () => puppeteerScraper.scrapeLSE() },
      { name: 'Pay.UK', fn: () => puppeteerScraper.scrapePayUK() }
    ]

    for (const test of puppeteerTests) {
      try {
        console.log(`Testing ${test.name}...`)
        const items = await test.fn()
        console.log(`   ✅ ${test.name}: ${items.length} items`)
      } catch (error) {
        console.log(`   ❌ ${test.name}: ${error.message}`)
      }
    }
    console.log()

    // Final summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log('═══════════════════════════════════════════════════════════════')
    console.log('✅ COMPREHENSIVE TEST COMPLETE')
    console.log('═══════════════════════════════════════════════════════════════\n')
    console.log(`Duration: ${duration}s`)
    console.log(`Total Sources: ${results.total}`)
    console.log(`Successful: ${results.successful}`)
    console.log(`Failed: ${results.failed}`)
    console.log(`Success Rate: ${((results.successful / results.total) * 100).toFixed(1)}%`)
    console.log()

    // Recommendations
    if (results.failed > 0) {
      console.log('💡 Recommendations:')
      console.log('   - Check failed sources for network issues or structure changes')
      console.log('   - Review logs above for specific error messages')
      console.log('   - Some failures may be temporary (retry later)')
      console.log()
    }

    process.exit(results.failed === 0 ? 0 : 1)
  } catch (error) {
    console.error('═══════════════════════════════════════════════════════════════')
    console.error('❌ TEST FAILED')
    console.error('═══════════════════════════════════════════════════════════════\n')
    console.error('Error:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  }
}

testAllScrapers()
