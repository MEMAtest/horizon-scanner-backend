// src/routes/shared/clientScripts.js
// COMPLETE FIX: All sidebar functions now work with backend integration

function getCommonClientScripts() {
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
        let currentFilter = null;
        let shareInProgress = false;
        let systemStatus = { database: false, api: false, overall: false };

        // =================
        // CORE FUNCTIONS (EXISTING + FIXED)
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
                showMessage('Refreshing intelligence data...', 'info');
                
                const response = await fetch('/api/refresh', {
                    method: 'POST',
                    headers: { 'Accept': 'application/json' }
                });
                
                if (!response.ok) {
                    throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
                }
                
                const result = await response.json();
                
                // Update status indicators
                if (document.getElementById('newCount')) {
                    document.getElementById('newCount').textContent = \`\${result.newArticles} New\`;
                }
                if (document.getElementById('lastUpdate')) {
                    document.getElementById('lastUpdate').textContent = \`Last: \${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}\`;
                }
                
                showMessage(\`Refreshed successfully! \${result.newArticles} new updates processed.\`, 'success');
                
                // Reload streams if function exists
                if (typeof loadIntelligenceStreams === 'function') {
                    await loadIntelligenceStreams();
                } else {
                    // Fallback - reload page
                    setTimeout(() => window.location.reload(), 1500);
                }
                
                console.log('✅ Intelligence refresh completed');
                
            } catch (error) {
                console.error('Refresh error:', error);
                showMessage('Failed to refresh data: ' + error.message, 'error');
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = '<span id="refreshIcon">🔄</span><span>Refresh Data</span>';
                }
            }
        }

        async function exportData() {
            try {
                showMessage('Preparing data export...', 'info');
                
                const response = await fetch('/api/export/data', {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' }
                });
                
                if (!response.ok) {
                    throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
                }
                
                const exportData = await response.json();
                
                // Create download
                const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                    type: 'application/json'
                });
                
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = \`regulatory-intelligence-export-\${new Date().toISOString().split('T')[0]}.json\`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                showMessage('Data exported successfully!', 'success');
                console.log('✅ Data export completed');
                
            } catch (error) {
                console.error('Export error:', error);
                showMessage('Export failed: ' + error.message, 'error');
            }
        }

        async function createAlert() {
            const keywords = prompt('Enter keywords to monitor (comma-separated):');
            if (!keywords) return;
            
            try {
                const response = await fetch('/api/alerts/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: \`Alert for: \${keywords}\`,
                        keywords: keywords.split(',').map(k => k.trim()),
                        authorities: ['FCA', 'BoE', 'PRA'],
                        isActive: true
                    })
                });
                
                if (!response.ok) {
                    throw new Error(\`HTTP \${response.status}\`);
                }
                
                const result = await response.json();
                
                if (result.success) {
                    workspaceStats.activeAlerts++;
                    updateWorkspaceCounts();
                    showMessage('Alert created successfully!', 'success');
                } else {
                    throw new Error(result.message || 'Unknown error');
                }
                
            } catch (error) {
                console.error('Create alert error:', error);
                showMessage('Failed to create alert: ' + error.message, 'error');
            }
        }

        async function shareSystem() {
            if (shareInProgress) {
                showMessage('Share already in progress...', 'warning');
                return;
            }
            
            shareInProgress = true;
            try {
                const shareData = {
                    title: 'Regulatory Horizon Scanner',
                    text: 'AI-powered regulatory intelligence monitoring system',
                    url: window.location.origin
                };
                
                if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
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
        // SIDEBAR FILTER FUNCTIONS (NEW)
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
        async function filterByRelevance(relevanceLevel) {
            try {
                console.log('🎯 Filtering by relevance:', relevanceLevel);
                showMessage(\`Filtering by relevance: \${relevanceLevel}...\`, 'info');
                
                const response = await fetch(\`/api/search?relevanceFilter=\${relevanceLevel}\`);
                const data = await response.json();
                
                if (data.success) {
                    renderFilteredUpdates(data.results, \`\${relevanceLevel} relevance\`);
                    showMessage(\`Showing \${data.total} \${relevanceLevel} relevance updates\`, 'success');
                    currentFilter = { type: 'relevance', value: relevanceLevel };
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

        // =================
        // HELPER FUNCTIONS
        // =================
        
        function renderFilteredUpdates(updates, filterTitle) {
            const streamsContainer = document.getElementById('streamsContainer');
            if (!streamsContainer) {
                console.warn('No streams container found for filtering');
                return;
            }
            
            if (typeof generateRelevanceBasedStreams === 'function') {
                // Use the page's own function if available
                const data = { urgent: [], moderate: [], low: updates };
                streamsContainer.innerHTML = generateRelevanceBasedStreams(data, filterTitle);
            } else {
                // Fallback rendering
                streamsContainer.innerHTML = renderBasicUpdateList(updates, filterTitle);
            }
            
            // Reload pinned status if function exists
            if (typeof loadPinnedStatus === 'function') {
                loadPinnedStatus();
            }
        }

        function renderBasicUpdateList(updates, title) {
            if (!updates || updates.length === 0) {
                return \`
                    <div class="welcome-content">
                        <div class="welcome-icon">📭</div>
                        <div class="welcome-title">No Updates Found</div>
                        <div class="welcome-subtitle">
                            No updates match the current filter: \${title}
                        </div>
                        <button onclick="clearFilters()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">Clear Filters</button>
                    </div>
                \`;
            }
            
            return \`
                <div class="intelligence-stream">
                    <div class="stream-header">
                        <div class="stream-title">
                            <div class="stream-icon low"></div>
                            <span>\${title}</span>
                            <span style="color: #6b7280;">• \${updates.length} Item\${updates.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div class="stream-meta">
                            <button onclick="clearFilters()" style="background: #f3f4f6; border: 1px solid #e5e7eb; color: #374151; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; cursor: pointer;">Clear Filter</button>
                        </div>
                    </div>
                    <div class="stream-content">
                        \${updates.map((update, index) => \`
                            <div class="update-card" data-url="\${update.url}">
                                <div class="update-header">
                                    <div class="update-title" onclick="window.open('\${update.url}', '_blank')">\${update.headline || 'No title'}</div>
                                    <div class="update-actions">
                                        <button class="pin-btn" onclick="event.stopPropagation(); togglePin('\${update.url}', '\${(update.headline || '').replace(/'/g, "\\\\'")}', '\${update.authority}')" title="Pin item">📍</button>
                                    </div>
                                </div>
                                <div class="update-badges">
                                    <div class="badge badge-\${(update.authority || 'unknown').toLowerCase()}">\${update.authority || 'Unknown'}</div>
                                    \${update.impactLevel ? \`<div class="badge" style="background: #fef2f2; color: #dc2626;">\${update.impactLevel}</div>\` : ''}
                                    \${update.urgency ? \`<div class="badge" style="background: #fff7ed; color: #ea580c;">\${update.urgency}</div>\` : ''}
                                </div>
                                <div class="update-summary">
                                    \${(() => {
                                        const summary = update.ai_summary || update.impact || update.summary || 'No description available';
                                        return summary.length > 150 ? summary.substring(0, 150) + '...' : summary;
                                    })()}
                                </div>
                                <div class="update-footer">
                                    <div class="update-time">
                                        <span>📅</span>
                                        <span>\${new Date(update.fetchedDate || Date.now()).toLocaleDateString('en-GB', { 
                                            day: 'numeric', 
                                            month: 'short', 
                                            year: 'numeric' 
                                        })}</span>
                                    </div>
                                    <a href="\${update.url}" target="_blank" class="view-details" onclick="event.stopPropagation()">
                                        View Source →
                                    </a>
                                </div>
                            </div>
                        \`).join('')}
                    </div>
                </div>
            \`;
        }

        function showMessage(message, type = 'info') {
            console.log(\`\${type.toUpperCase()}: \${message}\`);
            
            // Create a temporary toast notification
            const toast = document.createElement('div');
            const bgColor = type === 'error' ? '#fef2f2' : type === 'success' ? '#f0fdf4' : type === 'warning' ? '#fffbeb' : '#eff6ff';
            const textColor = type === 'error' ? '#dc2626' : type === 'success' ? '#166534' : type === 'warning' ? '#d97706' : '#1e40af';
            const borderColor = type === 'error' ? '#fecaca' : type === 'success' ? '#bbf7d0' : type === 'warning' ? '#fde68a' : '#bfdbfe';
            
            toast.style.cssText = \`
                position: fixed;
                top: 20px;
                right: 20px;
                background: \${bgColor};
                color: \${textColor};
                padding: 1rem 1.5rem;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                z-index: 1000;
                font-size: 0.875rem;
                font-weight: 500;
                transition: all 0.3s ease;
                border: 1px solid \${borderColor};
                max-width: 400px;
                word-wrap: break-word;
            \`;
            toast.textContent = message;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (document.body.contains(toast)) {
                        document.body.removeChild(toast);
                    }
                }, 300);
            }, type === 'error' ? 5000 : 3000);
        }

        // =================
        // FIRM PROFILE FUNCTIONS (EXISTING)
        // =================
        
        function showFirmProfileSetup() {
            const modal = document.getElementById('firmProfileModal');
            const sectorGrid = document.getElementById('sectorGrid');
            const messageContainer = document.getElementById('messageContainer');
            
            if (!modal) {
                console.error('Firm profile modal not found');
                showMessage('Profile setup not available on this page', 'error');
                return;
            }
            
            if (messageContainer) messageContainer.innerHTML = '';
            
            // Populate sectors
            if (sectorGrid) {
                sectorGrid.innerHTML = '';
                availableSectors.forEach(sector => {
                    const isSelected = firmProfile && firmProfile.primarySectors && firmProfile.primarySectors.includes(sector);
                    
                    const sectorDiv = document.createElement('div');
                    sectorDiv.className = \`sector-checkbox \${isSelected ? 'selected' : ''}\`;
                    sectorDiv.innerHTML = \`
                        <input type="checkbox" id="sector_\${sector.replace(/\\s+/g, '_')}" value="\${sector}" \${isSelected ? 'checked' : ''}>
                        <label for="sector_\${sector.replace(/\\s+/g, '_')}">\${sector}</label>
                    \`;
                    
                    sectorDiv.addEventListener('click', function(e) {
                        e.preventDefault();
                        
                        const checkbox = sectorDiv.querySelector('input');
                        const currentlyChecked = document.querySelectorAll('#sectorGrid input[type="checkbox"]:checked');
                        
                        if (!checkbox.checked && currentlyChecked.length >= 3) {
                            showMessage('Please select a maximum of 3 sectors', 'error');
                            return;
                        }
                        
                        checkbox.checked = !checkbox.checked;
                        sectorDiv.classList.toggle('selected', checkbox.checked);
                        
                        if (currentlyChecked.length <= 3) {
                            clearMessages();
                        }
                    });
                    
                    sectorGrid.appendChild(sectorDiv);
                });
            }
            
            // Set firm name if exists
            if (firmProfile) {
                const firmNameInput = document.getElementById('firmNameInput');
                const firmSizeInput = document.getElementById('firmSizeInput');
                if (firmNameInput) firmNameInput.value = firmProfile.firmName || '';
                if (firmSizeInput) firmSizeInput.value = firmProfile.firmSize || 'Medium';
            }
            
            modal.style.display = 'block';
        }

        function closeFirmProfileModal() {
            const modal = document.getElementById('firmProfileModal');
            if (modal) {
                modal.style.display = 'none';
            }
            clearMessages();
        }

        function clearMessages() {
            const messageContainer = document.getElementById('messageContainer');
            if (messageContainer) {
                messageContainer.innerHTML = '';
            }
        }

        async function loadFirmProfile() {
            try {
                const response = await fetch('/api/firm-profile');
                
                if (response.ok) {
                    const result = await response.json();
                    firmProfile = result.profile;
                    availableSectors = result.availableSectors || [
                        'Banking', 'Investment Management', 'Consumer Credit', 
                        'Insurance', 'Payments', 'Pensions', 'Mortgages', 
                        'Capital Markets', 'Cryptocurrency', 'Fintech', 'General'
                    ];
                    
                    console.log('✅ Firm profile loaded:', firmProfile ? firmProfile.firmName : 'No profile');
                } else {
                    console.log('No firm profile found');
                    availableSectors = [
                        'Banking', 'Investment Management', 'Consumer Credit', 
                        'Insurance', 'Payments', 'Pensions', 'Mortgages', 
                        'Capital Markets', 'Cryptocurrency', 'Fintech', 'General'
                    ];
                }
                
            } catch (error) {
                console.error('Error loading firm profile:', error);
                availableSectors = [
                    'Banking', 'Investment Management', 'Consumer Credit', 
                    'Insurance', 'Payments', 'Pensions', 'Mortgages', 
                    'Capital Markets', 'Cryptocurrency', 'Fintech', 'General'
                ];
            }
        }

        function updateFirmProfileUI() {
            const profileBtn = document.getElementById('profileBtn');
            const profileInfo = document.getElementById('profileInfo');
            const clearBtn = document.getElementById('clearProfileBtn');
            const firmStatus = document.getElementById('firmStatus');
            const firmNameSpan = document.getElementById('firmName');
            
            if (profileBtn) {
                if (firmProfile) {
                    profileBtn.textContent = 'Update Firm Profile';
                    profileBtn.classList.add('configured');
                } else {
                    profileBtn.textContent = 'Setup Firm Profile';
                    profileBtn.classList.remove('configured');
                }
            }
            
            if (profileInfo) {
                profileInfo.textContent = firmProfile ? 
                    \`\${firmProfile.firmName} • \${firmProfile.primarySectors.join(', ')}\` :
                    'Configure your firm\\'s sectors for personalized analytics';
            }
            
            if (clearBtn) {
                clearBtn.style.display = firmProfile ? 'block' : 'none';
            }
            
            if (firmStatus) {
                firmStatus.style.display = firmProfile ? 'block' : 'none';
            }
            
            if (firmNameSpan) {
                firmNameSpan.textContent = firmProfile ? firmProfile.firmName : 'No profile';
            }
        }

        async function clearFirmProfile() {
            if (!confirm('Are you sure you want to clear your firm profile? This will reset all personalization.')) {
                return;
            }

            try {
                const response = await fetch('/api/firm-profile', {
                    method: 'DELETE',
                    headers: { 'Accept': 'application/json' }
                });

                if (!response.ok) {
                    throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
                }

                firmProfile = null;
                updateFirmProfileUI();
                
                if (typeof loadIntelligenceStreams === 'function') {
                    await loadIntelligenceStreams();
                }
                
                showMessage('Firm profile cleared successfully!', 'success');
                console.log('✅ Firm profile cleared');
                
            } catch (error) {
                console.error('Error clearing firm profile:', error);
                showMessage('Error clearing profile: ' + error.message, 'error');
            }
        }

        async function updateWorkspaceCounts() {
            try {
                const response = await fetch('/api/workspace/stats');
                
                if (response.ok) {
                    const data = await response.json();
                    
                    if (data.success) {
                        workspaceStats = data.stats;
                        
                        // Update UI counts
                        const pinnedCount = document.getElementById('pinnedCount');
                        const savedSearchCount = document.getElementById('savedSearchCount');
                        const alertCount = document.getElementById('alertCount');
                        
                        if (pinnedCount) pinnedCount.textContent = workspaceStats.pinnedItems || 0;
                        if (savedSearchCount) savedSearchCount.textContent = workspaceStats.savedSearches || 0;
                        if (alertCount) alertCount.textContent = workspaceStats.activeAlerts || 0;
                    }
                }
                
            } catch (error) {
                console.error('Error updating workspace counts:', error);
            }
        }

        // =================
        // PIN FUNCTIONALITY
        // =================
        
        async function togglePin(updateUrl, updateTitle, updateAuthority) {
            const pinBtn = document.querySelector(\`[data-url="\${updateUrl}"] .pin-btn\`);
            
            if (!pinBtn) {
                console.error('Pin button not found for URL:', updateUrl);
                return;
            }
            
            const isPinned = pinBtn.classList.contains('pinned');
            
            try {
                if (isPinned) {
                    // Unpin
                    const response = await fetch(\`/api/workspace/pin/\${encodeURIComponent(updateUrl)}\`, {
                        method: 'DELETE'
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        pinBtn.textContent = '📍';
                        pinBtn.classList.remove('pinned');
                        pinBtn.title = 'Pin item';
                        workspaceStats.pinnedItems = Math.max(0, workspaceStats.pinnedItems - 1);
                        updateWorkspaceCounts();
                        showMessage('Item unpinned', 'success');
                    }
                } else {
                    // Pin
                    const response = await fetch('/api/workspace/pin', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            updateUrl,
                            updateTitle,
                            updateAuthority
                        })
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        pinBtn.textContent = '📌';
                        pinBtn.classList.add('pinned');
                        pinBtn.title = 'Unpin item';
                        workspaceStats.pinnedItems++;
                        updateWorkspaceCounts();
                        showMessage('Item pinned successfully', 'success');
                    }
                }
            } catch (error) {
                console.error('Error toggling pin:', error);
                showMessage('Error with pin action: ' + error.message, 'error');
            }
        }

        // =================
        // INITIALIZATION
        // =================
        
        // Initialize common functionality when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeCommonFunctions);
        } else {
            initializeCommonFunctions();
        }
        
        function initializeCommonFunctions() {
            // Set up form handlers
            const firmProfileForm = document.getElementById('firmProfileForm');
            if (firmProfileForm) {
                firmProfileForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    
                    const firmNameInput = document.getElementById('firmNameInput');
                    const firmSizeInput = document.getElementById('firmSizeInput');
                    
                    if (!firmNameInput || !firmSizeInput) {
                        showMessage('Form elements not found', 'error');
                        return;
                    }
                    
                    const firmName = firmNameInput.value.trim();
                    const firmSize = firmSizeInput.value;
                    const selectedSectors = Array.from(document.querySelectorAll('#sectorGrid input:checked')).map(cb => cb.value);
                    
                    if (!firmName) {
                        showMessage('Please enter a firm name', 'error');
                        return;
                    }
                    
                    if (selectedSectors.length === 0) {
                        showMessage('Please select at least one business sector', 'error');
                        return;
                    }
                    
                    if (selectedSectors.length > 3) {
                        showMessage('Please select maximum 3 business sectors', 'error');
                        return;
                    }
                    
                    saveFirmProfile(firmName, firmSize, selectedSectors);
                });
            }
            
            // Set up modal click outside to close
            window.addEventListener('click', function(event) {
                const modal = document.getElementById('firmProfileModal');
                if (modal && event.target === modal) {
                    closeFirmProfileModal();
                }
            });
            
            // Load initial data
            loadFirmProfile().then(() => {
                updateFirmProfileUI();
                updateWorkspaceCounts();
            });
            
            console.log('✅ Common client scripts initialized with all sidebar functions');
        }

        async function saveFirmProfile(firmName, firmSize, selectedSectors) {
            const saveBtn = document.getElementById('saveProfileBtn');
            const originalText = saveBtn ? saveBtn.textContent : 'Save Profile';
            
            try {
                if (saveBtn) {
                    saveBtn.disabled = true;
                    saveBtn.textContent = 'Saving...';
                }
                
                const response = await fetch('/api/firm-profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        firmName: firmName,
                        firmSize: firmSize,
                        primarySectors: selectedSectors
                    })
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                    throw new Error(errorData.error || \`HTTP \${response.status}: \${response.statusText}\`);
                }
                
                const result = await response.json();
                
                if (result.success) {
                    firmProfile = result.profile;
                    updateFirmProfileUI();
                    closeFirmProfileModal();
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
        // GLOBAL FUNCTION EXPOSURE
        // =================
        
        // Core functions
        window.refreshIntelligence = refreshIntelligence;
        window.exportData = exportData;
        window.createAlert = createAlert;
        window.shareSystem = shareSystem;
        
        // Category filtering
        window.filterByCategory = filterByCategory;
        window.selectAllCategories = selectAllCategories;
        window.clearCategoryFilters = clearCategoryFilters;
        
        // Content type filtering
        window.filterByContentType = filterByContentType;
        window.selectAllContentTypes = selectAllContentTypes;
        window.clearContentTypeFilters = clearContentTypeFilters;
        
        // Source type filtering
        window.filterBySourceType = filterBySourceType;
        window.selectAllSourceTypes = selectAllSourceTypes;
        window.clearSourceTypeFilters = clearSourceTypeFilters;
        
        // Relevance and authority filtering
        window.filterByRelevance = filterByRelevance;
        window.filterByAuthority = filterByAuthority;
        
        // Workspace functions
        window.showPinnedItems = showPinnedItems;
        window.showSavedSearches = showSavedSearches;
        window.showCustomAlerts = showCustomAlerts;
        
        // General functions
        window.clearFilters = clearFilters;
        window.showFirmProfileSetup = showFirmProfileSetup;
        window.closeFirmProfileModal = closeFirmProfileModal;
        window.clearFirmProfile = clearFirmProfile;
        window.showMessage = showMessage;
        window.clearMessages = clearMessages;
        window.togglePin = togglePin;
        window.updateWorkspaceCounts = updateWorkspaceCounts;
        window.renderFilteredUpdates = renderFilteredUpdates;
        
        console.log('🚀 All sidebar functions now globally available!');
        console.log('✅ Functions loaded:', Object.keys(window).filter(key => key.startsWith('filter') || key.startsWith('show') || key.startsWith('clear')));
    </script>
    `
}

module.exports = { getCommonClientScripts }
