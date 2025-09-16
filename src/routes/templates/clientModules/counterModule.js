function getCounterModule() {
    return `
    // Counter Module
    const CounterModule = (function() {
        function updateLiveCounters() {
            console.log('🔄 Updating live counters...');
            
            try {
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
                                if (element) {
                                    element.textContent = value;
                                }
                            });
                            
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
        
        function updateAuthorityCounts() {
            if (!window.allUpdatesData) return;
            
            const counts = {};
            window.allUpdatesData.forEach(update => {
                const authority = update.authority || 'Unknown';
                counts[authority] = (counts[authority] || 0) + 1;
            });
            
            Object.entries(counts).forEach(([authority, count]) => {
                const element = document.querySelector(\`[data-authority-count="\${authority}"]\`);
                if (element) {
                    element.textContent = count;
                }
            });
        }
        
        function updateRelevanceCounts() {
            if (!window.allUpdatesData) return;
            
            const urgent = window.allUpdatesData.filter(u => u.urgency === 'High').length;
            const moderate = window.allUpdatesData.filter(u => u.urgency === 'Medium').length;
            const background = window.allUpdatesData.filter(u => u.urgency === 'Low').length;
            
            const urgentEl = document.getElementById('urgentCount');
            const moderateEl = document.getElementById('moderateCount');
            const backgroundEl = document.getElementById('backgroundCount');
            
            if (urgentEl) urgentEl.textContent = urgent;
            if (moderateEl) moderateEl.textContent = moderate;
            if (backgroundEl) backgroundEl.textContent = background;
        }
        
        return {
            updateLiveCounters,
            updateAuthorityCounts,
            updateRelevanceCounts
        };
    })();`;
}

module.exports = { getCounterModule };