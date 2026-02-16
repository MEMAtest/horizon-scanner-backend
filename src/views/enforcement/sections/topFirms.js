function renderTopFirmsSection() {
  return `
    <div class="dashboard-section fines-database-section">
      <div class="section-header">
        <h2 class="section-title">
          <span class="section-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 6h18M3 12h18M3 18h18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>
              <rect x="8" y="4" width="8" height="4" rx="1" fill="none" stroke="currentColor" stroke-width="1.6"></rect>
            </svg>
          </span>
          Fines Directory
        </h2>
        <p class="section-subtitle">Search and filter FCA enforcement actions</p>
      </div>

      <div class="fines-database-filters">
        <div class="filter-row">
          <div class="filter-group">
            <label for="fines-firm-search">Firm Name</label>
            <input type="search" id="fines-firm-search" class="filter-input" placeholder="Search firms..." autocomplete="off" />
          </div>
          <div class="filter-group">
            <label for="fines-breach-type">Breach Category</label>
            <select id="fines-breach-type" class="filter-select">
              <option value="">All Categories</option>
              <option value="Anti-Money Laundering">Anti-Money Laundering</option>
              <option value="Systems and Controls">Systems and Controls</option>
              <option value="Customer Treatment">Customer Treatment</option>
              <option value="Market Abuse">Market Abuse</option>
              <option value="Financial Crime">Financial Crime</option>
              <option value="Disclosure">Disclosure</option>
              <option value="Conflicts of Interest">Conflicts of Interest</option>
            </select>
          </div>
          <div class="filter-group">
            <label for="fines-risk-level">Risk Level</label>
            <select id="fines-risk-level" class="filter-select">
              <option value="">All Levels</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
            </select>
          </div>
        </div>
        <div class="filter-row">
          <div class="filter-group">
            <label for="fines-min-amount">Min Amount</label>
            <input type="number" id="fines-min-amount" class="filter-input filter-input-small" placeholder="0" min="0" step="100000" />
          </div>
          <div class="filter-group">
            <label for="fines-max-amount">Max Amount</label>
            <input type="number" id="fines-max-amount" class="filter-input filter-input-small" placeholder="No limit" min="0" step="100000" />
          </div>
          <div class="filter-group">
            <label for="fines-start-date">From Date</label>
            <input type="date" id="fines-start-date" class="filter-input" />
          </div>
          <div class="filter-group">
            <label for="fines-end-date">To Date</label>
            <input type="date" id="fines-end-date" class="filter-input" />
          </div>
          <div class="filter-group filter-actions">
            <button id="fines-search-btn" class="filter-btn filter-btn-primary">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <circle cx="11" cy="11" r="8" fill="none" stroke="currentColor" stroke-width="2"></circle>
                <path d="M21 21l-4.35-4.35" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
              </svg>
              Search
            </button>
            <button id="fines-reset-btn" class="filter-btn">Reset</button>
            <button id="fines-export-btn" class="filter-btn">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
                <polyline points="7 10 12 15 17 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></polyline>
                <line x1="12" y1="15" x2="12" y2="3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line>
              </svg>
              Export
            </button>
          </div>
        </div>
      </div>

      <div id="fines-database-results">
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <p>Loading fines database...</p>
        </div>
      </div>

      <div class="fines-pagination" id="fines-pagination" style="display: none;">
        <div class="pagination-info">
          <span id="fines-showing">Showing 1-20 of 0</span>
        </div>
        <div class="pagination-controls">
          <button id="fines-prev-btn" class="pagination-btn" disabled>
            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
            Previous
          </button>
          <div class="pagination-pages" id="fines-pages"></div>
          <button id="fines-next-btn" class="pagination-btn">
            Next
            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M9 18l6-6-6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
          </button>
        </div>
        <div class="pagination-size">
          <label for="fines-page-size">Per page:</label>
          <select id="fines-page-size" class="pagination-select">
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Legacy container for backward compatibility -->
    <div id="top-firms-container" style="display: none;"></div>
  `
}

module.exports = {
  renderTopFirmsSection
}
