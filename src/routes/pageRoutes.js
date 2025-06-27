// src/routes/pageRoutes.js
const express = require('express');
const router = express.Router();
const { renderDashboardPage } = require('../pages/DashboardPage');

// GET / (redirect to dashboard)
router.get('/', (req, res) => {
    res.redirect('/dashboard');
});

// GET /dashboard
router.get('/dashboard', async (req, res, next) => {
    try {
        const html = await renderDashboardPage();
        res.send(html);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
