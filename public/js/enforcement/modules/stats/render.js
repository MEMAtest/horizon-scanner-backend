export function renderStats(stats) {
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
}

export function renderFinesTimeline(overview) {
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
}

export function renderFilteredStats(fines = [], filterContext = {}) {
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
}

export function renderStatsError(error) {
    const container = document.getElementById('stats-container');
    container.innerHTML = [
        '<div class="error-state">',
            '<strong>Failed to load statistics</strong><br>',
            error,
        '</div>'
    ].join('');

    this.updateHeaderMeta('Unavailable');
}
