// src/index.js
// A clean, robust, and standard Express entry point.
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
// const pageRoutes = require('./routes/pageRoutes'); // Uncomment if you create page-specific routes
// const debugRoutes = require('./routes/debugRoutes'); // Uncomment if you create debug-specific routes

// Mount the routers to specific URL prefixes.
// All routes defined in apiRoutes will now start with /api
app.use('/api', apiRoutes);
// app.use('/', pageRoutes); // Example for HTML pages
// app.use('/debug', debugRoutes); // Example for debug endpoints

// A simple root endpoint to show the server is alive.
app.get('/', (req, res) => {
    res.status(200).send(`
        <div style="font-family: sans-serif; text-align: center; padding: 4rem;">
            <h1>✅ Regulatory Horizon Scanner API</h1>
            <p>Server is online and healthy.</p>
            <p>Access API endpoints at <code>/api/...</code></p>
        </div>
    `);
});


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
    console.log(`✅ Server is listening on port ${PORT}`);
    console.log('Routes have been mounted successfully.');
});

// Export the app for Vercel's serverless environment.
module.exports = app;
