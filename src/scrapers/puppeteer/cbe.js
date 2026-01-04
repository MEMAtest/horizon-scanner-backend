/**
 * CBE Egypt Scraper
 *
 * Scrapes the Central Bank of Egypt website for news and regulatory updates.
 * CBE is Egypt's central bank and primary financial regulator.
 * Note: Site may have access restrictions - uses additional stealth measures.
 */

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

puppeteer.use(StealthPlugin())

const CBE_CONFIG = {
  newsUrl: 'https://www.cbe.org.eg/en/news-publications/news',
  baseUrl: 'https://www.cbe.org.eg',
  timeout: 60000,
  waitTime: 5000,
  maxItems: 20,
  maxAgeDays: 90
}

function applyCBEMethods(ServiceClass) {
  ServiceClass.prototype.scrapeCBE = async function scrapeCBE() {
    console.log('\n' + '='.repeat(60))
    console.log('CBE: Starting scrape of Central Bank of Egypt...')
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
          '--window-size=1920,1080',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process'
        ],
        defaultViewport: { width: 1920, height: 1080 }
      })

      const page = await browser.newPage()

      // Set comprehensive headers to avoid blocking
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      })

      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      )

      // Don't block resources for this site as it may affect access
      console.log('\n📰 CBE: Navigating to news page...')

      try {
        await page.goto(CBE_CONFIG.newsUrl, {
          waitUntil: 'networkidle2',
          timeout: CBE_CONFIG.timeout
        })
      } catch (navError) {
        console.log('CBE: Navigation timeout, attempting to continue...')
      }

      await this.wait(CBE_CONFIG.waitTime)

      // Check if we got blocked
      const pageContent = await page.content()
      if (pageContent.includes('URL was rejected') || pageContent.includes('consult with your administrator')) {
        console.log('⚠️ CBE: Access blocked by security filter. Trying alternative approach...')

        // Try the main news publications page
        try {
          await page.goto('https://www.cbe.org.eg/en/news-publications', {
            waitUntil: 'domcontentloaded',
            timeout: 30000
          })
          await this.wait(3000)
        } catch (e) {
          console.log('CBE: Alternative page also blocked')
        }
      }

      // Scroll to load content
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2)
      })
      await this.wait(2000)

      const extractedItems = await page.evaluate((baseUrl) => {
        const items = []
        const seen = new Set()

        // Try multiple selector patterns
        const containerSelectors = [
          'article', '.news-item', '.news-card', '.media-release',
          '.content-item', '.list-item', 'li.item', '.card',
          '[class*="news"]', '[class*="press"]', '.item'
        ]

        for (const selector of containerSelectors) {
          const elements = document.querySelectorAll(selector)

          elements.forEach(el => {
            const linkEl = el.querySelector('a[href]') || (el.tagName === 'A' ? el : null)
            if (!linkEl) return

            let href = linkEl.href || linkEl.getAttribute('href')
            if (!href || seen.has(href)) return

            if (href.startsWith('/')) {
              href = baseUrl + href
            }

            if (href.includes('#') || href.includes('javascript:') || href.includes('mailto:')) return

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
      }, CBE_CONFIG.baseUrl)

      console.log(`📰 CBE: Extracted ${extractedItems.length} items`)

      for (const item of extractedItems.slice(0, CBE_CONFIG.maxItems)) {
        results.push({
          headline: item.title,
          url: item.url,
          authority: 'CBE',
          area: 'News',
          source_category: 'international_scraping',
          source_description: 'Central Bank of Egypt News',
          fetched_date: new Date().toISOString(),
          published_date: item.date ? new Date(item.date).toISOString() : null,
          raw_data: {
            sourceType: 'puppeteer',
            sourceKey: 'CBE',
            country: 'Egypt',
            region: 'Africa',
            priority: 'HIGH',
            summary: item.description || item.title,
            sectors: ['Banking', 'Monetary Policy', 'AML & Financial Crime', 'Payment Services'],
            international: {
              isInternational: true,
              sourceAuthority: 'Central Bank of Egypt',
              sourceCountry: 'Egypt'
            }
          }
        })
      }

      await page.close()

      console.log(`🎉 CBE: Total items collected: ${results.length}`)

      return results
    } catch (error) {
      console.error('❌ CBE scraping failed:', error.message)
      return results
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }
}

module.exports = applyCBEMethods
