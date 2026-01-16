// src/services/weeklyNewsletterService.js
// Curated weekly newsletter with AI-generated firm impact analysis

const weeklyRoundupService = require('./weeklyRoundupService')
const dbService = require('./dbService')
const { sendEmail } = require('./email/resendClient')
const { buildWeeklyNewsletterEmail } = require('../templates/emails/weeklyNewsletterEmail')
const axios = require('axios')

const NEWSLETTER_CONFIG = {
  articleCount: 5,
  windowDays: 7,
  groqModel: 'llama-3.3-70b-versatile',
  groqApiUrl: 'https://api.groq.com/openai/v1/chat/completions'
}

const SYSTEM_PROMPT = `You are a senior regulatory affairs advisor with 20+ years of experience across UK financial services regulation. You have worked at the FCA, major banks, and now advise firms on regulatory change.

Your expertise spans:
- Prudential regulation (Basel III/IV, CRD, MIFID II)
- Conduct and consumer protection (Consumer Duty, TCF)
- Financial crime (AML, sanctions, fraud prevention)
- Operational resilience and third-party risk
- ESG and sustainable finance regulation
- Payments and fintech regulation

You understand:
- How regulators think and what they prioritize
- The practical challenges firms face implementing change
- Industry trends and where regulation is heading
- The difference between strategic shifts and routine updates

Your writing style:
- Clear and accessible - explain complex regulation simply
- Practical and actionable - focus on what firms should DO
- Contextual - connect updates to broader regulatory trends
- Balanced - acknowledge both risks and opportunities
- Confident but measured - avoid alarmism, provide perspective`

function getWeekRange() {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 7)

  const formatDate = (d) => d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  return {
    start,
    end,
    display: `${formatDate(start)} - ${formatDate(end)}`,
    shortDisplay: `Week of ${start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
  }
}

function classifyArticleCategory(update) {
  const headline = (update.headline || update.title || '').toLowerCase()
  const summary = (update.ai_summary || update.summary || '').toLowerCase()
  const combined = headline + ' ' + summary

  if (combined.includes('fine') || combined.includes('penalty') || combined.includes('enforcement') ||
      combined.includes('breach') || combined.includes('sanction') || combined.includes('warning')) {
    return 'ENFORCEMENT'
  }
  if (combined.includes('consultation') || combined.includes('call for input') ||
      combined.includes('feedback') || combined.includes('response')) {
    return 'CONSULTATION'
  }
  if (combined.includes('guidance') || combined.includes('framework') || combined.includes('handbook')) {
    return 'GUIDANCE'
  }
  if (combined.includes('speech') || combined.includes('remarks') || combined.includes('address')) {
    return 'SPEECH'
  }
  if (update.region && update.region !== 'UK') {
    return 'INTERNATIONAL'
  }
  return 'STRATEGIC'
}

async function generateFirmImpactAnalysis(article) {
  const groqApiKey = process.env.GROQ_API_KEY
  if (!groqApiKey) {
    console.warn('GROQ_API_KEY not configured, using fallback analysis')
    return generateFallbackAnalysis(article)
  }

  const category = classifyArticleCategory(article)
  const userPrompt = `REGULATORY UPDATE
Authority: ${article.authority || 'Unknown'}
Headline: ${article.headline || article.title}
Published: ${article.publishedDate || article.published_date || 'Recent'}
Summary: ${article.ai_summary || article.summary || article.headline}
Category: ${category}

Write a "WHAT THIS MEANS FOR YOUR FIRM" analysis (200-250 words) structured as:

**The Significance**
One paragraph explaining why this matters in the broader regulatory context. Connect to trends, previous actions, or strategic direction.

**Key Implications**
2-3 bullet points on specific compliance/business impacts. Be concrete.

**Recommended Actions**
2-3 practical steps firms should consider. Include urgency/timeline where relevant.

Write as if briefing a board member or senior compliance officer who needs to understand the issue quickly but thoroughly.`

  try {
    const response = await axios.post(
      NEWSLETTER_CONFIG.groqApiUrl,
      {
        model: NEWSLETTER_CONFIG.groqModel,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 800,
        temperature: 0.6
      },
      {
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    )

    return response.data.choices[0].message.content
  } catch (error) {
    console.error('Groq API error:', error.message)
    return generateFallbackAnalysis(article)
  }
}

function generateFallbackAnalysis(article) {
  const category = classifyArticleCategory(article)
  const authority = article.authority || 'the regulator'

  const templates = {
    ENFORCEMENT: `**The Significance**
This enforcement action from ${authority} signals continued regulatory focus on compliance standards. Firms should note the specific failures highlighted as they often indicate areas of supervisory priority.

**Key Implications**
- Review internal controls in the areas cited
- Assess whether similar gaps exist in your firm
- Consider proactive disclosure if issues are identified

**Recommended Actions**
- Conduct a gap analysis against the failures identified
- Brief senior management and board on implications
- Document remediation steps if any weaknesses found`,

    CONSULTATION: `**The Significance**
This consultation from ${authority} represents an opportunity to shape future regulation. Early engagement helps firms prepare for changes and influence outcomes that affect their business models.

**Key Implications**
- Potential changes to compliance requirements
- May affect operational processes or systems
- Industry-wide impact expected

**Recommended Actions**
- Review the consultation document in detail
- Assess business impact of proposed changes
- Consider submitting a response before the deadline`,

    GUIDANCE: `**The Significance**
New guidance from ${authority} clarifies regulatory expectations. While not creating new rules, guidance shapes how existing requirements are interpreted and enforced.

**Key Implications**
- May require updates to policies and procedures
- Sets baseline for regulatory assessments
- Indicates areas of supervisory focus

**Recommended Actions**
- Map guidance against current practices
- Update relevant policies and training materials
- Brief relevant teams on expectations`,

    default: `**The Significance**
This development from ${authority} is relevant to firms' ongoing compliance and strategic planning. Understanding the context helps prioritise response efforts.

**Key Implications**
- May affect current or planned business activities
- Could signal direction of future regulation
- Relevant to risk and compliance functions

**Recommended Actions**
- Review the full announcement for specific details
- Assess relevance to your firm's activities
- Monitor for follow-up communications`
  }

  return templates[category] || templates.default
}

function isHighImpactContent(article) {
  const headline = (article.title || article.headline || '').toLowerCase()
  const summary = (article.ai_summary || article.summary || '').toLowerCase()
  const authority = (article.authority || '').toLowerCase()
  const combined = headline + ' ' + summary

  // EXCLUDE: Low-value content - be aggressive
  const excludePatterns = [
    // Personnel/appointments
    'appoint', 'appointment', 'appointed', 'hire', 'hiring', 'hired',
    'join', 'joins', 'joined', 'resign', 'resignation', 'resigned',
    'retire', 'retirement', 'retired', 'promote', 'promotion', 'promoted',
    'new role', 'new position', 'takes over', 'steps down', 'leaves', 'leaving',
    'board member', 'board of directors', 'non-executive',
    'ceo', 'cfo', 'coo', 'chief executive', 'managing director',
    // Corporate/admin
    'annual report', 'annual results', 'interim results',
    'agm', 'annual general meeting', 'shareholder meeting',
    'shares in issue', 'total voting rights', 'holding in company', 'director dealing',
    'change of name', 'change of address', 'office move', 'relocation',
    'website update', 'system maintenance', 'holiday', 'closure', 'opening hours',
    'newsletter', 'subscribe', 'podcast', 'webinar', 'event', 'conference',
    // Generic/low-value
    'subsidy control', 'state aid', // Too niche
    'speech at', 'remarks at', 'address to', // Speeches are low value
    'welcome', 'welcomes', 'pleased to announce',
    'international women', 'diversity', 'inclusion', // HR/culture topics
    'our offices', 'contact us', 'get in touch',
    'job', 'career', 'vacancy', 'recruitment',
    // Commitments and codes (not enforcement)
    'statement of commitment', 'commitment to', 'reaffirms commitment',
    'signs up to', 'signatory to', 'adheres to',
    'global code', 'code of conduct', 'fx global code',
    'best practice', 'voluntary code', 'industry code',
    'memorandum of understanding', 'mou signed',
    'cooperation agreement', 'bilateral agreement',
    // Publications that aren't enforcement
    'working paper', 'research paper', 'discussion paper',
    'statistical release', 'data release', 'statistics on',
    'quarterly bulletin', 'financial stability report',
    'minutes of', 'meeting minutes', 'committee minutes'
  ]

  for (const pattern of excludePatterns) {
    if (combined.includes(pattern)) {
      return false
    }
  }

  // EXCLUDE: Non-enforcement bodies and stock exchanges
  const excludeAuthorities = [
    'aquis', 'lse', 'london stock exchange',
    'hm government', 'parliament',
    'competition and markets', 'cma',
    'information commissioner', 'ico',
    'bis', 'bank for international settlements', // Research/standards body
    'fsb', 'financial stability board', // Standards body
    'iosco' // Standards body - unless enforcement
  ]

  for (const auth of excludeAuthorities) {
    if (authority.includes(auth)) {
      return false
    }
  }

  // HIGH PRIORITY: Enforcement actions (score +3)
  const enforcementPatterns = [
    'fine', 'fined', 'penalty', 'penalised', 'penalized',
    'enforcement action', 'enforcement notice',
    'breach', 'breached', 'violation', 'violated',
    'sanction', 'sanctioned', 'banned', 'prohibition',
    'warning notice', 'final notice', 'decision notice',
    'prosecution', 'prosecuted', 'criminal',
    'settlement', 'redress', 'compensation'
  ]

  // MEDIUM PRIORITY: Major policy changes (score +2)
  const policyPatterns = [
    'new rule', 'new regulation', 'new requirement',
    'policy statement', 'final rule', 'final guidance',
    'implementation date', 'comes into force', 'effective from',
    'consultation paper', 'call for input', 'cp',
    'dear ceo', 'dear board', 'portfolio letter',
    'thematic review', 'supervisory statement',
    'capital requirement', 'prudential', 'solvency',
    'consumer duty', 'conduct of business',
    'operational resilience', 'outsourcing', 'third party',
    'aml', 'anti-money laundering', 'financial crime', 'sanctions',
    'market abuse', 'insider dealing', 'manipulation'
  ]

  // Score the article
  let score = 0

  for (const pattern of enforcementPatterns) {
    if (combined.includes(pattern)) {
      score += 3
      break // Only count once
    }
  }

  for (const pattern of policyPatterns) {
    if (combined.includes(pattern)) {
      score += 2
      break // Only count once
    }
  }

  // Bonus for key financial regulators
  const keyRegulators = ['fca', 'pra', 'bank of england', 'eba', 'esma', 'ecb', 'sec', 'fed']
  for (const reg of keyRegulators) {
    if (authority.includes(reg)) {
      score += 1
      break
    }
  }

  // Must have score of at least 2 (major policy from any regulator OR enforcement)
  return score >= 2
}

async function selectTopArticles(count = 5) {
  // Use weekly roundup service to get high-impact updates
  const roundup = await weeklyRoundupService.generateWeeklyRoundup()

  if (!roundup.success || !roundup.roundup.highImpactUpdates) {
    console.warn('Could not get high impact updates from roundup')
    return []
  }

  // Get candidate articles (more than we need for filtering)
  const candidates = roundup.roundup.highImpactUpdates.slice(0, 50)

  // Filter to only truly high-impact content
  const impactfulArticles = candidates.filter(article => isHighImpactContent(article))

  console.log(`Filtered to ${impactfulArticles.length} high-impact articles from ${candidates.length} candidates`)

  // Select with STRICT one-per-authority rule
  const selected = []
  const usedAuthorities = new Set()

  // Priority order: Enforcement > Consultation > Guidance > Strategic
  const priorityOrder = ['ENFORCEMENT', 'CONSULTATION', 'GUIDANCE', 'STRATEGIC', 'INTERNATIONAL', 'SPEECH']

  // Sort by category priority and business impact score
  const sortedArticles = impactfulArticles.sort((a, b) => {
    const catA = classifyArticleCategory(a)
    const catB = classifyArticleCategory(b)
    const priorityA = priorityOrder.indexOf(catA)
    const priorityB = priorityOrder.indexOf(catB)

    // First by category priority
    if (priorityA !== priorityB) {
      return priorityA - priorityB
    }

    // Then by business impact score
    const scoreA = a.businessImpactScore || a.impactScore || 0
    const scoreB = b.businessImpactScore || b.impactScore || 0
    return scoreB - scoreA
  })

  // Select one per authority, prioritizing high-impact categories
  for (const article of sortedArticles) {
    if (selected.length >= count) break

    const authority = article.authority || 'Unknown'

    // STRICT: Skip if we already have this authority
    if (usedAuthorities.has(authority)) {
      continue
    }

    const category = classifyArticleCategory(article)
    selected.push({
      ...article,
      category
    })
    usedAuthorities.add(authority)

    console.log(`Selected: [${category}] ${authority} - ${(article.title || article.headline || '').slice(0, 50)}...`)
  }

  // If we still need more, relax slightly but still enforce one-per-authority
  if (selected.length < count) {
    for (const article of candidates) {
      if (selected.length >= count) break
      const authority = article.authority || 'Unknown'
      if (usedAuthorities.has(authority)) continue
      if (selected.some(s => s.id === article.id)) continue

      const category = classifyArticleCategory(article)
      selected.push({
        ...article,
        category
      })
      usedAuthorities.add(authority)
    }
  }

  return selected
}

async function buildWeeklyNewsletter() {
  console.log('Building weekly newsletter...')

  const weekRange = getWeekRange()

  // Get top 5 curated articles
  const topArticles = await selectTopArticles(NEWSLETTER_CONFIG.articleCount)

  if (topArticles.length === 0) {
    console.warn('No articles found for weekly newsletter')
    return null
  }

  console.log(`Selected ${topArticles.length} top articles for newsletter`)

  // Generate AI analysis for each article
  const articlesWithAnalysis = []
  for (const article of topArticles) {
    console.log(`Generating analysis for: ${article.title || article.headline}`)
    const analysis = await generateFirmImpactAnalysis(article)
    articlesWithAnalysis.push({
      ...article,
      firmImpactAnalysis: analysis
    })
  }

  // Get week overview stats
  const roundup = await weeklyRoundupService.generateWeeklyRoundup()
  const stats = roundup.success ? roundup.roundup : null

  // Get upcoming deadlines
  const upcomingDeadlines = stats?.upcomingDeadlines?.slice(0, 5) || []

  return {
    weekRange,
    overview: stats?.weekSummary || `${topArticles.length} key regulatory developments this week`,
    totalUpdates: stats?.totalUpdates || topArticles.length,
    stats: {
      enforcement: stats?.statistics?.impactBreakdown?.Significant || 0,
      consultations: articlesWithAnalysis.filter(a => a.category === 'CONSULTATION').length,
      highImpact: stats?.highImpactUpdates?.length || topArticles.length
    },
    articles: articlesWithAnalysis,
    upcomingDeadlines,
    generatedAt: new Date()
  }
}

async function sendWeeklyNewsletter({ recipients, brand }) {
  const targetRecipients = Array.isArray(recipients)
    ? recipients
    : (recipients || '').split(',').map(e => e.trim()).filter(Boolean)

  if (targetRecipients.length === 0) {
    console.warn('WeeklyNewsletter: no recipients configured')
    return { skipped: true, reason: 'No recipients' }
  }

  const newsletter = await buildWeeklyNewsletter()

  if (!newsletter || newsletter.articles.length === 0) {
    console.warn('WeeklyNewsletter: no content to send')
    return { skipped: true, reason: 'No content' }
  }

  const { subject, html, text } = buildWeeklyNewsletterEmail({
    weekRange: newsletter.weekRange,
    overview: newsletter.overview,
    totalUpdates: newsletter.totalUpdates,
    stats: newsletter.stats,
    articles: newsletter.articles,
    upcomingDeadlines: newsletter.upcomingDeadlines,
    generatedAt: newsletter.generatedAt,
    brand
  })

  await sendEmail({
    to: targetRecipients,
    subject,
    html,
    text
  })

  console.log(`Weekly newsletter sent to ${targetRecipients.length} recipient(s)`)

  return {
    sent: true,
    recipients: targetRecipients,
    articleCount: newsletter.articles.length,
    generatedAt: newsletter.generatedAt
  }
}

module.exports = {
  buildWeeklyNewsletter,
  sendWeeklyNewsletter,
  generateFirmImpactAnalysis,
  selectTopArticles,
  getWeekRange
}
