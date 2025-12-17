/**
 * FATF Scraper Service - with Cloudflare Bypass
 *
 * This module applies FATF scraping methods to the WebScraper service class.
 * Uses puppeteer-extra with stealth plugin for Cloudflare protection bypass.
 */

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

// Apply stealth plugin
puppeteer.use(StealthPlugin())

// Informational page patterns to filter out
const FILTER_PATTERNS = {
  urls: [
    '/job-opportunities', '/jobs/', '/careers/',
    '/fatf-secretariat', '/secretariat/',
    '/code-of-conduct', '/history-of-the-fatf',
    '/fatf-presidency', '/mandate-of-the-fatf',
    '/about-us', '/about/', '/contact',
    '/members', '/membership', '/who-we-are',
    '/faqs', '/glossary', '/sitemap'
  ],
  titles: [
    'job opportunit', 'career', 'vacancy', 'recruitment',
    'secretariat', 'fatf team', 'staff',
    'code of conduct', 'history of the fatf',
    'presidency', 'mandate', 'about us', 'about fatf',
    'contact us', 'members', 'membership', 'faq', 'glossary'
  ]
}

function isInformationalPage(url, title) {
  const urlLower = (url || '').toLowerCase()
  const titleLower = (title || '').toLowerCase()
  for (const pattern of FILTER_PATTERNS.urls) {
    if (urlLower.includes(pattern)) return true
  }
  for (const pattern of FILTER_PATTERNS.titles) {
    if (titleLower.includes(pattern)) return true
  }
  return false
}

function applyFatfMethods(ServiceClass) {
  ServiceClass.prototype.scrapeFATF = async function() {
    console.log('🌍 FATF: Starting specialized scraping with Stealth...')

    let browser
    const results = []

    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-features=site-per-process',
          '--window-size=1920,1080'
        ],
        defaultViewport: { width: 1920, height: 1080 }
      })

      const page = await browser.newPage()
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9'
      })

      // Block unnecessary resources
      await page.setRequestInterception(true)
      page.on('request', req => {
        if (['image', 'font', 'media'].includes(req.resourceType())) {
          req.abort()
        } else {
          req.continue()
        }
      })

      // Scrape news
      console.log('   📰 Scraping FATF news...')
      const newsItems = await this._scrapeFATFPage(page, 'https://www.fatf-gafi.org/en/the-fatf/news.html', 'News')
      results.push(...newsItems)
      console.log(`   ✅ FATF News: ${newsItems.length} items`)

      await this.wait(3000)

      // Scrape publications
      console.log('   📚 Scraping FATF publications...')
      const pubItems = await this._scrapeFATFPage(page, 'https://www.fatf-gafi.org/en/publications.html', 'Publications')
      results.push(...pubItems)
      console.log(`   ✅ FATF Publications: ${pubItems.length} items`)

      await page.close()

      // Deduplicate
      const seen = new Set()
      const unique = results.filter(item => {
        if (seen.has(item.url)) return false
        seen.add(item.url)
        return true
      })

      console.log(`🎉 FATF: Total ${unique.length} unique items`)
      return unique
    } catch (error) {
      console.error('❌ FATF scraping failed:', error.message)
      return results
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }

  ServiceClass.prototype._scrapeFATFPage = async function(page, url, area) {
    const items = []

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })
      await this.wait(8000)

      // Scroll for lazy loading
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2))
      await this.wait(2000)
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await this.wait(3000)

      const extracted = await page.evaluate((filterPatterns) => {
        const found = []
        const seen = new Set()

        const isInfo = (u, t) => {
          const ul = (u || '').toLowerCase()
          const tl = (t || '').toLowerCase()
          for (const p of filterPatterns.urls) if (ul.includes(p)) return true
          for (const p of filterPatterns.titles) if (tl.includes(p)) return true
          return false
        }

        // Try selectors
        const strategies = [
          '.cmp-teaser, [data-cmp-is="teaser"]',
          '.cmp-list__item',
          '.cmp-contentfragmentlist__item',
          'article, .article, .card'
        ]

        for (const selector of strategies) {
          const containers = document.querySelectorAll(selector)
          if (containers.length > 0) {
            containers.forEach(container => {
              const link = container.querySelector('a[href]')
              if (!link) return

              const href = link.href
              const title = link.textContent?.trim() ||
                container.querySelector('h2, h3, [class*="title"]')?.textContent?.trim()

              if (!href || !title || title.length < 15 || seen.has(href)) return
              if (isInfo(href, title)) return
              seen.add(href)

              let dateText = ''
              const dateEl = container.querySelector('time, [datetime], .date, [class*="date"]')
              if (dateEl) {
                dateText = dateEl.getAttribute('datetime') || dateEl.textContent?.trim() || ''
              }
              if (!dateText) {
                const match = title.match(/(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i)
                if (match) dateText = match[1]
              }

              const descEl = container.querySelector('p, [class*="description"]')
              const description = descEl?.textContent?.trim() || title.substring(0, 200)

              found.push({
                title: title.replace(/\s+/g, ' ').trim(),
                href,
                dateText,
                description
              })
            })
            break
          }
        }

        // Fallback
        if (found.length === 0) {
          const links = document.querySelectorAll('a[href*="/publications/"], a[href*="/news/"], a[href*="/topics/"]')
          links.forEach(link => {
            const href = link.href
            const title = link.textContent?.trim()
            if (!href || !title || title.length < 25 || seen.has(href) || href.includes('.pdf')) return
            if (isInfo(href, title)) return
            seen.add(href)

            const parent = link.closest('div, article, section, li')
            let dateText = ''
            if (parent) {
              const dateEl = parent.querySelector('time, [datetime], .date')
              dateText = dateEl?.getAttribute('datetime') || dateEl?.textContent?.trim() || ''
            }

            found.push({
              title: title.replace(/\s+/g, ' ').trim(),
              href,
              dateText,
              description: title.substring(0, 200)
            })
          })
        }

        return found.slice(0, 15)
      }, FILTER_PATTERNS)

      // Process
      for (const item of extracted) {
        if (isInformationalPage(item.href, item.title)) continue

        let publishedDate = null
        if (item.dateText) {
          const parsed = new Date(item.dateText)
          if (!isNaN(parsed.getTime())) {
            publishedDate = parsed.toISOString()
          }
        }

        items.push({
          headline: item.title,
          url: item.href.startsWith('http') ? item.href : `https://www.fatf-gafi.org${item.href}`,
          authority: 'FATF',
          area,
          source_category: 'international_scraping',
          source_description: `FATF ${area}`,
          fetched_date: new Date().toISOString(),
          published_date: publishedDate,
          raw_data: {
            sourceType: 'puppeteer-stealth',
            sourceKey: 'FATF',
            country: 'International',
            priority: 'HIGH',
            originalDate: item.dateText || null,
            summary: item.description,
            international: {
              isInternational: true,
              sourceAuthority: 'FATF',
              sourceCountry: 'International'
            }
          }
        })
      }
    } catch (error) {
      console.error(`FATF page scrape failed (${url}):`, error.message)
    }

    return items
  }
}

module.exports = applyFatfMethods
