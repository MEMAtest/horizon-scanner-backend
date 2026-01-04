const dbService = require('./dbService')

// Firm type patterns for applicability
const FIRM_TYPE_PATTERNS = {
  'Banks': [/bank/i, /deposit\s*taker/i, /credit\s*institution/i, /lending/i],
  'Building Societies': [/building\s*societ/i],
  'Investment Firms': [/investment\s*firm/i, /asset\s*manager/i, /fund\s*manager/i, /mifid/i, /ucits/i],
  'Insurers': [/insur/i, /underwrite/i, /solvency/i],
  'Consumer Credit': [/consumer\s*credit/i, /credit\s*broker/i, /debt/i],
  'Payment Firms': [/payment/i, /psp/i, /e-money/i, /emoney/i, /pisp/i, /aisp/i],
  'Mortgage Lenders': [/mortgage/i, /residential\s*lending/i],
  'Wealth Managers': [/wealth/i, /private\s*client/i, /discretionary/i],
  'Pension Providers': [/pension/i, /retirement/i, /annuit/i],
  'Crypto Firms': [/crypto/i, /digital\s*asset/i, /virtual\s*asset/i]
}

// Calculate days remaining until deadline
function calculateDaysRemaining(deadline) {
  if (!deadline) return null
  const now = new Date()
  const deadlineDate = new Date(deadline)
  const diffTime = deadlineDate - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

// Determine consultation status based on deadline
function getConsultationStatus(deadline) {
  const daysRemaining = calculateDaysRemaining(deadline)

  if (daysRemaining === null) return 'unknown'
  if (daysRemaining < 0) return 'closed'
  if (daysRemaining <= 14) return 'closing-soon'
  return 'open'
}

// Parse deadline from various formats in content
function extractDeadline(content, headline, publishedDate) {
  // Common patterns for consultation deadlines
  const patterns = [
    /closes?\s*(?:on\s*)?([\d]{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/i,
    /deadline[:\s]*([\d]{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/i,
    /respond\s*(?:by|before)\s*([\d]{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/i,
    /comments?\s*(?:by|due|before)\s*([\d]{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/i,
    /consultation\s*(?:closes?|ends?)\s*(?:on\s*)?([\d]{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/i,
    /submissions?\s*(?:by|due|before)\s*([\d]{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/i,
    /(?:by|before|until)\s*([\d]{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/i,
    /([\d]{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/i
  ]

  const textToSearch = `${headline || ''} ${content || ''}`

  for (const pattern of patterns) {
    const match = textToSearch.match(pattern)
    if (match) {
      try {
        const parsed = new Date(match[1])
        if (!isNaN(parsed.getTime())) {
          return parsed
        }
      } catch (e) {
        continue
      }
    }
  }

  // For consultations without explicit deadline, estimate 3 months from publication
  if (publishedDate) {
    const pubDate = new Date(publishedDate)
    const estimatedDeadline = new Date(pubDate)
    estimatedDeadline.setMonth(estimatedDeadline.getMonth() + 3)
    return { date: estimatedDeadline, estimated: true }
  }

  return null
}

// Extract firm types this applies to
function extractApplicability(headline, content) {
  const text = `${headline || ''} ${content || ''}`.toLowerCase()
  const applicableFirms = []

  for (const [firmType, patterns] of Object.entries(FIRM_TYPE_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        applicableFirms.push(firmType)
        break
      }
    }
  }

  return applicableFirms.length > 0 ? applicableFirms : ['All regulated firms']
}

// Get all consultations with filtering
async function getConsultations({ regulator, status, limit = 50, offset = 0 }) {
  try {
    // Query for consultation papers
    let query = `
      SELECT
        id, headline, authority, content_type, url,
        published_date, created_at, ai_summary
      FROM regulatory_updates
      WHERE (
        content_type ILIKE '%consultation%'
        OR headline ILIKE 'CP%/%'
        OR headline ILIKE '%consultation%'
        OR headline ILIKE '%call for input%'
        OR headline ILIKE '%discussion paper%'
        OR headline ILIKE 'DP%/%'
      )
    `

    const params = []
    let paramIndex = 1

    if (regulator && regulator !== 'all') {
      query += ` AND authority = $${paramIndex}`
      params.push(regulator)
      paramIndex++
    }

    query += ` ORDER BY published_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    await dbService.waitForInitialization()
    const result = await dbService.pool.query(query, params)

    // Enrich with deadline and status information
    const consultations = result.rows.map(row => {
      const deadlineResult = extractDeadline(row.ai_summary, row.headline, row.published_date)
      const deadline = deadlineResult?.date || deadlineResult
      const isDeadlineEstimated = deadlineResult?.estimated || false
      const daysRemaining = calculateDaysRemaining(deadline)
      const consultationStatus = getConsultationStatus(deadline)

      // Extract CP/DP number from headline
      const cpMatch = row.headline.match(/(CP|DP)\s*(\d+)\/(\d+)/i)
      const cpNumber = cpMatch ? `${cpMatch[1]}${cpMatch[2]}/${cpMatch[3]}` : null

      // Extract who it applies to
      const appliesTo = extractApplicability(row.headline, row.ai_summary)

      return {
        ...row,
        cpNumber,
        deadline,
        isDeadlineEstimated,
        daysRemaining,
        status: consultationStatus,
        appliesTo
      }
    })

    // Filter by status if specified
    let filteredConsultations = consultations
    if (status && status !== 'all') {
      filteredConsultations = consultations.filter(c => c.status === status)
    }

    return filteredConsultations
  } catch (error) {
    console.error('[consultationService] Error fetching consultations:', error)
    throw error
  }
}

// Get consultation summary stats
async function getConsultationSummary() {
  try {
    const consultations = await getConsultations({ limit: 500 })

    const summary = {
      total: consultations.length,
      open: consultations.filter(c => c.status === 'open').length,
      closingSoon: consultations.filter(c => c.status === 'closing-soon').length,
      closed: consultations.filter(c => c.status === 'closed').length,
      byAuthority: {}
    }

    // Count by authority
    consultations.forEach(c => {
      const auth = c.authority || 'Unknown'
      if (!summary.byAuthority[auth]) {
        summary.byAuthority[auth] = { total: 0, open: 0, closingSoon: 0 }
      }
      summary.byAuthority[auth].total++
      if (c.status === 'open') summary.byAuthority[auth].open++
      if (c.status === 'closing-soon') summary.byAuthority[auth].closingSoon++
    })

    return summary
  } catch (error) {
    console.error('[consultationService] Error getting summary:', error)
    throw error
  }
}

// Generate analysis for a consultation
async function generateConsultationAnalysis(consultationId) {
  try {
    // Fetch the consultation
    await dbService.waitForInitialization()
    const result = await dbService.pool.query(
      'SELECT * FROM regulatory_updates WHERE id = $1',
      [consultationId]
    )

    if (result.rows.length === 0) {
      throw new Error('Consultation not found')
    }

    const consultation = result.rows[0]
    const deadline = extractDeadline(consultation.ai_summary, consultation.headline)
    const daysRemaining = calculateDaysRemaining(deadline)
    const status = getConsultationStatus(deadline)

    // Build analysis structure
    const analysis = {
      id: consultation.id,
      headline: consultation.headline,
      authority: consultation.authority,
      url: consultation.url,
      deadline,
      daysRemaining,
      status,

      // Summary section
      summary: consultation.ai_summary || 'No summary available.',

      // Key proposed changes (extracted from summary)
      proposedChanges: extractProposedChanges(consultation.ai_summary),

      // Who this affects
      affectedEntities: extractAffectedEntities(consultation.ai_summary, null),

      // Response guidance based on urgency
      responseGuidance: generateResponseGuidance(status, daysRemaining, deadline)
    }

    return analysis
  } catch (error) {
    console.error('[consultationService] Error generating analysis:', error)
    throw error
  }
}

// Extract proposed changes from summary
function extractProposedChanges(summary) {
  if (!summary) return []

  const changes = []
  const sentences = summary.split(/[.!?]+/)

  // Look for sentences containing change-related keywords
  const changeKeywords = ['propose', 'change', 'amend', 'update', 'introduce', 'require', 'new', 'modify']

  sentences.forEach(sentence => {
    const lower = sentence.toLowerCase()
    if (changeKeywords.some(kw => lower.includes(kw)) && sentence.trim().length > 20) {
      changes.push(sentence.trim())
    }
  })

  return changes.slice(0, 5) // Max 5 changes
}

// Extract affected entities from summary and sectors
function extractAffectedEntities(summary, sectors) {
  const entities = new Set()

  // Common firm types
  const firmTypes = [
    'banks', 'insurers', 'asset managers', 'investment firms',
    'payment providers', 'building societies', 'credit unions',
    'consumer credit firms', 'mortgage lenders', 'wealth managers',
    'financial advisers', 'platforms', 'custodians'
  ]

  const summaryLower = (summary || '').toLowerCase()

  firmTypes.forEach(type => {
    if (summaryLower.includes(type.toLowerCase())) {
      entities.add(type)
    }
  })

  // Add sectors if available
  if (sectors) {
    const sectorList = Array.isArray(sectors) ? sectors : [sectors]
    sectorList.forEach(s => entities.add(s))
  }

  return Array.from(entities)
}

// Generate response guidance based on urgency
function generateResponseGuidance(status, daysRemaining, deadline) {
  if (status === 'closed') {
    return {
      urgency: 'none',
      message: 'This consultation has closed. Review the final policy/guidance when published.',
      actions: [
        'Monitor for final policy publication',
        'Review implementation timeline',
        'Update internal policies accordingly'
      ]
    }
  }

  if (status === 'closing-soon') {
    return {
      urgency: 'high',
      message: `Only ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining! Prioritize your response.`,
      actions: [
        'Immediate: Review all proposed changes',
        'This week: Draft response with key concerns',
        'Submit before deadline: ' + (deadline ? deadline.toLocaleDateString() : 'unknown')
      ]
    }
  }

  return {
    urgency: 'medium',
    message: `${daysRemaining} days remaining to respond. Adequate time to prepare a thorough submission.`,
    actions: [
      'Schedule internal review meeting',
      'Identify stakeholders for input',
      'Draft initial response framework',
      'Allow time for legal/compliance review'
    ]
  }
}

// Find related Policy Statement for a Consultation Paper (CP → PS tracking)
async function findRelatedPolicyStatement(cpNumber, authority) {
  if (!cpNumber) return null

  try {
    // Extract year and number from CP (e.g., CP22/5 → year=22, num=5)
    const match = cpNumber.match(/(CP|DP)(\d+)\/(\d+)/i)
    if (!match) return null

    const year = match[2]
    const num = match[3]

    await dbService.waitForInitialization()

    // Look for a PS with the same year/number pattern
    const result = await dbService.pool.query(`
      SELECT id, headline, url, published_date, ai_summary
      FROM regulatory_updates
      WHERE (
        headline ~* $1
        OR headline ILIKE $2
      )
      AND ($3 IS NULL OR authority = $3)
      ORDER BY published_date DESC
      LIMIT 1
    `, [`PS${year}/${num}`, `%policy statement%${year}/${num}%`, authority])

    if (result.rows.length > 0) {
      return {
        id: result.rows[0].id,
        headline: result.rows[0].headline,
        url: result.rows[0].url,
        publishedDate: result.rows[0].published_date,
        psNumber: `PS${year}/${num}`
      }
    }

    // Also try searching by headline keywords
    const keywordResult = await dbService.pool.query(`
      SELECT id, headline, url, published_date
      FROM regulatory_updates
      WHERE headline ~* '^PS\\d+/\\d+'
        AND ($1 IS NULL OR authority = $1)
        AND published_date > (
          SELECT published_date FROM regulatory_updates
          WHERE headline ILIKE $2
          LIMIT 1
        )
      ORDER BY published_date ASC
      LIMIT 3
    `, [authority, `%${cpNumber}%`])

    return keywordResult.rows.length > 0 ? {
      id: keywordResult.rows[0].id,
      headline: keywordResult.rows[0].headline,
      url: keywordResult.rows[0].url,
      publishedDate: keywordResult.rows[0].published_date,
      psNumber: keywordResult.rows[0].headline.match(/PS\d+\/\d+/i)?.[0]
    } : null

  } catch (error) {
    console.error('[consultationService] Error finding related PS:', error.message)
    return null
  }
}

// Get CP → PS transition status for all consultations
async function getTransitionStatus() {
  try {
    await dbService.waitForInitialization()

    // Find all CPs and their corresponding PSs
    const result = await dbService.pool.query(`
      WITH cps AS (
        SELECT
          id,
          headline,
          authority,
          published_date,
          (regexp_match(headline, '(CP|DP)(\\d+)/(\\d+)', 'i'))[1] as doc_type,
          (regexp_match(headline, '(CP|DP)(\\d+)/(\\d+)', 'i'))[2] as year,
          (regexp_match(headline, '(CP|DP)(\\d+)/(\\d+)', 'i'))[3] as num
        FROM regulatory_updates
        WHERE headline ~* '^(CP|DP)\\d+/\\d+'
      ),
      pss AS (
        SELECT
          id,
          headline,
          authority,
          published_date,
          (regexp_match(headline, 'PS(\\d+)/(\\d+)', 'i'))[1] as year,
          (regexp_match(headline, 'PS(\\d+)/(\\d+)', 'i'))[2] as num
        FROM regulatory_updates
        WHERE headline ~* '^PS\\d+/\\d+'
      )
      SELECT
        cps.id as cp_id,
        cps.headline as cp_headline,
        cps.authority,
        cps.published_date as cp_date,
        pss.id as ps_id,
        pss.headline as ps_headline,
        pss.published_date as ps_date
      FROM cps
      LEFT JOIN pss ON cps.year = pss.year AND cps.num = pss.num AND cps.authority = pss.authority
      ORDER BY cps.published_date DESC
      LIMIT 100
    `)

    return result.rows.map(row => ({
      cpId: row.cp_id,
      cpHeadline: row.cp_headline,
      cpDate: row.cp_date,
      authority: row.authority,
      hasPolicy: !!row.ps_id,
      psId: row.ps_id,
      psHeadline: row.ps_headline,
      psDate: row.ps_date,
      transitionDays: row.ps_date && row.cp_date
        ? Math.floor((new Date(row.ps_date) - new Date(row.cp_date)) / (1000 * 60 * 60 * 24))
        : null
    }))
  } catch (error) {
    console.error('[consultationService] Error getting transition status:', error)
    return []
  }
}

// Get distinct authorities that have consultations
async function getConsultationAuthorities() {
  try {
    await dbService.waitForInitialization()
    const result = await dbService.pool.query(`
      SELECT DISTINCT authority
      FROM regulatory_updates
      WHERE (
        content_type ILIKE '%consultation%'
        OR headline ILIKE 'CP%/%'
        OR headline ILIKE '%consultation%'
      )
      AND authority IS NOT NULL
      ORDER BY authority
    `)

    return result.rows.map(r => r.authority)
  } catch (error) {
    console.error('[consultationService] Error getting authorities:', error)
    return ['FCA', 'PRA', 'BoE', 'PSR']
  }
}

module.exports = {
  getConsultations,
  getConsultationSummary,
  generateConsultationAnalysis,
  getConsultationAuthorities,
  calculateDaysRemaining,
  getConsultationStatus,
  findRelatedPolicyStatement,
  getTransitionStatus,
  extractApplicability
}
