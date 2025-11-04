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
}

module.exports = applyCalendarMethods
