/**
 * EU Council Scraper
 *
 * Scrapes the European Council website for sanctions updates.
 * The EU Council adopts sanctions packages affecting financial services.
 */

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

puppeteer.use(StealthPlugin())

const EU_COUNCIL_CONFIG = {
  newsUrl: 'https://www.consilium.europa.eu/en/press/press-releases/',
  baseUrl: 'https://www.consilium.europa.eu',
  timeout: 60000,
  waitTime: 5000,
  maxItems: 20,
  maxAgeDays: 90
}

function applyEUCouncilMethods(ServiceClass) {
  ServiceClass.prototype.scrapeEUCouncil = async function scrapeEUCouncil() {
    console.log('\n' + '='.repeat(60))
    console.log('EU_COUNCIL: Starting scrape of European Council...')
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

      console.log('\n📰 EU_COUNCIL: Navigating to sanctions page...')

      await page.goto(EU_COUNCIL_CONFIG.newsUrl, {
        waitUntil: 'networkidle2',
        timeout: EU_COUNCIL_CONFIG.timeout
      })

      await this.wait(EU_COUNCIL_CONFIG.waitTime)

      const extractedItems = await page.evaluate((baseUrl) => {
        const items = []
        const seen = new Set()

        // Skip language codes - these are navigation not content
        const languageCodes = ['bg', 'cs', 'da', 'de', 'el', 'en', 'es', 'et', 'fi', 'fr', 'ga', 'hr', 'hu', 'it', 'lt', 'lv', 'mt', 'nl', 'pl', 'pt', 'ro', 'sk', 'sl', 'sv']

        // EU Council press releases page structure
        const articles = document.querySelectorAll('.list-item, .press-release-item, article.press-release, .news-card, [data-type="press-release"]')

        articles.forEach(article => {
          const linkEl = article.querySelector('a.title, h2 a, h3 a, .press-release-title a, a[href*="press-releases"]')
          if (!linkEl) return

          let href = linkEl.href || linkEl.getAttribute('href')
          if (!href || seen.has(href)) return

          if (href.startsWith('/')) {
            href = baseUrl + href
          }

          // Skip language selector links
          if (href.includes('/policies/') && languageCodes.some(code => href.includes(`/${code}/policies/`))) return
          if (href.includes('#') || href.includes('javascript:')) return

          const title = linkEl.textContent?.trim()
          if (!title || title.length < 20) return

          // Skip if title looks like a language name
          if (languageCodes.some(code => title.toLowerCase() === code || title.length < 5)) return

          // Get date
          let dateText = ''
          const dateEl = article.querySelector('time, .date, .press-release-date, [datetime]')
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

        // Fallback: look for press release links in main content only
        if (items.length < 5) {
          const mainContent = document.querySelector('main, #main-content, .main-content')
          if (mainContent) {
            const pressLinks = mainContent.querySelectorAll('a[href*="press-releases/"]')
            pressLinks.forEach(linkEl => {
              let href = linkEl.href
              if (!href || seen.has(href)) return

              if (href.startsWith('/')) {
                href = baseUrl + href
              }

              // Skip language variations
              const urlPath = new URL(href).pathname
              if (languageCodes.some(code => urlPath.startsWith(`/${code}/`)) && !urlPath.startsWith('/en/')) return

              const title = linkEl.textContent?.trim()
              if (!title || title.length < 25) return
              if (title.toLowerCase().includes('read more') || title.toLowerCase().includes('learn more')) return

              seen.add(href)
              items.push({
                title: title.replace(/\s+/g, ' ').trim(),
                url: href,
                date: ''
              })
            })
          }
        }

        return items
      }, EU_COUNCIL_CONFIG.baseUrl)

      console.log(`📰 EU_COUNCIL: Extracted ${extractedItems.length} items`)

      for (const item of extractedItems.slice(0, EU_COUNCIL_CONFIG.maxItems)) {
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
          authority: 'EU_COUNCIL',
          area: 'Sanctions',
          source_category: 'international_scraping',
          source_description: 'EU Council Sanctions Updates',
          fetched_date: new Date().toISOString(),
          published_date: publishedDate,
          raw_data: {
            sourceType: 'puppeteer',
            sourceKey: 'EU_COUNCIL',
            country: 'EU',
            region: 'Europe',
            priority: 'MEDIUM',
            summary: item.title,
            sectors: ['Sanctions', 'AML & Financial Crime', 'Compliance'],
            international: {
              isInternational: true,
              sourceAuthority: 'Council of the European Union',
              sourceCountry: 'EU'
            }
          }
        })
      }

      await page.close()

      console.log(`🎉 EU_COUNCIL: Total items collected: ${results.length}`)

      return results
    } catch (error) {
      console.error('❌ EU_COUNCIL scraping failed:', error.message)
      return results
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }
}

module.exports = applyEUCouncilMethods
