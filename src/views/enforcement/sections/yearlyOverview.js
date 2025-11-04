function renderYearlyOverviewSection() {
  return `
    <div class="dashboard-section" id="yearly-overview-section">
      <div class="section-header">
        <h2 class="section-title">
          <span class="section-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="4" y="5" width="16" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"></rect>
              <path d="M8 3.5v3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>
              <path d="M16 3.5v3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>
              <path d="M4 10h16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>
            </svg>
          </span>
          Year-over-Year Trend
        </h2>
        <div class="section-context" id="yearly-context">Preparing yearly analysis...</div>
      </div>
      <div class="chart-wrapper">
        <canvas id="yearlyTrendChart"></canvas>
      </div>
      <div id="yearly-table-container" class="table-wrapper compact-table"></div>
    </div>
  `
}

module.exports = {
  renderYearlyOverviewSection
}
