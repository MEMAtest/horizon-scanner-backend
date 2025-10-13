#!/usr/bin/env node

// Simple smoke test for Smart Briefing pipeline

const smartBriefingService = require('../src/services/smartBriefingService')

async function run() {
  try {
    console.log('🚀 Running Smart Briefing smoke test...')

    const started = await smartBriefingService.startRun({
      include_annotations: true,
      annotation_visibility: ['team', 'all'],
      prompt_version: 'smart-briefing-v1'
    })

    console.log('Queued run:', started.runId)

    // Poll status until completion or failure
    let status
    const startTime = Date.now()
    do {
      await new Promise(resolve => setTimeout(resolve, 1000))
      status = smartBriefingService.getRunStatus(started.runId)
      if (status) {
        process.stdout.write(`\rStatus: ${status.state} ${status.message || ''}`)
      }
      if (Date.now() - startTime > 60_000) {
        throw new Error('Smoke test timed out after 60 seconds')
      }
    } while (status && status.state !== 'completed' && status.state !== 'failed')

    console.log('\n')

    if (!status || status.state !== 'completed') {
      throw new Error(`Smoke test failed: ${status?.error || 'unknown error'}`)
    }

    const briefing = await smartBriefingService.getBriefing(status.briefingId)
    console.log('✅ Briefing generated:')
    console.log(`    Coverage: ${briefing?.dateRange?.start} → ${briefing?.dateRange?.end}`)
    console.log(`    Updates analysed: ${briefing?.metadata?.totals?.currentUpdates}`)
    console.log(`    Tokens used: ${briefing?.metadata?.usage?.totalTokens || 0}`)
    console.log(`    Cache hit: ${status.cacheHit ? 'yes' : 'no'}`)

    const metrics = await smartBriefingService.getMetricsSummary()
    console.log('📊 Metrics summary: ', metrics.totals)
  } catch (error) {
    console.error('❌ Smart Briefing smoke test failed:', error.message)
    process.exitCode = 1
  }
}

run()
