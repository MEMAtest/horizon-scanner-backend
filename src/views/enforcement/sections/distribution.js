function renderDistributionSection() {
  return `
    <div class="dashboard-section" id="distribution-section">
      <div class="section-header">
        <h2 class="section-title">
          <span class="section-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="12" width="4" height="9" rx="1" fill="none" stroke="currentColor" stroke-width="1.6"></rect>
              <rect x="10" y="8" width="4" height="13" rx="1" fill="none" stroke="currentColor" stroke-width="1.6"></rect>
              <rect x="17" y="4" width="4" height="17" rx="1" fill="none" stroke="currentColor" stroke-width="1.6"></rect>
            </svg>
          </span>
          Fine Amount Distribution
        </h2>
        <div class="section-context" id="distribution-context">Analyzing fine amounts...</div>
      </div>
      <div class="chart-wrapper">
        <canvas id="distributionChart"></canvas>
      </div>
      <div class="section-footnote">
        Click a bar to filter the dashboard by that amount range
      </div>
    </div>
  `
}

module.exports = {
  renderDistributionSection
}
