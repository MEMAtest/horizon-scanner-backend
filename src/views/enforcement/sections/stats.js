function renderStatsSection() {
  return `
    <div class="stats-grid" id="stats-container">
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading enforcement statistics...</p>
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
