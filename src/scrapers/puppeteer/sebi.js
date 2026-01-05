/**
 * SEBI India Scraper
 *
 * Scrapes the Securities and Exchange Board of India website for press releases.
 * SEBI is India's securities market regulator.
 */

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

puppeteer.use(StealthPlugin())

const SEBI_CONFIG = {
  newsUrl: 'https://www.sebi.gov.in/sebiweb/home/HomeAction.do?doListingAll=yes&sid=1&ssid=2&smession=No',
  baseUrl: 'https://www.sebi.gov.in',
  timeout: 60000,
  waitTime: 5000,
  maxItems: 20,
  maxAgeDays: 90
}

function applySEBIMethods(ServiceClass) {
  ServiceClass.prototype.scrapeSEBI = async function scrapeSEBI() {
    console.log('\n' + '='.repeat(60))
    console.log('SEBI: Starting scrape of Securities and Exchange Board of India...')
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

      console.log('\n📰 SEBI: Navigating to press releases page...')

      await page.goto(SEBI_CONFIG.newsUrl, {
        waitUntil: 'networkidle2',
        timeout: SEBI_CONFIG.timeout
      })

      await this.wait(SEBI_CONFIG.waitTime)

      const extractedItems = await page.evaluate((baseUrl) => {
        const items = []
        const seen = new Set()

        // SEBI uses table structure for press releases
        const rows = document.querySelectorAll('table tr, .list-group-item, .press-item, .news-item')

        rows.forEach(row => {
          const linkEl = row.querySelector('a[href*="HomeAction"], a[href*=".html"], a[href*=".pdf"]')
          if (!linkEl) return

          let href = linkEl.href || linkEl.getAttribute('href')
          if (!href || seen.has(href)) return

          if (href.startsWith('/')) {
            href = baseUrl + href
          }

          if (href.includes('#') || href.includes('javascript:')) return

          const title = linkEl.textContent?.trim()
          if (!title || title.length < 10) return

          // Get date - SEBI typically shows date in a cell
          let dateText = ''
          const cells = row.querySelectorAll('td')
          cells.forEach(cell => {
            const text = cell.textContent?.trim()
            // Match date patterns like "Jan 02, 2026" or "02/01/2026"
            if (text && /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|[A-Z][a-z]+ \d{1,2},? \d{4}|\d{1,2} [A-Z][a-z]+ \d{4}/.test(text)) {
              dateText = text
            }
          })

          seen.add(href)
          items.push({
            title: title.replace(/\s+/g, ' ').trim(),
            url: href,
            date: dateText
          })
        })

        // Fallback: look for links in main content
        if (items.length === 0) {
          const allLinks = document.querySelectorAll('#content a, .main-content a, article a')
          allLinks.forEach(linkEl => {
            let href = linkEl.href
            if (!href || seen.has(href)) return

            if (href.startsWith('/')) {
              href = baseUrl + href
            }

            const title = linkEl.textContent?.trim()
            if (!title || title.length < 15) return

            seen.add(href)
            items.push({
              title: title.replace(/\s+/g, ' ').trim(),
              url: href,
              date: ''
            })
          })
        }

        return items
      }, SEBI_CONFIG.baseUrl)

      console.log(`📰 SEBI: Extracted ${extractedItems.length} items`)

      for (const item of extractedItems.slice(0, SEBI_CONFIG.maxItems)) {
        let publishedDate = null
        if (item.date) {
          try {
            const parsed = new Date(item.date)
            if (!isNaN(parsed.getTime())) {
              publishedDate = parsed.toISOString()
            }
          } catch (e) {
            // Ignore invalid dates
          }
        }

        results.push({
          headline: item.title,
          url: item.url,
          authority: 'SEBI',
          area: 'Press Releases',
          source_category: 'international_scraping',
          source_description: 'SEBI Press Releases',
          fetched_date: new Date().toISOString(),
          published_date: publishedDate,
          raw_data: {
            sourceType: 'puppeteer',
            sourceKey: 'SEBI',
            country: 'India',
            region: 'Asia-Pacific',
            priority: 'HIGH',
            summary: item.title,
            sectors: ['Capital Markets', 'Investment Management', 'Corporate Governance'],
            international: {
              isInternational: true,
              sourceAuthority: 'Securities and Exchange Board of India',
              sourceCountry: 'India'
            }
          }
        })
      }

      await page.close()

      console.log(`🎉 SEBI: Total items collected: ${results.length}`)

      return results
    } catch (error) {
      console.error('❌ SEBI scraping failed:', error.message)
      return results
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }
}

module.exports = applySEBIMethods
