function renderHeaderSection() {
  return `
    <header class="enforcement-header">
      <div class="header-title">
        <span class="title-icon">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3v16"></path>
            <path d="M5 7h14"></path>
            <path d="M7 7 4 13h6l-3-6z"></path>
            <path d="M17 7 14 13h6l-3-6z"></path>
          </svg>
        </span>
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
    </header>
  `
}

module.exports = {
  renderHeaderSection
}
