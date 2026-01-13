#!/usr/bin/env node

// CLI entry point for the maintenance agent
// Runs AI-powered analysis and sends daily maintenance report

const maintenanceAgent = require('../src/services/maintenanceAgentService')
const { sendMaintenanceReport } = require('../src/services/maintenanceEmailService')

function parseArgs() {
  const args = new Set(process.argv.slice(2))
  return {
    dryRun: args.has('--dry-run'),
    skipEmail: args.has('--skip-email'),
    sinceHours: parseInt(process.argv.find(a => a.startsWith('--since='))?.split('=')[1] || '24', 10)
  }
}

async function run() {
  const options = parseArgs()

  console.log('🔧 Starting RegCanary Maintenance Agent...')
  console.log(`   Since: ${options.sinceHours} hours`)
  console.log(`   Dry run: ${options.dryRun}`)
  console.log(`   Skip email: ${options.skipEmail}`)

  // Run maintenance analysis
  const result = await maintenanceAgent.runMaintenance({
    sinceHours: options.sinceHours
  })

  if (!result.success) {
    console.error('❌ Maintenance agent failed:', result.error)
    process.exit(1)
  }

  console.log('\n📊 Maintenance Results:')
  console.log(`   Health Score: ${result.summary?.healthScore || 100}%`)
  console.log(`   Analyzed: ${result.results.analyzed}`)
  console.log(`   Auto-fixed: ${result.results.autoFixed}`)
  console.log(`   Needs human: ${result.results.needsHuman}`)
  console.log(`   Duration: ${(result.durationMs / 1000).toFixed(1)}s`)

  // Send email report
  if (!options.skipEmail && !options.dryRun) {
    console.log('\n📧 Sending maintenance report...')
    const emailResult = await sendMaintenanceReport(result)

    if (emailResult.sent) {
      console.log(`✅ Report sent to ${emailResult.recipients.length} recipient(s)`)
    } else {
      console.log(`⚠️ Email not sent: ${emailResult.reason || emailResult.error}`)
    }
  } else {
    console.log('\n⏭️ Skipping email (dry run or --skip-email)')
  }

  console.log('\n✅ Maintenance agent completed successfully')
}

run().catch(error => {
  console.error('Maintenance agent error:', error)
  process.exit(1)
})
