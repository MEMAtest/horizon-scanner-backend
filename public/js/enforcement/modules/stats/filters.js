export function populateFilters(stats) {
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
}

/**
 * Handle click on year in Yearly Overview chart
 * Shift+click opens year summary modal, regular click filters
 */
export function handleYearClick(year, event) {
    console.log('[yearly-chart] Clicked year:', year);

    // Shift+Click = Open year summary modal
    if (event && (event.shiftKey || event.ctrlKey || event.metaKey)) {
        console.log('[yearly-chart] Opening year summary modal for:', year);
        this.showYearSummary(parseInt(year, 10));
        return;
    }

    // Default: Filter by year
    this.setChartFilter({
        type: 'year',
        year: parseInt(year, 10),
        label: `Year ${year}`
    });
    this.loadStatsWithFilters(this.getCurrentFilterParams());
}

/**
 * Handle click on category in Category Trends chart
 */
export function handleCategoryClick(category) {
    console.log('[category-chart] Clicked category:', category);
    this.setChartFilter({
        type: 'category',
        category: category,
        label: `Category: ${category}`
    });
    this.loadStatsWithFilters(this.getCurrentFilterParams());
}

export function updateHeaderMeta(coverageLabel = 'Full dataset') {
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
