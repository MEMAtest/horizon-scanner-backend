// src/services/dataQualityService.js
// Data Quality Engine for Enhanced Regulatory Data Collection
// Phase 2: Deduplication, Validation, Error Recovery, Quality Assurance

const dbService = require('./dbService')
const { DATA_QUALITY_RULES, CONTENT_VALIDATION_RULES } = require('../sources/enhancedSources')

class DataQualityService {
  constructor() {
    this.qualityMetrics = {
      totalItems: 0,
      validItems: 0,
      duplicatesFound: 0,
      duplicatesRemoved: 0,
      errorsRecovered: 0,
      qualityScore: 0,
      validationFailures: 0,
      contentIssues: 0,
      processingTime: 0
    }

    this.seenUrls = new Set()
    this.seenTitles = new Map() // Title -> { url, similarity }
    this.duplicateStore = new Map()
    this.qualityRules = DATA_QUALITY_RULES
    this.validationRules = CONTENT_VALIDATION_RULES

    // Initialize similarity threshold
    this.similarityThreshold = this.qualityRules.deduplication.titleSimilarityThreshold
  }

  // MAIN QUALITY PROCESSING PIPELINE
  async processDataQuality(items) {
    console.log(`🔍 Starting data quality processing for ${items.length} items...`)

    const startTime = Date.now()
    this.resetMetrics()
    this.qualityMetrics.totalItems = items.length

    try {
      // Step 1: Content Validation
      console.log('📋 Step 1: Content validation...')
      const validatedItems = await this.validateContent(items)

      // Step 2: Deduplication
      console.log('🔄 Step 2: Deduplication processing...')
      const deduplicatedItems = await this.removeDuplicates(validatedItems)

      // Step 3: Data Enhancement
      console.log('⚡ Step 3: Data enhancement...')
      const enhancedItems = await this.enhanceDataQuality(deduplicatedItems)

      // Step 4: Final Validation
      console.log('✅ Step 4: Final quality check...')
      const finalItems = await this.finalQualityCheck(enhancedItems)

      // Calculate metrics
      this.qualityMetrics.validItems = finalItems.length
      this.qualityMetrics.processingTime = Date.now() - startTime
      this.calculateQualityScore()

      this.logQualityReport()

      console.log(`✅ Data quality processing complete: ${finalItems.length}/${items.length} items passed quality checks`)
      return finalItems
    } catch (error) {
      console.error('❌ Data quality processing failed:', error)
      throw error
    }
  }

  // CONTENT VALIDATION
  async validateContent(items) {
    console.log(`📋 Validating content for ${items.length} items...`)

    const validatedItems = []
    const validationFailures = []

    for (const item of items) {
      try {
        const validation = this.validateItem(item)

        if (validation.isValid) {
          // Add validation metadata
          item.dataQuality = {
            validated: true,
            validationScore: validation.score,
            validationDate: new Date().toISOString(),
            issues: validation.issues
          }
          validatedItems.push(item)
        } else {
          validationFailures.push({
            item,
            issues: validation.issues,
            score: validation.score
          })
          this.qualityMetrics.validationFailures++
        }
      } catch (error) {
        console.error(`❌ Validation error for item: ${error.message}`)
        this.qualityMetrics.validationFailures++
      }
    }

    console.log(`📋 Content validation: ${validatedItems.length} valid, ${validationFailures.length} failed`)

    // Log validation failures for debugging
    if (validationFailures.length > 0) {
      console.log('⚠️ Validation failures:')
      validationFailures.slice(0, 5).forEach((failure, i) => {
        console.log(`   ${i + 1}. ${failure.item.headline?.substring(0, 50)}... - Issues: ${failure.issues.join(', ')}`)
      })
    }

    return validatedItems
  }

  // VALIDATE INDIVIDUAL ITEM
  validateItem(item) {
    const validation = {
      isValid: true,
      score: 100,
      issues: []
    }

    // Required field validation
    if (!item.headline || item.headline.trim().length < this.validationRules.minimumLength.title) {
      validation.issues.push('Missing or short headline')
      validation.score -= 30
    }

    if (!item.url) {
      validation.issues.push('Missing URL')
      validation.score -= 40
    } else {
      try {
        const parsedUrl = new URL(item.url)
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          validation.issues.push('Unsupported URL protocol')
          validation.score -= 20
        }
      } catch (error) {
        validation.issues.push('Invalid URL format')
        validation.score -= 20
      }
    }

    if (!item.authority) {
      validation.issues.push('Missing authority')
      validation.score -= 20
    }

    // Content quality validation
    const contentText = this.extractContentText(item)

    if (contentText.length < this.validationRules.minimumLength.content) {
      validation.issues.push('Insufficient content')
      validation.score -= 15
    }

    // Check for spam indicators
    const hasSpam = this.validationRules.spamIndicators.some(indicator =>
      contentText.toLowerCase().includes(indicator)
    )

    if (hasSpam) {
      validation.issues.push('Contains spam indicators')
      validation.score -= 50
    }

    // Check for regulatory relevance
    const hasRegulatoryContent = this.validationRules.requiredKeywords.some(keyword =>
      contentText.toLowerCase().includes(keyword)
    )

    if (!hasRegulatoryContent && contentText.length > 100) {
      validation.issues.push('Low regulatory relevance')
      validation.score -= 25
    }

    // Check exclude patterns
    const hasExcludePattern = this.validationRules.excludePatterns.some(pattern =>
      pattern.test(contentText)
    )

    if (hasExcludePattern) {
      validation.issues.push('Matches exclude pattern')
      validation.score -= 40
    }

    // Date validation
    if (item.fetched_date) {
      const fetchDate = new Date(item.fetched_date)
      if (isNaN(fetchDate.getTime())) {
        validation.issues.push('Invalid fetch date')
        validation.score -= 10
      }
    }

    // Final validation decision
    validation.isValid = validation.score >= 50 && validation.issues.length === 0

    return validation
  }

  // DEDUPLICATION ENGINE
  async removeDuplicates(items) {
    console.log(`🔄 Starting deduplication for ${items.length} items...`)

    const uniqueItems = []
    const duplicates = []

    // Clear previous state
    this.seenUrls.clear()
    this.seenTitles.clear()
    this.duplicateStore.clear()

    for (const item of items) {
      try {
        const isDuplicate = await this.checkForDuplicate(item)

        if (isDuplicate.isDuplicate) {
          duplicates.push({
            item,
            reason: isDuplicate.reason,
            similarTo: isDuplicate.similarTo
          })
          this.qualityMetrics.duplicatesFound++
        } else {
          uniqueItems.push(item)
          this.trackUniqueItem(item)
        }
      } catch (error) {
        console.error(`❌ Duplicate check error: ${error.message}`)
        // Include item if duplicate check fails
        uniqueItems.push(item)
      }
    }

    this.qualityMetrics.duplicatesRemoved = duplicates.length

    console.log(`🔄 Deduplication complete: ${uniqueItems.length} unique, ${duplicates.length} duplicates removed`)

    // Log sample duplicates for debugging
    if (duplicates.length > 0) {
      console.log('🔄 Sample duplicates found:')
      duplicates.slice(0, 3).forEach((dup, i) => {
        console.log(`   ${i + 1}. ${dup.item.headline?.substring(0, 50)}... (${dup.reason})`)
      })
    }

    return uniqueItems
  }

  // CHECK FOR DUPLICATE
  async checkForDuplicate(item) {
    // 1. Exact URL match
    if (this.seenUrls.has(item.url)) {
      return {
        isDuplicate: true,
        reason: 'Exact URL match',
        similarTo: item.url
      }
    }

    // 2. Database URL check
    try {
      const existingItem = await dbService.getUpdateByUrl(item.url)
      if (existingItem) {
        return {
          isDuplicate: true,
          reason: 'URL exists in database',
          similarTo: existingItem.url
        }
      }
    } catch (error) {
      // Continue if database check fails
    }

    // 3. Title similarity check
    if (item.headline) {
      const similarTitle = this.findSimilarTitle(item.headline)
      if (similarTitle) {
        return {
          isDuplicate: true,
          reason: `Similar title (${similarTitle.similarity}% match)`,
          similarTo: similarTitle.url
        }
      }
    }

    // 4. Content similarity check (for items with substantial content)
    const contentText = this.extractContentText(item)
    if (contentText.length > 200) {
      const similarContent = this.findSimilarContent(contentText)
      if (similarContent) {
        return {
          isDuplicate: true,
          reason: `Similar content (${similarContent.similarity}% match)`,
          similarTo: similarContent.url
        }
      }
    }

    return { isDuplicate: false }
  }

  // TRACK UNIQUE ITEM
  trackUniqueItem(item) {
    this.seenUrls.add(item.url)

    if (item.headline) {
      this.seenTitles.set(item.headline.toLowerCase(), {
        url: item.url,
        normalizedTitle: this.normalizeTitle(item.headline)
      })
    }

    const contentText = this.extractContentText(item)
    if (contentText.length > 200) {
      this.duplicateStore.set(item.url, {
        contentHash: this.hashContent(contentText),
        normalizedContent: this.normalizeContent(contentText)
      })
    }
  }

  // FIND SIMILAR TITLE
  findSimilarTitle(title) {
    const normalizedTitle = this.normalizeTitle(title)

    for (const [, data] of this.seenTitles) {
      const similarity = this.calculateSimilarity(normalizedTitle, data.normalizedTitle)

      if (similarity >= this.similarityThreshold) {
        return {
          similarity: Math.round(similarity * 100),
          url: data.url
        }
      }
    }

    return null
  }

  // FIND SIMILAR CONTENT
  findSimilarContent(content) {
    const normalizedContent = this.normalizeContent(content)
    const contentHash = this.hashContent(content)

    for (const [url, data] of this.duplicateStore) {
      // Quick hash check first
      if (data.contentHash === contentHash) {
        return {
          similarity: 100,
          url
        }
      }

      // Detailed similarity check
      const similarity = this.calculateSimilarity(normalizedContent, data.normalizedContent)

      if (similarity >= this.qualityRules.deduplication.contentSimilarityThreshold) {
        return {
          similarity: Math.round(similarity * 100),
          url
        }
      }
    }

    return null
  }

  // DATA ENHANCEMENT
  async enhanceDataQuality(items) {
    console.log(`⚡ Enhancing data quality for ${items.length} items...`)

    const enhancedItems = []

    for (const item of items) {
      try {
        const enhancedItem = await this.enhanceItem(item)
        enhancedItems.push(enhancedItem)
      } catch (error) {
        console.error(`❌ Enhancement error: ${error.message}`)
        // Include original item if enhancement fails
        enhancedItems.push(item)
      }
    }

    console.log(`⚡ Data enhancement complete: ${enhancedItems.length} items enhanced`)
    return enhancedItems
  }

  // ENHANCE INDIVIDUAL ITEM
  async enhanceItem(item) {
    // Add quality metadata
    if (!item.dataQuality) {
      item.dataQuality = {}
    }

    // Add quality scores
    item.dataQuality.qualityScore = this.calculateItemQuality(item)
    item.dataQuality.completenessScore = this.calculateCompleteness(item)
    item.dataQuality.reliabilityScore = this.calculateReliability(item)

    // Add content analysis
    item.dataQuality.contentAnalysis = {
      hasValidDate: this.hasValidDate(item),
      hasRichContent: this.hasRichContent(item),
      hasMetadata: this.hasMetadata(item),
      contentLength: this.extractContentText(item).length
    }

    // Add source trust score
    item.dataQuality.sourceTrustScore = this.calculateSourceTrust(item)

    // Add processing metadata
    item.dataQuality.processedDate = new Date().toISOString()
    item.dataQuality.qualityVersion = '2.0'

    return item
  }

  // FINAL QUALITY CHECK
  async finalQualityCheck(items) {
    console.log(`✅ Final quality check for ${items.length} items...`)

    const qualityItems = []

    for (const item of items) {
      const qualityScore = item.dataQuality?.qualityScore || 0

      if (qualityScore >= 60) { // Minimum quality threshold
        qualityItems.push(item)
      } else {
        console.log(`⚠️ Item failed final quality check: ${item.headline?.substring(0, 50)}... (Score: ${qualityScore})`)
        this.qualityMetrics.contentIssues++
      }
    }

    console.log(`✅ Final quality check complete: ${qualityItems.length} items passed`)
    return qualityItems
  }

  // UTILITY FUNCTIONS

  extractContentText(item) {
    const parts = []

    if (item.headline) parts.push(item.headline)
    if (item.impact) parts.push(item.impact)
    if (item.raw_data?.summary) parts.push(item.raw_data.summary)
    if (item.raw_data?.content) parts.push(item.raw_data.content)

    return parts.join(' ').trim()
  }

  normalizeTitle(title) {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  normalizeContent(content) {
    return content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 1000) // Limit for performance
  }

  hashContent(content) {
    // Simple hash function for quick comparison
    let hash = 0
    const normalized = this.normalizeContent(content)

    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }

    return hash.toString()
  }

  calculateSimilarity(str1, str2) {
    // Jaccard similarity for title/content comparison
    const set1 = new Set(str1.split(' '))
    const set2 = new Set(str2.split(' '))

    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])

    return intersection.size / union.size
  }

  calculateItemQuality(item) {
    let score = 100

    // Required fields
    if (!item.headline) score -= 30
    if (!item.url) score -= 30
    if (!item.authority) score -= 20

    // Content richness
    const contentText = this.extractContentText(item)
    if (contentText.length < 100) score -= 20
    else if (contentText.length > 500) score += 10

    // Metadata presence
    if (item.raw_data) score += 5
    if (item.fetched_date) score += 5
    if (item.source_category) score += 5

    return Math.max(0, Math.min(100, score))
  }

  calculateCompleteness(item) {
    const requiredFields = ['headline', 'url', 'authority', 'fetched_date']
    const optionalFields = ['impact', 'area', 'sector', 'key_dates', 'raw_data']

    const requiredScore = requiredFields.filter(field => item[field]).length / requiredFields.length * 70
    const optionalScore = optionalFields.filter(field => item[field]).length / optionalFields.length * 30

    return Math.round(requiredScore + optionalScore)
  }

  calculateReliability(item) {
    let score = 50 // Base score

    // Source reliability
    if (item.authority && ['FCA', 'BoE', 'PRA'].includes(item.authority)) {
      score += 30
    } else if (item.authority) {
      score += 20
    }

    // Content validation
    if (item.dataQuality?.validated) {
      score += 20
    }

    // Recent content
    if (item.fetched_date) {
      const daysSinceFetch = (Date.now() - new Date(item.fetched_date)) / (1000 * 60 * 60 * 24)
      if (daysSinceFetch <= 7) score += 10
    }

    return Math.max(0, Math.min(100, score))
  }

  calculateSourceTrust(item) {
    const authorityTrustScores = {
      FCA: 95,
      BoE: 95,
      PRA: 95,
      FATF: 85,
      ECB: 85,
      EBA: 80,
      ESMA: 80,
      BCBS: 90
    }

    return authorityTrustScores[item.authority] || 50
  }

  hasValidDate(item) {
    if (!item.fetched_date) return false
    const date = new Date(item.fetched_date)
    return !isNaN(date.getTime())
  }

  hasRichContent(item) {
    const contentText = this.extractContentText(item)
    return contentText.length > 200
  }

  hasMetadata(item) {
    return !!(item.raw_data && Object.keys(item.raw_data).length > 0)
  }

  // METRICS AND REPORTING

  calculateQualityScore() {
    if (this.qualityMetrics.totalItems === 0) {
      this.qualityMetrics.qualityScore = 0
      return
    }

    const validRate = this.qualityMetrics.validItems / this.qualityMetrics.totalItems
    const duplicateRate = 1 - (this.qualityMetrics.duplicatesFound / this.qualityMetrics.totalItems)
    const errorRate = 1 - (this.qualityMetrics.validationFailures / this.qualityMetrics.totalItems)

    this.qualityMetrics.qualityScore = Math.round((validRate * 0.5 + duplicateRate * 0.3 + errorRate * 0.2) * 100)
  }

  resetMetrics() {
    this.qualityMetrics = {
      totalItems: 0,
      validItems: 0,
      duplicatesFound: 0,
      duplicatesRemoved: 0,
      errorsRecovered: 0,
      qualityScore: 0,
      validationFailures: 0,
      contentIssues: 0,
      processingTime: 0
    }
  }

  getQualityMetrics() {
    return { ...this.qualityMetrics }
  }

  logQualityReport() {
    const metrics = this.qualityMetrics
    const processingTimeMs = metrics.processingTime
    const processingTimeSec = Math.round(processingTimeMs / 1000)

    console.log('\n' + '='.repeat(60))
    console.log('🔍 DATA QUALITY REPORT')
    console.log('='.repeat(60))
    console.log(`📊 Overall Quality Score: ${metrics.qualityScore}/100`)
    console.log(`📋 Total Items Processed: ${metrics.totalItems}`)
    console.log(`✅ Valid Items: ${metrics.validItems}`)
    console.log(`🔄 Duplicates Found: ${metrics.duplicatesFound}`)
    console.log(`🗑️ Duplicates Removed: ${metrics.duplicatesRemoved}`)
    console.log(`❌ Validation Failures: ${metrics.validationFailures}`)
    console.log(`⚠️ Content Issues: ${metrics.contentIssues}`)
    console.log(`⏱️ Processing Time: ${processingTimeSec}s`)
    console.log(`📈 Success Rate: ${((metrics.validItems / metrics.totalItems) * 100).toFixed(1)}%`)
    console.log('='.repeat(60) + '\n')
  }

  // HEALTH CHECK
  async healthCheck() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      metrics: this.getQualityMetrics(),
      thresholds: {
        similarityThreshold: this.similarityThreshold,
        minimumQualityScore: 60
      },
      cacheStatus: {
        seenUrls: this.seenUrls.size,
        seenTitles: this.seenTitles.size,
        duplicateStore: this.duplicateStore.size
      }
    }
  }
}

// Export singleton instance
module.exports = new DataQualityService()
