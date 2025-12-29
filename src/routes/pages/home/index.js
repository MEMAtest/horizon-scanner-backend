const { getSidebar } = require('../../templates/sidebar')
const { getClientScripts } = require('../../templates/clientScripts')
const { getCommonStyles } = require('../../templates/commonStyles')
const dbService = require('../../../services/dbService')
const firmPersonaService = require('../../../services/firmPersonaService')
const calendarService = require('../../../services/calendarService')
const { getSystemStatistics, getTopFinesThisYear } = require('./data')
const { buildHomePageHtml } = require('./render')

async function renderHomePage(req, res) {
  try {
    console.log('Home Rendering enhanced home page...')

    // Get user and persona for sidebar
    const user = req.user && req.isAuthenticated ? req.user : null
    const persona = user ? await firmPersonaService.getUserPersona(user.id).catch(() => null) : null

    // Get recent updates for home page preview (get more for charts)
    let recentUpdates = await dbService.getRecentUpdates(50)

    // Apply persona filtering if available
    if (persona) {
      recentUpdates = firmPersonaService.applyPersonaFilter(recentUpdates, persona)
    }

    // Get AI insights for home page highlights
    const aiInsights = (dbService.getRecentAIInsights && typeof dbService.getRecentAIInsights === 'function')
      ? await dbService.getRecentAIInsights(5)
      : []

    // Get system statistics
    const systemStats = await getSystemStatistics()

    // Get top fines this year
    const topFines = await getTopFinesThisYear()

    // Get upcoming calendar events for widget
    const upcomingEvents = await calendarService.getUpcomingEvents(30, 7).catch(err => {
      console.error('Error fetching calendar events:', err)
      return []
    })

    // Generate sidebar
    const sidebar = await getSidebar('home', { user, persona })

    const html = buildHomePageHtml({
      sidebar,
      commonStyles: getCommonStyles(),
      clientScripts: getClientScripts(),
      recentUpdates,
      systemStats,
      topFines,
      aiInsights,
      upcomingEvents
    })

    res.send(html)
  } catch (error) {
    console.error('X Error rendering home page:', error)
    res.status(500).send(`
            <html>
                <head><title>Error - AI Regulatory Intelligence</title></head>
                <body style="font-family: Arial; text-align: center; padding: 50px;">
                    <h1>Warning System Error</h1>
                    <p>Unable to load the home page. Please try refreshing.</p>
                    <p><a href="/"><- Try Again</a></p>
                    <small>Error: ${error.message}</small>
                </body>
            </html>
        `)
  }
}

module.exports = renderHomePage
