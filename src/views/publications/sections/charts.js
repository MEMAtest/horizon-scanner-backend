function renderChartsSection() {
  return `
    <!-- Recent Enforcement Widget -->
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
  `
}

module.exports = { renderChartsSection }
