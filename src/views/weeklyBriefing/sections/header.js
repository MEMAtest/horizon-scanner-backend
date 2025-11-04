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
          <button class="btn btn-secondary btn-sm" id="printBtn" onclick="window.print()">
            <span>🖨️</span> Print Report
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
