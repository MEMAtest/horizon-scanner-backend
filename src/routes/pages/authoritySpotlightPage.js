// src/routes/pages/authoritySpotlightPage.js
// Authority Spotlight Page Renderer

const { getCommonStyles } = require('../templates/commonStyles')
const { getSidebar } = require('../templates/sidebar')
const { getClientScripts } = require('../templates/clientScripts')
const dbService = require('../../services/dbService')
const { getSpotlightIcon, wrapIconInContainer, getCanaryAnimationStyles } = require('../../views/icons')
const { getAuthorityIndex, getAcronymIndex, normalizeAuthorityName, resolveAuthorityRecord } = require('../../utils/authorityRegistry')

const KNOWN_AUTHORITIES = [
  'FCA', 'PRA', 'BoE', 'Bank of England', 'PSR', 'TPR', 'The Pensions Regulator',
  'FATF', 'SFO', 'Serious Fraud Office', 'ESMA', 'EBA', 'FSB',
  'HM Treasury', 'Treasury Committee', 'OFSI', 'JMLSG', 'Pay.UK'
]

const REGULATOR_PROFILES = [
  {
    id: 'FCA',
    acronym: 'FCA',
    name: 'Financial Conduct Authority',
    logo: '/images/regulators/fca.png',
    logoAlt: 'Financial Conduct Authority logo',
    formed: '1 Apr 2013',
    formedYear: 2013,
    location: 'London, UK',
    remit: 'Conduct regulator for UK financial services firms and markets.',
    leader: 'Nikhil Rathi (Chief Executive)',
    explainer: 'Sets conduct rules, supervises firms, and protects consumers and market integrity.',
    bio: 'Created by the Financial Services Act 2012, the FCA regulates thousands of firms and financial markets, working alongside the PRA and the Bank of England.',
    colors: ['#0f766e', '#38bdf8']
  },
  {
    id: 'PRA',
    acronym: 'PRA',
    name: 'Prudential Regulation Authority',
    logo: '/images/regulators/pra.png',
    logoAlt: 'Prudential Regulation Authority logo',
    formed: '1 Apr 2013',
    formedYear: 2013,
    location: 'London, UK (Bank of England)',
    remit: 'Prudential safety and soundness of banks, insurers, and major investment firms.',
    leader: 'Sam Woods (Chief Executive)',
    explainer: 'Prudential supervisor focused on capital, liquidity, and resilience.',
    bio: 'A part of the Bank of England, the PRA supervises the firms that could pose systemic risk, setting prudential standards and monitoring balance-sheet strength.',
    colors: ['#1d4ed8', '#60a5fa']
  },
  {
    id: 'Bank of England',
    acronym: 'BoE',
    name: 'Bank of England',
    logo: '/images/regulators/boe.svg',
    logoAlt: 'Bank of England logo',
    formed: '1694',
    formedYear: 1694,
    location: 'London, UK',
    remit: 'UK central bank responsible for monetary policy, currency, and financial stability.',
    leader: 'Andrew Bailey (Governor)',
    explainer: 'Sets interest rates and safeguards financial stability for the UK.',
    bio: 'Founded in 1694, the Bank of England oversees monetary policy and financial stability through its policy committees and macroprudential tools.',
    colors: ['#7c3aed', '#a78bfa']
  },
  {
    id: 'The Pensions Regulator',
    acronym: 'TPR',
    name: 'The Pensions Regulator',
    logo: '/images/regulators/tpr.svg',
    logoAlt: 'The Pensions Regulator logo',
    formed: '2005',
    formedYear: 2005,
    location: 'Brighton, UK',
    remit: 'Regulates workplace pension schemes and auto-enrolment duties.',
    leader: 'Nausicaa Delfas (Chief Executive)',
    explainer: 'Protects pension savers and promotes good scheme governance.',
    bio: 'Established under the Pensions Act 2004, TPR focuses on funding discipline, trustee governance, and protecting members of workplace pension schemes.',
    colors: ['#0f766e', '#22c55e']
  },
  {
    id: 'Serious Fraud Office',
    acronym: 'SFO',
    name: 'Serious Fraud Office',
    logo: '/images/regulators/sfo.png',
    logoAlt: 'Serious Fraud Office logo',
    formed: '1987',
    formedYear: 1987,
    location: 'London, UK',
    remit: 'Investigates and prosecutes serious or complex fraud, bribery, and corruption.',
    leader: 'Nick Ephgrave (Director)',
    explainer: 'UK lead authority for complex economic crime prosecutions.',
    bio: 'Created by the Criminal Justice Act 1987, the SFO uses a multidisciplinary approach to investigate and prosecute the most serious economic crime cases.',
    colors: ['#dc2626', '#f97316']
  },
  {
    id: 'FATF',
    acronym: 'FATF',
    name: 'Financial Action Task Force',
    logo: '/images/regulators/fatf.svg',
    logoAlt: 'Financial Action Task Force logo',
    formed: '1989',
    formedYear: 1989,
    location: 'Paris, France',
    remit: 'Sets global AML/CFT standards and evaluates jurisdictions.',
    leader: 'Rotating presidency (current chair on FATF site)',
    explainer: 'Inter-governmental body shaping global AML/CFT policy.',
    bio: 'Founded by the G7, FATF issues recommendations and mutual evaluations that drive how countries align AML and counter-terrorist financing frameworks.',
    colors: ['#0f172a', '#64748b']
  }
]

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function normalizeDateValue(update) {
  const value = update?.publishedDate || update?.published_date || update?.fetchedDate || update?.createdAt
  const parsed = value ? new Date(value) : null
  return parsed && !isNaN(parsed) ? parsed : null
}

function isEnforcementUpdate(update) {
  const headline = (update.headline || '').toLowerCase()
  const summary = (update.ai_summary || update.aiSummary || update.summary || update.impact || '').toLowerCase()
  const combined = `${headline} ${summary}`
  const keywords = [
    'enforcement', 'penalty', 'fined', 'fine', 'sanction', 'disciplinary',
    'warning notice', 'final notice', 'decision notice', 'censure', 'prosecution'
  ]
  return keywords.some(keyword => combined.includes(keyword))
}

function isConsultationUpdate(update) {
  const headline = (update.headline || '').toLowerCase()
  const summary = (update.ai_summary || update.aiSummary || update.summary || update.impact || '').toLowerCase()
  return headline.includes('consultation') || summary.includes('consultation') || (update.contentType || update.content_type || '').toLowerCase().includes('consult')
}

function extractTags(update) {
  if (Array.isArray(update.aiTags)) return update.aiTags
  if (Array.isArray(update.ai_tags)) return update.ai_tags
  if (Array.isArray(update.tags)) return update.tags
  return []
}

function analyzeAuthorityMomentum(updates, authority) {
  const now = new Date()
  const weekAgo = new Date(now)
  weekAgo.setDate(now.getDate() - 7)
  const previousWeekStart = new Date(weekAgo)
  previousWeekStart.setDate(previousWeekStart.getDate() - 7)

  let currentWeek = 0
  let previousWeek = 0
  let enforcementCount = 0
  let highImpactCount = 0
  let consultationCount = 0
  let coordinationMatches = 0

  const authorityLower = (authority || '').toLowerCase()

  updates.forEach(update => {
    const published = normalizeDateValue(update)
    if (published) {
      if (published >= weekAgo) {
        currentWeek += 1
      } else if (published >= previousWeekStart) {
        previousWeek += 1
      }
    }

    if (isEnforcementUpdate(update)) enforcementCount += 1
    if ((update.impactLevel || update.impact_level || '').toLowerCase() === 'significant') {
      highImpactCount += 1
    }
    if (isConsultationUpdate(update)) consultationCount += 1

    const summaryText = (update.ai_summary || update.aiSummary || update.summary || update.impact || '').toLowerCase()
    const headlineText = (update.headline || '').toLowerCase()
    const combined = `${summaryText} ${headlineText}`
    const coordinationHit = KNOWN_AUTHORITIES.some(target => {
      const lowerTarget = target.toLowerCase()
      if (!lowerTarget || lowerTarget === authorityLower) return false
      return combined.includes(lowerTarget)
    })
    if (coordinationHit) coordinationMatches += 1
  })

  const total = updates.length || 1
  const trendDelta = currentWeek - previousWeek
  const enforcementRatio = Math.round((enforcementCount / total) * 100)
  const highImpactRatio = Math.round((highImpactCount / total) * 100)
  const consultationRatio = Math.round((consultationCount / total) * 100)
  const coordinationScore = updates.length
    ? Math.min(100, Math.round((coordinationMatches / updates.length) * 120))
    : 0

  let trendLabel = 'stable'
  if (trendDelta > 0) trendLabel = 'rising'
  if (trendDelta < 0) trendLabel = 'cooling'

  const alerts = []
  if (currentWeek >= 6) {
    alerts.push({ type: 'Velocity Spike', message: 'High publication velocity this week', severity: 'High' })
  } else if (currentWeek >= 4) {
    alerts.push({ type: 'Elevated Velocity', message: 'Noticeable increase in publications', severity: 'Medium' })
  }
  if (enforcementRatio >= 30) {
    alerts.push({ type: 'Enforcement Watch', message: 'Enforcement ratio above 30%', severity: 'Medium' })
  }
  if (coordinationScore >= 50) {
    alerts.push({ type: 'Joint Thematics', message: 'Cross-authority references increasing', severity: 'Medium' })
  }

  return {
    currentWeek,
    previousWeek,
    trendDelta,
    trendLabel,
    enforcementRatio,
    highImpactRatio,
    consultationRatio,
    coordinationScore,
    alerts
  }
}

function extractTopicSignals(updates) {
  const now = new Date()
  const weekAgo = new Date(now)
  weekAgo.setDate(now.getDate() - 7)

  const recentCounts = new Map()
  const priorCounts = new Map()

  updates.forEach(update => {
    const published = normalizeDateValue(update)
    const tags = extractTags(update)
    if (tags.length === 0) return

    const targetMap = published && published >= weekAgo ? recentCounts : priorCounts

    tags.forEach(tag => {
      if (!tag) return
      const key = String(tag).trim()
      if (!key) return
      targetMap.set(key, (targetMap.get(key) || 0) + 1)
    })
  })

  const topics = new Map()
  const allKeys = new Set([...recentCounts.keys(), ...priorCounts.keys()])

  allKeys.forEach(key => {
    const recent = recentCounts.get(key) || 0
    const previous = priorCounts.get(key) || 0
    const change = recent - previous
    let status = 'Stable'

    if (recent >= 2 && recent >= previous * 1.5) status = 'Emerging'
    else if (previous >= 2 && recent === 0) status = 'Cooling'
    else if (change > 0) status = 'Growing'
    else if (change < 0) status = 'Declining'

    topics.set(key, {
      topic: key,
      recent,
      previous,
      change,
      status
    })
  })

  return Array.from(topics.values())
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change) || b.recent - a.recent)
    .slice(0, 6)
    .map(topic => ({
      ...topic,
      explanation: buildTopicExplanation(topic)
    }))
}

function buildTopicExplanation(topic) {
  if (topic.status === 'Emerging') {
    return 'Sharp rise in coverage this week; prepare narratives.'
  }
  if (topic.status === 'Growing') {
    return 'Momentum building across successive updates.'
  }
  if (topic.status === 'Cooling' || topic.status === 'Declining') {
    return 'Activity slowing; monitor but deprioritise.'
  }
  return 'Steady presence across recent publications.'
}

function buildForecastCards(authority, momentum, topics) {
  const emergingTopics = topics.filter(t => t.status === 'Emerging' || t.status === 'Growing')
  const topTopics = emergingTopics.slice(0, 2).map(t => t.topic)
  const topicPhrase = topTopics.length > 0 ? topTopics.join(', ') : 'core priorities'

  const enforcementTone = momentum.enforcementRatio >= 35
    ? 'Expect heightened enforcement communications.'
    : momentum.enforcementRatio >= 20
      ? 'Maintain readiness for thematic enforcement updates.'
      : 'Enforcement cadence remains steady.'

  const coordinationTone = momentum.coordinationScore >= 50
    ? 'Joint regulator messaging likely; align cross-team responses.'
    : momentum.coordinationScore >= 30
      ? 'Watch for collaborative statements across regulators.'
      : 'Limited coordination signals detected this week.'

  const velocityDescriptor = momentum.trendLabel === 'rising'
    ? 'above-average publication velocity'
    : momentum.trendLabel === 'cooling'
      ? 'a lighter cadence than last week'
      : 'steady publication cadence'

  const confidence = momentum.currentWeek >= 5 ? 'High' : momentum.currentWeek >= 3 ? 'Medium' : 'Low'

  return [
    {
      title: 'Next 7 Days Outlook',
      confidence,
      narrative: `Expect ${velocityDescriptor} from ${authority}. ${enforcementTone}`,
      actions: [
        momentum.trendLabel === 'rising'
          ? 'Schedule daily triage to capture high-velocity updates.'
          : 'Maintain twice-weekly review cadence.',
        momentum.enforcementRatio >= 25
          ? 'Brief enforcement response leads on likely follow-up.'
          : 'Focus analyst coverage on thematic developments.'
      ]
    },
    {
      title: 'What Changed This Week',
      confidence: 'Medium',
      narrative: `${authority} momentum is ${momentum.trendLabel}. Emerging focus areas: ${topicPhrase}. ${coordinationTone}`,
      actions: topTopics.length > 0
        ? topTopics.map(topic => `Prepare talking points for ${topic}.`)
        : ['No major thematic shifts detected; reinforce ongoing priorities.']
    },
    {
      title: 'Operational Focus',
      confidence: 'Medium',
      narrative: 'Translate signals into workflow priorities for stakeholder teams.',
      actions: [
        momentum.alerts.length > 0
          ? 'Trigger playbooks for highlighted alerts and notify accountable owners.'
          : 'No alert thresholds crossed; continue standard monitoring.',
        'Update leadership briefing deck with latest momentum visuals.'
      ]
    }
  ]
}

function buildAuthorityRecommendations(momentum, topics) {
  const alerts = momentum.alerts.map(alert => ({
    title: alert.type,
    severity: alert.severity,
    message: alert.message
  }))

  const actionItems = []
  if (momentum.trendLabel === 'rising') {
    actionItems.push('Escalate monitoring cadence for this authority to daily triage.')
  } else if (momentum.trendLabel === 'cooling') {
    actionItems.push('Consider reallocating analyst time to other regulators if cadence stays low.')
  }

  if (momentum.enforcementRatio >= 25) {
    actionItems.push('Share enforcement summary with legal/compliance partners.')
  }
  if (momentum.coordinationScore >= 40) {
    actionItems.push('Coordinate with public policy leads on cross-authority initiatives.')
  }

  const emergingTopic = topics.find(topic => topic.status === 'Emerging')
  if (emergingTopic) {
    actionItems.push(`Develop briefing note for emerging topic: ${emergingTopic.topic}.`)
  }

  return { alerts, actionItems }
}

function deriveAuthorityInsights(updates, authority) {
  const momentum = analyzeAuthorityMomentum(updates, authority)
  const topics = extractTopicSignals(updates)
  const forecasts = buildForecastCards(authority, momentum, topics)
  const recommendations = buildAuthorityRecommendations(momentum, topics)

  return { momentum, topics, forecasts, recommendations }
}

function buildMixSeries(counts, total, labels) {
  return Object.keys(labels).map(key => {
    const count = counts[key] || 0
    const percentage = total ? Math.round((count / total) * 100) : 0
    return {
      key,
      label: labels[key],
      count,
      percentage
    }
  })
}

function buildAuthorityPulse(updates = []) {
  const now = new Date()
  const dayMs = 24 * 60 * 60 * 1000
  const bucketCount = 8
  const velocityCounts = new Array(bucketCount).fill(0)

  updates.forEach(update => {
    const published = normalizeDateValue(update)
    if (!published) return
    const diffDays = Math.floor((now - published) / dayMs)
    if (diffDays < 0) return
    const bucket = Math.floor(diffDays / 7)
    if (bucket >= 0 && bucket < bucketCount) {
      velocityCounts[bucket] += 1
    }
  })

  const maxVelocity = Math.max(...velocityCounts, 1)
  const velocityWeeks = velocityCounts.map((count, bucket) => {
    const labelDate = new Date(now)
    labelDate.setDate(now.getDate() - (bucket * 7 + 6))
    const label = labelDate.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
    const intensity = count === 0 ? 6 : Math.max(12, Math.round((count / maxVelocity) * 100))
    return { label, count, intensity }
  }).reverse()

  const impactCounts = { significant: 0, moderate: 0, informational: 0 }
  updates.forEach(update => {
    const level = (update.impactLevel || update.impact_level || '').toLowerCase()
    const score = Number(update.businessImpactScore || update.business_impact_score || 0)
    if (level.includes('significant') || score >= 7) {
      impactCounts.significant += 1
    } else if (level.includes('moderate') || score >= 4) {
      impactCounts.moderate += 1
    } else {
      impactCounts.informational += 1
    }
  })

  let enforcementCount = 0
  let consultationCount = 0
  let otherCount = 0
  updates.forEach(update => {
    if (isEnforcementUpdate(update)) {
      enforcementCount += 1
    } else if (isConsultationUpdate(update)) {
      consultationCount += 1
    } else {
      otherCount += 1
    }
  })

  const total = updates.length
  const impactMix = buildMixSeries(impactCounts, total, {
    significant: 'Significant',
    moderate: 'Moderate',
    informational: 'Informational'
  })

  const intentMix = buildMixSeries({
    enforcement: enforcementCount,
    consultation: consultationCount,
    other: otherCount
  }, total, {
    enforcement: 'Enforcement',
    consultation: 'Consultations',
    other: 'Guidance / Other'
  })

  return { velocityWeeks, impactMix, intentMix }
}

function renderAuthorityDirectory(authorityIndex = [], selectedAuthority = '') {
  if (!authorityIndex.length) {
    return `<div class="empty-state"><p>No authorities available yet.</p></div>`
  }

  return authorityIndex.map(item => {
    const isActive = String(item.id) === String(selectedAuthority)
    const count = Number(item.count) || 0
    const logoSrc = item.logo ? escapeHtml(item.logo) : ''
    const logoAlt = escapeHtml(item.logoAlt || item.name || item.id || '')
    const logoMarkup = logoSrc
      ? `<img src="${logoSrc}" alt="${logoAlt}" loading="lazy">`
      : `<span class="authority-logo__text">${escapeHtml(item.code || item.id || '')}</span>`
    const logoClass = logoSrc ? 'authority-logo has-image' : 'authority-logo'
    return `
      <a href="/authority-spotlight/${encodeURIComponent(item.id)}" class="authority-list-item ${isActive ? 'active' : ''}">
        <span class="authority-detail">
          <span class="${logoClass}">${logoMarkup}</span>
          <span class="authority-name">${escapeHtml(item.label || item.name || item.id)}</span>
        </span>
        <span class="authority-count">${count.toLocaleString()}</span>
      </a>
    `
  }).join('')
}

function renderAcronymDirectory(acronymIndex = [], selectedAuthority = '') {
  if (!acronymIndex.length) {
    return `<div class="empty-state"><p>No acronyms available yet.</p></div>`
  }

  return acronymIndex.map(item => {
    const isActive = String(item.id) === String(selectedAuthority)
    const code = item.code || item.id
    return `
      <a href="/authority-spotlight/${encodeURIComponent(item.id)}" class="acronym-item ${isActive ? 'active' : ''}">
        <span class="acronym-code">${escapeHtml(code)}</span>
        <span class="acronym-name">${escapeHtml(item.name)}</span>
      </a>
    `
  }).join('')
}

function renderRegulatorTimeline(profiles = [], selectedAuthority = '') {
  if (!profiles.length) return ''
  const sortedProfiles = [...profiles].sort((a, b) => a.formedYear - b.formedYear)

  return sortedProfiles.map(profile => {
    const isActive = profile.id === selectedAuthority ? 'active' : ''
    const colors = profile.colors || ['#0f172a', '#94a3b8']
    return `
      <div class="timeline-item ${isActive}" style="--logo-start: ${colors[0]}; --logo-end: ${colors[1]};">
        <div class="timeline-dot"></div>
        <div class="timeline-card">
          <span class="timeline-year">${escapeHtml(profile.formedYear)}</span>
          <span class="timeline-acronym">${escapeHtml(profile.acronym)}</span>
          <span class="timeline-name">${escapeHtml(profile.name)}</span>
        </div>
      </div>
    `
  }).join('')
}

function renderRegulatorProfiles(profiles = [], selectedAuthority = '') {
  if (!profiles.length) {
    return `<div class="empty-state"><p>No regulator profiles are available yet.</p></div>`
  }

  return profiles.map(profile => {
    const isActive = profile.id === selectedAuthority ? 'active' : ''
    const colors = profile.colors || ['#0f172a', '#94a3b8']
    const logoSrc = profile.logo ? escapeHtml(profile.logo) : ''
    const logoAlt = escapeHtml(profile.logoAlt || profile.name || profile.acronym || '')
    const logoMarkup = logoSrc
      ? `<img src="${logoSrc}" alt="${logoAlt}" loading="lazy">`
      : escapeHtml(profile.acronym)
    const logoClass = profile.logo ? 'regulator-logo has-image' : 'regulator-logo'

    return `
      <div
        class="regulator-card ${isActive}"
        role="button"
        tabindex="0"
        data-acronym="${escapeHtml(profile.acronym)}"
        data-name="${escapeHtml(profile.name)}"
        data-formed="${escapeHtml(profile.formed)}"
        data-location="${escapeHtml(profile.location)}"
        data-remit="${escapeHtml(profile.remit)}"
        data-leader="${escapeHtml(profile.leader)}"
        data-explainer="${escapeHtml(profile.explainer)}"
        data-bio="${escapeHtml(profile.bio)}"
        data-logo="${logoSrc}"
        data-logo-alt="${logoAlt}"
        data-logo-start="${escapeHtml(colors[0])}"
        data-logo-end="${escapeHtml(colors[1])}"
        style="--logo-start: ${colors[0]}; --logo-end: ${colors[1]};">
        <div class="regulator-card__header">
          <div class="${logoClass}">${logoMarkup}</div>
          <div>
            <span class="regulator-acronym">${escapeHtml(profile.acronym)}</span>
            <h3 class="regulator-name">${escapeHtml(profile.name)}</h3>
          </div>
        </div>
        <p class="regulator-explainer">${escapeHtml(profile.explainer)}</p>
        <div class="regulator-meta">
          <span>Formed ${escapeHtml(profile.formedYear)}</span>
          <span>${escapeHtml(profile.location)}</span>
        </div>
        <span class="regulator-cta">View profile</span>
      </div>
    `
  }).join('')
}

async function renderAuthoritySpotlightPage(req, res, authority = 'FCA') {
  try {
    console.log(`Authority Rendering authority spotlight page for: ${authority}`)

    const normalizedAuthority = normalizeAuthorityName(authority) || authority
    const authorityRecord = resolveAuthorityRecord(authority) || resolveAuthorityRecord(normalizedAuthority)
    const authorityQuery = authorityRecord
      ? Array.from(new Set([authorityRecord.id, authorityRecord.name, ...(authorityRecord.aliases || [])].filter(Boolean)))
      : [normalizedAuthority]
    const reportAuthority = authorityRecord ? authorityRecord.id : normalizedAuthority

    const [authorityUpdates, filterOptions] = await Promise.all([
      dbService.getEnhancedUpdates({
        authority: authorityQuery,
        limit: 50
      }),
      dbService.getFilterOptions().catch(() => ({ authorities: [] }))
    ])

    const authorityIndex = getAuthorityIndex(filterOptions.authorities || [])
    const acronymIndex = getAcronymIndex(filterOptions.authorities || [])
    const selectedAuthorityId = normalizeAuthorityName(authority)

    // Calculate authority statistics
    const stats = calculateAuthorityStats(authorityUpdates, authority)
    const insights = deriveAuthorityInsights(authorityUpdates, authority)
    const { momentum, topics, forecasts, recommendations } = insights
    const pulse = buildAuthorityPulse(authorityUpdates)
    const { velocityWeeks, impactMix, intentMix } = pulse
    const impactHighlight = impactMix.find(item => item.key === 'significant') || { count: 0, percentage: 0 }
    const intentHighlight = intentMix.find(item => item.key === 'enforcement') || { count: 0, percentage: 0 }
    const chartPayload = {
      velocity: {
        labels: velocityWeeks.map(week => week.label),
        data: velocityWeeks.map(week => week.count)
      },
      impact: {
        labels: impactMix.map(item => item.label),
        data: impactMix.map(item => item.count)
      },
      intent: {
        labels: intentMix.map(item => item.label),
        data: intentMix.map(item => item.count)
      }
    }
    const chartPayloadJson = JSON.stringify(chartPayload).replace(/</g, '\\u003c')
    const momentumLabel = momentum.trendLabel.charAt(0).toUpperCase() + momentum.trendLabel.slice(1)
    const regulatorProfiles = REGULATOR_PROFILES
    const regulatorTimeline = renderRegulatorTimeline(regulatorProfiles, selectedAuthorityId)
    const regulatorCards = renderRegulatorProfiles(regulatorProfiles, selectedAuthorityId)

    // Get sidebar
    const sidebar = await getSidebar('authority-spotlight')

    // Generate canary icon
    const canaryStyles = getCanaryAnimationStyles()
    const pageIcon = wrapIconInContainer(getSpotlightIcon())

    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${authority} Authority Spotlight - Regulatory Intelligence Platform</title>
            ${getCommonStyles()}
            <style>
                ${canaryStyles}
                .spotlight-header {
                    background: #ffffff;
                    color: #0f172a;
                    padding: 32px;
                    border-radius: 18px;
                    margin-bottom: 32px;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 24px 48px -28px rgba(15, 23, 42, 0.25);
                }

                .authority-title {
                    font-size: 2.25rem;
                    font-weight: 700;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: #0f172a;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-top: 30px;
                }

                .stat-card {
                    background: #f8fafc;
                    padding: 20px;
                    border-radius: 14px;
                    text-align: center;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
                }

                .stat-card strong {
                    color: #1d4ed8;
                }

                .stat-value {
                    font-size: 2rem;
                    font-weight: 700;
                    margin-bottom: 6px;
                    color: #0f172a;
                }

                .stat-label {
                    font-size: 0.9rem;
                    color: #475569;
                }

                .momentum-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 18px;
                }

                .momentum-card {
                    background: #f8fafc;
                    padding: 20px;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
                }

                .metric-label {
                    text-transform: uppercase;
                    font-size: 0.75rem;
                    letter-spacing: 0.08em;
                    color: #64748b;
                    margin-bottom: 8px;
                }

                .metric-value {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #1f2937;
                    margin-bottom: 6px;
                }

                .metric-subtext {
                    font-size: 0.85rem;
                    color: #6b7280;
                }

                .trend-badge {
                    display: inline-flex;
                    align-items: center;
                    padding: 6px 12px;
                    border-radius: 999px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    margin-top: 12px;
                }

                .trend-badge.rising {
                    background: #ecfdf5;
                    color: #047857;
                }

                .trend-badge.stable {
                    background: #f3f4f6;
                    color: #4b5563;
                }

                .trend-badge.cooling {
                    background: #fef2f2;
                    color: #b91c1c;
                }

                .charts-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 20px;
                    margin-top: 18px;
                }

                @media (max-width: 1024px) {
                    .charts-grid {
                        grid-template-columns: 1fr;
                    }
                }

                .chart-card {
                    background: #ffffff;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    border: 1px solid #e2e8f0;
                }

                .chart-card-full {
                    grid-column: span 2;
                }

                @media (max-width: 1024px) {
                    .chart-card-full {
                        grid-column: span 1;
                    }
                }

                .chart-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 16px;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .chart-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: #0f172a;
                    margin: 0 0 4px 0;
                }

                .chart-subtitle {
                    font-size: 13px;
                    color: #64748b;
                    margin: 0;
                }

                .chart-callout {
                    font-size: 12px;
                    color: #64748b;
                    padding: 6px 12px;
                    background: #f8fafc;
                    border-radius: 6px;
                    border: 1px solid #e2e8f0;
                }

                .callout-highlight {
                    font-weight: 600;
                    color: #0f172a;
                }

                .chart-wrapper {
                    height: 250px;
                    position: relative;
                }

                .chart-empty {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 220px;
                    color: #64748b;
                    font-style: italic;
                    background: #f8fafc;
                    border-radius: 12px;
                    border: 1px dashed #e2e8f0;
                }

                .topic-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 16px;
                }

                .topic-card {
                    background: #f9fafb;
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                    padding: 16px;
                }

                .topic-title {
                    font-weight: 600;
                    color: #1f2937;
                    margin-bottom: 6px;
                }

                .topic-status {
                    display: inline-flex;
                    padding: 4px 10px;
                    border-radius: 999px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    margin-bottom: 8px;
                }

                .topic-card.status-emerging .topic-status,
                .topic-card.status-growing .topic-status {
                    background: #ecfdf5;
                    color: #047857;
                }

                .topic-card.status-cooling .topic-status,
                .topic-card.status-declining .topic-status {
                    background: #fef2f2;
                    color: #b91c1c;
                }

                .topic-card.status-stable .topic-status {
                    background: #f3f4f6;
                    color: #4b5563;
                }

                .topic-metric {
                    font-size: 0.8rem;
                    color: #6b7280;
                    margin-bottom: 6px;
                }

                .topic-note {
                    font-size: 0.85rem;
                    color: #475569;
                    line-height: 1.4;
                }

                .forecast-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
                    gap: 18px;
                }

                .forecast-card {
                    background: #ffffff;
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08);
                }

                .forecast-title {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: #1f2937;
                    margin-bottom: 12px;
                }

                .forecast-confidence {
                    font-size: 0.75rem;
                    padding: 4px 10px;
                    border-radius: 999px;
                    background: #eef2ff;
                    color: #4338ca;
                    font-weight: 600;
                }

                .forecast-narrative {
                    font-size: 0.9rem;
                    color: #374151;
                    line-height: 1.5;
                    margin-bottom: 12px;
                }

                .forecast-actions {
                    list-style: disc;
                    padding-left: 20px;
                    margin: 0;
                    color: #1f2937;
                    font-size: 0.9rem;
                }

                .forecast-actions li {
                    margin-bottom: 6px;
                }

                .alert-badges {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                    margin-top: 16px;
                }

                .alert-badge {
                    padding: 6px 12px;
                    border-radius: 999px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .alert-badge.high {
                    background: #fee2e2;
                    color: #b91c1c;
                }

                .alert-badge.medium {
                    background: #fef3c7;
                    color: #92400e;
                }

                .alert-badge.low {
                    background: #dbeafe;
                    color: #1d4ed8;
                }

                .action-list {
                    margin-top: 24px;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 20px;
                }

                .action-title {
                    font-size: 1rem;
                    font-weight: 700;
                    color: #1f2937;
                    margin-bottom: 12px;
                }

                .action-list ul {
                    margin: 0;
                    padding-left: 18px;
                    color: #1f2937;
                    font-size: 0.95rem;
                }

                .action-list li {
                    margin-bottom: 8px;
                }

                .content-section {
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.08);
                    margin-bottom: 20px;
                }

                .section-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #1f2937;
                    margin-bottom: 20px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .update-item {
                    background: #f9fafb;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 15px;
                    border-left: 4px solid #667eea;
                }

                .update-headline {
                    font-weight: 600;
                    color: #1f2937;
                    margin-bottom: 10px;
                    line-height: 1.4;
                }

                .update-meta {
                    display: flex;
                    gap: 15px;
                    font-size: 0.85rem;
                    color: #6b7280;
                    flex-wrap: wrap;
                }

                .impact-badge {
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 0.7rem;
                    font-weight: 500;
                    text-transform: uppercase;
                }

                .impact-significant {
                    background: #fef2f2;
                    color: #dc2626;
                }

                .impact-moderate {
                    background: #fffbeb;
                    color: #d97706;
                }

                .impact-informational {
                    background: #f0f9ff;
                    color: #0284c7;
                }

                .back-link {
                    display: inline-block;
                    color: rgba(255,255,255,0.8);
                    text-decoration: none;
                    margin-bottom: 20px;
                    transition: color 0.15s ease;
                }

                .back-link:hover {
                    color: white;
                }

                .authority-selector {
                    display: flex;
                    gap: 10px;
                    margin-top: 20px;
                    flex-wrap: wrap;
                }

                .section-subtitle {
                    margin-top: -8px;
                    margin-bottom: 20px;
                    color: #64748b;
                    font-size: 0.95rem;
                }

                .authority-directory-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
                    gap: 20px;
                }

                .authority-directory-panel {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 18px;
                }

                .subsection-title {
                    font-size: 1rem;
                    font-weight: 700;
                    color: #1f2937;
                    margin-bottom: 12px;
                }

                .authority-list,
                .acronym-list {
                    display: grid;
                    gap: 10px;
                }

                .authority-list-item,
                .acronym-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 10px;
                    padding: 10px 12px;
                    border-radius: 10px;
                    border: 1px solid #e2e8f0;
                    background: #ffffff;
                    color: #0f172a;
                    text-decoration: none;
                    transition: all 0.2s ease;
                }

                .authority-list-item:hover,
                .acronym-item:hover {
                    border-color: #6366f1;
                    background: #eef2ff;
                    color: #1e1b4b;
                }

                .authority-list-item.active,
                .acronym-item.active {
                    border-color: #4f46e5;
                    background: #e0e7ff;
                }

                .authority-detail {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    min-width: 0;
                }

                .authority-logo {
                    width: 34px;
                    height: 34px;
                    border-radius: 8px;
                    background: #f1f5f9;
                    border: 1px solid #e2e8f0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.7rem;
                    font-weight: 700;
                    color: #475569;
                    overflow: hidden;
                    flex: 0 0 auto;
                }

                .authority-logo.has-image {
                    background: #ffffff;
                }

                .authority-logo img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }

                .authority-logo__text {
                    padding: 0 6px;
                    text-align: center;
                }

                .authority-name {
                    font-weight: 600;
                    font-size: 0.9rem;
                    min-width: 0;
                }

                .authority-count {
                    font-size: 0.75rem;
                    color: #64748b;
                    background: #f8fafc;
                    border-radius: 999px;
                    padding: 2px 8px;
                    border: 1px solid #e2e8f0;
                }

                .acronym-code {
                    font-weight: 700;
                    color: #1d4ed8;
                    font-size: 0.9rem;
                }

                .acronym-name {
                    font-size: 0.85rem;
                    color: #475569;
                    text-align: right;
                }

                .header-actions {
                    margin-top: 20px;
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                }

                .authority-btn {
                    padding: 8px 16px;
                    background: rgba(255,255,255,0.2);
                    color: white;
                    text-decoration: none;
                    border-radius: 20px;
                    font-size: 0.9rem;
                    transition: all 0.2s ease;
                }

                .authority-btn:hover,
                .authority-btn.active {
                    background: white;
                    color: #667eea;
                }

                .empty-state {
                    text-align: center;
                    padding: 40px;
                    color: #6b7280;
                }

                .spotlight-tabs {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    margin: 24px 0 16px;
                }

                .spotlight-tab {
                    border: 1px solid #e2e8f0;
                    background: #f8fafc;
                    color: #0f172a;
                    padding: 10px 18px;
                    border-radius: 999px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .spotlight-tab.active {
                    background: linear-gradient(135deg, #1d4ed8, #38bdf8);
                    color: #fff;
                    border-color: transparent;
                    box-shadow: 0 12px 24px rgba(37, 99, 235, 0.25);
                }

                .spotlight-tab-panel {
                    display: none;
                }

                .spotlight-tab-panel.active {
                    display: block;
                    animation: panelFade 0.25s ease;
                }

                @keyframes panelFade {
                    from {
                        opacity: 0;
                        transform: translateY(6px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .timeline-shell {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 18px;
                    padding: 20px;
                }

                .timeline-track {
                    position: relative;
                    display: grid;
                    grid-auto-flow: column;
                    grid-auto-columns: minmax(200px, 1fr);
                    gap: 18px;
                    overflow-x: auto;
                    padding: 10px 0 6px;
                    scroll-snap-type: x mandatory;
                }

                .timeline-track::before {
                    content: '';
                    position: absolute;
                    top: 18px;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: linear-gradient(90deg, rgba(59, 130, 246, 0.2), rgba(15, 23, 42, 0.2));
                }

                .timeline-item {
                    position: relative;
                    padding-top: 8px;
                    scroll-snap-align: start;
                }

                .timeline-item.active .timeline-card {
                    border-color: #2563eb;
                    box-shadow: 0 16px 32px rgba(37, 99, 235, 0.16);
                }

                .timeline-dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 999px;
                    background: linear-gradient(135deg, var(--logo-start, #1d4ed8), var(--logo-end, #38bdf8));
                    box-shadow: 0 6px 16px rgba(15, 23, 42, 0.2);
                    margin-bottom: 12px;
                }

                .timeline-card {
                    background: #fff;
                    border: 1px solid #e2e8f0;
                    border-radius: 14px;
                    padding: 12px 14px;
                    display: grid;
                    gap: 6px;
                    box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08);
                }

                .timeline-year {
                    font-weight: 700;
                    color: #0f172a;
                }

                .timeline-acronym {
                    font-size: 0.8rem;
                    letter-spacing: 0.15em;
                    text-transform: uppercase;
                    color: #475569;
                }

                .timeline-name {
                    font-size: 0.85rem;
                    color: #64748b;
                }

                .regulator-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: 20px;
                    margin-top: 20px;
                }

                .regulator-card {
                    background: #fff;
                    border: 1px solid #e2e8f0;
                    border-radius: 18px;
                    padding: 18px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    position: relative;
                    overflow: hidden;
                }

                .regulator-card::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle at top right, rgba(56, 189, 248, 0.15), transparent 60%);
                    opacity: 0;
                    transition: opacity 0.2s ease;
                }

                .regulator-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 18px 28px rgba(15, 23, 42, 0.16);
                    border-color: rgba(37, 99, 235, 0.4);
                }

                .regulator-card:hover::after {
                    opacity: 1;
                }

                .regulator-card.active {
                    border-color: #1d4ed8;
                    box-shadow: 0 18px 32px rgba(29, 78, 216, 0.16);
                }

                .regulator-card__header {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                }

                .regulator-logo {
                    width: 54px;
                    height: 54px;
                    border-radius: 16px;
                    display: grid;
                    place-items: center;
                    font-weight: 700;
                    color: #fff;
                    background: linear-gradient(135deg, var(--logo-start, #1d4ed8), var(--logo-end, #38bdf8));
                    letter-spacing: 0.08em;
                    z-index: 1;
                    padding: 8px;
                }

                .regulator-logo.has-image {
                    background: #fff;
                    border: 1px solid #e2e8f0;
                    color: #0f172a;
                }

                .regulator-logo img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }

                .regulator-acronym {
                    font-size: 0.72rem;
                    letter-spacing: 0.2em;
                    text-transform: uppercase;
                    color: #64748b;
                }

                .regulator-name {
                    margin: 4px 0 0;
                    font-size: 1.05rem;
                    font-weight: 700;
                    color: #0f172a;
                }

                .regulator-explainer {
                    margin: 0;
                    color: #475569;
                    line-height: 1.5;
                    font-size: 0.93rem;
                }

                .regulator-meta {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    font-size: 0.78rem;
                    color: #64748b;
                }

                .regulator-cta {
                    margin-top: auto;
                    font-weight: 600;
                    color: #1d4ed8;
                    z-index: 1;
                }

                .profile-modal {
                    position: fixed;
                    inset: 0;
                    display: none;
                    align-items: center;
                    justify-content: center;
                    background: rgba(15, 23, 42, 0.55);
                    padding: 20px;
                    z-index: 1200;
                }

                .profile-modal.active {
                    display: flex;
                }

                body.modal-open {
                    overflow: hidden;
                }

                .profile-modal__overlay {
                    position: absolute;
                    inset: 0;
                }

                .profile-modal__content {
                    position: relative;
                    background: #fff;
                    border-radius: 24px;
                    padding: 28px;
                    width: min(92vw, 720px);
                    box-shadow: 0 30px 60px rgba(15, 23, 42, 0.3);
                    animation: modalIn 0.2s ease;
                    z-index: 1;
                }

                .profile-modal__header {
                    display: flex;
                    gap: 16px;
                    align-items: flex-start;
                }

                .profile-modal__logo {
                    width: 64px;
                    height: 64px;
                    border-radius: 18px;
                    display: grid;
                    place-items: center;
                    font-weight: 700;
                    color: #fff;
                    background: linear-gradient(135deg, var(--logo-start, #1d4ed8), var(--logo-end, #38bdf8));
                    letter-spacing: 0.08em;
                    padding: 8px;
                }

                .profile-modal__logo.has-image {
                    background: #fff;
                    border: 1px solid #e2e8f0;
                    color: #0f172a;
                }

                .profile-modal__logo img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }

                .profile-modal__title {
                    margin: 0;
                    font-size: 1.5rem;
                    color: #0f172a;
                }

                .profile-modal__explainer {
                    margin: 6px 0 0;
                    color: #475569;
                }

                .profile-modal__meta {
                    margin-top: 18px;
                    display: grid;
                    gap: 12px;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                }

                .modal-meta-card {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 14px;
                    padding: 12px;
                }

                .modal-meta-label {
                    font-size: 0.7rem;
                    letter-spacing: 0.18em;
                    text-transform: uppercase;
                    color: #64748b;
                }

                .modal-meta-value {
                    margin-top: 6px;
                    font-weight: 600;
                    color: #0f172a;
                }

                .profile-modal__bio {
                    margin-top: 18px;
                    color: #334155;
                    line-height: 1.6;
                    font-size: 0.95rem;
                }

                .modal-close {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    border: none;
                    background: #f1f5f9;
                    color: #475569;
                    border-radius: 999px;
                    width: 36px;
                    height: 36px;
                    cursor: pointer;
                    font-size: 1.1rem;
                }

                @keyframes modalIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px) scale(0.98);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                @media (max-width: 720px) {
                    .profile-modal__header {
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .timeline-track {
                        grid-auto-columns: minmax(170px, 1fr);
                    }
                }
            </style>
        </head>
        <body>
            <div class="app-container">
                ${sidebar}

                <main class="main-content">
                    <header class="spotlight-header">
                        <a href="/" class="back-link"><- Back to Home</a>
                        <h1 class="authority-title">
                            ${pageIcon}
                            ${authority} Authority Spotlight
                        </h1>
                        <p>Deep analysis of regulatory patterns, enforcement trends, and policy directions</p>

                        <div class="stats-grid">
                            <div class="stat-card">
                                <div class="stat-value">${stats.totalUpdates}</div>
                                <div class="stat-label">Total Updates</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${stats.highImpact}</div>
                                <div class="stat-label">High Impact</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${stats.recentActivity}</div>
                                <div class="stat-label">This Month</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${stats.avgImpactScore}</div>
                                <div class="stat-label">Avg Impact Score</div>
                            </div>
                        </div>

                        <div class="authority-selector">
                            ${['FCA', 'PRA', 'BoE', 'TPR', 'FATF', 'SFO'].map(auth => {
                              const canonical = normalizeAuthorityName(auth) || auth
                              return `
                                <a href="/authority-spotlight/${auth}" class="authority-btn ${canonical === selectedAuthorityId ? 'active' : ''}">${auth}</a>
                              `
                            }).join('')}
                        </div>

                        <div class="header-actions">
                            <button
                                type="button"
                                class="btn btn-primary"
                                data-authority="${escapeHtml(reportAuthority)}"
                                onclick="ReportModule.exportReport('authority_momentum', { authority: this.dataset.authority, limit: 75 })">
                                Export Authority Momentum Brief
                            </button>
                        </div>
                    </header>

                    <div class="spotlight-tabs" role="tablist" aria-label="Authority spotlight tabs">
                        <button class="spotlight-tab active" type="button" data-spotlight-tab="analysis" aria-selected="true">
                            Momentum & Signals
                        </button>
                        <button class="spotlight-tab" type="button" data-spotlight-tab="directory" aria-selected="false">
                            Authority Directory
                        </button>
                        <button class="spotlight-tab" type="button" data-spotlight-tab="profiles" aria-selected="false">
                            Regulator Profiles
                        </button>
                    </div>

                    <div class="spotlight-tab-panel active" data-spotlight-panel="analysis">
                    <div class="content-section">
                        <h2 class="section-title">
                            Momentum Intelligence
                        </h2>

                        <div class="momentum-grid">
                            <div class="momentum-card">
                                <div class="metric-label">Update Velocity</div>
                                <div class="metric-value">${momentum.currentWeek}</div>
                                <div class="metric-subtext">Prev week: ${momentum.previousWeek}</div>
                                <span class="trend-badge ${momentum.trendLabel}">
                                    ${momentum.trendLabel === 'rising' ? 'Rising' : momentum.trendLabel === 'cooling' ? 'Cooling' : 'Stable'}
                                    (${momentum.trendDelta >= 0 ? '+' : ''}${momentum.trendDelta})
                                </span>
                            </div>
                            <div class="momentum-card">
                                <div class="metric-label">Enforcement Focus</div>
                                <div class="metric-value">${momentum.enforcementRatio}%</div>
                                <div class="metric-subtext">${momentum.highImpactRatio}% high-impact notices</div>
                                <span class="trend-badge ${momentum.enforcementRatio >= 30 ? 'rising' : momentum.enforcementRatio >= 15 ? 'stable' : 'cooling'}">
                                    ${momentum.enforcementRatio >= 30 ? 'Elevated' : momentum.enforcementRatio >= 15 ? 'Moderate' : 'Low'}
                                </span>
                            </div>
                            <div class="momentum-card">
                                <div class="metric-label">Coordination Score</div>
                                <div class="metric-value">${momentum.coordinationScore}</div>
                                <div class="metric-subtext">Cross-authority references</div>
                                <span class="trend-badge ${momentum.coordinationScore >= 50 ? 'rising' : momentum.coordinationScore >= 30 ? 'stable' : 'cooling'}">
                                    ${momentum.coordinationScore >= 50 ? 'Joint focus' : momentum.coordinationScore >= 30 ? 'Building' : 'Limited'}
                                </span>
                            </div>
                            <div class="momentum-card">
                                <div class="metric-label">Consultation Pressure</div>
                                <div class="metric-value">${momentum.consultationRatio}%</div>
                                <div class="metric-subtext">Consultation & call-for-input share</div>
                                <span class="trend-badge ${momentum.consultationRatio >= 20 ? 'rising' : 'stable'}">
                                    ${momentum.consultationRatio >= 20 ? 'High' : 'In range'}
                                </span>
                            </div>
                        </div>

                        ${momentum.alerts.length > 0
? `
                        <div class="alert-badges">
                            ${momentum.alerts.map(alert => `
                                <span class="alert-badge ${alert.severity.toLowerCase()}">${escapeHtml(alert.message)}</span>
                            `).join('')}
                        </div>
                        `
: ''}
                    </div>

                    <div class="content-section">
                        <h2 class="section-title">Regulatory Pulse Charts</h2>
                        <p class="section-subtitle">Visual readout of velocity, impact mix, and intent signals.</p>

                        ${authorityUpdates.length > 0
? `
                        <div class="charts-grid">
                            <div class="chart-card chart-card-full">
                                <div class="chart-header">
                                    <div>
                                        <h3 class="chart-title">Publication Pace</h3>
                                        <p class="chart-subtitle">8-week velocity snapshot</p>
                                    </div>
                                    <div class="chart-callout">
                                        <span class="callout-highlight">This week:</span> ${momentum.currentWeek} updates
                                    </div>
                                </div>
                                <div class="chart-wrapper">
                                    <canvas id="authority-velocity-chart"></canvas>
                                </div>
                            </div>

                            <div class="chart-card">
                                <div class="chart-header">
                                    <div>
                                        <h3 class="chart-title">Impact Mix</h3>
                                        <p class="chart-subtitle">Distribution by impact level</p>
                                    </div>
                                    <div class="chart-callout">
                                        <span class="callout-highlight">Significant:</span> ${impactHighlight.percentage}%
                                    </div>
                                </div>
                                <div class="chart-wrapper">
                                    <canvas id="authority-impact-chart"></canvas>
                                </div>
                            </div>

                            <div class="chart-card">
                                <div class="chart-header">
                                    <div>
                                        <h3 class="chart-title">Update Intent</h3>
                                        <p class="chart-subtitle">Enforcement vs consultation mix</p>
                                    </div>
                                    <div class="chart-callout">
                                        <span class="callout-highlight">Enforcement:</span> ${intentHighlight.percentage}%
                                    </div>
                                </div>
                                <div class="chart-wrapper">
                                    <canvas id="authority-intent-chart"></canvas>
                                </div>
                            </div>
                        </div>
                        `
: `
                        <div class="chart-empty">Not enough recent updates to plot charts for ${escapeHtml(authority)}.</div>
                        `}
                    </div>

                    <div class="content-section">
                        <h2 class="section-title">
                            Topic Shift Radar
                        </h2>

                        ${topics.length > 0
? `
                        <div class="topic-grid">
                            ${topics.map(topic => `
                                <div class="topic-card status-${topic.status.toLowerCase()}">
                                    <div class="topic-title">${escapeHtml(topic.topic)}</div>
                                    <span class="topic-status">${escapeHtml(topic.status)}</span>
                                    <div class="topic-metric">Recent: ${topic.recent} • Prev: ${topic.previous}</div>
                                    <p class="topic-note">${escapeHtml(topic.explanation)}</p>
                                </div>
                            `).join('')}
                        </div>
                        `
: `
                        <div class="empty-state">
                            <p>No recent topic shifts detected for ${escapeHtml(authority)}.</p>
                        </div>
                        `}
                    </div>

                    <div class="content-section">
                        <h2 class="section-title">
                            Forecast & Recommended Actions
                        </h2>

                        <div class="forecast-grid">
                            ${forecasts.map(card => `
                                <div class="forecast-card">
                                    <div class="forecast-title">
                                        ${escapeHtml(card.title)}
                                        <span class="forecast-confidence">${escapeHtml(card.confidence)} confidence</span>
                                    </div>
                                    <p class="forecast-narrative">${escapeHtml(card.narrative)}</p>
                                    ${card.actions && card.actions.length
? `
                                    <ul class="forecast-actions">
                                        ${card.actions.map(action => `<li>${escapeHtml(action)}</li>`).join('')}
                                    </ul>
                                    `
: ''}
                                </div>
                            `).join('')}
                        </div>

                        ${recommendations.actionItems.length > 0
? `
                        <div class="action-list">
                            <h3 class="action-title">Execution Priorities</h3>
                            <ul>
                                ${recommendations.actionItems.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
                            </ul>
                        </div>
                        `
: ''}
                    </div>

                    <div class="content-section">
                        <h2 class="section-title">
                            Target Authority Analysis
                        </h2>
                        <p>This authority has published <strong>${stats.totalUpdates}</strong> regulatory updates with an average impact score of <strong>${stats.avgImpactScore}</strong>.</p>
                        <p>Recent activity shows <strong>${stats.recentActivity}</strong> updates this month, with <strong>${stats.highImpact}</strong> classified as high impact.</p>
                        <p>Momentum is currently <strong>${momentumLabel}</strong> with <strong>${momentum.enforcementRatio}%</strong> enforcement share and a coordination score of <strong>${momentum.coordinationScore}</strong>.</p>
                    </div>

                    <div class="content-section">
                        <h2 class="section-title">
                            Recent Updates from ${authority}
                        </h2>

                        ${authorityUpdates.length > 0
? authorityUpdates.slice(0, 10).map(update => `
                            <div class="update-item">
                                <div class="update-headline">
                                    <a href="${update.url}" target="_blank" style="color: inherit; text-decoration: none;">
                                        ${update.headline}
                                    </a>
                                </div>
                                <div class="update-meta">
                                    <span class="impact-badge impact-${(update.impactLevel || 'informational').toLowerCase()}">
                                        ${update.impactLevel || 'Informational'}
                                    </span>
                                    <span>${new Date(update.fetchedDate || update.createdAt).toLocaleDateString()}</span>
                                    ${update.businessImpactScore ? `<span>Impact: ${update.businessImpactScore}/10</span>` : ''}
                                    ${update.sector || update.primarySectors?.[0] ? `<span>Sector: ${update.sector || update.primarySectors[0]}</span>` : ''}
                                </div>
                            </div>
                        `).join('')
: `
                            <div class="empty-state">
                                <p>No recent updates found for ${authority}</p>
                                <p><a href="/dashboard" style="color: #4f46e5;">View all updates</a></p>
                            </div>
                        `}
                    </div>
                    </div>

                    <div class="spotlight-tab-panel" data-spotlight-panel="directory">
                        <div class="content-section">
                            <h2 class="section-title">Authority Directory</h2>
                            <p class="section-subtitle">A-Z authority list plus quick acronym reference for cross-regulator context.</p>

                            <div class="authority-directory-grid">
                                <div class="authority-directory-panel">
                                    <h3 class="subsection-title">A-Z Directory</h3>
                                    <div class="authority-list">
                                        ${renderAuthorityDirectory(authorityIndex, selectedAuthorityId)}
                                    </div>
                                </div>
                                <div class="authority-directory-panel">
                                    <h3 class="subsection-title">Acronym Index</h3>
                                    <div class="acronym-list">
                                        ${renderAcronymDirectory(acronymIndex, selectedAuthorityId)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="spotlight-tab-panel" data-spotlight-panel="profiles">
                        <div class="content-section">
                            <h2 class="section-title">Regulator Profiles</h2>
                            <p class="section-subtitle">Quick explainers, leadership notes, and formation context for key regulators.</p>

                            <div class="timeline-shell">
                                <h3 class="subsection-title">Regulator Formation Timeline</h3>
                                <div class="timeline-track">
                                    ${regulatorTimeline}
                                </div>
                            </div>

                            <div class="regulator-grid">
                                ${regulatorCards}
                            </div>
                        </div>
                    </div>

                    <div class="profile-modal" id="regulator-modal" aria-hidden="true" role="dialog" aria-modal="true">
                        <div class="profile-modal__overlay" data-modal-close></div>
                        <div class="profile-modal__content">
                            <button class="modal-close" type="button" data-modal-close aria-label="Close">×</button>
                            <div class="profile-modal__header">
                                <div class="profile-modal__logo" id="modal-logo">FCA</div>
                                <div>
                                    <span class="regulator-acronym" id="modal-acronym">FCA</span>
                                    <h3 class="profile-modal__title" id="modal-name">Financial Conduct Authority</h3>
                                    <p class="profile-modal__explainer" id="modal-explainer"></p>
                                </div>
                            </div>
                            <div class="profile-modal__meta">
                                <div class="modal-meta-card">
                                    <div class="modal-meta-label">Formed</div>
                                    <div class="modal-meta-value" id="modal-formed"></div>
                                </div>
                                <div class="modal-meta-card">
                                    <div class="modal-meta-label">Location</div>
                                    <div class="modal-meta-value" id="modal-location"></div>
                                </div>
                                <div class="modal-meta-card">
                                    <div class="modal-meta-label">Who They Regulate</div>
                                    <div class="modal-meta-value" id="modal-remit"></div>
                                </div>
                                <div class="modal-meta-card">
                                    <div class="modal-meta-label">Current Leader</div>
                                    <div class="modal-meta-value" id="modal-leader"></div>
                                </div>
                            </div>
                            <p class="profile-modal__bio" id="modal-bio"></p>
                        </div>
                    </div>

                </main>
            </div>

            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <script>
                (() => {
                    const chartPayload = ${chartPayloadJson}
                    const hasChartData = ${authorityUpdates.length > 0 ? 'true' : 'false'}
                    const tabButtons = document.querySelectorAll('[data-spotlight-tab]')
                    const tabPanels = document.querySelectorAll('[data-spotlight-panel]')

                    const activateTab = (target) => {
                        tabButtons.forEach(button => {
                            const isActive = button.dataset.spotlightTab === target
                            button.classList.toggle('active', isActive)
                            button.setAttribute('aria-selected', isActive ? 'true' : 'false')
                        })

                        tabPanels.forEach(panel => {
                            panel.classList.toggle('active', panel.dataset.spotlightPanel === target)
                        })
                    }

                    tabButtons.forEach(button => {
                        button.addEventListener('click', () => activateTab(button.dataset.spotlightTab))
                    })

                    const modal = document.getElementById('regulator-modal')
                    const cards = document.querySelectorAll('.regulator-card')
                    if (modal && cards.length) {
                        const modalLogo = document.getElementById('modal-logo')
                        const modalAcronym = document.getElementById('modal-acronym')
                        const modalName = document.getElementById('modal-name')
                        const modalExplainer = document.getElementById('modal-explainer')
                        const modalFormed = document.getElementById('modal-formed')
                        const modalLocation = document.getElementById('modal-location')
                        const modalRemit = document.getElementById('modal-remit')
                        const modalLeader = document.getElementById('modal-leader')
                        const modalBio = document.getElementById('modal-bio')
                        const closeButtons = modal.querySelectorAll('[data-modal-close]')
                        const supportsHover = window.matchMedia('(hover: hover)').matches
                        let hoverTimer = null

                        const setLogo = (container, src, alt, fallback) => {
                            if (!container) return
                            container.textContent = ''
                            container.classList.toggle('has-image', Boolean(src))
                            if (src) {
                                const img = document.createElement('img')
                                img.src = src
                                img.alt = alt || fallback || ''
                                img.loading = 'lazy'
                                container.appendChild(img)
                            } else {
                                container.textContent = fallback || ''
                            }
                        }

                        const openModal = (card) => {
                            if (!card) return
                            const dataset = card.dataset
                            setLogo(modalLogo, dataset.logo, dataset.logoAlt, dataset.acronym || '')
                            modalAcronym.textContent = dataset.acronym || ''
                            modalName.textContent = dataset.name || ''
                            modalExplainer.textContent = dataset.explainer || ''
                            modalFormed.textContent = dataset.formed || ''
                            modalLocation.textContent = dataset.location || ''
                            modalRemit.textContent = dataset.remit || ''
                            modalLeader.textContent = dataset.leader || ''
                            modalBio.textContent = dataset.bio || ''
                            modalLogo.style.setProperty('--logo-start', dataset.logoStart || card.style.getPropertyValue('--logo-start'))
                            modalLogo.style.setProperty('--logo-end', dataset.logoEnd || card.style.getPropertyValue('--logo-end'))
                            modal.classList.add('active')
                            modal.setAttribute('aria-hidden', 'false')
                            document.body.classList.add('modal-open')
                        }

                        const closeModal = () => {
                            modal.classList.remove('active')
                            modal.setAttribute('aria-hidden', 'true')
                            document.body.classList.remove('modal-open')
                        }

                        closeButtons.forEach(button => button.addEventListener('click', closeModal))

                        document.addEventListener('keydown', (event) => {
                            if (event.key === 'Escape' && modal.classList.contains('active')) {
                                closeModal()
                            }
                        })

                        cards.forEach(card => {
                            card.addEventListener('click', () => openModal(card))
                            card.addEventListener('keydown', (event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault()
                                    openModal(card)
                                }
                            })

                            if (supportsHover) {
                                card.addEventListener('mouseenter', () => {
                                    if (hoverTimer) clearTimeout(hoverTimer)
                                    hoverTimer = setTimeout(() => openModal(card), 200)
                                })
                                card.addEventListener('mouseleave', () => {
                                    if (hoverTimer) {
                                        clearTimeout(hoverTimer)
                                        hoverTimer = null
                                    }
                                })
                            }
                        })
                    }

                    const renderCharts = () => {
                        if (!hasChartData || !window.Chart) return

                        Chart.defaults.font.family = "'Inter', sans-serif"
                        Chart.defaults.color = '#64748b'

                        const velocityCanvas = document.getElementById('authority-velocity-chart')
                        if (velocityCanvas) {
                            new Chart(velocityCanvas, {
                                type: 'bar',
                                data: {
                                    labels: chartPayload.velocity.labels,
                                    datasets: [{
                                        data: chartPayload.velocity.data,
                                        backgroundColor: '#3b82f6',
                                        borderRadius: 6,
                                        maxBarThickness: 32
                                    }]
                                },
                                options: {
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        x: { grid: { display: false } },
                                        y: { beginAtZero: true, ticks: { precision: 0 } }
                                    }
                                }
                            })
                        }

                        const impactCanvas = document.getElementById('authority-impact-chart')
                        if (impactCanvas) {
                            new Chart(impactCanvas, {
                                type: 'doughnut',
                                data: {
                                    labels: chartPayload.impact.labels,
                                    datasets: [{
                                        data: chartPayload.impact.data,
                                        backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6'],
                                        borderWidth: 0
                                    }]
                                },
                                options: {
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    cutout: '70%',
                                    plugins: {
                                        legend: {
                                            position: 'bottom',
                                            labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 8 }
                                        }
                                    }
                                }
                            })
                        }

                        const intentCanvas = document.getElementById('authority-intent-chart')
                        if (intentCanvas) {
                            new Chart(intentCanvas, {
                                type: 'bar',
                                data: {
                                    labels: chartPayload.intent.labels,
                                    datasets: [{
                                        data: chartPayload.intent.data,
                                        backgroundColor: ['#7c3aed', '#10b981', '#94a3b8'],
                                        borderRadius: 6,
                                        maxBarThickness: 28
                                    }]
                                },
                                options: {
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    indexAxis: 'y',
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        y: { grid: { display: false } },
                                        x: { beginAtZero: true, ticks: { precision: 0 } }
                                    }
                                }
                            })
                        }
                    }

                    renderCharts()
                })()
            </script>

            ${getClientScripts()}
        </body>
        </html>`

    res.send(html)
  } catch (error) {
    console.error('X Error rendering authority spotlight page:', error)
    res.status(500).send(`
            <div style="padding: 2rem; text-align: center; font-family: system-ui;">
                <h1>Authority Spotlight Error</h1>
                <p style="color: #6b7280; margin: 1rem 0;">${error.message}</p>
                <a href="/" style="color: #3b82f6; text-decoration: none;"><- Back to Home</a>
            </div>
        `)
  }
}

function calculateAuthorityStats(updates, authority) {
  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const recentUpdates = updates.filter(update =>
    new Date(update.fetchedDate || update.createdAt) >= thisMonth
  )

  const highImpactUpdates = updates.filter(update =>
    update.impactLevel === 'Significant' || update.businessImpactScore >= 7
  )

  const impactScores = updates
    .filter(update => update.businessImpactScore && update.businessImpactScore > 0)
    .map(update => update.businessImpactScore)

  const avgImpactScore = impactScores.length > 0
    ? Math.round(impactScores.reduce((a, b) => a + b, 0) / impactScores.length * 10) / 10
    : 0

  return {
    totalUpdates: updates.length,
    highImpact: highImpactUpdates.length,
    recentActivity: recentUpdates.length,
    avgImpactScore
  }
}

module.exports = renderAuthoritySpotlightPage
