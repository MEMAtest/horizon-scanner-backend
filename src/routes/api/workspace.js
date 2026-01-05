const dbService = require('../../services/dbService')
const relevanceService = require('../../services/relevanceService')
const {
  prepareAvailableSectors,
  getSectorAliasMap,
  normalizeSectorName
} = require('../../utils/sectorTaxonomy')

function registerWorkspaceRoutes(router) {
  function resolveUserId(req) {
    const headerUser = req.headers['x-user-id']
    if (headerUser && typeof headerUser === 'string' && headerUser.trim()) {
      return headerUser.trim()
    }
    return 'default'
  }

  function safeDecode(value) {
    if (value == null) return ''
    const raw = String(value)
    try {
      return decodeURIComponent(raw)
    } catch (error) {
      return raw
    }
  }

  function normalizeUrlKey(value) {
    if (!value) return ''
    const raw = String(value).trim()
    if (!raw) return ''
    try {
      const parsed = new URL(raw)
      const host = parsed.host.toLowerCase()
      let path = parsed.pathname.replace(/\/+$/, '')
      if (!path) path = '/'
      return `${host}${path}${parsed.search}`
    } catch (error) {
      return raw.replace(/\/+$/, '')
    }
  }

  function extractPinnedItemIdentifiers(item) {
    if (!item || typeof item !== 'object') {
      return { url: '', updateId: '', itemId: '' }
    }
    const metadata = item.metadata && typeof item.metadata === 'object' ? item.metadata : {}
    return {
      url: item.update_url || item.updateUrl || item.url || metadata.url || metadata.sourceUrl || '',
      updateId: metadata.updateId || metadata.update_id || item.update_id || item.updateId || '',
      itemId: item.id || item.item_id || item.pinned_id || item.pinnedId || ''
    }
  }

  async function findPinnedItemByUrl(targetUrl) {
    const targetKey = normalizeUrlKey(targetUrl)
    if (!targetKey) return null
    try {
      const items = await dbService.getPinnedItems()
      if (!Array.isArray(items)) return null
      return items.find(item => {
        const { url } = extractPinnedItemIdentifiers(item)
        return url && normalizeUrlKey(url) === targetKey
      }) || null
    } catch (error) {
      console.warn('[workspace] Failed to resolve pinned item by URL:', error.message)
      return null
    }
  }

  async function notifyBookmarkSaved(req, pinnedItem, fallbackTitle) {
    try {
      if (!pinnedItem || typeof pinnedItem !== 'object') return
      if (typeof dbService.createNotification !== 'function') return

      const userId = resolveUserId(req)
      const metadata = pinnedItem.metadata && typeof pinnedItem.metadata === 'object' ? pinnedItem.metadata : {}
      const collectionId = metadata.collectionId || metadata.collection_id || 'personal'
      let collectionName = 'Personal'
      try {
        const collections = await dbService.getBookmarkCollections()
        const match = Array.isArray(collections)
          ? collections.find(c => c && String(c.id) === String(collectionId))
          : null
        if (match && match.name) collectionName = match.name
      } catch {
        // ignore
      }

      const title = pinnedItem.update_title || pinnedItem.updateTitle || pinnedItem.title || fallbackTitle || 'Update'
      const updateId = metadata.updateId || metadata.update_id || pinnedItem.update_id || pinnedItem.updateId || null
      const referenceId = (pinnedItem.update_url || pinnedItem.updateUrl || pinnedItem.url || '')
        ? String(pinnedItem.update_url || pinnedItem.updateUrl || pinnedItem.url || '').trim()
        : (updateId != null && String(updateId).trim() ? String(updateId).trim() : '')

      await dbService.createNotification(userId, {
        type: 'bookmark_saved',
        title: '★ Saved to Profile Hub',
        message: `"${title}" saved in ${collectionName}.`,
        priority: 'low',
        actionUrl: '/profile-hub',
        actionLabel: 'Open Profile Hub',
        referenceType: 'bookmark',
        referenceId: referenceId || null,
        metadata: {
          collectionId,
          collectionName,
          updateId: updateId != null ? String(updateId) : null,
          url: pinnedItem.update_url || pinnedItem.updateUrl || pinnedItem.url || null,
          title
        }
      })
    } catch (error) {
      console.warn('[workspace] Failed to create bookmark notification:', error.message)
    }
  }

  router.get('/firm-profile', async (req, res) => {
  try {
    console.log('Firm API: Getting firm profile')

    const profile = await dbService.getFirmProfile()

    // Handle both camelCase (JSON) and snake_case (PostgreSQL) field names
    const rawSectors = profile
      ? (profile.primarySectors || profile.primary_sectors)
      : null

    // Parse sectors if stored as JSON string
    let parsedSectors = []
    if (rawSectors) {
      if (typeof rawSectors === 'string') {
        try {
          parsedSectors = JSON.parse(rawSectors)
        } catch {
          parsedSectors = []
        }
      } else if (Array.isArray(rawSectors)) {
        parsedSectors = rawSectors
      }
    }

    const normalizedProfile = profile
      ? {
          ...profile,
          primarySectors: parsedSectors.map(normalizeSectorName).filter(Boolean)
        }
      : null

    const filterOptions = await dbService.getFilterOptions()
    const availableSectors = prepareAvailableSectors(filterOptions.sectors || [])

    res.json({
      success: true,
      profile: normalizedProfile,
      hasProfile: !!normalizedProfile,
      availableSectors,
      sectorAliasMap: getSectorAliasMap(),
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('X API Error getting firm profile:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      profile: null,
      availableSectors: [],
      sectorAliasMap: getSectorAliasMap()
    })
  }
  })

  router.post('/firm-profile', async (req, res) => {
  try {
    console.log('Firm API: Saving firm profile', req.body)

    const profileData = {
      firmName: req.body.firmName || req.body.firm_name,
      primarySectors: (req.body.primarySectors || req.body.primary_sectors || [])
        .map(normalizeSectorName)
        .filter(Boolean),
      firmSize: req.body.firmSize || req.body.firm_size || 'Medium',
      isActive: true
    }

    profileData.primarySectors = Array.from(new Set(profileData.primarySectors))

    const savedProfile = await dbService.saveFirmProfile(profileData)

    relevanceService.invalidateProfileCache()

    const filterOptions = await dbService.getFilterOptions()
    const availableSectors = prepareAvailableSectors(filterOptions.sectors || [])

    res.json({
      success: true,
      message: 'Firm profile saved successfully',
      profile: {
        ...savedProfile,
        primarySectors: profileData.primarySectors
      },
      availableSectors,
      sectorAliasMap: getSectorAliasMap(),
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('X API Error saving firm profile:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
  })

  router.delete('/firm-profile', async (req, res) => {
  try {
    console.log('Firm API: Clearing firm profile')

    await dbService.clearFirmProfile()
    relevanceService.invalidateProfileCache()

    res.json({
      success: true,
      message: 'Firm profile cleared successfully',
      availableSectors: [],
      sectorAliasMap: getSectorAliasMap(),
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('X API Error clearing firm profile:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
  })

  router.get('/workspace/pinned', async (req, res) => {
  try {
    console.log('Pin API: Getting pinned items')

    const items = await dbService.getPinnedItems()

    res.json({
      success: true,
      items,
      count: items.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('X API Error getting pinned items:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      items: []
    })
  }
  })

  router.get('/workspace/bookmark-collections', async (req, res) => {
  try {
    const collections = await dbService.getBookmarkCollections()
    res.json({
      success: true,
      collections,
      count: collections.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('X API Error getting bookmark collections:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      collections: []
    })
  }
  })

  router.post('/workspace/bookmark-collections', async (req, res) => {
  try {
    const collection = await dbService.createBookmarkCollection(req.body?.name)
    res.status(201).json({
      success: true,
      message: 'Collection created successfully',
      collection,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('X API Error creating bookmark collection:', error)
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
  })

  router.put('/workspace/bookmark-collections/:id', async (req, res) => {
  try {
    const updated = await dbService.renameBookmarkCollection(req.params.id, req.body?.name)
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Collection not found'
      })
    }
    res.json({
      success: true,
      message: 'Collection updated successfully',
      collection: updated,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('X API Error updating bookmark collection:', error)
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
  })

  router.delete('/workspace/bookmark-collections/:id', async (req, res) => {
  try {
    const deleted = await dbService.deleteBookmarkCollection(req.params.id)
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Collection not found'
      })
    }
    res.json({
      success: true,
      message: 'Collection deleted successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('X API Error deleting bookmark collection:', error)
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
  })

  router.post('/workspace/pin', async (req, res) => {
  try {
    console.log('Pin API: Pinning update', req.body)

    const {
      url,
      title,
      authority,
      notes,
      sectors = [],
      personas = [],
      summary = '',
      published = '',
      metadata = {},
      updateId,
      topicArea
    } = req.body

    if (!url || !title) {
      return res.status(400).json({
        success: false,
        error: 'URL and title are required'
      })
    }

    const normalizedSectors = Array.isArray(sectors)
      ? Array.from(new Set(sectors.map(normalizeSectorName).filter(Boolean)))
      : []

    const normalizedPersonas = Array.isArray(personas)
      ? personas.filter(Boolean)
      : []

    const mergedMetadata = Object.assign(
      {},
      metadata && typeof metadata === 'object' ? metadata : {},
      {
        sectors: normalizedSectors,
        personas: normalizedPersonas,
        summary: summary || (metadata && metadata.summary) || '',
        published: published || (metadata && metadata.published) || '',
        updateId: updateId || (metadata && metadata.updateId) || null,
        authority: authority || (metadata && metadata.authority) || '',
        topicArea: topicArea || (metadata && (metadata.topicArea || metadata.topic_area || metadata.topic)) || ''
      }
    )

    const result = await dbService.addPinnedItem(url, title, notes, authority, {
      sectors: normalizedSectors,
      personas: normalizedPersonas,
      summary,
      published,
      updateId,
      metadata: mergedMetadata
    })

    await notifyBookmarkSaved(req, result, title)

    res.json({
      success: true,
      message: 'Update pinned successfully',
      item: result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('X API Error pinning update:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
  })

  // Legacy alias: some older clients POST to /api/workspace/pinned
  router.post('/workspace/pinned', async (req, res) => {
  try {
    const {
      url,
      title,
      authority,
      notes,
      sectors = [],
      personas = [],
      summary = '',
      published = '',
      metadata = {},
      updateId,
      topicArea
    } = req.body || {}

    if (!url || !title) {
      return res.status(400).json({
        success: false,
        error: 'URL and title are required'
      })
    }

    const normalizedSectors = Array.isArray(sectors)
      ? Array.from(new Set(sectors.map(normalizeSectorName).filter(Boolean)))
      : []

    const normalizedPersonas = Array.isArray(personas)
      ? personas.filter(Boolean)
      : []

    const mergedMetadata = Object.assign(
      {},
      metadata && typeof metadata === 'object' ? metadata : {},
      {
        sectors: normalizedSectors,
        personas: normalizedPersonas,
        summary: summary || (metadata && metadata.summary) || '',
        published: published || (metadata && metadata.published) || '',
        updateId: updateId || (metadata && metadata.updateId) || null,
        authority: authority || (metadata && metadata.authority) || '',
        topicArea: topicArea || (metadata && (metadata.topicArea || metadata.topic_area || metadata.topic)) || ''
      }
    )

    const result = await dbService.addPinnedItem(url, title, notes, authority, {
      sectors: normalizedSectors,
      personas: normalizedPersonas,
      summary,
      published,
      updateId,
      metadata: mergedMetadata
    })

    await notifyBookmarkSaved(req, result, title)

    res.json({
      success: true,
      message: 'Update pinned successfully',
      item: result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('X API Error pinning update (legacy route):', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
  })

  router.put('/workspace/pin/:url(*)/collection', async (req, res) => {
  try {
    const rawParam = safeDecode(req.params.url || '')
    const { collectionId } = req.body || {}
    let { updateId, pinnedItemId } = req.body || {}
    const looksLikeUrl = /^https?:\/\//i.test(rawParam)
    const url = looksLikeUrl ? rawParam : ''

    if (!updateId && !pinnedItemId && rawParam && !looksLikeUrl) {
      if (/^\d+$/.test(rawParam)) {
        pinnedItemId = rawParam
      } else {
        updateId = rawParam
      }
    }
    if (!collectionId) {
      return res.status(400).json({
        success: false,
        error: 'collectionId is required'
      })
    }

    let updated = await dbService.setPinnedItemCollection(url, collectionId, { updateId, pinnedItemId })
    if (!updated && url) {
      const match = await findPinnedItemByUrl(url)
      if (match) {
        const identifiers = extractPinnedItemIdentifiers(match)
        updated = await dbService.setPinnedItemCollection(
          identifiers.url || url,
          collectionId,
          { updateId: identifiers.updateId, pinnedItemId: identifiers.itemId }
        )
      }
    }
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Pinned item not found'
      })
    }

    res.json({
      success: true,
      message: 'Bookmark collection updated',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('X API Error updating pinned item collection:', error)
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
  })

  router.put('/workspace/pin/:url(*)/topic', async (req, res) => {
  try {
    const rawParam = safeDecode(req.params.url || '')
    const { topicArea, topic } = req.body || {}
    let { updateId, itemId, pinnedItemId } = req.body || {}
    const looksLikeUrl = /^https?:\/\//i.test(rawParam)
    const url = looksLikeUrl ? rawParam : ''

    if (!updateId && !itemId && !pinnedItemId && rawParam && !looksLikeUrl) {
      if (/^\d+$/.test(rawParam)) {
        pinnedItemId = rawParam
        itemId = rawParam
      } else {
        updateId = rawParam
      }
    }
    const requested = topicArea != null ? topicArea : topic
    let updated = await dbService.setPinnedItemTopicArea(url, requested, { updateId, itemId, pinnedItemId })
    if (!updated && url) {
      const match = await findPinnedItemByUrl(url)
      if (match) {
        const identifiers = extractPinnedItemIdentifiers(match)
        updated = await dbService.setPinnedItemTopicArea(
          identifiers.url || url,
          requested,
          { updateId: identifiers.updateId, itemId: identifiers.itemId, pinnedItemId: identifiers.itemId }
        )
      }
    }
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Pinned item not found'
      })
    }

    res.json({
      success: true,
      message: 'Bookmark topic updated',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('X API Error updating pinned item topic:', error)
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
  })

  router.delete('/workspace/pin/:url(*)', async (req, res) => {
  try {
    const url = safeDecode(req.params.url)
    console.log('Pin API: Unpinning update', url)

    let success = await dbService.removePinnedItem(url)
    if (!success && url) {
      const match = await findPinnedItemByUrl(url)
      if (match) {
        const identifiers = extractPinnedItemIdentifiers(match)
        if (identifiers.url) {
          success = await dbService.removePinnedItem(identifiers.url)
        }
      }
    }

    if (success) {
      try {
        if (typeof dbService.dismissBookmarkSavedNotifications === 'function') {
          await dbService.dismissBookmarkSavedNotifications(resolveUserId(req), { url })
        }
      } catch (error) {
        console.warn('[workspace] Failed to dismiss bookmark notifications:', error.message)
      }
      res.json({
        success: true,
        message: 'Update unpinned successfully',
        timestamp: new Date().toISOString()
      })
    } else {
      res.status(404).json({
        success: false,
        error: 'Pinned item not found'
      })
    }
  } catch (error) {
    console.error('X API Error unpinning update:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
  })

  // Legacy alias: some older clients DELETE /api/workspace/pinned/:url
  router.delete('/workspace/pinned/:url(*)', async (req, res) => {
  try {
    const url = safeDecode(req.params.url)
    let success = await dbService.removePinnedItem(url)
    if (!success && url) {
      const match = await findPinnedItemByUrl(url)
      if (match) {
        const identifiers = extractPinnedItemIdentifiers(match)
        if (identifiers.url) {
          success = await dbService.removePinnedItem(identifiers.url)
        }
      }
    }

    if (success) {
      try {
        if (typeof dbService.dismissBookmarkSavedNotifications === 'function') {
          await dbService.dismissBookmarkSavedNotifications(resolveUserId(req), { url })
        }
      } catch (error) {
        console.warn('[workspace] Failed to dismiss bookmark notifications (legacy route):', error.message)
      }
      res.json({
        success: true,
        message: 'Update unpinned successfully',
        timestamp: new Date().toISOString()
      })
    } else {
      res.status(404).json({
        success: false,
        error: 'Pinned item not found'
      })
    }
  } catch (error) {
    console.error('X API Error unpinning update (legacy route):', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
  })

  router.put('/workspace/pin/:url(*)/notes', async (req, res) => {
  try {
    const url = safeDecode(req.params.url)
    const { notes } = req.body

    console.log('Note API: Updating pinned item notes', url)

    let success = await dbService.updatePinnedItemNotes(url, notes)
    if (!success && url) {
      const match = await findPinnedItemByUrl(url)
      if (match) {
        const identifiers = extractPinnedItemIdentifiers(match)
        if (identifiers.url) {
          success = await dbService.updatePinnedItemNotes(identifiers.url, notes)
        }
      }
    }

    if (success) {
      res.json({
        success: true,
        message: 'Notes updated successfully',
        timestamp: new Date().toISOString()
      })
    } else {
      res.status(404).json({
        success: false,
        error: 'Pinned item not found'
      })
    }
  } catch (error) {
    console.error('X API Error updating notes:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
  })

  router.get('/workspace/searches', async (req, res) => {
  try {
    console.log('Search API: Getting saved searches')

    const searches = await dbService.getSavedSearches()

    res.json({
      success: true,
      searches,
      count: searches.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('X API Error getting saved searches:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      searches: []
    })
  }
  })

  router.post('/workspace/search', async (req, res) => {
  try {
    console.log('Search API: Saving search', req.body)

    const { searchName, filterParams } = req.body

    if (!searchName) {
      return res.status(400).json({
        success: false,
        error: 'Search name is required'
      })
    }

    const savedSearch = await dbService.saveSearch(searchName, filterParams || {})

    res.json({
      success: true,
      message: 'Search saved successfully',
      search: savedSearch,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('X API Error saving search:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
  })

  router.get('/workspace/search/:id', async (req, res) => {
  try {
    const searchId = req.params.id
    console.log('Search API: Getting saved search', searchId)

    const search = await dbService.getSavedSearch(searchId)

    if (search) {
      res.json({
        success: true,
        search,
        timestamp: new Date().toISOString()
      })
    } else {
      res.status(404).json({
        success: false,
        error: 'Saved search not found'
      })
    }
  } catch (error) {
    console.error('X API Error getting saved search:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
  })

  router.delete('/workspace/search/:id', async (req, res) => {
  try {
    const searchId = req.params.id
    console.log('Search API: Deleting saved search', searchId)

    const success = await dbService.deleteSavedSearch(searchId)

    if (success) {
      res.json({
        success: true,
        message: 'Search deleted successfully',
        timestamp: new Date().toISOString()
      })
    } else {
      res.status(404).json({
        success: false,
        error: 'Saved search not found'
      })
    }
  } catch (error) {
    console.error('X API Error deleting search:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
  })

  router.get('/workspace/alerts', async (req, res) => {
  try {
    console.log('Alert API: Getting custom alerts')

    const alerts = await dbService.getCustomAlerts()

    res.json({
      success: true,
      alerts,
      count: alerts.length,
      activeCount: alerts.filter(a => a.isActive).length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('X API Error getting alerts:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      alerts: []
    })
  }
  })

  router.post('/workspace/alert', async (req, res) => {
  try {
    console.log('Alert API: Creating custom alert', req.body)

    const { alertName, alertConditions } = req.body

    if (!alertName) {
      return res.status(400).json({
        success: false,
        error: 'Alert name is required'
      })
    }

    const alert = await dbService.createCustomAlert(alertName, alertConditions || {})

    res.json({
      success: true,
      message: 'Alert created successfully',
      alert,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('X API Error creating alert:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
  })

  router.put('/workspace/alert/:id', async (req, res) => {
  try {
    const alertId = req.params.id
    const { isActive } = req.body

    console.log(`Alert API: Updating alert ${alertId} status to ${isActive}`)

    const success = await dbService.updateAlertStatus(alertId, isActive)

    if (success) {
      res.json({
        success: true,
        message: `Alert ${isActive ? 'activated' : 'deactivated'} successfully`,
        timestamp: new Date().toISOString()
      })
    } else {
      res.status(404).json({
        success: false,
        error: 'Alert not found'
      })
    }
  } catch (error) {
    console.error('X API Error updating alert:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
  })

  router.delete('/workspace/alert/:id', async (req, res) => {
  try {
    const alertId = req.params.id
    console.log('Alert API: Deleting alert', alertId)

    const success = await dbService.deleteCustomAlert(alertId)

    if (success) {
      res.json({
        success: true,
        message: 'Alert deleted successfully',
        timestamp: new Date().toISOString()
      })
    } else {
      res.status(404).json({
        success: false,
        error: 'Alert not found'
      })
    }
  } catch (error) {
    console.error('X API Error deleting alert:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
  })

  router.get('/workspace/stats', async (req, res) => {
  try {
    console.log('Analytics API: Getting workspace statistics')

    const pinnedItems = await dbService.getPinnedItems()
    const savedSearches = await dbService.getSavedSearches()
    const customAlerts = await dbService.getCustomAlerts()
    const firmProfile = await dbService.getFirmProfile()

    res.json({
      success: true,
      stats: {
        pinnedItems: pinnedItems.length,
        savedSearches: savedSearches.length,
        customAlerts: customAlerts.length,
        activeAlerts: customAlerts.filter(a => a.isActive).length,
        hasFirmProfile: !!firmProfile
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('X API Error getting workspace stats:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      stats: {
        pinnedItems: 0,
        savedSearches: 0,
        customAlerts: 0,
        activeAlerts: 0,
        hasFirmProfile: false
      }
    })
  }
  })

  // Intelligence Stats - for Profile Hub dashboard widgets
  router.get('/workspace/intelligence-stats', async (req, res) => {
    try {
      const stats = await dbService.getIntelligenceStats()
      res.json({
        success: true,
        ...stats,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('X API Error getting intelligence stats:', error)
      res.status(500).json({
        success: false,
        error: error.message,
        pressureScore: 0,
        pressureTrend: '0%',
        deadlineBuckets: { thisWeek: 0, twoWeeks: 0, thirtyDays: 0, sixtyNinety: 0 },
        authorityActivity: []
      })
    }
  })
}

module.exports = registerWorkspaceRoutes
