const decodeHtmlEntities = (value = '') => {
  if (!value) return ''
  return String(value)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/gi, (match, dec) => String.fromCharCode(dec))
}

const stripHtml = (value = '') => {
  if (!value) return ''
  const decodedOnce = decodeHtmlEntities(value)
  const withoutTags = decodedOnce.replace(/<[^>]*>/g, ' ')
  const decodedTwice = decodeHtmlEntities(withoutTags)
  return decodedTwice.replace(/\s+/g, ' ').trim()
}

const isFallbackSummary = (summary, title = '') => {
  const cleaned = stripHtml(summary)
  if (!cleaned) return true

  const normalized = cleaned.toLowerCase().trim()
  const normalizedTitle = (title || '').toLowerCase().trim()

  if (normalizedTitle && normalizedTitle.length > 20) {
    const titlePrefix = normalizedTitle.substring(0, Math.min(50, normalizedTitle.length))
    if (normalized.startsWith(titlePrefix) || normalized === normalizedTitle) {
      return true
    }
  }

  return (
    normalized.startsWith('informational regulatory update:') ||
    normalized.startsWith('significant regulatory development') ||
    normalized.startsWith('regulatory update:') ||
    normalized.startsWith('regulatory impact overview:') ||
    normalized.startsWith('regulatory update impacting') ||
    normalized === 'summary not available' ||
    normalized === 'no summary available' ||
    normalized.includes('summary not available') ||
    normalized.includes('no summary available') ||
    normalized.length < 30
  )
}

const selectSummary = (update = {}) => {
  const title = update.headline || update.title || ''
  const candidates = [
    update.ai_summary,
    update.aiSummary,
    update.summary,
    update.description,
    update.details,
    update.detail,
    update.body,
    update.content,
    update.excerpt,
    update.ai_summary_full,
    update.ai_summary_long,
    update.ai_summary_extended,
    update.impact
  ]

  for (const candidate of candidates) {
    if (!candidate) continue
    const cleaned = stripHtml(candidate)
    if (cleaned && !isFallbackSummary(cleaned, title)) {
      return cleaned
    }
  }

  return ''
}

module.exports = {
  decodeHtmlEntities,
  isFallbackSummary,
  selectSummary,
  stripHtml
}
