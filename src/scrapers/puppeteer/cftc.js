/**
 * CFTC US Scraper
 *
 * Scrapes the Commodity Futures Trading Commission website for press releases.
 * CFTC regulates derivatives markets including futures, swaps, and options.
 */

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

puppeteer.use(StealthPlugin())

const CFTC_CONFIG = {
  newsUrl: 'https://www.cftc.gov/PressRoom/PressReleases',
  baseUrl: 'https://www.cftc.gov',
  timeout: 60000,
  waitTime: 3000,
  maxItems: 20,
  maxAgeDays: 90
}

function applyCFTCMethods(ServiceClass) {
  ServiceClass.prototype.scrapeCFTC = async function scrapeCFTC() {
    console.log('\n' + '='.repeat(60))
    console.log('CFTC: Starting scrape of Commodity Futures Trading Commission...')
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

      console.log('\n📰 CFTC: Navigating to press releases page...')

      await page.goto(CFTC_CONFIG.newsUrl, {
        waitUntil: 'networkidle2',
        timeout: CFTC_CONFIG.timeout
      })

      await this.wait(CFTC_CONFIG.waitTime)

      const extractedItems = await page.evaluate((baseUrl) => {
        const items = []
        const seen = new Set()

        // CFTC uses a table or list structure for press releases
        const rows = document.querySelectorAll('.view-content .views-row, .press-release-item, table tbody tr, .item-list li')

        rows.forEach(row => {
          const linkEl = row.querySelector('a[href*="PressReleases"], a[href*="pressrelease"]')
          if (!linkEl) return

          let href = linkEl.href || linkEl.getAttribute('href')
          if (!href || seen.has(href)) return

          if (href.startsWith('/')) {
            href = baseUrl + href
          }

          if (href.includes('#') || href.includes('javascript:')) return

          const title = linkEl.textContent?.trim()
          if (!title || title.length < 10) return

          // Get date from row
          let dateText = ''
          const dateEl = row.querySelector('.date-display-single, .views-field-created, time, .date')
          if (dateEl) {
            dateText = dateEl.textContent?.trim() || dateEl.getAttribute('datetime') || ''
          }

          seen.add(href)
          items.push({
            title: title.replace(/\s+/g, ' ').trim(),
            url: href,
            date: dateText
          })
        })

        // Fallback: try generic link extraction
        if (items.length === 0) {
          const allLinks = document.querySelectorAll('a[href*="PressReleases"]')
          allLinks.forEach(linkEl => {
            let href = linkEl.href
            if (!href || seen.has(href) || href === baseUrl + '/PressRoom/PressReleases') return

            if (href.startsWith('/')) {
              href = baseUrl + href
            }

            const title = linkEl.textContent?.trim()
            if (!title || title.length < 10) return

            seen.add(href)
            items.push({
              title: title.replace(/\s+/g, ' ').trim(),
              url: href,
              date: ''
            })
          })
        }

        return items
      }, CFTC_CONFIG.baseUrl)

      console.log(`📰 CFTC: Extracted ${extractedItems.length} items`)

      for (const item of extractedItems.slice(0, CFTC_CONFIG.maxItems)) {
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
          authority: 'CFTC',
          area: 'Press Releases',
          source_category: 'international_scraping',
          source_description: 'CFTC Press Releases',
          fetched_date: new Date().toISOString(),
          published_date: publishedDate,
          raw_data: {
            sourceType: 'puppeteer',
            sourceKey: 'CFTC',
            country: 'US',
            region: 'Americas',
            priority: 'HIGH',
            summary: item.title,
            sectors: ['Derivatives', 'Capital Markets', 'Trading', 'Cryptocurrency'],
            international: {
              isInternational: true,
              sourceAuthority: 'Commodity Futures Trading Commission',
              sourceCountry: 'US'
            }
          }
        })
      }

      await page.close()

      console.log(`🎉 CFTC: Total items collected: ${results.length}`)

      return results
    } catch (error) {
      console.error('❌ CFTC scraping failed:', error.message)
      return results
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }
}

module.exports = applyCFTCMethods
