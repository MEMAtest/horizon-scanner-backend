/**
 * Deep Insights Section
 * Comprehensive enforcement intelligence for compliance teams
 */

function renderInsightsSection() {
  return `
    <section class="deep-insights-section" id="deep-insights-section">
      <!-- Section Header -->
      <div class="deep-insights-header">
        <div class="header-content">
          <h2 class="deep-insights-title">Enforcement Intelligence</h2>
          <p class="deep-insights-subtitle">Deep analysis of FCA enforcement history with real examples</p>
        </div>
        <div class="insights-tabs">
          <button class="insight-tab active" data-tab="overview">Overview</button>
          <button class="insight-tab" data-tab="yearly">By Year</button>
          <button class="insight-tab" data-tab="reoffenders">Repeat Offenders</button>
          <button class="insight-tab" data-tab="cases">Case Studies</button>
          <button class="insight-tab" data-tab="breaches">Breach Analysis</button>
          <button class="insight-tab" data-tab="handbook">Handbook</button>
        </div>
      </div>

      <!-- Tab Content Panels -->
      <div class="insights-tab-content">

        <!-- OVERVIEW TAB -->
        <div class="tab-panel active" id="overview-panel">
          <!-- Quick Stats Row -->
          <div class="quick-stats-row">
            <div class="quick-stat">
              <span class="quick-stat-value" id="total-cases-stat">-</span>
              <span class="quick-stat-label">Enforcement Actions</span>
            </div>
            <div class="quick-stat">
              <span class="quick-stat-value" id="top-outcome-stat">-</span>
              <span class="quick-stat-label">Most Common Outcome</span>
            </div>
            <div class="quick-stat">
              <span class="quick-stat-value" id="total-fines-stat">-</span>
              <span class="quick-stat-label">Total Fines</span>
            </div>
            <div class="quick-stat">
              <span class="quick-stat-value" id="top-breach-stat">-</span>
              <span class="quick-stat-label">Top Breach Type</span>
            </div>
          </div>

          <!-- Charts Section (moved from main layout) -->
          <div class="widgets-row widgets-row-single">
            <div class="widget-card widget-card-wide">
              <div class="widget-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <h3>Recent Enforcement Actions</h3>
              </div>
              <div class="widget-content" id="recent-notices-list">
                <div class="loading-widget">Loading...</div>
              </div>
            </div>
          </div>

          <div class="charts-grid">
            <!-- Outcome Distribution Chart -->
            <div class="chart-card">
              <div class="chart-header">
                <div>
                  <h3 class="chart-title">Outcome Distribution</h3>
                  <span class="chart-subtitle">By enforcement outcome type</span>
                </div>
                <div class="chart-filters chart-filters-mini">
                  <select id="outcome-year-filter" class="chart-filter-select">
                    <option value="">All Years</option>
                  </select>
                </div>
                <div class="chart-callout" id="outcome-callout"></div>
              </div>
              <div class="chart-wrapper">
                <canvas id="outcomeChart"></canvas>
              </div>
            </div>

            <!-- Breach Categories Chart -->
            <div class="chart-card">
              <div class="chart-header">
                <div>
                  <h3 class="chart-title">Breach Categories</h3>
                  <span class="chart-subtitle">Primary breach type breakdown</span>
                </div>
                <div class="chart-filters chart-filters-mini">
                  <select id="breach-year-filter" class="chart-filter-select">
                    <option value="">All Years</option>
                  </select>
                </div>
                <div class="chart-callout" id="breach-callout"></div>
              </div>
              <div class="chart-wrapper">
                <canvas id="breachChart"></canvas>
              </div>
            </div>

            <!-- Risk Score Distribution -->
            <div class="chart-card">
              <div class="chart-header">
                <div>
                  <h3 class="chart-title">Risk Score Distribution</h3>
                  <span class="chart-subtitle">Notices by risk level</span>
                </div>
                <div class="chart-callout" id="risk-callout"></div>
              </div>
              <div class="chart-wrapper">
                <canvas id="riskChart"></canvas>
              </div>
            </div>

            <!-- Processing Status Chart -->
            <div class="chart-card">
              <div class="chart-header">
                <div>
                  <h3 class="chart-title">Processing Status</h3>
                  <span class="chart-subtitle">Pipeline progress</span>
                </div>
                <div class="chart-callout" id="status-callout"></div>
              </div>
              <div class="chart-wrapper">
                <canvas id="statusChart"></canvas>
              </div>
            </div>
          </div>

          <!-- Outcome Analysis (Full Width) -->
          <div class="deep-card outcome-analysis-card">
            <div class="deep-card-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 20V10M12 20V4M6 20v-6"/>
              </svg>
              <h3>Enforcement Outcomes - What Actions Does FCA Take?</h3>
              <span class="header-subtitle">Understanding the types of regulatory enforcement</span>
            </div>
            <div class="deep-card-body">
              <div class="outcome-analysis-grid" id="outcome-analysis-grid">
                <div class="loading-deep">Loading outcome analysis...</div>
              </div>
              <div class="outcome-insight-box" id="outcome-insight-box">
                <!-- Populated by JS -->
              </div>
            </div>
          </div>

          <!-- Enforcement Risk Indicators -->
          <div class="overview-grid">
            <!-- Risk Indicators Section -->
            <div class="deep-card risk-indicators-card">
              <div class="deep-card-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <h3>Enforcement Risk Indicators</h3>
                <span class="header-subtitle">High-risk behaviors that commonly trigger FCA action</span>
              </div>
              <div class="deep-card-body">
                <div class="risk-indicators-list" id="risk-indicators-list">
                  <div class="loading-deep">Loading risk indicators...</div>
                </div>
              </div>
            </div>

            <!-- Common Findings -->
            <div class="deep-card common-findings">
              <div class="deep-card-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
                <h3>Most Common Findings</h3>
              </div>
              <div class="deep-card-body">
                <div class="findings-list" id="common-findings-list">
                  <div class="loading-deep">Analyzing patterns...</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Key Takeaways (Only in Overview) -->
          <div class="deep-card takeaways-deep">
            <div class="deep-card-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <h3>Key Takeaways for Compliance Teams</h3>
            </div>
            <div class="deep-card-body">
              <div class="takeaways-deep-grid" id="takeaways-deep-grid">
                <div class="loading-deep">Generating insights...</div>
              </div>
            </div>
          </div>

          <!-- Table Section (moved from main layout) -->
          <div class="table-section">
            <div class="table-header">
              <h2 class="section-title">Enforcement Notices</h2>
              <p class="section-subtitle">AI-processed FCA publications</p>
            </div>

            <!-- Filters -->
            <div class="filters-row">
              <div class="filter-group filter-group-search">
                <label for="search-input">Search</label>
                <input type="text" id="search-input" class="filter-input" placeholder="Search by firm or individual name...">
              </div>
              <div class="filter-group">
                <label for="outcome-filter">Outcome Type</label>
                <select id="outcome-filter" class="filter-select">
                  <option value="">All Outcomes</option>
                  <option value="cancellation">Cancellation</option>
                  <option value="prohibition">Prohibition</option>
                  <option value="fine">Fine</option>
                  <option value="restriction">Restriction</option>
                  <option value="censure">Public Censure</option>
                  <option value="public_statement">Public Statement</option>
                  <option value="warning">Warning</option>
                  <option value="supervisory_notice">Supervisory Notice</option>
                  <option value="voluntary_requirement">Voluntary Requirement</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div class="filter-group">
                <label for="breach-filter">Breach Category</label>
                <select id="breach-filter" class="filter-select">
                  <option value="">All Categories</option>
                  <option value="PRINCIPLES">Principles</option>
                  <option value="AML">Anti-Money Laundering</option>
                  <option value="SYSTEMS_CONTROLS">Systems & Controls</option>
                  <option value="MARKET_ABUSE">Market Abuse</option>
                  <option value="MIS_SELLING">Mis-selling</option>
                  <option value="CLIENT_MONEY">Client Money</option>
                  <option value="CONDUCT">Conduct</option>
                  <option value="PRUDENTIAL">Prudential</option>
                  <option value="REPORTING">Reporting</option>
                  <option value="GOVERNANCE">Governance</option>
                  <option value="FINANCIAL_CRIME">Financial Crime</option>
                  <option value="COMPLAINTS">Complaints</option>
                  <option value="FINANCIAL_PROMOTIONS">Financial Promotions</option>
                  <option value="APPROVED_PERSONS">Approved Persons</option>
                </select>
              </div>
              <div class="filter-group">
                <label for="risk-filter">Risk Level</label>
                <select id="risk-filter" class="filter-select">
                  <option value="">All Levels</option>
                  <option value="high">High (70+)</option>
                  <option value="medium">Medium (40-69)</option>
                  <option value="low">Low (0-39)</option>
                </select>
              </div>
              <div class="filter-actions">
                <button class="btn btn-secondary" id="reset-filters">Reset</button>
                <button class="btn btn-primary" id="apply-filters">Apply</button>
              </div>
            </div>

            <!-- Results count -->
            <div class="results-info" id="results-info">
              <span id="results-count">Loading...</span>
            </div>

            <!-- Table -->
            <div class="table-wrapper">
              <table class="data-table" id="notices-table">
                <thead>
                  <tr>
                    <th class="sortable" data-sort="entity_name">Entity Name</th>
                    <th class="sortable" data-sort="frn">FRN</th>
                    <th class="sortable" data-sort="outcome_type">Outcome</th>
                    <th class="sortable" data-sort="fine_amount">Fine Amount</th>
                    <th class="sortable" data-sort="primary_breach_type">Breach Type</th>
                    <th class="sortable" data-sort="risk_score">Risk Score</th>
                    <th class="sortable" data-sort="notice_date">Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="notices-tbody">
                  <tr class="loading-row">
                    <td colspan="8">
                      <div class="loading-state">
                        <div class="loading-spinner"></div>
                        <span>Loading notices...</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            <div class="pagination" id="pagination">
              <div class="pagination-info">
                <span id="pagination-showing">Showing 0-0 of 0</span>
              </div>
              <div class="pagination-controls">
                <button class="pagination-btn" id="prev-page" disabled>&larr; Previous</button>
                <span class="pagination-pages" id="page-numbers"></span>
                <button class="pagination-btn" id="next-page">Next &rarr;</button>
              </div>
              <div class="pagination-size">
                <label for="page-size">Per page:</label>
                <select id="page-size" class="pagination-select">
                  <option value="10">10</option>
                  <option value="20" selected>20</option>
                  <option value="50">50</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Detail Modal -->
          <div class="modal-overlay" id="detail-modal" style="display: none;">
            <div class="modal-content">
              <div class="modal-header">
                <h2 class="modal-title" id="modal-entity-name">Entity Details</h2>
                <button class="modal-close" id="close-modal">&times;</button>
              </div>
              <div class="modal-body" id="modal-body">
                <!-- Populated by JS -->
              </div>
            </div>
          </div>
        </div>

        <!-- YEARLY TAB -->
        <div class="tab-panel" id="yearly-panel">
          <div class="yearly-breakdown-container">
            <!-- Year Summary Stats -->
            <div class="year-summary-stats" id="year-summary-stats">
              <div class="year-stat">
                <span class="year-stat-value" id="years-covered">-</span>
                <span class="year-stat-label">Years of Data</span>
              </div>
              <div class="year-stat">
                <span class="year-stat-value" id="peak-year">-</span>
                <span class="year-stat-label">Peak Enforcement Year</span>
              </div>
              <div class="year-stat">
                <span class="year-stat-value" id="peak-fines-year">-</span>
                <span class="year-stat-label">Highest Fines Year</span>
              </div>
            </div>

            <!-- Year Detail Panel (shown when a year is selected) - POSITIONED ABOVE GRID -->
            <div class="year-detail-panel" id="year-detail-panel" style="display: none;">
              <div class="year-detail-header">
                <h3 class="year-detail-title">
                  <span id="year-detail-year">2024</span> Enforcement Activity
                </h3>
                <button class="year-detail-close" id="close-year-detail">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <!-- Monthly Timeline Bar -->
              <div class="year-timeline-section" id="year-timeline-section">
                <div class="timeline-label">Monthly Activity</div>
                <div class="year-timeline-bar" id="year-timeline-bar">
                  <div class="timeline-month" data-month="1"><span>J</span></div>
                  <div class="timeline-month" data-month="2"><span>F</span></div>
                  <div class="timeline-month" data-month="3"><span>M</span></div>
                  <div class="timeline-month" data-month="4"><span>A</span></div>
                  <div class="timeline-month" data-month="5"><span>M</span></div>
                  <div class="timeline-month" data-month="6"><span>J</span></div>
                  <div class="timeline-month" data-month="7"><span>J</span></div>
                  <div class="timeline-month" data-month="8"><span>A</span></div>
                  <div class="timeline-month" data-month="9"><span>S</span></div>
                  <div class="timeline-month" data-month="10"><span>O</span></div>
                  <div class="timeline-month" data-month="11"><span>N</span></div>
                  <div class="timeline-month" data-month="12"><span>D</span></div>
                </div>
              </div>

              <!-- Year Summary Narrative -->
              <div class="year-detail-summary" id="year-detail-summary">
                <!-- AI-generated or pre-generated summary text goes here -->
              </div>

              <!-- Year Stats Row -->
              <div class="year-detail-stats" id="year-detail-stats">
                <div class="year-detail-stat">
                  <span class="stat-value" id="year-detail-actions">-</span>
                  <span class="stat-label">Enforcement Actions</span>
                </div>
                <div class="year-detail-stat">
                  <span class="stat-value" id="year-detail-fines">-</span>
                  <span class="stat-label">Total Fines</span>
                </div>
                <div class="year-detail-stat">
                  <span class="stat-value" id="year-detail-cases-with-fines">-</span>
                  <span class="stat-label">Cases with Fines</span>
                </div>
                <div class="year-detail-stat">
                  <span class="stat-value" id="year-detail-avg-fine">-</span>
                  <span class="stat-label">Avg Fine</span>
                </div>
              </div>

              <!-- Biggest Case Highlight -->
              <div class="year-detail-biggest" id="year-detail-biggest" style="display: none;">
                <h4>Largest Fine of the Year</h4>
                <div class="biggest-case-card">
                  <span class="biggest-entity" id="year-detail-biggest-entity">-</span>
                  <span class="biggest-amount" id="year-detail-biggest-amount">-</span>
                  <span class="biggest-breach" id="year-detail-biggest-breach">-</span>
                </div>
              </div>

              <!-- Charts Grid -->
              <div class="year-detail-charts">
                <div class="year-chart-card">
                  <h4>Monthly Activity</h4>
                  <div class="chart-wrapper">
                    <canvas id="year-page-monthly-chart"></canvas>
                  </div>
                </div>
                <div class="year-chart-card">
                  <h4>Outcome Distribution</h4>
                  <div class="chart-wrapper">
                    <canvas id="year-page-outcome-chart"></canvas>
                  </div>
                </div>
                <div class="year-chart-card">
                  <h4>Breach Types</h4>
                  <div class="chart-wrapper">
                    <canvas id="year-page-breach-chart"></canvas>
                  </div>
                </div>
                <div class="year-chart-card">
                  <h4>Year-over-Year Comparison</h4>
                  <div class="chart-wrapper">
                    <canvas id="year-page-comparison-chart"></canvas>
                  </div>
                </div>
              </div>
            </div>

            <!-- Yearly Breakdown Grid -->
            <div class="yearly-breakdown-grid" id="yearly-breakdown-grid">
              <div class="loading-deep">Loading yearly breakdown...</div>
            </div>
          </div>
        </div>

        <!-- REOFFENDERS TAB -->
        <div class="tab-panel" id="reoffenders-panel">
          <div class="reoffenders-container">
            <!-- Reoffenders Summary -->
            <div class="reoffenders-summary" id="reoffenders-summary">
              <div class="reoffender-stat">
                <span class="reoffender-stat-value" id="total-reoffenders">-</span>
                <span class="reoffender-stat-label">Repeat Offenders</span>
              </div>
              <div class="reoffender-stat">
                <span class="reoffender-stat-value" id="max-offences">-</span>
                <span class="reoffender-stat-label">Most Actions (Single Entity)</span>
              </div>
              <div class="reoffender-stat">
                <span class="reoffender-stat-value" id="total-reoffender-fines">-</span>
                <span class="reoffender-stat-label">Total Reoffender Fines</span>
              </div>
            </div>

            <!-- Reoffenders Table -->
            <div class="deep-card reoffenders-table-card">
              <div class="deep-card-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <h3>Entities with Multiple Enforcement Actions</h3>
                <span class="header-subtitle">Click any row to view full enforcement history</span>
              </div>
              <div class="deep-card-body">
                <div class="reoffenders-table-container">
                  <table class="reoffenders-table data-table" id="reoffenders-table">
                    <thead>
                      <tr>
                        <th class="sortable" data-sort="entity">Entity</th>
                        <th class="sortable sort-desc" data-sort="actions">Actions</th>
                        <th class="sortable" data-sort="fines">Total Fines</th>
                        <th class="sortable" data-sort="years">Years</th>
                        <th>Breach Types</th>
                      </tr>
                    </thead>
                    <tbody id="reoffenders-tbody">
                      <tr><td colspan="5" class="loading-deep">Loading...</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <!-- Entity History Modal -->
          <div class="entity-history-modal" id="entity-history-modal" style="display: none;">
            <div class="entity-history-content">
              <button class="modal-close-btn" id="close-entity-history">&times;</button>
              <div class="entity-history-header" id="entity-history-header">
                <!-- Populated by JS -->
              </div>
              <div class="entity-history-timeline" id="entity-history-timeline">
                <!-- Populated by JS -->
              </div>
            </div>
          </div>
        </div>

        <!-- CASE STUDIES TAB -->
        <div class="tab-panel" id="cases-panel">
          <div class="case-study-container">
            <!-- Case Study Spotlight -->
            <div class="case-study-spotlight" id="case-study-spotlight">
              <div class="loading-deep">Loading case studies...</div>
            </div>

            <!-- Case Study Navigation -->
            <div class="case-study-nav">
              <button class="case-nav-btn" id="prev-case" disabled>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
              <div class="case-dots" id="case-dots"></div>
              <button class="case-nav-btn" id="next-case">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- BREACH ANALYSIS TAB -->
        <div class="tab-panel" id="breaches-panel">
          <div class="breach-analysis-container">
            <!-- Breach Analysis Charts -->
            <div class="breach-charts-row" id="breach-charts-row">
              <div class="breach-chart-card">
                <h4>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="7" height="7"/>
                    <rect x="14" y="3" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/>
                  </svg>
                  Breach Type Distribution
                </h4>
                <div class="chart-wrapper">
                  <canvas id="breach-treemap-chart"></canvas>
                </div>
              </div>
              <div class="breach-chart-card">
                <h4>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="20" x2="12" y2="10"/>
                    <line x1="18" y1="20" x2="18" y2="4"/>
                    <line x1="6" y1="20" x2="6" y2="16"/>
                  </svg>
                  Total Fines by Breach Type
                </h4>
                <div class="chart-wrapper">
                  <canvas id="breach-fines-bar-chart"></canvas>
                </div>
              </div>
            </div>

            <!-- Breach Type Cards -->
            <div class="breach-type-grid" id="breach-type-grid">
              <div class="loading-deep">Loading breach analysis...</div>
            </div>

            <!-- Expanded Breach Detail (hidden by default) -->
            <div class="breach-detail-panel" id="breach-detail-panel" style="display: none;">
              <button class="close-detail-btn" id="close-breach-detail">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
              <div class="breach-detail-content" id="breach-detail-content">
                <!-- Populated by JS -->
              </div>
            </div>
          </div>
        </div>

        <!-- HANDBOOK TAB -->
        <div class="tab-panel" id="handbook-panel">
          <div class="handbook-container">
            <!-- Handbook Reference Heatmap -->
            <div class="deep-card handbook-heatmap">
              <div class="deep-card-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
                </svg>
                <h3>FCA Handbook Breaches</h3>
                <span class="header-subtitle">Most frequently cited references</span>
              </div>
              <div class="deep-card-body">
                <div class="handbook-bars" id="handbook-bars">
                  <div class="loading-deep">Loading handbook analysis...</div>
                </div>
              </div>
            </div>

            <!-- Handbook Insight -->
            <div class="handbook-insight-box" id="handbook-insight">
              <!-- Populated by JS -->
            </div>
          </div>
        </div>

      </div>
    </section>
  `
}

module.exports = { renderInsightsSection }
