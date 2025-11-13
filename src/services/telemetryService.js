const profileService = require('./profileService')
const dbService = require('./dbService')

const EVENT_ALIASES = new Map([
  ['pin', 'pin'],
  ['unpin', 'unpin'],
  ['dismiss', 'dismiss'],
  ['workflow_start', 'workflow_start'],
  ['workflow_complete', 'workflow_complete'],
  ['persona_switch', 'persona_switch'],
  ['alert_click', 'alert_click']
])

const DEFAULT_PAYLOAD_LIMIT_KEYS = ['authority', 'theme', 'persona', 'personas', 'bucket', 'urgency']

function normaliseEventType(eventType) {
  if (!eventType) return null
  const key = String(eventType).trim().toLowerCase().replace(/[\s-]+/g, '_')
  return EVENT_ALIASES.get(key) || null
}

function sanitisePayload(payload) {
  if (!payload || typeof payload !== 'object') return {}
  const clean = {}
  DEFAULT_PAYLOAD_LIMIT_KEYS.forEach(key => {
    if (payload[key] !== undefined) {
      clean[key] = payload[key]
    }
  })
  // Include custom keys but avoid nested objects that might be large
  Object.keys(payload).forEach(key => {
    if (clean[key] !== undefined) return
    const value = payload[key]
    if (value == null) return
    if (typeof value === 'object' && !Array.isArray(value)) return
    clean[key] = value
  })
  return clean
}

async function resolveProfileId(userId, suppliedProfileId) {
  if (suppliedProfileId) return String(suppliedProfileId)
  const profile = await profileService.getActiveProfile(userId)
  return profile && profile.id ? String(profile.id) : null
}

class TelemetryService {
  async recordEvent(event = {}) {
    const eventType = normaliseEventType(event.eventType)
    if (!eventType) {
      throw new Error(`Unsupported telemetry event type: ${event.eventType}`)
    }

    const userId = String(event.userId || 'default').trim() || 'default'
    const profileId = await resolveProfileId(userId, event.profileId)
    if (!profileId) {
      throw new Error('Unable to resolve profile for telemetry event')
    }

    const payload = sanitisePayload(event.payload)

    const createdAt = event.createdAt
      ? new Date(event.createdAt)
      : new Date()

    if (Number.isNaN(createdAt.getTime())) {
      throw new Error('Invalid telemetry timestamp')
    }

    return dbService.recordTelemetryEvent({
      userId,
      profileId,
      eventType,
      updateId: event.updateId,
      workflowTemplateId: event.workflowTemplateId,
      payload,
      createdAt: createdAt.toISOString()
    })
  }

  async fetchRecentEvents(options = {}) {
    const since = options.since ? new Date(options.since) : null
    if (since && Number.isNaN(since.getTime())) {
      throw new Error('Invalid since parameter')
    }
    return dbService.getTelemetryEventsSince(since ? since.toISOString() : null, {
      limit: options.limit
    })
  }
}

module.exports = new TelemetryService()
