/**
 * CIMA Cayman Islands Scraper
 *
 * Scrapes the Cayman Islands Monetary Authority website for industry notices
 * and regulatory updates. CIMA is the primary financial regulator for one of
 * the world's major offshore financial centers.
 */

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

puppeteer.use(StealthPlugin())

const CIMA_CONFIG = {
  noticesUrl: 'https://www.cima.ky/general-industry-notices',
  baseUrl: 'https://www.cima.ky',
  timeout: 60000,
  waitTime: 5000,
  maxItems: 20,
  maxAgeDays: 90
}

function applyCIMAMethods(ServiceClass) {
  ServiceClass.prototype.scrapeCIMA = async function scrapeCIMA() {
    console.log('\n' + '='.repeat(60))
    console.log('CIMA: Starting scrape of Cayman Islands Monetary Authority...')
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

      console.log('\n📰 CIMA: Scraping industry notices page...')

      await page.goto(CIMA_CONFIG.noticesUrl, {
        waitUntil: 'networkidle2',
        timeout: CIMA_CONFIG.timeout
      })

      await this.wait(CIMA_CONFIG.waitTime)

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
          'article', '.notice-item', '.news-item', '.content-item',
          '.list-item', 'li.item', '.row > div', 'tr',
          '[class*="notice"]', '[class*="news"]', '[class*="item"]'
        ]

        for (const selector of containerSelectors) {
          const elements = document.querySelectorAll(selector)

          elements.forEach(el => {
            const linkEl = el.querySelector('a[href]')
            if (!linkEl) return

            let href = linkEl.href
            if (!href || seen.has(href)) return

            if (href.startsWith('/')) {
              href = baseUrl + href
            }

            if (href.includes('#') || href.includes('javascript:') ||
                href.includes('mailto:')) return

            const title = el.querySelector('h1, h2, h3, h4, .title, [class*="title"]')?.textContent?.trim() ||
                         linkEl.textContent?.trim()

            if (!title || title.length < 10) return

            // Get date
            const dateEl = el.querySelector('time, .date, [datetime], [class*="date"], span.meta')
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

        return items
      }, CIMA_CONFIG.baseUrl)

      for (const item of extractedItems.slice(0, CIMA_CONFIG.maxItems)) {
        results.push({
          headline: item.title,
          url: item.url,
          authority: 'CIMA',
          area: 'Industry Notice',
          source_category: 'international_scraping',
          source_description: 'Cayman Islands Monetary Authority Industry Notices',
          fetched_date: new Date().toISOString(),
          published_date: item.date ? new Date(item.date).toISOString() : null,
          raw_data: {
            sourceType: 'puppeteer',
            sourceKey: 'CIMA',
            country: 'Cayman Islands',
            region: 'Caribbean',
            priority: 'HIGH',
            summary: item.description || item.title,
            sectors: ['Banking', 'Investment Management', 'Insurance', 'AML & Financial Crime'],
            international: {
              isInternational: true,
              sourceAuthority: 'Cayman Islands Monetary Authority',
              sourceCountry: 'Cayman Islands'
            }
          }
        })
      }

      await page.close()

      console.log(`🎉 CIMA: Total items collected: ${results.length}`)

      return results
    } catch (error) {
      console.error('❌ CIMA scraping failed:', error.message)
      return results
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }
}

module.exports = applyCIMAMethods
