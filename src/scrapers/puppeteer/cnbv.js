/**
 * CNBV Mexico Scraper
 *
 * Scrapes the Comisión Nacional Bancaria y de Valores website for news.
 * CNBV is Mexico's banking and securities regulator.
 */

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

puppeteer.use(StealthPlugin())

const CNBV_CONFIG = {
  newsUrl: 'https://www.gob.mx/cnbv/prensa',
  baseUrl: 'https://www.gob.mx',
  timeout: 90000,  // Increased for slow government servers
  waitTime: 8000,  // Increased wait time
  maxItems: 20,
  maxAgeDays: 90
}

function applyCNBVMethods(ServiceClass) {
  ServiceClass.prototype.scrapeCNBV = async function scrapeCNBV() {
    console.log('\n' + '='.repeat(60))
    console.log('CNBV: Starting scrape of Mexican Banking Commission...')
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

      console.log('\n📰 CNBV: Navigating to press page...')

      await page.goto(CNBV_CONFIG.newsUrl, {
        waitUntil: 'networkidle2',
        timeout: CNBV_CONFIG.timeout
      })

      await this.wait(CNBV_CONFIG.waitTime)

      const extractedItems = await page.evaluate((baseUrl) => {
        const items = []
        const seen = new Set()

        // gob.mx uses specific article structure
        const articles = document.querySelectorAll('article, .article-item, .news-item, .prensa-item, .list-item')

        articles.forEach(article => {
          const linkEl = article.querySelector('a[href*="gob.mx"], h2 a, h3 a, .title a')
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
          const dateEl = article.querySelector('time, .date, .fecha, .article-date')
          if (dateEl) {
            dateText = dateEl.getAttribute('datetime') || dateEl.textContent?.trim() || ''
          }

          seen.add(href)
          items.push({
            title: title.replace(/\s+/g, ' ').trim(),
            url: href,
            date: dateText
          })
        })

        // Fallback: look for links in list
        if (items.length === 0) {
          const allLinks = document.querySelectorAll('.list a, .articles a, main a')
          allLinks.forEach(linkEl => {
            let href = linkEl.href
            if (!href || seen.has(href)) return

            if (href.startsWith('/')) {
              href = baseUrl + href
            }

            // Skip utility links
            if (href.includes('compartir') || href.includes('share')) return

            const title = linkEl.textContent?.trim()
            if (!title || title.length < 20) return

            seen.add(href)
            items.push({
              title: title.replace(/\s+/g, ' ').trim(),
              url: href,
              date: ''
            })
          })
        }

        return items
      }, CNBV_CONFIG.baseUrl)

      console.log(`📰 CNBV: Extracted ${extractedItems.length} items`)

      for (const item of extractedItems.slice(0, CNBV_CONFIG.maxItems)) {
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
          authority: 'CNBV',
          area: 'Press',
          source_category: 'international_scraping',
          source_description: 'CNBV Mexico Press Releases',
          fetched_date: new Date().toISOString(),
          published_date: publishedDate,
          raw_data: {
            sourceType: 'puppeteer',
            sourceKey: 'CNBV',
            country: 'Mexico',
            region: 'Americas',
            priority: 'HIGH',
            summary: item.title,
            sectors: ['Banking', 'Capital Markets', 'AML & Financial Crime', 'Fintech'],
            international: {
              isInternational: true,
              sourceAuthority: 'Comisión Nacional Bancaria y de Valores',
              sourceCountry: 'Mexico'
            }
          }
        })
      }

      await page.close()

      console.log(`🎉 CNBV: Total items collected: ${results.length}`)

      return results
    } catch (error) {
      console.error('❌ CNBV scraping failed:', error.message)
      return results
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }
}

module.exports = applyCNBVMethods
