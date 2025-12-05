const { getSidebar } = require('../templates/sidebar')
const { getClientScripts } = require('../templates/clientScripts')
const { getCommonStyles } = require('../templates/commonStyles')
const watchListService = require('../../services/watchListService')
const linkedItemsService = require('../../services/linkedItemsService')
const { buildWatchListsPage } = require('../../views/watchLists/pageBuilder')

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

async function renderWatchListsPage(req, res) {
  try {
    console.log('[WatchLists] Rendering watch lists page...')

    const userId = resolveUserId(req)

    // Load watch lists, statistics, and connection counts in parallel
    const [watchListsResult, statsResult, connectionCounts] = await Promise.all([
      watchListService.getWatchLists(userId),
      watchListService.getWatchListStats(userId),
      linkedItemsService.getWatchListConnectionCounts(userId)
    ])

    const watchLists = watchListsResult.success ? watchListsResult.data : []
    const stats = statsResult.success ? statsResult.data : {}

    // Get common page elements
    const [sidebar, clientScripts, commonStyles] = await Promise.all([
      getSidebar('watch-lists'),
      getClientScripts(),
      getCommonStyles()
    ])

    const html = buildWatchListsPage({
      sidebar,
      clientScripts,
      commonStyles,
      watchLists,
      stats,
      connectionCounts
    })

    res.send(html)
  } catch (error) {
    console.error('[WatchLists] Error rendering page:', error)
    res.status(500).send(renderError(error))
  }
}

function renderError(error) {
  return `
    <!DOCTYPE html>
    <html>
      <head><title>Error - Watch Lists</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>Error Loading Page</h1>
        <p>Unable to load the watch lists page. Please try refreshing.</p>
        <p><a href="/watch-lists">Try Again</a></p>
        <small>Error: ${error.message}</small>
      </body>
    </html>
  `
}

module.exports = { renderWatchListsPage }
