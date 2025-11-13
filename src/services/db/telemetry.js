const fs = require('fs').promises

const EVENT_TYPES = new Set([
  'pin',
  'unpin',
  'dismiss',
  'workflow_start',
  'workflow_complete',
  'persona_switch',
  'alert_click'
])

function sanitizeEventInput(event = {}) {
  const eventType = String(event.eventType || '').trim().toLowerCase()
  if (!EVENT_TYPES.has(eventType)) {
    throw new Error(`Unsupported telemetry event type: ${eventType}`)
  }

  const userId = String(event.userId || 'default').trim() || 'default'
  const profileId = event.profileId ? String(event.profileId).trim() : null
  const updateId = event.updateId ? String(event.updateId).trim() : null
  const workflowTemplateId = event.workflowTemplateId ? String(event.workflowTemplateId).trim() : null
  const createdAt = event.createdAt
    ? new Date(event.createdAt)
    : new Date()

  if (Number.isNaN(createdAt.getTime())) {
    throw new Error('Invalid telemetry timestamp')
  }

  const payload = event.payload && typeof event.payload === 'object'
    ? { ...event.payload }
    : {}

  return {
    userId,
    profileId,
    eventType,
    updateId,
    workflowTemplateId,
    payload,
    createdAt: createdAt.toISOString()
  }
}

function normalizeEventRow(row) {
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    profileId: row.profile_id || null,
    eventType: row.event_type,
    updateId: row.update_id || null,
    workflowTemplateId: row.workflow_template_id || null,
    payload: row.payload && typeof row.payload === 'object' ? row.payload : {},
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
  }
}

module.exports = function applyTelemetryMethods(EnhancedDBService) {
  Object.assign(EnhancedDBService.prototype, {
    async recordTelemetryEvent(event) {
      await this.initialize()
      const sanitized = sanitizeEventInput(event)

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const result = await client.query(
            `
              INSERT INTO intelligence_events (
                user_id,
                profile_id,
                event_type,
                update_id,
                workflow_template_id,
                payload,
                created_at
              )
              VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
              RETURNING *
            `,
            [
              sanitized.userId,
              sanitized.profileId,
              sanitized.eventType,
              sanitized.updateId,
              sanitized.workflowTemplateId,
              JSON.stringify(sanitized.payload),
              sanitized.createdAt
            ]
          )
          return normalizeEventRow(result.rows[0])
        } catch (error) {
          console.warn('📊 Falling back to JSON for telemetry record:', error.message)
          return this.recordTelemetryEventJSON(sanitized)
        } finally {
          client.release()
        }
      }

      return this.recordTelemetryEventJSON(sanitized)
    },

    async getTelemetryEventsSince(since, options = {}) {
      await this.initialize()
      const limit = Number.isFinite(options.limit) && options.limit > 0 ? Math.min(options.limit, 5000) : 1000
      const sinceDate = since ? new Date(since) : null
      if (sinceDate && Number.isNaN(sinceDate.getTime())) {
        throw new Error('Invalid since timestamp supplied')
      }

      if (this.usePostgres) {
        const client = await this.pool.connect()
        try {
          const params = []
          let whereClause = ''
          if (sinceDate) {
            params.push(sinceDate.toISOString())
            whereClause = 'WHERE created_at >= $1'
          }
          params.push(limit)
          const result = await client.query(
            `
              SELECT *
              FROM intelligence_events
              ${whereClause}
              ORDER BY created_at ASC
              LIMIT $${params.length}
            `,
            params
          )
          return result.rows.map(normalizeEventRow)
        } catch (error) {
          console.warn('📊 Falling back to JSON for telemetry fetch:', error.message)
          return this.getTelemetryEventsSinceJSON(sinceDate, limit)
        } finally {
          client.release()
        }
      }

      return this.getTelemetryEventsSinceJSON(sinceDate, limit)
    },

    // ---------------------------------------------------------------------
    // JSON fallback helpers
    // ---------------------------------------------------------------------
    async loadTelemetryEventsJSON() {
      try {
        const raw = await fs.readFile(this.telemetryFile, 'utf8')
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : []
      } catch (error) {
        if (error.code === 'ENOENT') return []
        throw error
      }
    },

    async saveTelemetryEventsJSON(events) {
      await fs.writeFile(this.telemetryFile, JSON.stringify(events, null, 2))
    },

    async recordTelemetryEventJSON(event) {
      const events = await this.loadTelemetryEventsJSON()
      const nextEvent = {
        id: event.id || `evt-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        userId: event.userId,
        profileId: event.profileId,
        eventType: event.eventType,
        updateId: event.updateId,
        workflowTemplateId: event.workflowTemplateId,
        payload: event.payload,
        createdAt: event.createdAt
      }
      events.push(nextEvent)
      await this.saveTelemetryEventsJSON(events)
      return nextEvent
    },

    async getTelemetryEventsSinceJSON(sinceDate, limit) {
      const events = await this.loadTelemetryEventsJSON()
      const filtered = sinceDate
        ? events.filter(event => {
            const createdAt = new Date(event.createdAt)
            return !Number.isNaN(createdAt.getTime()) && createdAt >= sinceDate
          })
        : events.slice()
      return filtered
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .slice(0, limit)
        .map(event => ({ ...event }))
    }
  })
}
