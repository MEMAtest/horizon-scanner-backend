const { getCommonStyles } = require('../../templates/commonStyles')
const { getClientScripts } = require('../../templates/clientScripts')
const { getSectorIntelligenceStyles } = require('./styles')
const { escapeHtml } = require('./utils')

function renderSectorIntelligencePage({
  sidebar,
  pageIcon,
  sector,
  stats,
  sectors,
  sectorUpdates,
  canaryStyles
}) {
  return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${sector} Intelligence - Regulatory Intelligence Platform</title>
            ${getCommonStyles()}
${getSectorIntelligenceStyles(canaryStyles)}
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
}

module.exports = { renderSectorIntelligencePage }
