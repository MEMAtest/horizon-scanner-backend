const { DAILY_AUTHORITY_CAP } = require('./constants')
const { extractUpdateDate, toTimestamp } = require('./dates')

function normalizeImpactLevel(value) {
  if (!value) return ''
  return String(value).trim().toLowerCase()
}

function normalizeUrgency(value) {
  if (!value) return 'Low'
  const normalized = String(value).trim()
  if (!normalized) return 'Low'
  const upper = normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase()
  if (['High', 'Medium', 'Low'].includes(upper)) return upper
  return 'Low'
}

function isHighImpact(update) {
  const impact = normalizeImpactLevel(update.impactLevel || update.impact_level)
  return impact === 'significant' || impact === 'high' || impact === 'critical'
}

function getUpcomingDeadline(update, referenceDate, windowDays = 10) {
  const deadlineRaw = update.compliance_deadline || update.complianceDeadline
  if (!deadlineRaw) return null
  const deadline = new Date(deadlineRaw)
  if (Number.isNaN(deadline.getTime())) return null

  const diffMs = deadline.getTime() - referenceDate.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  if (diffDays < 0 || diffDays > windowDays) return null
  return deadline
}

function derivePersonas(update) {
  const tags = Array.isArray(update.ai_tags) ? update.ai_tags : []
  const personas = tags
    .filter(tag => tag.startsWith('persona:'))
    .map(tag => tag.split(':')[1].trim())
    .filter(Boolean)

  if (personas.length) {
    return Array.from(new Set(personas))
  }

  if (isHighImpact(update) || normalizeUrgency(update.urgency) === 'High') {
    return ['executive', 'operations']
  }

  return ['analyst']
}

function deriveNextStep(update) {
  const urgency = normalizeUrgency(update.urgency)
  const deadline = getUpcomingDeadline(update, new Date(), 14)

  if (deadline) {
    return `Review requirements before ${deadline.toLocaleDateString('en-GB')}`
  }

  if (urgency === 'High') {
    return 'Escalate to compliance lead for immediate review'
  }

  if (isHighImpact(update)) {
    return 'Assess business impact and communicate to stakeholders'
  }

  return 'Monitor for developments'
}

function enforceDailyAuthorityCap(updates, limitPerDay = DAILY_AUTHORITY_CAP) {
  if (!Array.isArray(updates)) return []
  if (!Number.isFinite(limitPerDay) || limitPerDay <= 0) {
    return [...updates]
  }

  const sortByPublishedDesc = (a, b) => toTimestamp(
    b.publishedAt ||
    b.published_at ||
    b.publishedDate ||
    b.published_date ||
    b.createdAt ||
    b.fetchedDate
  ) - toTimestamp(
    a.publishedAt ||
    a.published_at ||
    a.publishedDate ||
    a.published_date ||
    a.createdAt ||
    a.fetchedDate
  )

  const ordered = [...updates].sort(sortByPublishedDesc)
  if (ordered.length <= limitPerDay) {
    return ordered
  }

  const usage = new Map()
  const capped = []

  ordered.forEach(update => {
    const publishedDate = extractUpdateDate(update)
    const dayKey = publishedDate ? publishedDate.toISOString().slice(0, 10) : 'undated'
    const authority = (update.authority || 'other').trim().toLowerCase() || 'other'
    const key = `${authority}::${dayKey}`
    const current = usage.get(key) || 0
    if (current >= limitPerDay) {
      return
    }
    usage.set(key, current + 1)
    capped.push(update)
  })

  return capped.sort(sortByPublishedDesc)
}

module.exports = {
  normalizeImpactLevel,
  normalizeUrgency,
  isHighImpact,
  getUpcomingDeadline,
  derivePersonas,
  deriveNextStep,
  enforceDailyAuthorityCap
}
