const dbService = require('../dbService')
const annotationService = require('../annotationService')
const workspaceService = require('../workspaceService')
const profileService = require('../profileService')
const workflowRecommendationService = require('../workflowRecommendationService')
const workflowService = require('../workflowService')

const { DAILY_AUTHORITY_CAP, RISK_PULSE_FLOOR } = require('./constants')
const { startOfDay, endOfDay, subtractDays, toISO, extractUpdateDate, groupUpdatesByDay } = require('./dates')
const { enforceDailyAuthorityCap, getUpcomingDeadline, isHighImpact, normalizeUrgency } = require('./updates')
const {
  computeHighImpactScore,
  computeUrgencyScore,
  computeAuthorityScore,
  computeDeadlineScore,
  computeTaskScore,
  labelledRisk,
  buildRiskComponents
} = require('./risk')
const { ensureUpdatesContainer, applyPinnedStateToStreams } = require('./streams')
const { countOutstandingTasks, summarizeAnnotationsList, buildTimelineEntries } = require('./annotations')
const { buildPersonaSnapshot, buildPersonaBriefings } = require('./persona')
const { buildExecutiveSummary, buildHeroInsight, computeThemes, selectAuthorityFocus } = require('./summary')

function buildBehaviourContext(scores = []) {
  return Array.isArray(scores) ? scores.map(score => ({
    entityType: score.entityType || score.entity_type,
    entityId: score.entityId || score.entity_id,
    weight: Number(score.weight || 0)
  })) : []
}

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
    ? `Focus on ${primaryFocus.authority} \u2014 ${primaryFocus.bestUpdate.headline || 'Priority update identified'}.`
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
  getDailySnapshot
}
