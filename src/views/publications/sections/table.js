function renderTableSection() {
  return `
    <div class="table-section">
      <div class="table-header">
        <h2 class="section-title">Enforcement Notices</h2>
        <p class="section-subtitle">AI-processed FCA publications</p>
      </div>

      <!-- Filters -->
      <div class="filters-row">
        <div class="filter-group filter-group-search">
          <label for="search-input">Search</label>
          <input type="text" id="search-input" class="filter-input" placeholder="Search by firm or individual name...">
        </div>
        <div class="filter-group">
          <label for="outcome-filter">Outcome Type</label>
          <select id="outcome-filter" class="filter-select">
            <option value="">All Outcomes</option>
            <option value="cancellation">Cancellation</option>
            <option value="prohibition">Prohibition</option>
            <option value="fine">Fine</option>
            <option value="restriction">Restriction</option>
            <option value="censure">Public Censure</option>
            <option value="public_statement">Public Statement</option>
            <option value="warning">Warning</option>
            <option value="supervisory_notice">Supervisory Notice</option>
            <option value="voluntary_requirement">Voluntary Requirement</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div class="filter-group">
          <label for="breach-filter">Breach Category</label>
          <select id="breach-filter" class="filter-select">
            <option value="">All Categories</option>
            <option value="PRINCIPLES">Principles</option>
            <option value="AML">Anti-Money Laundering</option>
            <option value="SYSTEMS_CONTROLS">Systems & Controls</option>
            <option value="MARKET_ABUSE">Market Abuse</option>
            <option value="MIS_SELLING">Mis-selling</option>
            <option value="CLIENT_MONEY">Client Money</option>
            <option value="CONDUCT">Conduct</option>
            <option value="PRUDENTIAL">Prudential</option>
            <option value="REPORTING">Reporting</option>
            <option value="GOVERNANCE">Governance</option>
            <option value="FINANCIAL_CRIME">Financial Crime</option>
            <option value="COMPLAINTS">Complaints</option>
            <option value="FINANCIAL_PROMOTIONS">Financial Promotions</option>
            <option value="APPROVED_PERSONS">Approved Persons</option>
          </select>
        </div>
        <div class="filter-group">
          <label for="risk-filter">Risk Level</label>
          <select id="risk-filter" class="filter-select">
            <option value="">All Levels</option>
            <option value="high">High (70+)</option>
            <option value="medium">Medium (40-69)</option>
            <option value="low">Low (0-39)</option>
          </select>
        </div>
        <div class="filter-actions">
          <button class="btn btn-secondary" id="reset-filters">Reset</button>
          <button class="btn btn-primary" id="apply-filters">Apply</button>
        </div>
      </div>

      <!-- Results count -->
      <div class="results-info" id="results-info">
        <span id="results-count">Loading...</span>
      </div>

      <!-- Table -->
      <div class="table-wrapper">
        <table class="data-table" id="notices-table">
          <thead>
            <tr>
              <th class="sortable" data-sort="entity_name">Entity Name</th>
              <th class="sortable" data-sort="frn">FRN</th>
              <th class="sortable" data-sort="outcome_type">Outcome</th>
              <th class="sortable" data-sort="fine_amount">Fine Amount</th>
              <th class="sortable" data-sort="primary_breach_type">Breach Type</th>
              <th class="sortable" data-sort="risk_score">Risk Score</th>
              <th class="sortable" data-sort="notice_date">Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="notices-tbody">
            <tr class="loading-row">
              <td colspan="8">
                <div class="loading-state">
                  <div class="loading-spinner"></div>
                  <span>Loading notices...</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination" id="pagination">
        <div class="pagination-info">
          <span id="pagination-showing">Showing 0-0 of 0</span>
        </div>
        <div class="pagination-controls">
          <button class="pagination-btn" id="prev-page" disabled>&larr; Previous</button>
          <span class="pagination-pages" id="page-numbers"></span>
          <button class="pagination-btn" id="next-page">Next &rarr;</button>
        </div>
        <div class="pagination-size">
          <label for="page-size">Per page:</label>
          <select id="page-size" class="pagination-select">
            <option value="10">10</option>
            <option value="20" selected>20</option>
            <option value="50">50</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <div class="modal-overlay" id="detail-modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title" id="modal-entity-name">Entity Details</h2>
          <button class="modal-close" id="close-modal">&times;</button>
        </div>
        <div class="modal-body" id="modal-body">
          <!-- Populated by JS -->
        </div>
      </div>
    </div>
  `
}

module.exports = { renderTableSection }
