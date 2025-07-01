// src/routes/pageRoutes.js
// REFACTORED: Main router that delegates to specific page handlers
const express = require('express');
const router = express.Router();

// Import individual page handlers
const homePage = require('./pages/homePage');
const analyticsPage = require('./pages/analyticsPage');
const dashboardPage = require('./pages/dashboardPage');
const testPage = require('./pages/testPage');

// Route delegation with error handling
router.get('/', async (req, res) => {
    try {
        await homePage(req, res);
    } catch (error) {
        console.error('Home page error:', error);
        res.status(500).send(`
            <div style="padding: 2rem; text-align: center; font-family: system-ui;">
                <h1>🚨 System Error</h1>
                <p>Failed to load Intelligence Streams: ${error.message}</p>
                <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    🔄 Retry
                </button>
            </div>
        `);
    }
});

router.get('/analytics', async (req, res) => {
    try {
        await analyticsPage(req, res);
    } catch (error) {
        console.error('Analytics page error:', error);
        res.status(500).send(`
            <div style="padding: 2rem; text-align: center; font-family: system-ui;">
                <h1>📊 Analytics Error</h1>
                <p>Failed to load Analytics Dashboard: ${error.message}</p>
                <a href="/" style="display: inline-block; margin-top: 1rem; padding: 0.75rem 1.5rem; background: #3b82f6; color: white; border-radius: 6px; text-decoration: none;">
                    ← Back to Home
                </a>
            </div>
        `);
    }
});

router.get('/dashboard', async (req, res) => {
    try {
        await dashboardPage(req, res);
    } catch (error) {
        console.error('Dashboard page error:', error);
        res.status(500).send(`
            <div style="padding: 2rem; text-align: center; font-family: system-ui;">
                <h1>📈 Dashboard Error</h1>
                <p>Failed to load Compliance Dashboard: ${error.message}</p>
                <a href="/" style="display: inline-block; margin-top: 1rem; padding: 0.75rem 1.5rem; background: #3b82f6; color: white; border-radius: 6px; text-decoration: none;">
                    ← Back to Home
                </a>
            </div>
        `);
    }
});

router.get('/test', async (req, res) => {
    try {
        await testPage(req, res);
    } catch (error) {
        console.error('Test page error:', error);
        res.status(500).send(`
            <div style="padding: 2rem; text-align: center; font-family: system-ui;">
                <h1>🔧 Diagnostics Error</h1>
                <p>Failed to load System Diagnostics: ${error.message}</p>
                <a href="/" style="display: inline-block; margin-top: 1rem; padding: 0.75rem 1.5rem; background: #3b82f6; color: white; border-radius: 6px; text-decoration: none;">
                    ← Back to Home
                </a>
            </div>
        `);
    }
});

module.exports = router;