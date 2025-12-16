// FCA Enforcement API Routes
// Enhanced Horizon Scanner - Enforcement Data API

const express = require('express')
const router = express.Router()
const { Pool } = require('pg')
const { parseFinesJsonbFields } = require('../../utils/jsonbHelpers')

// Direct database fallback for when enforcement service isn't initialized
async function getDirectDbPool() {
  if (!process.env.DATABASE_URL) return null
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })
}

async function directSearchFines(params) {
  const pool = await getDirectDbPool()
  if (!pool) return { fines: [], total: 0 }

  try {
    const limit = params.limit || 20
    const offset = params.offset || 0

    const result = await pool.query(`
      SELECT
        fine_reference,
        date_issued,
        firm_individual,
        amount,
        ai_summary,
        breach_categories,
        affected_sectors,
        customer_impact_level,
        risk_score,
        final_notice_url
      FROM fca_fines
      WHERE amount IS NOT NULL
      ORDER BY date_issued DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset])

    const countResult = await pool.query('SELECT COUNT(*) FROM fca_fines WHERE amount IS NOT NULL')

    const parsedFines = parseFinesJsonbFields(result.rows)

    await pool.end()
    return { fines: parsedFines, total: parseInt(countResult.rows[0].count) }
  } catch (error) {
    console.error('Direct DB search error:', error)
    await pool.end().catch(() => {})
    return { fines: [], total: 0 }
  }
}

async function directGetRecentFines(limit = 20) {
  const pool = await getDirectDbPool()
  if (!pool) return []

  try {
    const result = await pool.query(`
      SELECT
        fine_reference,
        date_issued,
        firm_individual,
        amount,
        ai_summary,
        breach_categories,
        affected_sectors,
        customer_impact_level,
        risk_score,
        final_notice_url
      FROM fca_fines
      WHERE amount IS NOT NULL
      ORDER BY date_issued DESC
      LIMIT $1
    `, [limit])

    const parsedFines = parseFinesJsonbFields(result.rows)

    await pool.end()
    return parsedFines
  } catch (error) {
    console.error('Direct DB recent fines error:', error)
    await pool.end().catch(() => {})
    return []
  }
}

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

    // Parse filter parameters from query string
    const filterParams = {}

    // Parse years filter (comma-separated list)
    if (req.query.years) {
      filterParams.years = req.query.years
        .split(',')
        .map(y => parseInt(y.trim(), 10))
        .filter(Number.isFinite)
    }

    // Parse breach type filter
    if (req.query.breach_type) {
      filterParams.breach_type = req.query.breach_type.trim()
    }

    // Parse amount range filters
    if (req.query.minAmount) {
      const minAmount = parseFloat(req.query.minAmount)
      if (Number.isFinite(minAmount) && minAmount >= 0) {
        filterParams.minAmount = minAmount
      }
    }

    if (req.query.maxAmount) {
      const maxAmount = parseFloat(req.query.maxAmount)
      if (Number.isFinite(maxAmount) && maxAmount >= 0) {
        filterParams.maxAmount = maxAmount
      }
    }

    console.log('[stats] Filter params:', filterParams)

    // Get stats with filters
    const stats = await req.app.locals.enforcementService.getEnforcementStats(filterParams)

    res.json({
      success: true,
      stats,
      filtered: Object.keys(filterParams).length > 0,
      filters: filterParams
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
    const limit = Math.min(parseInt(req.query.limit) || 20, 100)

    let fines
    if (req.app.locals.enforcementService) {
      fines = await req.app.locals.enforcementService.getRecentFines(limit)
    } else {
      // Fallback to direct database query
      console.log('[enforcement] Using direct DB fallback for recent fines')
      fines = await directGetRecentFines(limit)
    }

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
 * Get fines trends data with optional filters
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
    const years = req.query.years
      ? req.query.years.split(',').map(year => parseInt(year.trim(), 10)).filter(Number.isFinite)
      : undefined

    if (!['monthly', 'quarterly', 'yearly'].includes(period)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid period. Must be monthly, quarterly, or yearly'
      })
    }

    // Build filter options
    const filterOptions = {
      years,
      firm: req.query.firm,
      breachType: req.query.breach_type,
      sector: req.query.sector,
      riskLevel: req.query.risk_level
    }

    const trends = await req.app.locals.enforcementService.getFinesTrends(period, limit, filterOptions)

    res.json({
      success: true,
      trends,
      period,
      years,
      filters: Object.fromEntries(
        Object.entries(filterOptions).filter(([_, v]) => v !== undefined)
      ),
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
 * GET /api/enforcement/heatmap
 * Get breach category × year heatmap data
 */
router.get('/heatmap', async (req, res) => {
  try {
    if (!req.app.locals.enforcementService) {
      return res.status(503).json({
        success: false,
        error: 'Enforcement service not available'
      })
    }

    const years = req.query.years
      ? req.query.years.split(',').map(year => parseInt(year.trim(), 10)).filter(Number.isFinite)
      : undefined

    const heatmap = await req.app.locals.enforcementService.getHeatmapData({ years })

    res.json({
      success: true,
      heatmap,
      years,
      count: heatmap.length
    })
  } catch (error) {
    console.error('Error getting heatmap data:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve heatmap data'
    })
  }
})

/**
 * GET /api/enforcement/distribution
 * Get fine amount distribution across buckets
 */
router.get('/distribution', async (req, res) => {
  try {
    if (!req.app.locals.enforcementService) {
      return res.status(503).json({
        success: false,
        error: 'Enforcement service not available'
      })
    }

    const years = req.query.years
      ? req.query.years.split(',').map(year => parseInt(year.trim(), 10)).filter(Number.isFinite)
      : undefined

    const distribution = await req.app.locals.enforcementService.getDistribution({ years })

    res.json({
      success: true,
      distribution,
      years,
      count: distribution.length
    })
  } catch (error) {
    console.error('Error getting distribution data:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve distribution data'
    })
  }
})

/**
 * GET /api/enforcement/search
 * Search fines with filters
 */
router.get('/search', async (req, res) => {
  try {
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

    let results
    if (req.app.locals.enforcementService) {
      results = await req.app.locals.enforcementService.searchFines(searchParams)
    } else {
      // Fallback to direct database query
      console.log('[enforcement] Using direct DB fallback for search')
      results = await directSearchFines(searchParams)
    }

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
    console.log('Refresh Manual enforcement data update requested')

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
 * GET /api/enforcement/repeat-offenders
 * Get firms with multiple fines (repeat offenders)
 */
router.get('/repeat-offenders', async (req, res) => {
  try {
    if (!req.app.locals.enforcementService) {
      return res.status(503).json({
        success: false,
        error: 'Enforcement service not available'
      })
    }

    const offenders = await req.app.locals.enforcementService.getRepeatOffenders()

    res.json({
      success: true,
      offenders,
      count: offenders.length
    })
  } catch (error) {
    console.error('Error getting repeat offenders:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve repeat offenders'
    })
  }
})

/**
 * GET /api/enforcement/fines-by-period
 * Get fines for a specific time period (30, 60, 90 days or YTD)
 */
router.get('/fines-by-period', async (req, res) => {
  try {
    if (!req.app.locals.enforcementService) {
      return res.status(503).json({
        success: false,
        error: 'Enforcement service not available'
      })
    }

    const period = req.query.period || '30'
    const validPeriods = ['30', '60', '90', 'ytd']

    if (!validPeriods.includes(period)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid period. Must be 30, 60, 90, or ytd'
      })
    }

    const result = await req.app.locals.enforcementService.getFinesByPeriod(period)

    res.json({
      success: true,
      fines: result.fines,
      totalAmount: result.totalAmount,
      period,
      count: result.fines.length
    })
  } catch (error) {
    console.error('Error getting fines by period:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve fines by period'
    })
  }
})

/**
 * GET /api/enforcement/distinct-firms
 * Get list of all distinct firms that have been fined
 * Supports optional search query parameter for autocomplete
 */
router.get('/distinct-firms', async (req, res) => {
  try {
    if (!req.app.locals.enforcementService) {
      return res.status(503).json({
        success: false,
        error: 'Enforcement service not available'
      })
    }

    const searchQuery = req.query.q || ''
    const limit = Math.min(parseInt(req.query.limit) || 20, 100)

    const firms = await req.app.locals.enforcementService.getDistinctFirms(searchQuery, limit)

    res.json({
      success: true,
      firms,
      query: searchQuery,
      count: firms.length
    })
  } catch (error) {
    console.error('Error getting distinct firms:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve distinct firms'
    })
  }
})

/**
 * GET /api/enforcement/firm-details
 * Get detailed information about a specific firm
 */
router.get('/firm-details', async (req, res) => {
  try {
    if (!req.app.locals.enforcementService) {
      return res.status(503).json({
        success: false,
        error: 'Enforcement service not available'
      })
    }

    const firmName = req.query.firm
    if (!firmName) {
      return res.status(400).json({
        success: false,
        error: 'Firm name is required'
      })
    }

    const firm = await req.app.locals.enforcementService.getFirmDetails(firmName)

    res.json({
      success: true,
      firm
    })
  } catch (error) {
    console.error('Error getting firm details:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve firm details'
    })
  }
})

/**
 * GET /api/enforcement/compare-firms
 * Compare multiple firms side-by-side (max 3 firms)
 * Query params: firms (comma-separated list of firm names)
 */
router.get('/compare-firms', async (req, res) => {
  try {
    if (!req.app.locals.enforcementService) {
      return res.status(503).json({
        success: false,
        error: 'Enforcement service not available'
      })
    }

    const firmsParam = req.query.firms
    if (!firmsParam) {
      return res.status(400).json({
        success: false,
        error: 'Firms parameter is required (comma-separated list)'
      })
    }

    const firmNames = firmsParam.split(',').map(f => f.trim()).filter(f => f.length > 0)

    if (firmNames.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one firm name is required'
      })
    }

    if (firmNames.length > 3) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 3 firms can be compared at once'
      })
    }

    const comparison = await req.app.locals.enforcementService.compareFirms(firmNames)

    res.json({
      success: true,
      firms: comparison,
      count: comparison.length
    })
  } catch (error) {
    console.error('Error comparing firms:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to compare firms'
    })
  }
})

/**
 * GET /api/enforcement/sector-benchmarks
 * Get sector benchmarking data (avg, median, percentiles)
 * Query params: sector (optional - if not provided, returns all sectors)
 */
router.get('/sector-benchmarks', async (req, res) => {
  try {
    if (!req.app.locals.enforcementService) {
      return res.status(503).json({
        success: false,
        error: 'Enforcement service not available'
      })
    }

    const sector = req.query.sector || null
    const benchmarks = await req.app.locals.enforcementService.getSectorBenchmarks(sector)

    res.json({
      success: true,
      benchmarks,
      sector: sector || 'all'
    })
  } catch (error) {
    console.error('Error getting sector benchmarks:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve sector benchmarks'
    })
  }
})

/**
 * GET /api/enforcement/firm-percentile
 * Get a firm's percentile ranking within its sector
 * Query params: firm (required), sector (optional)
 */
router.get('/firm-percentile', async (req, res) => {
  try {
    if (!req.app.locals.enforcementService) {
      return res.status(503).json({
        success: false,
        error: 'Enforcement service not available'
      })
    }

    const firmName = req.query.firm
    if (!firmName) {
      return res.status(400).json({
        success: false,
        error: 'Firm name is required'
      })
    }

    const sector = req.query.sector || null
    const percentileData = await req.app.locals.enforcementService.getFirmPercentile(firmName, sector)

    res.json({
      success: true,
      firm: firmName,
      sector: sector || 'overall',
      percentile: percentileData
    })
  } catch (error) {
    console.error('Error getting firm percentile:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve firm percentile'
    })
  }
})

/**
 * GET /api/enforcement/sector-analysis
 * Get sector-level analysis data for bubble chart visualization
 * Returns: sector name, fine count, total amount, avg fine, dominant breach category
 */
router.get('/sector-analysis', async (req, res) => {
  try {
    if (!req.app.locals.enforcementService) {
      return res.status(503).json({
        success: false,
        error: 'Enforcement service not available'
      })
    }

    const analysis = await req.app.locals.enforcementService.getSectorAnalysis()

    res.json({
      success: true,
      sectors: analysis,
      count: analysis.length
    })
  } catch (error) {
    console.error('Error getting sector analysis:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve sector analysis'
    })
  }
})

/**
 * GET /api/enforcement/percentile-rankings
 * Get all firms with percentile rankings and tier classifications
 * Query params: limit (default 50)
 */
router.get('/percentile-rankings', async (req, res) => {
  try {
    if (!req.app.locals.enforcementService) {
      return res.status(503).json({
        success: false,
        error: 'Enforcement service not available'
      })
    }

    const limit = Math.min(parseInt(req.query.limit) || 50, 100)
    const rankings = await req.app.locals.enforcementService.getPercentileRankings(limit)

    res.json({
      success: true,
      rankings,
      count: rankings.length
    })
  } catch (error) {
    console.error('Error getting percentile rankings:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve percentile rankings'
    })
  }
})

/**
 * GET /api/enforcement/sector-trends
 * Get sector enforcement trends over time for line chart visualization
 * Returns yearly totals for each sector
 */
router.get('/sector-trends', async (req, res) => {
  try {
    if (!req.app.locals.enforcementService) {
      return res.status(503).json({
        success: false,
        error: 'Enforcement service not available'
      })
    }

    const trends = await req.app.locals.enforcementService.getSectorTrends()

    res.json({
      success: true,
      ...trends
    })
  } catch (error) {
    console.error('Error getting sector trends:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve sector trends'
    })
  }
})

/**
 * GET /api/enforcement/year-summary/:year
 * Get comprehensive summary data for a specific year
 */
router.get('/year-summary/:year', async (req, res) => {
  try {
    if (!req.app.locals.enforcementService) {
      return res.status(503).json({
        success: false,
        error: 'Enforcement service not available'
      })
    }

    const year = parseInt(req.params.year, 10)

    // Validate year
    if (!Number.isFinite(year) || year < 2013 || year > new Date().getFullYear()) {
      return res.status(400).json({
        success: false,
        error: `Invalid year. Must be between 2013 and ${new Date().getFullYear()}`
      })
    }

    console.log(`[year-summary] Fetching summary for year ${year}`)
    const summary = await req.app.locals.enforcementService.getYearSummary(year)

    res.json({
      success: true,
      year,
      summary
    })
  } catch (error) {
    console.error('Error getting year summary:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve year summary'
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
    'Amount (GBP)',
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
