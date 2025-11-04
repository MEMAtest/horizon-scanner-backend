function applyTopFirmsMixin(klass) {
  Object.assign(klass.prototype, {
    async loadTopFirms() {
        try {
            console.log('[firms] Loading top firms...');
    
            const response = await fetch('/api/enforcement/top-firms?limit=10');
            const data = await response.json();
    
            if (data.success) {
                this.renderTopFirms(data.firms, { filterMode: this.isFilterActive });
            } else {
                throw new Error(data.error || 'Failed to load top firms');
            }
        } catch (error) {
            console.error('[error] Error loading top firms:', error);
            this.renderTopFirmsError(error.message);
        }
    },

    renderTopFirms(firms, options = {}) {
        const container = document.getElementById('top-firms-container');
        if (!container) return;
    
        this.latestTopFirms = Array.isArray(firms) ? firms : [];
        const searchTerm = (this.topFirmSearchTerm || '').trim().toLowerCase();
        const workingFirms = searchTerm
            ? this.latestTopFirms.filter(firm => this.matchesTopFirmSearch(firm, searchTerm))
            : this.latestTopFirms;
    
        if (!workingFirms.length) {
            const message = searchTerm
                ? 'No firms match "' + this.escapeHtml(this.topFirmSearchTerm.trim()) + '"'
                : options.filterMode
                    ? 'No firm data captured for the current filters.'
                    : 'No firm data available.';
            container.innerHTML = '<p class="loading-state">' + message + '</p>';
            return;
        }
    
        const totalFines = workingFirms.reduce((sum, firm) => sum + Number(firm.total_fines || 0), 0);
        const badges = [];
        if (options.filterMode) {
            badges.push('<span class="filter-badge">Filtered Firms</span>');
            if (options.scopeLabel) {
                badges.push('<span class="filter-badge">' + this.escapeHtml(options.scopeLabel) + '</span>');
            }
        }
        if (searchTerm) {
            badges.push('<span class="filter-badge">Search: ' + this.escapeHtml(this.topFirmSearchTerm.trim()) + '</span>');
        }
    
        const filterInfo = badges.length
            ? '<div class="trends-filter-info">' + badges.join('') + '</div>'
            : '';
    
        const tableRows = workingFirms.map((firm, index) => {
            const averageFine = firm.average_fine || (firm.fine_count ? firm.total_fines / firm.fine_count : 0);
            const shareOfTotal = totalFines > 0 ? (Number(firm.total_fines || 0) / totalFines) * 100 : 0;
            const shareDisplay = totalFines > 0 ? shareOfTotal.toFixed(1) : '0.0';
            const firstFine = this.formatDate(firm.first_fine_date);
            const latestFine = this.formatDate(firm.latest_fine_date);
            return '<tr>' +
                '<td><strong>' + (index + 1) + '</strong></td>' +
                '<td>' + this.escapeHtml(firm.firm_name || 'Unknown') + '</td>' +
                '<td class="fine-amount">' + this.formatCurrency(firm.total_fines) + '</td>' +
                '<td>' + this.formatCurrency(averageFine) + '</td>' +
                '<td>' + (firm.fine_count || 0) + '</td>' +
                '<td>' + firstFine + '</td>' +
                '<td>' + latestFine + '</td>' +
                '<td>' + shareDisplay + '%</td>' +
                '<td>' + (firm.is_repeat_offender ? '&#9888; Yes' : '&#9989; No') + '</td>' +
            '</tr>';
        }).join('');
    
        const tableHTML =
            filterInfo +
            '<table class="data-table">' +
                '<thead>' +
                    '<tr>' +
                        '<th>Rank</th>' +
                        '<th>Firm Name</th>' +
                        '<th>Total Fines</th>' +
                        '<th>Average Fine</th>' +
                        '<th>Fine Count</th>' +
                        '<th>First Fine</th>' +
                        '<th>Latest Fine</th>' +
                        '<th>Share of Total</th>' +
                        '<th>Repeat Offender</th>' +
                    '</tr>' +
                '</thead>' +
                '<tbody>' +
                    tableRows +
                '</tbody>' +
            '</table>';
    
        container.innerHTML = tableHTML;
    },

    renderTopFirmsError(error) {
        const container = document.getElementById('top-firms-container');
        container.innerHTML = [
            '<div class="error-state">',
                '<strong>Failed to load top firms</strong><br>',
                error,
            '</div>'
        ].join('');
    },

    buildTopFirmsFromFines(fines = [], limit = 10) {
        if (!Array.isArray(fines) || fines.length === 0) return [];
    
        const firmMap = new Map();
    
        fines.forEach(fine => {
            const firmName = (fine.firm_individual || 'Unknown').trim() || 'Unknown';
            const amount = Number(fine.amount || 0);
            const issuedDate = fine.date_issued ? new Date(fine.date_issued) : null;
    
            const record = firmMap.get(firmName) || {
                firm_name: firmName,
                total_fines: 0,
                fine_count: 0,
                first_fine_date: null,
                latest_fine_date: null,
                is_repeat_offender: false
            };
    
            record.total_fines += amount;
            record.fine_count += 1;
            record.is_repeat_offender = record.is_repeat_offender || record.fine_count > 1;
    
            if (issuedDate instanceof Date && !isNaN(issuedDate)) {
                if (!record.first_fine_date || issuedDate < record.first_fine_date) {
                    record.first_fine_date = issuedDate;
                }
                if (!record.latest_fine_date || issuedDate > record.latest_fine_date) {
                    record.latest_fine_date = issuedDate;
                }
            }
    
            firmMap.set(firmName, record);
        });
    
        const ranked = Array.from(firmMap.values()).map(record => {
            const average = record.fine_count > 0 ? record.total_fines / record.fine_count : 0;
            return {
                ...record,
                average_fine: average,
                first_fine_date: record.first_fine_date ? record.first_fine_date.toISOString() : null,
                latest_fine_date: record.latest_fine_date ? record.latest_fine_date.toISOString() : null
            };
        }).sort((a, b) => b.total_fines - a.total_fines);
    
        return ranked.slice(0, limit);
    },

    matchesTopFirmSearch(firm, term) {
        if (!term) return true;
        const haystack = [
            firm.firm_name,
            this.formatCurrency(firm.total_fines || 0),
            this.formatCurrency(firm.average_fine || 0),
            firm.fine_count,
            firm.first_fine_date,
            firm.latest_fine_date
        ].map(value => String(value || '')).join(' ').toLowerCase();
        return haystack.includes(term);
    }
  })
}
export { applyTopFirmsMixin }
