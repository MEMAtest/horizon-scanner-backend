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
      // First check if the table exists
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'policies'
        )
      `)

      if (!tableCheck.rows[0].exists) {
        return []
      }

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

      return result.rows.map(row => {
        const normalized = normalizeCalendarEvent(row, 'policy_review')
        return {
          ...normalized,
          eventType: 'policy_review',
          authority: 'Internal Policy',  // Policy reviews are internal
          priority: 'medium',
          metadata: {
            ...normalized.metadata,
            ownerName: row.owner_name,
            reviewFrequency: row.review_frequency_months
          }
        }
      })
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
          priority, status, notification_dates, created_at,
          metadata->>'authority' as authority,
          tags as sector
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
      // First check if the table exists
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'regulatory_change_items'
        )
      `)

      if (!tableCheck.rows[0].exists) {
        return []
      }

      const result = await pool.query(`
        SELECT
          id, title, target_completion_date as event_date,
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
      // First check if the table exists
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'regulatory_alerts'
        )
      `)

      if (!tableCheck.rows[0].exists) {
        return []
      }

      const result = await pool.query(`
        SELECT
          id, title, deadline as event_date, severity as priority,
          alert_type as event_type, urgency_score, status, created_at,
          COALESCE(authority, 'System Alert') as authority
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
        authority: row.authority || 'System Alert',
        priority: row.severity || calculatePriority(row)
      }))
    } catch (err) {
      // Table might not exist or have different schema - fail gracefully
      if (!err.message.includes('does not exist')) {
        console.error('Error fetching alert deadlines:', err.message)
      }
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

  /**
   * Create a compliance event
   * Used for importing regulatory initiatives and other compliance milestones
   */
  DBService.prototype.createComplianceEvent = async function(event) {
    const pool = this.pool
    if (!pool) {
      console.warn('No database pool available for createComplianceEvent')
      return null
    }

    try {
      const result = await pool.query(`
        INSERT INTO compliance_events (
          title, description, event_type, event_date, priority, status,
          tags, metadata, compliance_requirements, milestones, is_active,
          notification_dates, implementation_phases, business_impact,
          estimated_effort, dependencies, assignees, progress,
          risk_factors, documents
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11,
          $12, $13, $14,
          $15, $16, $17, $18,
          $19, $20
        )
        RETURNING *
      `, [
        event.title,
        event.description,
        event.event_type || 'deadline',
        event.event_date,
        event.priority || 'medium',
        event.status || 'pending',
        event.tags || '[]',
        event.metadata || '{}',
        event.compliance_requirements || '[]',
        event.milestones || '[]',
        event.is_active !== false,
        event.notification_dates || '[]',
        event.implementation_phases || '[]',
        event.business_impact || '{}',
        event.estimated_effort || '{}',
        event.dependencies || '[]',
        event.assignees || '[]',
        event.progress || 0,
        event.risk_factors || '[]',
        event.documents || '[]'
      ])

      return result.rows[0]
    } catch (err) {
      console.error('Error creating compliance event:', err.message)
      throw err
    }
  }

  /**
   * Check if a compliance event already exists
   */
  DBService.prototype.complianceEventExists = async function(title, authority, source) {
    const pool = this.pool
    if (!pool) return false

    try {
      const result = await pool.query(`
        SELECT id FROM compliance_events
        WHERE title = $1
          AND metadata->>'authority' = $2
          AND metadata->>'source' = $3
        LIMIT 1
      `, [title, authority, source])

      return result.rows.length > 0
    } catch (err) {
      console.error('Error checking compliance event existence:', err.message)
      return false
    }
  }

  /**
   * Create calendar events from a regulatory update with extracted dates
   * Called after saving a regulatory_update to auto-generate calendar events
   */
  DBService.prototype.createEventsFromUpdate = async function(update) {
    const pool = this.pool
    if (!pool) {
      console.warn('No database pool available for createEventsFromUpdate')
      return { created: 0, skipped: 0 }
    }

    const results = { created: 0, skipped: 0 }

    try {
      // Collect all dates to process
      const datesToProcess = []

      // Primary compliance deadline
      if (update.compliance_deadline) {
        datesToProcess.push({
          date: update.compliance_deadline,
          type: 'deadline',
          context: 'Compliance deadline'
        })
      }

      // Consultation end date
      if (update.consultation_end_date) {
        datesToProcess.push({
          date: update.consultation_end_date,
          type: 'consultation',
          context: 'Consultation closes'
        })
      }

      // Implementation date
      if (update.implementation_date) {
        datesToProcess.push({
          date: update.implementation_date,
          type: 'implementation',
          context: 'Implementation effective'
        })
      }

      // Review date
      if (update.review_date) {
        datesToProcess.push({
          date: update.review_date,
          type: 'review',
          context: 'Review period'
        })
      }

      // All extracted calendar dates
      if (update.all_calendar_dates && Array.isArray(update.all_calendar_dates)) {
        for (const dateEntry of update.all_calendar_dates) {
          // Avoid duplicates with the primary dates
          const exists = datesToProcess.some(d => d.date === dateEntry.date)
          if (!exists) {
            datesToProcess.push({
              date: dateEntry.date,
              type: dateEntry.type || 'deadline',
              context: dateEntry.context || 'Extracted date'
            })
          }
        }
      }

      // Process each date
      for (const dateInfo of datesToProcess) {
        try {
          // Check if event already exists for this update + date
          const existsResult = await pool.query(`
            SELECT id FROM compliance_events
            WHERE metadata->>'source_update_id' = $1
              AND event_date::date = $2::date
            LIMIT 1
          `, [String(update.id), dateInfo.date])

          if (existsResult.rows.length > 0) {
            results.skipped++
            continue
          }

          // Determine event type and priority
          const eventType = dateInfo.type === 'consultation' ? 'consultation' :
                           dateInfo.type === 'implementation' ? 'implementation' :
                           dateInfo.type === 'review' ? 'review' : 'deadline'

          const priority = update.impact_level === 'Significant' ? 'high' :
                          update.impact_level === 'Moderate' ? 'medium' : 'low'

          // Create the event
          const title = eventType === 'consultation'
            ? `Consultation closes: ${update.headline || update.title || 'Regulatory Update'}`
            : eventType === 'implementation'
            ? `Effective: ${update.headline || update.title || 'Regulatory Update'}`
            : `${update.headline || update.title || 'Regulatory Update'}`

          const metadata = {
            source: 'auto_extracted',
            source_update_id: String(update.id),
            source_url: update.url,
            authority: update.authority,
            date_type: dateInfo.type,
            date_context: dateInfo.context,
            impact_level: update.impact_level
          }

          await pool.query(`
            INSERT INTO compliance_events (
              title, description, event_type, event_date, priority, status,
              tags, metadata, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `, [
            title.substring(0, 500),
            (update.ai_summary || update.description || dateInfo.context || '').substring(0, 2000),
            eventType,
            dateInfo.date,
            priority,
            'pending',
            JSON.stringify([update.sector || 'General']),
            JSON.stringify(metadata),
            true
          ])

          results.created++
        } catch (insertErr) {
          console.warn(`Could not create event for date ${dateInfo.date}:`, insertErr.message)
          results.skipped++
        }
      }

      if (results.created > 0) {
        console.log(`📅 Auto-created ${results.created} calendar event(s) from update ${update.id}`)
      }

      return results
    } catch (err) {
      console.error('Error creating events from update:', err.message)
      return results
    }
  }

  /**
   * Check if a calendar event exists for a specific update and date
   */
  DBService.prototype.calendarEventExistsForUpdate = async function(updateId, eventDate) {
    const pool = this.pool
    if (!pool) return false

    try {
      const result = await pool.query(`
        SELECT id FROM compliance_events
        WHERE metadata->>'source_update_id' = $1
          AND event_date::date = $2::date
        LIMIT 1
      `, [String(updateId), eventDate])

      return result.rows.length > 0
    } catch (err) {
      console.error('Error checking calendar event for update:', err.message)
      return false
    }
  }
}

module.exports = applyCalendarMethods
