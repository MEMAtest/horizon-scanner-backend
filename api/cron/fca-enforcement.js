// api/cron/fca-enforcement.js
// Serverless trigger for FCA enforcement fines scraping.
// Runs daily at 6 AM to check for new enforcement notices.
// Uses both publications search and year-based scraping for comprehensive coverage.

const FCAFinesScraper = require('../../src/services/fcaFinesScraper')
const axios = require('axios')
const cheerio = require('cheerio')
const { Pool } = require('pg')

module.exports = async (req, res) => {
  const startTime = Date.now()

  // Vercel Cron uses GET, manual triggers use POST - accept both
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).json({ success: false, error: 'Method Not Allowed' })
  }

  // Optional: Add authentication for manual triggers
  const authHeader = req.headers.authorization
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  // Check for database URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ FCA Enforcement: No DATABASE_URL configured')
    return res.status(500).json({
      success: false,
      error: 'Database not configured'
    })
  }

  let scraper = null
  let pool = null

  try {
    console.log('⚖️ FCA Enforcement: Starting incremental scrape...')

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })

    // STEP 1: Fetch latest from FCA publications search (most reliable for recent notices)
    console.log('📋 Step 1: Fetching from FCA publications search...')
    const searchResults = await fetchFromPublicationsSearch(pool)
    console.log(`   Found ${searchResults.total} notices, ${searchResults.new} new`)

    // STEP 2: Run traditional year-based scraper as backup (skip on Vercel - no Chrome)
    const isVercel = process.env.VERCEL === '1'
    const currentYear = new Date().getFullYear()
    let scraperResult = { totalFines: 0, newFines: 0, skipped: false }

    if (isVercel) {
      console.log('📋 Step 2: Skipping year-based scraper (Puppeteer not available on Vercel)')
      scraperResult.skipped = true
    } else {
      console.log('📋 Step 2: Running year-based scraper...')
      scraper = new FCAFinesScraper({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      })
      await scraper.initializeDatabase()

      const result = await scraper.startScraping({
        startYear: currentYear,
        endYear: currentYear,
        useHeadless: true,
        forceScrape: false
      })
      scraperResult = { totalFines: result.totalFines, newFines: result.newFines, skipped: false }
    }

    const duration = Date.now() - startTime
    const totalNew = searchResults.new + scraperResult.newFines

    console.log(`✅ FCA Enforcement: Completed in ${duration}ms`)
    console.log(`   Publications search: ${searchResults.new} new`)
    console.log(`   Year-based scraper: ${scraperResult.skipped ? 'skipped' : scraperResult.newFines + ' new'}`)
    console.log(`   Total new: ${totalNew}`)

    return res.status(200).json({
      success: true,
      completedAt: new Date().toISOString(),
      summary: {
        year: currentYear,
        publicationsSearch: searchResults,
        yearBasedScraper: scraperResult.skipped
          ? { skipped: true, reason: 'Puppeteer not available on Vercel' }
          : { total: scraperResult.totalFines, new: scraperResult.newFines },
        totalNew,
        durationMs: duration
      }
    })
  } catch (error) {
    const duration = Date.now() - startTime

    console.error('❌ FCA Enforcement: Failed')
    console.error(`   Error: ${error.message}`)
    console.error(`   Stack: ${error.stack}`)
    console.error(`   Duration: ${duration}ms`)

    return res.status(500).json({
      success: false,
      error: error.message,
      durationMs: duration
    })
  } finally {
    // Clean up database connections
    if (scraper && scraper.db) {
      try {
        await scraper.db.end()
      } catch (e) {
        console.warn('⚠️ Failed to close scraper database connection:', e.message)
      }
    }
    if (pool) {
      try {
        await pool.end()
      } catch (e) {
        console.warn('⚠️ Failed to close pool connection:', e.message)
      }
    }
  }
}

// Helper function to fetch latest notices from FCA publications search
async function fetchFromPublicationsSearch(pool) {
  const results = { total: 0, new: 0, errors: [] }

  try {
    const url = 'https://www.fca.org.uk/publications/search-results?category=notices%20and%20decisions-final%20notices&sort_by=dmetaZ'

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"macOS"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 30000
    })

    const $ = cheerio.load(response.data)
    const notices = []

    $('.search-item').each((i, el) => {
      const title = $(el).find('.search-item__clickthrough').text().trim()
      const link = $(el).find('.search-item__clickthrough').attr('href')
      const dateText = $(el).find('.meta-item.published-date').text().trim()

      if (title && link) {
        const dateMatch = dateText.match(/(\d{2})\/(\d{2})\/(\d{4})/)
        const date = dateMatch ? `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}` : null
        const fullUrl = link.startsWith('http') ? link : 'https://www.fca.org.uk' + link
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 30)

        notices.push({
          entity_name: title.replace(/^Final Notice \d{4}: /, ''),
          title: title,
          url: fullUrl,
          notice_date: date,
          publication_id: `fn-${(date || '2025-01-01').replace(/-/g, '')}-${slug}`
        })
      }
    })

    results.total = notices.length

    for (const notice of notices) {
      if (!notice.notice_date) continue

      // Check if already exists
      const existing = await pool.query(
        'SELECT 1 FROM fca_enforcement_notices WHERE entity_name = $1 AND notice_date = $2',
        [notice.entity_name, notice.notice_date]
      )

      if (existing.rows.length > 0) continue

      try {
        // Insert into publications index first
        await pool.query(
          `INSERT INTO fca_publications_index (publication_id, title, document_type, publication_date, url, pdf_url, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
           ON CONFLICT (publication_id) DO NOTHING`,
          [notice.publication_id, notice.title, 'final_notice', notice.notice_date, notice.url, notice.url, 'pending']
        )

        // Insert into enforcement notices
        await pool.query(
          `INSERT INTO fca_enforcement_notices (publication_id, entity_name, pdf_url, notice_date, outcome_type, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [notice.publication_id, notice.entity_name, notice.url, notice.notice_date, 'fine']
        )

        results.new++
      } catch (e) {
        results.errors.push({ entity: notice.entity_name, error: e.message })
      }
    }
  } catch (e) {
    console.error('❌ Publications search failed:', e.message)
    results.errors.push({ stage: 'fetch', error: e.message })
  }

  return results
}
