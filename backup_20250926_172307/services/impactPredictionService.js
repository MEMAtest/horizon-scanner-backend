// src/services/impactPredictionService.js
// Impact Prediction Service - Scores business impact for different firm types and sizes
// Phase 3: AI Intelligence Engine

const EventEmitter = require('events')
const dbService = require('./dbService')
const AIPromptTemplates = require('../ai/promptTemplates')

class ImpactPredictionService extends EventEmitter {
  constructor(aiIntelligenceService) {
    super()
    this.aiService = aiIntelligenceService
    this.promptTemplates = new AIPromptTemplates()

    // Impact prediction configuration
    this.config = {
      firmTypes: [
        'Large Bank', 'Regional Bank', 'Building Society', 'Credit Union',
        'Investment Bank', 'Asset Manager', 'Wealth Manager', 'Insurance Company',
        'Fintech Startup', 'Payment Institution', 'E-Money Institution',
        'Cryptocurrency Exchange', 'Peer-to-Peer Lender', 'Challenger Bank'
      ],
      firmSizes: ['Large', 'Medium', 'Small', 'Micro'],
      impactDimensions: [
        'Systems & Technology', 'Compliance & Risk', 'Operations',
        'Legal & Regulatory', 'Training & Resources', 'Financial Impact'
      ],
      predictionWindow: 90, // days
      confidenceThreshold: 60
    }

    // Impact scoring weights
    this.scoringWeights = {
      immediateImpact: 0.4,
      implementationComplexity: 0.25,
      ongoingCompliance: 0.2,
      competitiveEffect: 0.15
    }

    // Firm profile templates
    this.firmProfiles = this.initializeFirmProfiles()

    // Historical impact data
    this.historicalImpacts = new Map()

    console.log('💥 Impact Prediction Service initialized')
  }

  // MAIN IMPACT PREDICTION ORCHESTRATOR
  async predictImpact(updateData, contentAnalysis) {
    console.log(`📊 Running impact prediction for update: ${updateData.id}`)

    try {
      // Get firm profiles for analysis
      const firmProfiles = await this.getFirmProfiles()

      // Get historical impact context
      const historicalContext = await this.getHistoricalImpactContext(contentAnalysis)

      // AI-powered impact prediction
      const aiImpactPrediction = await this.runAIImpactPrediction(
        updateData,
        firmProfiles,
        historicalContext
      )

      // Quantitative impact modeling
      const quantitativeModel = await this.runQuantitativeImpactModel(
        updateData,
        contentAnalysis
      )

      // Sector-specific impact analysis
      const sectorImpacts = await this.analyzeSectorSpecificImpacts(
        contentAnalysis,
        firmProfiles
      )

      // Implementation timeline prediction
      const implementationTimeline = await this.predictImplementationTimeline(
        contentAnalysis,
        historicalContext
      )

      // Cost estimation model
      const costEstimation = await this.estimateImplementationCosts(
        contentAnalysis,
        firmProfiles
      )

      // Competitive impact analysis
      const competitiveAnalysis = await this.analyzeCompetitiveImpact(
        contentAnalysis,
        sectorImpacts
      )

      // Combine all impact predictions
      const combinedImpactPrediction = this.combineImpactPredictions({
        ai: aiImpactPrediction,
        quantitative: quantitativeModel,
        sector: sectorImpacts,
        timeline: implementationTimeline,
        cost: costEstimation,
        competitive: competitiveAnalysis
      })

      // Store impact prediction
      await this.storeImpactPrediction(updateData.id, combinedImpactPrediction)

      // Emit impact events
      this.emitImpactEvents(updateData, combinedImpactPrediction)

      console.log(`✅ Impact prediction completed for update: ${updateData.id}`)
      return combinedImpactPrediction
    } catch (error) {
      console.error(`❌ Impact prediction failed for update ${updateData.id}:`, error.message)
      return this.createFallbackImpactPrediction(contentAnalysis)
    }
  }

  // AI-POWERED IMPACT PREDICTION
  async runAIImpactPrediction(updateData, firmProfiles, historicalContext) {
    try {
      const prompt = this.promptTemplates.createImpactPredictionPrompt(
        updateData,
        firmProfiles,
        historicalContext
      )

      const response = await this.aiService.makeGroqRequest(prompt)
      const prediction = this.aiService.parseAIResponse(response)

      return this.validateAIImpactPrediction(prediction)
    } catch (error) {
      console.error('AI impact prediction failed:', error.message)
      return this.createFallbackAIPrediction()
    }
  }

  // QUANTITATIVE IMPACT MODELING
  async runQuantitativeImpactModel(updateData, contentAnalysis) {
    try {
      const model = {
        overallScore: this.calculateOverallImpactScore(contentAnalysis),
        dimensionalScores: this.calculateDimensionalScores(contentAnalysis),
        firmTypeScores: this.calculateFirmTypeScores(contentAnalysis),
        sizeMultipliers: this.calculateSizeMultipliers(contentAnalysis),
        urgencyFactors: this.calculateUrgencyFactors(contentAnalysis),
        riskFactors: this.calculateRiskFactors(contentAnalysis)
      }

      return model
    } catch (error) {
      console.error('Quantitative impact modeling failed:', error.message)
      return this.createFallbackQuantitativeModel()
    }
  }

  // SECTOR-SPECIFIC IMPACT ANALYSIS
  async analyzeSectorSpecificImpacts(contentAnalysis, firmProfiles) {
    const sectorImpacts = {}
    const primarySectors = contentAnalysis.primarySectors || []

    for (const sector of primarySectors) {
      const sectorFirms = firmProfiles.filter(firm => firm.primarySector === sector)

      sectorImpacts[sector] = {
        relevanceScore: contentAnalysis.sectorRelevanceScores?.[sector] || 50,
        affectedFirms: sectorFirms.length,
        impactBreakdown: await this.calculateSectorImpactBreakdown(sector, contentAnalysis),
        specificChallenges: this.identifySectorSpecificChallenges(sector, contentAnalysis),
        opportunityAreas: this.identifyOpportunityAreas(sector, contentAnalysis),
        implementationBarriers: this.identifyImplementationBarriers(sector, contentAnalysis)
      }
    }

    return sectorImpacts
  }

  // IMPLEMENTATION TIMELINE PREDICTION
  async predictImplementationTimeline(contentAnalysis, historicalContext) {
    const baseTimeline = this.calculateBaseImplementationTime(contentAnalysis)
    const complexityFactors = this.assessComplexityFactors(contentAnalysis)
    const historicalAdjustments = this.applyHistoricalAdjustments(baseTimeline, historicalContext)

    return {
      phases: {
        assessment: this.calculatePhaseTime(baseTimeline * 0.15, complexityFactors),
        planning: this.calculatePhaseTime(baseTimeline * 0.25, complexityFactors),
        implementation: this.calculatePhaseTime(baseTimeline * 0.45, complexityFactors),
        testing: this.calculatePhaseTime(baseTimeline * 0.10, complexityFactors),
        deployment: this.calculatePhaseTime(baseTimeline * 0.05, complexityFactors)
      },
      totalEstimate: historicalAdjustments.adjustedTimeline,
      confidence: historicalAdjustments.confidence,
      criticalPath: this.identifyCriticalPath(contentAnalysis),
      riskFactors: this.identifyTimelineRisks(contentAnalysis, complexityFactors)
    }
  }

  // COST ESTIMATION MODEL
  async estimateImplementationCosts(contentAnalysis, firmProfiles) {
    const costModel = {}

    for (const firmType of this.config.firmTypes) {
      const typicalFirm = firmProfiles.find(firm => firm.type === firmType) ||
                                this.getDefaultFirmProfile(firmType)

      costModel[firmType] = {
        totalEstimate: this.calculateTotalCost(contentAnalysis, typicalFirm),
        breakdown: {
          technology: this.calculateTechnologyCosts(contentAnalysis, typicalFirm),
          compliance: this.calculateComplianceCosts(contentAnalysis, typicalFirm),
          training: this.calculateTrainingCosts(contentAnalysis, typicalFirm),
          external: this.calculateExternalCosts(contentAnalysis, typicalFirm),
          operational: this.calculateOperationalCosts(contentAnalysis, typicalFirm)
        },
        confidenceRange: this.calculateCostConfidenceRange(contentAnalysis, typicalFirm),
        ongoingCosts: this.calculateOngoingCosts(contentAnalysis, typicalFirm)
      }
    }

    return costModel
  }

  // COMPETITIVE IMPACT ANALYSIS
  async analyzeCompetitiveImpact(contentAnalysis, sectorImpacts) {
    const competitiveAnalysis = {
      marketDynamics: this.assessMarketDynamics(contentAnalysis, sectorImpacts),
      firstMoverAdvantages: this.identifyFirstMoverAdvantages(contentAnalysis),
      barrierToEntry: this.assessBarrierToEntry(contentAnalysis, sectorImpacts),
      innovationOpportunities: this.identifyInnovationOpportunities(contentAnalysis),
      consolidationRisk: this.assessConsolidationRisk(contentAnalysis, sectorImpacts),
      competitivePositioning: this.analyzeCompetitivePositioning(sectorImpacts)
    }

    return competitiveAnalysis
  }

  // IMPACT SCORE CALCULATIONS
  calculateOverallImpactScore(contentAnalysis) {
    let score = 50 // Base score

    // Impact level contribution
    const impactLevelScores = {
      Critical: 95,
      Significant: 75,
      Moderate: 55,
      Informational: 25
    }

    score = impactLevelScores[contentAnalysis.impactLevel] || 50

    // Urgency contribution
    const urgencyMultipliers = {
      Urgent: 1.2,
      High: 1.1,
      Medium: 1.0,
      Low: 0.9
    }

    score *= urgencyMultipliers[contentAnalysis.urgency] || 1.0

    // Risk level contribution
    const riskMultipliers = {
      High: 1.15,
      Medium: 1.0,
      Low: 0.95
    }

    score *= riskMultipliers[contentAnalysis.riskLevel] || 1.0

    // Sector spread penalty/boost
    const affectedSectors = contentAnalysis.primarySectors?.length || 1
    if (affectedSectors > 3) {
      score *= 1.1 // Boost for wide impact
    } else if (affectedSectors === 1) {
      score *= 0.95 // Slight penalty for narrow impact
    }

    return Math.min(100, Math.max(0, Math.round(score)))
  }

  calculateDimensionalScores(contentAnalysis) {
    const scores = {}

    for (const dimension of this.config.impactDimensions) {
      scores[dimension] = this.calculateDimensionSpecificScore(dimension, contentAnalysis)
    }

    return scores
  }

  calculateDimensionSpecificScore(dimension, contentAnalysis) {
    let score = 50 // Base score

    const area = contentAnalysis.area || ''
    const complianceActions = contentAnalysis.complianceActions || ''

    switch (dimension) {
      case 'Systems & Technology':
        if (area.includes('Digital') || area.includes('Technology') || area.includes('Data')) {
          score += 30
        }
        if (complianceActions.includes('system') || complianceActions.includes('technology')) {
          score += 15
        }
        break

      case 'Compliance & Risk':
        if (area.includes('Risk') || area.includes('Compliance') || area.includes('Capital')) {
          score += 25
        }
        if (contentAnalysis.urgency === 'High' || contentAnalysis.urgency === 'Urgent') {
          score += 20
        }
        break

      case 'Operations':
        if (area.includes('Operations') || area.includes('Process')) {
          score += 25
        }
        if (complianceActions.includes('process') || complianceActions.includes('procedure')) {
          score += 15
        }
        break

      case 'Legal & Regulatory':
        score += 20 // All regulatory updates have legal impact
        if (contentAnalysis.impactLevel === 'Critical') {
          score += 25
        }
        break

      case 'Training & Resources':
        if (complianceActions.includes('training') || complianceActions.includes('staff')) {
          score += 30
        }
        if (area.includes('Consumer') || area.includes('Conduct')) {
          score += 15
        }
        break

      case 'Financial Impact':
        if (area.includes('Capital') || area.includes('Financial')) {
          score += 30
        }
        if (contentAnalysis.impactLevel === 'Critical' || contentAnalysis.impactLevel === 'Significant') {
          score += 20
        }
        break
    }

    return Math.min(100, Math.max(0, Math.round(score)))
  }

  calculateFirmTypeScores(contentAnalysis) {
    const scores = {}

    for (const firmType of this.config.firmTypes) {
      scores[firmType] = this.calculateFirmTypeSpecificScore(firmType, contentAnalysis)
    }

    return scores
  }

  calculateFirmTypeSpecificScore(firmType, contentAnalysis) {
    let score = this.calculateOverallImpactScore(contentAnalysis)

    const area = contentAnalysis.area || ''
    const primarySectors = contentAnalysis.primarySectors || []

    // Firm type specific adjustments
    if (firmType.includes('Bank')) {
      if (primarySectors.includes('Banking')) score += 15
      if (area.includes('Capital') || area.includes('Liquidity')) score += 10
    }

    if (firmType.includes('Fintech')) {
      if (primarySectors.includes('Fintech')) score += 15
      if (area.includes('Digital') || area.includes('Innovation')) score += 10
    }

    if (firmType.includes('Insurance')) {
      if (primarySectors.includes('Insurance')) score += 15
      if (area.includes('Solvency') || area.includes('Underwriting')) score += 10
    }

    if (firmType.includes('Investment') || firmType.includes('Asset')) {
      if (primarySectors.includes('Investment Management')) score += 15
      if (area.includes('Market') || area.includes('Securities')) score += 10
    }

    return Math.min(100, Math.max(0, Math.round(score)))
  }

  // COST CALCULATION METHODS
  calculateTotalCost(contentAnalysis, firmProfile) {
    const baseCost = this.getBaseCost(firmProfile.size)
    const complexityMultiplier = this.getComplexityMultiplier(contentAnalysis)
    const sectorMultiplier = this.getSectorMultiplier(firmProfile.primarySector, contentAnalysis)

    return Math.round(baseCost * complexityMultiplier * sectorMultiplier)
  }

  getBaseCost(firmSize) {
    const baseCosts = {
      Large: 500000,
      Medium: 150000,
      Small: 50000,
      Micro: 15000
    }

    return baseCosts[firmSize] || 100000
  }

  getComplexityMultiplier(contentAnalysis) {
    let multiplier = 1.0

    if (contentAnalysis.impactLevel === 'Critical') multiplier += 0.5
    if (contentAnalysis.impactLevel === 'Significant') multiplier += 0.3
    if (contentAnalysis.urgency === 'Urgent') multiplier += 0.3
    if (contentAnalysis.urgency === 'High') multiplier += 0.2

    const affectedSectors = contentAnalysis.primarySectors?.length || 1
    if (affectedSectors > 2) multiplier += 0.1 * (affectedSectors - 2)

    return multiplier
  }

  // COMBINING IMPACT PREDICTIONS
  combineImpactPredictions(predictions) {
    const combined = {
      timestamp: new Date().toISOString(),
      overallImpact: this.calculateCombinedOverallImpact(predictions),
      firmImpacts: this.combineFirmImpacts(predictions),
      sectorAnalysis: predictions.sector,
      implementationGuidance: this.createImplementationGuidance(predictions),
      costAnalysis: predictions.cost,
      competitiveInsights: predictions.competitive,
      riskAssessment: this.createRiskAssessment(predictions),
      recommendations: this.generateRecommendations(predictions),
      confidence: this.calculatePredictionConfidence(predictions)
    }

    return combined
  }

  // STORAGE AND EVENTS
  async storeImpactPrediction(updateId, prediction) {
    try {
      const predictionData = {
        update_id: updateId,
        prediction_type: 'comprehensive',
        overall_impact: prediction.overallImpact,
        firm_impacts: prediction.firmImpacts,
        sector_analysis: prediction.sectorAnalysis,
        cost_analysis: prediction.costAnalysis,
        competitive_insights: prediction.competitiveInsights,
        confidence_score: prediction.confidence,
        predicted_at: new Date().toISOString()
      }

      await dbService.storeImpactPrediction(predictionData)
    } catch (error) {
      console.error('Failed to store impact prediction:', error.message)
    }
  }

  emitImpactEvents(updateData, prediction) {
    // Emit for high-impact predictions
    if (prediction.overallImpact?.level === 'Critical') {
      this.emit('criticalImpactPredicted', {
        update: updateData,
        prediction
      })
    }

    // Emit for high-cost impacts
    if (this.hasHighCostImpact(prediction.costAnalysis)) {
      this.emit('highCostImpactPredicted', {
        update: updateData,
        prediction
      })
    }

    // Emit for competitive implications
    if (prediction.competitiveInsights?.significantImpact) {
      this.emit('competitiveImpactDetected', {
        update: updateData,
        prediction
      })
    }
  }

  // HELPER METHODS
  async getFirmProfiles() {
    try {
      return await dbService.query('SELECT * FROM firm_profiles ORDER BY size, type')
    } catch (error) {
      console.error('Error getting firm profiles:', error.message)
      return this.getDefaultFirmProfiles()
    }
  }

  getDefaultFirmProfiles() {
    return this.config.firmTypes.map(type => ({
      type,
      size: this.inferSizeFromType(type),
      primarySector: this.inferSectorFromType(type),
      employeeCount: this.getTypicalEmployeeCount(type),
      assets: this.getTypicalAssets(type)
    }))
  }

  getDefaultFirmProfile(firmType) {
    return {
      type: firmType,
      size: this.inferSizeFromType(firmType),
      primarySector: this.inferSectorFromType(firmType),
      employeeCount: this.getTypicalEmployeeCount(firmType),
      assets: this.getTypicalAssets(firmType)
    }
  }

  initializeFirmProfiles() {
    // Initialize with default firm profiles
    return this.getDefaultFirmProfiles()
  }

  createFallbackImpactPrediction(contentAnalysis) {
    return {
      timestamp: new Date().toISOString(),
      overallImpact: {
        level: contentAnalysis?.impactLevel || 'Moderate',
        score: 60,
        confidence: 40
      },
      firmImpacts: {},
      sectorAnalysis: {},
      implementationGuidance: 'Manual assessment recommended',
      costAnalysis: {},
      competitiveInsights: {},
      riskAssessment: 'Standard regulatory change risk',
      recommendations: ['Conduct detailed internal assessment'],
      confidence: 40,
      fallback: true
    }
  }

  inferSizeFromType(type) {
    if (type.includes('Large') || type.includes('Investment Bank')) return 'Large'
    if (type.includes('Regional') || type.includes('Asset Manager')) return 'Medium'
    if (type.includes('Startup') || type.includes('Micro')) return 'Micro'
    return 'Small'
  }

  inferSectorFromType(type) {
    if (type.includes('Bank')) return 'Banking'
    if (type.includes('Insurance')) return 'Insurance'
    if (type.includes('Investment') || type.includes('Asset') || type.includes('Wealth')) return 'Investment Management'
    if (type.includes('Fintech') || type.includes('Crypto')) return 'Fintech'
    if (type.includes('Payment')) return 'Payment Services'
    return 'Banking'
  }

  getTypicalEmployeeCount(type) {
    const ranges = {
      'Large Bank': 10000,
      'Investment Bank': 8000,
      'Regional Bank': 2000,
      'Asset Manager': 500,
      'Insurance Company': 1500,
      'Fintech Startup': 50,
      'Challenger Bank': 200
    }
    return ranges[type] || 100
  }

  getTypicalAssets(type) {
    const ranges = {
      'Large Bank': 500000000000,
      'Investment Bank': 200000000000,
      'Regional Bank': 10000000000,
      'Asset Manager': 50000000000,
      'Insurance Company': 30000000000,
      'Fintech Startup': 100000000,
      'Challenger Bank': 5000000000
    }
    return ranges[type] || 1000000000
  }
}

module.exports = ImpactPredictionService
