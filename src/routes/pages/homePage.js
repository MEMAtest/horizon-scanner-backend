// src/routes/pages/homePage.js
// CLEANED: Removed duplicate functions, kept only page-specific logic

const { getCommonStyles } = require('../templates/commonStyles');
const { getSidebar } = require('../templates/sidebar');
const { getCommonClientScripts } = require('../templates/clientScripts');
const dbService = require('../../services/dbService');

// Helper function to get missing services with graceful fallbacks
const getAnalyticsService = () => {
    try {
        return require('../../services/analyticsService');
    } catch (error) {
        console.warn('Analytics service not available, using fallback');
        return {
            getAnalyticsDashboard: () => ({ success: false, dashboard: { overview: { totalUpdates: 0, averageRiskScore: 0 }, velocity: {}, hotspots: [], predictions: [] } })
        };
    }
};

const getRelevanceService = () => {
    try {
        return require('../../services/relevanceService');
    } catch (error) {
        console.warn('Relevance service not available, using fallback');
        return {
            calculateRelevanceScore: () => 0,
            categorizeByRelevance: (updates) => ({ high: [], medium: [], low: updates || [] })
        };
    }
};

const getWorkspaceService = () => {
    try {
        return require('../../services/workspaceService');
    } catch (error) {
        console.warn('Workspace service not available, using fallback');
        return {
            getWorkspaceStats: () => ({ success: true, stats: { pinnedItems: 0, savedSearches: 0, activeAlerts: 0 } }),
            getPinnedItems: () => ({ success: true, items: [] }),
            addPinnedItem: () => ({ success: true }),
            removePinnedItem: () => ({ success: true })
        };
    }
};

const homePage = async (req, res) => {
    try {
        // Calculate enhanced counts for the new filtering sections
        const updates = await dbService.getAllUpdates();
        
        // Calculate category counts based on content classification
        let consultationCount = 0, guidanceCount = 0, enforcementCount = 0;
        let speechCount = 0, newsCount = 0, policyCount = 0;
        let finalRuleCount = 0, proposalCount = 0, noticeCount = 0, reportCount = 0;
        let rssCount = 0, scrapedCount = 0, directCount = 0;
        
        updates.forEach(update => {
            const headline = (update.headline || '').toLowerCase();
            const impact = (update.impact || '').toLowerCase();
            const content = headline + ' ' + impact;
            const url = update.url || '';
            
            // Category classification
            if (content.includes('consultation')) consultationCount++;
            else if (content.includes('guidance')) guidanceCount++;
            else if (content.includes('enforcement') || content.includes('fine')) enforcementCount++;
            else if (content.includes('speech')) speechCount++;
            else if (content.includes('policy')) policyCount++;
            else newsCount++;
            
            // Content type classification
            if (content.includes('final rule')) finalRuleCount++;
            else if (content.includes('proposal')) proposalCount++;
            else if (content.includes('notice')) noticeCount++;
            else if (content.includes('report')) reportCount++;
            
            // Source type classification
            if (url.includes('rss') || url.includes('feed') || update.sourceType === 'rss') rssCount++;
            else if (url.includes('gov.uk') || update.sourceType === 'direct') directCount++;
            else scrapedCount++;
        });
        
        const authorityCount = {};
        updates.forEach(update => {
            const auth = update.authority || 'Unknown';
            authorityCount[auth] = (authorityCount[auth] || 0) + 1;
        });
        
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
            // NEW: Enhanced counts for filtering
            consultationCount,
            guidanceCount,
            enforcementCount,
            speechCount,
            newsCount,
            policyCount,
            finalRuleCount,
            proposalCount,
            noticeCount,
            reportCount,
            rssCount,
            scrapedCount,
            directCount
        };

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Regulatory Horizon Scanner</title>
    ${getCommonStyles()}
    <style>
        /* Enhanced home page specific styles */
        .streams-container { 
            flex: 1; 
            padding: 1.5rem; 
            overflow-y: auto; 
            display: flex; 
            flex-direction: column; 
            gap: 1rem;
            height: calc(100vh - 120px);
        }
        
        .intelligence-stream { 
            background: #ffffff; 
            border: 1px solid #e5e7eb; 
            border-radius: 8px; 
            overflow: hidden; 
            box-shadow: 0 1px 3px rgba(0,0,0,0.02);
            display: flex;
            flex-direction: column;
            transition: all 0.3s ease;
        }
        
        .intelligence-stream.expanded {
            flex: 1;
            min-height: 70vh;
        }
        
        .intelligence-stream.collapsed {
            max-height: 200px;
        }
        
        .stream-header { 
            padding: 1rem 1.5rem; 
            border-bottom: 1px solid #f3f4f6; 
            display: flex; 
            align-items: center; 
            justify-content: space-between;
            flex-shrink: 0;
            cursor: pointer;
        }
        
        .stream-header:hover {
            background: #f9fafb;
        }
        
        .stream-title { 
            display: flex; 
            align-items: center; 
            gap: 0.75rem; 
            font-size: 0.875rem; 
            font-weight: 600; 
        }
        
        .stream-icon { 
            width: 12px; 
            height: 12px; 
            border-radius: 50%; 
        }
        
        .stream-icon.high { background: #dc2626; }
        .stream-icon.medium { background: #f59e0b; }
        .stream-icon.low { background: #10b981; }
        
        .stream-meta { 
            display: flex; 
            align-items: center; 
            gap: 1rem; 
            font-size: 0.75rem; 
            color: #6b7280; 
        }
        
        .expand-btn {
            background: none;
            border: none;
            color: #6b7280;
            cursor: pointer;
            padding: 0.25rem;
            border-radius: 4px;
            font-size: 0.875rem;
            transition: all 0.15s ease;
            display: flex;
            align-items: center;
            gap: 0.25rem;
        }

        .expand-btn:hover {
            background: #f3f4f6;
            color: #374151;
        }
        
        .timeline-bar { 
            width: 100px; 
            height: 4px; 
            background: #f3f4f6; 
            border-radius: 2px; 
            overflow: hidden; 
            position: relative;
            cursor: help;
        }
        
        .timeline-fill { 
            height: 100%; 
            background: #3b82f6; 
            transition: width 0.3s ease; 
        }

        .timeline-bar:hover::after {
            content: attr(data-tooltip);
            position: absolute;
            bottom: 120%;
            left: 50%;
            transform: translateX(-50%);
            background: #1f2937;
            color: white;
            padding: 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            white-space: nowrap;
            z-index: 1000;
        }
        
        .stream-content { 
            overflow-y: auto;
            flex: 1;
            max-height: 500px;
        }

        .stream-content.expanded {
            max-height: none;
        }
        
        .update-card { 
            padding: 1rem 1.5rem; 
            border-bottom: 1px solid #f9fafb; 
            transition: all 0.15s ease; 
            position: relative; 
        }
        
        .update-card:hover { 
            background: #f9fafb; 
        }
        
        .update-card:last-child { 
            border-bottom: none; 
        }
        
        .update-header { 
            display: flex; 
            align-items: flex-start; 
            justify-content: space-between; 
            margin-bottom: 0.75rem; 
        }
        
        .update-title { 
            font-size: 0.875rem; 
            font-weight: 600; 
            color: #1f2937; 
            line-height: 1.4; 
            flex: 1; 
            margin-right: 1rem; 
            cursor: pointer;
        }
        
        .update-actions {
            display: flex;
            gap: 0.5rem;
            align-items: flex-start;
        }

        .pin-btn, .expand-content-btn {
            background: none;
            border: none;
            color: #6b7280;
            cursor: pointer;
            padding: 0.25rem;
            border-radius: 4px;
            font-size: 0.875rem;
            transition: all 0.15s ease;
        }

        .pin-btn:hover, .expand-content-btn:hover {
            background: #f3f4f6;
            color: #374151;
        }

        .pin-btn.pinned {
            color: #dc2626;
        }

        .date-display {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            font-size: 0.7rem;
            color: #6b7280;
        }

        .publication-date {
            font-weight: 600;
            color: #374151;
        }

        .platform-date {
            font-size: 0.65rem;
            color: #9ca3af;
            margin-top: 0.125rem;
        }
        
        .update-badges { 
            display: flex; 
            gap: 0.375rem; 
            flex-shrink: 0; 
            flex-wrap: wrap;
            margin-bottom: 0.75rem;
        }
        
        .badge { 
            padding: 0.25rem 0.75rem; 
            border-radius: 6px; 
            font-size: 0.75rem; 
            font-weight: 600; 
            text-transform: uppercase; 
            letter-spacing: 0.025em; 
            border: 1px solid transparent;
            transition: all 0.15s ease;
        }
        
        .badge-fca { 
            background: linear-gradient(135deg, #2563eb, #3b82f6); 
            color: white; 
            border-color: #1d4ed8;
            box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
        }
        .badge-boe { 
            background: linear-gradient(135deg, #059669, #10b981); 
            color: white; 
            border-color: #047857;
            box-shadow: 0 2px 4px rgba(5, 150, 105, 0.2);
        }
        .badge-pra { 
            background: linear-gradient(135deg, #dc2626, #ef4444); 
            color: white; 
            border-color: #b91c1c;
            box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2);
        }
        .badge-tpr { 
            background: linear-gradient(135deg, #7c3aed, #8b5cf6); 
            color: white; 
            border-color: #6d28d9;
            box-shadow: 0 2px 4px rgba(124, 58, 237, 0.2);
        }
        .badge-sfo { 
            background: linear-gradient(135deg, #ea580c, #f97316); 
            color: white; 
            border-color: #c2410c;
            box-shadow: 0 2px 4px rgba(234, 88, 12, 0.2);
        }
        .badge-fatf { 
            background: linear-gradient(135deg, #374151, #4b5563); 
            color: white; 
            border-color: #1f2937;
            box-shadow: 0 2px 4px rgba(55, 65, 81, 0.2);
        }
        
        .badge:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        
        .update-summary { 
            color: #4b5563; 
            font-size: 0.8125rem; 
            line-height: 1.4; 
            margin-bottom: 0.75rem; 
            position: relative;
        }

        .update-summary.truncated {
            max-height: 3em;
            overflow: hidden;
            position: relative;
        }

        .update-summary.truncated::after {
            content: '';
            position: absolute;
            bottom: 0;
            right: 0;
            width: 60px;
            height: 1.2em;
            background: linear-gradient(to right, transparent, #ffffff);
        }

        .update-summary.expanded {
            max-height: none;
        }

        .read-more-btn {
            background: none;
            border: none;
            color: #3b82f6;
            cursor: pointer;
            font-size: 0.75rem;
            font-weight: 500;
            padding: 0.25rem 0;
            margin-top: 0.25rem;
        }

        .read-more-btn:hover {
            color: #2563eb;
            text-decoration: underline;
        }
        
        .update-footer { 
            display: flex; 
            align-items: center; 
            justify-content: space-between; 
            font-size: 0.75rem; 
            color: #6b7280; 
        }
        
        .update-time { 
            display: flex; 
            align-items: center; 
            gap: 0.375rem; 
        }
        
        .view-details { 
            color: #3b82f6; 
            text-decoration: none; 
            font-weight: 500; 
            display: flex; 
            align-items: center; 
            gap: 0.25rem; 
            transition: color 0.15s ease; 
        }
        
        .view-details:hover { 
            color: #2563eb; 
        }
        
        .welcome-content { 
            text-align: center; 
            padding: 3rem 1.5rem; 
            color: #6b7280; 
        }
        
        .welcome-icon { 
            font-size: 3rem; 
            margin-bottom: 1rem; 
        }
        
        .welcome-title { 
            font-size: 1.25rem; 
            font-weight: 600; 
            color: #374151; 
            margin-bottom: 0.5rem; 
        }
        
        .welcome-subtitle { 
            margin-bottom: 1.5rem; 
        }

        /* Modal Styles */
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
            backdrop-filter: blur(2px);
        }

        .modal-content {
            background-color: #fefefe;
            margin: 5% auto;
            padding: 2rem;
            border-radius: 12px;
            width: 90%;
            max-width: 500px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.25);
            position: relative;
            max-height: 80vh;
            overflow-y: auto;
        }

        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }

        .modal-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: #1f2937;
        }

        .close {
            color: #aaa;
            font-size: 1.5rem;
            font-weight: bold;
            cursor: pointer;
            line-height: 1;
        }

        .close:hover {
            color: #000;
        }

        .form-group {
            margin-bottom: 1rem;
        }

        .form-label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: #374151;
        }

        .form-input {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 0.875rem;
        }

        .form-input:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .sector-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 0.5rem;
            margin-top: 0.5rem;
        }

        .sector-checkbox {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem;
            border: 2px solid #e5e7eb;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.15s ease;
            background: white;
            user-select: none;
        }

        .sector-checkbox:hover {
            background: #f9fafb;
            border-color: #d1d5db;
        }

        .sector-checkbox.selected {
            background: #eff6ff;
            border-color: #3b82f6;
            color: #1e40af;
        }

        .sector-checkbox input {
            margin: 0;
            appearance: none;
            width: 16px;
            height: 16px;
            border: 2px solid #d1d5db;
            border-radius: 3px;
            position: relative;
        }

        .sector-checkbox input:checked {
            background: #3b82f6;
            border-color: #3b82f6;
        }

        .sector-checkbox input:checked::after {
            content: '✓';
            position: absolute;
            top: -2px;
            left: 1px;
            color: white;
            font-size: 12px;
            font-weight: bold;
        }

        .sector-checkbox label {
            cursor: pointer;
            font-size: 0.8125rem;
            font-weight: 500;
        }

        .modal-actions {
            display: flex;
            gap: 1rem;
            justify-content: flex-end;
            margin-top: 1.5rem;
        }

        .btn {
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
            border: none;
        }

        .btn-primary {
            background: #3b82f6;
            color: white;
        }

        .btn-primary:hover {
            background: #2563eb;
        }

        .btn-primary:disabled {
            background: #9ca3af;
            cursor: not-allowed;
        }

        .btn-secondary {
            background: #f3f4f6;
            color: #374151;
        }

        .btn-secondary:hover {
            background: #e5e7eb;
        }

        .message {
            padding: 0.75rem;
            border-radius: 6px;
            margin-bottom: 1rem;
            font-size: 0.875rem;
        }

        .message.error {
            background: #fef2f2;
            color: #dc2626;
            border: 1px solid #fecaca;
        }

        .message.success {
            background: #f0fdf4;
            color: #166534;
            border: 1px solid #bbf7d0;
        }

        .action-btn {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            color: #64748b;
            padding: 0.5rem 0.75rem;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
            text-decoration: none;
            display: inline-block;
        }

        .action-btn:hover {
            background: #f1f5f9;
            color: #475569;
            border-color: #cbd5e1;
        }

        .action-btn.working {
            background: #eff6ff;
            color: #2563eb;
            border-color: #bfdbfe;
        }

        /* Enhanced relevance display */
        .relevance-score {
            background: #f3f4f6;
            color: #374151;
            padding: 0.125rem 0.5rem;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 500;
            position: relative;
            cursor: help;
        }

        .relevance-score.high {
            background: #fef2f2;
            color: #dc2626;
        }

        .relevance-score.medium {
            background: #fffbeb;
            color: #d97706;
        }

        .relevance-score:hover::after {
            content: "Relevance based on your firm's sectors and AI analysis. Higher scores indicate greater importance to your business.";
            position: absolute;
            bottom: 120%;
            left: 50%;
            transform: translateX(-50%);
            background: #1f2937;
            color: white;
            padding: 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            white-space: nowrap;
            z-index: 1000;
            max-width: 250px;
            white-space: normal;
            text-align: center;
        }

        .risk-score {
            background: #f3f4f6;
            color: #374151;
            padding: 0.125rem 0.5rem;
            border-radius: 4px;
            font-size: 0.625rem;
            font-weight: 500;
        }

        .risk-score.high {
            background: #fef2f2;
            color: #dc2626;
        }

        .risk-score.medium {
            background: #fffbeb;
            color: #d97706;
        }

        .risk-score.low {
            background: #f0fdf4;
            color: #166534;
        }

        /* Source indicator */
        .source-indicator {
            font-size: 0.8rem;
            opacity: 0.7;
            cursor: help;
        }

        /* Firm Profile Setup */
        .firm-profile-section {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1.5rem;
        }

        .setup-profile-btn {
            width: 100%;
            background: #3b82f6;
            color: white;
            border: none;
            padding: 0.75rem;
            border-radius: 6px;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.15s ease;
        }

        .setup-profile-btn:hover {
            background: #2563eb;
        }

        .setup-profile-btn.configured {
            background: #059669;
        }

        .setup-profile-btn.configured:hover {
            background: #047857;
        }

        .profile-info {
            font-size: 0.75rem;
            color: #64748b;
            margin-top: 0.5rem;
        }

        .clear-profile-btn {
            width: 100%;
            background: #f87171;
            color: white;
            border: none;
            padding: 0.5rem;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.15s ease;
            margin-top: 0.5rem;
        }

        .clear-profile-btn:hover {
            background: #ef4444;
        }

        /* Analytics Preview */
        .analytics-preview {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1.5rem;
            color: white;
            position: relative;
            overflow: hidden;
        }

        .analytics-preview::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            z-index: 1;
        }

        .analytics-preview > * {
            position: relative;
            z-index: 2;
        }

        .analytics-preview-title {
            font-size: 0.875rem;
            font-weight: 600;
            margin-bottom: 0.75rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .analytics-metrics {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem;
            margin-bottom: 1rem;
        }

        .analytics-metric {
            text-align: center;
        }

        .analytics-metric-value {
            font-size: 1.25rem;
            font-weight: 700;
            line-height: 1;
        }

        .analytics-metric-label {
            font-size: 0.625rem;
            opacity: 0.9;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .analytics-preview-link {
            background: rgba(255,255,255,0.2);
            color: white;
            text-decoration: none;
            padding: 0.5rem 0.75rem;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 500;
            display: inline-block;
            transition: all 0.15s ease;
            border: 1px solid rgba(255,255,255,0.3);
        }

        .analytics-preview-link:hover {
            background: rgba(255,255,255,0.3);
            color: white;
        }
    </style>
</head>
<body>
    <div class="page-container">
        ${getSidebar('home', counts)}
        
        <!-- Main Content Area -->
        <div class="main-content">
            <!-- Enhanced Status Bar -->
            <div class="status-bar">
                <div class="status-left">
                    <div class="live-indicator">
                        <div class="pulse-dot"></div>
                        <span>Live Feed</span>
                    </div>
                    <div class="status-item">
                        <span id="newCount">0 New</span>
                    </div>
                    <div class="status-item">
                        <span id="lastUpdate">Last: Never</span>
                    </div>
                    <div class="status-item" id="firmStatus" style="display: none;">
                        <span>🏢 <span id="firmName"></span></span>
                    </div>
                </div>
                <button onclick="refreshIntelligence()" class="refresh-btn" id="refreshBtn">
                    <span id="refreshIcon">🔄</span>
                    <span>Refresh Data</span>
                </button>
            </div>
            
            <!-- Enhanced Regulatory News Streams -->
            <div class="streams-container" id="streamsContainer">
                <div class="welcome-content">
                    <div class="welcome-icon">📡</div>
                    <div class="welcome-title">Enterprise Regulatory Intelligence</div>
                    <div class="welcome-subtitle">
                        Your AI-powered monitoring system is ready. Set up your firm profile and click "Refresh Data" to begin streaming personalized regulatory updates with predictive analytics and advanced filtering.
                    </div>
                    <p style="font-size: 0.875rem; color: #9ca3af;">
                        <strong>Monitored Sources:</strong> FCA • Bank of England • PRA • TPR • SFO • FATF<br>
                        <strong>NEW:</strong> Enhanced filtering by category, content type, and source with priority classification
                    </p>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Firm Profile Setup Modal -->
    <div id="firmProfileModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">Setup Firm Profile</h2>
                <span class="close" onclick="closeFirmProfileModal()">&times;</span>
            </div>
            
            <div id="messageContainer"></div>
            
            <form id="firmProfileForm">
                <div class="form-group">
                    <label class="form-label" for="firmNameInput">Firm Name</label>
                    <input type="text" id="firmNameInput" class="form-input" placeholder="Enter your firm name" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label" for="firmSizeInput">Firm Size</label>
                    <select id="firmSizeInput" class="form-input">
                        <option value="Small">Small (1-50 employees)</option>
                        <option value="Medium" selected>Medium (51-250 employees)</option>
                        <option value="Large">Large (250+ employees)</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Primary Business Sectors (Select 1-3)</label>
                    <div class="sector-grid" id="sectorGrid">
                        <!-- Sectors will be populated by JavaScript -->
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeFirmProfileModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary" id="saveProfileBtn">Save Profile</button>
                </div>
            </form>
        </div>
    </div>
    
    ${getCommonClientScripts()}
    
    <script>
        // =================
        // HOME PAGE SPECIFIC LOGIC ONLY
        // =================
        
        // Initialize home page when DOM is ready
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🏠 Home Page: Initializing...');
            
            // Initialize the system using the common functions
            if (typeof initializeSystem === 'function') {
                initializeSystem().then(() => {
                    console.log('✅ Home Page: System initialized successfully');
                }).catch(error => {
                    console.error('❌ Home Page: System initialization failed:', error);
                });
            } else {
                console.error('❌ Home Page: initializeSystem function not found');
            }
        });
        
        console.log('🏠 Home Page: Script loaded and ready');
    </script>
</body>
</html>`;
        
        res.send(html);
        
    } catch (error) {
        console.error('Home page error:', error);
        res.status(500).send(`
            <div style="padding: 2rem; text-align: center;">
                <h1>Home Page Error</h1>
                <p>${error.message}</p>
                <a href="/test" style="color: #3b82f6;">View System Diagnostics</a>
            </div>
        `);
    }
};

module.exports = homePage;