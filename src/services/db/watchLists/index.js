const path = require('path')
const {
  ALTER_WATCH_LISTS_TABLE,
  ALTER_WATCH_LIST_MATCHES_TABLE,
  CREATE_WATCH_LISTS_INDEX,
  CREATE_WATCH_LISTS_TABLE,
  CREATE_WATCH_LIST_MATCHES_INDEX,
  CREATE_WATCH_LIST_MATCHES_TABLE,
  CREATE_WATCH_LIST_MATCHES_UPDATE_INDEX,
  DELETE_WATCH_LIST_MATCH_QUERY,
  DELETE_WATCH_LIST_QUERY,
  DISMISS_WATCH_LIST_MATCH_QUERY,
  GET_ALL_ACTIVE_WATCH_LISTS_QUERY,
  GET_MATCH_COUNT_QUERY,
  GET_WATCH_LIST_BY_ID_QUERY,
  GET_WATCH_LISTS_QUERY,
  INSERT_WATCH_LIST_QUERY,
  MARK_WATCH_LIST_MATCH_REVIEWED_QUERY,
  buildCreateWatchListMatchQuery,
  buildWatchListMatchesQuery,
  buildWatchListUpdateQuery
} = require('./queries')
const {
  normalizeWatchList,
  normalizeWatchListMatch
} = require('./mappers')
const {
  calculateMatchScore
} = require('./validators')
const json = require('./json')

module.exports = function applyWatchListsMethods(EnhancedDBService) {
  Object.assign(EnhancedDBService.prototype, {
    watchListsFile: path.join(__dirname, '../../../data/watch_lists.json'),
    watchListMatchesFile: path.join(__dirname, '../../../data/watch_list_matches.json'),

    async ensureWatchListsTables() {
      if (!this.usePostgres) return

      const client = await this.pool.connect()
      try {
        // Watch Lists table
        await client.query(CREATE_WATCH_LISTS_TABLE)

        // Add config columns if they don't exist (for existing databases)
        await client.query(ALTER_WATCH_LISTS_TABLE)

        await client.query(CREATE_WATCH_LISTS_INDEX)

        // Watch List Matches table
        await client.query(CREATE_WATCH_LIST_MATCHES_TABLE)

        // Add review columns if they don't exist (for existing databases)
        await client.query(ALTER_WATCH_LIST_MATCHES_TABLE)

        await client.query(CREATE_WATCH_LIST_MATCHES_INDEX)

        await client.query(CREATE_WATCH_LIST_MATCHES_UPDATE_INDEX)

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
          const result = await client.query(GET_WATCH_LISTS_QUERY, [userKey])
          return result.rows.map(normalizeWatchList)
        } catch (error) {
          console.warn('📊 Falling back to JSON for getWatchLists:', error.message)
          return json.getWatchListsJSON(this, userKey)
        } finally {
          client.release()
        }
      }

      return json.getWatchListsJSON(this, userKey)
    },

    async getWatchListById(watchListId, userId = 'default') {
      await this.initialize()
      const userKey = String(userId || 'default')

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(GET_WATCH_LIST_BY_ID_QUERY, [watchListId, userKey])
          return result.rows.length ? normalizeWatchList(result.rows[0]) : null
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return json.getWatchListByIdJSON(this, watchListId, userKey)
        } finally {
          client.release()
        }
      }

      return json.getWatchListByIdJSON(this, watchListId, userKey)
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
          const result = await client.query(INSERT_WATCH_LIST_QUERY, [
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
          return json.createWatchListJSON(this, userKey, data)
        } finally {
          client.release()
        }
      }

      return json.createWatchListJSON(this, userKey, data)
    },

    async updateWatchList(watchListId, userId = 'default', updates = {}) {
      await this.initialize()
      const userKey = String(userId || 'default')

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const { text, values, hasUpdates } = buildWatchListUpdateQuery(watchListId, userKey, updates)

          if (!hasUpdates) {
            return this.getWatchListById(watchListId, userId)
          }

          const result = await client.query(text, values)

          return result.rows.length ? normalizeWatchList(result.rows[0]) : null
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return json.updateWatchListJSON(this, watchListId, userKey, updates)
        } finally {
          client.release()
        }
      }

      return json.updateWatchListJSON(this, watchListId, userKey, updates)
    },

    async deleteWatchList(watchListId, userId = 'default') {
      await this.initialize()
      const userKey = String(userId || 'default')

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(DELETE_WATCH_LIST_QUERY, [watchListId, userKey])
          return result.rows.length > 0
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return json.deleteWatchListJSON(this, watchListId, userKey)
        } finally {
          client.release()
        }
      }

      return json.deleteWatchListJSON(this, watchListId, userKey)
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
          const { text, values } = buildWatchListMatchesQuery(
            watchListId,
            includeDismissed,
            limit,
            offset
          )

          const result = await client.query(text, values)
          return result.rows.map(normalizeWatchListMatch)
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return json.getWatchListMatchesJSON(this, watchListId, options)
        } finally {
          client.release()
        }
      }

      return json.getWatchListMatchesJSON(this, watchListId, options)
    },

    async createWatchListMatch(watchListId, updateId, matchData = {}) {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const { text, values } = buildCreateWatchListMatchQuery(watchListId, updateId, matchData)
          const result = await client.query(text, values)
          return normalizeWatchListMatch(result.rows[0])
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return json.createWatchListMatchJSON(this, watchListId, updateId, matchData)
        } finally {
          client.release()
        }
      }

      return json.createWatchListMatchJSON(this, watchListId, updateId, matchData)
    },

    async markWatchListMatchReviewed(matchId) {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(MARK_WATCH_LIST_MATCH_REVIEWED_QUERY, [matchId])
          return result.rows.length > 0 ? normalizeWatchListMatch(result.rows[0]) : null
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return json.markWatchListMatchReviewedJSON(this, matchId)
        } finally {
          client.release()
        }
      }

      return json.markWatchListMatchReviewedJSON(this, matchId)
    },

    async dismissWatchListMatch(matchId) {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(DISMISS_WATCH_LIST_MATCH_QUERY, [matchId])
          return result.rows.length > 0
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return json.dismissWatchListMatchJSON(this, matchId)
        } finally {
          client.release()
        }
      }

      return json.dismissWatchListMatchJSON(this, matchId)
    },

    async deleteWatchListMatch(matchId) {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(DELETE_WATCH_LIST_MATCH_QUERY, [matchId])
          return result.rows.length > 0 ? normalizeWatchListMatch(result.rows[0]) : null
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return json.deleteWatchListMatchJSON(this, matchId)
        } finally {
          client.release()
        }
      }

      return json.deleteWatchListMatchJSON(this, matchId)
    },

    async getMatchCountForWatchList(watchListId) {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(GET_MATCH_COUNT_QUERY, [watchListId])
          return parseInt(result.rows[0].count) || 0
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return json.getMatchCountForWatchListJSON(this, watchListId)
        } finally {
          client.release()
        }
      }

      return json.getMatchCountForWatchListJSON(this, watchListId)
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

          const shouldAutoAdd = (watchList.autoAddToDossier === true || watchList.auto_add_to_dossier === true) &&
            (watchList.targetDossierId || watchList.target_dossier_id)
          if (shouldAutoAdd && typeof this.addItemToDossier === 'function') {
            try {
              await this.addItemToDossier(
                watchList.targetDossierId || watchList.target_dossier_id,
                updateId,
                { userNotes: `Auto-added from watch list "${watchList.name}" (${Math.round(matchResult.score * 100)}% match)` }
              )
            } catch (error) {
              console.warn('[WatchLists] Auto-add to dossier failed:', error.message)
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
          const result = await client.query(GET_ALL_ACTIVE_WATCH_LISTS_QUERY)
          return result.rows.map(normalizeWatchList)
        } catch (error) {
          console.warn('📊 Falling back to JSON:', error.message)
          return json.getAllActiveWatchListsJSON(this)
        } finally {
          client.release()
        }
      }

      return json.getAllActiveWatchListsJSON(this)
    },

    calculateMatchScore(watchList, update) {
      return calculateMatchScore(watchList, update)
    },

    // ===========================================
    // JSON FALLBACK HELPERS
    // ===========================================
    async loadWatchListsJSON() {
      return json.loadWatchListsJSON(this)
    },

    async saveWatchListsJSON(data) {
      await json.saveWatchListsJSON(this, data)
    },

    async loadWatchListMatchesJSON() {
      return json.loadWatchListMatchesJSON(this)
    },

    async saveWatchListMatchesJSON(data) {
      await json.saveWatchListMatchesJSON(this, data)
    },

    async ensureWatchListsJSONFiles() {
      await json.ensureWatchListsJSONFiles(this)
    },

    async getWatchListsJSON(userId) {
      return json.getWatchListsJSON(this, userId)
    },

    async getWatchListByIdJSON(watchListId, userId) {
      return json.getWatchListByIdJSON(this, watchListId, userId)
    },

    async createWatchListJSON(userId, data) {
      return json.createWatchListJSON(this, userId, data)
    },

    async updateWatchListJSON(watchListId, userId, updates) {
      return json.updateWatchListJSON(this, watchListId, userId, updates)
    },

    async deleteWatchListJSON(watchListId, userId) {
      return json.deleteWatchListJSON(this, watchListId, userId)
    },

    async getWatchListMatchesJSON(watchListId, options = {}) {
      return json.getWatchListMatchesJSON(this, watchListId, options)
    },

    async createWatchListMatchJSON(watchListId, updateId, matchData) {
      return json.createWatchListMatchJSON(this, watchListId, updateId, matchData)
    },

    async markWatchListMatchReviewedJSON(matchId) {
      return json.markWatchListMatchReviewedJSON(this, matchId)
    },

    async dismissWatchListMatchJSON(matchId) {
      return json.dismissWatchListMatchJSON(this, matchId)
    },

    async deleteWatchListMatchJSON(matchId) {
      return json.deleteWatchListMatchJSON(this, matchId)
    },

    async getMatchCountForWatchListJSON(watchListId) {
      return json.getMatchCountForWatchListJSON(this, watchListId)
    },

    async getAllActiveWatchListsJSON() {
      return json.getAllActiveWatchListsJSON(this)
    }
  })
}
