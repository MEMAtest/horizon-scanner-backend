// ==========================================
// 🔧 FIX 1: src/index.js - Serverless Compatible Entry Point
// ==========================================

const express = require('express');
const path = require('path');
const app = express();

// --- SERVERLESS COMPATIBILITY FIX ---
// Don't start server in serverless environment
const PORT = process.env.PORT || 3000;

// --- Global Error Handling ---
process.on('uncaughtException', (error) => {
    console.error('FATAL Uncaught Exception:', error);
    // Don't exit in serverless
    if (!process.env.VERCEL) process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    console.error('FATAL Unhandled Rejection:', reason);
    // Don't exit in serverless  
    if (!process.env.VERCEL) process.exit(1);
});

// --- Middleware ---
app.use(express.json());

// 🚨 CRITICAL FIX: Static file serving in serverless
if (process.env.VERCEL) {
    // In Vercel, static files are served differently
    app.get('/css/:filename', (req, res) => {
        try {
            const cssPath = path.join(__dirname, '../public/css', req.params.filename);
            res.type('text/css');
            const fs = require('fs');
            if (fs.existsSync(cssPath)) {
                res.send(fs.readFileSync(cssPath, 'utf8'));
            } else {
                res.status(404).send('CSS file not found');
            }
        } catch (error) {
            console.error('CSS serving error:', error);
            res.status(500).send('CSS error');
        }
    });
} else {
    // Local development
    app.use(express.static(path.join(__dirname, '../public')));
}

// --- LAZY ROUTE LOADING (Critical for serverless) ---
// Don't import routes at module level - import when needed
app.use('/api', (req, res, next) => {
    try {
        const apiRoutes = require('./routes/apiRoutes');
        apiRoutes(req, res, next);
    } catch (error) {
        console.error('API route loading error:', error);
        res.status(500).json({ error: 'API route failed to load' });
    }
});

app.use('/debug', (req, res, next) => {
    try {
        const debugRoutes = require('./routes/debugRoutes');
        debugRoutes(req, res, next);
    } catch (error) {
        console.error('Debug route loading error:', error);
        res.status(500).json({ error: 'Debug route failed to load' });
    }
});

app.use('/', (req, res, next) => {
    try {
        const pageRoutes = require('./routes/pageRoutes');
        pageRoutes(req, res, next);
    } catch (error) {
        console.error('Page route loading error:', error);
        res.status(500).send('Page route failed to load');
    }
});

// --- Central Error Handler ---
app.use((error, req, res, next) => {
    console.error('Express error handler:', error);
    
    // Send appropriate response based on request type
    if (req.path.startsWith('/api/')) {
        res.status(500).json({
            error: 'Internal Server Error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    } else {
        res.status(500).send(`
            <html>
                <body>
                    <h1>Internal Server Error</h1>
                    <p>${error.message}</p>
                    <p>Timestamp: ${new Date().toISOString()}</p>
                </body>
            </html>
        `);
    }
});

// --- Conditional Server Startup ---
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`🚀 Regulatory Horizon Scanner is live on http://localhost:${PORT}`);
        console.log(`   Access Dashboard: http://localhost:${PORT}/dashboard`);
        console.log(`   Debug Tools: http://localhost:${PORT}/debug/test`);
    });
}

module.exports = app;