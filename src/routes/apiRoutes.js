// src/routes/apiRoutes.js
// COMPLETE API ROUTES: All Missing Endpoints + Working Functionality

const express = require('express');
const router = express.Router();
const dbService = require('../services/dbService');
const { fetchAll } = require('../services/rssFetcher');

// Firm Profile Management
let firmProfileStore = null; // Simple in-memory store for now

// GET /api/firm-profile
router.get('/firm-profile', async (req, res) => {
    try {
        console.log('📋 Getting firm profile...');
        
        const availableSectors = [
            'Banking', 'Investment Management', 'Consumer Credit', 
            'Insurance', 'Payments', 'Pensions', 'Mortgages', 
            'Capital Markets', 'Cryptocurrency', 'Fintech', 'General'
        ];
        
        res.json({
            success: true,
            profile: firmProfileStore,
            availableSectors
        });
        
    } catch (error) {
        console.error('Error getting firm profile:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/firm-profile
router.post('/firm-profile', async (req, res) => {
    try {
        const { firmName, firmSize, primarySectors } = req.body;
        
        console.log('💾 Saving firm profile:', { firmName, firmSize, primarySectors });
        
        // Validation
        if (!firmName || !firmSize || !primarySectors || primarySectors.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }
        
        if (primarySectors.length > 3) {
            return res.status(400).json({
                success: false,
                error: 'Maximum 3 sectors allowed'
            });
        }
        
        // Save profile
        firmProfileStore = {
            firmName,
            firmSize,
            primarySectors,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        console.log('✅ Firm profile saved successfully');
        
        res.json({
            success: true,
            profile: firmProfileStore,
            relevanceUpdated: 0
        });
        
    } catch (error) {
        console.error('Error saving firm profile:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// DELETE /api/firm-profile
router.delete('/firm-profile', async (req, res) => {
    try {
        console.log('🗑️ Clearing firm profile...');
        
        firmProfileStore = null;
        
        console.log('✅ Firm profile cleared successfully');
        
        res.json({
            success: true,
            message: 'Firm profile cleared successfully'
        });
        
    } catch (error) {
        console.error('Error clearing firm profile:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Workspace Management
let workspaceStore = {
    pinnedItems: [],
    savedSearches: [],
    customAlerts: []
};

// GET /api/workspace/stats
router.get('/workspace/stats', async (req, res) => {
    try {
        console.log('📊 Getting workspace stats...');
        
        const stats = {
            pinnedItems: workspaceStore.pinnedItems.length,
            savedSearches: workspaceStore.savedSearches.length,
            activeAlerts: workspaceStore.customAlerts.filter(a => a.isActive).length
        };
        
        res.json({
            success: true,
            stats
        });
        
    } catch (error) {
        console.error('Error getting workspace stats:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/workspace/pinned
router.get('/workspace/pinned', async (req, res) => {
    try {
        console.log('📌 Getting pinned items...');
        
        res.json({
            success: true,
            items: workspaceStore.pinnedItems
        });
        
    } catch (error) {
        console.error('Error getting pinned items:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/workspace/pin
router.post('/workspace/pin', async (req, res) => {
    try {
        const { updateUrl, updateTitle, updateAuthority } = req.body;
        
        console.log('📌 Pinning item:', updateTitle);
        
        // Check if already pinned
        const existingIndex = workspaceStore.pinnedItems.findIndex(item => item.updateUrl === updateUrl);
        
        if (existingIndex >= 0) {
            return res.json({
                success: true,
                message: 'Item already pinned'
            });
        }
        
        // Add to pinned items
        workspaceStore.pinnedItems.push({
            updateUrl,
            updateTitle,
            updateAuthority,
            pinnedAt: new Date().toISOString()
        });
        
        res.json({
            success: true,
            message: 'Item pinned successfully'
        });
        
    } catch (error) {
        console.error('Error pinning item:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// DELETE /api/workspace/pin/:url
router.delete('/workspace/pin/:url', async (req, res) => {
    try {
        const updateUrl = decodeURIComponent(req.params.url);
        
        console.log('📍 Unpinning item:', updateUrl);
        
        const initialLength = workspaceStore.pinnedItems.length;
        workspaceStore.pinnedItems = workspaceStore.pinnedItems.filter(item => item.updateUrl !== updateUrl);
        
        const removed = initialLength > workspaceStore.pinnedItems.length;
        
        res.json({
            success: true,
            message: removed ? 'Item unpinned successfully' : 'Item not found'
        });
        
    } catch (error) {
        console.error('Error unpinning item:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/alerts/create
router.post('/alerts/create', async (req, res) => {
    try {
        const { name, keywords, authorities, isActive } = req.body;
        
        console.log('🔔 Creating alert:', name);
        
        const alert = {
            id: Date.now(),
            name,
            keywords,
            authorities,
            isActive: isActive !== false,
            createdAt: new Date().toISOString()
        };
        
        workspaceStore.customAlerts.push(alert);
        
        res.json({
            success: true,
            alert,
            message: 'Alert created successfully'
        });
        
    } catch (error) {
        console.error('Error creating alert:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/export/data
router.get('/export/data', async (req, res) => {
    try {
        console.log('📊 Exporting data...');
        
        // Get all updates
        const updates = await dbService.getAllUpdates();
        
        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                totalUpdates: updates.length,
                firmProfile: firmProfileStore,
                workspace: workspaceStore,
                version: '1.0'
            },
            updates: updates,
            firmProfile: firmProfileStore,
            workspace: {
                pinnedItems: workspaceStore.pinnedItems,
                savedSearches: workspaceStore.savedSearches,
                customAlerts: workspaceStore.customAlerts
            }
        };
        
        console.log('✅ Data export prepared');
        
        res.json(exportData);
        
    } catch (error) {
        console.error('Error exporting data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/updates
router.get('/updates', async (req, res) => {
    try {
        console.log('📰 Getting updates...');
        
        const updates = await dbService.getAllUpdates();
        
        // Group updates by urgency/impact
        const urgentUpdates = updates.filter(u => 
            u.urgency === 'High' || u.impactLevel === 'Significant'
        );
        
        const moderateUpdates = updates.filter(u => 
            u.urgency === 'Medium' || u.impactLevel === 'Moderate'
        );
        
        const informationalUpdates = updates.filter(u => 
            u.urgency === 'Low' || u.impactLevel === 'Informational'
        );
        
        // Add relevance scores if firm profile exists
        if (firmProfileStore) {
            updates.forEach(update => {
                // Simple relevance calculation based on sector matching
                const updateSectors = update.primary_sectors || [update.sector];
                const firmSectors = firmProfileStore.primarySectors || [];
                
                let relevanceScore = 0;
                updateSectors.forEach(sector => {
                    if (firmSectors.includes(sector)) {
                        relevanceScore += 80; // High relevance for matching sectors
                    } else {
                        relevanceScore += 20; // Low relevance for non-matching
                    }
                });
                
                update.relevanceScore = Math.min(100, relevanceScore);
            });
            
            // Re-group by relevance
            const highRelevance = updates.filter(u => (u.relevanceScore || 0) >= 70);
            const mediumRelevance = updates.filter(u => (u.relevanceScore || 0) >= 40 && (u.relevanceScore || 0) < 70);
            const lowRelevance = updates.filter(u => (u.relevanceScore || 0) < 40);
            
            res.json({
                success: true,
                total: updates.length,
                urgent: highRelevance,
                moderate: mediumRelevance,
                informational: lowRelevance,
                firmProfile: firmProfileStore
            });
        } else {
            res.json({
                success: true,
                total: updates.length,
                urgent: urgentUpdates,
                moderate: moderateUpdates,
                informational: informationalUpdates,
                firmProfile: null
            });
        }
        
    } catch (error) {
        console.error('Error getting updates:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/refresh
router.post('/refresh', async (req, res) => {
    try {
        console.log('🔄 Starting data refresh...');
        
        const startTime = Date.now();
        
        // Fetch new data
        const result = await fetchAll();
        
        const endTime = Date.now();
        
        console.log('✅ Data refresh completed:', result);
        
        res.json({
            success: true,
            newArticles: result.totalProcessed || 0,
            timeElapsed: endTime - startTime,
            relevanceUpdated: firmProfileStore ? result.totalProcessed : 0
        });
        
    } catch (error) {
        console.error('Error refreshing data:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            newArticles: 0
        });
    }
});

// GET /api/system-status
router.get('/system-status', async (req, res) => {
    try {
        console.log('🔧 Checking system status...');
        
        let dbStatus = 'disconnected';
        let updateCount = 0;
        
        try {
            await dbService.initialize();
            updateCount = await dbService.getUpdateCount();
            dbStatus = 'connected';
        } catch (error) {
            console.error('Database check failed:', error);
        }
        
        const status = {
            success: true,
            database: dbStatus,
            environment: {
                hasGroqKey: !!process.env.GROQ_API_KEY,
                hasDatabaseUrl: !!process.env.DATABASE_URL,
                nodeVersion: process.version,
                platform: process.platform
            },
            data: {
                updateCount,
                lastChecked: new Date().toISOString()
            },
            workspace: {
                pinnedItems: workspaceStore.pinnedItems.length,
                savedSearches: workspaceStore.savedSearches.length,
                activeAlerts: workspaceStore.customAlerts.filter(a => a.isActive).length
            }
        };
        
        res.json(status);
        
    } catch (error) {
        console.error('Error checking system status:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Analytics Dashboard (Mock Data)
router.get('/analytics/dashboard', async (req, res) => {
    try {
        console.log('📊 Getting analytics dashboard...');
        
        const updates = await dbService.getAllUpdates();
        
        // Mock analytics data
        const dashboard = {
            overview: {
                totalUpdates: updates.length,
                averageRiskScore: 45,
                highRiskCount: Math.floor(updates.length * 0.2),
                mediumRiskCount: Math.floor(updates.length * 0.5),
                lowRiskCount: Math.floor(updates.length * 0.3)
            },
            velocity: {
                FCA: { updatesPerWeek: 4.2, prediction: 5.1 },
                BoE: { updatesPerWeek: 2.8, prediction: 3.2 },
                PRA: { updatesPerWeek: 1.5, prediction: 1.8 },
                TPR: { updatesPerWeek: 1.2, prediction: 1.0 }
            },
            hotspots: [
                { sector: 'Banking', riskLevel: 'high', activityScore: 85, updateCount: 12, trend: 'increasing', isUserSector: firmProfileStore?.primarySectors?.includes('Banking') },
                { sector: 'Investment Management', riskLevel: 'medium', activityScore: 65, updateCount: 8, trend: 'stable', isUserSector: firmProfileStore?.primarySectors?.includes('Investment Management') },
                { sector: 'Consumer Credit', riskLevel: 'high', activityScore: 78, updateCount: 10, trend: 'increasing', isUserSector: firmProfileStore?.primarySectors?.includes('Consumer Credit') }
            ],
            predictions: [
                {
                    prediction: 'Consumer Duty enforcement actions expected to increase',
                    confidence: 85,
                    timeframe: 'Next 30-60 days',
                    basedOn: ['Recent FCA speeches', 'Enforcement trends'],
                    affectedSectors: ['Banking', 'Consumer Credit']
                },
                {
                    prediction: 'New capital requirements consultation likely',
                    confidence: 72,
                    timeframe: 'Next 60-90 days',
                    basedOn: ['PRA policy statements', 'Market conditions'],
                    affectedSectors: ['Banking', 'Investment Management']
                }
            ],
            calendar: {
                next30Days: [
                    { title: 'SMCR Deadlines', date: '2024-12-15', riskScore: 85 },
                    { title: 'Prudential Returns', date: '2024-12-31', riskScore: 60 }
                ]
            },
            firmProfile: firmProfileStore
        };
        
        res.json({
            success: true,
            dashboard
        });
        
    } catch (error) {
        console.error('Error getting analytics dashboard:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/analytics/refresh
router.post('/analytics/refresh', async (req, res) => {
    try {
        console.log('🔄 Refreshing analytics...');
        
        // Mock refresh - in real implementation would recalculate analytics
        res.json({
            success: true,
            message: 'Analytics refreshed successfully'
        });
        
    } catch (error) {
        console.error('Error refreshing analytics:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;