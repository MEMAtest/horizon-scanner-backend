#!/usr/bin/env node

const siteMonitorService = require('../src/services/siteMonitorService')

function parseArgs() {
  const args = new Set(process.argv.slice(2))
  return {
    dryRun: args.has('--dry-run')
  }
}

async function run() {
  const options = parseArgs()
  const result = await siteMonitorService.runMonitor({
    runType: 'manual',
    ...options
  })

  if (!result.success) {
    console.error('Site monitor failed:', result.error)
    process.exit(1)
  }

  console.log('Site monitor completed:', {
    summary: result.summary
  })
}

run().catch((error) => {
  console.error('Site monitor error:', error)
  process.exit(1)
})
