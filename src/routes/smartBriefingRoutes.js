// Smart Briefing API Routes

const express = require('express')
const router = express.Router()

const smartBriefingService = require('../services/smartBriefingService')
const {
  buildExecutiveOnePager,
  buildInitialNarrativeHtml,
  buildInitialUpdatesHtml
} = require('../views/weeklyBriefing/builders')

// Trigger a manual run of the weekly Smart Briefing pipeline (synchronous)
// On Vercel serverless, in-memory status polling across lambdas fails (404).
// Instead, start the run and poll status within the same request lifecycle.
router.post('/weekly-briefings/run', async (req, res) => {
  const startTime = Date.now()
  try {
    const status = await smartBriefingService.startRun(req.body || {})
    const runId = status.runId

    // Poll within the same lambda — same pattern as api/cron/smart-briefing.js
    const maxWait = 110000 // 110s (leave buffer for 120s function timeout)
    const pollInterval = 2000
    let elapsed = 0

    while (elapsed < maxWait) {
      const currentStatus = smartBriefingService.getRunStatus(runId)
      if (!currentStatus) break

      if (currentStatus.state === 'completed') {
        const duration = Date.now() - startTime
        console.log(`[SmartBriefing] Manual run completed in ${duration}ms (briefingId: ${currentStatus.briefingId})`)
        return res.json({
          success: true,
          briefingId: currentStatus.briefingId,
          cacheHit: currentStatus.cacheHit || false,
          durationMs: duration
        })
      }

      if (currentStatus.state === 'failed') {
        const duration = Date.now() - startTime
        console.error(`[SmartBriefing] Manual run failed: ${currentStatus.error}`)
        return res.status(500).json({
          success: false,
          error: currentStatus.error,
          durationMs: duration
        })
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval))
      elapsed += pollInterval
    }

    // Timed out — briefing may still complete in the background
    const duration = Date.now() - startTime
    const finalStatus = smartBriefingService.getRunStatus(runId)
    console.log(`[SmartBriefing] Manual run timed out after ${duration}ms (state: ${finalStatus?.state})`)
    return res.status(504).json({
      success: false,
      timedOut: true,
      message: 'Briefing generation is taking longer than expected. It may appear on your next page load.',
      durationMs: duration
    })
  } catch (error) {
    console.error('SmartBriefing run trigger failed:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Retrieve the latest published briefing
router.get('/weekly-briefings/latest', async (req, res) => {
  try {
    console.log('[SmartBriefing] Fetching latest briefing...')
    const briefing = await smartBriefingService.getLatestBriefing()
    if (!briefing) {
      console.log('[SmartBriefing] No briefings found in storage')
      return res.status(404).json({
        success: false,
        error: 'No briefings available',
        message: 'Please generate a briefing using the "Assemble This Week" button'
      })
    }

    console.log('[SmartBriefing] Latest briefing found:', briefing.id)
    res.json({ success: true, briefing })
  } catch (error) {
    console.error('[SmartBriefing] Latest retrieval failed:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// List recent briefings (metadata only)
router.get('/weekly-briefings', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50)
    const briefings = await smartBriefingService.listBriefings(limit)
    res.json({ success: true, briefings })
  } catch (error) {
    console.error('SmartBriefing listing failed:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Metrics summary for instrumentation dashboard
router.get('/weekly-briefings/metrics', async (req, res) => {
  try {
    const metrics = await smartBriefingService.getMetricsSummary()
    res.json({ success: true, metrics })
  } catch (error) {
    console.error('SmartBriefing metrics retrieval failed:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Fetch a specific briefing bundle
router.get('/weekly-briefings/:briefingId', async (req, res) => {
  try {
    const briefing = await smartBriefingService.getBriefing(req.params.briefingId)
    if (!briefing) {
      return res.status(404).json({ success: false, error: 'Briefing not found' })
    }

    res.json({ success: true, briefing })
  } catch (error) {
    console.error('SmartBriefing retrieval failed:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Get current briefing content for modal display (pre-rendered HTML)
router.get('/weekly-briefing/current', async (req, res) => {
  try {
    console.log('[SmartBriefing] Fetching current briefing for modal...')
    const briefing = await smartBriefingService.getLatestBriefing()

    if (!briefing) {
      return res.status(404).json({
        success: false,
        error: 'No briefings available',
        executive: null,
        narrative: null,
        updates: null
      })
    }

    // Build the HTML content for each section
    const executive = buildExecutiveOnePager(briefing)
    const narrative = buildInitialNarrativeHtml(briefing)
    const updates = buildInitialUpdatesHtml(briefing)

    res.json({
      success: true,
      executive,
      narrative,
      updates
    })
  } catch (error) {
    console.error('[SmartBriefing] Modal content retrieval failed:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      executive: null,
      narrative: null,
      updates: null
    })
  }
})

module.exports = router
