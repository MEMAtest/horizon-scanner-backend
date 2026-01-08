#!/usr/bin/env node
/**
 * FCA Fines Scraper - GitHub Actions Runner
 *
 * Scrapes FCA enforcement fines for the current year.
 * Run via: node scripts/run-fca-scraper.js
 *
 * Requires: DATABASE_URL environment variable
 */

const FCAFinesScraper = require('../src/services/fcaFinesScraper')

async function main() {
  console.log('='.repeat(60))
  console.log('FCA Fines Scraper - GitHub Actions')
  console.log('='.repeat(60))
  console.log(`Started at: ${new Date().toISOString()}`)
  console.log()

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required')
    process.exit(1)
  }

  const scraper = new FCAFinesScraper({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await scraper.initializeDatabase()
    console.log('✅ Database connected')

    const currentYear = new Date().getFullYear()
    console.log(`\n📅 Scraping year: ${currentYear}`)

    const result = await scraper.startScraping({
      startYear: currentYear,
      endYear: currentYear,
      useHeadless: true,
      forceScrape: false
    })

    console.log('\n' + '='.repeat(60))
    console.log('📊 RESULTS')
    console.log('='.repeat(60))
    console.log(`Total fines processed: ${result.totalFines}`)
    console.log(`New fines added: ${result.newFines}`)
    console.log(`Errors: ${result.errors?.length || 0}`)

    if (result.errors?.length > 0) {
      console.log('\n⚠️ Errors encountered:')
      result.errors.forEach(e => console.log(`  - ${e.year || 'Unknown'}: ${e.error}`))
    }

    console.log(`\nCompleted at: ${new Date().toISOString()}`)

    await scraper.db.end()
    process.exit(result.success ? 0 : 1)
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message)
    console.error(error.stack)

    if (scraper.db) {
      try { await scraper.db.end() } catch (e) { /* ignore */ }
    }
    process.exit(1)
  }
}

main()
