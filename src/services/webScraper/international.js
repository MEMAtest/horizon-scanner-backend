const cheerio = require('cheerio')
const Parser = require('rss-parser')
const { INTERNATIONAL_SOURCES } = require('../../sources/enhancedSources')

function applyInternationalMethods(ServiceClass) {
  ServiceClass.prototype.scrapeInternationalSources = async function() {
    console.log('🌍 Starting international regulatory sources scraping...')
    const allResults = []

    for (const [sourceKey, sourceConfig] of Object.entries(INTERNATIONAL_SOURCES)) {
      console.log(`   🌍 Processing ${sourceConfig.name} (${sourceConfig.country})`)

      try {
        const rssResults = await this.processInternationalRSS(sourceConfig, sourceKey)
        allResults.push(...rssResults)

        const scrapingResults = await this.processInternationalDeepScraping(sourceConfig, sourceKey)
        allResults.push(...scrapingResults)

        const total = rssResults.length + scrapingResults.length
        console.log(`   ✅ ${sourceConfig.name}: ${total} items`)

        await this.wait(sourceConfig.scrapingConfig?.rateLimit || 4000)
      } catch (error) {
        console.error(`   ❌ Failed to process ${sourceConfig.name}: ${error.message}`)
      }
    }

    this.processingStats.byType.international = allResults.length
    return allResults
  }

  ServiceClass.prototype.processInternationalRSS = async function(sourceConfig, sourceKey) {
    const results = []

    if (!sourceConfig.rssFeeds || sourceConfig.rssFeeds.length === 0) {
      return results
    }

    for (const feedConfig of sourceConfig.rssFeeds) {
      try {
        const response = await this.makeRequest(feedConfig.url)
        const parser = new Parser()
        const feed = await parser.parseString(response.data)

        for (const item of feed.items) {
          const itemData = {
            headline: item.title?.trim(),
            url: item.link,
            authority: sourceConfig.authority,
            area: feedConfig.type,
            source_category: 'international_rss',
            source_description: `${sourceConfig.name} - ${feedConfig.description}`,
            fetched_date: new Date().toISOString(),
            published_date: item.pubDate ? new Date(item.pubDate).toISOString() : null,
            raw_data: {
              sourceType: 'rss',
              sourceKey,
              country: sourceConfig.country,
              priority: sourceConfig.priority,
              originalDate: item.pubDate,
              summary: item.contentSnippet?.trim(),
              content: item.content?.trim(),
              fullTitle: item.title?.trim(),
              international: {
                isInternational: true,
                sourceAuthority: sourceConfig.authority,
                sourceCountry: sourceConfig.country,
                feedType: feedConfig.type
              }
            }
          }

          results.push(itemData)
        }
      } catch (error) {
        console.error(`❌ Failed to process RSS feed ${feedConfig.url}: ${error.message}`)
      }
    }

    return results
  }

  ServiceClass.prototype.processInternationalDeepScraping = async function(sourceConfig, sourceKey) {
    const results = []

    if (!sourceConfig.deepScraping) {
      return results
    }

    for (const [scrapingType, config] of Object.entries(sourceConfig.deepScraping)) {
      try {
        const response = await this.makeRequest(config.url)
        const $ = cheerio.load(response.data)

        const items = $(config.selectors.items)

        for (let i = 0; i < items.length; i++) {
          const item = items.eq(i)

          const title = this.extractText(item, config.selectors.title, $)
          const url = this.extractInternationalUrl(item, config.selectors.url, sourceConfig.baseUrl, $)
          const date = this.extractText(item, config.selectors.date, $)
          const summary = this.extractText(item, config.selectors.summary, $)

          if (title && url) {
            const itemData = {
              headline: title.trim(),
              url,
              authority: sourceConfig.authority,
              area: scrapingType,
              source_category: 'international_scraping',
              source_description: `${sourceConfig.name} - ${scrapingType}`,
              fetched_date: new Date().toISOString(),
              published_date: date ? new Date(date).toISOString() : null,
              raw_data: {
                sourceType: 'scraping',
                sourceKey,
                scrapingType,
                country: sourceConfig.country,
                priority: sourceConfig.priority,
                originalDate: date,
                summary: summary?.trim(),
                fullTitle: title.trim(),
                international: {
                  isInternational: true,
                  sourceAuthority: sourceConfig.authority,
                  sourceCountry: sourceConfig.country,
                  scrapingTarget: scrapingType
                }
              }
            }

            results.push(itemData)
          }
        }

        await this.wait(2000)
      } catch (error) {
        console.error(`❌ Failed to scrape ${scrapingType} from ${sourceConfig.name}: ${error.message}`)
      }
    }

    return results
  }
}

module.exports = applyInternationalMethods
