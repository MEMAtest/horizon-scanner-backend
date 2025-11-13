const dbService = require('./dbService')

const EVENT_WEIGHTS = {
  pin: 3,
  unpin: -2,
  dismiss: -1,
  workflow_start: 1,
  workflow_complete: 2,
  persona_switch: 0.5,
  alert_click: 1
}

function toArray(value) {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean)
  return [value]
}

function deriveContributions(event) {
  const contributions = []
  const baseWeight = EVENT_WEIGHTS[event.eventType] || 0
  if (!baseWeight) return contributions
  const payload = event.payload || {}

  if (payload.authority) {
    contributions.push({
      entityType: 'authority',
      entityId: String(payload.authority).trim(),
      weightDelta: baseWeight,
      occurrences: 1
    })
  }

  if (payload.theme) {
    contributions.push({
      entityType: 'theme',
      entityId: String(payload.theme).trim(),
      weightDelta: baseWeight,
      occurrences: 1
    })
  }

  toArray(payload.themes).forEach(theme => {
    contributions.push({
      entityType: 'theme',
      entityId: String(theme).trim(),
      weightDelta: baseWeight,
      occurrences: 1
    })
  })

  toArray(payload.persona || payload.personas).forEach(persona => {
    contributions.push({
      entityType: 'persona',
      entityId: String(persona).trim().toLowerCase(),
      weightDelta: baseWeight,
      occurrences: 1
    })
  })

  if (event.workflowTemplateId) {
    contributions.push({
      entityType: 'workflow_template',
      entityId: String(event.workflowTemplateId).trim(),
      weightDelta: baseWeight,
      occurrences: 1
    })
  }

  return contributions.filter(item => item.entityId)
}

function collateAdjustments(events) {
  const perProfile = new Map()

  events.forEach(event => {
    if (!event || !event.profileId) return
    const contributions = deriveContributions(event)
    if (!contributions.length) return

    const profileKey = String(event.profileId)
    if (!perProfile.has(profileKey)) {
      perProfile.set(profileKey, new Map())
    }
    const entityMap = perProfile.get(profileKey)

    contributions.forEach(contribution => {
      const key = `${contribution.entityType}:${contribution.entityId}`
      const existing = entityMap.get(key) || {
        entityType: contribution.entityType,
        entityId: contribution.entityId,
        weightDelta: 0,
        occurrences: 0,
        lastEventAt: null
      }

      existing.weightDelta += contribution.weightDelta
      existing.occurrences += contribution.occurrences
      const eventTime = event.createdAt ? new Date(event.createdAt) : new Date()
      if (!existing.lastEventAt || eventTime > new Date(existing.lastEventAt)) {
        existing.lastEventAt = eventTime.toISOString()
      }
      entityMap.set(key, existing)
    })
  })

  return perProfile
}

class FeedbackAggregator {
  async processEvents(options = {}) {
    const since = options.since ? new Date(options.since) : null
    if (since && Number.isNaN(since.getTime())) {
      throw new Error('Invalid since timestamp for aggregator')
    }

    const events = await dbService.getTelemetryEventsSince(since ? since.toISOString() : null, {
      limit: options.limit || 2000
    })

    if (!events.length) {
      return { processed: 0, profilesUpdated: 0 }
    }

    const adjustmentsByProfile = collateAdjustments(events)
    let profilesUpdated = 0

    for (const [profileId, entityMap] of adjustmentsByProfile.entries()) {
      const adjustments = Array.from(entityMap.values()).map(item => ({
        entityType: item.entityType,
        entityId: item.entityId,
        weightDelta: item.weightDelta,
        occurrences: item.occurrences,
        lastEventAt: item.lastEventAt,
        windowCounts: { total: item.occurrences }
      }))
      await dbService.applyFeedbackAdjustments(profileId, adjustments)
      profilesUpdated += 1
    }

    return {
      processed: events.length,
      profilesUpdated
    }
  }
}

module.exports = new FeedbackAggregator()
