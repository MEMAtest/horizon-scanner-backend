/**
 * Dear CEO Letter Premium Analysis Service
 *
 * Provides deep analysis of FCA Dear CEO letters and PRA Supervisory Statements:
 * - One-pager executive summaries
 * - Theme extraction and classification
 * - Firm applicability mapping
 * - Required action items
 * - Areas where specialist help may be needed
 * - Timeline and deadline extraction
 */

require('dotenv').config()
const dbService = require('./dbService')

// Theme categories for classification
const REGULATORY_THEMES = {
  CONSUMER_PROTECTION: {
    name: 'Consumer Protection',
    patterns: [/consumer\s*duty/i, /treating\s*customers\s*fairly/i, /tcf/i, /vulnerability/i, /fair\s*value/i, /customer\s*outcome/i, /consumer\s*harm/i],
    description: 'Consumer protection and duty requirements'
  },
  FINANCIAL_CRIME: {
    name: 'Financial Crime',
    patterns: [/aml/i, /anti-money\s*laundering/i, /fraud/i, /financial\s*crime/i, /sanctions/i, /terrorist\s*financing/i, /ctf/i, /app\s*fraud/i],
    description: 'AML, fraud prevention, and financial crime controls'
  },
  OPERATIONAL_RESILIENCE: {
    name: 'Operational Resilience',
    patterns: [/operational\s*resilience/i, /business\s*continuity/i, /outsourcing/i, /third\s*party/i, /cyber/i, /it\s*risk/i, /critical\s*service/i],
    description: 'Operational resilience and third-party risk management'
  },
  GOVERNANCE: {
    name: 'Governance & Culture',
    patterns: [/governance/i, /board/i, /senior\s*manager/i, /smcr/i, /culture/i, /accountability/i, /fitness\s*and\s*propriety/i],
    description: 'Corporate governance and accountability frameworks'
  },
  PRUDENTIAL: {
    name: 'Prudential Requirements',
    patterns: [/capital/i, /liquidity/i, /solvency/i, /prudential/i, /stress\s*test/i, /icaap/i, /ilaap/i, /mrel/i],
    description: 'Capital, liquidity, and prudential requirements'
  },
  CONDUCT: {
    name: 'Conduct Risk',
    patterns: [/conduct/i, /market\s*integrity/i, /conflict\s*of\s*interest/i, /best\s*execution/i, /suitability/i, /advice/i],
    description: 'Conduct risk and market integrity'
  },
  DATA_TECHNOLOGY: {
    name: 'Data & Technology',
    patterns: [/data/i, /ai/i, /artificial\s*intelligence/i, /digital/i, /crypto/i, /technology/i, /innovation/i, /fintech/i],
    description: 'Data protection, technology, and digital assets'
  },
  CLIMATE_ESG: {
    name: 'Climate & ESG',
    patterns: [/climate/i, /esg/i, /sustainable/i, /green/i, /environmental/i, /net\s*zero/i, /tcfd/i],
    description: 'Climate risk and ESG considerations'
  },
  MOTOR_FINANCE: {
    name: 'Motor Finance',
    patterns: [/motor\s*finance/i, /car\s*finance/i, /vehicle\s*finance/i, /discretionary\s*commission/i, /dca/i],
    description: 'Motor finance and commission arrangements'
  },
  PAYMENTS: {
    name: 'Payments',
    patterns: [/payment/i, /psd2/i, /open\s*banking/i, /safeguarding/i, /e-money/i, /emoney/i],
    description: 'Payment services and safeguarding'
  }
}

// Firm type patterns
const FIRM_TYPE_PATTERNS = {
  'Banks': [/bank/i, /deposit\s*taker/i, /credit\s*institution/i],
  'Building Societies': [/building\s*societ/i],
  'Investment Firms': [/investment\s*firm/i, /asset\s*manager/i, /fund\s*manager/i, /mifid/i],
  'Insurers': [/insur/i, /underwrite/i],
  'Consumer Credit': [/consumer\s*credit/i, /lend/i, /credit\s*broker/i],
  'Payment Firms': [/payment/i, /psp/i, /e-money/i, /emoney/i, /pisp/i, /aisp/i],
  'Mortgage Lenders': [/mortgage/i, /residential\s*lending/i],
  'Claims Management': [/cmc/i, /claims\s*management/i],
  'Wealth Managers': [/wealth/i, /private\s*client/i, /high\s*net\s*worth/i],
  'General Insurance': [/general\s*insurance/i, /gi/i, /non-life/i],
  'Life Insurance': [/life\s*insur/i, /pension/i, /annuit/i]
}

class DearCeoAnalyzer {
  constructor() {
    this.aiAnalyzer = null
  }

  async init() {
    if (!this.aiAnalyzer) {
      this.aiAnalyzer = require('./aiAnalyzer')
    }
  }

  /**
   * Generate a comprehensive one-pager analysis of a Dear CEO letter
   */
  async generateOnePager(letterId) {
    await this.init()

    const client = await dbService.pool.connect()
    try {
      // Fetch the letter from database
      const result = await client.query(`
        SELECT * FROM regulatory_updates
        WHERE id = $1
      `, [letterId])

      if (result.rows.length === 0) {
        throw new Error(`Letter not found: ${letterId}`)
      }

      const letter = result.rows[0]

      // Check if ai_summary contains cached JSON analysis
      if (letter.ai_summary && letter.ai_summary.trim().startsWith('{')) {
        try {
          const cached = JSON.parse(letter.ai_summary)
          if (cached.generatedAt && cached.executiveSummary) {
            // Return cached analysis but clean up headlines
            cached.headline = (cached.headline || '').replace(/\s*\[pdf\]\s*/gi, '').trim()
            if (cached.relatedLetters) {
              cached.relatedLetters = cached.relatedLetters.map(r => ({
                ...r,
                headline: (r.headline || '').replace(/\s*\[pdf\]\s*/gi, '').trim()
              }))
            }
            return cached
          }
        } catch (e) {
          // Not valid JSON, proceed with fresh analysis
        }
      }

      // Use summary or headline as content (NOT ai_summary which may be JSON)
      const content = letter.summary || letter.headline

      // Extract themes
      const themes = this.extractThemes(letter.headline, content)

      // Extract applicable firm types
      const applicability = this.extractApplicability(letter.headline, content)

      // Extract action items
      const actionItems = await this.extractActionItems(letter, content)

      // Extract complexity areas
      const complexityAreas = this.identifyComplexityAreas(letter.headline, content)

      // Extract timeline/deadlines
      const timeline = this.extractTimeline(content, letter.published_date)

      // Get related previous letters
      const relatedLetters = await this.findRelatedLetters(client, letter.id, themes)

      // Assess urgency level
      const urgency = this.assessUrgency(letter.headline, content, actionItems)

      // Extract key quotes if available
      const keyQuotes = this.extractKeyQuotes(content)

      // Clean [pdf] from headline
      const cleanHeadline = (letter.headline || '').replace(/\s*\[pdf\]\s*/gi, '').trim()

      const onePager = {
        id: letter.id,
        headline: cleanHeadline,
        url: letter.url,
        authority: letter.authority,
        publishedDate: letter.published_date,
        contentType: letter.content_type || 'Dear CEO Letter',

        // Enhanced metadata
        urgency: urgency,
        documentDate: this.formatDate(letter.published_date),

        executiveSummary: this.generateExecutiveSummary(letter, themes, applicability),

        themes: themes.map(t => ({
          name: t.name,
          description: t.description,
          relevance: t.score
        })),

        applicability: {
          firmTypes: applicability.firmTypes,
          sectors: applicability.sectors,
          sizeCriteria: applicability.sizeCriteria,
          applicabilityStatement: this.generateApplicabilityStatement(applicability)
        },

        actionItems: actionItems.map((action, idx) => ({
          priority: idx + 1,
          action: action.action,
          deadline: action.deadline,
          complexity: action.complexity
        })),

        complexityAreas: complexityAreas.map(area => ({
          area: area.name,
          description: area.description,
          supportNeeded: area.supportType
        })),

        timeline: timeline,

        keyQuotes: keyQuotes,

        relatedLetters: relatedLetters.map(r => ({
          id: r.id,
          headline: (r.headline || '').replace(/\s*\[pdf\]\s*/gi, '').trim(),
          publishedDate: r.published_date,
          url: r.url
        })),

        // Summary statistics
        stats: {
          themeCount: themes.length,
          actionCount: actionItems.length,
          complexityAreaCount: complexityAreas.length,
          hasDeadlines: timeline.some(t => t.type === 'deadline'),
          relatedLetterCount: relatedLetters.length
        },

        generatedAt: new Date().toISOString()
      }

      // Cache the one-pager analysis
      await this.cacheOnePager(client, letter.id, onePager)

      return onePager
    } finally {
      client.release()
    }
  }

  /**
   * Extract regulatory themes from content
   */
  extractThemes(headline, content) {
    const text = `${headline} ${content}`.toLowerCase()
    const themes = []

    for (const [key, theme] of Object.entries(REGULATORY_THEMES)) {
      let matchCount = 0
      for (const pattern of theme.patterns) {
        if (pattern.test(text)) {
          matchCount++
        }
      }

      if (matchCount > 0) {
        themes.push({
          key,
          name: theme.name,
          description: theme.description,
          score: Math.min(100, matchCount * 25) // Score based on pattern matches
        })
      }
    }

    // Sort by relevance score
    return themes.sort((a, b) => b.score - a.score)
  }

  /**
   * Extract applicable firm types - now with headline-first approach
   */
  extractApplicability(headline, content) {
    // 1. First try to extract sector directly from headline (most accurate)
    const headlineSector = this._extractSectorFromHeadline(headline)
    if (headlineSector) {
      return {
        firmTypes: [headlineSector.firmType],
        sectors: [headlineSector.sector],
        sizeCriteria: this._extractSizeCriteria(headline, content)
      }
    }

    // 2. Use pattern matching on full text for generic cases
    const text = `${headline} ${content}`.toLowerCase()
    const firmTypes = []
    const sectors = new Set()

    for (const [firmType, patterns] of Object.entries(FIRM_TYPE_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          firmTypes.push(firmType)
          break
        }
      }
    }

    // Enhanced sector patterns - more specific
    const sectorPatterns = {
      'Retail Banking': /retail\s*bank|high\s*street\s*bank|current\s*account|savings\s*account/i,
      'Motor Finance': /motor\s*finance|car\s*finance|vehicle\s*finance|discretionary\s*commission/i,
      'Life Insurance': /life\s*insur|pension|annuit|with-profit/i,
      'General Insurance': /general\s*insur|gi\s*firm|non-life|property\s*insurance/i,
      'Consumer Credit': /consumer\s*credit|consumer\s*lending|credit\s*broker|payday|bnpl|buy\s*now\s*pay\s*later/i,
      'Investment Management': /investment\s*manage|asset\s*manage|fund\s*manage|ucits|aif/i,
      'Wealth Management': /wealth\s*manage|private\s*bank|private\s*client|high\s*net\s*worth/i,
      'Payments': /payment\s*service|psp|e-money|emoney|pisp|aisp|open\s*banking/i,
      'Mortgage Lending': /mortgage|residential\s*lend|home\s*loan|equity\s*release/i,
      'Claims Management': /claims\s*management|cmc|ppi\s*claim/i,
      'Crypto Assets': /crypto|digital\s*asset|bitcoin|stablecoin|cryptoasset/i,
      'Banking': /bank(?!rupt)|credit\s*institution|deposit\s*tak/i,
      'Insurance': /insur(?!tech)|underwriting|reinsur/i
    }

    for (const [sector, pattern] of Object.entries(sectorPatterns)) {
      if (pattern.test(text)) {
        sectors.add(sector)
      }
    }

    // Determine size criteria
    const sizeCriteria = this._extractSizeCriteria(headline, content)

    // If we found specific sectors, use them
    if (sectors.size > 0) {
      return {
        firmTypes: firmTypes.length > 0 ? firmTypes : this._firmTypesFromSectors(Array.from(sectors)),
        sectors: Array.from(sectors),
        sizeCriteria
      }
    }

    // Last resort: check for multi-sector indicators
    if (/all\s*firms|regulated\s*firms|firms\s*we\s*regulate/i.test(text)) {
      return {
        firmTypes: ['All regulated firms'],
        sectors: ['Multi-sector'],
        sizeCriteria
      }
    }

    return {
      firmTypes: firmTypes.length > 0 ? firmTypes : ['All regulated firms'],
      sectors: ['Multi-sector'],
      sizeCriteria
    }
  }

  /**
   * Extract sector directly from headline - most reliable source
   */
  _extractSectorFromHeadline(headline) {
    const sectorPatterns = [
      { pattern: /retail\s*bank/i, sector: 'Retail Banking', firmType: 'Retail Banks' },
      { pattern: /motor\s*finance/i, sector: 'Motor Finance', firmType: 'Motor Finance Providers' },
      { pattern: /life\s*insur/i, sector: 'Life Insurance', firmType: 'Life Insurers' },
      { pattern: /general\s*insur/i, sector: 'General Insurance', firmType: 'General Insurers' },
      { pattern: /consumer\s*credit/i, sector: 'Consumer Credit', firmType: 'Consumer Credit Firms' },
      { pattern: /consumer\s*finance/i, sector: 'Consumer Finance', firmType: 'Consumer Finance Providers' },
      { pattern: /asset\s*manag/i, sector: 'Asset Management', firmType: 'Asset Managers' },
      { pattern: /investment\s*firm/i, sector: 'Investment Management', firmType: 'Investment Firms' },
      { pattern: /fund\s*manag/i, sector: 'Investment Management', firmType: 'Fund Managers' },
      { pattern: /claims\s*manag/i, sector: 'Claims Management', firmType: 'Claims Management Companies' },
      { pattern: /payment|e-money/i, sector: 'Payment Services', firmType: 'Payment Service Providers' },
      { pattern: /mortgage\s*lend/i, sector: 'Mortgage Lending', firmType: 'Mortgage Lenders' },
      { pattern: /wealth\s*manag/i, sector: 'Wealth Management', firmType: 'Wealth Managers' },
      { pattern: /pension/i, sector: 'Pensions', firmType: 'Pension Providers' },
      { pattern: /building\s*societ/i, sector: 'Building Societies', firmType: 'Building Societies' },
      { pattern: /credit\s*union/i, sector: 'Credit Unions', firmType: 'Credit Unions' },
      { pattern: /crypto|digital\s*asset/i, sector: 'Crypto Assets', firmType: 'Crypto Asset Firms' },
      { pattern: /app\s*fraud|authorised\s*push/i, sector: 'Payments', firmType: 'Payment Service Providers' },
      { pattern: /operational\s*resilience/i, sector: 'Multi-sector', firmType: 'All regulated firms' }
    ]

    for (const { pattern, sector, firmType } of sectorPatterns) {
      if (pattern.test(headline)) {
        return { sector, firmType }
      }
    }
    return null
  }

  /**
   * Extract size criteria from text
   */
  _extractSizeCriteria(headline, content) {
    const text = `${headline} ${content}`.toLowerCase()

    if (/systemically\s*important|g-?sib|d-?sib|large\s*firm|major\s*bank|largest\s*firm/i.test(text)) {
      return 'Large/systemically important firms'
    }
    if (/small\s*firm|smaller\s*firm|sme|small\s*and\s*medium/i.test(text)) {
      return 'Small and medium firms'
    }
    return 'All firm sizes'
  }

  /**
   * Derive firm types from sectors
   */
  _firmTypesFromSectors(sectors) {
    const sectorToFirmType = {
      'Retail Banking': 'Retail Banks',
      'Motor Finance': 'Motor Finance Providers',
      'Life Insurance': 'Life Insurers',
      'General Insurance': 'General Insurers',
      'Consumer Credit': 'Consumer Credit Firms',
      'Investment Management': 'Investment Firms',
      'Asset Management': 'Asset Managers',
      'Wealth Management': 'Wealth Managers',
      'Payments': 'Payment Service Providers',
      'Payment Services': 'Payment Service Providers',
      'Mortgage Lending': 'Mortgage Lenders',
      'Claims Management': 'Claims Management Companies',
      'Crypto Assets': 'Crypto Asset Firms',
      'Banking': 'Banks',
      'Insurance': 'Insurers',
      'Pensions': 'Pension Providers',
      'Building Societies': 'Building Societies',
      'Credit Unions': 'Credit Unions',
      'Multi-sector': 'All regulated firms'
    }

    return sectors.map(s => sectorToFirmType[s] || s)
  }

  /**
   * Extract required actions from content
   */
  async extractActionItems(letter, content) {
    const actions = []

    // Common action patterns
    const actionPatterns = [
      { pattern: /review\s+(?:your\s+)?(?:firm['']s\s+)?([^.]+)/gi, type: 'Review' },
      { pattern: /ensure\s+(?:that\s+)?([^.]+)/gi, type: 'Ensure' },
      { pattern: /must\s+([^.]+)/gi, type: 'Requirement' },
      { pattern: /should\s+([^.]+)/gi, type: 'Recommendation' },
      { pattern: /expect\s+firms?\s+to\s+([^.]+)/gi, type: 'Expectation' },
      { pattern: /deadline[:\s]+([^.]+)/gi, type: 'Deadline' },
      { pattern: /by\s+(\d{1,2}\s+\w+\s+\d{4})/gi, type: 'Timeline' }
    ]

    for (const { pattern, type } of actionPatterns) {
      const matches = content.matchAll(pattern)
      for (const match of matches) {
        if (match[1] && match[1].length > 10 && match[1].length < 200) {
          actions.push({
            action: `${type}: ${match[1].trim()}`,
            deadline: this.extractDeadlineFromAction(match[1]),
            complexity: this.assessActionComplexity(match[1])
          })
        }
      }
    }

    // Deduplicate and limit
    const uniqueActions = this.deduplicateActions(actions)
    return uniqueActions.slice(0, 10)
  }

  extractDeadlineFromAction(text) {
    const datePattern = /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i
    const match = text.match(datePattern)
    if (match) {
      return `${match[1]} ${match[2]} ${match[3]}`
    }
    return null
  }

  assessActionComplexity(text) {
    const highComplexity = /system|infrastructure|fundamental|overhaul|significant\s+change|transformation/i
    const mediumComplexity = /review|assess|update|enhance|improve/i

    if (highComplexity.test(text)) return 'High'
    if (mediumComplexity.test(text)) return 'Medium'
    return 'Low'
  }

  deduplicateActions(actions) {
    const seen = new Set()
    return actions.filter(action => {
      const key = action.action.toLowerCase().substring(0, 50)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  /**
   * Identify areas where firms may need specialist help
   */
  identifyComplexityAreas(headline, content) {
    const text = `${headline} ${content}`.toLowerCase()
    const areas = []

    const complexityPatterns = [
      {
        patterns: [/model\s*risk/i, /irb/i, /internal\s*model/i, /stress\s*test/i],
        name: 'Model Risk & Validation',
        description: 'Complex model development and validation requirements',
        supportType: 'Quantitative specialists / Model validators'
      },
      {
        patterns: [/capital\s*calculation/i, /crr/i, /crd/i, /icaap/i],
        name: 'Capital Requirements',
        description: 'Regulatory capital calculation complexity',
        supportType: 'Prudential regulation specialists'
      },
      {
        patterns: [/system\s*change/i, /it\s*infrastructure/i, /data\s*migration/i, /technology\s*upgrade/i],
        name: 'Technology Implementation',
        description: 'System changes and technology requirements',
        supportType: 'RegTech / Technology consultants'
      },
      {
        patterns: [/remediation/i, /past\s*business\s*review/i, /redress/i, /compensation/i],
        name: 'Customer Remediation',
        description: 'Customer review and remediation programmes',
        supportType: 'Remediation specialists / Complaints handlers'
      },
      {
        patterns: [/governance\s*framework/i, /smcr/i, /accountability/i, /board\s*oversight/i],
        name: 'Governance Framework',
        description: 'Governance structure and accountability',
        supportType: 'Governance / Compliance consultants'
      },
      {
        patterns: [/sanctions/i, /pep/i, /transaction\s*monitoring/i, /kyc/i],
        name: 'Financial Crime Controls',
        description: 'AML/CTF systems and controls',
        supportType: 'Financial crime specialists'
      },
      {
        patterns: [/outsourcing/i, /third\s*party/i, /supply\s*chain/i, /vendor/i],
        name: 'Third Party Risk',
        description: 'Outsourcing and third-party risk management',
        supportType: 'Third party risk / Procurement specialists'
      }
    ]

    for (const area of complexityPatterns) {
      for (const pattern of area.patterns) {
        if (pattern.test(text)) {
          areas.push({
            name: area.name,
            description: area.description,
            supportType: area.supportType
          })
          break
        }
      }
    }

    return areas
  }

  /**
   * Extract timeline and key dates
   */
  extractTimeline(content, publishedDate) {
    const timeline = []

    // Add publication date
    if (publishedDate) {
      timeline.push({
        date: new Date(publishedDate).toISOString().split('T')[0],
        milestone: 'Letter published',
        type: 'publication'
      })
    }

    // Extract dates from content
    const datePatterns = [
      /by\s+(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/gi,
      /deadline[:\s]+(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/gi,
      /(?:effective|implement|commence)\s+(?:from\s+)?(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/gi
    ]

    for (const pattern of datePatterns) {
      const matches = content.matchAll(pattern)
      for (const match of matches) {
        try {
          const dateStr = match[1]
          const date = new Date(dateStr)
          if (!isNaN(date.getTime())) {
            timeline.push({
              date: date.toISOString().split('T')[0],
              milestone: `Action deadline: ${dateStr}`,
              type: 'deadline'
            })
          }
        } catch (e) {
          // Skip invalid dates
        }
      }
    }

    // Sort by date
    return timeline.sort((a, b) => new Date(a.date) - new Date(b.date))
  }

  /**
   * Find related previous Dear CEO letters
   */
  async findRelatedLetters(client, currentId, themes) {
    if (themes.length === 0) return []

    // Build search query based on themes
    const themeNames = themes.map(t => t.name).slice(0, 3)
    const searchTerms = themeNames.join(' | ')

    try {
      const result = await client.query(`
        SELECT id, headline, published_date, url, ai_summary
        FROM regulatory_updates
        WHERE id != $1
          AND authority IN ('FCA', 'PRA')
          AND content_type IN ('DEAR_CEO_LETTER', 'Dear CEO Letter', 'SUPERVISORY_STATEMENT', 'Supervisory Statement')
          AND (
            headline ILIKE ANY($2)
            OR ai_summary ILIKE ANY($2)
          )
        ORDER BY published_date DESC
        LIMIT 5
      `, [currentId, themeNames.map(t => `%${t}%`)])

      return result.rows.map(row => ({
        ...row,
        shared_themes: this.findSharedThemes(row, themes)
      }))
    } catch (error) {
      console.error('Error finding related letters:', error.message)
      return []
    }
  }

  findSharedThemes(letter, themes) {
    const letterThemes = this.extractThemes(letter.headline, letter.ai_summary || '')
    const letterThemeNames = new Set(letterThemes.map(t => t.name))
    return themes.filter(t => letterThemeNames.has(t.name)).map(t => t.name)
  }

  /**
   * Generate executive summary - enhanced with more context
   */
  generateExecutiveSummary(letter, themes, applicability) {
    const themeList = themes.slice(0, 3).map(t => t.name).join(', ')
    const authority = letter.authority || 'FCA'
    const headline = letter.headline || ''

    // Try to extract key message from headline
    let keyMessage = ''
    if (/concern|warning|reminder/i.test(headline)) {
      keyMessage = 'This letter raises supervisory concerns that require immediate attention. '
    } else if (/expectation|expect/i.test(headline)) {
      keyMessage = 'This letter sets out clear regulatory expectations for firms. '
    } else if (/update|guidance/i.test(headline)) {
      keyMessage = 'This letter provides updated guidance on regulatory requirements. '
    }

    // Add sector context if available
    let sectorContext = ''
    if (applicability && applicability.sectors && applicability.sectors.length > 0 && applicability.sectors[0] !== 'Multi-sector') {
      sectorContext = `It specifically targets ${applicability.sectors.join(' and ')} firms. `
    }

    return `${keyMessage}This ${authority} supervisory communication addresses ${themeList || 'key regulatory expectations'}. ` +
           `${sectorContext}` +
           `Firms should treat this as a priority item requiring board-level attention and ` +
           `ensure appropriate action is taken within the specified timeframes.`
  }

  /**
   * Generate urgency indicator based on content
   */
  assessUrgency(headline, content, actionItems) {
    let urgencyScore = 0
    const text = `${headline} ${content}`.toLowerCase()

    // High urgency indicators
    if (/immediate|urgent|without delay|forthwith|as soon as possible/i.test(text)) urgencyScore += 3
    if (/must|require|mandatory/i.test(text)) urgencyScore += 2
    if (/deadline|by\s+\d{1,2}\s+(january|february|march|april|may|june|july|august|september|october|november|december)/i.test(text)) urgencyScore += 2
    if (/serious|significant\s*concern|enforcement|investigation/i.test(text)) urgencyScore += 2

    // Medium urgency
    if (/should|expect|recommend/i.test(text)) urgencyScore += 1
    if (/review|assess|consider/i.test(text)) urgencyScore += 1

    // Factor in high complexity actions
    const highComplexityCount = actionItems.filter(a => a.complexity === 'High').length
    urgencyScore += highComplexityCount

    if (urgencyScore >= 6) return { level: 'Critical', color: 'danger' }
    if (urgencyScore >= 4) return { level: 'High', color: 'warning' }
    if (urgencyScore >= 2) return { level: 'Medium', color: 'primary' }
    return { level: 'Standard', color: 'success' }
  }

  /**
   * Extract key quotes from the letter
   */
  extractKeyQuotes(content) {
    const quotes = []
    const sentences = content.split(/[.!?]+/)

    const keyPhrases = [
      /we expect/i, /firms must/i, /firms should/i, /immediate/i,
      /board/i, /senior management/i, /unacceptable/i, /concern/i,
      /deadline/i, /by the end of/i, /failure to/i
    ]

    for (const sentence of sentences) {
      const trimmed = sentence.trim()
      if (trimmed.length < 20 || trimmed.length > 200) continue

      for (const phrase of keyPhrases) {
        if (phrase.test(trimmed) && !quotes.includes(trimmed)) {
          quotes.push(trimmed)
          break
        }
      }

      if (quotes.length >= 3) break
    }

    return quotes
  }

  /**
   * Generate applicability statement
   */
  generateApplicabilityStatement(applicability) {
    const firms = applicability.firmTypes.join(', ')
    const sectors = applicability.sectors.length > 0 ? applicability.sectors.join(', ') : 'all regulated sectors'

    return `This letter is relevant to ${firms} operating in ${sectors}. ${applicability.sizeCriteria}.`
  }

  /**
   * Format date for display
   */
  formatDate(dateStr) {
    if (!dateStr) return null
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    } catch (e) {
      return null
    }
  }

  /**
   * Cache the one-pager analysis in the database
   */
  async cacheOnePager(client, letterId, onePager) {
    // Caching disabled - raw_data column not available
    // Analysis is generated on-demand
  }

  /**
   * Get all Dear CEO letters with optional filters
   */
  async getLetters(filters = {}) {
    const client = await dbService.pool.connect()
    try {
      let query = `
        SELECT id, headline, url, authority, published_date, ai_summary, content_type
        FROM regulatory_updates
        WHERE authority IN ('FCA', 'PRA')
          AND (
            content_type IN ('DEAR_CEO_LETTER', 'Dear CEO Letter', 'SUPERVISORY_STATEMENT', 'Supervisory Statement', 'POLICY_STATEMENT', 'Policy Statement')
            OR headline ILIKE '%dear ceo%'
            OR headline ILIKE '%supervisory statement%'
            OR headline ~ '^SS\\d+/\\d+'
            OR headline ~ '^PS\\d+/\\d+'
          )
      `

      const params = []
      let paramCount = 0

      if (filters.authority) {
        paramCount++
        query += ` AND authority = $${paramCount}`
        params.push(filters.authority)
      }

      if (filters.theme) {
        paramCount++
        query += ` AND (headline ILIKE $${paramCount} OR ai_summary ILIKE $${paramCount})`
        params.push(`%${filters.theme}%`)
      }

      if (filters.fromDate) {
        paramCount++
        query += ` AND published_date >= $${paramCount}`
        params.push(filters.fromDate)
      }

      if (filters.toDate) {
        paramCount++
        query += ` AND published_date <= $${paramCount}`
        params.push(filters.toDate)
      }

      query += ' ORDER BY published_date DESC'

      if (filters.limit) {
        paramCount++
        query += ` LIMIT $${paramCount}`
        params.push(filters.limit)
      }

      const result = await client.query(query, params)

      // Clean [pdf] from headlines
      return result.rows.map(row => ({
        ...row,
        headline: (row.headline || '').replace(/\s*\[pdf\]\s*/gi, '').trim()
      }))
    } finally {
      client.release()
    }
  }

  /**
   * Batch analyze all Dear CEO letters
   * Generates and stores analysis for all letters in the database
   */
  async batchAnalyzeAll(options = {}) {
    const client = await dbService.pool.connect()
    const results = {
      total: 0,
      processed: 0,
      skipped: 0,
      errors: []
    }

    try {
      // Get all letters
      const letters = await this.getLetters({ limit: options.limit || 1000 })
      results.total = letters.length

      console.log(`\n${'='.repeat(60)}`)
      console.log(`BATCH ANALYSIS: Processing ${letters.length} Dear CEO letters...`)
      console.log(`${'='.repeat(60)}\n`)

      for (let i = 0; i < letters.length; i++) {
        const letter = letters[i]

        try {
          // Skip if already has structured analysis (optional)
          if (options.skipExisting && letter.ai_summary) {
            try {
              const existing = JSON.parse(letter.ai_summary)
              if (existing.generatedAt) {
                results.skipped++
                continue
              }
            } catch (e) {
              // Not valid JSON, proceed with analysis
            }
          }

          // Generate analysis
          const analysis = await this.generateOnePager(letter.id)

          // Store the analysis as JSON in ai_summary
          await client.query(`
            UPDATE regulatory_updates
            SET ai_summary = $1
            WHERE id = $2
          `, [JSON.stringify(analysis), letter.id])

          results.processed++
          console.log(`[${i + 1}/${letters.length}] ✅ ${letter.headline.substring(0, 60)}...`)
        } catch (err) {
          results.errors.push({
            id: letter.id,
            headline: letter.headline,
            error: err.message
          })
          console.log(`[${i + 1}/${letters.length}] ❌ ${letter.headline.substring(0, 40)}... - ${err.message}`)
        }

        // Rate limiting between letters to avoid overload
        if (i < letters.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      console.log(`\n${'='.repeat(60)}`)
      console.log(`BATCH ANALYSIS COMPLETE:`)
      console.log(`  Total: ${results.total}`)
      console.log(`  Processed: ${results.processed}`)
      console.log(`  Skipped: ${results.skipped}`)
      console.log(`  Errors: ${results.errors.length}`)
      console.log(`${'='.repeat(60)}\n`)

      return results
    } finally {
      client.release()
    }
  }

  /**
   * Generate AI-powered rich analysis using Claude Sonnet
   */
  async generateAIOnePager(letterId) {
    await this.init()

    const client = await dbService.pool.connect()
    try {
      // Fetch the letter
      const result = await client.query(`
        SELECT * FROM regulatory_updates WHERE id = $1
      `, [letterId])

      if (result.rows.length === 0) {
        throw new Error(`Letter not found: ${letterId}`)
      }

      const letter = result.rows[0]
      const cleanHeadline = (letter.headline || '').replace(/\s*\[pdf\]\s*/gi, '').trim()
      const content = letter.summary || letter.headline

      // Check for AI API keys - prefer DeepSeek (cheaper), fallback to Anthropic
      const deepseekKey = process.env.DEEPSEEK_API_KEY
      const anthropicKey = process.env.ANTHROPIC_API_KEY

      if (!deepseekKey && !anthropicKey) {
        console.log('⚠️ No AI API key available, falling back to pattern-based analysis')
        return this.generateOnePager(letterId)
      }

      const useDeepSeek = !!deepseekKey

      const prompt = `You are analyzing an FCA/PRA Dear CEO letter for compliance professionals. Analyze this letter and provide structured intelligence.

LETTER HEADLINE: ${cleanHeadline}
AUTHORITY: ${letter.authority || 'FCA'}
PUBLISHED DATE: ${letter.published_date || 'Unknown'}
CONTENT/SUMMARY: ${content}

Provide a comprehensive analysis in the following JSON format:

{
  "executiveSummary": "2-3 sentence summary of what this letter is about and why it matters",

  "fcaObjectives": {
    "primaryGoal": "The main thing the FCA/PRA is trying to achieve",
    "secondaryGoals": ["Other objectives"],
    "regulatoryContext": "Why this letter was issued now, what triggered it"
  },

  "whoThisAffects": {
    "industries": ["List of affected sectors like Retail Banking, Consumer Credit, etc."],
    "firmTypes": ["Types of firms affected: banks, insurers, CMCs, etc."],
    "firmSizes": {
      "small": "Specific requirements or exemptions for smaller firms",
      "medium": "Requirements for medium-sized firms",
      "large": "Requirements for large/systemically important firms"
    }
  },

  "requiredActions": [
    {
      "action": "Specific action firms must take",
      "owner": "Who is responsible (Board, Compliance, Operations, etc.)",
      "deadline": "When this must be done (if stated)",
      "priority": "Critical/High/Medium"
    }
  ],

  "preparationSteps": {
    "immediate": ["Things to do this week"],
    "shortTerm": ["Things to do this month"],
    "mediumTerm": ["Things to do this quarter"]
  },

  "riskAssessment": {
    "nonComplianceRisk": "High/Medium/Low",
    "enforcementLikelihood": "Description of enforcement risk",
    "reputationalImpact": "Potential reputational consequences"
  },

  "keyThemes": ["List of 2-4 regulatory themes this letter addresses"],

  "keyQuotes": ["2-3 important direct quotes or paraphrases from the letter"]
}

Respond with ONLY the JSON, no other text.`

      console.log(`🤖 Generating AI analysis for: ${cleanHeadline.substring(0, 50)}... (using ${useDeepSeek ? 'DeepSeek' : 'Anthropic'})`)

      let aiResponse

      if (useDeepSeek) {
        // Use DeepSeek API
        const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${deepseekKey}`
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 2000,
            temperature: 0.1
          })
        })

        if (!deepseekResponse.ok) {
          const errorText = await deepseekResponse.text()
          throw new Error(`DeepSeek API error: ${deepseekResponse.status} ${errorText}`)
        }

        const deepseekData = await deepseekResponse.json()
        aiResponse = deepseekData.choices[0].message.content
      } else {
        // Use Anthropic API
        const Anthropic = require('@anthropic-ai/sdk')
        const anthropic = new Anthropic({ apiKey: anthropicKey })

        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          temperature: 0.1,
          messages: [{ role: 'user', content: prompt }]
        })

        aiResponse = response.content[0].text
      }

      let aiAnalysis

      try {
        aiAnalysis = JSON.parse(aiResponse)
      } catch (e) {
        // Try to extract JSON from response
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          aiAnalysis = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('Failed to parse AI response as JSON')
        }
      }

      // Build the enhanced one-pager
      const onePager = {
        id: letter.id,
        headline: cleanHeadline,
        url: letter.url,
        authority: letter.authority,
        publishedDate: letter.published_date,
        contentType: letter.content_type || 'Dear CEO Letter',
        documentDate: this.formatDate(letter.published_date),

        // AI-generated content
        executiveSummary: aiAnalysis.executiveSummary || '',
        fcaObjectives: aiAnalysis.fcaObjectives || {},
        whoThisAffects: aiAnalysis.whoThisAffects || {},

        // Actions with tracking support
        complianceChecklist: (aiAnalysis.requiredActions || []).map((action, idx) => ({
          id: `${letter.id}-action-${idx}`,
          action: action.action,
          owner: action.owner || 'Compliance',
          deadline: action.deadline || null,
          priority: action.priority || 'Medium',
          status: 'pending'
        })),

        preparationSteps: aiAnalysis.preparationSteps || {},
        riskAssessment: aiAnalysis.riskAssessment || {},

        themes: (aiAnalysis.keyThemes || []).map(theme => ({
          name: theme,
          description: '',
          relevance: 0.8
        })),

        keyQuotes: aiAnalysis.keyQuotes || [],

        // Urgency based on risk
        urgency: {
          level: aiAnalysis.riskAssessment?.nonComplianceRisk === 'High' ? 'Critical' :
                 aiAnalysis.riskAssessment?.nonComplianceRisk === 'Medium' ? 'High' : 'Medium',
          color: aiAnalysis.riskAssessment?.nonComplianceRisk === 'High' ? 'danger' :
                 aiAnalysis.riskAssessment?.nonComplianceRisk === 'Medium' ? 'warning' : 'primary'
        },

        // Stats
        stats: {
          themeCount: (aiAnalysis.keyThemes || []).length,
          actionCount: (aiAnalysis.requiredActions || []).length,
          hasDeadlines: (aiAnalysis.requiredActions || []).some(a => a.deadline),
          aiGenerated: true
        },

        generatedAt: new Date().toISOString(),
        aiModel: useDeepSeek ? 'deepseek-chat' : 'claude-sonnet-4'
      }

      console.log(`✅ AI analysis complete for: ${cleanHeadline.substring(0, 50)}...`)
      return onePager
    } finally {
      client.release()
    }
  }

  /**
   * Batch AI analyze all Dear CEO letters
   * Note: Does NOT hold a persistent connection - each operation gets its own
   */
  async batchAIAnalyzeAll(options = {}) {
    const results = {
      total: 0,
      processed: 0,
      skipped: 0,
      errors: []
    }

    // Get letters (will use its own connection)
    const letters = await this.getLetters({ limit: options.limit || 100 })
    results.total = letters.length

    console.log(`\n${'='.repeat(60)}`)
    console.log(`AI BATCH ANALYSIS: Processing ${letters.length} Dear CEO letters with Claude Sonnet...`)
    console.log(`${'='.repeat(60)}\n`)

    for (let i = 0; i < letters.length; i++) {
      const letter = letters[i]

      try {
        // Skip if already has AI analysis
        if (options.skipExisting && letter.ai_summary) {
          try {
            const existing = JSON.parse(letter.ai_summary)
            if (existing.aiModel) {
              results.skipped++
              continue
            }
          } catch (e) {
            // Not valid JSON or no AI model, proceed
          }
        }

        // Generate AI analysis (handles its own DB connection)
        const analysis = await this.generateAIOnePager(letter.id)

        // Store in database using a fresh connection for each update
        const client = await dbService.pool.connect()
        try {
          await client.query(`
            UPDATE regulatory_updates
            SET ai_summary = $1
            WHERE id = $2
          `, [JSON.stringify(analysis), letter.id])
        } finally {
          client.release()
        }

        results.processed++
        console.log(`[${i + 1}/${letters.length}] ✅ ${letter.headline.substring(0, 50)}...`)

        // Rate limiting for API calls
        if (i < letters.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (err) {
        results.errors.push({
          id: letter.id,
          headline: letter.headline,
          error: err.message
        })
        console.log(`[${i + 1}/${letters.length}] ❌ ${letter.headline.substring(0, 40)}... - ${err.message}`)
      }
    }

    console.log(`\n${'='.repeat(60)}`)
    console.log(`AI BATCH ANALYSIS COMPLETE:`)
    console.log(`  Total: ${results.total}`)
    console.log(`  Processed: ${results.processed}`)
    console.log(`  Skipped: ${results.skipped}`)
    console.log(`  Errors: ${results.errors.length}`)
    console.log(`${'='.repeat(60)}\n`)

    return results
  }
}

module.exports = new DearCeoAnalyzer()
