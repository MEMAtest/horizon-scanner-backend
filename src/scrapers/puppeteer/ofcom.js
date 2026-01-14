/**
 * Ofcom UK Scraper
 *
 * Scrapes the Office of Communications website for news and updates.
 * Ofcom is the UK's communications regulator.
 */

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

puppeteer.use(StealthPlugin())

const OFCOM_CONFIG = {
  newsUrl: 'https://www.ofcom.org.uk/news-and-updates',
  baseUrl: 'https://www.ofcom.org.uk',
  timeout: 60000,
  waitTime: 5000,
  maxItems: 20,
  maxAgeDays: 90
}

function applyOfcomMethods(ServiceClass) {
  ServiceClass.prototype.scrapeOfcom = async function scrapeOfcom() {
    console.log('\n' + '='.repeat(60))
    console.log('OFCOM: Starting scrape of Office of Communications...')
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

      console.log('\n📰 OFCOM: Navigating to news page...')

      await page.goto(OFCOM_CONFIG.newsUrl, {
        waitUntil: 'networkidle2',
        timeout: OFCOM_CONFIG.timeout
      })

      await this.wait(OFCOM_CONFIG.waitTime)

      const extractedItems = await page.evaluate((baseUrl) => {
        const items = []
        const seen = new Set()

        // Ofcom uses article containers or list items with h3 titles
        // Try multiple container selectors
        const newsContainers = document.querySelectorAll('article, .news-item, .card, .content-item, .listing-item, li')

        newsContainers.forEach(container => {
          // Get title from h3 > a or direct a link
          const linkEl = container.querySelector('h3 a, h2 a, a[href*="/news/"], a[href*="/publications/"]')
          if (!linkEl) return

          let href = linkEl.href || linkEl.getAttribute('href')
          if (!href || seen.has(href)) return

          if (href.startsWith('/')) {
            href = baseUrl + href
          }

          if (href.includes('#') || href.includes('javascript:')) return
          // Skip non-news links
          if (href.includes('/research') || href.includes('/advice') || href.includes('/consultations')) return

          const title = linkEl.textContent?.trim()
          if (!title || title.length < 15) return

          // Skip generic text
          if (title.toLowerCase().includes('read more') ||
              title.toLowerCase().includes('view all') ||
              title.toLowerCase().includes('show more')) return

          // Get date from p tag containing "Published:" or time element
          let dateText = ''
          const allParas = container.querySelectorAll('p')
          allParas.forEach(p => {
            const text = p.textContent || ''
            if (text.includes('Published:') || text.match(/\d{1,2}\s+\w+\s+\d{4}/)) {
              const match = text.match(/(\d{1,2}\s+\w+\s+\d{4})/)
              if (match) {
                dateText = match[1]
              }
            }
          })
          // Also try time element
          if (!dateText) {
            const timeEl = container.querySelector('time')
            if (timeEl) {
              dateText = timeEl.getAttribute('datetime') || timeEl.textContent?.trim() || ''
            }
          }

          // Get summary from p tag (not the date one)
          let summary = ''
          allParas.forEach(p => {
            const text = p.textContent || ''
            if (!text.includes('Published:') && text.length > 50) {
              summary = text.trim().substring(0, 300)
            }
          })

          seen.add(href)
          items.push({
            title: title.replace(/\s+/g, ' ').trim(),
            url: href,
            date: dateText,
            summary
          })
        })

        // Fallback: look for any news article links
        if (items.length < 3) {
          const allLinks = document.querySelectorAll('a[href*="/news/"], a[href*="-news"]')
          allLinks.forEach(linkEl => {
            let href = linkEl.href
            if (!href || seen.has(href)) return

            // Skip index pages
            if (href.endsWith('/news/') || href.endsWith('/news-and-updates')) return

            const title = linkEl.textContent?.trim()
            if (!title || title.length < 20) return

            // Skip generic text
            if (title.toLowerCase().includes('read more') ||
                title.toLowerCase().includes('view all')) return

            seen.add(href)
            items.push({
              title: title.replace(/\s+/g, ' ').trim(),
              url: href,
              date: '',
              summary: ''
            })
          })
        }

        return items
      }, OFCOM_CONFIG.baseUrl)

      console.log(`📰 OFCOM: Extracted ${extractedItems.length} items`)

      for (const item of extractedItems.slice(0, OFCOM_CONFIG.maxItems)) {
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
          authority: 'OFCOM',
          area: 'News',
          source_category: 'regulatory_scraping',
          source_description: 'Ofcom Communications Regulator News',
          fetched_date: new Date().toISOString(),
          published_date: publishedDate,
          raw_data: {
            sourceType: 'puppeteer',
            sourceKey: 'OFCOM',
            country: 'UK',
            region: 'Europe',
            priority: 'MEDIUM',
            summary: item.summary || item.title,
            sectors: ['Telecommunications', 'Broadcasting', 'Digital'],
            international: {
              isInternational: false,
              sourceAuthority: 'Office of Communications',
              sourceCountry: 'UK'
            }
          }
        })
      }

      await page.close()

      console.log(`🎉 OFCOM: Total items collected: ${results.length}`)

      return results
    } catch (error) {
      console.error('❌ OFCOM scraping failed:', error.message)
      return results
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }
}

module.exports = applyOfcomMethods
