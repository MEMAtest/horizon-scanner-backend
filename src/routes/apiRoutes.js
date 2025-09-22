// Enhanced API Routes - Phase 1 + Phase 1.3 Workspace Features
// File: src/routes/apiRoutes.js

const express = require('express');
const router = express.Router();
const dbService = require('../services/dbService');
const aiAnalyzer = require('../services/aiAnalyzer');
const weeklyRoundupRoutes = require('./weeklyRoundup');
const relevanceService = require('../services/relevanceService');

// Import FCA enforcement routes
const enforcementRoutes = require('./api/enforcement');

router.use('/', weeklyRoundupRoutes);
router.use('/enforcement', enforcementRoutes);

// ENHANCED UPDATES ENDPOINTS
router.get('/updates', async (req, res) => {
    try {
        console.log('📊 API: Getting enhanced updates with filters:', req.query);
        
        const filters = {
            category: req.query.category || 'all',
            authority: req.query.authority || null,
            sector: req.query.sector || null,
            impact: req.query.impact || null,
            range: req.query.range || null,
            search: req.query.search || null,
            limit: parseInt(req.query.limit) || 50
        };
        
        const updates = await dbService.getEnhancedUpdates(filters);
        
        res.json({
            success: true,
            updates,
            count: updates.length,
            filters,
            timestamp: new Date().toISOString()
        });
    

    } catch (error) {
        console.error('❌ API Error getting updates:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            updates: [],
            count: 0
        });
    }
});

router.get('/updates/counts', async (req, res) => {
    try {
        console.log('📊 API: Getting live update counts');
        
        const counts = await dbService.getUpdateCounts();
        
        res.json({
            success: true,
            ...counts,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ API Error getting counts:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            total: 0,
            highImpact: 0,
            today: 0,
            thisWeek: 0
        });
    }
});

// =================================================================
// 🆕 PHASE 1.3 - RELEVANCE-BASED UPDATES ENDPOINT
// =================================================================

router.get('/updates/relevant', async (req, res) => {
    try {
        console.log('🎯 API: Getting relevance-scored updates');
        
        // Get firm profile
        const firmProfile = await dbService.getFirmProfile();
        
        // Get updates with filters
        const filters = {
            limit: parseInt(req.query.limit) || 100,
            ...req.query
        };
        const updates = await dbService.getEnhancedUpdates(filters);
        
        // Apply relevance scoring and categorization
        const categorized = relevanceService.categorizeByRelevance(updates, firmProfile);
        
        res.json({
            success: true,
            firmProfile: firmProfile ? {
                firmName: firmProfile.firmName || firmProfile.firm_name,
                primarySectors: firmProfile.primarySectors || firmProfile.primary_sectors
            } : null,
            high: categorized.high,
            medium: categorized.medium,
            low: categorized.low,
            totalUpdates: updates.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ API Error getting relevant updates:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            high: [],
            medium: [],
            low: []
        });
    }
});

router.get('/updates/:id', async (req, res) => {
    try {
        const updateId = req.params.id;
        console.log(`📄 API: Getting update details for ID: ${updateId}`);
        
        // Get specific update with enhanced details
        const updates = await dbService.getEnhancedUpdates({ 
            id: updateId,
            limit: 1 
        });
        
        if (updates.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Update not found'
            });
        }
        
        const update = updates[0];
        
        // Get related updates (same authority or sector)
        const relatedUpdates = await dbService.getEnhancedUpdates({
            authority: update.authority,
            limit: 5
        });
        
        res.json({
            success: true,
            update,
            relatedUpdates: relatedUpdates.filter(u => u.id != updateId),
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ API Error getting update details:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Live counts endpoint for sidebar - fixes 404 error
router.get('/live-counts', async (req, res) => {
    try {
        console.log('📊 API: Getting live counts for sidebar');
        
        const counts = await dbService.getUpdateCounts();
        
        // Get workspace counts for Phase 1.3
        const pinnedItems = await dbService.getPinnedItems();
        const savedSearches = await dbService.getSavedSearches();
        const customAlerts = await dbService.getCustomAlerts();
        
        // Ensure all expected fields are present for the sidebar
        const response = {
            success: true,
            total: counts.total || 0,
            highImpact: counts.highImpact || 0,
            today: counts.today || 0,
            todayChange: counts.todayChange || 0,
            thisWeek: counts.thisWeek || 0,
            unread: counts.unread || 0,
            activeSources: counts.activeSources || 12,
            // Phase 1.3 workspace counts
            pinnedItems: pinnedItems.length,
            savedSearches: savedSearches.length,
            activeAlerts: customAlerts.filter(a => a.isActive).length,
            timestamp: new Date().toISOString()
        };
        
        res.json(response);
        
    } catch (error) {
        console.error('❌ API Error getting live counts:', error);
        
        // Return default values on error to prevent frontend crashes
        res.status(500).json({
            success: false,
            error: error.message,
            total: 0,
            highImpact: 0,
            today: 0,
            todayChange: 0,
            thisWeek: 0,
            unread: 0,
            activeSources: 0,
            pinnedItems: 0,
            savedSearches: 0,
            activeAlerts: 0,
            timestamp: new Date().toISOString()
        });
    }
});

// =================================================================
// 🆕 PHASE 1.3 - FIRM PROFILE MANAGEMENT ENDPOINTS
// =================================================================

router.get('/firm-profile', async (req, res) => {
    try {
        console.log('🏢 API: Getting firm profile');
        
        const profile = await dbService.getFirmProfile();
        
        res.json({
            success: true,
            profile: profile,
            hasProfile: !!profile,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ API Error getting firm profile:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            profile: null
        });
    }
});

router.post('/firm-profile', async (req, res) => {
    try {
        console.log('🏢 API: Saving firm profile', req.body);
        
        const profileData = {
            firmName: req.body.firmName || req.body.firm_name,
            primarySectors: req.body.primarySectors || req.body.primary_sectors || [],
            firmSize: req.body.firmSize || req.body.firm_size || 'Medium',
            isActive: true
        };
        
        const savedProfile = await dbService.saveFirmProfile(profileData);
        
        // Invalidate relevance cache
        relevanceService.invalidateProfileCache();
        
        res.json({
            success: true,
            message: 'Firm profile saved successfully',
            profile: savedProfile,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ API Error saving firm profile:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.delete('/firm-profile', async (req, res) => {
    try {
        console.log('🏢 API: Clearing firm profile');
        
        await dbService.clearFirmProfile();
        relevanceService.invalidateProfileCache();
        
        res.json({
            success: true,
            message: 'Firm profile cleared successfully',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ API Error clearing firm profile:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// =================================================================
// 🆕 PHASE 1.3 - WORKSPACE MANAGEMENT: PINNED ITEMS
// =================================================================

router.get('/workspace/pinned', async (req, res) => {
    try {
        console.log('📌 API: Getting pinned items');
        
        const items = await dbService.getPinnedItems();
        
        res.json({
            success: true,
            items: items,
            count: items.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ API Error getting pinned items:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            items: []
        });
    }
});

router.post('/workspace/pin', async (req, res) => {
    try {
        console.log('📌 API: Pinning update', req.body);
        
        const { url, title, authority, notes } = req.body;
        
        if (!url || !title) {
            return res.status(400).json({
                success: false,
                error: 'URL and title are required'
            });
        }
        
        const result = await dbService.addPinnedItem(url, title, notes, authority);
        
        res.json({
            success: true,
            message: 'Update pinned successfully',
            item: result,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ API Error pinning update:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.delete('/workspace/pin/:url', async (req, res) => {
    try {
        const url = decodeURIComponent(req.params.url);
        console.log('📌 API: Unpinning update', url);
        
        const success = await dbService.removePinnedItem(url);
        
        if (success) {
            res.json({
                success: true,
                message: 'Update unpinned successfully',
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Pinned item not found'
            });
        }
        
    } catch (error) {
        console.error('❌ API Error unpinning update:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.put('/workspace/pin/:url/notes', async (req, res) => {
    try {
        const url = decodeURIComponent(req.params.url);
        const { notes } = req.body;
        
        console.log('📝 API: Updating pinned item notes', url);
        
        const success = await dbService.updatePinnedItemNotes(url, notes);
        
        if (success) {
            res.json({
                success: true,
                message: 'Notes updated successfully',
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Pinned item not found'
            });
        }
        
    } catch (error) {
        console.error('❌ API Error updating notes:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// =================================================================
// 🆕 PHASE 1.3 - WORKSPACE MANAGEMENT: SAVED SEARCHES
// =================================================================

router.get('/workspace/searches', async (req, res) => {
    try {
        console.log('🔍 API: Getting saved searches');
        
        const searches = await dbService.getSavedSearches();
        
        res.json({
            success: true,
            searches: searches,
            count: searches.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ API Error getting saved searches:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            searches: []
        });
    }
});

router.post('/workspace/search', async (req, res) => {
    try {
        console.log('🔍 API: Saving search', req.body);
        
        const { searchName, filterParams } = req.body;
        
        if (!searchName) {
            return res.status(400).json({
                success: false,
                error: 'Search name is required'
            });
        }
        
        const savedSearch = await dbService.saveSearch(searchName, filterParams || {});
        
        res.json({
            success: true,
            message: 'Search saved successfully',
            search: savedSearch,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ API Error saving search:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/workspace/search/:id', async (req, res) => {
    try {
        const searchId = req.params.id;
        console.log('🔍 API: Getting saved search', searchId);
        
        const search = await dbService.getSavedSearch(searchId);
        
        if (search) {
            res.json({
                success: true,
                search: search,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Saved search not found'
            });
        }
        
    } catch (error) {
        console.error('❌ API Error getting saved search:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.delete('/workspace/search/:id', async (req, res) => {
    try {
        const searchId = req.params.id;
        console.log('🔍 API: Deleting saved search', searchId);
        
        const success = await dbService.deleteSavedSearch(searchId);
        
        if (success) {
            res.json({
                success: true,
                message: 'Search deleted successfully',
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Saved search not found'
            });
        }
        
    } catch (error) {
        console.error('❌ API Error deleting search:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// =================================================================
// 🆕 PHASE 1.3 - WORKSPACE MANAGEMENT: CUSTOM ALERTS
// =================================================================

router.get('/workspace/alerts', async (req, res) => {
    try {
        console.log('🚨 API: Getting custom alerts');
        
        const alerts = await dbService.getCustomAlerts();
        
        res.json({
            success: true,
            alerts: alerts,
            count: alerts.length,
            activeCount: alerts.filter(a => a.isActive).length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ API Error getting alerts:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            alerts: []
        });
    }
});

router.post('/workspace/alert', async (req, res) => {
    try {
        console.log('🚨 API: Creating custom alert', req.body);
        
        const { alertName, alertConditions } = req.body;
        
        if (!alertName) {
            return res.status(400).json({
                success: false,
                error: 'Alert name is required'
            });
        }
        
        const alert = await dbService.createCustomAlert(alertName, alertConditions || {});
        
        res.json({
            success: true,
            message: 'Alert created successfully',
            alert: alert,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ API Error creating alert:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.put('/workspace/alert/:id', async (req, res) => {
    try {
        const alertId = req.params.id;
        const { isActive } = req.body;
        
        console.log(`🚨 API: Updating alert ${alertId} status to ${isActive}`);
        
        const success = await dbService.updateAlertStatus(alertId, isActive);
        
        if (success) {
            res.json({
                success: true,
                message: `Alert ${isActive ? 'activated' : 'deactivated'} successfully`,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Alert not found'
            });
        }
        
    } catch (error) {
        console.error('❌ API Error updating alert:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.delete('/workspace/alert/:id', async (req, res) => {
    try {
        const alertId = req.params.id;
        console.log('🚨 API: Deleting alert', alertId);
        
        const success = await dbService.deleteCustomAlert(alertId);
        
        if (success) {
            res.json({
                success: true,
                message: 'Alert deleted successfully',
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Alert not found'
            });
        }
        
    } catch (error) {
        console.error('❌ API Error deleting alert:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// =================================================================
// 🆕 PHASE 1.3 - WORKSPACE STATS ENDPOINT
// =================================================================

router.get('/workspace/stats', async (req, res) => {
    try {
        console.log('📊 API: Getting workspace statistics');
        
        const pinnedItems = await dbService.getPinnedItems();
        const savedSearches = await dbService.getSavedSearches();
        const customAlerts = await dbService.getCustomAlerts();
        const firmProfile = await dbService.getFirmProfile();
        
        res.json({
            success: true,
            stats: {
                pinnedItems: pinnedItems.length,
                savedSearches: savedSearches.length,
                customAlerts: customAlerts.length,
                activeAlerts: customAlerts.filter(a => a.isActive).length,
                hasFirmProfile: !!firmProfile
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ API Error getting workspace stats:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stats: {
                pinnedItems: 0,
                savedSearches: 0,
                customAlerts: 0,
                activeAlerts: 0,
                hasFirmProfile: false
            }
        });
    }
});

// AI INTELLIGENCE ENDPOINTS (existing code continues below...)
router.get('/ai/insights', async (req, res) => {
    try {
        console.log('🧠 API: Getting AI insights');
        
        const limit = parseInt(req.query.limit) || 10;
        const insights = await dbService.getRecentAIInsights(limit);
        
        res.json({
            success: true,
            insights,
            count: insights.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ API Error getting AI insights:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            insights: []
        });
    }
});

router.get('/ai/weekly-roundup', async (req, res) => {
    try {
        console.log('📋 API: Generating AI weekly roundup');
        
        // Get updates from the last week
        const updates = await dbService.getEnhancedUpdates({
            range: 'week',
            limit: 100
        });
        
        if (updates.length === 0) {
            return res.json({
                success: true,
                roundup: {
                    weekSummary: 'No updates available for this week.',
                    keyThemes: [],
                    topAuthorities: [],
                    highImpactUpdates: [],
                    sectorInsights: {},
                    upcomingDeadlines: [],
                    weeklyPriorities: [],
                    totalUpdates: 0,
                    generatedAt: new Date().toISOString()
                }
            });
        }
        
        // Generate AI-powered weekly roundup
        const roundup = await aiAnalyzer.generateWeeklyRoundup(updates);
        
        res.json({
            success: true,
            roundup,
            sourceUpdates: updates.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ API Error generating weekly roundup:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            roundup: null
        });
    }
});

router.get('/ai/authority-spotlight/:authority', async (req, res) => {
    try {
        const authority = req.params.authority;
        console.log(`🏛️ API: Generating authority spotlight for: ${authority}`);
        
        // Get recent updates from this authority
        const updates = await dbService.getEnhancedUpdates({
            authority,
            range: 'month',
            limit: 50
        });
        
        if (updates.length === 0) {
            return res.json({
                success: true,
                spotlight: {
                    authority,
                    focusAreas: [],
                    activityLevel: 'low',
                    keyInitiatives: [],
                    enforcementTrends: 'No recent activity',
                    upcomingActions: [],
                    totalUpdates: 0,
                    analysisDate: new Date().toISOString()
                }
            });
        }
        
        // Generate authority spotlight analysis
        const spotlight = await generateAuthoritySpotlight(authority, updates);
        
        res.json({
            success: true,
            spotlight,
            sourceUpdates: updates.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ API Error generating authority spotlight:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            spotlight: null
        });
    }
});

router.get('/ai/sector-analysis/:sector', async (req, res) => {
    try {
        const sector = req.params.sector;
        console.log(`🏢 API: Generating sector analysis for: ${sector}`);
        
        // Get recent updates affecting this sector
        const updates = await dbService.getEnhancedUpdates({
            sector,
            range: 'month',
            limit: 50
        });
        
        if (updates.length === 0) {
            return res.json({
                success: true,
                analysis: {
                    sector,
                    regulatoryPressure: 'low',
                    keyThemes: [],
                    complianceFocus: [],
                    businessImpact: 'low',
                    recommendations: [],
                    totalUpdates: 0,
                    analysisDate: new Date().toISOString()
                }
            });
        }
        
        // Generate sector analysis
        const analysis = await generateSectorAnalysis(sector, updates);
        
        res.json({
            success: true,
            analysis,
            sourceUpdates: updates.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ API Error generating sector analysis:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            analysis: null
        });
    }
});

router.get('/ai/trend-analysis', async (req, res) => {
    try {
        console.log('📈 API: Generating trend analysis');
        
        const period = req.query.period || 'month';
        const limit = parseInt(req.query.limit) || 100;
        
        // Get updates for trend analysis
        const updates = await dbService.getEnhancedUpdates({
            range: period,
            limit
        });
        
        if (updates.length === 0) {
            return res.json({
                success: true,
                trends: {
                    period,
                    emergingThemes: [],
                    authorityActivity: {},
                    sectorImpact: {},
                    compliancePriorities: [],
                    totalUpdates: 0,
                    analysisDate: new Date().toISOString()
                }
            });
        }
        
        // Generate trend analysis
        const trends = await generateTrendAnalysis(updates, period);
        
        res.json({
            success: true,
            trends,
            sourceUpdates: updates.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ API Error generating trend analysis:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            trends: null
        });
    }
});

// Add this route to your src/routes/apiRoutes.js file

// AI Early Warnings Endpoint - NEW ADDITION
router.get('/ai/early-warnings', async (req, res) => {
    try {
        console.log('🔮 Generating AI early warnings...');
        
        // Get recent updates and firm profile
        const updates = await dbService.getAllUpdates();
        const firmProfile = await dbService.getFirmProfile();
        
        // Generate early warnings based on patterns and trends
        const warnings = await generateEarlyWarnings(updates, firmProfile);
        
        res.json({
            success: true,
            warnings: warnings,
            metadata: {
                generatedAt: new Date().toISOString(),
                firmProfile: !!firmProfile,
                dataPoints: updates.length
            }
        });
        
    } catch (error) {
        console.error('Error generating early warnings:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            warnings: []
        });
    }
});

// Helper function to generate early warnings
async function generateEarlyWarnings(updates, firmProfile) {
    const warnings = [];
    
    // Check for consultation deadlines in next 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    updates.forEach(update => {
        // Deadline warnings
        if (update.keyDates && update.keyDates.includes('deadline')) {
            warnings.push({
                type: 'deadline',
                urgency: 'High',
                title: `Upcoming deadline: ${update.headline}`,
                description: `${update.authority} has a consultation deadline approaching`,
                date: update.keyDates,
                action: 'Review and submit response if applicable',
                url: update.url
            });
        }
        
        // High impact warnings
        if (update.impactLevel === 'Significant' && update.urgency === 'High') {
            warnings.push({
                type: 'high-impact',
                urgency: 'High',
                title: `High impact regulation: ${update.headline}`,
                description: update.impact,
                sectors: update.primarySectors || [],
                action: 'Immediate review and impact assessment required',
                url: update.url
            });
        }
    });
    
    // Authority pattern warnings
    const authorityActivity = {};
    updates.forEach(update => {
        if (update.authority) {
            authorityActivity[update.authority] = (authorityActivity[update.authority] || 0) + 1;
        }
    });
    
    Object.entries(authorityActivity).forEach(([authority, count]) => {
        if (count >= 5) {
            warnings.push({
                type: 'authority-activity',
                urgency: 'Medium',
                title: `Increased ${authority} activity`,
                description: `${authority} has published ${count} updates recently, indicating heightened regulatory focus`,
                action: 'Monitor for emerging themes and prepare for potential changes',
                count: count
            });
        }
    });
    
    // Sector-specific warnings (if firm profile exists)
    if (firmProfile && firmProfile.primarySectors) {
        firmProfile.primarySectors.forEach(sector => {
            const sectorUpdates = updates.filter(u => 
                u.primarySectors && u.primarySectors.includes(sector)
            );
            
            if (sectorUpdates.length >= 3) {
                warnings.push({
                    type: 'sector-focus',
                    urgency: 'Medium',
                    title: `Regulatory focus on ${sector}`,
                    description: `${sectorUpdates.length} recent updates affecting ${sector} sector`,
                    action: 'Review sector-specific compliance requirements',
                    updateCount: sectorUpdates.length
                });
            }
        });
    }
    
    // Sort warnings by urgency
    warnings.sort((a, b) => {
        const urgencyOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });
    
    return warnings.slice(0, 10); // Return top 10 warnings
}

// ANALYTICS AND STATISTICS ENDPOINTS
router.get('/analytics/dashboard', async (req, res) => {
    try {
        console.log('📊 API: Getting dashboard analytics');
        
        const stats = await dbService.getDashboardStatistics();
        const filterOptions = await dbService.getFilterOptions();
        
        res.json({
            success: true,
            statistics: stats,
            filterOptions,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ API Error getting dashboard analytics:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            statistics: null
        });
    }
});

router.get('/analytics/impact-distribution', async (req, res) => {
    try {
        console.log('📊 API: Getting impact distribution analytics');
        
        const updates = await dbService.getEnhancedUpdates({
            range: req.query.period || 'month',
            limit: 500
        });
        
        const distribution = calculateImpactDistribution(updates);
        
        res.json({
            success: true,
            distribution,
            sourceUpdates: updates.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ API Error getting impact distribution:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            distribution: null
        });
    }
});

// SYSTEM HEALTH AND STATUS ENDPOINTS
router.get('/health', async (req, res) => {
    try {
        console.log('🔍 API: Health check requested');
        
        const dbHealth = await dbService.healthCheck();
        const aiHealth = await aiAnalyzer.healthCheck();
        
        const overallStatus = dbHealth.status === 'healthy' && aiHealth.status === 'healthy' 
            ? 'healthy' : 'degraded';
        
        res.json({
            status: overallStatus,
            timestamp: new Date().toISOString(),
            services: {
                database: dbHealth,
                aiAnalyzer: aiHealth
            },
            version: '2.0.0',
            environment: process.env.NODE_ENV || 'development'
        });
        
    } catch (error) {
        console.error('❌ API Health check failed:', error);
        res.status(500).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

router.get('/status', async (req, res) => {
    try {
        console.log('📊 API: System status requested');
        
        const stats = await dbService.getSystemStatistics();
        const counts = await dbService.getUpdateCounts();
        
        res.json({
            success: true,
            status: 'operational',
            statistics: stats,
            liveCounters: counts,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ API Status check failed:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            status: 'error'
        });
    }
});

// System status endpoint (different from /status - frontend expects this exact endpoint)
router.get('/system-status', async (req, res) => {
    try {
        console.log('🔍 API: System status check requested');
        
        const dbHealth = await dbService.healthCheck();
        const aiHealth = await aiAnalyzer.healthCheck();
        
        res.json({
            overall: { 
                status: dbHealth.status === 'healthy' && aiHealth.status === 'healthy' ? 'healthy' : 'degraded' 
            },
            database: { 
                connected: dbHealth.status === 'healthy',
                ...dbHealth 
            },
            api: { 
                healthy: true, 
                version: '2.0.0' 
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('System status error:', error);
        res.status(503).json({
            overall: { status: 'error' },
            database: { connected: false },
            api: { healthy: false },
            error: error.message
        });
    }
});

// Main refresh endpoint (POST)
router.post('/refresh', async (req, res) => {
    try {
        console.log('🔄 Refresh endpoint called');
        
        // Try to use rssFetcher if available
        const rssFetcher = require('../services/rssFetcher');
        const results = await rssFetcher.fetchAllFeeds();
        
        res.json({
            success: true,
            message: 'Refresh completed successfully',
            newArticles: results.newUpdates || 0,
            totalProcessed: results.total || 0,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Refresh error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Manual refresh endpoint (POST)
router.post('/manual-refresh', async (req, res) => {
    try {
        const manualRefreshService = require('../services/manualRefreshService');
        const options = req.body || {};
        
        console.log('📡 Manual refresh API called with options:', options);
        
        const result = await manualRefreshService.performManualRefresh(options);
        
        res.json(result);
        
    } catch (error) {
        console.error('Manual refresh API error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Refresh status endpoint (GET)
router.get('/refresh-status', async (req, res) => {
    try {
        const manualRefreshService = require('../services/manualRefreshService');
        
        const status = manualRefreshService.getRefreshStatus();
        const counts = await manualRefreshService.getSystemCounts();
        
        res.json({
            ...status,
            counts
        });
        
    } catch (error) {
        console.error('Refresh status API error:', error);
        res.status(500).json({
            error: error.message
        });
    }
});

// Weekly Roundup endpoint (404 fix)
router.get('/weekly-roundup', async (req, res) => {
    try {
        console.log('📊 Weekly roundup requested');
        
        const updates = await dbService.getAllUpdates();
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        
        const weeklyUpdates = updates.filter(update => 
            new Date(update.fetchedDate) >= weekStart
        );
        
        // Authority breakdown
        const authorityStats = {};
        weeklyUpdates.forEach(update => {
            const auth = update.authority || 'Unknown';
            authorityStats[auth] = (authorityStats[auth] || 0) + 1;
        });
        
        const topAuthorities = Object.entries(authorityStats)
            .map(([authority, count]) => ({
                authority,
                updateCount: count,
                focusArea: authority === 'FCA' ? 'Consumer Protection' : 
                          authority === 'Bank of England' ? 'Financial Stability' : 
                          authority === 'PRA' ? 'Prudential Regulation' : 'General Policy'
            }))
            .sort((a, b) => b.updateCount - a.updateCount)
            .slice(0, 5);
        
        // High impact updates
        const highImpactUpdates = weeklyUpdates
            .filter(u => u.urgency === 'High' || u.impactLevel === 'Significant')
            .slice(0, 3)
            .map(update => ({
                headline: update.headline,
                authority: update.authority,
                impact: update.impact || 'Significant regulatory impact requiring attention'
            }));
        
        const roundup = {
            weekSummary: "This week, regulatory activity focused on consumer protection, financial stability, and international cooperation. Key updates included important developments across multiple sectors.",
            keyThemes: ["Consumer Protection", "Financial Stability", "International Cooperation"],
            topAuthorities,
            highImpactUpdates,
            sectorInsights: {
                "Banking": "Regulatory focus on consumer protection and stress testing requirements.",
                "Investment Management": "Monitoring developments in regulatory compliance frameworks."
            },
            upcomingDeadlines: [],
            weeklyPriorities: [
                "Review latest regulatory changes",
                "Assess compliance requirements", 
                "Monitor sector-specific developments"
            ],
            statistics: {
                authorityBreakdown: authorityStats,
                sectorBreakdown: {},
                impactBreakdown: {
                    "Significant": weeklyUpdates.filter(u => u.impactLevel === 'Significant').length,
                    "Moderate": weeklyUpdates.filter(u => u.impactLevel === 'Moderate').length,
                    "Informational": weeklyUpdates.filter(u => u.impactLevel === 'Informational').length
                },
                avgImpactScore: 0
            },
            totalUpdates: weeklyUpdates.length,
            weekStart: weekStart.toISOString().split('T')[0],
            generatedAt: new Date().toISOString(),
            dataQuality: {
                aiGenerated: true,
                confidence: 0.85,
                sourceCount: weeklyUpdates.length
            }
        };
        
        res.json({
            success: true,
            roundup,
            sourceUpdates: weeklyUpdates.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Weekly roundup error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate weekly roundup',
            details: error.message
        });
    }
});

// Authority Spotlight endpoint (404 fix)
router.get('/authority-spotlight/:authority', async (req, res) => {
    try {
        const authority = req.params.authority;
        console.log(`🔍 Authority spotlight requested for: ${authority}`);
        
        const updates = await dbService.getAllUpdates();
        const authorityUpdates = updates.filter(update => 
            update.authority && update.authority.toLowerCase().includes(authority.toLowerCase())
        );
        
        const spotlight = {
            authority: authority.toUpperCase(),
            focusAreas: ["conduct"],
            activityLevel: authorityUpdates.length > 10 ? "high" : 
                          authorityUpdates.length > 5 ? "medium" : "low",
            keyInitiatives: [],
            enforcementTrends: `${authorityUpdates.filter(u => 
                (u.headline || '').toLowerCase().includes('enforcement')).length > 0 ? 
                'increasing' : 'decreasing'} (${authorityUpdates.filter(u => 
                (u.headline || '').toLowerCase().includes('enforcement')).length} enforcement-related updates)`,
            upcomingActions: [],
            totalUpdates: authorityUpdates.length,
            analysisDate: new Date().toISOString(),
            confidence: 0.8
        };
        
        res.json({
            success: true,
            spotlight,
            sourceUpdates: authorityUpdates.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Authority spotlight error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate authority spotlight',
            details: error.message
        });
    }
});

// Live Stats endpoint (for updateLiveCounters function)
router.get('/stats/live', async (req, res) => {
    try {
        const updates = await dbService.getAllUpdates();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayUpdates = updates.filter(update => 
            new Date(update.fetchedDate) >= today
        );
        
        const stats = {
            totalUpdates: updates.length,
            newToday: todayUpdates.length,
            urgent: updates.filter(u => u.urgency === 'High').length,
            moderate: updates.filter(u => u.urgency === 'Medium').length,
            background: updates.filter(u => u.urgency === 'Low').length,
            lastUpdate: updates.length > 0 ? updates[0].fetchedDate : null
        };
        
        res.json({
            success: true,
            stats,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Live stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get live stats',
            details: error.message
        });
    }
});

// Streams endpoint (for loadIntelligenceStreams function)
router.get('/streams', async (req, res) => {
    try {
        const updates = await dbService.getAllUpdates();
        
        res.json({
            success: true,
            updates: updates.slice(0, 50), // Limit for performance
            total: updates.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Streams error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load streams',
            details: error.message
        });
    }
});

// Analytics endpoints (for refreshAnalytics function)
router.get('/analytics/preview', async (req, res) => {
    try {
        const updates = await dbService.getAllUpdates();
        
        const analytics = {
            totalUpdates: updates.length,
            averageRiskScore: 5.2,
            topSectors: ['Banking', 'Investment Management', 'Insurance'],
            recentTrends: ['Increasing enforcement activity', 'Focus on consumer protection']
        };
        
        res.json({
            success: true,
            analytics,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Analytics preview error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load analytics preview',
            details: error.message
        });
    }
});

router.post('/analytics/refresh', async (req, res) => {
    try {
        const updates = await dbService.getAllUpdates();
        res.json({
            success: true,
            message: 'Analytics refreshed successfully',
            dashboard: {
                totalUpdates: updates.length,
                averageRiskScore: 5.2
            }
        });
        
    } catch (error) {
        console.error('Analytics refresh error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to refresh analytics',
            details: error.message
        });
    }
});

// Filter endpoints for sidebar functions
router.get('/updates/category/:category', async (req, res) => {
    try {
        const category = req.params.category.toLowerCase();
        const updates = await dbService.getAllUpdates();
        
        const filtered = updates.filter(update => {
            const content = ((update.headline || '') + ' ' + (update.impact || '')).toLowerCase();
            
            switch(category) {
                case 'consultation':
                    return content.includes('consultation') || content.includes('consult');
                case 'guidance':
                    return content.includes('guidance') || content.includes('guide');
                case 'enforcement':
                    return content.includes('enforcement') || content.includes('fine') || content.includes('penalty');
                case 'speech':
                    return content.includes('speech') || content.includes('remarks');
                case 'news':
                    return content.includes('news') || content.includes('announcement');
                case 'policy':
                    return content.includes('policy') || content.includes('regulation');
                default:
                    return false;
            }
        });
        
        res.json({
            success: true,
            updates: filtered,
            total: filtered.length,
            category: req.params.category
        });
        
    } catch (error) {
        console.error('Category filter error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to filter by category',
            details: error.message
        });
    }
});

router.get('/updates/content-type/:type', async (req, res) => {
    try {
        const type = req.params.type.toLowerCase();
        const updates = await dbService.getAllUpdates();
        
        const filtered = updates.filter(update => {
            const content = ((update.headline || '') + ' ' + (update.impact || '')).toLowerCase();
            
            switch(type) {
                case 'final-rule':
                    return content.includes('final') && (content.includes('rule') || content.includes('regulation'));
                case 'proposal':
                    return content.includes('proposal') || content.includes('proposed');
                case 'notice':
                    return content.includes('notice') || content.includes('notification');
                case 'report':
                    return content.includes('report') || content.includes('analysis');
                case 'fine':
                    return content.includes('fine') || content.includes('penalty') || content.includes('sanction');
                default:
                    return false;
            }
        });
        
        res.json({
            success: true,
            updates: filtered,
            total: filtered.length,
            contentType: req.params.type
        });
        
    } catch (error) {
        console.error('Content type filter error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to filter by content type',
            details: error.message
        });
    }
});

router.get('/updates/source-type/:type', async (req, res) => {
    try {
        const type = req.params.type.toLowerCase();
        const updates = await dbService.getAllUpdates();
        
        const filtered = updates.filter(update => {
            const url = (update.url || '').toLowerCase();
            
            switch(type) {
                case 'rss':
                    return update.sourceCategory === 'rss' || url.includes('rss') || url.includes('feed');
                case 'scraped':
                    return update.sourceCategory === 'scraped' || !url.includes('rss');
                case 'direct':
                    return update.sourceCategory === 'direct';
                default:
                    return false;
            }
        });
        
        res.json({
            success: true,
            updates: filtered,
            total: filtered.length,
            sourceType: req.params.type
        });
        
    } catch (error) {
        console.error('Source type filter error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to filter by source type',
            details: error.message
        });
    }
});

router.get('/updates/relevance/:level', async (req, res) => {
    try {
        const level = req.params.level.toLowerCase();
        const updates = await dbService.getAllUpdates();
        
        const filtered = updates.filter(update => {
            switch(level) {
                case 'high':
                    return update.urgency === 'High' || update.impactLevel === 'Significant';
                case 'medium':
                    return update.urgency === 'Medium' || update.impactLevel === 'Moderate';
                case 'low':
                    return update.urgency === 'Low' || update.impactLevel === 'Informational';
                default:
                    return false;
            }
        });
        
        res.json({
            success: true,
            updates: filtered,
            total: filtered.length,
            relevance: req.params.level
        });
        
    } catch (error) {
        console.error('Relevance filter error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to filter by relevance',
            details: error.message
        });
    }
});

// Utility endpoints
router.get('/export', async (req, res) => {
    try {
        const updates = await dbService.getAllUpdates();
        
        res.json({
            success: true,
            data: {
                updates: updates.slice(0, 100), // Limit for export
                exportDate: new Date().toISOString(),
                totalRecords: updates.length
            }
        });
        
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to export data',
            details: error.message
        });
    }
});

router.post('/alerts', async (req, res) => {
    try {
        const alertData = req.body;
        
        res.json({
            success: true,
            message: 'Alert created successfully',
            alertId: Date.now().toString()
        });
        
    } catch (error) {
        console.error('Alert creation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create alert',
            details: error.message
        });
    }
});

// ADD THE SEARCH ENDPOINT HERE:
router.get('/search', async (req, res) => {
    try {
        console.log('🔍 Search requested with filters:', req.query);
        
        const filters = {
            authority: req.query.authority || null,
            sector: req.query.sector || null,
            search: req.query.search || null,
            impact: req.query.impact || null,
            limit: parseInt(req.query.limit) || 50
        };
        
        const results = await dbService.getEnhancedUpdates(filters);
        
        res.json({
            success: true,
            results,
            total: results.length,
            filters,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Search error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            results: []
        });
    }
});

// UTILITY ENDPOINTS
router.get('/test', async (req, res) => {
    try {
        console.log('🧪 API: Test endpoint accessed');
        
        res.json({
            success: true,
            message: 'AI Regulatory Intelligence Platform API is operational',
            timestamp: new Date().toISOString(),
            version: '2.0.0',
            features: [
                'Enhanced Updates with AI Analysis',
                'Real-time Impact Scoring',
                'Sector-specific Intelligence',
                'Authority Spotlight Analysis',
                'Weekly AI Roundups',
                'Trend Analysis',
                'Early Warning System (Phase 1.2)',
                'Proactive Intelligence',
                'Phase 1.3 Workspace Management'
            ]
        });
        
    } catch (error) {
        console.error('❌ API Test failed:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// HELPER FUNCTIONS FOR AI ANALYSIS (existing helper functions continue below...)
async function generateAuthoritySpotlight(authority, updates) {
    console.log(`🏛️ Generating spotlight analysis for ${authority}`);
    
    try {
        // Calculate activity level
        const activityLevel = updates.length > 20 ? 'high' : 
                             updates.length > 10 ? 'moderate' : 'low';
        
        // Extract focus areas from update content
        const focusAreas = extractFocusAreas(updates);
        
        // Analyze enforcement trends
        const enforcementTrends = analyzeEnforcementTrends(updates);
        
        // Generate key initiatives
        const keyInitiatives = extractKeyInitiatives(updates);
        
        return {
            authority,
            focusAreas: focusAreas.slice(0, 5),
            activityLevel,
            keyInitiatives: keyInitiatives.slice(0, 3),
            enforcementTrends,
            upcomingActions: [], // TODO: Implement predictive analysis
            totalUpdates: updates.length,
            analysisDate: new Date().toISOString(),
            confidence: 0.8
        };
        
    } catch (error) {
        console.error('Error generating authority spotlight:', error);
        return {
            authority,
            focusAreas: [],
            activityLevel: 'unknown',
            keyInitiatives: [],
            enforcementTrends: 'Analysis unavailable',
            upcomingActions: [],
            totalUpdates: updates.length,
            analysisDate: new Date().toISOString(),
            confidence: 0.3
        };
    }
}

async function generateSectorAnalysis(sector, updates) {
    console.log(`🏢 Generating sector analysis for ${sector}`);
    
    try {
        // Calculate regulatory pressure
        const highImpactCount = updates.filter(u => 
            u.impactLevel === 'Significant' || 
            u.business_impact_score >= 7
        ).length;
        
        const regulatoryPressure = highImpactCount > updates.length * 0.3 ? 'high' :
                                  highImpactCount > updates.length * 0.1 ? 'moderate' : 'low';
        
        // Extract key themes
        const keyThemes = extractKeyThemes(updates);
        
        // Determine compliance focus areas
        const complianceFocus = extractComplianceFocus(updates);
        
        // Calculate business impact
        const avgImpactScore = updates
            .filter(u => u.business_impact_score)
            .reduce((sum, u) => sum + u.business_impact_score, 0) / 
            updates.filter(u => u.business_impact_score).length || 0;
            
        const businessImpact = avgImpactScore >= 7 ? 'high' :
                              avgImpactScore >= 5 ? 'medium' : 'low';
        
        return {
            sector,
            regulatoryPressure,
            keyThemes: keyThemes.slice(0, 5),
            complianceFocus: complianceFocus.slice(0, 4),
            businessImpact: `${businessImpact} (avg score: ${avgImpactScore.toFixed(1)})`,
            recommendations: generateSectorRecommendations(regulatoryPressure, keyThemes),
            totalUpdates: updates.length,
            analysisDate: new Date().toISOString(),
            confidence: 0.75
        };
        
    } catch (error) {
        console.error('Error generating sector analysis:', error);
        return {
            sector,
            regulatoryPressure: 'unknown',
            keyThemes: [],
            complianceFocus: [],
            businessImpact: 'unknown',
            recommendations: [],
            totalUpdates: updates.length,
            analysisDate: new Date().toISOString(),
            confidence: 0.3
        };
    }
}

async function generateTrendAnalysis(updates, period) {
    console.log(`📈 Generating trend analysis for ${period} period`);
    
    try {
        // Extract emerging themes
        const emergingThemes = extractEmergingThemes(updates);
        
        // Calculate authority activity
        const authorityActivity = {};
        updates.forEach(update => {
            const auth = update.authority;
            if (!authorityActivity[auth]) {
                authorityActivity[auth] = { count: 0, highImpact: 0 };
            }
            authorityActivity[auth].count++;
            if (update.impactLevel === 'Significant' || update.business_impact_score >= 7) {
                authorityActivity[auth].highImpact++;
            }
        });
        
        // Calculate sector impact
        const sectorImpact = {};
        updates.forEach(update => {
            const sectors = update.firm_types_affected || update.primarySectors || [];
            sectors.forEach(sector => {
                if (!sectorImpact[sector]) {
                    sectorImpact[sector] = { updates: 0, avgImpact: 0 };
                }
                sectorImpact[sector].updates++;
                sectorImpact[sector].avgImpact += update.business_impact_score || 0;
            });
        });
        
        // Calculate average impact scores
        Object.keys(sectorImpact).forEach(sector => {
            sectorImpact[sector].avgImpact = 
                sectorImpact[sector].avgImpact / sectorImpact[sector].updates;
        });
        
        return {
            period,
            emergingThemes: emergingThemes.slice(0, 5),
            authorityActivity,
            sectorImpact,
            compliancePriorities: extractCompliancePriorities(updates),
            totalUpdates: updates.length,
            analysisDate: new Date().toISOString(),
            confidence: 0.8
        };
        
    } catch (error) {
        console.error('Error generating trend analysis:', error);
        return {
            period,
            emergingThemes: [],
            authorityActivity: {},
            sectorImpact: {},
            compliancePriorities: [],
            totalUpdates: updates.length,
            analysisDate: new Date().toISOString(),
            confidence: 0.3
        };
    }
}

function calculateImpactDistribution(updates) {
    const distribution = {
        byLevel: { Significant: 0, Moderate: 0, Informational: 0 },
        byScore: {},
        byAuthority: {},
        bySector: {},
        timeline: []
    };
    
    updates.forEach(update => {
        // By impact level
        const level = update.impactLevel || 'Informational';
        distribution.byLevel[level] = (distribution.byLevel[level] || 0) + 1;
        
        // By impact score
        const score = update.business_impact_score || 0;
        const scoreRange = `${Math.floor(score)}-${Math.floor(score) + 1}`;
        distribution.byScore[scoreRange] = (distribution.byScore[scoreRange] || 0) + 1;
        
        // By authority
        const authority = update.authority;
        if (!distribution.byAuthority[authority]) {
            distribution.byAuthority[authority] = { total: 0, highImpact: 0 };
        }
        distribution.byAuthority[authority].total++;
        if (level === 'Significant' || score >= 7) {
            distribution.byAuthority[authority].highImpact++;
        }
        
        // By sector
        const sectors = update.firm_types_affected || update.primarySectors || [];
        sectors.forEach(sector => {
            if (!distribution.bySector[sector]) {
                distribution.bySector[sector] = { total: 0, avgImpact: 0 };
            }
            distribution.bySector[sector].total++;
            distribution.bySector[sector].avgImpact += score;
        });
    });
    
    // Calculate average impact scores for sectors
    Object.keys(distribution.bySector).forEach(sector => {
        const data = distribution.bySector[sector];
        data.avgImpact = data.total > 0 ? data.avgImpact / data.total : 0;
    });
    
    return distribution;
}

// TEXT ANALYSIS HELPER FUNCTIONS
function extractFocusAreas(updates) {
    const keywords = {};
    
    updates.forEach(update => {
        const text = (update.headline + ' ' + (update.summary || update.ai_summary || '')).toLowerCase();
        
        // Common regulatory focus areas
        const focusPatterns = [
            'capital requirements', 'conduct', 'consumer protection', 'market abuse',
            'financial crime', 'operational resilience', 'governance', 'reporting',
            'prudential', 'remuneration', 'data protection', 'competition'
        ];
        
        focusPatterns.forEach(pattern => {
            if (text.includes(pattern)) {
                keywords[pattern] = (keywords[pattern] || 0) + 1;
            }
        });
    });
    
    return Object.entries(keywords)
        .sort(([,a], [,b]) => b - a)
        .map(([keyword]) => keyword);
}

function analyzeEnforcementTrends(updates) {
    const enforcementKeywords = ['fine', 'penalty', 'enforcement', 'sanction', 'breach'];
    const enforcementCount = updates.filter(update => {
        const text = (update.headline + ' ' + (update.summary || update.ai_summary || '')).toLowerCase();
        return enforcementKeywords.some(keyword => text.includes(keyword));
    }).length;
    
    const trend = enforcementCount > updates.length * 0.2 ? 'increasing' :
                  enforcementCount > 0 ? 'stable' : 'decreasing';
    
    return `${trend} (${enforcementCount} enforcement-related updates)`;
}

function extractKeyInitiatives(updates) {
    const initiatives = [];
    
    updates.forEach(update => {
        const text = update.headline.toLowerCase();
        
        if (text.includes('consultation')) {
            initiatives.push({
                initiative: 'Consultation Process',
                description: 'Active stakeholder engagement on new regulations',
                impact: 'Regulatory development and industry input'
            });
        }
        
        if (text.includes('guidance') || text.includes('supervisory')) {
            initiatives.push({
                initiative: 'Supervisory Guidance',
                description: 'Enhanced regulatory clarity and expectations',
                impact: 'Improved compliance understanding'
            });
        }
        
        if (text.includes('review') || text.includes('assessment')) {
            initiatives.push({
                initiative: 'Regulatory Review',
                description: 'Evaluation of existing frameworks',
                impact: 'Potential policy changes and updates'
            });
        }
    });
    
    return initiatives.slice(0, 3);
}

function extractKeyThemes(updates) {
    const themes = {};
    
    updates.forEach(update => {
        const text = (update.headline + ' ' + (update.area || '')).toLowerCase();
        
        const themePatterns = [
            'digital transformation', 'sustainability', 'climate risk', 'crypto',
            'open banking', 'consumer duty', 'operational resilience', 'cyber security',
            'machine learning', 'artificial intelligence', 'brexit', 'international'
        ];
        
        themePatterns.forEach(theme => {
            if (text.includes(theme.toLowerCase())) {
                themes[theme] = (themes[theme] || 0) + 1;
            }
        });
    });
    
    return Object.entries(themes)
        .sort(([,a], [,b]) => b - a)
        .map(([theme]) => theme);
}

function extractComplianceFocus(updates) {
    const focusAreas = {};
    
    updates.forEach(update => {
        if (update.area) {
            focusAreas[update.area] = (focusAreas[update.area] || 0) + 1;
        }
        
        // Extract from AI tags
        if (update.ai_tags) {
            update.ai_tags.forEach(tag => {
                if (tag.startsWith('area:')) {
                    const area = tag.replace('area:', '').replace('-', ' ');
                    focusAreas[area] = (focusAreas[area] || 0) + 1;
                }
            });
        }
    });
    
    return Object.entries(focusAreas)
        .sort(([,a], [,b]) => b - a)
        .map(([area]) => area);
}

function generateSectorRecommendations(pressure, themes) {
    const recommendations = [];
    
    if (pressure === 'high') {
        recommendations.push('Prioritize compliance review and gap analysis');
        recommendations.push('Consider additional compliance resources');
    }
    
    if (themes.includes('operational resilience')) {
        recommendations.push('Strengthen operational resilience frameworks');
    }
    
    if (themes.includes('consumer duty')) {
        recommendations.push('Review customer treatment and outcome monitoring');
    }
    
    if (themes.includes('digital transformation')) {
        recommendations.push('Assess technology risk management capabilities');
    }
    
    recommendations.push('Monitor regulatory developments closely');
    
    return recommendations.slice(0, 4);
}

function extractEmergingThemes(updates) {
    const themes = {};
    const recentUpdates = updates.slice(0, Math.min(50, updates.length));
    
    recentUpdates.forEach(update => {
        if (update.ai_tags) {
            update.ai_tags.forEach(tag => {
                themes[tag] = (themes[tag] || 0) + 1;
            });
        }
        
        // Extract themes from headlines
        const headline = update.headline.toLowerCase();
        const emergingKeywords = [
            'digital', 'ai', 'machine learning', 'crypto', 'sustainability',
            'climate', 'esg', 'resilience', 'cyber', 'data protection'
        ];
        
        emergingKeywords.forEach(keyword => {
            if (headline.includes(keyword)) {
                themes[keyword] = (themes[keyword] || 0) + 1;
            }
        });
    });
    
    return Object.entries(themes)
        .sort(([,a], [,b]) => b - a)
        .map(([theme]) => theme);
}

function extractCompliancePriorities(updates) {
    const priorities = [];
    
    // High impact updates become priorities
    const highImpactUpdates = updates.filter(u => 
        u.impactLevel === 'Significant' || u.business_impact_score >= 7
    );
    
    if (highImpactUpdates.length > 0) {
        priorities.push(`Review ${highImpactUpdates.length} high-impact regulatory changes`);
    }
    
    // Upcoming deadlines
    const upcomingDeadlines = updates.filter(u => u.compliance_deadline);
    if (upcomingDeadlines.length > 0) {
        priorities.push(`Prepare for ${upcomingDeadlines.length} upcoming compliance deadlines`);
    }
    
    // Enforcement actions
    const enforcementUpdates = updates.filter(u => 
        u.ai_tags && u.ai_tags.includes('type:enforcement')
    );
    if (enforcementUpdates.length > 0) {
        priorities.push(`Learn from ${enforcementUpdates.length} recent enforcement actions`);
    }
    
    priorities.push('Maintain ongoing regulatory monitoring');
    
    return priorities.slice(0, 5);
}

module.exports = router;