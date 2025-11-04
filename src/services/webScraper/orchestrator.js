const dbService = require('../dbService')
const { getSourcesByPriority } = require('../../sources/enhancedSources')

function applyOrchestratorMethods(ServiceClass) {
  ServiceClass.prototype.scrapeAllSources = async function() {
    console.log('🚀 Starting comprehensive data collection with ALL sources...')
    console.log('   Sources: FCA Advanced, FATF, International, TPR, SFO, RSS Feeds\n')

    this.resetStats()
    const allResults = []

    try {
      await dbService.initialize()
      console.log('✅ Database initialized\n')

      const fcaResults = await this.scrapeFCAAdvanced()
      allResults.push(...fcaResults)
      this.processingStats.bySource.FCA = {
        processed: fcaResults.length,
        errors: 0
      }

      const fatfResults = await this.scrapeFATF()
      allResults.push(...fatfResults)
      this.processingStats.bySource.FATF = {
        processed: fatfResults.length,
        errors: 0
      }

      const simpleResults = await this.scrapeSimpleSources()
      allResults.push(...simpleResults)

      const internationalResults = await this.scrapeInternationalSources()
      allResults.push(...internationalResults)

      const priorities = ['HIGH', 'MEDIUM', 'LOW']

      for (const priority of priorities) {
        const prioritySources = getSourcesByPriority(priority)

        for (const [sourceKey, sourceConfig] of Object.entries(prioritySources)) {
          if (['FATF', 'FCA'].includes(sourceKey)) continue

          try {
            console.log(`🎯 Processing ${sourceConfig.name} (${sourceConfig.country})`)

            const rssResults = await this.processRSSFeeds(sourceConfig)
            allResults.push(...rssResults)

            const scrapingResults = await this.performDeepScraping(sourceConfig)
            allResults.push(...scrapingResults)

            const total = rssResults.length + scrapingResults.length
            this.processingStats.bySource[sourceKey] = {
              processed: total,
              errors: 0
            }

            await this.wait(2000)
          } catch (error) {
            console.error(`❌ Failed to process ${sourceConfig.name}: ${error.message}`)
            this.processingStats.bySource[sourceKey] = {
              processed: 0,
              errors: 1
            }
          }
        }
      }

      console.log(`\n📝 Processing ${allResults.length} collected items...`)
      const finalResults = await this.processCollectedData(allResults)

      this.processingStats.processed = finalResults.length
      this.logComprehensiveStats()

      console.log(`\n🎉 Complete data collection finished: ${finalResults.length} items processed`)

      return finalResults
    } catch (error) {
      console.error('❌ Critical error in data collection:', error)
      this.logComprehensiveStats()
      throw error
    }
  }
}

module.exports = applyOrchestratorMethods
