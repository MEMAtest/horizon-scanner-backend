const watchListService = require('../../services/watchListService')

/**
 * Register watch list routes
 * @param {import('express').Router} router
 */
function registerWatchListRoutes(router) {
  // ==================== WATCH LISTS ====================

  // GET /api/watch-lists - Get all watch lists
  router.get('/watch-lists', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await watchListService.getWatchLists(userId, {
        includeArchived: req.query.includeArchived === 'true'
      })
      res.json(result)
    } catch (error) {
      console.error('Error getting watch lists:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // GET /api/watch-lists/stats - Get watch list statistics
  router.get('/watch-lists/stats', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await watchListService.getWatchListStats(userId)
      res.json(result)
    } catch (error) {
      console.error('Error getting watch list stats:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // GET /api/watch-lists/unreviewed-count - Get unreviewed matches count
  router.get('/watch-lists/unreviewed-count', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await watchListService.getUnreviewedMatchCount(userId)
      res.json(result)
    } catch (error) {
      console.error('Error getting unreviewed count:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // POST /api/watch-lists - Create new watch list
  router.post('/watch-lists', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await watchListService.createWatchList(userId, req.body)
      if (result.success) {
        res.status(201).json(result)
      } else {
        res.status(400).json(result)
      }
    } catch (error) {
      console.error('Error creating watch list:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // GET /api/watch-lists/:id - Get single watch list
  router.get('/watch-lists/:id', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await watchListService.getWatchListById(req.params.id, userId)
      if (result.success) {
        res.json(result)
      } else {
        res.status(404).json(result)
      }
    } catch (error) {
      console.error('Error getting watch list:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // PUT /api/watch-lists/:id - Update watch list
  router.put('/watch-lists/:id', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await watchListService.updateWatchList(req.params.id, userId, req.body)
      if (result.success) {
        res.json(result)
      } else {
        res.status(result.error === 'Watch list not found' ? 404 : 400).json(result)
      }
    } catch (error) {
      console.error('Error updating watch list:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // DELETE /api/watch-lists/:id - Delete watch list
  router.delete('/watch-lists/:id', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await watchListService.deleteWatchList(req.params.id, userId)
      if (result.success) {
        res.json(result)
      } else {
        res.status(404).json(result)
      }
    } catch (error) {
      console.error('Error deleting watch list:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // ==================== MATCHES ====================

  // GET /api/watch-lists/:id/matches - Get matches for a watch list
  router.get('/watch-lists/:id/matches', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await watchListService.getWatchListMatches(req.params.id, userId, {
        unreviewedOnly: req.query.unreviewedOnly === 'true',
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0
      })
      res.json(result)
    } catch (error) {
      console.error('Error getting matches:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // POST /api/watch-lists/:id/bulk-match - Bulk match existing updates against watch list
  router.post('/watch-lists/:id/bulk-match', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await watchListService.bulkMatchWatchList(req.params.id, userId)
      res.json(result)
    } catch (error) {
      console.error('Error bulk matching:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // POST /api/watch-lists/matches/:matchId/review - Mark match as reviewed
  router.post('/watch-lists/matches/:matchId/review', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await watchListService.markMatchReviewed(req.params.matchId, userId)
      if (result.success) {
        res.json(result)
      } else {
        res.status(404).json(result)
      }
    } catch (error) {
      console.error('Error marking match reviewed:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // POST /api/watch-lists/matches/:matchId/dismiss - Dismiss match
  router.post('/watch-lists/matches/:matchId/dismiss', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await watchListService.dismissMatch(req.params.matchId, userId)
      if (result.success) {
        res.json(result)
      } else {
        res.status(404).json(result)
      }
    } catch (error) {
      console.error('Error dismissing match:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // DELETE /api/watch-lists/matches/:matchId - Delete match (unlink from watch list)
  router.delete('/watch-lists/matches/:matchId', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await watchListService.deleteMatch(req.params.matchId, userId)
      if (result.success) {
        res.json(result)
      } else {
        res.status(404).json(result)
      }
    } catch (error) {
      console.error('Error deleting match:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // POST /api/watch-lists/match-update - Match a new update against all watch lists
  router.post('/watch-lists/match-update', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const { updateId, updateData } = req.body
      if (!updateId || !updateData) {
        return res.status(400).json({ success: false, error: 'updateId and updateData are required' })
      }
      const result = await watchListService.matchUpdateAgainstWatchLists(updateId, updateData, userId)
      res.json(result)
    } catch (error) {
      console.error('Error matching update:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })
}

module.exports = registerWatchListRoutes
