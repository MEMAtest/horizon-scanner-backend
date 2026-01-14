/**
 * FIC South Africa Scraper
 *
 * Scrapes the Financial Intelligence Centre website for news and alerts.
 * FIC is South Africa's AML/CFT authority.
 */

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

puppeteer.use(StealthPlugin())

const FIC_CONFIG = {
  newsUrl: 'https://www.fic.gov.za/',
  baseUrl: 'https://www.fic.gov.za',
  timeout: 60000,
  waitTime: 5000,
  maxItems: 20,
  maxAgeDays: 90
}

function applyFICSAMethods(ServiceClass) {
  ServiceClass.prototype.scrapeFICSA = async function scrapeFICSA() {
    console.log('\n' + '='.repeat(60))
    console.log('FIC_SA: Starting scrape of Financial Intelligence Centre...')
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

      console.log('\n📰 FIC_SA: Navigating to news page...')

      await page.goto(FIC_CONFIG.newsUrl, {
        waitUntil: 'networkidle2',
        timeout: FIC_CONFIG.timeout
      })

      await this.wait(FIC_CONFIG.waitTime)

      const extractedItems = await page.evaluate((baseUrl) => {
        const items = []
        const seen = new Set()

        // Skip patterns for navigation/utility links
        const skipPatterns = [
          '#', 'javascript:', 'elementor-action', 'popup', 'modal',
          'submit', 'contact', 'subscribe', 'login', 'register',
          'mailto:', 'tel:', 'linkedin', 'twitter', 'facebook',
          'category', 'tag', '/page/', 'search'
        ]

        // Skip generic navigation text
        const skipTitles = [
          'read more', 'learn more', 'click here', 'view all',
          'general notices', 'media releases', 'annual reports',
          'publications', 'events', 'home', 'about', 'contact'
        ]

        // FIC newsroom uses a carousel/scroll widget or article elements
        const newsContainers = document.querySelectorAll('.ue_post_scroll_item, .elementor-post, article, .news-item, .media-release-item, .post-item')

        newsContainers.forEach(container => {
          // Try multiple link selectors (carousel uses .uc_more_btn)
          const linkEl = container.querySelector('.uc_more_btn, .ue-post-title a, a[href*="fic.gov.za"]:not([href*="#"]), h2 a, h3 a, .elementor-post__title a')
          if (!linkEl) return

          let href = linkEl.href || linkEl.getAttribute('href')
          if (!href || seen.has(href)) return

          // Skip navigation/utility links
          if (skipPatterns.some(pattern => href.toLowerCase().includes(pattern))) return

          if (href.startsWith('/')) {
            href = baseUrl + href
          }

          // Get title from .ue-post-title or link text
          const titleEl = container.querySelector('.ue-post-title, h2, h3')
          const title = titleEl?.textContent?.trim() || linkEl.textContent?.trim()
          if (!title || title.length < 15) return

          // Skip generic navigation titles
          if (skipTitles.some(skip => title.toLowerCase() === skip || title.toLowerCase().includes(skip))) return

          // Get date from .ue-calendar-date or other date elements
          let dateText = ''
          const dateEl = container.querySelector('.ue-calendar-date, .ue-post-calendar, time, .date, .elementor-post-date, .post-date, .published')
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

        // Look for news articles with date-based URLs (e.g., /2025/12/19/slug/)
        const allLinks = document.querySelectorAll('a[href*="fic.gov.za"]')
        allLinks.forEach(linkEl => {
          let href = linkEl.href
          if (!href || seen.has(href)) return

          // Only get links that match date pattern /YYYY/MM/DD/
          const datePattern = /\/20\d{2}\/\d{2}\/\d{2}\//
          if (!datePattern.test(href)) return

          // Skip navigation/utility links
          if (skipPatterns.some(pattern => href.toLowerCase().includes(pattern))) return

          const title = linkEl.textContent?.trim()
          if (!title || title.length < 25) return

          // Skip generic navigation titles
          if (skipTitles.some(skip => title.toLowerCase() === skip || title.toLowerCase().includes(skip))) return

          // Extract date from URL
          const dateMatch = href.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//)
          let dateText = ''
          if (dateMatch) {
            dateText = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`
          }

          seen.add(href)
          items.push({
            title: title.replace(/\s+/g, ' ').trim(),
            url: href,
            date: dateText
          })
        })

        return items
      }, FIC_CONFIG.baseUrl)

      console.log(`📰 FIC_SA: Extracted ${extractedItems.length} items`)

      for (const item of extractedItems.slice(0, FIC_CONFIG.maxItems)) {
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
          authority: 'FIC_SA',
          area: 'News',
          source_category: 'international_scraping',
          source_description: 'FIC South Africa News',
          fetched_date: new Date().toISOString(),
          published_date: publishedDate,
          raw_data: {
            sourceType: 'puppeteer',
            sourceKey: 'FIC_SA',
            country: 'South Africa',
            region: 'Africa',
            priority: 'HIGH',
            summary: item.title,
            sectors: ['AML & Financial Crime', 'Banking', 'Compliance', 'Terrorism Financing'],
            international: {
              isInternational: true,
              sourceAuthority: 'Financial Intelligence Centre',
              sourceCountry: 'South Africa'
            }
          }
        })
      }

      await page.close()

      console.log(`🎉 FIC_SA: Total items collected: ${results.length}`)

      return results
    } catch (error) {
      console.error('❌ FIC_SA scraping failed:', error.message)
      return results
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }
}

module.exports = applyFICSAMethods
