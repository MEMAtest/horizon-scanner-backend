// src/index.js - Bulletproof Entry Point
// Designed to start successfully even with missing modules

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Global error handling to prevent crashes
process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', error.message);
    console.error(error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection:', reason);
    console.error('Promise:', promise);
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Add request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Basic health check that always works
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0-minimal',
        environment: process.env.NODE_ENV || 'production'
    });
});

// Root route with safe HTML
app.get('/', (req, res) => {
    try {
        const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>MEMA UK Reg Tracker - Diagnostic Mode</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: #1e293b; 
            min-height: 100vh; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            padding: 2rem;
        }
        .container { 
            background: white; 
            padding: 3rem; 
            border-radius: 20px; 
            box-shadow: 0 20px 40px rgba(0,0,0,0.1); 
            text-align: center; 
            max-width: 600px; 
            width: 100%;
        }
        .title { 
            color: #1e40af; 
            font-size: 2rem; 
            font-weight: 700; 
            margin-bottom: 1rem; 
        }
        .status { 
            color: #059669; 
            font-size: 1.2rem; 
            font-weight: 600; 
            margin-bottom: 2rem; 
        }
        .diagnostic { 
            background: #f8fafc; 
            padding: 2rem; 
            border-radius: 12px; 
            margin: 2rem 0; 
            text-align: left;
        }
        .diagnostic h3 { 
            color: #374151; 
            margin-bottom: 1rem; 
        }
        .check { 
            display: flex; 
            justify-content: space-between; 
            padding: 0.5rem 0; 
            border-bottom: 1px solid #e5e7eb; 
        }
        .check:last-child { 
            border-bottom: none; 
        }
        .success { color: #059669; }
        .warning { color: #d97706; }
        .error { color: #dc2626; }
        .button { 
            display: inline-block; 
            background: #3b82f6; 
            color: white; 
            padding: 0.75rem 1.5rem; 
            border-radius: 8px; 
            text-decoration: none; 
            margin: 0.5rem; 
            transition: background 0.2s;
        }
        .button:hover { 
            background: #2563eb; 
        }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="title">🏛️ MEMA UK Reg Tracker</h1>
        <div class="status">✅ System Online - Diagnostic Mode</div>
        
        <div class="diagnostic">
            <h3>🔧 System Diagnostics</h3>
            <div class="check">
                <span>Server Status</span>
                <span class="success">✅ Running</span>
            </div>
            <div class="check">
                <span>Node.js Version</span>
                <span class="success">${process.version}</span>
            </div>
            <div class="check">
                <span>Environment</span>
                <span class="success">${process.env.NODE_ENV || 'production'}</span>
            </div>
            <div class="check">
                <span>Database URL</span>
                <span class="${process.env.DATABASE_URL ? 'success' : 'warning'}">${process.env.DATABASE_URL ? '✅ Configured' : '⚠️ Missing'}</span>
            </div>
            <div class="check">
                <span>Groq API Key</span>
                <span class="${process.env.GROQ_API_KEY ? 'success' : 'warning'}">${process.env.GROQ_API_KEY ? '✅ Configured' : '⚠️ Missing'}</span>
            </div>
            <div class="check">
                <span>Timestamp</span>
                <span class="success">${new Date().toISOString()}</span>
            </div>
        </div>
        
        <div>
            <a href="/health" class="button">Health Check</a>
            <a href="/test-modules" class="button">Test Modules</a>
            <a href="/debug" class="button">Debug Info</a>
        </div>
        
        <p style="margin-top: 2rem; color: #6b7280; font-size: 0.875rem;">
            System is running in safe mode. Once modules are verified, full functionality will be available.
        </p>
    </div>
</body>
</html>`;
        res.send(htmlContent);
    } catch (error) {
        console.error('Error serving root route:', error);
        res.status(500).json({ 
            error: 'Root route error',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Test modules endpoint - safely check what's available
app.get('/test-modules', (req, res) => {
    console.log('🔍 Testing module availability...');
    
    const moduleTests = {
        core: {},
        services: {},
        routes: {},
        errors: []
    };
    
    // Test core modules
    try {
        require('express');
        moduleTests.core.express = '✅ Available';
    } catch (error) {
        moduleTests.core.express = '❌ Missing';
        moduleTests.errors.push('express: ' + error.message);
    }
    
    try {
        require('axios');
        moduleTests.core.axios = '✅ Available';
    } catch (error) {
        moduleTests.core.axios = '❌ Missing';
        moduleTests.errors.push('axios: ' + error.message);
    }
    
    try {
        require('cheerio');
        moduleTests.core.cheerio = '✅ Available';
    } catch (error) {
        moduleTests.core.cheerio = '❌ Missing';
        moduleTests.errors.push('cheerio: ' + error.message);
    }
    
    try {
        require('rss-parser');
        moduleTests.core.rssParser = '✅ Available';
    } catch (error) {
        moduleTests.core.rssParser = '❌ Missing';
        moduleTests.errors.push('rss-parser: ' + error.message);
    }
    
    try {
        require('pg');
        moduleTests.core.pg = '✅ Available';
    } catch (error) {
        moduleTests.core.pg = '❌ Missing';
        moduleTests.errors.push('pg: ' + error.message);
    }
    
    // Test service modules
    const serviceModules = [
        './services/aiAnalyzer',
        './services/dbService', 
        './services/fileDbService',
        './services/rssFetcher',
        './services/webScraper'
    ];
    
    serviceModules.forEach(modulePath => {
        try {
            require(modulePath);
            const moduleName = modulePath.split('/').pop();
            moduleTests.services[moduleName] = '✅ Available';
        } catch (error) {
            const moduleName = modulePath.split('/').pop();
            moduleTests.services[moduleName] = '❌ Error: ' + error.message;
            moduleTests.errors.push(modulePath + ': ' + error.message);
        }
    });
    
    // Test route modules
    const routeModules = [
        './routes/apiRoutes',
        './routes/pageRoutes',
        './routes/debugRoutes'
    ];
    
    routeModules.forEach(modulePath => {
        try {
            require(modulePath);
            const moduleName = modulePath.split('/').pop();
            moduleTests.routes[moduleName] = '✅ Available';
        } catch (error) {
            const moduleName = modulePath.split('/').pop();
            moduleTests.routes[moduleName] = '❌ Error: ' + error.message;
            moduleTests.errors.push(modulePath + ': ' + error.message);
        }
    });
    
    res.json({
        status: 'Module test complete',
        timestamp: new Date().toISOString(),
        results: moduleTests,
        summary: {
            totalErrors: moduleTests.errors.length,
            coreModulesOk: Object.values(moduleTests.core).filter(v => v.includes('✅')).length,
            serviceModulesOk: Object.values(moduleTests.services).filter(v => v.includes('✅')).length,
            routeModulesOk: Object.values(moduleTests.routes).filter(v => v.includes('✅')).length
        }
    });
});

// Debug info endpoint
app.get('/debug', (req, res) => {
    try {
        const debugInfo = {
            timestamp: new Date().toISOString(),
            process: {
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch,
                pid: process.pid,
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
                cwd: process.cwd()
            },
            environment: {
                NODE_ENV: process.env.NODE_ENV,
                PORT: process.env.PORT,
                DATABASE_URL: process.env.DATABASE_URL ? 'SET (length: ' + process.env.DATABASE_URL.length + ')' : 'NOT SET',
                GROQ_API_KEY: process.env.GROQ_API_KEY ? 'SET (length: ' + process.env.GROQ_API_KEY.length + ')' : 'NOT SET',
                HUGGING_FACE_API_KEY: process.env.HUGGING_FACE_API_KEY ? 'SET' : 'NOT SET'
            },
            request: {
                method: req.method,
                url: req.url,
                headers: req.headers,
                ip: req.ip
            }
        };
        
        res.json(debugInfo);
    } catch (error) {
        res.status(500).json({
            error: 'Debug endpoint error',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Lazy load API routes only when needed
app.use('/api', (req, res, next) => {
    try {
        console.log('🔄 Lazy loading API routes...');
        const apiRoutes = require('./routes/apiRoutes');
        apiRoutes(req, res, next);
    } catch (error) {
        console.error('❌ Error loading API routes:', error.message);
        res.status(500).json({
            error: 'API routes not available',
            details: error.message,
            suggestion: 'Check that ./routes/apiRoutes.js exists and is valid',
            timestamp: new Date().toISOString()
        });
    }
});

// Simple API endpoints that don't require external modules
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0-minimal'
    });
});

app.get('/api/updates', (req, res) => {
    // Return placeholder data until modules are working
    res.json({
        General: [{
            headline: "System Starting Up",
            impact: "The MEMA UK Reg Tracker is initializing. Module testing in progress. Once all components are verified, real regulatory updates will be available.",
            area: "System Status",
            authority: "System",
            impactLevel: "Informational",
            urgency: "Low",
            sector: "General",
            keyDates: "None specified",
            url: "/debug",
            fetchedDate: new Date().toISOString()
        }]
    });
});

app.post('/api/refresh', (req, res) => {
    res.json({
        message: 'System in diagnostic mode',
        timestamp: new Date().toISOString(),
        note: 'Full refresh functionality will be available once all modules are loaded'
    });
});

// Catch-all for missing routes
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method,
        available: [
            'GET /',
            'GET /health', 
            'GET /test-modules',
            'GET /debug',
            'GET /api/health',
            'GET /api/updates',
            'POST /api/refresh'
        ],
        timestamp: new Date().toISOString()
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('🚨 Express error handler:', error);
    res.status(500).json({
        error: 'Internal server error',
        details: error.message,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

// Start server
console.log('🚀 Starting MEMA UK Reg Tracker...');
console.log('📍 Node version:', process.version);
console.log('📍 Platform:', process.platform);
console.log('📍 Working directory:', process.cwd());
console.log('📍 Environment:', process.env.NODE_ENV || 'production');

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌐 Available at: http://localhost:${PORT}`);
    console.log('🔧 Running in diagnostic mode - testing modules...');
    
    // Log environment status
    console.log('🔍 Environment check:');
    console.log('  - DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '⚠️ Missing');
    console.log('  - GROQ_API_KEY:', process.env.GROQ_API_KEY ? '✅ Set' : '⚠️ Missing');
    console.log('  - HUGGING_FACE_API_KEY:', process.env.HUGGING_FACE_API_KEY ? '✅ Set' : '⚠️ Missing');
});

module.exports = app;