import React, { useState, useEffect } from 'react'
import { Calendar, Clock, AlertTriangle, CheckCircle, ArrowRight, Filter, Bell } from 'lucide-react'

const DeadlineTracker = () => {
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)
  const [deadlines, setDeadlines] = useState([])
  const [filterType, setFilterType] = useState('all')
  const [filterUrgency, setFilterUrgency] = useState('all')

  const deadlineTypes = ['Consultation', 'Implementation', 'Reporting', 'Compliance', 'Other']
  const urgencyLevels = ['Overdue', 'This Week', 'This Month', 'This Quarter', 'Future']

  useEffect(() => {
    fetchDeadlineData()
  }, [])

  const fetchDeadlineData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/updates?limit=200&enhanced=true')
      const data = await response.json()
      setUpdates(data || [])
      extractAndAnalyzeDeadlines(data || [])
    } catch (error) {
      console.error('Failed to fetch deadline data:', error)
      setUpdates([])
    } finally {
      setLoading(false)
    }
  }

  const extractAndAnalyzeDeadlines = (allUpdates) => {
    const extractedDeadlines = []

    allUpdates.forEach(update => {
      const extractedItems = extractDeadlinesFromUpdate(update)
      extractedDeadlines.push(...extractedItems)
    })

    // Sort by urgency and date
    const sortedDeadlines = extractedDeadlines.sort((a, b) => {
      if (a.urgencyRank !== b.urgencyRank) {
        return a.urgencyRank - b.urgencyRank
      }
      return new Date(a.date) - new Date(b.date)
    })

    setDeadlines(sortedDeadlines)
  }

  const extractDeadlinesFromUpdate = (update) => {
    const deadlines = []
    const text = `${update.headline} ${update.impact || ''} ${update.key_dates || ''}`

    // Extract dates from text
    const datePatterns = [
      {
        pattern: /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/gi,
        format: 'DD MMMM YYYY'
      },
      {
        pattern: /(\d{1,2})\/(\d{1,2})\/(\d{4})/g,
        format: 'DD/MM/YYYY'
      },
      {
        pattern: /(\d{4})-(\d{1,2})-(\d{1,2})/g,
        format: 'YYYY-MM-DD'
      }
    ]

    datePatterns.forEach(({ pattern, format }) => {
      let match
      while ((match = pattern.exec(text)) !== null) {
        const dateStr = match[0]
        const parsedDate = parseDate(dateStr, format)

        if (parsedDate && parsedDate > new Date('2020-01-01')) {
          const deadlineInfo = analyzeDeadlineContext(text, dateStr, update)

          deadlines.push({
            id: `${update.id || update.url}-${dateStr}`,
            date: parsedDate,
            dateString: dateStr,
            title: deadlineInfo.title,
            description: deadlineInfo.description,
            type: deadlineInfo.type,
            urgency: calculateUrgency(parsedDate),
            urgencyRank: getUrgencyRank(calculateUrgency(parsedDate)),
            impact: update.impact_level || 'Informational',
            authority: update.authority,
            source: update.headline,
            sourceUrl: update.url,
            businessImplications: deadlineInfo.businessImplications,
            actionRequired: deadlineInfo.actionRequired,
            riskLevel: deadlineInfo.riskLevel,
            sectorsAffected: extractAffectedSectors(update),
            complianceComplexity: assessComplexity(text, deadlineInfo.type)
          })
        }
      }
    })

    return deadlines
  }

  const parseDate = (dateStr, format) => {
    try {
      if (format === 'DD MMMM YYYY') {
        return new Date(dateStr)
      } else if (format === 'DD/MM/YYYY') {
        const [day, month, year] = dateStr.split('/')
        return new Date(year, month - 1, day)
      } else if (format === 'YYYY-MM-DD') {
        return new Date(dateStr)
      }
    } catch (error) {
      return null
    }
    return null
  }

  const analyzeDeadlineContext = (text, dateStr, update) => {
    const lowerText = text.toLowerCase()
    const beforeDate = text.substring(0, text.indexOf(dateStr)).toLowerCase()
    const afterDate = text.substring(text.indexOf(dateStr) + dateStr.length).toLowerCase()

    let type = 'Other'
    let title = ''
    let description = ''
    let businessImplications = ''
    let actionRequired = ''
    let riskLevel = 'Medium'

    // Determine deadline type and details
    if (beforeDate.includes('consultation') || afterDate.includes('consultation')) {
      type = 'Consultation'
      title = 'Consultation Response Deadline'
      description = 'Deadline for submitting responses to regulatory consultation'
      actionRequired = 'Review consultation document and submit response'
      businessImplications = 'Opportunity to influence regulatory outcomes'
      riskLevel = update.impact_level === 'Significant' ? 'High' : 'Medium'
    } else if (beforeDate.includes('implementation') || afterDate.includes('implementation') ||
               beforeDate.includes('effective') || afterDate.includes('effective')) {
      type = 'Implementation'
      title = 'Implementation Deadline'
      description = 'Deadline for implementing new regulatory requirements'
      actionRequired = 'Ensure systems and processes comply with new requirements'
      businessImplications = 'Operational changes required, potential compliance costs'
      riskLevel = 'High'
    } else if (beforeDate.includes('reporting') || afterDate.includes('reporting') ||
               beforeDate.includes('submission') || afterDate.includes('submission')) {
      type = 'Reporting'
      title = 'Reporting Deadline'
      description = 'Deadline for regulatory reporting or data submission'
      actionRequired = 'Prepare and submit required reports or data'
      businessImplications = 'Administrative burden, potential penalties for non-compliance'
      riskLevel = 'Medium'
    } else if (beforeDate.includes('compliance') || afterDate.includes('compliance')) {
      type = 'Compliance'
      title = 'Compliance Deadline'
      description = 'General compliance or regulatory requirement deadline'
      actionRequired = 'Ensure compliance with regulatory requirements'
      businessImplications = 'Risk of regulatory action if not complied with'
      riskLevel = 'High'
    }

    // Extract more specific title from headline if available
    if (update.headline) {
      const headline = update.headline
      if (headline.length < 100) {
        title = `${type}: ${headline}`
      }
    }

    return {
      type,
      title: title || `${type} Deadline`,
      description: description || update.impact || 'Regulatory deadline requiring attention',
      businessImplications,
      actionRequired,
      riskLevel
    }
  }

  const calculateUrgency = (date) => {
    const now = new Date()
    const diffTime = date - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'Overdue'
    if (diffDays <= 7) return 'This Week'
    if (diffDays <= 30) return 'This Month'
    if (diffDays <= 90) return 'This Quarter'
    return 'Future'
  }

  const getUrgencyRank = (urgency) => {
    const ranks = {
      Overdue: 1,
      'This Week': 2,
      'This Month': 3,
      'This Quarter': 4,
      Future: 5
    }
    return ranks[urgency] || 6
  }

  const extractAffectedSectors = (update) => {
    if (update.sector_relevance_scores) {
      return Object.entries(update.sector_relevance_scores)
        .filter(([, score]) => score > 30)
        .map(([sector]) => sector)
        .slice(0, 3)
    }
    return [update.sector || 'General'].filter(Boolean)
  }

  const assessComplexity = (text, type) => {
    const complexityIndicators = [
      'implementation', 'systems', 'processes', 'training', 'capital',
      'multiple', 'coordination', 'integration', 'significant'
    ]

    const lowerText = text.toLowerCase()
    const matches = complexityIndicators.filter(indicator => lowerText.includes(indicator))

    if (matches.length >= 3 || type === 'Implementation') return 'High'
    if (matches.length >= 1 || type === 'Compliance') return 'Medium'
    return 'Low'
  }

  const getFilteredDeadlines = () => {
    return deadlines.filter(deadline => {
      const typeMatch = filterType === 'all' || deadline.type === filterType
      const urgencyMatch = filterUrgency === 'all' || deadline.urgency === filterUrgency
      return typeMatch && urgencyMatch
    })
  }

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'Overdue': return 'text-red-700 bg-red-100 border-red-300'
      case 'This Week': return 'text-orange-700 bg-orange-100 border-orange-300'
      case 'This Month': return 'text-yellow-700 bg-yellow-100 border-yellow-300'
      case 'This Quarter': return 'text-blue-700 bg-blue-100 border-blue-300'
      case 'Future': return 'text-green-700 bg-green-100 border-green-300'
      default: return 'text-gray-700 bg-gray-100 border-gray-300'
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Consultation': return Calendar
      case 'Implementation': return ArrowRight
      case 'Reporting': return Clock
      case 'Compliance': return CheckCircle
      default: return Bell
    }
  }

  const getComplexityColor = (complexity) => {
    switch (complexity) {
      case 'High': return 'text-red-600'
      case 'Medium': return 'text-orange-600'
      case 'Low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const getDeadlineStats = () => {
    const stats = {
      overdue: deadlines.filter(d => d.urgency === 'Overdue').length,
      thisWeek: deadlines.filter(d => d.urgency === 'This Week').length,
      thisMonth: deadlines.filter(d => d.urgency === 'This Month').length,
      total: deadlines.length
    }
    return stats
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Analyzing regulatory deadlines...</span>
      </div>
    )
  }

  const filteredDeadlines = getFilteredDeadlines()
  const stats = getDeadlineStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 rounded-lg">
        <h1 className="text-2xl font-bold flex items-center">
          <Calendar className="mr-3" />
          Deadline Tracker
        </h1>
        <p className="text-orange-100 mt-1">
          Intelligent tracking of regulatory deadlines and compliance requirements
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overdue}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-orange-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">{stats.thisWeek}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">{stats.thisMonth}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">Total Tracked</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
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
            <label className="text-sm text-gray-600 mr-2">Type:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="all">All Types</option>
              {deadlineTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600 mr-2">Urgency:</label>
            <select
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="all">All Urgency</option>
              {urgencyLevels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          <div className="text-sm text-gray-500">
            Showing {filteredDeadlines.length} of {deadlines.length} deadlines
          </div>
        </div>
      </div>

      {/* Deadline List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Deadlines</h2>
        </div>

        {filteredDeadlines.length === 0
          ? (
          <div className="p-8 text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No deadlines found matching your filters.</p>
          </div>
            )
          : (
          <div className="divide-y divide-gray-200">
            {filteredDeadlines.slice(0, 20).map((deadline, idx) => {
              const TypeIcon = getTypeIcon(deadline.type)
              const daysUntil = Math.ceil((deadline.date - new Date()) / (1000 * 60 * 60 * 24))

              return (
                <div key={deadline.id || idx} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`p-2 rounded-full ${
                        deadline.urgency === 'Overdue'
? 'bg-red-100'
                        : deadline.urgency === 'This Week'
? 'bg-orange-100'
                        : deadline.urgency === 'This Month'
? 'bg-yellow-100'
                        : 'bg-blue-100'
                      }`}>
                        <TypeIcon className={`w-5 h-5 ${
                          deadline.urgency === 'Overdue'
? 'text-red-600'
                          : deadline.urgency === 'This Week'
? 'text-orange-600'
                          : deadline.urgency === 'This Month'
? 'text-yellow-600'
                          : 'text-blue-600'
                        }`} />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900 mb-1">
                            {deadline.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3">
                            {deadline.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium border ${getUrgencyColor(deadline.urgency)}`}>
                              {deadline.urgency}
                            </span>
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                              {deadline.type}
                            </span>
                            <span className={`px-2 py-1 bg-gray-100 rounded text-xs font-medium ${getComplexityColor(deadline.complianceComplexity)}`}>
                              {deadline.complianceComplexity} Complexity
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                              {deadline.impact}
                            </span>
                          </div>

                          {deadline.sectorsAffected.length > 0 && (
                            <div className="mb-3">
                              <span className="text-xs text-gray-500 mr-2">Affects:</span>
                              {deadline.sectorsAffected.map((sector, sectorIdx) => (
                                <span key={sectorIdx} className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs mr-1">
                                  {sector}
                                </span>
                              ))}
                            </div>
                          )}

                          {deadline.actionRequired && (
                            <div className="mb-3 p-3 bg-gray-50 rounded">
                              <h4 className="text-sm font-medium text-gray-900 mb-1">Action Required:</h4>
                              <p className="text-sm text-gray-700">{deadline.actionRequired}</p>
                            </div>
                          )}

                          {deadline.businessImplications && (
                            <div className="mb-3">
                              <h4 className="text-sm font-medium text-gray-900 mb-1">Business Implications:</h4>
                              <p className="text-sm text-gray-600">{deadline.businessImplications}</p>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Source: {deadline.authority}</span>
                            <span>{deadline.dateString}</span>
                          </div>
                        </div>

                        <div className="ml-4 text-right">
                          <div className={`text-lg font-bold ${
                            daysUntil < 0
? 'text-red-600'
                            : daysUntil <= 7
? 'text-orange-600'
                            : daysUntil <= 30
? 'text-yellow-600'
                            : 'text-blue-600'
                          }`}>
                            {daysUntil < 0
                              ? `${Math.abs(daysUntil)} days overdue`
                              : daysUntil === 0
                                ? 'Today'
                                : daysUntil === 1
                                  ? 'Tomorrow'
                                  : `${daysUntil} days`}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {deadline.date.toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
            )}
      </div>

      {/* Summary Insights */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Deadline Insights</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Immediate Priorities</h4>
              <div className="space-y-2">
                {deadlines.filter(d => d.urgency === 'Overdue' || d.urgency === 'This Week').slice(0, 3).map((deadline, idx) => (
                  <div key={idx} className="text-sm text-gray-600">
                    • {deadline.type}: {deadline.dateString}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Deadline Types</h4>
              <div className="space-y-2">
                {deadlineTypes.map(type => {
                  const count = deadlines.filter(d => d.type === type).length
                  return count > 0
                    ? (
                    <div key={type} className="flex justify-between text-sm">
                      <span className="text-gray-600">{type}:</span>
                      <span className="font-medium text-gray-900">{count}</span>
                    </div>
                      )
                    : null
                })}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Complexity Breakdown</h4>
              <div className="space-y-2">
                {['High', 'Medium', 'Low'].map(complexity => {
                  const count = deadlines.filter(d => d.complianceComplexity === complexity).length
                  return (
                    <div key={complexity} className="flex justify-between text-sm">
                      <span className="text-gray-600">{complexity} Complexity:</span>
                      <span className="font-medium text-gray-900">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeadlineTracker
