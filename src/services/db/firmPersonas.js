/**
 * Firm Personas Database Methods
 * Handles persona storage and retrieval
 */

const fs = require('fs').promises
const path = require('path')

function toIso(value) {
  if (!value) return null
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString()
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function normalizePersonaRecord(row) {
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    personaId: row.persona_id,
    personaName: row.persona_name,
    customConfig: row.custom_config || {},
    isActive: row.is_active !== false,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  }
}

module.exports = function applyFirmPersonasMethods(EnhancedDBService) {
  Object.assign(EnhancedDBService.prototype, {

    // =========================================================================
    // Table Creation
    // =========================================================================

    async ensureFirmPersonasTable() {
      if (!this.usePostgres) return

      const client = await this.pool.connect()
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS firm_personas (
            id BIGSERIAL PRIMARY KEY,
            user_id BIGINT NOT NULL,
            persona_id TEXT NOT NULL,
            persona_name TEXT NOT NULL,
            custom_config JSONB DEFAULT '{}'::JSONB,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, persona_id)
          )
        `)

        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_firm_personas_user ON firm_personas (user_id)
        `)

        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_firm_personas_active ON firm_personas (user_id, is_active) WHERE is_active = TRUE
        `)

        console.log('✅ Firm personas table ensured')
      } catch (error) {
        console.error('Error ensuring firm_personas table:', error.message)
      } finally {
        client.release()
      }
    },

    // =========================================================================
    // Persona Methods
    // =========================================================================

    /**
     * Get active persona for a user
     */
    async getUserFirmPersona(userId) {
      await this.waitForInitialization()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(
            `SELECT * FROM firm_personas
             WHERE user_id = $1 AND is_active = TRUE
             ORDER BY updated_at DESC
             LIMIT 1`,
            [userId]
          )

          return result.rows.length > 0 ? normalizePersonaRecord(result.rows[0]) : null
        } catch (error) {
          // Table might not exist yet
          if (error.code === '42P01') {
            await this.ensureFirmPersonasTable()
            return null
          }
          console.error('Error getting user firm persona:', error.message)
          return null
        } finally {
          client.release()
        }
      }

      return this.getUserFirmPersonaJSON(userId)
    },

    /**
     * Save/update persona for a user
     */
    async saveUserFirmPersona(userId, personaId, personaName, customConfig = {}) {
      await this.waitForInitialization()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          // Ensure table exists
          await this.ensureFirmPersonasTable()

          await client.query('BEGIN')

          // Deactivate any existing personas for this user
          await client.query(
            `UPDATE firm_personas
             SET is_active = FALSE, updated_at = NOW()
             WHERE user_id = $1`,
            [userId]
          )

          // Insert or update the new persona
          const result = await client.query(
            `INSERT INTO firm_personas (user_id, persona_id, persona_name, custom_config, is_active, created_at, updated_at)
             VALUES ($1, $2, $3, $4, TRUE, NOW(), NOW())
             ON CONFLICT (user_id, persona_id)
             DO UPDATE SET
               persona_name = EXCLUDED.persona_name,
               custom_config = EXCLUDED.custom_config,
               is_active = TRUE,
               updated_at = NOW()
             RETURNING *`,
            [userId, personaId, personaName, JSON.stringify(customConfig)]
          )

          await client.query('COMMIT')

          return normalizePersonaRecord(result.rows[0])
        } catch (error) {
          await client.query('ROLLBACK')
          console.error('Error saving user firm persona:', error.message)
          throw error
        } finally {
          client.release()
        }
      }

      return this.saveUserFirmPersonaJSON(userId, personaId, personaName, customConfig)
    },

    /**
     * Clear/deactivate persona for a user
     */
    async clearUserFirmPersona(userId) {
      await this.waitForInitialization()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          await client.query(
            `UPDATE firm_personas
             SET is_active = FALSE, updated_at = NOW()
             WHERE user_id = $1`,
            [userId]
          )
          return true
        } catch (error) {
          console.error('Error clearing user firm persona:', error.message)
          return false
        } finally {
          client.release()
        }
      }

      return this.clearUserFirmPersonaJSON(userId)
    },

    // =========================================================================
    // JSON Fallback Methods
    // =========================================================================

    getFirmPersonasFile() {
      return path.join(this.jsonDataPath, 'firm_personas.json')
    },

    async loadFirmPersonasJSON() {
      try {
        const data = await fs.readFile(this.getFirmPersonasFile(), 'utf8')
        return JSON.parse(data)
      } catch (error) {
        if (error.code === 'ENOENT') return []
        throw error
      }
    },

    async saveFirmPersonasJSON(personas) {
      await fs.writeFile(this.getFirmPersonasFile(), JSON.stringify(personas, null, 2))
    },

    async getUserFirmPersonaJSON(userId) {
      const personas = await this.loadFirmPersonasJSON()
      const persona = personas.find(p => p.user_id === userId && p.is_active)
      return persona ? normalizePersonaRecord(persona) : null
    },

    async saveUserFirmPersonaJSON(userId, personaId, personaName, customConfig) {
      const personas = await this.loadFirmPersonasJSON()
      const now = new Date().toISOString()

      // Deactivate existing
      personas.forEach(p => {
        if (p.user_id === userId) {
          p.is_active = false
          p.updated_at = now
        }
      })

      // Find or create
      let persona = personas.find(p => p.user_id === userId && p.persona_id === personaId)

      if (persona) {
        persona.persona_name = personaName
        persona.custom_config = customConfig
        persona.is_active = true
        persona.updated_at = now
      } else {
        persona = {
          id: Date.now(),
          user_id: userId,
          persona_id: personaId,
          persona_name: personaName,
          custom_config: customConfig,
          is_active: true,
          created_at: now,
          updated_at: now
        }
        personas.push(persona)
      }

      await this.saveFirmPersonasJSON(personas)
      return normalizePersonaRecord(persona)
    },

    async clearUserFirmPersonaJSON(userId) {
      const personas = await this.loadFirmPersonasJSON()
      const now = new Date().toISOString()

      personas.forEach(p => {
        if (p.user_id === userId) {
          p.is_active = false
          p.updated_at = now
        }
      })

      await this.saveFirmPersonasJSON(personas)
      return true
    }
  })
}
