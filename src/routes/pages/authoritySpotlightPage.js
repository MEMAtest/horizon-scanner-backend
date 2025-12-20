// src/routes/pages/authoritySpotlightPage.js
// Authority Spotlight Page Renderer

const { getCommonStyles } = require('../templates/commonStyles')
const { getSidebar } = require('../templates/sidebar')
const { getClientScripts } = require('../templates/clientScripts')
const dbService = require('../../services/dbService')
const { getSpotlightIcon, wrapIconInContainer, getCanaryAnimationStyles } = require('../../views/icons')

const KNOWN_AUTHORITIES = [
  'FCA', 'PRA', 'BoE', 'PSR', 'TPR', 'FATF', 'SFO',
  'ESMA', 'EBA', 'FSB', 'HM Treasury', 'Treasury Committee', 'OFSI',
  'JMLSG', 'Pay.UK'
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

async function renderAuthoritySpotlightPage(req, res, authority = 'FCA') {
  try {
    console.log(`Authority Rendering authority spotlight page for: ${authority}`)

    // Get authority-specific data
    const authorityUpdates = await dbService.getEnhancedUpdates({
      authority,
      limit: 50
    })

    // Calculate authority statistics
    const stats = calculateAuthorityStats(authorityUpdates, authority)
    const insights = deriveAuthorityInsights(authorityUpdates, authority)
    const { momentum, topics, forecasts, recommendations } = insights
    const momentumLabel = momentum.trendLabel.charAt(0).toUpperCase() + momentum.trendLabel.slice(1)

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
                            ${['FCA', 'PRA', 'BoE', 'TPR', 'FATF', 'SFO'].map(auth => `
                                <a href="/authority-spotlight/${auth}" class="authority-btn ${auth === authority ? 'active' : ''}">${auth}</a>
                            `).join('')}
                        </div>

                        <div class="header-actions">
                            <button
                                type="button"
                                class="btn btn-primary"
                                data-authority="${escapeHtml(authority)}"
                                onclick="ReportModule.exportReport('authority_momentum', { authority: this.dataset.authority, limit: 75 })">
                                Export Authority Momentum Brief
                            </button>
                        </div>
                    </header>

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

                </main>
            </div>

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
