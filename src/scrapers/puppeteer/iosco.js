/**
 * IOSCO Scraper
 *
 * Scrapes the IOSCO media releases page.
 */

const IOSCO_CONFIG = {
  newsUrl: 'https://www.iosco.org/',
  baseUrl: 'https://www.iosco.org',
  timeout: 60000,
  waitTime: 4000,
  maxItems: 20,
  maxAgeDays: 120
}

function applyIoscoMethods(ServiceClass) {
  ServiceClass.prototype.scrapeIOSCO = async function scrapeIOSCO() {
    console.log('\nIOSCO: Starting scrape of IOSCO news...')
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

      console.log(`IOSCO: Loading ${IOSCO_CONFIG.newsUrl}`)
      await page.goto(IOSCO_CONFIG.newsUrl, {
        waitUntil: 'domcontentloaded',
        timeout: IOSCO_CONFIG.timeout
      })

      await this.wait(IOSCO_CONFIG.waitTime)
      await this.autoScroll(page)
      await this.wait(1500)

      const extractedItems = await page.evaluate((baseUrl) => {
        const items = []
        const seen = new Set()

        const latestCards = Array.from(document.querySelectorAll('.card-body'))
          .filter(card => card.textContent?.toLowerCase().includes('latest news'))

        latestCards.forEach(card => {
          const dateEls = Array.from(card.querySelectorAll('.sub_heading'))
          const linkEls = Array.from(card.querySelectorAll('p.card-text-heading a[href]'))

          const count = Math.min(dateEls.length, linkEls.length)
          for (let i = 0; i < count; i++) {
            let href = linkEls[i].getAttribute('href') || linkEls[i].href
            if (!href) continue
            if (href.startsWith('/')) {
              href = baseUrl + href
            }

            if (seen.has(href) || !/IOSCONEWS\d+\.pdf/i.test(href)) continue

            const title = linkEls[i].textContent?.trim()
            if (!title || title.length < 8) continue

            const rawDate = dateEls[i].textContent?.trim() || ''
            const dateText = rawDate.replace(/news\s*\//i, '').trim()

            seen.add(href)
            items.push({
              title: title.replace(/\s+/g, ' ').trim(),
              url: href,
              date: dateText,
              description: ''
            })
          }
        })

        if (items.length === 0) {
          const anchors = Array.from(document.querySelectorAll('a[href]'))
            .filter(a => /IOSCONEWS\d+\.pdf/i.test(a.href))

          anchors.forEach(anchor => {
            let href = anchor.getAttribute('href') || anchor.href
            if (!href) return
            if (href.startsWith('/')) {
              href = baseUrl + href
            }

            if (seen.has(href)) return

            const title = anchor.textContent?.trim()
            if (!title || title.toLowerCase() === 'read more' || title.length < 8) return

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
      }, IOSCO_CONFIG.baseUrl)

      const cutoff = new Date(Date.now() - IOSCO_CONFIG.maxAgeDays * 24 * 60 * 60 * 1000)

      for (const item of extractedItems.slice(0, IOSCO_CONFIG.maxItems)) {
        const parsedDate = item.date ? new Date(item.date) : null
        const isValidDate = parsedDate && !isNaN(parsedDate.getTime())
        const publishedDate = isValidDate ? parsedDate.toISOString() : null

        if (isValidDate && parsedDate < cutoff) continue

        results.push({
          headline: item.title,
          url: item.url,
          authority: 'IOSCO',
          area: 'Media Releases',
          source_category: 'international_scraping',
          source_description: 'IOSCO Media Releases',
          fetched_date: new Date().toISOString(),
          published_date: publishedDate,
          raw_data: {
            sourceType: 'puppeteer',
            sourceKey: 'IOSCO',
            country: 'International',
            region: 'International',
            priority: 'MEDIUM',
            summary: item.description || item.title,
            sectors: ['Capital Markets', 'Securities Regulation', 'Investment Management'],
            international: {
              isInternational: true,
              sourceAuthority: 'IOSCO',
              sourceCountry: 'International'
            }
          }
        })
      }

      console.log(`IOSCO: Total items collected: ${results.length}`)
      return results
    } catch (error) {
      console.error('IOSCO scraping failed:', error.message)
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

module.exports = applyIoscoMethods
