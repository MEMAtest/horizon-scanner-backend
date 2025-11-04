#!/usr/bin/env node

// Test Groq API with fresh generation

const smartBriefingService = require('../src/services/smartBriefingService')

async function run() {
  try {
    console.log('🚀 Testing Groq API with fresh generation...')
    console.log('Using API:', smartBriefingService.useGroq ? 'Groq' : 'OpenRouter')
    console.log('Model:', smartBriefingService.model)

    const started = await smartBriefingService.startRun({
      include_annotations: true,
      annotation_visibility: ['team', 'all'],
      prompt_version: 'smart-briefing-v1',
      force_regenerate: true  // Skip cache
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
      if (Date.now() - startTime > 90_000) {
        throw new Error('Test timed out after 90 seconds')
      }
    } while (status && status.state !== 'completed' && status.state !== 'failed')

    console.log('\n')

    if (!status || status.state !== 'completed') {
      throw new Error(`Test failed: ${status?.error || 'unknown error'}`)
    }

    const briefing = await smartBriefingService.getBriefing(status.briefingId)
    console.log('✅ Briefing generated successfully!')
    console.log(`    ID: ${briefing.id}`)
    console.log(`    Coverage: ${briefing?.dateRange?.start} → ${briefing?.dateRange?.end}`)
    console.log(`    Updates analysed: ${briefing?.metadata?.totals?.currentUpdates}`)
    console.log(`    Tokens used: ${briefing?.metadata?.usage?.totalTokens || 0}`)
    console.log(`    Model: ${briefing?.metadata?.usage?.requests?.[0]?.model || 'fallback'}`)
    console.log(`    Cache hit: ${status.cacheHit ? 'yes' : 'no'}`)

    // Check if narrative was generated
    const hasRealNarrative = briefing.artifacts?.narrative &&
      briefing.artifacts.narrative.length > 500 &&
      !briefing.artifacts.narrative.includes('Week&rsquo;s Story')  // Fallback template marker

    if (hasRealNarrative) {
      console.log('\n✅ AI-generated narrative confirmed (not template)')
      console.log('Sample:', briefing.artifacts.narrative.substring(0, 200) + '...')
    } else {
      console.log('\n⚠️  Using fallback template (API may have failed)')
    }

    const metrics = await smartBriefingService.getMetricsSummary()
    console.log('\n📊 Metrics summary:', metrics.totals)
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exitCode = 1
  }
}

run()
