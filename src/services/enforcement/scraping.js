async function initialize() {
  if (this.isInitialized) return

  try {
    console.log('🚀 Initializing FCA Enforcement Service...')

    // Initialize database schema
    await this.scraper.initializeDatabase()

    // Check if data exists, if not run initial scraping
    const existingData = await this.db.query('SELECT COUNT(*) FROM fca_fines')
    const fineCount = parseInt(existingData.rows[0].count)

    if (fineCount === 0) {
      console.log('📊 No existing fines data found, running initial scraping...')
      await this.runInitialScraping()
    } else {
      console.log(`📊 Found ${fineCount} existing fines in database`)
    }

    this.isInitialized = true
    console.log('✅ FCA Enforcement Service initialized successfully')
  } catch (error) {
    console.error('❌ Error initializing FCA Enforcement Service:', error)
    throw error
  }
}

async function runInitialScraping(options = {}) {
  const {
    startYear = 2013, // Start from 2013 to get full historical data
    endYear = new Date().getFullYear(),
    processWithAI = true
  } = options

  console.log(`🕷️ Running initial FCA fines scraping (${startYear}-${endYear})...`)

  try {
    // Run scraping
    const scrapingResults = await this.scraper.startScraping({
      startYear,
      endYear,
      useHeadless: true,
      forceScrape: false
    })

    console.log(`📊 Scraping completed: ${scrapingResults.totalFines} fines, ${scrapingResults.newFines} new`)

    // Process with AI if requested and we have new data
    if (processWithAI && scrapingResults.newFines > 0) {
      console.log('🤖 Processing new fines with AI...')
      const aiResults = await this.aiService.processUnanalyzedFines(scrapingResults.newFines)
      console.log(`🤖 AI processing completed: ${aiResults.processed} analyzed`)
    }

    return scrapingResults
  } catch (error) {
    console.error('❌ Error in initial scraping:', error)
    throw error
  }
}

async function updateEnforcementData() {
  console.log('🔄 Updating FCA enforcement data...')

  try {
    // Run incremental scraping for current year
    const currentYear = new Date().getFullYear()
    const results = await this.scraper.startScraping({
      startYear: currentYear,
      endYear: currentYear,
      useHeadless: true,
      forceScrape: false
    })

    // Process any new fines with AI
    if (results.newFines > 0) {
      console.log(`🤖 Processing ${results.newFines} new fines with AI...`)
      await this.aiService.processUnanalyzedFines(results.newFines)
    }

    // Update trends and insights
    await this.updateTrends()

    return {
      success: true,
      totalFines: results.totalFines,
      newFines: results.newFines,
      processed: true
    }
  } catch (error) {
    console.error('❌ Error updating enforcement data:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Method to be called by the main Horizon Scanner scheduler
async function runScheduledUpdate() {
  console.log('⏰ Running scheduled FCA enforcement update...')

  try {
    if (!this.isInitialized) {
      await this.initialize()
    }

    const results = await this.updateEnforcementData()

    console.log('✅ Scheduled enforcement update completed')
    return results
  } catch (error) {
    console.error('❌ Scheduled enforcement update failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

async function close() {
  await this.db.end()
  await this.scraper.close()
  await this.aiService.close()
}

module.exports = {
  initialize,
  runInitialScraping,
  updateEnforcementData,
  runScheduledUpdate,
  close
}
