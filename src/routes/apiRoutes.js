// src/routes/apiRoutes.js
const express = require('express');
const router = express.Router();
const dbService = require('../services/dbService');
const rssFetcher = require('../services/rssFetcher');

// GET /api/analytics
router.get('/analytics', async (req, res, next) => {
    try {
        const data = await dbService.getAnalyticsData();
        res.json(data);
    } catch (error) {
        next(error);
    }
});

// GET /api/updates
router.get('/updates', async (req, res, next) => {
    try {
        // Using the original lowdb-style database for this endpoint as per original logic
        const fileDb = require('../services/fileDbService'); // A new service for lowdb
        await fileDb.initialize();
        const updates = await fileDb.get('updates').value();
        
        const groupedData = {};
        updates.forEach(item => {
            const sector = item.sector || "General";
            if (!groupedData[sector]) {
                groupedData[sector] = [];
            }
            groupedData[sector].push(item);
        });
        res.json(groupedData);
    } catch (error) {
        next(error);
    }
});

// POST /api/refresh
router.post('/refresh', async (req, res, next) => {
    try {
        console.log("Refresh triggered via API");
        const results = await rssFetcher.fetchAndProcessAll();
        res.json({ message: "Refresh completed successfully.", ...results });
    } catch (error) {
        next(error);
    }
});

module.exports = router;