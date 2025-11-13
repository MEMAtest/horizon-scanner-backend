const fs = require('fs').promises
const crypto = require('crypto')

function toIso(value) {
  if (!value) return null
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString()
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function normalizeRow(row) {
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    serviceType: row.service_type,
    secondaryServiceTypes: Array.isArray(row.secondary_service_types) ? row.secondary_service_types : [],
    companySize: row.company_size || null,
    regions: Array.isArray(row.regions) ? row.regions : [],
    regulatoryPosture: row.regulatory_posture || null,
    personas: Array.isArray(row.personas) ? row.personas : [],
    goals: Array.isArray(row.goals) ? row.goals : [],
    preferences: row.preferences && typeof row.preferences === 'object' ? row.preferences : {},
    isActive: row.is_active !== false,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  }
}

function sanitizeProfileInput(profile = {}) {
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
    serviceType: String(profile.serviceType || 'general_financial_services').trim() || 'general_financial_services',
    secondaryServiceTypes: coerceArray(profile.secondaryServiceTypes),
    companySize: profile.companySize ? String(profile.companySize).trim() : null,
    regions: coerceArray(profile.regions),
    regulatoryPosture: profile.regulatoryPosture ? String(profile.regulatoryPosture).trim() : null,
    personas: coerceArray(profile.personas),
    goals: coerceArray(profile.goals),
    preferences: profile.preferences && typeof profile.preferences === 'object' ? profile.preferences : {},
    isActive: profile.isActive !== false
  }
}

module.exports = function applyProfileMethods(EnhancedDBService) {
  Object.assign(EnhancedDBService.prototype, {
    async getUserProfile(userId = 'default', options = {}) {
      await this.initialize()
      const includeInactive = Boolean(options.includeInactive)

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const query = includeInactive
            ? `
                SELECT * FROM user_profiles
                WHERE user_id = $1
                ORDER BY updated_at DESC
              `
            : `
                SELECT * FROM user_profiles
                WHERE user_id = $1 AND is_active = TRUE
                ORDER BY updated_at DESC
                LIMIT 1
              `
          const result = await client.query(query, [String(userId || 'default')])
          if (!result.rows.length) return includeInactive ? [] : null
          if (includeInactive) return result.rows.map(normalizeRow)
          return normalizeRow(result.rows[0])
        } catch (error) {
          console.warn('📊 Falling back to JSON for getUserProfile:', error.message)
          return includeInactive
            ? this.listUserProfilesJSON(userId)
            : this.getUserProfileJSON(userId)
        } finally {
          client.release()
        }
      }

      return includeInactive
        ? this.listUserProfilesJSON(userId)
        : this.getUserProfileJSON(userId)
    },

    async saveUserProfile(userId = 'default', profile = {}) {
      await this.initialize()
      const sanitized = sanitizeProfileInput(profile)
      const userKey = String(userId || 'default')

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          await client.query('BEGIN')
          await client.query(
            `
              UPDATE user_profiles
              SET is_active = FALSE, updated_at = NOW()
              WHERE user_id = $1
            `,
            [userKey]
          )

          const result = await client.query(
            `
              INSERT INTO user_profiles (
                user_id,
                service_type,
                secondary_service_types,
                company_size,
                regions,
                regulatory_posture,
                personas,
                goals,
                preferences,
                is_active,
                created_at,
                updated_at
              )
              VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE, NOW(), NOW()
              )
              RETURNING *
            `,
            [
              userKey,
              sanitized.serviceType,
              sanitized.secondaryServiceTypes,
              sanitized.companySize,
              sanitized.regions,
              sanitized.regulatoryPosture,
              sanitized.personas,
              sanitized.goals,
              sanitized.preferences
            ]
          )

          await client.query('COMMIT')
          return normalizeRow(result.rows[0])
        } catch (error) {
          await client.query('ROLLBACK')
          console.warn('📊 Falling back to JSON for saveUserProfile:', error.message)
          return this.saveUserProfileJSON(userKey, sanitized)
        } finally {
          client.release()
        }
      }

      return this.saveUserProfileJSON(userKey, sanitized)
    },

    async clearUserProfiles(userId = 'default') {
      await this.initialize()
      const userKey = String(userId || 'default')

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          await client.query(
            'UPDATE user_profiles SET is_active = FALSE, updated_at = NOW() WHERE user_id = $1',
            [userKey]
          )
          return true
        } catch (error) {
          console.warn('📊 Falling back to JSON for clearUserProfiles:', error.message)
          return this.clearUserProfilesJSON(userKey)
        } finally {
          client.release()
        }
      }

      return this.clearUserProfilesJSON(userKey)
    },

    async listUserProfiles(userId = null) {
      await this.initialize()
      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const params = []
          const whereClause = userId ? (params.push(String(userId)), 'WHERE user_id = $1') : ''
          const result = await client.query(
            `
              SELECT * FROM user_profiles
              ${whereClause}
              ORDER BY user_id, updated_at DESC
            `,
            params
          )
          return result.rows.map(normalizeRow)
        } catch (error) {
          console.warn('📊 Falling back to JSON for listUserProfiles:', error.message)
          return this.listUserProfilesJSON(userId)
        } finally {
          client.release()
        }
      }

      return this.listUserProfilesJSON(userId)
    },

    // -----------------------------------------------------------------------
    // JSON fallback helpers
    // -----------------------------------------------------------------------
    async loadUserProfilesJSON() {
      try {
        const raw = await fs.readFile(this.userProfilesFile, 'utf8')
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : []
      } catch (error) {
        if (error.code === 'ENOENT') return []
        throw error
      }
    },

    async saveUserProfilesJSON(profiles) {
      await fs.writeFile(this.userProfilesFile, JSON.stringify(profiles, null, 2))
    },

    async getUserProfileJSON(userId = 'default') {
      const profiles = await this.loadUserProfilesJSON()
      const userKey = String(userId || 'default')
      const activeProfile = profiles.find(profile => profile.userId === userKey && profile.isActive !== false)
      return activeProfile ? { ...activeProfile } : null
    },

    async listUserProfilesJSON(userId = null) {
      const profiles = await this.loadUserProfilesJSON()
      if (!userId) return profiles.map(profile => ({ ...profile }))
      const userKey = String(userId || 'default')
      return profiles.filter(profile => profile.userId === userKey).map(profile => ({ ...profile }))
    },

    async saveUserProfileJSON(userId, profile) {
      const profiles = await this.loadUserProfilesJSON()
      const now = new Date().toISOString()
      const nextProfiles = profiles.map(existing => {
        if (existing.userId !== userId) return existing
        return {
          ...existing,
          isActive: false,
          updatedAt: now
        }
      })

      const record = {
        id: profile.id || crypto.randomUUID ? crypto.randomUUID() : `profile-${Date.now()}`,
        userId,
        serviceType: profile.serviceType,
        secondaryServiceTypes: profile.secondaryServiceTypes,
        companySize: profile.companySize,
        regions: profile.regions,
        regulatoryPosture: profile.regulatoryPosture,
        personas: profile.personas,
        goals: profile.goals,
        preferences: profile.preferences,
        isActive: true,
        createdAt: now,
        updatedAt: now
      }

      nextProfiles.push(record)
      await this.saveUserProfilesJSON(nextProfiles)
      return { ...record }
    },

    async clearUserProfilesJSON(userId) {
      const profiles = await this.loadUserProfilesJSON()
      let mutated = false
      const now = new Date().toISOString()
      const nextProfiles = profiles.map(profile => {
        if (profile.userId !== userId) return profile
        mutated = true
        return {
          ...profile,
          isActive: false,
          updatedAt: now
        }
      })
      if (mutated) {
        await this.saveUserProfilesJSON(nextProfiles)
      }
      return true
    }
  })
}
