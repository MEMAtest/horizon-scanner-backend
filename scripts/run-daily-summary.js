#!/usr/bin/env node

const dbService = require('../src/services/dbService')
const siteMonitorService = require('../src/services/siteMonitorService')
const slackNotifier = require('../src/services/slackNotifier')

async function run() {
  console.log('📊 Running daily health summary...')

  // Wait for database to initialize
  await dbService.waitForInitialization()

  // Get scrape monitor summary from database
  const windowHours = Number(process.env.SCRAPE_MONITOR_DAILY_WINDOW_HOURS || 24)
  let scrapeSummary = {
    totalSources: 0,
    successSources: 0,
    errorSources: 0,
    staleSources: 0,
    fixedSources: 0,
    newUpdates: 0
  }

  try {
    const dbSummary = await dbService.getScrapeMonitorSummary({ sinceHours: windowHours })
    if (dbSummary) {
      scrapeSummary = {
        totalSources: dbSummary.checkCount || 0,
        successSources: (dbSummary.checkCount || 0) - (dbSummary.issueCount || 0),
        errorSources: dbSummary.issueTypes?.error || 0,
        staleSources: dbSummary.issueTypes?.stale || 0,
        fixedSources: 0,
        newUpdates: dbSummary.newUpdates || 0
      }
    }
  } catch (error) {
    console.warn('Could not fetch scrape monitor summary:', error.message)
  }

  // Run site monitor checks
  let siteSummary = { total: 0, ok: 0, warn: 0, error: 0 }
  try {
    const siteResult = await siteMonitorService.runChecks()
    siteSummary = {
      total: siteResult.length,
      ok: siteResult.filter(r => r.status === 'ok').length,
      warn: siteResult.filter(r => r.status === 'warn').length,
      error: siteResult.filter(r => r.status === 'error').length
    }
  } catch (error) {
    console.warn('Could not run site monitor checks:', error.message)
  }

  // Send combined summary to Slack
  const blocks = slackNotifier.buildDailySummaryBlocks(scrapeSummary, siteSummary)

  // Build fallback text
  const statusEmoji = scrapeSummary.errorSources > 0 || siteSummary.error > 0 ? '🔴' :
                      scrapeSummary.staleSources > 0 || siteSummary.warn > 0 ? '🟡' : '🟢'
  const text = [
    `${statusEmoji} Daily Health Summary`,
    `Scrape Monitor: ${scrapeSummary.successSources}/${scrapeSummary.totalSources} sources OK`,
    `Site Monitor: ${siteSummary.ok}/${siteSummary.total} checks OK`
  ].join('\n')

  const result = await slackNotifier.sendMessage({ text, blocks })

  if (result.ok) {
    console.log('✅ Daily summary sent to Slack')
  } else {
    console.error('❌ Failed to send daily summary:', result.error)
    process.exit(1)
  }

  console.log('📈 Summary:', {
    scrapeMonitor: scrapeSummary,
    siteMonitor: siteSummary
  })
}

run().catch(error => {
  console.error('Daily summary error:', error)
  process.exit(1)
})
