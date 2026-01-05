const crypto = require('crypto')

const DEFAULT_BOOKMARK_COLLECTIONS = [
  { id: 'personal', name: 'Personal', isSystem: true },
  { id: 'professional', name: 'Professional', isSystem: true }
]

const TOPIC_AREA_RULES = [
  { topicArea: 'Consumer Duty', keywords: ['consumer duty', 'fair value', 'vulnerable customer', 'retail customer'] },
  { topicArea: 'Operational Resilience', keywords: ['operational resilience', 'resilience', 'incident', 'outage', 'cyber', 'ict', 'dora'] },
  { topicArea: 'Financial Crime / AML', keywords: ['anti-money laundering', 'money laundering', 'aml', 'terrorist financing', 'financial crime', 'fincrime'] },
  { topicArea: 'Sanctions', keywords: ['sanctions', 'ofsi', 'financial sanctions', 'ukraine', 'russia', 'iran', 'north korea'] },
  { topicArea: 'Capital & Liquidity', keywords: ['basel', 'capital requirements', 'capital', 'liquidity', 'crd', 'crr', 'icaap', 'pillar', 'lcr', 'nsfr'] },
  { topicArea: 'Conduct & Market Abuse', keywords: ['market abuse', 'mar', 'insider dealing', 'conduct', 'mis-selling', 'product governance'] },
  { topicArea: 'Payments', keywords: ['payments', 'payment', 'psr', 'psd', 'open banking', 'faster payments'] },
  { topicArea: 'Data Protection', keywords: ['gdpr', 'data protection', 'privacy', 'personal data'] },
  { topicArea: 'ESG / Sustainability', keywords: ['esg', 'sustainability', 'climate', 'greenwashing', 'tcfd', 'transition plan'] }
]

function normalizeTopicArea(value) {
  if (value == null) return ''
  const trimmed = String(value).trim()
  if (!trimmed) return ''
  const lowered = trimmed.toLowerCase()
  if (lowered === 'uncategorized' || lowered === 'uncategorised') {
    return 'Other'
  }
  return trimmed
}

function inferTopicArea({ title = '', summary = '', authority = '', sectors = [] } = {}) {
  const haystack = [
    title,
    summary,
    authority,
    ...(Array.isArray(sectors) ? sectors : [])
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (!haystack) return null

  for (const rule of TOPIC_AREA_RULES) {
    if (!rule || !rule.topicArea || !Array.isArray(rule.keywords)) continue
    if (rule.keywords.some(keyword => keyword && haystack.includes(String(keyword).toLowerCase()))) {
      return rule.topicArea
    }
  }

  return null
}

function ensurePinnedItemTopicArea(item) {
  if (!item || typeof item !== 'object') return item
  const metadata = item.metadata && typeof item.metadata === 'object' ? { ...item.metadata } : {}
  const existing = normalizeTopicArea(metadata.topicArea || metadata.topic_area || metadata.topic)
  if (existing) {
    metadata.topicArea = existing
  } else {
    const inferred = inferTopicArea({
      title: item.update_title || '',
      summary: metadata.summary || '',
      authority: item.update_authority || '',
      sectors: Array.isArray(item.sectors) ? item.sectors : metadata.sectors
    })
    metadata.topicArea = inferred || 'Other'
  }
  delete metadata.topic_area
  delete metadata.topic
  return { ...item, metadata }
}

function ensureBookmarkCollections(rawCollections) {
  const collections = Array.isArray(rawCollections) ? rawCollections : []
  const byId = new Map()

  for (const entry of collections) {
    if (!entry || typeof entry !== 'object') continue
    const id = entry.id != null ? String(entry.id).trim() : ''
    const name = entry.name != null ? String(entry.name).trim() : ''
    if (!id || !name) continue
    byId.set(id, {
      id,
      name,
      isSystem: entry.isSystem === true || entry.is_system === true
    })
  }

  for (const fallback of DEFAULT_BOOKMARK_COLLECTIONS) {
    if (!byId.has(fallback.id)) {
      byId.set(fallback.id, { ...fallback })
    }
  }

  const ordered = []
  for (const fallback of DEFAULT_BOOKMARK_COLLECTIONS) {
    const value = byId.get(fallback.id)
    if (value) ordered.push(value)
  }

  for (const [id, value] of byId.entries()) {
    if (DEFAULT_BOOKMARK_COLLECTIONS.some(item => item.id === id)) continue
    ordered.push(value)
  }

  return ordered
}

function getDefaultBookmarkCollectionId(collections) {
  const normalized = ensureBookmarkCollections(collections)
  const personal = normalized.find(collection => collection.id === 'personal')
  return personal ? personal.id : (normalized[0]?.id || 'personal')
}

function createBookmarkCollectionId() {
  if (crypto.randomUUID) return crypto.randomUUID()
  return `collection-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const createDefaultWorkspaceState = () => ({
  savedSearches: [],
  customAlerts: [],
  pinnedItems: [],
  firmProfile: null,
  bookmarkCollections: ensureBookmarkCollections()
})

const parseWorkspaceState = raw => {
  if (!raw || !raw.trim()) {
    return createDefaultWorkspaceState()
  }

  try {
    const data = JSON.parse(raw)
    return {
      savedSearches: Array.isArray(data.savedSearches) ? data.savedSearches : [],
      customAlerts: Array.isArray(data.customAlerts) ? data.customAlerts : [],
      pinnedItems: Array.isArray(data.pinnedItems) ? data.pinnedItems : [],
      firmProfile: data.firmProfile || null,
      bookmarkCollections: ensureBookmarkCollections(data.bookmarkCollections || data.bookmark_collections)
    }
  } catch (error) {
    console.warn('[workspace] Invalid JSON cache, resetting workspace data:', error.message)
    return createDefaultWorkspaceState()
  }
}

module.exports = {
  DEFAULT_BOOKMARK_COLLECTIONS,
  TOPIC_AREA_RULES,
  createBookmarkCollectionId,
  createDefaultWorkspaceState,
  ensureBookmarkCollections,
  ensurePinnedItemTopicArea,
  getDefaultBookmarkCollectionId,
  inferTopicArea,
  normalizeTopicArea,
  parseWorkspaceState
}
