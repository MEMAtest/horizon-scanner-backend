const express = require('express');
const path = require('path');
const app = express();

// Add error handling for the entire app
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Test endpoint to verify the function is working
app.get('/test', (req, res) => {
    console.log('Test endpoint called');
    res.json({ 
        status: 'OK',
        message: 'Function is working!', 
        timestamp: new Date().toISOString(),
        env: {
            hasHuggingFaceKey: !!process.env.HUGGING_FACE_API_KEY,
            nodeVersion: process.version,
            platform: process.platform
        }
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
                throw new Error('HTML file not found in any expected location');
            }
        }
    } catch (error) {
        console.error('Error serving HTML:', error);
        res.status(500).json({ 
            error: 'Failed to serve HTML file',
            details: error.message,
            searchedPaths: [
                path.join(__dirname, '..', 'horizonscan.html'),
                path.join(__dirname, 'horizonscan.html'),
                path.join(process.cwd(), 'horizonscan.html')
            ]
        });
    }
});

// API endpoints with comprehensive error handling
app.get('/api/updates', (req, res) => {
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
            updates = db.get('updates').value();
            console.log('Retrieved updates from database, count:', updates.length);
        } catch (dbReadError) {
            console.error('Failed to read from database:', dbReadError);
            return res.status(500).json({ 
                error: 'Failed to read from database',
                details: dbReadError.message 
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
        
        console.log('Grouped data prepared, sectors:', Object.keys(groupedData));
        res.json(groupedData);
        
    } catch (error) {
        console.error('Error in /api/updates:', error);
        res.status(500).json({ 
            error: 'Internal server error in updates endpoint',
            details: error.message,
            stack: error.stack
        });
    }
});

app.post('/api/refresh', async (req, res) => {
    try {
        console.log('Refresh endpoint called');
        
        if (!process.env.HUGGING_FACE_API_KEY) {
            console.warn('HUGGING_FACE_API_KEY not set');
            return res.status(500).json({ 
                error: 'HUGGING_FACE_API_KEY environment variable not set' 
            });
        }
        
        const rssFetcher = require('./modules/rss-fetcher');
        console.log('RSS fetcher module loaded');
        
        await rssFetcher.fetchAndAnalyzeFeeds();
        await rssFetcher.scrapeAndAnalyzeWebsites();
        
        console.log('Refresh completed successfully');
        res.json({ message: 'Refresh successful' });
        
    } catch (error) {
        console.error('Error in refresh endpoint:', error);
        res.status(500).json({ 
            error: 'Refresh failed',
            details: error.message,
            stack: error.stack
        });
    }
});

// Catch all other routes
app.use('*', (req, res) => {
    console.log('404 - Route not found:', req.originalUrl);
    res.status(404).json({ 
        error: 'Route not found',
        url: req.originalUrl,
        method: req.method
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Express error handler:', error);
    res.status(500).json({ 
        error: 'Internal server error',
        details: error.message,
        stack: error.stack
    });
});

const PORT = process.env.PORT || 3000;

console.log('Starting server...');
console.log('Node version:', process.version);
console.log('Environment variables check:');
console.log('- PORT:', PORT);
console.log('- HUGGING_FACE_API_KEY present:', !!process.env.HUGGING_FACE_API_KEY);
console.log('- Working directory:', process.cwd());

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('Server started successfully!');
});

module.exports = app;