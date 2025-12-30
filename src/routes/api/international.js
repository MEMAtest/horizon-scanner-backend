const { feedSources } = require('../../services/rss/config')

function registerInternationalRoutes(router) {
  // Get international updates with region/country filtering
  router.get('/international/updates', async (req, res) => {
    try {
      const dbService = req.app.locals.dbService
      if (!dbService) {
        return res.status(500).json({
          success: false,
          error: 'Database service not available'
        })
      }

      const filters = {
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0
      }

      // Region filter (Americas, Europe, Asia-Pacific, International)
      if (req.query.region) {
        filters.region = req.query.region.split(',').map(r => r.trim()).filter(Boolean)
      }

      // Country filter
      if (req.query.country) {
        filters.country = req.query.country.split(',').map(c => c.trim()).filter(Boolean)
      }

      // Authority filter
      if (req.query.authority) {
        filters.authority = req.query.authority.split(',').map(a => a.trim()).filter(Boolean)
      }

      // Sector filter
      if (req.query.sector) {
        filters.sector = req.query.sector.split(',').map(s => s.trim()).filter(Boolean)
      }

      // Date range
      if (req.query.range) {
        filters.range = req.query.range
      }

      // Exclude UK updates for international page
      if (req.query.excludeUK === 'true') {
        // Filter out UK when getting international only
        if (!filters.region) {
          filters.region = ['Americas', 'Europe', 'Asia-Pacific', 'International']
        }
      }

      const updates = await dbService.getEnhancedUpdates(filters)

      res.json({
        success: true,
        total: updates.length,
        filters: {
          region: filters.region || null,
          country: filters.country || null,
          authority: filters.authority || null
        },
        updates
      })
    } catch (error) {
      console.error('[international] Failed to get updates:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  // Get statistics by region and country
  router.get('/international/stats', async (req, res) => {
    try {
      const dbService = req.app.locals.dbService
      if (!dbService) {
        return res.status(500).json({
          success: false,
          error: 'Database service not available'
        })
      }

      // Get all updates to calculate stats
      const allUpdates = await dbService.getEnhancedUpdates({ limit: 10000 })

      // Calculate stats by region
      const regionStats = {}
      const countryStats = {}
      const authorityStats = {}

      for (const update of allUpdates) {
        const region = update.region || 'UK'
        const country = update.country || 'UK'
        const authority = update.authority || 'Unknown'

        // Region stats
        if (!regionStats[region]) {
          regionStats[region] = { total: 0, thisWeek: 0, highImpact: 0 }
        }
        regionStats[region].total++

        // Check if within last 7 days
        const updateDate = new Date(update.publishedDate || update.published_date || update.fetchedDate)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        if (updateDate >= weekAgo) {
          regionStats[region].thisWeek++
        }

        // High impact check
        if (update.impact_level === 'Significant' || update.impactLevel === 'Significant' ||
            (update.business_impact_score || 0) >= 7 || update.urgency === 'High') {
          regionStats[region].highImpact++
        }

        // Country stats
        if (!countryStats[country]) {
          countryStats[country] = { total: 0, region, authorities: new Set() }
        }
        countryStats[country].total++
        countryStats[country].authorities.add(authority)

        // Authority stats (for non-UK)
        if (region !== 'UK') {
          if (!authorityStats[authority]) {
            authorityStats[authority] = { total: 0, country, region }
          }
          authorityStats[authority].total++
        }
      }

      // Convert Sets to arrays for JSON serialization
      for (const country of Object.keys(countryStats)) {
        countryStats[country].authorities = Array.from(countryStats[country].authorities)
      }

      res.json({
        success: true,
        stats: {
          byRegion: regionStats,
          byCountry: countryStats,
          byAuthority: authorityStats,
          totals: {
            international: allUpdates.filter(u => (u.region || 'UK') !== 'UK').length,
            uk: allUpdates.filter(u => (u.region || 'UK') === 'UK').length
          }
        }
      })
    } catch (error) {
      console.error('[international] Failed to get stats:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  // Get list of international authorities from config
  router.get('/international/authorities', async (req, res) => {
    try {
      // Group authorities by region and country from feed sources config
      const authorities = {}

      for (const source of feedSources) {
        if (!source.country || source.country === 'UK') continue
        if (source.priority === 'disabled') continue

        const region = source.region || 'Other'
        const country = source.country

        if (!authorities[region]) {
          authorities[region] = {}
        }
        if (!authorities[region][country]) {
          authorities[region][country] = []
        }

        // Check if authority already added
        const existing = authorities[region][country].find(a => a.id === source.authority)
        if (!existing) {
          authorities[region][country].push({
            id: source.authority,
            name: source.name,
            description: source.description,
            sectors: source.sectors || [],
            type: source.type
          })
        }
      }

      res.json({
        success: true,
        authorities,
        regions: Object.keys(authorities),
        countries: Object.values(authorities).flatMap(region =>
          Object.keys(region)
        ).filter((v, i, a) => a.indexOf(v) === i)
      })
    } catch (error) {
      console.error('[international] Failed to get authorities:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  // Get sources configuration for international regulators
  router.get('/international/sources', async (req, res) => {
    try {
      const sources = feedSources
        .filter(source => source.country && source.country !== 'UK' && source.priority !== 'disabled')
        .map(source => ({
          name: source.name,
          authority: source.authority,
          country: source.country,
          region: source.region,
          type: source.type,
          sectors: source.sectors,
          description: source.description
        }))

      // Group by region
      const byRegion = {}
      for (const source of sources) {
        const region = source.region || 'Other'
        if (!byRegion[region]) {
          byRegion[region] = []
        }
        byRegion[region].push(source)
      }

      res.json({
        success: true,
        total: sources.length,
        byRegion,
        sources
      })
    } catch (error) {
      console.error('[international] Failed to get sources:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })
}

module.exports = registerInternationalRoutes
