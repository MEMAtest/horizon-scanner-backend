const { normalizeSectorName } = require('../../../utils/sectorTaxonomy')
const {
  DEFAULT_BOOKMARK_COLLECTIONS,
  createBookmarkCollectionId,
  ensureBookmarkCollections,
  getDefaultBookmarkCollectionId,
  inferTopicArea,
  normalizeTopicArea
} = require('./validators')
const { mapPinnedItems } = require('./mappers')
const json = require('./json')
const {
  CLEAR_FIRM_PROFILE_QUERY,
  CLEAR_PINNED_ITEM_TOPIC_QUERY,
  CLEAR_PINNED_ITEM_TOPIC_BY_UPDATE_ID_QUERY,
  CLEAR_PINNED_ITEM_TOPIC_BY_ID_QUERY,
  DELETE_CUSTOM_ALERT_QUERY,
  DELETE_PINNED_ITEM_BY_UPDATE_ID_QUERY,
  DELETE_PINNED_ITEM_QUERY,
  DELETE_SAVED_SEARCH_QUERY,
  GET_CUSTOM_ALERTS_QUERY,
  GET_FIRM_PROFILE_QUERY,
  GET_PINNED_ITEMS_QUERY,
  GET_SAVED_SEARCH_QUERY,
  GET_SAVED_SEARCHES_QUERY,
  INSERT_CUSTOM_ALERT_QUERY,
  INSERT_FIRM_PROFILE_QUERY,
  INSERT_PINNED_ITEM_LEGACY_QUERY,
  INSERT_PINNED_ITEM_QUERY,
  INSERT_SAVED_SEARCH_QUERY,
  UPDATE_ALERT_STATUS_QUERY,
  UPDATE_PINNED_ITEM_COLLECTION_QUERY,
  UPDATE_PINNED_ITEM_COLLECTION_BY_UPDATE_ID_QUERY,
  UPDATE_PINNED_ITEM_NOTES_QUERY,
  UPDATE_PINNED_ITEM_TOPIC_QUERY,
  UPDATE_PINNED_ITEM_TOPIC_BY_UPDATE_ID_QUERY,
  UPDATE_PINNED_ITEM_TOPIC_BY_ID_QUERY
} = require('./queries')

module.exports = function applyWorkspaceMethods(EnhancedDBService) {
  Object.assign(EnhancedDBService.prototype, {
    async ensureWorkspaceTables() {
      if (this.fallbackMode) return
      const client = await this.pool.connect()
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS pinned_items (
            id BIGSERIAL PRIMARY KEY,
            update_url TEXT NOT NULL,
            update_title TEXT,
            update_authority TEXT,
            notes TEXT,
            pinned_date TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
            metadata JSONB DEFAULT '{}'::JSONB,
            sectors TEXT[] DEFAULT ARRAY[]::TEXT[]
          )
        `)

        await client.query(`
          ALTER TABLE pinned_items
          ADD COLUMN IF NOT EXISTS update_title TEXT
        `)
        await client.query(`
          ALTER TABLE pinned_items
          ADD COLUMN IF NOT EXISTS update_authority TEXT
        `)
        await client.query(`
          ALTER TABLE pinned_items
          ADD COLUMN IF NOT EXISTS notes TEXT
        `)
        await client.query(`
          ALTER TABLE pinned_items
          ADD COLUMN IF NOT EXISTS pinned_date TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
        `)
        await client.query(`
          ALTER TABLE pinned_items
          ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::JSONB
        `)
        await client.query(`
          ALTER TABLE pinned_items
          ADD COLUMN IF NOT EXISTS sectors TEXT[] DEFAULT ARRAY[]::TEXT[]
        `)
      } finally {
        client.release()
      }
    },

    async loadWorkspaceState() {
      return json.loadWorkspaceState(this)
    },

    async saveWorkspaceState(state) {
      return json.saveWorkspaceState(this, state)
    },

    async getBookmarkCollections() {
      const workspace = await this.loadWorkspaceState()
      const normalized = ensureBookmarkCollections(workspace.bookmarkCollections)
      if (!Array.isArray(workspace.bookmarkCollections) || workspace.bookmarkCollections.length !== normalized.length) {
        workspace.bookmarkCollections = normalized
        await this.saveWorkspaceState(workspace)
      }
      return normalized
    },

    async createBookmarkCollection(name) {
      const collectionName = name != null ? String(name).trim() : ''
      if (!collectionName) {
        throw new Error('Collection name is required')
      }

      const workspace = await this.loadWorkspaceState()
      const existing = ensureBookmarkCollections(workspace.bookmarkCollections)
      const alreadyExists = existing.some(collection => collection.name.toLowerCase() === collectionName.toLowerCase())
      if (alreadyExists) {
        throw new Error('A collection with this name already exists')
      }

      const collection = {
        id: createBookmarkCollectionId(),
        name: collectionName,
        isSystem: false
      }

      workspace.bookmarkCollections = [...existing, collection]
      await this.saveWorkspaceState(workspace)
      return collection
    },

    async renameBookmarkCollection(collectionId, name) {
      const targetId = collectionId != null ? String(collectionId).trim() : ''
      const nextName = name != null ? String(name).trim() : ''
      if (!targetId || !nextName) {
        throw new Error('Collection id and name are required')
      }
      if (DEFAULT_BOOKMARK_COLLECTIONS.some(collection => collection.id === targetId)) {
        throw new Error('Default collections cannot be renamed')
      }

      const workspace = await this.loadWorkspaceState()
      const collections = ensureBookmarkCollections(workspace.bookmarkCollections)
      const exists = collections.find(collection => collection.id === targetId)
      if (!exists) return null

      if (collections.some(collection => collection.name.toLowerCase() === nextName.toLowerCase() && collection.id !== targetId)) {
        throw new Error('A collection with this name already exists')
      }

      workspace.bookmarkCollections = collections.map(collection =>
        collection.id === targetId
          ? { ...collection, name: nextName }
          : collection
      )
      await this.saveWorkspaceState(workspace)
      return workspace.bookmarkCollections.find(collection => collection.id === targetId) || null
    },

    async deleteBookmarkCollection(collectionId) {
      const targetId = collectionId != null ? String(collectionId).trim() : ''
      if (!targetId) {
        throw new Error('Collection id is required')
      }
      if (DEFAULT_BOOKMARK_COLLECTIONS.some(collection => collection.id === targetId)) {
        throw new Error('Default collections cannot be deleted')
      }

      const workspace = await this.loadWorkspaceState()
      const collections = ensureBookmarkCollections(workspace.bookmarkCollections)
      const remaining = collections.filter(collection => collection.id !== targetId)
      if (remaining.length === collections.length) return false

      const fallbackId = getDefaultBookmarkCollectionId(remaining)

      workspace.bookmarkCollections = remaining
      workspace.pinnedItems = Array.isArray(workspace.pinnedItems)
        ? workspace.pinnedItems.map(item => {
            if (!item || typeof item !== 'object') return item
            const metadata = item.metadata && typeof item.metadata === 'object' ? { ...item.metadata } : {}
            const current = metadata.collectionId || metadata.collection_id
            if (String(current || '') !== targetId) return item
            metadata.collectionId = fallbackId
            delete metadata.collection_id
            return { ...item, metadata }
          })
        : []

      await this.saveWorkspaceState(workspace)
      return true
    },

    async setPinnedItemCollection(updateUrl, collectionId, options = {}) {
      await this.initializeDatabase()
      const url = updateUrl != null ? String(updateUrl).trim() : ''
      const updateId = options.updateId || options.update_id
      const normalizedUpdateId = updateId != null ? String(updateId).trim() : ''
      if (!url && !normalizedUpdateId) throw new Error('Update URL or id is required')

      const collections = await this.getBookmarkCollections()
      const target = collections.find(collection => String(collection.id) === String(collectionId))
      if (!target) throw new Error('Bookmark collection not found')

      const normalizedCollectionId = target.id

      let postgresUpdated = false
      if (!this.fallbackMode) {
        const client = await this.pool.connect()
        try {
          if (url) {
            const result = await client.query(
              UPDATE_PINNED_ITEM_COLLECTION_QUERY,
              [url, normalizedCollectionId]
            )
            postgresUpdated = result.rowCount > 0
          }
          if (!postgresUpdated && normalizedUpdateId) {
            const result = await client.query(
              UPDATE_PINNED_ITEM_COLLECTION_BY_UPDATE_ID_QUERY,
              [normalizedUpdateId, normalizedCollectionId]
            )
            postgresUpdated = result.rowCount > 0
          }
        } catch (error) {
          console.warn('📊 Using JSON fallback for pinned item collection update:', error.message)
        } finally {
          client.release()
        }
      }

      const workspace = await this.loadWorkspaceState()
      let updated = false

      workspace.pinnedItems = Array.isArray(workspace.pinnedItems)
        ? workspace.pinnedItems.map(item => {
            const itemUrl = item?.update_url || item?.updateUrl || item?.url
            const itemUpdateId = item?.update_id || item?.updateId || item?.metadata?.updateId || item?.metadata?.update_id
            const matchesUrl = url && itemUrl && String(itemUrl) === url
            const matchesUpdateId = normalizedUpdateId && itemUpdateId != null && String(itemUpdateId) === normalizedUpdateId
            if (!matchesUrl && !matchesUpdateId) return item
            const metadata = item.metadata && typeof item.metadata === 'object' ? { ...item.metadata } : {}
            metadata.collectionId = normalizedCollectionId
            delete metadata.collection_id
            updated = true
            return { ...item, metadata }
          })
        : []

      if (updated) {
        await this.saveWorkspaceState(workspace)
      }

      return updated || postgresUpdated
    },

    async setPinnedItemTopicArea(updateUrl, topicArea, options = {}) {
      await this.initializeDatabase()
      const url = updateUrl != null ? String(updateUrl).trim() : ''
      const updateId = options.updateId || options.update_id
      const normalizedUpdateId = updateId != null ? String(updateId).trim() : ''
      const itemId = options.itemId || options.item_id
      const normalizedItemId = itemId != null ? String(itemId).trim() : ''
      if (!url && !normalizedUpdateId && !normalizedItemId) throw new Error('Update URL, updateId, or itemId is required')

      const normalizedTopicArea = normalizeTopicArea(topicArea)

      let postgresUpdated = false
      if (!this.fallbackMode) {
        const client = await this.pool.connect()
        try {
          // Try matching by URL first
          if (url) {
            const query = normalizedTopicArea
              ? UPDATE_PINNED_ITEM_TOPIC_QUERY
              : CLEAR_PINNED_ITEM_TOPIC_QUERY
            const params = normalizedTopicArea ? [url, normalizedTopicArea] : [url]
            const result = await client.query(query, params)
            postgresUpdated = result.rowCount > 0
          }
          // Try matching by metadata updateId
          if (!postgresUpdated && normalizedUpdateId) {
            const query = normalizedTopicArea
              ? UPDATE_PINNED_ITEM_TOPIC_BY_UPDATE_ID_QUERY
              : CLEAR_PINNED_ITEM_TOPIC_BY_UPDATE_ID_QUERY
            const params = normalizedTopicArea ? [normalizedUpdateId, normalizedTopicArea] : [normalizedUpdateId]
            const result = await client.query(query, params)
            postgresUpdated = result.rowCount > 0
          }
          // Try matching by database id (most reliable fallback)
          if (!postgresUpdated && normalizedItemId) {
            const query = normalizedTopicArea
              ? UPDATE_PINNED_ITEM_TOPIC_BY_ID_QUERY
              : CLEAR_PINNED_ITEM_TOPIC_BY_ID_QUERY
            const params = normalizedTopicArea ? [normalizedItemId, normalizedTopicArea] : [normalizedItemId]
            const result = await client.query(query, params)
            postgresUpdated = result.rowCount > 0
          }
        } catch (error) {
          console.warn('📊 Using JSON fallback for pinned item topic update:', error.message)
        } finally {
          client.release()
        }
      }

      const workspace = await this.loadWorkspaceState()
      let updated = false

      workspace.pinnedItems = Array.isArray(workspace.pinnedItems)
        ? workspace.pinnedItems.map(item => {
            const itemUrl = item?.update_url || item?.updateUrl || item?.url
            const itemUpdateId = item?.update_id || item?.updateId || item?.metadata?.updateId || item?.metadata?.update_id
            const matchesUrl = url && itemUrl && String(itemUrl) === url
            const matchesUpdateId = normalizedUpdateId && itemUpdateId != null && String(itemUpdateId) === normalizedUpdateId
            if (!matchesUrl && !matchesUpdateId) return item
            const metadata = item.metadata && typeof item.metadata === 'object' ? { ...item.metadata } : {}
            if (normalizedTopicArea) {
              metadata.topicArea = normalizedTopicArea
            } else {
              delete metadata.topicArea
              delete metadata.topic_area
              delete metadata.topic
            }
            updated = true
            return { ...item, metadata }
          })
        : []

      if (updated) {
        await this.saveWorkspaceState(workspace)
      }

      return updated || postgresUpdated
    },

    async getSavedSearches() {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(GET_SAVED_SEARCHES_QUERY)
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
    },

    async getSavedSearchesJSON() {
      return json.getSavedSearchesJSON(this)
    },

    async getSavedSearch(searchId) {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(GET_SAVED_SEARCH_QUERY, [searchId])
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
    },

    async getSavedSearchJSON(searchId) {
      return json.getSavedSearchJSON(this, searchId)
    },

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
          const result = await client.query(
            INSERT_SAVED_SEARCH_QUERY,
            [searchName, JSON.stringify(filterParams), search.created_date]
          )
          search.id = result.rows[0].id
          return search
        } finally {
          client.release()
        }
      } else {
        const workspace = await this.loadWorkspaceState()
        workspace.savedSearches.push(search)
        await this.saveWorkspaceState(workspace)
        return search
      }
    },

    async deleteSavedSearch(searchId) {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(DELETE_SAVED_SEARCH_QUERY, [searchId])
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
    },

    async deleteSavedSearchJSON(searchId) {
      return json.deleteSavedSearchJSON(this, searchId)
    },

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
          const result = await client.query(
            INSERT_CUSTOM_ALERT_QUERY,
            [alertName, JSON.stringify(alertConditions), true, customAlert.createdDate]
          )
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
    },

    async createCustomAlertJSON(customAlert) {
      return json.createCustomAlertJSON(this, customAlert)
    },

    async getCustomAlerts() {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(GET_CUSTOM_ALERTS_QUERY)
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
    },

    async getCustomAlertsJSON() {
      return json.getCustomAlertsJSON(this)
    },

    async updateAlertStatus(alertId, isActive) {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(
            UPDATE_ALERT_STATUS_QUERY,
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
    },

    async updateAlertStatusJSON(alertId, isActive) {
      return json.updateAlertStatusJSON(this, alertId, isActive)
    },

    async deleteCustomAlert(alertId) {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(DELETE_CUSTOM_ALERT_QUERY, [alertId])
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
    },

    async deleteCustomAlertJSON(alertId) {
      return json.deleteCustomAlertJSON(this, alertId)
    },

    async getPinnedItems() {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(GET_PINNED_ITEMS_QUERY)
          return mapPinnedItems(this, result.rows)
        } catch (error) {
          console.log('📊 Using JSON fallback for pinned items')
          return this.getPinnedItemsJSON()
        } finally {
          client.release()
        }
      } else {
        return this.getPinnedItemsJSON()
      }
    },

    async getPinnedItemsJSON() {
      return json.getPinnedItemsJSON(this)
    },

    async addPinnedItem(url, title, notes = '', authority = '', options = {}) {
      await this.initializeDatabase() // FIX: Not this.initialize()

      const sectors = Array.isArray(options.sectors)
        ? Array.from(new Set(options.sectors.map(normalizeSectorName).filter(Boolean)))
        : []

      const personas = Array.isArray(options.personas)
        ? options.personas.filter(Boolean)
        : []

      const summary = options.summary || (options.metadata && options.metadata.summary) || ''
      const published = options.published || (options.metadata && options.metadata.published) || null
      const updateId = options.updateId || (options.metadata && options.metadata.updateId) || null

      const metadata = Object.assign(
        {},
        options.metadata || {},
        {
          sectors,
          personas,
          summary,
          published,
          updateId,
          authority: authority || options.authority || ''
        }
      )

      if (!Array.isArray(metadata.sectors) || metadata.sectors.length === 0) {
        metadata.sectors = sectors
      } else {
        metadata.sectors = Array.from(
          new Set(
            metadata.sectors
              .map(normalizeSectorName)
              .filter(Boolean)
          )
        )
      }

      const requestedCollectionId = metadata.collectionId || metadata.collection_id
      try {
        const workspace = await this.loadWorkspaceState()
        const collections = ensureBookmarkCollections(workspace.bookmarkCollections)
        const fallbackId = getDefaultBookmarkCollectionId(collections)
        const normalizedRequested = requestedCollectionId != null ? String(requestedCollectionId).trim() : ''
        metadata.collectionId = collections.some(collection => collection.id === normalizedRequested)
          ? normalizedRequested
          : fallbackId
      } catch (error) {
        metadata.collectionId = requestedCollectionId || 'personal'
      }
      delete metadata.collection_id

      const explicitTopicArea = normalizeTopicArea(
        metadata.topicArea || metadata.topic_area || metadata.topic || options.topicArea || options.topic_area
      )
      if (explicitTopicArea) {
        metadata.topicArea = explicitTopicArea
      } else {
        const inferredTopicArea = inferTopicArea({ title, summary, authority, sectors })
        if (inferredTopicArea) {
          metadata.topicArea = inferredTopicArea
        }
      }
      delete metadata.topic_area
      delete metadata.topic

      const pinnedItem = {
        id: Date.now(),
        update_url: url,
        update_title: title,
        update_authority: authority,
        notes,
        pinned_date: new Date().toISOString(),
        sectors,
        personas,
        summary,
        published,
        update_id: updateId,
        metadata
      }

      if (!this.fallbackMode) { // FIX: Not this.usePostgres
        const client = await this.pool.connect()
        try {
          if (updateId != null && updateId !== '') {
            try {
              await client.query(
                DELETE_PINNED_ITEM_BY_UPDATE_ID_QUERY,
                [String(updateId)]
              )
            } catch (cleanupError) {
              // Ignore metadata cleanup if legacy schema is in use
            }
          }

          try {
            const result = await client.query(
              INSERT_PINNED_ITEM_QUERY,
              [url, title, authority || '', notes, pinnedItem.pinned_date, metadata, sectors]
            )
            const row = result.rows[0]
            pinnedItem.id = row.id
            pinnedItem.metadata = row.metadata || metadata
            pinnedItem.sectors = Array.isArray(row.sectors)
              ? row.sectors.map(normalizeSectorName).filter(Boolean)
              : sectors
            return this.normalizePinnedItemRecord(pinnedItem)
          } catch (insertError) {
            console.warn('Pinned items metadata insert failed, falling back to legacy schema:', insertError.message)
            const legacyResult = await client.query(
              INSERT_PINNED_ITEM_LEGACY_QUERY,
              [url, title, notes, pinnedItem.pinned_date]
            )
            pinnedItem.id = legacyResult.rows[0].id
            return this.normalizePinnedItemRecord(pinnedItem)
          }
        } catch (error) {
          console.warn('📊 Using JSON fallback for pinned items insert:', error.message)
        } finally {
          client.release()
        }
      }

      // JSON fallback
      const workspace = await this.loadWorkspaceState()
      workspace.pinnedItems = Array.isArray(workspace.pinnedItems) ? workspace.pinnedItems : []
      const normalizedUpdateId = updateId != null && updateId !== '' ? String(updateId) : ''
      workspace.pinnedItems = workspace.pinnedItems.filter(item => {
        if (!item || typeof item !== 'object') return false
        const itemUrl = item.update_url || item.updateUrl || item.url
        if (itemUrl && String(itemUrl) === url) return false
        if (!normalizedUpdateId) return true
        const meta = item.metadata && typeof item.metadata === 'object' ? item.metadata : {}
        const itemUpdateId = meta.updateId || meta.update_id || item.update_id || item.updateId || null
        return !itemUpdateId || String(itemUpdateId) !== normalizedUpdateId
      })
      workspace.pinnedItems.push(pinnedItem)
      await this.saveWorkspaceState(workspace)
      return this.normalizePinnedItemRecord(pinnedItem)
    },

    async removePinnedItem(url) {
      await this.initializeDatabase() // FIX: Not this.initialize()

      if (!this.fallbackMode) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(
            DELETE_PINNED_ITEM_QUERY,
            [url]
          )
          return result.rowCount > 0
        } catch (error) {
          console.warn('📊 Using JSON fallback for pinned items delete:', error.message)
        } finally {
          client.release()
        }
      }

      // JSON fallback
      const workspace = await this.loadWorkspaceState()
      const initialLength = Array.isArray(workspace.pinnedItems) ? workspace.pinnedItems.length : 0
      workspace.pinnedItems = Array.isArray(workspace.pinnedItems)
        ? workspace.pinnedItems.filter(item => item && item.update_url !== url)
        : []
      await this.saveWorkspaceState(workspace)
      return workspace.pinnedItems.length < initialLength
    },

    async updatePinnedItemNotes(updateUrl, notes) {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(
            UPDATE_PINNED_ITEM_NOTES_QUERY,
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
    },

    async updatePinnedItemNotesJSON(updateUrl, notes) {
      return json.updatePinnedItemNotesJSON(this, updateUrl, notes)
    },

    async getFirmProfile() {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(GET_FIRM_PROFILE_QUERY)
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
    },

    async getFirmProfileJSON() {
      return json.getFirmProfileJSON(this)
    },

    async clearFirmProfile() {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          await client.query(CLEAR_FIRM_PROFILE_QUERY)
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
    },

    async clearFirmProfileJSON() {
      return json.clearFirmProfileJSON(this)
    },

    async saveFirmProfile(profileData) {
      await this.initialize()

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          // Delete existing profile first
          await client.query(CLEAR_FIRM_PROFILE_QUERY)

          // Insert new profile
          await client.query(
            INSERT_FIRM_PROFILE_QUERY,
            [
              profileData.firmName,
              JSON.stringify(profileData.primarySectors || []),
              profileData.firmSize || 'Medium'
            ]
          )

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
    },

    async saveFirmProfileJSON(profileData) {
      return json.saveFirmProfileJSON(this, profileData)
    }
  })
}
