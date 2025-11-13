#!/usr/bin/env node
// Test script for Financial Ombudsman Service (FOS) scraper
const webScraper = require('../src/services/webScraper')

async function testFOSScraper() {
  console.log('🧪 Testing Financial Ombudsman Service (FOS) Scraper\n')
  console.log('═══════════════════════════════════════════════════════════════\n')

  try {
    console.log('📡 Scraping FOS website...\n')
    const startTime = Date.now()

    const updates = await webScraper.scrapeFOS()

    const duration = Date.now() - startTime

    console.log(`✅ Scraping completed in ${duration}ms\n`)
    console.log('═══════════════════════════════════════════════════════════════\n')
    console.log(`📊 Results: ${updates.length} articles found\n`)

    if (updates.length === 0) {
      console.log('❌ WARNING: No updates found - scraper may be broken!')
      console.log('   Possible issues:')
      console.log('   - Website structure changed')
      console.log('   - CSS selectors outdated')
      console.log('   - Network/connectivity issues')
      process.exit(1)
    }

    console.log('Sample Articles:\n')
    updates.slice(0, 5).forEach((item, i) => {
      console.log(`${i + 1}. ${item.title || item.headline}`)
      console.log(`   Date: ${item.date || item.publishedDate || 'Unknown'}`)
      console.log(`   URL: ${item.url}`)
      console.log(`   Summary: ${(item.summary || 'No summary').substring(0, 100)}...`)
      console.log()
    })

    console.log('═══════════════════════════════════════════════════════════════')
    console.log('✅ FOS Scraper Status: WORKING')
    console.log('═══════════════════════════════════════════════════════════════\n')

    process.exit(0)
  } catch (error) {
    console.error('═══════════════════════════════════════════════════════════════')
    console.error('❌ FOS Scraper Status: FAILED')
    console.error('═══════════════════════════════════════════════════════════════\n')
    console.error('Error:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  }
}

testFOSScraper()
