const { normalizeUrgency, deriveNextStep, isHighImpact, getUpcomingDeadline } = require('./updates')

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
          return `No fresh escalations \u2014 review ${metrics.pins} pinned update${metrics.pins === 1 ? '' : 's'} for next steps.`
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
        return ['Refresh saved searches and capture any new emerging topics for tomorrow\u2019s sweep.']
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
      return `${verb}: ${headline} (${authorityLabel}) \u2014 ${action}`
    })

    const fallbackSteps = config.fallbackSteps(metrics)

    result[persona] = {
      summary: summary || template.summary,
      nextSteps: nextSteps.length ? nextSteps : fallbackSteps
    }
  })

  return result
}

module.exports = {
  rankUpdatePriority,
  buildPersonaSnapshot,
  buildPersonaBriefings
}
