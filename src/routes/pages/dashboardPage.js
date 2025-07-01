// src/routes/pages/dashboardPage.js
// CLEANED: Removed duplicate functions, kept only dashboard-specific logic

const { getCommonStyles } = require('../templates/commonStyles');
const { getSidebar } = require('../templates/sidebar');
const { getCommonClientScripts } = require('../templates/clientScripts');
const dbService = require('../../services/dbService');

// Helper functions remain the same for fallback compatibility
const getAnalyticsService = () => {
    try {
        return require('../../services/analyticsService');
    } catch (error) {
        console.warn('Analytics service not available, using fallback');
        return {
            calculateRiskScore: () => 0
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
            getWorkspaceStats: () => ({ success: true, stats: { pinnedItems: 0, savedSearches: 0, activeAlerts: 0 } })
        };
    }
};

const dashboardPage = async (req, res) => {
    try {
        // Get updates and categorize them
        const updates = await dbService.getAllUpdates();
        
        const urgentUpdates = updates.filter(u => u.urgency === 'High' || u.impactLevel === 'Significant');
        const moderateUpdates = updates.filter(u => u.urgency === 'Medium' || u.impactLevel === 'Moderate');
        const informationalUpdates = updates.filter(u => u.urgency === 'Low' || u.impactLevel === 'Informational');
        
        // Calculate enhanced counts for the new filtering sections
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
            urgentCount: urgentUpdates.length,
            moderateCount: moderateUpdates.length,
            informationalCount: informationalUpdates.length,
            fcaCount: authorityCount.FCA || 0,
            boeCount: authorityCount.BoE || 0,
            praCount: authorityCount.PRA || 0,
            tprCount: authorityCount.TPR || 0,
            sfoCount: authorityCount.SFO || 0,
            fatfCount: authorityCount.FATF || 0,
            // Enhanced counts for filtering
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
    <title>Regulatory News Feed - Horizon Scanner</title>
    ${getCommonStyles()}
    <style>
        /* Dashboard-specific styles */
        .dashboard-container { 
            display: grid; 
            grid-template-columns: 280px 1fr; 
            min-height: 100vh; 
        }
        
        .dashboard-main { 
            display: flex; 
            flex-direction: column; 
            overflow: hidden; 
        }
        
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
            display: flex;
            align-items: center;
            gap: 0.75rem;
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
            transition: all 0.15s ease;
        }
        
        .metric-card:hover {
            background: #f3f4f6;
            transform: translateY(-1px);
        }
        
        .metric-value { 
            font-size: 1.5rem; 
            font-weight: 700; 
            color: #1f2937; 
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .metric-icon {
            font-size: 1.25rem;
        }
        
        .metric-label { 
            font-size: 0.75rem; 
            color: #6b7280; 
            text-transform: uppercase; 
            letter-spacing: 0.05em; 
            margin-top: 0.25rem; 
            font-weight: 500;
        }
        
        .streams-content { 
            flex: 1; 
            padding: 1.5rem; 
            overflow-y: auto; 
            display: flex; 
            flex-direction: column; 
            gap: 1rem; 
            background: #fafbfc;
        }
        
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
            cursor: help;
            position: relative;
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
            padding: 0; 
            max-height: 500px; 
            overflow-y: auto; 
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
            margin-bottom: 0.75rem;
        }
        
        .badge { 
            padding: 0.125rem 0.5rem; 
            border-radius: 4px; 
            font-size: 0.625rem; 
            font-weight: 500; 
            text-transform: uppercase; 
            letter-spacing: 0.05em; 
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
        }
        
        /* Enhanced authority badges with recognition icons */
        .badge-fca { 
            background: #dbeafe; 
            color: #1e40af; 
        }
        .badge-fca::before {
            content: '🏛️';
            font-size: 0.75rem;
        }
        
        .badge-boe { 
            background: #d1fae5; 
            color: #065f46; 
        }
        .badge-boe::before {
            content: '🏦';
            font-size: 0.75rem;
        }
        
        .badge-pra { 
            background: #fef2f2; 
            color: #991b1b; 
        }
        .badge-pra::before {
            content: '⚖️';
            font-size: 0.75rem;
        }
        
        .badge-tpr { 
            background: #ede9fe; 
            color: #6b21a8; 
        }
        .badge-tpr::before {
            content: '🏢';
            font-size: 0.75rem;
        }
        
        .badge-sfo { 
            background: #fed7aa; 
            color: #9a3412; 
        }
        .badge-sfo::before {
            content: '🔍';
            font-size: 0.75rem;
        }
        
        .badge-fatf { 
            background: #f3f4f6; 
            color: #374151; 
        }
        .badge-fatf::before {
            content: '🌍';
            font-size: 0.75rem;
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
        
        /* Enhanced date display with clear single format */
        .date-display {
            display: flex;
            align-items: center;
            gap: 0.375rem;
            font-size: 0.75rem;
            color: #6b7280;
        }

        .date-icon {
            font-size: 0.875rem;
        }

        .publication-date {
            font-weight: 500;
            color: #374151;
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
        
        .empty-stream { 
            padding: 2rem; 
            text-align: center; 
            color: #6b7280; 
        }
        
        .empty-stream-icon { 
            font-size: 2rem; 
            margin-bottom: 0.5rem; 
        }

        .filter-actions {
            display: flex;
            gap: 0.5rem;
            margin-top: 1rem;
            flex-wrap: wrap;
        }

        .filter-btn {
            background: #f3f4f6;
            color: #374151;
            border: 1px solid #e5e7eb;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .filter-btn:hover {
            background: #e5e7eb;
        }

        .filter-btn.active {
            background: #3b82f6;
            color: white;
            border-color: #2563eb;
        }

        .source-indicator {
            font-size: 0.7rem;
            color: #9ca3af;
            margin-left: 0.5rem;
        }
        
        @media (max-width: 1024px) { 
            .dashboard-container { 
                grid-template-columns: 240px 1fr; 
            } 
        }
        
        @media (max-width: 768px) { 
            .dashboard-container { 
                grid-template-columns: 1fr; 
            }
            
            .sidebar { 
                display: none; 
            }

            .metrics-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    </style>
</head>
<body>
    <div class="dashboard-container">
        ${getSidebar('dashboard', counts)}
        
        <div class="dashboard-main">
            <div class="dashboard-header">
                <div class="header-top">
                    <div class="dashboard-title">
                        📰 Regulatory News Feed
                    </div>
                    <a href="/" class="back-link">← Back to Home</a>
                </div>
                
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-value">
                            <span class="metric-icon">📊</span>
                            ${updates.length}
                        </div>
                        <div class="metric-label">Total Updates</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">
                            <span class="metric-icon">🚨</span>
                            ${urgentUpdates.length}
                        </div>
                        <div class="metric-label">Critical Impact</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">
                            <span class="metric-icon">⚠️</span>
                            ${moderateUpdates.length}
                        </div>
                        <div class="metric-label">Monitoring Required</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">
                            <span class="metric-icon">📋</span>
                            ${informationalUpdates.length}
                        </div>
                        <div class="metric-label">Background News</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">
                            <span class="metric-icon">🕐</span>
                            ${updates.filter(u => {
                                const date = new Date(u.fetchedDate);
                                const yesterday = new Date();
                                yesterday.setDate(yesterday.getDate() - 1);
                                return date >= yesterday;
                            }).length}
                        </div>
                        <div class="metric-label">Recent (24h)</div>
                    </div>
                </div>

                <div class="filter-actions">
                    <button class="filter-btn active" onclick="showAllUpdates()">All Updates</button>
                    <button class="filter-btn" onclick="filterByAuthority('FCA')">FCA Only</button>
                    <button class="filter-btn" onclick="filterByAuthority('BoE')">BoE Only</button>
                    <button class="filter-btn" onclick="filterByAuthority('PRA')">PRA Only</button>
                    <button class="filter-btn" onclick="filterByUrgency('High')">High Urgency</button>
                    <button class="filter-btn" onclick="filterByImpact('Significant')">High Impact</button>
                    <button class="filter-btn" onclick="clearDashboardFilters()">Clear Filters</button>
                </div>
            </div>
            
            <div class="streams-content" id="dashboardStreams">
                ${urgentUpdates.length > 0 ? `
                <div class="intelligence-stream" id="urgentStream">
                    <div class="stream-header">
                        <div class="stream-title">
                            <div class="stream-icon urgent"></div>
                            <span>Critical Impact</span>
                            <span style="color: #6b7280;">• ${urgentUpdates.length} Item${urgentUpdates.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div class="stream-meta">
                            <div class="timeline-bar" data-tooltip="High priority regulatory updates requiring immediate attention">
                                <div class="timeline-fill" style="width: 85%"></div>
                            </div>
                            <span>24h</span>
                        </div>
                    </div>
                    <div class="stream-content">
                        ${urgentUpdates.slice(0, 8).map(update => `
                        <div class="update-card" data-url="${update.url}" data-authority="${update.authority}" data-urgency="${update.urgency}" data-impact="${update.impactLevel}">
                            <div class="update-header">
                                <div class="update-title" onclick="window.open('${update.url}', '_blank')">${update.headline}</div>
                                <div class="update-actions">
                                    <button class="pin-btn" onclick="event.stopPropagation(); toggleDashboardPin('${update.url}', '${update.headline.replace(/'/g, "\\\\'")}', '${update.authority}')" title="Pin item">📍</button>
                                </div>
                            </div>
                            <div class="update-badges">
                                <div class="badge badge-${update.authority.toLowerCase()}">${update.authority}</div>
                                ${update.impactLevel ? `<div class="badge" style="background: #fef2f2; color: #dc2626;">${update.impactLevel}</div>` : ''}
                                ${update.urgency ? `<div class="badge" style="background: #fff7ed; color: #ea580c;">${update.urgency}</div>` : ''}
                            </div>
                            <div class="update-summary">
                                ${update.impact.length > 150 ? update.impact.substring(0, 150) + '...' : update.impact}
                                <span class="source-indicator" title="Data source type">
                                    ${update.url.includes('rss') || update.sourceType === 'rss' ? '📡 RSS' : 
                                      update.url.includes('gov.uk') ? '🏛️ Direct' : '🕷️ Scraped'}
                                </span>
                            </div>
                            <div class="update-footer">
                                <div class="date-display">
                                    <span class="date-icon">📅</span>
                                    <span class="publication-date">${new Date(update.fetchedDate).toLocaleDateString('en-GB', { 
                                        day: 'numeric', 
                                        month: 'short', 
                                        year: 'numeric' 
                                    })}</span>
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
                <div class="intelligence-stream" id="moderateStream">
                    <div class="stream-header">
                        <div class="stream-title">
                            <div class="stream-icon moderate"></div>
                            <span>Monitoring Required</span>
                            <span style="color: #6b7280;">• ${moderateUpdates.length} Item${moderateUpdates.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div class="stream-meta">
                            <div class="timeline-bar" data-tooltip="Medium priority updates for ongoing monitoring">
                                <div class="timeline-fill" style="width: 70%"></div>
                            </div>
                            <span>7d</span>
                        </div>
                    </div>
                    <div class="stream-content">
                        ${moderateUpdates.slice(0, 10).map(update => `
                        <div class="update-card" data-url="${update.url}" data-authority="${update.authority}" data-urgency="${update.urgency}" data-impact="${update.impactLevel}">
                            <div class="update-header">
                                <div class="update-title" onclick="window.open('${update.url}', '_blank')">${update.headline}</div>
                                <div class="update-actions">
                                    <button class="pin-btn" onclick="event.stopPropagation(); toggleDashboardPin('${update.url}', '${update.headline.replace(/'/g, "\\\\'")}', '${update.authority}')" title="Pin item">📍</button>
                                </div>
                            </div>
                            <div class="update-badges">
                                <div class="badge badge-${update.authority.toLowerCase()}">${update.authority}</div>
                                ${update.impactLevel ? `<div class="badge" style="background: #fffbeb; color: #d97706;">${update.impactLevel}</div>` : ''}
                                ${update.urgency ? `<div class="badge" style="background: #f0f9ff; color: #0369a1;">${update.urgency}</div>` : ''}
                            </div>
                            <div class="update-summary">
                                ${update.impact.length > 150 ? update.impact.substring(0, 150) + '...' : update.impact}
                                <span class="source-indicator" title="Data source type">
                                    ${update.url.includes('rss') || update.sourceType === 'rss' ? '📡 RSS' : 
                                      update.url.includes('gov.uk') ? '🏛️ Direct' : '🕷️ Scraped'}
                                </span>
                            </div>
                            <div class="update-footer">
                                <div class="date-display">
                                    <span class="date-icon">📅</span>
                                    <span class="publication-date">${new Date(update.fetchedDate).toLocaleDateString('en-GB', { 
                                        day: 'numeric', 
                                        month: 'short', 
                                        year: 'numeric' 
                                    })}</span>
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
                <div class="intelligence-stream" id="informationalStream">
                    <div class="stream-header">
                        <div class="stream-title">
                            <div class="stream-icon low"></div>
                            <span>Background News</span>
                            <span style="color: #6b7280;">• ${informationalUpdates.length} Item${informationalUpdates.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div class="stream-meta">
                            <div class="timeline-bar" data-tooltip="Informational updates and background regulatory news">
                                <div class="timeline-fill" style="width: 45%"></div>
                            </div>
                            <span>30d</span>
                        </div>
                    </div>
                    <div class="stream-content">
                        ${informationalUpdates.slice(0, 8).map(update => `
                        <div class="update-card" data-url="${update.url}" data-authority="${update.authority}" data-urgency="${update.urgency}" data-impact="${update.impactLevel}">
                            <div class="update-header">
                                <div class="update-title" onclick="window.open('${update.url}', '_blank')">${update.headline}</div>
                                <div class="update-actions">
                                    <button class="pin-btn" onclick="event.stopPropagation(); toggleDashboardPin('${update.url}', '${update.headline.replace(/'/g, "\\\\'")}', '${update.authority}')" title="Pin item">📍</button>
                                </div>
                            </div>
                            <div class="update-badges">
                                <div class="badge badge-${update.authority.toLowerCase()}">${update.authority}</div>
                                ${update.impactLevel ? `<div class="badge" style="background: #f0fdf4; color: #166534;">${update.impactLevel}</div>` : ''}
                                ${update.urgency ? `<div class="badge" style="background: #f8fafc; color: #475569;">${update.urgency}</div>` : ''}
                            </div>
                            <div class="update-summary">
                                ${update.impact.length > 150 ? update.impact.substring(0, 150) + '...' : update.impact}
                                <span class="source-indicator" title="Data source type">
                                    ${update.url.includes('rss') || update.sourceType === 'rss' ? '📡 RSS' : 
                                      update.url.includes('gov.uk') ? '🏛️ Direct' : '🕷️ Scraped'}
                                </span>
                            </div>
                            <div class="update-footer">
                                <div class="date-display">
                                    <span class="date-icon">📅</span>
                                    <span class="publication-date">${new Date(update.fetchedDate).toLocaleDateString('en-GB', { 
                                        day: 'numeric', 
                                        month: 'short', 
                                        year: 'numeric' 
                                    })}</span>
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
                        <div style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem;">No Updates Available</div>
                        <div style="font-size: 0.875rem; margin-bottom: 1rem;">
                            <a href="/" style="color: #3b82f6;">Go to Home</a> and click "Refresh Data" to fetch updates
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
    </div>

    ${getCommonClientScripts()}

    <script>
        // =================
        // DASHBOARD PAGE SPECIFIC LOGIC ONLY
        // =================

        // Additional dashboard-specific functionality
        async function exportCurrentView() {
            try {
                const response = await fetch('/api/export/data');
                const data = await response.json();
                
                const dataStr = JSON.stringify(data, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                
                const link = document.createElement('a');
                link.href = url;
                link.download = \`dashboard-export-\${new Date().toISOString().split('T')[0]}.json\`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                URL.revokeObjectURL(url);
                showMessage('Dashboard exported successfully', 'success');
                console.log('✅ Dashboard view exported');
            } catch (error) {
                console.error('Export error:', error);
                showMessage('Export failed', 'error');
            }
        }

        async function createDashboardAlert() {
            const keywords = prompt('Enter keywords to monitor (comma-separated):');
            if (!keywords) return;
            
            try {
                const response = await fetch('/api/alerts/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: \`Dashboard Alert: \${keywords}\`,
                        keywords: keywords.split(',').map(k => k.trim()),
                        authorities: ['FCA', 'BoE', 'PRA'],
                        isActive: true
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showMessage('Alert created successfully!', 'success');
                } else {
                    showMessage('Failed to create alert: ' + result.message, 'error');
                }
            } catch (error) {
                console.error('Create alert error:', error);
                showMessage('Failed to create alert', 'error');
            }
        }

        async function shareDashboard() {
            try {
                const shareData = {
                    title: 'Regulatory News Dashboard',
                    text: 'Latest regulatory updates from UK financial authorities',
                    url: window.location.href
                };
                
                if (navigator.share) {
                    await navigator.share(shareData);
                } else {
                    await navigator.clipboard.writeText(\`\${shareData.title}: \${shareData.url}\`);
                    showMessage('Dashboard link copied to clipboard!', 'success');
                }
            } catch (error) {
                console.error('Share error:', error);
                showMessage('Share failed', 'error');
            }
        }

        // Initialize dashboard
        document.addEventListener('DOMContentLoaded', function() {
            console.log('📰 Dashboard Page: Initializing...');
            
            // Load workspace stats and pinned status using common functions
            if (typeof updateWorkspaceCounts === 'function') {
                updateWorkspaceCounts();
            }
            
            if (typeof loadPinnedStatus === 'function') {
                loadPinnedStatus();
            }
            
            console.log('✅ Dashboard initialized with enhanced filtering and pin functionality');
        });
        
        // Make dashboard-specific functions globally available
        window.exportCurrentView = exportCurrentView;
        window.createDashboardAlert = createDashboardAlert;
        window.shareDashboard = shareDashboard;
    </script>
</body>
</html>`;
        
        res.send(html);
        
    } catch (error) {
        console.error('Dashboard page error:', error);
        res.status(500).send(`
            <div style="padding: 2rem; text-align: center;">
                <h1>Dashboard Error</h1>
                <p>${error.message}</p>
                <a href="/" style="color: #3b82f6;">← Back to Home</a>
            </div>
        `);
    }
};

module.exports = dashboardPage;