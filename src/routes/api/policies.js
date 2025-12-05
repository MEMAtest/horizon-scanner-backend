const policyService = require('../../services/policyService')

/**
 * Register policy routes
 * @param {import('express').Router} router
 */
function registerPolicyRoutes(router) {
  // ==================== POLICIES ====================

  // GET /api/policies - Get all policies
  router.get('/policies', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await policyService.getPolicies(userId, {
        status: req.query.status,
        category: req.query.category,
        department: req.query.department
      })
      res.json(result)
    } catch (error) {
      console.error('Error getting policies:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // GET /api/policies/stats - Get policy statistics
  router.get('/policies/stats', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await policyService.getPolicyStats(userId)
      res.json(result)
    } catch (error) {
      console.error('Error getting policy stats:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // GET /api/policies/due-for-review - Get policies due for review
  router.get('/policies/due-for-review', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const daysAhead = parseInt(req.query.days) || 30
      const result = await policyService.getPoliciesDueForReview(userId, daysAhead)
      res.json(result)
    } catch (error) {
      console.error('Error getting policies due for review:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // POST /api/policies/send-review-reminders - Send review reminders
  router.post('/policies/send-review-reminders', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await policyService.sendReviewReminders(userId)
      res.json(result)
    } catch (error) {
      console.error('Error sending review reminders:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // POST /api/policies - Create new policy
  router.post('/policies', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await policyService.createPolicy(userId, req.body)
      if (result.success) {
        res.status(201).json(result)
      } else {
        res.status(400).json(result)
      }
    } catch (error) {
      console.error('Error creating policy:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // GET /api/policies/:id - Get single policy with current version
  router.get('/policies/:id', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await policyService.getPolicyById(req.params.id, userId)
      if (result.success) {
        res.json(result)
      } else {
        res.status(404).json(result)
      }
    } catch (error) {
      console.error('Error getting policy:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // PUT /api/policies/:id - Update policy metadata
  router.put('/policies/:id', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await policyService.updatePolicy(req.params.id, userId, req.body)
      if (result.success) {
        res.json(result)
      } else {
        res.status(result.error === 'Policy not found' ? 404 : 400).json(result)
      }
    } catch (error) {
      console.error('Error updating policy:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // DELETE /api/policies/:id - Delete policy
  router.delete('/policies/:id', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await policyService.deletePolicy(req.params.id, userId)
      if (result.success) {
        res.json(result)
      } else {
        res.status(404).json(result)
      }
    } catch (error) {
      console.error('Error deleting policy:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // POST /api/policies/:id/mark-reviewed - Mark policy as reviewed
  router.post('/policies/:id/mark-reviewed', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const { notes } = req.body
      const result = await policyService.markPolicyReviewed(req.params.id, userId, notes)
      if (result.success) {
        res.json(result)
      } else {
        res.status(404).json(result)
      }
    } catch (error) {
      console.error('Error marking policy reviewed:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // GET /api/policies/:id/export - Export policy
  router.get('/policies/:id/export', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const format = req.query.format || 'markdown'
      const result = await policyService.exportPolicy(req.params.id, userId, format)
      if (result.success) {
        res.setHeader('Content-Type', result.contentType)
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`)
        res.send(typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2))
      } else {
        res.status(404).json(result)
      }
    } catch (error) {
      console.error('Error exporting policy:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // ==================== POLICY VERSIONS ====================

  // GET /api/policies/:id/versions - Get all versions of a policy
  router.get('/policies/:id/versions', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await policyService.getPolicyVersions(req.params.id, userId)
      if (result.success) {
        res.json(result)
      } else {
        res.status(404).json(result)
      }
    } catch (error) {
      console.error('Error getting versions:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // POST /api/policies/:id/versions - Create new version
  router.post('/policies/:id/versions', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await policyService.createPolicyVersion(req.params.id, userId, req.body)
      if (result.success) {
        res.status(201).json(result)
      } else {
        res.status(result.error === 'Policy not found' ? 404 : 400).json(result)
      }
    } catch (error) {
      console.error('Error creating version:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // GET /api/policies/versions/:versionId - Get specific version
  router.get('/policies/versions/:versionId', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await policyService.getPolicyVersion(req.params.versionId, userId)
      if (result.success) {
        res.json(result)
      } else {
        res.status(404).json(result)
      }
    } catch (error) {
      console.error('Error getting version:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // POST /api/policies/versions/:versionId/approve - Approve version
  router.post('/policies/versions/:versionId/approve', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const { approverName } = req.body
      if (!approverName) {
        return res.status(400).json({ success: false, error: 'approverName is required' })
      }
      const result = await policyService.approveVersion(req.params.versionId, userId, approverName)
      if (result.success) {
        res.json(result)
      } else {
        res.status(result.error === 'Version not found' || result.error === 'Policy not found' ? 404 : 400).json(result)
      }
    } catch (error) {
      console.error('Error approving version:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // POST /api/policies/versions/:versionId/reject - Reject version
  router.post('/policies/versions/:versionId/reject', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const { reason } = req.body
      const result = await policyService.rejectVersion(req.params.versionId, userId, reason)
      if (result.success) {
        res.json(result)
      } else {
        res.status(result.error === 'Version not found' || result.error === 'Policy not found' ? 404 : 400).json(result)
      }
    } catch (error) {
      console.error('Error rejecting version:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // GET /api/policies/versions/compare - Compare two versions
  router.get('/policies/versions/compare', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const { version1, version2 } = req.query
      if (!version1 || !version2) {
        return res.status(400).json({ success: false, error: 'version1 and version2 query params are required' })
      }
      const result = await policyService.compareVersions(version1, version2, userId)
      if (result.success) {
        res.json(result)
      } else {
        res.status(404).json(result)
      }
    } catch (error) {
      console.error('Error comparing versions:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // ==================== POLICY CITATIONS ====================

  // POST /api/policies/versions/:versionId/citations - Add citation
  router.post('/policies/versions/:versionId/citations', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const { updateId, citationType, notes, sectionReference } = req.body
      if (!updateId) {
        return res.status(400).json({ success: false, error: 'updateId is required' })
      }
      const result = await policyService.addCitation(req.params.versionId, updateId, userId, {
        citationType,
        notes,
        sectionReference
      })
      if (result.success) {
        res.status(201).json(result)
      } else {
        res.status(404).json(result)
      }
    } catch (error) {
      console.error('Error adding citation:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // DELETE /api/policies/citations/:citationId - Remove citation
  router.delete('/policies/citations/:citationId', async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] || 'default'
      const result = await policyService.removeCitation(req.params.citationId, userId)
      if (result.success) {
        res.json(result)
      } else {
        res.status(404).json(result)
      }
    } catch (error) {
      console.error('Error removing citation:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })
}

module.exports = registerPolicyRoutes
