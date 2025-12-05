const linkedItemsService = require('../../services/linkedItemsService')

/**
 * Register linked items routes
 * @param {import('express').Router} router
 */
function registerLinkedItemsRoutes(router) {
  // GET /api/watch-lists/:id/linked-items - Get all items linked to a watch list
  router.get('/watch-lists/:id/linked-items', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await linkedItemsService.getWatchListLinkedItems(req.params.id, userId)
      res.json(result)
    } catch (error) {
      console.error('Error getting watch list linked items:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // GET /api/dossiers/:id/linked-items - Get all items linked to a dossier
  router.get('/dossiers/:id/linked-items', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await linkedItemsService.getDossierLinkedItems(req.params.id, userId)
      res.json(result)
    } catch (error) {
      console.error('Error getting dossier linked items:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // GET /api/policies/:id/linked-items - Get all items linked to a policy
  router.get('/policies/:id/linked-items', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await linkedItemsService.getPolicyLinkedItems(req.params.id, userId)
      res.json(result)
    } catch (error) {
      console.error('Error getting policy linked items:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // GET /api/regulatory-changes/:id/linked-items - Get all items linked to a kanban item
  router.get('/regulatory-changes/:id/linked-items', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await linkedItemsService.getKanbanItemLinkedItems(req.params.id, userId)
      res.json(result)
    } catch (error) {
      console.error('Error getting kanban item linked items:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // GET /api/updates/:id/linked-items - Get all items linked to a regulatory update
  router.get('/updates/:id/linked-items', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await linkedItemsService.getRegulatoryUpdateLinkedItems(req.params.id, userId)
      res.json(result)
    } catch (error) {
      console.error('Error getting update linked items:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })
}

module.exports = registerLinkedItemsRoutes
