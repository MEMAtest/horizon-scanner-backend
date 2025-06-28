// src/index.js
// Lean application entry point for the refactored architecture

const express = require('express');
const path = require('path');
const app = express();

// Environment detection
const PORT = process.env.PORT || 3000;
const IS_VERCEL = !!process.env.VERCEL;

// --- Global Error Handling ---
process.on('uncaughtException', (error) => {
    console.error('FATAL Uncaught Exception:', error);
    // Don't exit in serverless environments
    if (!IS_VERCEL) process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('FATAL Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit in serverless environments
    if (!IS_VERCEL) process.exit(1);
});

// --- Middleware ---
app.use(express.json());

// Serverless-compatible static file serving
if (IS_VERCEL) {
    // In Vercel, serve CSS files directly
    app.get('/css/:filename', (req, res) => {
        try {
            const fs = require('fs');
            const cssPath = path.join(__dirname, '../public/css', req.params.filename);
            
            if (fs.existsSync(cssPath)) {
                res.type('text/css');
                res.send(fs.readFileSync(cssPath, 'utf8'));
            } else {
                res.status(404).send('/* CSS file not found */');
            }
        } catch (error) {
            console.error('CSS serving error:', error);
            res.status(500).send('/* CSS error */');
        }
    });
} else {
    // Local development
    app.use(express.static(path.join(__dirname, '../public')));
}

// --- Lazy Route Loading (Critical for serverless) ---
// Load routes only when needed to avoid startup issues

app.use('/api', (req, res, next) => {
    try {
        const apiRoutes = require('./routes/apiRoutes');
        apiRoutes(req, res, next);
    } catch (error) {
        console.error('API route loading error:', error);
        res.status(500).json({ 
            error: 'API route failed to load',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

app.use('/debug', (req, res, next) => {
    try {
        const debugRoutes = require('./routes/debugRoutes');
        debugRoutes(req, res, next);
    } catch (error) {
        console.error('Debug route loading error:', error);
        res.status(500).json({ 
            error: 'Debug route failed to load',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Page routes (main application pages)
app.use('/', (req, res, next) => {
    try {
        const pageRoutes = require('./routes/pageRoutes');
        pageRoutes(req, res, next);
    } catch (error) {
        console.error('Page route loading error:', error);
        res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Server Error - Regulatory Horizon Scanner</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f8fafc; }
                    .error-container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                    h1 { color: #dc2626; margin-bottom: 20px; }
                    .error-details { background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; color: #dc2626; }
                    .button { display: inline-block; background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin: 5px; }
                </style>
            </head>
            <body>
                <div class="error-container">
                    <h1>🚨 Server Error</h1>
                    <p>Page route failed to load</p>
                    <div class="error-details">
                        Error: ${error.message}
                    </div>
                    <p>Timestamp: ${new Date().toISOString()}</p>
                    <a href="/debug/test" class="button">🔧 Debug Information</a>
                </div>
            </body>
            </html>
        `);
    }
});

// --- Central Error Handler ---
app.use((error, req, res, next) => {
    console.error('Express error handler:', error);
    
    // Determine response format based on request
    if (req.path.startsWith('/api/')) {
        res.status(500).json({
            error: 'Internal Server Error',
            message: error.message,
            timestamp: new Date().toISOString(),
            path: req.path
        });
    } else {
        res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Internal Server Error</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f8fafc; }
                    .error-container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; }
                    h1 { color: #dc2626; }
                    .back-link { color: #3b82f6; text-decoration: none; }
                </style>
            </head>
            <body>
                <div class="error-container">
                    <h1>Internal Server Error</h1>
                    <p>Something went wrong while processing your request.</p>
                    <p><strong>Error:</strong> ${error.message}</p>
                    <p><strong>Path:</strong> ${req.path}</p>
                    <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
                    <hr>
                    <a href="/" class="back-link">🏠 Go to Homepage</a> | 
                    <a href="/debug/test" class="back-link">🔧 System Diagnostics</a>
                </div>
            </body>
            </html>
        `);
    }
});

// --- Conditional Server Startup ---
// Only start server in local development, not in serverless
if (!IS_VERCEL) {
    app.listen(PORT, () => {
        console.log('🚀 Regulatory Horizon Scanner (Refactored Architecture)');
        console.log(`   Server running on: http://localhost:${PORT}`);
        console.log(`   Main Dashboard: http://localhost:${PORT}/dashboard`);
        console.log(`   System Test: http://localhost:${PORT}/debug/test`);
        console.log(`   API Health: http://localhost:${PORT}/api/health`);
        console.log('');
        console.log('📋 Architecture Summary:');
        console.log('   ✅ Modular route handlers (pageRoutes, apiRoutes, debugRoutes)');
        console.log('   ✅ Separated services layer (dbService, fileDbService, aiAnalyzer, rssFetcher)');
        console.log('   ✅ Component-based UI rendering (Header, FilterPanel, TrendChart)');
        console.log('   ✅ Serverless-compatible design');
        console.log('   ✅ Lazy loading for optimal performance');
    });
} else {
    console.log('🚀 Regulatory Horizon Scanner initialized for Vercel serverless');
    console.log('   Architecture: Modular components and services');
    console.log('   Environment: Production serverless');
}

// Export for Vercel serverless
module.exports = app;