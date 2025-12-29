const relevanceService = require('../relevanceService')
const { extractUpdateDate, toTimestamp } = require('./dates')
const { derivePersonas, deriveNextStep, normalizeUrgency } = require('./updates')

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

module.exports = {
  ensureUpdatesContainer,
  rebalanceAuthorityDistribution,
  applyPinnedStateToStreams
}
