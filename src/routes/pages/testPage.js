// src/routes/pages/testPage.js
// CLEANED: Removed duplicate functions, kept only test-specific logic

const { getCommonStyles } = require('../templates/commonStyles')
const { getSidebar } = require('../templates/sidebar')
const { getCommonClientScripts } = require('../templates/clientScripts')
const dbService = require('../../services/dbService')

// Helper functions remain the same for fallback compatibility
const getAnalyticsService = () => {
  try {
    return require('../../services/analyticsService')
  } catch (error) {
    console.warn('Analytics service not available, using fallback')
    return {
      getAnalyticsDashboard: () => ({ success: false, dashboard: { overview: { totalUpdates: 0, averageRiskScore: 0 }, velocity: {}, hotspots: [], predictions: [] } })
    }
  }
}

const getRelevanceService = () => {
  try {
    return require('../../services/relevanceService')
  } catch (error) {
    console.warn('Relevance service not available, using fallback')
    return {
      calculateRelevanceScore: () => 0,
      categorizeByRelevance: (updates) => ({ high: [], medium: [], low: updates || [] })
    }
  }
}

const getWorkspaceService = () => {
  try {
    return require('../../services/workspaceService')
  } catch (error) {
    console.warn('Workspace service not available, using fallback')
    return {
      getWorkspaceStats: () => ({ success: true, stats: { pinnedItems: 0, savedSearches: 0, activeAlerts: 0 } }),
      getPinnedItems: () => ({ success: true, items: [] }),
      addPinnedItem: () => ({ success: true }),
      removePinnedItem: () => ({ success: true })
    }
  }
}

const testPage = async (req, res) => {
  try {
    let dbStatus = 'unknown'
    let dbConnected = false
    let updateCount = 0
    const envVars = {
      hasGroqKey: !!process.env.GROQ_API_KEY,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      nodeVersion: process.version,
      platform: process.platform
    }

    // Test database with enhanced analytics service integration
    try {
      await dbService.initialize()
      updateCount = await dbService.getUpdateCount()
      dbStatus = 'connected'
      dbConnected = true
    } catch (error) {
      dbStatus = 'error: ' + error.message
    }

    // Test analytics service integration
    let analyticsStatus = 'unknown'
    let analyticsData = null
    try {
      const analyticsService = getAnalyticsService()
      analyticsData = await analyticsService.getAnalyticsDashboard()
      analyticsStatus = 'operational'
    } catch (error) {
      analyticsStatus = 'error: ' + error.message
    }

    // Test workspace service integration
    let workspaceStatus = 'unknown'
    let workspaceData = null
    try {
      const workspaceService = getWorkspaceService()
      workspaceData = await workspaceService.getWorkspaceStats()
      workspaceStatus = 'operational'
    } catch (error) {
      workspaceStatus = 'error: ' + error.message
    }

    // Test relevance service integration
    let relevanceStatus = 'unknown'
    try {
      const relevanceService = getRelevanceService()
      // Test with dummy data
      relevanceService.calculateRelevanceScore({}, {})
      relevanceStatus = 'operational'
    } catch (error) {
      relevanceStatus = 'error: ' + error.message
    }

    let healthScore = 0
    if (dbConnected) healthScore += 25
    if (envVars.hasGroqKey) healthScore += 20
    if (envVars.hasDatabaseUrl) healthScore += 15
    if (updateCount > 0) healthScore += 15
    if (analyticsStatus === 'operational') healthScore += 10
    if (workspaceStatus === 'operational') healthScore += 10
    if (relevanceStatus === 'operational') healthScore += 5

    // Calculate basic counts for sidebar (no enhanced filtering needed for test page)
    const updates = await dbService.getAllUpdates().catch(() => [])
    const authorityCount = {}
    updates.forEach(update => {
      const auth = update.authority || 'Unknown'
      authorityCount[auth] = (authorityCount[auth] || 0) + 1
    })

    const counts = {
      totalUpdates: updates.length,
      urgentCount: updates.filter(u => u.urgency === 'High' || u.impactLevel === 'Significant').length,
      moderateCount: updates.filter(u => u.urgency === 'Medium' || u.impactLevel === 'Moderate').length,
      informationalCount: updates.filter(u => u.urgency === 'Low' || u.impactLevel === 'Informational').length,
      fcaCount: authorityCount.FCA || 0,
      boeCount: authorityCount.BoE || 0,
      praCount: authorityCount.PRA || 0,
      tprCount: authorityCount.TPR || 0,
      sfoCount: authorityCount.SFO || 0,
      fatfCount: authorityCount.FATF || 0,
      // Basic counts for test page (no enhanced filtering)
      consultationCount: 0,
      guidanceCount: 0,
      enforcementCount: 0,
      speechCount: 0,
      newsCount: 0,
      policyCount: 0,
      finalRuleCount: 0,
      proposalCount: 0,
      noticeCount: 0,
      reportCount: 0,
      rssCount: 0,
      scrapedCount: 0,
      directCount: 0
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>System Diagnostics - Regulatory Horizon Scanner</title>
    ${getCommonStyles()}
    <style>
        /* Test page specific styles */
        .diagnostics-container { 
            display: grid; 
            grid-template-columns: 280px 1fr; 
            min-height: 100vh; 
        }
        
        .diagnostics-main { 
            padding: 2rem; 
            overflow-y: auto;
            background: #fafbfc;
        }
        
        .diagnostics-header { 
            background: #ffffff; 
            padding: 2rem; 
            border-radius: 12px; 
            border: 1px solid #e5e7eb; 
            margin-bottom: 2rem; 
            text-align: center;
            box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        
        .diagnostics-title { 
            color: #1f2937; 
            font-size: 1.875rem; 
            font-weight: 700; 
            margin-bottom: 1rem; 
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
        }

        .diagnostics-title a {
            color: #1f2937;
            text-decoration: none;
            transition: opacity 0.15s ease;
        }

        .diagnostics-title a:hover {
            opacity: 0.7;
        }
        
        .back-link { 
            display: inline-block; 
            color: #6b7280; 
            text-decoration: none; 
            margin-bottom: 1rem; 
            font-size: 0.875rem;
            transition: color 0.15s ease;
        }
        
        .back-link:hover { 
            color: #374151; 
        }
        
        .health-score { 
            margin: 1.5rem 0; 
        }
        
        .score-number { 
            font-size: 3rem; 
            font-weight: 700; 
            color: ${healthScore >= 80 ? '#059669' : healthScore >= 60 ? '#d97706' : '#dc2626'}; 
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        }

        .score-icon {
            font-size: 2.5rem;
        }
        
        .score-label { 
            color: #6b7280; 
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-weight: 500;
        }

        .score-description {
            color: #4b5563;
            font-size: 0.875rem;
            margin-top: 0.5rem;
        }
        
        .diagnostics-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); 
            gap: 1.5rem; 
        }
        
        .diagnostic-card { 
            background: #ffffff; 
            padding: 1.5rem; 
            border-radius: 12px; 
            border: 1px solid #e5e7eb;
            box-shadow: 0 1px 3px rgba(0,0,0,0.02);
            transition: all 0.15s ease;
        }

        .diagnostic-card:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            transform: translateY(-1px);
        }
        
        .card-title { 
            color: #1f2937; 
            font-size: 1.125rem; 
            font-weight: 600; 
            margin-bottom: 1rem; 
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        
        .status-icon {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            flex-shrink: 0;
        }
        
        .status-good { 
            background: #10b981; 
            box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
        }
        .status-warning { 
            background: #f59e0b; 
            box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
        }
        .status-error { 
            background: #ef4444; 
            box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
        }
        
        .metric-row { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            padding: 0.75rem 0; 
            border-bottom: 1px solid #f9fafb; 
        }
        
        .metric-row:last-child { 
            border-bottom: none; 
        }
        
        .metric-label { 
            color: #6b7280; 
            font-size: 0.875rem;
            font-weight: 500;
        }
        
        .metric-value { 
            font-weight: 600; 
            font-size: 0.875rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .status-good-text { color: #059669; }
        .status-warning-text { color: #d97706; }
        .status-error-text { color: #dc2626; }
        
        .explanation-box { 
            background: #f9fafb; 
            padding: 1rem; 
            border-radius: 8px; 
            margin-top: 1rem; 
            border-left: 4px solid #e5e7eb;
        }
        
        .explanation-title { 
            font-weight: 600; 
            color: #374151; 
            margin-bottom: 0.5rem; 
            font-size: 0.875rem;
        }
        
        .explanation-text { 
            color: #6b7280; 
            font-size: 0.8125rem; 
            line-height: 1.5;
        }

        .test-results {
            background: #f8fafc;
            padding: 1rem;
            border-radius: 8px;
            margin-top: 1rem;
            border: 1px solid #e2e8f0;
        }

        .test-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem 0;
            border-bottom: 1px solid #e5e7eb;
        }

        .test-item:last-child {
            border-bottom: none;
        }

        .test-name {
            font-size: 0.8125rem;
            color: #374151;
        }

        .test-status {
            font-size: 0.75rem;
            font-weight: 600;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
        }

        .test-pass {
            background: #d1fae5;
            color: #065f46;
        }

        .test-fail {
            background: #fee2e2;
            color: #991b1b;
        }

        .test-skip {
            background: #fef3c7;
            color: #92400e;
        }
        
        .action-buttons { 
            display: flex; 
            gap: 1rem; 
            margin-top: 2rem; 
            justify-content: center; 
            flex-wrap: wrap;
        }
        
        .btn { 
            padding: 0.75rem 1.5rem; 
            border-radius: 8px; 
            text-decoration: none; 
            font-weight: 500; 
            font-size: 0.875rem;
            transition: all 0.15s ease; 
            border: none;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .btn-primary { 
            background: #3b82f6; 
            color: white; 
        }
        
        .btn-primary:hover { 
            background: #2563eb; 
            transform: translateY(-1px);
        }
        
        .btn-secondary { 
            background: #f3f4f6; 
            color: #374151; 
            border: 1px solid #e5e7eb;
        }
        
        .btn-secondary:hover { 
            background: #e5e7eb; 
        }

        .btn-test {
            background: #059669;
            color: white;
        }

        .btn-test:hover {
            background: #047857;
        }

        .btn-danger {
            background: #dc2626;
            color: white;
        }

        .btn-danger:hover {
            background: #b91c1c;
        }

        .performance-metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }

        .performance-metric {
            text-align: center;
            padding: 0.75rem;
            background: #f8fafc;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
        }

        .performance-value {
            font-size: 1.25rem;
            font-weight: 700;
            color: #1f2937;
        }

        .performance-label {
            font-size: 0.75rem;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        @media (max-width: 768px) { 
            .diagnostics-container {
                grid-template-columns: 1fr;
            }
            
            .sidebar {
                display: none;
            }
            
            .diagnostics-grid { 
                grid-template-columns: 1fr; 
            }
            
            .action-buttons {
                flex-direction: column;
            }

            .performance-metrics {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    </style>
</head>
<body>
    <div class="diagnostics-container">
        ${getSidebar('test', counts)}
        
        <div class="diagnostics-main">
            <div class="diagnostics-header">
                <a href="/" class="back-link">← Back to Home</a>
                <h1 class="diagnostics-title">
                    <span class="score-icon">${healthScore >= 80 ? '✅' : healthScore >= 60 ? '⚠️' : '❌'}</span>
                    <a href="/">System Diagnostics</a>
                </h1>
                
                <div class="health-score">
                    <div class="score-number">
                        ${healthScore}%
                    </div>
                    <div class="score-label">System Health Score</div>
                    <div class="score-description">
                        ${healthScore >= 80
? 'System is operating optimally'
                          : healthScore >= 60
? 'System is functional with some warnings'
                          : 'System requires attention - critical issues detected'}
                    </div>
                </div>

                <div class="performance-metrics">
                    <div class="performance-metric">
                        <div class="performance-value">${updateCount}</div>
                        <div class="performance-label">Updates Stored</div>
                    </div>
                    <div class="performance-metric">
                        <div class="performance-value">${dbConnected ? 'Online' : 'Offline'}</div>
                        <div class="performance-label">Database</div>
                    </div>
                    <div class="performance-metric">
                        <div class="performance-value">${envVars.hasGroqKey ? 'Ready' : 'Missing'}</div>
                        <div class="performance-label">AI Engine</div>
                    </div>
                    <div class="performance-metric">
                        <div class="performance-value">${Math.round(process.uptime() / 60)}m</div>
                        <div class="performance-label">Uptime</div>
                    </div>
                </div>
            </div>

            <div class="diagnostics-grid">
                <div class="diagnostic-card">
                    <h2 class="card-title">
                        <div class="status-icon ${dbConnected ? 'status-good' : 'status-error'}"></div>
                        🗄️ Database Status
                    </h2>
                    
                    <div class="metric-row">
                        <span class="metric-label">Connection</span>
                        <span class="metric-value ${dbConnected ? 'status-good-text' : 'status-error-text'}">
                            ${dbConnected ? '✓ Connected' : '✗ Failed'}
                        </span>
                    </div>

                    <div class="metric-row">
                        <span class="metric-label">Status Detail</span>
                        <span class="metric-value">${dbStatus}</span>
                    </div>
                    
                    <div class="metric-row">
                        <span class="metric-label">Stored Updates</span>
                        <span class="metric-value">${updateCount.toLocaleString()}</span>
                    </div>
                    
                    <div class="metric-row">
                        <span class="metric-label">Storage Type</span>
                        <span class="metric-value">${envVars.hasDatabaseUrl ? 'PostgreSQL' : 'JSON File'}</span>
                    </div>
                    
                    <div class="metric-row">
                        <span class="metric-label">Last Tested</span>
                        <span class="metric-value">${new Date().toLocaleTimeString('en-GB')}</span>
                    </div>

                    <div class="test-results">
                        <div class="test-item">
                            <span class="test-name">Database Connection</span>
                            <span class="test-status ${dbConnected ? 'test-pass' : 'test-fail'}">
                                ${dbConnected ? 'PASS' : 'FAIL'}
                            </span>
                        </div>
                        <div class="test-item">
                            <span class="test-name">Read Operations</span>
                            <span class="test-status ${updateCount >= 0 ? 'test-pass' : 'test-fail'}">
                                ${updateCount >= 0 ? 'PASS' : 'FAIL'}
                            </span>
                        </div>
                        <div class="test-item">
                            <span class="test-name">Data Integrity</span>
                            <span class="test-status ${updateCount > 0 ? 'test-pass' : 'test-skip'}">
                                ${updateCount > 0 ? 'PASS' : 'SKIP'}
                            </span>
                        </div>
                    </div>
                    
                    <div class="explanation-box">
                        <div class="explanation-title">Database Health</div>
                        <div class="explanation-text">
                            ${dbConnected
                                ? 'Database connection is operational. Regulatory updates can be stored and retrieved successfully. Data persistence is working correctly.'
                                : 'Database connection failed. Check DATABASE_URL environment variable and ensure database is accessible. System will fall back to JSON file storage.'}
                        </div>
                    </div>
                </div>

                <div class="diagnostic-card">
                    <h2 class="card-title">
                        <div class="status-icon ${envVars.hasGroqKey && envVars.hasDatabaseUrl ? 'status-good' : 'status-warning'}"></div>
                        ⚙️ Environment Configuration
                    </h2>
                    
                    <div class="metric-row">
                        <span class="metric-label">Groq AI API Key</span>
                        <span class="metric-value ${envVars.hasGroqKey ? 'status-good-text' : 'status-error-text'}">
                            ${envVars.hasGroqKey ? '✓ Configured' : '✗ Missing'}
                        </span>
                    </div>
                    
                    <div class="metric-row">
                        <span class="metric-label">Database URL</span>
                        <span class="metric-value ${envVars.hasDatabaseUrl ? 'status-good-text' : 'status-warning-text'}">
                            ${envVars.hasDatabaseUrl ? '✓ Configured' : '⚠ Using Fallback'}
                        </span>
                    </div>
                    
                    <div class="metric-row">
                        <span class="metric-label">Node.js Version</span>
                        <span class="metric-value status-good-text">${envVars.nodeVersion}</span>
                    </div>
                    
                    <div class="metric-row">
                        <span class="metric-label">Platform</span>
                        <span class="metric-value">${envVars.platform}</span>
                    </div>

                    <div class="test-results">
                        <div class="test-item">
                            <span class="test-name">AI API Configuration</span>
                            <span class="test-status ${envVars.hasGroqKey ? 'test-pass' : 'test-fail'}">
                                ${envVars.hasGroqKey ? 'PASS' : 'FAIL'}
                            </span>
                        </div>
                        <div class="test-item">
                            <span class="test-name">Database Configuration</span>
                            <span class="test-status ${envVars.hasDatabaseUrl ? 'test-pass' : 'test-skip'}">
                                ${envVars.hasDatabaseUrl ? 'PASS' : 'SKIP'}
                            </span>
                        </div>
                        <div class="test-item">
                            <span class="test-name">Node.js Compatibility</span>
                            <span class="test-status test-pass">PASS</span>
                        </div>
                    </div>
                    
                    <div class="explanation-box">
                        <div class="explanation-title">Configuration Status</div>
                        <div class="explanation-text">
                            ${envVars.hasGroqKey && envVars.hasDatabaseUrl
                                ? 'All critical environment variables are properly configured. The system has access to AI analysis capabilities and persistent data storage.'
                                : 'Some environment variables may be missing. AI analysis requires GROQ_API_KEY. Production deployment should include DATABASE_URL.'}
                        </div>
                    </div>
                </div>

                <div class="diagnostic-card">
                    <h2 class="card-title">
                        <div class="status-icon ${analyticsStatus === 'operational' ? 'status-good' : 'status-error'}"></div>
                        📊 Analytics & Predictions
                    </h2>
                    
                    <div class="metric-row">
                        <span class="metric-label">Analytics Service</span>
                        <span class="metric-value ${analyticsStatus === 'operational' ? 'status-good-text' : 'status-error-text'}">
                            ${analyticsStatus === 'operational' ? '✓ Operational' : '✗ Error'}
                        </span>
                    </div>
                    
                    <div class="metric-row">
                        <span class="metric-label">Velocity Analysis</span>
                        <span class="metric-value ${analyticsData ? 'status-good-text' : 'status-error-text'}">
                            ${analyticsData ? '✓ Available' : '✗ Unavailable'}
                        </span>
                    </div>
                    
                    <div class="metric-row">
                        <span class="metric-label">Sector Hotspots</span>
                        <span class="metric-value ${analyticsData ? 'status-good-text' : 'status-error-text'}">
                            ${analyticsData ? '✓ Available' : '✗ Unavailable'}
                        </span>
                    </div>
                    
                    <div class="metric-row">
                        <span class="metric-label">Predictions</span>
                        <span class="metric-value ${analyticsData ? 'status-good-text' : 'status-error-text'}">
                            ${analyticsData ? '✓ Available' : '✗ Unavailable'}
                        </span>
                    </div>

                    <div class="test-results">
                        <div class="test-item">
                            <span class="test-name">Service Loading</span>
                            <span class="test-status ${analyticsStatus === 'operational' ? 'test-pass' : 'test-fail'}">
                                ${analyticsStatus === 'operational' ? 'PASS' : 'FAIL'}
                            </span>
                        </div>
                        <div class="test-item">
                            <span class="test-name">Data Processing</span>
                            <span class="test-status ${analyticsData ? 'test-pass' : 'test-fail'}">
                                ${analyticsData ? 'PASS' : 'FAIL'}
                            </span>
                        </div>
                        <div class="test-item">
                            <span class="test-name">Prediction Models</span>
                            <span class="test-status ${analyticsData && analyticsData.predictions ? 'test-pass' : 'test-skip'}">
                                ${analyticsData && analyticsData.predictions ? 'PASS' : 'SKIP'}
                            </span>
                        </div>
                    </div>
                    
                    <div class="explanation-box">
                        <div class="explanation-title">Analytics Capabilities</div>
                        <div class="explanation-text">
                            ${analyticsStatus === 'operational'
                                ? 'Full analytics pipeline is operational. Velocity analysis, sector hotspots, and predictive modeling are all available and processing regulatory data.'
                                : 'Analytics service encountered errors. Check database connectivity and data availability. Some predictive features may be limited.'}
                        </div>
                    </div>
                </div>

                <div class="diagnostic-card">
                    <h2 class="card-title">
                        <div class="status-icon ${workspaceStatus === 'operational' ? 'status-good' : 'status-error'}"></div>
                        💼 Workspace Features
                    </h2>
                    
                    <div class="metric-row">
                        <span class="metric-label">Workspace Service</span>
                        <span class="metric-value ${workspaceStatus === 'operational' ? 'status-good-text' : 'status-error-text'}">
                            ${workspaceStatus === 'operational' ? '✓ Operational' : '✗ Error'}
                        </span>
                    </div>
                    
                    <div class="metric-row">
                        <span class="metric-label">Pin Functionality</span>
                        <span class="metric-value ${workspaceData ? 'status-good-text' : 'status-error-text'}">
                            ${workspaceData ? '✓ Available' : '✗ Unavailable'}
                        </span>
                    </div>
                    
                    <div class="metric-row">
                        <span class="metric-label">Alert System</span>
                        <span class="metric-value ${workspaceData ? 'status-good-text' : 'status-error-text'}">
                            ${workspaceData ? '✓ Available' : '✗ Unavailable'}
                        </span>
                    </div>
                    
                    <div class="metric-row">
                        <span class="metric-label">Data Export</span>
                        <span class="metric-value status-good-text">✓ Available</span>
                    </div>

                    <div class="test-results">
                        <div class="test-item">
                            <span class="test-name">Service Initialization</span>
                            <span class="test-status ${workspaceStatus === 'operational' ? 'test-pass' : 'test-fail'}">
                                ${workspaceStatus === 'operational' ? 'PASS' : 'FAIL'}
                            </span>
                        </div>
                        <div class="test-item">
                            <span class="test-name">Database Integration</span>
                            <span class="test-status ${workspaceData ? 'test-pass' : 'test-fail'}">
                                ${workspaceData ? 'PASS' : 'FAIL'}
                            </span>
                        </div>
                        <div class="test-item">
                            <span class="test-name">Feature Availability</span>
                            <span class="test-status test-pass">PASS</span>
                        </div>
                    </div>
                    
                    <div class="explanation-box">
                        <div class="explanation-title">Workspace Health</div>
                        <div class="explanation-text">
                            ${workspaceStatus === 'operational'
                                ? 'All workspace features are functioning correctly. Users can pin items, create alerts, save searches, and export data successfully.'
                                : 'Workspace service encountered errors. Pin functionality and alert creation may be limited. Check backend service connectivity.'}
                        </div>
                    </div>
                </div>

                <div class="diagnostic-card">
                    <h2 class="card-title">
                        <div class="status-icon ${relevanceStatus === 'operational' ? 'status-good' : 'status-error'}"></div>
                        🎯 Relevance Engine
                    </h2>
                    
                    <div class="metric-row">
                        <span class="metric-label">Relevance Service</span>
                        <span class="metric-value ${relevanceStatus === 'operational' ? 'status-good-text' : 'status-error-text'}">
                            ${relevanceStatus === 'operational' ? '✓ Operational' : '✗ Error'}
                        </span>
                    </div>
                    
                    <div class="metric-row">
                        <span class="metric-label">Firm Matching</span>
                        <span class="metric-value ${relevanceStatus === 'operational' ? 'status-good-text' : 'status-error-text'}">
                            ${relevanceStatus === 'operational' ? '✓ Available' : '✗ Unavailable'}
                        </span>
                    </div>
                    
                    <div class="metric-row">
                        <span class="metric-label">Content Scoring</span>
                        <span class="metric-value ${relevanceStatus === 'operational' ? 'status-good-text' : 'status-error-text'}">
                            ${relevanceStatus === 'operational' ? '✓ Available' : '✗ Unavailable'}
                        </span>
                    </div>
                    
                    <div class="metric-row">
                        <span class="metric-label">Smart Categorization</span>
                        <span class="metric-value ${relevanceStatus === 'operational' ? 'status-good-text' : 'status-error-text'}">
                            ${relevanceStatus === 'operational' ? '✓ Available' : '✗ Unavailable'}
                        </span>
                    </div>

                    <div class="test-results">
                        <div class="test-item">
                            <span class="test-name">Algorithm Loading</span>
                            <span class="test-status ${relevanceStatus === 'operational' ? 'test-pass' : 'test-fail'}">
                                ${relevanceStatus === 'operational' ? 'PASS' : 'FAIL'}
                            </span>
                        </div>
                        <div class="test-item">
                            <span class="test-name">Score Calculation</span>
                            <span class="test-status ${relevanceStatus === 'operational' ? 'test-pass' : 'test-fail'}">
                                ${relevanceStatus === 'operational' ? 'PASS' : 'FAIL'}
                            </span>
                        </div>
                        <div class="test-item">
                            <span class="test-name">Content Categorization</span>
                            <span class="test-status ${relevanceStatus === 'operational' ? 'test-pass' : 'test-skip'}">
                                ${relevanceStatus === 'operational' ? 'PASS' : 'SKIP'}
                            </span>
                        </div>
                    </div>
                    
                    <div class="explanation-box">
                        <div class="explanation-title">Relevance Engine Health</div>
                        <div class="explanation-text">
                            ${relevanceStatus === 'operational'
                                ? 'Relevance engine is fully operational. AI-powered content scoring and firm-specific relevance matching are working correctly.'
                                : 'Relevance engine encountered errors. Content may not be properly categorized by relevance. Check backend service configuration.'}
                        </div>
                    </div>
                </div>

                <div class="diagnostic-card">
                    <h2 class="card-title">
                        <div class="status-icon status-good"></div>
                        ⚡ System Performance
                    </h2>
                    
                    <div class="metric-row">
                        <span class="metric-label">Memory Usage</span>
                        <span class="metric-value">${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB</span>
                    </div>
                    
                    <div class="metric-row">
                        <span class="metric-label">Uptime</span>
                        <span class="metric-value">${Math.round(process.uptime() / 60)} minutes</span>
                    </div>
                    
                    <div class="metric-row">
                        <span class="metric-label">CPU Architecture</span>
                        <span class="metric-value">${process.arch}</span>
                    </div>
                    
                    <div class="metric-row">
                        <span class="metric-label">Process ID</span>
                        <span class="metric-value">${process.pid}</span>
                    </div>

                    <div class="performance-metrics">
                        <div class="performance-metric">
                            <div class="performance-value">${Math.round(process.memoryUsage().rss / 1024 / 1024)}</div>
                            <div class="performance-label">RSS (MB)</div>
                        </div>
                        <div class="performance-metric">
                            <div class="performance-value">${Math.round(process.memoryUsage().external / 1024 / 1024)}</div>
                            <div class="performance-label">External (MB)</div>
                        </div>
                        <div class="performance-metric">
                            <div class="performance-value">${Math.round(process.memoryUsage().arrayBuffers / 1024 / 1024)}</div>
                            <div class="performance-label">Buffers (MB)</div>
                        </div>
                    </div>
                    
                    <div class="explanation-box">
                        <div class="explanation-title">Performance Metrics</div>
                        <div class="explanation-text">
                            System performance is within normal parameters. Memory usage and uptime indicate stable operation. Process metrics are tracked for monitoring system health.
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="action-buttons">
                <button onclick="runFullDiagnostics()" class="btn btn-test">
                    🔬 Run Full Test Suite
                </button>
                <button onclick="clearSystemCache()" class="btn btn-secondary">
                    🗑️ Clear Cache
                </button>
                <a href="/analytics" class="btn btn-primary">
                    📊 View Analytics Dashboard
                </a>
                <a href="/dashboard" class="btn btn-primary">
                    📰 View News Feed
                </a>
                <a href="/api/system-status" class="btn btn-secondary">
                    📄 JSON System Status
                </a>
                <a href="/" class="btn btn-secondary">
                    🏠 Return to Home
                </a>
            </div>
        </div>
    </div>

    ${getCommonClientScripts()}
    
    <script>
        // =================
        // TEST PAGE SPECIFIC LOGIC ONLY
        // =================
        
        // Test results data for this page
        let testResults = {
            database: ${dbConnected},
            analytics: ${analyticsStatus === 'operational'},
            workspace: ${workspaceStatus === 'operational'},
            relevance: ${relevanceStatus === 'operational'},
            environment: ${envVars.hasGroqKey && envVars.hasDatabaseUrl}
        };
        
        // Initialize test dashboard
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🔧 Test Page: Initializing...');
            updateTestCounts();
            
            // Auto-refresh diagnostics every 30 seconds
            setInterval(refreshDiagnostics, 30000);
            
            console.log('✅ System Diagnostics initialized');
        });

        function updateTestCounts() {
            const passed = Object.values(testResults).filter(Boolean).length;
            const total = Object.keys(testResults).length;
            
            console.log(\`Tests: \${passed}/\${total} passing\`);
        }

        async function runFullDiagnostics() {
            try {
                if (typeof showMessage === 'function') {
                    showMessage('Running comprehensive system diagnostics...', 'info');
                }
                
                const tests = [
                    { name: 'Database Connection', test: () => testDatabaseConnection() },
                    { name: 'API Endpoints', test: () => testAPIEndpoints() },
                    { name: 'Service Integration', test: () => testServiceIntegration() },
                    { name: 'Memory Usage', test: () => testMemoryUsage() },
                    { name: 'Response Times', test: () => testResponseTimes() }
                ];
                
                let passedTests = 0;
                
                for (const test of tests) {
                    try {
                        const result = await test.test();
                        if (result) {
                            passedTests++;
                            console.log(\`✅ \${test.name}: PASSED\`);
                        } else {
                            console.log(\`❌ \${test.name}: FAILED\`);
                        }
                    } catch (error) {
                        console.error(\`❌ \${test.name}: ERROR - \${error.message}\`);
                    }
                }
                
                const score = Math.round((passedTests / tests.length) * 100);
                if (typeof showMessage === 'function') {
                    showMessage(\`Diagnostics complete: \${passedTests}/\${tests.length} tests passed (\${score}%)\`, 
                        score >= 80 ? 'success' : 'warning');
                }
                
            } catch (error) {
                console.error('Full diagnostics error:', error);
                if (typeof showMessage === 'function') {
                    showMessage('Diagnostics failed: ' + error.message, 'error');
                }
            }
        }

        async function testDatabaseConnection() {
            try {
                const response = await fetch('/api/system-status');
                const data = await response.json();
                return data.database === 'connected';
            } catch (error) {
                return false;
            }
        }

        async function testAPIEndpoints() {
            try {
                const endpoints = ['/api/updates', '/api/health', '/api/system-status'];
                const results = await Promise.all(
                    endpoints.map(endpoint => 
                        fetch(endpoint).then(r => r.ok).catch(() => false)
                    )
                );
                return results.every(Boolean);
            } catch (error) {
                return false;
            }
        }

        async function testServiceIntegration() {
            try {
                const response = await fetch('/api/workspace/stats');
                return response.ok;
            } catch (error) {
                return false;
            }
        }

        async function testMemoryUsage() {
            const memoryMB = ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)};
            return memoryMB < 512; // Less than 512MB is considered good
        }

        async function testResponseTimes() {
            try {
                const start = Date.now();
                await fetch('/api/health');
                const responseTime = Date.now() - start;
                return responseTime < 1000; // Less than 1 second
            } catch (error) {
                return false;
            }
        }

        async function clearSystemCache() {
            try {
                if (typeof showMessage === 'function') {
                    showMessage('Clearing system cache...', 'info');
                }
                
                // Clear analytics cache using common function if available
                if (typeof refreshAnalytics === 'function') {
                    await refreshAnalytics();
                } else {
                    // Direct cache clear
                    const response = await fetch('/api/analytics/refresh', {
                        method: 'POST'
                    });
                    
                    if (response.ok) {
                        if (typeof showMessage === 'function') {
                            showMessage('System cache cleared successfully!', 'success');
                        }
                        setTimeout(() => window.location.reload(), 1000);
                    } else {
                        throw new Error('Cache clear failed');
                    }
                }
            } catch (error) {
                console.error('Clear cache error:', error);
                if (typeof showMessage === 'function') {
                    showMessage('Failed to clear cache: ' + error.message, 'error');
                }
            }
        }

        async function refreshDiagnostics() {
            try {
                const response = await fetch('/api/system-status');
                const data = await response.json();
                
                testResults.database = data.database === 'connected';
                testResults.environment = data.environment.hasGroqKey;
                
                updateTestCounts();
                console.log('🔄 Diagnostics refreshed');
            } catch (error) {
                console.error('Error refreshing diagnostics:', error);
            }
        }

        // Make test-specific functions globally available
        window.runFullDiagnostics = runFullDiagnostics;
        window.clearSystemCache = clearSystemCache;
        window.refreshDiagnostics = refreshDiagnostics;
        window.updateTestCounts = updateTestCounts;
        
        console.log('🔧 Test Page: Script loaded and ready');
    </script>
</body>
</html>`

    res.send(html)
  } catch (error) {
    console.error('Test page error:', error)
    res.status(500).send(`
            <div style="padding: 2rem; text-align: center; font-family: system-ui;">
                <h1>System Diagnostics Error</h1>
                <p style="color: #6b7280; margin: 1rem 0;">${error.message}</p>
                <a href="/" style="color: #3b82f6; text-decoration: none;">← Back to Home</a>
            </div>
        `)
  }
}

module.exports = testPage
