const dbService = require('./dbService')
const annotationService = require('./annotationService')
const workspaceService = require('./workspaceService')
const relevanceService = require('./relevanceService')
const profileService = require('./profileService')
const workflowRecommendationService = require('./workflowRecommendationService')
const workflowService = require('./workflowService')

const DAILY_AUTHORITY_CAP = 10
const RISK_PULSE_FLOOR = 1.5

// Helper utilities ---------------------------------------------------------

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfDay(date) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

function subtractDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() - days)
  return d
}

function toISO(date) {
  return new Date(date).toISOString()
}

function toTimestamp(value) {
  if (!value) return 0

  if (value instanceof Date) {
    const time = value.getTime()
    return Number.isNaN(time) ? 0 : time
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    if (!Number.isNaN(parsed)) return parsed
    const asNumber = Number(value)
    return Number.isFinite(asNumber) ? asNumber : 0
  }

  if (typeof value === 'object') {
    if (typeof value.valueOf === 'function') {
      const raw = value.valueOf()
      if (raw instanceof Date) {
        const rawTime = raw.getTime()
        return Number.isNaN(rawTime) ? 0 : rawTime
      }
      if (typeof raw === 'number' && Number.isFinite(raw)) {
        return raw
      }
      if (typeof raw === 'string') {
        const parsedValue = Date.parse(raw)
        if (!Number.isNaN(parsedValue)) return parsedValue
      }
    }

    if (typeof value.toISOString === 'function') {
      const iso = value.toISOString()
      const parsedIso = Date.parse(iso)
      if (!Number.isNaN(parsedIso)) return parsedIso
    }

    if (typeof value.toString === 'function') {
      const parsed = Date.parse(value.toString())
      if (!Number.isNaN(parsed)) return parsed
    }
  }

  return 0
}

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

  // Simple heuristic fallback
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

function buildExecutiveSummary(stats, focusHeadline, highImpactUpdates) {
  const segments = []
  if (focusHeadline) {
    segments.push(focusHeadline)
  }

  const { totalUpdates, highImpact, deadlinesSoon, activeAuthorities } = stats
  segments.push(
    `${highImpact} high-impact update${highImpact === 1 ? '' : 's'} surfaced across ${activeAuthorities} active authorities.`,
    deadlinesSoon > 0
      ? `${deadlinesSoon} compliance deadline${deadlinesSoon === 1 ? '' : 's'} require attention this week.`
      : 'No immediate compliance deadlines were detected.'
  )

  if (highImpactUpdates.length) {
    const authorities = Array.from(
      new Set(highImpactUpdates.map(update => update.authority).filter(Boolean))
    )
    segments.push(
      `Key focus areas: ${authorities.slice(0, 3).join(', ')}${
        authorities.length > 3 ? ' and others' : ''
      }.`
    )
  }

  return segments.join(' ')
}

function computeHighImpactScore(todayCount, averageCount) {
  if (todayCount === 0) return 0
  const ratio = averageCount > 0 ? todayCount / averageCount : 2
  return Math.min(10, Math.max(0, ratio * 5))
}

function computeUrgencyScore(updates) {
  if (!updates.length) return 0
  const weights = { High: 10, Medium: 6, Low: 2 }
  const total = updates.reduce((acc, update) => {
    const urgency = normalizeUrgency(update.urgency)
    return acc + (weights[urgency] || 2)
  }, 0)
  return Math.min(10, total / updates.length)
}

function computeAuthorityScore(todayCount, averageCount) {
  if (todayCount === 0) return 0
  const ratio = averageCount > 0 ? todayCount / averageCount : 2
  return Math.min(10, Math.max(0, ratio * 5))
}

function computeDeadlineScore(deadlinesCount) {
  if (deadlinesCount >= 3) return 10
  if (deadlinesCount >= 1) return 7
  return 3
}

function computeTaskScore(outstanding) {
  if (outstanding <= 0) return 2
  return Math.min(10, outstanding * 2)
}

function labelledRisk(score) {
  if (score >= 8) return 'Critical'
  if (score >= 5) return 'Elevated'
  return 'Stable'
}

function buildRiskComponents(details) {
  return [
    {
      label: 'Impact momentum',
      weight: 0.35,
      score: details.highImpactScore
    },
    {
      label: 'Urgency mix',
      weight: 0.20,
      score: details.urgencyScore
    },
    {
      label: 'Authority spread',
      weight: 0.15,
      score: details.authorityScore
    },
    {
      label: 'Deadline pressure',
      weight: 0.15,
      score: details.deadlineScore
    },
    {
      label: 'Open actions',
      weight: 0.15,
      score: details.taskScore
    }
  ]
}

function computeThemes(updates, max = 5) {
  const counter = new Map()
  updates.forEach(update => {
    const tags = Array.isArray(update.ai_tags) ? update.ai_tags : []
    tags
      .filter(tag => !tag.startsWith('persona:'))
      .forEach(tag => {
        const label = tag.trim()
        if (!label) return
        counter.set(label, (counter.get(label) || 0) + 1)
      })
  })

  return Array.from(counter.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([label, support]) => ({
      label,
      support,
      signal: support >= 3 ? 'rising' : 'steady'
    }))
}

function buildBehaviourContext(scores = []) {
  return Array.isArray(scores) ? scores.map(score => ({
    entityType: score.entityType || score.entity_type,
    entityId: score.entityId || score.entity_id,
    weight: Number(score.weight || 0)
  })) : []
}

function ensureUpdatesContainer(updates, profileContext) {
  const buckets = {
    high: [],
    medium: [],
    low: []
  }

  updates.forEach(update => {
    const score = relevanceService.calculateRelevanceScore(update, profileContext)
    const personas = derivePersonas(update)
    const publishedDate = extractUpdateDate(update)
    const publishedAt = publishedDate ? publishedDate.toISOString() : ''
    const bucket =
      score >= 70 ? 'high' :
      score >= 40 ? 'medium' :
      'low'

    const hasProfile = Boolean(profileContext && profileContext.profile)
    const profileRelevance = hasProfile
      ? (bucket === 'high' ? 'core' : bucket === 'medium' ? 'related' : 'broader')
      : 'general'
    const profileMatch = hasProfile && bucket === 'high'

    buckets[bucket].push({
      updateId: update.id,
      headline: update.headline,
      authority: update.authority,
      summary: update.summary || update.ai_summary || '',
      urgency: normalizeUrgency(update.urgency),
      impactLevel: update.impactLevel || update.impact_level || 'Informational',
      publishedAt,
      personas,
      nextStep: deriveNextStep(update),
      url: update.url,
      primarySector: (update.area || update.sector || '').trim(),
      relevanceScore: score,
      profileRelevance,
      profileMatch
    })
  })

  const sortDesc = (a, b) => toTimestamp(b.publishedAt) - toTimestamp(a.publishedAt)
  buckets.high.sort(sortDesc)
  buckets.medium.sort(sortDesc)
  buckets.low.sort(sortDesc)

  rebalanceAuthorityDistribution(buckets)

  return buckets
}

function countOutstandingTasks(annotations) {
  if (!Array.isArray(annotations)) return 0
  const targetStatuses = new Set(['action_required', 'assigned', 'triage'])
  return annotations.filter(note => targetStatuses.has(note.status)).length
}

function summarizeAnnotationsList(annotations) {
  if (!Array.isArray(annotations)) {
    return { total: 0, tasks: 0, flagged: 0 }
  }
  const total = annotations.length
  const tasks = countOutstandingTasks(annotations)
  const flagged = annotations.filter(note => note.status === 'flagged').length
  return { total, tasks, flagged }
}

function buildTimelineEntries(updates, referenceDate) {
  const horizonDays = 30
  const endWindow = new Date(referenceDate)
  endWindow.setDate(endWindow.getDate() + horizonDays)

  return updates
    .map(update => {
      const rawDeadline = update.compliance_deadline || update.complianceDeadline
      if (!rawDeadline) return null
      const deadline = new Date(rawDeadline)
      if (Number.isNaN(deadline.getTime())) return null
      if (deadline < referenceDate || deadline > endWindow) return null

      return {
        date: deadline.toISOString(),
        type: 'deadline',
        title: update.headline || 'Compliance deadline',
        authority: update.authority || 'Unknown',
        urgency: normalizeUrgency(update.urgency)
      }
    })
    .filter(Boolean)
    .sort((a, b) => toTimestamp(a.date) - toTimestamp(b.date))
}

function rebalanceAuthorityDistribution(streams, limitPerAuthority = 3) {
  const rebalanceBucket = bucket => {
    const updates = streams[bucket]
    if (!Array.isArray(updates) || updates.length <= 1) return

    const groups = new Map()
    updates.forEach(update => {
      const key = (update.authority || 'Other').trim().toLowerCase() || 'other'
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key).push(update)
    })

    if (groups.size <= 1) return

    Array.from(groups.values()).forEach(list => {
      list.sort((a, b) => toTimestamp(b.publishedAt) - toTimestamp(a.publishedAt))
    })

    const interleaved = []
    const overflow = []
    const usage = new Map()
    let groupsRemaining = Array.from(groups.entries()).map(([key, value]) => ({ key, items: value }))

    while (true) {
      let progressed = false
      const nextRound = []

      groupsRemaining.forEach(group => {
        if (!group.items.length) {
          return
        }

        const currentCount = usage.get(group.key) || 0
        const allowUnlimited = groups.size === 1

        if (currentCount < limitPerAuthority || allowUnlimited) {
          interleaved.push(group.items.shift())
          usage.set(group.key, currentCount + 1)
        } else {
          overflow.push(group.items.shift())
        }

        if (group.items.length) {
          nextRound.push(group)
        }
        progressed = true
      })

      if (!progressed) break
      groupsRemaining = nextRound
    }

    streams[bucket] = interleaved.concat(overflow, ...groupsRemaining.map(group => group.items))
  }

  ;['high', 'medium', 'low'].forEach(rebalanceBucket)
}

function applyPinnedStateToStreams(streams, pinnedItems) {
  if (!streams || !Array.isArray(pinnedItems) || !pinnedItems.length) return

  const normalizeKey = value => {
    if (!value) return ''
    return String(value).trim()
  }

  const pinnedUrlSet = new Set()
  const pinnedIdSet = new Set()

  pinnedItems.forEach(item => {
    const urlKey = normalizeKey(item.update_url || item.url)
    const idKey = normalizeKey(item.updateId || item.update_id || item.id)
    if (urlKey) pinnedUrlSet.add(urlKey)
    if (idKey) pinnedIdSet.add(idKey)
  })

  const markUpdate = update => {
    if (!update) return
    const urlKey = normalizeKey(update.url)
    const idKey = normalizeKey(update.updateId || update.id)
    const isPinned = (urlKey && pinnedUrlSet.has(urlKey)) || (idKey && pinnedIdSet.has(idKey))
    update.isPinned = Boolean(isPinned)
  }

  ;['high', 'medium', 'low'].forEach(bucket => {
    if (!Array.isArray(streams[bucket])) return
    streams[bucket].forEach(markUpdate)
  })
}

function buildPersonaSnapshot(streams, annotations = []) {
  const template = {
    count: 0,
    pins: 0,
    openTasks: 0,
    updates: [],
    surfaceMap: new Map()
  }

  const personas = {
    executive: { ...template },
    analyst: { ...template },
    operations: { ...template }
  }

  const taskStatuses = new Set(['action_required', 'assigned', 'triage'])
  const personaTaskCounts = new Map()

  if (Array.isArray(annotations)) {
    annotations.forEach(note => {
      const personaKey = typeof note.persona === 'string' ? note.persona.trim().toLowerCase() : ''
      if (!personaKey) return
      if (!personas[personaKey]) {
        personas[personaKey] = { ...template }
      }
      if (taskStatuses.has(String(note.status || '').toLowerCase())) {
        personaTaskCounts.set(personaKey, (personaTaskCounts.get(personaKey) || 0) + 1)
      }
    })
  }

  const buckets = ['high', 'medium', 'low']

  buckets.forEach(bucket => {
    const bucketUpdates = Array.isArray(streams[bucket]) ? streams[bucket] : []
    bucketUpdates.forEach(update => {
      const personasForUpdate = Array.isArray(update.personas) && update.personas.length
        ? update.personas
        : ['analyst']

      const priorityScore = rankUpdatePriority(update)
      const shouldSurface =
        bucket === 'high' ||
        update.isPinned ||
        normalizeUrgency(update.urgency) === 'High'

      personasForUpdate.forEach(persona => {
        const key = String(persona || '').trim().toLowerCase() || 'analyst'
        if (!personas[key]) {
          personas[key] = { ...template }
        }
        const personaEntry = personas[key]
        personaEntry.count += 1
        if (update.isPinned) {
          personaEntry.pins += 1
        }
        if (shouldSurface) {
          const updateKey = update.updateId || update.id || update.url || `${bucket}-${update.authority || ''}-${update.headline || ''}`
          const existing = personaEntry.surfaceMap.get(updateKey)
          if (!existing || (existing.priorityScore || 0) < priorityScore) {
            personaEntry.surfaceMap.set(updateKey, {
              ...update,
              bucket,
              priorityScore
            })
          }
        }
      })
    })
  })

  Object.keys(personas).forEach(persona => {
    const entry = personas[persona]
    entry.openTasks = personaTaskCounts.get(persona) || 0
    const surfaced = Array.from(entry.surfaceMap.values())
      .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))
      .slice(0, 5)
      .map(update => {
        const clone = { ...update }
        delete clone.priorityScore
        return clone
      })
    entry.updates = surfaced
    entry.count = entry.count || surfaced.length
    delete entry.surfaceMap
  })

  return personas
}

function buildClientSnapshot(snapshot) {
  return {
    generatedAt: snapshot.generatedAt,
    snapshotDate: snapshot.snapshotDate,
    riskPulse: snapshot.riskPulse,
    focusHeadline: snapshot.focusHeadline,
    heroInsight: snapshot.heroInsight,
    quickStats: snapshot.quickStats,
    executiveSummary: snapshot.executiveSummary,
    streams: {
      high: (snapshot.streams.high || []).map(stripSensitiveFields),
      medium: (snapshot.streams.medium || []).map(stripSensitiveFields),
      low: (snapshot.streams.low || []).map(stripSensitiveFields)
    },
    personas: Object.fromEntries(
      Object.entries(snapshot.personas || {}).map(([persona, data]) => [
        persona,
        {
          ...data,
          briefing: snapshot.personaBriefings?.[persona] || { summary: 'No priority actions detected.', nextSteps: [] }
        }
      ])
    ),
    personaBriefings: snapshot.personaBriefings,
    recommendedWorkflows: snapshot.recommendedWorkflows,
    savedWorkflows: snapshot.savedWorkflows,
    workspace: {
      stats: snapshot.workspace.stats,
      tasks: snapshot.workspace.tasks,
      pinnedItems: (snapshot.workspace.pinnedItems || []).map(item => ({
        update_url: item.update_url,
        title: item.update_title || item.title || '',
        authority: item.update_authority || item.authority || '',
        pinned_date: item.pinned_date || null
      })),
      savedSearches: snapshot.workspace.savedSearches,
      customAlerts: snapshot.workspace.customAlerts,
      annotationSummary: snapshot.workspace.annotationSummary
    },
    timeline: snapshot.timeline,
    themes: snapshot.themes,
    profile: snapshot.profile,
    profileBehaviour: snapshot.profileBehaviour
  }
}

function stripSensitiveFields(update) {
  if (!update) return update
  return { ...update }
}

function rankUpdatePriority(update) {
  let score = 1
  if (!update) return score

  if (isHighImpact(update)) {
    score += 4
  }

  const urgency = normalizeUrgency(update.urgency)
  if (urgency === 'High') {
    score += 3
  } else if (urgency === 'Medium') {
    score += 1.5
  }

  const businessImpact = Number(update.business_impact_score || update.businessImpactScore || 0)
  if (!Number.isNaN(businessImpact)) {
    score += Math.min(4, businessImpact / 2)
  }

  const hasDeadline = getUpcomingDeadline(update, new Date(), 21)
  if (hasDeadline) score += 2

  return score
}

function selectAuthorityFocus(updates) {
  if (!Array.isArray(updates) || !updates.length) return null

  const authorityScores = new Map()

  updates.forEach(update => {
    const authority = (update.authority || 'key regulators').trim()
    const entry = authorityScores.get(authority) || { authority, total: 0, bestUpdate: null, bestScore: 0 }
    const score = rankUpdatePriority(update)
    entry.total += score
    if (!entry.bestUpdate || score > entry.bestScore) {
      entry.bestUpdate = update
      entry.bestScore = score
    }
    authorityScores.set(authority, entry)
  })

  if (!authorityScores.size) return null

  const ranked = Array.from(authorityScores.values()).sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total
    const aTime = toTimestamp(a.bestUpdate?.publishedAt || a.bestUpdate?.publishedDate)
    const bTime = toTimestamp(b.bestUpdate?.publishedAt || b.bestUpdate?.publishedDate)
    return bTime - aTime
  })

  return ranked[0]
}

function extractUpdateDate(update) {
  if (!update) return null
  const raw =
    update.publishedAt ||
    update.published_at ||
    update.publishedDate ||
    update.published_date ||
    update.createdAt ||
    update.fetchedDate
  if (!raw) return null
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date
}

function groupUpdatesByDay(updates) {
  const groups = new Map()
  updates.forEach(update => {
    const date = extractUpdateDate(update)
    if (!date) return
    const key = date.toISOString().slice(0, 10)
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key).push(update)
  })
  return groups
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

// Main service ----------------------------------------------------------------

async function getDailySnapshot(options = {}) {
  const now = options.now ? new Date(options.now) : new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const sevenDayStart = startOfDay(subtractDays(now, 6))

  const filters = {
    startDate: toISO(todayStart),
    endDate: toISO(todayEnd),
    limit: options.limit || 500,
    ...options.filters
  }

  const userId = options.userId || 'default'
  const activeProfile = await profileService.getActiveProfile(userId).catch(() => null)
  const behaviourScores = activeProfile
    ? await dbService.listFeedbackScores(activeProfile.id).catch(() => [])
    : []

  const [
    todayUpdates,
    recentUpdates,
    workspaceStatsResult,
    pinnedItemsResult,
    savedSearchesResult,
    customAlertsResult,
    annotations,
    savedWorkflows
  ] = await Promise.all([
    dbService.getEnhancedUpdates(filters),
    dbService.getEnhancedUpdates({
      startDate: toISO(sevenDayStart),
      endDate: toISO(todayEnd),
      limit: options.recentLimit || 1000
    }),
    workspaceService.getWorkspaceStats().catch(() => ({ stats: {} })),
    dbService.getPinnedItems().catch(() => ({ items: [] })),
    dbService.getSavedSearches().catch(() => ({ searches: [] })),
    dbService.getCustomAlerts().catch(() => ({ alerts: [] })),
    annotationService.listAnnotations({
      status: ['flagged', 'action_required', 'assigned', 'note', 'triage']
    }).catch(() => []),
    workflowService.listWorkflows(userId, { limit: 20 }).catch(() => [])
  ])

  let recentPool = recentUpdates
  if (!recentPool.length) {
    recentPool = await dbService.getEnhancedUpdates({ limit: options.recentLimit || 1000 }).catch(() => [])
  }
  recentPool = enforceDailyAuthorityCap(recentPool, DAILY_AUTHORITY_CAP)

  let referenceDate = now
  let windowStart = todayStart
  let windowEnd = todayEnd
  let primaryUpdates = todayUpdates

  if (primaryUpdates.length === 0 && recentPool.length > 0) {
    const timestamps = recentPool
      .map(extractUpdateDate)
      .filter(Boolean)
      .map(date => date.getTime())

    if (timestamps.length) {
      const latestTs = Math.max(...timestamps)
      referenceDate = new Date(latestTs)
      windowStart = startOfDay(referenceDate)
      windowEnd = endOfDay(referenceDate)
      primaryUpdates = recentPool.filter(update => {
        const date = extractUpdateDate(update)
        return date && date >= windowStart && date <= windowEnd
      })
    }
  }

  if (primaryUpdates.length === 0 && recentPool.length > 0) {
    const fallbackReference = extractUpdateDate(recentPool[0])
    if (fallbackReference) {
      referenceDate = fallbackReference
    }
    primaryUpdates = recentPool.slice(0, Math.min(40, recentPool.length))
  }

  primaryUpdates = enforceDailyAuthorityCap(primaryUpdates, DAILY_AUTHORITY_CAP)

  const highImpactToday = primaryUpdates.filter(isHighImpact)
  const highImpactCount = highImpactToday.length
  const urgencyScore = computeUrgencyScore(primaryUpdates)

  const todayAuthorities = new Set(
    primaryUpdates.map(update => update.authority).filter(Boolean)
  )

  const deadlinesSoon = primaryUpdates.filter(update => getUpcomingDeadline(update, referenceDate)).length

  const groups = groupUpdatesByDay(recentPool)
  const dailyHighImpactCounts = Array.from(groups.values()).map(updates =>
    updates.filter(isHighImpact).length
  )
  const averageHighImpact = dailyHighImpactCounts.length
    ? dailyHighImpactCounts.reduce((sum, value) => sum + value, 0) / dailyHighImpactCounts.length
    : 0

  const dailyAuthorityCounts = Array.from(groups.values()).map(updates => {
    const unique = new Set(updates.map(update => update.authority).filter(Boolean))
    return unique.size
  })

  const averageAuthorities = dailyAuthorityCounts.length
    ? dailyAuthorityCounts.reduce((sum, value) => sum + value, 0) / dailyAuthorityCounts.length
    : 0

  const highImpactScore = computeHighImpactScore(highImpactCount, averageHighImpact)
  const authorityScore = computeAuthorityScore(todayAuthorities.size, averageAuthorities)
  const deadlineScore = computeDeadlineScore(deadlinesSoon)
  const outstandingTasks = countOutstandingTasks(annotations)
  const taskScore = computeTaskScore(outstandingTasks)

  let riskComponentInputs = {
    highImpactScore,
    urgencyScore,
    authorityScore,
    deadlineScore,
    taskScore
  }

  let riskPulseScoreRaw =
    (0.35 * riskComponentInputs.highImpactScore) +
    (0.20 * riskComponentInputs.urgencyScore) +
    (0.15 * riskComponentInputs.authorityScore) +
    (0.15 * riskComponentInputs.deadlineScore) +
    (0.15 * riskComponentInputs.taskScore)

  let riskPulseScore = Number.isFinite(riskPulseScoreRaw) ? parseFloat(riskPulseScoreRaw.toFixed(1)) : NaN

  if ((!Number.isFinite(riskPulseScore) || riskPulseScore <= 0) && groups.size) {
    const fallbackEntry = Array.from(groups.entries())
      .sort((a, b) => Date.parse(b[0]) - Date.parse(a[0]))[0]
    const fallbackUpdates = fallbackEntry ? fallbackEntry[1] : null
    if (fallbackUpdates && fallbackUpdates.length) {
      const fallbackHighImpactScore = computeHighImpactScore(
        fallbackUpdates.filter(isHighImpact).length,
        averageHighImpact
      )
      const fallbackAuthorityScore = computeAuthorityScore(
        new Set(fallbackUpdates.map(update => update.authority).filter(Boolean)).size,
        averageAuthorities
      )
      const fallbackDeadlineScore = computeDeadlineScore(
        fallbackUpdates.filter(update => getUpcomingDeadline(update, referenceDate)).length
      )
      const fallbackUrgencyScore = computeUrgencyScore(fallbackUpdates)
      riskComponentInputs = {
        highImpactScore: fallbackHighImpactScore,
        urgencyScore: fallbackUrgencyScore,
        authorityScore: fallbackAuthorityScore,
        deadlineScore: fallbackDeadlineScore,
        taskScore
      }
      riskPulseScoreRaw =
        (0.35 * riskComponentInputs.highImpactScore) +
        (0.20 * riskComponentInputs.urgencyScore) +
        (0.15 * riskComponentInputs.authorityScore) +
        (0.15 * riskComponentInputs.deadlineScore) +
        (0.15 * riskComponentInputs.taskScore)
      const fallbackRounded = Number.isFinite(riskPulseScoreRaw) ? parseFloat(riskPulseScoreRaw.toFixed(1)) : NaN
      if (Number.isFinite(fallbackRounded)) {
        riskPulseScore = fallbackRounded
      }
    }
  }

  if (!Number.isFinite(riskPulseScore)) {
    riskPulseScore = RISK_PULSE_FLOOR
  }

  riskPulseScore = Math.max(RISK_PULSE_FLOOR, riskPulseScore)
  const riskComponents = buildRiskComponents(riskComponentInputs)

  const baselineUrgency = computeUrgencyScore(recentPool)
  const baselineScore =
    (0.35 * 5) +
    (0.20 * baselineUrgency) +
    (0.15 * 5) +
    (0.15 * 5) +
    (0.15 * Math.min(10, outstandingTasks * 2))

  const riskPulseDelta = parseFloat((riskPulseScore - baselineScore).toFixed(1))

  const pinnedItems = Array.isArray(pinnedItemsResult) ? pinnedItemsResult : (pinnedItemsResult && pinnedItemsResult.items) || []
  const savedSearches = Array.isArray(savedSearchesResult) ? savedSearchesResult : (savedSearchesResult && savedSearchesResult.searches) || []
  const customAlerts = Array.isArray(customAlertsResult) ? customAlertsResult : (customAlertsResult && customAlertsResult.alerts) || []

  const profileContext = {
    profile: activeProfile,
    behaviourWeights: buildBehaviourContext(behaviourScores)
  }

  const streams = ensureUpdatesContainer(primaryUpdates, profileContext)
  applyPinnedStateToStreams(streams, pinnedItems)
  const personaSnapshot = buildPersonaSnapshot(streams, annotations)
  const personaBriefings = buildPersonaBriefings(personaSnapshot, streams)
  Object.keys(personaSnapshot).forEach(persona => {
    personaSnapshot[persona].briefing = personaBriefings[persona] || {
      summary: 'No priority actions detected.',
      nextSteps: []
    }
  })

  const quickStats = {
    totalUpdates: primaryUpdates.length,
    highImpact: highImpactCount,
    activeAuthorities: todayAuthorities.size,
    deadlinesSoon,
    urgentUpdates: primaryUpdates.filter(update => normalizeUrgency(update.urgency) === 'High').length
  }

  const primaryFocus = selectAuthorityFocus(highImpactToday.length ? highImpactToday : primaryUpdates)

  const focusHeadline = primaryFocus && primaryFocus.bestUpdate
    ? `Focus on ${primaryFocus.authority} — ${primaryFocus.bestUpdate.headline || 'Priority update identified'}.`
    : ''

  const executiveSummary = buildExecutiveSummary(
    quickStats,
    focusHeadline,
    highImpactToday.slice(0, 3)
  )
  const heroInsight = buildHeroInsight(primaryFocus, executiveSummary, streams)

  const timeline = buildTimelineEntries(primaryUpdates, referenceDate)
  const themes = computeThemes(highImpactToday)

  const annotationSummary = summarizeAnnotationsList(annotations)

  const recommendedWorkflows = workflowRecommendationService.buildRecommendations({
    profile: activeProfile,
    behaviourScores,
    streams
  })

  return {
    generatedAt: new Date().toISOString(),
    snapshotDate: referenceDate.toISOString(),
    riskPulse: {
      score: riskPulseScore,
      label: labelledRisk(riskPulseScore),
      delta: riskPulseDelta,
      components: riskComponents
    },
    focusHeadline,
    heroInsight,
    quickStats,
    executiveSummary,
    streams,
    personas: personaSnapshot,
    personaBriefings,
    recommendedWorkflows,
    savedWorkflows,
    workspace: {
      stats: (workspaceStatsResult && workspaceStatsResult.stats) || {},
      tasks: outstandingTasks,
      pinnedItems,
      savedSearches,
      customAlerts,
      annotationSummary
    },
    timeline,
    themes,
    profile: activeProfile,
    profileBehaviour: behaviourScores,
    profile: activeProfile,
    profileBehaviour: behaviourScores,
    layoutConfig: {
      showThemes: true,
      showAuthoritySpotlight: true,
      personaOrder: ['executive', 'analyst', 'operations']
    }
  }
}

module.exports = {
  getDailySnapshot,
  buildClientSnapshot
}
function buildHeroInsight(primaryFocus, executiveSummary, streams) {
  if (!primaryFocus || !primaryFocus.bestUpdate) {
    return {
      headline: 'Monitoring in progress',
      summary: executiveSummary || 'No dominant insight detected today.',
      recommendation: 'Monitor regulatory feeds and await new signals.',
      authority: null
    }
  }

  const update = primaryFocus.bestUpdate
  const nextStep = deriveNextStep(update)
  const summary = update.summary || executiveSummary || 'Key development requires review.'

  const similarSignals = []
  const buckets = streams || { high: [], medium: [], low: [] }
  Object.values(buckets).forEach(list => {
    list.forEach(item => {
      if (item.updateId !== update.id && item.authority === update.authority) {
        similarSignals.push(item.headline)
      }
    })
  })

  return {
    headline: `${update.authority || 'Key authority'} — ${update.headline || 'Priority insight'}`,
    summary,
    recommendation: nextStep,
    relatedSignals: similarSignals.slice(0, 3)
  }
}

function buildPersonaBriefings(personaSnapshot, streams) {
  const template = {
    summary: 'No priority actions detected.',
    nextSteps: []
  }

  if (!personaSnapshot || typeof personaSnapshot !== 'object') {
    return {}
  }

  const buckets = streams || { high: [], medium: [], low: [] }
  const canonicalUpdates = new Map()
  Object.values(buckets).forEach(list => {
    if (!Array.isArray(list)) return
    list.forEach(update => {
      if (!update) return
      const key = update.updateId || update.id || update.url
      if (!key || canonicalUpdates.has(key)) return
      canonicalUpdates.set(key, update)
    })
  })

  const joinAuthorities = authorities => {
    if (!authorities.length) return ''
    if (authorities.length === 1) return authorities[0]
    if (authorities.length === 2) return `${authorities[0]} and ${authorities[1]}`
    const remaining = authorities.length - 2
    return `${authorities[0]}, ${authorities[1]}${remaining > 0 ? ` and ${remaining} other${remaining > 1 ? 's' : ''}` : ''}`
  }

  const personaConfigs = {
    executive: {
      maxItems: 3,
      verbs: {
        High: 'Escalate with ExCo',
        Medium: 'Brief leadership',
        Low: 'Monitor in daily huddle',
        default: 'Monitor'
      },
      buildSummary: ({ authorities, metrics }) => {
        if (authorities.length) {
          const focusLabel = joinAuthorities(authorities)
          const tasksNote = metrics.openTasks > 0
            ? ` ${metrics.openTasks} action${metrics.openTasks === 1 ? '' : 's'} awaiting sign-off.`
            : ''
          return `Leadership focus on ${focusLabel}.${tasksNote}`.trim()
        }
        if (metrics.pins > 0) {
          return `No fresh escalations — review ${metrics.pins} pinned update${metrics.pins === 1 ? '' : 's'} for next steps.`
        }
        return ''
      },
      fallbackSteps: metrics => {
        if (metrics.pins > 0) {
          return [`Confirm ownership of ${metrics.pins === 1 ? 'the pinned item' : `${metrics.pins} pinned items`} before day end.`]
        }
        return ['Hold a quick sync with the compliance lead to confirm no executive escalations are pending.']
      }
    },
    analyst: {
      maxItems: 4,
      verbs: {
        High: 'Draft impact briefing',
        Medium: 'Deep-dive analysis',
        Low: 'Tag for monitoring',
        default: 'Monitor'
      },
      buildSummary: ({ authorities, metrics }) => {
        if (authorities.length) {
          const focusLabel = joinAuthorities(authorities)
          return `Research queue prioritises developments from ${focusLabel}.`
        }
        if (metrics.openTasks > 0) {
          return `Close out ${metrics.openTasks} outstanding analysis task${metrics.openTasks === 1 ? '' : 's'} today.`
        }
        return ''
      },
      fallbackSteps: metrics => {
        if (metrics.pins > 0) {
          return [`Refresh summaries for ${metrics.pins === 1 ? 'the pinned brief' : `${metrics.pins} pinned briefs`}.`]
        }
        return ['Refresh saved searches and capture any new emerging topics for tomorrow’s sweep.']
      }
    },
    operations: {
      maxItems: 3,
      verbs: {
        High: 'Coordinate response',
        Medium: 'Update playbooks',
        Low: 'Track readiness',
        default: 'Monitor'
      },
      buildSummary: ({ authorities, metrics }) => {
        if (authorities.length) {
          const focusLabel = joinAuthorities(authorities)
          return `Operational readiness: align procedures for ${focusLabel}.`
        }
        if (metrics.openTasks > 0) {
          return `Progress ${metrics.openTasks} operational follow-up${metrics.openTasks === 1 ? '' : 's'} still open.`
        }
        return ''
      },
      fallbackSteps: metrics => {
        if (metrics.pins > 0) {
          return [`Confirm implementation owners for ${metrics.pins === 1 ? 'the pinned mandate' : `${metrics.pins} pinned mandates`}.`]
        }
        return ['Verify run-books and ensure monitoring alerts remain active for overnight changes.']
      }
    },
    default: {
      maxItems: 3,
      verbs: {
        High: 'Escalate',
        Medium: 'Review',
        Low: 'Monitor',
        default: 'Monitor'
      },
      buildSummary: ({ authorities }) => {
        if (authorities.length) {
          return `Focus on developments from ${joinAuthorities(authorities)}.`
        }
        return ''
      },
      fallbackSteps: () => ['Monitor the regulatory feed for new developments throughout the day.']
    }
  }

  const result = {}

  Object.entries(personaSnapshot).forEach(([persona, data]) => {
    const config = personaConfigs[persona] || personaConfigs.default
    const metrics = {
      pins: data?.pins || 0,
      openTasks: data?.openTasks || 0,
      total: data?.count || 0
    }

    const updates = Array.isArray(data?.updates) ? data.updates : []
    const hydrated = updates
      .map(update => {
        if (!update) return null
        const key = update.updateId || update.id || update.url
        const canonical = key ? canonicalUpdates.get(key) : null
        const merged = { ...(canonical || update) }
        merged.personas = Array.isArray(merged.personas) ? merged.personas : []
        merged.bucket = update.bucket || merged.bucket || 'medium'
        return merged
      })
      .filter(Boolean)

    const personaKey = String(persona || '').toLowerCase()
    const targeted = hydrated.filter(update => {
      if (!update.personas.length) return personaKey === 'analyst'
      return update.personas.map(value => String(value || '').trim().toLowerCase()).includes(personaKey)
    })

    const prioritized = (targeted.length ? targeted : hydrated).slice(0, config.maxItems)
    const authorities = Array.from(new Set(prioritized.map(update => update.authority).filter(Boolean)))

    const summary = config.buildSummary({
      entries: prioritized,
      authorities,
      metrics
    })

    const nextSteps = prioritized.map(update => {
      const urgency = normalizeUrgency(update.urgency)
      const verb = config.verbs[urgency] || config.verbs.default
      const authorityLabel = update.authority || 'Regulator'
      const headline = update.headline || 'Untitled insight'
      const action = update.nextStep || deriveNextStep(update)
      return `${verb}: ${headline} (${authorityLabel}) — ${action}`
    })

    const fallbackSteps = config.fallbackSteps(metrics)

    result[persona] = {
      summary: summary || template.summary,
      nextSteps: nextSteps.length ? nextSteps : fallbackSteps
    }
  })

  return result
}
