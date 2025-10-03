function getFilterModule() {
  return `
    // Filter Module
    const FilterModule = (function() {
        function initializeFilters() {
            console.log('🔧 Initializing filters...');
            
            try {
                // Initialize filter event listeners
                document.querySelectorAll('.filter-option').forEach(option => {
                    option.addEventListener('click', function() {
                        this.classList.toggle('active');
                        const filterType = this.closest('.filter-section')?.querySelector('.filter-title')?.textContent?.trim();
                        const filterValue = this.textContent?.trim();
                        console.log(\`Filter clicked: \${filterType} - \${filterValue}\`);
                        applyActiveFilters();
                    });
                });
                
                // Initialize search functionality
                const searchBox = document.getElementById('searchBox');
                if (searchBox) {
                    searchBox.addEventListener('input', function() {
                        SearchModule.performSearch(this.value);
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
        
        async function applyActiveFilters() {
            console.log('🎯 Applying server-side filters...');
            
            try {
                const activeFilters = {
                    authority: Array.from(selectedAuthorities),
                    impact: Array.from(selectedImpactLevels),
                    urgency: Array.from(selectedUrgencies),
                    search: document.getElementById('searchBox')?.value || ''
                };

                const query = new URLSearchParams();
                if (activeFilters.authority.length > 0) query.set('authority', activeFilters.authority.join(','));
                if (activeFilters.impact.length > 0) query.set('impact', activeFilters.impact.join(','));
                // Note: The backend endpoint seems to use 'impact' for impact level.
                // Urgency is not currently a filter in the /api/updates endpoint, but we'll send it anyway for future implementation.
                if (activeFilters.urgency.length > 0) query.set('urgency', activeFilters.urgency.join(','));
                if (activeFilters.search) query.set('search', activeFilters.search);

                showMessage('Fetching filtered updates...', 'info');
                const response = await fetch(\`/api/updates?\${query.toString()}\`);
                const data = await response.json();

                if (data.success) {
                    renderFilteredUpdates(data.updates, 'Active Filters');
                    showMessage(\`Showing \${data.count} updates\`, 'success');
                } else {
                    throw new Error(data.error || 'Failed to fetch filtered updates');
                }
                
            } catch (error) {
                console.error('❌ Error applying filters:', error);
                showMessage('Error applying filters: ' + error.message, 'error');
            }
        }
        
        function clearFilters() {
            console.log('🔄 Clearing all filters');
            currentFilter = null;
            if (typeof loadIntelligenceStreams === 'function') {
                RefreshModule.loadIntelligenceStreams();
            } else {
                window.location.reload();
            }
            showMessage('All filters cleared', 'success');
        }
        
        function clearAllFilters() {
            currentFilter = null;
            selectedAuthorities.clear();
            selectedImpactLevels.clear();
            selectedUrgencies.clear();
            
            document.querySelectorAll('.filter-option.active').forEach(option => {
                option.classList.remove('active');
            });
            
            document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                cb.checked = false;
            });
            
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            const firstFilterBtn = document.querySelector('.filter-btn');
            if (firstFilterBtn) firstFilterBtn.classList.add('active');
            
            document.querySelectorAll('.update-card').forEach(card => {
                card.style.display = 'block';
            });
            
            showMessage('All filters cleared', 'success');
        }
        
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
        
        async function filterBySector(sector) {
            try {
                console.log('🏢 Filtering by sector:', sector);
                showMessage(\`Filtering by sector: \${sector}...\`, 'info');
                
                const response = await fetch(\`/api/updates?sector=\${encodeURIComponent(sector)}\`);
                const data = await response.json();
                
                if (data.success) {
                    renderFilteredUpdates(data.updates, \`Sector: \${sector}\`);
                    showMessage(\`Showing \${data.total} \${sector} updates\`, 'success');
                    currentFilter = { type: 'sector', value: sector };
                } else {
                    throw new Error(data.error || 'Filter failed');
                }
                
            } catch (error) {
                console.error('Sector filter error:', error);
                showMessage('Sector filter failed: ' + error.message, 'error');
            }
        }
        
        async function filterByImpactLevel(level) {
            try {
                console.log('📊 Filtering by impact level:', level);
                showMessage(\`Filtering by impact level: \${level}...\`, 'info');
                
                const response = await fetch(\`/api/updates?impact=\${encodeURIComponent(level)}\`);
                const data = await response.json();
                
                if (data.success) {
                    renderFilteredUpdates(data.updates, \`Impact Level: \${level}\`);
                    showMessage(\`Showing \${data.total} \${level} updates\`, 'success');
                    currentFilter = { type: 'impact', value: level };
                } else {
                    throw new Error(data.error || 'Filter failed');
                }
                
            } catch (error) {
                console.error('Impact level filter error:', error);
                showMessage('Impact level filter failed: ' + error.message, 'error');
            }
        }
        
        async function filterByDateRange(range) {
            try {
                console.log('📅 Filtering by date range:', range);
                showMessage(\`Filtering by date range: \${range}...\`, 'info');
                
                const response = await fetch(\`/api/updates?range=\${encodeURIComponent(range)}\`);
                const data = await response.json();
                
                if (data.success) {
                    renderFilteredUpdates(data.updates, \`Date Range: \${range}\`);
                    showMessage(\`Showing \${data.total} \${range} updates\`, 'success');
                    currentFilter = { type: 'range', value: range };
                } else {
                    throw new Error(data.error || 'Filter failed');
                }
                
            } catch (error) {
                console.error('Date range filter error:', error);
                showMessage('Date range filter failed: ' + error.message, 'error');
            }
        }
        
        async function filterByUrgency(urgency) {
            try {
                console.log('⚠️ Filtering by urgency:', urgency);
                showMessage(\`Filtering by urgency: \${urgency}...\`, 'info');
                
                const response = await fetch(\`/api/updates?urgency=\${encodeURIComponent(urgency)}\`);
                const data = await response.json();
                
                if (data.success) {
                    renderFilteredUpdates(data.updates, \`Urgency: \${urgency}\`);
                    showMessage(\`Showing \${data.total} \${urgency} updates\`, 'success');
                    currentFilter = { type: 'urgency', value: urgency };
                } else {
                    throw new Error(data.error || 'Filter failed');
                }
                
            } catch (error) {
                console.error('Urgency filter error:', error);
                showMessage('Urgency filter failed: ' + error.message, 'error');
            }
        }
        
        function sortUpdates(sortBy) {
            console.log('🔄 Sorting by:', sortBy);
            // This function is just a placeholder for now
            showMessage(\`Sorting by \${sortBy}\`, 'info');
        }
        
        function loadMoreUpdates() {
            console.log('➕ Loading more updates...');
            // This function is just a placeholder for now
            showMessage('Loading more updates...', 'info');
        }
        
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
                
                const filteredHTML = \`
                    <div class="filtered-view">
                        <div class="filter-header">
                            <h3>Filtered View: \${filterLabel}</h3>
                            <button onclick="FilterModule.clearFilters()" class="clear-filter-btn">Clear Filter</button>
                        </div>
                        <div class="filtered-updates">
                            \${updates.map(update => ContentModule.generateUpdateCard(update)).join('')}
                        </div>
                    </div>
                \`;
                
                container.innerHTML = filteredHTML;
                
            } catch (error) {
                console.error('Error rendering filtered updates:', error);
                showMessage('Error displaying filtered updates', 'error');
            }
        }
        
        return {
            initializeFilters,
            applyActiveFilters,
            clearFilters,
            clearAllFilters,
            filterByCategory,
            filterByAuthority,
            filterBySector,
            filterByImpactLevel,
            filterByDateRange,
            filterByUrgency,
            sortUpdates,
            loadMoreUpdates,
            renderFilteredUpdates
        };
    })();`
}

module.exports = { getFilterModule }
