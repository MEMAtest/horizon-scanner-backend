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

function normalizeWatchList(row) {
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description || null,
    keywords: Array.isArray(row.keywords) ? row.keywords : [],
    authorities: Array.isArray(row.authorities) ? row.authorities : [],
    sectors: Array.isArray(row.sectors) ? row.sectors : [],
    isActive: row.is_active !== false,
    matchCount: parseInt(row.match_count) || 0,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  }
}

function normalizeWatchListMatch(row) {
  if (!row) return null
  return {
    id: row.id,
    watchListId: row.watch_list_id,
    regulatoryUpdateId: row.regulatory_update_id,
    matchScore: parseFloat(row.match_score) || 0,
    matchReasons: row.match_reasons || {},
    dismissed: row.dismissed === true,
    createdAt: toIso(row.created_at),
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

module.exports = function applyWatchListsMethods(EnhancedDBService) {
  Object.assign(EnhancedDBService.prototype, {
    watchListsFile: path.join(__dirname, '../../data/watch_lists.json'),
    watchListMatchesFile: path.join(__dirname, '../../data/watch_list_matches.json'),

    async ensureWatchListsTables() {
      if (!this.usePostgres) return

      const client = await this.pool.connect()
      try {
        // Watch Lists table
        await client.query(`
          CREATE TABLE IF NOT EXISTS watch_lists (
            id BIGSERIAL PRIMARY KEY,
            user_id TEXT NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
            authorities TEXT[] DEFAULT ARRAY[]::TEXT[],
            sectors TEXT[] DEFAULT ARRAY[]::TEXT[],
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
          )
        `)

        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_watch_lists_user
          ON watch_lists(user_id, is_active)
        `)

        // Watch List Matches table
        await client.query(`
          CREATE TABLE IF NOT EXISTS watch_list_matches (
            id BIGSERIAL PRIMARY KEY,
            watch_list_id BIGINT NOT NULL REFERENCES watch_lists(id) ON DELETE CASCADE,
            regulatory_update_id BIGINT NOT NULL,
            match_score DECIMAL(3,2) DEFAULT 0,
            match_reasons JSONB DEFAULT '{}',
            dismissed BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
            UNIQUE(watch_list_id, regulatory_update_id)
          )
        `)

        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_watch_list_matches_list
          ON watch_list_matches(watch_list_id, dismissed)
        `)

        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_watch_list_matches_update
          ON watch_list_matches(regulatory_update_id)
        `)

        console.log('✅ Watch lists tables ready')
      } catch (error) {
        console.error('❌ Error creating watch lists tables:', error.message)
      } finally {
        client.release()
      }
    },

    // ===========================================
    // WATCH LISTS CRUD
    // ===========================================
    async getWatchLists(userId = 'default') {
      await this.initialize()
      const userKey = String(userId || 'default')

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(`
            SELECT w.*,
              (SELECT COUNT(*) FROM watch_list_matches m WHERE m.watch_list_id = w.id AND m.dismissed = FALSE) as match_count
            FROM watch_lists w
            WHERE w.user_id = $1 AND w.is_active = TRUE
            ORDER BY w.created_at DESC
          `, [userKey])
          return result.rows.map(normalizeWatchList)
        } catch (error) {
          console.warn('📊 Falling back to JSON for getWatchLists:', error.message)
          return this.getWatchListsJSON(userKey)
        } finally {
          client.release()
        }
      }

      return this.getWatchListsJSON(userKey)
    },

    async getWatchListById(watchListId, userId = 'default') {
      await this.initialize()
      const userKey = String(userId || 'default')

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(`
            SELECT w.*,
              (SELECT COUNT(*) FROM watch_list_matches m WHERE m.watch_list_id = w.id AND m.dismissed = FALSE) as match_count
            FROM watch_lists w
            WHERE w.id = $1 AND w.user_id = $2
          `, [watchListId, userKey])
          return result.rows.length ? normalizeWatchList(result.rows[0]) : null
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return this.getWatchListByIdJSON(watchListId, userKey)
        } finally {
          client.release()
        }
      }

      return this.getWatchListByIdJSON(watchListId, userKey)
    },

    async createWatchList(userId = 'default', data = {}) {
      await this.initialize()
      const userKey = String(userId || 'default')

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(`
            INSERT INTO watch_lists (
              user_id, name, description, keywords, authorities, sectors,
              is_active, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, TRUE, NOW(), NOW())
            RETURNING *
          `, [
            userKey,
            data.name || 'New Watch List',
            data.description || null,
            data.keywords || [],
            data.authorities || [],
            data.sectors || []
          ])
          return normalizeWatchList(result.rows[0])
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return this.createWatchListJSON(userKey, data)
        } finally {
          client.release()
        }
      }

      return this.createWatchListJSON(userKey, data)
    },

    async updateWatchList(watchListId, userId = 'default', updates = {}) {
      await this.initialize()
      const userKey = String(userId || 'default')

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const setClauses = []
          const params = [watchListId, userKey]
          let paramCount = 2

          if (updates.name !== undefined) {
            setClauses.push(`name = $${++paramCount}`)
            params.push(updates.name)
          }
          if (updates.description !== undefined) {
            setClauses.push(`description = $${++paramCount}`)
            params.push(updates.description)
          }
          if (updates.keywords !== undefined) {
            setClauses.push(`keywords = $${++paramCount}`)
            params.push(updates.keywords)
          }
          if (updates.authorities !== undefined) {
            setClauses.push(`authorities = $${++paramCount}`)
            params.push(updates.authorities)
          }
          if (updates.sectors !== undefined) {
            setClauses.push(`sectors = $${++paramCount}`)
            params.push(updates.sectors)
          }

          if (setClauses.length === 0) {
            return this.getWatchListById(watchListId, userId)
          }

          setClauses.push('updated_at = NOW()')

          const result = await client.query(`
            UPDATE watch_lists SET ${setClauses.join(', ')}
            WHERE id = $1 AND user_id = $2
            RETURNING *
          `, params)

          return result.rows.length ? normalizeWatchList(result.rows[0]) : null
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return this.updateWatchListJSON(watchListId, userKey, updates)
        } finally {
          client.release()
        }
      }

      return this.updateWatchListJSON(watchListId, userKey, updates)
    },

    async deleteWatchList(watchListId, userId = 'default') {
      await this.initialize()
      const userKey = String(userId || 'default')

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(`
            UPDATE watch_lists SET is_active = FALSE, updated_at = NOW()
            WHERE id = $1 AND user_id = $2
            RETURNING *
          `, [watchListId, userKey])
          return result.rows.length > 0
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return this.deleteWatchListJSON(watchListId, userKey)
        } finally {
          client.release()
        }
      }

      return this.deleteWatchListJSON(watchListId, userKey)
    },

    // ===========================================
    // WATCH LIST MATCHES
    // ===========================================
    async getWatchListMatches(watchListId, options = {}) {
      await this.initialize()
      const { includeDismissed = false, limit = 50, offset = 0 } = options

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          let query = `
            SELECT m.*, u.headline, u.summary, u.ai_summary, u.authority, u.sector,
                   u.impact_level, u.published_date, u.url
            FROM watch_list_matches m
            LEFT JOIN regulatory_updates u ON m.regulatory_update_id = u.id
            WHERE m.watch_list_id = $1
          `
          const params = [watchListId]
          let paramCount = 1

          if (!includeDismissed) {
            query += ` AND m.dismissed = FALSE`
          }

          query += ` ORDER BY m.created_at DESC`
          query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`
          params.push(limit, offset)

          const result = await client.query(query, params)
          return result.rows.map(normalizeWatchListMatch)
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return this.getWatchListMatchesJSON(watchListId, options)
        } finally {
          client.release()
        }
      }

      return this.getWatchListMatchesJSON(watchListId, options)
    },

    async createWatchListMatch(watchListId, updateId, matchData = {}) {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(`
            INSERT INTO watch_list_matches (
              watch_list_id, regulatory_update_id, match_score, match_reasons, dismissed, created_at
            ) VALUES ($1, $2, $3, $4, FALSE, NOW())
            ON CONFLICT (watch_list_id, regulatory_update_id) DO UPDATE SET
              match_score = EXCLUDED.match_score,
              match_reasons = EXCLUDED.match_reasons
            RETURNING *
          `, [
            watchListId,
            updateId,
            matchData.matchScore || 0,
            JSON.stringify(matchData.matchReasons || {})
          ])
          return normalizeWatchListMatch(result.rows[0])
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return this.createWatchListMatchJSON(watchListId, updateId, matchData)
        } finally {
          client.release()
        }
      }

      return this.createWatchListMatchJSON(watchListId, updateId, matchData)
    },

    async dismissWatchListMatch(matchId) {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(`
            UPDATE watch_list_matches SET dismissed = TRUE
            WHERE id = $1
            RETURNING *
          `, [matchId])
          return result.rows.length > 0
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return this.dismissWatchListMatchJSON(matchId)
        } finally {
          client.release()
        }
      }

      return this.dismissWatchListMatchJSON(matchId)
    },

    async deleteWatchListMatch(matchId) {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(`
            DELETE FROM watch_list_matches
            WHERE id = $1
            RETURNING *
          `, [matchId])
          return result.rows.length > 0 ? normalizeWatchListMatch(result.rows[0]) : null
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return this.deleteWatchListMatchJSON(matchId)
        } finally {
          client.release()
        }
      }

      return this.deleteWatchListMatchJSON(matchId)
    },

    async getMatchCountForWatchList(watchListId) {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(`
            SELECT COUNT(*) as count FROM watch_list_matches
            WHERE watch_list_id = $1 AND dismissed = FALSE
          `, [watchListId])
          return parseInt(result.rows[0].count) || 0
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return this.getMatchCountForWatchListJSON(watchListId)
        } finally {
          client.release()
        }
      }

      return this.getMatchCountForWatchListJSON(watchListId)
    },

    // ===========================================
    // MATCHING ALGORITHM
    // ===========================================
    async matchUpdateAgainstWatchLists(updateId, updateData) {
      await this.initialize()

      // Get all active watch lists
      const watchLists = await this.getAllActiveWatchLists()
      const matches = []

      for (const watchList of watchLists) {
        const matchResult = this.calculateMatchScore(watchList, updateData)
        if (matchResult.score > 0) {
          const match = await this.createWatchListMatch(watchList.id, updateId, {
            matchScore: matchResult.score,
            matchReasons: matchResult.reasons
          })
          matches.push(match)
        }
      }

      return matches
    },

    async getAllActiveWatchLists() {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(`
            SELECT * FROM watch_lists WHERE is_active = TRUE
          `)
          return result.rows.map(normalizeWatchList)
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return this.getAllActiveWatchListsJSON()
        } finally {
          client.release()
        }
      }

      return this.getAllActiveWatchListsJSON()
    },

    calculateMatchScore(watchList, update) {
      const reasons = []
      let score = 0

      // Check keywords
      const text = `${update.headline || ''} ${update.summary || ''} ${update.ai_summary || ''}`.toLowerCase()
      const matchedKeywords = (watchList.keywords || []).filter(kw =>
        text.includes(kw.toLowerCase())
      )
      if (matchedKeywords.length > 0) {
        score += 0.4 * Math.min(matchedKeywords.length / watchList.keywords.length, 1)
        reasons.push({ type: 'keyword', matched: matchedKeywords })
      }

      // Check authorities
      const updateAuthority = (update.authority || '').toLowerCase()
      const matchedAuthorities = (watchList.authorities || []).filter(auth =>
        updateAuthority.includes(auth.toLowerCase())
      )
      if (matchedAuthorities.length > 0) {
        score += 0.3
        reasons.push({ type: 'authority', matched: matchedAuthorities })
      }

      // Check sectors
      const updateSector = (update.sector || '').toLowerCase()
      const matchedSectors = (watchList.sectors || []).filter(sector =>
        updateSector.includes(sector.toLowerCase())
      )
      if (matchedSectors.length > 0) {
        score += 0.3
        reasons.push({ type: 'sector', matched: matchedSectors })
      }

      return { score: Math.min(score, 1), reasons }
    },

    // ===========================================
    // JSON FALLBACK HELPERS
    // ===========================================
    async loadWatchListsJSON() {
      try {
        const raw = await fs.readFile(this.watchListsFile, 'utf8')
        return JSON.parse(raw) || []
      } catch (error) {
        if (error.code === 'ENOENT') {
          await this.ensureWatchListsJSONFiles()
          return []
        }
        throw error
      }
    },

    async saveWatchListsJSON(data) {
      await fs.writeFile(this.watchListsFile, JSON.stringify(data, null, 2))
    },

    async loadWatchListMatchesJSON() {
      try {
        const raw = await fs.readFile(this.watchListMatchesFile, 'utf8')
        return JSON.parse(raw) || []
      } catch (error) {
        if (error.code === 'ENOENT') {
          await this.ensureWatchListsJSONFiles()
          return []
        }
        throw error
      }
    },

    async saveWatchListMatchesJSON(data) {
      await fs.writeFile(this.watchListMatchesFile, JSON.stringify(data, null, 2))
    },

    async ensureWatchListsJSONFiles() {
      const dir = path.dirname(this.watchListsFile)
      await fs.mkdir(dir, { recursive: true })

      for (const file of [this.watchListsFile, this.watchListMatchesFile]) {
        try {
          await fs.access(file)
        } catch {
          await fs.writeFile(file, JSON.stringify([], null, 2))
        }
      }
    },

    async getWatchListsJSON(userId) {
      const lists = await this.loadWatchListsJSON()
      const matches = await this.loadWatchListMatchesJSON()

      return lists
        .filter(l => l.userId === userId && l.isActive !== false)
        .map(l => ({
          ...l,
          matchCount: matches.filter(m =>
            String(m.watchListId) === String(l.id) && !m.dismissed
          ).length
        }))
    },

    async getWatchListByIdJSON(watchListId, userId) {
      const lists = await this.loadWatchListsJSON()
      const matches = await this.loadWatchListMatchesJSON()

      const list = lists.find(l =>
        String(l.id) === String(watchListId) && l.userId === userId
      )

      if (!list) return null

      return {
        ...list,
        matchCount: matches.filter(m =>
          String(m.watchListId) === String(list.id) && !m.dismissed
        ).length
      }
    },

    async createWatchListJSON(userId, data) {
      const lists = await this.loadWatchListsJSON()
      const now = new Date().toISOString()

      const newList = {
        id: crypto.randomUUID ? crypto.randomUUID() : `wl-${Date.now()}`,
        userId,
        name: data.name || 'New Watch List',
        description: data.description || null,
        keywords: data.keywords || [],
        authorities: data.authorities || [],
        sectors: data.sectors || [],
        isActive: true,
        createdAt: now,
        updatedAt: now
      }

      lists.push(newList)
      await this.saveWatchListsJSON(lists)
      return { ...newList, matchCount: 0 }
    },

    async updateWatchListJSON(watchListId, userId, updates) {
      const lists = await this.loadWatchListsJSON()
      let updated = null

      const nextLists = lists.map(l => {
        if (String(l.id) === String(watchListId) && l.userId === userId) {
          updated = { ...l, ...updates, updatedAt: new Date().toISOString() }
          return updated
        }
        return l
      })

      if (updated) await this.saveWatchListsJSON(nextLists)
      return updated
    },

    async deleteWatchListJSON(watchListId, userId) {
      const lists = await this.loadWatchListsJSON()
      let deleted = false

      const nextLists = lists.map(l => {
        if (String(l.id) === String(watchListId) && l.userId === userId) {
          deleted = true
          return { ...l, isActive: false, updatedAt: new Date().toISOString() }
        }
        return l
      })

      if (deleted) await this.saveWatchListsJSON(nextLists)
      return deleted
    },

    async getWatchListMatchesJSON(watchListId, options = {}) {
      const { includeDismissed = false, limit = 50, offset = 0 } = options
      const matches = await this.loadWatchListMatchesJSON()

      let filtered = matches.filter(m =>
        String(m.watchListId) === String(watchListId) &&
        (includeDismissed || !m.dismissed)
      )

      // Sort by created date descending
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

      return filtered.slice(offset, offset + limit)
    },

    async createWatchListMatchJSON(watchListId, updateId, matchData) {
      const matches = await this.loadWatchListMatchesJSON()
      const now = new Date().toISOString()

      // Check for existing match
      const existingIndex = matches.findIndex(m =>
        String(m.watchListId) === String(watchListId) &&
        String(m.regulatoryUpdateId) === String(updateId)
      )

      const newMatch = {
        id: crypto.randomUUID ? crypto.randomUUID() : `wlm-${Date.now()}`,
        watchListId,
        regulatoryUpdateId: updateId,
        matchScore: matchData.matchScore || 0,
        matchReasons: matchData.matchReasons || {},
        dismissed: false,
        createdAt: now
      }

      if (existingIndex >= 0) {
        matches[existingIndex] = { ...matches[existingIndex], ...newMatch, id: matches[existingIndex].id }
      } else {
        matches.push(newMatch)
      }

      await this.saveWatchListMatchesJSON(matches)
      return newMatch
    },

    async dismissWatchListMatchJSON(matchId) {
      const matches = await this.loadWatchListMatchesJSON()
      let dismissed = false

      const nextMatches = matches.map(m => {
        if (String(m.id) === String(matchId)) {
          dismissed = true
          return { ...m, dismissed: true }
        }
        return m
      })

      if (dismissed) await this.saveWatchListMatchesJSON(nextMatches)
      return dismissed
    },

    async deleteWatchListMatchJSON(matchId) {
      const matches = await this.loadWatchListMatchesJSON()
      let deleted = null

      const nextMatches = matches.filter(m => {
        if (String(m.id) === String(matchId)) {
          deleted = m
          return false
        }
        return true
      })

      if (deleted) await this.saveWatchListMatchesJSON(nextMatches)
      return deleted
    },

    async getMatchCountForWatchListJSON(watchListId) {
      const matches = await this.loadWatchListMatchesJSON()
      return matches.filter(m =>
        String(m.watchListId) === String(watchListId) && !m.dismissed
      ).length
    },

    async getAllActiveWatchListsJSON() {
      const lists = await this.loadWatchListsJSON()
      return lists.filter(l => l.isActive !== false)
    }
  })
}
