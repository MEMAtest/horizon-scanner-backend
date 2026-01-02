/**
 * SARB South Africa Scraper
 *
 * Scrapes the South African Reserve Bank website for news and regulatory updates.
 * SARB is South Africa's central bank and primary financial regulator.
 */

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

puppeteer.use(StealthPlugin())

const SARB_CONFIG = {
  newsroomUrl: 'https://www.resbank.co.za/en/home/newsroom',
  baseUrl: 'https://www.resbank.co.za',
  timeout: 60000,
  waitTime: 5000,
  maxItems: 20,
  maxAgeDays: 90
}

function applySARBMethods(ServiceClass) {
  ServiceClass.prototype.scrapeSARB = async function scrapeSARB() {
    console.log('\n' + '='.repeat(60))
    console.log('SARB: Starting scrape of South African Reserve Bank...')
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

      console.log('\n📰 SARB: Scraping newsroom page...')

      await page.goto(SARB_CONFIG.newsroomUrl, {
        waitUntil: 'networkidle2',
        timeout: SARB_CONFIG.timeout
      })

      await this.wait(SARB_CONFIG.waitTime)

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
          'article', '.news-item', '.media-release', '.press-release',
          '.content-item', '.list-item', 'li.item', '.card',
          '[class*="news"]', '[class*="media"]', '[class*="press"]'
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
      }, SARB_CONFIG.baseUrl)

      for (const item of extractedItems.slice(0, SARB_CONFIG.maxItems)) {
        results.push({
          headline: item.title,
          url: item.url,
          authority: 'SARB',
          area: 'News',
          source_category: 'international_scraping',
          source_description: 'South African Reserve Bank Newsroom',
          fetched_date: new Date().toISOString(),
          published_date: item.date ? new Date(item.date).toISOString() : null,
          raw_data: {
            sourceType: 'puppeteer',
            sourceKey: 'SARB',
            country: 'South Africa',
            region: 'Africa',
            priority: 'HIGH',
            summary: item.description || item.title,
            sectors: ['Banking', 'Financial Stability', 'AML & Financial Crime', 'Payment Services'],
            international: {
              isInternational: true,
              sourceAuthority: 'South African Reserve Bank',
              sourceCountry: 'South Africa'
            }
          }
        })
      }

      await page.close()

      console.log(`🎉 SARB: Total items collected: ${results.length}`)

      return results
    } catch (error) {
      console.error('❌ SARB scraping failed:', error.message)
      return results
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }
}

module.exports = applySARBMethods
