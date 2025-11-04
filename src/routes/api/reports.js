const dbService = require('../../services/dbService')
const reportExportService = require('../../services/reportExportService')

function registerReportRoutes(router) {
  router.post('/reports', async (req, res) => {
  try {
    const { report_type: reportType, filters = {} } = req.body || {}

    if (!reportType) {
      return res.status(400).json({ success: false, error: 'report_type is required' })
    }

    const report = await reportExportService.generateReport(reportType, filters)

    res.status(201).json({
      success: true,
      report
    })
  } catch (error) {
    console.error('Report export failed:', error)
    const status = /required/.test(error.message) ? 400 : 500
    res.status(status).json({ success: false, error: error.message })
  }
  })

  router.get('/export', async (req, res) => {
  try {
    const updates = await dbService.getAllUpdates()

    res.json({
      success: true,
      data: {
        updates: updates.slice(0, 100),
        exportDate: new Date().toISOString(),
        totalRecords: updates.length
      }
    })
  } catch (error) {
    console.error('Export error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to export data',
      details: error.message
    })
  }
  })

  router.get('/export/dashboard-report', async (req, res) => {
  try {
    console.log('[Dashboard Export] Generating report with filters:', req.query)

    const reportType = req.query.report_type || 'intelligence_center'
    const options = {
      limit: parseInt(req.query.limit, 10) || 100,
      authority: req.query.authority || null,
      sector: req.query.sector || null,
      annotation_status: req.query.annotation_status ? req.query.annotation_status.split(',') : [],
      annotation_visibility: req.query.annotation_visibility ? req.query.annotation_visibility.split(',') : []
    }

    const report = await reportExportService.generateReport(reportType, options)

    res.setHeader('Content-Type', 'text/html')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="dashboard-report-${new Date().toISOString().split('T')[0]}.html"`
    )
    res.send(report.html)
  } catch (error) {
    console.error('[Dashboard Export] Failed:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate dashboard report',
      details: error.message
    })
  }
  })
}

module.exports = registerReportRoutes
