function applyFiltersMixin(klass) {
  Object.assign(klass.prototype, {
    // Chart filter state (separate from UI filter controls)
    chartFilter: null,

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

    /**
     * Set chart-based filter
     * @param {Object} filterConfig - Filter configuration { type, value, label, ... }
     */
    setChartFilter(filterConfig) {
      this.chartFilter = filterConfig
      this.renderChartFilterBadge()
      console.log('[chart-filter] Applied:', filterConfig)
    },

    /**
     * Clear chart-based filter
     */
    clearChartFilter() {
      this.chartFilter = null
      this.removeChartFilterBadge()
      this.performSearch()
      console.log('[chart-filter] Cleared')
    },

    /**
     * Render visual indicator for active chart filter
     */
    renderChartFilterBadge() {
      const container = document.getElementById('chart-filter-badge-container')
      if (!container || !this.chartFilter) return

      const label = this.chartFilter.label || 'Chart Filter'

      container.innerHTML = `
        <div class="chart-filter-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="4" y1="21" x2="4" y2="14"></line>
            <line x1="4" y1="10" x2="4" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12" y2="3"></line>
            <line x1="20" y1="21" x2="20" y2="16"></line>
            <line x1="20" y1="12" x2="20" y2="3"></line>
            <line x1="1" y1="14" x2="7" y2="14"></line>
            <line x1="9" y1="8" x2="15" y2="8"></line>
            <line x1="17" y1="16" x2="23" y2="16"></line>
          </svg>
          <span>Filtered by Chart: ${this.escapeHtml(label)}</span>
          <button type="button" class="badge-close" onclick="window.enforcementDashboard.clearChartFilter()" aria-label="Clear chart filter">
            &times;
          </button>
        </div>
      `

      // Slide in animation
      setTimeout(() => {
        const badge = container.querySelector('.chart-filter-badge')
        if (badge) badge.classList.add('active')
      }, 10)
    },

    /**
     * Remove chart filter badge
     */
    removeChartFilterBadge() {
      const container = document.getElementById('chart-filter-badge-container')
      if (!container) return

      const badge = container.querySelector('.chart-filter-badge')
      if (badge) {
        badge.classList.remove('active')
        setTimeout(() => {
          container.innerHTML = ''
        }, 300)
      }
    },

    hasActiveFilters(filterParams = {}) {
        return Boolean(
            (filterParams.q && filterParams.q.trim()) ||
            (Array.isArray(filterParams.yearsArray) && filterParams.yearsArray.length) ||
            (Array.isArray(filterParams.yearsRaw) && filterParams.yearsRaw.length) ||
            filterParams.breach_type ||
            filterParams.min_amount ||
            filterParams.risk_level
        );
    },

    buildFilterQuery(filterParams = {}) {
        const params = new URLSearchParams();
    
        if (filterParams.q) params.set('q', filterParams.q.trim());
        if (Array.isArray(filterParams.yearsArray) && filterParams.yearsArray.length) {
            params.set('years', filterParams.yearsArray.map(year => parseInt(year, 10)).filter(year => !isNaN(year)).join(','));
        }
        if (filterParams.breach_type) params.set('breach_type', filterParams.breach_type);
        if (filterParams.min_amount) params.set('min_amount', filterParams.min_amount);
        if (filterParams.risk_level) params.set('risk_level', filterParams.risk_level);
        if (filterParams.search_scope) params.set('search_scope', filterParams.search_scope);
        if (filterParams.sector) params.set('sector', filterParams.sector);
    
        return params;
    },

    filterFines(filterParams = {}) {
        if (!Array.isArray(this.allFines) || this.allFines.length === 0) return [];
    
        const query = (filterParams.q || '').toLowerCase();
        const yearsArray = Array.isArray(filterParams.yearsArray) ? filterParams.yearsArray : [];
        const yearsSet = yearsArray.length ? new Set(yearsArray) : null;
        const breachType = filterParams.breach_type;
        const minAmount = filterParams.min_amount ? Number(filterParams.min_amount) : null;
        const riskLevel = filterParams.risk_level || '';
    
        const filtered = this.allFines.filter(fine => {
            const issueDate = fine.date_issued ? new Date(fine.date_issued) : null;
            const issueYear = issueDate ? issueDate.getFullYear() : null;
    
            if (yearsSet && (issueYear === null || !yearsSet.has(issueYear))) return false;
    
            if (breachType) {
                const categories = this.safeArray(fine.breach_categories);
                if (!categories.includes(breachType)) return false;
            }
    
            if (minAmount !== null && Number(fine.amount || 0) < minAmount) return false;
    
            if (riskLevel) {
                const riskScore = Number(fine.risk_score || 0);
                if (riskLevel === 'high' && riskScore < 70) return false;
                if (riskLevel === 'medium' && (riskScore < 40 || riskScore >= 70)) return false;
                if (riskLevel === 'low' && riskScore >= 40) return false;
            }
    
            if (query) {
                const haystack = [
                    fine.firm_individual,
                    fine.ai_summary,
                    fine.summary,
                    fine.fine_reference,
                    ...this.safeArray(fine.breach_categories)
                ].join(' ').toLowerCase();
    
                if (!haystack.includes(query)) return false;
            }
    
            return true;
        });
    
        return filtered.sort((a, b) => {
            const dateA = a.date_issued ? new Date(a.date_issued).getTime() : 0;
            const dateB = b.date_issued ? new Date(b.date_issued).getTime() : 0;
            return dateB - dateA;
        });
    },

    getYearFromPeriod(period) {
        if (!period) return null;
        const match = String(period).match(/^(\d{4})/);
        return match ? parseInt(match[1], 10) : null;
    },

    updateYearChips(selectedYears = []) {
        const chipList = document.getElementById('year-chip-list');
        const clearButton = document.getElementById('year-clear-btn');
        if (!chipList || !clearButton) return;
    
        chipList.innerHTML = '';
        if (!Array.isArray(selectedYears) || selectedYears.length === 0) {
            clearButton.disabled = true;
            clearButton.classList.add('disabled');
            return;
        }
    
        clearButton.disabled = false;
        clearButton.classList.remove('disabled');
    
        selectedYears.forEach(year => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'chip';
            chip.dataset.year = year;
            chip.innerHTML = this.escapeHtml(String(year)) + '<span class="chip-remove">&times;</span>';
            chipList.appendChild(chip);
        });
    },

    async fetchFilteredFines(filterParams = {}) {
        const params = this.buildFilterQuery(filterParams);
        params.set('limit', filterParams.limit || 1000);
        params.set('offset', '0');
    
        const url = '/api/enforcement/search?' + params.toString();
        const response = await fetch(url);
        const data = await response.json();
    
        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch filtered fines');
        }
    
        const results = data.results || {};
        const fines = Array.isArray(results.fines) ? results.fines : [];
        const total = Number.isFinite(results.total) ? Number(results.total) : (Array.isArray(results.fines) ? results.fines.length : 0);
    
        return { fines, total };
    },

    async ensureFinesLoaded() {
        if (Array.isArray(this.allFines) && this.allFines.length > 0) return;
        await this.loadRecentFines({ skipRender: true, limit: 500 });
    },

    getCurrentFilterParams() {
        const yearSelect = document.getElementById('year-filter');
        const selectedYears = Array.from(yearSelect.selectedOptions).map(option => option.value);
        const query = document.getElementById('search-input').value;
        const breachCategory = document.getElementById('breach-category').value;
        const minAmount = document.getElementById('min-amount').value;
        const riskLevel = document.getElementById('risk-level').value;

        const filterParams = {};
        if (query) filterParams.q = query.trim();
        if (selectedYears.length > 0) {
            filterParams.years = selectedYears.join(',');
            filterParams.yearsArray = selectedYears
                .map(year => parseInt(year, 10))
                .filter(year => !isNaN(year));
            filterParams.yearsRaw = selectedYears;
        } else {
            filterParams.yearsArray = [];
            filterParams.yearsRaw = [];
        }
        if (breachCategory) filterParams.breach_type = breachCategory;
        if (minAmount) filterParams.min_amount = minAmount;
        if (riskLevel) filterParams.risk_level = riskLevel;

        // Integrate chart filter
        if (this.chartFilter) {
            switch (this.chartFilter.type) {
                case 'year':
                    // Override year filter with chart selection
                    filterParams.years = String(this.chartFilter.year);
                    filterParams.yearsArray = [this.chartFilter.year];
                    filterParams.yearsRaw = [String(this.chartFilter.year)];
                    break;

                case 'category':
                    // Override breach type filter
                    filterParams.breach_type = this.chartFilter.category;
                    break;

                case 'amount_range':
                    // Set min/max amount filters
                    filterParams.min_amount = this.chartFilter.min;
                    filterParams.max_amount = this.chartFilter.max;
                    break;

                case 'year_category':
                    // Combined year AND category filter
                    filterParams.years = String(this.chartFilter.year);
                    filterParams.yearsArray = [this.chartFilter.year];
                    filterParams.yearsRaw = [String(this.chartFilter.year)];
                    filterParams.breach_type = this.chartFilter.category;
                    break;
            }
        }

        this.updateYearChips(filterParams.yearsArray);

        return filterParams;
    },

    async performSearch() {
        const filterParams = this.getCurrentFilterParams();
        await this.loadStatsWithFilters(filterParams);
    }
  })
}
export { applyFiltersMixin }
