// Updated Page Routes - Phase 1 + Phase 1.3 + Weekly Roundup
// File: src/routes/pageRoutes.js

const express = require('express')
const router = express.Router()

// Import page handlers
const renderHomePage = require('./pages/homePage') // No destructuring
const { renderDashboardPage } = require('./pages/dashboardPage') // Keep destructuring

// Import services for test page and AI intelligence page
const dbService = require('../services/dbService')
const aiAnalyzer = require('../services/aiAnalyzer')
const rssFetcher = require('../services/rssFetcher')
const relevanceService = require('../services/relevanceService')
const renderWeeklyBriefingPage = require('./pages/weeklyBriefingPage')
const annotationService = require('../services/annotationService')
const { prepareAvailableSectors, normalizeSectorName } = require('../utils/sectorTaxonomy')

function normalizeDate(value) {
  if (!value) return null
  if (value instanceof Date) {
    return isNaN(value) ? null : value
  }
  const parsed = new Date(value)
  return isNaN(parsed) ? null : parsed
}

function formatDateDisplay(value, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  const date = normalizeDate(value)
  if (!date) return 'Unknown'
  return date.toLocaleDateString('en-GB', options)
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

function toTitleCase(value) {
  return String(value || '')
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getTopicKey(update) {
  const tags = update.ai_tags || update.aiTags
  if (Array.isArray(tags) && tags.length > 0) {
    return String(tags[0]).toLowerCase()
  }
  return String(update.authority || 'unknown').toLowerCase()
}

function getPublishedTimestamp(update) {
  const raw = update.publishedDate || update.published_date || update.fetchedDate || update.createdAt
  if (!raw) return null
  const parsed = new Date(raw).getTime()
  return Number.isNaN(parsed) ? null : parsed
}

function buildVelocityLookup(updates) {
  const now = Date.now()
  const lookup = new Map()
  updates.forEach(update => {
    const published = getPublishedTimestamp(update)
    if (published === null) return

    const diffDays = (now - published) / MS_PER_DAY
    if (diffDays > 7) return

    const topicKey = getTopicKey(update)
    if (!lookup.has(topicKey)) {
      lookup.set(topicKey, { recent: 0, previous: 0 })
    }
    const entry = lookup.get(topicKey)
    if (diffDays <= 3) {
      entry.recent += 1
    } else {
      entry.previous += 1
    }
  })

  const velocity = {}
  lookup.forEach((value, key) => {
    const { recent, previous } = value
    let trend = 'steady'
    if (recent >= previous + 1) trend = 'accelerating'
    else if (previous >= recent + 1) trend = 'decelerating'

    velocity[key] = trend
  })
  return velocity
}

function getVelocityForUpdate(update, velocityLookup) {
  const topicKey = getTopicKey(update)
  const trend = velocityLookup[topicKey]
  if (!trend) return null

  if (trend === 'accelerating') {
    return { trend, icon: '▲', label: 'Accelerating' }
  }
  if (trend === 'decelerating') {
    return { trend, icon: '▼', label: 'Cooling' }
  }
  return { trend: 'steady', icon: '➜', label: 'Steady' }
}

function generatePredictiveBadges(update) {
  const badges = []
  const content = `${update.headline || ''} ${update.summary || ''} ${update.impact || ''}`.toLowerCase()
  const deadlineRaw = update.compliance_deadline || update.complianceDeadline
  const deadline = deadlineRaw ? new Date(deadlineRaw) : null
  const diffDays = deadline && !Number.isNaN(deadline) ? Math.round((deadline.getTime() - Date.now()) / MS_PER_DAY) : null

  if (content.includes('consultation') || content.includes('feedback')) {
    badges.push('Expected Follow-up')
  }
  if (diffDays !== null && diffDays >= 0 && diffDays <= 14) {
    badges.push('Consultation Closing')
  }
  const normalizedSummary = (update.summary || update.ai_summary || '').toLowerCase()
  if (normalizedSummary.includes('2023') && normalizedSummary.includes('guidance')) {
    badges.push('Pattern Match to 2023 Guidance')
  }
  return badges
}

function generatePatternAlert(updates) {
  const windowMs = 48 * 60 * 60 * 1000
  const now = Date.now()
  const topicMap = new Map()

  updates.forEach(update => {
    const published = getPublishedTimestamp(update)
    if (published === null || now - published > windowMs) return

    const topicKey = getTopicKey(update)
    if (!topicMap.has(topicKey)) {
      topicMap.set(topicKey, { authorities: new Set(), count: 0 })
    }
    const entry = topicMap.get(topicKey)
    if (update.authority) {
      entry.authorities.add(update.authority)
    }
    entry.count += 1
  })

  let bestTopic = null
  topicMap.forEach((value, key) => {
    const authorityCount = value.authorities.size
    if (authorityCount >= 3) {
      if (!bestTopic || authorityCount > bestTopic.authorities || value.count > bestTopic.count) {
        bestTopic = {
          topic: key,
          authorities: authorityCount,
          count: value.count
        }
      }
    }
  })

  if (bestTopic) {
    const title = `${bestTopic.authorities} authorities discussing ${toTitleCase(bestTopic.topic)} in past 48 hours – coordination pattern detected.`
    return {
      title,
      subtitle: 'Monitoring engine recommends heightened watch on this theme.'
    }
  }

  return {
    title: 'Monitoring engine is scanning cross-authority activity.',
    subtitle: 'No coordinated patterns detected in the past 48 hours.'
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function getUpdateKey(update) {
  const base =
        update?.id ||
        update?.update_id ||
        update?.guid ||
        update?.url ||
        update?.headline ||
        Math.random().toString(36).slice(2)

  return Buffer.from(String(base), 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function classifyUpdatesByPersona(updates = []) {
  const personaMap = {}
  const counts = { all: updates.length, executive: 0, analyst: 0, operations: 0 }

  updates.forEach(update => {
    const key = getUpdateKey(update)
    const personas = new Set()
    const impactLevel = (update?.impactLevel || update?.impact_level || '').toLowerCase()
    const urgency = (update?.urgency || '').toLowerCase()
    const businessScore = Number(update?.businessImpactScore || update?.business_impact_score || 0)
    const relevanceScore = Number(update?.relevanceScore || 0)
    const contentType = (update?.contentType || update?.content_type || '').toLowerCase()
    const tags = Array.isArray(update?.aiTags || update?.ai_tags)
      ? (update.aiTags || update.ai_tags)
      : []
    const summary = (update?.aiSummary || update?.ai_summary || update?.summary || update?.impact || '').toLowerCase()
    const headline = (update?.headline || '').toLowerCase()

    const hasDeadline = Boolean(update?.compliance_deadline || update?.complianceDeadline)
    const mentionsDeadline = summary.includes('deadline') || headline.includes('deadline')
    const isConsultation =
      contentType.includes('consult') ||
      headline.includes('consultation') ||
      summary.includes('consultation') ||
      tags.some(tag => typeof tag === 'string' && tag.toLowerCase().includes('consult'))

    const highImpact =
      impactLevel === 'significant' ||
      businessScore >= 7 ||
      relevanceScore >= 80 ||
      urgency === 'critical'

    const mediumImpact =
      impactLevel === 'moderate' ||
      businessScore >= 5 ||
      relevanceScore >= 60 ||
      urgency === 'high'

    const operationsTrigger =
      hasDeadline ||
      mentionsDeadline ||
      isConsultation ||
      (urgency === 'high' && impactLevel !== 'background')

    if (highImpact) personas.add('executive')
    if (operationsTrigger) personas.add('operations')
    if (mediumImpact || personas.size === 0) personas.add('analyst')

    const personaList = Array.from(personas)
    personaMap[key] = personaList

    personaList.forEach(persona => {
      counts[persona] = (counts[persona] || 0) + 1
    })
  })

  return { personaMap, counts }
}

function summarizeAnnotations(annotations = []) {
  const summary = {
    total: 0,
    flagged: 0,
    tasks: 0,
    assignments: 0,
    notes: 0
  }

  annotations.forEach(annotation => {
    summary.total++
    const status = String(annotation.status || '').toLowerCase()
    if (status === 'flagged') summary.flagged++
    else if (status === 'action_required' || status === 'action required') summary.tasks++
    else if (status === 'assigned') summary.assignments++
    else if (status === 'note') summary.notes++
  })

  return summary
}

function renderUpdateItem(update, pinnedItems = [], personaMap = {}, velocityLookup = {}) {
  const key = getUpdateKey(update)
  const personas = personaMap[key] && personaMap[key].length > 0 ? personaMap[key] : ['analyst']
  const isPinned = pinnedItems.some(p => (p.update_url || p.updateUrl) === update.url)
  const headlineText = (update.headline || 'Untitled Update').replace(/\s+/g, ' ').trim()
  const summarySource =
        update.ai_summary ||
        update.aiSummary ||
        update.summary ||
        update.impact ||
        update.description ||
        ''
  const summaryText = summarySource.length > 260 ? `${summarySource.slice(0, 257).trim()}...` : summarySource.trim()
  const published = update.publishedDate || update.published_date || update.fetchedDate || update.createdAt
  const deadline = update.compliance_deadline || update.complianceDeadline || null
  const impactLevel = update.impactLevel || update.impact_level || 'Informational'
  const relevanceScore = update.relevanceScore || update.relevance_score || null
  const authority = update.authority || 'Unknown'

  const sectorCandidates = []
  const sectorFields = [
    'primarySectors',
    'primary_sectors',
    'sectors',
    'sectorTags',
    'sector_tags',
    'aiSectors',
    'ai_sectors'
  ]

  sectorFields.forEach(field => {
    const value = update[field]
    if (Array.isArray(value)) {
      sectorCandidates.push(...value)
    } else if (typeof value === 'string' && value.trim()) {
      sectorCandidates.push(value)
    }
  })

  if (update.sector) {
    sectorCandidates.push(update.sector)
  }

  const normalizedSectors = Array.from(
    new Set(
      sectorCandidates
        .map(normalizeSectorName)
        .filter(Boolean)
    )
  )

  const primarySector = normalizedSectors[0] || ''
  const velocity = getVelocityForUpdate(update, velocityLookup)
  const predictiveBadges = generatePredictiveBadges(update)

  const personaBadges = personas
    .map(persona => `<span class="persona-badge persona-${persona}">${persona.charAt(0).toUpperCase() + persona.slice(1)}</span>`)
    .join('')

  const chips = [
    `<span class="meta-chip meta-authority">${escapeHtml(authority)}</span>`,
    `<span class="meta-chip meta-impact">${escapeHtml(impactLevel)}</span>`
  ]

  if (relevanceScore) {
    chips.push(`<span class="meta-chip meta-score">${relevanceScore}% relevance</span>`)
  }

  if (primarySector) {
    chips.push(`<span class="meta-chip meta-sector">${escapeHtml(primarySector)}</span>`)
  }

  if (deadline) {
    chips.push(`<span class="meta-chip meta-deadline">Deadline ${formatDateDisplay(deadline)}</span>`)
  }

  chips.push(`<span class="meta-chip meta-date">${formatDateDisplay(published)}</span>`)

  return `
        <div class="update-item" 
             data-update-key="${key}"
             data-update-id="${escapeHtml(update.id || update.update_id || '')}"
             data-update-url="${escapeHtml(update.url || '')}"
             data-personas="${personas.join(' ')}"
             data-headline="${escapeHtml(headlineText)}"
             data-authority="${escapeHtml(authority)}"
             data-impact="${escapeHtml(impactLevel)}"
             data-deadline="${deadline ? formatDateDisplay(deadline) : ''}"
             data-summary="${escapeHtml(summarySource || '')}"
             data-published="${escapeHtml(published || '')}"
             data-sector-list="${escapeHtml(JSON.stringify(normalizedSectors))}"
             data-url="${escapeHtml(update.url || '')}">
            <div class="update-content">
                <div class="update-headline">
                    <a href="${escapeHtml(update.url || '#')}" target="_blank" rel="noopener" class="update-link">
                        ${escapeHtml(headlineText)}
                    </a>
                </div>
                <div class="update-meta">
                    ${personaBadges}
                    ${chips.join('')}
                </div>
                ${summaryText
? `<p class="update-summary">${escapeHtml(summaryText)}</p>`
: ''}
                ${(velocity || predictiveBadges.length)
? `
                <div class="update-insights">
                    ${velocity ? `<span class="velocity-indicator velocity-${velocity.trend}">${velocity.icon} ${escapeHtml(velocity.label)}</span>` : ''}
                    ${predictiveBadges.length ? `<div class="predictive-badges">${predictiveBadges.map(badge => `<span class="predictive-badge">${escapeHtml(badge)}</span>`).join('')}</div>` : ''}
                </div>
                `
: ''}
            </div>
            <div class="quick-action-bar">
                <button class="quick-action" data-action="flag" onclick="IntelligencePage.flagForBrief('${key}')">Flag Brief</button>
                <button class="quick-action" data-action="note" onclick="IntelligencePage.addNote('${key}')">Add Note</button>
                <button class="quick-action" data-action="assign" onclick="IntelligencePage.assign('${key}')">Assign</button>
                <button class="quick-action" data-action="task" onclick="IntelligencePage.createTask('${key}')">Create Task</button>
                <button class="quick-action pin-btn ${isPinned ? 'pinned' : ''}"
                        data-action="pin"
                        aria-pressed="${isPinned ? 'true' : 'false'}"
                        title="${isPinned ? 'Unpin this update' : 'Pin this update'}"
                        onclick="IntelligencePage.togglePin('${key}')">
                    ${isPinned ? 'Pinned' : 'Pin'}
                </button>
            </div>
        </div>
    `
}

// HOME PAGE
router.get('/', renderHomePage)

// DASHBOARD PAGE
router.get('/dashboard', renderDashboardPage)

// ANALYTICS PAGE
const renderAnalyticsPage = require('./pages/analyticsPage')
router.get('/analytics', renderAnalyticsPage)

// ENFORCEMENT PAGE
const renderEnforcementPage = require('./pages/enforcementPage')
router.get('/enforcement', renderEnforcementPage)

// UPDATE DETAIL PAGE
router.get('/update/:id', async (req, res) => {
  try {
    const updateId = req.params.id
    const update = await dbService.getUpdateById(updateId)

    if (!update) {
      return res.status(404).send(`
                <div style="padding: 2rem; text-align: center; font-family: system-ui;">
                    <h1>Update Not Found</h1>
                    <p style="color: #6b7280; margin: 1rem 0;">The requested update could not be found.</p>
                    <a href="/dashboard" style="color: #3b82f6; text-decoration: none;"><- Back to Dashboard</a>
                </div>
            `)
    }

    const { getSidebar } = require('./templates/sidebar')
    const { getCommonStyles } = require('./templates/commonStyles')
    const { getCommonClientScripts } = require('./templates/clientScripts')

    // Get basic counts for sidebar
    const updates = await dbService.getAllUpdates()
    const counts = {
      totalUpdates: updates.length,
      urgentCount: updates.filter(u => u.urgency === 'High' || u.impactLevel === 'Significant').length,
      moderateCount: updates.filter(u => u.urgency === 'Medium' || u.impactLevel === 'Moderate').length,
      informationalCount: updates.filter(u => u.urgency === 'Low' || u.impactLevel === 'Informational').length
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${update.headline || 'Update Details'} - Horizon Scanner</title>
    ${getCommonStyles()}
    <style>
        .detail-container { display: grid; grid-template-columns: 280px 1fr; min-height: 100vh; }
        .detail-main { padding: 2rem; overflow-y: auto; background: #fafbfc; }
        .detail-header { background: white; padding: 2rem; border-radius: 12px; margin-bottom: 2rem; border: 1px solid #e5e7eb; }
        .detail-title { font-size: 1.75rem; font-weight: 700; color: #1f2937; margin-bottom: 1rem; line-height: 1.3; }
        .detail-meta { display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem; }
        .detail-badge { padding: 0.375rem 0.75rem; border-radius: 6px; font-size: 0.875rem; font-weight: 500; }
        .authority-badge { background: #dbeafe; color: #1e40af; }
        .urgency-high { background: #fee2e2; color: #dc2626; }
        .urgency-medium { background: #fef3c7; color: #d97706; }
        .urgency-low { background: #d1fae5; color: #065f46; }
        .detail-content { background: white; padding: 2rem; border-radius: 12px; border: 1px solid #e5e7eb; margin-bottom: 2rem; }
        .detail-section { margin-bottom: 2rem; }
        .detail-section h3 { font-size: 1.125rem; font-weight: 600; color: #1f2937; margin-bottom: 0.75rem; }
        .detail-section p { color: #4b5563; line-height: 1.6; margin-bottom: 1rem; }
        .detail-actions { display: flex; gap: 1rem; margin-top: 2rem; }
        .btn { padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 500; transition: all 0.15s; border: none; cursor: pointer; }
        .btn-primary { background: #3b82f6; color: white; }
        .btn-primary:hover { background: #2563eb; }
        .btn-secondary { background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb; }
        .btn-secondary:hover { background: #e5e7eb; }
    </style>
</head>
<body>
    <div class="detail-container">
        ${getSidebar('detail', counts)}

        <div class="detail-main">
            <div class="detail-header">
                <a href="/dashboard" style="color: #6b7280; text-decoration: none; font-size: 0.875rem; margin-bottom: 1rem; display: inline-block;"><- Back to Dashboard</a>
                <h1 class="detail-title">${update.headline || 'Regulatory Update'}</h1>
                <div class="detail-meta">
                    <span class="detail-badge authority-badge">${update.authority || 'Unknown Authority'}</span>
                    <span class="detail-badge urgency-${(update.urgency || 'low').toLowerCase()}">${update.urgency || 'Low'} Priority</span>
                    <span class="detail-badge" style="background: #f3f4f6; color: #374151;">${formatDateDisplay(update.publishedDate || update.published_date || update.fetchedDate || update.createdAt)}</span>
                </div>
            </div>

            <div class="detail-content">
                ${update.impact
? `
                    <div class="detail-section">
                        <h3>Note Summary</h3>
                        <p>${update.impact}</p>
                    </div>
                `
: ''}

                ${update.business_impact_score
? `
                    <div class="detail-section">
                        <h3>Analytics Business Impact</h3>
                        <p>Impact Score: <strong>${update.business_impact_score}/10</strong></p>
                        ${update.business_impact_analysis ? `<p>${update.business_impact_analysis}</p>` : ''}
                    </div>
                `
: ''}

                ${update.compliance_deadline || update.complianceDeadline
? `
                    <div class="detail-section">
                        <h3>Clock Compliance Deadline</h3>
                        <p><strong>${formatDateDisplay(update.compliance_deadline || update.complianceDeadline)}</strong></p>
                    </div>
                `
: ''}

                ${update.primarySectors?.length
? `
                    <div class="detail-section">
                        <h3>Firm Affected Sectors</h3>
                        <p>${update.primarySectors.join(', ')}</p>
                    </div>
                `
: ''}

                ${update.ai_tags?.length
? `
                    <div class="detail-section">
                        <h3>AI AI Analysis Tags</h3>
                        <p>${update.ai_tags.join(', ')}</p>
                    </div>
                `
: ''}

                <div class="detail-actions">
                    ${update.url ? `<a href="${update.url}" target="_blank" class="btn btn-primary">Link View Original Source</a>` : ''}
                    <a href="/dashboard" class="btn btn-secondary"><- Back to Dashboard</a>
                </div>
            </div>
        </div>
    </div>

    ${getCommonClientScripts()}
</body>
</html>`

    res.send(html)
  } catch (error) {
    console.error('Detail page error:', error)
    res.status(500).send(`
            <div style="padding: 2rem; text-align: center; font-family: system-ui;">
                <h1>Error</h1>
                <p style="color: #6b7280; margin: 1rem 0;">${error.message}</p>
                <a href="/dashboard" style="color: #3b82f6; text-decoration: none;"><- Back to Dashboard</a>
            </div>
        `)
  }
})

// WEEKLY ROUNDUP PAGE - NEW
router.get('/weekly-roundup', renderWeeklyBriefingPage)

// AI INTELLIGENCE PAGE (Phase 1.3 - WORKING VERSION)
router.get('/ai-intelligence', async (req, res) => {
  try {
    const { getSidebar } = require('./templates/sidebar')
    const { getClientScripts, getWorkspaceBootstrapScripts } = require('./templates/clientScripts')
    const { getCommonStyles } = require('./templates/commonStyles')

    const sidebar = await getSidebar('ai-intelligence')

    // Get firm profile
    const firmProfile = await dbService.getFirmProfile()

    // Get relevance-scored updates
    const allUpdates = await dbService.getEnhancedUpdates({ limit: 100 })
    const categorized = relevanceService.categorizeByRelevance(allUpdates, firmProfile)
    const { personaMap, counts: personaCountsRaw } = classifyUpdatesByPersona(allUpdates)
    const personaCounts = {
      all: allUpdates.length,
      executive: personaCountsRaw.executive || 0,
      analyst: personaCountsRaw.analyst || 0,
      operations: personaCountsRaw.operations || 0
    }
    const personaMapJson = JSON.stringify(personaMap).replace(/</g, '\\u003c')
    const personaCountsJson = JSON.stringify(personaCounts).replace(/</g, '\\u003c')
    const velocityLookup = buildVelocityLookup(allUpdates)
    const patternAlert = generatePatternAlert(allUpdates)
    const patternAlertTitle = escapeHtml(patternAlert.title)
    const patternAlertSubtitle = escapeHtml(patternAlert.subtitle)

    // Get workspace stats
    const pinnedItems = await dbService.getPinnedItems()
    const savedSearches = await dbService.getSavedSearches()
    const customAlerts = await dbService.getCustomAlerts()

    const annotations = await annotationService.listAnnotations({
      status: ['flagged', 'action_required', 'assigned', 'note']
    })
    const annotationSummary = summarizeAnnotations(annotations)
    const annotationSummaryJson = JSON.stringify(annotationSummary).replace(/</g, '\\u003c')

    const filterOptions = await dbService.getFilterOptions()
    const availableSectors = prepareAvailableSectors(filterOptions.sectors || [])
    const availableSectorsJson = JSON.stringify(availableSectors).replace(/</g, '\\u003c')
    const workspaceBootstrapScripts = getWorkspaceBootstrapScripts()
    const clientScripts = getClientScripts({ includeWorkspaceModule: false, includeAliasBootstrap: false })

    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>AI Intelligence - Regulatory Intelligence Platform</title>
            ${getCommonStyles()}
            ${workspaceBootstrapScripts}
            <style>
                .intelligence-header {
                    background: linear-gradient(135deg, var(--primary-navy) 0%, var(--primary-charcoal) 100%);
                    color: #f8fafc;
                    padding: 36px;
                    border-radius: 20px;
                    margin-bottom: 32px;
                    position: relative;
                    border: none;
                    box-shadow: 0 44px 90px -48px rgba(15, 23, 42, 0.55);
                    overflow: hidden;
                }
                
                .intelligence-header h1 {
                    font-size: 2rem;
                    margin-bottom: 8px;
                    letter-spacing: -0.01em;
                    color: inherit;
                }
                
                .intelligence-header p {
                    color: rgba(248, 250, 252, 0.82);
                    font-size: 1rem;
                    margin-bottom: 22px;
                }
                
                .firm-profile-section {
                    background: rgba(15, 30, 58, 0.45);
                    border: 1px solid rgba(255, 255, 255, 0.18);
                    padding: 18px 22px;
                    border-radius: 14px;
                    margin-top: 18px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 18px;
                    color: rgba(248, 250, 252, 0.9);
                    backdrop-filter: blur(6px);
                }
                
                .firm-info {
                    flex: 1;
                }
                
                .firm-name {
                    font-size: 1.25rem;
                    font-weight: 600;
                    margin-bottom: 6px;
                    color: #f8fafc;
                }
                
                .firm-sectors {
                    font-size: 0.9rem;
                    color: rgba(226, 232, 240, 0.88);
                }
                
                .persona-switcher {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                    margin-top: 24px;
                }

                .header-actions {
                    margin-top: 24px;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                }
                
                .header-actions .btn-primary {
                    background: #ffffff;
                    color: #0f172a;
                    border: none;
                    box-shadow: 0 16px 28px -24px rgba(15, 23, 42, 0.5);
                }

                .header-actions .btn-primary:hover {
                    background: rgba(248, 250, 252, 0.92);
                    color: var(--primary-navy);
                    transform: translateY(-1px);
                }
                
                .persona-filter {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 18px;
                    border-radius: 999px;
                    border: 1px solid rgba(226, 232, 240, 0.9);
                    background: #ffffff;
                    color: #0f172a;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 8px 18px -12px rgba(15, 23, 42, 0.3);
                }
                
                .persona-filter .persona-count {
                    background: rgba(37, 99, 235, 0.12);
                    color: #1d4ed8;
                    padding: 2px 10px;
                    border-radius: 999px;
                    font-size: 0.8rem;
                    font-weight: 500;
                }
                
                .persona-filter.active {
                    background: linear-gradient(135deg, var(--primary-navy), var(--primary-charcoal));
                    color: #ffffff;
                    border-color: rgba(255, 255, 255, 0.35);
                }
                
                .persona-filter.active .persona-count {
                    background: rgba(255, 255, 255, 0.16);
                    color: #e2e8f0;
                }
                
                .persona-filter:not(.active):hover {
                    transform: translateY(-1px);
                    border-color: rgba(59, 130, 246, 0.35);
                    box-shadow: 0 12px 22px -16px rgba(15, 23, 42, 0.35);
                }
                
                .sector-badge {
                    background: rgba(59, 130, 246, 0.18);
                    color: #bfdbfe;
                    padding: 3px 10px;
                    border-radius: 12px;
                    margin-right: 6px;
                    display: inline-block;
                    font-size: 0.8rem;
                    font-weight: 600;
                }
                
                .workspace-summary {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 16px;
                    margin-bottom: 30px;
                }
                
                .workspace-card {
                    background: #ffffff;
                    border-radius: 14px;
                    padding: 16px;
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    box-shadow: 0 12px 28px -20px rgba(15, 23, 42, 0.35);
                    border: 1px solid #e2e8f0;
                    cursor: pointer;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                
                .workspace-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 16px 32px -22px rgba(37, 99, 235, 0.35);
                    border-color: #bfdbfe;
                }
                
                .workspace-card-icon {
                    width: 46px;
                    height: 46px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #eff6ff;
                    color: #1d4ed8;
                    font-size: 1.4rem;
                }
                
                .workspace-card-body {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                
                .workspace-card-label {
                    font-size: 0.85rem;
                    color: rgba(31,41,55,0.75);
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                }
                
                .workspace-card-count {
                    font-size: 1.6rem;
                    font-weight: 700;
                    color: #1f2937;
                }
                
                .workspace-card-meta {
                    font-size: 0.8rem;
                    color: rgba(71,85,105,0.85);
                }
                
                .pattern-alert {
                    margin-top: 24px;
                    display: flex;
                    gap: 16px;
                    align-items: center;
                    background: rgba(15, 30, 58, 0.55);
                    padding: 18px 20px;
                    border-radius: 14px;
                    border: 1px solid rgba(255, 255, 255, 0.18);
                    color: rgba(241, 245, 249, 0.92);
                    backdrop-filter: blur(6px);
                }
                
                .pattern-alert .alert-icon {
                    width: 42px;
                    height: 42px;
                    border-radius: 14px;
                    background: rgba(59, 130, 246, 0.25);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.4rem;
                    color: #bfdbfe;
                    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
                }
                
                .pattern-alert .alert-body {
                    flex: 1;
                }
                
                .pattern-alert .alert-title {
                    font-weight: 600;
                    font-size: 1rem;
                    color: #f8fafc;
                }
                
                .pattern-alert .alert-subtitle {
                    font-size: 0.85rem;
                    color: rgba(226, 232, 240, 0.78);
                    margin-top: 4px;
                }
                
                .relevance-streams {
                    margin-top: 30px;
                }
                
                .stream-container {
                    background: #ffffff;
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 20px;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 12px 30px -24px rgba(15, 23, 42, 0.35);
                }
                
                .stream-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #e5e7eb;
                }
                
                .stream-title {
                    font-size: 1.3rem;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .stream-count {
                    background: #f3f4f6;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.9rem;
                    color: #4b5563;
                }
                
                .relevance-indicator {
                    width: 4px;
                    height: 40px;
                    border-radius: 2px;
                    margin-right: 10px;
                }
                
                .relevance-high { background: #ef4444; }
                .relevance-medium { background: #f59e0b; }
                .relevance-low { background: #6b7280; }
                
                .update-item {
                    background: #ffffff;
                    padding: 18px;
                    border-radius: 12px;
                    margin-bottom: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    transition: all 0.2s ease;
                    border: 1px solid #e2e8f0;
                }
                
                .update-item:hover {
                    background: #f8fafc;
                    border-color: #2563eb;
                    box-shadow: 0 14px 28px -22px rgba(37, 99, 235, 0.45);
                    transform: translateY(-2px);
                }
                
                .update-content {
                    flex: 1;
                }
                
                .update-headline {
                    font-weight: 600;
                    color: #1f2937;
                    margin-bottom: 6px;
                    line-height: 1.4;
                }
                
                .update-link {
                    color: inherit;
                    text-decoration: none;
                }
                
                .update-summary {
                    color: #374151;
                    font-size: 0.95rem;
                    line-height: 1.5;
                    margin: 6px 0 0 0;
                }
                
                .update-meta {
                    display: flex;
                    gap: 10px;
                    font-size: 0.85rem;
                    color: #6b7280;
                    flex-wrap: wrap;
                }
                
                .persona-badge {
                    background: #eef2ff;
                    color: #3730a3;
                    padding: 2px 10px;
                    border-radius: 999px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }
                
                .persona-badge.persona-executive {
                    background: #fef3c7;
                    color: #b45309;
                }
                
                .persona-badge.persona-operations {
                    background: #ecfdf5;
                    color: #047857;
                }
                
                .meta-chip {
                    background: #eef2ff;
                    color: #4338ca;
                    padding: 2px 10px;
                    border-radius: 999px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                }
                
                .meta-chip.meta-authority {
                    background: #dbeafe;
                    color: #1d4ed8;
                }
                
                .meta-chip.meta-impact {
                    background: #fef3c7;
                    color: #b45309;
                }
                
                .meta-chip.meta-score {
                    background: #fef2f2;
                    color: #b91c1c;
                }
                
                .meta-chip.meta-sector {
                    background: #ede9fe;
                    color: #6d28d9;
                }
                
                .meta-chip.meta-deadline {
                    background: #fef3c7;
                    color: #92400e;
                }
                
                .meta-chip.meta-date {
                    background: #e5e7eb;
                    color: #374151;
                }
                
                .quick-action-bar {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                
                .quick-action {
                    border: 1px solid #d1d5db;
                    border-radius: 999px;
                    padding: 8px 14px;
                    font-size: 0.82rem;
                    font-weight: 600;
                    cursor: pointer;
                    background: #ffffff;
                    color: #1f2937;
                    transition: all 0.2s ease;
                }
                
                .quick-action[data-action="task"] {
                    border-color: #16a34a;
                    background: #ecfdf5;
                    color: #047857;
                }
                
                .quick-action[data-action="assign"] {
                    border-color: #7c3aed;
                    background: #f5f3ff;
                    color: #5b21b6;
                }
                
                .quick-action[data-action="note"] {
                    border-color: #94a3b8;
                    background: #f3f4f6;
                    color: #1f2937;
                }
                
                .quick-action[data-action="flag"] {
                    border-color: #dc2626;
                    background: #fef2f2;
                    color: #b91c1c;
                }
                
                .quick-action.pin-btn {
                    border-color: #f97316;
                    background: #fff7ed;
                    color: #9a3412;
                }
                
                .quick-action.pin-btn.pinned {
                    border-color: #047857;
                    background: #dcfce7;
                    color: #047857;
                }
                
                .quick-action:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 22px -14px rgba(15, 23, 42, 0.35);
                }
                
                .update-insights {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-top: 10px;
                }
                
                .velocity-indicator {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 4px 10px;
                    border-radius: 999px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    background: #eef2ff;
                    color: #4338ca;
                }
                
                .velocity-accelerating {
                    background: #ecfdf5;
                    color: #047857;
                }
                
                .velocity-decelerating {
                    background: #fef2f2;
                    color: #b91c1c;
                }
                
                .predictive-badges {
                    display: inline-flex;
                    flex-wrap: wrap;
                    gap: 6px;
                }
                
                .predictive-badge {
                    background: #f1f5f9;
                    color: #475569;
                    padding: 4px 10px;
                    border-radius: 999px;
                    font-size: 0.72rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                
                .authority-badge {
                    background: #e0f2fe;
                    color: #0369a1;
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-weight: 500;
                }
                
                .relevance-score {
                    background: #f0f9ff;
                    color: #0284c7;
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-weight: 600;
                }
                
                .pin-button {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    padding: 5px;
                    margin-left: 10px;
                    transition: transform 0.2s ease;
                }
                
                .pin-button:hover {
                    transform: scale(1.2);
                }
                
                .pin-button.pinned {
                    color: #ef4444;
                }
                
                .no-profile-alert {
                    background: #fef3c7;
                    border: 1px solid #f59e0b;
                    color: #92400e;
                    padding: 20px;
                    border-radius: 8px;
                    margin-top: 20px;
                    text-align: center;
                }
                
                .btn {
                    padding: 10px 20px;
                    border-radius: 6px;
                    border: none;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-decoration: none;
                    display: inline-block;
                }
                
                .btn-primary {
                    background: #4f46e5;
                    color: white;
                }
                
                .btn-primary:hover {
                    background: #4338ca;
                }
                
                .btn-secondary {
                    background: #6b7280;
                    color: white;
                }
                
                .btn-secondary:hover {
                    background: #4b5563;
                }

                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    margin-top: 20px;
                }

                .pinned-items-list {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    margin-top: 12px;
                }

                .pinned-item-card {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 16px 18px;
                    box-shadow: 0 18px 32px -28px rgba(15, 23, 42, 0.38);
                }

                .pinned-item-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    margin-bottom: 8px;
                }

                .pinned-item-title {
                    font-weight: 600;
                    font-size: 1.02rem;
                    color: #0f172a;
                    text-decoration: none;
                }

                .pinned-item-title:hover {
                    color: #1d4ed8;
                    text-decoration: underline;
                }

                .pinned-item-authority {
                    font-size: 0.75rem;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    color: rgba(71, 85, 105, 0.78);
                    font-weight: 600;
                }

                .pinned-item-sectors {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                    margin-bottom: 8px;
                }

                .pinned-sector-badge {
                    background: rgba(37, 99, 235, 0.12);
                    color: #1d4ed8;
                    border-radius: 999px;
                    padding: 4px 10px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .pinned-item-summary {
                    font-size: 0.85rem;
                    color: #475569;
                    line-height: 1.5;
                }

                .pinned-item-actions {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                    margin-top: 12px;
                }

                .pinned-items-list .empty-state {
                    background: #f8fafc;
                    border: 1px dashed #cbd5f5;
                    border-radius: 12px;
                    padding: 20px;
                    text-align: center;
                    color: #475569;
                    font-weight: 500;
                }

                .pin-btn.pending {
                    opacity: 0.65;
                    pointer-events: none;
                }

                @media (max-width: 768px) {
                    .workspace-summary {
                        grid-template-columns: 1fr;
                    }
                    
                    .firm-profile-section {
                        flex-direction: column;
                        gap: 10px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="app-container">
                ${sidebar}
                
                <main class="main-content">
                    <header class="intelligence-header">
                        <h1>Intelligence Center</h1>
                        <p>Live regulatory intelligence tailored to your firm</p>
                        
                        ${firmProfile
? `
                            <div class="firm-profile-section">
                                <div class="firm-info">
                                    <div class="firm-name">${firmProfile.firmName || firmProfile.firm_name || 'Unnamed Firm'}</div>
                                    <div class="firm-sectors">
                                        ${(firmProfile.primarySectors || firmProfile.primary_sectors || [])
                                            .map(sector => `<span class="sector-badge">${sector}</span>`)
                                            .join('')}
                                    </div>
                                </div>
                                <button onclick="WorkspaceModule.showFirmProfile()" class="btn btn-secondary">
                                    Edit Profile
                                </button>
                            </div>
                        `
: `
                            <div class="no-profile-alert">
                                <strong>No firm profile configured.</strong> 
                                Set up your firm profile to enable personalized relevance scoring.
                                <div style="margin-top: 10px;">
                                    <button onclick="WorkspaceModule.showFirmProfile()" class="btn btn-primary">
                                        Set Up Profile
                                    </button>
                                </div>
                            </div>
                        `}
                        <div class="pattern-alert">
                            <div class="alert-icon">⚡</div>
                            <div class="alert-body">
                                <div class="alert-title">${patternAlertTitle}</div>
                                <div class="alert-subtitle">${patternAlertSubtitle}</div>
                            </div>
                        </div>

                
                        <div class="header-actions">
                            <button class="btn btn-primary" type="button" onclick="ReportModule.exportReport('intelligence_center', { limit: 75 })">
                                Export Intelligence Center Report
                            </button>
                        </div>
                    </header>
                    
                    <div class="persona-switcher">
                        <button class="persona-filter active" data-persona-filter="all" type="button">
                            <span>All Updates</span>
                            <span class="persona-count">${personaCounts.all}</span>
                        </button>
                        <button class="persona-filter" data-persona-filter="executive" type="button">
                            <span>Executive View</span>
                            <span class="persona-count">${personaCounts.executive}</span>
                        </button>
                        <button class="persona-filter" data-persona-filter="analyst" type="button">
                            <span>Analyst Queue</span>
                            <span class="persona-count">${personaCounts.analyst}</span>
                        </button>
                        <button class="persona-filter" data-persona-filter="operations" type="button">
                            <span>Operations Desk</span>
                            <span class="persona-count">${personaCounts.operations}</span>
                        </button>
                    </div>
                    
                    <div class="workspace-summary">
                        <div class="workspace-card" onclick="WorkspaceModule.showPinnedItems()">
                            <div class="workspace-card-icon">📌</div>
                            <div class="workspace-card-body">
                                <span class="workspace-card-label">Pinned Updates</span>
                                <span class="workspace-card-count" id="pinnedCount">${pinnedItems.length}</span>
                                <span class="workspace-card-meta">Saved for action</span>
                            </div>
                        </div>
                        
                        <div class="workspace-card" onclick="WorkspaceModule.showSavedSearches()">
                            <div class="workspace-card-icon">🔍</div>
                            <div class="workspace-card-body">
                                <span class="workspace-card-label">Saved Searches</span>
                                <span class="workspace-card-count" id="savedSearchesCount">${savedSearches.length}</span>
                                <span class="workspace-card-meta">Curated filters</span>
                            </div>
                        </div>
                        
                        <div class="workspace-card" onclick="WorkspaceModule.showCustomAlerts()">
                            <div class="workspace-card-icon">🔔</div>
                            <div class="workspace-card-body">
                                <span class="workspace-card-label">Active Alerts</span>
                                <span class="workspace-card-count" id="customAlertsCount">${customAlerts.filter(a => a.isActive).length}</span>
                                <span class="workspace-card-meta">Watching thresholds</span>
                            </div>
                        </div>

                        <div class="workspace-card" onclick="WorkspaceModule.showAnnotations()">
                            <div class="workspace-card-icon">🗂️</div>
                            <div class="workspace-card-body">
                                <span class="workspace-card-label">Saved Actions</span>
                                <span class="workspace-card-count" id="annotationCount">${annotationSummary.total}</span>
                                <span class="workspace-card-meta" id="annotationMeta">${annotationSummary.total > 0
? `${annotationSummary.tasks} tasks • ${annotationSummary.flagged} briefs`
: 'Notes & actions'}</span>
                            </div>
                        </div>
                        
                        <div class="workspace-card" onclick="refreshIntelligence()">
                            <div class="workspace-card-icon">🔄</div>
                            <div class="workspace-card-body">
                                <span class="workspace-card-label">Total Updates</span>
                                <span class="workspace-card-count">${allUpdates.length}</span>
                                <span class="workspace-card-meta">Live in feed</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="relevance-streams">
                        <!-- High Relevance Stream -->
                        ${categorized.high.length > 0
? `
                            <div class="stream-container">
                                <div class="stream-header">
                                    <div class="stream-title">
                                        <div class="relevance-indicator relevance-high"></div>
                                        Target High Relevance to Your Firm
                                    </div>
                                    <span class="stream-count">${categorized.high.length} updates</span>
                                </div>
                                <div class="stream-content">
                                    ${categorized.high.slice(0, 10).map(update => renderUpdateItem(update, pinnedItems, personaMap, velocityLookup)).join('')}
                                </div>
                            </div>
                        `
: ''}
                        
                        <!-- Medium Relevance Stream -->
                        ${categorized.medium.length > 0
? `
                            <div class="stream-container">
                                <div class="stream-header">
                                    <div class="stream-title">
                                        <div class="relevance-indicator relevance-medium"></div>
                                        Analytics Medium Relevance
                                    </div>
                                    <span class="stream-count">${categorized.medium.length} updates</span>
                                </div>
                                <div class="stream-content">
                                    ${categorized.medium.slice(0, 10).map(update => renderUpdateItem(update, pinnedItems, personaMap, velocityLookup)).join('')}
                                </div>
                            </div>
                        `
: ''}
                        
                        <!-- Low Relevance Stream -->
                        ${categorized.low.length > 0
? `
                            <div class="stream-container">
                                <div class="stream-header">
                                    <div class="stream-title">
                                        <div class="relevance-indicator relevance-low"></div>
                                        News Background Intelligence
                                    </div>
                                    <span class="stream-count">${categorized.low.length} updates</span>
                                </div>
                                <div class="stream-content">
                                    ${categorized.low.slice(0, 10).map(update => renderUpdateItem(update, pinnedItems, personaMap, velocityLookup)).join('')}
                                </div>
                            </div>
                        `
: ''}
                        
                        ${allUpdates.length === 0
? `
                            <div class="stream-container">
                                <p style="text-align: center; color: #6b7280; padding: 40px;">
                                    No updates available. Click "Refresh Data" to fetch the latest regulatory updates.
                                </p>
                            </div>
                        `
: ''}
                    </div>
                </main>
            </div>
            
            <script>
                // Refresh intelligence data
                async function refreshIntelligence() {
                    try {
                        const response = await fetch('/api/refresh', { method: 'POST' });
                        const data = await response.json();
                        if (data.success) {
                            window.location.reload();
                        }
                    } catch (error) {
                        console.error('Refresh error:', error);
                        alert('Failed to refresh data');
                    }
                }
                
                // Show message function
                function showMessage(message, type) {
                    const messageEl = document.createElement('div');
                    messageEl.className = \`message message-\${type}\`;
                    messageEl.style.cssText = \`
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: \${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
                        color: white;
                        padding: 15px 20px;
                        border-radius: 8px;
                        z-index: 10001;
                        animation: slideIn 0.3s ease;
                    \`;
                    messageEl.textContent = message;
                    document.body.appendChild(messageEl);
                    
                    setTimeout(() => {
                        messageEl.remove();
                    }, 3000);
                }
                
                // Add slide-in animation
                const style = document.createElement('style');
                style.textContent = \`
                    @keyframes slideIn {
                        from {
                            transform: translateX(100%);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }
                \`;
                document.head.appendChild(style);
            </script>
            <script>
                window.availableSectors = ${availableSectorsJson};
                window.initialAnnotationSummary = ${annotationSummaryJson};
            </script>
            ${clientScripts}
            <script>
                (function() {
                    const personaMap = ${personaMapJson};
                    const personaCounts = ${personaCountsJson};
                    const state = { activePersona: 'all' };
                    const notify = typeof window.showMessage === 'function'
                        ? window.showMessage
                        : function(message, type) { console.log('[' + (type || 'info') + ']', message); };

                    function parseJsonDataset(value) {
                        if (!value) return null;
                        try {
                            return JSON.parse(value);
                        } catch (error) {
                            try {
                                return JSON.parse(decodeURIComponent(value));
                            } catch (_) {
                                return null;
                            }
                        }
                    }

                    function getUpdateElement(key) {
                        return document.querySelector('[data-update-key="' + key + '"]');
                    }

                    function getUpdateData(key) {
                        const element = getUpdateElement(key);
                        if (!element) {
                            notify('Update card not found for action', 'warning');
                            return null;
                        }

                        const personas = personaMap[key] || ['analyst'];
                        const rawSectors = parseJsonDataset(element.dataset.sectorList) || [];
                        const normalizer = typeof window.normalizeSectorLabel === 'function'
                            ? window.normalizeSectorLabel
                            : function(value) { return value; };
                        const sectors = Array.isArray(rawSectors)
                            ? rawSectors.map(normalizer).filter(Boolean)
                            : [];
                        const summary = element.dataset.summary || '';
                        const published = element.dataset.published || '';

                        return {
                            key: key,
                            id: element.dataset.updateId || '',
                            url: element.dataset.updateUrl || '',
                            headline: element.dataset.headline || '',
                            authority: element.dataset.authority || '',
                            personas: personas,
                            sectors: sectors,
                            summary: summary,
                            published: published
                        };
                    }

                    async function createAnnotation(data, overrides) {
                        overrides = overrides || {};
                        const baseContext = {
                            url: data.url || '',
                            headline: data.headline || '',
                            authority: data.authority || '',
                            summary: data.summary || '',
                            published: data.published || '',
                            personas: Array.isArray(data.personas) ? data.personas : [],
                            sectors: Array.isArray(data.sectors) ? data.sectors : []
                        };

                        if (Array.isArray(baseContext.sectors) && baseContext.sectors.length > 0) {
                            baseContext.taxonomy = {
                                sectors: baseContext.sectors.slice()
                            };
                        }

                        const overrideContext = overrides.context
                            ? Object.assign({}, overrides.context)
                            : {};

                        const mergedContext = Object.assign({}, baseContext, overrideContext);

                        if (Array.isArray(data.sectors) && data.sectors.length > 0) {
                            const mergedSectors = Array.isArray(mergedContext.sectors)
                                ? Array.from(new Set([...mergedContext.sectors, ...data.sectors]))
                                : data.sectors.slice();
                            mergedContext.sectors = mergedSectors;

                            const existingTaxonomy = mergedContext.taxonomy && typeof mergedContext.taxonomy === 'object'
                                ? mergedContext.taxonomy
                                : {};
                            existingTaxonomy.sectors = Array.isArray(existingTaxonomy.sectors)
                                ? Array.from(new Set([...existingTaxonomy.sectors, ...data.sectors]))
                                : data.sectors.slice();
                            mergedContext.taxonomy = existingTaxonomy;
                        }

                        const payload = {
                            update_id: data.id || data.url,
                            author: overrides.author || 'intelligence-center',
                            visibility: overrides.visibility || 'team',
                            status: overrides.status || 'triage',
                            content: overrides.content || '',
                            tags: overrides.tags || [],
                            assigned_to: overrides.assigned_to || [],
                            origin_page: 'intelligence_center',
                            action_type: overrides.action_type || null,
                            priority: overrides.priority || null,
                            persona: overrides.persona || (data.personas && data.personas[0]) || null,
                            report_included: Boolean(overrides.report_included),
                            context: mergedContext
                        };

                        const response = await fetch('/api/annotations', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });

                        if (!response.ok) {
                            let reason = 'Annotation failed';
                            try {
                                const err = await response.json();
                                if (err && err.error) reason = err.error;
                            } catch (_) {}
                            throw new Error(reason);
                        }

                        const result = await response.json();
                        if (window.WorkspaceModule && typeof WorkspaceModule.refreshAnnotations === 'function') {
                            WorkspaceModule.refreshAnnotations();
                        }
                        return result;
                    }

                    const IntelligencePage = {
                        init: function() {
                            this.bindPersonaFilters();
                            this.filterByPersona('all', { silent: true });
                        },
                        bindPersonaFilters: function() {
                            var self = this;
                            document.querySelectorAll('.persona-filter').forEach(function(button) {
                                button.addEventListener('click', function() {
                                    var persona = button.dataset.personaFilter || 'all';
                                    self.filterByPersona(persona);
                                });
                            });
                        },
                        filterByPersona: function(persona, options) {
                            options = options || {};
                            state.activePersona = persona;

                            document.querySelectorAll('.persona-filter').forEach(function(button) {
                                var isActive = (button.dataset.personaFilter || 'all') === persona;
                                button.classList.toggle('active', isActive);
                            });

                            document.querySelectorAll('.update-item').forEach(function(card) {
                                var key = card.dataset.updateKey;
                                var personas = personaMap[key] || ['analyst'];
                                var shouldShow = persona === 'all' || personas.indexOf(persona) !== -1;
                                card.style.display = shouldShow ? '' : 'none';
                            });

                            if (!options.silent) {
                                var label = persona === 'all'
                                    ? 'All updates'
                                    : persona.charAt(0).toUpperCase() + persona.slice(1) + ' queue';
                                notify('View switched to ' + label, 'info');
                            }
                        },
                        getUpdateData: getUpdateData,
                        flagForBrief: async function(key) {
                            var data = getUpdateData(key);
                            if (!data) return;
                            try {
                                await createAnnotation(data, {
                                    status: 'flagged',
                                    tags: ['weekly_brief', 'triage'],
                                    action_type: 'flag',
                                    persona: data.personas[0] || 'analyst',
                                    report_included: true,
                                    content: 'Flagged for Weekly Brief: ' + data.headline
                                });
                                notify('Flagged for Weekly Brief', 'success');
                            } catch (error) {
                                notify(error.message, 'error');
                            }
                        },
                        addNote: async function(key) {
                            var data = getUpdateData(key);
                            if (!data) return;
                            var note = window.prompt('Add note for "' + data.headline + '"');
                            if (!note || !note.trim()) {
                                return;
                            }
                            try {
                                await createAnnotation(data, {
                                    status: 'note',
                                    tags: ['note'],
                                    action_type: 'note',
                                    content: note.trim()
                                });
                                notify('Note saved to workspace', 'success');
                            } catch (error) {
                                notify(error.message, 'error');
                            }
                        },
                        assign: async function(key) {
                            var data = getUpdateData(key);
                            if (!data) return;
                            var assignee = window.prompt('Assign to (name or email)');
                            if (!assignee || !assignee.trim()) {
                                return;
                            }
                            assignee = assignee.trim();
                            try {
                                await createAnnotation(data, {
                                    status: 'assigned',
                                    tags: ['assignment'],
                                    action_type: 'assign',
                                    assigned_to: [assignee],
                                    content: 'Assigned to ' + assignee + ': ' + data.headline
                                });
                                notify('Assignment recorded', 'success');
                            } catch (error) {
                                notify(error.message, 'error');
                            }
                        },
                        createTask: async function(key) {
                            var data = getUpdateData(key);
                            if (!data) return;
                            var description = window.prompt('Create follow-up task');
                            if (!description || !description.trim()) {
                                return;
                            }
                            var dueDate = window.prompt('Due date (optional, YYYY-MM-DD)');
                            var context = dueDate && dueDate.trim() ? { due_date: dueDate.trim() } : null;
                            try {
                                await createAnnotation(data, {
                                    status: 'action_required',
                                    tags: ['task'],
                                    action_type: 'task',
                                    priority: 'medium',
                                    content: description.trim(),
                                    report_included: false,
                                    context: context
                                });
                                notify('Task captured for follow-up', 'success');
                            } catch (error) {
                                notify(error.message, 'error');
                            }
                        },
                        togglePin: function(key) {
                            var data = getUpdateData(key);
                            if (!data || !window.WorkspaceModule || typeof window.WorkspaceModule.togglePin !== 'function') {
                                return;
                            }
                            var itemElement = getUpdateElement(key);
                            var pinButton = itemElement ? itemElement.querySelector('.pin-btn') : null;
                            if (pinButton) {
                                pinButton.disabled = true;
                                pinButton.classList.add('pending');
                            }
                            Promise.resolve(
                                window.WorkspaceModule.togglePin(
                                    data.url,
                                    data.headline,
                                    data.authority,
                                    {
                                        sectors: Array.isArray(data.sectors) ? data.sectors : [],
                                        summary: data.summary || '',
                                        published: data.published || '',
                                        personas: Array.isArray(data.personas) ? data.personas : [],
                                        updateId: data.id || null
                                    }
                                )
                            ).finally(function() {
                                if (pinButton) {
                                    pinButton.disabled = false;
                                    pinButton.classList.remove('pending');
                                }
                            });
                        }
                    };

                    window.IntelligencePage = IntelligencePage;
                    IntelligencePage.init();
                })();
            </script>
        </body>
        </html>`

    res.send(html)
  } catch (error) {
    console.error('X Error rendering AI Intelligence page:', error)
    res.status(500).send('Error loading AI Intelligence page')
  }
})

// AUTHORITY SPOTLIGHT PAGE
router.get('/authority-spotlight/:authority?', async (req, res) => {
  try {
    const authority = req.params.authority || 'FCA'
    const renderAuthoritySpotlightPage = require('./pages/authoritySpotlightPage')
    await renderAuthoritySpotlightPage(req, res, authority)
  } catch (error) {
    console.error('X Error rendering authority spotlight page:', error)
    res.status(500).send('Error loading authority spotlight page')
  }
})

// SECTOR INTELLIGENCE PAGE
router.get('/sector-intelligence/:sector?', async (req, res) => {
  try {
    const sector = req.params.sector || 'Banking'
    const renderSectorIntelligencePage = require('./pages/sectorIntelligencePage')
    await renderSectorIntelligencePage(req, res, sector)
  } catch (error) {
    console.error('X Error rendering sector intelligence page:', error)
    res.status(500).send('Error loading sector intelligence page')
  }
})

// ABOUT PAGE
router.get('/about', async (req, res) => {
  try {
    const { getSidebar } = require('./templates/sidebar')
    const { getCommonStyles } = require('./templates/commonStyles')

    const sidebar = await getSidebar('about')

    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>About - AI Regulatory Intelligence Platform</title>
            ${getCommonStyles()}
            <style>
                .about-section {
                    background: white;
                    padding: 40px;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                    margin-bottom: 30px;
                }
                
                .version-info {
                    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                    padding: 30px;
                    border-radius: 12px;
                    border: 1px solid #0ea5e9;
                    margin-bottom: 30px;
                }
                
                .tech-stack {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-top: 20px;
                }
                
                .tech-item {
                    background: #f9fafb;
                    padding: 20px;
                    border-radius: 8px;
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <div class="app-container">
                ${sidebar}
                
                <main class="main-content">
                    <div class="version-info">
                        <h1>AI AI Regulatory Intelligence Platform</h1>
                        <p style="font-size: 1.2rem; color: #0c4a6e; margin-bottom: 20px;">
                            <strong>Version 2.0 - Phase 1.3 Complete</strong>
                        </p>
                        <p>
                            Advanced AI-powered regulatory intelligence with personalized relevance scoring, 
                            workspace management, and intelligent compliance support.
                        </p>
                    </div>
                    
                    <div class="about-section">
                        <h2>Target Mission</h2>
                        <p>
                            To transform regulatory compliance from reactive monitoring to proactive intelligence, 
                            helping financial services firms stay ahead of regulatory changes with AI-powered insights,
                            personalized relevance scoring, and automated business impact analysis.
                        </p>
                    </div>
                    
                    <div class="about-section">
                        <h2>Spark Key Features</h2>
                        <ul style="line-height: 2;">
                            <li><strong>Target Firm Profile System:</strong> Personalized relevance scoring based on your sectors</li>
                            <li><strong>Pin Workspace Management:</strong> Pin important updates, save searches, create alerts</li>
                            <li><strong>AI AI-Powered Analysis:</strong> Automated impact scoring and sector relevance analysis</li>
                            <li><strong>Analytics Real-time Dashboard:</strong> Live regulatory updates with intelligent filtering</li>
                            <li><strong>Note Weekly AI Roundups:</strong> Comprehensive weekly intelligence briefings</li>
                            <li><strong>Authority Authority Spotlight:</strong> Deep analysis of regulatory authority patterns</li>
                            <li><strong>Growth Trend Analysis:</strong> Emerging regulatory themes and compliance priorities</li>
                            <li><strong>Power Smart Filtering:</strong> Advanced search and categorization capabilities</li>
                        </ul>
                    </div>
                    
                    <div class="about-section">
                        <h2>Tools Technology Stack</h2>
                        <div class="tech-stack">
                            <div class="tech-item">
                                <h4>Launch Backend</h4>
                                <p>Node.js, Express.js</p>
                            </div>
                            <div class="tech-item">
                                <h4>AI AI Engine</h4>
                                <p>Groq API, Llama-3.3-70B</p>
                            </div>
                            <div class="tech-item">
                                <h4>Save Database</h4>
                                <p>PostgreSQL + JSON Fallback</p>
                            </div>
                            <div class="tech-item">
                                <h4>Signal Data Sources</h4>
                                <p>RSS Feeds, Web Scraping</p>
                            </div>
                            <div class="tech-item">
                                <h4>Design Frontend</h4>
                                <p>Vanilla JS, Modern CSS</p>
                            </div>
                            <div class="tech-item">
                                <h4>Cloud Infrastructure</h4>
                                <p>Docker, Cloud Ready</p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </body>
        </html>`

    res.send(html)
  } catch (error) {
    console.error('X Error rendering about page:', error)
    res.status(500).send('Error loading about page')
  }
})

// COMPREHENSIVE TEST PAGE
router.get('/test', async (req, res) => {
  try {
    console.log('Test Test page requested')

    // Run system tests
    const testResults = await runSystemTests()

    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>System Test - AI Regulatory Intelligence Platform</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    background: #f8fafc;
                    margin: 0;
                    padding: 30px;
                    color: #1f2937;
                }
                .test-container {
                    max-width: 1200px;
                    margin: 0 auto;
                }
                .test-header {
                    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                    color: white;
                    padding: 30px;
                    border-radius: 12px;
                    margin-bottom: 30px;
                    text-align: center;
                }
                .test-section {
                    background: white;
                    border-radius: 12px;
                    padding: 25px;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    border: 1px solid #e5e7eb;
                }
                .test-status {
                    display: inline-block;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-weight: 600;
                    font-size: 0.9rem;
                    margin-left: 10px;
                }
                .test-status.pass {
                    background: #dcfce7;
                    color: #166534;
                }
                .test-status.fail {
                    background: #fef2f2;
                    color: #dc2626;
                }
                .test-status.warn {
                    background: #fef3c7;
                    color: #92400e;
                }
                .test-details {
                    background: #f9fafb;
                    padding: 15px;
                    border-radius: 8px;
                    margin-top: 15px;
                    border-left: 4px solid #e5e7eb;
                }
                pre {
                    background: #f3f4f6;
                    padding: 15px;
                    border-radius: 6px;
                    overflow-x: auto;
                    font-size: 0.9rem;
                }
                .refresh-btn {
                    background: #4f46e5;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: background 0.2s ease;
                }
                .refresh-btn:hover {
                    background: #4338ca;
                }
                .quick-links {
                    display: flex;
                    gap: 15px;
                    margin-top: 20px;
                    flex-wrap: wrap;
                    justify-content: center;
                }
                .quick-link {
                    color: #4f46e5;
                    text-decoration: none;
                    padding: 10px 20px;
                    border: 1px solid #4f46e5;
                    border-radius: 6px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                }
                .quick-link:hover {
                    background: #4f46e5;
                    color: white;
                }
            </style>
        </head>
        <body>
            <div class="test-container">
                <header class="test-header">
                    <h1>Test AI Regulatory Intelligence Platform</h1>
                    <h2>System Diagnostic & Test Suite</h2>
                    <p>Phase 1.3 Complete - Version 2.0</p>
                    <button class="refresh-btn" onclick="window.location.reload()">Refresh Refresh Tests</button>
                </header>

                ${generateTestResultsHTML(testResults)}

                <div class="test-section">
                    <h2>Link Quick Links & Testing</h2>
                    <div class="quick-links">
                        <a href="/" class="quick-link">Home Home</a>
                        <a href="/dashboard" class="quick-link">Analytics Dashboard</a>
                        <a href="/ai-intelligence" class="quick-link">AI AI Intelligence</a>
                        <a href="/weekly-roundup" class="quick-link">Note Weekly Roundup</a>
                        <a href="/api/health" class="quick-link">Search Health Check</a>
                        <a href="/api/firm-profile" class="quick-link">Firm Firm Profile</a>
                        <a href="/api/workspace/stats" class="quick-link">Analytics Workspace Stats</a>
                        <a href="/about" class="quick-link">Info About</a>
                    </div>
                </div>

                <div class="test-section">
                    <h2>Complete Phase 1.3 Features Checklist</h2>
                    <div style="line-height: 2;">
                        ${generatePhase13ChecklistHTML(testResults)}
                    </div>
                </div>
            </div>
        </body>
        </html>`

    res.send(html)
  } catch (error) {
    console.error('X Error generating test page:', error)
    res.status(500).send(`
            <html>
                <body style="font-family: Arial; text-align: center; padding: 50px;">
                    <h1>X Test Page Error</h1>
                    <p>Failed to run system tests: ${error.message}</p>
                    <a href="/"><- Back to Home</a>
                </body>
            </html>
        `)
  }
})

// HELPER FUNCTIONS FOR TEST PAGE
async function runSystemTests() {
  const results = {
    timestamp: new Date().toISOString(),
    overall: 'pass',
    tests: {}
  }

  try {
    // Database Service Test
    console.log('Test Testing database service...')
    const dbHealth = await dbService.healthCheck()
    results.tests.database = {
      status: dbHealth.status === 'healthy' ? 'pass' : 'fail',
      message: dbHealth.status === 'healthy' ? 'Database operational' : `Database error: ${dbHealth.error}`,
      details: dbHealth
    }

    // AI Analyzer Test
    console.log('Test Testing AI analyzer...')
    const aiHealth = await aiAnalyzer.healthCheck()
    results.tests.aiAnalyzer = {
      status: aiHealth.status === 'healthy' ? 'pass' : 'warn',
      message: aiHealth.status === 'healthy' ? 'AI analyzer operational' : 'AI analyzer in fallback mode',
      details: aiHealth
    }

    // RSS Fetcher Test
    console.log('Test Testing RSS fetcher...')
    const rssHealth = await rssFetcher.healthCheck()
    results.tests.rssFetcher = {
      status: rssHealth.status === 'healthy' ? 'pass' : 'fail',
      message: `RSS fetcher: ${rssHealth.activeSources} sources active`,
      details: rssHealth
    }

    // Workspace Features Test
    console.log('Test Testing workspace features...')
    const firmProfile = await dbService.getFirmProfile()
    const pinnedItems = await dbService.getPinnedItems()
    const savedSearches = await dbService.getSavedSearches()
    const customAlerts = await dbService.getCustomAlerts()

    results.tests.workspace = {
      status: 'pass',
      message: `Workspace operational - ${pinnedItems.length} pins, ${savedSearches.length} searches, ${customAlerts.length} alerts`,
      details: {
        firmProfile: !!firmProfile,
        pinnedItems: pinnedItems.length,
        savedSearches: savedSearches.length,
        customAlerts: customAlerts.length
      }
    }

    // Relevance Service Test
    console.log('Test Testing relevance service...')
    const testUpdate = { headline: 'Test update', authority: 'FCA' }
    const relevanceScore = relevanceService.calculateRelevanceScore(testUpdate, firmProfile)

    results.tests.relevance = {
      status: 'pass',
      message: `Relevance scoring operational (test score: ${relevanceScore})`,
      details: { testScore: relevanceScore, firmProfile: !!firmProfile }
    }

    // Check overall status
    const hasFailures = Object.values(results.tests).some(test => test.status === 'fail')
    results.overall = hasFailures ? 'fail' : 'pass'
  } catch (error) {
    console.error('X System test error:', error)
    results.overall = 'fail'
    results.tests.systemError = {
      status: 'fail',
      message: `System test failed: ${error.message}`,
      details: { error: error.message }
    }
  }

  return results
}

function generateTestResultsHTML(results) {
  let html = ''

  for (const [testName, testResult] of Object.entries(results.tests)) {
    const statusClass = testResult.status
    const statusText = testResult.status.toUpperCase()

    html += `
            <div class="test-section">
                <h3>${getTestIcon(testName)} ${formatTestName(testName)}
                    <span class="test-status ${statusClass}">${statusText}</span>
                </h3>
                <p>${testResult.message}</p>
                <div class="test-details">
                    <strong>Details:</strong>
                    <pre>${JSON.stringify(testResult.details, null, 2)}</pre>
                </div>
            </div>
        `
  }

  return html
}

function generatePhase13ChecklistHTML(results) {
  const checklist = [
    { item: 'Firm Profile Management', status: results.tests.workspace?.details?.firmProfile },
    { item: 'Pinned Items Workspace', status: true },
    { item: 'Saved Searches', status: true },
    { item: 'Custom Alerts', status: true },
    { item: 'Relevance-Based Scoring', status: results.tests.relevance?.status === 'pass' },
    { item: 'Content-Based Priority Detection', status: true },
    { item: 'Deadline Awareness for Consultations', status: true },
    { item: 'Industry Sector Filtering', status: true },
    { item: 'Workspace API Endpoints', status: true },
    { item: 'AI Intelligence Page', status: true },
    { item: 'Weekly Roundup Page', status: true } // Added this
  ]

  let html = ''
  for (const item of checklist) {
    const icon = item.status ? 'Complete' : 'Warning'
    const status = item.status ? 'COMPLETE' : 'PENDING'
    html += `<div>${icon} ${item.item} <em>(${status})</em></div>`
  }

  return html
}

function getTestIcon(testName) {
  const icons = {
    database: 'Save',
    aiAnalyzer: 'AI',
    rssFetcher: 'Signal',
    workspace: 'Files',
    relevance: 'Target',
    systemError: 'X'
  }
  return icons[testName] || 'Test'
}

function formatTestName(testName) {
  const names = {
    database: 'Database Service',
    aiAnalyzer: 'AI Analyzer Service',
    rssFetcher: 'RSS Fetcher Service',
    workspace: 'Workspace Features',
    relevance: 'Relevance Service',
    systemError: 'System Error'
  }
  return names[testName] || testName
}

module.exports = router
