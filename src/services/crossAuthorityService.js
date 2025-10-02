// src/services/crossAuthorityService.js
// Cross Authority Service - Multi-regulator pattern detection and coordination analysis
// Phase 3: AI Intelligence Engine

const EventEmitter = require('events')
const dbService = require('./dbService')

class CrossAuthorityService extends EventEmitter {
  constructor(aiIntelligenceService) {
    super()
    this.aiService = aiIntelligenceService

    // Cross-authority analysis configuration
    this.config = {
      analysisWindow: 180, // days
      correlationThreshold: 0.6,
      coordinationIndicatorThreshold: 0.7,
      minimumAuthoritiesForPattern: 2,
      significantOverlapThreshold: 0.5,
      timingCorrelationWindow: 30, // days
      updateInterval: 43200000 // 12 hours
    }

    // Authority relationships and hierarchies
    this.authorityRelationships = this.initializeAuthorityRelationships()

    // Cross-authority patterns tracking
    this.detectedPatterns = new Map()
    this.coordinationEvents = new Map()
    this.convergenceAnalysis = new Map()

    // Start cross-authority monitoring
    this.initializeCrossAuthorityMonitoring()

    console.log('🔗 Cross Authority Service initialized')
  }

  // MAIN CROSS-AUTHORITY ANALYSIS ORCHESTRATOR
  async analyzeCrossAuthority(updateData, contentAnalysis) {
    console.log(`🔍 Running cross-authority analysis for update: ${updateData.id}`)

    try {
      // Get related updates from other authorities
      const relatedUpdates = await this.getRelatedCrossAuthorityUpdates(updateData, contentAnalysis)

      // Analyze coordination patterns
      const coordinationPatterns = await this.analyzeCoordinationPatterns(updateData, relatedUpdates)

      // Detect regulatory convergence
      const convergenceAnalysis = await this.analyzeRegulatoryConvergence(updateData, relatedUpdates, contentAnalysis)

      // Analyze timing correlations
      const timingCorrelations = await this.analyzeTimingCorrelations(updateData, relatedUpdates)

      // Detect policy harmonization
      const policyHarmonization = await this.analyzePolicyHarmonization(updateData, relatedUpdates, contentAnalysis)

      // Identify jurisdictional implications
      const jurisdictionalImplications = await this.analyzeJurisdictionalImplications(updateData, relatedUpdates)

      // Assess international alignment
      const internationalAlignment = await this.assessInternationalAlignment(updateData, contentAnalysis)

      // Predict cross-authority spillover effects
      const spilloverEffects = await this.predictSpilloverEffects(updateData, contentAnalysis, relatedUpdates)

      // Analyze coordination effectiveness
      const coordinationEffectiveness = this.assessCoordinationEffectiveness(coordinationPatterns, timingCorrelations)

      // Combine all cross-authority analyses
      const crossAuthorityInsights = {
        timestamp: new Date().toISOString(),
        updateId: updateData.id,
        authority: updateData.authority,
        relatedUpdates: relatedUpdates.map(u => ({ id: u.id, authority: u.authority, title: u.title })),
        coordinationPatterns,
        convergenceAnalysis,
        timingCorrelations,
        policyHarmonization,
        jurisdictionalImplications,
        internationalAlignment,
        spilloverEffects,
        coordinationEffectiveness,
        overallCoordination: this.calculateOverallCoordination(coordinationPatterns, timingCorrelations),
        confidence: this.calculateCrossAuthorityConfidence(relatedUpdates, coordinationPatterns)
      }

      // Store cross-authority analysis
      await this.storeCrossAuthorityAnalysis(updateData.id, crossAuthorityInsights)

      // Update pattern tracking
      await this.updatePatternTracking(crossAuthorityInsights)

      // Emit cross-authority events
      this.emitCrossAuthorityEvents(updateData, crossAuthorityInsights)

      console.log(`✅ Cross-authority analysis completed for update: ${updateData.id}`)
      return crossAuthorityInsights
    } catch (error) {
      console.error(`❌ Cross-authority analysis failed for update ${updateData.id}:`, error.message)
      return this.createFallbackCrossAuthorityAnalysis(updateData)
    }
  }

  // RELATED UPDATES IDENTIFICATION
  async getRelatedCrossAuthorityUpdates(updateData, contentAnalysis) {
    try {
      const relatedUpdates = []

      // Get updates by regulatory area similarity
      const areaSimilarUpdates = await this.getUpdatesBySimilarArea(updateData, contentAnalysis)
      relatedUpdates.push(...areaSimilarUpdates)

      // Get updates by sector overlap
      const sectorOverlapUpdates = await this.getUpdatesBySectorOverlap(updateData, contentAnalysis)
      relatedUpdates.push(...sectorOverlapUpdates)

      // Get updates by keyword similarity
      const keywordSimilarUpdates = await this.getUpdatesByKeywordSimilarity(updateData)
      relatedUpdates.push(...keywordSimilarUpdates)

      // Get updates by timing correlation
      const timingCorrelatedUpdates = await this.getUpdatesByTimingCorrelation(updateData)
      relatedUpdates.push(...timingCorrelatedUpdates)

      // Deduplicate and filter
      const uniqueRelatedUpdates = this.deduplicateAndFilterUpdates(relatedUpdates, updateData)

      return uniqueRelatedUpdates
    } catch (error) {
      console.error('Error getting related cross-authority updates:', error.message)
      return []
    }
  }

  // COORDINATION PATTERN ANALYSIS
  async analyzeCoordinationPatterns(updateData, relatedUpdates) {
    const patterns = {
      simultaneousAction: this.detectSimultaneousAction(updateData, relatedUpdates),
      sequentialCoordination: this.detectSequentialCoordination(updateData, relatedUpdates),
      thematicAlignment: this.detectThematicAlignment(updateData, relatedUpdates),
      responsiveActions: this.detectResponsiveActions(updateData, relatedUpdates),
      proactiveCoordination: this.detectProactiveCoordination(updateData, relatedUpdates)
    }

    return patterns
  }

  // REGULATORY CONVERGENCE ANALYSIS
  async analyzeRegulatoryConvergence(updateData, relatedUpdates, contentAnalysis) {
    const convergence = {
      topicConvergence: this.analyzeTopicConvergence(updateData, relatedUpdates, contentAnalysis),
      approachConvergence: this.analyzeApproachConvergence(updateData, relatedUpdates),
      standardsAlignment: this.analyzeStandardsAlignment(updateData, relatedUpdates),
      outcomeSimilarity: this.analyzeOutcomeSimilarity(updateData, relatedUpdates),
      evolutionTrends: this.analyzeEvolutionTrends(updateData, relatedUpdates)
    }

    // Calculate overall convergence score
    convergence.overallScore = this.calculateConvergenceScore(convergence)
    convergence.convergenceLevel = this.classifyConvergenceLevel(convergence.overallScore)

    return convergence
  }

  // TIMING CORRELATION ANALYSIS
  async analyzeTimingCorrelations(updateData, relatedUpdates) {
    const correlations = {
      publicationTiming: this.analyzePublicationTiming(updateData, relatedUpdates),
      consultationAlignment: this.analyzeConsultationAlignment(updateData, relatedUpdates),
      implementationSynchronization: this.analyzeImplementationSynchronization(updateData, relatedUpdates),
      announcementPatterns: this.analyzeAnnouncementPatterns(updateData, relatedUpdates)
    }

    // Calculate timing correlation strength
    correlations.overallCorrelation = this.calculateTimingCorrelation(correlations)
    correlations.coordinationLikelihood = this.assessCoordinationLikelihood(correlations)

    return correlations
  }

  // POLICY HARMONIZATION ANALYSIS
  async analyzePolicyHarmonization(updateData, relatedUpdates, contentAnalysis) {
    const harmonization = {
      objectiveAlignment: this.analyzeObjectiveAlignment(updateData, relatedUpdates, contentAnalysis),
      methodologyConsistency: this.analyzeMethodologyConsistency(updateData, relatedUpdates),
      terminologyAlignment: this.analyzeTerminologyAlignment(updateData, relatedUpdates),
      requirementsSimilarity: this.analyzeRequirementsSimilarity(updateData, relatedUpdates),
      enforcementConsistency: this.analyzeEnforcementConsistency(updateData, relatedUpdates)
    }

    harmonization.harmonizationScore = this.calculateHarmonizationScore(harmonization)
    harmonization.harmonizationLevel = this.classifyHarmonizationLevel(harmonization.harmonizationScore)

    return harmonization
  }

  // JURISDICTIONAL IMPLICATIONS ANALYSIS
  async analyzeJurisdictionalImplications(updateData, relatedUpdates) {
    const implications = {
      crossBorderImpact: this.assessCrossBorderImpact(updateData, relatedUpdates),
      jurisdictionalOverlap: this.identifyJurisdictionalOverlap(updateData, relatedUpdates),
      regulatoryArbitrage: this.assessRegulatoryArbitrage(updateData, relatedUpdates),
      complianceComplexity: this.assessComplianceComplexity(updateData, relatedUpdates),
      competitiveImplications: this.assessCompetitiveImplications(updateData, relatedUpdates)
    }

    return implications
  }

  // INTERNATIONAL ALIGNMENT ASSESSMENT
  async assessInternationalAlignment(updateData, contentAnalysis) {
    const alignment = {
      baselAlignment: this.assessBaselAlignment(updateData, contentAnalysis),
      ioscoAlignment: this.assessIOSCOAlignment(updateData, contentAnalysis),
      fatfAlignment: this.assessFATFAlignment(updateData, contentAnalysis),
      euAlignment: this.assessEUAlignment(updateData, contentAnalysis),
      g20Alignment: this.assessG20Alignment(updateData, contentAnalysis)
    }

    alignment.overallAlignment = this.calculateInternationalAlignment(alignment)
    alignment.alignmentStrength = this.classifyAlignmentStrength(alignment.overallAlignment)

    return alignment
  }

  // SPILLOVER EFFECTS PREDICTION
  async predictSpilloverEffects(updateData, contentAnalysis, relatedUpdates) {
    const spilloverEffects = {
      likelySpillovers: this.predictLikelySpillovers(updateData, contentAnalysis),
      affectedAuthorities: this.identifyAffectedAuthorities(updateData, contentAnalysis),
      transmissionMechanisms: this.identifyTransmissionMechanisms(updateData, contentAnalysis),
      timelineEstimate: this.estimateSpilloverTimeline(updateData, contentAnalysis),
      mitigation: this.suggestSpilloverMitigation(updateData, contentAnalysis)
    }

    return spilloverEffects
  }

  // SPECIFIC DETECTION METHODS
  detectSimultaneousAction(updateData, relatedUpdates) {
    const updateDate = new Date(updateData.pubDate)
    const simultaneousUpdates = relatedUpdates.filter(update => {
      const otherDate = new Date(update.pubDate)
      const daysDiff = Math.abs((updateDate - otherDate) / (1000 * 60 * 60 * 24))
      return daysDiff <= this.config.timingCorrelationWindow
    })

    return {
      detected: simultaneousUpdates.length > 0,
      count: simultaneousUpdates.length,
      authorities: simultaneousUpdates.map(u => u.authority),
      updates: simultaneousUpdates,
      likelihood: simultaneousUpdates.length > 0
        ? Math.min(0.9, 0.3 + (simultaneousUpdates.length * 0.2))
        : 0
    }
  }

  detectSequentialCoordination(updateData, relatedUpdates) {
    // Look for updates that follow in sequence from related authorities
    const updateDate = new Date(updateData.pubDate)
    // Check for updates that came before (within 90 days) that might have triggered this one
    const precedingUpdates = relatedUpdates.filter(update => {
      const otherDate = new Date(update.pubDate)
      const daysDiff = (updateDate - otherDate) / (1000 * 60 * 60 * 24)
      return daysDiff > 0 && daysDiff <= 90
    })

    // Check for updates that might follow (look at historical patterns)
    const followingPattern = this.predictFollowingUpdates(updateData, relatedUpdates)

    return {
      detected: precedingUpdates.length > 0,
      precedingUpdates,
      predictedFollowing: followingPattern,
      sequenceStrength: this.calculateSequenceStrength(precedingUpdates, updateData),
      coordinationLikelihood: precedingUpdates.length > 0
        ? Math.min(0.8, 0.4 + (precedingUpdates.length * 0.15))
        : 0
    }
  }

  detectThematicAlignment(updateData, relatedUpdates) {
    const updateThemes = this.extractThemes(updateData)
    const alignedUpdates = []

    for (const relatedUpdate of relatedUpdates) {
      const relatedThemes = this.extractThemes(relatedUpdate)
      const overlap = this.calculateThemeOverlap(updateThemes, relatedThemes)

      if (overlap >= this.config.significantOverlapThreshold) {
        alignedUpdates.push({
          update: relatedUpdate,
          overlap,
          sharedThemes: this.getSharedThemes(updateThemes, relatedThemes)
        })
      }
    }

    return {
      detected: alignedUpdates.length > 0,
      alignedUpdates,
      overallAlignment: this.calculateOverallThematicAlignment(alignedUpdates),
      dominantThemes: this.identifyDominantThemes(alignedUpdates)
    }
  }

  // ANALYSIS CALCULATIONS
  analyzeTopicConvergence(updateData, relatedUpdates, contentAnalysis) {
    const updateArea = contentAnalysis.area
    const updateSectors = contentAnalysis.primarySectors || []

    let convergenceScore = 0
    const convergentUpdates = []

    for (const related of relatedUpdates) {
      let similarity = 0

      // Area similarity
      if (related.ai_area === updateArea) {
        similarity += 0.4
      } else if (this.areRelatedAreas(updateArea, related.ai_area)) {
        similarity += 0.2
      }

      // Sector similarity
      const relatedSectors = this.extractSectorsFromUpdate(related)
      const sectorOverlap = this.calculateSectorOverlap(updateSectors, relatedSectors)
      similarity += sectorOverlap * 0.3

      // Impact level similarity
      if (related.ai_impact_level === contentAnalysis.impactLevel) {
        similarity += 0.2
      }

      // Urgency similarity
      if (related.ai_urgency === contentAnalysis.urgency) {
        similarity += 0.1
      }

      if (similarity >= this.config.correlationThreshold) {
        convergentUpdates.push({
          update: related,
          similarity,
          authority: related.authority
        })
        convergenceScore += similarity
      }
    }

    return {
      score: convergentUpdates.length > 0 ? convergenceScore / convergentUpdates.length : 0,
      convergentUpdates,
      authorities: [...new Set(convergentUpdates.map(u => u.authority))],
      topicAlignment: this.calculateTopicAlignment(updateData, convergentUpdates)
    }
  }

  analyzePublicationTiming(updateData, relatedUpdates) {
    const updateDate = new Date(updateData.pubDate)
    const timingPatterns = {
      simultaneous: [],
      sequential: [],
      rhythmic: []
    }

    for (const related of relatedUpdates) {
      const relatedDate = new Date(related.pubDate)
      const daysDiff = Math.abs((updateDate - relatedDate) / (1000 * 60 * 60 * 24))

      if (daysDiff <= 7) {
        timingPatterns.simultaneous.push(related)
      } else if (daysDiff <= 30) {
        timingPatterns.sequential.push(related)
      } else if (this.isRhythmicTiming(updateDate, relatedDate)) {
        timingPatterns.rhythmic.push(related)
      }
    }

    return {
      patterns: timingPatterns,
      coordinationScore: this.calculateTimingCoordinationScore(timingPatterns),
      significance: this.assessTimingSignificance(timingPatterns)
    }
  }

  // COORDINATION EFFECTIVENESS ASSESSMENT
  assessCoordinationEffectiveness(coordinationPatterns, timingCorrelations) {
    let effectiveness = 0
    const factors = []

    // Simultaneous action effectiveness
    if (coordinationPatterns.simultaneousAction.detected) {
      effectiveness += 0.3
      factors.push('Simultaneous regulatory action detected')
    }

    // Sequential coordination effectiveness
    if (coordinationPatterns.sequentialCoordination.detected) {
      effectiveness += 0.25
      factors.push('Sequential coordination identified')
    }

    // Thematic alignment effectiveness
    if (coordinationPatterns.thematicAlignment.detected) {
      effectiveness += 0.25
      factors.push('Strong thematic alignment')
    }

    // Timing correlation effectiveness
    if (timingCorrelations.overallCorrelation > this.config.coordinationIndicatorThreshold) {
      effectiveness += 0.2
      factors.push('Significant timing correlation')
    }

    return {
      score: Math.min(1.0, effectiveness),
      level: this.classifyCoordinationLevel(effectiveness),
      factors,
      recommendations: this.generateCoordinationRecommendations(effectiveness, factors)
    }
  }

  // COMPREHENSIVE MONITORING
  async monitorCrossAuthorityActivity() {
    console.log('🔍 Monitoring cross-authority activity...')

    try {
      // Get recent updates from all authorities
      const recentUpdates = await this.getRecentUpdatesByAuthority()

      // Identify potential coordination events
      const coordinationEvents = await this.identifyCoordinationEvents(recentUpdates)

      // Analyze emerging patterns
      const emergingPatterns = await this.analyzeEmergingPatterns(recentUpdates)

      // Update pattern tracking
      await this.updateCrossAuthorityPatterns(coordinationEvents, emergingPatterns)

      // Emit monitoring events
      this.emitMonitoringEvents(coordinationEvents, emergingPatterns)
    } catch (error) {
      console.error('Cross-authority monitoring error:', error.message)
    }
  }

  // STORAGE AND EVENTS
  async storeCrossAuthorityAnalysis(updateId, crossAuthorityInsights) {
    try {
      const analysisData = {
        update_id: updateId,
        analysis_type: 'cross_authority',
        authority: crossAuthorityInsights.authority,
        related_updates: crossAuthorityInsights.relatedUpdates,
        coordination_patterns: crossAuthorityInsights.coordinationPatterns,
        convergence_analysis: crossAuthorityInsights.convergenceAnalysis,
        timing_correlations: crossAuthorityInsights.timingCorrelations,
        policy_harmonization: crossAuthorityInsights.policyHarmonization,
        jurisdictional_implications: crossAuthorityInsights.jurisdictionalImplications,
        international_alignment: crossAuthorityInsights.internationalAlignment,
        spillover_effects: crossAuthorityInsights.spilloverEffects,
        coordination_effectiveness: crossAuthorityInsights.coordinationEffectiveness,
        overall_coordination: crossAuthorityInsights.overallCoordination,
        confidence_score: crossAuthorityInsights.confidence,
        analyzed_at: crossAuthorityInsights.timestamp
      }

      await dbService.storeCrossAuthorityAnalysis(analysisData)
    } catch (error) {
      console.error('Failed to store cross-authority analysis:', error.message)
    }
  }

  emitCrossAuthorityEvents(updateData, insights) {
    // Emit for high coordination detected
    if (insights.overallCoordination > this.config.coordinationIndicatorThreshold) {
      this.emit('highCoordinationDetected', {
        update: updateData,
        coordination: insights.overallCoordination,
        patterns: insights.coordinationPatterns
      })
    }

    // Emit for significant convergence
    if (insights.convergenceAnalysis.overallScore > this.config.correlationThreshold) {
      this.emit('regulatoryConvergenceDetected', {
        update: updateData,
        convergence: insights.convergenceAnalysis
      })
    }

    // Emit for spillover effects
    if (insights.spilloverEffects.likelySpillovers.length > 0) {
      this.emit('spilloverEffectsDetected', {
        update: updateData,
        spillovers: insights.spilloverEffects
      })
    }

    // Emit for international alignment
    if (insights.internationalAlignment.overallAlignment > 0.7) {
      this.emit('internationalAlignmentDetected', {
        update: updateData,
        alignment: insights.internationalAlignment
      })
    }
  }

  // PUBLIC API METHODS
  async getCoordinationInsights(authority, days = 90) {
    try {
      return await dbService.query(`
                SELECT * FROM cross_authority_analyses 
                WHERE authority = $1 
                AND analyzed_at > NOW() - INTERVAL '${days} days'
                AND overall_coordination > ${this.config.coordinationIndicatorThreshold}
                ORDER BY analyzed_at DESC
            `, [authority])
    } catch (error) {
      console.error('Error getting coordination insights:', error.message)
      return []
    }
  }

  async getConvergenceAnalysis(days = 180) {
    try {
      return await dbService.query(`
                SELECT convergence_analysis, analyzed_at, authority 
                FROM cross_authority_analyses 
                WHERE analyzed_at > NOW() - INTERVAL '${days} days'
                AND convergence_analysis->>'overallScore' > '${this.config.correlationThreshold}'
                ORDER BY analyzed_at DESC
                LIMIT 50
            `)
    } catch (error) {
      console.error('Error getting convergence analysis:', error.message)
      return []
    }
  }

  // HELPER METHODS
  initializeAuthorityRelationships() {
    return {
      hierarchical: {
        'HM Treasury': ['FCA', 'PRA', 'Bank of England'],
        'Bank of England': ['PRA']
      },
      cooperative: {
        FCA: ['PRA', 'Bank of England', 'PSR'],
        PRA: ['FCA', 'Bank of England'],
        PSR: ['FCA', 'Bank of England']
      },
      international: {
        FCA: ['European Banking Authority', 'IOSCO'],
        PRA: ['Basel Committee', 'European Banking Authority'],
        'Bank of England': ['Basel Committee', 'FATF']
      }
    }
  }

  calculateOverallCoordination(coordinationPatterns, timingCorrelations) {
    const weights = {
      simultaneousAction: 0.3,
      sequentialCoordination: 0.25,
      thematicAlignment: 0.25,
      timingCorrelation: 0.2
    }

    let score = 0

    if (coordinationPatterns.simultaneousAction.detected) {
      score += weights.simultaneousAction * coordinationPatterns.simultaneousAction.likelihood
    }

    if (coordinationPatterns.sequentialCoordination.detected) {
      score += weights.sequentialCoordination * coordinationPatterns.sequentialCoordination.coordinationLikelihood
    }

    if (coordinationPatterns.thematicAlignment.detected) {
      score += weights.thematicAlignment * coordinationPatterns.thematicAlignment.overallAlignment
    }

    if (timingCorrelations.overallCorrelation) {
      score += weights.timingCorrelation * timingCorrelations.overallCorrelation
    }

    return Math.min(1.0, score)
  }

  calculateCrossAuthorityConfidence(relatedUpdates, coordinationPatterns) {
    let confidence = 50 // Base confidence

    // More related updates increase confidence
    confidence += Math.min(30, relatedUpdates.length * 5)

    // Strong patterns increase confidence
    if (coordinationPatterns.simultaneousAction.detected) {
      confidence += 15
    }

    if (coordinationPatterns.thematicAlignment.detected) {
      confidence += 10
    }

    return Math.min(95, confidence)
  }

  extractThemes(updateData) {
    const text = `${updateData.title} ${updateData.ai_area || ''} ${updateData.ai_headline || ''}`.toLowerCase()
    const keywords = text.split(/\s+/).filter(word => word.length > 3)

    // Common regulatory themes
    const themes = []
    const themeKeywords = {
      capital: ['capital', 'buffer', 'ratio', 'requirement'],
      liquidity: ['liquidity', 'funding', 'cash', 'liquid'],
      consumer: ['consumer', 'customer', 'protection', 'duty'],
      conduct: ['conduct', 'behavior', 'fair', 'treatment'],
      digital: ['digital', 'technology', 'fintech', 'innovation'],
      climate: ['climate', 'environmental', 'sustainable', 'green'],
      crypto: ['crypto', 'digital asset', 'blockchain', 'token']
    }

    for (const [theme, themeWords] of Object.entries(themeKeywords)) {
      if (themeWords.some(word => keywords.includes(word))) {
        themes.push(theme)
      }
    }

    return themes
  }

  initializeCrossAuthorityMonitoring() {
    // Start periodic cross-authority monitoring
    setInterval(() => {
      this.monitorCrossAuthorityActivity().catch(error =>
        console.error('Cross-authority monitoring error:', error.message)
      )
    }, this.config.updateInterval)
  }

  createFallbackCrossAuthorityAnalysis(updateData) {
    return {
      timestamp: new Date().toISOString(),
      updateId: updateData.id,
      authority: updateData.authority,
      relatedUpdates: [],
      coordinationPatterns: { detected: false },
      convergenceAnalysis: { overallScore: 0 },
      timingCorrelations: { overallCorrelation: 0 },
      policyHarmonization: { harmonizationScore: 0 },
      jurisdictionalImplications: {},
      internationalAlignment: { overallAlignment: 0 },
      spilloverEffects: { likelySpillovers: [] },
      coordinationEffectiveness: { score: 0, level: 'Unknown' },
      overallCoordination: 0,
      confidence: 30,
      fallback: true,
      message: 'Cross-authority analysis unavailable'
    }
  }

  deduplicateAndFilterUpdates(updates, excludeUpdate) {
    const seen = new Set()
    const filtered = []

    for (const update of updates) {
      if (update.id !== excludeUpdate.id && !seen.has(update.id)) {
        seen.add(update.id)
        filtered.push(update)
      }
    }

    return filtered
  }

  classifyCoordinationLevel(score) {
    if (score >= 0.8) return 'Very High'
    if (score >= 0.6) return 'High'
    if (score >= 0.4) return 'Medium'
    if (score >= 0.2) return 'Low'
    return 'Very Low'
  }

  areRelatedAreas(area1, area2) {
    const relatedAreaGroups = [
      ['Capital Requirements', 'Prudential Regulation', 'Risk Management'],
      ['Consumer Protection', 'Consumer Duty', 'Fair Treatment'],
      ['Market Conduct', 'Market Integrity', 'Trading'],
      ['Digital Innovation', 'Fintech', 'Technology'],
      ['Climate Risk', 'ESG', 'Sustainable Finance']
    ]

    return relatedAreaGroups.some(group =>
      group.some(area => area.includes(area1)) &&
            group.some(area => area.includes(area2))
    )
  }
}

module.exports = CrossAuthorityService
