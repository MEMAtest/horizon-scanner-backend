const { getSidebar } = require('../templates/sidebar')
const { getClientScripts } = require('../templates/clientScripts')
const { getCommonStyles } = require('../templates/commonStyles')
const policyService = require('../../services/policyService')
const linkedItemsService = require('../../services/linkedItemsService')
const { buildPoliciesPage } = require('../../views/policies/pageBuilder')

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

async function renderPoliciesPage(req, res) {
  try {
    console.log('[Policies] Rendering policies page...')

    const userId = resolveUserId(req)

    // Load policies, statistics, and connection counts in parallel
    const [policiesResult, statsResult, connectionCounts] = await Promise.all([
      policyService.getPolicies(userId),
      policyService.getPolicyStats(userId),
      linkedItemsService.getPolicyConnectionCounts(userId)
    ])

    const policies = policiesResult.success ? policiesResult.data : []
    const stats = statsResult.success ? statsResult.data : {}

    // Get common page elements
    const [sidebar, clientScripts, commonStyles] = await Promise.all([
      getSidebar('policies'),
      getClientScripts(),
      getCommonStyles()
    ])

    const html = buildPoliciesPage({
      sidebar,
      clientScripts,
      commonStyles,
      policies,
      stats,
      connectionCounts
    })

    res.send(html)
  } catch (error) {
    console.error('[Policies] Error rendering page:', error)
    res.status(500).send(renderError(error))
  }
}

function renderError(error) {
  return `
    <!DOCTYPE html>
    <html>
      <head><title>Error - Policy Library</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>Error Loading Page</h1>
        <p>Unable to load the policy library page. Please try refreshing.</p>
        <p><a href="/policies">Try Again</a></p>
        <small>Error: ${error.message}</small>
      </body>
    </html>
  `
}

module.exports = { renderPoliciesPage }
