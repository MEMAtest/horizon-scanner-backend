const { getSidebar } = require('../templates/sidebar')
const { getClientScripts } = require('../templates/clientScripts')
const { getCommonStyles } = require('../templates/commonStyles')
const notificationService = require('../../services/notificationService')
const { buildSettingsPage } = require('../../views/settings/pageBuilder')

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

async function renderSettingsPage(req, res) {
  try {
    console.log('[Settings] Rendering settings page...')

    const userId = resolveUserId(req)
    const activeTab = req.query.tab || 'notifications'

    // Load notifications and common page elements in parallel
    const [notificationsResult, unreadCountResult, sidebar, clientScripts, commonStyles] = await Promise.all([
      notificationService.getNotifications(userId, { limit: 50, includeDismissed: false }),
      notificationService.getUnreadCount(userId),
      getSidebar('settings'),
      getClientScripts(),
      getCommonStyles()
    ])

    const notifications = notificationsResult.success ? notificationsResult.data : []
    const unreadCount = unreadCountResult.success && unreadCountResult.data ? unreadCountResult.data.count : 0

    const html = buildSettingsPage({
      sidebar,
      clientScripts,
      commonStyles,
      activeTab,
      notifications,
      unreadCount
    })

    res.send(html)
  } catch (error) {
    console.error('[Settings] Error rendering page:', error)
    res.status(500).send(renderError(error))
  }
}

function renderError(error) {
  return `
    <!DOCTYPE html>
    <html>
      <head><title>Error - Settings</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>Error Loading Page</h1>
        <p>Unable to load the settings page. Please try refreshing.</p>
        <p><a href="/settings">Try Again</a></p>
        <small>Error: ${error.message}</small>
      </body>
    </html>
  `
}

module.exports = { renderSettingsPage }
