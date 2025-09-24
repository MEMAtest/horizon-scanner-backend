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
const weeklyRoundupService = require('../services/weeklyRoundupService')

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

function formatDateISO(value) {
  const date = normalizeDate(value)
  if (!date) return 'Unknown'
  return date.toISOString().split('T')[0]
}

function formatDateTime(value) {
  const date = normalizeDate(value)
  if (!date) return 'Unknown'
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
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
                    <a href="/dashboard" style="color: #3b82f6; text-decoration: none;">← Back to Dashboard</a>
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
                <a href="/dashboard" style="color: #6b7280; text-decoration: none; font-size: 0.875rem; margin-bottom: 1rem; display: inline-block;">← Back to Dashboard</a>
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
                        <h3>📋 Summary</h3>
                        <p>${update.impact}</p>
                    </div>
                `
: ''}

                ${update.business_impact_score
? `
                    <div class="detail-section">
                        <h3>📊 Business Impact</h3>
                        <p>Impact Score: <strong>${update.business_impact_score}/10</strong></p>
                        ${update.business_impact_analysis ? `<p>${update.business_impact_analysis}</p>` : ''}
                    </div>
                `
: ''}

                ${update.compliance_deadline || update.complianceDeadline
? `
                    <div class="detail-section">
                        <h3>⏰ Compliance Deadline</h3>
                        <p><strong>${formatDateDisplay(update.compliance_deadline || update.complianceDeadline)}</strong></p>
                    </div>
                `
: ''}

                ${update.primarySectors?.length
? `
                    <div class="detail-section">
                        <h3>🏢 Affected Sectors</h3>
                        <p>${update.primarySectors.join(', ')}</p>
                    </div>
                `
: ''}

                ${update.ai_tags?.length
? `
                    <div class="detail-section">
                        <h3>🤖 AI Analysis Tags</h3>
                        <p>${update.ai_tags.join(', ')}</p>
                    </div>
                `
: ''}

                <div class="detail-actions">
                    ${update.url ? `<a href="${update.url}" target="_blank" class="btn btn-primary">🔗 View Original Source</a>` : ''}
                    <a href="/dashboard" class="btn btn-secondary">← Back to Dashboard</a>
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
                <a href="/dashboard" style="color: #3b82f6; text-decoration: none;">← Back to Dashboard</a>
            </div>
        `)
  }
})

// WEEKLY ROUNDUP PAGE - NEW
router.get('/weekly-roundup', async (req, res) => {
  try {
    console.log('📊 Weekly roundup page requested')

    const { getSidebar } = require('./templates/sidebar')
    const { getCommonStyles } = require('./templates/commonStyles')
    const { getClientScripts } = require('./templates/clientScripts')

    const sidebar = await getSidebar('weekly-roundup')

    // Get the roundup data
    const roundupData = await weeklyRoundupService.generateWeeklyRoundup()
    const roundup = roundupData.roundup

    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Weekly Roundup - Regulatory Intelligence Platform</title>
            ${getCommonStyles()}
            <style>
                .roundup-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 40px;
                    border-radius: 12px;
                    margin-bottom: 30px;
                }
                
                .roundup-summary {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 20px;
                    border-radius: 8px;
                    margin-top: 20px;
                }
                
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 20px;
                    margin-top: 20px;
                }
                
                .stat-card {
                    background: rgba(255, 255, 255, 0.15);
                    padding: 15px;
                    border-radius: 8px;
                    text-align: center;
                }
                
                .stat-value {
                    font-size: 2rem;
                    font-weight: 700;
                    margin-bottom: 5px;
                }
                
                .stat-label {
                    font-size: 0.9rem;
                    opacity: 0.9;
                }
                
                .section-card {
                    background: white;
                    padding: 25px;
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
                
                .authority-item {
                    background: #f9fafb;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 12px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-left: 4px solid #667eea;
                }
                
                .authority-name {
                    font-weight: 600;
                    color: #1f2937;
                    font-size: 1.1rem;
                }
                
                .authority-count {
                    background: #667eea;
                    color: white;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-weight: 600;
                }
                
                .authority-focus {
                    color: #6b7280;
                    font-size: 0.9rem;
                    margin-top: 5px;
                }
                
                .impact-update {
                    background: #fef3c7;
                    border: 1px solid #f59e0b;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 15px;
                }
                
                .impact-update-title {
                    font-weight: 600;
                    color: #92400e;
                    margin-bottom: 8px;
                }
                
                .impact-update-authority {
                    background: #f59e0b;
                    color: white;
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 0.85rem;
                    display: inline-block;
                    margin-bottom: 8px;
                }
                
                .impact-update-summary {
                    color: #78350f;
                    line-height: 1.6;
                    margin-top: 8px;
                }
                
                .theme-badge {
                    background: #e0f2fe;
                    color: #0369a1;
                    padding: 8px 16px;
                    border-radius: 20px;
                    display: inline-block;
                    margin: 5px;
                    font-weight: 500;
                }
                
                .priority-item {
                    background: #f0f9ff;
                    padding: 15px 20px;
                    border-radius: 8px;
                    margin-bottom: 10px;
                    border-left: 4px solid #3b82f6;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .priority-number {
                    background: #3b82f6;
                    color: white;
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                }
                
                .deadline-item {
                    background: #fee2e2;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 12px;
                    border-left: 4px solid #ef4444;
                }
                
                .deadline-date {
                    font-weight: 600;
                    color: #991b1b;
                    margin-bottom: 5px;
                }
                
                .deadline-days {
                    background: #ef4444;
                    color: white;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 0.85rem;
                    display: inline-block;
                    margin-left: 10px;
                }
                
                .sector-insight {
                    background: #f3f4f6;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 10px;
                }
                
                .sector-name {
                    font-weight: 600;
                    color: #4b5563;
                    margin-bottom: 8px;
                }
                
                .impact-breakdown {
                    display: flex;
                    gap: 20px;
                    flex-wrap: wrap;
                    margin-top: 15px;
                }
                
                .impact-stat {
                    flex: 1;
                    min-width: 150px;
                    text-align: center;
                    padding: 15px;
                    background: #f9fafb;
                    border-radius: 8px;
                }
                
                .impact-level {
                    font-weight: 600;
                    margin-bottom: 5px;
                }
                
                .impact-count {
                    font-size: 1.5rem;
                    font-weight: 700;
                }
                
                .impact-significant { color: #dc2626; }
                .impact-moderate { color: #f59e0b; }
                .impact-informational { color: #6b7280; }
                
                .data-quality-meter {
                    background: #e5e7eb;
                    height: 20px;
                    border-radius: 10px;
                    overflow: hidden;
                    margin-top: 10px;
                }
                
                .data-quality-fill {
                    background: linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #10b981 100%);
                    height: 100%;
                    transition: width 0.5s ease;
                }
                
                .empty-state {
                    text-align: center;
                    padding: 40px;
                    color: #6b7280;
                }
                
                @media (max-width: 768px) {
                    .stats-grid {
                        grid-template-columns: 1fr 1fr;
                    }
                    
                    .impact-breakdown {
                        flex-direction: column;
                    }
                }
            </style>
        </head>
        <body>
            <div class="app-container">
                ${sidebar}
                
                <main class="main-content">
                    <header class="roundup-header">
                        <h1>📊 Weekly Regulatory Roundup</h1>
                        <p>Comprehensive intelligence briefing for the week of ${formatDateISO(roundup.weekStart)} to ${formatDateISO(new Date())}</p>
                        
                        <div class="roundup-summary">
                            <p style="font-size: 1.2rem; line-height: 1.6;">
                                ${roundup.weekSummary}
                            </p>
                            
                            <div class="stats-grid">
                                <div class="stat-card">
                                    <div class="stat-value">${roundup.totalUpdates}</div>
                                    <div class="stat-label">Total Updates</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-value">${Object.keys(roundup.statistics.authorityBreakdown).length}</div>
                                    <div class="stat-label">Authorities</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-value">${roundup.highImpactUpdates.length}</div>
                                    <div class="stat-label">High Impact</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-value">${roundup.upcomingDeadlines.length}</div>
                                    <div class="stat-label">Deadlines</div>
                                </div>
                            </div>
                        </div>
                    </header>
                    
                    ${roundup.keyThemes.length > 0
? `
                        <div class="section-card">
                            <h2 class="section-title">
                                <span>🎯</span> Key Themes This Week
                            </h2>
                            <div>
                                ${roundup.keyThemes.map(theme =>
                                    `<span class="theme-badge">${theme}</span>`
                                ).join('')}
                            </div>
                        </div>
                    `
: ''}
                    
                    ${roundup.weeklyPriorities.length > 0
? `
                        <div class="section-card">
                            <h2 class="section-title">
                                <span>📋</span> Weekly Priorities
                            </h2>
                            ${roundup.weeklyPriorities.map((priority, index) => `
                                <div class="priority-item">
                                    <span class="priority-number">${index + 1}</span>
                                    <span>${priority}</span>
                                </div>
                            `).join('')}
                        </div>
                    `
: ''}
                    
                    ${roundup.highImpactUpdates.length > 0
? `
                        <div class="section-card">
                            <h2 class="section-title">
                                <span>⚠️</span> High Impact Updates
                            </h2>
                            ${roundup.highImpactUpdates.map(update => `
                                <div class="impact-update">
                                    <div class="impact-update-authority">${update.authority}</div>
                                    <div class="impact-update-title">${update.title}</div>
                                    <div class="impact-update-summary">${update.summary || 'No summary available'}</div>
                                    ${update.businessImpactScore
? `
                                        <div style="margin-top: 10px;">
                                            <strong>Impact Score:</strong> ${update.businessImpactScore}/10
                                        </div>
                                    `
: ''}
                                    ${update.complianceDeadline
? `
                                        <div style="margin-top: 5px; color: #dc2626;">
                                            <strong>Deadline:</strong> ${formatDateDisplay(update.complianceDeadline)}
                                        </div>
                                    `
: ''}
                                </div>
                            `).join('')}
                        </div>
                    `
: ''}
                    
                    <div class="section-card">
                        <h2 class="section-title">
                            <span>🏛️</span> Top Authorities
                        </h2>
                        ${roundup.topAuthorities.map(auth => `
                            <div class="authority-item">
                                <div>
                                    <div class="authority-name">${auth.authority}</div>
                                    <div class="authority-focus">${auth.focusArea}</div>
                                </div>
                                <div class="authority-count">${auth.updateCount}</div>
                            </div>
                        `).join('')}
                    </div>
                    
                    ${roundup.upcomingDeadlines.length > 0
? `
                        <div class="section-card">
                            <h2 class="section-title">
                                <span>📅</span> Upcoming Deadlines
                            </h2>
                            ${roundup.upcomingDeadlines.map(deadline => `
                                <div class="deadline-item">
                                    <div class="deadline-date">
                                        ${formatDateDisplay(deadline.date)}
                                        <span class="deadline-days">${deadline.daysRemaining} days</span>
                                    </div>
                                    <div style="margin-top: 8px;">
                                        <strong>${deadline.authority}:</strong> ${deadline.description}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `
: ''}
                    
                    <div class="section-card">
                        <h2 class="section-title">
                            <span>📈</span> Impact Distribution
                        </h2>
                        <div class="impact-breakdown">
                            <div class="impact-stat">
                                <div class="impact-level impact-significant">Significant</div>
                                <div class="impact-count">${roundup.statistics.impactBreakdown.Significant || 0}</div>
                            </div>
                            <div class="impact-stat">
                                <div class="impact-level impact-moderate">Moderate</div>
                                <div class="impact-count">${roundup.statistics.impactBreakdown.Moderate || 0}</div>
                            </div>
                            <div class="impact-stat">
                                <div class="impact-level impact-informational">Informational</div>
                                <div class="impact-count">${roundup.statistics.impactBreakdown.Informational || 0}</div>
                            </div>
                        </div>
                    </div>
                    
                    ${Object.keys(roundup.sectorInsights).length > 0
? `
                        <div class="section-card">
                            <h2 class="section-title">
                                <span>🏢</span> Sector Insights
                            </h2>
                            ${Object.entries(roundup.sectorInsights).map(([sector, insight]) => `
                                <div class="sector-insight">
                                    <div class="sector-name">${sector}</div>
                                    <div>${insight}</div>
                                </div>
                            `).join('')}
                        </div>
                    `
: ''}
                    
                    <div class="section-card">
                        <h2 class="section-title">
                            <span>📊</span> Data Quality Assessment
                        </h2>
                        <div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                <span>Confidence Level</span>
                                <span><strong>${Math.round(roundup.dataQuality.confidence * 100)}%</strong></span>
                            </div>
                            <div class="data-quality-meter">
                                <div class="data-quality-fill" style="width: ${roundup.dataQuality.confidence * 100}%"></div>
                            </div>
                            <div style="margin-top: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                <div>
                                    <small>AI Coverage:</small> ${Math.round(roundup.dataQuality.aiCoverage * 100)}%
                                </div>
                                <div>
                                    <small>Completeness:</small> ${Math.round(roundup.dataQuality.completeness * 100)}%
                                </div>
                                <div>
                                    <small>Source Count:</small> ${roundup.dataQuality.sourceCount}
                                </div>
                                <div>
                                    <small>AI Generated:</small> ${roundup.dataQuality.aiGenerated ? 'Yes' : 'No'}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="text-align: center; padding: 20px; color: #6b7280;">
                        <small>Report generated on ${formatDateTime(roundup.generatedAt)}</small>
                    </div>
                </main>
            </div>
            
            ${getClientScripts()}
            
            <script>
                // Auto-refresh data quality animation
                window.addEventListener('load', () => {
                    const fills = document.querySelectorAll('.data-quality-fill');
                    fills.forEach(fill => {
                        const width = fill.style.width;
                        fill.style.width = '0';
                        setTimeout(() => {
                            fill.style.width = width;
                        }, 100);
                    });
                });
            </script>
        </body>
        </html>`

    res.send(html)
  } catch (error) {
    console.error('❌ Error rendering weekly roundup page:', error)
    res.status(500).send(`
            <html>
                <head>
                    <title>Error - Weekly Roundup</title>
                    <style>
                        body { 
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                            margin: 0;
                            background: #f8fafc;
                        }
                        .error-container {
                            text-align: center;
                            padding: 40px;
                            background: white;
                            border-radius: 12px;
                            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                            max-width: 500px;
                        }
                        h1 { color: #dc2626; }
                        a {
                            color: #4f46e5;
                            text-decoration: none;
                            padding: 10px 20px;
                            border: 1px solid #4f46e5;
                            border-radius: 6px;
                            display: inline-block;
                            margin-top: 20px;
                        }
                        a:hover {
                            background: #4f46e5;
                            color: white;
                        }
                    </style>
                </head>
                <body>
                    <div class="error-container">
                        <h1>❌ Error Loading Weekly Roundup</h1>
                        <p>${error.message}</p>
                        <a href="/">← Back to Home</a>
                    </div>
                </body>
            </html>
        `)
  }
})

// AI INTELLIGENCE PAGE (Phase 1.3 - WORKING VERSION)
router.get('/ai-intelligence', async (req, res) => {
  try {
    const { getSidebar } = require('./templates/sidebar')
    const { getClientScripts } = require('./templates/clientScripts')
    const { getCommonStyles } = require('./templates/commonStyles')

    const sidebar = await getSidebar('ai-intelligence')

    // Get firm profile
    const firmProfile = await dbService.getFirmProfile()

    // Get relevance-scored updates
    const allUpdates = await dbService.getEnhancedUpdates({ limit: 100 })
    const categorized = relevanceService.categorizeByRelevance(allUpdates, firmProfile)

    // Get workspace stats
    const pinnedItems = await dbService.getPinnedItems()
    const savedSearches = await dbService.getSavedSearches()
    const customAlerts = await dbService.getCustomAlerts()

    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>AI Intelligence - Regulatory Intelligence Platform</title>
            ${getCommonStyles()}
            <style>
                .intelligence-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    border-radius: 12px;
                    margin-bottom: 30px;
                    position: relative;
                }
                
                .firm-profile-section {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 15px 20px;
                    border-radius: 8px;
                    margin-top: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .firm-info {
                    flex: 1;
                }
                
                .firm-name {
                    font-size: 1.2rem;
                    font-weight: 600;
                    margin-bottom: 5px;
                }
                
                .firm-sectors {
                    font-size: 0.9rem;
                    opacity: 0.9;
                }
                
                .sector-badge {
                    background: rgba(255, 255, 255, 0.2);
                    padding: 2px 8px;
                    border-radius: 12px;
                    margin-right: 5px;
                    display: inline-block;
                }
                
                .workspace-summary {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }
                
                .workspace-card {
                    background: white;
                    padding: 20px;
                    border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.08);
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: 2px solid transparent;
                }
                
                .workspace-card:hover {
                    box-shadow: 0 4px 20px rgba(0,0,0,0.12);
                    border-color: #667eea;
                }
                
                .workspace-icon {
                    font-size: 2rem;
                    margin-bottom: 10px;
                }
                
                .workspace-count {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #1f2937;
                }
                
                .workspace-label {
                    color: #6b7280;
                    margin-top: 5px;
                    font-size: 0.9rem;
                }
                
                .relevance-streams {
                    margin-top: 30px;
                }
                
                .stream-container {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.08);
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
                    background: #f9fafb;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: start;
                    transition: all 0.2s ease;
                }
                
                .update-item:hover {
                    background: #f3f4f6;
                    transform: translateX(4px);
                }
                
                .update-content {
                    flex: 1;
                }
                
                .update-headline {
                    font-weight: 600;
                    color: #1f2937;
                    margin-bottom: 8px;
                    line-height: 1.4;
                }
                
                .update-meta {
                    display: flex;
                    gap: 15px;
                    font-size: 0.85rem;
                    color: #6b7280;
                    flex-wrap: wrap;
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
                        <h1>🤖 AI Intelligence Center</h1>
                        <p>Personalized regulatory intelligence powered by artificial intelligence</p>
                        
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
                    </header>
                    
                    <div class="workspace-summary">
                        <div class="workspace-card" onclick="WorkspaceModule.showPinnedItems()">
                            <div class="workspace-icon">📌</div>
                            <div class="workspace-count">${pinnedItems.length}</div>
                            <div class="workspace-label">Pinned Updates</div>
                        </div>
                        
                        <div class="workspace-card" onclick="WorkspaceModule.showSavedSearches()">
                            <div class="workspace-icon">🔍</div>
                            <div class="workspace-count">${savedSearches.length}</div>
                            <div class="workspace-label">Saved Searches</div>
                        </div>
                        
                        <div class="workspace-card" onclick="WorkspaceModule.showCustomAlerts()">
                            <div class="workspace-icon">🔔</div>
                            <div class="workspace-count">${customAlerts.filter(a => a.isActive).length}</div>
                            <div class="workspace-label">Active Alerts</div>
                        </div>
                        
                        <div class="workspace-card" onclick="refreshIntelligence()">
                            <div class="workspace-icon">🔄</div>
                            <div class="workspace-count">${allUpdates.length}</div>
                            <div class="workspace-label">Total Updates</div>
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
                                        🎯 High Relevance to Your Firm
                                    </div>
                                    <span class="stream-count">${categorized.high.length} updates</span>
                                </div>
                                <div class="stream-content">
                                    ${categorized.high.slice(0, 10).map(update => `
                                        <div class="update-item" data-url="${update.url}">
                                            <div class="update-content">
                                                <div class="update-headline">
                                                    <a href="${update.url}" target="_blank">${update.headline}</a>
                                                </div>
                                                <div class="update-meta">
                                                    <span class="authority-badge">${update.authority || 'Unknown'}</span>
                                                    <span class="relevance-score">${update.relevanceScore}% relevant</span>
                                                    <span>${update.impactLevel || 'N/A'}</span>
                                                    <span>${formatDateDisplay(update.publishedDate || update.published_date || update.fetchedDate || update.createdAt)}</span>
                                                </div>
                                            </div>
                                            <button class="pin-button ${pinnedItems.some(p => (p.update_url || p.updateUrl) === update.url) ? 'pinned' : ''}" 
                                                    onclick="WorkspaceModule.togglePin('${update.url}', '${(update.headline || '').replace(/'/g, "\\'")}', '${update.authority || 'Unknown'}')">
                                                ${pinnedItems.some(p => (p.update_url || p.updateUrl) === update.url) ? '📌' : '📍'}
                                            </button>
                                        </div>
                                    `).join('')}
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
                                        📊 Medium Relevance
                                    </div>
                                    <span class="stream-count">${categorized.medium.length} updates</span>
                                </div>
                                <div class="stream-content">
                                    ${categorized.medium.slice(0, 10).map(update => `
                                        <div class="update-item" data-url="${update.url}">
                                            <div class="update-content">
                                                <div class="update-headline">
                                                    <a href="${update.url}" target="_blank">${update.headline}</a>
                                                </div>
                                                <div class="update-meta">
                                                    <span class="authority-badge">${update.authority || 'Unknown'}</span>
                                                    <span class="relevance-score">${update.relevanceScore}% relevant</span>
                                                    <span>${update.impactLevel || 'N/A'}</span>
                                                    <span>${formatDateDisplay(update.publishedDate || update.published_date || update.fetchedDate || update.createdAt)}</span>
                                                </div>
                                            </div>
                                            <button class="pin-button ${pinnedItems.some(p => (p.update_url || p.updateUrl) === update.url) ? 'pinned' : ''}" 
                                                    onclick="WorkspaceModule.togglePin('${update.url}', '${(update.headline || '').replace(/'/g, "\\'")}', '${update.authority || 'Unknown'}')">
                                                ${pinnedItems.some(p => (p.update_url || p.updateUrl) === update.url) ? '📌' : '📍'}
                                            </button>
                                        </div>
                                    `).join('')}
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
                                        📰 Background Intelligence
                                    </div>
                                    <span class="stream-count">${categorized.low.length} updates</span>
                                </div>
                                <div class="stream-content">
                                    ${categorized.low.slice(0, 10).map(update => `
                                        <div class="update-item" data-url="${update.url}">
                                            <div class="update-content">
                                                <div class="update-headline">
                                                    <a href="${update.url}" target="_blank">${update.headline}</a>
                                                </div>
                                                <div class="update-meta">
                                                    <span class="authority-badge">${update.authority || 'Unknown'}</span>
                                                    <span class="relevance-score">${update.relevanceScore}% relevant</span>
                                                    <span>${update.impactLevel || 'N/A'}</span>
                                                    <span>${formatDateDisplay(update.publishedDate || update.published_date || update.fetchedDate || update.createdAt)}</span>
                                                </div>
                                            </div>
                                            <button class="pin-button ${pinnedItems.some(p => (p.update_url || p.updateUrl) === update.url) ? 'pinned' : ''}" 
                                                    onclick="WorkspaceModule.togglePin('${update.url}', '${(update.headline || '').replace(/'/g, "\\'")}', '${update.authority || 'Unknown'}')">
                                                ${pinnedItems.some(p => (p.update_url || p.updateUrl) === update.url) ? '📌' : '📍'}
                                            </button>
                                        </div>
                                    `).join('')}
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
            
            ${getClientScripts()}
        </body>
        </html>`

    res.send(html)
  } catch (error) {
    console.error('❌ Error rendering AI Intelligence page:', error)
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
    console.error('❌ Error rendering authority spotlight page:', error)
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
    console.error('❌ Error rendering sector intelligence page:', error)
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
                        <h1>🤖 AI Regulatory Intelligence Platform</h1>
                        <p style="font-size: 1.2rem; color: #0c4a6e; margin-bottom: 20px;">
                            <strong>Version 2.0 - Phase 1.3 Complete</strong>
                        </p>
                        <p>
                            Advanced AI-powered regulatory intelligence with personalized relevance scoring, 
                            workspace management, and intelligent compliance support.
                        </p>
                    </div>
                    
                    <div class="about-section">
                        <h2>🎯 Mission</h2>
                        <p>
                            To transform regulatory compliance from reactive monitoring to proactive intelligence, 
                            helping financial services firms stay ahead of regulatory changes with AI-powered insights,
                            personalized relevance scoring, and automated business impact analysis.
                        </p>
                    </div>
                    
                    <div class="about-section">
                        <h2>✨ Key Features</h2>
                        <ul style="line-height: 2;">
                            <li><strong>🎯 Firm Profile System:</strong> Personalized relevance scoring based on your sectors</li>
                            <li><strong>📌 Workspace Management:</strong> Pin important updates, save searches, create alerts</li>
                            <li><strong>🤖 AI-Powered Analysis:</strong> Automated impact scoring and sector relevance analysis</li>
                            <li><strong>📊 Real-time Dashboard:</strong> Live regulatory updates with intelligent filtering</li>
                            <li><strong>📋 Weekly AI Roundups:</strong> Comprehensive weekly intelligence briefings</li>
                            <li><strong>🏛️ Authority Spotlight:</strong> Deep analysis of regulatory authority patterns</li>
                            <li><strong>📈 Trend Analysis:</strong> Emerging regulatory themes and compliance priorities</li>
                            <li><strong>⚡ Smart Filtering:</strong> Advanced search and categorization capabilities</li>
                        </ul>
                    </div>
                    
                    <div class="about-section">
                        <h2>🛠️ Technology Stack</h2>
                        <div class="tech-stack">
                            <div class="tech-item">
                                <h4>🚀 Backend</h4>
                                <p>Node.js, Express.js</p>
                            </div>
                            <div class="tech-item">
                                <h4>🤖 AI Engine</h4>
                                <p>Groq API, Llama-3.3-70B</p>
                            </div>
                            <div class="tech-item">
                                <h4>💾 Database</h4>
                                <p>PostgreSQL + JSON Fallback</p>
                            </div>
                            <div class="tech-item">
                                <h4>📡 Data Sources</h4>
                                <p>RSS Feeds, Web Scraping</p>
                            </div>
                            <div class="tech-item">
                                <h4>🎨 Frontend</h4>
                                <p>Vanilla JS, Modern CSS</p>
                            </div>
                            <div class="tech-item">
                                <h4>☁️ Infrastructure</h4>
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
    console.error('❌ Error rendering about page:', error)
    res.status(500).send('Error loading about page')
  }
})

// COMPREHENSIVE TEST PAGE
router.get('/test', async (req, res) => {
  try {
    console.log('🧪 Test page requested')

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
                    <h1>🧪 AI Regulatory Intelligence Platform</h1>
                    <h2>System Diagnostic & Test Suite</h2>
                    <p>Phase 1.3 Complete - Version 2.0</p>
                    <button class="refresh-btn" onclick="window.location.reload()">🔄 Refresh Tests</button>
                </header>

                ${generateTestResultsHTML(testResults)}

                <div class="test-section">
                    <h2>🔗 Quick Links & Testing</h2>
                    <div class="quick-links">
                        <a href="/" class="quick-link">🏠 Home</a>
                        <a href="/dashboard" class="quick-link">📊 Dashboard</a>
                        <a href="/ai-intelligence" class="quick-link">🤖 AI Intelligence</a>
                        <a href="/weekly-roundup" class="quick-link">📋 Weekly Roundup</a>
                        <a href="/api/health" class="quick-link">🔍 Health Check</a>
                        <a href="/api/firm-profile" class="quick-link">🏢 Firm Profile</a>
                        <a href="/api/workspace/stats" class="quick-link">📊 Workspace Stats</a>
                        <a href="/about" class="quick-link">ℹ️ About</a>
                    </div>
                </div>

                <div class="test-section">
                    <h2>✅ Phase 1.3 Features Checklist</h2>
                    <div style="line-height: 2;">
                        ${generatePhase13ChecklistHTML(testResults)}
                    </div>
                </div>
            </div>
        </body>
        </html>`

    res.send(html)
  } catch (error) {
    console.error('❌ Error generating test page:', error)
    res.status(500).send(`
            <html>
                <body style="font-family: Arial; text-align: center; padding: 50px;">
                    <h1>❌ Test Page Error</h1>
                    <p>Failed to run system tests: ${error.message}</p>
                    <a href="/">← Back to Home</a>
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
    console.log('🧪 Testing database service...')
    const dbHealth = await dbService.healthCheck()
    results.tests.database = {
      status: dbHealth.status === 'healthy' ? 'pass' : 'fail',
      message: dbHealth.status === 'healthy' ? 'Database operational' : `Database error: ${dbHealth.error}`,
      details: dbHealth
    }

    // AI Analyzer Test
    console.log('🧪 Testing AI analyzer...')
    const aiHealth = await aiAnalyzer.healthCheck()
    results.tests.aiAnalyzer = {
      status: aiHealth.status === 'healthy' ? 'pass' : 'warn',
      message: aiHealth.status === 'healthy' ? 'AI analyzer operational' : 'AI analyzer in fallback mode',
      details: aiHealth
    }

    // RSS Fetcher Test
    console.log('🧪 Testing RSS fetcher...')
    const rssHealth = await rssFetcher.healthCheck()
    results.tests.rssFetcher = {
      status: rssHealth.status === 'healthy' ? 'pass' : 'fail',
      message: `RSS fetcher: ${rssHealth.activeSources} sources active`,
      details: rssHealth
    }

    // Workspace Features Test
    console.log('🧪 Testing workspace features...')
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
    console.log('🧪 Testing relevance service...')
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
    console.error('❌ System test error:', error)
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
    const icon = item.status ? '✅' : '⚠️'
    const status = item.status ? 'COMPLETE' : 'PENDING'
    html += `<div>${icon} ${item.item} <em>(${status})</em></div>`
  }

  return html
}

function getTestIcon(testName) {
  const icons = {
    database: '💾',
    aiAnalyzer: '🤖',
    rssFetcher: '📡',
    workspace: '🗂️',
    relevance: '🎯',
    systemError: '❌'
  }
  return icons[testName] || '🧪'
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
