function applyFinesMixin(klass) {
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
                this.renderLatestFineHighlight(this.allFines[0]);
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

    /**
     * Load fines with filter parameters
     * CRITICAL FIX: Ensures fines reload when filters are applied
     */
    async loadRecentFinesWithFilters(filterParams = {}) {
        try {
            console.log('[fines] Loading fines with filters:', filterParams);

            // Build query params for search endpoint
            const params = new URLSearchParams();

            if (filterParams.yearsArray && filterParams.yearsArray.length > 0) {
                params.set('years', filterParams.yearsArray.join(','));
            }

            if (filterParams.breach_type) {
                params.set('breach_type', filterParams.breach_type);
            }

            if (filterParams.minAmount) {
                params.set('minAmount', filterParams.minAmount);
            }

            if (filterParams.maxAmount) {
                params.set('maxAmount', filterParams.maxAmount);
            }

            if (filterParams.firms && filterParams.firms.length > 0) {
                params.set('firms', filterParams.firms.join(','));
            }

            // Always load full filtered dataset (no limit)
            params.set('limit', '500');

            // Fetch filtered fines from search endpoint
            const url = '/api/enforcement/search?' + params.toString();
            console.log('[fines] Fetching from:', url);

            const response = await fetch(url);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to load filtered fines');
            }

            console.log('[fines] Loaded', data.fines ? data.fines.length : 0, 'filtered fines');

            // Store filtered results
            this.allFines = Array.isArray(data.fines) ? data.fines : [];

            // Sort by date (most recent first)
            this.allFines.sort((a, b) => {
                const dateA = a.date_issued ? new Date(a.date_issued).getTime() : 0;
                const dateB = b.date_issued ? new Date(b.date_issued).getTime() : 0;
                return dateB - dateA;
            });

            // Slice for table display
            this.latestFilteredFines = this.allFines.slice(0, this.tableRowLimit || 50);
            this.latestFilteredTotal = data.total || this.allFines.length;

            // Update latest fine highlight
            const latestFine = this.allFines[0] || null;
            this.renderLatestFineHighlight(latestFine);

            console.log('[fines] Set latestFilteredFines to', this.latestFilteredFines.length, 'fines');

        } catch (error) {
            console.error('[fines] Error loading filtered fines:', error);
            this.renderLatestFineHighlight(null, error.message);
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
            const breachTagsHtml = this.safeArray(fine.breach_categories).map(category =>
                '<span class="breach-tag">' + category + '</span>'
            ).join('');
    
            const aiSummaryHtml = fine.ai_summary ?
                '<br><small style="color: #6b7280;">' + fine.ai_summary.substring(0, 400) + (fine.ai_summary.length > 400 ? '...' : '') + '</small>' : '';
    
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
        this.renderLatestFineHighlight(null, error);
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
            this.escapeCsv(this.safeArray(fine.breach_categories).join('; ')),
            this.escapeCsv(this.safeArray(fine.affected_sectors).join('; ')),
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
    },

    renderLatestFineHighlight(latestFine, errorMessage = null) {
        const container = document.getElementById('latest-fine-highlight');
        if (!container) return;

        if (errorMessage) {
            container.innerHTML = '<div class="error-state">Latest fine unavailable: ' + errorMessage + '</div>';
            return;
        }

        if (!latestFine) {
            container.innerHTML = '<div class="loading-state">No fines recorded yet.</div>';
            return;
        }

        const issuedDate = this.formatDate(latestFine.date_issued);
        const regulator = latestFine.regulator || latestFine.authority || 'Regulator';
        const amount = this.formatCurrency(latestFine.amount);
        const subject = latestFine.firm_individual || 'Unknown firm';
        const noticeLink = latestFine.final_notice_url ? '<a href="' + latestFine.final_notice_url + '" target="_blank" rel="noopener">View notice →</a>' : '';

        container.innerHTML = [
            '<div>',
                '<div class="heat-pill high" style="margin-bottom:6px;">Latest fine issued</div>',
                '<div class="latest-fine-title">' + subject + '</div>',
                '<div class="latest-fine-meta">',
                    '<span class="fine-chip amount">' + amount + '</span>',
                    '<span class="fine-chip date">' + issuedDate + '</span>',
                    '<span class="fine-chip regulator">' + regulator + '</span>',
                '</div>',
            '</div>',
            '<div class="latest-fine-actions">',
                noticeLink,
                '<a href="/enforcement" aria-label="Refresh fines" onclick="window.enforcementDashboard && window.enforcementDashboard.loadRecentFines({ skipRender: false }); return false;">Refresh</a>',
            '</div>'
        ].join('');
    }
  })
}
export { applyFinesMixin }
