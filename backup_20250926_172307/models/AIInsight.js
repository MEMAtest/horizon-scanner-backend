// src/models/AIInsight.js
// AI Insight Model for storing predictions, confidence scores, and pattern recognition
// Enables advanced AI-powered regulatory intelligence and trend analysis

const dbService = require('../services/dbService')

class AIInsight {
  constructor(data = {}) {
    this.id = data.id || null
    this.updateId = data.updateId || null // Reference to regulatory_updates table
    this.firmProfileId = data.firmProfileId || null // Reference to firm_profiles table
    this.insightType = data.insightType || 'general' // prediction, pattern, impact, summary, alert
    this.category = data.category || 'regulatory' // regulatory, market, compliance, risk
    this.title = data.title || ''
    this.description = data.description || ''
    this.prediction = data.prediction || null // JSON object with prediction details
    this.confidenceScore = data.confidenceScore || 0 // 0-1 confidence level
    this.businessImpact = data.businessImpact || {} // JSON with impact analysis
    this.patterns = data.patterns || [] // Array of identified patterns
    this.recommendations = data.recommendations || [] // Array of AI recommendations
    this.urgencyLevel = data.urgencyLevel || 'medium' // low, medium, high, critical
    this.relevanceScore = data.relevanceScore || 0 // 0-1 relevance to firm
    this.aiModel = data.aiModel || 'groq-llama' // AI model used for analysis
    this.processingTime = data.processingTime || 0 // Processing time in milliseconds
    this.dataSource = data.dataSource || {} // Source information for insight
    this.validUntil = data.validUntil || null // When insight becomes outdated
    this.tags = data.tags || [] // Searchable tags
    this.metadata = data.metadata || {} // Additional AI metadata
    this.isActive = data.isActive !== undefined ? data.isActive : true
    this.createdAt = data.createdAt || new Date()
    this.updatedAt = data.updatedAt || new Date()
  }

  // Validate insight data
  validate() {
    const errors = []

    if (!this.title || this.title.trim().length === 0) {
      errors.push('Title is required')
    }

    const validInsightTypes = ['prediction', 'pattern', 'impact', 'summary', 'alert', 'trend', 'recommendation']
    if (!validInsightTypes.includes(this.insightType)) {
      errors.push(`Invalid insight type. Must be one of: ${validInsightTypes.join(', ')}`)
    }

    const validCategories = ['regulatory', 'market', 'compliance', 'risk', 'operational', 'strategic']
    if (!validCategories.includes(this.category)) {
      errors.push(`Invalid category. Must be one of: ${validCategories.join(', ')}`)
    }

    if (this.confidenceScore < 0 || this.confidenceScore > 1) {
      errors.push('Confidence score must be between 0 and 1')
    }

    if (this.relevanceScore < 0 || this.relevanceScore > 1) {
      errors.push('Relevance score must be between 0 and 1')
    }

    const validUrgencyLevels = ['low', 'medium', 'high', 'critical']
    if (!validUrgencyLevels.includes(this.urgencyLevel)) {
      errors.push(`Invalid urgency level. Must be one of: ${validUrgencyLevels.join(', ')}`)
    }

    return errors
  }

  // Generate business impact assessment
  generateBusinessImpactAssessment() {
    const impact = {
      financial: {
        score: 0, // 0-10 scale
        description: '',
        estimatedCost: null,
        timeframe: ''
      },
      operational: {
        score: 0,
        description: '',
        systemChanges: [],
        processChanges: []
      },
      compliance: {
        score: 0,
        description: '',
        deadlines: [],
        requirements: []
      },
      strategic: {
        score: 0,
        description: '',
        opportunities: [],
        risks: []
      },
      overall: {
        score: 0,
        priority: 'medium',
        actionRequired: false,
        summary: ''
      }
    }

    return impact
  }

  // Calculate urgency based on multiple factors
  calculateUrgency(factors = {}) {
    let urgencyScore = 0
    const weights = {
      deadline: 0.4,
      businessImpact: 0.3,
      confidence: 0.2,
      firmRelevance: 0.1
    }

    // Deadline urgency
    if (factors.deadlineInDays !== undefined) {
      if (factors.deadlineInDays <= 7) urgencyScore += weights.deadline * 1.0
      else if (factors.deadlineInDays <= 30) urgencyScore += weights.deadline * 0.7
      else if (factors.deadlineInDays <= 90) urgencyScore += weights.deadline * 0.4
      else urgencyScore += weights.deadline * 0.1
    }

    // Business impact urgency
    if (this.businessImpact.overall && this.businessImpact.overall.score) {
      urgencyScore += weights.businessImpact * (this.businessImpact.overall.score / 10)
    }

    // Confidence weighting
    urgencyScore += weights.confidence * this.confidenceScore

    // Firm relevance weighting
    urgencyScore += weights.firmRelevance * this.relevanceScore

    // Convert to urgency level
    if (urgencyScore >= 0.8) return 'critical'
    if (urgencyScore >= 0.6) return 'high'
    if (urgencyScore >= 0.4) return 'medium'
    return 'low'
  }

  // Generate AI recommendations based on insight
  generateRecommendations() {
    const recommendations = []

    if (this.insightType === 'prediction') {
      recommendations.push({
        type: 'monitoring',
        title: 'Monitor Development',
        description: 'Track regulatory developments closely',
        priority: this.urgencyLevel,
        timeline: 'ongoing'
      })
    }

    if (this.insightType === 'impact' && this.businessImpact.overall.score > 6) {
      recommendations.push({
        type: 'preparation',
        title: 'Begin Impact Assessment',
        description: 'Start detailed business impact analysis',
        priority: 'high',
        timeline: 'immediate'
      })
    }

    if (this.urgencyLevel === 'critical') {
      recommendations.push({
        type: 'escalation',
        title: 'Executive Alert',
        description: 'Escalate to senior management immediately',
        priority: 'critical',
        timeline: 'immediate'
      })
    }

    return recommendations
  }

  // Check if insight is still valid
  isValid() {
    if (!this.validUntil) return true
    return new Date() < new Date(this.validUntil)
  }

  // Get insight summary for dashboard display
  getSummary() {
    return {
      id: this.id,
      title: this.title,
      type: this.insightType,
      urgency: this.urgencyLevel,
      confidence: this.confidenceScore,
      relevance: this.relevanceScore,
      businessImpact: this.businessImpact.overall?.score || 0,
      createdAt: this.createdAt,
      isValid: this.isValid()
    }
  }

  // Convert to database format
  toDbFormat() {
    return {
      id: this.id,
      update_id: this.updateId,
      firm_profile_id: this.firmProfileId,
      insight_type: this.insightType,
      category: this.category,
      title: this.title,
      description: this.description,
      prediction: JSON.stringify(this.prediction),
      confidence_score: this.confidenceScore,
      business_impact: JSON.stringify(this.businessImpact),
      patterns: JSON.stringify(this.patterns),
      recommendations: JSON.stringify(this.recommendations),
      urgency_level: this.urgencyLevel,
      relevance_score: this.relevanceScore,
      ai_model: this.aiModel,
      processing_time: this.processingTime,
      data_source: JSON.stringify(this.dataSource),
      valid_until: this.validUntil,
      tags: JSON.stringify(this.tags),
      metadata: JSON.stringify(this.metadata),
      is_active: this.isActive,
      created_at: this.createdAt,
      updated_at: this.updatedAt
    }
  }

  // Create from database format
  static fromDbFormat(dbData) {
    if (!dbData) return null

    return new AIInsight({
      id: dbData.id,
      updateId: dbData.update_id,
      firmProfileId: dbData.firm_profile_id,
      insightType: dbData.insight_type,
      category: dbData.category,
      title: dbData.title,
      description: dbData.description,
      prediction: dbData.prediction ? JSON.parse(dbData.prediction) : null,
      confidenceScore: dbData.confidence_score,
      businessImpact: dbData.business_impact ? JSON.parse(dbData.business_impact) : {},
      patterns: dbData.patterns ? JSON.parse(dbData.patterns) : [],
      recommendations: dbData.recommendations ? JSON.parse(dbData.recommendations) : [],
      urgencyLevel: dbData.urgency_level,
      relevanceScore: dbData.relevance_score,
      aiModel: dbData.ai_model,
      processingTime: dbData.processing_time,
      dataSource: dbData.data_source ? JSON.parse(dbData.data_source) : {},
      validUntil: dbData.valid_until,
      tags: dbData.tags ? JSON.parse(dbData.tags) : [],
      metadata: dbData.metadata ? JSON.parse(dbData.metadata) : {},
      isActive: dbData.is_active,
      createdAt: dbData.created_at,
      updatedAt: dbData.updated_at
    })
  }

  // Save to database
  async save() {
    const errors = this.validate()
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`)
    }

    this.updatedAt = new Date()

    try {
      const dbData = this.toDbFormat()

      if (this.id) {
        // Update existing
        const query = `
                    UPDATE ai_insights SET 
                        update_id = $1, firm_profile_id = $2, insight_type = $3, category = $4,
                        title = $5, description = $6, prediction = $7, confidence_score = $8,
                        business_impact = $9, patterns = $10, recommendations = $11,
                        urgency_level = $12, relevance_score = $13, ai_model = $14,
                        processing_time = $15, data_source = $16, valid_until = $17,
                        tags = $18, metadata = $19, is_active = $20, updated_at = $21
                    WHERE id = $22
                    RETURNING *
                `
        const values = [
          dbData.update_id, dbData.firm_profile_id, dbData.insight_type, dbData.category,
          dbData.title, dbData.description, dbData.prediction, dbData.confidence_score,
          dbData.business_impact, dbData.patterns, dbData.recommendations,
          dbData.urgency_level, dbData.relevance_score, dbData.ai_model,
          dbData.processing_time, dbData.data_source, dbData.valid_until,
          dbData.tags, dbData.metadata, dbData.is_active, dbData.updated_at, this.id
        ]

        const result = await dbService.query(query, values)
        return AIInsight.fromDbFormat(result.rows[0])
      } else {
        // Create new
        const query = `
                    INSERT INTO ai_insights (
                        update_id, firm_profile_id, insight_type, category, title, description,
                        prediction, confidence_score, business_impact, patterns, recommendations,
                        urgency_level, relevance_score, ai_model, processing_time, data_source,
                        valid_until, tags, metadata, is_active, created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
                    RETURNING *
                `
        const values = [
          dbData.update_id, dbData.firm_profile_id, dbData.insight_type, dbData.category,
          dbData.title, dbData.description, dbData.prediction, dbData.confidence_score,
          dbData.business_impact, dbData.patterns, dbData.recommendations,
          dbData.urgency_level, dbData.relevance_score, dbData.ai_model,
          dbData.processing_time, dbData.data_source, dbData.valid_until,
          dbData.tags, dbData.metadata, dbData.is_active, dbData.created_at, dbData.updated_at
        ]

        const result = await dbService.query(query, values)
        const savedInsight = AIInsight.fromDbFormat(result.rows[0])
        this.id = savedInsight.id
        return savedInsight
      }
    } catch (error) {
      console.error('Error saving AI insight:', error)
      throw error
    }
  }

  // Find by ID
  static async findById(id) {
    try {
      const query = 'SELECT * FROM ai_insights WHERE id = $1 AND is_active = true'
      const result = await dbService.query(query, [id])
      return result.rows.length > 0 ? AIInsight.fromDbFormat(result.rows[0]) : null
    } catch (error) {
      console.error('Error finding AI insight:', error)
      throw error
    }
  }

  // Find by update ID
  static async findByUpdateId(updateId) {
    try {
      const query = 'SELECT * FROM ai_insights WHERE update_id = $1 AND is_active = true ORDER BY created_at DESC'
      const result = await dbService.query(query, [updateId])
      return result.rows.map(row => AIInsight.fromDbFormat(row))
    } catch (error) {
      console.error('Error finding AI insights by update ID:', error)
      throw error
    }
  }

  // Find by firm profile
  static async findByFirmProfile(firmProfileId, limit = 50) {
    try {
      const query = `
                SELECT * FROM ai_insights 
                WHERE firm_profile_id = $1 AND is_active = true 
                ORDER BY created_at DESC 
                LIMIT $2
            `
      const result = await dbService.query(query, [firmProfileId, limit])
      return result.rows.map(row => AIInsight.fromDbFormat(row))
    } catch (error) {
      console.error('Error finding AI insights by firm profile:', error)
      throw error
    }
  }

  // Find recent insights
  static async findRecent(hours = 24, limit = 100) {
    try {
      const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000))
      const query = `
                SELECT * FROM ai_insights 
                WHERE created_at > $1 AND is_active = true 
                ORDER BY urgency_level DESC, confidence_score DESC, created_at DESC 
                LIMIT $2
            `
      const result = await dbService.query(query, [cutoffTime, limit])
      return result.rows.map(row => AIInsight.fromDbFormat(row))
    } catch (error) {
      console.error('Error finding recent AI insights:', error)
      throw error
    }
  }

  // Find by urgency level
  static async findByUrgency(urgencyLevel, limit = 50) {
    try {
      const query = `
                SELECT * FROM ai_insights 
                WHERE urgency_level = $1 AND is_active = true 
                ORDER BY confidence_score DESC, created_at DESC 
                LIMIT $2
            `
      const result = await dbService.query(query, [urgencyLevel, limit])
      return result.rows.map(row => AIInsight.fromDbFormat(row))
    } catch (error) {
      console.error('Error finding AI insights by urgency:', error)
      throw error
    }
  }

  // Find patterns by type
  static async findPatterns(patternType, limit = 20) {
    try {
      const query = `
                SELECT * FROM ai_insights 
                WHERE insight_type = 'pattern' AND tags @> $1 AND is_active = true 
                ORDER BY confidence_score DESC, created_at DESC 
                LIMIT $2
            `
      const result = await dbService.query(query, [JSON.stringify([patternType]), limit])
      return result.rows.map(row => AIInsight.fromDbFormat(row))
    } catch (error) {
      console.error('Error finding patterns:', error)
      throw error
    }
  }

  // Get insight statistics
  static async getStatistics() {
    try {
      const query = `
                SELECT 
                    COUNT(*) as total_insights,
                    COUNT(CASE WHEN urgency_level = 'critical' THEN 1 END) as critical_insights,
                    COUNT(CASE WHEN urgency_level = 'high' THEN 1 END) as high_insights,
                    AVG(confidence_score) as avg_confidence,
                    AVG(relevance_score) as avg_relevance,
                    COUNT(CASE WHEN insight_type = 'prediction' THEN 1 END) as predictions,
                    COUNT(CASE WHEN insight_type = 'pattern' THEN 1 END) as patterns
                FROM ai_insights 
                WHERE is_active = true AND created_at > NOW() - INTERVAL '30 days'
            `
      const result = await dbService.query(query)
      return result.rows[0]
    } catch (error) {
      console.error('Error getting AI insight statistics:', error)
      throw error
    }
  }
}

module.exports = AIInsight
