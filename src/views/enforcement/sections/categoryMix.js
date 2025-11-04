function renderCategoryMixSection() {
  return `
    <div class="dashboard-section" id="category-mix-section">
      <div class="section-header">
        <h2 class="section-title">
          <span class="section-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 11h16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>
              <path d="M4 7h12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>
              <path d="M4 15h8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>
              <circle cx="18" cy="7" r="2" fill="none" stroke="currentColor" stroke-width="1.6"></circle>
              <circle cx="16" cy="15" r="2" fill="none" stroke="currentColor" stroke-width="1.6"></circle>
              <circle cx="20" cy="11" r="2" fill="none" stroke="currentColor" stroke-width="1.6"></circle>
            </svg>
          </span>
          Category Mix Focus
        </h2>
        <div class="section-context" id="category-context">Highlighting the busiest breach themes.</div>
      </div>
      <div class="chart-wrapper">
        <canvas id="categoryTrendChart"></canvas>
      </div>
      <div id="category-trend-summary" class="category-summary"></div>
    </div>
  `
}

module.exports = {
  renderCategoryMixSection
}
