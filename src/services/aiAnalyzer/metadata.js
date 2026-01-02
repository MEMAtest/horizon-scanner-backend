function applyMetadataMethods(ServiceClass) {
  ServiceClass.prototype.buildAnalysisMetadata = function(update = {}) {
    const authority = update.authority || update.sourceAuthority || update.regulator
    const publishedDate = update.publishedDate || update.published_date || update.pubDate || update.date
    const country = update.country || update.raw_data?.country || update.raw_data?.international?.country
    const requiresTranslation = update.requiresTranslation ||
      update.raw_data?.requiresTranslation ||
      update.raw_data?.international?.requiresTranslation ||
      false

    return {
      authority: authority || 'Unknown',
      publishedDate: publishedDate ? new Date(publishedDate).toISOString() : undefined,
      country: country || undefined,
      requiresTranslation: requiresTranslation
    }
  }

  ServiceClass.prototype.extractContentForAnalysis = function(update = {}, metadata = {}) {
    const contentPieces = []

    const appendText = value => {
      if (!value) return
      if (Array.isArray(value)) {
        value.forEach(item => appendText(item))
        return
      }
      if (typeof value === 'object') {
        Object.values(value).forEach(inner => appendText(inner))
        return
      }
      if (typeof value === 'string') {
        const trimmed = value.trim()
        if (trimmed.length > 0) {
          contentPieces.push(trimmed)
        }
      }
    }

    appendText(update.headline || update.title)
    appendText(update.summary || update.description || update.excerpt)
    appendText(update.content || update.fullText || update.body || update.text)
    appendText(update.articleBody || update.bodyText || update.markdown)
    appendText(update.ai_summary)

    if (update.enrichment) {
      appendText(update.enrichment.content || update.enrichment.cleanContent)
      appendText(update.enrichment.fullText || update.enrichment.summary)
    }

    if (update.raw_data) {
      appendText(update.raw_data.content || update.raw_data.summary)
    }

    if (contentPieces.length === 0 && metadata.authority) {
      contentPieces.push(`${metadata.authority} regulatory publication: ${update.url}`)
    }

    const combined = contentPieces.join('\n').trim()
    if (combined.length === 0) return ''

    const MAX_LENGTH = 6000
    return combined.length > MAX_LENGTH ? combined.substring(0, MAX_LENGTH) : combined
  }
}

module.exports = applyMetadataMethods
