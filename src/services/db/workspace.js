const fs = require('fs').promises
const crypto = require('crypto')
const { normalizeSectorName } = require('../../utils/sectorTaxonomy')

const DEFAULT_BOOKMARK_COLLECTIONS = [
  { id: 'personal', name: 'Personal', isSystem: true },
  { id: 'professional', name: 'Professional', isSystem: true }
]

const TOPIC_AREA_RULES = [
  { topicArea: 'Consumer Duty', keywords: ['consumer duty', 'fair value', 'vulnerable customer', 'retail customer'] },
  { topicArea: 'Operational Resilience', keywords: ['operational resilience', 'resilience', 'incident', 'outage', 'cyber', 'ict', 'dora'] },
  { topicArea: 'Financial Crime / AML', keywords: ['anti-money laundering', 'money laundering', 'aml', 'terrorist financing', 'financial crime', 'fincrime'] },
  { topicArea: 'Sanctions', keywords: ['sanctions', 'ofsi', 'financial sanctions', 'ukraine', 'russia', 'iran', 'north korea'] },
  { topicArea: 'Capital & Liquidity', keywords: ['basel', 'capital requirements', 'capital', 'liquidity', 'crd', 'crr', 'icaap', 'pillar', 'lcr', 'nsfr'] },
  { topicArea: 'Conduct & Market Abuse', keywords: ['market abuse', 'mar', 'insider dealing', 'conduct', 'mis-selling', 'product governance'] },
  { topicArea: 'Payments', keywords: ['payments', 'payment', 'psr', 'psd', 'open banking', 'faster payments'] },
  { topicArea: 'Data Protection', keywords: ['gdpr', 'data protection', 'privacy', 'personal data'] },
  { topicArea: 'ESG / Sustainability', keywords: ['esg', 'sustainability', 'climate', 'greenwashing', 'tcfd', 'transition plan'] }
]

function normalizeTopicArea(value) {
  if (value == null) return ''
  const trimmed = String(value).trim()
  return trimmed
}

function inferTopicArea({ title = '', summary = '', authority = '', sectors = [] } = {}) {
  const haystack = [
    title,
    summary,
    authority,
    ...(Array.isArray(sectors) ? sectors : [])
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (!haystack) return null

  for (const rule of TOPIC_AREA_RULES) {
    if (!rule || !rule.topicArea || !Array.isArray(rule.keywords)) continue
    if (rule.keywords.some(keyword => keyword && haystack.includes(String(keyword).toLowerCase()))) {
      return rule.topicArea
    }
  }

  return null
}

function ensurePinnedItemTopicArea(item) {
  if (!item || typeof item !== 'object') return item
  const metadata = item.metadata && typeof item.metadata === 'object' ? { ...item.metadata } : {}
  const existing = normalizeTopicArea(metadata.topicArea || metadata.topic_area || metadata.topic)
  if (existing) {
    metadata.topicArea = existing
  } else {
    const inferred = inferTopicArea({
      title: item.update_title || '',
      summary: metadata.summary || '',
      authority: item.update_authority || '',
      sectors: Array.isArray(item.sectors) ? item.sectors : metadata.sectors
    })
    if (inferred) {
      metadata.topicArea = inferred
    }
  }
  delete metadata.topic_area
  delete metadata.topic
  return { ...item, metadata }
}

function ensureBookmarkCollections(rawCollections) {
  const collections = Array.isArray(rawCollections) ? rawCollections : []
  const byId = new Map()

  for (const entry of collections) {
    if (!entry || typeof entry !== 'object') continue
    const id = entry.id != null ? String(entry.id).trim() : ''
    const name = entry.name != null ? String(entry.name).trim() : ''
    if (!id || !name) continue
    byId.set(id, {
      id,
      name,
      isSystem: entry.isSystem === true || entry.is_system === true
    })
  }

  for (const fallback of DEFAULT_BOOKMARK_COLLECTIONS) {
    if (!byId.has(fallback.id)) {
      byId.set(fallback.id, { ...fallback })
    }
  }

  const ordered = []
  for (const fallback of DEFAULT_BOOKMARK_COLLECTIONS) {
    const value = byId.get(fallback.id)
    if (value) ordered.push(value)
  }

  for (const [id, value] of byId.entries()) {
    if (DEFAULT_BOOKMARK_COLLECTIONS.some(item => item.id === id)) continue
    ordered.push(value)
  }

  return ordered
}

function getDefaultBookmarkCollectionId(collections) {
  const normalized = ensureBookmarkCollections(collections)
  const personal = normalized.find(collection => collection.id === 'personal')
  return personal ? personal.id : (normalized[0]?.id || 'personal')
}

function createBookmarkCollectionId() {
  if (crypto.randomUUID) return crypto.randomUUID()
  return `collection-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const createDefaultWorkspaceState = () => ({
  savedSearches: [],
  customAlerts: [],
  pinnedItems: [],
  firmProfile: null,
  bookmarkCollections: ensureBookmarkCollections()
})

const parseWorkspaceState = raw => {
  if (!raw || !raw.trim()) {
    return createDefaultWorkspaceState()
  }

  try {
    const data = JSON.parse(raw)
    return {
      savedSearches: Array.isArray(data.savedSearches) ? data.savedSearches : [],
      customAlerts: Array.isArray(data.customAlerts) ? data.customAlerts : [],
      pinnedItems: Array.isArray(data.pinnedItems) ? data.pinnedItems : [],
      firmProfile: data.firmProfile || null,
      bookmarkCollections: ensureBookmarkCollections(data.bookmarkCollections || data.bookmark_collections)
    }
  } catch (error) {
    console.warn('[workspace] Invalid JSON cache, resetting workspace data:', error.message)
    return createDefaultWorkspaceState()
  }
}

module.exports = function applyWorkspaceMethods(EnhancedDBService) {
  Object.assign(EnhancedDBService.prototype, {
    async loadWorkspaceState() {
      try {
        const raw = await fs.readFile(this.workspaceFile, 'utf8')
        return parseWorkspaceState(raw)
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.warn('[workspace] Failed to read workspace cache:', error.message)
        }
        const fallback = createDefaultWorkspaceState()
        await fs.writeFile(this.workspaceFile, JSON.stringify(fallback, null, 2))
        return fallback
      }
    },

    async saveWorkspaceState(state) {
      const merged = {
        ...createDefaultWorkspaceState(),
        ...state,
        savedSearches: Array.isArray(state?.savedSearches) ? state.savedSearches : [],
        customAlerts: Array.isArray(state?.customAlerts) ? state.customAlerts : [],
        pinnedItems: Array.isArray(state?.pinnedItems) ? state.pinnedItems : [],
        firmProfile: state?.firmProfile || null,
        bookmarkCollections: ensureBookmarkCollections(state?.bookmarkCollections || state?.bookmark_collections)
      }

      await fs.writeFile(this.workspaceFile, JSON.stringify(merged, null, 2))
      return merged
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

    async setPinnedItemCollection(updateUrl, collectionId) {
      await this.initializeDatabase()
      const url = updateUrl != null ? String(updateUrl) : ''
      if (!url) throw new Error('Update URL is required')

      const collections = await this.getBookmarkCollections()
      const target = collections.find(collection => String(collection.id) === String(collectionId))
      if (!target) throw new Error('Bookmark collection not found')

      const normalizedCollectionId = target.id

      let postgresUpdated = false
      if (!this.fallbackMode) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(
            `UPDATE pinned_items
             SET metadata = COALESCE(metadata::jsonb, '{}'::jsonb) || jsonb_build_object('collectionId', $2)
             WHERE update_url = $1`,
            [url, normalizedCollectionId]
          )
          postgresUpdated = result.rowCount > 0
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
            if (!itemUrl || String(itemUrl) !== url) return item
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

    async setPinnedItemTopicArea(updateUrl, topicArea) {
      await this.initializeDatabase()
      const url = updateUrl != null ? String(updateUrl) : ''
      if (!url) throw new Error('Update URL is required')

      const normalizedTopicArea = normalizeTopicArea(topicArea)

      let postgresUpdated = false
      if (!this.fallbackMode) {
        const client = await this.pool.connect()
        try {
          const query = normalizedTopicArea
            ? `UPDATE pinned_items
               SET metadata = COALESCE(metadata::jsonb, '{}'::jsonb) || jsonb_build_object('topicArea', $2)
               WHERE update_url = $1`
            : `UPDATE pinned_items
               SET metadata = COALESCE(metadata::jsonb, '{}'::jsonb) - 'topicArea'
               WHERE update_url = $1`
          const params = normalizedTopicArea ? [url, normalizedTopicArea] : [url]
          const result = await client.query(query, params)
          postgresUpdated = result.rowCount > 0
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
            if (!itemUrl || String(itemUrl) !== url) return item
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
    },

    async getSavedSearchesJSON() {
      const workspace = await this.loadWorkspaceState()
      return workspace.savedSearches
    },

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
    },

    async getSavedSearchJSON(searchId) {
      const workspace = await this.loadWorkspaceState()
      return workspace.savedSearches.find(search => String(search.id) === String(searchId)) || null
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
    },

    async deleteSavedSearchJSON(searchId) {
      const workspace = await this.loadWorkspaceState()
      const initialLength = workspace.savedSearches.length
      workspace.savedSearches = workspace.savedSearches.filter(search => String(search.id) !== String(searchId))
      await this.saveWorkspaceState(workspace)
      return workspace.savedSearches.length < initialLength
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
    },

    async createCustomAlertJSON(customAlert) {
      try {
        const workspace = await this.loadWorkspaceState()
        workspace.customAlerts.push(customAlert)
        await this.saveWorkspaceState(workspace)
        console.log(`🚨 Created custom alert in JSON: ${customAlert.alertName}`)
        return customAlert
      } catch (error) {
        throw new Error(`Failed to create custom alert: ${error.message}`)
      }
    },

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
    },

    async getCustomAlertsJSON() {
      try {
        const workspace = await this.loadWorkspaceState()
        return workspace.customAlerts
      } catch (error) {
        return []
      }
    },

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
    },

    async updateAlertStatusJSON(alertId, isActive) {
      try {
        const workspace = await this.loadWorkspaceState()
        const alert = workspace.customAlerts.find(item => String(item.id) === String(alertId))
        if (alert) {
          alert.isActive = isActive
          await this.saveWorkspaceState(workspace)
          return true
        }
        return false
      } catch (error) {
        return false
      }
    },

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
    },

    async deleteCustomAlertJSON(alertId) {
      try {
        const workspace = await this.loadWorkspaceState()
        const initialLength = workspace.customAlerts.length
        workspace.customAlerts = workspace.customAlerts.filter(alert => String(alert.id) !== String(alertId))
        await this.saveWorkspaceState(workspace)
        return workspace.customAlerts.length < initialLength
      } catch (error) {
        return false
      }
    },

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
            .map(row => this.normalizePinnedItemRecord(row))
            .filter(Boolean)
            .map(ensurePinnedItemTopicArea)
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
      try {
        const workspace = await this.loadWorkspaceState()
        const items = workspace.pinnedItems
        return items
          .map(item => this.normalizePinnedItemRecord(item))
          .filter(Boolean)
          .map(ensurePinnedItemTopicArea)
      } catch (error) {
        return []
      }
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
                `DELETE FROM pinned_items
                 WHERE metadata->>'updateId' = $1`,
                [String(updateId)]
              )
            } catch (cleanupError) {
              // Ignore metadata cleanup if legacy schema is in use
            }
          }

          try {
            const result = await client.query(`
                      INSERT INTO pinned_items (update_url, update_title, update_authority, notes, pinned_date, metadata, sectors)
                      VALUES ($1, $2, $3, $4, $5, $6, $7)
                      RETURNING id, metadata, sectors
                  `, [url, title, authority || '', notes, pinnedItem.pinned_date, metadata, sectors])
            const row = result.rows[0]
            pinnedItem.id = row.id
            pinnedItem.metadata = row.metadata || metadata
            pinnedItem.sectors = Array.isArray(row.sectors)
              ? row.sectors.map(normalizeSectorName).filter(Boolean)
              : sectors
            return this.normalizePinnedItemRecord(pinnedItem)
          } catch (insertError) {
            console.warn('Pinned items metadata insert failed, falling back to legacy schema:', insertError.message)
            const legacyResult = await client.query(`
                          INSERT INTO pinned_items (update_url, update_title, notes, pinned_date)
                          VALUES ($1, $2, $3, $4) RETURNING id
                      `, [url, title, notes, pinnedItem.pinned_date])
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
            'DELETE FROM pinned_items WHERE update_url = $1',
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
    },

    async updatePinnedItemNotesJSON(updateUrl, notes) {
      try {
        const workspace = await this.loadWorkspaceState()
        const pinnedItem = workspace.pinnedItems.find(item => item.updateUrl === updateUrl)
        if (pinnedItem) {
          pinnedItem.notes = notes
          pinnedItem.updatedDate = new Date().toISOString()
          await this.saveWorkspaceState(workspace)
          return true
        }
        return false
      } catch (error) {
        return false
      }
    },

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
    },

    async getFirmProfileJSON() {
      try {
        const workspace = await this.loadWorkspaceState()
        return workspace.firmProfile
      } catch (error) {
        return null
      }
    },

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
    },

    async clearFirmProfileJSON() {
      try {
        const workspace = await this.loadWorkspaceState()
        workspace.firmProfile = null
        await this.saveWorkspaceState(workspace)
        console.log('✅ Firm profile cleared from JSON')
      } catch (error) {
        console.error('Error clearing firm profile from JSON:', error)
        throw error
      }
    },

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
    },

    async saveFirmProfileJSON(profileData) {
      try {
        const workspace = await this.loadWorkspaceState()

        // Save the profile
        workspace.firmProfile = {
          firmName: profileData.firmName,
          primarySectors: profileData.primarySectors || [],
          firmSize: profileData.firmSize || 'Medium',
          isActive: true,
          createdDate: new Date().toISOString()
        }

        await this.saveWorkspaceState(workspace)
        console.log('✅ Firm profile saved to JSON')
        return workspace.firmProfile
      } catch (error) {
        console.error('Error saving firm profile to JSON:', error)
        throw error
      }
    }
  })
}
