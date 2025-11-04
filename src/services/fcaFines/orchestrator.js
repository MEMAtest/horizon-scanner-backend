const puppeteer = require('puppeteer')

function applyOrchestratorMethods(ServiceClass) {
  ServiceClass.prototype.startScraping = async function(options = {}) {
    const {
      startYear = 2013,
      endYear = new Date().getFullYear(),
      useHeadless = true,
      forceScrape = false
    } = options

    console.log(`🕷️ Starting FCA fines scraping from ${startYear} to ${endYear}...`)

    const scrapeLogId = await this.startScrapingLog()

    let totalFines = 0
    let newFines = 0
    const errors = []

    try {
      for (let year = startYear; year <= endYear; year++) {
        console.log(`📅 Scraping year ${year}...`)

        try {
          const yearResults = await this.scrapeYear(year, useHeadless, forceScrape)
          totalFines += yearResults.total
          newFines += yearResults.new

          console.log(`✅ Year ${year} completed: ${yearResults.total} fines found, ${yearResults.new} new`)
        } catch (error) {
          console.error(`❌ Error scraping year ${year}:`, error.message)
          errors.push({ year, error: error.message })
        }

        if (year < endYear) {
          await this.delay(this.requestDelay)
        }
      }

      await this.completeScrapingLog(scrapeLogId, {
        status: 'completed',
        totalFines,
        newFines,
        errors: errors.length > 0 ? JSON.stringify(errors) : null
      })

      console.log('🎉 FCA fines scraping completed!')
      console.log(`   📊 Total fines processed: ${totalFines}`)
      console.log(`   🆕 New fines added: ${newFines}`)
      if (errors.length > 0) {
        console.log(`   ⚠️ Errors encountered: ${errors.length}`)
      }

      return {
        success: true,
        totalFines,
        newFines,
        errors
      }
    } catch (error) {
      await this.completeScrapingLog(scrapeLogId, {
        status: 'failed',
        errors: error.message
      })
      throw error
    }
  }

  ServiceClass.prototype.scrapeYear = async function(year, useHeadless = true, forceScrape = false) {
    let browser
    let totalFines = 0
    let newFines = 0

    try {
      console.log(`   📋 Attempting structured scraping for ${year}...`)
      const structuredFines = await this.scrapeStructuredFinesPage(year, useHeadless)

      if (Array.isArray(structuredFines) && structuredFines.length > 0) {
        console.log(`   📋 Found ${structuredFines.length} fines via structured page for ${year}`)
        totalFines = structuredFines.length

        for (const fine of structuredFines) {
          const saved = await this.saveFine(fine, forceScrape)
          if (saved.isNew) newFines++
        }

        return { total: totalFines, new: newFines }
      }

      console.log(`   📰 Structured scraping found no results, trying news feeds for ${year}...`)
      const newsResults = await this.scrapeNewsFeeds(year)
      if (newsResults && Array.isArray(newsResults.fines) && newsResults.fines.length > 0) {
        console.log(`   📰 Found ${newsResults.fines.length} fines via news feeds for ${year}`)

        for (const fine of newsResults.fines) {
          const saved = await this.saveFine(fine, forceScrape)
          totalFines++
          if (saved.isNew) newFines++
        }

        return { total: totalFines, new: newFines }
      }

      console.log(`   🤖 Using Puppeteer for year ${year}...`)
      browser = await puppeteer.launch({
        headless: useHeadless ? 'new' : false,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      })

      const page = await browser.newPage()
      await page.setUserAgent(this.userAgent)
      await page.setViewport({ width: 1920, height: 1080 })
      page.setDefaultTimeout(30000)

      const searchUrls = [
        `${this.baseUrl}/news?search=fine+${year}&type=news`,
        `${this.baseUrl}/news?search=enforcement+${year}&type=news`,
        `${this.baseUrl}/news?search=penalty+${year}&type=news`
      ]

      for (const url of searchUrls) {
        try {
          console.log(`   🔍 Searching: ${url}`)
          await page.goto(url, { waitUntil: 'networkidle0' })

          const fines = await this.extractFinesFromPage(page, year)

          for (const fine of fines) {
            const saved = await this.saveFine(fine, forceScrape)
            totalFines++
            if (saved.isNew) newFines++
          }

          await this.delay(this.requestDelay)
        } catch (error) {
          console.error(`   ⚠️ Error processing URL ${url}:`, error.message)
        }
      }
    } finally {
      if (browser) {
        await browser.close()
      }
    }

    return { total: totalFines, new: newFines }
  }
}

module.exports = applyOrchestratorMethods
