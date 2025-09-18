const axios = require('axios');
const { getSidebar } = require('../templates/sidebar');
const { getClientScripts } = require('../templates/clientScripts');
const { getCommonStyles } = require('../templates/commonStyles');
const dbService = require('../../services/dbService');

async function renderAuthoritySpotlightPage(req, res) {
    try {
        console.log('🏛️ Rendering authority spotlight page...');
        const sidebar = await getSidebar('authority-spotlight');

        const defaultAuthority = 'FCA';
        const selectedAuthorityRaw = req.params.authority || req.query.authority || defaultAuthority;
        const selectedAuthority = safeDecode(selectedAuthorityRaw);

        const { spotlight, recentUpdates, authorityOptions } = await loadAuthoritySpotlightData(req, selectedAuthority);

        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${escapeHtml(selectedAuthority)} Authority Spotlight - Regulatory Intelligence Platform</title>
            ${getCommonStyles()}
            <style>
                .intelligence-header {
                    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                    color: white;
                    padding: 40px;
                    border-radius: 12px;
                    margin-bottom: 30px;
                    position: relative;
                    overflow: hidden;
                }

                .intelligence-header::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle at top right, rgba(255,255,255,0.15), transparent);
                    pointer-events: none;
                }

                .intelligence-title {
                    font-size: 2rem;
                    font-weight: 700;
                    margin-bottom: 10px;
                }

                .intelligence-subtitle {
                    font-size: 1rem;
                    max-width: 600px;
                    opacity: 0.9;
                }

                .selector-card {
                    background: white;
                    border-radius: 12px;
                    padding: 20px 24px;
                    margin-bottom: 30px;
                    box-shadow: 0 10px 30px rgba(79, 70, 229, 0.15);
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: 20px;
                    border: 1px solid #e5e7eb;
                }

                .selector-label {
                    font-weight: 600;
                    color: #1f2937;
                }

                .selector-card form {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    align-items: center;
                }

                .selector-card select {
                    padding: 10px 14px;
                    border-radius: 8px;
                    border: 1px solid #c7d2fe;
                    font-size: 0.95rem;
                    min-width: 200px;
                    background: #eef2ff;
                    color: #312e81;
                }

                .selector-card button {
                    padding: 10px 20px;
                    background: #4f46e5;
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }

                .selector-card button:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 8px 20px rgba(79, 70, 229, 0.3);
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .stat-card {
                    background: white;
                    padding: 20px;
                    border-radius: 12px;
                    box-shadow: 0 4px 15px rgba(15, 23, 42, 0.08);
                    border: 1px solid #e5e7eb;
                }

                .stat-label {
                    font-size: 0.85rem;
                    color: #6b7280;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                }

                .stat-value {
                    font-size: 1.6rem;
                    font-weight: 700;
                    color: #1f2937;
                }

                .spotlight-sections {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .spotlight-card {
                    background: white;
                    border-radius: 12px;
                    padding: 24px;
                    border: 1px solid #e5e7eb;
                    box-shadow: 0 2px 12px rgba(15, 23, 42, 0.05);
                }

                .spotlight-card h3 {
                    margin-top: 0;
                    margin-bottom: 16px;
                    font-size: 1.2rem;
                    color: #1f2937;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .focus-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    background: #eef2ff;
                    color: #3730a3;
                    padding: 6px 12px;
                    border-radius: 9999px;
                    font-size: 0.85rem;
                    margin: 4px;
                }

                .initiative-item {
                    border-left: 4px solid #4f46e5;
                    background: #f9fafb;
                    padding: 12px 16px;
                    border-radius: 10px;
                    margin-bottom: 12px;
                }

                .initiative-item:last-child {
                    margin-bottom: 0;
                }

                .initiative-title {
                    font-weight: 600;
                    color: #312e81;
                    margin-bottom: 4px;
                }

                .initiative-impact {
                    color: #6b7280;
                    font-size: 0.85rem;
                }

                .enforcement-highlight {
                    background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
                    border: 1px solid #fb923c;
                    padding: 16px;
                    border-radius: 12px;
                    color: #9a3412;
                    font-weight: 500;
                    margin-bottom: 15px;
                }

                .upcoming-actions li {
                    margin-bottom: 10px;
                    padding-left: 8px;
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
                    color: #6b7280;
                    margin-bottom: 6px;
                }

                .impact-tag {
                    padding: 4px 10px;
                    border-radius: 9999px;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    background: #eef2ff;
                    color: #3730a3;
                }

                .impact-tag.significant {
                    background: #fee2e2;
                    color: #b91c1c;
                }

                .impact-tag.moderate {
                    background: #fef9c3;
                    color: #b45309;
                }

                .analysis-meta {
                    display: flex;
                    gap: 16px;
                    flex-wrap: wrap;
                    margin-top: 12px;
                    font-size: 0.85rem;
                    color: #cbd5f5;
                }

                .empty-state {
                    margin: 0;
                    color: #6b7280;
                    font-style: italic;
                }

                @media (max-width: 900px) {
                    .intelligence-header {
                        padding: 30px 20px;
                    }

                    .spotlight-sections {
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
                    <header class="intelligence-header">
                        <h1 class="intelligence-title">🏛️ ${escapeHtml(selectedAuthority)} Authority Spotlight</h1>
                        <p class="intelligence-subtitle">
                            Detailed activity analysis, enforcement trends, and upcoming actions for ${escapeHtml(selectedAuthority)}
                        </p>
                        <div class="analysis-meta">
                            <span>Analysis generated: ${formatDateTime(spotlight.analysisDate)}</span>
                            <span>Confidence: ${formatConfidence(spotlight.confidence)}</span>
                        </div>
                    </header>

                    <section class="selector-card">
                        <div class="selector-label">Select authority</div>
                        <form method="get" action="/ai/authority-spotlight">
                            <select name="authority" aria-label="Select authority">
                                ${renderAuthorityOptions(authorityOptions, selectedAuthority)}
                            </select>
                            <button type="submit">Update spotlight</button>
                        </form>
                    </section>

                    <section class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-label">Recent Updates (30 days)</div>
                            <div class="stat-value">${spotlight.totalUpdates}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Activity Level</div>
                            <div class="stat-value">${formatActivityLevel(spotlight.activityLevel)}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Top Focus Areas</div>
                            <div class="stat-value">${spotlight.focusAreas.length}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Confidence</div>
                            <div class="stat-value">${formatConfidence(spotlight.confidence)}</div>
                        </div>
                    </section>

                    <section class="spotlight-sections">
                        <article class="spotlight-card">
                            <h3>🎯 Key Focus Areas</h3>
                            ${renderFocusAreas(spotlight.focusAreas)}
                        </article>

                        <article class="spotlight-card">
                            <h3>🚀 Current Initiatives</h3>
                            ${renderInitiatives(spotlight.keyInitiatives)}
                        </article>

                        <article class="spotlight-card">
                            <h3>⚖️ Enforcement Trend</h3>
                            <div class="enforcement-highlight">${escapeHtml(spotlight.enforcementTrends)}</div>
                            <h4 style="margin-bottom: 8px; color: #1f2937;">📅 Upcoming Actions</h4>
                            ${renderUpcomingActions(spotlight.upcomingActions)}
                        </article>
                    </section>

                    <section class="updates-card">
                        <h2 style="margin-top:0; margin-bottom: 16px; font-size:1.4rem; color:#1f2937;">📰 Recent updates from ${escapeHtml(selectedAuthority)}</h2>
                        ${renderRecentUpdates(recentUpdates)}
                    </section>
                </main>
            </div>

            ${getClientScripts()}
        </body>
        </html>`;

        res.send(html);
    } catch (error) {
        console.error('❌ Error rendering authority spotlight page:', error);
        res.status(500).send(`
            <html>
                <body style="font-family: Arial; padding: 60px; text-align: center;">
                    <h1>❌ Authority Spotlight Unavailable</h1>
                    <p>We were unable to load the authority spotlight at this time.</p>
                    <p>Error: ${escapeHtml(error.message || 'Unknown error')}</p>
                    <a href="/" style="color: #4f46e5;">← Back to Home</a>
                </body>
            </html>
        `);
    }
}

async function loadAuthoritySpotlightData(req, authority) {
    const [spotlight, recentUpdates, authorityOptions] = await Promise.all([
        fetchAuthoritySpotlight(req, authority),
        dbService.getEnhancedUpdates({ authority, range: 'month', limit: 12 }),
        getAuthorityOptions()
    ]);

    return {
        spotlight: spotlight || createEmptySpotlight(authority),
        recentUpdates: recentUpdates || [],
        authorityOptions: mergeOptions(authorityOptions, authority)
    };
}

async function fetchAuthoritySpotlight(req, authority) {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const apiUrl = `${baseUrl}/api/ai/authority-spotlight/${encodeURIComponent(authority)}`;
        const response = await axios.get(apiUrl, { timeout: 10000 });
        return response.data?.spotlight || null;
    } catch (error) {
        console.warn('⚠️ Failed to fetch authority spotlight from API:', error.message);
        return null;
    }
}

async function getAuthorityOptions() {
    try {
        const updates = await dbService.getEnhancedUpdates({ range: 'month', limit: 200 });
        const counts = updates.reduce((acc, update) => {
            if (update.authority) {
                acc[update.authority] = (acc[update.authority] || 0) + 1;
            }
            return acc;
        }, {});

        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(([authority]) => authority)
            .filter(Boolean)
            .slice(0, 20);
    } catch (error) {
        console.warn('⚠️ Failed to build authority list:', error.message);
        return [];
    }
}

function mergeOptions(options, selected) {
    if (!selected) return options;
    if (!options.includes(selected)) {
        return [selected, ...options];
    }
    return options;
}

function renderAuthorityOptions(options, selected) {
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

function renderFocusAreas(focusAreas = []) {
    if (!focusAreas.length) {
        return '<p class="empty-state">No dominant focus areas identified in the last month.</p>';
    }

    return focusAreas
        .slice(0, 8)
        .map(area => `<span class="focus-badge">${escapeHtml(area)}</span>`)
        .join('');
}

function renderInitiatives(initiatives = []) {
    if (!initiatives.length) {
        return '<p class="empty-state">No headline initiatives detected yet.</p>';
    }

    return initiatives
        .map(item => `
            <div class="initiative-item">
                <div class="initiative-title">${escapeHtml(item.initiative || 'Initiative')}</div>
                <div>${escapeHtml(item.description || 'Further details to follow.')}</div>
                ${item.impact ? `<div class="initiative-impact">Impact: ${escapeHtml(item.impact)}</div>` : ''}
            </div>
        `)
        .join('');
}

function renderUpcomingActions(actions = []) {
    if (!actions.length) {
        return '<p class="empty-state">No upcoming actions projected.</p>';
    }

    return `<ul class="upcoming-actions">${actions
        .map(action => `<li>${escapeHtml(action)}</li>`)
        .join('')}</ul>`;
}

function renderRecentUpdates(updates = []) {
    if (!updates.length) {
        return '<p class="empty-state">No recent updates available for this authority.</p>';
    }

    return updates
        .map(update => {
            const headline = escapeHtml(update.headline || 'Update');
            const summary = escapeHtml(update.summary || update.ai_summary || 'Summary forthcoming.');
            const published = formatDate(update.published_date || update.date_published || update.date || update.created_at);
            const impact = (update.impact_level || update.impactLevel || '').toLowerCase();
            const impactLabel = escapeHtml(update.impact_level || update.impactLevel || 'Informational');

            return `
                <article class="update-entry">
                    <div class="update-meta">
                        <span>${published}</span>
                        <span class="impact-tag ${impact}">${impactLabel}</span>
                    </div>
                    <h3 style="margin: 0 0 6px 0; font-size: 1.05rem; color: #1f2937;">${headline}</h3>
                    <p style="margin: 0; color: #4b5563; line-height: 1.5;">${summary}</p>
                </article>
            `;
        })
        .join('');
}

function createEmptySpotlight(authority) {
    return {
        authority,
        focusAreas: [],
        activityLevel: 'unknown',
        keyInitiatives: [],
        enforcementTrends: 'No recent enforcement insight available.',
        upcomingActions: [],
        totalUpdates: 0,
        analysisDate: new Date().toISOString(),
        confidence: 0
    };
}

function formatActivityLevel(level) {
    if (!level) return 'Unknown';
    return level.charAt(0).toUpperCase() + level.slice(1);
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
    renderAuthoritySpotlightPage
};
