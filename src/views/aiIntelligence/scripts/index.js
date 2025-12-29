const { getAiIntelligenceIntroScript } = require('./intro')
const { getAiIntelligenceRenderersScript } = require('./renderers')
const { getAiIntelligenceSnapshotScript } = require('./snapshot')
const { getAiIntelligenceActionsScript } = require('./actions')
const { getAiIntelligenceWorkflowScript } = require('./workflow')
const { getAiIntelligenceRegistryScript } = require('./registry')

function getAiIntelligenceScripts(snapshot) {
  const snapshotJson = JSON.stringify(snapshot || {}).replace(/</g, '\\u003c')

  return `
    <script>${getAiIntelligenceIntroScript(snapshotJson)}${getAiIntelligenceRenderersScript()}${getAiIntelligenceSnapshotScript()}${getAiIntelligenceActionsScript()}${getAiIntelligenceWorkflowScript()}${getAiIntelligenceRegistryScript()}    </script>
  `
}

module.exports = { getAiIntelligenceScripts }
