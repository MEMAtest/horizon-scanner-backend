// src/routes/templates/clientScripts.js
// Complete solution with WorkspaceModule included

const { getWorkspaceModule } = require('./clientModules/workspaceModule');

function getClientScripts() {
    // Get the workspace module code
    const workspaceModuleCode = getWorkspaceModule();
    
    return `
    <!-- Include Workspace Module First -->
    <script>
        ${workspaceModuleCode}
    </script>
    
    <!-- Then include the rest of the client scripts -->
    ${getClientScriptsContent()}
    `;
}

function getClientScriptsContent() {
    return `
    <script>
        // =================
        // IMMEDIATE DEFINITIONS - Prevent HTML onclick errors
        // =================
        
        // Define critical functions immediately
        window.updateLiveCounters = function() {
            console.log('🔄 Updating live counters...');
            
            fetch('/api/stats/live')
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const elements = {
                            'totalUpdates': data.stats?.totalUpdates || 0,
                            'newCount': data.stats?.newToday || 0,
                            'urgentCount': data.stats?.urgent || 0,
                            'moderateCount': data.stats?.moderate || 0,
                            'backgroundCount': data.stats?.background || 0
                        };
                        
                        Object.entries(elements).forEach(([id, value]) => {
                            const element = document.getElementById(id);
                            if (element) element.textContent = value;
                        });
                        
                        const lastUpdateEl = document.getElementById('lastUpdate');
                        if (lastUpdateEl) {
                            lastUpdateEl.textContent = \`Last: \${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}\`;
                        }
                    }
                })
                .catch(error => console.warn('Counter update failed:', error));
        };
        
        window.refreshData = async function() {
            console.log('🔄 Refresh data called');
            
            const btn = event?.target || document.getElementById('refreshBtn');
            if (btn) btn.disabled = true;
            
            try {
                const response = await fetch('/api/refresh', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showMessage(\`Refreshed! \${result.newArticles || 0} new updates found.\`, 'success');
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    showMessage('Refresh failed: ' + (result.error || 'Unknown error'), 'error');
                }
            } catch (error) {
                console.error('Refresh error:', error);
                showMessage('Refresh failed: ' + error.message, 'error');
            } finally {
                if (btn) btn.disabled = false;
            }
        };
        
        window.showMessage = function(message, type = 'info') {
            console.log(\`\${type.toUpperCase()}: \${message}\`);
            
            const toast = document.createElement('div');
            const bgColor = type === 'error' ? '#fef2f2' : type === 'success' ? '#f0fdf4' : type === 'warning' ? '#fffbeb' : '#f0f9ff';
            const textColor = type === 'error' ? '#dc2626' : type === 'success' ? '#059669' : type === 'warning' ? '#d97706' : '#2563eb';
            
            toast.style.cssText = \`
                position: fixed;
                top: 20px;
                right: 20px;
                background: \${bgColor};
                color: \${textColor};
                padding: 12px 16px;
                border-radius: 8px;
                border: 1px solid \${textColor}33;
                font-size: 14px;
                z-index: 10000;
                max-width: 350px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                animation: slideIn 0.3s ease;
            \`;
            toast.textContent = message;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.style.animation = 'slideOut 0.3s ease';
                    setTimeout(() => {
                        if (toast.parentNode) toast.parentNode.removeChild(toast);
                    }, 300);
                }
            }, 4000);
        };
        
        // =================
        // GLOBAL VARIABLES
        // =================
        let allUpdatesData = null;
        let firmProfile = null;
        let availableSectors = [];
        let workspaceStats = { pinnedItems: 0, savedSearches: 0, activeAlerts: 0 };
        let analyticsPreviewData = null;
        let expandedStreams = new Set();
        let selectedAuthorities = new Set();
        let selectedImpactLevels = new Set();
        let selectedUrgencies = new Set();
        let currentFilter = null;
        let pinnedUrls = new Set();
        let currentOffset = 0;
        let itemsPerPage = 20;
        let shareInProgress = false;
        
        let systemStatus = {
            database: false,
            api: false,
            overall: false
        };
        
        // =================
        // INITIALIZATION FUNCTIONS
        // =================
        
        function initializeFilters() {
            console.log('🔧 Initializing filters...');
            
            try {
                document.querySelectorAll('.filter-option').forEach(option => {
                    option.addEventListener('click', function() {
                        this.classList.toggle('active');
                        applyActiveFilters();
                    });
                });
                
                const searchBox = document.getElementById('searchBox');
                if (searchBox) {
                    searchBox.addEventListener('input', function() {
                        performSearch(this.value);
                    });
                }
                
                console.log('✅ Filters initialized');
            } catch (error) {
                console.error('❌ Error initializing filters:', error);
            }
        }
        
        // =================
        // MAIN FUNCTIONS
        // =================
        
        async function refreshIntelligence() {
            return window.refreshData();
        }
        
        async function loadIntelligenceStreams() {
            try {
                console.log('📊 Loading intelligence streams...');
                
                const response = await fetch('/api/streams');
                const data = await response.json();
                
                if (data.success) {
                    allUpdatesData = data.updates;
                    generateRelevanceBasedStreams(allUpdatesData);
                    updateLiveCounters();
                }
            } catch (error) {
                console.error('Stream loading error:', error);
            }
        }
        
        async function loadAnalyticsPreview() {
            try {
                const response = await fetch('/api/analytics/preview');
                const data = await response.json();
                
                if (data.success) {
                    analyticsPreviewData = data.analytics;
                    updateAnalyticsPreview();
                }
            } catch (error) {
                console.warn('Analytics preview not available:', error);
            }
        }
        
        async function checkLiveSubscriptions() {
            try {
                const response = await fetch('/api/workspace/stats');
                const data = await response.json();
                
                if (data.success) {
                    workspaceStats = data.stats;
                    updateWorkspaceCounts();
                }
            } catch (error) {
                console.warn('Workspace stats not available:', error);
            }
        }
        
        function generateRelevanceBasedStreams(updates) {
            if (!updates || !Array.isArray(updates)) return;
            
            const container = document.getElementById('intelligenceStreams');
            if (!container) return;
            
            const urgent = updates.filter(u => u.urgency === 'High');
            const moderate = updates.filter(u => u.urgency === 'Medium');
            const background = updates.filter(u => u.urgency === 'Low');
            
            container.innerHTML = \`
                \${generateStream('urgent', '🔴 Critical Impact', urgent, true)}
                \${generateStream('moderate', '🟡 Active Monitoring', moderate, false)}
                \${generateStream('background', '🟢 Background Intelligence', background, false)}
            \`;
        }
        
        function generateStream(id, title, updates, isExpanded = false) {
            const cards = updates.slice(0, 5).map(u => generateUpdateCard(u)).join('');
            
            return \`
                <div class="intelligence-stream \${isExpanded ? 'expanded' : ''}" id="\${id}">
                    <div class="stream-header" onclick="toggleStreamExpansion('\${id}')">
                        <h3>\${title}</h3>
                        <span class="update-count">\${updates.length} updates</span>
                    </div>
                    <div class="stream-content">
                        \${cards}
                    </div>
                </div>
            \`;
        }
        
        function generateUpdateCard(update) {
            const isPinned = pinnedUrls.has(update.url);
            
            return \`
                <div class="update-card" data-authority="\${update.authority}" data-url="\${update.url}">
                    <div class="update-header">
                        <h4>\${update.headline || 'No headline'}</h4>
                        <span class="authority-badge">\${update.authority || 'Unknown'}</span>
                    </div>
                    <div class="update-content">
                        <p>\${(update.summary || '').substring(0, 200)}...</p>
                    </div>
                    <div class="update-footer">
                        <span>\${new Date(update.publishedDate || update.createdAt).toLocaleDateString()}</span>
                        <button onclick="viewUpdateDetails('\${update.url}')">View Details</button>
                    </div>
                </div>
            \`;
        }
        
        function toggleStreamExpansion(streamId) {
            const stream = document.getElementById(streamId);
            if (stream) {
                stream.classList.toggle('expanded');
            }
        }
        
        function viewUpdateDetails(url) {
            if (url) window.open(url, '_blank');
        }
        
        function togglePin(url) {
            if (pinnedUrls.has(url)) {
                pinnedUrls.delete(url);
                showMessage('Item unpinned', 'info');
            } else {
                pinnedUrls.add(url);
                showMessage('Item pinned', 'success');
            }
            updateWorkspaceCounts();
        }
        
        function updateWorkspaceCounts() {
            const pinnedEl = document.getElementById('pinnedCount');
            if (pinnedEl) pinnedEl.textContent = pinnedUrls.size;
        }
        
        function updateAnalyticsPreview() {
            const container = document.getElementById('analyticsPreview');
            if (container && analyticsPreviewData) {
                container.innerHTML = \`
                    <div>Total: \${analyticsPreviewData.totalUpdates || 0}</div>
                    <div>Risk: \${(analyticsPreviewData.averageRiskScore || 0).toFixed(1)}</div>
                \`;
            }
        }
        
        function applyActiveFilters() {
            console.log('🎯 Applying filters');
            // Filter logic here
        }
        
        async function checkSystemStatus() {
            try {
                const response = await fetch('/api/system-status');
                const data = await response.json();
                
                systemStatus = {
                    database: data.database?.connected || false,
                    api: data.api?.healthy || false,
                    overall: data.overall?.status === 'healthy'
                };
                
                console.log('System status:', systemStatus);
            } catch (error) {
                console.warn('System status check failed:', error);
            }
        }
        
        // Setup search functionality
        function setupSearchBox() {
            const searchButton = document.getElementById('search-button');
            const searchInput = document.getElementById('search-input');
            
            if (searchButton && searchInput) {
                searchButton.addEventListener('click', performSearch);
                searchInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') performSearch();
                });
            }
        }
        
        async function initializeSystem() {
            console.log('🚀 Initializing system...');
            
            try {
                // Initialize WorkspaceModule if it exists
                if (window.WorkspaceModule && window.WorkspaceModule.init) {
                    await window.WorkspaceModule.init();
                }
                
                initializeFilters();
                setupSearchBox();
                await checkSystemStatus();
                await loadIntelligenceStreams();
                await loadAnalyticsPreview();
                await checkLiveSubscriptions();
                
                updateLiveCounters();
                setInterval(updateLiveCounters, 30000);
                
                console.log('✅ System initialized');
            } catch (error) {
                console.error('❌ Initialization failed:', error);
            }
        }
        
        // =================
        // FILTER AND SORT FUNCTIONS
        // =================
        
        function filterByCategory(category) {
            console.log('Filtering by category:', category);
            window.currentFilters = window.currentFilters || {};
            window.currentFilters.category = category;
            window.location.href = \`/dashboard?category=\${category}\`;
        }
        
        function filterByAuthority(authority) {
            console.log('Filtering by authority:', authority);
            if (!authority) {
                window.location.href = '/dashboard';
            } else {
                window.currentFilters = window.currentFilters || {};
                window.currentFilters.authority = authority;
                window.location.href = \`/dashboard?authority=\${encodeURIComponent(authority)}\`;
            }
        }
        
        function filterBySector(sector) {
            console.log('Filtering by sector:', sector);
            if (!sector) {
                window.location.href = '/dashboard';
            } else {
                window.currentFilters = window.currentFilters || {};
                window.currentFilters.sector = sector;
                window.location.href = \`/dashboard?sector=\${encodeURIComponent(sector)}\`;
            }
        }
        
        function filterByImpactLevel(level) {
            console.log('Filtering by impact level:', level);
            if (!level) {
                window.location.href = '/dashboard';
            } else {
                window.currentFilters = window.currentFilters || {};
                window.currentFilters.impact = level;
                window.location.href = \`/dashboard?impact=\${encodeURIComponent(level)}\`;
            }
        }
        
        function filterByDateRange(range) {
            console.log('Filtering by date range:', range);
            if (!range) {
                window.location.href = '/dashboard';
            } else {
                window.currentFilters = window.currentFilters || {};
                window.currentFilters.range = range;
                window.location.href = \`/dashboard?range=\${range}\`;
            }
        }
        
        function sortUpdates(sortBy) {
            console.log('Sorting by:', sortBy);
            
            // Get all update cards
            const container = document.getElementById('updates-container');
            if (!container) return;
            
            const cards = Array.from(container.querySelectorAll('.update-card'));
            if (cards.length === 0) return;
            
            // Define sort functions
            const urgencyMap = { 'High': 3, 'Medium': 2, 'Low': 1 };
            const impactMap = { 'Significant': 3, 'Moderate': 2, 'Informational': 1 };
            
            cards.sort((a, b) => {
                switch(sortBy) {
                    case 'newest':
                        const dateA = new Date(a.dataset.date || '2000-01-01');
                        const dateB = new Date(b.dataset.date || '2000-01-01');
                        return dateB - dateA;
                    case 'oldest':
                        const dateC = new Date(a.dataset.date || '2000-01-01');
                        const dateD = new Date(b.dataset.date || '2000-01-01');
                        return dateC - dateD;
                    case 'impact':
                        const impactA = a.querySelector('.impact-badge')?.textContent || '';
                        const impactB = b.querySelector('.impact-badge')?.textContent || '';
                        return (impactMap[impactB.split(' ')[0]] || 0) - (impactMap[impactA.split(' ')[0]] || 0);
                    case 'authority':
                        const authA = a.querySelector('.authority-badge')?.textContent || '';
                        const authB = b.querySelector('.authority-badge')?.textContent || '';
                        return authA.localeCompare(authB);
                    case 'sector':
                        const sectorA = a.querySelector('.sector-tag')?.textContent || '';
                        const sectorB = b.querySelector('.sector-tag')?.textContent || '';
                        return sectorA.localeCompare(sectorB);
                    default:
                        return 0;
                }
            });
            
            // Re-append sorted cards
            cards.forEach(card => container.appendChild(card));
            
            // Update active button state
            document.querySelectorAll('.sort-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.sort === sortBy);
            });
        }
        
        function clearAllFilters() {
            console.log('Clearing all filters');
            window.location.href = '/dashboard';
        }
        
        function clearFilters() {
            clearAllFilters();
        }
        
        // =================
        // UPDATE ACTIONS
        // =================
        
        function viewDetails(updateId) {
            console.log('Viewing details for:', updateId);
            window.open(\`/api/updates/\${updateId}\`, '_blank');
        }
        
        function bookmarkUpdate(updateId) {
            console.log('Bookmarking:', updateId);
            pinnedUrls.add(updateId);
            showMessage('Update bookmarked', 'success');
            updateWorkspaceCounts();
        }
        
        function shareUpdate(updateId) {
            console.log('Sharing:', updateId);
            const url = \`\${window.location.origin}/api/updates/\${updateId}\`;
            
            if (navigator.share) {
                navigator.share({
                    title: 'Regulatory Update',
                    url: url
                }).catch(err => console.log('Share cancelled'));
            } else {
                navigator.clipboard.writeText(url).then(() => {
                    showMessage('Link copied to clipboard', 'success');
                }).catch(() => {
                    showMessage('Failed to copy link', 'error');
                });
            }
        }
        
        function loadMoreUpdates() {
            console.log('📄 Loading more updates...');
            
            const loadMoreBtn = document.getElementById('loadMoreBtn') || 
                               document.querySelector('.btn-secondary');
            
            if (loadMoreBtn) {
                loadMoreBtn.disabled = true;
                loadMoreBtn.textContent = 'Loading...';
            }
            
            // Get current filters from URL
            const params = new URLSearchParams(window.location.search);
            const currentOffset = parseInt(params.get('offset') || '0');
            const newOffset = currentOffset + 50;
            params.set('offset', newOffset);
            
            // Redirect with new offset
            window.location.href = \`/dashboard?\${params.toString()}\`;
        }
        
        // Search functionality
        function performSearch() {
            const searchInput = document.getElementById('search-input');
            if (!searchInput) return;
            
            const searchTerm = searchInput.value.trim();
            if (!searchTerm) {
                window.location.href = '/dashboard';
            } else {
                window.location.href = \`/dashboard?search=\${encodeURIComponent(searchTerm)}\`;
            }
        }
        
        // =================
        // EXPOSE ALL FUNCTIONS TO WINDOW
        // =================
        
        // Core functions
        window.refreshIntelligence = refreshIntelligence;
        window.loadIntelligenceStreams = loadIntelligenceStreams;
        window.loadAnalyticsPreview = loadAnalyticsPreview;
        window.checkLiveSubscriptions = checkLiveSubscriptions;
        window.initializeFilters = initializeFilters;
        window.generateRelevanceBasedStreams = generateRelevanceBasedStreams;
        window.generateStream = generateStream;
        window.generateUpdateCard = generateUpdateCard;
        window.toggleStreamExpansion = toggleStreamExpansion;
        window.viewUpdateDetails = viewUpdateDetails;
        window.togglePin = togglePin;
        window.updateWorkspaceCounts = updateWorkspaceCounts;
        window.updateAnalyticsPreview = updateAnalyticsPreview;
        window.applyActiveFilters = applyActiveFilters;
        window.checkSystemStatus = checkSystemStatus;
        window.initializeSystem = initializeSystem;
        
        // Filter functions
        window.filterByCategory = filterByCategory;
        window.filterByAuthority = filterByAuthority;
        window.filterBySector = filterBySector;
        window.filterByImpactLevel = filterByImpactLevel;
        window.filterByDateRange = filterByDateRange;
        window.sortUpdates = sortUpdates;
        window.clearAllFilters = clearAllFilters;
        window.clearFilters = clearFilters;
        
        // Update action functions
        window.viewDetails = viewDetails;
        window.bookmarkUpdate = bookmarkUpdate;
        window.shareUpdate = shareUpdate;
        window.loadMoreUpdates = loadMoreUpdates;
        window.performSearch = performSearch;
        window.setupSearchBox = setupSearchBox;
        
        // =================
        // START INITIALIZATION
        // =================
        
        document.addEventListener('DOMContentLoaded', initializeSystem);
        
        // Also try immediate initialization if DOM is ready
        if (document.readyState !== 'loading') {
            initializeSystem();
        }
        
        console.log('✅ Client scripts loaded');
    </script>
    `;
}

// Export all variations for compatibility
module.exports = { 
    getClientScriptsContent,
    getCommonClientScripts: getClientScripts,
    getClientScripts: getClientScripts,
    getSharedClientScripts: getClientScripts,
    getCommonScripts: getClientScripts
};