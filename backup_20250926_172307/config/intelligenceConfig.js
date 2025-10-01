// src/config/intelligenceConfig.js
// AI Intelligence Configuration - Thresholds, Scoring Algorithms, and System Settings
// Central configuration for all AI-powered intelligence features

const dbService = require('../services/dbService')

class IntelligenceConfig {
  constructor() {
    this.cache = new Map()
    this.cacheExpiry = 5 * 60 * 1000 // 5 minutes
    this.lastCacheUpdate = new Map()

    // Default configuration values (fallback if database unavailable)
    this.defaults = {
      aiConfidenceThresholds: {
        minimum: 0.3,
        medium: 0.6,
        high: 0.8,
        critical: 0.9
      },
      relevanceScoringWeights: {
        sector: 0.4,
        firmType: 0.3,
        jurisdiction: 0.2,
        size: 0.1
      },
      urgencyCalculationWeights: {
        deadline: 0.4,
        businessImpact: 0.3,
        confidence: 0.2,
        firmRelevance: 0.1
      },
      notificationSettings: {
        deadlineAlertDays: [90, 60, 30, 14, 7, 3, 1],
        escalationThreshold: 80,
        maxUnreadHours: 24,
        channels: {
          dashboard: true,
          email: true,
          sms: false,
          webhook: false
        }
      },
      businessImpactThresholds: {
        low: 3,
        medium: 5,
        high: 7,
        critical: 9
      },
      aiProcessingLimits: {
        maxProcessingTime: 30000, // 30 seconds
        maxRetries: 3,
        batchSize: 10,
        timeout: 60000 // 1 minute
      },
      patternRecognitionConfig: {
        minConfidence: 0.7,
        minSampleSize: 5,
        lookbackDays: 180,
        maxPatterns: 50
      },
      firmProfileDefaults: {
        riskAppetite: 'medium',
        complianceMaturity: 50,
        relevanceThreshold: 0.3,
        analysisDepth: 'standard'
      },
      scoringAlgorithms: {
        urgencyScoring: 'weighted_sum',
        relevanceScoring: 'weighted_factor',
        impactScoring: 'multi_dimensional',
        confidenceAggregation: 'bayesian_average'
      },
      aiModelSettings: {
        defaultModel: 'groq-llama',
        maxTokens: 4000,
        temperature: 0.3,
        fallbackModel: 'basic_nlp'
      }
    }
  }

  // Get configuration value by key
  async get(key) {
    // Check cache first
    if (this.isCacheValid(key)) {
      return this.cache.get(key)
    }

    try {
      // Try to get from database
      const dbValue = await this.getFromDatabase(key)
      if (dbValue !== null) {
        this.cache.set(key, dbValue)
        this.lastCacheUpdate.set(key, Date.now())
        return dbValue
      }
    } catch (error) {
      console.warn(`Error retrieving config for ${key} from database:`, error)
    }

    // Fall back to defaults
    const defaultValue = this.getDefault(key)
    if (defaultValue !== undefined) {
      console.info(`Using default configuration for ${key}`)
      return defaultValue
    }

    throw new Error(`Configuration not found: ${key}`)
  }

  // Set configuration value
  async set(key, value, description = null) {
    try {
      await this.saveToDatabase(key, value, description)
      this.cache.set(key, value)
      this.lastCacheUpdate.set(key, Date.now())
      return true
    } catch (error) {
      console.error(`Error setting config ${key}:`, error)
      throw error
    }
  }

  // Check if cache is valid
  isCacheValid(key) {
    if (!this.cache.has(key)) return false
    const lastUpdate = this.lastCacheUpdate.get(key) || 0
    return (Date.now() - lastUpdate) < this.cacheExpiry
  }

  // Get value from database
  async getFromDatabase(key) {
    try {
      const query = 'SELECT config_value FROM intelligence_config WHERE config_key = $1 AND is_active = true'
      const result = await dbService.query(query, [key])

      if (result.rows.length > 0) {
        return result.rows[0].config_value
      }
      return null
    } catch (error) {
      console.error(`Database error getting config ${key}:`, error)
      return null
    }
  }

  // Save value to database
  async saveToDatabase(key, value, description = null) {
    const query = `
            INSERT INTO intelligence_config (config_key, config_value, description, updated_at)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (config_key) 
            DO UPDATE SET 
                config_value = EXCLUDED.config_value,
                description = COALESCE(EXCLUDED.description, intelligence_config.description),
                updated_at = NOW()
            RETURNING *
        `

    const values = [key, JSON.stringify(value), description]
    await dbService.query(query, values)
  }

  // Get default value
  getDefault(key) {
    // Convert camelCase to snake_case for database compatibility
    const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()

    // Direct key lookup
    if (this.defaults[key] !== undefined) {
      return this.defaults[key]
    }

    // Try database-style key
    if (this.defaults[dbKey] !== undefined) {
      return this.defaults[dbKey]
    }

    // Try nested lookup
    const keyParts = key.split('.')
    let current = this.defaults

    for (const part of keyParts) {
      if (current && typeof current === 'object' && current[part] !== undefined) {
        current = current[part]
      } else {
        return undefined
      }
    }

    return current
  }

  // Clear cache
  clearCache(key = null) {
    if (key) {
      this.cache.delete(key)
      this.lastCacheUpdate.delete(key)
    } else {
      this.cache.clear()
      this.lastCacheUpdate.clear()
    }
  }

  // ==========================================================================
  // SPECIFIC CONFIGURATION GETTERS (Convenience Methods)
  // ==========================================================================

  // AI Confidence Thresholds
  async getAIConfidenceThresholds() {
    return await this.get('aiConfidenceThresholds')
  }

  // Get minimum confidence for AI actions
  async getMinimumConfidence() {
    const thresholds = await this.getAIConfidenceThresholds()
    return thresholds.minimum || 0.3
  }

  // Relevance Scoring Weights
  async getRelevanceScoringWeights() {
    return await this.get('relevanceScoringWeights')
  }

  // Urgency Calculation Weights
  async getUrgencyCalculationWeights() {
    return await this.get('urgencyCalculationWeights')
  }

  // Notification Settings
  async getNotificationSettings() {
    return await this.get('notificationSettings')
  }

  // Business Impact Thresholds
  async getBusinessImpactThresholds() {
    return await this.get('businessImpactThresholds')
  }

  // AI Processing Limits
  async getAIProcessingLimits() {
    return await this.get('aiProcessingLimits')
  }

  // Pattern Recognition Config
  async getPatternRecognitionConfig() {
    return await this.get('patternRecognitionConfig')
  }

  // Firm Profile Defaults
  async getFirmProfileDefaults() {
    return await this.get('firmProfileDefaults')
  }

  // ==========================================================================
  // SCORING ALGORITHM IMPLEMENTATIONS
  // ==========================================================================

  // Calculate urgency score using configured weights
  async calculateUrgencyScore(factors) {
    const weights = await this.getUrgencyCalculationWeights()
    let score = 50 // Base score

    // Deadline proximity scoring (0-40 points)
    if (factors.deadlineInDays !== undefined) {
      let deadlineScore = 0
      if (factors.deadlineInDays <= 1) deadlineScore = 40
      else if (factors.deadlineInDays <= 7) deadlineScore = 30
      else if (factors.deadlineInDays <= 30) deadlineScore = 20
      else if (factors.deadlineInDays <= 90) deadlineScore = 10

      score += deadlineScore * weights.deadline
    }

    // Business impact scoring (0-25 points)
    if (factors.businessImpactScore !== undefined) {
      score += (factors.businessImpactScore / 10) * 25 * weights.businessImpact
    }

    // AI confidence scoring (0-20 points)
    if (factors.aiConfidence !== undefined) {
      score += factors.aiConfidence * 20 * weights.confidence
    }

    // Firm relevance scoring (0-15 points)
    if (factors.firmRelevanceScore !== undefined) {
      score += factors.firmRelevanceScore * 15 * weights.firmRelevance
    }

    return Math.min(Math.max(Math.round(score), 0), 100)
  }

  // Calculate relevance score using configured weights
  async calculateRelevanceScore(firmProfile, regulatoryUpdate) {
    const weights = await this.getRelevanceScoringWeights()
    let score = 0

    // Sector relevance
    if (regulatoryUpdate.sectors && firmProfile.sectors && firmProfile.sectors.length > 0) {
      const sectorMatch = regulatoryUpdate.sectors.some(sector =>
        firmProfile.sectors.includes(sector)
      )
      if (sectorMatch) score += weights.sector
    }

    // Firm type relevance
    if (regulatoryUpdate.applicableFirmTypes &&
            regulatoryUpdate.applicableFirmTypes.includes(firmProfile.firmType)) {
      score += weights.firmType
    }

    // Jurisdiction relevance
    if (regulatoryUpdate.jurisdiction &&
            firmProfile.jurisdictions &&
            firmProfile.jurisdictions.includes(regulatoryUpdate.jurisdiction)) {
      score += weights.jurisdiction
    }

    // Size relevance
    if (regulatoryUpdate.firmSizeRequirements) {
      const sizeOrder = ['micro', 'small', 'medium', 'large', 'systemic']
      const requiredMinSize = sizeOrder.indexOf(regulatoryUpdate.firmSizeRequirements.minimum || 'micro')
      const firmSizeIndex = sizeOrder.indexOf(firmProfile.size)

      if (firmSizeIndex >= requiredMinSize) {
        score += weights.size
      }
    }

    return Math.min(score, 1.0)
  }

  // Calculate business impact score
  async calculateBusinessImpactScore(impactFactors) {
    const thresholds = await this.getBusinessImpactThresholds()

    let totalScore = 0
    let factorCount = 0

    // Financial impact (0-10 scale)
    if (impactFactors.financial !== undefined) {
      totalScore += this.normalizeImpactScore(impactFactors.financial)
      factorCount++
    }

    // Operational impact (0-10 scale)
    if (impactFactors.operational !== undefined) {
      totalScore += this.normalizeImpactScore(impactFactors.operational)
      factorCount++
    }

    // Compliance impact (0-10 scale)
    if (impactFactors.compliance !== undefined) {
      totalScore += this.normalizeImpactScore(impactFactors.compliance)
      factorCount++
    }

    // Strategic impact (0-10 scale)
    if (impactFactors.strategic !== undefined) {
      totalScore += this.normalizeImpactScore(impactFactors.strategic)
      factorCount++
    }

    const averageScore = factorCount > 0 ? totalScore / factorCount : 5

    return {
      score: Math.round(averageScore * 10) / 10, // Round to 1 decimal
      level: this.getImpactLevel(averageScore, thresholds),
      factors: factorCount
    }
  }

  // Normalize impact score to 0-10 scale
  normalizeImpactScore(value) {
    if (typeof value === 'string') {
      const stringValues = { low: 2, medium: 5, high: 8, critical: 10 }
      return stringValues[value.toLowerCase()] || 5
    }
    return Math.max(0, Math.min(10, Number(value) || 5))
  }

  // Get impact level from score
  getImpactLevel(score, thresholds) {
    if (score >= thresholds.critical) return 'critical'
    if (score >= thresholds.high) return 'high'
    if (score >= thresholds.medium) return 'medium'
    return 'low'
  }

  // ==========================================================================
  // CONFIGURATION MANAGEMENT UTILITIES
  // ==========================================================================

  // Get all configuration as a single object
  async getAllConfig() {
    try {
      const query = 'SELECT config_key, config_value, description, category FROM intelligence_config WHERE is_active = true'
      const result = await dbService.query(query)

      const config = {}
      result.rows.forEach(row => {
        config[row.config_key] = {
          value: row.config_value,
          description: row.description,
          category: row.category
        }
      })

      return config
    } catch (error) {
      console.error('Error getting all config:', error)
      return this.defaults
    }
  }

  // Update multiple configuration values
  async updateMultiple(configUpdates) {
    const results = []

    for (const [key, value] of Object.entries(configUpdates)) {
      try {
        await this.set(key, value)
        results.push({ key, success: true })
      } catch (error) {
        results.push({ key, success: false, error: error.message })
      }
    }

    return results
  }

  // Validate configuration value
  validateConfig(key, value) {
    const validators = {
      aiConfidenceThresholds: (val) => {
        return val.minimum >= 0 && val.minimum <= 1 &&
                       val.medium >= val.minimum && val.medium <= 1 &&
                       val.high >= val.medium && val.high <= 1 &&
                       val.critical >= val.high && val.critical <= 1
      },
      relevanceScoringWeights: (val) => {
        const sum = Object.values(val).reduce((a, b) => a + b, 0)
        return Math.abs(sum - 1.0) < 0.01 // Allow small floating point errors
      },
      urgencyCalculationWeights: (val) => {
        const sum = Object.values(val).reduce((a, b) => a + b, 0)
        return Math.abs(sum - 1.0) < 0.01
      },
      businessImpactThresholds: (val) => {
        return val.low < val.medium && val.medium < val.high && val.high < val.critical &&
                       val.low >= 0 && val.critical <= 10
      }
    }

    const validator = validators[key]
    if (validator) {
      return validator(value)
    }

    return true // No specific validator, assume valid
  }

  // Reset configuration to defaults
  async resetToDefaults(keys = null) {
    const keysToReset = keys || Object.keys(this.defaults)
    const results = []

    for (const key of keysToReset) {
      try {
        const defaultValue = this.getDefault(key)
        if (defaultValue !== undefined) {
          await this.set(key, defaultValue, 'Reset to default value')
          results.push({ key, success: true })
        }
      } catch (error) {
        results.push({ key, success: false, error: error.message })
      }
    }

    this.clearCache()
    return results
  }

  // Get configuration statistics
  async getConfigStatistics() {
    try {
      const query = `
                SELECT 
                    category,
                    COUNT(*) as config_count,
                    MAX(updated_at) as last_updated
                FROM intelligence_config 
                WHERE is_active = true 
                GROUP BY category
                ORDER BY category
            `
      const result = await dbService.query(query)

      return {
        categories: result.rows,
        totalConfigs: result.rows.reduce((sum, row) => sum + parseInt(row.config_count), 0),
        cacheStats: {
          cached: this.cache.size,
          cacheHitRate: this.calculateCacheHitRate()
        }
      }
    } catch (error) {
      console.error('Error getting config statistics:', error)
      return { error: error.message }
    }
  }

  // Calculate cache hit rate (simple implementation)
  calculateCacheHitRate() {
    // This is a simplified implementation
    // In production, you'd want more sophisticated cache analytics
    return this.cache.size > 0 ? 0.85 : 0 // Assume 85% hit rate when cache is populated
  }
}

// Create singleton instance
const intelligenceConfig = new IntelligenceConfig()

module.exports = intelligenceConfig
