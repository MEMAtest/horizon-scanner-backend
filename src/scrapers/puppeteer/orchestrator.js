function applyOrchestratorMethods(ServiceClass) {
  ServiceClass.prototype.scrapeAll = async function scrapeAll() {
    console.log('\n🚀 Starting Puppeteer scraping for all sources...')
    const allResults = []

    try {
      const fatfResults = await this.scrapeFATF()
      allResults.push(...fatfResults)

      const aquisResults = await this.scrapeAquis()
      allResults.push(...aquisResults)

      const lseResults = await this.scrapeLSE()
      allResults.push(...lseResults)

      const payukResults = await this.scrapePayUK()
      allResults.push(...payukResults)

      // International AML bodies
      const wolfsbergResults = await this.scrapeWolfsberg()
      allResults.push(...wolfsbergResults)

      const egmontResults = await this.scrapeEgmont()
      allResults.push(...egmontResults)

      console.log(`\n✅ Puppeteer scraping complete: ${allResults.length} total items`)

      return allResults
    } catch (error) {
      console.error('❌ Puppeteer scraping failed:', error)
      return allResults
    } finally {
      await this.closeBrowser()
    }
  }
}

module.exports = applyOrchestratorMethods
