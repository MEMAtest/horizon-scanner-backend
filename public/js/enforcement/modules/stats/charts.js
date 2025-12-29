export function renderYearlyOverview(yearlyData = [], options = {}) {
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

    const self = this;

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
            onClick: function(event, elements) {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const year = labels[index];
                    self.handleYearClick(year, event.native);
                }
            },
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
}

export function renderCategoryTrends(trendData = [], options = {}) {
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
    const self = this;

    this.charts.category = new Chart(chartCanvas, {
        type: 'line',
        data: {
            labels: years,
            datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            onClick: function(event, elements) {
                if (elements.length > 0) {
                    const datasetIndex = elements[0].datasetIndex;
                    const category = datasets[datasetIndex].label;
                    self.handleCategoryClick(category);
                }
            },
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
}

export function renderControlPlaybook(recommendations = [], options = {}) {
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
}
