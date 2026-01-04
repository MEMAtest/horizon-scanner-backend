/**
 * PRA Supervisory Statements Scraper
 *
 * Scrapes PRA Supervisory Statements (SS) and Dear CEO-equivalent communications.
 * These are binding expectations for PRA-regulated firms (banks, insurers, major investment firms).
 *
 * Types captured:
 * - Supervisory Statements (SS)
 * - Policy Statements (PS)
 * - Dear CEO / Dear CRO letters
 * - Consultation Papers (CP) for awareness
 */

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

puppeteer.use(StealthPlugin())

const PRA_CONFIG = {
  baseUrl: 'https://www.bankofengland.co.uk',
  // Target the prudential regulation publications RSS feed content page
  publicationsUrl: 'https://www.bankofengland.co.uk/prudential-regulation/publication',
  // Alternative: search for supervisory statements
  searchUrls: [
    'https://www.bankofengland.co.uk/search?SearchTerms=supervisory+statement&DateFrom=&DateTo=&Taxonomies=0829ed0c-5fdc-42a1-8c6f-4fe14d92de77', // PRA content
    'https://www.bankofengland.co.uk/prudential-regulation',
    'https://www.bankofengland.co.uk/search?SearchTerms=policy+statement&DateFrom=&DateTo=&Taxonomies=0829ed0c-5fdc-42a1-8c6f-4fe14d92de77', // Policy statements
    'https://www.bankofengland.co.uk/search?SearchTerms=dear+ceo&DateFrom=&DateTo=&Taxonomies=0829ed0c-5fdc-42a1-8c6f-4fe14d92de77' // Dear CEO letters
  ],
  timeout: 60000,
  waitTime: 5000,
  maxItems: 500, // Expanded: was 100, now 500
  maxAgeDays: 3650 // Expanded: 10 years of history
}

function applyPRASupervisoryMethods(ServiceClass) {
  ServiceClass.prototype.scrapePRASupervisory = async function scrapePRASupervisory() {
    console.log('\n' + '='.repeat(60))
    console.log('PRA: Starting scrape of Supervisory Statements...')
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

      // Block unnecessary resources
      await page.setRequestInterception(true)
      page.on('request', (req) => {
        const resourceType = req.resourceType()
        if (['image', 'font', 'media'].includes(resourceType)) {
          req.abort()
        } else {
          req.continue()
        }
      })

      // Try multiple pages to find supervisory statements
      for (const url of PRA_CONFIG.searchUrls) {
        console.log(`\n📄 PRA: Trying ${url}...`)

        try {
          const pageItems = await this._scrapePRAPage(page, url)

          if (pageItems.length > 0) {
            results.push(...pageItems)
            console.log(`   ✅ Found ${pageItems.length} items`)
          }

          await this.wait(2000)
        } catch (error) {
          console.log(`   ⚠️ Failed: ${error.message}`)
        }
      }

      // Also scrape the main PRA publications page
      console.log('\n📄 PRA: Scraping main publications page...')
      try {
        const mainPageItems = await this._scrapePRAMainPage(page)
        results.push(...mainPageItems)
        console.log(`   ✅ Found ${mainPageItems.length} items from main page`)
      } catch (error) {
        console.log(`   ⚠️ Main page failed: ${error.message}`)
      }

      await page.close()

      // Deduplicate and filter for supervisory content
      const uniqueResults = this._deduplicateByUrl(results)
      const supervisoryItems = uniqueResults.filter(item =>
        this._isPRASupervisoryContent(item.headline, item.url)
      )

      console.log('\n' + '='.repeat(60))
      console.log(`🎉 PRA: Total supervisory items collected: ${supervisoryItems.length}`)
      console.log('='.repeat(60) + '\n')

      return supervisoryItems
    } catch (error) {
      console.error('❌ PRA scraping failed:', error.message)
      return results
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }

  ServiceClass.prototype._scrapePRAPage = async function _scrapePRAPage(page, url) {
    const items = []

    try {
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: PRA_CONFIG.timeout
      })

      await this.wait(PRA_CONFIG.waitTime)

      // Scroll to load content
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2)
      })
      await this.wait(2000)

      const extractedItems = await page.evaluate((baseUrl) => {
        const items = []
        const seen = new Set()

        // BoE/PRA website patterns
        const selectors = [
          '.results-list li',
          '.search-results li',
          '.publication-list-item',
          '.news-item',
          'article',
          '.card',
          '[class*="publication"]',
          '[class*="result"]'
        ]

        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector)

          elements.forEach(el => {
            const linkEl = el.querySelector('a[href]')
            if (!linkEl) return

            let href = linkEl.href || linkEl.getAttribute('href')
            if (!href || seen.has(href)) return

            if (href.startsWith('/')) {
              href = baseUrl + href
            }

            // Skip non-content links
            if (href.includes('#') || href.includes('javascript:')) return

            const title = linkEl.textContent?.trim() ||
                         el.querySelector('h2, h3, h4, .title')?.textContent?.trim()

            if (!title || title.length < 10) return

            // Get date
            const dateEl = el.querySelector('time, .date, [datetime], .published')
            let dateText = dateEl?.getAttribute('datetime') || dateEl?.textContent?.trim() || ''

            // Get description
            const descEl = el.querySelector('p, .summary, .description')
            const description = descEl?.textContent?.trim() || ''

            seen.add(href)
            items.push({
              title: title.replace(/\s+/g, ' ').trim(),
              url: href,
              dateText,
              description: description.substring(0, 500)
            })
          })
        }

        return items.slice(0, 50)
      }, PRA_CONFIG.baseUrl)

      // Process items
      for (const item of extractedItems) {
        const docType = this._classifyPRADocument(item.title, item.url)

        items.push({
          headline: item.title,
          url: item.url,
          authority: 'PRA',
          area: docType.area,
          content_type: docType.contentType,
          source_category: 'supervisory_communication',
          source_description: `PRA ${docType.area} - Prudential regulatory guidance`,
          fetched_date: new Date().toISOString(),
          published_date: item.dateText ? this._parsePRADate(item.dateText) : null,
          summary: item.description || item.title,
          raw_data: {
            sourceType: 'puppeteer',
            sourceKey: 'PRA_SUPERVISORY',
            country: 'UK',
            region: 'Europe',
            priority: docType.priority,
            documentType: docType.type,
            sectors: docType.sectors,
            requiresBoardAttention: docType.boardLevel,
            supervisoryCommunication: {
              type: docType.type,
              regulator: 'PRA',
              targetAudience: docType.audience,
              actionRequired: docType.actionRequired
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

  ServiceClass.prototype._scrapePRAMainPage = async function _scrapePRAMainPage(page) {
    const items = []

    try {
      await page.goto(PRA_CONFIG.publicationsUrl, {
        waitUntil: 'networkidle2',
        timeout: PRA_CONFIG.timeout
      })

      await this.wait(PRA_CONFIG.waitTime)

      // BoE uses dynamic loading, try scrolling and waiting
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => window.scrollBy(0, 500))
        await this.wait(1500)
      }

      const extractedItems = await page.evaluate((baseUrl) => {
        const items = []
        const seen = new Set()

        // Look for any links containing SS, PS, CP patterns
        const links = document.querySelectorAll('a[href]')

        links.forEach(link => {
          const href = link.href
          const text = link.textContent?.trim()

          if (!href || !text || text.length < 10 || seen.has(href)) return

          // Match PRA document patterns
          const isPRADoc = /\b(SS|PS|CP)\d+\/\d+\b/i.test(text) ||
                          /supervisory\s*statement/i.test(text) ||
                          /policy\s*statement/i.test(text) ||
                          /consultation\s*paper/i.test(text) ||
                          /dear\s*(ceo|cro|cfo)/i.test(text)

          if (isPRADoc) {
            seen.add(href)
            const parent = link.closest('div, li, article')
            const dateEl = parent?.querySelector('time, .date, [datetime]')
            const descEl = parent?.querySelector('p')

            items.push({
              title: text.replace(/\s+/g, ' ').trim(),
              url: href.startsWith('/') ? baseUrl + href : href,
              dateText: dateEl?.textContent?.trim() || '',
              description: descEl?.textContent?.trim()?.substring(0, 300) || ''
            })
          }
        })

        return items
      }, PRA_CONFIG.baseUrl)

      for (const item of extractedItems) {
        const docType = this._classifyPRADocument(item.title, item.url)

        items.push({
          headline: item.title,
          url: item.url,
          authority: 'PRA',
          area: docType.area,
          content_type: docType.contentType,
          source_category: 'supervisory_communication',
          source_description: `PRA ${docType.area}`,
          fetched_date: new Date().toISOString(),
          published_date: item.dateText ? this._parsePRADate(item.dateText) : null,
          summary: item.description || item.title,
          raw_data: {
            sourceType: 'puppeteer',
            sourceKey: 'PRA_SUPERVISORY',
            country: 'UK',
            region: 'Europe',
            priority: docType.priority,
            documentType: docType.type,
            sectors: docType.sectors
          }
        })
      }

      return items
    } catch (error) {
      console.error('   ❌ Failed to scrape PRA main page:', error.message)
      return items
    }
  }

  ServiceClass.prototype._classifyPRADocument = function _classifyPRADocument(title, url) {
    const text = `${title} ${url}`.toLowerCase()

    // Supervisory Statement (highest priority)
    if (/\bss\d+\/\d+\b/i.test(title) || /supervisory\s*statement/i.test(text)) {
      return {
        type: 'supervisory_statement',
        contentType: 'SUPERVISORY_STATEMENT',
        area: 'Supervisory Statement',
        priority: 'CRITICAL',
        boardLevel: true,
        actionRequired: true,
        audience: 'Board/Senior Management',
        sectors: this._extractPRASectors(text)
      }
    }

    // Policy Statement (high priority - final rules)
    if (/\bps\d+\/\d+\b/i.test(title) || /policy\s*statement/i.test(text)) {
      return {
        type: 'policy_statement',
        contentType: 'POLICY_STATEMENT',
        area: 'Policy Statement',
        priority: 'HIGH',
        boardLevel: true,
        actionRequired: true,
        audience: 'Board/Compliance',
        sectors: this._extractPRASectors(text)
      }
    }

    // Dear CEO/CRO letters
    if (/dear\s*(ceo|cro|cfo)/i.test(text)) {
      return {
        type: 'dear_ceo_letter',
        contentType: 'DEAR_CEO_LETTER',
        area: 'Dear CEO Letter',
        priority: 'CRITICAL',
        boardLevel: true,
        actionRequired: true,
        audience: 'CEO/CRO/CFO',
        sectors: this._extractPRASectors(text)
      }
    }

    // Consultation Paper (medium priority - awareness)
    if (/\bcp\d+\/\d+\b/i.test(title) || /consultation\s*paper/i.test(text)) {
      return {
        type: 'consultation_paper',
        contentType: 'CONSULTATION',
        area: 'Consultation Paper',
        priority: 'MEDIUM',
        boardLevel: false,
        actionRequired: false,
        audience: 'Compliance/Policy',
        sectors: this._extractPRASectors(text)
      }
    }

    // Default
    return {
      type: 'publication',
      contentType: 'PUBLICATION',
      area: 'Publication',
      priority: 'MEDIUM',
      boardLevel: false,
      actionRequired: false,
      audience: 'General',
      sectors: ['Banking', 'Insurance']
    }
  }

  ServiceClass.prototype._extractPRASectors = function _extractPRASectors(text) {
    const sectors = []

    const patterns = {
      'Banking': /bank|deposit|lending|credit/i,
      'Insurance': /insur|solvency|underwriting/i,
      'Investment Firms': /investment\s*firm|mifidpru|ifpr/i,
      'Capital Requirements': /capital|crd|crr|basel/i,
      'Operational Resilience': /operational\s*resilience|outsourcing|third\s*party/i,
      'Liquidity': /liquidity|lcr|nsfr/i,
      'Remuneration': /remuneration|compensation|bonus/i,
      'Climate Risk': /climate|environmental|esg/i,
      'Model Risk': /model\s*risk|irb|internal\s*model/i,
      'Recovery & Resolution': /recovery|resolution|mrel|bail-in/i
    }

    for (const [sector, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        sectors.push(sector)
      }
    }

    if (sectors.length === 0) {
      sectors.push('Banking', 'Insurance')
    }

    return sectors
  }

  ServiceClass.prototype._isPRASupervisoryContent = function _isPRASupervisoryContent(title, url) {
    const text = `${title} ${url}`.toLowerCase()

    return /\b(ss|ps|cp)\d+\/\d+\b/i.test(title) ||
           /supervisory\s*statement/i.test(text) ||
           /policy\s*statement/i.test(text) ||
           /consultation\s*paper/i.test(text) ||
           /dear\s*(ceo|cro|cfo)/i.test(text) ||
           /prudential\s*regulation/i.test(text)
  }

  ServiceClass.prototype._parsePRADate = function _parsePRADate(dateText) {
    if (!dateText) return null

    try {
      // Try various date formats
      const formats = [
        /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i,
        /(\d{4})-(\d{2})-(\d{2})/,
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/
      ]

      for (const format of formats) {
        const match = dateText.match(format)
        if (match) {
          const date = new Date(dateText)
          if (!isNaN(date.getTime())) {
            return date.toISOString()
          }
        }
      }

      return null
    } catch {
      return null
    }
  }

  // Ensure deduplication exists
  if (!ServiceClass.prototype._deduplicateByUrl) {
    ServiceClass.prototype._deduplicateByUrl = function _deduplicateByUrl(items) {
      const seen = new Set()
      return items.filter(item => {
        if (seen.has(item.url)) return false
        seen.add(item.url)
        return true
      })
    }
  }
}

module.exports = applyPRASupervisoryMethods
