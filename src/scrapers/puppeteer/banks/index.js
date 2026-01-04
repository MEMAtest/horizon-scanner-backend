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
    url: 'https://www.jpmorganchase.com/newsroom/press-releases',
    baseUrl: 'https://www.jpmorganchase.com',
    region: 'Americas',
    country: 'United States',
    type: 'puppeteer',
    // JPMorgan uses dynamic loading - need to wait for content
    waitForSelector: '.press-release, .news-item, [class*="press"], [class*="release"]',
    selectors: ['[class*="press-release"]', '[class*="news-item"]', '.card-body', 'article']
  },
  BofA: {
    name: 'Bank of America',
    url: 'https://newsroom.bankofamerica.com/content/newsroom/press-releases.html',
    baseUrl: 'https://newsroom.bankofamerica.com',
    region: 'Americas',
    country: 'United States',
    type: 'puppeteer',
    selectors: ['.press-release-item', '.news-item', 'article.teaser', '.teaser']
  },
  Citigroup: {
    name: 'Citigroup',
    url: 'https://www.citigroup.com/global/news/press-release',
    baseUrl: 'https://www.citigroup.com',
    region: 'Americas',
    country: 'United States',
    type: 'puppeteer',
    selectors: ['.press-release-card', '.news-card', 'article', '[class*="card"]']
  },
  WellsFargo: {
    name: 'Wells Fargo',
    url: 'https://newsroom.wf.com/English/news-releases/default.aspx',
    baseUrl: 'https://newsroom.wf.com',
    region: 'Americas',
    country: 'United States',
    type: 'puppeteer',
    selectors: ['.wd_news_release', '.news-release', 'article', '.module_body li']
  },
  Goldman: {
    name: 'Goldman Sachs',
    url: 'https://www.goldmansachs.com/pressroom',
    baseUrl: 'https://www.goldmansachs.com',
    region: 'Americas',
    country: 'United States',
    type: 'puppeteer',
    selectors: ['[class*="content-list-item"]', '[class*="link-root"]', 'a[href*="/pressroom/"]']
  },
  MorganStanley: {
    name: 'Morgan Stanley',
    url: 'https://www.morganstanley.com/press-releases',
    baseUrl: 'https://www.morganstanley.com',
    region: 'Americas',
    country: 'United States',
    type: 'puppeteer',
    selectors: ['.press-release', '.news-item', 'article', '.article-card']
  },
  HSBC: {
    name: 'HSBC',
    url: 'https://www.hsbc.com/news-and-views/news',
    baseUrl: 'https://www.hsbc.com',
    region: 'Europe',
    country: 'United Kingdom',
    type: 'puppeteer',
    selectors: ['.news-card', '.article-card', 'article', '[class*="news"]']
  },
  Barclays: {
    name: 'Barclays',
    url: 'https://home.barclays/news/press-releases/',
    baseUrl: 'https://home.barclays',
    region: 'Europe',
    country: 'United Kingdom',
    type: 'puppeteer',
    selectors: ['.press-release', '.news-item', 'article', '.card']
  },
  DeutscheBank: {
    name: 'Deutsche Bank',
    url: 'https://www.db.com/news',
    baseUrl: 'https://www.db.com',
    region: 'Europe',
    country: 'Germany',
    type: 'puppeteer',
    selectors: ['.news-item', '.press-release', 'article', '[class*="news"]']
  },
  UBS: {
    name: 'UBS',
    url: 'https://www.ubs.com/global/en/media.html',
    baseUrl: 'https://www.ubs.com',
    region: 'Europe',
    country: 'Switzerland',
    type: 'puppeteer',
    selectors: ['.news-item', '.media-release', 'article', '[class*="news"]']
  }
}

const DEFAULT_CONFIG = {
  timeout: 60000,
  waitTime: 5000,
  maxItems: 15,
  maxAgeDays: 90
}

// Bank-specific extraction functions
const BANK_EXTRACTORS = {
  // Deutsche Bank - well-structured selectors
  DeutscheBank: async (page, baseUrl) => {
    return page.evaluate((baseUrl) => {
      const items = []
      const entries = document.querySelectorAll('.news-stream-entry')

      entries.forEach(entry => {
        const headlineEl = entry.querySelector('.news-stream-entry-description h3 a, h3 a')
        const dateEl = entry.querySelector('time.news-meta-date, .news-meta-date')
        const descEl = entry.querySelector('.news-stream-entry-description')

        if (!headlineEl) return

        let url = headlineEl.href || headlineEl.getAttribute('href')
        if (url && url.startsWith('/')) url = baseUrl + url

        items.push({
          title: headlineEl.textContent?.trim(),
          url: url,
          date: dateEl?.textContent?.trim() || '',
          description: descEl?.textContent?.trim()?.substring(0, 300) || ''
        })
      })
      return items
    }, baseUrl)
  },

  // HSBC - card-based structure
  HSBC: async (page, baseUrl) => {
    // Wait for dynamic content
    await page.waitForSelector('a[href*="/news-and-views/"]', { timeout: 10000 }).catch(() => {})

    return page.evaluate((baseUrl) => {
      const items = []
      const seen = new Set()

      // Find all news links
      const links = document.querySelectorAll('a[href*="/news-and-views/news/"]')

      links.forEach(link => {
        const url = link.href
        if (seen.has(url) || !url.includes('/news/')) return
        seen.add(url)

        // Get parent card/container
        const card = link.closest('article, [class*="card"], [class*="item"], li')
        const headingEl = card?.querySelector('h2, h3, h4') || link.querySelector('h2, h3, h4')
        const title = headingEl?.textContent?.trim() || link.textContent?.trim()

        if (!title || title.length < 20) return

        const dateEl = card?.querySelector('time, [class*="date"], span')

        items.push({
          title: title,
          url: url,
          date: dateEl?.textContent?.trim() || '',
          description: ''
        })
      })
      return items
    }, baseUrl)
  },

  // Barclays - press releases section
  Barclays: async (page, baseUrl) => {
    await page.waitForSelector('a[href*="/news/"]', { timeout: 10000 }).catch(() => {})

    return page.evaluate((baseUrl) => {
      const items = []
      const seen = new Set()

      const links = document.querySelectorAll('a[href*="/news/press-releases/"], a[href*="/news/"]')

      links.forEach(link => {
        const url = link.href
        if (seen.has(url)) return
        if (!url.includes('/news/') || url.endsWith('/news/') || url.endsWith('/press-releases/')) return
        seen.add(url)

        const card = link.closest('article, [class*="card"], [class*="item"], div')
        const headingEl = card?.querySelector('h2, h3, h4') || link
        const title = headingEl?.textContent?.trim()

        if (!title || title.length < 20) return
        if (title.toLowerCase().includes('press releases') || title.toLowerCase().includes('view all')) return

        items.push({
          title: title,
          url: url,
          date: '',
          description: ''
        })
      })
      return items
    }, baseUrl)
  },

  // Goldman Sachs - React-based with specific class patterns
  Goldman: async (page, baseUrl) => {
    // Wait for content list to load
    await page.waitForSelector('[class*="content-list"], [class*="pressroom"], a[href*="/pressroom/"]', { timeout: 15000 }).catch(() => {})

    // Extra wait for React hydration
    await new Promise(r => setTimeout(r, 3000))

    return page.evaluate((baseUrl) => {
      const items = []
      const seen = new Set()

      // Try multiple selector patterns for Goldman's React UI
      const selectors = [
        '[class*="content-list-item"] a',
        '[class*="link-root"] a',
        'a[href*="/pressroom/press-releases/"]',
        'a[href*="/insights/"]',
        '[class*="card"] a[href*="pressroom"]'
      ]

      for (const selector of selectors) {
        const links = document.querySelectorAll(selector)
        links.forEach(link => {
          const url = link.href
          if (!url || seen.has(url)) return
          if (url.endsWith('/pressroom/') || url.endsWith('/press-releases/')) return
          seen.add(url)

          // Get text from link or parent container
          const container = link.closest('[class*="content-list-item"], [class*="card"], article')
          const title = container?.querySelector('h2, h3, h4, [class*="title"]')?.textContent?.trim()
                     || link.textContent?.trim()

          if (!title || title.length < 20) return
          if (title.toLowerCase().includes('view all') || title.toLowerCase().includes('see more')) return

          items.push({
            title: title,
            url: url,
            date: '',
            description: ''
          })
        })
      }
      return items
    }, baseUrl)
  },

  // UBS - media releases page
  UBS: async (page, baseUrl) => {
    await page.waitForSelector('a[href*="/media/"], a[href*="news"], article', { timeout: 10000 }).catch(() => {})
    await new Promise(r => setTimeout(r, 2000))

    return page.evaluate((baseUrl) => {
      const items = []
      const seen = new Set()

      // Try multiple selector patterns
      const selectors = [
        'a[href*="/media/"][href*=".html"]',
        'a[href*="/media/news"]',
        'a[href*="media-releases"]',
        '.teaser a[href]',
        'article a[href]',
        '[class*="news"] a[href]',
        '[class*="teaser"] a[href]'
      ]

      for (const selector of selectors) {
        const links = document.querySelectorAll(selector)
        links.forEach(link => {
          const url = link.href
          if (!url || seen.has(url)) return
          if (url.endsWith('/media.html') || url.endsWith('/media/') || url === baseUrl) return
          seen.add(url)

          const container = link.closest('article, [class*="teaser"], [class*="card"], li, div')
          const title = container?.querySelector('h2, h3, h4, [class*="title"]')?.textContent?.trim()
                     || link.textContent?.trim()

          if (!title || title.length < 15) return
          if (title.toLowerCase().includes('view all') || title.toLowerCase().includes('more news')) return

          items.push({
            title: title,
            url: url,
            date: '',
            description: ''
          })
        })
      }
      return items
    }, baseUrl)
  },

  // JPMorgan - dynamic loading with filter-based content
  JPMorgan: async (page, baseUrl) => {
    // Wait longer for dynamic content
    await page.waitForSelector('a[href*="/newsroom/"]', { timeout: 15000 }).catch(() => {})
    await new Promise(r => setTimeout(r, 3000))

    return page.evaluate((baseUrl) => {
      const items = []
      const seen = new Set()

      // Try to find press release links
      const links = document.querySelectorAll('a[href*="/newsroom/press-releases/"], a[href*="/newsroom/stories/"]')

      links.forEach(link => {
        const url = link.href
        if (!url || seen.has(url)) return
        // Skip section index pages
        if (url.endsWith('/press-releases') || url.endsWith('/stories') || url.endsWith('/press-releases/') || url.endsWith('/stories/')) return
        seen.add(url)

        const container = link.closest('article, [class*="card"], [class*="item"], div')
        const title = container?.querySelector('h2, h3, h4, [class*="title"]')?.textContent?.trim()
                   || link.textContent?.trim()

        if (!title || title.length < 20) return
        if (title.toLowerCase().includes('view all') || title.toLowerCase().includes('press releases')) return

        items.push({
          title: title,
          url: url,
          date: '',
          description: ''
        })
      })
      return items
    }, baseUrl)
  },

  // Bank of America - press releases
  BofA: async (page, baseUrl) => {
    await page.waitForSelector('a[href*="newsroom"], article, .teaser', { timeout: 10000 }).catch(() => {})
    await new Promise(r => setTimeout(r, 2000))

    return page.evaluate((baseUrl) => {
      const items = []
      const seen = new Set()

      // Look for teaser articles and news links
      const selectors = [
        '.teaser a[href]',
        'article a[href]',
        'a[href*="/press-releases/"]',
        'a[href*="/newsroom/"][href*=".html"]',
        '[class*="article"] a[href]'
      ]

      for (const selector of selectors) {
        const links = document.querySelectorAll(selector)
        links.forEach(link => {
          const url = link.href
          if (!url || seen.has(url)) return
          if (url.endsWith('/press-releases.html') || url.endsWith('/newsroom/')) return
          seen.add(url)

          const container = link.closest('article, .teaser, [class*="card"], div')
          const title = container?.querySelector('h2, h3, h4, .title, [class*="title"]')?.textContent?.trim()
                     || link.textContent?.trim()

          if (!title || title.length < 20) return
          if (title.toLowerCase().includes('view all') || title.toLowerCase().includes('read more')) return

          items.push({
            title: title,
            url: url,
            date: '',
            description: ''
          })
        })
      }
      return items
    }, baseUrl)
  },

  // Barclays - dynamically loaded CMS content
  Barclays: async (page, baseUrl) => {
    // Wait for CMS content to load
    await page.waitForSelector('a[href*="/news/"]', { timeout: 15000 }).catch(() => {})
    await new Promise(r => setTimeout(r, 3000))

    // Scroll to trigger lazy loading
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2)
    })
    await new Promise(r => setTimeout(r, 2000))

    return page.evaluate((baseUrl) => {
      const items = []
      const seen = new Set()

      const links = document.querySelectorAll('a[href*="/news/press-releases/2"], a[href*="/news/2"]')

      links.forEach(link => {
        const url = link.href
        if (!url || seen.has(url)) return
        // Must be an actual article (contains year in URL pattern)
        if (!url.match(/\/news\/.*\/202[0-9]/)) return
        if (url.endsWith('/news/') || url.endsWith('/press-releases/')) return
        seen.add(url)

        const card = link.closest('article, [class*="card"], [class*="item"], div')
        const title = card?.querySelector('h2, h3, h4, [class*="title"]')?.textContent?.trim()
                   || link.textContent?.trim()

        if (!title || title.length < 20) return
        if (title.toLowerCase().includes('press releases') || title.toLowerCase().includes('view all')) return

        items.push({
          title: title,
          url: url,
          date: '',
          description: ''
        })
      })
      return items
    }, baseUrl)
  }
}

function applyBanksMethods(ServiceClass) {
  /**
   * Generic bank scraper method with bank-specific extractors
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

      // Block heavy resources but keep stylesheets for structure
      await page.setRequestInterception(true)
      page.on('request', (req) => {
        const resourceType = req.resourceType()
        if (['image', 'font', 'media'].includes(resourceType)) {
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

      // Scroll to load lazy content
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 3)
      })
      await this.wait(2000)
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2)
      })
      await this.wait(1000)

      let extractedItems = []

      // Use bank-specific extractor if available
      if (BANK_EXTRACTORS[bankKey]) {
        console.log(`📰 ${bankKey}: Using custom extractor`)
        extractedItems = await BANK_EXTRACTORS[bankKey](page, config.baseUrl)
      } else {
        // Fallback to generic extraction
        console.log(`📰 ${bankKey}: Using generic extractor`)
        extractedItems = await this.genericBankExtract(page, config)
      }

      console.log(`📰 ${bankKey}: Extracted ${extractedItems.length} items`)

      for (const item of extractedItems.slice(0, DEFAULT_CONFIG.maxItems)) {
        if (!item.title || item.title.length < 15) continue

        results.push({
          headline: item.title,
          url: item.url,
          authority: bankKey,
          area: 'Bank News',
          source_category: 'bank_news',
          source_description: `${config.name} Press Releases`,
          fetched_date: new Date().toISOString(),
          published_date: item.date ? this.parseDate(item.date) : null,
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

  // Generic extraction fallback
  ServiceClass.prototype.genericBankExtract = async function(page, config) {
    return page.evaluate((baseUrl, selectors) => {
      const items = []
      const seen = new Set()

      const selectorList = selectors?.length > 0
        ? selectors
        : ['article', '.news-item', '.press-release', 'a[href*="news"]', 'a[href*="press"]']

      for (const selector of selectorList) {
        const elements = document.querySelectorAll(selector)

        elements.forEach(el => {
          const linkEl = el.querySelector('a[href]') || (el.tagName === 'A' ? el : null)
          if (!linkEl) return

          let url = linkEl.href || linkEl.getAttribute('href')
          if (!url || seen.has(url)) return
          if (url.startsWith('/')) url = baseUrl + url

          // Skip navigation and social links
          if (url.includes('#') || url.includes('javascript:') ||
              url.includes('linkedin') || url.includes('twitter') ||
              url.includes('facebook') || url.includes('youtube')) return

          const titleEl = el.querySelector('h1, h2, h3, h4, h5')
          const title = titleEl?.textContent?.trim() || linkEl.textContent?.trim()

          if (!title || title.length < 20) return

          // Skip navigation text
          const titleLower = title.toLowerCase()
          if (titleLower.includes('see all') || titleLower.includes('view all') ||
              titleLower.includes('read more') || titleLower.includes('subscribe')) return

          seen.add(url)
          items.push({
            title: title.replace(/\s+/g, ' ').trim(),
            url: url,
            date: '',
            description: ''
          })
        })
      }

      return items
    }, config.baseUrl, config.selectors || [])
  }

  // Helper to parse various date formats
  ServiceClass.prototype.parseDate = function(dateStr) {
    if (!dateStr) return null
    try {
      const date = new Date(dateStr)
      return isNaN(date.getTime()) ? null : date.toISOString()
    } catch {
      return null
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
