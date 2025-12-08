function renderStatsSection() {
  return `
    <div class="latest-fine-highlight" id="latest-fine-highlight">
      <div class="loading-state">Loading latest fine...</div>
    </div>
    <div class="stats-grid" id="stats-container">
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading enforcement statistics...</p>
      </div>
    </div>
    <div class="fines-timeline-section" id="fines-timeline-container">
      <h3 class="timeline-title">Fines Over Time</h3>
      <div class="timeline-bars" id="timeline-bars">
        <div class="loading-state">Loading timeline...</div>
      </div>
    </div>
  `
}

function renderPatternSection() {
  return '<div class="pattern-grid" id="pattern-container"></div>'
}

module.exports = {
  renderPatternSection,
  renderStatsSection
}
