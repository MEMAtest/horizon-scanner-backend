const dbService = require('./dbService')

/**
 * Business Line Profile Service
 * Manages business line profiles for tailored regulatory news filtering
 */
class BusinessLineProfileService {
  constructor() {
    this.db = dbService
  }

  /**
   * Get all business line profiles for a user
   */
  async getProfiles(userId = 'default', options = {}) {
    try {
      return await this.db.getBusinessLineProfiles(userId, options)
    } catch (error) {
      console.error('Error getting business line profiles:', error.message)
      return []
    }
  }

  /**
   * Get a single business line profile by ID
   */
  async getProfileById(profileId, userId = 'default') {
    try {
      return await this.db.getBusinessLineProfileById(profileId, userId)
    } catch (error) {
      console.error('Error getting business line profile:', error.message)
      return null
    }
  }

  /**
   * Get the default business line profile for a user
   */
  async getDefaultProfile(userId = 'default') {
    try {
      return await this.db.getDefaultBusinessLineProfile(userId)
    } catch (error) {
      console.error('Error getting default business line profile:', error.message)
      return null
    }
  }

  /**
   * Create a new business line profile
   */
  async createProfile(userId = 'default', profileData = {}) {
    try {
      // Validate required fields
      if (!profileData.name || !profileData.name.trim()) {
        throw new Error('Profile name is required')
      }

      return await this.db.createBusinessLineProfile(userId, profileData)
    } catch (error) {
      console.error('Error creating business line profile:', error.message)
      throw error
    }
  }

  /**
   * Update an existing business line profile
   */
  async updateProfile(profileId, userId = 'default', updates = {}) {
    try {
      // Ensure profile exists
      const existing = await this.db.getBusinessLineProfileById(profileId, userId)
      if (!existing) {
        throw new Error('Profile not found')
      }

      return await this.db.updateBusinessLineProfile(profileId, userId, updates)
    } catch (error) {
      console.error('Error updating business line profile:', error.message)
      throw error
    }
  }

  /**
   * Delete (soft delete) a business line profile
   */
  async deleteProfile(profileId, userId = 'default') {
    try {
      const result = await this.db.deleteBusinessLineProfile(profileId, userId)
      if (!result) {
        throw new Error('Profile not found or already deleted')
      }
      return result
    } catch (error) {
      console.error('Error deleting business line profile:', error.message)
      throw error
    }
  }

  /**
   * Set a profile as the default for a user
   */
  async setDefaultProfile(profileId, userId = 'default') {
    try {
      const result = await this.db.setDefaultBusinessLineProfile(profileId, userId)
      if (!result) {
        throw new Error('Profile not found')
      }
      return result
    } catch (error) {
      console.error('Error setting default business line profile:', error.message)
      throw error
    }
  }

  /**
   * Build filter criteria from a business line profile
   * Used for filtering regulatory updates based on profile settings
   */
  buildFilterFromProfile(profile) {
    if (!profile) return {}

    const filters = {}

    // Filter by sectors (use 'sector' key to match db/updates.js)
    if (profile.sectors && profile.sectors.length > 0) {
      filters.sector = profile.sectors
    }

    // Filter by regulators/authorities (use 'authority' key to match db/updates.js)
    if (profile.regulators && profile.regulators.length > 0) {
      filters.authority = profile.regulators
    }

    // Filter by regions
    if (profile.regions && profile.regions.length > 0) {
      filters.regions = profile.regions
    }

    // Set relevance threshold
    if (profile.relevanceThreshold) {
      filters.relevanceThreshold = profile.relevanceThreshold
    }

    // Priority keywords boost
    if (profile.priorityKeywords && profile.priorityKeywords.length > 0) {
      filters.priorityKeywords = profile.priorityKeywords
    }

    // Excluded keywords filter
    if (profile.excludedKeywords && profile.excludedKeywords.length > 0) {
      filters.excludedKeywords = profile.excludedKeywords
    }

    return filters
  }

  /**
   * Get filtered regulatory updates based on a business line profile
   */
  async getFilteredUpdates(profileId, userId = 'default', additionalFilters = {}) {
    try {
      // Get the profile
      const profile = await this.getProfileById(profileId, userId)
      if (!profile) {
        throw new Error('Profile not found')
      }

      // Build filters from profile
      const profileFilters = this.buildFilterFromProfile(profile)

      // Merge with additional filters
      const mergedFilters = {
        ...profileFilters,
        ...additionalFilters
      }

      // Get updates with combined filters
      const updates = await this.db.getEnhancedUpdates(mergedFilters)

      // Apply priority keyword boosting
      if (profile.priorityKeywords && profile.priorityKeywords.length > 0) {
        updates.forEach(update => {
          const text = `${update.headline || ''} ${update.ai_summary || ''} ${update.summary || ''}`.toLowerCase()
          const matchCount = profile.priorityKeywords.filter(kw =>
            text.includes(kw.toLowerCase())
          ).length
          update.priorityBoost = matchCount
        })

        // Sort by priority boost (higher first) then by date
        updates.sort((a, b) => {
          if (b.priorityBoost !== a.priorityBoost) {
            return b.priorityBoost - a.priorityBoost
          }
          return new Date(b.published_date) - new Date(a.published_date)
        })
      }

      // Filter out excluded keywords
      if (profile.excludedKeywords && profile.excludedKeywords.length > 0) {
        return updates.filter(update => {
          const text = `${update.headline || ''} ${update.ai_summary || ''} ${update.summary || ''}`.toLowerCase()
          return !profile.excludedKeywords.some(kw =>
            text.includes(kw.toLowerCase())
          )
        })
      }

      return updates
    } catch (error) {
      console.error('Error getting filtered updates:', error.message)
      throw error
    }
  }

  /**
   * Calculate relevance score for an update against a profile
   */
  calculateRelevanceScore(update, profile) {
    if (!update || !profile) return 0

    let score = 0
    const weights = {
      sector: 0.35,
      regulator: 0.30,
      region: 0.15,
      keyword: 0.20
    }

    // Sector match
    if (profile.sectors && profile.sectors.length > 0) {
      const updateSector = (update.sector || '').toLowerCase()
      const sectorMatch = profile.sectors.some(s =>
        updateSector.includes(s.toLowerCase()) ||
        s.toLowerCase().includes(updateSector)
      )
      if (sectorMatch) score += weights.sector
    }

    // Regulator match
    if (profile.regulators && profile.regulators.length > 0) {
      const updateAuthority = (update.authority || '').toLowerCase()
      const regulatorMatch = profile.regulators.some(r =>
        updateAuthority.includes(r.toLowerCase()) ||
        r.toLowerCase().includes(updateAuthority)
      )
      if (regulatorMatch) score += weights.regulator
    }

    // Region match (if available)
    if (profile.regions && profile.regions.length > 0) {
      // Default to UK for most UK regulators
      const ukRegulators = ['fca', 'pra', 'bank of england', 'hm treasury', 'hmrc']
      const updateAuthority = (update.authority || '').toLowerCase()
      const isUK = ukRegulators.some(r => updateAuthority.includes(r))

      if (profile.regions.includes('UK') && isUK) {
        score += weights.region
      }
    }

    // Keyword match
    if (profile.priorityKeywords && profile.priorityKeywords.length > 0) {
      const text = `${update.headline || ''} ${update.ai_summary || ''} ${update.summary || ''}`.toLowerCase()
      const keywordMatches = profile.priorityKeywords.filter(kw =>
        text.includes(kw.toLowerCase())
      ).length
      const keywordScore = Math.min(keywordMatches / profile.priorityKeywords.length, 1)
      score += weights.keyword * keywordScore
    }

    return Math.round(score * 100) / 100
  }

  /**
   * Get preset business line templates
   */
  getPresetTemplates() {
    return [
      {
        name: 'Retail Banking',
        description: 'Consumer banking, deposits, mortgages, and personal loans',
        sectors: ['Banking', 'Consumer Credit', 'Mortgages'],
        regulators: ['FCA', 'PRA', 'Bank of England', 'PSR'],
        regions: ['UK'],
        firmSize: 'large',
        riskAppetite: 'medium',
        color: '#3B82F6',
        icon: 'building-bank'
      },
      {
        name: 'Wealth Management',
        description: 'Investment advice, portfolio management, and private banking',
        sectors: ['Investment Management', 'Capital Markets', 'Private Banking'],
        regulators: ['FCA', 'ESMA', 'Bank of England'],
        regions: ['UK', 'EU'],
        firmSize: 'medium',
        riskAppetite: 'medium',
        color: '#10B981',
        icon: 'chart-line'
      },
      {
        name: 'Insurance',
        description: 'Life, general, and health insurance products',
        sectors: ['Insurance', 'Reinsurance'],
        regulators: ['FCA', 'PRA', 'EIOPA'],
        regions: ['UK', 'EU'],
        firmSize: 'large',
        riskAppetite: 'low',
        color: '#8B5CF6',
        icon: 'shield-check'
      },
      {
        name: 'Payments & Fintech',
        description: 'Payment services, e-money, and digital banking',
        sectors: ['Payments', 'E-money', 'Fintech'],
        regulators: ['FCA', 'PSR', 'Bank of England', 'Pay.UK'],
        regions: ['UK'],
        firmSize: 'small',
        riskAppetite: 'high',
        color: '#F59E0B',
        icon: 'credit-card'
      },
      {
        name: 'Corporate Banking',
        description: 'Business lending, trade finance, and corporate treasury',
        sectors: ['Banking', 'Capital Markets', 'Trade Finance'],
        regulators: ['FCA', 'PRA', 'Bank of England', 'FATF'],
        regions: ['UK', 'EU'],
        firmSize: 'large',
        riskAppetite: 'medium',
        color: '#EC4899',
        icon: 'briefcase'
      },
      {
        name: 'Asset Management',
        description: 'Fund management, ETFs, and institutional investment',
        sectors: ['Investment Management', 'Capital Markets'],
        regulators: ['FCA', 'ESMA', 'EBA'],
        regions: ['UK', 'EU'],
        firmSize: 'large',
        riskAppetite: 'medium',
        color: '#06B6D4',
        icon: 'trending-up'
      }
    ]
  }

  /**
   * Create a profile from a preset template
   */
  async createFromPreset(presetName, userId = 'default', overrides = {}) {
    const presets = this.getPresetTemplates()
    const preset = presets.find(p =>
      p.name.toLowerCase() === presetName.toLowerCase()
    )

    if (!preset) {
      throw new Error(`Preset '${presetName}' not found`)
    }

    const profileData = {
      ...preset,
      ...overrides
    }

    return await this.createProfile(userId, profileData)
  }
}

module.exports = new BusinessLineProfileService()
