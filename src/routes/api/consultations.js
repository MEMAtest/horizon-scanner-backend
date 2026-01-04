const express = require('express')
const router = express.Router()
const consultationService = require('../../services/consultationService')

// GET /api/consultations - List all consultations with optional filters
router.get('/', async (req, res) => {
  try {
    const { regulator, status, limit = 50, offset = 0 } = req.query

    const consultations = await consultationService.getConsultations({
      regulator,
      status,
      limit: parseInt(limit),
      offset: parseInt(offset)
    })

    res.json({
      success: true,
      count: consultations.length,
      consultations
    })
  } catch (error) {
    console.error('[API] Error fetching consultations:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch consultations'
    })
  }
})

// GET /api/consultations/summary - Get summary statistics
router.get('/summary', async (req, res) => {
  try {
    const summary = await consultationService.getConsultationSummary()

    res.json({
      success: true,
      summary
    })
  } catch (error) {
    console.error('[API] Error fetching consultation summary:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch consultation summary'
    })
  }
})

// GET /api/consultations/authorities - Get list of authorities with consultations
router.get('/authorities', async (req, res) => {
  try {
    const authorities = await consultationService.getConsultationAuthorities()

    res.json({
      success: true,
      authorities
    })
  } catch (error) {
    console.error('[API] Error fetching authorities:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch authorities'
    })
  }
})

// GET /api/consultations/transitions - Get CP to PS transition tracking
router.get('/transitions', async (req, res) => {
  try {
    const transitions = await consultationService.getTransitionStatus()

    const summary = {
      total: transitions.length,
      withPolicy: transitions.filter(t => t.hasPolicy).length,
      pending: transitions.filter(t => !t.hasPolicy).length,
      avgTransitionDays: Math.round(
        transitions.filter(t => t.transitionDays).reduce((sum, t) => sum + t.transitionDays, 0) /
        transitions.filter(t => t.transitionDays).length
      ) || 0
    }

    res.json({
      success: true,
      summary,
      transitions
    })
  } catch (error) {
    console.error('[API] Error fetching transitions:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transition data'
    })
  }
})

// GET /api/consultations/analysis/:id - Get detailed analysis for a consultation
router.get('/analysis/:id', async (req, res) => {
  try {
    const { id } = req.params

    const analysis = await consultationService.generateConsultationAnalysis(id)

    res.json({
      success: true,
      analysis
    })
  } catch (error) {
    console.error('[API] Error generating consultation analysis:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate analysis'
    })
  }
})

module.exports = router
