/**
 * Calendar API Routes
 * Endpoints for regulatory calendar functionality
 */

const calendarService = require('../../services/calendarService')
const db = require('../../services/dbService')
const analyticsService = require('../../services/analyticsService')

function registerCalendarRoutes(router) {

  /**
   * GET /api/calendar/events
   * Get calendar events with filters
   */
  router.get('/calendar/events', async (req, res) => {
    try {
      const {
        startDate,
        endDate,
        eventTypes,
        authorities,
        sectors,
        priority
      } = req.query

      // Default to current month if no dates provided
      const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      const end = endDate || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString()

      const filters = {}
      if (eventTypes) {
        filters.eventTypes = Array.isArray(eventTypes) ? eventTypes : eventTypes.split(',')
      }
      if (authorities) {
        filters.authorities = Array.isArray(authorities) ? authorities : authorities.split(',')
      }
      if (sectors) {
        filters.sectors = Array.isArray(sectors) ? sectors : sectors.split(',')
      }
      if (priority) {
        filters.priority = priority
      }

      const events = await calendarService.getEvents(start, end, filters)

      // Group events by date for calendar view
      const eventsByDate = {}
      for (const event of events) {
        const dateKey = new Date(event.eventDate).toISOString().split('T')[0]
        if (!eventsByDate[dateKey]) {
          eventsByDate[dateKey] = []
        }
        eventsByDate[dateKey].push(event)
      }

      res.json({
        success: true,
        events,
        eventsByDate,
        count: events.length,
        dateRange: { start, end }
      })
    } catch (err) {
      console.error('Error fetching calendar events:', err)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch calendar events'
      })
    }
  })

  /**
   * GET /api/calendar/upcoming
   * Get upcoming events for dashboard widget
   */
  router.get('/calendar/upcoming', async (req, res) => {
    try {
      const days = parseInt(req.query.days) || 30
      const limit = parseInt(req.query.limit) || 10

      const events = await calendarService.getUpcomingEvents(days, limit)
      const critical = events.filter(e => e.priority === 'critical' || e.priority === 'high')

      res.json({
        success: true,
        events,
        count: events.length,
        critical: critical.length,
        thisWeek: events.filter(e => e.daysUntil <= 7).length
      })
    } catch (err) {
      console.error('Error fetching upcoming events:', err)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch upcoming events'
      })
    }
  })

  /**
   * GET /api/calendar/event/:id
   * Get single event details
   */
  router.get('/calendar/event/:id', async (req, res) => {
    try {
      const event = await calendarService.getEventById(req.params.id)

      if (!event) {
        return res.status(404).json({
          success: false,
          error: 'Event not found'
        })
      }

      res.json({
        success: true,
        event
      })
    } catch (err) {
      console.error('Error fetching event:', err)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch event'
      })
    }
  })

  /**
   * GET /api/calendar/summary
   * Get monthly calendar summary
   */
  router.get('/calendar/summary', async (req, res) => {
    try {
      const year = parseInt(req.query.year) || new Date().getFullYear()
      const month = parseInt(req.query.month) || new Date().getMonth() + 1

      const summary = await calendarService.getMonthlySummary(year, month)

      res.json({
        success: true,
        summary
      })
    } catch (err) {
      console.error('Error fetching calendar summary:', err)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch calendar summary'
      })
    }
  })

  /**
   * GET /api/calendar/export/ical
   * Export calendar to iCal format
   */
  router.get('/calendar/export/ical', async (req, res) => {
    try {
      const {
        startDate,
        endDate,
        eventTypes
      } = req.query

      // Default to next 90 days
      const start = startDate || new Date().toISOString()
      const end = endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()

      const filters = {}
      if (eventTypes) {
        filters.eventTypes = Array.isArray(eventTypes) ? eventTypes : eventTypes.split(',')
      }

      const icalData = await calendarService.generateICalExport(start, end, filters)

      res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
      res.setHeader('Content-Disposition', 'attachment; filename="regcanary-calendar.ics"')
      res.send(icalData)
    } catch (err) {
      console.error('Error generating iCal export:', err)
      res.status(500).json({
        success: false,
        error: 'Failed to generate iCal export'
      })
    }
  })

  /**
   * GET /api/calendar/types
   * Get available event types for filtering
   */
  router.get('/calendar/types', async (req, res) => {
    try {
      const types = calendarService.getEventTypes()
      const priorities = calendarService.getPriorityLevels()

      res.json({
        success: true,
        eventTypes: types,
        priorities
      })
    } catch (err) {
      console.error('Error fetching calendar types:', err)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch calendar types'
      })
    }
  })

  /**
   * GET /api/calendar/authorities
   * Get available authorities for filtering
   */
  router.get('/calendar/authorities', async (req, res) => {
    try {
      await db.waitForInitialization()

      // Get unique authorities from regulatory_updates
      const result = await db.pool.query(`
        SELECT DISTINCT authority
        FROM regulatory_updates
        WHERE authority IS NOT NULL AND authority != ''
        ORDER BY authority
      `)

      const authorities = result.rows.map(r => r.authority)

      res.json({
        success: true,
        authorities
      })
    } catch (err) {
      console.error('Error fetching authorities:', err)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch authorities'
      })
    }
  })

  /**
   * GET /api/calendar/critical
   * Get critical events needing immediate attention
   */
  router.get('/calendar/critical', async (req, res) => {
    try {
      const days = parseInt(req.query.days) || 7
      const events = await calendarService.getCriticalEvents(days)

      res.json({
        success: true,
        events,
        count: events.length
      })
    } catch (err) {
      console.error('Error fetching critical events:', err)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch critical events'
      })
    }
  })

  // ============================================
  // CALENDAR INSIGHTS ENDPOINTS
  // ============================================

  /**
   * GET /api/calendar/insights/workload
   * Get workload distribution - events per week/month
   */
  router.get('/calendar/insights/workload', async (req, res) => {
    try {
      const months = parseInt(req.query.months) || 6

      const workload = await analyticsService.getCalendarWorkload({ months })

      res.json({
        success: true,
        ...workload
      })
    } catch (err) {
      console.error('Error fetching calendar workload:', err)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch calendar workload'
      })
    }
  })

  /**
   * GET /api/calendar/insights/risk-matrix
   * Get impact vs urgency matrix
   */
  router.get('/calendar/insights/risk-matrix', async (req, res) => {
    try {
      const urgentDays = parseInt(req.query.urgentDays) || 30

      const matrix = await analyticsService.getCalendarRiskMatrix({ urgentDays })

      res.json({
        success: true,
        ...matrix
      })
    } catch (err) {
      console.error('Error fetching risk matrix:', err)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch risk matrix'
      })
    }
  })

  /**
   * GET /api/calendar/insights/authority-activity
   * Get authority activity trends
   */
  router.get('/calendar/insights/authority-activity', async (req, res) => {
    try {
      const months = parseInt(req.query.months) || 12

      const trends = await analyticsService.getAuthorityActivityTrends({ months })

      res.json({
        success: true,
        ...trends
      })
    } catch (err) {
      console.error('Error fetching authority activity:', err)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch authority activity'
      })
    }
  })

  /**
   * GET /api/calendar/insights/sector-exposure
   * Get sector exposure analysis
   */
  router.get('/calendar/insights/sector-exposure', async (req, res) => {
    try {
      const { sectors } = req.query
      const sectorList = sectors ? sectors.split(',') : []

      const exposure = await analyticsService.getSectorExposure({ sectors: sectorList })

      res.json({
        success: true,
        ...exposure
      })
    } catch (err) {
      console.error('Error fetching sector exposure:', err)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch sector exposure'
      })
    }
  })

  /**
   * GET /api/calendar/insights/summary
   * Get calendar insights summary for dashboard
   */
  router.get('/calendar/insights/summary', async (req, res) => {
    try {
      const summary = await analyticsService.getCalendarInsightsSummary()

      res.json({
        success: true,
        ...summary
      })
    } catch (err) {
      console.error('Error fetching insights summary:', err)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch insights summary'
      })
    }
  })
}

module.exports = registerCalendarRoutes
