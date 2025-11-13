// src/services/relevanceService.js
// Enhanced Relevance Service with Content-Based Priority Assignment
// UPGRADE: Automatic priority assignment based on content type + deadline awareness

const dbService = require('./dbService')
const profileService = require('./profileService')
const { normalizeSectorName } = require('../utils/sectorTaxonomy')

const BEHAVIOUR_WEIGHT_TYPES = ['authority', 'theme', 'persona', 'workflow_template']

function coerceArray(value) {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.filter(Boolean)
  }
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()]
  }
  return []
}

function normalizeProfileInput(profileInput) {
  if (!profileInput || typeof profileInput !== 'object') {
    return null
  }

  if (Array.isArray(profileInput.primarySectors)) {
    return {
      ...profileInput,
      primarySectors: profileInput.primarySectors
        .map(normalizeSectorName)
        .filter(Boolean),
      regions: coerceArray(profileInput.regions),
      personas: coerceArray(profileInput.personas).map(value => String(value).toLowerCase()),
      goals: coerceArray(profileInput.goals),
      serviceType: profileInput.serviceType || profileInput.firmType || null
    }
  }

  const serviceType = profileInput.serviceType || profileInput.firmType || 'general_financial_services'
  const sectors = [
    serviceType,
    ...coerceArray(profileInput.secondaryServiceTypes)
  ]
    .map(normalizeSectorName)
    .filter(Boolean)

  return {
    primarySectors: sectors,
    companySize: profileInput.companySize || profileInput.firmSize || null,
    regions: coerceArray(profileInput.regions),
    personas: coerceArray(profileInput.personas).map(value => String(value).toLowerCase()),
    goals: coerceArray(profileInput.goals),
    serviceType,
    relevanceOverrides: profileInput.relevanceOverrides || {}
  }
}

function createBehaviourWeightMap() {
  return {
    authority: new Map(),
    theme: new Map(),
    persona: new Map(),
    workflow_template: new Map()
  }
}

function normalizeBehaviourWeights(input) {
  const weights = createBehaviourWeightMap()
  if (!input) return weights

  if (Array.isArray(input)) {
    input.forEach(entry => {
      if (!entry) return
      const entityType = String(entry.entityType || entry.entity_type || '').trim().toLowerCase()
      const entityId = String(entry.entityId || entry.entity_id || '').trim().toLowerCase()
      if (!entityId || !BEHAVIOUR_WEIGHT_TYPES.includes(entityType)) return
      const weight = Number(entry.weight || 0)
      if (!Number.isFinite(weight)) return
      weights[entityType].set(entityId, weight)
    })
    return weights
  }

  BEHAVIOUR_WEIGHT_TYPES.forEach(type => {
    const source = input[type]
    if (!source) return
    if (source instanceof Map) {
      source.forEach((value, key) => {
        if (key) weights[type].set(String(key).toLowerCase(), Number(value || 0))
      })
    } else if (typeof source === 'object') {
      Object.entries(source).forEach(([key, value]) => {
        if (!key) return
        weights[type].set(String(key).toLowerCase(), Number(value || 0))
      })
    }
  })

  return weights
}

function getBehaviourWeight(weights, type, key) {
  if (!key || !weights || !weights[type]) return 0
  const normalizedKey = String(key).trim().toLowerCase()
  return weights[type].get(normalizedKey) || 0
}

function convertWeightToBoost(weight) {
  if (!weight) return 0
  const scaled = Math.tanh(weight / 6)
  return scaled * 12
}

function extractUpdateThemes(update) {
  const themes = new Set()
  const tags = Array.isArray(update.ai_tags) ? update.ai_tags : []
  tags.forEach(tag => {
    if (!tag || typeof tag !== 'string') return
    const trimmed = tag.trim()
    if (!trimmed) return
    if (trimmed.startsWith('persona:')) return
    const theme = trimmed.includes(':') ? trimmed.split(':').pop() : trimmed
    if (theme) themes.add(theme.toLowerCase())
  })
  const explicitThemes = Array.isArray(update.themes) ? update.themes : []
  explicitThemes.forEach(theme => {
    if (!theme) return
    themes.add(String(theme).trim().toLowerCase())
  })
  if (update.theme) themes.add(String(update.theme).trim().toLowerCase())
  if (update.area) themes.add(String(update.area).trim().toLowerCase())
  if (update.sector) themes.add(String(update.sector).trim().toLowerCase())
  return Array.from(themes).filter(Boolean)
}

function extractUpdatePersonas(update) {
  if (Array.isArray(update.personas) && update.personas.length) {
    return update.personas.map(persona => String(persona).trim().toLowerCase()).filter(Boolean)
  }
  const tags = Array.isArray(update.ai_tags) ? update.ai_tags : []
  return tags
    .filter(tag => typeof tag === 'string' && tag.startsWith('persona:'))
    .map(tag => tag.split(':')[1])
    .filter(Boolean)
    .map(value => value.trim().toLowerCase())
}

function normalizeRelevanceContext(context) {
  if (!context || typeof context !== 'object') {
    return {
      profile: normalizeProfileInput(context),
      behaviourWeights: createBehaviourWeightMap()
    }
  }

  const profileCandidate = context.profile !== undefined ? context.profile : context
  const profile = normalizeProfileInput(profileCandidate)
  const behaviourSource = context.behaviourWeights || context.behaviour || profileCandidate?.behaviourWeights || null
  const behaviourWeights = normalizeBehaviourWeights(behaviourSource)

  return { profile, behaviourWeights }
}

function calculateBehaviourBoost(update, behaviourWeights) {
  if (!behaviourWeights) return 0
  let boost = 0

  const authority = update.authority || update.update_authority
  if (authority) {
    const weight = getBehaviourWeight(behaviourWeights, 'authority', authority)
    boost += convertWeightToBoost(weight)
  }

  extractUpdateThemes(update).forEach(theme => {
    const weight = getBehaviourWeight(behaviourWeights, 'theme', theme)
    boost += convertWeightToBoost(weight)
  })

  extractUpdatePersonas(update).forEach(persona => {
    const weight = getBehaviourWeight(behaviourWeights, 'persona', persona)
    boost += convertWeightToBoost(weight)
  })

  if (update.workflowTemplateId) {
    const weight = getBehaviourWeight(behaviourWeights, 'workflow_template', update.workflowTemplateId)
    boost += convertWeightToBoost(weight)
  }

  return Math.max(-15, Math.min(15, boost))
}

class RelevanceService {
  constructor() {
    this.firmProfile = null
    this.lastProfileCheck = null
  }

  // ====== ENHANCED RELEVANCE CALCULATION WITH CONTENT-BASED PRIORITY ======

  calculateRelevanceScore(update, profileContext) {
    const { profile: firmProfile, behaviourWeights } = normalizeRelevanceContext(profileContext)
    // Step 1: Get content-based priority assignment
    const contentPriority = this.getContentBasedPriority(update)

    // Step 2: Apply content priority baseline score
    let relevanceScore = this.getContentPriorityBaseScore(contentPriority)

    // Step 3: Apply firm-specific adjustments
    if (firmProfile && firmProfile.primarySectors && firmProfile.primarySectors.length > 0) {
      relevanceScore = this.applyFirmSpecificAdjustments(relevanceScore, update, firmProfile)
    } else {
      relevanceScore = this.getDefaultRelevance(update, contentPriority)
    }

    // Step 4: Apply authority-based adjustments
    const authorityAdjustment = this.getAuthorityRelevance(update.authority, firmProfile)
    relevanceScore = Math.max(relevanceScore, authorityAdjustment)

    // Step 5: Apply impact and urgency bonuses
    relevanceScore += this.getImpactBonus(update.impactLevel)
    relevanceScore += this.getUrgencyBonus(update.urgency)

    // Step 6: Apply deadline awareness for consultations
    if (contentPriority === 'consultation_deadline_aware') {
      relevanceScore += this.getDeadlineUrgencyBonus(update)
    }

    // Step 7: Final content-specific adjustments
    relevanceScore = this.applyContentSpecificAdjustments(relevanceScore, update, contentPriority)

    // Step 8: Behavioural boosts weighted by user interactions
    relevanceScore += calculateBehaviourBoost(update, behaviourWeights)

    return Math.min(100, Math.max(0, Math.round(relevanceScore)))
  }

  // ====== CONTENT-BASED PRIORITY ASSIGNMENT ======

  getContentBasedPriority(update) {
    const headline = (update.headline || '').toLowerCase()
    const impact = (update.impact || '').toLowerCase()
    const content = headline + ' ' + impact

    // FINES/ENFORCEMENT → Auto-assign High Priority
    if (this.isEnforcementContent(content)) {
      return 'high_priority_enforcement'
    }

    // SPEECHES → Auto-assign Background Intel
    if (this.isSpeechContent(content, headline)) {
      return 'background_intel_speech'
    }

    // CONSULTATIONS → Medium priority with deadline awareness
    if (this.isConsultationContent(content, headline)) {
      return 'consultation_deadline_aware'
    }

    // POLICY UPDATES → Dynamic priority based on impact
    if (this.isPolicyUpdateContent(content, headline)) {
      return this.getDynamicPolicyPriority(update)
    }

    // GUIDANCE DOCUMENTS → Medium priority
    if (this.isGuidanceContent(content, headline)) {
      return 'medium_priority_guidance'
    }

    // WARNINGS/ALERTS → High priority
    if (this.isWarningContent(content, headline)) {
      return 'high_priority_warning'
    }

    // DEFAULT → Standard processing
    return 'standard_processing'
  }

  // ====== CONTENT TYPE DETECTION METHODS ======

  isEnforcementContent(content) {
    const enforcementKeywords = [
      'fine', 'fined', 'penalty', 'penalties', 'enforcement action',
      'enforcement notice', 'disciplinary action', 'sanctions',
      'prohibition order', 'censure', 'public censure',
      'enforcement investigation', 'regulatory breach',
      'compliance failure', 'enforcement proceedings',
      'final notice', 'decision notice', 'warning notice'
    ]

    return enforcementKeywords.some(keyword => content.includes(keyword))
  }

  isSpeechContent(content, headline) {
    const speechKeywords = [
      'speech', 'remarks', 'speaking at', 'keynote',
      'address', 'presentation', 'delivered at',
      'conference speech', 'spoke at', 'speaking notes'
    ]

    // More weight to headline for speech detection
    return speechKeywords.some(keyword =>
      headline.includes(keyword) || content.includes(keyword)
    )
  }

  isConsultationContent(content, headline) {
    const consultationKeywords = [
      'consultation', 'cp', 'consultation paper',
      'call for input', 'seeking views', 'feedback',
      'comment period', 'public consultation',
      'consultation on', 'responses invited'
    ]

    return consultationKeywords.some(keyword => content.includes(keyword))
  }

  isPolicyUpdateContent(content, headline) {
    const policyKeywords = [
      'policy statement', 'ps', 'policy update',
      'new policy', 'policy change', 'policy guidance',
      'regulatory policy', 'policy announcement',
      'policy clarification', 'updated policy'
    ]

    return policyKeywords.some(keyword => content.includes(keyword))
  }

  isGuidanceContent(content, headline) {
    const guidanceKeywords = [
      'guidance', 'fg', 'final guidance',
      'guidance note', 'guidance document',
      'supervisory guidance', 'regulatory guidance',
      'guidance update', 'guidance on'
    ]

    return guidanceKeywords.some(keyword => content.includes(keyword))
  }

  isWarningContent(content, headline) {
    const warningKeywords = [
      'warning', 'alert', 'caution', 'notice',
      'regulatory alert', 'warning notice',
      'public warning', 'risk alert',
      'supervisory notice', 'urgent notice'
    ]

    return warningKeywords.some(keyword => content.includes(keyword))
  }

  // ====== DYNAMIC POLICY PRIORITY ASSESSMENT ======

  getDynamicPolicyPriority(update) {
    const impactLevel = update.impactLevel || ''
    const urgency = update.urgency || ''
    const content = (update.headline + ' ' + update.impact).toLowerCase()

    // High priority policy updates
    if (impactLevel === 'Significant' || urgency === 'High') {
      return 'high_priority_policy'
    }

    // Check for implementation deadlines or immediate effect
    if (content.includes('immediate effect') ||
            content.includes('comes into force') ||
            content.includes('implementation date') ||
            content.includes('must comply by')) {
      return 'high_priority_policy'
    }

    // Medium priority for moderate impact
    if (impactLevel === 'Moderate' || urgency === 'Medium') {
      return 'medium_priority_policy'
    }

    // Background for informational policies
    return 'background_intel_policy'
  }

  // ====== CONTENT PRIORITY BASE SCORES ======

  getContentPriorityBaseScore(contentPriority) {
    const baseScores = {
      high_priority_enforcement: 90, // Fines/Enforcement → High Priority
      high_priority_warning: 85, // Warnings/Alerts → High Priority
      high_priority_policy: 80, // Significant Policy Updates → High Priority
      consultation_deadline_aware: 65, // Consultations → Medium with deadline awareness
      medium_priority_guidance: 60, // Guidance → Medium Priority
      medium_priority_policy: 55, // Moderate Policy Updates → Medium Priority
      background_intel_speech: 30, // Speeches → Background Intel
      background_intel_policy: 35, // Informational Policies → Background Intel
      standard_processing: 50 // Default → Standard processing
    }

    return baseScores[contentPriority] || 50
  }

  // ====== DEADLINE AWARENESS FOR CONSULTATIONS ======

  getDeadlineUrgencyBonus(update) {
    const content = (update.headline + ' ' + update.impact + ' ' + (update.keyDates || '')).toLowerCase()
    const deadlineBonus = this.calculateDeadlineUrgency(content)

    console.log(`📅 Consultation deadline bonus: +${deadlineBonus} for "${update.headline.substring(0, 50)}..."`)
    return deadlineBonus
  }

  calculateDeadlineUrgency(content) {
    // Extract potential deadline dates
    const datePatterns = [
      /(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/gi,
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/g,
      /(\d{4})-(\d{1,2})-(\d{1,2})/g,
      /by\s+(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)/gi,
      /deadline\s+(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)/gi
    ]

    let closestDeadline = null
    const now = new Date()

    datePatterns.forEach(pattern => {
      const matches = content.match(pattern)
      if (matches) {
        matches.forEach(match => {
          const date = new Date(match)
          if (date > now && date < new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)) {
            if (!closestDeadline || date < closestDeadline) {
              closestDeadline = date
            }
          }
        })
      }
    })

    if (!closestDeadline) {
      // Default bonus for consultations without clear deadlines
      return 5
    }

    // Calculate urgency based on days until deadline
    const daysUntilDeadline = (closestDeadline - now) / (1000 * 60 * 60 * 24)

    if (daysUntilDeadline <= 7) {
      return 20 // Very urgent - deadline within a week
    } else if (daysUntilDeadline <= 14) {
      return 15 // Urgent - deadline within two weeks
    } else if (daysUntilDeadline <= 30) {
      return 10 // Moderate urgency - deadline within a month
    } else if (daysUntilDeadline <= 60) {
      return 5 // Some urgency - deadline within two months
    }

    return 0 // No urgency bonus for distant deadlines
  }

  // ====== CONTENT-SPECIFIC ADJUSTMENTS ======

  applyContentSpecificAdjustments(relevanceScore, update, contentPriority) {
    // Enforcement actions get additional sector-specific boosts
    if (contentPriority === 'high_priority_enforcement') {
      // Financial penalties are more relevant to all financial firms
      const content = (update.headline + ' ' + update.impact).toLowerCase()
      if (content.includes('financial penalty') || content.includes('£')) {
        relevanceScore += 5
      }

      // Individual vs firm enforcement
      if (content.includes('individual') && !content.includes('firm')) {
        relevanceScore -= 5 // Individual enforcement less relevant to firms
      }
    }

    // Speeches get reduced relevance unless they're from senior officials
    if (contentPriority === 'background_intel_speech') {
      const content = (update.headline + ' ' + update.impact).toLowerCase()
      const seniorOfficials = [
        'governor', 'deputy governor', 'chief executive', 'ceo',
        'chairman', 'chair', 'director general', 'executive director'
      ]

      const isSeniorOfficial = seniorOfficials.some(title => content.includes(title))
      if (isSeniorOfficial) {
        relevanceScore += 10 // Senior official speeches more relevant
      } else {
        relevanceScore -= 5 // Junior official speeches less relevant
      }
    }

    // Policy updates get timing-based adjustments
    if (contentPriority.includes('policy')) {
      const content = (update.headline + ' ' + update.impact).toLowerCase()

      // Future effective dates reduce immediate relevance
      if (content.includes('2026') || content.includes('2027')) {
        relevanceScore -= 10 // Future implementation
      } else if (content.includes('2025')) {
        relevanceScore += 5 // Near-term implementation
      }

      // Draft policies are less relevant than final
      if (content.includes('draft') || content.includes('proposed')) {
        relevanceScore -= 8
      }
    }

    return relevanceScore
  }

  // ====== ENHANCED FIRM-SPECIFIC ADJUSTMENTS ======

  applyFirmSpecificAdjustments(baseScore, update, firmProfile) {
    let adjustedScore = baseScore

    // Use AI-calculated sector relevance scores if available
    if (update.sectorRelevanceScores && typeof update.sectorRelevanceScores === 'object') {
      const firmRelevance = this.calculateFromSectorScores(update.sectorRelevanceScores, firmProfile)
      // Blend content priority with sector relevance (70% content, 30% sector)
      adjustedScore = Math.round(baseScore * 0.7 + firmRelevance * 0.3)
    } else {
      // Basic sector matching with content priority preserved
      const sectorRelevance = this.calculateBasicSectorRelevance(update, firmProfile)
      // Apply sector boost but preserve content priority
      if (sectorRelevance > 50) {
        adjustedScore += Math.round((sectorRelevance - 50) * 0.3) // 30% sector boost
      }
    }

    return adjustedScore
  }

  calculateBasicSectorRelevance(update, firmProfile) {
    if (!firmProfile || !Array.isArray(firmProfile.primarySectors)) {
      return 40
    }

    const firmSectors = new Set(
      (firmProfile.primarySectors || [])
        .map(normalizeSectorName)
        .filter(Boolean)
    )

    if (firmSectors.size === 0) {
      return 40 // Low sector relevance when no firm sectors configured
    }

    // Check primary sectors match
    if (update.primarySectors && Array.isArray(update.primarySectors)) {
      const updateSectors = update.primarySectors
        .map(normalizeSectorName)
        .filter(Boolean)
      const hasDirectMatch = updateSectors.some(sector => firmSectors.has(sector))
      if (hasDirectMatch) {
        return 80 // High sector relevance
      }
    }

    // Check single sector field
    const singleSector = normalizeSectorName(update.sector)
    if (singleSector && firmSectors.has(singleSector)) {
      return 75 // High sector relevance
    }

    return 40 // Low sector relevance
  }

  // ====== ENHANCED CATEGORIZATION WITH CONTENT PRIORITY ======

  categorizeByRelevance(updates, firmProfile) {
    const categorized = {
      high: [], // 70-100: High Priority + High Relevance
      medium: [], // 40-69:  Medium Priority + Consultations + Moderate Relevance
      low: [] // 0-39:   Background Intel + Low Relevance
    }

    updates.forEach(update => {
      const relevanceScore = this.calculateRelevanceScore(update, firmProfile)
      const contentPriority = this.getContentBasedPriority(update)

      const updateWithEnhancedData = {
        ...update,
        relevanceScore,
        contentPriority,
        priorityReason: this.getPriorityReason(contentPriority, relevanceScore)
      }

      // Enhanced categorization logic
      if (relevanceScore >= 70 || contentPriority.startsWith('high_priority')) {
        categorized.high.push(updateWithEnhancedData)
      } else if (relevanceScore >= 40 || contentPriority.includes('medium') || contentPriority.includes('consultation')) {
        categorized.medium.push(updateWithEnhancedData)
      } else {
        categorized.low.push(updateWithEnhancedData)
      }
    })

    // Sort each category by relevance score (highest first)
    Object.keys(categorized).forEach(key => {
      categorized[key].sort((a, b) => {
        // Primary sort by content priority type
        const aPriorityWeight = this.getContentPriorityWeight(a.contentPriority)
        const bPriorityWeight = this.getContentPriorityWeight(b.contentPriority)

        if (aPriorityWeight !== bPriorityWeight) {
          return bPriorityWeight - aPriorityWeight
        }

        // Secondary sort by relevance score
        return b.relevanceScore - a.relevanceScore
      })
    })

    return categorized
  }

  getContentPriorityWeight(contentPriority) {
    const weights = {
      high_priority_enforcement: 100,
      high_priority_warning: 95,
      high_priority_policy: 90,
      consultation_deadline_aware: 70,
      medium_priority_guidance: 60,
      medium_priority_policy: 55,
      background_intel_speech: 20,
      background_intel_policy: 25,
      standard_processing: 50
    }

    return weights[contentPriority] || 50
  }

  getPriorityReason(contentPriority, relevanceScore) {
    const reasons = {
      high_priority_enforcement: 'Enforcement action requiring immediate attention',
      high_priority_warning: 'Regulatory warning with potential compliance impact',
      high_priority_policy: 'Significant policy change with business impact',
      consultation_deadline_aware: 'Consultation with approaching deadline',
      medium_priority_guidance: 'Regulatory guidance for compliance planning',
      medium_priority_policy: 'Policy update for monitoring',
      background_intel_speech: 'Strategic intelligence from regulatory speech',
      background_intel_policy: 'Informational policy update',
      standard_processing: `Relevance score: ${relevanceScore}%`
    }

    return reasons[contentPriority] || `Standard relevance scoring (${relevanceScore}%)`
  }

  // ====== EXISTING METHODS (MAINTAINED FOR COMPATIBILITY) ======

  calculateFromSectorScores(sectorRelevanceScores, firmProfile) {
    if (!firmProfile || !Array.isArray(firmProfile.primarySectors)) {
      return sectorRelevanceScores.General || 30
    }

    let maxScore = 0
    let totalScore = 0
    let matchCount = 0

    const normalizedFirmSectors = (firmProfile.primarySectors || [])
      .map(normalizeSectorName)
      .filter(Boolean)

    normalizedFirmSectors.forEach(firmSector => {
      if (sectorRelevanceScores[firmSector] !== undefined) {
        const score = sectorRelevanceScores[firmSector]
        maxScore = Math.max(maxScore, score)
        totalScore += score
        matchCount++
      }
    })

    if (matchCount === 0) {
      return sectorRelevanceScores.General || 30
    }

    const averageScore = totalScore / matchCount
    const bonusMultiplier = matchCount > 1 ? 1.1 : 1.0

    return Math.min(100, Math.round(Math.max(maxScore, averageScore) * bonusMultiplier))
  }

  getDefaultRelevance(update, contentPriority = 'standard_processing') {
    // Content priority now influences default relevance
    const basePriorityScore = this.getContentPriorityBaseScore(contentPriority)
    let score = basePriorityScore

    // Boost for high impact or urgent items
    if (update.impactLevel === 'Significant') score += 15
    if (update.urgency === 'High') score += 10

    // Authority-based defaults
    const authorityDefaults = {
      FCA: 60,
      BoE: 55,
      PRA: 55,
      TPR: 45,
      SFO: 40,
      FATF: 35
    }

    const authorityScore = authorityDefaults[update.authority] || 50
    return Math.max(score, authorityScore)
  }

  getAuthorityRelevance(authority, firmProfile) {
    const authorityRelevanceMap = {
      FCA: {
        Banking: 90,
        'Investment Management': 95,
        'Consumer Credit': 85,
        Insurance: 70,
        Payments: 80,
        Mortgages: 75,
        'Capital Markets': 90,
        Cryptocurrency: 85,
        Fintech: 85,
        General: 60
      },
      BoE: {
        Banking: 95,
        'Investment Management': 60,
        'Consumer Credit': 70,
        Insurance: 50,
        Payments: 75,
        'Capital Markets': 80,
        General: 55
      },
      PRA: {
        Banking: 95,
        'Investment Management': 80,
        Insurance: 90,
        'Capital Markets': 70,
        General: 55
      },
      TPR: {
        Pensions: 95,
        'Investment Management': 70,
        Banking: 40,
        Insurance: 60,
        General: 35
      },
      SFO: {
        Banking: 70,
        'Investment Management': 75,
        'Capital Markets': 80,
        General: 40
      },
      FATF: {
        Banking: 60,
        Payments: 70,
        Cryptocurrency: 85,
        General: 35
      }
    }

    const authorityMap = authorityRelevanceMap[authority]
    if (!authorityMap) return 40

    if (!firmProfile || !firmProfile.primarySectors) {
      return authorityMap.General || 40
    }

    let maxRelevance = 0
    firmProfile.primarySectors.forEach(sector => {
      if (authorityMap[sector]) {
        maxRelevance = Math.max(maxRelevance, authorityMap[sector])
      }
    })

    return maxRelevance || (authorityMap.General || 40)
  }

  getImpactBonus(impactLevel) {
    const bonuses = {
      Significant: 15,
      Moderate: 5,
      Informational: 0
    }
    return bonuses[impactLevel] || 0
  }

  getUrgencyBonus(urgency) {
    const bonuses = {
      High: 10,
      Medium: 5,
      Low: 0
    }
    return bonuses[urgency] || 0
  }

  // ====== PROFILE MANAGEMENT (MAINTAINED) ======

  async getFirmProfile() {
    const now = Date.now()

    if (this.firmProfile && this.lastProfileCheck && (now - this.lastProfileCheck) < 300000) {
      return this.firmProfile
    }

    try {
      const activeProfile = await profileService.getActiveProfile('default')
      this.firmProfile = normalizeProfileInput(activeProfile)
      this.lastProfileCheck = now
      return this.firmProfile
    } catch (error) {
      console.error('❌ Error fetching firm profile:', error)
      try {
        const legacyProfile = await dbService.getFirmProfile()
        this.firmProfile = normalizeProfileInput(legacyProfile)
        this.lastProfileCheck = now
        return this.firmProfile
      } catch (legacyError) {
        console.error('❌ Legacy firm profile fallback failed:', legacyError)
      }
      return null
    }
  }

  invalidateProfileCache() {
    this.firmProfile = null
    this.lastProfileCheck = null
  }

  // ====== STATISTICS AND INSIGHTS ======

  async getRelevanceStats() {
    try {
      const firmProfile = await this.getFirmProfile()
      const updates = await dbService.getAllUpdates()

      const categorized = this.categorizeByRelevance(updates, firmProfile)

      // Enhanced stats with content priority analysis
      const contentPriorityCounts = {}
      const allUpdatesWithPriority = [...categorized.high, ...categorized.medium, ...categorized.low]

      allUpdatesWithPriority.forEach(update => {
        const priority = update.contentPriority || 'standard_processing'
        contentPriorityCounts[priority] = (contentPriorityCounts[priority] || 0) + 1
      })

      const stats = {
        total: updates.length,
        high: categorized.high.length,
        medium: categorized.medium.length,
        low: categorized.low.length,
        averageRelevance: 0,
        firmProfile,
        contentPriorityBreakdown: contentPriorityCounts,
        enhancedFeatures: {
          contentBasedPriority: true,
          deadlineAwareness: true,
          dynamicPolicyPriority: true,
          enforcementDetection: true
        }
      }

      // Calculate average relevance
      if (updates.length > 0) {
        const totalRelevance = allUpdatesWithPriority
          .reduce((sum, update) => sum + update.relevanceScore, 0)
        stats.averageRelevance = Math.round(totalRelevance / updates.length)
      }

      return stats
    } catch (error) {
      console.error('❌ Error calculating enhanced relevance stats:', error)
      throw error
    }
  }

  async getSectorRelevanceInsights(targetSector) {
    try {
      const updates = await dbService.getAllUpdates()

      const sectorUpdates = updates.filter(update => {
        if (update.sectorRelevanceScores && update.sectorRelevanceScores[targetSector]) {
          return update.sectorRelevanceScores[targetSector] >= 50
        }

        if (update.primarySectors && update.primarySectors.includes(targetSector)) {
          return true
        }

        return update.sector === targetSector
      })

      // Enhanced insights with content priority analysis
      const contentPriorityDistribution = {}
      sectorUpdates.forEach(update => {
        const priority = this.getContentBasedPriority(update)
        contentPriorityDistribution[priority] = (contentPriorityDistribution[priority] || 0) + 1
      })

      return {
        sector: targetSector,
        totalUpdates: sectorUpdates.length,
        averageRelevance: this.calculateAverageSectorRelevance(sectorUpdates, targetSector),
        recentCount: this.getRecentCount(sectorUpdates),
        topAuthorities: this.getTopAuthorities(sectorUpdates),
        impactDistribution: this.getImpactDistribution(sectorUpdates),
        contentPriorityDistribution,
        enhancedAnalysis: {
          enforcementActions: contentPriorityDistribution.high_priority_enforcement || 0,
          consultations: contentPriorityDistribution.consultation_deadline_aware || 0,
          speeches: contentPriorityDistribution.background_intel_speech || 0,
          policyUpdates: (contentPriorityDistribution.high_priority_policy || 0) +
                                  (contentPriorityDistribution.medium_priority_policy || 0) +
                                  (contentPriorityDistribution.background_intel_policy || 0)
        }
      }
    } catch (error) {
      console.error(`❌ Error getting enhanced sector insights for ${targetSector}:`, error)
      throw error
    }
  }

  async recalculateAllRelevanceScores() {
    console.log('🔄 Recalculating relevance scores with enhanced content-based priority...')

    try {
      const firmProfile = await this.getFirmProfile()
      const updates = await dbService.getAllUpdates()

      let updatedCount = 0

      for (const update of updates) {
        const newRelevanceScore = this.calculateRelevanceScore(update, firmProfile)
        const contentPriority = this.getContentBasedPriority(update)

        if (newRelevanceScore !== update.relevanceScore) {
          update.relevanceScore = newRelevanceScore
          update.contentPriority = contentPriority
          await dbService.saveUpdate(update)
          updatedCount++
        }
      }

      console.log(`✅ Enhanced relevance recalculation completed: ${updatedCount} updates`)
      return {
        totalUpdates: updates.length,
        updatedCount,
        firmProfile,
        enhancedFeatures: {
          contentBasedPriority: true,
          deadlineAwareness: true,
          enforcementDetection: true
        }
      }
    } catch (error) {
      console.error('❌ Error recalculating enhanced relevance scores:', error)
      throw error
    }
  }

  // ====== HELPER METHODS (MAINTAINED) ======

  calculateAverageSectorRelevance(updates, sector) {
    if (updates.length === 0) return 0

    let totalRelevance = 0
    updates.forEach(update => {
      if (update.sectorRelevanceScores && update.sectorRelevanceScores[sector]) {
        totalRelevance += update.sectorRelevanceScores[sector]
      } else {
        totalRelevance += 50 // Default for legacy updates
      }
    })

    return Math.round(totalRelevance / updates.length)
  }

  getRecentCount(updates) {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    return updates.filter(update => {
      const updateDate = new Date(update.fetchedDate)
      return updateDate >= sevenDaysAgo
    }).length
  }

  getTopAuthorities(updates) {
    const authorityCount = {}
    updates.forEach(update => {
      const authority = update.authority || 'Unknown'
      authorityCount[authority] = (authorityCount[authority] || 0) + 1
    })

    return Object.entries(authorityCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([authority, count]) => ({ authority, count }))
  }

  getImpactDistribution(updates) {
    const distribution = { Significant: 0, Moderate: 0, Informational: 0 }
    updates.forEach(update => {
      const impact = update.impactLevel || 'Informational'
      if (Object.prototype.hasOwnProperty.call(distribution, impact)) {
        distribution[impact]++
      }
    })
    return distribution
  }
}

// Export singleton instance
const relevanceService = new RelevanceService()

module.exports = relevanceService
