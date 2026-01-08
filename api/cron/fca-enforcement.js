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

// Helper function to fetch latest notices from FCA RSS feed
async function fetchFromPublicationsSearch(pool) {
  const results = { total: 0, new: 0, errors: [] }

  try {
    // Use RSS feed instead of web scraping (bypasses Cloudflare)
    const url = 'https://www.fca.org.uk/news/rss.xml'

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/rss+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 30000
    })

    console.log(`   FCA RSS response status: ${response.status}`)
    const $ = cheerio.load(response.data, { xmlMode: true })
    const notices = []

    // Look for enforcement-related items (fines, final notices)
    $('item').each((i, el) => {
      const title = $(el).find('title').text().trim()
      const link = $(el).find('link').text().trim()
      const pubDate = $(el).find('pubDate').text().trim()
      const description = $(el).find('description').text().trim().toLowerCase()

      // Filter for enforcement actions (fines, final notices, penalties)
      const isEnforcement = title.toLowerCase().includes('fine') ||
                           title.toLowerCase().includes('penalty') ||
                           title.toLowerCase().includes('final notice') ||
                           description.includes('fine') ||
                           description.includes('penalty') ||
                           description.includes('enforcement')

      if (title && link && isEnforcement) {
        // Parse date from "Wednesday, January 7, 2026 - 09:06" format
        const dateMatch = pubDate.match(/(\w+),\s+(\w+)\s+(\d+),\s+(\d{4})/)
        let date = null
        if (dateMatch) {
          const months = { January: '01', February: '02', March: '03', April: '04', May: '05', June: '06',
                          July: '07', August: '08', September: '09', October: '10', November: '11', December: '12' }
          const month = months[dateMatch[2]] || '01'
          const day = dateMatch[3].padStart(2, '0')
          const year = dateMatch[4]
          date = `${year}-${month}-${day}`
        }

        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 30)

        notices.push({
          entity_name: title.replace(/^FCA fines /, '').replace(/^FCA /, ''),
          title: title,
          url: link,
          notice_date: date,
          publication_id: `fn-${(date || '2026-01-01').replace(/-/g, '')}-${slug}`
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
