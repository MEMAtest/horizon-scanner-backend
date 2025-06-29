// src/services/workspaceService.js
// Phase 1.3: Workspace management service for pinned items, searches, and alerts

const dbService = require('./dbService');

class WorkspaceService {
    constructor() {
        this.alertCheckInterval = null;
    }

    // ====== PINNED ITEMS MANAGEMENT ======

    async pinItem(updateUrl, updateTitle, updateAuthority, notes = '') {
        try {
            // Validate inputs
            if (!updateUrl || !updateTitle) {
                throw new Error('URL and title are required to pin an item');
            }

            const pinnedItem = await dbService.addPinnedItem(updateUrl, updateTitle, updateAuthority, notes);
            
            console.log(`📌 Item pinned: ${updateTitle.substring(0, 50)}...`);
            return {
                success: true,
                message: 'Item pinned successfully',
                item: pinnedItem
            };
        } catch (error) {
            console.error('❌ Error pinning item:', error);
            throw new Error(`Failed to pin item: ${error.message}`);
        }
    }

    async unpinItem(updateUrl) {
        try {
            const success = await dbService.removePinnedItem(updateUrl);
            
            if (success) {
                console.log(`🗑️ Item unpinned: ${updateUrl}`);
                return {
                    success: true,
                    message: 'Item unpinned successfully'
                };
            } else {
                return {
                    success: false,
                    message: 'Item not found or already unpinned'
                };
            }
        } catch (error) {
            console.error('❌ Error unpinning item:', error);
            throw new Error(`Failed to unpin item: ${error.message}`);
        }
    }

    async getPinnedItems() {
        try {
            const pinnedItems = await dbService.getPinnedItems();
            
            return {
                success: true,
                items: pinnedItems,
                count: pinnedItems.length
            };
        } catch (error) {
            console.error('❌ Error getting pinned items:', error);
            throw new Error(`Failed to get pinned items: ${error.message}`);
        }
    }

    async updatePinnedItemNotes(updateUrl, notes) {
        try {
            // Get current pinned items to find the item
            const pinnedItems = await dbService.getPinnedItems();
            const existingItem = pinnedItems.find(item => item.updateUrl === updateUrl);
            
            if (!existingItem) {
                throw new Error('Pinned item not found');
            }

            // Re-pin with updated notes
            const updatedItem = await dbService.addPinnedItem(
                updateUrl, 
                existingItem.updateTitle, 
                existingItem.updateAuthority, 
                notes
            );
            
            return {
                success: true,
                message: 'Notes updated successfully',
                item: updatedItem
            };
        } catch (error) {
            console.error('❌ Error updating pinned item notes:', error);
            throw new Error(`Failed to update notes: ${error.message}`);
        }
    }

    // ====== SAVED SEARCHES MANAGEMENT ======

    async saveSearch(searchName, filterParams) {
        try {
            // Validate inputs
            if (!searchName || !filterParams) {
                throw new Error('Search name and filter parameters are required');
            }

            // Validate filter parameters structure
            const validFilterKeys = ['authorities', 'sectors', 'impactLevels', 'urgency', 'keywords', 'dateRange'];
            const hasValidFilters = Object.keys(filterParams).some(key => validFilterKeys.includes(key));
            
            if (!hasValidFilters) {
                throw new Error('At least one valid filter parameter is required');
            }

            const savedSearch = await dbService.saveSearch(searchName, filterParams);
            
            console.log(`🔍 Search saved: ${searchName}`);
            return {
                success: true,
                message: 'Search saved successfully',
                search: savedSearch
            };
        } catch (error) {
            console.error('❌ Error saving search:', error);
            throw new Error(`Failed to save search: ${error.message}`);
        }
    }

    async getSavedSearches() {
        try {
            const savedSearches = await dbService.getSavedSearches();
            
            return {
                success: true,
                searches: savedSearches,
                count: savedSearches.length
            };
        } catch (error) {
            console.error('❌ Error getting saved searches:', error);
            throw new Error(`Failed to get saved searches: ${error.message}`);
        }
    }

    async deleteSearch(searchId) {
        try {
            const success = await dbService.deleteSearch(searchId);
            
            if (success) {
                console.log(`🗑️ Search deleted: ${searchId}`);
                return {
                    success: true,
                    message: 'Search deleted successfully'
                };
            } else {
                return {
                    success: false,
                    message: 'Search not found'
                };
            }
        } catch (error) {
            console.error('❌ Error deleting search:', error);
            throw new Error(`Failed to delete search: ${error.message}`);
        }
    }

    async executeSearch(filterParams) {
        try {
            const allUpdates = await dbService.getAllUpdates();
            let filteredUpdates = [...allUpdates];

            // Apply authority filter
            if (filterParams.authorities && filterParams.authorities.length > 0) {
                filteredUpdates = filteredUpdates.filter(update => 
                    filterParams.authorities.includes(update.authority)
                );
            }

            // Apply sector filter
            if (filterParams.sectors && filterParams.sectors.length > 0) {
                filteredUpdates = filteredUpdates.filter(update => {
                    // Check primary sectors array
                    if (update.primarySectors && Array.isArray(update.primarySectors)) {
                        return update.primarySectors.some(sector => filterParams.sectors.includes(sector));
                    }
                    // Fallback to single sector field
                    return filterParams.sectors.includes(update.sector);
                });
            }

            // Apply impact level filter
            if (filterParams.impactLevels && filterParams.impactLevels.length > 0) {
                filteredUpdates = filteredUpdates.filter(update => 
                    filterParams.impactLevels.includes(update.impactLevel)
                );
            }

            // Apply urgency filter
            if (filterParams.urgency && filterParams.urgency.length > 0) {
                filteredUpdates = filteredUpdates.filter(update => 
                    filterParams.urgency.includes(update.urgency)
                );
            }

            // Apply keyword filter
            if (filterParams.keywords && filterParams.keywords.length > 0) {
                filteredUpdates = filteredUpdates.filter(update => {
                    const searchText = [
                        update.headline,
                        update.impact,
                        update.area
                    ].join(' ').toLowerCase();
                    
                    return filterParams.keywords.some(keyword => 
                        searchText.includes(keyword.toLowerCase())
                    );
                });
            }

            // Apply date range filter
            if (filterParams.dateRange) {
                const { startDate, endDate } = filterParams.dateRange;
                if (startDate || endDate) {
                    filteredUpdates = filteredUpdates.filter(update => {
                        const updateDate = new Date(update.fetchedDate);
                        if (startDate && updateDate < new Date(startDate)) return false;
                        if (endDate && updateDate > new Date(endDate)) return false;
                        return true;
                    });
                }
            }

            // Sort by relevance score or date
            filteredUpdates.sort((a, b) => {
                // Primary sort by relevance score (if available)
                const aRelevance = a.relevanceScore || 0;
                const bRelevance = b.relevanceScore || 0;
                if (aRelevance !== bRelevance) {
                    return bRelevance - aRelevance;
                }
                
                // Secondary sort by date
                return new Date(b.fetchedDate) - new Date(a.fetchedDate);
            });

            return {
                success: true,
                results: filteredUpdates,
                count: filteredUpdates.length,
                appliedFilters: filterParams
            };
        } catch (error) {
            console.error('❌ Error executing search:', error);
            throw new Error(`Failed to execute search: ${error.message}`);
        }
    }

    // ====== CUSTOM ALERTS MANAGEMENT ======

    async createAlert(alertName, conditions) {
        try {
            // Validate inputs
            if (!alertName || !conditions) {
                throw new Error('Alert name and conditions are required');
            }

            // Validate conditions structure
            const validConditionKeys = ['keywords', 'authorities', 'sectors', 'impactLevels', 'urgency'];
            const hasValidConditions = Object.keys(conditions).some(key => validConditionKeys.includes(key));
            
            if (!hasValidConditions) {
                throw new Error('At least one valid condition is required');
            }

            const alert = await dbService.createAlert(alertName, conditions);
            
            console.log(`🚨 Alert created: ${alertName}`);
            return {
                success: true,
                message: 'Alert created successfully',
                alert: alert
            };
        } catch (error) {
            console.error('❌ Error creating alert:', error);
            throw new Error(`Failed to create alert: ${error.message}`);
        }
    }

    async getActiveAlerts() {
        try {
            const alerts = await dbService.getActiveAlerts();
            
            return {
                success: true,
                alerts: alerts,
                count: alerts.length
            };
        } catch (error) {
            console.error('❌ Error getting active alerts:', error);
            throw new Error(`Failed to get active alerts: ${error.message}`);
        }
    }

    async toggleAlert(alertId, isActive) {
        try {
            const success = await dbService.toggleAlert(alertId, isActive);
            
            if (success) {
                console.log(`🔄 Alert ${alertId} ${isActive ? 'activated' : 'deactivated'}`);
                return {
                    success: true,
                    message: `Alert ${isActive ? 'activated' : 'deactivated'} successfully`
                };
            } else {
                return {
                    success: false,
                    message: 'Alert not found'
                };
            }
        } catch (error) {
            console.error('❌ Error toggling alert:', error);
            throw new Error(`Failed to toggle alert: ${error.message}`);
        }
    }

    async checkAlertsForUpdate(update) {
        try {
            const activeAlerts = await dbService.getActiveAlerts();
            const triggeredAlerts = [];

            for (const alert of activeAlerts) {
                if (this.doesUpdateTriggerAlert(update, alert.alertConditions)) {
                    triggeredAlerts.push({
                        alertId: alert.id,
                        alertName: alert.alertName,
                        update: update,
                        triggeredAt: new Date().toISOString()
                    });
                }
            }

            if (triggeredAlerts.length > 0) {
                console.log(`🚨 ${triggeredAlerts.length} alert(s) triggered for update: ${update.headline}`);
            }

            return triggeredAlerts;
        } catch (error) {
            console.error('❌ Error checking alerts for update:', error);
            return [];
        }
    }

    doesUpdateTriggerAlert(update, conditions) {
        // Check keyword conditions
        if (conditions.keywords && conditions.keywords.length > 0) {
            const searchText = [
                update.headline,
                update.impact,
                update.area
            ].join(' ').toLowerCase();
            
            const hasKeywordMatch = conditions.keywords.some(keyword => 
                searchText.includes(keyword.toLowerCase())
            );
            
            if (!hasKeywordMatch) return false;
        }

        // Check authority conditions
        if (conditions.authorities && conditions.authorities.length > 0) {
            if (!conditions.authorities.includes(update.authority)) {
                return false;
            }
        }

        // Check sector conditions
        if (conditions.sectors && conditions.sectors.length > 0) {
            let hasSectorMatch = false;
            
            if (update.primarySectors && Array.isArray(update.primarySectors)) {
                hasSectorMatch = update.primarySectors.some(sector => 
                    conditions.sectors.includes(sector)
                );
            } else if (update.sector) {
                hasSectorMatch = conditions.sectors.includes(update.sector);
            }
            
            if (!hasSectorMatch) return false;
        }

        // Check impact level conditions
        if (conditions.impactLevels && conditions.impactLevels.length > 0) {
            if (!conditions.impactLevels.includes(update.impactLevel)) {
                return false;
            }
        }

        // Check urgency conditions
        if (conditions.urgency && conditions.urgency.length > 0) {
            if (!conditions.urgency.includes(update.urgency)) {
                return false;
            }
        }

        return true; // All conditions passed
    }

    // ====== WORKSPACE ANALYTICS ======

    async getWorkspaceStats() {
        try {
            const [pinnedItems, savedSearches, activeAlerts] = await Promise.all([
                this.getPinnedItems(),
                this.getSavedSearches(),
                this.getActiveAlerts()
            ]);

            return {
                success: true,
                stats: {
                    pinnedItems: pinnedItems.count,
                    savedSearches: savedSearches.count,
                    activeAlerts: activeAlerts.count
                },
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Error getting workspace stats:', error);
            throw new Error(`Failed to get workspace stats: ${error.message}`);
        }
    }

    // ====== BULK OPERATIONS ======

    async bulkPinItems(updateUrls, updateTitles, updateAuthorities) {
        const results = [];
        
        for (let i = 0; i < updateUrls.length; i++) {
            try {
                const result = await this.pinItem(
                    updateUrls[i], 
                    updateTitles[i] || 'Unknown Title',
                    updateAuthorities[i] || 'Unknown'
                );
                results.push({ ...result, url: updateUrls[i] });
            } catch (error) {
                results.push({
                    success: false,
                    url: updateUrls[i],
                    error: error.message
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        
        return {
            success: true,
            message: `${successCount}/${updateUrls.length} items pinned successfully`,
            results: results
        };
    }

    async exportWorkspaceData() {
        try {
            const [pinnedItems, savedSearches, activeAlerts] = await Promise.all([
                this.getPinnedItems(),
                this.getSavedSearches(),
                this.getActiveAlerts()
            ]);

            const exportData = {
                exportDate: new Date().toISOString(),
                version: '1.0',
                data: {
                    pinnedItems: pinnedItems.items,
                    savedSearches: savedSearches.searches,
                    alerts: activeAlerts.alerts
                },
                summary: {
                    pinnedItemsCount: pinnedItems.count,
                    savedSearchesCount: savedSearches.count,
                    activeAlertsCount: activeAlerts.count
                }
            };

            return {
                success: true,
                exportData: exportData,
                filename: `workspace-export-${new Date().toISOString().split('T')[0]}.json`
            };
        } catch (error) {
            console.error('❌ Error exporting workspace data:', error);
            throw new Error(`Failed to export workspace data: ${error.message}`);
        }
    }
}

// Export singleton instance
const workspaceService = new WorkspaceService();

module.exports = workspaceService;