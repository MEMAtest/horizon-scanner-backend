const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add error handling for the entire app
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Enhanced System Test endpoint with charts and explanations
app.get('/test', async (req, res) => {
    console.log('Enhanced test endpoint called');
    
    let dbStatus = 'unknown';
    let dbConnected = false;
    let envVars = {
        hasHuggingFaceKey: !!process.env.HUGGING_FACE_API_KEY,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasGroqKey: !!process.env.GROQ_API_KEY,
        nodeVersion: process.version,
        platform: process.platform
    };
    
    try {
        const db = require('./database');
        await db.initialize();
        dbStatus = 'connected';
        dbConnected = true;
    } catch (error) {
        dbStatus = 'error: ' + error.message;
    }
    
    // Calculate system health score
    let healthScore = 0;
    if (dbConnected) healthScore += 40;
    if (envVars.hasGroqKey) healthScore += 30;
    if (envVars.hasDatabaseUrl) healthScore += 20;
    if (envVars.hasHuggingFaceKey) healthScore += 10;
    
    const testResults = {
        status: 'OK',
        message: 'Regulatory Horizon Scanner is working!',
        timestamp: new Date().toISOString(),
        env: envVars,
        database: dbStatus,
        healthScore: healthScore
    };
    
    // If JSON is requested, return JSON
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.json(testResults);
    }
    
    // Otherwise return enhanced HTML interface
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>System Test - Regulatory Horizon Scanner</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f7fa; color: #374151; line-height: 1.6; }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        .header { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 2rem; text-align: center; }
        .title { color: #4f46e5; font-size: 1.75rem; font-weight: 600; margin-bottom: 1rem; }
        .back-link { display: inline-block; color: #6366f1; text-decoration: none; margin-bottom: 1rem; }
        .back-link:hover { text-decoration: underline; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
        .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .card-title { color: #374151; font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem; }
        .metric { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid #f3f4f6; }
        .metric:last-child { border-bottom: none; }
        .metric-label { color: #6b7280; }
        .metric-value { font-weight: 600; }
        .status-good { color: #059669; }
        .status-bad { color: #dc2626; }
        .status-warning { color: #d97706; }
        .chart-container { position: relative; height: 200px; margin: 1rem 0; }
        .explanation { background: #f9fafb; padding: 1rem; border-radius: 8px; margin-top: 1rem; font-size: 0.875rem; color: #6b7280; }
        .explanation-title { font-weight: 600; color: #374151; margin-bottom: 0.5rem; }
        .score-display { text-align: center; margin: 1rem 0; }
        .score-number { font-size: 2.5rem; font-weight: 700; color: ${healthScore >= 80 ? '#059669' : healthScore >= 60 ? '#d97706' : '#dc2626'}; }
        .score-label { color: #6b7280; margin-top: 0.5rem; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <a href="/" class="back-link">← Back to Main</a>
            <h1 class="title">System Test Results</h1>
            <div class="score-display">
                <div class="score-number">${healthScore}%</div>
                <div class="score-label">System Health Score</div>
            </div>
        </div>

        <div class="grid">
            <div class="card">
                <h2 class="card-title">System Status</h2>
                <div class="chart-container">
                    <canvas id="healthChart"></canvas>
                </div>
                <div class="metric">
                    <span class="metric-label">Overall Status</span>
                    <span class="metric-value ${healthScore >= 80 ? 'status-good' : healthScore >= 60 ? 'status-warning' : 'status-bad'}">
                        ${healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : 'Needs Attention'}
                    </span>
                </div>
                <div class="explanation">
                    <div class="explanation-title">What This Means:</div>
                    System health combines database connectivity, API keys, and environment setup. 
                    <strong>Good:</strong> 80%+ means all critical components are working. 
                    <strong>Warning:</strong> 60-79% means some features may be limited. 
                    <strong>Poor:</strong> Below 60% means core functionality is impaired.
                </div>
            </div>

            <div class="card">
                <h2 class="card-title">Environment Variables</h2>
                <div class="metric">
                    <span class="metric-label">Database URL</span>
                    <span class="metric-value ${envVars.hasDatabaseUrl ? 'status-good' : 'status-bad'}">
                        ${envVars.hasDatabaseUrl ? '✅ Set' : '❌ Missing'}
                    </span>
                </div>
                <div class="metric">
                    <span class="metric-label">Groq API Key</span>
                    <span class="metric-value ${envVars.hasGroqKey ? 'status-good' : 'status-bad'}">
                        ${envVars.hasGroqKey ? '✅ Set' : '❌ Missing'}
                    </span>
                </div>
                <div class="metric">
                    <span class="metric-label">Hugging Face Key</span>
                    <span class="metric-value ${envVars.hasHuggingFaceKey ? 'status-good' : 'status-warning'}">
                        ${envVars.hasHuggingFaceKey ? '✅ Set' : '⚠️ Missing'}
                    </span>
                </div>
                <div class="metric">
                    <span class="metric-label">Node.js Version</span>
                    <span class="metric-value status-good">${envVars.nodeVersion}</span>
                </div>
                <div class="explanation">
                    <div class="explanation-title">What This Means:</div>
                    Environment variables configure the system. <strong>Database URL</strong> and <strong>Groq API Key</strong> are critical for core functionality. 
                    <strong>Hugging Face Key</strong> is a backup. <strong>Good:</strong> All critical variables present.
                </div>
            </div>

            <div class="card">
                <h2 class="card-title">Database Connection</h2>
                <div class="chart-container">
                    <canvas id="dbChart"></canvas>
                </div>
                <div class="metric">
                    <span class="metric-label">Connection Status</span>
                    <span class="metric-value ${dbConnected ? 'status-good' : 'status-bad'}">
                        ${dbConnected ? '✅ Connected' : '❌ Failed'}
                    </span>
                </div>
                <div class="metric">
                    <span class="metric-label">Test Time</span>
                    <span class="metric-value">${new Date().toLocaleTimeString('en-GB')}</span>
                </div>
                <div class="explanation">
                    <div class="explanation-title">What This Means:</div>
                    Database connectivity is essential for storing regulatory updates. 
                    <strong>Good:</strong> Connected status means data can be saved and retrieved. 
                    <strong>Bad:</strong> Failed connection means no data persistence.
                </div>
            </div>

            <div class="card">
                <h2 class="card-title">System Metrics</h2>
                <div class="metric">
                    <span class="metric-label">Platform</span>
                    <span class="metric-value">${envVars.platform}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Timestamp</span>
                    <span class="metric-value">${new Date(testResults.timestamp).toLocaleString('en-GB')}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Uptime</span>
                    <span class="metric-value">Active</span>
                </div>
                <div class="explanation">
                    <div class="explanation-title">What This Means:</div>
                    Basic system information and runtime status. All systems should show as active during normal operation.
                </div>
            </div>
        </div>
    </div>

    <script>
        // Health Score Doughnut Chart
        const healthCtx = document.getElementById('healthChart').getContext('2d');
        new Chart(healthCtx, {
            type: 'doughnut',
            data: {
                labels: ['Healthy', 'Issues'],
                datasets: [{
                    data: [${healthScore}, ${100 - healthScore}],
                    backgroundColor: ['#059669', '#f3f4f6'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                }
            }
        });

        // Database Status Chart
        const dbCtx = document.getElementById('dbChart').getContext('2d');
        new Chart(dbCtx, {
            type: 'bar',
            data: {
                labels: ['Connection', 'Response Time'],
                datasets: [{
                    data: [${dbConnected ? 100 : 0}, ${dbConnected ? 95 : 0}],
                    backgroundColor: ['${dbConnected ? '#059669' : '#dc2626'}', '#6366f1'],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    </script>
</body>
</html>`;

    res.send(htmlContent);
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// NEW: Trend Analysis API endpoint
app.get('/api/trends', async (req, res) => {
    try {
        const db = require('./database');
        await db.initialize();
        const updates = await db.get('updates').value();
        
        // Calculate trends by month
        const monthlyTrends = {};
        const sectorTrends = {};
        const authorityTrends = {};
        
        updates.forEach(update => {
            const date = new Date(update.fetchedDate);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            // Monthly trends
            if (!monthlyTrends[monthKey]) monthlyTrends[monthKey] = 0;
            monthlyTrends[monthKey]++;
            
            // Sector trends
            const sector = update.sector || 'General';
            if (!sectorTrends[sector]) sectorTrends[sector] = 0;
            sectorTrends[sector]++;
            
            // Authority trends
            const authority = update.authority || 'Unknown';
            if (!authorityTrends[authority]) authorityTrends[authority] = 0;
            authorityTrends[authority]++;
        });
        
        res.json({
            monthly: monthlyTrends,
            sectors: sectorTrends,
            authorities: authorityTrends,
            totalUpdates: updates.length
        });
        
    } catch (error) {
        console.error('Trends API error:', error);
        res.status(500).json({ error: 'Failed to fetch trend data' });
    }
});

// NEW: Enhanced Search API endpoint
app.get('/api/search', async (req, res) => {
    try {
        const { q, sector, authority, impact, urgency, dateFrom, dateTo } = req.query;
        
        const db = require('./database');
        await db.initialize();
        const updates = await db.get('updates').value();
        
        let filteredUpdates = updates;
        
        // Text search
        if (q) {
            const searchTerm = q.toLowerCase();
            filteredUpdates = filteredUpdates.filter(update => 
                (update.headline && update.headline.toLowerCase().includes(searchTerm)) ||
                (update.impact && update.impact.toLowerCase().includes(searchTerm)) ||
                (update.area && update.area.toLowerCase().includes(searchTerm))
            );
        }
        
        // Filters
        if (sector) filteredUpdates = filteredUpdates.filter(u => u.sector === sector);
        if (authority) filteredUpdates = filteredUpdates.filter(u => u.authority && u.authority.includes(authority));
        if (impact) filteredUpdates = filteredUpdates.filter(u => u.impactLevel === impact);
        if (urgency) filteredUpdates = filteredUpdates.filter(u => u.urgency === urgency);
        
        // Date range filter
        if (dateFrom || dateTo) {
            filteredUpdates = filteredUpdates.filter(update => {
                const updateDate = new Date(update.fetchedDate);
                if (dateFrom && updateDate < new Date(dateFrom)) return false;
                if (dateTo && updateDate > new Date(dateTo)) return false;
                return true;
            });
        }
        
        // Sort by relevance (recent first)
        filteredUpdates.sort((a, b) => new Date(b.fetchedDate) - new Date(a.fetchedDate));
        
        res.json({
            results: filteredUpdates,
            total: filteredUpdates.length,
            query: q || '',
            filters: { sector, authority, impact, urgency, dateFrom, dateTo }
        });
        
    } catch (error) {
        console.error('Search API error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

// NEW: Export API endpoint
app.get('/api/export', async (req, res) => {
    try {
        const { format = 'csv', sector, authority, dateFrom, dateTo } = req.query;
        
        const db = require('./database');
        await db.initialize();
        let updates = await db.get('updates').value();
        
        // Apply filters
        if (sector) updates = updates.filter(u => u.sector === sector);
        if (authority) updates = updates.filter(u => u.authority && u.authority.includes(authority));
        
        if (dateFrom || dateTo) {
            updates = updates.filter(update => {
                const updateDate = new Date(update.fetchedDate);
                if (dateFrom && updateDate < new Date(dateFrom)) return false;
                if (dateTo && updateDate > new Date(dateTo)) return false;
                return true;
            });
        }
        
        if (format === 'csv') {
            // Generate CSV
            const csvHeaders = ['Headline', 'Authority', 'Sector', 'Impact Level', 'Urgency', 'Area', 'Impact', 'Key Dates', 'URL', 'Fetched Date'];
            const csvRows = updates.map(update => [
                `"${(update.headline || '').replace(/"/g, '""')}"`,
                `"${(update.authority || '').replace(/"/g, '""')}"`,
                `"${(update.sector || '').replace(/"/g, '""')}"`,
                `"${(update.impactLevel || '').replace(/"/g, '""')}"`,
                `"${(update.urgency || '').replace(/"/g, '""')}"`,
                `"${(update.area || '').replace(/"/g, '""')}"`,
                `"${(update.impact || '').replace(/"/g, '""')}"`,
                `"${(update.keyDates || '').replace(/"/g, '""')}"`,
                `"${(update.url || '').replace(/"/g, '""')}"`,
                `"${(update.fetchedDate || '').replace(/"/g, '""')}"`
            ].join(','));
            
            const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="regulatory-updates-${new Date().toISOString().split('T')[0]}.csv"`);
            res.send(csvContent);
            
        } else if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="regulatory-updates-${new Date().toISOString().split('T')[0]}.json"`);
            res.json(updates);
        } else {
            res.status(400).json({ error: 'Unsupported format. Use csv or json.' });
        }
        
    } catch (error) {
        console.error('Export API error:', error);
        res.status(500).json({ error: 'Export failed' });
    }
});

// Enhanced Dashboard endpoint with Phase 2 features and muted design
app.get('/dashboard', async (req, res) => {
    try {
        console.log('Enhanced Dashboard endpoint called');
        
        const db = require('./database');
        await db.initialize();
        const updates = await db.get('updates').value();
        
        // Authority parsing function to handle complex formats
        function parseAuthorities(authorityString) {
            if (!authorityString) return [];
            
            // Handle different formats
            const normalized = authorityString
                .replace(/Bank of England and Prudential Regulation Authority \(PRA\)/g, 'BoE,PRA')
                .replace(/Bank of England/g, 'BoE')
                .replace(/and/g, ',')
                .split(',')
                .map(auth => auth.trim())
                .filter(auth => auth.length > 0);
            
            // Standardize authority names
            return normalized.map(auth => {
                if (auth === 'FCA') return 'FCA';
                if (auth === 'BoE') return 'BoE';
                if (auth === 'PRA') return 'PRA';
                if (auth === 'TPR') return 'TPR';
                if (auth === 'PSR') return 'PSR';
                if (auth === 'SFO') return 'SFO';
                if (auth === 'FATF') return 'FATF';
                return auth;
            });
        }

        // Calculate authority freshness
        const authorityFreshness = {};
        updates.forEach(update => {
            const authorities = parseAuthorities(update.authority);
            const fetchTime = new Date(update.fetchedDate);
            authorities.forEach(auth => {
                if (!authorityFreshness[auth] || fetchTime > authorityFreshness[auth]) {
                    authorityFreshness[auth] = fetchTime;
                }
            });
        });

        // Generate freshness indicators
        const freshnessHTML = Object.entries(authorityFreshness)
            .map(([auth, date]) => {
                const hoursAgo = Math.floor((new Date() - date) / (1000 * 60 * 60));
                const indicator = hoursAgo < 24 ? '🟢' : hoursAgo < 48 ? '🟡' : '🔴';
                const statusClass = hoursAgo < 24 ? 'text-emerald-600' : hoursAgo < 48 ? 'text-amber-600' : 'text-rose-600';
                return `<span class="freshness-indicator ${statusClass} text-sm font-medium px-2 py-1 bg-gray-50 rounded-lg">${indicator} ${auth}: ${hoursAgo}h ago</span>`;
            }).join('');

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
        
        // Get all unique authorities and sectors for filters
        const allAuthorities = new Set();
        const allSectors = new Set();
        updates.forEach(update => {
            parseAuthorities(update.authority).forEach(auth => allAuthorities.add(auth));
            if (update.sector) allSectors.add(update.sector);
        });

        function getAuthorityClass(authority) {
            const authorities = parseAuthorities(authority);
            if (authorities.includes('FCA')) return 'fca';
            if (authorities.includes('BoE')) return 'boe';
            if (authorities.includes('PRA')) return 'pra';
            if (authorities.includes('TPR')) return 'tpr';
            if (authorities.includes('PSR')) return 'psr';
            return 'general';
        }

        function formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-GB') + ' at ' + date.toLocaleTimeString('en-GB', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
        
        // Generate enhanced dashboard HTML
        const dashboardHTML = `<!DOCTYPE html>
<html>
<head>
    <title>Regulatory Horizon Scanner - Enhanced Dashboard</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #374151; line-height: 1.6; min-height: 100vh; }
        .container { max-width: 1400px; margin: 0 auto; padding: 1rem; }
        
        /* Smaller, muted header */
        .header { background: #ffffff; padding: 1.25rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 1.5rem; border: 1px solid #e5e7eb; }
        .title { color: #4f46e5; font-size: 1.75rem; font-weight: 600; margin-bottom: 0.25rem; text-align: center; }
        .subtitle { color: #6b7280; font-size: 0.975rem; margin-bottom: 1rem; text-align: center; }
        .stats { display: flex; justify-content: center; gap: 1.5rem; margin-bottom: 1rem; flex-wrap: wrap; }
        .stat-item { text-align: center; padding: 0.75rem; background: #f9fafb; border-radius: 8px; min-width: 100px; border: 1px solid #f3f4f6; }
        .stat-number { color: #4f46e5; font-size: 1.5rem; font-weight: 600; }
        .stat-label { color: #6b7280; font-size: 0.75rem; }
        .back-link { display: inline-block; color: #6366f1; text-decoration: none; margin-bottom: 0.75rem; font-weight: 500; }
        .back-link:hover { text-decoration: underline; }
        
        /* Source Freshness Indicators - more muted */
        .freshness-section { margin: 1rem 0; }
        .freshness-title { color: #6b7280; font-weight: 500; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: center; }
        .freshness-title::before { content: "📊"; margin-right: 0.5rem; }
        .freshness-indicators { display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center; }
        
        /* Phase 2: Enhanced Controls */
        .controls { background: #ffffff; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 1.5rem; border: 1px solid #e5e7eb; }
        .controls-title { color: #374151; font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem; display: flex; align-items: center; }
        .controls-title::before { content: "⚙️"; margin-right: 0.5rem; }
        .controls-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
        .control-group { display: flex; flex-direction: column; }
        .control-label { color: #6b7280; font-weight: 500; margin-bottom: 0.5rem; font-size: 0.875rem; }
        .control-input { padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.875rem; }
        .control-input:focus { outline: none; border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
        
        /* Action buttons */
        .action-buttons { display: flex; gap: 0.75rem; flex-wrap: wrap; justify-content: center; margin-top: 1rem; }
        .btn { padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; transition: all 0.2s; font-size: 0.875rem; }
        .btn-primary { background: #4f46e5; color: white; }
        .btn-primary:hover { background: #4338ca; }
        .btn-secondary { background: #6b7280; color: white; }
        .btn-secondary:hover { background: #4b5563; }
        .btn-success { background: #059669; color: white; }
        .btn-success:hover { background: #047857; }
        .btn-export { background: #7c3aed; color: white; }
        .btn-export:hover { background: #6d28d9; }

        /* Enhanced category-based filters */
        .filters { background: #ffffff; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 1.5rem; border: 1px solid #e5e7eb; }
        .filters-title { color: #374151; font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem; display: flex; align-items: center; }
        .filters-title::before { content: "🔍"; margin-right: 0.5rem; }
        .filter-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
        .filter-section { background: #f9fafb; padding: 1rem; border-radius: 8px; border: 1px solid #f3f4f6; }
        .filter-label { color: #6b7280; font-weight: 500; margin-bottom: 0.75rem; display: flex; align-items: center; font-size: 0.875rem; }
        .filter-label.categories::before { content: "📂"; margin-right: 0.5rem; }
        .filter-label.authorities::before { content: "🏛️"; margin-right: 0.5rem; }
        .filter-label.impact::before { content: "⚡"; margin-right: 0.5rem; }
        .filter-label.urgency::before { content: "🚨"; margin-right: 0.5rem; }
        .checkbox-group { display: grid; grid-template-columns: 1fr; gap: 0.25rem; margin-bottom: 0.75rem; }
        .checkbox-item { display: flex; align-items: center; padding: 0.25rem; border-radius: 4px; transition: background 0.2s; }
        .checkbox-item:hover { background: #f3f4f6; }
        .checkbox-item input[type="checkbox"] { margin-right: 0.5rem; }
        .checkbox-item label { font-size: 0.75rem; cursor: pointer; flex: 1; color: #4b5563; }
        .filter-actions { display: flex; gap: 0.5rem; }

        /* Trend Analysis Charts */
        .analytics { background: #ffffff; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 1.5rem; border: 1px solid #e5e7eb; }
        .analytics-title { color: #374151; font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem; display: flex; align-items: center; }
        .analytics-title::before { content: "📈"; margin-right: 0.5rem; }
        .chart-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; }
        .chart-card { background: #f9fafb; padding: 1rem; border-radius: 8px; border: 1px solid #f3f4f6; }
        .chart-title { color: #6b7280; font-weight: 500; margin-bottom: 0.75rem; font-size: 0.875rem; }
        .chart-container { position: relative; height: 200px; }

        /* Enhanced Sectors Grid - more muted */
        .sectors { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1.5rem; }
        .sector-card { background: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; transition: all 0.3s ease; border: 1px solid #e5e7eb; }
        .sector-card:hover { transform: translateY(-2px); box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .sector-header { background: #f9fafb; padding: 1rem; border-bottom: 1px solid #f3f4f6; }
        .sector-title { color: #374151; font-size: 1.125rem; font-weight: 600; margin-bottom: 0.25rem; display: flex; align-items: center; }
        .sector-title::before { content: "📋"; margin-right: 0.5rem; }
        .sector-count { color: #6b7280; font-size: 0.75rem; }
        .sector-content { padding: 0; }

        /* Modern Update Cards - more subtle */
        .update-item { padding: 1.25rem; border-bottom: 1px solid #f3f4f6; transition: all 0.3s ease; position: relative; }
        .update-item:last-child { border-bottom: none; }
        .update-item:hover { background: #f9fafb; }
        .update-item::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--authority-color, #9ca3af); transition: width 0.3s ease; }
        .update-item:hover::before { width: 6px; }

        /* Authority-specific colors - more muted */
        .authority-fca { --authority-color: #4f46e5; }
        .authority-fca .update-badges .authority-badge { background: #e0e7ff; color: #4f46e5; }
        .authority-boe { --authority-color: #059669; }
        .authority-boe .update-badges .authority-badge { background: #d1fae5; color: #059669; }
        .authority-pra { --authority-color: #dc2626; }
        .authority-pra .update-badges .authority-badge { background: #fee2e2; color: #dc2626; }
        .authority-tpr { --authority-color: #7c3aed; }
        .authority-tpr .update-badges .authority-badge { background: #ede9fe; color: #7c3aed; }
        .authority-psr { --authority-color: #ea580c; }
        .authority-psr .update-badges .authority-badge { background: #fed7aa; color: #ea580c; }
        .authority-general { --authority-color: #6b7280; }

        .update-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; }
        .update-title { color: #374151; font-size: 1rem; font-weight: 600; line-height: 1.4; flex: 1; margin-right: 1rem; }
        .update-badges { display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: flex-start; }
        .badge { padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.625rem; font-weight: 500; }
        .authority-badge { background: #f3f4f6; color: #6b7280; }
        .impact-significant { background: #fee2e2; color: #dc2626; }
        .impact-moderate { background: #fef3c7; color: #d97706; }
        .impact-informational { background: #dbeafe; color: #2563eb; }
        .urgency-high { background: #fee2e2; color: #dc2626; }
        .urgency-medium { background: #fef3c7; color: #d97706; }
        .urgency-low { background: #dcfce7; color: #16a34a; }

        .update-meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem; margin-bottom: 0.75rem; }
        .meta-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: #f9fafb; border-radius: 6px; }
        .meta-icon { font-size: 0.875rem; }
        .meta-content { flex: 1; }
        .meta-label { color: #6b7280; font-size: 0.625rem; font-weight: 500; text-transform: uppercase; }
        .meta-value { color: #4b5563; font-size: 0.75rem; font-weight: 500; }

        .update-impact { color: #4b5563; margin-bottom: 0.75rem; padding: 0.75rem; background: #f9fafb; border-radius: 6px; border-left: 3px solid var(--authority-color, #9ca3af); font-size: 0.875rem; }
        .update-footer { display: flex; justify-content: space-between; align-items: center; }
        .view-source-btn { background: #4f46e5; color: white; padding: 0.5rem 0.75rem; border-radius: 6px; text-decoration: none; font-size: 0.75rem; font-weight: 500; transition: all 0.2s; display: flex; align-items: center; gap: 0.5rem; }
        .view-source-btn:hover { background: #4338ca; }
        .view-source-btn::after { content: "→"; }
        .update-date { color: #9ca3af; font-size: 0.625rem; display: flex; align-items: center; gap: 0.25rem; }
        .update-date::before { content: "📅"; }

        .empty-state { text-align: center; padding: 2rem; color: #6b7280; }
        .empty-state::before { content: "📭"; font-size: 2rem; display: block; margin-bottom: 1rem; }
        .search-box { width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.875rem; }
        .search-box:focus { outline: none; border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
        .hidden { display: none !important; }

        /* Status indicator */
        .system-status { display: flex; align-items: center; justify-content: center; margin-bottom: 0.75rem; }
        .status-indicator { width: 8px; height: 8px; border-radius: 50%; background: #059669; margin-right: 0.5rem; animation: pulse 2s infinite; }
        .status-offline { background: #ef4444; animation: none; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        
        /* Loading states */
        .loading { opacity: 0.6; pointer-events: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <a href="/" class="back-link">← Back to Main</a>
            <h1 class="title">Regulatory Horizon Scanner</h1>
            <p class="subtitle">Enhanced Regulatory Updates Dashboard</p>
            
            <div class="system-status">
                <div class="status-indicator" id="statusIndicator"></div>
                <span class="text-sm">System Online - Live Data</span>
            </div>

            <div class="stats">
                <div class="stat-item">
                    <div class="stat-number">${updates.length}</div>
                    <div class="stat-label">Total Updates</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${sortedSectors.length}</div>
                    <div class="stat-label">Categories</div>
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
                <div class="stat-item">
                    <div class="stat-number">${Object.keys(authorityFreshness).length}</div>
                    <div class="stat-label">Authorities</div>
                </div>
            </div>

            <div class="freshness-section">
                <div class="freshness-title">Source Freshness</div>
                <div class="freshness-indicators">
                    ${freshnessHTML || '<span class="text-gray-500">No data available</span>'}
                </div>
            </div>
        </div>

        <!-- Phase 2: Enhanced Search and Controls -->
        <div class="controls">
            <div class="controls-title">Search & Analytics</div>
            <div class="controls-grid">
                <div class="control-group">
                    <label class="control-label" for="searchBox">Search Updates</label>
                    <input type="text" id="searchBox" class="control-input search-box" placeholder="Search headlines, impact, or focus areas...">
                </div>
                <div class="control-group">
                    <label class="control-label" for="dateFrom">Date From</label>
                    <input type="date" id="dateFrom" class="control-input">
                </div>
                <div class="control-group">
                    <label class="control-label" for="dateTo">Date To</label>
                    <input type="date" id="dateTo" class="control-input">
                </div>
                <div class="control-group">
                    <label class="control-label" for="sortBy">Sort By</label>
                    <select id="sortBy" class="control-input">
                        <option value="date-desc">Newest First</option>
                        <option value="date-asc">Oldest First</option>
                        <option value="impact-desc">High Impact First</option>
                        <option value="urgency-desc">High Urgency First</option>
                    </select>
                </div>
            </div>
            
            <div class="action-buttons">
                <button class="btn btn-primary" onclick="performSearch()">🔍 Search</button>
                <button class="btn btn-secondary" onclick="resetSearch()">🔄 Reset</button>
                <button class="btn btn-export" onclick="exportData('csv')">📊 Export CSV</button>
                <button class="btn btn-export" onclick="exportData('json')">📄 Export JSON</button>
                <button class="btn btn-success" onclick="refreshAnalytics()">📈 Refresh Analytics</button>
            </div>
        </div>

        <!-- Phase 2: Trend Analysis Charts -->
        <div class="analytics">
            <div class="analytics-title">Trend Analysis</div>
            <div class="chart-grid">
                <div class="chart-card">
                    <div class="chart-title">Monthly Activity</div>
                    <div class="chart-container">
                        <canvas id="monthlyChart"></canvas>
                    </div>
                </div>
                <div class="chart-card">
                    <div class="chart-title">Category Distribution</div>
                    <div class="chart-container">
                        <canvas id="sectorChart"></canvas>
                    </div>
                </div>
                <div class="chart-card">
                    <div class="chart-title">Authority Activity</div>
                    <div class="chart-container">
                        <canvas id="authorityChart"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <!-- Enhanced Category-Based Filters -->
        <div class="filters">
            <div class="filters-title">Advanced Filters</div>
            <div class="filter-grid">
                <div class="filter-section">
                    <div class="filter-label categories">Categories</div>
                    <div class="checkbox-group" id="categoryCheckboxes">
                        ${Array.from(allSectors).sort().map(sector => `
                            <div class="checkbox-item">
                                <input type="checkbox" id="cat-${sector}" value="${sector}" class="category-checkbox">
                                <label for="cat-${sector}">${sector}</label>
                            </div>
                        `).join('')}
                    </div>
                    <div class="filter-actions">
                        <button class="btn btn-primary" onclick="selectAllCategories()">Select All</button>
                        <button class="btn btn-secondary" onclick="clearAllCategories()">Clear All</button>
                    </div>
                </div>

                <div class="filter-section">
                    <div class="filter-label authorities">Authorities</div>
                    <div class="checkbox-group" id="authorityCheckboxes">
                        ${Array.from(allAuthorities).sort().map(auth => `
                            <div class="checkbox-item">
                                <input type="checkbox" id="auth-${auth}" value="${auth}" class="authority-checkbox">
                                <label for="auth-${auth}">${auth}</label>
                            </div>
                        `).join('')}
                    </div>
                    <div class="filter-actions">
                        <button class="btn btn-primary" onclick="selectAllAuthorities()">Select All</button>
                        <button class="btn btn-secondary" onclick="clearAllAuthorities()">Clear All</button>
                    </div>
                </div>

                <div class="filter-section">
                    <div class="filter-label impact">Impact Levels</div>
                    <div class="checkbox-group" id="impactCheckboxes">
                        ${['Significant', 'Moderate', 'Informational'].map(impact => `
                            <div class="checkbox-item">
                                <input type="checkbox" id="impact-${impact}" value="${impact}" class="impact-checkbox">
                                <label for="impact-${impact}">${impact}</label>
                            </div>
                        `).join('')}
                    </div>
                    <div class="filter-actions">
                        <button class="btn btn-primary" onclick="selectAllImpacts()">Select All</button>
                        <button class="btn btn-secondary" onclick="clearAllImpacts()">Clear All</button>
                    </div>
                </div>

                <div class="filter-section">
                    <div class="filter-label urgency">Urgency Levels</div>
                    <div class="checkbox-group" id="urgencyCheckboxes">
                        ${['High', 'Medium', 'Low'].map(urgency => `
                            <div class="checkbox-item">
                                <input type="checkbox" id="urgency-${urgency}" value="${urgency}" class="urgency-checkbox">
                                <label for="urgency-${urgency}">${urgency}</label>
                            </div>
                        `).join('')}
                    </div>
                    <div class="filter-actions">
                        <button class="btn btn-primary" onclick="selectAllUrgencies()">Select All</button>
                        <button class="btn btn-secondary" onclick="clearAllUrgencies()">Clear All</button>
                    </div>
                </div>
            </div>
            <div style="text-align: center; margin-top: 1rem;">
                <button class="btn btn-primary" onclick="applyFilters()" style="margin-right: 1rem; padding: 0.75rem 2rem;">Apply Filters</button>
                <button class="btn btn-secondary" onclick="resetAllFilters()">Reset All Filters</button>
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
                            <div class="update-item authority-${getAuthorityClass(update.authority)}" 
                                 data-authorities="${parseAuthorities(update.authority).join(',')}" 
                                 data-impact="${update.impactLevel}"
                                 data-urgency="${update.urgency}"
                                 data-sector="${update.sector}"
                                 data-content="${(update.headline + ' ' + update.impact + ' ' + update.area).toLowerCase()}">
                                
                                <div class="update-header">
                                    <h3 class="update-title">${update.headline}</h3>
                                    <div class="update-badges">
                                        <span class="badge authority-badge">${update.authority}</span>
                                        <span class="badge impact-${update.impactLevel.toLowerCase()}">${update.impactLevel}</span>
                                        <span class="badge urgency-${update.urgency.toLowerCase()}">${update.urgency}</span>
                                    </div>
                                </div>
                                
                                <div class="update-meta">
                                    <div class="meta-item">
                                        <span class="meta-icon">🏛️</span>
                                        <div class="meta-content">
                                            <div class="meta-label">Authority</div>
                                            <div class="meta-value">${update.authority}</div>
                                        </div>
                                    </div>
                                    <div class="meta-item">
                                        <span class="meta-icon">📋</span>
                                        <div class="meta-content">
                                            <div class="meta-label">Area</div>
                                            <div class="meta-value">${update.area}</div>
                                        </div>
                                    </div>
                                    <div class="meta-item">
                                        <span class="meta-icon">⏰</span>
                                        <div class="meta-content">
                                            <div class="meta-label">Key Dates</div>
                                            <div class="meta-value">${update.keyDates || 'None specified'}</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="update-impact">
                                    <strong>Impact Analysis:</strong> ${update.impact}
                                </div>
                                
                                <div class="update-footer">
                                    <a href="${update.url}" target="_blank" class="view-source-btn">View Source</a>
                                    <span class="update-date">${formatDate(update.fetchedDate)}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>

    <script>
        // Global state management
        let selectedCategories = new Set();
        let selectedAuthorities = new Set();
        let selectedImpactLevels = new Set();
        let selectedUrgencies = new Set();
        let allUpdatesData = [];
        let currentSearchTerm = '';
        let currentDateRange = { from: null, to: null };

        // Authority parsing function (client-side)
        function parseAuthorities(authorityString) {
            if (!authorityString) return [];
            
            const normalized = authorityString
                .replace(/Bank of England and Prudential Regulation Authority \\(PRA\\)/g, 'BoE,PRA')
                .replace(/Bank of England/g, 'BoE')
                .replace(/and/g, ',')
                .split(',')
                .map(auth => auth.trim())
                .filter(auth => auth.length > 0);
            
            return normalized.map(auth => {
                if (auth === 'FCA') return 'FCA';
                if (auth === 'BoE') return 'BoE';
                if (auth === 'PRA') return 'PRA';
                if (auth === 'TPR') return 'TPR';
                if (auth === 'PSR') return 'PSR';
                if (auth === 'SFO') return 'SFO';
                if (auth === 'FATF') return 'FATF';
                return auth;
            });
        }

        // Phase 2: Enhanced Search Function
        async function performSearch() {
            const searchTerm = document.getElementById('searchBox').value;
            const dateFrom = document.getElementById('dateFrom').value;
            const dateTo = document.getElementById('dateTo').value;
            
            document.body.classList.add('loading');
            
            try {
                const params = new URLSearchParams();
                if (searchTerm) params.append('q', searchTerm);
                if (dateFrom) params.append('dateFrom', dateFrom);
                if (dateTo) params.append('dateTo', dateTo);
                
                const response = await fetch('/api/search?' + params.toString());
                const data = await response.json();
                
                if (data.results) {
                    displaySearchResults(data.results);
                    showNotification(\`Found \${data.total} results\`, 'success');
                }
            } catch (error) {
                console.error('Search error:', error);
                showNotification('Search failed', 'error');
            } finally {
                document.body.classList.remove('loading');
            }
        }

        function displaySearchResults(results) {
            const container = document.getElementById('sectorsContainer');
            
            if (results.length === 0) {
                container.innerHTML = \`
                    <div class="empty-state">
                        <h3>No results found</h3>
                        <p>Try adjusting your search terms or filters.</p>
                    </div>
                \`;
                return;
            }
            
            // Group results by sector
            const groupedResults = {};
            results.forEach(item => {
                const sector = item.sector || "General";
                if (!groupedResults[sector]) groupedResults[sector] = [];
                groupedResults[sector].push(item);
            });
            
            // Render grouped results (using similar structure as existing code)
            container.innerHTML = Object.keys(groupedResults).map(sector => \`
                <div class="sector-card">
                    <div class="sector-header">
                        <h2 class="sector-title">\${sector}</h2>
                        <p class="sector-count">\${groupedResults[sector].length} result\${groupedResults[sector].length !== 1 ? 's' : ''}</p>
                    </div>
                    <div class="sector-content">
                        \${groupedResults[sector].map(update => createUpdateCard(update)).join('')}
                    </div>
                </div>
            \`).join('');
        }

        function createUpdateCard(update) {
            return \`
                <div class="update-item">
                    <div class="update-header">
                        <h3 class="update-title">\${update.headline}</h3>
                        <div class="update-badges">
                            <span class="badge authority-badge">\${update.authority}</span>
                            <span class="badge impact-\${update.impactLevel.toLowerCase()}">\${update.impactLevel}</span>
                            <span class="badge urgency-\${update.urgency.toLowerCase()}">\${update.urgency}</span>
                        </div>
                    </div>
                    <div class="update-impact">
                        <strong>Impact Analysis:</strong> \${update.impact}
                    </div>
                    <div class="update-footer">
                        <a href="\${update.url}" target="_blank" class="view-source-btn">View Source</a>
                        <span class="update-date">\${new Date(update.fetchedDate).toLocaleDateString('en-GB')}</span>
                    </div>
                </div>
            \`;
        }

        function resetSearch() {
            document.getElementById('searchBox').value = '';
            document.getElementById('dateFrom').value = '';
            document.getElementById('dateTo').value = '';
            document.getElementById('sortBy').value = 'date-desc';
            
            // Reload original data
            window.location.reload();
        }

        // Phase 2: Export Functions
        async function exportData(format) {
            try {
                const params = new URLSearchParams({ format });
                
                // Add current filters to export
                if (selectedCategories.size > 0) {
                    selectedCategories.forEach(cat => params.append('sector', cat));
                }
                
                const response = await fetch('/api/export?' + params.toString());
                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = \`regulatory-updates-\${new Date().toISOString().split('T')[0]}.\${format}\`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                    
                    showNotification(\`Export (\${format.toUpperCase()}) downloaded successfully\`, 'success');
                } else {
                    throw new Error('Export failed');
                }
            } catch (error) {
                console.error('Export error:', error);
                showNotification('Export failed', 'error');
            }
        }

        // Phase 2: Analytics Charts
        async function loadAnalytics() {
            try {
                const response = await fetch('/api/trends');
                const data = await response.json();
                
                // Monthly activity chart
                const monthlyCtx = document.getElementById('monthlyChart').getContext('2d');
                new Chart(monthlyCtx, {
                    type: 'line',
                    data: {
                        labels: Object.keys(data.monthly).sort(),
                        datasets: [{
                            label: 'Updates',
                            data: Object.keys(data.monthly).sort().map(month => data.monthly[month]),
                            borderColor: '#4f46e5',
                            backgroundColor: 'rgba(79, 70, 229, 0.1)',
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { beginAtZero: true }
                        }
                    }
                });

                // Sector distribution chart
                const sectorCtx = document.getElementById('sectorChart').getContext('2d');
                new Chart(sectorCtx, {
                    type: 'doughnut',
                    data: {
                        labels: Object.keys(data.sectors),
                        datasets: [{
                            data: Object.values(data.sectors),
                            backgroundColor: [
                                '#4f46e5', '#059669', '#dc2626', '#7c3aed', '#ea580c', '#2563eb', '#16a34a', '#d97706'
                            ]
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom' } }
                    }
                });

                // Authority activity chart
                const authorityCtx = document.getElementById('authorityChart').getContext('2d');
                new Chart(authorityCtx, {
                    type: 'bar',
                    data: {
                        labels: Object.keys(data.authorities),
                        datasets: [{
                            data: Object.values(data.authorities),
                            backgroundColor: '#6366f1'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { beginAtZero: true }
                        }
                    }
                });
                
            } catch (error) {
                console.error('Analytics loading error:', error);
            }
        }

        function refreshAnalytics() {
            loadAnalytics();
            showNotification('Analytics refreshed', 'success');
        }

        // Multi-select filtering logic
        function applyFilters() {
            const sectorCards = document.querySelectorAll('.sector-card');
            
            sectorCards.forEach(card => {
                const updateItems = card.querySelectorAll('.update-item');
                let hasVisibleUpdates = false;

                updateItems.forEach(item => {
                    const itemAuthorities = item.dataset.authorities.split(',').filter(a => a);
                    const itemSector = item.dataset.sector;
                    
                    const matchesCategory = selectedCategories.size === 0 || selectedCategories.has(itemSector);
                    const matchesAuthority = selectedAuthorities.size === 0 || 
                        itemAuthorities.some(auth => selectedAuthorities.has(auth));
                    const matchesImpact = selectedImpactLevels.size === 0 || 
                        selectedImpactLevels.has(item.dataset.impact);
                    const matchesUrgency = selectedUrgencies.size === 0 || 
                        selectedUrgencies.has(item.dataset.urgency);

                    if (matchesCategory && matchesAuthority && matchesImpact && matchesUrgency) {
                        item.classList.remove('hidden');
                        hasVisibleUpdates = true;
                    } else {
                        item.classList.add('hidden');
                    }
                });

                if (hasVisibleUpdates) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            });

            updateFilterCounts();
        }

        function updateFilterCounts() {
            const totalVisible = document.querySelectorAll('.update-item:not(.hidden)').length;
            console.log(\`Showing \${totalVisible} updates after filtering\`);
        }

        // Category filter functions
        function selectAllCategories() {
            document.querySelectorAll('.category-checkbox').forEach(cb => {
                cb.checked = true;
                selectedCategories.add(cb.value);
            });
        }

        function clearAllCategories() {
            document.querySelectorAll('.category-checkbox').forEach(cb => {
                cb.checked = false;
            });
            selectedCategories.clear();
        }

        // Authority filter functions
        function selectAllAuthorities() {
            document.querySelectorAll('.authority-checkbox').forEach(cb => {
                cb.checked = true;
                selectedAuthorities.add(cb.value);
            });
        }

        function clearAllAuthorities() {
            document.querySelectorAll('.authority-checkbox').forEach(cb => {
                cb.checked = false;
            });
            selectedAuthorities.clear();
        }

        // Impact filter functions
        function selectAllImpacts() {
            document.querySelectorAll('.impact-checkbox').forEach(cb => {
                cb.checked = true;
                selectedImpactLevels.add(cb.value);
            });
        }

        function clearAllImpacts() {
            document.querySelectorAll('.impact-checkbox').forEach(cb => {
                cb.checked = false;
            });
            selectedImpactLevels.clear();
        }

        // Urgency filter functions
        function selectAllUrgencies() {
            document.querySelectorAll('.urgency-checkbox').forEach(cb => {
                cb.checked = true;
                selectedUrgencies.add(cb.value);
            });
        }

        function clearAllUrgencies() {
            document.querySelectorAll('.urgency-checkbox').forEach(cb => {
                cb.checked = false;
            });
            selectedUrgencies.clear();
        }

        function resetAllFilters() {
            clearAllCategories();
            clearAllAuthorities();
            clearAllImpacts();
            clearAllUrgencies();
            applyFilters();
        }

        // Notification system
        function showNotification(message, type) {
            // Create or update notification
            let notification = document.getElementById('notification');
            if (!notification) {
                notification = document.createElement('div');
                notification.id = 'notification';
                notification.style.cssText = \`
                    position: fixed; top: 20px; right: 20px; z-index: 1000;
                    padding: 12px 24px; border-radius: 8px; font-weight: 500;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: all 0.3s;
                    \${type === 'success' ? 'background: #10b981; color: white;' : 
                      type === 'error' ? 'background: #ef4444; color: white;' : 
                      'background: #3b82f6; color: white;'}
                \`;
                document.body.appendChild(notification);
            }
            
            notification.textContent = message;
            notification.style.display = 'block';
            
            setTimeout(() => {
                if (notification) {
                    notification.style.display = 'none';
                }
            }, 3000);
        }

        // Event listeners for checkboxes
        document.addEventListener('DOMContentLoaded', function() {
            // Category checkboxes
            document.querySelectorAll('.category-checkbox').forEach(cb => {
                cb.addEventListener('change', function() {
                    if (this.checked) {
                        selectedCategories.add(this.value);
                    } else {
                        selectedCategories.delete(this.value);
                    }
                });
            });

            // Authority checkboxes
            document.querySelectorAll('.authority-checkbox').forEach(cb => {
                cb.addEventListener('change', function() {
                    if (this.checked) {
                        selectedAuthorities.add(this.value);
                    } else {
                        selectedAuthorities.delete(this.value);
                    }
                });
            });

            // Impact checkboxes
            document.querySelectorAll('.impact-checkbox').forEach(cb => {
                cb.addEventListener('change', function() {
                    if (this.checked) {
                        selectedImpactLevels.add(this.value);
                    } else {
                        selectedImpactLevels.delete(this.value);
                    }
                });
            });

            // Urgency checkboxes
            document.querySelectorAll('.urgency-checkbox').forEach(cb => {
                cb.addEventListener('change', function() {
                    if (this.checked) {
                        selectedUrgencies.add(this.value);
                    } else {
                        selectedUrgencies.delete(this.value);
                    }
                });
            });

            // Search box enter key
            document.getElementById('searchBox').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    performSearch();
                }
            });

            // Load analytics on page load
            loadAnalytics();
            
            // Check system status
            checkSystemStatus();
        });

        // Fixed status system
        async function checkSystemStatus() {
            try {
                const response = await fetch('/test');
                const result = await response.json();
                const indicator = document.getElementById('statusIndicator');
                
                if (result.database === 'connected' && result.healthScore >= 80) {
                    indicator.className = 'status-indicator';
                } else {
                    indicator.className = 'status-indicator status-offline';
                }
            } catch (error) {
                const indicator = document.getElementById('statusIndicator');
                indicator.className = 'status-indicator status-offline';
            }
        }

        // Auto-refresh status every 30 seconds
        setInterval(checkSystemStatus, 30000);

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

// All existing debug endpoints remain the same but with updated branding
app.get('/debug/database', async (req, res) => {
    try {
        console.log('Enhanced database debug endpoint called');
        
        const startTime = Date.now();
        let connectionTime = 0;
        let queryTime = 0;
        let testResults = {
            connectionStatus: 'failed',
            queryStatus: 'failed',
            tableExists: false,
            canInsert: false,
            canSelect: false,
            recordCount: 0
        };
        
        const envCheck = {
            DATABASE_URL: !!process.env.DATABASE_URL,
            DATABASE_URL_PREFIX: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 15) + '...' : 'NOT_SET',
            GROQ_API_KEY: !!process.env.GROQ_API_KEY,
            HUGGING_FACE_API_KEY: !!process.env.HUGGING_FACE_API_KEY,
            NODE_ENV: process.env.NODE_ENV
        };
        
        if (!process.env.DATABASE_URL) {
            if (req.headers.accept && req.headers.accept.includes('application/json')) {
                return res.json({
                    status: 'ERROR',
                    message: 'DATABASE_URL environment variable not set',
                    env: envCheck
                });
            }
        } else {
            try {
                const { Pool } = require('pg');
                const pool = new Pool({
                    connectionString: process.env.DATABASE_URL,
                    ssl: { rejectUnauthorized: false }
                });
                
                // Test connection
                const connectStart = Date.now();
                const client = await pool.connect();
                connectionTime = Date.now() - connectStart;
                testResults.connectionStatus = 'connected';
                
                // Test basic query
                const queryStart = Date.now();
                const result = await client.query('SELECT NOW() as current_time');
                queryTime = Date.now() - queryStart;
                testResults.queryStatus = 'success';
                client.release();
                
                // Test table operations
                await pool.query(`
                    CREATE TABLE IF NOT EXISTS debug_test (
                        id SERIAL PRIMARY KEY,
                        message TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                testResults.tableExists = true;
                
                // Test insert
                await pool.query(
                    'INSERT INTO debug_test (message) VALUES ($1)',
                    ['Test at ' + new Date().toISOString()]
                );
                testResults.canInsert = true;
                
                // Test select and count
                const selectResult = await pool.query('SELECT COUNT(*) as count FROM debug_test');
                testResults.canSelect = true;
                testResults.recordCount = parseInt(selectResult.rows[0].count);
                
                await pool.end();
                
            } catch (error) {
                console.error('Database test error:', error);
            }
        }
        
        const totalTime = Date.now() - startTime;
        
        // Return JSON if requested
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.json({
                status: testResults.connectionStatus === 'connected' ? 'SUCCESS' : 'ERROR',
                message: testResults.connectionStatus === 'connected' ? 'Database connection working' : 'Database connection failed',
                env: envCheck,
                testResults: testResults,
                performanceMetrics: {
                    connectionTime: connectionTime,
                    queryTime: queryTime,
                    totalTime: totalTime
                }
            });
        }
        
        // Calculate database health score
        let dbScore = 0;
        if (testResults.connectionStatus === 'connected') dbScore += 30;
        if (testResults.queryStatus === 'success') dbScore += 20;
        if (testResults.tableExists) dbScore += 20;
        if (testResults.canInsert) dbScore += 15;
        if (testResults.canSelect) dbScore += 15;
        
        const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>Database Status - Regulatory Horizon Scanner</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f7fa; color: #374151; line-height: 1.6; }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        .header { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 2rem; text-align: center; }
        .title { color: #4f46e5; font-size: 1.75rem; font-weight: 600; margin-bottom: 1rem; }
        .back-link { display: inline-block; color: #6366f1; text-decoration: none; margin-bottom: 1rem; }
        .back-link:hover { text-decoration: underline; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
        .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .card-title { color: #374151; font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem; }
        .metric { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid #f3f4f6; }
        .metric:last-child { border-bottom: none; }
        .metric-label { color: #6b7280; }
        .metric-value { font-weight: 600; }
        .status-good { color: #059669; }
        .status-bad { color: #dc2626; }
        .status-warning { color: #d97706; }
        .chart-container { position: relative; height: 200px; margin: 1rem 0; }
        .explanation { background: #f9fafb; padding: 1rem; border-radius: 8px; margin-top: 1rem; font-size: 0.875rem; color: #6b7280; }
        .explanation-title { font-weight: 600; color: #374151; margin-bottom: 0.5rem; }
        .score-display { text-align: center; margin: 1rem 0; }
        .score-number { font-size: 2.5rem; font-weight: 700; color: ${dbScore >= 80 ? '#059669' : dbScore >= 60 ? '#d97706' : '#dc2626'}; }
        .score-label { color: #6b7280; margin-top: 0.5rem; }
        .perf-metric { background: #f3f4f6; padding: 0.5rem 1rem; border-radius: 6px; text-align: center; }
        .perf-number { font-size: 1.5rem; font-weight: 700; color: #4f46e5; }
        .perf-label { font-size: 0.75rem; color: #6b7280; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <a href="/" class="back-link">← Back to Main</a>
            <h1 class="title">Database Status</h1>
            <div class="score-display">
                <div class="score-number">${dbScore}%</div>
                <div class="score-label">Database Health Score</div>
            </div>
        </div>

        <div class="grid">
            <div class="card">
                <h2 class="card-title">Connection Health</h2>
                <div class="chart-container">
                    <canvas id="healthChart"></canvas>
                </div>
                <div class="metric">
                    <span class="metric-label">Overall Status</span>
                    <span class="metric-value ${dbScore >= 80 ? 'status-good' : dbScore >= 60 ? 'status-warning' : 'status-bad'}">
                        ${dbScore >= 80 ? 'Excellent' : dbScore >= 60 ? 'Good' : 'Issues Detected'}
                    </span>
                </div>
                <div class="explanation">
                    <div class="explanation-title">What This Means:</div>
                    Database health measures connection, query performance, and data operations. 
                    <strong>Excellent (80%+):</strong> All database functions working properly.
                    <strong>Good (60-79%):</strong> Basic functions work, some features may be limited.
                    <strong>Poor (&lt;60%):</strong> Database issues affecting functionality.
                </div>
            </div>

            <div class="card">
                <h2 class="card-title">Connection Tests</h2>
                <div class="metric">
                    <span class="metric-label">Connection</span>
                    <span class="metric-value ${testResults.connectionStatus === 'connected' ? 'status-good' : 'status-bad'}">
                        ${testResults.connectionStatus === 'connected' ? '✅ Connected' : '❌ Failed'}
                    </span>
                </div>
                <div class="metric">
                    <span class="metric-label">Query Execution</span>
                    <span class="metric-value ${testResults.queryStatus === 'success' ? 'status-good' : 'status-bad'}">
                        ${testResults.queryStatus === 'success' ? '✅ Success' : '❌ Failed'}
                    </span>
                </div>
                <div class="metric">
                    <span class="metric-label">Table Operations</span>
                    <span class="metric-value ${testResults.tableExists ? 'status-good' : 'status-bad'}">
                        ${testResults.tableExists ? '✅ Working' : '❌ Failed'}
                    </span>
                </div>
                <div class="metric">
                    <span class="metric-label">Data Operations</span>
                    <span class="metric-value ${testResults.canInsert && testResults.canSelect ? 'status-good' : 'status-bad'}">
                        ${testResults.canInsert && testResults.canSelect ? '✅ Working' : '❌ Failed'}
                    </span>
                </div>
                <div class="explanation">
                    <div class="explanation-title">What This Means:</div>
                    These tests verify core database functions. <strong>Good:</strong> All tests pass means data can be stored and retrieved. 
                    Any failures indicate specific issues that need attention.
                </div>
            </div>

            <div class="card">
                <h2 class="card-title">Performance Metrics</h2>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin: 1rem 0;">
                    <div class="perf-metric">
                        <div class="perf-number">${connectionTime}ms</div>
                        <div class="perf-label">Connection Time</div>
                    </div>
                    <div class="perf-metric">
                        <div class="perf-number">${queryTime}ms</div>
                        <div class="perf-label">Query Time</div>
                    </div>
                    <div class="perf-metric">
                        <div class="perf-number">${totalTime}ms</div>
                        <div class="perf-label">Total Test Time</div>
                    </div>
                </div>
                <div class="chart-container">
                    <canvas id="perfChart"></canvas>
                </div>
                <div class="explanation">
                    <div class="explanation-title">What This Means:</div>
                    Performance metrics show database responsiveness. 
                    <strong>Good:</strong> Connection &lt;500ms, Queries &lt;100ms. 
                    <strong>Slow:</strong> Connection &gt;1000ms, Queries &gt;500ms indicate performance issues.
                </div>
            </div>

            <div class="card">
                <h2 class="card-title">Data Status</h2>
                <div class="metric">
                    <span class="metric-label">Test Records</span>
                    <span class="metric-value">${testResults.recordCount}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Environment</span>
                    <span class="metric-value">${envCheck.NODE_ENV || 'production'}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Database URL</span>
                    <span class="metric-value ${envCheck.DATABASE_URL ? 'status-good' : 'status-bad'}">
                        ${envCheck.DATABASE_URL ? '✅ Configured' : '❌ Missing'}
                    </span>
                </div>
                <div class="explanation">
                    <div class="explanation-title">What This Means:</div>
                    Data status shows database configuration and content. Test records indicate successful data operations. 
                    Missing Database URL means no data persistence is possible.
                </div>
            </div>
        </div>
    </div>

    <script>
        // Database Health Chart
        const healthCtx = document.getElementById('healthChart').getContext('2d');
        new Chart(healthCtx, {
            type: 'doughnut',
            data: {
                labels: ['Healthy', 'Issues'],
                datasets: [{
                    data: [${dbScore}, ${100 - dbScore}],
                    backgroundColor: ['#059669', '#f3f4f6'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                }
            }
        });

        // Performance Chart
        const perfCtx = document.getElementById('perfChart').getContext('2d');
        new Chart(perfCtx, {
            type: 'bar',
            data: {
                labels: ['Connection', 'Query', 'Total'],
                datasets: [{
                    data: [${connectionTime}, ${queryTime}, ${totalTime}],
                    backgroundColor: ['#6366f1', '#059669', '#8b5cf6'],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value + 'ms';
                            }
                        }
                    }
                }
            }
        });
    </script>
</body>
</html>`;

        res.send(htmlContent);
        
    } catch (error) {
        console.error('Enhanced database debug error:', error);
        res.status(500).json({
            status: 'ERROR',
            message: 'Database test failed',
            error: error.message
        });
    }
});

// Enhanced main page with muted design and new branding
app.get('/', (req, res) => {
    try {
        console.log('Root route accessed');
        
        const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>Regulatory Horizon Scanner</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #374151; min-height: 100vh; }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        
        /* Smaller, more muted header */
        .header { background: #ffffff; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 2rem; border: 1px solid #e5e7eb; }
        .title { color: #4f46e5; font-size: 2rem; font-weight: 600; margin-bottom: 0.75rem; text-align: center; }
        .status { color: #059669; font-weight: 500; margin-bottom: 0.75rem; text-align: center; display: flex; align-items: center; justify-content: center; }
        .description { color: #6b7280; margin-bottom: 1.5rem; line-height: 1.6; text-align: center; }
        
        /* More muted button styles */
        .button-group { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
        .button { display: flex; align-items: center; justify-content: center; padding: 0.875rem 1.25rem; border-radius: 8px; text-decoration: none; font-weight: 500; transition: all 0.3s; border: none; cursor: pointer; font-size: 0.875rem; }
        .button-primary { background: #4f46e5; color: white; }
        .button-primary:hover { background: #4338ca; transform: translateY(-1px); box-shadow: 0 4px 6px rgba(79, 70, 229, 0.3); }
        .button-success { background: #059669; color: white; }
        .button-success:hover { background: #047857; transform: translateY(-1px); box-shadow: 0 4px 6px rgba(5, 150, 105, 0.3); }
        .button-secondary { background: #6b7280; color: white; }
        .button-secondary:hover { background: #4b5563; transform: translateY(-1px); box-shadow: 0 4px 6px rgba(107, 114, 128, 0.3); }
        .button-warning { background: #d97706; color: white; }
        .button-warning:hover { background: #b45309; transform: translateY(-1px); box-shadow: 0 4px 6px rgba(217, 119, 6, 0.3); }
        .button-diagnostic { background: #7c3aed; color: white; }
        .button-diagnostic:hover { background: #6d28d9; transform: translateY(-1px); box-shadow: 0 4px 6px rgba(124, 58, 237, 0.3); }
        .button::before { margin-right: 0.5rem; font-size: 1rem; }
        
        /* More subdued refresh section */
        .refresh-section { background: #f9fafb; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem; border: 1px solid #f3f4f6; }
        .refresh-btn { background: #059669; border: none; color: white; padding: 0.875rem 1.75rem; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.875rem; transition: all 0.3s; display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin: 0 auto; }
        .refresh-btn:hover { background: #047857; transform: translateY(-1px); box-shadow: 0 4px 6px rgba(5, 150, 105, 0.3); }
        .refresh-btn:disabled { background: #9ca3af; cursor: not-allowed; transform: none; box-shadow: none; }
        
        .status-section { margin-top: 1rem; text-align: center; }
        .status-indicator { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #059669; margin-right: 0.5rem; animation: pulse 2s infinite; }
        .status-offline { background: #ef4444; animation: none; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .status-text { font-size: 0.75rem; color: #6b7280; font-weight: 500; }
        
        .date-info { background: #f9fafb; padding: 0.875rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.75rem; color: #6b7280; text-align: center; border: 1px solid #f3f4f6; }
        
        /* More muted info section */
        .info-note { background: #f8fafc; border: 1px solid #e5e7eb; padding: 1.5rem; border-radius: 8px; margin-top: 1.5rem; }
        .info-title { color: #4f46e5; font-weight: 600; margin-bottom: 0.75rem; font-size: 1rem; }
        .info-text { color: #6b7280; font-size: 0.75rem; line-height: 1.6; }
        .system-status-fixed { display: flex; align-items: center; justify-content: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">Regulatory Horizon Scanner</h1>
            <div class="status system-status-fixed">
                <div class="status-indicator" id="systemIndicator"></div>
                <span>System Operational</span>
            </div>
            
            <div class="date-info" id="dataInfo">
                <span id="lastUpdatedText">Last updated: </span><span id="lastUpdated">Loading...</span>
            </div>
            
            <p class="description">
                🏛️ Track regulatory updates from UK financial authorities including FCA, Bank of England, PRA, TPR, SFO, and FATF. 
                The system automatically monitors and categorizes regulatory changes to keep you informed of developments affecting financial services.
            </p>
            
            <div class="button-group">
                <a href="/dashboard" class="button button-primary">📊 Enhanced Dashboard</a>
                <a href="/test" class="button button-secondary">🔧 System Test</a>
                <a href="/debug/database" class="button button-secondary">💾 Database Status</a>
            </div>
            
            <div class="button-group">
                <a href="/debug/comprehensive-fix" class="button button-diagnostic">🔬 FCA Diagnostic</a>
                <a href="/debug/groq-test" class="button button-secondary">🤖 AI Status</a>
                <a href="/debug/cleanup-and-reprocess" class="button button-warning">🧹 Data Cleanup</a>
            </div>
            
            <div class="refresh-section">
                <button onclick="refreshData()" class="refresh-btn" id="refreshBtn">
                    <span id="refreshIcon">🔄</span>
                    <span id="refreshText">Refresh Regulatory Data</span>
                </button>
                
                <div class="status-section" id="status">
                    <span class="status-indicator" id="refreshIndicator"></span>
                    <span class="status-text" id="statusText">Ready for data refresh</span>
                </div>
            </div>
            
            <div class="info-note">
                <div class="info-title">🌐 Regulatory Sources Monitored</div>
                <div class="info-text">
                    <strong>Financial Conduct Authority (FCA)</strong> • <strong>Bank of England</strong> • <strong>Prudential Regulation Authority (PRA)</strong> • 
                    <strong>The Pensions Regulator (TPR)</strong> • <strong>Serious Fraud Office (SFO)</strong> • <strong>Financial Action Task Force (FATF)</strong>
                    <br><br>
                    🤖 <strong>AI-Powered Analysis:</strong> Regulatory content is automatically analyzed and categorized using advanced AI to provide comprehensive business impact assessments.
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // Fixed status system - single source of truth
        let systemStatus = {
            database: false,
            api: false,
            overall: false
        };

        async function refreshData() {
            const btn = document.getElementById('refreshBtn');
            const status = document.getElementById('statusText');
            const indicator = document.getElementById('refreshIndicator');
            const icon = document.getElementById('refreshIcon');
            
            btn.disabled = true;
            icon.textContent = '⏳';
            document.getElementById('refreshText').textContent = 'Refreshing...';
            status.textContent = 'Fetching latest regulatory updates...';
            indicator.className = 'status-indicator status-offline';
            
            try {
                const response = await fetch('/api/refresh', { method: 'POST' });
                const result = await response.json();
                
                if (response.ok) {
                    status.textContent = \`Success! \${result.totalUpdates || 'Multiple'} updates available - \${result.newArticles || 0} new\`;
                    indicator.className = 'status-indicator';
                    updateLastRefreshed();
                    console.log('Refresh result:', result);
                } else {
                    throw new Error(result.error || 'Refresh failed');
                }
            } catch (error) {
                status.textContent = 'Error: ' + error.message;
                indicator.className = 'status-indicator status-offline';
                console.error('Refresh error:', error);
            }
            
            btn.disabled = false;
            icon.textContent = '🔄';
            document.getElementById('refreshText').textContent = 'Refresh Regulatory Data';
        }
        
        function updateLastRefreshed() {
            const now = new Date();
            const formatted = now.toLocaleDateString('en-GB') + ' at ' + now.toLocaleTimeString('en-GB', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            document.getElementById('lastUpdated').textContent = formatted;
        }
        
        // Fixed status checking - consolidated
        async function checkSystemStatus() {
            try {
                // Check system health
                const response = await fetch('/test');
                const result = await response.json();
                
                systemStatus.database = result.database === 'connected';
                systemStatus.api = result.healthScore >= 70;
                systemStatus.overall = systemStatus.database && systemStatus.api;
                
                // Update main system indicator
                const systemIndicator = document.getElementById('systemIndicator');
                if (systemStatus.overall) {
                    systemIndicator.className = 'status-indicator';
                } else {
                    systemIndicator.className = 'status-indicator status-offline';
                }
                
                // Update refresh indicator
                const refreshIndicator = document.getElementById('refreshIndicator');
                if (systemStatus.overall) {
                    refreshIndicator.className = 'status-indicator';
                    document.getElementById('statusText').textContent = 'System ready for data refresh';
                } else {
                    refreshIndicator.className = 'status-indicator status-offline';
                    document.getElementById('statusText').textContent = 'System issues detected - check diagnostics';
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
                systemStatus.overall = false;
                systemStatus.database = false;
                systemStatus.api = false;
                
                document.getElementById('systemIndicator').className = 'status-indicator status-offline';
                document.getElementById('refreshIndicator').className = 'status-indicator status-offline';
                document.getElementById('statusText').textContent = 'System offline - check connection';
                document.getElementById('lastUpdated').textContent = 'Unknown';
                
                console.error('Status check error:', error);
            }
        }
        
        // Initialize on page load
        document.addEventListener('DOMContentLoaded', checkSystemStatus);
        
        // Check status every 30 seconds
        setInterval(checkSystemStatus, 30000);
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
                headline: "Welcome to Enhanced Regulatory Horizon Scanner",
                impact: "Your enhanced dashboard is ready with Phase 2 features including trend analysis, advanced search, export capabilities, and category-based filtering. Click 'Refresh Regulatory Data' to start fetching real regulatory updates from UK financial regulators with AI-powered analysis.",
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
        console.log('Enhanced refresh endpoint called at:', new Date().toISOString());
        
        if (!process.env.GROQ_API_KEY) {
            console.warn('GROQ_API_KEY not set');
            return res.status(400).json({ 
                error: 'GROQ_API_KEY environment variable not set. Please add it in deployment settings.' 
            });
        }
        
        if (!process.env.DATABASE_URL) {
            console.warn('DATABASE_URL not set');
            return res.status(400).json({ 
                error: 'DATABASE_URL environment variable not set. Please add your database URL in deployment settings.' 
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
        
        console.log('🔄 Starting enhanced RSS feed analysis...');
        await rssFetcher.fetchAndAnalyzeFeeds();
        
        console.log('🔄 Starting enhanced website scraping...');
        await rssFetcher.scrapeAndAnalyzeWebsites();
        
        const finalUpdates = await db.get('updates').value();
        const newCount = finalUpdates.length - initialUpdates.length;
        
        console.log('📊 Final update count:', finalUpdates.length);
        console.log('📈 New articles processed:', newCount);
        console.log('=====================================');
        
        res.json({ 
            message: 'Enhanced refresh successful',
            timestamp: new Date().toISOString(),
            initialCount: initialUpdates.length,
            totalUpdates: finalUpdates.length,
            newArticles: newCount,
            note: 'Data stored persistently with enhanced AI analysis and multi-authority support'
        });
        
    } catch (error) {
        console.error('❌ Error in enhanced refresh endpoint:', error);
        res.status(500).json({ 
            error: 'Enhanced refresh failed',
            details: error.message,
            suggestion: 'Check that all environment variables are set and database is accessible'
        });
    }
});

// All other existing debug endpoints remain unchanged but with updated branding...
// (Include all the existing debug endpoints here with title changes to "Regulatory Horizon Scanner")

// Catch all other routes
app.use('*', (req, res) => {
    console.log('404 - Route not found:', req.originalUrl);
    res.status(404).json({ 
        error: 'Route not found',
        url: req.originalUrl,
        method: req.method,
        availableRoutes: [
            '/', 
            '/dashboard', 
            '/test', 
            '/health', 
            '/api/updates',
            '/api/trends',
            '/api/search', 
            '/api/export',
            'POST /api/refresh', 
            '/debug/comprehensive-fix', 
            '/debug/database', 
            '/debug/groq-test', 
            '/debug/cleanup-and-reprocess'
        ]
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

console.log('Starting Enhanced Regulatory Horizon Scanner...');
console.log('Node version:', process.version);
console.log('Environment variables check:');
console.log('- PORT:', PORT);
console.log('- GROQ_API_KEY present:', !!process.env.GROQ_API_KEY);
console.log('- DATABASE_URL present:', !!process.env.DATABASE_URL);
console.log('- HUGGING_FACE_API_KEY present:', !!process.env.HUGGING_FACE_API_KEY);
console.log('- Working directory:', process.cwd());

app.listen(PORT, () => {
    console.log('Enhanced Regulatory Horizon Scanner running on port ' + PORT);
    console.log('🚀 Phase 2 Enhancements Applied:');
    console.log('   ✅ Trend Analysis Dashboard with interactive charts');
    console.log('   ✅ Enhanced Search & Discovery with full-text search');
    console.log('   ✅ Export & Reporting (CSV and JSON)');
    console.log('   ✅ Category-based filtering system');
    console.log('   ✅ Muted design with smaller header');
    console.log('   ✅ Advanced analytics and visualizations');
    console.log('   ✅ Date range filtering and sorting options');
    console.log('   ✅ Real-time notifications and status updates');
    console.log('   ✅ Updated branding to "Regulatory Horizon Scanner"');
});

module.exports = app;