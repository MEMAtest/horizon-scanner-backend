const dossierService = require('../../services/dossierService')

/**
 * Register research dossier routes
 * @param {import('express').Router} router
 */
function registerDossierRoutes(router) {
  // ==================== DOSSIERS ====================

  // GET /api/dossiers - Get all dossiers
  router.get('/dossiers', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await dossierService.getDossiers(userId, {
        status: req.query.status,
        topic: req.query.topic
      })
      res.json(result)
    } catch (error) {
      console.error('Error getting dossiers:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // GET /api/dossiers/stats - Get dossier statistics
  router.get('/dossiers/stats', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await dossierService.getDossierStats(userId)
      res.json(result)
    } catch (error) {
      console.error('Error getting dossier stats:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // POST /api/dossiers - Create new dossier
  router.post('/dossiers', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await dossierService.createDossier(userId, req.body)
      if (result.success) {
        res.status(201).json(result)
      } else {
        res.status(400).json(result)
      }
    } catch (error) {
      console.error('Error creating dossier:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // GET /api/dossiers/:id - Get single dossier with items
  router.get('/dossiers/:id', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await dossierService.getDossierById(req.params.id, userId)
      if (result.success) {
        res.json(result)
      } else {
        res.status(404).json(result)
      }
    } catch (error) {
      console.error('Error getting dossier:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // PUT /api/dossiers/:id - Update dossier
  router.put('/dossiers/:id', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await dossierService.updateDossier(req.params.id, userId, req.body)
      if (result.success) {
        res.json(result)
      } else {
        res.status(result.error === 'Dossier not found' ? 404 : 400).json(result)
      }
    } catch (error) {
      console.error('Error updating dossier:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // DELETE /api/dossiers/:id - Delete dossier
  router.delete('/dossiers/:id', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await dossierService.deleteDossier(req.params.id, userId)
      if (result.success) {
        res.json(result)
      } else {
        res.status(404).json(result)
      }
    } catch (error) {
      console.error('Error deleting dossier:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // POST /api/dossiers/:id/archive - Archive dossier
  router.post('/dossiers/:id/archive', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await dossierService.archiveDossier(req.params.id, userId)
      if (result.success) {
        res.json(result)
      } else {
        res.status(404).json(result)
      }
    } catch (error) {
      console.error('Error archiving dossier:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // POST /api/dossiers/:id/reopen - Reopen archived dossier
  router.post('/dossiers/:id/reopen', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await dossierService.reopenDossier(req.params.id, userId)
      if (result.success) {
        res.json(result)
      } else {
        res.status(404).json(result)
      }
    } catch (error) {
      console.error('Error reopening dossier:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // GET /api/dossiers/:id/timeline - Get dossier timeline
  router.get('/dossiers/:id/timeline', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await dossierService.getDossierTimeline(req.params.id, userId)
      if (result.success) {
        res.json(result)
      } else {
        res.status(404).json(result)
      }
    } catch (error) {
      console.error('Error getting timeline:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // GET /api/dossiers/:id/export - Export dossier
  router.get('/dossiers/:id/export', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const format = req.query.format || 'json'
      const result = await dossierService.exportDossier(req.params.id, userId, format)
      if (result.success) {
        res.setHeader('Content-Type', result.contentType)
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`)
        res.send(typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2))
      } else {
        res.status(404).json(result)
      }
    } catch (error) {
      console.error('Error exporting dossier:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // ==================== DOSSIER ITEMS ====================

  // POST /api/dossiers/:id/items - Add item to dossier
  router.post('/dossiers/:id/items', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const { updateId, notes, relevanceScore, tags } = req.body
      if (!updateId) {
        return res.status(400).json({ success: false, error: 'updateId is required' })
      }
      const result = await dossierService.addItemToDossier(req.params.id, updateId, userId, {
        notes,
        relevanceScore,
        tags
      })
      if (result.success) {
        res.status(201).json(result)
      } else {
        res.status(result.error === 'Dossier not found' ? 404 : 400).json(result)
      }
    } catch (error) {
      console.error('Error adding item to dossier:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // POST /api/dossiers/:id/items/bulk - Bulk add items to dossier
  router.post('/dossiers/:id/items/bulk', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const { updateIds, notes } = req.body
      if (!updateIds || !Array.isArray(updateIds)) {
        return res.status(400).json({ success: false, error: 'updateIds array is required' })
      }
      const result = await dossierService.bulkAddItems(req.params.id, updateIds, userId, { notes })
      res.json(result)
    } catch (error) {
      console.error('Error bulk adding items:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // PUT /api/dossiers/:dossierId/items/:itemId - Update dossier item
  router.put('/dossiers/:dossierId/items/:itemId', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await dossierService.updateDossierItem(
        req.params.dossierId,
        req.params.itemId,
        userId,
        req.body
      )
      if (result.success) {
        res.json(result)
      } else {
        res.status(404).json(result)
      }
    } catch (error) {
      console.error('Error updating dossier item:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // DELETE /api/dossiers/:dossierId/items/:itemId - Remove item from dossier
  router.delete('/dossiers/:dossierId/items/:itemId', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await dossierService.removeItemFromDossier(
        req.params.dossierId,
        req.params.itemId,
        userId
      )
      if (result.success) {
        res.json(result)
      } else {
        res.status(404).json(result)
      }
    } catch (error) {
      console.error('Error removing item from dossier:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })
}

module.exports = registerDossierRoutes
