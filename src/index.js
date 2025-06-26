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
                res.send(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Horizon Scanner - Running on Neon DB!</title>
                        <script src="https://cdn.tailwindcss.com"></script>
                    </head>
                    <body class="bg-gray-100 p-8">
                        <div class="max-w-4xl mx-auto">
                            <h1 class="text-3xl font-bold text-blue-600 mb-4">UK Financial Regulatory Horizon Scanner</h1>
                            <div class="bg-white p-6 rounded-lg shadow">
                                <p class="text-green-600 font-semibold mb-4">✅ Application is running with Neon PostgreSQL!</p>
                                <p class="text-gray-600 mb-4">The database is now persistent and production-ready.</p>
                                <div class="space-y-2">
                                    <a href="/test" class="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Test API</a>
                                    <a href="/api/updates" class="inline-block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 ml-2">View Updates</a>
                                </div>
                                <div class="mt-4 p-4 bg-green-50 border border-green-200 rounded">
                                    <p class="text-sm text-green-800">
                                        <strong>Neon Database:</strong> Your data is now persistent and will survive function restarts. 
                                        Click "Refresh Data" to start fetching real regulatory updates!
                                    </p>
                                </div>
                            </div>
                        </div>
                    </body>
                    </html>
                `);
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
        console.log('Refresh endpoint called');
        
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
        
        // Try to load the RSS fetcher
        let rssFetcher;
        try {
            rssFetcher = require('./modules/rss-fetcher');
            console.log('RSS fetcher module loaded');
        } catch (moduleError) {
            console.error('Failed to load RSS fetcher module:', moduleError);
            return res.status(500).json({ 
                error: 'Failed to load required modules',
                details: moduleError.message 
            });
        }
        
        // Initialize database
        const db = require('./database');
        await db.initialize();
        console.log('Database initialized for refresh');
        
        // Execute the refresh
        await rssFetcher.fetchAndAnalyzeFeeds();
        await rssFetcher.scrapeAndAnalyzeWebsites();
        
        // Get final count
        const updates = await db.get('updates').value();
        
        console.log('Refresh completed successfully');
        res.json({ 
            message: 'Refresh successful',
            timestamp: new Date().toISOString(),
            totalUpdates: updates.length,
            note: 'Data stored persistently in Neon PostgreSQL database'
        });
        
    } catch (error) {
        console.error('Error in refresh endpoint:', error);
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
        availableRoutes: ['/', '/test', '/health', '/api/updates', 'POST /api/refresh']
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
    console.log(`Server is running on port ${PORT}`);
    console.log('Server started successfully with Neon Database!');
});

module.exports = app;