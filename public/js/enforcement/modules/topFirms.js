function applyTopFirmsMixin(klass) {
  Object.assign(klass.prototype, {
    /**
     * Safely parse a value that should be an array
     * Handles JSONB fields that may be strings, objects, or already-parsed arrays
     */
    safeArray(value, defaultValue = []) {
      if (Array.isArray(value)) return value;
      if (!value) return defaultValue;
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : defaultValue;
        } catch (e) {
          return defaultValue;
        }
      }
      return defaultValue;
    },

    // State for Fines Database
    finesDbState: {
      page: 1,
      pageSize: 20,
      total: 0,
      filters: {},
      sortBy: 'date_issued',
      sortDir: 'desc'
    },

    async loadTopFirms() {
      // Initialize the Fines Database instead
      this.initFinesDatabase();
    },

    initFinesDatabase() {
      // Bind event handlers
      const searchBtn = document.getElementById('fines-search-btn');
      const resetBtn = document.getElementById('fines-reset-btn');
      const exportBtn = document.getElementById('fines-export-btn');
      const prevBtn = document.getElementById('fines-prev-btn');
      const nextBtn = document.getElementById('fines-next-btn');
      const pageSizeSelect = document.getElementById('fines-page-size');
      const firmSearchInput = document.getElementById('fines-firm-search');

      if (searchBtn) searchBtn.addEventListener('click', () => this.searchFinesDatabase());
      if (resetBtn) resetBtn.addEventListener('click', () => this.resetFinesFilters());
      if (exportBtn) exportBtn.addEventListener('click', () => this.exportFinesData());
      if (prevBtn) prevBtn.addEventListener('click', () => this.goToFinesPage(this.finesDbState.page - 1));
      if (nextBtn) nextBtn.addEventListener('click', () => this.goToFinesPage(this.finesDbState.page + 1));
      if (pageSizeSelect) pageSizeSelect.addEventListener('change', (e) => {
        this.finesDbState.pageSize = parseInt(e.target.value) || 20;
        this.finesDbState.page = 1;
        this.searchFinesDatabase();
      });

      // Allow Enter key to search
      if (firmSearchInput) firmSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.searchFinesDatabase();
      });

      // Load initial data
      this.searchFinesDatabase();
    },

    async searchFinesDatabase() {
      try {
        const container = document.getElementById('fines-database-results');
        container.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Searching fines...</p></div>';

        // Gather filter values
        const filters = {
          q: document.getElementById('fines-firm-search')?.value?.trim() || '',
          breach_type: document.getElementById('fines-breach-type')?.value || '',
          risk_level: document.getElementById('fines-risk-level')?.value || '',
          min_amount: document.getElementById('fines-min-amount')?.value || '',
          max_amount: document.getElementById('fines-max-amount')?.value || '',
          start_date: document.getElementById('fines-start-date')?.value || '',
          end_date: document.getElementById('fines-end-date')?.value || ''
        };

        this.finesDbState.filters = filters;

        // Build query params
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.set(key, value);
        });
        params.set('limit', this.finesDbState.pageSize);
        params.set('offset', (this.finesDbState.page - 1) * this.finesDbState.pageSize);

        const response = await fetch('/api/enforcement/search?' + params.toString());
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Search failed');
        }

        this.finesDbState.total = data.results?.total || 0;
        this.renderFinesResults(data.results?.fines || []);
        this.updateFinesPagination();

      } catch (error) {
        console.error('[fines-db] Search error:', error);
        document.getElementById('fines-database-results').innerHTML =
          '<div class="error-state"><strong>Search failed</strong><br>' + error.message + '</div>';
      }
    },

    renderFinesResults(fines) {
      const container = document.getElementById('fines-database-results');

      if (!fines || fines.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No fines found matching your criteria.</p></div>';
        return;
      }

      const tableRows = fines.map((fine, index) => {
        const date = this.formatDate(fine.date_issued);
        const amount = this.formatCurrency(fine.amount);
        const breaches = this.safeArray(fine.breach_categories).slice(0, 2).join(', ') || '-';
        const riskLevel = this.getRiskLevelBadge(fine.risk_score);

        return `
          <tr class="fines-row" data-fine-ref="${this.escapeHtml(fine.fine_reference || '')}" onclick="window.enforcementDashboard.showFineDetails('${this.escapeHtml(fine.fine_reference || '')}', ${JSON.stringify(fine).replace(/"/g, '&quot;')})">
            <td class="col-date">${date}</td>
            <td class="col-firm"><strong>${this.escapeHtml(fine.firm_individual || 'Unknown')}</strong></td>
            <td class="col-amount fine-amount">${amount}</td>
            <td class="col-breach">${this.escapeHtml(breaches)}</td>
            <td class="col-risk">${riskLevel}</td>
            <td class="col-action">
              ${fine.final_notice_url ? `<a href="${this.escapeHtml(fine.final_notice_url)}" target="_blank" class="view-link" onclick="event.stopPropagation()">View Notice</a>` : '-'}
            </td>
          </tr>
        `;
      }).join('');

      container.innerHTML = `
        <table class="fines-table data-table">
          <thead>
            <tr>
              <th class="col-date">Date</th>
              <th class="col-firm">Firm/Individual</th>
              <th class="col-amount">Amount</th>
              <th class="col-breach">Breach Category</th>
              <th class="col-risk">Risk Level</th>
              <th class="col-action">Notice</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      `;
    },

    showFineDetails(reference, fineData) {
      // Use the existing modal system to show fine details
      if (this.openModal) {
        const fine = typeof fineData === 'string' ? JSON.parse(fineData) : fineData;
        const breaches = this.safeArray(fine.breach_categories).join(', ') || '-';
        const sectors = this.safeArray(fine.affected_sectors).join(', ') || '-';

        const content = `
          <div class="fine-details">
            <div class="detail-row">
              <span class="detail-label">Reference</span>
              <span class="detail-value">${this.escapeHtml(fine.fine_reference || '-')}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date Issued</span>
              <span class="detail-value">${this.formatDate(fine.date_issued)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Firm/Individual</span>
              <span class="detail-value"><strong>${this.escapeHtml(fine.firm_individual || 'Unknown')}</strong></span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Fine Amount</span>
              <span class="detail-value fine-amount">${this.formatCurrency(fine.amount)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Breach Categories</span>
              <span class="detail-value">${this.escapeHtml(breaches)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Affected Sectors</span>
              <span class="detail-value">${this.escapeHtml(sectors)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Risk Score</span>
              <span class="detail-value">${fine.risk_score || '-'}/100 ${this.getRiskLevelBadge(fine.risk_score)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Impact Level</span>
              <span class="detail-value">${this.escapeHtml(fine.customer_impact_level || '-')}</span>
            </div>
            ${fine.ai_summary ? `
            <div class="detail-row detail-row-full">
              <span class="detail-label">Summary</span>
              <p class="detail-value detail-summary">${this.escapeHtml(fine.ai_summary)}</p>
            </div>
            ` : ''}
            ${fine.final_notice_url ? `
            <div class="detail-row">
              <span class="detail-label">Notice</span>
              <a href="${this.escapeHtml(fine.final_notice_url)}" target="_blank" class="detail-link">View Final Notice</a>
            </div>
            ` : ''}
          </div>
        `;

        this.openModal(
          this.escapeHtml(fine.firm_individual || 'Fine Details'),
          content
        );
      }
    },

    getRiskLevelBadge(riskScore) {
      if (!riskScore && riskScore !== 0) return '<span class="risk-badge risk-unknown">-</span>';
      const score = parseInt(riskScore);
      if (score >= 70) return '<span class="risk-badge risk-high">High</span>';
      if (score >= 40) return '<span class="risk-badge risk-medium">Medium</span>';
      return '<span class="risk-badge risk-low">Low</span>';
    },

    updateFinesPagination() {
      const pagination = document.getElementById('fines-pagination');
      const showingEl = document.getElementById('fines-showing');
      const prevBtn = document.getElementById('fines-prev-btn');
      const nextBtn = document.getElementById('fines-next-btn');
      const pagesEl = document.getElementById('fines-pages');

      const total = this.finesDbState.total;
      const page = this.finesDbState.page;
      const pageSize = this.finesDbState.pageSize;
      const totalPages = Math.ceil(total / pageSize);

      if (total === 0) {
        pagination.style.display = 'none';
        return;
      }

      pagination.style.display = 'flex';

      const start = ((page - 1) * pageSize) + 1;
      const end = Math.min(page * pageSize, total);
      showingEl.textContent = `Showing ${start}-${end} of ${total}`;

      prevBtn.disabled = page <= 1;
      nextBtn.disabled = page >= totalPages;

      // Build page numbers
      let pagesHtml = '';
      const maxVisible = 5;
      let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
      let endPage = Math.min(totalPages, startPage + maxVisible - 1);
      startPage = Math.max(1, endPage - maxVisible + 1);

      for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === page ? 'active' : '';
        pagesHtml += `<button class="page-btn ${activeClass}" onclick="window.enforcementDashboard.goToFinesPage(${i})">${i}</button>`;
      }
      pagesEl.innerHTML = pagesHtml;
    },

    goToFinesPage(page) {
      const totalPages = Math.ceil(this.finesDbState.total / this.finesDbState.pageSize);
      if (page < 1 || page > totalPages) return;
      this.finesDbState.page = page;
      this.searchFinesDatabase();
    },

    resetFinesFilters() {
      document.getElementById('fines-firm-search').value = '';
      document.getElementById('fines-breach-type').value = '';
      document.getElementById('fines-risk-level').value = '';
      document.getElementById('fines-min-amount').value = '';
      document.getElementById('fines-max-amount').value = '';
      document.getElementById('fines-start-date').value = '';
      document.getElementById('fines-end-date').value = '';

      this.finesDbState.page = 1;
      this.finesDbState.filters = {};
      this.searchFinesDatabase();
    },

    exportFinesData() {
      // Build export URL with current filters
      const params = new URLSearchParams();
      Object.entries(this.finesDbState.filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });

      const url = '/api/enforcement/export?' + params.toString();
      window.location.href = url;
    },

    // Legacy methods for backward compatibility
    renderTopFirms(firms, options = {}) {
      // Redirect to new fines database
      this.searchFinesDatabase();
    },

    renderTopFirmsError(error) {
      const container = document.getElementById('fines-database-results');
      if (container) {
        container.innerHTML = '<div class="error-state"><strong>Failed to load data</strong><br>' + error + '</div>';
      }
    },

    matchesTopFirmSearch(firm, term) {
      if (!term) return true;
      const haystack = [firm.firm_name, firm.total_fines, firm.fine_count].map(v => String(v || '')).join(' ').toLowerCase();
      return haystack.includes(term);
    }
  })
}
export { applyTopFirmsMixin }
