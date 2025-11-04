const annotationService = require('../../services/annotationService')

function registerAnnotationRoutes(router) {
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

    const annotations = await annotationService.listAnnotations({
      updateIds,
      visibility,
      status,
      since: req.query.since || null
    })

    res.json({ success: true, annotations })
  } catch (error) {
    console.error('Annotation listing failed:', error)
    res.status(500).json({ success: false, error: error.message })
  }
  })

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
      annotation_type: annotationType
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
      annotation_type: annotationType
    })

    res.status(201).json({ success: true, annotation })
  } catch (error) {
    console.error('Annotation creation failed:', error)
    res.status(500).json({ success: false, error: error.message })
  }
  })

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
