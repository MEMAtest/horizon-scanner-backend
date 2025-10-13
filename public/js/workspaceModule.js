
    // Workspace Module - Phase 1.3 Complete Implementation
    const WorkspaceModule = (function() {
        // State management
        let pinnedUrls = new Set();
        let pinnedItems = [];
        let savedSearches = [];
        let customAlerts = [];
        let firmProfile = null;
        let availableSectors = Array.isArray(window.availableSectors)
            ? Array.from(new Set(window.availableSectors))
            : [];
        let annotations = [];
        let annotationGroups = {
            flagged: [],
            action_required: [],
            assigned: [],
            note: [],
            triage: [],
            resolved: [],
            others: []
        };
        let annotationModalContent = null;
        let initPromise = null;
        let initialized = false;

        const DEFAULT_SECTORS = [
            'Banking',
            'Investment Management',
            'Pension Funds',
            'Insurance',
            'Payments',
            'Consumer Credit',
            'Mortgages',
            'Capital Markets',
            'Cryptocurrency',
            'Fintech',
            'Wealth Management'
        ];

        function getAliasMap() {
            const aliasMap = window.__sectorAliasMap;
            return aliasMap && typeof aliasMap === 'object' ? aliasMap : {};
        }

        function setAliasMap(map) {
            if (map && typeof map === 'object') {
                window.__sectorAliasMap = map;
            }
        }

        function normalizeSector(value) {
            if (!value) return '';
            const raw = String(value).trim();
            if (!raw) return '';
            const key = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
            const alias = getAliasMap()[key];
            return alias || raw;
        }

        function setAvailableSectors(list) {
            const normalized = Array.isArray(list)
                ? Array.from(new Set(list.map(normalizeSector).filter(Boolean)))
                : [];

            availableSectors = normalized.length > 0 ? normalized : DEFAULT_SECTORS.slice();
            window.availableSectors = availableSectors;
        }

        function getAvailableSectors() {
            return availableSectors.length > 0 ? availableSectors : DEFAULT_SECTORS.slice();
        }

        function broadcastWorkspacePins() {
            const urls = Array.from(pinnedUrls);
            const detail = {
                urls,
                items: pinnedItems.slice()
            };
            window.__workspacePinnedUrls = urls;
            window.__workspacePinnedItems = detail.items;
            try {
                window.dispatchEvent(new CustomEvent('workspace:pins', { detail }));
            } catch (error) {
                console.warn('WorkspaceModule pin event failed:', error);
            }
        }

        function broadcastWorkspaceStats(stats) {
            const detail = Object.assign({
                pinnedItems: pinnedUrls.size,
                savedSearches: savedSearches.length,
                activeAlerts: customAlerts.filter(alert => alert.isActive).length
            }, stats || {});
            window.__workspaceStats = detail;
            try {
                window.dispatchEvent(new CustomEvent('workspace:stats', { detail }));
            } catch (error) {
                console.warn('WorkspaceModule stats event failed:', error);
            }
        }

        function applyWorkspaceStats(stats) {
            const counts = {
                pinnedItems: typeof stats?.pinnedItems === 'number'
                    ? stats.pinnedItems
                    : Math.max(pinnedItems.length, pinnedUrls.size),
                savedSearches: typeof stats?.savedSearches === 'number' ? stats.savedSearches : savedSearches.length,
                activeAlerts: typeof stats?.activeAlerts === 'number' ? stats.activeAlerts : customAlerts.filter(alert => alert.isActive).length
            };

            const pinnedEl = document.getElementById('pinnedCount');
            if (pinnedEl) pinnedEl.textContent = counts.pinnedItems;

            const savedEl = document.getElementById('savedSearchesCount');
            if (savedEl) savedEl.textContent = counts.savedSearches;

            const alertsEl = document.getElementById('customAlertsCount');
            if (alertsEl) alertsEl.textContent = counts.activeAlerts;

            broadcastWorkspaceStats(counts);
        }

        function normalizePinnedItem(item) {
            if (!item || typeof item !== 'object') return null;

            const metadata = item.metadata && typeof item.metadata === 'object'
                ? Object.assign({}, item.metadata)
                : {};

            const rawSectors = Array.isArray(item.sectors)
                ? item.sectors
                : Array.isArray(metadata.sectors)
                    ? metadata.sectors
                    : [];

            const sectors = Array.from(new Set(rawSectors.map(normalizeSector).filter(Boolean)));
            metadata.sectors = sectors;

            if (!metadata.summary && item.summary) {
                metadata.summary = item.summary;
            }
            if (!metadata.published && item.pinned_date) {
                metadata.published = item.pinned_date;
            }

            const personas = Array.isArray(metadata.personas)
                ? metadata.personas.filter(Boolean)
                : Array.isArray(item.personas)
                    ? item.personas.filter(Boolean)
                    : [];
            metadata.personas = personas;

            return {
                id: item.id || metadata.id || Date.now(),
                update_url: item.update_url || item.updateUrl || item.url || '',
                update_title: item.update_title || item.updateTitle || item.title || '',
                update_authority: item.update_authority || item.updateAuthority || item.authority || '',
                notes: item.notes || '',
                pinned_date: item.pinned_date || item.pinnedDate || new Date().toISOString(),
                sectors,
                metadata
            };
        }

        function showMessage(message, type = 'info') {
            if (typeof window !== 'undefined' && typeof window.showMessage === 'function') {
                try {
                    window.showMessage(message, type);
                    return;
                } catch (error) {
                    console.warn('WorkspaceModule notification bridge failed:', error);
                }
            }
            const level = type === 'error' ? 'error' : type === 'warning' ? 'warn' : 'log';
            if (typeof console !== 'undefined' && console[level]) {
                console[level]('[Workspace]', message);
            }
        }

        setAliasMap(window.__sectorAliasMap || {});
        setAvailableSectors(availableSectors);
        if (window.initialAnnotationSummary) {
            updateAnnotationBadge(window.initialAnnotationSummary);
        }

        function buildAnnotationGroups(list) {
            const groups = {
                flagged: [],
                action_required: [],
                assigned: [],
                note: [],
                triage: [],
                resolved: [],
                others: [],
                total: list.length
            };

            list.forEach(annotation => {
                const status = String(annotation.status || '').toLowerCase();
                if (groups[status]) {
                    groups[status].push(annotation);
                } else if (status === 'action required') {
                    groups.action_required.push(annotation);
                } else if (status === 'resolved' || status === 'complete') {
                    groups.resolved.push(annotation);
                } else if (status === 'triage' || status === 'review') {
                    groups.triage.push(annotation);
                } else {
                    groups.others.push(annotation);
                }
            });

            return groups;
        }

        function getAnnotationSummary() {
            const summary = {
                total: annotationGroups.total || annotations.length,
                flagged: (annotationGroups.flagged || []).length,
                tasks: (annotationGroups.action_required || []).length,
                assignments: (annotationGroups.assigned || []).length,
                notes: (annotationGroups.note || []).length
            };

            return summary;
        }

        function updateAnnotationBadge(summary) {
            const metrics = summary || getAnnotationSummary();
            const countEl = document.getElementById('annotationCount');
            if (countEl) {
                countEl.textContent = metrics.total || 0;
            }
            const metaEl = document.getElementById('annotationMeta');
            if (metaEl) {
                if (!metrics.total) {
                    metaEl.textContent = 'Notes & actions';
                } else {
                    metaEl.textContent = (metrics.tasks || 0) + ' tasks • ' + (metrics.flagged || 0) + ' briefs';
                }
            }
        }

        function formatDateTime(value) {
            if (!value) return '—';
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return '—';
            return date.toLocaleString('en-GB', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        function findAnnotation(noteId) {
            return annotations.find(item => item.note_id === noteId);
        }

        async function loadAnnotations() {
            try {
                const params = new URLSearchParams({
                    status: 'flagged,action_required,assigned,note,triage'
                });
                const response = await fetch('/api/annotations?' + params.toString());
                if (response.ok) {
                    const data = await response.json();
                    annotations = Array.isArray(data.annotations) ? data.annotations : [];
                    annotationGroups = buildAnnotationGroups(annotations);
                    updateAnnotationBadge();
                    if (annotationModalContent) {
                        renderAnnotationSections(annotationModalContent);
                    }
                }
            } catch (error) {
                console.error('Error loading annotations:', error);
            }
        }

        async function refreshAnnotations() {
            await loadAnnotations();
        }

        function renderAnnotationSections(container) {
            if (!container) return;

            const summary = getAnnotationSummary();
            const categories = [
                { key: 'flagged', title: 'Flagged for Brief', icon: '🚩' },
                { key: 'action_required', title: 'Tasks', icon: '✅' },
                { key: 'assigned', title: 'Assignments', icon: '👥' },
                { key: 'note', title: 'Notes', icon: '📝' },
                { key: 'triage', title: 'In Triage', icon: '🔍' }
            ];

            const summaryHtml = [
                '<div class="annotation-summary">',
                '  <strong>' + (summary.total || 0) + ' saved items</strong>',
                '  <span>' + (summary.tasks || 0) + ' tasks • ' + (summary.flagged || 0) + ' briefs • ' + (summary.assignments || 0) + ' assignments</span>',
                '</div>'
            ].join('\n');

            const sections = categories.map(category => {
                const items = annotationGroups[category.key] || [];
                if (!items.length) {
                    return '';
                }

                const itemsHtml = items.map(annotation => {
                    const noteId = annotation.note_id;
                    const context = annotation.context || {};
                    const headline = context.headline || annotation.content || 'Untitled';
                    const url = context.url;
                    const authority = context.authority;
                    const dueDate = context.due_date || context.dueDate;
                    const content = annotation.content;
                    const created = formatDateTime(annotation.created_at || annotation.createdAt);
                    const actions = [];

                    if (url) {
                        actions.push('<button class="annotation-btn primary" data-action="open" data-note="' + noteId + '">Open Source</button>');
                    }
                    if (String(annotation.status || '').toLowerCase() === 'action_required') {
                        actions.push('<button class="annotation-btn primary" data-action="complete" data-note="' + noteId + '">Mark Complete</button>');
                    } else if (String(annotation.status || '').toLowerCase() === 'flagged') {
                        actions.push('<button class="annotation-btn primary" data-action="complete" data-note="' + noteId + '">Mark Reviewed</button>');
                    }
                    actions.push('<button class="annotation-btn danger" data-action="delete" data-note="' + noteId + '">Remove</button>');

                    const metaParts = [];
                    if (authority) metaParts.push('<span>🏛️ ' + escapeHtml(authority) + '</span>');
                    metaParts.push('<span>🕒 ' + escapeHtml(created) + '</span>');
                    if (dueDate) metaParts.push('<span>📅 Due ' + escapeHtml(dueDate) + '</span>');

                    return [
                        '<div class="annotation-item" data-annotation-id="' + noteId + '">',
                        '  <div class="annotation-title">' + escapeHtml(headline) + '</div>',
                        '  <div class="annotation-content">' + escapeHtml(content || 'No notes captured') + '</div>',
                        '  <div class="annotation-meta">' + metaParts.join('') + '</div>',
                        '  <div class="annotation-actions">' + actions.join('') + '</div>',
                        '</div>'
                    ].join('\n');
                }).join('\n');

                return [
                    '<section class="annotation-section" data-category="' + category.key + '">',
                    '  <h4>' + category.icon + ' ' + category.title + '</h4>',
                    itemsHtml,
                    '</section>'
                ].join('\n');
            }).filter(Boolean).join('\n');

            const panelContent = sections || '<div class="annotation-empty">No saved actions yet.</div>';
            container.innerHTML = summaryHtml + panelContent;

            const actionButtons = container.querySelectorAll('.annotation-actions button');
            actionButtons.forEach(button => {
                const noteId = button.getAttribute('data-note');
                const action = button.getAttribute('data-action');
                if (!noteId || !action) return;

                if (action === 'open') {
                    button.addEventListener('click', () => openAnnotation(noteId));
                } else if (action === 'complete') {
                    button.addEventListener('click', () => completeAnnotation(noteId));
                } else if (action === 'delete') {
                    button.addEventListener('click', () => deleteAnnotation(noteId));
                }
            });
        }

        async function showAnnotations() {
            console.log('🗂️ Opening annotations');
            await loadAnnotations();
            const modal = createModal('Workspace Actions');
            annotationModalContent = modal.content;
            renderAnnotationSections(annotationModalContent);
            document.body.appendChild(modal.overlay);
        }

        function openAnnotation(noteId) {
            const annotation = findAnnotation(noteId);
            if (!annotation) {
                showMessage('Saved item not found', 'warning');
                return;
            }
            const context = annotation.context || {};
            const url = context.url;
            if (url) {
                window.open(url, '_blank', 'noopener');
            } else {
                showMessage('No source link available for this item', 'warning');
            }
        }

        async function completeAnnotation(noteId) {
            const annotation = findAnnotation(noteId);
            if (!annotation) {
                showMessage('Saved item not found', 'warning');
                return;
            }
            try {
                const response = await fetch('/api/annotations/' + noteId, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'resolved' })
                });
                if (!response.ok) {
                    throw new Error('Failed to update annotation');
                }
                showMessage('Marked as complete', 'success');
                await loadAnnotations();
            } catch (error) {
                console.error('Annotation update error:', error);
                showMessage('Failed to update annotation', 'error');
            }
        }

        async function deleteAnnotation(noteId) {
            const annotation = findAnnotation(noteId);
            if (!annotation) {
                showMessage('Saved item not found', 'warning');
                return;
            }
            if (!confirm('Remove this saved item?')) return;
            try {
                const response = await fetch('/api/annotations/' + noteId, {
                    method: 'DELETE'
                });
                if (!response.ok) {
                    throw new Error('Failed to delete annotation');
                }
                showMessage('Saved item removed', 'success');
                await loadAnnotations();
            } catch (error) {
                console.error('Annotation deletion error:', error);
                showMessage('Failed to delete annotation', 'error');
            }
        }
        
        async function runInitialization() {
            console.log('🔧 Initializing workspace module...');
            await loadWorkspaceData();
            await loadFirmProfile();
            await loadAnnotations();
            updateWorkspaceCounts();
            updateAnnotationBadge();
            initialized = true;
        }

        function init(options = {}) {
            if (options && options.force === true) {
                initPromise = null;
                initialized = false;
            }

            if (initPromise) {
                return initPromise;
            }

            initPromise = runInitialization()
                .catch(error => {
                    initialized = false;
                    initPromise = null;
                    throw error;
                });

            if (typeof window !== 'undefined') {
                window.WorkspaceModuleReady = initPromise.catch(() => {});
            }

            return initPromise;
        }
        
        // Load workspace data
        async function loadWorkspaceData() {
            try {
                // Load pinned items
                const pinnedResponse = await fetch('/api/workspace/pinned');
                if (pinnedResponse.ok) {
                    const data = await pinnedResponse.json();
                    pinnedItems = Array.isArray(data.items)
                        ? data.items
                            .map(normalizePinnedItem)
                            .filter(Boolean)
                        : [];
                    pinnedUrls = new Set(
                        pinnedItems
                            .map(item => item.update_url)
                            .filter(Boolean)
                    );
                    broadcastWorkspacePins();
                } else {
                    pinnedItems = [];
                    pinnedUrls = new Set();
                    broadcastWorkspacePins();
                }
                
                // Load saved searches
                const searchesResponse = await fetch('/api/workspace/searches');
                if (searchesResponse.ok) {
                    const data = await searchesResponse.json();
                    savedSearches = data.searches;
                }
                
                // Load custom alerts
                const alertsResponse = await fetch('/api/workspace/alerts');
                if (alertsResponse.ok) {
                    const data = await alertsResponse.json();
                    customAlerts = data.alerts;
                }
            } catch (error) {
                console.error('Error loading workspace data:', error);
            }
            applyWorkspaceStats();
        }
        
        // Load firm profile
        async function loadFirmProfile() {
            try {
                const response = await fetch('/api/firm-profile');
                if (response.ok) {
                    const data = await response.json();
                    setAliasMap(data.sectorAliasMap);
                    if (Array.isArray(data.availableSectors)) {
                        setAvailableSectors(data.availableSectors);
                    }
                    firmProfile = data.profile;
                    if (firmProfile && Array.isArray(firmProfile.primarySectors)) {
                        firmProfile.primarySectors = firmProfile.primarySectors.map(normalizeSector).filter(Boolean);
                    }
                    if (firmProfile) {
                        displayFirmProfileBadge();
                    } else {
                        removeFirmProfileBadge();
                    }
                }
            } catch (error) {
                console.error('Error loading firm profile:', error);
            }
        }
        
        // Toggle pin status
        async function togglePin(url, title, authority, contextInfo) {
            const normalizedUrl = String(url || '').trim();
            if (!normalizedUrl) {
                showMessage('Unable to pin this update: missing URL', 'error');
                return;
            }
            try {
                const context = contextInfo && typeof contextInfo === 'object' && !Array.isArray(contextInfo)
                    ? contextInfo
                    : {};
                const requestedSectors = Array.isArray(context.sectors) ? context.sectors : [];
                const normalizedSectors = Array.from(new Set(requestedSectors.map(normalizeSector).filter(Boolean)));
                const personas = Array.isArray(context.personas)
                    ? context.personas.filter(Boolean)
                    : typeof context.persona === 'string'
                        ? [context.persona]
                        : [];
                const metadata = Object.assign(
                    {
                        sectors: normalizedSectors,
                        personas,
                        summary: context.summary || '',
                        published: context.published || '',
                        updateId: context.updateId || context.id || null,
                        authority: authority || context.authority || 'Unknown'
                    },
                    typeof context.metadata === 'object' && context.metadata !== null
                        ? context.metadata
                        : {}
                );

                if (!metadata.sectors || metadata.sectors.length === 0) {
                    metadata.sectors = normalizedSectors;
                }
                if (!metadata.personas || metadata.personas.length === 0) {
                    metadata.personas = personas;
                }

                const wasPinned = pinnedUrls.has(normalizedUrl);
                let response;

                if (wasPinned) {
                    response = await fetch(`/api/workspace/pin/${encodeURIComponent(normalizedUrl)}`, {
                        method: 'DELETE'
                    });
                } else {
                    response = await fetch('/api/workspace/pin', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            url: normalizedUrl,
                            title: title || 'Untitled Update',
                            authority: authority || context.authority || 'Unknown',
                            notes: context.notes || '',
                            sectors: normalizedSectors,
                            personas,
                            summary: context.summary || '',
                            published: context.published || '',
                            updateId: context.updateId || context.id || null,
                            metadata
                        })
                    });
                }

                if (!response.ok) {
                    throw new Error(wasPinned ? 'Failed to unpin' : 'Failed to pin');
                }

                await loadWorkspaceData();
                const isPinnedNow = pinnedUrls.has(normalizedUrl);

                updatePinButton(normalizedUrl);
                await updateWorkspaceCounts({ skipFetch: true });

                if (isPinnedNow && !wasPinned) {
                    showMessage('Update pinned successfully', 'success');
                } else if (!isPinnedNow && wasPinned) {
                    showMessage('Update unpinned', 'info');
                }
                return true;
            } catch (error) {
                console.error('Pin toggle error:', error);
                showMessage('Failed to update pin status', 'error');
                return false;
            }
        }
        
        // Update pin button appearance
        function updatePinButton(url) {
            const pinBtn = document.querySelector(`[data-url="${url}"] .pin-btn`);
            if (pinBtn) {
                const isPinned = pinnedUrls.has(url);
                pinBtn.textContent = isPinned ? 'Pinned' : 'Pin';
                pinBtn.classList.toggle('pinned', isPinned);
                pinBtn.setAttribute('aria-pressed', isPinned ? 'true' : 'false');
                if (isPinned) {
                    pinBtn.dataset.state = 'pinned';
                } else {
                    delete pinBtn.dataset.state;
                }
                pinBtn.title = isPinned ? 'Unpin this update' : 'Pin this update';
            }
        }
        
        // Update workspace counts in sidebar
        async function updateWorkspaceCounts(options = {}) {
            applyWorkspaceStats();
            try {
                if (options.skipFetch) {
                    updateAnnotationBadge();
                    return;
                }
                const response = await fetch('/api/workspace/stats');
                if (response.ok) {
                    const data = await response.json();
                    applyWorkspaceStats(data.stats || {});
                }
            } catch (error) {
                console.error('Error updating workspace counts:', error);
            }
            updateAnnotationBadge();
        }
        
        // Show pinned items
        function showPinnedItems() {
            console.log('📌 Opening pinned items view');

            const modal = createModal('Pinned Updates');
            const listContainer = document.createElement('div');
            listContainer.className = 'pinned-items-list';

            const footer = document.createElement('div');
            footer.className = 'modal-footer';

            if (window.FilterModule && typeof window.FilterModule.applyFilter === 'function') {
                const viewButton = document.createElement('button');
                viewButton.className = 'btn btn-primary';
                viewButton.textContent = 'View in Intelligence Feed';
                viewButton.onclick = () => {
                    closeModal();
                    window.FilterModule.applyFilter('pinned');
                };
                footer.appendChild(viewButton);
            }

            const closeButton = document.createElement('button');
            closeButton.className = 'button-small';
            closeButton.textContent = 'Close';
            closeButton.onclick = closeModal;
            footer.appendChild(closeButton);

            modal.content.appendChild(listContainer);
            modal.content.appendChild(footer);

            function renderPinnedList() {
                listContainer.innerHTML = '';

                if (!Array.isArray(pinnedItems) || pinnedItems.length === 0) {
                    const emptyState = document.createElement('div');
                    emptyState.className = 'empty-state';
                    emptyState.textContent = 'No pinned updates yet. Pin an update to see it here.';
                    listContainer.appendChild(emptyState);
                    return;
                }

                pinnedItems.forEach(item => {
                    const metadata = item.metadata || {};
                    const card = document.createElement('div');
                    card.className = 'pinned-item-card';

                    const titleRow = document.createElement('div');
                    titleRow.className = 'pinned-item-header';

                    const titleLink = document.createElement('a');
                    titleLink.className = 'pinned-item-title';
                    titleLink.textContent = item.update_title || 'Untitled update';
                    if (item.update_url) {
                        titleLink.href = item.update_url;
                        titleLink.target = '_blank';
                        titleLink.rel = 'noopener';
                    } else {
                        titleLink.href = '#';
                        titleLink.onclick = event => event.preventDefault();
                    }
                    titleRow.appendChild(titleLink);

                    if (item.update_authority) {
                        const authorityBadge = document.createElement('span');
                        authorityBadge.className = 'pinned-item-authority';
                        authorityBadge.textContent = item.update_authority;
                        titleRow.appendChild(authorityBadge);
                    }

                    card.appendChild(titleRow);

                    if (Array.isArray(item.sectors) && item.sectors.length > 0) {
                        const sectorsWrap = document.createElement('div');
                        sectorsWrap.className = 'pinned-item-sectors';
                        item.sectors.forEach(sector => {
                            const badge = document.createElement('span');
                            badge.className = 'pinned-sector-badge';
                            badge.textContent = sector;
                            sectorsWrap.appendChild(badge);
                        });
                        card.appendChild(sectorsWrap);
                    }

                    if (metadata.summary) {
                        const summary = document.createElement('p');
                        summary.className = 'pinned-item-summary';
                        summary.textContent = metadata.summary;
                        card.appendChild(summary);
                    }

                    const actions = document.createElement('div');
                    actions.className = 'pinned-item-actions';

                    const openButton = document.createElement('button');
                    openButton.className = 'btn-small';
                    openButton.textContent = 'Open Update';
                    openButton.onclick = () => {
                        if (item.update_url) {
                            window.open(item.update_url, '_blank', 'noopener');
                        }
                    };
                    actions.appendChild(openButton);

                    const context = {
                        sectors: item.sectors || [],
                        summary: metadata.summary || '',
                        published: metadata.published || '',
                        personas: Array.isArray(metadata.personas) ? metadata.personas : [],
                        metadata
                    };

                    const unpinButton = document.createElement('button');
                    unpinButton.className = 'btn-small btn-danger';
                    unpinButton.textContent = 'Unpin';
                    unpinButton.onclick = async () => {
                        unpinButton.disabled = true;
                        unpinButton.textContent = 'Unpinning...';
                        const success = await togglePin(item.update_url, item.update_title, item.update_authority, context);
                        if (!success) {
                            unpinButton.disabled = false;
                            unpinButton.textContent = 'Unpin';
                            return;
                        }
                        renderPinnedList();
                    };
                    actions.appendChild(unpinButton);

                    card.appendChild(actions);
                    listContainer.appendChild(card);
                });
            }

            renderPinnedList();
            document.body.appendChild(modal.overlay);
        }
        
        // Show saved searches modal
        async function showSavedSearches() {
            console.log('🔍 Opening saved searches');
            
            const modal = createModal('Saved Searches');
            
            if (savedSearches.length === 0) {
                modal.content.innerHTML = '<p>No saved searches yet. Apply filters and save them for quick access.</p>';
            } else {
                const searchList = document.createElement('div');
                searchList.className = 'saved-searches-list';
                
                savedSearches.forEach(search => {
                    const searchItem = document.createElement('div');
                    searchItem.className = 'saved-search-item';
                    const searchId = JSON.stringify(search.id);
                    searchItem.innerHTML = `
                        <div class="search-name">${search.searchName || search.search_name}</div>
                        <div class="search-actions">
                            <button onclick="WorkspaceModule.loadSearch(${searchId})" class="btn-small">Load</button>
                            <button onclick="WorkspaceModule.deleteSearch(${searchId})" class="btn-small btn-danger">Delete</button>
                        </div>
                    `;
                    searchList.appendChild(searchItem);
                });
                
                modal.content.appendChild(searchList);
            }
            
            document.body.appendChild(modal.overlay);
        }
        
        // Show custom alerts modal
        async function showCustomAlerts() {
            console.log('🔔 Opening custom alerts');
            
            const modal = createModal('Custom Alerts');
            
            const alertsContainer = document.createElement('div');
            alertsContainer.innerHTML = `
                <button onclick="WorkspaceModule.createNewAlert()" class="btn btn-primary" style="margin-bottom: 1rem;">
                    Create New Alert
                </button>
            `;
            
            if (customAlerts.length > 0) {
                const alertsList = document.createElement('div');
                alertsList.className = 'alerts-list';
                
                customAlerts.forEach(alert => {
                    const alertItem = document.createElement('div');
                    alertItem.className = 'alert-item';
                    alertItem.innerHTML = `
                        <div class="alert-info">
                            <div class="alert-name">${alert.alertName || alert.alert_name}</div>
                            <div class="alert-status">
                                <span class="${alert.isActive ? 'active' : 'inactive'}">
                                    ${alert.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                        <div class="alert-actions">
                            <button onclick="WorkspaceModule.toggleAlert('${alert.id}', ${!alert.isActive})" 
                                    class="btn-small">
                                ${alert.isActive ? 'Disable' : 'Enable'}
                            </button>
                            <button onclick="WorkspaceModule.deleteAlert('${alert.id}')" 
                                    class="btn-small btn-danger">Delete</button>
                        </div>
                    `;
                    alertsList.appendChild(alertItem);
                });
                
                alertsContainer.appendChild(alertsList);
            } else {
                alertsContainer.innerHTML += '<p>No custom alerts configured.</p>';
            }
            
            modal.content.appendChild(alertsContainer);
            document.body.appendChild(modal.overlay);
        }
        
        // Save current search
        async function saveCurrentSearch() {
            const nameInput = prompt('Enter a name for this search:');
            if (!nameInput || !nameInput.trim()) return;
            
            try {
                // Get current filters from FilterModule if available
                const filters = window.FilterModule ? window.FilterModule.getCurrentFilters() : {};
                
                const response = await fetch('/api/workspace/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        searchName: nameInput.trim(),
                        filterParams: filters
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    savedSearches.push(data.search);
                    updateWorkspaceCounts();
                    showMessage('Search saved successfully', 'success');
                } else {
                    throw new Error('Failed to save search');
                }
            } catch (error) {
                console.error('Error saving search:', error);
                showMessage('Failed to save search', 'error');
            }
        }
        
        // Load saved search
        async function loadSearch(searchId) {
            try {
                const response = await fetch(`/api/workspace/search/${searchId}`);
                if (response.ok) {
                    const data = await response.json();
                    const search = data.search;
                    
                    // Apply the saved filters
                    if (window.FilterModule && search.filterParams) {
                        window.FilterModule.applyFilters(search.filterParams);
                    }
                    
                    // Close modal
                    closeModal();
                    showMessage(`Loaded search: ${search.searchName || search.search_name}`, 'success');
                }
            } catch (error) {
                console.error('Error loading search:', error);
                showMessage('Failed to load search', 'error');
            }
        }
        
        // Delete saved search
        async function deleteSearch(searchId) {
            if (!confirm('Delete this saved search?')) return;
            
            try {
                const response = await fetch(`/api/workspace/search/${searchId}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    savedSearches = savedSearches.filter(s => s.id != searchId);
                    showSavedSearches(); // Refresh modal
                    updateWorkspaceCounts();
                    showMessage('Search deleted', 'success');
                }
            } catch (error) {
                console.error('Error deleting search:', error);
                showMessage('Failed to delete search', 'error');
            }
        }
        
        // Create new alert
        function createNewAlert() {
            const modal = createModal('Create Custom Alert');
            
            modal.content.innerHTML = `
                <div class="form-group">
                    <label>Alert Name:</label>
                    <input type="text" id="alertName" class="form-input" placeholder="e.g., FCA Enforcement Actions">
                </div>
                <div class="form-group">
                    <label>Keywords (comma-separated):</label>
                    <input type="text" id="alertKeywords" class="form-input" placeholder="e.g., fine, penalty, enforcement">
                </div>
                <div class="form-group">
                    <label>Authorities:</label>
                    <select id="alertAuthority" class="form-input">
                        <option value="">All Authorities</option>
                        <option value="FCA">FCA</option>
                        <option value="BoE">Bank of England</option>
                        <option value="PRA">PRA</option>
                        <option value="TPR">TPR</option>
                        <option value="FATF">FATF</option> <!-- Add this -->
    <option value="TPR">TPR</option>
    <option value="SFO">SFO</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Minimum Impact Level:</label>
                    <select id="alertImpact" class="form-input">
                        <option value="">Any Impact</option>
                        <option value="Significant">Significant</option>
                        <option value="Moderate">Moderate</option>
                    </select>
                </div>
                <button onclick="WorkspaceModule.submitNewAlert()" class="btn btn-primary">Create Alert</button>
            `;
            
            document.body.appendChild(modal.overlay);
        }
        
        // Submit new alert
        async function submitNewAlert() {
            const alertName = document.getElementById('alertName').value.trim();
            const keywords = document.getElementById('alertKeywords').value.split(',').map(k => k.trim()).filter(k => k);
            const authority = document.getElementById('alertAuthority').value;
            const impact = document.getElementById('alertImpact').value;
            
            if (!alertName) {
                showMessage('Please enter an alert name', 'warning');
                return;
            }
            
            try {
                const response = await fetch('/api/workspace/alert', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        alertName,
                        alertConditions: {
                            keywords,
                            authorities: authority ? [authority] : [],
                            impact: impact ? [impact] : []
                        }
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    customAlerts.push(data.alert);
                    closeModal();
                    updateWorkspaceCounts();
                    showMessage('Alert created successfully', 'success');
                }
            } catch (error) {
                console.error('Error creating alert:', error);
                showMessage('Failed to create alert', 'error');
            }
        }
        
        // Toggle alert status
        async function toggleAlert(alertId, isActive) {
            try {
                const response = await fetch(`/api/workspace/alert/${alertId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isActive })
                });
                
                if (response.ok) {
                    const alert = customAlerts.find(a => a.id == alertId);
                    if (alert) alert.isActive = isActive;
                    showCustomAlerts(); // Refresh modal
                    showMessage(`Alert ${isActive ? 'enabled' : 'disabled'}`, 'success');
                }
            } catch (error) {
                console.error('Error toggling alert:', error);
                showMessage('Failed to update alert', 'error');
            }
        }
        
        // Delete alert
        async function deleteAlert(alertId) {
            if (!confirm('Delete this alert?')) return;
            
            try {
                const response = await fetch(`/api/workspace/alert/${alertId}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    customAlerts = customAlerts.filter(a => a.id != alertId);
                    showCustomAlerts(); // Refresh modal
                    updateWorkspaceCounts();
                    showMessage('Alert deleted', 'success');
                }
            } catch (error) {
                console.error('Error deleting alert:', error);
                showMessage('Failed to delete alert', 'error');
            }
        }
        
        // Show firm profile modal
        function showFirmProfile() {
            const modal = createModal('Firm Profile Settings');

            const sectors = getAvailableSectors();
            const profileSectors = firmProfile
                ? (firmProfile.primarySectors || firmProfile.primary_sectors || [])
                : [];
            const currentSectors = profileSectors.map(normalizeSector);
            const firmNameValue = firmProfile ? (firmProfile.firmName || firmProfile.firm_name || '') : '';
            const firmSizeValue = firmProfile ? (firmProfile.firmSize || firmProfile.firm_size || 'Medium') : 'Medium';

            modal.content.innerHTML = [
                '<div class="form-group">',
                '  <label>Firm Name:</label>',
                '  <input type="text" id="firmName" class="form-input" value="' + firmNameValue + '" placeholder="Enter your firm name">',
                '</div>',
                '<div class="form-group">',
                '  <label>Firm Size:</label>',
                '  <select id="firmSize" class="form-input">',
                '    <option value="Small" ' + (firmSizeValue === 'Small' ? 'selected' : '') + '>Small</option>',
                '    <option value="Medium" ' + (firmSizeValue === 'Medium' ? 'selected' : '') + '>Medium</option>',
                '    <option value="Large" ' + (firmSizeValue === 'Large' ? 'selected' : '') + '>Large</option>',
                '  </select>',
                '</div>',
                '<div class="form-group">',
                '  <label>Primary Sectors (select all that apply):</label>',
                '  <div class="sectors-grid">',
                sectors.map(sector => {
                    const normalized = normalizeSector(sector);
                    const isChecked = currentSectors.includes(normalized) ? 'checked' : '';
                    return [
                        '    <label class="checkbox-label">',
                        '      <input type="checkbox" name="sectors" value="' + normalized + '" ' + isChecked + '>',
                        '      ' + normalized,
                        '    </label>'
                    ].join('\n');
                }).join('\n'),
                '  </div>',
                '</div>',
                '<div class="button-group">',
                '  <button onclick="WorkspaceModule.saveFirmProfile()" class="btn btn-primary">Save Profile</button>',
                '  <button onclick="WorkspaceModule.clearFirmProfile()" class="btn btn-danger">Clear Profile</button>',
                '</div>'
            ].join('\n');

            document.body.appendChild(modal.overlay);
        }
        
        // Save firm profile
        async function saveFirmProfile() {
            const firmName = document.getElementById('firmName').value.trim();
            const firmSize = document.getElementById('firmSize').value;
            const sectorCheckboxes = document.querySelectorAll('input[name="sectors"]:checked');
            const primarySectors = Array.from(new Set(Array.from(sectorCheckboxes)
                .map(cb => normalizeSector(cb.value))
                .filter(Boolean)));
            
            if (!firmName) {
                showMessage('Please enter a firm name', 'warning');
                return;
            }
            
            if (primarySectors.length === 0) {
                showMessage('Please select at least one sector', 'warning');
                return;
            }
            
            try {
                const response = await fetch('/api/firm-profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        firmName,
                        firmSize,
                        primarySectors
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setAliasMap(data.sectorAliasMap);
                    if (Array.isArray(data.availableSectors)) {
                        setAvailableSectors(data.availableSectors);
                    }
                    firmProfile = data.profile;
                    if (firmProfile && Array.isArray(firmProfile.primarySectors)) {
                        firmProfile.primarySectors = firmProfile.primarySectors.map(normalizeSector).filter(Boolean);
                    }
                    closeModal();
                    displayFirmProfileBadge();
                    showMessage('Firm profile saved successfully', 'success');
                    
                    // Reload updates to apply new relevance scoring
                    if (window.location.pathname === '/dashboard') {
                        window.location.reload();
                    }
                }
            } catch (error) {
                console.error('Error saving firm profile:', error);
                showMessage('Failed to save firm profile', 'error');
            }
        }
        
        // Clear firm profile
        async function clearFirmProfile() {
            if (!confirm('Clear your firm profile? This will reset relevance scoring.')) return;
            
            try {
                const response = await fetch('/api/firm-profile', {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    setAliasMap({});
                    setAvailableSectors([]);
                    firmProfile = null;
                    closeModal();
                    removeFirmProfileBadge();
                    showMessage('Firm profile cleared', 'success');
                    
                    // Reload to reset relevance
                    if (window.location.pathname === '/dashboard') {
                        window.location.reload();
                    }
                }
            } catch (error) {
                console.error('Error clearing firm profile:', error);
                showMessage('Failed to clear firm profile', 'error');
            }
        }
        
        // Display firm profile badge
        function displayFirmProfileBadge() {
            if (!firmProfile) return;
            
            const existingBadge = document.getElementById('firmProfileBadge');
            if (existingBadge) existingBadge.remove();
            
            const badge = document.createElement('div');
            badge.id = 'firmProfileBadge';
            badge.className = 'firm-profile-badge';
            badge.innerHTML = `
                <span class="firm-name">${firmProfile.firmName || firmProfile.firm_name}</span>
                <span class="sector-count">${(firmProfile.primarySectors || firmProfile.primary_sectors || []).length} sectors</span>
                <button onclick="WorkspaceModule.showFirmProfile()" class="edit-btn">Edit</button>
            `;
            
            const header = document.querySelector('.header-controls');
            if (header) {
                header.appendChild(badge);
            }
        }
        
        // Remove firm profile badge
        function removeFirmProfileBadge() {
            const badge = document.getElementById('firmProfileBadge');
            if (badge) badge.remove();
        }
        
        // Helper: Create modal
        function createModal(title) {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.onclick = (e) => {
                if (e.target === overlay) closeModal();
            };
            
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button onclick="WorkspaceModule.closeModal()" class="close-btn">×</button>
                </div>
                <div class="modal-content"></div>
            `;
            
            overlay.appendChild(modal);
            
            return {
                overlay,
                content: modal.querySelector('.modal-content')
            };
        }
        
        // Close modal
        function closeModal() {
            const modal = document.querySelector('.modal-overlay');
            if (modal) modal.remove();
            annotationModalContent = null;
        }
        
        // Export data
        async function exportData() {
            try {
                showMessage('Preparing export...', 'info');
                
                const response = await fetch('/api/export');
                const data = await response.json();
                
                if (data.success) {
                    const blob = new Blob([JSON.stringify(data.data, null, 2)], 
                                         { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `regulatory-updates-${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    showMessage('Data exported successfully', 'success');
                }
            } catch (error) {
                console.error('Export error:', error);
                showMessage('Export failed', 'error');
            }
        }
        
        // Initialize on page load
        function autoInit() {
            init().catch(error => {
                console.error('WorkspaceModule auto-init failed:', error);
            });
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', autoInit, { once: true });
        } else {
            autoInit();
        }
        
        // Public API
        return {
            init,
            togglePin,
            updateWorkspaceCounts,
            showPinnedItems,
            showSavedSearches,
            showCustomAlerts,
            showAnnotations,
            saveCurrentSearch,
            loadSearch,
            deleteSearch,
            createNewAlert,
            submitNewAlert,
            toggleAlert,
            deleteAlert,
            refreshAnnotations,
            openAnnotation,
            completeAnnotation,
            deleteAnnotation,
            showFirmProfile,
            saveFirmProfile,
            clearFirmProfile,
            closeModal,
            exportData,
            getPinnedUrls: function() {
                return Array.from(pinnedUrls);
            },
            getPinnedItems: function() {
                return pinnedItems.slice();
            },
            isInitialized: function() {
                return initialized;
            },
            ready: function() {
                return initPromise ? initPromise : init();
            }
        };
    })();

    window.WorkspaceModule = WorkspaceModule;
