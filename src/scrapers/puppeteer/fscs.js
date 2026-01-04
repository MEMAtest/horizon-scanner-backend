/**
 * FSCS UK Scraper
 *
 * Scrapes the Financial Services Compensation Scheme website for news.
 * FSCS is the UK's statutory deposit insurance and investors compensation scheme.
 * Structure: Card-based layout with h3 headlines in anchor links.
 */

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

puppeteer.use(StealthPlugin())

const FSCS_CONFIG = {
  newsUrl: 'https://www.fscs.org.uk/news/',
  baseUrl: 'https://www.fscs.org.uk',
  timeout: 60000,
  waitTime: 5000,
  maxItems: 25,
  maxAgeDays: 90
}

function applyFSCSMethods(ServiceClass) {
  ServiceClass.prototype.scrapeFSCS = async function scrapeFSCS() {
    console.log('\n' + '='.repeat(60))
    console.log('FSCS: Starting scrape of Financial Services Compensation Scheme...')
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

      console.log('\n📰 FSCS: Navigating to news page...')

      await page.goto(FSCS_CONFIG.newsUrl, {
        waitUntil: 'networkidle2',
        timeout: FSCS_CONFIG.timeout
      })

      await this.wait(FSCS_CONFIG.waitTime)

      // Scroll to load all content
      await page.evaluate(async () => {
        await new Promise(resolve => {
          let totalHeight = 0
          const distance = 500
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight
            window.scrollBy(0, distance)
            totalHeight += distance
            if (totalHeight >= scrollHeight) {
              clearInterval(timer)
              resolve()
            }
          }, 100)
        })
      })
      await this.wait(2000)

      const extractedItems = await page.evaluate((baseUrl) => {
        const items = []
        const seen = new Set()

        // FSCS uses card structure with a tags containing h3 headlines
        const articleLinks = document.querySelectorAll('a[href*="/news/"]')

        articleLinks.forEach(linkEl => {
          let href = linkEl.href || linkEl.getAttribute('href')
          if (!href || seen.has(href)) return

          // Normalize URL
          if (href.startsWith('/')) {
            href = baseUrl + href
          }

          // Skip non-article links
          if (href === baseUrl + '/news/' ||
              href.includes('#') ||
              href.includes('javascript:') ||
              href.endsWith('/news/fscs-news/') ||
              href.endsWith('/news/podcasts/') ||
              href.endsWith('/news/fraud-scams/')) return

          // Get title from h3 inside the link
          const titleEl = linkEl.querySelector('h3, h2, h4, .title')
          const title = titleEl?.textContent?.trim() || linkEl.textContent?.trim()

          if (!title || title.length < 10 || title === 'See all') return

          // Get description from p tag
          const descEl = linkEl.querySelector('p')
          const description = descEl?.textContent?.trim() || ''

          seen.add(href)
          items.push({
            title: title.replace(/\s+/g, ' ').trim(),
            url: href,
            description: description.substring(0, 300)
          })
        })

        return items
      }, FSCS_CONFIG.baseUrl)

      console.log(`📰 FSCS: Extracted ${extractedItems.length} items`)

      for (const item of extractedItems.slice(0, FSCS_CONFIG.maxItems)) {
        results.push({
          headline: item.title,
          url: item.url,
          authority: 'FSCS',
          area: 'News',
          source_category: 'international_scraping',
          source_description: 'Financial Services Compensation Scheme News',
          fetched_date: new Date().toISOString(),
          published_date: null,
          raw_data: {
            sourceType: 'puppeteer',
            sourceKey: 'FSCS',
            country: 'United Kingdom',
            region: 'Europe',
            priority: 'HIGH',
            summary: item.description || item.title,
            sectors: ['Consumer Protection', 'Banking', 'Insurance', 'Investment Management'],
            international: {
              isInternational: false,
              sourceAuthority: 'Financial Services Compensation Scheme',
              sourceCountry: 'United Kingdom'
            }
          }
        })
      }

      await page.close()

      console.log(`🎉 FSCS: Total items collected: ${results.length}`)

      return results
    } catch (error) {
      console.error('❌ FSCS scraping failed:', error.message)
      return results
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }
}

module.exports = applyFSCSMethods
