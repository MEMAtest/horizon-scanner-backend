// src/services/patternRecognitionService.js
// Pattern Recognition Service - Detects regulatory themes and authority behavior patterns
// Phase 3: AI Intelligence Engine

const EventEmitter = require('events')
const dbService = require('./dbService')
const AIPromptTemplates = require('../ai/promptTemplates')

class PatternRecognitionService extends EventEmitter {
  constructor(aiIntelligenceService) {
    super()
    this.aiService = aiIntelligenceService
    this.promptTemplates = new AIPromptTemplates()

    // Pattern detection configuration
    this.config = {
      analysisWindow: 90, // days
      minPatternConfidence: 60,
      minThemeOccurrence: 3,
      maxThemesTracked: 50,
      patternUpdateInterval: 86400000 // 24 hours
    }

    // Pattern storage
    this.detectedPatterns = new Map()
    this.emergingThemes = new Map()
    this.authorityBehaviorPatterns = new Map()

    // Initialize pattern tracking
    this.initializePatternTracking()

    console.log('🎯 Pattern Recognition Service initialized')
  }

  // MAIN PATTERN ANALYSIS ORCHESTRATOR
  async analyzePatterns(updateData, contentAnalysis) {
    console.log(`🔍 Running pattern analysis for update: ${updateData.id}`)

    try {
      // Get recent regulatory context
      const recentUpdates = await this.getRecentUpdatesForPatternAnalysis()
      const historicalPatterns = await this.getHistoricalPatterns()

      // AI-powered pattern recognition
      const aiPatterns = await this.runAIPatternRecognition(updateData, recentUpdates, historicalPatterns)

      // Statistical pattern detection
      const statisticalPatterns = await this.detectStatisticalPatterns(updateData, contentAnalysis)

      // Authority behavior analysis
      const authorityPatterns = await this.analyzeAuthorityBehavior(updateData, contentAnalysis)

      // Cross-sector pattern analysis
      const crossSectorPatterns = await this.detectCrossSectorPatterns(updateData, contentAnalysis)

      // Temporal pattern analysis
      const temporalPatterns = await this.analyzeTemporalPatterns(updateData, contentAnalysis)

      // Combine and score patterns
      const combinedPatterns = this.combinePatternAnalyses({
        ai: aiPatterns,
        statistical: statisticalPatterns,
        authority: authorityPatterns,
        crossSector: crossSectorPatterns,
        temporal: temporalPatterns
      })

      // Update pattern storage
      await this.updatePatternStorage(combinedPatterns)

      // Emit pattern events
      this.emitPatternEvents(updateData, combinedPatterns)

      console.log(`✅ Pattern analysis completed for update: ${updateData.id}`)
      return combinedPatterns
    } catch (error) {
      console.error(`❌ Pattern analysis failed for update ${updateData.id}:`, error.message)
      return this.createFallbackPatternAnalysis()
    }
  }

  // AI-POWERED PATTERN RECOGNITION
  async runAIPatternRecognition(updateData, recentUpdates, historicalPatterns) {
    try {
      const prompt = this.promptTemplates.createPatternRecognitionPrompt(
        [updateData, ...recentUpdates.slice(0, 10)],
        historicalPatterns
      )

      const response = await this.aiService.makeGroqRequest(prompt)
      const patterns = this.aiService.parseAIResponse(response)

      // Validate and enhance AI patterns
      return this.validateAIPatterns(patterns)
    } catch (error) {
      console.error('AI pattern recognition failed:', error.message)
      return this.createFallbackAIPatterns()
    }
  }

  // STATISTICAL PATTERN DETECTION
  async detectStatisticalPatterns(updateData, contentAnalysis) {
    try {
      const patterns = {
        keywordFrequency: await this.analyzeKeywordFrequency(updateData),
        sectorConcentration: await this.analyzeSectorConcentration(contentAnalysis),
        impactLevelTrends: await this.analyzeImpactLevelTrends(),
        authorityActivity: await this.analyzeAuthorityActivityPatterns(updateData),
        documentTypePatterns: await this.analyzeDocumentTypePatterns(updateData)
      }

      return patterns
    } catch (error) {
      console.error('Statistical pattern detection failed:', error.message)
      return {}
    }
  }

  // AUTHORITY BEHAVIOR ANALYSIS
  async analyzeAuthorityBehavior(updateData, contentAnalysis) {
    try {
      const authority = updateData.authority
      const recentActivityByAuthority = await this.getRecentAuthorityActivity(authority)

      const behaviorPatterns = {
        publicationFrequency: this.calculatePublicationFrequency(recentActivityByAuthority),
        focusAreas: this.identifyAuthorityFocusAreas(recentActivityByAuthority),
        urgencyPatterns: this.analyzeAuthorityUrgencyPatterns(recentActivityByAuthority),
        consultationBehavior: this.analyzeConsultationBehavior(recentActivityByAuthority),
        seasonalPatterns: this.detectSeasonalPatterns(recentActivityByAuthority),
        predictedNextActions: await this.predictAuthorityNextActions(authority, recentActivityByAuthority)
      }

      return behaviorPatterns
    } catch (error) {
      console.error('Authority behavior analysis failed:', error.message)
      return {}
    }
  }

  // CROSS-SECTOR PATTERN DETECTION
  async detectCrossSectorPatterns(updateData, contentAnalysis) {
    try {
      const affectedSectors = contentAnalysis.primarySectors || []
      const crossSectorData = await this.getCrossSectorData(affectedSectors)

      const patterns = {
        simultaneousImpact: this.detectSimultaneousImpacts(crossSectorData),
        cascadingEffects: this.detectCascadingEffects(crossSectorData),
        regulatoryAlignment: this.analyzeRegulatoryAlignment(crossSectorData),
        competitiveImplications: this.analyzeCompetitiveImplications(crossSectorData)
      }

      return patterns
    } catch (error) {
      console.error('Cross-sector pattern detection failed:', error.message)
      return {}
    }
  }

  // TEMPORAL PATTERN ANALYSIS
  async analyzeTemporalPatterns(updateData, contentAnalysis) {
    try {
      const timeSeriesData = await this.getTimeSeriesData()

      const patterns = {
        cyclicalPatterns: this.detectCyclicalPatterns(timeSeriesData),
        trendAnalysis: this.analyzeTrends(timeSeriesData),
        seasonality: this.detectSeasonality(timeSeriesData),
        momentum: this.calculateRegulatoryMomentum(timeSeriesData),
        predictionWindow: this.calculatePredictionWindow(timeSeriesData)
      }

      return patterns
    } catch (error) {
      console.error('Temporal pattern analysis failed:', error.message)
      return {}
    }
  }

  // KEYWORD FREQUENCY ANALYSIS
  async analyzeKeywordFrequency(updateData) {
    const text = `${updateData.title} ${updateData.description || ''} ${updateData.content || ''}`.toLowerCase()
    const words = text.split(/\s+/).filter(word => word.length > 3)

    const frequency = {}
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1
    })

    // Get trending keywords from recent updates
    const recentKeywords = await this.getRecentKeywordTrends()

    return {
      currentKeywords: Object.entries(frequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([word, count]) => ({ word, count })),
      trendingKeywords: recentKeywords,
      emergingTerms: this.identifyEmergingTerms(frequency, recentKeywords)
    }
  }

  // SECTOR CONCENTRATION ANALYSIS
  async analyzeSectorConcentration(contentAnalysis) {
    const sectorScores = contentAnalysis.sectorRelevanceScores || {}
    const recentSectorActivity = await this.getRecentSectorActivity()

    return {
      currentConcentration: this.calculateSectorConcentration(sectorScores),
      trendingUp: this.identifyTrendingSectors(recentSectorActivity, 'up'),
      trendingDown: this.identifyTrendingSectors(recentSectorActivity, 'down'),
      emergingSectors: this.identifyEmergingSectors(recentSectorActivity),
      sectorMomentum: this.calculateSectorMomentum(recentSectorActivity)
    }
  }

  // IMPACT LEVEL TRENDS
  async analyzeImpactLevelTrends() {
    const recentImpacts = await this.getRecentImpactLevels()

    return {
      distribution: this.calculateImpactDistribution(recentImpacts),
      trends: this.calculateImpactTrends(recentImpacts),
      escalationPattern: this.detectEscalationPattern(recentImpacts),
      authorityRiskAppetite: this.analyzeAuthorityRiskAppetite(recentImpacts)
    }
  }

  // PUBLICATION FREQUENCY CALCULATION
  calculatePublicationFrequency(activityData) {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000))

    const last30Days = activityData.filter(item => new Date(item.pubDate) >= thirtyDaysAgo).length
    const last7Days = activityData.filter(item => new Date(item.pubDate) >= sevenDaysAgo).length

    return {
      monthly: last30Days,
      weekly: last7Days,
      trend: last7Days > (last30Days / 4) ? 'increasing' : 'decreasing',
      averageInterval: this.calculateAverageInterval(activityData)
    }
  }

  // AUTHORITY FOCUS AREAS
  identifyAuthorityFocusAreas(activityData) {
    const areaCount = {}

    activityData.forEach(item => {
      const area = item.ai_area || 'General'
      areaCount[area] = (areaCount[area] || 0) + 1
    })

    return Object.entries(areaCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([area, count]) => ({
        area,
        count,
        percentage: (count / activityData.length * 100).toFixed(1)
      }))
  }

  // CONSULTATION BEHAVIOR ANALYSIS
  analyzeConsultationBehavior(activityData) {
    const consultations = activityData.filter(item =>
      item.title.toLowerCase().includes('consultation') ||
            item.ai_area?.toLowerCase().includes('consultation')
    )

    return {
      frequency: consultations.length,
      averageDuration: this.calculateAverageConsultationDuration(consultations),
      topicsPattern: this.identifyConsultationTopics(consultations),
      timingPattern: this.analyzeConsultationTiming(consultations)
    }
  }

  // PATTERN COMBINATION AND SCORING
  combinePatternAnalyses(analyses) {
    const combined = {
      timestamp: new Date().toISOString(),
      confidence: this.calculateOverallPatternConfidence(analyses),
      emergingThemes: this.consolidateEmergingThemes(analyses),
      authorityBehavior: analyses.authority,
      crossSectorInsights: analyses.crossSector,
      temporalPatterns: analyses.temporal,
      statisticalInsights: analyses.statistical,
      aiInsights: analyses.ai,
      patternStrength: this.calculatePatternStrength(analyses),
      predictiveIndicators: this.extractPredictiveIndicators(analyses)
    }

    return combined
  }

  // PATTERN STORAGE UPDATES
  async updatePatternStorage(patterns) {
    try {
      // Store in database
      const patternData = {
        detected_at: new Date().toISOString(),
        pattern_type: 'comprehensive',
        emerging_themes: patterns.emergingThemes,
        authority_behavior: patterns.authorityBehavior,
        cross_sector_insights: patterns.crossSectorInsights,
        temporal_patterns: patterns.temporalPatterns,
        confidence_score: patterns.confidence,
        pattern_strength: patterns.patternStrength
      }

      await dbService.storePattern(patternData)

      // Update in-memory storage
      const patternKey = `pattern_${Date.now()}`
      this.detectedPatterns.set(patternKey, patterns)

      // Clean old patterns
      this.cleanOldPatterns()
    } catch (error) {
      console.error('Failed to update pattern storage:', error.message)
    }
  }

  // PATTERN EVENTS
  emitPatternEvents(updateData, patterns) {
    // Emit for strong patterns
    if (patterns.patternStrength > 75) {
      this.emit('strongPatternDetected', {
        update: updateData,
        patterns
      })
    }

    // Emit for emerging themes
    if (patterns.emergingThemes?.length > 0) {
      this.emit('emergingThemeDetected', {
        update: updateData,
        themes: patterns.emergingThemes
      })
    }

    // Emit for unusual authority behavior
    if (patterns.authorityBehavior?.abnormalActivity) {
      this.emit('unusualAuthorityBehavior', {
        update: updateData,
        behavior: patterns.authorityBehavior
      })
    }
  }

  // PUBLIC API METHODS
  async getEmergingThemes(options = {}) {
    const limit = options.limit || 10
    const minConfidence = options.minConfidence || this.config.minPatternConfidence

    try {
      return await dbService.query(`
                SELECT * FROM patterns 
                WHERE confidence_score >= $1 
                AND detected_at > NOW() - INTERVAL '30 days'
                ORDER BY confidence_score DESC, detected_at DESC
                LIMIT $2
            `, [minConfidence, limit])
    } catch (error) {
      console.error('Error getting emerging themes:', error.message)
      return []
    }
  }

  async getAuthorityBehaviorPatterns(authority, days = 30) {
    try {
      return await dbService.query(`
                SELECT authority_behavior FROM patterns 
                WHERE authority_behavior->>'authority' = $1
                AND detected_at > NOW() - INTERVAL '$2 days'
                ORDER BY detected_at DESC
            `, [authority, days])
    } catch (error) {
      console.error('Error getting authority behavior patterns:', error.message)
      return []
    }
  }

  async updatePatterns() {
    console.log('🔄 Updating pattern analysis...')

    try {
      const recentUpdates = await this.getRecentUpdatesForPatternAnalysis()

      if (recentUpdates.length > 0) {
        const batchPatterns = await Promise.all(
          recentUpdates.map(update => this.analyzePatterns(update, update))
        )

        console.log(`✅ Updated patterns for ${batchPatterns.length} updates`)
      }
    } catch (error) {
      console.error('Error updating patterns:', error.message)
    }
  }

  // HELPER METHODS
  async getRecentUpdatesForPatternAnalysis() {
    try {
      return await dbService.query(`
                SELECT * FROM regulatory_updates 
                WHERE created_at > NOW() - INTERVAL '$1 days'
                ORDER BY created_at DESC
                LIMIT 50
            `, [this.config.analysisWindow])
    } catch (error) {
      console.error('Error getting recent updates for pattern analysis:', error.message)
      return []
    }
  }

  async getHistoricalPatterns() {
    try {
      return await dbService.query(`
                SELECT * FROM patterns 
                WHERE detected_at > NOW() - INTERVAL '180 days'
                ORDER BY confidence_score DESC
                LIMIT 20
            `)
    } catch (error) {
      console.error('Error getting historical patterns:', error.message)
      return []
    }
  }

  validateAIPatterns(patterns) {
    // Validate and clean AI-generated patterns
    if (!patterns || typeof patterns !== 'object') {
      return this.createFallbackAIPatterns()
    }

    // Ensure required structure
    patterns.emergingThemes = patterns.emergingThemes || []
    patterns.authorityPatterns = patterns.authorityPatterns || []
    patterns.crossSectorTrends = patterns.crossSectorTrends || []
    patterns.regulatoryMomentum = patterns.regulatoryMomentum || { overall: 'Medium' }

    return patterns
  }

  createFallbackPatternAnalysis() {
    return {
      timestamp: new Date().toISOString(),
      confidence: 30,
      emergingThemes: [],
      authorityBehavior: {},
      crossSectorInsights: {},
      temporalPatterns: {},
      statisticalInsights: {},
      aiInsights: {},
      patternStrength: 25,
      predictiveIndicators: [],
      fallback: true
    }
  }

  createFallbackAIPatterns() {
    return {
      emergingThemes: [],
      authorityPatterns: [],
      crossSectorTrends: [],
      regulatoryMomentum: { overall: 'Medium' }
    }
  }

  calculateOverallPatternConfidence(analyses) {
    // Weight different analysis types
    const weights = {
      ai: 0.3,
      statistical: 0.25,
      authority: 0.2,
      crossSector: 0.15,
      temporal: 0.1
    }

    let weightedSum = 0
    let totalWeight = 0

    Object.entries(weights).forEach(([type, weight]) => {
      if (analyses[type] && Object.keys(analyses[type]).length > 0) {
        weightedSum += 70 * weight // Base confidence for having analysis
        totalWeight += weight
      }
    })

    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 50
  }

  calculatePatternStrength(analyses) {
    // Calculate pattern strength based on consistency across analysis types
    let strength = 50

    // Boost for AI insights
    if (analyses.ai?.emergingThemes?.length > 0) strength += 15
    if (analyses.ai?.regulatoryMomentum?.overall === 'High') strength += 10

    // Boost for statistical significance
    if (analyses.statistical?.keywordFrequency?.emergingTerms?.length > 0) strength += 10
    if (analyses.statistical?.impactLevelTrends?.escalationPattern) strength += 10

    // Boost for authority behavior changes
    if (analyses.authority?.publicationFrequency?.trend === 'increasing') strength += 10

    return Math.min(100, Math.max(0, strength))
  }

  initializePatternTracking() {
    // Start periodic pattern updates
    setInterval(() => {
      this.updatePatterns().catch(error =>
        console.error('Pattern update error:', error.message)
      )
    }, this.config.patternUpdateInterval)
  }

  cleanOldPatterns() {
    // Clean old patterns from memory
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)

    for (const [key, pattern] of this.detectedPatterns.entries()) {
      if (new Date(pattern.timestamp).getTime() < oneWeekAgo) {
        this.detectedPatterns.delete(key)
      }
    }
  }
}

module.exports = PatternRecognitionService
