const { getSidebar } = require('../../templates/sidebar')
const dbService = require('../../../services/dbService')
const { renderInternationalPage } = require('./template')

const internationalPage = async (req, res) => {
  try {
    const region = req.query.region || null
    const country = req.query.country || null

    // Get sidebar
    const sidebar = await getSidebar('international')

    // Build filters for international updates (exclude UK)
    const filters = {
      limit: 100
    }

    // If specific region requested
    if (region) {
      filters.region = region
    } else {
      // Exclude UK for all-regions view
      filters.region = ['Americas', 'Europe', 'Asia-Pacific', 'International']
    }

    // If specific country requested
    if (country) {
      filters.country = country
    }

    // Get international updates
    const updates = await dbService.getEnhancedUpdates(filters)

    // Calculate stats
    const allInternational = await dbService.getEnhancedUpdates({
      region: ['Americas', 'Europe', 'Asia-Pacific', 'International'],
      limit: 1000
    })

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const countryStats = {}
    let thisWeek = 0
    let highImpact = 0

    for (const update of allInternational) {
      const updateCountry = update.country || 'Unknown'
      const updateRegion = update.region || 'Unknown'

      if (!countryStats[updateCountry]) {
        countryStats[updateCountry] = {
          total: 0,
          region: updateRegion,
          authorities: new Set()
        }
      }
      countryStats[updateCountry].total++
      if (update.authority) {
        countryStats[updateCountry].authorities.add(update.authority)
      }

      // This week count
      const updateDate = new Date(update.published_date || update.publishedDate || update.fetchedDate)
      if (updateDate >= weekAgo) {
        thisWeek++
      }

      // High impact count
      if (update.impact_level === 'Significant' || update.impactLevel === 'Significant' ||
          (update.business_impact_score || 0) >= 7 || update.urgency === 'High') {
        highImpact++
      }
    }

    // Convert Sets to arrays
    for (const c of Object.keys(countryStats)) {
      countryStats[c].authorities = Array.from(countryStats[c].authorities)
    }

    const stats = {
      total: allInternational.length,
      thisWeek,
      highImpact,
      countries: Object.keys(countryStats).length
    }

    const html = renderInternationalPage({
      sidebar,
      region,
      stats,
      countryStats,
      updates
    })

    res.send(html)
  } catch (error) {
    console.error('Error rendering international page:', error)
    res.status(500).send(`
      <div style="padding: 2rem; text-align: center; font-family: system-ui;">
        <h1>International Intelligence Error</h1>
        <p style="color: #6b7280; margin: 1rem 0;">${error.message}</p>
        <a href="/" style="color: #3b82f6; text-decoration: none;">&larr; Back to Home</a>
      </div>
    `)
  }
}

module.exports = internationalPage
