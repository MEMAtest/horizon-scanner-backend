#!/usr/bin/env node

const scrapeMonitorService = require('../src/services/scrapeMonitorService')

function parseArgs() {
  const args = new Set(process.argv.slice(2))
  return {
    dryRun: args.has('--dry-run'),
    fastMode: args.has('--fast'),
    fixIssues: !args.has('--no-fix')
  }
}

async function run() {
  const options = parseArgs()
  const result = await scrapeMonitorService.runMonitor({
    runType: 'manual',
    ...options
  })

  if (!result.success) {
    console.error('Scrape monitor failed:', result.error)
    process.exit(1)
  }

  console.log('Scrape monitor completed:', {
    runId: result.runId,
    totals: result.totals,
    issues: result.issues.length
  })
}

run().catch(error => {
  console.error('Scrape monitor error:', error)
  process.exit(1)
})
