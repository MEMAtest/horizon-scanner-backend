function applyPuppeteerMethods(ServiceClass, { puppeteerScraper }) {
  ServiceClass.prototype.fetchPuppeteer = async function fetchPuppeteer(source) {
    try {
      console.log(`🤖 Puppeteer scraping for ${source.name} (${source.authority})...`)

      let scraperResults = []

      switch (source.authority) {
        case 'FATF':
          scraperResults = await puppeteerScraper.scrapeFATF()
          break
        case 'AQUIS':
        case 'Aquis Exchange':
          scraperResults = await puppeteerScraper.scrapeAquis()
          break
        case 'LSE':
        case 'London Stock Exchange':
          scraperResults = await puppeteerScraper.scrapeLSE()
          break
        default:
          console.log(`⚠️ No Puppeteer scraper configured for ${source.authority}`)
          return []
      }

      console.log(`✅ ${source.name}: Found ${scraperResults.length} items via Puppeteer`)
      return scraperResults
    } catch (error) {
      console.error(`❌ Puppeteer scraping failed for ${source.name}:`, error.message)
      return []
    }
  }
}

module.exports = applyPuppeteerMethods
