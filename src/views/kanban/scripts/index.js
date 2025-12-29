const { serializeForScript } = require('../../dashboard/helpers')
const { AUTHORITIES, SECTORS } = require('../../../constants/dropdownOptions')
const { getStateScript, getStateSection } = require('./state')
const { getDragDropSection } = require('./dragDrop')
const { getRenderSection } = require('./render')
const { getApiSection } = require('./api')
const { getEventsSection } = require('./events')

function getKanbanScripts({ workflowTemplates, selectedTemplateId, selectedTemplate, itemsByStage, statistics }) {
  const serializedTemplates = serializeForScript(workflowTemplates || [])
  const serializedSelectedTemplate = serializeForScript(selectedTemplate || null)
  const serializedItemsByStage = serializeForScript(itemsByStage || {})
  const serializedStatistics = serializeForScript(statistics || {})
  const serializedAuthorities = serializeForScript(AUTHORITIES)
  const serializedSectors = serializeForScript(SECTORS)

  return `${getStateScript({
    serializedTemplates,
    selectedTemplateId,
    serializedSelectedTemplate,
    serializedItemsByStage,
    serializedStatistics,
    serializedAuthorities,
    serializedSectors
  })}
    <script>
      (function() {
        const state = window.kanbanState;

        const KanbanPage = {${getStateSection()}${getDragDropSection()}${getRenderSection()}${getApiSection()}
        };

        window.KanbanPage = KanbanPage;
        KanbanPage.init();

${getEventsSection()}      })();
    </script>
  `
}

module.exports = { getKanbanScripts }
