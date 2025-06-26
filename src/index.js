// =======================================================================
// --- UPDATED FILE 2 of 2: Main Application Logic ---
// --- Update this file at:  src/index.js
// =======================================================================
const express = require('express');
const path = require('path');
const rssFetcher = require('./modules/rss-fetcher');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// --- FIX: Serve the frontend HTML file from the root directory ---
app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'horizonscan.html'));
});
// -------------------------------------------------------------

// The API endpoint for fetching all processed data
app.get('/api/updates', (req, res) => {
    console.log("API endpoint /api/updates was hit. Serving from DB.");
    const updates = db.get('updates').value();
    
    const groupedData = {};
    updates.forEach(item => {
        const sector = item.sector || "General";
        if (!groupedData[sector]) {
            groupedData[sector] = [];
        }
        groupedData[sector].push(item);
    });
    res.json(groupedData);
});

// On-Demand Refresh Endpoint
app.post('/api/refresh', async (req, res) => {
    console.log('-------------------------------------');
    console.log(`On-demand refresh triggered at: ${new Date().toLocaleString()}`);
    
    try {
        await rssFetcher.fetchAndAnalyzeFeeds();
        await rssFetcher.scrapeAndAnalyzeWebsites();
        
        console.log('On-demand refresh completed successfully.');
        res.status(200).json({ message: 'Refresh successful' });

    } catch (error) {
        console.error("Error during on-demand refresh:", error);
        res.status(500).json({ message: 'Refresh failed' });
    } finally {
        console.log('-------------------------------------');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Open your browser and navigate to the public URL for this port.');
});
