function renderStatsSection() {
  return `
    <div class="stats-grid" id="stats-grid">
      <div class="stat-card">
        <div class="stat-icon publications-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value" id="total-indexed">--</span>
          <span class="stat-label">Publications Indexed</span>
          <span class="stat-helper" id="indexed-helper"></span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon processed-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value" id="total-processed">--</span>
          <span class="stat-label">Enforcement Notices</span>
          <span class="stat-helper" id="processed-helper"></span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon fines-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value" id="total-fines">--</span>
          <span class="stat-label">Total Fines</span>
          <span class="stat-helper" id="fines-helper"></span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon pending-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <path d="M14 2v6h6"/>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value" id="total-pending">--</span>
          <span class="stat-label">Other Publications</span>
          <span class="stat-helper" id="pending-helper"></span>
        </div>
      </div>
    </div>
  `
}

module.exports = { renderStatsSection }
