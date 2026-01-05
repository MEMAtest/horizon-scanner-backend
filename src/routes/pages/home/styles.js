const { getCalendarWidgetStyles } = require('../../../views/calendar/styles')

function getHomePageStyles() {
  return `
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
                .priority-link {
                    color: inherit;
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                }
                .priority-link:hover { text-decoration: underline; }
                .priority-link:focus-visible { outline: 2px solid #93c5fd; outline-offset: 3px; border-radius: 6px; }
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
`
}

module.exports = { getHomePageStyles }
