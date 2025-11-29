function applyTrendsMixin(klass) {
  Object.assign(klass.prototype, {
    async loadTrends(force = false, filterParams = this.currentFilterParams || {}) {
        try {
            const periodSelect = document.getElementById('trends-period');
            const period = periodSelect ? (periodSelect.value || 'monthly') : 'monthly';
            this.currentTrendPeriod = period;
    
            const cacheKey = this.getTrendCacheKey(period, filterParams);
            const cached = this.trendCache[cacheKey];
    
            if (!force && Array.isArray(cached)) {
                const cachedFilter = Object.assign({}, filterParams);
                if (!cachedFilter.years && Array.isArray(filterParams.yearsArray) && filterParams.yearsArray.length) {
                    cachedFilter.years = filterParams.yearsArray.join(',');
                }
                this.renderEnhancedTrends(cached, cachedFilter);
                return;
            }
    
            const params = new URLSearchParams();
            params.set('period', period);
            params.set('limit', '24');
            if (Array.isArray(filterParams.yearsArray) && filterParams.yearsArray.length) {
                const yearsValue = filterParams.yearsArray.map(year => parseInt(year, 10)).filter(year => !isNaN(year)).join(',');
                if (yearsValue) params.set('years', yearsValue);
            }
            // Pass additional filter params to trends API
            if (filterParams.firm) params.set('firm', filterParams.firm);
            if (filterParams.breachType) params.set('breach_type', filterParams.breachType);
            if (filterParams.sector) params.set('sector', filterParams.sector);
            if (filterParams.riskLevel) params.set('risk_level', filterParams.riskLevel);
    
            const response = await fetch('/api/enforcement/trends?' + params.toString());
            const data = await response.json();
    
            if (!data.success) {
                throw new Error(data.error || 'Failed to load trends');
            }
    
            const trends = data.trends || [];
            this.trendCache[cacheKey] = trends;
    
            const enrichedFilter = Object.assign({}, filterParams);
            if (!enrichedFilter.years && params.has('years')) {
                enrichedFilter.years = params.get('years');
                enrichedFilter.yearsArray = enrichedFilter.years.split(',').map(year => parseInt(year, 10)).filter(year => !isNaN(year));
            }
    
            this.renderEnhancedTrends(trends, enrichedFilter);
        } catch (error) {
            console.error('[error] Error loading trends:', error);
            this.renderTrendsError(error.message);
        }
    },

    renderTrends(trends) {
        const container = document.getElementById('trends-container');
    
        if (!trends || trends.length === 0) {
            container.innerHTML = '<div class="trends-chart"><p>No trend data available</p></div>';
            return;
        }
    
        // Simple table view for trends (could be enhanced with charts later)
        const tableRows = trends.map(trend => {
            return '<tr>' +
                '<td><strong>' + trend.period + '</strong></td>' +
                '<td>' + (trend.fine_count || 0) + '</td>' +
                '<td class="fine-amount">' + this.formatCurrency(trend.total_amount) + '</td>' +
                '<td>' + this.formatCurrency(trend.average_amount) + '</td>' +
                '<td>' + Math.round(trend.average_risk_score || 0) + '/100</td>' +
            '</tr>';
        }).join('');
    
        const tableHTML =
            '<table class="data-table">' +
                '<thead>' +
                    '<tr>' +
                        '<th>Period</th>' +
                        '<th>Fine Count</th>' +
                        '<th>Total Amount</th>' +
                        '<th>Average Amount</th>' +
                        '<th>Average Risk Score</th>' +
                    '</tr>' +
                '</thead>' +
                '<tbody>' +
                    tableRows +
                '</tbody>' +
            '</table>';
    
        container.innerHTML = tableHTML;
    },

    renderEnhancedTrends(trends, filterParams = {}) {
        const container = document.getElementById('trends-container');
    
        const allTrends = Array.isArray(trends) ? [...trends] : [];
        this.latestTrendsData = allTrends;
    
        if (!allTrends.length) {
            const filterMessage = Object.keys(filterParams).length > 0 ? ' for selected filters' : '';
            container.innerHTML = '<div class="trends-chart"><p>No trend data available' + filterMessage + '</p></div>';
            return;
        }
    
        const searchTerm = (this.trendSearchTerm || '').trim().toLowerCase();
        const workingTrends = searchTerm
            ? allTrends.filter(trend => this.matchesTrendSearch(trend, searchTerm))
            : allTrends;
    
        if (!workingTrends.length) {
            container.innerHTML = '<div class="trends-chart"><p>No trend data matches "' + this.escapeHtml(this.trendSearchTerm.trim()) + '"</p></div>';
            return;
        }
    
        const totalFines = workingTrends.reduce((sum, trend) => sum + (parseInt(trend.fine_count) || 0), 0);
        const totalAmount = workingTrends.reduce((sum, trend) => sum + (parseFloat(trend.total_amount) || 0), 0);
        const averageAmount = totalFines > 0 ? totalAmount / totalFines : 0;
        const highestPeriod = workingTrends.reduce((max, trend) =>
            (parseInt(trend.fine_count) || 0) > (parseInt(max.fine_count) || 0) ? trend : max, workingTrends[0]);
    
        const badges = [];
        if (Object.keys(filterParams).length > 0) {
            badges.push('<span class="filter-badge">Filtered View</span>');
            if (filterParams.years) {
            const yearsLabel = this.escapeHtml(filterParams.years.replace(/,/g, ', '));
            badges.push('<span class="filter-badge">Years: ' + yearsLabel + '</span>');
            }
        }
        if (searchTerm) {
            badges.push('<span class="filter-badge">Search: ' + this.escapeHtml(this.trendSearchTerm.trim()) + '</span>');
        }
    
        const filterInfo = badges.length
            ? '<div class="trends-filter-info">' + badges.join('') + '</div>'
            : '';
    
        const summaryCards =
            '<div class="trends-summary">' +
                filterInfo +
                '<div class="trends-metrics">' +
                    '<div class="metric-card">' +
                        '<div class="metric-icon">' + this.getTrendMetricIcon('count') + '</div>' +
                        '<div class="metric-content">' +
                            '<div class="metric-value">' + totalFines + '</div>' +
                            '<div class="metric-label">Total Fines</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="metric-card">' +
                        '<div class="metric-icon">' + this.getTrendMetricIcon('amount') + '</div>' +
                        '<div class="metric-content">' +
                            '<div class="metric-value">' + this.formatCurrency(totalAmount) + '</div>' +
                            '<div class="metric-label">Total Amount</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="metric-card">' +
                        '<div class="metric-icon">' + this.getTrendMetricIcon('average') + '</div>' +
                        '<div class="metric-content">' +
                            '<div class="metric-value">' + this.formatCurrency(averageAmount) + '</div>' +
                            '<div class="metric-label">Average Fine</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="metric-card">' +
                        '<div class="metric-icon">' + this.getTrendMetricIcon('peak') + '</div>' +
                        '<div class="metric-content">' +
                            '<div class="metric-value">' + this.escapeHtml(highestPeriod.period || '-') + '</div>' +
                            '<div class="metric-label">Peak Period (' + (highestPeriod.fine_count || 0) + ' fines)</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';
    
        const tableRows = workingTrends.map((trend, index) => {
            const prevTrend = index > 0 ? workingTrends[index - 1] : null;
            const currentCount = parseInt(trend.fine_count) || 0;
            const prevCount = prevTrend ? parseInt(prevTrend.fine_count) || 0 : 0;
            const currentAmount = Number(trend.total_amount || 0);
            const shareOfTotal = totalAmount > 0 ? (currentAmount / totalAmount) * 100 : 0;
    
            let trendIndicator = '';
            if (prevTrend) {
                if (currentCount > prevCount) {
                    trendIndicator = '<span class="trend-up">&#9650; +' + (currentCount - prevCount) + '</span>';
                } else if (currentCount < prevCount) {
                    trendIndicator = '<span class="trend-down">&#9660; -' + (prevCount - currentCount) + '</span>';
                } else {
                    trendIndicator = '<span class="trend-flat">&#8596; Flat +/-0</span>';
                }
            }
    
            return '<tr>' +
                '<td><strong>' + trend.period + '</strong></td>' +
                '<td>' + (trend.fine_count || 0) + ' ' + trendIndicator + '</td>' +
                '<td class="fine-amount">' + this.formatCurrency(trend.total_amount) + '</td>' +
                '<td>' + this.formatCurrency(trend.average_amount) + '</td>' +
                '<td>' + shareOfTotal.toFixed(1) + '%</td>' +
            '</tr>';
        }).join('');
    
        const tableHTML =
            '<table class="data-table">' +
                '<thead>' +
                    '<tr>' +
                        '<th>Period</th>' +
                        '<th>Fine Count</th>' +
                        '<th>Total Amount</th>' +
                        '<th>Average Amount</th>' +
                        '<th>Share of Total</th>' +
                    '</tr>' +
                '</thead>' +
                '<tbody>' +
                    tableRows +
                '</tbody>' +
            '</table>';
    
        container.innerHTML = summaryCards + tableHTML;
    },

    renderTrendsError(error) {
        const container = document.getElementById('trends-container');
        container.innerHTML = [
            '<div class="error-state">',
                '<strong>Failed to load trends</strong><br>',
                error,
            '</div>'
        ].join('');
    },

    getTrendCacheKey(period, filterParams = {}) {
        const yearsKey = Array.isArray(filterParams.yearsArray) && filterParams.yearsArray.length
            ? filterParams.yearsArray.slice().sort().join('-')
            : 'all';
        const firmKey = filterParams.firm || '';
        const breachKey = filterParams.breachType || '';
        const sectorKey = filterParams.sector || '';
        const riskKey = filterParams.riskLevel || '';
        return period + '::' + yearsKey + '::' + firmKey + '::' + breachKey + '::' + sectorKey + '::' + riskKey;
    },

    filterTrendData(trends = [], filterParams = {}) {
        if (!Array.isArray(trends)) return [];
        const yearsArray = Array.isArray(filterParams.yearsArray) ? filterParams.yearsArray : [];
        if (!yearsArray.length) return trends;
        const yearsSet = new Set(yearsArray.map(year => parseInt(year, 10)).filter(year => !isNaN(year)));
    
        return trends.filter(trend => {
            const year = this.getYearFromPeriod(trend.period);
            return year !== null ? yearsSet.has(year) : true;
        });
    },

    matchesTrendSearch(trend, searchTerm) {
        if (!searchTerm) return true;
        const haystack = [
            trend.period,
            trend.fine_count,
            trend.total_amount,
            trend.average_amount
        ].map(value => String(value || '')).join(' ').toLowerCase();
        return haystack.includes(searchTerm);
    },

    refreshTrends(filterParams = this.currentFilterParams || {}) {
        this.loadTrends(false, filterParams);
    },

    getTrendMetricIcon(kind) {
        const icons = {
            count: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18h16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><path d="M7 18v-7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><path d="M12 18v-11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><path d="M17 18v-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg>',
            amount: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" stroke-width="1.6"></circle><path d="M12 8.5v7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><path d="M9.5 11.5c0-1.71 1.2-3 2.7-3H14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><path d="M14.5 12.5c0 1.71-1.2 3-2.7 3H10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg>',
            average: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 16.5h15" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><path d="M6.5 16.5 12 7.5l5.5 9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 7.5v9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg>',
            peak: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 8 12h4l-2 9 6-10h-4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"></path></svg>'
        };
    
        return icons[kind] || icons.count;
    }
  })
}
export { applyTrendsMixin }
