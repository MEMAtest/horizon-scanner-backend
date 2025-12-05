const { getSidebar } = require('../templates/sidebar')
const { getClientScripts } = require('../templates/clientScripts')
const { getCommonStyles } = require('../templates/commonStyles')
const dossierService = require('../../services/dossierService')
const linkedItemsService = require('../../services/linkedItemsService')
const { buildDossiersPage } = require('../../views/dossiers/pageBuilder')

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

async function renderDossiersPage(req, res) {
  try {
    console.log('[Dossiers] Rendering dossiers page...')

    const userId = resolveUserId(req)

    // Load dossiers, statistics, and connection counts in parallel
    const [dossiersResult, statsResult, connectionCounts] = await Promise.all([
      dossierService.getDossiers(userId),
      dossierService.getDossierStats(userId),
      linkedItemsService.getDossierConnectionCounts(userId)
    ])

    const dossiers = dossiersResult.success ? dossiersResult.data : []
    const stats = statsResult.success ? statsResult.data : {}

    // Get common page elements
    const [sidebar, clientScripts, commonStyles] = await Promise.all([
      getSidebar('dossiers'),
      getClientScripts(),
      getCommonStyles()
    ])

    const html = buildDossiersPage({
      sidebar,
      clientScripts,
      commonStyles,
      dossiers,
      stats,
      connectionCounts
    })

    res.send(html)
  } catch (error) {
    console.error('[Dossiers] Error rendering page:', error)
    res.status(500).send(renderError(error))
  }
}

function renderError(error) {
  return `
    <!DOCTYPE html>
    <html>
      <head><title>Error - Research Dossiers</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>Error Loading Page</h1>
        <p>Unable to load the research dossiers page. Please try refreshing.</p>
        <p><a href="/dossiers">Try Again</a></p>
        <small>Error: ${error.message}</small>
      </body>
    </html>
  `
}

module.exports = { renderDossiersPage }
