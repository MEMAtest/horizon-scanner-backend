/**
 * Calendar Service
 * High-level calendar operations including aggregation and export
 */

const db = require('./dbService')

/**
 * Event type configuration
 */
const EVENT_TYPES = {
  deadline: { label: 'Deadline', color: '#EF4444', icon: '⏰' },
  consultation: { label: 'Consultation', color: '#3B82F6', icon: '📝' },
  implementation: { label: 'Implementation', color: '#10B981', icon: '🚀' },
  policy_review: { label: 'Policy Review', color: '#8B5CF6', icon: '📋' },
  alert: { label: 'Alert', color: '#F59E0B', icon: '⚠️' },
  compliance_event: { label: 'Compliance', color: '#EC4899', icon: '✓' },
  regulatory_change: { label: 'Reg Change', color: '#6366F1', icon: '📊' }
}

/**
 * Priority configuration
 */
const PRIORITY_CONFIG = {
  critical: { label: 'Critical', color: '#DC2626', weight: 4 },
  high: { label: 'High', color: '#EA580C', weight: 3 },
  medium: { label: 'Medium', color: '#CA8A04', weight: 2 },
  low: { label: 'Low', color: '#65A30D', weight: 1 }
}

class CalendarService {

  /**
   * Get all calendar events with optional filters
   */
  async getEvents(startDate, endDate, filters = {}) {
    await db.waitForInitialization()

    const events = await db.getAllCalendarEvents(startDate, endDate, filters)

    // Enrich events with type metadata
    return events.map(event => ({
      ...event,
      typeConfig: EVENT_TYPES[event.eventType] || EVENT_TYPES.deadline,
      priorityConfig: PRIORITY_CONFIG[event.priority] || PRIORITY_CONFIG.medium
    }))
  }

  /**
   * Get upcoming events for dashboard widget
   */
  async getUpcomingEvents(days = 30, limit = 10) {
    await db.waitForInitialization()

    const events = await db.getUpcomingCalendarEvents(days, limit)

    return events.map(event => ({
      ...event,
      typeConfig: EVENT_TYPES[event.eventType] || EVENT_TYPES.deadline,
      priorityConfig: PRIORITY_CONFIG[event.priority] || PRIORITY_CONFIG.medium,
      daysUntil: this.calculateDaysUntil(event.eventDate)
    }))
  }

  /**
   * Calculate days until an event
   */
  calculateDaysUntil(eventDate) {
    if (!eventDate) return null
    const now = new Date()
    const event = new Date(eventDate)
    const diffTime = event.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Get calendar summary for a specific month
   */
  async getMonthlySummary(year, month) {
    await db.waitForInitialization()

    const summary = await db.getCalendarSummary(year, month)

    // Add labels to type counts
    const typeBreakdown = {}
    for (const [type, count] of Object.entries(summary.byType)) {
      const config = EVENT_TYPES[type] || { label: type, color: '#6B7280' }
      typeBreakdown[type] = {
        count,
        label: config.label,
        color: config.color
      }
    }

    return {
      ...summary,
      typeBreakdown,
      month,
      year,
      monthName: new Date(year, month - 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    }
  }

  /**
   * Get single event details
   */
  async getEventById(eventId) {
    await db.waitForInitialization()

    // Parse the composite ID (format: sourceType-originalId)
    const parts = eventId.split('-')
    if (parts.length < 2) return null

    const sourceType = parts[0]
    const sourceId = parts.slice(1).join('-')

    // Fetch from appropriate source
    const startDate = new Date('2000-01-01')
    const endDate = new Date('2100-12-31')

    const events = await db.getAllCalendarEvents(
      startDate.toISOString(),
      endDate.toISOString(),
      { eventTypes: [sourceType] }
    )

    return events.find(e => e.id === eventId) || null
  }

  /**
   * Generate iCal format export
   */
  async generateICalExport(startDate, endDate, filters = {}) {
    const events = await this.getEvents(startDate, endDate, filters)

    const icalLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//RegCanary//Regulatory Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:RegCanary Regulatory Calendar',
      'X-WR-TIMEZONE:Europe/London'
    ]

    for (const event of events) {
      const uid = `${event.id}@regcanary.com`
      const dtstart = this.formatICalDate(event.eventDate)
      const dtend = event.endDate
        ? this.formatICalDate(event.endDate)
        : this.formatICalDate(event.eventDate, 1) // Add 1 day if no end date

      const summary = this.escapeICalText(event.title)
      const description = this.escapeICalText(
        `${event.description || ''}\n\nType: ${event.eventType}\nAuthority: ${event.authority || 'N/A'}\nPriority: ${event.priority}\n\nSource: RegCanary`
      )

      icalLines.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${this.formatICalDate(new Date())}`,
        `DTSTART:${dtstart}`,
        `DTEND:${dtend}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        `CATEGORIES:${event.eventType.toUpperCase()}`,
        event.url ? `URL:${event.url}` : null,
        `STATUS:${event.status === 'completed' ? 'COMPLETED' : 'CONFIRMED'}`,
        'END:VEVENT'
      )
    }

    icalLines.push('END:VCALENDAR')

    return icalLines.filter(Boolean).join('\r\n')
  }

  /**
   * Format date for iCal
   */
  formatICalDate(date, addDays = 0) {
    const d = new Date(date)
    if (addDays) d.setDate(d.getDate() + addDays)
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  }

  /**
   * Escape text for iCal format
   */
  escapeICalText(text) {
    if (!text) return ''
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
  }

  /**
   * Get available event types for filtering
   */
  getEventTypes() {
    return EVENT_TYPES
  }

  /**
   * Get priority levels for filtering
   */
  getPriorityLevels() {
    return PRIORITY_CONFIG
  }

  /**
   * Get events grouped by date for calendar grid
   */
  async getEventsGroupedByDate(year, month) {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    const events = await this.getEvents(
      startDate.toISOString(),
      endDate.toISOString()
    )

    // Group by date
    const grouped = {}
    for (const event of events) {
      const dateKey = new Date(event.eventDate).toISOString().split('T')[0]
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(event)
    }

    return grouped
  }

  /**
   * Get critical events that need attention
   */
  async getCriticalEvents(days = 7) {
    const events = await this.getUpcomingEvents(days, 50)

    return events.filter(e =>
      e.priority === 'critical' ||
      e.priority === 'high' ||
      e.daysUntil <= 3
    )
  }
}

module.exports = new CalendarService()
