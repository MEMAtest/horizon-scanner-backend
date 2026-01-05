/**
 * BCBS Scraper
 *
 * Scrapes the Basel Committee on Banking Supervision publications.
 * BCBS sets global standards for bank regulation (Basel III, etc.).
 */

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

puppeteer.use(StealthPlugin())

const BCBS_CONFIG = {
  newsUrl: 'https://www.bis.org/bcbs/publications.htm',
  baseUrl: 'https://www.bis.org',
  timeout: 60000,
  waitTime: 3000,
  maxItems: 20,
  maxAgeDays: 120
}

function applyBCBSMethods(ServiceClass) {
  ServiceClass.prototype.scrapeBCBS = async function scrapeBCBS() {
    console.log('\n' + '='.repeat(60))
    console.log('BCBS: Starting scrape of Basel Committee on Banking Supervision...')
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

      console.log('\n📰 BCBS: Navigating to publications page...')

      await page.goto(BCBS_CONFIG.newsUrl, {
        waitUntil: 'networkidle2',
        timeout: BCBS_CONFIG.timeout
      })

      await this.wait(BCBS_CONFIG.waitTime)

      const extractedItems = await page.evaluate((baseUrl) => {
        const items = []
        const seen = new Set()

        // BIS website uses specific table structure for publications
        const rows = document.querySelectorAll('.bcbs_list tr, table.documentList tr, .document-list tr, .publication-item, article')

        rows.forEach(row => {
          const linkEl = row.querySelector('a[href*=".htm"], a[href*=".pdf"], a.title')
          if (!linkEl) return

          let href = linkEl.href || linkEl.getAttribute('href')
          if (!href || seen.has(href)) return

          if (href.startsWith('/')) {
            href = baseUrl + href
          }

          // Skip PDF links if HTML version exists
          if (href.endsWith('.pdf') && seen.has(href.replace('.pdf', '.htm'))) return

          if (href.includes('#') || href.includes('javascript:')) return

          const title = linkEl.textContent?.trim()
          if (!title || title.length < 10) return

          // Get date from row
          let dateText = ''
          const cells = row.querySelectorAll('td')
          cells.forEach(cell => {
            const text = cell.textContent?.trim()
            // Match date patterns like "02 Jan 2026" or "January 2026"
            if (text && /\d{1,2} [A-Z][a-z]+ \d{4}|[A-Z][a-z]+ \d{4}|[A-Z][a-z]+ \d{1,2},? \d{4}/.test(text)) {
              if (!dateText) dateText = text
            }
          })

          // Also check for date class
          const dateEl = row.querySelector('.date, time, .pubDate')
          if (dateEl && !dateText) {
            dateText = dateEl.textContent?.trim() || ''
          }

          seen.add(href)
          items.push({
            title: title.replace(/\s+/g, ' ').trim(),
            url: href,
            date: dateText
          })
        })

        // Fallback: look for any publication links
        if (items.length === 0) {
          const allLinks = document.querySelectorAll('#main a[href*="bcbs"], .content a[href*="publ"]')
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
      }, BCBS_CONFIG.baseUrl)

      console.log(`📰 BCBS: Extracted ${extractedItems.length} items`)

      for (const item of extractedItems.slice(0, BCBS_CONFIG.maxItems)) {
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
          authority: 'BCBS',
          area: 'Publications',
          source_category: 'international_scraping',
          source_description: 'Basel Committee Publications',
          fetched_date: new Date().toISOString(),
          published_date: publishedDate,
          raw_data: {
            sourceType: 'puppeteer',
            sourceKey: 'BCBS',
            country: 'International',
            region: 'International',
            priority: 'HIGH',
            summary: item.title,
            sectors: ['Banking', 'Capital Requirements', 'Prudential Regulation'],
            international: {
              isInternational: true,
              sourceAuthority: 'Basel Committee on Banking Supervision',
              sourceCountry: 'International'
            }
          }
        })
      }

      await page.close()

      console.log(`🎉 BCBS: Total items collected: ${results.length}`)

      return results
    } catch (error) {
      console.error('❌ BCBS scraping failed:', error.message)
      return results
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }
}

module.exports = applyBCBSMethods
