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
  const alertOnMatch = row.alert_on_match !== false
  const alertThreshold = Number.parseFloat(row.alert_threshold)
  const normalizedThreshold = Number.isFinite(alertThreshold) ? alertThreshold : 0.5
  const autoAddToDossier = row.auto_add_to_dossier === true
  const targetDossierId = row.target_dossier_id || null
  const unreviewedCount = parseInt(row.unreviewed_count) || 0
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
    unreviewedCount,
    unreviewed_count: unreviewedCount,
    alertOnMatch,
    alert_on_match: alertOnMatch,
    alertThreshold: normalizedThreshold,
    alert_threshold: normalizedThreshold,
    autoAddToDossier,
    auto_add_to_dossier: autoAddToDossier,
    targetDossierId,
    target_dossier_id: targetDossierId,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  }
}

function normalizeWatchListMatch(row) {
  if (!row) return null
  const watchListId = row.watch_list_id || row.watchListId
  const regulatoryUpdateId = row.regulatory_update_id || row.regulatoryUpdateId
  const matchScore = parseFloat(row.match_score ?? row.matchScore) || 0
  const matchReasons = row.match_reasons || row.matchReasons || {}
  const dismissed = row.dismissed === true
  const reviewed = row.reviewed === true
  const matchedAt = toIso(row.created_at || row.createdAt)
  const reviewedAt = toIso(row.reviewed_at || row.reviewedAt)
  const update = row.headline ? {
    id: regulatoryUpdateId,
    headline: row.headline,
    summary: row.summary || row.ai_summary,
    authority: row.authority,
    sector: row.sector,
    impactLevel: row.impact_level,
    publishedDate: toIso(row.published_date),
    url: row.url
  } : row.update || null
  return {
    id: row.id,
    watchListId,
    watch_list_id: watchListId,
    regulatoryUpdateId,
    regulatory_update_id: regulatoryUpdateId,
    matchScore,
    match_score: matchScore,
    matchReasons,
    match_reasons: matchReasons,
    dismissed,
    reviewed,
    reviewedAt,
    reviewed_at: reviewedAt,
    matched_at: matchedAt,
    createdAt: matchedAt,
    update,
    update_title: update ? update.headline : null,
    update_source: update ? update.authority : null,
    update_url: update ? update.url : null
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
            alert_on_match BOOLEAN DEFAULT TRUE,
            alert_threshold DECIMAL(3,2) DEFAULT 0.50,
            auto_add_to_dossier BOOLEAN DEFAULT FALSE,
            target_dossier_id BIGINT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
          )
        `)

        // Add config columns if they don't exist (for existing databases)
        await client.query(`
          ALTER TABLE watch_lists
            ADD COLUMN IF NOT EXISTS alert_on_match BOOLEAN DEFAULT TRUE,
            ADD COLUMN IF NOT EXISTS alert_threshold DECIMAL(3,2) DEFAULT 0.50,
            ADD COLUMN IF NOT EXISTS auto_add_to_dossier BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS target_dossier_id BIGINT
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
            reviewed BOOLEAN DEFAULT FALSE,
            reviewed_at TIMESTAMP WITHOUT TIME ZONE,
            dismissed BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
            UNIQUE(watch_list_id, regulatory_update_id)
          )
        `)

        // Add review columns if they don't exist (for existing databases)
        await client.query(`
          ALTER TABLE watch_list_matches
            ADD COLUMN IF NOT EXISTS reviewed BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITHOUT TIME ZONE
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
              (SELECT COUNT(*) FROM watch_list_matches m WHERE m.watch_list_id = w.id AND m.dismissed = FALSE) as match_count,
              (SELECT COUNT(*) FROM watch_list_matches m WHERE m.watch_list_id = w.id AND m.dismissed = FALSE AND m.reviewed = FALSE) as unreviewed_count
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
              (SELECT COUNT(*) FROM watch_list_matches m WHERE m.watch_list_id = w.id AND m.dismissed = FALSE) as match_count,
              (SELECT COUNT(*) FROM watch_list_matches m WHERE m.watch_list_id = w.id AND m.dismissed = FALSE AND m.reviewed = FALSE) as unreviewed_count
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
      const alertOnMatch = data.alertOnMatch !== undefined
        ? data.alertOnMatch !== false
        : data.alert_on_match !== undefined
          ? data.alert_on_match !== false
          : true
      const rawThreshold = data.alertThreshold !== undefined
        ? data.alertThreshold
        : data.alert_threshold !== undefined
          ? data.alert_threshold
          : 0.5
      const parsedThreshold = Number.parseFloat(rawThreshold)
      const alertThreshold = Number.isFinite(parsedThreshold) ? parsedThreshold : 0.5
      const autoAddToDossier = data.autoAddToDossier !== undefined
        ? data.autoAddToDossier === true
        : data.auto_add_to_dossier !== undefined
          ? data.auto_add_to_dossier === true
          : false
      const targetDossierId = data.targetDossierId || data.target_dossier_id || null

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(`
            INSERT INTO watch_lists (
              user_id, name, description, keywords, authorities, sectors,
              alert_on_match, alert_threshold, auto_add_to_dossier, target_dossier_id,
              is_active, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE, NOW(), NOW())
            RETURNING *
          `, [
            userKey,
            data.name || 'New Watch List',
            data.description || null,
            data.keywords || [],
            data.authorities || [],
            data.sectors || [],
            alertOnMatch,
            alertThreshold,
            autoAddToDossier,
            targetDossierId
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
          if (updates.alertOnMatch !== undefined || updates.alert_on_match !== undefined) {
            const next = updates.alertOnMatch !== undefined ? updates.alertOnMatch : updates.alert_on_match
            setClauses.push(`alert_on_match = $${++paramCount}`)
            params.push(next !== false)
          }
          if (updates.alertThreshold !== undefined || updates.alert_threshold !== undefined) {
            const raw = updates.alertThreshold !== undefined ? updates.alertThreshold : updates.alert_threshold
            const parsed = Number.parseFloat(raw)
            setClauses.push(`alert_threshold = $${++paramCount}`)
            params.push(Number.isFinite(parsed) ? parsed : 0.5)
          }
          if (updates.autoAddToDossier !== undefined || updates.auto_add_to_dossier !== undefined) {
            const next = updates.autoAddToDossier !== undefined ? updates.autoAddToDossier : updates.auto_add_to_dossier
            setClauses.push(`auto_add_to_dossier = $${++paramCount}`)
            params.push(next === true)
          }
          if (updates.targetDossierId !== undefined || updates.target_dossier_id !== undefined) {
            const next = updates.targetDossierId !== undefined ? updates.targetDossierId : updates.target_dossier_id
            setClauses.push(`target_dossier_id = $${++paramCount}`)
            params.push(next || null)
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
              watch_list_id, regulatory_update_id, match_score, match_reasons, reviewed, reviewed_at, dismissed, created_at
            ) VALUES ($1, $2, $3, $4, FALSE, NULL, FALSE, NOW())
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

    async markWatchListMatchReviewed(matchId) {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(`
            UPDATE watch_list_matches
            SET reviewed = TRUE, reviewed_at = NOW()
            WHERE id = $1
            RETURNING *
          `, [matchId])
          return result.rows.length > 0 ? normalizeWatchListMatch(result.rows[0]) : null
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return this.markWatchListMatchReviewedJSON(matchId)
        } finally {
          client.release()
        }
      }

      return this.markWatchListMatchReviewedJSON(matchId)
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
      const updateTitle = updateData?.headline || updateData?.title || updateData?.update_title || 'Update'

      for (const watchList of watchLists) {
        const matchResult = this.calculateMatchScore(watchList, updateData)
        const threshold = Number.parseFloat(
          watchList.alert_threshold !== undefined ? watchList.alert_threshold : watchList.alertThreshold
        )
        const normalizedThreshold = Number.isFinite(threshold) ? threshold : 0.5
        if (matchResult.score >= normalizedThreshold) {
          const match = await this.createWatchListMatch(watchList.id, updateId, {
            matchScore: matchResult.score,
            matchReasons: matchResult.reasons
          })
          matches.push(match)

          const alertEnabled = watchList.alertOnMatch !== false && watchList.alert_on_match !== false
          const userId = watchList.userId || watchList.user_id || 'default'
          if (alertEnabled && typeof this.createWatchListMatchNotification === 'function') {
            try {
              await this.createWatchListMatchNotification(
                userId,
                watchList.name || 'Watch List',
                { id: updateId, title: updateTitle, watchListId: watchList.id },
                matchResult.score
              )
            } catch (error) {
              console.warn('[WatchLists] Failed to create match notification:', error.message)
            }
          }
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
          ).length,
          unreviewedCount: matches.filter(m =>
            String(m.watchListId) === String(l.id) && !m.dismissed && !m.reviewed
          ).length,
          unreviewed_count: matches.filter(m =>
            String(m.watchListId) === String(l.id) && !m.dismissed && !m.reviewed
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
        ).length,
        unreviewedCount: matches.filter(m =>
          String(m.watchListId) === String(list.id) && !m.dismissed && !m.reviewed
        ).length,
        unreviewed_count: matches.filter(m =>
          String(m.watchListId) === String(list.id) && !m.dismissed && !m.reviewed
        ).length
      }
    },

    async createWatchListJSON(userId, data) {
      const lists = await this.loadWatchListsJSON()
      const now = new Date().toISOString()
      const rawThreshold = data.alertThreshold !== undefined
        ? data.alertThreshold
        : data.alert_threshold !== undefined
          ? data.alert_threshold
          : 0.5
      const parsedThreshold = Number.parseFloat(rawThreshold)
      const alertThreshold = Number.isFinite(parsedThreshold) ? parsedThreshold : 0.5
      const alertOnMatch = data.alertOnMatch !== undefined
        ? data.alertOnMatch !== false
        : data.alert_on_match !== undefined
          ? data.alert_on_match !== false
          : true

      const newList = {
        id: crypto.randomUUID ? crypto.randomUUID() : `wl-${Date.now()}`,
        userId,
        name: data.name || 'New Watch List',
        description: data.description || null,
        keywords: data.keywords || [],
        authorities: data.authorities || [],
        sectors: data.sectors || [],
        alertOnMatch,
        alert_on_match: alertOnMatch,
        alertThreshold,
        alert_threshold: alertThreshold,
        autoAddToDossier: data.autoAddToDossier === true || data.auto_add_to_dossier === true,
        auto_add_to_dossier: data.autoAddToDossier === true || data.auto_add_to_dossier === true,
        targetDossierId: data.targetDossierId || data.target_dossier_id || null,
        target_dossier_id: data.targetDossierId || data.target_dossier_id || null,
        isActive: true,
        createdAt: now,
        updatedAt: now
      }

      lists.push(newList)
      await this.saveWatchListsJSON(lists)
      return { ...newList, matchCount: 0, unreviewedCount: 0, unreviewed_count: 0 }
    },

    async updateWatchListJSON(watchListId, userId, updates) {
      const lists = await this.loadWatchListsJSON()
      let updated = null

      const nextLists = lists.map(l => {
        if (String(l.id) === String(watchListId) && l.userId === userId) {
          updated = { ...l, ...updates, updatedAt: new Date().toISOString() }
          if (updates.alertOnMatch !== undefined) {
            updated.alertOnMatch = updates.alertOnMatch !== false
            updated.alert_on_match = updated.alertOnMatch
          } else if (updates.alert_on_match !== undefined) {
            updated.alert_on_match = updates.alert_on_match !== false
            updated.alertOnMatch = updated.alert_on_match
          }
          if (updates.alertThreshold !== undefined) {
            const parsed = Number.parseFloat(updates.alertThreshold)
            updated.alertThreshold = Number.isFinite(parsed) ? parsed : (updated.alertThreshold || 0.5)
            updated.alert_threshold = updated.alertThreshold
          } else if (updates.alert_threshold !== undefined) {
            const parsed = Number.parseFloat(updates.alert_threshold)
            updated.alert_threshold = Number.isFinite(parsed) ? parsed : (updated.alert_threshold || 0.5)
            updated.alertThreshold = updated.alert_threshold
          }
          if (updates.autoAddToDossier !== undefined) {
            updated.autoAddToDossier = updates.autoAddToDossier === true
            updated.auto_add_to_dossier = updated.autoAddToDossier
          } else if (updates.auto_add_to_dossier !== undefined) {
            updated.auto_add_to_dossier = updates.auto_add_to_dossier === true
            updated.autoAddToDossier = updated.auto_add_to_dossier
          }
          if (updates.targetDossierId !== undefined) {
            updated.targetDossierId = updates.targetDossierId || null
            updated.target_dossier_id = updated.targetDossierId
          } else if (updates.target_dossier_id !== undefined) {
            updated.target_dossier_id = updates.target_dossier_id || null
            updated.targetDossierId = updated.target_dossier_id
          }
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

      const updates = await this.loadJSONData(this.updatesFile)
      const updateMap = new Map((Array.isArray(updates) ? updates : []).map(update => [String(update.id), update]))

      let filtered = matches.filter(m => {
        const matchWatchListId = m.watchListId || m.watch_list_id
        return String(matchWatchListId) === String(watchListId) &&
          (includeDismissed || !m.dismissed)
      })

      // Sort by created date descending
      filtered.sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at))

      return filtered.slice(offset, offset + limit).map(match => {
        const updateId = match.regulatoryUpdateId || match.regulatory_update_id
        const update = updateMap.get(String(updateId))
        return normalizeWatchListMatch({
          ...match,
          watch_list_id: match.watchListId,
          regulatory_update_id: updateId,
          match_score: match.matchScore,
          match_reasons: match.matchReasons,
          reviewed_at: match.reviewedAt,
          created_at: match.createdAt,
          headline: update?.headline,
          summary: update?.summary,
          ai_summary: update?.ai_summary,
          authority: update?.authority,
          sector: update?.sector,
          impact_level: update?.impactLevel || update?.impact_level,
          published_date: update?.publishedDate || update?.published_date || update?.fetchedDate || update?.createdAt,
          url: update?.url
        })
      })
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
        reviewed: false,
        reviewedAt: null,
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

    async markWatchListMatchReviewedJSON(matchId) {
      const matches = await this.loadWatchListMatchesJSON()
      let reviewed = null

      const nextMatches = matches.map(m => {
        if (String(m.id) === String(matchId)) {
          reviewed = { ...m, reviewed: true, reviewedAt: new Date().toISOString() }
          return reviewed
        }
        return m
      })

      if (reviewed) await this.saveWatchListMatchesJSON(nextMatches)
      return reviewed
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
