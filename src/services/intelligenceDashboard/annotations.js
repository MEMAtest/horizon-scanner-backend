const { toTimestamp } = require('./dates')
const { normalizeUrgency } = require('./updates')

function countOutstandingTasks(annotations) {
  if (!Array.isArray(annotations)) return 0
  const targetStatuses = new Set(['action_required', 'assigned', 'triage'])
  return annotations.filter(note => targetStatuses.has(note.status)).length
}

function summarizeAnnotationsList(annotations) {
  if (!Array.isArray(annotations)) {
    return { total: 0, tasks: 0, flagged: 0 }
  }
  const total = annotations.length
  const tasks = countOutstandingTasks(annotations)
  const flagged = annotations.filter(note => note.status === 'flagged').length
  return { total, tasks, flagged }
}

function buildTimelineEntries(updates, referenceDate) {
  const horizonDays = 30
  const endWindow = new Date(referenceDate)
  endWindow.setDate(endWindow.getDate() + horizonDays)

  return updates
    .map(update => {
      const rawDeadline = update.compliance_deadline || update.complianceDeadline
      if (!rawDeadline) return null
      const deadline = new Date(rawDeadline)
      if (Number.isNaN(deadline.getTime())) return null
      if (deadline < referenceDate || deadline > endWindow) return null

      return {
        date: deadline.toISOString(),
        type: 'deadline',
        title: update.headline || 'Compliance deadline',
        authority: update.authority || 'Unknown',
        urgency: normalizeUrgency(update.urgency)
      }
    })
    .filter(Boolean)
    .sort((a, b) => toTimestamp(a.date) - toTimestamp(b.date))
}

module.exports = {
  countOutstandingTasks,
  summarizeAnnotationsList,
  buildTimelineEntries
}
