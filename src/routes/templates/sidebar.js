// src/routes/templates/sidebar.js
// Enhanced sidebar with new filtering capabilities

const getSidebar = (pageType = 'home', counts = {}) => {
    const {
        totalUpdates = 0,
        urgentCount = 0,
        moderateCount = 0,
        informationalCount = 0,
        fcaCount = 0,
        boeCount = 0,
        praCount = 0,
        tprCount = 0,
        sfoCount = 0,
        fatfCount = 0,
        highRelevanceCount = 0,
        mediumRelevanceCount = 0,
        lowRelevanceCount = 0,
        pinnedCount = 0,
        savedSearchCount = 0,
        alertCount = 0,
        // NEW: Category counts
        consultationCount = 0,
        guidanceCount = 0,
        enforcementCount = 0,
        speechCount = 0,
        newsCount = 0,
        policyCount = 0,
        // NEW: Content type counts
        finalRuleCount = 0,
        proposalCount = 0,
        noticeCount = 0,
        reportCount = 0,
        // NEW: Source type counts
        rssCount = 0,
        scrapedCount = 0,
        directCount = 0
    } = counts;

    return `
        <div class="enterprise-sidebar">
            <div class="logo-section">
                <div class="logo-title">Horizon Scanner</div>
                <div class="logo-subtitle">${pageType === 'analytics' ? 'Predictive Analytics' : pageType === 'dashboard' ? 'Regulatory News Feed' : 'Regulatory Intelligence'}</div>
            </div>
            
            <!-- Firm Profile Section -->
            <div class="firm-profile-section" id="firmProfileSection">
                <button onclick="showFirmProfileSetup()" class="setup-profile-btn" id="profileBtn">
                    Setup Firm Profile
                </button>
                <div class="profile-info" id="profileInfo">
                    Configure your firm's sectors for personalized relevance
                </div>
                <button onclick="clearFirmProfile()" class="clear-profile-btn" id="clearProfileBtn" style="display: none;">
                    Clear Profile
                </button>
            </div>

            <!-- Quick Actions Section -->
            <div class="sidebar-section">
                <div class="section-title">
                    ⚡ Quick Actions
                    <span class="info-icon" data-tooltip="Essential tools for regulatory monitoring and workspace management">i</span>
                </div>
                <div class="sidebar-item action-btn working" onclick="exportData()">
                    <span>📊 Export Data</span>
                </div>
                <div class="sidebar-item action-btn working" onclick="createAlert()">
                    <span>🔔 Create Alert</span>
                </div>
                <div class="sidebar-item action-btn working" onclick="shareSystem()">
                    <span>📤 Share System</span>
                </div>
                <div class="sidebar-item" onclick="refreshIntelligence()">
                    <span>🔄 Refresh Data</span>
                </div>
            </div>

            <!-- NEW: Filter by Category Section -->
            <div class="sidebar-section">
                <div class="section-title">
                    📋 Filter by Category
                    <span class="info-icon" data-tooltip="Filter by regulatory document category and type">i</span>
                </div>
                <div class="filter-section">
                    <div class="filter-options">
                        <div class="filter-option" onclick="filterByCategory('consultation')">
                            <span>
                                <span class="content-type-badge content-type-consultation">📋 Consultations</span>
                            </span>
                            <div class="count-badge moderate">${consultationCount}</div>
                        </div>
                        <div class="filter-option" onclick="filterByCategory('guidance')">
                            <span>
                                <span class="content-type-badge content-type-guidance">📖 Guidance</span>
                            </span>
                            <div class="count-badge">${guidanceCount}</div>
                        </div>
                        <div class="filter-option" onclick="filterByCategory('enforcement')">
                            <span>
                                <span class="content-type-badge content-type-enforcement">⚖️ Enforcement</span>
                            </span>
                            <div class="count-badge urgent">${enforcementCount}</div>
                        </div>
                        <div class="filter-option" onclick="filterByCategory('speech')">
                            <span>
                                <span class="content-type-badge content-type-speech">🎤 Speeches</span>
                            </span>
                            <div class="count-badge">${speechCount}</div>
                        </div>
                        <div class="filter-option" onclick="filterByCategory('news')">
                            <span>
                                <span class="content-type-badge content-type-news">📰 News</span>
                            </span>
                            <div class="count-badge">${newsCount}</div>
                        </div>
                        <div class="filter-option" onclick="filterByCategory('policy')">
                            <span>
                                <span class="content-type-badge content-type-policy">📜 Policy</span>
                            </span>
                            <div class="count-badge">${policyCount}</div>
                        </div>
                    </div>
                    <div class="filter-actions">
                        <a href="#" class="filter-action" onclick="selectAllCategories()">All</a>
                        <span>•</span>
                        <a href="#" class="filter-action" onclick="clearCategoryFilters()">None</a>
                    </div>
                </div>
            </div>

            <!-- NEW: Filter by Content Type Section -->
            <div class="sidebar-section">
                <div class="section-title">
                    🏷️ Filter by Content Type
                    <span class="info-icon" data-tooltip="Filter by specific document and content types">i</span>
                </div>
                <div class="filter-section">
                    <div class="filter-options">
                        <div class="filter-option" onclick="filterByContentType('final-rule')">
                            <span>
                                <span class="priority-badge priority-high">🎯</span>
                                Final Rules
                            </span>
                            <div class="count-badge urgent">${finalRuleCount}</div>
                        </div>
                        <div class="filter-option" onclick="filterByContentType('proposal')">
                            <span>
                                <span class="priority-badge priority-medium">💭</span>
                                Proposals
                            </span>
                            <div class="count-badge moderate">${proposalCount}</div>
                        </div>
                        <div class="filter-option" onclick="filterByContentType('notice')">
                            <span>
                                <span class="priority-badge priority-medium">📢</span>
                                Notices
                            </span>
                            <div class="count-badge moderate">${noticeCount}</div>
                        </div>
                        <div class="filter-option" onclick="filterByContentType('report')">
                            <span>
                                <span class="priority-badge priority-background">📊</span>
                                Reports
                            </span>
                            <div class="count-badge">${reportCount}</div>
                        </div>
                        <div class="filter-option" onclick="filterByContentType('fine')">
                            <span>
                                <span class="priority-badge priority-high">💰</span>
                                Fines & Penalties
                            </span>
                            <div class="count-badge urgent">${enforcementCount}</div>
                        </div>
                    </div>
                    <div class="filter-actions">
                        <a href="#" class="filter-action" onclick="selectAllContentTypes()">All</a>
                        <span>•</span>
                        <a href="#" class="filter-action" onclick="clearContentTypeFilters()">None</a>
                    </div>
                </div>
            </div>

            <!-- NEW: Filter by Source Type Section -->
            <div class="sidebar-section">
                <div class="section-title">
                    📡 Filter by Source Type
                    <span class="info-icon" data-tooltip="Filter by how the content was obtained">i</span>
                </div>
                <div class="filter-section">
                    <div class="filter-options">
                        <div class="filter-option" onclick="filterBySourceType('rss')">
                            <span>
                                <span style="color: #10b981;">📡</span>
                                RSS Feeds
                            </span>
                            <div class="count-badge">${rssCount}</div>
                        </div>
                        <div class="filter-option" onclick="filterBySourceType('scraped')">
                            <span>
                                <span style="color: #f59e0b;">🕷️</span>
                                Web Scraped
                            </span>
                            <div class="count-badge">${scrapedCount}</div>
                        </div>
                        <div class="filter-option" onclick="filterBySourceType('direct')">
                            <span>
                                <span style="color: #3b82f6;">🔗</span>
                                Direct Links
                            </span>
                            <div class="count-badge">${directCount}</div>
                        </div>
                    </div>
                    <div class="filter-actions">
                        <a href="#" class="filter-action" onclick="selectAllSourceTypes()">All</a>
                        <span>•</span>
                        <a href="#" class="filter-action" onclick="clearSourceTypeFilters()">None</a>
                    </div>
                </div>
            </div>

            <!-- Analytics Preview Section -->
            <div class="analytics-preview" id="analyticsPreview" style="display: none;">
                <div class="analytics-preview-title">
                    🔮 Predictive Insights
                </div>
                <div class="analytics-metrics">
                    <div class="analytics-metric">
                        <div class="analytics-metric-value" id="velocityPreview">--</div>
                        <div class="analytics-metric-label">Updates/Week</div>
                    </div>
                    <div class="analytics-metric">
                        <div class="analytics-metric-value" id="hotSectorsPreview">--</div>
                        <div class="analytics-metric-label">Hot Sectors</div>
                    </div>
                    <div class="analytics-metric">
                        <div class="analytics-metric-value" id="predictionsPreview">--</div>
                        <div class="analytics-metric-label">Predictions</div>
                    </div>
                    <div class="analytics-metric">
                        <div class="analytics-metric-value" id="riskScorePreview">--</div>
                        <div class="analytics-metric-label">Avg Risk</div>
                    </div>
                </div>
                <a href="/analytics" class="analytics-preview-link">
                    View Full Analytics Dashboard →
                </a>
            </div>
            
            <!-- Live Subscriptions -->
            <div class="sidebar-section">
                <div class="section-title">
                    🔔 Live Subscriptions
                    <span class="info-icon" data-tooltip="Real-time monitoring status of regulatory authorities">i</span>
                </div>
                <div class="sidebar-item active">
                    <span>FCA Alerts</span>
                    <div class="status-indicator live" id="fcaStatus"></div>
                </div>
                <div class="sidebar-item">
                    <span>BoE Updates</span>
                    <div class="status-indicator live" id="boeStatus"></div>
                </div>
                <div class="sidebar-item">
                    <span>PRA Notices</span>
                    <div class="status-indicator warning" id="praStatus"></div>
                </div>
                <div class="sidebar-item">
                    <span>TPR News</span>
                    <div class="status-indicator offline" id="tprStatus"></div>
                </div>
            </div>
            
            <div class="sidebar-section">
                <div class="section-title">
                    🎯 Smart Filters
                    <span class="info-icon" data-tooltip="AI-powered relevance filtering based on your firm profile">i</span>
                </div>
                <div class="sidebar-item" onclick="filterByRelevance('high')">
                    <span>High Relevance</span>
                    <div class="count-badge urgent" id="highRelevanceCount">${highRelevanceCount}</div>
                </div>
                <div class="sidebar-item" onclick="filterByRelevance('medium')">
                    <span>Medium Relevance</span>
                    <div class="count-badge moderate" id="mediumRelevanceCount">${mediumRelevanceCount}</div>
                </div>
                <div class="sidebar-item" onclick="filterByRelevance('low')">
                    <span>Background Intel</span>
                    <div class="count-badge" id="lowRelevanceCount">${lowRelevanceCount}</div>
                </div>
            </div>
            
            <!-- Enhanced Workspace Section -->
            <div class="sidebar-section">
                <div class="section-title">
                    🔍 Workspace
                    <span class="info-icon" data-tooltip="Save items, searches, and create custom alerts">i</span>
                </div>
                <div class="sidebar-item" onclick="showPinnedItems()">
                    <span>Pinned Items</span>
                    <div class="count-badge" id="pinnedCount">${pinnedCount}</div>
                </div>
                <div class="sidebar-item" onclick="showSavedSearches()">
                    <span>Saved Searches</span>
                    <div class="count-badge" id="savedSearchCount">${savedSearchCount}</div>
                </div>
                <div class="sidebar-item" onclick="showCustomAlerts()">
                    <span>Custom Alerts</span>
                    <div class="count-badge" id="alertCount">${alertCount}</div>
                </div>
            </div>

            <!-- Authority Filters Section -->
            <div class="sidebar-section">
                <div class="section-title">
                    🏛️ Filter by Authority
                    <span class="info-icon" data-tooltip="Filter updates by regulatory authority">i</span>
                </div>
                <div class="sidebar-item" onclick="filterByAuthority('FCA')">
                    <span>FCA</span>
                    <div class="count-badge" id="fcaCount">${fcaCount}</div>
                </div>
                <div class="sidebar-item" onclick="filterByAuthority('BoE')">
                    <span>Bank of England</span>
                    <div class="count-badge" id="boeCount">${boeCount}</div>
                </div>
                <div class="sidebar-item" onclick="filterByAuthority('PRA')">
                    <span>PRA</span>
                    <div class="count-badge" id="praCount">${praCount}</div>
                </div>
                <div class="sidebar-item" onclick="filterByAuthority('TPR')">
                    <span>TPR</span>
                    <div class="count-badge" id="tprCount">${tprCount}</div>
                </div>
                <div class="sidebar-item" onclick="filterByAuthority('SFO')">
                    <span>SFO</span>
                    <div class="count-badge" id="sfoCount">${sfoCount}</div>
                </div>
                <div class="sidebar-item" onclick="filterByAuthority('FATF')">
                    <span>FATF</span>
                    <div class="count-badge" id="fatfCount">${fatfCount}</div>
                </div>
                <div class="sidebar-item" onclick="clearFilters()">
                    <span>🔄 Clear Filters</span>
                </div>
            </div>

            <!-- Working Navigation Section -->
            <div class="sidebar-section">
                <div class="section-title">
                    📊 Navigation
                    <span class="info-icon" data-tooltip="Access different views and system diagnostics">i</span>
                </div>
                <div class="sidebar-item ${pageType === 'analytics' ? 'active' : ''}">
                    <a href="/analytics">Predictive Dashboard</a>
                    <div class="count-badge analytics" id="analyticsAvailable">NEW</div>
                </div>
                <div class="sidebar-item ${pageType === 'dashboard' ? 'active' : ''}">
                    <a href="/dashboard">Reg News Feed</a>
                </div>
                <div class="sidebar-item ${pageType === 'test' ? 'active' : ''}">
                    <a href="/test">System Diagnostics</a>
                </div>
                <div class="sidebar-item ${pageType === 'home' ? 'active' : ''}">
                    <a href="/">Intelligence Hub</a>
                </div>
            </div>
            
            <div class="sidebar-section">
                <div class="section-title">
                    📈 Live Feed Status
                    <span class="info-icon" data-tooltip="Current regulatory update counts by impact level">i</span>
                </div>
                <div class="sidebar-item">
                    <span>Critical Updates</span>
                    <div class="count-badge urgent" id="criticalCount">${urgentCount}</div>
                </div>
                <div class="sidebar-item">
                    <span>Moderate Impact</span>
                    <div class="count-badge moderate" id="moderateCount">${moderateCount}</div>
                </div>
                <div class="sidebar-item">
                    <span>Informational</span>
                    <div class="count-badge" id="informationalCount">${informationalCount}</div>
                </div>
            </div>
        </div>
    `;
};

module.exports = { getSidebar };