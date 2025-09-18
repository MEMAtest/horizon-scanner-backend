const axios = require('axios');
const { getSidebar } = require('../templates/sidebar');
const { getClientScripts } = require('../templates/clientScripts');
const { getCommonStyles } = require('../templates/commonStyles');
const dbService = require('../../services/dbService');

async function renderSectorIntelligencePage(req, res) {
    try {
        console.log('🏢 Rendering sector intelligence page...');
        const sidebar = await getSidebar('sector-intelligence');

        const defaultSector = 'Banking';
        const selectedSectorRaw = req.params.sector || req.query.sector || defaultSector;
        const selectedSector = safeDecode(selectedSectorRaw);

        const { analysis, recentUpdates, sectorOptions } = await loadSectorIntelligenceData(req, selectedSector);

        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${escapeHtml(selectedSector)} Sector Intelligence - Regulatory Intelligence Platform</title>
            ${getCommonStyles()}
            <style>
                .sector-header {
                    background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
                    color: white;
                    padding: 40px;
                    border-radius: 12px;
                    margin-bottom: 30px;
                    position: relative;
                    overflow: hidden;
                }

                .sector-header::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle at top right, rgba(255,255,255,0.2), transparent);
                    pointer-events: none;
                }

                .sector-title {
                    font-size: 2rem;
                    font-weight: 700;
                    margin-bottom: 12px;
                }

                .sector-subtitle {
                    max-width: 620px;
                    font-size: 1rem;
                    opacity: 0.95;
                }

                .analysis-meta {
                    margin-top: 14px;
                    display: flex;
                    gap: 18px;
                    flex-wrap: wrap;
                    font-size: 0.85rem;
                    color: rgba(255, 255, 255, 0.85);
                }

                .selector-card {
                    background: white;
                    border-radius: 12px;
                    padding: 20px 24px;
                    margin-bottom: 30px;
                    box-shadow: 0 10px 30px rgba(37, 99, 235, 0.15);
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: 18px;
                    border: 1px solid #e5e7eb;
                }

                .selector-card form {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex-wrap: wrap;
                }

                .selector-label {
                    font-weight: 600;
                    color: #1f2937;
                }

                .selector-card select {
                    padding: 10px 14px;
                    border-radius: 8px;
                    border: 1px solid #93c5fd;
                    background: #dbeafe;
                    color: #1d4ed8;
                    min-width: 200px;
                    font-size: 0.95rem;
                }

                .selector-card button {
                    padding: 10px 20px;
                    background: #2563eb;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }

                .selector-card button:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 10px 24px rgba(37, 99, 235, 0.25);
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .stat-card {
                    background: white;
                    border-radius: 12px;
                    padding: 22px;
                    border: 1px solid #e5e7eb;
                    box-shadow: 0 4px 15px rgba(15, 23, 42, 0.08);
                }

                .stat-label {
                    font-size: 0.85rem;
                    color: #64748b;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                }

                .stat-value {
                    font-size: 1.6rem;
                    font-weight: 700;
                    color: #0f172a;
                }

                .stat-caption {
                    font-size: 0.85rem;
                    color: #475569;
                    margin-top: 6px;
                }

                .insight-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .insight-card {
                    background: white;
                    border-radius: 12px;
                    padding: 24px;
                    border: 1px solid #e5e7eb;
                    box-shadow: 0 2px 12px rgba(15, 23, 42, 0.05);
                }

                .insight-card h3 {
                    margin-top: 0;
                    margin-bottom: 16px;
                    font-size: 1.2rem;
                    color: #0f172a;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .theme-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    background: #dbeafe;
                    color: #1d4ed8;
                    padding: 6px 12px;
                    border-radius: 9999px;
                    font-size: 0.85rem;
                    margin: 4px;
                }

                .focus-item {
                    border-left: 4px solid #2563eb;
                    background: #f8fafc;
                    padding: 12px 16px;
                    border-radius: 10px;
                    margin-bottom: 12px;
                }

                .recommendations-list li {
                    margin-bottom: 10px;
                    padding-left: 6px;
                }

                .pressure-indicator {
                    font-weight: 700;
                    font-size: 1.4rem;
                    margin-bottom: 8px;
                }

                .pressure-indicator.high {
                    color: #b91c1c;
                }

                .pressure-indicator.moderate {
                    color: #b45309;
                }

                .pressure-indicator.low {
                    color: #047857;
                }

                .updates-card {
                    background: white;
                    border-radius: 12px;
                    padding: 24px;
                    border: 1px solid #e5e7eb;
                    box-shadow: 0 2px 12px rgba(15, 23, 42, 0.05);
                }

                .update-entry {
                    border-bottom: 1px solid #f3f4f6;
                    padding: 16px 0;
                }

                .update-entry:last-child {
                    border-bottom: none;
                }

                .update-meta {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 0.85rem;
                    color: #64748b;
                    margin-bottom: 6px;
                }

                .impact-tag {
                    padding: 4px 10px;
                    border-radius: 9999px;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    background: #dbeafe;
                    color: #1d4ed8;
                }

                .impact-tag.significant {
                    background: #fee2e2;
                    color: #b91c1c;
                }

                .impact-tag.moderate {
                    background: #fef08a;
                    color: #b45309;
                }

                .empty-state {
                    margin: 0;
                    color: #64748b;
                    font-style: italic;
                }

                @media (max-width: 900px) {
                    .sector-header {
                        padding: 30px 20px;
                    }

                    .insight-grid {
                        grid-template-columns: 1fr;
                    }

                    .selector-card {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                }
            </style>
        </head>
        <body>
            <div class="app-container">
                ${sidebar}

                <main class="main-content">
                    <header class="sector-header">
                        <h1 class="sector-title">🔍 ${escapeHtml(selectedSector)} Sector Intelligence</h1>
                        <p class="sector-subtitle">
                            Regulatory pressure, compliance focus areas, and strategic recommendations tailored for the ${escapeHtml(selectedSector)} sector.
                        </p>
                        <div class="analysis-meta">
                            <span>Analysis generated: ${formatDateTime(analysis.analysisDate)}</span>
                            <span>Confidence: ${formatConfidence(analysis.confidence)}</span>
                        </div>
                    </header>

                    <section class="selector-card">
                        <div class="selector-label">Select sector</div>
                        <form method="get" action="/ai/sector-intelligence">
                            <select name="sector" aria-label="Select sector">
                                ${renderSectorOptions(sectorOptions, selectedSector)}
                            </select>
                            <button type="submit">Update intelligence</button>
                        </form>
                    </section>

                    <section class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-label">Regulatory Pressure</div>
                            <div class="pressure-indicator ${analysis.regulatoryPressure}">${formatPressure(analysis.regulatoryPressure)}</div>
                            <div class="stat-caption">Based on enforcement intensity & impact mix</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Recent Updates (30 days)</div>
                            <div class="stat-value">${analysis.totalUpdates}</div>
                            <div class="stat-caption">Across monitored authorities</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Business Impact</div>
                            <div class="stat-value">${escapeHtml(analysis.businessImpact)}</div>
                            <div class="stat-caption">Average impact score trend</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Confidence</div>
                            <div class="stat-value">${formatConfidence(analysis.confidence)}</div>
                            <div class="stat-caption">AI model confidence</div>
                        </div>
                    </section>

                    <section class="insight-grid">
                        <article class="insight-card">
                            <h3>🎯 Key Themes</h3>
                            ${renderThemes(analysis.keyThemes)}
                        </article>
                        <article class="insight-card">
                            <h3>🛡️ Compliance Focus</h3>
                            ${renderComplianceFocus(analysis.complianceFocus)}
                        </article>
                        <article class="insight-card">
                            <h3>🧭 Strategic Recommendations</h3>
                            ${renderRecommendations(analysis.recommendations)}
                        </article>
                    </section>

                    <section class="updates-card">
                        <h2 style="margin-top:0; margin-bottom: 16px; font-size:1.4rem; color:#0f172a;">📰 Recent updates influencing ${escapeHtml(selectedSector)}</h2>
                        ${renderRecentUpdates(recentUpdates)}
                    </section>
                </main>
            </div>

            ${getClientScripts()}
        </body>
        </html>`;

        res.send(html);
    } catch (error) {
        console.error('❌ Error rendering sector intelligence page:', error);
        res.status(500).send(`
            <html>
                <body style="font-family: Arial; padding: 60px; text-align: center;">
                    <h1>❌ Sector Intelligence Unavailable</h1>
                    <p>We were unable to load the sector intelligence at this time.</p>
                    <p>Error: ${escapeHtml(error.message || 'Unknown error')}</p>
                    <a href="/" style="color: #2563eb;">← Back to Home</a>
                </body>
            </html>
        `);
    }
}

async function loadSectorIntelligenceData(req, sector) {
    const [analysis, recentUpdates, sectorOptions] = await Promise.all([
        fetchSectorAnalysis(req, sector),
        dbService.getEnhancedUpdates({ sector, range: 'month', limit: 12 }),
        getSectorOptions()
    ]);

    return {
        analysis: analysis || createEmptyAnalysis(sector),
        recentUpdates: recentUpdates || [],
        sectorOptions: mergeOptions(sectorOptions, sector)
    };
}

async function fetchSectorAnalysis(req, sector) {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const apiUrl = `${baseUrl}/api/ai/sector-analysis/${encodeURIComponent(sector)}`;
        const response = await axios.get(apiUrl, { timeout: 10000 });
        return response.data?.analysis || null;
    } catch (error) {
        console.warn('⚠️ Failed to fetch sector analysis from API:', error.message);
        return null;
    }
}

async function getSectorOptions() {
    try {
        const updates = await dbService.getEnhancedUpdates({ range: 'month', limit: 300 });
        const counts = updates.reduce((acc, update) => {
            const sectors = collectSectors(update);
            sectors.forEach(sector => {
                acc[sector] = (acc[sector] || 0) + 1;
            });
            return acc;
        }, {});

        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(([sector]) => sector)
            .filter(Boolean)
            .slice(0, 25);
    } catch (error) {
        console.warn('⚠️ Failed to build sector list:', error.message);
        return [];
    }
}

function collectSectors(update) {
    const sectors = new Set();

    if (update.sector) {
        sectors.add(update.sector);
    }

    if (Array.isArray(update.firm_types_affected)) {
        update.firm_types_affected.forEach(sector => sectors.add(sector));
    }

    if (update.sector_relevance_scores) {
        Object.entries(update.sector_relevance_scores).forEach(([sector, score]) => {
            if (score > 40) {
                sectors.add(sector);
            }
        });
    }

    return Array.from(sectors).filter(Boolean);
}

function mergeOptions(options, selected) {
    if (!selected) return options;
    if (!options.includes(selected)) {
        return [selected, ...options];
    }
    return options;
}

function renderSectorOptions(options, selected) {
    if (!options || options.length === 0) {
        return `<option value="${escapeHtml(selected)}" selected>${escapeHtml(selected)}</option>`;
    }

    return options
        .map(option => {
            const isSelected = option === selected;
            return `<option value="${escapeHtml(option)}" ${isSelected ? 'selected' : ''}>${escapeHtml(option)}</option>`;
        })
        .join('');
}

function renderThemes(themes = []) {
    if (!themes.length) {
        return '<p class="empty-state">No emerging themes identified for this sector.</p>';
    }

    return themes
        .slice(0, 8)
        .map(theme => `<span class="theme-badge">${escapeHtml(theme)}</span>`)
        .join('');
}

function renderComplianceFocus(items = []) {
    if (!items.length) {
        return '<p class="empty-state">No priority compliance areas detected.</p>';
    }

    return items
        .slice(0, 6)
        .map(item => `<div class="focus-item">${escapeHtml(item)}</div>`)
        .join('');
}

function renderRecommendations(recommendations = []) {
    if (!recommendations.length) {
        return '<p class="empty-state">Strategic recommendations will appear as new intelligence is generated.</p>';
    }

    return `<ul class="recommendations-list">${recommendations
        .map(rec => `<li>${escapeHtml(rec)}</li>`)
        .join('')}</ul>`;
}

function renderRecentUpdates(updates = []) {
    if (!updates.length) {
        return '<p class="empty-state">No recent updates available for this sector.</p>';
    }

    return updates
        .map(update => {
            const headline = escapeHtml(update.headline || 'Update');
            const summary = escapeHtml(update.summary || update.ai_summary || 'Summary forthcoming.');
            const published = formatDate(update.published_date || update.date_published || update.date || update.created_at);
            const impact = (update.impact_level || update.impactLevel || '').toLowerCase();
            const impactLabel = escapeHtml(update.impact_level || update.impactLevel || 'Informational');
            const authority = escapeHtml(update.authority || 'Multiple authorities');

            return `
                <article class="update-entry">
                    <div class="update-meta">
                        <span>${published}</span>
                        <span class="impact-tag ${impact}">${impactLabel}</span>
                        <span>Source: ${authority}</span>
                    </div>
                    <h3 style="margin: 0 0 6px 0; font-size: 1.05rem; color: #0f172a;">${headline}</h3>
                    <p style="margin: 0; color: #475569; line-height: 1.5;">${summary}</p>
                </article>
            `;
        })
        .join('');
}

function createEmptyAnalysis(sector) {
    return {
        sector,
        regulatoryPressure: 'unknown',
        keyThemes: [],
        complianceFocus: [],
        businessImpact: 'Not available',
        recommendations: [],
        totalUpdates: 0,
        analysisDate: new Date().toISOString(),
        confidence: 0
    };
}

function formatPressure(value) {
    if (!value) return 'Unknown';
    const normalized = value.toLowerCase();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function formatConfidence(confidence) {
    if (confidence === undefined || confidence === null) return 'N/A';
    return `${Math.round(confidence * 100)}%`;
}

function formatDateTime(value) {
    if (!value) return 'Unavailable';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unavailable';
    return date.toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDate(value) {
    if (!value) return 'Unknown date';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown date';
    return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function safeDecode(value) {
    if (!value) return value;

    try {
        return decodeURIComponent(value);
    } catch (error) {
        return value;
    }
}

function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

module.exports = {
    renderSectorIntelligencePage
};
