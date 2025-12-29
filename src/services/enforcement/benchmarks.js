/**
 * Get sector benchmarking data (avg, median, percentiles)
 * @param {string|null} sector - Specific sector or null for all sectors
 * @returns {Object} Benchmarking statistics
 */
async function getSectorBenchmarks(sector = null) {
  try {
    let whereClause = 'WHERE amount IS NOT NULL'
    const params = []

    if (sector) {
      whereClause += ` AND (
          affected_sectors::text ILIKE $1
          OR affected_sectors::text ILIKE $2
        )`
      params.push(`%"${sector}"%`, `%${sector}%`)
    }

    // Get overall statistics and percentiles for the sector
    const statsQuery = `
        WITH firm_totals AS (
          SELECT
            COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown') as firm_name,
            SUM(amount) as total_amount,
            COUNT(*) as fine_count,
            AVG(amount) as avg_fine
          FROM fca_fines
          ${whereClause}
          GROUP BY COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown')
        ),
        ranked AS (
          SELECT
            firm_name,
            total_amount,
            fine_count,
            avg_fine,
            PERCENT_RANK() OVER (ORDER BY total_amount) as percentile_rank
          FROM firm_totals
        )
        SELECT
          COUNT(*) as firm_count,
          AVG(total_amount) as avg_total,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_amount) as median_total,
          PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY total_amount) as p25_total,
          PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY total_amount) as p75_total,
          PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY total_amount) as p90_total,
          MIN(total_amount) as min_total,
          MAX(total_amount) as max_total,
          AVG(fine_count) as avg_fine_count,
          AVG(avg_fine) as avg_fine_size
        FROM ranked
      `

    const statsResult = await this.db.query(statsQuery, params)

    // Get top firms in this sector
    const topFirmsQuery = `
        SELECT
          COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown') as firm_name,
          SUM(amount) as total_amount,
          COUNT(*) as fine_count
        FROM fca_fines
        ${whereClause}
        GROUP BY COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown')
        ORDER BY total_amount DESC
        LIMIT 5
      `

    const topFirmsResult = await this.db.query(topFirmsQuery, params)

    return {
      sector: sector || 'All Sectors',
      statistics: statsResult.rows[0] || {},
      top_firms: topFirmsResult.rows
    }
  } catch (error) {
    console.error('Error getting sector benchmarks:', error)
    throw error
  }
}

/**
 * Get a firm's percentile ranking within a sector or overall
 * @param {string} firmName - Firm name to analyze
 * @param {string|null} sector - Specific sector or null for overall
 * @returns {Object} Percentile data for the firm
 */
async function getFirmPercentile(firmName, sector = null) {
  try {
    let whereClause = 'WHERE amount IS NOT NULL'
    const params = [firmName]

    if (sector) {
      whereClause += ` AND (
          affected_sectors::text ILIKE $2
          OR affected_sectors::text ILIKE $3
        )`
      params.push(`%"${sector}"%`, `%${sector}%`)
    }

    // Get the firm's total and its percentile rank
    const query = `
        WITH firm_totals AS (
          SELECT
            COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown') as firm_name,
            SUM(amount) as total_amount,
            COUNT(*) as fine_count,
            AVG(amount) as avg_fine
          FROM fca_fines
          ${whereClause}
          GROUP BY COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown')
        ),
        ranked AS (
          SELECT
            firm_name,
            total_amount,
            fine_count,
            avg_fine,
            PERCENT_RANK() OVER (ORDER BY total_amount) * 100 as percentile,
            RANK() OVER (ORDER BY total_amount DESC) as rank_desc,
            COUNT(*) OVER () as total_firms
          FROM firm_totals
        )
        SELECT *
        FROM ranked
        WHERE firm_name = $1
      `

    const firmResult = await this.db.query(query, params)

    if (firmResult.rows.length === 0) {
      return {
        found: false,
        message: 'Firm not found in this sector'
      }
    }

    const firmData = firmResult.rows[0]

    // Get sector benchmarks for comparison
    const benchmarks = await this.getSectorBenchmarks(sector)

    // Determine tier based on percentile
    let tier = 'Average'
    const percentile = parseFloat(firmData.percentile) || 0
    if (percentile >= 99) tier = 'Top 1%'
    else if (percentile >= 95) tier = 'Top 5%'
    else if (percentile >= 90) tier = 'Top 10%'
    else if (percentile >= 75) tier = 'Top 25%'
    else if (percentile >= 50) tier = 'Above Average'
    else if (percentile >= 25) tier = 'Below Average'
    else tier = 'Bottom 25%'

    return {
      found: true,
      firm_name: firmData.firm_name,
      total_amount: parseFloat(firmData.total_amount) || 0,
      fine_count: parseInt(firmData.fine_count) || 0,
      avg_fine: parseFloat(firmData.avg_fine) || 0,
      percentile: percentile,
      rank: parseInt(firmData.rank_desc) || 0,
      total_firms: parseInt(firmData.total_firms) || 0,
      tier: tier,
      sector_benchmarks: {
        avg: parseFloat(benchmarks.statistics.avg_total) || 0,
        median: parseFloat(benchmarks.statistics.median_total) || 0,
        p75: parseFloat(benchmarks.statistics.p75_total) || 0,
        p90: parseFloat(benchmarks.statistics.p90_total) || 0
      },
      vs_average: firmData.total_amount && benchmarks.statistics.avg_total
        ? ((firmData.total_amount - benchmarks.statistics.avg_total) / benchmarks.statistics.avg_total * 100).toFixed(1)
        : 0,
      vs_median: firmData.total_amount && benchmarks.statistics.median_total
        ? ((firmData.total_amount - benchmarks.statistics.median_total) / benchmarks.statistics.median_total * 100).toFixed(1)
        : 0
    }
  } catch (error) {
    console.error('Error getting firm percentile:', error)
    throw error
  }
}

/**
 * Get all firms with percentile rankings and tier classifications
 * @param {number} limit - Maximum number of firms to return
 * @returns {Array<Object>} Ranked firms with percentile data
 */
async function getPercentileRankings(limit = 50) {
  try {
    const query = `
        WITH firm_totals AS (
          SELECT
            COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown') as firm_name,
            SUM(amount) FILTER (WHERE amount IS NOT NULL) as total_amount,
            COUNT(*) as fine_count,
            AVG(amount) FILTER (WHERE amount IS NOT NULL) as avg_fine,
            MIN(date_issued) as first_fine_date,
            MAX(date_issued) as latest_fine_date
          FROM fca_fines
          WHERE amount IS NOT NULL
          GROUP BY COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown')
        ),
        ranked AS (
          SELECT
            firm_name,
            total_amount,
            fine_count,
            avg_fine,
            first_fine_date,
            latest_fine_date,
            PERCENT_RANK() OVER (ORDER BY total_amount) * 100 as percentile,
            RANK() OVER (ORDER BY total_amount DESC) as rank_position,
            COUNT(*) OVER () as total_firms
          FROM firm_totals
        )
        SELECT *
        FROM ranked
        ORDER BY total_amount DESC
        LIMIT $1
      `

    const result = await this.db.query(query, [limit])

    // Add tier classification to each firm
    return result.rows.map(firm => {
      const percentile = parseFloat(firm.percentile) || 0

      let tier = 'Average'
      let tierColor = '#64748b'
      if (percentile >= 99) { tier = 'Top 1%'; tierColor = '#dc2626' }
      else if (percentile >= 95) { tier = 'Top 5%'; tierColor = '#ea580c' }
      else if (percentile >= 90) { tier = 'Top 10%'; tierColor = '#d97706' }
      else if (percentile >= 75) { tier = 'Top 25%'; tierColor = '#ca8a04' }
      else if (percentile >= 50) { tier = 'Above Average'; tierColor = '#65a30d' }
      else if (percentile >= 25) { tier = 'Below Average'; tierColor = '#0d9488' }
      else { tier = 'Bottom 25%'; tierColor = '#0891b2' }

      // Add medal emoji for top 3
      let medal = ''
      if (firm.rank_position === '1' || firm.rank_position === 1) medal = '🥇'
      else if (firm.rank_position === '2' || firm.rank_position === 2) medal = '🥈'
      else if (firm.rank_position === '3' || firm.rank_position === 3) medal = '🥉'

      return {
        ...firm,
        total_amount: parseFloat(firm.total_amount) || 0,
        fine_count: parseInt(firm.fine_count) || 0,
        avg_fine: parseFloat(firm.avg_fine) || 0,
        percentile: percentile,
        rank: parseInt(firm.rank_position) || 0,
        total_firms: parseInt(firm.total_firms) || 0,
        tier: tier,
        tier_color: tierColor,
        medal: medal
      }
    })
  } catch (error) {
    console.error('Error getting percentile rankings:', error)
    throw error
  }
}

module.exports = {
  getSectorBenchmarks,
  getFirmPercentile,
  getPercentileRankings
}
