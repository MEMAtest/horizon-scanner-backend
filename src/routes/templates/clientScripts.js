// src/routes/templates/clientScripts.js
// Complete solution with WorkspaceModule included

const { getWorkspaceModule } = require('./clientModules/workspaceModule')

function getClientScripts() {
  // Get the workspace module code
  const workspaceModuleCode = getWorkspaceModule()

  return `
    <!-- Include Workspace Module First -->
    <script>
        ${workspaceModuleCode}
    </script>
    
    <!-- Then include the rest of the client scripts -->
    ${getClientScriptsContent()}
    `
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
                    showMessage('Refreshed! ' + (result.newArticles || 0) + ' new updates found.', 'success');
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

        // Filter Functions for Dashboard
        window.filterByCategory = function(category) {
            console.log('Filtering by category:', category);
            try {
                const updates = document.querySelectorAll('.update-card');
                const filterBtns = document.querySelectorAll('.quick-filter-btn');

                // Update active filter button
                filterBtns.forEach(btn => btn.classList.remove('active'));
                const activeBtn = document.querySelector('[data-filter="' + category + '"]');
                if (activeBtn) activeBtn.classList.add('active');

                // Apply filter
                updates.forEach(card => {
                    const shouldShow = category === 'all' || card.dataset.category === category ||
                                     card.classList.contains(category) || card.dataset.filter === category;
                    card.style.display = shouldShow ? 'block' : 'none';
                });

                // Update URL and store filter state
                const url = new URL(window.location);
                if (category !== 'all') {
                    url.searchParams.set('category', category);
                } else {
                    url.searchParams.delete('category');
                }
                window.history.replaceState({}, '', url);

                showMessage('Filtered to ' + category + ' updates', 'info');
            } catch (error) {
                console.error('Filter error:', error);
                showMessage('Filter failed', 'error');
            }
        };

        window.filterByAuthority = function(authority) {
            console.log('Filtering by authority:', authority);
            try {
                const updates = document.querySelectorAll('.update-card');
                updates.forEach(card => {
                    const cardAuthority = card.dataset.authority || card.querySelector('.authority-tag')?.textContent;
                    const shouldShow = !authority || cardAuthority === authority;
                    card.style.display = shouldShow ? 'block' : 'none';
                });
                showMessage(authority ? 'Showing ' + authority + ' updates' : 'Showing all authorities', 'info');
            } catch (error) {
                console.error('Authority filter error:', error);
            }
        };

        window.filterBySector = function(sector) {
            console.log('Filtering by sector:', sector);
            try {
                const updates = document.querySelectorAll('.update-card');
                updates.forEach(card => {
                    const sectorTags = card.querySelectorAll('.sector-tag');
                    const cardSectors = Array.from(sectorTags).map(tag => tag.textContent.trim());
                    const shouldShow = !sector || cardSectors.includes(sector);
                    card.style.display = shouldShow ? 'block' : 'none';
                });
                showMessage(sector ? 'Showing ' + sector + ' updates' : 'Showing all sectors', 'info');
            } catch (error) {
                console.error('Sector filter error:', error);
            }
        };

        window.filterByImpactLevel = function(impact) {
            console.log('Filtering by impact level:', impact);
            try {
                const updates = document.querySelectorAll('.update-card');
                updates.forEach(card => {
                    const impactLevel = card.dataset.impact || card.querySelector('.impact-level')?.textContent;
                    const shouldShow = !impact || impactLevel === impact;
                    card.style.display = shouldShow ? 'block' : 'none';
                });
                showMessage(impact ? 'Showing ' + impact + ' impact updates' : 'Showing all impact levels', 'info');
            } catch (error) {
                console.error('Impact filter error:', error);
            }
        };

        window.filterByDateRange = function(range) {
            console.log('Filtering by date range:', range);
            try {
                const updates = document.querySelectorAll('.update-card');
                const now = new Date();

                updates.forEach(card => {
                    const publishedDate = new Date(card.dataset.publishedDate || card.querySelector('.date')?.textContent);
                    let shouldShow = true;

                    if (range && !isNaN(publishedDate)) {
                        const daysDiff = Math.floor((now - publishedDate) / (1000 * 60 * 60 * 24));

                        switch (range) {
                            case 'today':
                                shouldShow = daysDiff === 0;
                                break;
                            case 'week':
                                shouldShow = daysDiff <= 7;
                                break;
                            case 'month':
                                shouldShow = daysDiff <= 30;
                                break;
                            case 'quarter':
                                shouldShow = daysDiff <= 90;
                                break;
                        }
                    }

                    card.style.display = shouldShow ? 'block' : 'none';
                });

                showMessage(range ? 'Showing ' + range + ' updates' : 'Showing all time periods', 'info');
            } catch (error) {
                console.error('Date filter error:', error);
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
            console.log(type.toUpperCase() + ': ' + message);
            
            const toast = document.createElement('div');
            const bgColor = type === 'error' ? '#fef2f2' : type === 'success' ? '#f0fdf4' : type === 'warning' ? '#fffbeb' : '#f0f9ff';
            const textColor = type === 'error' ? '#dc2626' : type === 'success' ? '#059669' : type === 'warning' ? '#d97706' : '#2563eb';
            
            toast.style.cssText =
                'position: fixed;' +
                'top: 20px;' +
                'right: 20px;' +
                'background: ' + bgColor + ';' +
                'color: ' + textColor + ';' +
                'padding: 12px 16px;' +
                'border-radius: 8px;' +
                'border: 1px solid ' + textColor + '33;' +
                'font-size: 14px;' +
                'z-index: 10000;' +
                'max-width: 350px;' +
                'box-shadow: 0 4px 6px rgba(0,0,0,0.1);' +
                'animation: slideIn 0.3s ease;';
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

            const streams = [
                {
                    id: 'urgent',
                    title: '🔴 Critical Impact',
                    updates: updates.filter(u => u.urgency === 'High'),
                    expanded: true
                },
                {
                    id: 'moderate',
                    title: '🟡 Active Monitoring',
                    updates: updates.filter(u => u.urgency === 'Medium'),
                    expanded: false
                },
                {
                    id: 'background',
                    title: '🟢 Background Intelligence',
                    updates: updates.filter(u => u.urgency === 'Low'),
                    expanded: false
                }
            ];

            container.innerHTML = streams
                .map(stream => generateStream(stream.id, stream.title, stream.updates, stream.expanded))
                .join('');
        }
        
        function generateStream(id, title, updates, isExpanded = false) {
            const safeId = String(id).replace(/"/g, '&quot;');
            const cards = updates.slice(0, 5).map(u => generateUpdateCard(u)).join('');
            const loadMore = updates.length > 5
                ? '<button class="load-more-btn" id="loadMoreBtn-' + safeId + '" onclick="SearchModule.loadMoreUpdatesForStream(&#39;' + safeId + '&#39;, ' + updates.length + ')">Load More (' + (updates.length - 5) + ' remaining)</button>'
                : '';

            return (
                '<div class="intelligence-stream ' + (isExpanded ? 'expanded' : '') + '" id="' + safeId + '">' +
                    '<div class="stream-header" onclick="toggleStreamExpansion(&#39;' + safeId + '&#39;)">' +
                        '<h3>' + title + '</h3>' +
                        '<span class="update-count">' + updates.length + ' updates</span>' +
                    '</div>' +
                    '<div class="stream-content">' +
                        cards +
                        loadMore +
                    '</div>' +
                '</div>'
            );
        }
        
        function generateUpdateCard(update) {
            const impactLevel = update.impactLevel || update.impact_level || 'Informational'
            const urgency = update.urgency || 'Low'
            const publishedAt = parseDate(update.publishedDate || update.published_date || update.fetchedDate || update.createdAt)
            const publishedDate = formatDateDisplay(publishedAt || new Date())
            const isoDate = publishedAt ? publishedAt.toISOString() : ''
            const impactBadge = getImpactBadge(update)
            const contentTypeBadge = getContentTypeBadge(update)
            const sectorTags = getSectorTags(update)
            const aiFeatures = getAIFeatures(update)

            const aiSummary = update.ai_summary ? update.ai_summary.trim() : ''
            const useFallbackSummary = isFallbackSummary(aiSummary)
            const summaryText = !useFallbackSummary && aiSummary
                ? aiSummary
                : (update.summary && update.summary.trim() ? update.summary.trim() : '')

            const idArg = JSON.stringify(update.id || '');
            const urlArg = JSON.stringify(update.url || '');

            return (
                '<div class="update-card" ' +
                    'data-id="' + (update.id || '') + '" ' +
                    'data-url="' + (update.url || '') + '" ' +
                    'data-authority="' + (update.authority || '') + '" ' +
                    'data-impact="' + impactLevel + '" ' +
                    'data-urgency="' + urgency + '" ' +
                    'data-date="' + isoDate + '">' +
                    '<div class="update-header">' +
                        '<div class="update-meta-primary">' +
                            '<span class="authority-badge">' + (update.authority || 'Unknown') + '</span>' +
                            '<span class="date-badge">' + publishedDate + '</span>' +
                            contentTypeBadge +
                            impactBadge +
                        '</div>' +
                        '<div class="update-actions">' +
                            '<button onclick="bookmarkUpdate(\'' + (update.id || '') + '\')" class="action-btn" title="Bookmark">⭐</button>' +
                            '<button onclick="shareUpdate(\'' + (update.id || '') + '\')" class="action-btn" title="Share">🔗</button>' +
                            '<button onclick="viewDetails(\'' + (update.id || '') + '\')" class="action-btn" title="Details">👁️</button>' +
                        '</div>' +
                    '</div>' +
                    '<h3 class="update-headline">' +
                        '<a href="' + (update.url || '#') + '" target="_blank" rel="noopener">' + (update.headline || 'No headline') + '</a>' +
                    '</h3>' +
                    '<div class="update-summary">' +
                        (summaryText ? truncateText(summaryText, 200) : 'No summary available') +
                    '</div>' +
                    '<div class="update-details">' +
                        '<div class="detail-item">' +
                            '<div class="detail-label">Regulatory Area</div>' +
                            '<div class="detail-value">' + (update.area || 'General') + '</div>' +
                        '</div>' +
                        (update.business_impact_score ?
                            '<div class="detail-item">' +
                                '<div class="detail-label">Impact Score</div>' +
                                '<div class="detail-value">' + update.business_impact_score + '/10</div>' +
                            '</div>' : '') +
                        (update.urgency ?
                            '<div class="detail-item">' +
                                '<div class="detail-label">Urgency</div>' +
                                '<div class="detail-value">' + update.urgency + '</div>' +
                            '</div>' : '') +
                        (update.compliance_deadline ?
                            '<div class="detail-item">' +
                                '<div class="detail-label">Compliance Deadline</div>' +
                                '<div class="detail-value">' + formatDateDisplay(update.compliance_deadline || update.complianceDeadline) + '</div>' +
                            '</div>' : '') +
                    '</div>' +
                    '<div class="update-footer">' +
                        '<div class="sector-tags">' + sectorTags + '</div>' +
                        '<div class="ai-features">' + aiFeatures + '</div>' +
                    '</div>' +
                '</div>'
            );
        }

        // Client-side helper functions for Cards view
        function getImpactBadge(update) {
            const level = update.impactLevel || update.impact_level || 'Informational';
            let badgeClass = 'low';
            if (level === 'Significant') {
                badgeClass = 'urgent';
            } else if (level === 'Moderate') {
                badgeClass = 'moderate';
            }
            return '<span class="impact-badge ' + badgeClass + '">' + level + '</span>';
        }

        function getContentTypeBadge(update) {
            const contentType = update.content_type || 'OTHER';
            const badgeClass = contentType.toLowerCase();
            const badgeText = contentType === 'OTHER' ? 'INFO' : contentType;
            return '<span class="content-type-badge ' + badgeClass + '">' + badgeText + '</span>';
        }

        function getSectorTags(update) {
            // Try various sector field names first
            let sectors = update.firm_types_affected || update.primarySectors || (update.sector ? [update.sector] : []);

            // If no sector data, use authority as fallback sector tag
            if (!sectors || sectors.length === 0) {
                if (update.authority) {
                    sectors = [update.authority];
                } else {
                    sectors = [];
                }
            }

            return sectors.slice(0, 3).map(sector =>
                '<span class="sector-tag" onclick="filterBySector(\'' + sector + '\')">' + sector + '</span>'
            ).join('');
        }

        function getAIFeatures(update) {
            const features = [];

            // Primary AI features (if available)
            if (update.business_impact_score && update.business_impact_score >= 7) {
                features.push('<span class="ai-feature high-impact">🔥 High Impact (' + update.business_impact_score + '/10)</span>');
            }

            if (update.urgency === 'High') {
                features.push('<span class="ai-feature urgent">🚨 Urgent</span>');
            }

            if (update.ai_tags && update.ai_tags.includes('has:penalty')) {
                features.push('<span class="ai-feature enforcement">🚨 Enforcement Action</span>');
            }

            if (update.ai_confidence_score && update.ai_confidence_score >= 0.9) {
                features.push('<span class="ai-feature high-confidence">🤖 High Confidence (' + Math.round(update.ai_confidence_score * 100) + '%)</span>');
            }

            // Fallback features based on available data
            if (features.length === 0) {
                // Check if headline/summary contains enforcement keywords
                const text = (update.headline + ' ' + (update.summary || update.ai_summary || '')).toLowerCase();

                if (text.includes('fine') || text.includes('penalty') || text.includes('enforcement') || text.includes('breach')) {
                    features.push('<span class="ai-feature enforcement">⚖️ Enforcement</span>');
                }

                if (text.includes('consultation') || text.includes('draft') || text.includes('guidance')) {
                    features.push('<span class="ai-feature guidance">📋 Guidance</span>');
                }

                if (text.includes('deadline') || text.includes('compliance') || text.includes('must')) {
                    features.push('<span class="ai-feature deadline">📅 Action Required</span>');
                }

                // Show authority as a feature if no other features found
                if (features.length === 0 && update.authority) {
                    features.push('<span class="ai-feature authority">🏛️ ' + update.authority + '</span>');
                }
            }

            return features.join('');
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
                window.open('/update/' + updateId, '_blank');
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
                container.innerHTML =
                    '<div>Total: ' + (analyticsPreviewData.totalUpdates || 0) + '</div>' +
                    '<div>Risk: ' + (analyticsPreviewData.averageRiskScore || 0).toFixed(1) + '</div>';
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
            const newUrl = queryString ? '/analytics?' + queryString : '/analytics';
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

                const response = await fetch('/api/analytics/impact-distribution?' + params.toString());
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
                const row = container.querySelector('[data-impact-level="' + level + '"]');
                if (!row) return;

                const count = levelData[level] || 0;
                const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                const countEl = row.querySelector('.impact-count');
                const percentEl = row.querySelector('.impact-percent');
                const barEl = row.querySelector('.impact-bar-fill');

                if (countEl) countEl.textContent = count.toLocaleString('en-GB');
                if (percentEl) percentEl.textContent = percentage + '%';
                if (barEl) barEl.style.width = percentage + '%';
            });

            const totalEl = document.getElementById('impact-total');
            if (totalEl) totalEl.textContent = total.toLocaleString('en-GB') + ' total';
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

            tableBody.innerHTML = rows.map(row =>
                '<tr>' +
                    '<td>' + row.name + '</td>' +
                    '<td>' + row.total.toLocaleString('en-GB') + '</td>' +
                    '<td>' + row.highImpact.toLocaleString('en-GB') + '</td>' +
                    '<td>' + row.percentage + '%</td>' +
                '</tr>'
            ).join('');
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

            tableBody.innerHTML = rows.map(row =>
                '<tr>' +
                    '<td>' + row.name + '</td>' +
                    '<td>' + row.total.toLocaleString('en-GB') + '</td>' +
                    '<td>' + row.avgImpact.toFixed(1) + '</td>' +
                '</tr>'
            ).join('');
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

            container.innerHTML = rows.map(([range, value]) =>
                '<div class="score-row" data-score-range="' + range + '">' +
                    '<span>' + range + '</span>' +
                    '<span>' + value.toLocaleString('en-GB') + '</span>' +
                '</div>'
            ).join('');
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

                applyCurrentFilters();
                console.log('✅ System initialized');
            } catch (error) {
                console.error('❌ Initialization failed:', error);
            }
        }
        
        // =================
        // FILTER AND SORT FUNCTIONS
        // =================
        
        let currentView = typeof window.currentView === 'string' ? window.currentView : 'cards';
        window.currentView = currentView;

        const originalUpdates = Array.isArray(window.initialUpdates)
            ? window.initialUpdates.map(update => ({ ...update }))
            : [];
        let filteredUpdates = [...originalUpdates];

        window.originalUpdates = originalUpdates;
        window.filteredUpdates = filteredUpdates;
        window.currentFilters = Object.assign({ category: 'all', sort: 'newest' }, window.currentFilters || {});

        function getUpdateDate(update) {
            const raw = update?.publishedDate || update?.published_date || update?.fetchedDate || update?.createdAt;
            if (!raw) return null;
            const parsed = new Date(raw);
            return isNaN(parsed) ? null : parsed;
        }

        function isWithinLastDays(update, days) {
            const date = getUpdateDate(update);
            if (!date) return false;

            const today = new Date();
            const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

            if (days === 0) {
                return date >= startOfToday && date < new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
            }

            const threshold = new Date(today.getTime() - (days * 24 * 60 * 60 * 1000));
            return date >= threshold;
        }

        function hasDeadline(update) {
            if (!update) return false;
            if (update.compliance_deadline || update.complianceDeadline) return true;
            if (typeof update.keyDates === 'string' && /[0-9]{4}/.test(update.keyDates)) return true;
            return false;
        }

        function matchesCategory(update, category) {
            const normalized = (category || '').toLowerCase();
            if (!normalized || normalized === 'all') return true;

            const contentType = (update.content_type || update.contentType || '').toLowerCase();
            const updateCategory = (update.category || '').toLowerCase();
            const summary = (update.summary || '').toLowerCase();
            const headline = (update.headline || '').toLowerCase();
            const aiTags = Array.isArray(update.ai_tags) ? update.ai_tags.map(tag => tag.toLowerCase()) : [];

            switch (normalized) {
                case 'high-impact':
                    return (update.impactLevel === 'Significant' || update.impact_level === 'Significant' ||
                        (update.business_impact_score || 0) >= 7 ||
                        (update.urgency || '').toLowerCase() === 'high');
                case 'today':
                    return isWithinLastDays(update, 0);
                case 'this-week':
                case 'thisweek':
                    return isWithinLastDays(update, 7);
                case 'consultations':
                    return contentType.includes('consultation') ||
                        updateCategory.includes('consultation') ||
                        headline.includes('consultation') ||
                        summary.includes('consultation') ||
                        aiTags.includes('type:consultation');
                case 'enforcement':
                    return updateCategory.includes('enforcement') ||
                        contentType.includes('enforcement') ||
                        aiTags.includes('has:penalty') ||
                        headline.includes('fine') ||
                        summary.includes('fine') ||
                        summary.includes('penalty');
                case 'deadlines':
                    return hasDeadline(update);
                default:
                    return updateCategory === normalized || contentType === normalized;
            }
        }

        function matchesSector(update, sector) {
            if (!sector) return true;
            const target = sector.toLowerCase();
            const sectors = [].concat(
                update.firm_types_affected || [],
                update.primarySectors || [],
                update.primary_sectors || [],
                update.sector ? [update.sector] : []
            ).map(value => (value || '').toLowerCase());
            return sectors.includes(target);
        }

        function matchesSearch(update, term) {
            if (!term) return true;
            const needle = term.toLowerCase();
            const haystack = [
                update.headline,
                update.summary,
                update.ai_summary,
                update.authority,
                update.area,
                update.category,
                update.content_type,
                update.contentType
            ].concat(update.ai_tags || [], update.primarySectors || [], update.firm_types_affected || [])
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(needle);
        }

        function filterUpdatesByRange(updates, range) {
            if (!range) return updates;
            const normalized = range.toLowerCase();
            switch (normalized) {
                case 'today':
                    return updates.filter(update => isWithinLastDays(update, 0));
                case 'week':
                    return updates.filter(update => isWithinLastDays(update, 7));
                case 'month':
                    return updates.filter(update => isWithinLastDays(update, 30));
                case 'quarter':
                    return updates.filter(update => isWithinLastDays(update, 90));
                default:
                    return updates;
            }
        }

        function applySort(updates, sortBy) {
            const sortKey = sortBy || 'newest';
            const impactOrder = { significant: 3, moderate: 2, informational: 1 };
            const sorted = [...updates];

            sorted.sort((a, b) => {
                switch (sortKey) {
                    case 'oldest':
                        return (getUpdateDate(a) || 0) - (getUpdateDate(b) || 0);
                    case 'impact': {
                        const impactA = (a.impactLevel || a.impact_level || 'Informational').toLowerCase();
                        const impactB = (b.impactLevel || b.impact_level || 'Informational').toLowerCase();
                        return (impactOrder[impactB] || 0) - (impactOrder[impactA] || 0);
                    }
                    case 'authority': {
                        const authA = (a.authority || '').toLowerCase();
                        const authB = (b.authority || '').toLowerCase();
                        return authA.localeCompare(authB);
                    }
                    case 'sector': {
                        const sectorA = ((a.primarySectors && a.primarySectors[0]) || a.sector || '').toLowerCase();
                        const sectorB = ((b.primarySectors && b.primarySectors[0]) || b.sector || '').toLowerCase();
                        return sectorA.localeCompare(sectorB);
                    }
                    case 'newest':
                    default:
                        return (getUpdateDate(b) || 0) - (getUpdateDate(a) || 0);
                }
            });

            return sorted;
        }

        function setActiveCategoryButton(category) {
            document.querySelectorAll('.quick-filter-btn').forEach(btn => {
                const value = btn.getAttribute('data-filter') || 'all';
                btn.classList.toggle('active', value === category);
            });
        }

        function updateResultsSummary(updates) {
            const resultsCount = document.getElementById('results-count');
            if (resultsCount) {
                resultsCount.textContent = updates.length;
            }

            const searchInfo = document.getElementById('search-results');
            if (searchInfo) {
                if (window.currentFilters.search) {
                    searchInfo.style.display = 'block';
                    searchInfo.textContent = 'Showing results for "' + window.currentFilters.search + '"';
                } else {
                    searchInfo.style.display = 'none';
                    searchInfo.textContent = '';
                }
            }
        }

        function syncUrlWithFilters(filters) {
            const url = new URL(window.location.href);
            const params = url.searchParams;
            const keys = ['category', 'authority', 'sector', 'impact', 'range', 'search'];

            keys.forEach(key => {
                const value = filters[key];
                if (value) {
                    params.set(key, value);
                } else {
                    params.delete(key);
                }
            });

            const query = params.toString();
            window.history.replaceState({}, '', url.pathname + (query ? ('?' + query) : ''));
        }

        function renderUpdatesList(updates) {
            filteredUpdates = updates;
            window.filteredUpdates = updates;
            renderUpdatesInView(currentView, updates);
            updateResultsSummary(updates);
            syncUrlWithFilters(window.currentFilters);
            document.dispatchEvent(new CustomEvent('dashboard:updates-filtered', { detail: { updates } }));
        }

        function applyCurrentFilters() {
            const filters = window.currentFilters = Object.assign({ category: 'all', sort: 'newest' }, window.currentFilters || {});

            let updates = originalUpdates.slice();

            if (filters.category && filters.category !== 'all') {
                updates = updates.filter(update => matchesCategory(update, filters.category));
            }

            if (filters.authority) {
                const authorityMatch = filters.authority.toLowerCase();
                updates = updates.filter(update => (update.authority || '').toLowerCase() === authorityMatch);
            }

            if (filters.sector) {
                updates = updates.filter(update => matchesSector(update, filters.sector));
            }

            if (filters.impact) {
                updates = updates.filter(update => {
                    const impactLevel = update.impactLevel || update.impact_level || '';
                    return impactLevel === filters.impact;
                });
            }

            if (filters.range) {
                updates = filterUpdatesByRange(updates, filters.range);
            }

            if (filters.search) {
                updates = updates.filter(update => matchesSearch(update, filters.search));
            }

            updates = applySort(updates, filters.sort);

            setActiveCategoryButton(filters.category || 'all');

            document.querySelectorAll('.sort-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.sort === filters.sort);
            });

            renderUpdatesList(updates);
        }

        function filterByCategory(category) {
            console.log('Filtering by category:', category);
            window.currentFilters.category = category || 'all';
            applyCurrentFilters();
            showMessage('Filtered by ' + (category || 'all') + ' updates', 'info');
        }

        function filterByAuthority(authority) {
            console.log('Filtering by authority:', authority);
            if (!authority) {
                delete window.currentFilters.authority;
            } else {
                window.currentFilters.authority = authority;
            }
            applyCurrentFilters();
        }

        function filterBySector(sector) {
            console.log('Filtering by sector:', sector);
            if (!sector) {
                delete window.currentFilters.sector;
            } else {
                window.currentFilters.sector = sector;
            }
            applyCurrentFilters();
        }

        function filterByImpactLevel(level) {
            console.log('Filtering by impact level:', level);
            if (!level) {
                delete window.currentFilters.impact;
            } else {
                window.currentFilters.impact = level;
            }
            applyCurrentFilters();
        }

        function filterByDateRange(range) {
            console.log('Filtering by date range:', range);
            if (!range) {
                delete window.currentFilters.range;
            } else {
                window.currentFilters.range = range;
            }
            applyCurrentFilters();
        }

        function sortUpdates(sortBy) {
            console.log('Sorting by:', sortBy);
            window.currentFilters.sort = sortBy || 'newest';
            applyCurrentFilters();
        }

        function clearAllFilters() {
            console.log('Clearing all filters');
            window.currentFilters = { category: 'all', sort: 'newest' };

            const searchInput = document.getElementById('search-input');
            if (searchInput) searchInput.value = '';

            const authoritySelect = document.querySelector('select[onchange*="filterByAuthority"]');
            if (authoritySelect) authoritySelect.value = '';

            const sectorSelect = document.querySelector('select[onchange*="filterBySector"]');
            if (sectorSelect) sectorSelect.value = '';

            const impactSelect = document.querySelector('select[onchange*="filterByImpactLevel"]');
            if (impactSelect) impactSelect.value = '';

            const rangeSelect = document.querySelector('select[onchange*="filterByDateRange"]');
            if (rangeSelect) rangeSelect.value = '';

            applyCurrentFilters();
            showMessage('All filters cleared', 'info');
        }

        function clearFilters() {
            clearAllFilters();
        }
        
        // =================
        // UPDATE ACTIONS
        // =================
        
        function viewDetails(updateId) {
            console.log('Viewing details for:', updateId);
            window.open('/api/updates/' + updateId, '_blank');
        }
        
        function bookmarkUpdate(updateId) {
            console.log('Bookmarking:', updateId);
            pinnedUrls.add(updateId);
            showMessage('Update bookmarked', 'success');
            updateWorkspaceCounts();
        }
        
        function shareUpdate(updateId) {
            console.log('Sharing:', updateId);
            const url = window.location.origin + '/api/updates/' + updateId;
            
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
            window.location.href = '/dashboard?' + params.toString();
        }
        
        // Search functionality
        function performSearch() {
            const searchInput = document.getElementById('search-input');
            if (!searchInput) return;

            const searchTerm = searchInput.value.trim();
            if (!searchTerm) {
                delete window.currentFilters.search;
            } else {
                window.currentFilters.search = searchTerm;
            }

            applyCurrentFilters();
        }

        // =================
        // VIEW SWITCHING FUNCTIONALITY
        // =================

        function initializeViewSwitching() {
            console.log('🔄 Initializing view switching...');

            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const newView = e.target.getAttribute('data-view');
                    if (newView && newView !== currentView) {
                        switchView(newView);
                    }
                });
            });

            currentView = typeof window.currentView === 'string' ? window.currentView : currentView;
            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-view') === currentView);
            });

            renderUpdatesInView(currentView, window.filteredUpdates);
        }

        function switchView(viewType) {
            console.log('🔄 Switching view to: ' + viewType);

            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-view') === viewType);
            });

            currentView = viewType;
            window.currentView = viewType;
            renderUpdatesInView(viewType, window.filteredUpdates);
        }

        function renderUpdatesInView(viewType, updates) {
            const container = document.getElementById('updates-container') ||
                            document.querySelector('.updates-container');

            if (!container) {
                console.warn('Updates container not found');
                return;
            }

            const dataset = updates || window.filteredUpdates || window.originalUpdates || [];

            switch (viewType) {
                case 'table':
                    renderTableView(container, dataset);
                    break;
                case 'timeline':
                    renderTimelineView(container, dataset);
                    break;
                case 'cards':
                default:
                    renderCardsView(container, dataset);
                    break;
            }
        }

        function buildEmptyStateHtml() {
            return (
                '<div class="no-updates">' +
                    '<div class="no-updates-icon">📭</div>' +
                    '<h3>No updates found</h3>' +
                    '<p>Try adjusting your filters or search criteria.</p>' +
                    '<button onclick="clearAllFilters()" class="btn btn-secondary">Clear All Filters</button>' +
                '</div>'
            );
        }

        function renderCardsView(container, updates) {
            container.className = 'updates-container cards-view';
            if (!updates || updates.length === 0) {
                container.innerHTML = buildEmptyStateHtml();
                return;
            }
            container.innerHTML = updates.map(update => generateUpdateCard(update)).join('');
        }

        function renderTableView(container, updates) {
            container.className = 'updates-container table-view';
            if (!updates || updates.length === 0) {
                container.innerHTML = buildEmptyStateHtml();
                return;
            }

            const rows = updates.map(update => {
                const idArg = JSON.stringify(update.id || '');
                const urlArg = JSON.stringify(update.url || '');
                const formattedDate = formatDateDisplay(update.publishedDate || update.published_date || update.fetchedDate || update.createdAt);
                const summary = truncateText(update.summary || update.ai_summary || '', 120);
                const impactLevel = (update.impactLevel || update.impact_level || 'Informational');
                const urgency = update.urgency || 'Low';

                return (
                    '<tr>' +
                        '<td>' + formattedDate + '</td>' +
                        '<td><span class="authority-badge">' + (update.authority || 'Unknown') + '</span></td>' +
                        '<td class="headline-cell">' +
                            '<div class="headline">' + (update.headline || 'No headline') + '</div>' +
                            '<div class="summary">' + summary + '</div>' +
                        '</td>' +
                        '<td><span class="impact-badge ' + impactLevel.toLowerCase() + '">' + impactLevel + '</span></td>' +
                        '<td><span class="urgency-badge ' + urgency.toLowerCase() + '">' + urgency + '</span></td>' +
                        '<td><button class="table-btn" onclick="viewUpdateDetails(' + idArg + ', ' + urlArg + ')">View</button></td>' +
                    '</tr>'
                );
            }).join('');

            container.innerHTML =
                '<div class="table-wrapper">' +
                    '<table class="updates-table">' +
                        '<thead>' +
                            '<tr>' +
                                '<th>Date</th>' +
                                '<th>Authority</th>' +
                                '<th>Headline</th>' +
                                '<th>Impact</th>' +
                                '<th>Urgency</th>' +
                                '<th>Actions</th>' +
                            '</tr>' +
                        '</thead>' +
                        '<tbody>' + rows + '</tbody>' +
                    '</table>' +
                '</div>';
        }

        function renderTimelineView(container, updates) {
            container.className = 'updates-container timeline-view';
            if (!updates || updates.length === 0) {
                container.innerHTML = buildEmptyStateHtml();
                return;
            }

            const groupedUpdates = updates.reduce((acc, update) => {
                const dateLabel = formatDateDisplay(update.publishedDate || update.published_date || update.fetchedDate || update.createdAt);
                if (!acc[dateLabel]) acc[dateLabel] = [];
                acc[dateLabel].push(update);
                return acc;
            }, {});

            const timelineHTML = '<div class="timeline-wrapper">' +
                Object.entries(groupedUpdates)
                    .sort((a, b) => {
                        const dateA = new Date(a[0]);
                        const dateB = new Date(b[0]);
                        return dateB - dateA;
                    })
                    .map(([date, dateUpdates]) => (
                        '<div class="timeline-date-group">' +
                            '<div class="timeline-date-header">' +
                                '<h3>' + date + '</h3>' +
                                '<span class="update-count">' + dateUpdates.length + ' updates</span>' +
                            '</div>' +
                            '<div class="timeline-updates">' +
                                dateUpdates.map(update => {
                                    const idArg = JSON.stringify(update.id || '');
                                    const urlArg = JSON.stringify(update.url || '');
                                    const urgency = update.urgency || 'Low';
                                    const summary = truncateText(update.summary || update.ai_summary || '', 150);

                                    return (
                                        '<div class="timeline-item">' +
                                            '<div class="timeline-marker"></div>' +
                                            '<div class="timeline-content">' +
                                                '<div class="timeline-header">' +
                                                    '<span class="authority-badge">' + (update.authority || 'Unknown') + '</span>' +
                                                    '<span class="urgency-badge ' + urgency.toLowerCase() + '">' + urgency + '</span>' +
                                                '</div>' +
                                                '<h4 class="timeline-headline">' + (update.headline || 'No headline') + '</h4>' +
                                                '<p class="timeline-summary">' + summary + '</p>' +
                                                '<button class="timeline-btn" onclick="viewUpdateDetails(' + idArg + ', ' + urlArg + ')">View Details</button>' +
                                            '</div>' +
                                        '</div>'
                                    );
                                }).join('') +
                            '</div>' +
                        '</div>'
                    )).join('') +
                '</div>';

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
    `
}

// Export all variations for compatibility
module.exports = {
  getClientScriptsContent,
  getCommonClientScripts: getClientScripts,
  getClientScripts,
  getSharedClientScripts: getClientScripts,
  getCommonScripts: getClientScripts
}
