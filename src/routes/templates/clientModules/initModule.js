function getInitModule() {
  return `
    // Initialization Module
    const InitModule = (function() {
        async function initialize() {
            console.log('Launch Initializing system...');
            
            try {
                FilterModule.initializeFilters();
                await checkSystemStatus();
                await RefreshModule.loadIntelligenceStreams();
                await RefreshModule.loadAnalyticsPreview();
                await RefreshModule.checkLiveSubscriptions();
                
                CounterModule.updateLiveCounters();
                setInterval(CounterModule.updateLiveCounters, 30000);
                
                console.log('Complete System initialized successfully');
                
            } catch (error) {
                console.error('X System initialization failed:', error);
                showMessage('System initialization failed: ' + error.message, 'error');
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
        
        return {
            initialize,
            checkSystemStatus
        };
    })();`
}

module.exports = { getInitModule }
