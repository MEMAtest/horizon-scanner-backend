const { parseFinesJsonbFields } = require('../../utils/jsonbHelpers')

async function getTopFirms(limit = 10) {
  try {
    const result = await this.db.query(`
                SELECT
                    firm_name,
                    total_fines,
                    fine_count,
                    first_fine_date,
                    latest_fine_date,
                    is_repeat_offender
                FROM fca_firm_history
                ORDER BY total_fines DESC
                LIMIT $1
            `, [limit])

    return result.rows
  } catch (error) {
    console.error('Error getting top firms:', error)
    throw error
  }
}

async function getRepeatOffenders() {
  try {
    // Get firms with more than one fine
    const result = await this.db.query(`
        WITH repeat_firms AS (
          SELECT
            COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown') as firm_name,
            COUNT(*) as fine_count,
            SUM(amount) FILTER (WHERE amount IS NOT NULL) as total_amount,
            AVG(risk_score) FILTER (WHERE risk_score IS NOT NULL) as average_risk
          FROM fca_fines
          GROUP BY COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown')
          HAVING COUNT(*) > 1
        )
        SELECT * FROM repeat_firms
        ORDER BY fine_count DESC, total_amount DESC
      `)

    // Get detailed fines for each repeat offender
    const offenders = await Promise.all(
      result.rows.map(async (firm) => {
        const finesResult = await this.db.query(`
            SELECT
              fine_reference,
              date_issued,
              amount,
              breach_categories,
              breach_type,
              risk_score,
              final_notice_url
            FROM fca_fines
            WHERE COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown') = $1
            ORDER BY date_issued DESC
          `, [firm.firm_name])

        return {
          ...firm,
          fines: parseFinesJsonbFields(finesResult.rows)
        }
      })
    )

    return offenders
  } catch (error) {
    console.error('Error getting repeat offenders:', error)
    throw error
  }
}

async function getDistinctFirms(searchQuery = '', limit = 20) {
  try {
    const params = []
    let whereClause = ''

    // Add search filter if provided
    if (searchQuery && searchQuery.trim().length > 0) {
      whereClause = 'WHERE firm_individual ILIKE $1'
      params.push(`%${searchQuery.trim()}%`)
    }

    const result = await this.db.query(`
        SELECT
          COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown') as firm_name,
          COUNT(*) as fine_count,
          SUM(amount) FILTER (WHERE amount IS NOT NULL) as total_amount,
          MIN(date_issued) as first_fine_date,
          MAX(date_issued) as latest_fine_date
        FROM fca_fines
        ${whereClause}
        GROUP BY COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown')
        ORDER BY total_amount DESC NULLS LAST
        LIMIT $${params.length + 1}
      `, [...params, limit])

    return result.rows
  } catch (error) {
    console.error('Error getting distinct firms:', error)
    throw error
  }
}

async function getFirmDetails(firmName) {
  try {
    // Get firm summary
    const summaryResult = await this.db.query(`
        SELECT
          COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown') as firm_name,
          COUNT(*) as fine_count,
          SUM(amount) FILTER (WHERE amount IS NOT NULL) as total_amount,
          AVG(risk_score) FILTER (WHERE risk_score IS NOT NULL) as average_risk,
          MIN(date_issued) as first_fine_date,
          MAX(date_issued) as latest_fine_date
        FROM fca_fines
        WHERE COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown') = $1
        GROUP BY COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown')
      `, [firmName])

    if (summaryResult.rows.length === 0) {
      return null
    }

    // Get all fines for the firm
    const finesResult = await this.db.query(`
        SELECT
          fine_reference,
          date_issued,
          amount,
          breach_categories,
          breach_type,
          affected_sectors,
          risk_score,
          ai_summary,
          final_notice_url
        FROM fca_fines
        WHERE COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown') = $1
        ORDER BY date_issued DESC
      `, [firmName])

    return {
      ...summaryResult.rows[0],
      fines: parseFinesJsonbFields(finesResult.rows)
    }
  } catch (error) {
    console.error('Error getting firm details:', error)
    throw error
  }
}

/**
 * Compare multiple firms side-by-side (max 3)
 * @param {Array<string>} firmNames - Array of firm names to compare
 * @returns {Array<Object>} Comparison data for each firm including yearly breakdown
 */
async function compareFirms(firmNames) {
  try {
    const comparisonData = []

    for (const firmName of firmNames) {
      // Get firm summary
      const summaryResult = await this.db.query(`
          SELECT
            COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown') as firm_name,
            COUNT(*) as fine_count,
            SUM(amount) FILTER (WHERE amount IS NOT NULL) as total_amount,
            AVG(amount) FILTER (WHERE amount IS NOT NULL) as avg_amount,
            AVG(risk_score) FILTER (WHERE risk_score IS NOT NULL) as average_risk,
            MIN(date_issued) as first_fine_date,
            MAX(date_issued) as latest_fine_date
          FROM fca_fines
          WHERE COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown') = $1
          GROUP BY COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown')
        `, [firmName])

      if (summaryResult.rows.length === 0) {
        // If firm not found, add placeholder
        comparisonData.push({
          firm_name: firmName,
          fine_count: 0,
          total_amount: 0,
          avg_amount: 0,
          average_risk: 0,
          first_fine_date: null,
          latest_fine_date: null,
          yearly_breakdown: [],
          not_found: true
        })
        continue
      }

      // Get yearly breakdown for the firm
      const yearlyResult = await this.db.query(`
          SELECT
            EXTRACT(YEAR FROM date_issued)::integer as year,
            COUNT(*) as fine_count,
            SUM(amount) FILTER (WHERE amount IS NOT NULL) as total_amount
          FROM fca_fines
          WHERE COALESCE(NULLIF(TRIM(firm_individual), ''), 'Unknown') = $1
          GROUP BY EXTRACT(YEAR FROM date_issued)
          ORDER BY year DESC
        `, [firmName])

      comparisonData.push({
        ...summaryResult.rows[0],
        yearly_breakdown: yearlyResult.rows
      })
    }

    return comparisonData
  } catch (error) {
    console.error('Error comparing firms:', error)
    throw error
  }
}

module.exports = {
  getTopFirms,
  getRepeatOffenders,
  getDistinctFirms,
  getFirmDetails,
  compareFirms
}
