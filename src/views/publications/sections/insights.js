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
