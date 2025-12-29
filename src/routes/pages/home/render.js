const { getHomePageStyles } = require('./styles')
const { renderCalendarWidget } = require('../../../views/calendar/widget')
const {
  formatNumber,
  generateInsightCards,
  generateQuickNav,
  generateModuleGrid,
  generateRecentUpdatesPreview,
  renderPriorityStrip,
  renderForYouStrip,
  renderTopFinesWidget,
  renderAuthorityHeatmap,
  renderSectorPressureChart,
  renderQuickActionsWidget
} = require('./widgets')

function buildHomePageHtml({ sidebar, commonStyles, clientScripts, recentUpdates, systemStats, topFines, aiInsights, upcomingEvents }) {
  return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>RegCanary - Regulatory Intelligence Platform</title>
            ${commonStyles}
            <style>${getHomePageStyles()}
            </style>
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
                                <div class="status-icon status-icon-3d"><svg viewBox="0 0 50 50" class="canary-icon-animated" aria-hidden="true"><defs><linearGradient id="canaryGold" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#FFE066"/><stop offset="50%" style="stop-color:#FFD93D"/><stop offset="100%" style="stop-color:#F4C430"/></linearGradient><linearGradient id="canaryOrange" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#FFB347"/><stop offset="100%" style="stop-color:#FF8C00"/></linearGradient><linearGradient id="shieldBlue" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#3b82f6"/><stop offset="100%" style="stop-color:#1d4ed8"/></linearGradient></defs><path class="shield-glow" d="M25 4 L42 10 L42 24 C42 34 34 42 25 46 C16 42 8 34 8 24 L8 10 Z" fill="url(#shieldBlue)" opacity="0.15"/><path d="M25 6 L40 11 L40 24 C40 33 33 40 25 44 C17 40 10 33 10 24 L10 11 Z" fill="none" stroke="url(#shieldBlue)" stroke-width="1.5" opacity="0.4"/><g class="canary-body"><ellipse cx="25" cy="28" rx="11" ry="9" fill="url(#canaryGold)"/><ellipse cx="25" cy="30" rx="7" ry="5" fill="#FFF3B0" opacity="0.6"/></g><g class="canary-wing"><ellipse cx="30" cy="27" rx="6" ry="4" fill="url(#canaryOrange)" transform="rotate(-15 30 27)"/><path d="M28 25 Q34 23 36 27 Q34 29 28 28 Z" fill="#E6A500"/></g><polygon points="14,28 6,32 8,28 6,24" fill="url(#canaryOrange)"/><g class="canary-head"><circle cx="32" cy="18" r="7" fill="url(#canaryGold)"/><circle cx="34" cy="20" r="2.5" fill="#FFB347" opacity="0.5"/><polygon points="38,17 44,16 38,19" fill="#FF6B00"/><circle cx="34" cy="16" r="2.2" fill="white"/><circle class="canary-eye" cx="34.5" cy="15.5" r="1.3" fill="#1a1a2e"/><circle cx="35" cy="15" r="0.5" fill="white"/><path d="M29 12 Q28 8 30 10 Q29 7 32 9 Q32 6 34 9" fill="url(#canaryOrange)" stroke="#E6A500" stroke-width="0.5"/></g><g fill="#FF6B00"><path d="M22 36 L22 40 M20 40 L24 40" stroke="#FF6B00" stroke-width="1.5" stroke-linecap="round"/><path d="M28 36 L28 40 M26 40 L30 40" stroke="#FF6B00" stroke-width="1.5" stroke-linecap="round"/></g></svg></div>
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

                    ${renderPriorityStrip(recentUpdates)}
                    ${renderForYouStrip(recentUpdates)}

                    <section class="quick-nav">
                        ${generateQuickNav()}
                    </section>

                    <section class="insights-grid">
                        ${generateInsightCards(recentUpdates.slice(0, 6), systemStats, upcomingEvents)}
                    </section>

                    <section class="widgets-row">
                        ${renderCalendarWidget(upcomingEvents)}
                        ${renderQuickActionsWidget(recentUpdates)}
                    </section>

                    <section class="charts-row">
                        ${renderAuthorityHeatmap(recentUpdates)}
                        ${renderSectorPressureChart(recentUpdates)}
                    </section>

                    ${renderTopFinesWidget(topFines)}

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
            
            ${clientScripts}
        </body>
        </html>`
}

module.exports = { buildHomePageHtml }
