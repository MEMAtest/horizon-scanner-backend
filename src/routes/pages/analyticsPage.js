// src/routes/pages/analyticsPage.js
// Server-rendered analytics dashboard that surfaces database statistics and
// provides an interactive impact distribution view.

const { getCommonStyles } = require('../templates/commonStyles');
const { getSidebar } = require('../templates/sidebar');
const { getClientScripts } = require('../templates/clientScripts');
const dbService = require('../../services/dbService');

const IMPACT_LEVELS = ['Significant', 'Moderate', 'Informational'];
const DEFAULT_PERIOD = 'month';

const serializeForScript = (payload) => {
    return JSON.stringify(payload).replace(/</g, '\\u003c');
};

const formatNumber = (value) => {
    if (value === undefined || value === null || Number.isNaN(value)) return '0';
    return Number(value).toLocaleString('en-GB');
};

const calculateImpactDistribution = (updates = []) => {
    const distribution = {
        byLevel: { Significant: 0, Moderate: 0, Informational: 0 },
        byScore: {},
        byAuthority: {},
        bySector: {},
        timeline: []
    };

    updates.forEach(update => {
        const level = update.impactLevel || update.impact_level || 'Informational';
        distribution.byLevel[level] = (distribution.byLevel[level] || 0) + 1;

        const score = update.business_impact_score || update.businessImpactScore || 0;
        const bucketLabel = `${Math.floor(score)}-${Math.floor(score) + 1}`;
        distribution.byScore[bucketLabel] = (distribution.byScore[bucketLabel] || 0) + 1;

        const authority = update.authority || 'Unknown';
        if (!distribution.byAuthority[authority]) {
            distribution.byAuthority[authority] = { total: 0, highImpact: 0 };
        }
        distribution.byAuthority[authority].total++;
        if (level === 'Significant' || score >= 7) {
            distribution.byAuthority[authority].highImpact++;
        }

        const sectors = update.firm_types_affected || update.primarySectors || [];
        sectors.forEach(sector => {
            const sectorName = sector || 'Other';
            if (!distribution.bySector[sectorName]) {
                distribution.bySector[sectorName] = { total: 0, avgImpact: 0 };
            }
            distribution.bySector[sectorName].total++;
            distribution.bySector[sectorName].avgImpact += score;
        });
    });

    Object.keys(distribution.bySector).forEach(sector => {
        const entry = distribution.bySector[sector];
        entry.avgImpact = entry.total > 0 ? entry.avgImpact / entry.total : 0;
    });

    return distribution;
};

const getTopAuthorities = (distribution, limit = 5) => {
    return Object.entries(distribution.byAuthority || {})
        .map(([name, data]) => ({
            name: name || 'Unknown',
            total: data.total || 0,
            highImpact: data.highImpact || 0,
            percentage: data.total > 0 ? Math.round((data.highImpact / data.total) * 100) : 0
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, limit);
};

const getTopSectors = (distribution, limit = 5) => {
    return Object.entries(distribution.bySector || {})
        .map(([name, data]) => ({
            name: name || 'Other',
            total: data.total || 0,
            avgImpact: data.avgImpact || 0
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, limit);
};

const renderImpactRows = (distribution) => {
    const total = IMPACT_LEVELS.reduce((acc, level) => acc + (distribution.byLevel?.[level] || 0), 0);

    return IMPACT_LEVELS.map(level => {
        const count = distribution.byLevel?.[level] || 0;
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
        const levelKey = level.toLowerCase();

        return `
            <div class="impact-row" data-impact-level="${level}">
                <div class="impact-label">${level}</div>
                <div class="impact-bar">
                    <div class="impact-bar-fill impact-${levelKey}" style="width: ${percentage}%"></div>
                </div>
                <div class="impact-value">
                    <span class="impact-count">${formatNumber(count)}</span>
                    <span class="impact-percent">${percentage}%</span>
                </div>
            </div>
        `;
    }).join('');
};

const renderAuthorityTable = (distribution) => {
    const rows = getTopAuthorities(distribution).map(authority => {
        return `
            <tr>
                <td>${authority.name}</td>
                <td>${formatNumber(authority.total)}</td>
                <td>${formatNumber(authority.highImpact)}</td>
                <td>${authority.percentage}%</td>
            </tr>
        `;
    }).join('');

    if (!rows) {
        return '<tr><td colspan="4" class="empty">No authority data available</td></tr>';
    }

    return rows;
};

const renderSectorTable = (distribution) => {
    const rows = getTopSectors(distribution).map(sector => {
        return `
            <tr>
                <td>${sector.name}</td>
                <td>${formatNumber(sector.total)}</td>
                <td>${sector.avgImpact.toFixed(1)}</td>
            </tr>
        `;
    }).join('');

    if (!rows) {
        return '<tr><td colspan="3" class="empty">No sector data available</td></tr>';
    }

    return rows;
};

const renderSelectOptions = (options = [], selectedValue = '') => {
    return options.map(option => {
        const value = option.name || option;
        const count = option.count !== undefined ? ` (${option.count})` : '';
        const selected = selectedValue && selectedValue === value ? 'selected' : '';
        return `<option value="${value}" ${selected}>${value}${count}</option>`;
    }).join('');
};

const getSummaryCards = (stats) => {
    const cards = [
        { label: 'Total Updates', key: 'totalUpdates', trendKey: 'impactTrend' },
        { label: 'High Impact', key: 'highImpact', trendKey: 'impactTrend' },
        { label: 'AI Analyzed', key: 'aiAnalyzed', trendKey: 'impactTrend' },
        { label: 'Active Authorities', key: 'activeAuthorities', trendKey: 'impactTrend' },
        { label: 'New Today', key: 'newToday', trendKey: 'impactTrend' }
    ];

    return cards.map(card => {
        const value = stats?.[card.key] ?? 0;
        return `
            <div class="summary-card">
                <div class="summary-label">${card.label}</div>
                <div class="summary-value">${formatNumber(value)}</div>
            </div>
        `;
    }).join('');
};

async function renderAnalyticsPage(req, res) {
    try {
        const { authority = '', sector = '', period = DEFAULT_PERIOD } = req.query;

        const [statistics, filterOptions, recentUpdates] = await Promise.all([
            dbService.getDashboardStatistics(),
            dbService.getFilterOptions(),
            dbService.getEnhancedUpdates({
                authority: authority || undefined,
                sector: sector || undefined,
                range: period || DEFAULT_PERIOD,
                limit: 500
            })
        ]);

        const impactDistribution = calculateImpactDistribution(recentUpdates);
        const totalDistributionCount = IMPACT_LEVELS.reduce((acc, level) => acc + (impactDistribution.byLevel?.[level] || 0), 0);
        const sidebar = await getSidebar('analytics');

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Analytics Dashboard - Regulatory Intelligence</title>
    ${getCommonStyles()}
    <style>
        .analytics-page {
            display: flex;
            flex-direction: column;
            gap: 24px;
        }

        .analytics-header {
            background: white;
            padding: 28px;
            border-radius: 14px;
            box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
            border: 1px solid #e5e7eb;
        }

        .analytics-header h1 {
            font-size: 2rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 12px;
        }

        .analytics-header p {
            color: #6b7280;
            margin-bottom: 18px;
        }

        .analytics-meta {
            display: flex;
            gap: 24px;
            flex-wrap: wrap;
            font-size: 0.9rem;
            color: #6b7280;
        }

        .analytics-summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 18px;
        }

        .summary-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            border: 1px solid #e5e7eb;
            box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
        }

        .summary-label {
            font-size: 0.9rem;
            color: #6b7280;
            margin-bottom: 8px;
        }

        .summary-value {
            font-size: 1.8rem;
            font-weight: 700;
            color: #1f2937;
        }

        .analytics-filters {
            background: white;
            border-radius: 12px;
            padding: 24px;
            border: 1px solid #e5e7eb;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 16px;
            align-items: flex-end;
        }

        .filter-group label {
            display: block;
            font-size: 0.85rem;
            font-weight: 600;
            color: #374151;
            margin-bottom: 6px;
        }

        .filter-group select {
            width: 100%;
            padding: 10px 12px;
            border-radius: 8px;
            border: 1px solid #d1d5db;
            background: #f9fafb;
            font-size: 0.95rem;
        }

        .analytics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }

        .analytics-card {
            background: white;
            border-radius: 14px;
            border: 1px solid #e5e7eb;
            box-shadow: 0 12px 24px rgba(15, 23, 42, 0.05);
            padding: 24px;
        }

        .analytics-card h3 {
            font-size: 1.2rem;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 18px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .impact-chart {
            display: flex;
            flex-direction: column;
            gap: 14px;
        }

        .impact-row {
            display: grid;
            grid-template-columns: 120px 1fr 120px;
            gap: 16px;
            align-items: center;
        }

        .impact-label {
            font-weight: 600;
            color: #374151;
        }

        .impact-bar {
            background: #f1f5f9;
            border-radius: 999px;
            height: 12px;
            overflow: hidden;
        }

        .impact-bar-fill {
            height: 100%;
            border-radius: 999px;
            transition: width 0.4s ease;
        }

        .impact-significant { background: linear-gradient(90deg, #ef4444, #f97316); }
        .impact-moderate { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
        .impact-informational { background: linear-gradient(90deg, #38bdf8, #0ea5e9); }

        .impact-value {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            font-weight: 600;
            color: #1f2937;
        }

        .impact-percent {
            color: #6b7280;
            font-weight: 500;
        }

        .score-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #f1f5f9;
            color: #1f2937;
            font-weight: 500;
        }

        .score-row:last-child {
            border-bottom: none;
        }

        .analytics-card table {
            width: 100%;
            border-collapse: collapse;
        }

        .analytics-card table th,
        .analytics-card table td {
            text-align: left;
            padding: 12px 0;
            border-bottom: 1px solid #f1f5f9;
        }

        .analytics-card table th {
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: #9ca3af;
        }

        .analytics-card table td {
            color: #1f2937;
            font-weight: 500;
        }

        .analytics-card table td:last-child {
            text-align: right;
        }

        .analytics-card table tr:last-child td {
            border-bottom: none;
        }

        .analytics-card table td.empty {
            text-align: center;
            color: #9ca3af;
            font-style: italic;
        }

        .analytics-actions {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            justify-content: flex-end;
        }

        .analytics-button {
            background: #4f46e5;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 10px 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .analytics-button.secondary {
            background: white;
            color: #4f46e5;
            border: 1px solid #4f46e5;
        }

        .analytics-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 8px 15px rgba(79, 70, 229, 0.2);
        }

        .analytics-loading {
            font-size: 0.85rem;
            color: #9ca3af;
            display: none;
        }

        .analytics-loading.active {
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }

        @media (max-width: 1024px) {
            .impact-row {
                grid-template-columns: 1fr;
                gap: 8px;
            }

            .impact-value {
                justify-content: flex-start;
            }
        }
    </style>
</head>
<body>
    <div class="app-container">
        ${sidebar}
        <main class="main-content analytics-page" data-page="analytics" data-selected-authority="${authority}" data-selected-sector="${sector}" data-selected-period="${period || DEFAULT_PERIOD}">
            <section class="analytics-header">
                <h1>Predictive Analytics Dashboard</h1>
                <p>Explore regulatory impact trends, authority performance and sector exposure using live data from the Horizon Scanner knowledge base.</p>
                <div class="analytics-meta">
                    <span>Last refresh: ${new Date().toLocaleString('en-GB')}</span>
                    <span>Total analysed updates: ${formatNumber(statistics?.totalUpdates || 0)}</span>
                    <span>Filters applied: ${authority ? `Authority - ${authority}` : 'All authorities'}, ${sector ? `Sector - ${sector}` : 'All sectors'}</span>
                </div>
            </section>

            <section class="analytics-summary">
                ${getSummaryCards(statistics)}
            </section>

            <form id="analytics-filter-form" class="analytics-filters">
                <div class="filter-group">
                    <label for="analytics-authority">Authority</label>
                    <select id="analytics-authority" name="authority">
                        <option value="">All authorities</option>
                        ${renderSelectOptions(filterOptions?.authorities || [], authority)}
                    </select>
                </div>
                <div class="filter-group">
                    <label for="analytics-sector">Sector</label>
                    <select id="analytics-sector" name="sector">
                        <option value="">All sectors</option>
                        ${renderSelectOptions(filterOptions?.sectors || [], sector)}
                    </select>
                </div>
                <div class="filter-group">
                    <label for="analytics-period">Time range</label>
                    <select id="analytics-period" name="period">
                        <option value="week" ${period === 'week' ? 'selected' : ''}>Last 7 days</option>
                        <option value="month" ${(!period || period === 'month') ? 'selected' : ''}>Last 30 days</option>
                        <option value="quarter" ${period === 'quarter' ? 'selected' : ''}>Last 90 days</option>
                        <option value="year" ${period === 'year' ? 'selected' : ''}>Last 12 months</option>
                    </select>
                </div>
                <div class="filter-group">
                    <div class="analytics-actions">
                        <span id="analytics-loading" class="analytics-loading">Loading latest analytics…</span>
                        <button type="button" id="analytics-reset" class="analytics-button secondary">Reset</button>
                    </div>
                </div>
            </form>

            <section class="analytics-grid">
                <div class="analytics-card">
                    <h3>Impact distribution <span id="impact-total">${formatNumber(totalDistributionCount)} total</span></h3>
                    <div id="impact-level-chart" class="impact-chart">
                        ${renderImpactRows(impactDistribution)}
                    </div>
                </div>
                <div class="analytics-card">
                    <h3>Authority focus</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Authority</th>
                                <th>Total</th>
                                <th>High impact</th>
                                <th>High %</th>
                            </tr>
                        </thead>
                        <tbody id="authority-distribution">
                            ${renderAuthorityTable(impactDistribution)}
                        </tbody>
                    </table>
                </div>
            </section>

            <section class="analytics-grid">
                <div class="analytics-card">
                    <h3>Impact score distribution</h3>
                    <div id="impact-score-table">
                        ${Object.entries(impactDistribution.byScore || {}).sort(([aKey], [bKey]) => {
                            const aStart = parseInt(aKey.split('-')[0], 10);
                            const bStart = parseInt(bKey.split('-')[0], 10);
                            return aStart - bStart;
                        }).map(([bucket, value]) => `
                            <div class="score-row" data-score-range="${bucket}">
                                <span>${bucket}</span>
                                <span>${formatNumber(value)}</span>
                            </div>
                        `).join('') || '<div class="empty">No score data available</div>'}
                    </div>
                </div>
                <div class="analytics-card">
                    <h3>Sector exposure</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Sector</th>
                                <th>Total</th>
                                <th>Avg impact</th>
                            </tr>
                        </thead>
                        <tbody id="sector-distribution">
                            ${renderSectorTable(impactDistribution)}
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    </div>

    <script>
        window.initialAnalyticsData = ${serializeForScript({
            statistics,
            filterOptions,
            impactDistribution,
            filters: { authority, sector, period: period || DEFAULT_PERIOD }
        })};
    </script>
    ${getClientScripts()}
</body>
</html>`;

        res.send(html);
    } catch (error) {
        console.error('Analytics page error:', error);
        res.status(500).send(`
            <div style="padding: 2rem; text-align: center; font-family: system-ui;">
                <h1>Analytics Dashboard Error</h1>
                <p style="color: #6b7280; margin: 1rem 0;">${error.message}</p>
                <a href="/" style="color: #3b82f6; text-decoration: none;">← Back to Home</a>
            </div>
        `);
    }
}

module.exports = {
    renderAnalyticsPage
};
