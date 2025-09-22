// FCA Enforcement Dashboard Page
// Enhanced Horizon Scanner - Enforcement Intelligence

const { getCommonStyles } = require('../templates/commonStyles');
const { getSidebar } = require('../templates/sidebar');
const { getCommonClientScripts } = require('../templates/clientScripts');

function formatCurrency(amount) {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function formatRelativeTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return `${Math.ceil(diffDays / 365)} years ago`;
}

const enforcementPage = async (req, res) => {
    try {
        console.log('⚖️ Enforcement dashboard page requested');

        const sidebar = await getSidebar('enforcement');

        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>FCA Enforcement Dashboard - Regulatory Intelligence Platform</title>
            ${getCommonStyles()}
            <style>
                .enforcement-header {
                    background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
                    color: white;
                    padding: 30px;
                    border-radius: 12px;
                    margin-bottom: 30px;
                    position: relative;
                }

                .enforcement-header h1 {
                    margin: 0 0 10px 0;
                    font-size: 2rem;
                    font-weight: 700;
                }

                .enforcement-subtitle {
                    font-size: 1.1rem;
                    opacity: 0.9;
                    margin-bottom: 20px;
                }

                .status-indicator {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 15px 20px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .status-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: #10b981;
                    animation: pulse 2s infinite;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .stat-card {
                    background: white;
                    padding: 25px;
                    border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.08);
                    border-left: 4px solid #dc2626;
                    transition: transform 0.2s ease;
                }

                .stat-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 20px rgba(0,0,0,0.12);
                }

                .stat-icon {
                    font-size: 2.5rem;
                    margin-bottom: 15px;
                    display: block;
                }

                .stat-value {
                    font-size: 2.5rem;
                    font-weight: 700;
                    color: #1f2937;
                    margin-bottom: 5px;
                }

                .stat-label {
                    color: #6b7280;
                    font-size: 1rem;
                    font-weight: 500;
                }

                .stat-change {
                    font-size: 0.875rem;
                    margin-top: 8px;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }

                .change-positive {
                    color: #10b981;
                }

                .change-negative {
                    color: #ef4444;
                }

                .dashboard-section {
                    background: white;
                    border-radius: 12px;
                    padding: 25px;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.08);
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #f3f4f6;
                }

                .section-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #1f2937;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .btn {
                    padding: 10px 20px;
                    border-radius: 6px;
                    border: none;
                    font-weight: 500;
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
                    background: #f3f4f6;
                    color: #374151;
                    border: 1px solid #e5e7eb;
                }

                .btn-secondary:hover {
                    background: #e5e7eb;
                }

                .search-filters {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-bottom: 20px;
                    align-items: end;
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    padding: 20px;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                }

                .filter-group {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }

                .filter-label {
                    font-weight: 500;
                    color: #374151;
                    font-size: 0.875rem;
                }

                .filter-input {
                    padding: 10px 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 0.875rem;
                }

                .filter-input:focus {
                    outline: none;
                    border-color: #dc2626;
                    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
                }

                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 15px;
                }

                .data-table th {
                    background: #f9fafb;
                    padding: 12px 15px;
                    text-align: left;
                    font-weight: 600;
                    color: #374151;
                    border-bottom: 2px solid #e5e7eb;
                }

                .data-table td {
                    padding: 15px;
                    border-bottom: 1px solid #f3f4f6;
                    vertical-align: top;
                }

                .data-table tr:hover {
                    background: #f9fafb;
                }

                .fine-amount {
                    font-weight: 700;
                    color: #dc2626;
                }

                .fine-reference {
                    font-family: 'Monaco', 'Menlo', monospace;
                    font-size: 0.875rem;
                    background: #f3f4f6;
                    padding: 4px 8px;
                    border-radius: 4px;
                }

                .breach-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 5px;
                }

                .breach-tag {
                    background: #fef3c7;
                    color: #92400e;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 500;
                }

                .risk-badge {
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .risk-high {
                    background: #fee2e2;
                    color: #dc2626;
                }

                .risk-medium {
                    background: #fef3c7;
                    color: #d97706;
                }

                .risk-low {
                    background: #d1fae5;
                    color: #065f46;
                }

                .loading-state {
                    text-align: center;
                    padding: 40px;
                    color: #6b7280;
                }

                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f4f6;
                    border-top: 4px solid #dc2626;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                }

                .error-state {
                    background: #fee2e2;
                    border: 1px solid #fecaca;
                    color: #991b1b;
                    padding: 20px;
                    border-radius: 8px;
                    text-align: center;
                }

                .trends-chart {
                    background: #f9fafb;
                    border-radius: 8px;
                    padding: 20px;
                    color: #374151;
                }

                .trend-summary {
                    margin-bottom: 25px;
                    padding: 20px;
                    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                    border-radius: 12px;
                    border: 1px solid #0ea5e9;
                }

                .trend-stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 20px;
                    margin-top: 15px;
                }

                .trend-stat {
                    text-align: center;
                    padding: 15px;
                    background: white;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                }

                .trend-value {
                    display: block;
                    font-size: 1.8rem;
                    font-weight: 700;
                    color: #1e40af;
                    margin-bottom: 5px;
                }

                .trend-label {
                    font-size: 0.875rem;
                    color: #64748b;
                    font-weight: 500;
                }

                .trend-breakdown h5 {
                    margin-bottom: 15px;
                    color: #374151;
                    font-weight: 600;
                }

                .trend-periods {
                    display: grid;
                    gap: 10px;
                }

                .trend-period {
                    display: grid;
                    grid-template-columns: 1fr auto auto;
                    gap: 15px;
                    padding: 12px 15px;
                    background: white;
                    border-radius: 6px;
                    border: 1px solid #e2e8f0;
                    align-items: center;
                }

                .period-name {
                    font-weight: 600;
                    color: #374151;
                }

                .period-count {
                    color: #6b7280;
                    font-size: 0.875rem;
                }

                .period-amount {
                    font-weight: 600;
                    color: #059669;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                @media (max-width: 768px) {
                    .stats-grid {
                        grid-template-columns: 1fr;
                    }

                    .search-filters {
                        grid-template-columns: 1fr;
                    }

                    .data-table {
                        font-size: 0.875rem;
                    }

                    .data-table th,
                    .data-table td {
                        padding: 10px 8px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="app-container">
                ${sidebar}

                <main class="main-content">
                    <header class="enforcement-header">
                        <h1>⚖️ FCA Enforcement Dashboard</h1>
                        <p class="enforcement-subtitle">Comprehensive analysis of Financial Conduct Authority enforcement actions, fines, and regulatory penalties</p>
                        <div class="status-indicator">
                            <div class="status-dot"></div>
                            <span>Enforcement service active</span>
                            <span style="margin-left: auto; font-size: 0.875rem;" id="last-update">Loading...</span>
                        </div>
                    </header>

                    <!-- Statistics Overview -->
                    <div class="stats-grid" id="stats-container">
                        <div class="loading-state">
                            <div class="loading-spinner"></div>
                            <p>Loading enforcement statistics...</p>
                        </div>
                    </div>

                    <!-- Recent Fines Section -->
                    <div class="dashboard-section">
                        <div class="section-header">
                            <h2 class="section-title">
                                <span>📋</span> Recent Enforcement Actions
                            </h2>
                            <div>
                                <button class="btn btn-secondary" onclick="refreshData()">🔄 Refresh</button>
                                <button class="btn btn-primary" onclick="exportData()">📊 Export CSV</button>
                            </div>
                        </div>

                        <div class="search-filters">
                            <div class="filter-group">
                                <label class="filter-label">Search</label>
                                <input type="text" class="filter-input" id="search-input" placeholder="Search firms, breach types, or descriptions...">
                            </div>
                            <div class="filter-group">
                                <label class="filter-label">Year</label>
                                <select class="filter-input" id="year-filter">
                                    <option value="">All Years</option>
                                    <option value="2024">2024</option>
                                    <option value="2023">2023</option>
                                    <option value="2022">2022</option>
                                    <option value="2021">2021</option>
                                    <option value="2020">2020</option>
                                    <option value="2019">2019</option>
                                    <option value="2018">2018</option>
                                    <option value="2017">2017</option>
                                    <option value="2016">2016</option>
                                    <option value="2015">2015</option>
                                    <option value="2014">2014</option>
                                    <option value="2013">2013</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label class="filter-label">Breach Category</label>
                                <select class="filter-input" id="breach-category">
                                    <option value="">All Categories</option>
                                    <option value="Anti-Money Laundering">Anti-Money Laundering</option>
                                    <option value="Market Abuse">Market Abuse</option>
                                    <option value="Customer Treatment">Customer Treatment</option>
                                    <option value="Systems and Controls">Systems and Controls</option>
                                    <option value="Prudential Requirements">Prudential Requirements</option>
                                    <option value="Conduct Risk">Conduct Risk</option>
                                    <option value="Client Money">Client Money</option>
                                    <option value="Governance">Governance</option>
                                    <option value="Reporting and Disclosure">Reporting and Disclosure</option>
                                    <option value="Financial Crime">Financial Crime</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label class="filter-label">Minimum Amount</label>
                                <input type="number" class="filter-input" id="min-amount" placeholder="£0">
                            </div>
                            <div class="filter-group">
                                <label class="filter-label">Risk Level</label>
                                <select class="filter-input" id="risk-level">
                                    <option value="">All</option>
                                    <option value="high">High Risk</option>
                                    <option value="medium">Medium Risk</option>
                                    <option value="low">Low Risk</option>
                                </select>
                            </div>
                        </div>

                        <div id="fines-container">
                            <div class="loading-state">
                                <div class="loading-spinner"></div>
                                <p>Loading recent enforcement actions...</p>
                            </div>
                        </div>
                    </div>

                    <!-- Enforcement Trends -->
                    <div class="dashboard-section">
                        <div class="section-header">
                            <h2 class="section-title">
                                <span>📈</span> Enforcement Trends
                            </h2>
                            <div>
                                <select class="filter-input" id="trends-period">
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            </div>
                        </div>

                        <div id="trends-container">
                            <div class="trends-chart">
                                <p>📊 Trends chart will load here</p>
                            </div>
                        </div>
                    </div>

                    <!-- Top Firms -->
                    <div class="dashboard-section">
                        <div class="section-header">
                            <h2 class="section-title">
                                <span>🏢</span> Top Fined Firms
                            </h2>
                        </div>

                        <div id="top-firms-container">
                            <div class="loading-state">
                                <div class="loading-spinner"></div>
                                <p>Loading top fined firms...</p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <script>
                // Enforcement Dashboard JavaScript
                class EnforcementDashboard {
                    constructor() {
                        this.init();
                    }

                    async init() {
                        console.log('🚀 Initializing enforcement dashboard...');

                        // Load initial data
                        await this.loadStats();
                        await this.loadRecentFines();
                        await this.loadTrends();
                        await this.loadTopFirms();

                        // Set up event listeners
                        this.setupEventListeners();

                        console.log('✅ Enforcement dashboard initialized');
                    }

                    async loadStats() {
                        try {
                            console.log('📊 Loading enforcement statistics...');

                            const response = await fetch('/api/enforcement/stats');
                            const data = await response.json();

                            if (data.success) {
                                this.renderStats(data.stats);
                            } else {
                                throw new Error(data.error || 'Failed to load stats');
                            }
                        } catch (error) {
                            console.error('❌ Error loading stats:', error);
                            this.renderStatsError(error.message);
                        }
                    }

                    renderStats(stats) {
                        const container = document.getElementById('stats-container');
                        const overview = stats.overview;

                        container.innerHTML = `
                            <div class="stat-card">
                                <span class="stat-icon">⚖️</span>
                                <div class="stat-value">${overview.total_fines || 0}</div>
                                <div class="stat-label">Total Enforcement Actions</div>
                                <div class="stat-change change-positive">
                                    📈 ${overview.fines_this_year || 0} this year
                                </div>
                            </div>
                            <div class="stat-card">
                                <span class="stat-icon">💰</span>
                                <div class="stat-value">${this.formatCurrency(overview.total_amount)}</div>
                                <div class="stat-label">Total Fines Issued</div>
                                <div class="stat-change">
                                    📊 Avg: ${this.formatCurrency(overview.average_amount)}
                                </div>
                            </div>
                            <div class="stat-card">
                                <span class="stat-icon">📅</span>
                                <div class="stat-value">${overview.fines_last_30_days || 0}</div>
                                <div class="stat-label">Last 30 Days</div>
                                <div class="stat-change">
                                    🔴 Largest: ${this.formatCurrency(overview.largest_fine)}
                                </div>
                            </div>
                            <div class="stat-card">
                                <span class="stat-icon">⚠️</span>
                                <div class="stat-value">${overview.systemic_risk_cases || 0}</div>
                                <div class="stat-label">Systemic Risk Cases</div>
                                <div class="stat-change">
                                    🎯 Risk Score: ${Math.round(overview.average_risk_score || 0)}/100
                                </div>
                            </div>
                        `;

                        // Update last update time
                        document.getElementById('last-update').textContent =
                            `Updated: ${new Date().toLocaleTimeString()}`;
                    }

                    renderStatsError(error) {
                        const container = document.getElementById('stats-container');
                        container.innerHTML = `
                            <div class="error-state">
                                <strong>Failed to load statistics</strong><br>
                                ${error}
                            </div>
                        `;
                    }

                    async loadRecentFines() {
                        try {
                            console.log('📋 Loading recent fines...');

                            const response = await fetch('/api/enforcement/recent?limit=20');
                            const data = await response.json();

                            if (data.success) {
                                this.renderFines(data.fines);
                            } else {
                                throw new Error(data.error || 'Failed to load fines');
                            }
                        } catch (error) {
                            console.error('❌ Error loading fines:', error);
                            this.renderFinesError(error.message);
                        }
                    }

                    renderFines(fines) {
                        const container = document.getElementById('fines-container');

                        if (!fines || fines.length === 0) {
                            container.innerHTML = '<p class="loading-state">No enforcement actions found.</p>';
                            return;
                        }

                        const tableHTML = `
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Reference</th>
                                        <th>Date</th>
                                        <th>Firm/Individual</th>
                                        <th>Amount</th>
                                        <th>Breach Categories</th>
                                        <th>Risk</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${fines.map(fine => `
                                        <tr>
                                            <td>
                                                <span class="fine-reference">${fine.fine_reference || 'N/A'}</span>
                                            </td>
                                            <td>${this.formatDate(fine.date_issued)}</td>
                                            <td>
                                                <strong>${fine.firm_individual || 'Unknown'}</strong>
                                                ${fine.ai_summary ? `<br><small style="color: #6b7280;">${fine.ai_summary.substring(0, 100)}...</small>` : ''}
                                            </td>
                                            <td>
                                                <span class="fine-amount">${this.formatCurrency(fine.amount)}</span>
                                            </td>
                                            <td>
                                                <div class="breach-tags">
                                                    ${(fine.breach_categories || []).map(category =>
                                                        `<span class="breach-tag">${category}</span>`
                                                    ).join('')}
                                                </div>
                                            </td>
                                            <td>
                                                ${this.renderRiskBadge(fine.risk_score)}
                                            </td>
                                            <td>
                                                ${fine.final_notice_url ?
                                                    `<a href="${fine.final_notice_url}" target="_blank" class="btn btn-secondary" style="padding: 5px 10px; font-size: 0.75rem;">View Notice</a>` :
                                                    'N/A'
                                                }
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        `;

                        container.innerHTML = tableHTML;
                    }

                    renderFinesError(error) {
                        const container = document.getElementById('fines-container');
                        container.innerHTML = `
                            <div class="error-state">
                                <strong>Failed to load enforcement actions</strong><br>
                                ${error}
                            </div>
                        `;
                    }

                    async loadTrends() {
                        try {
                            console.log('📈 Loading trends...');

                            const period = document.getElementById('trends-period').value || 'monthly';
                            const response = await fetch(`/api/enforcement/trends?period=${period}&limit=12`);
                            const data = await response.json();

                            if (data.success) {
                                this.renderTrends(data.trends);
                            } else {
                                throw new Error(data.error || 'Failed to load trends');
                            }
                        } catch (error) {
                            console.error('❌ Error loading trends:', error);
                            this.renderTrendsError(error.message);
                        }
                    }

                    renderTrends(trends) {
                        const container = document.getElementById('trends-container');

                        if (!trends || trends.length === 0) {
                            container.innerHTML = '<div class="trends-chart"><p>📊 No trend data available</p></div>';
                            return;
                        }

                        // Simple table view for trends (could be enhanced with charts later)
                        const tableHTML = `
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Period</th>
                                        <th>Fine Count</th>
                                        <th>Total Amount</th>
                                        <th>Average Amount</th>
                                        <th>Average Risk Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${trends.map(trend => `
                                        <tr>
                                            <td><strong>${trend.period}</strong></td>
                                            <td>${trend.fine_count || 0}</td>
                                            <td class="fine-amount">${this.formatCurrency(trend.total_amount)}</td>
                                            <td>${this.formatCurrency(trend.average_amount)}</td>
                                            <td>${Math.round(trend.average_risk_score || 0)}/100</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        `;

                        container.innerHTML = tableHTML;
                    }

                    renderTrendsError(error) {
                        const container = document.getElementById('trends-container');
                        container.innerHTML = `
                            <div class="error-state">
                                <strong>Failed to load trends</strong><br>
                                ${error}
                            </div>
                        `;
                    }

                    async loadTopFirms() {
                        try {
                            console.log('🏢 Loading top firms...');

                            const response = await fetch('/api/enforcement/top-firms?limit=10');
                            const data = await response.json();

                            if (data.success) {
                                this.renderTopFirms(data.firms);
                            } else {
                                throw new Error(data.error || 'Failed to load top firms');
                            }
                        } catch (error) {
                            console.error('❌ Error loading top firms:', error);
                            this.renderTopFirmsError(error.message);
                        }
                    }

                    renderTopFirms(firms) {
                        const container = document.getElementById('top-firms-container');

                        if (!firms || firms.length === 0) {
                            container.innerHTML = '<p class="loading-state">No firm data available.</p>';
                            return;
                        }

                        const tableHTML = `
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Firm Name</th>
                                        <th>Total Fines</th>
                                        <th>Fine Count</th>
                                        <th>First Fine</th>
                                        <th>Latest Fine</th>
                                        <th>Repeat Offender</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${firms.map((firm, index) => `
                                        <tr>
                                            <td><strong>${index + 1}</strong></td>
                                            <td>${firm.firm_name || 'Unknown'}</td>
                                            <td class="fine-amount">${this.formatCurrency(firm.total_fines)}</td>
                                            <td>${firm.fine_count || 0}</td>
                                            <td>${this.formatDate(firm.first_fine_date)}</td>
                                            <td>${this.formatDate(firm.latest_fine_date)}</td>
                                            <td>${firm.is_repeat_offender ? '⚠️ Yes' : '✅ No'}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        `;

                        container.innerHTML = tableHTML;
                    }

                    renderTopFirmsError(error) {
                        const container = document.getElementById('top-firms-container');
                        container.innerHTML = `
                            <div class="error-state">
                                <strong>Failed to load top firms</strong><br>
                                ${error}
                            </div>
                        `;
                    }

                    renderRiskBadge(riskScore) {
                        if (!riskScore) return '<span class="risk-badge">N/A</span>';

                        if (riskScore >= 70) {
                            return `<span class="risk-badge risk-high">High (${riskScore})</span>`;
                        } else if (riskScore >= 40) {
                            return `<span class="risk-badge risk-medium">Medium (${riskScore})</span>`;
                        } else {
                            return `<span class="risk-badge risk-low">Low (${riskScore})</span>`;
                        }
                    }

                    formatCurrency(amount) {
                        if (!amount) return 'N/A';
                        return new Intl.NumberFormat('en-GB', {
                            style: 'currency',
                            currency: 'GBP',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }).format(amount);
                    }

                    formatDate(dateString) {
                        if (!dateString) return 'N/A';
                        const date = new Date(dateString);
                        return date.toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                        });
                    }

                    setupEventListeners() {
                        // Search functionality
                        const searchInput = document.getElementById('search-input');
                        const yearFilter = document.getElementById('year-filter');
                        const breachCategory = document.getElementById('breach-category');
                        const minAmountInput = document.getElementById('min-amount');
                        const riskLevelSelect = document.getElementById('risk-level');
                        const trendsSelect = document.getElementById('trends-period');

                        // Debounced search
                        let searchTimeout;
                        [searchInput, yearFilter, breachCategory, minAmountInput, riskLevelSelect].forEach(input => {
                            input.addEventListener('input', () => {
                                clearTimeout(searchTimeout);
                                searchTimeout = setTimeout(() => this.performSearch(), 500);
                            });
                            input.addEventListener('change', () => {
                                clearTimeout(searchTimeout);
                                searchTimeout = setTimeout(() => this.performSearch(), 500);
                            });
                        });

                        // Trends period change
                        trendsSelect.addEventListener('change', () => this.loadTrends());
                    }

                    async performSearch() {
                        const query = document.getElementById('search-input').value;
                        const year = document.getElementById('year-filter').value;
                        const breachCategory = document.getElementById('breach-category').value;
                        const minAmount = document.getElementById('min-amount').value;
                        const riskLevel = document.getElementById('risk-level').value;

                        const params = new URLSearchParams();
                        if (query) params.append('q', query);
                        if (year) {
                            params.append('start_date', year + '-01-01');
                            params.append('end_date', year + '-12-31');
                        }
                        if (breachCategory) params.append('breach_type', breachCategory);
                        if (minAmount) params.append('min_amount', minAmount);
                        if (riskLevel) params.append('risk_level', riskLevel);
                        params.append('limit', '50');

                        try {
                            const response = await fetch(`/api/enforcement/search?${params}`);
                            const data = await response.json();

                            if (data.success) {
                                this.renderFines(data.results.fines);
                            } else {
                                throw new Error(data.error || 'Search failed');
                            }
                        } catch (error) {
                            console.error('❌ Search error:', error);
                            this.renderFinesError(error.message);
                        }
                    }
                }

                // Global functions for buttons
                window.refreshData = async function() {
                    console.log('🔄 Refreshing enforcement data...');

                    try {
                        const response = await fetch('/api/enforcement/update', { method: 'POST' });
                        const data = await response.json();

                        if (data.success) {
                            showMessage('✅ Data refreshed successfully', 'success');
                            // Reload the dashboard
                            window.location.reload();
                        } else {
                            throw new Error(data.error || 'Refresh failed');
                        }
                    } catch (error) {
                        console.error('❌ Refresh error:', error);
                        showMessage(`❌ Refresh failed: ${error.message}`, 'error');
                    }
                };

                window.exportData = function() {
                    const searchParams = new URLSearchParams();
                    const query = document.getElementById('search-input').value;
                    const year = document.getElementById('year-filter').value;
                    const breachCategory = document.getElementById('breach-category').value;
                    const minAmount = document.getElementById('min-amount').value;
                    const riskLevel = document.getElementById('risk-level').value;

                    if (query) searchParams.append('q', query);
                    if (year) {
                        searchParams.append('start_date', year + '-01-01');
                        searchParams.append('end_date', year + '-12-31');
                    }
                    if (breachCategory) searchParams.append('breach_type', breachCategory);
                    if (minAmount) searchParams.append('min_amount', minAmount);
                    if (riskLevel) searchParams.append('risk_level', riskLevel);

                    const exportUrl = `/api/enforcement/export?${searchParams}`;
                    window.open(exportUrl, '_blank');
                };

                function showMessage(message, type) {
                    const messageEl = document.createElement('div');
                    messageEl.style.cssText = `
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: ${type === 'success' ? '#10b981' : '#ef4444'};
                        color: white;
                        padding: 15px 20px;
                        border-radius: 8px;
                        z-index: 10001;
                        animation: slideIn 0.3s ease;
                    `;
                    messageEl.textContent = message;
                    document.body.appendChild(messageEl);

                    setTimeout(() => messageEl.remove(), 3000);
                }

                // Initialize dashboard when page loads
                document.addEventListener('DOMContentLoaded', () => {
                    window.enforcementDashboard = new EnforcementDashboard();
                });
            </script>

            ${getCommonClientScripts()}
        </body>
        </html>`;

        res.send(html);

    } catch (error) {
        console.error('❌ Error rendering enforcement page:', error);
        res.status(500).send(`
            <html>
                <head>
                    <title>Error - Enforcement Dashboard</title>
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
                        <h1>❌ Error Loading Enforcement Dashboard</h1>
                        <p>${error.message}</p>
                        <a href="/">← Back to Home</a>
                    </div>
                </body>
            </html>
        `);
    }
};

module.exports = enforcementPage;