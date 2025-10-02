// src/services/webScraperService.js
// Complete Integrated Web Scraping Service with ALL Sources
// Includes: FCA Advanced, FATF, International, TPR, SFO, and all other sources

const axios = require('axios')
const cheerio = require('cheerio')
const puppeteer = require('puppeteer')
const Parser = require('rss-parser')
const { URL } = require('url')
const dbService = require('./dbService')
const aiAnalyzer = require('./aiAnalyzer')
const contentProcessor = require('./contentProcessor')
const dataQualityService = require('./dataQualityService')
const {
  getSourcesByPriority,
  INTERNATIONAL_SOURCES
} = require('../sources/enhancedSources')

class WebScraperService {
  constructor() {
    this.processingStats = {
      total: 0,
      processed: 0,
      skipped: 0,
      errors: 0,
      startTime: null,
      bySource: {},
      byType: {
        rss: 0,
        deepScraping: 0,
        international: 0,
        fatf: 0,
        fca: 0,
        simple: 0
      }
    }

    this.rateLimiters = new Map()
    this.retryQueues = new Map()
    this.activeRequests = new Set()

    // Configure axios defaults
    this.httpClient = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RegulatoryScanner/2.0; +https://regulatory-scanner.com)'
      },
      maxRedirects: 5
    })

    // FCA-specific configuration
    this.fcaConfig = {
      baseUrl: 'https://www.fca.org.uk',
      authority: 'FCA',
      rateLimit: 2000,
      maxRetries: 3,

      scrapingTargets: {
        consultations: {
          name: 'Consultations',
          urls: [
            'https://www.fca.org.uk/publications/search-results?np_category=policy%20and%20guidance-consultation%20papers'
          ],
          selectors: {
            container: '.search-results',
            items: '.search-result',
            title: '.search-result__title a',
            url: '.search-result__title a',
            date: '.search-result__date',
            summary: '.search-result__summary',
            deadline: '.consultation-deadline, .deadline',
            status: '.consultation-status',
            documentType: '.search-result__type'
          },
          pagination: {
            nextPage: '.pagination .pagination__next',
            maxPages: 15
          }
        },

        policyStatements: {
          name: 'Policy Statements',
          urls: [
            'https://www.fca.org.uk/publications?category%5B%5D=policy-statement'
          ],
          selectors: {
            container: '.search-results',
            items: '.search-result',
            title: '.search-result__title a',
            url: '.search-result__title a',
            date: '.search-result__date',
            summary: '.search-result__summary',
            reference: '.search-result__reference'
          },
          pagination: {
            maxPages: 5
          }
        },

        guidance: {
          name: 'Guidance',
          urls: [
            'https://www.fca.org.uk/publications?category%5B%5D=guidance',
            'https://www.fca.org.uk/publications?category%5B%5D=finalised-guidance'
          ],
          selectors: {
            container: '.search-results',
            items: '.search-result',
            title: '.search-result__title a',
            url: '.search-result__title a',
            date: '.search-result__date',
            summary: '.search-result__summary'
          },
          pagination: {
            maxPages: 5
          }
        },

        speeches: {
          name: 'Speeches',
          urls: [
            'https://www.fca.org.uk/news/search-results?np_category=speeches' // Updated URL
          ],
          selectors: {
            container: '.search-results',
            items: '.search-result',
            title: '.search-result__title a',
            url: '.search-result__title a',
            date: '.search-result__date',
            speaker: '.search-result__speaker, .speaker',
            summary: '.search-result__summary'
          },
          pagination: {
            maxPages: 3
          }
        },

        newsAndUpdates: {
          name: 'News & Updates',
          urls: [
            'https://www.fca.org.uk/news',
            'https://www.fca.org.uk/news/search-results?np_category=press%20releases' // Updated URL
          ],
          selectors: {
            container: '.search-results, .news-list',
            items: '.search-result, .news-item',
            title: '.search-result__title a, .news-item__title a',
            url: '.search-result__title a, .news-item__title a',
            date: '.search-result__date, .news-item__date',
            summary: '.search-result__summary, .news-item__summary'
          },
          pagination: {
            maxPages: 5
          }
        },

        enforcementNotices: {
          name: 'Enforcement',
          urls: [
            'https://www.fca.org.uk/publications?category%5B%5D=enforcement'
          ],
          selectors: {
            container: '.search-results',
            items: '.search-result',
            title: '.search-result__title a',
            url: '.search-result__title a',
            date: '.search-result__date',
            summary: '.search-result__summary',
            firm: '.search-result__firm, .firm-name'
          },
          pagination: {
            maxPages: 3
          }
        }
      }
    }

    this.setupAxiosInterceptors()
  }

  // AXIOS INTERCEPTORS
  setupAxiosInterceptors() {
    this.httpClient.interceptors.request.use(async (config) => {
      const domain = new URL(config.url).hostname
      await this.respectRateLimit(domain)
      this.activeRequests.add(config.url)
      return config
    })

    this.httpClient.interceptors.response.use(
      (response) => {
        this.activeRequests.delete(response.config.url)
        return response
      },
      (error) => {
        this.activeRequests.delete(error.config?.url)
        return Promise.reject(error)
      }
    )
  }

  // FCA ADVANCED SCRAPER
  async scrapeFCAAdvanced() {
    console.log('🏛️ Starting FCA advanced scraping...')
    const allResults = []

    try {
      for (const [targetKey, targetConfig] of Object.entries(this.fcaConfig.scrapingTargets)) {
        console.log(`   📋 Scraping FCA ${targetConfig.name}...`)

        try {
          const results = await this.scrapeFCATarget(targetConfig, targetKey)
          allResults.push(...results)
          console.log(`   ✅ FCA ${targetConfig.name}: ${results.length} items`)

          await this.wait(this.fcaConfig.rateLimit)
        } catch (error) {
          console.error(`   ❌ Failed to scrape FCA ${targetConfig.name}: ${error.message}`)
        }
      }

      // Process for quality
      const qualityResults = await dataQualityService.processDataQuality(allResults)
      const processedResults = await contentProcessor.processBatch(qualityResults)

      console.log(`✅ FCA advanced scraping complete: ${processedResults.length} items`)
      this.processingStats.byType.fca = processedResults.length

      return processedResults
    } catch (error) {
      console.error('❌ FCA advanced scraping failed:', error)
      return []
    }
  }

  async scrapeFCATarget(targetConfig, targetKey) {
    const results = []

    for (const baseUrl of targetConfig.urls) {
      try {
        const pageResults = await this.scrapeFCAPages(baseUrl, targetConfig, targetKey)
        results.push(...pageResults)
        await this.wait(1000)
      } catch (error) {
        console.error(`❌ Failed to process FCA URL ${baseUrl}: ${error.message}`)
      }
    }

    return results
  }

  async scrapeFCAPages(baseUrl, targetConfig, targetKey) {
    const results = []
    let currentPage = 1
    const maxPages = targetConfig.pagination?.maxPages || 5

    while (currentPage <= maxPages) {
      try {
        const pageUrl = this.buildPageUrl(baseUrl, currentPage)

        const response = await this.makeRequest(pageUrl)
        const $ = cheerio.load(response.data)

        const container = $(targetConfig.selectors.container)
        if (container.length === 0) break

        const items = $(targetConfig.selectors.items)
        if (items.length === 0) break

        for (let i = 0; i < items.length; i++) {
          try {
            const item = items.eq(i)
            const extractedData = await this.extractFCAItemData(
              item, targetConfig.selectors, targetKey, $
            )

            if (extractedData) {
              results.push(extractedData)
            }
          } catch (error) {
            console.error(`❌ Failed to extract FCA item: ${error.message}`)
          }
        }

        if (targetConfig.pagination && currentPage < maxPages) {
          const nextPageExists = $(targetConfig.pagination.nextPage).length > 0
          if (!nextPageExists) break
        }

        currentPage++
        if (currentPage <= maxPages) {
          await this.wait(1500)
        }
      } catch (error) {
        console.error(`❌ Failed to scrape FCA page ${currentPage}: ${error.message}`)
        break
      }
    }

    return results
  }

  async extractFCAItemData(item, selectors, targetKey, $) {
    try {
      const title = this.extractText(item, selectors.title, $)
      const url = this.extractUrl(item, selectors.url, this.fcaConfig.baseUrl, $)
      const date = this.extractDate(item, selectors.date, $)
      const summary = this.extractText(item, selectors.summary, $)

      const deadline = selectors.deadline ? this.extractDate(item, selectors.deadline, $) : null
      const speaker = selectors.speaker ? this.extractText(item, selectors.speaker, $) : null
      const status = selectors.status ? this.extractText(item, selectors.status, $) : null
      const reference = selectors.reference ? this.extractText(item, selectors.reference, $) : null
      const firm = selectors.firm ? this.extractText(item, selectors.firm, $) : null
      const documentType = selectors.documentType ? this.extractText(item, selectors.documentType, $) : null

      if (!title || !url) return null

      const itemData = {
        headline: title.trim(),
        url: this.normalizeUrl(url),
        authority: this.fcaConfig.authority,
        area: targetKey,
        source_category: 'fca_advanced_scraping',
        source_description: `FCA - ${this.fcaConfig.scrapingTargets[targetKey].name}`,
        fetched_date: new Date().toISOString(),
        published_date: date ? new Date(date).toISOString() : null,

        raw_data: {
          scrapingTarget: targetKey,
          originalDate: date,
          summary: summary?.trim(),
          deadline,
          speaker: speaker?.trim(),
          status: status?.trim(),
          reference: reference?.trim(),
          firm: firm?.trim(),
          documentType: documentType?.trim(),
          fullTitle: title.trim(),
          fcaSpecific: {
            extractedFrom: this.fcaConfig.scrapingTargets[targetKey].name,
            hasDeadline: !!deadline,
            hasReference: !!reference,
            isEnforcement: targetKey === 'enforcementNotices',
            isConsultation: targetKey === 'consultations'
          }
        }
      }

      return itemData
    } catch (error) {
      console.error(`❌ Failed to extract FCA item data: ${error.message}`)
      return null
    }
  }

  // SIMPLE SCRAPERS (TPR, SFO)
  async scrapeSimpleSources() {
    console.log('📋 Scraping simple sources (TPR, SFO)...')
    const results = []

    // Scrape The Pensions Regulator
    try {
      const tprResults = await this.scrapePensionRegulator()
      results.push(...tprResults)
      console.log(`   ✅ TPR: ${tprResults.length} items`)
    } catch (error) {
      console.error(`   ❌ TPR scraping failed: ${error.message}`)
    }

    // Scrape Serious Fraud Office
    try {
      const sfoResults = await this.scrapeSFO()
      results.push(...sfoResults)
      console.log(`   ✅ SFO: ${sfoResults.length} items`)
    } catch (error) {
      console.error(`   ❌ SFO scraping failed: ${error.message}`)
    }

    this.processingStats.byType.simple = results.length
    return results
  }

  async scrapePensionRegulator() {
    const base = 'https://www.thepensionsregulator.gov.uk/en/media-hub/press-releases'
    try {
      const response = await this.makeRequest(base)
      const $ = cheerio.load(response.data)
      const results = []

      $('.press-release-item,.news-item,.article-item,article,.content-item').each((_, el) => {
        const a = $(el).find('h3 a,h2 a,h4 a,a.title').first()
        const title = a.text().trim()
        let href = a.attr('href') || ''
        if (href && !href.startsWith('http')) href = new URL(href, base).href
        const dateText = $(el).find('time,.date,.published').text()
        const date = this.parseDate(dateText)

        if (title && href && this.isRecent(date, 30)) {
          results.push({
            headline: title,
            url: href,
            authority: 'TPR',
            area: 'press_release',
            source_category: 'tpr_news',
            source_description: 'The Pensions Regulator - Press Releases',
            fetched_date: new Date().toISOString(),
            published_date: date,
            raw_data: {
              originalDate: dateText,
              fullTitle: title
            }
          })
        }
      })

      return results
    } catch (error) {
      console.error('TPR scraping error:', error.message)
      return []
    }
  }

  async scrapeSFO() {
    // Try GOV.UK Atom feed first
    const feedUrl = 'https://www.gov.uk/government/organisations/serious-fraud-office.atom'
    const rss = new Parser()

    try {
      const feed = await rss.parseURL(feedUrl)
      const results = []

      feed.items.forEach(item => {
        const date = item.pubDate ? new Date(item.pubDate).toISOString() : null
        if (this.isRecent(date, 30)) {
          results.push({
            headline: item.title,
            url: item.link,
            authority: 'SFO',
            area: 'news',
            source_category: 'sfo_news',
            source_description: 'Serious Fraud Office - News',
            fetched_date: new Date().toISOString(),
            published_date: date,
            raw_data: {
              summary: item.contentSnippet,
              fullTitle: item.title
            }
          })
        }
      })

      return results
    } catch (error) {
      // Fallback to HTML scraping
      const base = 'https://www.gov.uk/government/organisations/serious-fraud-office'
      try {
        const response = await this.makeRequest(base)
        const $ = cheerio.load(response.data)
        const results = []

        $('.gem-c-document-list__item').each((_, el) => {
          const a = $(el).find('a').first()
          const title = a.text().trim()
          const href = a.attr('href')
          const date = this.parseDate($(el).find('time').attr('datetime'))

          if (title && href && this.isRecent(date, 30)) {
            results.push({
              headline: title,
              url: new URL(href, base).href,
              authority: 'SFO',
              area: 'news',
              source_category: 'sfo_news',
              source_description: 'Serious Fraud Office - News',
              fetched_date: new Date().toISOString(),
              published_date: date,
              raw_data: {
                fullTitle: title
              }
            })
          }
        })

        return results
      } catch (err) {
        console.error('SFO HTML scraping failed:', err.message)
        return []
      }
    }
  }

  // INTERNATIONAL SOURCES SCRAPER
  async scrapeInternationalSources() {
    console.log('🌍 Starting international regulatory sources scraping...')
    const allResults = []

    for (const [sourceKey, sourceConfig] of Object.entries(INTERNATIONAL_SOURCES)) {
      console.log(`   🌍 Processing ${sourceConfig.name} (${sourceConfig.country})`)

      try {
        // Process RSS feeds
        const rssResults = await this.processInternationalRSS(sourceConfig, sourceKey)
        allResults.push(...rssResults)

        // Process deep scraping
        const scrapingResults = await this.processInternationalDeepScraping(sourceConfig, sourceKey)
        allResults.push(...scrapingResults)

        const total = rssResults.length + scrapingResults.length
        console.log(`   ✅ ${sourceConfig.name}: ${total} items`)

        await this.wait(sourceConfig.scrapingConfig?.rateLimit || 4000)
      } catch (error) {
        console.error(`   ❌ Failed to process ${sourceConfig.name}: ${error.message}`)
      }
    }

    this.processingStats.byType.international = allResults.length
    return allResults
  }

  async processInternationalRSS(sourceConfig, sourceKey) {
    const results = []

    if (!sourceConfig.rssFeeds || sourceConfig.rssFeeds.length === 0) {
      return results
    }

    for (const feedConfig of sourceConfig.rssFeeds) {
      try {
        const response = await this.makeRequest(feedConfig.url)
        const parser = new Parser()
        const feed = await parser.parseString(response.data)

        for (const item of feed.items) {
          const itemData = {
            headline: item.title?.trim(),
            url: item.link,
            authority: sourceConfig.authority,
            area: feedConfig.type,
            source_category: 'international_rss',
            source_description: `${sourceConfig.name} - ${feedConfig.description}`,
            fetched_date: new Date().toISOString(),
            published_date: item.pubDate ? new Date(item.pubDate).toISOString() : null,

            raw_data: {
              sourceType: 'rss',
              sourceKey,
              country: sourceConfig.country,
              priority: sourceConfig.priority,
              originalDate: item.pubDate,
              summary: item.contentSnippet?.trim(),
              content: item.content?.trim(),
              fullTitle: item.title?.trim(),
              international: {
                isInternational: true,
                sourceAuthority: sourceConfig.authority,
                sourceCountry: sourceConfig.country,
                feedType: feedConfig.type
              }
            }
          }

          results.push(itemData)
        }
      } catch (error) {
        console.error(`❌ Failed to process RSS feed ${feedConfig.url}: ${error.message}`)
      }
    }

    return results
  }

  async processInternationalDeepScraping(sourceConfig, sourceKey) {
    const results = []

    if (!sourceConfig.deepScraping) {
      return results
    }

    for (const [scrapingType, config] of Object.entries(sourceConfig.deepScraping)) {
      try {
        const response = await this.makeRequest(config.url)
        const $ = cheerio.load(response.data)

        const items = $(config.selectors.items)

        for (let i = 0; i < items.length; i++) {
          const item = items.eq(i)

          const title = this.extractText(item, config.selectors.title, $)
          const url = this.extractInternationalUrl(item, config.selectors.url, sourceConfig.baseUrl, $)
          const date = this.extractText(item, config.selectors.date, $)
          const summary = this.extractText(item, config.selectors.summary, $)

          if (title && url) {
            const itemData = {
              headline: title.trim(),
              url,
              authority: sourceConfig.authority,
              area: scrapingType,
              source_category: 'international_scraping',
              source_description: `${sourceConfig.name} - ${scrapingType}`,
              fetched_date: new Date().toISOString(),
              published_date: date ? new Date(date).toISOString() : null,

              raw_data: {
                sourceType: 'scraping',
                sourceKey,
                scrapingType,
                country: sourceConfig.country,
                priority: sourceConfig.priority,
                originalDate: date,
                summary: summary?.trim(),
                fullTitle: title.trim(),
                international: {
                  isInternational: true,
                  sourceAuthority: sourceConfig.authority,
                  sourceCountry: sourceConfig.country,
                  scrapingTarget: scrapingType
                }
              }
            }

            results.push(itemData)
          }
        }

        await this.wait(2000)
      } catch (error) {
        console.error(`❌ Failed to scrape ${scrapingType} from ${sourceConfig.name}: ${error.message}`)
      }
    }

    return results
  }

  extractInternationalUrl(item, selector, baseUrl, $) {
    if (!selector) return null

    try {
      const element = item.find ? item.find(selector) : $(selector, item)
      let href = element.first().attr('href')

      if (!href) return null

      if (href.startsWith('/')) {
        href = baseUrl + href
      } else if (!href.startsWith('http') && !href.includes('://')) {
        href = baseUrl + (baseUrl.endsWith('/') ? '' : '/') + href
      }

      return href
    } catch (error) {
      return null
    }
  }

  // FATF SCRAPER (from earlier integration)
  async scrapeFATF() {
    console.log('🌍 FATF: Starting specialized scraping...')

    let browser
    const results = []

    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })

      const page = await browser.newPage()
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')

      // Scrape News
      console.log('   📰 Scraping FATF news...')
      await page.goto('https://www.fatf-gafi.org/en/the-fatf/news.html', {
        waitUntil: 'networkidle2',
        timeout: 60000
      })

      await new Promise(resolve => setTimeout(resolve, 5000))

      const newsItems = await page.evaluate(() => {
        const items = []
        const mainContent = document.querySelector('main') || document.body

        const walker = document.createTreeWalker(
          mainContent,
          NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
          null,
          false
        )

        let currentDate = null
        let node = walker.nextNode()

        while (node) {
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent?.trim() || ''
            const dateMatch = text.match(/^(\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})$/)
            if (dateMatch) {
              currentDate = dateMatch[1]
            }
          } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'A') {
            const link = node
            const href = link.href
            const fullText = link.textContent?.trim() || ''

            if (currentDate &&
                            href &&
                            fullText.length > 20 &&
                            (href.includes('/publications/') ||
                             href.includes('/news/') ||
                             href.includes('/the-fatf/')) &&
                            !fullText.includes('All publications') &&
                            !fullText.includes('window.') &&
                            !href.includes('#')) {
              items.push({
                title: fullText,
                link: href,
                date: currentDate,
                type: 'news'
              })
            }
          }

          node = walker.nextNode()
        }

        return items
      })

      newsItems.forEach(item => {
        if (item.title && item.link) {
          results.push({
            headline: item.title,
            url: item.link,
            authority: 'FATF',
            area: 'news',
            source_category: 'fatf_news',
            source_description: 'FATF - News & Updates',
            fetched_date: new Date().toISOString(),
            published_date: this.parseFATFDate(item.date),
            raw_data: {
              originalDate: item.date,
              type: 'news',
              fullTitle: item.title,
              fatfSource: true
            }
          })
        }
      })

      // Scrape Publications
      console.log('   📚 Scraping FATF publications...')
      await page.goto('https://www.fatf-gafi.org/en/publications.html', {
        waitUntil: 'networkidle2',
        timeout: 60000
      })

      await new Promise(resolve => setTimeout(resolve, 5000))

      const publications = await page.evaluate(() => {
        const items = []
        const mainContent = document.querySelector('main') || document.body
        const links = mainContent.querySelectorAll('a[href*="/publications/"]')

        links.forEach(link => {
          const href = link.href
          const fullText = link.textContent?.trim() || ''

          if (fullText.length > 20 &&
                        !fullText.includes('Publications') &&
                        !fullText.includes('Browse') &&
                        !href.endsWith('/publications.html') &&
                        !href.includes('#')) {
            const parent = link.closest('article, div, li, section')
            let dateText = null

            if (parent) {
              const parentText = parent.textContent || ''
              const dateMatch = parentText.match(/(\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})/)
              if (dateMatch) dateText = dateMatch[1]
            }

            items.push({
              title: fullText,
              link: href,
              date: dateText,
              type: 'publication'
            })
          }
        })

        return items
      })

      const seenUrls = new Set()
      publications.forEach(item => {
        if (item.title && item.link && !seenUrls.has(item.link)) {
          seenUrls.add(item.link)

          let category = 'publication'
          const lowerTitle = item.title.toLowerCase()

          if (lowerTitle.includes('consultation') || lowerTitle.includes('public comment')) {
            category = 'consultation'
          } else if (lowerTitle.includes('mutual evaluation') || lowerTitle.includes('follow-up report')) {
            category = 'country_evaluation'
          } else if (lowerTitle.includes('guidance')) {
            category = 'guidance'
          }

          results.push({
            headline: item.title,
            url: item.link,
            authority: 'FATF',
            area: category,
            source_category: `fatf_${category}`,
            source_description: `FATF - ${category.replace('_', ' ').toUpperCase()}`,
            fetched_date: new Date().toISOString(),
            published_date: this.parseFATFDate(item.date),
            raw_data: {
              originalDate: item.date,
              type: 'publication',
              category,
              fullTitle: item.title,
              fatfSource: true
            }
          })
        }
      })

      await browser.close()

      const recentResults = results.filter(item => {
        if (!item.published_date) return false
        const date = new Date(item.published_date)
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - 30)
        return date >= cutoff
      })

      console.log(`   ✅ FATF: Found ${recentResults.length} recent items`)

      this.processingStats.byType.fatf = recentResults.length

      return recentResults
    } catch (error) {
      console.error('❌ FATF scraping error:', error.message)
      if (browser) await browser.close()
      return []
    }
  }

  parseFATFDate(dateStr) {
    if (!dateStr) return null

    try {
      const monthMap = {
        Jan: 0,
        Feb: 1,
        Mar: 2,
        Apr: 3,
        May: 4,
        Jun: 5,
        Jul: 6,
        Aug: 7,
        Sep: 8,
        Oct: 9,
        Nov: 10,
        Dec: 11
      }

      const match = dateStr.match(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/)
      if (match) {
        const day = parseInt(match[1])
        const month = monthMap[match[2]]
        const year = parseInt(match[3])
        return new Date(year, month, day).toISOString()
      }

      return null
    } catch (error) {
      return null
    }
  }

  // MAIN ORCHESTRATOR
  async scrapeAllSources() {
    console.log('🚀 Starting comprehensive data collection with ALL sources...')
    console.log('   Sources: FCA Advanced, FATF, International, TPR, SFO, RSS Feeds\n')

    this.resetStats()
    const allResults = []

    try {
      // Initialize database
      await dbService.initialize()
      console.log('✅ Database initialized\n')

      // 1. FCA Advanced Scraping
      const fcaResults = await this.scrapeFCAAdvanced()
      allResults.push(...fcaResults)
      this.processingStats.bySource.FCA = {
        processed: fcaResults.length,
        errors: 0
      }

      // 2. FATF Scraping
      const fatfResults = await this.scrapeFATF()
      allResults.push(...fatfResults)
      this.processingStats.bySource.FATF = {
        processed: fatfResults.length,
        errors: 0
      }

      // 3. Simple Sources (TPR, SFO)
      const simpleResults = await this.scrapeSimpleSources()
      allResults.push(...simpleResults)

      // 4. International Sources
      const internationalResults = await this.scrapeInternationalSources()
      allResults.push(...internationalResults)

      // 5. Process other configured sources with RSS/deep scraping
      const priorities = ['HIGH', 'MEDIUM', 'LOW']

      for (const priority of priorities) {
        const prioritySources = getSourcesByPriority(priority)

        for (const [sourceKey, sourceConfig] of Object.entries(prioritySources)) {
          // Skip already processed sources
          if (['FATF', 'FCA'].includes(sourceKey)) continue

          try {
            console.log(`🎯 Processing ${sourceConfig.name} (${sourceConfig.country})`)

            // RSS feeds
            const rssResults = await this.processRSSFeeds(sourceConfig)
            allResults.push(...rssResults)

            // Deep scraping
            const scrapingResults = await this.performDeepScraping(sourceConfig)
            allResults.push(...scrapingResults)

            const total = rssResults.length + scrapingResults.length
            this.processingStats.bySource[sourceKey] = {
              processed: total,
              errors: 0
            }

            await new Promise(resolve => setTimeout(resolve, 2000))
          } catch (error) {
            console.error(`❌ Failed to process ${sourceConfig.name}: ${error.message}`)
            this.processingStats.bySource[sourceKey] = {
              processed: 0,
              errors: 1
            }
          }
        }
      }

      // Process all collected data
      console.log(`\n📝 Processing ${allResults.length} collected items...`)
      const finalResults = await this.processCollectedData(allResults)

      this.processingStats.processed = finalResults.length
      this.logComprehensiveStats()

      console.log(`\n🎉 Complete data collection finished: ${finalResults.length} items processed`)

      return finalResults
    } catch (error) {
      console.error('❌ Critical error in data collection:', error)
      this.logComprehensiveStats()
      throw error
    }
  }

  // Remaining utility methods (unchanged)
  async respectRateLimit(domain) {
    const now = Date.now()
    const lastRequest = this.rateLimiters.get(domain) || 0
    const timeSinceLastRequest = now - lastRequest

    let rateLimit = 2000

    if (domain.includes('fatf-gafi.org')) rateLimit = 4000
    else if (domain.includes('europa.eu')) rateLimit = 3000
    else if (domain.includes('bis.org')) rateLimit = 4000

    if (timeSinceLastRequest < rateLimit) {
      const waitTime = rateLimit - timeSinceLastRequest
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    this.rateLimiters.set(domain, Date.now())
  }

  async makeRequest(url, options = {}) {
    const maxRetries = options.retries || 3
    const baseDelay = options.baseDelay || 1000

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.httpClient.get(url, {
          timeout: options.timeout || 30000,
          headers: {
            ...options.headers,
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Cache-Control': 'no-cache'
          }
        })

        if (response.status !== 200) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        if (!response.data || response.data.length < 100) {
          throw new Error('Response too short or empty')
        }

        return response
      } catch (error) {
        if (attempt === maxRetries) {
          throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`)
        }

        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  // [Continue with all other utility methods from the original file...]
  // Including: extractText, extractUrl, extractDate, parseDate, isRecent,
  // normalizeUrl, buildPageUrl, wait, validateContent, processRSSFeeds,
  // performDeepScraping, processCollectedData, checkForDuplicate,
  // resetStats, logComprehensiveStats, healthCheck, etc.

  // I'll include the key remaining ones:

  extractText(item, selector, $) {
    if (!selector) return null

    try {
      const element = item.find ? item.find(selector) : $(selector, item)
      return element.first().text()?.trim() || null
    } catch (error) {
      return null
    }
  }

  extractUrl(item, selector, baseUrl, $) {
    if (!selector) return null

    try {
      const element = item.find ? item.find(selector) : $(selector, item)
      let href = element.first().attr('href')

      if (!href) return null

      if (href.startsWith('/')) {
        href = baseUrl + href
      } else if (!href.startsWith('http')) {
        href = baseUrl + '/' + href
      }

      return href
    } catch (error) {
      return null
    }
  }

  extractDate(item, selector, $) {
    if (!selector) return null

    try {
      const element = item.find ? item.find(selector) : $(selector, item)
      const dateText = element.first().text()?.trim() || element.first().attr('datetime')
      return dateText
    } catch (error) {
      return null
    }
  }

  parseDate(dateText) {
    if (!dateText) return null
    try {
      const date = new Date(dateText)
      return isNaN(date.getTime()) ? null : date.toISOString()
    } catch (error) {
      return null
    }
  }

  isRecent(dateStr, days) {
    if (!dateStr) return false
    try {
      const date = new Date(dateStr)
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - days)
      return date >= cutoff
    } catch (error) {
      return false
    }
  }

  normalizeUrl(url) {
    try {
      const urlObj = new URL(url)
      const paramsToRemove = ['utm_source', 'utm_medium', 'utm_campaign']
      paramsToRemove.forEach(param => urlObj.searchParams.delete(param))
      return urlObj.toString()
    } catch (error) {
      return url
    }
  }

  buildPageUrl(baseUrl, pageNumber) {
    if (pageNumber <= 1) return baseUrl

    try {
      const url = new URL(baseUrl)
      url.searchParams.set('page', pageNumber.toString())
      return url.toString()
    } catch (error) {
      const separator = baseUrl.includes('?') ? '&' : '?'
      return `${baseUrl}${separator}page=${pageNumber}`
    }
  }

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Continue with processRSSFeeds, performDeepScraping, processCollectedData, etc...
  // [These remain the same as in the previous version]

  resetStats() {
    this.processingStats = {
      total: 0,
      processed: 0,
      skipped: 0,
      errors: 0,
      startTime: Date.now(),
      bySource: {},
      byType: {
        rss: 0,
        deepScraping: 0,
        international: 0,
        fatf: 0,
        fca: 0,
        simple: 0
      }
    }
  }

  logComprehensiveStats() {
    const elapsed = Date.now() - this.processingStats.startTime
    const minutes = Math.round(elapsed / 60000)
    const seconds = Math.round((elapsed % 60000) / 1000)

    console.log('\n' + '='.repeat(60))
    console.log('📊 COMPREHENSIVE DATA COLLECTION STATISTICS')
    console.log('='.repeat(60))
    console.log(`✅ Processed: ${this.processingStats.processed}`)
    console.log(`⏭️ Skipped: ${this.processingStats.skipped}`)
    console.log(`❌ Errors: ${this.processingStats.errors}`)
    console.log(`⏱️ Duration: ${minutes}m ${seconds}s`)
    console.log('')
    console.log('📊 By Type:')
    console.log(`   🏛️ FCA Advanced: ${this.processingStats.byType.fca}`)
    console.log(`   🌍 FATF: ${this.processingStats.byType.fatf}`)
    console.log(`   🌐 International: ${this.processingStats.byType.international}`)
    console.log(`   📋 Simple (TPR/SFO): ${this.processingStats.byType.simple}`)
    console.log(`   📡 RSS Feeds: ${this.processingStats.byType.rss}`)
    console.log(`   🕷️ Deep Scraping: ${this.processingStats.byType.deepScraping}`)
    console.log('')
    console.log('📊 By Source:')
    Object.entries(this.processingStats.bySource).forEach(([source, stats]) => {
      console.log(`   ${source}: ${stats.processed} items, ${stats.errors} errors`)
    })
    console.log('='.repeat(60))
  }

  async processCollectedData(rawResults) {
    const processedResults = []

    console.log(`🔄 Post-processing ${rawResults.length} items...`)

    for (const item of rawResults) {
      try {
        const isDuplicate = await this.checkForDuplicate(item)
        if (isDuplicate) {
          console.log(`⏭️ Skipping duplicate: ${item.headline?.substring(0, 50)}...`)
          this.processingStats.skipped++
          continue
        }

        if (aiAnalyzer && typeof aiAnalyzer.analyzeUpdate === 'function') {
          try {
            const analysisResult = await aiAnalyzer.analyzeUpdate(item)
            if (analysisResult && analysisResult.success && analysisResult.data) {
              const analysis = analysisResult.data

              // Map AI analysis data to item fields - complete payload
              item.impact = analysis.impact
              item.impactLevel = analysis.impactLevel
              item.impact_level = analysis.impactLevel // Both formats
              item.businessImpactScore = analysis.businessImpactScore
              item.business_impact_score = analysis.businessImpactScore // Both formats
              item.urgency = analysis.urgency
              item.sector = analysis.sector
              item.primarySectors = analysis.primarySectors
              item.ai_summary = analysis.ai_summary
              item.content_type = analysis.content_type || analysis.contentType
              item.area = analysis.area
              item.ai_tags = analysis.ai_tags
              item.aiTags = analysis.aiTags || analysis.ai_tags // Both formats
              item.ai_confidence_score = analysis.ai_confidence_score
              item.complianceActions = analysis.complianceActions
              item.riskLevel = analysis.riskLevel
              item.affectedFirmSizes = analysis.affectedFirmSizes
              item.category = analysis.category
              item.key_dates = analysis.key_dates
              item.keyDates = analysis.key_dates // Both formats
              item.sectorRelevanceScores = analysis.sectorRelevanceScores

              // Additional AI analysis fields from full payload
              item.businessOpportunities = analysis.businessOpportunities
              item.implementationComplexity = analysis.implementationComplexity
              item.enhancedAt = analysis.enhancedAt
              item.aiModelUsed = analysis.aiModelUsed
              item.fallbackAnalysis = analysis.fallbackAnalysis

              // Map compliance-related fields
              item.compliance_deadline = analysis.compliance_deadline
              item.complianceDeadline = analysis.compliance_deadline // Both formats
              item.firm_types_affected = analysis.firm_types_affected || []
              item.firmTypesAffected = analysis.firm_types_affected || [] // Both formats
              item.primary_sectors = analysis.primary_sectors || analysis.primarySectors || []
              item.implementation_phases = analysis.implementation_phases || []
              item.implementationPhases = analysis.implementation_phases || [] // Both formats
              item.required_resources = analysis.required_resources || {}
              item.requiredResources = analysis.required_resources || {} // Both formats

              // Store full analysis in raw_data
              if (item.raw_data) {
                item.raw_data.aiAnalysis = analysis
              }

              console.log(`✅ AI analysis applied to item: ${item.url}`)
            }
          } catch (aiError) {
            console.log(`⚠️ AI analysis failed: ${aiError.message}`)
          }
        }

        await dbService.saveUpdate(item)
        processedResults.push(item)
      } catch (error) {
        console.error(`❌ Failed to process item: ${error.message}`)
        this.processingStats.errors++
      }
    }

    return processedResults
  }

  async checkForDuplicate(item) {
    try {
      const existing = await dbService.getUpdateByUrl(item.url)
      return !!existing
    } catch (error) {
      console.error('Error checking for duplicate:', error.message)
      return false
    }
  }

  validateContent(title, content, url) {
    const validation = { valid: true, issues: [] }

    if (!title || title.length < 10) {
      validation.issues.push('Title too short')
      validation.valid = false
    }

    if (!url) {
      validation.issues.push('Missing URL')
      validation.valid = false
    }

    return validation
  }

  async processRSSFeeds(sourceConfig) {
    const results = []

    if (!sourceConfig.rssFeeds || sourceConfig.rssFeeds.length === 0) {
      return results
    }

    for (const feedConfig of sourceConfig.rssFeeds) {
      try {
        const response = await this.makeRequest(feedConfig.url, sourceConfig.scrapingConfig)
        const Parser = require('rss-parser')
        const parser = new Parser()
        const feed = await parser.parseString(response.data)

        for (const item of feed.items) {
          try {
            const itemData = {
              headline: item.title?.trim(),
              url: item.link,
              authority: sourceConfig.authority,
              area: feedConfig.type,
              source_category: 'rss',
              source_description: feedConfig.description,
              fetched_date: new Date().toISOString(),
              published_date: item.pubDate ? new Date(item.pubDate).toISOString() : null,
              raw_data: {
                rssType: feedConfig.type,
                originalDate: item.pubDate,
                summary: item.contentSnippet?.trim(),
                content: item.content?.trim(),
                fullTitle: item.title?.trim(),
                sourceConfig: {
                  authority: sourceConfig.authority,
                  country: sourceConfig.country,
                  priority: sourceConfig.priority
                }
              }
            }

            const validation = this.validateContent(
              item.title || '',
              item.contentSnippet || '',
              item.link
            )

            if (validation.valid) {
              results.push(itemData)
              this.processingStats.byType.rss++
            }
          } catch (error) {
            console.error(`❌ Failed to process RSS item: ${error.message}`)
          }
        }
      } catch (error) {
        console.error(`❌ Failed to process RSS feed ${feedConfig.url}: ${error.message}`)
        this.processingStats.errors++
      }
    }

    return results
  }

  async performDeepScraping(sourceConfig) {
    const results = []

    if (!sourceConfig.deepScraping) {
      return results
    }

    for (const [scrapingType, config] of Object.entries(sourceConfig.deepScraping)) {
      try {
        const scrapingResults = await this.scrapeSection(
          config,
          sourceConfig,
          scrapingType
        )

        results.push(...scrapingResults)

        await new Promise(resolve => setTimeout(resolve, sourceConfig.scrapingConfig?.rateLimit || 2000))
      } catch (error) {
        console.error(`❌ Failed to scrape ${scrapingType}: ${error.message}`)
        this.processingStats.errors++
      }
    }

    return results
  }

  async scrapeSection(config, sourceConfig, scrapingType) {
    const results = []
    let currentPage = 1
    const maxPages = config.pagination?.maxPages || 1

    while (currentPage <= maxPages) {
      try {
        let pageUrl = config.url

        if (currentPage > 1 && config.pagination) {
          pageUrl = this.buildPaginationUrl(config.url, currentPage, config.pagination)
        }

        const response = await this.makeRequest(pageUrl, sourceConfig.scrapingConfig)
        const $ = cheerio.load(response.data)

        const items = $(config.selectors.items)

        if (items.length === 0) break

        for (let i = 0; i < items.length; i++) {
          try {
            const item = items.eq(i)
            const extractedData = await this.extractItemData(
              item,
              config.selectors,
              sourceConfig,
              scrapingType,
              $
            )

            if (extractedData) {
              results.push(extractedData)
            }
          } catch (error) {
            console.error(`❌ Failed to extract item: ${error.message}`)
          }
        }

        if (config.pagination && currentPage < maxPages) {
          const nextPageExists = $(config.pagination.nextPage).length > 0
          if (!nextPageExists) break
        }

        currentPage++

        if (currentPage <= maxPages) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (error) {
        console.error(`❌ Failed to scrape page ${currentPage}: ${error.message}`)
        break
      }
    }

    return results
  }

  async extractItemData(item, selectors, sourceConfig, scrapingType, $) {
    try {
      const title = this.extractText(item, selectors.title, $)
      const url = this.extractUrl(item, selectors.url, sourceConfig.baseUrl, $)
      const date = this.extractDate(item, selectors.date, $)
      const summary = this.extractText(item, selectors.summary, $)

      const deadline = selectors.deadline ? this.extractDate(item, selectors.deadline, $) : null
      const speaker = selectors.speaker ? this.extractText(item, selectors.speaker, $) : null
      const status = selectors.status ? this.extractText(item, selectors.status, $) : null
      const documentType = selectors.type ? this.extractText(item, selectors.type, $) : null

      if (!title || !url) return null

      const itemData = {
        headline: title.trim(),
        url,
        authority: sourceConfig.authority,
        area: scrapingType,
        source_category: 'deep_scraping',
        source_description: `${sourceConfig.name} - ${scrapingType}`,
        fetched_date: new Date().toISOString(),
        published_date: date ? new Date(date).toISOString() : null,
        raw_data: {
          scrapingType,
          originalDate: date,
          summary: summary?.trim(),
          deadline,
          speaker: speaker?.trim(),
          status: status?.trim(),
          documentType: documentType?.trim(),
          fullTitle: title.trim(),
          sourceConfig: {
            authority: sourceConfig.authority,
            country: sourceConfig.country,
            priority: sourceConfig.priority
          }
        }
      }

      return itemData
    } catch (error) {
      console.error(`❌ Failed to extract item data: ${error.message}`)
      return null
    }
  }

  async healthCheck() {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: false,
        aiAnalyzer: false,
        networkConnectivity: false,
        puppeteer: false
      },
      stats: {
        activeRequests: this.activeRequests.size,
        rateLimiters: this.rateLimiters.size
      }
    }

    try {
      await dbService.initialize()
      health.checks.database = true
    } catch (error) {
      health.checks.database = false
    }

    try {
      health.checks.aiAnalyzer = typeof aiAnalyzer?.analyzeUpdate === 'function'
    } catch (error) {
      health.checks.aiAnalyzer = false
    }

    try {
      await this.makeRequest('https://www.google.com', { timeout: 5000 })
      health.checks.networkConnectivity = true
    } catch (error) {
      health.checks.networkConnectivity = false
    }

    try {
      const browser = await puppeteer.launch({ headless: 'new' })
      await browser.close()
      health.checks.puppeteer = true
    } catch (error) {
      health.checks.puppeteer = false
    }

    const allChecks = Object.values(health.checks)
    const healthyChecks = allChecks.filter(check => check === true)

    if (healthyChecks.length === allChecks.length) {
      health.status = 'healthy'
    } else if (healthyChecks.length > 0) {
      health.status = 'degraded'
    } else {
      health.status = 'unhealthy'
    }

    return health
  }
}

// Export singleton instance
module.exports = new WebScraperService()
