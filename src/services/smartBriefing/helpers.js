function impactPriority(value) {
  const normalized = (value || '').toString().toLowerCase()
  if (normalized.includes('significant') || normalized.includes('high')) return 3
  if (normalized.includes('moderate') || normalized.includes('medium')) return 2
  return 1
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function parseDate(value) {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function truncateText(value, limit = 220) {
  if (!value) return ''
  const trimmed = value.trim()
  if (trimmed.length <= limit) return trimmed
  return `${trimmed.slice(0, limit - 1).trim()}…`
}

function buildList(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return '<ul><li>No items available.</li></ul>'
  }
  return `<ul>${items.join('')}</ul>`
}

module.exports = {
  buildList,
  escapeHtml,
  impactPriority,
  parseDate,
  toNumber,
  truncateText
}
