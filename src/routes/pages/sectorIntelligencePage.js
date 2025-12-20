// src/routes/pages/sectorIntelligencePage.js
// Sector Intelligence Page Renderer

const { getCommonStyles } = require('../templates/commonStyles')
const { getSidebar } = require('../templates/sidebar')
const { getClientScripts } = require('../templates/clientScripts')
const dbService = require('../../services/dbService')
const { getIntelligenceIcon, wrapIconInContainer, getCanaryAnimationStyles } = require('../../views/icons')

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function normalizeDateValue(update) {
  const value = update?.compliance_deadline || update?.complianceDeadline || update?.deadline
  if (!value) return null
  const parsed = new Date(value)
  return isNaN(parsed) ? null : parsed
}

function getPublishedDate(update) {
  const value = update?.publishedDate || update?.published_date || update?.fetchedDate || update?.createdAt
  if (!value) return null
  const parsed = new Date(value)
  return isNaN(parsed) ? null : parsed
}

function isEnforcementUpdate(update) {
  const text = `${(update.headline || '').toLowerCase()} ${(update.summary || update.ai_summary || update.impact || '').toLowerCase()}`
  const keywords = ['enforcement', 'penalty', 'sanction', 'fined', 'warning notice', 'final notice', 'disciplinary']
  return keywords.some(keyword => text.includes(keyword))
}

function isConsultationUpdate(update) {
  const text = `${(update.headline || '').toLowerCase()} ${(update.summary || update.ai_summary || update.impact || '').toLowerCase()}`
  return text.includes('consultation') || text.includes('call for input') || text.includes('feedback statement')
}

function formatDate(date) {
  if (!(date instanceof Date) || isNaN(date)) return 'TBD'
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function renderSectorIntelligencePage(req, res, sector = 'Banking') {
  try {
    console.log(`Firm Rendering sector intelligence page for: ${sector}`)

    // Get canary icon for this page
    const canaryStyles = getCanaryAnimationStyles()
    const pageIcon = wrapIconInContainer(getIntelligenceIcon())

    // Get sector-specific data
    const allUpdates = await dbService.getEnhancedUpdates({ limit: 200 })
    const sectorUpdates = allUpdates.filter(update =>
      update.sector === sector ||
            (update.primarySectors && update.primarySectors.includes(sector)) ||
            (update.firmTypesAffected && update.firmTypesAffected.includes(sector))
    )

    // Calculate sector statistics
    const stats = calculateSectorStats(sectorUpdates, sector)

    // Get sidebar
    const sidebar = await getSidebar('sector-intelligence')

    const sectors = [
      'Banking', 'Investment Management', 'Insurance', 'Payment Services',
      'Fintech', 'Credit Unions', 'Pension Funds', 'Real Estate Finance',
      'Consumer Credit', 'Capital Markets', 'Private Equity', 'Hedge Funds',
      'Cryptocurrency', 'RegTech', 'Wealth Management', 'Corporate Finance'
    ]

    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${sector} Intelligence - Regulatory Intelligence Platform</title>
            ${getCommonStyles()}
            <style>
                ${canaryStyles}
                .intelligence-header {
                    background: #ffffff;
                    color: #0f172a;
                    padding: 32px;
                    border-radius: 18px;
                    margin-bottom: 32px;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 24px 48px -28px rgba(15, 23, 42, 0.25);
                }

                .sector-title {
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

                .pressure-overview {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: 20px;
                    margin-bottom: 20px;
                }

                .pressure-gauge {
                    background: #f8fafc;
                    color: #0f172a;
                    padding: 24px;
                    border-radius: 16px;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    justify-content: center;
                    gap: 8px;
                    border: 1px solid #dbeafe;
                    box-shadow: 0 16px 32px rgba(37, 99, 235, 0.14);
                }

                .gauge-score {
                    font-size: 2.6rem;
                    font-weight: 700;
                    color: #1d4ed8;
                }

                .gauge-label {
                    font-size: 0.95rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: #1e3a8a;
                }

                .gauge-trend {
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: #475569;
                }

                .gauge-trend.rising {
                    color: #047857;
                }

                .gauge-trend.cooling {
                    color: #b91c1c;
                }

                .pressure-breakdown {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                    gap: 16px;
                }

                .breakdown-item {
                    background: #ffffff;
                    border-radius: 12px;
                    padding: 16px;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 8px 16px rgba(15, 23, 42, 0.06);
                }

                .breakdown-label {
                    font-size: 0.85rem;
                    color: #1e3a8a;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                }

                .breakdown-value {
                    display: block;
                    margin-top: 8px;
                    font-size: 1.4rem;
                    font-weight: 700;
                    color: #0f172a;
                }

                .pressure-keyfindings ul {
                    margin: 0;
                    padding-left: 18px;
                    color: #1f2937;
                }

                .timeline-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 16px;
                }

                .timeline-card {
                    border-radius: 12px;
                    padding: 18px;
                    border: 1px solid #e5e7eb;
                    background: #f9fafb;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .timeline-card.severity-critical {
                    border-color: #fca5a5;
                    background: #fef2f2;
                }

                .timeline-card.severity-elevate {
                    border-color: #fcd34d;
                    background: #fffbeb;
                }

                .timeline-date {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: #047857;
                }

                .timeline-title {
                    font-weight: 600;
                    color: #111827;
                }

                .timeline-meta {
                    font-size: 0.85rem;
                    color: #6b7280;
                }

                .timeline-countdown {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: #047857;
                }

                .timeline-link {
                    font-size: 0.85rem;
                    color: #047857;
                    text-decoration: none;
                    font-weight: 600;
                }

                .playbook-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 16px;
                }

                .playbook-card {
                    border-radius: 12px;
                    padding: 18px;
                    border: 1px solid #e2e8f0;
                    background: #ffffff;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
                }

                .playbook-card.level-critical {
                    border-color: #f87171;
                    background: #fef2f2;
                }

                .playbook-card.level-elevate {
                    border-color: #facc15;
                    background: #fffbeb;
                }

                .playbook-card.level-monitor {
                    border-color: #a7f3d0;
                    background: #ecfdf5;
                }

                .playbook-level {
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    margin-bottom: 8px;
                    color: #047857;
                }

                .playbook-title {
                    font-size: 1rem;
                    font-weight: 700;
                    color: #1f2937;
                    margin-bottom: 6px;
                }

                .playbook-description {
                    font-size: 0.9rem;
                    color: #475569;
                    line-height: 1.45;
                }

                .alert-rule-list {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 16px;
                }

                .alert-rule {
                    border-radius: 12px;
                    padding: 18px;
                    border: 1px solid #e5e7eb;
                    background: #f9fafb;
                }

                .alert-rule.severity-high {
                    border-color: #f87171;
                    background: #fef2f2;
                }

                .alert-rule.severity-medium {
                    border-color: #facc15;
                    background: #fffbeb;
                }

                .alert-rule.severity-low {
                    border-color: #bae6fd;
                    background: #f0f9ff;
                }

                .alert-rule-title {
                    font-size: 1rem;
                    font-weight: 600;
                    color: #1f2937;
                    margin-bottom: 6px;
                }

                .alert-rule-detail {
                    font-size: 0.9rem;
                    color: #475569;
                    line-height: 1.4;
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
                    background: #f0fdf4;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 15px;
                    border-left: 4px solid #10b981;
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

                .sector-selector {
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

                .sector-btn {
                    padding: 8px 16px;
                    background: rgba(255,255,255,0.2);
                    color: white;
                    text-decoration: none;
                    border-radius: 20px;
                    font-size: 0.9rem;
                    transition: all 0.2s ease;
                }

                .sector-btn:hover,
                .sector-btn.active {
                    background: white;
                    color: #10b981;
                }

                .empty-state {
                    text-align: center;
                    padding: 40px;
                    color: #6b7280;
                }

                .risk-indicator {
                    display: inline-block;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    margin-top: 15px;
                }

                .risk-high {
                    background: #fef2f2;
                    color: #dc2626;
                }

                .risk-medium {
                    background: #fffbeb;
                    color: #d97706;
                }

                .risk-low {
                    background: #f0fdf4;
                    color: #059669;
                }

                .pressure-analysis {
                    background: #f8fafc;
                    padding: 20px;
                    border-radius: 8px;
                    border-left: 4px solid #10b981;
                    margin-top: 20px;
                }
            </style>
        </head>
        <body>
            <div class="app-container">
                ${sidebar}

                <main class="main-content">
                    <header class="intelligence-header">
                        <a href="/" class="back-link"><- Back to Home</a>
                        <h1 class="sector-title">
                            ${pageIcon}
                            ${sector} Sector Intelligence
                        </h1>
                        <p>Regulatory pressure analysis and compliance priority recommendations</p>

                        <div class="stats-grid">
                            <div class="stat-card">
                                <div class="stat-value">${stats.totalUpdates}</div>
                                <div class="stat-label">Relevant Updates</div>
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
                                <div class="stat-value">${stats.pressureScore}</div>
                                <div class="stat-label">Pressure Score</div>
                            </div>
                        </div>

                        <div class="sector-selector">
                            ${sectors.slice(0, 8).map(sect => `
                                <a href="/sector-intelligence/${sect}" class="sector-btn ${sect === sector ? 'active' : ''}">${sect}</a>
                            `).join('')}
                        </div>

                        <div class="header-actions">
                            <button
                                type="button"
                                class="btn btn-primary"
                                data-sector="${escapeHtml(sector)}"
                                onclick="ReportModule.exportReport('sector_risk', { sector: this.dataset.sector, limit: 100 })">
                                Export Sector Risk Brief
                            </button>
                        </div>
                    </header>

                    <div class="content-section">
                        <h2 class="section-title">
                            Pressure Dashboard
                        </h2>

                        <div class="pressure-overview">
                            <div class="pressure-gauge">
                                <div class="gauge-score">${stats.pressureScore}</div>
                                <div class="gauge-label">${stats.riskLevel} Pressure</div>
                                <div class="gauge-trend ${stats.velocity.trendLabel}">Velocity: ${stats.velocity.currentWeek} vs ${stats.velocity.previousWeek}</div>
                            </div>
                            <div class="pressure-breakdown">
                                <div class="breakdown-item">
                                    <span class="breakdown-label">High impact updates</span>
                                    <span class="breakdown-value">${stats.highImpact}</span>
                                </div>
                                <div class="breakdown-item">
                                    <span class="breakdown-label">Enforcement share</span>
                                    <span class="breakdown-value">${stats.pressureDrivers.share.enforcement}%</span>
                                </div>
                                <div class="breakdown-item">
                                    <span class="breakdown-label">Consultation share</span>
                                    <span class="breakdown-value">${stats.pressureDrivers.share.consultation}%</span>
                                </div>
                                <div class="breakdown-item">
                                    <span class="breakdown-label">Policy updates</span>
                                    <span class="breakdown-value">${stats.pressureDrivers.counts.policy}</span>
                                </div>
                            </div>
                        </div>

                        <div class="pressure-keyfindings">
                            <ul>
                                ${stats.keyFindings.length > 0
? stats.keyFindings.map(finding => `<li>${escapeHtml(finding)}</li>`).join('')
: '<li>No significant pressure signals captured this week.</li>'}
                            </ul>
                        </div>
                    </div>

                    <div class="content-section">
                        <h2 class="section-title">
                            Deadline Timeline
                        </h2>

                        ${stats.timeline.length > 0
? `
                        <div class="timeline-grid">
                            ${stats.timeline.map(item => `
                                <div class="timeline-card severity-${item.severity}">
                                    <div class="timeline-date">${escapeHtml(item.deadline)}</div>
                                    <div class="timeline-title">${escapeHtml(item.title)}</div>
                                    <div class="timeline-meta">${escapeHtml(item.type)} • ${escapeHtml(item.owner)}</div>
                                    <div class="timeline-countdown">${item.daysUntil >= 0 ? `${item.daysUntil} days remaining` : `Due ${Math.abs(item.daysUntil)} days ago`}</div>
                                    ${item.url ? `<a href="${escapeHtml(item.url)}" target="_blank" class="timeline-link">View source</a>` : ''}
                                </div>
                            `).join('')}
                        </div>
                        `
: `
                        <div class="empty-state">
                            <p>No upcoming deadlines recorded. Capture deadlines via annotations to populate this view.</p>
                        </div>
                        `}
                    </div>

                    <div class="content-section">
                        <h2 class="section-title">
                            Playbook Suggestions
                        </h2>

                        ${stats.playbookSuggestions.length > 0
? `
                        <div class="playbook-grid">
                            ${stats.playbookSuggestions.map(card => `
                                <div class="playbook-card level-${card.level.toLowerCase()}">
                                    <div class="playbook-level">${escapeHtml(card.level)}</div>
                                    <div class="playbook-title">${escapeHtml(card.title)}</div>
                                    <p class="playbook-description">${escapeHtml(card.description)}</p>
                                </div>
                            `).join('')}
                        </div>
                        `
: `
                        <div class="empty-state">
                            <p>No immediate playbook actions triggered. Maintain standard monitoring for ${escapeHtml(sector)}.</p>
                        </div>
                        `}
                    </div>

                    <div class="content-section">
                        <h2 class="section-title">
                            Alert Rules
                        </h2>

                        <div class="alert-rule-list">
                            ${stats.alertRules.map(rule => `
                                <div class="alert-rule severity-${rule.severity.toLowerCase()}">
                                    <div class="alert-rule-title">${escapeHtml(rule.title)}</div>
                                    <p class="alert-rule-detail">${escapeHtml(rule.detail)}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="content-section">
                        <h2 class="section-title">
                            Target Regulatory Pressure Analysis
                        </h2>

                        <div class="pressure-analysis">
                            <h3>Current Pressure Level: <span class="risk-indicator risk-${stats.riskLevel.toLowerCase()}">${stats.riskLevel} Risk</span></h3>
                            <p>Based on analysis of ${stats.totalUpdates} relevant regulatory updates, the ${escapeHtml(sector)} sector is experiencing <strong>${stats.riskLevel.toLowerCase()} regulatory pressure</strong>.</p>
                            <p>Drivers: ${stats.pressureDrivers.counts.enforcement} enforcement, ${stats.pressureDrivers.counts.consultation} consultation, and ${stats.pressureDrivers.counts.policy} policy updates contributing to the score.</p>
                            <p>Velocity trend: ${stats.velocity.trendLabel === 'rising' ? 'Increasing momentum' : stats.velocity.trendLabel === 'cooling' ? 'Cooling cadence' : 'Steady cadence'} (${stats.velocity.currentWeek} vs ${stats.velocity.previousWeek}).</p>
                        </div>
                    </div>

                    <div class="content-section">
                        <h2 class="section-title">
                            Analytics Recent Regulatory Updates for ${sector}
                        </h2>

                        ${sectorUpdates.length > 0
? sectorUpdates.slice(0, 10).map(update => `
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
                                    <span>${update.authority || 'Unknown'}</span>
                                    <span>${new Date(update.fetchedDate || update.createdAt).toLocaleDateString()}</span>
                                    ${update.businessImpactScore ? `<span>Impact: ${update.businessImpactScore}/10</span>` : ''}
                                    ${update.sectorRelevanceScores && update.sectorRelevanceScores[sector] ? `<span>Relevance: ${update.sectorRelevanceScores[sector]}%</span>` : ''}
                                </div>
                            </div>
                        `).join('')
: `
                            <div class="empty-state">
                                <p>No recent updates found specifically for the ${sector} sector</p>
                                <p><a href="/dashboard" style="color: #10b981;">View all updates</a></p>
                            </div>
                        `}
                    </div>

                    <div class="content-section">
                        <h2 class="section-title">
                            Note Compliance Priorities
                        </h2>

                        ${stats.priorities.length > 0
? `
                            <ol>
                                ${stats.priorities.map(priority => `
                                    <li style="margin-bottom: 10px;">
                                        <strong>${priority.title}</strong> - ${priority.description}
                                    </li>
                                `).join('')}
                            </ol>
                        `
: `
                            <p>No specific compliance priorities identified for the ${sector} sector at this time.</p>
                        `}
                    </div>
                </main>
            </div>

            ${getClientScripts()}
        </body>
        </html>`

    res.send(html)
  } catch (error) {
    console.error('X Error rendering sector intelligence page:', error)
    res.status(500).send(`
            <div style="padding: 2rem; text-align: center; font-family: system-ui;">
                <h1>Sector Intelligence Error</h1>
                <p style="color: #6b7280; margin: 1rem 0;">${error.message}</p>
                <a href="/" style="color: #3b82f6; text-decoration: none;"><- Back to Home</a>
            </div>
        `)
  }
}

function calculateSectorStats(updates, sector) {
  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const weekAgo = new Date(now)
  weekAgo.setDate(now.getDate() - 7)
  const previousWeekStart = new Date(weekAgo)
  previousWeekStart.setDate(previousWeekStart.getDate() - 7)

  const recentUpdates = []
  const highImpactUpdates = []
  const enforcementUpdates = []
  const consultationUpdates = []
  const policyUpdates = []
  const timelineCandidates = []

  let currentWeek = 0
  let previousWeek = 0

  updates.forEach(update => {
    const published = getPublishedDate(update)
    if (published) {
      if (published >= weekAgo) currentWeek += 1
      else if (published >= previousWeekStart) previousWeek += 1
      if (published >= thisMonth) recentUpdates.push(update)
    }

    const impactScore = update.businessImpactScore || update.business_impact_score || 0
    const impactLevel = (update.impactLevel || update.impact_level || '').toLowerCase()
    if (impactLevel === 'significant' || impactScore >= 7) {
      highImpactUpdates.push(update)
    }

    if (isEnforcementUpdate(update)) enforcementUpdates.push(update)
    if (isConsultationUpdate(update)) consultationUpdates.push(update)
    if ((update.contentType || update.content_type || '').toLowerCase().includes('policy')) {
      policyUpdates.push(update)
    }

    const deadline = normalizeDateValue(update)
    if (deadline) {
      const diffDays = Math.round((deadline - now) / (1000 * 60 * 60 * 24))
      if (diffDays >= -5) {
        const severity = diffDays <= 14 ? 'critical' : diffDays <= 30 ? 'elevate' : 'monitor'
        const type = isConsultationUpdate(update)
          ? 'Consultation'
          : isEnforcementUpdate(update)
            ? 'Enforcement Follow-up'
            : 'Regulatory Milestone'
        const owner = type === 'Consultation'
          ? 'Policy & Public Affairs'
          : type === 'Enforcement Follow-up'
            ? 'Compliance & Legal'
            : 'Business Operations'

        timelineCandidates.push({
          title: update.headline || 'Regulatory deadline',
          authority: update.authority || 'Unknown Authority',
          deadline,
          daysUntil: diffDays,
          severity,
          type,
          owner,
          url: update.url || null
        })
      }
    }
  })

  const impactScores = updates
    .filter(update => update.businessImpactScore || update.business_impact_score)
    .map(update => update.businessImpactScore || update.business_impact_score)

  const avgImpactScore = impactScores.length > 0
    ? Math.round((impactScores.reduce((a, b) => a + b, 0) / impactScores.length) * 10) / 10
    : 0

  const baseScore = (updates.length * 2) +
    (highImpactUpdates.length * 10) +
    (recentUpdates.length * 5) +
    (avgImpactScore * 3)

  const enforcementWeight = enforcementUpdates.length * 8
  const consultationWeight = consultationUpdates.length * 6
  const velocityWeight = Math.max(0, currentWeek - previousWeek) * 4

  const rawScore = baseScore + enforcementWeight + consultationWeight + velocityWeight
  const pressureScore = Math.min(100, Math.round(rawScore))

  let riskLevel = 'Low'
  if (pressureScore > 70) riskLevel = 'High'
  else if (pressureScore > 40) riskLevel = 'Medium'

  const keyFindings = []
  if (highImpactUpdates.length > 0) {
    keyFindings.push(`${highImpactUpdates.length} high-impact regulatory changes affecting the sector`)
  }
  if (consultationUpdates.length > 0) {
    keyFindings.push(`${consultationUpdates.length} active consultation items to track`)
  }
  if (enforcementUpdates.length > 0) {
    keyFindings.push(`${enforcementUpdates.length} enforcement-related notices requiring response planning`)
  }
  if (currentWeek > previousWeek) {
    keyFindings.push(`Publication velocity up ${currentWeek - previousWeek} week over week`)
  }

  const driverCounts = {
    enforcement: enforcementUpdates.length,
    consultation: consultationUpdates.length,
    policy: policyUpdates.length
  }

  const driverTotal = driverCounts.enforcement + driverCounts.consultation + driverCounts.policy
  const driverShare = driverTotal > 0
    ? {
        enforcement: Math.round((driverCounts.enforcement / driverTotal) * 100),
        consultation: Math.round((driverCounts.consultation / driverTotal) * 100),
        policy: Math.round((driverCounts.policy / driverTotal) * 100)
      }
    : { enforcement: 0, consultation: 0, policy: 0 }

  const timeline = timelineCandidates
    .sort((a, b) => a.deadline - b.deadline)
    .slice(0, 6)
    .map(item => ({
      title: item.title,
      authority: item.authority,
      deadline: formatDate(item.deadline),
      daysUntil: item.daysUntil,
      severity: item.severity,
      type: item.type,
      owner: item.owner,
      url: item.url
    }))

  const velocity = {
    currentWeek,
    previousWeek,
    trendLabel: currentWeek > previousWeek ? 'rising' : currentWeek < previousWeek ? 'cooling' : 'steady'
  }

  const playbookSuggestions = buildPlaybookSuggestions({
    riskLevel,
    consultationCount: consultationUpdates.length,
    enforcementCount: enforcementUpdates.length,
    timelineCount: timeline.length,
    velocityTrend: velocity.trendLabel,
    sector
  })

  const alertRules = buildAlertRules({
    sector,
    riskLevel,
    pressureScore,
    consultations: consultationUpdates.length,
    enforcement: enforcementUpdates.length,
    velocity
  })

  const priorities = []
  if (highImpactUpdates.length > 0) {
    priorities.push({
      title: 'Review High-Impact Changes',
      description: `Assess ${highImpactUpdates.length} significant regulatory updates for compliance gaps`
    })
  }
  if (recentUpdates.length > 5) {
    priorities.push({
      title: 'Monitor Recent Developments',
      description: `Track ${recentUpdates.length} recent updates for emerging requirements`
    })
  }
  priorities.push({
    title: 'Sector-Specific Training',
    description: `Ensure teams are updated on ${sector}-specific regulatory requirements`
  })

  return {
    totalUpdates: updates.length,
    highImpact: highImpactUpdates.length,
    recentActivity: recentUpdates.length,
    pressureScore,
    riskLevel,
    keyFindings: keyFindings.slice(0, 3),
    priorities: priorities.slice(0, 5),
    pressureDrivers: {
      counts: driverCounts,
      share: driverShare
    },
    timeline,
    playbookSuggestions,
    alertRules,
    velocity
  }
}

function buildPlaybookSuggestions(context) {
  const suggestions = []

  if (context.riskLevel === 'High') {
    suggestions.push({
      title: 'Activate Sector War Room',
      description: 'Schedule daily stand-up with compliance, legal, and business owners to coordinate response.',
      level: 'Critical'
    })
  } else if (context.riskLevel === 'Medium') {
    suggestions.push({
      title: 'Weekly Monitoring Cadence',
      description: 'Lock weekly review with sector stakeholders to track developing obligations.',
      level: 'Elevate'
    })
  }

  if (context.consultationCount > 0) {
    suggestions.push({
      title: 'Consultation Response Plan',
      description: 'Map accountable owners and draft response timeline for active consultations.',
      level: context.consultationCount >= 3 ? 'Elevate' : 'Monitor'
    })
  }

  if (context.enforcementCount > 0) {
    suggestions.push({
      title: 'Enforcement Readiness',
      description: 'Brief legal/compliance on enforcement notices impacting this sector and identify exposures.',
      level: 'Elevate'
    })
  }

  if (context.timelineCount > 0) {
    suggestions.push({
      title: 'Deadline Ownership Check',
      description: 'Confirm accountable owners and evidence for upcoming sector deadlines.',
      level: 'Monitor'
    })
  }

  if (context.velocityTrend === 'rising') {
    suggestions.push({
      title: 'Increase Analyst Coverage',
      description: 'Allocate additional analyst hours to manage surge in sector updates.',
      level: 'Elevate'
    })
  }

  return suggestions.slice(0, 4)
}

function buildAlertRules(context) {
  return [
    {
      title: 'Pressure score crosses 70',
      detail: 'Send immediate alert to sector leadership and compliance mailbox.',
      severity: context.pressureScore >= 70 ? 'High' : 'Medium'
    },
    {
      title: 'New consultation due within 30 days',
      detail: 'Notify policy/operations leads to trigger response workflow.',
      severity: context.consultations > 0 ? 'Medium' : 'Low'
    },
    {
      title: 'Enforcement notice published for sector firms',
      detail: 'Escalate to legal for case review and remediation tracking.',
      severity: context.enforcement > 0 ? 'Medium' : 'Low'
    },
    {
      title: 'Velocity spike week-over-week',
      detail: 'Ping sector channel if weekly updates exceed prior period.',
      severity: context.velocity.trendLabel === 'rising' ? 'Medium' : 'Low'
    }
  ]
}

module.exports = renderSectorIntelligencePage
