function getRefreshModule() {
  return `
    // Refresh Module
    const RefreshModule = (function() {
        let isRefreshing = false;
        
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
                
                const newCountEl = document.getElementById('newCount');
                const lastUpdateEl = document.getElementById('lastUpdate');
                
                if (newCountEl) newCountEl.textContent = \`\${result.newArticles} New\`;
                if (lastUpdateEl) lastUpdateEl.textContent = \`Last: \${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}\`;
                
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
                    window.allUpdatesData = data.updates;
                    generateRelevanceBasedStreams(data.updates);
                    CounterModule.updateLiveCounters();
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
                    window.analyticsPreviewData = data.analytics;
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
                    window.workspaceStats = data.stats;
                    WorkspaceModule.updateWorkspaceCounts();
                }
                
            } catch (error) {
                console.warn('Workspace stats not available:', error);
            }
        }
        
        // Backward compatibility function
        async function refreshData() {
            return refreshIntelligence();
        }
        
        return {
            refreshIntelligence,
            refreshData,
            loadIntelligenceStreams,
            loadAnalyticsPreview,
            checkLiveSubscriptions
        };
    })();`
}

module.exports = { getRefreshModule }
