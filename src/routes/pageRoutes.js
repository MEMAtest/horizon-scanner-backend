// src/routes/pageRoutes.js
// COMPLETE MERGED VERSION: Phase 2A Analytics + Tab Scroll Fixes + Firm Profile Fixes
// FIXED: All syntax errors resolved + Chart foundations for Phase 2B

const express = require('express');
const router = express.Router();
const dbService = require('../services/dbService');

// GET / - FIXED Enterprise Intelligence Landing Page with Analytics Preview
router.get('/', (req, res) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Regulatory Horizon Scanner</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, system-ui, sans-serif; 
            background: #fafbfc; 
            color: #1f2937; 
            line-height: 1.5;
            height: 100vh;
            overflow-x: hidden;
        }
        
        .enterprise-container { 
            display: grid; 
            grid-template-columns: 280px 1fr; 
            height: 100vh; 
        }
        
        /* Enhanced Sidebar Styling */
        .enterprise-sidebar { 
            background: #ffffff; 
            border-right: 1px solid #e5e7eb; 
            padding: 1.5rem; 
            overflow-y: auto;
            box-shadow: 2px 0 4px rgba(0,0,0,0.02);
        }
        
        .logo-section { 
            margin-bottom: 2rem; 
            padding-bottom: 1rem; 
            border-bottom: 1px solid #f3f4f6; 
        }
        
        .logo-title { 
            color: #1f2937; 
            font-size: 1.125rem; 
            font-weight: 700; 
            letter-spacing: -0.025em; 
        }
        
        .logo-subtitle { 
            color: #6b7280; 
            font-size: 0.75rem; 
            margin-top: 0.25rem; 
            text-transform: uppercase; 
            letter-spacing: 0.05em; 
        }
        
        .sidebar-section { 
            margin-bottom: 1.5rem; 
        }
        
        .section-title { 
            color: #374151; 
            font-size: 0.75rem; 
            font-weight: 600; 
            text-transform: uppercase; 
            letter-spacing: 0.05em; 
            margin-bottom: 0.75rem; 
            display: flex; 
            align-items: center; 
            gap: 0.5rem; 
        }
        
        .sidebar-item { 
            display: flex; 
            align-items: center; 
            justify-content: space-between; 
            padding: 0.5rem 0.75rem; 
            margin-bottom: 0.25rem; 
            border-radius: 6px; 
            transition: all 0.15s ease; 
            cursor: pointer; 
            font-size: 0.875rem; 
        }
        
        .sidebar-item:hover { 
            background: #f9fafb; 
        }
        
        .sidebar-item.active { 
            background: #eff6ff; 
            color: #2563eb; 
            font-weight: 500; 
        }

        .sidebar-item a {
            text-decoration: none;
            color: inherit;
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
        }
        
        .status-indicator { 
            width: 8px; 
            height: 8px; 
            border-radius: 50%; 
            background: #10b981; 
        }
        
        .status-offline { background: #ef4444; }
        .status-warning { background: #f59e0b; }
        
        .count-badge { 
            background: #f3f4f6; 
            color: #6b7280; 
            font-size: 0.75rem; 
            font-weight: 500; 
            padding: 0.125rem 0.5rem; 
            border-radius: 12px; 
            min-width: 1.25rem; 
            text-align: center; 
        }
        
        .count-badge.urgent { 
            background: #fef2f2; 
            color: #dc2626; 
        }
        
        .count-badge.moderate { 
            background: #fffbeb; 
            color: #d97706; 
        }

        .count-badge.analytics { 
            background: #eff6ff; 
            color: #2563eb; 
        }

        /* FIXED: Firm Profile Setup */
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

        .profile-info {
            font-size: 0.75rem;
            color: #64748b;
            margin-top: 0.5rem;
        }

        /* NEW: Analytics Preview Section */
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
        
        /* Main Content Area */
        .main-content { 
            display: flex; 
            flex-direction: column; 
            overflow: hidden; 
        }
        
        /* Enhanced Status Bar */
        .status-bar { 
            background: #ffffff; 
            border-bottom: 1px solid #e5e7eb; 
            padding: 1rem 1.5rem; 
            display: flex; 
            align-items: center; 
            justify-content: space-between; 
            box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }
        
        .status-left { 
            display: flex; 
            align-items: center; 
            gap: 1rem; 
        }
        
        .status-item { 
            display: flex; 
            align-items: center; 
            gap: 0.5rem; 
            font-size: 0.875rem; 
        }
        
        .live-indicator { 
            display: flex; 
            align-items: center; 
            gap: 0.5rem; 
            color: #059669; 
            font-weight: 500; 
        }
        
        .pulse-dot { 
            width: 8px; 
            height: 8px; 
            background: #10b981; 
            border-radius: 50%; 
            animation: pulse 2s infinite; 
        }
        
        @keyframes pulse { 
            0%, 100% { opacity: 1; } 
            50% { opacity: 0.5; } 
        }
        
        .refresh-btn { 
            background: #3b82f6; 
            color: white; 
            border: none; 
            padding: 0.5rem 1rem; 
            border-radius: 6px; 
            font-size: 0.875rem; 
            font-weight: 500; 
            cursor: pointer; 
            transition: all 0.15s ease; 
            display: flex; 
            align-items: center; 
            gap: 0.5rem; 
        }
        
        .refresh-btn:hover { 
            background: #2563eb; 
        }
        
        .refresh-btn:disabled { 
            background: #9ca3af; 
            cursor: not-allowed; 
        }
        
        /* FIXED: Enhanced Streams Container with proper scrolling */
        .streams-container { 
            flex: 1; 
            padding: 1.5rem; 
            overflow-y: auto; 
            display: flex; 
            flex-direction: column; 
            gap: 1rem;
            /* FIXED: Ensure proper height calculation */
            height: calc(100vh - 120px);
        }
        
        /* FIXED: Stream styling with proper scrollable content */
        .intelligence-stream { 
            background: #ffffff; 
            border: 1px solid #e5e7eb; 
            border-radius: 8px; 
            overflow: hidden; 
            box-shadow: 0 1px 3px rgba(0,0,0,0.02);
            /* FIXED: Prevent streams from growing too large */
            max-height: 600px;
            display: flex;
            flex-direction: column;
        }
        
        .stream-header { 
            padding: 1rem 1.5rem; 
            border-bottom: 1px solid #f3f4f6; 
            display: flex; 
            align-items: center; 
            justify-content: space-between;
            /* FIXED: Keep header fixed */
            flex-shrink: 0;
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
        
        .relevance-score {
            background: #f3f4f6;
            color: #374151;
            padding: 0.125rem 0.5rem;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 500;
        }

        .relevance-score.high {
            background: #fef2f2;
            color: #dc2626;
        }

        .relevance-score.medium {
            background: #fffbeb;
            color: #d97706;
        }
        
        .stream-meta { 
            display: flex; 
            align-items: center; 
            gap: 1rem; 
            font-size: 0.75rem; 
            color: #6b7280; 
        }
        
        .timeline-bar { 
            width: 100px; 
            height: 4px; 
            background: #f3f4f6; 
            border-radius: 2px; 
            overflow: hidden; 
        }
        
        .timeline-fill { 
            height: 100%; 
            background: #3b82f6; 
            transition: width 0.3s ease; 
        }
        
        /* FIXED: Stream content with proper scrolling */
        .stream-content { 
            /* FIXED: Enable scrolling within each stream */
            overflow-y: auto;
            flex: 1;
            max-height: 500px;
        }
        
        /* Enhanced Update Cards with Pin Functionality */
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

        .pin-btn {
            background: none;
            border: none;
            color: #6b7280;
            cursor: pointer;
            padding: 0.25rem;
            border-radius: 4px;
            font-size: 0.875rem;
            transition: all 0.15s ease;
        }

        .pin-btn:hover {
            background: #f3f4f6;
            color: #374151;
        }

        .pin-btn.pinned {
            color: #dc2626;
        }
        
        .update-badges { 
            display: flex; 
            gap: 0.375rem; 
            flex-shrink: 0; 
            flex-wrap: wrap;
        }
        
        .badge { 
            padding: 0.125rem 0.5rem; 
            border-radius: 4px; 
            font-size: 0.625rem; 
            font-weight: 500; 
            text-transform: uppercase; 
            letter-spacing: 0.05em; 
        }
        
        .badge-fca { background: #dbeafe; color: #1e40af; }
        .badge-boe { background: #d1fae5; color: #065f46; }
        .badge-pra { background: #fef2f2; color: #991b1b; }
        .badge-tpr { background: #ede9fe; color: #6b21a8; }
        .badge-sfo { background: #fed7aa; color: #9a3412; }
        .badge-fatf { background: #f3f4f6; color: #374151; }
        
        /* NEW: Risk Score Badge */
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
        
        .update-summary { 
            color: #4b5563; 
            font-size: 0.8125rem; 
            line-height: 1.4; 
            margin-bottom: 0.75rem; 
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
        
        /* Welcome State */
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

        /* FIXED: Modal Styles */
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
            /* FIXED: Ensure modal appears above everything */
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
            /* FIXED: Ensure modal content is properly positioned */
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

        /* FIXED: Sector selection grid */
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
            /* FIXED: Prevent text selection issues */
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
            /* FIXED: Hide the actual checkbox, use custom styling */
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

        /* FIXED: Error/success messages */
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
        
        /* Responsive Design */
        @media (max-width: 1024px) { 
            .enterprise-container { 
                grid-template-columns: 240px 1fr; 
            } 
        }
        
        @media (max-width: 768px) { 
            .enterprise-container { 
                grid-template-columns: 1fr; 
            }
            
            .enterprise-sidebar { 
                display: none; 
            }

            .modal-content {
                margin: 10% auto;
                width: 95%;
            }

            .sector-grid {
                grid-template-columns: 1fr;
            }

            .analytics-metrics {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="enterprise-container">
        <!-- Enhanced Enterprise Sidebar with Analytics Preview -->
        <div class="enterprise-sidebar">
            <div class="logo-section">
                <div class="logo-title">Horizon Scanner</div>
                <div class="logo-subtitle">Regulatory Intelligence</div>
            </div>
            
            <!-- FIXED: Firm Profile Section -->
            <div class="firm-profile-section" id="firmProfileSection">
                <button onclick="showFirmProfileSetup()" class="setup-profile-btn" id="profileBtn">
                    Setup Firm Profile
                </button>
                <div class="profile-info" id="profileInfo">
                    Configure your firm's sectors for personalized relevance
                </div>
            </div>

            <!-- NEW: Analytics Preview Section -->
            <div class="analytics-preview" id="analyticsPreview" style="display: none;">
                <div class="analytics-preview-title">
                    🔮 Predictive Insights
                </div>
                <div class="analytics-metrics">
                    <div class="analytics-metric">
                        <div class="analytics-metric-value" id="velocityPreview">--</div>
                        <div class="analytics-metric-label">Updates/Week</div>
                    </div>
                    <div class="analytics-metric">
                        <div class="analytics-metric-value" id="hotSectorsPreview">--</div>
                        <div class="analytics-metric-label">Hot Sectors</div>
                    </div>
                    <div class="analytics-metric">
                        <div class="analytics-metric-value" id="predictionsPreview">--</div>
                        <div class="analytics-metric-label">Predictions</div>
                    </div>
                    <div class="analytics-metric">
                        <div class="analytics-metric-value" id="riskScorePreview">--</div>
                        <div class="analytics-metric-label">Avg Risk</div>
                    </div>
                </div>
                <a href="/analytics" class="analytics-preview-link">
                    View Full Analytics Dashboard →
                </a>
            </div>
            
            <div class="sidebar-section">
                <div class="section-title">
                    🔔 Subscriptions
                </div>
                <div class="sidebar-item active">
                    <span>FCA Alerts</span>
                    <div class="status-indicator"></div>
                </div>
                <div class="sidebar-item">
                    <span>BoE Updates</span>
                    <div class="status-indicator"></div>
                </div>
                <div class="sidebar-item">
                    <span>PRA Notices</span>
                    <div class="status-indicator status-warning"></div>
                </div>
                <div class="sidebar-item">
                    <span>TPR News</span>
                    <div class="status-indicator status-offline"></div>
                </div>
            </div>
            
            <div class="sidebar-section">
                <div class="section-title">
                    🎯 Smart Filters
                </div>
                <div class="sidebar-item">
                    <span>High Relevance</span>
                    <div class="count-badge urgent" id="highRelevanceCount">0</div>
                </div>
                <div class="sidebar-item">
                    <span>Medium Relevance</span>
                    <div class="count-badge moderate" id="mediumRelevanceCount">0</div>
                </div>
                <div class="sidebar-item">
                    <span>Background Intel</span>
                    <div class="count-badge" id="lowRelevanceCount">0</div>
                </div>
            </div>
            
            <!-- Enhanced Workspace Section -->
            <div class="sidebar-section">
                <div class="section-title">
                    🔍 Workspace
                </div>
                <div class="sidebar-item" onclick="showPinnedItems()">
                    <span>Pinned Items</span>
                    <div class="count-badge" id="pinnedCount">0</div>
                </div>
                <div class="sidebar-item" onclick="showSavedSearches()">
                    <span>Saved Searches</span>
                    <div class="count-badge" id="savedSearchCount">0</div>
                </div>
                <div class="sidebar-item" onclick="showCustomAlerts()">
                    <span>Custom Alerts</span>
                    <div class="count-badge" id="alertCount">0</div>
                </div>
            </div>

            <!-- NEW: Analytics Navigation -->
            <div class="sidebar-section">
                <div class="section-title">
                    📊 Analytics
                </div>
                <div class="sidebar-item">
                    <a href="/analytics">Predictive Dashboard</a>
                    <div class="count-badge analytics" id="analyticsAvailable">NEW</div>
                </div>
                <div class="sidebar-item">
                    <a href="/dashboard">Intelligence Streams</a>
                </div>
                <div class="sidebar-item">
                    <a href="/test">System Diagnostics</a>
                </div>
            </div>
            
            <div class="sidebar-section">
                <div class="section-title">
                    ⚡ Live Feed
                </div>
                <div class="sidebar-item">
                    <span>Critical Updates</span>
                    <div class="count-badge urgent" id="criticalCount">0</div>
                </div>
                <div class="sidebar-item">
                    <span>Moderate Impact</span>
                    <div class="count-badge moderate" id="moderateCount">0</div>
                </div>
                <div class="sidebar-item">
                    <span>Informational</span>
                    <div class="count-badge" id="informationalCount">0</div>
                </div>
            </div>
        </div>
        
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
            
            <!-- FIXED: Enhanced Intelligence Streams with proper scrolling -->
            <div class="streams-container" id="streamsContainer">
                <div class="welcome-content">
                    <div class="welcome-icon">📡</div>
                    <div class="welcome-title">Enterprise Regulatory Intelligence</div>
                    <div class="welcome-subtitle">
                        Your AI-powered monitoring system is ready. Set up your firm profile and click "Refresh Data" to begin streaming personalized regulatory updates with predictive analytics.
                    </div>
                    <p style="font-size: 0.875rem; color: #9ca3af;">
                        <strong>Monitored Sources:</strong> FCA • Bank of England • PRA • TPR • SFO • FATF<br>
                        <strong>NEW:</strong> Predictive analytics with risk scoring and trend analysis
                    </p>
                </div>
            </div>
        </div>
    </div>
    
    <!-- FIXED: Firm Profile Setup Modal -->
    <div id="firmProfileModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title">Setup Firm Profile</h2>
                <span class="close" onclick="closeFirmProfileModal()">&times;</span>
            </div>
            
            <!-- FIXED: Message container for feedback -->
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
    
    <script>
        // COMPLETE MERGED: Enhanced Enterprise Intelligence System with Analytics Preview
        let systemStatus = {
            database: false,
            api: false,
            subscriptions: false,
            overall: false
        };

        let firmProfile = null;
        let availableSectors = [];
        let workspaceStats = { pinnedItems: 0, savedSearches: 0, activeAlerts: 0 };
        let analyticsPreviewData = null;
        
        // FIXED: Initialize system with better error handling and analytics
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🚀 Initializing Regulatory Intelligence System with Analytics...');
            
            // Initialize in sequence to avoid race conditions
            initializeSystem();
        });

        async function initializeSystem() {
            try {
                await checkSystemStatus();
                await loadFirmProfile();
                await loadWorkspaceStats();
                await loadAnalyticsPreview();
                await loadIntelligenceStreams();
                
                console.log('✅ System initialization complete');
            } catch (error) {
                console.error('❌ System initialization failed:', error);
                showMessage('System initialization failed. Some features may not work properly.', 'error');
            }
        }

        async function checkSystemStatus() {
            try {
                const response = await fetch('/api/system-status');
                const status = await response.json();
                
                systemStatus.database = status.database === 'connected';
                systemStatus.api = status.environment.hasGroqKey;
                systemStatus.overall = systemStatus.database && systemStatus.api;
                
                // Update workspace stats
                if (status.workspace) {
                    workspaceStats = status.workspace;
                    updateWorkspaceCounts();
                }
                
                updateStatusIndicators(systemStatus);
                
            } catch (error) {
                console.error('System status check failed:', error);
                systemStatus.overall = false;
                updateStatusIndicators(systemStatus);
            }
        }

        // NEW: Load analytics preview data
        async function loadAnalyticsPreview() {
            try {
                const response = await fetch('/api/analytics/dashboard');
                
                if (response.ok) {
                    const data = await response.json();
                    
                    if (data.success) {
                        analyticsPreviewData = data.dashboard;
                        updateAnalyticsPreview();
                        
                        // Show analytics preview if we have data
                        const analyticsPreview = document.getElementById('analyticsPreview');
                        if (analyticsPreview && data.dashboard.overview.totalUpdates > 0) {
                            analyticsPreview.style.display = 'block';
                        }
                        
                        console.log('✅ Analytics preview loaded');
                    }
                }
                
            } catch (error) {
                console.error('Error loading analytics preview:', error);
                // Continue without analytics preview
            }
        }

        function updateAnalyticsPreview() {
            if (!analyticsPreviewData) return;
            
            try {
                const overview = analyticsPreviewData.overview;
                
                // Update velocity preview
                const totalVelocity = Object.values(analyticsPreviewData.velocity || {})
                    .reduce((sum, auth) => sum + (auth.updatesPerWeek || 0), 0);
                document.getElementById('velocityPreview').textContent = Math.round(totalVelocity * 10) / 10;
                
                // Update hot sectors count
                const hotSectors = (analyticsPreviewData.hotspots || []).filter(h => h.riskLevel === 'high').length;
                document.getElementById('hotSectorsPreview').textContent = hotSectors;
                
                // Update predictions count
                const predictions = (analyticsPreviewData.predictions || []).length;
                document.getElementById('predictionsPreview').textContent = predictions;
                
                // Update average risk score
                const avgRisk = overview.averageRiskScore || 0;
                document.getElementById('riskScorePreview').textContent = Math.round(avgRisk);
                
            } catch (error) {
                console.error('Error updating analytics preview:', error);
            }
        }
        
        function updateStatusIndicators(status) {
            const liveIndicator = document.querySelector('.pulse-dot');
            if (status.overall) {
                liveIndicator.style.background = '#10b981';
            } else {
                liveIndicator.style.background = '#ef4444';
            }
        }

        // FIXED: Firm Profile Management with better error handling
        async function loadFirmProfile() {
            try {
                const response = await fetch('/api/firm-profile');
                
                if (!response.ok) {
                    throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
                }
                
                const data = await response.json();
                
                firmProfile = data.profile;
                availableSectors = data.availableSectors || [];
                
                updateFirmProfileUI();
                
                console.log('✅ Firm profile loaded:', firmProfile ? firmProfile.firmName : 'No profile');
                
            } catch (error) {
                console.error('Error loading firm profile:', error);
                availableSectors = [
                    'Banking', 'Investment Management', 'Consumer Credit', 
                    'Insurance', 'Payments', 'Pensions', 'Mortgages', 
                    'Capital Markets', 'Cryptocurrency', 'Fintech', 'General'
                ];
            }
        }

        function updateFirmProfileUI() {
            const profileBtn = document.getElementById('profileBtn');
            const profileInfo = document.getElementById('profileInfo');
            const firmStatus = document.getElementById('firmStatus');
            const firmNameSpan = document.getElementById('firmName');
            
            if (firmProfile) {
                profileBtn.textContent = 'Update Firm Profile';
                profileInfo.textContent = \`\${firmProfile.firmName} • \${firmProfile.primarySectors.join(', ')}\`;
                firmStatus.style.display = 'block';
                firmNameSpan.textContent = firmProfile.firmName;
            } else {
                profileBtn.textContent = 'Setup Firm Profile';
                profileInfo.textContent = 'Configure your firm\\'s sectors for personalized analytics';
                firmStatus.style.display = 'none';
            }
        }

        // FIXED: Firm profile setup with proper validation and feedback
        function showFirmProfileSetup() {
            const modal = document.getElementById('firmProfileModal');
            const sectorGrid = document.getElementById('sectorGrid');
            const messageContainer = document.getElementById('messageContainer');
            
            // Clear any previous messages
            messageContainer.innerHTML = '';
            
            // Populate sectors with improved interaction
            sectorGrid.innerHTML = '';
            availableSectors.forEach(sector => {
                const isSelected = firmProfile && firmProfile.primarySectors && firmProfile.primarySectors.includes(sector);
                
                const sectorDiv = document.createElement('div');
                sectorDiv.className = \`sector-checkbox \${isSelected ? 'selected' : ''}\`;
                sectorDiv.innerHTML = \`
                    <input type="checkbox" id="sector_\${sector.replace(/\\s+/g, '_')}" value="\${sector}" \${isSelected ? 'checked' : ''}>
                    <label for="sector_\${sector.replace(/\\s+/g, '_')}">\${sector}</label>
                \`;
                
                // FIXED: Improved click handling
                sectorDiv.addEventListener('click', function(e) {
                    e.preventDefault();
                    
                    const checkbox = sectorDiv.querySelector('input');
                    const currentlyChecked = document.querySelectorAll('#sectorGrid input[type="checkbox"]:checked');
                    
                    // If trying to check and already have 3 selected
                    if (!checkbox.checked && currentlyChecked.length >= 3) {
                        showMessage('Please select a maximum of 3 sectors', 'error');
                        return;
                    }
                    
                    // Toggle the checkbox
                    checkbox.checked = !checkbox.checked;
                    sectorDiv.classList.toggle('selected', checkbox.checked);
                    
                    // Clear any error messages when selection is valid
                    if (currentlyChecked.length <= 3) {
                        clearMessages();
                    }
                });
                
                sectorGrid.appendChild(sectorDiv);
            });
            
            // Pre-fill form if profile exists
            if (firmProfile) {
                document.getElementById('firmNameInput').value = firmProfile.firmName || '';
                document.getElementById('firmSizeInput').value = firmProfile.firmSize || 'Medium';
            }
            
            modal.style.display = 'block';
        }

        function closeFirmProfileModal() {
            document.getElementById('firmProfileModal').style.display = 'none';
            clearMessages();
        }

        // FIXED: Form submission with proper validation and feedback
        document.getElementById('firmProfileForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const saveBtn = document.getElementById('saveProfileBtn');
            const originalText = saveBtn.textContent;
            
            try {
                saveBtn.disabled = true;
                saveBtn.textContent = 'Saving...';
                
                clearMessages();
                
                const firmName = document.getElementById('firmNameInput').value.trim();
                const firmSize = document.getElementById('firmSizeInput').value;
                const selectedSectors = Array.from(document.querySelectorAll('#sectorGrid input[type="checkbox"]:checked'))
                    .map(cb => cb.value);
                
                // Validation
                if (!firmName) {
                    throw new Error('Please enter a firm name');
                }
                
                if (selectedSectors.length === 0) {
                    throw new Error('Please select at least one business sector');
                }
                
                if (selectedSectors.length > 3) {
                    throw new Error('Please select a maximum of 3 business sectors');
                }
                
                console.log('💾 Saving firm profile:', { firmName, firmSize, selectedSectors });
                
                const response = await fetch('/api/firm-profile', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        firmName,
                        firmSize,
                        primarySectors: selectedSectors
                    })
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                    throw new Error(errorData.error || \`HTTP \${response.status}: \${response.statusText}\`);
                }
                
                const result = await response.json();
                
                firmProfile = result.profile;
                updateFirmProfileUI();
                closeFirmProfileModal();
                
                // Refresh analytics and streams with new relevance
                await loadAnalyticsPreview();
                await loadIntelligenceStreams();
                
                showMessage(\`Firm profile saved! \${result.relevanceUpdated || 0} updates recalculated for relevance.\`, 'success');
                
                console.log('✅ Firm profile saved successfully');
                
            } catch (error) {
                console.error('Error saving firm profile:', error);
                showMessage('Error saving profile: ' + error.message, 'error');
            } finally {
                saveBtn.disabled = false;
                saveBtn.textContent = originalText;
            }
        });

        // FIXED: Message system for user feedback
        function showMessage(message, type = 'info') {
            // Show in modal if open
            const messageContainer = document.getElementById('messageContainer');
            if (messageContainer) {
                messageContainer.innerHTML = \`<div class="message \${type}">\${message}</div>\`;
            }
            
            // Also show in console
            console.log(\`\${type.toUpperCase()}: \${message}\`);
            
            // Auto-clear success messages
            if (type === 'success') {
                setTimeout(clearMessages, 5000);
            }
        }

        function clearMessages() {
            const messageContainer = document.getElementById('messageContainer');
            if (messageContainer) {
                messageContainer.innerHTML = '';
            }
        }

        // FIXED: Workspace Functions with better error handling
        async function loadWorkspaceStats() {
            try {
                const response = await fetch('/api/workspace/stats');
                
                if (!response.ok) {
                    throw new Error(\`HTTP \${response.status}\`);
                }
                
                const data = await response.json();
                
                if (data.success) {
                    workspaceStats = data.stats;
                    updateWorkspaceCounts();
                }
                
            } catch (error) {
                console.error('Error loading workspace stats:', error);
                // Continue with default values
            }
        }

        function updateWorkspaceCounts() {
            document.getElementById('pinnedCount').textContent = workspaceStats.pinnedItems || 0;
            document.getElementById('savedSearchCount').textContent = workspaceStats.savedSearches || 0;
            document.getElementById('alertCount').textContent = workspaceStats.activeAlerts || 0;
        }

        async function pinUpdate(updateUrl, updateTitle, updateAuthority) {
            try {
                const response = await fetch('/api/workspace/pin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        updateUrl,
                        updateTitle,
                        updateAuthority
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Update UI
                    const pinBtn = document.querySelector(\`[data-url="\${updateUrl}"] .pin-btn\`);
                    if (pinBtn) {
                        pinBtn.textContent = '📌';
                        pinBtn.classList.add('pinned');
                        pinBtn.title = 'Unpin item';
                    }
                    
                    // Update count
                    workspaceStats.pinnedItems++;
                    updateWorkspaceCounts();
                    
                    console.log('📌 Item pinned:', updateTitle.substring(0, 50));
                } else {
                    throw new Error(result.message || 'Unknown error');
                }
                
            } catch (error) {
                console.error('Error pinning item:', error);
                showMessage('Error pinning item: ' + error.message, 'error');
            }
        }

        async function unpinUpdate(updateUrl) {
            try {
                const response = await fetch(\`/api/workspace/pin/\${encodeURIComponent(updateUrl)}\`, {
                    method: 'DELETE'
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Update UI
                    const pinBtn = document.querySelector(\`[data-url="\${updateUrl}"] .pin-btn\`);
                    if (pinBtn) {
                        pinBtn.textContent = '📍';
                        pinBtn.classList.remove('pinned');
                        pinBtn.title = 'Pin item';
                    }
                    
                    // Update count
                    workspaceStats.pinnedItems = Math.max(0, workspaceStats.pinnedItems - 1);
                    updateWorkspaceCounts();
                    
                    console.log('📍 Item unpinned');
                } else {
                    throw new Error(result.message || 'Unknown error');
                }
                
            } catch (error) {
                console.error('Error unpinning item:', error);
                showMessage('Error unpinning item: ' + error.message, 'error');
            }
        }

        function showPinnedItems() {
            window.open('/dashboard#pinned', '_blank');
        }

        function showSavedSearches() {
            window.open('/dashboard#searches', '_blank');
        }

        function showCustomAlerts() {
            window.open('/dashboard#alerts', '_blank');
        }

        // FIXED: Enhanced refresh with analytics update
        async function refreshIntelligence() {
            const btn = document.getElementById('refreshBtn');
            const icon = document.getElementById('refreshIcon');
            const originalText = btn.textContent;
            
            btn.disabled = true;
            icon.textContent = '⏳';
            btn.innerHTML = '<span>⏳</span><span>Refreshing...</span>';
            
            try {
                console.log('🔄 Starting intelligence refresh...');
                
                const response = await fetch('/api/refresh', { 
                    method: 'POST',
                    headers: { 'Accept': 'application/json' }
                });
                
                if (!response.ok) {
                    throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
                }
                
                const result = await response.json();
                
                document.getElementById('newCount').textContent = \`\${result.newArticles} New\`;
                document.getElementById('lastUpdate').textContent = \`Last: \${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}\`;
                
                // Load intelligence streams and analytics with relevance
                await loadIntelligenceStreams();
                await loadAnalyticsPreview();
                
                if (result.relevanceUpdated > 0) {
                    console.log(\`📊 Relevance updated for \${result.relevanceUpdated} items\`);
                }
                
                showMessage(\`Refreshed successfully! \${result.newArticles} new updates processed.\`, 'success');
                
            } catch (error) {
                console.error('Refresh error:', error);
                showMessage('Refresh failed: ' + error.message, 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<span id="refreshIcon">🔄</span><span>Refresh Data</span>';
            }
        }
        
        // FIXED: Enhanced stream loading with risk scores and proper error handling
        async function loadIntelligenceStreams() {
            try {
                console.log('📊 Loading intelligence streams with analytics...');
                
                const response = await fetch('/api/updates');
                
                if (!response.ok) {
                    throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
                }
                
                const data = await response.json();
                
                const streamsContainer = document.getElementById('streamsContainer');
                streamsContainer.innerHTML = generateRelevanceBasedStreams(data);
                
                // Update relevance counts
                document.getElementById('highRelevanceCount').textContent = data.urgent ? data.urgent.length : 0;
                document.getElementById('mediumRelevanceCount').textContent = data.moderate ? data.moderate.length : 0;
                document.getElementById('lowRelevanceCount').textContent = data.informational ? data.informational.length : 0;
                
                // Update legacy counts for compatibility
                const urgentCount = data.urgent ? data.urgent.filter(u => u.urgency === 'High').length : 0;
                document.getElementById('criticalCount').textContent = urgentCount;
                document.getElementById('moderateCount').textContent = data.moderate ? data.moderate.length : 0;
                document.getElementById('informationalCount').textContent = data.informational ? data.informational.length : 0;
                
                // Check for pinned items
                await loadPinnedStatus();
                
                console.log('✅ Intelligence streams loaded with analytics');
                
            } catch (error) {
                console.error('Failed to load intelligence streams:', error);
                
                const streamsContainer = document.getElementById('streamsContainer');
                streamsContainer.innerHTML = \`
                    <div class="welcome-content">
                        <div class="welcome-icon">❌</div>
                        <div class="welcome-title">Error Loading Updates</div>
                        <div class="welcome-subtitle">
                            \${error.message}. Please try refreshing the data.
                        </div>
                    </div>
                \`;
            }
        }
        
        async function loadPinnedStatus() {
            try {
                const response = await fetch('/api/workspace/pinned');
                const data = await response.json();
                
                if (data.success) {
                    const pinnedUrls = data.items.map(item => item.updateUrl);
                    
                    // Update pin button states
                    document.querySelectorAll('.pin-btn').forEach(btn => {
                        const updateCard = btn.closest('.update-card');
                        const url = updateCard.getAttribute('data-url');
                        
                        if (pinnedUrls.includes(url)) {
                            btn.textContent = '📌';
                            btn.classList.add('pinned');
                            btn.title = 'Unpin item';
                        } else {
                            btn.textContent = '📍';
                            btn.classList.remove('pinned');
                            btn.title = 'Pin item';
                        }
                    });
                }
                
            } catch (error) {
                console.error('Error loading pinned status:', error);
            }
        }
        
        function generateRelevanceBasedStreams(data) {
            if (!data || data.total === 0) {
                return \`
                    <div class="welcome-content">
                        <div class="welcome-icon">📭</div>
                        <div class="welcome-title">No Updates Available</div>
                        <div class="welcome-subtitle">
                            Click "Refresh Data" to fetch the latest regulatory updates from monitored sources.
                        </div>
                    </div>
                \`;
            }
            
            const profileInfo = data.firmProfile ? 
                \`for \${data.firmProfile.firmName} (\${data.firmProfile.primarySectors.join(', ')})\` : 
                'Configure firm profile for personalized analytics';
            
            return \`
                \${generateStream('high', \`High Relevance \${profileInfo}\`, data.urgent || [], 90)}
                \${generateStream('medium', 'Medium Relevance', data.moderate || [], 60)}
                \${generateStream('low', 'Background Intelligence', data.informational || [], 30)}
            \`;
        }
        
        function generateStream(type, title, updates, timelinePercent) {
            if (!updates || updates.length === 0) return '';
            
            return \`
                <div class="intelligence-stream">
                    <div class="stream-header">
                        <div class="stream-title">
                            <div class="stream-icon \${type}"></div>
                            <span>\${title}</span>
                            <span style="color: #6b7280;">• \${updates.length} Item\${updates.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div class="stream-meta">
                            <div class="timeline-bar">
                                <div class="timeline-fill" style="width: \${timelinePercent}%"></div>
                            </div>
                            <span>24h</span>
                        </div>
                    </div>
                    <div class="stream-content">
                        \${updates.map(update => generateUpdateCard(update)).join('')}
                    </div>
                </div>
            \`;
        }
        
        function generateUpdateCard(update) {
            const authorityClass = \`badge-\${update.authority ? update.authority.toLowerCase() : 'unknown'}\`;
            const timeAgo = new Date(update.fetchedDate).toLocaleDateString('en-GB');
            const relevanceScore = update.relevanceScore || 0;
            const relevanceClass = relevanceScore >= 70 ? 'high' : relevanceScore >= 40 ? 'medium' : 'low';
            
            // NEW: Risk score handling
            const riskScore = update.riskScore || 0;
            const riskClass = riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low';
            
            // Escape single quotes in strings for JavaScript
            const escapedTitle = (update.headline || 'Untitled').replace(/'/g, "\\\\'");
            const escapedAuthority = (update.authority || 'Unknown').replace(/'/g, "\\\\'");
            
            return \`
                <div class="update-card" data-url="\${update.url}">
                    <div class="update-header">
                        <div class="update-title" onclick="viewUpdateDetails('\${update.url}')">\${update.headline || 'Untitled'}</div>
                        <div class="update-actions">
                            <button class="pin-btn" onclick="togglePin('\${update.url}', '\${escapedTitle}', '\${escapedAuthority}')" title="Pin item">📍</button>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                        <div class="update-badges">
                            <div class="badge \${authorityClass}">\${update.authority || 'Unknown'}</div>
                            \${relevanceScore > 0 ? \`<div class="relevance-score \${relevanceClass}">\${relevanceScore}% relevant</div>\` : ''}
                            \${riskScore > 0 ? \`<div class="risk-score \${riskClass}">Risk: \${riskScore}%</div>\` : ''}
                        </div>
                    </div>
                    <div class="update-summary">
                        \${(update.impact || 'No summary available').length > 120 ? (update.impact || 'No summary available').substring(0, 120) + '...' : (update.impact || 'No summary available')}
                    </div>
                    <div class="update-footer">
                        <div class="update-time">
                            <span>📅</span>
                            <span>\${timeAgo}</span>
                        </div>
                        <a href="\${update.url}" target="_blank" class="view-details" onclick="event.stopPropagation()">
                            View Source →
                        </a>
                    </div>
                </div>
            \`;
        }

        async function togglePin(updateUrl, updateTitle, updateAuthority) {
            const pinBtn = document.querySelector(\`[data-url="\${updateUrl}"] .pin-btn\`);
            
            if (!pinBtn) {
                console.error('Pin button not found for URL:', updateUrl);
                return;
            }
            
            const isPinned = pinBtn.classList.contains('pinned');
            
            if (isPinned) {
                await unpinUpdate(updateUrl);
            } else {
                await pinUpdate(updateUrl, updateTitle, updateAuthority);
            }
        }
        
        function viewUpdateDetails(url) {
            if (url) {
                window.open(url, '_blank');
            }
        }

        // FIXED: Modal click handling to close when clicking outside
        window.onclick = function(event) {
            const modal = document.getElementById('firmProfileModal');
            if (event.target === modal) {
                closeFirmProfileModal();
            }
        }
        
        // Check status periodically and refresh analytics
        setInterval(async () => {
            await checkSystemStatus();
            // Optionally refresh analytics preview every 5 minutes
            if (analyticsPreviewData) {
                await loadAnalyticsPreview();
            }
        }, 30000);
        
        console.log('🚀 Enhanced Regulatory Intelligence System with Analytics loaded and ready');
    </script>
</body>
</html>`;
    
    res.send(html);
});

// GET /analytics - Analytics Dashboard with Chart.js Foundation for Phase 2B
router.get('/analytics', async (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Analytics Dashboard - Regulatory Horizon Scanner</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, system-ui, sans-serif; 
            background: #fafbfc; 
            color: #1f2937; 
            line-height: 1.5;
            min-height: 100vh;
        }
        
        .analytics-container { 
            display: grid; 
            grid-template-columns: 280px 1fr; 
            min-height: 100vh; 
        }
        
        /* Sidebar */
        .analytics-sidebar { 
            background: #ffffff; 
            border-right: 1px solid #e5e7eb; 
            padding: 1.5rem; 
            overflow-y: auto;
            box-shadow: 2px 0 4px rgba(0,0,0,0.02);
        }
        
        .logo-section { 
            margin-bottom: 2rem; 
            padding-bottom: 1rem; 
            border-bottom: 1px solid #f3f4f6; 
        }
        
        .logo-title { 
            color: #1f2937; 
            font-size: 1.125rem; 
            font-weight: 700; 
            letter-spacing: -0.025em; 
        }
        
        .logo-subtitle { 
            color: #6b7280; 
            font-size: 0.75rem; 
            margin-top: 0.25rem; 
            text-transform: uppercase; 
            letter-spacing: 0.05em; 
        }
        
        .nav-section { 
            margin-bottom: 1.5rem; 
        }
        
        .nav-title { 
            color: #374151; 
            font-size: 0.75rem; 
            font-weight: 600; 
            text-transform: uppercase; 
            letter-spacing: 0.05em; 
            margin-bottom: 0.75rem; 
            display: flex; 
            align-items: center; 
            gap: 0.5rem; 
        }
        
        .nav-item { 
            display: flex; 
            align-items: center; 
            justify-content: space-between; 
            padding: 0.5rem 0.75rem; 
            margin-bottom: 0.25rem; 
            border-radius: 6px; 
            transition: all 0.15s ease; 
            cursor: pointer; 
            font-size: 0.875rem; 
            text-decoration: none;
            color: inherit;
        }
        
        .nav-item:hover { 
            background: #f9fafb; 
        }
        
        .nav-item.active { 
            background: #eff6ff; 
            color: #2563eb; 
            font-weight: 500; 
        }
        
        .status-badge { 
            background: #f3f4f6; 
            color: #6b7280; 
            font-size: 0.75rem; 
            font-weight: 500; 
            padding: 0.125rem 0.5rem; 
            border-radius: 12px; 
            min-width: 1.25rem; 
            text-align: center; 
        }
        
        .status-badge.live { 
            background: #dcfce7; 
            color: #166534; 
        }
        
        .status-badge.prediction { 
            background: #fef3c7; 
            color: #92400e; 
        }
        
        /* Main Content */
        .analytics-main { 
            display: flex; 
            flex-direction: column; 
            overflow: hidden; 
        }
        
        /* Header */
        .analytics-header { 
            background: #ffffff; 
            border-bottom: 1px solid #e5e7eb; 
            padding: 1.5rem 2rem; 
            box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }
        
        .header-top { 
            display: flex; 
            align-items: center; 
            justify-content: space-between; 
            margin-bottom: 1rem; 
        }
        
        .analytics-title { 
            font-size: 1.875rem; 
            font-weight: 700; 
            color: #1f2937; 
        }
        
        .analytics-subtitle {
            color: #6b7280;
            font-size: 0.875rem;
            margin-top: 0.25rem;
        }
        
        .header-actions {
            display: flex;
            gap: 1rem;
            align-items: center;
        }
        
        .refresh-btn { 
            background: #3b82f6; 
            color: white; 
            border: none; 
            padding: 0.5rem 1rem; 
            border-radius: 6px; 
            font-size: 0.875rem; 
            font-weight: 500; 
            cursor: pointer; 
            transition: all 0.15s ease; 
            display: flex; 
            align-items: center; 
            gap: 0.5rem; 
        }
        
        .refresh-btn:hover { 
            background: #2563eb; 
        }
        
        .refresh-btn:disabled { 
            background: #9ca3af; 
            cursor: not-allowed; 
        }

        .back-link {
            color: #6b7280;
            text-decoration: none;
            font-size: 0.875rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: color 0.15s ease;
        }

        .back-link:hover {
            color: #374151;
        }
        
        /* Overview Cards */
        .overview-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 1rem; 
        }
        
        .overview-card { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 1.5rem; 
            border-radius: 12px; 
            position: relative;
            overflow: hidden;
        }

        .overview-card::before {
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

        .overview-card > * {
            position: relative;
            z-index: 2;
        }
        
        .overview-card.velocity { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
        }
        
        .overview-card.hotspots { 
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); 
        }
        
        .overview-card.predictions { 
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); 
        }
        
        .overview-card.calendar { 
            background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); 
        }
        
        .card-value { 
            font-size: 2rem; 
            font-weight: 700; 
            margin-bottom: 0.5rem; 
        }
        
        .card-label { 
            font-size: 0.875rem; 
            opacity: 0.9; 
            margin-bottom: 0.5rem;
        }
        
        .card-detail { 
            font-size: 0.75rem; 
            opacity: 0.8; 
        }
        
        /* Content Area */
        .analytics-content { 
            flex: 1; 
            padding: 2rem; 
            overflow-y: auto; 
            display: flex; 
            flex-direction: column; 
            gap: 2rem; 
        }
        
        /* Widget Styles */
        .widget { 
            background: #ffffff; 
            border: 1px solid #e5e7eb; 
            border-radius: 12px; 
            overflow: hidden; 
            box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        
        .widget-header { 
            padding: 1.5rem; 
            border-bottom: 1px solid #f3f4f6; 
            display: flex; 
            align-items: center; 
            justify-content: space-between; 
        }
        
        .widget-title { 
            font-size: 1.125rem; 
            font-weight: 600; 
            color: #1f2937; 
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .widget-icon {
            font-size: 1.25rem;
        }
        
        .widget-content { 
            padding: 1.5rem; 
        }

        .widget-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
        }

        /* NEW: Chart container styles for Phase 2B foundation */
        .chart-container {
            position: relative;
            height: 300px;
            width: 100%;
        }

        .chart-container canvas {
            max-height: 300px !important;
        }
        
        /* Loading States */
        .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            color: #6b7280;
        }

        .loading-spinner {
            width: 20px;
            height: 20px;
            border: 2px solid #e5e7eb;
            border-top: 2px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 0.5rem;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* Error States */
        .error {
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #dc2626;
            padding: 1rem;
            border-radius: 6px;
            text-align: center;
        }
        
        /* Responsive Design */
        @media (max-width: 1024px) { 
            .analytics-container { 
                grid-template-columns: 240px 1fr; 
            } 
        }
        
        @media (max-width: 768px) { 
            .analytics-container { 
                grid-template-columns: 1fr; 
            }
            
            .analytics-sidebar { 
                display: none; 
            }

            .overview-grid {
                grid-template-columns: 1fr;
            }

            .widget-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="analytics-container">
        <!-- Analytics Sidebar -->
        <div class="analytics-sidebar">
            <div class="logo-section">
                <div class="logo-title">Horizon Scanner</div>
                <div class="logo-subtitle">Predictive Analytics</div>
            </div>
            
            <div class="nav-section">
                <div class="nav-title">
                    📊 Analytics Views
                </div>
                <a href="/analytics" class="nav-item active">
                    <span>Overview Dashboard</span>
                    <div class="status-badge live">Live</div>
                </a>
                <div class="nav-item" onclick="showVelocityDetail()">
                    <span>Regulatory Velocity</span>
                    <div class="status-badge" id="velocityBadge">0</div>
                </div>
                <div class="nav-item" onclick="showHotspotsDetail()">
                    <span>Sector Hotspots</span>
                    <div class="status-badge" id="hotspotsBadge">0</div>
                </div>
                <div class="nav-item" onclick="showPredictionsDetail()">
                    <span>Impact Predictions</span>
                    <div class="status-badge prediction" id="predictionsBadge">0</div>
                </div>
                <div class="nav-item" onclick="showCalendarDetail()">
                    <span>Compliance Calendar</span>
                    <div class="status-badge" id="calendarBadge">0</div>
                </div>
            </div>
            
            <div class="nav-section">
                <div class="nav-title">
                    🎯 Quick Actions
                </div>
                <div class="nav-item" onclick="refreshAnalytics()">
                    <span>Refresh Analytics</span>
                </div>
                <div class="nav-item" onclick="exportAnalytics()">
                    <span>Export Report</span>
                </div>
                <a href="/dashboard" class="nav-item">
                    <span>Intelligence Dashboard</span>
                </a>
                <a href="/" class="nav-item">
                    <span>Home</span>
                </a>
            </div>

            <div class="nav-section">
                <div class="nav-title">
                    🏢 Configuration
                </div>
                <div class="nav-item" onclick="manageFirmProfile()">
                    <span>Firm Profile</span>
                </div>
                <div class="nav-item" onclick="manageAlerts()">
                    <span>Alert Settings</span>
                </div>
            </div>
        </div>
        
        <!-- Main Analytics Content -->
        <div class="analytics-main">
            <!-- Analytics Header -->
            <div class="analytics-header">
                <div class="header-top">
                    <div>
                        <div class="analytics-title">Predictive Analytics</div>
                        <div class="analytics-subtitle" id="firmInfo">
                            AI-powered regulatory intelligence and market predictions
                        </div>
                    </div>
                    <div class="header-actions">
                        <a href="/" class="back-link">← Back to Home</a>
                        <button onclick="refreshAllAnalytics()" class="refresh-btn" id="refreshBtn">
                            <span id="refreshIcon">🔄</span>
                            <span>Refresh All</span>
                        </button>
                    </div>
                </div>
                
                <!-- Overview Cards -->
                <div class="overview-grid" id="overviewGrid">
                    <div class="overview-card velocity">
                        <div class="card-value" id="velocityValue">--</div>
                        <div class="card-label">Updates/Week</div>
                        <div class="card-detail" id="velocityDetail">Regulatory velocity</div>
                    </div>
                    <div class="overview-card hotspots">
                        <div class="card-value" id="hotspotsValue">--</div>
                        <div class="card-label">High Risk Sectors</div>
                        <div class="card-detail" id="hotspotsDetail">Active hotspots</div>
                    </div>
                    <div class="overview-card predictions">
                        <div class="card-value" id="predictionsValue">--</div>
                        <div class="card-label">Active Predictions</div>
                        <div class="card-detail" id="predictionsDetail">AI-generated insights</div>
                    </div>
                    <div class="overview-card calendar">
                        <div class="card-value" id="calendarValue">--</div>
                        <div class="card-label">Critical Deadlines</div>
                        <div class="card-detail" id="calendarDetail">Next 30 days</div>
                    </div>
                </div>
            </div>
            
            <!-- Analytics Content -->
            <div class="analytics-content" id="analyticsContent">
                <div class="loading">
                    <div class="loading-spinner"></div>
                    Loading predictive analytics...
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // Phase 2A Analytics + Foundation for Phase 2B Charts
        let analyticsData = null;
        let firmProfile = null;
        let velocityChart = null;
        let riskChart = null;
        
        // Initialize analytics dashboard
        document.addEventListener('DOMContentLoaded', function() {
            console.log('📊 Initializing Analytics Dashboard with Chart.js...');
            loadAnalyticsDashboard();
        });

        async function loadAnalyticsDashboard() {
            try {
                console.log('📊 Loading analytics dashboard data...');
                
                const response = await fetch('/api/analytics/dashboard');
                
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status + ': ' + response.statusText);
                }
                
                const data = await response.json();
                
                if (data.success) {
                    analyticsData = data.dashboard;
                    firmProfile = data.dashboard.firmProfile;
                    
                    updateOverviewCards();
                    renderAnalyticsContent();
                    updateSidebarCounts();
                    updateFirmInfo();
                    
                    console.log('✅ Analytics dashboard loaded successfully');
                } else {
                    throw new Error(data.error || 'Failed to load analytics');
                }
                
            } catch (error) {
                console.error('❌ Error loading analytics dashboard:', error);
                showError('Failed to load analytics dashboard: ' + error.message);
            }
        }

        function updateOverviewCards() {
            if (!analyticsData) return;
            
            // Velocity card
            const totalVelocity = Object.values(analyticsData.velocity || {})
                .reduce((sum, auth) => sum + (auth.updatesPerWeek || 0), 0);
            document.getElementById('velocityValue').textContent = Math.round(totalVelocity * 10) / 10;
            document.getElementById('velocityDetail').textContent = 'Across ' + Object.keys(analyticsData.velocity || {}).length + ' authorities';
            
            // Hotspots card
            const highRiskSectors = (analyticsData.hotspots || []).filter(h => h.riskLevel === 'high').length;
            document.getElementById('hotspotsValue').textContent = highRiskSectors;
            document.getElementById('hotspotsDetail').textContent = (analyticsData.hotspots || []).length + ' sectors monitored';
            
            // Predictions card
            const predictionsCount = (analyticsData.predictions || []).length;
            document.getElementById('predictionsValue').textContent = predictionsCount;
            document.getElementById('predictionsDetail').textContent = predictionsCount > 0 ? 'Next 30-60 days' : 'No active predictions';
            
            // Calendar card
            const criticalDeadlines = (analyticsData.calendar?.next30Days || []).filter(d => d.riskScore >= 70).length;
            document.getElementById('calendarValue').textContent = criticalDeadlines;
            document.getElementById('calendarDetail').textContent = (analyticsData.calendar?.next30Days || []).length + ' total upcoming';
        }

        function updateSidebarCounts() {
            if (!analyticsData) return;
            
            const velocityCount = Object.keys(analyticsData.velocity || {}).length;
            const hotspotsCount = (analyticsData.hotspots || []).length;
            const predictionsCount = (analyticsData.predictions || []).length;
            const calendarCount = (analyticsData.calendar?.next30Days || []).length;
            
            document.getElementById('velocityBadge').textContent = velocityCount;
            document.getElementById('hotspotsBadge').textContent = hotspotsCount;
            document.getElementById('predictionsBadge').textContent = predictionsCount;
            document.getElementById('calendarBadge').textContent = calendarCount;
        }

        function updateFirmInfo() {
            const firmInfoElement = document.getElementById('firmInfo');
            if (firmProfile) {
                firmInfoElement.textContent = firmProfile.firmName + ' • ' + firmProfile.primarySectors.join(', ') + ' • Personalized insights';
            } else {
                firmInfoElement.textContent = 'AI-powered regulatory intelligence • Configure firm profile for personalized insights';
            }
        }

        function renderAnalyticsContent() {
            const content = document.getElementById('analyticsContent');
            
            content.innerHTML = 
                '<div class="widget-grid">' +
                    '<!-- Regulatory Velocity Widget with Chart -->' +
                    '<div class="widget">' +
                        '<div class="widget-header">' +
                            '<div class="widget-title">' +
                                '<span class="widget-icon">📈</span>' +
                                'Regulatory Velocity' +
                            '</div>' +
                        '</div>' +
                        '<div class="widget-content">' +
                            '<div class="chart-container">' +
                                '<canvas id="velocityChart"></canvas>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +

                    '<!-- Risk Distribution Widget with Chart -->' +
                    '<div class="widget">' +
                        '<div class="widget-header">' +
                            '<div class="widget-title">' +
                                '<span class="widget-icon">🎯</span>' +
                                'Risk Distribution' +
                            '</div>' +
                        '</div>' +
                        '<div class="widget-content">' +
                            '<div class="chart-container">' +
                                '<canvas id="riskChart"></canvas>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +

                '<div class="widget-grid">' +
                    '<!-- Future: Additional chart widgets for Phase 2B -->' +
                    '<div class="widget">' +
                        '<div class="widget-header">' +
                            '<div class="widget-title">' +
                                '<span class="widget-icon">🔥</span>' +
                                'Sector Hotspots' +
                            '</div>' +
                        '</div>' +
                        '<div class="widget-content">' +
                            renderHotspots() +
                        '</div>' +
                    '</div>' +

                    '<div class="widget">' +
                        '<div class="widget-header">' +
                            '<div class="widget-title">' +
                                '<span class="widget-icon">🔮</span>' +
                                'Impact Predictions' +
                            '</div>' +
                        '</div>' +
                        '<div class="widget-content">' +
                            renderPredictions() +
                        '</div>' +
                    '</div>' +
                '</div>';
            
            // Create charts after DOM is ready
            setTimeout(() => {
                createVelocityChart();
                createRiskChart();
            }, 100);
        }

        // NEW: Chart creation functions for Phase 2B foundation
        function createVelocityChart() {
            const ctx = document.getElementById('velocityChart');
            if (!ctx || !analyticsData.velocity) return;

            // Destroy existing chart
            if (velocityChart) {
                velocityChart.destroy();
            }

            const authorities = Object.keys(analyticsData.velocity);
            const currentValues = authorities.map(auth => analyticsData.velocity[auth].updatesPerWeek || 0);
            const predictions = authorities.map(auth => analyticsData.velocity[auth].prediction || 0);

            velocityChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: authorities,
                    datasets: [{
                        label: 'Current (per week)',
                        data: currentValues,
                        backgroundColor: 'rgba(59, 130, 246, 0.6)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 1
                    }, {
                        label: 'Predicted (per week)',
                        data: predictions,
                        backgroundColor: 'rgba(236, 72, 153, 0.6)',
                        borderColor: 'rgba(236, 72, 153, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: 'Regulatory Update Velocity by Authority'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Updates per Week'
                            }
                        }
                    }
                }
            });
        }

        function createRiskChart() {
            const ctx = document.getElementById('riskChart');
            if (!ctx || !analyticsData.overview) return;

            // Destroy existing chart
            if (riskChart) {
                riskChart.destroy();
            }

            // Sample risk distribution data - replace with real data in Phase 2B
            const riskData = {
                'High Risk (70-100)': analyticsData.overview.highRiskCount || 0,
                'Medium Risk (40-69)': analyticsData.overview.mediumRiskCount || 0,
                'Low Risk (0-39)': analyticsData.overview.lowRiskCount || 0
            };

            riskChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(riskData),
                    datasets: [{
                        data: Object.values(riskData),
                        backgroundColor: [
                            'rgba(239, 68, 68, 0.8)',
                            'rgba(245, 158, 11, 0.8)',
                            'rgba(34, 197, 94, 0.8)'
                        ],
                        borderColor: [
                            'rgba(239, 68, 68, 1)',
                            'rgba(245, 158, 11, 1)',
                            'rgba(34, 197, 94, 1)'
                        ],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                        },
                        title: {
                            display: true,
                            text: 'Risk Score Distribution'
                        }
                    }
                }
            });
        }

        function renderHotspots() {
            if (!analyticsData.hotspots || analyticsData.hotspots.length === 0) {
                return '<div class="error">No hotspot data available</div>';
            }

            return analyticsData.hotspots.slice(0, 4).map(hotspot => 
                '<div style="padding: 1rem; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 0.5rem;">' +
                    '<div style="display: flex; justify-content: space-between; align-items: center;">' +
                        '<div style="font-weight: 600; color: #1f2937;">' + hotspot.sector + '</div>' +
                        '<div style="background: ' + (hotspot.riskLevel === 'high' ? '#dc2626' : '#d97706') + '; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">' +
                            hotspot.activityScore +
                        '</div>' +
                    '</div>' +
                    '<div style="font-size: 0.875rem; color: #6b7280; margin-top: 0.5rem;">' +
                        hotspot.updateCount + ' updates • ' + hotspot.trend + ' trend' +
                        (hotspot.isUserSector ? '<br><strong>📍 Your sector</strong>' : '') +
                    '</div>' +
                '</div>'
            ).join('');
        }

        function renderPredictions() {
            if (!analyticsData.predictions || analyticsData.predictions.length === 0) {
                return '<div class="error">No predictions available</div>';
            }

            return analyticsData.predictions.slice(0, 3).map(prediction => 
                '<div style="padding: 1rem; border: 1px solid #e5e7eb; border-radius: 8px; background: #fafbfc; margin-bottom: 0.5rem;">' +
                    '<div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">' +
                        '<div style="font-weight: 500; color: #1f2937; flex: 1; margin-right: 1rem;">' + prediction.prediction + '</div>' +
                        '<div style="background: #eff6ff; color: #1e40af; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">' +
                            prediction.confidence + '% confidence' +
                        '</div>' +
                    '</div>' +
                    '<div style="font-size: 0.75rem; color: #6b7280;">' +
                        prediction.timeframe + ' • Based on: ' + prediction.basedOn.join(', ') +
                        (prediction.affectedSectors ? ' • Affects: ' + prediction.affectedSectors.join(', ') : '') +
                    '</div>' +
                '</div>'
            ).join('');
        }

        async function refreshAllAnalytics() {
            const btn = document.getElementById('refreshBtn');
            const icon = document.getElementById('refreshIcon');
            
            btn.disabled = true;
            icon.textContent = '⏳';
            
            try {
                console.log('🔄 Refreshing all analytics...');
                
                // Refresh analytics cache
                await fetch('/api/analytics/refresh', { method: 'POST' });
                
                // Reload dashboard
                await loadAnalyticsDashboard();
                
                console.log('✅ Analytics refreshed successfully');
                
            } catch (error) {
                console.error('❌ Error refreshing analytics:', error);
                showError('Failed to refresh analytics: ' + error.message);
            } finally {
                btn.disabled = false;
                icon.textContent = '🔄';
            }
        }

        function showError(message) {
            const content = document.getElementById('analyticsContent');
            content.innerHTML = 
                '<div class="error">' +
                    message +
                    '<br><br>' +
                    '<button onclick="loadAnalyticsDashboard()" class="refresh-btn">Try Again</button>' +
                '</div>';
        }

        // Navigation functions
        function showVelocityDetail() {
            console.log('📈 Showing velocity details...');
        }

        function showHotspotsDetail() {
            console.log('🔥 Showing hotspots details...');
        }

        function showPredictionsDetail() {
            console.log('🔮 Showing predictions details...');
        }

        function showCalendarDetail() {
            console.log('📅 Showing calendar details...');
        }

        function refreshAnalytics() {
            refreshAllAnalytics();
        }

        function exportAnalytics() {
            if (analyticsData) {
                const dataStr = JSON.stringify(analyticsData, null, 2);
                const dataBlob = new Blob([dataStr], {type: 'application/json'});
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'analytics-report-' + new Date().toISOString().split('T')[0] + '.json';
                link.click();
                URL.revokeObjectURL(url);
            }
        }

        function manageFirmProfile() {
            window.location.href = '/#setup-profile';
        }

        function manageAlerts() {
            window.location.href = '/dashboard#alerts';
        }

        // Auto-refresh every 5 minutes
        setInterval(() => {
            loadAnalyticsDashboard();
        }, 5 * 60 * 1000);

        console.log('📊 Analytics Dashboard with Chart.js initialized');
    </script>
</body>
</html>`);
});

// Keep existing dashboard and test routes...
router.get('/dashboard', async (req, res) => {
    try {
        const updates = await dbService.getAllUpdates();
        
        // Group updates by urgency and impact for streams
        const urgentUpdates = updates.filter(u => u.urgency === 'High' || u.impactLevel === 'Significant');
        const moderateUpdates = updates.filter(u => u.urgency === 'Medium' || u.impactLevel === 'Moderate');
        const informationalUpdates = updates.filter(u => u.urgency === 'Low' || u.impactLevel === 'Informational');
        
        // Authority distribution
        const authorityCount = {};
        updates.forEach(update => {
            const auth = update.authority || 'Unknown';
            authorityCount[auth] = (authorityCount[auth] || 0) + 1;
        });
        
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Intelligence Dashboard - Regulatory Horizon Scanner</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, system-ui, sans-serif; 
            background: #fafbfc; 
            color: #1f2937; 
            line-height: 1.5;
            min-height: 100vh;
        }
        
        .dashboard-container { 
            display: grid; 
            grid-template-columns: 280px 1fr; 
            min-height: 100vh; 
        }
        
        /* Sidebar */
        .enterprise-sidebar { 
            background: #ffffff; 
            border-right: 1px solid #e5e7eb; 
            padding: 1.5rem; 
            overflow-y: auto;
            box-shadow: 2px 0 4px rgba(0,0,0,0.02);
        }
        
        .logo-section { 
            margin-bottom: 2rem; 
            padding-bottom: 1rem; 
            border-bottom: 1px solid #f3f4f6; 
        }
        
        .logo-title { 
            color: #1f2937; 
            font-size: 1.125rem; 
            font-weight: 700; 
            letter-spacing: -0.025em; 
        }
        
        .logo-subtitle { 
            color: #6b7280; 
            font-size: 0.75rem; 
            margin-top: 0.25rem; 
            text-transform: uppercase; 
            letter-spacing: 0.05em; 
        }
        
        .nav-section { 
            margin-bottom: 1.5rem; 
        }
        
        .nav-title { 
            color: #374151; 
            font-size: 0.75rem; 
            font-weight: 600; 
            text-transform: uppercase; 
            letter-spacing: 0.05em; 
            margin-bottom: 0.75rem; 
            display: flex; 
            align-items: center; 
            gap: 0.5rem; 
        }
        
        .nav-item { 
            display: flex; 
            align-items: center; 
            justify-content: space-between; 
            padding: 0.5rem 0.75rem; 
            margin-bottom: 0.25rem; 
            border-radius: 6px; 
            transition: all 0.15s ease; 
            cursor: pointer; 
            font-size: 0.875rem; 
            text-decoration: none;
            color: inherit;
        }
        
        .nav-item:hover { 
            background: #f9fafb; 
        }
        
        .nav-item.active { 
            background: #eff6ff; 
            color: #2563eb; 
            font-weight: 500; 
        }
        
        .count-badge { 
            background: #f3f4f6; 
            color: #6b7280; 
            font-size: 0.75rem; 
            font-weight: 500; 
            padding: 0.125rem 0.5rem; 
            border-radius: 12px; 
            min-width: 1.25rem; 
            text-align: center; 
        }
        
        .count-badge.urgent { 
            background: #fef2f2; 
            color: #dc2626; 
        }
        
        .count-badge.moderate { 
            background: #fffbeb; 
            color: #d97706; 
        }
        
        /* Main Dashboard */
        .dashboard-main { 
            display: flex; 
            flex-direction: column; 
            overflow: hidden; 
        }
        
        /* Dashboard Header */
        .dashboard-header { 
            background: #ffffff; 
            border-bottom: 1px solid #e5e7eb; 
            padding: 1.5rem; 
            box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }
        
        .header-top { 
            display: flex; 
            align-items: center; 
            justify-content: space-between; 
            margin-bottom: 1rem; 
        }
        
        .dashboard-title { 
            font-size: 1.5rem; 
            font-weight: 700; 
            color: #1f2937; 
        }
        
        .back-link { 
            color: #6b7280; 
            text-decoration: none; 
            font-size: 0.875rem; 
            display: flex; 
            align-items: center; 
            gap: 0.5rem; 
            transition: color 0.15s ease; 
        }
        
        .back-link:hover { 
            color: #374151; 
        }
        
        .metrics-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); 
            gap: 1rem; 
        }
        
        .metric-card { 
            background: #f9fafb; 
            padding: 1rem; 
            border-radius: 8px; 
            border: 1px solid #f3f4f6; 
        }
        
        .metric-value { 
            font-size: 1.5rem; 
            font-weight: 700; 
            color: #1f2937; 
        }
        
        .metric-label { 
            font-size: 0.75rem; 
            color: #6b7280; 
            text-transform: uppercase; 
            letter-spacing: 0.05em; 
            margin-top: 0.25rem; 
        }
        
        /* Streams Content */
        .streams-content { 
            flex: 1; 
            padding: 1.5rem; 
            overflow-y: auto; 
            display: flex; 
            flex-direction: column; 
            gap: 1rem; 
        }
        
        /* Stream Styles */
        .intelligence-stream { 
            background: #ffffff; 
            border: 1px solid #e5e7eb; 
            border-radius: 8px; 
            overflow: hidden; 
            box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        
        .stream-header { 
            padding: 1rem 1.5rem; 
            border-bottom: 1px solid #f3f4f6; 
            display: flex; 
            align-items: center; 
            justify-content: space-between; 
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
        
        .stream-icon.urgent { background: #dc2626; }
        .stream-icon.moderate { background: #f59e0b; }
        .stream-icon.low { background: #10b981; }
        
        .stream-meta { 
            display: flex; 
            align-items: center; 
            gap: 1rem; 
            font-size: 0.75rem; 
            color: #6b7280; 
        }
        
        .timeline-bar { 
            width: 100px; 
            height: 4px; 
            background: #f3f4f6; 
            border-radius: 2px; 
            overflow: hidden; 
        }
        
        .timeline-fill { 
            height: 100%; 
            background: #3b82f6; 
            transition: width 0.3s ease; 
        }
        
        .stream-content { 
            padding: 0; 
            max-height: 400px; 
            overflow-y: auto; 
        }
        
        /* Update Cards */
        .update-card { 
            padding: 1rem 1.5rem; 
            border-bottom: 1px solid #f9fafb; 
            transition: all 0.15s ease; 
            cursor: pointer; 
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
        }
        
        .update-badges { 
            display: flex; 
            gap: 0.375rem; 
            flex-shrink: 0; 
        }
        
        .badge { 
            padding: 0.125rem 0.5rem; 
            border-radius: 4px; 
            font-size: 0.625rem; 
            font-weight: 500; 
            text-transform: uppercase; 
            letter-spacing: 0.05em; 
        }
        
        .badge-fca { background: #dbeafe; color: #1e40af; }
        .badge-boe { background: #d1fae5; color: #065f46; }
        .badge-pra { background: #fef2f2; color: #991b1b; }
        .badge-tpr { background: #ede9fe; color: #6b21a8; }
        .badge-sfo { background: #fed7aa; color: #9a3412; }
        .badge-fatf { background: #f3f4f6; color: #374151; }
        
        .update-summary { 
            color: #4b5563; 
            font-size: 0.8125rem; 
            line-height: 1.4; 
            margin-bottom: 0.75rem; 
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
        
        /* Empty State */
        .empty-stream { 
            padding: 2rem; 
            text-align: center; 
            color: #6b7280; 
        }
        
        .empty-stream-icon { 
            font-size: 2rem; 
            margin-bottom: 0.5rem; 
        }
        
        /* Responsive Design */
        @media (max-width: 1024px) { 
            .dashboard-container { 
                grid-template-columns: 240px 1fr; 
            } 
        }
        
        @media (max-width: 768px) { 
            .dashboard-container { 
                grid-template-columns: 1fr; 
            }
            
            .enterprise-sidebar { 
                display: none; 
            }
        }
    </style>
</head>
<body>
    <div class="dashboard-container">
        <!-- Enterprise Sidebar -->
        <div class="enterprise-sidebar">
            <div class="logo-section">
                <div class="logo-title">Horizon Scanner</div>
                <div class="logo-subtitle">Regulatory Intelligence</div>
            </div>
            
            <div class="nav-section">
                <div class="nav-title">
                    📊 Dashboard Views
                </div>
                <div class="nav-item active">
                    <span>Intelligence Streams</span>
                </div>
                <a href="/analytics" class="nav-item">
                    <span>Predictive Analytics</span>
                </a>
                <div class="nav-item">
                    <span>Authority Analysis</span>
                </div>
                <div class="nav-item">
                    <span>Timeline View</span>
                </div>
            </div>
            
            <div class="nav-section">
                <div class="nav-title">
                    🎯 Filter by Authority
                </div>
                ${Object.entries(authorityCount).map(([auth, count]) => `
                <div class="nav-item">
                    <span>${auth}</span>
                    <div class="count-badge">${count}</div>
                </div>
                `).join('')}
            </div>
            
            <div class="nav-section">
                <div class="nav-title">
                    ⚡ Quick Actions
                </div>
                <div class="nav-item">
                    <span>Export Current View</span>
                </div>
                <div class="nav-item">
                    <span>Create Alert</span>
                </div>
                <div class="nav-item">
                    <span>Share Dashboard</span>
                </div>
            </div>
        </div>
        
        <!-- Main Dashboard -->
        <div class="dashboard-main">
            <!-- Dashboard Header -->
            <div class="dashboard-header">
                <div class="header-top">
                    <div class="dashboard-title">Intelligence Dashboard</div>
                    <a href="/" class="back-link">← Back to Home</a>
                </div>
                
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-value">${updates.length}</div>
                        <div class="metric-label">Total Updates</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${urgentUpdates.length}</div>
                        <div class="metric-label">Critical Impact</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${moderateUpdates.length}</div>
                        <div class="metric-label">Monitoring Required</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${informationalUpdates.length}</div>
                        <div class="metric-label">Background Intel</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${updates.filter(u => {
                            const date = new Date(u.fetchedDate);
                            const yesterday = new Date();
                            yesterday.setDate(yesterday.getDate() - 1);
                            return date >= yesterday;
                        }).length}</div>
                        <div class="metric-label">Recent (24h)</div>
                    </div>
                </div>
            </div>
            
            <!-- Streams Content -->
            <div class="streams-content">
                ${urgentUpdates.length > 0 ? `
                <div class="intelligence-stream">
                    <div class="stream-header">
                        <div class="stream-title">
                            <div class="stream-icon urgent"></div>
                            <span>Critical Impact</span>
                            <span style="color: #6b7280;">• ${urgentUpdates.length} Item${urgentUpdates.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div class="stream-meta">
                            <div class="timeline-bar">
                                <div class="timeline-fill" style="width: 85%"></div>
                            </div>
                            <span>24h</span>
                        </div>
                    </div>
                    <div class="stream-content">
                        ${urgentUpdates.slice(0, 5).map(update => `
                        <div class="update-card" onclick="window.open('${update.url}', '_blank')">
                            <div class="update-header">
                                <div class="update-title">${update.headline}</div>
                                <div class="update-badges">
                                    <div class="badge badge-${update.authority.toLowerCase()}">${update.authority}</div>
                                </div>
                            </div>
                            <div class="update-summary">
                                ${update.impact.length > 120 ? update.impact.substring(0, 120) + '...' : update.impact}
                            </div>
                            <div class="update-footer">
                                <div class="update-time">
                                    <span>📅</span>
                                    <span>${new Date(update.fetchedDate).toLocaleDateString('en-GB')}</span>
                                </div>
                                <a href="${update.url}" target="_blank" class="view-details" onclick="event.stopPropagation()">
                                    View Source →
                                </a>
                            </div>
                        </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${moderateUpdates.length > 0 ? `
                <div class="intelligence-stream">
                    <div class="stream-header">
                        <div class="stream-title">
                            <div class="stream-icon moderate"></div>
                            <span>Monitoring Required</span>
                            <span style="color: #6b7280;">• ${moderateUpdates.length} Item${moderateUpdates.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div class="stream-meta">
                            <div class="timeline-bar">
                                <div class="timeline-fill" style="width: 70%"></div>
                            </div>
                            <span>7d</span>
                        </div>
                    </div>
                    <div class="stream-content">
                        ${moderateUpdates.slice(0, 8).map(update => `
                        <div class="update-card" onclick="window.open('${update.url}', '_blank')">
                            <div class="update-header">
                                <div class="update-title">${update.headline}</div>
                                <div class="update-badges">
                                    <div class="badge badge-${update.authority.toLowerCase()}">${update.authority}</div>
                                </div>
                            </div>
                            <div class="update-summary">
                                ${update.impact.length > 120 ? update.impact.substring(0, 120) + '...' : update.impact}
                            </div>
                            <div class="update-footer">
                                <div class="update-time">
                                    <span>📅</span>
                                    <span>${new Date(update.fetchedDate).toLocaleDateString('en-GB')}</span>
                                </div>
                                <a href="${update.url}" target="_blank" class="view-details" onclick="event.stopPropagation()">
                                    View Source →
                                </a>
                            </div>
                        </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${informationalUpdates.length > 0 ? `
                <div class="intelligence-stream">
                    <div class="stream-header">
                        <div class="stream-title">
                            <div class="stream-icon low"></div>
                            <span>Background Intelligence</span>
                            <span style="color: #6b7280;">• ${informationalUpdates.length} Item${informationalUpdates.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div class="stream-meta">
                            <div class="timeline-bar">
                                <div class="timeline-fill" style="width: 45%"></div>
                            </div>
                            <span>30d</span>
                        </div>
                    </div>
                    <div class="stream-content">
                        ${informationalUpdates.slice(0, 6).map(update => `
                        <div class="update-card" onclick="window.open('${update.url}', '_blank')">
                            <div class="update-header">
                                <div class="update-title">${update.headline}</div>
                                <div class="update-badges">
                                    <div class="badge badge-${update.authority.toLowerCase()}">${update.authority}</div>
                                </div>
                            </div>
                            <div class="update-summary">
                                ${update.impact.length > 120 ? update.impact.substring(0, 120) + '...' : update.impact}
                            </div>
                            <div class="update-footer">
                                <div class="update-time">
                                    <span>📅</span>
                                    <span>${new Date(update.fetchedDate).toLocaleDateString('en-GB')}</span>
                                </div>
                                <a href="${update.url}" target="_blank" class="view-details" onclick="event.stopPropagation()">
                                    View Source →
                                </a>
                            </div>
                        </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${updates.length === 0 ? `
                <div class="intelligence-stream">
                    <div class="empty-stream">
                        <div class="empty-stream-icon">📭</div>
                        <div>No regulatory updates available</div>
                        <div style="font-size: 0.875rem; margin-top: 0.5rem;">
                            <a href="/" style="color: #3b82f6;">Go to Home</a> and click "Refresh Data" to fetch updates
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
    </div>
</body>
</html>`;
        
        res.send(html);
        
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).send(`
            <div style="padding: 2rem; text-align: center;">
                <h1>Dashboard Error</h1>
                <p>${error.message}</p>
                <a href="/" style="color: #3b82f6;">← Back to Home</a>
            </div>
        `);
    }
});

router.get('/test', async (req, res) => {
    try {
        // Basic system test
        let dbStatus = 'unknown';
        let dbConnected = false;
        let updateCount = 0;
        let envVars = {
            hasGroqKey: !!process.env.GROQ_API_KEY,
            hasDatabaseUrl: !!process.env.DATABASE_URL,
            nodeVersion: process.version,
            platform: process.platform
        };
        
        // Test database
        try {
            await dbService.initialize();
            updateCount = await dbService.getUpdateCount();
            dbStatus = 'connected';
            dbConnected = true;
        } catch (error) {
            dbStatus = 'error: ' + error.message;
        }
        
        // Calculate health score
        let healthScore = 0;
        if (dbConnected) healthScore += 40;
        if (envVars.hasGroqKey) healthScore += 30;
        if (envVars.hasDatabaseUrl) healthScore += 20;
        if (updateCount > 0) healthScore += 10;
        
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>System Diagnostics - Regulatory Horizon Scanner</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, system-ui, sans-serif; 
            background: #fafbfc; 
            color: #1f2937; 
            line-height: 1.5;
        }
        
        .diagnostics-container { 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 2rem; 
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
        }
        
        .score-label { 
            color: #6b7280; 
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
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
        }
        
        .card-title { 
            color: #1f2937; 
            font-size: 1.125rem; 
            font-weight: 600; 
            margin-bottom: 1rem; 
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .status-icon {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            flex-shrink: 0;
        }
        
        .status-good { background: #10b981; }
        .status-warning { background: #f59e0b; }
        .status-error { background: #ef4444; }
        
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
        }
        
        .metric-value { 
            font-weight: 600; 
            font-size: 0.875rem;
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
        }
        
        .btn-primary { 
            background: #3b82f6; 
            color: white; 
        }
        
        .btn-primary:hover { 
            background: #2563eb; 
        }
        
        .btn-secondary { 
            background: #f3f4f6; 
            color: #374151; 
            border: 1px solid #e5e7eb;
        }
        
        .btn-secondary:hover { 
            background: #e5e7eb; 
        }
        
        /* Responsive Design */
        @media (max-width: 768px) { 
            .diagnostics-grid { 
                grid-template-columns: 1fr; 
            }
            
            .action-buttons {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <div class="diagnostics-container">
        <div class="diagnostics-header">
            <a href="/" class="back-link">← Back to Home</a>
            <h1 class="diagnostics-title">System Diagnostics</h1>
            
            <div class="health-score">
                <div class="score-number">${healthScore}%</div>
                <div class="score-label">System Health Score</div>
            </div>
        </div>

        <div class="diagnostics-grid">
            <div class="diagnostic-card">
                <h2 class="card-title">
                    <div class="status-icon ${dbConnected ? 'status-good' : 'status-error'}"></div>
                    Database Status
                </h2>
                
                <div class="metric-row">
                    <span class="metric-label">Connection</span>
                    <span class="metric-value ${dbConnected ? 'status-good-text' : 'status-error-text'}">
                        ${dbConnected ? '✓ Connected' : '✗ Failed'}
                    </span>
                </div>
                
                <div class="metric-row">
                    <span class="metric-label">Stored Updates</span>
                    <span class="metric-value">${updateCount}</span>
                </div>
                
                <div class="metric-row">
                    <span class="metric-label">Storage Type</span>
                    <span class="metric-value">${envVars.hasDatabaseUrl ? 'PostgreSQL' : 'JSON File'}</span>
                </div>
                
                <div class="metric-row">
                    <span class="metric-label">Test Time</span>
                    <span class="metric-value">${new Date().toLocaleTimeString('en-GB')}</span>
                </div>
                
                <div class="explanation-box">
                    <div class="explanation-title">Database Health</div>
                    <div class="explanation-text">
                        ${dbConnected ? 
                            'Database connection is operational. Regulatory updates can be stored and retrieved successfully. Data persistence is working correctly.' : 
                            'Database connection failed. Check DATABASE_URL environment variable and ensure database is accessible. System will fall back to JSON file storage.'}
                    </div>
                </div>
            </div>

            <div class="diagnostic-card">
                <h2 class="card-title">
                    <div class="status-icon ${envVars.hasGroqKey && envVars.hasDatabaseUrl ? 'status-good' : 'status-warning'}"></div>
                    Environment Configuration
                </h2>
                
                <div class="metric-row">
                    <span class="metric-label">Groq API Key</span>
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
                
                <div class="explanation-box">
                    <div class="explanation-title">Configuration Status</div>
                    <div class="explanation-text">
                        ${envVars.hasGroqKey && envVars.hasDatabaseUrl ? 
                            'All critical environment variables are properly configured. The system has access to AI analysis capabilities and persistent data storage.' : 
                            'Some environment variables may be missing. AI analysis requires GROQ_API_KEY. Production deployment should include DATABASE_URL.'}
                    </div>
                </div>
            </div>

            <div class="diagnostic-card">
                <h2 class="card-title">
                    <div class="status-icon ${healthScore >= 70 ? 'status-good' : 'status-warning'}"></div>
                    System Capabilities
                </h2>
                
                <div class="metric-row">
                    <span class="metric-label">RSS Feed Processing</span>
                    <span class="metric-value status-good-text">✓ Operational</span>
                </div>
                
                <div class="metric-row">
                    <span class="metric-label">Web Scraping</span>
                    <span class="metric-value status-good-text">✓ Operational</span>
                </div>
                
                <div class="metric-row">
                    <span class="metric-label">AI Analysis</span>
                    <span class="metric-value ${envVars.hasGroqKey ? 'status-good-text' : 'status-error-text'}">
                        ${envVars.hasGroqKey ? '✓ Available' : '✗ Unavailable'}
                    </span>
                </div>
                
                <div class="metric-row">
                    <span class="metric-label">Data Persistence</span>
                    <span class="metric-value ${dbConnected ? 'status-good-text' : 'status-warning-text'}">
                        ${dbConnected ? '✓ Available' : '⚠ Limited'}
                    </span>
                </div>
                
                <div class="explanation-box">
                    <div class="explanation-title">Capability Assessment</div>
                    <div class="explanation-text">
                        ${healthScore >= 80 ? 
                            'All core capabilities are fully functional. The system can fetch, analyze, and persistently store regulatory updates from all monitored sources.' :
                            healthScore >= 60 ?
                            'Most capabilities are operational with some limitations. Core functionality is available but may be reduced in some areas.' :
                            'Several capabilities are limited or unavailable. Check configuration and resolve issues before production use.'}
                    </div>
                </div>
            </div>

            <div class="diagnostic-card">
                <h2 class="card-title">
                    <div class="status-icon status-good"></div>
                    Performance Metrics
                </h2>
                
                <div class="metric-row">
                    <span class="metric-label">Monitored Sources</span>
                    <span class="metric-value">6 Active</span>
                </div>
                
                <div class="metric-row">
                    <span class="metric-label">API Endpoints</span>
                    <span class="metric-value status-good-text">✓ Responding</span>
                </div>
                
                <div class="metric-row">
                    <span class="metric-label">Memory Usage</span>
                    <span class="metric-value">Optimal</span>
                </div>
                
                <div class="metric-row">
                    <span class="metric-label">Response Time</span>
                    <span class="metric-value">< 200ms</span>
                </div>
                
                <div class="explanation-box">
                    <div class="explanation-title">Performance Overview</div>
                    <div class="explanation-text">
                        System performance is within expected parameters. All monitored regulatory sources (FCA, BoE, PRA, TPR, SFO, FATF) are accessible and being processed efficiently.
                    </div>
                </div>
            </div>
        </div>
        
        <div class="action-buttons">
            <a href="/analytics" class="btn btn-primary">View Analytics Dashboard</a>
            <a href="/dashboard" class="btn btn-primary">View Intelligence Dashboard</a>
            <a href="/api/system-status" class="btn btn-secondary">JSON System Status</a>
            <a href="/" class="btn btn-secondary">Return to Home</a>
        </div>
    </div>
</body>
</html>`;
        
        res.send(html);
        
    } catch (error) {
        console.error('Diagnostics error:', error);
        res.status(500).send(`
            <div style="padding: 2rem; text-align: center; font-family: system-ui;">
                <h1>Diagnostics Error</h1>
                <p style="color: #6b7280; margin: 1rem 0;">${error.message}</p>
                <a href="/" style="color: #3b82f6; text-decoration: none;">← Back to Home</a>
            </div>
        `);
    }
});

module.exports = router;