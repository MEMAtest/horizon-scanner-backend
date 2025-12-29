const { Pool } = require('pg')
const dbService = require('../../../services/dbService')

async function getSystemStatistics() {
  try {
    const stats = await dbService.getSystemStatistics()
    return {
      totalUpdates: stats.totalUpdates || 0,
      activeAuthorities: stats.activeAuthorities || 0,
      aiAnalyzed: stats.aiAnalyzed || 0,
      highImpact: stats.highImpact || 0
    }
  } catch (error) {
    console.error('Error getting system statistics:', error)
    return {
      totalUpdates: 0,
      activeAuthorities: 0,
      aiAnalyzed: 0,
      highImpact: 0
    }
  }
}

async function getTopFinesThisYear() {
  try {
    const currentYear = new Date().getFullYear()

    // Query database directly to get all fines (including pending) for current year
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })

    const result = await pool.query(`
      SELECT
        fine_reference,
        date_issued,
        firm_individual,
        amount,
        ai_summary,
        breach_categories,
        affected_sectors,
        final_notice_url
      FROM fca_fines
      WHERE EXTRACT(YEAR FROM date_issued) = $1
        AND amount IS NOT NULL
        AND amount > 0
      ORDER BY amount DESC
      LIMIT 5
    `, [currentYear])

    await pool.end()

    return result.rows
  } catch (error) {
    console.error('Error getting top fines:', error)
    return []
  }
}

module.exports = { getSystemStatistics, getTopFinesThisYear }
