// src/index.js
const express = require('express');
const path = require('path');

// Import modular routes
const apiRoutes = require('./routes/apiRoutes');
const pageRoutes = require('./routes/pageRoutes');
const debugRoutes = require('./routes/debugRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Global Error Handling ---
process.on('uncaughtException', (error) => console.error('FATAL Uncaught Exception:', error));
process.on('unhandledRejection', (reason) => console.error('FATAL Unhandled Rejection:', reason));

// --- Middleware ---
// Serve static files (CSS, client-side JS) from the 'public' directory
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json()); // for parsing application/json

// --- Routes ---
app.use('/api', apiRoutes);
app.use('/debug', debugRoutes);
app.use('/', pageRoutes);

// --- Central Error Handler ---
// This catch-all middleware handles any errors passed via next(error)
app.use((error, req, res, next) => {
    console.error('An error occurred:', error.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
    });
});

// --- Server Startup ---
app.listen(PORT, () => {
    console.log(`🚀 Regulatory Horizon Scanner is live on http://localhost:${PORT}`);
    console.log(`   Access Dashboard: http://localhost:${PORT}/dashboard`);
    console.log(`   Debug Tools: http://localhost:${PORT}/debug/test`);
});

module.exports = app;