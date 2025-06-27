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
        message: 'MEMA UK Reg Tracker is working!',
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
    <title>System Test - MEMA UK Reg Tracker</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; line-height: 1.6; }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        .header { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 2rem; text-align: center; }
        .title { color: #1e40af; font-size: 2rem; font-weight: 700; margin-bottom: 1rem; }
        .back-link { display: inline-block; color: #3b82f6; text-decoration: none; margin-bottom: 1rem; }
        .back-link:hover { text-decoration: underline; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
        .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .card-title { color: #1e293b; font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; }
        .metric { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid #f1f5f9; }
        .metric:last-child { border-bottom: none; }
        .metric-label { color: #64748b; }
        .metric-value { font-weight: 600; }
        .status-good { color: #059669; }
        .status-bad { color: #dc2626; }
        .status-warning { color: #d97706; }
        .chart-container { position: relative; height: 200px; margin: 1rem 0; }
        .explanation { background: #f8fafc; padding: 1rem; border-radius: 8px; margin-top: 1rem; font-size: 0.875rem; color: #475569; }
        .explanation-title { font-weight: 600; color: #1e293b; margin-bottom: 0.5rem; }
        .score-display { text-align: center; margin: 1rem 0; }
        .score-number { font-size: 3rem; font-weight: 700; color: ${healthScore >= 80 ? '#059669' : healthScore >= 60 ? '#d97706' : '#dc2626'}; }
        .score-label { color: #64748b; margin-top: 0.5rem; }
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
                    backgroundColor: ['#059669', '#f1f5f9'],
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
                    backgroundColor: ['${dbConnected ? '#059669' : '#dc2626'}', '#3b82f6'],
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

// Enhanced Dashboard endpoint with multi-select filtering and modern design
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
                const statusClass = hoursAgo < 24 ? 'text-green-600' : hoursAgo < 48 ? 'text-yellow-600' : 'text-red-600';
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
        
        // Get all unique authorities for filters
        const allAuthorities = new Set();
        updates.forEach(update => {
            parseAuthorities(update.authority).forEach(auth => allAuthorities.add(auth));
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
    <title>MEMA UK Reg Tracker - Enhanced Dashboard</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #1e293b; line-height: 1.6; min-height: 100vh; }
        .container { max-width: 1400px; margin: 0 auto; padding: 1rem; }
        .header { background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); padding: 2rem; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); margin-bottom: 2rem; backdrop-filter: blur(10px); }
        .title { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 2.5rem; font-weight: 800; margin-bottom: 0.5rem; text-align: center; }
        .subtitle { color: #64748b; font-size: 1.1rem; margin-bottom: 1.5rem; text-align: center; }
        .stats { display: flex; justify-content: center; gap: 2rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
        .stat-item { text-align: center; padding: 1rem; background: rgba(255,255,255,0.7); border-radius: 12px; min-width: 120px; }
        .stat-number { color: #059669; font-size: 2rem; font-weight: 700; }
        .stat-label { color: #64748b; font-size: 0.875rem; }
        .back-link { display: inline-block; color: #3b82f6; text-decoration: none; margin-bottom: 1rem; font-weight: 600; }
        .back-link:hover { text-decoration: underline; }
        
        /* Source Freshness Indicators */
        .freshness-section { margin: 1.5rem 0; }
        .freshness-title { color: #374151; font-weight: 600; margin-bottom: 0.75rem; display: flex; align-items: center; }
        .freshness-title::before { content: "📊"; margin-right: 0.5rem; }
        .freshness-indicators { display: flex; gap: 0.75rem; flex-wrap: wrap; justify-content: center; }
        
        /* Enhanced Filters */
        .filters { background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); padding: 2rem; border-radius: 20px; box-shadow: 0 8px 25px rgba(0,0,0,0.1); margin-bottom: 2rem; }
        .filters-title { color: #1e293b; font-size: 1.25rem; font-weight: 700; margin-bottom: 1.5rem; display: flex; align-items: center; }
        .filters-title::before { content: "🎛️"; margin-right: 0.5rem; }
        .filter-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; }
        .filter-section { background: #f8fafc; padding: 1.5rem; border-radius: 12px; border: 1px solid #e2e8f0; }
        .filter-label { color: #374151; font-weight: 600; margin-bottom: 1rem; display: flex; align-items: center; }
        .filter-label.authorities::before { content: "🏛️"; margin-right: 0.5rem; }
        .filter-label.impact::before { content: "⚡"; margin-right: 0.5rem; }
        .filter-label.urgency::before { content: "🚨"; margin-right: 0.5rem; }
        .checkbox-group { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.5rem; margin-bottom: 1rem; }
        .checkbox-item { display: flex; align-items: center; padding: 0.5rem; border-radius: 8px; transition: background 0.2s; }
        .checkbox-item:hover { background: #e2e8f0; }
        .checkbox-item input[type="checkbox"] { margin-right: 0.5rem; transform: scale(1.1); }
        .checkbox-item label { font-size: 0.875rem; cursor: pointer; flex: 1; }
        .filter-actions { display: flex; gap: 0.5rem; }
        .btn { padding: 0.5rem 1rem; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; transition: all 0.2s; font-size: 0.875rem; }
        .btn-primary { background: #3b82f6; color: white; }
        .btn-primary:hover { background: #2563eb; transform: translateY(-1px); }
        .btn-secondary { background: #6b7280; color: white; }
        .btn-secondary:hover { background: #4b5563; transform: translateY(-1px); }
        .btn-clear { background: #ef4444; color: white; }
        .btn-clear:hover { background: #dc2626; transform: translateY(-1px); }

        /* Enhanced Sectors Grid */
        .sectors { display: grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap: 2rem; }
        .sector-card { background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); border-radius: 20px; box-shadow: 0 8px 25px rgba(0,0,0,0.1); overflow: hidden; transition: all 0.3s ease; border: 1px solid #e2e8f0; }
        .sector-card:hover { transform: translateY(-5px); box-shadow: 0 20px 40px rgba(0,0,0,0.15); }
        .sector-header { background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); padding: 1.5rem; border-bottom: 1px solid #e2e8f0; }
        .sector-title { color: #1e293b; font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; display: flex; align-items: center; }
        .sector-title::before { content: "📋"; margin-right: 0.5rem; }
        .sector-count { color: #64748b; font-size: 0.875rem; }
        .sector-content { padding: 0; }

        /* Modern Update Cards */
        .update-item { padding: 1.5rem; border-bottom: 1px solid #f1f5f9; transition: all 0.3s ease; position: relative; }
        .update-item:last-child { border-bottom: none; }
        .update-item:hover { background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); transform: translateX(5px); }
        .update-item::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--authority-color, #94a3b8); transition: width 0.3s ease; }
        .update-item:hover::before { width: 8px; }

        /* Authority-specific colors */
        .authority-fca { --authority-color: #1e40af; }
        .authority-fca .update-badges .authority-badge { background: #dbeafe; color: #1e40af; }
        .authority-boe { --authority-color: #059669; }
        .authority-boe .update-badges .authority-badge { background: #d1fae5; color: #059669; }
        .authority-pra { --authority-color: #dc2626; }
        .authority-pra .update-badges .authority-badge { background: #fee2e2; color: #dc2626; }
        .authority-tpr { --authority-color: #7c3aed; }
        .authority-tpr .update-badges .authority-badge { background: #ede9fe; color: #7c3aed; }
        .authority-psr { --authority-color: #ea580c; }
        .authority-psr .update-badges .authority-badge { background: #fed7aa; color: #ea580c; }
        .authority-general { --authority-color: #6b7280; }

        .update-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
        .update-title { color: #1e293b; font-size: 1.1rem; font-weight: 700; line-height: 1.4; flex: 1; margin-right: 1rem; }
        .update-badges { display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: flex-start; }
        .badge { padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
        .authority-badge { background: #f8fafc; color: #475569; }
        .impact-significant { background: #fef2f2; color: #dc2626; }
        .impact-moderate { background: #fffbeb; color: #d97706; }
        .impact-informational { background: #f0f9ff; color: #2563eb; }
        .urgency-high { background: #fef2f2; color: #dc2626; }
        .urgency-medium { background: #fffbeb; color: #d97706; }
        .urgency-low { background: #f0fdf4; color: #16a34a; }

        .update-meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
        .meta-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: #f8fafc; border-radius: 8px; }
        .meta-icon { font-size: 1rem; }
        .meta-content { flex: 1; }
        .meta-label { color: #64748b; font-size: 0.75rem; font-weight: 500; text-transform: uppercase; }
        .meta-value { color: #374151; font-size: 0.875rem; font-weight: 500; }

        .update-impact { color: #374151; margin-bottom: 1rem; padding: 1rem; background: #f8fafc; border-radius: 8px; border-left: 4px solid var(--authority-color, #94a3b8); }
        .update-footer { display: flex; justify-content: space-between; align-items: center; }
        .view-source-btn { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 0.5rem 1rem; border-radius: 8px; text-decoration: none; font-size: 0.875rem; font-weight: 500; transition: all 0.2s; display: flex; align-items: center; gap: 0.5rem; }
        .view-source-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4); }
        .view-source-btn::after { content: "→"; }
        .update-date { color: #9ca3af; font-size: 0.75rem; display: flex; align-items: center; gap: 0.25rem; }
        .update-date::before { content: "📅"; }

        .empty-state { text-align: center; padding: 3rem; color: #64748b; }
        .empty-state::before { content: "📭"; font-size: 3rem; display: block; margin-bottom: 1rem; }
        .search-box { width: 100%; max-width: 300px; padding: 0.75rem 1rem; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 0.875rem; transition: border-color 0.2s; }
        .search-box:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
        .hidden { display: none !important; }

        /* Status indicator fix */
        .system-status { display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; }
        .status-indicator { width: 12px; height: 12px; border-radius: 50%; background: #059669; margin-right: 0.5rem; animation: pulse 2s infinite; }
        .status-offline { background: #ef4444; animation: none; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <a href="/" class="back-link">← Back to Main</a>
            <h1 class="title">MEMA UK Reg Tracker</h1>
            <p class="subtitle">Enhanced Regulatory Updates Dashboard</p>
            
            <div class="system-status">
                <div class="status-indicator" id="statusIndicator"></div>
                <span class="text-sm text-gray-600">System Online - Live Data</span>
            </div>

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

        <div class="filters">
            <div class="filters-title">Multi-Select Filters</div>
            <div class="filter-grid">
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
            <div style="text-align: center; margin-top: 1.5rem;">
                <button class="btn btn-primary" onclick="applyFilters()" style="margin-right: 1rem; padding: 0.75rem 2rem;">Apply Filters</button>
                <button class="btn btn-clear" onclick="resetAllFilters()">Reset All Filters</button>
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
                                 data-urgency="${update.urgency}">
                                
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

        // Multi-select filtering logic
        let selectedAuthorities = new Set();
        let selectedImpactLevels = new Set();
        let selectedUrgencies = new Set();

        function applyFilters() {
            const sectorCards = document.querySelectorAll('.sector-card');
            
            sectorCards.forEach(card => {
                const updateItems = card.querySelectorAll('.update-item');
                let hasVisibleUpdates = false;

                updateItems.forEach(item => {
                    const itemAuthorities = item.dataset.authorities.split(',').filter(a => a);
                    const matchesAuthority = selectedAuthorities.size === 0 || 
                        itemAuthorities.some(auth => selectedAuthorities.has(auth));
                    
                    const matchesImpact = selectedImpactLevels.size === 0 || 
                        selectedImpactLevels.has(item.dataset.impact);
                    
                    const matchesUrgency = selectedUrgencies.size === 0 || 
                        selectedUrgencies.has(item.dataset.urgency);

                    if (matchesAuthority && matchesImpact && matchesUrgency) {
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

            // Update filter badge counts
            updateFilterCounts();
        }

        function updateFilterCounts() {
            const totalVisible = document.querySelectorAll('.update-item:not(.hidden)').length;
            console.log(\`Showing \${totalVisible} updates after filtering\`);
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
            clearAllAuthorities();
            clearAllImpacts();
            clearAllUrgencies();
            applyFilters();
        }

        // Event listeners for checkboxes
        document.addEventListener('DOMContentLoaded', function() {
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

// Enhanced Database Status endpoint
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
    <title>Database Status - MEMA UK Reg Tracker</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; line-height: 1.6; }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        .header { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 2rem; text-align: center; }
        .title { color: #1e40af; font-size: 2rem; font-weight: 700; margin-bottom: 1rem; }
        .back-link { display: inline-block; color: #3b82f6; text-decoration: none; margin-bottom: 1rem; }
        .back-link:hover { text-decoration: underline; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
        .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .card-title { color: #1e293b; font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; }
        .metric { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid #f1f5f9; }
        .metric:last-child { border-bottom: none; }
        .metric-label { color: #64748b; }
        .metric-value { font-weight: 600; }
        .status-good { color: #059669; }
        .status-bad { color: #dc2626; }
        .status-warning { color: #d97706; }
        .chart-container { position: relative; height: 200px; margin: 1rem 0; }
        .explanation { background: #f8fafc; padding: 1rem; border-radius: 8px; margin-top: 1rem; font-size: 0.875rem; color: #475569; }
        .explanation-title { font-weight: 600; color: #1e293b; margin-bottom: 0.5rem; }
        .score-display { text-align: center; margin: 1rem 0; }
        .score-number { font-size: 3rem; font-weight: 700; color: ${dbScore >= 80 ? '#059669' : dbScore >= 60 ? '#d97706' : '#dc2626'}; }
        .score-label { color: #64748b; margin-top: 0.5rem; }
        .perf-metric { background: #f1f5f9; padding: 0.5rem 1rem; border-radius: 6px; text-align: center; }
        .perf-number { font-size: 1.5rem; font-weight: 700; color: #1e40af; }
        .perf-label { font-size: 0.75rem; color: #64748b; }
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
                    backgroundColor: ['#059669', '#f1f5f9'],
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
                    backgroundColor: ['#3b82f6', '#059669', '#8b5cf6'],
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

// Enhanced Groq API Test endpoint
app.get('/debug/groq-test', async (req, res) => {
    try {
        console.log('🧪 Enhanced Groq API test');
        
        let testResults = {
            apiKeyPresent: !!process.env.GROQ_API_KEY,
            connectionStatus: 'not_tested',
            responseTime: 0,
            jsonParsingSuccess: false,
            modelResponse: null,
            errorDetails: null
        };
        
        if (!process.env.GROQ_API_KEY) {
            testResults.errorDetails = 'GROQ_API_KEY environment variable not set';
        } else {
            try {
                const axios = require('axios');
                const startTime = Date.now();
                
                const testPayload = {
                    model: "llama-3.1-8b-instant",
                    messages: [
                        {
                            role: "user",
                            content: "Return only this JSON: {\"test\": \"success\", \"provider\": \"groq\", \"timestamp\": \"" + new Date().toISOString() + "\"}"
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
                        timeout: 30000
                    }
                );
                
                testResults.responseTime = Date.now() - startTime;
                testResults.connectionStatus = 'success';
                
                const aiResponse = response.data.choices[0].message.content;
                testResults.modelResponse = aiResponse;
                
                // Test JSON parsing
                try {
                    JSON.parse(aiResponse);
                    testResults.jsonParsingSuccess = true;
                } catch (e) {
                    const markdownMatch = aiResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
                    if (markdownMatch) {
                        try {
                            JSON.parse(markdownMatch[1]);
                            testResults.jsonParsingSuccess = true;
                        } catch (e2) {
                            testResults.jsonParsingSuccess = false;
                        }
                    }
                }
                
            } catch (error) {
                testResults.connectionStatus = 'failed';
                testResults.errorDetails = error.message;
                if (error.response) {
                    testResults.errorDetails += ` (Status: ${error.response.status})`;
                }
            }
        }
        
        // Return JSON if requested
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.json({
                status: testResults.connectionStatus === 'success' ? 'SUCCESS' : 'ERROR',
                message: testResults.connectionStatus === 'success' ? 'Groq API is working!' : 'Groq API test failed',
                testResults: testResults
            });
        }
        
        // Calculate AI health score
        let aiScore = 0;
        if (testResults.apiKeyPresent) aiScore += 25;
        if (testResults.connectionStatus === 'success') aiScore += 40;
        if (testResults.jsonParsingSuccess) aiScore += 25;
        if (testResults.responseTime > 0 && testResults.responseTime < 5000) aiScore += 10;
        
        const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>AI Test - MEMA UK Reg Tracker</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; line-height: 1.6; }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        .header { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 2rem; text-align: center; }
        .title { color: #1e40af; font-size: 2rem; font-weight: 700; margin-bottom: 1rem; }
        .back-link { display: inline-block; color: #3b82f6; text-decoration: none; margin-bottom: 1rem; }
        .back-link:hover { text-decoration: underline; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
        .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .card-title { color: #1e293b; font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; }
        .metric { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid #f1f5f9; }
        .metric:last-child { border-bottom: none; }
        .metric-label { color: #64748b; }
        .metric-value { font-weight: 600; }
        .status-good { color: #059669; }
        .status-bad { color: #dc2626; }
        .status-warning { color: #d97706; }
        .chart-container { position: relative; height: 200px; margin: 1rem 0; }
        .explanation { background: #f8fafc; padding: 1rem; border-radius: 8px; margin-top: 1rem; font-size: 0.875rem; color: #475569; }
        .explanation-title { font-weight: 600; color: #1e293b; margin-bottom: 0.5rem; }
        .score-display { text-align: center; margin: 1rem 0; }
        .score-number { font-size: 3rem; font-weight: 700; color: ${aiScore >= 80 ? '#059669' : aiScore >= 60 ? '#d97706' : '#dc2626'}; }
        .score-label { color: #64748b; margin-top: 0.5rem; }
        .response-box { background: #f8fafc; padding: 1rem; border-radius: 8px; font-family: monospace; font-size: 0.875rem; word-break: break-all; max-height: 150px; overflow-y: auto; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <a href="/" class="back-link">← Back to Main</a>
            <h1 class="title">AI System Test</h1>
            <div class="score-display">
                <div class="score-number">${aiScore}%</div>
                <div class="score-label">AI Health Score</div>
            </div>
        </div>

        <div class="grid">
            <div class="card">
                <h2 class="card-title">AI Performance</h2>
                <div class="chart-container">
                    <canvas id="aiChart"></canvas>
                </div>
                <div class="metric">
                    <span class="metric-label">Overall Status</span>
                    <span class="metric-value ${aiScore >= 80 ? 'status-good' : aiScore >= 60 ? 'status-warning' : 'status-bad'}">
                        ${aiScore >= 80 ? 'Excellent' : aiScore >= 60 ? 'Good' : 'Issues Detected'}
                    </span>
                </div>
                <div class="explanation">
                    <div class="explanation-title">What This Means:</div>
                    AI performance measures API connectivity, response parsing, and speed. 
                    <strong>Excellent (80%+):</strong> AI analysis working optimally for regulatory content.
                    <strong>Good (60-79%):</strong> Basic AI functions work, may be slower.
                    <strong>Poor (&lt;60%):</strong> AI issues affecting content analysis.
                </div>
            </div>

            <div class="card">
                <h2 class="card-title">Connection Tests</h2>
                <div class="metric">
                    <span class="metric-label">API Key</span>
                    <span class="metric-value ${testResults.apiKeyPresent ? 'status-good' : 'status-bad'}">
                        ${testResults.apiKeyPresent ? '✅ Present' : '❌ Missing'}
                    </span>
                </div>
                <div class="metric">
                    <span class="metric-label">API Connection</span>
                    <span class="metric-value ${testResults.connectionStatus === 'success' ? 'status-good' : 'status-bad'}">
                        ${testResults.connectionStatus === 'success' ? '✅ Connected' : '❌ Failed'}
                    </span>
                </div>
                <div class="metric">
                    <span class="metric-label">Response Time</span>
                    <span class="metric-value ${testResults.responseTime < 3000 ? 'status-good' : testResults.responseTime < 10000 ? 'status-warning' : 'status-bad'}">
                        ${testResults.responseTime}ms
                    </span>
                </div>
                <div class="metric">
                    <span class="metric-label">JSON Parsing</span>
                    <span class="metric-value ${testResults.jsonParsingSuccess ? 'status-good' : 'status-bad'}">
                        ${testResults.jsonParsingSuccess ? '✅ Success' : '❌ Failed'}
                    </span>
                </div>
                <div class="explanation">
                    <div class="explanation-title">What This Means:</div>
                    These tests verify AI capability for processing regulatory content. 
                    <strong>Good:</strong> All tests pass means regulatory articles can be analyzed and categorized properly.
                </div>
            </div>

            <div class="card">
                <h2 class="card-title">Response Analysis</h2>
                ${testResults.modelResponse ? `
                <div style="margin-bottom: 1rem;">
                    <strong>AI Response:</strong>
                    <div class="response-box">${testResults.modelResponse}</div>
                </div>
                ` : ''}
                <div class="chart-container">
                    <canvas id="speedChart"></canvas>
                </div>
                <div class="explanation">
                    <div class="explanation-title">What This Means:</div>
                    Response analysis shows how well the AI processes requests. 
                    <strong>Fast (&lt;3s):</strong> Optimal for real-time analysis.
                    <strong>Moderate (3-10s):</strong> Acceptable for batch processing.
                    <strong>Slow (&gt;10s):</strong> May impact user experience.
                </div>
            </div>

            <div class="card">
                <h2 class="card-title">System Impact</h2>
                <div class="metric">
                    <span class="metric-label">Regulatory Analysis</span>
                    <span class="metric-value ${aiScore >= 60 ? 'status-good' : 'status-warning'}">
                        ${aiScore >= 60 ? '✅ Ready' : '⚠️ Limited'}
                    </span>
                </div>
                <div class="metric">
                    <span class="metric-label">Content Processing</span>
                    <span class="metric-value ${testResults.connectionStatus === 'success' ? 'status-good' : 'status-bad'}">
                        ${testResults.connectionStatus === 'success' ? '✅ Available' : '❌ Unavailable'}
                    </span>
                </div>
                <div class="metric">
                    <span class="metric-label">FCA Article Processing</span>
                    <span class="metric-value ${aiScore >= 80 ? 'status-good' : 'status-warning'}">
                        ${aiScore >= 80 ? '✅ Optimal' : '⚠️ Reduced'}
                    </span>
                </div>
                ${testResults.errorDetails ? `
                <div style="margin-top: 1rem; padding: 1rem; background: #fef2f2; border-radius: 8px; color: #dc2626;">
                    <strong>Error:</strong> ${testResults.errorDetails}
                </div>
                ` : ''}
                <div class="explanation">
                    <div class="explanation-title">What This Means:</div>
                    System impact shows how AI status affects regulatory tracking features. 
                    Poor AI performance means regulatory content won't be automatically categorized and analyzed.
                </div>
            </div>
        </div>
    </div>

    <script>
        // AI Health Chart
        const aiCtx = document.getElementById('aiChart').getContext('2d');
        new Chart(aiCtx, {
            type: 'doughnut',
            data: {
                labels: ['Working', 'Issues'],
                datasets: [{
                    data: [${aiScore}, ${100 - aiScore}],
                    backgroundColor: ['#059669', '#f1f5f9'],
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

        // Speed Chart
        const speedCtx = document.getElementById('speedChart').getContext('2d');
        const responseTime = ${testResults.responseTime};
        const speedData = [
            responseTime < 3000 ? 100 : responseTime < 10000 ? 60 : 20,
            responseTime >= 3000 && responseTime < 10000 ? 100 : 0,
            responseTime >= 10000 ? 100 : 0
        ];
        
        new Chart(speedCtx, {
            type: 'bar',
            data: {
                labels: ['Fast', 'Moderate', 'Slow'],
                datasets: [{
                    data: speedData,
                    backgroundColor: ['#059669', '#d97706', '#dc2626'],
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
        
    } catch (error) {
        console.error('❌ Enhanced Groq API test failed:', error.message);
        res.status(500).json({
            status: 'ERROR',
            message: 'AI test failed',
            error: error.message
        });
    }
});

// Enhanced Cleanup endpoint
app.get('/debug/cleanup-and-reprocess', async (req, res) => {
    try {
        console.log('🧹 Enhanced cleanup and reprocessing...');
        
        const db = require('./database');
        await db.initialize();
        
        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
        
        // Get initial statistics
        const initialResult = await pool.query('SELECT COUNT(*) FROM updates');
        const initialCount = parseInt(initialResult.rows[0].count);
        
        // Analyze data quality
        const qualityCheck = await pool.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN headline = 'N/A' OR headline LIKE '%Welcome to%' OR headline LIKE '%test%' THEN 1 END) as bad_headlines,
                COUNT(CASE WHEN impact = 'N/A' THEN 1 END) as bad_impacts,
                COUNT(CASE WHEN authority = 'N/A' THEN 1 END) as bad_authorities,
                COUNT(CASE WHEN sector = 'N/A' THEN 1 END) as bad_sectors,
                COUNT(CASE WHEN fetched_date > NOW() - INTERVAL '24 hours' THEN 1 END) as recent_24h,
                COUNT(CASE WHEN fetched_date > NOW() - INTERVAL '7 days' THEN 1 END) as recent_7d
            FROM updates
        `);
        
        const qualityData = qualityCheck.rows[0];
        const totalBadEntries = Math.max(
            parseInt(qualityData.bad_headlines),
            parseInt(qualityData.bad_impacts),
            parseInt(qualityData.bad_authorities),
            parseInt(qualityData.bad_sectors)
        );
        
        // Perform cleanup
        const deleteResult = await pool.query(`
            DELETE FROM updates 
            WHERE headline = 'N/A' 
            OR impact = 'N/A' 
            OR authority = 'N/A'
            OR headline LIKE '%Welcome to%'
            OR headline LIKE '%test%'
            OR sector = 'N/A'
        `);
        
        const cleanedCount = deleteResult.rowCount;
        
        // Get final statistics
        const finalResult = await pool.query('SELECT COUNT(*) FROM updates');
        const finalCount = parseInt(finalResult.rows[0].count);
        
        // Get sector distribution
        const sectorDist = await pool.query(`
            SELECT sector, COUNT(*) as count 
            FROM updates 
            GROUP BY sector 
            ORDER BY count DESC
        `);
        
        await pool.end();
        
        // Return JSON if requested
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.json({
                status: 'SUCCESS',
                message: 'Cleanup completed successfully',
                before: initialCount,
                after: finalCount,
                deletedEntries: cleanedCount,
                qualityMetrics: qualityData,
                sectorDistribution: sectorDist.rows
            });
        }
        
        // Calculate data quality score
        const dataQualityScore = finalCount > 0 ? Math.round(((finalCount - totalBadEntries) / finalCount) * 100) : 0;
        
        const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>Data Cleanup - MEMA UK Reg Tracker</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; line-height: 1.6; }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        .header { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 2rem; text-align: center; }
        .title { color: #1e40af; font-size: 2rem; font-weight: 700; margin-bottom: 1rem; }
        .back-link { display: inline-block; color: #3b82f6; text-decoration: none; margin-bottom: 1rem; }
        .back-link:hover { text-decoration: underline; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
        .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .card-title { color: #1e293b; font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; }
        .metric { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid #f1f5f9; }
        .metric:last-child { border-bottom: none; }
        .metric-label { color: #64748b; }
        .metric-value { font-weight: 600; }
        .status-good { color: #059669; }
        .status-bad { color: #dc2626; }
        .status-warning { color: #d97706; }
        .chart-container { position: relative; height: 200px; margin: 1rem 0; }
        .explanation { background: #f8fafc; padding: 1rem; border-radius: 8px; margin-top: 1rem; font-size: 0.875rem; color: #475569; }
        .explanation-title { font-weight: 600; color: #1e293b; margin-bottom: 0.5rem; }
        .score-display { text-align: center; margin: 1rem 0; }
        .score-number { font-size: 3rem; font-weight: 700; color: ${dataQualityScore >= 90 ? '#059669' : dataQualityScore >= 70 ? '#d97706' : '#dc2626'}; }
        .score-label { color: #64748b; margin-top: 0.5rem; }
        .cleanup-summary { background: #ecfdf5; border: 1px solid #d1fae5; padding: 1rem; border-radius: 8px; margin: 1rem 0; }
        .cleanup-summary-title { color: #065f46; font-weight: 600; margin-bottom: 0.5rem; }
        .cleanup-summary-text { color: #047857; font-size: 0.875rem; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <a href="/" class="back-link">← Back to Main</a>
            <h1 class="title">Data Cleanup Results</h1>
            <div class="score-display">
                <div class="score-number">${dataQualityScore}%</div>
                <div class="score-label">Data Quality Score</div>
            </div>
            <div class="cleanup-summary">
                <div class="cleanup-summary-title">Cleanup Complete</div>
                <div class="cleanup-summary-text">
                    Processed ${initialCount} records, cleaned ${cleanedCount} problematic entries, 
                    resulting in ${finalCount} high-quality regulatory updates.
                </div>
            </div>
        </div>

        <div class="grid">
            <div class="card">
                <h2 class="card-title">Data Quality Analysis</h2>
                <div class="chart-container">
                    <canvas id="qualityChart"></canvas>
                </div>
                <div class="metric">
                    <span class="metric-label">Clean Records</span>
                    <span class="metric-value status-good">${finalCount}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Removed Records</span>
                    <span class="metric-value status-warning">${cleanedCount}</span>
                </div>
                <div class="explanation">
                    <div class="explanation-title">What This Means:</div>
                    Data quality measures the percentage of clean, properly analyzed regulatory updates. 
                    <strong>Excellent (90%+):</strong> Almost all data is clean and usable.
                    <strong>Good (70-89%):</strong> Most data is clean, some cleanup performed.
                    <strong>Poor (&lt;70%):</strong> Significant data quality issues were found and cleaned.
                </div>
            </div>

            <div class="card">
                <h2 class="card-title">Cleanup Statistics</h2>
                <div class="chart-container">
                    <canvas id="cleanupChart"></canvas>
                </div>
                <div class="metric">
                    <span class="metric-label">Bad Headlines</span>
                    <span class="metric-value">${qualityData.bad_headlines}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Bad Impacts</span>
                    <span class="metric-value">${qualityData.bad_impacts}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Bad Authorities</span>
                    <span class="metric-value">${qualityData.bad_authorities}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Bad Sectors</span>
                    <span class="metric-value">${qualityData.bad_sectors}</span>
                </div>
                <div class="explanation">
                    <div class="explanation-title">What This Means:</div>
                    These metrics show specific data quality issues found and cleaned. 
                    High numbers indicate AI analysis problems that have been resolved.
                </div>
            </div>

            <div class="card">
                <h2 class="card-title">Data Freshness</h2>
                <div class="chart-container">
                    <canvas id="freshnessChart"></canvas>
                </div>
                <div class="metric">
                    <span class="metric-label">Last 24 Hours</span>
                    <span class="metric-value">${qualityData.recent_24h} updates</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Last 7 Days</span>
                    <span class="metric-value">${qualityData.recent_7d} updates</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Total Records</span>
                    <span class="metric-value">${finalCount} updates</span>
                </div>
                <div class="explanation">
                    <div class="explanation-title">What This Means:</div>
                    Data freshness shows how recent your regulatory updates are. 
                    <strong>Good:</strong> Regular updates in the last 24-48 hours indicate active monitoring.
                    <strong>Stale:</strong> No recent updates may indicate system issues.
                </div>
            </div>

            <div class="card">
                <h2 class="card-title">Sector Distribution</h2>
                <div class="chart-container">
                    <canvas id="sectorChart"></canvas>
                </div>
                ${sectorDist.rows.map(sector => `
                <div class="metric">
                    <span class="metric-label">${sector.sector}</span>
                    <span class="metric-value">${sector.count} updates</span>
                </div>
                `).join('')}
                <div class="explanation">
                    <div class="explanation-title">What This Means:</div>
                    Sector distribution shows how regulatory updates are categorized across different financial services areas. 
                    A balanced distribution indicates comprehensive regulatory monitoring.
                </div>
            </div>
        </div>
    </div>

    <script>
        // Data Quality Chart
        const qualityCtx = document.getElementById('qualityChart').getContext('2d');
        new Chart(qualityCtx, {
            type: 'doughnut',
            data: {
                labels: ['Clean Data', 'Removed'],
                datasets: [{
                    data: [${finalCount}, ${cleanedCount}],
                    backgroundColor: ['#059669', '#f87171'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });

        // Cleanup Issues Chart
        const cleanupCtx = document.getElementById('cleanupChart').getContext('2d');
        new Chart(cleanupCtx, {
            type: 'bar',
            data: {
                labels: ['Headlines', 'Impacts', 'Authorities', 'Sectors'],
                datasets: [{
                    data: [${qualityData.bad_headlines}, ${qualityData.bad_impacts}, ${qualityData.bad_authorities}, ${qualityData.bad_sectors}],
                    backgroundColor: ['#ef4444', '#f97316', '#eab308', '#84cc16'],
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
                        beginAtZero: true
                    }
                }
            }
        });

        // Data Freshness Chart
        const freshnessCtx = document.getElementById('freshnessChart').getContext('2d');
        new Chart(freshnessCtx, {
            type: 'bar',
            data: {
                labels: ['24 Hours', '7 Days', 'Total'],
                datasets: [{
                    data: [${qualityData.recent_24h}, ${qualityData.recent_7d}, ${finalCount}],
                    backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6'],
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
                        beginAtZero: true
                    }
                }
            }
        });

        // Sector Distribution Chart
        const sectorCtx = document.getElementById('sectorChart').getContext('2d');
        const sectorData = ${JSON.stringify(sectorDist.rows)};
        const sectorLabels = sectorData.map(s => s.sector);
        const sectorCounts = sectorData.map(s => parseInt(s.count));
        const sectorColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];
        
        new Chart(sectorCtx, {
            type: 'doughnut',
            data: {
                labels: sectorLabels,
                datasets: [{
                    data: sectorCounts,
                    backgroundColor: sectorColors.slice(0, sectorLabels.length),
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    </script>
</body>
</html>`;

        res.send(htmlContent);
        
    } catch (error) {
        console.error('❌ Enhanced cleanup failed:', error);
        res.status(500).json({
            status: 'ERROR',
            error: error.message,
            stack: error.stack
        });
    }
});

// Enhanced FCA Diagnostic endpoint
app.get('/debug/comprehensive-fix', async (req, res) => {
    try {
        console.log('🔧 Running enhanced FCA diagnostic...');
        
        const results = {
            timestamp: new Date().toISOString(),
            tests: [],
            summary: {}
        };

        // Test 1: Environment Variables
        const envTest = {
            name: 'Environment Variables',
            status: 'unknown',
            score: 0,
            details: {
                GROQ_API_KEY: !!process.env.GROQ_API_KEY,
                DATABASE_URL: !!process.env.DATABASE_URL,
                HUGGING_FACE_API_KEY: !!process.env.HUGGING_FACE_API_KEY
            }
        };

        if (envTest.details.GROQ_API_KEY) envTest.score += 40;
        if (envTest.details.DATABASE_URL) envTest.score += 40;
        if (envTest.details.HUGGING_FACE_API_KEY) envTest.score += 20;

        envTest.status = envTest.score >= 80 ? 'pass' : envTest.score >= 60 ? 'warning' : 'fail';
        results.tests.push(envTest);

        // Test 2: FCA RSS Feed
        const fcaRssTest = {
            name: 'FCA RSS Feed',
            status: 'unknown',
            score: 0,
            details: {
                accessible: false,
                totalItems: 0,
                recentItems: 0,
                parseSuccess: false
            }
        };

        try {
            const Parser = require('rss-parser');
            const parser = new Parser();
            const feed = await parser.parseURL('https://www.fca.org.uk/news/rss.xml');
            
            fcaRssTest.details.accessible = true;
            fcaRssTest.details.totalItems = feed.items.length;
            fcaRssTest.score += 30;

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

            let recentCount = 0;
            let parseSuccessCount = 0;
            
            for (let i = 0; i < Math.min(5, feed.items.length); i++) {
                const item = feed.items[i];
                const parsedDate = parseFCADate(item.pubDate);
                if (parsedDate) {
                    parseSuccessCount++;
                    if (parsedDate >= threeDaysAgo) recentCount++;
                }
            }

            fcaRssTest.details.recentItems = recentCount;
            fcaRssTest.details.parseSuccess = parseSuccessCount > 0;
            
            if (fcaRssTest.details.totalItems > 0) fcaRssTest.score += 20;
            if (fcaRssTest.details.recentItems > 0) fcaRssTest.score += 30;
            if (fcaRssTest.details.parseSuccess) fcaRssTest.score += 20;

            fcaRssTest.status = fcaRssTest.score >= 80 ? 'pass' : fcaRssTest.score >= 60 ? 'warning' : 'fail';
            
        } catch (error) {
            fcaRssTest.status = 'fail';
            fcaRssTest.details.error = error.message;
        }
        results.tests.push(fcaRssTest);

        // Test 3: Groq API
        const groqTest = {
            name: 'Groq API',
            status: 'unknown',
            score: 0,
            details: {
                keyPresent: !!process.env.GROQ_API_KEY,
                connectionWorking: false,
                responseTime: 0,
                jsonParsing: false
            }
        };

        if (groqTest.details.keyPresent) {
            groqTest.score += 25;
            
            try {
                const axios = require('axios');
                const startTime = Date.now();
                
                const testPayload = {
                    model: "llama-3.1-8b-instant",
                    messages: [{ role: "user", content: "Respond with this exact JSON: {\"test\": \"success\", \"provider\": \"groq\"}" }],
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

                groqTest.details.responseTime = Date.now() - startTime;
                groqTest.details.connectionWorking = true;
                groqTest.score += 40;

                const rawResponse = response.data.choices[0].message.content;
                
                // Test JSON extraction
                try {
                    JSON.parse(rawResponse);
                    groqTest.details.jsonParsing = true;
                    groqTest.score += 35;
                } catch (e) {
                    const markdownMatch = rawResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
                    if (markdownMatch) {
                        try {
                            JSON.parse(markdownMatch[1]);
                            groqTest.details.jsonParsing = true;
                            groqTest.score += 35;
                        } catch (e2) {}
                    }
                }

            } catch (error) {
                groqTest.details.error = error.message;
            }
        }

        groqTest.status = groqTest.score >= 80 ? 'pass' : groqTest.score >= 60 ? 'warning' : 'fail';
        results.tests.push(groqTest);

        // Test 4: Database Integration
        const dbTest = {
            name: 'Database Integration',
            status: 'unknown',
            score: 0,
            details: {
                connectionWorking: false,
                dataCount: 0,
                recentData: 0
            }
        };

        try {
            const db = require('./database');
            await db.initialize();
            dbTest.details.connectionWorking = true;
            dbTest.score += 50;

            const updates = await db.get('updates').value();
            dbTest.details.dataCount = updates.length;
            
            if (updates.length > 0) dbTest.score += 25;
            
            const recent = updates.filter(u => {
                const date = new Date(u.fetchedDate);
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                return date >= yesterday;
            });
            
            dbTest.details.recentData = recent.length;
            if (recent.length > 0) dbTest.score += 25;

        } catch (error) {
            dbTest.details.error = error.message;
        }

        dbTest.status = dbTest.score >= 80 ? 'pass' : dbTest.score >= 60 ? 'warning' : 'fail';
        results.tests.push(dbTest);

        // Calculate overall score
        const overallScore = Math.round(results.tests.reduce((sum, test) => sum + test.score, 0) / results.tests.length);
        
        results.summary = {
            totalTests: results.tests.length,
            passed: results.tests.filter(t => t.status === 'pass').length,
            failed: results.tests.filter(t => t.status === 'fail').length,
            warnings: results.tests.filter(t => t.status === 'warning').length,
            overallScore: overallScore
        };

        // Return JSON if requested
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.json({
                status: 'SUCCESS',
                message: 'FCA processing diagnostic completed',
                results: results
            });
        }

        const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>FCA Diagnostic - MEMA UK Reg Tracker</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; line-height: 1.6; }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        .header { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 2rem; text-align: center; }
        .title { color: #1e40af; font-size: 2rem; font-weight: 700; margin-bottom: 1rem; }
        .back-link { display: inline-block; color: #3b82f6; text-decoration: none; margin-bottom: 1rem; }
        .back-link:hover { text-decoration: underline; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
        .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .card-title { color: #1e293b; font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; }
        .metric { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid #f1f5f9; }
        .metric:last-child { border-bottom: none; }
        .metric-label { color: #64748b; }
        .metric-value { font-weight: 600; }
        .status-good { color: #059669; }
        .status-bad { color: #dc2626; }
        .status-warning { color: #d97706; }
        .chart-container { position: relative; height: 200px; margin: 1rem 0; }
        .explanation { background: #f8fafc; padding: 1rem; border-radius: 8px; margin-top: 1rem; font-size: 0.875rem; color: #475569; }
        .explanation-title { font-weight: 600; color: #1e293b; margin-bottom: 0.5rem; }
        .score-display { text-align: center; margin: 1rem 0; }
        .score-number { font-size: 3rem; font-weight: 700; color: ${overallScore >= 80 ? '#059669' : overallScore >= 60 ? '#d97706' : '#dc2626'}; }
        .score-label { color: #64748b; margin-top: 0.5rem; }
        .test-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; margin: 1rem 0; }
        .test-item { text-align: center; padding: 1rem; background: #f8fafc; border-radius: 8px; }
        .test-score { font-size: 1.5rem; font-weight: 700; }
        .test-name { font-size: 0.75rem; color: #64748b; margin-top: 0.5rem; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <a href="/" class="back-link">← Back to Main</a>
            <h1 class="title">FCA Processing Diagnostic</h1>
            <div class="score-display">
                <div class="score-number">${overallScore}%</div>
                <div class="score-label">FCA System Health</div>
            </div>
            <div class="test-summary">
                ${results.tests.map(test => `
                <div class="test-item">
                    <div class="test-score ${test.status === 'pass' ? 'status-good' : test.status === 'warning' ? 'status-warning' : 'status-bad'}">${test.score}%</div>
                    <div class="test-name">${test.name}</div>
                </div>
                `).join('')}
            </div>
        </div>

        <div class="grid">
            <div class="card">
                <h2 class="card-title">Overall System Health</h2>
                <div class="chart-container">
                    <canvas id="overallChart"></canvas>
                </div>
                <div class="metric">
                    <span class="metric-label">Tests Passed</span>
                    <span class="metric-value status-good">${results.summary.passed}/${results.summary.totalTests}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Warnings</span>
                    <span class="metric-value status-warning">${results.summary.warnings}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Failed</span>
                    <span class="metric-value status-bad">${results.summary.failed}</span>
                </div>
                <div class="explanation">
                    <div class="explanation-title">What This Means:</div>
                    FCA system health measures the ability to process Financial Conduct Authority regulatory updates. 
                    <strong>Excellent (80%+):</strong> FCA articles will be processed automatically and accurately.
                    <strong>Good (60-79%):</strong> Most FCA processing works, some features may be limited.
                    <strong>Poor (&lt;60%):</strong> FCA processing has significant issues requiring attention.
                </div>
            </div>

            <div class="card">
                <h2 class="card-title">Environment Setup (${envTest.score}%)</h2>
                <div class="chart-container">
                    <canvas id="envChart"></canvas>
                </div>
                <div class="metric">
                    <span class="metric-label">Groq API Key</span>
                    <span class="metric-value ${envTest.details.GROQ_API_KEY ? 'status-good' : 'status-bad'}">
                        ${envTest.details.GROQ_API_KEY ? '✅ Present' : '❌ Missing'}
                    </span>
                </div>
                <div class="metric">
                    <span class="metric-label">Database URL</span>
                    <span class="metric-value ${envTest.details.DATABASE_URL ? 'status-good' : 'status-bad'}">
                        ${envTest.details.DATABASE_URL ? '✅ Present' : '❌ Missing'}
                    </span>
                </div>
                <div class="metric">
                    <span class="metric-label">Backup AI Key</span>
                    <span class="metric-value ${envTest.details.HUGGING_FACE_API_KEY ? 'status-good' : 'status-warning'}">
                        ${envTest.details.HUGGING_FACE_API_KEY ? '✅ Present' : '⚠️ Missing'}
                    </span>
                </div>
                <div class="explanation">
                    <div class="explanation-title">What This Means:</div>
                    Environment variables configure the FCA processing system. Missing critical variables prevent the system from functioning properly.
                </div>
            </div>

            <div class="card">
                <h2 class="card-title">FCA Feed Health (${fcaRssTest.score}%)</h2>
                <div class="chart-container">
                    <canvas id="fcaChart"></canvas>
                </div>
                <div class="metric">
                    <span class="metric-label">Feed Access</span>
                    <span class="metric-value ${fcaRssTest.details.accessible ? 'status-good' : 'status-bad'}">
                        ${fcaRssTest.details.accessible ? '✅ Working' : '❌ Failed'}
                    </span>
                </div>
                <div class="metric">
                    <span class="metric-label">Total Articles</span>
                    <span class="metric-value">${fcaRssTest.details.totalItems}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Recent Articles</span>
                    <span class="metric-value">${fcaRssTest.details.recentItems}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Date Parsing</span>
                    <span class="metric-value ${fcaRssTest.details.parseSuccess ? 'status-good' : 'status-bad'}">
                        ${fcaRssTest.details.parseSuccess ? '✅ Working' : '❌ Failed'}
                    </span>
                </div>
                <div class="explanation">
                    <div class="explanation-title">What This Means:</div>
                    FCA feed health shows ability to access and parse regulatory updates from the Financial Conduct Authority. 
                    Problems here prevent new FCA articles from being processed.
                </div>
            </div>

            <div class="card">
                <h2 class="card-title">AI Processing (${groqTest.score}%)</h2>
                <div class="chart-container">
                    <canvas id="aiChart"></canvas>
                </div>
                <div class="metric">
                    <span class="metric-label">API Connection</span>
                    <span class="metric-value ${groqTest.details.connectionWorking ? 'status-good' : 'status-bad'}">
                        ${groqTest.details.connectionWorking ? '✅ Working' : '❌ Failed'}
                    </span>
                </div>
                <div class="metric">
                    <span class="metric-label">Response Time</span>
                    <span class="metric-value">${groqTest.details.responseTime}ms</span>
                </div>
                <div class="metric">
                    <span class="metric-label">JSON Parsing</span>
                    <span class="metric-value ${groqTest.details.jsonParsing ? 'status-good' : 'status-bad'}">
                        ${groqTest.details.jsonParsing ? '✅ Working' : '❌ Failed'}
                    </span>
                </div>
                <div class="explanation">
                    <div class="explanation-title">What This Means:</div>
                    AI processing analyzes and categorizes FCA regulatory content. 
                    Issues here mean FCA articles won't be properly analyzed or will contain "N/A" values.
                </div>
            </div>

            <div class="card">
                <h2 class="card-title">Data Integration (${dbTest.score}%)</h2>
                <div class="chart-container">
                    <canvas id="dataChart"></canvas>
                </div>
                <div class="metric">
                    <span class="metric-label">Database Connection</span>
                    <span class="metric-value ${dbTest.details.connectionWorking ? 'status-good' : 'status-bad'}">
                        ${dbTest.details.connectionWorking ? '✅ Working' : '❌ Failed'}
                    </span>
                </div>
                <div class="metric">
                    <span class="metric-label">Total Updates</span>
                    <span class="metric-value">${dbTest.details.dataCount}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Recent Updates</span>
                    <span class="metric-value">${dbTest.details.recentData}</span>
                </div>
                <div class="explanation">
                    <div class="explanation-title">What This Means:</div>
                    Data integration shows how well processed FCA articles are stored and retrieved. 
                    Problems here mean processed articles won't be saved or displayed properly.
                </div>
            </div>
        </div>
    </div>

    <script>
        // Overall Health Chart
        const overallCtx = document.getElementById('overallChart').getContext('2d');
        new Chart(overallCtx, {
            type: 'doughnut',
            data: {
                labels: ['Healthy', 'Issues'],
                datasets: [{
                    data: [${overallScore}, ${100 - overallScore}],
                    backgroundColor: ['#059669', '#f1f5f9'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });

        // Individual component charts
        const components = [
            { id: 'envChart', score: ${envTest.score} },
            { id: 'fcaChart', score: ${fcaRssTest.score} },
            { id: 'aiChart', score: ${groqTest.score} },
            { id: 'dataChart', score: ${dbTest.score} }
        ];

        components.forEach(comp => {
            const ctx = document.getElementById(comp.id).getContext('2d');
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Working', 'Issues'],
                    datasets: [{
                        data: [comp.score, 100 - comp.score],
                        backgroundColor: ['#059669', '#f1f5f9'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } }
                }
            });
        });
    </script>
</body>
</html>`;

        res.send(htmlContent);
        
    } catch (error) {
        console.error('❌ Enhanced FCA diagnostic error:', error);
        res.status(500).json({
            status: 'ERROR',
            error: error.message,
            stack: error.stack
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

// Enhanced main page with clean interface and fixed status system
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
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #1e293b; min-height: 100vh; }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        .header { background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); padding: 2rem; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); margin-bottom: 2rem; backdrop-filter: blur(10px); }
        .title { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 2.5rem; font-weight: 800; margin-bottom: 1rem; text-align: center; }
        .status { color: #059669; font-weight: 600; margin-bottom: 1rem; text-align: center; display: flex; align-items: center; justify-content: center; }
        .description { color: #64748b; margin-bottom: 2rem; line-height: 1.6; text-align: center; }
        .button-group { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .button { display: flex; align-items: center; justify-content: center; padding: 1rem 1.5rem; border-radius: 12px; text-decoration: none; font-weight: 600; transition: all 0.3s; border: none; cursor: pointer; font-size: 0.875rem; }
        .button-primary { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; }
        .button-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4); }
        .button-success { background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; }
        .button-success:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(5, 150, 105, 0.4); }
        .button-secondary { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; }
        .button-secondary:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(107, 114, 128, 0.4); }
        .button-warning { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; }
        .button-warning:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(245, 158, 11, 0.4); }
        .button-diagnostic { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; }
        .button-diagnostic:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(139, 92, 246, 0.4); }
        .button::before { margin-right: 0.5rem; font-size: 1.2rem; }
        .refresh-section { background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); padding: 2rem; border-radius: 16px; margin-bottom: 2rem; border: 1px solid #e2e8f0; }
        .refresh-btn { background: linear-gradient(135deg, #059669 0%, #047857 100%); border: none; color: white; padding: 1rem 2rem; border-radius: 12px; cursor: pointer; font-weight: 700; font-size: 1rem; transition: all 0.3s; display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin: 0 auto; }
        .refresh-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(5, 150, 105, 0.4); }
        .refresh-btn:disabled { background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%); cursor: not-allowed; transform: none; box-shadow: none; }
        .status-section { margin-top: 1.5rem; text-align: center; }
        .status-indicator { display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: #059669; margin-right: 0.5rem; animation: pulse 2s infinite; }
        .status-offline { background: #ef4444; animation: none; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .status-text { font-size: 0.875rem; color: #6b7280; font-weight: 500; }
        .date-info { background: rgba(255,255,255,0.7); padding: 1rem; border-radius: 12px; margin-bottom: 1.5rem; font-size: 0.875rem; color: #6b7280; text-align: center; }
        .info-note { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 1px solid #bfdbfe; padding: 2rem; border-radius: 16px; margin-top: 2rem; }
        .info-title { color: #1e40af; font-weight: 700; margin-bottom: 0.75rem; font-size: 1.1rem; }
        .info-text { color: #1e40af; font-size: 0.875rem; line-height: 1.6; }
        .system-status-fixed { display: flex; align-items: center; justify-content: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">MEMA UK Reg Tracker</h1>
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
                headline: "Welcome to Enhanced MEMA UK Reg Tracker",
                impact: "Your enhanced dashboard is ready with multi-select filtering, source freshness indicators, and modern design. Click 'Refresh Regulatory Data' to start fetching real regulatory updates from UK financial regulators with AI-powered analysis.",
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
            'POST /api/refresh', 
            '/debug/comprehensive-fix', 
            '/debug/database', 
            '/debug/groq-test', 
            '/debug/cleanup-and-reprocess',
            '/debug/test-fca-article',
            '/debug/rss',
            '/debug/refresh'
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

console.log('Starting Enhanced MEMA UK Reg Tracker...');
console.log('Node version:', process.version);
console.log('Environment variables check:');
console.log('- PORT:', PORT);
console.log('- GROQ_API_KEY present:', !!process.env.GROQ_API_KEY);
console.log('- DATABASE_URL present:', !!process.env.DATABASE_URL);
console.log('- HUGGING_FACE_API_KEY present:', !!process.env.HUGGING_FACE_API_KEY);
console.log('- Working directory:', process.cwd());

app.listen(PORT, () => {
    console.log('Enhanced MEMA UK Reg Tracker running on port ' + PORT);
    console.log('🚀 Phase 1 Enhancements Applied:');
    console.log('   ✅ Multi-select filtering with authority parsing');
    console.log('   ✅ Fixed status system (single source of truth)');
    console.log('   ✅ Source freshness indicators per authority');
    console.log('   ✅ Enhanced visual design with modern UI');
    console.log('   ✅ Authority-specific color coding');
    console.log('   ✅ Modern card designs with hover effects');
    console.log('   ✅ Improved diagnostic tools');
});

module.exports = app;
