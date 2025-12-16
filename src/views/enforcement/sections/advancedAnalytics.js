/**
 * Advanced Analytics Section
 * Container for all advanced analytics features
 */

function renderAdvancedAnalyticsSection() {
  // Generate year options (2013 to current year)
  const currentYear = new Date().getFullYear()
  const years = []
  for (let year = currentYear; year >= 2013; year--) {
    years.push(year)
  }

  const yearOptions = years.map(year => `<option value="${year}">${year}</option>`).join('')

  return `
    <div class="dashboard-section advanced-analytics-section" id="advanced-analytics">
      <div class="section-header">
        <h2 class="section-title">
          <span class="section-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
          </span>
          Advanced Analytics
        </h2>
        <button class="btn-secondary" id="toggle-advanced-analytics">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
          </svg>
          Expand
        </button>
      </div>

      <div class="advanced-analytics-content" id="advanced-analytics-content" style="display: none;">
        <div class="analytics-grid">

          <!-- Year Deep-Dive Module -->
          <div class="analytics-module year-summary-module">
            <div class="module-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <h3>Year Deep-Dive Analysis</h3>
            </div>
            <p class="module-description">Comprehensive breakdown of enforcement activity for a specific year</p>
            <div class="module-controls">
              <select class="analytics-select" id="year-summary-selector">
                <option value="">Select year...</option>
                ${yearOptions}
              </select>
              <button class="btn-primary" id="open-year-summary" disabled>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                View Analysis
              </button>
            </div>
          </div>

          <!-- Distribution Chart Module -->
          <div class="analytics-module distribution-module">
            <div class="module-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="20" x2="12" y2="10"></line>
                <line x1="18" y1="20" x2="18" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="16"></line>
              </svg>
              <h3>Fine Amount Distribution</h3>
            </div>
            <p class="module-description">See the distribution section above for interactive chart</p>
            <button class="btn-secondary scroll-to-section" data-target="distribution-section">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
              Scroll to Distribution
            </button>
          </div>

          <!-- Heatmap Module -->
          <div class="analytics-module heatmap-module">
            <div class="module-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              <h3>Breach Category Heatmap</h3>
            </div>
            <p class="module-description">See the heatmap section above for interactive visualization</p>
            <button class="btn-secondary scroll-to-section" data-target="heatmap-section">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
              Scroll to Heatmap
            </button>
          </div>

          <!-- Firm Comparison Module -->
          <div class="analytics-module firm-comparison-module">
            <div class="module-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <h3>Firm Comparison</h3>
            </div>
            <p class="module-description">Compare enforcement metrics across multiple firms (max 3)</p>

            <!-- Firm Search -->
            <div class="firm-search-container">
              <input
                type="text"
                id="firm-comparison-search"
                class="firm-search-input"
                placeholder="Search for a firm..."
                autocomplete="off"
              />
              <div id="firm-search-results" class="firm-search-results"></div>
            </div>

            <!-- Selected Firms -->
            <div id="selected-firms-chips" class="selected-firms-chips">
              <div class="no-firms-selected">Select up to 3 firms to compare</div>
            </div>

            <!-- Action Buttons -->
            <div class="firm-comparison-actions">
              <button class="btn-primary" id="compare-firms-btn" disabled>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="20" x2="12" y2="10"></line>
                  <line x1="18" y1="20" x2="18" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="16"></line>
                </svg>
                Compare Firms
              </button>
              <button class="btn-secondary" id="clear-comparison-btn">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                </svg>
                Clear
              </button>
            </div>

            <!-- Comparison Results -->
            <div id="comparison-results" style="display: none;"></div>
          </div>

          <!-- Top Offenders Leaderboard Module -->
          <div class="analytics-module leaderboard-module">
            <div class="module-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 15l-2 5l9-10H6l9-10l-2 5h6"/>
              </svg>
              <h3>Top Offenders Leaderboard</h3>
            </div>
            <p class="module-description">Firms ranked by total enforcement exposure with percentile tiers</p>

            <div class="leaderboard-controls">
              <button class="btn-primary" id="load-leaderboard-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="20" x2="12" y2="10"></line>
                  <line x1="18" y1="20" x2="18" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="16"></line>
                </svg>
                View Leaderboard
              </button>
            </div>

            <div id="leaderboard-results" style="display: none;"></div>
          </div>

          <!-- Sector Bubble Chart Module -->
          <div class="analytics-module bubble-chart-module">
            <div class="module-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="6"></circle>
                <circle cx="12" cy="12" r="2"></circle>
              </svg>
              <h3>Sector Enforcement Map</h3>
            </div>
            <p class="module-description">Interactive bubble chart showing sector enforcement patterns. Click a bubble to filter dashboard by sector.</p>

            <div class="bubble-chart-controls">
              <button class="btn-primary" id="load-bubble-chart-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                </svg>
                Load Sector Map
              </button>
            </div>

            <div id="bubble-chart-container" style="display: none;">
              <div class="bubble-chart-wrapper">
                <canvas id="sector-bubble-chart"></canvas>
              </div>
              <div class="bubble-chart-legend" id="bubble-chart-legend"></div>
            </div>
          </div>

          <!-- Sector Historical Trends Module -->
          <div class="analytics-module sector-trends-module full-width">
            <div class="module-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
              <h3>Sector Historical Trends</h3>
            </div>
            <p class="module-description">Track how enforcement activity has evolved across different sectors over time. Shows the top 10 sectors by total fines.</p>

            <div class="sector-trends-controls">
              <div class="trend-metric-toggle">
                <button class="metric-btn active" data-metric="amount">Total Amount</button>
                <button class="metric-btn" data-metric="count">Fine Count</button>
              </div>
              <button class="btn-primary" id="load-sector-trends-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
                Load Trends
              </button>
            </div>

            <div id="sector-trends-container" style="display: none;">
              <div class="sector-trends-chart-wrapper">
                <canvas id="sector-trends-chart"></canvas>
              </div>
              <div class="sector-trends-legend" id="sector-trends-legend"></div>
              <div class="sector-trends-summary" id="sector-trends-summary"></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `
}

module.exports = {
  renderAdvancedAnalyticsSection
}
