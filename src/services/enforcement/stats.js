async function getEnforcementStats(filterParams = {}) {
  try {
    console.log('[getEnforcementStats] Filter params:', filterParams)

    // Build WHERE clause
    const whereConditions = this.buildFilterWhereClause(filterParams)
    const whereClause = whereConditions ? `WHERE ${whereConditions}` : ''

    console.log('[getEnforcementStats] WHERE clause:', whereClause)

    const stats = await this.db.query(`
                SELECT
                    COUNT(*) as total_fines,
                    SUM(CASE WHEN EXTRACT(YEAR FROM date_issued) = EXTRACT(YEAR FROM CURRENT_DATE) THEN 1 ELSE 0 END) as fines_this_year,
                    SUM(CASE WHEN date_issued >= CURRENT_DATE - INTERVAL '30 days' THEN 1 ELSE 0 END) as fines_last_30_days,
                    SUM(CASE WHEN date_issued >= CURRENT_DATE - INTERVAL '60 days' THEN 1 ELSE 0 END) as fines_last_60_days,
                    SUM(CASE WHEN date_issued >= CURRENT_DATE - INTERVAL '90 days' THEN 1 ELSE 0 END) as fines_last_90_days,
                    SUM(amount) FILTER (WHERE amount IS NOT NULL) as total_amount,
                    AVG(amount) FILTER (WHERE amount IS NOT NULL) as average_amount,
                    MAX(amount) FILTER (WHERE amount IS NOT NULL) as largest_fine,
                    SUM(amount) FILTER (WHERE EXTRACT(YEAR FROM date_issued) = EXTRACT(YEAR FROM CURRENT_DATE)) as amount_this_year,
                    SUM(amount) FILTER (WHERE date_issued >= CURRENT_DATE - INTERVAL '30 days') as amount_last_30_days,
                    SUM(amount) FILTER (WHERE date_issued >= CURRENT_DATE - INTERVAL '60 days') as amount_last_60_days,
                    SUM(amount) FILTER (WHERE date_issued >= CURRENT_DATE - INTERVAL '90 days') as amount_last_90_days,
                    COUNT(DISTINCT COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown')) as distinct_firms,
                    COUNT(DISTINCT CASE WHEN EXTRACT(YEAR FROM date_issued) = EXTRACT(YEAR FROM CURRENT_DATE)
                        THEN COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown') END) as distinct_firms_this_year,
                    AVG(risk_score) FILTER (WHERE risk_score IS NOT NULL) as average_risk_score,
                    COUNT(CASE WHEN systemic_risk = true THEN 1 END) as systemic_risk_cases,
                    COUNT(CASE WHEN precedent_setting = true THEN 1 END) as precedent_cases,
                    MAX(date_issued) as latest_fine_date,
                    (
                        SELECT COUNT(*)
                        FROM (
                            SELECT COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown') AS entity
                            FROM fca_fines
                            ${whereClause}
                            GROUP BY entity
                            HAVING COUNT(*) > 1
                        ) repeat_entities
                    ) as repeat_offenders
                FROM fca_fines
                ${whereClause}
            `)

    const breachStats = await this.db.query(`
                WITH category_source AS (
                    SELECT
                        COALESCE(
                            NULLIF(TRIM(bc.category), ''),
                            NULLIF(TRIM(f.breach_type), ''),
                            'Uncategorised'
                        ) AS category,
                        f.amount
                    FROM fca_fines f
                    LEFT JOIN LATERAL (
                        SELECT value::text as category
                        FROM jsonb_array_elements_text(
                            CASE
                                WHEN jsonb_typeof(f.breach_categories) = 'array' THEN f.breach_categories
                                WHEN jsonb_typeof(f.breach_categories) = 'string' THEN
                                    CASE
                                        WHEN f.breach_categories::text ~ '^"\\[.*\\]"$' THEN
                                            (f.breach_categories #>> '{}')::jsonb
                                        ELSE to_jsonb(ARRAY[f.breach_categories::text])
                                    END
                                ELSE '[]'::jsonb
                            END
                        ) as value
                    ) AS bc(category) ON true
                    ${whereClause}
                )
                SELECT
                    category,
                    COUNT(*) AS count,
                    SUM(amount) FILTER (WHERE amount IS NOT NULL) AS total_amount
                FROM category_source
                GROUP BY category
                ORDER BY count DESC
                LIMIT 10
            `)

    const sectorStats = await this.db.query(`
                WITH sector_source AS (
                    SELECT
                        COALESCE(
                            NULLIF(TRIM(s.sector), ''),
                            'Empty'
                        ) AS sector,
                        NULLIF(TRIM(f.firm_category), '') AS firm_category,
                        f.amount
                    FROM fca_fines f
                    LEFT JOIN LATERAL (
                        SELECT value::text as sector
                        FROM jsonb_array_elements_text(
                            CASE
                                WHEN jsonb_typeof(f.affected_sectors) = 'array' THEN f.affected_sectors
                                WHEN jsonb_typeof(f.affected_sectors) = 'string' THEN
                                    CASE
                                        WHEN f.affected_sectors::text ~ '^"\\[.*\\]"$' THEN
                                            (f.affected_sectors #>> '{}')::jsonb
                                        ELSE to_jsonb(ARRAY[f.affected_sectors::text])
                                    END
                                ELSE '[]'::jsonb
                            END
                        ) as value
                    ) AS s(sector) ON true
                    ${whereClause}
                )
                SELECT
                    sector,
                    MAX(firm_category) AS sample_firm_category,
                    COUNT(*) AS count,
                    SUM(amount) FILTER (WHERE amount IS NOT NULL) AS total_amount
                FROM sector_source
                GROUP BY sector
                ORDER BY count DESC
                LIMIT 10
            `)

    const yearsResult = await this.db.query(`
                SELECT DISTINCT EXTRACT(YEAR FROM date_issued)::INT as year
                FROM fca_fines
                ${whereClause}
                ORDER BY year DESC
                LIMIT 20
            `)

    const categoriesResult = await this.db.query(`
                SELECT DISTINCT TRIM(value::text) as category
                FROM fca_fines f
                CROSS JOIN LATERAL (
                    SELECT value
                    FROM jsonb_array_elements_text(
                        CASE
                            WHEN jsonb_typeof(f.breach_categories) = 'array' THEN f.breach_categories
                            WHEN jsonb_typeof(f.breach_categories) = 'string' THEN
                                CASE
                                    WHEN f.breach_categories::text ~ '^"\\[.*\\]"$' THEN
                                        (f.breach_categories #>> '{}')::jsonb
                                    ELSE to_jsonb(ARRAY[f.breach_categories::text])
                                END
                            ELSE '[]'::jsonb
                        END
                    ) as value
                ) as val
                WHERE val.value IS NOT NULL AND TRIM(val.value::text) <> ''
                ${whereConditions ? `AND (${whereConditions})` : ''}
                ORDER BY category ASC
            `)

    const yearlyStatsResult = await this.db.query(`
                WITH yearly_base AS (
                    SELECT
                        year_issued AS year,
                        COUNT(*) AS fine_count,
                        SUM(amount) FILTER (WHERE amount IS NOT NULL) AS total_amount,
                        AVG(amount) FILTER (WHERE amount IS NOT NULL) AS average_amount,
                        AVG(risk_score) FILTER (WHERE risk_score IS NOT NULL) AS average_risk_score,
                        COUNT(*) FILTER (WHERE systemic_risk = true) AS systemic_risk_cases,
                        COUNT(*) FILTER (WHERE precedent_setting = true) AS precedent_cases
                    FROM fca_fines
                    ${whereClause}
                    GROUP BY year_issued
                ),
                category_rank AS (
                    SELECT
                        data.year_issued AS year,
                        data.category,
                        COUNT(*) AS count,
                        SUM(data.amount) FILTER (WHERE data.amount IS NOT NULL) AS total_amount,
                        ROW_NUMBER() OVER (
                            PARTITION BY data.year_issued
                            ORDER BY COUNT(*) DESC, SUM(data.amount) DESC
                        ) AS category_rank
                    FROM (
                        SELECT
                            f.year_issued,
                            COALESCE(
                                NULLIF(TRIM(bc.category), ''),
                                NULLIF(TRIM(f.breach_type), ''),
                                'Uncategorised'
                            ) AS category,
                            f.amount
                        FROM fca_fines f
                        LEFT JOIN LATERAL (
                            SELECT value::text as category
                            FROM jsonb_array_elements_text(
                                CASE
                                    WHEN jsonb_typeof(f.breach_categories) = 'array' THEN f.breach_categories
                                    WHEN jsonb_typeof(f.breach_categories) = 'string' THEN
                                        CASE
                                            WHEN f.breach_categories::text ~ '^"\\[.*\\]"$' THEN
                                                (f.breach_categories #>> '{}')::jsonb
                                            ELSE to_jsonb(ARRAY[f.breach_categories::text])
                                        END
                                    ELSE '[]'::jsonb
                                END
                            ) as value
                        ) AS bc(category) ON true
                        ${whereClause}
                    ) data
                    GROUP BY data.year_issued, data.category
                ),
                sector_rank AS (
                    SELECT
                        data.year_issued AS year,
                        data.sector,
                        COUNT(*) AS count,
                        SUM(data.amount) FILTER (WHERE data.amount IS NOT NULL) AS total_amount,
                        ROW_NUMBER() OVER (
                            PARTITION BY data.year_issued
                            ORDER BY COUNT(*) DESC, SUM(data.amount) DESC
                        ) AS sector_rank
                    FROM (
                        SELECT
                            f.year_issued,
                            COALESCE(
                                NULLIF(TRIM(s.sector), ''),
                                NULLIF(TRIM(f.firm_category), ''),
                                'Unspecified'
                            ) AS sector,
                            f.amount
                        FROM fca_fines f
                        LEFT JOIN LATERAL (
                            SELECT value::text as sector
                            FROM jsonb_array_elements_text(
                                CASE
                                    WHEN jsonb_typeof(f.affected_sectors) = 'array' THEN f.affected_sectors
                                    WHEN jsonb_typeof(f.affected_sectors) = 'string' THEN
                                        CASE
                                            WHEN f.affected_sectors::text ~ '^"\\[.*\\]"$' THEN
                                                (f.affected_sectors #>> '{}')::jsonb
                                            ELSE to_jsonb(ARRAY[f.affected_sectors::text])
                                        END
                                    ELSE '[]'::jsonb
                                END
                            ) as value
                        ) AS s(sector) ON true
                        ${whereClause}
                    ) data
                    GROUP BY data.year_issued, data.sector
                )
                SELECT
                    y.year,
                    y.fine_count,
                    y.total_amount,
                    y.average_amount,
                    y.average_risk_score,
                    y.systemic_risk_cases,
                    y.precedent_cases,
                    to_jsonb(c) AS dominant_category,
                    to_jsonb(s) AS dominant_sector
                FROM yearly_base y
                LEFT JOIN category_rank c ON c.year = y.year AND c.category_rank = 1
                LEFT JOIN sector_rank s ON s.year = y.year AND s.sector_rank = 1
                ORDER BY y.year DESC
            `)

    const categoryTrendResult = await this.db.query(`
                WITH category_assignments AS (
                    SELECT
                        f.year_issued,
                        COALESCE(
                            NULLIF(TRIM(bc.category), ''),
                            NULLIF(TRIM(f.breach_type), ''),
                            'Uncategorised'
                        ) AS category,
                        f.amount
                    FROM fca_fines f
                    LEFT JOIN LATERAL (
                        SELECT value::text as category
                        FROM jsonb_array_elements_text(
                            CASE
                                WHEN jsonb_typeof(f.breach_categories) = 'array' THEN f.breach_categories
                                WHEN jsonb_typeof(f.breach_categories) = 'string' THEN
                                    CASE
                                        WHEN f.breach_categories::text ~ '^"\\[.*\\]"$' THEN
                                            (f.breach_categories #>> '{}')::jsonb
                                        ELSE to_jsonb(ARRAY[f.breach_categories::text])
                                    END
                                ELSE '[]'::jsonb
                            END
                        ) as value
                    ) AS bc(category) ON true
                    ${whereClause}
                ),
                top_categories AS (
                    SELECT category
                    FROM category_assignments
                    GROUP BY category
                    ORDER BY COUNT(*) DESC
                    LIMIT 6
                )
                SELECT
                    year_issued AS year,
                    category,
                    COUNT(*) AS fine_count,
                    SUM(amount) FILTER (WHERE amount IS NOT NULL) AS total_amount
                FROM category_assignments
                WHERE category IN (SELECT category FROM top_categories)
                GROUP BY year_issued, category
                ORDER BY year DESC, category ASC
            `)

    const overview = stats.rows[0] || {}
    const normalisedOverview = {
      ...overview,
      average_amount: overview.average_amount || overview.avg_amount || 0,
      largest_fine: overview.largest_fine || overview.max_amount || 0,
      amount_this_year: overview.amount_this_year || 0,
      amount_last_30_days: overview.amount_last_30_days || 0,
      distinct_firms: overview.distinct_firms || 0,
      distinct_firms_this_year: overview.distinct_firms_this_year || 0,
      repeat_offenders: overview.repeat_offenders || 0
    }

    // PHASE 2 FIX: Apply sector inference to yearly overview
    const enhancedYearlyOverview = yearlyStatsResult.rows.map(row => {
      if (!row.dominant_sector) {
        return row
      }

      // Parse the JSONB dominant_sector object
      let dominantSector = row.dominant_sector
      if (typeof dominantSector === 'string') {
        try {
          dominantSector = JSON.parse(dominantSector)
        } catch (e) {
          console.warn('Failed to parse dominant_sector:', e)
          return row
        }
      }

      // Check if sector is 'Unspecified' or empty and try to infer
      if (dominantSector && (dominantSector.sector === 'Unspecified' || !dominantSector.sector || dominantSector.sector.trim() === '')) {
        // Try to infer sector from firm_category (we'd need to query this separately, but for now we'll mark it)
        dominantSector.sector = 'Not captured'
      }

      return {
        ...row,
        dominant_sector: dominantSector
      }
    })

    // PHASE 2 FIX: Apply sector inference to topSectors
    const enhancedTopSectors = sectorStats.rows.map(row => {
      let sector = row.sector

      // If sector is 'Empty' or missing, try to infer from firm_category
      if (!sector || sector === 'Empty' || sector === 'Unspecified' || sector.trim() === '') {
        // Try to infer sector from firm_category
        const inferredSector = this.inferSectorFromFirmCategory(row.sample_firm_category)
        sector = inferredSector || 'Not captured'
      }

      return {
        ...row,
        sector: sector
      }
    })

    return {
      overview: normalisedOverview,
      topBreachTypes: breachStats.rows,
      topSectors: enhancedTopSectors,
      availableYears: yearsResult.rows.map(row => row.year),
      availableCategories: categoriesResult.rows.map(row => row.category),
      yearlyOverview: enhancedYearlyOverview,
      topCategoryTrends: categoryTrendResult.rows,
      controlRecommendations: this.buildControlRecommendations(breachStats.rows, categoryTrendResult.rows, yearlyStatsResult.rows)
    }
  } catch (error) {
    console.error('Error getting enforcement stats:', error)
    throw error
  }
}

function buildControlRecommendations(topCategories = [], categoryTrends = [], yearlyOverview = []) {
  if (!Array.isArray(topCategories) || topCategories.length === 0) return []

  const categoryTrendMap = categoryTrends.reduce((acc, entry) => {
    if (!entry || !entry.category) return acc
    const category = entry.category
    const year = entry.year
    const count = Number(entry.fine_count || 0)
    const totalAmount = Number(entry.total_amount || 0)

    if (!acc[category]) acc[category] = []
    acc[category].push({ year, count, totalAmount })
    return acc
  }, {})

  Object.values(categoryTrendMap).forEach(entries => {
    entries.sort((a, b) => b.year - a.year)
  })

  const yearlyLookup = yearlyOverview.reduce((map, item) => {
    if (!item || typeof item.year !== 'number') return map
    map[item.year] = item
    return map
  }, {})

  const recommendations = []
  let categoriesToHighlight = topCategories
    .filter(cat => cat && cat.category && cat.category !== 'Uncategorised')
    .slice(0, 4)

  if (categoriesToHighlight.length === 0 && topCategories.length > 0) {
    categoriesToHighlight = topCategories.slice(0, 2)
  }

  categoriesToHighlight.forEach(categoryEntry => {
    const categoryName = categoryEntry.category
    const playbook = this.controlPlaybook[categoryName] || {
      headline: `${categoryName} remains on the FCA radar — ensure governance, control ownership, and evidence of remediation are watertight.`,
      controls: [
        'Identify the accountable SMF owner and document governance for this risk theme.',
        'Refresh the control inventory and confirm effectiveness testing cadence.',
        'Evidence remediation progress with clear milestones and sign-off.'
      ],
      monitoring: [
        'Provide quarterly MI covering incidents, audit findings, and remediation status.',
        'Record board or risk committee challenge and follow-up actions.'
      ],
      riskIfIgnored: 'FCA enforcement typically highlights weak oversight, missing MI, and slow remediation. Strengthen the control environment before supervisors ask.'
    }

    const trendHistory = categoryTrendMap[categoryName] || []
    const multiYearSnapshot = trendHistory.slice(0, 5)
    const cumulativeCount = multiYearSnapshot.reduce((sum, item) => sum + Number(item.count || 0), 0)
    const cumulativeAmount = multiYearSnapshot.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0)

    const recentYearsText = multiYearSnapshot
      .map(item => `${item.year}: ${item.count} fines`)
      .join(' · ')

    const latestYear = multiYearSnapshot.length ? multiYearSnapshot[0].year : null
    const latestYearOverview = latestYear ? yearlyLookup[latestYear] : null

    recommendations.push({
      category: categoryName,
      headline: playbook.headline,
      recentActivity: {
        totalFines: cumulativeCount,
        totalAmount: cumulativeAmount,
        narrative: recentYearsText || `No detailed year-by-year data captured for ${categoryName}.`
      },
      dominantYears: multiYearSnapshot.map(item => item.year),
      riskSignal: latestYearOverview ? Number(latestYearOverview.average_risk_score || 0) : null,
      recommendedControls: playbook.controls,
      monitoringChecks: playbook.monitoring,
      riskIfIgnored: playbook.riskIfIgnored
    })
  })

  return recommendations
}

module.exports = {
  getEnforcementStats,
  buildControlRecommendations
}
