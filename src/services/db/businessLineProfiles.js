const fs = require('fs').promises
const path = require('path')
const crypto = require('crypto')

function toIso(value) {
  if (!value) return null
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString()
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function normalizeBusinessLineProfile(row) {
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description || null,
    sectors: Array.isArray(row.sectors) ? row.sectors : [],
    regulators: Array.isArray(row.regulators) ? row.regulators : [],
    regions: Array.isArray(row.regions) ? row.regions : [],
    firmSize: row.firm_size || null,
    riskAppetite: row.risk_appetite || 'medium',
    relevanceThreshold: parseFloat(row.relevance_threshold) || 0.3,
    priorityKeywords: Array.isArray(row.priority_keywords) ? row.priority_keywords : [],
    excludedKeywords: Array.isArray(row.excluded_keywords) ? row.excluded_keywords : [],
    color: row.color || null,
    icon: row.icon || null,
    sortOrder: row.sort_order || 0,
    isDefault: row.is_default === true,
    isActive: row.is_active !== false,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  }
}

function sanitizeBusinessLineInput(profile = {}) {
  const coerceArray = value => {
    if (!value) return []
    if (Array.isArray(value)) {
      return value.map(entry => String(entry || '').trim()).filter(Boolean)
    }
    if (typeof value === 'string' && value.trim()) {
      return [value.trim()]
    }
    return []
  }

  return {
    name: String(profile.name || 'New Business Line').trim(),
    description: profile.description ? String(profile.description).trim() : null,
    sectors: coerceArray(profile.sectors),
    regulators: coerceArray(profile.regulators),
    regions: coerceArray(profile.regions),
    firmSize: profile.firmSize ? String(profile.firmSize).trim() : null,
    riskAppetite: profile.riskAppetite ? String(profile.riskAppetite).trim() : 'medium',
    relevanceThreshold: parseFloat(profile.relevanceThreshold) || 0.3,
    priorityKeywords: coerceArray(profile.priorityKeywords),
    excludedKeywords: coerceArray(profile.excludedKeywords),
    color: profile.color ? String(profile.color).trim() : null,
    icon: profile.icon ? String(profile.icon).trim() : null,
    sortOrder: parseInt(profile.sortOrder, 10) || 0,
    isDefault: profile.isDefault === true,
    isActive: profile.isActive !== false
  }
}

module.exports = function applyBusinessLineProfileMethods(EnhancedDBService) {
  Object.assign(EnhancedDBService.prototype, {
    businessLineProfilesFile: path.join(__dirname, '../../data/business_line_profiles.json'),

    async ensureBusinessLineProfilesTable() {
      if (!this.usePostgres) return

      const client = await this.pool.connect()
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS business_line_profiles (
            id BIGSERIAL PRIMARY KEY,
            user_id TEXT NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            sectors TEXT[] DEFAULT ARRAY[]::TEXT[],
            regulators TEXT[] DEFAULT ARRAY[]::TEXT[],
            regions TEXT[] DEFAULT ARRAY[]::TEXT[],
            firm_size VARCHAR(50),
            risk_appetite VARCHAR(20) DEFAULT 'medium',
            relevance_threshold NUMERIC(3,2) DEFAULT 0.3,
            priority_keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
            excluded_keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
            color VARCHAR(7),
            icon VARCHAR(50),
            sort_order INTEGER DEFAULT 0,
            is_default BOOLEAN DEFAULT FALSE,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
          )
        `)

        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_business_line_profiles_user
          ON business_line_profiles(user_id, is_active)
        `)

        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_business_line_profiles_sectors
          ON business_line_profiles USING GIN(sectors)
        `)

        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_business_line_profiles_regulators
          ON business_line_profiles USING GIN(regulators)
        `)

        console.log('✅ business_line_profiles table ready')
      } catch (error) {
        console.error('❌ Error creating business_line_profiles table:', error.message)
      } finally {
        client.release()
      }
    },

    async getBusinessLineProfiles(userId = 'default', options = {}) {
      await this.initialize()
      const includeInactive = Boolean(options.includeInactive)
      const userKey = String(userId || 'default')

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const query = includeInactive
            ? `
                SELECT * FROM business_line_profiles
                WHERE user_id = $1
                ORDER BY sort_order ASC, name ASC
              `
            : `
                SELECT * FROM business_line_profiles
                WHERE user_id = $1 AND is_active = TRUE
                ORDER BY sort_order ASC, name ASC
              `
          const result = await client.query(query, [userKey])
          return result.rows.map(normalizeBusinessLineProfile)
        } catch (error) {
          console.warn('📊 Falling back to JSON for getBusinessLineProfiles:', error.message)
          return this.getBusinessLineProfilesJSON(userKey, includeInactive)
        } finally {
          client.release()
        }
      }

      return this.getBusinessLineProfilesJSON(userKey, includeInactive)
    },

    async getBusinessLineProfileById(profileId, userId = 'default') {
      await this.initialize()
      const userKey = String(userId || 'default')

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(
            `SELECT * FROM business_line_profiles WHERE id = $1 AND user_id = $2`,
            [profileId, userKey]
          )
          return result.rows.length ? normalizeBusinessLineProfile(result.rows[0]) : null
        } catch (error) {
          console.warn('📊 Falling back to JSON for getBusinessLineProfileById:', error.message)
          return this.getBusinessLineProfileByIdJSON(profileId, userKey)
        } finally {
          client.release()
        }
      }

      return this.getBusinessLineProfileByIdJSON(profileId, userKey)
    },

    async getDefaultBusinessLineProfile(userId = 'default') {
      await this.initialize()
      const userKey = String(userId || 'default')

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(
            `SELECT * FROM business_line_profiles
             WHERE user_id = $1 AND is_default = TRUE AND is_active = TRUE
             LIMIT 1`,
            [userKey]
          )
          return result.rows.length ? normalizeBusinessLineProfile(result.rows[0]) : null
        } catch (error) {
          console.warn('📊 Falling back to JSON for getDefaultBusinessLineProfile:', error.message)
          return this.getDefaultBusinessLineProfileJSON(userKey)
        } finally {
          client.release()
        }
      }

      return this.getDefaultBusinessLineProfileJSON(userKey)
    },

    async createBusinessLineProfile(userId = 'default', profileData = {}) {
      await this.initialize()
      const userKey = String(userId || 'default')
      const sanitized = sanitizeBusinessLineInput(profileData)

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          await client.query('BEGIN')

          // If this is being set as default, unset other defaults
          if (sanitized.isDefault) {
            await client.query(
              `UPDATE business_line_profiles
               SET is_default = FALSE, updated_at = NOW()
               WHERE user_id = $1 AND is_default = TRUE`,
              [userKey]
            )
          }

          const result = await client.query(
            `INSERT INTO business_line_profiles (
              user_id, name, description, sectors, regulators, regions,
              firm_size, risk_appetite, relevance_threshold,
              priority_keywords, excluded_keywords, color, icon,
              sort_order, is_default, is_active, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, TRUE, NOW(), NOW()
            ) RETURNING *`,
            [
              userKey,
              sanitized.name,
              sanitized.description,
              sanitized.sectors,
              sanitized.regulators,
              sanitized.regions,
              sanitized.firmSize,
              sanitized.riskAppetite,
              sanitized.relevanceThreshold,
              sanitized.priorityKeywords,
              sanitized.excludedKeywords,
              sanitized.color,
              sanitized.icon,
              sanitized.sortOrder,
              sanitized.isDefault
            ]
          )

          await client.query('COMMIT')
          return normalizeBusinessLineProfile(result.rows[0])
        } catch (error) {
          await client.query('ROLLBACK')
          console.warn('📊 Falling back to JSON for createBusinessLineProfile:', error.message)
          return this.createBusinessLineProfileJSON(userKey, sanitized)
        } finally {
          client.release()
        }
      }

      return this.createBusinessLineProfileJSON(userKey, sanitized)
    },

    async updateBusinessLineProfile(profileId, userId = 'default', updates = {}) {
      await this.initialize()
      const userKey = String(userId || 'default')
      const sanitized = sanitizeBusinessLineInput(updates)

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          await client.query('BEGIN')

          // If setting as default, unset other defaults first
          if (sanitized.isDefault) {
            await client.query(
              `UPDATE business_line_profiles
               SET is_default = FALSE, updated_at = NOW()
               WHERE user_id = $1 AND is_default = TRUE AND id != $2`,
              [userKey, profileId]
            )
          }

          const result = await client.query(
            `UPDATE business_line_profiles SET
              name = $3,
              description = $4,
              sectors = $5,
              regulators = $6,
              regions = $7,
              firm_size = $8,
              risk_appetite = $9,
              relevance_threshold = $10,
              priority_keywords = $11,
              excluded_keywords = $12,
              color = $13,
              icon = $14,
              sort_order = $15,
              is_default = $16,
              updated_at = NOW()
            WHERE id = $1 AND user_id = $2
            RETURNING *`,
            [
              profileId,
              userKey,
              sanitized.name,
              sanitized.description,
              sanitized.sectors,
              sanitized.regulators,
              sanitized.regions,
              sanitized.firmSize,
              sanitized.riskAppetite,
              sanitized.relevanceThreshold,
              sanitized.priorityKeywords,
              sanitized.excludedKeywords,
              sanitized.color,
              sanitized.icon,
              sanitized.sortOrder,
              sanitized.isDefault
            ]
          )

          await client.query('COMMIT')
          return result.rows.length ? normalizeBusinessLineProfile(result.rows[0]) : null
        } catch (error) {
          await client.query('ROLLBACK')
          console.warn('📊 Falling back to JSON for updateBusinessLineProfile:', error.message)
          return this.updateBusinessLineProfileJSON(profileId, userKey, sanitized)
        } finally {
          client.release()
        }
      }

      return this.updateBusinessLineProfileJSON(profileId, userKey, sanitized)
    },

    async deleteBusinessLineProfile(profileId, userId = 'default') {
      await this.initialize()
      const userKey = String(userId || 'default')

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(
            `UPDATE business_line_profiles
             SET is_active = FALSE, updated_at = NOW()
             WHERE id = $1 AND user_id = $2
             RETURNING *`,
            [profileId, userKey]
          )
          return result.rows.length > 0
        } catch (error) {
          console.warn('📊 Falling back to JSON for deleteBusinessLineProfile:', error.message)
          return this.deleteBusinessLineProfileJSON(profileId, userKey)
        } finally {
          client.release()
        }
      }

      return this.deleteBusinessLineProfileJSON(profileId, userKey)
    },

    async setDefaultBusinessLineProfile(profileId, userId = 'default') {
      await this.initialize()
      const userKey = String(userId || 'default')

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          await client.query('BEGIN')

          // Unset all current defaults
          await client.query(
            `UPDATE business_line_profiles
             SET is_default = FALSE, updated_at = NOW()
             WHERE user_id = $1`,
            [userKey]
          )

          // Set new default
          const result = await client.query(
            `UPDATE business_line_profiles
             SET is_default = TRUE, updated_at = NOW()
             WHERE id = $1 AND user_id = $2
             RETURNING *`,
            [profileId, userKey]
          )

          await client.query('COMMIT')
          return result.rows.length ? normalizeBusinessLineProfile(result.rows[0]) : null
        } catch (error) {
          await client.query('ROLLBACK')
          console.warn('📊 Falling back to JSON for setDefaultBusinessLineProfile:', error.message)
          return this.setDefaultBusinessLineProfileJSON(profileId, userKey)
        } finally {
          client.release()
        }
      }

      return this.setDefaultBusinessLineProfileJSON(profileId, userKey)
    },

    // -----------------------------------------------------------------------
    // JSON fallback helpers
    // -----------------------------------------------------------------------
    async loadBusinessLineProfilesJSON() {
      try {
        const raw = await fs.readFile(this.businessLineProfilesFile, 'utf8')
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : []
      } catch (error) {
        if (error.code === 'ENOENT') {
          await this.ensureBusinessLineProfilesJSONFile()
          return []
        }
        throw error
      }
    },

    async saveBusinessLineProfilesJSON(profiles) {
      await fs.writeFile(this.businessLineProfilesFile, JSON.stringify(profiles, null, 2))
    },

    async ensureBusinessLineProfilesJSONFile() {
      const dir = path.dirname(this.businessLineProfilesFile)
      await fs.mkdir(dir, { recursive: true })
      try {
        await fs.access(this.businessLineProfilesFile)
      } catch {
        await fs.writeFile(this.businessLineProfilesFile, JSON.stringify([], null, 2))
      }
    },

    async getBusinessLineProfilesJSON(userId, includeInactive = false) {
      const profiles = await this.loadBusinessLineProfilesJSON()
      return profiles
        .filter(p => p.userId === userId && (includeInactive || p.isActive !== false))
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .map(p => ({ ...p }))
    },

    async getBusinessLineProfileByIdJSON(profileId, userId) {
      const profiles = await this.loadBusinessLineProfilesJSON()
      const profile = profiles.find(p =>
        (p.id === profileId || String(p.id) === String(profileId)) && p.userId === userId
      )
      return profile ? { ...profile } : null
    },

    async getDefaultBusinessLineProfileJSON(userId) {
      const profiles = await this.loadBusinessLineProfilesJSON()
      const defaultProfile = profiles.find(p =>
        p.userId === userId && p.isDefault === true && p.isActive !== false
      )
      return defaultProfile ? { ...defaultProfile } : null
    },

    async createBusinessLineProfileJSON(userId, profile) {
      const profiles = await this.loadBusinessLineProfilesJSON()
      const now = new Date().toISOString()

      // If setting as default, unset others
      if (profile.isDefault) {
        profiles.forEach(p => {
          if (p.userId === userId) {
            p.isDefault = false
            p.updatedAt = now
          }
        })
      }

      const newId = crypto.randomUUID ? crypto.randomUUID() : `blp-${Date.now()}`
      const record = {
        id: newId,
        userId,
        ...profile,
        isActive: true,
        createdAt: now,
        updatedAt: now
      }

      profiles.push(record)
      await this.saveBusinessLineProfilesJSON(profiles)
      return { ...record }
    },

    async updateBusinessLineProfileJSON(profileId, userId, updates) {
      const profiles = await this.loadBusinessLineProfilesJSON()
      const now = new Date().toISOString()
      let updated = null

      // If setting as default, unset others first
      if (updates.isDefault) {
        profiles.forEach(p => {
          if (p.userId === userId && (p.id !== profileId && String(p.id) !== String(profileId))) {
            p.isDefault = false
            p.updatedAt = now
          }
        })
      }

      const nextProfiles = profiles.map(p => {
        if ((p.id === profileId || String(p.id) === String(profileId)) && p.userId === userId) {
          updated = {
            ...p,
            ...updates,
            id: p.id,
            userId: p.userId,
            createdAt: p.createdAt,
            updatedAt: now
          }
          return updated
        }
        return p
      })

      await this.saveBusinessLineProfilesJSON(nextProfiles)
      return updated ? { ...updated } : null
    },

    async deleteBusinessLineProfileJSON(profileId, userId) {
      const profiles = await this.loadBusinessLineProfilesJSON()
      const now = new Date().toISOString()
      let deleted = false

      const nextProfiles = profiles.map(p => {
        if ((p.id === profileId || String(p.id) === String(profileId)) && p.userId === userId) {
          deleted = true
          return { ...p, isActive: false, updatedAt: now }
        }
        return p
      })

      if (deleted) {
        await this.saveBusinessLineProfilesJSON(nextProfiles)
      }
      return deleted
    },

    async setDefaultBusinessLineProfileJSON(profileId, userId) {
      const profiles = await this.loadBusinessLineProfilesJSON()
      const now = new Date().toISOString()
      let updatedProfile = null

      const nextProfiles = profiles.map(p => {
        if (p.userId !== userId) return p

        if (p.id === profileId || String(p.id) === String(profileId)) {
          updatedProfile = { ...p, isDefault: true, updatedAt: now }
          return updatedProfile
        }

        return { ...p, isDefault: false, updatedAt: now }
      })

      await this.saveBusinessLineProfilesJSON(nextProfiles)
      return updatedProfile ? { ...updatedProfile } : null
    }
  })
}
