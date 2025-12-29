const { getRegulatoryAnalyticsStyles } = require('./styles')
const { getRegulatoryAnalyticsScripts } = require('./scripts')

function buildAnalyticsPage({ sidebar, commonStyles, clientScripts, analyticsData, filterOptions, updates, canaryStyles, pageIcon }) {
  const {
    summary, monthlyChartData, topAuthorities, topSectors, impactDistribution,
    sectorBurden, weeklyActivity, impactTrends, authorityComparison, topSectorAuthorityPairs, velocityMetrics
  } = analyticsData
  // Ensure updates is always an array
  const safeUpdates = Array.isArray(updates) ? updates : []

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Regulatory Analytics - Horizon Scanner</title>
      ${commonStyles}
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <style>${getRegulatoryAnalyticsStyles(canaryStyles)}
      </style>
    </head>
    <body>
      ${sidebar}
      <main class="main-content">
        <div class="analytics-page">
          <header class="analytics-header">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
              <div style="display: flex; align-items: center; gap: 16px;">
                ${pageIcon}
                <div>
                  <h1>Regulatory Analytics Dashboard</h1>
                  <p class="header-subtitle">Publications by source, regulator, sector, and trends over time</p>
                </div>
              </div>
              <div class="export-buttons">
                <button onclick="exportData('csv')" class="export-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                  Export CSV
                </button>
                <button onclick="exportData('excel')" class="export-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                  Export Excel
                </button>
                <button onclick="exportData('summary')" class="export-btn export-btn-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Full Report
                </button>
              </div>
            </div>
          </header>

          <!-- Summary Cards -->
          <div class="summary-grid">
            <div class="summary-card">
              <div class="summary-card-header">
                <span class="summary-card-label">Total Publications</span>
                <div class="summary-card-icon" style="background: #eff6ff;">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M9 9h6M9 13h6M9 17h4"/>
                  </svg>
                </div>
              </div>
              <div class="summary-card-value">${summary.totalUpdates.toLocaleString()}</div>
              <div class="summary-card-change neutral">All time</div>
            </div>

            <div class="summary-card">
              <div class="summary-card-header">
                <span class="summary-card-label">Last 30 Days</span>
                <div class="summary-card-icon" style="background: #f0fdf4;">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
              </div>
              <div class="summary-card-value">${summary.last30Days.toLocaleString()}</div>
              <div class="summary-card-change ${summary.velocityChange >= 0 ? 'positive' : 'negative'}">
                ${summary.velocityChange >= 0 ? '+' : ''}${summary.velocityChange}% vs prev 30d
              </div>
            </div>

            <div class="summary-card">
              <div class="summary-card-header">
                <span class="summary-card-label">High Impact</span>
                <div class="summary-card-icon" style="background: #fef2f2;">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
              </div>
              <div class="summary-card-value">${summary.highImpact.toLocaleString()}</div>
              <div class="summary-card-change neutral">Requires attention</div>
            </div>

            <div class="summary-card">
              <div class="summary-card-header">
                <span class="summary-card-label">Active Regulators</span>
                <div class="summary-card-icon" style="background: #f5f3ff;">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2">
                    <path d="M12 4 4.5 7.5v11h15v-11L12 4z"/>
                    <path d="M7.5 10.5v6M12 10.5v6M16.5 10.5v6"/>
                  </svg>
                </div>
              </div>
              <div class="summary-card-value">${summary.activeAuthorities}</div>
              <div class="summary-card-change neutral">Publishing content</div>
            </div>
          </div>

          <!-- Charts -->
          <div class="charts-grid">
            <div class="chart-card full-width">
              <div class="chart-card-header">
                <div>
                  <h3 class="chart-card-title">Monthly Publication Trends</h3>
                  <p class="chart-card-subtitle">Total publications by month with impact breakdown</p>
                </div>
              </div>
              <div class="chart-container">
                <canvas id="monthlyTrendChart"></canvas>
              </div>
            </div>

            <div class="chart-card">
              <div class="chart-card-header">
                <div>
                  <h3 class="chart-card-title">Publications by Regulator</h3>
                  <p class="chart-card-subtitle">Top 10 most active authorities</p>
                </div>
              </div>
              <div class="chart-container">
                <canvas id="authorityChart"></canvas>
              </div>
            </div>

            <div class="chart-card">
              <div class="chart-card-header">
                <div>
                  <h3 class="chart-card-title">Impact Distribution</h3>
                  <p class="chart-card-subtitle">Breakdown by impact level</p>
                </div>
              </div>
              <div class="chart-container">
                <canvas id="impactChart"></canvas>
              </div>
            </div>
          </div>

          <!-- Top Items Lists -->
          <div class="top-items-grid">
            <div class="top-items-card">
              <div class="top-items-header">
                <h3 class="top-items-title">Top Regulators by Volume</h3>
              </div>
              <ul class="top-items-list">
                ${topAuthorities.slice(0, 8).map((auth, i) => `
                  <li class="top-item">
                    <span class="top-item-rank ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}">${i + 1}</span>
                    <span class="top-item-name">${escapeHtml(auth.name)}</span>
                    <div class="top-item-stats">
                      <div class="top-item-stat">
                        <div class="top-item-stat-value">${auth.total}</div>
                        <div class="top-item-stat-label">Total</div>
                      </div>
                      <div class="top-item-stat">
                        <div class="top-item-stat-value">${auth.recent}</div>
                        <div class="top-item-stat-label">30d</div>
                      </div>
                    </div>
                  </li>
                `).join('')}
              </ul>
            </div>

            <div class="top-items-card">
              <div class="top-items-header">
                <h3 class="top-items-title">Top Sectors by Coverage</h3>
              </div>
              <ul class="top-items-list">
                ${topSectors.slice(0, 8).map((sector, i) => `
                  <li class="top-item">
                    <span class="top-item-rank ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}">${i + 1}</span>
                    <span class="top-item-name">${escapeHtml(sector.name)}</span>
                    <div class="top-item-stats">
                      <div class="top-item-stat">
                        <div class="top-item-stat-value">${sector.total}</div>
                        <div class="top-item-stat-label">Total</div>
                      </div>
                      <div class="top-item-stat">
                        <div class="top-item-stat-value">${sector.recent}</div>
                        <div class="top-item-stat-label">30d</div>
                      </div>
                    </div>
                  </li>
                `).join('')}
              </ul>
            </div>
          </div>

          <!-- NEW: Advanced Analytics Widgets -->
          <div class="charts-grid" style="margin-top: 2rem;">
            <!-- Sector Compliance Burden Widget -->
            <div class="chart-card">
              <div class="chart-card-header">
                <div>
                  <h3 class="chart-card-title">Sector Compliance Burden</h3>
                  <p class="chart-card-subtitle">Average publications per month by sector - Click to drill down</p>
                </div>
              </div>
              <div class="chart-container">
                <canvas id="sectorBurdenChart" style="cursor: pointer;"></canvas>
              </div>
              <div style="padding: 1rem; background: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 0.875rem;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem;">
                  ${sectorBurden.slice(0, 6).map(sector => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: white; border-radius: 4px; border: 1px solid #e5e7eb; cursor: pointer;"
                         onclick="drillDownSector('${escapeHtml(sector.name)}')"
                         class="hover-highlight">
                      <span style="font-weight: 500; color: #374151;">${escapeHtml(sector.name)}</span>
                      <span style="color: #6366f1; font-weight: 600;">${sector.avgPerMonth}/mo</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- Impact Severity Trends Widget -->
            <div class="chart-card">
              <div class="chart-card-header">
                <div>
                  <h3 class="chart-card-title">Impact Severity Trends</h3>
                  <p class="chart-card-subtitle">High-impact publication rate over time - Click for details</p>
                </div>
              </div>
              <div class="chart-container">
                <canvas id="impactTrendsChart" style="cursor: pointer;"></canvas>
              </div>
              <div style="padding: 1rem; background: #fef2f2; border-top: 1px solid #fecaca;">
                <div style="display: flex; justify-content: space-around; text-align: center;">
                  <div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: #dc2626;">
                      ${Math.round(impactTrends[impactTrends.length - 1]?.highPercentage || 0)}%
                    </div>
                    <div style="font-size: 0.75rem; color: #991b1b;">High Impact This Month</div>
                  </div>
                  <div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: #ea580c;">
                      ${impactTrends[impactTrends.length - 1]?.severityScore.toFixed(2) || '0'}
                    </div>
                    <div style="font-size: 0.75rem; color: #9a3412;">Severity Score</div>
                  </div>
                  <div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: ${impactTrends.length >= 2 && impactTrends[impactTrends.length - 1]?.highPercentage > impactTrends[impactTrends.length - 2]?.highPercentage ? '#dc2626' : '#10b981'};">
                      ${impactTrends.length >= 2 ? (impactTrends[impactTrends.length - 1]?.highPercentage > impactTrends[impactTrends.length - 2]?.highPercentage ? '↑' : '↓') : '−'}
                    </div>
                    <div style="font-size: 0.75rem; color: #78350f;">Trend</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Authority Comparison Widget -->
            <div class="chart-card">
              <div class="chart-card-header">
                <div>
                  <h3 class="chart-card-title">Authority Activity Comparison</h3>
                  <p class="chart-card-subtitle">Regulatory velocity by authority - Click to compare</p>
                </div>
              </div>
              <div class="chart-container">
                <canvas id="authorityComparisonChart" style="cursor: pointer;"></canvas>
              </div>
              <div style="padding: 1rem; background: #f9fafb; border-top: 1px solid #e5e7eb;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.875rem;">
                  ${authorityComparison.slice(0, 4).map(auth => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: white; border-radius: 6px; border: 1px solid #e5e7eb; cursor: pointer;"
                         onclick="drillDownAuthority('${escapeHtml(auth.name)}')"
                         class="hover-highlight">
                      <div>
                        <div style="font-weight: 600; color: #111827; margin-bottom: 0.25rem;">${escapeHtml(auth.name)}</div>
                        <div style="font-size: 0.75rem; color: #6b7280;">
                          ${auth.marketShare}% market share · ${auth.trend}
                        </div>
                      </div>
                      <div style="text-align: right;">
                        <div style="font-weight: 700; color: ${auth.velocity >= 0 ? '#10b981' : '#ef4444'};">
                          ${auth.velocity >= 0 ? '+' : ''}${auth.velocity}
                        </div>
                        <div style="font-size: 0.75rem; color: #9ca3af;">velocity</div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>

          <!-- NEW: Publication Velocity Dashboard -->
          <div class="chart-card full-width" style="margin-top: 2rem;">
            <div class="chart-card-header">
              <div>
                <h3 class="chart-card-title">Publication Velocity Dashboard</h3>
                <p class="chart-card-subtitle">Detailed analysis of regulatory activity rate</p>
              </div>
            </div>
            <div style="padding: 1.5rem;">
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
                <div style="padding: 1.25rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; color: white;">
                  <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem;">Current 30-Day Rate</div>
                  <div style="font-size: 2.5rem; font-weight: 700;">${velocityMetrics.current30Days}</div>
                  <div style="font-size: 0.75rem; opacity: 0.8; margin-top: 0.5rem;">publications</div>
                </div>
                <div style="padding: 1.25rem; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 12px; color: white;">
                  <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem;">Velocity Change</div>
                  <div style="font-size: 2.5rem; font-weight: 700;">${velocityMetrics.change >= 0 ? '+' : ''}${velocityMetrics.change}%</div>
                  <div style="font-size: 0.75rem; opacity: 0.8; margin-top: 0.5rem;">vs previous period</div>
                </div>
                <div style="padding: 1.25rem; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); border-radius: 12px; color: white;">
                  <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem;">Daily Average</div>
                  <div style="font-size: 2.5rem; font-weight: 700;">${velocityMetrics.avgPerDay}</div>
                  <div style="font-size: 0.75rem; opacity: 0.8; margin-top: 0.5rem;">publications/day</div>
                </div>
                <div style="padding: 1.25rem; background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); border-radius: 12px; color: white;">
                  <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem;">90-Day Projection</div>
                  <div style="font-size: 2.5rem; font-weight: 700;">${velocityMetrics.projection90Days}</div>
                  <div style="font-size: 0.75rem; opacity: 0.8; margin-top: 0.5rem;">estimated publications</div>
                </div>
              </div>
            </div>
          </div>

          <!-- NEW: Weekly Activity Heatmap -->
          <div class="chart-card full-width" style="margin-top: 2rem;">
            <div class="chart-card-header">
              <div>
                <h3 class="chart-card-title">Weekly Regulatory Activity Heatmap</h3>
                <p class="chart-card-subtitle">Authority activity patterns over the last 12 weeks - Darker = More Active</p>
              </div>
            </div>
            <div style="padding: 1.5rem; overflow-x: auto;">
              <div style="display: grid; grid-template-columns: 120px repeat(12, 1fr); gap: 4px; font-size: 0.75rem;">
                <!-- Header Row -->
                <div style="padding: 0.5rem; font-weight: 600; color: #6b7280;"></div>
                ${Object.keys(weeklyActivity).map((week, i) => `
                  <div style="padding: 0.5rem; text-align: center; font-weight: 600; color: #6b7280; writing-mode: vertical-rl; transform: rotate(180deg);">
                    ${week}
                  </div>
                `).join('')}

                <!-- Data Rows -->
                ${topAuthorities.slice(0, 10).map(auth => {
                  const weeks = Object.keys(weeklyActivity);
                  const authMax = Math.max(...weeks.map(w => weeklyActivity[w][auth.name] || 0));

                  return `
                    <div style="display: contents;">
                      <div style="padding: 0.75rem; font-weight: 500; color: #111827; background: #f9fafb; display: flex; align-items: center;">
                        ${escapeHtml(auth.name)}
                      </div>
                      ${weeks.map(week => {
                        const count = weeklyActivity[week][auth.name] || 0;
                        const intensity = authMax > 0 ? count / authMax : 0;
                        const color = intensity === 0 ? '#f3f4f6' :
                                     intensity < 0.25 ? '#dbeafe' :
                                     intensity < 0.5 ? '#93c5fd' :
                                     intensity < 0.75 ? '#3b82f6' : '#1e40af';
                        const textColor = intensity >= 0.5 ? '#ffffff' : '#1f2937';

                        return `
                          <div style="padding: 0.75rem; text-align: center; background: ${color}; color: ${textColor}; font-weight: 600; border-radius: 4px; cursor: pointer; transition: transform 0.2s;"
                               onmouseover="this.style.transform='scale(1.1)'; this.style.zIndex='10'"
                               onmouseout="this.style.transform='scale(1)'; this.style.zIndex='1'"
                               title="${auth.name} - ${week}: ${count} publications">
                            ${count > 0 ? count : '·'}
                          </div>
                        `;
                      }).join('')}
                    </div>
                  `;
                }).join('')}
              </div>
              <div style="margin-top: 1.5rem; padding: 1rem; background: #f9fafb; border-radius: 8px; display: flex; justify-content: center; align-items: center; gap: 2rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span style="font-weight: 600; color: #374151;">Intensity:</span>
                  <div style="display: flex; gap: 0.25rem; align-items: center;">
                    <div style="width: 24px; height: 24px; background: #f3f4f6; border-radius: 4px;"></div>
                    <span style="color: #6b7280; font-size: 0.75rem;">None</span>
                    <div style="width: 24px; height: 24px; background: #dbeafe; border-radius: 4px; margin-left: 0.5rem;"></div>
                    <span style="color: #6b7280; font-size: 0.75rem;">Low</span>
                    <div style="width: 24px; height: 24px; background: #93c5fd; border-radius: 4px; margin-left: 0.5rem;"></div>
                    <span style="color: #6b7280; font-size: 0.75rem;">Medium</span>
                    <div style="width: 24px; height: 24px; background: #3b82f6; border-radius: 4px; margin-left: 0.5rem;"></div>
                    <span style="color: #6b7280; font-size: 0.75rem;">High</span>
                    <div style="width: 24px; height: 24px; background: #1e40af; border-radius: 4px; margin-left: 0.5rem;"></div>
                    <span style="color: #6b7280; font-size: 0.75rem;">Very High</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- NEW: Sector-Authority Heat Map -->
          <div class="chart-card full-width" style="margin-top: 2rem;">
            <div class="chart-card-header">
              <div>
                <h3 class="chart-card-title">Sector-Authority Activity Matrix</h3>
                <p class="chart-card-subtitle">Top sector-regulator pairs by volume - Click to drill down</p>
              </div>
            </div>
            <div style="padding: 1.5rem; overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
                <thead>
                  <tr style="background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                    <th style="padding: 0.75rem; text-align: left; font-weight: 600; color: #374151;">Rank</th>
                    <th style="padding: 0.75rem; text-align: left; font-weight: 600; color: #374151;">Sector</th>
                    <th style="padding: 0.75rem; text-align: left; font-weight: 600; color: #374151;">Authority</th>
                    <th style="padding: 0.75rem; text-align: right; font-weight: 600; color: #374151;">Publications</th>
                    <th style="padding: 0.75rem; text-align: right; font-weight: 600; color: #374151;">Activity</th>
                  </tr>
                </thead>
                <tbody>
                  ${topSectorAuthorityPairs.slice(0, 15).map((pair, i) => `
                    <tr style="border-bottom: 1px solid #f3f4f6; cursor: pointer; transition: background 0.2s;"
                        onclick="drillDownPair('${escapeHtml(pair.sector)}', '${escapeHtml(pair.authority)}')"
                        onmouseover="this.style.background='#f9fafb'"
                        onmouseout="this.style.background='transparent'">
                      <td style="padding: 0.75rem;">
                        <span style="display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center; border-radius: 50%; background: ${i < 3 ? '#fef3c7' : '#f3f4f6'}; color: ${i < 3 ? '#92400e' : '#6b7280'}; font-weight: 600; font-size: 0.75rem;">
                          ${i + 1}
                        </span>
                      </td>
                      <td style="padding: 0.75rem; font-weight: 500; color: #111827;">${escapeHtml(pair.sector)}</td>
                      <td style="padding: 0.75rem; color: #6b7280;">${escapeHtml(pair.authority)}</td>
                      <td style="padding: 0.75rem; text-align: right; font-weight: 600; color: #6366f1;">${pair.count}</td>
                      <td style="padding: 0.75rem; text-align: right;">
                        <div style="background: #e0e7ff; height: 6px; border-radius: 3px; overflow: hidden;">
                          <div style="background: #6366f1; height: 100%; width: ${(pair.count / topSectorAuthorityPairs[0].count) * 100}%;"></div>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Insights Panel -->
          <div class="insights-panel">
            <h3 class="insights-title">Key Insights</h3>
            <div class="insights-grid">
              <div class="insight-item">
                <div class="insight-item-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </div>
                <div class="insight-item-title">Activity Velocity</div>
                <div class="insight-item-text">
                  ${summary.velocityChange >= 0
                    ? `Regulatory activity has increased by ${summary.velocityChange}% compared to the previous period. Stay vigilant for new requirements.`
                    : `Regulatory activity has decreased by ${Math.abs(summary.velocityChange)}% compared to the previous period.`
                  }
                </div>
              </div>
              <div class="insight-item">
                <div class="insight-item-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 8v4l2 2"/>
                  </svg>
                </div>
                <div class="insight-item-title">High Impact Focus</div>
                <div class="insight-item-text">
                  ${summary.highImpact} publications marked as high impact require immediate attention and action planning.
                </div>
              </div>
              <div class="insight-item">
                <div class="insight-item-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 4 4.5 7.5v11h15v-11L12 4z"/>
                  </svg>
                </div>
                <div class="insight-item-title">Regulator Coverage</div>
                <div class="insight-item-text">
                  Monitoring ${summary.activeAuthorities} active regulators across ${summary.activeSectors} sectors for comprehensive coverage.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Drill-down Modal -->
      <div id="drilldownModal" class="drilldown-modal" onclick="if(event.target === this) closeDrilldown()">
        <div class="drilldown-content">
          <div class="drilldown-header">
            <h3 id="drilldownTitle">Publications</h3>
            <button class="drilldown-close" onclick="closeDrilldown()">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="drilldown-body">
            <div id="drilldownContent" class="drilldown-list"></div>
          </div>
        </div>
      </div>

      ${clientScripts}
      ${getRegulatoryAnalyticsScripts({
        monthlyChartData,
        topAuthorities,
        impactDistribution,
        safeUpdates,
        sectorBurden,
        impactTrends,
        authorityComparison
      })}
    </body>
    </html>
  `
}

function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function renderAnalyticsError(error) {
  return `
    <!DOCTYPE html>
    <html>
      <head><title>Error - Regulatory Analytics</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>Error Loading Analytics</h1>
        <p>Unable to load the regulatory analytics dashboard. Please try refreshing.</p>
        <p><a href="/regulatory-analytics">Try Again</a></p>
        <small>Error: ${error.message}</small>
      </body>
    </html>
  `
}

module.exports = { buildAnalyticsPage, renderAnalyticsError }
