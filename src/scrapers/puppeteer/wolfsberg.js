/**
 * Wolfsberg Group Scraper
 *
 * Scrapes the Wolfsberg Group website for AML/KYC standards and publications.
 * The Wolfsberg Group is a consortium of 13 global banks focused on developing
 * frameworks and guidance for AML, KYC, and financial crime compliance.
 */

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

puppeteer.use(StealthPlugin())

const WOLFSBERG_CONFIG = {
  newsUrl: 'https://wolfsberg-group.org/news',
  resourcesUrl: 'https://wolfsberg-group.org/resources',
  baseUrl: 'https://wolfsberg-group.org',
  timeout: 45000,
  waitTime: 5000,
  maxItems: 20,
  maxAgeDays: 180
}

function applyWolfsbergMethods(ServiceClass) {
  ServiceClass.prototype.scrapeWolfsberg = async function scrapeWolfsberg() {
    console.log('\n' + '='.repeat(60))
    console.log('WOLFSBERG: Starting scrape of Wolfsberg Group website...')
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

      // Block unnecessary resources
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
      console.log('\n📰 WOLFSBERG: Scraping news page...')
      const newsItems = await this._scrapeWolfsbergPage(page, WOLFSBERG_CONFIG.newsUrl, 'News')
      results.push(...newsItems)
      console.log(`✅ Wolfsberg News: ${newsItems.length} items captured`)

      await this.wait(2000)

      // Scrape resources page
      console.log('\n📚 WOLFSBERG: Scraping resources/publications...')
      const resourceItems = await this._scrapeWolfsbergPage(page, WOLFSBERG_CONFIG.resourcesUrl, 'Publications')
      results.push(...resourceItems)
      console.log(`✅ Wolfsberg Resources: ${resourceItems.length} items captured`)

      await page.close()

      // Deduplicate
      const uniqueResults = this._deduplicateByUrl(results)

      console.log('\n' + '='.repeat(60))
      console.log(`🎉 WOLFSBERG: Total unique items collected: ${uniqueResults.length}`)
      console.log('='.repeat(60) + '\n')

      return uniqueResults
    } catch (error) {
      console.error('❌ Wolfsberg scraping failed:', error.message)
      return results
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }

  ServiceClass.prototype._scrapeWolfsbergPage = async function _scrapeWolfsbergPage(page, url, type) {
    const items = []

    try {
      console.log(`   🌐 Loading: ${url}`)

      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: WOLFSBERG_CONFIG.timeout
      })

      await this.wait(WOLFSBERG_CONFIG.waitTime)

      // Scroll to load dynamic content
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2)
      })
      await this.wait(1500)
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight)
      })
      await this.wait(2000)

      // Extract items
      const extractedItems = await page.evaluate((baseUrl) => {
        const items = []
        const seen = new Set()

        // Look for common patterns: news items, article cards, list items
        const selectors = [
          'article', '.news-item', '.resource-item', '.publication',
          '.card', '.post', '.entry', 'li.item', '.list-item',
          '[class*="news"]', '[class*="article"]', '[class*="publication"]'
        ]

        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector)

          elements.forEach(el => {
            const linkEl = el.querySelector('a[href]')
            if (!linkEl) return

            let href = linkEl.href
            if (!href || seen.has(href)) return

            // Make absolute
            if (href.startsWith('/')) {
              href = baseUrl + href
            }

            // Skip non-content links
            if (href.includes('#') || href.includes('javascript:') ||
                href.includes('mailto:') || href.endsWith('.pdf')) return

            const title = linkEl.textContent?.trim() ||
                         el.querySelector('h1, h2, h3, h4, .title')?.textContent?.trim()

            if (!title || title.length < 10) return

            // Get date if available
            const dateEl = el.querySelector('time, .date, [datetime], [class*="date"]')
            const dateText = dateEl?.getAttribute('datetime') || dateEl?.textContent?.trim() || ''

            // Get description
            const descEl = el.querySelector('p, .summary, .excerpt, .description')
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

        // Fallback: look for any meaningful links
        if (items.length === 0) {
          const links = document.querySelectorAll('a[href]')
          links.forEach(link => {
            const href = link.href
            const text = link.textContent?.trim()

            if (href && text && text.length > 20 && !seen.has(href) &&
                !href.includes('#') && !href.endsWith('.pdf') &&
                (href.includes('/news/') || href.includes('/resources/') ||
                 href.includes('/publication') || href.includes('/standard'))) {
              seen.add(href)
              items.push({
                title: text.replace(/\s+/g, ' ').trim(),
                url: href,
                date: '',
                description: text.substring(0, 200)
              })
            }
          })
        }

        return items
      }, WOLFSBERG_CONFIG.baseUrl)

      // Process items
      for (const item of extractedItems.slice(0, WOLFSBERG_CONFIG.maxItems)) {
        items.push({
          headline: item.title,
          url: item.url,
          authority: 'WOLFSBERG',
          area: type,
          source_category: 'international_scraping',
          source_description: `Wolfsberg Group ${type}`,
          fetched_date: new Date().toISOString(),
          published_date: item.date ? new Date(item.date).toISOString() : null,
          raw_data: {
            sourceType: 'puppeteer',
            sourceKey: 'WOLFSBERG',
            country: 'International',
            region: 'International',
            priority: 'HIGH',
            summary: item.description || item.title,
            sectors: ['AML & Financial Crime', 'Banking', 'Compliance', 'KYC/CDD'],
            international: {
              isInternational: true,
              sourceAuthority: 'Wolfsberg Group',
              sourceCountry: 'International'
            }
          }
        })
      }

      return items
    } catch (error) {
      console.error(`   ❌ Failed to scrape ${url}:`, error.message)
      return items
    }
  }

  ServiceClass.prototype._deduplicateByUrl = function _deduplicateByUrl(items) {
    const seen = new Set()
    return items.filter(item => {
      if (seen.has(item.url)) return false
      seen.add(item.url)
      return true
    })
  }
}

module.exports = applyWolfsbergMethods
