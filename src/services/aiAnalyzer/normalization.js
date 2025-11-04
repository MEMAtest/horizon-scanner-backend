function applyNormalizationMethods(ServiceClass) {
  ServiceClass.prototype.normalizeAnalysisResult = function(analysis = {}, update = {}, metadata = {}) {
    const primarySectors = analysis.primarySectors || analysis.primary_sectors || []
    const aiTags = analysis.aiTags || analysis.ai_tags || []
    const sectorRelevanceScores = analysis.sectorRelevanceScores || analysis.sector_relevance_scores || {}
    const implementationPhases = analysis.implementationPhases || analysis.implementation_phases || []
    const requiredResources = analysis.requiredResources || analysis.required_resources || {}
    const firmTypesAffected = analysis.firmTypesAffected || analysis.firm_types_affected || primarySectors
    const affectedFirmSizes = analysis.affectedFirmSizes || analysis.affected_firm_sizes || []
    const keyDates = analysis.keyDates || analysis.key_dates || ''
    const complianceActions = analysis.complianceActions || analysis.compliance_actions || ''
    const businessOpportunities = analysis.businessOpportunities || analysis.business_opportunities || ''
    const implementationComplexity = analysis.implementationComplexity || analysis.implementation_complexity || ''

    const impactLevel = analysis.impactLevel || analysis.impact_level || 'Informational'
    const urgency = analysis.urgency || 'Medium'
    const sector = analysis.sector || primarySectors[0] || update.sector || 'General'
    const area = analysis.area || update.area || 'General Regulation'
    const headline = update.headline || update.title || analysis.headline || 'Regulatory Update'
    const aiSummary = analysis.ai_summary || analysis.impact || update.summary || update.description || 'Analysis pending'
    const businessImpactScore = typeof analysis.businessImpactScore === 'number'
      ? analysis.businessImpactScore
      : (analysis.business_impact_score || this.calculateBusinessImpactScore(analysis, aiSummary))
    const aiConfidenceScore = analysis.aiConfidenceScore || analysis.ai_confidence_score || analysis.confidence || 0.75
    const complianceDeadline = analysis.complianceDeadline || analysis.compliance_deadline || this.extractComplianceDeadline(keyDates)
    const enhancedAt = analysis.enhancedAt || new Date().toISOString()
    const aiModelUsed = analysis.aiModelUsed || this.currentModel

    const normalized = {
      headline,
      url: update.url,
      authority: metadata.authority || update.authority || 'Unknown',
      publishedDate: metadata.publishedDate || update.publishedDate || update.published_date || update.pubDate || null,
      area,
      category: area,
      sector,
      primarySectors,
      primary_sectors: primarySectors,
      ai_summary: aiSummary,
      impact: aiSummary,
      impactLevel,
      impact_level: impactLevel,
      urgency,
      keyDates,
      key_dates: keyDates,
      complianceActions,
      businessOpportunities,
      implementationComplexity,
      riskLevel: analysis.riskLevel || analysis.risk_level || 'Medium',
      affectedFirmSizes,
      firmTypesAffected,
      firm_types_affected: firmTypesAffected,
      businessImpactScore,
      business_impact_score: businessImpactScore,
      ai_tags: aiTags,
      aiTags,
      ai_confidence_score: aiConfidenceScore,
      aiConfidenceScore,
      sectorRelevanceScores,
      sector_relevance_scores: sectorRelevanceScores,
      implementationPhases,
      implementation_phases: implementationPhases,
      requiredResources,
      required_resources: requiredResources,
      complianceDeadline,
      compliance_deadline: complianceDeadline,
      aiModelUsed,
      fallbackAnalysis: analysis.fallbackAnalysis || false,
      enhancedAt,
      analysisTimestamp: new Date().toISOString()
    }

    normalized.content_type = analysis.content_type || analysis.contentType || update.contentType || 'OTHER'
    normalized.contentType = normalized.content_type

    return normalized
  }

  ServiceClass.prototype.buildAnalyzeUpdateResponse = function(normalized, options = {}) {
    return {
      success: true,
      fallback: normalized.fallbackAnalysis || options.fallback || false,
      error: options.error,
      data: normalized,
      analysis: normalized,
      ai_summary: normalized.ai_summary,
      impact: normalized.impact,
      impactLevel: normalized.impactLevel,
      urgency: normalized.urgency,
      sector: normalized.sector,
      primarySectors: normalized.primarySectors,
      ai_tags: normalized.ai_tags,
      aiTags: normalized.aiTags,
      businessImpactScore: normalized.businessImpactScore,
      businessImpact: normalized.ai_summary,
      confidence: normalized.ai_confidence_score,
      ai_confidence_score: normalized.ai_confidence_score,
      category: normalized.category,
      area: normalized.area,
      key_dates: normalized.key_dates,
      keyDates: normalized.key_dates,
      complianceActions: normalized.complianceActions,
      compliance_deadline: normalized.compliance_deadline,
      complianceDeadline: normalized.compliance_deadline,
      sectorRelevanceScores: normalized.sectorRelevanceScores,
      implementationPhases: normalized.implementationPhases,
      requiredResources: normalized.requiredResources,
      firmTypesAffected: normalized.firmTypesAffected,
      affectedFirmSizes: normalized.affectedFirmSizes,
      aiModelUsed: normalized.aiModelUsed
    }
  }
}

module.exports = applyNormalizationMethods
