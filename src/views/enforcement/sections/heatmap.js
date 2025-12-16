function renderHeatmapSection() {
  return `
    <div class="dashboard-section" id="heatmap-section">
      <div class="section-header">
        <h2 class="section-title">
          <span class="section-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" rx="1" fill="none" stroke="currentColor" stroke-width="1.6"></rect>
              <rect x="13" y="3" width="7" height="7" rx="1" fill="none" stroke="currentColor" stroke-width="1.6"></rect>
              <rect x="3" y="13" width="7" height="7" rx="1" fill="none" stroke="currentColor" stroke-width="1.6"></rect>
              <rect x="13" y="13" width="7" height="7" rx="1" fill="none" stroke="currentColor" stroke-width="1.6"></rect>
            </svg>
          </span>
          Breach Category Heatmap
        </h2>
        <div class="section-context" id="heatmap-context">Analyzing breach patterns...</div>
      </div>
      <div class="chart-wrapper" style="height: 400px;">
        <canvas id="heatmapChart"></canvas>
      </div>
      <div id="heatmap-legend" class="heatmap-legend-container"></div>
      <div class="section-footnote">
        Click any cell to filter by both year and category
      </div>
    </div>
  `
}

module.exports = {
  renderHeatmapSection
}
