// src/services/dailyDigestService.js
// Generates and distributes the daily intelligence digest via email.

const cron = require('node-cron')
const dbService = require('./dbService')
const relevanceService = require('./relevanceService')
const { buildDailyDigestEmail } = require('../templates/emails/dailyDigestEmail-classic')
const { sendEmail } = require('./email/resendClient')

const DEFAULT_HISTORY_WINDOW_DAYS = 45
// const DEFAULT_DIGEST_TIMEZONE = 'Europe/London'
const DEFAULT_DIGEST_ROLLING_WINDOW_HOURS = 24

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
    limit = 60,
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

  // Use a rolling window (default 24 hours) to ensure consistent volume
  // This captures updates from the past X hours leading up to the digest time
  // Duplicates are filtered out via digest history tracking
  const rollingWindowStart = new Date(digestDate)
  rollingWindowStart.setHours(rollingWindowStart.getHours() - rollingWindowHours)

  const firmProfile = await dbService.getFirmProfile().catch(() => null)
  const updates = await dbService.getEnhancedUpdates({
    limit,
    sort: 'newest',
    startDate: rollingWindowStart.toISOString(),
    endDate: digestDate.toISOString()
  })
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
  const seenThisDigest = new Set()

  // Quality filtering: exclude job postings and low-quality content
  const filtered = ranked.filter(update => {
    const identifierSource = update.id || update.update_id || update.url
    const identifier = identifierSource != null ? String(identifierSource) : null

    if (identifier && previouslySentSet.has(identifier)) {
      return false
    }

    // Exclude job postings and careers content
    const headline = (update.headline || '').toLowerCase()
    const category = (update.category || '').toLowerCase()
    const summary = (update.ai_summary || update.summary || update.description || '').toLowerCase()
    const authority = (update.authority || '').toLowerCase()

    const excludeKeywords = ['job', 'career', 'vacancy', 'vacancies', 'recruitment', 'hiring', 'apply now', 'job opening']

    const isJobPosting = excludeKeywords.some(keyword =>
      headline.includes(keyword) || category.includes(keyword)
    )

    if (isJobPosting) return false

    // Exclude low-quality summaries
    // Check for repetitive text (same word/phrase repeated)
    const words = summary.split(/\s+/)
    const uniqueWords = new Set(words)
    const repetitionRatio = uniqueWords.size / words.length

    if (words.length > 5 && repetitionRatio < 0.4) {
      // High repetition, likely low quality
      return false
    }

    // Exclude purely informational updates with no substance
    if (summary.includes('informational regulatory update') && summary.length < 80) {
      return false
    }

    // Check if summary is just the headline repeated
    const cleanHeadline = headline.replace(/[^a-z0-9\s]/g, '')
    const cleanSummary = summary.replace(/[^a-z0-9\s]/g, '')
    if (cleanSummary.includes(cleanHeadline) && summary.length < 100) {
      return false
    }

    // Exclude items with no meaningful summary
    if (summary.length < 30 || !summary.match(/[a-z]{3,}/i)) {
      return false
    }

    if (identifier && seenThisDigest.has(identifier)) {
      return false
    }

    if (identifier) {
      seenThisDigest.add(identifier)
    }

    return true
  })

  // Implement balanced selection to ensure diversity across authorities and sectors
  const balancedSelection = []
  const authorityCount = {}
  const sectorCount = {}
  const TARGET_MIN = 10 // Minimum items we want to include
  const TARGET_MAX = 15 // Maximum items to include
  const MAX_PER_AUTHORITY = 3 // Maximum items from same authority (relaxed if needed)
  const MAX_PER_SECTOR = 5 // Maximum items from same sector

  // First pass: prioritize high-impact items (score >= 80)
  for (const update of filtered) {
    if (balancedSelection.length >= TARGET_MAX) break
    if (update.relevanceScore >= 80) {
      balancedSelection.push(update)
      const authority = update.authority || 'Unknown'
      const sector = update.sector || 'Unknown'
      authorityCount[authority] = (authorityCount[authority] || 0) + 1
      sectorCount[sector] = (sectorCount[sector] || 0) + 1
    }
  }

  // Second pass: add diverse content respecting limits
  for (const update of filtered) {
    if (balancedSelection.length >= TARGET_MAX) break
    if (balancedSelection.some(item => item.id === update.id || item.url === update.url)) {
      continue // Already selected
    }

    const authority = update.authority || 'Unknown'
    const sector = update.sector || 'Unknown'

    // Check if adding this would exceed diversity limits
    if ((authorityCount[authority] || 0) >= MAX_PER_AUTHORITY) continue
    if ((sectorCount[sector] || 0) >= MAX_PER_SECTOR) continue

    // Exclude low-value AQUIS announcements (AGMs, stock updates)
    if (authority === 'AQUIS') {
      const headline = (update.headline || '').toLowerCase()
      if (headline.includes('agm') ||
          headline.includes('shares in issue') ||
          headline.includes('subscription agreement') ||
          headline.includes('notice of')) {
        continue
      }
    }

    balancedSelection.push(update)
    authorityCount[authority] = (authorityCount[authority] || 0) + 1
    sectorCount[sector] = (sectorCount[sector] || 0) + 1
  }

  // Third pass: if we don't have enough items, relax authority limits
  if (balancedSelection.length < TARGET_MIN) {
    for (const update of filtered) {
      if (balancedSelection.length >= TARGET_MAX) break
      if (balancedSelection.some(item => item.id === update.id || item.url === update.url)) {
        continue
      }

      const authority = update.authority || 'Unknown'
      const sector = update.sector || 'Unknown'

      // Relaxed limit: allow up to 5 per authority if we're short on content
      if ((authorityCount[authority] || 0) >= 5) continue
      if ((sectorCount[sector] || 0) >= MAX_PER_SECTOR) continue

      // Still exclude obvious low-value AQUIS content
      if (authority === 'AQUIS') {
        const headline = (update.headline || '').toLowerCase()
        if (headline.includes('agm') ||
            headline.includes('shares in issue') ||
            headline.includes('subscription agreement')) {
          continue
        }
      }

      balancedSelection.push(update)
      authorityCount[authority] = (authorityCount[authority] || 0) + 1
      sectorCount[sector] = (sectorCount[sector] || 0) + 1
    }
  }

  const insights = balancedSelection.map(update => {
    const identifierSource = update.id || update.update_id || update.url
    const identifier = identifierSource != null ? String(identifierSource) : null
    const sectors = Array.isArray(update.sectors) && update.sectors.length
      ? update.sectors
      : (
          update.primarySectors ||
        update.primary_sectors ||
        (update.sector ? [update.sector] : [])
        )

    const publishedDate = extractPublishedDate(update)

    return {
      id: identifier,
      headline: update.headline,
      summary: update.ai_summary || update.summary || update.description,
      authority: update.authority,
      sectors,
      sector: update.sector,
      relevanceScore: update.relevanceScore,
      priorityReason: update.priorityReason,
      published: publishedDate,
      url: update.url
    }
  })

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
    deadlineCount
  }

  const summary = formatSummary({
    highCount,
    mediumCount,
    uniqueAuthorities,
    topSectors: topSectorList,
    insights,
    insightCount: insights.length
  })

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

  const digest = await buildDigestPayload({ persona })
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
