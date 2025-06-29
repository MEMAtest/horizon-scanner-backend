// src/routes/apiRoutes.js
// This file is updated to require the newly named dataFetcher.js

const express = require('express');
const router = express.Router();

// --- CRITICAL FIX ---
// The require path now correctly points to the renamed file 'dataFetcher.js'.
const dataFetcher = require('../services/dataFetcher.js');
const aiAnalyzer = require('../services/aiAnalyzer.js');

// Database Initialization
let dbService;
try {
    dbService = require('../services/dbService.js');
    console.log('✅ Using primary database service (dbService).');
} catch (error) {
    console.warn('⚠️ Primary DB service failed, using fileDbService fallback. Error:', error.message);
    dbService = require('../services/fileDbService.js');
}

(async () => {
    try {
        if (dbService && typeof dbService.initialize === 'function') {
            await dbService.initialize();
            console.log(`✅ ${dbService.constructor.name} has been initialized.`);
        }
    } catch (initError) {
        console.error('❌ CRITICAL: Failed to initialize the database service.', initError);
    }
})();

// API Route Definitions

// GET /api/updates
router.get('/updates', async (req, res, next) => {
    try {
        const updates = await dbService.getAllUpdates();
        res.json(updates);
    } catch (error) {
        next(error);
    }
});

// POST /api/refresh
router.post('/refresh', async (req, res, next) => {
    try {
        if (!process.env.GROQ_API_KEY) {
            return res.status(400).json({ error: 'GROQ_API_KEY environment variable not set.' });
        }
        
        const initialCount = (await dbService.getAllUpdates()).length;
        
        // Use the renamed dataFetcher module here
        await dataFetcher.fetchAndAnalyzeFeeds();
        await dataFetcher.scrapeAndAnalyzeWebsites();
        
        const finalCount = (await dbService.getAllUpdates()).length;
        const newCount = finalCount - initialCount;

        res.json({ message: 'Refresh successful', newArticles: newCount, totalUpdates: finalCount });
    } catch (error) {
        next(error);
    }
});

// GET /api/health
router.get('/health', async (req, res, next) => {
    try {
        const health = { status: 'healthy', timestamp: new Date().toISOString() };
        const dbHealth = await dbService.healthCheck();
        health.database = dbHealth;
        res.json(health);
    } catch(error) {
        next(error);
    }
});

module.exports = router;
