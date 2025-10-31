// src/routes/templates/clientScripts.js
// Complete solution with WorkspaceModule included

const { getSectorAliasMap } = require('../../utils/sectorTaxonomy')

function sanitizeAliasMap(map) {
  if (typeof map === 'string') {
    return map.replace(/</g, '\\u003c')
  }
  const source = map || getSectorAliasMap()
  return JSON.stringify(source).replace(/</g, '\\u003c')
}

function getWorkspaceBootstrapScripts(aliasMap) {
  const aliasMapJson = sanitizeAliasMap(aliasMap)

  return `
    <!-- Sector alias bootstrap -->
    <script>
        window.__sectorAliasMap = window.__sectorAliasMap || ${aliasMapJson};
    </script>
    <!-- Include Workspace Module First -->
    <script src="/js/workspaceModule.js"></script>
  `
}

function getClientScripts(options = {}) {
  const {
    includeWorkspaceModule = true,
    includeAliasBootstrap = true,
    aliasMap
  } = options

  const scripts = []
  let aliasMapJson

  if (includeAliasBootstrap || includeWorkspaceModule) {
    aliasMapJson = sanitizeAliasMap(aliasMap)
  }

  if (includeAliasBootstrap) {
    scripts.push(`
    <!-- Sector alias bootstrap -->
    <script>
        window.__sectorAliasMap = window.__sectorAliasMap || ${aliasMapJson};
    </script>
    `)
  }

  if (includeWorkspaceModule) {
    scripts.push(`
    <!-- Include Workspace Module First -->
    <script src="/js/workspaceModule.js"></script>
    `)
  }

  scripts.push(`
    <!-- Then include the rest of the client scripts -->
    ${getClientScriptsContent()}
    `)

  return scripts.join('\n')
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

        function escapeHtml(value) {
            return String(value ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function escapeAttribute(value) {
            return String(value ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function getSectorAliasMap() {
            const map = window.__sectorAliasMap;
            return map && typeof map === 'object' ? map : {};
        }

        function normalizeSectorLabel(value) {
            if (value == null) return '';
            const raw = String(value).trim();
            if (!raw) return '';
            const key = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
            const aliasMap = getSectorAliasMap();
            return aliasMap[key] || raw;
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
            console.log('[refresh] Updating live counters...');
            
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
            console.log('[refresh] Refresh data called');

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

        function ensureFilterState() {
            if (!window.currentFilters || typeof window.currentFilters !== 'object') {
                window.currentFilters = { category: 'all', sort: 'newest' };
            }
            if (!window.currentFilters.category) {
                window.currentFilters.category = 'all';
            }
            if (!window.currentFilters.sort) {
                window.currentFilters.sort = 'newest';
            }
            return window.currentFilters;
        }

        function formatFilterLabel(value) {
            if (!value) return '';
            return String(value)
                .replace(/[-_]/g, ' ')
                .replace(/\b([a-zA-Z])/g, char => char.toUpperCase());
        }

        function hasActiveNonCategoryFilters(filters) {
            return Boolean(
                filters.authority ||
                filters.sector ||
                filters.impact ||
                filters.urgency ||
                filters.range ||
                filters.search
            );
        }

        async function filterByCategory(category) {
            console.log('Filtering by category:', category);
            try {
                let filters = ensureFilterState();
                const previousSort = filters.sort || 'newest';

                if (hasActiveNonCategoryFilters(filters)) {
                    clearAllFilters({ preserveSort: true, silent: true, skipApply: true });
                    filters = ensureFilterState();
                    filters.sort = previousSort;
                    showMessage('Other filters cleared to apply quick category.', 'info');
                }

                filters.category = category || 'all';

                await applyCurrentFilters();

                const normalized = (filters.category || 'all').toLowerCase();
                const message = normalized === 'all'
                    ? 'Showing all updates'
                    : 'Filtered to ' + formatFilterLabel(filters.category) + ' updates';
                showMessage(message, 'info');
            } catch (error) {
                console.error('Filter error:', error);
                showMessage('Filter failed', 'error');
            }
        }

        async function filterByAuthority(authority) {
            console.log('Filtering by authority:', authority);
            try {
                const filters = ensureFilterState();
                if (authority) {
                    filters.authority = authority;
                } else {
                    delete filters.authority;
                }

                await applyCurrentFilters();

                showMessage(authority ? 'Showing ' + authority + ' updates' : 'Showing all authorities', 'info');
            } catch (error) {
                console.error('Authority filter error:', error);
                showMessage('Authority filter failed', 'error');
            }
        }

        async function filterBySector(sector) {
            console.log('Filtering by sector:', sector);
            try {
                const filters = ensureFilterState();
                if (sector) {
                    filters.sector = sector;
                } else {
                    delete filters.sector;
                }

                await applyCurrentFilters();

                showMessage(sector ? 'Showing ' + sector + ' updates' : 'Showing all sectors', 'info');
            } catch (error) {
                console.error('Sector filter error:', error);
                showMessage('Sector filter failed', 'error');
            }
        }

        async function filterByImpactLevel(impact) {
            console.log('Filtering by impact level:', impact);
            try {
                const filters = ensureFilterState();
                if (impact) {
                    filters.impact = impact;
                } else {
                    delete filters.impact;
                }

                await applyCurrentFilters();

                showMessage(impact ? 'Showing ' + impact + ' impact updates' : 'Showing all impact levels', 'info');
            } catch (error) {
                console.error('Impact filter error:', error);
                showMessage('Impact filter failed', 'error');
            }
        }

        async function filterByDateRange(range) {
            console.log('Filtering by date range:', range);
            try {
                const filters = ensureFilterState();
                if (range) {
                    filters.range = range;
                } else {
                    delete filters.range;
                }

                await applyCurrentFilters();

                const labelMap = {
                    today: 'today',
                    week: 'this week',
                    'this-week': 'this week',
                    month: 'this month',
                    quarter: 'this quarter'
                };
                const normalized = (range || '').toLowerCase();
                const message = range
                    ? 'Showing updates from ' + (labelMap[normalized] || formatFilterLabel(range))
                    : 'Showing all time periods';
                showMessage(message, 'info');
            } catch (error) {
                console.error('Date filter error:', error);
                showMessage('Date range filter failed', 'error');
            }
        }

        async function filterByUrgency(urgency) {
            console.log('Filtering by urgency:', urgency);
            try {
                const filters = ensureFilterState();
                if (urgency) {
                    filters.urgency = urgency;
                } else {
                    delete filters.urgency;
                }

                await applyCurrentFilters();

                showMessage(urgency ? 'Showing ' + urgency + ' urgency updates' : 'Showing all urgency levels', 'info');
            } catch (error) {
                console.error('Urgency filter error:', error);
                showMessage('Urgency filter failed', 'error');
            }
        }
        
        // Analytics refresh function
        window.refreshAnalytics = async function() {
            console.log('[analytics] Refreshing analytics...');

            const btn = event?.target;
            if (btn) {
                btn.disabled = true;
                btn.textContent = '[refresh] Refreshing...';
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
                    btn.textContent = '[refresh] Refresh Analytics';
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
        let availableSectors = Array.isArray(window.availableSectors)
            ? Array.from(new Set(window.availableSectors.map(normalizeSectorLabel).filter(Boolean)))
            : [];
        let workspaceStats = { pinnedItems: 0, savedSearches: 0, activeAlerts: 0 };
        let analyticsPreviewData = null;
        const ANALYTICS_LEVELS = ['Significant', 'Moderate', 'Informational'];
        const DEFAULT_ANALYTICS_PERIOD = 'month';
        let analyticsState = {
            filters: { authority: '', sector: '', period: DEFAULT_ANALYTICS_PERIOD },
            impactDistribution: null
        };
        let expandedStreams = new Set();

        // CRITICAL: These must be window-scoped for FilterModule access
        window.selectedAuthorities = window.selectedAuthorities || new Set();
        window.selectedImpactLevels = window.selectedImpactLevels || new Set();
        window.selectedUrgencies = window.selectedUrgencies || new Set();

        let currentFilter = null;
        let pinnedUrls = new Set();
        let currentOffset = 0;
        let itemsPerPage = 20;
        let shareInProgress = false;

        if (Array.isArray(window.__workspacePinnedUrls)) {
            setPinnedUrlSet(window.__workspacePinnedUrls);
        }

        if (window.__workspaceStats && typeof window.__workspaceStats === 'object') {
            workspaceStats = Object.assign({}, workspaceStats, window.__workspaceStats);
        }

        function toNumericCount(value, fallback = 0) {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : fallback;
        }

        function setPinnedUrlSet(values) {
            if (Array.isArray(values)) {
                pinnedUrls = new Set(values.filter(Boolean).map(value => String(value)));
            } else if (values instanceof Set) {
                pinnedUrls = new Set(Array.from(values).filter(Boolean).map(value => String(value)));
            } else {
                pinnedUrls = new Set();
            }
            workspaceStats.pinnedItems = pinnedUrls.size;
        }

        async function synchronizePinnedState(options = {}) {
            const module = window.WorkspaceModule;
            if (!module) return pinnedUrls;
            try {
                let readyPromise = null;
                if (typeof module.ready === 'function') {
                    readyPromise = module.ready();
                } else if (typeof module.init === 'function') {
                    readyPromise = module.init();
                }
                if (readyPromise && typeof readyPromise.then === 'function') {
                    await readyPromise;
                }
                if (typeof module.getPinnedUrls === 'function') {
                    const urls = module.getPinnedUrls();
                    if (Array.isArray(urls)) {
                        setPinnedUrlSet(urls);
                        if (!options.silent) {
                            updateWorkspaceCounts();
                        }
                    }
                }
            } catch (error) {
                console.warn('Pinned synchronization failed:', error);
            }
            return pinnedUrls;
        }

        window.addEventListener('workspace:pins', (event) => {
            const detail = event && event.detail;
            const urls = Array.isArray(detail?.urls)
                ? detail.urls
                : Array.isArray(detail)
                    ? detail
                    : [];
            setPinnedUrlSet(urls);
            updateWorkspaceCounts();
        });

        window.addEventListener('workspace:stats', (event) => {
            const detail = event && event.detail;
            if (detail && typeof detail === 'object') {
                if ('pinnedItems' in detail) {
                    workspaceStats.pinnedItems = toNumericCount(detail.pinnedItems, workspaceStats.pinnedItems);
                }
                if ('savedSearches' in detail) {
                    workspaceStats.savedSearches = toNumericCount(detail.savedSearches, workspaceStats.savedSearches);
                }
                if ('activeAlerts' in detail) {
                    workspaceStats.activeAlerts = toNumericCount(detail.activeAlerts, workspaceStats.activeAlerts);
                }
                updateWorkspaceCounts(detail);
            }
        });

        let systemStatus = {
            database: false,
            api: false,
            overall: false
        };
        let priorityHighlightLookup = {};
        let reviewedHighlightIds = new Set();

        const serverFilterCache = new Map();

        function buildFilterKey(filters) {
            return JSON.stringify({
                category: filters.category || 'all',
                authority: filters.authority || null,
                sector: filters.sector || null,
                impact: filters.impact || null,
                urgency: filters.urgency || null,
                range: filters.range || null,
                search: filters.search || null,
                sort: filters.sort || 'newest'
            });
        }

        function buildFilterQuery(filters) {
            const params = new URLSearchParams();
            if (filters.category && filters.category !== 'all') params.set('category', filters.category);
            if (filters.authority) params.set('authority', String(filters.authority));
            if (filters.sector) params.set('sector', String(filters.sector));
            if (filters.impact) params.set('impact', String(filters.impact));
            if (filters.urgency) params.set('urgency', String(filters.urgency));
            if (filters.range) params.set('range', String(filters.range));
            if (filters.search) params.set('search', String(filters.search));
            params.set('limit', '100');
            return params;
        }

        async function fetchUpdatesFromServer(filters) {
            const key = buildFilterKey(filters);
            if (serverFilterCache.has(key)) {
                return serverFilterCache.get(key);
            }

            try {
                showMessage('Loading more updates for this filter...', 'info');
                const params = buildFilterQuery(filters);
                const response = await fetch('/api/updates?' + params.toString());
                const data = await response.json();
                if (data.success && Array.isArray(data.updates)) {
                    serverFilterCache.set(key, data.updates);
                    return data.updates;
                }
            } catch (error) {
                console.error('Remote filter fetch failed:', error);
                showMessage('Unable to load additional updates for this filter.', 'error');
            }
            return [];
        }

        function shouldFetchFromServer(filters, localCount) {
            if (localCount > 0) return false;
            if (filters.category && filters.category !== 'all') return true;
            if (filters.authority) return true;
            if (filters.sector) return true;
            if (filters.impact) return true;
            if (filters.urgency) return true;
            if (filters.range) return true;
            if (filters.search) return true;
            return false;
        }

        function getBusinessImpactScore(update) {
            return Number(update.business_impact_score || update.businessImpactScore || 0);
        }

        function renderImpactGauge(score, compact = false) {
            if (score == null || isNaN(score)) {
                return '<div class="impact-gauge ' + (compact ? 'compact ' : '') + 'impact-low">' +
                    '<div class="impact-gauge-track"><div class="impact-gauge-fill impact-low" style="width:0%"></div></div>' +
                    '<span class="impact-gauge-label">N/A</span>' +
                '</div>';
            }

            const clamped = Math.max(0, Math.min(10, Number(score)));
            const percent = Math.round((clamped / 10) * 100);
            const level = clamped >= 7 ? 'impact-high' : clamped >= 4 ? 'impact-medium' : 'impact-low';

            return '<div class="impact-gauge ' + (compact ? 'compact ' : '') + level + '">' +
                '<div class="impact-gauge-track">' +
                    '<div class="impact-gauge-fill ' + level + '" style="width:' + percent + '%"></div>' +
                '</div>' +
                '<span class="impact-gauge-label">' + clamped + '/10</span>' +
            '</div>';
        }

        function isHighImpactUpdate(update) {
            return (
                (update.impactLevel === 'Significant' || update.impact_level === 'Significant') ||
                getBusinessImpactScore(update) >= 7 ||
                (update.urgency || '').toLowerCase() === 'high'
            );
        }

        function getDeadlineDate(update) {
            const raw = update.compliance_deadline || update.complianceDeadline || update.deadline;
            if (!raw) return null;
            const date = new Date(raw);
            return isNaN(date) ? null : date;
        }

        function computePriorityHighlights(updates) {
            if (!updates || !Array.isArray(updates)) return [];

            const now = new Date();
            const upcomingWindow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
            const highlights = [];
            const seen = new Set();

            const addHighlight = (update, reason) => {
                const key = String(update.id || update.url || update.headline || Math.random());
                if (seen.has(key)) return;
                seen.add(key);
                highlights.push({ update, reason });
            };

            const highImpactUpdates = updates
                .filter(isHighImpactUpdate)
                .sort((a, b) => getBusinessImpactScore(b) - getBusinessImpactScore(a));

            highImpactUpdates.forEach(update => addHighlight(update, 'High Impact'));

            const deadlineUpdates = updates
                .filter(update => {
                    const deadline = getDeadlineDate(update);
                    return deadline && deadline >= now && deadline <= upcomingWindow;
                })
                .sort((a, b) => getDeadlineDate(a) - getDeadlineDate(b));

            deadlineUpdates.forEach(update => addHighlight(update, 'Upcoming Deadline'));

            const urgentUpdates = updates
                .filter(update => (update.urgency || '').toLowerCase() === 'high')
                .sort((a, b) => {
                    const scoreB = getBusinessImpactScore(b);
                    const scoreA = getBusinessImpactScore(a);
                    return scoreB - scoreA;
                });

            urgentUpdates.forEach(update => addHighlight(update, 'Urgent Task'));

            return highlights.slice(0, 6);
        }

        function renderPriorityHighlights() {
            const container = document.getElementById('priorityHighlights');
            if (!container) return;

            const items = computePriorityHighlights(window.originalUpdates || []);
            if (!items.length) {
                container.innerHTML = '<div class="priority-empty">No high impact priorities detected this week. Keep an eye on new updates.</div>';
                priorityHighlightLookup = {};
                return;
            }

            const cards = items.map(({ update, reason }, index) => {
                const rawId = update.id || update.url || ('priority-' + index);
                const safeId = rawId.toString().replace(/[^a-zA-Z0-9_-]/g, '_');
                priorityHighlightLookup[safeId] = update;

                const summarySource = update.ai_summary || update.summary || 'No summary available';
                const summaryText = truncateText(summarySource, 200);
                const publishedDate = formatDateDisplay(update.publishedDate || update.published_date || update.fetchedDate || update.createdAt);
                const deadline = getDeadlineDate(update);
                const gauge = renderImpactGauge(getBusinessImpactScore(update), true);
                const urgency = (update.urgency || 'Low').toLowerCase();
                const reasonClass = reason === 'Upcoming Deadline' ? 'deadline' : 'high-impact';
                const authority = escapeHtml(update.authority || 'Unknown authority');
                const headline = escapeHtml(update.headline || 'No headline available');
                const summaryEscaped = escapeHtml(summaryText);
                const detailsEscaped = escapeHtml(summarySource);
                const safeUrl = update.url ? escapeHtml(update.url) : null;
                const link = safeUrl ? '<a href="' + safeUrl + '" target="_blank" rel="noopener">Open source ^</a>' : '';
                const reviewedClass = reviewedHighlightIds.has(safeId) ? ' reviewed' : '';

                let card = '';
                card += '<div class="priority-card' + reviewedClass + '" id="priority-card-' + safeId + '">';
                card += '<div class="priority-card-header">';
                card += '<div class="priority-card-meta">';
                card += '<span class="priority-badge ' + reasonClass + '">' + reason + '</span>';
                card += '<span class="stat-subtext">' + publishedDate + ' - ' + authority + '</span>';
                card += '</div>';
                card += '<button class="priority-toggle" data-priority-toggle="' + safeId + '">Details</button>';
                card += '</div>';
                card += '<h3 class="priority-card-title">' + headline + '</h3>';
                card += '<div class="priority-card-summary" id="priority-summary-' + safeId + '">' + summaryEscaped + '</div>';
                card += '<div class="priority-card-metrics">';
                card += gauge;
                card += '<span class="priority-urgency urgency-' + urgency + '">' + (update.urgency || 'Low') + '</span>';
                if (deadline) {
                    card += '<span class="priority-deadline">Due ' + formatDateDisplay(deadline) + '</span>';
                }
                card += '</div>';
                card += '<div class="priority-actions">';
                card += '<button class="priority-action-btn primary" data-priority-action="workspace" data-highlight-id="' + safeId + '">Add to Workspace</button>';
                card += '<button class="priority-action-btn secondary" data-priority-action="assign" data-highlight-id="' + safeId + '">Assign Task</button>';
                card += '<button class="priority-action-btn muted" data-priority-action="reviewed" data-highlight-id="' + safeId + '">Mark as Reviewed</button>';
                card += '</div>';
                card += '<div class="priority-card-details" id="priority-details-' + safeId + '">';
                card += '<p>' + detailsEscaped + '</p>';
                card += link;
                card += '</div>';
                card += '</div>';
                return card;
            });

            container.innerHTML = cards.join('');

            if (!container.dataset.priorityBound) {
                container.addEventListener('click', function(event) {
                    const toggleBtn = event.target.closest('[data-priority-toggle]');
                    if (toggleBtn) {
                        const toggleId = toggleBtn.getAttribute('data-priority-toggle');
                        if (toggleId && window.PriorityModule && typeof PriorityModule.toggleDetails === 'function') {
                            PriorityModule.toggleDetails(toggleId);
                        }
                        return;
                    }

                    const actionBtn = event.target.closest('[data-priority-action]');
                    if (!actionBtn) return;
                    const action = actionBtn.getAttribute('data-priority-action');
                    const id = actionBtn.getAttribute('data-highlight-id');
                    if (action && id && window.PriorityModule && typeof PriorityModule.handleAction === 'function') {
                        PriorityModule.handleAction(action, id);
                    }
                });
                container.dataset.priorityBound = 'true';
            }
        }

        function togglePriorityDetails(id) {
            const card = document.getElementById('priority-card-' + id);
            if (!card) return;
            const expanded = card.classList.toggle('expanded');
            const toggleBtn = card.querySelector('.priority-toggle');
            if (toggleBtn) {
                toggleBtn.textContent = expanded ? 'Hide' : 'Details';
            }
        }

        function handlePriorityAction(action, id) {
            const update = priorityHighlightLookup[id];
            if (!update) {
                showMessage('Unable to perform action on this update.', 'error');
                return;
            }

            switch (action) {
                case 'workspace': {
                    const key = update.url || update.id || id;
                    if (typeof togglePin === 'function' && key) {
                        togglePin(key);
                    }
                    break;
                }
                case 'assign': {
                    showMessage('Task assigned to compliance team for ' + (update.authority || 'this update'), 'success');
                    break;
                }
                case 'reviewed': {
                    reviewedHighlightIds.add(id);
                    const card = document.getElementById('priority-card-' + id);
                    if (card) {
                        card.classList.add('reviewed');
                    }
                    showMessage('Marked as reviewed', 'info');
                    break;
                }
                default:
                    showMessage('Action not available yet.', 'warning');
            }
        }
        
        // =================
        // INITIALIZATION FUNCTIONS
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
                
                console.log('[OK] Filters initialized');
            } catch (error) {
                console.error('X Error initializing filters:', error);
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

        function generateUpdateCard(update) {
            const impactLevel = update.impactLevel || update.impact_level || 'Informational'
            const urgency = update.urgency || 'Low'
            const publishedAt = parseDate(update.publishedDate || update.published_date || update.fetchedDate || update.createdAt)
            const publishedDate = formatDateDisplay(publishedAt || new Date())
            const isoDate = publishedAt ? publishedAt.toISOString() : ''
            const aiSummary = safeText(update.ai_summary)
            const useFallbackSummary = isFallbackSummary(aiSummary)
            const summaryText = !useFallbackSummary && aiSummary
                ? aiSummary
                : safeText(update.summary, '')
            const summarySource = summaryText ? summaryText.replace(/\\s+/g, ' ').trim() : ''
            const trimmedSummary = summarySource ? truncateText(summarySource, 320) : 'Summary not available'
            const headline = safeText(update.headline, update.title || '')
            const hasHeadline = Boolean(headline)
            const category = classifyUpdateTheme(update)
            const impactKey = slugify(impactLevel)
            const urgencyKey = slugify(urgency)
            const sourceLink = update.url
                ? '<a class="update-card__source" href="' + escapeAttribute(update.url) + '" target="_blank" rel="noopener">View source</a>'
                : ''
            const authoritySafe = escapeHtml(update.authority || 'Unknown authority')
            const summarySafe = escapeHtml(trimmedSummary)
            const headlineSafe = escapeHtml(headline)
            const categoryLabelSafe = category ? escapeHtml(category.label) : ''
            const impactLabelSafe = escapeHtml(impactLevel)
            const urgencyLabelSafe = escapeHtml(urgency)
            const impactScoreSafe = update.business_impact_score ? escapeHtml(String(update.business_impact_score)) : ''
            const idAttr = escapeAttribute(String(update.id || ''))
            const urlAttr = escapeAttribute(update.url || '')
            const dateAttr = escapeAttribute(isoDate || '')
            const summaryAttr = escapeAttribute(summarySource || '')
            const headlineAttr = escapeAttribute(headline)
            const authorityAttr = escapeAttribute(update.authority || '')
            const impactAttr = escapeAttribute(impactLevel)
            const urgencyAttr = escapeAttribute(urgency)
            const publishedAttr = escapeAttribute(update.published_date || update.publishedDate || isoDate || '')
            const regulatoryArea = safeText(
                update.regulatory_area ||
                update.regulatoryArea ||
                update.area ||
                ''
            )
            const regulatoryAttr = escapeAttribute(regulatoryArea)

            return (
                '<div class="update-card" ' +
                    'data-id="' + idAttr + '" ' +
                    'data-url="' + urlAttr + '" ' +
                    'data-authority="' + authorityAttr + '" ' +
                    'data-impact="' + impactAttr + '" ' +
                    'data-urgency="' + urgencyAttr + '" ' +
                    'data-date="' + dateAttr + '" ' +
                    'data-headline="' + headlineAttr + '" ' +
                    'data-summary="' + summaryAttr + '" ' +
                    'data-published="' + publishedAttr + '" ' +
                    'data-regulatory-area="' + regulatoryAttr + '">' +
                    '<header class="update-card__top">' +
                        '<div class="update-card__chips">' +
                            '<span class="update-chip authority-chip">' + authoritySafe + '</span>' +
                            '<span class="update-chip date-chip">' + publishedDate + '</span>' +
                        '</div>' +
                        (category ? '<span class="update-chip category-chip category-' + category.key + '">' + categoryLabelSafe + '</span>' : '') +
                    '</header>' +
                    '<div class="update-card__title-row">' +
                        (hasHeadline
                            ? '<h3 class="update-card__title"><a href="' + (update.url ? escapeAttribute(update.url) : '#') + '" target="_blank" rel="noopener">' + headlineSafe + '</a></h3>'
                            : '<h3 class="update-card__title update-card__title--empty">No headline provided</h3>') +
                    '</div>' +
                    '<p class="update-card__summary">' + summarySafe + '</p>' +
                    '<div class="update-card__meta-row">' +
                        '<span class="meta-pill impact-' + impactKey + '">Impact: ' + impactLabelSafe + '</span>' +
                        '<span class="meta-pill urgency-' + urgencyKey + '">Urgency: ' + urgencyLabelSafe + '</span>' +
                        (update.business_impact_score ? '<span class="meta-pill score-pill">Impact score: ' + impactScoreSafe + '</span>' : '') +
                    '</div>' +
                    '<footer class="update-card__footer">' +
                        '<div class="update-card__actions">' +
                            '<button class="action-btn update-action-btn bookmark-btn" data-update-id="' + idAttr + '" title="Bookmark" aria-label="Bookmark"><svg width="16" height="16" fill="currentColor"><path d="M3 3a2 2 0 012-2h6a2 2 0 012 2v11l-5-3-5 3V3z"/></svg></button>' +
                            '<button class="action-btn update-action-btn share-btn" data-update-id="' + idAttr + '" data-update-url="' + urlAttr + '" title="Share" aria-label="Share"><svg width="16" height="16" fill="currentColor"><path d="M11 2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zm-9 9a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0zm9 0a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0z"/></svg></button>' +
                            '<button class="action-btn update-action-btn details-btn" data-update-id="' + idAttr + '" data-update-url="' + urlAttr + '" title="View details" aria-label="View details"><svg width="16" height="16" fill="currentColor"><path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/><path fill-rule="evenodd" d="M1.38 8C2.77 5.44 5.23 3.5 8 3.5c2.77 0 5.23 1.94 6.62 4.5-1.39 2.56-3.85 4.5-6.62 4.5-2.77 0-5.23-1.94-6.62-4.5zm9.12 0a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/></svg></button>' +
                            '<button class="action-btn update-action-btn quick-note-btn" data-update-id="' + idAttr + '" data-update-url="' + urlAttr + '" title="Create quick note" aria-label="Create quick note"><svg width="16" height="16" fill="currentColor"><path d="M4 1.5H3a2 2 0 00-2 2V14a2 2 0 002 2h10a2 2 0 002-2V3.5a2 2 0 00-2-2h-1v1h1a1 1 0 011 1V14a1 1 0 01-1 1H3a1 1 0 01-1-1V3.5a1 1 0 011-1h1v-1z"/><path d="M9.5 1a.5.5 0 01.5.5v1a.5.5 0 01-.5.5h-3a.5.5 0 01-.5-.5v-1a.5.5 0 01.5-.5h3zm-3-1A1.5 1.5 0 005 1.5v1A1.5 1.5 0 006.5 4h3A1.5 1.5 0 0011 2.5v-1A1.5 1.5 0 009.5 0h-3z"/></svg></button>' +
                        '</div>' +
                        sourceLink +
                    '</footer>' +
                '</div>'
            )
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

            return sectors.slice(0, 3).map(sector => {
                const value = String(sector ?? '').trim();
                if (!value) return '';
                const label = escapeHtml(value);
                return '<span class="sector-tag" data-sector="' + label + '">' + label + '</span>';
            }).join('');
        }

        function getAIFeatures(update) {
            const features = [];

            // Primary AI features (if available)
            if (update.business_impact_score && update.business_impact_score >= 7) {
                features.push('<span class="ai-feature high-impact">Hot High Impact (' + update.business_impact_score + '/10)</span>');
            }

            if (update.urgency === 'High') {
                features.push('<span class="ai-feature urgent">Alert Urgent</span>');
            }

            if (update.ai_tags && update.ai_tags.includes('has:penalty')) {
                features.push('<span class="ai-feature enforcement">Alert Enforcement Action</span>');
            }

            if (update.ai_confidence_score && update.ai_confidence_score >= 0.9) {
                features.push('<span class="ai-feature high-confidence">AI High Confidence (' + Math.round(update.ai_confidence_score * 100) + '%)</span>');
            }

            // Fallback features based on available data
            if (features.length === 0) {
                // Check if headline/summary contains enforcement keywords
                const text = (update.headline + ' ' + (update.summary || update.ai_summary || '')).toLowerCase();

                if (text.includes('fine') || text.includes('penalty') || text.includes('enforcement') || text.includes('breach')) {
                    features.push('<span class="ai-feature enforcement">Law Enforcement</span>');
                }

                if (text.includes('consultation') || text.includes('draft') || text.includes('guidance')) {
                    features.push('<span class="ai-feature guidance">Note Guidance</span>');
                }

                if (text.includes('deadline') || text.includes('compliance') || text.includes('must')) {
                    features.push('<span class="ai-feature deadline">Date Action Required</span>');
                }

                // Show authority as a feature if no other features found
                if (features.length === 0 && update.authority) {
                    features.push('<span class="ai-feature authority">Institution ' + update.authority + '</span>');
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
            workspaceStats.pinnedItems = pinnedUrls.size;
            updateWorkspaceCounts();
        }
        
        function updateWorkspaceCounts(statOverrides) {
            if (statOverrides && typeof statOverrides === 'object') {
                if ('pinnedItems' in statOverrides) {
                    workspaceStats.pinnedItems = toNumericCount(statOverrides.pinnedItems, workspaceStats.pinnedItems);
                }
                if ('savedSearches' in statOverrides) {
                    workspaceStats.savedSearches = toNumericCount(statOverrides.savedSearches, workspaceStats.savedSearches);
                }
                if ('activeAlerts' in statOverrides) {
                    workspaceStats.activeAlerts = toNumericCount(statOverrides.activeAlerts, workspaceStats.activeAlerts);
                }
            }

            if (!Number.isFinite(workspaceStats.pinnedItems)) {
                workspaceStats.pinnedItems = pinnedUrls.size;
            }

            const pinnedEl = document.getElementById('pinnedCount');
            if (pinnedEl) pinnedEl.textContent = workspaceStats.pinnedItems ?? pinnedUrls.size;

            const savedEl = document.getElementById('savedSearchesCount');
            if (savedEl) savedEl.textContent = workspaceStats.savedSearches ?? 0;

            const alertsEl = document.getElementById('customAlertsCount');
            if (alertsEl) alertsEl.textContent = workspaceStats.activeAlerts ?? 0;
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

            console.log('Growth Initializing analytics dashboard...');

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
        
        async function applyActiveFilters() {
            console.log('Target Applying filters from UI controls');

            try {
                const filters = ensureFilterState();

                const authorityValues = Array.from(window.selectedAuthorities).filter(Boolean);
                if (authorityValues.length > 0) {
                    filters.authority = authorityValues.join(',');
                } else {
                    delete filters.authority;
                }

                const impactValues = Array.from(window.selectedImpactLevels).filter(Boolean);
                if (impactValues.length > 0) {
                    filters.impact = impactValues.join(',');
                } else {
                    delete filters.impact;
                }

                const urgencyValues = Array.from(window.selectedUrgencies).filter(Boolean);
                if (urgencyValues.length > 0) {
                    filters.urgency = urgencyValues.join(',');
                } else {
                    delete filters.urgency;
                }

                const searchBox = document.getElementById('searchBox') || document.getElementById('search-input');
                if (searchBox) {
                    const term = searchBox.value.trim();
                    if (term) {
                        filters.search = term;
                    } else {
                        delete filters.search;
                    }
                }

                const activeOptions = document.querySelectorAll('.filter-option.active');
                const pendingFilters = {};

                activeOptions.forEach(option => {
                    const type = (option.dataset.filterType || option.getAttribute('data-filter-type') || '').toLowerCase();
                    const value = option.dataset.filterValue || option.getAttribute('data-filter-value') || option.value || option.textContent?.trim();
                    if (!type || !value) return;

                    if (!pendingFilters[type]) {
                        pendingFilters[type] = [];
                    }
                    pendingFilters[type].push(value);
                });

                Object.entries(pendingFilters).forEach(([type, values]) => {
                    const uniqueValues = Array.from(new Set(values.map(String).filter(Boolean)));
                    switch (type) {
                        case 'category':
                            if (uniqueValues.length > 0) {
                                filters.category = uniqueValues[0];
                            }
                            break;
                        case 'authority':
                            filters.authority = uniqueValues.join(',');
                            break;
                        case 'sector':
                            filters.sector = uniqueValues.join(',');
                            break;
                        case 'impact':
                            filters.impact = uniqueValues.join(',');
                            break;
                        case 'urgency':
                            filters.urgency = uniqueValues.join(',');
                            break;

                        case 'range':
                        case 'date':
                            if (uniqueValues.length > 0) {
                                filters.range = uniqueValues[0];
                            }
                            break;
                        case 'search':
                            if (uniqueValues.length > 0) {
                                filters.search = uniqueValues[0];
                            }
                            break;
                        default:
                            break;
                    }
                });

                await applyCurrentFilters();
            } catch (error) {
                console.error('X Error applying filters:', error);
                showMessage('Error applying filters: ' + error.message, 'error');
            }
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
            console.log('Launch Initializing system...');
            
            try {
                // Initialize WorkspaceModule if it exists
                if (window.WorkspaceModule && window.WorkspaceModule.init) {
                    await window.WorkspaceModule.init();
                    await synchronizePinnedState({ silent: true });
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

                await applyCurrentFilters();
                renderPriorityHighlights();

                // Event delegation for action buttons (bookmark, share, details)
                document.addEventListener('click', function(e) {
                    // Check for action buttons
                    const actionBtn = e.target.closest('.action-btn, .timeline-btn');
                    if (actionBtn) {
                        const updateId = actionBtn.dataset.updateId;
                        const updateUrl = actionBtn.dataset.updateUrl;

                        if (actionBtn.classList.contains('bookmark-btn') && updateId) {
                            e.preventDefault();
                            if (typeof bookmarkUpdate === 'function') {
                                bookmarkUpdate(updateId);
                            }
                        } else if (actionBtn.classList.contains('share-btn') && updateId) {
                            e.preventDefault();
                            if (typeof shareUpdate === 'function') {
                                shareUpdate(updateId);
                            }
                        } else if (actionBtn.classList.contains('details-btn') && updateId) {
                            e.preventDefault();
                            if (typeof viewDetails === 'function') {
                                viewDetails(updateId);
                            }
                        } else if (actionBtn.classList.contains('quick-note-btn') && updateId) {
                            e.preventDefault();
                            if (typeof window.openQuickNoteComposer === 'function') {
                                const card = actionBtn.closest('.update-card');
                                const payload = {
                                    updateId,
                                    url: updateUrl || (card ? card.dataset.url : ''),
                                    headline: card ? card.dataset.headline || '' : '',
                                    summary: card ? card.dataset.summary || '' : '',
                                    authority: card ? card.dataset.authority || '' : '',
                                    impact: card ? card.dataset.impact || '' : '',
                                    urgency: card ? card.dataset.urgency || '' : '',
                                    published: card ? card.dataset.published || card.dataset.date || '' : '',
                                    regulatoryArea: card ? card.dataset.regulatoryArea || '' : ''
                                };
                                try {
                                    window.openQuickNoteComposer(payload);
                                } catch (error) {
                                    console.warn('Quick note composer failed:', error);
                                }
                            }
                        } else if (actionBtn.classList.contains('timeline-btn') && updateId) {
                            e.preventDefault();
                            if (typeof viewUpdateDetails === 'function') {
                                viewUpdateDetails(updateId, updateUrl);
                            }
                        }
                        return;
                    }

                    // Check for sector tags
                    const sectorTag = e.target.closest('.sector-tag');
                    if (sectorTag) {
                        const sector = sectorTag.dataset.sector;
                        if (sector && typeof filterBySector === 'function') {
                            e.preventDefault();
                            filterBySector(sector);
                        }
                    }
                });

                console.log('[OK] System initialized');
            } catch (error) {
                console.error('X Initialization failed:', error);
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
            const target = normalizeSectorLabel(sector);
            if (!target) return false;
            const sectors = [].concat(
                update.firm_types_affected || [],
                update.primarySectors || [],
                update.primary_sectors || [],
                update.sector ? [update.sector] : []
            )
            .map(value => normalizeSectorLabel(value))
            .filter(Boolean);
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

        function normalizeFilterValues(value) {
            if (value == null) return [];
            if (Array.isArray(value)) {
                return value.map(item => String(item).trim()).filter(Boolean);
            }
            if (typeof value === 'string') {
                return value.split(',').map(part => part.trim()).filter(Boolean);
            }
            return [String(value).trim()].filter(Boolean);
        }

        function serializeFilterValue(value) {
            if (value == null) return '';
            if (Array.isArray(value)) {
                return value.join(',');
            }
            if (typeof value === 'string') {
                return value.trim();
            }
            return String(value);
        }

        function syncUrlWithFilters(filters) {
            const url = new URL(window.location.href);
            const params = url.searchParams;
            const keys = ['category', 'authority', 'sector', 'impact', 'urgency', 'range', 'search'];

            keys.forEach(key => {
                const serialized = serializeFilterValue(filters[key]);
                if (serialized) {
                    params.set(key, serialized);
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

        async function applyCurrentFilters() {
            console.log('Target applyCurrentFilters called');
            const filters = window.currentFilters = Object.assign({ category: 'all', sort: 'newest' }, window.currentFilters || {});
            console.log('[analytics] Current filters:', filters);

            let updates = originalUpdates.slice();
            console.log('Package Original updates count:', originalUpdates.length);

            if (filters.category && filters.category !== 'all') {
                updates = updates.filter(update => matchesCategory(update, filters.category));
            }

            const authorityValues = normalizeFilterValues(filters.authority);
            if (authorityValues.length > 0) {
                const allowedAuthorities = new Set(authorityValues.map(value => value.toLowerCase()));
                updates = updates.filter(update => allowedAuthorities.has((update.authority || '').toLowerCase()));
            }

            const sectorValues = normalizeFilterValues(filters.sector);
            if (sectorValues.length > 0) {
                updates = updates.filter(update => sectorValues.some(sector => matchesSector(update, sector)));
            }

            const impactValues = normalizeFilterValues(filters.impact);
            if (impactValues.length > 0) {
                const allowedImpacts = new Set(impactValues.map(value => value.toLowerCase()));
                updates = updates.filter(update => {
                    const impactLevel = (update.impactLevel || update.impact_level || '').toLowerCase();
                    return allowedImpacts.has(impactLevel);
                });
            }

            const urgencyValues = normalizeFilterValues(filters.urgency);
            if (urgencyValues.length > 0) {
                const allowedUrgencies = new Set(urgencyValues.map(value => value.toLowerCase()));
                updates = updates.filter(update => allowedUrgencies.has((update.urgency || '').toLowerCase()));
            }

            const rangeValues = normalizeFilterValues(filters.range);
            if (rangeValues.length > 0) {
                updates = filterUpdatesByRange(updates, rangeValues[0]);
            }

            if (filters.search) {
                updates = updates.filter(update => matchesSearch(update, filters.search));
            }

            updates = applySort(updates, filters.sort);
            console.log('Complete After filtering/sorting:', updates.length, 'updates');

            if (shouldFetchFromServer(filters, updates.length)) {
                const remoteUpdates = await fetchUpdatesFromServer(filters);
                if (remoteUpdates.length > 0) {
                    updates = applySort(remoteUpdates, filters.sort);
                    console.log('Complete Loaded additional updates from server:', updates.length);
                }
            }

            setActiveCategoryButton(filters.category || 'all');

            document.querySelectorAll('.sort-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.sort === filters.sort);
            });

            console.log('Design Calling renderUpdatesList with', updates.length, 'updates');
            renderUpdatesList(updates);
            console.log('Complete renderUpdatesList completed');
            renderPriorityHighlights();
        }


        async function sortUpdates(sortBy) {
            const filters = ensureFilterState();
            filters.sort = sortBy || 'newest';
            await applyCurrentFilters();
            showMessage('Sorted by ' + (filters.sort || 'newest'), 'info');
        }


        async function clearAllFilters(options = {}) {
            const {
                preserveCategory = false,
                preserveSort = false,
                silent = false,
                skipApply = false
            } = options;

            console.log('Clearing all filters');

            const current = ensureFilterState();
            const categoryValue = preserveCategory ? (current.category || 'all') : 'all';
            const sortValue = preserveSort ? (current.sort || 'newest') : 'newest';

            window.currentFilters = { category: categoryValue, sort: sortValue };

            // Clear search input
            const searchInput = document.getElementById('search-input');
            if (searchInput) searchInput.value = '';

            // Clear dropdown selects
            const authoritySelect = document.querySelector('select[onchange*="filterByAuthority"]');
            if (authoritySelect) authoritySelect.value = '';

            const sectorSelect = document.querySelector('select[onchange*="filterBySector"]');
            if (sectorSelect) sectorSelect.value = '';

            const impactSelect = document.querySelector('select[onchange*="filterByImpactLevel"]');
            if (impactSelect) impactSelect.value = '';

            const rangeSelect = document.querySelector('select[onchange*="filterByDateRange"]');
            if (rangeSelect) rangeSelect.value = '';

            // Clear checkbox filter sets
            window.selectedAuthorities.clear();
            window.selectedImpactLevels.clear();
            window.selectedUrgencies.clear();

            // Uncheck all filter checkboxes
            document.querySelectorAll('.authority-checkbox, .impact-checkbox, .urgency-checkbox').forEach(cb => {
                cb.checked = false;
            });

            // Reset quick filter buttons
            document.querySelectorAll('.quick-filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            const allBtn = document.querySelector('.quick-filter-btn[data-filter="all"]');
            if (allBtn) allBtn.classList.add('active');

            // Apply unified filter pipeline (will show all updates)
            if (!skipApply) {
                await applyCurrentFilters();
            }

            if (!silent) {
                showMessage('All filters cleared', 'info');
            }
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
            console.log('Document Loading more updates...');
            
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
        
        // Search functionality - STATE-DRIVEN APPROACH
        function performSearch() {
            const searchInput = document.getElementById('search-input');
            if (!searchInput) return;

            const searchTerm = searchInput.value.trim();
            const filters = ensureFilterState();

            if (!searchTerm) {
                delete filters.search;
            } else {
                filters.search = searchTerm;
            }

            // Apply unified filter pipeline
            applyCurrentFilters();
        }

        // =================
        // VIEW SWITCHING FUNCTIONALITY
        // =================

        function initializeViewSwitching() {
            console.log('[refresh] Initializing view switching...');

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
            console.log('[refresh] Switching view to: ' + viewType);

            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-view') === viewType);
            });

            currentView = viewType;
            window.currentView = viewType;
            renderUpdatesInView(viewType, window.filteredUpdates);
        }

        function ensureUpdatesContainer() {
            let container = document.getElementById('updates-container') ||
                document.querySelector('.updates-container');

            if (!container) {
                const host = document.getElementById('narrativeCard') || document.querySelector('.card');
                if (host) {
                    container = document.createElement('div');
                    container.id = 'updates-container';
                    container.className = 'updates-container cards-view';
                    container.innerHTML = buildEmptyStateHtml();
                    host.appendChild(container);
                    console.log('[design] Injected fallback updates container');
                }
            }

            return container;
        }

        function renderUpdatesInView(viewType, updates) {
            const container = ensureUpdatesContainer();

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
                    '<div class="no-updates-icon">Inbox</div>' +
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
                const summary = update.summary || update.ai_summary || '';
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
                                    const summary = update.summary || update.ai_summary || '';

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
                                                '<button class="timeline-btn" data-update-id="' + (update.id || '') + '" data-update-url="' + (update.url || '#') + '">View Details</button>' +
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
        // CREATE FILTER MODULE
        // =================
        
        // Create FilterModule object to expose all filter functions
        window.FilterModule = {
            filterByCategory,
            filterByAuthority,
            filterBySector,
            filterByImpactLevel,
            filterByDateRange,
            filterByUrgency,
            sortUpdates,
            loadMoreUpdates,
            clearAllFilters,
            clearFilters,
            applyActiveFilters,
            applyCurrentFilters,
            async applyFilters(filterParams = {}) {
                const filters = ensureFilterState();
                delete filters.specialView;

                const setFromValues = (setRef, values) => {
                    setRef.clear();
                    values.forEach(value => setRef.add(value));
                };

                const authorityValues = normalizeFilterValues(filterParams.authority);
                if (authorityValues.length > 0) {
                    filters.authority = authorityValues.join(',');
                    setFromValues(selectedAuthorities, authorityValues);
                } else {
                    delete filters.authority;
                    selectedAuthorities.clear();
                }

                const impactValues = normalizeFilterValues(filterParams.impact);
                if (impactValues.length > 0) {
                    filters.impact = impactValues.join(',');
                    setFromValues(selectedImpactLevels, impactValues);
                } else {
                    delete filters.impact;
                    selectedImpactLevels.clear();
                }

                const urgencyValues = normalizeFilterValues(filterParams.urgency);
                if (urgencyValues.length > 0) {
                    filters.urgency = urgencyValues.join(',');
                    setFromValues(selectedUrgencies, urgencyValues);
                } else {
                    delete filters.urgency;
                    selectedUrgencies.clear();
                }

                const sectorValues = normalizeFilterValues(filterParams.sector);
                if (sectorValues.length > 0) {
                    filters.sector = sectorValues.join(',');
                } else {
                    delete filters.sector;
                }

                const rangeValues = normalizeFilterValues(filterParams.range);
                if (rangeValues.length > 0) {
                    filters.range = rangeValues[0];
                } else {
                    delete filters.range;
                }

                if (filterParams.search != null && String(filterParams.search).trim() !== '') {
                    filters.search = String(filterParams.search).trim();
                } else {
                    delete filters.search;
                }

                if (filterParams.category != null && String(filterParams.category).trim() !== '') {
                    filters.category = String(filterParams.category).trim();
                } else {
                    filters.category = 'all';
                }

                if (filterParams.sort != null && String(filterParams.sort).trim() !== '') {
                    filters.sort = String(filterParams.sort).trim();
                } else {
                    filters.sort = 'newest';
                }

                const searchInput = document.getElementById('search-input') || document.getElementById('searchBox');
                if (searchInput) {
                    searchInput.value = filters.search || '';
                }

                const authoritySelect = document.querySelector('select[onchange*="filterByAuthority"]');
                if (authoritySelect) {
                    authoritySelect.value = authorityValues[0] || '';
                }

                const sectorSelect = document.querySelector('select[onchange*="filterBySector"]');
                if (sectorSelect) {
                    sectorSelect.value = sectorValues[0] || '';
                }

                const impactSelect = document.querySelector('select[onchange*="filterByImpactLevel"]');
                if (impactSelect) {
                    impactSelect.value = impactValues[0] || '';
                }

                const rangeSelect = document.querySelector('select[onchange*="filterByDateRange"]');
                if (rangeSelect) {
                    rangeSelect.value = rangeValues[0] || '';
                }

                document.querySelectorAll('.authority-checkbox').forEach(cb => {
                    cb.checked = authorityValues.includes(cb.value);
                });

                document.querySelectorAll('.impact-checkbox').forEach(cb => {
                    cb.checked = impactValues.includes(cb.value);
                });

                document.querySelectorAll('.urgency-checkbox').forEach(cb => {
                    cb.checked = urgencyValues.includes(cb.value);
                });

                await applyCurrentFilters();
            },
            async applyFilter(filterName) {
                if (!filterName) {
                    await applyCurrentFilters();
                    return;
                }

                if (filterName === 'pinned') {
                    await synchronizePinnedState({ silent: true });
                    const filters = ensureFilterState();
                    filters.specialView = 'pinned';
                    const pinnedSet = new Set(Array.from(pinnedUrls).map(value => String(value)));
                    const pinnedUpdates = originalUpdates.filter(update => pinnedSet.has(String(update.id)) || pinnedSet.has(update.url));

                    if (pinnedUpdates.length === 0) {
                        showMessage('No pinned updates yet', 'warning');
                    } else {
                        showMessage('Showing pinned updates', 'info');
                    }

                    renderUpdatesList(pinnedUpdates);
                    return;
                }

                const filters = ensureFilterState();
                delete filters.specialView;
                await filterByCategory(filterName);
            },
            getCurrentFilters() {
                const filters = ensureFilterState();
                return {
                    category: filters.category,
                    authority: filters.authority || null,
                    sector: filters.sector || null,
                    impact: filters.impact || null,
                    urgency: filters.urgency || null,
                    range: filters.range || null,
                    search: filters.search || null,
                    sort: filters.sort || 'newest'
                };
            }
        };

        if (typeof window.__flushFilterQueue === 'function') {
            try {
                const result = window.__flushFilterQueue();
                if (result && typeof result.then === 'function') {
                    result.catch(error => console.error('Queued filter flush failed:', error));
                }
            } catch (error) {
                console.error('Failed to flush queued filter calls:', error);
            }
        }

        if (typeof window.dispatchEvent === 'function') {
            try {
                window.dispatchEvent(new Event('dashboard:filters-ready'));
            } catch (error) {
                console.error('Failed to dispatch filters-ready event:', error);
            }
        }

        // Also expose functions globally for backward compatibility
        window.filterByCategory = filterByCategory;
        window.filterByAuthority = filterByAuthority;
        window.filterBySector = filterBySector;
        window.filterByImpactLevel = filterByImpactLevel;
        window.filterByDateRange = filterByDateRange;
        window.filterByUrgency = filterByUrgency;
        window.sortUpdates = sortUpdates;
        window.loadMoreUpdates = loadMoreUpdates;
        window.clearAllFilters = clearAllFilters;
        window.clearFilters = clearFilters;
        
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
        window.applyCurrentFilters = applyCurrentFilters;
        window.checkSystemStatus = checkSystemStatus;
        window.initializeSystem = initializeSystem;
        window.renderPriorityHighlights = renderPriorityHighlights;
        const ReportModule = (function() {
            async function exportReport(type, filters = {}) {
                const trigger = (window.event && window.event.target instanceof HTMLElement) ? window.event.target : null;
                if (trigger) trigger.disabled = true;

                try {
                    showMessage('Generating report export...', 'info');

                    const response = await fetch('/api/reports', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ report_type: type, filters })
                    });

                    const payload = await response.json().catch(() => ({}));

                    if (!response.ok || !payload.success) {
                        throw new Error(payload.error || 'Report export failed');
                    }

                    const html = payload.report?.html;
                    if (!html) {
                        throw new Error('Report response missing HTML content');
                    }

                    const blob = new Blob([html], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    const baseName = (payload.report?.title || type)
                        .replace(/[^a-z0-9]+/gi, '-')
                        .replace(/^-+|-+$/g, '')
                        .toLowerCase();
                    const reportId = (payload.report && payload.report.id) || 'export';

                    link.href = url;
                    link.download = (baseName || 'report') + '-' + reportId + '.html';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    setTimeout(() => URL.revokeObjectURL(url), 1000);

                    showMessage('Report export ready. Download started.', 'success');
                } catch (error) {
                    console.error('Report export error:', error);
                    showMessage('Report export failed: ' + error.message, 'error');
                } finally {
                    if (trigger) trigger.disabled = false;
                }
            }

            return { exportReport };
        })();

        window.ReportModule = ReportModule;

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
        window.PriorityModule = {
            toggleDetails: togglePriorityDetails,
            handleAction: handlePriorityAction
        };

        // =================
        // START INITIALIZATION
        // =================

        document.addEventListener('DOMContentLoaded', function() {
            initializeSystem();
            initializeViewSwitching();
        });

        console.log('[OK] Client scripts loaded with unified filter functions');
    </script>
    `
}

// Export all variations for compatibility
module.exports = {
  getClientScriptsContent,
  getCommonClientScripts: getClientScripts,
  getClientScripts,
  getSharedClientScripts: getClientScripts,
  getCommonScripts: getClientScripts,
  getWorkspaceBootstrapScripts
}
