function applyWeeklyMethods(ServiceClass) {
  ServiceClass.prototype.generateWeeklyRoundup = async function(updates) {
    console.log('📊 Generating AI-powered weekly roundup...')

    try {
      const cacheKey = this.getWeekCacheKey()

      if (this.weeklyRoundupCache.has(cacheKey)) {
        const cached = this.weeklyRoundupCache.get(cacheKey)
        if (Date.now() - cached.timestamp < this.cacheExpiry) {
          console.log('📋 Returning cached weekly roundup')
          return cached.data
        }
      }

      const roundup = await this.createWeeklyRoundup(updates)

      this.weeklyRoundupCache.set(cacheKey, {
        data: roundup,
        timestamp: Date.now()
      })

      return roundup
    } catch (error) {
      console.error('❌ Weekly roundup generation failed:', error)
      return this.createBasicWeeklyRoundup(updates)
    }
  }

  ServiceClass.prototype.createWeeklyRoundup = async function(updates) {
    if (!this.apiKey) {
      return this.createBasicWeeklyRoundup(updates)
    }

    try {
      const prompt = this.buildWeeklyRoundupPrompt(updates)
      const response = await this.makeGroqRequest(prompt)

      if (response?.choices?.[0]?.message?.content) {
        const cleanedResponse = response.choices[0].message.content
          .replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

        const aiRoundup = JSON.parse(cleanedResponse)
        return this.enhanceWeeklyRoundup(aiRoundup, updates)
      }
    } catch (error) {
      console.warn('Failed to generate AI weekly roundup:', error.message)
    }

    return this.createBasicWeeklyRoundup(updates)
  }

  ServiceClass.prototype.buildWeeklyRoundupPrompt = function(updates) {
    const updateSummaries = updates.slice(0, 20).map(u =>
      `${u.authority}: ${u.headline} (Impact: ${u.impactLevel || 'Unknown'})`
    ).join('\n')

    return `Analyze this week's regulatory activity and create an executive summary:

This week's updates (${updates.length} total):
${updateSummaries}

Create a JSON response with this structure:
{
    "weekSummary": "2-3 sentence executive summary of the week",
    "keyThemes": ["Theme 1", "Theme 2", "Theme 3"],
    "topAuthorities": [
        {"authority": "FCA", "updateCount": 5, "focusArea": "Consumer protection"},
        {"authority": "PRA", "updateCount": 3, "focusArea": "Capital requirements"}
    ],
    "highImpactUpdates": [
        {"headline": "Update headline", "authority": "FCA", "impact": "Why this matters"}
    ],
    "sectorInsights": {
        "Banking": "Key developments affecting banks",
        "Investment Management": "Key developments affecting investment firms"
    },
    "upcomingDeadlines": ["Deadline 1", "Deadline 2"],
    "weeklyPriorities": ["Priority 1", "Priority 2", "Priority 3"]
}

Focus on practical business intelligence and actionable insights.`
  }

  ServiceClass.prototype.enhanceWeeklyRoundup = function(aiRoundup, updates) {
    const stats = this.calculateWeeklyStats(updates)

    return {
      ...aiRoundup,
      statistics: stats,
      totalUpdates: updates.length,
      weekStart: this.getWeekStart(),
      generatedAt: new Date().toISOString(),
      dataQuality: {
        aiGenerated: true,
        confidence: 0.85,
        sourceCount: updates.length
      }
    }
  }

  ServiceClass.prototype.calculateWeeklyStats = function(updates) {
    const authorities = {}
    const sectors = {}
    const impactLevels = { Significant: 0, Moderate: 0, Informational: 0 }

    updates.forEach(update => {
      authorities[update.authority] = (authorities[update.authority] || 0) + 1

      if (update.impactLevel) {
        impactLevels[update.impactLevel] = (impactLevels[update.impactLevel] || 0) + 1
      }

      if (update.primarySectors) {
        update.primarySectors.forEach(sector => {
          sectors[sector] = (sectors[sector] || 0) + 1
        })
      }
    })

    return {
      authorityBreakdown: authorities,
      sectorBreakdown: sectors,
      impactBreakdown: impactLevels,
      avgImpactScore: this.calculateAverageImpactScore(updates)
    }
  }

  ServiceClass.prototype.calculateAverageImpactScore = function(updates) {
    const scoresWithValues = updates
      .filter(u => u.businessImpactScore && u.businessImpactScore > 0)
      .map(u => u.businessImpactScore)

    if (scoresWithValues.length === 0) return 0

    return Math.round(scoresWithValues.reduce((a, b) => a + b, 0) / scoresWithValues.length * 10) / 10
  }

  ServiceClass.prototype.createBasicWeeklyRoundup = function(updates) {
    const authorities = {}
    updates.forEach(update => {
      authorities[update.authority] = (authorities[update.authority] || 0) + 1
    })

    const topAuthorities = Object.entries(authorities)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([authority, count]) => ({ authority, updateCount: count, focusArea: 'Multiple areas' }))

    return {
      weekSummary: `${updates.length} regulatory updates published this week across ${Object.keys(authorities).length} authorities.`,
      keyThemes: ['Regulatory Updates', 'Policy Changes', 'Industry Guidance'],
      topAuthorities,
      highImpactUpdates: updates.filter(u => u.impactLevel === 'Significant').slice(0, 3)
        .map(u => ({ headline: u.headline, authority: u.authority, impact: u.impact || 'High impact regulatory change' })),
      sectorInsights: {
        'All Sectors': 'Multiple regulatory developments affecting various sectors'
      },
      upcomingDeadlines: [],
      weeklyPriorities: ['Review new updates', 'Assess compliance implications', 'Update internal policies'],
      statistics: this.calculateWeeklyStats(updates),
      totalUpdates: updates.length,
      weekStart: this.getWeekStart(),
      generatedAt: new Date().toISOString(),
      dataQuality: {
        aiGenerated: false,
        confidence: 0.6,
        sourceCount: updates.length
      }
    }
  }

  ServiceClass.prototype.getWeekCacheKey = function() {
    const now = new Date()
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
    return `week-${weekStart.toISOString().split('T')[0]}`
  }

  ServiceClass.prototype.getWeekStart = function() {
    const now = new Date()
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
    return weekStart.toISOString().split('T')[0]
  }
}

module.exports = applyWeeklyMethods
