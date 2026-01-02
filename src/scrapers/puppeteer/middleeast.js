/**
 * Middle East Financial Regulators Scraper
 *
 * Scrapes regulatory updates from:
 * - DFSA (Dubai Financial Services Authority)
 * - ADGM (Abu Dhabi Global Market)
 * - CBUAE (Central Bank of UAE)
 * - SAMA (Saudi Arabian Monetary Authority)
 */

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

puppeteer.use(StealthPlugin())

const MIDDLE_EAST_CONFIG = {
  timeout: 60000,
  waitTime: 5000,
  maxItems: 20,
  maxAgeDays: 90
}

const REGULATORS = {
  DFSA: {
    name: 'Dubai Financial Services Authority',
    baseUrl: 'https://www.dfsa.ae',
    newsUrl: 'https://www.dfsa.ae/news-and-publications/news',
    country: 'UAE',
    region: 'Middle East',
    sectors: ['Financial Services', 'Banking', 'Investment Management', 'Insurance']
  },
  ADGM: {
    name: 'Abu Dhabi Global Market',
    baseUrl: 'https://www.adgm.com',
    newsUrl: 'https://www.adgm.com/media/announcements',
    country: 'UAE',
    region: 'Middle East',
    sectors: ['Financial Services', 'Banking', 'Investment Management']
  },
  CBUAE: {
    name: 'Central Bank of UAE',
    baseUrl: 'https://www.centralbank.ae',
    newsUrl: 'https://www.centralbank.ae/en/news-and-publications/',
    country: 'UAE',
    region: 'Middle East',
    sectors: ['Banking', 'Financial Services', 'Payment Services']
  },
  SAMA: {
    name: 'Saudi Arabian Monetary Authority',
    baseUrl: 'https://www.sama.gov.sa',
    newsUrl: 'https://www.sama.gov.sa/en-US/News/Pages/AllNews.aspx',
    country: 'Saudi Arabia',
    region: 'Middle East',
    sectors: ['Banking', 'Financial Services', 'Insurance', 'Payment Services']
  }
}

function applyMiddleEastMethods(ServiceClass) {
  ServiceClass.prototype.scrapeDFSA = async function scrapeDFSA() {
    return await this._scrapeMiddleEastRegulator('DFSA')
  }

  ServiceClass.prototype.scrapeADGM = async function scrapeADGM() {
    return await this._scrapeMiddleEastRegulator('ADGM')
  }

  ServiceClass.prototype.scrapeCBUAE = async function scrapeCBUAE() {
    return await this._scrapeMiddleEastRegulator('CBUAE')
  }

  ServiceClass.prototype.scrapeSAMA = async function scrapeSAMA() {
    return await this._scrapeMiddleEastRegulator('SAMA')
  }

  ServiceClass.prototype._scrapeMiddleEastRegulator = async function _scrapeMiddleEastRegulator(regulatorKey) {
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
          '--disable-web-security',
          '--window-size=1920,1080'
        ],
        defaultViewport: { width: 1920, height: 1080 }
      })

      const page = await browser.newPage()

      // More sophisticated fingerprinting
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      )

      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      })

      await page.setRequestInterception(true)
      page.on('request', (req) => {
        const resourceType = req.resourceType()
        if (['image', 'font', 'media', 'stylesheet'].includes(resourceType)) {
          req.abort()
        } else {
          req.continue()
        }
      })

      console.log(`📰 ${regulatorKey}: Scraping news page...`)

      await page.goto(regulator.newsUrl, {
        waitUntil: 'networkidle2',
        timeout: MIDDLE_EAST_CONFIG.timeout
      })

      await this.wait(MIDDLE_EAST_CONFIG.waitTime)
      const waitSelector = {
        ADGM: 'adgm-highlight-card.announcementlisting',
        DFSA: 'article, .news-item, .listing-item, .announcement-item',
        SAMA: 'a[href*="/News/"], a[href*="/news/"]'
      }[regulatorKey]

      if (waitSelector) {
        await page.waitForSelector(waitSelector, { timeout: 15000 }).catch(() => {})
      }

      // Scroll to load dynamic content
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2)
      })
      await this.wait(2000)
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight)
      })
      await this.wait(2000)

      const evaluateItems = () => page.evaluate((baseUrl) => {
        const items = []
        const seen = new Set()

        // Try multiple selector patterns
        const containerSelectors = [
          'adgm-highlight-card.announcementlisting',
          'adgm-highlight-card',
          'article', '.news-item', '.news-card', '.media-item',
          '.announcement-item', '.press-release', '.list-item',
          '.content-item', '.card', '[class*="news"]', '[class*="article"]',
          'li.item', '.row > div', '.grid-item'
        ]

        const titleSelectors = [
          'h1', 'h2', 'h3', 'h4', '.title', '[class*="title"]',
          'adgm-text[variant="textL"]', 'adgm-text[slot="content"]',
          '[data-title]', '[data-headline]'
        ]

        const dateSelectors = [
          'time', '.date', '[datetime]', '[class*="date"]',
          'span.meta', 'adgm-text[variant="textS"]'
        ]

        const descriptionSelectors = [
          'p', '.summary', '.excerpt', '.description', '[class*="description"]'
        ]

        const getText = (el, selectors) => {
          for (const selector of selectors) {
            const match = el.querySelector(selector)
            const text = match?.textContent?.trim()
            if (text) return text
          }
          return ''
        }

        const getHref = (el) => {
          const linkEl = el.querySelector('a[href]')
          if (linkEl) {
            return linkEl.getAttribute('href') || linkEl.href
          }

          return el.getAttribute('href') || el.getAttribute('data-href') || el.getAttribute('data-url')
        }

        for (const selector of containerSelectors) {
          const elements = document.querySelectorAll(selector)

          elements.forEach(el => {
            let href = getHref(el)
            if (!href) return

            if (href.startsWith('/')) {
              href = baseUrl + href
            }

            if (href.includes('#') || href.includes('javascript:') ||
                href.includes('mailto:') || href.endsWith('.pdf')) return
            if (seen.has(href)) return

            let title = getText(el, titleSelectors)
            if (!title) {
              title = el.getAttribute('title') || el.getAttribute('aria-label') || ''
            }
            if (!title && el.querySelector('a[href]')) {
              title = el.querySelector('a[href]')?.getAttribute('title') ||
                el.querySelector('a[href]')?.textContent?.trim()
            }

            if (!title || title.length < 10) return

            const dateEl = el.querySelector(dateSelectors.join(', '))
            const dateText = dateEl?.getAttribute('datetime') || dateEl?.textContent?.trim() || ''

            const description = getText(el, descriptionSelectors)

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

      let extractedItems = []
      try {
        extractedItems = await evaluateItems()
      } catch (error) {
        const message = error?.message || ''
        const shouldRetry = /detached frame|execution context was destroyed|target closed|session closed|connection closed/i.test(message)
        if (!shouldRetry) {
          throw error
        }
        console.warn(`⚠️ ${regulatorKey}: Retrying after navigation error (${message})`)
        await page.reload({ waitUntil: 'networkidle2', timeout: MIDDLE_EAST_CONFIG.timeout }).catch(() => {})
        await this.wait(2000)
        extractedItems = await evaluateItems()
      }

      for (const item of extractedItems.slice(0, MIDDLE_EAST_CONFIG.maxItems)) {
        const parsedDate = item.date ? new Date(item.date) : null
        const publishedDate = parsedDate && !isNaN(parsedDate.getTime())
          ? parsedDate.toISOString()
          : null

        results.push({
          headline: item.title,
          url: item.url,
          authority: regulatorKey,
          area: 'News',
          source_category: 'international_scraping',
          source_description: `${regulator.name} News`,
          fetched_date: new Date().toISOString(),
          published_date: publishedDate,
          raw_data: {
            sourceType: 'puppeteer',
            sourceKey: regulatorKey,
            country: regulator.country,
            region: regulator.region,
            priority: 'MEDIUM',
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

module.exports = applyMiddleEastMethods
