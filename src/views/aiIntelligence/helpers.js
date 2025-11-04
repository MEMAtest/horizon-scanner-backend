const MS_PER_DAY = 24 * 60 * 60 * 1000

function toTitleCase(value) {
  return String(value || '')
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function getTopicKey(update) {
  const tags = update.ai_tags || update.aiTags
  if (Array.isArray(tags) && tags.length > 0) {
    return String(tags[0]).toLowerCase()
  }
  return String(update.authority || 'unknown').toLowerCase()
}

function getPublishedTimestamp(update) {
  const raw = update.publishedDate || update.published_date || update.fetchedDate || update.createdAt
  if (!raw) return null
  const parsed = new Date(raw).getTime()
  return Number.isNaN(parsed) ? null : parsed
}

function buildVelocityLookup(updates) {
  const now = Date.now()
  const lookup = new Map()
  updates.forEach(update => {
    const published = getPublishedTimestamp(update)
    if (published === null) return

    const diffDays = (now - published) / MS_PER_DAY
    if (diffDays > 7) return

    const topicKey = getTopicKey(update)
    if (!lookup.has(topicKey)) {
      lookup.set(topicKey, { recent: 0, previous: 0 })
    }
    const entry = lookup.get(topicKey)
    if (diffDays <= 3) {
      entry.recent += 1
    } else {
      entry.previous += 1
    }
  })

  const velocity = {}
  lookup.forEach((value, key) => {
    const { recent, previous } = value
    let trend = 'steady'
    if (recent >= previous + 1) trend = 'accelerating'
    else if (previous >= recent + 1) trend = 'decelerating'

    velocity[key] = trend
  })
  return velocity
}

function getVelocityForUpdate(update, velocityLookup) {
  const topicKey = getTopicKey(update)
  const trend = velocityLookup[topicKey]
  if (!trend) return null

  if (trend === 'accelerating') {
    return { trend, icon: '▲', label: 'Accelerating' }
  }
  if (trend === 'decelerating') {
    return { trend, icon: '▼', label: 'Cooling' }
  }
  return { trend: 'steady', icon: '➜', label: 'Steady' }
}

function generatePredictiveBadges(update) {
  const badges = []
  const content = `${update.headline || ''} ${update.summary || ''} ${update.impact || ''}`.toLowerCase()
  const deadlineRaw = update.compliance_deadline || update.complianceDeadline
  const deadline = deadlineRaw ? new Date(deadlineRaw) : null
  const diffDays = deadline && !Number.isNaN(deadline) ? Math.round((deadline.getTime() - Date.now()) / MS_PER_DAY) : null

  if (content.includes('consultation') || content.includes('feedback')) {
    badges.push('Expected Follow-up')
  }
  if (diffDays !== null && diffDays >= 0 && diffDays <= 14) {
    badges.push('Consultation Closing')
  }
  const normalizedSummary = (update.summary || update.ai_summary || '').toLowerCase()
  if (normalizedSummary.includes('2023') && normalizedSummary.includes('guidance')) {
    badges.push('Pattern Match to 2023 Guidance')
  }
  return badges
}

function generatePatternAlert(updates) {
  const windowMs = 48 * 60 * 60 * 1000
  const now = Date.now()
  const topicMap = new Map()

  updates.forEach(update => {
    const published = getPublishedTimestamp(update)
    if (published === null || now - published > windowMs) return

    const topicKey = getTopicKey(update)
    if (!topicMap.has(topicKey)) {
      topicMap.set(topicKey, { authorities: new Set(), count: 0 })
    }
    const entry = topicMap.get(topicKey)
    if (update.authority) {
      entry.authorities.add(update.authority)
    }
    entry.count += 1
  })

  let bestTopic = null
  topicMap.forEach((value, key) => {
    const authorityCount = value.authorities.size
    if (authorityCount >= 3) {
      if (!bestTopic || authorityCount > bestTopic.authorities || value.count > bestTopic.count) {
        bestTopic = {
          topic: key,
          authorities: authorityCount,
          count: value.count
        }
      }
    }
  })

  if (bestTopic) {
    const title = `${bestTopic.authorities} authorities discussing ${toTitleCase(bestTopic.topic)} in past 48 hours – coordination pattern detected.`
    return {
      title,
      subtitle: 'Monitoring engine recommends heightened watch on this theme.'
    }
  }

  return {
    title: 'Monitoring engine is scanning cross-authority activity.',
    subtitle: 'No coordinated patterns detected in the past 48 hours.'
  }
}

function getUpdateKey(update) {
  const base =
    update?.id ||
    update?.update_id ||
    update?.guid ||
    update?.url ||
    update?.headline ||
    Math.random().toString(36).slice(2)

  return Buffer.from(String(base), 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function classifyUpdatesByPersona(updates = []) {
  const personaMap = {}
  const counts = { all: updates.length, executive: 0, analyst: 0, operations: 0 }

  updates.forEach(update => {
    const key = getUpdateKey(update)
    const personas = new Set()
    const impactLevel = (update?.impactLevel || update?.impact_level || '').toLowerCase()
    const urgency = (update?.urgency || '').toLowerCase()
    const businessScore = Number(update?.businessImpactScore || update?.business_impact_score || 0)
    const relevanceScore = Number(update?.relevanceScore || 0)
    const contentType = (update?.contentType || update?.content_type || '').toLowerCase()
    const tags = Array.isArray(update?.aiTags || update?.ai_tags)
      ? (update.aiTags || update.ai_tags)
      : []
    const summary = (update?.aiSummary || update?.ai_summary || update?.summary || update?.impact || '').toLowerCase()
    const headline = (update?.headline || '').toLowerCase()

    const hasDeadline = Boolean(update?.compliance_deadline || update?.complianceDeadline)
    const mentionsDeadline = summary.includes('deadline') || headline.includes('deadline')
    const isConsultation =
      contentType.includes('consult') ||
      headline.includes('consultation') ||
      summary.includes('consultation') ||
      tags.some(tag => typeof tag === 'string' && tag.toLowerCase().includes('consult'))

    const highImpact =
      impactLevel === 'significant' ||
      businessScore >= 7 ||
      relevanceScore >= 80 ||
      urgency === 'critical'

    const mediumImpact =
      impactLevel === 'moderate' ||
      businessScore >= 5 ||
      relevanceScore >= 60 ||
      urgency === 'high'

    const operationsTrigger =
      hasDeadline ||
      mentionsDeadline ||
      isConsultation ||
      (urgency === 'high' && impactLevel !== 'background')

    if (highImpact) personas.add('executive')
    if (operationsTrigger) personas.add('operations')
    if (mediumImpact || personas.size === 0) personas.add('analyst')

    const personaList = Array.from(personas)
    personaMap[key] = personaList

    personaList.forEach(persona => {
      counts[persona] = (counts[persona] || 0) + 1
    })
  })

  return { personaMap, counts }
}

function summarizeAnnotations(annotations = []) {
  const summary = {
    total: 0,
    flagged: 0,
    tasks: 0,
    assignments: 0,
    notes: 0
  }

  annotations.forEach(annotation => {
    summary.total++
    const status = String(annotation.status || '').toLowerCase()
    if (status === 'flagged') summary.flagged++
    else if (status === 'action_required' || status === 'action required') summary.tasks++
    else if (status === 'assigned') summary.assignments++
    else if (status === 'note') summary.notes++
  })

  return summary
}

module.exports = {
  buildVelocityLookup,
  classifyUpdatesByPersona,
  escapeHtml,
  generatePatternAlert,
  generatePredictiveBadges,
  getUpdateKey,
  getVelocityForUpdate,
  summarizeAnnotations
}
