const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Add error handling for the entire app
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Test endpoint to verify the function is working
app.get('/test', async (req, res) => {
    console.log('Test endpoint called');
    
    let dbStatus = 'unknown';
    try {
        const db = require('./database');
        await db.initialize();
        dbStatus = 'connected';
    } catch (error) {
        dbStatus = 'error: ' + error.message;
    }
    
    res.json({ 
        status: 'OK',
        message: 'Function is working!', 
        timestamp: new Date().toISOString(),
        env: {
            hasHuggingFaceKey: !!process.env.HUGGING_FACE_API_KEY,
            hasDatabaseUrl: !!process.env.DATABASE_URL,
            nodeVersion: process.version,
            platform: process.platform
        },
        database: dbStatus
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// Debug database endpoint
app.get('/debug/database', async (req, res) => {
    try {
        console.log('Debug database endpoint called');
        
        // Check environment variables
        const envCheck = {
            DATABASE_URL: !!process.env.DATABASE_URL,
            DATABASE_URL_PREFIX: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 15) + '...' : 'NOT_SET',
            HUGGING_FACE_API_KEY: !!process.env.HUGGING_FACE_API_KEY,
            NODE_ENV: process.env.NODE_ENV
        };
        
        console.log('Environment check:', envCheck);
        
        if (!process.env.DATABASE_URL) {
            return res.json({
                status: 'ERROR',
                message: 'DATABASE_URL environment variable not set',
                env: envCheck
            });
        }
        
        // Test database connection
        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
        
        console.log('Testing database connection...');
        
        // Simple connection test
        const client = await pool.connect();
        const result = await client.query('SELECT NOW() as current_time');
        client.release();
        
        console.log('Database connection successful');
        
        // Test table creation
        await pool.query(`
            CREATE TABLE IF NOT EXISTS debug_test (
                id SERIAL PRIMARY KEY,
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Insert test data
        const insertResult = await pool.query(
            'INSERT INTO debug_test (message) VALUES ($1) RETURNING *',
            ['Test connection at ' + new Date().toISOString()]
        );
        
        // Get all test data
        const selectResult = await pool.query('SELECT * FROM debug_test ORDER BY created_at DESC LIMIT 5');
        
        await pool.end();
        
        res.json({
            status: 'SUCCESS',
            message: 'Database connection working',
            env: envCheck,
            databaseTime: result.rows[0].current_time,
            testData: selectResult.rows
        });
        
    } catch (error) {
        console.error('Database debug error:', error);
        res.status(500).json({
            status: 'ERROR',
            message: 'Database connection failed',
            error: error.message,
            env: {
                DATABASE_URL: !!process.env.DATABASE_URL,
                DATABASE_URL_PREFIX: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 15) + '...' : 'NOT_SET'
            }
        });
    }
});

// Debug refresh endpoint (GET version for easy testing)
app.get('/debug/refresh', async (req, res) => {
    try {
        console.log('Debug refresh endpoint called');
        
        // Check environment variables
        if (!process.env.HUGGING_FACE_API_KEY) {
            return res.json({ error: 'HUGGING_FACE_API_KEY not set' });
        }
        
        if (!process.env.DATABASE_URL) {
            return res.json({ error: 'DATABASE_URL not set' });
        }
        
        console.log('Environment variables OK');
        
        // Test loading RSS fetcher module
        let rssFetcher;
        try {
            rssFetcher = require('./modules/rss-fetcher');
            console.log('RSS fetcher module loaded successfully');
        } catch (moduleError) {
            console.error('Failed to load RSS fetcher:', moduleError);
            return res.json({ 
                error: 'Failed to load RSS fetcher module',
                details: moduleError.message 
            });
        }
        
        // Initialize database
        const db = require('./database');
        await db.initialize();
        console.log('Database initialized');
        
        // Get initial count
        const initialUpdates = await db.get('updates').value();
        console.log('Initial update count:', initialUpdates.length);
        
        // Test just the RSS feeds (faster than full refresh)
        console.log('Testing RSS feed fetching...');
        await rssFetcher.fetchAndAnalyzeFeeds();
        
        // Get final count
        const finalUpdates = await db.get('updates').value();
        console.log('Final update count:', finalUpdates.length);
        
        res.json({
            status: 'SUCCESS',
            message: 'RSS feed test completed',
            initialCount: initialUpdates.length,
            finalCount: finalUpdates.length,
            newArticles: finalUpdates.length - initialUpdates.length,
            sampleUpdate: finalUpdates[0] || null
        });
        
    } catch (error) {
        console.error('Debug refresh error:', error);
        res.status(500).json({
            status: 'ERROR',
            message: 'Refresh test failed',
            error: error.message,
            stack: error.stack
        });
    }
});

// Serve HTML file with better error handling
app.get('/', (req, res) => {
    try {
        console.log('Root route accessed');
        console.log('Current directory:', process.cwd());
        console.log('__dirname:', __dirname);
        
        const htmlPath = path.join(__dirname, '..', 'horizonscan.html');
        console.log('Looking for HTML file at:', htmlPath);
        
        // Check if file exists
        const fs = require('fs');
        if (fs.existsSync(htmlPath)) {
            console.log('HTML file found, serving...');
            res.sendFile(htmlPath);
        } else {
            console.log('HTML file not found at:', htmlPath);
            // Try alternative paths
            const altPath1 = path.join(__dirname, 'horizonscan.html');
            const altPath2 = path.join(process.cwd(), 'horizonscan.html');
            
            console.log('Trying alternative path 1:', altPath1);
            console.log('Trying alternative path 2:', altPath2);
            
            if (fs.existsSync(altPath1)) {
                console.log('Found at alternative path 1');
                res.sendFile(altPath1);
            } else if (fs.existsSync(altPath2)) {
                console.log('Found at alternative path 2');
                res.sendFile(altPath2);
            } else {
                // Serve inline HTML as fallback
                const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>UK Financial Regulatory Horizon Scanner</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; color: #1f2937; }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        .header { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); margin-bottom: 2rem; }
        .title { color: #2563eb; font-size: 2.5rem; font-weight: bold; margin-bottom: 1rem; }
        .status { color: #059669; font-weight: 600; margin-bottom: 1rem; }
        .description { color: #6b7280; margin-bottom: 2rem; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none; margin-right: 1rem; margin-bottom: 1rem; transition: background 0.2s; }
        .button:hover { background: #1d4ed8; }
        .button.success { background: #059669; }
        .button.success:hover { background: #047857; }
        .note { background: #ecfdf5; border: 1px solid #d1fae5; padding: 1rem; border-radius: 0.5rem; margin-top: 2rem; }
        .note-title { color: #065f46; font-weight: 600; margin-bottom: 0.5rem; }
        .note-text { color: #047857; font-size: 0.875rem; }
        .refresh-btn { background: #059669; border: none; color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-weight: 600; }
        .refresh-btn:hover { background: #047857; }
        .refresh-btn:disabled { background: #9ca3af; cursor: not-allowed; }
        .status-indicator { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #059669; margin-right: 0.5rem; }
        .offline { background: #ef4444; }
        #status { margin-top: 1rem; font-size: 0.875rem; color: #6b7280; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">UK Financial Regulatory Horizon Scanner</h1>
            <p class="status">✅ Application Running with Neon PostgreSQL Database</p>
            <p class="description">
                Your regulatory horizon scanning tool is operational. The database is persistent and ready to collect regulatory updates from UK financial authorities.
            </p>
            
            <div>
                <a href="/test" class="button">Test System</a>
                <a href="/api/updates" class="button">View Data</a>
                <a href="/debug/database" class="button">Database Status</a>
                <a href="/debug/refresh" class="button">Test Refresh</a>
            </div>
            
            <div>
                <button onclick="refreshData()" class="refresh-btn" id="refreshBtn">
                    🔄 Refresh Regulatory Data
                </button>
            </div>
            
            <div id="status">
                <span class="status-indicator" id="indicator"></span>
                <span id="statusText">Ready</span>
            </div>
            
            <div class="note">
                <div class="note-title">Database: Neon PostgreSQL</div>
                <div class="note-text">
                    Your data is stored persistently and will survive function restarts. 
                    The system fetches updates from FCA, Bank of England, PRA, TPR, SFO, and FATF.
                </div>
            </div>
        </div>
    </div>
    
    <script>
        async function refreshData() {
            const btn = document.getElementById('refreshBtn');
            const status = document.getElementById('statusText');
            const indicator = document.getElementById('indicator');
            
            btn.disabled = true;
            btn.textContent = '🔄 Refreshing...';
            status.textContent = 'Fetching regulatory updates...';
            indicator.className = 'status-indicator offline';
            
            try {
                const response = await fetch('/api/refresh', { method: 'POST' });
                const result = await response.json();
                
                if (response.ok) {
                    status.textContent = 'Success! ' + (result.totalUpdates || 'Multiple') + ' updates available';
                    indicator.className = 'status-indicator';
                    console.log('Refresh result:', result);
                } else {
                    throw new Error(result.error || 'Refresh failed');
                }
            } catch (error) {
                status.textContent = 'Error: ' + error.message;
                indicator.className = 'status-indicator offline';
                console.error('Refresh error:', error);
            }
            
            btn.disabled = false;
            btn.textContent = '🔄 Refresh Regulatory Data';
        }
        
        // Test connectivity on page load
        async function checkStatus() {
            try {
                const response = await fetch('/test');
                const result = await response.json();
                if (result.database === 'connected') {
                    document.getElementById('statusText').textContent = 'System Online';
                    document.getElementById('indicator').className = 'status-indicator';
                }
            } catch (error) {
                document.getElementById('statusText').textContent = 'System Offline';
                document.getElementById('indicator').className = 'status-indicator offline';
            }
        }
        
        checkStatus();
    </script>
</body>
</html>`;
                res.send(htmlContent);
            }
        }
    } catch (error) {
        console.error('Error serving HTML:', error);
        res.status(500).json({ 
            error: 'Failed to serve HTML file',
            details: error.message
        });
    }
});

// API endpoints with comprehensive error handling
app.get('/api/updates', async (req, res) => {
    try {
        console.log('API updates endpoint called');
        
        // Try to load database with error handling
        let db;
        try {
            db = require('./database');
            console.log('Database module loaded successfully');
        } catch (dbError) {
            console.error('Failed to load database module:', dbError);
            return res.status(500).json({ 
                error: 'Database module failed to load',
                details: dbError.message 
            });
        }
        
        let updates;
        try {
            // Initialize database and get updates (now async)
            await db.initialize();
            updates = await db.get('updates').value();
            console.log('Retrieved updates from database, count:', updates.length);
        } catch (dbReadError) {
            console.error('Failed to read from database:', dbReadError);
            return res.status(500).json({ 
                error: 'Failed to read from database',
                details: dbReadError.message,
                suggestion: 'Check DATABASE_URL environment variable'
            });
        }
        
        const groupedData = {};
        updates.forEach(item => {
            const sector = item.sector || "General";
            if (!groupedData[sector]) {
                groupedData[sector] = [];
            }
            groupedData[sector].push(item);
        });
        
        // If no data, provide some sample data for testing
        if (Object.keys(groupedData).length === 0) {
            groupedData.General = [{
                headline: "Welcome to the Horizon Scanner with Neon Database",
                impact: "Your database is now set up and ready. Click 'Refresh Data' to start fetching real regulatory updates from UK financial regulators.",
                area: "System Setup",
                authority: "System",
                impactLevel: "Informational",
                urgency: "Low",
                sector: "General",
                keyDates: "N/A",
                url: "/test",
                fetchedDate: new Date().toISOString()
            }];
        }
        
        console.log('Grouped data prepared, sectors:', Object.keys(groupedData));
        res.json(groupedData);
        
    } catch (error) {
        console.error('Error in /api/updates:', error);
        res.status(500).json({ 
            error: 'Internal server error in updates endpoint',
            details: error.message
        });
    }
});

app.post('/api/refresh', async (req, res) => {
    try {
        console.log('=====================================');
        console.log('Refresh endpoint called at:', new Date().toISOString());
        
        // Check required environment variables
        if (!process.env.HUGGING_FACE_API_KEY) {
            console.warn('HUGGING_FACE_API_KEY not set');
            return res.status(400).json({ 
                error: 'HUGGING_FACE_API_KEY environment variable not set. Please add it in Vercel settings.' 
            });
        }
        
        if (!process.env.DATABASE_URL) {
            console.warn('DATABASE_URL not set');
            return res.status(400).json({ 
                error: 'DATABASE_URL environment variable not set. Please add your Neon database URL in Vercel settings.' 
            });
        }
        
        console.log('✅ Environment variables present');
        
        // Try to load the RSS fetcher
        let rssFetcher;
        try {
            rssFetcher = require('./modules/rss-fetcher');
            console.log('✅ RSS fetcher module loaded');
        } catch (moduleError) {
            console.error('❌ Failed to load RSS fetcher module:', moduleError);
            return res.status(500).json({ 
                error: 'Failed to load required modules',
                details: moduleError.message 
            });
        }
        
        // Initialize database
        const db = require('./database');
        await db.initialize();
        console.log('✅ Database initialized for refresh');
        
        // Get initial count
        const initialUpdates = await db.get('updates').value();
        console.log('📊 Initial update count:', initialUpdates.length);
        
        // Execute the refresh
        console.log('🔄 Starting RSS feed analysis...');
        await rssFetcher.fetchAndAnalyzeFeeds();
        
        console.log('🔄 Starting website scraping...');
        await rssFetcher.scrapeAndAnalyzeWebsites();
        
        // Get final count
        const finalUpdates = await db.get('updates').value();
        const newCount = finalUpdates.length - initialUpdates.length;
        
        console.log('📊 Final update count:', finalUpdates.length);
        console.log('📈 New articles processed:', newCount);
        console.log('=====================================');
        
        res.json({ 
            message: 'Refresh successful',
            timestamp: new Date().toISOString(),
            initialCount: initialUpdates.length,
            totalUpdates: finalUpdates.length,
            newArticles: newCount,
            note: 'Data stored persistently in Neon PostgreSQL database'
        });
        
    } catch (error) {
        console.error('❌ Error in refresh endpoint:', error);
        res.status(500).json({ 
            error: 'Refresh failed',
            details: error.message,
            suggestion: 'Check that all environment variables are set and database is accessible'
        });
    }
});

// Catch all other routes
app.use('*', (req, res) => {
    console.log('404 - Route not found:', req.originalUrl);
    res.status(404).json({ 
        error: 'Route not found',
        url: req.originalUrl,
        method: req.method,
        availableRoutes: ['/', '/test', '/health', '/api/updates', 'POST /api/refresh', '/debug/database', '/debug/refresh']
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Express error handler:', error);
    res.status(500).json({ 
        error: 'Internal server error',
        details: error.message
    });
});

console.log('Starting server...');
console.log('Node version:', process.version);
console.log('Environment variables check:');
console.log('- PORT:', PORT);
console.log('- HUGGING_FACE_API_KEY present:', !!process.env.HUGGING_FACE_API_KEY);
console.log('- DATABASE_URL present:', !!process.env.DATABASE_URL);
console.log('- Working directory:', process.cwd());

app.listen(PORT, () => {
    console.log('Server is running on port ' + PORT);
    console.log('Server started successfully with Neon Database!');
});

module.exports = app;