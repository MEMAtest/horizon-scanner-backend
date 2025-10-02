// Enhanced Database Service - Phase 1
// File: src/services/dbService.js

const { Pool } = require('pg')
const fs = require('fs').promises
const path = require('path')

class EnhancedDBService {
  constructor() {
    this.pool = null
    this.fallbackMode = false
    this.usePostgres = false // Add this for compatibility
    this.jsonDataPath = path.join(__dirname, '../../data')
    this.updatesFile = path.join(this.jsonDataPath, 'updates.json')
    this.insightsFile = path.join(this.jsonDataPath, 'ai_insights.json')
    this.profilesFile = path.join(this.jsonDataPath, 'firm_profiles.json')
    this.workspaceFile = path.join(this.jsonDataPath, 'workspace.json')

    this.initializeDatabase()
  }

  // Normalize field names for consistent API responses
  normalizeUpdateFields(update) {
    return {
      ...update,
      impactLevel: update.impactLevel || update.impact_level,
      businessImpactScore: update.businessImpactScore || update.business_impact_score,
      aiSummary: update.ai_summary || update.aiSummary,
      contentType: update.content_type || update.contentType,
      aiTags: update.ai_tags || update.aiTags,
      impact_level: update.impactLevel || update.impact_level, // Ensure both exist
      business_impact_score: update.businessImpactScore || update.business_impact_score,
      ai_summary: update.ai_summary || update.aiSummary,
      content_type: update.content_type || update.contentType
    }
  }

  async initializeDatabase() {
    try {
      if (process.env.DATABASE_URL) {
        console.log('🔗 Connecting to PostgreSQL database...')
        this.pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        })

        // Test connection
        const client = await this.pool.connect()
        await client.query('SELECT NOW()')
        client.release()

        console.log('✅ PostgreSQL connected successfully')
        this.fallbackMode = false
        this.usePostgres = true // Set for compatibility

        // Ensure tables exist
        await this.ensureTablesExist()
      } else {
        throw new Error('DATABASE_URL not configured')
      }
    } catch (error) {
      console.warn('⚠️ PostgreSQL connection failed, using JSON fallback:', error.message)
      this.fallbackMode = true
      this.usePostgres = false
      await this.ensureJSONFiles()
    }
  }

  async ensureTablesExist() {
    try {
      const client = await this.pool.connect()

      // Check if AI columns exist in regulatory_updates
      const result = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'regulatory_updates' AND column_name = 'ai_summary'
            `)

      if (result.rows.length === 0) {
        console.log('🔧 Running database migration for AI intelligence fields...')
        await this.runMigrations(client)
      }

      client.release()
    } catch (error) {
      console.error('❌ Error ensuring tables exist:', error)
    }
  }

  async runMigrations(client) {
    try {
      // Add AI intelligence fields to regulatory_updates
      await client.query(`
                ALTER TABLE regulatory_updates
                ADD COLUMN IF NOT EXISTS ai_summary TEXT,
                ADD COLUMN IF NOT EXISTS content_type VARCHAR(20) DEFAULT 'OTHER',
                ADD COLUMN IF NOT EXISTS business_impact_score INTEGER DEFAULT 0,
                ADD COLUMN IF NOT EXISTS ai_tags JSONB DEFAULT '[]'::jsonb,
                ADD COLUMN IF NOT EXISTS cross_references JSONB DEFAULT '[]'::jsonb,
                ADD COLUMN IF NOT EXISTS firm_types_affected JSONB DEFAULT '[]'::jsonb,
                ADD COLUMN IF NOT EXISTS compliance_deadline DATE,
                ADD COLUMN IF NOT EXISTS ai_confidence_score DECIMAL(3,2) DEFAULT 0.0,
                ADD COLUMN IF NOT EXISTS sector_relevance_scores JSONB DEFAULT '{}'::jsonb,
                ADD COLUMN IF NOT EXISTS implementation_phases JSONB DEFAULT '[]'::jsonb,
                ADD COLUMN IF NOT EXISTS required_resources JSONB DEFAULT '{}'::jsonb
            `)

      // Create AI insights table
      await client.query(`
                CREATE TABLE IF NOT EXISTS ai_insights (
                    id SERIAL PRIMARY KEY,
                    update_id INTEGER REFERENCES regulatory_updates(id),
                    insight_type VARCHAR(50) NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    summary TEXT NOT NULL,
                    impact_score INTEGER CHECK (impact_score BETWEEN 1 AND 10),
                    urgency_level VARCHAR(20) CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')),
                    affected_firm_types JSONB DEFAULT '[]'::jsonb,
                    affected_firm_sizes JSONB DEFAULT '[]'::jsonb,
                    probability_score DECIMAL(3,2) DEFAULT 0.0,
                    evidence_sources JSONB DEFAULT '[]'::jsonb,
                    recommendations JSONB DEFAULT '[]'::jsonb,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP,
                    is_active BOOLEAN DEFAULT true
                )
            `)

      // Create firm profiles table
      await client.query(`
                CREATE TABLE IF NOT EXISTS firm_profiles (
                    id SERIAL PRIMARY KEY,
                    firm_name VARCHAR(255) NOT NULL,
                    firm_size VARCHAR(20) CHECK (firm_size IN ('small', 'medium', 'large')),
                    primary_sectors JSONB DEFAULT '[]'::jsonb,
                    regulatory_appetite VARCHAR(20) CHECK (regulatory_appetite IN ('conservative', 'moderate', 'aggressive')),
                    key_business_lines JSONB DEFAULT '[]'::jsonb,
                    geographic_focus JSONB DEFAULT '[]'::jsonb,
                    compliance_maturity VARCHAR(20) CHECK (compliance_maturity IN ('basic', 'developing', 'advanced')),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `)

      // Create early warning signals table
      await client.query(`
                CREATE TABLE IF NOT EXISTS early_warning_signals (
                    id SERIAL PRIMARY KEY,
                    signal_type VARCHAR(50) NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    description TEXT NOT NULL,
                    confidence_level VARCHAR(20) CHECK (confidence_level IN ('low', 'medium', 'high')),
                    potential_impact VARCHAR(20) CHECK (potential_impact IN ('low', 'medium', 'high', 'critical')),
                    estimated_timeline VARCHAR(100),
                    supporting_updates JSONB DEFAULT '[]'::jsonb,
                    affected_sectors JSONB DEFAULT '[]'::jsonb,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    is_active BOOLEAN DEFAULT true
                )
            `)

      // Create indices for performance
      await client.query(`
                CREATE INDEX IF NOT EXISTS idx_regulatory_updates_ai_tags ON regulatory_updates USING GIN (ai_tags);
                CREATE INDEX IF NOT EXISTS idx_regulatory_updates_firm_types ON regulatory_updates USING GIN (firm_types_affected);
                CREATE INDEX IF NOT EXISTS idx_regulatory_updates_business_impact ON regulatory_updates (business_impact_score DESC);
                CREATE INDEX IF NOT EXISTS idx_ai_insights_type_urgency ON ai_insights (insight_type, urgency_level);
                CREATE INDEX IF NOT EXISTS idx_ai_insights_active ON ai_insights (is_active) WHERE is_active = true;
                CREATE INDEX IF NOT EXISTS idx_early_warning_active ON early_warning_signals (is_active) WHERE is_active = true;
            `)

      console.log('✅ Database migration completed successfully')
    } catch (error) {
      console.error('❌ Migration failed:', error)
      throw error
    }
  }

  async ensureJSONFiles() {
    try {
      await fs.mkdir(this.jsonDataPath, { recursive: true })

      // Ensure updates file exists
      try {
        await fs.access(this.updatesFile)
      } catch {
        await fs.writeFile(this.updatesFile, JSON.stringify([], null, 2))
      }

      // Ensure insights file exists
      try {
        await fs.access(this.insightsFile)
      } catch {
        await fs.writeFile(this.insightsFile, JSON.stringify([], null, 2))
      }

      // Ensure profiles file exists
      try {
        await fs.access(this.profilesFile)
      } catch {
        const defaultProfile = {
          id: 1,
          firm_name: 'Demo Financial Services',
          firm_size: 'medium',
          primary_sectors: ['Banking', 'Investment Management'],
          regulatory_appetite: 'moderate',
          key_business_lines: ['Retail Banking', 'Wealth Management'],
          geographic_focus: ['UK', 'EU'],
          compliance_maturity: 'developing'
        }
        await fs.writeFile(this.profilesFile, JSON.stringify([defaultProfile], null, 2))
      }

      // Ensure workspace file exists
      try {
        await fs.access(this.workspaceFile)
      } catch {
        await fs.writeFile(this.workspaceFile, JSON.stringify({
          savedSearches: [],
          customAlerts: [],
          pinnedItems: [],
          firmProfile: null
        }, null, 2))
      }

      console.log('✅ JSON fallback files initialized')
    } catch (error) {
      console.error('❌ Error setting up JSON files:', error)
      throw error
    }
  }

  async checkUpdateExists(url) {
    try {
      if (this.fallbackMode) {
        const updates = await this.loadJSONData(this.updatesFile)
        return updates.some(u => u.url === url)
      } else {
        const client = await this.pool.connect()
        try {
          const result = await client.query(
            'SELECT EXISTS(SELECT 1 FROM regulatory_updates WHERE url = $1) as exists',
            [url]
          )
          return result.rows[0].exists
        } finally {
          client.release()
        }
      }
    } catch (error) {
      console.warn('⚠️ Error checking if update exists:', error.message)
      return false // Assume doesn't exist on error to allow saving
    }
  }

  // ENHANCED UPDATES METHODS
  async saveUpdate(updateData) {
    try {
      if (this.fallbackMode) {
        return await this.saveUpdateJSON(updateData)
      } else {
        return await this.saveUpdatePG(updateData)
      }
    } catch (error) {
      console.error('❌ Error saving update:', error)
      throw error
    }
  }

  async saveUpdatePG(updateData) {
    const client = await this.pool.connect()
    try {
      const query = `
                INSERT INTO regulatory_updates (
                    headline, summary, url, authority, published_date, 
                    impact_level, urgency, sector, area,
                    ai_summary, business_impact_score, ai_tags, 
                    firm_types_affected, compliance_deadline, ai_confidence_score,
                    sector_relevance_scores, implementation_phases, required_resources
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
                RETURNING id
            `

      const values = [
        updateData.headline,
        updateData.summary || updateData.impact,
        updateData.url,
        updateData.authority,
        updateData.publishedDate || updateData.fetchedDate || new Date(),
        updateData.impactLevel,
        updateData.urgency,
        updateData.sector,
        updateData.area,
        updateData.ai_summary || updateData.impact,
        updateData.businessImpactScore || updateData.business_impact_score || 0,
        JSON.stringify(updateData.aiTags || updateData.ai_tags || []),
        JSON.stringify(updateData.firmTypesAffected || updateData.firm_types_affected || []),
        updateData.complianceDeadline || updateData.compliance_deadline,
        updateData.aiConfidenceScore || updateData.ai_confidence_score || 0.0,
        JSON.stringify(updateData.sectorRelevanceScores || updateData.sector_relevance_scores || {}),
        JSON.stringify(updateData.implementationPhases || updateData.implementation_phases || []),
        JSON.stringify(updateData.requiredResources || updateData.required_resources || {})
      ]

      const result = await client.query(query, values)
      console.log(`✅ Update saved to PostgreSQL with ID: ${result.rows[0].id}`)
      return result.rows[0].id
    } finally {
      client.release()
    }
  }

  async saveUpdateJSON(updateData) {
    try {
      // Ensure we always get an array from loadJSONData
      let updates = await this.loadJSONData(this.updatesFile)

      // Critical fix: ensure updates is always an array
      if (!Array.isArray(updates)) {
        console.log('⚠️ Updates was not an array, initializing as empty array')
        updates = []
      }

      // Generate new ID
      const newId = updates.length > 0
        ? Math.max(...updates.map(u => u.id || 0)) + 1
        : 1

      const update = {
        id: newId,
        ...updateData,
        fetchedDate: updateData.fetchedDate || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        ai_summary: updateData.ai_summary || updateData.impact,
        business_impact_score: updateData.businessImpactScore || updateData.business_impact_score || 0,
        ai_tags: updateData.aiTags || updateData.ai_tags || [],
        firm_types_affected: updateData.firmTypesAffected || updateData.firm_types_affected || [],
        compliance_deadline: updateData.complianceDeadline || updateData.compliance_deadline,
        ai_confidence_score: updateData.aiConfidenceScore || updateData.ai_confidence_score || 0.0,
        sector_relevance_scores: updateData.sectorRelevanceScores || updateData.sector_relevance_scores || {},
        implementation_phases: updateData.implementationPhases || updateData.implementation_phases || [],
        required_resources: updateData.requiredResources || updateData.required_resources || {}
      }

      updates.push(update)
      await this.saveJSONData(this.updatesFile, updates)
      console.log(`✅ Update saved to JSON with ID: ${newId}`)
      return newId
    } catch (error) {
      console.error('❌ Error in saveUpdateJSON:', error)
      throw error
    }
  }

  async getEnhancedUpdates(filters = {}) {
    try {
      if (this.fallbackMode) {
        return await this.getEnhancedUpdatesJSON(filters)
      } else {
        return await this.getEnhancedUpdatesPG(filters)
      }
    } catch (error) {
      console.error('❌ Error getting enhanced updates:', error)
      return []
    }
  }

  async getEnhancedUpdatesPG(filters) {
    const client = await this.pool.connect()
    try {
      let query = `
                SELECT
                    id, headline, summary, url, authority,
                    published_date, created_at,
                    impact_level, urgency, sector, area,
                    ai_summary, content_type, business_impact_score, ai_tags,
                    firm_types_affected, compliance_deadline, ai_confidence_score,
                    sector_relevance_scores, implementation_phases, required_resources
                FROM regulatory_updates
                WHERE 1=1
            `

      const params = []
      let paramCount = 0

      // Apply filters
      if (filters.authority) {
        query += ` AND authority = $${++paramCount}`
        params.push(filters.authority)
      }

      if (filters.sector) {
        query += ` AND (sector = $${++paramCount} OR firm_types_affected @> $${++paramCount})`
        params.push(filters.sector, JSON.stringify([filters.sector]))
        paramCount++
      }

      if (filters.impact) {
        query += ` AND impact_level = $${++paramCount}`
        params.push(filters.impact)
      }

      if (filters.search) {
        query += ` AND (headline ILIKE $${++paramCount} OR summary ILIKE $${paramCount} OR ai_summary ILIKE $${paramCount})`
        const searchTerm = `%${filters.search}%`
        params.push(searchTerm)
      }

      // Date range filter
      if (filters.range) {
        const dateFilter = this.getDateRangeFilter(filters.range)
        if (dateFilter) {
          query += ` AND published_date >= $${++paramCount}`
          params.push(dateFilter)
        }
      }

      // Category-specific filters - FIXED VERSION
      if (filters.category && filters.category !== 'all') {
        const categoryFilter = this.getCategoryFilter(filters.category)
        if (categoryFilter.sql) {
          query += ` AND ${categoryFilter.sql}`
          // No need to add params or increment paramCount for most category filters
        }
      }

      query += ' ORDER BY published_date DESC'

      if (filters.limit) {
        query += ` LIMIT $${++paramCount}`
        params.push(filters.limit)
      }

      const result = await client.query(query, params)

      // Transform the data for client use
      return result.rows.map(row => this.normalizeUpdateFields({
        ...row,
        fetchedDate: row.published_date || row.created_at,
        publishedDate: row.published_date,
        createdAt: row.created_at,
        impactLevel: row.impact_level,
        ai_tags: row.ai_tags || [],
        primarySectors: row.firm_types_affected || [],
        sectorRelevanceScores: row.sector_relevance_scores || {},
        implementationPhases: row.implementation_phases || [],
        requiredResources: row.required_resources || {}
      }))
    } finally {
      client.release()
    }
  }

  async getEnhancedUpdatesJSON(filters) {
    const updates = await this.loadJSONData(this.updatesFile)
    let filtered = [...updates]

    // Apply filters
    if (filters.authority) {
      filtered = filtered.filter(u => u.authority === filters.authority)
    }

    if (filters.sector) {
      filtered = filtered.filter(u =>
        u.sector === filters.sector ||
                (u.firm_types_affected && u.firm_types_affected.includes(filters.sector)) ||
                (u.primarySectors && u.primarySectors.includes(filters.sector))
      )
    }

    if (filters.impact) {
      filtered = filtered.filter(u => u.impactLevel === filters.impact || u.impact_level === filters.impact)
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(u =>
        (u.headline && u.headline.toLowerCase().includes(searchTerm)) ||
                (u.summary && u.summary.toLowerCase().includes(searchTerm)) ||
                (u.ai_summary && u.ai_summary.toLowerCase().includes(searchTerm))
      )
    }

    // Date range filter
    if (filters.range) {
      const dateFilter = this.getDateRangeFilter(filters.range)
      if (dateFilter) {
        filtered = filtered.filter(u => {
          const updateDate = new Date(u.publishedDate || u.published_date || u.fetchedDate || u.createdAt)
          return updateDate >= dateFilter
        })
      }
    }

    // Category filter - FIXED VERSION
    if (filters.category && filters.category !== 'all') {
      filtered = this.applyCategoryFilterJSON(filtered, filters.category)
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.publishedDate || a.published_date || a.fetchedDate || a.createdAt)
      const dateB = new Date(b.publishedDate || b.published_date || b.fetchedDate || b.createdAt)
      return dateB - dateA
    })

    // Apply limit
    if (filters.limit) {
      filtered = filtered.slice(0, filters.limit)
    }

    return filtered
  }

  getDateRangeFilter(range) {
    const now = new Date()
    switch (range) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate())
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case 'month':
        return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
      case 'quarter':
        return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
      default:
        return null
    }
  }

  // FIXED VERSION - PostgreSQL category filters
  getCategoryFilter(category) {
    switch (category) {
      case 'high-impact':
        return { sql: "(impact_level = 'Significant' OR business_impact_score >= 7 OR urgency = 'High')" }
      case 'today':
        return { sql: 'DATE(published_date) = CURRENT_DATE' }
      case 'this-week':
        return { sql: "published_date >= CURRENT_DATE - INTERVAL '7 days'" }
      case 'consultations':
        return { sql: "(headline ILIKE '%consultation%' OR area ILIKE '%consultation%' OR ai_tags @> '[\"type:consultation\"]'::jsonb)" }
      case 'enforcement':
        return { sql: "(headline ILIKE '%enforcement%' OR headline ILIKE '%fine%' OR ai_tags @> '[\"type:enforcement\"]'::jsonb)" }
      case 'deadlines':
        return { sql: "(compliance_deadline IS NOT NULL OR headline ILIKE '%deadline%' OR ai_tags @> '[\"has:deadline\"]'::jsonb)" }
      default:
        return { sql: null }
    }
  }

  // FIXED VERSION - JSON category filters
  applyCategoryFilterJSON(updates, category) {
    const now = new Date()
    now.setHours(23, 59, 59, 999) // Include all of today
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    todayStart.setHours(0, 0, 0, 0) // Start of today
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    switch (category) {
      case 'high-impact':
        return updates.filter(u =>
          u.impactLevel === 'Significant' ||
                    u.impact_level === 'Significant' ||
                    (u.business_impact_score || 0) >= 7 ||
                    (u.businessImpactScore || 0) >= 7 ||
                    u.urgency === 'High'
        )

      case 'today':
        return updates.filter(u => {
          const updateDate = new Date(u.publishedDate || u.published_date || u.fetchedDate || u.createdAt)
          return updateDate >= todayStart && updateDate <= now
        })

      case 'this-week':
        return updates.filter(u => {
          const updateDate = new Date(u.publishedDate || u.published_date || u.fetchedDate || u.createdAt)
          return updateDate >= weekAgo
        })

      case 'consultations':
        return updates.filter(u =>
          (u.headline && u.headline.toLowerCase().includes('consultation')) ||
                    (u.area && u.area.toLowerCase().includes('consultation')) ||
                    (u.ai_tags && Array.isArray(u.ai_tags) && u.ai_tags.includes('type:consultation'))
        )

      case 'enforcement':
        return updates.filter(u =>
          (u.headline && (u.headline.toLowerCase().includes('enforcement') || u.headline.toLowerCase().includes('fine'))) ||
                    (u.ai_tags && Array.isArray(u.ai_tags) && u.ai_tags.includes('type:enforcement'))
        )

      case 'deadlines':
        return updates.filter(u =>
          u.compliance_deadline ||
                    u.complianceDeadline ||
                    (u.headline && u.headline.toLowerCase().includes('deadline')) ||
                    (u.ai_tags && Array.isArray(u.ai_tags) && u.ai_tags.includes('has:deadline'))
        )

      default:
        return updates
    }
  }

  // AI INSIGHTS METHODS
  async saveAIInsight(insightData) {
    try {
      if (this.fallbackMode) {
        return await this.saveAIInsightJSON(insightData)
      } else {
        return await this.saveAIInsightPG(insightData)
      }
    } catch (error) {
      console.error('❌ Error saving AI insight:', error)
      throw error
    }
  }

  async saveAIInsightPG(insightData) {
    const client = await this.pool.connect()
    try {
      const query = `
                INSERT INTO ai_insights (
                    update_id, insight_type, title, summary, impact_score,
                    urgency_level, affected_firm_types, affected_firm_sizes,
                    probability_score, evidence_sources, recommendations
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING id
            `

      const values = [
        insightData.update_id,
        insightData.insight_type,
        insightData.title,
        insightData.summary,
        insightData.impact_score,
        insightData.urgency_level,
        JSON.stringify(insightData.affected_firm_types || []),
        JSON.stringify(insightData.affected_firm_sizes || []),
        insightData.probability_score,
        JSON.stringify(insightData.evidence_sources || []),
        JSON.stringify(insightData.recommendations || [])
      ]

      const result = await client.query(query, values)
      return result.rows[0].id
    } finally {
      client.release()
    }
  }

  async saveAIInsightJSON(insightData) {
    const insights = await this.loadJSONData(this.insightsFile)
    const newId = Math.max(0, ...insights.map(i => i.id || 0)) + 1

    const insight = {
      id: newId,
      ...insightData,
      created_at: new Date().toISOString(),
      is_active: true
    }

    insights.push(insight)
    await this.saveJSONData(this.insightsFile, insights)
    return newId
  }

  async getRecentAIInsights(limit = 10) {
    try {
      if (this.fallbackMode) {
        const insights = await this.loadJSONData(this.insightsFile)
        return insights
          .filter(i => i.is_active !== false)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, limit)
      } else {
        const client = await this.pool.connect()
        try {
          const result = await client.query(`
                        SELECT * FROM ai_insights 
                        WHERE is_active = true 
                        ORDER BY created_at DESC 
                        LIMIT $1
                    `, [limit])
          return result.rows
        } finally {
          client.release()
        }
      }
    } catch (error) {
      console.error('❌ Error getting AI insights:', error)
      return []
    }
  }

  // ALIAS METHOD FOR COMPATIBILITY
  async storeAIInsight(insightData) {
    // Alias for saveAIInsight to maintain compatibility
    return await this.saveAIInsight(insightData)
  }

  // UPDATE REGULATORY UPDATE WITH AI ANALYSIS
  async updateRegulatoryUpdate(url, aiAnalysisData) {
    console.log(`🔄 Updating regulatory update with AI analysis: ${url}`)

    try {
      if (this.fallbackMode) {
        return await this.updateRegulatoryUpdateJSON(url, aiAnalysisData)
      } else {
        return await this.updateRegulatoryUpdatePG(url, aiAnalysisData)
      }
    } catch (error) {
      console.error('❌ Error updating regulatory update with AI data:', error)
      throw error
    }
  }

  async updateRegulatoryUpdatePG(url, aiAnalysisData) {
    const client = await this.pool.connect()
    try {
      const query = `
                UPDATE regulatory_updates
                SET
                    ai_summary = $2,
                    content_type = $3,
                    impact_level = $4,
                    urgency = $5,
                    sector = $6,
                    area = $7,
                    business_impact_score = $8,
                    ai_tags = $9,
                    firm_types_affected = $10,
                    compliance_deadline = $11,
                    ai_confidence_score = $12,
                    sector_relevance_scores = $13,
                    implementation_phases = $14,
                    required_resources = $15,
                    updated_at = NOW()
                WHERE url = $1
                RETURNING id
            `

      const values = [
        url,
        aiAnalysisData.ai_summary || aiAnalysisData.analysis,
        aiAnalysisData.content_type || 'OTHER',
        aiAnalysisData.impactLevel,
        aiAnalysisData.urgency,
        aiAnalysisData.sector,
        aiAnalysisData.area || 'General Regulation',
        aiAnalysisData.businessImpactScore,
        JSON.stringify(aiAnalysisData.ai_tags || []),
        JSON.stringify(aiAnalysisData.firmTypesAffected || aiAnalysisData.firm_types_affected || []),
        aiAnalysisData.complianceDeadline || aiAnalysisData.compliance_deadline,
        aiAnalysisData.confidence || aiAnalysisData.ai_confidence_score || 0.75,
        JSON.stringify(aiAnalysisData.sectorRelevanceScores || {}),
        JSON.stringify(aiAnalysisData.implementationPhases || aiAnalysisData.implementation_phases || []),
        JSON.stringify(aiAnalysisData.requiredResources || aiAnalysisData.required_resources || {})
      ]

      const result = await client.query(query, values)

      if (result.rows.length > 0) {
        console.log(`✅ Updated regulatory update ${url} with AI analysis`)
        return { success: true, id: result.rows[0].id }
      } else {
        console.warn(`⚠️ No regulatory update found with URL: ${url}`)
        return { success: false, error: 'Update not found' }
      }
    } finally {
      client.release()
    }
  }

  async updateRegulatoryUpdateJSON(url, aiAnalysisData) {
    try {
      let updates = await this.loadJSONData(this.updatesFile)

      if (!Array.isArray(updates)) {
        updates = []
      }

      const updateIndex = updates.findIndex(u => u.url === url)

      if (updateIndex !== -1) {
        // Update the existing update with AI analysis
        updates[updateIndex] = {
          ...updates[updateIndex],
          ai_summary: aiAnalysisData.ai_summary || aiAnalysisData.analysis,
          impactLevel: aiAnalysisData.impactLevel,
          impact_level: aiAnalysisData.impactLevel,
          urgency: aiAnalysisData.urgency,
          sector: aiAnalysisData.sector,
          area: aiAnalysisData.area || 'General Regulation',
          businessImpactScore: aiAnalysisData.businessImpactScore,
          business_impact_score: aiAnalysisData.businessImpactScore,
          ai_tags: aiAnalysisData.ai_tags || [],
          aiTags: aiAnalysisData.aiTags || aiAnalysisData.ai_tags || [],
          primarySectors: aiAnalysisData.primarySectors || [],
          primary_sectors: aiAnalysisData.primary_sectors || aiAnalysisData.primarySectors || [],
          firmTypesAffected: aiAnalysisData.firmTypesAffected || aiAnalysisData.firm_types_affected || [],
          firm_types_affected: aiAnalysisData.firmTypesAffected || aiAnalysisData.firm_types_affected || [],
          complianceDeadline: aiAnalysisData.complianceDeadline || aiAnalysisData.compliance_deadline,
          compliance_deadline: aiAnalysisData.complianceDeadline || aiAnalysisData.compliance_deadline,
          ai_confidence_score: aiAnalysisData.confidence || aiAnalysisData.ai_confidence_score || 0.75,
          sectorRelevanceScores: aiAnalysisData.sectorRelevanceScores || {},
          sector_relevance_scores: aiAnalysisData.sector_relevance_scores || aiAnalysisData.sectorRelevanceScores || {},
          implementationPhases: aiAnalysisData.implementationPhases || aiAnalysisData.implementation_phases || [],
          implementation_phases: aiAnalysisData.implementation_phases || aiAnalysisData.implementationPhases || [],
          requiredResources: aiAnalysisData.requiredResources || aiAnalysisData.required_resources || {},
          required_resources: aiAnalysisData.required_resources || aiAnalysisData.requiredResources || {},
          aiModelUsed: aiAnalysisData.aiModelUsed || updates[updateIndex].aiModelUsed,
          enhancedAt: aiAnalysisData.enhancedAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        await this.saveJSONData(this.updatesFile, updates)
        console.log(`✅ Updated regulatory update ${url} with AI analysis (JSON)`)
        return { success: true, id: updates[updateIndex].id }
      } else {
        console.warn(`⚠️ No regulatory update found with URL: ${url}`)
        return { success: false, error: 'Update not found' }
      }
    } catch (error) {
      console.error('❌ Error updating regulatory update in JSON:', error)
      throw error
    }
  }

  // STATISTICS AND ANALYTICS METHODS
  async getSystemStatistics() {
    try {
      if (this.fallbackMode) {
        return await this.getSystemStatisticsJSON()
      } else {
        return await this.getSystemStatisticsPG()
      }
    } catch (error) {
      console.error('❌ Error getting system statistics:', error)
      return { totalUpdates: 0, activeAuthorities: 0, aiAnalyzed: 0, highImpact: 0 }
    }
  }

  async getSystemStatisticsPG() {
    const client = await this.pool.connect()
    try {
      const result = await client.query(`
                SELECT 
                    COUNT(*) as total_updates,
                    COUNT(DISTINCT authority) as active_authorities,
                    COUNT(*) FILTER (WHERE ai_summary IS NOT NULL) as ai_analyzed,
                    COUNT(*) FILTER (WHERE impact_level = 'Significant' OR business_impact_score >= 7) as high_impact
                FROM regulatory_updates
            `)

      const stats = result.rows[0]
      return {
        totalUpdates: parseInt(stats.total_updates),
        activeAuthorities: parseInt(stats.active_authorities),
        aiAnalyzed: parseInt(stats.ai_analyzed),
        highImpact: parseInt(stats.high_impact)
      }
    } finally {
      client.release()
    }
  }

  async getSystemStatisticsJSON() {
    const updates = await this.loadJSONData(this.updatesFile)

    const totalUpdates = updates.length
    const activeAuthorities = new Set(updates.map(u => u.authority)).size
    const aiAnalyzed = updates.filter(u => u.ai_summary || u.businessImpactScore || u.business_impact_score).length
    const highImpact = updates.filter(u =>
      u.impactLevel === 'Significant' ||
            u.impact_level === 'Significant' ||
            (u.business_impact_score || u.businessImpactScore || 0) >= 7
    ).length

    return { totalUpdates, activeAuthorities, aiAnalyzed, highImpact }
  }

  async getDashboardStatistics() {
    try {
      if (this.fallbackMode) {
        return await this.getDashboardStatisticsJSON()
      } else {
        return await this.getDashboardStatisticsPG()
      }
    } catch (error) {
      console.error('❌ Error getting dashboard statistics:', error)
      return {
        totalUpdates: 0,
        highImpact: 0,
        aiAnalyzed: 0,
        activeAuthorities: 0,
        newToday: 0,
        newAuthorities: 0,
        impactTrend: 'stable',
        impactChange: 0
      }
    }
  }

  async getDashboardStatisticsPG() {
    const client = await this.pool.connect()
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const result = await client.query(`
                SELECT 
                    COUNT(*) as total_updates,
                    COUNT(*) FILTER (WHERE impact_level = 'Significant' OR business_impact_score >= 7) as high_impact,
                    COUNT(*) FILTER (WHERE ai_summary IS NOT NULL) as ai_analyzed,
                    COUNT(DISTINCT authority) as active_authorities,
                    COUNT(*) FILTER (WHERE published_date >= $1) as new_today
                FROM regulatory_updates
            `, [today])

      const stats = result.rows[0]

      return {
        totalUpdates: parseInt(stats.total_updates),
        highImpact: parseInt(stats.high_impact),
        aiAnalyzed: parseInt(stats.ai_analyzed),
        activeAuthorities: parseInt(stats.active_authorities),
        newToday: parseInt(stats.new_today),
        newAuthorities: 0, // TODO: Calculate new authorities this week
        impactTrend: 'stable', // TODO: Calculate trend
        impactChange: 0 // TODO: Calculate change percentage
      }
    } finally {
      client.release()
    }
  }

  async getDashboardStatisticsJSON() {
    const updates = await this.loadJSONData(this.updatesFile)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const totalUpdates = updates.length
    const highImpact = updates.filter(u =>
      u.impactLevel === 'Significant' ||
            u.impact_level === 'Significant' ||
            (u.business_impact_score || u.businessImpactScore || 0) >= 7
    ).length
    const aiAnalyzed = updates.filter(u => u.ai_summary || u.businessImpactScore || u.business_impact_score).length
    const activeAuthorities = new Set(updates.map(u => u.authority)).size
    const newToday = updates.filter(u => {
      const updateDate = new Date(u.publishedDate || u.published_date || u.fetchedDate || u.createdAt)
      return updateDate >= today
    }).length

    return {
      totalUpdates,
      highImpact,
      aiAnalyzed,
      activeAuthorities,
      newToday,
      newAuthorities: 0,
      impactTrend: 'stable',
      impactChange: 0
    }
  }

  async getUpdateCounts() {
    try {
      if (this.fallbackMode) {
        return await this.getUpdateCountsJSON()
      } else {
        return await this.getUpdateCountsPG()
      }
    } catch (error) {
      console.error('❌ Error getting update counts:', error)
      return { total: 0, highImpact: 0, today: 0, thisWeek: 0, authorities: {}, sectors: {} }
    }
  }

  async getUpdateCountsPG() {
    const client = await this.pool.connect()
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

      // Get basic counts
      const countsResult = await client.query(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE impact_level = 'Significant' OR business_impact_score >= 7) as high_impact,
                    COUNT(*) FILTER (WHERE published_date >= $1) as today,
                    COUNT(*) FILTER (WHERE published_date >= $2) as this_week
                FROM regulatory_updates
            `, [today, weekAgo])

      // Get authority counts
      const authoritiesResult = await client.query(`
                SELECT authority, COUNT(*) as count
                FROM regulatory_updates
                WHERE published_date >= $1
                GROUP BY authority
                ORDER BY count DESC
            `, [weekAgo])

      const authorities = {}
      authoritiesResult.rows.forEach(row => {
        authorities[row.authority] = parseInt(row.count)
      })

      const counts = countsResult.rows[0]
      return {
        total: parseInt(counts.total),
        highImpact: parseInt(counts.high_impact),
        today: parseInt(counts.today),
        thisWeek: parseInt(counts.this_week),
        unread: 0, // TODO: Implement user-specific unread tracking
        authorities,
        sectors: {}, // TODO: Implement sector counting
        activeSources: 12, // TODO: Get from RSS fetcher
        dbStatus: 'online'
      }
    } finally {
      client.release()
    }
  }

  async getUpdateCountsJSON() {
    const updates = await this.loadJSONData(this.updatesFile)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    const total = updates.length
    const highImpact = updates.filter(u =>
      u.impactLevel === 'Significant' ||
            u.impact_level === 'Significant' ||
            (u.business_impact_score || u.businessImpactScore || 0) >= 7
    ).length

    const todayUpdates = updates.filter(u => {
      const updateDate = new Date(u.publishedDate || u.published_date || u.fetchedDate || u.createdAt)
      return updateDate >= today
    }).length

    const weekUpdates = updates.filter(u => {
      const updateDate = new Date(u.publishedDate || u.published_date || u.fetchedDate || u.createdAt)
      return updateDate >= weekAgo
    }).length

    const authorities = {}
    updates.forEach(u => {
      if (u.authority) {
        authorities[u.authority] = (authorities[u.authority] || 0) + 1
      }
    })

    return {
      total,
      highImpact,
      today: todayUpdates,
      thisWeek: weekUpdates,
      unread: 0,
      authorities,
      sectors: {},
      activeSources: 8,
      dbStatus: 'json-mode'
    }
  }

  async getFilterOptions() {
    try {
      if (this.fallbackMode) {
        return await this.getFilterOptionsJSON()
      } else {
        return await this.getFilterOptionsPG()
      }
    } catch (error) {
      console.error('❌ Error getting filter options:', error)
      return { authorities: [], sectors: [] }
    }
  }

  async getFilterOptionsPG() {
    const client = await this.pool.connect()
    try {
      const authoritiesResult = await client.query(`
                SELECT authority as name, COUNT(*) as count
                FROM regulatory_updates
                GROUP BY authority
                ORDER BY count DESC
            `)

      // TODO: Implement sector extraction from firm_types_affected JSONB
      const sectorsResult = await client.query(`
                SELECT DISTINCT sector as name, COUNT(*) as count
                FROM regulatory_updates
                WHERE sector IS NOT NULL
                GROUP BY sector
                ORDER BY count DESC
            `)

      return {
        authorities: authoritiesResult.rows,
        sectors: sectorsResult.rows
      }
    } finally {
      client.release()
    }
  }

  async getFilterOptionsJSON() {
    const updates = await this.loadJSONData(this.updatesFile)

    const authorityCounts = {}
    const sectorCounts = {}

    updates.forEach(u => {
      if (u.authority) {
        authorityCounts[u.authority] = (authorityCounts[u.authority] || 0) + 1
      }

      if (u.sector) {
        sectorCounts[u.sector] = (sectorCounts[u.sector] || 0) + 1
      }

      // Count sectors from firm_types_affected
      if (u.firm_types_affected) {
        u.firm_types_affected.forEach(sector => {
          sectorCounts[sector] = (sectorCounts[sector] || 0) + 1
        })
      }

      // Count sectors from primarySectors
      if (u.primarySectors) {
        u.primarySectors.forEach(sector => {
          sectorCounts[sector] = (sectorCounts[sector] || 0) + 1
        })
      }
    })

    const authorities = Object.entries(authorityCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    const sectors = Object.entries(sectorCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    return { authorities, sectors }
  }

  // LEGACY COMPATIBILITY METHODS
  async getRecentUpdates(limit = 10, offset = 0) {
    return await this.getEnhancedUpdates({ limit, offset })
  }

  async getAllUpdates() {
    return await this.getEnhancedUpdates({})
  }

  async getUpdateByUrl(url) {
    try {
      const updates = await this.getEnhancedUpdates({})
      return updates.find(u => u.url === url) || null
    } catch (error) {
      console.error('Error getting update by URL:', error)
      return null
    }
  }

  async getUpdateById(id) {
    try {
      const updates = await this.getEnhancedUpdates({})
      return updates.find(u => u.id === parseInt(id) || u.id === id) || null
    } catch (error) {
      console.error('Error getting update by ID:', error)
      return null
    }
  }

  async getUpdatesByAuthority(authority) {
    return await this.getEnhancedUpdates({ authority })
  }

  // JSON FILE UTILITIES
  async loadJSONData(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf-8')
      const parsed = JSON.parse(data)

      // Always return an array
      if (!Array.isArray(parsed)) {
        console.log(`⚠️ JSON file ${filePath} didn't contain an array, returning empty array`)
        return []
      }

      return parsed
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, return empty array
        console.log(`📝 Creating new JSON file: ${filePath}`)
        return []
      } else {
        console.error(`❌ Error loading JSON data from ${filePath}:`, error)
        // Return empty array as fallback
        return []
      }
    }
  }

  async saveJSONData(filePath, data) {
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2))
    } catch (error) {
      console.error(`❌ Error saving JSON to ${filePath}:`, error)
      throw error
    }
  }

  // Initialize method for compatibility
  async initialize() {
    return true
  }

  // ==========================================
  // SAVED SEARCHES METHODS
  // ==========================================

  async getSavedSearches() {
    await this.initialize()

    if (this.usePostgres) {
      const client = await this.pool.connect()
      try {
        const result = await client.query(`
                    SELECT id, search_name as "searchName", filter_params as "filterParams", 
                           created_date as "createdDate"
                    FROM saved_searches 
                    ORDER BY created_date DESC
                `)
        return result.rows
      } catch (error) {
        console.log('📊 Using JSON fallback for saved searches')
        return this.getSavedSearchesJSON()
      } finally {
        client.release()
      }
    } else {
      return this.getSavedSearchesJSON()
    }
  }

  async getSavedSearchesJSON() {
    try {
      const data = await fs.readFile(this.workspaceFile, 'utf8')
      const workspace = JSON.parse(data)
      return workspace.savedSearches || []
    } catch (error) {
      return []
    }
  }

  async getSavedSearch(searchId) {
    await this.initialize()

    if (this.usePostgres) {
      const client = await this.pool.connect()
      try {
        const result = await client.query(`
                    SELECT id, search_name as "searchName", filter_params as "filterParams", 
                           created_date as "createdDate"
                    FROM saved_searches WHERE id = $1
                `, [searchId])
        return result.rows[0] || null
      } catch (error) {
        console.log('📊 Using JSON fallback for saved search')
        return this.getSavedSearchJSON(searchId)
      } finally {
        client.release()
      }
    } else {
      return this.getSavedSearchJSON(searchId)
    }
  }

  async getSavedSearchJSON(searchId) {
    try {
      const data = await fs.readFile(this.workspaceFile, 'utf8')
      const workspace = JSON.parse(data)
      return (workspace.savedSearches || []).find(search => String(search.id) === String(searchId)) || null
    } catch (error) {
      return null
    }
  }

  // Add after getSavedSearches() method (around line 1580)
  async saveSearch(searchName, filterParams) {
    await this.initializeDatabase()

    const search = {
      id: Date.now(),
      search_name: searchName,
      filter_params: filterParams,
      created_date: new Date().toISOString()
    }

    if (!this.fallbackMode) {
      const client = await this.pool.connect()
      try {
        const result = await client.query(`
                    INSERT INTO saved_searches (search_name, filter_params, created_date)
                    VALUES ($1, $2, $3) RETURNING id
                `, [searchName, JSON.stringify(filterParams), search.created_date])
        search.id = result.rows[0].id
        return search
      } finally {
        client.release()
      }
    } else {
      const data = await fs.readFile(this.workspaceFile, 'utf8').catch(() => '{}')
      const workspace = JSON.parse(data)
      workspace.savedSearches = workspace.savedSearches || []
      workspace.savedSearches.push(search)
      await fs.writeFile(this.workspaceFile, JSON.stringify(workspace, null, 2))
      return search
    }
  }

  // In src/services/dbService.js, search for one of these patterns:
  // - "saveUpdate"
  // - "async save"
  // - "async get"
  // Then add deleteUpdate near those methods

  async deleteUpdate(id) {
    if (this.fallbackMode) {
      // JSON mode - use the actual methods from your dbService
      const updates = await this.loadJSONData(this.updatesFile)
      const index = updates.findIndex(u => u.id === id)
      if (index !== -1) {
        updates.splice(index, 1)
        await this.saveJSONData(this.updatesFile, updates)
        console.log(`✅ Deleted update with ID ${id} from JSON`)
        return true
      }
      return false
    } else {
      // PostgreSQL mode
      const client = await this.pool.connect()
      try {
        const query = 'DELETE FROM regulatory_updates WHERE id = $1'
        await client.query(query, [id])
        console.log(`✅ Deleted update with ID ${id} from PostgreSQL`)
        return true
      } finally {
        client.release()
      }
    }
  }

  async deleteSavedSearch(searchId) {
    await this.initialize()

    if (this.usePostgres) {
      const client = await this.pool.connect()
      try {
        const result = await client.query('DELETE FROM saved_searches WHERE id = $1', [searchId])
        console.log(`🗑️ Deleted saved search: ${searchId}`)
        return result.rowCount > 0
      } catch (error) {
        console.log('📊 Using JSON fallback for delete saved search')
        return this.deleteSavedSearchJSON(searchId)
      } finally {
        client.release()
      }
    } else {
      return this.deleteSavedSearchJSON(searchId)
    }
  }

  async deleteSavedSearchJSON(searchId) {
    try {
      const data = await fs.readFile(this.workspaceFile, 'utf8')
      const workspace = JSON.parse(data)

      const initialLength = (workspace.savedSearches || []).length
      workspace.savedSearches = (workspace.savedSearches || []).filter(search => String(search.id) !== String(searchId))

      await fs.writeFile(this.workspaceFile, JSON.stringify(workspace, null, 2))
      return workspace.savedSearches.length < initialLength
    } catch (error) {
      return false
    }
  }

  // ==========================================
  // CUSTOM ALERTS METHODS
  // ==========================================

  async createCustomAlert(alertName, alertConditions) {
    await this.initialize()

    const customAlert = {
      id: Date.now(),
      alertName,
      alertConditions,
      isActive: true,
      createdDate: new Date().toISOString()
    }

    if (this.usePostgres) {
      const client = await this.pool.connect()
      try {
        const result = await client.query(`
                    INSERT INTO custom_alerts (alert_name, alert_conditions, is_active, created_date)
                    VALUES ($1, $2, $3, $4) RETURNING id
                `, [alertName, JSON.stringify(alertConditions), true, customAlert.createdDate])
        customAlert.id = result.rows[0].id
        console.log(`🚨 Created custom alert: ${alertName}`)
        return customAlert
      } catch (error) {
        console.log('📊 Using JSON fallback for custom alert')
        return this.createCustomAlertJSON(customAlert)
      } finally {
        client.release()
      }
    } else {
      return this.createCustomAlertJSON(customAlert)
    }
  }

  async createCustomAlertJSON(customAlert) {
    try {
      const data = await fs.readFile(this.workspaceFile, 'utf8').catch(() => '{"customAlerts":[]}')
      const workspace = JSON.parse(data)
      workspace.customAlerts = workspace.customAlerts || []
      workspace.customAlerts.push(customAlert)
      await fs.writeFile(this.workspaceFile, JSON.stringify(workspace, null, 2))
      console.log(`🚨 Created custom alert in JSON: ${customAlert.alertName}`)
      return customAlert
    } catch (error) {
      throw new Error(`Failed to create custom alert: ${error.message}`)
    }
  }

  async getCustomAlerts() {
    await this.initialize()

    if (this.usePostgres) {
      const client = await this.pool.connect()
      try {
        const result = await client.query(`
                    SELECT id, alert_name as "alertName", alert_conditions as "alertConditions", 
                           is_active as "isActive", created_date as "createdDate"
                    FROM custom_alerts 
                    ORDER BY created_date DESC
                `)
        return result.rows
      } catch (error) {
        console.log('📊 Using JSON fallback for custom alerts')
        return this.getCustomAlertsJSON()
      } finally {
        client.release()
      }
    } else {
      return this.getCustomAlertsJSON()
    }
  }

  async getCustomAlertsJSON() {
    try {
      const data = await fs.readFile(this.workspaceFile, 'utf8')
      const workspace = JSON.parse(data)
      return workspace.customAlerts || []
    } catch (error) {
      return []
    }
  }

  async updateAlertStatus(alertId, isActive) {
    await this.initialize()

    if (this.usePostgres) {
      const client = await this.pool.connect()
      try {
        const result = await client.query(
          'UPDATE custom_alerts SET is_active = $1 WHERE id = $2',
          [isActive, alertId]
        )
        console.log(`🚨 Updated alert status: ${alertId} -> ${isActive}`)
        return result.rowCount > 0
      } catch (error) {
        console.log('📊 Using JSON fallback for alert status update')
        return this.updateAlertStatusJSON(alertId, isActive)
      } finally {
        client.release()
      }
    } else {
      return this.updateAlertStatusJSON(alertId, isActive)
    }
  }

  async updateAlertStatusJSON(alertId, isActive) {
    try {
      const data = await fs.readFile(this.workspaceFile, 'utf8')
      const workspace = JSON.parse(data)

      const alert = (workspace.customAlerts || []).find(alert => String(alert.id) === String(alertId))
      if (alert) {
        alert.isActive = isActive
        await fs.writeFile(this.workspaceFile, JSON.stringify(workspace, null, 2))
        return true
      }
      return false
    } catch (error) {
      return false
    }
  }

  async deleteCustomAlert(alertId) {
    await this.initialize()

    if (this.usePostgres) {
      const client = await this.pool.connect()
      try {
        const result = await client.query('DELETE FROM custom_alerts WHERE id = $1', [alertId])
        console.log(`🗑️ Deleted custom alert: ${alertId}`)
        return result.rowCount > 0
      } catch (error) {
        console.log('📊 Using JSON fallback for delete custom alert')
        return this.deleteCustomAlertJSON(alertId)
      } finally {
        client.release()
      }
    } else {
      return this.deleteCustomAlertJSON(alertId)
    }
  }

  async deleteCustomAlertJSON(alertId) {
    try {
      const data = await fs.readFile(this.workspaceFile, 'utf8')
      const workspace = JSON.parse(data)

      const initialLength = (workspace.customAlerts || []).length
      workspace.customAlerts = (workspace.customAlerts || []).filter(alert => String(alert.id) !== String(alertId))

      await fs.writeFile(this.workspaceFile, JSON.stringify(workspace, null, 2))
      return workspace.customAlerts.length < initialLength
    } catch (error) {
      return false
    }
  }

  // ==========================================
  // PINNED ITEMS METHODS
  // ==========================================

  async getPinnedItems() {
    await this.initialize()

    if (this.usePostgres) {
      const client = await this.pool.connect()
      try {
        const result = await client.query(`
                    SELECT * FROM pinned_items 
                    ORDER BY pinned_date DESC
                `)
        return result.rows
      } catch (error) {
        console.log('📊 Using JSON fallback for pinned items')
        return this.getPinnedItemsJSON()
      } finally {
        client.release()
      }
    } else {
      return this.getPinnedItemsJSON()
    }
  }

  async getPinnedItemsJSON() {
    try {
      const data = await fs.readFile(this.workspaceFile, 'utf8')
      const workspace = JSON.parse(data)
      return workspace.pinnedItems || []
    } catch (error) {
      return []
    }
  }

  // Add this after getPinnedItems() method (around line 1680)
  async addPinnedItem(url, title, notes = '', authority = '') {
    await this.initializeDatabase() // FIX: Not this.initialize()

    const pinnedItem = {
      id: Date.now(),
      update_url: url,
      update_title: title,
      update_authority: authority,
      notes,
      pinned_date: new Date().toISOString()
    }

    if (!this.fallbackMode) { // FIX: Not this.usePostgres
      const client = await this.pool.connect()
      try {
        const result = await client.query(`
                    INSERT INTO pinned_items (update_url, update_title, notes, pinned_date)
                    VALUES ($1, $2, $3, $4) RETURNING id
                `, [url, title, notes, pinnedItem.pinned_date])
        pinnedItem.id = result.rows[0].id
        return pinnedItem
      } finally {
        client.release()
      }
    } else {
      // JSON fallback
      const data = await fs.readFile(this.workspaceFile, 'utf8').catch(() => '{}')
      const workspace = JSON.parse(data)
      workspace.pinnedItems = workspace.pinnedItems || []
      workspace.pinnedItems.push(pinnedItem)
      await fs.writeFile(this.workspaceFile, JSON.stringify(workspace, null, 2))
      return pinnedItem
    }
  }

  async removePinnedItem(url) {
    await this.initializeDatabase() // FIX: Not this.initialize()

    if (!this.fallbackMode) {
      const client = await this.pool.connect()
      try {
        const result = await client.query(
          'DELETE FROM pinned_items WHERE update_url = $1',
          [url]
        )
        return result.rowCount > 0
      } finally {
        client.release()
      }
    } else {
      // JSON fallback
      const data = await fs.readFile(this.workspaceFile, 'utf8').catch(() => '{}')
      const workspace = JSON.parse(data)
      const initialLength = (workspace.pinnedItems || []).length
      workspace.pinnedItems = (workspace.pinnedItems || []).filter(
        item => item.update_url !== url
      )
      await fs.writeFile(this.workspaceFile, JSON.stringify(workspace, null, 2))
      return workspace.pinnedItems.length < initialLength
    }
  }

  async updatePinnedItemNotes(updateUrl, notes) {
    await this.initialize()

    if (this.usePostgres) {
      const client = await this.pool.connect()
      try {
        const result = await client.query(
          'UPDATE pinned_items SET notes = $1 WHERE update_url = $2',
          [notes, updateUrl]
        )
        console.log(`📝 Updated pinned item notes: ${updateUrl}`)
        return result.rowCount > 0
      } catch (error) {
        console.log('📊 Using JSON fallback for pinned item notes update')
        return this.updatePinnedItemNotesJSON(updateUrl, notes)
      } finally {
        client.release()
      }
    } else {
      return this.updatePinnedItemNotesJSON(updateUrl, notes)
    }
  }

  async updatePinnedItemNotesJSON(updateUrl, notes) {
    try {
      const data = await fs.readFile(this.workspaceFile, 'utf8')
      const workspace = JSON.parse(data)

      const pinnedItem = (workspace.pinnedItems || []).find(item => item.updateUrl === updateUrl)
      if (pinnedItem) {
        pinnedItem.notes = notes
        pinnedItem.updatedDate = new Date().toISOString()
        await fs.writeFile(this.workspaceFile, JSON.stringify(workspace, null, 2))
        return true
      }
      return false
    } catch (error) {
      return false
    }
  }

  // ==========================================
  // FIRM PROFILE METHODS
  // ==========================================

  async getFirmProfile() {
    await this.initialize()

    if (this.usePostgres) {
      const client = await this.pool.connect()
      try {
        const result = await client.query(`
                    SELECT * FROM firm_profiles 
                    ORDER BY id DESC 
                    LIMIT 1
                `)
        return result.rows[0] || null
      } catch (error) {
        console.log('📊 Using JSON fallback for firm profile')
        return this.getFirmProfileJSON()
      } finally {
        client.release()
      }
    } else {
      return this.getFirmProfileJSON()
    }
  }

  async getFirmProfileJSON() {
    try {
      const data = await fs.readFile(this.workspaceFile, 'utf8')
      const workspace = JSON.parse(data)
      return workspace.firmProfile || null
    } catch (error) {
      return null
    }
  }

  async clearFirmProfile() {
    await this.initialize()

    if (this.usePostgres) {
      const client = await this.pool.connect()
      try {
        await client.query('DELETE FROM firm_profiles')
        console.log('✅ Firm profile cleared from PostgreSQL')
      } catch (error) {
        console.log('📊 Using JSON fallback for clear firm profile')
        return this.clearFirmProfileJSON()
      } finally {
        client.release()
      }
    } else {
      return this.clearFirmProfileJSON()
    }
  }

  async clearFirmProfileJSON() {
    try {
      const data = await fs.readFile(this.workspaceFile, 'utf8')
      const workspace = JSON.parse(data)
      workspace.firmProfile = null
      await fs.writeFile(this.workspaceFile, JSON.stringify(workspace, null, 2))
      console.log('✅ Firm profile cleared from JSON')
    } catch (error) {
      console.error('Error clearing firm profile from JSON:', error)
      throw error
    }
  }

  async saveFirmProfile(profileData) {
    await this.initialize()

    if (this.usePostgres) {
      const client = await this.pool.connect()
      try {
        // Delete existing profile first
        await client.query('DELETE FROM firm_profiles')

        // Insert new profile
        await client.query(`
                    INSERT INTO firm_profiles (firm_name, primary_sectors, firm_size, created_at)
                    VALUES ($1, $2, $3, NOW())
                `, [
          profileData.firmName,
          JSON.stringify(profileData.primarySectors || []),
          profileData.firmSize || 'Medium'
        ])

        console.log('✅ Firm profile saved to PostgreSQL')
        return profileData
      } catch (error) {
        console.log('📊 Using JSON fallback for save firm profile')
        return this.saveFirmProfileJSON(profileData)
      } finally {
        client.release()
      }
    } else {
      return this.saveFirmProfileJSON(profileData)
    }
  }

  async saveFirmProfileJSON(profileData) {
    try {
      // Ensure workspace file exists
      let workspace = {}
      try {
        const data = await fs.readFile(this.workspaceFile, 'utf8')
        workspace = JSON.parse(data)
      } catch (error) {
        // File doesn't exist, start with empty workspace
        workspace = {
          pinnedUpdates: [],
          savedSearches: [],
          alerts: [],
          firmProfile: null
        }
      }

      // Save the profile
      workspace.firmProfile = {
        firmName: profileData.firmName,
        primarySectors: profileData.primarySectors || [],
        firmSize: profileData.firmSize || 'Medium',
        isActive: true,
        createdDate: new Date().toISOString()
      }

      await fs.writeFile(this.workspaceFile, JSON.stringify(workspace, null, 2))
      console.log('✅ Firm profile saved to JSON')
      return workspace.firmProfile
    } catch (error) {
      console.error('Error saving firm profile to JSON:', error)
      throw error
    }
  }

  // ==========================================
  // SYSTEM STATS METHOD
  // ==========================================

  async getSystemStats() {
    await this.initialize()

    try {
      const updates = await this.getRecentUpdates(1000, 0)
      const today = new Date()
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

      // Basic counts
      const stats = {
        totalUpdates: updates.length,
        todayUpdates: updates.filter(u => new Date(u.fetchedDate || u.createdAt) >= yesterday).length,
        weekUpdates: updates.filter(u => new Date(u.fetchedDate || u.createdAt) >= weekAgo).length,
        authorities: [...new Set(updates.map(u => u.authority).filter(Boolean))].length,
        sectors: [...new Set(updates.map(u => u.sector).filter(Boolean))].length
      }

      // Add workspace stats
      try {
        const pinnedItems = await this.getPinnedItems()
        const savedSearches = await this.getSavedSearches()
        const customAlerts = await this.getCustomAlerts()
        const firmProfile = await this.getFirmProfile()

        stats.workspace = {
          pinnedItems: pinnedItems.length,
          savedSearches: savedSearches.length,
          customAlerts: customAlerts.length,
          activeAlerts: customAlerts.filter(alert => alert.isActive).length,
          hasFirmProfile: !!firmProfile
        }
      } catch (error) {
        console.log('📊 Workspace stats not available yet')
        stats.workspace = {
          pinnedItems: 0,
          savedSearches: 0,
          customAlerts: 0,
          activeAlerts: 0,
          hasFirmProfile: false
        }
      }

      // Authority breakdown
      const authorityBreakdown = {}
      updates.forEach(update => {
        if (update.authority) {
          authorityBreakdown[update.authority] = (authorityBreakdown[update.authority] || 0) + 1
        }
      })
      stats.authorityBreakdown = authorityBreakdown

      // Recent activity (last 24 hours)
      const recentUpdates = updates.filter(u => new Date(u.fetchedDate || u.createdAt) >= yesterday)
      stats.recentActivity = recentUpdates.slice(0, 5).map(update => ({
        headline: update.headline.substring(0, 80) + '...',
        authority: update.authority,
        fetchedDate: update.fetchedDate || update.createdAt
      }))

      return stats
    } catch (error) {
      console.error('Error getting system stats:', error)
      throw new Error(`Failed to get system statistics: ${error.message}`)
    }
  }

  // HEALTH CHECK
  async healthCheck() {
    try {
      if (this.fallbackMode) {
        return {
          status: 'healthy',
          mode: 'json',
          updates: (await this.loadJSONData(this.updatesFile)).length
        }
      } else {
        const client = await this.pool.connect()
        const result = await client.query('SELECT COUNT(*) FROM regulatory_updates')
        client.release()

        return {
          status: 'healthy',
          mode: 'postgresql',
          updates: parseInt(result.rows[0].count)
        }
      }
    } catch (error) {
      return { status: 'unhealthy', error: error.message }
    }
  }
}

module.exports = new EnhancedDBService()
