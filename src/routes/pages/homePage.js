// Fixed Home Page - Phase 1
// File: src/routes/pages/homePage.js

const { getSidebar } = require('../templates/sidebar');
const { getClientScripts } = require('../templates/clientScripts');
const { getCommonStyles } = require('../templates/commonStyles');
const dbService = require('../../services/dbService');
const aiAnalyzer = require('../../services/aiAnalyzer');

async function renderHomePage(req, res) {
    try {
        console.log('🏠 Rendering enhanced home page...');
        
        // Get recent updates for home page preview
        const recentUpdates = await dbService.getRecentUpdates(6);
        
        // Get AI insights for home page highlights
        const aiInsights = (dbService.getRecentAIInsights && typeof dbService.getRecentAIInsights === 'function') 
    ? await dbService.getRecentAIInsights(5) 
    : [];
        
        // Get system statistics
        const systemStats = await getSystemStatistics();
        
        // Generate sidebar
        const sidebar = await getSidebar('home');
        
        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>AI Regulatory Intelligence Platform</title>
            ${getCommonStyles()}
            <style>
                /* Home Page Specific Styles */
                .hero-section {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 60px 20px;
                    text-align: center;
                    margin-bottom: 40px;
                    border-radius: 12px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                }
                
                .hero-title {
                    font-size: 2.5rem;
                    font-weight: 700;
                    margin-bottom: 20px;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                }
                
                .hero-subtitle {
                    font-size: 1.2rem;
                    opacity: 0.9;
                    margin-bottom: 30px;
                    max-width: 600px;
                    margin-left: auto;
                    margin-right: auto;
                }
                
                .hero-stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 20px;
                    margin-top: 40px;
                    max-width: 800px;
                    margin-left: auto;
                    margin-right: auto;
                }
                
                .hero-stat {
                    background: rgba(255,255,255,0.1);
                    padding: 20px;
                    border-radius: 10px;
                    backdrop-filter: blur(10px);
                }
                
                .hero-stat-number {
                    font-size: 2rem;
                    font-weight: 700;
                    display: block;
                }
                
                .hero-stat-label {
                    font-size: 0.9rem;
                    opacity: 0.8;
                    margin-top: 5px;
                }
                
                .features-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 30px;
                    margin-bottom: 40px;
                }
                
                .feature-card {
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    border: 1px solid #e5e7eb;
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                
                .feature-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                }
                
                .feature-icon {
                    font-size: 2.5rem;
                    margin-bottom: 20px;
                    display: block;
                }
                
                .feature-title {
                    font-size: 1.3rem;
                    font-weight: 600;
                    margin-bottom: 15px;
                    color: #1f2937;
                }
                
                .feature-description {
                    color: #6b7280;
                    line-height: 1.6;
                    margin-bottom: 20px;
                }
                
                .feature-link {
                    color: #4f46e5;
                    text-decoration: none;
                    font-weight: 500;
                    font-size: 0.9rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .feature-link:hover {
                    color: #3730a3;
                }
                
                .recent-updates {
                    background: white;
                    border-radius: 12px;
                    padding: 30px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    border: 1px solid #e5e7eb;
                    margin-bottom: 40px;
                }
                
                .section-title {
                    font-size: 1.5rem;
                    font-weight: 600;
                    margin-bottom: 25px;
                    color: #1f2937;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .update-preview {
                    display: flex;
                    align-items: center;
                    padding: 15px 0;
                    border-bottom: 1px solid #f3f4f6;
                    transition: background-color 0.2s;
                }
                
                .update-preview:hover {
                    background-color: #f9fafb;
                    margin: 0 -15px;
                    padding-left: 15px;
                    padding-right: 15px;
                }
                
                .update-preview:last-child {
                    border-bottom: none;
                }
                
                .update-authority {
                    background: #4f46e5;
                    color: white;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 500;
                    min-width: 80px;
                    text-align: center;
                    margin-right: 15px;
                }
                
                .update-content {
                    flex: 1;
                    min-width: 0;
                }
                
                .update-title {
                    font-weight: 500;
                    color: #1f2937;
                    margin-bottom: 5px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                
                .update-meta {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    font-size: 0.8rem;
                    color: #6b7280;
                }
                
                .impact-indicator {
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 0.7rem;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
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
                
                .ai-highlights {
                    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                    border-radius: 12px;
                    padding: 30px;
                    border: 1px solid #0ea5e9;
                    margin-bottom: 40px;
                }
                
                .ai-insight-card {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 15px;
                    border-left: 4px solid #0ea5e9;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                
                .ai-insight-card:last-child {
                    margin-bottom: 0;
                }
                
                .insight-header {
                    display: flex;
                    justify-content: between;
                    align-items: center;
                    margin-bottom: 10px;
                }
                
                .insight-type {
                    background: #0ea5e9;
                    color: white;
                    padding: 4px 10px;
                    border-radius: 15px;
                    font-size: 0.8rem;
                    font-weight: 500;
                }
                
                .insight-urgency {
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-size: 0.7rem;
                    font-weight: 500;
                    text-transform: uppercase;
                }
                
                .insight-urgency.high {
                    background: #fef2f2;
                    color: #dc2626;
                }
                
                .insight-urgency.medium {
                    background: #fffbeb;
                    color: #d97706;
                }
                
                .insight-urgency.low {
                    background: #f0fdf4;
                    color: #16a34a;
                }
                
                .insight-title {
                    font-weight: 600;
                    color: #1f2937;
                    margin-bottom: 8px;
                }
                
                .insight-summary {
                    color: #4b5563;
                    line-height: 1.5;
                    margin-bottom: 10px;
                }
                
                .insight-meta {
                    font-size: 0.8rem;
                    color: #6b7280;
                    display: flex;
                    gap: 15px;
                }
                
                .quick-actions {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 40px;
                }
                
                .action-button {
                    background: white;
                    border: 2px solid #e5e7eb;
                    border-radius: 10px;
                    padding: 20px;
                    text-align: center;
                    text-decoration: none;
                    color: #374151;
                    transition: all 0.2s;
                    font-weight: 500;
                }
                
                .action-button:hover {
                    border-color: #4f46e5;
                    background: #f8fafc;
                    color: #4f46e5;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.15);
                }
                
                .action-icon {
                    font-size: 2rem;
                    display: block;
                    margin-bottom: 10px;
                }
                
                .view-all-link {
                    display: inline-flex;
                    align-items: center;
                    color: #4f46e5;
                    text-decoration: none;
                    font-weight: 500;
                    margin-top: 20px;
                    padding: 10px 20px;
                    border: 1px solid #4f46e5;
                    border-radius: 8px;
                    transition: all 0.2s;
                }
                
                .view-all-link:hover {
                    background: #4f46e5;
                    color: white;
                    transform: translateX(5px);
                }
                
                .footer-section {
                    background: #f9fafb;
                    border-radius: 12px;
                    padding: 30px;
                    text-align: center;
                    color: #6b7280;
                    border: 1px solid #e5e7eb;
                }
                
                .footer-links {
                    display: flex;
                    justify-content: center;
                    gap: 30px;
                    margin-top: 20px;
                    flex-wrap: wrap;
                }
                
                .footer-link {
                    color: #4b5563;
                    text-decoration: none;
                    font-weight: 500;
                    transition: color 0.2s;
                }
                
                .footer-link:hover {
                    color: #4f46e5;
                }
                
                @media (max-width: 768px) {
                    .hero-title {
                        font-size: 2rem;
                    }
                    
                    .hero-stats {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    
                    .features-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .quick-actions {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    
                    .footer-links {
                        flex-direction: column;
                        gap: 15px;
                    }
                }
            </style>
        </head>
        <body>
         <!-- Firm Profile Modal -->
            <div id="firmProfileModal" class="modal-overlay" style="display:none;">
                <div class="modal">
                    <div class="modal-header">
                        <h3>Firm Profile Settings</h3>
                        <button onclick="closeFirmProfileModal()" class="close-btn">×</button>
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
                
                <main class="main-content">
                    <!-- Hero Section -->
                    <section class="hero-section">
                        <h1 class="hero-title">🤖 AI Regulatory Intelligence Platform</h1>
                        <p class="hero-subtitle">
                            Transform regulatory compliance with AI-powered insights, proactive intelligence, 
                            and automated business impact analysis for UK financial services
                        </p>
                        
                        <div class="hero-stats">
                            <div class="hero-stat">
                                <span class="hero-stat-number">${systemStats.totalUpdates}</span>
                                <span class="hero-stat-label">Total Updates</span>
                            </div>
                            <div class="hero-stat">
                                <span class="hero-stat-number">${systemStats.activeAuthorities}</span>
                                <span class="hero-stat-label">Active Authorities</span>
                            </div>
                            <div class="hero-stat">
                                <span class="hero-stat-number">${systemStats.aiAnalyzed}</span>
                                <span class="hero-stat-label">AI Analyzed</span>
                            </div>
                            <div class="hero-stat">
                                <span class="hero-stat-number">${systemStats.highImpact}</span>
                                <span class="hero-stat-label">High Impact</span>
                            </div>
                        </div>
                    </section>
                    
                    <!-- AI Highlights Section -->
                    <section class="ai-highlights">
                        <h2 class="section-title">
                            🧠 AI Intelligence Highlights
                        </h2>
                        
                        ${generateAIHighlightsSection(aiInsights)}
                        
                        <a href="/ai-intelligence" class="view-all-link">
                            View Full AI Intelligence Dashboard →
                        </a>
                    </section>
                    
                    <!-- Quick Actions -->
                    <section class="quick-actions">
                        <a href="/dashboard" class="action-button">
                            <span class="action-icon">📊</span>
                            <div>Live Dashboard</div>
                        </a>
                        
                        <a href="/api/ai/weekly-roundup" class="action-button">
                            <span class="action-icon">📋</span>
                            <div>Weekly AI Roundup</div>
                        </a>
                        
                        <a href="/analytics" class="action-button">
                            <span class="action-icon">📈</span>
                            <div>Trend Analytics</div>
                        </a>
                        
                        <a href="/ai/early-warnings" class="action-button">
                            <span class="action-icon">⚠️</span>
                            <div>Early Warning System</div>
                        </a>
                    </section>
                    
                    <!-- Platform Features -->
                    <section class="features-grid">
                        <div class="feature-card">
                            <span class="feature-icon">🎯</span>
                            <h3 class="feature-title">Proactive Intelligence</h3>
                            <p class="feature-description">
                                AI-powered early warning system identifies regulatory trends and 
                                potential changes before they impact your business
                            </p>
                            <a href="/ai/early-warnings" class="feature-link">Explore Intelligence →</a>
                        </div>
                        
                        <div class="feature-card">
                            <span class="feature-icon">⚡</span>
                            <h3 class="feature-title">Smart Impact Analysis</h3>
                            <p class="feature-description">
                                Automated business impact scoring and sector-specific relevance 
                                analysis for every regulatory update
                            </p>
                            <a href="/dashboard?filter=high-impact" class="feature-link">View High Impact →</a>
                        </div>
                        
                        <div class="feature-card">
                            <span class="feature-icon">📊</span>
                            <h3 class="feature-title">Authority Spotlight</h3>
                            <p class="feature-description">
                                Deep analysis of regulatory authority patterns, enforcement trends, 
                                and upcoming policy directions
                            </p>
                            <a href="/api/ai/authority-spotlight/FCA" class="feature-link">View Spotlight →</a>
                        </div>
                        
                        <div class="feature-card">
                            <span class="feature-icon">🔍</span>
                            <h3 class="feature-title">Sector Intelligence</h3>
                            <p class="feature-description">
                                Sector-specific regulatory pressure analysis and 
                                compliance priority recommendations
                            </p>
                            <a href="/api/ai/sector-analysis/Banking" class="feature-link">Banking Analysis →</a>
                        </div>
                        
                        <div class="feature-card">
                            <span class="feature-icon">📋</span>
                            <h3 class="feature-title">Weekly AI Roundups</h3>
                            <p class="feature-description">
                                Comprehensive weekly intelligence briefings with key themes, 
                                priorities, and strategic recommendations
                            </p>
                            <a href="/api/ai/weekly-roundup" class="feature-link">Latest Roundup →</a>
                        </div>
                        
                        <div class="feature-card">
                            <span class="feature-icon">🚀</span>
                            <h3 class="feature-title">Implementation Planning</h3>
                            <p class="feature-description">
                                AI-generated implementation phases, resource requirements, 
                                and compliance roadmaps for complex regulations
                            </p>
                            <a href="/dashboard" class="feature-link">View Dashboard →</a>
                        </div>
                    </section>
                    
                    <!-- Recent Updates Preview -->
                    <section class="recent-updates">
                        <h2 class="section-title">
                            📰 Latest Regulatory Updates
                        </h2>
                        
                        ${generateRecentUpdatesPreview(recentUpdates)}
                        
                        <a href="/dashboard" class="view-all-link">
                            View All Updates →
                        </a>
                    </section>
                    
                    <!-- Footer -->
                    <footer class="footer-section">
                        <p>AI Regulatory Intelligence Platform - Powered by advanced language models and regulatory expertise</p>
                        <div class="footer-links">
                            <a href="/test" class="footer-link">System Health</a>
                            <a href="/api/health" class="footer-link">API Status</a>
                            <a href="/analytics" class="footer-link">Analytics</a>
                            <a href="/about" class="footer-link">About</a>
                        </div>
                        <p style="margin-top: 20px; font-size: 0.8rem;">
                            Version 2.0 | Last updated: ${new Date().toLocaleDateString('en-UK')}
                        </p>
                    </footer>
                </main>
            </div>
            
            ${getClientScripts()}
        </body>
        </html>`;
        
        res.send(html);
        
    } catch (error) {
        console.error('❌ Error rendering home page:', error);
        res.status(500).send(`
            <html>
                <head><title>Error - AI Regulatory Intelligence</title></head>
                <body style="font-family: Arial; text-align: center; padding: 50px;">
                    <h1>⚠️ System Error</h1>
                    <p>Unable to load the home page. Please try refreshing.</p>
                    <p><a href="/">← Try Again</a></p>
                    <small>Error: ${error.message}</small>
                </body>
            </html>
        `);
    }
}

async function getSystemStatistics() {
    try {
        const stats = await dbService.getSystemStatistics();
        return {
            totalUpdates: stats.totalUpdates || 0,
            activeAuthorities: stats.activeAuthorities || 0,
            aiAnalyzed: stats.aiAnalyzed || 0,
            highImpact: stats.highImpact || 0
        };
    } catch (error) {
        console.error('Error getting system statistics:', error);
        return {
            totalUpdates: 0,
            activeAuthorities: 0,
            aiAnalyzed: 0,
            highImpact: 0
        };
    }
}

function generateAIHighlightsSection(aiInsights) {
    if (!aiInsights || aiInsights.length === 0) {
        return `
            <div class="ai-insight-card">
                <div class="insight-header">
                    <span class="insight-type">System Ready</span>
                    <span class="insight-urgency low">Active</span>
                </div>
                <h4 class="insight-title">AI Intelligence System Online</h4>
                <p class="insight-summary">
                    The AI analysis engine is active and processing regulatory updates. 
                    Intelligent insights and proactive warnings will appear here as they're generated.
                </p>
                <div class="insight-meta">
                    <span>System Status: Operational</span>
                    <span>AI Confidence: 95%</span>
                </div>
            </div>
        `;
    }
    
    return aiInsights.map(insight => `
        <div class="ai-insight-card">
            <div class="insight-header">
                <span class="insight-type">${insight.insight_type.replace('_', ' ')}</span>
                <span class="insight-urgency ${insight.urgency_level}">${insight.urgency_level}</span>
            </div>
            <h4 class="insight-title">${insight.title}</h4>
            <p class="insight-summary">${insight.summary}</p>
            <div class="insight-meta">
                <span>Impact: ${insight.impact_score}/10</span>
                <span>Confidence: ${Math.round(insight.probability_score * 100)}%</span>
                <span>Generated: ${formatRelativeDate(insight.created_at)}</span>
            </div>
        </div>
    `).join('');
}

function generateRecentUpdatesPreview(updates) {
    if (!updates || updates.length === 0) {
        return `
            <div style="text-align: center; padding: 40px; color: #6b7280;">
                <p>📭 No recent updates available</p>
                <p><a href="/dashboard" style="color: #4f46e5;">Check the dashboard</a> for all regulatory content</p>
            </div>
        `;
    }
    
    return updates.map(update => `
        <div class="update-preview">
            <span class="update-authority">${update.authority}</span>
            <div class="update-content">
                <div class="update-title">
                    <a href="${update.url}" target="_blank" rel="noopener" style="color: inherit; text-decoration: none;">
                        ${update.headline}
                    </a>
                </div>
                <div class="update-meta">
                    <span class="impact-indicator impact-${(update.impactLevel || 'informational').toLowerCase()}">
                        ${update.impactLevel || 'Informational'}
                    </span>
                    <span>${formatRelativeDate(update.publishedDate || update.createdAt)}</span>
                    ${update.businessImpactScore ? `<span>Impact: ${update.businessImpactScore}/10</span>` : ''}
                    ${update.sector || update.primarySectors?.[0] ? `<span>Sector: ${update.sector || update.primarySectors[0]}</span>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function formatRelativeDate(dateString) {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    
    return date.toLocaleDateString('en-UK', { 
        day: 'numeric', 
        month: 'short' 
    });
}

module.exports = renderHomePage;