// src/routes/templates/clientScripts.js
// Complete solution with WorkspaceModule included

const { getSectorAliasMap } = require('../../utils/sectorTaxonomy')
const { renderImmediateDefinitionsSection } = require('./client-scripts/section-immediate')
const { renderStateManagementSection } = require('./client-scripts/section-state')
const { renderInitializationSection } = require('./client-scripts/section-initialization')
const { renderFilteringSection } = require('./client-scripts/section-filtering')
const { renderExposureSection } = require('./client-scripts/section-exposure')

function sanitizeAliasMap(map) {
  if (typeof map === 'string') {
    return map.replace(/</g, '\u003c')
  }
  const source = map || getSectorAliasMap()
  return JSON.stringify(source).replace(/</g, '\u003c')
}

function getWorkspaceBootstrapScripts(aliasMap) {
  const aliasMapJson = sanitizeAliasMap(aliasMap)

  return `
    <!-- Sector alias bootstrap -->
    <script>
        window.__sectorAliasMap = window.__sectorAliasMap || ${aliasMapJson};
    </script>
    <!-- Include Workspace Module First -->
    <script src="/js/workspaceModule.js"></script>
  `
}

function getClientScripts(options = {}) {
  const {
    includeWorkspaceModule = true,
    includeAliasBootstrap = true,
    aliasMap
  } = options

  const scripts = []
  let aliasMapJson

  if (includeAliasBootstrap || includeWorkspaceModule) {
    aliasMapJson = sanitizeAliasMap(aliasMap)
  }

  if (includeAliasBootstrap) {
    scripts.push(`
    <!-- Sector alias bootstrap -->
    <script>
        window.__sectorAliasMap = window.__sectorAliasMap || ${aliasMapJson};
    </script>
    `)
  }

  if (includeWorkspaceModule) {
    scripts.push(`
    <!-- Include Workspace Module First -->
    <script src="/js/workspaceModule.js"></script>
    `)
  }

  scripts.push(getClientScriptsContent())

  return scripts.join('\n')
}

function getClientScriptsContent() {
  const sections = [
    renderImmediateDefinitionsSection(),
    renderStateManagementSection(),
    renderInitializationSection(),
    renderFilteringSection(),
    renderExposureSection()
  ]

  return [
    '    <script>',
    ...sections,
    '    </script>'
  ].join('\n')
}

// Export all variations for compatibility
module.exports = {
  getClientScriptsContent,
  getCommonClientScripts: getClientScripts,
  getClientScripts,
  getSharedClientScripts: getClientScripts,
  getCommonScripts: getClientScripts,
  getWorkspaceBootstrapScripts
}
