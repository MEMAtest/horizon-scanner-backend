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
        
        function parseDate(value) {
            if (!value) return null;
            const date = new Date(value);
            return isNaN(date) ? null : date;
        }

        function formatDateDisplay(value) {
            const date = parseDate(value);
            if (!date) return 'Unknown';
            return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        }

        function truncateText(text, maxLength = 200) {
            if (!text) return '';
            const trimmed = text.trim();
            if (trimmed.length <= maxLength) return trimmed;
            return trimmed.substring(0, maxLength).trim() + '...';
        }

        function isFallbackSummary(summary = '') {
            const normalized = summary.trim().toLowerCase();
            return normalized.startsWith('informational regulatory update') ||
                   normalized.startsWith('significant regulatory development') ||
                   normalized.startsWith('regulatory update') ||
                   normalized.startsWith('regulatory impact overview');
        }

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
                            lastUpdateEl.textContent = 'Last: ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
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

        // Analytics refresh function
        window.refreshAnalytics = async function() {
            console.log('📊 Refreshing analytics...');

            const btn = event?.target;
            if (btn) {
                btn.disabled = true;
                btn.textContent = '🔄 Refreshing...';
            }

            try {
                // Call analytics refresh endpoint (if it exists) or just reload
                showMessage('Analytics refreshed successfully', 'success');
                setTimeout(() => window.location.reload(), 1000);
            } catch (error) {
                console.error('Analytics refresh error:', error);
                showMessage('Failed to refresh analytics: ' + error.message, 'error');
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = '🔄 Refresh Analytics';
                }
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
        const ANALYTICS_LEVELS = ['Significant', 'Moderate', 'Informational'];
        const DEFAULT_ANALYTICS_PERIOD = 'month';
        let analyticsState = {
            filters: { authority: '', sector: '', period: DEFAULT_ANALYTICS_PERIOD },
            impactDistribution: null
        };
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
                        \${updates.length > 5 ? \`<button class="load-more-btn" id="loadMoreBtn-\${id}" onclick="SearchModule.loadMoreUpdatesForStream('\${id}', \${updates.length})">Load More (\${updates.length - 5} remaining)</button>\` : ''}
                    </div>
                </div>
            \`;
        }
        
        function generateUpdateCard(update) {
            const isPinned = pinnedUrls.has(update.url);
            const aiSummary = update.ai_summary || update.impact || '';
            const useFallback = isFallbackSummary(aiSummary);
            const baseSummary = !useFallback && aiSummary.trim().length > 0
                ? aiSummary.trim()
                : (update.summary || update.description || '').trim();
            const shortSummary = truncateText(baseSummary, 180);
            const displayDate = formatDateDisplay(update.publishedDate || update.published_date || update.fetchedDate || update.createdAt);
            
            return \`
                <div class="update-card" data-authority="\${update.authority}" data-url="\${update.url}">
                    <div class="update-header">
                        <h4>\${update.headline || 'No headline'}</h4>
                        <span class="authority-badge">\${update.authority || 'Unknown'}</span>
                    </div>
                    <div class="update-content">
                        <p>\${shortSummary || 'No summary available'}</p>
                        \${baseSummary && baseSummary.length > 180 ? \`
                            <button class="read-more-btn" onclick="ContentModule.toggleSummaryExpansion(\${update.id || '0'}, '\${baseSummary.replace(/'/g, '')}')">Read More</button>
                        \` : ''}
                    </div>
                    <div class="update-footer">
                        <span>\${displayDate}</span>
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
        
        function viewUpdateDetails(updateId, url) {
            if (updateId) {
                // Use internal detail page
                window.open(\`/update/\${updateId}\`, '_blank');
            } else if (url) {
                // Fallback to external URL
                window.open(url, '_blank');
            }
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

        async function initializeAnalyticsDashboard() {
            const analyticsPage = document.querySelector('.analytics-page');
            if (!analyticsPage) return;

            console.log('📈 Initializing analytics dashboard...');

            analyticsState.filters = {
                authority: analyticsPage.dataset.selectedAuthority || '',
                sector: analyticsPage.dataset.selectedSector || '',
                period: analyticsPage.dataset.selectedPeriod || DEFAULT_ANALYTICS_PERIOD
            };

            setupAnalyticsFilters();

            if (window.initialAnalyticsData?.impactDistribution) {
                analyticsState.impactDistribution = window.initialAnalyticsData.impactDistribution;
                renderAnalyticsDistribution(window.initialAnalyticsData.impactDistribution);
                updateAnalyticsUrl();
            } else {
                await refreshAnalyticsDistribution();
            }
        }

        function setupAnalyticsFilters() {
            const form = document.getElementById('analytics-filter-form');
            if (!form) return;

            const authoritySelect = document.getElementById('analytics-authority');
            const sectorSelect = document.getElementById('analytics-sector');
            const periodSelect = document.getElementById('analytics-period');
            const resetButton = document.getElementById('analytics-reset');

            const selects = [authoritySelect, sectorSelect, periodSelect].filter(Boolean);

            selects.forEach(select => {
                if (select.name && analyticsState.filters[select.name] !== undefined) {
                    select.value = analyticsState.filters[select.name] || '';
                }

                select.addEventListener('change', () => handleAnalyticsFilterChange(form));
            });

            if (resetButton) {
                resetButton.addEventListener('click', () => {
                    form.reset();
                    if (authoritySelect) authoritySelect.value = '';
                    if (sectorSelect) sectorSelect.value = '';
                    if (periodSelect) periodSelect.value = DEFAULT_ANALYTICS_PERIOD;

                    analyticsState.filters = { authority: '', sector: '', period: DEFAULT_ANALYTICS_PERIOD };
                    refreshAnalyticsDistribution();
                });
            }
        }

        async function handleAnalyticsFilterChange(form) {
            const formData = new FormData(form);
            analyticsState.filters = {
                authority: formData.get('authority') || '',
                sector: formData.get('sector') || '',
                period: formData.get('period') || DEFAULT_ANALYTICS_PERIOD
            };

            await refreshAnalyticsDistribution();
        }

        function setAnalyticsLoadingState(isLoading) {
            const loadingEl = document.getElementById('analytics-loading');
            if (loadingEl) {
                loadingEl.classList.toggle('active', Boolean(isLoading));
            }
        }

        function updateAnalyticsUrl() {
            const params = new URLSearchParams();
            if (analyticsState.filters.authority) params.set('authority', analyticsState.filters.authority);
            if (analyticsState.filters.sector) params.set('sector', analyticsState.filters.sector);
            if (analyticsState.filters.period && analyticsState.filters.period !== DEFAULT_ANALYTICS_PERIOD) {
                params.set('period', analyticsState.filters.period);
            }

            const queryString = params.toString();
            const newUrl = queryString ? `/analytics?${queryString}` : '/analytics';
            if (window.location.pathname === '/analytics') {
                window.history.replaceState({}, '', newUrl);
            }
        }

        async function refreshAnalyticsDistribution() {
            const analyticsPage = document.querySelector('.analytics-page');
            if (!analyticsPage) return;

            try {
                setAnalyticsLoadingState(true);

                const params = new URLSearchParams();
                if (analyticsState.filters.authority) params.set('authority', analyticsState.filters.authority);
                if (analyticsState.filters.sector) params.set('sector', analyticsState.filters.sector);
                if (analyticsState.filters.period) params.set('period', analyticsState.filters.period);

                const response = await fetch(`/api/analytics/impact-distribution?${params.toString()}`);
                const data = await response.json();

                if (data.success && data.distribution) {
                    analyticsState.impactDistribution = data.distribution;
                    renderAnalyticsDistribution(data.distribution);
                    updateAnalyticsUrl();
                } else {
                    throw new Error(data.error || 'Unknown analytics error');
                }
            } catch (error) {
                console.error('Analytics refresh failed:', error);
                showMessage('Unable to update analytics data. Please try again later.', 'error');
            } finally {
                setAnalyticsLoadingState(false);
            }
        }

        function renderAnalyticsDistribution(distribution) {
            if (!distribution) return;

            updateImpactLevelRows(distribution.byLevel || {});
            updateAuthorityTable(distribution.byAuthority || {});
            updateSectorTable(distribution.bySector || {});
            updateScoreTable(distribution.byScore || {});
        }

        function updateImpactLevelRows(levelData) {
            const container = document.getElementById('impact-level-chart');
            if (!container) return;

            const total = Object.values(levelData || {}).reduce((sum, value) => sum + value, 0);

            ANALYTICS_LEVELS.forEach(level => {
                const row = container.querySelector(`[data-impact-level="${level}"]`);
                if (!row) return;

                const count = levelData[level] || 0;
                const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                const countEl = row.querySelector('.impact-count');
                const percentEl = row.querySelector('.impact-percent');
                const barEl = row.querySelector('.impact-bar-fill');

                if (countEl) countEl.textContent = count.toLocaleString('en-GB');
                if (percentEl) percentEl.textContent = `${percentage}%`;
                if (barEl) barEl.style.width = `${percentage}%`;
            });

            const totalEl = document.getElementById('impact-total');
            if (totalEl) totalEl.textContent = `${total.toLocaleString('en-GB')} total`;
        }

        function updateAuthorityTable(authorityData) {
            const tableBody = document.getElementById('authority-distribution');
            if (!tableBody) return;

            const rows = Object.entries(authorityData || {})
                .map(([name, stats]) => ({
                    name: name || 'Unknown',
                    total: stats.total || 0,
                    highImpact: stats.highImpact || 0,
                    percentage: stats.total ? Math.round((stats.highImpact / stats.total) * 100) : 0
                }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 5);

            if (!rows.length) {
                tableBody.innerHTML = '<tr><td colspan="4" class="empty">No authority data available</td></tr>';
                return;
            }

            tableBody.innerHTML = rows.map(row => `
                <tr>
                    <td>${row.name}</td>
                    <td>${row.total.toLocaleString('en-GB')}</td>
                    <td>${row.highImpact.toLocaleString('en-GB')}</td>
                    <td>${row.percentage}%</td>
                </tr>
            `).join('');
        }

        function updateSectorTable(sectorData) {
            const tableBody = document.getElementById('sector-distribution');
            if (!tableBody) return;

            const rows = Object.entries(sectorData || {})
                .map(([name, stats]) => ({
                    name: name || 'Other',
                    total: stats.total || 0,
                    avgImpact: stats.avgImpact || 0
                }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 5);

            if (!rows.length) {
                tableBody.innerHTML = '<tr><td colspan="3" class="empty">No sector data available</td></tr>';
                return;
            }

            tableBody.innerHTML = rows.map(row => `
                <tr>
                    <td>${row.name}</td>
                    <td>${row.total.toLocaleString('en-GB')}</td>
                    <td>${row.avgImpact.toFixed(1)}</td>
                </tr>
            `).join('');
        }

        function updateScoreTable(scoreData) {
            const container = document.getElementById('impact-score-table');
            if (!container) return;

            const rows = Object.entries(scoreData || {})
                .sort(([aKey], [bKey]) => {
                    const aStart = parseInt(aKey.split('-')[0], 10);
                    const bStart = parseInt(bKey.split('-')[0], 10);
                    return aStart - bStart;
                });

            if (!rows.length) {
                container.innerHTML = '<div class="empty">No score data available</div>';
                return;
            }

            container.innerHTML = rows.map(([range, value]) => `
                <div class="score-row" data-score-range="${range}">
                    <span>${range}</span>
                    <span>${value.toLocaleString('en-GB')}</span>
                </div>
            `).join('');
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
                await initializeAnalyticsDashboard();

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
        // VIEW SWITCHING FUNCTIONALITY
        // =================

        let currentView = 'cards';

        function initializeViewSwitching() {
            console.log('🔄 Initializing view switching...');

            // Add event listeners to view buttons
            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const newView = e.target.getAttribute('data-view');
                    if (newView && newView !== currentView) {
                        switchView(newView);
                    }
                });
            });

            // Set initial view
            currentView = 'cards';
            renderUpdatesInView(currentView);
        }

        function switchView(viewType) {
            console.log(\`🔄 Switching view to: \${viewType}\`);

            // Update active button
            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.getAttribute('data-view') === viewType) {
                    btn.classList.add('active');
                }
            });

            currentView = viewType;
            renderUpdatesInView(viewType);
        }

        function renderUpdatesInView(viewType) {
            const container = document.getElementById('updates-container') ||
                            document.querySelector('.updates-container') ||
                            document.querySelector('#intelligenceStreams');

            if (!container) {
                console.warn('Updates container not found');
                return;
            }

            // Get current updates data
            const updateCards = container.querySelectorAll('.update-card');
            const updates = Array.from(updateCards).map(card => {
                return {
                    headline: card.querySelector('.update-headline')?.textContent || '',
                    summary: card.querySelector('.update-summary')?.textContent || '',
                    authority: card.querySelector('.authority-badge')?.textContent || '',
                    urgency: card.getAttribute('data-urgency') || 'Low',
                    impactLevel: card.getAttribute('data-impact') || 'Informational',
                    url: card.getAttribute('data-url') || '',
                    fetchedDate: card.querySelector('.update-date')?.textContent || new Date().toLocaleDateString()
                };
            });

            // Render based on view type
            switch (viewType) {
                case 'cards':
                    renderCardsView(container, updates);
                    break;
                case 'table':
                    renderTableView(container, updates);
                    break;
                case 'timeline':
                    renderTimelineView(container, updates);
                    break;
                default:
                    renderCardsView(container, updates);
            }
        }

        function renderCardsView(container, updates) {
            // Restore original cards view - just show all update cards
            container.className = 'updates-container cards-view';
            const html = updates.map(update => generateUpdateCard(update)).join('');
            container.innerHTML = html;
        }

        function renderTableView(container, updates) {
            container.className = 'updates-container table-view';
            const tableHTML = \`
                <div class="table-wrapper">
                    <table class="updates-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Authority</th>
                                <th>Headline</th>
                                <th>Impact</th>
                                <th>Urgency</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            \${updates.map(update => \`
                                <tr>
                                    <td>\${update.fetchedDate}</td>
                                    <td>
                                        <span class="authority-badge">\${update.authority}</span>
                                    </td>
                                    <td class="headline-cell">
                                        <div class="headline">\${update.headline}</div>
                                        <div class="summary">\${(update.summary || '').substring(0, 100)}...</div>
                                    </td>
                                    <td>
                                        <span class="impact-badge \${update.impactLevel.toLowerCase()}">\${update.impactLevel}</span>
                                    </td>
                                    <td>
                                        <span class="urgency-badge \${update.urgency.toLowerCase()}">\${update.urgency}</span>
                                    </td>
                                    <td>
                                        <button class="table-btn" onclick="viewUpdateDetails('\${update.id}', '\${update.url}')">View</button>
                                    </td>
                                </tr>
                            \`).join('')}
                        </tbody>
                    </table>
                </div>
            \`;
            container.innerHTML = tableHTML;
        }

        function renderTimelineView(container, updates) {
            container.className = 'updates-container timeline-view';

            // Group updates by date
            const groupedUpdates = {};
            updates.forEach(update => {
                const date = update.fetchedDate;
                if (!groupedUpdates[date]) {
                    groupedUpdates[date] = [];
                }
                groupedUpdates[date].push(update);
            });

            const timelineHTML = \`
                <div class="timeline-wrapper">
                    \${Object.entries(groupedUpdates).map(([date, dateUpdates]) => \`
                        <div class="timeline-date-group">
                            <div class="timeline-date-header">
                                <h3>\${date}</h3>
                                <span class="update-count">\${dateUpdates.length} updates</span>
                            </div>
                            <div class="timeline-updates">
                                \${dateUpdates.map(update => \`
                                    <div class="timeline-item">
                                        <div class="timeline-marker"></div>
                                        <div class="timeline-content">
                                            <div class="timeline-header">
                                                <span class="authority-badge">\${update.authority}</span>
                                                <span class="urgency-badge \${update.urgency.toLowerCase()}">\${update.urgency}</span>
                                            </div>
                                            <h4 class="timeline-headline">\${update.headline}</h4>
                                            <p class="timeline-summary">\${(update.summary || '').substring(0, 150)}...</p>
                                            <button class="timeline-btn" onclick="viewUpdateDetails('\${update.id}', '\${update.url}')">View Details</button>
                                        </div>
                                    </div>
                                \`).join('')}
                            </div>
                        </div>
                    \`).join('')}
                </div>
            \`;
            container.innerHTML = timelineHTML;
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

        // View switching functions
        window.initializeViewSwitching = initializeViewSwitching;
        window.switchView = switchView;
        window.renderUpdatesInView = renderUpdatesInView;
        window.renderCardsView = renderCardsView;
        window.renderTableView = renderTableView;
        window.renderTimelineView = renderTimelineView;

        // =================
        // START INITIALIZATION
        // =================

        document.addEventListener('DOMContentLoaded', function() {
            initializeSystem();
            initializeViewSwitching();
        });
        
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