const cheerio = require('cheerio')
const dataQualityService = require('../dataQualityService')
const contentProcessor = require('../contentProcessor')

function applyFcaMethods(ServiceClass) {
  ServiceClass.prototype.scrapeFCAAdvanced = async function() {
    console.log('🏛️ Starting FCA advanced scraping...')
    const allResults = []

    try {
      for (const [targetKey, targetConfig] of Object.entries(this.fcaConfig.scrapingTargets)) {
        console.log(`   📋 Scraping FCA ${targetConfig.name}...`)

        try {
          const results = await this.scrapeFCATarget(targetConfig, targetKey)
          allResults.push(...results)
          console.log(`   ✅ FCA ${targetConfig.name}: ${results.length} items`)

          await this.wait(this.fcaConfig.rateLimit)
        } catch (error) {
          console.error(`   ❌ Failed to scrape FCA ${targetConfig.name}: ${error.message}`)
        }
      }

      const qualityResults = await dataQualityService.processDataQuality(allResults)
      const processedResults = await contentProcessor.processBatch(qualityResults)

      console.log(`✅ FCA advanced scraping complete: ${processedResults.length} items`)
      this.processingStats.byType.fca = processedResults.length

      return processedResults
    } catch (error) {
      console.error('❌ FCA advanced scraping failed:', error)
      return []
    }
  }

  ServiceClass.prototype.scrapeFCATarget = async function(targetConfig, targetKey) {
    const results = []

    for (const baseUrl of targetConfig.urls) {
      try {
        const pageResults = await this.scrapeFCAPages(baseUrl, targetConfig, targetKey)
        results.push(...pageResults)
        await this.wait(1000)
      } catch (error) {
        console.error(`❌ Failed to process FCA URL ${baseUrl}: ${error.message}`)
      }
    }

    return results
  }

  ServiceClass.prototype.scrapeFCAPages = async function(baseUrl, targetConfig, targetKey) {
    const results = []
    let currentPage = 1
    const maxPages = targetConfig.pagination?.maxPages || 5

    while (currentPage <= maxPages) {
      try {
        const pageUrl = this.buildPageUrl(baseUrl, currentPage)

        const response = await this.makeRequest(pageUrl)
        const $ = cheerio.load(response.data)

        const container = $(targetConfig.selectors.container)
        if (container.length === 0) break

        const items = $(targetConfig.selectors.items)
        if (items.length === 0) break

        for (let i = 0; i < items.length; i++) {
          try {
            const item = items.eq(i)
            const extractedData = await this.extractFCAItemData(item, targetConfig.selectors, targetKey, $)

            if (extractedData) {
              results.push(extractedData)
            }
          } catch (error) {
            console.error(`❌ Failed to extract FCA item: ${error.message}`)
          }
        }

        if (targetConfig.pagination && currentPage < maxPages) {
          const nextPageExists = $(targetConfig.pagination.nextPage).length > 0
          if (!nextPageExists) break
        }

        currentPage++
        if (currentPage <= maxPages) {
          await this.wait(1500)
        }
      } catch (error) {
        console.error(`❌ Failed to scrape FCA page ${currentPage}: ${error.message}`)
        break
      }
    }

    return results
  }

  ServiceClass.prototype.extractFCAItemData = async function(item, selectors, targetKey, $) {
    try {
      const title = this.extractText(item, selectors.title, $)
      const url = this.extractUrl(item, selectors.url, this.fcaConfig.baseUrl, $)
      const date = this.extractDate(item, selectors.date, $)
      const summary = this.extractText(item, selectors.summary, $)

      const deadline = selectors.deadline ? this.extractDate(item, selectors.deadline, $) : null
      const speaker = selectors.speaker ? this.extractText(item, selectors.speaker, $) : null
      const status = selectors.status ? this.extractText(item, selectors.status, $) : null
      const reference = selectors.reference ? this.extractText(item, selectors.reference, $) : null
      const firm = selectors.firm ? this.extractText(item, selectors.firm, $) : null
      const documentType = selectors.documentType ? this.extractText(item, selectors.documentType, $) : null

      if (!title || !url) return null

      const itemData = {
        headline: title.trim(),
        url: this.normalizeUrl(url),
        authority: this.fcaConfig.authority,
        area: targetKey,
        source_category: 'fca_advanced_scraping',
        source_description: `FCA - ${this.fcaConfig.scrapingTargets[targetKey].name}`,
        fetched_date: new Date().toISOString(),
        published_date: date ? new Date(date).toISOString() : null,
        raw_data: {
          scrapingTarget: targetKey,
          originalDate: date,
          summary: summary?.trim(),
          deadline,
          speaker: speaker?.trim(),
          status: status?.trim(),
          reference: reference?.trim(),
          firm: firm?.trim(),
          documentType: documentType?.trim(),
          fullTitle: title.trim(),
          fcaSpecific: {
            extractedFrom: this.fcaConfig.scrapingTargets[targetKey].name,
            hasDeadline: !!deadline,
            hasReference: !!reference,
            isEnforcement: targetKey === 'enforcementNotices',
            isConsultation: targetKey === 'consultations'
          }
        }
      }

      return itemData
    } catch (error) {
      console.error(`❌ Failed to extract FCA item data: ${error.message}`)
      return null
    }
  }
}

module.exports = applyFcaMethods
