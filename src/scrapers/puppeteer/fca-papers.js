/**
 * FCA Consultation & Discussion Papers Scraper
 *
 * Scrapes the FCA website for consultation papers and discussion papers.
 * Uses Puppeteer to bypass bot protection.
 */

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

puppeteer.use(StealthPlugin())

const FCA_PAPERS_CONFIG = {
  consultationUrl: 'https://www.fca.org.uk/publications/search-results?category=policy%20and%20guidance-consultation%20papers&sort_by=dmetaZ',
  discussionUrl: 'https://www.fca.org.uk/publications/search-results?category=policy%20and%20guidance-discussion%20papers&sort_by=dmetaZ',
  baseUrl: 'https://www.fca.org.uk',
  timeout: 60000,
  waitTime: 5000,
  maxItems: 20,
  maxAgeDays: 90
}

function applyFCAPapersMethods(ServiceClass) {
  ServiceClass.prototype.scrapeFCAConsultationPapers = async function scrapeFCAConsultationPapers() {
    return await this.scrapeFCAPapers('consultation')
  }

  ServiceClass.prototype.scrapeFCADiscussionPapers = async function scrapeFCADiscussionPapers() {
    return await this.scrapeFCAPapers('discussion')
  }

  ServiceClass.prototype.scrapeFCAPapers = async function scrapeFCAPapers(paperType = 'consultation') {
    const isConsultation = paperType === 'consultation'
    const url = isConsultation ? FCA_PAPERS_CONFIG.consultationUrl : FCA_PAPERS_CONFIG.discussionUrl
    const typeName = isConsultation ? 'Consultation Papers' : 'Discussion Papers'
    const authority = isConsultation ? 'FCA_CP' : 'FCA_DP'

    console.log('\n' + '='.repeat(60))
    console.log(`FCA ${typeName}: Starting scrape...`)
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

      console.log(`\n📰 FCA ${typeName}: Navigating to publications page...`)

      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: FCA_PAPERS_CONFIG.timeout
      })

      await this.wait(FCA_PAPERS_CONFIG.waitTime)

      const extractedItems = await page.evaluate((baseUrl) => {
        const items = []
        const seen = new Set()

        // FCA uses <ol> list with <li> items for publication results
        const listItems = document.querySelectorAll('ol li, .search-item, .publication-item, article')

        listItems.forEach(item => {
          // Get the title link from h3 > a
          const linkEl = item.querySelector('h3 a, h2 a, .search-item__clickthrough, a[href*="/publications/"]')
          if (!linkEl) return

          let href = linkEl.href || linkEl.getAttribute('href')
          if (!href || seen.has(href)) return

          if (href.startsWith('/')) {
            href = baseUrl + href
          }

          if (href.includes('#') || href.includes('javascript:')) return
          // Skip non-publication links
          if (!href.includes('/publications/') && !href.includes('fca.org.uk')) return

          const title = linkEl.textContent?.trim()
          if (!title || title.length < 10) return

          // Get date from div containing "Published:"
          let dateText = ''
          const allDivs = item.querySelectorAll('div')
          allDivs.forEach(div => {
            const text = div.textContent || ''
            if (text.includes('Published:')) {
              const match = text.match(/Published:\s*(\d{1,2}\s+\w+\s+\d{4}|\d{4}-\d{2}-\d{2})/)
              if (match) {
                dateText = match[1]
              }
            }
          })

          // Get summary from p tag
          let summary = ''
          const summaryEl = item.querySelector('p')
          if (summaryEl) {
            summary = summaryEl.textContent?.trim().substring(0, 300) || ''
          }

          seen.add(href)
          items.push({
            title: title.replace(/\s+/g, ' ').trim(),
            url: href,
            date: dateText,
            summary
          })
        })

        return items
      }, FCA_PAPERS_CONFIG.baseUrl)

      console.log(`📰 FCA ${typeName}: Extracted ${extractedItems.length} items`)

      for (const item of extractedItems.slice(0, FCA_PAPERS_CONFIG.maxItems)) {
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
          authority: authority,
          area: typeName,
          source_category: 'regulatory_scraping',
          source_description: `FCA ${typeName}`,
          fetched_date: new Date().toISOString(),
          published_date: publishedDate,
          raw_data: {
            sourceType: 'puppeteer',
            sourceKey: authority,
            country: 'UK',
            region: 'Europe',
            priority: isConsultation ? 'HIGH' : 'MEDIUM',
            summary: item.summary || item.title,
            sectors: ['Multi-sector', 'Banking', 'Investment Management', 'Consumer Credit'],
            international: {
              isInternational: false,
              sourceAuthority: 'Financial Conduct Authority',
              sourceCountry: 'UK'
            }
          }
        })
      }

      await page.close()

      console.log(`🎉 FCA ${typeName}: Total items collected: ${results.length}`)

      return results
    } catch (error) {
      console.error(`❌ FCA ${typeName} scraping failed:`, error.message)
      return results
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }
}

module.exports = applyFCAPapersMethods
