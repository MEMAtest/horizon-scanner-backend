// Fixed Home Page - Phase 1
// File: src/routes/pages/homePage.js

const { getSidebar } = require('../templates/sidebar')
const { getClientScripts } = require('../templates/clientScripts')
const { getCommonStyles } = require('../templates/commonStyles')
const dbService = require('../../services/dbService')

async function renderHomePage(req, res) {
  try {
    console.log('Home Rendering enhanced home page...')

    // Get recent updates for home page preview
    const recentUpdates = await dbService.getRecentUpdates(6)

    // Get AI insights for home page highlights
    const aiInsights = (dbService.getRecentAIInsights && typeof dbService.getRecentAIInsights === 'function')
      ? await dbService.getRecentAIInsights(5)
      : []

    // Get system statistics
    const systemStats = await getSystemStatistics()

    // Generate sidebar
    const sidebar = await getSidebar('home')

    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>RegCanary - Regulatory Intelligence Platform</title>
            ${getCommonStyles()}
            <style>
                .home-dashboard { background: #f5f7fb; min-height: 100vh; padding: 32px 40px; }
                .status-banner {
                    background: #ffffff;
                    color: #0f172a;
                    border-radius: 18px;
                    padding: 28px 32px;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 24px 48px -28px rgba(15, 23, 42, 0.25);
                    margin-bottom: 40px;
                    display: flex;
                    flex-direction: column;
                    gap: 28px;
                }
                
                .status-title { display: flex; align-items: center; gap: 16px; background: transparent; }
                .status-header { display: flex; justify-content: space-between; align-items: center; gap: 20px; flex-wrap: wrap; }
                .status-info { background: transparent; }
                .status-info h1 { margin: 0; font-size: 1.95rem; font-weight: 700; letter-spacing: -0.01em; color: #0f172a; }
                .status-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: #f1f5ff; color: #1d4ed8; border: 1px solid rgba(147, 197, 253, 0.5); }
                .status-icon svg { width: 22px; height: 22px; stroke: currentColor; stroke-width: 1.5; fill: none; stroke-linecap: round; stroke-linejoin: round; }
                .status-meta-grid { margin-top: 12px; display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 18px; }
                .status-meta-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 18px; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06); }
                .status-meta-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; font-weight: 600; }
                .status-meta-value { font-size: 1.18rem; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 8px; }
                .status-meta-value .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #16a34a; box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.18); }

                .status-subtitle { margin-top: 4px; font-size: 0.98rem; max-width: 520px; color: #475569; line-height: 1.6; }
                                                .status-actions { display: flex; align-items: center; gap: 12px; }
                .primary-action, .secondary-action { border-radius: 999px; padding: 12px 20px; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; transition: transform 0.2s ease, box-shadow 0.2s ease; }
                .primary-action { background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%); color: #0f172a; box-shadow: 0 14px 24px rgba(96, 165, 250, 0.25); border: 1px solid #bfdbfe; }
                .primary-action:hover { transform: translateY(-2px); box-shadow: 0 16px 30px rgba(96, 165, 250, 0.32); }
                .secondary-action { background: rgba(37, 99, 235, 0.05); color: #1d4ed8; border: 1px solid rgba(148, 163, 184, 0.4); box-shadow: none; }
                .secondary-action:hover { transform: translateY(-2px); box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12); }
                .insights-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; margin-top: 12px; margin-bottom: 32px; }
                .insight-card { background: #ffffff; border-radius: 14px; padding: 20px 22px; border: 1px solid #e2e8f0; box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05); }
                .insight-label { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; background: #e0e7ff; color: #1e3a8a; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
                .insight-headline { margin: 14px 0 8px; font-size: 1.15rem; font-weight: 600; color: #0f172a; letter-spacing: -0.01em; }
                .insight-body { color: #4b5563; line-height: 1.55; font-size: 0.95rem; }
                .insight-meta { margin-top: 12px; font-size: 0.8rem; color: #6b7280; }
                .quick-nav { margin: 32px 0 12px; display: flex; flex-wrap: wrap; gap: 12px; }
                .quick-chip { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 999px; padding: 10px 16px; display: inline-flex; align-items: center; gap: 10px; text-decoration: none; color: #1f2937; font-weight: 500; transition: all 0.2s ease; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05); }
                .quick-chip:hover { border-color: #1e3a8a; color: #1e3a8a; box-shadow: 0 10px 20px rgba(15, 23, 42, 0.12); transform: translateY(-2px); }
                .quick-chip-icon { width: 1.6rem; height: 1.6rem; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; background: #eef2ff; color: #1e3a8a; transition: background-color 0.2s ease, color 0.2s ease; }
                .quick-chip-icon svg { width: 1rem; height: 1rem; }
                .quick-chip-icon svg * { stroke: currentColor; stroke-width: 1.6; fill: none; stroke-linecap: round; stroke-linejoin: round; }
                .quick-chip:hover .quick-chip-icon { background: #1e3a8a; color: #ffffff; }
                .chip-label { font-size: 0.9rem; display: block; }
                .chip-meta { font-size: 0.75rem; color: #6b7280; display: block; }
                .module-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; margin-top: 32px; margin-bottom: 32px; }
                .module-card { background: #ffffff; border-radius: 18px; padding: 24px 26px 28px; border: 1px solid #e2e8f0; box-shadow: 0 16px 34px rgba(15, 23, 42, 0.07); transition: transform 0.2s ease, box-shadow 0.2s ease; }
                .module-label { display: inline-flex; align-items: center; gap: 6px; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; color: #1e3a8a; font-weight: 600; margin-bottom: 8px; }
                .module-card:hover { transform: translateY(-4px); box-shadow: 0 22px 42px rgba(15, 23, 42, 0.12); border-color: rgba(37, 99, 235, 0.28); }
                .module-icon { width: 42px; height: 42px; border-radius: 12px; background: linear-gradient(135deg, rgba(37, 99, 235, 0.16), rgba(29, 78, 216, 0.05)); color: #1d4ed8; display: flex; align-items: center; justify-content: center; margin-bottom: 18px; }
                .module-icon svg { width: 22px; height: 22px; stroke-linecap: round; stroke-linejoin: round; }
                .module-title { margin: 0; font-size: 1.2rem; font-weight: 600; color: #0f172a; }
                .module-metric { font-size: 2rem; font-weight: 700; margin: 16px 0 4px; color: #1e293b; letter-spacing: -0.02em; }
                .module-stat-label { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.07em; color: #64748b; font-weight: 600; }
                .module-description { color: #475569; font-size: 0.95rem; line-height: 1.55; margin: 14px 0 18px; }
                .module-link { display: inline-flex; align-items: center; gap: 6px; color: #1e40af; font-weight: 600; text-decoration: none; font-size: 0.9rem; }
                .module-link:hover { transform: translateX(2px); }
                .updates-panel { background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 24px 26px; box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06); }
                .panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
                .panel-title { font-size: 1.25rem; font-weight: 600; color: #0f172a; }
                .panel-link { color: #1e40af; text-decoration: none; font-weight: 600; font-size: 0.9rem; display: inline-flex; align-items: center; gap: 4px; }
                .panel-link:hover { transform: translateX(3px); }
                .update-list { list-style: none; margin: 0; padding: 0; }
                .update-item { display: flex; align-items: center; padding: 14px 0; border-bottom: 1px solid #edf2f7; transition: background 0.2s ease, transform 0.2s ease; border-radius: 10px; }
                .update-item:hover { background: #f8fafc; transform: translateY(-1px); padding-left: 12px; padding-right: 12px; }
                .update-item:last-child { border-bottom: none; }
                .update-badge { background: #e0e7ff; color: #3730a3; padding: 5px 12px; border-radius: 999px; font-size: 0.78rem; font-weight: 600; margin-right: 16px; }
                .update-copy { flex: 1; min-width: 0; }
                .update-headline { font-weight: 600; color: #0f172a; margin-bottom: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .update-headline a { color: inherit; text-decoration: none; }
                .update-headline a:hover { text-decoration: underline; }
                .update-meta { display: flex; flex-wrap: wrap; gap: 12px; font-size: 0.8rem; color: #64748b; }
                .footer-note { margin-top: 32px; text-align: center; color: #64748b; font-size: 0.85rem; }
                .footer-note a { color: #1e40af; text-decoration: none; font-weight: 600; }
                .footer-note a:hover { text-decoration: underline; }
                @media (max-width: 768px) {
                    .home-dashboard { padding: 24px 18px; }
                    .status-actions { flex-direction: column; align-items: stretch; }
                    .primary-action, .secondary-action { justify-content: center; width: 100%; }
                    .module-grid { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
                }
            </style></style>
        </head>
        <body>
         <!-- Firm Profile Modal -->
            <div id="firmProfileModal" class="modal-overlay" style="display:none;">
                <div class="modal">
                    <div class="modal-header">
                        <h3>Firm Profile Settings</h3>
                        <button onclick="closeFirmProfileModal()" class="close-btn">x</button>
                    </div>
                    <div class="modal-content">
                        <form id="firmProfileForm">
                            <div class="form-group">
                                <label>Firm Name:</label>
                                <input type="text" id="firmNameInput" class="form-input" placeholder="Enter your firm name" required>
                            </div>
                            <div class="form-group">
                                <label>Firm Size:</label>
                                <select id="firmSizeInput" class="form-input">
                                    <option value="Small">Small</option>
                                    <option value="Medium" selected>Medium</option>
                                    <option value="Large">Large</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Primary Sectors (select up to 3):</label>
                                <div id="sectorGrid" class="sectors-grid"></div>
                            </div>
                            <div id="messageContainer"></div>
                            <button type="submit" id="saveProfileBtn" class="btn btn-primary">Save Profile</button>
                        </form>
                    </div>
                </div>
            </div>

            <!-- Add modal styles -->
            <style>
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                }
                
                .modal {
                    background: white;
                    border-radius: 12px;
                    padding: 0;
                    max-width: 600px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                }
                
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 30px;
                    border-bottom: 1px solid #e5e7eb;
                }
                
                .modal-header h3 {
                    margin: 0;
                    font-size: 1.5rem;
                    color: #1f2937;
                }
                
                .close-btn {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #6b7280;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 4px;
                    transition: background-color 0.2s;
                }
                
                .close-btn:hover {
                    background-color: #f3f4f6;
                    color: #1f2937;
                }
                
                .modal-content {
                    padding: 30px;
                }
                
                .form-group {
                    margin-bottom: 25px;
                }
                
                .form-group label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 500;
                    color: #374151;
                }
                
                .form-input {
                    width: 100%;
                    padding: 10px 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 1rem;
                    transition: border-color 0.2s;
                }
                
                .form-input:focus {
                    outline: none;
                    border-color: #4f46e5;
                    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
                }
                
                .sectors-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 10px;
                    margin-top: 10px;
                }
                
                .sector-checkbox {
                    padding: 10px;
                    border: 2px solid #e5e7eb;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                }
                
                .sector-checkbox:hover {
                    background-color: #f9fafb;
                }
                
                .sector-checkbox.selected {
                    background-color: #eef2ff;
                    border-color: #4f46e5;
                }
                
                .sector-checkbox input {
                    margin-right: 8px;
                }
                
                .sector-checkbox label {
                    cursor: pointer;
                    margin-bottom: 0;
                    font-weight: normal;
                }
                
                #messageContainer {
                    margin-top: 15px;
                    padding: 10px;
                    border-radius: 6px;
                    display: none;
                }
                
                #messageContainer.error {
                    background-color: #fef2f2;
                    color: #dc2626;
                    border: 1px solid #fecaca;
                    display: block;
                }
                
                #messageContainer.success {
                    background-color: #f0fdf4;
                    color: #16a34a;
                    border: 1px solid #bbf7d0;
                    display: block;
                }
                
                .btn {
                    padding: 10px 20px;
                    border-radius: 6px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                    font-size: 1rem;
                }
                
                .btn-primary {
                    background-color: #4f46e5;
                    color: white;
                }
                
                .btn-primary:hover {
                    background-color: #4338ca;
                }
                
                .btn-primary:disabled {
                    background-color: #9ca3af;
                    cursor: not-allowed;
                }
            </style>

            
            <div class="app-container">
                ${sidebar}
                
                <main class="main-content home-dashboard">
                    <section class="status-banner">
                        <div class="status-header">
                            <div class="status-title">
                                <div class="status-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18h16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><rect x="5" y="10" width="3" height="8" rx="0.8" fill="none" stroke="currentColor" stroke-width="1.6"></rect><rect x="10.5" y="7" width="3" height="11" rx="0.8" fill="none" stroke="currentColor" stroke-width="1.6"></rect><rect x="16" y="4" width="3" height="14" rx="0.8" fill="none" stroke="currentColor" stroke-width="1.6"></rect></svg></div>
                                <div class="status-info">
                                    <h1>RegCanary</h1>
                                    <p class="status-subtitle">Prioritised regulatory intelligence and actions for financial services teams.</p>
                                </div>
                            </div>
                            <div class="status-actions">
                                <a class="primary-action" href="/ai-intelligence">Open Intelligence Center</a>
                                <a class="secondary-action" href="/weekly-roundup">Open Weekly Brief</a>
                            </div>
                        </div>
                        <div class="status-meta-grid">
                            <div class="status-meta-card">
                                <span class="status-meta-label">Status</span>
                                <span class="status-meta-value"><span class="status-dot"></span>Operational</span>
                            </div>
                            <div class="status-meta-card">
                                <span class="status-meta-label">Total updates</span>
                                <span class="status-meta-value">${formatNumber(systemStats.totalUpdates || 0)}</span>
                            </div>
                            <div class="status-meta-card">
                                <span class="status-meta-label">Active authorities</span>
                                <span class="status-meta-value">${formatNumber(systemStats.activeAuthorities || 0)}</span>
                            </div>
                            <div class="status-meta-card">
                                <span class="status-meta-label">High-impact items</span>
                                <span class="status-meta-value">${formatNumber(systemStats.highImpact || 0)}</span>
                            </div>
                        </div>
                    </section>

                    <section class="quick-nav">
                        ${generateQuickNav()}
                    </section>

                    <section class="insights-grid">
                        ${generateInsightCards(recentUpdates, systemStats)}
                    </section>

                    

                    <section class="module-grid">
                        ${generateModuleGrid(systemStats, aiInsights)}
                    </section>

                    <section class="updates-panel">
                        <div class="panel-header">
                            <h2 class="panel-title">Latest Updates</h2>
                            <a class="panel-link" href="/dashboard">Open dashboard →</a>
                        </div>
                        <ul class="update-list">
                            ${generateRecentUpdatesPreview(recentUpdates)}
                        </ul>
                    </section>

                    <div class="footer-note">
                        Need something different? Explore the <a href="/dashboard">full analytics workspace</a> or contact your compliance intelligence partner.
                    </div>
                </main>
            </div>
            
            ${getClientScripts()}
        </body>
        </html>`

    res.send(html)
  } catch (error) {
    console.error('X Error rendering home page:', error)
    res.status(500).send(`
            <html>
                <head><title>Error - AI Regulatory Intelligence</title></head>
                <body style="font-family: Arial; text-align: center; padding: 50px;">
                    <h1>Warning System Error</h1>
                    <p>Unable to load the home page. Please try refreshing.</p>
                    <p><a href="/"><- Try Again</a></p>
                    <small>Error: ${error.message}</small>
                </body>
            </html>
        `)
  }
}

async function getSystemStatistics() {
  try {
    const stats = await dbService.getSystemStatistics()
    return {
      totalUpdates: stats.totalUpdates || 0,
      activeAuthorities: stats.activeAuthorities || 0,
      aiAnalyzed: stats.aiAnalyzed || 0,
      highImpact: stats.highImpact || 0
    }
  } catch (error) {
    console.error('Error getting system statistics:', error)
    return {
      totalUpdates: 0,
      activeAuthorities: 0,
      aiAnalyzed: 0,
      highImpact: 0
    }
  }
}

function generateInsightCards(recentUpdates, systemStats) {
  const highlights = buildHomepageHighlights(recentUpdates, systemStats)
  return highlights.map(item => `
        <article class="insight-card">
            <span class="insight-label">${escapeHtml(item.label)}</span>
            <h3 class="insight-headline">${escapeHtml(item.headline)}</h3>
            <p class="insight-body">${escapeHtml(item.body)}</p>
            ${item.meta ? `<div class="insight-meta">${escapeHtml(item.meta)}</div>` : ''}
        </article>
    `).join('')
}

function buildHomepageHighlights(recentUpdates = [], systemStats = {}) {
  const highlights = []

  if (recentUpdates.length > 0) {
    const authorityCounts = {}
    recentUpdates.forEach(update => {
      const authority = update.authority || 'Unknown'
      authorityCounts[authority] = (authorityCounts[authority] || 0) + 1
    })

    const sortedAuthorities = Object.entries(authorityCounts).sort((a, b) => b[1] - a[1])
    if (sortedAuthorities.length > 0) {
      const [authority, count] = sortedAuthorities[0]
      highlights.push({
        label: 'Authority focus',
        headline: `${authority} leading recent activity`,
        body: `${count} update${count === 1 ? '' : 's'} captured across the latest feed.`,
        meta: 'Monitoring window: last refresh'
      })
    }

    const now = Date.now()
    let upcomingDeadlines = 0
    let consultationCount = 0

    recentUpdates.forEach(update => {
      const summary = `${update.headline || ''} ${update.summary || ''}`.toLowerCase()
      if (summary.includes('consultation') || summary.includes('feedback')) {
        consultationCount += 1
      }
      const deadlineRaw = update.compliance_deadline || update.complianceDeadline
      if (deadlineRaw) {
        const due = new Date(deadlineRaw).getTime()
        if (!Number.isNaN(due) && due >= now && due - now <= 14 * 24 * 60 * 60 * 1000) {
          upcomingDeadlines += 1
        }
      }
    })

    highlights.push({
      label: 'Upcoming deadlines',
      headline: `${upcomingDeadlines} deadline${upcomingDeadlines === 1 ? '' : 's'} in next 14 days`,
      body: consultationCount
        ? `${consultationCount} consultation${consultationCount === 1 ? '' : 's'} currently open for response.`
        : 'No active consultations flagged in the latest feed.',
      meta: 'Monitoring window: 14 days'
    })
  }

  if (highlights.length < 2) {
    highlights.push({
      label: 'Platform coverage',
      headline: `${formatNumber(systemStats.totalUpdates || 0)} updates tracked`,
      body: 'Monitoring engine remains active across all regulatory sources.',
      meta: 'Live coverage'
    })
  }

  return highlights.slice(0, 2)
}

function generateQuickNav() {
  const iconSet = {
    intelligence: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5.5" fill="none"></circle><path d="M12 6.5v11M6.5 12h11" stroke-linecap="round"></path><circle cx="12" cy="12" r="8.3" fill="none"></circle></svg>',
    authority: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 4.5 8v12h15V8L12 4z" fill="none" stroke-linejoin="round"></path><path d="M7.5 11v7M12 11v7M16.5 11v7" stroke-linecap="round"></path><path d="M5 19h14" stroke-linecap="round"></path></svg>',
    sector: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 17h16" stroke-linecap="round"></path><rect x="5.5" y="10.5" width="3.5" height="6.5" rx="1"></rect><rect x="10.25" y="8" width="3.5" height="9" rx="1"></rect><rect x="15" y="5.5" width="3.5" height="11.5" rx="1"></rect></svg>',
    brief: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5h8.5L19 8v11.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1z" fill="none" stroke-linejoin="round"></path><path d="M15.5 4.5V8H19" fill="none" stroke-linecap="round" stroke-linejoin="round"></path><path d="M9.5 12h5M9.5 15h3.5" stroke-linecap="round"></path></svg>',
    planner: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 6h4v4h-4zM14.5 6h4v4h-4zM10.5 14h3" stroke-linecap="round"></path><path d="M5.5 18h13" stroke-linecap="round"></path><path d="M11 10v2a2 2 0 0 0 2 2h1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>'
  }

  const iconWithStroke = (svg) => svg.replace(/<svg /, '<svg stroke="currentColor" ')

  const links = [
    { icon: iconWithStroke(iconSet.intelligence), label: 'Intelligence Center', meta: 'Triage & prioritise', href: '/ai-intelligence' },
    { icon: iconWithStroke(iconSet.authority), label: 'Authority Spotlight', meta: 'Momentum & enforcement', href: '/authority-spotlight/FCA' },
    { icon: iconWithStroke(iconSet.sector), label: 'Sector Pressure', meta: 'Sector-specific trends', href: '/sector-intelligence/Banking' },
    { icon: iconWithStroke(iconSet.brief), label: 'Weekly Brief', meta: 'Executive summary', href: '/weekly-roundup' },
    { icon: iconWithStroke(iconSet.planner), label: 'Implementation Planner', meta: 'Plan next steps', href: '/dashboard' }
  ]

  return links.map(link => `
    <a class="quick-chip" href="${link.href}">
        <span class="quick-chip-icon" aria-hidden="true">${link.icon}</span>
        <span>
            <span class="chip-label">${escapeHtml(link.label)}</span>
            <span class="chip-meta">${escapeHtml(link.meta)}</span>
        </span>
    </a>
  `).join('')
}

function generateModuleGrid(systemStats = {}, aiInsights = []) {
  const modules = [
    {
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" stroke-width="1.6"></circle><path d="M12 6v12M6 12h12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg>',
      title: 'Intelligence Center',
      metric: formatNumber(systemStats.totalUpdates || 0),
      statLabel: 'updates tracked',
      description: 'Dashboard for triage, prioritisation, and follow-up capture.',
      link: '/ai-intelligence',
      linkText: 'Open dashboard'
    },
    {
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><path d="M6.5 10.5v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><path d="M12 10.5v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><path d="M17.5 10.5v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><path d="M5 9l7-5 7 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"></path></svg>',
      title: 'Authority Spotlight',
      metric: formatNumber(systemStats.activeAuthorities || 0),
      statLabel: 'active authorities',
      description: 'Momentum analysis and coordination signals across regulators.',
      link: '/authority-spotlight/FCA',
      linkText: 'Open dashboard'
    },
    {
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 17h12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><rect x="6" y="11" width="3" height="6" rx="0.8" fill="none" stroke="currentColor" stroke-width="1.6"></rect><rect x="10.5" y="9" width="3" height="8" rx="0.8" fill="none" stroke="currentColor" stroke-width="1.6"></rect><rect x="15" y="7" width="3" height="10" rx="0.8" fill="none" stroke="currentColor" stroke-width="1.6"></rect></svg>',
      title: 'Sector Pressure',
      metric: formatNumber(systemStats.highImpact || 0),
      statLabel: 'high-impact items',
      description: 'Sector dashboards covering pressure scores, deadlines, and owners.',
      link: '/sector-intelligence/Banking',
      linkText: 'Open dashboard'
    },
    {
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5h9l3 3v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-14a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"></path><path d="M15 4.5V9h4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path><path d="M9 12h6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><path d="M9 15h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg>',
      title: 'Weekly Brief',
      metric: formatNumber(aiInsights.length || 0),
      statLabel: 'insights queued',
      description: 'Download or trigger the latest executive-ready weekly summary.',
      link: '/weekly-roundup',
      linkText: 'Open dashboard'
    }
  ]

  return modules.map(module => `
        <article class="module-card">
            <div class="module-icon">${module.icon}</div>
            <div class="module-label">Dashboard View</div>
            <h3 class="module-title">${escapeHtml(module.title)}</h3>
            <div class="module-metric">${escapeHtml(module.metric)}</div>
            <div class="module-stat-label">${escapeHtml(module.statLabel)}</div>
            <p class="module-description">${escapeHtml(module.description)}</p>
            <a class="module-link" href="${module.link}">${escapeHtml(module.linkText)} →</a>
        </article>
    `).join('')
}

function generateRecentUpdatesPreview(updates) {
  if (!updates || updates.length === 0) {
    return `
            <li class="update-item">
                <span class="update-badge">—</span>
                <div class="update-copy">
                    <div class="update-headline">No updates captured yet</div>
                    <div class="update-meta">The monitoring engine will surface new items as soon as they arrive.</div>
                </div>
            </li>
        `
  }

  return updates.map(update => {
    const dateMeta = formatRelativeDate(update.publishedDate || update.published_date || update.fetchedDate || update.createdAt)
    const impact = update.impactLevel || update.impact_level || 'Informational'
    const deadlineRaw = update.compliance_deadline || update.complianceDeadline
    const deadline = deadlineRaw ? formatShortDate(deadlineRaw) : null
    const headline = escapeHtml(update.headline || 'Untitled update')
    const linkOpen = update.url ? `<a href="${escapeAttribute(update.url)}" target="_blank" rel="noopener">${headline}</a>` : headline

    return `
        <li class="update-item">
            <span class="update-badge">${escapeHtml(update.authority || 'Unknown')}</span>
            <div class="update-copy">
                <div class="update-headline">${linkOpen}</div>
                <div class="update-meta">
                    <span>${escapeHtml(dateMeta)}</span>
                    <span>${escapeHtml(impact)}</span>
                    ${deadline ? `<span>Deadline: ${escapeHtml(deadline)}</span>` : ''}
                </div>
            </div>
        </li>
    `
  }).join('')
}

function formatNumber(value) {
  try {
    return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(value || 0)
  } catch (error) {
    return String(value || 0)
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

function escapeAttribute(value) {
  return escapeHtml(value).replace(/\s/g, '%20')
}

function formatShortDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function formatRelativeDate(dateString) {
  if (!dateString) return 'Unknown'

  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 1) return 'Today'
  if (diffDays === 2) return 'Yesterday'
  if (diffDays <= 7) return `${diffDays - 1} days ago`
  if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`

  return date.toLocaleDateString('en-UK', {
    day: 'numeric',
    month: 'short'
  })
}

module.exports = renderHomePage
