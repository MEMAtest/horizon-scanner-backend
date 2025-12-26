/**
 * Publications API - Status & Stats Routes
 * Endpoints for pipeline status and statistics
 */

const express = require('express')
const router = express.Router()
const { getDbPool, getPipeline, allowFallback, requirePipeline } = require('./helpers')

/**
 * GET /status
 * Get pipeline status and statistics
 */
router.get('/status', allowFallback, async (req, res) => {
  try {
    const pipeline = getPipeline()
    if (pipeline) {
      const status = await pipeline.getStatus()
      res.json({ success: true, ...status })
    } else {
      // Direct DB fallback
      const pool = getDbPool()
      const indexResult = await pool.query(`
        SELECT status, count(*) as count
        FROM fca_publications_index
        GROUP BY status
      `)
      const noticesResult = await pool.query(`
        SELECT count(*) as count FROM fca_enforcement_notices
      `)

      const byStatus = {}
      let total = 0
      indexResult.rows.forEach(row => {
        byStatus[row.status] = parseInt(row.count)
        total += parseInt(row.count)
      })

      res.json({
        success: true,
        index: { total, byStatus },
        notices: { total: parseInt(noticesResult.rows[0]?.count || 0) }
      })
    }
  } catch (error) {
    console.error('[PublicationsAPI] Error getting status:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /stats
 * Get detailed statistics
 */
router.get('/stats', allowFallback, async (req, res) => {
  try {
    const pipeline = getPipeline()
    if (pipeline) {
      const stats = await pipeline.getStats()
      res.json({ success: true, data: stats })
    } else {
      // Direct DB fallback for stats
      const pool = getDbPool()

      const [outcomes, breaches, fines, riskDist] = await Promise.all([
        pool.query(`SELECT outcome_type, COUNT(*) as count FROM fca_enforcement_notices GROUP BY outcome_type ORDER BY count DESC`),
        pool.query(`SELECT primary_breach_type, COUNT(*) as count FROM fca_enforcement_notices WHERE primary_breach_type IS NOT NULL GROUP BY primary_breach_type ORDER BY count DESC LIMIT 10`),
        pool.query(`SELECT SUM(fine_amount) as total, COUNT(*) as count, AVG(fine_amount) as avg FROM fca_enforcement_notices WHERE fine_amount > 0`),
        pool.query(`SELECT
          CASE
            WHEN risk_score >= 80 THEN 'Critical'
            WHEN risk_score >= 60 THEN 'High'
            WHEN risk_score >= 40 THEN 'Medium'
            WHEN risk_score >= 20 THEN 'Low'
            ELSE 'Minimal'
          END as level,
          COUNT(*) as count
          FROM fca_enforcement_notices GROUP BY level ORDER BY count DESC`)
      ])

      res.json({
        success: true,
        data: {
          outcomes: outcomes.rows,
          breaches: breaches.rows,
          fines: {
            total: parseFloat(fines.rows[0]?.total || 0),
            count: parseInt(fines.rows[0]?.count || 0),
            average: parseFloat(fines.rows[0]?.avg || 0)
          },
          riskDistribution: riskDist.rows
        }
      })
    }
  } catch (error) {
    console.error('[PublicationsAPI] Error getting stats:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /jobs
 * List pipeline jobs
 */
router.get('/jobs', requirePipeline, async (req, res) => {
  try {
    const pipeline = getPipeline()
    const { limit = 20, offset = 0, status, type } = req.query
    const jobs = await pipeline.getJobs({
      limit: parseInt(limit),
      offset: parseInt(offset),
      status,
      jobType: type
    })
    res.json({ success: true, data: jobs })
  } catch (error) {
    console.error('[PublicationsAPI] Error getting jobs:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

module.exports = router
