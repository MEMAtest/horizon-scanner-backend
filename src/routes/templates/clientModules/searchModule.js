function getSearchModule() {
    return `
    // Search Module
    const SearchModule = (function() {
        function performSearch(searchTerm) {
            console.log(\`🔍 Performing search: "\${searchTerm}"\`);
            
            try {
                if (!searchTerm || searchTerm.length < 2) {
                    document.querySelectorAll('.update-card').forEach(card => {
                        card.style.display = 'block';
                    });
                    return;
                }
                
                const searchLower = searchTerm.toLowerCase();
                
                document.querySelectorAll('.update-card').forEach(card => {
                    const headline = card.querySelector('.update-headline')?.textContent?.toLowerCase() || '';
                    const summary = card.querySelector('.update-summary')?.textContent?.toLowerCase() || '';
                    const authority = card.querySelector('.authority-badge')?.textContent?.toLowerCase() || '';
                    
                    const isMatch = headline.includes(searchLower) || 
                                  summary.includes(searchLower) || 
                                  authority.includes(searchLower);
                    
                    card.style.display = isMatch ? 'block' : 'none';
                });
                
            } catch (error) {
                console.error('❌ Search error:', error);
            }
        }
        
        function loadMoreUpdates() {
            console.log('📄 Loading more updates...');
            
            try {
                const loadMoreBtn = document.getElementById('loadMoreBtn');
                if (loadMoreBtn) {
                    loadMoreBtn.disabled = true;
                    loadMoreBtn.textContent = 'Loading...';
                }
                
                currentOffset += itemsPerPage;
                
                const params = new URLSearchParams({
                    offset: currentOffset,
                    limit: itemsPerPage
                });
                
                if (selectedAuthorities.size > 0) {
                    params.append('authorities', Array.from(selectedAuthorities).join(','));
                }
                if (selectedImpactLevels.size > 0) {
                    params.append('impacts', Array.from(selectedImpactLevels).join(','));
                }
                if (selectedUrgencies.size > 0) {
                    params.append('urgencies', Array.from(selectedUrgencies).join(','));
                }
                
                fetch(\`/api/updates?\${params.toString()}\`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.success && data.updates) {
                            const updatesContainer = document.getElementById('updatesContainer') || 
                                                   document.querySelector('.updates-list') ||
                                                   document.querySelector('.update-cards');
                            
                            if (updatesContainer) {
                                data.updates.forEach(update => {
                                    const updateCard = ContentModule.generateUpdateCard(update);
                                    updatesContainer.insertAdjacentHTML('beforeend', updateCard);
                                });
                                
                                showMessage(\`Loaded \${data.updates.length} more updates\`, 'success');
                            }
                            
                            if (data.updates.length < itemsPerPage) {
                                if (loadMoreBtn) {
                                    loadMoreBtn.style.display = 'none';
                                }
                                showMessage('All updates loaded', 'info');
                            }
                        } else {
                            throw new Error(data.error || 'Failed to load more updates');
                        }
                    })
                    .catch(error => {
                        console.error('Load more error:', error);
                        showMessage('Failed to load more updates: ' + error.message, 'error');
                        currentOffset -= itemsPerPage;
                    })
                    .finally(() => {
                        if (loadMoreBtn) {
                            loadMoreBtn.disabled = false;
                            loadMoreBtn.textContent = 'Load More';
                        }
                    });
                    
            } catch (error) {
                console.error('❌ Error loading more updates:', error);
                showMessage('Error loading more updates', 'error');
            }
        }
        
        return {
            performSearch,
            loadMoreUpdates
        };
    })();`;
}

module.exports = { getSearchModule };