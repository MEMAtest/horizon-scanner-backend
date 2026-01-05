/**
 * CONSOB Italy Scraper
 *
 * Scrapes the Commissione Nazionale per le Società e la Borsa website.
 * CONSOB is Italy's securities market regulator.
 */

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

puppeteer.use(StealthPlugin())

const CONSOB_CONFIG = {
  newsUrl: 'https://www.consob.it/web/consob-and-its-activities/press-releases',
  baseUrl: 'https://www.consob.it',
  timeout: 60000,
  waitTime: 5000,
  maxItems: 20,
  maxAgeDays: 90
}

function applyCONSOBMethods(ServiceClass) {
  ServiceClass.prototype.scrapeCONSOB = async function scrapeCONSOB() {
    console.log('\n' + '='.repeat(60))
    console.log('CONSOB: Starting scrape of Italian Securities Commission...')
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

      console.log('\n📰 CONSOB: Navigating to press releases page...')

      await page.goto(CONSOB_CONFIG.newsUrl, {
        waitUntil: 'networkidle2',
        timeout: CONSOB_CONFIG.timeout
      })

      await this.wait(CONSOB_CONFIG.waitTime)

      const extractedItems = await page.evaluate((baseUrl) => {
        const items = []
        const seen = new Set()

        // CONSOB uses Liferay portal, look for asset entries
        const rows = document.querySelectorAll('.asset-entry, .entry-title, .list-group-item, article, .news-item, .press-release')

        rows.forEach(row => {
          const linkEl = row.querySelector('a[href*="consob"], a.title-link, h3 a, h4 a, .entry-title a')
          if (!linkEl) return

          let href = linkEl.href || linkEl.getAttribute('href')
          if (!href || seen.has(href)) return

          if (href.startsWith('/')) {
            href = baseUrl + href
          }

          if (href.includes('#') || href.includes('javascript:')) return

          const title = linkEl.textContent?.trim()
          if (!title || title.length < 10) return

          // Get date
          let dateText = ''
          const dateEl = row.querySelector('.date, time, .publish-date, .entry-date, span[class*="date"]')
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

        // Fallback: look for links in main content area
        if (items.length === 0) {
          const allLinks = document.querySelectorAll('.portlet-body a, #main-content a, .journal-content a')
          allLinks.forEach(linkEl => {
            let href = linkEl.href
            if (!href || seen.has(href)) return

            if (href.startsWith('/')) {
              href = baseUrl + href
            }

            const title = linkEl.textContent?.trim()
            if (!title || title.length < 15) return

            // Skip navigation links
            if (title.toLowerCase().includes('next') || title.toLowerCase().includes('prev')) return

            seen.add(href)
            items.push({
              title: title.replace(/\s+/g, ' ').trim(),
              url: href,
              date: ''
            })
          })
        }

        return items
      }, CONSOB_CONFIG.baseUrl)

      console.log(`📰 CONSOB: Extracted ${extractedItems.length} items`)

      for (const item of extractedItems.slice(0, CONSOB_CONFIG.maxItems)) {
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
          authority: 'CONSOB',
          area: 'Press Releases',
          source_category: 'international_scraping',
          source_description: 'CONSOB Press Releases',
          fetched_date: new Date().toISOString(),
          published_date: publishedDate,
          raw_data: {
            sourceType: 'puppeteer',
            sourceKey: 'CONSOB',
            country: 'Italy',
            region: 'Europe',
            priority: 'MEDIUM',
            summary: item.title,
            sectors: ['Capital Markets', 'Corporate Governance', 'Listed Companies'],
            international: {
              isInternational: true,
              sourceAuthority: 'Commissione Nazionale per le Società e la Borsa',
              sourceCountry: 'Italy'
            }
          }
        })
      }

      await page.close()

      console.log(`🎉 CONSOB: Total items collected: ${results.length}`)

      return results
    } catch (error) {
      console.error('❌ CONSOB scraping failed:', error.message)
      return results
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }
}

module.exports = applyCONSOBMethods
