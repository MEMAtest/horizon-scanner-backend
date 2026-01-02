/**
 * EIOPA Scraper
 *
 * Scrapes the European Insurance and Occupational Pensions Authority news page.
 */

const EIOPA_CONFIG = {
  newsUrl: 'https://www.eiopa.europa.eu/media/news_en',
  baseUrl: 'https://www.eiopa.europa.eu',
  timeout: 60000,
  waitTime: 4000,
  maxItems: 20,
  maxAgeDays: 120
}

function applyEiopaMethods(ServiceClass) {
  ServiceClass.prototype.scrapeEIOPA = async function scrapeEIOPA() {
    console.log('\nEIOPA: Starting scrape of EIOPA news...')
    const results = []
    let page = null

    try {
      const browser = await this.initBrowser()
      page = await browser.newPage()
      await page.setViewport({ width: 1920, height: 1080 })

      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      )

      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      })

      console.log(`EIOPA: Loading ${EIOPA_CONFIG.newsUrl}`)
      await page.goto(EIOPA_CONFIG.newsUrl, {
        waitUntil: 'domcontentloaded',
        timeout: EIOPA_CONFIG.timeout
      })

      await this.wait(EIOPA_CONFIG.waitTime)
      await this.autoScroll(page)
      await this.wait(1500)

      const extractedItems = await page.evaluate((baseUrl) => {
        const items = []
        const seen = new Set()

        const articles = Array.from(document.querySelectorAll('article'))
        const titleSelectors = [
          '.ecl-content-item__title a',
          '.ecl-content-item__title',
          'h2 a',
          'h2',
          'h3 a',
          'h3'
        ]
        const dateSelectors = [
          '.ecl-content-item__date',
          'time',
          '[datetime]',
          '[class*="date"]'
        ]
        const descriptionSelectors = [
          '.ecl-content-item__description',
          '.ecl-content-item__text',
          'p'
        ]

        const getText = (el, selectors) => {
          for (const selector of selectors) {
            const match = el.querySelector(selector)
            const text = match?.textContent?.trim()
            if (text) return text
          }
          return ''
        }

        for (const article of articles) {
          const linkEl = article.querySelector('a[href]')
          if (!linkEl) continue

          let href = linkEl.getAttribute('href') || linkEl.href
          if (!href) continue

          if (href.startsWith('/')) {
            href = baseUrl + href
          }

          if (href.includes('rss') || href.includes('#') || href.includes('javascript:') || href.includes('mailto:')) continue
          if (seen.has(href)) continue

          const title = getText(article, titleSelectors) || linkEl.textContent?.trim()
          if (!title || title.length < 8 || title.toLowerCase() === 'filter by') continue

          const dateEl = article.querySelector(dateSelectors.join(', '))
          const dateText = dateEl?.getAttribute('datetime') || dateEl?.textContent?.trim() || ''
          const description = getText(article, descriptionSelectors)

          seen.add(href)
          items.push({
            title: title.replace(/\s+/g, ' ').trim(),
            url: href,
            date: dateText,
            description: description.substring(0, 300)
          })
        }

        return items
      }, EIOPA_CONFIG.baseUrl)

      const cutoff = new Date(Date.now() - EIOPA_CONFIG.maxAgeDays * 24 * 60 * 60 * 1000)

      for (const item of extractedItems.slice(0, EIOPA_CONFIG.maxItems)) {
        const parsedDate = item.date ? new Date(item.date) : null
        const isValidDate = parsedDate && !isNaN(parsedDate.getTime())
        const publishedDate = isValidDate ? parsedDate.toISOString() : null

        if (isValidDate && parsedDate < cutoff) continue

        results.push({
          headline: item.title,
          url: item.url,
          authority: 'EIOPA',
          area: 'News',
          source_category: 'international_scraping',
          source_description: 'EIOPA News',
          fetched_date: new Date().toISOString(),
          published_date: publishedDate,
          raw_data: {
            sourceType: 'puppeteer',
            sourceKey: 'EIOPA',
            country: 'EU',
            region: 'Europe',
            priority: 'MEDIUM',
            summary: item.description || item.title,
            sectors: ['Insurance', 'Pension Funds', 'Consumer Protection'],
            international: {
              isInternational: true,
              sourceAuthority: 'EIOPA',
              sourceCountry: 'EU'
            }
          }
        })
      }

      console.log(`EIOPA: Total items collected: ${results.length}`)
      return results
    } catch (error) {
      console.error('EIOPA scraping failed:', error.message)
      return results
    } finally {
      if (page) {
        try {
          await page.close()
        } catch (closeError) {
          // ignore close errors
        }
      }
    }
  }
}

module.exports = applyEiopaMethods
