function renderHeaderSection(metaHtml) {
  return `
    <header class="report-header">
      <div class="report-header-content">
        <div class="report-title-section">
          <span class="report-badge">Weekly Briefing</span>
          <div class="report-meta" id="briefingMeta">
            ${metaHtml}
          </div>
        </div>
        <div class="report-actions">
          <button class="btn btn-pill btn-primary" id="assembleBtn" type="button">
            <span class="btn-icon" aria-hidden="true">⚡</span>
            <span class="btn-label">Assemble Briefing</span>
          </button>
          <button class="btn btn-pill btn-soft" id="refreshBtn" type="button">
            <span class="btn-icon" aria-hidden="true">🔄</span>
            <span class="btn-label">Refresh Data</span>
          </button>
          <button class="btn btn-pill btn-ghost" id="printBtn" type="button">
            <span class="btn-icon" aria-hidden="true">🖨️</span>
            <span class="btn-label">Print Report</span>
          </button>
        </div>
      </div>
      <div class="run-status" id="runStatus"></div>
    </header>
    <div id="statusToast" class="status-banner"></div>
  `
}

module.exports = {
  renderHeaderSection
}
