const { PREVIOUS_WINDOW_DAYS, RECENT_WINDOW_DAYS } = require('./constants')

function applyMomentumMethods(ServiceClass) {
  ServiceClass.prototype.buildMomentumIndicators = function({ topicStats, authorityStats, sectorStats, now }) {
    const authorityMomentum = Array.from(authorityStats.values()).map(stats => {
      const changePercent = stats.previous > 0 ? ((stats.recent - stats.previous) / stats.previous) * 100 : stats.recent * 100
      const level = changePercent > 80 ? 'accelerating' : changePercent > 0 ? 'increasing' : changePercent < -30 ? 'decreasing' : 'stable'
      return {
        authority: stats.authority,
        changePercent: Math.round(changePercent),
        recent: stats.recent,
        previous: stats.previous,
        level,
        severity: this.classifyChangeSeverity(Math.round(changePercent))
      }
    })
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 6)

    const topicMomentum = []
    topicStats.forEach((stats, keyword) => {
      const metrics = this.calculateTopicMetrics(stats, now)
      if (!metrics) return
      topicMomentum.push({
        keyword,
        acceleration: metrics.acceleration,
        recent: metrics.recent,
        coordination: metrics.coordinationDetected
      })
    })

    const topTopics = topicMomentum
      .filter(item => item.recent >= 2)
      .sort((a, b) => b.acceleration - a.acceleration)
      .slice(0, 6)
      .map(item => ({
        keyword: item.keyword,
        acceleration: Math.round(item.acceleration * 10) / 10,
        recent: item.recent,
        coordination: item.coordination,
        severity: this.classifyAccelerationSeverity(item.acceleration)
      }))

    const sectorMomentum = Array.from(sectorStats.values()).map(stats => {
      const recent = stats.counts.recent
      const previous = stats.counts.previous
      const changePercent = previous > 0 ? ((recent - previous) / previous) * 100 : recent * 100
      return {
        sector: stats.sector,
        recent,
        previous,
        changePercent: Math.round(changePercent),
        severity: this.classifyChangeSeverity(Math.round(changePercent))
      }
    })
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 6)

    return {
      authorities: authorityMomentum,
      topics: topTopics,
      sectors: sectorMomentum
    }
  }

  ServiceClass.prototype.buildPatternAlerts = function({ topicStats, authorityStats, sectorStats, now }) {
    const alerts = []

    authorityStats.forEach(stats => {
      const changePercent = stats.previous > 0 ? ((stats.recent - stats.previous) / stats.previous) * 100 : stats.recent * 100
      if (changePercent > 150 && stats.recent >= 4) {
        alerts.push({
          type: 'authority-velocity',
          severity: changePercent > 250 ? 'critical' : 'high',
          message: `${stats.authority} publishing rate is ${Math.round(changePercent)}% above normal.`
        })
      }
    })

    topicStats.forEach((stats, keyword) => {
      const metrics = this.calculateTopicMetrics(stats, now)
      if (!metrics) return
      if (metrics.coordinationDetected) {
        alerts.push({
          type: 'coordination',
          severity: metrics.urgency === 'CRITICAL' ? 'critical' : 'high',
          message: `Coordination detected: ${metrics.coordinationAuthorities.join(' & ')} referenced the theme within 10 days.`
        })
      }
      if (metrics.isEmerging && metrics.acceleration >= 1.2) {
        alerts.push({
          type: 'emergence',
          severity: 'medium',
          message: `Emerging theme: ${keyword} appearing for the first time in past month.`
        })
      }
    })

    return alerts.slice(0, 10)
  }

  ServiceClass.prototype.calculateConfidence = function(recentCount, totalCount) {
    if (totalCount === 0) return 0
    const stability = Math.min(1, recentCount / Math.max(1, totalCount / 10))
    return Math.round(40 + 50 * stability)
  }
}

module.exports = applyMomentumMethods
