const { getSidebar } = require('../templates/sidebar')
const { getClientScripts } = require('../templates/clientScripts')
const { getCommonStyles } = require('../templates/commonStyles')
const dbService = require('../../services/dbService')
const businessLineProfileService = require('../../services/businessLineProfileService')
const firmPersonaService = require('../../services/firmPersonaService')
const { buildDashboardPage } = require('../../views/dashboard/pageBuilder')
const {
  formatDashboardStats,
  formatFilterOptions
} = require('../../views/dashboard/helpers')

function resolveUserId(req) {
  const headerUser = req.headers?.['x-user-id']
  if (headerUser && typeof headerUser === 'string' && headerUser.trim()) {
    return headerUser.trim()
  }
  if (req.user && req.user.id) {
    return req.user.id
  }
  return 'default'
}

async function renderDashboardPage(req, res) {
  try {
    console.log('Analytics Rendering enhanced dashboard page...')

    const userId = resolveUserId(req)
    const filters = getCurrentFilters(req.query)

    // Get user and persona for sidebar
    const user = req.user && req.isAuthenticated ? req.user : null
    const persona = user ? await firmPersonaService.getUserPersona(user.id).catch(() => null) : null

    // Get business line profiles for the user
    const businessLineProfiles = await businessLineProfileService.getProfiles(userId).catch(() => [])
    const selectedProfileId = filters.profileId || null

    // If a profile is selected, get filtered updates based on profile
    let updates
    if (selectedProfileId) {
      try {
        updates = await businessLineProfileService.getFilteredUpdates(selectedProfileId, userId, filters)
      } catch {
        updates = await loadUpdates(filters)
      }
    } else {
      updates = await loadUpdates(filters)
    }

    // Apply persona filtering if persona is set and no profile filter
    if (persona && !selectedProfileId) {
      updates = firmPersonaService.applyPersonaFilter(updates, persona)
    }

    const [statsRaw, filterOptionsRaw, sidebar] = await Promise.all([
      dbService.getDashboardStatistics().catch(handleStatsFailure),
      dbService.getFilterOptions().catch(handleFilterOptionsFailure),
      getSidebar('dashboard', { user, persona })
    ])

    const stats = formatDashboardStats(statsRaw)
    const filterOptions = formatFilterOptions(filterOptionsRaw)
    const clientScripts = getClientScripts()
    const commonStyles = getCommonStyles()

    const html = buildDashboardPage({
      sidebar,
      stats,
      updates,
      filterOptions,
      currentFilters: filters,
      clientScripts,
      commonStyles,
      businessLineProfiles,
      selectedProfileId
    })

    res.send(html)
  } catch (error) {
    console.error('X Error rendering dashboard page:', error)
    res.status(500).send(renderDashboardError(error))
  }
}

function getCurrentFilters(query = {}) {
  return {
    category: query.category || 'all',
    authority: query.authority || null,
    sector: query.sector || null,
    impact: query.impact || null,
    range: query.range || null,
    search: query.search || null,
    profileId: query.profileId || null
  }
}

async function loadUpdates(filters) {
  const normalizedFilters = {
    category: filters.category && filters.category !== 'all' ? filters.category : null,
    authority: filters.authority || null,
    sector: filters.sector || null,
    impact: filters.impact || null,
    range: filters.range || null,
    search: filters.search || null
  }

  const updates = await dbService.getEnhancedUpdates({
    ...normalizedFilters,
    limit: 50
  })

  let cleanedCount = 0
  updates.forEach(update => {
    if (update.ai_summary && update.ai_summary.includes('undefined')) {
      const original = update.ai_summary
      update.ai_summary = update.ai_summary
        .replace(/\. undefined/g, '')
        .replace(/\.\. undefined/g, '')
        .replace(/ undefined/g, '')
        .replace(/undefined/g, '')
        .trim()
      if (original !== update.ai_summary) {
        cleanedCount++
      }
    }
  })

  if (cleanedCount > 0) {
    console.log(`Clean Cleaned ${cleanedCount} AI summaries with \"undefined\" suffix`)
  }

  if (updates.length > 0) {
    console.log('Search DEBUG - Sample update fields:', {
      ai_summary: updates[0].ai_summary,
      summary: updates[0].summary ? `${updates[0].summary.substring(0, 100)}...` : null,
      headline: updates[0].headline
    })
  }

  return updates
}

function handleStatsFailure(error) {
  console.error('Error getting dashboard statistics:', error)
  return {
    totalUpdates: 0,
    highImpact: 0,
    aiAnalyzed: 0,
    activeAuthorities: 0,
    newToday: 0,
    newAuthorities: 0,
    impactTrend: 'stable',
    impactChange: 0
  }
}

function handleFilterOptionsFailure(error) {
  console.error('Error getting filter options:', error)
  return {
    authorities: [],
    sectors: []
  }
}

function renderDashboardError(error) {
  return `
    <html>
      <head><title>Error - Dashboard</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>Warning Dashboard Error</h1>
        <p>Unable to load the dashboard. Please try refreshing.</p>
        <p><a href="/dashboard"><- Try Again</a></p>
        <small>Error: ${error.message}</small>
      </body>
    </html>
  `
}

module.exports = { renderDashboardPage }
