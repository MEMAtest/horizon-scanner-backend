/**
 * National Crime Agency (NCA) News Scraper
 */

const NCA_CONFIG = {
  newsUrl: 'https://www.nationalcrimeagency.gov.uk/news',
  baseUrl: 'https://www.nationalcrimeagency.gov.uk',
  timeout: 60000,
  waitTime: 3000,
  maxItems: 12,
  maxAgeDays: 120
}

const extractDateText = (text) => {
  if (!text) return ''
  const matches = text.match(/\b\d{1,2}\s+[A-Za-z]+\s+\d{4}\b/g)
  if (!matches || matches.length === 0) return ''
  return matches[matches.length - 1]
}

function applyNCAMethods(ServiceClass) {
  ServiceClass.prototype.scrapeNCA = async function scrapeNCA() {
    console.log('\nNCA: Starting scrape of National Crime Agency news...')
    const results = []
    let page = null
    let detailPage = null

    try {
      const browser = await this.initBrowser()
      page = await browser.newPage()
      await page.setViewport({ width: 1920, height: 1080 })

      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      )

      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      })

      console.log(`NCA: Loading ${NCA_CONFIG.newsUrl}`)
      await page.goto(NCA_CONFIG.newsUrl, {
        waitUntil: 'domcontentloaded',
        timeout: NCA_CONFIG.timeout
      })

      await this.wait(NCA_CONFIG.waitTime)

      const extractedItems = await page.evaluate((baseUrl) => {
        const items = []
        const seen = new Set()
        const posts = document.querySelectorAll('[itemprop="blogPost"]')

        posts.forEach((post) => {
          const linkEl = post.querySelector('.page-header a[href]')
          const title = linkEl?.textContent?.trim()
          let href = linkEl?.getAttribute('href') || ''
          const summary = post.querySelector('p')?.textContent?.trim() || ''

          if (!title || !href) return
          if (href.startsWith('/')) {
            href = baseUrl + href
          }
          if (seen.has(href)) return
          seen.add(href)

          items.push({
            title,
            url: href,
            summary
          })
        })

        return items
      }, NCA_CONFIG.baseUrl)

      if (!extractedItems.length) {
        console.log('NCA: No items found on listing page')
        return results
      }

      detailPage = await browser.newPage()
      await detailPage.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      )

      const cutoff = new Date(Date.now() - NCA_CONFIG.maxAgeDays * 24 * 60 * 60 * 1000)

      for (const item of extractedItems.slice(0, NCA_CONFIG.maxItems)) {
        let publishedDate = null
        let dateText = ''

        try {
          await detailPage.goto(item.url, {
            waitUntil: 'domcontentloaded',
            timeout: NCA_CONFIG.timeout
          })

          dateText = await detailPage.evaluate(() => {
            const metaTags = Array.from(document.querySelectorAll('meta'))
            const metaDate = metaTags.find(tag => {
              const prop = tag.getAttribute('property')
              const name = tag.getAttribute('name')
              return prop === 'article:published_time' || name === 'dcterms.date' || name === 'date'
            })?.getAttribute('content')

            if (metaDate) return metaDate

            const timeEl = document.querySelector('time')
            if (timeEl) {
              return timeEl.getAttribute('datetime') || timeEl.textContent.trim()
            }

            return document.body.innerText || ''
          })

          const candidateDate = extractDateText(dateText)
          const parsed = new Date(candidateDate || dateText)
          if (!isNaN(parsed.getTime())) {
            publishedDate = parsed
          }
        } catch (detailError) {
          console.warn(`NCA: Failed to extract date for ${item.url}:`, detailError.message)
        }

        if (publishedDate && publishedDate < cutoff) {
          continue
        }

        results.push({
          headline: item.title,
          url: item.url,
          authority: 'NCA',
          area: 'News',
          source_category: 'regulatory_news',
          source_description: 'National Crime Agency - News',
          publishedDate: publishedDate || new Date(),
          summary: item.summary || `NCA: ${item.title}`,
          fetched_date: new Date().toISOString(),
          raw_data: {
            sourceType: 'puppeteer',
            sourceKey: 'NCA',
            country: 'UK',
            priority: 'MEDIUM',
            originalDate: publishedDate ? publishedDate.toISOString() : null,
            sectors: ['AML & Financial Crime', 'Law Enforcement', 'Compliance']
          }
        })
      }

      console.log(`NCA: Total items collected: ${results.length}`)
      return results
    } catch (error) {
      console.error('NCA scraping failed:', error.message)
      return results
    } finally {
      if (page) {
        try {
          await page.close()
        } catch (closeError) {
          // ignore close errors
        }
      }
      if (detailPage) {
        try {
          await detailPage.close()
        } catch (closeError) {
          // ignore close errors
        }
      }
    }
  }
}

module.exports = applyNCAMethods
