const express = require('express')
const profileService = require('../../services/profileService')

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

module.exports = function registerProfileRoutes(router) {
  const profileRouter = express.Router()

  profileRouter.get('/', async (req, res) => {
    try {
      const userId = resolveUserId(req)
      const profile = await profileService.getActiveProfile(userId)
      res.json({
        success: true,
        profile
      })
    } catch (error) {
      console.error('❌ Error fetching profile:', error)
      res.status(500).json({
        success: false,
        error: 'Unable to retrieve profile'
      })
    }
  })

  profileRouter.post('/', async (req, res) => {
    try {
      const userId = resolveUserId(req)
      const profile = await profileService.saveProfile(userId, req.body || {})
      res.status(200).json({
        success: true,
        profile
      })
    } catch (error) {
      console.error('❌ Error saving profile:', error)
      res.status(400).json({
        success: false,
        error: error.message || 'Unable to save profile'
      })
    }
  })

  profileRouter.delete('/', async (req, res) => {
    try {
      const userId = resolveUserId(req)
      await profileService.clearProfiles(userId)
      res.json({ success: true })
    } catch (error) {
      console.error('❌ Error clearing profile:', error)
      res.status(500).json({
        success: false,
        error: 'Unable to clear profile'
      })
    }
  })

  router.use('/profile', profileRouter)
}
