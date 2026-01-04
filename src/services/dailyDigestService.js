// src/services/dailyDigestService.js
// Generates and distributes the daily intelligence digest via email.

const cron = require('node-cron')
const dbService = require('./dbService')
const relevanceService = require('./relevanceService')
const { buildDailyDigestEmail } = require('../templates/emails/dailyDigestEmail-classic')
const { sendEmail } = require('./email/resendClient')
const { normalizeSectorName } = require('../utils/sectorTaxonomy')

const DEFAULT_HISTORY_WINDOW_DAYS = 45
// const DEFAULT_DIGEST_TIMEZONE = 'Europe/London'
const DEFAULT_DIGEST_ROLLING_WINDOW_HOURS = 24
const DEFAULT_DIGEST_MAX_ROLLING_WINDOW_HOURS = 24 * 14 // two weeks
const DEFAULT_DIGEST_MIN_ITEMS = 6
const DEFAULT_FINANCIAL_AUTHORITIES = [
  'FCA',
  'PRA',
  'Bank of England',
  'HM Treasury',
  'HMRC',
  'Financial Ombudsman Service',
  'FOS',
  'The Pensions Regulator',
  'Serious Fraud Office',
  'ICO',
  'FRC',
  'JMLSG',
  'Pay.UK',
  'FATF',
  'FSB',
  'ESMA',
  'EBA',
  'EIOPA',
  'FINMA',
  'BaFin',
  'SEC',
  'CFTC',
  'Federal Reserve',
  'FDIC',
  'OCC',
  'MAS',
  'ASIC',
  'APRA',
  'AUSTRAC',
  'SAMA',
  'ADGM',
  'DFSA',
  'ACPR',
  'Bank of Italy',
  'CNMV',
  'QCB',
  'EEAS'
]
const DEFAULT_FINANCIAL_SECTORS = [
  'Banking',
  'Investment Management',
  'Wealth Management',
  'Insurance',
  'Consumer Credit',
  'Payments',
  'Payment Services',
  'Fintech',
  'Capital Markets',
  'Market Infrastructure',
  'Securities Regulation',
  'Asset Management',
  'Pensions',
  'Pension Funds',
  'Tax',
  'AML & Financial Crime',
  'Compliance',
  'Prudential Regulation',
  'Financial Crime',
  'Money Laundering',
  'Corporate Finance',
  'Credit',
  'Lending',
  'Cryptocurrency',
  'Digital Assets'
]
const DEFAULT_FINANCIAL_KEYWORDS = [
  'financial',
  'finance',
  'bank',
  'banking',
  'insurance',
  'insurer',
  'investment',
  'securities',
  'capital markets',
  'payments',
  'payment',
  'fintech',
  'credit',
  'lending',
  'mortgage',
  'prudential',
  'conduct',
  'regulation',
  'regulatory',
  'compliance',
  'money laundering',
  'aml',
  'sanctions',
  'crypto',
  'digital assets',
  'consumer credit',
  'pension',
  'wealth',
  'asset management',
  'market abuse',
  'trading',
  'derivatives',
  'clearing'
]

function resolveHistoryWindowDays() {
  const envValue = parseInt(process.env.DIGEST_HISTORY_WINDOW_DAYS, 10)
  if (Number.isFinite(envValue) && envValue > 0) {
    return envValue
  }
  return DEFAULT_HISTORY_WINDOW_DAYS
}

function resolveHistoryRetentionDays() {
  const envValue = parseInt(process.env.DIGEST_HISTORY_RETENTION_DAYS, 10)
  if (Number.isFinite(envValue) && envValue > 0) {
    return envValue
  }
  return resolveHistoryWindowDays()
}

// function resolveDigestTimezone() {
//   return process.env.DIGEST_TIMEZONE ||
//     process.env.DAILY_DIGEST_TIMEZONE ||
//     DEFAULT_DIGEST_TIMEZONE
// }

function resolveRollingWindowHours(preferred) {
  const parsedPreferred = typeof preferred === 'number'
    ? preferred
    : parseInt(preferred, 10)
  if (Number.isFinite(parsedPreferred) && parsedPreferred > 0) {
    return parsedPreferred
  }
  const envValue = parseInt(process.env.DIGEST_ROLLING_WINDOW_HOURS, 10)
  if (Number.isFinite(envValue) && envValue > 0) {
    return envValue
  }
  return DEFAULT_DIGEST_ROLLING_WINDOW_HOURS
}

function resolveMaxRollingWindowHours(baseHours) {
  const envValue = parseInt(process.env.DIGEST_MAX_ROLLING_WINDOW_HOURS, 10)
  const baseline = Number.isFinite(baseHours) && baseHours > 0
    ? baseHours
    : DEFAULT_DIGEST_ROLLING_WINDOW_HOURS
  if (Number.isFinite(envValue) && envValue >= baseline) {
    return envValue
  }
  return Math.max(DEFAULT_DIGEST_MAX_ROLLING_WINDOW_HOURS, baseline)
}

function resolveMinDigestItems() {
  const envValue = parseInt(process.env.DIGEST_MIN_ITEMS, 10)
  if (Number.isFinite(envValue) && envValue > 0) {
    return envValue
  }
  return DEFAULT_DIGEST_MIN_ITEMS
}

function parseCsvEnv(value) {
  if (!value) return []
  return value.split(',').map(entry => entry.trim()).filter(Boolean)
}

function buildLowerSet(values = []) {
  return new Set(values.map(value => String(value).toLowerCase()))
}

function resolveFinancialAuthorityAllowlist() {
  const envValues = parseCsvEnv(process.env.DIGEST_AUTHORITY_ALLOWLIST)
  return buildLowerSet(envValues.length ? envValues : DEFAULT_FINANCIAL_AUTHORITIES)
}

function resolveFinancialSectorAllowlist() {
  const envValues = parseCsvEnv(process.env.DIGEST_SECTOR_ALLOWLIST)
  const base = envValues.length ? envValues : DEFAULT_FINANCIAL_SECTORS
  return buildLowerSet(base.map(entry => normalizeSectorName(entry) || entry))
}

function resolveFinancialKeywordAllowlist() {
  const envValues = parseCsvEnv(process.env.DIGEST_KEYWORD_ALLOWLIST)
  return envValues.length ? envValues.map(value => value.toLowerCase()) : DEFAULT_FINANCIAL_KEYWORDS
}

function shouldFilterNonFinancial() {
  return process.env.DIGEST_FINANCIAL_ONLY !== 'false'
}

// function formatDateKey(value, timeZone) {
//   if (!value) return null
//   const date = value instanceof Date ? value : new Date(value)
//   if (Number.isNaN(date.getTime())) return null

//   const formatter = new Intl.DateTimeFormat('en-GB', {
//     timeZone,
//     year: 'numeric',
//     month: '2-digit',
//     day: '2-digit'
//   })

//   const parts = formatter.formatToParts(date)
//   const year = parts.find(part => part.type === 'year')?.value
//   const month = parts.find(part => part.type === 'month')?.value
//   const day = parts.find(part => part.type === 'day')?.value

//   if (!year || !month || !day) return null
//   return `${year}-${month}-${day}`
// }

function extractPublishedDate(update) {
  if (!update || typeof update !== 'object') return null
  const candidates = [
    update.publishedDate,
    update.published_date,
    update.date_published,
    update.metadata?.publishedDate,
    update.metadata?.date,
    update.metadata?.pubDate,
    update.fetchedDate,
    update.fetched_date,
    update.createdAt,
    update.created_at
  ]

  for (const candidate of candidates) {
    if (!candidate) continue
    const parsed = candidate instanceof Date ? candidate : new Date(candidate)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }
  }

  return null
}

function parseRecipients(value) {
  if (!value) return []
  return value
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean)
}

function formatSummary({ highCount, mediumCount, uniqueAuthorities, topSectors, insights, insightCount }) {
  if ((highCount || 0) + (mediumCount || 0) === 0) {
    return 'No significant regulatory movements were recorded in the last cycle. Monitoring continues across all configured authorities.'
  }

  // Count items in THIS digest (aligned with relevanceService thresholds)
  const digestHighCount = insights.filter(i => (i.relevanceScore || 0) >= 70).length
  const digestMediumCount = insights.filter(i => {
    const score = i.relevanceScore || 0
    return score >= 40 && score < 70
  }).length
  const digestLowCount = insights.length - digestHighCount - digestMediumCount

  const digestAuthorities = new Set(insights.map(i => i.authority).filter(Boolean)).size

  // Build accessible explanation with context for THIS digest
  const parts = []

  if (digestHighCount > 0) {
    parts.push(`${digestHighCount} critical alert${digestHighCount === 1 ? '' : 's'}`)
  }

  if (digestMediumCount > 0) {
    parts.push(`${digestMediumCount} enforcement update${digestMediumCount === 1 ? '' : 's'}`)
  }

  if (digestLowCount > 0) {
    parts.push(`${digestLowCount} notable development${digestLowCount === 1 ? '' : 's'}`)
  }

  const activity = parts.length > 0 ? parts.join(', ') : `${insights.length} regulatory update${insights.length === 1 ? '' : 's'}`
  const authoritiesLabel = digestAuthorities === 1 ? 'authority' : 'authorities'

  const sectorSnippet = topSectors.length
    ? ` Primary sectors: ${topSectors.join(', ')}.`
    : ''

  // Extract key themes from insights
  const themes = []

  insights.forEach(insight => {
    const headline = (insight.headline || '').toLowerCase()
    const summary = (insight.summary || '').toLowerCase()
    const combined = headline + ' ' + summary

    // Detect key regulatory themes
    if (combined.includes('enforcement') || combined.includes('fine') || combined.includes('penalty') || combined.includes('sanction')) {
      themes.push('enforcement')
    } else if (combined.includes('consultation') || combined.includes('proposal') || combined.includes('call for input')) {
      themes.push('consultations')
    } else if (combined.includes('deadline') || combined.includes('implementation date')) {
      themes.push('deadlines')
    } else if (combined.includes('guidance') || combined.includes('framework') || combined.includes('statement')) {
      themes.push('guidance')
    }
  })

  const uniqueThemes = [...new Set(themes)].slice(0, 2)
  const themeSnippet = uniqueThemes.length
    ? ` Focus areas: ${uniqueThemes.join(' and ')}.`
    : ''

  // Business impact context
  const impactContext = digestHighCount > 0
    ? ' Priority review recommended for compliance and risk assessment.'
    : ' Ongoing monitoring advised for operational impact.'

  return `This digest presents ${activity} from ${digestAuthorities} ${authoritiesLabel}.${sectorSnippet}${themeSnippet}${impactContext}`.trim()
}

async function buildDigestPayload(options = {}) {
  const {
    persona = process.env.DIGEST_PERSONA || 'Executive',
    limit = 150, // Increased to account for digest history filtering
    digestDate: digestDateInput,
    rollingWindowHours: rollingWindowPreferred
  } = options
  // const timeZone = resolveDigestTimezone()
  let digestDate = digestDateInput instanceof Date
    ? digestDateInput
    : (digestDateInput ? new Date(digestDateInput) : new Date())
  if (Number.isNaN(digestDate.getTime())) {
    digestDate = new Date()
  }
  // const digestDateKey = formatDateKey(digestDate, timeZone)
  // const timeZone = resolveDigestTimezone()
  const rollingWindowHours = resolveRollingWindowHours(rollingWindowPreferred)
  const maxRollingWindowHours = resolveMaxRollingWindowHours(rollingWindowHours)
  const minDigestItems = resolveMinDigestItems()
  const allowStaleFallback = process.env.DIGEST_ALLOW_STALE_FALLBACK !== 'false'

  const fetchUpdatesForWindow = async (windowHours) => {
    const windowStart = new Date(digestDate)
    windowStart.setHours(windowStart.getHours() - windowHours)
    const records = await dbService.getEnhancedUpdates({
      limit,
      sort: 'newest',
      startDate: windowStart.toISOString(),
      endDate: digestDate.toISOString()
    })
    return records
  }

  let effectiveWindowHours = rollingWindowHours
  let updates = await fetchUpdatesForWindow(effectiveWindowHours)
  let usedStaleFallback = false

  const MAX_EXPANSION_STEPS = 5
  let expansionAttempts = 0

  while (updates.length < minDigestItems && effectiveWindowHours < maxRollingWindowHours) {
    const expandedWindow = Math.min(
      maxRollingWindowHours,
      Math.max(effectiveWindowHours + 24, Math.round(effectiveWindowHours * 1.5))
    )
    if (expandedWindow === effectiveWindowHours) break

    console.warn(
      `[DailyDigest] Only ${updates.length} updates found in ${effectiveWindowHours}h window. ` +
      `Expanding to ${expandedWindow}h.`
    )

    effectiveWindowHours = expandedWindow
    updates = await fetchUpdatesForWindow(effectiveWindowHours)
    expansionAttempts++

    if (expansionAttempts >= MAX_EXPANSION_STEPS) {
      break
    }
  }

  if (updates.length < minDigestItems) {
    if (allowStaleFallback) {
      console.warn(
        `[DailyDigest] Still only ${updates.length} updates after expanding to ` +
        `${effectiveWindowHours}h. Falling back to latest stored updates.`
      )
      updates = await dbService.getEnhancedUpdates({
        limit,
        sort: 'newest'
      })
      usedStaleFallback = true
    } else {
      console.warn(
        `[DailyDigest] ${updates.length} updates found after expanding to ${effectiveWindowHours}h ` +
        'and stale fallback disabled. Digest may be empty.'
      )
    }
  }

  const firmProfile = await dbService.getFirmProfile().catch(() => null)
  const categorized = relevanceService.categorizeByRelevance(updates, firmProfile)

  const ranked = [
    ...(categorized.high || []),
    ...(categorized.medium || []),
    ...(categorized.low || [])
  ]

  // Retrieve digest history to avoid sending duplicate items
  const digestHistoryWindow = resolveHistoryWindowDays()
  const previouslySentIdentifiers = await dbService.getRecentDigestIdentifiers(digestHistoryWindow)
  const previouslySentSet = new Set(previouslySentIdentifiers.map(id => String(id)))
  const authorityAllowlist = resolveFinancialAuthorityAllowlist()
  const sectorAllowlist = resolveFinancialSectorAllowlist()
  const keywordAllowlist = resolveFinancialKeywordAllowlist()
  const filterNonFinancial = shouldFilterNonFinancial()

  const applyQualityFilters = ({ ignoreHistory = false } = {}) => {
    const seenThisDigest = new Set()

    return ranked.filter(update => {
      const identifierSource = update.id || update.update_id || update.url
      const identifier = identifierSource != null ? String(identifierSource) : null

      if (!ignoreHistory && identifier && previouslySentSet.has(identifier)) {
        return false
      }

      if (filterNonFinancial) {
        const authority = (update.authority || '').toLowerCase()
        const content = `${update.headline || ''} ${update.summary || ''} ${update.ai_summary || ''}`
          .toLowerCase()
        const sectorCandidates = []
          .concat(update.sectors || [])
          .concat(update.primarySectors || update.primary_sectors || [])
          .concat(update.firmTypesAffected || update.firm_types_affected || [])
          .concat(update.sector ? [update.sector] : [])
          .filter(Boolean)
        const normalizedSectors = sectorCandidates
          .map(value => normalizeSectorName(value) || value)
          .map(value => String(value).toLowerCase())

        const hasAuthorityMatch = authority && authorityAllowlist.has(authority)
        const hasSectorMatch = normalizedSectors.some(value => sectorAllowlist.has(value))
        const hasKeywordMatch = keywordAllowlist.some(keyword => content.includes(keyword))

        if (!hasAuthorityMatch && !hasSectorMatch && !hasKeywordMatch) {
          return false
        }
      }

      // Exclude job postings and careers content
      const headline = (update.headline || '').toLowerCase()
      const category = (update.category || '').toLowerCase()
      const summary = (update.ai_summary || update.summary || update.description || '').toLowerCase()
      const authority = (update.authority || '').toLowerCase()

      const excludeKeywords = ['job', 'career', 'vacancy', 'vacancies', 'recruitment', 'hiring', 'apply now', 'job opening']
      // Exclude generic website pages and navigation items that aren't regulatory content
      // NOTE: Be careful not to exclude legitimate regulatory topics like AML, banking regulations, etc.
      const excludePages = ['privacy policy', 'contact us', 'terms of service', 'cookie policy', 'sitemap', 'accessibility', 'advanced search', 'search results', 'login', 'sign in', 'register', 'our operations', 'about us', 'news & events', 'media centre', 'faq', 'careers', 'our services', 'media center', 'get in touch', 'subscribe', 'newsletter signup']
      // Exclude junk/malformed headlines
      const junkPatterns = ['others,', 'other,', 'undefined', 'null', 'test', '[object', '+971', '+44', '+1 ', 'tel:', 'reach out', 'japan weeks']

      // Detect navigation pages by URL pattern - only exclude obvious non-content pages
      const url = (update.url || '').toLowerCase()
      // Only exclude very specific navigation patterns, not general /services/ which could be regulatory
      const isNavigationPage = url.includes('/en/search/') || url.endsWith('/about-us') || url.endsWith('/contact-us')

      const isJobPosting = excludeKeywords.some(keyword =>
        headline.includes(keyword) || category.includes(keyword)
      )

      if (isJobPosting) return false

      // Exclude generic website pages and navigation URLs
      const isGenericPage = excludePages.some(page => headline.includes(page))
      if (isGenericPage) return false
      if (isNavigationPage) return false

      // Exclude junk/malformed headlines (phone numbers, etc)
      const isJunkHeadline = junkPatterns.some(pattern => headline.includes(pattern))
      if (isJunkHeadline) return false

      // Exclude items with very short headlines (likely junk)
      if (headline.length < 15) return false

      // Exclude headlines that are mostly numbers (phone numbers, dates only, etc)
      const letterCount = (headline.match(/[a-z]/gi) || []).length
      if (letterCount < 10) return false

      // Exclude low-quality summaries - check for repetitive text
      const words = summary.split(/\s+/)
      const uniqueWords = new Set(words)
      const repetitionRatio = uniqueWords.size / words.length
      if (words.length > 5 && repetitionRatio < 0.4) return false

      // Exclude purely informational updates with no substance
      if (summary.includes('informational regulatory update') && summary.length < 50) return false

      // Check if summary is ONLY the headline with no additional content
      const cleanHeadline = headline.replace(/[^a-z0-9\s]/g, '').trim()
      let cleanSummary = summary.replace(/[^a-z0-9\s]/g, '').trim()
      cleanSummary = cleanSummary.replace(/^informational regulatory update\s*/i, '').trim()

      // Detect if the summary is just the headline repeated
      const headlineRepeated = cleanSummary.toLowerCase() === (cleanHeadline + ' ' + cleanHeadline).toLowerCase()
      if (headlineRepeated) return false

      // Filter if summary is basically just the headline (within 30 chars)
      if (cleanSummary.includes(cleanHeadline) && cleanSummary.length < cleanHeadline.length + 30) return false

      // Exclude items with no meaningful summary (very short)
      if (summary.length < 20 || !summary.match(/[a-z]{3,}/i)) return false

      // Require a meaningful summary - either from RSS feed or a substantial AI summary
      const rawSummary = update.summary || ''
      const rawAiSummary = update.ai_summary || ''
      const cleanedAiSummary = rawAiSummary.replace(/^(Informational regulatory update:|Regulatory update impacting business operations:|RegCanary Analysis:)\s*/i, '').trim()

      // Real summary: RSS summary exists and is substantial
      const hasRssSummary = rawSummary.length > 40
      // OR: AI summary has actual analysis (much longer than headline, not just headline repeated)
      const hasAiAnalysis = cleanedAiSummary.length > headline.length + 80 &&
                            !cleanedAiSummary.toLowerCase().startsWith(headline.toLowerCase().slice(0, 30))

      if (!hasRssSummary && !hasAiAnalysis) return false

      // Exclude generic navigation/index pages and stock exchange announcements
      const genericPageTitles = ['regulations and guidance', 'sanctions list updates', 'total voting rights', 'holdings in the company', 'holding(s) in company', 'resignation of director', 'interim results', 'result of annual general meeting', 'settlement agreement', 'announcement provided by']
      if (genericPageTitles.some(title => headline.includes(title))) return false

      if (identifier && seenThisDigest.has(identifier)) return false

      if (identifier) {
        seenThisDigest.add(identifier)
      }

      return true
    })
  }

  // Quality filtering: exclude job postings and low-quality content
  let filtered = applyQualityFilters()

  if (usedStaleFallback && filtered.length < minDigestItems) {
    console.warn(
      `[DailyDigest] Only ${filtered.length} updates after digest history filtering with stale fallback. ` +
      'Rebuilding without history constraints.'
    )
    filtered = applyQualityFilters({ ignoreHistory: true })
  }

  // Implement balanced selection to ensure diversity across authorities and sectors
  // Split into UK (10) and International (5) sections
  const TARGET_UK = 10
  const TARGET_INTERNATIONAL = 5
  const TARGET_MAX = TARGET_UK + TARGET_INTERNATIONAL // 15 total
  const TARGET_MIN = 10 // Minimum items we want to include
  const MAX_FCA = 3 // FCA gets priority, up to 3 items
  const MAX_HMRC = 1 // HMRC limited to 1 item only
  const MAX_HM_GOV = 1 // HM Government limited to 1 item only
  const MAX_AQUIS = 2 // AQUIS limited to 2 items
  const MAX_PER_AUTHORITY = 2 // Maximum items from same authority (default)
  const MAX_PER_SECTOR = 5 // Maximum items from same sector
  const HM_AUTHORITY_KEYWORDS = ['hm treasury', 'hm government', 'hm govt', 'his majesty']
  const MAX_HM_OTHER = 2 // HM Treasury + HM Government combined (excluding HMRC)

  // Helper to detect similar headlines (fuzzy deduplication)
  const normalizeHeadline = (h) => (h || '').toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')        // Normalize spaces
    .replace(/\s*pdf\s*$/i, '')  // Remove [pdf] suffix
    .trim()
    .slice(0, 60) // Compare first 60 chars to catch similar titles

  const seenNormalizedHeadlines = new Set()
  const deduplicatedFiltered = filtered.filter(update => {
    const normalized = normalizeHeadline(update.headline)
    if (seenNormalizedHeadlines.has(normalized)) {
      return false // Skip duplicate
    }
    seenNormalizedHeadlines.add(normalized)
    return true
  })

  // Separate UK and International updates
  const ukFiltered = deduplicatedFiltered.filter(u => !u.region || u.region === 'UK')
  const intlFiltered = deduplicatedFiltered.filter(u => u.region && u.region !== 'UK')
  const balancedSelection = []
  const authorityCount = {}
  const sectorCount = {}

  const isHmOtherAuthority = (authority = '') => {
    const normalized = authority.toLowerCase()
    return HM_AUTHORITY_KEYWORDS.some(keyword => normalized.includes(keyword))
  }

  const isLowValueAquis = (update) => {
    if (update.authority !== 'AQUIS') return false
    const headline = (update.headline || '').toLowerCase()
    return headline.includes('agm') ||
           headline.includes('shares in issue') ||
           headline.includes('subscription agreement') ||
           headline.includes('notice of')
  }

  // ============= UK SECTION (10 items, FCA first) =============
  const ukSelection = []
  let hmOtherCount = 0

  // FIRST: Add FCA items (priority authority, up to MAX_FCA)
  for (const update of ukFiltered.filter(u => u.authority === 'FCA')) {
    if (ukSelection.length >= TARGET_UK) break
    if ((authorityCount['FCA'] || 0) >= MAX_FCA) break
    if (ukSelection.some(item => item.id === update.id || item.url === update.url)) continue

    ukSelection.push(update)
    authorityCount['FCA'] = (authorityCount['FCA'] || 0) + 1
    const sector = update.sector || 'Unknown'
    sectorCount[sector] = (sectorCount[sector] || 0) + 1
  }

  // SECOND: Add high-impact non-FCA items (score >= 80)
  for (const update of ukFiltered.filter(u => u.authority !== 'FCA' && u.relevanceScore >= 80)) {
    if (ukSelection.length >= TARGET_UK) break
    if (ukSelection.some(item => item.id === update.id || item.url === update.url)) continue
    if (isLowValueAquis(update)) continue

    const authority = update.authority || 'Unknown'
    const sector = update.sector || 'Unknown'

    // HMRC limited to 1 item
    if (authority === 'HMRC' && (authorityCount['HMRC'] || 0) >= MAX_HMRC) continue
    // HM Government limited to 2 items
    if (authority.toLowerCase() === 'hm government' && (authorityCount[authority] || 0) >= MAX_HM_GOV) continue
    // Other HM authorities combined max 2
    if (isHmOtherAuthority(authority) && hmOtherCount >= MAX_HM_OTHER) continue
    if ((authorityCount[authority] || 0) >= MAX_PER_AUTHORITY) continue
    if ((sectorCount[sector] || 0) >= MAX_PER_SECTOR) continue

    ukSelection.push(update)
    authorityCount[authority] = (authorityCount[authority] || 0) + 1
    sectorCount[sector] = (sectorCount[sector] || 0) + 1
    if (isHmOtherAuthority(authority)) hmOtherCount++
  }

  // THIRD: Fill remaining UK slots with other items
  for (const update of ukFiltered.filter(u => u.authority !== 'FCA')) {
    if (ukSelection.length >= TARGET_UK) break
    if (ukSelection.some(item => item.id === update.id || item.url === update.url)) continue
    if (isLowValueAquis(update)) continue

    const authority = update.authority || 'Unknown'
    const sector = update.sector || 'Unknown'

    // HMRC limited to 1 item
    if (authority === 'HMRC' && (authorityCount['HMRC'] || 0) >= MAX_HMRC) continue
    // HM Government limited to 2 items
    if (authority.toLowerCase() === 'hm government' && (authorityCount[authority] || 0) >= MAX_HM_GOV) continue
    // Other HM authorities combined max 2
    if (isHmOtherAuthority(authority) && hmOtherCount >= MAX_HM_OTHER) continue
    if ((authorityCount[authority] || 0) >= MAX_PER_AUTHORITY) continue
    if ((sectorCount[sector] || 0) >= MAX_PER_SECTOR) continue

    ukSelection.push(update)
    authorityCount[authority] = (authorityCount[authority] || 0) + 1
    sectorCount[sector] = (sectorCount[sector] || 0) + 1
    if (isHmOtherAuthority(authority)) hmOtherCount++
  }

  // FOURTH: Gap-fill to reach TARGET_UK (relax some constraints but keep HMRC/HM Gov limits)
  if (ukSelection.length < TARGET_UK) {
    for (const update of ukFiltered) {
      if (ukSelection.length >= TARGET_UK) break
      if (ukSelection.some(item => item.id === update.id || item.url === update.url)) continue
      if (isLowValueAquis(update)) continue

      const authority = update.authority || 'Unknown'
      // Still respect HMRC limit even in gap-fill
      if (authority === 'HMRC' && (authorityCount['HMRC'] || 0) >= MAX_HMRC) continue
      // Still respect HM Government limit
      if (authority.toLowerCase() === 'hm government' && (authorityCount[authority] || 0) >= MAX_HM_GOV) continue

      ukSelection.push(update)
      authorityCount[authority] = (authorityCount[authority] || 0) + 1
    }
  }

  // ============= INTERNATIONAL SECTION (5 items) =============
  const intlSelection = []
  const intlAuthorityCount = {}

  // Sort international by relevance score (highest first) to get most important
  const intlSorted = [...intlFiltered].sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))

  // FIRST PASS: Add high-impact international items (score >= 70), max 1 per authority
  for (const update of intlSorted.filter(u => (u.relevanceScore || 0) >= 70)) {
    if (intlSelection.length >= TARGET_INTERNATIONAL) break
    if (intlSelection.some(item => item.id === update.id || item.url === update.url)) continue

    const authority = update.authority || 'Unknown'

    // Max 1 item per international authority for diversity
    if ((intlAuthorityCount[authority] || 0) >= 1) continue

    intlSelection.push(update)
    intlAuthorityCount[authority] = (intlAuthorityCount[authority] || 0) + 1
  }

  // SECOND PASS: Fill remaining with other items, still max 1 per authority
  for (const update of intlSorted) {
    if (intlSelection.length >= TARGET_INTERNATIONAL) break
    if (intlSelection.some(item => item.id === update.id || item.url === update.url)) continue

    const authority = update.authority || 'Unknown'

    // Max 1 item per international authority for diversity
    if ((intlAuthorityCount[authority] || 0) >= 1) continue

    intlSelection.push(update)
    intlAuthorityCount[authority] = (intlAuthorityCount[authority] || 0) + 1
  }

  // THIRD PASS: If still short, allow up to 2 per authority as fallback
  if (intlSelection.length < TARGET_INTERNATIONAL) {
    for (const update of intlSorted) {
      if (intlSelection.length >= TARGET_INTERNATIONAL) break
      if (intlSelection.some(item => item.id === update.id || item.url === update.url)) continue

      const authority = update.authority || 'Unknown'

      // Fallback: allow up to 2 per authority
      if ((intlAuthorityCount[authority] || 0) >= 2) continue

      intlSelection.push(update)
      intlAuthorityCount[authority] = (intlAuthorityCount[authority] || 0) + 1
    }
  }

  // Final enforcement: ensure hard limits are respected
  const finalUkSelection = []
  const finalUkAuthorityCount = {}
  for (const item of ukSelection) {
    const auth = item.authority || 'Unknown'
    // Hard limit: max 1 HMRC
    if (auth === 'HMRC' && (finalUkAuthorityCount['HMRC'] || 0) >= 1) continue
    // Hard limit: max 1 HM Government
    if (auth === 'HM Government' && (finalUkAuthorityCount['HM Government'] || 0) >= 1) continue
    // Hard limit: max 2 AQUIS
    if (auth === 'AQUIS' && (finalUkAuthorityCount['AQUIS'] || 0) >= 2) continue
    finalUkSelection.push(item)
    finalUkAuthorityCount[auth] = (finalUkAuthorityCount[auth] || 0) + 1
  }

  // Combine UK and International selections
  balancedSelection.push(...finalUkSelection, ...intlSelection)

  // Map UK insights with section marker
  const ukInsights = finalUkSelection.map(update => {
    const identifierSource = update.id || update.update_id || update.url
    const identifier = identifierSource != null ? String(identifierSource) : null
    const sectors = Array.isArray(update.sectors) && update.sectors.length
      ? update.sectors
      : (update.primarySectors || update.primary_sectors || (update.sector ? [update.sector] : []))

    return {
      id: identifier,
      headline: update.headline,
      summary: update.summary || update.description,
      ai_summary: update.ai_summary,
      description: update.description,
      authority: update.authority,
      sectors,
      sector: update.sector,
      region: 'UK',
      relevanceScore: update.relevanceScore,
      priorityReason: update.priorityReason,
      published: extractPublishedDate(update),
      url: update.url
    }
  })

  // Map International insights with section marker
  const intlInsights = intlSelection.map(update => {
    const identifierSource = update.id || update.update_id || update.url
    const identifier = identifierSource != null ? String(identifierSource) : null
    const sectors = Array.isArray(update.sectors) && update.sectors.length
      ? update.sectors
      : (update.primarySectors || update.primary_sectors || (update.sector ? [update.sector] : []))

    return {
      id: identifier,
      headline: update.headline,
      summary: update.summary || update.description,
      ai_summary: update.ai_summary,
      description: update.description,
      authority: update.authority,
      sectors,
      sector: update.sector,
      region: update.region || 'International',
      country: update.country,
      relevanceScore: update.relevanceScore,
      priorityReason: update.priorityReason,
      published: extractPublishedDate(update),
      url: update.url
    }
  })

  // Combine insights (UK first, then International)
  const insights = [...ukInsights, ...intlInsights]

  // If still short on UK items, pull from latest UK updates
  if (ukInsights.length < TARGET_UK) {
    const supplemental = await dbService.getEnhancedUpdates({ limit: 50, sort: 'newest' }).catch(() => [])
    const suppAuthorityCount = {}
    // Count existing authorities in insights
    for (const item of insights) {
      const auth = item.authority || 'Unknown'
      suppAuthorityCount[auth] = (suppAuthorityCount[auth] || 0) + 1
    }
    for (const update of supplemental) {
      if (insights.length >= TARGET_MAX) break
      if (ukInsights.length >= TARGET_UK) break
      if (update.region && update.region !== 'UK') continue
      if (insights.some(item => item.id === update.id || item.url === update.url)) continue

      const identifier = update.id || update.update_id || update.url
      if (!identifier) continue

      const authority = update.authority || 'Unknown'
      // Apply same limits in supplemental fetch
      if (authority === 'HMRC' && (suppAuthorityCount['HMRC'] || 0) >= 1) continue
      if (authority === 'HM Government' && (suppAuthorityCount['HM Government'] || 0) >= 1) continue

      const insight = {
        id: String(identifier),
        headline: update.headline,
        summary: update.summary || update.description,
        ai_summary: update.ai_summary,
        description: update.description,
        authority: update.authority,
        sectors: update.sectors || [],
        sector: update.sector,
        region: 'UK',
        relevanceScore: update.relevanceScore || 40,
        priorityReason: update.priorityReason,
        published: extractPublishedDate(update),
        url: update.url
      }
      // Insert before international section
      insights.splice(ukInsights.length, 0, insight)
      suppAuthorityCount[authority] = (suppAuthorityCount[authority] || 0) + 1
    }
  }

  // Calculate metrics based on items IN THIS DIGEST (aligned with email template labels)
  // HIGH IMPACT: score >= 80
  // ENFORCEMENT: score 70-79
  // MONITOR: score < 70
  const highCount = insights.filter(item => (item.relevanceScore || 0) >= 80).length
  const mediumCount = insights.filter(item => {
    const score = item.relevanceScore || 0
    return score >= 70 && score < 80
  }).length
  const lowCount = insights.filter(item => (item.relevanceScore || 0) < 70).length
  const uniqueAuthorities = new Set(insights.map(item => item.authority).filter(Boolean)).size

  const topSectors = insights
    .flatMap(item => Array.isArray(item.sectors) ? item.sectors : [item.sector].filter(Boolean))
    .reduce((acc, sector) => {
      if (!sector) return acc
      const normalised = sector.trim()
      acc[normalised] = (acc[normalised] || 0) + 1
      return acc
    }, {})

  const topSectorList = Object.entries(topSectors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([sector]) => sector)

  const deadlineCount = filtered.filter(item => {
    const raw = item.compliance_deadline || item.complianceDeadline
    if (!raw) return false
    const deadline = new Date(raw)
    if (Number.isNaN(deadline.getTime())) return false
    const now = new Date()
    const diffDays = (deadline - now) / (1000 * 60 * 60 * 24)
    return diffDays >= 0 && diffDays <= 30
  }).length

  const metrics = {
    highCount,
    mediumCount,
    lowCount,
    uniqueAuthorities,
    deadlineCount,
    windowHoursUsed: usedStaleFallback ? null : effectiveWindowHours,
    staleFallbackUsed: usedStaleFallback
  }

  const baseSummary = formatSummary({
    highCount,
    mediumCount,
    uniqueAuthorities,
    topSectors: topSectorList,
    insights,
    insightCount: insights.length
  })
  const summary = usedStaleFallback
    ? `${baseSummary} Latest available insights are shown because no new updates were detected in the recent monitoring window.`
    : baseSummary

  return {
    personaLabel: persona,
    summary,
    insights,
    metrics,
    generatedAt: new Date()
  }
}

async function sendDailyDigest({ recipients, persona, brand }) {
  const targetRecipients = Array.isArray(recipients)
    ? recipients
    : parseRecipients(recipients)

  if (targetRecipients.length === 0) {
    console.warn('DailyDigest: no recipients configured, skipping send')
    return { skipped: true, reason: 'No recipients' }
  }

  const digest = await buildDigestPayload({
    persona,
    limit: 200,
    rollingWindowHours: 168 // 7 days to ensure enough fresh content
  })
  const { subject, html, text } = buildDailyDigestEmail({
    date: digest.generatedAt,
    summary: digest.summary,
    insights: digest.insights,
    metrics: digest.metrics,
    personaLabel: digest.personaLabel,
    brand
  })

  await sendEmail({
    to: targetRecipients,
    subject,
    html,
    text
  })

  if (digest.insights.length > 0) {
    const retentionDays = resolveHistoryRetentionDays()
    await dbService.markDigestItemsSent(
      digest.insights.map(item => item.id).filter(Boolean),
      {
        digestDate: digest.generatedAt,
        retentionDays
      }
    )
  }

  return {
    sent: true,
    recipients: targetRecipients,
    insightCount: digest.insights.length,
    generatedAt: digest.generatedAt
  }
}

let scheduledTask = null

function scheduleDailyDigest() {
  if (scheduledTask) {
    return scheduledTask
  }

  if (process.env.ENABLE_DAILY_DIGEST !== 'true') {
    console.log('DailyDigest: scheduling disabled (set ENABLE_DAILY_DIGEST=true to activate)')
    return null
  }

  if (!process.env.RESEND_API_KEY) {
    console.warn('DailyDigest: RESEND_API_KEY is not configured. Digest scheduling skipped.')
    return null
  }

  const cronExpression = process.env.DAILY_DIGEST_CRON || '0 8 * * *'
  const timezone = process.env.DAILY_DIGEST_TIMEZONE || 'Europe/London'
  const recipients = parseRecipients(process.env.DAILY_DIGEST_RECIPIENTS)

  if (recipients.length === 0) {
    console.warn('DailyDigest: DAILY_DIGEST_RECIPIENTS is empty. Digest scheduling skipped.')
    return null
  }

  scheduledTask = cron.schedule(cronExpression, async () => {
    try {
      console.log(`DailyDigest: dispatch triggered (${new Date().toISOString()})`)
      await sendDailyDigest({
        recipients,
        persona: process.env.DIGEST_PERSONA,
        brand: {
          title: process.env.DIGEST_BRAND_TITLE,
          footer: process.env.DIGEST_BRAND_FOOTER
        }
      })
      console.log('DailyDigest: dispatch completed')
    } catch (error) {
      console.error('DailyDigest: dispatch failed', error)
    }
  }, { timezone })

  console.log(`DailyDigest: scheduled with cron "${cronExpression}" (${timezone}) for ${recipients.length} recipient(s)`)
  return scheduledTask
}

module.exports = {
  buildDigestPayload,
  sendDailyDigest,
  scheduleDailyDigest,
  parseRecipients
}
