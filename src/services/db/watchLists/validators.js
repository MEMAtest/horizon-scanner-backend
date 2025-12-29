function normalizeText(value) {
  if (!value) return ''
  return String(value).trim().toLowerCase().replace(/\s+/g, ' ')
}

function normalizeCompact(value) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, '')
}

const AUTHORITY_ALIASES = {
  fca: ['fca', 'financial conduct authority'],
  pra: ['pra', 'prudential regulation authority'],
  boe: ['bank of england', 'boe'],
  ecb: ['ecb', 'european central bank'],
  eba: ['eba', 'european banking authority'],
  esma: ['esma', 'european securities and markets authority'],
  eiopa: ['eiopa', 'european insurance and occupational pensions authority'],
  hmt: ['hm treasury', 'hmt', 'treasury', 'his majesty treasury'],
  ico: ['ico', "information commissioner's office", 'information commissioners office', 'information commissioner'],
  cma: ['cma', 'competition and markets authority', 'competition & markets authority'],
  sec: ['sec', 'securities and exchange commission'],
  cftc: ['cftc', 'commodity futures trading commission'],
  finra: ['finra', 'financial industry regulatory authority'],
  fatf: ['fatf', 'financial action task force'],
  fsb: ['fsb', 'financial stability board'],
  tpr: ['tpr', 'the pensions regulator', 'pensions regulator'],
  frc: ['frc', 'financial reporting council'],
  fos: ['fos', 'financial ombudsman service'],
  jmlsg: ['jmlsg', 'joint money laundering steering group'],
  sfo: ['sfo', 'serious fraud office'],
  hmg: ['hm government', 'uk government', 'his majesty government']
}

const AUTHORITY_ALIAS_LOOKUP = (() => {
  const lookup = new Map()
  for (const [canonical, variants] of Object.entries(AUTHORITY_ALIASES)) {
    for (const variant of variants) {
      const normalized = normalizeText(variant)
      const compact = normalizeCompact(variant)
      if (normalized) lookup.set(normalized, canonical)
      if (compact) lookup.set(compact, canonical)
    }
  }
  return lookup
})()

function getAuthorityKeys(value) {
  const normalized = normalizeText(value)
  const compact = normalizeCompact(value)
  const canonical = AUTHORITY_ALIAS_LOOKUP.get(normalized) || AUTHORITY_ALIAS_LOOKUP.get(compact) || null
  const keys = new Set()
  if (normalized) keys.add(normalized)
  if (compact) keys.add(compact)
  if (canonical) keys.add(canonical)
  return keys
}

function authorityMatches(watchAuthority, updateAuthority) {
  const watchKeys = getAuthorityKeys(watchAuthority)
  const updateKeys = getAuthorityKeys(updateAuthority)

  for (const key of watchKeys) {
    if (updateKeys.has(key)) return true
  }

  const watchNormalized = normalizeText(watchAuthority)
  const updateNormalized = normalizeText(updateAuthority)
  if (!watchNormalized || !updateNormalized) return false
  return updateNormalized.includes(watchNormalized) || watchNormalized.includes(updateNormalized)
}

function extractUpdateSectors(update) {
  const sectors = []
  const addValue = value => {
    if (!value) return
    if (Array.isArray(value)) {
      value.forEach(addValue)
      return
    }
    const normalized = normalizeText(value)
    if (normalized) sectors.push(normalized)
  }

  addValue(update.sector)
  addValue(update.primarySectors)
  addValue(update.primary_sectors)
  addValue(update.firmTypesAffected)
  addValue(update.firm_types_affected)
  addValue(update.sectors)

  return Array.from(new Set(sectors))
}

function sectorMatches(watchSector, updateSectors) {
  const watchNormalized = normalizeText(watchSector)
  if (!watchNormalized) return false
  for (const updateSector of updateSectors) {
    if (!updateSector) continue
    if (updateSector === watchNormalized) return true
    if (updateSector.includes(watchNormalized) || watchNormalized.includes(updateSector)) return true
  }
  return false
}

function calculateMatchScore(watchList, update) {
  const keywords = Array.isArray(watchList.keywords)
    ? watchList.keywords.filter(Boolean)
    : []
  const authorities = Array.isArray(watchList.authorities)
    ? watchList.authorities.filter(Boolean)
    : []
  const sectors = Array.isArray(watchList.sectors)
    ? watchList.sectors.filter(Boolean)
    : []

  const hasKeywords = keywords.length > 0
  const hasAuthorities = authorities.length > 0
  const hasSectors = sectors.length > 0

  if (!hasKeywords && !hasAuthorities && !hasSectors) {
    return { score: 0, reasons: { warning: 'No watch list criteria configured' } }
  }

  const baseWeights = {
    keywords: 0.4,
    authorities: 0.3,
    sectors: 0.3
  }

  const activeWeightSum = (hasKeywords ? baseWeights.keywords : 0) +
    (hasAuthorities ? baseWeights.authorities : 0) +
    (hasSectors ? baseWeights.sectors : 0)

  const weights = {
    keywords: hasKeywords ? baseWeights.keywords / activeWeightSum : 0,
    authorities: hasAuthorities ? baseWeights.authorities / activeWeightSum : 0,
    sectors: hasSectors ? baseWeights.sectors / activeWeightSum : 0
  }

  // Keyword matching
  const headline = update.headline || update.title || update.update_title || ''
  const summary = update.summary || ''
  const aiSummary = update.ai_summary || update.aiSummary || ''
  const text = normalizeText(`${headline} ${summary} ${aiSummary}`)
  const matchedKeywords = hasKeywords
    ? keywords.filter(keyword => {
      const normalized = normalizeText(keyword)
      return normalized && text.includes(normalized)
    })
    : []

  const keywordScore = hasKeywords
    ? matchedKeywords.length === 0
      ? 0
      : Math.min(matchedKeywords.length / Math.min(keywords.length, 2), 1)
    : 0

  // Authority matching (with alias support)
  const updateAuthority = update.authority || ''
  const matchedAuthorities = hasAuthorities
    ? authorities.filter(authority => authorityMatches(authority, updateAuthority))
    : []

  const authorityScore = hasAuthorities ? (matchedAuthorities.length > 0 ? 1 : 0) : 0

  // Sector matching (supports arrays like firm_types_affected / primarySectors)
  const updateSectors = extractUpdateSectors(update)
  const matchedSectors = hasSectors
    ? sectors.filter(sector => sectorMatches(sector, updateSectors))
    : []

  const sectorScore = hasSectors ? (matchedSectors.length > 0 ? 1 : 0) : 0

  const score = Math.min(
    (keywordScore * weights.keywords) +
      (authorityScore * weights.authorities) +
      (sectorScore * weights.sectors),
    1
  )

  return {
    score,
    reasons: {
      matched: {
        keywords: matchedKeywords,
        authorities: matchedAuthorities,
        sectors: matchedSectors
      },
      update: {
        authority: update.authority || null,
        sectors: updateSectors
      },
      breakdown: {
        keywords: { weight: weights.keywords, score: keywordScore, configured: keywords.length },
        authorities: { weight: weights.authorities, score: authorityScore, configured: authorities.length },
        sectors: { weight: weights.sectors, score: sectorScore, configured: sectors.length }
      }
    }
  }
}

module.exports = {
  authorityMatches,
  calculateMatchScore,
  extractUpdateSectors,
  normalizeText,
  normalizeCompact,
  sectorMatches
}
