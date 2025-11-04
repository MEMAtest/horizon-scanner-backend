const { getSidebar } = require('../../templates/sidebar')
const { getWorkspaceBootstrapScripts } = require('../../templates/clientScripts')
const { getCommonStyles } = require('../../templates/commonStyles')
const { buildAiIntelligencePage } = require('../../../views/aiIntelligence/pageBuilder')
const intelligenceDashboardService = require('../../../services/intelligenceDashboardService')

async function renderAiIntelligencePage(req, res) {
  try {
    const sidebarPromise = getSidebar('ai-intelligence')
    const snapshotPromise = intelligenceDashboardService.getDailySnapshot()

    const [sidebar, snapshot] = await Promise.all([sidebarPromise, snapshotPromise])
    const commonStyles = getCommonStyles()
    const workspaceBootstrapScripts = getWorkspaceBootstrapScripts()
    const html = buildAiIntelligencePage({
      sidebar,
      snapshot,
      workspaceBootstrapScripts,
      clientScripts: '',
      commonStyles
    })

    // Aggressive cache-busting headers to force fresh content load
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
    res.setHeader('Surrogate-Control', 'no-store')

    res.send(html)
  } catch (error) {
    console.error('X Error rendering AI intelligence page:', error)
    res.status(500).send('Error loading AI intelligence page')
  }
}

module.exports = renderAiIntelligencePage
