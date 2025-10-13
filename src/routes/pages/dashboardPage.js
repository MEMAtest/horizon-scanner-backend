// Fixed Dashboard Page - Phase 1
// File: src/routes/pages/dashboardPage.js

const { getSidebar } = require('../templates/sidebar')
const { getClientScripts } = require('../templates/clientScripts')
const { getCommonStyles } = require('../templates/commonStyles')
const dbService = require('../../services/dbService')

function serializeForScript(data) {
  const json = JSON.stringify(data)

  // Escape characters that can break out of <script> tags or terminate strings
  return json
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

async function renderDashboardPage(req, res) {
  try {
    console.log('Analytics Rendering enhanced dashboard page...')

    // Get query parameters for filtering
    const {
      category = 'all',
      authority = null,
      sector = null,
      impact = null,
      range = null,
      search = null
    } = req.query

    // Get enhanced updates with AI analysis
    const updates = await dbService.getEnhancedUpdates({
      category,
      authority,
      sector,
      impact,
      range,
      search,
      limit: 50
    })

    // Clean up any existing AI summaries with "undefined" suffix
    let cleanedCount = 0
    updates.forEach(update => {
      if (update.ai_summary && update.ai_summary.includes('undefined')) {
        const original = update.ai_summary
        update.ai_summary = update.ai_summary
          .replace(/\. undefined/g, '')
          .replace(/\.\. undefined/g, '')
          .replace(/ undefined/g, '')
          .replace(/undefined/g, '')
          .trim()
        if (original !== update.ai_summary) {
          cleanedCount++
        }
      }
    })

    if (cleanedCount > 0) {
      console.log(`Clean Cleaned ${cleanedCount} AI summaries with "undefined" suffix`)
    }

    // Debug: Check if ai_summary exists in first few updates
    if (updates.length > 0) {
      console.log('Search DEBUG - Sample update fields:', {
        ai_summary: updates[0].ai_summary,
        summary: updates[0].summary ? updates[0].summary.substring(0, 100) + '...' : null,
        headline: updates[0].headline
      })
    }

    // Get dashboard statistics
    const dashboardStats = await getDashboardStatistics()

    // Get filter options
    const filterOptions = await getFilterOptions()

    // Generate sidebar
    const sidebar = await getSidebar('dashboard')

    const aiCoverage = dashboardStats.totalUpdates > 0
      ? Math.round((dashboardStats.aiAnalyzed / dashboardStats.totalUpdates) * 100)
      : 0

    const formatStatChange = (delta = 0, percent = 0) => {
      const value = Number(delta) || 0
      const percentValue = Number(percent) || 0
      const direction = value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral'
      const arrow = value > 0 ? 'Up' : value < 0 ? 'Down' : '-'
      const absValue = Math.abs(value)
      const absPercent = Math.abs(percentValue)
      const percentLabel = absPercent ? ` (${absPercent}%)` : ''
      return `<div class="stat-change ${direction}">${arrow} ${absValue}${percentLabel} vs last week</div>`
    }

    const serializedInitialUpdates = serializeForScript(updates)
    const serializedDashboardStats = serializeForScript(dashboardStats)
    const serializedFilterOptions = serializeForScript(filterOptions)
    const serializedCurrentFilters = serializeForScript({
      category,
      authority: authority || null,
      sector: sector || null,
      impact: impact || null,
      range: range || null,
      search: search || null
    })

    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Dashboard - AI Regulatory Intelligence</title>
            ${getCommonStyles()}

            <style>
                /* Dashboard Specific Styles */
                .dashboard-header {
                    background: white;
                    padding: 25px;
                    border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    margin-bottom: 30px;
                    border: 1px solid #e5e7eb;
                }
                
                .dashboard-title {
                    font-size: 1.8rem;
                    font-weight: 700;
                    color: #1f2937;
                    margin-bottom: 10px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .dashboard-subtitle {
                    color: #6b7280;
                    font-size: 1rem;
                    margin-bottom: 20px;
                }
                
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }
                
                .stat-card {
                    background: white;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    border: 1px solid #e5e7eb;
                    text-align: center;
                    transition: transform 0.2s;
                }
                
                .stat-card:hover {
                    transform: translateY(-2px);
                }
                
                .stat-number {
                    font-size: 2.2rem;
                    font-weight: 700;
                    color: #1f2937;
                    display: block;
                    margin-bottom: 5px;
                }
                
                .stat-label {
                    color: #6b7280;
                    font-size: 0.9rem;
                    font-weight: 500;
                }
                
                .stat-change {
                    font-size: 0.85rem;
                    margin-top: 6px;
                    font-weight: 600;
                    display: inline-flex;
                    gap: 6px;
                    align-items: center;
                }
                
                .stat-change.positive {
                    color: #16a34a;
                }
                
                .stat-change.negative {
                    color: #dc2626;
                }
                
                .stat-change.neutral {
                    color: #6b7280;
                }
                
                .stat-subtext {
                    font-size: 0.8rem;
                    color: #6b7280;
                    margin-top: 4px;
                }
                
                .controls-panel {
                    background: white;
                    padding: 25px;
                    border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    margin-bottom: 30px;
                    border: 1px solid #e5e7eb;
                }

                .priority-highlights {
                    margin: 30px 0;
                    background: white;
                    border-radius: 16px;
                    border: 1px solid #e5e7eb;
                    padding: 24px;
                    box-shadow: 0 2px 12px rgba(15, 23, 42, 0.08);
                }

                .priority-highlights-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 16px;
                    margin-bottom: 20px;
                }

                .priority-highlights-title {
                    font-size: 1.3rem;
                    font-weight: 600;
                    color: #111827;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .priority-highlights-subtitle {
                    color: #6b7280;
                    font-size: 0.9rem;
                    margin-top: 6px;
                }

                .priority-highlights-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 18px;
                }

                .priority-card {
                    border: 1px solid #e5e7eb;
                    border-radius: 14px;
                    padding: 18px 20px;
                    background: linear-gradient(135deg, rgba(248,250,252,0.9), rgba(255,255,255,0.95));
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.6), 0 12px 25px rgba(15, 23, 42, 0.08);
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                    position: relative;
                }

                .priority-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 18px 35px rgba(79, 70, 229, 0.12);
                }

                .priority-card.reviewed::after {
                    content: 'Reviewed';
                    position: absolute;
                    top: 12px;
                    right: 20px;
                    font-size: 0.7rem;
                    letter-spacing: 0.08em;
                    padding: 3px 8px;
                    border-radius: 999px;
                    background: #e0f2fe;
                    color: #0369a1;
                    text-transform: uppercase;
                }

                .priority-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 12px;
                }

                .priority-card-meta {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .priority-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 4px 10px;
                    border-radius: 999px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    background: #eef2ff;
                    color: #4338ca;
                }

                .priority-badge.high-impact {
                    background: #fee2e2;
                    color: #b91c1c;
                }

                .priority-badge.deadline {
                    background: #fef3c7;
                    color: #b45309;
                }

                .priority-card-title {
                    margin: 12px 0 10px;
                    font-size: 1.05rem;
                    font-weight: 600;
                    color: #111827;
                    line-height: 1.4;
                }

                .priority-card-summary {
                    color: #4b5563;
                    font-size: 0.9rem;
                    line-height: 1.5;
                    min-height: 45px;
                }

                .priority-card-metrics {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px 12px;
                    align-items: center;
                    margin-top: 14px;
                }

                .priority-urgency {
                    font-size: 0.75rem;
                    padding: 4px 10px;
                    border-radius: 999px;
                    background: #f3f4f6;
                    color: #111827;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .priority-urgency.urgency-high {
                    background: #fee2e2;
                    color: #b91c1c;
                }

                .priority-urgency.urgency-medium {
                    background: #fef3c7;
                    color: #92400e;
                }

                .priority-urgency.urgency-low {
                    background: #dcfce7;
                    color: #166534;
                }

                .priority-deadline {
                    font-size: 0.8rem;
                    color: #b91c1c;
                    font-weight: 600;
                }

                .priority-actions {
                    margin-top: 16px;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                }

                .priority-action-btn {
                    border: none;
                    border-radius: 999px;
                    padding: 8px 14px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.2s ease, transform 0.2s ease;
                }

                .priority-action-btn.primary {
                    background: #4f46e5;
                    color: white;
                }

                .priority-action-btn.primary:hover {
                    background: #4338ca;
                }

                .priority-action-btn.secondary {
                    background: #eef2ff;
                    color: #3730a3;
                }

                .priority-action-btn.secondary:hover {
                    background: #e0e7ff;
                }

                .priority-action-btn.muted {
                    background: #f3f4f6;
                    color: #4b5563;
                }

                .priority-action-btn.muted:hover {
                    background: #e5e7eb;
                }

                .priority-toggle {
                    border: none;
                    background: none;
                    color: #4f46e5;
                    font-weight: 600;
                    cursor: pointer;
                    font-size: 0.85rem;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                }

                .priority-card-details {
                    display: none;
                    margin-top: 14px;
                    color: #374151;
                    font-size: 0.9rem;
                    line-height: 1.6;
                }

                .priority-card-details a {
                    color: #4f46e5;
                    font-weight: 600;
                    text-decoration: none;
                }

                .priority-card-details a:hover {
                    text-decoration: underline;
                }

                .priority-card.expanded .priority-card-details {
                    display: block;
                }

                .priority-card.expanded .priority-toggle::after {
                    content: 'Up';
                }

                .priority-toggle::after {
                    content: 'Down';
                    font-size: 0.7rem;
                }

                .impact-gauge {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    min-width: 0;
                }

                .impact-gauge.compact .impact-gauge-label {
                    font-size: 0.75rem;
                }

                .impact-gauge-track {
                    flex: 1;
                    height: 8px;
                    background: #e5e7eb;
                    border-radius: 999px;
                    overflow: hidden;
                    position: relative;
                }

                .impact-gauge-fill {
                    height: 100%;
                    border-radius: 999px;
                    transition: width 0.3s ease;
                }

                .impact-gauge-label {
                    font-size: 0.8rem;
                    color: #4b5563;
                    font-weight: 600;
                    min-width: 40px;
                    text-align: right;
                }

                .impact-gauge.impact-high .impact-gauge-fill {
                    background: linear-gradient(90deg, #dc2626, #f97316);
                }

                .impact-gauge.impact-medium .impact-gauge-fill {
                    background: linear-gradient(90deg, #f59e0b, #facc15);
                }

                .impact-gauge.impact-low .impact-gauge-fill {
                    background: linear-gradient(90deg, #10b981, #34d399);
                }

                .priority-empty {
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 30px;
                    border: 1px dashed #d1d5db;
                    border-radius: 12px;
                    color: #6b7280;
                    background: #f9fafb;
                }

                .impact-gauge-item .impact-gauge {
                    width: 100%;
                }

                .controls-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                    gap: 15px;
                }
                
                .controls-title {
                    font-size: 1.2rem;
                    font-weight: 600;
                    color: #1f2937;
                }
                
                .search-container {
                    position: relative;
                    flex: 1;
                    max-width: 400px;
                    min-width: 250px;
                }
                
                .search-input {
                    width: 100%;
                    padding: 12px 40px 12px 16px;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    transition: border-color 0.2s;
                }
                
                .search-input:focus {
                    outline: none;
                    border-color: #4f46e5;
                }
                
                .search-button {
                    position: absolute;
                    right: 45px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    color: #6b7280;
                    cursor: pointer;
                    padding: 6px;
                    border-radius: 4px;
                    transition: color 0.2s;
                }

                .search-button:hover {
                    color: #4f46e5;
                }

                .save-search-button {
                    position: absolute;
                    right: 8px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    color: #6b7280;
                    cursor: pointer;
                    padding: 6px;
                    border-radius: 4px;
                    transition: all 0.2s;
                    font-size: 14px;
                }

                .save-search-button:hover {
                    color: #059669;
                    background: #f0fdf4;
                }
                
                .filters-row {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 15px;
                    margin-bottom: 20px;
                }
                
                .filter-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                .filter-label {
                    font-size: 0.85rem;
                    font-weight: 500;
                    color: #374151;
                }
                
                .filter-select {
                    padding: 10px 12px;
                    border: 2px solid #e5e7eb;
                    border-radius: 6px;
                    font-size: 0.9rem;
                    background: white;
                    cursor: pointer;
                    transition: border-color 0.2s;
                }
                
                .filter-select:focus {
                    outline: none;
                    border-color: #4f46e5;
                }
                
                .quick-filters {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                    margin-bottom: 15px;
                }
                
                .quick-filter-btn {
                    padding: 8px 16px;
                    border: 2px solid #e5e7eb;
                    background: white;
                    border-radius: 20px;
                    font-size: 0.85rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    color: #374151;
                }
                
                .quick-filter-btn:hover {
                    border-color: #4f46e5;
                    color: #4f46e5;
                }
                
                .quick-filter-btn.active {
                    background: #4f46e5;
                    border-color: #4f46e5;
                    color: white;
                }
                
                .sort-controls {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    margin-top: 15px;
                    padding-top: 15px;
                    border-top: 1px solid #f3f4f6;
                }
                
                .sort-label {
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: #374151;
                }
                
                .sort-buttons {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                
                .sort-btn {
                    padding: 6px 12px;
                    border: 1px solid #d1d5db;
                    background: white;
                    border-radius: 6px;
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    color: #4b5563;
                }
                
                .sort-btn:hover {
                    border-color: #4f46e5;
                    color: #4f46e5;
                }
                
                .sort-btn.active {
                    background: #4f46e5;
                    border-color: #4f46e5;
                    color: white;
                }
                
                .results-info {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                    gap: 10px;
                }
                
                .results-count {
                    color: #6b7280;
                    font-size: 0.9rem;
                }
                
                .view-options {
                    display: flex;
                    gap: 8px;
                }
                
                .view-btn {
                    padding: 6px 10px;
                    border: 1px solid #d1d5db;
                    background: white;
                    border-radius: 4px;
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .view-btn.active {
                    background: #4f46e5;
                    border-color: #4f46e5;
                    color: white;
                }
                
                .updates-container {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    border: 1px solid #e5e7eb;
                    overflow: hidden;
                }
                
                .update-card {
                    padding: 25px;
                    border-bottom: 1px solid #f3f4f6;
                    transition: background-color 0.2s;
                    cursor: pointer;
                }
                
                .update-card:hover {
                    background-color: #f9fafb;
                }
                
                .update-card:last-child {
                    border-bottom: none;
                }
                
                .update-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 15px;
                    gap: 15px;
                }
                
                .update-meta-primary {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex-wrap: wrap;
                }
                
                .authority-badge {
                    background: #4f46e5;
                    color: white;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 0.8rem;
                    font-weight: 600;
                }
                
                .date-badge {
                    background: #f3f4f6;
                    color: #6b7280;
                    padding: 6px 10px;
                    border-radius: 6px;
                    font-size: 0.8rem;
                    font-weight: 500;
                }
                
                .impact-badge {
                    padding: 6px 10px;
                    border-radius: 6px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .impact-badge.significant {
                    background: #fef2f2;
                    color: #dc2626;
                    border: 1px solid #fecaca;
                }
                
                .impact-badge.moderate {
                    background: #fffbeb;
                    color: #d97706;
                    border: 1px solid #fed7aa;
                }
                
                .impact-badge.informational {
                    background: #f0f9ff;
                    color: #0284c7;
                    border: 1px solid #bae6fd;
                }

                .content-type-badge {
                    padding: 6px 10px;
                    border-radius: 6px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .content-type-badge.speech {
                    background: #fef3c7;
                    color: #92400e;
                    border: 1px solid #fcd34d;
                }

                .content-type-badge.consultation {
                    background: #e0e7ff;
                    color: #4338ca;
                    border: 1px solid #a5b4fc;
                }

                .content-type-badge.enforcement {
                    background: #fecaca;
                    color: #dc2626;
                    border: 1px solid #f87171;
                }

                .content-type-badge.guidance {
                    background: #d1fae5;
                    color: #059669;
                    border: 1px solid #6ee7b7;
                }

                .content-type-badge.policy {
                    background: #ddd6fe;
                    color: #7c3aed;
                    border: 1px solid #a78bfa;
                }

                .content-type-badge.regulation {
                    background: #fde68a;
                    color: #d97706;
                    border: 1px solid #fbbf24;
                }

                .content-type-badge.report {
                    background: #f3e8ff;
                    color: #8b5cf6;
                    border: 1px solid #c4b5fd;
                }

                .content-type-badge.news {
                    background: #dbeafe;
                    color: #3b82f6;
                    border: 1px solid #93c5fd;
                }

                .content-type-badge.other {
                    background: #f3f4f6;
                    color: #6b7280;
                    border: 1px solid #d1d5db;
                }
                
                .update-actions {
                    display: flex;
                    gap: 8px;
                    opacity: 0;
                    transition: opacity 0.2s;
                }
                
                .update-card:hover .update-actions {
                    opacity: 1;
                }
                
                .action-btn {
                    padding: 6px;
                    border: 1px solid #d1d5db;
                    background: white;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    transition: all 0.2s;
                    color: #6b7280;
                }
                
                .action-btn:hover {
                    background: #f3f4f6;
                    border-color: #9ca3af;
                }
                
                .update-headline {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: #1f2937;
                    margin-bottom: 12px;
                    line-height: 1.4;
                }
                
                .update-headline a {
                    color: inherit;
                    text-decoration: none;
                    transition: color 0.2s;
                }
                
                .update-headline a:hover {
                    color: #4f46e5;
                }
                
                .update-summary {
                    color: #4b5563;
                    line-height: 1.6;
                    margin-bottom: 15px;
                    font-size: 0.95rem;
                }
                
                .update-details {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-bottom: 15px;
                    padding: 15px;
                    background: #f9fafb;
                    border-radius: 8px;
                }
                
                .detail-item {
                    font-size: 0.85rem;
                }
                
                .detail-label {
                    font-weight: 600;
                    color: #374151;
                    margin-bottom: 3px;
                }
                
                .detail-value {
                    color: #6b7280;
                }
                
                .update-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 15px;
                    flex-wrap: wrap;
                }
                
                .sector-tags {
                    display: flex;
                    gap: 6px;
                    flex-wrap: wrap;
                }
                
                .sector-tag {
                    background: #e0e7ff;
                    color: #4338ca;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .sector-tag:hover {
                    background: #c7d2fe;
                    color: #3730a3;
                }
                
                .ai-features {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                
                .ai-feature {
                    background: #f0f9ff;
                    color: #0c4a6e;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    border: 1px solid #0ea5e9;
                }
                
                .ai-feature.high-impact {
                    background: #fef2f2;
                    color: #991b1b;
                    border-color: #ef4444;
                }
                
                .ai-feature.deadline {
                    background: #fffbeb;
                    color: #92400e;
                    border-color: #f59e0b;
                }
                
                .ai-feature.enforcement {
                    background: #fdf2f8;
                    color: #be185d;
                    border-color: #ec4899;
                }
                
                .no-updates {
                    text-align: center;
                    padding: 60px 20px;
                    color: #6b7280;
                }
                
                .no-updates-icon {
                    font-size: 4rem;
                    margin-bottom: 20px;
                    opacity: 0.5;
                }
                
                .loading-state {
                    text-align: center;
                    padding: 60px 20px;
                    color: #6b7280;
                }
                
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f4f6;
                    border-top: 4px solid #4f46e5;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .error-state {
                    text-align: center;
                    padding: 60px 20px;
                    color: #dc2626;
                }
                
                .error-icon {
                    font-size: 3rem;
                    margin-bottom: 20px;
                }
                
                .btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 6px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    text-decoration: none;
                    display: inline-block;
                    text-align: center;
                }
                
                .btn-primary {
                    background: #4f46e5;
                    color: white;
                }
                
                .btn-primary:hover {
                    background: #4338ca;
                }
                
                .btn-secondary {
                    background: #f3f4f6;
                    color: #374151;
                    border: 1px solid #d1d5db;
                }
                
                .btn-secondary:hover {
                    background: #e5e7eb;
                }
                
                /* Responsive Design */
                @media (max-width: 768px) {
                    .stats-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    
                    .controls-header {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    
                    .search-container {
                        max-width: none;
                    }
                    
                    .filters-row {
                        grid-template-columns: 1fr;
                    }
                    
                    .quick-filters {
                        justify-content: center;
                    }
                    
                    .sort-controls {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 10px;
                    }
                    
                    .update-header {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    
                    .update-meta-primary {
                        justify-content: center;
                    }
                    
                    .update-actions {
                        opacity: 1;
                        justify-content: center;
                    }
                    
                    .update-details {
                        grid-template-columns: 1fr;
                    }
                    
                    .update-footer {
                        flex-direction: column;
                        align-items: stretch;
                    }
                }
            </style>
        </head>
        <body>
            <div class="app-container">
                ${sidebar}
                
                <main class="main-content">
                    <!-- Dashboard Header -->
                    <header class="dashboard-header">
                        <h1 class="dashboard-title">
                            Analytics Regulatory Intelligence Dashboard
                        </h1>
                        <p class="dashboard-subtitle">
                            Real-time regulatory monitoring with AI-powered analysis and business impact intelligence
                        </p>
                        
                        <!-- Dashboard Statistics -->
                        <div class="stats-grid">
                            <div class="stat-card">
                                <span class="stat-number">${dashboardStats.totalUpdates}</span>
                                <span class="stat-label">Total Updates</span>
                                ${formatStatChange(dashboardStats.totalUpdatesDelta, dashboardStats.totalUpdatesDeltaPercent)}
                            </div>
                            <div class="stat-card">
                                <span class="stat-number">${dashboardStats.highImpact}</span>
                                <span class="stat-label">High Impact</span>
                                ${formatStatChange(dashboardStats.highImpactDelta, dashboardStats.highImpactDeltaPercent)}
                            </div>
                            <div class="stat-card">
                                <span class="stat-number">${dashboardStats.aiAnalyzed}</span>
                                <span class="stat-label">AI Analyzed</span>
                                ${formatStatChange(dashboardStats.aiAnalyzedDelta, dashboardStats.aiAnalyzedDeltaPercent)}
                                <div class="stat-subtext">${aiCoverage}% coverage</div>
                            </div>
                            <div class="stat-card">
                                <span class="stat-number">${dashboardStats.activeAuthorities}</span>
                                <span class="stat-label">Active Authorities</span>
                                ${formatStatChange(dashboardStats.activeAuthoritiesDelta, dashboardStats.activeAuthoritiesDeltaPercent)}
                            </div>
                        </div>
                    </header>

                    <section class="priority-highlights">
                        <div class="priority-highlights-header">
                            <div>
                                <h2 class="priority-highlights-title">Power Priority Highlights</h2>
                                <p class="priority-highlights-subtitle">Weekly priorities and high-impact intelligence combined in one actionable view.</p>
                            </div>
                            <div class="stat-change neutral">Updated ${new Date().toLocaleDateString('en-GB')}</div>
                        </div>
                        <div id="priorityHighlights" class="priority-highlights-grid"></div>
                    </section>
                    
                    <!-- Controls Panel -->
                    <section class="controls-panel">
                        <div class="controls-header">
                            <h2 class="controls-title">Filter & Search</h2>
                            <div class="search-container">
                                <input
                                    type="text"
                                    id="search-input"
                                    class="search-input"
                                    placeholder="Search updates, authorities, sectors..."
                                    value="${search || ''}"
                                >
                                <button id="search-button" class="search-button">Search</button>
                                <button id="save-search-button" class="save-search-button" onclick="WorkspaceModule.saveCurrentSearch()" title="Save current search & filters">Save</button>
                            </div>
                        </div>
                        
                        <!-- Quick Filters -->
                        <div class="quick-filters">
                            <button class="quick-filter-btn ${category === 'all' ? 'active' : ''}" data-filter="all" onclick="filterByCategory('all')">
                                All Updates
                            </button>
                            <button class="quick-filter-btn ${category === 'high-impact' ? 'active' : ''}" data-filter="high-impact" onclick="filterByCategory('high-impact')">
                                High Impact
                            </button>
                            <button class="quick-filter-btn ${category === 'this-week' ? 'active' : ''}" data-filter="this-week" onclick="filterByCategory('this-week')">
                                This Week
                            </button>
                            <button class="quick-filter-btn ${category === 'consultations' ? 'active' : ''}" data-filter="consultations" onclick="filterByCategory('consultations')">
                                Consultations
                            </button>
                            <button class="quick-filter-btn ${category === 'enforcement' ? 'active' : ''}" data-filter="enforcement" onclick="filterByCategory('enforcement')">
                                Enforcement
                            </button>
                            <button class="quick-filter-btn ${category === 'deadlines' ? 'active' : ''}" data-filter="deadlines" onclick="filterByCategory('deadlines')">
                                Deadlines
                            </button>
                        </div>
                        
                        <!-- Advanced Filters -->
                        <div class="filters-row">
                            <div class="filter-group">
                                <label class="filter-label">Authority</label>
                                <select class="filter-select" onchange="filterByAuthority(this.value)">
                                    <option value="">All Authorities</option>
                                    ${generateAuthorityOptions(filterOptions.authorities, authority)}
                                </select>
                            </div>
                            
                            <div class="filter-group">
                                <label class="filter-label">Sector</label>
                                <select class="filter-select" onchange="filterBySector(this.value)">
                                    <option value="">All Sectors</option>
                                    ${generateSectorOptions(filterOptions.sectors, sector)}
                                </select>
                            </div>
                            
                            <div class="filter-group">
                                <label class="filter-label">Impact Level</label>
                                <select class="filter-select" onchange="filterByImpactLevel(this.value)">
                                    <option value="">All Impact Levels</option>
                                    <option value="Significant" ${impact === 'Significant' ? 'selected' : ''}>Significant</option>
                                    <option value="Moderate" ${impact === 'Moderate' ? 'selected' : ''}>Moderate</option>
                                    <option value="Informational" ${impact === 'Informational' ? 'selected' : ''}>Informational</option>
                                </select>
                            </div>
                            
                            <div class="filter-group">
                                <label class="filter-label">Date Range</label>
                                <select class="filter-select" onchange="filterByDateRange(this.value)">
                                    <option value="">All Time</option>
                                    <option value="today" ${range === 'today' ? 'selected' : ''}>Today</option>
                                    <option value="week" ${range === 'week' ? 'selected' : ''}>This Week</option>
                                    <option value="month" ${range === 'month' ? 'selected' : ''}>This Month</option>
                                    <option value="quarter" ${range === 'quarter' ? 'selected' : ''}>This Quarter</option>
                                </select>
                            </div>
                        </div>
                        
                        <!-- Sort Controls -->
                        <div class="sort-controls">
                            <span class="sort-label">Sort by:</span>
                            <div class="sort-buttons">
                                <button class="sort-btn active" data-sort="newest" onclick="sortUpdates('newest')">
                                    Newest First
                                </button>
                                <button class="sort-btn" data-sort="impact" onclick="sortUpdates('impact')">
                                    Impact Score
                                </button>
                                <button class="sort-btn" data-sort="authority" onclick="sortUpdates('authority')">
                                    Authority
                                </button>
                                <button class="sort-btn" data-sort="sector" onclick="sortUpdates('sector')">
                                    Sector
                                </button>
                            </div>
                        </div>
                    </section>
                    
                    <!-- Search Results Info -->
                    <div id="search-results" style="display: none;"></div>
                    
                    <!-- Results Info -->
                    <div class="results-info">
                        <span class="results-count">
                            Showing <span id="results-count">${updates.length}</span> updates
                        </span>
                        <div class="view-options">
                            <button class="view-btn active" data-view="cards">Note Cards</button>
                            <button class="view-btn" data-view="table">Analytics Table</button>
                            <button class="view-btn" data-view="timeline">Clock Timeline</button>
                        </div>
                    </div>
                    
                    <!-- Updates Container -->
                    <div class="updates-container" id="updates-container">
                        ${generateUpdatesHTML(updates)}
                    </div>
                    
                    <!-- Load More Button -->
                    <div style="text-align: center; margin-top: 30px;">
                        <button class="btn btn-secondary" onclick="loadMoreUpdates()">
                            Load More Updates
                        </button>
                    </div>
                </main>
            </div>
            
            <!-- Initialize with data and lightweight stubs before main client scripts load -->
            <script>
                // Pass server-side data to client
                window.initialUpdates = ${serializedInitialUpdates};
                window.dashboardStats = ${serializedDashboardStats};
                window.filterOptions = ${serializedFilterOptions};
                window.currentFilters = ${serializedCurrentFilters};

                window.FilterModule = window.FilterModule || {};
                if (typeof window.FilterModule.getCurrentFilters !== 'function') {
                    window.FilterModule.getCurrentFilters = function() {
                        return {
                            category: window.currentFilters.category,
                            authority: window.currentFilters.authority || null,
                            sector: window.currentFilters.sector || null,
                            impact: window.currentFilters.impact || null,
                            urgency: window.currentFilters.urgency || null,
                            range: window.currentFilters.range || null,
                            search: window.currentFilters.search || null,
                            sort: window.currentFilters.sort || 'newest'
                        };
                    };
                }

                (function setupFilterStubs() {
                    const pendingCalls = window.__pendingFilterCalls = window.__pendingFilterCalls || [];

                    function invokeWhenReady(method, args) {
                        const module = window.FilterModule;
                        const target = module && typeof module[method] === 'function'
                            ? module[method]
                            : null;

                        if (target) {
                            target.apply(module, args);
                            return;
                        }

                        pendingCalls.push({ method, args });
                    }

                    const methodNames = [
                        'filterByCategory',
                        'filterByAuthority',
                        'filterBySector',
                        'filterByImpactLevel',
                        'filterByDateRange',
                        'filterByUrgency',
                        'sortUpdates',
                        'loadMoreUpdates',
                        'clearAllFilters',
                        'clearFilters',
                        'applyActiveFilters',
                        'applyFilters'
                    ];

                    function promoteMethod(method) {
                        if (typeof window.FilterModule === 'object' && typeof window.FilterModule[method] === 'function') {
                            window[method] = window.FilterModule[method];
                        }
                    }

                    methodNames.forEach(method => {
                        if (typeof window[method] !== 'function' || window[method].__isFilterStub) {
                            const wrapper = function(...args) {
                                invokeWhenReady(method, args);
                            };
                            wrapper.__isFilterStub = true;
                            window[method] = wrapper;
                        }
                    });

                    async function flushFilterQueue() {
                        if (!window.FilterModule) return;

                        let executed = false;
                        let safety = pendingCalls.length + 5;

                        while (pendingCalls.length && safety > 0) {
                            safety -= 1;
                            const call = pendingCalls.shift();
                            const target = window.FilterModule && typeof window.FilterModule[call.method] === 'function'
                                ? window.FilterModule[call.method]
                                : null;

                            if (target) {
                                try {
                                    const result = target.apply(window.FilterModule, call.args);
                                    if (result && typeof result.then === 'function') {
                                        await result;
                                    }
                                    executed = true;
                                } catch (error) {
                                    console.error('Error executing queued filter call:', error);
                                }
                            } else {
                                pendingCalls.push(call);
                                break;
                            }
                        }

                        if (executed) {
                            methodNames.forEach(promoteMethod);
                        }
                    }

                    window.__flushFilterQueue = flushFilterQueue;
                    window.addEventListener('dashboard:filters-ready', () => {
                        flushFilterQueue();
                    });
                })();

                // Client-side helper functions for Cards view
                function getImpactBadge(update) {
                    const level = update.impactLevel || update.impact_level || 'Informational';
                    let badgeClass = 'low';
                    if (level === 'Significant') {
                        badgeClass = 'urgent';
                    } else if (level === 'Moderate') {
                        badgeClass = 'moderate';
                    }
                    return '<span class="impact-badge ' + badgeClass + '">' + level + '</span>';
                }

                function getContentTypeBadge(update) {
                    const contentType = update.content_type || 'OTHER';
                    const badgeClass = contentType.toLowerCase();
                    const badgeText = contentType === 'OTHER' ? 'INFO' : contentType;
                    return '<span class="content-type-badge ' + badgeClass + '">' + badgeText + '</span>';
                }

                function getSectorTags(update) {
                    // Try various sector field names first
                    let sectors = update.firm_types_affected || update.primarySectors || (update.sector ? [update.sector] : []);

                    // If no sector data, use authority as fallback sector tag
                    if (!sectors || sectors.length === 0) {
                        if (update.authority) {
                            sectors = [update.authority];
                        } else {
                            sectors = [];
                        }
                    }

                    return sectors.slice(0, 3).map(sector => {
                        const value = String(sector ?? '').trim();
                        const label = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                        return '<span class="sector-tag" data-sector="' + label + '">' + label + '</span>';
                    }).join('');
                }

                function getAIFeatures(update) {
                    const features = [];

                    // Primary AI features (if available)
                    if (update.business_impact_score && update.business_impact_score >= 7) {
                        features.push('<span class="ai-feature high-impact">Hot High Impact (' + update.business_impact_score + '/10)</span>');
                    }

                    if (update.urgency === 'High') {
                        features.push('<span class="ai-feature urgent">Alert Urgent</span>');
                    }

                    if (update.ai_tags && update.ai_tags.includes('has:penalty')) {
                        features.push('<span class="ai-feature enforcement">Alert Enforcement Action</span>');
                    }

                    if (update.ai_confidence_score && update.ai_confidence_score >= 0.9) {
                        features.push('<span class="ai-feature high-confidence">AI High Confidence (' + Math.round(update.ai_confidence_score * 100) + '%)</span>');
                    }

                    // Fallback features based on available data
                    if (features.length === 0) {
                        // Check if headline/summary contains enforcement keywords
                        const text = (update.headline + ' ' + (update.summary || update.ai_summary || '')).toLowerCase();

                        if (text.includes('fine') || text.includes('penalty') || text.includes('enforcement') || text.includes('breach')) {
                            features.push('<span class="ai-feature enforcement">Law Enforcement</span>');
                        }

                        if (text.includes('consultation') || text.includes('draft') || text.includes('guidance')) {
                            features.push('<span class="ai-feature guidance">Note Guidance</span>');
                        }

                        if (text.includes('deadline') || text.includes('compliance') || text.includes('must')) {
                            features.push('<span class="ai-feature deadline">Date Action Required</span>');
                        }

                        // Show authority as a feature if no other features found
                        if (features.length === 0 && update.authority) {
                            features.push('<span class="ai-feature authority">Authority ' + update.authority + '</span>');
                        }
                    }

                    return features.join('');
                }
            </script>
            
            ${getClientScripts()}
            
            <!-- Initialize after scripts load -->
            <script>
                // Wait for all scripts to be loaded before calling functions
                document.addEventListener('DOMContentLoaded', function() {
                    console.log('DOM loaded, initializing...');
                    
                    // Check if functions exist before calling
                    if (typeof initializeSystem === 'function') {
                        initializeSystem();
                    } else if (typeof updateLiveCounters === 'function') {
                        // Fallback if initializeSystem doesn't exist
                        updateLiveCounters();
                        setInterval(updateLiveCounters, 30000);
                    }
                    
                    // Ensure filter functions are properly assigned
                    if (typeof window.FilterModule !== 'undefined') {
                        window.filterByCategory = window.FilterModule.filterByCategory || window.filterByCategory;
                        window.filterByAuthority = window.FilterModule.filterByAuthority || window.filterByAuthority;
                        window.filterBySector = window.FilterModule.filterBySector || window.filterBySector;
                        window.filterByImpactLevel = window.FilterModule.filterByImpactLevel || window.filterByImpactLevel;
                        window.filterByDateRange = window.FilterModule.filterByDateRange || window.filterByDateRange;
                        window.sortUpdates = window.FilterModule.sortUpdates || window.sortUpdates;
                        window.loadMoreUpdates = window.FilterModule.loadMoreUpdates || window.loadMoreUpdates;
                        window.clearAllFilters = window.FilterModule.clearAllFilters || window.clearAllFilters;
                    }
                });
                
                // Also add a safety check for immediate calls
                if (typeof updateLiveCounters === 'undefined') {
                    window.updateLiveCounters = function() {
                        console.log('updateLiveCounters stub - waiting for real function...');
                    };
                }
            </script>
        </body>
        </html>`

    res.send(html)
  } catch (error) {
    console.error('X Error rendering dashboard page:', error)
    res.status(500).send(`
            <html>
                <head><title>Error - Dashboard</title></head>
                <body style="font-family: Arial; text-align: center; padding: 50px;">
                    <h1>Warning Dashboard Error</h1>
                    <p>Unable to load the dashboard. Please try refreshing.</p>
                    <p><a href="/dashboard"><- Try Again</a></p>
                    <small>Error: ${error.message}</small>
                </body>
            </html>
        `)
  }
}

async function getDashboardStatistics() {
  try {
    const stats = await dbService.getDashboardStatistics()
    return {
      totalUpdates: stats.totalUpdates || 0,
      highImpact: stats.highImpact || 0,
      aiAnalyzed: stats.aiAnalyzed || 0,
      activeAuthorities: stats.activeAuthorities || 0,
      newToday: stats.newToday || 0,
      newAuthorities: stats.newAuthorities || 0,
      impactTrend: stats.impactTrend || 'stable',
      impactChange: stats.impactChange || 0
    }
  } catch (error) {
    console.error('Error getting dashboard statistics:', error)
    return {
      totalUpdates: 0,
      highImpact: 0,
      aiAnalyzed: 0,
      activeAuthorities: 0,
      newToday: 0,
      newAuthorities: 0,
      impactTrend: 'stable',
      impactChange: 0
    }
  }
}

async function getFilterOptions() {
  try {
    const options = await dbService.getFilterOptions()
    return {
      authorities: options.authorities || [],
      sectors: options.sectors || []
    }
  } catch (error) {
    console.error('Error getting filter options:', error)
    return {
      authorities: [],
      sectors: []
    }
  }
}

function generateAuthorityOptions(authorities, selectedAuthority) {
  return authorities.map(auth =>
        `<option value="${auth.name}" ${auth.name === selectedAuthority ? 'selected' : ''}>
            ${auth.name} (${auth.count})
        </option>`
  ).join('')
}

function generateSectorOptions(sectors, selectedSector) {
  return sectors.map(sector =>
        `<option value="${sector.name}" ${sector.name === selectedSector ? 'selected' : ''}>
            ${sector.name} (${sector.count})
        </option>`
  ).join('')
}

function generateUpdatesHTML(updates) {
  if (!updates || updates.length === 0) {
    return `
            <div class="no-updates">
                <div class="no-updates-icon">Inbox</div>
                <h3>No updates found</h3>
                <p>Try adjusting your filters or search criteria.</p>
                <button onclick="clearAllFilters()" class="btn btn-secondary">Clear All Filters</button>
            </div>
        `
  }

  return updates.map(update => generateUpdateCard(update)).join('')
}

function generateUpdateCard(update) {
  const impactLevel = update.impactLevel || update.impact_level || 'Informational'
  const urgency = update.urgency || 'Low'
  const publishedAt = getDateValue(update.publishedDate || update.published_date || update.fetchedDate || update.createdAt)
  const publishedDate = formatDate(publishedAt || new Date())
  const isoDate = publishedAt ? publishedAt.toISOString() : ''
  const impactBadge = getImpactBadge(update)
  const contentTypeBadge = getContentTypeBadge(update)
  const sectorTags = getSectorTags(update)
  const aiFeatures = getAIFeatures(update)

  const aiSummary = update.ai_summary ? update.ai_summary.trim() : ''
  const useFallbackSummary = isFallbackSummary(aiSummary)
  const summaryText = !useFallbackSummary && aiSummary
    ? aiSummary
    : (update.summary && update.summary.trim() ? update.summary.trim() : '')

  return `
        <div 
            class="update-card" 
            data-id="${update.id || ''}"
            data-url="${update.url || ''}"
            data-authority="${update.authority || ''}"
            data-impact="${impactLevel}"
            data-urgency="${urgency}"
            data-date="${isoDate}"
        >
            <div class="update-header">
                <div class="update-meta-primary">
                    <span class="authority-badge">${update.authority}</span>
                    <span class="date-badge">${publishedDate}</span>
                    ${contentTypeBadge}
                    ${impactBadge}
                </div>
                <div class="update-actions">
                    <button onclick="bookmarkUpdate('${String(update.id || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r')}')" class="action-btn" title="Bookmark">Star</button>
                    <button onclick="shareUpdate('${String(update.id || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r')}')" class="action-btn" title="Share">Link</button>
                    <button onclick="viewDetails('${String(update.id || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r')}')" class="action-btn" title="Details">View</button>
                </div>
            </div>
            
            <h3 class="update-headline">
                <a href="${update.url}" target="_blank" rel="noopener">${update.headline}</a>
            </h3>
            
            <div class="update-summary">
                ${summaryText || 'No summary available'}
            </div>
            
            <div class="update-details">
                <div class="detail-item">
                    <div class="detail-label">Regulatory Area</div>
                    <div class="detail-value">${update.area || 'General'}</div>
                </div>
                
                ${update.business_impact_score
? `
                <div class="detail-item">
                    <div class="detail-label">Impact Score</div>
                    <div class="detail-value">${update.business_impact_score}/10</div>
                </div>
                `
: ''}
                
                ${update.urgency
? `
                <div class="detail-item">
                    <div class="detail-label">Urgency</div>
                    <div class="detail-value">${update.urgency}</div>
                </div>
                `
: ''}
                
                ${update.keyDates
? `
                <div class="detail-item">
                    <div class="detail-label">Key Dates</div>
                    <div class="detail-value">${update.keyDates}</div>
                </div>
                `
: ''}
                
                ${update.compliance_deadline
? `
                <div class="detail-item">
                    <div class="detail-label">Compliance Deadline</div>
                    <div class="detail-value">${formatDate(update.compliance_deadline || update.complianceDeadline)}</div>
                </div>
                `
: ''}
                
                ${update.complianceActions
? `
                <div class="detail-item">
                    <div class="detail-label">Required Actions</div>
                    <div class="detail-value">${update.complianceActions}</div>
                </div>
                `
: ''}
            </div>
            
            <div class="update-footer">
                <div class="sector-tags">
                    ${sectorTags}
                </div>
                <div class="ai-features">
                    ${aiFeatures}
                </div>
            </div>
        </div>
    `
}

function getContentTypeBadge(update) {
  const contentType = update.content_type || 'OTHER'
  const badgeClass = contentType.toLowerCase()
  const badgeText = contentType === 'OTHER' ? 'INFO' : contentType

  return `<span class="content-type-badge ${badgeClass}">${badgeText}</span>`
}

function getImpactBadge(update) {
  const level = update.impactLevel || update.impact_level || 'Informational'

  // Map impact levels to proper CSS classes
  let badgeClass = 'low' // default
  if (level === 'Significant') {
    badgeClass = 'urgent'
  } else if (level === 'Moderate') {
    badgeClass = 'moderate'
  }

  // Just show the impact level, not the score
  return `<span class="impact-badge ${badgeClass}">${level}</span>`
}

function getSectorTags(update) {
  const sectors = update.firm_types_affected || update.primarySectors || (update.sector ? [update.sector] : [])

  return sectors.slice(0, 3).map(sector => {
    const value = String(sector ?? '').trim()
    const label = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return `<span class="sector-tag" data-sector="${label}">${label}</span>`
  }).join('')
}

function getAIFeatures(update) {
  const features = []

  if (update.business_impact_score && update.business_impact_score >= 7) {
    features.push(`<span class="ai-feature high-impact">Hot High Impact (${update.business_impact_score}/10)</span>`)
  }

  const complianceDeadline = getDateValue(update.compliance_deadline || update.complianceDeadline)
  if (complianceDeadline) {
    const deadline = complianceDeadline
    const daysUntil = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24))
    if (daysUntil <= 30 && daysUntil > 0) {
      features.push(`<span class="ai-feature deadline">Clock Deadline in ${daysUntil} days</span>`)
    }
  }

  if (update.ai_tags && update.ai_tags.includes('has:penalty')) {
    features.push('<span class="ai-feature enforcement">Alert Enforcement Action</span>')
  }

  if (update.ai_confidence_score && update.ai_confidence_score >= 0.9) {
    features.push(`<span class="ai-feature high-confidence">AI High Confidence (${Math.round(update.ai_confidence_score * 100)}%)</span>`)
  }

  if (update.urgency === 'High') {
    features.push('<span class="ai-feature urgent">Alert Urgent</span>')
  }

  return features.join('')
}

function getDateValue(rawValue) {
  if (!rawValue) return null
  if (rawValue instanceof Date) {
    return isNaN(rawValue) ? null : rawValue
  }
  const parsed = new Date(rawValue)
  return isNaN(parsed) ? null : parsed
}

function truncateText(text, maxLength = 200) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return `${text.substring(0, maxLength).trim()}...`
}

function isFallbackSummary(summary) {
  if (!summary) return true
  const normalized = summary.toLowerCase()
  return normalized.startsWith('informational regulatory update:') ||
        normalized.startsWith('significant regulatory development') ||
        normalized.startsWith('regulatory update:') ||
        normalized.startsWith('regulatory impact overview:')
}

function formatDate(dateValue) {
  const date = getDateValue(dateValue)
  if (!date) return 'Unknown'

  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 1) return 'Today'
  if (diffDays === 2) return 'Yesterday'
  if (diffDays <= 7) return `${diffDays - 1} days ago`

  return date.toLocaleDateString('en-UK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

module.exports = {
  renderDashboardPage,
  formatDate,
  getDateValue,
  truncateText,
  isFallbackSummary,
  serializeForScript
}
