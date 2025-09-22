// src/routes/pages/authoritySpotlightPage.js
// Authority Spotlight Page Renderer

const { getCommonStyles } = require('../templates/commonStyles');
const { getSidebar } = require('../templates/sidebar');
const { getClientScripts } = require('../templates/clientScripts');
const dbService = require('../../services/dbService');

async function renderAuthoritySpotlightPage(req, res, authority = 'FCA') {
    try {
        console.log(`🏛️ Rendering authority spotlight page for: ${authority}`);

        // Get authority-specific data
        const authorityUpdates = await dbService.getEnhancedUpdates({
            authority: authority,
            limit: 50
        });

        // Calculate authority statistics
        const stats = calculateAuthorityStats(authorityUpdates, authority);

        // Get sidebar
        const sidebar = await getSidebar('authority-spotlight');

        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${authority} Authority Spotlight - Regulatory Intelligence Platform</title>
            ${getCommonStyles()}
            <style>
                .spotlight-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 40px;
                    border-radius: 12px;
                    margin-bottom: 30px;
                }

                .authority-title {
                    font-size: 2.5rem;
                    font-weight: 700;
                    margin-bottom: 15px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-top: 30px;
                }

                .stat-card {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 20px;
                    border-radius: 10px;
                    text-align: center;
                    backdrop-filter: blur(10px);
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
                        <a href="/" class="back-link">← Back to Home</a>
                        <h1 class="authority-title">
                            🏛️ ${authority} Authority Spotlight
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
                    </header>

                    <div class="content-section">
                        <h2 class="section-title">
                            📊 Recent Updates from ${authority}
                        </h2>

                        ${authorityUpdates.length > 0 ? authorityUpdates.slice(0, 10).map(update => `
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
                        `).join('') : `
                            <div class="empty-state">
                                <p>No recent updates found for ${authority}</p>
                                <p><a href="/dashboard" style="color: #4f46e5;">View all updates</a></p>
                            </div>
                        `}
                    </div>

                    <div class="content-section">
                        <h2 class="section-title">
                            🎯 Authority Analysis
                        </h2>
                        <p>This authority has published <strong>${stats.totalUpdates}</strong> regulatory updates with an average impact score of <strong>${stats.avgImpactScore}</strong>.</p>
                        <p>Recent activity shows <strong>${stats.recentActivity}</strong> updates this month, with <strong>${stats.highImpact}</strong> classified as high impact.</p>
                    </div>
                </main>
            </div>

            ${getClientScripts()}
        </body>
        </html>`;

        res.send(html);

    } catch (error) {
        console.error('❌ Error rendering authority spotlight page:', error);
        res.status(500).send(`
            <div style="padding: 2rem; text-align: center; font-family: system-ui;">
                <h1>Authority Spotlight Error</h1>
                <p style="color: #6b7280; margin: 1rem 0;">${error.message}</p>
                <a href="/" style="color: #3b82f6; text-decoration: none;">← Back to Home</a>
            </div>
        `);
    }
}

function calculateAuthorityStats(updates, authority) {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const recentUpdates = updates.filter(update =>
        new Date(update.fetchedDate || update.createdAt) >= thisMonth
    );

    const highImpactUpdates = updates.filter(update =>
        update.impactLevel === 'Significant' || update.businessImpactScore >= 7
    );

    const impactScores = updates
        .filter(update => update.businessImpactScore && update.businessImpactScore > 0)
        .map(update => update.businessImpactScore);

    const avgImpactScore = impactScores.length > 0
        ? Math.round(impactScores.reduce((a, b) => a + b, 0) / impactScores.length * 10) / 10
        : 0;

    return {
        totalUpdates: updates.length,
        highImpact: highImpactUpdates.length,
        recentActivity: recentUpdates.length,
        avgImpactScore
    };
}

module.exports = renderAuthoritySpotlightPage;