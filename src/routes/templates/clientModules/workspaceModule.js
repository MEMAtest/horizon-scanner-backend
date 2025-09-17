// src/routes/templates/clientModules/workspaceModule.js
// Complete workspace module with Phase 1.3 API integration

function getWorkspaceModule() {
    return `
    // Workspace Module - Phase 1.3 Complete Implementation
    const WorkspaceModule = (function() {
        // State management
        let pinnedUrls = new Set();
        let savedSearches = [];
        let customAlerts = [];
        let firmProfile = null;
        
        // Initialize workspace
        async function init() {
            console.log('🔧 Initializing workspace module...');
            await loadWorkspaceData();
            await loadFirmProfile();
            updateWorkspaceCounts();
        }
        
        // Load workspace data
        async function loadWorkspaceData() {
            try {
                // Load pinned items
                const pinnedResponse = await fetch('/api/workspace/pinned');
                if (pinnedResponse.ok) {
                    const data = await pinnedResponse.json();
                    pinnedUrls = new Set(data.items.map(item => item.update_url || item.updateUrl));
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
        }
        
        // Load firm profile
        async function loadFirmProfile() {
            try {
                const response = await fetch('/api/firm-profile');
                if (response.ok) {
                    const data = await response.json();
                    firmProfile = data.profile;
                    if (firmProfile) {
                        displayFirmProfileBadge();
                    }
                }
            } catch (error) {
                console.error('Error loading firm profile:', error);
            }
        }
        
        // Toggle pin status
        async function togglePin(url, title, authority) {
            try {
                if (pinnedUrls.has(url)) {
                    // Unpin
                    const response = await fetch(\`/api/workspace/pin/\${encodeURIComponent(url)}\`, {
                        method: 'DELETE'
                    });
                    
                    if (response.ok) {
                        pinnedUrls.delete(url);
                        showMessage('Update unpinned', 'info');
                    } else {
                        throw new Error('Failed to unpin');
                    }
                } else {
                    // Pin
                    const response = await fetch('/api/workspace/pin', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            url, 
                            title: title || 'Untitled Update',
                            authority: authority || 'Unknown',
                            notes: ''
                        })
                    });
                    
                    if (response.ok) {
                        pinnedUrls.add(url);
                        showMessage('Update pinned successfully', 'success');
                    } else {
                        throw new Error('Failed to pin');
                    }
                }
                
                // Update UI
                updatePinButton(url);
                updateWorkspaceCounts();
                
            } catch (error) {
                console.error('Pin toggle error:', error);
                showMessage('Failed to update pin status', 'error');
            }
        }
        
        // Update pin button appearance
        function updatePinButton(url) {
            const pinBtn = document.querySelector(\`[data-url="\${url}"] .pin-btn\`);
            if (pinBtn) {
                const isPinned = pinnedUrls.has(url);
                pinBtn.innerHTML = isPinned ? '📌' : '📍';
                pinBtn.classList.toggle('pinned', isPinned);
                pinBtn.title = isPinned ? 'Unpin this update' : 'Pin this update';
            }
        }
        
        // Update workspace counts in sidebar
        async function updateWorkspaceCounts() {
            try {
                const response = await fetch('/api/workspace/stats');
                if (response.ok) {
                    const data = await response.json();
                    
                    // Update sidebar counts
                    const pinnedEl = document.getElementById('pinnedCount');
                    const searchesEl = document.getElementById('savedSearchesCount');
                    const alertsEl = document.getElementById('customAlertsCount');
                    
                    if (pinnedEl) pinnedEl.textContent = data.stats.pinnedItems || 0;
                    if (searchesEl) searchesEl.textContent = data.stats.savedSearches || 0;
                    if (alertsEl) alertsEl.textContent = data.stats.activeAlerts || 0;
                }
            } catch (error) {
                console.error('Error updating workspace counts:', error);
            }
        }
        
        // Show pinned items
        function showPinnedItems() {
            console.log('📌 Opening pinned items view');
            // Filter to show only pinned items
            if (window.FilterModule) {
                window.FilterModule.applyFilter('pinned');
            }
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
                    searchItem.innerHTML = \`
                        <div class="search-name">\${search.searchName || search.search_name}</div>
                        <div class="search-actions">
                            <button onclick="WorkspaceModule.loadSearch('\${search.id}')" class="btn-small">Load</button>
                            <button onclick="WorkspaceModule.deleteSearch('\${search.id}')" class="btn-small btn-danger">Delete</button>
                        </div>
                    \`;
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
            alertsContainer.innerHTML = \`
                <button onclick="WorkspaceModule.createNewAlert()" class="btn btn-primary" style="margin-bottom: 1rem;">
                    Create New Alert
                </button>
            \`;
            
            if (customAlerts.length > 0) {
                const alertsList = document.createElement('div');
                alertsList.className = 'alerts-list';
                
                customAlerts.forEach(alert => {
                    const alertItem = document.createElement('div');
                    alertItem.className = 'alert-item';
                    alertItem.innerHTML = \`
                        <div class="alert-info">
                            <div class="alert-name">\${alert.alertName || alert.alert_name}</div>
                            <div class="alert-status">
                                <span class="\${alert.isActive ? 'active' : 'inactive'}">
                                    \${alert.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                        <div class="alert-actions">
                            <button onclick="WorkspaceModule.toggleAlert('\${alert.id}', \${!alert.isActive})" 
                                    class="btn-small">
                                \${alert.isActive ? 'Disable' : 'Enable'}
                            </button>
                            <button onclick="WorkspaceModule.deleteAlert('\${alert.id}')" 
                                    class="btn-small btn-danger">Delete</button>
                        </div>
                    \`;
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
                const response = await fetch(\`/api/workspace/search/\${searchId}\`);
                if (response.ok) {
                    const data = await response.json();
                    const search = data.search;
                    
                    // Apply the saved filters
                    if (window.FilterModule && search.filterParams) {
                        window.FilterModule.applyFilters(search.filterParams);
                    }
                    
                    // Close modal
                    closeModal();
                    showMessage(\`Loaded search: \${search.searchName || search.search_name}\`, 'success');
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
                const response = await fetch(\`/api/workspace/search/\${searchId}\`, {
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
            
            modal.content.innerHTML = \`
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
            \`;
            
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
                const response = await fetch(\`/api/workspace/alert/\${alertId}\`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isActive })
                });
                
                if (response.ok) {
                    const alert = customAlerts.find(a => a.id == alertId);
                    if (alert) alert.isActive = isActive;
                    showCustomAlerts(); // Refresh modal
                    showMessage(\`Alert \${isActive ? 'enabled' : 'disabled'}\`, 'success');
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
                const response = await fetch(\`/api/workspace/alert/\${alertId}\`, {
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
            
            const sectors = [
                'Banking', 'Investment Management', 'Consumer Credit', 
                'Insurance', 'Payments', 'Pensions', 'Mortgages', 
                'Capital Markets', 'Cryptocurrency', 'Fintech'
            ];
            
            const currentSectors = firmProfile?.primarySectors || firmProfile?.primary_sectors || [];
            
            modal.content.innerHTML = \`
                <div class="form-group">
                    <label>Firm Name:</label>
                    <input type="text" id="firmName" class="form-input" 
                           value="\${firmProfile?.firmName || firmProfile?.firm_name || ''}" 
                           placeholder="Enter your firm name">
                </div>
                <div class="form-group">
                    <label>Firm Size:</label>
                    <select id="firmSize" class="form-input">
                        <option value="Small" \${firmProfile?.firmSize === 'Small' ? 'selected' : ''}>Small</option>
                        <option value="Medium" \${firmProfile?.firmSize === 'Medium' ? 'selected' : ''}>Medium</option>
                        <option value="Large" \${firmProfile?.firmSize === 'Large' ? 'selected' : ''}>Large</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Primary Sectors (select all that apply):</label>
                    <div class="sectors-grid">
                        \${sectors.map(sector => \`
                            <label class="checkbox-label">
                                <input type="checkbox" name="sectors" value="\${sector}" 
                                       \${currentSectors.includes(sector) ? 'checked' : ''}>
                                \${sector}
                            </label>
                        \`).join('')}
                    </div>
                </div>
                <div class="button-group">
                    <button onclick="WorkspaceModule.saveFirmProfile()" class="btn btn-primary">Save Profile</button>
                    <button onclick="WorkspaceModule.clearFirmProfile()" class="btn btn-danger">Clear Profile</button>
                </div>
            \`;
            
            document.body.appendChild(modal.overlay);
        }
        
        // Save firm profile
        async function saveFirmProfile() {
            const firmName = document.getElementById('firmName').value.trim();
            const firmSize = document.getElementById('firmSize').value;
            const sectorCheckboxes = document.querySelectorAll('input[name="sectors"]:checked');
            const primarySectors = Array.from(sectorCheckboxes).map(cb => cb.value);
            
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
                    firmProfile = data.profile;
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
            badge.innerHTML = \`
                <span class="firm-name">\${firmProfile.firmName || firmProfile.firm_name}</span>
                <span class="sector-count">\${(firmProfile.primarySectors || firmProfile.primary_sectors || []).length} sectors</span>
                <button onclick="WorkspaceModule.showFirmProfile()" class="edit-btn">Edit</button>
            \`;
            
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
            modal.innerHTML = \`
                <div class="modal-header">
                    <h3>\${title}</h3>
                    <button onclick="WorkspaceModule.closeModal()" class="close-btn">×</button>
                </div>
                <div class="modal-content"></div>
            \`;
            
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
                    a.download = \`regulatory-updates-\${new Date().toISOString().split('T')[0]}.json\`;
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
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
        
        // Public API
        return {
            init,
            togglePin,
            updateWorkspaceCounts,
            showPinnedItems,
            showSavedSearches,
            showCustomAlerts,
            saveCurrentSearch,
            loadSearch,
            deleteSearch,
            createNewAlert,
            submitNewAlert,
            toggleAlert,
            deleteAlert,
            showFirmProfile,
            saveFirmProfile,
            clearFirmProfile,
            closeModal,
            exportData
        };
    })();`;
}

module.exports = { getWorkspaceModule };