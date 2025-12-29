const { getSidebar } = require('../../templates/sidebar')
const dbService = require('../../../services/dbService')
const { getIntelligenceIcon, wrapIconInContainer, getCanaryAnimationStyles } = require('../../../views/icons')
const { SECTOR_OPTIONS } = require('./constants')
const { calculateSectorStats } = require('./analysis')
const { renderSectorIntelligencePage } = require('./template')

const sectorIntelligencePage = async (req, res, sector = 'Banking') => {
  try {
    console.log(`Firm Rendering sector intelligence page for: ${sector}`)

    // Get canary icon for this page
    const canaryStyles = getCanaryAnimationStyles()
    const pageIcon = wrapIconInContainer(getIntelligenceIcon())

    // Get sector-specific data
    const allUpdates = await dbService.getEnhancedUpdates({ limit: 200 })
    const sectorUpdates = allUpdates.filter(update =>
      update.sector === sector ||
            (update.primarySectors && update.primarySectors.includes(sector)) ||
            (update.firmTypesAffected && update.firmTypesAffected.includes(sector))
    )

    // Calculate sector statistics
    const stats = calculateSectorStats(sectorUpdates, sector)

    // Get sidebar
    const sidebar = await getSidebar('sector-intelligence')

    const html = renderSectorIntelligencePage({
      sidebar,
      pageIcon,
      sector,
      stats,
      sectors: SECTOR_OPTIONS,
      sectorUpdates,
      canaryStyles
    })

    res.send(html)
  } catch (error) {
    console.error('X Error rendering sector intelligence page:', error)
    res.status(500).send(`
            <div style="padding: 2rem; text-align: center; font-family: system-ui;">
                <h1>Sector Intelligence Error</h1>
                <p style="color: #6b7280; margin: 1rem 0;">${error.message}</p>
                <a href="/" style="color: #3b82f6; text-decoration: none;"><- Back to Home</a>
            </div>
        `)
  }
}

module.exports = sectorIntelligencePage
