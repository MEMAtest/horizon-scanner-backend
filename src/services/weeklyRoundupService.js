// Weekly Roundup Service - Enhanced for Your System
// File: src/services/weeklyRoundupService.js

const dbService = require('./dbService')
const aiAnalyzer = require('./aiAnalyzer')
const axios = require('axios')
const moment = require('moment')

class WeeklyRoundupService {
  constructor() {
    this.groqApiKey = process.env.GROQ_API_KEY
    this.groqApiUrl = 'https://api.groq.com/openai/v1/chat/completions'
    this.model = 'llama-3.3-70b-versatile' // Using the working model
  }

  /**
     * Generate a comprehensive weekly roundup
     * @param {Date} weekStart - Start date of the week
     * @param {Date} weekEnd - End date of the week
     * @returns {Object} Weekly roundup data
     */
  async generateWeeklyRoundup(weekStart = null, weekEnd = null) {
    try {
      // Default to last 7 days if no dates provided
      if (!weekStart) {
        weekEnd = new Date()
        weekStart = new Date()
        weekStart.setDate(weekStart.getDate() - 7)
      }

      console.log(`📊 Generating weekly roundup from ${weekStart.toISOString()} to ${weekEnd.toISOString()}`)

      // Fetch all updates for the week using your dbService
      const updates = await this.fetchWeeklyUpdates(weekStart, weekEnd)

      if (updates.length === 0) {
        return this.generateEmptyRoundup(weekStart, weekEnd)
      }

      // Process and analyze updates
      const authorityBreakdown = this.calculateAuthorityBreakdown(updates)
      const sectorBreakdown = await this.calculateSectorBreakdown(updates)
      const impactBreakdown = this.calculateImpactBreakdown(updates)
      const highImpactUpdates = this.identifyHighImpactUpdates(updates)
      const topAuthorities = this.getTopAuthorities(authorityBreakdown)
      const keyThemes = await this.extractKeyThemes(updates)
      const upcomingDeadlines = this.extractUpcomingDeadlines(updates)
      const weeklyPriorities = await this.generateWeeklyPriorities(updates, highImpactUpdates)
      const sectorInsights = await this.generateSectorInsights(updates, sectorBreakdown)

      // Generate AI-powered summary
      const weekSummary = await this.generateWeekSummary(updates, authorityBreakdown)

      // Calculate data quality metrics
      const dataQuality = this.assessDataQuality(updates)

      const roundup = {
        success: true,
        roundup: {
          weekSummary,
          keyThemes,
          topAuthorities,
          highImpactUpdates: highImpactUpdates.slice(0, 10),
          sectorInsights,
          upcomingDeadlines: upcomingDeadlines.slice(0, 10),
          weeklyPriorities,
          statistics: {
            authorityBreakdown,
            sectorBreakdown,
            impactBreakdown,
            avgImpactScore: this.calculateAverageImpactScore(updates)
          },
          totalUpdates: updates.length,
          weekStart: weekStart.toISOString().split('T')[0],
          weekEnd: weekEnd.toISOString().split('T')[0],
          generatedAt: new Date().toISOString(),
          dataQuality
        },
        sourceUpdates: updates.length,
        timestamp: new Date().toISOString()
      }

      // Cache the roundup for performance
      await this.cacheRoundup(roundup)

      return roundup
    } catch (error) {
      console.error('❌ Error generating weekly roundup:', error)
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
     * Fetch weekly updates from database using your dbService
     */
  async fetchWeeklyUpdates(weekStart, weekEnd) {
    try {
      // Check if we're in fallback mode
      if (dbService.fallbackMode) {
        console.log('📁 Using JSON fallback for weekly updates')
        return this.fetchWeeklyUpdatesFromJSON(weekStart, weekEnd)
      }

      // Use your existing dbService getEnhancedUpdates method
      const updates = await dbService.getEnhancedUpdates({
        startDate: weekStart,
        endDate: weekEnd,
        limit: 1000
      })

      return updates
    } catch (error) {
      console.warn('⚠️ Database fetch failed, using JSON fallback:', error.message)
      return this.fetchWeeklyUpdatesFromJSON(weekStart, weekEnd)
    }
  }

  /**
     * Fallback to JSON data store
     */
  async fetchWeeklyUpdatesFromJSON(weekStart, weekEnd) {
    try {
      const fs = require('fs').promises
      const path = require('path')
      const dataPath = path.join(process.cwd(), 'data', 'updates.json')

      const data = await fs.readFile(dataPath, 'utf8')
      const allUpdates = JSON.parse(data)

      return allUpdates.filter(update => {
        const updateDate = new Date(update.published_date)
        return updateDate >= weekStart && updateDate <= weekEnd
      })
    } catch (error) {
      console.error('Error reading JSON data:', error)
      return []
    }
  }

  /**
     * Calculate authority breakdown
     */
  calculateAuthorityBreakdown(updates) {
    const breakdown = {}

    updates.forEach(update => {
      const authority = update.authority || 'Unknown'
      breakdown[authority] = (breakdown[authority] || 0) + 1
    })

    return Object.fromEntries(
      Object.entries(breakdown).sort(([, a], [, b]) => b - a)
    )
  }

  /**
     * Calculate sector breakdown using the sector_relevance_scores from your DB
     */
  async calculateSectorBreakdown(updates) {
    const breakdown = {}

    updates.forEach(update => {
      // Use sector_relevance_scores from your database schema
      if (update.sector_relevance_scores) {
        Object.entries(update.sector_relevance_scores).forEach(([sector, score]) => {
          if (score > 50) { // Only count sectors with > 50% relevance
            breakdown[sector] = (breakdown[sector] || 0) + 1
          }
        })
      }

      // Fallback to sector field if no scores
      if (!update.sector_relevance_scores && update.sector) {
        breakdown[update.sector] = (breakdown[update.sector] || 0) + 1
      }
    })

    return breakdown
  }

  /**
     * Calculate impact level breakdown
     */
  calculateImpactBreakdown(updates) {
    const breakdown = {
      Significant: 0,
      Moderate: 0,
      Informational: 0
    }

    updates.forEach(update => {
      const impact = update.impact_level || 'Informational'
      const normalizedImpact = this.normalizeImpactLevel(impact)
      breakdown[normalizedImpact]++
    })

    return breakdown
  }

  /**
     * Normalize impact levels to standard categories
     */
  normalizeImpactLevel(impact) {
    const impactMap = {
      critical: 'Significant',
      significant: 'Significant',
      high: 'Significant',
      moderate: 'Moderate',
      medium: 'Moderate',
      low: 'Informational',
      minimal: 'Informational',
      informational: 'Informational'
    }

    return impactMap[impact.toLowerCase()] || 'Informational'
  }

  /**
     * Identify high impact updates using your DB fields
     */
  identifyHighImpactUpdates(updates) {
    return updates
      .filter(update => {
        const impact = this.normalizeImpactLevel(update.impact_level || 'Low')
        return impact === 'Significant' ||
                       update.business_impact_score >= 7 || // Use your business_impact_score
                       update.urgency === 'High'
      })
      .sort((a, b) => {
        // Sort by business_impact_score from your DB
        const scoreA = a.business_impact_score || 0
        const scoreB = b.business_impact_score || 0
        return scoreB - scoreA
      })
      .map(update => ({
        id: update.id,
        title: update.headline,
        authority: update.authority,
        impactLevel: update.impact_level,
        businessImpactScore: update.business_impact_score,
        summary: update.ai_summary || update.summary,
        url: update.url,
        publishedDate: update.published_date,
        sectors: this.extractSectorsFromScores(update.sector_relevance_scores),
        complianceDeadline: update.compliance_deadline,
        aiTags: update.ai_tags || []
      }))
  }

  /**
     * Extract sectors from sector_relevance_scores
     */
  extractSectorsFromScores(scores) {
    if (!scores) return []
    return Object.entries(scores)
      .filter(([sector, score]) => score > 50)
      .map(([sector]) => sector)
  }

  /**
     * Get top authorities by update count
     */
  getTopAuthorities(authorityBreakdown) {
    return Object.entries(authorityBreakdown)
      .slice(0, 5)
      .map(([authority, count]) => ({
        authority,
        updateCount: count,
        focusArea: this.getAuthorityFocusArea(authority)
      }))
  }

  /**
     * Get focus area for authority
     */
  getAuthorityFocusArea(authority) {
    const focusAreas = {
      FCA: 'Consumer protection, market integrity',
      PRA: 'Prudential regulation, financial stability',
      'Bank of England': 'Monetary policy, systemic risk',
      'HM Government': 'Policy and legislation',
      'HM Treasury': 'Economic policy, financial services',
      HMRC: 'Tax and customs',
      ESMA: 'European securities markets',
      EBA: 'European banking standards',
      FATF: 'Anti-money laundering',
      PSR: 'Payment systems',
      TPR: 'Pension schemes',
      'Competition and Markets Authority': 'Competition and consumer protection'
    }

    return focusAreas[authority] || 'Multiple areas'
  }

  /**
     * Extract key themes using AI tags from your DB
     */
  async extractKeyThemes(updates) {
    // First, collect themes from AI tags in your database
    const tagCounts = {}
    updates.forEach(update => {
      if (update.ai_tags && Array.isArray(update.ai_tags)) {
        update.ai_tags.forEach(tag => {
          // Extract area tags for themes
          if (tag.startsWith('area:')) {
            const theme = tag.replace('area:', '').replace(/-/g, ' ')
            tagCounts[theme] = (tagCounts[theme] || 0) + 1
          }
        })
      }
    })

    // Get top themes from tags
    const topThemesFromTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([theme]) => theme)

    // If we have themes from tags, use them
    if (topThemesFromTags.length > 0) {
      return topThemesFromTags
    }

    // Otherwise, use AI to extract themes
    try {
      const titles = updates.slice(0, 50).map(u => u.headline).join('; ')

      const prompt = `Based on these regulatory update titles, identify 3-5 KEY THEMES (return as comma-separated list):
            ${titles}
            
            Themes should be broad categories like "Digital Assets", "Consumer Protection", "AML Requirements", etc.`

      const response = await this.makeGroqRequest(prompt)
      const themes = response.choices[0].message.content
        .split(',')
        .map(theme => theme.trim())
        .filter(theme => theme.length > 0)

      return themes.slice(0, 5)
    } catch (error) {
      console.error('Error extracting themes:', error)
      return ['Regulatory Updates', 'Policy Changes', 'Industry Guidance']
    }
  }

  /**
     * Extract upcoming deadlines from compliance_deadline field
     */
  extractUpcomingDeadlines(updates) {
    const deadlines = []
    const now = new Date()

    updates.forEach(update => {
      // Use compliance_deadline from your DB schema
      if (update.compliance_deadline) {
        const deadlineDate = new Date(update.compliance_deadline)
        if (deadlineDate > now) {
          deadlines.push({
            date: deadlineDate.toISOString(),
            description: update.headline,
            authority: update.authority,
            updateId: update.id,
            daysRemaining: Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24)),
            impactScore: update.business_impact_score || 0
          })
        }
      }
    })

    // Sort by date ascending
    return deadlines.sort((a, b) => new Date(a.date) - new Date(b.date))
  }

  /**
     * Generate weekly priorities using AI
     */
  async generateWeeklyPriorities(updates, highImpactUpdates) {
    if (highImpactUpdates.length === 0) {
      return [
        'Review new regulatory updates',
        'Assess compliance implications',
        'Update internal policies'
      ]
    }

    try {
      const topUpdates = highImpactUpdates.slice(0, 5)
      const summaries = topUpdates.map(u => u.summary).join('; ')

      const prompt = `Based on these high-impact regulatory updates, generate 3-5 specific action priorities for financial firms this week:
            ${summaries}
            
            Return as numbered list of clear, actionable items.`

      const response = await this.makeGroqRequest(prompt)
      const priorities = response.choices[0].message.content
        .split('\n')
        .filter(line => line.match(/^\d/))
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .slice(0, 5)

      return priorities.length > 0
        ? priorities
        : [
            'Review critical regulatory updates',
            'Assess impact on current operations',
            'Update compliance frameworks'
          ]
    } catch (error) {
      console.error('Error generating priorities:', error)
      return [
        'Review new regulatory updates',
        'Assess compliance implications',
        'Update internal policies'
      ]
    }
  }

  /**
     * Generate sector insights
     */
  async generateSectorInsights(updates, sectorBreakdown) {
    const insights = {}

    // Get top 3 sectors
    const topSectors = Object.entries(sectorBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([sector]) => sector)

    for (const sector of topSectors) {
      const sectorUpdates = updates.filter(u => {
        if (u.sector_relevance_scores && u.sector_relevance_scores[sector] > 50) {
          return true
        }
        return u.sector === sector
      })

      if (sectorUpdates.length > 0) {
        insights[sector] = await this.generateSectorSummary(sector, sectorUpdates)
      }
    }

    // Add general insight if no specific sectors
    if (Object.keys(insights).length === 0) {
      insights['All Sectors'] = 'Multiple regulatory developments affecting various sectors'
    }

    return insights
  }

  /**
     * Generate summary for a specific sector
     */
  async generateSectorSummary(sector, updates) {
    const impactfulUpdates = updates
      .filter(u => u.business_impact_score >= 5)
      .length

    const authorities = [...new Set(updates.map(u => u.authority))]

    return `${updates.length} updates affecting ${sector}, ${impactfulUpdates} with significant impact. Key authorities: ${authorities.slice(0, 3).join(', ')}`
  }

  /**
     * Generate week summary using AI
     */
  async generateWeekSummary(updates, authorityBreakdown) {
    const totalUpdates = updates.length
    const topAuthority = Object.keys(authorityBreakdown)[0]
    const authorityCount = Object.keys(authorityBreakdown).length

    if (totalUpdates === 0) {
      return 'No regulatory updates published this week.'
    }

    const highImpact = updates.filter(u =>
      u.business_impact_score >= 7 || u.impact_level === 'Significant'
    ).length

    const deadlineCount = updates.filter(u => u.compliance_deadline).length

    return `${totalUpdates} regulatory updates published this week across ${authorityCount} authorities. ${highImpact} high-impact items requiring immediate attention${deadlineCount > 0 ? `, with ${deadlineCount} upcoming compliance deadlines` : ''}.`
  }

  /**
     * Calculate average impact score using business_impact_score from DB
     */
  calculateAverageImpactScore(updates) {
    if (updates.length === 0) return 0

    const totalScore = updates.reduce((sum, update) => {
      return sum + (update.business_impact_score || 0)
    }, 0)

    return Math.round(totalScore / updates.length * 10) / 10
  }

  /**
     * Assess data quality
     */
  assessDataQuality(updates) {
    const aiAnalyzedCount = updates.filter(u => u.ai_summary || u.ai_confidence_score).length
    const avgConfidence = this.calculateAverageConfidence(updates)

    return {
      aiGenerated: aiAnalyzedCount > 0,
      confidence: avgConfidence / 100,
      sourceCount: updates.length,
      aiCoverage: updates.length > 0 ? (aiAnalyzedCount / updates.length) : 0,
      completeness: this.assessCompleteness(updates)
    }
  }

  /**
     * Calculate average confidence score using ai_confidence_score from DB
     */
  calculateAverageConfidence(updates) {
    const scores = updates
      .map(u => u.ai_confidence_score ? parseFloat(u.ai_confidence_score) * 100 : 60)
      .filter(score => score > 0)

    if (scores.length === 0) return 60

    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  }

  /**
     * Assess data completeness
     */
  assessCompleteness(updates) {
    if (updates.length === 0) return 0

    const completeCount = updates.filter(u =>
      u.headline && u.url && u.authority && u.published_date && u.ai_summary
    ).length

    return completeCount / updates.length
  }

  /**
     * Generate empty roundup for weeks with no data
     */
  generateEmptyRoundup(weekStart, weekEnd) {
    return {
      success: true,
      roundup: {
        weekSummary: 'No regulatory updates published this week.',
        keyThemes: [],
        topAuthorities: [],
        highImpactUpdates: [],
        sectorInsights: {},
        upcomingDeadlines: [],
        weeklyPriorities: ['Monitor for new regulatory updates'],
        statistics: {
          authorityBreakdown: {},
          sectorBreakdown: {},
          impactBreakdown: {
            Significant: 0,
            Moderate: 0,
            Informational: 0
          },
          avgImpactScore: 0
        },
        totalUpdates: 0,
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        generatedAt: new Date().toISOString(),
        dataQuality: {
          aiGenerated: false,
          confidence: 0,
          sourceCount: 0,
          aiCoverage: 0,
          completeness: 0
        }
      },
      sourceUpdates: 0,
      timestamp: new Date().toISOString()
    }
  }

  /**
     * Make Groq API request
     */
  async makeGroqRequest(prompt) {
    const response = await axios.post(
      this.groqApiUrl,
      {
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.3
      },
      {
        headers: {
          Authorization: `Bearer ${this.groqApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    )

    return response.data
  }

  /**
     * Cache roundup for performance
     */
  async cacheRoundup(roundup) {
    try {
      const fs = require('fs').promises
      const path = require('path')
      const cachePath = path.join(process.cwd(), 'data', 'weekly_roundup_cache.json')

      // Ensure data directory exists
      await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true })

      await fs.writeFile(cachePath, JSON.stringify(roundup, null, 2))
      console.log('✅ Roundup cached successfully')
    } catch (error) {
      console.error('Error caching roundup:', error)
    }
  }
}

module.exports = new WeeklyRoundupService()
