// ==========================================
// 🧩 src/components/Header.js - Header Component
/// ==========================================

function render(options = {}) {
    const {
        title = 'Regulatory Horizon Scanner',
        subtitle = 'UK Financial Regulatory Updates',
        showStats = false,
        showStatus = false,
        totalUpdates = 0,
        sectors = 0
    } = options;
    
    return `
        <div class="header">
            <div class="header-content">
                <h1 class="title">${title}</h1>
                <p class="subtitle">${subtitle}</p>

                ${showStatus ? `
                <div class="system-status">
                    <div class="status-indicator" id="systemIndicator"></div>
                    <span class="status-text">System Operational</span>
                </div>
                ` : ''}

                ${showStats ? `
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-number">${totalUpdates}</div>
                        <div class="stat-label">Total Updates</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">${sectors}</div>
                        <div class="stat-label">Sectors</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number" id="recentCount">0</div>
                        <div class="stat-label">Recent (24h)</div>
                    </div>
                </div>
                ` : ''}

                <div class="header-actions">
                    <a href="/" class="button button-secondary">🏠 Home</a>
                    <a href="/dashboard" class="button button-primary">📊 Dashboard</a>
                    <a href="/enforcement" class="button button-secondary">⚖️ Enforcement</a>
                    <a href="/debug/test" class="button button-secondary">🔧 System Test</a>
                </div>
            </div>
        </div>
    `;
}

module.exports = { render };
