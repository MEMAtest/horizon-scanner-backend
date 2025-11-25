function applyFiltersMixin(klass) {
  Object.assign(klass.prototype, {
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
                const categories = Array.isArray(fine.breach_categories) ? fine.breach_categories : [];
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
                    ...(fine.breach_categories || [])
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
