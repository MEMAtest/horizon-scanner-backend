import React, { useState, useEffect } from 'react'
import { AlertTriangle, TrendingUp, Clock, Target, Bell, Filter, RotateCcw, Eye } from 'lucide-react'

const ProactiveIntelligence = () => {
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSector, setSelectedSector] = useState('all')
  const [urgencyFilter, setUrgencyFilter] = useState('all')
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const sectors = [
    'Banking', 'Investment Management', 'Insurance', 'Consumer Credit',
    'Payments', 'Pensions', 'Capital Markets', 'Fintech'
  ]

  const urgencyLevels = ['High', 'Medium', 'Low']

  useEffect(() => {
    fetchIntelligenceData()
  }, [])

  const fetchIntelligenceData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/updates?limit=50&enhanced=true')
      const data = await response.json()
      setUpdates(data || [])
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Failed to fetch intelligence data:', error)
      setUpdates([])
    } finally {
      setLoading(false)
    }
  }

  const getFilteredUpdates = () => {
    return updates.filter(update => {
      const sectorMatch = selectedSector === 'all' ||
        (update.primary_sectors && update.primary_sectors.includes(selectedSector)) ||
        (update.sector && update.sector.toLowerCase().includes(selectedSector.toLowerCase()))

      const urgencyMatch = urgencyFilter === 'all' ||
        (update.urgency && update.urgency.toLowerCase() === urgencyFilter.toLowerCase())

      return sectorMatch && urgencyMatch
    })
  }

  const getUrgencyColor = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getImpactLevelColor = (impactLevel) => {
    switch (impactLevel?.toLowerCase()) {
      case 'significant': return 'text-purple-700 bg-purple-100'
      case 'moderate': return 'text-blue-700 bg-blue-100'
      case 'informational': return 'text-gray-700 bg-gray-100'
      default: return 'text-gray-700 bg-gray-100'
    }
  }

  const getTopSectorByRelevance = (update) => {
    if (!update.sector_relevance_scores) return update.sector || 'General'

    const scores = update.sector_relevance_scores
    const topSector = Object.entries(scores).reduce((max, [sector, score]) =>
      score > max.score ? { sector, score } : max, { sector: 'General', score: 0 })

    return topSector.sector
  }

  const getPriorityUpdates = () => {
    return getFilteredUpdates()
      .filter(update => update.urgency?.toLowerCase() === 'high' || update.impact_level?.toLowerCase() === 'significant')
      .slice(0, 3)
  }

  const getRecentTrends = () => {
    const last7Days = new Date()
    last7Days.setDate(last7Days.getDate() - 7)

    const recentUpdates = updates.filter(update =>
      new Date(update.fetched_date) > last7Days
    )

    const authorityCount = {}
    const sectorCount = {}

    recentUpdates.forEach(update => {
      authorityCount[update.authority] = (authorityCount[update.authority] || 0) + 1
      const sector = getTopSectorByRelevance(update)
      sectorCount[sector] = (sectorCount[sector] || 0) + 1
    })

    return {
      totalUpdates: recentUpdates.length,
      topAuthority: Object.entries(authorityCount).sort(([, a], [, b]) => b - a)[0],
      topSector: Object.entries(sectorCount).sort(([, a], [, b]) => b - a)[0]
    }
  }

  const filteredUpdates = getFilteredUpdates()
  const priorityUpdates = getPriorityUpdates()
  const trends = getRecentTrends()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading intelligence data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <Target className="mr-3" />
              Proactive Intelligence Dashboard
            </h1>
            <p className="text-blue-100 mt-1">
              AI-powered regulatory insights and early warnings
            </p>
          </div>
          <div className="text-right">
            <button
              onClick={fetchIntelligenceData}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded flex items-center transition-all"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <p className="text-blue-100 text-sm mt-1">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Intelligence Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">High Priority</p>
              <p className="text-2xl font-bold text-gray-900">{priorityUpdates.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">7-Day Activity</p>
              <p className="text-2xl font-bold text-gray-900">{trends.totalUpdates}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <Eye className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Top Authority</p>
              <p className="text-lg font-semibold text-gray-900">
                {trends.topAuthority ? trends.topAuthority[0] : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <Target className="w-8 h-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Top Sector</p>
              <p className="text-lg font-semibold text-gray-900">
                {trends.topSector ? trends.topSector[0] : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center">
            <Filter className="w-4 h-4 text-gray-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>

          <div>
            <label className="text-sm text-gray-600 mr-2">Sector:</label>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="all">All Sectors</option>
              {sectors.map(sector => (
                <option key={sector} value={sector}>{sector}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600 mr-2">Urgency:</label>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="all">All Urgency</option>
              {urgencyLevels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          <div className="text-sm text-gray-500">
            Showing {filteredUpdates.length} of {updates.length} updates
          </div>
        </div>
      </div>

      {/* Priority Alerts */}
      {priorityUpdates.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800 flex items-center mb-3">
            <Bell className="w-5 h-5 mr-2" />
            Priority Alerts
          </h2>
          <div className="space-y-3">
            {priorityUpdates.map((update, idx) => (
              <div key={idx} className="bg-white p-3 rounded border border-red-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{update.headline}</h3>
                    <p className="text-sm text-gray-600 mt-1">{update.impact}</p>
                    <div className="flex items-center mt-2 space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getUrgencyColor(update.urgency)}`}>
                        {update.urgency}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getImpactLevelColor(update.impact_level)}`}>
                        {update.impact_level}
                      </span>
                      <span className="text-xs text-gray-500">{update.authority}</span>
                    </div>
                  </div>
                  <Clock className="w-4 h-4 text-gray-400 ml-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Intelligence Updates */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Intelligence Updates</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredUpdates.slice(0, 10).map((update, idx) => (
            <div key={idx} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">{update.headline}</h3>
                  <p className="text-sm text-gray-600 mb-2">{update.impact}</p>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getUrgencyColor(update.urgency)}`}>
                      {update.urgency || 'Low'}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getImpactLevelColor(update.impact_level)}`}>
                      {update.impact_level || 'Informational'}
                    </span>
                    <span className="text-xs text-gray-500">{update.authority}</span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500">{getTopSectorByRelevance(update)}</span>
                  </div>
                </div>
                <div className="text-xs text-gray-400 ml-4">
                  {new Date(update.fetched_date).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ProactiveIntelligence
