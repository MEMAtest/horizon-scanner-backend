const axios = require('axios')

const DEFAULT_TIMEOUT_MS = 10000

// Block Kit formatting for rich Slack messages
function buildScrapeMonitorBlocks(runId, issues, totals) {
  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🔍 Scrape Monitor Alert',
        emoji: true
      }
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Run ID:*\n${runId}` },
        { type: 'mrkdwn', text: `*Status:*\n${totals.errorSources > 0 ? '🔴 Degraded' : '🟡 Warning'}` },
        { type: 'mrkdwn', text: `*Total Sources:*\n${totals.totalSources}` },
        { type: 'mrkdwn', text: `*New Updates:*\n${totals.newUpdates}` }
      ]
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*✅ Success:*\n${totals.successSources}` },
        { type: 'mrkdwn', text: `*🔧 Fixed:*\n${totals.fixedSources}` },
        { type: 'mrkdwn', text: `*⚠️ Stale:*\n${totals.staleSources}` },
        { type: 'mrkdwn', text: `*❌ Errors:*\n${totals.errorSources}` }
      ]
    },
    { type: 'divider' }
  ]

  if (issues.length > 0) {
    const issueLines = issues.slice(0, 10).map(issue => {
      const icon = issue.issueType === 'error' ? '❌' : '⚠️'
      const fixNote = issue.status === 'fixed' ? ' → Fixed' : ''
      return `${icon} *${issue.sourceName}* (${issue.sourceType}): ${issue.issueDetail || issue.errorMessage || 'Unknown issue'}${fixNote}`
    }).join('\n')

    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*Issues Detected:*\n${issueLines}` }
    })
  }

  blocks.push({
    type: 'context',
    elements: [
      { type: 'mrkdwn', text: `🐤 *RegCanary* | ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC` }
    ]
  })

  return blocks
}

function buildSiteMonitorBlocks(results, summary, runType) {
  const statusIcon = summary.error > 0 ? '🔴' : summary.warn > 0 ? '🟡' : '🟢'

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🌐 Site Monitor Alert',
        emoji: true
      }
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Run Type:*\n${runType}` },
        { type: 'mrkdwn', text: `*Status:*\n${statusIcon} ${summary.error > 0 ? 'Critical' : 'Warning'}` },
        { type: 'mrkdwn', text: `*Total Checks:*\n${summary.total}` },
        { type: 'mrkdwn', text: `*OK:*\n${summary.ok}` }
      ]
    },
    { type: 'divider' }
  ]

  const issues = results.filter(r => r.status !== 'ok')
  if (issues.length > 0) {
    const issueLines = issues.slice(0, 10).map(issue => {
      const icon = issue.status === 'error' ? '❌' : '⚠️'
      const detail = issue.detail ? ` — ${issue.detail}` : ''
      const latency = issue.latencyMs ? ` (${issue.latencyMs}ms)` : ''
      return `${icon} *${issue.name}*: ${issue.status.toUpperCase()}${detail}${latency}`
    }).join('\n')

    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*Issues:*\n${issueLines}` }
    })
  }

  blocks.push({
    type: 'context',
    elements: [
      { type: 'mrkdwn', text: `🐤 *RegCanary* | ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC` }
    ]
  })

  return blocks
}

function buildDailySummaryBlocks(scrapeSummary, siteSummary) {
  const scrapeStatus = (scrapeSummary.errorSources || 0) > 0 ? '🔴' : (scrapeSummary.staleSources || 0) > 0 ? '🟡' : '🟢'
  const siteStatus = (siteSummary.error || 0) > 0 ? '🔴' : (siteSummary.warn || 0) > 0 ? '🟡' : '🟢'
  const overallStatus = scrapeStatus === '🔴' || siteStatus === '🔴' ? '🔴 Issues Detected' :
                        scrapeStatus === '🟡' || siteStatus === '🟡' ? '🟡 Warnings' : '🟢 All Healthy'

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '📊 Daily Health Summary',
        emoji: true
      }
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*Overall Status:* ${overallStatus}` }
    },
    { type: 'divider' },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*🔍 Scrape Monitor* ${scrapeStatus}` },
      fields: [
        { type: 'mrkdwn', text: `*Sources:*\n${scrapeSummary.totalSources || 0}` },
        { type: 'mrkdwn', text: `*Success:*\n${scrapeSummary.successSources || 0}` },
        { type: 'mrkdwn', text: `*Errors:*\n${scrapeSummary.errorSources || 0}` },
        { type: 'mrkdwn', text: `*Stale:*\n${scrapeSummary.staleSources || 0}` }
      ]
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*🌐 Site Monitor* ${siteStatus}` },
      fields: [
        { type: 'mrkdwn', text: `*Checks:*\n${siteSummary.total || 0}` },
        { type: 'mrkdwn', text: `*OK:*\n${siteSummary.ok || 0}` },
        { type: 'mrkdwn', text: `*Warnings:*\n${siteSummary.warn || 0}` },
        { type: 'mrkdwn', text: `*Errors:*\n${siteSummary.error || 0}` }
      ]
    },
    { type: 'divider' },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: '📈 Dashboard', emoji: true },
          url: 'https://horizon-scanner-backend.vercel.app/dashboard'
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: '🔧 Status', emoji: true },
          url: 'https://horizon-scanner-backend.vercel.app/api/status'
        }
      ]
    },
    {
      type: 'context',
      elements: [
        { type: 'mrkdwn', text: `🐤 *RegCanary Daily Summary* | ${new Date().toISOString().slice(0, 10)}` }
      ]
    }
  ]

  return blocks
}

async function sendMessage({ text, blocks } = {}) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL

  if (!webhookUrl) {
    console.warn('Slack notifier: SLACK_WEBHOOK_URL is not configured')
    return { ok: false, error: 'missing_webhook' }
  }

  if (!text && !blocks) {
    return { ok: false, error: 'empty_payload' }
  }

  const payload = {
    text: text || ' ',
    ...(blocks ? { blocks } : {})
  }

  try {
    await axios.post(webhookUrl, payload, { timeout: DEFAULT_TIMEOUT_MS })
    return { ok: true }
  } catch (error) {
    console.error('Slack notifier error:', error.message)
    return { ok: false, error: error.message }
  }
}

module.exports = {
  sendMessage,
  buildScrapeMonitorBlocks,
  buildSiteMonitorBlocks,
  buildDailySummaryBlocks
}
