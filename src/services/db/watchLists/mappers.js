function toIso(value) {
  if (!value) return null
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString()
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function normalizeWatchList(row) {
  if (!row) return null
  const alertOnMatch = row.alert_on_match !== false
  const alertThreshold = Number.parseFloat(row.alert_threshold)
  const normalizedThreshold = Number.isFinite(alertThreshold) ? alertThreshold : 0.5
  const autoAddToDossier = row.auto_add_to_dossier === true
  const targetDossierId = row.target_dossier_id || null
  const unreviewedCount = parseInt(row.unreviewed_count) || 0
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description || null,
    keywords: Array.isArray(row.keywords) ? row.keywords : [],
    authorities: Array.isArray(row.authorities) ? row.authorities : [],
    sectors: Array.isArray(row.sectors) ? row.sectors : [],
    isActive: row.is_active !== false,
    matchCount: parseInt(row.match_count) || 0,
    unreviewedCount,
    unreviewed_count: unreviewedCount,
    alertOnMatch,
    alert_on_match: alertOnMatch,
    alertThreshold: normalizedThreshold,
    alert_threshold: normalizedThreshold,
    autoAddToDossier,
    auto_add_to_dossier: autoAddToDossier,
    targetDossierId,
    target_dossier_id: targetDossierId,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  }
}

function normalizeWatchListMatch(row) {
  if (!row) return null
  const watchListId = row.watch_list_id || row.watchListId
  const regulatoryUpdateId = row.regulatory_update_id || row.regulatoryUpdateId
  const matchScore = parseFloat(row.match_score ?? row.matchScore) || 0
  const matchReasons = row.match_reasons || row.matchReasons || {}
  const dismissed = row.dismissed === true
  const reviewed = row.reviewed === true
  const matchedAt = toIso(row.created_at || row.createdAt)
  const reviewedAt = toIso(row.reviewed_at || row.reviewedAt)
  const update = row.headline ? {
    id: regulatoryUpdateId,
    headline: row.headline,
    summary: row.summary || row.ai_summary,
    authority: row.authority,
    sector: row.sector,
    impactLevel: row.impact_level,
    publishedDate: toIso(row.published_date),
    url: row.url
  } : row.update || null
  return {
    id: row.id,
    watchListId,
    watch_list_id: watchListId,
    regulatoryUpdateId,
    regulatory_update_id: regulatoryUpdateId,
    matchScore,
    match_score: matchScore,
    matchReasons,
    match_reasons: matchReasons,
    dismissed,
    reviewed,
    reviewedAt,
    reviewed_at: reviewedAt,
    matched_at: matchedAt,
    createdAt: matchedAt,
    update,
    update_title: update ? update.headline : null,
    update_source: update ? update.authority : null,
    update_url: update ? update.url : null
  }
}

module.exports = {
  normalizeWatchList,
  normalizeWatchListMatch,
  toIso
}
