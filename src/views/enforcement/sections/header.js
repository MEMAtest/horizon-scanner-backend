const { getEnforcementIcon, wrapIconInContainer, getCanaryAnimationStyles } = require('../../icons')

function renderHeaderSection() {
  const canaryStyles = getCanaryAnimationStyles()
  const pageIcon = wrapIconInContainer(getEnforcementIcon())

  return `
    <style>${canaryStyles}</style>
    <header class="enforcement-header">
      <div class="header-title">
        ${pageIcon}
        <div>
          <h1>FCA Enforcement Dashboard</h1>
          <p class="enforcement-subtitle">
            Comprehensive analysis of Financial Conduct Authority enforcement actions, fines, and regulatory penalties
          </p>
        </div>
      </div>
      <div class="header-meta">
        <div class="meta-item status">
          <span class="meta-label">Status</span>
          <span class="meta-value">
            <span class="status-dot"></span>
            <span id="status-value">Active</span>
          </span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Updated</span>
          <span class="meta-value" id="last-update">Loading...</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Coverage</span>
          <span class="meta-value" id="data-coverage">Full dataset</span>
        </div>
      </div>
      <div id="chart-filter-badge-container" class="chart-filter-badge-container"></div>
    </header>
  `
}

module.exports = {
  renderHeaderSection
}
