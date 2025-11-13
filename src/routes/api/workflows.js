const express = require('express')
const workflowService = require('../../services/workflowService')

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

module.exports = function registerWorkflowRoutes(router) {
  const workflowsRouter = express.Router()

  workflowsRouter.get('/', async (req, res) => {
    try {
      const userId = resolveUserId(req)
      const workflows = await workflowService.listWorkflows(userId, {
        status: req.query.status,
        limit: req.query.limit ? Number(req.query.limit) : undefined
      })
      res.json({ success: true, workflows })
    } catch (error) {
      console.error('[workflows] list error:', error)
      res.status(500).json({ success: false, error: 'Unable to fetch workflows' })
    }
  })

  workflowsRouter.post('/', async (req, res) => {
    try {
      const userId = resolveUserId(req)
      const workflow = await workflowService.createWorkflow(userId, req.body || {})
      res.status(201).json({ success: true, workflow })
    } catch (error) {
      console.error('[workflows] create error:', error)
      res.status(400).json({ success: false, error: error.message || 'Unable to create workflow' })
    }
  })

  workflowsRouter.patch('/:id/status', async (req, res) => {
    try {
      const userId = resolveUserId(req)
      const workflow = await workflowService.updateWorkflowStatus(userId, Number(req.params.id), req.body.status)
      if (!workflow) {
        return res.status(404).json({ success: false, error: 'Workflow not found' })
      }
      res.json({ success: true, workflow })
    } catch (error) {
      console.error('[workflows] status update error:', error)
      res.status(400).json({ success: false, error: error.message || 'Unable to update workflow' })
    }
  })

  router.use('/workflows', workflowsRouter)
}
