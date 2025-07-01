// src/routes/apiRoutes.js
// COMPLETE ENHANCED API ROUTES: Category-Based Analytics + New Filtering Endpoints
// NEW: Category, Content-Type, Source-Type filtering endpoints + Enhanced search

const express = require('express');
const router = express.Router();
const dbService = require('../services/dbService');
const analyticsService = require('../services/analyticsService');
const relevanceService = require('../services/relevanceService');
const workspaceService = require('../services/workspaceService');
const { fetchAll } = require('../services/rssFetcher');

// ====== NEW: CATEGORY-BASED FILTERING ENDPOINTS ======

// NEW: Filter updates by regulatory category
router.get('/updates/category/:category', async (req, res) => {
    try {
        const category = decodeURIComponent(req.params.category);
        const { limit = 50, relevanceFilter, riskFilter } = req.query;
        
        console.log(`🏷️ Filtering updates by category: ${category}`);
        
        const allUpdates = await dbService.getAllUpdates();
        const firmProfile = await dbService.getFirmProfile();
        
        // Filter updates by category using analytics service
        const categoryUpdates = allUpdates.filter(update => {
            const updateCategory = analyticsService.determineCategory ? 
                analyticsService.determineCategory(update) : 
                update.category || 'General';
            
            return updateCategory.toLowerCase().includes(category.toLowerCase()) ||
                   category.toLowerCase() === 'general';
        });
        
        // Enhance with relevance and risk scores
        const enhancedUpdates = categoryUpdates.map(update => ({
            ...update,
            category: analyticsService.determineCategory ? analyticsService.determineCategory(update) : 'General',
            contentType: analyticsService.determineContentType ? analyticsService.determineContentType(update) : 'Document',
            relevanceScore: relevanceService.calculateRelevanceScore(update, firmProfile),
            riskScore: analyticsService.calculateRiskScore(update, firmProfile)
        }));
        
        // Apply additional filters if requested
        let filteredUpdates = enhancedUpdates;
        
        if (relevanceFilter) {
            const minRelevance = parseInt(relevanceFilter);
            filteredUpdates = filteredUpdates.filter(update => update.relevanceScore >= minRelevance);
        }
        
        if (riskFilter) {
            const minRisk = parseInt(riskFilter);
            filteredUpdates = filteredUpdates.filter(update => update.riskScore >= minRisk);
        }
        
        // Sort by relevance score descending, then by date
        filteredUpdates.sort((a, b) => {
            if (b.relevanceScore !== a.relevanceScore) {
                return b.relevanceScore - a.relevanceScore;
            }
            return new Date(b.fetchedDate) - new Date(a.fetchedDate);
        });
        
        // Limit results
        const limitedUpdates = filteredUpdates.slice(0, parseInt(limit));
        
        // Get category analytics
        const categoryAnalytics = await analyticsService.getCategoryHotspots(firmProfile).catch(() => null);
        const categoryInsights = categoryAnalytics?.categoryHotspots?.find(h => 
            h.category.toLowerCase() === category.toLowerCase()
        );
        
        res.json({
            success: true,
            category: category,
            total: limitedUpdates.length,
            totalAvailable: filteredUpdates.length,
            updates: limitedUpdates,
            categoryInsights: categoryInsights || {
                activityLevel: 'unknown',
                trendDirection: 'stable',
                riskLevel: 'low'
            },
            metadata: {
                filtered: true,
                relevanceCalculated: !!firmProfile,
                riskScoresIncluded: true,
                sortedBy: 'relevance_then_date',
                appliedFilters: {
                    category: category,
                    relevanceFilter: relevanceFilter || null,
                    riskFilter: riskFilter || null
                }
            }
        });
        
    } catch (error) {
        console.error('Error filtering by category:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// NEW: Filter updates by content type
router.get('/updates/content-type/:type', async (req, res) => {
    try {
        const contentType = decodeURIComponent(req.params.type);
        const { limit = 50, authority, sector } = req.query;
        
        console.log(`📄 Filtering updates by content type: ${contentType}`);
        
        const allUpdates = await dbService.getAllUpdates();
        const firmProfile = await dbService.getFirmProfile();
        
        // Filter updates by content type
        const contentTypeUpdates = allUpdates.filter(update => {
            const updateContentType = analyticsService.determineContentType ? 
                analyticsService.determineContentType(update) : 
                update.contentType || 'Document';
            
            return updateContentType.toLowerCase().includes(contentType.toLowerCase()) ||
                   contentType.toLowerCase() === 'document';
        });
        
        // Apply additional filters
        let filteredUpdates = contentTypeUpdates;
        
        if (authority) {
            filteredUpdates = filteredUpdates.filter(update => 
                update.authority && update.authority.toLowerCase() === authority.toLowerCase()
            );
        }
        
        if (sector) {
            filteredUpdates = filteredUpdates.filter(update => {
                const updateSectors = update.primarySectors || [update.sector].filter(Boolean);
                return updateSectors.some(s => s.toLowerCase().includes(sector.toLowerCase()));
            });
        }
        
        // Enhance with analytics
        const enhancedUpdates = filteredUpdates.map(update => ({
            ...update,
            category: analyticsService.determineCategory ? analyticsService.determineCategory(update) : 'General',
            contentType: analyticsService.determineContentType ? analyticsService.determineContentType(update) : 'Document',
            relevanceScore: relevanceService.calculateRelevanceScore(update, firmProfile),
            riskScore: analyticsService.calculateRiskScore(update, firmProfile)
        }));
        
        // Sort by date descending
        enhancedUpdates.sort((a, b) => new Date(b.fetchedDate) - new Date(a.fetchedDate));
        
        // Limit results
        const limitedUpdates = enhancedUpdates.slice(0, parseInt(limit));
        
        // Get content type distribution analytics
        const contentDistribution = await analyticsService.getContentTypeDistribution().catch(() => null);
        const contentTypeStats = contentDistribution?.contentTypes?.distribution?.[contentType];
        
        res.json({
            success: true,
            contentType: contentType,
            total: limitedUpdates.length,
            totalAvailable: enhancedUpdates.length,
            updates: limitedUpdates,
            contentTypeStats: contentTypeStats || {
                count: limitedUpdates.length,
                percentage: 0,
                trend: 'stable'
            },
            metadata: {
                filtered: true,
                sortedBy: 'date_descending',
                appliedFilters: {
                    contentType: contentType,
                    authority: authority || null,
                    sector: sector || null
                }
            }
        });
        
    } catch (error) {
        console.error('Error filtering by content type:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// NEW: Filter updates by source type
router.get('/updates/source-type/:source', async (req, res) => {
    try {
        const sourceType = decodeURIComponent(req.params.source);
        const { limit = 50, timeframe = 30, includeTrending = false } = req.query;
        
        console.log(`🔗 Filtering updates by source type: ${sourceType}`);
        
        const allUpdates = await dbService.getAllUpdates();
        const firmProfile = await dbService.getFirmProfile();
        
        // Filter by timeframe if specified
        const timeframeDays = parseInt(timeframe);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - timeframeDays);
        
        const timeFilteredUpdates = allUpdates.filter(update => 
            new Date(update.fetchedDate) >= cutoffDate
        );
        
        // Filter updates by source type
        const sourceTypeUpdates = timeFilteredUpdates.filter(update => {
            const updateSourceType = update.sourceType || 
                (update.sourceName ? 'RSS Feed' : 'Web Scraping') ||
                'Unknown';
            
            return updateSourceType.toLowerCase().includes(sourceType.toLowerCase()) ||
                   sourceType.toLowerCase() === 'official release';
        });
        
        // Enhance with analytics
        const enhancedUpdates = sourceTypeUpdates.map(update => ({
            ...update,
            category: analyticsService.determineCategory ? analyticsService.determineCategory(update) : 'General',
            contentType: analyticsService.determineContentType ? analyticsService.determineContentType(update) : 'Document',
            sourceType: update.sourceType || (update.sourceName ? 'RSS Feed' : 'Web Scraping'),
            relevanceScore: relevanceService.calculateRelevanceScore(update, firmProfile),
            riskScore: analyticsService.calculateRiskScore(update, firmProfile)
        }));
        
        // Sort by relevance and recency
        enhancedUpdates.sort((a, b) => {
            // Primary sort by risk score (high risk first)
            if (b.riskScore !== a.riskScore) {
                return b.riskScore - a.riskScore;
            }
            // Secondary sort by date
            return new Date(b.fetchedDate) - new Date(a.fetchedDate);
        });
        
        // Limit results
        const limitedUpdates = enhancedUpdates.slice(0, parseInt(limit));
        
        // Get source trending analytics if requested
        let sourceTrending = null;
        if (includeTrending === 'true') {
            sourceTrending = await analyticsService.getSourceTypeTrending().catch(() => null);
        }
        
        res.json({
            success: true,
            sourceType: sourceType,
            timeframe: `${timeframeDays} days`,
            total: limitedUpdates.length,
            totalAvailable: enhancedUpdates.length,
            updates: limitedUpdates,
            sourceTrending: sourceTrending?.sourceTrends?.[sourceType] || null,
            metadata: {
                filtered: true,
                timeframeApplied: timeframeDays,
                sortedBy: 'risk_then_date',
                includeTrending: includeTrending === 'true',
                appliedFilters: {
                    sourceType: sourceType,
                    timeframe: timeframeDays
                }
            }
        });
        
    } catch (error) {
        console.error('Error filtering by source type:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ====== ENHANCED SEARCH WITH NEW FILTER SUPPORT ======

// Enhanced search endpoint with category, content-type, and source-type filters
router.get('/search', async (req, res) => {
    try {
        const { 
            q, 
            authority, 
            sector, 
            impact, 
            urgency, 
            category,           // NEW
            contentType,        // NEW
            sourceType,         // NEW
            limit = 50,
            sortBy = 'relevance'
        } = req.query;
        
        console.log('🔍 Enhanced search with new filters:', req.query);
        
        const filterParams = {
            keywords: q ? q.split(',').map(k => k.trim()) : [],
            authorities: authority ? [authority] : [],
            sectors: sector ? [sector] : [],
            impactLevels: impact ? [impact] : [],
            urgency: urgency ? [urgency] : [],
            // NEW filter parameters
            categories: category ? [category] : [],
            contentTypes: contentType ? [contentType] : [],
            sourceTypes: sourceType ? [sourceType] : []
        };
        
        // Use workspace service for base search
        const baseSearchResults = await workspaceService.executeSearch(filterParams);
        
        // Apply additional filters for new parameters
        let filteredResults = baseSearchResults.results;
        
        // Filter by category
        if (category) {
            filteredResults = filteredResults.filter(update => {
                const updateCategory = analyticsService.determineCategory ? 
                    analyticsService.determineCategory(update) : 'General';
                return updateCategory.toLowerCase().includes(category.toLowerCase());
            });
        }
        
        // Filter by content type
        if (contentType) {
            filteredResults = filteredResults.filter(update => {
                const updateContentType = analyticsService.determineContentType ? 
                    analyticsService.determineContentType(update) : 'Document';
                return updateContentType.toLowerCase().includes(contentType.toLowerCase());
            });
        }
        
        // Filter by source type
        if (sourceType) {
            filteredResults = filteredResults.filter(update => {
                const updateSourceType = update.sourceType || 
                    (update.sourceName ? 'RSS Feed' : 'Web Scraping');
                return updateSourceType.toLowerCase().includes(sourceType.toLowerCase());
            });
        }
        
        // Enhance results with analytics
        const enhancedResults = filteredResults.map(update => ({
            ...update,
            category: analyticsService.determineCategory ? analyticsService.determineCategory(update) : 'General',
            contentType: analyticsService.determineContentType ? analyticsService.determineContentType(update) : 'Document',
            sourceType: update.sourceType || (update.sourceName ? 'RSS Feed' : 'Web Scraping'),
            relevanceScore: update.relevanceScore || relevanceService.calculateRelevanceScore(update, null),
            riskScore: analyticsService.calculateRiskScore(update, null)
        }));
        
        // Sort results based on sortBy parameter
        if (sortBy === 'relevance') {
            enhancedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
        } else if (sortBy === 'risk') {
            enhancedResults.sort((a, b) => b.riskScore - a.riskScore);
        } else if (sortBy === 'date') {
            enhancedResults.sort((a, b) => new Date(b.fetchedDate) - new Date(a.fetchedDate));
        }
        
        // Limit results
        const limitedResults = enhancedResults.slice(0, parseInt(limit));
        
        // Generate search insights
        const searchInsights = {
            categoryDistribution: {},
            contentTypeDistribution: {},
            sourceTypeDistribution: {},
            averageRelevance: 0,
            averageRisk: 0
        };
        
        limitedResults.forEach(update => {
            // Category distribution
            const cat = update.category;
            searchInsights.categoryDistribution[cat] = (searchInsights.categoryDistribution[cat] || 0) + 1;
            
            // Content type distribution
            const content = update.contentType;
            searchInsights.contentTypeDistribution[content] = (searchInsights.contentTypeDistribution[content] || 0) + 1;
            
            // Source type distribution
            const source = update.sourceType;
            searchInsights.sourceTypeDistribution[source] = (searchInsights.sourceTypeDistribution[source] || 0) + 1;
            
            // Average scores
            searchInsights.averageRelevance += update.relevanceScore;
            searchInsights.averageRisk += update.riskScore;
        });
        
        if (limitedResults.length > 0) {
            searchInsights.averageRelevance = Math.round(searchInsights.averageRelevance / limitedResults.length);
            searchInsights.averageRisk = Math.round(searchInsights.averageRisk / limitedResults.length);
        }
        
        res.json({
            success: true,
            total: limitedResults.length,
            totalAvailable: enhancedResults.length,
            results: limitedResults,
            searchInsights: searchInsights,
            query: req.query,
            metadata: {
                enhancedSearch: true,
                newFiltersSupported: ['category', 'contentType', 'sourceType'],
                categoryInsights: true,
                contentTypeAnalysis: true,
                sourceTypeAnalysis: true,
                sortedBy: sortBy,
                appliedFilters: filterParams
            }
        });
        
    } catch (error) {
        console.error('Error in enhanced search:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ====== ENHANCED ANALYTICS ENDPOINTS (EXISTING + NEW) ======

// Enhanced Analytics Dashboard with Category-Based Analytics
router.get('/analytics/dashboard', async (req, res) => {
    try {
        console.log('📊 Getting enhanced analytics dashboard with category insights...');
        
        const firmProfile = await dbService.getFirmProfile();
        const dashboard = await analyticsService.getAnalyticsDashboard(firmProfile);
        
        res.json({
            success: true,
            dashboard: dashboard,
            metadata: {
                calculatedAt: dashboard.calculatedAt,
                firmProfile: !!firmProfile,
                dataPoints: dashboard.overview.totalUpdates,
                analyticsVersion: '2.0',
                cacheTimeout: '30 minutes',
                features: [
                    'Category hotspot analysis',
                    'Content type distribution',
                    'Source trending analysis',
                    '90-day pattern analysis',
                    'Enhanced risk scoring'
                ]
            }
        });
        
    } catch (error) {
        console.error('Error getting enhanced analytics dashboard:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            dashboard: {
                overview: {
                    totalUpdates: 0,
                    averageRiskScore: 0,
                    categoryHotspots: 0,
                    highRiskCount: 0,
                    mediumRiskCount: 0,
                    lowRiskCount: 0
                },
                velocity: {},
                categoryVelocity: {},
                hotspots: [],
                categoryHotspots: [],
                predictions: [],
                calendar: { next30Days: [] },
                contentDistribution: { contentTypes: {}, sourceTypes: {} },
                sourceTrending: { sourceTrends: {} },
                firmProfile: null
            }
        });
    }
});

// NEW: Category Hotspots Analysis Endpoint
router.get('/analytics/category-hotspots', async (req, res) => {
    try {
        console.log('🔥 Getting category hotspots with 90-day pattern analysis...');
        
        const firmProfile = await dbService.getFirmProfile();
        const categoryHotspots = await analyticsService.getCategoryHotspots(firmProfile);
        
        res.json({
            success: true,
            categoryHotspots: categoryHotspots,
            metadata: {
                analysisWindow: '90 days',
                hotspotThreshold: '20% activity increase',
                calculatedAt: categoryHotspots.calculatedAt,
                firmProfile: !!firmProfile
            }
        });
        
    } catch (error) {
        console.error('Error getting category hotspots:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// NEW: Content Type Distribution Analysis Endpoint
router.get('/analytics/content-distribution', async (req, res) => {
    try {
        console.log('📊 Getting content type distribution analytics...');
        
        const contentDistribution = await analyticsService.getContentTypeDistribution();
        
        res.json({
            success: true,
            contentDistribution: contentDistribution,
            metadata: {
                analysisType: 'Document classification and source analysis',
                calculatedAt: contentDistribution.calculatedAt
            }
        });
        
    } catch (error) {
        console.error('Error getting content distribution:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// NEW: Source Type Trending Analysis Endpoint
router.get('/analytics/source-trending', async (req, res) => {
    try {
        console.log('📈 Getting source type trending analysis...');
        
        const sourceTrending = await analyticsService.getSourceTypeTrending();
        
        res.json({
            success: true,
            sourceTrending: sourceTrending,
            metadata: {
                analysisWindow: '90 days',
                timeResolution: 'Weekly windows',
                calculatedAt: sourceTrending.calculatedAt
            }
        });
        
    } catch (error) {
        console.error('Error getting source trending:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Enhanced Velocity Analysis with Category Velocity
router.get('/analytics/velocity', async (req, res) => {
    try {
        const timeframe = parseInt(req.query.days) || 30;
        const velocity = await analyticsService.getRegulatoryVelocity(timeframe);
        
        res.json({
            success: true,
            velocity: velocity,
            metadata: {
                timeframe: `${timeframe} days`,
                enhancedFeatures: [
                    'Authority velocity analysis',
                    'Category velocity tracking',
                    'Trend strength assessment',
                    'Predictive forecasting'
                ]
            }
        });
        
    } catch (error) {
        console.error('Error getting enhanced velocity analysis:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Enhanced Sector Hotspots (existing, maintained for compatibility)
router.get('/analytics/hotspots', async (req, res) => {
    try {
        const firmProfile = await dbService.getFirmProfile();
        const hotspots = await analyticsService.getSectorHotspots(firmProfile);
        
        res.json({
            success: true,
            hotspots: hotspots,
            metadata: {
                analysisType: 'Traditional sector-based hotspots',
                firmProfile: !!firmProfile
            }
        });
        
    } catch (error) {
        console.error('Error getting sector hotspots:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Enhanced Predictions with Category Insights
router.get('/analytics/predictions', async (req, res) => {
    try {
        const firmProfile = await dbService.getFirmProfile();
        const predictions = await analyticsService.getImpactPredictions(firmProfile);
        
        res.json({
            success: true,
            predictions: predictions,
            metadata: {
                enhancedMethodology: [
                    'Keyword frequency analysis',
                    'Authority pattern recognition',
                    'Category trend analysis',
                    'Historical timing patterns',
                    'Sector activity correlation'
                ],
                firmProfile: !!firmProfile
            }
        });
        
    } catch (error) {
        console.error('Error getting enhanced predictions:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Enhanced Compliance Calendar with Categories
router.get('/analytics/calendar', async (req, res) => {
    try {
        const firmProfile = await dbService.getFirmProfile();
        const calendar = await analyticsService.getComplianceCalendar(firmProfile);
        
        res.json({
            success: true,
            calendar: calendar,
            metadata: {
                enhancedFeatures: [
                    'Category-based deadline classification',
                    'Risk-weighted prioritization',
                    'Preparation time estimates'
                ],
                firmProfile: !!firmProfile
            }
        });
        
    } catch (error) {
        console.error('Error getting enhanced compliance calendar:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// NEW: Analytics Summary Endpoint (Quick Overview)
router.get('/analytics/summary', async (req, res) => {
    try {
        console.log('📊 Getting analytics summary with category insights...');
        
        const firmProfile = await dbService.getFirmProfile();
        
        // Get key metrics efficiently
        const [velocity, categoryHotspots, contentDistribution] = await Promise.all([
            analyticsService.getRegulatoryVelocity(30),
            analyticsService.getCategoryHotspots(firmProfile),
            analyticsService.getContentTypeDistribution()
        ]);
        
        const summary = {
            calculatedAt: new Date().toISOString(),
            overview: {
                regulatoryVelocity: velocity.summary.totalUpdatesPerWeek,
                categoryHotspots: categoryHotspots.summary.totalHotspots,
                extremeHotspots: categoryHotspots.summary.extremeHotspots,
                contentDiversity: Object.keys(contentDistribution.contentTypes.distribution).length,
                sourceReliability: contentDistribution.insights.length > 0 ? 'analyzed' : 'pending'
            },
            topInsights: [
                ...velocity.summary.authoritiesIncreasing > 0 ? 
                    [`${velocity.summary.authoritiesIncreasing} authorities showing increased activity`] : [],
                ...categoryHotspots.summary.extremeHotspots > 0 ? 
                    [`${categoryHotspots.summary.extremeHotspots} categories with extreme activity spikes`] : [],
                ...categoryHotspots.summary.userRelevantHotspots > 0 ? 
                    [`${categoryHotspots.summary.userRelevantHotspots} hotspots relevant to your firm`] : [],
                ...contentDistribution.insights.slice(0, 2)
            ].slice(0, 4),
            firmProfile: !!firmProfile
        };
        
        res.json({
            success: true,
            summary: summary
        });
        
    } catch (error) {
        console.error('Error getting analytics summary:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Enhanced Analytics Refresh with Category Cache Management
router.post('/analytics/refresh', async (req, res) => {
    try {
        console.log('🔄 Refreshing enhanced analytics with category cache clear...');
        
        // Clear enhanced cache (30 minutes timeout)
        analyticsService.clearCache();
        
        const firmProfile = await dbService.getFirmProfile();
        
        // Pre-warm cache with new analytics
        const [dashboard, categoryHotspots, contentDistribution, sourceTrending] = await Promise.all([
            analyticsService.getAnalyticsDashboard(firmProfile),
            analyticsService.getCategoryHotspots(firmProfile),
            analyticsService.getContentTypeDistribution(),
            analyticsService.getSourceTypeTrending()
        ]);
        
        res.json({
            success: true,
            message: 'Enhanced analytics refreshed successfully',
            refreshedComponents: [
                'Regulatory velocity with categories',
                'Category hotspot analysis',
                'Content type distribution',
                'Source trending analysis',
                'Enhanced risk metrics',
                'Predictive models'
            ],
            dashboard: dashboard,
            cacheStatus: 'pre-warmed',
            cacheTimeout: '30 minutes'
        });
        
    } catch (error) {
        console.error('Error refreshing enhanced analytics:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ====== FIRM PROFILE MANAGEMENT (MAINTAINED) ======

router.get('/firm-profile', async (req, res) => {
    try {
        console.log('📋 Getting firm profile...');
        
        const availableSectors = [
            'Banking', 'Investment Management', 'Consumer Credit', 
            'Insurance', 'Payments', 'Pensions', 'Mortgages', 
            'Capital Markets', 'Cryptocurrency', 'Fintech', 'General'
        ];
        
        const profile = await dbService.getFirmProfile();
        
        res.json({
            success: true,
            profile: profile,
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
        const savedProfile = await dbService.saveFirmProfile({
            firmName,
            firmSize,
            primarySectors
        });
        
        // Clear analytics cache to trigger recalculation with new profile
        analyticsService.clearCache();
        relevanceService.invalidateProfileCache();
        
        // Recalculate relevance scores
        const relevanceRecalc = await relevanceService.recalculateAllRelevanceScores();
        
        console.log('✅ Firm profile saved with analytics refresh');
        
        res.json({
            success: true,
            profile: savedProfile,
            relevanceUpdated: relevanceRecalc.updatedCount || 0,
            analyticsRefreshed: true
        });
        
    } catch (error) {
        console.error('Error saving firm profile:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.delete('/firm-profile', async (req, res) => {
    try {
        console.log('🗑️ Clearing firm profile...');
        
        // Clear profile
        await dbService.saveFirmProfile(null);
        
        // Clear caches
        analyticsService.clearCache();
        relevanceService.invalidateProfileCache();
        
        console.log('✅ Firm profile cleared with analytics refresh');
        
        res.json({
            success: true,
            message: 'Firm profile cleared successfully',
            analyticsRefreshed: true
        });
        
    } catch (error) {
        console.error('Error clearing firm profile:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ====== WORKSPACE MANAGEMENT (MAINTAINED) ======

router.get('/workspace/stats', async (req, res) => {
    try {
        const stats = await workspaceService.getWorkspaceStats();
        res.json({
            success: true,
            stats: stats.stats
        });
    } catch (error) {
        console.error('Error getting workspace stats:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/workspace/pinned', async (req, res) => {
    try {
        const pinnedItems = await workspaceService.getPinnedItems();
        res.json({
            success: true,
            items: pinnedItems.items
        });
    } catch (error) {
        console.error('Error getting pinned items:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.post('/workspace/pin', async (req, res) => {
    try {
        const { updateUrl, updateTitle, updateAuthority } = req.body;
        const result = await workspaceService.pinItem(updateUrl, updateTitle, updateAuthority);
        res.json(result);
    } catch (error) {
        console.error('Error pinning item:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.delete('/workspace/pin/:url', async (req, res) => {
    try {
        const updateUrl = decodeURIComponent(req.params.url);
        const result = await workspaceService.unpinItem(updateUrl);
        res.json(result);
    } catch (error) {
        console.error('Error unpinning item:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.post('/alerts/create', async (req, res) => {
    try {
        const { name, keywords, authorities, isActive } = req.body;
        
        const conditions = {
            keywords: keywords || [],
            authorities: authorities || ['FCA', 'BoE', 'PRA'],
            isActive: isActive !== false
        };
        
        const result = await workspaceService.createAlert(name, conditions);
        res.json(result);
    } catch (error) {
        console.error('Error creating alert:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/alerts/active', async (req, res) => {
    try {
        const alerts = await workspaceService.getActiveAlerts();
        res.json(alerts);
    } catch (error) {
        console.error('Error getting active alerts:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ====== ENHANCED EXPORT WITH CATEGORY ANALYTICS ======

router.get('/export/data', async (req, res) => {
    try {
        console.log('📊 Exporting complete system data with enhanced analytics...');
        
        // Get all data including enhanced analytics
        const [updates, firmProfile, workspaceData, analyticsData, categoryHotspots, contentDistribution] = await Promise.all([
            dbService.getAllUpdates(),
            dbService.getFirmProfile(),
            workspaceService.exportWorkspaceData(),
            analyticsService.getAnalyticsDashboard().catch(() => null),
            analyticsService.getCategoryHotspots().catch(() => null),
            analyticsService.getContentTypeDistribution().catch(() => null)
        ]);
        
        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                totalUpdates: updates.length,
                exportVersion: '2.0',
                analyticsVersion: 'Enhanced with Categories',
                systemInfo: {
                    nodeVersion: process.version,
                    platform: process.platform
                }
            },
            firmProfile: firmProfile,
            updates: updates,
            workspace: workspaceData?.exportData?.data || {},
            analytics: analyticsData ? {
                overview: analyticsData.overview,
                velocity: analyticsData.velocity,
                categoryVelocity: analyticsData.categoryVelocity,
                predictions: analyticsData.predictions,
                hotspots: analyticsData.hotspots,
                categoryHotspots: analyticsData.categoryHotspots,
                contentDistribution: analyticsData.contentDistribution,
                sourceTrending: analyticsData.sourceTrending
            } : null,
            enhancedAnalytics: {
                categoryHotspots: categoryHotspots,
                contentDistribution: contentDistribution
            },
            summary: {
                totalUpdates: updates.length,
                firmConfigured: !!firmProfile,
                workspaceItems: workspaceData?.exportData?.summary || {},
                analyticsAvailable: !!analyticsData,
                enhancedAnalyticsAvailable: !!(categoryHotspots && contentDistribution)
            }
        };
        
        console.log('✅ Enhanced data export with category analytics prepared');
        
        res.json(exportData);
        
    } catch (error) {
        console.error('Error exporting enhanced data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ====== ENHANCED UPDATES WITH CATEGORY INSIGHTS ======

router.get('/updates', async (req, res) => {
    try {
        console.log('📰 Getting updates with enhanced relevance and category insights...');
        
        const updates = await dbService.getAllUpdates();
        const firmProfile = await dbService.getFirmProfile();
        
        // Enhanced categorization with category insights
        const categorizedUpdates = relevanceService.categorizeByRelevance(updates, firmProfile);
        
        // Add enhanced analytics to each update
        const enhancedUpdates = {
            urgent: categorizedUpdates.high.map(update => ({
                ...update,
                riskScore: analyticsService.calculateRiskScore(update, firmProfile),
                category: analyticsService.determineCategory ? analyticsService.determineCategory(update) : 'General',
                contentType: analyticsService.determineContentType ? analyticsService.determineContentType(update) : 'Document'
            })),
            moderate: categorizedUpdates.medium.map(update => ({
                ...update,
                riskScore: analyticsService.calculateRiskScore(update, firmProfile),
                category: analyticsService.determineCategory ? analyticsService.determineCategory(update) : 'General',
                contentType: analyticsService.determineContentType ? analyticsService.determineContentType(update) : 'Document'
            })),
            informational: categorizedUpdates.low.map(update => ({
                ...update,
                riskScore: analyticsService.calculateRiskScore(update, firmProfile),
                category: analyticsService.determineCategory ? analyticsService.determineCategory(update) : 'General',
                contentType: analyticsService.determineContentType ? analyticsService.determineContentType(update) : 'Document'
            }))
        };
        
        res.json({
            success: true,
            total: updates.length,
            urgent: enhancedUpdates.urgent,
            moderate: enhancedUpdates.moderate,
            informational: enhancedUpdates.informational,
            firmProfile: firmProfile,
            metadata: {
                relevanceCalculated: !!firmProfile,
                riskScoresIncluded: true,
                categorization: 'enhanced relevance-based with categories',
                categoryInsights: true,
                contentTypeAnalysis: true,
                newFilteringEndpoints: [
                    '/api/updates/category/:category',
                    '/api/updates/content-type/:type',
                    '/api/updates/source-type/:source'
                ]
            }
        });
        
    } catch (error) {
        console.error('Error getting enhanced updates:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ====== ENHANCED REFRESH WITH ANALYTICS INTEGRATION ======

router.post('/refresh', async (req, res) => {
    try {
        console.log('🔄 Starting comprehensive data refresh with enhanced analytics...');
        
        const startTime = Date.now();
        
        // Fetch new data
        const result = await fetchAll();
        
        // Clear analytics cache to trigger recalculation
        analyticsService.clearCache();
        
        // Recalculate relevance if firm profile exists
        const firmProfile = await dbService.getFirmProfile();
        let relevanceUpdated = 0;
        
        if (firmProfile) {
            const relevanceRecalc = await relevanceService.recalculateAllRelevanceScores();
            relevanceUpdated = relevanceRecalc.updatedCount;
        }
        
        // Pre-warm enhanced analytics cache
        const enhancedAnalytics = await Promise.all([
            analyticsService.getCategoryHotspots(firmProfile).catch(() => null),
            analyticsService.getContentTypeDistribution().catch(() => null),
            analyticsService.getSourceTypeTrending().catch(() => null)
        ]);
        
        const endTime = Date.now();
        
        console.log('✅ Enhanced comprehensive data refresh completed:', result);
        
        res.json({
            success: true,
            newArticles: result.totalProcessed || 0,
            timeElapsed: endTime - startTime,
            relevanceUpdated: relevanceUpdated,
            analyticsRefreshed: true,
            enhancedAnalytics: {
                categoryHotspots: !!enhancedAnalytics[0],
                contentDistribution: !!enhancedAnalytics[1],
                sourceTrending: !!enhancedAnalytics[2]
            },
            sources: {
                rss: result.rssCount || 0,
                scraped: result.scrapeCount || 0
            }
        });
        
    } catch (error) {
        console.error('Error refreshing enhanced data:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            newArticles: 0
        });
    }
});

// ====== ENHANCED SYSTEM STATUS WITH ANALYTICS HEALTH ======

router.get('/system-status', async (req, res) => {
    try {
        console.log('🔧 Checking comprehensive system status with enhanced analytics...');
        
        let dbStatus = 'disconnected';
        let updateCount = 0;
        
        try {
            await dbService.initialize();
            updateCount = await dbService.getUpdateCount();
            dbStatus = 'connected';
        } catch (error) {
            console.error('Database check failed:', error);
        }
        
        // Check enhanced analytics services
        let analyticsStatus = 'unknown';
        let analyticsHealth = {};
        try {
            const [dashboard, categoryHotspots, contentDist] = await Promise.all([
                analyticsService.getAnalyticsDashboard().catch(() => null),
                analyticsService.getCategoryHotspots().catch(() => null),
                analyticsService.getContentTypeDistribution().catch(() => null)
            ]);
            
            analyticsHealth = {
                dashboard: !!dashboard,
                categoryHotspots: !!categoryHotspots,
                contentDistribution: !!contentDist,
                cacheActive: true
            };
            
            analyticsStatus = (dashboard && categoryHotspots && contentDist) ? 'operational' : 'partial';
        } catch (error) {
            analyticsStatus = 'error';
        }
        
        // Check workspace service
        let workspaceStatus = 'unknown';
        let workspaceData = null;
        try {
            workspaceData = await workspaceService.getWorkspaceStats();
            workspaceStatus = 'operational';
        } catch (error) {
            workspaceStatus = 'error';
        }
        
        // Check relevance service
        let relevanceStatus = 'unknown';
        try {
            await relevanceService.getRelevanceStats();
            relevanceStatus = 'operational';
        } catch (error) {
            relevanceStatus = 'error';
        }
        
        const status = {
            success: true,
            timestamp: new Date().toISOString(),
            database: dbStatus,
            environment: {
                hasGroqKey: !!process.env.GROQ_API_KEY,
                hasDatabaseUrl: !!process.env.DATABASE_URL,
                nodeVersion: process.version,
                platform: process.platform,
                memoryUsage: process.memoryUsage()
            },
            services: {
                analytics: analyticsStatus,
                workspace: workspaceStatus,
                relevance: relevanceStatus
            },
            enhancedAnalytics: {
                status: analyticsStatus,
                health: analyticsHealth,
                cacheTimeout: '30 minutes',
                features: [
                    'Category hotspot analysis',
                    'Content type distribution',
                    'Source trending analysis',
                    '90-day pattern analysis'
                ]
            },
            newFilteringEndpoints: {
                available: [
                    '/api/updates/category/:category',
                    '/api/updates/content-type/:type',
                    '/api/updates/source-type/:source'
                ],
                enhancedSearch: '/api/search (with category, contentType, sourceType filters)'
            },
            data: {
                updateCount,
                lastChecked: new Date().toISOString()
            },
            workspace: workspaceData?.stats || {
                pinnedItems: 0,
                savedSearches: 0,
                activeAlerts: 0
            },
            health: {
                overall: dbStatus === 'connected' && analyticsStatus === 'operational' && workspaceStatus === 'operational',
                components: {
                    database: dbStatus === 'connected',
                    analytics: analyticsStatus === 'operational',
                    enhancedAnalytics: analyticsStatus === 'operational',
                    workspace: workspaceStatus === 'operational',
                    ai: !!process.env.GROQ_API_KEY
                }
            }
        };
        
        res.json(status);
        
    } catch (error) {
        console.error('Error checking enhanced system status:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ====== RELEVANCE ENDPOINTS (MAINTAINED) ======

router.get('/relevance/stats', async (req, res) => {
    try {
        const stats = await relevanceService.getRelevanceStats();
        res.json({
            success: true,
            relevanceStats: stats
        });
    } catch (error) {
        console.error('Error getting relevance stats:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/relevance/sector/:sector', async (req, res) => {
    try {
        const sector = req.params.sector;
        const insights = await relevanceService.getSectorRelevanceInsights(sector);
        res.json({
            success: true,
            sectorInsights: insights
        });
    } catch (error) {
        console.error('Error getting sector relevance insights:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ====== SAVED SEARCHES MANAGEMENT (MAINTAINED) ======

router.get('/workspace/searches', async (req, res) => {
    try {
        const searches = await workspaceService.getSavedSearches();
        res.json(searches);
    } catch (error) {
        console.error('Error getting saved searches:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.post('/workspace/search', async (req, res) => {
    try {
        const { searchName, filterParams } = req.body;
        const result = await workspaceService.saveSearch(searchName, filterParams);
        res.json(result);
    } catch (error) {
        console.error('Error saving search:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.delete('/workspace/search/:id', async (req, res) => {
    try {
        const searchId = req.params.id;
        const result = await workspaceService.deleteSearch(searchId);
        res.json(result);
    } catch (error) {
        console.error('Error deleting search:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ====== HEALTH CHECK (ENHANCED) ======

router.get('/health', async (req, res) => {
    try {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: '2.0.0',
            analyticsVersion: 'Enhanced with Categories',
            newEndpoints: [
                '/api/updates/category/:category',
                '/api/updates/content-type/:type', 
                '/api/updates/source-type/:source',
                '/api/search (enhanced with new filters)'
            ],
            features: [
                'Category-based analytics',
                '30-minute caching',
                '90-day pattern analysis',
                'Content type distribution',
                'Source trending analysis',
                'Enhanced filtering endpoints'
            ]
        };
        
        res.json(health);
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

// ====== ERROR HANDLING MIDDLEWARE ======

router.use((error, req, res, next) => {
    console.error('Enhanced API Error:', error);
    
    res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        path: req.path,
        analyticsVersion: 'Enhanced with Categories'
    });
});

module.exports = router;