const annotationService = require('../../services/annotationService')

function registerAnnotationRoutes(router) {
  // List annotations with filtering
  router.get('/annotations', async (req, res) => {
    try {
      const updateIds = req.query.updateId
        ? Array.isArray(req.query.updateId)
          ? req.query.updateId
          : req.query.updateId.split(',').map(id => id.trim()).filter(Boolean)
        : []

      const visibility = req.query.visibility
        ? req.query.visibility.split(',').map(value => value.trim()).filter(Boolean)
        : []

      const status = req.query.status
        ? req.query.status.split(',').map(value => value.trim()).filter(Boolean)
        : []

      const filters = {
        updateIds,
        visibility,
        status,
        since: req.query.since || null,
        dueBefore: req.query.dueBefore || null,
        hasDueDate: req.query.hasDueDate === 'true'
      }

      if (req.query.limit) {
        filters.limit = parseInt(req.query.limit, 10)
      }

      const annotations = await annotationService.listAnnotations(filters)

      res.json({ success: true, annotations })
    } catch (error) {
      console.error('Annotation listing failed:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // Get annotations with upcoming due dates
  router.get('/annotations/upcoming', async (req, res) => {
    try {
      const daysAhead = req.query.days ? parseInt(req.query.days, 10) : 7
      const annotations = await annotationService.getUpcomingDueAnnotations(daysAhead)

      res.json({
        success: true,
        annotations,
        daysAhead
      })
    } catch (error) {
      console.error('Upcoming annotations fetch failed:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // Get overdue annotations
  router.get('/annotations/overdue', async (req, res) => {
    try {
      const annotations = await annotationService.getOverdueAnnotations()

      res.json({
        success: true,
        annotations,
        count: annotations.length
      })
    } catch (error) {
      console.error('Overdue annotations fetch failed:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // Get single annotation
  router.get('/annotations/:noteId', async (req, res) => {
    try {
      const noteId = req.params.noteId
      const annotation = await annotationService.getAnnotation(noteId)

      if (!annotation) {
        return res.status(404).json({ success: false, error: 'Annotation not found' })
      }

      res.json({ success: true, annotation })
    } catch (error) {
      console.error('Annotation fetch failed:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // Create annotation
  router.post('/annotations', async (req, res) => {
    try {
      const {
        update_id: updateId,
        author,
        visibility,
        status,
        content,
        tags,
        assigned_to: assignedTo,
        linked_resources: linkedResources,
        origin_page: originPage,
        action_type: actionType,
        priority,
        persona,
        report_included: reportIncluded,
        context,
        annotation_type: annotationType,
        due_date: dueDate
      } = req.body || {}

      if (!updateId || !content) {
        return res.status(400).json({ success: false, error: 'update_id and content are required' })
      }

      const annotation = await annotationService.addAnnotation({
        update_id: updateId,
        author,
        visibility,
        status,
        content,
        tags,
        assigned_to: assignedTo,
        linked_resources: linkedResources,
        origin_page: originPage,
        action_type: actionType,
        priority,
        persona,
        report_included: reportIncluded,
        context,
        annotation_type: annotationType,
        due_date: dueDate
      })

      res.status(201).json({ success: true, annotation })
    } catch (error) {
      console.error('Annotation creation failed:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // Update annotation
  router.put('/annotations/:noteId', async (req, res) => {
    try {
      const noteId = req.params.noteId
      const updated = await annotationService.updateAnnotation(noteId, req.body || {})

      if (!updated) {
        return res.status(404).json({ success: false, error: 'Annotation not found' })
      }

      res.json({ success: true, annotation: updated })
    } catch (error) {
      console.error('Annotation update failed:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })

  // Delete annotation (soft delete)
  router.delete('/annotations/:noteId', async (req, res) => {
    try {
      const noteId = req.params.noteId
      const success = await annotationService.deleteAnnotation(noteId)

      if (!success) {
        return res.status(404).json({ success: false, error: 'Annotation not found' })
      }

      res.json({ success: true })
    } catch (error) {
      console.error('Annotation deletion failed:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  })
}

module.exports = registerAnnotationRoutes
