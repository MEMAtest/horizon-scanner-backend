const { getSidebar } = require('../../templates/sidebar')
const dbService = require('../../../services/dbService')

function resolveUserId(req) {
  const headerUser = req.headers['x-user-id']
  if (headerUser && typeof headerUser === 'string' && headerUser.trim()) {
    return headerUser.trim()
  }
  return 'default'
}

async function loadRegulatoryAnalyticsData(req) {
  console.log('[Analytics] Rendering regulatory analytics dashboard...')

  // Ensure dbService is initialized
  if (!dbService.isInitialized) {
    console.log('[Analytics] Waiting for database initialization...')
    await dbService.waitForInitialization()
  }

  const userId = resolveUserId(req)

  // Get analytics data with individual error handling
  let updates = []
  let filterOptions = { authorities: [], sectors: [] }
  let sidebar = ''

  try {
    updates = await dbService.getEnhancedUpdates({ limit: 1000 })
    console.log(`[Analytics] Retrieved ${updates.length} updates`)
  } catch (error) {
    console.error('[Analytics] Error getting updates:', error)
    // Continue with empty array
  }

  try {
    filterOptions = await dbService.getFilterOptions()
    console.log(`[Analytics] Retrieved filter options: ${filterOptions.authorities?.length || 0} authorities, ${filterOptions.sectors?.length || 0} sectors`)
  } catch (error) {
    console.error('[Analytics] Error getting filter options:', error)
    // Continue with empty options
  }

  try {
    sidebar = await getSidebar('regulatory-analytics')
  } catch (error) {
    console.error('[Analytics] Error getting sidebar:', error)
    sidebar = '<div></div>' // Empty sidebar
  }

  return {
    userId,
    updates,
    filterOptions,
    sidebar
  }
}

module.exports = { loadRegulatoryAnalyticsData, resolveUserId }
