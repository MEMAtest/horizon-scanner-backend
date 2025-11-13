const { INDUSTRY_SECTORS } = require('./constants')

function applyFallbackMethods(ServiceClass) {
  ServiceClass.prototype.createEnhancedFallbackAnalysis = function(content, url, metadata = {}) {
    console.log('🔄 Creating enhanced fallback analysis')

    const text = (content || '').toLowerCase()
    const authority = metadata.authority || 'Unknown'

    let impactLevel = 'Informational'
    let urgency = 'Low'
    let businessImpactScore = 3

    if (text.includes('final rule') || text.includes('regulation') || text.includes('mandatory')) {
      impactLevel = 'Significant'
      urgency = 'High'
      businessImpactScore = 7
    } else if (text.includes('guidance') || text.includes('update') || text.includes('requirements')) {
      impactLevel = 'Moderate'
      urgency = 'Medium'
      businessImpactScore = 5
    }

    if (text.includes('deadline') || text.includes('implementation date') || text.includes('effective date')) {
      urgency = urgency === 'Low' ? 'Medium' : 'High'
      businessImpactScore += 1
    }

    const detectedSectors = []
    INDUSTRY_SECTORS.forEach(sector => {
      if (text.includes(sector.toLowerCase()) ||
          text.includes(sector.toLowerCase().replace(/\s+/g, ''))) {
        detectedSectors.push(sector)
      }
    })

    if (detectedSectors.length === 0) {
      detectedSectors.push('Banking')
    }

    const sectorRelevanceScores = {}
    detectedSectors.forEach(sector => {
      sectorRelevanceScores[sector] = 75
    })

    const fallbackAnalysis = {
      headline: this.generateFallbackHeadline(content, authority),
      impact: this.generateFallbackImpact(content || '', impactLevel),
      area: this.detectRegulatoryArea(content || ''),
      impactLevel,
      urgency,
      sector: detectedSectors[0],
      primarySectors: detectedSectors,
      sectorRelevanceScores,
      keyDates: this.extractFallbackDates(content || ''),
      complianceActions: this.generateFallbackActions(content || ''),
      riskLevel: businessImpactScore >= 7 ? 'High' : businessImpactScore >= 5 ? 'Medium' : 'Low',
      businessImpactScore,
      aiConfidenceScore: 0.6,
      aiTags: this.generateAITags(
        { impactLevel, urgency, primarySectors: detectedSectors, area: this.detectRegulatoryArea(content || '') },
        content || ''
      ),
      implementationPhases: this.generateImplementationPhases({ impactLevel, area: this.detectRegulatoryArea(content || '') }),
      requiredResources: this.calculateRequiredResources({ impactLevel }, businessImpactScore),
      firmTypesAffected: detectedSectors,
      contentType: this.detectContentType(content || '', url || '', metadata),
      fallbackAnalysis: true,
      enhancedAt: new Date().toISOString()
    }

    return fallbackAnalysis
  }

  ServiceClass.prototype.generateFallbackHeadline = function(content, authority) {
    const lines = (content || '').split('\n').filter(line => line.trim().length > 0)
    const firstLine = lines[0] || 'Regulatory Update'

    let headline = firstLine.substring(0, 100).trim()
    if (headline.length < 20 && lines.length > 1) {
      headline = lines[1].substring(0, 100).trim()
    }

    if (authority && authority !== 'Unknown' && !headline.toLowerCase().includes(authority.toLowerCase())) {
      headline = `${authority}: ${headline}`
    }

    return headline.substring(0, 120)
  }

  ServiceClass.prototype.generateFallbackImpact = function(content, impactLevel) {
    const cleanText = (content || '')
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,!?;:-]/g, '')
      .trim()

    const sentences = cleanText.split(/[.!?]+/)
    let meaningfulText = sentences[0] || cleanText.substring(0, 150)

    if (meaningfulText.length < 50 && sentences.length > 1) {
      meaningfulText = sentences.slice(0, 2).join('. ')
    }

    if (meaningfulText.length > 200) {
      meaningfulText = meaningfulText.substring(0, 200).trim() + '...'
    }

    if (impactLevel === 'Significant') {
      return `Significant regulatory development requiring attention: ${meaningfulText}`
    } else if (impactLevel === 'Moderate') {
      return `Regulatory update impacting business operations: ${meaningfulText}`
    }
    return `Informational regulatory update: ${meaningfulText}`
  }

  ServiceClass.prototype.detectRegulatoryArea = function(content) {
    const text = (content || '').toLowerCase()

    const areas = [
      { keywords: ['capital', 'capital requirements', 'basel'], area: 'Capital Requirements' },
      { keywords: ['conduct', 'treating customers fairly', 'consumer'], area: 'Conduct of Business' },
      { keywords: ['anti-money laundering', 'aml', 'financial crime'], area: 'Financial Crime' },
      { keywords: ['data protection', 'gdpr', 'privacy'], area: 'Data Protection' },
      { keywords: ['market abuse', 'insider dealing', 'market integrity'], area: 'Market Abuse' },
      { keywords: ['prudential', 'prudential regulation', 'safety and soundness'], area: 'Prudential Regulation' },
      { keywords: ['operational resilience', 'business continuity'], area: 'Operational Resilience' },
      { keywords: ['remuneration', 'bonus', 'variable pay'], area: 'Remuneration' },
      { keywords: ['governance', 'senior managers regime', 'smr'], area: 'Governance' },
      { keywords: ['reporting', 'regulatory reporting', 'returns'], area: 'Regulatory Reporting' }
    ]

    for (const areaData of areas) {
      if (areaData.keywords.some(keyword => text.includes(keyword))) {
        return areaData.area
      }
    }

    return 'General Regulation'
  }

  ServiceClass.prototype.extractFallbackDates = function(content) {
    const dateRegex = /(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}|\d{4}[/.-]\d{1,2}[/.-]\d{1,2}|\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/gi
    const matches = (content || '').match(dateRegex) || []

    if (matches.length > 0) {
      return `Key dates mentioned: ${matches.slice(0, 3).join(', ')}`
    }

    return 'No specific dates identified'
  }

  ServiceClass.prototype.generateFallbackActions = function(content) {
    const text = (content || '').toLowerCase()
    const actions = []

    if (text.includes('consultation')) {
      actions.push('Review consultation and consider response')
    }
    if (text.includes('deadline') || text.includes('implementation')) {
      actions.push('Note deadline and plan implementation')
    }
    if (text.includes('guidance')) {
      actions.push('Review guidance and assess compliance implications')
    }
    if (text.includes('rule') || text.includes('regulation')) {
      actions.push('Conduct gap analysis and update policies')
    }

    if (actions.length === 0) {
      actions.push('Review for potential business impact')
    }

    return actions.join('; ')
  }

  ServiceClass.prototype.detectContentType = function(content, url, metadata = {}) {
    const text = (content || '').toLowerCase()
    const urlLower = (url || '').toLowerCase()
    const headline = ((content || '').split('\n')[0] || '').toLowerCase()

    // Check URL patterns first (most reliable)
    if (urlLower.includes('/speech') || urlLower.includes('/speeches')) {
      return 'Speech'
    }
    if (urlLower.includes('/consultation') || urlLower.includes('/cp')) {
      return 'Consultation'
    }
    if (urlLower.includes('/press-release') || urlLower.includes('/news')) {
      return 'Press Release'
    }
    if (urlLower.includes('/guidance')) {
      return 'Guidance'
    }
    if (urlLower.includes('/enforcement') || urlLower.includes('/enforcement-action')) {
      return 'Enforcement Action'
    }
    if (urlLower.includes('/statistics') || urlLower.includes('/data')) {
      return 'Statistical Report'
    }
    if (urlLower.includes('/publication')) {
      return 'Research Paper'
    }

    // Check headline keywords
    if (headline.includes(' speech') || headline.includes('remarks by') || headline.includes('keynote')) {
      return 'Speech'
    }
    if (headline.includes('consultation') || headline.includes('discussion paper')) {
      return 'Consultation'
    }
    if (headline.includes('final rule') || headline.includes('policy statement')) {
      return 'Final Rule'
    }
    if (headline.includes('guidance') || headline.includes('supervisory statement')) {
      return 'Guidance'
    }
    if (headline.includes('enforcement') || headline.includes('fine') || headline.includes('penalty')) {
      return 'Enforcement Action'
    }
    if (headline.includes('press release') || headline.includes('announcement')) {
      return 'Press Release'
    }
    if (headline.includes('statistics') || headline.includes('quarterly data') || headline.includes('annual report')) {
      return 'Statistical Report'
    }
    if (headline.includes('research') || headline.includes('working paper') || headline.includes('report')) {
      return 'Research Paper'
    }
    if (headline.includes('market notice')) {
      return 'Market Notice'
    }
    if (headline.includes('event') || headline.includes('webinar') || headline.includes('conference')) {
      return 'Event'
    }

    // Check content keywords
    if (text.includes('consultation paper') || text.includes('feedback requested')) {
      return 'Consultation'
    }
    if (text.includes('final rule') || text.includes('statutory instrument')) {
      return 'Final Rule'
    }
    if (text.includes('supervisory guidance') || text.includes('best practice')) {
      return 'Guidance'
    }
    if (text.includes('enforcement action') || text.includes('disciplinary action')) {
      return 'Enforcement Action'
    }

    // Default to Other if no pattern matches
    return 'Other'
  }
}

module.exports = applyFallbackMethods
