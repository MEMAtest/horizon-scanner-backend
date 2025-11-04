const cheerio = require('cheerio')
const Parser = require('rss-parser')

function applySimpleSourceMethods(ServiceClass) {
  ServiceClass.prototype.scrapeSimpleSources = async function() {
    console.log('📋 Scraping simple sources (TPR, SFO)...')
    const results = []

    try {
      const tprResults = await this.scrapePensionRegulator()
      results.push(...tprResults)
      console.log(`   ✅ TPR: ${tprResults.length} items`)
    } catch (error) {
      console.error(`   ❌ TPR scraping failed: ${error.message}`)
    }

    try {
      const sfoResults = await this.scrapeSFO()
      results.push(...sfoResults)
      console.log(`   ✅ SFO: ${sfoResults.length} items`)
    } catch (error) {
      console.error(`   ❌ SFO scraping failed: ${error.message}`)
    }

    this.processingStats.byType.simple = results.length
    return results
  }

  ServiceClass.prototype.scrapePensionRegulator = async function() {
    const base = 'https://www.thepensionsregulator.gov.uk/en/media-hub/press-releases'
    try {
      const response = await this.makeRequest(base)
      const $ = cheerio.load(response.data)
      const results = []

      $('.press-release-item,.news-item,.article-item,article,.content-item').each((_, el) => {
        const a = $(el).find('h3 a,h2 a,h4 a,a.title').first()
        const title = a.text().trim()
        let href = a.attr('href') || ''
        if (href && !href.startsWith('http')) href = new URL(href, base).href
        const dateText = $(el).find('time,.date,.published').text()
        const date = this.parseDate(dateText)

        if (title && href && this.isRecent(date, 30)) {
          results.push({
            headline: title,
            url: href,
            authority: 'TPR',
            area: 'press_release',
            source_category: 'tpr_news',
            source_description: 'The Pensions Regulator - Press Releases',
            fetched_date: new Date().toISOString(),
            published_date: date,
            raw_data: {
              originalDate: dateText,
              fullTitle: title
            }
          })
        }
      })

      return results
    } catch (error) {
      console.error('TPR scraping error:', error.message)
      return []
    }
  }

  ServiceClass.prototype.scrapeSFO = async function() {
    const feedUrl = 'https://www.gov.uk/government/organisations/serious-fraud-office.atom'
    const rss = new Parser()

    try {
      const feed = await rss.parseURL(feedUrl)
      const results = []

      feed.items.forEach(item => {
        const date = item.pubDate ? new Date(item.pubDate).toISOString() : null
        if (this.isRecent(date, 30)) {
          results.push({
            headline: item.title,
            url: item.link,
            authority: 'SFO',
            area: 'news',
            source_category: 'sfo_news',
            source_description: 'Serious Fraud Office - News',
            fetched_date: new Date().toISOString(),
            published_date: date,
            raw_data: {
              summary: item.contentSnippet,
              fullTitle: item.title
            }
          })
        }
      })

      return results
    } catch (error) {
      const base = 'https://www.gov.uk/government/organisations/serious-fraud-office'
      try {
        const response = await this.makeRequest(base)
        const $ = cheerio.load(response.data)
        const results = []

        $('.gem-c-document-list__item').each((_, el) => {
          const a = $(el).find('a').first()
          const title = a.text().trim()
          const href = a.attr('href')
          const date = this.parseDate($(el).find('time').attr('datetime'))

          if (title && href && this.isRecent(date, 30)) {
            results.push({
              headline: title,
              url: new URL(href, base).href,
              authority: 'SFO',
              area: 'news',
              source_category: 'sfo_news',
              source_description: 'Serious Fraud Office - News',
              fetched_date: new Date().toISOString(),
              published_date: date,
              raw_data: {
                fullTitle: title
              }
            })
          }
        })

        return results
      } catch (err) {
        console.error('SFO HTML scraping failed:', err.message)
        return []
      }
    }
  }
}

module.exports = applySimpleSourceMethods
