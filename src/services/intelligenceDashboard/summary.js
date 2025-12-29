const { toTimestamp } = require('./dates')
const { deriveNextStep } = require('./updates')
const { rankUpdatePriority } = require('./persona')

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
    headline: `${update.authority || 'Key authority'} \u2014 ${update.headline || 'Priority insight'}`,
    summary,
    recommendation: nextStep,
    relatedSignals: similarSignals.slice(0, 3)
  }
}

module.exports = {
  buildExecutiveSummary,
  computeThemes,
  selectAuthorityFocus,
  buildHeroInsight
}
