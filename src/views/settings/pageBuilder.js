const { getSettingsStyles } = require('./styles')
const { getSettingsScripts } = require('./scripts')
const {
  renderSettingsHeader,
  renderTabNavigation,
  renderTabContent
} = require('./sections')

function buildSettingsPage({
  sidebar,
  commonStyles,
  clientScripts,
  activeTab = 'notifications',
  notifications = [],
  unreadCount = 0
}) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Settings - RegCanary</title>
      <meta name="description" content="Manage your notifications, preferences, and account settings">
      ${commonStyles}
      ${getSettingsStyles()}
    </head>
    <body>
      <div class="app-container">
        ${sidebar}
        <main class="main-content">
          ${renderSettingsHeader()}
          ${renderTabNavigation(activeTab, unreadCount)}
          ${renderTabContent(activeTab, { notifications, unreadCount })}
        </main>
      </div>
      ${clientScripts}
      ${getSettingsScripts()}
    </body>
    </html>
  `
}

module.exports = { buildSettingsPage }
