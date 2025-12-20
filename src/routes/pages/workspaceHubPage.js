const { getSidebar } = require('../templates/sidebar')
const { getClientScripts } = require('../templates/clientScripts')
const { getCommonStyles } = require('../templates/commonStyles')
const dbService = require('../../services/dbService')
const { buildWorkspaceHubPage } = require('../../views/workspaceHub/pageBuilder')

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

async function renderWorkspaceHubPage(req, res) {
  try {
    console.log('[WorkspaceHub] Rendering profile hub page...')

    const userId = resolveUserId(req)

    const [pinnedItems, bookmarkCollections, savedSearches, customAlerts, firmProfile] = await Promise.all([
      dbService.getPinnedItems(),
      dbService.getBookmarkCollections(),
      dbService.getSavedSearches(),
      dbService.getCustomAlerts(),
      dbService.getFirmProfile()
    ])

    const stats = {
      pinnedItems: Array.isArray(pinnedItems) ? pinnedItems.length : 0,
      bookmarkCollections: Array.isArray(bookmarkCollections) ? bookmarkCollections.length : 0,
      savedSearches: Array.isArray(savedSearches) ? savedSearches.length : 0,
      activeAlerts: Array.isArray(customAlerts) ? customAlerts.filter(alert => alert && alert.isActive).length : 0,
      hasFirmProfile: Boolean(firmProfile)
    }

    const [sidebar, clientScripts, commonStyles] = await Promise.all([
      getSidebar('profile-hub', { user: req.user }),
      getClientScripts(),
      getCommonStyles()
    ])

    const html = buildWorkspaceHubPage({
      sidebar,
      clientScripts,
      commonStyles,
      pinnedItems: Array.isArray(pinnedItems) ? pinnedItems : [],
      bookmarkCollections: Array.isArray(bookmarkCollections) ? bookmarkCollections : [],
      stats,
      userId
    })

    res.send(html)
  } catch (error) {
    console.error('[WorkspaceHub] Error rendering page:', error)
    res.status(500).send(renderError(error))
  }
}

function renderError(error) {
  return `
    <!DOCTYPE html>
    <html>
      <head><title>Error - Profile Hub</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>Error Loading Page</h1>
        <p>Unable to load the profile hub. Please try refreshing.</p>
        <p><a href="/profile-hub">Try Again</a></p>
        <small>Error: ${error.message}</small>
      </body>
    </html>
  `
}

module.exports = { renderWorkspaceHubPage }

