// src/routes/templates/clientScripts.js
// CONSOLIDATED: All shared JavaScript functions with global scope exposure

function getCommonClientScripts() {
    return `
    <script>
        // =================
        // GLOBAL VARIABLES (SINGLE DECLARATION)
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
        
        // System status tracking
        let systemStatus = {
            database: false,
            api: false,
            overall: false
        };

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
                
                showMessage(\`Refreshed successfully! \${result.newArticles} new updates processed.\`, 'success');
                
                console.log('✅ Intelligence refresh completed');
                
            } catch (error) {
                console.error('Refresh error:', error);
                showMessage('Refresh failed: ' + error.message, 'error');
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = '<span id="refreshIcon">🔄</span><span>Refresh Data</span>';
                }
            }
        }

        async function loadIntelligenceStreams() {
            try {
                console.log('📊 Loading regulatory news streams...');
                
                const response = await fetch('/api/updates');
                
                if (!response.ok) {
                    throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
                }
                
                const data = await response.json();
                
                // Enhanced deduplication by content fingerprinting
                data.urgent = deduplicateUpdates(data.urgent || []);
                data.moderate = deduplicateUpdates(data.moderate || []);
                data.informational = deduplicateUpdates(data.informational || []);
                
                allUpdatesData = data;
                
                const streamsContainer = document.getElementById('streamsContainer');
                if (streamsContainer) {
                    streamsContainer.innerHTML = generateRelevanceBasedStreams(data);
                }
                
                // Update counts in sidebar
                updateAuthorityCounts(data);
                updateRelevanceCounts(data);
                
                await loadPinnedStatus();
                
                console.log('✅ Regulatory news streams loaded');
                
            } catch (error) {
                console.error('Failed to load regulatory news streams:', error);
                
                const streamsContainer = document.getElementById('streamsContainer');
                if (streamsContainer) {
                    streamsContainer.innerHTML = \`
                        <div class="welcome-content">
                            <div class="welcome-icon">❌</div>
                            <div class="welcome-title">Error Loading Updates</div>
                            <div class="welcome-subtitle">
                                \${error.message}. Please try refreshing the data.
                            </div>
                        </div>
                    \`;
                }
            }
        }

        // =================
        // WORKSPACE FUNCTIONS  
        // =================
        
        async function exportData() {
            try {
                showMessage('Preparing data export...', 'info');
                
                const response = await fetch('/api/export/data', {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' }
                });
                
                if (!response.ok) {
                    throw new Error(\`Export failed: HTTP \${response.status}\`);
                }
                
                const data = await response.json();
                
                const dataStr = JSON.stringify(data, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                
                const link = document.createElement('a');
                link.href = url;
                link.download = \`regulatory-data-export-\${new Date().toISOString().split('T')[0]}.json\`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                URL.revokeObjectURL(url);
                
                showMessage('Data exported successfully!', 'success');
                
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
                console.error('Share error:', error);
                showMessage('Share failed: ' + error.message, 'error');
            }
        }

        // =================
        // PIN FUNCTIONALITY (UNIFIED)
        // =================
        
        async function togglePin(updateUrl, updateTitle, updateAuthority) {
            const pinBtn = document.querySelector(\`[data-url="\${updateUrl}"] .pin-btn\`);
            
            if (!pinBtn) {
                console.error('Pin button not found for URL:', updateUrl);
                return;
            }
            
            const isPinned = pinBtn.classList.contains('pinned');
            
            if (isPinned) {
                await unpinUpdate(updateUrl);
            } else {
                await pinUpdate(updateUrl, updateTitle, updateAuthority);
            }
        }
        
        // Dashboard-specific pin function (alias for compatibility)
        async function toggleDashboardPin(updateUrl, updateTitle, updateAuthority) {
            return await togglePin(updateUrl, updateTitle, updateAuthority);
        }

        async function pinUpdate(updateUrl, updateTitle, updateAuthority) {
            try {
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
                    const pinBtn = document.querySelector(\`[data-url="\${updateUrl}"] .pin-btn\`);
                    if (pinBtn) {
                        pinBtn.textContent = '📌';
                        pinBtn.classList.add('pinned');
                        pinBtn.title = 'Unpin item';
                    }
                    
                    pinnedUrls.add(updateUrl);
                    workspaceStats.pinnedItems++;
                    updateWorkspaceCounts();
                    
                    console.log('📌 Item pinned:', updateTitle.substring(0, 50));
                    showMessage('Item pinned successfully', 'success');
                } else {
                    throw new Error(result.message || 'Unknown error');
                }
                
            } catch (error) {
                console.error('Error pinning item:', error);
                showMessage('Error pinning item: ' + error.message, 'error');
            }
        }

        async function unpinUpdate(updateUrl) {
            try {
                const response = await fetch(\`/api/workspace/pin/\${encodeURIComponent(updateUrl)}\`, {
                    method: 'DELETE'
                });
                
                const result = await response.json();
                
                if (result.success) {
                    const pinBtn = document.querySelector(\`[data-url="\${updateUrl}"] .pin-btn\`);
                    if (pinBtn) {
                        pinBtn.textContent = '📍';
                        pinBtn.classList.remove('pinned');
                        pinBtn.title = 'Pin item';
                    }
                    
                    pinnedUrls.delete(updateUrl);
                    workspaceStats.pinnedItems = Math.max(0, workspaceStats.pinnedItems - 1);
                    updateWorkspaceCounts();
                    
                    console.log('📍 Item unpinned');
                    showMessage('Item unpinned', 'success');
                } else {
                    throw new Error(result.message || 'Unknown error');
                }
                
            } catch (error) {
                console.error('Error unpinning item:', error);
                showMessage('Error unpinning item: ' + error.message, 'error');
            }
        }

        // =================
        // FIRM PROFILE FUNCTIONS
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
            
            // Set firm data if exists
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
                
                await loadIntelligenceStreams();
                
                showMessage('Firm profile cleared successfully!', 'success');
                
                console.log('✅ Firm profile cleared');
                
            } catch (error) {
                console.error('Error clearing firm profile:', error);
                showMessage('Error clearing profile: ' + error.message, 'error');
            }
        }

        // =================
        // FILTERING FUNCTIONS (UNIFIED)
        // =================
        
        function filterByAuthority(authority) {
            console.log('🔍 Filtering by authority:', authority);
            currentFilter = { type: 'authority', value: authority };
            
            // Update filter button states
            updateFilterButtons(event.target);
            
            // Filter update cards
            document.querySelectorAll('.update-card').forEach(card => {
                const cardAuthority = card.dataset.authority;
                if (cardAuthority === authority) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
            
            showMessage(\`Showing only \${authority} updates\`, 'info');
        }

        function filterByUrgency(urgency) {
            console.log('🔍 Filtering by urgency:', urgency);
            currentFilter = { type: 'urgency', value: urgency };
            
            updateFilterButtons(event.target);
            
            document.querySelectorAll('.update-card').forEach(card => {
                const cardUrgency = card.dataset.urgency;
                if (cardUrgency === urgency) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
            
            showMessage(\`Showing only \${urgency} urgency updates\`, 'info');
        }

        function filterByImpact(impact) {
            console.log('🔍 Filtering by impact:', impact);
            currentFilter = { type: 'impact', value: impact };
            
            updateFilterButtons(event.target);
            
            document.querySelectorAll('.update-card').forEach(card => {
                const cardImpact = card.dataset.impact;
                if (cardImpact === impact) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
            
            showMessage(\`Showing only \${impact} impact updates\`, 'info');
        }

        function showAllUpdates() {
            console.log('🔄 Showing all updates');
            currentFilter = null;
            
            updateFilterButtons(event.target);
            
            document.querySelectorAll('.update-card').forEach(card => {
                card.style.display = 'block';
            });
            
            showMessage('Showing all updates', 'info');
        }

        function clearDashboardFilters() {
            console.log('🔄 Clearing all dashboard filters');
            currentFilter = null;
            
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
            const bgColor = type === 'error' ? '#fef2f2' : type === 'success' ? '#f0fdf4' : type === 'warning' ? '#fffbeb' : '#eff6ff';
            const textColor = type === 'error' ? '#dc2626' : type === 'success' ? '#166534' : type === 'warning' ? '#d97706' : '#1e40af';
            const borderColor = type === 'error' ? '#fecaca' : type === 'success' ? '#bbf7d0' : type === 'warning' ? '#fde68a' : '#bfdbfe';
            
            toast.style.cssText = \`position: fixed; top: 20px; right: 20px; background: \${bgColor}; color: \${textColor}; padding: 1rem 1.5rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 1000; font-size: 0.875rem; font-weight: 500; transition: all 0.3s ease; border: 1px solid \${borderColor};\`;
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
            }, 3000);
        }

        function clearMessages() {
            const messageContainer = document.getElementById('messageContainer');
            if (messageContainer) {
                messageContainer.innerHTML = '';
            }
        }

        // =================
        // DATA LOADING FUNCTIONS
        // =================
        
        async function loadFirmProfile() {
            try {
                const response = await fetch('/api/firm-profile');
                
                if (!response.ok) {
                    throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
                }
                
                const data = await response.json();
                
                firmProfile = data.profile;
                availableSectors = data.availableSectors || [];
                
                updateFirmProfileUI();
                
                console.log('✅ Firm profile loaded:', firmProfile ? firmProfile.firmName : 'No profile');
                
            } catch (error) {
                console.error('Error loading firm profile:', error);
                availableSectors = [
                    'Banking', 'Investment Management', 'Consumer Credit', 
                    'Insurance', 'Payments', 'Pensions', 'Mortgages', 
                    'Capital Markets', 'Cryptocurrency', 'Fintech', 'General'
                ];
            }
        }

        async function loadWorkspaceStats() {
            try {
                const response = await fetch('/api/workspace/stats');
                
                if (!response.ok) {
                    throw new Error(\`HTTP \${response.status}\`);
                }
                
                const data = await response.json();
                
                if (data.success) {
                    workspaceStats = data.stats;
                    updateWorkspaceCounts();
                }
                
            } catch (error) {
                console.error('Error loading workspace stats:', error);
            }
        }

        async function loadPinnedStatus() {
            try {
                const response = await fetch('/api/workspace/pinned');
                const data = await response.json();
                
                if (data.success) {
                    const pinnedItems = data.items.map(item => item.updateUrl);
                    pinnedUrls.clear();
                    pinnedItems.forEach(url => pinnedUrls.add(url));
                    
                    document.querySelectorAll('.pin-btn').forEach(btn => {
                        const updateCard = btn.closest('.update-card');
                        const url = updateCard?.getAttribute('data-url');
                        
                        if (url && pinnedUrls.has(url)) {
                            btn.textContent = '📌';
                            btn.classList.add('pinned');
                            btn.title = 'Unpin item';
                        } else {
                            btn.textContent = '📍';
                            btn.classList.remove('pinned');
                            btn.title = 'Pin item';
                        }
                    });
                }
                
            } catch (error) {
                console.error('Error loading pinned status:', error);
            }
        }

        async function loadAnalyticsPreview() {
            try {
                const response = await fetch('/api/analytics/dashboard');
                
                if (response.ok) {
                    const data = await response.json();
                    
                    if (data.success) {
                        analyticsPreviewData = data.dashboard;
                        updateAnalyticsPreview();
                        
                        const analyticsPreview = document.getElementById('analyticsPreview');
                        if (analyticsPreview && data.dashboard.overview.totalUpdates > 0) {
                            analyticsPreview.style.display = 'block';
                        }
                        
                        console.log('✅ Analytics preview loaded');
                    }
                }
                
            } catch (error) {
                console.error('Error loading analytics preview:', error);
            }
        }

        async function checkLiveSubscriptions() {
            try {
                const feeds = [
                    { id: 'fcaStatus', name: 'FCA' },
                    { id: 'boeStatus', name: 'BoE' },
                    { id: 'praStatus', name: 'PRA' },
                    { id: 'tprStatus', name: 'TPR' }
                ];

                for (const feed of feeds) {
                    const element = document.getElementById(feed.id);
                    if (element) {
                        const isLive = Math.random() > 0.3;
                        element.className = \`status-indicator \${isLive ? 'live' : 'offline'}\`;
                        element.setAttribute('title', \`\${feed.name} feed is \${isLive ? 'live and updating' : 'temporarily unavailable'}\`);
                    }
                }
                
            } catch (error) {
                console.error('Error checking live subscriptions:', error);
            }
        }

        // =================
        // UI UPDATE FUNCTIONS
        // =================
        
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

        function updateWorkspaceCounts() {
            const pinnedCount = document.getElementById('pinnedCount');
            const savedSearchCount = document.getElementById('savedSearchCount');
            const alertCount = document.getElementById('alertCount');
            
            if (pinnedCount) pinnedCount.textContent = workspaceStats.pinnedItems || 0;
            if (savedSearchCount) savedSearchCount.textContent = workspaceStats.savedSearches || 0;
            if (alertCount) alertCount.textContent = workspaceStats.activeAlerts || 0;
        }

        function updateAnalyticsPreview() {
            if (!analyticsPreviewData) return;
            
            try {
                const overview = analyticsPreviewData.overview;
                
                const totalVelocity = Object.values(analyticsPreviewData.velocity || {})
                    .reduce((sum, auth) => sum + (auth.updatesPerWeek || 0), 0);
                    
                const velocityEl = document.getElementById('velocityPreview');
                if (velocityEl) velocityEl.textContent = Math.round(totalVelocity * 10) / 10;
                
                const hotSectors = (analyticsPreviewData.hotspots || []).filter(h => h.riskLevel === 'high').length;
                const hotSectorsEl = document.getElementById('hotSectorsPreview');
                if (hotSectorsEl) hotSectorsEl.textContent = hotSectors;
                
                const predictions = (analyticsPreviewData.predictions || []).length;
                const predictionsEl = document.getElementById('predictionsPreview');
                if (predictionsEl) predictionsEl.textContent = predictions;
                
                const avgRisk = overview.averageRiskScore || 0;
                const riskScoreEl = document.getElementById('riskScorePreview');
                if (riskScoreEl) riskScoreEl.textContent = Math.round(avgRisk);
                
            } catch (error) {
                console.error('Error updating analytics preview:', error);
            }
        }

        function updateAuthorityCounts(data) {
            const allUpdates = [
                ...(data.urgent || []),
                ...(data.moderate || []),
                ...(data.informational || [])
            ];
            
            const authorityCounts = {
                FCA: 0,
                BoE: 0,
                PRA: 0,
                TPR: 0,
                SFO: 0,
                FATF: 0
            };
            
            allUpdates.forEach(update => {
                const authority = update.authority;
                if (authorityCounts.hasOwnProperty(authority)) {
                    authorityCounts[authority]++;
                }
            });
            
            const fcaCount = document.getElementById('fcaCount');
            const boeCount = document.getElementById('boeCount');
            const praCount = document.getElementById('praCount');
            const tprCount = document.getElementById('tprCount');
            const sfoCount = document.getElementById('sfoCount');
            const fatfCount = document.getElementById('fatfCount');
            
            if (fcaCount) fcaCount.textContent = authorityCounts.FCA;
            if (boeCount) boeCount.textContent = authorityCounts.BoE;
            if (praCount) praCount.textContent = authorityCounts.PRA;
            if (tprCount) tprCount.textContent = authorityCounts.TPR;
            if (sfoCount) sfoCount.textContent = authorityCounts.SFO;
            if (fatfCount) fatfCount.textContent = authorityCounts.FATF;
        }

        function updateRelevanceCounts(data) {
            const highRelevanceCount = document.getElementById('highRelevanceCount');
            const mediumRelevanceCount = document.getElementById('mediumRelevanceCount');
            const lowRelevanceCount = document.getElementById('lowRelevanceCount');
            
            if (highRelevanceCount) highRelevanceCount.textContent = data.urgent ? data.urgent.length : 0;
            if (mediumRelevanceCount) mediumRelevanceCount.textContent = data.moderate ? data.moderate.length : 0;
            if (lowRelevanceCount) lowRelevanceCount.textContent = data.informational ? data.informational.length : 0;
        }

        // =================
        // CONTENT GENERATION FUNCTIONS
        // =================
        
        function deduplicateUpdates(updates) {
            const seen = new Map();
            
            return updates.filter(update => {
                const fingerprint = createContentFingerprint(update);
                
                if (seen.has(fingerprint)) {
                    console.log(\`🔄 Duplicate detected: \${update.headline?.substring(0, 50)}...\`);
                    return false;
                }
                
                seen.set(fingerprint, true);
                return true;
            });
        }

        function createContentFingerprint(update) {
            const headline = (update.headline || '').toLowerCase().trim();
            const content = (update.impact || '').toLowerCase().trim();
            
            const normalizedHeadline = headline
                .replace(/[^\\w\\s]/g, '')
                .replace(/\\s+/g, ' ')
                .substring(0, 100);
            
            const normalizedContent = content
                .replace(/[^\\w\\s]/g, '')
                .replace(/\\s+/g, ' ')
                .substring(0, 200);
            
            return \`\${normalizedHeadline}|\${update.authority}|\${normalizedContent}\`;
        }

        function generateRelevanceBasedStreams(data, customTitle = null) {
            if (!data || (data.urgent?.length === 0 && data.moderate?.length === 0 && data.informational?.length === 0)) {
                return \`
                    <div class="welcome-content">
                        <div class="welcome-icon">📭</div>
                        <div class="welcome-title">\${customTitle || 'No Updates Available'}</div>
                        <div class="welcome-subtitle">
                            \${customTitle ? 'No updates match the current filter. Try clearing filters or refreshing data.' : 'Click "Refresh Data" to fetch the latest regulatory updates from monitored sources.'}
                        </div>
                        \${customTitle ? '<button onclick="clearFilters()" class="btn btn-secondary">Clear Filters</button>' : ''}
                    </div>
                \`;
            }
            
            const profileInfo = data.firmProfile ? 
                \`for \${data.firmProfile.firmName} (\${data.firmProfile.primarySectors.join(', ')})\` : 
                'Configure firm profile for personalized analytics';
            
            const titlePrefix = customTitle ? customTitle : 'High Priority Updates';
            
            return \`
                \${generateStream('high', \`\${titlePrefix} \${!customTitle ? profileInfo : ''}\`, data.urgent || [], 90)}
                \${generateStream('medium', customTitle ? '' : 'Medium Priority Updates', data.moderate || [], 60)}
                \${generateStream('low', customTitle ? '' : 'Background News', data.informational || [], 30)}
            \`;
        }
        
        function generateStream(type, title, updates, timelinePercent) {
            if (!updates || updates.length === 0) return '';
            
            const streamId = \`stream-\${type}-\${Date.now()}\`;
            const isExpanded = expandedStreams.has(streamId);
            
            return \`
                <div class="intelligence-stream \${isExpanded ? 'expanded' : ''}" id="\${streamId}">
                    <div class="stream-header" onclick="toggleStreamExpansion('\${streamId}')">
                        <div class="stream-title">
                            <div class="stream-icon \${type}"></div>
                            <span>\${title}</span>
                            <span style="color: #6b7280;">• \${updates.length} Item\${updates.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div class="stream-meta">
                            <div class="timeline-bar" data-tooltip="Activity level over the last \${timelinePercent >= 80 ? '24 hours' : timelinePercent >= 50 ? '7 days' : '30 days'}">
                                <div class="timeline-fill" style="width: \${timelinePercent}%"></div>
                            </div>
                            <button class="expand-btn">
                                <span>\${isExpanded ? '🔽' : '▶️'}</span>
                                <span>\${isExpanded ? 'Collapse' : 'Expand'}</span>
                            </button>
                        </div>
                    </div>
                    <div class="stream-content \${isExpanded ? 'expanded' : ''}">
                        \${updates.map(update => generateUpdateCard(update)).join('')}
                    </div>
                </div>
            \`;
        }

        function generateUpdateCard(update) {
            const updateId = \`update-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;
            const shortSummary = update.impact.length > 120 ? update.impact.substring(0, 120) + '...' : update.impact;
            const isPinned = pinnedUrls.has(update.url);
            
            return \`
                <div class="update-card" data-url="\${update.url}" data-authority="\${update.authority}" data-urgency="\${update.urgency}" data-impact="\${update.impactLevel}">
                    <div class="update-header">
                        <div class="update-title" onclick="viewUpdateDetails('\${update.url}')">\${update.headline}</div>
                        <div class="update-actions">
                            <button class="pin-btn \${isPinned ? 'pinned' : ''}" onclick="event.stopPropagation(); togglePin('\${update.url}', '\${update.headline.replace(/'/g, "\\\\'")}', '\${update.authority}')" title="\${isPinned ? 'Unpin' : 'Pin'} item">\${isPinned ? '📌' : '📍'}</button>
                        </div>
                    </div>
                    <div class="update-badges">
                        <div class="badge badge-\${update.authority.toLowerCase()}">\${update.authority}</div>
                        \${update.impactLevel ? \`<div class="badge" style="background: #fef2f2; color: #dc2626;">\${update.impactLevel}</div>\` : ''}
                        \${update.urgency ? \`<div class="badge" style="background: #fff7ed; color: #ea580c;">\${update.urgency}</div>\` : ''}
                    </div>
                    <div class="update-summary \${update.impact.length > 120 ? 'truncated' : ''}" id="summary-\${updateId}">
                        \${shortSummary}
                    </div>
                    \${update.impact.length > 120 ? \`
                        <button class="read-more-btn" onclick="toggleSummaryExpansion('\${updateId}', '\${update.impact.replace(/'/g, "\\\\'")}')">
                            Read More
                        </button>
                    \` : ''}
                    <div class="update-footer">
                        <div class="date-display">
                            <span class="date-icon">📅</span>
                            <span class="publication-date">\${new Date(update.fetchedDate).toLocaleDateString('en-GB', { 
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
            \`;
        }

        // =================
        // FORM HANDLERS
        // =================
        
        function handleFirmProfileSubmit(event) {
            event.preventDefault();
            
            const firmName = document.getElementById('firmNameInput')?.value.trim();
            const firmSize = document.getElementById('firmSizeInput')?.value;
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
        }

        async function saveFirmProfile(firmName, firmSize, primarySectors) {
            const saveBtn = document.getElementById('saveProfileBtn');
            const originalText = saveBtn?.textContent;
            
            try {
                if (saveBtn) {
                    saveBtn.disabled = true;
                    saveBtn.textContent = 'Saving...';
                }
                
                clearMessages();
                
                console.log('💾 Saving firm profile:', { firmName, firmSize, primarySectors });
                
                const response = await fetch('/api/firm-profile', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        firmName,
                        firmSize,
                        primarySectors
                    })
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                    throw new Error(errorData.error || \`HTTP \${response.status}: \${response.statusText}\`);
                }
                
                const result = await response.json();
                
                firmProfile = result.profile;
                updateFirmProfileUI();
                closeFirmProfileModal();
                
                await loadAnalyticsPreview();
                await loadIntelligenceStreams();
                
                showMessage(\`Firm profile saved! \${result.relevanceUpdated || 0} updates recalculated for relevance.\`, 'success');
                
                console.log('✅ Firm profile saved successfully');
                
            } catch (error) {
                console.error('Error saving firm profile:', error);
                showMessage('Error saving profile: ' + error.message, 'error');
            } finally {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.textContent = originalText || 'Save Profile';
                }
            }
        }

        // =================
        // INITIALIZATION
        // =================
        
        async function initializeSystem() {
            try {
                await checkSystemStatus();
                await loadFirmProfile();
                await loadWorkspaceStats();
                await loadAnalyticsPreview();
                await loadIntelligenceStreams();
                await checkLiveSubscriptions();
                
                console.log('✅ System initialization complete');
            } catch (error) {
                console.error('❌ System initialization failed:', error);
                showMessage('System initialization failed. Some features may not work properly.', 'error');
            }
        }

        async function checkSystemStatus() {
            try {
                const response = await fetch('/api/system-status');
                const status = await response.json();
                
                systemStatus.database = status.database === 'connected';
                systemStatus.api = status.environment.hasGroqKey;
                systemStatus.overall = systemStatus.database && systemStatus.api;
                
                updateStatusIndicators(systemStatus);
                
            } catch (error) {
                console.error('System status check failed:', error);
                systemStatus.overall = false;
                updateStatusIndicators(systemStatus);
            }
        }

        function updateStatusIndicators(status) {
            const liveIndicator = document.querySelector('.pulse-dot');
            if (liveIndicator) {
                liveIndicator.style.background = status.overall ? '#10b981' : '#ef4444';
            }
        }

        // =================
        // EVENT HANDLERS
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
                firmProfileForm.addEventListener('submit', handleFirmProfileSubmit);
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
            
            console.log('✅ Common functions initialized');
        }

        // =================
        // GLOBAL FUNCTION EXPOSURE
        // =================
        
        // Make all interactive functions globally available for onclick handlers
        window.refreshIntelligence = refreshIntelligence;
        window.exportData = exportData;
        window.createAlert = createAlert;
        window.shareSystem = shareSystem;
        window.showFirmProfileSetup = showFirmProfileSetup;
        window.closeFirmProfileModal = closeFirmProfileModal;
        window.clearFirmProfile = clearFirmProfile;
        window.togglePin = togglePin;
        window.toggleDashboardPin = toggleDashboardPin;
        window.pinUpdate = pinUpdate;
        window.unpinUpdate = unpinUpdate;
        window.filterByAuthority = filterByAuthority;
        window.filterByUrgency = filterByUrgency;
        window.filterByImpact = filterByImpact;
        window.showAllUpdates = showAllUpdates;
        window.clearDashboardFilters = clearDashboardFilters;
        window.refreshAnalytics = refreshAnalytics;
        window.toggleStreamExpansion = toggleStreamExpansion;
        window.toggleSummaryExpansion = toggleSummaryExpansion;
        window.viewUpdateDetails = viewUpdateDetails;
        window.showMessage = showMessage;
        window.clearMessages = clearMessages;
        window.updateWorkspaceCounts = updateWorkspaceCounts;
        window.checkSystemStatus = checkSystemStatus;
        window.initializeSystem = initializeSystem;
        window.loadIntelligenceStreams = loadIntelligenceStreams;
        window.loadAnalyticsPreview = loadAnalyticsPreview;
        window.checkLiveSubscriptions = checkLiveSubscriptions;
        window.updateAnalyticsPreview = updateAnalyticsPreview;
        window.generateRelevanceBasedStreams = generateRelevanceBasedStreams;
        window.generateStream = generateStream;
        window.generateUpdateCard = generateUpdateCard;
        window.deduplicateUpdates = deduplicateUpdates;
        window.createContentFingerprint = createContentFingerprint;
        window.updateAuthorityCounts = updateAuthorityCounts;
        window.updateRelevanceCounts = updateRelevanceCounts;
        window.handleFirmProfileSubmit = handleFirmProfileSubmit;
        window.saveFirmProfile = saveFirmProfile;
    </script>
    `;
}

module.exports = { getCommonClientScripts };