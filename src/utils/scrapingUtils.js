// src/utils/scrapingUtils.js
// Common Scraping Utilities for Enhanced Data Collection
// Phase 2: Shared functions for rate limiting, retry logic, content extraction

const axios = require('axios')
const { URL } = require('url')

class ScrapingUtils {
  constructor() {
    // Global rate limiting state
    this.globalRateLimiters = new Map()
    this.activeRequests = new Set()
    this.requestQueue = []

    // Default configurations
    this.defaultConfig = {
      timeout: 30000,
      retries: 3,
      rateLimit: 2000,
      userAgent: 'Mozilla/5.0 (compatible; RegulatoryScanner/2.0)',
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate',
        'Cache-Control': 'no-cache',
        DNT: '1'
      }
    }

    // Content extraction patterns
    this.contentPatterns = {
      // Common content selectors used across regulatory sites
      mainContent: [
        'main',
        '.main-content',
        '.content-main',
        '.page-content',
        '.article-content',
        '.publication-content',
        '.news-content',
        '.content-wrapper',
        '#content',
        '.content'
      ],

      // Date extraction patterns
      datePatterns: [
        /(\d{1,2}[\s/.-]\d{1,2}[\s/.-]\d{2,4})/g,
        /(\d{4}[\s/.-]\d{1,2}[\s/.-]\d{1,2})/g,
        /(\d{1,2}(st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{2,4})/gi,
        /((January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(st|nd|rd|th)?,?\s+\d{2,4})/gi
      ],

      // Reference number patterns
      referencePatterns: [
        /[A-Z]{2,4}\d+\/\d+/g, // CP21/24, PS22/15, etc.
        /[A-Z]{2,4}[\s-]\d+[-/]\d+/g, // Alternative formats
        /\b\d{4}\/\d+\b/g, // Year/number format
        /REF[-\s]?\d+/gi, // REF numbers
        /NO[-\s]?\d+/gi // Notice numbers
      ],

      // Deadline extraction patterns
      deadlinePatterns: [
        /deadline[:\s]+(\d{1,2}[\s/.-]\d{1,2}[\s/.-]\d{2,4})/gi,
        /responses?\s+by[:\s]+(\d{1,2}[\s/.-]\d{1,2}[\s/.-]\d{2,4})/gi,
        /consultation\s+ends?[:\s]+(\d{1,2}[\s/.-]\d{1,2}[\s/.-]\d{2,4})/gi,
        /submissions?\s+due[:\s]+(\d{1,2}[\s/.-]\d{1,2}[\s/.-]\d{2,4})/gi,
        /closes?\s+on[:\s]+(\d{1,2}[\s/.-]\d{1,2}[\s/.-]\d{2,4})/gi
      ]
    }

    // Common validation rules
    this.validationRules = {
      minTitleLength: 10,
      minContentLength: 50,
      maxTitleLength: 500,
      requiredRegulatoryTerms: [
        'regulation', 'regulatory', 'compliance', 'guidance', 'policy',
        'financial', 'banking', 'insurance', 'investment', 'supervision',
        'enforcement', 'consultation', 'framework', 'directive'
      ],
      spamIndicators: [
        'click here', 'buy now', 'limited time', 'act now',
        'congratulations', 'winner', 'prize', 'lottery', 'free money'
      ]
    }
  }

  // HTTP REQUEST UTILITIES

  /**
     * Make a robust HTTP request with retry logic and rate limiting
     */
  async makeRobustRequest(url, options = {}) {
    const config = { ...this.defaultConfig, ...options }
    const domain = this.extractDomain(url)

    // Respect rate limiting
    await this.respectRateLimit(domain, config.rateLimit)

    const maxRetries = config.retries
    let lastError

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🌐 Request attempt ${attempt}/${maxRetries}: ${url}`)

        const response = await axios.get(url, {
          timeout: config.timeout,
          headers: {
            'User-Agent': config.userAgent,
            ...config.headers,
            ...(options.headers || {})
          },
          maxRedirects: 10,
          validateStatus: (status) => status < 400
        })

        // Validate response
        this.validateResponse(response)

        console.log(`✅ Request successful: ${url} (${response.data.length} bytes)`)
        return response
      } catch (error) {
        lastError = error
        console.log(`❌ Request failed (attempt ${attempt}/${maxRetries}): ${error.message}`)

        if (attempt < maxRetries) {
          // Exponential backoff with jitter
          const baseDelay = 1000 * Math.pow(2, attempt - 1)
          const jitter = Math.random() * 1000
          const delay = baseDelay + jitter

          console.log(`⏳ Retrying in ${Math.round(delay)}ms...`)
          await this.wait(delay)
        }
      }
    }

    throw new Error(`Request failed after ${maxRetries} attempts: ${lastError.message}`)
  }

  /**
     * Rate limiting implementation
     */
  async respectRateLimit(domain, rateLimit = 2000) {
    const now = Date.now()
    const lastRequest = this.globalRateLimiters.get(domain) || 0
    const timeSinceLastRequest = now - lastRequest

    if (timeSinceLastRequest < rateLimit) {
      const waitTime = rateLimit - timeSinceLastRequest
      console.log(`⏳ Rate limiting ${domain}: waiting ${waitTime}ms`)
      await this.wait(waitTime)
    }

    this.globalRateLimiters.set(domain, Date.now())
  }

  /**
     * Validate HTTP response
     */
  validateResponse(response) {
    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    if (!response.data) {
      throw new Error('Empty response data')
    }

    if (typeof response.data === 'string' && response.data.length < 100) {
      throw new Error('Response too short, likely invalid')
    }

    // Check for common error pages
    const errorIndicators = ['404', 'not found', 'error', 'forbidden', 'access denied']
    const bodyText = response.data.toString().toLowerCase()

    if (errorIndicators.some(indicator => bodyText.includes(indicator))) {
      console.log('⚠️ Response may contain error content')
    }
  }

  // CONTENT EXTRACTION UTILITIES

  /**
     * Extract text content using multiple selector strategies
     */
  extractTextContent(element, selectors, $) {
    if (typeof selectors === 'string') {
      selectors = [selectors]
    }

    for (const selector of selectors) {
      try {
        const targetElement = element.find ? element.find(selector) : $(selector, element)
        const text = targetElement.first().text()?.trim()

        if (text && text.length > 0) {
          return this.cleanText(text)
        }
      } catch (error) {
        // Continue to next selector
      }
    }

    return null
  }

  /**
     * Extract URL with robust handling of relative/absolute URLs
     */
  extractUrl(element, selector, baseUrl, $) {
    try {
      const targetElement = element.find ? element.find(selector) : $(selector, element)
      const href = targetElement.first().attr('href')

      if (!href) return null

      return this.normalizeUrl(href, baseUrl)
    } catch (error) {
      return null
    }
  }

  /**
     * Extract date with multiple format support
     */
  extractDate(element, selector, $, sourceType = 'generic') {
    try {
      const targetElement = element.find ? element.find(selector) : $(selector, element)
      const dateText = targetElement.first().text()?.trim()

      if (!dateText) return null

      return this.parseFlexibleDate(dateText, sourceType)
    } catch (error) {
      return null
    }
  }

  /**
     * Extract multiple values using fallback selectors
     */
  extractWithFallback(element, selectorConfig, $) {
    const result = {}

    for (const [key, selectors] of Object.entries(selectorConfig)) {
      const selectorArray = Array.isArray(selectors) ? selectors : [selectors]

      for (const selector of selectorArray) {
        try {
          const value = this.extractTextContent(element, selector, $)
          if (value) {
            result[key] = value
            break // Use first successful extraction
          }
        } catch (error) {
          // Continue to next selector
        }
      }
    }

    return result
  }

  // URL UTILITIES

  /**
     * Normalize URL handling relative/absolute paths
     */
  normalizeUrl(href, baseUrl) {
    try {
      if (!href) return null

      // Already absolute URL
      if (href.startsWith('http://') || href.startsWith('https://')) {
        return this.cleanUrl(href)
      }

      // Protocol-relative URL
      if (href.startsWith('//')) {
        return this.cleanUrl('https:' + href)
      }

      // Absolute path
      if (href.startsWith('/')) {
        const base = new URL(baseUrl)
        return this.cleanUrl(base.origin + href)
      }

      // Relative path
      const base = new URL(baseUrl)
      const fullUrl = new URL(href, base)
      return this.cleanUrl(fullUrl.toString())
    } catch (error) {
      console.warn(`Failed to normalize URL: ${href}`, error.message)
      return href
    }
  }

  /**
     * Clean URL by removing tracking parameters
     */
  cleanUrl(url) {
    try {
      const urlObj = new URL(url)

      // Remove common tracking parameters
      const trackingParams = [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
        'fbclid', 'gclid', 'ref', 'source', 'campaign', 'medium'
      ]

      trackingParams.forEach(param => urlObj.searchParams.delete(param))

      return urlObj.toString()
    } catch (error) {
      return url
    }
  }

  /**
     * Extract domain from URL
     */
  extractDomain(url) {
    try {
      return new URL(url).hostname
    } catch (error) {
      return 'unknown'
    }
  }

  // TEXT PROCESSING UTILITIES

  /**
     * Clean and normalize text content
     */
  cleanText(text) {
    return text
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .replace(/[\r\n\t]/g, ' ') // Line breaks and tabs to spaces
      .replace(/[""'']/g, '"') // Normalize quotes
      .replace(/[–—]/g, '-') // Normalize dashes
      .trim()
  }

  /**
     * Parse dates with flexible format support
     */
  parseFlexibleDate(dateText, sourceType = 'generic') {
    try {
      // Clean date text
      const cleanDate = dateText
        .replace(/published:?\s*/i, '')
        .replace(/date:?\s*/i, '')
        .replace(/deadline:?\s*/i, '')
        .trim()

      // Try standard JavaScript parsing first
      let date = new Date(cleanDate)
      if (!isNaN(date.getTime())) {
        return date.toISOString()
      }

      // Try specific patterns
      for (const pattern of this.contentPatterns.datePatterns) {
        const match = cleanDate.match(pattern)
        if (match) {
          date = new Date(match[0])
          if (!isNaN(date.getTime())) {
            return date.toISOString()
          }
        }
      }

      // Source-specific date parsing
      if (sourceType !== 'generic') {
        date = this.parseSourceSpecificDate(cleanDate, sourceType)
        if (date) {
          return date.toISOString()
        }
      }

      return null
    } catch (error) {
      return null
    }
  }

  /**
     * Parse source-specific date formats
     */
  parseSourceSpecificDate(dateText, sourceType) {
    const patterns = {
      uk: {
        // UK date formats: DD/MM/YYYY, DD Month YYYY
        ddmmyyyy: /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
        ddmmmyyyy: /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i
      },
      eu: {
        // EU date formats: DD.MM.YYYY, DD/MM/YYYY
        ddmmyyyy_dot: /(\d{1,2})\.(\d{1,2})\.(\d{4})/,
        ddmmyyyy_slash: /(\d{1,2})\/(\d{1,2})\/(\d{4})/
      },
      international: {
        // International formats: YYYY-MM-DD, MM/DD/YYYY
        iso: /(\d{4})-(\d{1,2})-(\d{1,2})/,
        mmddyyyy: /(\d{1,2})\/(\d{1,2})\/(\d{4})/
      }
    }

    const sourcePatterns = patterns[sourceType] || patterns.international

    for (const [, pattern] of Object.entries(sourcePatterns)) {
      const match = dateText.match(pattern)
      if (match) {
        try {
          if (sourceType === 'uk' && pattern === sourcePatterns.ddmmyyyy) {
            // DD/MM/YYYY format
            return new Date(match[3], match[2] - 1, match[1])
          } else if (pattern === sourcePatterns.iso) {
            // YYYY-MM-DD format
            return new Date(match[1], match[2] - 1, match[3])
          }
          // Fall back to standard parsing
          return new Date(match[0])
        } catch (error) {
          continue
        }
      }
    }

    return null
  }

  // CONTENT VALIDATION UTILITIES

  /**
     * Validate content against regulatory standards
     */
  validateRegulatoryContent(title, content, url) {
    const validation = {
      isValid: true,
      score: 100,
      issues: [],
      warnings: []
    }

    // Title validation
    if (!title || title.length < this.validationRules.minTitleLength) {
      validation.issues.push(`Title too short (${title?.length || 0} chars, min ${this.validationRules.minTitleLength})`)
      validation.score -= 30
    }

    if (title && title.length > this.validationRules.maxTitleLength) {
      validation.warnings.push(`Title very long (${title.length} chars)`)
      validation.score -= 5
    }

    // Content validation
    const fullText = (title + ' ' + content).toLowerCase()

    if (fullText.length < this.validationRules.minContentLength) {
      validation.issues.push(`Content too short (${fullText.length} chars, min ${this.validationRules.minContentLength})`)
      validation.score -= 20
    }

    // Regulatory relevance check
    const hasRegulatoryTerms = this.validationRules.requiredRegulatoryTerms.some(term =>
      fullText.includes(term)
    )

    if (!hasRegulatoryTerms) {
      validation.issues.push('No regulatory terms found')
      validation.score -= 40
    }

    // Spam detection
    const hasSpamIndicators = this.validationRules.spamIndicators.some(indicator =>
      fullText.includes(indicator)
    )

    if (hasSpamIndicators) {
      validation.issues.push('Contains spam indicators')
      validation.score -= 50
    }

    // URL validation
    if (!url) {
      validation.issues.push('Missing URL')
      validation.score -= 30
    } else {
      try {
        const parsedUrl = new URL(url)
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          validation.issues.push('Unsupported URL protocol')
          validation.score -= 20
        }
      } catch (error) {
        validation.issues.push('Invalid URL format')
        validation.score -= 20
      }
    }

    validation.isValid = validation.score >= 50 && validation.issues.length === 0
    return validation
  }

  // CONTENT EXTRACTION HELPERS

  /**
     * Extract reference numbers from text
     */
  extractReferenceNumbers(text) {
    const references = []

    for (const pattern of this.contentPatterns.referencePatterns) {
      const matches = text.match(pattern)
      if (matches) {
        references.push(...matches)
      }
    }

    return [...new Set(references)] // Remove duplicates
  }

  /**
     * Extract deadlines from text
     */
  extractDeadlines(text) {
    const deadlines = []

    for (const pattern of this.contentPatterns.deadlinePatterns) {
      const matches = text.match(pattern)
      if (matches) {
        for (const match of matches) {
          const dateMatch = match.match(/\d{1,2}[\s/.-]\d{1,2}[\s/.-]\d{2,4}/)
          if (dateMatch) {
            const date = this.parseFlexibleDate(dateMatch[0])
            if (date) {
              deadlines.push({
                date,
                originalText: match,
                context: this.extractDeadlineContext(match)
              })
            }
          }
        }
      }
    }

    return deadlines
  }

  /**
     * Extract context around deadline mentions
     */
  extractDeadlineContext(deadlineText) {
    const text = deadlineText.toLowerCase()

    if (text.includes('consultation')) return 'consultation'
    if (text.includes('response')) return 'response'
    if (text.includes('submission')) return 'submission'
    if (text.includes('implementation')) return 'implementation'
    if (text.includes('deadline')) return 'deadline'

    return 'general'
  }

  // UTILITY FUNCTIONS

  /**
     * Wait for specified milliseconds
     */
  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
     * Retry operation with exponential backoff
     */
  async retryOperation(operation, maxRetries = 3, baseDelay = 1000) {
    let lastError

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error

        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1)
          console.log(`⏳ Retrying operation in ${delay}ms (attempt ${attempt}/${maxRetries})`)
          await this.wait(delay)
        }
      }
    }

    throw new Error(`Operation failed after ${maxRetries} attempts: ${lastError.message}`)
  }

  /**
     * Get current statistics
     */
  getStats() {
    return {
      activeRequests: this.activeRequests.size,
      rateLimiters: this.globalRateLimiters.size,
      queuedRequests: this.requestQueue.length,
      timestamp: new Date().toISOString()
    }
  }

  /**
     * Reset all state
     */
  reset() {
    this.globalRateLimiters.clear()
    this.activeRequests.clear()
    this.requestQueue = []
  }

  /**
     * Health check for scraping utilities
     */
  async healthCheck() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      stats: this.getStats(),
      config: {
        defaultTimeout: this.defaultConfig.timeout,
        defaultRetries: this.defaultConfig.retries,
        defaultRateLimit: this.defaultConfig.rateLimit
      }
    }
  }
}

// Export singleton instance
module.exports = new ScrapingUtils()
