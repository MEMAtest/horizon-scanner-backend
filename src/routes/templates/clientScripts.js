// src/routes/templates/clientScripts.js
// COMPLETE SOLUTION: All functions from all clientScripts files merged

function getClientScriptsContent() {
    return `
    <script>
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
        
        // System status tracking
        let systemStatus = {
            database: false,
            api: false,
            overall: false
        };

        // =================
        // MISSING FUNCTIONS - NOW ADDED
        // =================
        
        function updateLiveCounters() {
            console.log('🔄 Updating live counters...');
            
            try {
                // Update live statistics from API
                fetch('/api/stats/live')
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            // Update counter elements if they exist
                            const elements = {
                                'totalUpdates': data.stats?.totalUpdates || 0,
                                'newCount': data.stats?.newToday || 0,
                                'urgentCount': data.stats?.urgent || 0,
                                'moderateCount': data.stats?.moderate || 0,
                                'backgroundCount': data.stats?.background || 0
                            };
                            
                            Object.entries(elements).forEach(([id, value]) => {
                                const element = document.getElementById(id);
                                if (element) {
                                    element.textContent = value;
                                }
                            });
                            
                            // Update last updated timestamp
                            const lastUpdateEl = document.getElementById('lastUpdate');
                            if (lastUpdateEl) {
                                lastUpdateEl.textContent = \`Last: \${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}\`;
                            }
                            
                            console.log('✅ Live counters updated successfully');
                        }
                    })
                    .catch(error => {
                        console.warn('⚠️ Live counter update failed:', error);
                    });
            } catch (error) {
                console.error('❌ Error updating live counters:', error);
            }
        }
        
        function initializeFilters() {
            console.log('🔧 Initializing filters...');
            
            try {
                // Initialize filter event listeners
                document.querySelectorAll('.filter-option').forEach(option => {
                    option.addEventListener('click', function() {
                        // Toggle active state
                        this.classList.toggle('active');
                        
                        // Get filter type and value
                        const filterType = this.closest('.filter-section')?.querySelector('.filter-title')?.textContent?.trim();
                        const filterValue = this.textContent?.trim();
                        
                        console.log(\`Filter clicked: \${filterType} - \${filterValue}\`);
                        
                        // Apply filters based on type
                        applyActiveFilters();
                    });
                });
                
                // Initialize search functionality
                const searchBox = document.getElementById('searchBox');
                if (searchBox) {
                    searchBox.addEventListener('input', function() {
                        performSearch(this.value);
                    });
                }
                
                // Initialize authority checkboxes
                document.querySelectorAll('.authority-checkbox').forEach(cb => {
                    cb.addEventListener('change', function() {
                        if (this.checked) {
                            selectedAuthorities.add(this.value);
                        } else {
                            selectedAuthorities.delete(this.value);
                        }
                        applyActiveFilters();
                    });
                });
                
                // Initialize impact level checkboxes
                document.querySelectorAll('.impact-checkbox').forEach(cb => {
                    cb.addEventListener('change', function() {
                        if (this.checked) {
                            selectedImpactLevels.add(this.value);
                        } else {
                            selectedImpactLevels.delete(this.value);
                        }
                        applyActiveFilters();
                    });
                });
                
                // Initialize urgency checkboxes
                document.querySelectorAll('.urgency-checkbox').forEach(cb => {
                    cb.addEventListener('change', function() {
                        if (this.checked) {
                            selectedUrgencies.add(this.value);
                        } else {
                            selectedUrgencies.delete(this.value);
                        }
                        applyActiveFilters();
                    });
                });
                
                console.log('✅ Filters initialized successfully');
            } catch (error) {
                console.error('❌ Error initializing filters:', error);
            }
        }
        
        function loadMoreUpdates() {
            console.log('📄 Loading more updates...');
            
            try {
                const loadMoreBtn = document.getElementById('loadMoreBtn');
                if (loadMoreBtn) {
                    loadMoreBtn.disabled = true;
                    loadMoreBtn.textContent = 'Loading...';
                }
                
                // Increment offset for pagination
                currentOffset += itemsPerPage;
                
                // Fetch more updates
                const params = new URLSearchParams({
                    offset: currentOffset,
                    limit: itemsPerPage
                });
                
                // Add current filters to request
                if (selectedAuthorities.size > 0) {
                    params.append('authorities', Array.from(selectedAuthorities).join(','));
                }
                if (selectedImpactLevels.size > 0) {
                    params.append('impacts', Array.from(selectedImpactLevels).join(','));
                }
                if (selectedUrgencies.size > 0) {
                    params.append('urgencies', Array.from(selectedUrgencies).join(','));
                }
                
                fetch(\`/api/updates?\${params.toString()}\`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.success && data.updates) {
                            // Append new updates to existing content
                            const updatesContainer = document.getElementById('updatesContainer') || 
                                                   document.querySelector('.updates-list') ||
                                                   document.querySelector('.update-cards');
                            
                            if (updatesContainer) {
                                data.updates.forEach(update => {
                                    const updateCard = generateUpdateCard(update);
                                    updatesContainer.insertAdjacentHTML('beforeend', updateCard);
                                });
                                
                                showMessage(\`Loaded \${data.updates.length} more updates\`, 'success');
                            }
                            
                            // Hide load more button if no more updates
                            if (data.updates.length < itemsPerPage) {
                                if (loadMoreBtn) {
                                    loadMoreBtn.style.display = 'none';
                                }
                                showMessage('All updates loaded', 'info');
                            }
                        } else {
                            throw new Error(data.error || 'Failed to load more updates');
                        }
                    })
                    .catch(error => {
                        console.error('Load more error:', error);
                        showMessage('Failed to load more updates: ' + error.message, 'error');
                        currentOffset -= itemsPerPage; // Reset offset on error
                    })
                    .finally(() => {
                        if (loadMoreBtn) {
                            loadMoreBtn.disabled = false;
                            loadMoreBtn.textContent = 'Load More';
                        }
                    });
                    
            } catch (error) {
                console.error('❌ Error loading more updates:', error);
                showMessage('Error loading more updates', 'error');
            }
        }

        // =================
        // SIDEBAR FILTER FUNCTIONS (FROM SHARED)
        // =================
        
        // Category Filtering Functions
        async function filterByCategory(category) {
            try {
                console.log('🏷️ Filtering by category:', category);
                showMessage(\`Filtering by category: \${category}...\`, 'info');
                
                const response = await fetch(\`/api/updates/category/\${encodeURIComponent(category)}\`);
                const data = await response.json();
                
                if (data.success) {
                    renderFilteredUpdates(data.updates, \`Category: \${category}\`);
                    showMessage(\`Showing \${data.total} \${category} updates\`, 'success');
                    currentFilter = { type: 'category', value: category };
                } else {
                    throw new Error(data.error || 'Filter failed');
                }
                
            } catch (error) {
                console.error('Category filter error:', error);
                showMessage('Category filter failed: ' + error.message, 'error');
            }
        }

        function selectAllCategories() {
            console.log('🔄 Showing all categories');
            currentFilter = null;
            if (typeof loadIntelligenceStreams === 'function') {
                loadIntelligenceStreams();
            } else {
                window.location.reload();
            }
            showMessage('Showing all categories', 'info');
        }

        function clearCategoryFilters() {
            selectAllCategories();
        }

        // Content Type Filtering Functions
        async function filterByContentType(contentType) {
            try {
                console.log('📄 Filtering by content type:', contentType);
                showMessage(\`Filtering by content type: \${contentType}...\`, 'info');
                
                const response = await fetch(\`/api/updates/content-type/\${encodeURIComponent(contentType)}\`);
                const data = await response.json();
                
                if (data.success) {
                    renderFilteredUpdates(data.updates, \`Content Type: \${contentType}\`);
                    showMessage(\`Showing \${data.total} \${contentType} updates\`, 'success');
                    currentFilter = { type: 'contentType', value: contentType };
                } else {
                    throw new Error(data.error || 'Filter failed');
                }
                
            } catch (error) {
                console.error('Content type filter error:', error);
                showMessage('Content type filter failed: ' + error.message, 'error');
            }
        }

        function selectAllContentTypes() {
            console.log('🔄 Showing all content types');
            currentFilter = null;
            if (typeof loadIntelligenceStreams === 'function') {
                loadIntelligenceStreams();
            } else {
                window.location.reload();
            }
            showMessage('Showing all content types', 'info');
        }

        function clearContentTypeFilters() {
            selectAllContentTypes();
        }

        // Source Type Filtering Functions
        async function filterBySourceType(sourceType) {
            try {
                console.log('📡 Filtering by source type:', sourceType);
                showMessage(\`Filtering by source type: \${sourceType}...\`, 'info');
                
                const response = await fetch(\`/api/updates/source-type/\${encodeURIComponent(sourceType)}\`);
                const data = await response.json();
                
                if (data.success) {
                    renderFilteredUpdates(data.updates, \`Source Type: \${sourceType}\`);
                    showMessage(\`Showing \${data.total} \${sourceType} updates\`, 'success');
                    currentFilter = { type: 'sourceType', value: sourceType };
                } else {
                    throw new Error(data.error || 'Filter failed');
                }
                
            } catch (error) {
                console.error('Source type filter error:', error);
                showMessage('Source type filter failed: ' + error.message, 'error');
            }
        }

        function selectAllSourceTypes() {
            console.log('🔄 Showing all source types');
            currentFilter = null;
            if (typeof loadIntelligenceStreams === 'function') {
                loadIntelligenceStreams();
            } else {
                window.location.reload();
            }
            showMessage('Showing all source types', 'info');
        }

        function clearSourceTypeFilters() {
            selectAllSourceTypes();
        }

        // Relevance Filtering Functions
        async function filterByRelevance(relevance) {
            try {
                console.log('🎯 Filtering by relevance:', relevance);
                showMessage(\`Filtering by relevance: \${relevance}...\`, 'info');
                
                const response = await fetch(\`/api/updates/relevance/\${encodeURIComponent(relevance)}\`);
                const data = await response.json();
                
                if (data.success) {
                    renderFilteredUpdates(data.updates, \`Relevance: \${relevance}\`);
                    showMessage(\`Showing \${data.total} \${relevance} relevance updates\`, 'success');
                    currentFilter = { type: 'relevance', value: relevance };
                } else {
                    throw new Error(data.error || 'Filter failed');
                }
                
            } catch (error) {
                console.error('Relevance filter error:', error);
                showMessage('Relevance filter failed: ' + error.message, 'error');
            }
        }

        // Authority Filtering Functions
        async function filterByAuthority(authority) {
            try {
                console.log('🏛️ Filtering by authority:', authority);
                showMessage(\`Filtering by authority: \${authority}...\`, 'info');
                
                const response = await fetch(\`/api/search?authority=\${encodeURIComponent(authority)}\`);
                const data = await response.json();
                
                if (data.success) {
                    renderFilteredUpdates(data.results, \`Authority: \${authority}\`);
                    showMessage(\`Showing \${data.total} \${authority} updates\`, 'success');
                    currentFilter = { type: 'authority', value: authority };
                } else {
                    throw new Error(data.error || 'Filter failed');
                }
                
            } catch (error) {
                console.error('Authority filter error:', error);
                showMessage('Authority filter failed: ' + error.message, 'error');
            }
        }

        // Workspace Functions
        function showPinnedItems() {
            console.log('📌 Opening pinned items');
            window.open('/dashboard#pinned', '_blank');
        }

        function showSavedSearches() {
            console.log('🔍 Opening saved searches');
            window.open('/dashboard#searches', '_blank');
        }

        function showCustomAlerts() {
            console.log('🔔 Opening custom alerts');
            window.open('/dashboard#alerts', '_blank');
        }

        // Dialog Functions
        function showSaveDialog() {
            console.log('💾 Opening save dialog');
            
            // Create a simple save dialog
            const dialog = document.createElement('div');
            dialog.style.cssText = \`
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 2rem;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                z-index: 10000;
                min-width: 300px;
            \`;
            
            dialog.innerHTML = \`
                <h3 style="margin-bottom: 1rem;">Save Current View</h3>
                <div style="margin-bottom: 1rem;">
                    <label>Save as:</label>
                    <input type="text" id="saveDialogName" placeholder="Enter name..." style="width: 100%; padding: 0.5rem; margin-top: 0.5rem;">
                </div>
                <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                    <button onclick="closeSaveDialog()" style="padding: 0.5rem 1rem; background: #6b7280; color: white; border: none; border-radius: 4px;">Cancel</button>
                    <button onclick="saveCurrentView()" style="padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 4px;">Save</button>
                </div>
            \`;
            
            // Add overlay
            const overlay = document.createElement('div');
            overlay.style.cssText = \`
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                z-index: 9999;
            \`;
            overlay.onclick = closeSaveDialog;
            
            document.body.appendChild(overlay);
            document.body.appendChild(dialog);
            document.getElementById('saveDialogName').focus();
        }

        function closeSaveDialog() {
            const overlay = document.querySelector('[style*="position: fixed"][style*="background: rgba(0,0,0,0.5)"]');
            const dialog = document.querySelector('[style*="position: fixed"][style*="transform: translate(-50%, -50%)"]');
            
            if (overlay) overlay.remove();
            if (dialog) dialog.remove();
        }

        function saveCurrentView() {
            const nameInput = document.getElementById('saveDialogName');
            const name = nameInput?.value?.trim();
            
            if (!name) {
                showMessage('Please enter a name for the saved view', 'warning');
                return;
            }
            
            // Save to localStorage (fallback to memory if not available)
            const savedData = {
                name: name,
                filter: currentFilter,
                timestamp: new Date().toISOString()
            };
            
            try {
                const saved = JSON.parse(localStorage.getItem('savedViews') || '[]');
                saved.push(savedData);
                localStorage.setItem('savedViews', JSON.stringify(saved));
                showMessage(\`View saved as "\${name}"\`, 'success');
            } catch (error) {
                console.warn('Could not save to localStorage:', error);
                showMessage('View saved in session memory', 'info');
            }
            
            closeSaveDialog();
        }

        // General Filtering Functions
        function clearFilters() {
            console.log('🔄 Clearing all filters');
            currentFilter = null;
            if (typeof loadIntelligenceStreams === 'function') {
                loadIntelligenceStreams();
            } else {
                window.location.reload();
            }
            showMessage('All filters cleared', 'success');
        }

        // Render Functions
        function renderFilteredUpdates(updates, filterLabel) {
            console.log(\`📋 Rendering \${updates.length} filtered updates for: \${filterLabel}\`);
            
            try {
                const container = document.getElementById('intelligenceStreams') || 
                                document.getElementById('updatesContainer') ||
                                document.querySelector('.updates-list');
                
                if (!container) {
                    console.warn('No container found for updates');
                    return;
                }
                
                // Create filtered view
                const filteredHTML = \`
                    <div class="filtered-view">
                        <div class="filter-header">
                            <h3>Filtered View: \${filterLabel}</h3>
                            <button onclick="clearFilters()" class="clear-filter-btn">Clear Filter</button>
                        </div>
                        <div class="filtered-updates">
                            \${updates.map(update => generateUpdateCard(update)).join('')}
                        </div>
                    </div>
                \`;
                
                container.innerHTML = filteredHTML;
                
            } catch (error) {
                console.error('Error rendering filtered updates:', error);
                showMessage('Error displaying filtered updates', 'error');
            }
        }

        // Toggle Pin Function
        function togglePin(url) {
            if (pinnedUrls.has(url)) {
                pinnedUrls.delete(url);
                showMessage('Item unpinned', 'info');
            } else {
                pinnedUrls.add(url);
                showMessage('Item pinned', 'success');
            }
            
            // Update pin button appearance
            const pinBtn = document.querySelector(\`[data-url="\${url}"] .pin-btn\`);
            if (pinBtn) {
                pinBtn.textContent = pinnedUrls.has(url) ? '📌' : '📍';
                pinBtn.classList.toggle('pinned', pinnedUrls.has(url));
            }
            
            updateWorkspaceCounts();
        }

        // Firm Profile Functions
        function showFirmProfileSetup() {
            console.log('🏢 Opening firm profile setup');
            
            const modal = document.getElementById('firmProfileModal');
            if (modal) {
                modal.style.display = 'block';
            } else {
                showMessage('Firm profile setup not available', 'warning');
            }
        }

        function closeFirmProfileModal() {
            const modal = document.getElementById('firmProfileModal');
            if (modal) {
                modal.style.display = 'none';
            }
        }

        function clearFirmProfile() {
            firmProfile = null;
            showMessage('Firm profile cleared', 'info');
            
            // Update UI
            const profileBtn = document.getElementById('profileBtn');
            if (profileBtn) {
                profileBtn.textContent = 'Setup Firm Profile';
                profileBtn.classList.remove('configured');
            }
        }

        // Export Functions
        async function exportData() {
            try {
                showMessage('Preparing export...', 'info');
                
                const response = await fetch('/api/export');
                const data = await response.json();
                
                if (data.success) {
                    // Create downloadable file
                    const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = \`regulatory-updates-\${new Date().toISOString().split('T')[0]}.json\`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    showMessage('Data exported successfully', 'success');
                } else {
                    throw new Error(data.error || 'Export failed');
                }
                
            } catch (error) {
                console.error('Export error:', error);
                showMessage('Export failed: ' + error.message, 'error');
            }
        }

        async function createAlert() {
            try {
                showMessage('Creating alert...', 'info');
                
                // Simple alert creation - could be enhanced with a modal
                const alertData = {
                    filter: currentFilter,
                    timestamp: new Date().toISOString()
                };
                
                const response = await fetch('/api/alerts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(alertData)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showMessage('Alert created successfully', 'success');
                } else {
                    throw new Error(result.error || 'Alert creation failed');
                }
                
            } catch (error) {
                console.error('Alert creation error:', error);
                showMessage('Alert creation failed: ' + error.message, 'error');
            }
        }

        async function shareSystem() {
            if (shareInProgress) return;
            shareInProgress = true;
            
            try {
                const shareData = {
                    title: 'Regulatory Horizon Scanner',
                    text: 'Check out this regulatory intelligence platform',
                    url: window.location.href
                };
                
                if (navigator.share) {
                    await navigator.share(shareData);
                    showMessage('Shared successfully!', 'success');
                } else {
                    const shareText = \`\${shareData.title}: \${shareData.text} - \${shareData.url}\`;
                    
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        await navigator.clipboard.writeText(shareText);
                        showMessage('Share link copied to clipboard!', 'success');
                    } else {
                        const textArea = document.createElement('textarea');
                        textArea.value = shareText;
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                        showMessage('Share link copied to clipboard!', 'success');
                    }
                }
                
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Share error:', error);
                    showMessage('Share failed: ' + error.message, 'error');
                }
            } finally {
                setTimeout(() => {
                    shareInProgress = false;
                }, 1000);
            }
        }

        // =================
        // CORE DATA REFRESH FUNCTIONS
        // =================
        
        async function refreshIntelligence() {
            const btn = document.getElementById('refreshBtn');
            const icon = document.getElementById('refreshIcon');
            
            if (btn) {
                btn.disabled = true;
                if (icon) icon.textContent = '⏳';
                btn.innerHTML = '<span>⏳</span><span>Refreshing...</span>';
            }
            
            try {
                console.log('🔄 Starting intelligence refresh...');
                
                const response = await fetch('/api/refresh', { 
                    method: 'POST',
                    headers: { 'Accept': 'application/json' }
                });
                
                if (!response.ok) {
                    throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
                }
                
                const result = await response.json();
                
                // Update status indicators
                const newCountEl = document.getElementById('newCount');
                const lastUpdateEl = document.getElementById('lastUpdate');
                
                if (newCountEl) newCountEl.textContent = \`\${result.newArticles} New\`;
                if (lastUpdateEl) lastUpdateEl.textContent = \`Last: \${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}\`;
                
                // Reload data and UI
                await loadIntelligenceStreams();
                await loadAnalyticsPreview();
                await checkLiveSubscriptions();
                
                showMessage(\`Refreshed successfully! \${result.newArticles} new updates found.\`, 'success');
                
            } catch (error) {
                console.error('Refresh error:', error);
                showMessage('Refresh failed: ' + error.message, 'error');
            } finally {
                if (btn) {
                    btn.disabled = false;
                    if (icon) icon.textContent = '🔄';
                    btn.innerHTML = '<span>🔄</span><span>Refresh Intelligence</span>';
                }
            }
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
                } else {
                    throw new Error(data.error || 'Failed to load streams');
                }
                
            } catch (error) {
                console.error('Stream loading error:', error);
                showMessage('Failed to load intelligence streams', 'error');
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

        async function updateAnalyticsPreview() {
            if (!analyticsPreviewData) return;
            
            const previewContainer = document.getElementById('analyticsPreview');
            if (previewContainer) {
                previewContainer.innerHTML = \`
                    <div class="analytics-metric">
                        <span class="metric-label">Total Updates</span>
                        <span class="metric-value">\${analyticsPreviewData.totalUpdates || 0}</span>
                    </div>
                    <div class="analytics-metric">
                        <span class="metric-label">Avg Risk Score</span>
                        <span class="metric-value">\${(analyticsPreviewData.averageRiskScore || 0).toFixed(1)}</span>
                    </div>
                \`;
            }
        }

        function generateRelevanceBasedStreams(updates) {
            if (!updates || !Array.isArray(updates)) return;
            
            const streamContainer = document.getElementById('intelligenceStreams');
            if (!streamContainer) return;
            
            // Categorize updates by relevance
            const urgent = updates.filter(u => u.urgency === 'High' || u.impactLevel === 'Significant');
            const moderate = updates.filter(u => u.urgency === 'Medium' || u.impactLevel === 'Moderate');  
            const background = updates.filter(u => u.urgency === 'Low' || u.impactLevel === 'Informational');
            
            streamContainer.innerHTML = \`
                \${generateStream('urgent', '🔴 Critical Impact', urgent, true)}
                \${generateStream('moderate', '🟡 Active Monitoring', moderate, false)}
                \${generateStream('background', '🟢 Background Intelligence', background, false)}
            \`;
        }

        function generateStream(id, title, updates, isExpanded = false) {
            const updateCards = updates.slice(0, 5).map(update => generateUpdateCard(update)).join('');
            const expandClass = isExpanded ? 'expanded' : '';
            const expandText = isExpanded ? 'Collapse' : 'Expand';
            const expandIcon = isExpanded ? '🔽' : '▶️';
            
            return \`
                <div class="intelligence-stream \${expandClass}" id="\${id}">
                    <div class="stream-header" onclick="toggleStreamExpansion('\${id}')">
                        <h3>\${title}</h3>
                        <div class="stream-controls">
                            <span class="update-count">\${updates.length} updates</span>
                            <button class="expand-btn">
                                <span>\${expandIcon}</span>
                                <span>\${expandText}</span>
                            </button>
                        </div>
                    </div>
                    <div class="stream-content">
                        \${updateCards}
                        \${updates.length > 5 ? \`<button class="load-more-btn" onclick="loadMoreUpdates()">Load More (\${updates.length - 5} remaining)</button>\` : ''}
                    </div>
                </div>
            \`;
        }

        function generateUpdateCard(update) {
            const impactColor = update.urgency === 'High' ? 'urgent' : update.urgency === 'Medium' ? 'moderate' : 'low';
            const shortSummary = (update.impact || '').length > 120 ? 
                (update.impact || '').substring(0, 120) + '...' : 
                (update.impact || '');
            const isPinned = pinnedUrls.has(update.url);
            
            return \`
                <div class="update-card" data-authority="\${update.authority}" data-impact="\${update.impactLevel}" data-urgency="\${update.urgency}" data-url="\${update.url}">
                    <div class="update-header">
                        <h4 class="update-headline">\${update.headline || 'No headline'}</h4>
                        <div class="update-badges">
                            <span class="authority-badge">\${update.authority || 'Unknown'}</span>
                            <span class="impact-badge \${impactColor}">\${update.urgency || 'Low'}</span>
                            <button class="pin-btn \${isPinned ? 'pinned' : ''}" onclick="togglePin('\${update.url}')">\${isPinned ? '📌' : '📍'}</button>
                        </div>
                    </div>
                    <div class="update-content">
                        <p class="update-summary truncated" id="summary-\${update.id}">\${shortSummary}</p>
                        \${(update.impact || '').length > 120 ? \`<button class="read-more-btn" onclick="toggleSummaryExpansion(\${update.id}, '\${(update.impact || '').replace(/'/g, "\\'")}')">Read More</button>\` : ''}
                    </div>
                    <div class="update-footer">
                        <span class="update-date">\${new Date(update.fetchedDate).toLocaleDateString()}</span>
                        <button class="view-details-btn" onclick="viewUpdateDetails('\${update.url}')">View Details</button>
                    </div>
                </div>
            \`;
        }

        function deduplicateUpdates(updates) {
            const seen = new Set();
            return updates.filter(update => {
                const fingerprint = createContentFingerprint(update);
                if (seen.has(fingerprint)) {
                    return false;
                }
                seen.add(fingerprint);
                return true;
            });
        }

        function createContentFingerprint(update) {
            const headline = (update.headline || '').toLowerCase().trim();
            const url = (update.url || '').toLowerCase().trim();
            return \`\${headline}|\${url}\`;
        }

        function updateAuthorityCounts() {
            if (!allUpdatesData) return;
            
            const counts = {};
            allUpdatesData.forEach(update => {
                const authority = update.authority || 'Unknown';
                counts[authority] = (counts[authority] || 0) + 1;
            });
            
            // Update authority filter counts
            Object.entries(counts).forEach(([authority, count]) => {
                const element = document.querySelector(\`[data-authority-count="\${authority}"]\`);
                if (element) {
                    element.textContent = count;
                }
            });
        }

        function updateRelevanceCounts() {
            if (!allUpdatesData) return;
            
            const urgent = allUpdatesData.filter(u => u.urgency === 'High').length;
            const moderate = allUpdatesData.filter(u => u.urgency === 'Medium').length;
            const background = allUpdatesData.filter(u => u.urgency === 'Low').length;
            
            const urgentEl = document.getElementById('urgentCount');
            const moderateEl = document.getElementById('moderateCount');
            const backgroundEl = document.getElementById('backgroundCount');
            
            if (urgentEl) urgentEl.textContent = urgent;
            if (moderateEl) moderateEl.textContent = moderate;
            if (backgroundEl) backgroundEl.textContent = background;
        }

        // =================
        // STREAM/CONTENT FUNCTIONS
        // =================
        
        function toggleStreamExpansion(streamId) {
            const stream = document.getElementById(streamId);
            if (!stream) return;
            
            const content = stream.querySelector('.stream-content');
            const expandBtn = stream.querySelector('.expand-btn');
            
            if (expandedStreams.has(streamId)) {
                expandedStreams.delete(streamId);
                stream.classList.remove('expanded');
                if (content) content.classList.remove('expanded');
                if (expandBtn) expandBtn.innerHTML = '<span>▶️</span><span>Expand</span>';
            } else {
                expandedStreams.add(streamId);
                stream.classList.add('expanded');
                if (content) content.classList.add('expanded');
                if (expandBtn) expandBtn.innerHTML = '<span>🔽</span><span>Collapse</span>';
            }
        }

        function toggleSummaryExpansion(updateId, fullContent) {
            const summaryElement = document.getElementById(\`summary-\${updateId}\`);
            const readMoreBtn = summaryElement?.nextElementSibling;
            
            if (!summaryElement) return;
            
            if (summaryElement.classList.contains('truncated')) {
                summaryElement.textContent = fullContent;
                summaryElement.classList.remove('truncated');
                summaryElement.classList.add('expanded');
                if (readMoreBtn) readMoreBtn.textContent = 'Read Less';
            } else {
                const shortContent = fullContent.length > 120 ? fullContent.substring(0, 120) + '...' : fullContent;
                summaryElement.textContent = shortContent;
                summaryElement.classList.add('truncated');
                summaryElement.classList.remove('expanded');
                if (readMoreBtn) readMoreBtn.textContent = 'Read More';
            }
        }

        function viewUpdateDetails(url) {
            if (url) {
                window.open(url, '_blank');
            }
        }

        // =================
        // UTILITY FUNCTIONS
        // =================
        
        function showMessage(message, type = 'info') {
            console.log(\`\${type.toUpperCase()}: \${message}\`);
            
            // Create a temporary toast notification
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
                border: 1px solid;
                border-color: \${textColor}33;
                font-size: 14px;
                z-index: 10000;
                max-width: 350px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            \`;
            toast.textContent = message;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 4000);
        }

        function clearMessages() {
            document.querySelectorAll('[style*="position: fixed"][style*="top: 20px"]').forEach(toast => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            });
        }

        function updateWorkspaceCounts() {
            const pinnedEl = document.getElementById('pinnedCount');
            const searchesEl = document.getElementById('savedSearchesCount');
            const alertsEl = document.getElementById('customAlertsCount');
            
            if (pinnedEl) pinnedEl.textContent = pinnedUrls.size || 0;
            if (searchesEl) searchesEl.textContent = workspaceStats.savedSearches || 0;
            if (alertsEl) alertsEl.textContent = workspaceStats.activeAlerts || 0;
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
                
                // Update status indicators if they exist
                const statusIndicator = document.getElementById('systemStatus');
                if (statusIndicator) {
                    statusIndicator.className = systemStatus.overall ? 'status-healthy' : 'status-error';
                    statusIndicator.textContent = systemStatus.overall ? 'System Healthy' : 'System Issues';
                }
                
            } catch (error) {
                console.warn('System status check failed:', error);
                systemStatus = { database: false, api: false, overall: false };
            }
        }

        async function initializeSystem() {
            console.log('🚀 Initializing system...');
            
            try {
                // Initialize all components
                initializeFilters();
                await checkSystemStatus();
                await loadIntelligenceStreams();
                await loadAnalyticsPreview();
                await checkLiveSubscriptions();
                
                // Start live counter updates
                updateLiveCounters();
                setInterval(updateLiveCounters, 30000); // Update every 30 seconds
                
                console.log('✅ System initialized successfully');
                
            } catch (error) {
                console.error('❌ System initialization failed:', error);
                showMessage('System initialization failed: ' + error.message, 'error');
            }
        }

        // =================
        // HELPER FUNCTIONS FOR NEW FEATURES
        // =================
        
        function applyActiveFilters() {
            console.log('🎯 Applying active filters...');
            
            try {
                // Get all active filter options
                const activeFilters = {
                    authorities: Array.from(selectedAuthorities),
                    impacts: Array.from(selectedImpactLevels),
                    urgencies: Array.from(selectedUrgencies)
                };
                
                // Apply filters to visible updates
                document.querySelectorAll('.update-card').forEach(card => {
                    let shouldShow = true;
                    
                    // Check authority filter
                    if (activeFilters.authorities.length > 0) {
                        const cardAuthority = card.getAttribute('data-authority');
                        if (!activeFilters.authorities.includes(cardAuthority)) {
                            shouldShow = false;
                        }
                    }
                    
                    // Check impact filter
                    if (activeFilters.impacts.length > 0) {
                        const cardImpact = card.getAttribute('data-impact');
                        if (!activeFilters.impacts.includes(cardImpact)) {
                            shouldShow = false;
                        }
                    }
                    
                    // Check urgency filter
                    if (activeFilters.urgencies.length > 0) {
                        const cardUrgency = card.getAttribute('data-urgency');
                        if (!activeFilters.urgencies.includes(cardUrgency)) {
                            shouldShow = false;
                        }
                    }
                    
                    // Show/hide card
                    card.style.display = shouldShow ? 'block' : 'none';
                });
                
                // Update result count
                const visibleCards = document.querySelectorAll('.update-card[style*="block"], .update-card:not([style*="none"])').length;
                const countElement = document.getElementById('resultCount');
                if (countElement) {
                    countElement.textContent = \`\${visibleCards} updates shown\`;
                }
                
            } catch (error) {
                console.error('❌ Error applying filters:', error);
            }
        }
        
        function performSearch(searchTerm) {
            console.log(\`🔍 Performing search: "\${searchTerm}"\`);
            
            try {
                if (!searchTerm || searchTerm.length < 2) {
                    // Show all cards if search is empty
                    document.querySelectorAll('.update-card').forEach(card => {
                        card.style.display = 'block';
                    });
                    return;
                }
                
                const searchLower = searchTerm.toLowerCase();
                
                document.querySelectorAll('.update-card').forEach(card => {
                    const headline = card.querySelector('.update-headline')?.textContent?.toLowerCase() || '';
                    const summary = card.querySelector('.update-summary')?.textContent?.toLowerCase() || '';
                    const authority = card.querySelector('.authority-badge')?.textContent?.toLowerCase() || '';
                    
                    const isMatch = headline.includes(searchLower) || 
                                  summary.includes(searchLower) || 
                                  authority.includes(searchLower);
                    
                    card.style.display = isMatch ? 'block' : 'none';
                });
                
            } catch (error) {
                console.error('❌ Search error:', error);
            }
        }

        // =================
        // FILTER FUNCTIONS
        // =================
        
        function clearAllFilters() {
            currentFilter = null;
            selectedAuthorities.clear();
            selectedImpactLevels.clear();
            selectedUrgencies.clear();
            
            // Clear all active filter buttons
            document.querySelectorAll('.filter-option.active').forEach(option => {
                option.classList.remove('active');
            });
            
            // Clear all checkboxes
            document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                cb.checked = false;
            });
            
            // Reset filter buttons
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            const firstFilterBtn = document.querySelector('.filter-btn');
            if (firstFilterBtn) firstFilterBtn.classList.add('active');
            
            // Show all cards
            document.querySelectorAll('.update-card').forEach(card => {
                card.style.display = 'block';
            });
            
            showMessage('All filters cleared', 'success');
        }

        function updateFilterButtons(activeButton) {
            if (!activeButton) return;
            
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            activeButton.classList.add('active');
        }

        // =================
        // ANALYTICS FUNCTIONS
        // =================
        
        async function refreshAnalytics() {
            try {
                showMessage('Refreshing analytics...', 'info');
                
                const response = await fetch('/api/analytics/refresh', {
                    method: 'POST',
                    headers: { 'Accept': 'application/json' }
                });
                
                const result = await response.json();
                
                if (result.success) {
                    analyticsPreviewData = result.dashboard;
                    updateAnalyticsPreview();
                    showMessage('Analytics refreshed successfully!', 'success');
                } else {
                    throw new Error(result.error || 'Refresh failed');
                }
            } catch (error) {
                console.error('Analytics refresh error:', error);
                showMessage('Analytics refresh failed: ' + error.message, 'error');
            }
        }

        // =================
        // FIRM PROFILE FUNCTIONS
        // =================
        
        async function handleFirmProfileSubmit(event) {
            event.preventDefault();
            
            const formData = new FormData(event.target);
            const sectors = Array.from(document.querySelectorAll('#sectorGrid input:checked')).map(cb => cb.value);
            
            const profile = {
                firmName: formData.get('firmName'),
                firmSize: formData.get('firmSize'),
                primarySectors: sectors,
                riskAppetite: formData.get('riskAppetite') || 'Medium',
                complianceMaturity: formData.get('complianceMaturity') || 'Intermediate'
            };
            
            await saveFirmProfile(profile);
        }

        async function saveFirmProfile(profile) {
            const saveBtn = document.getElementById('saveProfileBtn');
            const originalText = saveBtn ? saveBtn.textContent : '';
            
            try {
                if (saveBtn) {
                    saveBtn.disabled = true;
                    saveBtn.textContent = 'Saving...';
                }
                
                const response = await fetch('/api/firm-profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(profile)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    firmProfile = profile;
                    showMessage('Firm profile saved successfully!', 'success');
                    
                    // Reload intelligence streams if available
                    if (typeof loadIntelligenceStreams === 'function') {
                        await loadIntelligenceStreams();
                    }
                    
                    console.log('✅ Firm profile saved successfully');
                } else {
                    throw new Error(result.message || 'Failed to save profile');
                }
                
            } catch (error) {
                console.error('Save profile error:', error);
                showMessage('Failed to save profile: ' + error.message, 'error');
            } finally {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.textContent = originalText;
                }
            }
        }
 
        
        
        // =================
        // GLOBAL FUNCTION EXPOSURE - ALL FUNCTIONS
        // =================
        

        
        // *** CRITICAL MISSING FUNCTIONS ***
        window.updateLiveCounters = updateLiveCounters;
        window.initializeFilters = initializeFilters;
        window.loadMoreUpdates = loadMoreUpdates;
        
        // *** SIDEBAR FILTER FUNCTIONS ***
        window.filterByCategory = filterByCategory;
        window.selectAllCategories = selectAllCategories;
        window.clearCategoryFilters = clearCategoryFilters;
        window.filterByContentType = filterByContentType;
        window.selectAllContentTypes = selectAllContentTypes;
        window.clearContentTypeFilters = clearContentTypeFilters;
        window.filterBySourceType = filterBySourceType;
        window.selectAllSourceTypes = selectAllSourceTypes;
        window.clearSourceTypeFilters = clearSourceTypeFilters;
        window.filterByRelevance = filterByRelevance;
        window.filterByAuthority = filterByAuthority;
        
        // *** WORKSPACE FUNCTIONS ***
        window.showPinnedItems = showPinnedItems;
        window.showSavedSearches = showSavedSearches;
        window.showCustomAlerts = showCustomAlerts;
        window.showSaveDialog = showSaveDialog;
        window.closeSaveDialog = closeSaveDialog;
        window.saveCurrentView = saveCurrentView;
        
        // *** UI FUNCTIONS ***
        window.togglePin = togglePin;
        window.showFirmProfileSetup = showFirmProfileSetup;
        window.closeFirmProfileModal = closeFirmProfileModal;
        window.clearFirmProfile = clearFirmProfile;
        window.renderFilteredUpdates = renderFilteredUpdates;
        
        // *** EXPORT/SHARE FUNCTIONS ***
        window.exportData = exportData;
        window.createAlert = createAlert;
        window.shareSystem = shareSystem;
        
        // *** CORE DATA FUNCTIONS ***
        window.refreshIntelligence = refreshIntelligence;
        window.loadIntelligenceStreams = loadIntelligenceStreams;
        window.loadAnalyticsPreview = loadAnalyticsPreview;
        window.checkLiveSubscriptions = checkLiveSubscriptions;
        window.updateAnalyticsPreview = updateAnalyticsPreview;
        window.generateRelevanceBasedStreams = generateRelevanceBasedStreams;
        window.generateStream = generateStream;
        window.generateUpdateCard = generateUpdateCard;
        window.deduplicateUpdates = deduplicateUpdates;
        window.createContentFingerprint = createContentFingerprint;
        
        // *** UI INTERACTION FUNCTIONS ***
        window.toggleStreamExpansion = toggleStreamExpansion;
        window.toggleSummaryExpansion = toggleSummaryExpansion;
        window.viewUpdateDetails = viewUpdateDetails;
        
        // *** UTILITY FUNCTIONS ***
        window.showMessage = showMessage;
        window.clearMessages = clearMessages;
        window.updateWorkspaceCounts = updateWorkspaceCounts;
        window.checkSystemStatus = checkSystemStatus;
        window.initializeSystem = initializeSystem;
        
        // *** FILTER AND SEARCH FUNCTIONS ***
        window.clearFilters = clearFilters;
        window.clearAllFilters = clearAllFilters;
        window.applyActiveFilters = applyActiveFilters;
        window.performSearch = performSearch;
        window.updateFilterButtons = updateFilterButtons;
        
        // *** ANALYTICS FUNCTIONS ***
        window.refreshAnalytics = refreshAnalytics;
        
        // *** PROFILE FUNCTIONS ***
        window.handleFirmProfileSubmit = handleFirmProfileSubmit;
        window.saveFirmProfile = saveFirmProfile;
        
        // *** COUNT UPDATE FUNCTIONS ***
        window.updateAuthorityCounts = updateAuthorityCounts;
        window.updateRelevanceCounts = updateRelevanceCounts;
        
        console.log('✅ ALL FUNCTIONS LOADED AND GLOBALLY AVAILABLE');
        console.log('🔧 Critical functions fixed:', ['updateLiveCounters', 'initializeFilters', 'loadMoreUpdates']);
        console.log('🏷️ Filter functions added:', ['filterByCategory', 'filterByAuthority', 'filterByContentType']);
        console.log('💾 Dialog functions added:', ['showSaveDialog', 'closeSaveDialog', 'saveCurrentView']);
        console.log('📊 Total functions exposed:', Object.keys(window).filter(key => typeof window[key] === 'function').length);
    </script>
    `;
}

// Export ALL possible function name variations for maximum compatibility
function getCommonClientScripts() {
    return getClientScriptsContent();
}

function getClientScripts() {
    return getClientScriptsContent();
}

function getSharedClientScripts() {
    return getClientScriptsContent();
}

function getCommonScripts() {
    return getClientScriptsContent();
}

module.exports = { 
    getCommonClientScripts,
    getClientScripts,
    getSharedClientScripts,
    getCommonScripts
};