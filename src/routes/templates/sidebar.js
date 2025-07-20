// Fixed Sidebar Template - Phase 1
// File: src/routes/templates/sidebar.js

const dbService = require('../../services/dbService');

async function getSidebar(currentPage = '') {
    try {
        console.log('🔧 Generating enhanced sidebar...');
        
        // Get recent update counts for live counters
        const recentCounts = await getRecentUpdateCounts();
        
        // Get AI insights for sidebar highlights
        const aiInsights = await getAIInsightsForSidebar();
        
        // Get saved searches and pinned items (Phase 1.3 preparation)
        const userPreferences = await getUserPreferences();
        
        return `
        <div class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <h2>🤖 AI Regulatory Intelligence</h2>
                <div class="sidebar-status">
                    <span class="status-indicator online" title="AI Service Online"></span>
                    <span class="last-update">Updated ${formatRelativeTime(new Date())}</span>
                </div>
            </div>
            
            <!-- Live Feed Counters -->
            <div class="live-counters">
                <h3>📊 Live Feed</h3>
                <div class="counter-grid">
                    <div class="counter-item ${currentPage === 'dashboard' ? 'active' : ''}">
                        <a href="/dashboard">
                            <div class="counter-number" id="total-updates">${recentCounts.total}</div>
                            <div class="counter-label">Total Updates</div>
                        </a>
                    </div>
                    <div class="counter-item">
                        <div class="counter-number high-impact" id="high-impact-count">${recentCounts.highImpact}</div>
                        <div class="counter-label">High Impact</div>
                    </div>
                    <div class="counter-item">
                        <div class="counter-number today" id="today-count">${recentCounts.today}</div>
                        <div class="counter-label">Today</div>
                    </div>
                    <div class="counter-item">
                        <div class="counter-number this-week" id="week-count">${recentCounts.thisWeek}</div>
                        <div class="counter-label">This Week</div>
                    </div>
                </div>
            </div>
            
            <!-- AI Intelligence Highlights -->
            <div class="ai-highlights">
                <h3>🧠 AI Insights</h3>
                <div class="insights-container">
                    ${generateAIHighlights(aiInsights)}
                </div>
                <div class="insights-actions">
                    <a href="/ai/weekly-roundup" class="insight-link">📋 Weekly Roundup</a>
                    <a href="/ai/early-warnings" class="insight-link">⚠️ Early Warnings</a>
                </div>
            </div>
            
            <!-- Navigation Menu -->
            <nav class="sidebar-nav">
                <h3>📑 Navigation</h3>
                <ul class="nav-list">
                    <li class="nav-item ${currentPage === '' || currentPage === 'home' ? 'active' : ''}">
                        <a href="/" class="nav-link">
                            <span class="nav-icon">🏠</span>
                            <span class="nav-text">Home</span>
                        </a>
                    </li>
                    <li class="nav-item ${currentPage === 'dashboard' ? 'active' : ''}">
                        <a href="/dashboard" class="nav-link">
                            <span class="nav-icon">📊</span>
                            <span class="nav-text">Dashboard</span>
                            <span class="nav-badge">${recentCounts.unread}</span>
                        </a>
                    </li>
                    <li class="nav-item ${currentPage === 'analytics' ? 'active' : ''}">
                        <a href="/analytics" class="nav-link">
                            <span class="nav-icon">📈</span>
                            <span class="nav-text">Analytics</span>
                        </a>
                    </li>
                    <li class="nav-item ${currentPage === 'ai-intelligence' ? 'active' : ''}">
                        <a href="/ai-intelligence" class="nav-link">
                            <span class="nav-icon">🤖</span>
                            <span class="nav-text">AI Intelligence</span>
                            <span class="nav-badge new">NEW</span>
                        </a>
                    </li>
                </ul>
            </nav>
            
            <!-- Quick Filters -->
            <div class="quick-filters">
                <h3>⚡ Quick Filters</h3>
                <div class="filter-buttons">
                    <button onclick="filterByCategory('all')" class="filter-btn active" data-filter="all">
                        All Updates
                    </button>
                    <button onclick="filterByCategory('high-impact')" class="filter-btn" data-filter="high-impact">
                        High Impact
                    </button>
                    <button onclick="filterByCategory('today')" class="filter-btn" data-filter="today">
                        Today
                    </button>
                    <button onclick="filterByCategory('this-week')" class="filter-btn" data-filter="this-week">
                        This Week
                    </button>
                </div>
            </div>
            
            <!-- Authority Filters -->
            <div class="authority-filters">
                <h3>🏛️ Authorities</h3>
                <div class="authority-list">
                    ${generateAuthorityFilters(recentCounts.authorities)}
                </div>
            </div>
            
            <!-- Sector Filters -->
            <div class="sector-filters">
                <h3>🏢 Sectors</h3>
                <div class="sector-list">
                    ${generateSectorFilters(recentCounts.sectors)}
                </div>
            </div>
            
            <!-- Saved Items (Phase 1.3 Preview) -->
            <div class="saved-items">
                <h3>⭐ Saved Items</h3>
                <div class="saved-list">
                    ${generateSavedItems(userPreferences.savedItems)}
                </div>
                <button onclick="showSaveDialog()" class="btn-secondary btn-sm">
                    + Save Current View
                </button>
            </div>
            
            <!-- System Status -->
            <div class="system-status">
                <h4>System Status</h4>
                <div class="status-list">
                    <div class="status-item">
                        <span class="status-dot online"></span>
                        <span>RSS Feeds</span>
                        <span class="status-count">${recentCounts.activeSources}/12</span>
                    </div>
                    <div class="status-item">
                        <span class="status-dot online"></span>
                        <span>AI Analysis</span>
                        <span class="status-count">Active</span>
                    </div>
                    <div class="status-item">
                        <span class="status-dot ${recentCounts.dbStatus}"></span>
                        <span>Database</span>
                        <span class="status-count">${recentCounts.dbStatus === 'online' ? 'Connected' : 'JSON Mode'}</span>
                    </div>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="sidebar-footer">
                <div class="version-info">
                    <small>AI Intelligence Platform v2.0</small>
                </div>
                <div class="last-refresh">
                    <small>Last refresh: <span id="last-refresh-time">${formatTime(new Date())}</span></small>
                    <button onclick="refreshData()" class="refresh-btn" title="Refresh Data">🔄</button>
                </div>
            </div>
        </div>
        
        <!-- Auto-refresh script -->
        <script>
            // Auto-refresh counters every 30 seconds
            setInterval(updateLiveCounters, 30000);
            
            // Update last refresh time every minute
            setInterval(updateRefreshTime, 60000);
        </script>`;
        
    } catch (error) {
        console.error('❌ Error generating sidebar:', error);
        return generateFallbackSidebar(currentPage);
    }
}

async function getRecentUpdateCounts() {
    try {
        const counts = await dbService.getUpdateCounts();
        return {
            total: counts.total || 0,
            highImpact: counts.highImpact || 0,
            today: counts.today || 0,
            thisWeek: counts.thisWeek || 0,
            unread: counts.unread || 0,
            authorities: counts.authorities || {},
            sectors: counts.sectors || {},
            activeSources: counts.activeSources || 0,
            dbStatus: counts.dbStatus || 'online'
        };
    } catch (error) {
        console.error('Error getting update counts:', error);
        return {
            total: 0, highImpact: 0, today: 0, thisWeek: 0, unread: 0,
            authorities: {}, sectors: {}, activeSources: 0, dbStatus: 'offline'
        };
    }
}

async function getAIInsightsForSidebar() {
    try {
        const insights = await dbService.getRecentAIInsights(3);
        return insights || [];
    } catch (error) {
        console.error('Error getting AI insights:', error);
        return [];
    }
}

async function getUserPreferences() {
    try {
        // Phase 1.3 - Will implement user-specific preferences
        return {
            savedItems: [],
            savedSearches: [],
            pinnedItems: []
        };
    } catch (error) {
        console.error('Error getting user preferences:', error);
        return { savedItems: [], savedSearches: [], pinnedItems: [] };
    }
}

function generateAIHighlights(insights) {
    if (!insights || insights.length === 0) {
        return `
            <div class="insight-item">
                <div class="insight-icon">🤖</div>
                <div class="insight-content">
                    <div class="insight-title">AI Analysis Ready</div>
                    <div class="insight-summary">Enhanced AI insights will appear here</div>
                </div>
            </div>`;
    }
    
    return insights.map(insight => `
        <div class="insight-item ${insight.urgency_level}">
            <div class="insight-icon">${getInsightIcon(insight.insight_type)}</div>
            <div class="insight-content">
                <div class="insight-title">${insight.title}</div>
                <div class="insight-summary">${insight.summary.substring(0, 100)}...</div>
                <div class="insight-meta">
                    <span class="urgency-badge ${insight.urgency_level}">${insight.urgency_level}</span>
                    <span class="impact-score">Impact: ${insight.impact_score}/10</span>
                </div>
            </div>
        </div>
    `).join('');
}

function generateAuthorityFilters(authorities) {
    const authorityList = Object.entries(authorities)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8)
        .map(([authority, count]) => `
            <div class="filter-item">
                <button onclick="filterByAuthority('${authority}')" class="authority-btn" data-authority="${authority}">
                    <span class="authority-name">${authority}</span>
                    <span class="authority-count">${count}</span>
                </button>
            </div>
        `).join('');
        
    return authorityList || '<div class="no-data">No data available</div>';
}

function generateSectorFilters(sectors) {
    const sectorList = Object.entries(sectors)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 6)
        .map(([sector, count]) => `
            <div class="filter-item">
                <button onclick="filterBySector('${sector}')" class="sector-btn" data-sector="${sector}">
                    <span class="sector-name">${sector}</span>
                    <span class="sector-count">${count}</span>
                </button>
            </div>
        `).join('');
        
    return sectorList || '<div class="no-data">No data available</div>';
}

function generateSavedItems(savedItems) {
    if (!savedItems || savedItems.length === 0) {
        return '<div class="no-saved-items">No saved items yet</div>';
    }
    
    return savedItems.map(item => `
        <div class="saved-item">
            <span class="saved-icon">⭐</span>
            <span class="saved-title">${item.title}</span>
            <button onclick="removeSavedItem('${item.id}')" class="remove-btn">×</button>
        </div>
    `).join('');
}

function getInsightIcon(insightType) {
    const icons = {
        'early_warning': '⚠️',
        'deadline': '📅',
        'pattern': '📊',
        'briefing': '📋',
        'trend': '📈',
        'enforcement': '🚨'
    };
    return icons[insightType] || '💡';
}

function generateFallbackSidebar(currentPage) {
    return `
        <div class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <h2>🤖 AI Regulatory Intelligence</h2>
                <div class="sidebar-status">
                    <span class="status-indicator offline" title="Loading..."></span>
                    <span class="last-update">Loading...</span>
                </div>
            </div>
            
            <div class="loading-placeholder">
                <div class="spinner"></div>
                <p>Loading intelligence data...</p>
            </div>
            
            <nav class="sidebar-nav">
                <ul class="nav-list">
                    <li class="nav-item ${currentPage === '' || currentPage === 'home' ? 'active' : ''}">
                        <a href="/" class="nav-link">
                            <span class="nav-icon">🏠</span>
                            <span class="nav-text">Home</span>
                        </a>
                    </li>
                    <li class="nav-item ${currentPage === 'dashboard' ? 'active' : ''}">
                        <a href="/dashboard" class="nav-link">
                            <span class="nav-icon">📊</span>
                            <span class="nav-text">Dashboard</span>
                        </a>
                    </li>
                    <li class="nav-item ${currentPage === 'analytics' ? 'active' : ''}">
                        <a href="/analytics" class="nav-link">
                            <span class="nav-icon">📈</span>
                            <span class="nav-text">Analytics</span>
                        </a>
                    </li>
                </ul>
            </nav>
        </div>`;
}

// Utility functions for time formatting
function formatRelativeTime(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

function formatTime(date) {
    return date.toLocaleTimeString('en-UK', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

module.exports = {
    getSidebar
};