// src/routes/pages/sectorIntelligencePage.js
// Sector Intelligence Page Renderer

const { getCommonStyles } = require('../templates/commonStyles');
const { getSidebar } = require('../templates/sidebar');
const { getClientScripts } = require('../templates/clientScripts');
const dbService = require('../../services/dbService');

async function renderSectorIntelligencePage(req, res, sector = 'Banking') {
    try {
        console.log(`🏢 Rendering sector intelligence page for: ${sector}`);

        // Get sector-specific data
        const allUpdates = await dbService.getEnhancedUpdates({ limit: 200 });
        const sectorUpdates = allUpdates.filter(update =>
            update.sector === sector ||
            (update.primarySectors && update.primarySectors.includes(sector)) ||
            (update.firmTypesAffected && update.firmTypesAffected.includes(sector))
        );

        // Calculate sector statistics
        const stats = calculateSectorStats(sectorUpdates, sector);

        // Get sidebar
        const sidebar = await getSidebar('sector-intelligence');

        const sectors = [
            'Banking', 'Investment Management', 'Insurance', 'Payment Services',
            'Fintech', 'Credit Unions', 'Pension Funds', 'Real Estate Finance',
            'Consumer Credit', 'Capital Markets', 'Private Equity', 'Hedge Funds',
            'Cryptocurrency', 'RegTech', 'Wealth Management', 'Corporate Finance'
        ];

        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${sector} Intelligence - Regulatory Intelligence Platform</title>
            ${getCommonStyles()}
            <style>
                .intelligence-header {
                    background: linear-gradient(135deg, #10b981 0%, #047857 100%);
                    color: white;
                    padding: 40px;
                    border-radius: 12px;
                    margin-bottom: 30px;
                }

                .sector-title {
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
                        <a href="/" class="back-link">← Back to Home</a>
                        <h1 class="sector-title">
                            🏢 ${sector} Sector Intelligence
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
                    </header>

                    <div class="content-section">
                        <h2 class="section-title">
                            🎯 Regulatory Pressure Analysis
                        </h2>

                        <div class="pressure-analysis">
                            <h3>Current Pressure Level: <span class="risk-indicator risk-${stats.riskLevel.toLowerCase()}">${stats.riskLevel} Risk</span></h3>
                            <p>Based on analysis of ${stats.totalUpdates} relevant regulatory updates, the ${sector} sector is experiencing <strong>${stats.riskLevel.toLowerCase()} regulatory pressure</strong>.</p>

                            ${stats.keyFindings.length > 0 ? `
                                <h4>Key Findings:</h4>
                                <ul>
                                    ${stats.keyFindings.map(finding => `<li>${finding}</li>`).join('')}
                                </ul>
                            ` : ''}
                        </div>
                    </div>

                    <div class="content-section">
                        <h2 class="section-title">
                            📊 Recent Regulatory Updates for ${sector}
                        </h2>

                        ${sectorUpdates.length > 0 ? sectorUpdates.slice(0, 10).map(update => `
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
                        `).join('') : `
                            <div class="empty-state">
                                <p>No recent updates found specifically for the ${sector} sector</p>
                                <p><a href="/dashboard" style="color: #10b981;">View all updates</a></p>
                            </div>
                        `}
                    </div>

                    <div class="content-section">
                        <h2 class="section-title">
                            📋 Compliance Priorities
                        </h2>

                        ${stats.priorities.length > 0 ? `
                            <ol>
                                ${stats.priorities.map(priority => `
                                    <li style="margin-bottom: 10px;">
                                        <strong>${priority.title}</strong> - ${priority.description}
                                    </li>
                                `).join('')}
                            </ol>
                        ` : `
                            <p>No specific compliance priorities identified for the ${sector} sector at this time.</p>
                        `}
                    </div>
                </main>
            </div>

            ${getClientScripts()}
        </body>
        </html>`;

        res.send(html);

    } catch (error) {
        console.error('❌ Error rendering sector intelligence page:', error);
        res.status(500).send(`
            <div style="padding: 2rem; text-align: center; font-family: system-ui;">
                <h1>Sector Intelligence Error</h1>
                <p style="color: #6b7280; margin: 1rem 0;">${error.message}</p>
                <a href="/" style="color: #3b82f6; text-decoration: none;">← Back to Home</a>
            </div>
        `);
    }
}

function calculateSectorStats(updates, sector) {
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
        ? impactScores.reduce((a, b) => a + b, 0) / impactScores.length
        : 0;

    // Calculate pressure score (0-100)
    const pressureScore = Math.min(100, Math.round(
        (updates.length * 2) +
        (highImpactUpdates.length * 10) +
        (recentUpdates.length * 5) +
        (avgImpactScore * 3)
    ));

    // Determine risk level
    let riskLevel = 'Low';
    if (pressureScore > 70) riskLevel = 'High';
    else if (pressureScore > 40) riskLevel = 'Medium';

    // Generate key findings
    const keyFindings = [];
    if (highImpactUpdates.length > 5) {
        keyFindings.push(`${highImpactUpdates.length} high-impact regulatory changes affecting the sector`);
    }
    if (recentUpdates.length > 10) {
        keyFindings.push(`Increased regulatory activity with ${recentUpdates.length} updates this month`);
    }
    if (avgImpactScore > 6) {
        keyFindings.push(`Higher than average impact scores (${avgImpactScore.toFixed(1)}/10)`);
    }

    // Generate compliance priorities
    const priorities = [];
    if (highImpactUpdates.length > 0) {
        priorities.push({
            title: 'Review High-Impact Changes',
            description: `Assess ${highImpactUpdates.length} significant regulatory updates for compliance gaps`
        });
    }
    if (recentUpdates.length > 5) {
        priorities.push({
            title: 'Monitor Recent Developments',
            description: `Track ${recentUpdates.length} recent updates for emerging requirements`
        });
    }
    priorities.push({
        title: 'Sector-Specific Training',
        description: `Ensure teams are updated on ${sector}-specific regulatory requirements`
    });

    return {
        totalUpdates: updates.length,
        highImpact: highImpactUpdates.length,
        recentActivity: recentUpdates.length,
        pressureScore,
        riskLevel,
        keyFindings: keyFindings.slice(0, 3),
        priorities: priorities.slice(0, 5)
    };
}

module.exports = renderSectorIntelligencePage;