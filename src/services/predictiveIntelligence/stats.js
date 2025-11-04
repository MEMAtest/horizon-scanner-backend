const { RECENT_WINDOW_DAYS, PREVIOUS_WINDOW_DAYS } = require('./constants')

function applyStatsMethods(ServiceClass) {
  ServiceClass.prototype.buildTopicStats = function(updates, now) {
    const topicStats = new Map()

    updates.forEach(update => {
      const weekStart = this.startOfWeek(update.parsedDate)
      const weekKey = weekStart.toISOString().slice(0, 10)

      const authorities = new Set([update.authority || 'Unknown'])
      const sectors = update.sectors.length ? update.sectors : ['General']

      update.tokens.forEach(token => {
        if (!topicStats.has(token)) {
          topicStats.set(token, {
            keyword: token,
            weeks: new Map(),
            authorities: new Map(),
            sectors: new Map(),
            firstSeen: update.parsedDate,
            lastSeen: update.parsedDate,
            stages: {
              consultation: [],
              proposal: [],
              final: [],
              enforcement: [],
              informal: []
            },
            mentions: [],
            deadlines: []
          })
        }

        const stats = topicStats.get(token)
        stats.firstSeen = update.parsedDate < stats.firstSeen ? update.parsedDate : stats.firstSeen
        stats.lastSeen = update.parsedDate > stats.lastSeen ? update.parsedDate : stats.lastSeen

        stats.weeks.set(weekKey, (stats.weeks.get(weekKey) || 0) + 1)

        authorities.forEach(authority => {
          if (!stats.authorities.has(authority)) {
            stats.authorities.set(authority, { total: 0, recent: 0 })
          }
          const record = stats.authorities.get(authority)
          record.total += 1
          if (this.daysBetween(now, update.parsedDate) <= RECENT_WINDOW_DAYS) {
            record.recent += 1
          }
        })

        sectors.forEach(sector => {
          stats.sectors.set(sector, (stats.sectors.get(sector) || 0) + 1)
        })

        if (stats.stages[update.stage]) {
          stats.stages[update.stage].push(update.parsedDate)
        }

        if (update.deadline) {
          stats.deadlines.push(update.deadline)
        }

        if (stats.mentions.length < 10) {
          stats.mentions.push({
            date: update.parsedDate,
            authority: update.authority || 'Unknown',
            headline: update.headline,
            summary: update.ai_summary || update.summary || '',
            stage: update.stage,
            urgency: update.urgency || 'Low',
            url: update.url || update.link || update.source_url || update.sourceUrl || null,
            confidence: update.ai_confidence_score ? Math.round(update.ai_confidence_score * 100) : null
          })
        }
      })
    })

    return topicStats
  }

  ServiceClass.prototype.buildAuthorityStats = function(updates, now) {
    const authorityStats = new Map()

    updates.forEach(update => {
      const authority = update.authority || 'Unknown'
      if (!authorityStats.has(authority)) {
        authorityStats.set(authority, {
          authority,
          total: 0,
          recent: 0,
          previous: 0,
          monthlyCounts: new Array(12).fill(0),
          consultationDates: [],
          finalDates: [],
          enforcementDates: []
        })
      }

      const stats = authorityStats.get(authority)
      stats.total += 1
      const diff = this.daysBetween(now, update.parsedDate)
      if (diff <= RECENT_WINDOW_DAYS) stats.recent += 1
      else if (diff <= PREVIOUS_WINDOW_DAYS) stats.previous += 1

      stats.monthlyCounts[update.parsedDate.getMonth()] += 1

      if (update.stage === 'consultation') stats.consultationDates.push(update.parsedDate)
      if (update.stage === 'final') stats.finalDates.push(update.parsedDate)
      if (update.stage === 'enforcement') stats.enforcementDates.push(update.parsedDate)
    })

    authorityStats.forEach(stats => {
      stats.consultationToFinalAvg = this.calculateStageLag(stats.consultationDates, stats.finalDates)
      stats.consultationToEnforcementAvg = this.calculateStageLag(stats.consultationDates, stats.enforcementDates)
    })

    return authorityStats
  }

  ServiceClass.prototype.buildSectorStats = function(updates, now) {
    const sectorStats = new Map()

    updates.forEach(update => {
      const diff = this.daysBetween(now, update.parsedDate)
      const bucket = diff <= RECENT_WINDOW_DAYS ? 'recent' : diff <= PREVIOUS_WINDOW_DAYS ? 'previous' : 'older'
      update.sectors.forEach(sector => {
        if (!sectorStats.has(sector)) {
          sectorStats.set(sector, { sector, counts: { recent: 0, previous: 0, older: 0 } })
        }
        sectorStats.get(sector).counts[bucket] += 1
      })
    })

    return sectorStats
  }

  ServiceClass.prototype.calculateStageLag = function(startDates, endDates) {
    if (!startDates.length || !endDates.length) return null
    const sortedStarts = [...startDates].sort((a, b) => a - b)
    const sortedEnds = [...endDates].sort((a, b) => a - b)
    const lags = []
    sortedStarts.forEach(start => {
      const end = sortedEnds.find(date => date > start)
      if (end) {
        lags.push(this.daysBetween(end, start))
      }
    })
    if (!lags.length) return null
    const avg = lags.reduce((sum, val) => sum + val, 0) / lags.length
    return Math.round(avg)
  }
}

module.exports = applyStatsMethods
