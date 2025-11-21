const dbService = require('../../services/dbService')
const relevanceService = require('../../services/relevanceService')
const {
  prepareAvailableSectors,
  getSectorAliasMap,
  normalizeSectorName
} = require('../../utils/sectorTaxonomy')

function registerWorkspaceRoutes(router) {
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
      updateId
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
        authority: authority || (metadata && metadata.authority) || ''
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

  router.delete('/workspace/pin/:url', async (req, res) => {
  try {
    const url = decodeURIComponent(req.params.url)
    console.log('Pin API: Unpinning update', url)

    const success = await dbService.removePinnedItem(url)

    if (success) {
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

  router.put('/workspace/pin/:url/notes', async (req, res) => {
  try {
    const url = decodeURIComponent(req.params.url)
    const { notes } = req.body

    console.log('Note API: Updating pinned item notes', url)

    const success = await dbService.updatePinnedItemNotes(url, notes)

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
}

module.exports = registerWorkspaceRoutes
