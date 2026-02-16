// api/cron/smart-briefing.js
// Serverless trigger for weekly smart briefing generation.
// Generates the narrative briefing displayed on the Weekly Roundup page.

const smartBriefingService = require('../../src/services/smartBriefingService')

module.exports = async (req, res) => {
  const startTime = Date.now()

  // Vercel Cron uses GET, manual triggers use POST - accept both
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).json({ success: false, error: 'Method Not Allowed' })
  }

  // Auth check for non-Vercel cron requests
  const authHeader = req.headers.authorization
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  // Check for AI API key availability
  if (!process.env.OPENROUTER_API_KEY && !process.env.GROQ_API_KEY) {
    return res.status(200).json({
      success: false,
      skipped: true,
      reason: 'No AI API key configured (set OPENROUTER_API_KEY or GROQ_API_KEY)'
    })
  }

  try {
    console.log('📝 Smart Briefing: Starting weekly briefing generation...')

    // Start the run and await processing directly (not via setImmediate)
    // so it completes within the serverless function lifecycle
    const status = await smartBriefingService.startRun({ force: false })
    const runId = status.runId

    // Wait for processing to complete (startRun uses setImmediate internally,
    // so we poll the status until it's done or we hit timeout)
    const maxWait = 110000 // 110 seconds (leave buffer for 120s function timeout)
    const pollInterval = 2000
    let elapsed = 0

    while (elapsed < maxWait) {
      const currentStatus = smartBriefingService.getRunStatus(runId)
      if (!currentStatus) break

      if (currentStatus.state === 'completed') {
        const duration = Date.now() - startTime
        console.log(`✅ Smart Briefing: Completed in ${duration}ms (briefingId: ${currentStatus.briefingId})`)
        return res.status(200).json({
          success: true,
          completedAt: new Date().toISOString(),
          durationMs: duration,
          briefingId: currentStatus.briefingId,
          cacheHit: currentStatus.cacheHit || false
        })
      }

      if (currentStatus.state === 'failed') {
        const duration = Date.now() - startTime
        console.error(`❌ Smart Briefing: Failed - ${currentStatus.error}`)
        return res.status(500).json({
          success: false,
          error: currentStatus.error,
          durationMs: duration
        })
      }

      // Still processing, wait and poll again
      await new Promise(resolve => setTimeout(resolve, pollInterval))
      elapsed += pollInterval
    }

    // Timed out waiting
    const duration = Date.now() - startTime
    const finalStatus = smartBriefingService.getRunStatus(runId)
    console.log(`⏱️ Smart Briefing: Timed out after ${duration}ms (state: ${finalStatus?.state})`)

    return res.status(200).json({
      success: false,
      timedOut: true,
      runId,
      lastState: finalStatus?.state,
      message: 'Briefing generation still in progress - will be available on next page load',
      durationMs: duration
    })
  } catch (error) {
    console.error('❌ Smart Briefing cron failed:', error.message)
    return res.status(500).json({
      success: false,
      error: error.message,
      durationMs: Date.now() - startTime
    })
  }
}
