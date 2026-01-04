/**
 * FCA Dear CEO Letters Scraper
 *
 * Scrapes FCA Dear CEO letters - critical supervisory communications
 * sent directly to firm leadership on priority regulatory concerns.
 *
 * These letters are high-priority items requiring board attention.
 */

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

puppeteer.use(StealthPlugin())

const FCA_DEAR_CEO_CONFIG = {
  baseUrl: 'https://www.fca.org.uk',
  searchUrl: 'https://www.fca.org.uk/publications/search-results?category=dear-ceo-letters&sort_by=dmetaZ',
  timeout: 45000,
  waitTime: 3000,
  maxPages: 50, // Expanded: was 10, now 50 pages
  maxItems: 500, // Expanded: was 100, now 500
  maxAgeDays: 1825 // 5 years of history
}

function applyFCADearCeoMethods(ServiceClass) {
  ServiceClass.prototype.scrapeFCADearCeo = async function scrapeFCADearCeo() {
    console.log('\n' + '='.repeat(60))
    console.log('FCA DEAR CEO: Starting scrape of Dear CEO letters...')
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

      // Capture browser console logs
      page.on('console', msg => console.log(`[Browser] ${msg.text()}`))

      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      )

      // Block unnecessary resources for speed
      await page.setRequestInterception(true)
      page.on('request', (req) => {
        const resourceType = req.resourceType()
        if (['image', 'font', 'media', 'stylesheet'].includes(resourceType)) {
          req.abort()
        } else {
          req.continue()
        }
      })

      let pageNum = 0
      let hasMorePages = true
      const itemsPerPage = 10 // FCA shows 10 items per page

      while (hasMorePages && pageNum < FCA_DEAR_CEO_CONFIG.maxPages) {
        // FCA uses 'start' parameter: start=1 for page 1, start=11 for page 2, etc.
        const startItem = pageNum === 0 ? 1 : (pageNum * itemsPerPage) + 1
        const pageUrl = `${FCA_DEAR_CEO_CONFIG.searchUrl}&start=${startItem}`
        console.log(`\n📄 FCA DEAR CEO: Scraping page ${pageNum + 1} (start=${startItem})...`)

        const pageItems = await this._scrapeFCADearCeoPage(page, pageUrl)

        if (pageItems.length === 0) {
          hasMorePages = false
          console.log('   No more items found, stopping pagination')
        } else {
          results.push(...pageItems)
          console.log(`   ✅ Found ${pageItems.length} letters on page ${pageNum + 1}`)
          pageNum++

          // Rate limiting between pages
          if (hasMorePages && pageNum < FCA_DEAR_CEO_CONFIG.maxPages) {
            await this.wait(2000)
          }
        }

        // Stop if we have enough items
        if (results.length >= FCA_DEAR_CEO_CONFIG.maxItems) {
          console.log(`   Reached max items limit (${FCA_DEAR_CEO_CONFIG.maxItems})`)
          break
        }
      }

      await page.close()

      // Deduplicate by URL
      const uniqueResults = this._deduplicateByUrl(results)

      console.log('\n' + '='.repeat(60))
      console.log(`🎉 FCA DEAR CEO: Total unique letters collected: ${uniqueResults.length}`)
      console.log('='.repeat(60) + '\n')

      return uniqueResults
    } catch (error) {
      console.error('❌ FCA Dear CEO scraping failed:', error.message)
      return results
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }

  ServiceClass.prototype._scrapeFCADearCeoPage = async function _scrapeFCADearCeoPage(page, url) {
    const items = []

    try {
      console.log(`   🌐 Loading: ${url}`)

      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: FCA_DEAR_CEO_CONFIG.timeout
      })

      await this.wait(FCA_DEAR_CEO_CONFIG.waitTime)

      // Extract Dear CEO letters from search results
      const extractedItems = await page.evaluate((baseUrl) => {
        const items = []
        const seen = new Set()

        // FCA search results structure - ordered by specificity
        const selectors = [
          'li.search-item',     // FCA's actual structure: <li class="search-item">
          '.search-item',
          '.search-list > li',  // Fallback: items in search-list
          '.search-result-item',
          'li.search-result-item',
          '.views-row',
          'article'
        ]

        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector)

          if (elements.length === 0) continue

          console.log(`[FCA Dear CEO] Found ${elements.length} elements with selector: ${selector}`)

          elements.forEach(el => {
            // Get title and link
            const linkEl = el.querySelector('h3 a, .search-item__clickthrough, a.title, a[href*="dear-ceo"], a[href*="correspondence"]')
            if (!linkEl) return

            let href = linkEl.href || linkEl.getAttribute('href')
            if (!href) return

            // Make absolute URL
            if (href.startsWith('/')) {
              href = baseUrl + href
            }

            if (seen.has(href)) return
            seen.add(href)

            const title = linkEl.textContent?.trim()
            if (!title || title.length < 10) return

            // Get publication date - FCA uses "Published: DD/MM/YYYY" text pattern
            let publishedDate = null

            // Method 1: Direct selector for date element (most reliable)
            const dateEl = el.querySelector('.published-date, .meta-item.published-date, [class*="published-date"]')
            if (dateEl) {
              const dateText = dateEl.textContent || ''
              console.log(`[Date Debug] Found date element with text: "${dateText}"`)
              const directMatch = dateText.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
              if (directMatch) {
                const [, day, month, year] = directMatch
                publishedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
                console.log(`[Date Debug] Extracted date: ${publishedDate}`)
              }
            } else {
              console.log(`[Date Debug] No date element found for: ${title?.substring(0, 50)}...`)
            }

            // Method 2: Search the entire element text content for "Published: DD/MM/YYYY"
            if (!publishedDate) {
              const fullText = el.textContent || ''
              const publishedMatch = fullText.match(/Published[:\s]+(\d{1,2})\/(\d{1,2})\/(\d{4})/i)
              if (publishedMatch) {
                const [, day, month, year] = publishedMatch
                publishedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
              }
            }

            // Method 3: Fallback - look for any DD/MM/YYYY pattern
            if (!publishedDate) {
              const fullText = el.textContent || ''
              const dateMatch = fullText.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
              if (dateMatch) {
                const [, day, month, year] = dateMatch
                publishedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
              }
            }

            // Try "10 December 2024" format (sometimes in headlines/descriptions)
            if (!publishedDate) {
              const months = {
                january: '01', february: '02', march: '03', april: '04',
                may: '05', june: '06', july: '07', august: '08',
                september: '09', october: '10', november: '11', december: '12'
              }
              const longDateMatch = fullText.match(/(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i)
              if (longDateMatch) {
                const [, day, month, year] = longDateMatch
                publishedDate = `${year}-${months[month.toLowerCase()]}-${day.padStart(2, '0')}`
              }
            }

            // Try extracting from URL (e.g., /2024/12/dear-ceo-letter)
            if (!publishedDate && href) {
              const urlDateMatch = href.match(/\/(\d{4})\/(\d{1,2})\//)
              if (urlDateMatch) {
                const [, year, month] = urlDateMatch
                publishedDate = `${year}-${month.padStart(2, '0')}-01`
              }
            }

            // Get description/summary
            const descEl = el.querySelector('.search-item__body, p, .summary, .excerpt, .description')
            const description = descEl?.textContent?.trim() || ''

            // Get publication type indicator
            const typeEl = el.querySelector('.publication-type, .content-type, .category')
            const pubType = typeEl?.textContent?.trim() || 'Dear CEO letter'

            items.push({
              title: title.replace(/\s+/g, ' ').trim(),
              url: href,
              publishedDate,
              description: description.substring(0, 500),
              publicationType: pubType
            })
          })

          if (items.length > 0) break
        }

        return items
      }, FCA_DEAR_CEO_CONFIG.baseUrl)

      // Process and normalize items
      for (const item of extractedItems) {
        // Determine applicable sectors from title/description
        const sectors = this._extractSectorsFromDearCeo(item.title, item.description)

        // Determine if it's a PDF or webpage
        const isPdf = item.url.toLowerCase().endsWith('.pdf')

        items.push({
          headline: item.title,
          url: item.url,
          authority: 'FCA',
          area: 'Dear CEO Letter',
          content_type: 'DEAR_CEO_LETTER',
          source_category: 'supervisory_communication',
          source_description: 'FCA Dear CEO Letter - Direct supervisory communication to firm leadership',
          fetched_date: new Date().toISOString(),
          published_date: item.publishedDate ? new Date(item.publishedDate).toISOString() : null,
          summary: item.description || item.title,
          raw_data: {
            sourceType: 'puppeteer',
            sourceKey: 'FCA_DEAR_CEO',
            country: 'UK',
            region: 'Europe',
            priority: 'CRITICAL', // Dear CEO letters are always high priority
            isPdf,
            publicationType: item.publicationType,
            sectors,
            documentType: 'dear_ceo_letter',
            requiresBoardAttention: true,
            supervisoryCommunication: {
              type: 'Dear CEO Letter',
              regulator: 'FCA',
              targetAudience: 'CEO/Board',
              actionRequired: true
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

  ServiceClass.prototype._extractSectorsFromDearCeo = function _extractSectorsFromDearCeo(title, description) {
    const text = `${title} ${description}`.toLowerCase()
    const sectors = []

    const sectorPatterns = {
      'Motor Finance': /motor\s*finance|car\s*finance|vehicle\s*finance/i,
      'Consumer Credit': /consumer\s*credit|lending|loans|credit\s*broking/i,
      'Banking': /bank|banking|deposit|current\s*account|savings/i,
      'Investment Management': /investment|asset\s*management|fund|portfolio/i,
      'Insurance': /insurance|insurer|underwriting|claims/i,
      'Payments': /payment|app\s*fraud|psp|e-money|emoney/i,
      'Wealth Management': /wealth|private\s*client|high\s*net\s*worth/i,
      'Mortgage': /mortgage|home\s*loan|residential\s*lending/i,
      'Claims Management': /cmc|claims\s*management/i,
      'Consumer Duty': /consumer\s*duty|tcf|treating\s*customers\s*fairly/i,
      'Financial Crime': /aml|financial\s*crime|fraud|sanctions|money\s*laundering/i,
      'Operational Resilience': /operational\s*resilience|business\s*continuity|outsourcing/i,
      'Crypto Assets': /crypto|digital\s*asset|bitcoin|stablecoin/i,
      'Retail Banking': /retail\s*bank|high\s*street|branch/i,
      'Life Insurance': /life\s*insurance|pension|annuit/i
    }

    for (const [sector, pattern] of Object.entries(sectorPatterns)) {
      if (pattern.test(text)) {
        sectors.push(sector)
      }
    }

    // Default if no sectors matched
    if (sectors.length === 0) {
      sectors.push('Multi-sector')
    }

    return sectors
  }

  // Utility method for deduplication (if not already defined)
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

module.exports = applyFCADearCeoMethods
