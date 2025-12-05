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

function normalizeDossier(row) {
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description || null,
    category: row.category || null,
    tags: Array.isArray(row.tags) ? row.tags : [],
    status: row.status || 'active',
    relatedPolicyId: row.related_policy_id || null,
    itemCount: parseInt(row.item_count) || 0,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  }
}

function normalizeDossierItem(row) {
  if (!row) return null
  return {
    id: row.id,
    dossierId: row.dossier_id,
    regulatoryUpdateId: row.regulatory_update_id,
    userNotes: row.user_notes || null,
    relevanceRating: row.relevance_rating || null,
    addedAt: toIso(row.added_at),
    // Include update details if joined
    update: row.headline ? {
      id: row.regulatory_update_id,
      headline: row.headline,
      summary: row.summary || row.ai_summary,
      authority: row.authority,
      sector: row.sector,
      impactLevel: row.impact_level,
      publishedDate: toIso(row.published_date),
      url: row.url
    } : null
  }
}

module.exports = function applyDossiersMethods(EnhancedDBService) {
  Object.assign(EnhancedDBService.prototype, {
    dossiersFile: path.join(__dirname, '../../data/research_dossiers.json'),
    dossierItemsFile: path.join(__dirname, '../../data/dossier_items.json'),

    async ensureDossiersTables() {
      if (!this.usePostgres) return

      const client = await this.pool.connect()
      try {
        // Research Dossiers table
        await client.query(`
          CREATE TABLE IF NOT EXISTS research_dossiers (
            id BIGSERIAL PRIMARY KEY,
            user_id TEXT NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            category VARCHAR(100),
            tags TEXT[] DEFAULT ARRAY[]::TEXT[],
            status VARCHAR(30) DEFAULT 'active',
            related_policy_id BIGINT,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
          )
        `)

        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_research_dossiers_user
          ON research_dossiers(user_id, status)
        `)

        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_research_dossiers_category
          ON research_dossiers(category)
        `)

        // Dossier Items table
        await client.query(`
          CREATE TABLE IF NOT EXISTS dossier_items (
            id BIGSERIAL PRIMARY KEY,
            dossier_id BIGINT NOT NULL REFERENCES research_dossiers(id) ON DELETE CASCADE,
            regulatory_update_id BIGINT NOT NULL,
            user_notes TEXT,
            relevance_rating INTEGER,
            added_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
            UNIQUE(dossier_id, regulatory_update_id)
          )
        `)

        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_dossier_items_dossier
          ON dossier_items(dossier_id)
        `)

        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_dossier_items_update
          ON dossier_items(regulatory_update_id)
        `)

        console.log('✅ Dossiers tables ready')
      } catch (error) {
        console.error('❌ Error creating dossiers tables:', error.message)
      } finally {
        client.release()
      }
    },

    // ===========================================
    // DOSSIERS CRUD
    // ===========================================
    async getDossiers(userId = 'default', filters = {}) {
      await this.initialize()
      const userKey = String(userId || 'default')

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          let query = `
            SELECT d.*,
              (SELECT COUNT(*) FROM dossier_items i WHERE i.dossier_id = d.id) as item_count
            FROM research_dossiers d
            WHERE d.user_id = $1
          `
          const params = [userKey]
          let paramCount = 1

          if (filters.status) {
            query += ` AND d.status = $${++paramCount}`
            params.push(filters.status)
          } else {
            query += ` AND d.status != 'archived'`
          }

          if (filters.category) {
            query += ` AND d.category = $${++paramCount}`
            params.push(filters.category)
          }

          query += ` ORDER BY d.updated_at DESC`

          const result = await client.query(query, params)
          return result.rows.map(normalizeDossier)
        } catch (error) {
          console.warn('📊 Falling back to JSON for getDossiers:', error.message)
          return this.getDossiersJSON(userKey, filters)
        } finally {
          client.release()
        }
      }

      return this.getDossiersJSON(userKey, filters)
    },

    async getDossierById(dossierId, userId = 'default') {
      await this.initialize()
      const userKey = String(userId || 'default')

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(`
            SELECT d.*,
              (SELECT COUNT(*) FROM dossier_items i WHERE i.dossier_id = d.id) as item_count
            FROM research_dossiers d
            WHERE d.id = $1 AND d.user_id = $2
          `, [dossierId, userKey])
          return result.rows.length ? normalizeDossier(result.rows[0]) : null
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return this.getDossierByIdJSON(dossierId, userKey)
        } finally {
          client.release()
        }
      }

      return this.getDossierByIdJSON(dossierId, userKey)
    },

    async createDossier(userId = 'default', data = {}) {
      await this.initialize()
      const userKey = String(userId || 'default')

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(`
            INSERT INTO research_dossiers (
              user_id, name, description, category, tags, status,
              created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW())
            RETURNING *
          `, [
            userKey,
            data.name || 'New Research Dossier',
            data.description || null,
            data.category || null,
            data.tags || []
          ])
          return normalizeDossier(result.rows[0])
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return this.createDossierJSON(userKey, data)
        } finally {
          client.release()
        }
      }

      return this.createDossierJSON(userKey, data)
    },

    async updateDossier(dossierId, userId = 'default', updates = {}) {
      await this.initialize()
      const userKey = String(userId || 'default')

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const setClauses = []
          const params = [dossierId, userKey]
          let paramCount = 2

          if (updates.name !== undefined) {
            setClauses.push(`name = $${++paramCount}`)
            params.push(updates.name)
          }
          if (updates.description !== undefined) {
            setClauses.push(`description = $${++paramCount}`)
            params.push(updates.description)
          }
          if (updates.category !== undefined) {
            setClauses.push(`category = $${++paramCount}`)
            params.push(updates.category)
          }
          if (updates.tags !== undefined) {
            setClauses.push(`tags = $${++paramCount}`)
            params.push(updates.tags)
          }
          if (updates.status !== undefined) {
            setClauses.push(`status = $${++paramCount}`)
            params.push(updates.status)
          }
          if (updates.relatedPolicyId !== undefined) {
            setClauses.push(`related_policy_id = $${++paramCount}`)
            params.push(updates.relatedPolicyId)
          }

          if (setClauses.length === 0) {
            return this.getDossierById(dossierId, userId)
          }

          setClauses.push('updated_at = NOW()')

          const result = await client.query(`
            UPDATE research_dossiers SET ${setClauses.join(', ')}
            WHERE id = $1 AND user_id = $2
            RETURNING *
          `, params)

          return result.rows.length ? normalizeDossier(result.rows[0]) : null
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return this.updateDossierJSON(dossierId, userKey, updates)
        } finally {
          client.release()
        }
      }

      return this.updateDossierJSON(dossierId, userKey, updates)
    },

    async deleteDossier(dossierId, userId = 'default') {
      await this.initialize()
      const userKey = String(userId || 'default')

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(`
            UPDATE research_dossiers SET status = 'archived', updated_at = NOW()
            WHERE id = $1 AND user_id = $2
            RETURNING *
          `, [dossierId, userKey])
          return result.rows.length > 0
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return this.deleteDossierJSON(dossierId, userKey)
        } finally {
          client.release()
        }
      }

      return this.deleteDossierJSON(dossierId, userKey)
    },

    // ===========================================
    // DOSSIER ITEMS
    // ===========================================
    async getDossierItems(dossierId, options = {}) {
      await this.initialize()
      const { limit = 100, offset = 0 } = options

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(`
            SELECT i.*, u.headline, u.summary, u.ai_summary, u.authority, u.sector,
                   u.impact_level, u.published_date, u.url
            FROM dossier_items i
            LEFT JOIN regulatory_updates u ON i.regulatory_update_id = u.id
            WHERE i.dossier_id = $1
            ORDER BY i.added_at DESC
            LIMIT $2 OFFSET $3
          `, [dossierId, limit, offset])
          return result.rows.map(normalizeDossierItem)
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return this.getDossierItemsJSON(dossierId, options)
        } finally {
          client.release()
        }
      }

      return this.getDossierItemsJSON(dossierId, options)
    },

    async addItemToDossier(dossierId, updateId, data = {}) {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(`
            INSERT INTO dossier_items (
              dossier_id, regulatory_update_id, user_notes, relevance_rating, added_at
            ) VALUES ($1, $2, $3, $4, NOW())
            ON CONFLICT (dossier_id, regulatory_update_id) DO UPDATE SET
              user_notes = COALESCE(EXCLUDED.user_notes, dossier_items.user_notes),
              relevance_rating = COALESCE(EXCLUDED.relevance_rating, dossier_items.relevance_rating)
            RETURNING *
          `, [
            dossierId,
            updateId,
            data.userNotes || null,
            data.relevanceRating || null
          ])

          // Update dossier's updated_at
          await client.query(`
            UPDATE research_dossiers SET updated_at = NOW() WHERE id = $1
          `, [dossierId])

          return normalizeDossierItem(result.rows[0])
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return this.addItemToDossierJSON(dossierId, updateId, data)
        } finally {
          client.release()
        }
      }

      return this.addItemToDossierJSON(dossierId, updateId, data)
    },

    async updateDossierItem(itemId, updates = {}) {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const setClauses = []
          const params = [itemId]
          let paramCount = 1

          if (updates.userNotes !== undefined) {
            setClauses.push(`user_notes = $${++paramCount}`)
            params.push(updates.userNotes)
          }
          if (updates.relevanceRating !== undefined) {
            setClauses.push(`relevance_rating = $${++paramCount}`)
            params.push(updates.relevanceRating)
          }

          if (setClauses.length === 0) return null

          const result = await client.query(`
            UPDATE dossier_items SET ${setClauses.join(', ')}
            WHERE id = $1
            RETURNING *
          `, params)

          return result.rows.length ? normalizeDossierItem(result.rows[0]) : null
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return this.updateDossierItemJSON(itemId, updates)
        } finally {
          client.release()
        }
      }

      return this.updateDossierItemJSON(itemId, updates)
    },

    async removeItemFromDossier(itemId) {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(`
            DELETE FROM dossier_items WHERE id = $1 RETURNING dossier_id
          `, [itemId])

          if (result.rows.length > 0) {
            // Update dossier's updated_at
            await client.query(`
              UPDATE research_dossiers SET updated_at = NOW() WHERE id = $1
            `, [result.rows[0].dossier_id])
          }

          return result.rows.length > 0
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return this.removeItemFromDossierJSON(itemId)
        } finally {
          client.release()
        }
      }

      return this.removeItemFromDossierJSON(itemId)
    },

    async getItemCountForDossier(dossierId) {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(`
            SELECT COUNT(*) as count FROM dossier_items WHERE dossier_id = $1
          `, [dossierId])
          return parseInt(result.rows[0].count) || 0
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return this.getItemCountForDossierJSON(dossierId)
        } finally {
          client.release()
        }
      }

      return this.getItemCountForDossierJSON(dossierId)
    },

    // ===========================================
    // TIMELINE VIEW
    // ===========================================
    async getDossierTimeline(dossierId) {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(`
            SELECT i.*, u.headline, u.summary, u.ai_summary, u.authority, u.sector,
                   u.impact_level, u.published_date, u.url
            FROM dossier_items i
            LEFT JOIN regulatory_updates u ON i.regulatory_update_id = u.id
            WHERE i.dossier_id = $1
            ORDER BY u.published_date ASC
          `, [dossierId])
          return result.rows.map(normalizeDossierItem)
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return this.getDossierTimelineJSON(dossierId)
        } finally {
          client.release()
        }
      }

      return this.getDossierTimelineJSON(dossierId)
    },

    // ===========================================
    // JSON FALLBACK HELPERS
    // ===========================================
    async loadDossiersJSON() {
      try {
        const raw = await fs.readFile(this.dossiersFile, 'utf8')
        return JSON.parse(raw) || []
      } catch (error) {
        if (error.code === 'ENOENT') {
          await this.ensureDossiersJSONFiles()
          return []
        }
        throw error
      }
    },

    async saveDossiersJSON(data) {
      await fs.writeFile(this.dossiersFile, JSON.stringify(data, null, 2))
    },

    async loadDossierItemsJSON() {
      try {
        const raw = await fs.readFile(this.dossierItemsFile, 'utf8')
        return JSON.parse(raw) || []
      } catch (error) {
        if (error.code === 'ENOENT') {
          await this.ensureDossiersJSONFiles()
          return []
        }
        throw error
      }
    },

    async saveDossierItemsJSON(data) {
      await fs.writeFile(this.dossierItemsFile, JSON.stringify(data, null, 2))
    },

    async ensureDossiersJSONFiles() {
      const dir = path.dirname(this.dossiersFile)
      await fs.mkdir(dir, { recursive: true })

      for (const file of [this.dossiersFile, this.dossierItemsFile]) {
        try {
          await fs.access(file)
        } catch {
          await fs.writeFile(file, JSON.stringify([], null, 2))
        }
      }
    },

    async getDossiersJSON(userId, filters = {}) {
      const dossiers = await this.loadDossiersJSON()
      const items = await this.loadDossierItemsJSON()

      let filtered = dossiers.filter(d => d.userId === userId)

      if (filters.status) {
        filtered = filtered.filter(d => d.status === filters.status)
      } else {
        filtered = filtered.filter(d => d.status !== 'archived')
      }

      if (filters.category) {
        filtered = filtered.filter(d => d.category === filters.category)
      }

      return filtered.map(d => ({
        ...d,
        itemCount: items.filter(i => String(i.dossierId) === String(d.id)).length
      }))
    },

    async getDossierByIdJSON(dossierId, userId) {
      const dossiers = await this.loadDossiersJSON()
      const items = await this.loadDossierItemsJSON()

      const dossier = dossiers.find(d =>
        String(d.id) === String(dossierId) && d.userId === userId
      )

      if (!dossier) return null

      return {
        ...dossier,
        itemCount: items.filter(i => String(i.dossierId) === String(dossier.id)).length
      }
    },

    async createDossierJSON(userId, data) {
      const dossiers = await this.loadDossiersJSON()
      const now = new Date().toISOString()

      const newDossier = {
        id: crypto.randomUUID ? crypto.randomUUID() : `dos-${Date.now()}`,
        userId,
        name: data.name || 'New Research Dossier',
        description: data.description || null,
        category: data.category || null,
        tags: data.tags || [],
        status: 'active',
        relatedPolicyId: null,
        createdAt: now,
        updatedAt: now
      }

      dossiers.push(newDossier)
      await this.saveDossiersJSON(dossiers)
      return { ...newDossier, itemCount: 0 }
    },

    async updateDossierJSON(dossierId, userId, updates) {
      const dossiers = await this.loadDossiersJSON()
      let updated = null

      const nextDossiers = dossiers.map(d => {
        if (String(d.id) === String(dossierId) && d.userId === userId) {
          updated = { ...d, ...updates, updatedAt: new Date().toISOString() }
          return updated
        }
        return d
      })

      if (updated) await this.saveDossiersJSON(nextDossiers)
      return updated
    },

    async deleteDossierJSON(dossierId, userId) {
      const dossiers = await this.loadDossiersJSON()
      let deleted = false

      const nextDossiers = dossiers.map(d => {
        if (String(d.id) === String(dossierId) && d.userId === userId) {
          deleted = true
          return { ...d, status: 'archived', updatedAt: new Date().toISOString() }
        }
        return d
      })

      if (deleted) await this.saveDossiersJSON(nextDossiers)
      return deleted
    },

    async getDossierItemsJSON(dossierId, options = {}) {
      const { limit = 100, offset = 0 } = options
      const items = await this.loadDossierItemsJSON()

      const filtered = items
        .filter(i => String(i.dossierId) === String(dossierId))
        .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))

      return filtered.slice(offset, offset + limit)
    },

    async addItemToDossierJSON(dossierId, updateId, data) {
      const items = await this.loadDossierItemsJSON()
      const now = new Date().toISOString()

      // Check for existing item
      const existingIndex = items.findIndex(i =>
        String(i.dossierId) === String(dossierId) &&
        String(i.regulatoryUpdateId) === String(updateId)
      )

      const newItem = {
        id: crypto.randomUUID ? crypto.randomUUID() : `di-${Date.now()}`,
        dossierId,
        regulatoryUpdateId: updateId,
        userNotes: data.userNotes || null,
        relevanceRating: data.relevanceRating || null,
        addedAt: now
      }

      if (existingIndex >= 0) {
        items[existingIndex] = {
          ...items[existingIndex],
          userNotes: data.userNotes || items[existingIndex].userNotes,
          relevanceRating: data.relevanceRating || items[existingIndex].relevanceRating
        }
      } else {
        items.push(newItem)
      }

      await this.saveDossierItemsJSON(items)

      // Update dossier's updated_at
      const dossiers = await this.loadDossiersJSON()
      const nextDossiers = dossiers.map(d => {
        if (String(d.id) === String(dossierId)) {
          return { ...d, updatedAt: now }
        }
        return d
      })
      await this.saveDossiersJSON(nextDossiers)

      return existingIndex >= 0 ? items[existingIndex] : newItem
    },

    async updateDossierItemJSON(itemId, updates) {
      const items = await this.loadDossierItemsJSON()
      let updated = null

      const nextItems = items.map(i => {
        if (String(i.id) === String(itemId)) {
          updated = { ...i, ...updates }
          return updated
        }
        return i
      })

      if (updated) await this.saveDossierItemsJSON(nextItems)
      return updated
    },

    async removeItemFromDossierJSON(itemId) {
      const items = await this.loadDossierItemsJSON()
      const item = items.find(i => String(i.id) === String(itemId))

      if (!item) return false

      const nextItems = items.filter(i => String(i.id) !== String(itemId))
      await this.saveDossierItemsJSON(nextItems)

      // Update dossier's updated_at
      const dossiers = await this.loadDossiersJSON()
      const now = new Date().toISOString()
      const nextDossiers = dossiers.map(d => {
        if (String(d.id) === String(item.dossierId)) {
          return { ...d, updatedAt: now }
        }
        return d
      })
      await this.saveDossiersJSON(nextDossiers)

      return true
    },

    async getItemCountForDossierJSON(dossierId) {
      const items = await this.loadDossierItemsJSON()
      return items.filter(i => String(i.dossierId) === String(dossierId)).length
    },

    async getDossierTimelineJSON(dossierId) {
      // For JSON mode, just return items sorted by added date
      // In production with Postgres, we'd sort by the update's published_date
      const items = await this.loadDossierItemsJSON()
      return items
        .filter(i => String(i.dossierId) === String(dossierId))
        .sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt))
    }
  })
}
