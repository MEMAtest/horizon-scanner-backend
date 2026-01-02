/**
 * Egmont Group Scraper
 *
 * Scrapes the Egmont Group website for FIU-related news and publications.
 * The Egmont Group is an informal network of 170+ Financial Intelligence Units (FIUs)
 * focused on international cooperation in combating money laundering and terrorist financing.
 */

const axios = require('axios')
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

puppeteer.use(StealthPlugin())

const EGMONT_CONFIG = {
  newsUrl: 'https://egmontgroup.org/news-and-events/',
  publicationsUrl: 'https://egmontgroup.org/egmont-documents/',
  newsApiUrl: 'https://egmontgroup.org/wp-json/wp/v2/news?per_page=20',
  resourcesApiUrl: 'https://egmontgroup.org/wp-json/wp/v2/egmont-resources?per_page=20',
  baseUrl: 'https://egmontgroup.org',
  timeout: 45000,
  apiTimeout: 20000,
  waitTime: 5000,
  maxItems: 20,
  maxAgeDays: 180
}

function stripHtml(value) {
  return (value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function applyEgmontMethods(ServiceClass) {
  ServiceClass.prototype.scrapeEgmont = async function scrapeEgmont() {
    console.log('\n' + '='.repeat(60))
    console.log('EGMONT: Starting scrape of Egmont Group website...')
    console.log('='.repeat(60))

    const results = []
    let browser = null

    try {
      console.log('\n🛰️ EGMONT: Fetching WordPress API feeds...')
      const apiItems = await this._fetchEgmontApiItems()
      if (apiItems.length > 0) {
        results.push(...apiItems)
        const uniqueResults = this._deduplicateByUrl(results)
        console.log(`✅ Egmont API: ${uniqueResults.length} items captured`)
        return uniqueResults
      }

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

      // Scrape news page
      console.log('\n📰 EGMONT: Scraping news page...')
      const newsItems = await this._scrapeEgmontPage(page, EGMONT_CONFIG.newsUrl, 'News')
      results.push(...newsItems)
      console.log(`✅ Egmont News: ${newsItems.length} items captured`)

      await this.wait(2000)

      // Scrape publications
      console.log('\n📚 EGMONT: Scraping publications...')
      const pubItems = await this._scrapeEgmontPage(page, EGMONT_CONFIG.publicationsUrl, 'Publications')
      results.push(...pubItems)
      console.log(`✅ Egmont Publications: ${pubItems.length} items captured`)

      await page.close()

      const uniqueResults = this._deduplicateByUrl(results)

      console.log('\n' + '='.repeat(60))
      console.log(`🎉 EGMONT: Total unique items collected: ${uniqueResults.length}`)
      console.log('='.repeat(60) + '\n')

      return uniqueResults
    } catch (error) {
      console.error('❌ Egmont scraping failed:', error.message)
      return results
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }

  ServiceClass.prototype._fetchEgmontApiItems = async function _fetchEgmontApiItems() {
    const results = []

    try {
      const apiRequests = [
        { url: EGMONT_CONFIG.newsApiUrl, type: 'News' },
        { url: EGMONT_CONFIG.resourcesApiUrl, type: 'Resources' }
      ]

      for (const request of apiRequests) {
        const response = await axios.get(request.url, {
          timeout: EGMONT_CONFIG.apiTimeout,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'application/json'
          }
        })

        const items = Array.isArray(response.data) ? response.data : []
        for (const item of items.slice(0, EGMONT_CONFIG.maxItems)) {
          const title = stripHtml(item.title?.rendered)
          const description = stripHtml(item.excerpt?.rendered || item.content?.rendered)
          const url = item.link
          const published = item.date || item.modified

          if (!title || !url) continue

          const parsedDate = published ? new Date(published) : null
          const publishedDate = parsedDate && !isNaN(parsedDate.getTime())
            ? parsedDate.toISOString()
            : null

          results.push({
            headline: title,
            url,
            authority: 'EGMONT',
            area: request.type,
            source_category: 'international_scraping',
            source_description: `Egmont Group ${request.type}`,
            fetched_date: new Date().toISOString(),
            published_date: publishedDate,
            raw_data: {
              sourceType: 'api',
              sourceKey: 'EGMONT',
              country: 'International',
              region: 'International',
              priority: 'HIGH',
              summary: description || title,
              sectors: ['AML & Financial Crime', 'Financial Intelligence', 'CTF'],
              international: {
                isInternational: true,
                sourceAuthority: 'Egmont Group',
                sourceCountry: 'International'
              }
            }
          })
        }
      }
    } catch (error) {
      console.warn('⚠️ Egmont API fetch failed:', error.message)
    }

    return results
  }

  ServiceClass.prototype._scrapeEgmontPage = async function _scrapeEgmontPage(page, url, type) {
    const items = []

    try {
      console.log(`   🌐 Loading: ${url}`)

      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: EGMONT_CONFIG.timeout
      })

      await this.wait(EGMONT_CONFIG.waitTime)

      // Scroll to load content
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2)
      })
      await this.wait(1500)
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight)
      })
      await this.wait(2000)

      const extractedItems = await page.evaluate((baseUrl) => {
        const items = []
        const seen = new Set()

        // WordPress-style selectors (Egmont appears to use WordPress)
        const selectors = [
          'article.post', '.entry', '.news-item', '.post-item',
          '.wp-block-post', '.type-post', '.hentry',
          '.document-item', '.publication-item',
          'article', '.card', '.list-item'
        ]

        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector)

          elements.forEach(el => {
            const linkEl = el.querySelector('a.entry-title, a[rel="bookmark"], h2 a, h3 a, .title a, a[href]')
            if (!linkEl) return

            let href = linkEl.href
            if (!href || seen.has(href)) return

            if (href.startsWith('/')) {
              href = baseUrl + href
            }

            if (href.includes('#') || href.includes('javascript:') ||
                href.includes('mailto:')) return

            const title = el.querySelector('h1, h2, h3, .entry-title, .title')?.textContent?.trim() ||
                         linkEl.textContent?.trim()

            if (!title || title.length < 10) return

            // Get date
            const dateEl = el.querySelector('time, .date, .entry-date, .posted-on, [datetime]')
            const dateText = dateEl?.getAttribute('datetime') || dateEl?.textContent?.trim() || ''

            // Get excerpt/description
            const descEl = el.querySelector('.excerpt, .entry-content, .summary, p')
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
      }, EGMONT_CONFIG.baseUrl)

      for (const item of extractedItems.slice(0, EGMONT_CONFIG.maxItems)) {
        items.push({
          headline: item.title,
          url: item.url,
          authority: 'EGMONT',
          area: type,
          source_category: 'international_scraping',
          source_description: `Egmont Group ${type}`,
          fetched_date: new Date().toISOString(),
          published_date: item.date ? new Date(item.date).toISOString() : null,
          raw_data: {
            sourceType: 'puppeteer',
            sourceKey: 'EGMONT',
            country: 'International',
            region: 'International',
            priority: 'HIGH',
            summary: item.description || item.title,
            sectors: ['AML & Financial Crime', 'Financial Intelligence', 'CTF'],
            international: {
              isInternational: true,
              sourceAuthority: 'Egmont Group',
              sourceCountry: 'International'
            }
          }
        })
      }

      return items
    } catch (error) {
      console.error(`   ❌ Failed to scrape ${url}:`, error.message)
      return items
    }
  }
}

module.exports = applyEgmontMethods
