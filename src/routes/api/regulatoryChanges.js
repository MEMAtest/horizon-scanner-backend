const regulatoryChangeService = require('../../services/regulatoryChangeService')

/**
 * Register regulatory change item routes
 * @param {import('express').Router} router
 */
function registerRegulatoryChangeRoutes(router) {
  // ==================== WORKFLOW TEMPLATES ====================

  // GET /api/workflow-templates - Get all workflow templates
  router.get('/workflow-templates', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const templates = await regulatoryChangeService.getWorkflowTemplates(userId)
      res.json({ success: true, data: templates })
    } catch (error) {
      console.error('Error getting workflow templates:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // GET /api/workflow-templates/presets - Get preset templates
  router.get('/workflow-templates/presets', async (req, res) => {
    try {
      const presets = regulatoryChangeService.getPresetTemplates()
      res.json({ success: true, data: presets })
    } catch (error) {
      console.error('Error getting preset templates:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // GET /api/workflow-templates/default - Get default template
  router.get('/workflow-templates/default', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const template = await regulatoryChangeService.getDefaultTemplate(userId)
      res.json({ success: true, data: template })
    } catch (error) {
      console.error('Error getting default template:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // POST /api/workflow-templates - Create new workflow template
  router.post('/workflow-templates', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const template = await regulatoryChangeService.createWorkflowTemplate(userId, req.body)
      res.status(201).json({ success: true, data: template })
    } catch (error) {
      console.error('Error creating workflow template:', error)
      res.status(400).json({ success: false, error: error.message })
    }
  })

  // POST /api/workflow-templates/from-preset - Create from preset
  router.post('/workflow-templates/from-preset', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const { presetName, ...overrides } = req.body
      const template = await regulatoryChangeService.createFromPreset(presetName, userId, overrides)
      res.status(201).json({ success: true, data: template })
    } catch (error) {
      console.error('Error creating template from preset:', error)
      res.status(400).json({ success: false, error: error.message })
    }
  })

  // GET /api/workflow-templates/:id - Get single template
  router.get('/workflow-templates/:id', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const template = await regulatoryChangeService.getWorkflowTemplateById(req.params.id, userId)
      if (!template) {
        return res.status(404).json({ success: false, error: 'Template not found' })
      }
      res.json({ success: true, data: template })
    } catch (error) {
      console.error('Error getting workflow template:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // PUT /api/workflow-templates/:id - Update template
  router.put('/workflow-templates/:id', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const template = await regulatoryChangeService.updateWorkflowTemplate(req.params.id, userId, req.body)
      res.json({ success: true, data: template })
    } catch (error) {
      console.error('Error updating workflow template:', error)
      res.status(400).json({ success: false, error: error.message })
    }
  })

  // DELETE /api/workflow-templates/:id - Delete template
  router.delete('/workflow-templates/:id', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      await regulatoryChangeService.deleteWorkflowTemplate(req.params.id, userId)
      res.json({ success: true, message: 'Template deleted successfully' })
    } catch (error) {
      console.error('Error deleting workflow template:', error)
      res.status(400).json({ success: false, error: error.message })
    }
  })

  // POST /api/workflow-templates/:id/set-default - Set as default
  router.post('/workflow-templates/:id/set-default', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const template = await regulatoryChangeService.setDefaultTemplate(req.params.id, userId)
      res.json({ success: true, data: template })
    } catch (error) {
      console.error('Error setting default template:', error)
      res.status(400).json({ success: false, error: error.message })
    }
  })

  // ==================== REGULATORY CHANGE ITEMS ====================

  // GET /api/regulatory-changes - Get all change items
  router.get('/regulatory-changes', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const filters = {
        stage: req.query.stage,
        priority: req.query.priority,
        impact_level: req.query.impact_level,
        authority: req.query.authority,
        sector: req.query.sector,
        workflow_template_id: req.query.workflow_template_id,
        includeArchived: req.query.includeArchived === 'true'
      }
      const items = await regulatoryChangeService.getChangeItems(userId, filters)
      res.json({ success: true, data: items })
    } catch (error) {
      console.error('Error getting change items:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // GET /api/regulatory-changes/by-stage - Get items grouped by stage (Kanban)
  router.get('/regulatory-changes/by-stage', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const filters = {
        workflow_template_id: req.query.workflow_template_id,
        priority: req.query.priority,
        authority: req.query.authority,
        sector: req.query.sector
      }
      const grouped = await regulatoryChangeService.getChangeItemsByStage(userId, filters)
      res.json({ success: true, data: grouped })
    } catch (error) {
      console.error('Error getting change items by stage:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // GET /api/regulatory-changes/statistics - Get statistics
  router.get('/regulatory-changes/statistics', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const filters = {
        workflow_template_id: req.query.workflow_template_id
      }
      const stats = await regulatoryChangeService.getStatistics(userId, filters)
      res.json({ success: true, data: stats })
    } catch (error) {
      console.error('Error getting statistics:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // GET /api/regulatory-changes/velocity - Get velocity metrics
  router.get('/regulatory-changes/velocity', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const periodDays = parseInt(req.query.period) || 30
      const metrics = await regulatoryChangeService.getVelocityMetrics(userId, periodDays)
      res.json({ success: true, data: metrics })
    } catch (error) {
      console.error('Error getting velocity metrics:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // POST /api/regulatory-changes - Create new change item
  router.post('/regulatory-changes', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const item = await regulatoryChangeService.createChangeItem(userId, req.body)
      res.status(201).json({ success: true, data: item })
    } catch (error) {
      console.error('Error creating change item:', error)
      res.status(400).json({ success: false, error: error.message })
    }
  })

  // POST /api/regulatory-changes/from-update/:updateId - Create from regulatory update
  router.post('/regulatory-changes/from-update/:updateId', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const item = await regulatoryChangeService.createFromUpdate(req.params.updateId, userId, req.body)
      res.status(201).json({ success: true, data: item })
    } catch (error) {
      console.error('Error creating change item from update:', error)
      res.status(400).json({ success: false, error: error.message })
    }
  })

  // GET /api/regulatory-changes/:id - Get single change item
  router.get('/regulatory-changes/:id', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const item = await regulatoryChangeService.getChangeItemById(req.params.id, userId)
      if (!item) {
        return res.status(404).json({ success: false, error: 'Change item not found' })
      }
      res.json({ success: true, data: item })
    } catch (error) {
      console.error('Error getting change item:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // PUT /api/regulatory-changes/:id - Update change item
  router.put('/regulatory-changes/:id', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const item = await regulatoryChangeService.updateChangeItem(req.params.id, userId, req.body)
      res.json({ success: true, data: item })
    } catch (error) {
      console.error('Error updating change item:', error)
      res.status(400).json({ success: false, error: error.message })
    }
  })

  // POST /api/regulatory-changes/:id/advance - Advance to next stage
  router.post('/regulatory-changes/:id/advance', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const { stage, notes } = req.body
      if (!stage) {
        return res.status(400).json({ success: false, error: 'Stage is required' })
      }
      const item = await regulatoryChangeService.advanceStage(req.params.id, userId, stage, notes)
      res.json({ success: true, data: item })
    } catch (error) {
      console.error('Error advancing stage:', error)
      res.status(400).json({ success: false, error: error.message })
    }
  })

  // DELETE /api/regulatory-changes/:id - Delete (archive) change item
  router.delete('/regulatory-changes/:id', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      await regulatoryChangeService.deleteChangeItem(req.params.id, userId)
      res.json({ success: true, message: 'Change item archived successfully' })
    } catch (error) {
      console.error('Error deleting change item:', error)
      res.status(400).json({ success: false, error: error.message })
    }
  })

  // ==================== ACTIONS ====================

  // GET /api/regulatory-changes/:id/actions - Get actions for item
  router.get('/regulatory-changes/:id/actions', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const actions = await regulatoryChangeService.getActions(req.params.id, userId)
      res.json({ success: true, data: actions })
    } catch (error) {
      console.error('Error getting actions:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // POST /api/regulatory-changes/:id/actions - Add action to item
  router.post('/regulatory-changes/:id/actions', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const action = await regulatoryChangeService.addAction(req.params.id, userId, req.body)
      res.status(201).json({ success: true, data: action })
    } catch (error) {
      console.error('Error adding action:', error)
      res.status(400).json({ success: false, error: error.message })
    }
  })

  // GET /api/regulatory-changes/:id/audit-trail - Get audit trail
  router.get('/regulatory-changes/:id/audit-trail', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const trail = await regulatoryChangeService.getAuditTrail(req.params.id, userId)
      res.json({ success: true, data: trail })
    } catch (error) {
      console.error('Error getting audit trail:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })
}

module.exports = registerRegulatoryChangeRoutes
