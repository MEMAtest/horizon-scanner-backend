function renderTrendsSection() {
  return `
    <div class="dashboard-section">
      <div class="section-header">
        <h2 class="section-title">
          <span class="section-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 18h16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>
              <path d="M5 14l4-5 4 4 6-7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
          </span>
          Enforcement Trends
        </h2>
        <div>
          <select class="filter-input" id="trends-period">
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      <div class="trends-toolbar">
        <div class="trend-search-group">
          <label for="trend-search" class="trend-search-label">Search trends</label>
          <input type="search" id="trend-search" class="trend-search-input" placeholder="e.g. 2024 or &pound;50m" autocomplete="off" />
        </div>
      </div>

      <div id="trends-container">
        <div class="trends-chart">
          <p>Trends chart will load here</p>
        </div>
      </div>
    </div>
  `
}

module.exports = {
  renderTrendsSection
}
