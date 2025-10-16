// src/services/dailyDigestService.js
// Generates and distributes the daily intelligence digest via email.

const cron = require('node-cron')
const dbService = require('./dbService')
const relevanceService = require('./relevanceService')
const { buildDailyDigestEmail } = require('../templates/emails/dailyDigestEmail-classic')
const { sendEmail } = require('./email/resendClient')

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

  // Count items in THIS digest
  const digestHighCount = insights.filter(i => (i.relevanceScore || 0) >= 80).length
  const digestMediumCount = insights.filter(i => {
    const score = i.relevanceScore || 0
    return score >= 70 && score < 80
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
    limit = 60
  } = options

  const firmProfile = await dbService.getFirmProfile().catch(() => null)
  const updates = await dbService.getEnhancedUpdates({ limit, sort: 'newest' })
  const categorized = relevanceService.categorizeByRelevance(updates, firmProfile)

  const ranked = [
    ...(categorized.high || []),
    ...(categorized.medium || []),
    ...(categorized.low || [])
  ]

  // Quality filtering: exclude job postings and low-quality content
  const filtered = ranked.filter(update => {
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

    // Temporarily exclude FATF content (poor quality summaries)
    if (authority.includes('fatf')) {
      return false
    }

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

    return true
  })

  const insights = filtered.slice(0, 10).map(update => {
    const sectors = Array.isArray(update.sectors) && update.sectors.length
      ? update.sectors
      : (
          update.primarySectors ||
        update.primary_sectors ||
        (update.sector ? [update.sector] : [])
        )

    // Prioritize actual published date over fetch date
    let publishedDate = update.publishedDate || update.published_date || update.date_published

    // If no published date, try to extract from metadata
    if (!publishedDate && update.metadata) {
      publishedDate = update.metadata.publishedDate || update.metadata.date || update.metadata.pubDate
    }

    // Only use fetch date as absolute last resort
    if (!publishedDate) {
      publishedDate = update.fetchedDate || update.fetched_date || update.createdAt || update.created_at
    }

    return {
      id: update.id || update.update_id || update.url,
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

  // Calculate metrics based on items IN THIS DIGEST (not database totals)
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

  const cronExpression = process.env.DAILY_DIGEST_CRON || '0 6 * * *'
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
