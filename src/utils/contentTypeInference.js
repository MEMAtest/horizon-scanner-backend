const VALID_CONTENT_TYPES = [
  'Dear CEO Letter',
  'Supervisory Statement',
  'Policy Statement',
  'Speech',
  'Consultation',
  'Final Rule',
  'Guidance',
  'Enforcement Action',
  'Statistical Report',
  'Market Notice',
  'Press Release',
  'Research Paper',
  'Event',
  'Other'
]

const CONTENT_TYPE_ALIASES = new Map([
  ['dear ceo', 'Dear CEO Letter'],
  ['dear ceo letter', 'Dear CEO Letter'],
  ['dear ceo letters', 'Dear CEO Letter'],
  ['dear chief executive letter', 'Dear CEO Letter'],
  ['dear chief executive letters', 'Dear CEO Letter'],
  ['supervisory statement', 'Supervisory Statement'],
  ['supervisory statements', 'Supervisory Statement'],
  ['supervisory statement letter', 'Supervisory Statement'],
  ['policy statement', 'Policy Statement'],
  ['policy statements', 'Policy Statement'],
  ['ps', 'Policy Statement'],
  ['speech', 'Speech'],
  ['speeches', 'Speech'],
  ['remarks', 'Speech'],
  ['consultation', 'Consultation'],
  ['consultation paper', 'Consultation'],
  ['consultation papers', 'Consultation'],
  ['consultation document', 'Consultation'],
  ['discussion paper', 'Consultation'],
  ['request for comment', 'Consultation'],
  ['call for evidence', 'Consultation'],
  ['final rule', 'Final Rule'],
  ['final rules', 'Final Rule'],
  ['rulemaking', 'Final Rule'],
  ['final regulation', 'Final Rule'],
  ['guidance', 'Guidance'],
  ['guideline', 'Guidance'],
  ['guidelines', 'Guidance'],
  ['circular', 'Guidance'],
  ['directive', 'Guidance'],
  ['enforcement action', 'Enforcement Action'],
  ['enforcement actions', 'Enforcement Action'],
  ['enforcement', 'Enforcement Action'],
  ['penalty', 'Enforcement Action'],
  ['penalties', 'Enforcement Action'],
  ['fine', 'Enforcement Action'],
  ['fines', 'Enforcement Action'],
  ['sanction', 'Enforcement Action'],
  ['sanctions', 'Enforcement Action'],
  ['statistical report', 'Statistical Report'],
  ['statistics', 'Statistical Report'],
  ['statistical bulletin', 'Statistical Report'],
  ['data release', 'Statistical Report'],
  ['survey results', 'Statistical Report'],
  ['market notice', 'Market Notice'],
  ['market bulletin', 'Market Notice'],
  ['warning', 'Market Notice'],
  ['warnings', 'Market Notice'],
  ['alert', 'Market Notice'],
  ['alerts', 'Market Notice'],
  ['press release', 'Press Release'],
  ['press releases', 'Press Release'],
  ['press statement', 'Press Release'],
  ['media release', 'Press Release'],
  ['news release', 'Press Release'],
  ['announcement', 'Press Release'],
  ['research paper', 'Research Paper'],
  ['research report', 'Research Paper'],
  ['working paper', 'Research Paper'],
  ['study', 'Research Paper'],
  ['report', 'Research Paper'],
  ['event', 'Event'],
  ['webinar', 'Event'],
  ['conference', 'Event'],
  ['seminar', 'Event'],
  ['roundtable', 'Event'],
  ['summit', 'Event'],
  ['other', 'Other'],
  ['info', 'Other'],
  ['information', 'Other'],
  ['general', 'Other'],
  ['misc', 'Other'],
  ['miscellaneous', 'Other']
])

const TAG_TYPE_MAP = new Map([
  ['type:consultation', 'Consultation'],
  ['type:final-rule', 'Final Rule'],
  ['type:final_rule', 'Final Rule'],
  ['type:finalrule', 'Final Rule'],
  ['type:guidance', 'Guidance'],
  ['type:enforcement', 'Enforcement Action'],
  ['type:speech', 'Speech'],
  ['type:policy', 'Policy Statement'],
  ['type:policy-statement', 'Policy Statement'],
  ['type:supervisory-statement', 'Supervisory Statement'],
  ['type:dear-ceo-letter', 'Dear CEO Letter'],
  ['type:press-release', 'Press Release'],
  ['type:market-notice', 'Market Notice'],
  ['type:research-paper', 'Research Paper'],
  ['type:statistical-report', 'Statistical Report'],
  ['type:event', 'Event'],
  ['has:penalty', 'Enforcement Action']
])

const TEXT_RULES = [
  { type: 'Dear CEO Letter', terms: ['dear ceo', 'dear chief executive'] },
  { type: 'Supervisory Statement', terms: ['supervisory statement'] },
  { type: 'Policy Statement', terms: ['policy statement'] },
  { type: 'Enforcement Action', terms: ['enforcement action', 'enforcement', 'penalty', 'fine', 'sanction', 'settlement', 'disciplinary action', 'censure', 'prohibition order', 'cease and desist'] },
  { type: 'Final Rule', terms: ['final rule', 'final rules', 'rulemaking', 'final regulation', 'adopted rule', 'adopted regulation'] },
  { type: 'Consultation', terms: ['consultation', 'discussion paper', 'request for comment', 'call for evidence', 'feedback statement'] },
  { type: 'Guidance', terms: ['guidance', 'guideline', 'guidelines', 'circular', 'directive', 'supervisory guidance', 'interpretive notice'] },
  { type: 'Market Notice', terms: ['market notice', 'market bulletin', 'warning', 'warns', 'alert', 'consumer warning', 'public warning'] },
  { type: 'Statistical Report', terms: ['statistical report', 'statistics', 'statistical bulletin', 'data release', 'survey results', 'annual report', 'quarterly report', 'monthly report'] },
  { type: 'Speech', terms: ['speech', 'remarks', 'keynote', 'address', 'fireside', 'opening remarks', 'interview', 'hearing', 'testimony'] },
  { type: 'Press Release', terms: ['press release', 'news release', 'media release', 'press statement', 'announcement', 'monetary policy decision'] },
  { type: 'Research Paper', terms: ['research paper', 'working paper', 'research report', 'research study', 'impact assessment', 'white paper', 'study', 'report'] },
  { type: 'Event', terms: ['webinar', 'conference', 'event', 'workshop', 'roundtable', 'seminar', 'summit'] }
]

const URL_RULES = [
  { type: 'Dear CEO Letter', terms: ['dear-ceo', 'dear_ceo', 'dearceo'] },
  { type: 'Supervisory Statement', terms: ['supervisory-statement', 'supervisory_statement'] },
  { type: 'Policy Statement', terms: ['policy-statement', 'policy_statement'] },
  { type: 'Enforcement Action', terms: ['enforcement', 'penalty', 'sanction', 'fine'] },
  { type: 'Final Rule', terms: ['final-rule', 'final_rule', 'rulemaking'] },
  { type: 'Consultation', terms: ['consultation', 'consultations'] },
  { type: 'Guidance', terms: ['guidance', 'guideline'] },
  { type: 'Market Notice', terms: ['market-notice', 'market_notice'] },
  { type: 'Statistical Report', terms: ['statistics', 'statistical', '/data'] },
  { type: 'Speech', terms: ['/speech', '/speeches', '/remarks', '/press/key', '/press/inter'] },
  { type: 'Press Release', terms: ['press-release', 'press_release', 'media-release', 'news-release', '/press/pr', '/news/', '/press/govcdec'] },
  { type: 'Research Paper', terms: ['research', 'publication', 'working-paper', 'working_paper'] },
  { type: 'Event', terms: ['webinar', 'conference', 'event', 'workshop', 'seminar'] }
]

function normalizeKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/[^\w\s]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeContentType(value) {
  if (!value) return ''
  const key = normalizeKey(value)
  if (!key) return ''

  const direct = VALID_CONTENT_TYPES.find(type => type.toLowerCase() === key)
  if (direct) return direct

  if (CONTENT_TYPE_ALIASES.has(key)) {
    return CONTENT_TYPE_ALIASES.get(key)
  }

  return ''
}

function normalizeTagList(tags) {
  if (!tags) return []
  if (Array.isArray(tags)) {
    return tags.map(tag => String(tag || '').toLowerCase().trim()).filter(Boolean)
  }
  if (typeof tags === 'string') {
    return tags.split(',').map(tag => tag.toLowerCase().trim()).filter(Boolean)
  }
  return []
}

function inferFromTags(tags) {
  const tagList = normalizeTagList(tags)
  for (const tag of tagList) {
    if (TAG_TYPE_MAP.has(tag)) {
      return TAG_TYPE_MAP.get(tag)
    }
    if (tag.startsWith('type:')) {
      const normalized = tag.replace('type:', '').replace(/_/g, '-')
      if (normalized.includes('consult')) return 'Consultation'
      if (normalized.includes('final') && normalized.includes('rule')) return 'Final Rule'
      if (normalized.includes('guidance')) return 'Guidance'
      if (normalized.includes('enforcement')) return 'Enforcement Action'
      if (normalized.includes('speech')) return 'Speech'
      if (normalized.includes('policy')) return 'Policy Statement'
      if (normalized.includes('supervisory')) return 'Supervisory Statement'
      if (normalized.includes('dear') && normalized.includes('ceo')) return 'Dear CEO Letter'
      if (normalized.includes('press')) return 'Press Release'
      if (normalized.includes('market') && normalized.includes('notice')) return 'Market Notice'
      if (normalized.includes('statistical') || normalized.includes('statistics')) return 'Statistical Report'
      if (normalized.includes('research') || normalized.includes('paper')) return 'Research Paper'
      if (normalized.includes('event') || normalized.includes('webinar') || normalized.includes('conference')) return 'Event'
    }
    if (tag === 'has:penalty') return 'Enforcement Action'
  }
  return ''
}

function containsAny(text, terms) {
  return terms.some(term => text.includes(term))
}

function inferFromText(text) {
  if (!text) return ''
  for (const rule of TEXT_RULES) {
    if (containsAny(text, rule.terms)) return rule.type
  }
  return ''
}

function inferFromUrl(url) {
  if (!url) return ''
  for (const rule of URL_RULES) {
    if (containsAny(url, rule.terms)) return rule.type
  }
  return ''
}

function buildInferenceText(update) {
  const parts = [
    update.headline,
    update.title,
    update.summary,
    update.ai_summary,
    update.aiSummary,
    update.description,
    update.content,
    update.body
  ]

  return parts
    .filter(Boolean)
    .map(value => String(value).toLowerCase())
    .join(' ')
}

function inferContentType(update = {}) {
  const existing = normalizeContentType(update.content_type || update.contentType || update.contentType)
  if (existing && existing !== 'Other') return existing

  const docType = normalizeContentType(update.documentType || update.document_type || update.type)
  if (docType && docType !== 'Other') return docType

  const tagType = inferFromTags(update.ai_tags || update.aiTags)
  if (tagType) return tagType

  const text = buildInferenceText(update)
  const textMatch = inferFromText(text)
  if (textMatch) return textMatch

  const urlMatch = inferFromUrl(String(update.url || '').toLowerCase())
  if (urlMatch) return urlMatch

  return existing || 'Other'
}

module.exports = {
  VALID_CONTENT_TYPES,
  normalizeContentType,
  inferContentType
}
