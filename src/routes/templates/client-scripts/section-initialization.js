function renderInitializationSection() {
  return `        // INITIALIZATION FUNCTIONS
        // =================
        
        function initializeFilters() {
            console.log('[tools] Initializing filters...');
            
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
                
                document.querySelectorAll('.quick-filter-btn').forEach(button => {
                    button.addEventListener('click', async (event) => {
                        event.preventDefault();
                        const category = button.getAttribute('data-filter') || 'all';
                        const filters = typeof ensureFilterState === 'function' ? ensureFilterState() : (window.currentFilters || {});
                        filters.category = category;
                        window.currentFilters = filters;
                        const categorySelect = document.querySelector('select[name="category"]');
                        if (categorySelect) {
                            categorySelect.value = category;
                        }
                        setActiveCategoryButton(category);
                        await applyCurrentFilters();
                    });
                });

                console.log('[OK] Filters initialized');
            } catch (error) {
                console.error('X Error initializing filters:', error);
            }
        }

        function setupSearchBox() {
            const searchInput = document.getElementById('search-input') || document.getElementById('searchBox') || document.getElementById('search');
            const searchButton = document.getElementById('search-button');

            if (searchButton && searchInput) {
                searchButton.addEventListener('click', (event) => {
                    event.preventDefault();
                    performSearch(searchInput.value || '');
                });
            }

            if (searchInput) {
                searchInput.addEventListener('keypress', (event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        performSearch(searchInput.value || '');
                    }
                });
            }
        }

        function setActiveCategoryButton(category) {
            const normalized = (category || 'all').toLowerCase();
            document.querySelectorAll('.quick-filter-btn').forEach(button => {
                const value = (button.getAttribute('data-filter') || 'all').toLowerCase();
                const isActive = value === normalized;
                button.classList.toggle('active', isActive);
                button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            });
        }

        // =================
        // MAIN FUNCTIONS
        // =================
        
        async function refreshIntelligence() {
            return window.refreshData();
        }
        
        async function loadIntelligenceStreams() {
            try {
                console.log('[analytics] Loading intelligence streams...');
                
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

        function updateAnalyticsPreview() {
            const container = document.getElementById('analyticsPreview');
            if (!container || !analyticsPreviewData) return;

            const total = Number(analyticsPreviewData.totalUpdates || 0);
            const avgRisk = Number(analyticsPreviewData.averageRiskScore);
            const formattedRisk = Number.isFinite(avgRisk)
                ? (Math.round(avgRisk * 10) / 10).toFixed(1).replace(/\.0$/, '')
                : '–';

            container.innerHTML =
                '<div class="analytics-metric">' +
                    '<span class="metric-label">Total Updates</span>' +
                    '<span class="metric-value">' + total + '</span>' +
                '</div>' +
                '<div class="analytics-metric">' +
                    '<span class="metric-label">Avg Risk Score</span>' +
                    '<span class="metric-value">' + formattedRisk + '</span>' +
                '</div>' +
                '<div class="analytics-metric">' +
                    '<span class="metric-label">High Impact</span>' +
                    '<span class="metric-value">' + (analyticsPreviewData.highImpact || 0) + '</span>' +
                '</div>';
        }
        
        async function checkLiveSubscriptions() {
            try {
                const response = await fetch('/api/workspace/stats');
                const data = await response.json();
                
                if (data.success) {
                    workspaceStats = {
                        pinnedItems: toNumericCount(data.stats?.pinnedItems, workspaceStats.pinnedItems),
                        savedSearches: toNumericCount(data.stats?.savedSearches, workspaceStats.savedSearches),
                        activeAlerts: toNumericCount(data.stats?.activeAlerts, workspaceStats.activeAlerts)
                    };
                    updateWorkspaceCounts(workspaceStats);
                }
            } catch (error) {
                console.warn('Workspace stats not available:', error);
            }
        }

        async function checkSystemStatus() {
            try {
                const response = await fetch('/api/system-status');
                const data = await response.json();

                systemStatus = {
                    database: data?.database?.connected || false,
                    api: data?.api?.healthy || false,
                    overall: data?.overall?.status === 'healthy'
                };

                const indicator = document.getElementById('systemStatus');
                if (indicator) {
                    indicator.classList.toggle('status-error', !systemStatus.overall);
                    indicator.classList.toggle('status-healthy', !!systemStatus.overall);
                    indicator.textContent = systemStatus.overall ? 'System Healthy' : 'System Issues';
                }
            } catch (error) {
                console.warn('System status check failed:', error);
                systemStatus = Object.assign({}, systemStatus, {
                    database: false,
                    api: false,
                    overall: false
                });
            }

            window.systemStatus = systemStatus;
            return systemStatus;
        }


        function updateWorkspaceCounts(stats = {}) {
            const merged = Object.assign({}, workspaceStats, stats);
            const pinnedEl = document.getElementById('pinnedCount');
            if (pinnedEl) pinnedEl.textContent = String(merged.pinnedItems ?? 0);
            const savedEl = document.getElementById('savedSearchesCount');
            if (savedEl) savedEl.textContent = String(merged.savedSearches ?? 0);
            const alertsEl = document.getElementById('activeAlertsCount') || document.getElementById('activeAlerts');
            if (alertsEl) alertsEl.textContent = String(merged.activeAlerts ?? 0);
            workspaceStats = merged;
        }
        
        function generateRelevanceBasedStreams(updates) {
            if (!updates || !Array.isArray(updates)) return;
            
            const container = document.getElementById('intelligenceStreams');
            if (!container) return;

            const streams = [
                {
                    id: 'urgent',
                    title: 'Red Critical Impact',
                    updates: updates.filter(u => u.urgency === 'High'),
                    expanded: true
                },
                {
                    id: 'moderate',
                    title: 'Yellow Active Monitoring',
                    updates: updates.filter(u => u.urgency === 'Medium'),
                    expanded: false
                },
                {
                    id: 'background',
                    title: 'Green Background Intelligence',
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

        function toggleStreamExpansion(streamId) {
            const stream = document.getElementById(streamId);
            if (!stream) return;
            const content = stream.querySelector('.stream-content');
            const expandBtn = stream.querySelector('.expand-btn');
            const expanded = stream.classList.toggle('expanded');
            if (content) content.classList.toggle('expanded', expanded);
            if (expandBtn) {
                expandBtn.innerHTML = expanded
                    ? '<span>Down</span><span>Collapse</span>'
                    : '<span>Play</span><span>Expand</span>';
            }
        }
        
        function classifyUpdateTheme(update) {
            const textParts = [
                update.headline,
                update.summary,
                update.ai_summary,
                Array.isArray(update.ai_tags) ? update.ai_tags.join(' ') : ''
            ].filter(Boolean).join(' ').toLowerCase();

            const matches = (patterns) => patterns.some(pattern => textParts.includes(pattern));

            if (matches(['enforcement', 'penalty', 'fined', 'sanction', 'disciplinary', 'ban'])) {
                return { key: 'enforcement', label: 'Enforcement action' };
            }
            if (matches(['consultation', 'call for evidence', 'feedback statement', 'discussion paper', 'request for comment'])) {
                return { key: 'consultation', label: 'Consultation insight' };
            }
            if (matches(['speech', 'remarks', 'address', 'keynote', 'fireside', 'conference', 'summit'])) {
                return { key: 'speech', label: 'Leadership remarks' };
            }
            return { key: 'other', label: 'Strategic signal' };
        }

        function slugify(value = '') {
            const slug = String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            return slug || 'info';
        }

        function safeText(value, fallback = '') {
            const source = typeof value === 'string' ? value.trim() : '';
            return source || fallback;
        }

        function deriveSummaryText(update) {
            if (!update || typeof update !== 'object') return '';

            const candidates = [];
            const aiSummaryRaw = safeText(update.ai_summary);
            if (aiSummaryRaw && !isFallbackSummary(aiSummaryRaw)) {
                candidates.push(aiSummaryRaw.trim());
            }

            const summaryRaw = safeText(update.summary);
            if (summaryRaw && !isFallbackSummary(summaryRaw)) {
                candidates.push(summaryRaw.trim());
            }

            const altFields = [
                update.description,
                update.details,
                update.detail,
                update.body,
                update.content,
                update.excerpt,
                update.ai_summary_full,
                update.ai_summary_long,
                update.ai_summary_extended
            ];

            altFields.forEach(value => {
                if (value == null) return;
                const raw = typeof value === 'string' ? value : String(value);
                const textValue = raw.trim();
                if (textValue && !isFallbackSummary(textValue)) {
                    candidates.push(textValue);
                }
            });

            const impactText = safeText(update.impact);
            if (impactText) {
                candidates.push(impactText.trim());
            }

            return candidates.find(Boolean) || '';
        }

        function buildContentTypeBadge(update) {
            const rawType = update.content_type || update.contentType || 'OTHER';
            const normalized = String(rawType || 'OTHER').trim().toUpperCase() || 'OTHER';
            const badgeClass = normalized.toLowerCase().replace(/[^a-z0-9-]/g, '-');
            const badgeText = normalized === 'OTHER' ? 'INFO' : normalized;
            return '<span class="content-type-badge ' + badgeClass + '">' + escapeHtml(badgeText) + '</span>';
        }

        function getRiskScoreInfo(update, level) {
            const baseline = level || 'Informational';
            const normalized = baseline.toLowerCase();
            const rawScore = update.business_impact_score ?? update.businessImpactScore;
            const numericScore = Number(rawScore);
            const hasScore = Number.isFinite(numericScore);
            const clampedScore = hasScore ? Math.min(10, Math.max(0, numericScore)) : null;
            let variant;
            if (clampedScore != null) {
                if (clampedScore >= 8) {
                    variant = 'risk-critical';
                } else if (clampedScore >= 5) {
                    variant = 'risk-elevated';
                } else {
                    variant = 'risk-low';
                }
            } else if (normalized.includes('significant') || normalized.includes('high')) {
                variant = 'risk-critical';
            } else if (normalized.includes('moderate') || normalized.includes('medium')) {
                variant = 'risk-elevated';
            } else {
                variant = 'risk-low';
            }

            let displayScore = null;
            if (clampedScore != null) {
                const rounded = Math.round(clampedScore * 10) / 10;
                displayScore = rounded.toFixed(1).replace(/\.0$/, '');
            }

            return { variant, label: baseline, score: displayScore };
        }

        function buildRiskScoreBadge(update, level) {
            const info = getRiskScoreInfo(update, level);
            const label = info.label ? escapeHtml(info.label) : '';
            const variantClass = info.variant || 'risk-low';
            if (info.score != null) {
                return '<div class="risk-score-badge ' + variantClass + '"><span class="risk-score-value">' + escapeHtml(info.score) + '</span>' + (label ? '<span class="risk-score-label">' + label + '</span>' : '') + '</div>';
            }
            return '<div class="risk-score-badge ' + variantClass + '"><span class="risk-score-label">' + label + '</span></div>';
        }

        function renderSectorTags(update) {
            const sectors = Array.isArray(update.primarySectors)
                ? update.primarySectors
                : Array.isArray(update.firm_types_affected)
                    ? update.firm_types_affected
                    : update.sector
                        ? [update.sector]
                        : [];

            return sectors.slice(0, 3).map(sector => {
                const value = String(sector ?? '').trim();
                if (!value) return '';
                const label = escapeHtml(value);
                return '<span class="sector-tag" data-sector="' + label + '">' + label + '</span>';
            }).join('');
        }

        function buildDetailItems(update) {
            const fields = [
                { label: 'Regulatory Area', value: safeText(update.area || update.regulatory_area || update.regulatoryArea || '') },
                update.business_impact_score != null && {
                    label: 'Impact Score',
                    value: safeText(String(update.business_impact_score)) + '/10'
                },
                update.urgency && {
                    label: 'Urgency',
                    value: safeText(update.urgency)
                },
                update.keyDates && {
                    label: 'Key Dates',
                    value: safeText(update.keyDates)
                },
                update.compliance_deadline && {
                    label: 'Compliance Deadline',
                    value: safeText(formatDateDisplay(update.compliance_deadline || update.complianceDeadline))
                },
                update.complianceActions && {
                    label: 'Required Actions',
                    value: safeText(update.complianceActions)
                }
            ].filter(Boolean);

            if (!fields.length) return '';

            const items = fields.map(field => {
                return '<div class="detail-item"><div class="detail-label">' + escapeHtml(field.label) + '</div><div class="detail-value">' + escapeHtml(field.value) + '</div></div>';
            }).join('');

            return '<div class="update-details">' + items + '</div>';
        }

        function generateUpdateCard(update) {
            const impactLevel = update.impactLevel || update.impact_level || 'Informational';
            const urgency = update.urgency || 'Low';
            const publishedAt = parseDate(update.publishedDate || update.published_date || update.fetchedDate || update.createdAt);
            const publishedDate = formatDateDisplay(publishedAt || new Date());
            const isoDate = publishedAt ? publishedAt.toISOString() : '';
            const summarySource = deriveSummaryText(update);
            const summaryText = summarySource ? truncateText(summarySource, 260) : 'No summary available';
            const headline = safeText(update.headline, update.title || '');
            const authority = safeText(update.authority, 'Unknown authority');

            const idAttr = escapeAttribute(String(update.id || ''));
            const urlAttr = escapeAttribute(update.url || '');
            const authorityAttr = escapeAttribute(update.authority || '');
            const impactAttr = escapeAttribute(impactLevel);
            const urgencyAttr = escapeAttribute(urgency);
            const dateAttr = escapeAttribute(isoDate || '');
            const summaryAttr = escapeAttribute(summarySource || '');
            const publishedAttr = escapeAttribute(update.published_date || update.publishedDate || isoDate || '');
            const regulatoryArea = safeText(update.regulatory_area || update.regulatoryArea || update.area || '');
            const regulatoryAttr = escapeAttribute(regulatoryArea);
            const contentBadge = buildContentTypeBadge(update);
            const riskBadge = buildRiskScoreBadge(update, impactLevel);
            const details = buildDetailItems(update);
            const sectorTags = renderSectorTags(update);

            return (
                '<div class="update-card" ' +
                    'data-id="' + idAttr + '" ' +
                    'data-url="' + urlAttr + '" ' +
                    'data-authority="' + authorityAttr + '" ' +
                    'data-impact="' + impactAttr + '" ' +
                    'data-urgency="' + urgencyAttr + '" ' +
                    'data-date="' + dateAttr + '" ' +
                    'data-summary="' + summaryAttr + '" ' +
                    'data-published="' + publishedAttr + '" ' +
                    'data-regulatory-area="' + regulatoryAttr + '">' +
                    '<div class="update-header">' +
                        '<div class="update-meta-primary">' +
                            '<span class="authority-badge">' + escapeHtml(authority) + '</span>' +
                            '<span class="date-badge">' + escapeHtml(publishedDate) + '</span>' +
                            contentBadge +
                        '</div>' +
                        '<div class="update-meta-secondary">' +
                            riskBadge +
                            '<div class="update-actions">' +
                                '<button class="action-btn update-action-btn bookmark-btn" data-update-id="' + idAttr + '" title="Bookmark" aria-label="Bookmark">Star</button>' +
                                '<button class="action-btn update-action-btn share-btn" data-update-id="' + idAttr + '" data-update-url="' + urlAttr + '" title="Share" aria-label="Share">Link</button>' +
                                '<button class="action-btn update-action-btn details-btn" data-update-id="' + idAttr + '" data-update-url="' + urlAttr + '" title="View details" aria-label="View details">View</button>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<h3 class="update-headline">' +
                        '<a href="' + (update.url ? escapeAttribute(update.url) : '#') + '" target="_blank" rel="noopener">' +
                            escapeHtml(headline || 'Untitled update') +
                        '</a>' +
                    '</h3>' +
                    '<div class="update-summary">' + escapeHtml(summaryText) + '</div>' +
                    details +
                    '<div class="update-footer">' +
                        '<div class="sector-tags">' + sectorTags + '</div>' +
                        '<div class="ai-features"></div>' +
                    '</div>' +
                '</div>'
            );
        }

        async function initializeDashboard() {
            try {
                const filters = window.currentFilters || {};
                setActiveCategoryButton(filters.category || 'all');
                initializeFilters();
                setupSearchBox();
                updateWorkspaceCounts(workspaceStats);

                const isDashboardPage = Boolean(document.querySelector('.dashboard-header'));
                if (!isDashboardPage) {
                    console.log('[dashboard] Skipping dashboard-specific initialization on this view');
                    return;
                }

                const initialUpdates = (window.dashboardInitialState && Array.isArray(window.dashboardInitialState.updates))
                    ? window.dashboardInitialState.updates
                    : Array.isArray(window.initialUpdates)
                        ? window.initialUpdates
                        : [];
                if (initialUpdates.length) {
                    generateRelevanceBasedStreams(initialUpdates);
                }

                if (analyticsPreviewData) {
                    updateAnalyticsPreview();
                }

                await checkSystemStatus();
                await loadIntelligenceStreams().catch(error => console.warn('Stream refresh failed:', error));
                await loadAnalyticsPreview().catch(error => console.warn('Analytics refresh failed:', error));
                await checkLiveSubscriptions().catch(error => console.warn('Workspace stats refresh failed:', error));

                if (typeof updateLiveCounters === 'function') {
                    updateLiveCounters();
                    if (!window.__countersInterval) {
                        window.__countersInterval = setInterval(() => updateLiveCounters(), 30000);
                    }
                }
            } catch (error) {
                console.error('Dashboard initialization error:', error);
            }
        }


        async function initializeSystem() {
            return initializeDashboard();
        }

        window.initializeFilters = initializeFilters;
        window.setActiveCategoryButton = setActiveCategoryButton;
        window.setupSearchBox = setupSearchBox;
        window.updateWorkspaceCounts = updateWorkspaceCounts;
        window.updateAnalyticsPreview = updateAnalyticsPreview;
        window.generateRelevanceBasedStreams = generateRelevanceBasedStreams;
        window.toggleStreamExpansion = toggleStreamExpansion;
        window.generateUpdateCard = generateUpdateCard;
        window.checkSystemStatus = checkSystemStatus;
        window.initializeSystem = initializeSystem;

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeDashboard);
        } else {
            initializeDashboard();
        }
`;
}

module.exports = { renderInitializationSection };
