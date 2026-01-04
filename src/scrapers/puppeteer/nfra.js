/**
 * NFRA China Scraper
 *
 * Scrapes the National Financial Regulatory Administration website for news.
 * NFRA is China's banking and insurance regulator (formerly CBIRC).
 * Note: Uses iframe-based loading - scraper navigates to iframe source directly.
 */

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

puppeteer.use(StealthPlugin())

const NFRA_CONFIG = {
  // Direct iframe source URL for news list
  newsUrl: 'https://www.nfra.gov.cn/en/view/pages/ItemListRightList.html',
  // Alternative: main page that loads iframe
  mainPageUrl: 'https://www.nfra.gov.cn/en/view/pages/ItemList.html?itemPId=973&itemId=980&itemUrl=ItemListRightList.html',
  baseUrl: 'https://www.nfra.gov.cn',
  timeout: 60000,
  waitTime: 5000,
  maxItems: 20,
  maxAgeDays: 90
}

function applyNFRAMethods(ServiceClass) {
  ServiceClass.prototype.scrapeNFRA = async function scrapeNFRA() {
    console.log('\n' + '='.repeat(60))
    console.log('NFRA: Starting scrape of National Financial Regulatory Administration (China)...')
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

      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      })

      await page.setRequestInterception(true)
      page.on('request', (req) => {
        const resourceType = req.resourceType()
        if (['image', 'font', 'media'].includes(resourceType)) {
          req.abort()
        } else {
          req.continue()
        }
      })

      console.log('\n📰 NFRA: Navigating to main news page...')

      // First try the main page which loads iframe
      await page.goto(NFRA_CONFIG.mainPageUrl, {
        waitUntil: 'networkidle2',
        timeout: NFRA_CONFIG.timeout
      })

      await this.wait(NFRA_CONFIG.waitTime)

      // Try to get content from iframe if present
      let extractedItems = []

      // First check if iframe loaded
      const frames = page.frames()
      for (const frame of frames) {
        if (frame.url().includes('ItemListRightList') || frame !== page.mainFrame()) {
          console.log('📰 NFRA: Found iframe, extracting content...')
          try {
            extractedItems = await frame.evaluate((baseUrl) => {
              const items = []
              const seen = new Set()

              const links = document.querySelectorAll('a[href]')
              links.forEach(linkEl => {
                let href = linkEl.href || linkEl.getAttribute('href')
                if (!href || seen.has(href)) return

                if (href.startsWith('/')) {
                  href = baseUrl + href
                }

                if (href.includes('#') || href.includes('javascript:')) return

                const title = linkEl.textContent?.trim()
                if (!title || title.length < 10) return

                // Look for date in parent or sibling elements
                const parent = linkEl.parentElement
                const dateEl = parent?.querySelector('.date, [class*="date"], time, span')
                const dateText = dateEl?.textContent?.trim() || ''

                seen.add(href)
                items.push({
                  title: title.replace(/\s+/g, ' ').trim(),
                  url: href,
                  date: dateText
                })
              })

              return items
            }, NFRA_CONFIG.baseUrl)

            if (extractedItems.length > 0) break
          } catch (frameError) {
            console.log('NFRA: Frame extraction failed, trying main page')
          }
        }
      }

      // Fallback: try direct iframe URL
      if (extractedItems.length === 0) {
        console.log('📰 NFRA: Trying direct iframe URL...')
        await page.goto(NFRA_CONFIG.newsUrl, {
          waitUntil: 'networkidle2',
          timeout: 30000
        })
        await this.wait(3000)

        extractedItems = await page.evaluate((baseUrl) => {
          const items = []
          const seen = new Set()

          // Try common news list selectors
          const containerSelectors = [
            '.list-item', '.news-item', 'li', 'article', 'tr',
            '[class*="item"]', '[class*="news"]', 'a[href*="view"]'
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

              if (href.includes('#') || href.includes('javascript:')) return

              const title = el.querySelector('a, .title, h3, h4')?.textContent?.trim() ||
                           linkEl.textContent?.trim()

              if (!title || title.length < 10) return

              // Get date
              const dateEl = el.querySelector('.date, time, [class*="date"], span')
              const dateText = dateEl?.textContent?.trim() || ''

              seen.add(href)
              items.push({
                title: title.replace(/\s+/g, ' ').trim(),
                url: href,
                date: dateText
              })
            })
          }

          return items
        }, NFRA_CONFIG.baseUrl)
      }

      console.log(`📰 NFRA: Extracted ${extractedItems.length} items`)

      for (const item of extractedItems.slice(0, NFRA_CONFIG.maxItems)) {
        results.push({
          headline: item.title,
          url: item.url,
          authority: 'NFRA',
          area: 'News',
          source_category: 'international_scraping',
          source_description: 'National Financial Regulatory Administration News (China)',
          fetched_date: new Date().toISOString(),
          published_date: item.date ? new Date(item.date).toISOString() : null,
          raw_data: {
            sourceType: 'puppeteer',
            sourceKey: 'NFRA',
            country: 'China',
            region: 'Asia-Pacific',
            priority: 'HIGH',
            summary: item.title,
            sectors: ['Banking', 'Insurance', 'Prudential Regulation'],
            international: {
              isInternational: true,
              sourceAuthority: 'National Financial Regulatory Administration',
              sourceCountry: 'China'
            }
          }
        })
      }

      await page.close()

      console.log(`🎉 NFRA: Total items collected: ${results.length}`)

      return results
    } catch (error) {
      console.error('❌ NFRA scraping failed:', error.message)
      return results
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }
}

module.exports = applyNFRAMethods
