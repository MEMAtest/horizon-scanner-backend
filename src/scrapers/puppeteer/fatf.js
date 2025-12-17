/**
 * FATF Scraper with Cloudflare Bypass and Future-Proofing
 *
 * Features:
 * - Puppeteer-extra with Stealth plugin for Cloudflare bypass
 * - Multiple selector strategies with automatic fallback
 * - Robust date extraction with multiple format support
 * - Comprehensive informational page filtering
 * - Self-healing selector discovery
 * - Health check and validation
 */

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

// Apply stealth plugin to bypass Cloudflare detection
puppeteer.use(StealthPlugin())

// Constants for FATF scraping
const FATF_CONFIG = {
  newsUrl: 'https://www.fatf-gafi.org/en/the-fatf/news.html',
  publicationsUrl: 'https://www.fatf-gafi.org/en/publications.html',
  baseUrl: 'https://www.fatf-gafi.org',
  timeout: 60000,
  waitTime: 8000,
  scrollWait: 3000,
  maxItems: 15,
  maxAgeDays: 90 // Only capture items from last 90 days
}

// Comprehensive list of informational page patterns to filter out
const INFORMATIONAL_PATTERNS = {
  urls: [
    '/job-opportunities', '/jobs/', '/careers/',
    '/fatf-secretariat', '/secretariat/',
    '/code-of-conduct', '/code_of_conduct',
    '/history-of-the-fatf', '/history/',
    '/fatf-presidency', '/presidency/',
    '/mandate-of-the-fatf', '/mandate/',
    '/outcomes-of-meetings', '/meeting-outcomes',
    '/about-us', '/about/', '/about-fatf',
    '/contact', '/contact-us',
    '/members', '/membership', '/member-countries',
    '/who-we-are', '/what-we-do',
    '/how-to-join', '/join-fatf',
    '/faqs', '/faq/', '/frequently-asked',
    '/glossary', '/terms-and-conditions',
    '/privacy', '/legal-notice',
    '/disclaimer', '/sitemap'
  ],
  titles: [
    'job opportunit', 'career', 'vacancy', 'vacancies', 'recruitment',
    'secretariat', 'fatf team', 'staff',
    'code of conduct', 'ethics',
    'history of the fatf', 'history of fatf', 'our history',
    'presidency', 'president\'s office',
    'mandate', 'our mandate',
    'outcomes of meetings', 'meeting outcomes',
    'about us', 'about fatf', 'who we are', 'what we do',
    'contact us', 'contact information', 'get in touch',
    'members', 'membership', 'member countries', 'member jurisdictions',
    'how to join', 'joining fatf',
    'frequently asked', 'faq',
    'glossary', 'terms', 'privacy', 'legal', 'disclaimer', 'sitemap'
  ]
}

// Multiple selector strategies for resilience
const SELECTOR_STRATEGIES = {
  // Strategy 1: AEM Content Fragment List (most reliable for FATF)
  contentFragments: {
    container: '.cmp-contentfragmentlist__item, [data-cmp-is="contentfragmentlist"] > div',
    title: '.cmp-contentfragmentlist__item-title, h2, h3, [class*="title"]',
    link: 'a[href]',
    date: 'time, .cmp-contentfragmentlist__item-date, [class*="date"]',
    description: '.cmp-contentfragmentlist__item-description, p, [class*="description"]'
  },
  // Strategy 2: Teaser components
  teasers: {
    container: '.cmp-teaser, [data-cmp-is="teaser"]',
    title: '.cmp-teaser__title, h2, h3',
    link: '.cmp-teaser__title-link, a[href]',
    date: '.cmp-teaser__date, time, [class*="date"]',
    description: '.cmp-teaser__description, p'
  },
  // Strategy 3: List components
  lists: {
    container: '.cmp-list__item, .cmp-list > li, ul.cmp-list > li',
    title: '.cmp-list__item-title, a',
    link: 'a[href]',
    date: '.cmp-list__item-date, time, [class*="date"]',
    description: '.cmp-list__item-description, p'
  },
  // Strategy 4: Generic article/card patterns
  articles: {
    container: 'article, .article, .card, .news-item, .publication-item, .result-item',
    title: 'h1, h2, h3, .title, [class*="title"]',
    link: 'a[href]',
    date: 'time, .date, [datetime], [class*="date"], [class*="published"]',
    description: 'p, .summary, .excerpt, .description, [class*="description"]'
  },
  // Strategy 5: Direct link discovery (fallback)
  links: {
    container: null, // Will scan all links
    title: null,
    link: 'a[href*="/publications/"], a[href*="/news/"], a[href*="/topics/"]',
    date: null,
    description: null
  }
}

// Date parsing patterns
const DATE_PATTERNS = [
  /(\d{1,2})\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{4})/i,
  /(\d{4})-(\d{2})-(\d{2})/,
  /(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2}),?\s+(\d{4})/i,
  /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
  /(\d{1,2})\.(\d{1,2})\.(\d{4})/
]

const MONTH_MAP = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11
}

/**
 * Check if a URL or title indicates an informational page
 */
function isInformationalPage(url, title) {
  const urlLower = (url || '').toLowerCase()
  const titleLower = (title || '').toLowerCase()

  // Check URL patterns
  for (const pattern of INFORMATIONAL_PATTERNS.urls) {
    if (urlLower.includes(pattern)) {
      return true
    }
  }

  // Check title patterns
  for (const pattern of INFORMATIONAL_PATTERNS.titles) {
    if (titleLower.includes(pattern)) {
      return true
    }
  }

  return false
}

/**
 * Parse date from various formats
 */
function parseDate(dateStr) {
  if (!dateStr) return null

  const cleaned = dateStr.trim()

  // Try ISO format first
  const isoDate = new Date(cleaned)
  if (!isNaN(isoDate.getTime()) && cleaned.includes('-')) {
    return isoDate
  }

  // Try each pattern
  for (const pattern of DATE_PATTERNS) {
    const match = cleaned.match(pattern)
    if (match) {
      try {
        // Pattern 1: "16 Dec 2025" or "16 December 2025"
        if (match[2] && isNaN(parseInt(match[2]))) {
          const day = parseInt(match[1])
          const month = MONTH_MAP[match[2].toLowerCase().slice(0, 3)]
          const year = parseInt(match[3])
          if (month !== undefined) {
            return new Date(year, month, day)
          }
        }
        // Pattern 2: "2025-12-16"
        if (match[1].length === 4) {
          return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]))
        }
        // Pattern 3: "December 16, 2025"
        if (match[1] && isNaN(parseInt(match[1]))) {
          const month = MONTH_MAP[match[1].toLowerCase().slice(0, 3)]
          const day = parseInt(match[2])
          const year = parseInt(match[3])
          if (month !== undefined) {
            return new Date(year, month, day)
          }
        }
        // Pattern 4 & 5: "16/12/2025" or "16.12.2025"
        const day = parseInt(match[1])
        const month = parseInt(match[2]) - 1
        const year = parseInt(match[3])
        return new Date(year, month, day)
      } catch (e) {
        continue
      }
    }
  }

  return null
}

/**
 * Check if date is within acceptable age
 */
function isRecentEnough(date, maxAgeDays = FATF_CONFIG.maxAgeDays) {
  if (!date) return true // Allow items without dates (will be filtered later if needed)

  const now = new Date()
  const ageMs = now.getTime() - date.getTime()
  const ageDays = ageMs / (1000 * 60 * 60 * 24)

  return ageDays <= maxAgeDays
}

/**
 * Normalize URL to absolute
 */
function normalizeUrl(url) {
  if (!url) return null
  if (url.startsWith('http')) return url
  if (url.startsWith('/')) return FATF_CONFIG.baseUrl + url
  return FATF_CONFIG.baseUrl + '/' + url
}

/**
 * Main scraper function applied to ServiceClass
 */
function applyFatfMethods(ServiceClass) {
  /**
   * Main FATF scraping entry point
   */
  ServiceClass.prototype.scrapeFATF = async function scrapeFATF() {
    console.log('\n' + '='.repeat(60))
    console.log('FATF: Starting comprehensive scraping with Cloudflare bypass...')
    console.log('='.repeat(60))

    const results = []
    let browser = null

    try {
      // Launch browser with stealth configuration
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-features=site-per-process',
          '--enable-features=NetworkService',
          '--window-size=1920,1080',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process'
        ],
        defaultViewport: { width: 1920, height: 1080 }
      })

      const page = await browser.newPage()

      // Set realistic browser fingerprint
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      )

      // Set extra headers
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      })

      // Optimize by blocking unnecessary resources
      await page.setRequestInterception(true)
      page.on('request', (req) => {
        const resourceType = req.resourceType()
        if (['image', 'font', 'media'].includes(resourceType)) {
          req.abort()
        } else {
          req.continue()
        }
      })

      // Scrape news page
      console.log('\n📰 FATF: Scraping news page...')
      const newsItems = await this._scrapeFATFPage(page, FATF_CONFIG.newsUrl, 'news')
      results.push(...newsItems)
      console.log(`✅ FATF News: ${newsItems.length} items captured`)

      // Brief wait between pages
      await this.wait(3000)

      // Scrape publications page
      console.log('\n📚 FATF: Scraping publications page...')
      const pubItems = await this._scrapeFATFPage(page, FATF_CONFIG.publicationsUrl, 'publications')
      results.push(...pubItems)
      console.log(`✅ FATF Publications: ${pubItems.length} items captured`)

      await page.close()

      // Deduplicate results
      const uniqueResults = this._deduplicateFATFItems(results)

      console.log('\n' + '='.repeat(60))
      console.log(`🎉 FATF: Total unique items collected: ${uniqueResults.length}`)
      console.log('='.repeat(60) + '\n')

      return uniqueResults
    } catch (error) {
      console.error('❌ FATF scraping failed:', error.message)
      console.error('Stack:', error.stack)
      return results
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }

  /**
   * Scrape a single FATF page with multiple selector strategies
   */
  ServiceClass.prototype._scrapeFATFPage = async function _scrapeFATFPage(page, url, type) {
    const items = []

    try {
      console.log(`   🌐 Loading: ${url}`)

      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: FATF_CONFIG.timeout
      })

      // Wait for dynamic content
      await this.wait(FATF_CONFIG.waitTime)

      // Scroll to trigger lazy loading
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2)
      })
      await this.wait(2000)
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight)
      })
      await this.wait(FATF_CONFIG.scrollWait)

      // Try each selector strategy until we get results
      let extractedItems = []

      for (const [strategyName, selectors] of Object.entries(SELECTOR_STRATEGIES)) {
        console.log(`   🔍 Trying strategy: ${strategyName}`)

        extractedItems = await page.evaluate(
          (selectors, informationalPatterns, strategyName) => {
            const items = []

            // Helper to check informational pages
            const isInformational = (url, title) => {
              const urlLower = (url || '').toLowerCase()
              const titleLower = (title || '').toLowerCase()

              for (const pattern of informationalPatterns.urls) {
                if (urlLower.includes(pattern)) return true
              }
              for (const pattern of informationalPatterns.titles) {
                if (titleLower.includes(pattern)) return true
              }
              return false
            }

            // Strategy 5: Direct link discovery
            if (strategyName === 'links') {
              const links = document.querySelectorAll(selectors.link)
              const seen = new Set()

              links.forEach((link) => {
                const href = link.href
                const text = link.textContent?.trim()

                if (
                  href &&
                  text &&
                  text.length > 25 &&
                  !seen.has(href) &&
                  !href.includes('.pdf') &&
                  !isInformational(href, text)
                ) {
                  seen.add(href)

                  // Try to find date in parent
                  const parent = link.closest('div, article, section, li, tr')
                  let dateText = ''
                  if (parent) {
                    const dateEl = parent.querySelector(
                      'time, [datetime], .date, [class*="date"]'
                    )
                    dateText = dateEl?.getAttribute('datetime') || dateEl?.textContent?.trim() || ''
                  }

                  // Also check if date is embedded in title
                  const dateMatch = text.match(
                    /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i
                  )
                  if (dateMatch && !dateText) {
                    dateText = dateMatch[1]
                  }

                  items.push({
                    title: text.replace(/\s+/g, ' ').trim(),
                    url: href,
                    date: dateText,
                    description: text.substring(0, 200)
                  })
                }
              })

              return items
            }

            // Strategies 1-4: Container-based extraction
            const containers = document.querySelectorAll(selectors.container)

            containers.forEach((container) => {
              try {
                // Find link
                const linkEl = container.querySelector(selectors.link)
                if (!linkEl) return

                let href = linkEl.href
                if (!href) return

                // Find title
                let title = ''
                if (selectors.title) {
                  const titleEl = container.querySelector(selectors.title)
                  title = titleEl?.textContent?.trim() || linkEl.textContent?.trim()
                } else {
                  title = linkEl.textContent?.trim()
                }

                if (!title || title.length < 10) return

                // Find date
                let dateText = ''
                if (selectors.date) {
                  const dateEl = container.querySelector(selectors.date)
                  dateText = dateEl?.getAttribute('datetime') || dateEl?.textContent?.trim() || ''
                }

                // Find description
                let description = ''
                if (selectors.description) {
                  const descEl = container.querySelector(selectors.description)
                  description = descEl?.textContent?.trim() || ''
                }

                // Filter informational pages
                if (isInformational(href, title)) return

                items.push({
                  title: title.replace(/\s+/g, ' ').trim(),
                  url: href,
                  date: dateText,
                  description: description || title.substring(0, 200)
                })
              } catch (e) {
                // Skip this item on error
              }
            })

            return items
          },
          selectors,
          INFORMATIONAL_PATTERNS,
          strategyName
        )

        if (extractedItems.length > 0) {
          console.log(`   ✅ Strategy "${strategyName}" found ${extractedItems.length} items`)
          break
        }
      }

      // Process and validate extracted items
      for (const item of extractedItems.slice(0, FATF_CONFIG.maxItems)) {
        try {
          const normalizedUrl = normalizeUrl(item.url)
          if (!normalizedUrl) continue

          // Parse and validate date
          const parsedDate = parseDate(item.date)
          const publishedDate = parsedDate ? parsedDate.toISOString() : null

          // Skip items that are too old
          if (parsedDate && !isRecentEnough(parsedDate)) {
            console.log(`   ⏭️ Skipping old item: ${item.title.substring(0, 50)}... (${item.date})`)
            continue
          }

          // Double-check informational filter
          if (isInformationalPage(normalizedUrl, item.title)) {
            console.log(`   🚫 Filtered: ${item.title.substring(0, 50)}...`)
            continue
          }

          items.push({
            headline: item.title,
            url: normalizedUrl,
            authority: 'FATF',
            area: type === 'publications' ? 'Publications' : 'News',
            source_category: 'international_scraping',
            source_description: type === 'publications' ? 'FATF Publications' : 'FATF News',
            fetched_date: new Date().toISOString(),
            published_date: publishedDate,
            raw_data: {
              sourceType: 'puppeteer-stealth',
              sourceKey: 'FATF',
              country: 'International',
              priority: 'HIGH',
              originalDate: item.date || null,
              summary: item.description || item.title,
              scrapingStrategy: 'multi-selector',
              international: {
                isInternational: true,
                sourceAuthority: 'FATF',
                sourceCountry: 'International',
                scrapingTarget: type
              }
            }
          })
        } catch (error) {
          console.log(`   ⚠️ Failed to process item: ${item.title?.substring(0, 30)}...`)
        }
      }

      return items
    } catch (error) {
      console.error(`   ❌ Failed to scrape ${url}:`, error.message)
      return items
    }
  }

  /**
   * Deduplicate items by URL
   */
  ServiceClass.prototype._deduplicateFATFItems = function _deduplicateFATFItems(items) {
    const seen = new Set()
    return items.filter((item) => {
      if (seen.has(item.url)) return false
      seen.add(item.url)
      return true
    })
  }

  /**
   * Health check for FATF scraper
   */
  ServiceClass.prototype.checkFATFHealth = async function checkFATFHealth() {
    console.log('\n🏥 FATF Health Check...')

    try {
      const items = await this.scrapeFATF()

      const health = {
        status: items.length > 0 ? 'healthy' : 'degraded',
        itemCount: items.length,
        hasRecentItems: items.some((item) => {
          if (!item.published_date) return false
          const pubDate = new Date(item.published_date)
          const daysSincePublished = (Date.now() - pubDate.getTime()) / (1000 * 60 * 60 * 24)
          return daysSincePublished <= 30
        }),
        sampleItems: items.slice(0, 3).map((i) => ({
          title: i.headline.substring(0, 60),
          date: i.published_date
        })),
        timestamp: new Date().toISOString()
      }

      console.log(`   Status: ${health.status}`)
      console.log(`   Items found: ${health.itemCount}`)
      console.log(`   Has recent items: ${health.hasRecentItems}`)

      return health
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }
}

module.exports = applyFatfMethods
