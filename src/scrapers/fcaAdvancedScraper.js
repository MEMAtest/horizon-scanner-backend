// src/scrapers/fcaAdvancedScraper.js
// FCA Advanced Scraper - Deep Website Content Extraction
// Phase 2: Enhanced Data Collection for Financial Conduct Authority

const axios = require('axios')
const cheerio = require('cheerio')
const { URL } = require('url')
const contentProcessor = require('../services/contentProcessor')
const dataQualityService = require('../services/dataQualityService')

class FCAAdvancedScraper {
  constructor() {
    this.baseUrl = 'https://www.fca.org.uk'
    this.authority = 'FCA'
    this.rateLimit = 2000 // 2 seconds between requests
    this.maxRetries = 3

    this.stats = {
      totalAttempted: 0,
      successful: 0,
      failed: 0,
      duplicates: 0,
      processingTime: 0
    }

    // FCA-specific URL patterns and configurations
    this.scrapingTargets = {
      consultations: {
        name: 'Consultations',
        urls: [
          'https://www.fca.org.uk/publications?category%5B%5D=consultation&category%5B%5D=guidance-consultation',
          'https://www.fca.org.uk/publications?category%5B%5D=consultation'
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
        }
      },

      speeches: {
        name: 'Speeches',
        urls: [
          'https://www.fca.org.uk/news/speeches'
        ],
        selectors: {
          container: '.search-results',
          items: '.search-result',
          title: '.search-result__title a',
          url: '.search-result__title a',
          date: '.search-result__date',
          speaker: '.search-result__speaker, .speaker',
          summary: '.search-result__summary'
        }
      },

      newsAndUpdates: {
        name: 'News & Updates',
        urls: [
          'https://www.fca.org.uk/news',
          'https://www.fca.org.uk/news/news-stories'
        ],
        selectors: {
          container: '.search-results, .news-list',
          items: '.search-result, .news-item',
          title: '.search-result__title a, .news-item__title a',
          url: '.search-result__title a, .news-item__title a',
          date: '.search-result__date, .news-item__date',
          summary: '.search-result__summary, .news-item__summary'
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
        }
      }
    }

    // Initialize HTTP client with proper headers
    this.httpClient = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RegulatoryScanner/2.0)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Cache-Control': 'no-cache'
      }
    })
  }

  // MAIN SCRAPING ORCHESTRATOR
  async scrapeAll() {
    console.log('🏛️ Starting FCA advanced scraping...')

    const startTime = Date.now()
    this.resetStats()

    const allResults = []

    try {
      for (const [targetKey, targetConfig] of Object.entries(this.scrapingTargets)) {
        console.log(`\n📋 Scraping ${targetConfig.name}...`)

        try {
          const results = await this.scrapeTarget(targetConfig, targetKey)
          allResults.push(...results)

          console.log(`✅ ${targetConfig.name}: ${results.length} items collected`)

          // Rate limiting between targets
          await this.wait(this.rateLimit)
        } catch (error) {
          console.error(`❌ Failed to scrape ${targetConfig.name}: ${error.message}`)
          this.stats.failed++
        }
      }

      // Process all collected data for quality
      console.log(`\n🔍 Processing ${allResults.length} items for quality...`)
      const qualityResults = await dataQualityService.processDataQuality(allResults)

      // Enhanced content processing
      console.log('🔄 Enhanced content processing...')
      const processedResults = await contentProcessor.processBatch(qualityResults)

      this.stats.processingTime = Date.now() - startTime
      this.stats.successful = processedResults.length

      this.logStats()
      console.log(`🎉 FCA advanced scraping complete: ${processedResults.length} items processed`)

      return processedResults
    } catch (error) {
      console.error('❌ FCA advanced scraping failed:', error)
      this.logStats()
      throw error
    }
  }

  // SCRAPE SPECIFIC TARGET
  async scrapeTarget(targetConfig, targetKey) {
    const results = []

    for (const baseUrl of targetConfig.urls) {
      try {
        console.log(`📄 Processing: ${baseUrl}`)

        const pageResults = await this.scrapePages(baseUrl, targetConfig, targetKey)
        results.push(...pageResults)

        // Rate limiting between URLs
        await this.wait(1000)
      } catch (error) {
        console.error(`❌ Failed to process URL ${baseUrl}: ${error.message}`)
      }
    }

    return results
  }

  // SCRAPE MULTIPLE PAGES WITH PAGINATION
  async scrapePages(baseUrl, targetConfig, targetKey) {
    const results = []
    let currentPage = 1
    const maxPages = targetConfig.pagination?.maxPages || 5

    while (currentPage <= maxPages) {
      try {
        const pageUrl = this.buildPageUrl(baseUrl, currentPage)
        console.log(`📄 Scraping page ${currentPage}/${maxPages}: ${pageUrl}`)

        const response = await this.makeRequest(pageUrl)
        const $ = cheerio.load(response.data)

        // Check if we have content
        const container = $(targetConfig.selectors.container)
        if (container.length === 0) {
          console.log(`⚠️ No content container found on page ${currentPage}`)
          break
        }

        const items = $(targetConfig.selectors.items)
        if (items.length === 0) {
          console.log(`📄 No items found on page ${currentPage}, stopping pagination`)
          break
        }

        console.log(`📋 Found ${items.length} items on page ${currentPage}`)

        // Extract items from current page
        for (let i = 0; i < items.length; i++) {
          try {
            const item = items.eq(i)
            const extractedData = await this.extractItemData(item, targetConfig.selectors, targetKey, $)

            if (extractedData) {
              results.push(extractedData)
              this.stats.totalAttempted++
            }
          } catch (error) {
            console.error(`❌ Failed to extract item ${i + 1}: ${error.message}`)
          }
        }

        // Check for next page
        if (targetConfig.pagination && currentPage < maxPages) {
          const nextPageExists = $(targetConfig.pagination.nextPage).length > 0
          if (!nextPageExists) {
            console.log('📄 No next page indicator found, stopping pagination')
            break
          }
        }

        currentPage++

        // Rate limiting between pages
        if (currentPage <= maxPages) {
          await this.wait(1500)
        }
      } catch (error) {
        console.error(`❌ Failed to scrape page ${currentPage}: ${error.message}`)
        break
      }
    }

    return results
  }

  // EXTRACT DATA FROM INDIVIDUAL ITEM
  async extractItemData(item, selectors, targetKey, $) {
    try {
      // Extract basic fields
      const title = this.extractText(item, selectors.title, $)
      const url = this.extractUrl(item, selectors.url, $)
      const date = this.extractDate(item, selectors.date, $)
      const summary = this.extractText(item, selectors.summary, $)

      // Extract FCA-specific fields
      const deadline = selectors.deadline ? this.extractDate(item, selectors.deadline, $) : null
      const speaker = selectors.speaker ? this.extractText(item, selectors.speaker, $) : null
      const status = selectors.status ? this.extractText(item, selectors.status, $) : null
      const reference = selectors.reference ? this.extractText(item, selectors.reference, $) : null
      const firm = selectors.firm ? this.extractText(item, selectors.firm, $) : null
      const documentType = selectors.documentType ? this.extractText(item, selectors.documentType, $) : null

      // Validate essential fields
      if (!title || !url) {
        console.log('⚠️ Skipping item: missing title or URL')
        return null
      }

      // Build rich data object
      const itemData = {
        headline: title.trim(),
        url: this.normalizeUrl(url),
        authority: this.authority,
        area: targetKey,
        source_category: 'fca_advanced_scraping',
        source_description: `FCA - ${this.scrapingTargets[targetKey].name}`,
        fetched_date: new Date().toISOString(),

        // FCA-specific enriched data
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
          fcaSpecific: {
            extractedFrom: this.scrapingTargets[targetKey].name,
            hasDeadline: !!deadline,
            hasReference: !!reference,
            isEnforcement: targetKey === 'enforcementNotices',
            isConsultation: targetKey === 'consultations'
          }
        }
      }

      // Enhanced validation
      const validation = this.validateFCAItem(itemData)
      if (!validation.isValid) {
        console.log(`⚠️ FCA validation failed: ${validation.issues.join(', ')}`)
        return null
      }

      // Attempt to fetch full content for important items
      if (targetKey === 'consultations' || targetKey === 'policyStatements') {
        try {
          const fullContent = await this.fetchFullContent(itemData.url)
          if (fullContent) {
            itemData.raw_data.fullContent = fullContent
            itemData.raw_data.hasFullContent = true
          }
        } catch (error) {
          console.log(`⚠️ Failed to fetch full content: ${error.message}`)
        }
      }

      console.log(`✅ Extracted FCA item: ${title.substring(0, 80)}...`)
      return itemData
    } catch (error) {
      console.error(`❌ Failed to extract FCA item data: ${error.message}`)
      return null
    }
  }

  // FETCH FULL CONTENT FROM DETAIL PAGES
  async fetchFullContent(url) {
    try {
      console.log(`📖 Fetching full content: ${url}`)

      const response = await this.makeRequest(url)
      const $ = cheerio.load(response.data)

      // FCA-specific content selectors
      const contentSelectors = [
        '.main-content .content',
        '.publication-content',
        '.news-content',
        '.speech-content',
        '.article-content',
        'main .content',
        '.page-content'
      ]

      let content = ''

      for (const selector of contentSelectors) {
        const element = $(selector)
        if (element.length > 0) {
          content = element.text().trim()
          break
        }
      }

      // Extract key metadata from full page
      const metadata = {
        wordCount: content.split(/\s+/).length,
        hasExecutiveSummary: /executive\s+summary/i.test(content),
        hasImplementationDate: /implementation\s+date/i.test(content),
        hasTransition: /transition/i.test(content),
        mentionsHandbook: /handbook/i.test(content),
        mentionsRule: /rule\s+\d+/i.test(content)
      }

      return {
        content: content.substring(0, 5000), // Limit content length
        metadata,
        extractedDate: new Date().toISOString()
      }
    } catch (error) {
      console.error(`Failed to fetch full content: ${error.message}`)
      return null
    }
  }

  // FCA-SPECIFIC VALIDATION
  validateFCAItem(item) {
    const validation = {
      isValid: true,
      issues: []
    }

    // Check for FCA-specific patterns
    if (item.headline) {
      const title = item.headline.toLowerCase()

      // Must contain regulatory content
      const regulatoryTerms = [
        'consultation', 'guidance', 'policy', 'statement', 'regulation',
        'enforcement', 'notice', 'speech', 'update', 'review',
        'framework', 'standard', 'requirement', 'rule'
      ]

      const hasRegulatoryTerm = regulatoryTerms.some(term => title.includes(term))
      if (!hasRegulatoryTerm) {
        validation.issues.push('No regulatory terms in title')
        validation.isValid = false
      }
    }

    // URL validation
    if (item.url && !item.url.includes('fca.org.uk')) {
      validation.issues.push('URL not from FCA domain')
      validation.isValid = false
    }

    // Date validation for consultations
    if (item.area === 'consultations' && !item.raw_data?.deadline) {
      validation.issues.push('Consultation missing deadline')
      // Don't mark as invalid, just note the issue
    }

    return validation
  }

  // UTILITY FUNCTIONS

  extractText(item, selector, $) {
    if (!selector) return null

    try {
      const element = item.find(selector)
      const text = element.first().text()?.trim()
      return text || null
    } catch (error) {
      return null
    }
  }

  extractUrl(item, selector, $) {
    if (!selector) return null

    try {
      const element = item.find(selector)
      let href = element.first().attr('href')

      if (!href) return null

      // Convert relative URLs to absolute
      if (href.startsWith('/')) {
        href = this.baseUrl + href
      } else if (!href.startsWith('http')) {
        href = this.baseUrl + '/' + href
      }

      return href
    } catch (error) {
      return null
    }
  }

  extractDate(item, selector, $) {
    if (!selector) return null

    try {
      const element = item.find(selector)
      const dateText = element.first().text()?.trim()

      if (!dateText) return null

      // Parse various FCA date formats
      const date = this.parseFCADate(dateText)
      return date ? date.toISOString() : null
    } catch (error) {
      return null
    }
  }

  parseFCADate(dateText) {
    try {
      // Handle FCA-specific date formats
      const cleanDate = dateText
        .replace(/published:?\s*/i, '')
        .replace(/deadline:?\s*/i, '')
        .replace(/date:?\s*/i, '')
        .trim()

      const date = new Date(cleanDate)
      return isNaN(date.getTime()) ? null : date
    } catch (error) {
      return null
    }
  }

  normalizeUrl(url) {
    try {
      const urlObj = new URL(url)
      // Remove query parameters that might cause duplicates
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
      // Fallback for malformed URLs
      const separator = baseUrl.includes('?') ? '&' : '?'
      return `${baseUrl}${separator}page=${pageNumber}`
    }
  }

  async makeRequest(url) {
    const maxRetries = this.maxRetries

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🌐 Request attempt ${attempt}/${maxRetries}: ${url}`)

        const response = await this.httpClient.get(url)

        if (response.status !== 200) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        if (!response.data || response.data.length < 1000) {
          throw new Error('Response too short or empty')
        }

        return response
      } catch (error) {
        console.log(`❌ Request failed (attempt ${attempt}/${maxRetries}): ${error.message}`)

        if (attempt === maxRetries) {
          throw new Error(`FCA request failed after ${maxRetries} attempts: ${error.message}`)
        }

        // Exponential backoff
        const delay = 1000 * Math.pow(2, attempt - 1)
        await this.wait(delay)
      }
    }
  }

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // STATISTICS AND MONITORING

  resetStats() {
    this.stats = {
      totalAttempted: 0,
      successful: 0,
      failed: 0,
      duplicates: 0,
      processingTime: 0
    }
  }

  logStats() {
    const elapsed = this.stats.processingTime
    const minutes = Math.floor(elapsed / 60000)
    const seconds = Math.floor((elapsed % 60000) / 1000)

    console.log('\n' + '='.repeat(50))
    console.log('🏛️ FCA ADVANCED SCRAPING STATISTICS')
    console.log('='.repeat(50))
    console.log(`📊 Total Attempted: ${this.stats.totalAttempted}`)
    console.log(`✅ Successful: ${this.stats.successful}`)
    console.log(`❌ Failed: ${this.stats.failed}`)
    console.log(`🔄 Duplicates: ${this.stats.duplicates}`)
    console.log(`⏱️ Processing Time: ${minutes}m ${seconds}s`)
    console.log(`📈 Success Rate: ${((this.stats.successful / Math.max(this.stats.totalAttempted, 1)) * 100).toFixed(1)}%`)
    console.log('='.repeat(50) + '\n')
  }

  // HEALTH CHECK
  async healthCheck() {
    try {
      const testUrl = 'https://www.fca.org.uk/news'
      const response = await this.makeRequest(testUrl)

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        checks: {
          baseUrl: this.baseUrl,
          connectivity: response.status === 200,
          responseTime: response.headers['x-response-time'] || 'unknown'
        },
        stats: this.stats
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        stats: this.stats
      }
    }
  }
}

// Export singleton instance
module.exports = new FCAAdvancedScraper()
