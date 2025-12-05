const { getKanbanStyles } = require('./styles')
const { getKanbanScripts } = require('./scripts')
const {
  renderGuidancePanel,
  renderStatsCards,
  renderWorkflowSelector,
  renderKanbanBoard,
  renderAddItemModal,
  renderItemDetailModal
} = require('./components')

function buildKanbanPage({
  sidebar,
  clientScripts,
  commonStyles,
  workflowTemplates,
  selectedTemplateId,
  selectedTemplate,
  itemsByStage,
  statistics,
  connectionCounts = {}
}) {
  const kanbanStyles = getKanbanStyles()
  const kanbanScripts = getKanbanScripts({
    workflowTemplates,
    selectedTemplateId,
    selectedTemplate,
    itemsByStage,
    statistics
  })

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Regulatory Change Management - Horizon Scanner</title>
      ${commonStyles}
      ${kanbanStyles}
    </head>
    <body>
      ${sidebar}
      <main class="main-content">
        <div class="kanban-page">
          <header class="kanban-header">
            <div class="header-left">
              <h1>Regulatory Change Management</h1>
              <p class="header-subtitle">Track and manage regulatory changes through your workflow</p>
            </div>
            <div class="header-right">
              ${renderWorkflowSelector(workflowTemplates, selectedTemplateId)}
              <button class="btn btn-primary" onclick="KanbanPage.openAddItemModal()">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add Change Item
              </button>
            </div>
          </header>

          ${renderGuidancePanel()}

          ${renderStatsCards(statistics)}

          <div class="kanban-container">
            ${renderKanbanBoard(selectedTemplate, itemsByStage, connectionCounts)}
          </div>
        </div>
      </main>

      ${renderAddItemModal(workflowTemplates)}
      ${renderItemDetailModal()}

      ${clientScripts}
      ${kanbanScripts}
    </body>
    </html>
  `
}

module.exports = { buildKanbanPage }
