/**
 * Calendar Database Methods
 * Queries calendar events from multiple data sources
 */

function toIso(value) {
  if (!value) return null
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString()
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

/**
 * Normalize a calendar event to consistent schema
 */
function normalizeCalendarEvent(row, sourceType) {
  if (!row) return null

  return {
    id: `${sourceType}-${row.id}`,
    sourceType,
    sourceId: row.id,
    title: row.title || row.headline || row.name || 'Untitled Event',
    description: row.description || row.summary || row.ai_summary || null,
    eventDate: toIso(row.event_date || row.eventDate || row.deadline || row.compliance_deadline || row.next_review_date || row.target_completion_date),
    endDate: toIso(row.end_date || row.endDate || null),
    eventType: row.event_type || row.eventType || sourceType,
    authority: row.authority || null,
    sector: Array.isArray(row.sector) ? row.sector : (row.sector ? [row.sector] : []),
    priority: row.priority || row.severity || calculatePriority(row),
    status: row.status || 'pending',
    url: row.url || row.source_url || null,
    impactLevel: row.impact_level || row.impactLevel || null,
    metadata: {
      sourceTable: sourceType,
      originalId: row.id,
      createdAt: toIso(row.created_at || row.createdAt),
      updatedAt: toIso(row.updated_at || row.updatedAt)
    }
  }
}

/**
 * Calculate priority based on event data
 */
function calculatePriority(row) {
  if (row.severity === 'critical' || row.urgency_score >= 80) return 'critical'
  if (row.severity === 'high' || row.urgency_score >= 60 || row.impact_level === 'Significant') return 'high'
  if (row.severity === 'medium' || row.urgency_score >= 40 || row.impact_level === 'Moderate') return 'medium'
  return 'low'
}

/**
 * Apply calendar methods to the database service
 */
function applyCalendarMethods(DBService) {

  /**
   * Get deadline events from regulatory_updates
   */
  DBService.prototype.getDeadlineEvents = async function(startDate, endDate) {
    const pool = this.pool
    if (!pool) return []

    try {
      const result = await pool.query(`
        SELECT
          id, headline as title, ai_summary as description,
          compliance_deadline as event_date, authority, sector,
          impact_level, url, created_at
        FROM regulatory_updates
        WHERE compliance_deadline IS NOT NULL
          AND compliance_deadline >= $1
          AND compliance_deadline <= $2
        ORDER BY compliance_deadline ASC
      `, [startDate, endDate])

      return result.rows.map(row => normalizeCalendarEvent(row, 'deadline'))
    } catch (err) {
      console.error('Error fetching deadline events:', err.message)
      return []
    }
  }

  /**
   * Get consultation events from deadline_intelligence
   */
  DBService.prototype.getConsultationEvents = async function(startDate, endDate) {
    const pool = this.pool
    if (!pool) return []

    try {
      const result = await pool.query(`
        SELECT
          di.id, di.consultation_periods, di.update_id,
          ru.headline as title, ru.ai_summary as description,
          ru.authority, ru.sector, ru.url, di.created_at
        FROM deadline_intelligence di
        LEFT JOIN regulatory_updates ru ON di.update_id = ru.id
        WHERE di.consultation_periods IS NOT NULL
          AND jsonb_array_length(di.consultation_periods) > 0
          AND di.analyzed_at > NOW() - INTERVAL '180 days'
        ORDER BY di.created_at DESC
        LIMIT 200
      `)

      const events = []
      for (const row of result.rows) {
        const consultations = row.consultation_periods || []
        for (const consultation of consultations) {
          const endDateParsed = new Date(consultation.endDate)
          if (endDateParsed >= new Date(startDate) && endDateParsed <= new Date(endDate)) {
            events.push({
              id: `consultation-${row.id}-${consultation.endDate}`,
              sourceType: 'consultation',
              sourceId: row.id,
              title: row.title || 'Consultation',
              description: consultation.description || row.description,
              eventDate: toIso(consultation.startDate),
              endDate: toIso(consultation.endDate),
              eventType: 'consultation',
              authority: row.authority,
              sector: Array.isArray(row.sector) ? row.sector : (row.sector ? [row.sector] : []),
              priority: 'medium',
              status: new Date(consultation.endDate) < new Date() ? 'closed' : 'open',
              url: row.url,
              metadata: {
                sourceTable: 'deadline_intelligence',
                originalId: row.id,
                responseRequired: consultation.responseRequired
              }
            })
          }
        }
      }

      return events.sort((a, b) => new Date(a.endDate) - new Date(b.endDate))
    } catch (err) {
      console.error('Error fetching consultation events:', err.message)
      return []
    }
  }

  /**
   * Get policy review dates
   */
  DBService.prototype.getPolicyReviewDates = async function(startDate, endDate) {
    const pool = this.pool
    if (!pool) return []

    try {
      const result = await pool.query(`
        SELECT
          id, name as title, description, next_review_date as event_date,
          owner_name, status, review_frequency_months, created_at
        FROM policies
        WHERE status = 'active'
          AND next_review_date IS NOT NULL
          AND next_review_date >= $1
          AND next_review_date <= $2
        ORDER BY next_review_date ASC
      `, [startDate, endDate])

      return result.rows.map(row => ({
        ...normalizeCalendarEvent(row, 'policy_review'),
        eventType: 'policy_review',
        priority: 'medium',
        metadata: {
          ...normalizeCalendarEvent(row, 'policy_review').metadata,
          ownerName: row.owner_name,
          reviewFrequency: row.review_frequency_months
        }
      }))
    } catch (err) {
      console.error('Error fetching policy review dates:', err.message)
      return []
    }
  }

  /**
   * Get implementation phases from deadline_intelligence
   */
  DBService.prototype.getImplementationPhases = async function(startDate, endDate) {
    const pool = this.pool
    if (!pool) return []

    try {
      const result = await pool.query(`
        SELECT
          di.id, di.implementation_phases, di.update_id,
          ru.headline as title, ru.ai_summary as description,
          ru.authority, ru.sector, ru.url, di.created_at
        FROM deadline_intelligence di
        LEFT JOIN regulatory_updates ru ON di.update_id = ru.id
        WHERE di.implementation_phases IS NOT NULL
          AND jsonb_array_length(di.implementation_phases) > 0
          AND di.analyzed_at > NOW() - INTERVAL '180 days'
        ORDER BY di.created_at DESC
        LIMIT 100
      `)

      const events = []
      for (const row of result.rows) {
        const phases = row.implementation_phases || []
        for (const phase of phases) {
          const phaseDate = new Date(phase.estimatedStartDate || phase.estimatedEndDate)
          if (phaseDate >= new Date(startDate) && phaseDate <= new Date(endDate)) {
            events.push({
              id: `implementation-${row.id}-${phase.name}`,
              sourceType: 'implementation',
              sourceId: row.id,
              title: `${row.title || 'Implementation'}: ${phase.name}`,
              description: phase.description || row.description,
              eventDate: toIso(phase.estimatedStartDate),
              endDate: toIso(phase.estimatedEndDate),
              eventType: 'implementation',
              authority: row.authority,
              sector: Array.isArray(row.sector) ? row.sector : (row.sector ? [row.sector] : []),
              priority: 'medium',
              status: 'pending',
              url: row.url,
              metadata: {
                sourceTable: 'deadline_intelligence',
                originalId: row.id,
                phaseName: phase.name,
                duration: phase.estimatedDuration,
                deliverables: phase.deliverables
              }
            })
          }
        }
      }

      return events.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))
    } catch (err) {
      console.error('Error fetching implementation phases:', err.message)
      return []
    }
  }

  /**
   * Get compliance events
   */
  DBService.prototype.getComplianceEvents = async function(startDate, endDate) {
    const pool = this.pool
    if (!pool) return []

    try {
      const result = await pool.query(`
        SELECT
          id, title, description, event_date, event_type,
          priority, status, notification_dates, created_at
        FROM compliance_events
        WHERE is_active = true
          AND event_date >= $1
          AND event_date <= $2
        ORDER BY event_date ASC
      `, [startDate, endDate])

      return result.rows.map(row => normalizeCalendarEvent(row, 'compliance_event'))
    } catch (err) {
      console.error('Error fetching compliance events:', err.message)
      return []
    }
  }

  /**
   * Get regulatory change deadlines
   */
  DBService.prototype.getRegulatoryChangeDeadlines = async function(startDate, endDate) {
    const pool = this.pool
    if (!pool) return []

    try {
      const result = await pool.query(`
        SELECT
          id, title, description, target_completion_date as event_date,
          authority, impact_level, status, created_at
        FROM regulatory_change_items
        WHERE is_active = true
          AND target_completion_date IS NOT NULL
          AND target_completion_date >= $1
          AND target_completion_date <= $2
        ORDER BY target_completion_date ASC
      `, [startDate, endDate])

      return result.rows.map(row => ({
        ...normalizeCalendarEvent(row, 'regulatory_change'),
        eventType: 'regulatory_change',
        priority: row.impact_level === 'Significant' ? 'high' : 'medium'
      }))
    } catch (err) {
      console.error('Error fetching regulatory change deadlines:', err.message)
      return []
    }
  }

  /**
   * Get alert deadlines
   */
  DBService.prototype.getAlertDeadlines = async function(startDate, endDate) {
    const pool = this.pool
    if (!pool) return []

    try {
      const result = await pool.query(`
        SELECT
          id, title, deadline as event_date, severity as priority,
          alert_type as event_type, urgency_score, status, created_at
        FROM regulatory_alerts
        WHERE is_active = true
          AND deadline IS NOT NULL
          AND deadline >= $1
          AND deadline <= $2
        ORDER BY deadline ASC
      `, [startDate, endDate])

      return result.rows.map(row => ({
        ...normalizeCalendarEvent(row, 'alert'),
        eventType: 'alert',
        priority: row.severity || calculatePriority(row)
      }))
    } catch (err) {
      console.error('Error fetching alert deadlines:', err.message)
      return []
    }
  }

  /**
   * Get all calendar events aggregated from all sources
   */
  DBService.prototype.getAllCalendarEvents = async function(startDate, endDate, filters = {}) {
    const [
      deadlines,
      consultations,
      policyReviews,
      implementations,
      complianceEvents,
      regulatoryChanges,
      alerts
    ] = await Promise.all([
      this.getDeadlineEvents(startDate, endDate),
      this.getConsultationEvents(startDate, endDate),
      this.getPolicyReviewDates(startDate, endDate),
      this.getImplementationPhases(startDate, endDate),
      this.getComplianceEvents(startDate, endDate),
      this.getRegulatoryChangeDeadlines(startDate, endDate),
      this.getAlertDeadlines(startDate, endDate)
    ])

    let allEvents = [
      ...deadlines,
      ...consultations,
      ...policyReviews,
      ...implementations,
      ...complianceEvents,
      ...regulatoryChanges,
      ...alerts
    ]

    // Apply filters
    if (filters.eventTypes && filters.eventTypes.length > 0) {
      allEvents = allEvents.filter(e => filters.eventTypes.includes(e.eventType))
    }

    if (filters.authorities && filters.authorities.length > 0) {
      allEvents = allEvents.filter(e =>
        e.authority && filters.authorities.some(a =>
          e.authority.toLowerCase().includes(a.toLowerCase())
        )
      )
    }

    if (filters.sectors && filters.sectors.length > 0) {
      allEvents = allEvents.filter(e =>
        e.sector && e.sector.some(s =>
          filters.sectors.some(fs => s.toLowerCase().includes(fs.toLowerCase()))
        )
      )
    }

    if (filters.priority) {
      allEvents = allEvents.filter(e => e.priority === filters.priority)
    }

    // Sort by event date
    allEvents.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))

    return allEvents
  }

  /**
   * Get upcoming events for dashboard widget
   */
  DBService.prototype.getUpcomingCalendarEvents = async function(days = 30, limit = 10) {
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + days)

    const allEvents = await this.getAllCalendarEvents(
      startDate.toISOString(),
      endDate.toISOString()
    )

    // Prioritize critical and high priority events
    const sortedEvents = allEvents.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      const priorityDiff = (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3)
      if (priorityDiff !== 0) return priorityDiff
      return new Date(a.eventDate) - new Date(b.eventDate)
    })

    return sortedEvents.slice(0, limit)
  }

  /**
   * Get calendar summary stats for a month
   */
  DBService.prototype.getCalendarSummary = async function(year, month) {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    const events = await this.getAllCalendarEvents(
      startDate.toISOString(),
      endDate.toISOString()
    )

    const summary = {
      total: events.length,
      byType: {},
      byPriority: { critical: 0, high: 0, medium: 0, low: 0 },
      byWeek: {}
    }

    for (const event of events) {
      // Count by type
      summary.byType[event.eventType] = (summary.byType[event.eventType] || 0) + 1

      // Count by priority
      summary.byPriority[event.priority] = (summary.byPriority[event.priority] || 0) + 1

      // Count by week
      const eventDate = new Date(event.eventDate)
      const weekNum = Math.ceil(eventDate.getDate() / 7)
      summary.byWeek[`week${weekNum}`] = (summary.byWeek[`week${weekNum}`] || 0) + 1
    }

    return summary
  }
}

module.exports = applyCalendarMethods
