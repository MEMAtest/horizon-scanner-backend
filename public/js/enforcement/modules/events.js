function applyEventsMixin(klass) {
  Object.assign(klass.prototype, {
    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('search-input');
        const yearFilter = document.getElementById('year-filter');
        const breachCategory = document.getElementById('breach-category');
        const minAmountInput = document.getElementById('min-amount');
        const riskLevelSelect = document.getElementById('risk-level');
        const trendsSelect = document.getElementById('trends-period');
        const trendSearchInput = document.getElementById('trend-search');
        const topFirmSearchInput = document.getElementById('top-firm-search');
    
        // Debounced search
        let searchTimeout;
        [searchInput, yearFilter, breachCategory, minAmountInput, riskLevelSelect].filter(Boolean).forEach(input => {
            input.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                if (input === yearFilter) {
                    const years = Array.from(yearFilter.selectedOptions)
                        .map(option => parseInt(option.value, 10))
                        .filter(year => !isNaN(year));
                    this.updateYearChips(years);
                }
                searchTimeout = setTimeout(() => this.performSearch(), 500);
            });
            input.addEventListener('change', () => {
                clearTimeout(searchTimeout);
                if (input === yearFilter) {
                    const years = Array.from(yearFilter.selectedOptions)
                        .map(option => parseInt(option.value, 10))
                        .filter(year => !isNaN(year));
                    this.updateYearChips(years);
                }
                searchTimeout = setTimeout(() => this.performSearch(), 500);
            });
        });
    
        // Trends period change
        trendsSelect.addEventListener('change', () => this.loadTrends(true));
    
        if (trendSearchInput) {
            trendSearchInput.addEventListener('input', event => {
                this.trendSearchTerm = event.target.value || '';
                if (Array.isArray(this.latestTrendsData)) {
                    this.renderEnhancedTrends(this.latestTrendsData, this.currentFilterParams || {});
                }
            });
        }
    
        if (topFirmSearchInput) {
            topFirmSearchInput.addEventListener('input', event => {
                this.topFirmSearchTerm = event.target.value || '';
                if (Array.isArray(this.latestTopFirms)) {
                    this.renderTopFirms(this.latestTopFirms, {
                        filterMode: this.isFilterActive,
                        scopeLabel: this.filteredSummary ? this.filteredSummary.scopeLabel : null
                    });
                }
            });
        }
    
        const yearChipList = document.getElementById('year-chip-list');
        if (yearChipList && yearFilter) {
            yearChipList.addEventListener('click', event => {
                const chip = event.target.closest('.chip');
                if (!chip) return;
                event.preventDefault();
                const yearValue = chip.dataset.year;
                if (!yearValue) return;
                Array.from(yearFilter.options).forEach(option => {
                    if (option.value === yearValue) option.selected = false;
                });
                this.updateYearChips(Array.from(yearFilter.selectedOptions).map(option => parseInt(option.value, 10)).filter(year => !isNaN(year)));
                this.performSearch();
            });
        }
    
        const yearClearBtn = document.getElementById('year-clear-btn');
        if (yearClearBtn && yearFilter) {
            yearClearBtn.addEventListener('click', event => {
                if (yearClearBtn.disabled) return;
                event.preventDefault();
                Array.from(yearFilter.options).forEach(option => {
                    option.selected = false;
                });
                this.updateYearChips([]);
                this.performSearch();
            });
        }
    
        const finesContainer = document.getElementById('fines-container');
        if (finesContainer) {
            finesContainer.addEventListener('click', event => {
                const actionTarget = event.target.closest('[data-action]');
                if (!actionTarget) return;
                event.preventDefault();
                const action = actionTarget.getAttribute('data-action');
                const sourceFines = this.latestFilteredFines.length ? this.latestFilteredFines : this.allFines;
    
                if (action === 'expand-fines') {
                    this.showAllFines = true;
                    this.tableRowLimit = null;
                    this.renderFines(sourceFines);
                } else if (action === 'collapse-fines') {
                    this.showAllFines = false;
                    this.tableRowLimit = this.defaultTableRowLimit;
                    this.renderFines(sourceFines);
                }
            });
        }
    }
  })
}
export { applyEventsMixin }
