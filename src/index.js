// src/index.js
// A clean, robust, and standard Express entry point.
// Load environment variables first
require('dotenv').config();

// All modules are loaded at the start, making path errors easy to find.
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
// Define middleware before any routes are mounted.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// --- Global Error Handling ---
// These are safety nets for errors that happen outside of Express's request-response cycle.
process.on('uncaughtException', (error) => {
    console.error('🚨 UNCAUGHT EXCEPTION:', error);
    process.exit(1); // A server in an unknown state should be terminated.
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 UNHANDLED REJECTION:', reason);
});

// --- Route Mounting ---
// Load your different route modules.
const apiRoutes = require('./routes/apiRoutes');
const pageRoutes = require('./routes/pageRoutes');

// Mount the routers to specific URL prefixes.
// All routes defined in apiRoutes will now start with /api
app.use('/api', apiRoutes);

// Mount page routes at the root level
app.use('/', pageRoutes);

// --- Final Error Handling Middleware ---
// This catch-all middleware runs if no other route has matched the request.
app.use((req, res, next) => {
    res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

// This is an Express-specific error handler that catches errors passed by `next(error)`.
app.use((error, req, res, next) => {
    console.error('✅ EXPRESS ERROR HANDLER CAUGHT:', error.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        details: error.message
    });
});

// --- Server Startup ---
app.listen(PORT, () => {
    console.log(`✅ Regulatory Horizon Scanner listening on port ${PORT}`);
    console.log('📊 Phase 1 Features Available:');
    console.log('   🏠 Main Landing Page: /');
    console.log('   📊 Enhanced Dashboard: /dashboard');
    console.log('   🔧 System Diagnostics: /test');
    console.log('   🔗 API Endpoints: /api/*');
    console.log('Routes have been mounted successfully.');
});

// Export the app for Vercel's serverless environment.
module.exports = app;