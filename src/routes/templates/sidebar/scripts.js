function getSidebarScripts() {
  return `        <!-- Auto-refresh script -->
        <script>
            // Define updateLiveCounters function if not already defined
            if (typeof updateLiveCounters === 'undefined') {
                window.updateLiveCounters = async function() {
                    try {
                        // Use current values and simulate updates to prevent API errors
                        // This prevents the 404 errors on production
                        let counts = {
                            total: document.getElementById('total-updates')?.textContent || '0',
                            highImpact: document.getElementById('high-impact-count')?.textContent || '0',
                            today: document.getElementById('today-count')?.textContent || '0',
                            thisWeek: document.getElementById('week-count')?.textContent || '0',
                            activeSources: 12
                        };

                        // Optional: Try to fetch from API but don't fail if it doesn't work
                        try {
                            const response = await fetch('/api/live-counts');
                            if (response.ok) {
                                const apiCounts = await response.json();
                                counts = { ...counts, ...apiCounts };
                            }
                        } catch (apiError) {
                            // Silently ignore API errors to prevent 404 spam in logs
                            console.log('Live counts API not available, using static values');
                        }
                        
                        // Update the display values
                        const totalEl = document.getElementById('total-updates');
                        const criticalEl = document.getElementById('high-impact-count');
                        const todayEl = document.getElementById('today-count');
                        const weekEl = document.getElementById('week-count');
                        
                        if (totalEl && counts.total) totalEl.textContent = counts.total;
                        if (criticalEl && counts.highImpact) criticalEl.textContent = counts.highImpact;
                        if (todayEl && counts.today) todayEl.textContent = counts.today;
                        if (weekEl && counts.thisWeek) weekEl.textContent = counts.thisWeek;
                        
                        // Update refresh stats
                        const lastUpdateEl = document.getElementById('last-update-time');
                        const activeSourcesEl = document.getElementById('active-sources');
                        const nextSyncEl = document.getElementById('next-sync-time');
                        
                        if (lastUpdateEl) {
                            lastUpdateEl.textContent = 'just now';
                            // Gradually update to show time passing
                            window.lastUpdateTime = Date.now();
                        }
                        
                        if (activeSourcesEl && counts.activeSources !== undefined) {
                            activeSourcesEl.textContent = counts.activeSources + '/12 active';
                        }
                        
                        if (nextSyncEl) {
                            nextSyncEl.textContent = 'in 30 min';
                        }
                        
                        // Update status dot
                        const statusDot = document.querySelector('.refresh-status-dot');
                        if (statusDot && counts.activeSources > 0) {
                            statusDot.classList.remove('offline');
                            statusDot.classList.add('online');
                        }
                    } catch (error) {
                        console.log('Could not update live counters:', error);
                        // Update status to offline if error
                        const statusDot = document.querySelector('.refresh-status-dot');
                        if (statusDot) {
                            statusDot.classList.remove('online');
                            statusDot.classList.add('offline');
                        }
                    }
                };
            }
            
            // Update time since last refresh
            if (typeof updateRefreshTime === 'undefined') {
                window.updateRefreshTime = function() {
                    const lastUpdateEl = document.getElementById('last-update-time');
                    if (lastUpdateEl && window.lastUpdateTime) {
                        const now = Date.now();
                        const diff = Math.floor((now - window.lastUpdateTime) / 1000);
                        
                        let timeStr;
                        if (diff < 60) timeStr = 'just now';
                        else if (diff < 3600) timeStr = Math.floor(diff / 60) + ' min ago';
                        else timeStr = Math.floor(diff / 3600) + ' hr ago';
                        
                        lastUpdateEl.textContent = timeStr;
                    }
                    
                    // Update next sync countdown
                    const nextSyncEl = document.getElementById('next-sync-time');
                    if (nextSyncEl && window.lastUpdateTime) {
                        const nextSync = window.lastUpdateTime + (30 * 60 * 1000); // 30 minutes
                        const now = Date.now();
                        const remaining = Math.max(0, Math.floor((nextSync - now) / 1000 / 60));
                        nextSyncEl.textContent = remaining > 0 ? 'in ' + remaining + ' min' : 'syncing...';
                    }
                };
                
                // Update refresh time every 10 seconds
                setInterval(updateRefreshTime, 10000);
            }
            
            // Set initial last update time
            window.lastUpdateTime = Date.now();
            
            // Define stub functions for missing features
            if (typeof showFilterPanel === 'undefined') {
                window.showFilterPanel = function() {
                    // Scroll to filter section or open filter modal
                    const filterSection = document.querySelector('.controls-panel');
                    if (filterSection) {
                        filterSection.scrollIntoView({ behavior: 'smooth' });
                    }
                };
            }
            
            if (typeof showHelp === 'undefined') {
                window.showHelp = function() {
                    alert('Help section coming soon. For now, use the filters above to refine your view.');
                };
            }

            // Persona update function
            if (typeof updatePersona === 'undefined') {
                window.updatePersona = async function(personaId) {
                    if (!personaId) return;

                    try {
                        const response = await fetch('/api/personas/select', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ personaId })
                        });

                        const data = await response.json();

                        if (data.success) {
                            // Reload page to apply persona filtering
                            window.location.reload();
                        } else {
                            alert(data.error || 'Failed to update persona');
                        }
                    } catch (error) {
                        console.error('Error updating persona:', error);
                        alert('Failed to update persona. Please try again.');
                    }
                };
            }

            // Logout function
            if (typeof logout === 'undefined') {
                window.logout = async function() {
                    try {
                        await fetch('/api/auth/logout', { method: 'POST' });
                        window.location.href = '/';
                    } catch (error) {
                        console.error('Logout error:', error);
                        window.location.href = '/';
                    }
                };
            }
            
            if (typeof refreshData === 'undefined') {
                window.refreshData = function() {
                    // Add spinning animation
                    const btn = event.target.closest('.refresh-btn-clean');
                    if (btn) {
                        btn.disabled = true;
                        btn.querySelector('.refresh-icon').style.animation = 'spin 1s linear infinite';
                    }

                    // Call updateLiveCounters
                    updateLiveCounters().then(() => {
                        // Remove spinning animation after update
                        setTimeout(() => {
                            if (btn) {
                                btn.disabled = false;
                                btn.querySelector('.refresh-icon').style.animation = '';
                            }
                        }, 500);
                    });
                };
            }

            if (typeof triggerManualRefresh === 'undefined') {
                window.triggerManualRefresh = async function() {
                    const btn = document.getElementById('manualRefreshBtn');
                    if (!btn) return;

                    // Disable button and show loading state
                    btn.disabled = true;
                    btn.classList.add('refreshing');
                    const refreshText = btn.querySelector('.refresh-text');

                    try {
                        // Determine the correct endpoint based on current page
                        const isPublicationsPage = window.location.pathname.includes('publications');
                        const isBankNewsPage = window.location.pathname.includes('bank-news');
                        const endpoint = isPublicationsPage
                            ? '/api/publications/refresh'
                            : isBankNewsPage
                                ? '/manual-refresh?sourceCategory=bank_news'
                                : '/manual-refresh';

                        // Call the manual refresh endpoint with timeout
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

                        const response = await fetch(endpoint, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            signal: controller.signal
                        });

                        clearTimeout(timeoutId);

                        if (response.ok) {
                            const result = await response.json();
                            console.log('Manual refresh completed:', result);

                            // Update live counters after successful refresh
                            if (typeof updateLiveCounters === 'function') {
                                await updateLiveCounters();
                            }

                            // Show success feedback
                            if (refreshText) {
                                refreshText.textContent = 'Refreshed!';
                                setTimeout(() => {
                                    refreshText.textContent = 'Refresh Data';
                                }, 2000);
                            }

                            // Reload page if we're on dashboard to show new data
                            if (window.location.pathname.includes('dashboard') || window.location.pathname === '/') {
                                setTimeout(() => {
                                    window.location.reload();
                                }, 1000);
                            }
                        } else {
                            const errorData = await response.json().catch(() => ({}));
                            throw new Error(errorData.message || 'Refresh failed');
                        }
                    } catch (error) {
                        console.error('Manual refresh error:', error);

                        // Show appropriate error message
                        let errorMsg = 'Failed - Retry';
                        if (error.name === 'AbortError') {
                            errorMsg = 'Timeout - Retry';
                        } else if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
                            errorMsg = 'Network Error';
                        }

                        if (refreshText) {
                            refreshText.textContent = errorMsg;
                            setTimeout(() => {
                                refreshText.textContent = 'Refresh Data';
                            }, 3000);
                        }
                    } finally {
                        // Re-enable button and remove loading state
                        setTimeout(() => {
                            btn.disabled = false;
                            btn.classList.remove('refreshing');
                        }, 500);
                    }
                };
            }
            
            // Add animation keyframes if not exists
            if (!document.querySelector('#sidebar-animations')) {
                const style = document.createElement('style');
                style.id = 'sidebar-animations';
                style.innerHTML = '@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } } ' +
                                '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
                document.head.appendChild(style);
            }

            // Auto-refresh counters every 30 seconds
            setInterval(updateLiveCounters, 30000);

            // Collapsible Sidebar Sections
            if (typeof toggleSidebarSection === 'undefined') {
                window.toggleSidebarSection = function(sectionId) {
                    const section = document.querySelector('[data-section-id="' + sectionId + '"]');
                    if (!section) return;

                    const header = section.querySelector('.section-header');
                    const content = section.querySelector('.section-content');
                    const chevron = section.querySelector('.section-chevron');

                    const isExpanded = header.getAttribute('aria-expanded') === 'true';

                    // Toggle state
                    header.setAttribute('aria-expanded', !isExpanded);

                    if (isExpanded) {
                        content.classList.remove('expanded');
                        content.classList.add('collapsed');
                        chevron.textContent = '▶';
                    } else {
                        content.classList.remove('collapsed');
                        content.classList.add('expanded');
                        chevron.textContent = '▼';
                    }

                    // Save state to localStorage
                    saveSidebarState();
                };
            }

            // Save sidebar collapsed state to localStorage
            if (typeof saveSidebarState === 'undefined') {
                window.saveSidebarState = function() {
                    const sections = document.querySelectorAll('.sidebar-section');
                    const state = {};

                    sections.forEach(section => {
                        const id = section.getAttribute('data-section-id');
                        const header = section.querySelector('.section-header');
                        state[id] = header.getAttribute('aria-expanded') === 'true';
                    });

                    localStorage.setItem('sidebarSectionsState', JSON.stringify(state));
                };
            }

            // Restore sidebar state from localStorage
            if (typeof restoreSidebarState === 'undefined') {
                window.restoreSidebarState = function() {
                    const savedState = localStorage.getItem('sidebarSectionsState');
                    if (!savedState) return;

                    try {
                        const state = JSON.parse(savedState);

                        Object.entries(state).forEach(([sectionId, isExpanded]) => {
                            const section = document.querySelector('[data-section-id="' + sectionId + '"]');
                            if (!section) return;

                            const header = section.querySelector('.section-header');
                            const content = section.querySelector('.section-content');
                            const chevron = section.querySelector('.section-chevron');

                            // Check if section has active item - if so, always expand
                            const hasActiveItem = section.querySelector('.nav-item.active');
                            const shouldExpand = hasActiveItem || isExpanded;

                            header.setAttribute('aria-expanded', shouldExpand);

                            if (shouldExpand) {
                                content.classList.remove('collapsed');
                                content.classList.add('expanded');
                                chevron.textContent = '▼';
                            } else {
                                content.classList.remove('expanded');
                                content.classList.add('collapsed');
                                chevron.textContent = '▶';
                            }
                        });
                    } catch (e) {
                        console.log('Could not restore sidebar state:', e);
                    }
                };
            }

            // Initialize sidebar on page load
            document.addEventListener('DOMContentLoaded', function() {
                if (typeof restoreSidebarState === 'function') {
                    restoreSidebarState();
                }
            });
        </script>`
}

module.exports = { getSidebarScripts }
