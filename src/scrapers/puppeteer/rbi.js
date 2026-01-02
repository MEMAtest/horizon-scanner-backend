/**
 * RBI India Scraper
 *
 * Scrapes the Reserve Bank of India website for press releases and regulatory updates.
 * RBI is India's central bank and primary financial regulator.
 */

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

puppeteer.use(StealthPlugin())

const RBI_CONFIG = {
  pressReleasesUrl: 'https://rbi.org.in/Scripts/BS_PressreleaseDisplay.aspx',
  baseUrl: 'https://rbi.org.in',
  timeout: 60000,
  waitTime: 5000,
  maxItems: 20,
  maxAgeDays: 90
}

function applyRBIMethods(ServiceClass) {
  ServiceClass.prototype.scrapeRBI = async function scrapeRBI() {
    console.log('\n' + '='.repeat(60))
    console.log('RBI: Starting scrape of Reserve Bank of India website...')
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
        if (['image', 'font', 'media', 'stylesheet'].includes(resourceType)) {
          req.abort()
        } else {
          req.continue()
        }
      })

      console.log('\n📰 RBI: Scraping press releases page...')

      await page.goto(RBI_CONFIG.pressReleasesUrl, {
        waitUntil: 'networkidle2',
        timeout: RBI_CONFIG.timeout
      })

      await this.wait(RBI_CONFIG.waitTime)

      // Scroll to load content
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2)
      })
      await this.wait(2000)

      const extractedItems = await page.evaluate((baseUrl) => {
        const items = []
        const seen = new Set()

        // RBI uses table-based layout for press releases
        const rows = document.querySelectorAll('table tr, .press-release-item, article, .news-item')

        rows.forEach(row => {
          const linkEl = row.querySelector('a[href]')
          if (!linkEl) return

          let href = linkEl.href
          if (!href || seen.has(href)) return

          if (href.startsWith('/')) {
            href = baseUrl + href
          }

          if (href.includes('#') || href.includes('javascript:')) return

          const title = linkEl.textContent?.trim()
          if (!title || title.length < 10) return

          // Get date from row
          const cells = row.querySelectorAll('td')
          let dateText = ''
          cells.forEach(cell => {
            const text = cell.textContent?.trim()
            // Look for date patterns like "Dec 30, 2025" or "30-12-2025"
            if (text && (text.match(/\d{1,2}[-\/]\d{1,2}[-\/]\d{4}/) ||
                text.match(/\w{3}\s+\d{1,2},?\s+\d{4}/))) {
              dateText = text
            }
          })

          seen.add(href)
          items.push({
            title: title.replace(/\s+/g, ' ').trim(),
            url: href,
            date: dateText,
            description: title.substring(0, 200)
          })
        })

        return items
      }, RBI_CONFIG.baseUrl)

      for (const item of extractedItems.slice(0, RBI_CONFIG.maxItems)) {
        results.push({
          headline: item.title,
          url: item.url,
          authority: 'RBI',
          area: 'Press Release',
          source_category: 'international_scraping',
          source_description: 'Reserve Bank of India Press Releases',
          fetched_date: new Date().toISOString(),
          published_date: item.date ? new Date(item.date).toISOString() : null,
          raw_data: {
            sourceType: 'puppeteer',
            sourceKey: 'RBI',
            country: 'India',
            region: 'Asia-Pacific',
            priority: 'HIGH',
            summary: item.description || item.title,
            sectors: ['Banking', 'Payment Services', 'AML & Financial Crime', 'Fintech'],
            international: {
              isInternational: true,
              sourceAuthority: 'Reserve Bank of India',
              sourceCountry: 'India'
            }
          }
        })
      }

      await page.close()

      console.log(`🎉 RBI: Total items collected: ${results.length}`)

      return results
    } catch (error) {
      console.error('❌ RBI scraping failed:', error.message)
      return results
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }
}

module.exports = applyRBIMethods
