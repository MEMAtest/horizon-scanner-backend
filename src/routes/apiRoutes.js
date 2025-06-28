// src/routes/apiRoutes.js
// Refactored for stability. All modules are required at the top level.

const express = require('express');
const router = express.Router();

// --- Service Imports ---
// All service dependencies are loaded once, at the top.
// If any of these paths were wrong, the server would fail to start with a clear error.
const rssFetcher = require('../services/rssFetcher.js');
const aiAnalyzer = require('../services/aiAnalyzer.js');

// --- Database Initialization ---
// This logic now runs only ONCE when the app starts, not on every API call.
let dbService;
try {
    // Try to load the main PostgreSQL database service first.
    dbService = require('../services/dbService.js');
    console.log('✅ Using primary database service (dbService).');
} catch (error) {
    // If it fails (e.g., 'pg' module not found, or connection string issue), use the file-based fallback.
    console.warn('⚠️ Primary DB service failed, using fileDbService fallback. Error:', error.message);
    dbService = require('../services/fileDbService.js');
}

// Immediately initialize the chosen database service.
(async () => {
    try {
        if (dbService && typeof dbService.initialize === 'function') {
            await dbService.initialize();
            console.log(`✅ ${dbService.constructor.name} has been initialized.`);
        }
    } catch (initError) {
        console.error('❌ CRITICAL: Failed to initialize the database service.', initError);
        // This is a critical failure. The app will likely be non-functional.
    }
})();


// --- API Route Definitions ---

// GET /api/updates
router.get('/updates', async (req, res, next) => {
    try {
        const updates = await dbService.getAllUpdates();
        const groupedData = {};
        updates.forEach(item => {
            const sector = item.sector || "General";
            if (!groupedData[sector]) {
                groupedData[sector] = [];
            }
            groupedData[sector].push(item);
        });

        if (Object.keys(groupedData).length === 0) {
           // Your default "welcome" content can go here
        }
        res.json(groupedData);
    } catch (error) {
        // Pass any errors to the global error handler in index.js
        next(error);
    }
});

// POST /api/refresh
router.post('/refresh', async (req, res, next) => {
    try {
        if (!process.env.GROQ_API_KEY) {
            return res.status(400).json({ error: 'GROQ_API_KEY environment variable not set.' });
        }
        
        const initialUpdates = await dbService.getAllUpdates();
        
        console.log('🔄 Starting RSS feed analysis...');
        await rssFetcher.fetchAndAnalyzeFeeds();
        
        console.log('🔄 Starting website scraping...');
        await rssFetcher.scrapeAndAnalyzeWebsites();
        
        const finalUpdates = await dbService.getAllUpdates();
        const newCount = finalUpdates.length - initialUpdates.length;

        res.json({ message: 'Refresh successful', newArticles: newCount, totalUpdates: finalUpdates.length });
    } catch (error) {
        next(error);
    }
});

// GET /api/health
router.get('/health', async (req, res, next) => {
    try {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '2.0',
            environment: process.env.NODE_ENV || 'production'
        };

        const dbHealth = await dbService.healthCheck();
        health.database = dbHealth;

        health.aiService = process.env.GROQ_API_KEY ? 'configured' : 'missing_api_key';
        
        res.json(health);
    } catch(error) {
        next(error);
    }
});

// You can add your other routes (analytics, search, export) here following the same pattern.
// router.get('/analytics', ...);
// router.get('/search', ...);
// router.get('/export', ...);

module.exports = router;
