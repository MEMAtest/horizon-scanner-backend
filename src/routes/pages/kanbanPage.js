const { getSidebar } = require('../templates/sidebar')
const { getClientScripts } = require('../templates/clientScripts')
const { getCommonStyles } = require('../templates/commonStyles')
const regulatoryChangeService = require('../../services/regulatoryChangeService')
const linkedItemsService = require('../../services/linkedItemsService')
const { buildKanbanPage } = require('../../views/kanban/pageBuilder')

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

async function renderKanbanPage(req, res) {
  try {
    console.log('[Kanban] Rendering regulatory change management page...')

    const userId = resolveUserId(req)
    const selectedTemplateId = req.query.templateId || null

    // Load workflow templates
    const workflowTemplates = await regulatoryChangeService.getWorkflowTemplates(userId)

    // Determine which template to use
    let selectedTemplate = null
    if (selectedTemplateId) {
      selectedTemplate = await regulatoryChangeService.getWorkflowTemplateById(selectedTemplateId, userId)
    } else if (workflowTemplates.length > 0) {
      // Use the first template if none selected
      selectedTemplate = workflowTemplates[0]
    }

    // Load items grouped by stage
    const filters = selectedTemplate ? { workflow_template_id: selectedTemplate.id } : {}
    const itemsByStage = await regulatoryChangeService.getChangeItemsByStage(userId, filters)

    // Load statistics and connection counts in parallel
    const [statistics, connectionCounts] = await Promise.all([
      regulatoryChangeService.getStatistics(userId, filters),
      linkedItemsService.getKanbanConnectionCounts(userId)
    ])

    // Get common page elements
    const [sidebar, clientScripts, commonStyles] = await Promise.all([
      getSidebar('kanban'),
      getClientScripts(),
      getCommonStyles()
    ])

    const html = buildKanbanPage({
      sidebar,
      clientScripts,
      commonStyles,
      workflowTemplates,
      selectedTemplateId: selectedTemplate ? selectedTemplate.id : null,
      selectedTemplate,
      itemsByStage,
      statistics,
      connectionCounts
    })

    res.send(html)
  } catch (error) {
    console.error('[Kanban] Error rendering page:', error)
    res.status(500).send(renderKanbanError(error))
  }
}

function renderKanbanError(error) {
  return `
    <!DOCTYPE html>
    <html>
      <head><title>Error - Regulatory Change Management</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>Error Loading Page</h1>
        <p>Unable to load the regulatory change management page. Please try refreshing.</p>
        <p><a href="/kanban">Try Again</a></p>
        <small>Error: ${error.message}</small>
      </body>
    </html>
  `
}

module.exports = { renderKanbanPage }
