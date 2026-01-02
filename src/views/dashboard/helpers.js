const { normalizeSectorName } = require('../../utils/sectorTaxonomy')
const { getAuthorityDisplayName } = require('../../utils/authorityRegistry')
const { isFallbackSummary, selectSummary } = require('../../utils/summaryUtils')

function sanitizeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function serializeForScript(data) {
  const json = JSON.stringify(data)
  return json
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

function getDateValue(rawValue) {
  if (!rawValue) return null
  if (rawValue instanceof Date) {
    return isNaN(rawValue) ? null : rawValue
  }
  const parsed = new Date(rawValue)
  return isNaN(parsed) ? null : parsed
}

function formatDateDisplay(dateValue) {
  const date = getDateValue(dateValue)
  if (!date) return 'Unknown'

  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 1) return 'Today'
  if (diffDays === 2) return 'Yesterday'
  if (diffDays <= 7) return `${diffDays - 1} days ago`

  return date.toLocaleDateString('en-UK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function formatDate(value) {
  return formatDateDisplay(value)
}

function truncateText(text, maxLength = 280) {
  if (!text) return ''
  if (text.length <= maxLength) return text

  const truncated = text.substring(0, maxLength)

  // Try to end at sentence boundary (. ! ?)
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('. '),
    truncated.lastIndexOf('? '),
    truncated.lastIndexOf('! '),
    truncated.lastIndexOf('.\n'),
    truncated.lastIndexOf('?\n'),
    truncated.lastIndexOf('!\n')
  )

  // Use sentence boundary if it's past 50% of max length
  if (lastSentenceEnd > maxLength * 0.5) {
    return truncated.substring(0, lastSentenceEnd + 1).trim()
  }

  // Fallback: truncate at last word boundary + ellipsis
  const lastSpace = truncated.lastIndexOf(' ')
  if (lastSpace > maxLength * 0.7) {
    return truncated.substring(0, lastSpace).trim() + '...'
  }

  return truncated.trim() + '...'
}

function formatStatChange(delta = 0, percent = 0) {
  const value = Number(delta) || 0
  const percentValue = Number(percent) || 0
  const direction = value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral'
  const arrow = value > 0 ? 'Up' : value < 0 ? 'Down' : '-'
  const absValue = Math.abs(value)
  const absPercent = Math.abs(percentValue)
  const percentLabel = absPercent ? ` (${absPercent}%)` : ''
  return `<div class="stat-change ${direction}">${arrow} ${absValue}${percentLabel} vs last week</div>`
}

function formatCurrentDate() {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

function formatDashboardStats(rawStats = {}) {
  return {
    totalUpdates: rawStats.totalUpdates || 0,
    highImpact: rawStats.highImpact || 0,
    aiAnalyzed: rawStats.aiAnalyzed || 0,
    activeAuthorities: rawStats.activeAuthorities || 0,
    newToday: rawStats.newToday || 0,
    newAuthorities: rawStats.newAuthorities || 0,
    impactTrend: rawStats.impactTrend || 'stable',
    impactChange: rawStats.impactChange || 0
  }
}

function formatFilterOptions(rawOptions = {}) {
  const authorities = Array.isArray(rawOptions.authorities) ? rawOptions.authorities : []
  const sectors = Array.isArray(rawOptions.sectors) ? rawOptions.sectors : []

  const normalizedSectors = sectors.map(item => {
    const name = typeof item === 'string' ? item : item.name
    const count = typeof item === 'object' && item.count ? item.count : 0
    return {
      name: normalizeSectorName(name),
      count
    }
  })

  const normalizedAuthorities = authorities
    .map(item => {
      const name = typeof item === 'string' ? item : item.name
      const count = typeof item === 'object' && item.count ? item.count : 0
      return {
        name,
        label: getAuthorityDisplayName(name),
        count
      }
    })
    .filter(entry => entry.name)
    .sort((a, b) => a.label.localeCompare(b.label, 'en', { sensitivity: 'base' }))

  return {
    authorities: normalizedAuthorities,
    sectors: normalizedSectors
  }
}

function computeAIFeatures(update) {
  const features = []

  if (update.business_impact_score && update.business_impact_score >= 7) {
    features.push(`<span class="ai-feature high-impact">🔥 High Impact (${update.business_impact_score}/10)</span>`)
  }

  const complianceDeadline = getDateValue(update.compliance_deadline || update.complianceDeadline)
  if (complianceDeadline) {
    const daysUntil = Math.ceil((complianceDeadline - new Date()) / (1000 * 60 * 60 * 24))
    if (daysUntil <= 30 && daysUntil > 0) {
      features.push(`<span class="ai-feature deadline">⏰ Deadline in ${daysUntil} days</span>`)
    }
  }

  if (update.ai_tags && update.ai_tags.includes('has:penalty')) {
    features.push('<span class="ai-feature enforcement">🚨 Enforcement Action</span>')
  }

  if (update.ai_confidence_score && update.ai_confidence_score >= 0.9) {
    features.push(`<span class="ai-feature high-confidence">🤖 High Confidence (${Math.round(update.ai_confidence_score * 100)}%)</span>`)
  }

  if (update.urgency === 'High') {
    features.push('<span class="ai-feature urgent">🚨 Urgent</span>')
  }

  return features.join('')
}

module.exports = {
  computeAIFeatures,
  formatCurrentDate,
  formatDashboardStats,
  formatDate,
  formatDateDisplay,
  formatFilterOptions,
  formatStatChange,
  getDateValue,
  isFallbackSummary,
  sanitizeHtml,
  selectSummary,
  serializeForScript,
  truncateText
}
