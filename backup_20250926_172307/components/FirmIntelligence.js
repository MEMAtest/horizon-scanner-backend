import React, { useState, useEffect } from 'react'
import { Building, Target, Star, TrendingUp, AlertCircle, Settings, User, BarChart3 } from 'lucide-react'

const FirmIntelligence = () => {
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)
  const [firmProfile, setFirmProfile] = useState(null)
  const [personalizedInsights, setPersonalizedInsights] = useState({})
  const [showProfileSetup, setShowProfileSetup] = useState(false)

  // Default firm profile template
  const defaultProfile = {
    firmName: '',
    primarySectors: [],
    firmSize: 'medium',
    riskAppetite: 'moderate',
    complianceMaturity: 'developing',
    focusAreas: [],
    businessModel: 'traditional'
  }

  const sectorOptions = [
    'Banking', 'Investment Management', 'Insurance', 'Consumer Credit',
    'Payments', 'Pensions', 'Capital Markets', 'Fintech'
  ]

  const focusAreaOptions = [
    'Operational Resilience', 'Consumer Protection', 'Market Conduct',
    'Capital Requirements', 'Reporting & Disclosure', 'ESG & Sustainability',
    'Digital Innovation', 'Risk Management', 'Regulatory Technology'
  ]

  useEffect(() => {
    // Load firm profile from localStorage
    const savedProfile = localStorage.getItem('firmProfile')
    if (savedProfile) {
      setFirmProfile(JSON.parse(savedProfile))
    } else {
      setShowProfileSetup(true)
    }

    fetchPersonalizedData()
  }, [])

  useEffect(() => {
    if (firmProfile && updates.length > 0) {
      generatePersonalizedInsights()
    }
  }, [firmProfile, updates])

  const fetchPersonalizedData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/updates?limit=100&enhanced=true')
      const data = await response.json()
      setUpdates(data || [])
    } catch (error) {
      console.error('Failed to fetch personalized data:', error)
      setUpdates([])
    } finally {
      setLoading(false)
    }
  }

  const generatePersonalizedInsights = () => {
    const relevantUpdates = filterRelevantUpdates()
    const priorityScore = calculatePriorityScore()
    const complianceActions = generateComplianceActions(relevantUpdates)
    const riskAssessment = generateRiskAssessment(relevantUpdates)
    const recommendations = generateRecommendations(relevantUpdates)
    const firmSpecificTrends = analyzeFirmSpecificTrends(relevantUpdates)

    setPersonalizedInsights({
      relevantUpdates,
      priorityScore,
      complianceActions,
      riskAssessment,
      recommendations,
      firmSpecificTrends,
      relevanceStats: calculateRelevanceStats(relevantUpdates)
    })
  }

  const filterRelevantUpdates = () => {
    if (!firmProfile) return []

    return updates.map(update => {
      let relevanceScore = 0
      const relevanceFactors = []

      // Sector relevance
      if (update.sector_relevance_scores && firmProfile.primarySectors) {
        firmProfile.primarySectors.forEach(sector => {
          const score = update.sector_relevance_scores[sector] || 0
          relevanceScore += score * 0.4 // 40% weight for sector match
          if (score > 30) {
            relevanceFactors.push(`High relevance to ${sector}`)
          }
        })
      }

      // Focus area relevance
      if (firmProfile.focusAreas) {
        const updateText = `${update.headline} ${update.impact}`.toLowerCase()
        firmProfile.focusAreas.forEach(focusArea => {
          const keywords = getFocusAreaKeywords(focusArea)
          const matches = keywords.filter(keyword => updateText.includes(keyword.toLowerCase()))
          if (matches.length > 0) {
            relevanceScore += matches.length * 15 // 15 points per keyword match
            relevanceFactors.push(`Relates to ${focusArea}`)
          }
        })
      }

      // Business model relevance
      const businessModelScore = getBusinessModelRelevance(update, firmProfile.businessModel)
      relevanceScore += businessModelScore
      if (businessModelScore > 20) {
        relevanceFactors.push(`Important for ${firmProfile.businessModel} firms`)
      }

      // Risk appetite alignment
      const riskAlignment = getRiskAlignment(update, firmProfile.riskAppetite)
      relevanceScore += riskAlignment

      // Firm size considerations
      const sizeRelevance = getFirmSizeRelevance(update, firmProfile.firmSize)
      relevanceScore += sizeRelevance
      if (sizeRelevance > 15) {
        relevanceFactors.push(`Particularly relevant for ${firmProfile.firmSize} firms`)
      }

      return {
        ...update,
        relevanceScore: Math.round(relevanceScore),
        relevanceFactors,
        personalizedPriority: getPersonalizedPriority(relevanceScore, update.urgency, update.impact_level)
      }
    })
      .filter(update => update.relevanceScore > 20) // Only show reasonably relevant updates
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
  }

  const getFocusAreaKeywords = (focusArea) => {
    const keywordMap = {
      'Operational Resilience': ['operational', 'resilience', 'outsourcing', 'business continuity', 'incident'],
      'Consumer Protection': ['consumer', 'protection', 'fair treatment', 'vulnerable', 'complaints'],
      'Market Conduct': ['market conduct', 'market abuse', 'integrity', 'trading', 'manipulation'],
      'Capital Requirements': ['capital', 'basel', 'prudential', 'leverage', 'liquidity'],
      'Reporting & Disclosure': ['reporting', 'disclosure', 'transparency', 'data', 'submission'],
      'ESG & Sustainability': ['esg', 'sustainability', 'climate', 'green', 'environmental'],
      'Digital Innovation': ['digital', 'fintech', 'innovation', 'technology', 'ai', 'blockchain'],
      'Risk Management': ['risk management', 'risk assessment', 'risk appetite', 'governance'],
      'Regulatory Technology': ['regtech', 'technology', 'automation', 'digital transformation']
    }
    return keywordMap[focusArea] || []
  }

  const getBusinessModelRelevance = (update, businessModel) => {
    const updateText = `${update.headline} ${update.impact}`.toLowerCase()

    const modelKeywords = {
      traditional: ['traditional', 'established', 'bank', 'institution'],
      digital: ['digital', 'online', 'fintech', 'technology', 'app'],
      hybrid: ['hybrid', 'digital transformation', 'modernization'],
      niche: ['specialist', 'niche', 'boutique', 'specialized']
    }

    const keywords = modelKeywords[businessModel] || []
    return keywords.filter(keyword => updateText.includes(keyword)).length * 10
  }

  const getRiskAlignment = (update, riskAppetite) => {
    const urgencyWeight = {
      conservative: { High: 25, Medium: 15, Low: 5 },
      moderate: { High: 20, Medium: 20, Low: 10 },
      aggressive: { High: 15, Medium: 25, Low: 15 }
    }

    const weights = urgencyWeight[riskAppetite] || urgencyWeight.moderate
    return weights[update.urgency] || 10
  }

  const getFirmSizeRelevance = (update, firmSize) => {
    const updateText = `${update.headline} ${update.impact}`.toLowerCase()

    const sizeKeywords = {
      small: ['small firm', 'sme', 'proportionality', 'simplified'],
      medium: ['medium', 'mid-size', 'regional'],
      large: ['large firm', 'systemically important', 'major', 'tier 1'],
      multinational: ['global', 'international', 'cross-border', 'multinational']
    }

    const keywords = sizeKeywords[firmSize] || []
    return keywords.filter(keyword => updateText.includes(keyword)).length * 12
  }

  const getPersonalizedPriority = (relevanceScore, urgency, impactLevel) => {
    let priority = relevanceScore

    if (urgency === 'High') priority += 30
    else if (urgency === 'Medium') priority += 15

    if (impactLevel === 'Significant') priority += 25
    else if (impactLevel === 'Moderate') priority += 10

    if (priority >= 80) return 'Critical'
    if (priority >= 60) return 'High'
    if (priority >= 40) return 'Medium'
    return 'Low'
  }

  const calculatePriorityScore = () => {
    if (!personalizedInsights.relevantUpdates) return 0

    const criticalCount = personalizedInsights.relevantUpdates?.filter(u => u.personalizedPriority === 'Critical').length || 0
    const highCount = personalizedInsights.relevantUpdates?.filter(u => u.personalizedPriority === 'High').length || 0

    return Math.min(100, (criticalCount * 20) + (highCount * 10))
  }

  const generateComplianceActions = (relevantUpdates) => {
    const actions = []

    relevantUpdates.slice(0, 10).forEach(update => {
      if (update.personalizedPriority === 'Critical' || update.personalizedPriority === 'High') {
        const action = {
          title: extractActionTitle(update),
          description: update.impact,
          deadline: extractDeadline(update),
          priority: update.personalizedPriority,
          source: update.authority,
          relevanceFactors: update.relevanceFactors.slice(0, 2)
        }
        actions.push(action)
      }
    })

    return actions.slice(0, 8)
  }

  const extractActionTitle = (update) => {
    const headline = update.headline
    if (headline.toLowerCase().includes('consultation')) return 'Review and respond to consultation'
    if (headline.toLowerCase().includes('guidance')) return 'Implement new guidance'
    if (headline.toLowerCase().includes('deadline')) return 'Meet compliance deadline'
    if (headline.toLowerCase().includes('reporting')) return 'Update reporting procedures'
    return 'Review regulatory update'
  }

  const extractDeadline = (update) => {
    const text = `${update.headline} ${update.key_dates || ''}`
    const datePattern = /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/gi
    const match = text.match(datePattern)
    return match ? match[0] : null
  }

  const generateRiskAssessment = (relevantUpdates) => {
    const riskCategories = {
      'Operational Risk': 0,
      'Compliance Risk': 0,
      'Reputational Risk': 0,
      'Financial Risk': 0,
      'Strategic Risk': 0
    }

    relevantUpdates.forEach(update => {
      const text = `${update.headline} ${update.impact}`.toLowerCase()

      if (text.includes('operational') || text.includes('resilience')) riskCategories['Operational Risk'] += update.relevanceScore
      if (text.includes('compliance') || text.includes('enforcement')) riskCategories['Compliance Risk'] += update.relevanceScore
      if (text.includes('consumer') || text.includes('conduct')) riskCategories['Reputational Risk'] += update.relevanceScore
      if (text.includes('capital') || text.includes('financial')) riskCategories['Financial Risk'] += update.relevanceScore
      if (text.includes('strategy') || text.includes('business model')) riskCategories['Strategic Risk'] += update.relevanceScore
    })

    return Object.entries(riskCategories)
      .map(([category, score]) => ({
        category,
        score: Math.round(score / 10),
        level: score > 500 ? 'High' : score > 200 ? 'Medium' : 'Low'
      }))
      .sort((a, b) => b.score - a.score)
  }

  const generateRecommendations = (relevantUpdates) => {
    const recommendations = []

    if (relevantUpdates.filter(u => u.personalizedPriority === 'Critical').length > 3) {
      recommendations.push({
        type: 'Immediate Action',
        title: 'Prioritize Critical Updates',
        description: 'Multiple critical regulatory updates require immediate attention.',
        action: 'Schedule compliance team meeting to address priority items'
      })
    }

    const focusAreaCounts = {}
    relevantUpdates.forEach(update => {
      update.relevanceFactors.forEach(factor => {
        if (factor.includes('Relates to')) {
          const area = factor.replace('Relates to ', '')
          focusAreaCounts[area] = (focusAreaCounts[area] || 0) + 1
        }
      })
    })

    const topFocusArea = Object.entries(focusAreaCounts).sort(([, a], [, b]) => b - a)[0]
    if (topFocusArea && topFocusArea[1] > 2) {
      recommendations.push({
        type: 'Strategic Focus',
        title: `Strengthen ${topFocusArea[0]} Capabilities`,
        description: `High regulatory activity in ${topFocusArea[0]} area.`,
        action: 'Consider additional resources or expert consultation'
      })
    }

    return recommendations
  }

  const analyzeFirmSpecificTrends = (relevantUpdates) => {
    const last30Days = relevantUpdates.filter(update => {
      const updateDate = new Date(update.fetched_date)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return updateDate >= thirtyDaysAgo
    })

    const currentActivity = last30Days.length
    const avgRelevanceScore = last30Days.reduce((sum, update) => sum + update.relevanceScore, 0) / last30Days.length || 0

    return {
      currentActivity,
      avgRelevanceScore: Math.round(avgRelevanceScore),
      trend: currentActivity > 10 ? 'increasing' : currentActivity > 5 ? 'stable' : 'decreasing',
      topSector: getMostRelevantSector(last30Days)
    }
  }

  const getMostRelevantSector = (updates) => {
    const sectorScores = {}

    updates.forEach(update => {
      if (update.sector_relevance_scores && firmProfile?.primarySectors) {
        firmProfile.primarySectors.forEach(sector => {
          const score = update.sector_relevance_scores[sector] || 0
          sectorScores[sector] = (sectorScores[sector] || 0) + score
        })
      }
    })

    const topSector = Object.entries(sectorScores).sort(([, a], [, b]) => b - a)[0]
    return topSector ? topSector[0] : 'General'
  }

  const calculateRelevanceStats = (relevantUpdates) => {
    const total = relevantUpdates.length
    const highRelevance = relevantUpdates.filter(u => u.relevanceScore > 70).length
    const withDeadlines = relevantUpdates.filter(u => extractDeadline(u)).length
    const avgScore = relevantUpdates.reduce((sum, u) => sum + u.relevanceScore, 0) / total || 0

    return { total, highRelevance, withDeadlines, avgScore: Math.round(avgScore) }
  }

  const saveFirmProfile = (profile) => {
    setFirmProfile(profile)
    localStorage.setItem('firmProfile', JSON.stringify(profile))
    setShowProfileSetup(false)
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'text-red-700 bg-red-100 border-red-300'
      case 'High': return 'text-orange-700 bg-orange-100 border-orange-300'
      case 'Medium': return 'text-yellow-700 bg-yellow-100 border-yellow-300'
      case 'Low': return 'text-green-700 bg-green-100 border-green-300'
      default: return 'text-gray-700 bg-gray-100 border-gray-300'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Generating personalized insights...</span>
      </div>
    )
  }

  if (showProfileSetup) {
    return <FirmProfileSetup onSave={saveFirmProfile} defaultProfile={defaultProfile} />
  }

  const priorityScore = calculatePriorityScore()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <Building className="mr-3" />
              Firm Intelligence
            </h1>
            <p className="text-blue-100 mt-1">
              Personalized regulatory insights for {firmProfile?.firmName || 'your firm'}
            </p>
          </div>
          <div className="text-right">
            <button
              onClick={() => setShowProfileSetup(true)}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded flex items-center transition-all"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Firm Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <Target className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Priority Score</p>
              <p className="text-2xl font-bold text-gray-900">{priorityScore}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <Star className="w-8 h-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Relevant Updates</p>
              <p className="text-2xl font-bold text-gray-900">{personalizedInsights.relevanceStats?.total || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">High Priority</p>
              <p className="text-2xl font-bold text-gray-900">
                {personalizedInsights.relevantUpdates?.filter(u => u.personalizedPriority === 'Critical' || u.personalizedPriority === 'High').length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Avg Relevance</p>
              <p className="text-2xl font-bold text-gray-900">{personalizedInsights.relevanceStats?.avgScore || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Firm Profile Summary */}
      {firmProfile && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Firm Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Primary Sectors</h3>
              <div className="flex flex-wrap gap-1">
                {firmProfile.primarySectors.map((sector, idx) => (
                  <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                    {sector}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Focus Areas</h3>
              <div className="flex flex-wrap gap-1">
                {firmProfile.focusAreas.slice(0, 3).map((area, idx) => (
                  <span key={idx} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                    {area}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Firm Details</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Size: <span className="font-medium capitalize">{firmProfile.firmSize}</span></div>
                <div>Risk Appetite: <span className="font-medium capitalize">{firmProfile.riskAppetite}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Priority Updates */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Priority Updates for Your Firm</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {personalizedInsights.relevantUpdates?.slice(0, 8).map((update, idx) => (
            <div key={idx} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">{update.headline}</h3>
                  <p className="text-sm text-gray-600 mb-3">{update.impact}</p>

                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(update.personalizedPriority)}`}>
                      {update.personalizedPriority} Priority
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {update.relevanceScore}% relevant
                    </span>
                    <span className="text-xs text-gray-500">{update.authority}</span>
                  </div>

                  {update.relevanceFactors.length > 0 && (
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">Why this matters: </span>
                      {update.relevanceFactors.join(', ')}
                    </div>
                  )}
                </div>

                <div className="ml-4 text-right">
                  <div className="text-sm font-semibold text-gray-900 mb-1">
                    {update.relevanceScore}%
                  </div>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${Math.min(100, update.relevanceScore)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Firm Profile Setup Component
const FirmProfileSetup = ({ onSave, defaultProfile }) => {
  const [profile, setProfile] = useState(defaultProfile)

  const sectorOptions = [
    'Banking', 'Investment Management', 'Insurance', 'Consumer Credit',
    'Payments', 'Pensions', 'Capital Markets', 'Fintech'
  ]

  const focusAreaOptions = [
    'Operational Resilience', 'Consumer Protection', 'Market Conduct',
    'Capital Requirements', 'Reporting & Disclosure', 'ESG & Sustainability',
    'Digital Innovation', 'Risk Management', 'Regulatory Technology'
  ]

  const handleSectorToggle = (sector) => {
    const newSectors = profile.primarySectors.includes(sector)
      ? profile.primarySectors.filter(s => s !== sector)
      : [...profile.primarySectors, sector]
    setProfile({ ...profile, primarySectors: newSectors })
  }

  const handleFocusAreaToggle = (area) => {
    const newAreas = profile.focusAreas.includes(area)
      ? profile.focusAreas.filter(a => a !== area)
      : [...profile.focusAreas, area]
    setProfile({ ...profile, focusAreas: newAreas })
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Setup Your Firm Profile</h2>
        <p className="text-gray-600">Configure your firm details to receive personalized regulatory insights.</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Firm Name
          </label>
          <input
            type="text"
            value={profile.firmName}
            onChange={(e) => setProfile({ ...profile, firmName: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="Enter your firm name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primary Sectors (select all that apply)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {sectorOptions.map((sector) => (
              <button
                key={sector}
                onClick={() => handleSectorToggle(sector)}
                className={`p-2 text-sm rounded border transition-colors ${
                  profile.primarySectors.includes(sector)
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {sector}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Firm Size
            </label>
            <select
              value={profile.firmSize}
              onChange={(e) => setProfile({ ...profile, firmSize: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="small">Small (1-50 employees)</option>
              <option value="medium">Medium (51-250 employees)</option>
              <option value="large">Large (251-1000 employees)</option>
              <option value="multinational">Multinational (1000+ employees)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Risk Appetite
            </label>
            <select
              value={profile.riskAppetite}
              onChange={(e) => setProfile({ ...profile, riskAppetite: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="conservative">Conservative</option>
              <option value="moderate">Moderate</option>
              <option value="aggressive">Aggressive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Model
            </label>
            <select
              value={profile.businessModel}
              onChange={(e) => setProfile({ ...profile, businessModel: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="traditional">Traditional</option>
              <option value="digital">Digital-First</option>
              <option value="hybrid">Hybrid</option>
              <option value="niche">Niche/Specialist</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Focus Areas (select up to 5)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {focusAreaOptions.map((area) => (
              <button
                key={area}
                onClick={() => handleFocusAreaToggle(area)}
                disabled={!profile.focusAreas.includes(area) && profile.focusAreas.length >= 5}
                className={`p-2 text-sm rounded border transition-colors ${
                  profile.focusAreas.includes(area)
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 disabled:opacity-50'
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => onSave(profile)}
            disabled={!profile.firmName || profile.primarySectors.length === 0}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Profile
          </button>
        </div>
      </div>
    </div>
  )
}

export default FirmIntelligence
