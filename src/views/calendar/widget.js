/**
 * Calendar Widget
 * Compact calendar widget for dashboard
 */

/**
 * Format date for widget display
 */
function formatWidgetDate(dateStr) {
  if (!dateStr) return { day: '--', month: '---' }
  const date = new Date(dateStr)
  return {
    day: date.getDate(),
    month: date.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()
  }
}

/**
 * Calculate days until event
 */
function getDaysUntil(dateStr) {
  if (!dateStr) return null
  const now = new Date()
  const event = new Date(dateStr)
  const diffTime = event.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Get priority label
 */
function getPriorityLabel(priority) {
  const labels = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low'
  }
  return labels[priority] || 'Medium'
}

/**
 * Render calendar widget
 */
function renderCalendarWidget(events = [], stats = {}) {
  const hasEvents = events && events.length > 0

  const calendarIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>`

  const eventRows = hasEvents
    ? events.slice(0, 4).map(event => {
        const { day, month } = formatWidgetDate(event.eventDate)
        const daysUntil = getDaysUntil(event.eventDate)
        const daysText = daysUntil === 0 ? 'Today' :
                         daysUntil === 1 ? 'Tomorrow' :
                         daysUntil < 0 ? 'Overdue' :
                         `${daysUntil}d`

        const tooltipText = `${escapeHtml(event.title || 'Untitled Event')}\n${formatEventType(event.eventType || event.sourceType)} • ${event.authority || 'Unknown'}\n${daysText} • ${event.priority || 'medium'} priority`

        return `
          <div class="widget-event" data-event-id="${event.id}" title="${tooltipText}">
            <div class="widget-event-date">
              <div class="widget-event-day">${day}</div>
              <div class="widget-event-month">${month}</div>
            </div>
            <div class="widget-event-indicator ${event.eventType || event.sourceType}"></div>
            <div class="widget-event-content">
              <div class="widget-event-title">${escapeHtml(event.title || 'Untitled Event')}</div>
              <div class="widget-event-meta">
                <span class="widget-event-type">${formatEventType(event.eventType || event.sourceType)}</span>
                <span class="widget-event-priority">
                  <span class="priority-dot ${event.priority || 'medium'}"></span>
                  ${daysText}
                </span>
              </div>
            </div>
          </div>
        `
      }).join('')
    : `
      <div class="widget-empty">
        <div class="widget-empty-icon">📅</div>
        <div>No upcoming events</div>
      </div>
    `

  const criticalCount = stats.critical || events.filter(e => e.priority === 'critical' || e.priority === 'high').length
  const thisWeekCount = stats.thisWeek || events.filter(e => getDaysUntil(e.eventDate) <= 7).length

  return `
    <div class="calendar-widget">
      <div class="calendar-widget-header">
        <div class="calendar-widget-title">
          ${calendarIcon}
          Upcoming Deadlines
        </div>
        <a href="/regulatory-calendar" class="calendar-widget-link">View Calendar →</a>
      </div>
      <div class="calendar-widget-body">
        ${eventRows}
      </div>
      ${hasEvents ? `
        <div class="widget-stats">
          <div class="widget-stat ${criticalCount > 0 ? 'critical' : ''}">
            <div class="widget-stat-value">${criticalCount}</div>
            <div class="widget-stat-label">Critical</div>
          </div>
          <div class="widget-stat">
            <div class="widget-stat-value">${thisWeekCount}</div>
            <div class="widget-stat-label">This Week</div>
          </div>
          <div class="widget-stat">
            <div class="widget-stat-value">${events.length}</div>
            <div class="widget-stat-label">Total</div>
          </div>
        </div>
      ` : ''}
    </div>
  `
}

/**
 * Format event type for display
 */
function formatEventType(type) {
  const typeLabels = {
    deadline: 'Deadline',
    consultation: 'Consultation',
    implementation: 'Implementation',
    policy_review: 'Review',
    alert: 'Alert',
    compliance_event: 'Compliance',
    regulatory_change: 'Change'
  }
  return typeLabels[type] || type || 'Event'
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Get widget client scripts
 */
function getWidgetScripts() {
  return `
    <script>
      // Calendar widget event handlers
      document.querySelectorAll('.widget-event').forEach(el => {
        el.addEventListener('click', () => {
          const eventId = el.dataset.eventId
          if (eventId) {
            // Could open modal or navigate
            window.location.href = '/regulatory-calendar?event=' + encodeURIComponent(eventId)
          }
        })
      })
    </script>
  `
}

module.exports = {
  renderCalendarWidget,
  getWidgetScripts,
  formatEventType,
  formatWidgetDate
}
