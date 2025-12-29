/**
 * Get sector-level analysis for bubble chart visualization
 * @returns {Array<Object>} Sector data with fine count, totals, avg, and dominant breach category
 */
async function getSectorAnalysis() {
  try {
    // Query to get sector statistics with dominant breach category
    const query = `
        WITH sector_data AS (
          SELECT
            s.sector,
            COUNT(*) as fine_count,
            SUM(f.amount) FILTER (WHERE f.amount IS NOT NULL) as total_amount,
            AVG(f.amount) FILTER (WHERE f.amount IS NOT NULL) as avg_amount,
            MAX(f.amount) FILTER (WHERE f.amount IS NOT NULL) as max_amount
          FROM fca_fines f
          CROSS JOIN LATERAL (
            SELECT jsonb_array_elements_text(
              CASE
                WHEN f.affected_sectors IS NULL THEN '["Not captured"]'::jsonb
                WHEN f.affected_sectors::text = '[]' THEN '["Not captured"]'::jsonb
                WHEN f.affected_sectors::text = '' THEN '["Not captured"]'::jsonb
                ELSE f.affected_sectors
              END
            ) as sector
          ) s
          WHERE f.amount IS NOT NULL
          GROUP BY s.sector
          HAVING COUNT(*) >= 2
        ),
        breach_data AS (
          SELECT
            s.sector,
            b.breach as breach_category,
            COUNT(*) as breach_count,
            ROW_NUMBER() OVER (PARTITION BY s.sector ORDER BY COUNT(*) DESC) as rn
          FROM fca_fines f
          CROSS JOIN LATERAL (
            SELECT jsonb_array_elements_text(
              CASE
                WHEN f.affected_sectors IS NULL THEN '["Not captured"]'::jsonb
                WHEN f.affected_sectors::text = '[]' THEN '["Not captured"]'::jsonb
                WHEN f.affected_sectors::text = '' THEN '["Not captured"]'::jsonb
                ELSE f.affected_sectors
              END
            ) as sector
          ) s
          CROSS JOIN LATERAL (
            SELECT jsonb_array_elements_text(
              CASE
                WHEN f.breach_categories IS NULL THEN '["Other"]'::jsonb
                WHEN f.breach_categories::text = '[]' THEN '["Other"]'::jsonb
                WHEN f.breach_categories::text = '' THEN '["Other"]'::jsonb
                ELSE f.breach_categories
              END
            ) as breach
          ) b
          WHERE f.amount IS NOT NULL
          GROUP BY s.sector, b.breach
        )
        SELECT
          sd.sector,
          sd.fine_count,
          sd.total_amount,
          sd.avg_amount,
          sd.max_amount,
          COALESCE(bd.breach_category, 'Other') as dominant_breach
        FROM sector_data sd
        LEFT JOIN breach_data bd ON sd.sector = bd.sector AND bd.rn = 1
        ORDER BY sd.total_amount DESC
      `

    const result = await this.db.query(query)

    // Assign colors based on dominant breach category
    const breachColors = {
      'Anti-Money Laundering': '#dc2626',
      'Systems and Controls': '#ea580c',
      'Customer Treatment': '#d97706',
      'Market Abuse': '#ca8a04',
      'Financial Crime': '#65a30d',
      'Disclosure': '#0d9488',
      'Conflicts of Interest': '#0891b2',
      'Conduct': '#6366f1',
      'Prudential': '#8b5cf6',
      'Other': '#64748b'
    }

    return result.rows.map(sector => ({
      sector: sector.sector,
      fine_count: parseInt(sector.fine_count) || 0,
      total_amount: parseFloat(sector.total_amount) || 0,
      avg_amount: parseFloat(sector.avg_amount) || 0,
      max_amount: parseFloat(sector.max_amount) || 0,
      dominant_breach: sector.dominant_breach,
      color: breachColors[sector.dominant_breach] || breachColors['Other']
    }))
  } catch (error) {
    console.error('Error getting sector analysis:', error)
    throw error
  }
}

/**
 * Get sector enforcement trends over time
 * Returns yearly totals for each sector for line chart visualization
 * @returns {Object} {years: [], sectors: [{name, data: []}], matrix: {}}
 */
async function getSectorTrends() {
  try {
    const query = `
        WITH sector_year_data AS (
          SELECT
            s.sector,
            EXTRACT(YEAR FROM f.date_issued)::integer as year,
            COUNT(*) as fine_count,
            SUM(f.amount) FILTER (WHERE f.amount IS NOT NULL) as total_amount
          FROM fca_fines f
          CROSS JOIN LATERAL (
            SELECT jsonb_array_elements_text(
              CASE
                WHEN f.affected_sectors IS NULL THEN '["Not captured"]'::jsonb
                WHEN f.affected_sectors::text = '[]' THEN '["Not captured"]'::jsonb
                WHEN f.affected_sectors::text = '' THEN '["Not captured"]'::jsonb
                ELSE f.affected_sectors
              END
            ) as sector
          ) s
          WHERE f.date_issued IS NOT NULL
            AND f.amount IS NOT NULL
          GROUP BY s.sector, EXTRACT(YEAR FROM f.date_issued)
        ),
        all_years AS (
          SELECT DISTINCT year FROM sector_year_data ORDER BY year
        ),
        sector_totals AS (
          SELECT sector, SUM(total_amount) as grand_total
          FROM sector_year_data
          GROUP BY sector
          ORDER BY grand_total DESC
          LIMIT 10
        )
        SELECT
          syd.sector,
          syd.year,
          syd.fine_count,
          syd.total_amount
        FROM sector_year_data syd
        INNER JOIN sector_totals st ON syd.sector = st.sector
        ORDER BY st.grand_total DESC, syd.year ASC
      `

    const result = await this.db.query(query)

    // Get unique years and sectors
    const yearsSet = new Set()
    const sectorsMap = new Map()

    result.rows.forEach(row => {
      yearsSet.add(row.year)
      if (!sectorsMap.has(row.sector)) {
        sectorsMap.set(row.sector, new Map())
      }
      sectorsMap.get(row.sector).set(row.year, {
        fine_count: parseInt(row.fine_count) || 0,
        total_amount: parseFloat(row.total_amount) || 0
      })
    })

    const years = Array.from(yearsSet).sort((a, b) => a - b)

    // Define sector colors
    const sectorColors = {
      'Banking': '#3b82f6',
      'Individual': '#8b5cf6',
      'Insurance': '#10b981',
      'Brokerage & Trading': '#f59e0b',
      'Investment Banking': '#ef4444',
      'Asset Management': '#06b6d4',
      'Wealth Management': '#ec4899',
      'Consumer Finance': '#f97316',
      'Payments & E-Money': '#14b8a6',
      'Investment Services': '#6366f1',
      'Pensions': '#84cc16',
      'Commodities': '#78716c',
      'Not captured': '#9ca3af'
    }

    // Build sector data for charts
    const sectors = []
    sectorsMap.forEach((yearData, sectorName) => {
      const data = years.map(year => ({
        year,
        fine_count: yearData.get(year)?.fine_count || 0,
        total_amount: yearData.get(year)?.total_amount || 0
      }))

      const totalAmount = data.reduce((sum, d) => sum + d.total_amount, 0)
      const totalCount = data.reduce((sum, d) => sum + d.fine_count, 0)

      sectors.push({
        name: sectorName,
        color: sectorColors[sectorName] || '#64748b',
        data,
        totalAmount,
        totalCount
      })
    })

    // Sort by total amount
    sectors.sort((a, b) => b.totalAmount - a.totalAmount)

    return {
      years,
      sectors,
      summary: {
        totalSectors: sectors.length,
        yearRange: `${years[0]} - ${years[years.length - 1]}`,
        topSector: sectors[0]?.name || 'N/A'
      }
    }
  } catch (error) {
    console.error('Error getting sector trends:', error)
    throw error
  }
}

module.exports = {
  getSectorAnalysis,
  getSectorTrends
}
