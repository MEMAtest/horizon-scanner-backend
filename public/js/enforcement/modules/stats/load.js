export async function loadStats() {
    await this.loadStatsWithFilters();
}

export async function loadStatsWithFilters(filterParams = {}) {
    try {
        this.currentFilterParams = filterParams || {};
        const hasFilters = this.hasActiveFilters(filterParams);

        if (!hasFilters) {
            // No filters - load full dataset
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

        // CRITICAL FIX: Load filtered stats from API
        console.log('[stats] Loading stats with filters:', filterParams);

        // Build query params for stats endpoint
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

        // Fetch filtered stats
        const statsUrl = '/api/enforcement/stats' + (params.toString() ? '?' + params.toString() : '');
        const statsResponse = await fetch(statsUrl);
        const statsData = await statsResponse.json();

        if (!statsData.success) {
            throw new Error(statsData.error || 'Failed to load filtered stats');
        }

        console.log('[stats] Filtered stats loaded:', statsData);

        // Store filtered stats
        this.baseStats = statsData.stats;
        this.baseYearlyOverview = statsData.stats.yearlyOverview || [];
        this.baseControlRecommendations = statsData.stats.controlRecommendations || [];
        this.baseCategoryTrends = statsData.stats.topCategoryTrends || [];
        this.isFilterActive = true;

        // Fetch filtered fines (CRITICAL FIX: Use new method)
        if (typeof this.loadRecentFinesWithFilters === 'function') {
            await this.loadRecentFinesWithFilters(filterParams);
        } else {
            // Fallback to old method if new method not yet available
            const { fines: filteredFines, total: totalMatches } = await this.fetchFilteredFines(filterParams);
            this.latestFilteredFines = filteredFines;
            this.latestFilteredTotal = totalMatches;
        }

        // Render filtered stats
        this.renderFilteredStats(filterParams);

        // Render fines
        if (this.latestFilteredFines && this.latestFilteredFines.length > 0) {
            this.renderFines(this.latestFilteredFines);
        }

        // Render top firms from filtered data
        const topFirmSnapshot = this.buildTopFirmsFromFines(this.latestFilteredFines);
        this.renderTopFirms(topFirmSnapshot, {
            filterMode: true,
            scopeLabel: this.filteredSummary ? this.filteredSummary.scopeLabel : null
        });

        // Load filtered trends
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
}
