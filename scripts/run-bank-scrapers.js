#!/usr/bin/env node
/**
 * Bank News Scrapers - GitHub Actions Runner
 *
 * Scrapes news from major banks using Puppeteer.
 * Run via: node scripts/run-bank-scrapers.js
 *
 * Requires: DATABASE_URL environment variable
 */

const puppeteerScraper = require('../src/scrapers/puppeteerScraper')
const { Pool } = require('pg')

// Banks to scrape (Puppeteer-based only)
const BANKS_TO_SCRAPE = [
  'JPMorgan',
  'BofA',
  'Citigroup',
  'WellsFargo',
  'Goldman',
  'MorganStanley',
  'HSBC',
  'Barclays',
  'DeutscheBank',
  'UBS',
  // UK Banks
  'Lloyds',
  'NatWest',
  'SantanderUK',
  'Nationwide',
  'TSB',
  'Monzo',
  'Starling',
  'Revolut',
  'MetroBank',
  'VirginMoney'
]

async function saveToDatabase(pool, items) {
  let saved = 0
  let skipped = 0

  for (const item of items) {
    try {
      // Check if already exists
      const existing = await pool.query(
        'SELECT 1 FROM regulatory_updates WHERE url = $1',
        [item.url]
      )

      if (existing.rows.length > 0) {
        skipped++
        continue
      }

      // Insert new item
      await pool.query(
        `INSERT INTO regulatory_updates
         (headline, url, authority, area, source_category, source_description, fetched_date, published_date, raw_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          item.headline,
          item.url,
          item.authority,
          item.area || 'Bank News',
          item.source_category || 'bank_news',
          item.source_description,
          item.fetched_date,
          item.published_date,
          JSON.stringify(item.raw_data || {})
        ]
      )
      saved++
    } catch (error) {
      console.error(`  Error saving ${item.headline?.substring(0, 50)}:`, error.message)
    }
  }

  return { saved, skipped }
}

async function main() {
  console.log('='.repeat(60))
  console.log('Bank News Scrapers - GitHub Actions')
  console.log('='.repeat(60))
  console.log(`Started at: ${new Date().toISOString()}`)
  console.log(`Banks to scrape: ${BANKS_TO_SCRAPE.length}`)
  console.log()

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required')
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  const results = {
    total: 0,
    saved: 0,
    skipped: 0,
    errors: []
  }

  try {
    // Test database connection
    await pool.query('SELECT 1')
    console.log('✅ Database connected\n')

    for (const bank of BANKS_TO_SCRAPE) {
      console.log(`\n🏦 Scraping ${bank}...`)

      try {
        const methodName = `scrape${bank}`
        if (typeof puppeteerScraper[methodName] !== 'function') {
          console.log(`  ⚠️ No scraper method found: ${methodName}`)
          continue
        }

        const items = await puppeteerScraper[methodName]()
        console.log(`  📰 Found ${items.length} items`)

        if (items.length > 0) {
          const { saved, skipped } = await saveToDatabase(pool, items)
          console.log(`  💾 Saved: ${saved}, Skipped (duplicates): ${skipped}`)

          results.total += items.length
          results.saved += saved
          results.skipped += skipped
        }

        // Small delay between banks
        await new Promise(r => setTimeout(r, 2000))
      } catch (error) {
        console.error(`  ❌ Error: ${error.message}`)
        results.errors.push({ bank, error: error.message })
      }
    }

    // Close browser
    await puppeteerScraper.closeBrowser()

    console.log('\n' + '='.repeat(60))
    console.log('📊 RESULTS')
    console.log('='.repeat(60))
    console.log(`Total items found: ${results.total}`)
    console.log(`New items saved: ${results.saved}`)
    console.log(`Duplicates skipped: ${results.skipped}`)
    console.log(`Errors: ${results.errors.length}`)

    if (results.errors.length > 0) {
      console.log('\n⚠️ Errors encountered:')
      results.errors.forEach(e => console.log(`  - ${e.bank}: ${e.error}`))
    }

    console.log(`\nCompleted at: ${new Date().toISOString()}`)

    await pool.end()
    process.exit(results.errors.length > BANKS_TO_SCRAPE.length / 2 ? 1 : 0)
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message)
    console.error(error.stack)

    await pool.end()
    process.exit(1)
  }
}

main()
