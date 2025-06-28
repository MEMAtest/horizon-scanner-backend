// src/routes/apiRoutes.js
// Fixed import paths to match actual filenames

const express = require('express');
const router = express.Router();

// Import services with correct paths
const rssFetcher = require('../services/rssFetcher'); // FIXED: matches actual filename
const aiAnalyzer = require('../services/aiAnalyzer'); // FIXED: was '../services/ai-analyzer'

// Lazy load database service to prevent cold start issues
let dbService = null;
const getDbService = async () => {
    if (!dbService) {
        try {
            dbService = require('../services/dbService');
            await dbService.initialize();
        } catch (error) {
            console.warn('Database service not available, using fallback');
            dbService = require('../services/fileDbService');
        }
    }
    return dbService;
};

// GET /api/updates - Retrieve all regulatory updates
router.get('/updates', async (req, res) => {
    try {
        console.log('API updates endpoint called');
        
        const db = await getDbService();
        const updates = await db.getAllUpdates();
        
        console.log('Retrieved updates from database, count:', updates.length);
        
        // Group by sector
        const groupedData = {};
        updates.forEach(item => {
            const sector = item.sector || "General";
            if (!groupedData[sector]) {
                groupedData[sector] = [];
            }
            groupedData[sector].push(item);
        });
        
        // Provide default content if empty
        if (Object.keys(groupedData).length === 0) {
            groupedData.General = [{
                headline: "Welcome to Enhanced MEMA UK Reg Tracker",
                impact: "Your enhanced dashboard is ready with multi-select filtering, source freshness indicators, and modern design. Click 'Refresh Regulatory Data' to start fetching real regulatory updates from UK financial regulators with AI-powered analysis.",
                area: "System Setup",
                authority: "System",
                impactLevel: "Informational",
                urgency: "Low",
                sector: "General",
                keyDates: "None specified",
                url: "/test",
                fetchedDate: new Date().toISOString()
            }];
        }
        
        console.log('Grouped data prepared, sectors:', Object.keys(groupedData));
        res.json(groupedData);
        
    } catch (error) {
        console.error('Error in /api/updates:', error);
        res.status(500).json({ 
            error: 'Internal server error in updates endpoint',
            details: error.message
        });
    }
});

// POST /api/refresh - Trigger data collection and analysis
router.post('/refresh', async (req, res) => {
    try {
        console.log('=====================================');
        console.log('Enhanced refresh endpoint called at:', new Date().toISOString());
        
        // Environment variable checks
        if (!process.env.GROQ_API_KEY) {
            console.warn('GROQ_API_KEY not set');
            return res.status(400).json({ 
                error: 'GROQ_API_KEY environment variable not set. Please add it in deployment settings.' 
            });
        }
        
        console.log('✅ Environment variables present');
        
        // Initialize database
        const db = await getDbService();
        const initialUpdates = await db.getAllUpdates();
        console.log('📊 Initial update count:', initialUpdates.length);
        
        console.log('🔄 Starting enhanced RSS feed analysis...');
        await rssFetcher.fetchAndAnalyzeFeeds();
        
        console.log('🔄 Starting enhanced website scraping...');
        await rssFetcher.scrapeAndAnalyzeWebsites();
        
        const finalUpdates = await db.getAllUpdates();
        const newCount = finalUpdates.length - initialUpdates.length;
        
        console.log('📊 Final update count:', finalUpdates.length);
        console.log('📈 New articles processed:', newCount);
        console.log('=====================================');
        
        res.json({ 
            message: 'Enhanced refresh successful',
            timestamp: new Date().toISOString(),
            initialCount: initialUpdates.length,
            totalUpdates: finalUpdates.length,
            newArticles: newCount,
            note: 'Data stored persistently with enhanced AI analysis and multi-authority support'
        });
        
    } catch (error) {
        console.error('❌ Error in enhanced refresh endpoint:', error);
        res.status(500).json({ 
            error: 'Enhanced refresh failed',
            details: error.message,
            suggestion: 'Check that all environment variables are set and database is accessible'
        });
    }
});

// GET /api/analytics - Analytics data for charts
router.get('/analytics', async (req, res) => {
    try {
        const db = await getDbService();
        const updates = await db.getAllUpdates();
        
        // Calculate analytics
        const analytics = {
            totalUpdates: updates.length,
            
            // By authority
            byAuthority: {},
            
            // By sector
            bySector: {},
            
            // By impact level
            byImpactLevel: {},
            
            // By urgency
            byUrgency: {},
            
            // Recent activity (last 7 days)
            recentActivity: [],
            
            // Freshness metrics
            sourceFreashness: {}
        };
        
        // Process each update
        updates.forEach(update => {
            // Count by authority
            const authority = update.authority || 'Unknown';
            analytics.byAuthority[authority] = (analytics.byAuthority[authority] || 0) + 1;
            
            // Count by sector
            const sector = update.sector || 'General';
            analytics.bySector[sector] = (analytics.bySector[sector] || 0) + 1;
            
            // Count by impact level
            const impact = update.impactLevel || 'Unknown';
            analytics.byImpactLevel[impact] = (analytics.byImpactLevel[impact] || 0) + 1;
            
            // Count by urgency
            const urgency = update.urgency || 'Unknown';
            analytics.byUrgency[urgency] = (analytics.byUrgency[urgency] || 0) + 1;
            
            // Check if recent (last 7 days)
            const fetchDate = new Date(update.fetchedDate);
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            if (fetchDate >= sevenDaysAgo) {
                analytics.recentActivity.push({
                    date: fetchDate.toISOString().split('T')[0],
                    authority: authority,
                    sector: sector,
                    headline: update.headline
                });
            }
            
            // Source freshness
            if (!analytics.sourceFreashness[authority] || fetchDate > new Date(analytics.sourceFreashness[authority])) {
                analytics.sourceFreashness[authority] = fetchDate.toISOString();
            }
        });
        
        res.json(analytics);
        
    } catch (error) {
        console.error('Error in /api/analytics:', error);
        res.status(500).json({ 
            error: 'Failed to generate analytics',
            details: error.message
        });
    }
});

// GET /api/search - Search functionality
router.get('/search', async (req, res) => {
    try {
        const { q, authority, sector, impactLevel, urgency, limit = 50 } = req.query;
        
        const db = await getDbService();
        let updates = await db.getAllUpdates();
        
        // Apply filters
        if (q) {
            const searchTerm = q.toLowerCase();
            updates = updates.filter(update => 
                (update.headline && update.headline.toLowerCase().includes(searchTerm)) ||
                (update.impact && update.impact.toLowerCase().includes(searchTerm)) ||
                (update.area && update.area.toLowerCase().includes(searchTerm))
            );
        }
        
        if (authority) {
            updates = updates.filter(update => update.authority === authority);
        }
        
        if (sector) {
            updates = updates.filter(update => update.sector === sector);
        }
        
        if (impactLevel) {
            updates = updates.filter(update => update.impactLevel === impactLevel);
        }
        
        if (urgency) {
            updates = updates.filter(update => update.urgency === urgency);
        }
        
        // Sort by date (newest first) and limit results
        updates = updates
            .sort((a, b) => new Date(b.fetchedDate) - new Date(a.fetchedDate))
            .slice(0, parseInt(limit));
        
        res.json({
            results: updates,
            total: updates.length,
            query: req.query
        });
        
    } catch (error) {
        console.error('Error in /api/search:', error);
        res.status(500).json({ 
            error: 'Search failed',
            details: error.message
        });
    }
});

// GET /api/export - Export data
router.get('/export', async (req, res) => {
    try {
        const { format = 'json', authority, sector } = req.query;
        
        const db = await getDbService();
        let updates = await db.getAllUpdates();
        
        // Apply filters
        if (authority) {
            updates = updates.filter(update => update.authority === authority);
        }
        
        if (sector) {
            updates = updates.filter(update => update.sector === sector);
        }
        
        if (format === 'csv') {
            // Convert to CSV
            const csvHeader = 'Headline,Impact,Area,Authority,Impact Level,Urgency,Sector,Key Dates,URL,Fetched Date\n';
            const csvData = updates.map(update => [
                `"${(update.headline || '').replace(/"/g, '""')}"`,
                `"${(update.impact || '').replace(/"/g, '""')}"`,
                `"${(update.area || '').replace(/"/g, '""')}"`,
                `"${(update.authority || '').replace(/"/g, '""')}"`,
                `"${(update.impactLevel || '').replace(/"/g, '""')}"`,
                `"${(update.urgency || '').replace(/"/g, '""')}"`,
                `"${(update.sector || '').replace(/"/g, '""')}"`,
                `"${(update.keyDates || '').replace(/"/g, '""')}"`,
                `"${(update.url || '').replace(/"/g, '""')}"`,
                `"${(update.fetchedDate || '').replace(/"/g, '""')}"`
            ].join(',')).join('\n');
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="regulatory-updates.csv"');
            res.send(csvHeader + csvData);
        } else {
            // JSON format
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename="regulatory-updates.json"');
            res.json({
                exportDate: new Date().toISOString(),
                totalRecords: updates.length,
                filters: { authority, sector },
                data: updates
            });
        }
        
    } catch (error) {
        console.error('Error in /api/export:', error);
        res.status(500).json({ 
            error: 'Export failed',
            details: error.message
        });
    }
});

// GET /api/health - Health check
router.get('/health', async (req, res) => {
    try {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '2.0',
            environment: process.env.NODE_ENV || 'production'
        };
        
        // Check database connectivity
        try {
            const db = await getDbService();
            await db.healthCheck();
            health.database = 'connected';
        } catch (error) {
            health.database = 'error';
            health.databaseError = error.message;
        }
        
        // Check AI service
        if (process.env.GROQ_API_KEY) {
            health.aiService = 'configured';
        } else {
            health.aiService = 'missing_api_key';
        }
        
        res.json(health);
        
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;