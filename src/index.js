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
        message: 'MEMA UK Reg Tracker is working!', 
        timestamp: new Date().toISOString(),
        env: {
            hasHuggingFaceKey: !!process.env.HUGGING_FACE_API_KEY,
            hasDatabaseUrl: !!process.env.DATABASE_URL,
            hasGroqKey: !!process.env.GROQ_API_KEY,
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

// Dashboard endpoint - serves formatted data view
app.get('/dashboard', async (req, res) => {
    try {
        console.log('Dashboard endpoint called');
        
        const db = require('./database');
        await db.initialize();
        const updates = await db.get('updates').value();
        
        // Group data by sector
        const groupedData = {};
        updates.forEach(item => {
            const sector = item.sector || "General";
            if (!groupedData[sector]) {
                groupedData[sector] = [];
            }
            groupedData[sector].push(item);
        });
        
        // Sort sectors and items
        const sortedSectors = Object.keys(groupedData).sort();
        
        // Generate dashboard HTML
        const dashboardHTML = `<!DOCTYPE html>
<html>
<head>
    <title>MEMA UK Reg Tracker - Dashboard</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; line-height: 1.6; }
        .container { max-width: 1400px; margin: 0 auto; padding: 1rem; }
        .header { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 2rem; text-align: center; }
        .title { color: #1e40af; font-size: 2.5rem; font-weight: 700; margin-bottom: 0.5rem; }
        .subtitle { color: #64748b; font-size: 1.1rem; margin-bottom: 1rem; }
        .stats { display: flex; justify-content: center; gap: 2rem; margin-bottom: 1rem; }
        .stat-item { text-align: center; }
        .stat-number { color: #059669; font-size: 2rem; font-weight: 700; }
        .stat-label { color: #64748b; font-size: 0.875rem; }
        .back-link { display: inline-block; color: #3b82f6; text-decoration: none; margin-bottom: 1rem; }
        .back-link:hover { text-decoration: underline; }
        .filters { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 2rem; }
        .filter-group { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; }
        .filter-select { padding: 0.5rem 1rem; border: 1px solid #d1d5db; border-radius: 6px; background: white; }
        .filter-button { background: #3b82f6; color: white; padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer; }
        .filter-button:hover { background: #2563eb; }
        .sectors { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 2rem; }
        .sector-card { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
        .sector-header { background: #f1f5f9; padding: 1.5rem; border-bottom: 1px solid #e2e8f0; }
        .sector-title { color: #1e293b; font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; }
        .sector-count { color: #64748b; font-size: 0.875rem; }
        .sector-content { padding: 0; }
        .update-item { padding: 1.5rem; border-bottom: 1px solid #f1f5f9; }
        .update-item:last-child { border-bottom: none; }
        .update-title { color: #1e293b; font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem; line-height: 1.4; }
        .update-meta { display: flex; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
        .meta-item { display: flex; align-items: center; gap: 0.5rem; }
        .meta-label { color: #64748b; font-size: 0.75rem; font-weight: 500; text-transform: uppercase; }
        .meta-value { font-size: 0.875rem; }
        .impact-badge { padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 500; }
        .impact-significant { background: #fef2f2; color: #dc2626; }
        .impact-moderate { background: #fffbeb; color: #d97706; }
        .impact-informational { background: #f0f9ff; color: #2563eb; }
        .urgency-high { background: #fef2f2; color: #dc2626; }
        .urgency-medium { background: #fffbeb; color: #d97706; }
        .urgency-low { background: #f0fdf4; color: #16a34a; }
        .authority-badge { background: #f8fafc; color: #475569; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 500; }
        .update-impact { color: #374151; margin-bottom: 1rem; }
        .update-footer { display: flex; justify-content: space-between; align-items: center; }
        .view-source { color: #3b82f6; text-decoration: none; font-size: 0.875rem; }
        .view-source:hover { text-decoration: underline; }
        .update-date { color: #9ca3af; font-size: 0.75rem; }
        .empty-state { text-align: center; padding: 3rem; color: #64748b; }
        .search-box { width: 100%; max-width: 300px; padding: 0.5rem 1rem; border: 1px solid #d1d5db; border-radius: 6px; }
        .hidden { display: none !important; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <a href="/" class="back-link">← Back to Main</a>
            <h1 class="title">MEMA UK Reg Tracker</h1>
            <p class="subtitle">Regulatory Updates Dashboard</p>
            <div class="stats">
                <div class="stat-item">
                    <div class="stat-number">${updates.length}</div>
                    <div class="stat-label">Total Updates</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${sortedSectors.length}</div>
                    <div class="stat-label">Sectors</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${updates.filter(u => {
                        const date = new Date(u.fetchedDate);
                        const today = new Date();
                        const diffDays = Math.floor((today - date) / (1000 * 60 * 60 * 24));
                        return diffDays <= 1;
                    }).length}</div>
                    <div class="stat-label">Recent (24h)</div>
                </div>
            </div>
        </div>

        <div class="filters">
            <div class="filter-group">
                <input type="text" id="searchBox" placeholder="Search updates..." class="search-box">
                <select id="sectorFilter" class="filter-select">
                    <option value="">All Sectors</option>
                    ${sortedSectors.map(sector => `<option value="${sector}">${sector}</option>`).join('')}
                </select>
                <select id="authorityFilter" class="filter-select">
                    <option value="">All Authorities</option>
                    ${[...new Set(updates.map(u => u.authority))].sort().map(auth => `<option value="${auth}">${auth}</option>`).join('')}
                </select>
                <select id="impactFilter" class="filter-select">
                    <option value="">All Impact Levels</option>
                    <option value="Significant">Significant</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Informational">Informational</option>
                </select>
                <button onclick="clearFilters()" class="filter-button">Clear Filters</button>
            </div>
        </div>

        <div class="sectors" id="sectorsContainer">
            ${sortedSectors.length === 0 ? `
                <div class="empty-state">
                    <h3>No regulatory updates found</h3>
                    <p>Click "Refresh Regulatory Data" on the main page to fetch updates.</p>
                </div>
            ` : sortedSectors.map(sector => `
                <div class="sector-card" data-sector="${sector}">
                    <div class="sector-header">
                        <h2 class="sector-title">${sector}</h2>
                        <p class="sector-count">${groupedData[sector].length} update${groupedData[sector].length !== 1 ? 's' : ''}</p>
                    </div>
                    <div class="sector-content">
                        ${groupedData[sector].sort((a, b) => new Date(b.fetchedDate) - new Date(a.fetchedDate)).map(update => `
                            <div class="update-item" 
                                 data-authority="${update.authority}" 
                                 data-impact="${update.impactLevel}"
                                 data-title="${update.headline.toLowerCase()}"
                                 data-content="${update.impact.toLowerCase()}">
                                <h3 class="update-title">${update.headline}</h3>
                                <div class="update-meta">
                                    <div class="meta-item">
                                        <span class="meta-label">Authority</span>
                                        <span class="authority-badge">${update.authority}</span>
                                    </div>
                                    <div class="meta-item">
                                        <span class="meta-label">Impact</span>
                                        <span class="impact-badge impact-${update.impactLevel.toLowerCase()}">${update.impactLevel}</span>
                                    </div>
                                    <div class="meta-item">
                                        <span class="meta-label">Urgency</span>
                                        <span class="urgency-${update.urgency.toLowerCase()} impact-badge">${update.urgency}</span>
                                    </div>
                                    <div class="meta-item">
                                        <span class="meta-label">Area</span>
                                        <span class="meta-value">${update.area}</span>
                                    </div>
                                </div>
                                <p class="update-impact">${update.impact}</p>
                                <div class="update-footer">
                                    <a href="${update.url}" target="_blank" class="view-source">View Source →</a>
                                    <span class="update-date">${new Date(update.fetchedDate).toLocaleDateString('en-GB')} at ${new Date(update.fetchedDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                ${update.keyDates && update.keyDates !== 'None specified' ? `
                                    <div style="margin-top: 0.5rem; padding: 0.5rem; background: #f8fafc; border-radius: 6px; font-size: 0.875rem;">
                                        <strong>Key Dates:</strong> ${update.keyDates}
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>

    <script>
        // Filter functionality
        const searchBox = document.getElementById('searchBox');
        const sectorFilter = document.getElementById('sectorFilter');
        const authorityFilter = document.getElementById('authorityFilter');
        const impactFilter = document.getElementById('impactFilter');

        function applyFilters() {
            const searchTerm = searchBox.value.toLowerCase();
            const selectedSector = sectorFilter.value;
            const selectedAuthority = authorityFilter.value;
            const selectedImpact = impactFilter.value;

            const sectorCards = document.querySelectorAll('.sector-card');
            
            sectorCards.forEach(card => {
                const sector = card.dataset.sector;
                let hasVisibleUpdates = false;

                // Filter by sector
                if (selectedSector && sector !== selectedSector) {
                    card.classList.add('hidden');
                    return;
                }

                const updateItems = card.querySelectorAll('.update-item');
                updateItems.forEach(item => {
                    let visible = true;

                    // Search filter
                    if (searchTerm) {
                        const title = item.dataset.title;
                        const content = item.dataset.content;
                        if (!title.includes(searchTerm) && !content.includes(searchTerm)) {
                            visible = false;
                        }
                    }

                    // Authority filter
                    if (selectedAuthority && item.dataset.authority !== selectedAuthority) {
                        visible = false;
                    }

                    // Impact filter
                    if (selectedImpact && item.dataset.impact !== selectedImpact) {
                        visible = false;
                    }

                    if (visible) {
                        item.classList.remove('hidden');
                        hasVisibleUpdates = true;
                    } else {
                        item.classList.add('hidden');
                    }
                });

                // Hide sector card if no visible updates
                if (hasVisibleUpdates) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            });
        }

        function clearFilters() {
            searchBox.value = '';
            sectorFilter.value = '';
            authorityFilter.value = '';
            impactFilter.value = '';
            applyFilters();
        }

        // Add event listeners
        searchBox.addEventListener('input', applyFilters);
        sectorFilter.addEventListener('change', applyFilters);
        authorityFilter.addEventListener('change', applyFilters);
        impactFilter.addEventListener('change', applyFilters);

        // Auto-refresh data every 5 minutes
        setInterval(() => {
            console.log('Auto-refreshing dashboard data...');
            window.location.reload();
        }, 5 * 60 * 1000);
    </script>
</body>
</html>`;

        res.send(dashboardHTML);
        
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({
            error: 'Failed to load dashboard',
            details: error.message
        });
    }
});

// Comprehensive debug endpoint to fix FCA processing issues
app.get('/debug/comprehensive-fix', async (req, res) => {
    try {
        console.log('🔧 Running comprehensive FCA diagnostic...');
        
        const results = {
            timestamp: new Date().toISOString(),
            tests: [],
            summary: {}
        };

        // Test 1: Environment Variables
        console.log('\n🔧 TEST 1: Environment Variables');
        const envTest = {
            name: 'Environment Variables',
            status: 'unknown',
            details: {
                GROQ_API_KEY: !!process.env.GROQ_API_KEY,
                DATABASE_URL: !!process.env.DATABASE_URL,
                HUGGING_FACE_API_KEY: !!process.env.HUGGING_FACE_API_KEY
            }
        };

        if (envTest.details.GROQ_API_KEY && envTest.details.DATABASE_URL) {
            envTest.status = 'pass';
            console.log('✅ All required environment variables present');
        } else {
            envTest.status = 'fail';
            console.log('❌ Missing required environment variables');
        }
        results.tests.push(envTest);

        // Test 2: FCA RSS Feed
        console.log('\n🔧 TEST 2: FCA RSS Feed Analysis');
        const fcaRssTest = {
            name: 'FCA RSS Feed',
            status: 'unknown',
            details: {}
        };

        try {
            const Parser = require('rss-parser');
            const parser = new Parser();
            const feed = await parser.parseURL('https://www.fca.org.uk/news/rss.xml');
            
            fcaRssTest.details.totalItems = feed.items.length;
            fcaRssTest.details.feedTitle = feed.title;
            fcaRssTest.details.recentItems = [];

            // Helper function for date parsing
            const parseFCADate = (dateString) => {
                try {
                    if (!dateString) return null;
                    const cleanDate = dateString.replace(/^[A-Za-z]+,\s*/, '').replace(/\s*-\s*\d{2}:\d{2}$/, '');
                    const parsedDate = new Date(cleanDate);
                    return isNaN(parsedDate.getTime()) ? null : parsedDate;
                } catch (error) {
                    return null;
                }
            };

            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

            // Analyze first 5 items
            for (let i = 0; i < Math.min(5, feed.items.length); i++) {
                const item = feed.items[i];
                const parsedDate = parseFCADate(item.pubDate);
                const isRecent = parsedDate ? (parsedDate >= threeDaysAgo) : false;

                fcaRssTest.details.recentItems.push({
                    title: item.title,
                    rawDate: item.pubDate,
                    parsedDate: parsedDate ? parsedDate.toISOString() : null,
                    isRecent: isRecent,
                    url: item.link
                });
            }

            fcaRssTest.status = 'pass';
            console.log(`✅ FCA RSS feed accessible: ${feed.items.length} items`);
            
        } catch (error) {
            fcaRssTest.status = 'fail';
            fcaRssTest.details.error = error.message;
            console.log(`❌ FCA RSS feed error: ${error.message}`);
        }
        results.tests.push(fcaRssTest);

        // Test 3: Groq API
        console.log('\n🔧 TEST 3: Groq API Test');
        const groqTest = {
            name: 'Groq API',
            status: 'unknown',
            details: {}
        };

        if (process.env.GROQ_API_KEY) {
            try {
                const axios = require('axios');
                const testPayload = {
                    model: "llama-3.1-8b-instant",
                    messages: [
                        {
                            role: "user",
                            content: "Respond with this exact JSON: {\"test\": \"success\", \"provider\": \"groq\"}"
                        }
                    ],
                    max_tokens: 100,
                    temperature: 0.1
                };

                const response = await axios.post(
                    'https://api.groq.com/openai/v1/chat/completions',
                    testPayload,
                    {
                        headers: { 
                            'Content-Type': 'application/json', 
                            'Authorization': `Bearer ${process.env.GROQ_API_KEY}` 
                        },
                        timeout: 15000
                    }
                );

                const rawResponse = response.data.choices[0].message.content;
                groqTest.details.rawResponse = rawResponse;

                // Test JSON extraction
                let extractedJSON = null;
                try {
                    extractedJSON = JSON.parse(rawResponse);
                } catch (e) {
                    const markdownMatch = rawResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
                    if (markdownMatch) {
                        try {
                            extractedJSON = JSON.parse(markdownMatch[1]);
                        } catch (e2) {}
                    }
                }

                groqTest.details.extractedJSON = extractedJSON;
                groqTest.details.extractionSuccess = !!extractedJSON;

                if (extractedJSON) {
                    groqTest.status = 'pass';
                    console.log('✅ Groq API working and JSON extraction successful');
                } else {
                    groqTest.status = 'partial';
                    console.log('⚠️ Groq API working but JSON extraction needs improvement');
                }

            } catch (error) {
                groqTest.status = 'fail';
                groqTest.details.error = error.message;
                console.log(`❌ Groq API error: ${error.message}`);
            }
        } else {
            groqTest.status = 'fail';
            groqTest.details.error = 'GROQ_API_KEY not set';
            console.log('❌ GROQ_API_KEY not set');
        }
        results.tests.push(groqTest);

        // Generate summary
        results.summary = {
            totalTests: results.tests.length,
            passed: results.tests.filter(t => t.status === 'pass').length,
            failed: results.tests.filter(t => t.status === 'fail').length,
            partial: results.tests.filter(t => t.status === 'partial').length,
            mainIssues: [],
            recommendations: []
        };

        // Generate recommendations
        if (envTest.status === 'fail') {
            results.summary.mainIssues.push('Missing environment variables');
            results.summary.recommendations.push('Set GROQ_API_KEY and DATABASE_URL in Vercel settings');
        }

        if (fcaRssTest.status === 'fail') {
            results.summary.mainIssues.push('FCA RSS feed not accessible');
            results.summary.recommendations.push('Check network connectivity and RSS feed URL');
        }

        if (groqTest.status === 'fail') {
            results.summary.mainIssues.push('Groq API not working');
            results.summary.recommendations.push('Check GROQ_API_KEY and API quota');
        }

        if (groqTest.status === 'partial') {
            results.summary.mainIssues.push('JSON parsing from Groq needs improvement');
            results.summary.recommendations.push('Update AI analyzer with better JSON extraction');
        }

        console.log('\n📋 DIAGNOSTIC COMPLETE');
        console.log(`✅ Passed: ${results.summary.passed}/${results.summary.totalTests}`);
        console.log(`❌ Failed: ${results.summary.failed}/${results.summary.totalTests}`);

        res.json({
            status: 'SUCCESS',
            message: 'FCA processing diagnostic completed',
            results: results,
            nextSteps: results.summary.recommendations
        });
        
    } catch (error) {
        console.error('❌ Comprehensive debug error:', error);
        res.status(500).json({
            status: 'ERROR',
            error: error.message,
            stack: error.stack
        });
    }
});

// Debug database endpoint
app.get('/debug/database', async (req, res) => {
    try {
        console.log('Debug database endpoint called');
        
        const envCheck = {
            DATABASE_URL: !!process.env.DATABASE_URL,
            DATABASE_URL_PREFIX: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 15) + '...' : 'NOT_SET',
            GROQ_API_KEY: !!process.env.GROQ_API_KEY,
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
        
        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
        
        console.log('Testing database connection...');
        
        const client = await pool.connect();
        const result = await client.query('SELECT NOW() as current_time');
        client.release();
        
        console.log('Database connection successful');
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS debug_test (
                id SERIAL PRIMARY KEY,
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        const insertResult = await pool.query(
            'INSERT INTO debug_test (message) VALUES ($1) RETURNING *',
            ['Test connection at ' + new Date().toISOString()]
        );
        
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

// Groq API test endpoint
app.get('/debug/groq-test', async (req, res) => {
    try {
        console.log('🧪 Testing Groq API connection');
        
        if (!process.env.GROQ_API_KEY) {
            return res.json({
                status: 'ERROR',
                message: 'GROQ_API_KEY environment variable not set',
                envVars: {
                    GROQ_API_KEY: false,
                    HUGGING_FACE_API_KEY: !!process.env.HUGGING_FACE_API_KEY,
                    DATABASE_URL: !!process.env.DATABASE_URL
                }
            });
        }
        
        console.log('✅ Groq API key found');
        
        const axios = require('axios');
        const testPayload = {
            model: "llama-3.1-8b-instant",
            messages: [
                {
                    role: "user",
                    content: "Return only this JSON: {\"test\": \"success\", \"provider\": \"groq\"}"
                }
            ],
            max_tokens: 100,
            temperature: 0.1
        };
        
        console.log('🔄 Making test API call to Groq...');
        
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            testPayload,
            {
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}` 
                },
                timeout: 30000
            }
        );
        
        console.log('✅ Groq API call successful');
        
        const result = response.data;
        const aiResponse = result.choices[0].message.content;
        
        res.json({
            status: 'SUCCESS',
            message: 'Groq API is working!',
            envVars: {
                GROQ_API_KEY: true,
                HUGGING_FACE_API_KEY: !!process.env.HUGGING_FACE_API_KEY,
                DATABASE_URL: !!process.env.DATABASE_URL
            },
            groqResponse: aiResponse,
            responseTime: 'Fast',
            provider: 'Groq'
        });
        
    } catch (error) {
        console.error('❌ Groq API test failed:', error.message);
        
        let errorDetails = error.message;
        if (error.response) {
            errorDetails = `Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`;
        }
        
        res.status(500).json({
            status: 'ERROR',
            message: 'Groq API test failed',
            error: errorDetails,
            envVars: {
                GROQ_API_KEY: !!process.env.GROQ_API_KEY,
                HUGGING_FACE_API_KEY: !!process.env.HUGGING_FACE_API_KEY,
                DATABASE_URL: !!process.env.DATABASE_URL
            }
        });
    }
});

// Test single FCA article processing
app.get('/debug/test-fca-article', async (req, res) => {
    try {
        console.log('🧪 Testing single FCA article processing with Groq');
        
        const testArticle = {
            title: "FCA Test Article Processing",
            link: "https://www.fca.org.uk/news/press-releases/upper-tribunal-upholds-jes-staley-ban",
            pubDate: new Date().toISOString()
        };
        
        console.log('📰 Testing article:', testArticle.title);
        console.log('🔗 URL:', testArticle.link);
        
        const aiAnalyzer = require('./modules/ai-analyzer');
        const db = require('./database');
        await db.initialize();
        
        console.log('📄 Scraping article content...');
        const content = await aiAnalyzer.scrapeArticleContent(testArticle.link);
        
        if (!content) {
            return res.json({
                status: 'ERROR',
                message: 'Failed to scrape article content'
            });
        }
        
        console.log('✅ Content scraped, length:', content.length);
        console.log('🤖 Starting Groq AI analysis...');
        
        const startTime = Date.now();
        const aiResult = await aiAnalyzer.analyzeContentWithAI(content, testArticle.link);
        const endTime = Date.now();
        
        if (aiResult) {
            res.json({
                status: 'SUCCESS',
                message: 'FCA article processed successfully with Groq!',
                processingTime: (endTime - startTime) + 'ms',
                article: aiResult,
                contentLength: content.length
            });
        } else {
            res.json({
                status: 'ERROR',
                message: 'AI analysis failed',
                processingTime: (endTime - startTime) + 'ms',
                contentLength: content.length
            });
        }
        
    } catch (error) {
        console.error('❌ FCA article test failed:', error);
        res.status(500).json({
            status: 'ERROR',
            message: 'FCA article test failed',
            error: error.message,
            stack: error.stack
        });
    }
});

// Cleanup and reprocess endpoint
app.get('/debug/cleanup-and-reprocess', async (req, res) => {
    try {
        console.log('🧹 Starting cleanup and reprocessing...');
        
        const db = require('./database');
        await db.initialize();
        
        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
        
        const initialResult = await pool.query('SELECT COUNT(*) FROM updates');
        const initialCount = parseInt(initialResult.rows[0].count);
        console.log('📊 Total updates before cleanup:', initialCount);
        
        const deleteResult = await pool.query(`
            DELETE FROM updates 
            WHERE headline = 'N/A' 
            OR impact = 'N/A' 
            OR authority = 'N/A'
            OR headline LIKE '%Welcome to%'
            OR headline LIKE '%test%'
            OR sector = 'N/A'
        `);
        
        console.log('✅ Cleaned up entries:', deleteResult.rowCount);
        
        const cleanResult = await pool.query('SELECT COUNT(*) FROM updates');
        const cleanCount = parseInt(cleanResult.rows[0].count);
        console.log('📊 Updates after cleanup:', cleanCount);
        
        await pool.end();
        
        res.json({
            status: 'SUCCESS',
            message: 'Cleanup completed successfully',
            before: initialCount,
            after: cleanCount,
            deletedEntries: deleteResult.rowCount,
            note: 'Bad data cleaned up. Run refresh to process new articles with fixed AI.'
        });
        
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        res.status(500).json({
            status: 'ERROR',
            error: error.message,
            stack: error.stack
        });
    }
});

// Debug RSS endpoint
app.get('/debug/rss', async (req, res) => {
    try {
        console.log('🔍 RSS Debug endpoint called');
        
        const Parser = require('rss-parser');
        const parser = new Parser();
        
        const parseFCADate = (dateString) => {
            try {
                if (!dateString) return null;
                const cleanDate = dateString.replace(/^[A-Za-z]+,\s*/, '').replace(/\s*-\s*\d{2}:\d{2}$/, '');
                const parsedDate = new Date(cleanDate);
                return isNaN(parsedDate.getTime()) ? null : parsedDate;
            } catch (error) {
                return null;
            }
        };
        
        const feedUrl = 'https://www.fca.org.uk/news/rss.xml';
        console.log('📡 Testing FCA RSS feed:', feedUrl);
        
        const feed = await parser.parseURL(feedUrl);
        console.log('✅ RSS feed fetched successfully');
        console.log('📊 Total items:', feed.items.length);
        
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        
        const allItems = feed.items.slice(0, 10).map(item => {
            const parsedDate = parseFCADate(item.pubDate);
            return {
                title: item.title,
                pubDate: item.pubDate,
                link: item.link,
                dateObj: parsedDate ? parsedDate.toISOString() : null,
                isRecent: parsedDate ? parsedDate >= threeDaysAgo : false,
                daysAgo: parsedDate ? Math.floor((new Date() - parsedDate) / (1000 * 60 * 60 * 24)) : null,
                parseSuccess: parsedDate !== null
            };
        });
        
        const recentItems = allItems.filter(item => item.isRecent);
        
        console.log('📊 Recent items (last 3 days):', recentItems.length);
        
        res.json({
            status: 'SUCCESS',
            feedUrl: feedUrl,
            totalItems: feed.items.length,
            itemsChecked: allItems.length,
            recentItems: recentItems.length,
            threeDaysAgo: threeDaysAgo.toISOString(),
            dateParsingFixed: true,
            sampleItems: allItems,
            recentItemsOnly: recentItems
        });
        
    } catch (error) {
        console.error('❌ RSS debug error:', error);
        res.status(500).json({
            status: 'ERROR',
            error: error.message,
            stack: error.stack
        });
    }
});

// Debug refresh endpoint
app.get('/debug/refresh', async (req, res) => {
    try {
        console.log('Debug refresh endpoint called');
        
        if (!process.env.GROQ_API_KEY) {
            return res.json({ error: 'GROQ_API_KEY not set' });
        }
        
        if (!process.env.DATABASE_URL) {
            return res.json({ error: 'DATABASE_URL not set' });
        }
        
        console.log('Environment variables OK');
        
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
        
        const db = require('./database');
        await db.initialize();
        console.log('Database initialized');
        
        const initialUpdates = await db.get('updates').value();
        console.log('Initial update count:', initialUpdates.length);
        
        console.log('Testing RSS feed fetching...');
        await rssFetcher.fetchAndAnalyzeFeeds();
        
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

// Serve main page with clean interface
app.get('/', (req, res) => {
    try {
        console.log('Root route accessed');
        
        const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>MEMA UK Reg Tracker</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        .header { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 2rem; }
        .title { color: #1e40af; font-size: 2.5rem; font-weight: 700; margin-bottom: 1rem; }
        .status { color: #059669; font-weight: 600; margin-bottom: 1rem; }
        .description { color: #64748b; margin-bottom: 2rem; line-height: 1.6; }
        .button-group { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 2rem; }
        .button { display: inline-block; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 500; transition: all 0.2s; border: none; cursor: pointer; font-size: 0.875rem; }
        .button-primary { background: #3b82f6; color: white; }
        .button-primary:hover { background: #2563eb; }
        .button-success { background: #059669; color: white; }
        .button-success:hover { background: #047857; }
        .button-secondary { background: #6b7280; color: white; }
        .button-secondary:hover { background: #4b5563; }
        .button-warning { background: #f59e0b; color: white; }
        .button-warning:hover { background: #d97706; }
        .button-diagnostic { background: #8b5cf6; color: white; }
        .button-diagnostic:hover { background: #7c3aed; }
        .refresh-section { background: #f1f5f9; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; }
        .refresh-btn { background: #059669; border: none; color: white; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.875rem; }
        .refresh-btn:hover { background: #047857; }
        .refresh-btn:disabled { background: #9ca3af; cursor: not-allowed; }
        .status-section { margin-top: 1rem; }
        .status-indicator { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #059669; margin-right: 0.5rem; }
        .offline { background: #ef4444; }
        .status-text { font-size: 0.875rem; color: #6b7280; }
        .date-info { background: #f8fafc; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; font-size: 0.875rem; color: #6b7280; }
        .info-note { background: #eff6ff; border: 1px solid #bfdbfe; padding: 1.5rem; border-radius: 8px; margin-top: 2rem; }
        .info-title { color: #1e40af; font-weight: 600; margin-bottom: 0.5rem; }
        .info-text { color: #1e40af; font-size: 0.875rem; line-height: 1.5; }
        .grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">MEMA UK Reg Tracker</h1>
            <p class="status">✅ System Operational</p>
            
            <div class="date-info" id="dataInfo">
                Last updated: <span id="lastUpdated">Loading...</span>
            </div>
            
            <p class="description">
                Track regulatory updates from UK financial authorities including FCA, Bank of England, PRA, TPR, SFO, and FATF. 
                The system automatically monitors and categorizes regulatory changes to keep you informed of developments affecting financial services.
            </p>
            
            <div class="button-group grid-3">
                <a href="/dashboard" class="button button-primary">📊 View Dashboard</a>
                <a href="/test" class="button button-secondary">🔧 System Test</a>
                <a href="/debug/database" class="button button-secondary">💾 Database Status</a>
            </div>
            
            <div class="button-group grid-3">
                <a href="/debug/comprehensive-fix" class="button button-diagnostic">🔧 FCA Diagnostic</a>
                <a href="/debug/groq-test" class="button button-secondary">🤖 Test AI</a>
                <a href="/debug/cleanup-and-reprocess" class="button button-warning">🧹 Cleanup Data</a>
            </div>
            
            <div class="refresh-section">
                <button onclick="refreshData()" class="refresh-btn" id="refreshBtn">
                    🔄 Refresh Regulatory Data
                </button>
                
                <div class="status-section" id="status">
                    <span class="status-indicator" id="indicator"></span>
                    <span class="status-text" id="statusText">Ready</span>
                </div>
            </div>
            
            <div class="info-note">
                <div class="info-title">Regulatory Sources Monitored</div>
                <div class="info-text">
                    Financial Conduct Authority (FCA) • Bank of England • Prudential Regulation Authority (PRA) • 
                    The Pensions Regulator (TPR) • Serious Fraud Office (SFO) • Financial Action Task Force (FATF)
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
                    updateLastRefreshed();
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
        
        function updateLastRefreshed() {
            const now = new Date();
            const formatted = now.toLocaleDateString('en-GB') + ' at ' + now.toLocaleTimeString('en-GB', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            document.getElementById('lastUpdated').textContent = formatted;
        }
        
        async function checkStatus() {
            try {
                const response = await fetch('/test');
                const result = await response.json();
                if (result.database === 'connected') {
                    document.getElementById('statusText').textContent = 'System Online';
                    document.getElementById('indicator').className = 'status-indicator';
                }
                
                // Get data count and last update time
                const dataResponse = await fetch('/api/updates');
                const data = await dataResponse.json();
                const allUpdates = Object.values(data).flat();
                
                if (allUpdates.length > 0) {
                    const latestDate = new Date(Math.max(...allUpdates.map(u => new Date(u.fetchedDate))));
                    const formatted = latestDate.toLocaleDateString('en-GB') + ' at ' + latestDate.toLocaleTimeString('en-GB', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    });
                    document.getElementById('lastUpdated').textContent = formatted;
                } else {
                    document.getElementById('lastUpdated').textContent = 'No data yet - click refresh to start';
                }
                
            } catch (error) {
                document.getElementById('statusText').textContent = 'System Offline';
                document.getElementById('indicator').className = 'status-indicator offline';
                document.getElementById('lastUpdated').textContent = 'Unknown';
            }
        }
        
        // Check status on page load
        checkStatus();
        
        // Auto-refresh status every 30 seconds
        setInterval(checkStatus, 30000);
    </script>
</body>
</html>`;
        res.send(htmlContent);
    } catch (error) {
        console.error('Error serving HTML:', error);
        res.status(500).json({ 
            error: 'Failed to serve HTML file',
            details: error.message
        });
    }
});

// API endpoints
app.get('/api/updates', async (req, res) => {
    try {
        console.log('API updates endpoint called');
        
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
        
        if (Object.keys(groupedData).length === 0) {
            groupedData.General = [{
                headline: "Welcome to MEMA UK Reg Tracker",
                impact: "Your database is now set up and ready. Click 'Refresh Regulatory Data' to start fetching real regulatory updates from UK financial regulators.",
                area: "System Setup",
                authority: "System",
                impactLevel: "Informational",
                urgency: "Low",
                sector: "General",
                keyDates: "None specified",
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
        
        if (!process.env.GROQ_API_KEY) {
            console.warn('GROQ_API_KEY not set');
            return res.status(400).json({ 
                error: 'GROQ_API_KEY environment variable not set. Please add it in Vercel settings.' 
            });
        }
        
        if (!process.env.DATABASE_URL) {
            console.warn('DATABASE_URL not set');
            return res.status(400).json({ 
                error: 'DATABASE_URL environment variable not set. Please add your database URL in Vercel settings.' 
            });
        }
        
        console.log('✅ Environment variables present');
        
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
        
        const db = require('./database');
        await db.initialize();
        console.log('✅ Database initialized for refresh');
        
        const initialUpdates = await db.get('updates').value();
        console.log('📊 Initial update count:', initialUpdates.length);
        
        console.log('🔄 Starting RSS feed analysis...');
        await rssFetcher.fetchAndAnalyzeFeeds();
        
        console.log('🔄 Starting website scraping...');
        await rssFetcher.scrapeAndAnalyzeWebsites();
        
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
            note: 'Data stored persistently with AI analysis'
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
        availableRoutes: ['/', '/dashboard', '/test', '/health', '/api/updates', 'POST /api/refresh', '/debug/comprehensive-fix', '/debug/database', '/debug/groq-test', '/debug/cleanup-and-reprocess']
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

console.log('Starting MEMA UK Reg Tracker...');
console.log('Node version:', process.version);
console.log('Environment variables check:');
console.log('- PORT:', PORT);
console.log('- GROQ_API_KEY present:', !!process.env.GROQ_API_KEY);
console.log('- DATABASE_URL present:', !!process.env.DATABASE_URL);
console.log('- Working directory:', process.cwd());

app.listen(PORT, () => {
    console.log('Server is running on port ' + PORT);
    console.log('MEMA UK Reg Tracker started successfully!');
});

module.exports = app;
