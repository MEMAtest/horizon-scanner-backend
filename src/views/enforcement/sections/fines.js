function renderFinesSection() {
  return `
    <div class="dashboard-section">
      <div class="section-header">
        <h2 class="section-title">
          <span class="section-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="5" y="4.5" width="14" height="15.5" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"></rect>
              <path d="M9 2.5h6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>
              <path d="M12 2.5v3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>
              <path d="M9 9.5h6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>
              <path d="M9 13.5h6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>
            </svg>
          </span>
          Recent Enforcement Actions
        </h2>
        <div>
          <a href="/watch-lists" class="btn btn-success">
            <span class="button-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </span>
            Fine Directory
          </a>
          <button class="btn btn-secondary" data-enforcement-action="refresh">
            <span class="button-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 5v6h-6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>
                <path d="M4 19v-6h6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>
                <path d="M5.5 9a7 7 0 0 1 11.5-2.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>
                <path d="M18.5 15a7 7 0 0 1-11.5 2.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>
              </svg>
            </span>
            Refresh
          </button>
          <button class="btn btn-secondary" data-enforcement-action="export">
            <span class="button-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 4v11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>
                <path d="M7 10.5 12 16l5-5.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>
                <rect x="5" y="17" width="14" height="3.5" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></rect>
              </svg>
            </span>
            Export CSV
          </button>
        </div>
      </div>

      <div class="search-filters">
        <div class="filter-group">
          <label class="filter-label">Search</label>
          <input type="text" class="filter-input" id="search-input" placeholder="Search firms, breach types, or descriptions...">
        </div>
        <div class="filter-group">
          <label class="filter-label">Year (Multi-select)</label>
          <select class="filter-input" id="year-filter" multiple size="6">
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
            <option value="2021">2021</option>
            <option value="2020">2020</option>
            <option value="2019">2019</option>
            <option value="2018">2018</option>
            <option value="2017">2017</option>
            <option value="2016">2016</option>
            <option value="2015">2015</option>
            <option value="2014">2014</option>
            <option value="2013">2013</option>
          </select>
          <div class="chip-toolbar">
            <div class="chip-list" id="year-chip-list"></div>
            <button type="button" class="chip-clear" id="year-clear-btn">Clear years</button>
          </div>
          <small class="filter-hint">Click chips to remove a year or use Ctrl/Cmd for multi-select</small>
        </div>
        <div class="filter-group">
          <label class="filter-label">Breach Category</label>
          <select class="filter-input" id="breach-category">
            <option value="">All Categories</option>
            <option value="Anti-Money Laundering">Anti-Money Laundering</option>
            <option value="Market Abuse">Market Abuse</option>
            <option value="Customer Treatment">Customer Treatment</option>
            <option value="Systems and Controls">Systems and Controls</option>
            <option value="Prudential Requirements">Prudential Requirements</option>
            <option value="Conduct Risk">Conduct Risk</option>
            <option value="Client Money">Client Money</option>
            <option value="Governance">Governance</option>
            <option value="Reporting and Disclosure">Reporting and Disclosure</option>
            <option value="Financial Crime">Financial Crime</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Minimum Amount</label>
          <input type="number" class="filter-input" id="min-amount" placeholder="&pound;0">
        </div>
        <div class="filter-group">
          <label class="filter-label">Risk Level</label>
          <select class="filter-input" id="risk-level">
            <option value="">All</option>
            <option value="high">High Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="low">Low Risk</option>
          </select>
        </div>
      </div>

      <div id="fines-container">
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <p>Loading recent enforcement actions...</p>
        </div>
      </div>
    </div>
  `
}

module.exports = {
  renderFinesSection
}
