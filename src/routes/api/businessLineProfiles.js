const express = require('express')
const businessLineProfileService = require('../../services/businessLineProfileService')

function resolveUserId(req) {
  const headerUser = req.headers['x-user-id']
  if (headerUser && typeof headerUser === 'string' && headerUser.trim()) {
    return headerUser.trim()
  }
  if (req.user && req.user.id) {
    return req.user.id
  }
  return 'default'
}

module.exports = function registerBusinessLineProfileRoutes(router) {
  const profileRouter = express.Router()

  /**
   * GET /api/business-line-profiles
   * List all business line profiles for the current user
   */
  profileRouter.get('/', async (req, res) => {
    try {
      const userId = resolveUserId(req)
      const includeInactive = req.query.includeInactive === 'true'
      const profiles = await businessLineProfileService.getProfiles(userId, { includeInactive })

      res.json({
        success: true,
        profiles,
        count: profiles.length
      })
    } catch (error) {
      console.error('❌ Error fetching business line profiles:', error)
      res.status(500).json({
        success: false,
        error: 'Unable to retrieve business line profiles'
      })
    }
  })

  /**
   * GET /api/business-line-profiles/presets
   * Get available preset templates
   */
  profileRouter.get('/presets', async (req, res) => {
    try {
      const presets = businessLineProfileService.getPresetTemplates()
      res.json({
        success: true,
        presets
      })
    } catch (error) {
      console.error('❌ Error fetching presets:', error)
      res.status(500).json({
        success: false,
        error: 'Unable to retrieve preset templates'
      })
    }
  })

  /**
   * GET /api/business-line-profiles/default
   * Get the default business line profile for the current user
   */
  profileRouter.get('/default', async (req, res) => {
    try {
      const userId = resolveUserId(req)
      const profile = await businessLineProfileService.getDefaultProfile(userId)

      res.json({
        success: true,
        profile
      })
    } catch (error) {
      console.error('❌ Error fetching default profile:', error)
      res.status(500).json({
        success: false,
        error: 'Unable to retrieve default profile'
      })
    }
  })

  /**
   * GET /api/business-line-profiles/:id
   * Get a single business line profile by ID
   */
  profileRouter.get('/:id', async (req, res) => {
    try {
      const userId = resolveUserId(req)
      const profile = await businessLineProfileService.getProfileById(req.params.id, userId)

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: 'Profile not found'
        })
      }

      res.json({
        success: true,
        profile
      })
    } catch (error) {
      console.error('❌ Error fetching business line profile:', error)
      res.status(500).json({
        success: false,
        error: 'Unable to retrieve business line profile'
      })
    }
  })

  /**
   * POST /api/business-line-profiles
   * Create a new business line profile
   */
  profileRouter.post('/', async (req, res) => {
    try {
      const userId = resolveUserId(req)
      const profileData = req.body || {}

      if (!profileData.name || !profileData.name.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Profile name is required'
        })
      }

      const profile = await businessLineProfileService.createProfile(userId, profileData)

      res.status(201).json({
        success: true,
        profile
      })
    } catch (error) {
      console.error('❌ Error creating business line profile:', error)
      res.status(400).json({
        success: false,
        error: error.message || 'Unable to create business line profile'
      })
    }
  })

  /**
   * POST /api/business-line-profiles/from-preset
   * Create a profile from a preset template
   */
  profileRouter.post('/from-preset', async (req, res) => {
    try {
      const userId = resolveUserId(req)
      const { presetName, overrides } = req.body || {}

      if (!presetName) {
        return res.status(400).json({
          success: false,
          error: 'Preset name is required'
        })
      }

      const profile = await businessLineProfileService.createFromPreset(
        presetName,
        userId,
        overrides || {}
      )

      res.status(201).json({
        success: true,
        profile
      })
    } catch (error) {
      console.error('❌ Error creating profile from preset:', error)
      res.status(400).json({
        success: false,
        error: error.message || 'Unable to create profile from preset'
      })
    }
  })

  /**
   * PUT /api/business-line-profiles/:id
   * Update an existing business line profile
   */
  profileRouter.put('/:id', async (req, res) => {
    try {
      const userId = resolveUserId(req)
      const updates = req.body || {}

      const profile = await businessLineProfileService.updateProfile(
        req.params.id,
        userId,
        updates
      )

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: 'Profile not found'
        })
      }

      res.json({
        success: true,
        profile
      })
    } catch (error) {
      console.error('❌ Error updating business line profile:', error)
      res.status(400).json({
        success: false,
        error: error.message || 'Unable to update business line profile'
      })
    }
  })

  /**
   * POST /api/business-line-profiles/:id/set-default
   * Set a profile as the default
   */
  profileRouter.post('/:id/set-default', async (req, res) => {
    try {
      const userId = resolveUserId(req)
      const profile = await businessLineProfileService.setDefaultProfile(
        req.params.id,
        userId
      )

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: 'Profile not found'
        })
      }

      res.json({
        success: true,
        profile
      })
    } catch (error) {
      console.error('❌ Error setting default profile:', error)
      res.status(400).json({
        success: false,
        error: error.message || 'Unable to set default profile'
      })
    }
  })

  /**
   * DELETE /api/business-line-profiles/:id
   * Delete (soft delete) a business line profile
   */
  profileRouter.delete('/:id', async (req, res) => {
    try {
      const userId = resolveUserId(req)
      const result = await businessLineProfileService.deleteProfile(req.params.id, userId)

      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'Profile not found or already deleted'
        })
      }

      res.json({
        success: true,
        message: 'Profile deleted successfully'
      })
    } catch (error) {
      console.error('❌ Error deleting business line profile:', error)
      res.status(400).json({
        success: false,
        error: error.message || 'Unable to delete business line profile'
      })
    }
  })

  /**
   * GET /api/business-line-profiles/:id/updates
   * Get filtered regulatory updates for a specific profile
   */
  profileRouter.get('/:id/updates', async (req, res) => {
    try {
      const userId = resolveUserId(req)
      const additionalFilters = {
        limit: parseInt(req.query.limit, 10) || 50,
        range: req.query.range,
        search: req.query.search,
        impact: req.query.impact
      }

      const updates = await businessLineProfileService.getFilteredUpdates(
        req.params.id,
        userId,
        additionalFilters
      )

      res.json({
        success: true,
        updates,
        count: updates.length,
        profileId: req.params.id
      })
    } catch (error) {
      console.error('❌ Error fetching filtered updates:', error)
      res.status(400).json({
        success: false,
        error: error.message || 'Unable to fetch filtered updates'
      })
    }
  })

  router.use('/business-line-profiles', profileRouter)
}
