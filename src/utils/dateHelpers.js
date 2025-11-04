const DEFAULT_DISPLAY_OPTIONS = { day: 'numeric', month: 'short', year: 'numeric' }

function normalizeDate(value) {
  if (!value) return null
  if (value instanceof Date) {
    return isNaN(value) ? null : value
  }
  const parsed = new Date(value)
  return isNaN(parsed) ? null : parsed
}

function formatDateDisplay(value, options = DEFAULT_DISPLAY_OPTIONS) {
  const date = normalizeDate(value)
  if (!date) return 'Unknown'
  return date.toLocaleDateString('en-GB', options)
}

module.exports = {
  normalizeDate,
  formatDateDisplay
}
