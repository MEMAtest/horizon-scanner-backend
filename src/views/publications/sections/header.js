const { wrapIconInContainer, getPageIcon } = require('../../icons/pageIcons')
const { getRegNoticesCanary } = require('../../icons/canaryBase')

function renderHeaderSection() {
  const pageIcon = wrapIconInContainer(getRegNoticesCanary())

  return `
    <header class="reg-notices-header">
      <div class="header-copy">
        ${pageIcon}
        <div class="header-copy-text">
          <h1>Regulatory Notices</h1>
          <p class="subtitle">FCA enforcement actions and outcomes</p>
        </div>
      </div>
      <div class="header-actions">
        <div class="pipeline-status" id="pipeline-status">
          <span class="status-indicator"></span>
          <span class="status-text" id="pipeline-status-value">Loading...</span>
        </div>
        <button class="btn btn-secondary" id="refresh-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 4v6h-6M4 20v-6h6M5.5 8a7 7 0 0111.5-2.5M18.5 16a7 7 0 01-11.5 2.5"/>
          </svg>
          Refresh
        </button>
        <button class="btn btn-primary" id="export-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
          </svg>
          Export CSV
        </button>
      </div>
    </header>
  `
}

module.exports = { renderHeaderSection }
