function getWorkspaceModule() {
    return `
    // Workspace Module
    const WorkspaceModule = (function() {
        function togglePin(url) {
            if (pinnedUrls.has(url)) {
                pinnedUrls.delete(url);
                showMessage('Item unpinned', 'info');
            } else {
                pinnedUrls.add(url);
                showMessage('Item pinned', 'success');
            }
            
            const pinBtn = document.querySelector(\`[data-url="\${url}"] .pin-btn\`);
            if (pinBtn) {
                pinBtn.textContent = pinnedUrls.has(url) ? '📌' : '📍';
                pinBtn.classList.toggle('pinned', pinnedUrls.has(url));
            }
            
            updateWorkspaceCounts();
        }
        
        function updateWorkspaceCounts() {
            const pinnedEl = document.getElementById('pinnedCount');
            const searchesEl = document.getElementById('savedSearchesCount');
            const alertsEl = document.getElementById('customAlertsCount');
            
            if (pinnedEl) pinnedEl.textContent = pinnedUrls.size || 0;
            if (searchesEl) searchesEl.textContent = workspaceStats.savedSearches || 0;
            if (alertsEl) alertsEl.textContent = workspaceStats.activeAlerts || 0;
        }
        
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
        
        function showSaveDialog() {
            console.log('💾 Opening save dialog');
            
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
                    <button onclick="WorkspaceModule.closeSaveDialog()" style="padding: 0.5rem 1rem; background: #6b7280; color: white; border: none; border-radius: 4px;">Cancel</button>
                    <button onclick="WorkspaceModule.saveCurrentView()" style="padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 4px;">Save</button>
                </div>
            \`;
            
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
        
        async function exportData() {
            try {
                showMessage('Preparing export...', 'info');
                
                const response = await fetch('/api/export');
                const data = await response.json();
                
                if (data.success) {
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
        
        return {
            togglePin,
            updateWorkspaceCounts,
            showPinnedItems,
            showSavedSearches,
            showCustomAlerts,
            showSaveDialog,
            closeSaveDialog,
            saveCurrentView,
            exportData
        };
    })();`;
}

module.exports = { getWorkspaceModule };