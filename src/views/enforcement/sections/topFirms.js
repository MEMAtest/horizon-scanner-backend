function renderTopFirmsSection() {
  return `
    <div class="dashboard-section">
      <div class="section-header">
        <h2 class="section-title">
          <span class="section-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 20h14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>
              <path d="M6 20V8l6-4 6 4v12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"></path>
              <path d="M10 20v-5h4v5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
          </span>
          Top Fined Firms
        </h2>
      </div>

      <div class="top-firms-toolbar">
        <div class="trend-search-group">
          <label for="top-firm-search" class="trend-search-label">Search firms</label>
          <input type="search" id="top-firm-search" class="trend-search-input" placeholder="e.g. HSBC or &pound;200m" autocomplete="off" />
        </div>
      </div>

      <div id="top-firms-container">
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <p>Loading top fined firms...</p>
        </div>
      </div>
    </div>
  `
}

module.exports = {
  renderTopFirmsSection
}
