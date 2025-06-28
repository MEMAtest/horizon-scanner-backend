// src/components/ClientScript.js
// Complete client-side JavaScript for dashboard interactivity

function getScript() {
    return `
        <script>
        // ==========================================
        // DASHBOARD CLIENT-SIDE FUNCTIONALITY
        // ==========================================
        
        // Global state management
        let allUpdates = [];
        let selectedAuthorities = new Set();
        let selectedImpactLevels = new Set();
        let selectedUrgencies = new Set();
        let systemStatus = {
            database: false,
            api: false,
            overall: false
        };

        // ==========================================
        // AUTHORITY PARSING FUNCTIONS
        // ==========================================
        
        function parseAuthorities(authorityString) {
            if (!authorityString) return [];
            
            const normalized = authorityString
                .replace(/Bank of England and Prudential Regulation Authority \\(PRA\\)/g, 'BoE,PRA')
                .replace(/Bank of England/g, 'BoE')
                .replace(/and/g, ',')
                .split(',')
                .map(auth => auth.trim())
                .filter(auth => auth.length > 0);
            
            return normalized.map(auth => {
                if (auth === 'FCA') return 'FCA';
                if (auth === 'BoE') return 'BoE';
                if (auth === 'PRA') return 'PRA';
                if (auth === 'TPR') return 'TPR';
                if (auth === 'PSR') return 'PSR';
                if (auth === 'SFO') return 'SFO';
                if (auth === 'FATF') return 'FATF';
                return auth;
            });
        }

        // ==========================================
        // FILTERING FUNCTIONS
        // ==========================================
        
        function applyFilters() {
            const sectorCards = document.querySelectorAll('.sector-card');
            
            sectorCards.forEach(card => {
                const updateItems = card.querySelectorAll('.update-item');
                let hasVisibleUpdates = false;

                updateItems.forEach(item => {
                    const itemAuthorities = item.dataset.authorities 
                        ? item.dataset.authorities.split(',').filter(a => a)
                        : [];
                    
                    const matchesAuthority = selectedAuthorities.size === 0 || 
                        itemAuthorities.some(auth => selectedAuthorities.has(auth));
                    
                    const matchesImpact = selectedImpactLevels.size === 0 || 
                        selectedImpactLevels.has(item.dataset.impact);
                    
                    const matchesUrgency = selectedUrgencies.size === 0 || 
                        selectedUrgencies.has(item.dataset.urgency);

                    if (matchesAuthority && matchesImpact && matchesUrgency) {
                        item.classList.remove('hidden');
                        hasVisibleUpdates = true;
                    } else {
                        item.classList.add('hidden');
                    }
                });

                if (hasVisibleUpdates) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            });

            updateFilterCounts();
        }

        function updateFilterCounts() {
            const totalVisible = document.querySelectorAll('.update-item:not(.hidden)').length;
            console.log('Showing ' + totalVisible + ' updates after filtering');
        }

        // ==========================================
        // AUTHORITY FILTER FUNCTIONS
        // ==========================================
        
        function selectAllAuthorities() {
            document.querySelectorAll('.authority-checkbox').forEach(cb => {
                cb.checked = true;
                selectedAuthorities.add(cb.value);
            });
        }

        function clearAllAuthorities() {
            document.querySelectorAll('.authority-checkbox').forEach(cb => {
                cb.checked = false;
            });
            selectedAuthorities.clear();
        }

        // ==========================================
        // IMPACT FILTER FUNCTIONS
        // ==========================================
        
        function selectAllImpacts() {
            document.querySelectorAll('.impact-checkbox').forEach(cb => {
                cb.checked = true;
                selectedImpactLevels.add(cb.value);
            });
        }

        function clearAllImpacts() {
            document.querySelectorAll('.impact-checkbox').forEach(cb => {
                cb.checked = false;
            });
            selectedImpactLevels.clear();
        }

        // ==========================================
        // URGENCY FILTER FUNCTIONS
        // ==========================================
        
        function selectAllUrgencies() {
            document.querySelectorAll('.urgency-checkbox').forEach(cb => {
                cb.checked = true;
                selectedUrgencies.add(cb.value);
            });
        }

        function clearAllUrgencies() {
            document.querySelectorAll('.urgency-checkbox').forEach(cb => {
                cb.checked = false;
            });
            selectedUrgencies.clear();
        }

        function resetAllFilters() {
            clearAllAuthorities();
            clearAllImpacts();
            clearAllUrgencies();
            applyFilters();
        }

        // ==========================================
        // SEARCH FUNCTIONALITY
        // ==========================================
        
        function performSearch(searchTerm) {
            const lowerSearchTerm = searchTerm.toLowerCase();
            const updateItems = document.querySelectorAll('.update-item');
            
            updateItems.forEach(item => {
                const title = item.querySelector('.update-title')?.textContent?.toLowerCase() || '';
                const impact = item.querySelector('.update-impact')?.textContent?.toLowerCase() || '';
                const authority = item.dataset.authorities?.toLowerCase() || '';
                
                const matches = title.includes(lowerSearchTerm) || 
                               impact.includes(lowerSearchTerm) || 
                               authority.includes(lowerSearchTerm);
                
                if (matches) {
                    item.classList.remove('search-hidden');
                } else {
                    item.classList.add('search-hidden');
                }
            });
        }

        // ==========================================
        // EXPORT FUNCTIONALITY
        // ==========================================
        
        async function exportData(format) {
            try {
                const visibleUpdates = Array.from(document.querySelectorAll('.update-item:not(.hidden):not(.search-hidden)'))
                    .map(item => ({
                        headline: item.querySelector('.update-title')?.textContent || '',
                        authority: item.dataset.authorities || '',
                        impact: item.dataset.impact || '',
                        urgency: item.dataset.urgency || '',
                        sector: item.closest('.sector-card')?.dataset.sector || ''
                    }));

                if (format === 'csv') {
                    const csv = convertToCSV(visibleUpdates);
                    downloadFile(csv, 'regulatory-updates.csv', 'text/csv');
                } else if (format === 'json') {
                    const json = JSON.stringify(visibleUpdates, null, 2);
                    downloadFile(json, 'regulatory-updates.json', 'application/json');
                }
            } catch (error) {
                console.error('Export failed:', error);
                alert('Export failed: ' + error.message);
            }
        }

        function convertToCSV(data) {
            if (!data.length) return '';
            
            const headers = Object.keys(data[0]);
            const csvHeaders = headers.join(',');
            const csvRows = data.map(row => 
                headers.map(header => '"' + (row[header] || '').replace(/"/g, '""') + '"').join(',')
            );
            
            return [csvHeaders, ...csvRows].join('\\n');
        }

        function downloadFile(content, filename, contentType) {
            const blob = new Blob([content], { type: contentType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }

        // ==========================================
        // SYSTEM STATUS FUNCTIONS
        // ==========================================
        
        async function checkSystemStatus() {
            try {
                const response = await fetch('/api/health');
                const result = await response.json();
                
                systemStatus.database = result.status === 'healthy';
                systemStatus.api = response.ok;
                systemStatus.overall = systemStatus.database && systemStatus.api;
                
                updateStatusIndicators();
                
            } catch (error) {
                systemStatus.overall = false;
                systemStatus.database = false;
                systemStatus.api = false;
                updateStatusIndicators();
                console.error('Status check error:', error);
            }
        }

        function updateStatusIndicators() {
            const systemIndicator = document.getElementById('systemIndicator');
            if (systemIndicator) {
                if (systemStatus.overall) {
                    systemIndicator.className = 'status-indicator';
                } else {
                    systemIndicator.className = 'status-indicator status-offline';
                }
            }
        }

        // ==========================================
        // DATA REFRESH FUNCTIONS
        // ==========================================
        
        async function refreshData() {
            try {
                const response = await fetch('/api/refresh', { method: 'POST' });
                const result = await response.json();
                
                if (response.ok) {
                    console.log('Data refreshed successfully:', result);
                    // Reload page to show new data
                    window.location.reload();
                } else {
                    throw new Error(result.error || 'Refresh failed');
                }
            } catch (error) {
                console.error('Refresh error:', error);
                alert('Refresh failed: ' + error.message);
            }
        }

        // ==========================================
        // INITIALIZATION
        // ==========================================
        
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🚀 Dashboard client-side initialized');
            
            // Initialize filter event listeners
            document.querySelectorAll('.authority-checkbox').forEach(cb => {
                cb.addEventListener('change', function() {
                    if (this.checked) {
                        selectedAuthorities.add(this.value);
                    } else {
                        selectedAuthorities.delete(this.value);
                    }
                });
            });

            document.querySelectorAll('.impact-checkbox').forEach(cb => {
                cb.addEventListener('change', function() {
                    if (this.checked) {
                        selectedImpactLevels.add(this.value);
                    } else {
                        selectedImpactLevels.delete(this.value);
                    }
                });
            });

            document.querySelectorAll('.urgency-checkbox').forEach(cb => {
                cb.addEventListener('change', function() {
                    if (this.checked) {
                        selectedUrgencies.add(this.value);
                    } else {
                        selectedUrgencies.delete(this.value);
                    }
                });
            });

            // Initialize search functionality
            const searchBox = document.getElementById('searchBox');
            if (searchBox) {
                searchBox.addEventListener('input', function() {
                    performSearch(this.value);
                });
            }

            // Check system status
            checkSystemStatus();
            
            // Auto-refresh status every 30 seconds
            setInterval(checkSystemStatus, 30000);
            
            // Auto-refresh data every 5 minutes
            setInterval(() => {
                console.log('Auto-refreshing dashboard data...');
                window.location.reload();
            }, 5 * 60 * 1000);
        });

        // Make functions globally available
        window.applyFilters = applyFilters;
        window.selectAllAuthorities = selectAllAuthorities;
        window.clearAllAuthorities = clearAllAuthorities;
        window.selectAllImpacts = selectAllImpacts;
        window.clearAllImpacts = clearAllImpacts;
        window.selectAllUrgencies = selectAllUrgencies;
        window.clearAllUrgencies = clearAllUrgencies;
        window.resetAllFilters = resetAllFilters;
        window.exportData = exportData;
        window.refreshData = refreshData;
        window.performSearch = performSearch;

        </script>
    `;
}

module.exports = { getScript };