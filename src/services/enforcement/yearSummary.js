// ============================================================================
// YEAR SUMMARY METHODS (Phase 4)
// ============================================================================

/**
 * Get comprehensive year summary with all sections
 * @param {number} year - Year to analyze
 * @returns {Object} Complete year summary data
 */
async function getYearSummary(year) {
  try {
    const [
      yearStats,
      topFirms,
      categoryBreakdown,
      monthlyTimeline,
      priorYearStats,
      datasetAverages
    ] = await Promise.all([
      this.getYearStats(year),
      this.getTopFirmsForYear(year),
      this.getCategoryBreakdownForYear(year),
      this.getMonthlyTimelineForYear(year),
      this.getYearStats(year - 1),
      this.getDatasetAverages()
    ])

    const aiSummary = this.generateYearSummary(
      year, yearStats, categoryBreakdown, topFirms, priorYearStats
    )

    return {
      aiSummary,
      yearStats,
      priorYearStats,
      datasetAverages,
      topFirms,
      categoryBreakdown,
      monthlyTimeline
    }
  } catch (error) {
    console.error(`Error getting year summary for ${year}:`, error)
    throw error
  }
}

/**
 * Get statistics for a specific year
 * @param {number} year - Year to analyze
 * @returns {Object} Year statistics
 */
async function getYearStats(year) {
  try {
    const result = await this.db.query(`
        SELECT
          COUNT(*) as fine_count,
          SUM(amount) FILTER (WHERE amount IS NOT NULL) as total_amount,
          AVG(amount) FILTER (WHERE amount IS NOT NULL) as average_fine,
          MAX(amount) FILTER (WHERE amount IS NOT NULL) as largest_fine,
          MIN(amount) FILTER (WHERE amount IS NOT NULL) as smallest_fine,
          COUNT(DISTINCT COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown')) as distinct_firms,
          AVG(risk_score) FILTER (WHERE risk_score IS NOT NULL) as avg_risk_score,
          COUNT(*) FILTER (WHERE systemic_risk = true) as systemic_risk_count
        FROM fca_fines
        WHERE year_issued = $1
          AND amount IS NOT NULL
      `, [year])

    return result.rows[0] || {
      fine_count: 0,
      total_amount: 0,
      average_fine: 0,
      largest_fine: 0,
      smallest_fine: 0,
      distinct_firms: 0,
      avg_risk_score: 0,
      systemic_risk_count: 0
    }
  } catch (error) {
    console.error(`Error getting year stats for ${year}:`, error)
    throw error
  }
}

/**
 * Get dataset-wide averages for comparison
 * @returns {Object} Dataset average statistics
 */
async function getDatasetAverages() {
  try {
    const result = await this.db.query(`
        WITH yearly_aggregates AS (
          SELECT
            year_issued as year,
            COUNT(*) as fine_count,
            SUM(amount) as total_amount
          FROM fca_fines
          WHERE amount IS NOT NULL
            AND year_issued IS NOT NULL
          GROUP BY year_issued
        )
        SELECT
          AVG(fine_count) as avg_fines_per_year,
          AVG(total_amount) as avg_amount_per_year
        FROM yearly_aggregates
      `)

    return result.rows[0] || {
      avg_fines_per_year: 0,
      avg_amount_per_year: 0
    }
  } catch (error) {
    console.error('Error getting dataset averages:', error)
    throw error
  }
}

/**
 * Get top 10 firms fined in a specific year
 * @param {number} year - Year to analyze
 * @returns {Array} Top firms with their fines
 */
async function getTopFirmsForYear(year) {
  try {
    // First get the aggregated data
    const result = await this.db.query(`
        SELECT
          firm_individual as firm_name,
          COUNT(*) as fine_count,
          SUM(amount) as total_amount,
          AVG(risk_score) as avg_risk_score,
          array_agg(
            json_build_object(
              'date_issued', date_issued,
              'amount', amount,
              'breach_categories', breach_categories,
              'final_notice_url', final_notice_url
            ) ORDER BY date_issued DESC
          ) as fines
        FROM fca_fines
        WHERE year_issued = $1
          AND amount IS NOT NULL
          AND COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown') != 'Unknown'
        GROUP BY firm_individual
        ORDER BY SUM(amount) DESC
        LIMIT 10
      `, [year])

    // Parse breach_categories for each fine in each firm
    return result.rows.map(firm => ({
      ...firm,
      fine_count: parseInt(firm.fine_count),
      total_amount: parseFloat(firm.total_amount),
      avg_risk_score: firm.avg_risk_score ? parseFloat(firm.avg_risk_score) : null,
      fines: firm.fines.map(fine => ({
        ...fine,
        breach_categories: this.parseJsonbField(fine.breach_categories)
      }))
    }))
  } catch (error) {
    console.error(`Error getting top firms for ${year}:`, error)
    throw error
  }
}

/**
 * Get category breakdown for a specific year
 * @param {number} year - Year to analyze
 * @returns {Array} Category statistics with percentages
 */
async function getCategoryBreakdownForYear(year) {
  try {
    // Get all fines for the year
    const result = await this.db.query(`
        SELECT amount, breach_categories
        FROM fca_fines
        WHERE year_issued = $1
          AND amount IS NOT NULL
      `, [year])

    // Process in JavaScript to handle JSONB
    const categoryMap = new Map()
    let totalFines = 0

    result.rows.forEach(row => {
      const amount = parseFloat(row.amount) || 0
      let categories = this.parseJsonbField(row.breach_categories)

      if (!Array.isArray(categories) || categories.length === 0) {
        categories = ['Not Categorised']
      }

      categories.forEach(category => {
        if (!category) return
        const existing = categoryMap.get(category) || { category, fine_count: 0, total_amount: 0 }
        existing.fine_count += 1
        existing.total_amount += amount
        categoryMap.set(category, existing)
        totalFines += 1
      })
    })

    // Convert to array and calculate percentages
    const breakdown = Array.from(categoryMap.values()).map(item => ({
      category: item.category,
      fine_count: item.fine_count,
      total_amount: item.total_amount,
      avg_amount: Math.round(item.total_amount / item.fine_count),
      percentage: totalFines > 0 ? Math.round((item.fine_count / totalFines) * 1000) / 10 : 0
    }))

    return breakdown.sort((a, b) => b.fine_count - a.fine_count)
  } catch (error) {
    console.error(`Error getting category breakdown for ${year}:`, error)
    throw error
  }
}

/**
 * Get monthly timeline for a specific year
 * @param {number} year - Year to analyze
 * @returns {Array} Monthly statistics (all 12 months)
 */
async function getMonthlyTimelineForYear(year) {
  try {
    const result = await this.db.query(`
        SELECT
          EXTRACT(MONTH FROM date_issued) as month,
          TO_CHAR(date_issued, 'Mon') as month_name,
          COUNT(*) as fine_count,
          SUM(amount) as total_amount,
          AVG(amount) as avg_amount
        FROM fca_fines
        WHERE year_issued = $1
          AND amount IS NOT NULL
          AND date_issued IS NOT NULL
        GROUP BY EXTRACT(MONTH FROM date_issued), TO_CHAR(date_issued, 'Mon')
        ORDER BY month
      `, [year])

    // Fill in missing months with zero values
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthlyData = monthNames.map((monthName, index) => {
      const existing = result.rows.find(row => parseInt(row.month) === index + 1)
      return existing ? {
        month: index + 1,
        month_name: monthName,
        fine_count: parseInt(existing.fine_count),
        total_amount: parseFloat(existing.total_amount),
        avg_amount: existing.avg_amount ? parseFloat(existing.avg_amount) : 0
      } : {
        month: index + 1,
        month_name: monthName,
        fine_count: 0,
        total_amount: 0,
        avg_amount: 0
      }
    })

    return monthlyData
  } catch (error) {
    console.error(`Error getting monthly timeline for ${year}:`, error)
    throw error
  }
}

/**
 * Generate AI summary text for a year (template-based)
 * @param {number} year - Year to summarize
 * @param {Object} yearStats - Year statistics
 * @param {Array} categoryBreakdown - Category breakdown
 * @param {Array} topFirms - Top firms
 * @param {Object} priorYearStats - Prior year statistics (for comparison)
 * @returns {Object} Two-paragraph summary
 */
function generateYearSummary(year, yearStats, categoryBreakdown, topFirms, priorYearStats) {
  const fineCount = parseInt(yearStats.fine_count || 0)
  const totalAmount = parseFloat(yearStats.total_amount || 0)
  const avgFine = parseFloat(yearStats.average_fine || 0)
  const largestFine = parseFloat(yearStats.largest_fine || 0)

  // Calculate YoY changes
  const priorFineCount = parseInt(priorYearStats?.fine_count || 0)
  const priorTotalAmount = parseFloat(priorYearStats?.total_amount || 0)

  const countChange = priorFineCount > 0
    ? ((fineCount - priorFineCount) / priorFineCount * 100).toFixed(1)
    : null
  const amountChange = priorTotalAmount > 0
    ? ((totalAmount - priorTotalAmount) / priorTotalAmount * 100).toFixed(1)
    : null

  const dominantCategory = categoryBreakdown[0] || {
    category: 'Not Categorised', fine_count: 0, percentage: 0
  }
  const notableFirm = topFirms[0] || { firm_name: 'Unknown', total_amount: 0 }

  // Paragraph 1: Overview and YoY comparison
  let paragraph1 = `In ${year}, the FCA issued ${fineCount} enforcement ${fineCount === 1 ? 'action' : 'actions'} totalling £${(totalAmount / 1000000).toFixed(1)}m, with an average fine of £${(avgFine / 1000).toFixed(0)}k. `

  if (countChange !== null && amountChange !== null) {
    const countDirection = parseFloat(countChange) >= 0 ? 'increased' : 'decreased'
    const amountDirection = parseFloat(amountChange) >= 0 ? 'increased' : 'decreased'
    paragraph1 += `Compared to ${year - 1}, the number of fines ${countDirection} by ${Math.abs(countChange)}% while the total amount ${amountDirection} by ${Math.abs(amountChange)}%. `
  } else {
    paragraph1 += `This represented a baseline year in the FCA's enforcement trajectory. `
  }

  paragraph1 += `The largest single fine was £${(largestFine / 1000000).toFixed(1)}m, issued to ${notableFirm.firm_name}.`

  // Paragraph 2: Thematic focus
  const paragraph2 = `${dominantCategory.category} emerged as the dominant enforcement theme, accounting for ${dominantCategory.percentage}% of all actions (${dominantCategory.fine_count} cases). ` +
    `The FCA's focus on ${dominantCategory.category.toLowerCase()} reflects ongoing regulatory priorities around ${this.getCategoryContext(dominantCategory.category)}. ` +
    `${yearStats.systemic_risk_count > 0 ? `Notably, ${yearStats.systemic_risk_count} ${yearStats.systemic_risk_count === 1 ? 'case was' : 'cases were'} flagged for systemic risk implications, highlighting the FCA's attention to market-wide conduct issues. ` : ''}` +
    `Firms should review their ${dominantCategory.category.toLowerCase()} controls in light of this enforcement activity and ensure robust governance frameworks are in place.`

  return { paragraph1, paragraph2 }
}

module.exports = {
  getYearSummary,
  getYearStats,
  getDatasetAverages,
  getTopFirmsForYear,
  getCategoryBreakdownForYear,
  getMonthlyTimelineForYear,
  generateYearSummary
}
