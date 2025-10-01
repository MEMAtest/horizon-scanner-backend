import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { Users, TrendingUp, Activity, Zap, FileText, Clock, Target, Award } from 'lucide-react'

const AuthoritySpotlight = () => {
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAuthority, setSelectedAuthority] = useState('all')
  const [timeframe, setTimeframe] = useState('30')
  const [authorityAnalysis, setAuthorityAnalysis] = useState({})

  const authorityColors = {
    'Financial Conduct Authority': '#3b82f6',
    'Bank of England': '#ef4444',
    'Prudential Regulation Authority': '#10b981',
    'HM Treasury': '#f59e0b',
    'Competition and Markets Authority': '#8b5cf6',
    'Information Commissioner\'s Office': '#06b6d4'
  }

  useEffect(() => {
    fetchAuthorityData()
  }, [timeframe])

  const fetchAuthorityData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/updates?limit=200&enhanced=true')
      const data = await response.json()
      setUpdates(data || [])
      analyzeAuthorityActivity(data || [])
    } catch (error) {
      console.error('Failed to fetch authority data:', error)
      setUpdates([])
    } finally {
      setLoading(false)
    }
  }

  const analyzeAuthorityActivity = (allUpdates) => {
    const days = parseInt(timeframe)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const filteredUpdates = allUpdates.filter(update =>
      new Date(update.fetched_date) >= cutoffDate
    )

    // Group updates by authority
    const authorityData = {}

    filteredUpdates.forEach(update => {
      const authority = update.authority || 'Unknown'
      if (!authorityData[authority]) {
        authorityData[authority] = {
          updates: [],
          totalUpdates: 0,
          highImpact: 0,
          urgentUpdates: 0,
          sectorFocus: {},
          themes: {},
          activityTimeline: {},
          avgImpactScore: 0,
          consistencyScore: 0,
          innovationScore: 0
        }
      }

      const authData = authorityData[authority]
      authData.updates.push(update)
      authData.totalUpdates++

      if (update.impact_level === 'Significant') authData.highImpact++
      if (update.urgency === 'High') authData.urgentUpdates++

      // Track sector focus
      if (update.sector_relevance_scores) {
        Object.entries(update.sector_relevance_scores).forEach(([sector, score]) => {
          if (score > 25) {
            authData.sectorFocus[sector] = (authData.sectorFocus[sector] || 0) + score
          }
        })
      }

      // Extract themes
      const themes = extractThemesFromUpdate(update)
      themes.forEach(theme => {
        authData.themes[theme] = (authData.themes[theme] || 0) + 1
      })

      // Timeline tracking
      const week = getWeekKey(update.fetched_date)
      authData.activityTimeline[week] = (authData.activityTimeline[week] || 0) + 1
    })

    // Calculate derived metrics for each authority
    Object.values(authorityData).forEach(authData => {
      authData.avgImpactScore = calculateAverageImpactScore(authData.updates)
      authData.consistencyScore = calculateConsistencyScore(authData.activityTimeline)
      authData.innovationScore = calculateInnovationScore(authData.themes)
      authData.topSectors = getTopSectors(authData.sectorFocus)
      authData.topThemes = getTopThemes(authData.themes)
      authData.activityTrend = calculateActivityTrend(authData.activityTimeline)
      authData.authorityProfile = generateAuthorityProfile(authData)
    })

    setAuthorityAnalysis(authorityData)
  }

  const extractThemesFromUpdate = (update) => {
    const text = `${update.headline} ${update.impact}`.toLowerCase()
    const themes = []

    const themePatterns = {
      'Digital Innovation': ['digital', 'fintech', 'technology', 'innovation', 'ai', 'blockchain'],
      'Consumer Protection': ['consumer', 'protection', 'fair treatment', 'vulnerable', 'complaints'],
      'Market Integrity': ['market abuse', 'manipulation', 'integrity', 'trading', 'market conduct'],
      'Operational Resilience': ['operational', 'resilience', 'outsourcing', 'business continuity'],
      'Capital & Liquidity': ['capital', 'basel', 'liquidity', 'leverage', 'prudential'],
      'Climate & ESG': ['climate', 'esg', 'sustainability', 'green', 'environmental'],
      'Reporting & Data': ['reporting', 'data', 'disclosure', 'transparency', 'submission'],
      Enforcement: ['enforcement', 'penalty', 'fine', 'action', 'investigation'],
      International: ['international', 'global', 'cross-border', 'eu', 'basel'],
      'Systemic Risk': ['systemic', 'financial stability', 'macroprudential', 'stress']
    }

    Object.entries(themePatterns).forEach(([theme, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        themes.push(theme)
      }
    })

    return themes
  }

  const getWeekKey = (dateString) => {
    const date = new Date(dateString)
    const week = Math.floor((date - new Date(date.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000))
    return `${date.getFullYear()}-W${week}`
  }

  const calculateAverageImpactScore = (updates) => {
    if (updates.length === 0) return 0

    const impactWeights = { Significant: 3, Moderate: 2, Informational: 1 }
    const urgencyWeights = { High: 3, Medium: 2, Low: 1 }

    const totalScore = updates.reduce((sum, update) => {
      const impactWeight = impactWeights[update.impact_level] || 1
      const urgencyWeight = urgencyWeights[update.urgency] || 1
      return sum + (impactWeight * urgencyWeight)
    }, 0)

    return Math.round((totalScore / updates.length) * 10)
  }

  const calculateConsistencyScore = (timeline) => {
    const weeks = Object.values(timeline)
    if (weeks.length === 0) return 0

    const avg = weeks.reduce((sum, count) => sum + count, 0) / weeks.length
    const variance = weeks.reduce((sum, count) => sum + Math.pow(count - avg, 2), 0) / weeks.length
    const stdDev = Math.sqrt(variance)

    // Lower variance = higher consistency (inverse relationship)
    return Math.max(0, Math.round(100 - (stdDev * 10)))
  }

  const calculateInnovationScore = (themes) => {
    const innovativeThemes = ['Digital Innovation', 'Climate & ESG', 'International']
    const innovationCount = innovativeThemes.reduce((sum, theme) => sum + (themes[theme] || 0), 0)
    const totalThemes = Object.values(themes).reduce((sum, count) => sum + count, 0)

    return totalThemes > 0 ? Math.round((innovationCount / totalThemes) * 100) : 0
  }

  const getTopSectors = (sectorFocus) => {
    return Object.entries(sectorFocus)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([sector, score]) => ({ sector, score: Math.round(score) }))
  }

  const getTopThemes = (themes) => {
    return Object.entries(themes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([theme, count]) => ({ theme, count }))
  }

  const calculateActivityTrend = (timeline) => {
    const weeks = Object.keys(timeline).sort()
    if (weeks.length < 2) return 'stable'

    const midpoint = Math.floor(weeks.length / 2)
    const recentActivity = weeks.slice(midpoint).reduce((sum, week) => sum + timeline[week], 0)
    const earlierActivity = weeks.slice(0, midpoint).reduce((sum, week) => sum + timeline[week], 0)

    const change = ((recentActivity - earlierActivity) / earlierActivity) * 100

    if (change > 20) return 'increasing'
    if (change < -20) return 'decreasing'
    return 'stable'
  }

  const generateAuthorityProfile = (authData) => {
    const { totalUpdates, highImpact, avgImpactScore, consistencyScore, innovationScore } = authData

    let profile = 'Moderate Activity'
    let description = 'Standard regulatory activity levels'

    if (totalUpdates > 30 && avgImpactScore > 60) {
      profile = 'High Impact Leader'
      description = 'Frequent high-impact regulatory activity'
    } else if (innovationScore > 50) {
      profile = 'Innovation Focused'
      description = 'Strong focus on emerging regulatory themes'
    } else if (consistencyScore > 80) {
      profile = 'Steady Regulator'
      description = 'Consistent and predictable regulatory output'
    } else if (highImpact > 10) {
      profile = 'Significant Impact'
      description = 'Regular significant regulatory interventions'
    }

    return { profile, description }
  }

  const getActivityData = () => {
    return Object.entries(authorityAnalysis)
      .map(([authority, data]) => ({
        authority: authority.replace('Financial Conduct Authority', 'FCA')
          .replace('Prudential Regulation Authority', 'PRA')
          .replace('Bank of England', 'BoE')
          .replace('Competition and Markets Authority', 'CMA')
          .replace('Information Commissioner\'s Office', 'ICO'),
        fullName: authority,
        updates: data.totalUpdates,
        highImpact: data.highImpact,
        impactScore: data.avgImpactScore,
        consistency: data.consistencyScore,
        innovation: data.innovationScore
      }))
      .sort((a, b) => b.updates - a.updates)
      .slice(0, 8)
  }

  const getSelectedAuthorityData = () => {
    if (selectedAuthority === 'all') return null
    return authorityAnalysis[selectedAuthority]
  }

  const getAuthorityOptions = () => {
    return Object.keys(authorityAnalysis).sort()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Analyzing authority activity...</span>
      </div>
    )
  }

  const activityData = getActivityData()
  const selectedData = getSelectedAuthorityData()
  const totalAuthorities = Object.keys(authorityAnalysis).length
  const totalUpdates = Object.values(authorityAnalysis).reduce((sum, auth) => sum + auth.totalUpdates, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-lg">
        <h1 className="text-2xl font-bold flex items-center">
          <Users className="mr-3" />
          Authority Spotlight
        </h1>
        <p className="text-purple-100 mt-1">
          In-depth analysis of regulatory authority activity and trends
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="text-sm text-gray-600 mr-2">Timeframe:</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
              <option value="60">Last 60 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600 mr-2">Focus Authority:</label>
            <select
              value={selectedAuthority}
              onChange={(e) => setSelectedAuthority(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="all">All Authorities</option>
              {getAuthorityOptions().map(authority => (
                <option key={authority} value={authority}>{authority}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Active Authorities</p>
              <p className="text-2xl font-bold text-gray-900">{totalAuthorities}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <FileText className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Total Updates</p>
              <p className="text-2xl font-bold text-gray-900">{totalUpdates}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <Target className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">High Impact Updates</p>
              <p className="text-2xl font-bold text-gray-900">
                {Object.values(authorityAnalysis).reduce((sum, auth) => sum + auth.highImpact, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <Award className="w-8 h-8 text-orange-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Avg Impact Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(Object.values(authorityAnalysis).reduce((sum, auth) => sum + auth.avgImpactScore, 0) / totalAuthorities) || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Authority Activity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Volume Chart */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Authority Activity Volume</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="authority"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={11}
                />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [value, name === 'updates' ? 'Total Updates' : 'High Impact']}
                />
                <Bar dataKey="updates" fill="#3b82f6" name="updates" />
                <Bar dataKey="highImpact" fill="#ef4444" name="highImpact" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Authority Metrics */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Authority Performance Metrics</h3>
          <div className="space-y-4">
            {activityData.slice(0, 6).map((authority, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-medium text-gray-900">{authority.authority}</div>
                  <div className="text-sm text-gray-500">
                    {authority.updates} updates • {authority.highImpact} high impact
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex space-x-4 text-sm">
                    <div>
                      <div className="text-xs text-gray-500">Impact</div>
                      <div className="font-medium">{authority.impactScore}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Consistency</div>
                      <div className="font-medium">{authority.consistency}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Innovation</div>
                      <div className="font-medium">{authority.innovation}%</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Authority Deep Dive */}
      {selectedData && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedAuthority} - Deep Dive Analysis
              </h2>
              <div className="text-sm text-gray-500">
                {selectedData.authorityProfile.profile}
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Profile Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Authority Profile</h3>
              <p className="text-sm text-gray-700">{selectedData.authorityProfile.description}</p>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{selectedData.avgImpactScore}</div>
                  <div className="text-xs text-gray-500">Impact Score</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{selectedData.consistencyScore}%</div>
                  <div className="text-xs text-gray-500">Consistency</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{selectedData.innovationScore}%</div>
                  <div className="text-xs text-gray-500">Innovation</div>
                </div>
              </div>
            </div>

            {/* Key Focus Areas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Sector Focus</h3>
                <div className="space-y-2">
                  {selectedData.topSectors.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{item.sector}</span>
                      <div className="flex items-center">
                        <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${Math.min(100, (item.score / 1000) * 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{item.score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-3">Key Themes</h3>
                <div className="space-y-2">
                  {selectedData.topThemes.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{item.theme}</span>
                      <span className="text-sm font-medium text-gray-900">{item.count} updates</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Activity Trend */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Activity Summary</h3>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{selectedData.totalUpdates}</div>
                  <div className="text-sm text-gray-500">Total Updates</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{selectedData.highImpact}</div>
                  <div className="text-sm text-gray-500">High Impact</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{selectedData.urgentUpdates}</div>
                  <div className="text-sm text-gray-500">Urgent</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold capitalize ${
                    selectedData.activityTrend === 'increasing'
? 'text-green-600'
                    : selectedData.activityTrend === 'decreasing' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {selectedData.activityTrend}
                  </div>
                  <div className="text-sm text-gray-500">Trend</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comparative Analysis */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Comparative Authority Analysis</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Most Active</h4>
              <div className="space-y-2">
                {activityData.slice(0, 3).map((authority, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{authority.authority}</span>
                    <span className="text-sm font-medium text-gray-900">{authority.updates} updates</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Highest Impact</h4>
              <div className="space-y-2">
                {activityData.sort((a, b) => b.impactScore - a.impactScore).slice(0, 3).map((authority, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{authority.authority}</span>
                    <span className="text-sm font-medium text-gray-900">Score: {authority.impactScore}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Most Innovative</h4>
              <div className="space-y-2">
                {activityData.sort((a, b) => b.innovation - a.innovation).slice(0, 3).map((authority, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{authority.authority}</span>
                    <span className="text-sm font-medium text-gray-900">{authority.innovation}% innovation</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthoritySpotlight
