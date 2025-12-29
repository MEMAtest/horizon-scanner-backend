function normalizeImpactLevel(rawImpact) {
  if (!rawImpact) return 'medium'

  const impact = String(rawImpact).toLowerCase().trim()

  // Map various formats to standard high/medium/low
  const highValues = ['high', 'significant', 'critical', 'severe', '3', 'major']
  const lowValues = ['low', 'informational', 'minor', 'negligible', '1', 'minimal']

  if (highValues.includes(impact)) return 'high'
  if (lowValues.includes(impact)) return 'low'

  // Default to medium for: medium, moderate, normal, 2, etc.
  return 'medium'
}

function calculateAnalytics(updates) {
  // Ensure updates is always an array
  const safeUpdates = Array.isArray(updates) ? updates : []

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  // Monthly data for the last 12 months
  const monthlyData = {}
  const authorityData = {}
  const sectorData = {}
  const impactData = { high: 0, medium: 0, low: 0 }

  safeUpdates.forEach(update => {
    const date = new Date(update.published_date || update.created_at)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    // Monthly counts
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { total: 0, high: 0, medium: 0, low: 0 }
    }
    monthlyData[monthKey].total++
    const impact = normalizeImpactLevel(update.impact_level)
    if (monthlyData[monthKey][impact] !== undefined) {
      monthlyData[monthKey][impact]++
    }

    // Authority counts
    const authority = update.authority || 'Unknown'
    if (!authorityData[authority]) {
      authorityData[authority] = { total: 0, recent: 0 }
    }
    authorityData[authority].total++
    if (date >= thirtyDaysAgo) {
      authorityData[authority].recent++
    }

    // Sector counts
    const sector = update.sector || 'General'
    if (!sectorData[sector]) {
      sectorData[sector] = { total: 0, recent: 0 }
    }
    sectorData[sector].total++
    if (date >= thirtyDaysAgo) {
      sectorData[sector].recent++
    }

    // Impact distribution (use normalized impact)
    const impactForDist = normalizeImpactLevel(update.impact_level)
    if (impactData[impactForDist] !== undefined) {
      impactData[impactForDist]++
    }
  })

  // Sort monthly data and get last 12 months
  const sortedMonths = Object.keys(monthlyData).sort().slice(-12)
  const monthlyChartData = sortedMonths.map(key => ({
    month: key,
    ...monthlyData[key]
  }))

  // Get top authorities
  const topAuthorities = Object.entries(authorityData)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10)
    .map(([name, data]) => ({ name, ...data }))

  // Get top sectors
  const topSectors = Object.entries(sectorData)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10)
    .map(([name, data]) => ({ name, ...data }))

  // Calculate velocity (change in last 30 days vs previous 30 days)
  const last30Days = safeUpdates.filter(u => new Date(u.published_date || u.created_at) >= thirtyDaysAgo).length
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
  const previous30Days = safeUpdates.filter(u => {
    const date = new Date(u.published_date || u.created_at)
    return date >= sixtyDaysAgo && date < thirtyDaysAgo
  }).length
  const velocityChange = previous30Days > 0 ? Math.round(((last30Days - previous30Days) / previous30Days) * 100) : 0

  // NEW: Calculate sector compliance burden (avg publications per month)
  const sectorBurden = Object.entries(sectorData)
    .map(([name, data]) => ({
      name,
      total: data.total,
      recent: data.recent,
      avgPerMonth: Math.round(data.total / 12), // Assume 12 months of data
      percentOfTotal: Math.round((data.total / safeUpdates.length) * 100)
    }))
    .sort((a, b) => b.avgPerMonth - a.avgPerMonth)
    .slice(0, 15)

  // NEW: Calculate weekly activity heatmap for authorities
  const weeklyActivity = {}
  const weeksAgo = (weeks) => new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000)

  for (let i = 0; i < 12; i++) {
    const weekStart = weeksAgo(i + 1)
    const weekEnd = weeksAgo(i)
    const weekKey = `Week ${12 - i}`

    weeklyActivity[weekKey] = {}
    safeUpdates.forEach(update => {
      const date = new Date(update.published_date || update.created_at)
      if (date >= weekStart && date < weekEnd) {
        const auth = update.authority || 'Unknown'
        weeklyActivity[weekKey][auth] = (weeklyActivity[weekKey][auth] || 0) + 1
      }
    })
  }

  // NEW: Impact severity trends over time
  const impactTrends = sortedMonths.map(monthKey => {
    const data = monthlyData[monthKey]
    return {
      month: monthKey,
      highCount: data.high,
      mediumCount: data.medium,
      lowCount: data.low,
      highPercentage: Math.round((data.high / data.total) * 100),
      severityScore: (data.high * 3 + data.medium * 2 + data.low * 1) / data.total
    }
  })

  // NEW: Authority comparison data
  const authorityComparison = Object.entries(authorityData)
    .map(([name, data]) => ({
      name,
      total: data.total,
      recent: data.recent,
      trend: data.recent > (data.total / 12) ? 'increasing' : 'decreasing',
      marketShare: Math.round((data.total / safeUpdates.length) * 100),
      velocity: data.recent - Math.round(data.total / 12)
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  // NEW: Sector cross-analysis (which sectors are most active together)
  const sectorPairs = {}
  safeUpdates.forEach(update => {
    const sector = update.sector || 'General'
    const authority = update.authority || 'Unknown'
    const key = `${sector}|${authority}`
    sectorPairs[key] = (sectorPairs[key] || 0) + 1
  })

  const topSectorAuthorityPairs = Object.entries(sectorPairs)
    .map(([key, count]) => {
      const [sector, authority] = key.split('|')
      return { sector, authority, count }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)

  // NEW: Publication velocity metrics
  const velocityMetrics = {
    current30Days: last30Days,
    previous30Days,
    change: velocityChange,
    avgPerDay: Math.round(last30Days / 30),
    peakDay: 0, // Would need daily data
    projection90Days: Math.round(last30Days * 3 * (1 + velocityChange / 100))
  }

  return {
    summary: {
      totalUpdates: safeUpdates.length,
      last30Days,
      last90Days: safeUpdates.filter(u => new Date(u.published_date || u.created_at) >= ninetyDaysAgo).length,
      velocityChange,
      highImpact: impactData.high,
      activeAuthorities: Object.keys(authorityData).length,
      activeSectors: Object.keys(sectorData).length
    },
    monthlyChartData,
    topAuthorities,
    topSectors,
    impactDistribution: impactData,
    // NEW ANALYTICS DATA
    sectorBurden,
    weeklyActivity,
    impactTrends,
    authorityComparison,
    topSectorAuthorityPairs,
    velocityMetrics
  }
}

module.exports = { normalizeImpactLevel, calculateAnalytics }
