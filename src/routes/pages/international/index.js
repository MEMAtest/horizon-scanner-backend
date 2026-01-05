const { getSidebar } = require('../../templates/sidebar')
const { getAuthorityDisplayName } = require('../../../utils/authorityRegistry')
const dbService = require('../../../services/dbService')
const { renderInternationalPage } = require('./template')

const internationalPage = async (req, res) => {
  try {
    const region = req.query.region || null
    const country = req.query.country || null
    const authority = req.query.authority || null
    const impact = req.query.impact || null
    const search = req.query.search || null
    const range = req.query.range || null

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
      filters.region = ['Americas', 'Europe', 'Asia-Pacific', 'Africa', 'International']
    }

    // If specific country requested
    if (country) {
      filters.country = country
    }

    // If specific authority requested
    if (authority) {
      filters.authority = authority
    }

    // If impact level filter
    if (impact) {
      filters.impactLevel = impact
    }

    // If search query
    if (search) {
      filters.search = search
    }

    // Date range filter
    if (range) {
      const now = new Date()
      let startDate
      switch (range) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0))
          break
        case '3d':
          startDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
          break
        case '7d':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30d':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          break
      }
      if (startDate) {
        filters.startDate = startDate
      }
    }

    // Get international updates
    const updates = await dbService.getEnhancedUpdates(filters)

    // Get all international updates for stats
    const allInternational = await dbService.getEnhancedUpdates({
      region: ['Americas', 'Europe', 'Asia-Pacific', 'Africa', 'International'],
      limit: 1000
    })

    // UK authorities to exclude from international charts
    const UK_AUTHORITIES = ['FCA', 'PRA', 'BoE', 'Bank of England', 'FSCS', 'FOS', 'TPR', 'ICO', 'SFO', 'JMLSG', 'FRC', 'LSE', 'Aquis Exchange']

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const countryStats = {}
    const authorityCounts = {}
    const internationalAuthorityCounts = {} // For charts - excludes UK
    const topicCounts = {} // For topic/category chart
    let thisWeek = 0
    let highImpact = 0

    for (const update of allInternational) {
      const updateCountry = update.country || 'Unknown'
      const updateRegion = update.region || 'Unknown'
      const updateAuthority = update.authority || 'Unknown'
      const isUK = updateCountry === 'UK' || UK_AUTHORITIES.includes(updateAuthority)

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

      // Count authorities (all)
      authorityCounts[updateAuthority] = (authorityCounts[updateAuthority] || 0) + 1

      // Count international authorities only (for charts)
      if (!isUK) {
        internationalAuthorityCounts[updateAuthority] = (internationalAuthorityCounts[updateAuthority] || 0) + 1

        // Count topics/categories for international updates
        const topic = update.content_type || update.contentType || update.sector || 'General'
        topicCounts[topic] = (topicCounts[topic] || 0) + 1
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

    // Chart data - Region distribution (exclude UK)
    const regionDistribution = {}
    for (const update of allInternational) {
      const updateCountry = update.country || 'Unknown'
      const updateAuthority = update.authority || 'Unknown'
      const isUK = updateCountry === 'UK' || UK_AUTHORITIES.includes(updateAuthority)
      if (!isUK) {
        const r = update.region || 'Unknown'
        regionDistribution[r] = (regionDistribution[r] || 0) + 1
      }
    }

    // Chart data - Top 10 international authorities (excludes UK)
    const topAuthorities = Object.entries(internationalAuthorityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    // Chart data - Topic/Category distribution
    const topTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)

    // Chart data - 30-day trend (international only)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const trendData = {}
    for (let i = 0; i < 30; i++) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const key = d.toISOString().split('T')[0]
      trendData[key] = 0
    }
    for (const update of allInternational) {
      const updateCountry = update.country || 'Unknown'
      const updateAuthority = update.authority || 'Unknown'
      const isUK = updateCountry === 'UK' || UK_AUTHORITIES.includes(updateAuthority)
      if (!isUK) {
        const updateDate = new Date(update.published_date || update.publishedDate || update.fetchedDate)
        if (updateDate >= thirtyDaysAgo) {
          const key = updateDate.toISOString().split('T')[0]
          if (trendData.hasOwnProperty(key)) {
            trendData[key]++
          }
        }
      }
    }

    // Chart data objects
    const chartData = {
      regionDistribution,
      topAuthorities,
      topTopics,
      trendData: Object.entries(trendData).sort((a, b) => a[0].localeCompare(b[0]))
    }

    // Build filter options for dropdowns
    const filterOptions = {
      countries: Object.entries(countryStats)
        .map(([name, data]) => ({ name, count: data.total }))
        .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })),
      authorities: Object.entries(authorityCounts)
        .map(([name, count]) => ({
          name,
          count,
          label: getAuthorityDisplayName(name)
        }))
        .sort((a, b) => a.label.localeCompare(b.label, 'en', { sensitivity: 'base' }))
    }

    // Current filter state for form
    const currentFilters = {
      region: region || '',
      country: country || '',
      authority: authority || '',
      impact: impact || '',
      search: search || '',
      range: range || ''
    }

    const html = renderInternationalPage({
      sidebar,
      region,
      country,
      stats,
      countryStats,
      updates,
      filterOptions,
      currentFilters,
      chartData
    })

    res.send(html)
  } catch (error) {
    console.error('Error rendering international page:', error)
    res.status(500).send(`
      <div style="padding: 2rem; text-align: center; font-family: system-ui;">
        <h1>International Updates Error</h1>
        <p style="color: #6b7280; margin: 1rem 0;">${error.message}</p>
        <a href="/" style="color: #3b82f6; text-decoration: none;">&larr; Back to Home</a>
      </div>
    `)
  }
}

module.exports = internationalPage
