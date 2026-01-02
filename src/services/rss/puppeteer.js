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
        case 'Pay.UK':
          scraperResults = await puppeteerScraper.scrapePayUK()
          break
        case 'JMLSG':
          scraperResults = await puppeteerScraper.scrapeJMLSG()
          break
        case 'ASA':
        case 'Advertising Standards Authority':
          scraperResults = await puppeteerScraper.scrapeASA()
          break
        case 'WOLFSBERG':
        case 'Wolfsberg Group':
          scraperResults = await puppeteerScraper.scrapeWolfsberg()
          break
        case 'EIOPA':
          scraperResults = await puppeteerScraper.scrapeEIOPA()
          break
        case 'IOSCO':
          scraperResults = await puppeteerScraper.scrapeIOSCO()
          break
        case 'EGMONT':
        case 'Egmont Group':
          scraperResults = await puppeteerScraper.scrapeEgmont()
          break
        case 'DFSA':
        case 'Dubai Financial Services Authority':
          scraperResults = await puppeteerScraper.scrapeDFSA()
          break
        case 'ADGM':
        case 'Abu Dhabi Global Market':
          scraperResults = await puppeteerScraper.scrapeADGM()
          break
        case 'CBUAE':
        case 'Central Bank of UAE':
          scraperResults = await puppeteerScraper.scrapeCBUAE()
          break
        case 'SAMA':
        case 'Saudi Arabian Monetary Authority':
          scraperResults = await puppeteerScraper.scrapeSAMA()
          break
        case 'SARB':
        case 'South African Reserve Bank':
          scraperResults = await puppeteerScraper.scrapeSARB()
          break
        case 'RBI':
        case 'Reserve Bank of India':
          scraperResults = await puppeteerScraper.scrapeRBI()
          break
        case 'CIMA':
        case 'Cayman Islands Monetary Authority':
          scraperResults = await puppeteerScraper.scrapeCIMA()
          break
        case 'APRA':
        case 'Australian Prudential Regulation Authority':
          scraperResults = await puppeteerScraper.scrapeAPRA()
          break
        case 'AUSTRAC':
        case 'Australian Transaction Reports and Analysis Centre':
          scraperResults = await puppeteerScraper.scrapeAUSTRAC()
          break
        case 'NCA':
        case 'National Crime Agency':
          scraperResults = await puppeteerScraper.scrapeNCA()
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
