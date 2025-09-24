import React, { useState, useEffect } from 'react'
import { FileText, Calendar, TrendingUp, Zap, ChevronRight, Clock, Building, Users } from 'lucide-react'

const SmartSummaries = () => {
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)
  const [summaries, setSummaries] = useState({})
  const [selectedSummaryType, setSelectedSummaryType] = useState('weekly')
  const [selectedPeriod, setSelectedPeriod] = useState('7')

  const summaryTypes = [
    { id: 'weekly', name: 'Weekly Roundup', icon: Calendar },
    { id: 'sector', name: 'Sector Analysis', icon: Building },
    { id: 'authority', name: 'Authority Spotlight', icon: Users },
    { id: 'trends', name: 'Trend Analysis', icon: TrendingUp }
  ]

  useEffect(() => {
    fetchSummaryData()
  }, [selectedPeriod])

  const fetchSummaryData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/updates?limit=150&enhanced=true')
      const data = await response.json()
      setUpdates(data || [])
      generateSmartSummaries(data || [])
    } catch (error) {
      console.error('Failed to fetch summary data:', error)
      setUpdates([])
    } finally {
      setLoading(false)
    }
  }

  const generateSmartSummaries = (allUpdates) => {
    const days = parseInt(selectedPeriod)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const filteredUpdates = allUpdates.filter(update =>
      new Date(update.fetched_date) >= cutoffDate
    )

    const summaryData = {
      weekly: generateWeeklyRoundup(filteredUpdates),
      sector: generateSectorAnalysis(filteredUpdates),
      authority: generateAuthoritySpotlight(filteredUpdates),
      trends: generateTrendAnalysis(filteredUpdates, allUpdates)
    }

    setSummaries(summaryData)
  }

  const generateWeeklyRoundup = (updates) => {
    const totalUpdates = updates.length
    const highImpact = updates.filter(u => u.impact_level === 'Significant').length
    const urgentUpdates = updates.filter(u => u.urgency === 'High').length

    // Group by authority
    const authorityActivity = {}
    updates.forEach(update => {
      const authority = update.authority || 'Unknown'
      authorityActivity[authority] = (authorityActivity[authority] || 0) + 1
    })

    const topAuthority = Object.entries(authorityActivity)
      .sort(([, a], [, b]) => b - a)[0]

    // Key themes
    const themes = extractKeyThemes(updates)

    // Top updates by significance
    const topUpdates = updates
      .filter(u => u.impact_level === 'Significant' || u.urgency === 'High')
      .sort((a, b) => {
        const aScore = (a.impact_level === 'Significant' ? 3 : 1) + (a.urgency === 'High' ? 2 : 0)
        const bScore = (b.impact_level === 'Significant' ? 3 : 1) + (b.urgency === 'High' ? 2 : 0)
        return bScore - aScore
      })
      .slice(0, 5)

    return {
      title: 'Weekly Regulatory Roundup',
      period: `Last ${selectedPeriod} days`,
      summary: `${totalUpdates} regulatory updates published with ${highImpact} significant impact items and ${urgentUpdates} urgent matters requiring attention.`,
      keyStats: {
        total: totalUpdates,
        highImpact,
        urgent: urgentUpdates,
        authorities: Object.keys(authorityActivity).length
      },
      topAuthority: topAuthority ? { name: topAuthority[0], count: topAuthority[1] } : null,
      keyThemes: themes,
      topUpdates,
      insights: [
        `${topAuthority ? topAuthority[0] : 'Regulatory authorities'} showed increased activity`,
        `${Math.round((highImpact / totalUpdates) * 100)}% of updates had significant business impact`,
        `${themes.length} major regulatory themes identified`
      ]
    }
  }

  const generateSectorAnalysis = (updates) => {
    const sectorData = {}

    updates.forEach(update => {
      if (update.sector_relevance_scores) {
        Object.entries(update.sector_relevance_scores).forEach(([sector, score]) => {
          if (score > 25) {
            if (!sectorData[sector]) {
              sectorData[sector] = {
                updates: [],
                totalScore: 0,
                avgScore: 0,
                highImpact: 0,
                trends: []
              }
            }
            sectorData[sector].updates.push(update)
            sectorData[sector].totalScore += score
            if (update.impact_level === 'Significant') {
              sectorData[sector].highImpact++
            }
          }
        })
      }
    })

    // Calculate averages and sort
    const analysisResults = Object.entries(sectorData)
      .map(([sector, data]) => ({
        sector,
        updateCount: data.updates.length,
        avgRelevance: Math.round(data.totalScore / data.updates.length),
        highImpactCount: data.highImpact,
        impactRatio: Math.round((data.highImpact / data.updates.length) * 100),
        topUpdate: data.updates.sort((a, b) =>
          (b.sector_relevance_scores?.[sector] || 0) - (a.sector_relevance_scores?.[sector] || 0)
        )[0],
        keyTopics: extractSectorTopics(data.updates)
      }))
      .sort((a, b) => b.avgRelevance - a.avgRelevance)
      .slice(0, 6)

    return {
      title: 'Sector Impact Analysis',
      period: `Last ${selectedPeriod} days`,
      summary: `Analysis of regulatory impact across ${analysisResults.length} key financial services sectors.`,
      sectors: analysisResults,
      insights: analysisResults.slice(0, 3).map(sector =>
        `${sector.sector}: ${sector.updateCount} updates, ${sector.impactRatio}% high impact`
      )
    }
  }

  const generateAuthoritySpotlight = (updates) => {
    const authorityData = {}

    updates.forEach(update => {
      const authority = update.authority || 'Unknown'
      if (!authorityData[authority]) {
        authorityData[authority] = {
          updates: [],
          highImpact: 0,
          urgent: 0,
          themes: {}
        }
      }

      authorityData[authority].updates.push(update)

      if (update.impact_level === 'Significant') {
        authorityData[authority].highImpact++
      }

      if (update.urgency === 'High') {
        authorityData[authority].urgent++
      }

      // Extract themes from this authority
      const themes = extractKeyThemes([update])
      themes.forEach(theme => {
        authorityData[authority].themes[theme] = (authorityData[authority].themes[theme] || 0) + 1
      })
    })

    const authorityAnalysis = Object.entries(authorityData)
      .map(([authority, data]) => ({
        authority: authority.replace('Financial Conduct Authority', 'FCA')
          .replace('Prudential Regulation Authority', 'PRA')
          .replace('Bank of England', 'BoE'),
        fullName: authority,
        updateCount: data.updates.length,
        highImpactCount: data.highImpact,
        urgentCount: data.urgent,
        activityScore: data.updates.length + (data.highImpact * 2) + (data.urgent * 3),
        topThemes: Object.entries(data.themes)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([theme]) => theme),
        recentUpdate: data.updates.sort((a, b) =>
          new Date(b.fetched_date) - new Date(a.fetched_date)
        )[0],
        focusAreas: getMostRelevantSectors(data.updates)
      }))
      .sort((a, b) => b.activityScore - a.activityScore)
      .slice(0, 5)

    return {
      title: 'Authority Activity Spotlight',
      period: `Last ${selectedPeriod} days`,
      summary: `Activity analysis across ${authorityAnalysis.length} key regulatory authorities.`,
      authorities: authorityAnalysis,
      insights: authorityAnalysis.slice(0, 3).map(auth =>
        `${auth.authority}: ${auth.updateCount} updates, focus on ${auth.topThemes[0] || 'compliance'}`
      )
    }
  }

  const generateTrendAnalysis = (recentUpdates, allUpdates) => {
    // Compare recent vs historical patterns
    const prevPeriod = allUpdates.slice(recentUpdates.length, recentUpdates.length * 2)

    const recentThemes = extractKeyThemes(recentUpdates)
    const prevThemes = extractKeyThemes(prevPeriod)

    // Identify emerging themes
    const emergingThemes = recentThemes.filter(theme =>
      !prevThemes.includes(theme) ||
      recentThemes.indexOf(theme) < prevThemes.indexOf(theme)
    )

    // Calculate trend momentum
    const currentVolume = recentUpdates.length
    const prevVolume = prevPeriod.length
    const volumeChange = prevVolume > 0 ? ((currentVolume - prevVolume) / prevVolume) * 100 : 0

    // Urgency trends
    const currentUrgent = recentUpdates.filter(u => u.urgency === 'High').length
    const prevUrgent = prevPeriod.filter(u => u.urgency === 'High').length
    const urgencyChange = prevUrgent > 0 ? ((currentUrgent - prevUrgent) / prevUrgent) * 100 : 0

    return {
      title: 'Regulatory Trend Analysis',
      period: `Last ${selectedPeriod} days vs previous period`,
      summary: `Trend analysis showing ${Math.abs(Math.round(volumeChange))}% ${volumeChange >= 0 ? 'increase' : 'decrease'} in regulatory activity.`,
      volumeChange: Math.round(volumeChange),
      urgencyChange: Math.round(urgencyChange),
      emergingThemes,
      trendingTopics: recentThemes.slice(0, 5),
      momentum: {
        direction: volumeChange >= 5 ? 'increasing' : volumeChange <= -5 ? 'decreasing' : 'stable',
        strength: Math.abs(volumeChange) > 20 ? 'strong' : Math.abs(volumeChange) > 10 ? 'moderate' : 'weak'
      },
      insights: [
        `Regulatory activity ${volumeChange >= 0 ? 'increased' : 'decreased'} by ${Math.abs(Math.round(volumeChange))}%`,
        `${emergingThemes.length} new themes emerged`,
        `Urgency levels ${urgencyChange >= 0 ? 'increased' : 'decreased'} by ${Math.abs(Math.round(urgencyChange))}%`
      ]
    }
  }

  const extractKeyThemes = (updates) => {
    const keywords = {}
    const themes = []

    updates.forEach(update => {
      const text = `${update.headline} ${update.impact}`.toLowerCase()

      // Define theme patterns
      const themePatterns = {
        'Digital Assets': ['crypto', 'digital asset', 'blockchain', 'bitcoin', 'token'],
        'ESG & Sustainability': ['esg', 'sustainability', 'climate', 'green', 'environmental'],
        'Consumer Protection': ['consumer', 'protection', 'fair treatment', 'vulnerable'],
        'Capital Requirements': ['capital', 'basel', 'prudential', 'leverage', 'liquidity'],
        'Operational Resilience': ['operational', 'resilience', 'outsourcing', 'business continuity'],
        'Market Conduct': ['market abuse', 'conduct', 'market integrity', 'trading'],
        'Technology & Innovation': ['fintech', 'technology', 'innovation', 'digital', 'ai'],
        'Anti-Money Laundering': ['aml', 'money laundering', 'financial crime', 'sanctions'],
        'Data & Privacy': ['data protection', 'gdpr', 'privacy', 'information security'],
        'Reporting & Disclosure': ['reporting', 'disclosure', 'transparency', 'mifid']
      }

      Object.entries(themePatterns).forEach(([theme, patterns]) => {
        if (patterns.some(pattern => text.includes(pattern))) {
          keywords[theme] = (keywords[theme] || 0) + 1
        }
      })
    })

    return Object.entries(keywords)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([theme]) => theme)
  }

  const extractSectorTopics = (updates) => {
    const topics = {}

    updates.forEach(update => {
      const text = `${update.headline} ${update.impact}`.toLowerCase()
      const words = text.split(' ').filter(word => word.length > 4)

      words.forEach(word => {
        if (!['regulatory', 'update', 'guidance', 'authority'].includes(word)) {
          topics[word] = (topics[word] || 0) + 1
        }
      })
    })

    return Object.entries(topics)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([topic]) => topic)
  }

  const getMostRelevantSectors = (updates) => {
    const sectorScores = {}

    updates.forEach(update => {
      if (update.sector_relevance_scores) {
        Object.entries(update.sector_relevance_scores).forEach(([sector, score]) => {
          sectorScores[sector] = Math.max(sectorScores[sector] || 0, score)
        })
      }
    })

    return Object.entries(sectorScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([sector]) => sector)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Generating smart summaries...</span>
      </div>
    )
  }

  const currentSummary = summaries[selectedSummaryType]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-lg">
        <h1 className="text-2xl font-bold flex items-center">
          <FileText className="mr-3" />
          Smart Summaries
        </h1>
        <p className="text-indigo-100 mt-1">
          AI-generated regulatory intelligence summaries and analysis
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Period:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
              <option value="60">Last 60 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Type Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {summaryTypes.map((type) => {
              const Icon = type.icon
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedSummaryType(type.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                    selectedSummaryType === type.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {type.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Summary Content */}
        <div className="p-6">
          {currentSummary && (
            <div className="space-y-6">
              {/* Summary Header */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {currentSummary.title}
                </h2>
                <p className="text-sm text-gray-500 mb-3">{currentSummary.period}</p>
                <p className="text-gray-700">{currentSummary.summary}</p>
              </div>

              {/* Weekly Roundup Content */}
              {selectedSummaryType === 'weekly' && (
                <div className="space-y-6">
                  {/* Key Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-900">{currentSummary.keyStats.total}</div>
                      <div className="text-sm text-blue-600">Total Updates</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-red-900">{currentSummary.keyStats.highImpact}</div>
                      <div className="text-sm text-red-600">High Impact</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-orange-900">{currentSummary.keyStats.urgent}</div>
                      <div className="text-sm text-orange-600">Urgent Items</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-900">{currentSummary.keyStats.authorities}</div>
                      <div className="text-sm text-green-600">Active Authorities</div>
                    </div>
                  </div>

                  {/* Key Themes */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Key Themes</h3>
                    <div className="flex flex-wrap gap-2">
                      {currentSummary.keyThemes.map((theme, idx) => (
                        <span key={idx} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Top Updates */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Priority Updates</h3>
                    <div className="space-y-3">
                      {currentSummary.topUpdates.map((update, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-1">{update.headline}</h4>
                          <p className="text-sm text-gray-600 mb-2">{update.impact}</p>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              update.impact_level === 'Significant'
? 'bg-red-100 text-red-700'
                              : update.impact_level === 'Moderate'
? 'bg-orange-100 text-orange-700'
                              : 'bg-green-100 text-green-700'
                            }`}>
                              {update.impact_level}
                            </span>
                            <span className="text-xs text-gray-500">{update.authority}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Sector Analysis Content */}
              {selectedSummaryType === 'sector' && (
                <div className="space-y-4">
                  {currentSummary.sectors.map((sector, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-medium text-gray-900">{sector.sector}</h3>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">{sector.updateCount} updates</div>
                          <div className="text-sm font-medium text-gray-900">{sector.avgRelevance}% relevance</div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{sector.topUpdate?.impact}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          {sector.keyTopics.map((topic, topicIdx) => (
                            <span key={topicIdx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {topic}
                            </span>
                          ))}
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          sector.impactRatio > 50
? 'bg-red-100 text-red-700'
                          : sector.impactRatio > 25
? 'bg-orange-100 text-orange-700'
                          : 'bg-green-100 text-green-700'
                        }`}>
                          {sector.impactRatio}% high impact
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Authority Spotlight Content */}
              {selectedSummaryType === 'authority' && (
                <div className="space-y-4">
                  {currentSummary.authorities.map((authority, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-medium text-gray-900">{authority.authority}</h3>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">{authority.updateCount} updates</div>
                          <div className="text-sm font-medium text-gray-900">Score: {authority.activityScore}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">{authority.highImpactCount}</div>
                          <div className="text-xs text-gray-500">High Impact</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">{authority.urgentCount}</div>
                          <div className="text-xs text-gray-500">Urgent</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">{authority.focusAreas.length}</div>
                          <div className="text-xs text-gray-500">Focus Areas</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          {authority.topThemes.map((theme, themeIdx) => (
                            <span key={themeIdx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                              {theme}
                            </span>
                          ))}
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Trend Analysis Content */}
              {selectedSummaryType === 'trends' && (
                <div className="space-y-6">
                  {/* Trend Indicators */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <TrendingUp className={`w-6 h-6 mr-2 ${
                          currentSummary.volumeChange >= 0 ? 'text-green-600' : 'text-red-600'
                        }`} />
                        <div>
                          <div className="text-lg font-semibold text-gray-900">
                            {currentSummary.volumeChange >= 0 ? '+' : ''}{currentSummary.volumeChange}%
                          </div>
                          <div className="text-sm text-gray-500">Volume Change</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <Zap className={`w-6 h-6 mr-2 ${
                          currentSummary.urgencyChange >= 0 ? 'text-orange-600' : 'text-green-600'
                        }`} />
                        <div>
                          <div className="text-lg font-semibold text-gray-900">
                            {currentSummary.urgencyChange >= 0 ? '+' : ''}{currentSummary.urgencyChange}%
                          </div>
                          <div className="text-sm text-gray-500">Urgency Change</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <Activity className="w-6 h-6 mr-2 text-blue-600" />
                        <div>
                          <div className="text-lg font-semibold text-gray-900 capitalize">
                            {currentSummary.momentum.strength}
                          </div>
                          <div className="text-sm text-gray-500">Momentum</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Emerging Themes */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Emerging Themes</h3>
                    <div className="flex flex-wrap gap-2">
                      {currentSummary.emergingThemes.map((theme, idx) => (
                        <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Trending Topics */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Trending Topics</h3>
                    <div className="flex flex-wrap gap-2">
                      {currentSummary.trendingTopics.map((topic, idx) => (
                        <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Insights */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Key Insights</h3>
                <div className="space-y-2">
                  {currentSummary.insights.map((insight, idx) => (
                    <div key={idx} className="flex items-start">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-sm text-gray-700">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SmartSummaries
