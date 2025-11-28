function applyStatsMixin(klass) {
  Object.assign(klass.prototype, {
    async loadStats() {
        await this.loadStatsWithFilters();
    },

    async loadStatsWithFilters(filterParams = {}) {
        try {
            this.currentFilterParams = filterParams || {};
            const hasFilters = this.hasActiveFilters(filterParams);
    
            if (!hasFilters) {
                const response = await fetch('/api/enforcement/stats');
                const data = await response.json();
    
                if (!data.success) {
                    throw new Error(data.error || 'Failed to load stats');
                }
    
                this.isFilterActive = false;
                this.currentFilterParams = {};
                this.baseStats = data.stats;
                this.baseYearlyOverview = data.stats.yearlyOverview || [];
                this.baseControlRecommendations = data.stats.controlRecommendations || [];
                this.baseCategoryTrends = data.stats.topCategoryTrends || [];
                this.latestFilteredFines = [];
                this.latestFilteredTotal = 0;
    
                this.populateFilters(data.stats);
                this.renderStats(data.stats);
                this.filteredSummary = null;
                if (Array.isArray(this.allFines) && this.allFines.length) {
                    this.renderFines(this.allFines);
                }
                await this.loadTrends(true, {});
                await this.loadTopFirms();
                return;
            }
    
            const { fines: filteredFines, total: totalMatches } = await this.fetchFilteredFines(filterParams);
            this.isFilterActive = true;
            this.latestFilteredFines = filteredFines;
            this.latestFilteredTotal = totalMatches;
    
            this.renderFilteredStats(filteredFines, filterParams);
            this.renderFines(filteredFines);
    
            const topFirmSnapshot = this.buildTopFirmsFromFines(filteredFines);
            this.renderTopFirms(topFirmSnapshot, {
                filterMode: true,
                scopeLabel: this.filteredSummary ? this.filteredSummary.scopeLabel : null
            });
    
            await this.loadTrends(true, filterParams);
        } catch (error) {
            console.warn('[enforcement] Statistics unavailable:', error);

            const fallback =
                (this.baseStats && Object.keys(this.baseStats).length ? this.baseStats : null) ||
                this.buildFallbackStats();

            this.baseStats = fallback;
            this.isFilterActive = false;
            this.latestFilteredFines = Array.isArray(this.allFines) ? this.allFines : [];

            this.populateFilters(fallback);
            this.renderStats(fallback);
            this.updateHeaderMeta('Data temporarily unavailable');

            const container = document.getElementById('stats-container');
            if (container && !container.querySelector('.stats-notice')) {
                container.insertAdjacentHTML(
                    'afterbegin',
                    '<div class="stats-notice loading-state">Statistics service is temporarily unavailable. Showing cached totals.</div>'
                );
            }
        }
    },

    renderStats(stats) {
        if (!stats) return;
        this.isFilterActive = false;
        this.showAllFines = false;
        this.tableRowLimit = this.defaultTableRowLimit;
        this.latestFilteredTotal = Array.isArray(this.allFines) ? this.allFines.length : 0;
        this.updateYearChips([]);

        const container = document.getElementById('stats-container');
        const overview = stats.overview || {};
        const totalFines = overview.total_fines || 0;
        const finesThisYear = overview.fines_this_year || 0;
        const totalAmount = overview.total_amount || 0;
        const amountThisYear = overview.amount_this_year || 0;
        const last30Count = overview.fines_last_30_days || 0;
        const last30Amount = overview.amount_last_30_days || 0;
        const distinctFirms = overview.distinct_firms || 0;
        const repeatOffenders = overview.repeat_offenders || 0;

        container.innerHTML = [
            '<div class="stat-card clickable" onclick="window.enforcementDashboard.showFinesByPeriod(\'ytd\', \'Year-to-Date Fines\')" style="position: relative;">',
                this.getStatIcon('total'),
                '<div class="stat-value">' + totalFines + '</div>',
                '<div class="stat-label">Total Enforcement Actions</div>',
                '<div class="stat-change change-positive">Year-to-date: ' + finesThisYear + '</div>',
            '</div>',
            '<div class="stat-card clickable" onclick="window.enforcementDashboard.showFinesByPeriod(\'ytd\', \'Year-to-Date Fines\')" style="position: relative;">',
                this.getStatIcon('fines'),
                '<div class="stat-value">' + this.formatCurrency(totalAmount) + '</div>',
                '<div class="stat-label">Total Fines Issued</div>',
                '<div class="stat-change">YTD amount: ' + this.formatCurrency(amountThisYear) + '</div>',
            '</div>',
            '<div class="stat-card clickable" onclick="window.enforcementDashboard.showFinesByPeriod(\'30\', \'Fines - Last 30 Days\')" style="position: relative;">',
                this.getStatIcon('recent'),
                '<div class="stat-value">' + last30Count + '</div>',
                '<div class="stat-label">Last 30 Days</div>',
                '<div class="stat-change">Amount recovered: ' + this.formatCurrency(last30Amount) + '</div>',
            '</div>',
            '<div class="stat-card clickable" onclick="window.enforcementDashboard.showDistinctFirms()" style="position: relative;">',
                this.getStatIcon('risk'),
                '<div class="stat-value">' + this.formatNumber(distinctFirms) + '</div>',
                '<div class="stat-label">Distinct Firms Fined</div>',
                '<div class="stat-change clickable-text" onclick="event.stopPropagation(); window.enforcementDashboard.showRepeatOffenders()" style="cursor: pointer; text-decoration: underline; color: #3b82f6;">Repeat offenders: ' + this.formatNumber(repeatOffenders) + '</div>',
            '</div>'
        ].join('');

        this.updateHeaderMeta('Full dataset');

        // Render the fines timeline
        this.renderFinesTimeline(overview);

        this.renderPatternCards({
            topBreachTypes: stats.topBreachTypes || [],
            topSectors: stats.topSectors || [],
            overview,
            yearlyOverview: stats.yearlyOverview || []
        });

        this.renderYearlyOverview(stats.yearlyOverview || []);
        this.renderCategoryTrends(stats.topCategoryTrends || []);
        this.renderControlPlaybook(stats.controlRecommendations || []);
    },

    renderFinesTimeline(overview) {
        const container = document.getElementById('timeline-bars');
        if (!container) return;

        const last30Count = overview.fines_last_30_days || 0;
        const last30Amount = overview.amount_last_30_days || 0;
        const last60Count = overview.fines_last_60_days || 0;
        const last60Amount = overview.amount_last_60_days || 0;
        const last90Count = overview.fines_last_90_days || 0;
        const last90Amount = overview.amount_last_90_days || 0;
        const ytdCount = overview.fines_this_year || 0;
        const ytdAmount = overview.amount_this_year || 0;

        // Calculate max for progress bars
        const maxAmount = Math.max(last30Amount, last60Amount, last90Amount, ytdAmount) || 1;

        const timelineData = [
            { period: '30', label: 'Last 30 Days', count: last30Count, amount: last30Amount },
            { period: '60', label: 'Last 60 Days', count: last60Count, amount: last60Amount },
            { period: '90', label: 'Last 90 Days', count: last90Count, amount: last90Amount },
            { period: 'ytd', label: 'Year to Date', count: ytdCount, amount: ytdAmount }
        ];

        container.innerHTML = timelineData.map(item => {
            const progressPercent = Math.min(100, (item.amount / maxAmount) * 100);
            return `
                <div class="timeline-item" data-period="${item.period}" onclick="window.enforcementDashboard.showFinesByPeriod('${item.period}', 'Fines - ${item.label}')">
                    <div class="timeline-period-label">${item.label}</div>
                    <div class="timeline-amount">${this.formatCurrency(item.amount)}</div>
                    <div class="timeline-count">${item.count} fine${item.count !== 1 ? 's' : ''}</div>
                    <div class="timeline-progress">
                        <div class="timeline-progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderFilteredStats(fines = [], filterContext = {}) {
        const container = document.getElementById('stats-container');
        this.showAllFines = false;
        this.tableRowLimit = this.defaultTableRowLimit;
    
        const totalFines = fines.length;
        const totalAmount = fines.reduce((sum, fine) => sum + (Number(fine.amount) || 0), 0);
        const averageAmount = totalFines > 0 ? totalAmount / totalFines : 0;
    
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        let recentCount = 0;
        let recentAmount = 0;
    
        const firmCounts = new Map();
        let amountThisYear = 0;
        const selectedYears = Array.isArray(filterContext.yearsArray) && filterContext.yearsArray.length
            ? new Set(filterContext.yearsArray.map(year => Number(year)))
            : null;
        const currentYear = new Date().getFullYear();
    
        fines.forEach(fine => {
            const issueDate = fine.date_issued ? new Date(fine.date_issued) : null;
            const amount = Number(fine.amount) || 0;
    
            if (issueDate && issueDate >= thirtyDaysAgo) {
                recentCount += 1;
                recentAmount += amount;
            }
    
            const fineYear = issueDate ? issueDate.getFullYear() : null;
            if (selectedYears && fineYear !== null) {
                if (selectedYears.has(fineYear)) {
                    amountThisYear += amount;
                }
            } else if (fineYear === currentYear) {
                amountThisYear += amount;
            }
    
            const firm = (fine.firm_individual || 'Unknown').trim() || 'Unknown';
            firmCounts.set(firm, (firmCounts.get(firm) || 0) + 1);
        });
    
        const repeatOffenders = Array.from(firmCounts.values()).filter(count => count > 1).length;
    
        const scopeLabel = filterContext.years && filterContext.years.length
            ? 'Scope: ' + filterContext.years.replace(/,/g, ', ')
            : 'Matches filters';
        const coverageText = scopeLabel.startsWith('Scope: ')
            ? 'Filtered | ' + scopeLabel.replace('Scope: ', '')
            : 'Filtered view';
    
        container.innerHTML = [
            '<div class="stat-card">',
                this.getStatIcon('total'),
                '<div class="stat-value">' + totalFines + '</div>',
                '<div class="stat-label">Filtered Enforcement Actions</div>',
                '<div class="stat-change change-positive">' + scopeLabel + '</div>',
            '</div>',
            '<div class="stat-card">',
                this.getStatIcon('fines'),
                '<div class="stat-value">' + this.formatCurrency(totalAmount) + '</div>',
                '<div class="stat-label">Total Filtered Fines</div>',
                '<div class="stat-change">Average fine: ' + this.formatCurrency(averageAmount) + '</div>',
            '</div>',
            '<div class="stat-card">',
                this.getStatIcon('recent'),
                '<div class="stat-value">' + recentCount + '</div>',
                '<div class="stat-label">Last 30 Days (Filtered)</div>',
                '<div class="stat-change">Amount collected: ' + this.formatCurrency(recentAmount) + '</div>',
            '</div>',
            '<div class="stat-card">',
                this.getStatIcon('risk'),
                '<div class="stat-value">' + this.formatNumber(firmCounts.size) + '</div>',
                '<div class="stat-label">Distinct Firms (Filtered)</div>',
                '<div class="stat-change">Repeat offenders: ' + this.formatNumber(repeatOffenders) + '</div>',
            '</div>'
        ].join('');
    
        this.updateHeaderMeta(coverageText);
    
        const patterns = this.derivePatternsFromFines(fines);
        if (patterns.overview) {
            patterns.overview.amount_this_year = amountThisYear;
            patterns.overview.total_amount = totalAmount;
            patterns.overview.distinct_firms = firmCounts.size;
            patterns.overview.repeat_offenders = repeatOffenders;
        }
    
        const yearlySeries = Array.isArray(patterns.yearlyOverview) && patterns.yearlyOverview.length
            ? patterns.yearlyOverview
            : this.baseYearlyOverview;
    
        const categorySeries = Array.isArray(patterns.categoryTrendSeries) && patterns.categoryTrendSeries.length
            ? patterns.categoryTrendSeries
            : this.baseCategoryTrends;
    
        patterns.yearlyOverview = yearlySeries;
        this.renderPatternCards(patterns);
    
        this.renderYearlyOverview(yearlySeries, {
            filterMode: true,
            selectedYears: filterContext.yearsArray
        });
    
        this.renderCategoryTrends(categorySeries, {
            filterMode: true,
            selectedYears: filterContext.yearsArray
        });
    
        this.renderControlPlaybook(this.baseControlRecommendations, {
            filterMode: true,
            fallbackCategories: patterns.topBreachTypes || []
        });
    
        // Store amount for export or additional insights
        this.filteredSummary = {
            totalAmount,
            amountThisYear,
            recentAmount,
            scopeLabel,
            distinctFirms: firmCounts.size,
            repeatOffenders,
            totalMatches: typeof this.latestFilteredTotal === 'number' ? this.latestFilteredTotal : totalFines
        };
    
        if (Array.isArray(filterContext.yearsArray)) {
            this.updateYearChips(filterContext.yearsArray);
        }
    },

    renderStatsError(error) {
        const container = document.getElementById('stats-container');
        container.innerHTML = [
            '<div class="error-state">',
                '<strong>Failed to load statistics</strong><br>',
                error,
            '</div>'
        ].join('');
    
        this.updateHeaderMeta('Unavailable');
    },

    populateFilters(stats) {
        if (!stats) return;
        const years = Array.isArray(stats.availableYears) ? stats.availableYears : [];
        const categories = Array.isArray(stats.availableCategories) ? stats.availableCategories : [];
    
        const yearSelect = document.getElementById('year-filter');
        if (yearSelect && years.length) {
            const previousSelection = Array.from(yearSelect.selectedOptions).map(option => option.value);
            yearSelect.innerHTML = years.map(year => '<option value="' + year + '">' + year + '</option>').join('');
            previousSelection.forEach(year => {
                const option = Array.from(yearSelect.options).find(opt => opt.value === year);
                if (option) option.selected = true;
            });
        }
    
        const categorySelect = document.getElementById('breach-category');
        if (categorySelect && categories.length) {
            const currentValue = categorySelect.value;
            categorySelect.innerHTML = ['<option value="">All Categories</option>']
                .concat(categories.map(category => {
                    const label = this.escapeHtml(category || 'Unknown')
                    return '<option value="' + label + '">' + label + '</option>'
                }))
                .join('');
            if (currentValue) {
                categorySelect.value = currentValue;
            }
        }
    
        const selectedYears = yearSelect
            ? Array.from(yearSelect.selectedOptions)
                .map(option => parseInt(option.value, 10))
                .filter(year => !isNaN(year))
            : [];
        this.updateYearChips(selectedYears);
    },

    renderPatternCards(patterns) {
        const container = document.getElementById('pattern-container');
        if (!container) return;
    
        const cards = [];
        const toNumber = value => Number(value || 0);
        const overview = patterns.overview || {};
    
        const yearlyPool = Array.isArray(patterns.yearlyOverview) && patterns.yearlyOverview.length
            ? patterns.yearlyOverview
            : this.baseYearlyOverview || [];
    
        const sortedYears = Array.isArray(yearlyPool)
            ? [...yearlyPool].sort((a, b) => (b.year || 0) - (a.year || 0))
            : [];
    
        const currentYearData = sortedYears[0];
        const previousYearData = sortedYears[1];
    
        const dominantCategorySource = (currentYearData && currentYearData.dominant_category) || (patterns.topBreachTypes && patterns.topBreachTypes[0]);
        if (dominantCategorySource && (dominantCategorySource.category || dominantCategorySource.category === '')) {
            const rawCategory = dominantCategorySource.category || 'Not captured';
            const categoryName = this.escapeHtml(rawCategory === 'Uncategorised' ? 'Not captured' : rawCategory);
            const categoryActions = this.formatNumber(toNumber(dominantCategorySource.count || dominantCategorySource.fine_count));
            const categoryAmount = this.formatCurrency(toNumber(dominantCategorySource.total_amount));
            cards.push(
                '<article class="pattern-card">' +
                    '<span class="pattern-label">Dominant breach theme</span>' +
                    '<span class="pattern-highlight">' + categoryName + '</span>' +
                    '<span class="pattern-footnote">' + categoryActions + ' actions  |  ' + categoryAmount + '</span>' +
                '</article>'
            );
        }
    
        if (currentYearData) {
            const currentYear = currentYearData.year;
            const currentCount = this.formatNumber(toNumber(currentYearData.fine_count));
            const currentTotal = this.formatCurrency(toNumber(currentYearData.total_amount));
            let yoyNarrative = 'Baseline year in focus';
            if (previousYearData) {
                const prevTotal = toNumber(previousYearData.total_amount);
                const delta = toNumber(currentYearData.total_amount) - prevTotal;
                if (prevTotal > 0) {
                    const pctChange = (delta / prevTotal) * 100;
                    yoyNarrative = (pctChange >= 0 ? 'Increase ' : 'Decrease ') + Math.abs(pctChange).toFixed(1) + '% vs ' + previousYearData.year;
                } else {
                    yoyNarrative = 'Change vs ' + previousYearData.year + ' unavailable';
                }
            }
    
            cards.push(
                '<article class="pattern-card">' +
                    '<span class="pattern-label">Annual enforcement run-rate</span>' +
                    '<span class="pattern-highlight">' + currentYear + ': ' + currentCount + ' fines</span>' +
                    '<span class="pattern-footnote">Total ' + currentTotal + '  |  ' + yoyNarrative + '</span>' +
                '</article>'
            );
        }
    
        const dominantSectorSource = (currentYearData && currentYearData.dominant_sector) || (patterns.topSectors && patterns.topSectors[0]);
        if (dominantSectorSource && dominantSectorSource.sector) {
            const rawSector = dominantSectorSource.sector;
            const sectorName = this.escapeHtml(!rawSector || rawSector === 'Unspecified' ? 'Not captured' : rawSector);
            const sectorActions = this.formatNumber(toNumber(dominantSectorSource.count || dominantSectorSource.fine_count));
            const sectorAmount = this.formatCurrency(toNumber(dominantSectorSource.total_amount));
            cards.push(
                '<article class="pattern-card">' +
                    '<span class="pattern-label">Most exposed sector</span>' +
                    '<span class="pattern-highlight">' + sectorName + '</span>' +
                    '<span class="pattern-footnote">' + sectorActions + ' actions  |  ' + sectorAmount + '</span>' +
                '</article>'
            );
        }
    
        if (overview) {
            const distinctFirms = this.formatNumber(overview.distinct_firms || 0);
            const repeatOffenders = this.formatNumber(overview.repeat_offenders || 0);
            const averageRisk = Math.round(overview.average_risk_score || 0);
            const amountThisYear = overview.amount_this_year ? this.formatCurrency(overview.amount_this_year) : 'N/A';
            const hasExposure = (overview.distinct_firms || overview.repeat_offenders || overview.amount_this_year);
    
            if (hasExposure) {
                cards.push(
                    '<article class="pattern-card">' +
                        '<span class="pattern-label">Firm exposure</span>' +
                        '<span class="pattern-highlight">' + distinctFirms + ' firms fined</span>' +
                        '<span class="pattern-footnote">Repeat offenders ' + repeatOffenders + '  |  YTD fines ' + amountThisYear + '  |  Avg risk ' + averageRisk + '/100</span>' +
                    '</article>'
                );
            } else {
                cards.push(
                    '<article class="pattern-card">' +
                        '<span class="pattern-label">Firm exposure</span>' +
                        '<span class="pattern-highlight">No firm data captured</span>' +
                        '<span class="pattern-footnote">Adjust filters or refresh to view firm-level metrics.</span>' +
                    '</article>'
                );
            }
        }
    
        if (!cards.length) {
            container.innerHTML = '';
            return;
        }
    
        container.innerHTML = cards.join('');
    },

    renderYearlyOverview(yearlyData = [], options = {}) {
        const chartCanvas = document.getElementById('yearlyTrendChart');
        const contextEl = document.getElementById('yearly-context');
        const tableContainer = document.getElementById('yearly-table-container');
        if (!chartCanvas || !contextEl || !tableContainer) return;
    
        const selectedYearsSet = Array.isArray(options.selectedYears) && options.selectedYears.length
            ? new Set(options.selectedYears.map(year => parseInt(year, 10)).filter(year => !isNaN(year)))
            : null;
    
        const workingData = selectedYearsSet
            ? yearlyData.filter(item => selectedYearsSet.has(item.year))
            : yearlyData;
    
        if (!workingData || workingData.length === 0) {
            if (this.charts.yearly) {
                this.charts.yearly.destroy();
                this.charts.yearly = null;
            }
            contextEl.textContent = options.filterMode
                ? 'No yearly enforcement data available for selected filters.'
                : 'No yearly enforcement data available yet.';
            tableContainer.innerHTML = '<p class="empty-state">No yearly enforcement data available.</p>';
            return;
        }
    
        const sorted = [...workingData].sort((a, b) => (a.year || 0) - (b.year || 0));
        const labels = sorted.map(item => item.year);
        const fineCounts = sorted.map(item => Number(item.fine_count || 0));
        const totalAmounts = sorted.map(item => {
            const millions = Number(item.total_amount || 0) / 1000000;
            return Number.isFinite(millions) ? Number(millions.toFixed(2)) : 0;
        });
    
        if (this.charts.yearly) {
            this.charts.yearly.destroy();
        }
    
        this.charts.yearly = new Chart(chartCanvas, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        type: 'bar',
                        label: 'Fine count',
                        data: fineCounts,
                        backgroundColor: 'rgba(59, 130, 246, 0.4)',
                        borderColor: '#3b82f6',
                        borderWidth: 1,
                        borderRadius: 6,
                        yAxisID: 'y'
                    },
                    {
                        type: 'line',
                        label: 'Total fines (&pound;m)',
                        data: totalAmounts,
                        borderColor: '#7c3aed',
                        backgroundColor: 'rgba(124, 58, 237, 0.2)',
                        tension: 0.35,
                        borderWidth: 2,
                        fill: false,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { intersect: false, mode: 'nearest' },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Fine count'
                        }
                    },
                    y1: {
                        beginAtZero: true,
                        position: 'right',
                        grid: { drawOnChartArea: false },
                        title: {
                            display: true,
                            text: 'Total fines (&pound;m)'
                        }
                    }
                },
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    
        const latest = sorted[sorted.length - 1];
        const latestTotal = this.formatCurrency(Number(latest.total_amount || 0));
        const latestCount = this.formatNumber(Number(latest.fine_count || 0));
        const prefix = options.filterMode ? 'Filtered  |  ' : '';
        contextEl.textContent = prefix + latest.year + ': ' + latestCount + ' fines  |  ' + latestTotal;
    
        const normalise = highlight => {
            if (!highlight) return {};
            if (typeof highlight === 'object') return highlight;
            try {
                return JSON.parse(highlight);
            } catch (error) {
                return { category: highlight };
            }
        };
    
        const rows = [...sorted].reverse().map(item => {
            const categoryInfo = normalise(item.dominant_category);
            const sectorInfo = normalise(item.dominant_sector);
            return '<tr>' +
                '<td><strong>' + item.year + '</strong></td>' +
                '<td>' + this.formatNumber(Number(item.fine_count || 0)) + '</td>' +
                '<td class="fine-amount">' + this.formatCurrency(Number(item.total_amount || 0)) + '</td>' +
                '<td>' + this.escapeHtml(categoryInfo.category || 'Not captured') + '</td>' +
                '<td>' + this.escapeHtml(sectorInfo.sector || 'Not captured') + '</td>' +
            '</tr>';
        }).join('');
    
        tableContainer.innerHTML = '<table class="data-table">' +
            '<thead>' +
                '<tr>' +
                    '<th>Year</th>' +
                    '<th>Count</th>' +
                    '<th>Total Amount</th>' +
                    '<th>Lead Breach</th>' +
                    '<th>Lead Sector</th>' +
                '</tr>' +
            '</thead>' +
            '<tbody>' + rows + '</tbody>' +
        '</table>';
    },

    renderCategoryTrends(trendData = [], options = {}) {
        const chartCanvas = document.getElementById('categoryTrendChart');
        const summaryEl = document.getElementById('category-trend-summary');
        const contextEl = document.getElementById('category-context');
        if (!chartCanvas || !summaryEl || !contextEl) return;
    
        if (!trendData || trendData.length === 0) {
            if (this.charts.category) {
                this.charts.category.destroy();
                this.charts.category = null;
            }
            summaryEl.innerHTML = '<p class="empty-state">No breach-category trend data available.</p>';
            contextEl.textContent = options.filterMode
                ? 'Category signals reference the full dataset while filters are active.'
                : 'No category data captured yet.';
            return;
        }
    
        const filteredTrendData = (() => {
            const meaningful = trendData.filter(item => item.category && item.category !== 'Uncategorised');
            return meaningful.length ? meaningful : trendData;
        })();
    
        const trendLookup = new Map();
        filteredTrendData.forEach(item => {
            const category = item.category || 'Uncategorised';
            const year = Number(item.year);
            if (!Number.isFinite(year)) return;
            const categoryBucket = trendLookup.get(category) || { totals: { count: 0, amount: 0 }, years: new Map() };
            const yearData = categoryBucket.years.get(year) || { fine_count: 0, total_amount: 0 };
            const count = Number(item.fine_count || 0);
            const amount = Number(item.total_amount || 0);
            yearData.fine_count += count;
            yearData.total_amount += amount;
            categoryBucket.totals.count += count;
            categoryBucket.totals.amount += amount;
            categoryBucket.years.set(year, yearData);
            trendLookup.set(category, categoryBucket);
        });
    
        const years = Array.from(new Set(filteredTrendData.map(item => Number(item.year)).filter(Number.isFinite))).sort((a, b) => a - b);
    
        if (!years.length) {
            if (this.charts.category) {
                this.charts.category.destroy();
                this.charts.category = null;
            }
            summaryEl.innerHTML = '<p class="empty-state">No category timeline available for the selected filters.</p>';
            contextEl.textContent = options.filterMode
                ? 'Category signals reference the full dataset while filters are active.'
                : 'No category data captured yet.';
            return;
        }
    
        const rankedCategories = Array.from(trendLookup.entries()).map(([category, payload]) => ({
            category,
            totals: payload.totals,
            years: payload.years
        })).sort((a, b) => b.totals.count - a.totals.count);
    
        const categories = rankedCategories.map(entry => entry.category);
    
        const palette = ['#4338ca', '#2563eb', '#0ea5e9', '#f97316', '#f43f5e', '#22c55e'];
        const datasets = rankedCategories.map((entry, index) => {
            const metaByYear = {};
            const dataPoints = years.map(year => {
                const yearData = entry.years.get(year) || { fine_count: 0, total_amount: 0 };
                metaByYear[year] = yearData;
                return yearData.fine_count;
            });
    
            return {
                type: 'line',
                label: entry.category,
                data: dataPoints,
                borderColor: palette[index % palette.length],
                backgroundColor: palette[index % palette.length],
                tension: 0.35,
                fill: false,
                yAxisID: 'y',
                pointRadius: 4,
                pointHoverRadius: 6,
                metaByYear
            };
        });
    
        if (this.charts.category) {
            this.charts.category.destroy();
        }
    
        const formatCurrency = value => this.formatCurrency(value);
    
        this.charts.category = new Chart(chartCanvas, {
            type: 'line',
            data: {
                labels: years,
                datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { usePointStyle: true }
                    },
                    tooltip: {
                        callbacks: {
                            label: context => {
                                const dataset = context.dataset;
                                const year = years[context.dataIndex];
                                const meta = dataset.metaByYear ? dataset.metaByYear[year] : null;
                                const countText = context.formattedValue + ' fines';
                                if (meta) {
                                    const amountText = formatCurrency(meta.total_amount || 0);
                                    return dataset.label + ': ' + countText + ' (' + amountText + ')';
                                }
                                return dataset.label + ': ' + countText;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Fines'
                        }
                    }
                },
                interaction: { mode: 'nearest', intersect: false },
                elements: {
                    line: { borderWidth: 2 },
                    point: { radius: 4, hoverRadius: 6 }
                }
            }
        });
    
        const contextPrefix = options.filterMode ? 'Filtered  |  ' : '';
        const firstYear = years[0];
        const lastYear = years[years.length - 1];
        const yearRange = firstYear === lastYear ? firstYear : firstYear + '-' + lastYear;
        const rangeLabel = firstYear === lastYear ? 'in ' + yearRange : 'across ' + yearRange;
        const yearsLabel = options.filterMode && Array.isArray(options.selectedYears) && options.selectedYears.length
            ? options.selectedYears.join(', ')
            : rangeLabel;
        contextEl.textContent = contextPrefix + 'Category momentum for ' + yearsLabel;
    
        const summaryItems = rankedCategories.map(entry => {
            const label = entry.category === 'Uncategorised' ? 'Not captured' : entry.category;
            const recentYears = years
                .map(year => ({ year, data: entry.years.get(year) }))
                .filter(item => item.data && item.data.fine_count)
                .slice(-3)
                .reverse()
                .map(item => item.year + ' (' + item.data.fine_count + ')')
                .join('  |  ');
            return '<div><span class="category-chip">' + this.escapeHtml(label) + '</span> ' +
                this.formatNumber(entry.totals.count) + ' fines  |  ' + this.formatCurrency(entry.totals.amount) +
                (recentYears ? ' | ' + recentYears : '') + '</div>';
        });
    
        summaryEl.innerHTML = summaryItems.join('');
    },

    renderControlPlaybook(recommendations = [], options = {}) {
        const container = document.getElementById('control-playbook');
        const contextEl = document.getElementById('control-context');
        if (!container) return;
    
        if (!recommendations || recommendations.length === 0) {
            container.innerHTML = '<p class="empty-state">No control guidance available yet.</p>';
            if (contextEl) {
                contextEl.textContent = options.filterMode
                    ? 'Control guidance will update once sufficient filtered data is available.'
                    : 'Control guidance will appear once analytics load.';
            }
            return;
        }
    
        if (contextEl) {
            contextEl.textContent = options.filterMode
                ? 'Filters applied - showing baseline control guidance for context.'
                : 'Linking recurring enforcement themes to practical remediation steps.';
        }
    
        const highlightCategories = Array.isArray(options.fallbackCategories)
            ? options.fallbackCategories.map(item => item.category).filter(Boolean)
            : [];
    
        const recommendationMap = new Map();
        recommendations.forEach(rec => {
            if (rec && rec.category) recommendationMap.set(rec.category, rec);
        });
    
        const prioritized = highlightCategories
            .map(name => recommendationMap.get(name))
            .filter(Boolean);
    
        const baseList = recommendations.filter(rec => !highlightCategories.includes(rec.category));
        const combined = [...prioritized, ...baseList].slice(0, 4);
    
        const cards = combined.map(rec => {
            const categoryLabel = (!rec.category || rec.category === 'Uncategorised') ? 'General Compliance' : rec.category;
            const totalAmount = this.formatCurrency(Number(rec.recentActivity?.totalAmount || 0));
            const totalFines = this.formatNumber(Number(rec.recentActivity?.totalFines || rec.recentActivity?.total_fines || 0));
            const narrative = this.escapeHtml(rec.recentActivity?.narrative || 'Recurring focus for the FCA.');
            const yearsList = Array.isArray(rec.dominantYears) && rec.dominantYears.length
                ? 'Seen in ' + rec.dominantYears.join(', ')
                : '';
            const controlsList = (rec.recommendedControls || []).map(item => '<li>' + this.escapeHtml(item) + '</li>').join('');
            const monitoringList = (rec.monitoringChecks || []).map(item => '<li>' + this.escapeHtml(item) + '</li>').join('');
    
            return '<article class="playbook-card">' +
                '<div class="playbook-header">' +
                    '<span class="playbook-category">' + this.escapeHtml(categoryLabel) + '</span>' +
                    '<div class="playbook-headline">' + this.escapeHtml(rec.headline || '') + '</div>' +
                    '<div class="playbook-meta">' + narrative + '</div>' +
                    '<div class="playbook-meta">' + totalFines + ' fines  |  ' + totalAmount + (yearsList ? '  |  ' + yearsList : '') + '</div>' +
                '</div>' +
                '<div>' +
                    '<strong>Controls to prioritise</strong>' +
                    '<ul class="playbook-bullets">' + (controlsList || '<li>Documented control actions pending.</li>') + '</ul>' +
                '</div>' +
                '<div>' +
                    '<strong>Monitoring triggers</strong>' +
                    '<ul class="playbook-bullets">' + (monitoringList || '<li>Define MI and assurance coverage.</li>') + '</ul>' +
                '</div>' +
                '<div class="playbook-footnote">' + this.escapeHtml(rec.riskIfIgnored || 'Reinforce governance to stay ahead of enforcement expectations.') + '</div>' +
            '</article>';
        });
    
        container.innerHTML = cards.join('');
    },

    derivePatternsFromFines(fines) {
        if (!fines || !fines.length) {
            return { topBreachTypes: [], topSectors: [], overview: {}, yearlyOverview: [], categoryTrendSeries: [] };
        }
    
        const categoryMap = new Map();
        const sectorMap = new Map();
        const yearlyMap = new Map();
        const categoryYearMap = new Map();
        let riskSum = 0;
        let totalAmount = 0;
        let amountThisYear = 0;
        const firmCounts = new Map();
        const currentYear = new Date().getFullYear();
    
        fines.forEach(fine => {
            const amount = Number(fine.amount || 0);
            const issuedDate = fine.date_issued ? new Date(fine.date_issued) : null;
            const issuedYear = issuedDate && Number.isFinite(issuedDate.getFullYear()) ? issuedDate.getFullYear() : null;
    
            if (typeof fine.risk_score === 'number') riskSum += fine.risk_score;
            totalAmount += amount;
            if (issuedYear === currentYear) amountThisYear += amount;
    
            const firm = (fine.firm_individual || 'Unknown').trim() || 'Unknown';
            firmCounts.set(firm, (firmCounts.get(firm) || 0) + 1);
    
            const categories = (fine.breach_categories || []).filter(Boolean);
            const sectors = (fine.affected_sectors || []).filter(Boolean);
    
            categories.forEach(category => {
                const record = categoryMap.get(category) || { category, count: 0, total_amount: 0 };
                record.count += 1;
                record.total_amount += amount;
                categoryMap.set(category, record);
    
                if (issuedYear !== null) {
                    const key = category + '::' + issuedYear;
                    const bucket = categoryYearMap.get(key) || { category, year: issuedYear, fine_count: 0, total_amount: 0 };
                    bucket.fine_count += 1;
                    bucket.total_amount += amount;
                    categoryYearMap.set(key, bucket);
                }
            });
    
            sectors.forEach(sector => {
                const record = sectorMap.get(sector) || { sector, count: 0, total_amount: 0 };
                record.count += 1;
                record.total_amount += amount;
                sectorMap.set(sector, record);
            });
    
            if (issuedYear !== null) {
                const yearBucket = yearlyMap.get(issuedYear) || {
                    year: issuedYear,
                    fine_count: 0,
                    total_amount: 0,
                    categoryCounts: new Map(),
                    sectorCounts: new Map()
                };
    
                yearBucket.fine_count += 1;
                yearBucket.total_amount += amount;
    
                categories.forEach(category => {
                    const count = yearBucket.categoryCounts.get(category) || 0;
                    yearBucket.categoryCounts.set(category, count + 1);
                });
    
                sectors.forEach(sector => {
                    const count = yearBucket.sectorCounts.get(sector) || 0;
                    yearBucket.sectorCounts.set(sector, count + 1);
                });
    
                yearlyMap.set(issuedYear, yearBucket);
            }
        });
    
        const topBreachTypes = Array.from(categoryMap.values()).sort((a, b) => b.count - a.count).slice(0, 3);
        const topSectors = Array.from(sectorMap.values()).sort((a, b) => b.count - a.count).slice(0, 3);
    
        const yearlyOverview = Array.from(yearlyMap.values()).map(entry => {
            const topCategory = Array.from(entry.categoryCounts.entries()).sort((a, b) => b[1] - a[1])[0];
            const topSector = Array.from(entry.sectorCounts.entries()).sort((a, b) => b[1] - a[1])[0];
    
            return {
                year: entry.year,
                fine_count: entry.fine_count,
                total_amount: entry.total_amount,
                dominant_category: topCategory ? { category: topCategory[0], count: topCategory[1] } : null,
                dominant_sector: topSector ? { sector: topSector[0], count: topSector[1] } : null
            };
        }).sort((a, b) => a.year - b.year);
    
        const categoryTrendSeries = Array.from(categoryYearMap.values()).sort((a, b) => {
            if (a.year === b.year) return a.category.localeCompare(b.category);
            return a.year - b.year;
        });
    
        const distinctFirms = firmCounts.size;
        const repeatOffenders = Array.from(firmCounts.values()).filter(count => count > 1).length;
        const averageRiskScore = fines.length ? riskSum / fines.length : 0;
    
        return {
            topBreachTypes,
            topSectors,
            yearlyOverview,
            categoryTrendSeries,
            overview: {
                distinct_firms: distinctFirms,
                repeat_offenders: repeatOffenders,
                total_amount: totalAmount,
                amount_this_year: amountThisYear,
                average_risk_score: averageRiskScore
            }
        };
    },

    buildFallbackStats() {
        return {
            overview: {
                total_fines: 0,
                fines_this_year: 0,
                total_amount: 0,
                amount_this_year: 0,
                fines_last_30_days: 0,
                amount_last_30_days: 0,
                distinct_firms: 0,
                repeat_offenders: 0
            },
            yearlyOverview: [],
            controlRecommendations: [],
            topCategoryTrends: [],
            topBreachTypes: [],
            topSectors: [],
            availableYears: [],
            availableCategories: []
        };
    },

    updateHeaderMeta(coverageLabel = 'Full dataset') {
        const statusEl = document.getElementById('status-value');
        const statusDot = document.querySelector('.status-dot');
        const isFullDataset = coverageLabel === 'Full dataset';
        const isUnavailable = coverageLabel === 'Unavailable';
    
        if (statusEl) {
            statusEl.textContent = isUnavailable ? 'Unavailable' : isFullDataset ? 'Active' : 'Filtered';
        }
    
        if (statusDot) {
            if (isUnavailable) {
                statusDot.style.background = '#f87171';
                statusDot.style.boxShadow = '0 0 0 4px rgba(248, 113, 113, 0.25)';
            } else if (isFullDataset) {
                statusDot.style.background = '#22c55e';
                statusDot.style.boxShadow = '0 0 0 4px rgba(34, 197, 94, 0.18)';
            } else {
                statusDot.style.background = '#facc15';
                statusDot.style.boxShadow = '0 0 0 4px rgba(250, 204, 21, 0.25)';
            }
        }
    
        const updateEl = document.getElementById('last-update');
        if (updateEl) {
            updateEl.textContent = new Date().toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
    
        const coverageEl = document.getElementById('data-coverage');
        if (coverageEl) coverageEl.textContent = coverageLabel;
    }
  })
}
export { applyStatsMixin }
