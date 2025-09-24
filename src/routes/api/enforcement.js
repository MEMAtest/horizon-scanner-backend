// FCA Enforcement API Routes
// Enhanced Horizon Scanner - Enforcement Data API

const express = require('express')
const router = express.Router()

/**
 * GET /api/enforcement/stats
 * Get enforcement overview statistics
 */
router.get('/stats', async (req, res) => {
  try {
    if (!req.app.locals.enforcementService) {
      return res.status(503).json({
        success: false,
        error: 'Enforcement service not available'
      })
    }

    const stats = await req.app.locals.enforcementService.getEnforcementStats()

    res.json({
      success: true,
      stats
    })
  } catch (error) {
    console.error('Error getting enforcement stats:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve enforcement statistics'
    })
  }
})

/**
 * GET /api/enforcement/recent
 * Get recent fines
 */
router.get('/recent', async (req, res) => {
  try {
    if (!req.app.locals.enforcementService) {
      return res.status(503).json({
        success: false,
        error: 'Enforcement service not available'
      })
    }

    const limit = Math.min(parseInt(req.query.limit) || 20, 100)
    const fines = await req.app.locals.enforcementService.getRecentFines(limit)

    res.json({
      success: true,
      fines,
      count: fines.length
    })
  } catch (error) {
    console.error('Error getting recent fines:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve recent fines'
    })
  }
})

/**
 * GET /api/enforcement/trends
 * Get fines trends data
 */
router.get('/trends', async (req, res) => {
  try {
    if (!req.app.locals.enforcementService) {
      return res.status(503).json({
        success: false,
        error: 'Enforcement service not available'
      })
    }

    const period = req.query.period || 'monthly'
    const limit = Math.min(parseInt(req.query.limit) || 12, 24)

    if (!['monthly', 'quarterly', 'yearly'].includes(period)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid period. Must be monthly, quarterly, or yearly'
      })
    }

    const trends = await req.app.locals.enforcementService.getFinesTrends(period, limit)

    res.json({
      success: true,
      trends,
      period,
      count: trends.length
    })
  } catch (error) {
    console.error('Error getting fines trends:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve trends data'
    })
  }
})

/**
 * GET /api/enforcement/search
 * Search fines with filters
 */
router.get('/search', async (req, res) => {
  try {
    if (!req.app.locals.enforcementService) {
      return res.status(503).json({
        success: false,
        error: 'Enforcement service not available'
      })
    }

    const searchParams = {
      query: req.query.q,
      breachType: req.query.breach_type,
      sector: req.query.sector,
      minAmount: req.query.min_amount ? parseFloat(req.query.min_amount) : undefined,
      maxAmount: req.query.max_amount ? parseFloat(req.query.max_amount) : undefined,
      startDate: req.query.start_date,
      endDate: req.query.end_date,
      years: req.query.years ? req.query.years.split(',').map(y => y.trim()) : undefined,
      riskLevel: req.query.risk_level,
      systemicRisk: req.query.systemic_risk === 'true'
        ? true
        : req.query.systemic_risk === 'false' ? false : undefined,
      limit: Math.min(parseInt(req.query.limit) || 20, 100),
      offset: parseInt(req.query.offset) || 0
    }

    const results = await req.app.locals.enforcementService.searchFines(searchParams)

    res.json({
      success: true,
      results,
      searchParams: Object.fromEntries(
        Object.entries(searchParams).filter(([_, v]) => v !== undefined)
      )
    })
  } catch (error) {
    console.error('Error searching fines:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to search fines'
    })
  }
})

/**
 * GET /api/enforcement/top-firms
 * Get firms with highest total fines
 */
router.get('/top-firms', async (req, res) => {
  try {
    if (!req.app.locals.enforcementService) {
      return res.status(503).json({
        success: false,
        error: 'Enforcement service not available'
      })
    }

    const limit = Math.min(parseInt(req.query.limit) || 10, 50)
    const firms = await req.app.locals.enforcementService.getTopFirms(limit)

    res.json({
      success: true,
      firms,
      count: firms.length
    })
  } catch (error) {
    console.error('Error getting top firms:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve top firms'
    })
  }
})

/**
 * GET /api/enforcement/insights
 * Get AI-generated insights
 */
router.get('/insights', async (req, res) => {
  try {
    if (!req.app.locals.enforcementService) {
      return res.status(503).json({
        success: false,
        error: 'Enforcement service not available'
      })
    }

    const insights = await req.app.locals.enforcementService.getEnforcementInsights()

    res.json({
      success: true,
      insights
    })
  } catch (error) {
    console.error('Error getting enforcement insights:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve insights'
    })
  }
})

/**
 * POST /api/enforcement/update
 * Trigger manual update of enforcement data (admin only)
 */
router.post('/update', async (req, res) => {
  try {
    if (!req.app.locals.enforcementService) {
      return res.status(503).json({
        success: false,
        error: 'Enforcement service not available'
      })
    }

    // This would typically require admin authentication
    // For now, we'll allow it but log the request
    console.log('🔄 Manual enforcement data update requested')

    const results = await req.app.locals.enforcementService.updateEnforcementData()

    res.json({
      success: true,
      message: 'Enforcement data update initiated',
      results
    })
  } catch (error) {
    console.error('Error triggering enforcement update:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to trigger data update'
    })
  }
})

/**
 * GET /api/enforcement/export
 * Export enforcement data as CSV
 */
router.get('/export', async (req, res) => {
  try {
    if (!req.app.locals.enforcementService) {
      return res.status(503).json({
        success: false,
        error: 'Enforcement service not available'
      })
    }

    // Get search parameters for filtering export
    const searchParams = {
      query: req.query.q,
      breachType: req.query.breach_type,
      sector: req.query.sector,
      minAmount: req.query.min_amount ? parseFloat(req.query.min_amount) : undefined,
      maxAmount: req.query.max_amount ? parseFloat(req.query.max_amount) : undefined,
      startDate: req.query.start_date,
      endDate: req.query.end_date,
      riskLevel: req.query.risk_level,
      systemicRisk: req.query.systemic_risk === 'true'
        ? true
        : req.query.systemic_risk === 'false' ? false : undefined,
      limit: 1000, // Maximum for export
      offset: 0
    }

    const results = await req.app.locals.enforcementService.searchFines(searchParams)

    // Convert to CSV
    if (results.fines.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No data found for export'
      })
    }

    const csv = convertToCSV(results.fines)

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename=fca_fines_export.csv')
    res.send(csv)
  } catch (error) {
    console.error('Error exporting enforcement data:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to export data'
    })
  }
})

/**
 * Helper function to convert fines data to CSV
 */
function convertToCSV(fines) {
  const headers = [
    'Reference',
    'Date',
    'Firm/Individual',
    'Amount (£)',
    'Breach Categories',
    'Affected Sectors',
    'Impact Level',
    'Risk Score',
    'Systemic Risk',
    'Precedent Setting',
    'Summary',
    'Notice URL'
  ]

  const csvRows = [headers.join(',')]

  fines.forEach(fine => {
    const row = [
      escapeCsvField(fine.fine_reference),
      fine.date_issued,
      escapeCsvField(fine.firm_individual),
      fine.amount || '',
      escapeCsvField(Array.isArray(fine.breach_categories) ? fine.breach_categories.join('; ') : ''),
      escapeCsvField(Array.isArray(fine.affected_sectors) ? fine.affected_sectors.join('; ') : ''),
      fine.customer_impact_level || '',
      fine.risk_score || '',
      fine.systemic_risk ? 'Yes' : 'No',
      fine.precedent_setting ? 'Yes' : 'No',
      escapeCsvField(fine.ai_summary || ''),
      fine.final_notice_url || ''
    ]
    csvRows.push(row.join(','))
  })

  return csvRows.join('\n')
}

/**
 * Helper function to escape CSV fields
 */
function escapeCsvField(field) {
  if (!field) return ''
  const stringField = String(field)
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
    return '"' + stringField.replace(/"/g, '""') + '"'
  }
  return stringField
}

module.exports = router
