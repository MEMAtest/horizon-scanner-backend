// ==========================================
// 🔧 Component Helper Functions - Phase 4
// src/utils/componentHelpers.js
// ==========================================

/**
 * Component Helper Functions for Regulatory Intelligence Platform
 * Provides specialized utility functions for component operations
 */

class ComponentHelpers {
  constructor() {
    this.componentRegistry = new Map()
    this.eventBus = new EventTarget()
    this.init()
  }

  init() {
    this.setupComponentCommunication()
  }

  // ==========================================
  // COMPONENT REGISTRY
  // ==========================================

  /**
     * Register a component instance
     */
  registerComponent(name, instance) {
    this.componentRegistry.set(name, instance)
    this.eventBus.dispatchEvent(new CustomEvent('component:registered', {
      detail: { name, instance }
    }))
  }

  /**
     * Get registered component
     */
  getComponent(name) {
    return this.componentRegistry.get(name)
  }

  /**
     * Unregister component
     */
  unregisterComponent(name) {
    const instance = this.componentRegistry.get(name)
    if (instance && typeof instance.destroy === 'function') {
      instance.destroy()
    }
    this.componentRegistry.delete(name)
  }

  /**
     * Get all registered components
     */
  getAllComponents() {
    return Array.from(this.componentRegistry.entries())
  }

  // ==========================================
  // FILTER HELPERS
  // ==========================================

  /**
     * Build filter query from filter object
     */
  buildFilterQuery(filters) {
    const queryParts = []

    Object.entries(filters).forEach(([key, value]) => {
      if (!value || (Array.isArray(value) && value.length === 0)) return

      if (key === 'keywords' && value.trim()) {
        queryParts.push(`keywords:"${value.trim()}"`)
      } else if (key === 'dateRange' && (value.start || value.end)) {
        if (value.start && value.end) {
          queryParts.push(`date:[${value.start} TO ${value.end}]`)
        } else if (value.start) {
          queryParts.push(`date:[${value.start} TO *]`)
        } else if (value.end) {
          queryParts.push(`date:[* TO ${value.end}]`)
        }
      } else if (Array.isArray(value) && value.length > 0) {
        queryParts.push(`${key}:(${value.join(' OR ')})`)
      } else if (typeof value === 'string' && value !== 'all') {
        queryParts.push(`${key}:${value}`)
      }
    })

    return queryParts.join(' AND ')
  }

  /**
     * Parse filter query back to filter object
     */
  parseFilterQuery(query) {
    const filters = {
      authorities: [],
      contentTypes: [],
      dateRange: { start: '', end: '' },
      sectors: [],
      urgency: [],
      impact: [],
      keywords: ''
    }

    if (!query) return filters

    // Extract keywords
    const keywordsMatch = query.match(/keywords:"([^"]+)"/)
    if (keywordsMatch) {
      filters.keywords = keywordsMatch[1]
    }

    // Extract date range
    const dateMatch = query.match(/date:\[([^\]]+)\]/)
    if (dateMatch) {
      const dateRange = dateMatch[1]
      const [start, end] = dateRange.split(' TO ')
      filters.dateRange.start = start !== '*' ? start : ''
      filters.dateRange.end = end !== '*' ? end : ''
    }

    // Extract other filters
    Object.keys(filters).forEach(key => {
      if (key === 'keywords' || key === 'dateRange') return

      const regex = new RegExp(`${key}:\\(([^)]+)\\)`)
      const match = query.match(regex)
      if (match) {
        filters[key] = match[1].split(' OR ')
      }
    })

    return filters
  }

  /**
     * Apply filters to data array
     */
  applyFilters(data, filters) {
    if (!data || !Array.isArray(data)) return []

    return data.filter(item => {
      // Keywords filter
      if (filters.keywords) {
        const searchText = `${item.title} ${item.content} ${item.summary || ''}`.toLowerCase()
        const keywords = filters.keywords.toLowerCase().split(/\s+/)
        const hasAllKeywords = keywords.every(keyword => searchText.includes(keyword))
        if (!hasAllKeywords) return false
      }

      // Authority filter
      if (filters.authorities && filters.authorities.length > 0) {
        if (!filters.authorities.includes(item.authority)) return false
      }

      // Content type filter
      if (filters.contentTypes && filters.contentTypes.length > 0) {
        if (!filters.contentTypes.includes(item.contentType)) return false
      }

      // Date range filter
      if (filters.dateRange && (filters.dateRange.start || filters.dateRange.end)) {
        const itemDate = new Date(item.publishedDate || item.date)

        if (filters.dateRange.start) {
          const startDate = new Date(filters.dateRange.start)
          if (itemDate < startDate) return false
        }

        if (filters.dateRange.end) {
          const endDate = new Date(filters.dateRange.end)
          endDate.setHours(23, 59, 59, 999) // End of day
          if (itemDate > endDate) return false
        }
      }

      // Sector filter
      if (filters.sectors && filters.sectors.length > 0) {
        const itemSectors = item.sectors || []
        const hasMatchingSector = filters.sectors.some(sector =>
          itemSectors.includes(sector)
        )
        if (!hasMatchingSector) return false
      }

      // Urgency filter
      if (filters.urgency && filters.urgency.length > 0) {
        if (!filters.urgency.includes(item.urgency)) return false
      }

      // Impact filter
      if (filters.impact && filters.impact.length > 0) {
        if (!filters.impact.includes(item.impact)) return false
      }

      return true
    })
  }

  // ==========================================
  // SEARCH HELPERS
  // ==========================================

  /**
     * Generate search suggestions based on query
     */
  generateSearchSuggestions(query, data, maxSuggestions = 10) {
    if (!query || query.length < 2) return []

    const suggestions = new Set()
    const queryLower = query.toLowerCase()

    // Extract common phrases from data
    data.forEach(item => {
      const text = `${item.title} ${item.content || ''}`.toLowerCase()
      const words = text.split(/\s+/)

      // Find phrases that contain the query
      for (let i = 0; i < words.length - 1; i++) {
        const phrase = words.slice(i, i + 3).join(' ')
        if (phrase.includes(queryLower) && phrase.length > query.length) {
          suggestions.add(phrase)
        }
      }

      // Add single words that start with query
      words.forEach(word => {
        if (word.startsWith(queryLower) && word.length > query.length) {
          suggestions.add(word)
        }
      })
    })

    return Array.from(suggestions)
      .slice(0, maxSuggestions)
      .sort((a, b) => a.length - b.length)
  }

  /**
     * Highlight search terms in text
     */
  highlightSearchTerms(text, query) {
    if (!query || !text) return text

    const terms = query.split(/\s+/).filter(term => term.length > 1)
    let highlightedText = text

    terms.forEach(term => {
      const regex = new RegExp(`(${this.escapeRegex(term)})`, 'gi')
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>')
    })

    return highlightedText
  }

  /**
     * Calculate search relevance score
     */
  calculateRelevanceScore(item, query) {
    if (!query) return 0

    const queryLower = query.toLowerCase()
    const title = (item.title || '').toLowerCase()
    const content = (item.content || '').toLowerCase()
    const summary = (item.summary || '').toLowerCase()

    let score = 0

    // Title matches (highest weight)
    if (title.includes(queryLower)) {
      score += 10
      if (title.startsWith(queryLower)) score += 5
    }

    // Summary matches (medium weight)
    if (summary.includes(queryLower)) {
      score += 5
    }

    // Content matches (lower weight)
    if (content.includes(queryLower)) {
      score += 2
    }

    // Authority/type exact matches
    if ((item.authority || '').toLowerCase() === queryLower) score += 8
    if ((item.contentType || '').toLowerCase() === queryLower) score += 6

    // Recency bonus
    const daysSincePublished = this.getDaysSince(item.publishedDate || item.date)
    if (daysSincePublished <= 7) score += 3
    else if (daysSincePublished <= 30) score += 1

    return score
  }

  // ==========================================
  // COUNTER HELPERS
  // ==========================================

  /**
     * Calculate counter statistics
     */
  calculateCounterStats(data) {
    const stats = {
      total: data.length,
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      authorities: {},
      urgency: { high: 0, medium: 0, low: 0 },
      contentTypes: {},
      sectors: {}
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart.getTime() - (7 * 24 * 60 * 60 * 1000))
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    data.forEach(item => {
      const itemDate = new Date(item.publishedDate || item.date)

      // Time-based counts
      if (itemDate >= todayStart) stats.today++
      if (itemDate >= weekStart) stats.thisWeek++
      if (itemDate >= monthStart) stats.thisMonth++

      // Authority counts
      const authority = item.authority
      if (authority) {
        stats.authorities[authority] = (stats.authorities[authority] || 0) + 1
      }

      // Urgency counts
      const urgency = item.urgency || 'low'
      if (Object.prototype.hasOwnProperty.call(stats.urgency, urgency)) {
        stats.urgency[urgency]++
      }

      // Content type counts
      const contentType = item.contentType
      if (contentType) {
        stats.contentTypes[contentType] = (stats.contentTypes[contentType] || 0) + 1
      }

      // Sector counts
      const sectors = item.sectors || []
      sectors.forEach(sector => {
        stats.sectors[sector] = (stats.sectors[sector] || 0) + 1
      })
    })

    return stats
  }

  /**
     * Format counter value with appropriate units
     */
  formatCounterValue(value, type = 'number') {
    if (typeof value !== 'number') return value

    switch (type) {
      case 'percentage':
        return `${Math.round(value * 100)}%`
      case 'currency':
        return new Intl.NumberFormat('en-GB', {
          style: 'currency',
          currency: 'GBP'
        }).format(value)
      case 'compact':
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
        if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
        return value.toString()
      default:
        return value.toLocaleString()
    }
  }

  // ==========================================
  // NAVIGATION HELPERS
  // ==========================================

  /**
     * Build breadcrumb trail from current path
     */
  buildBreadcrumbs(path, customLabels = {}) {
    const segments = path.split('/').filter(Boolean)
    const breadcrumbs = [{ label: 'Home', href: '/' }]

    let currentPath = ''
    segments.forEach(segment => {
      currentPath += `/${segment}`
      const label = customLabels[segment] || this.formatSegmentLabel(segment)
      breadcrumbs.push({ label, href: currentPath })
    })

    return breadcrumbs
  }

  /**
     * Format URL segment for display
     */
  formatSegmentLabel(segment) {
    const labelMap = {
      dashboard: 'Dashboard',
      updates: 'Updates',
      authorities: 'Authorities',
      analytics: 'Analytics',
      alerts: 'Alerts',
      search: 'Search',
      fca: 'Financial Conduct Authority',
      boe: 'Bank of England',
      pra: 'Prudential Regulation Authority',
      tpr: 'The Pensions Regulator',
      sfo: 'Serious Fraud Office',
      fatf: 'Financial Action Task Force'
    }

    return labelMap[segment.toLowerCase()] ||
               segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
  }

  /**
     * Check if navigation item is active
     */
  isNavItemActive(itemPath, currentPath) {
    if (itemPath === currentPath) return true
    if (itemPath === '/' && currentPath === '/') return true
    if (itemPath !== '/' && currentPath.startsWith(itemPath + '/')) return true
    return false
  }

  // ==========================================
  // DATA TRANSFORMATION HELPERS
  // ==========================================

  /**
     * Transform API data for UI consumption
     */
  transformApiData(rawData, type = 'updates') {
    if (!Array.isArray(rawData)) return []

    switch (type) {
      case 'updates':
        return rawData.map(item => ({
          id: item.id,
          title: this.sanitizeHtml(item.title),
          content: this.sanitizeHtml(item.content),
          summary: this.sanitizeHtml(item.summary),
          authority: item.authority,
          contentType: item.content_type || item.contentType,
          publishedDate: item.published_date || item.publishedDate,
          urgency: item.urgency || 'low',
          impact: item.impact || 'informational',
          sectors: item.sectors || [],
          tags: item.tags || [],
          url: item.url,
          aiAnalysis: item.ai_analysis || item.aiAnalysis
        }))

      case 'counters':
        return {
          total: rawData.total || 0,
          authorities: rawData.authorities || {},
          urgency: rawData.urgency || { high: 0, medium: 0, low: 0 },
          today: rawData.today || 0,
          thisWeek: rawData.this_week || rawData.thisWeek || 0,
          unread: rawData.unread || 0
        }

      default:
        return rawData
    }
  }

  /**
     * Sanitize HTML content
     */
  sanitizeHtml(html) {
    if (!html) return ''

    const temp = document.createElement('div')
    temp.textContent = html
    return temp.innerHTML
  }

  /**
     * Truncate text with ellipsis
     */
  truncateText(text, maxLength = 100, addEllipsis = true) {
    if (!text || text.length <= maxLength) return text

    const truncated = text.substring(0, maxLength)
    const lastSpace = truncated.lastIndexOf(' ')

    const result = lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated
    return addEllipsis ? result + '...' : result
  }

  // ==========================================
  // DATE & TIME HELPERS
  // ==========================================

  /**
     * Format date for display
     */
  formatDate(date, format = 'relative') {
    if (!date) return ''

    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) return ''

    switch (format) {
      case 'relative':
        return this.getRelativeTime(dateObj)
      case 'short':
        return dateObj.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
      case 'long':
        return dateObj.toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      case 'time':
        return dateObj.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit'
        })
      case 'datetime':
        return dateObj.toLocaleString('en-GB')
      default:
        return dateObj.toLocaleDateString('en-GB')
    }
  }

  /**
     * Get relative time string
     */
  getRelativeTime(date) {
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? 's' : ''} ago`

    return this.formatDate(date, 'short')
  }

  /**
     * Get days since date
     */
  getDaysSince(date) {
    if (!date) return Infinity
    const dateObj = new Date(date)
    const now = new Date()
    return Math.floor((now - dateObj) / (24 * 60 * 60 * 1000))
  }

  // ==========================================
  // UTILITY HELPERS
  // ==========================================

  /**
     * Escape regex special characters
     */
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  /**
     * Generate unique ID
     */
  generateId(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
     * Deep clone object
     */
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj
    if (obj instanceof Date) return new Date(obj.getTime())
    if (obj instanceof Array) return obj.map(item => this.deepClone(item))
    if (typeof obj === 'object') {
      const cloned = {}
      Object.keys(obj).forEach(key => {
        cloned[key] = this.deepClone(obj[key])
      })
      return cloned
    }
    return obj
  }

  /**
     * Merge objects deeply
     */
  deepMerge(target, source) {
    const result = this.deepClone(target)

    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key])
      } else {
        result[key] = source[key]
      }
    })

    return result
  }

  // ==========================================
  // COMPONENT COMMUNICATION
  // ==========================================

  setupComponentCommunication() {
    // Listen for component events
    this.eventBus.addEventListener('component:update', (e) => {
      const { source, data, type } = e.detail
      this.broadcastToComponents('update', { source, data, type })
    })
  }

  /**
     * Broadcast message to all components
     */
  broadcastToComponents(event, data) {
    this.componentRegistry.forEach((component, name) => {
      if (typeof component.handleBroadcast === 'function') {
        try {
          component.handleBroadcast(event, data)
        } catch (error) {
          console.warn(`Error broadcasting to component ${name}:`, error)
        }
      }
    })
  }

  /**
     * Send message between specific components
     */
  sendMessage(fromComponent, toComponent, message, data) {
    const targetComponent = this.getComponent(toComponent)
    if (targetComponent && typeof targetComponent.handleMessage === 'function') {
      targetComponent.handleMessage(fromComponent, message, data)
    }
  }

  /**
     * Emit global component event
     */
  emit(event, detail = {}) {
    this.eventBus.dispatchEvent(new CustomEvent(event, { detail }))
  }

  /**
     * Listen for global component events
     */
  on(event, callback) {
    this.eventBus.addEventListener(event, callback)

    // Return unsubscribe function
    return () => this.eventBus.removeEventListener(event, callback)
  }
}

// Create global instance
const componentHelpers = new ComponentHelpers()

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ComponentHelpers
} else {
  window.ComponentHelpers = ComponentHelpers
  window.componentHelpers = componentHelpers
}
