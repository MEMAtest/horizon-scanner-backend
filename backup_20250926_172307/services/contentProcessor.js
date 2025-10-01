// src/services/contentProcessor.js
// Content Processing Service for Enhanced Data Enrichment
// Phase 2: Content Analysis, Deadline Extraction, Document Classification

const { getSourceConfig } = require('../sources/enhancedSources')

class ContentProcessor {
  constructor() {
    this.processingStats = {
      totalProcessed: 0,
      deadlinesExtracted: 0,
      documentTypesIdentified: 0,
      sectorsClassified: 0,
      metadataEnriched: 0,
      errors: 0
    }

    // Common date patterns for deadline extraction
    this.datePatterns = [
      // Standard formats
      /(\d{1,2}[\s\/\-\.]\d{1,2}[\s\/\-\.]\d{2,4})/g,
      /(\d{1,2}(st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{2,4})/gi,
      /((January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(st|nd|rd|th)?,?\s+\d{2,4})/gi,

      // Relative dates
      /(in\s+\d+\s+days?)/gi,
      /(within\s+\d+\s+(days?|weeks?|months?))/gi,
      /(by\s+the\s+end\s+of\s+(January|February|March|April|May|June|July|August|September|October|November|December))/gi,

      // Specific deadline contexts
      /(deadline[:\s]+\d{1,2}[\s\/\-\.]\d{1,2}[\s\/\-\.]\d{2,4})/gi,
      /(responses?\s+by[:\s]+\d{1,2}[\s\/\-\.]\d{1,2}[\s\/\-\.]\d{2,4})/gi,
      /(consultation\s+ends?[:\s]+\d{1,2}[\s\/\-\.]\d{1,2}[\s\/\-\.]\d{2,4})/gi,
      /(submissions?\s+due[:\s]+\d{1,2}[\s\/\-\.]\d{1,2}[\s\/\-\.]\d{2,4})/gi
    ]

    // Document type patterns
    this.documentTypePatterns = {
      'Consultation Paper': [
        /CP\d+\/\d+/i,
        /consultation\s+paper/i,
        /consultation\s+document/i,
        /call\s+for\s+evidence/i
      ],
      'Policy Statement': [
        /PS\d+\/\d+/i,
        /policy\s+statement/i,
        /final\s+rules?/i,
        /regulatory\s+statement/i
      ],
      Guidance: [
        /FG\d+\/\d+/i,
        /guidance/i,
        /supervisory\s+guidance/i,
        /regulatory\s+guidance/i,
        /handbook\s+guidance/i
      ],
      'Supervisory Statement': [
        /SS\d+\/\d+/i,
        /supervisory\s+statement/i,
        /supervisory\s+expectation/i
      ],
      'Technical Standard': [
        /technical\s+standard/i,
        /regulatory\s+technical\s+standard/i,
        /implementing\s+technical\s+standard/i,
        /RTS/i,
        /ITS/i
      ],
      'Discussion Paper': [
        /DP\d+\/\d+/i,
        /discussion\s+paper/i,
        /research\s+paper/i
      ],
      'Market Study': [
        /market\s+study/i,
        /market\s+investigation/i,
        /sector\s+review/i
      ],
      'Enforcement Notice': [
        /enforcement\s+notice/i,
        /penalty\s+notice/i,
        /final\s+notice/i,
        /warning\s+notice/i,
        /decision\s+notice/i
      ],
      Speech: [
        /speech/i,
        /remarks\s+by/i,
        /keynote/i,
        /address\s+by/i
      ],
      Report: [
        /report/i,
        /annual\s+report/i,
        /review/i,
        /assessment/i,
        /survey/i
      ],
      'Press Release': [
        /press\s+release/i,
        /news\s+release/i,
        /announcement/i
      ],
      Directive: [
        /directive/i,
        /regulation\s+\(eu\)/i,
        /commission\s+directive/i
      ],
      Opinion: [
        /opinion/i,
        /recommendation/i,
        /advice/i
      ],
      Standard: [
        /standard/i,
        /code\s+of\s+practice/i,
        /framework/i
      ]
    }

    // Sector classification keywords
    this.sectorKeywords = {
      Banking: [
        'bank', 'banking', 'credit institution', 'deposit', 'lending', 'mortgage',
        'current account', 'savings', 'overdraft', 'loan', 'capital requirements',
        'prudential', 'basel', 'crd', 'crr', 'leverage ratio', 'liquidity'
      ],
      'Investment Management': [
        'investment', 'fund management', 'asset management', 'portfolio', 'ucits',
        'aif', 'alternative investment', 'hedge fund', 'private equity', 'mifid',
        'investment firm', 'discretionary', 'advisory', 'wealth management'
      ],
      Insurance: [
        'insurance', 'insurer', 'underwriting', 'actuarial', 'solvency',
        'life insurance', 'general insurance', 'reinsurance', 'lloyd\'s',
        'with-profits', 'annuity', 'protection', 'solvency ii'
      ],
      'Consumer Credit': [
        'consumer credit', 'payday', 'high-cost', 'credit card', 'personal loan',
        'hire purchase', 'rent-to-own', 'debt management', 'credit repair',
        'affordability', 'vulnerable customer', 'debt advice'
      ],
      Payments: [
        'payment', 'e-money', 'payment institution', 'payment service',
        'money transmission', 'remittance', 'payment account', 'psd2',
        'open banking', 'strong customer authentication', 'api'
      ],
      'Capital Markets': [
        'market', 'trading', 'securities', 'listing', 'prospectus', 'market abuse',
        'benchmark', 'clearing', 'settlement', 'market infrastructure',
        'transparency', 'best execution', 'algorithmic trading'
      ],
      Pensions: [
        'pension', 'retirement', 'occupational pension', 'personal pension',
        'auto-enrolment', 'defined benefit', 'defined contribution', 'sipp',
        'trustee', 'scheme', 'pension liberation'
      ],
      Fintech: [
        'fintech', 'financial technology', 'cryptocurrency', 'digital asset',
        'blockchain', 'distributed ledger', 'bitcoin', 'ethereum',
        'stablecoin', 'crypto', 'digital currency', 'innovation'
      ],
      'AML/CFT': [
        'money laundering', 'terrorist financing', 'aml', 'ctf', 'sanctions',
        'peps', 'customer due diligence', 'suspicious activity', 'reporting',
        'compliance monitoring', 'financial crime', 'proceeds of crime'
      ],
      'Data Protection': [
        'data protection', 'gdpr', 'privacy', 'personal data', 'data subject',
        'data controller', 'data processor', 'consent', 'data breach'
      ],
      'Market Conduct': [
        'conduct', 'treating customers fairly', 'fair dealing', 'mis-selling',
        'product governance', 'distribution', 'retail', 'consumer protection'
      ]
    }

    // Impact level keywords
    this.impactLevelKeywords = {
      HIGH: [
        'immediate', 'urgent', 'must', 'required', 'mandatory', 'enforcement',
        'penalty', 'fine', 'breach', 'violation', 'suspension', 'prohibition'
      ],
      MEDIUM: [
        'should', 'expect', 'guidance', 'recommendation', 'best practice',
        'framework', 'standard', 'consultation', 'proposal'
      ],
      LOW: [
        'may', 'consider', 'discussion', 'research', 'speech', 'opinion',
        'update', 'clarification', 'information'
      ]
    }
  }

  // MAIN CONTENT PROCESSING FUNCTION
  async processContent(item) {
    console.log(`🔄 Processing content: ${item.headline?.substring(0, 60)}...`)

    try {
      this.processingStats.totalProcessed++

      // Get source configuration for enrichment rules
      const sourceConfig = getSourceConfig(item.authority)

      // Extract content for analysis
      const contentText = this.extractAllText(item)

      // Create enhanced item with enrichments
      const enhancedItem = {
        ...item,
        enrichment: {
          deadlines: await this.extractDeadlines(contentText, sourceConfig),
          documentType: this.classifyDocumentType(contentText),
          sectors: this.classifySectors(contentText),
          impactLevel: this.assessImpactLevel(contentText),
          metadata: this.extractMetadata(contentText, item),
          keyPhrases: this.extractKeyPhrases(contentText),
          urgencyIndicators: this.detectUrgencyIndicators(contentText),
          complianceActions: this.identifyComplianceActions(contentText)
        },
        processed_date: new Date().toISOString()
      }

      // Update statistics
      if (enhancedItem.enrichment.deadlines.length > 0) {
        this.processingStats.deadlinesExtracted++
      }
      if (enhancedItem.enrichment.documentType) {
        this.processingStats.documentTypesIdentified++
      }
      if (enhancedItem.enrichment.sectors.length > 0) {
        this.processingStats.sectorsClassified++
      }

      this.processingStats.metadataEnriched++

      console.log(`✅ Content processed: ${enhancedItem.enrichment.documentType || 'Unknown'} type, ${enhancedItem.enrichment.sectors.length} sectors`)

      return enhancedItem
    } catch (error) {
      console.error(`❌ Content processing failed: ${error.message}`)
      this.processingStats.errors++
      return item // Return original item if processing fails
    }
  }

  // EXTRACT ALL AVAILABLE TEXT FOR ANALYSIS
  extractAllText(item) {
    const textParts = []

    if (item.headline) textParts.push(item.headline)
    if (item.raw_data?.summary) textParts.push(item.raw_data.summary)
    if (item.raw_data?.content) textParts.push(item.raw_data.content)
    if (item.impact) textParts.push(item.impact)

    return textParts.join(' ').toLowerCase()
  }

  // DEADLINE EXTRACTION
  async extractDeadlines(text, sourceConfig) {
    const deadlines = []

    console.log('📅 Extracting deadlines from text...')

    try {
      // Use source-specific patterns if available
      const patterns = sourceConfig?.enrichment?.deadlineExtraction?.patterns || this.datePatterns

      for (const pattern of patterns) {
        const matches = text.match(pattern)
        if (matches) {
          for (const match of matches) {
            const deadline = this.parseDeadline(match)
            if (deadline) {
              deadlines.push(deadline)
            }
          }
        }
      }

      // Remove duplicates and sort by date
      const uniqueDeadlines = deadlines
        .filter((deadline, index, self) =>
          index === self.findIndex(d => d.date === deadline.date)
        )
        .sort((a, b) => new Date(a.date) - new Date(b.date))

      console.log(`📅 Found ${uniqueDeadlines.length} deadlines`)
      return uniqueDeadlines
    } catch (error) {
      console.error('Error extracting deadlines:', error.message)
      return []
    }
  }

  // PARSE INDIVIDUAL DEADLINE
  parseDeadline(matchText) {
    try {
      // Clean up the match text
      const cleanText = matchText.replace(/deadline[:\s]*/gi, '').trim()

      // Try to parse the date
      const date = new Date(cleanText)

      if (isNaN(date.getTime())) {
        return null
      }

      // Determine deadline type based on context
      let type = 'General'
      if (matchText.toLowerCase().includes('consultation')) type = 'Consultation'
      else if (matchText.toLowerCase().includes('response')) type = 'Response'
      else if (matchText.toLowerCase().includes('submission')) type = 'Submission'
      else if (matchText.toLowerCase().includes('implementation')) type = 'Implementation'

      return {
        date: date.toISOString(),
        type,
        originalText: matchText,
        daysFromNow: Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24))
      }
    } catch (error) {
      return null
    }
  }

  // DOCUMENT TYPE CLASSIFICATION
  classifyDocumentType(text) {
    console.log('📄 Classifying document type...')

    const scores = {}

    for (const [docType, patterns] of Object.entries(this.documentTypePatterns)) {
      scores[docType] = 0

      for (const pattern of patterns) {
        const matches = text.match(pattern)
        if (matches) {
          scores[docType] += matches.length
        }
      }
    }

    // Find the highest scoring document type
    const bestMatch = Object.entries(scores)
      .filter(([, score]) => score > 0)
      .sort(([, a], [, b]) => b - a)[0]

    const documentType = bestMatch ? bestMatch[0] : null
    console.log(`📄 Document type: ${documentType || 'Unknown'}`)

    return documentType
  }

  // SECTOR CLASSIFICATION
  classifySectors(text) {
    console.log('🏷️ Classifying sectors...')

    const sectorScores = {}

    for (const [sector, keywords] of Object.entries(this.sectorKeywords)) {
      sectorScores[sector] = 0

      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
        const matches = text.match(regex)
        if (matches) {
          sectorScores[sector] += matches.length
        }
      }
    }

    // Return sectors with scores above threshold
    const relevantSectors = Object.entries(sectorScores)
      .filter(([, score]) => score > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([sector, score]) => ({
        sector,
        relevance: Math.min(100, score * 10), // Convert to percentage
        keywordMatches: score
      }))

    console.log(`🏷️ Found ${relevantSectors.length} relevant sectors`)
    return relevantSectors
  }

  // IMPACT LEVEL ASSESSMENT
  assessImpactLevel(text) {
    console.log('⚡ Assessing impact level...')

    const levelScores = {}

    for (const [level, keywords] of Object.entries(this.impactLevelKeywords)) {
      levelScores[level] = 0

      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
        const matches = text.match(regex)
        if (matches) {
          levelScores[level] += matches.length
        }
      }
    }

    // Determine the highest scoring impact level
    const bestLevel = Object.entries(levelScores)
      .filter(([, score]) => score > 0)
      .sort(([, a], [, b]) => b - a)[0]

    const impactLevel = bestLevel ? bestLevel[0] : 'MEDIUM' // Default to MEDIUM
    console.log(`⚡ Impact level: ${impactLevel}`)

    return {
      level: impactLevel,
      confidence: bestLevel ? Math.min(100, bestLevel[1] * 20) : 0,
      indicators: levelScores
    }
  }

  // METADATA EXTRACTION
  extractMetadata(text, item) {
    console.log('📊 Extracting metadata...')

    const metadata = {
      wordCount: text.split(/\s+/).length,
      hasDeadline: /deadline|due|expires?|ends?/i.test(text),
      hasConsultation: /consultation|comment|feedback|response/i.test(text),
      hasEnforcement: /enforcement|penalty|fine|breach|violation/i.test(text),
      hasGuidance: /guidance|advice|recommendation|best practice/i.test(text),

      // Extract reference numbers
      referenceNumbers: this.extractReferenceNumbers(text),

      // Extract monetary amounts
      monetaryAmounts: this.extractMonetaryAmounts(text),

      // Extract percentages
      percentages: this.extractPercentages(text),

      // Source metadata
      sourceMetadata: {
        authority: item.authority,
        sourceCategory: item.source_category,
        fetchedDate: item.fetched_date,
        originalUrl: item.url
      }
    }

    console.log(`📊 Metadata extracted: ${Object.keys(metadata).length} fields`)
    return metadata
  }

  // EXTRACT REFERENCE NUMBERS
  extractReferenceNumbers(text) {
    const patterns = [
      /[A-Z]{2,4}\d+\/\d+/g, // CP21/24, PS22/15, etc.
      /[A-Z]{2,4}[-\s]\d+[-\/]\d+/g, // Alternative formats
      /\b\d{4}\/\d+\b/g // Year/number format
    ]

    const references = []
    for (const pattern of patterns) {
      const matches = text.match(pattern)
      if (matches) {
        references.push(...matches)
      }
    }

    return [...new Set(references)] // Remove duplicates
  }

  // EXTRACT MONETARY AMOUNTS
  extractMonetaryAmounts(text) {
    const patterns = [
      /£[\d,]+(?:\.\d{2})?(?:\s?(?:million|billion|trillion|k|m|bn))?/gi,
      /\$[\d,]+(?:\.\d{2})?(?:\s?(?:million|billion|trillion|k|m|bn))?/gi,
      /€[\d,]+(?:\.\d{2})?(?:\s?(?:million|billion|trillion|k|m|bn))?/gi
    ]

    const amounts = []
    for (const pattern of patterns) {
      const matches = text.match(pattern)
      if (matches) {
        amounts.push(...matches)
      }
    }

    return [...new Set(amounts)]
  }

  // EXTRACT PERCENTAGES
  extractPercentages(text) {
    const pattern = /\d+(?:\.\d+)?%/g
    const matches = text.match(pattern)
    return matches ? [...new Set(matches)] : []
  }

  // EXTRACT KEY PHRASES
  extractKeyPhrases(text) {
    console.log('🔍 Extracting key phrases...')

    const phrases = []

    // Common regulatory phrases
    const regulatoryPhrases = [
      'regulatory framework', 'compliance requirement', 'supervisory expectation',
      'prudential regulation', 'conduct risk', 'operational resilience',
      'consumer protection', 'market integrity', 'financial stability',
      'capital requirement', 'liquidity requirement', 'stress testing',
      'risk management', 'governance arrangement', 'internal control',
      'due diligence', 'know your customer', 'anti-money laundering'
    ]

    for (const phrase of regulatoryPhrases) {
      if (text.includes(phrase.toLowerCase())) {
        phrases.push(phrase)
      }
    }

    console.log(`🔍 Found ${phrases.length} key phrases`)
    return phrases
  }

  // DETECT URGENCY INDICATORS
  detectUrgencyIndicators(text) {
    const urgencyKeywords = [
      'immediate', 'urgent', 'asap', 'priority', 'critical', 'emergency',
      'deadline', 'expires', 'due', 'must', 'required', 'mandatory'
    ]

    const indicators = []

    for (const keyword of urgencyKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
      if (regex.test(text)) {
        indicators.push(keyword)
      }
    }

    return indicators
  }

  // IDENTIFY COMPLIANCE ACTIONS
  identifyComplianceActions(text) {
    const actionPatterns = [
      /must\s+([^.]+)/gi,
      /should\s+([^.]+)/gi,
      /required\s+to\s+([^.]+)/gi,
      /need\s+to\s+([^.]+)/gi,
      /have\s+to\s+([^.]+)/gi
    ]

    const actions = []

    for (const pattern of actionPatterns) {
      const matches = text.match(pattern)
      if (matches) {
        actions.push(...matches.map(match => match.trim()))
      }
    }

    return actions.slice(0, 5) // Limit to top 5 actions
  }

  // BATCH PROCESSING
  async processBatch(items, batchSize = 10) {
    console.log(`🔄 Processing batch of ${items.length} items (batch size: ${batchSize})`)

    const results = []
    const batches = []

    // Split into batches
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize))
    }

    // Process each batch
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      console.log(`📦 Processing batch ${i + 1}/${batches.length} (${batch.length} items)`)

      const batchPromises = batch.map(item => this.processContent(item))
      const batchResults = await Promise.allSettled(batchPromises)

      // Handle results and errors
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          console.error(`❌ Batch item failed: ${result.reason.message}`)
          this.processingStats.errors++
        }
      }

      // Brief pause between batches
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    console.log(`✅ Batch processing complete: ${results.length} items processed`)
    return results
  }

  // STATISTICS AND REPORTING
  getProcessingStats() {
    return {
      ...this.processingStats,
      successRate: this.processingStats.totalProcessed > 0
        ? ((this.processingStats.totalProcessed - this.processingStats.errors) / this.processingStats.totalProcessed * 100).toFixed(1)
        : 0
    }
  }

  resetStats() {
    this.processingStats = {
      totalProcessed: 0,
      deadlinesExtracted: 0,
      documentTypesIdentified: 0,
      sectorsClassified: 0,
      metadataEnriched: 0,
      errors: 0
    }
  }

  logStats() {
    const stats = this.getProcessingStats()

    console.log('\n' + '='.repeat(50))
    console.log('📊 CONTENT PROCESSING STATISTICS')
    console.log('='.repeat(50))
    console.log(`✅ Total Processed: ${stats.totalProcessed}`)
    console.log(`📅 Deadlines Extracted: ${stats.deadlinesExtracted}`)
    console.log(`📄 Document Types ID'd: ${stats.documentTypesIdentified}`)
    console.log(`🏷️ Sectors Classified: ${stats.sectorsClassified}`)
    console.log(`📊 Metadata Enriched: ${stats.metadataEnriched}`)
    console.log(`❌ Errors: ${stats.errors}`)
    console.log(`📈 Success Rate: ${stats.successRate}%`)
    console.log('='.repeat(50) + '\n')
  }
}

// Export singleton instance
module.exports = new ContentProcessor()
