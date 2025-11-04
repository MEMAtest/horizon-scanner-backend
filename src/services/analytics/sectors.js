const dbService = require('../dbService')

function applySectorMethods(ServiceClass) {
  ServiceClass.prototype.getSectorHotspots = async function(firmProfile = null) {
    const cacheKey = `sector_hotspots_${firmProfile ? firmProfile.firmName : 'all'}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      console.log('🔥 Analyzing sector hotspots...')

      const updates = await dbService.getAllUpdates()
      const last30Days = new Date()
      last30Days.setDate(last30Days.getDate() - 30)

      const recentUpdates = updates.filter(update =>
        new Date(update.fetchedDate) >= last30Days
      )

      const sectorActivity = {}
      const sectorImpact = {}

      recentUpdates.forEach(update => {
        const sectors = update.primarySectors || [update.sector].filter(Boolean)
        const impactScore = this.getImpactScore(update)

        sectors.forEach(sector => {
          if (!sector || sector === 'N/A') return

          sectorActivity[sector] = (sectorActivity[sector] || 0) + 1
          sectorImpact[sector] = (sectorImpact[sector] || 0) + impactScore
        })
      })

      const hotspots = Object.keys(sectorActivity).map(sector => {
        const activityCount = sectorActivity[sector]
        const totalImpact = sectorImpact[sector]
        const avgImpact = totalImpact / activityCount

        const activityScore = Math.min(100, (activityCount * 10) + (avgImpact * 30))

        let riskLevel = 'low'
        if (activityScore >= 70) riskLevel = 'high'
        else if (activityScore >= 40) riskLevel = 'medium'

        const isUserSector = firmProfile && firmProfile.primarySectors &&
                    firmProfile.primarySectors.includes(sector)

        return {
          sector,
          activityScore: Math.round(activityScore),
          riskLevel,
          updateCount: activityCount,
          averageImpact: Math.round(avgImpact * 10) / 10,
          isUserSector,
          trend: this.calculateSectorTrend(sector, updates),
          keyTopics: this.extractSectorTopics(sector, recentUpdates)
        }
      })
        .sort((a, b) => b.activityScore - a.activityScore)
        .slice(0, 10)

      const result = {
        calculatedAt: new Date().toISOString(),
        sectorHotspots: hotspots,
        firmProfile,
        summary: this.generateHotspotSummary(hotspots, firmProfile)
      }

      this.setCache(cacheKey, result)
      return result
    } catch (error) {
      console.error('❌ Error analyzing sector hotspots:', error)
      throw error
    }
  }

  ServiceClass.prototype.calculateSectorTrend = function(sector, updates) {
    const last30Days = new Date()
    last30Days.setDate(last30Days.getDate() - 30)
    const last60Days = new Date()
    last60Days.setDate(last60Days.getDate() - 60)

    const recent = updates.filter(update =>
      new Date(update.fetchedDate) >= last30Days &&
            (update.primarySectors || []).includes(sector)
    ).length

    const previous = updates.filter(update =>
      new Date(update.fetchedDate) >= last60Days &&
            new Date(update.fetchedDate) < last30Days &&
            (update.primarySectors || []).includes(sector)
    ).length

    if (recent > previous * 1.2) return 'increasing'
    if (recent < previous * 0.8) return 'decreasing'
    return 'stable'
  }

  ServiceClass.prototype.extractSectorTopics = function(sector, updates) {
    const sectorUpdates = updates.filter(update =>
      (update.primarySectors || []).includes(sector)
    )

    const keywords = {}
    sectorUpdates.forEach(update => {
      const text = (update.headline + ' ' + update.impact).toLowerCase()
      const words = text.match(/\b[a-z]{4,}\b/g) || []
      words.forEach(word => {
        if (!['that', 'this', 'with', 'from', 'they', 'have', 'will', 'been', 'were'].includes(word)) {
          keywords[word] = (keywords[word] || 0) + 1
        }
      })
    })

    return Object.entries(keywords)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([word]) => word)
  }

  ServiceClass.prototype.generateHotspotSummary = function(hotspots, firmProfile) {
    const userHotspots = firmProfile ? hotspots.filter(h => h.isUserSector) : []
    const highRisk = hotspots.filter(h => h.riskLevel === 'high')

    return {
      totalHotspots: hotspots.length,
      highRiskSectors: highRisk.length,
      userSectorHotspots: userHotspots.length,
      topSector: hotspots[0]?.sector || 'None'
    }
  }
}

module.exports = applySectorMethods
