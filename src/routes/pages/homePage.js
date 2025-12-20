// Fixed Home Page - Phase 1
// File: src/routes/pages/homePage.js

const { getSidebar } = require('../templates/sidebar')
const { getClientScripts } = require('../templates/clientScripts')
const { getCommonStyles } = require('../templates/commonStyles')
const dbService = require('../../services/dbService')
const firmPersonaService = require('../../services/firmPersonaService')
const { Pool } = require('pg')
const { renderCalendarWidget } = require('../../views/calendar/widget')
const { getCalendarWidgetStyles } = require('../../views/calendar/styles')
const calendarService = require('../../services/calendarService')

async function renderHomePage(req, res) {
  try {
    console.log('Home Rendering enhanced home page...')

    // Get user and persona for sidebar
    const user = req.user && req.isAuthenticated ? req.user : null
    const persona = user ? await firmPersonaService.getUserPersona(user.id).catch(() => null) : null

    // Get recent updates for home page preview (get more for charts)
    let recentUpdates = await dbService.getRecentUpdates(50)

    // Apply persona filtering if available
    if (persona) {
      recentUpdates = firmPersonaService.applyPersonaFilter(recentUpdates, persona)
    }

    // Get AI insights for home page highlights
    const aiInsights = (dbService.getRecentAIInsights && typeof dbService.getRecentAIInsights === 'function')
      ? await dbService.getRecentAIInsights(5)
      : []

    // Get system statistics
    const systemStats = await getSystemStatistics()

    // Get top fines this year
    const topFines = await getTopFinesThisYear()

    // Get upcoming calendar events for widget
    const upcomingEvents = await calendarService.getUpcomingEvents(30, 7).catch(err => {
      console.error('Error fetching calendar events:', err)
      return []
    })

    // Generate sidebar
    const sidebar = await getSidebar('home', { user, persona })

    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>RegCanary - Regulatory Intelligence Platform</title>
            ${getCommonStyles()}
            <style>
                .home-dashboard { background: #f5f7fb; min-height: 100vh; padding: 32px 40px; }
                .priority-panel {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 18px;
                    padding: 22px 24px;
                    box-shadow: 0 16px 32px -18px rgba(15, 23, 42, 0.28);
                    display: grid;
                    grid-template-columns: 1.3fr 0.7fr;
                    gap: 18px;
                    align-items: center;
                    margin-bottom: 24px;
                }
                .priority-primary h3 {
                    margin: 8px 0 6px;
                    font-size: 1.25rem;
                    letter-spacing: -0.01em;
                    color: #0f172a;
                }
                .priority-lead { display: inline-flex; align-items: center; gap: 10px; padding: 6px 12px; border-radius: 999px; background: #fef2f2; color: #b91c1c; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; font-size: 0.78rem; }
                .priority-summary { color: #475569; margin: 0 0 12px; line-height: 1.5; }
                .priority-meta { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }
                .pill { padding: 6px 10px; border-radius: 10px; border: 1px solid #e2e8f0; background: #f8fafc; font-size: 0.82rem; font-weight: 600; color: #0f172a; }
                .pill.impact-significant { background: #fef2f2; color: #b91c1c; border-color: #fecdd3; }
                .pill.impact-moderate { background: #fffbeb; color: #b45309; border-color: #fcd34d; }
                .pill.impact-informational { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
                .pill.urgency-high { background: #fef2f2; color: #c2410c; border-color: #fed7aa; }
                .priority-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
                .primary-chip, .ghost-chip { display: inline-flex; align-items: center; gap: 8px; padding: 9px 14px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 0.92rem; border: 1px solid transparent; transition: transform 0.2s ease, box-shadow 0.2s ease; }
                .primary-chip { background: linear-gradient(135deg, #dc2626, #ef4444); color: #0f172a; box-shadow: 0 12px 26px rgba(239, 68, 68, 0.25); }
                .primary-chip:hover { transform: translateY(-1px); box-shadow: 0 16px 30px rgba(239, 68, 68, 0.32); }
                .ghost-chip { background: #f8fafc; border-color: #e2e8f0; color: #0f172a; }
                .ghost-chip:hover { transform: translateY(-1px); box-shadow: 0 10px 20px rgba(15, 23, 42, 0.12); }
                .priority-side { background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%); border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }
                .heat-label { font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.08em; color: #475569; font-weight: 700; }
                .heat-pill { display: inline-flex; align-items: center; gap: 8px; border-radius: 999px; padding: 7px 12px; font-weight: 700; width: fit-content; }
                .heat-pill.high { background: #fef2f2; color: #b91c1c; border: 1px solid #fecdd3; }
                .heat-pill.moderate { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }
                .heat-pill.low { background: #ecfdf3; color: #15803d; border: 1px solid #bbf7d0; }
                .heat-meta { color: #475569; font-size: 0.9rem; }
                .for-you-panel { margin: 0 0 32px; }
                .for-you-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; }
                .for-you-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 16px; box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06); display: flex; flex-direction: column; gap: 6px; }
                .for-you-title { font-weight: 600; color: #0f172a; font-size: 1rem; }
                .for-you-meta { display: flex; gap: 8px; flex-wrap: wrap; color: #475569; font-size: 0.85rem; }
                .for-you-actions { display: flex; gap: 10px; margin-top: 6px; flex-wrap: wrap; }
                .status-banner {
                    background: #ffffff;
                    color: #0f172a;
                    border-radius: 18px;
                    padding: 28px 32px;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 24px 48px -28px rgba(15, 23, 42, 0.25);
                    margin-bottom: 40px;
                    display: flex;
                    flex-direction: column;
                    gap: 28px;
                }
                
                .status-title { display: flex; align-items: center; gap: 16px; background: transparent; }
                .status-header { display: flex; justify-content: space-between; align-items: center; gap: 20px; flex-wrap: wrap; }
                .status-info { background: transparent; }
                .status-info h1 { margin: 0; font-size: 1.95rem; font-weight: 700; letter-spacing: -0.01em; color: #0f172a; }
                .status-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: #f1f5ff; color: #1d4ed8; border: 1px solid rgba(147, 197, 253, 0.5); }
                .status-icon svg { width: 22px; height: 22px; stroke: currentColor; stroke-width: 1.5; fill: none; stroke-linecap: round; stroke-linejoin: round; }
                .status-icon-3d { width: 60px; height: 60px; background: linear-gradient(145deg, #fffbeb 0%, #fef3c7 100%); border: 2px solid rgba(251, 191, 36, 0.4); box-shadow: 0 6px 20px rgba(218, 165, 32, 0.25), inset 0 1px 0 rgba(255,255,255,0.5); align-self: flex-start; margin-top: 0; }
                .status-icon-3d svg { width: 44px; height: 50px; stroke: none; fill: none; }
                .canary-icon-animated { filter: drop-shadow(0 3px 6px rgba(218, 165, 32, 0.35)); }
                .canary-body { animation: canaryBreathe 2s ease-in-out infinite; transform-origin: center; }
                .canary-wing { animation: wingFlap 0.8s ease-in-out infinite; transform-origin: 70% 50%; }
                .canary-head { animation: headBob 2.5s ease-in-out infinite; transform-origin: center bottom; }
                .canary-eye { animation: eyeBlink 4s ease-in-out infinite; }
                .shield-glow { animation: shieldPulse 3s ease-in-out infinite; }
                @keyframes canaryBreathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } }
                @keyframes wingFlap { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-8deg); } 75% { transform: rotate(5deg); } }
                @keyframes headBob { 0%, 100% { transform: translateY(0) rotate(0deg); } 30% { transform: translateY(-1px) rotate(2deg); } 70% { transform: translateY(0.5px) rotate(-1deg); } }
                @keyframes eyeBlink { 0%, 45%, 55%, 100% { transform: scaleY(1); } 50% { transform: scaleY(0.1); } }
                @keyframes shieldPulse { 0%, 100% { opacity: 0.6; filter: blur(3px); } 50% { opacity: 0.9; filter: blur(5px); } }
                .status-meta-grid { margin-top: 12px; display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 18px; }
                .status-meta-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 18px; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06); }
                .status-meta-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; font-weight: 600; }
                .status-meta-value { font-size: 1.18rem; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 8px; }
                .status-meta-value .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #16a34a; box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.18); }

                .status-subtitle { margin-top: 4px; font-size: 0.98rem; max-width: 520px; color: #475569; line-height: 1.6; }
                                                .status-actions { display: flex; align-items: center; gap: 12px; }
                .primary-action, .secondary-action { border-radius: 999px; padding: 12px 20px; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; transition: transform 0.2s ease, box-shadow 0.2s ease; }
                .primary-action { background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%); color: #0f172a; box-shadow: 0 14px 24px rgba(96, 165, 250, 0.25); border: 1px solid #bfdbfe; }
                .primary-action:hover { transform: translateY(-2px); box-shadow: 0 16px 30px rgba(96, 165, 250, 0.32); }
                .secondary-action { background: rgba(37, 99, 235, 0.05); color: #1d4ed8; border: 1px solid rgba(148, 163, 184, 0.4); box-shadow: none; }
                .secondary-action:hover { transform: translateY(-2px); box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12); }
                .insights-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; margin-top: 12px; margin-bottom: 32px; }
                .insight-card { background: #ffffff; border-radius: 14px; padding: 20px 22px; border: 1px solid #e2e8f0; box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05); }
                .insight-label { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; background: #e0e7ff; color: #1e3a8a; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
                .insight-headline { margin: 14px 0 8px; font-size: 1.15rem; font-weight: 600; color: #0f172a; letter-spacing: -0.01em; }
                .insight-body { color: #4b5563; line-height: 1.55; font-size: 0.95rem; }
                .insight-meta { margin-top: 12px; font-size: 0.8rem; color: #6b7280; }
                .quick-nav { margin: 32px 0 12px; display: flex; flex-wrap: wrap; gap: 12px; }
                .quick-chip { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 999px; padding: 10px 16px; display: inline-flex; align-items: center; gap: 10px; text-decoration: none; color: #1f2937; font-weight: 500; transition: all 0.2s ease; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05); }
                .quick-chip:hover { border-color: #1e3a8a; color: #1e3a8a; box-shadow: 0 10px 20px rgba(15, 23, 42, 0.12); transform: translateY(-2px); }
                .quick-chip-icon { width: 1.6rem; height: 1.6rem; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; background: #eef2ff; color: #1e3a8a; transition: background-color 0.2s ease, color 0.2s ease; }
                .quick-chip-icon svg { width: 1rem; height: 1rem; }
                .quick-chip-icon svg * { stroke: currentColor; stroke-width: 1.6; fill: none; stroke-linecap: round; stroke-linejoin: round; }
                .quick-chip:hover .quick-chip-icon { background: #1e3a8a; color: #ffffff; }
                .chip-label { font-size: 0.9rem; display: block; }
                .chip-meta { font-size: 0.75rem; color: #6b7280; display: block; }
                .module-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; margin-top: 32px; margin-bottom: 32px; }
                .module-card { background: #ffffff; border-radius: 18px; padding: 24px 26px 28px; border: 1px solid #e2e8f0; box-shadow: 0 16px 34px rgba(15, 23, 42, 0.07); transition: transform 0.2s ease, box-shadow 0.2s ease; }
                .module-label { display: inline-flex; align-items: center; gap: 6px; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; color: #1e3a8a; font-weight: 600; margin-bottom: 8px; }
                .module-card:hover { transform: translateY(-4px); box-shadow: 0 22px 42px rgba(15, 23, 42, 0.12); border-color: rgba(37, 99, 235, 0.28); }
                .module-icon { width: 42px; height: 42px; border-radius: 12px; background: linear-gradient(135deg, rgba(37, 99, 235, 0.16), rgba(29, 78, 216, 0.05)); color: #1d4ed8; display: flex; align-items: center; justify-content: center; margin-bottom: 18px; }
                .module-icon svg { width: 22px; height: 22px; stroke-linecap: round; stroke-linejoin: round; }
                .module-title { margin: 0; font-size: 1.2rem; font-weight: 600; color: #0f172a; }
                .module-metric { font-size: 2rem; font-weight: 700; margin: 16px 0 4px; color: #1e293b; letter-spacing: -0.02em; }
                .module-stat-label { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.07em; color: #64748b; font-weight: 600; }
                .module-description { color: #475569; font-size: 0.95rem; line-height: 1.55; margin: 14px 0 18px; }
                .module-link { display: inline-flex; align-items: center; gap: 6px; color: #1e40af; font-weight: 600; text-decoration: none; font-size: 0.9rem; }
                .module-link:hover { transform: translateX(2px); }
                .updates-panel { background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 24px 26px; box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06); }
                .panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
                .panel-title { font-size: 1.25rem; font-weight: 600; color: #0f172a; }
                .panel-link { color: #1e40af; text-decoration: none; font-weight: 600; font-size: 0.9rem; display: inline-flex; align-items: center; gap: 4px; }
                .panel-link:hover { transform: translateX(3px); }
                .update-list { list-style: none; margin: 0; padding: 0; }
                .update-item { display: flex; align-items: center; padding: 14px 0; border-bottom: 1px solid #edf2f7; transition: background 0.2s ease, transform 0.2s ease; border-radius: 10px; }
                .update-item:hover { background: #f8fafc; transform: translateY(-1px); padding-left: 12px; padding-right: 12px; }
                .update-item:last-child { border-bottom: none; }
                .update-badge { background: #e0e7ff; color: #3730a3; padding: 5px 12px; border-radius: 999px; font-size: 0.78rem; font-weight: 600; margin-right: 16px; }
                .update-copy { flex: 1; min-width: 0; }
                .update-headline { font-weight: 600; color: #0f172a; margin-bottom: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .update-headline a { color: inherit; text-decoration: none; }
                .update-headline a:hover { text-decoration: underline; }
                .update-meta { display: flex; flex-wrap: wrap; gap: 12px; font-size: 0.8rem; color: #64748b; }
                .footer-note { margin-top: 32px; text-align: center; color: #64748b; font-size: 0.85rem; }
                .footer-note a { color: #1e40af; text-decoration: none; font-weight: 600; }
                .footer-note a:hover { text-decoration: underline; }
                /* Widgets Row */
                .widgets-row { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }

                /* Quick Actions Widget */
                .quick-actions-widget {
                  background: white;
                  border-radius: 12px;
                  border: 1px solid #e2e8f0;
                  overflow: hidden;
                  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
                  display: flex;
                  flex-direction: column;
                }
                .quick-actions-header {
                  padding: 10px 14px;
                  border-bottom: 1px solid #f1f5f9;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                }
                .quick-actions-title {
                  font-size: 0.85rem;
                  font-weight: 600;
                  color: #0f172a;
                  display: flex;
                  align-items: center;
                  gap: 6px;
                }
                .quick-actions-title svg { width: 14px; height: 14px; color: #f59e0b; }
                .quick-actions-link { font-size: 0.72rem; color: #3b82f6; text-decoration: none; font-weight: 500; }
                .quick-actions-link:hover { text-decoration: underline; }
                .quick-actions-body { padding: 0; flex: 1; max-height: 200px; overflow-y: auto; }
                .action-item {
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  padding: 8px 14px;
                  border-bottom: 1px solid #f8fafc;
                  cursor: pointer;
                  transition: background 0.15s;
                }
                .action-item:hover { background: #f8fafc; }
                .action-item:last-child { border-bottom: none; }
                .action-indicator {
                  width: 3px;
                  height: 24px;
                  border-radius: 2px;
                  flex-shrink: 0;
                }
                .action-indicator.significant { background: #dc2626; }
                .action-indicator.critical { background: #dc2626; }
                .action-indicator.high { background: #f59e0b; }
                .action-indicator.moderate { background: #3b82f6; }
                .action-content { flex: 1; min-width: 0; }
                .action-title {
                  font-size: 0.75rem;
                  font-weight: 600;
                  color: #0f172a;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  margin-bottom: 2px;
                }
                .action-meta { font-size: 0.65rem; color: #64748b; display: flex; gap: 8px; }
                .action-authority { font-weight: 500; }
                .action-impact {
                  padding: 1px 6px;
                  border-radius: 4px;
                  background: #fef2f2;
                  color: #dc2626;
                  font-weight: 500;
                }
                .action-empty { padding: 20px; text-align: center; color: #64748b; font-size: 0.8rem; }
                .quick-actions-footer {
                  padding: 8px 14px;
                  background: #f8fafc;
                  border-top: 1px solid #f1f5f9;
                  display: flex;
                  gap: 8px;
                }
                .action-btn {
                  flex: 1;
                  padding: 6px 10px;
                  border-radius: 6px;
                  font-size: 0.7rem;
                  font-weight: 600;
                  text-decoration: none;
                  text-align: center;
                  background: #3b82f6;
                  color: white;
                  transition: background 0.15s;
                }
                .action-btn:hover { background: #2563eb; }
                .action-btn.secondary {
                  background: white;
                  color: #3b82f6;
                  border: 1px solid #e2e8f0;
                }
                .action-btn.secondary:hover { background: #f8fafc; }

                /* Charts Row Styles */
                .charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
                .chart-card { background: #ffffff; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0; box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06); }
                .chart-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
                .chart-card-title { font-size: 1.1rem; font-weight: 600; color: #0f172a; margin: 0; }
                .chart-card-subtitle { font-size: 0.8rem; color: #64748b; margin-top: 4px; }

                /* Authority Heatmap */
                .authority-heatmap { display: flex; flex-wrap: wrap; gap: 10px; }
                .heat-badge { padding: 10px 14px; border-radius: 10px; display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 0.9rem; transition: transform 0.2s ease; }
                .heat-badge:hover { transform: translateY(-2px); }
                .heat-badge .count { font-size: 1.1rem; font-weight: 700; }
                .heat-high { background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); color: #b91c1c; border: 1px solid #fecdd3; }
                .heat-medium { background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); color: #b45309; border: 1px solid #fcd34d; }
                .heat-low { background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); color: #047857; border: 1px solid #6ee7b7; }

                /* Sector Pressure Chart */
                .pressure-chart { display: flex; flex-direction: column; gap: 12px; }
                .pressure-row { display: flex; align-items: center; gap: 12px; }
                .pressure-label { width: 120px; font-size: 0.85rem; font-weight: 500; color: #374151; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .pressure-bar-container { flex: 1; height: 24px; background: #f1f5f9; border-radius: 6px; overflow: hidden; }
                .pressure-bar { height: 100%; border-radius: 6px; transition: width 0.5s ease; display: flex; align-items: center; justify-content: flex-end; padding-right: 8px; }
                .pressure-bar.high { background: linear-gradient(90deg, #ef4444 0%, #f87171 100%); }
                .pressure-bar.medium { background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%); }
                .pressure-bar.low { background: linear-gradient(90deg, #10b981 0%, #34d399 100%); }
                .pressure-value { font-size: 0.75rem; font-weight: 700; color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.2); }

                /* Top Fines Widget */
                .fines-widget { background: #ffffff; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0; box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06); margin-bottom: 32px; }
                .fines-widget-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
                .fines-widget-title { font-size: 1.15rem; font-weight: 600; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 10px; }
                .fines-widget-title .icon { width: 28px; height: 28px; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #dc2626; }
                .fines-table { width: 100%; border-collapse: collapse; }
                .fines-table th { text-align: left; padding: 10px 12px; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
                .fines-table td { padding: 14px 12px; border-bottom: 1px solid #f1f5f9; }
                .fines-table tr:last-child td { border-bottom: none; }
                .fines-table tr:hover td { background: #f8fafc; }
                .fine-rank { width: 40px; font-weight: 700; color: #64748b; font-size: 0.9rem; }
                .fine-rank.top-3 { color: #dc2626; }
                .fine-firm { font-weight: 600; color: #0f172a; max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .fine-amount { font-weight: 700; color: #dc2626; font-size: 1rem; white-space: nowrap; }
                .fine-breach { display: inline-flex; padding: 4px 10px; border-radius: 999px; background: #f1f5f9; color: #475569; font-size: 0.78rem; font-weight: 500; }
                .fine-date { color: #64748b; font-size: 0.85rem; white-space: nowrap; }
                .fines-empty { text-align: center; padding: 40px 20px; color: #64748b; }

                @media (max-width: 768px) {
                    .home-dashboard { padding: 24px 18px; }
                    .status-actions { flex-direction: column; align-items: stretch; }
                    .primary-action, .secondary-action { justify-content: center; width: 100%; }
                    .module-grid { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
                    .priority-panel { grid-template-columns: 1fr; }
                    .charts-row { grid-template-columns: 1fr; }
                    .fines-table { font-size: 0.85rem; }
                    .fines-table th, .fines-table td { padding: 10px 8px; }
                    .pressure-label { width: 80px; font-size: 0.75rem; }
                }

                ${getCalendarWidgetStyles()}
            </style>
        </head>
        <body>
         <!-- Firm Profile Modal -->
            <div id="firmProfileModal" class="modal-overlay" style="display:none;">
                <div class="modal">
                    <div class="modal-header">
                        <h3>Firm Profile Settings</h3>
                        <button onclick="closeFirmProfileModal()" class="close-btn">x</button>
                    </div>
                    <div class="modal-content">
                        <form id="firmProfileForm">
                            <div class="form-group">
                                <label>Firm Name:</label>
                                <input type="text" id="firmNameInput" class="form-input" placeholder="Enter your firm name" required>
                            </div>
                            <div class="form-group">
                                <label>Firm Size:</label>
                                <select id="firmSizeInput" class="form-input">
                                    <option value="Small">Small</option>
                                    <option value="Medium" selected>Medium</option>
                                    <option value="Large">Large</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Primary Sectors (select up to 3):</label>
                                <div id="sectorGrid" class="sectors-grid"></div>
                            </div>
                            <div id="messageContainer"></div>
                            <button type="submit" id="saveProfileBtn" class="btn btn-primary">Save Profile</button>
                        </form>
                    </div>
                </div>
            </div>

            <!-- Add modal styles -->
            <style>
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                }
                
                .modal {
                    background: white;
                    border-radius: 12px;
                    padding: 0;
                    max-width: 600px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                }
                
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 30px;
                    border-bottom: 1px solid #e5e7eb;
                }
                
                .modal-header h3 {
                    margin: 0;
                    font-size: 1.5rem;
                    color: #1f2937;
                }
                
                .close-btn {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #6b7280;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 4px;
                    transition: background-color 0.2s;
                }
                
                .close-btn:hover {
                    background-color: #f3f4f6;
                    color: #1f2937;
                }
                
                .modal-content {
                    padding: 30px;
                }
                
                .form-group {
                    margin-bottom: 25px;
                }
                
                .form-group label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 500;
                    color: #374151;
                }
                
                .form-input {
                    width: 100%;
                    padding: 10px 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 1rem;
                    transition: border-color 0.2s;
                }
                
                .form-input:focus {
                    outline: none;
                    border-color: #4f46e5;
                    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
                }
                
                .sectors-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 10px;
                    margin-top: 10px;
                }
                
                .sector-checkbox {
                    padding: 10px;
                    border: 2px solid #e5e7eb;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                }
                
                .sector-checkbox:hover {
                    background-color: #f9fafb;
                }
                
                .sector-checkbox.selected {
                    background-color: #eef2ff;
                    border-color: #4f46e5;
                }
                
                .sector-checkbox input {
                    margin-right: 8px;
                }
                
                .sector-checkbox label {
                    cursor: pointer;
                    margin-bottom: 0;
                    font-weight: normal;
                }
                
                #messageContainer {
                    margin-top: 15px;
                    padding: 10px;
                    border-radius: 6px;
                    display: none;
                }
                
                #messageContainer.error {
                    background-color: #fef2f2;
                    color: #dc2626;
                    border: 1px solid #fecaca;
                    display: block;
                }
                
                #messageContainer.success {
                    background-color: #f0fdf4;
                    color: #16a34a;
                    border: 1px solid #bbf7d0;
                    display: block;
                }
                
                .btn {
                    padding: 10px 20px;
                    border-radius: 6px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                    font-size: 1rem;
                }
                
                .btn-primary {
                    background-color: #4f46e5;
                    color: white;
                }
                
                .btn-primary:hover {
                    background-color: #4338ca;
                }
                
                .btn-primary:disabled {
                    background-color: #9ca3af;
                    cursor: not-allowed;
                }
            </style>

            
            <div class="app-container">
                ${sidebar}
                
                <main class="main-content home-dashboard">
                    <section class="status-banner">
                        <div class="status-header">
                            <div class="status-title">
                                <div class="status-icon status-icon-3d"><svg viewBox="0 0 50 50" class="canary-icon-animated" aria-hidden="true"><defs><linearGradient id="canaryGold" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#FFE066"/><stop offset="50%" style="stop-color:#FFD93D"/><stop offset="100%" style="stop-color:#F4C430"/></linearGradient><linearGradient id="canaryOrange" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#FFB347"/><stop offset="100%" style="stop-color:#FF8C00"/></linearGradient><linearGradient id="shieldBlue" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#3b82f6"/><stop offset="100%" style="stop-color:#1d4ed8"/></linearGradient></defs><path class="shield-glow" d="M25 4 L42 10 L42 24 C42 34 34 42 25 46 C16 42 8 34 8 24 L8 10 Z" fill="url(#shieldBlue)" opacity="0.15"/><path d="M25 6 L40 11 L40 24 C40 33 33 40 25 44 C17 40 10 33 10 24 L10 11 Z" fill="none" stroke="url(#shieldBlue)" stroke-width="1.5" opacity="0.4"/><g class="canary-body"><ellipse cx="25" cy="28" rx="11" ry="9" fill="url(#canaryGold)"/><ellipse cx="25" cy="30" rx="7" ry="5" fill="#FFF3B0" opacity="0.6"/></g><g class="canary-wing"><ellipse cx="30" cy="27" rx="6" ry="4" fill="url(#canaryOrange)" transform="rotate(-15 30 27)"/><path d="M28 25 Q34 23 36 27 Q34 29 28 28 Z" fill="#E6A500"/></g><polygon points="14,28 6,32 8,28 6,24" fill="url(#canaryOrange)"/><g class="canary-head"><circle cx="32" cy="18" r="7" fill="url(#canaryGold)"/><circle cx="34" cy="20" r="2.5" fill="#FFB347" opacity="0.5"/><polygon points="38,17 44,16 38,19" fill="#FF6B00"/><circle cx="34" cy="16" r="2.2" fill="white"/><circle class="canary-eye" cx="34.5" cy="15.5" r="1.3" fill="#1a1a2e"/><circle cx="35" cy="15" r="0.5" fill="white"/><path d="M29 12 Q28 8 30 10 Q29 7 32 9 Q32 6 34 9" fill="url(#canaryOrange)" stroke="#E6A500" stroke-width="0.5"/></g><g fill="#FF6B00"><path d="M22 36 L22 40 M20 40 L24 40" stroke="#FF6B00" stroke-width="1.5" stroke-linecap="round"/><path d="M28 36 L28 40 M26 40 L30 40" stroke="#FF6B00" stroke-width="1.5" stroke-linecap="round"/></g></svg></div>
                                <div class="status-info">
                                    <h1>RegCanary</h1>
                                    <p class="status-subtitle">Prioritised regulatory intelligence and actions for financial services teams.</p>
                                </div>
                            </div>
                            <div class="status-actions">
                                <a class="primary-action" href="/ai-intelligence">Open Intelligence Center</a>
                                <a class="secondary-action" href="/weekly-roundup">Open Weekly Brief</a>
                            </div>
                        </div>
                        <div class="status-meta-grid">
                            <div class="status-meta-card">
                                <span class="status-meta-label">Status</span>
                                <span class="status-meta-value"><span class="status-dot"></span>Operational</span>
                            </div>
                            <div class="status-meta-card">
                                <span class="status-meta-label">Total updates</span>
                                <span class="status-meta-value">${formatNumber(systemStats.totalUpdates || 0)}</span>
                            </div>
                            <div class="status-meta-card">
                                <span class="status-meta-label">Active authorities</span>
                                <span class="status-meta-value">${formatNumber(systemStats.activeAuthorities || 0)}</span>
                            </div>
                            <div class="status-meta-card">
                        <span class="status-meta-label">High-impact items</span>
                        <span class="status-meta-value">${formatNumber(systemStats.highImpact || 0)}</span>
                    </div>
                </div>
            </section>

                    ${renderPriorityStrip(recentUpdates)}
                    ${renderForYouStrip(recentUpdates)}

                    <section class="quick-nav">
                        ${generateQuickNav()}
                    </section>

                    <section class="insights-grid">
                        ${generateInsightCards(recentUpdates.slice(0, 6), systemStats, upcomingEvents)}
                    </section>

                    <section class="widgets-row">
                        ${renderCalendarWidget(upcomingEvents)}
                        ${renderQuickActionsWidget(recentUpdates)}
                    </section>

                    <section class="charts-row">
                        ${renderAuthorityHeatmap(recentUpdates)}
                        ${renderSectorPressureChart(recentUpdates)}
                    </section>

                    ${renderTopFinesWidget(topFines)}

                    <section class="module-grid">
                        ${generateModuleGrid(systemStats, aiInsights)}
                    </section>

                    <section class="updates-panel">
                        <div class="panel-header">
                            <h2 class="panel-title">Latest Updates</h2>
                            <a class="panel-link" href="/dashboard">Open dashboard →</a>
                        </div>
                        <ul class="update-list">
                            ${generateRecentUpdatesPreview(recentUpdates)}
                        </ul>
                    </section>

                    <div class="footer-note">
                        Need something different? Explore the <a href="/dashboard">full analytics workspace</a> or contact your compliance intelligence partner.
                    </div>
                </main>
            </div>
            
            ${getClientScripts()}
        </body>
        </html>`

    res.send(html)
  } catch (error) {
    console.error('X Error rendering home page:', error)
    res.status(500).send(`
            <html>
                <head><title>Error - AI Regulatory Intelligence</title></head>
                <body style="font-family: Arial; text-align: center; padding: 50px;">
                    <h1>Warning System Error</h1>
                    <p>Unable to load the home page. Please try refreshing.</p>
                    <p><a href="/"><- Try Again</a></p>
                    <small>Error: ${error.message}</small>
                </body>
            </html>
        `)
  }
}

async function getSystemStatistics() {
  try {
    const stats = await dbService.getSystemStatistics()
    return {
      totalUpdates: stats.totalUpdates || 0,
      activeAuthorities: stats.activeAuthorities || 0,
      aiAnalyzed: stats.aiAnalyzed || 0,
      highImpact: stats.highImpact || 0
    }
  } catch (error) {
    console.error('Error getting system statistics:', error)
    return {
      totalUpdates: 0,
      activeAuthorities: 0,
      aiAnalyzed: 0,
      highImpact: 0
    }
  }
}

function generateInsightCards(recentUpdates, systemStats, calendarEvents = []) {
  const highlights = buildHomepageHighlights(recentUpdates, systemStats, calendarEvents)
  return highlights.map(item => `
        <article class="insight-card">
            <span class="insight-label">${escapeHtml(item.label)}</span>
            <h3 class="insight-headline">${escapeHtml(item.headline)}</h3>
            <p class="insight-body">${escapeHtml(item.body)}</p>
            ${item.meta ? `<div class="insight-meta">${escapeHtml(item.meta)}</div>` : ''}
        </article>
    `).join('')
}

function buildHomepageHighlights(recentUpdates = [], systemStats = {}, calendarEvents = []) {
  const highlights = []

  if (recentUpdates.length > 0) {
    const authorityCounts = {}
    recentUpdates.forEach(update => {
      const authority = update.authority || 'Unknown'
      authorityCounts[authority] = (authorityCounts[authority] || 0) + 1
    })

    const sortedAuthorities = Object.entries(authorityCounts).sort((a, b) => b[1] - a[1])
    if (sortedAuthorities.length > 0) {
      const [authority, count] = sortedAuthorities[0]
      highlights.push({
        label: 'Authority focus',
        headline: `${authority} leading recent activity`,
        body: `${count} update${count === 1 ? '' : 's'} captured across the latest feed.`,
        meta: 'Monitoring window: last refresh'
      })
    }
  }

  // Use calendar events for deadline count (more accurate)
  const now = Date.now()
  const upcomingDeadlines = calendarEvents.filter(event => {
    if (!event.eventDate) return false
    const due = new Date(event.eventDate).getTime()
    return !Number.isNaN(due) && due >= now && due - now <= 14 * 24 * 60 * 60 * 1000
  }).length

  const consultationCount = calendarEvents.filter(e =>
    e.eventType === 'consultation' || e.sourceType === 'consultation'
  ).length

  highlights.push({
    label: 'Upcoming deadlines',
    headline: `${upcomingDeadlines} deadline${upcomingDeadlines === 1 ? '' : 's'} in next 14 days`,
    body: consultationCount
      ? `${consultationCount} consultation${consultationCount === 1 ? '' : 's'} currently open for response.`
      : 'Review the calendar for all upcoming regulatory events.',
    meta: 'From regulatory calendar'
  })

  if (highlights.length < 2) {
    highlights.push({
      label: 'Platform coverage',
      headline: `${formatNumber(systemStats.totalUpdates || 0)} updates tracked`,
      body: 'Monitoring engine remains active across all regulatory sources.',
      meta: 'Live coverage'
    })
  }

  return highlights.slice(0, 2)
}

function generateQuickNav() {
  const iconSet = {
    intelligence: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5.5" fill="none"></circle><path d="M12 6.5v11M6.5 12h11" stroke-linecap="round"></path><circle cx="12" cy="12" r="8.3" fill="none"></circle></svg>',
    authority: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 4.5 8v12h15V8L12 4z" fill="none" stroke-linejoin="round"></path><path d="M7.5 11v7M12 11v7M16.5 11v7" stroke-linecap="round"></path><path d="M5 19h14" stroke-linecap="round"></path></svg>',
    sector: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 17h16" stroke-linecap="round"></path><rect x="5.5" y="10.5" width="3.5" height="6.5" rx="1"></rect><rect x="10.25" y="8" width="3.5" height="9" rx="1"></rect><rect x="15" y="5.5" width="3.5" height="11.5" rx="1"></rect></svg>',
    brief: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5h8.5L19 8v11.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1z" fill="none" stroke-linejoin="round"></path><path d="M15.5 4.5V8H19" fill="none" stroke-linecap="round" stroke-linejoin="round"></path><path d="M9.5 12h5M9.5 15h3.5" stroke-linecap="round"></path></svg>',
    planner: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 6h4v4h-4zM14.5 6h4v4h-4zM10.5 14h3" stroke-linecap="round"></path><path d="M5.5 18h13" stroke-linecap="round"></path><path d="M11 10v2a2 2 0 0 0 2 2h1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>'
  }

  const iconWithStroke = (svg) => svg.replace(/<svg /, '<svg stroke="currentColor" ')

  const links = [
    { icon: iconWithStroke(iconSet.intelligence), label: 'Intelligence Center', meta: 'Triage & prioritise', href: '/ai-intelligence' },
    { icon: iconWithStroke(iconSet.authority), label: 'Authority Spotlight', meta: 'Momentum & enforcement', href: '/authority-spotlight/FCA' },
    { icon: iconWithStroke(iconSet.sector), label: 'Sector Pressure', meta: 'Sector-specific trends', href: '/sector-intelligence/Banking' },
    { icon: iconWithStroke(iconSet.brief), label: 'Weekly Brief', meta: 'Executive summary', href: '/weekly-roundup' },
    { icon: iconWithStroke(iconSet.planner), label: 'Implementation Planner', meta: 'Plan next steps', href: '/dashboard' }
  ]

  return links.map(link => `
    <a class="quick-chip" href="${link.href}">
        <span class="quick-chip-icon" aria-hidden="true">${link.icon}</span>
        <span>
            <span class="chip-label">${escapeHtml(link.label)}</span>
            <span class="chip-meta">${escapeHtml(link.meta)}</span>
        </span>
    </a>
  `).join('')
}

function generateModuleGrid(systemStats = {}, aiInsights = []) {
  const modules = [
    {
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" stroke-width="1.6"></circle><path d="M12 6v12M6 12h12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg>',
      title: 'Intelligence Center',
      metric: formatNumber(systemStats.totalUpdates || 0),
      statLabel: 'updates tracked',
      description: 'Dashboard for triage, prioritisation, and follow-up capture.',
      link: '/ai-intelligence',
      linkText: 'Open dashboard'
    },
    {
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><path d="M6.5 10.5v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><path d="M12 10.5v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><path d="M17.5 10.5v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><path d="M5 9l7-5 7 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"></path></svg>',
      title: 'Authority Spotlight',
      metric: formatNumber(systemStats.activeAuthorities || 0),
      statLabel: 'active authorities',
      description: 'Momentum analysis and coordination signals across regulators.',
      link: '/authority-spotlight/FCA',
      linkText: 'Open dashboard'
    },
    {
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 17h12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><rect x="6" y="11" width="3" height="6" rx="0.8" fill="none" stroke="currentColor" stroke-width="1.6"></rect><rect x="10.5" y="9" width="3" height="8" rx="0.8" fill="none" stroke="currentColor" stroke-width="1.6"></rect><rect x="15" y="7" width="3" height="10" rx="0.8" fill="none" stroke="currentColor" stroke-width="1.6"></rect></svg>',
      title: 'Sector Pressure',
      metric: formatNumber(systemStats.highImpact || 0),
      statLabel: 'high-impact items',
      description: 'Sector dashboards covering pressure scores, deadlines, and owners.',
      link: '/sector-intelligence/Banking',
      linkText: 'Open dashboard'
    },
    {
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5h9l3 3v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-14a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"></path><path d="M15 4.5V9h4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path><path d="M9 12h6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><path d="M9 15h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg>',
      title: 'Weekly Brief',
      metric: formatNumber(aiInsights.length || 0),
      statLabel: 'insights queued',
      description: 'Download or trigger the latest executive-ready weekly summary.',
      link: '/weekly-roundup',
      linkText: 'Open dashboard'
    }
  ]

  return modules.map(module => `
        <article class="module-card">
            <div class="module-icon">${module.icon}</div>
            <div class="module-label">Dashboard View</div>
            <h3 class="module-title">${escapeHtml(module.title)}</h3>
            <div class="module-metric">${escapeHtml(module.metric)}</div>
            <div class="module-stat-label">${escapeHtml(module.statLabel)}</div>
            <p class="module-description">${escapeHtml(module.description)}</p>
            <a class="module-link" href="${module.link}">${escapeHtml(module.linkText)} →</a>
        </article>
    `).join('')
}

function generateRecentUpdatesPreview(updates) {
  if (!updates || updates.length === 0) {
    return `
            <li class="update-item">
                <span class="update-badge">—</span>
                <div class="update-copy">
                    <div class="update-headline">No updates captured yet</div>
                    <div class="update-meta">The monitoring engine will surface new items as soon as they arrive.</div>
                </div>
            </li>
        `
  }

  // Limit to 10 most recent updates for home page
  const limitedUpdates = updates.slice(0, 10)

  return limitedUpdates.map(update => {
    const dateMeta = formatRelativeDate(update.publishedDate || update.published_date || update.fetchedDate || update.createdAt)
    const impact = update.impactLevel || update.impact_level || 'Informational'
    const deadlineRaw = update.compliance_deadline || update.complianceDeadline
    const deadline = deadlineRaw ? formatShortDate(deadlineRaw) : null
    const headline = escapeHtml(update.headline || 'Untitled update')
    const linkOpen = update.url ? `<a href="${escapeAttribute(update.url)}" target="_blank" rel="noopener">${headline}</a>` : headline

    return `
        <li class="update-item">
            <span class="update-badge">${escapeHtml(update.authority || 'Unknown')}</span>
            <div class="update-copy">
                <div class="update-headline">${linkOpen}</div>
                <div class="update-meta">
                    <span>${escapeHtml(dateMeta)}</span>
                    <span>${escapeHtml(impact)}</span>
                    ${deadline ? `<span>Deadline: ${escapeHtml(deadline)}</span>` : ''}
                </div>
            </div>
        </li>
    `
  }).join('')
}

function formatNumber(value) {
  try {
    return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(value || 0)
  } catch (error) {
    return String(value || 0)
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/\s/g, '%20')
}

function formatShortDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function formatRelativeDate(dateString) {
  if (!dateString) return 'Unknown'

  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 1) return 'Today'
  if (diffDays === 2) return 'Yesterday'
  if (diffDays <= 7) return `${diffDays - 1} days ago`
  if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`

  return date.toLocaleDateString('en-UK', {
    day: 'numeric',
    month: 'short'
  })
}

function isToday(value) {
  if (!value) return false
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  const now = new Date()
  return date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
}

function selectPriorityUpdate(updates = []) {
  if (!Array.isArray(updates) || updates.length === 0) return null
  const today = updates.filter(update => isToday(update.publishedDate || update.published_date || update.fetchedDate || update.createdAt))
  const candidates = today.length ? today : updates
  const scored = candidates.map(update => {
    const impact = (update.impactLevel || update.impact_level || '').toLowerCase()
    const urgency = (update.urgency || '').toLowerCase()
    let score = 0
    if (impact === 'significant' || impact === 'critical') score += 5
    else if (impact === 'moderate') score += 3
    if (urgency === 'high') score += 4
    else if (urgency === 'medium') score += 2
    if (isToday(update.publishedDate || update.published_date || update.fetchedDate || update.createdAt)) score += 3
    return { update, score }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored[0]?.update || null
}

function formatHeatMeta(updates = []) {
  const todayUpdates = updates.filter(update => isToday(update.publishedDate || update.published_date || update.fetchedDate || update.createdAt))
  const highImpact = todayUpdates.filter(update => {
    const impact = (update.impactLevel || update.impact_level || '').toLowerCase()
    return impact === 'significant' || impact === 'critical'
  })
  const level = highImpact.length >= 3 || todayUpdates.length >= 8
    ? 'high'
    : highImpact.length >= 1 || todayUpdates.length >= 3
      ? 'moderate'
      : 'low'
  return {
    level,
    todayCount: todayUpdates.length,
    highImpactCount: highImpact.length
  }
}

function renderPriorityStrip(updates = []) {
  const priority = selectPriorityUpdate(updates)
  const heat = formatHeatMeta(updates)
  if (!priority) return ''

  const impact = (priority.impactLevel || priority.impact_level || 'Informational')
  const urgency = priority.urgency || '—'
  const summary = priority.summary || priority.ai_summary || 'Most recent high-impact update for today.'
  const heatLabel = heat.level === 'high' ? 'High' : heat.level === 'moderate' ? 'Moderate' : 'Low'

  return `
        <section class="priority-panel">
            <div class="priority-primary">
                <span class="priority-lead">Top Impact Today</span>
                <h3>${escapeHtml(priority.headline || 'Priority update')}</h3>
                <p class="priority-summary">${escapeHtml(summary.substring(0, 200))}</p>
                <div class="priority-meta">
                    <span class="pill impact-${impact.toLowerCase()}">${escapeHtml(impact)}</span>
                    <span class="pill urgency-${String(urgency).toLowerCase()}">Urgency: ${escapeHtml(urgency)}</span>
                    <span class="pill">${escapeHtml(priority.authority || 'Unknown')}</span>
                </div>
                <div class="priority-actions">
                    <a class="primary-chip" href="/dashboard?range=today&impact=Significant,Moderate&sort=newest">Open Today</a>
                    <a class="ghost-chip" href="/dashboard?sort=newest">Go to Dashboard</a>
                    <a class="ghost-chip" href="/ai-intelligence">Open Intelligence Center</a>
                </div>
            </div>
            <div class="priority-side">
                <div class="heat-label">Today heat</div>
                <div class="heat-pill ${heat.level}">${heatLabel}</div>
                <div class="heat-meta">New today: ${heat.todayCount} • High impact: ${heat.highImpactCount}</div>
                <a class="ghost-chip" href="/dashboard?range=today&sort=newest">View all today →</a>
            </div>
        </section>
    `
}

function renderForYouStrip(updates = []) {
  const today = updates.filter(update => isToday(update.publishedDate || update.published_date || update.fetchedDate || update.createdAt))
  const shortlist = (today.length ? today : updates).slice(0, 4)
  if (!shortlist.length) return ''

  const cards = shortlist.map(update => {
    const impact = (update.impactLevel || update.impact_level || 'Informational')
    const urgency = update.urgency || '—'
    return `
            <article class="for-you-card">
                <div class="for-you-title">${escapeHtml(update.headline || 'Untitled update')}</div>
                <div class="for-you-meta">
                    <span class="pill impact-${impact.toLowerCase()}">${escapeHtml(impact)}</span>
                    <span class="pill">${escapeHtml(update.authority || 'Unknown')}</span>
                    <span class="pill urgency-${String(urgency).toLowerCase()}">${escapeHtml(urgency)}</span>
                </div>
                <div class="for-you-actions">
                    <a class="module-link" href="${update.url ? escapeAttribute(update.url) : '/update/' + escapeAttribute(update.id || '')}" target="_blank" rel="noopener">View →</a>
                    <a class="module-link" href="/dashboard?range=today&impact=${escapeAttribute(impact)}&sort=newest">Open in dashboard →</a>
                </div>
            </article>
        `
  }).join('')

  return `
        <section class="for-you-panel">
            <div class="panel-header">
                <h2 class="panel-title">For you today</h2>
                <a class="panel-link" href="/dashboard?range=today&sort=newest">Open today view →</a>
            </div>
            <div class="for-you-grid">
                ${cards}
            </div>
        </section>
    `
}

// =========================================================================
// Top Fines Widget Functions
// =========================================================================

async function getTopFinesThisYear() {
  try {
    const currentYear = new Date().getFullYear()

    // Query database directly to get all fines (including pending) for current year
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })

    const result = await pool.query(`
      SELECT
        fine_reference,
        date_issued,
        firm_individual,
        amount,
        ai_summary,
        breach_categories,
        affected_sectors,
        final_notice_url
      FROM fca_fines
      WHERE EXTRACT(YEAR FROM date_issued) = $1
        AND amount IS NOT NULL
        AND amount > 0
      ORDER BY amount DESC
      LIMIT 5
    `, [currentYear])

    await pool.end()

    return result.rows
  } catch (error) {
    console.error('Error getting top fines:', error)
    return []
  }
}

function renderTopFinesWidget(fines = []) {
  const currentYear = new Date().getFullYear()

  if (!fines || fines.length === 0) {
    return `
      <section class="fines-widget">
        <div class="fines-widget-header">
          <h2 class="fines-widget-title">
            <span class="icon">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </span>
            Top 5 FCA Fines ${currentYear}
          </h2>
          <a class="panel-link" href="/enforcement">View all enforcement →</a>
        </div>
        <div class="fines-empty">
          <p>No fines data available for ${currentYear} yet.</p>
        </div>
      </section>
    `
  }

  const totalAmount = fines.reduce((sum, f) => sum + (f.amount || 0), 0)

  const rows = fines.map((fine, index) => {
    const rank = index + 1
    const firm = escapeHtml(fine.firm_individual || 'Unknown Firm')
    const amount = formatCurrency(fine.amount)
    const breach = fine.breach_categories && Array.isArray(fine.breach_categories)
      ? fine.breach_categories[0]
      : (fine.breach_type || 'Unknown')
    const date = fine.date_issued
      ? new Date(fine.date_issued).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      : 'N/A'

    return `
      <tr>
        <td class="fine-rank ${rank <= 3 ? 'top-3' : ''}">#${rank}</td>
        <td class="fine-firm" title="${firm}">${firm}</td>
        <td class="fine-amount">${amount}</td>
        <td><span class="fine-breach">${escapeHtml(breach)}</span></td>
        <td class="fine-date">${date}</td>
      </tr>
    `
  }).join('')

  return `
    <section class="fines-widget">
      <div class="fines-widget-header">
        <h2 class="fines-widget-title">
          <span class="icon">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </span>
          Top 5 FCA Fines ${currentYear}
        </h2>
        <a class="panel-link" href="/enforcement">View all enforcement →</a>
      </div>
      <table class="fines-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Firm / Individual</th>
            <th>Amount</th>
            <th>Breach Type</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 0.85rem; color: #64748b;">Total top 5 fines:</span>
        <span style="font-size: 1.1rem; font-weight: 700; color: #dc2626;">${formatCurrency(totalAmount)}</span>
      </div>
    </section>
  `
}

function formatCurrency(amount) {
  if (!amount || isNaN(amount)) return '£0'

  if (amount >= 1000000) {
    return '£' + (amount / 1000000).toFixed(1) + 'M'
  } else if (amount >= 1000) {
    return '£' + (amount / 1000).toFixed(0) + 'K'
  }
  return '£' + amount.toLocaleString('en-GB')
}

// =========================================================================
// Authority Heatmap Functions
// =========================================================================

function calculateAuthorityActivity(updates = []) {
  const authorityCounts = {}

  updates.forEach(update => {
    const authority = update.authority || 'Unknown'
    if (!authorityCounts[authority]) {
      authorityCounts[authority] = { total: 0, highImpact: 0 }
    }
    authorityCounts[authority].total++

    const impact = (update.impactLevel || update.impact_level || '').toLowerCase()
    if (impact === 'significant' || impact === 'critical' || impact === 'high') {
      authorityCounts[authority].highImpact++
    }
  })

  // Convert to sorted array
  return Object.entries(authorityCounts)
    .map(([name, data]) => ({
      name,
      total: data.total,
      highImpact: data.highImpact,
      level: data.total >= 8 ? 'high' : data.total >= 4 ? 'medium' : 'low'
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)
}

function renderAuthorityHeatmap(updates = []) {
  const authorities = calculateAuthorityActivity(updates)

  if (authorities.length === 0) {
    return `
      <div class="chart-card">
        <div class="chart-card-header">
          <div>
            <h3 class="chart-card-title">Authority Activity</h3>
            <p class="chart-card-subtitle">No activity data available</p>
          </div>
        </div>
      </div>
    `
  }

  const badges = authorities.map(auth => `
    <a href="/authority-spotlight/${encodeURIComponent(auth.name)}" class="heat-badge heat-${auth.level}" title="${auth.total} updates, ${auth.highImpact} high-impact">
      <span>${escapeHtml(auth.name)}</span>
      <span class="count">${auth.total}</span>
    </a>
  `).join('')

  return `
    <div class="chart-card">
      <div class="chart-card-header">
        <div>
          <h3 class="chart-card-title">Authority Activity</h3>
          <p class="chart-card-subtitle">Updates by regulator this period</p>
        </div>
        <a class="panel-link" href="/authority-spotlight/FCA">View all →</a>
      </div>
      <div class="authority-heatmap">
        ${badges}
      </div>
    </div>
  `
}

// =========================================================================
// Sector Pressure Chart Functions
// =========================================================================

function calculateSectorPressure(updates = []) {
  const sectorData = {}

  updates.forEach(update => {
    const sector = update.sector || 'General'
    if (!sectorData[sector]) {
      sectorData[sector] = { total: 0, highImpact: 0 }
    }
    sectorData[sector].total++

    const impact = (update.impactLevel || update.impact_level || '').toLowerCase()
    if (impact === 'significant' || impact === 'critical' || impact === 'high') {
      sectorData[sector].highImpact++
    }
  })

  // Calculate pressure score and convert to array
  const sectors = Object.entries(sectorData)
    .map(([name, data]) => {
      // Pressure score: weighted combination of total and high-impact
      const pressure = Math.round(((data.highImpact * 2) + data.total) * 10 / 3)
      return {
        name,
        total: data.total,
        highImpact: data.highImpact,
        pressure: Math.min(pressure, 100), // Cap at 100%
        level: pressure >= 70 ? 'high' : pressure >= 40 ? 'medium' : 'low'
      }
    })
    .sort((a, b) => b.pressure - a.pressure)
    .slice(0, 6)

  // Normalize to max pressure
  const maxPressure = Math.max(...sectors.map(s => s.pressure), 1)
  sectors.forEach(s => {
    s.normalizedPressure = Math.round((s.pressure / maxPressure) * 100)
  })

  return sectors
}

function renderSectorPressureChart(updates = []) {
  const sectors = calculateSectorPressure(updates)

  if (sectors.length === 0) {
    return `
      <div class="chart-card">
        <div class="chart-card-header">
          <div>
            <h3 class="chart-card-title">Sector Risk Pressure</h3>
            <p class="chart-card-subtitle">No sector data available</p>
          </div>
        </div>
      </div>
    `
  }

  const bars = sectors.map(sector => `
    <div class="pressure-row">
      <span class="pressure-label" title="${sector.name}">${escapeHtml(sector.name)}</span>
      <div class="pressure-bar-container">
        <div class="pressure-bar ${sector.level}" style="width: ${sector.normalizedPressure}%">
          ${sector.normalizedPressure >= 20 ? `<span class="pressure-value">${sector.pressure}%</span>` : ''}
        </div>
      </div>
    </div>
  `).join('')

  return `
    <div class="chart-card">
      <div class="chart-card-header">
        <div>
          <h3 class="chart-card-title">Sector Risk Pressure</h3>
          <p class="chart-card-subtitle">Regulatory activity by sector</p>
        </div>
        <a class="panel-link" href="/sector-intelligence/Banking">View all →</a>
      </div>
      <div class="pressure-chart">
        ${bars}
      </div>
    </div>
  `
}

// =========================================================================
// Quick Actions Widget
// =========================================================================

function renderQuickActionsWidget(updates = []) {
  // Get high-impact items
  const highImpact = updates.filter(u => {
    const impact = (u.impactLevel || u.impact_level || '').toLowerCase()
    return impact === 'significant' || impact === 'critical' || impact === 'high'
  }).slice(0, 4)

  const actionItems = highImpact.map(item => {
    const impact = (item.impactLevel || item.impact_level || 'Moderate')
    return `
      <div class="action-item" title="${escapeHtml(item.headline || 'Update')}">
        <div class="action-indicator ${impact.toLowerCase()}"></div>
        <div class="action-content">
          <div class="action-title">${escapeHtml((item.headline || 'Untitled').substring(0, 50))}${(item.headline || '').length > 50 ? '...' : ''}</div>
          <div class="action-meta">
            <span class="action-authority">${escapeHtml(item.authority || 'Unknown')}</span>
            <span class="action-impact">${escapeHtml(impact)}</span>
          </div>
        </div>
      </div>
    `
  }).join('')

  return `
    <div class="quick-actions-widget">
      <div class="quick-actions-header">
        <div class="quick-actions-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          Priority Actions
        </div>
        <a href="/ai-intelligence" class="quick-actions-link">View All →</a>
      </div>
      <div class="quick-actions-body">
        ${actionItems || '<div class="action-empty">No high-priority items</div>'}
      </div>
      <div class="quick-actions-footer">
        <a href="/dashboard?impact=Significant" class="action-btn">Review High Impact</a>
        <a href="/ai-intelligence" class="action-btn secondary">Intelligence Center</a>
      </div>
    </div>
  `
}

module.exports = renderHomePage
