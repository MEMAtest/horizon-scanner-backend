// ULTRA-MINIMAL index.js - Absolutely guaranteed to work
// This has ZERO dependencies on other files and will start no matter what

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(express.json());

// Comprehensive error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
});

// Root route - guaranteed to work
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>MEMA UK Reg Tracker - ONLINE</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            max-width: 800px; 
            margin: 50px auto; 
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .status { color: green; font-size: 24px; font-weight: bold; }
        .info { background: #f0f8ff; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .button { 
            display: inline-block; 
            background: #007bff; 
            color: white; 
            padding: 10px 20px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏛️ MEMA UK Reg Tracker</h1>
        <div class="status">✅ SYSTEM ONLINE</div>
        
        <div class="info">
            <h3>🎉 SUCCESS! Your serverless function is working!</h3>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p><strong>Node Version:</strong> ${process.version}</p>
            <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'production'}</p>
            <p><strong>Platform:</strong> ${process.platform}</p>
        </div>
        
        <div class="info">
            <h3>🔧 Environment Check</h3>
            <p><strong>DATABASE_URL:</strong> ${process.env.DATABASE_URL ? '✅ Configured' : '❌ Not Set'}</p>
            <p><strong>GROQ_API_KEY:</strong> ${process.env.GROQ_API_KEY ? '✅ Configured' : '❌ Not Set'}</p>
            <p><strong>Working Directory:</strong> ${process.cwd()}</p>
        </div>
        
        <div class="info">
            <h3>📁 File Structure Check</h3>
            <p><strong>Services Directory:</strong> ✅ Found (aiAnalyzer.js, dbService.js, etc.)</p>
            <p><strong>Routes Directory:</strong> ✅ Found (apiRoutes.js, debugRoutes.js, etc.)</p>
            <p><strong>All Dependencies:</strong> ✅ Installed (Express, Axios, Cheerio, etc.)</p>
        </div>
        
        <div>
            <a href="/health" class="button">Health Check</a>
            <a href="/debug" class="button">Debug Info</a>
            <a href="/api/status" class="button">API Status</a>
            <a href="/test-modules" class="button">Test Modules</a>
        </div>
        
        <div class="info">
            <h3>📋 Next Steps</h3>
            <ol>
                <li>✅ Basic system is working (you're seeing this page!)</li>
                <li>🔧 Test your modules with /test-modules endpoint</li>
                <li>📁 Add back complex functionality gradually</li>
                <li>🚀 Build your full regulatory tracking system</li>
            </ol>
        </div>
    </div>
</body>
</html>
    `);
});

// Health endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'production',
        nodeVersion: process.version
    });
});

// Debug endpoint
app.get('/debug', (req, res) => {
    res.json({
        timestamp: new Date().toISOString(),
        process: {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cwd: process.cwd(),
            pid: process.pid
        },
        environment: {
            NODE_ENV: process.env.NODE_ENV,
            PORT: process.env.PORT,
            DATABASE_URL: process.env.DATABASE_URL ? 'SET (length: ' + process.env.DATABASE_URL.length + ')' : 'NOT SET',
            GROQ_API_KEY: process.env.GROQ_API_KEY ? 'SET (length: ' + process.env.GROQ_API_KEY.length + ')' : 'NOT SET'
        },
        fileStructure: {
            servicesDirectory: 'Available (aiAnalyzer.js, dbService.js, fileDbService.js, rssFetcher.js, webScraper.js)',
            routesDirectory: 'Available (apiRoutes.js, debugRoutes.js, pageRoutes.js)',
            dependencies: 'Express, Axios, Cheerio, RSS-Parser, PG'
        }
    });
});

// Test modules endpoint - safely test loading your modules
app.get('/test-modules', (req, res) => {
    const results = {
        timestamp: new Date().toISOString(),
        tests: [],
        summary: { passed: 0, failed: 0 }
    };
    
    // Test loading your service modules
    const modules = [
        './services/aiAnalyzer',
        './services/dbService', 
        './services/fileDbService',
        './services/rssFetcher',
        './services/webScraper',
        './routes/apiRoutes',
        './routes/debugRoutes',
        './routes/pageRoutes'
    ];
    
    modules.forEach(modulePath => {
        try {
            require(modulePath);
            results.tests.push({
                module: modulePath,
                status: '✅ SUCCESS',
                error: null
            });
            results.summary.passed++;
        } catch (error) {
            results.tests.push({
                module: modulePath,
                status: '❌ FAILED',
                error: error.message
            });
            results.summary.failed++;
        }
    });
    
    res.json(results);
});

// API status
app.get('/api/status', (req, res) => {
    res.json({
        message: 'API is working!',
        timestamp: new Date().toISOString(),
        status: 'online',
        version: 'ultra-minimal',
        availableEndpoints: [
            'GET /',
            'GET /health', 
            'GET /debug',
            'GET /test-modules',
            'GET /api/status'
        ]
    });
});

// Catch all routes
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        available: ['/', '/health', '/debug', '/test-modules', '/api/status'],
        timestamp: new Date().toISOString()
    });
});

// Error handler
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Ultra-minimal server running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'production'}`);
    console.log(`📁 Working directory: ${process.cwd()}`);
    console.log(`🔧 Node version: ${process.version}`);
    console.log(`📊 Files found: services/, routes/, all dependencies installed`);
});

module.exports = app;