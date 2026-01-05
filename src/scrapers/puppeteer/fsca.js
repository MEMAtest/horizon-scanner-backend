/**
 * FSCA South Africa Scraper
 *
 * Scrapes the Financial Sector Conduct Authority website for media releases.
 * FSCA is South Africa's market conduct regulator.
 */

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

puppeteer.use(StealthPlugin())

const FSCA_CONFIG = {
  newsUrl: 'https://www.fsca.co.za/Latest-News/',
  baseUrl: 'https://www.fsca.co.za',
  timeout: 60000,
  waitTime: 5000,
  maxItems: 20,
  maxAgeDays: 90
}

function applyFSCAMethods(ServiceClass) {
  ServiceClass.prototype.scrapeFSCA = async function scrapeFSCA() {
    console.log('\n' + '='.repeat(60))
    console.log('FSCA: Starting scrape of Financial Sector Conduct Authority...')
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

      console.log('\n📰 FSCA: Navigating to media releases page...')

      await page.goto(FSCA_CONFIG.newsUrl, {
        waitUntil: 'networkidle2',
        timeout: FSCA_CONFIG.timeout
      })

      await this.wait(FSCA_CONFIG.waitTime)

      const extractedItems = await page.evaluate((baseUrl) => {
        const items = []
        const seen = new Set()

        // FSCA uses Bootstrap .news-card components
        const newsCards = document.querySelectorAll('.news-card')

        newsCards.forEach(card => {
          // Get headline from h5 in card-body
          const headlineEl = card.querySelector('.card-body h5, .card-body h4, .card-body .card-title')
          if (!headlineEl) return

          const title = headlineEl.textContent?.trim()
          if (!title || title.length < 15) return

          // Get link - may be on headline or on a read more button
          let href = ''
          const linkEl = card.querySelector('a[href*="_api"], a[href*="News"], a[href*="Press"]')
          if (linkEl) {
            href = linkEl.href || linkEl.getAttribute('href') || ''
          }

          // If no direct link found, try to find any link in the card
          if (!href) {
            const anyLink = card.querySelector('a[href]')
            if (anyLink) {
              href = anyLink.href || anyLink.getAttribute('href') || ''
            }
          }

          if (!href || seen.has(href)) return
          if (href.includes('#') || href.includes('javascript:')) return

          if (href.startsWith('/')) {
            href = baseUrl + href
          }

          // Get description if available
          const descEl = card.querySelector('.card-body p')
          const description = descEl?.textContent?.trim() || ''

          seen.add(href)
          items.push({
            title: title.replace(/\s+/g, ' ').trim(),
            url: href,
            date: '',
            description: description.substring(0, 200)
          })
        })

        // Fallback: look for any news-style links if cards not found
        if (items.length < 3) {
          const allLinks = document.querySelectorAll('a[href*="_api/cr3ad_"]')
          allLinks.forEach(linkEl => {
            let href = linkEl.href
            if (!href || seen.has(href)) return

            const title = linkEl.textContent?.trim()
            if (!title || title.length < 20) return

            // Skip generic text
            if (title.toLowerCase().includes('read more') ||
                title.toLowerCase().includes('click here')) return

            if (href.startsWith('/')) {
              href = baseUrl + href
            }

            seen.add(href)
            items.push({
              title: title.replace(/\s+/g, ' ').trim(),
              url: href,
              date: '',
              description: ''
            })
          })
        }

        return items
      }, FSCA_CONFIG.baseUrl)

      console.log(`📰 FSCA: Extracted ${extractedItems.length} items`)

      for (const item of extractedItems.slice(0, FSCA_CONFIG.maxItems)) {
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
          authority: 'FSCA',
          area: 'Media Releases',
          source_category: 'international_scraping',
          source_description: 'FSCA Media Releases',
          fetched_date: new Date().toISOString(),
          published_date: publishedDate,
          raw_data: {
            sourceType: 'puppeteer',
            sourceKey: 'FSCA',
            country: 'South Africa',
            region: 'Africa',
            priority: 'HIGH',
            summary: item.title,
            sectors: ['Capital Markets', 'Insurance', 'Consumer Protection', 'Cryptocurrency'],
            international: {
              isInternational: true,
              sourceAuthority: 'Financial Sector Conduct Authority',
              sourceCountry: 'South Africa'
            }
          }
        })
      }

      await page.close()

      console.log(`🎉 FSCA: Total items collected: ${results.length}`)

      return results
    } catch (error) {
      console.error('❌ FSCA scraping failed:', error.message)
      return results
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }
}

module.exports = applyFSCAMethods
