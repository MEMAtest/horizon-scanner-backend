/**
 * Australian Financial Regulators Scraper
 *
 * Scrapes regulatory updates from:
 * - APRA (Australian Prudential Regulation Authority)
 * - AUSTRAC (Australian Transaction Reports and Analysis Centre)
 */

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

puppeteer.use(StealthPlugin())

const AUSTRALIA_CONFIG = {
  timeout: 60000,
  waitTime: 5000,
  maxItems: 20,
  maxAgeDays: 90
}

const REGULATORS = {
  APRA: {
    name: 'Australian Prudential Regulation Authority',
    baseUrl: 'https://www.apra.gov.au',
    newsUrl: 'https://www.apra.gov.au/news-and-publications',
    country: 'Australia',
    region: 'Asia-Pacific',
    sectors: ['Banking', 'Insurance', 'Superannuation', 'Prudential Regulation']
  },
  AUSTRAC: {
    name: 'Australian Transaction Reports and Analysis Centre',
    baseUrl: 'https://www.austrac.gov.au',
    newsUrl: 'https://www.austrac.gov.au/news-and-media/media-release',
    country: 'Australia',
    region: 'Asia-Pacific',
    sectors: ['AML & Financial Crime', 'Banking', 'Remittances', 'Cryptocurrency']
  }
}

function applyAustraliaMethods(ServiceClass) {
  ServiceClass.prototype.scrapeAPRA = async function scrapeAPRA() {
    return await this._scrapeAustralianRegulator('APRA')
  }

  ServiceClass.prototype.scrapeAUSTRAC = async function scrapeAUSTRAC() {
    return await this._scrapeAustralianRegulator('AUSTRAC')
  }

  ServiceClass.prototype._scrapeAustralianRegulator = async function _scrapeAustralianRegulator(regulatorKey) {
    const regulator = REGULATORS[regulatorKey]
    if (!regulator) {
      console.error(`Unknown regulator: ${regulatorKey}`)
      return []
    }

    console.log('\n' + '='.repeat(60))
    console.log(`${regulatorKey}: Starting scrape of ${regulator.name}...`)
    console.log('='.repeat(60))

    const results = []
    let browser = null

    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--window-size=1920,1080'
        ],
        defaultViewport: { width: 1920, height: 1080 }
      })

      const page = await browser.newPage()

      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      )

      await page.setRequestInterception(true)
      page.on('request', (req) => {
        const resourceType = req.resourceType()
        if (['image', 'font', 'media'].includes(resourceType)) {
          req.abort()
        } else {
          req.continue()
        }
      })

      console.log(`📰 ${regulatorKey}: Scraping news page...`)

      await page.goto(regulator.newsUrl, {
        waitUntil: 'networkidle2',
        timeout: AUSTRALIA_CONFIG.timeout
      })

      await this.wait(AUSTRALIA_CONFIG.waitTime)

      // Scroll to load content
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2)
      })
      await this.wait(2000)
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight)
      })
      await this.wait(2000)

      const extractedItems = await page.evaluate((baseUrl) => {
        const items = []
        const seen = new Set()

        // Try multiple selector patterns
        const containerSelectors = [
          'article', '.news-item', '.media-release', '.view-content .views-row',
          '.content-item', '.list-item', 'li.item', '.card',
          '[class*="news"]', '[class*="media"]', '[class*="release"]',
          '.field-content', '.node--type-media-release',
          'h2.field-content', 'a[href*=\"/news-and-media/media-release/\"]'
        ]

        for (const selector of containerSelectors) {
          const elements = document.querySelectorAll(selector)

          elements.forEach(el => {
            const linkEl = el.querySelector('a[href]') || (el.matches && el.matches('a[href]') ? el : null)
            if (!linkEl) return

            let href = linkEl.getAttribute('href') || linkEl.href
            if (!href || seen.has(href)) return

            if (href.startsWith('/')) {
              href = baseUrl + href
            }

            if (href.includes('#') || href.includes('javascript:') ||
                href.includes('mailto:')) return

            const title = el.querySelector('h1, h2, h3, h4, .title, [class*="title"], .field--name-title')?.textContent?.trim() ||
                         linkEl.textContent?.trim() ||
                         el.textContent?.trim()

            if (!title || title.length < 10) return

            // Get date
            const dateEl = el.querySelector('time, .date, [datetime], [class*="date"], .field--name-created')
            const dateText = dateEl?.getAttribute('datetime') || dateEl?.textContent?.trim() || ''

            // Get description
            const descEl = el.querySelector('p, .summary, .excerpt, .description, .field--name-body')
            const description = descEl?.textContent?.trim() || ''

            seen.add(href)
            items.push({
              title: title.replace(/\s+/g, ' ').trim(),
              url: href,
              date: dateText,
              description: description.substring(0, 300)
            })
          })
        }

        return items
      }, regulator.baseUrl)

      for (const item of extractedItems.slice(0, AUSTRALIA_CONFIG.maxItems)) {
        let pubDate = null
        if (item.date) {
          try {
            pubDate = new Date(item.date).toISOString()
          } catch (e) {
            pubDate = null
          }
        }

        results.push({
          headline: item.title,
          url: item.url,
          authority: regulatorKey,
          area: 'News',
          source_category: 'international_scraping',
          source_description: `${regulator.name} News`,
          fetched_date: new Date().toISOString(),
          published_date: pubDate,
          raw_data: {
            sourceType: 'puppeteer',
            sourceKey: regulatorKey,
            country: regulator.country,
            region: regulator.region,
            priority: 'HIGH',
            summary: item.description || item.title,
            sectors: regulator.sectors,
            international: {
              isInternational: true,
              sourceAuthority: regulator.name,
              sourceCountry: regulator.country
            }
          }
        })
      }

      await page.close()

      console.log(`🎉 ${regulatorKey}: Total items collected: ${results.length}`)

      return results
    } catch (error) {
      console.error(`❌ ${regulatorKey} scraping failed:`, error.message)
      return results
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }
}

module.exports = applyAustraliaMethods
