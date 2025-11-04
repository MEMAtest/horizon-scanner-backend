function applyHelperMethods(ServiceClass) {
  ServiceClass.prototype.determineCategory = function(update) {
    const headline = (update.headline || '').toLowerCase()
    const impact = (update.impact || '').toLowerCase()
    const content = headline + ' ' + impact

    if (content.includes('consultation') || content.includes('cp')) return 'Consultations'
    if (content.includes('guidance') || content.includes('fg')) return 'Guidance'
    if (content.includes('policy') || content.includes('ps')) return 'Policy Statements'
    if (content.includes('enforcement') || content.includes('fine') || content.includes('penalty')) return 'Enforcement'
    if (content.includes('speech') || content.includes('remarks')) return 'Speeches'
    if (content.includes('report') || content.includes('review')) return 'Reports'
    if (content.includes('rule') || content.includes('regulation') || content.includes('directive')) return 'Rules & Regulations'
    if (content.includes('warning') || content.includes('alert') || content.includes('notice')) return 'Warnings & Alerts'
    if (content.includes('update') || content.includes('change') || content.includes('amendment')) return 'Updates & Changes'
    if (content.includes('publication') || content.includes('document')) return 'Publications'

    return 'General'
  }

  ServiceClass.prototype.determineContentType = function(update) {
    const headline = (update.headline || '').toLowerCase()

    if (headline.includes('cp') || headline.includes('consultation')) return 'Consultation Paper'
    if (headline.includes('fg') || headline.includes('guidance')) return 'Final Guidance'
    if (headline.includes('ps') || headline.includes('policy')) return 'Policy Statement'
    if (headline.includes('speech') || headline.includes('remarks')) return 'Speech'
    if (headline.includes('tr') || headline.includes('report')) return 'Technical Report'
    if (headline.includes('warning') || headline.includes('alert')) return 'Warning Notice'
    if (headline.includes('press') || headline.includes('news')) return 'Press Release'
    if (headline.includes('update') || headline.includes('change')) return 'Update Notice'

    return 'General Document'
  }

  ServiceClass.prototype.determineSourceType = function(update) {
    if (update.sourceType) return update.sourceType

    const url = update.url || ''
    if (url.includes('rss') || update.sourceName?.includes('RSS')) return 'RSS Feed'
    if (url.includes('news') || url.includes('press')) return 'News Source'
    if (url.includes('publication') || url.includes('document')) return 'Official Publication'

    return 'Web Scraping'
  }

  ServiceClass.prototype.isCategoryRelevantToFirm = function(category, firmProfile) {
    if (!firmProfile || !firmProfile.primarySectors) return false

    const categoryRelevance = {
      'Rules & Regulations': ['Banking', 'Investment Management', 'Insurance'],
      Consultations: ['Banking', 'Investment Management', 'Capital Markets'],
      Enforcement: ['Banking', 'Investment Management', 'Insurance', 'Payments'],
      Guidance: ['Banking', 'Investment Management', 'Consumer Credit'],
      'Policy Statements': ['Banking', 'Investment Management', 'Capital Markets'],
      'Warnings & Alerts': ['Banking', 'Consumer Credit', 'Payments'],
      Reports: ['Banking', 'Investment Management', 'Capital Markets', 'Insurance']
    }

    const relevantSectors = categoryRelevance[category] || []
    return firmProfile.primarySectors.some(sector => relevantSectors.includes(sector))
  }

  ServiceClass.prototype.getAuthorityCategories = function(authority, updates) {
    const categoryCount = {}
    updates.forEach(update => {
      if (update.authority === authority) {
        const category = this.determineCategory(update)
        categoryCount[category] = (categoryCount[category] || 0) + 1
      }
    })

    return Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category, count]) => ({ category, count }))
  }

  ServiceClass.prototype.calculateConfidence = function(recentCount, totalCount) {
    if (totalCount < 5) return Math.min(40, recentCount * 10)
    if (totalCount < 20) return Math.min(70, 30 + recentCount * 5)
    return Math.min(90, 50 + recentCount * 3)
  }

  ServiceClass.prototype.calculateOverallConfidence = function(predictions) {
    if (predictions.length === 0) return 0
    const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length
    return Math.round(avgConfidence)
  }

  ServiceClass.prototype.extractKeywords = function(text) {
    const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']
    return text.toLowerCase()
      .match(/\b[a-z]{3,}\b/g)
      ?.filter(word => !stopWords.includes(word))
      ?.slice(0, 10) || []
  }

  ServiceClass.prototype.guessAffectedSectors = function(keyword) {
    const sectorKeywords = {
      consumer: ['Banking', 'Consumer Credit', 'Investment Management'],
      capital: ['Banking', 'Investment Management', 'Capital Markets'],
      crypto: ['Cryptocurrency', 'Payments'],
      esg: ['Investment Management', 'Banking', 'Insurance'],
      pension: ['Pensions'],
      insurance: ['Insurance'],
      mortgage: ['Mortgages', 'Consumer Credit']
    }

    for (const [key, sectors] of Object.entries(sectorKeywords)) {
      if (keyword.includes(key)) return sectors
    }

    return ['General']
  }

  ServiceClass.prototype.getAuthoritySectors = function(authority) {
    const authoritySectors = {
      FCA: ['Banking', 'Investment Management', 'Consumer Credit', 'Insurance'],
      BoE: ['Banking', 'Capital Markets'],
      PRA: ['Banking', 'Insurance'],
      TPR: ['Pensions'],
      SFO: ['Banking', 'Capital Markets'],
      FATF: ['Banking', 'Cryptocurrency', 'Payments']
    }

    return authoritySectors[authority] || ['General']
  }

  ServiceClass.prototype.calculateRiskScore = function(update, firmProfile = null) {
    let riskScore = 0

    const authorityWeights = {
      FCA: 40,
      BoE: 35,
      PRA: 35,
      TPR: 25,
      SFO: 30,
      FATF: 20
    }

    riskScore += authorityWeights[update.authority] || 20

    const urgencyMultipliers = {
      High: 1.5,
      Medium: 1.0,
      Low: 0.7
    }

    riskScore *= urgencyMultipliers[update.urgency] || 1.0

    const impactBoosts = {
      Significant: 40,
      Moderate: 20,
      Informational: 0
    }

    riskScore += impactBoosts[update.impactLevel] || 0

    const category = this.determineCategory(update)
    const categoryRiskMultipliers = {
      Enforcement: 1.3,
      'Rules & Regulations': 1.2,
      'Warnings & Alerts': 1.25,
      'Policy Statements': 1.1,
      Consultations: 0.9,
      Speeches: 0.8,
      General: 1.0
    }

    riskScore *= categoryRiskMultipliers[category] || 1.0

    if (firmProfile && firmProfile.primarySectors && update.primarySectors) {
      const sectorMatch = update.primarySectors.some(sector =>
        firmProfile.primarySectors.includes(sector)
      )
      if (sectorMatch) {
        riskScore *= 1.4
      }
    }

    const daysSinceUpdate = (Date.now() - new Date(update.fetchedDate)) / (1000 * 60 * 60 * 24)
    if (daysSinceUpdate <= 7) {
      riskScore *= 1.2
    }

    const highImpactKeywords = [
      'deadline', 'implementation', 'compliance', 'enforcement',
      'penalty', 'fine', 'requirement', 'mandatory', 'consumer duty',
      'basel', 'mifid', 'gdpr', 'esg', 'reporting'
    ]

    const text = (update.headline + ' ' + update.impact).toLowerCase()
    const keywordMatches = highImpactKeywords.filter(keyword => text.includes(keyword))
    riskScore += keywordMatches.length * 5

    return Math.min(100, Math.max(0, Math.round(riskScore)))
  }

  ServiceClass.prototype.calculatePreparationTime = function(deadline, update) {
    const daysUntil = (new Date(deadline.date) - new Date()) / (1000 * 60 * 60 * 24)
    const complexity = this.getImpactScore(update)

    if (complexity >= 6) return Math.max(21, Math.round(daysUntil * 0.6)) + ' days recommended'
    if (complexity >= 4) return Math.max(14, Math.round(daysUntil * 0.4)) + ' days recommended'
    return Math.max(7, Math.round(daysUntil * 0.3)) + ' days recommended'
  }

  ServiceClass.prototype.getImpactScore = function(update) {
    const impactScores = { Significant: 3, Moderate: 2, Informational: 1 }
    const urgencyScores = { High: 3, Medium: 2, Low: 1 }

    const impact = impactScores[update.impactLevel] || 1
    const urgency = urgencyScores[update.urgency] || 1

    return impact * urgency
  }
}

module.exports = applyHelperMethods
