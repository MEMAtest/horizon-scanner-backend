/**
 * CBN Nigeria Scraper
 *
 * Scrapes the Central Bank of Nigeria website for news and regulatory updates.
 * CBN is Nigeria's central bank and primary financial regulator.
 * Uses Kendo UI Grid with AJAX loading from /api/GetAllNews
 */

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

puppeteer.use(StealthPlugin())

const CBN_CONFIG = {
  newsUrl: 'https://www.cbn.gov.ng/NewsArchive/News.html',
  baseUrl: 'https://www.cbn.gov.ng',
  timeout: 60000,
  waitTime: 5000,
  maxItems: 20,
  maxAgeDays: 90
}

function applyCBNMethods(ServiceClass) {
  ServiceClass.prototype.scrapeCBN = async function scrapeCBN() {
    console.log('\n' + '='.repeat(60))
    console.log('CBN: Starting scrape of Central Bank of Nigeria...')
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

      console.log('\n📰 CBN: Navigating to news archive...')

      await page.goto(CBN_CONFIG.newsUrl, {
        waitUntil: 'networkidle2',
        timeout: CBN_CONFIG.timeout
      })

      // Wait for Kendo Grid to load
      console.log('📰 CBN: Waiting for Kendo Grid to load...')
      await this.wait(CBN_CONFIG.waitTime)

      // Wait for grid content
      await page.waitForSelector('#grid', { timeout: 30000 }).catch(() => {
        console.log('CBN: Grid selector not found, trying alternative approach')
      })

      await this.wait(3000) // Additional wait for AJAX data

      const extractedItems = await page.evaluate((baseUrl) => {
        const items = []
        const seen = new Set()

        // Try to extract from Kendo Grid table
        const rows = document.querySelectorAll('#grid tbody tr, .k-grid tbody tr, table tbody tr')

        rows.forEach(row => {
          // Find the link element
          const linkEl = row.querySelector('a.download-link, a[href*="NewsArchive"], a[href*="news"], a[target="_blank"]')
          if (!linkEl) return

          let href = linkEl.href || linkEl.getAttribute('href')
          if (!href || seen.has(href)) return

          // Normalize URL
          if (href.startsWith('/')) {
            href = baseUrl + href
          }

          if (href.includes('#') || href.includes('javascript:')) return

          const title = linkEl.textContent?.trim()
          if (!title || title.length < 10) return

          // Get date from row cells
          const cells = row.querySelectorAll('td')
          let dateText = ''
          cells.forEach(cell => {
            const text = cell.textContent?.trim()
            // Look for date patterns
            if (text && /\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\d{4}[\/-]\d{1,2}[\/-]\d{1,2}|[A-Z][a-z]+ \d{1,2},? \d{4}/.test(text)) {
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

        // Fallback: try extracting from any news links on page
        if (items.length === 0) {
          const allLinks = document.querySelectorAll('a[href*="NewsArchive"], a[href*="news"], .news-item a, article a')
          allLinks.forEach(linkEl => {
            let href = linkEl.href
            if (!href || seen.has(href)) return

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
      }, CBN_CONFIG.baseUrl)

      console.log(`📰 CBN: Extracted ${extractedItems.length} items`)

      for (const item of extractedItems.slice(0, CBN_CONFIG.maxItems)) {
        // Parse date safely
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
          authority: 'CBN',
          area: 'News',
          source_category: 'international_scraping',
          source_description: 'Central Bank of Nigeria News Archive',
          fetched_date: new Date().toISOString(),
          published_date: publishedDate,
          raw_data: {
            sourceType: 'puppeteer',
            sourceKey: 'CBN',
            country: 'Nigeria',
            region: 'Africa',
            priority: 'HIGH',
            summary: item.title,
            sectors: ['Banking', 'Monetary Policy', 'AML & Financial Crime', 'Payment Services'],
            international: {
              isInternational: true,
              sourceAuthority: 'Central Bank of Nigeria',
              sourceCountry: 'Nigeria'
            }
          }
        })
      }

      await page.close()

      console.log(`🎉 CBN: Total items collected: ${results.length}`)

      return results
    } catch (error) {
      console.error('❌ CBN scraping failed:', error.message)
      return results
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }
}

module.exports = applyCBNMethods
