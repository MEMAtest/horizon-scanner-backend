function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function normalizeDateValue(update) {
  const value = update?.compliance_deadline || update?.complianceDeadline || update?.deadline
  if (!value) return null
  const parsed = new Date(value)
  return isNaN(parsed) ? null : parsed
}

function getPublishedDate(update) {
  const value = update?.publishedDate || update?.published_date || update?.fetchedDate || update?.createdAt
  if (!value) return null
  const parsed = new Date(value)
  return isNaN(parsed) ? null : parsed
}

function isEnforcementUpdate(update) {
  const text = `${(update.headline || '').toLowerCase()} ${(update.summary || update.ai_summary || update.impact || '').toLowerCase()}`
  const keywords = ['enforcement', 'penalty', 'sanction', 'fined', 'warning notice', 'final notice', 'disciplinary']
  return keywords.some(keyword => text.includes(keyword))
}

function isConsultationUpdate(update) {
  const text = `${(update.headline || '').toLowerCase()} ${(update.summary || update.ai_summary || update.impact || '').toLowerCase()}`
  return text.includes('consultation') || text.includes('call for input') || text.includes('feedback statement')
}

function formatDate(date) {
  if (!(date instanceof Date) || isNaN(date)) return 'TBD'
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

module.exports = {
  escapeHtml,
  normalizeDateValue,
  getPublishedDate,
  isEnforcementUpdate,
  isConsultationUpdate,
  formatDate
}
