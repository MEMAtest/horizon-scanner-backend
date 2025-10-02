// src/routes/pages/analyticsPage.js
// CLEANED: Removed duplicate functions, kept only analytics-specific logic

const { getCommonStyles } = require('../templates/commonStyles')
const { getSidebar } = require('../templates/sidebar')
const { getCommonClientScripts } = require('../templates/clientScripts')

// Helper functions remain the same for fallback compatibility
const getAnalyticsService = () => {
  try {
    return require('../../services/analyticsService')
  } catch (error) {
    console.warn('Analytics service not available, using fallback')
    return {
      getAnalyticsDashboard: async () => ({
        success: false,
        dashboard: {
          overview: { totalUpdates: 0, averageRiskScore: 0, activePredictions: 0, hotspotCount: 0 },
          velocity: {},
          hotspots: [],
          predictions: []
        }
      })
    }
  }
}

const analyticsPage = async (req, res) => {
  try {
    const analyticsService = getAnalyticsService()
    let analyticsData = null

    try {
      const analyticsResponse = await analyticsService.getAnalyticsDashboard()
      if (analyticsResponse?.success) {
        analyticsData = analyticsResponse.dashboard
      }
    } catch (error) {
      console.warn('Analytics dashboard unavailable:', error.message)
    }

    const sidebarHtml = await getSidebar('analytics')

    // Helper functions for safe data rendering
    const renderMetricValue = (value, fallback = 'Loading...') => {
      return analyticsData ? (value || 0) : fallback
    }

    const renderVelocityData = () => {
      if (!analyticsData || !analyticsData.velocity) return ''

      return Object.entries(analyticsData.velocity).slice(0, 4).map(([auth, data]) => {
        const weeklyRate = (data.updatesPerWeek || 0).toFixed(1)
        return `
                    <div class="chart-stat">
                        <div class="chart-stat-value">${weeklyRate}</div>
                        <div class="chart-stat-label">${auth} per week</div>
                    </div>
                `
      }).join('')
    }

    const renderHotspotData = () => {
      if (!analyticsData || !analyticsData.hotspots) return ''

      return analyticsData.hotspots.slice(0, 4).map(hotspot => {
        return `
                    <div class="chart-stat">
                        <div class="chart-stat-value">${hotspot.activityScore || 0}</div>
                        <div class="chart-stat-label">${hotspot.sector || 'Unknown'}</div>
                    </div>
                `
      }).join('')
    }

    const renderPredictionStats = () => {
      if (!analyticsData || !analyticsData.predictions) return ''

      const highConfidence = analyticsData.predictions.filter(p => p.confidence >= 70).length
      const highPriority = analyticsData.predictions.filter(p => p.priority === 'high').length
      const overallConfidence = Math.round(analyticsData.confidence || 0)

      return `
                <div class="chart-stat">
                    <div class="chart-stat-value">${highConfidence}</div>
                    <div class="chart-stat-label">High Confidence</div>
                </div>
                <div class="chart-stat">
                    <div class="chart-stat-value">${highPriority}</div>
                    <div class="chart-stat-label">Priority Alerts</div>
                </div>
                <div class="chart-stat">
                    <div class="chart-stat-value">${overallConfidence}%</div>
                    <div class="chart-stat-label">Overall Confidence</div>
                </div>
            `
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Predictive Analytics Dashboard - Horizon Scanner</title>
    ${getCommonStyles()}
    <style>
        /* Analytics-specific styles - Match dashboard layout */
        body {
            display: flex;
            min-height: 100vh;
            background: #fafbfc;
        }

        .analytics-main {
            flex: 1;
            padding: 32px;
            margin-left: 280px;
            max-width: calc(100vw - 280px);
            overflow-x: hidden;
            background: #fafbfc;
        }
        
        .analytics-header {
            background: var(--neutral-white, #ffffff);
            color: var(--neutral-dark, #334155);
            padding: 2rem;
            border-radius: 8px;
            margin-bottom: 2rem;
            border: 1px solid var(--neutral-border, #e2e8f0);
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .analytics-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
        }
        
        .analytics-header > * {
            position: relative;
            z-index: 2;
        }
        
        .analytics-title {
            font-size: 1.75rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            color: var(--neutral-dark, #334155);
        }

        .analytics-title a {
            color: var(--primary-navy, #1e40af);
            text-decoration: none;
            transition: color 0.15s ease;
        }

        .analytics-title a:hover {
            color: var(--accent-blue-hover, #2563eb);
        }

        .analytics-subtitle {
            font-size: 1rem;
            color: var(--neutral-grey, #64748b); 
            opacity: 0.9;
        }
        
        .back-link {
            display: inline-block;
            color: rgba(255,255,255,0.8);
            text-decoration: none;
            margin-bottom: 1rem;
            transition: color 0.15s ease;
            font-size: 0.875rem;
        }
        
        .back-link:hover {
            color: white;
        }
        
        .metrics-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 1.5rem; 
            margin-bottom: 2rem;
        }
        
        .metric-card { 
            background: #ffffff; 
            padding: 1.5rem; 
            border-radius: 12px; 
            border: 1px solid #e5e7eb;
            box-shadow: 0 1px 3px rgba(0,0,0,0.02);
            transition: all 0.15s ease;
        }
        
        .metric-card:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            transform: translateY(-1px);
        }
        
        .metric-value { 
            font-size: 2rem; 
            font-weight: 700; 
            color: #1f2937; 
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .metric-icon {
            font-size: 1.5rem;
        }
        
        .metric-label { 
            color: #6b7280; 
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-weight: 500;
        }
        
        .metric-trend {
            font-size: 0.75rem;
            color: #059669;
            font-weight: 500;
            margin-top: 0.25rem;
        }
        
        .metric-trend.negative {
            color: #dc2626;
        }
        
        .chart-container { 
            background: #ffffff; 
            padding: 1.5rem; 
            border-radius: 12px; 
            border: 1px solid #e5e7eb;
            box-shadow: 0 1px 3px rgba(0,0,0,0.02);
            margin-bottom: 1.5rem;
        }
        
        .chart-title { 
            font-size: 1.125rem; 
            font-weight: 600; 
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: #1f2937;
        }
        
        .chart-placeholder {
            text-align: center;
            padding: 3rem;
            color: #6b7280;
            background: #f9fafb;
            border-radius: 8px;
            border: 2px dashed #e5e7eb;
            position: relative;
            overflow: hidden;
        }
        
        .chart-placeholder::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg, transparent 30%, rgba(59, 130, 246, 0.05) 50%, transparent 70%);
            animation: shimmer 2s infinite;
        }
        
        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        
        .chart-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
            position: relative;
            z-index: 2;
        }
        
        .chart-stat {
            text-align: center;
            padding: 0.75rem;
            background: rgba(255,255,255,0.8);
            border-radius: 6px;
            border: 1px solid #e5e7eb;
        }
        
        .chart-stat-value {
            font-size: 1.25rem;
            font-weight: 700;
            color: #1f2937;
        }
        
        .chart-stat-label {
            font-size: 0.75rem;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f4f6;
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-top: 1.5rem;
        }
        
        .status-card {
            background: #ffffff;
            padding: 1rem;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        
        .status-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            flex-shrink: 0;
        }
        
        .status-indicator.operational {
            background: #10b981;
            box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
        }
        
        .status-indicator.error {
            background: #ef4444;
            box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
        }
        
        .status-text {
            font-size: 0.875rem;
            font-weight: 500;
            color: #374151;
        }
        
        .insights-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .insight-card {
            background: #ffffff;
            padding: 1.5rem;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
            box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        
        .insight-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 1rem;
        }
        
        .insight-icon {
            font-size: 1.5rem;
        }
        
        .insight-title {
            font-size: 1rem;
            font-weight: 600;
            color: #1f2937;
        }
        
        .insight-content {
            color: #4b5563;
            font-size: 0.875rem;
            line-height: 1.5;
        }
        
        .insight-metric {
            font-size: 1.25rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 0.25rem;
        }
        
        .confidence-bar {
            height: 4px;
            background: #f3f4f6;
            border-radius: 2px;
            overflow: hidden;
            margin-top: 0.5rem;
        }
        
        .confidence-fill {
            height: 100%;
            background: linear-gradient(90deg, #ef4444, #f59e0b, #10b981);
            transition: width 0.3s ease;
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
        
        .refresh-btn {
            background: #059669;
            color: white;
        }
        
        .refresh-btn:hover {
            background: #047857;
        }
        
        @media (max-width: 768px) { 
            .analytics-container {
                grid-template-columns: 1fr;
            }
            
            .sidebar {
                display: none;
            }
            
            .metrics-grid {
                grid-template-columns: 1fr;
            }
            
            .action-buttons {
                flex-direction: column;
            }
        }

        /* CRITICAL: Force analytics content visibility with highest specificity */
        html body {
            display: flex !important;
            min-height: 100vh !important;
            background: #fafbfc !important;
        }

        html body .analytics-main {
            flex: 1 !important;
            padding: 32px !important;
            margin-left: 280px !important;
            max-width: calc(100vw - 280px) !important;
            overflow-x: hidden !important;
            background: #fafbfc !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            z-index: 1001 !important;
        }

        html body .analytics-header {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: relative !important;
            z-index: 1002 !important;
        }

        html body .metrics-grid {
            display: grid !important;
            visibility: visible !important;
            opacity: 1 !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 1.5rem !important;
            margin-bottom: 2rem !important;
            position: relative !important;
            z-index: 1003 !important;
        }

        html body .metric-card {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            background: white !important;
            border: 1px solid #e5e7eb !important;
            border-radius: 8px !important;
            padding: 1.5rem !important;
            position: relative !important;
            z-index: 1004 !important;
        }

        /* Force text content to be visible */
        html body .analytics-main * {
            color: #374151 !important;
            visibility: visible !important;
        }

        html body .analytics-title a {
            color: var(--primary-navy, #1e40af) !important;
        }

        html body .analytics-subtitle {
            color: var(--neutral-grey, #64748b) !important;
        }
    </style>
</head>
<body>
    ${sidebarHtml}

    <main class="analytics-main">
            <div class="analytics-header">
                <a href="/" class="back-link">← Back to Home</a>
                <h1 class="analytics-title">
                    <a href="/">🔮 Predictive Analytics Dashboard</a>
                </h1>
                <p class="analytics-subtitle">AI-powered regulatory intelligence and forecasting</p>
            </div>
            
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-value">
                        <span class="metric-icon">📊</span>
                        <span id="totalUpdates">${renderMetricValue(analyticsData?.overview?.totalUpdates)}</span>
                    </div>
                    <div class="metric-label">Total Updates</div>
                    <div class="metric-trend">↗ Updated continuously</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">
                        <span class="metric-icon">⚡</span>
                        <span id="averageRisk">${analyticsData ? Math.round(analyticsData.overview?.averageRiskScore || 0) + '%' : 'Loading...'}</span>
                    </div>
                    <div class="metric-label">Average Risk Score</div>
                    <div class="metric-trend">Risk assessment active</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">
                        <span class="metric-icon">🎯</span>
                        <span id="activePredictions">${renderMetricValue(analyticsData?.predictions?.length)}</span>
                    </div>
                    <div class="metric-label">Active Predictions</div>
                    <div class="metric-trend">AI models running</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">
                        <span class="metric-icon">🔥</span>
                        <span id="hotspotCount">${analyticsData ? (analyticsData.hotspots?.filter(h => h.riskLevel === 'high').length || 0) : 'Loading...'}</span>
                    </div>
                    <div class="metric-label">High Risk Sectors</div>
                    <div class="metric-trend">Monitoring active</div>
                </div>
            </div>
            
            <div class="insights-grid">
                <div class="insight-card">
                    <div class="insight-header">
                        <span class="insight-icon">🚀</span>
                        <span class="insight-title">Regulatory Velocity</span>
                    </div>
                    <div class="insight-metric" id="velocityMetric">
                        ${analyticsData ? Object.values(analyticsData.velocity || {}).reduce((sum, auth) => sum + (auth.updatesPerWeek || 0), 0).toFixed(1) : '0'} updates/week
                    </div>
                    <div class="insight-content">
                        Cross-authority regulatory activity monitoring with trend analysis and velocity predictions.
                    </div>
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width: 85%"></div>
                    </div>
                </div>
                
                <div class="insight-card">
                    <div class="insight-header">
                        <span class="insight-icon">🎯</span>
                        <span class="insight-title">Sector Hotspots</span>
                    </div>
                    <div class="insight-metric" id="hotspotMetric">
                        ${analyticsData ? (analyticsData.hotspots?.length || 0) : 0} sectors analyzed
                    </div>
                    <div class="insight-content">
                        AI-powered identification of sectors with elevated regulatory activity and impact assessment.
                    </div>
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width: 92%"></div>
                    </div>
                </div>
                
                <div class="insight-card">
                    <div class="insight-header">
                        <span class="insight-icon">📈</span>
                        <span class="insight-title">Impact Forecasting</span>
                    </div>
                    <div class="insight-metric" id="forecastMetric">
                        ${analyticsData ? (analyticsData.predictions?.length || 0) : 0} predictions active
                    </div>
                    <div class="insight-content">
                        Predictive modeling for regulatory developments, deadline estimation, and compliance impact analysis.
                    </div>
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width: 78%"></div>
                    </div>
                </div>
            </div>
            
            <div class="chart-container">
                <h2 class="chart-title">
                    🚀 Regulatory Velocity Trends
                </h2>
                ${analyticsData
? `
                    <div class="chart-placeholder">
                        <p style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem;">Advanced Analytics Engine Active</p>
                        <p>Velocity analysis tracks regulatory activity patterns across ${Object.keys(analyticsData.velocity || {}).length} authorities</p>
                        <div class="chart-stats">
                            ${renderVelocityData()}
                        </div>
                    </div>
                `
: `
                    <div class="chart-placeholder">
                        <div class="loading-spinner"></div>
                        <p>Loading velocity analytics...</p>
                    </div>
                `}
            </div>
            
            <div class="chart-container">
                <h2 class="chart-title">
                    🔥 Sector Hotspots Analysis
                </h2>
                ${analyticsData
? `
                    <div class="chart-placeholder">
                        <p style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem;">AI Hotspot Detection</p>
                        <p>Identified ${analyticsData.hotspots?.length || 0} sector activity patterns with ${analyticsData.hotspots?.filter(h => h.riskLevel === 'high').length || 0} high-risk areas</p>
                        <div class="chart-stats">
                            ${renderHotspotData()}
                        </div>
                    </div>
                `
: `
                    <div class="chart-placeholder">
                        <div class="loading-spinner"></div>
                        <p>Loading sector analysis...</p>
                    </div>
                `}
            </div>
            
            <div class="chart-container">
                <h2 class="chart-title">
                    📈 Predictive Insights
                </h2>
                ${analyticsData
? `
                    <div class="chart-placeholder">
                        <p style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem;">Machine Learning Predictions</p>
                        <p>Generated ${analyticsData.predictions?.length || 0} predictive insights with confidence scoring and trend analysis</p>
                        <div class="chart-stats">
                            ${renderPredictionStats()}
                        </div>
                    </div>
                `
: `
                    <div class="chart-placeholder">
                        <div class="loading-spinner"></div>
                        <p>Loading predictive models...</p>
                    </div>
                `}
            </div>
            
            <div class="chart-container">
                <h2 class="chart-title">📊 System Status</h2>
                <div class="status-grid">
                    <div class="status-card">
                        <div class="status-indicator ${analyticsData ? 'operational' : 'error'}"></div>
                        <div class="status-text">Analytics Engine</div>
                    </div>
                    <div class="status-card">
                        <div class="status-indicator operational"></div>
                        <div class="status-text">Data Pipeline</div>
                    </div>
                    <div class="status-card">
                        <div class="status-indicator operational"></div>
                        <div class="status-text">Prediction Models</div>
                    </div>
                    <div class="status-card">
                        <div class="status-indicator operational"></div>
                        <div class="status-text">Risk Assessment</div>
                    </div>
                </div>
            </div>
            
            <div class="action-buttons">
                <button onclick="refreshAnalytics()" class="btn refresh-btn">
                    🔄 Refresh Analytics
                </button>
                <a href="/dashboard" class="btn btn-primary">
                    📰 View News Feed
                </a>
                <a href="/api/analytics/dashboard" class="btn btn-secondary">
                    📊 Raw Data (JSON)
                </a>
                <a href="/" class="btn btn-secondary">
                    🏠 Return to Home
                </a>
            </div>
        </div>
    </main>
    
    ${getCommonClientScripts()}
    
    <script>
        // =================
        // ANALYTICS PAGE SPECIFIC LOGIC ONLY
        // =================
        
        // Analytics data for this page
        let analyticsData = ${analyticsData ? JSON.stringify(analyticsData) : 'null'};
        
        // Initialize analytics dashboard
        document.addEventListener('DOMContentLoaded', function() {
            console.log('📊 Analytics Page: Initializing...');
            console.log('📊 Initial analyticsData:', analyticsData);

            // Always load fresh data on page load
            loadAnalyticsDashboard();

            // Auto-refresh every 2 minutes
            setInterval(loadAnalyticsDashboard, 120000);

            console.log('✅ Analytics Dashboard initialized');
        });

        async function loadAnalyticsDashboard() {
            try {
                console.log('📊 Loading analytics dashboard...');
                const response = await fetch('/api/analytics');
                console.log('📊 Response status:', response.status);

                const data = await response.json();
                console.log('📊 Response data:', data);
                console.log('📊 data.success:', data.success, typeof data.success);
                console.log('📊 data.dashboard:', data.dashboard, typeof data.dashboard);
                console.log('📊 Condition check:', !!(data.success && data.dashboard));

                if (data.success && data.dashboard) {
                    // Use the new dashboard API response format
                    analyticsData = data.dashboard;
                    console.log('📊 Analytics data loaded:', analyticsData);
                    updateMetrics();
                    console.log('✅ Analytics dashboard loaded and metrics updated');
                } else {
                    console.error('❌ Failed to load analytics dashboard:', data);
                    // Show error state
                    analyticsData = null;
                    updateMetrics();
                }
            } catch (error) {
                console.error('❌ Error loading analytics:', error);
                // Show error state
                analyticsData = null;
                updateMetrics();
            }
        }
        
        function updateMetrics() {
            console.log('📊 UpdateMetrics called, analyticsData:', analyticsData);

            if (!analyticsData) {
                console.log('📊 No analytics data available, showing loading state');
                return;
            }

            console.log('📊 Updating metrics with data:', analyticsData);

            // Update main metrics
            const totalElement = document.getElementById('totalUpdates');
            const riskElement = document.getElementById('averageRisk');
            const predictionsElement = document.getElementById('activePredictions');
            const hotspotsElement = document.getElementById('hotspotCount');

            console.log('📊 Found elements:', {
                totalElement: !!totalElement,
                riskElement: !!riskElement,
                predictionsElement: !!predictionsElement,
                hotspotsElement: !!hotspotsElement
            });

            if (totalElement) {
                totalElement.textContent = analyticsData.overview?.totalUpdates || 0;
                console.log('📊 Set total updates to:', analyticsData.overview?.totalUpdates);
            }
            if (riskElement) {
                const riskScore = Math.round(analyticsData.overview?.averageRiskScore || 0) + '%';
                riskElement.textContent = riskScore;
                console.log('📊 Set risk score to:', riskScore);
            }
            if (predictionsElement) {
                const predictions = analyticsData.predictions?.length || 0;
                predictionsElement.textContent = predictions;
                console.log('📊 Set predictions to:', predictions);
            }
            if (hotspotsElement) {
                const hotspots = analyticsData.hotspots?.filter(h => h.riskLevel === 'high').length || 0;
                hotspotsElement.textContent = hotspots;
                console.log('📊 Set hotspots to:', hotspots);
            }
            
            // Update insight metrics
            const totalVelocity = Object.values(analyticsData.velocity || {})
                .reduce((sum, auth) => sum + (auth.updatesPerWeek || 0), 0);
            
            const velocityElement = document.getElementById('velocityMetric');
            const hotspotMetricElement = document.getElementById('hotspotMetric');
            const forecastElement = document.getElementById('forecastMetric');
            
            if (velocityElement) velocityElement.textContent = totalVelocity.toFixed(1) + ' updates/week';
            if (hotspotMetricElement) hotspotMetricElement.textContent = analyticsData.hotspots.length + ' sectors analyzed';
            if (forecastElement) forecastElement.textContent = analyticsData.predictions.length + ' predictions active';

            // Update status indicators
            updateStatusIndicators();
        }

        function updateStatusIndicators() {
            // Update analytics engine status based on data availability
            const statusIndicators = document.querySelectorAll('.status-indicator');
            if (statusIndicators.length > 0) {
                const analyticsStatusIndicator = statusIndicators[0]; // First one is Analytics Engine
                if (analyticsData) {
                    analyticsStatusIndicator.classList.remove('error');
                    analyticsStatusIndicator.classList.add('operational');
                } else {
                    analyticsStatusIndicator.classList.remove('operational');
                    analyticsStatusIndicator.classList.add('error');
                }
            }
        }

        // Make analytics-specific functions globally available
        window.loadAnalyticsDashboard = loadAnalyticsDashboard;
        window.updateMetrics = updateMetrics;

        console.log('📊 Analytics Page: Script loaded and ready');
    </script>

    <!-- ULTIMATE CSS FIX: Applied at the very end to override everything -->
    <style>
        html body {
            display: flex !important;
            min-height: 100vh !important;
            background: #fafbfc !important;
        }

        html body .analytics-main {
            flex: 1 !important;
            padding: 32px !important;
            margin-left: 280px !important;
            max-width: calc(100vw - 280px) !important;
            overflow-x: hidden !important;
            background: #fafbfc !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            z-index: 99999 !important;
        }

        html body .analytics-header,
        html body .metrics-grid,
        html body .metric-card,
        html body .analytics-main *,
        html body .analytics-main .metric-value,
        html body .analytics-main .metric-label {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            color: #374151 !important;
            z-index: 99999 !important;
        }

        html body .analytics-title a {
            color: var(--primary-navy, #1e40af) !important;
        }

        html body .analytics-subtitle {
            color: var(--neutral-grey, #64748b) !important;
        }

        html body .metrics-grid {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 1.5rem !important;
        }

        html body .metric-card {
            background: white !important;
            border: 1px solid #e5e7eb !important;
            border-radius: 8px !important;
            padding: 1.5rem !important;
        }
    </style>
</body>
</html>`

    res.send(html)
  } catch (error) {
    console.error('Analytics page error:', error)
    res.status(500).send(`
            <div style="padding: 2rem; text-align: center; font-family: system-ui;">
                <h1>Analytics Dashboard Error</h1>
                <p style="color: #6b7280; margin: 1rem 0;">${error.message}</p>
                <a href="/" style="color: #3b82f6; text-decoration: none;">← Back to Home</a>
            </div>
        `)
  }
}

module.exports = analyticsPage
