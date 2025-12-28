const dbService = require('../dbService')

function applyCalendarMethods(ServiceClass) {
  ServiceClass.prototype.getComplianceCalendar = async function(firmProfile = null) {
    const cacheKey = `calendar_${firmProfile ? firmProfile.firmName : 'all'}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      console.log('📅 Building compliance calendar...')

      const updates = await dbService.getAllUpdates()
      const calendar = {
        next30Days: [],
        next90Days: [],
        upcoming: []
      }

      updates.forEach(update => {
        const deadlines = this.extractDeadlines(update)
        deadlines.forEach(deadline => {
          const riskScore = this.calculateRiskScore(update, firmProfile)
          const item = {
            deadline: deadline.date,
            regulation: update.headline,
            authority: update.authority,
            impactLevel: update.impactLevel,
            riskScore,
            affectedSectors: update.primarySectors || [update.sector].filter(Boolean),
            sourceUrl: update.url,
            preparationTime: this.calculatePreparationTime(deadline, update),
            confidence: deadline.confidence,
            category: this.determineCategory(update)
          }

          const daysUntil = (new Date(deadline.date) - new Date()) / (1000 * 60 * 60 * 24)

          if (daysUntil >= 0 && daysUntil <= 30) {
            calendar.next30Days.push(item)
          } else if (daysUntil > 30 && daysUntil <= 90) {
            calendar.next90Days.push(item)
          }
        })
      })

      const predictedDeadlines = this.generatePredictedDeadlines(updates, firmProfile)
      calendar.upcoming = predictedDeadlines

      calendar.next30Days.sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      calendar.next90Days.sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      calendar.upcoming.sort((a, b) => b.confidence - a.confidence)

      const result = {
        calculatedAt: new Date().toISOString(),
        ...calendar,
        summary: {
          criticalDeadlines: calendar.next30Days.filter(d => d.riskScore >= 70).length,
          totalUpcoming: calendar.next30Days.length + calendar.next90Days.length,
          highestRisk: calendar.next30Days.reduce((max, item) =>
            item.riskScore > max.riskScore ? item : max, { riskScore: 0 })
        }
      }

      this.setCache(cacheKey, result)
      return result
    } catch (error) {
      console.error('❌ Error building compliance calendar:', error)
      throw error
    }
  }

  ServiceClass.prototype.extractDeadlines = function(update) {
    const deadlines = []
    const text = update.headline + ' ' + update.impact + ' ' + (update.keyDates || '')

    const datePatterns = [
      /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/gi,
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/g,
      /(\d{4})-(\d{1,2})-(\d{1,2})/g
    ]

    datePatterns.forEach(pattern => {
      const matches = text.match(pattern)
      if (matches) {
        matches.forEach(match => {
          const date = new Date(match)
          if (date > new Date() && date < new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)) {
            deadlines.push({
              date: date.toISOString().split('T')[0],
              confidence: 75,
              source: match
            })
          }
        })
      }
    })

    return deadlines
  }

  ServiceClass.prototype.generatePredictedDeadlines = function(updates, firmProfile) {
    return [
      {
        expectedDate: '2025-03-31',
        regulation: 'Q1 Regulatory Reporting Requirements',
        confidence: 80,
        basedOn: 'Historical quarterly patterns',
        authority: 'Multiple',
        impactLevel: 'Significant',
        affectedSectors: ['Banking', 'Investment Management']
      }
    ]
  }

  // ============================================
  // CALENDAR INSIGHTS METHODS
  // ============================================

  /**
   * Get workload distribution - events per week/month with busy period detection
   */
  ServiceClass.prototype.getCalendarWorkload = async function(options = {}) {
    const cacheKey = `calendar_workload_${options.months || 6}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      const months = options.months || 6
      const startDate = new Date()
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + months)

      const events = await dbService.getAllCalendarEvents(
        startDate.toISOString(),
        endDate.toISOString()
      )

      // Group by week
      const weeklyData = {}
      const monthlyData = {}

      events.forEach(event => {
        const date = new Date(event.eventDate)
        const weekKey = this.getISOWeek(date)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = { count: 0, critical: 0, high: 0, estimatedHours: 0 }
        }
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { count: 0, critical: 0, high: 0, estimatedHours: 0 }
        }

        weeklyData[weekKey].count++
        monthlyData[monthKey].count++

        if (event.priority === 'critical') {
          weeklyData[weekKey].critical++
          monthlyData[monthKey].critical++
        }
        if (event.priority === 'high') {
          weeklyData[weekKey].high++
          monthlyData[monthKey].high++
        }

        // Estimate effort hours
        const effortMap = {
          consultation: { low: 8, medium: 16, high: 24, critical: 40 },
          implementation: { low: 16, medium: 32, high: 48, critical: 80 },
          deadline: { low: 4, medium: 8, high: 16, critical: 24 },
          review: { low: 8, medium: 16, high: 24, critical: 32 }
        }
        const typeEffort = effortMap[event.eventType] || effortMap.deadline
        const effort = typeEffort[event.priority] || 8
        weeklyData[weekKey].estimatedHours += effort
        monthlyData[monthKey].estimatedHours += effort
      })

      // Calculate averages and identify busy periods
      const weekValues = Object.values(weeklyData)
      const avgPerWeek = weekValues.length > 0
        ? weekValues.reduce((sum, w) => sum + w.count, 0) / weekValues.length
        : 0
      const busyThreshold = avgPerWeek * 1.5

      const busyPeriods = Object.entries(weeklyData)
        .filter(([, data]) => data.count > busyThreshold)
        .map(([week, data]) => ({ week, ...data }))
        .sort((a, b) => b.count - a.count)

      const result = {
        calculatedAt: new Date().toISOString(),
        totalEvents: events.length,
        weekly: Object.entries(weeklyData)
          .map(([week, data]) => ({ week, ...data }))
          .sort((a, b) => a.week.localeCompare(b.week)),
        monthly: Object.entries(monthlyData)
          .map(([month, data]) => ({ month, ...data }))
          .sort((a, b) => a.month.localeCompare(b.month)),
        summary: {
          avgEventsPerWeek: Math.round(avgPerWeek * 10) / 10,
          busyPeriods: busyPeriods.slice(0, 5),
          peakWeek: busyPeriods[0] || null,
          totalEstimatedHours: Object.values(weeklyData).reduce((sum, w) => sum + w.estimatedHours, 0)
        }
      }

      this.setCache(cacheKey, result)
      return result
    } catch (error) {
      console.error('❌ Error calculating calendar workload:', error)
      throw error
    }
  }

  /**
   * Get impact-urgency matrix (risk prioritization)
   */
  ServiceClass.prototype.getCalendarRiskMatrix = async function(options = {}) {
    const cacheKey = 'calendar_risk_matrix'
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      const urgentDays = options.urgentDays || 30
      const startDate = new Date()
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 6)

      const events = await dbService.getAllCalendarEvents(
        startDate.toISOString(),
        endDate.toISOString()
      )

      const now = new Date()
      const matrix = {
        highImpactUrgent: [],     // Q1: Do first
        highImpactNotUrgent: [],  // Q2: Schedule
        lowImpactUrgent: [],      // Q3: Delegate
        lowImpactNotUrgent: []    // Q4: Monitor
      }

      events.forEach(event => {
        const daysUntil = (new Date(event.eventDate) - now) / (1000 * 60 * 60 * 24)
        const isUrgent = daysUntil <= urgentDays
        const isHighImpact = ['critical', 'high'].includes(event.priority)

        const eventData = {
          ...event,
          daysUntil: Math.round(daysUntil)
        }

        if (isHighImpact && isUrgent) {
          matrix.highImpactUrgent.push(eventData)
        } else if (isHighImpact && !isUrgent) {
          matrix.highImpactNotUrgent.push(eventData)
        } else if (!isHighImpact && isUrgent) {
          matrix.lowImpactUrgent.push(eventData)
        } else {
          matrix.lowImpactNotUrgent.push(eventData)
        }
      })

      // Sort each quadrant by urgency
      Object.keys(matrix).forEach(key => {
        matrix[key].sort((a, b) => a.daysUntil - b.daysUntil)
      })

      const result = {
        calculatedAt: new Date().toISOString(),
        urgentThresholdDays: urgentDays,
        matrix,
        counts: {
          highImpactUrgent: matrix.highImpactUrgent.length,
          highImpactNotUrgent: matrix.highImpactNotUrgent.length,
          lowImpactUrgent: matrix.lowImpactUrgent.length,
          lowImpactNotUrgent: matrix.lowImpactNotUrgent.length
        },
        criticalAlerts: matrix.highImpactUrgent.filter(e => e.daysUntil <= 7)
      }

      this.setCache(cacheKey, result)
      return result
    } catch (error) {
      console.error('❌ Error calculating risk matrix:', error)
      throw error
    }
  }

  /**
   * Get authority activity trends
   */
  ServiceClass.prototype.getAuthorityActivityTrends = async function(options = {}) {
    const cacheKey = `authority_activity_${options.months || 12}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      const months = options.months || 12
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - months)
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 6)

      const events = await dbService.getAllCalendarEvents(
        startDate.toISOString(),
        endDate.toISOString()
      )

      // Group by authority and month
      const authorityData = {}

      events.forEach(event => {
        const authority = event.authority || 'Unknown'
        const date = new Date(event.eventDate)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

        if (!authorityData[authority]) {
          authorityData[authority] = { monthly: {}, total: 0, critical: 0, high: 0 }
        }

        if (!authorityData[authority].monthly[monthKey]) {
          authorityData[authority].monthly[monthKey] = 0
        }

        authorityData[authority].monthly[monthKey]++
        authorityData[authority].total++

        if (event.priority === 'critical') authorityData[authority].critical++
        if (event.priority === 'high') authorityData[authority].high++
      })

      // Calculate trends
      const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
      const prevMonth = new Date()
      prevMonth.setMonth(prevMonth.getMonth() - 1)
      const prevMonthKey = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`

      const authorities = Object.entries(authorityData).map(([authority, data]) => {
        const currentMonthCount = data.monthly[currentMonth] || 0
        const prevMonthCount = data.monthly[prevMonthKey] || 0

        let trend = 'stable'
        let monthOverMonth = 0

        if (prevMonthCount > 0) {
          monthOverMonth = ((currentMonthCount - prevMonthCount) / prevMonthCount) * 100
          if (monthOverMonth > 10) trend = 'increasing'
          else if (monthOverMonth < -10) trend = 'decreasing'
        } else if (currentMonthCount > 0) {
          trend = 'increasing'
          monthOverMonth = 100
        }

        return {
          authority,
          eventsThisMonth: currentMonthCount,
          total: data.total,
          critical: data.critical,
          high: data.high,
          trend,
          monthOverMonth: Math.round(monthOverMonth)
        }
      }).sort((a, b) => b.total - a.total)

      const result = {
        calculatedAt: new Date().toISOString(),
        authorities,
        mostActive: authorities[0]?.authority || null,
        trending: authorities.filter(a => a.trend === 'increasing').map(a => a.authority).slice(0, 3),
        summary: {
          totalAuthorities: authorities.length,
          withCriticalEvents: authorities.filter(a => a.critical > 0).length
        }
      }

      this.setCache(cacheKey, result)
      return result
    } catch (error) {
      console.error('❌ Error calculating authority trends:', error)
      throw error
    }
  }

  /**
   * Get sector exposure analysis
   */
  ServiceClass.prototype.getSectorExposure = async function(options = {}) {
    const cacheKey = `sector_exposure_${(options.sectors || []).join('_')}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      const startDate = new Date()
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 6)

      const events = await dbService.getAllCalendarEvents(
        startDate.toISOString(),
        endDate.toISOString()
      )

      // Group by sector
      const sectorData = {}

      events.forEach(event => {
        const sectors = Array.isArray(event.sector) ? event.sector : [event.sector || 'General']

        sectors.forEach(sector => {
          if (!sectorData[sector]) {
            sectorData[sector] = { total: 0, critical: 0, high: 0, medium: 0, low: 0 }
          }

          sectorData[sector].total++
          sectorData[sector][event.priority || 'medium']++
        })
      })

      // Calculate risk scores
      const sectors = Object.entries(sectorData).map(([sector, data]) => {
        // Risk score: weighted by priority
        const riskScore = Math.min(100, Math.round(
          (data.critical * 25) + (data.high * 15) + (data.medium * 5) + (data.low * 1)
        ))

        return {
          sector,
          totalEvents: data.total,
          criticalEvents: data.critical,
          highEvents: data.high,
          riskScore
        }
      }).sort((a, b) => b.riskScore - a.riskScore)

      // Filter by requested sectors if specified
      const filteredSectors = options.sectors?.length
        ? sectors.filter(s => options.sectors.some(fs =>
            s.sector.toLowerCase().includes(fs.toLowerCase())
          ))
        : sectors

      const result = {
        calculatedAt: new Date().toISOString(),
        sectors: filteredSectors,
        overallExposure: events.length,
        highestRiskSector: filteredSectors[0] || null,
        summary: {
          totalSectors: filteredSectors.length,
          sectorsWithCritical: filteredSectors.filter(s => s.criticalEvents > 0).length
        }
      }

      this.setCache(cacheKey, result)
      return result
    } catch (error) {
      console.error('❌ Error calculating sector exposure:', error)
      throw error
    }
  }

  /**
   * Get calendar insights summary (dashboard widget)
   */
  ServiceClass.prototype.getCalendarInsightsSummary = async function() {
    const cacheKey = 'calendar_insights_summary'
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      const now = new Date()
      const next7Days = new Date()
      next7Days.setDate(next7Days.getDate() + 7)
      const next30Days = new Date()
      next30Days.setDate(next30Days.getDate() + 30)

      const events = await dbService.getAllCalendarEvents(
        now.toISOString(),
        next30Days.toISOString()
      )

      // Critical events next 7 days
      const criticalNext7 = events.filter(e => {
        const eventDate = new Date(e.eventDate)
        return eventDate <= next7Days && ['critical', 'high'].includes(e.priority)
      })

      // Calculate busy weeks
      const weekCounts = {}
      events.forEach(e => {
        const week = this.getISOWeek(new Date(e.eventDate))
        weekCounts[week] = (weekCounts[week] || 0) + 1
      })

      const avgPerWeek = Object.values(weekCounts).reduce((a, b) => a + b, 0) / Math.max(Object.keys(weekCounts).length, 1)
      const busyWeeks = Object.entries(weekCounts)
        .filter(([, count]) => count > avgPerWeek * 1.5)
        .sort((a, b) => b[1] - a[1])

      const result = {
        calculatedAt: new Date().toISOString(),
        alerts: {
          criticalNext7Days: criticalNext7.length,
          highPriorityTotal: events.filter(e => e.priority === 'high').length,
          busyPeriodWarning: busyWeeks.length > 0
            ? `Week ${busyWeeks[0][0].split('-W')[1]} has ${busyWeeks[0][1]} events`
            : null
        },
        upcoming: {
          total: events.length,
          byPriority: {
            critical: events.filter(e => e.priority === 'critical').length,
            high: events.filter(e => e.priority === 'high').length,
            medium: events.filter(e => e.priority === 'medium').length,
            low: events.filter(e => e.priority === 'low').length
          }
        },
        topCritical: criticalNext7.slice(0, 5)
      }

      this.setCache(cacheKey, result)
      return result
    } catch (error) {
      console.error('❌ Error getting calendar insights summary:', error)
      throw error
    }
  }

  /**
   * Helper: Get ISO week string
   */
  ServiceClass.prototype.getISOWeek = function(date) {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() + 4 - (d.getDay() || 7))
    const yearStart = new Date(d.getFullYear(), 0, 1)
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
    return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`
  }
}

module.exports = applyCalendarMethods
