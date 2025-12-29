export function renderPatternCards(patterns) {
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
}

export function derivePatternsFromFines(fines) {
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
}

export function buildFallbackStats() {
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
}
