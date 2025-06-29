// src/routes/apiRoutes.js
// Enhanced API routes with Phase 2A Analytics + existing Phase 1.3 features

const express = require('express');
const router = express.Router();

const dbService = require('../services/dbService');
const rssFetcher = require('../services/rssFetcher');
const relevanceService = require('../services/relevanceService');
const workspaceService = require('../services/workspaceService');
const analyticsService = require('../services/analyticsService'); // NEW: Phase 2A
const { INDUSTRY_SECTORS } = require('../services/aiAnalyzer');

// ====== EXISTING API ENDPOINTS (Enhanced with analytics) ======

// GET /api/updates - Enhanced with risk scoring
router.get('/updates', async (req, res) => {
    try {
        const updates = await dbService.getAllUpdates();
        const firmProfile = await relevanceService.getFirmProfile();
        
        // ENHANCED: Add risk scores to all updates
        const updatesWithRisk = updates.map(update => ({
            ...update,
            riskScore: analyticsService.calculateRiskScore(update, firmProfile)
        }));
        
        // Group by relevance for the frontend streams
        const categorized = relevanceService.categorizeByRelevance(updatesWithRisk, firmProfile);
        
        res.json({
            urgent: categorized.high,           // High relevance (70-100)
            moderate: categorized.medium,      // Medium relevance (40-69)  
            informational: categorized.low,    // Low relevance (0-39)
            total: updates.length,
            firmProfile: firmProfile,
            analytics: {
                averageRiskScore: Math.round(updatesWithRisk.reduce((sum, u) => sum + u.riskScore, 0) / updatesWithRisk.length),
                highRiskCount: updatesWithRisk.filter(u => u.riskScore >= 70).length,
                recentCount: updatesWithRisk.filter(u => {
                    const daysSince = (Date.now() - new Date(u.fetchedDate)) / (1000 * 60 * 60 * 24);
                    return daysSince <= 7;
                }).length
            }
        });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ====== PHASE 2A: NEW ANALYTICS ENDPOINTS ======

// GET /api/analytics/dashboard - Main analytics dashboard
router.get('/analytics/dashboard', async (req, res) => {
    try {
        const firmProfile = await relevanceService.getFirmProfile();
        const dashboard = await analyticsService.getAnalyticsDashboard(firmProfile);
        
        res.json({
            success: true,
            dashboard,
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Analytics dashboard error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            fallback: {
                overview: { totalUpdates: 0, recentUpdates: 0, criticalDeadlines: 0 },
                message: 'Analytics temporarily unavailable'
            }
        });
    }
});

// GET /api/analytics/velocity - Regulatory velocity trends
router.get('/analytics/velocity', async (req, res) => {
    try {
        const timeframe = parseInt(req.query.days) || 30;
        const velocity = await analyticsService.getRegulatoryVelocity(timeframe);
        
        res.json({
            success: true,
            ...velocity
        });
    } catch (error) {
        console.error('Velocity analysis error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/analytics/hotspots - Sector hotspot analysis
router.get('/analytics/hotspots', async (req, res) => {
    try {
        const firmProfile = await relevanceService.getFirmProfile();
        const hotspots = await analyticsService.getSectorHotspots(firmProfile);
        
        res.json({
            success: true,
            ...hotspots
        });
    } catch (error) {
        console.error('Hotspot analysis error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/analytics/predictions - Impact predictions
router.get('/analytics/predictions', async (req, res) => {
    try {
        const firmProfile = await relevanceService.getFirmProfile();
        const predictions = await analyticsService.getImpactPredictions(firmProfile);
        
        res.json({
            success: true,
            ...predictions
        });
    } catch (error) {
        console.error('Predictions error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/analytics/calendar - Compliance calendar
router.get('/analytics/calendar', async (req, res) => {
    try {
        const firmProfile = await relevanceService.getFirmProfile();
        const calendar = await analyticsService.getComplianceCalendar(firmProfile);
        
        res.json({
            success: true,
            ...calendar
        });
    } catch (error) {
        console.error('Calendar error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/analytics/risk-score/:url - Calculate risk score for specific update
router.get('/analytics/risk-score/:url', async (req, res) => {
    try {
        const updateUrl = decodeURIComponent(req.params.url);
        const updates = await dbService.getAllUpdates();
        const update = updates.find(u => u.url === updateUrl);
        
        if (!update) {
            return res.status(404).json({ success: false, error: 'Update not found' });
        }
        
        const firmProfile = await relevanceService.getFirmProfile();
        const riskScore = analyticsService.calculateRiskScore(update, firmProfile);
        
        // Provide risk breakdown
        const riskBreakdown = {
            baseScore: analyticsService.calculateRiskScore(update, null), // Without firm profile
            firmAdjustment: riskScore - analyticsService.calculateRiskScore(update, null),
            factors: {
                authority: update.authority,
                impactLevel: update.impactLevel,
                urgency: update.urgency,
                sectorRelevance: firmProfile && update.primarySectors ? 
                    update.primarySectors.some(s => firmProfile.primarySectors.includes(s)) : false,
                recency: (Date.now() - new Date(update.fetchedDate)) / (1000 * 60 * 60 * 24) <= 7
            }
        };
        
        res.json({
            success: true,
            riskScore,
            riskLevel: riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low',
            breakdown: riskBreakdown,
            update: {
                headline: update.headline,
                authority: update.authority,
                impactLevel: update.impactLevel,
                urgency: update.urgency
            }
        });
    } catch (error) {
        console.error('Risk score error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/analytics/refresh - Force refresh analytics cache
router.post('/analytics/refresh', async (req, res) => {
    try {
        console.log('🔄 Refreshing analytics cache...');
        
        analyticsService.clearCache();
        
        // Pre-warm cache with fresh data
        const firmProfile = await relevanceService.getFirmProfile();
        await Promise.all([
            analyticsService.getRegulatoryVelocity(),
            analyticsService.getSectorHotspots(firmProfile),
            analyticsService.getImpactPredictions(firmProfile),
            analyticsService.getComplianceCalendar(firmProfile)
        ]);
        
        res.json({
            success: true,
            message: 'Analytics cache refreshed successfully',
            refreshedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Analytics refresh error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/analytics/trends - Trending topics analysis
router.get('/analytics/trends', async (req, res) => {
    try {
        const sector = req.query.sector;
        const timeframe = parseInt(req.query.days) || 7;
        
        const updates = await dbService.getAllUpdates();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - timeframe);
        
        let filteredUpdates = updates.filter(update => 
            new Date(update.fetchedDate) >= cutoffDate
        );
        
        // Filter by sector if specified
        if (sector && INDUSTRY_SECTORS.includes(sector)) {
            filteredUpdates = filteredUpdates.filter(update =>
                update.primarySectors && update.primarySectors.includes(sector)
            );
        }
        
        // Extract trending keywords
        const keywords = {};
        filteredUpdates.forEach(update => {
            const text = (update.headline + ' ' + update.impact).toLowerCase();
            const words = text.match(/\b[a-z]{4,}\b/g) || [];
            words.forEach(word => {
                if (!['that', 'this', 'with', 'from', 'they', 'have', 'will', 'been', 'were', 'regulatory', 'update', 'news'].includes(word)) {
                    keywords[word] = (keywords[word] || 0) + 1;
                }
            });
        });
        
        const trending = Object.entries(keywords)
            .filter(([, count]) => count >= 2)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([topic, count]) => ({
                topic,
                mentionCount: count,
                trend: `+${Math.round((count / timeframe) * 100)}% in ${timeframe} days`,
                riskLevel: count >= 5 ? 'high' : count >= 3 ? 'medium' : 'low',
                relatedUpdates: filteredUpdates
                    .filter(update => 
                        (update.headline + ' ' + update.impact).toLowerCase().includes(topic)
                    )
                    .slice(0, 3)
                    .map(update => ({
                        headline: update.headline,
                        authority: update.authority,
                        url: update.url
                    }))
            }));
        
        res.json({
            success: true,
            sector: sector || 'All sectors',
            timeframe: `${timeframe} days`,
            trending,
            totalUpdates: filteredUpdates.length,
            calculatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Trends analysis error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ====== ENHANCED EXISTING ENDPOINTS WITH ANALYTICS ======

// POST /api/refresh - Enhanced with analytics refresh
router.post('/refresh', async (req, res) => {
    try {
        console.log('🔄 API refresh triggered');
        
        const result = await rssFetcher.fetchAll();
        
        // Recalculate relevance scores for all updates
        const relevanceResult = await relevanceService.recalculateAllRelevanceScores();
        
        // Clear and refresh analytics cache
        analyticsService.clearCache();
        
        res.json({
            message: 'Data refreshed successfully',
            newArticles: result.totalProcessed,
            rssCount: result.rssCount,
            scrapeCount: result.scrapeCount,
            timeElapsed: result.timeElapsed,
            relevanceUpdated: relevanceResult.updatedCount,
            analyticsRefreshed: true,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Refresh error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/system-status - Enhanced with analytics status
router.get('/system-status', async (req, res) => {
    try {
        let dbConnected = false;
        let updateCount = 0;
        
        try {
            await dbService.initialize();
            updateCount = await dbService.getUpdateCount();
            dbConnected = true;
        } catch (error) {
            console.error('Database connection failed:', error);
        }
        
        // Get workspace stats
        const workspaceStats = await workspaceService.getWorkspaceStats();
        const relevanceStats = await relevanceService.getRelevanceStats();
        
        // NEW: Analytics health check
        let analyticsStatus = 'unknown';
        try {
            const firmProfile = await relevanceService.getFirmProfile();
            const testAnalytics = await analyticsService.getRegulatoryVelocity(7);
            analyticsStatus = testAnalytics ? 'operational' : 'limited';
        } catch (error) {
            analyticsStatus = 'error';
        }
        
        res.json({
            database: dbConnected ? 'connected' : 'disconnected',
            updateCount: updateCount,
            environment: {
                hasGroqKey: !!process.env.GROQ_API_KEY,
                hasDatabaseUrl: !!process.env.DATABASE_URL,
                nodeVersion: process.version
            },
            workspace: workspaceStats.success ? workspaceStats.stats : null,
            relevance: relevanceStats,
            analytics: {
                status: analyticsStatus,
                cacheSize: analyticsService.cache ? analyticsService.cache.size : 0,
                features: ['velocity_analysis', 'sector_hotspots', 'impact_predictions', 'compliance_calendar']
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('System status error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/stats - Enhanced with analytics overview
router.get('/stats', async (req, res) => {
    try {
        const updates = await dbService.getAllUpdates();
        const workspaceStats = await workspaceService.getWorkspaceStats();
        const relevanceStats = await relevanceService.getRelevanceStats();
        
        // Authority distribution
        const authorityCount = {};
        updates.forEach(update => {
            const auth = update.authority || 'Unknown';
            authorityCount[auth] = (authorityCount[auth] || 0) + 1;
        });
        
        // Recent updates (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentUpdates = updates.filter(update => 
            new Date(update.fetchedDate) >= sevenDaysAgo
        );
        
        // NEW: Risk distribution
        const firmProfile = await relevanceService.getFirmProfile();
        const riskDistribution = { high: 0, medium: 0, low: 0 };
        updates.forEach(update => {
            const riskScore = analyticsService.calculateRiskScore(update, firmProfile);
            if (riskScore >= 70) riskDistribution.high++;
            else if (riskScore >= 40) riskDistribution.medium++;
            else riskDistribution.low++;
        });
        
        res.json({
            totalUpdates: updates.length,
            recentUpdates: recentUpdates.length,
            authorities: authorityCount,
            workspace: workspaceStats.success ? workspaceStats.stats : null,
            relevance: relevanceStats,
            riskDistribution, // NEW
            analytics: {
                averageRiskScore: firmProfile ? Math.round(
                    updates.reduce((sum, update) => 
                        sum + analyticsService.calculateRiskScore(update, firmProfile), 0
                    ) / updates.length
                ) : null,
                highRiskUpdates: riskDistribution.high,
                predictionsAvailable: true
            },
            lastFetch: updates.length > 0 ? updates[0].fetchedDate : null
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ====== EXISTING PHASE 1.3 ENDPOINTS (Unchanged) ======

// Firm Profile Management
router.get('/firm-profile', async (req, res) => {
    try {
        const profile = await dbService.getFirmProfile();
        
        res.json({
            profile: profile,
            availableSectors: INDUSTRY_SECTORS,
            hasProfile: !!profile
        });
    } catch (error) {
        console.error('Firm profile get error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/firm-profile', async (req, res) => {
    try {
        const { firmName, primarySectors, firmSize } = req.body;
        
        if (!firmName || !primarySectors || !Array.isArray(primarySectors)) {
            return res.status(400).json({ 
                error: 'Firm name and primary sectors (array) are required' 
            });
        }
        
        const invalidSectors = primarySectors.filter(sector => !INDUSTRY_SECTORS.includes(sector));
        if (invalidSectors.length > 0) {
            return res.status(400).json({ 
                error: `Invalid sectors: ${invalidSectors.join(', ')}` 
            });
        }
        
        const profileData = {
            firmName: firmName.trim(),
            primarySectors: primarySectors,
            firmSize: firmSize || 'Medium'
        };
        
        const savedProfile = await dbService.saveFirmProfile(profileData);
        
        relevanceService.invalidateProfileCache();
        const relevanceResult = await relevanceService.recalculateAllRelevanceScores();
        
        // Clear analytics cache since firm profile affects all analytics
        analyticsService.clearCache();
        
        res.json({
            message: 'Firm profile saved successfully',
            profile: savedProfile,
            relevanceUpdated: relevanceResult.updatedCount,
            analyticsRefreshed: true
        });
    } catch (error) {
        console.error('Firm profile save error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ... (All other existing Phase 1.3 endpoints remain unchanged)
// Workspace endpoints, relevance endpoints, etc. - keep them all as they were

// GET /api/updates/relevant
router.get('/updates/relevant', async (req, res) => {
    try {
        const firmProfile = await relevanceService.getFirmProfile();
        const relevantUpdates = await dbService.getRelevantUpdates(firmProfile);
        
        res.json({
            updates: relevantUpdates,
            count: relevantUpdates.length,
            firmProfile: firmProfile
        });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/updates/search
router.get('/updates/search', async (req, res) => {
    try {
        const { q, authority, sector, impact, urgency } = req.query;
        
        const filterParams = {};
        if (authority) filterParams.authorities = authority.split(',');
        if (sector) filterParams.sectors = sector.split(',');
        if (impact) filterParams.impactLevels = impact.split(',');
        if (urgency) filterParams.urgency = urgency.split(',');
        if (q) filterParams.keywords = [q];
        
        const results = await workspaceService.executeSearch(filterParams);
        
        res.json(results);
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Workspace endpoints (keep all existing ones)
router.get('/workspace/pinned', async (req, res) => {
    try {
        const result = await workspaceService.getPinnedItems();
        res.json(result);
    } catch (error) {
        console.error('Get pinned items error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/workspace/pin', async (req, res) => {
    try {
        const { updateUrl, updateTitle, updateAuthority, notes } = req.body;
        
        if (!updateUrl || !updateTitle) {
            return res.status(400).json({ 
                error: 'updateUrl and updateTitle are required' 
            });
        }
        
        const result = await workspaceService.pinItem(updateUrl, updateTitle, updateAuthority, notes);
        res.json(result);
    } catch (error) {
        console.error('Pin item error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.delete('/workspace/pin/:url', async (req, res) => {
    try {
        const updateUrl = decodeURIComponent(req.params.url);
        const result = await workspaceService.unpinItem(updateUrl);
        res.json(result);
    } catch (error) {
        console.error('Unpin item error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ... (Include all other existing workspace, relevance, and utility endpoints)

module.exports = router;