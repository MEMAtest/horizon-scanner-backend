/**
 * Dear CEO Letter Theme Trend Service
 *
 * Tracks regulatory themes over 5 years to identify:
 * - Emerging themes (new focus areas)
 * - Persistent themes (ongoing supervisory priorities)
 * - Declining themes (resolved or deprioritized areas)
 * - Cross-regulator alignment (FCA vs PRA focus)
 */

require('dotenv').config()
const dbService = require('./dbService')
const dearCeoAnalyzer = require('./dearCeoAnalyzer')

// Same theme definitions as dearCeoAnalyzer
const REGULATORY_THEMES = {
  CONSUMER_PROTECTION: { name: 'Consumer Protection', shortName: 'Consumer' },
  FINANCIAL_CRIME: { name: 'Financial Crime', shortName: 'FinCrime' },
  OPERATIONAL_RESILIENCE: { name: 'Operational Resilience', shortName: 'OpRes' },
  GOVERNANCE: { name: 'Governance & Culture', shortName: 'Governance' },
  PRUDENTIAL: { name: 'Prudential Requirements', shortName: 'Prudential' },
  CONDUCT: { name: 'Conduct Risk', shortName: 'Conduct' },
  DATA_TECHNOLOGY: { name: 'Data & Technology', shortName: 'Tech' },
  CLIMATE_ESG: { name: 'Climate & ESG', shortName: 'ESG' },
  MOTOR_FINANCE: { name: 'Motor Finance', shortName: 'Motor' },
  PAYMENTS: { name: 'Payments', shortName: 'Payments' }
}

class DearCeoTrendService {
  constructor() {
    this.cacheExpiry = 60 * 60 * 1000 // 1 hour cache
    this.cache = new Map()
  }

  /**
   * Get theme trends over time (5 years by default)
   */
  async getThemeTrends(options = {}) {
    const years = options.years || 5
    const groupBy = options.groupBy || 'quarter' // 'quarter', 'year', 'month'
    const authority = options.authority || null // 'FCA', 'PRA', or null for both

    const cacheKey = `trends_${years}_${groupBy}_${authority || 'all'}`
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data
      }
    }

    const client = await dbService.pool.connect()
    try {
      // Fetch all Dear CEO letters from the past X years
      const fromDate = new Date()
      fromDate.setFullYear(fromDate.getFullYear() - years)

      let query = `
        SELECT id, headline, url, authority, published_date, ai_summary, content_type
        FROM regulatory_updates
        WHERE published_date >= $1
          AND authority IN ('FCA', 'PRA')
          AND (
            content_type IN ('DEAR_CEO_LETTER', 'Dear CEO Letter', 'SUPERVISORY_STATEMENT', 'Supervisory Statement', 'POLICY_STATEMENT', 'Policy Statement')
            OR headline ILIKE '%dear ceo%'
            OR headline ILIKE '%supervisory statement%'
            OR headline ~ '^SS\\d+/\\d+'
            OR headline ~ '^PS\\d+/\\d+'
          )
      `

      const params = [fromDate.toISOString()]

      if (authority) {
        query += ' AND authority = $2'
        params.push(authority)
      }

      query += ' ORDER BY published_date ASC'

      const result = await client.query(query, params)
      const letters = result.rows

      // Analyze themes for each letter
      const letterThemes = letters.map(letter => {
        const themes = dearCeoAnalyzer.extractThemes(
          letter.headline,
          letter.ai_summary || letter.headline
        )
        return {
          ...letter,
          themes: themes.map(t => t.key),
          themeDetails: themes
        }
      })

      // Group by time period
      const groupedData = this.groupByPeriod(letterThemes, groupBy)

      // Calculate theme frequencies per period
      const trendData = this.calculateTrendData(groupedData)

      // Identify theme status (emerging, persistent, declining)
      const themeStatus = this.identifyThemeStatus(trendData)

      // Cross-regulator analysis
      const crossRegulatorAnalysis = await this.analyzeCrossRegulator(client, fromDate)

      const trends = {
        periods: trendData.periods,
        themes: trendData.themes,
        themeStatus,
        crossRegulatorAnalysis,
        summary: this.generateTrendSummary(trendData, themeStatus),
        generatedAt: new Date().toISOString(),
        parameters: { years, groupBy, authority }
      }

      // Cache the result
      this.cache.set(cacheKey, { data: trends, timestamp: Date.now() })

      return trends
    } finally {
      client.release()
    }
  }

  /**
   * Group letters by time period
   */
  groupByPeriod(letters, groupBy) {
    const groups = new Map()

    for (const letter of letters) {
      const date = new Date(letter.published_date)
      let periodKey

      switch (groupBy) {
        case 'year':
          periodKey = date.getFullYear().toString()
          break
        case 'month':
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          break
        case 'quarter':
        default:
          const quarter = Math.floor(date.getMonth() / 3) + 1
          periodKey = `${date.getFullYear()}-Q${quarter}`
          break
      }

      if (!groups.has(periodKey)) {
        groups.set(periodKey, [])
      }
      groups.get(periodKey).push(letter)
    }

    return groups
  }

  /**
   * Calculate theme frequency trends
   */
  calculateTrendData(groupedData) {
    const periods = []
    const themeData = {}

    // Initialize theme data
    for (const key of Object.keys(REGULATORY_THEMES)) {
      themeData[key] = {
        name: REGULATORY_THEMES[key].name,
        shortName: REGULATORY_THEMES[key].shortName,
        values: []
      }
    }

    // Process each period
    const sortedPeriods = Array.from(groupedData.keys()).sort()

    for (const period of sortedPeriods) {
      periods.push(period)
      const letters = groupedData.get(period)

      // Count theme occurrences
      const themeCounts = {}
      for (const key of Object.keys(REGULATORY_THEMES)) {
        themeCounts[key] = 0
      }

      for (const letter of letters) {
        for (const themeKey of letter.themes) {
          if (themeCounts[themeKey] !== undefined) {
            themeCounts[themeKey]++
          }
        }
      }

      // Calculate percentages (% of letters mentioning theme)
      const totalLetters = letters.length || 1
      for (const key of Object.keys(REGULATORY_THEMES)) {
        const percentage = Math.round((themeCounts[key] / totalLetters) * 100)
        themeData[key].values.push({
          period,
          count: themeCounts[key],
          percentage,
          totalLetters
        })
      }
    }

    return {
      periods,
      themes: themeData
    }
  }

  /**
   * Identify theme status based on trend
   */
  identifyThemeStatus(trendData) {
    const status = {}
    const recentPeriods = 4 // Last 4 periods for trend analysis

    for (const [key, theme] of Object.entries(trendData.themes)) {
      const values = theme.values
      if (values.length < 2) {
        status[key] = { status: 'insufficient_data', trend: 0 }
        continue
      }

      // Get recent and historical averages
      const recentValues = values.slice(-recentPeriods)
      const historicalValues = values.slice(0, -recentPeriods)

      const recentAvg = this.average(recentValues.map(v => v.percentage))
      const historicalAvg = historicalValues.length > 0
        ? this.average(historicalValues.map(v => v.percentage))
        : recentAvg

      // Calculate trend
      const trend = recentAvg - historicalAvg
      const trendPercentage = historicalAvg > 0 ? (trend / historicalAvg) * 100 : 0

      // Determine status
      let themeStatus
      if (recentAvg >= 50 && trend >= 0) {
        themeStatus = 'persistent' // High and stable/growing
      } else if (trend > 20) {
        themeStatus = 'emerging' // Significant increase
      } else if (trend < -20) {
        themeStatus = 'declining' // Significant decrease
      } else if (recentAvg >= 30) {
        themeStatus = 'moderate' // Moderate presence
      } else {
        themeStatus = 'low' // Low presence
      }

      status[key] = {
        name: theme.name,
        status: themeStatus,
        recentAverage: Math.round(recentAvg),
        historicalAverage: Math.round(historicalAvg),
        trend: Math.round(trend),
        trendPercentage: Math.round(trendPercentage)
      }
    }

    return status
  }

  /**
   * Analyze cross-regulator theme alignment
   */
  async analyzeCrossRegulator(client, fromDate) {
    // Get theme distribution by authority
    const result = await client.query(`
      SELECT authority, headline, ai_summary
      FROM regulatory_updates
      WHERE published_date >= $1
        AND authority IN ('FCA', 'PRA')
        AND (
          content_type IN ('DEAR_CEO_LETTER', 'Dear CEO Letter', 'SUPERVISORY_STATEMENT', 'Supervisory Statement')
          OR headline ILIKE '%dear ceo%'
          OR headline ILIKE '%supervisory statement%'
        )
    `, [fromDate.toISOString()])

    const fcaThemes = {}
    const praThemes = {}

    for (const key of Object.keys(REGULATORY_THEMES)) {
      fcaThemes[key] = 0
      praThemes[key] = 0
    }

    let fcaCount = 0
    let praCount = 0

    for (const letter of result.rows) {
      const themes = dearCeoAnalyzer.extractThemes(
        letter.headline,
        letter.ai_summary || letter.headline
      )

      if (letter.authority === 'FCA') {
        fcaCount++
        for (const theme of themes) {
          if (fcaThemes[theme.key] !== undefined) {
            fcaThemes[theme.key]++
          }
        }
      } else if (letter.authority === 'PRA') {
        praCount++
        for (const theme of themes) {
          if (praThemes[theme.key] !== undefined) {
            praThemes[theme.key]++
          }
        }
      }
    }

    // Calculate alignment scores
    const alignment = {}
    for (const key of Object.keys(REGULATORY_THEMES)) {
      const fcaPct = fcaCount > 0 ? (fcaThemes[key] / fcaCount) * 100 : 0
      const praPct = praCount > 0 ? (praThemes[key] / praCount) * 100 : 0

      alignment[key] = {
        name: REGULATORY_THEMES[key].name,
        fcaFocus: Math.round(fcaPct),
        praFocus: Math.round(praPct),
        difference: Math.round(Math.abs(fcaPct - praPct)),
        aligned: Math.abs(fcaPct - praPct) < 20
      }
    }

    // Find key differences
    const fcaFocused = Object.entries(alignment)
      .filter(([_, v]) => v.fcaFocus > v.praFocus + 15)
      .map(([k, v]) => v.name)

    const praFocused = Object.entries(alignment)
      .filter(([_, v]) => v.praFocus > v.fcaFocus + 15)
      .map(([k, v]) => v.name)

    const sharedFocus = Object.entries(alignment)
      .filter(([_, v]) => v.aligned && v.fcaFocus > 20)
      .map(([k, v]) => v.name)

    return {
      letterCounts: { FCA: fcaCount, PRA: praCount },
      themeAlignment: alignment,
      fcaFocusedThemes: fcaFocused,
      praFocusedThemes: praFocused,
      sharedPriorityThemes: sharedFocus
    }
  }

  /**
   * Generate trend summary
   */
  generateTrendSummary(trendData, themeStatus) {
    const emerging = Object.entries(themeStatus)
      .filter(([_, v]) => v.status === 'emerging')
      .map(([_, v]) => v.name)

    const persistent = Object.entries(themeStatus)
      .filter(([_, v]) => v.status === 'persistent')
      .map(([_, v]) => v.name)

    const declining = Object.entries(themeStatus)
      .filter(([_, v]) => v.status === 'declining')
      .map(([_, v]) => v.name)

    return {
      emergingThemes: emerging,
      persistentThemes: persistent,
      decliningThemes: declining,
      insight: this.generateInsight(emerging, persistent, declining)
    }
  }

  generateInsight(emerging, persistent, declining) {
    let insight = ''

    if (persistent.length > 0) {
      insight += `Regulators continue to focus on ${persistent.slice(0, 3).join(', ')}. `
    }

    if (emerging.length > 0) {
      insight += `Emerging priorities include ${emerging.slice(0, 2).join(' and ')}. `
    }

    if (declining.length > 0) {
      insight += `Reduced emphasis on ${declining.slice(0, 2).join(', ')}.`
    }

    return insight || 'Theme distribution remains stable across the analysis period.'
  }

  average(arr) {
    if (arr.length === 0) return 0
    return arr.reduce((a, b) => a + b, 0) / arr.length
  }

  /**
   * Get theme evolution for a specific theme
   */
  async getThemeEvolution(themeKey, years = 5) {
    const trends = await this.getThemeTrends({ years, groupBy: 'quarter' })

    if (!trends.themes[themeKey]) {
      return null
    }

    const theme = trends.themes[themeKey]
    const status = trends.themeStatus[themeKey]

    return {
      theme: theme.name,
      evolution: theme.values,
      currentStatus: status,
      insight: this.generateThemeInsight(theme, status)
    }
  }

  generateThemeInsight(theme, status) {
    if (status.status === 'emerging') {
      return `${theme.name} is an emerging regulatory focus with ${status.trend}% increase in recent communications.`
    } else if (status.status === 'persistent') {
      return `${theme.name} remains a core supervisory priority with consistent attention over time.`
    } else if (status.status === 'declining') {
      return `${theme.name} has seen reduced regulatory attention, down ${Math.abs(status.trend)}% from historical levels.`
    }
    return `${theme.name} maintains a ${status.status} presence in supervisory communications.`
  }
}

module.exports = new DearCeoTrendService()
