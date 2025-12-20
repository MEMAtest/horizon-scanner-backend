/**
 * Regulatory Calendar Page
 * Full calendar view for regulatory events
 */

const { getSidebar } = require('../templates/sidebar')
const { getCommonStyles } = require('../templates/commonStyles')
const { getCalendarStyles } = require('../../views/calendar/styles')
const calendarService = require('../../services/calendarService')
const firmPersonaService = require('../../services/firmPersonaService')
const { getCalendarIcon, wrapIconInContainer, getCanaryAnimationStyles } = require('../../views/icons')

async function renderCalendarPage(req, res) {
  try {
    console.log('Rendering regulatory calendar page...')

    // Get user and persona for sidebar
    const user = req.user && req.isAuthenticated ? req.user : null
    const persona = user ? await firmPersonaService.getUserPersona(user.id).catch(() => null) : null

    // Get current month/year from query or default to current
    const now = new Date()
    const year = parseInt(req.query.year) || now.getFullYear()
    const month = parseInt(req.query.month) || now.getMonth() + 1
    const view = req.query.view || 'month' // month, week, agenda

    // Calculate date range for the month view
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    // Get calendar events
    const events = await calendarService.getEvents(
      startDate.toISOString(),
      endDate.toISOString()
    )

    // Get summary stats
    const summary = await calendarService.getMonthlySummary(year, month)

    // Get event types for filter
    const eventTypes = calendarService.getEventTypes()

    // Generate sidebar
    const sidebar = await getSidebar('calendar', { user, persona })

    // Generate calendar grid
    const calendarGrid = generateCalendarGrid(year, month, events)

    // Generate canary icon
    const canaryStyles = getCanaryAnimationStyles()
    const pageIcon = wrapIconInContainer(getCalendarIcon())

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Regulatory Calendar - RegCanary</title>
        ${getCommonStyles()}
        <style>
          ${getCalendarStyles()}
          ${canaryStyles}
          .calendar-header-left {
            display: flex;
            align-items: center;
            gap: 16px;
          }
        </style>
      </head>
      <body>
        <div class="app-container">
          ${sidebar}

          <main class="main-content calendar-page">
            <div class="calendar-header">
              <div class="calendar-header-left">
                ${pageIcon}
                <div>
                  <h1 class="calendar-title">Regulatory Calendar</h1>
                  <p class="calendar-subtitle">Track consultations, deadlines, and compliance events</p>
                </div>
              </div>
              <div class="view-toggle">
                <button class="view-toggle-btn ${view === 'month' ? 'active' : ''}" data-view="month">Month</button>
                <button class="view-toggle-btn ${view === 'agenda' ? 'active' : ''}" data-view="agenda">Agenda</button>
              </div>
            </div>

            <!-- Summary Stats -->
            <div class="calendar-summary">
              <div class="summary-card ${summary.byPriority.critical > 0 ? 'critical' : ''}">
                <div class="summary-card-value">${summary.byPriority.critical || 0}</div>
                <div class="summary-card-label">Critical</div>
              </div>
              <div class="summary-card ${summary.byPriority.high > 0 ? 'warning' : ''}">
                <div class="summary-card-value">${summary.byPriority.high || 0}</div>
                <div class="summary-card-label">High Priority</div>
              </div>
              <div class="summary-card">
                <div class="summary-card-value">${summary.byType.consultation || 0}</div>
                <div class="summary-card-label">Consultations</div>
              </div>
              <div class="summary-card">
                <div class="summary-card-value">${summary.total || 0}</div>
                <div class="summary-card-label">Total Events</div>
              </div>
            </div>

            <!-- Filter Bar -->
            <div class="calendar-filter-bar">
              <select class="calendar-filter" id="event-type-filter">
                <option value="">All Event Types</option>
                ${Object.entries(eventTypes).map(([key, config]) =>
                  `<option value="${key}">${config.label}</option>`
                ).join('')}
              </select>
              <select class="calendar-filter" id="priority-filter">
                <option value="">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <button class="export-btn" onclick="exportCalendar()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export iCal
              </button>
            </div>

            <!-- Month Navigation -->
            <div class="month-nav">
              <button class="month-nav-btn" onclick="navigateMonth(-1)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              <span class="month-display">${getMonthName(month)} ${year}</span>
              <button class="month-nav-btn" onclick="navigateMonth(1)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
              <button class="today-btn" onclick="goToToday()">Today</button>
            </div>

            <!-- Calendar Grid (Month View) -->
            <div class="calendar-grid" id="calendar-month-view" style="${view !== 'month' ? 'display:none' : ''}">
              <div class="calendar-weekdays">
                <div class="calendar-weekday">Mon</div>
                <div class="calendar-weekday">Tue</div>
                <div class="calendar-weekday">Wed</div>
                <div class="calendar-weekday">Thu</div>
                <div class="calendar-weekday">Fri</div>
                <div class="calendar-weekday">Sat</div>
                <div class="calendar-weekday">Sun</div>
              </div>
              <div class="calendar-days">
                ${calendarGrid}
              </div>
            </div>

            <!-- Agenda View -->
            <div class="calendar-agenda" id="calendar-agenda-view" style="${view !== 'agenda' ? 'display:none' : ''}">
              ${generateAgendaView(events)}
            </div>
          </main>
        </div>

        <!-- Event Modal -->
        <div class="event-modal-overlay" id="event-modal">
          <div class="event-modal">
            <div class="event-modal-header">
              <h3 class="event-modal-title" id="modal-title">Event Details</h3>
              <button class="event-modal-close" onclick="closeEventModal()">&times;</button>
            </div>
            <div class="event-modal-body" id="modal-body">
              <!-- Populated by JS -->
            </div>
            <div class="event-modal-footer">
              <button class="event-modal-btn secondary" onclick="closeEventModal()">Close</button>
              <a href="#" class="event-modal-btn primary" id="modal-source-link" target="_blank">View Source</a>
            </div>
          </div>
        </div>

        <script>
          // Calendar state
          let currentYear = ${year};
          let currentMonth = ${month};
          let currentView = '${view}';
          const events = ${JSON.stringify(events)};

          // Navigate to different month
          function navigateMonth(delta) {
            currentMonth += delta;
            if (currentMonth > 12) {
              currentMonth = 1;
              currentYear++;
            } else if (currentMonth < 1) {
              currentMonth = 12;
              currentYear--;
            }
            window.location.href = '/regulatory-calendar?year=' + currentYear + '&month=' + currentMonth + '&view=' + currentView;
          }

          // Go to today
          function goToToday() {
            const now = new Date();
            window.location.href = '/regulatory-calendar?year=' + now.getFullYear() + '&month=' + (now.getMonth() + 1) + '&view=' + currentView;
          }

          // Switch view
          document.querySelectorAll('.view-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              const view = btn.dataset.view;
              window.location.href = '/regulatory-calendar?year=' + currentYear + '&month=' + currentMonth + '&view=' + view;
            });
          });

          // Export calendar
          function exportCalendar() {
            const startDate = new Date(currentYear, currentMonth - 1, 1).toISOString();
            const endDate = new Date(currentYear, currentMonth, 0).toISOString();
            window.location.href = '/api/calendar/export/ical?startDate=' + encodeURIComponent(startDate) + '&endDate=' + encodeURIComponent(endDate);
          }

          // Show event modal
          function showEventModal(eventId) {
            const event = events.find(e => e.id === eventId);
            if (!event) return;

            document.getElementById('modal-title').textContent = event.title || 'Event Details';

            const eventDate = new Date(event.eventDate);
            const formattedDate = eventDate.toLocaleDateString('en-GB', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });

            document.getElementById('modal-body').innerHTML = \`
              <div class="event-modal-row">
                <span class="event-modal-label">Date</span>
                <span class="event-modal-value">\${formattedDate}</span>
              </div>
              <div class="event-modal-row">
                <span class="event-modal-label">Type</span>
                <span class="event-modal-value" style="text-transform: capitalize">\${(event.eventType || '').replace(/_/g, ' ')}</span>
              </div>
              <div class="event-modal-row">
                <span class="event-modal-label">Authority</span>
                <span class="event-modal-value">\${event.authority || 'N/A'}</span>
              </div>
              <div class="event-modal-row">
                <span class="event-modal-label">Priority</span>
                <span class="event-modal-value">
                  <span class="priority-badge \${event.priority}">\${event.priority || 'medium'}</span>
                </span>
              </div>
              \${event.description ? \`
                <div class="event-modal-description">\${event.description}</div>
              \` : ''}
            \`;

            const sourceLink = document.getElementById('modal-source-link');
            if (event.url) {
              sourceLink.href = event.url;
              sourceLink.style.display = 'inline-flex';
            } else {
              sourceLink.style.display = 'none';
            }

            document.getElementById('event-modal').classList.add('active');
          }

          // Close event modal
          function closeEventModal() {
            document.getElementById('event-modal').classList.remove('active');
          }

          // Close modal on overlay click
          document.getElementById('event-modal').addEventListener('click', (e) => {
            if (e.target.id === 'event-modal') {
              closeEventModal();
            }
          });

          // Close modal on Escape
          document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
              closeEventModal();
            }
          });

          // Filter events
          document.getElementById('event-type-filter').addEventListener('change', (e) => {
            const type = e.target.value;
            const url = new URL(window.location);
            if (type) {
              url.searchParams.set('eventType', type);
            } else {
              url.searchParams.delete('eventType');
            }
            window.location.href = url.toString();
          });

          document.getElementById('priority-filter').addEventListener('change', (e) => {
            const priority = e.target.value;
            const url = new URL(window.location);
            if (priority) {
              url.searchParams.set('priority', priority);
            } else {
              url.searchParams.delete('priority');
            }
            window.location.href = url.toString();
          });
        </script>
      </body>
      </html>
    `

    res.send(html)
  } catch (err) {
    console.error('Error rendering calendar page:', err)
    res.status(500).send('Error loading calendar')
  }
}

/**
 * Generate calendar grid HTML
 */
function generateCalendarGrid(year, month, events) {
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const daysInMonth = lastDay.getDate()

  // Get day of week for first day (0 = Sunday, convert to Monday = 0)
  let startDayOfWeek = firstDay.getDay() - 1
  if (startDayOfWeek < 0) startDayOfWeek = 6

  // Group events by date
  const eventsByDate = {}
  for (const event of events) {
    if (!event.eventDate) continue
    const dateKey = new Date(event.eventDate).toISOString().split('T')[0]
    if (!eventsByDate[dateKey]) {
      eventsByDate[dateKey] = []
    }
    eventsByDate[dateKey].push(event)
  }

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  let html = ''

  // Add empty cells for days before the 1st
  for (let i = 0; i < startDayOfWeek; i++) {
    const prevMonthDay = new Date(year, month - 1, -startDayOfWeek + i + 1)
    html += `
      <div class="calendar-day other-month">
        <div class="day-number">${prevMonthDay.getDate()}</div>
      </div>
    `
  }

  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const isToday = dateStr === todayStr
    const dayEvents = eventsByDate[dateStr] || []

    const eventsHtml = dayEvents.slice(0, 3).map(event => {
      const tooltipText = `${escapeHtml(event.title || 'Untitled Event')}\n${formatEventType(event.eventType || event.sourceType)} • ${event.authority || 'Unknown'}\n${event.priority || 'medium'} priority`
      return `
      <div class="calendar-event ${event.eventType || event.sourceType}" onclick="showEventModal('${event.id}')" title="${tooltipText}">
        ${escapeHtml(truncate(event.title, 25))}
      </div>
    `
    }).join('')

    const moreCount = dayEvents.length - 3
    const moreHtml = moreCount > 0
      ? `<div class="more-events">+${moreCount} more</div>`
      : ''

    html += `
      <div class="calendar-day ${isToday ? 'today' : ''}">
        <div class="day-number">${day}</div>
        <div class="day-events">
          ${eventsHtml}
          ${moreHtml}
        </div>
      </div>
    `
  }

  // Add empty cells for remaining days
  const totalCells = startDayOfWeek + daysInMonth
  const remainingCells = (7 - (totalCells % 7)) % 7
  for (let i = 1; i <= remainingCells; i++) {
    html += `
      <div class="calendar-day other-month">
        <div class="day-number">${i}</div>
      </div>
    `
  }

  return html
}

/**
 * Generate agenda view HTML
 */
function generateAgendaView(events) {
  if (!events || events.length === 0) {
    return `
      <div class="calendar-empty">
        <div class="calendar-empty-icon">📅</div>
        <div class="calendar-empty-title">No events this month</div>
        <p>There are no regulatory events scheduled for this period.</p>
      </div>
    `
  }

  // Group events by date
  const eventsByDate = {}
  for (const event of events) {
    if (!event.eventDate) continue
    const dateKey = new Date(event.eventDate).toISOString().split('T')[0]
    if (!eventsByDate[dateKey]) {
      eventsByDate[dateKey] = []
    }
    eventsByDate[dateKey].push(event)
  }

  // Sort dates
  const sortedDates = Object.keys(eventsByDate).sort()

  return sortedDates.map(dateKey => {
    const date = new Date(dateKey)
    const dayEvents = eventsByDate[dateKey]

    const eventsHtml = dayEvents.map(event => {
      const tooltipText = `${escapeHtml(event.title || 'Untitled Event')}\n${formatEventType(event.eventType || event.sourceType)} • ${event.authority || 'Unknown'}\n${event.priority || 'medium'} priority`
      return `
      <div class="agenda-event" onclick="showEventModal('${event.id}')" title="${tooltipText}">
        <div class="agenda-event-type" style="background: ${getEventColor(event.eventType)}"></div>
        <div class="agenda-event-content">
          <div class="agenda-event-title">${escapeHtml(event.title)}</div>
          <div class="agenda-event-meta">
            <span>${formatEventType(event.eventType)}</span>
            <span>${event.authority || ''}</span>
            <span class="priority-badge ${event.priority}">${event.priority}</span>
          </div>
        </div>
      </div>
    `
    }).join('')

    return `
      <div class="agenda-day">
        <div class="agenda-date">
          <span class="agenda-date-day">${date.getDate()}</span>
          <div>
            <div>${date.toLocaleDateString('en-GB', { weekday: 'long' })}</div>
            <div class="agenda-date-info">${date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</div>
          </div>
        </div>
        <div class="agenda-events">
          ${eventsHtml}
        </div>
      </div>
    `
  }).join('')
}

/**
 * Get event color by type
 */
function getEventColor(type) {
  const colors = {
    deadline: '#EF4444',
    consultation: '#3B82F6',
    implementation: '#10B981',
    policy_review: '#8B5CF6',
    alert: '#F59E0B',
    compliance_event: '#EC4899',
    regulatory_change: '#6366F1'
  }
  return colors[type] || '#6B7280'
}

/**
 * Format event type for display
 */
function formatEventType(type) {
  const labels = {
    deadline: 'Deadline',
    consultation: 'Consultation',
    implementation: 'Implementation',
    policy_review: 'Policy Review',
    alert: 'Alert',
    compliance_event: 'Compliance',
    regulatory_change: 'Reg Change'
  }
  return labels[type] || type || 'Event'
}

/**
 * Get month name
 */
function getMonthName(month) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return months[month - 1]
}

/**
 * Truncate text
 */
function truncate(str, length) {
  if (!str) return ''
  if (str.length <= length) return str
  return str.substring(0, length) + '...'
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
  if (!text) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

module.exports = renderCalendarPage
