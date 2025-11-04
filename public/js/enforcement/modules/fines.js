function applyFinesMixin(klass) {
  Object.assign(klass.prototype, {
    async loadRecentFines(options = {}) {
        try {
            console.log('[fines] Loading recent fines...');
    
            const limit = options.limit || 500;
            const response = await fetch('/api/enforcement/recent?limit=' + limit);
            const data = await response.json();
    
            if (data.success) {
                this.allFines = Array.isArray(data.fines) ? data.fines : [];
                this.allFines.sort((a, b) => {
                    const dateA = a.date_issued ? new Date(a.date_issued).getTime() : 0;
                    const dateB = b.date_issued ? new Date(b.date_issued).getTime() : 0;
                    return dateB - dateA;
                });
                if (!options.skipRender) {
                    this.renderFines(this.allFines);
                }
            } else {
                throw new Error(data.error || 'Failed to load fines');
            }
        } catch (error) {
            console.error('[error] Error loading fines:', error);
            this.renderFinesError(error.message);
        }
    },

    renderFines(fines) {
        const container = document.getElementById('fines-container');
    
        if (!fines || fines.length === 0) {
            container.innerHTML = '<p class="loading-state">No enforcement actions found.</p>';
            return;
        }
    
        this.latestFilteredFines = fines;
    
        const hasLimit = this.tableRowLimit && !this.showAllFines;
        const effectiveLimit = hasLimit ? this.tableRowLimit : null;
        const displayFines = effectiveLimit && fines.length > effectiveLimit
            ? fines.slice(0, effectiveLimit)
            : fines;
    
        const tableRows = displayFines.map(fine => {
            const breachTagsHtml = (fine.breach_categories || []).map(category =>
                '<span class="breach-tag">' + category + '</span>'
            ).join('');
    
            const aiSummaryHtml = fine.ai_summary ?
                '<br><small style="color: #6b7280;">' + fine.ai_summary.substring(0, 100) + '...</small>' : '';
    
            const noticeActionHtml = fine.final_notice_url ?
                '<a href="' + fine.final_notice_url + '" target="_blank" class="btn btn-secondary" style="padding: 5px 10px; font-size: 0.75rem;">View Notice</a>' :
                'N/A';
    
            return '<tr>' +
                '<td>' +
                    '<span class="fine-reference">' + (fine.fine_reference || 'N/A') + '</span>' +
                '</td>' +
                '<td>' + this.formatDate(fine.date_issued) + '</td>' +
                '<td>' +
                    '<strong>' + (fine.firm_individual || 'Unknown') + '</strong>' +
                    aiSummaryHtml +
                '</td>' +
                '<td>' +
                    '<span class="fine-amount">' + this.formatCurrency(fine.amount) + '</span>' +
                '</td>' +
                '<td>' +
                    '<div class="breach-tags">' +
                        breachTagsHtml +
                    '</div>' +
                '</td>' +
                '<td>' +
                    this.renderRiskBadge(fine.risk_score) +
                '</td>' +
                '<td>' +
                    noticeActionHtml +
                '</td>' +
            '</tr>';
        }).join('');
    
        const tableHTML =
            '<table class="data-table">' +
                '<thead>' +
                    '<tr>' +
                        '<th>Reference</th>' +
                        '<th>Date</th>' +
                        '<th>Firm/Individual</th>' +
                        '<th>Amount</th>' +
                        '<th>Breach Categories</th>' +
                        '<th>Risk</th>' +
                        '<th>Actions</th>' +
                    '</tr>' +
                '</thead>' +
                '<tbody>' +
                    tableRows +
                '</tbody>' +
            '</table>';
    
        let totalAvailable = fines.length;
        if (this.isFilterActive && typeof this.latestFilteredTotal === 'number' && this.latestFilteredTotal > 0) {
            totalAvailable = this.latestFilteredTotal;
        }
    
        let footnote = '';
        if (!this.showAllFines && effectiveLimit && totalAvailable > displayFines.length) {
            footnote = '<p class="pattern-footnote" style="margin-top: 12px;">Showing first ' + displayFines.length + ' of ' + totalAvailable + ' results. <button type="button" class="link-button" data-action="expand-fines">Show all ' + totalAvailable + '</button></p>';
        } else if (this.showAllFines && totalAvailable > this.defaultTableRowLimit) {
            footnote = '<p class="pattern-footnote" style="margin-top: 12px;">Showing all ' + totalAvailable + ' results. <button type="button" class="link-button" data-action="collapse-fines">Show fewer</button></p>';
        }
    
        container.innerHTML = tableHTML + footnote;
    },

    renderFinesError(error) {
        const container = document.getElementById('fines-container');
        this.latestFilteredFines = [];
        this.filteredSummary = null;
        container.innerHTML = [
            '<div class="error-state">',
                '<strong>Failed to load enforcement actions</strong><br>',
                error,
            '</div>'
        ].join('');
    },

    buildFinesCsv(fines = []) {
        const headers = [
            'Reference',
            'Date',
            'Firm/Individual',
            'Amount (&pound;)',
            'Breach Categories',
            'Affected Sectors',
            'Impact Level',
            'Risk Score',
            'Systemic Risk',
            'Precedent Setting',
            'Summary',
            'Notice URL'
        ];
    
        const rows = fines.map(fine => [
            this.escapeCsv(fine.fine_reference),
            fine.date_issued || '',
            this.escapeCsv(fine.firm_individual),
            fine.amount || '',
            this.escapeCsv(Array.isArray(fine.breach_categories) ? fine.breach_categories.join('; ') : ''),
            this.escapeCsv(Array.isArray(fine.affected_sectors) ? fine.affected_sectors.join('; ') : ''),
            fine.customer_impact_level || '',
            fine.risk_score || '',
            fine.systemic_risk ? 'Yes' : 'No',
            fine.precedent_setting ? 'Yes' : 'No',
            this.escapeCsv(fine.ai_summary || ''),
            fine.final_notice_url || ''
        ].join(','));
    
        const csvRows = [headers.join(',')];
        rows.forEach(row => csvRows.push(row));
        return csvRows.join('\\n');
    },

    escapeCsv(value) {
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (/[",\\r\\n]/.test(stringValue)) {
            return '"' + stringValue.replace(/"/g, '""') + '"';
        }
        return stringValue;
    }
  })
}
export { applyFinesMixin }
