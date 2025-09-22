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

        function loadMoreUpdatesForStream(streamId, totalUpdates) {
            console.log(\`📄 Loading more updates for stream: \${streamId}\`);

            try {
                const loadMoreBtn = document.getElementById(\`loadMoreBtn-\${streamId}\`);
                if (loadMoreBtn) {
                    loadMoreBtn.disabled = true;
                    loadMoreBtn.textContent = 'Loading...';
                }

                // Get the stream content container
                const streamContainer = document.getElementById(streamId);
                const streamContent = streamContainer?.querySelector('.stream-content');

                if (!streamContent) {
                    console.error('Stream content container not found');
                    return;
                }

                // Calculate how many we've already shown (first 5) and how many more to load
                const currentlyShown = streamContent.querySelectorAll('.update-card').length;
                const remainingUpdates = totalUpdates - currentlyShown;
                const toLoad = Math.min(5, remainingUpdates); // Load 5 more or remaining

                // Get filters for this stream type
                let filters = {};
                if (streamId === 'urgent') {
                    filters.impact = 'Significant';
                    filters.urgency = 'High';
                } else if (streamId === 'moderate') {
                    filters.impact = 'Moderate';
                    filters.urgency = 'Medium';
                } else if (streamId === 'background') {
                    filters.impact = 'Informational';
                    filters.urgency = 'Low';
                }

                const params = new URLSearchParams({
                    offset: currentlyShown,
                    limit: toLoad,
                    ...filters
                });

                fetch(\`/api/updates?\${params.toString()}\`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.success && data.updates) {
                            // Find where to insert new cards (before the load more button)
                            const insertPoint = loadMoreBtn?.parentNode || streamContent;

                            data.updates.forEach(update => {
                                const updateCard = ContentModule.generateUpdateCard(update);
                                if (loadMoreBtn) {
                                    loadMoreBtn.insertAdjacentHTML('beforebegin', updateCard);
                                } else {
                                    insertPoint.insertAdjacentHTML('beforeend', updateCard);
                                }
                            });

                            showMessage(\`Loaded \${data.updates.length} more updates\`, 'success');

                            // Update remaining count or hide button if no more
                            const newRemaining = remainingUpdates - data.updates.length;
                            if (newRemaining <= 0 || data.updates.length < toLoad) {
                                if (loadMoreBtn) {
                                    loadMoreBtn.style.display = 'none';
                                }
                            } else {
                                if (loadMoreBtn) {
                                    loadMoreBtn.textContent = \`Load More (\${newRemaining} remaining)\`;
                                }
                            }
                        } else {
                            throw new Error(data.error || 'Failed to load more updates');
                        }
                    })
                    .catch(error => {
                        console.error('Load more error:', error);
                        showMessage('Failed to load more updates: ' + error.message, 'error');
                    })
                    .finally(() => {
                        if (loadMoreBtn) {
                            loadMoreBtn.disabled = false;
                            if (loadMoreBtn.style.display !== 'none') {
                                loadMoreBtn.textContent = loadMoreBtn.textContent.includes('remaining') ?
                                    loadMoreBtn.textContent : 'Load More';
                            }
                        }
                    });

            } catch (error) {
                console.error('❌ Error loading more updates for stream:', error);
                showMessage('Error loading more updates', 'error');
            }
        }
        
        return {
            performSearch,
            loadMoreUpdates,
            loadMoreUpdatesForStream
        };
    })();`;
}

module.exports = { getSearchModule };