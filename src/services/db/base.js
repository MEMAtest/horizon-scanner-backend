const { Pool } = require('pg')
const fs = require('fs').promises
const path = require('path')
const { normalizeSectorName } = require('../../utils/sectorTaxonomy')

module.exports = function applyBaseMethods(EnhancedDBService) {
  Object.assign(EnhancedDBService.prototype, {
    normalizeUpdateFields(update) {
      return {
        ...update,
        impactLevel: update.impactLevel || update.impact_level,
        businessImpactScore: update.businessImpactScore || update.business_impact_score,
        aiSummary: update.ai_summary || update.aiSummary,
        contentType: update.content_type || update.contentType,
        aiTags: update.ai_tags || update.aiTags,
        impact_level: update.impactLevel || update.impact_level,
        business_impact_score: update.businessImpactScore || update.business_impact_score,
        ai_summary: update.ai_summary || update.aiSummary,
        content_type: update.content_type || update.contentType
      }
    },

    normalizePinnedItemRecord(item) {
      if (!item || typeof item !== 'object') return null

      const metadata = item.metadata && typeof item.metadata === 'object'
        ? { ...item.metadata }
        : {}

      const sectorSources = Array.isArray(item.sectors)
        ? item.sectors
        : Array.isArray(metadata.sectors)
          ? metadata.sectors
          : []
      const sectors = Array.from(
        new Set(
          sectorSources
            .map(normalizeSectorName)
            .filter(Boolean)
        )
      )
      metadata.sectors = sectors

      if (!metadata.summary && item.summary) {
        metadata.summary = item.summary
      }
      if (!metadata.published && item.pinned_date) {
        metadata.published = item.pinned_date
      }
      if (!metadata.personas && Array.isArray(item.personas)) {
        metadata.personas = item.personas.filter(Boolean)
      } else if (Array.isArray(metadata.personas)) {
        metadata.personas = metadata.personas.filter(Boolean)
      }
      if (!metadata.updateId && (item.update_id || item.updateId)) {
        metadata.updateId = item.update_id || item.updateId
      }
      metadata.authority = metadata.authority || item.update_authority || item.authority || null

      return {
        id: item.id,
        update_url: item.update_url || item.updateUrl || item.url || '',
        update_title: item.update_title || item.updateTitle || item.title || '',
        update_authority: item.update_authority || item.updateAuthority || item.authority || '',
        notes: item.notes || '',
        pinned_date: item.pinned_date || item.pinnedDate || new Date().toISOString(),
        sectors,
        metadata
      }
    },

    async initializeDatabase() {
      try {
        if (process.env.DATABASE_URL) {
          console.log('🔗 Connecting to PostgreSQL database...')
          this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
          })

          const client = await this.pool.connect()
          await client.query('SELECT NOW()')
          client.release()

          console.log('✅ PostgreSQL connected successfully')
          this.fallbackMode = false
          this.usePostgres = true

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
    },

    async ensureTablesExist() {
      try {
        const client = await this.pool.connect()

        const result = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'regulatory_updates' AND column_name = 'ai_summary'
            `)

        if (result.rows.length === 0) {
          console.log('🔧 Running database migration for AI intelligence fields...')
          await this.runMigrations(client)
        }

        await client.query(`
        CREATE TABLE IF NOT EXISTS daily_digest_history (
          update_identifier TEXT PRIMARY KEY,
          digest_sent_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
        )
      `)

        await client.query(`
        CREATE INDEX IF NOT EXISTS idx_daily_digest_history_sent_at
          ON daily_digest_history (digest_sent_at DESC)
      `)

        await client.query(`
        CREATE TABLE IF NOT EXISTS user_profiles (
          id BIGSERIAL PRIMARY KEY,
          user_id TEXT NOT NULL,
          service_type TEXT NOT NULL,
          secondary_service_types TEXT[] DEFAULT ARRAY[]::TEXT[],
          company_size TEXT,
          regions TEXT[] DEFAULT ARRAY[]::TEXT[],
          regulatory_posture TEXT,
          personas TEXT[] DEFAULT ARRAY[]::TEXT[],
          goals TEXT[] DEFAULT ARRAY[]::TEXT[],
          preferences JSONB DEFAULT '{}'::JSONB,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
        )
      `)

        await client.query(`
        CREATE INDEX IF NOT EXISTS idx_user_profiles_user_active
          ON user_profiles (user_id, is_active, updated_at DESC)
      `)

        await client.query(`
        CREATE TABLE IF NOT EXISTS intelligence_events (
          id BIGSERIAL PRIMARY KEY,
          user_id TEXT NOT NULL,
          profile_id TEXT,
          event_type TEXT NOT NULL,
          update_id TEXT,
          workflow_template_id TEXT,
          payload JSONB DEFAULT '{}'::JSONB,
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
        )
      `)

        await client.query(`
        CREATE INDEX IF NOT EXISTS idx_intelligence_events_profile
          ON intelligence_events (profile_id, created_at DESC)
      `)

        await client.query(`
        CREATE INDEX IF NOT EXISTS idx_intelligence_events_type
          ON intelligence_events (event_type, created_at DESC)
      `)

        await client.query(`
        CREATE TABLE IF NOT EXISTS profile_feedback_scores (
          id BIGSERIAL PRIMARY KEY,
          profile_id TEXT NOT NULL,
          entity_type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          weight NUMERIC DEFAULT 0,
          last_event_at TIMESTAMP WITHOUT TIME ZONE,
          window_counts JSONB DEFAULT '{}'::JSONB,
          updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
          UNIQUE (profile_id, entity_type, entity_id)
        )
      `)

        await client.query(`
        CREATE INDEX IF NOT EXISTS idx_profile_feedback_profile_entity
          ON profile_feedback_scores (profile_id, entity_type)
      `)

        await client.query(`
        CREATE TABLE IF NOT EXISTS profile_workflows (
          id BIGSERIAL PRIMARY KEY,
          user_id TEXT NOT NULL,
          profile_id TEXT,
          title TEXT NOT NULL,
          summary TEXT,
          sources JSONB DEFAULT '[]'::JSONB,
          rating INTEGER,
          personas TEXT[] DEFAULT ARRAY[]::TEXT[],
          needs_review BOOLEAN DEFAULT FALSE,
          aligns_policy BOOLEAN DEFAULT FALSE,
          policy_reference TEXT,
          status TEXT DEFAULT 'open',
          metadata JSONB DEFAULT '{}'::JSONB,
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
        )
      `)

        await client.query(`
        CREATE INDEX IF NOT EXISTS idx_profile_workflows_user
          ON profile_workflows (user_id, status, created_at DESC)
      `)

        client.release()

        // Create business line profiles table
        if (typeof this.ensureBusinessLineProfilesTable === 'function') {
          await this.ensureBusinessLineProfilesTable()
        }

        // Create regulatory changes workflow tables
        if (typeof this.ensureRegulatoryChangesTables === 'function') {
          await this.ensureRegulatoryChangesTables()
        }
      } catch (error) {
        console.error('❌ Error ensuring tables exist:', error)
      }
    },

    async runMigrations(client) {
      try {
        await client.query(`
                ALTER TABLE regulatory_updates
                ADD COLUMN IF NOT EXISTS ai_summary TEXT,
                ADD COLUMN IF NOT EXISTS ai_confidence_score NUMERIC(5,2),
                ADD COLUMN IF NOT EXISTS business_impact_score NUMERIC(5,2),
                ADD COLUMN IF NOT EXISTS ai_tags TEXT[],
                ADD COLUMN IF NOT EXISTS ai_analysis JSONB,
                ADD COLUMN IF NOT EXISTS ai_processed_at TIMESTAMP
            `)

        await client.query(`
                ALTER TABLE regulatory_updates
                ADD COLUMN IF NOT EXISTS content_type TEXT,
                ADD COLUMN IF NOT EXISTS content_subtype TEXT,
                ADD COLUMN IF NOT EXISTS source_type TEXT,
                ADD COLUMN IF NOT EXISTS compliance_deadline TIMESTAMP,
                ADD COLUMN IF NOT EXISTS enforcement_signal BOOLEAN,
                ADD COLUMN IF NOT EXISTS ai_summary_vector VECTOR(1536)
            `)

        await client.query(`
                CREATE TABLE IF NOT EXISTS ai_insights (
                    id SERIAL PRIMARY KEY,
                    insight_type TEXT NOT NULL,
                    summary TEXT NOT NULL,
                    recommendations TEXT[],
                    related_updates TEXT[],
                    metadata JSONB DEFAULT '{}',
                    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
                )
            `)
      } catch (error) {
        console.error('❌ Error running migrations:', error)
        throw error
      }
    },

    async ensureJSONFiles() {
      try {
        await fs.mkdir(this.jsonDataPath, { recursive: true })

        const defaultFiles = [
          { path: this.updatesFile, defaultContent: [] },
          { path: this.insightsFile, defaultContent: [] },
          {
            path: this.workspaceFile,
            defaultContent: {
              savedSearches: [],
              customAlerts: [],
              pinnedItems: [],
              firmProfile: null
            }
          },
          { path: this.profilesFile, defaultContent: [] },
          { path: this.userProfilesFile, defaultContent: [] },
          { path: path.join(this.jsonDataPath, 'intelligence_events.json'), defaultContent: [] },
          { path: path.join(this.jsonDataPath, 'profile_feedback_scores.json'), defaultContent: [] },
          { path: path.join(this.jsonDataPath, 'profile_workflows.json'), defaultContent: [] },
          { path: this.digestHistoryFile, defaultContent: [] }
        ]

        await Promise.all(defaultFiles.map(async ({ path: filePath, defaultContent }) => {
          try {
            await fs.access(filePath)
          } catch (error) {
            await fs.writeFile(filePath, JSON.stringify(defaultContent, null, 2))
          }
        }))
      } catch (error) {
        console.error('❌ Error ensuring JSON files exist:', error)
        throw error
      }
    },

    async loadJSONData(filePath) {
      try {
        const content = await fs.readFile(filePath, 'utf8')
        return JSON.parse(content)
      } catch (error) {
        if (error.code === 'ENOENT') {
          await this.ensureJSONFiles()
          return this.loadJSONData(filePath)
        }
        console.error(`❌ Error loading JSON from ${filePath}:`, error)
        throw error
      }
    },

    async saveJSONData(filePath, data) {
      try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2))
      } catch (error) {
        console.error(`❌ Error saving JSON to ${filePath}:`, error)
        throw error
      }
    },

    async initialize() {
      return true
    }
  })
}
