// api/cron/fca-enforcement.js
// Serverless trigger for FCA enforcement fines scraping.
// Runs every 12 hours to check for new enforcement notices.
// Uses the existing FCAFinesScraper with current-year-only incremental mode.

const FCAFinesScraper = require('../../src/services/fcaFinesScraper')

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

  try {
    console.log('⚖️ FCA Enforcement: Starting incremental scrape...')

    // Initialize scraper with database config
    scraper = new FCAFinesScraper({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })

    // Initialize database schema if needed
    await scraper.initializeDatabase()

    // Only scrape current year for speed (incremental update)
    const currentYear = new Date().getFullYear()

    const result = await scraper.startScraping({
      startYear: currentYear,
      endYear: currentYear,
      useHeadless: true,
      forceScrape: false // Skip duplicates - only process new fines
    })

    const duration = Date.now() - startTime

    console.log(`✅ FCA Enforcement: Completed in ${duration}ms`)
    console.log(`   Total fines processed: ${result.totalFines}`)
    console.log(`   New fines added: ${result.newFines}`)
    if (result.errors && result.errors.length > 0) {
      console.log(`   Errors: ${result.errors.length}`)
    }

    return res.status(200).json({
      success: true,
      completedAt: new Date().toISOString(),
      summary: {
        year: currentYear,
        totalProcessed: result.totalFines,
        newFines: result.newFines,
        errors: result.errors?.length || 0,
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
    // Clean up database connection
    if (scraper && scraper.db) {
      try {
        await scraper.db.end()
      } catch (e) {
        console.warn('⚠️ Failed to close database connection:', e.message)
      }
    }
  }
}
