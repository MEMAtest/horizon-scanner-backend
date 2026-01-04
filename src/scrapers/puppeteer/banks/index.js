/**
 * Global Bank News Scrapers
 *
 * Scrapes news and press releases from major global banks.
 * Banks are categorized as source_category: 'bank_news' to separate
 * from regulatory updates.
 *
 * RSS-based: HSBC, Morgan Stanley, Deutsche Bank
 * Puppeteer-based: JPMorgan, Bank of America, Citigroup, Wells Fargo,
 *                  Goldman Sachs, Barclays, UBS
 */

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

puppeteer.use(StealthPlugin())

const BANK_CONFIGS = {
  JPMorgan: {
    name: 'JPMorgan Chase',
    url: 'https://www.jpmorganchase.com/newsroom',
    baseUrl: 'https://www.jpmorganchase.com',
    region: 'Americas',
    country: 'United States',
    type: 'puppeteer'
  },
  BofA: {
    name: 'Bank of America',
    url: 'https://newsroom.bankofamerica.com/content/newsroom/press-releases.html',
    baseUrl: 'https://newsroom.bankofamerica.com',
    region: 'Americas',
    country: 'United States',
    type: 'puppeteer'
  },
  Citigroup: {
    name: 'Citigroup',
    url: 'https://www.citigroup.com/global/news/press-release',
    baseUrl: 'https://www.citigroup.com',
    region: 'Americas',
    country: 'United States',
    type: 'puppeteer'
  },
  WellsFargo: {
    name: 'Wells Fargo',
    url: 'https://newsroom.wf.com/news-releases/',
    baseUrl: 'https://newsroom.wf.com',
    region: 'Americas',
    country: 'United States',
    type: 'puppeteer'
  },
  Goldman: {
    name: 'Goldman Sachs',
    url: 'https://www.goldmansachs.com/pressroom',
    baseUrl: 'https://www.goldmansachs.com',
    region: 'Americas',
    country: 'United States',
    type: 'puppeteer'
  },
  MorganStanley: {
    name: 'Morgan Stanley',
    url: 'https://www.morganstanley.com/about-us-newsroom',
    baseUrl: 'https://www.morganstanley.com',
    region: 'Americas',
    country: 'United States',
    type: 'puppeteer'
  },
  HSBC: {
    name: 'HSBC',
    url: 'https://www.hsbc.com/news-and-views/news',
    baseUrl: 'https://www.hsbc.com',
    region: 'Europe',
    country: 'United Kingdom',
    type: 'puppeteer'
  },
  Barclays: {
    name: 'Barclays',
    url: 'https://home.barclays/news/press-releases/',
    baseUrl: 'https://home.barclays',
    region: 'Europe',
    country: 'United Kingdom',
    type: 'puppeteer'
  },
  DeutscheBank: {
    name: 'Deutsche Bank',
    url: 'https://www.db.com/newsroom/',
    baseUrl: 'https://www.db.com',
    region: 'Europe',
    country: 'Germany',
    type: 'puppeteer'
  },
  UBS: {
    name: 'UBS',
    url: 'https://www.ubs.com/global/en/media/news.html',
    baseUrl: 'https://www.ubs.com',
    region: 'Europe',
    country: 'Switzerland',
    type: 'puppeteer'
  }
}

const DEFAULT_CONFIG = {
  timeout: 60000,
  waitTime: 5000,
  maxItems: 15,
  maxAgeDays: 90
}

function applyBanksMethods(ServiceClass) {
  /**
   * Generic bank scraper method
   * @param {string} bankKey - Key from BANK_CONFIGS
   */
  ServiceClass.prototype.scrapeBank = async function scrapeBank(bankKey) {
    const config = BANK_CONFIGS[bankKey]
    if (!config) {
      console.error(`Unknown bank: ${bankKey}`)
      return []
    }

    console.log('\n' + '='.repeat(60))
    console.log(`${bankKey}: Starting scrape of ${config.name}...`)
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

      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      })

      // Block heavy resources
      await page.setRequestInterception(true)
      page.on('request', (req) => {
        const resourceType = req.resourceType()
        if (['image', 'font', 'media', 'stylesheet'].includes(resourceType)) {
          req.abort()
        } else {
          req.continue()
        }
      })

      console.log(`📰 ${bankKey}: Navigating to ${config.url}`)

      try {
        await page.goto(config.url, {
          waitUntil: 'networkidle2',
          timeout: DEFAULT_CONFIG.timeout
        })
      } catch (navError) {
        console.log(`${bankKey}: Navigation timeout, attempting to continue...`)
      }

      await this.wait(DEFAULT_CONFIG.waitTime)

      // Scroll to load content
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2)
      })
      await this.wait(2000)

      const extractedItems = await page.evaluate((baseUrl, bankName) => {
        const items = []
        const seen = new Set()

        // Bank-specific selectors
        const selectors = [
          // Common news patterns
          'article', '.news-item', '.press-release', '.news-card',
          '.media-release', '.content-item', '.list-item',
          // Link patterns
          'a[href*="news"]', 'a[href*="press"]', 'a[href*="media"]',
          'a[href*="release"]', 'a[href*="article"]',
          // Card patterns
          '.card', '[class*="card"]', '[class*="news"]', '[class*="press"]'
        ]

        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector)

          elements.forEach(el => {
            const linkEl = el.querySelector('a[href]') || (el.tagName === 'A' ? el : null)
            if (!linkEl) return

            let href = linkEl.href || linkEl.getAttribute('href')
            if (!href || seen.has(href)) return

            // Normalize URL
            if (href.startsWith('/')) {
              href = baseUrl + href
            }

            // Skip non-article links
            if (href.includes('#') ||
                href.includes('javascript:') ||
                href.includes('mailto:') ||
                href.includes('linkedin') ||
                href.includes('twitter') ||
                href.includes('facebook')) return

            // Get title
            const titleEl = el.querySelector('h1, h2, h3, h4, .title, [class*="title"], [class*="headline"]')
            const title = titleEl?.textContent?.trim() || linkEl.textContent?.trim()

            if (!title || title.length < 15) return

            // Skip navigation/footer links
            if (title.toLowerCase().includes('see all') ||
                title.toLowerCase().includes('view all') ||
                title.toLowerCase().includes('read more') ||
                title.toLowerCase().includes('subscribe')) return

            // Get date
            const dateEl = el.querySelector('time, .date, [datetime], [class*="date"], .meta, span.time')
            const dateText = dateEl?.getAttribute('datetime') || dateEl?.textContent?.trim() || ''

            // Get description
            const descEl = el.querySelector('p, .summary, .excerpt, .description, [class*="summary"]')
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
      }, config.baseUrl, config.name)

      console.log(`📰 ${bankKey}: Extracted ${extractedItems.length} items`)

      for (const item of extractedItems.slice(0, DEFAULT_CONFIG.maxItems)) {
        results.push({
          headline: item.title,
          url: item.url,
          authority: bankKey,
          area: 'Bank News',
          source_category: 'bank_news',
          source_description: `${config.name} Press Releases`,
          fetched_date: new Date().toISOString(),
          published_date: item.date ? new Date(item.date).toISOString() : null,
          raw_data: {
            sourceType: 'puppeteer',
            sourceKey: bankKey,
            country: config.country,
            region: config.region,
            priority: 'MEDIUM',
            summary: item.description || item.title,
            sectors: ['Banking', 'Capital Markets', 'Wealth Management'],
            bankNews: {
              isBankNews: true,
              bankName: config.name,
              bankId: bankKey
            }
          }
        })
      }

      await page.close()
      console.log(`🎉 ${bankKey}: Total items collected: ${results.length}`)

      return results
    } catch (error) {
      console.error(`❌ ${bankKey} scraping failed:`, error.message)
      return results
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }

  // Individual bank methods for convenience
  ServiceClass.prototype.scrapeJPMorgan = function() { return this.scrapeBank('JPMorgan') }
  ServiceClass.prototype.scrapeBofA = function() { return this.scrapeBank('BofA') }
  ServiceClass.prototype.scrapeCitigroup = function() { return this.scrapeBank('Citigroup') }
  ServiceClass.prototype.scrapeWellsFargo = function() { return this.scrapeBank('WellsFargo') }
  ServiceClass.prototype.scrapeGoldman = function() { return this.scrapeBank('Goldman') }
  ServiceClass.prototype.scrapeMorganStanley = function() { return this.scrapeBank('MorganStanley') }
  ServiceClass.prototype.scrapeHSBC = function() { return this.scrapeBank('HSBC') }
  ServiceClass.prototype.scrapeBarclays = function() { return this.scrapeBank('Barclays') }
  ServiceClass.prototype.scrapeDeutscheBank = function() { return this.scrapeBank('DeutscheBank') }
  ServiceClass.prototype.scrapeUBS = function() { return this.scrapeBank('UBS') }

  // Scrape all banks
  ServiceClass.prototype.scrapeAllBanks = async function() {
    console.log('\n' + '='.repeat(60))
    console.log('BANKS: Starting scrape of all global banks...')
    console.log('='.repeat(60))

    const allResults = []
    const bankKeys = Object.keys(BANK_CONFIGS)

    for (const bankKey of bankKeys) {
      try {
        const results = await this.scrapeBank(bankKey)
        allResults.push(...results)
        // Small delay between banks to be respectful
        await this.wait(2000)
      } catch (error) {
        console.error(`Failed to scrape ${bankKey}:`, error.message)
      }
    }

    console.log(`\n🎉 BANKS: Total items from all banks: ${allResults.length}`)
    return allResults
  }
}

module.exports = applyBanksMethods
