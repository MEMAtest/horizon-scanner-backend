const fs = require('fs')
const path = require('path')
const cron = require('node-cron')
const axios = require('axios')

const slackNotifier = require('./slackNotifier')

const DEFAULT_TIMEOUT_MS = 15000
const DEFAULT_MAX_AGE_HOURS = 36
const DEFAULT_TARGETS_FILE = path.join(__dirname, '../../config/site-monitor.targets.json')
const DEFAULT_USER_AGENT = 'RegCanary-SiteMonitor/1.0'

function toSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value)
  } catch (error) {
    console.warn('Site monitor: failed to parse JSON targets:', error.message)
    return null
  }
}

function loadTargetsFromFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return []
  const raw = fs.readFileSync(filePath, 'utf8')
  const parsed = safeJsonParse(raw)
  return Array.isArray(parsed) ? parsed : []
}

function parseExtraUrls(rawUrls) {
  if (!rawUrls) return []
  const entries = rawUrls
    .split(/[\n,]/)
    .map((value) => value.trim())
    .filter(Boolean)

  return entries.map((entry) => {
    const [namePart, urlPart] = entry.includes('|') ? entry.split('|') : [null, entry]
    const url = (urlPart || '').trim()
    const name = (namePart || url).trim()
    return {
      id: toSlug(name),
      name,
      type: 'http',
      url
    }
  })
}

function normalizeTargets(targets) {
  const seen = new Set()
  return targets
    .map((target) => {
      if (!target || typeof target !== 'object') return null
      const name = target.name || target.id || target.url || target.baseUrl || 'site'
      const id = target.id || toSlug(name)
      return { ...target, id, name }
    })
    .filter((target) => target && target.id && !seen.has(target.id) && (seen.add(target.id) || true))
}

function loadTargets() {
  const envTargets = process.env.SITE_MONITOR_TARGETS_JSON
  const envFile = process.env.SITE_MONITOR_TARGETS_FILE
  let targets = []

  if (envTargets) {
    const parsed = safeJsonParse(envTargets)
    if (Array.isArray(parsed)) {
      targets = parsed
    }
  } else if (envFile) {
    targets = loadTargetsFromFile(envFile)
  } else {
    targets = loadTargetsFromFile(DEFAULT_TARGETS_FILE)
  }

  const extra = parseExtraUrls(process.env.SITE_MONITOR_URLS)
  return normalizeTargets([...targets, ...extra])
}

function getJsonValue(payload, pathValue) {
  if (!payload || !pathValue) return undefined
  return pathValue.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), payload)
}

async function checkHttpTarget(target) {
  const timeoutMs = target.timeoutMs || DEFAULT_TIMEOUT_MS
  const response = await axios.get(target.url, {
    timeout: timeoutMs,
    validateStatus: () => true,
    headers: {
      'User-Agent': DEFAULT_USER_AGENT,
      ...(target.headers || {})
    }
  })

  const expectedStatus = target.expectStatus
  const okStatus = expectedStatus
    ? response.status === expectedStatus
    : response.status >= 200 && response.status < 400

  if (!okStatus) {
    return {
      status: 'error',
      detail: `HTTP ${response.status}`
    }
  }

  if (target.expectBodyIncludes) {
    const body = typeof response.data === 'string' ? response.data : JSON.stringify(response.data || '')
    if (!body.includes(target.expectBodyIncludes)) {
      return {
        status: 'error',
        detail: 'Expected content not found'
      }
    }
  }

  return { status: 'ok' }
}

async function checkHorizonStatus(target) {
  const timeoutMs = target.timeoutMs || DEFAULT_TIMEOUT_MS
  const response = await axios.get(target.url, {
    timeout: timeoutMs,
    validateStatus: () => true,
    headers: { 'User-Agent': DEFAULT_USER_AGENT }
  })

  if (response.status < 200 || response.status >= 400) {
    return { status: 'error', detail: `HTTP ${response.status}` }
  }

  const overallStatus = getJsonValue(response.data, 'overall.status')
  if (overallStatus === 'healthy') {
    return { status: 'ok', detail: 'healthy' }
  }
  if (overallStatus === 'degraded') {
    return { status: 'warn', detail: 'degraded' }
  }
  return { status: 'error', detail: overallStatus ? `status ${overallStatus}` : 'missing status' }
}

async function checkFcaFinesApi(target) {
  const timeoutMs = target.timeoutMs || DEFAULT_TIMEOUT_MS
  const baseUrl = target.baseUrl || target.url
  const year = target.year || new Date().getFullYear()
  const url = `${baseUrl.replace(/\/$/, '')}/api/fca-fines/list?year=${year}&limit=1`

  const response = await axios.get(url, {
    timeout: timeoutMs,
    validateStatus: () => true,
    headers: { 'User-Agent': DEFAULT_USER_AGENT }
  })

  if (response.status < 200 || response.status >= 400) {
    return { status: 'error', detail: `HTTP ${response.status}` }
  }

  const rows = response.data && Array.isArray(response.data.data) ? response.data.data : null
  if (!rows) {
    return { status: 'error', detail: 'Unexpected API response' }
  }
  if (rows.length === 0) {
    return { status: 'warn', detail: `No fines returned for ${year}` }
  }

  const latest = rows[0]
  const issued = latest?.date_issued ? new Date(latest.date_issued).toISOString().slice(0, 10) : 'unknown date'
  return { status: 'ok', detail: `Latest fine ${issued}` }
}

async function checkGithubWorkflow(target) {
  const token = process.env.SITE_MONITOR_GITHUB_TOKEN || process.env.GITHUB_TOKEN
  if (!token) {
    return { status: 'warn', detail: 'Missing GitHub token' }
  }

  const timeoutMs = target.timeoutMs || DEFAULT_TIMEOUT_MS
  const repo = target.repo
  const workflow = target.workflow
  const maxAgeHours = target.maxAgeHours || DEFAULT_MAX_AGE_HOURS
  const url = `https://api.github.com/repos/${repo}/actions/workflows/${workflow}/runs?per_page=1`

  const response = await axios.get(url, {
    timeout: timeoutMs,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': DEFAULT_USER_AGENT
    },
    validateStatus: () => true
  })

  if (response.status < 200 || response.status >= 400) {
    return { status: 'error', detail: `GitHub API HTTP ${response.status}` }
  }

  const run = response.data && Array.isArray(response.data.workflow_runs) ? response.data.workflow_runs[0] : null
  if (!run) {
    return { status: 'error', detail: 'No workflow runs found' }
  }

  const startedAt = run.run_started_at || run.created_at
  const ageHours = startedAt ? (Date.now() - new Date(startedAt).getTime()) / (1000 * 60 * 60) : null
  const ageSummary = ageHours != null ? `${ageHours.toFixed(1)}h ago` : 'age unknown'
  const conclusion = run.conclusion || 'in_progress'

  if (run.status === 'in_progress') {
    if (ageHours != null && ageHours > maxAgeHours) {
      return { status: 'warn', detail: `Run in progress (${ageSummary})` }
    }
    return { status: 'ok', detail: `Run in progress (${ageSummary})` }
  }

  if (conclusion === 'success') {
    if (ageHours != null && ageHours > maxAgeHours) {
      return { status: 'warn', detail: `Last run ${ageSummary}` }
    }
    return { status: 'ok', detail: `Last run ${ageSummary}` }
  }

  return { status: 'error', detail: `Last run ${conclusion}` }
}

async function runCheck(target) {
  const startedAt = Date.now()
  try {
    let result
    switch (target.type) {
      case 'http':
        result = await checkHttpTarget(target)
        break
      case 'horizon-status':
        result = await checkHorizonStatus(target)
        break
      case 'fca-fines-api':
        result = await checkFcaFinesApi(target)
        break
      case 'github-workflow':
        result = await checkGithubWorkflow(target)
        break
      default:
        result = { status: 'warn', detail: `Unknown type "${target.type}"` }
    }

    return {
      id: target.id,
      name: target.name,
      status: result.status,
      detail: result.detail || null,
      latencyMs: Date.now() - startedAt
    }
  } catch (error) {
    return {
      id: target.id,
      name: target.name,
      status: 'error',
      detail: error.message,
      latencyMs: Date.now() - startedAt
    }
  }
}

function summarizeResults(results) {
  const summary = {
    total: results.length,
    ok: 0,
    warn: 0,
    error: 0
  }

  results.forEach((result) => {
    if (result.status === 'ok') summary.ok += 1
    else if (result.status === 'warn') summary.warn += 1
    else summary.error += 1
  })

  return summary
}

function buildIssueMessage(results, summary, runType) {
  const issues = results.filter((result) => result.status !== 'ok')
  const lines = issues.slice(0, 8).map((result) => {
    const detail = result.detail ? ` (${result.detail})` : ''
    return `- ${result.name}: ${result.status.toUpperCase()}${detail}`
  })

  return [
    `Site monitor issues detected (${runType})`,
    `Checks: ${summary.total} | OK: ${summary.ok} | Warn: ${summary.warn} | Error: ${summary.error}`,
    lines.join('\n')
  ].filter(Boolean).join('\n')
}

function buildSummaryMessage(results, summary, windowHours) {
  const issues = results.filter((result) => result.status !== 'ok')
  const lines = issues.slice(0, 8).map((result) => {
    const detail = result.detail ? ` (${result.detail})` : ''
    return `- ${result.name}: ${result.status.toUpperCase()}${detail}`
  })

  return [
    `Daily site monitor summary (last ${windowHours}h)`,
    `Checks: ${summary.total} | OK: ${summary.ok} | Warn: ${summary.warn} | Error: ${summary.error}`,
    lines.length ? lines.join('\n') : 'No issues detected.'
  ].join('\n')
}

class SiteMonitorService {
  constructor() {
    this.isRunning = false
    this.monitorTask = null
    this.dailyTask = null
    this.lastAlertAt = null
  }

  schedule() {
    if (this.monitorTask || this.dailyTask) {
      return { scheduled: true }
    }

    if (process.env.ENABLE_SITE_MONITOR !== 'true') {
      console.log('SiteMonitor: scheduling disabled (set ENABLE_SITE_MONITOR=true to activate)')
      return { scheduled: false }
    }

    const monitorCron = process.env.SITE_MONITOR_CRON || '*/30 * * * *'
    const dailyCron = process.env.SITE_MONITOR_DAILY_CRON || '0 8 * * *'
    const timezone = process.env.SITE_MONITOR_TIMEZONE || 'Europe/London'

    this.monitorTask = cron.schedule(monitorCron, () => {
      this.runMonitor({ runType: 'scheduled' }).catch((error) => {
        console.error('SiteMonitor: scheduled run failed', error)
      })
    }, { timezone })

    this.dailyTask = cron.schedule(dailyCron, () => {
      this.runDailySummary().catch((error) => {
        console.error('SiteMonitor: daily summary failed', error)
      })
    }, { timezone })

    console.log(`SiteMonitor: scheduled monitor "${monitorCron}" and daily "${dailyCron}" (${timezone})`)
    return { scheduled: true }
  }

  async runChecks() {
    const targets = loadTargets()
    const results = []

    for (const target of targets) {
      if (!target.url && !target.baseUrl && target.type !== 'github-workflow') {
        results.push({
          id: target.id,
          name: target.name,
          status: 'warn',
          detail: 'Missing URL'
        })
        continue
      }
      results.push(await runCheck(target))
    }

    return results
  }

  shouldSendAlert() {
    const cooldownMinutes = Number(process.env.SITE_MONITOR_ALERT_COOLDOWN_MINUTES || 0)
    if (!cooldownMinutes) return true
    if (!this.lastAlertAt) return true
    const elapsedMs = Date.now() - this.lastAlertAt
    return elapsedMs >= cooldownMinutes * 60 * 1000
  }

  async runMonitor(options = {}) {
    if (this.isRunning) {
      return { success: false, error: 'Site monitor already running' }
    }

    this.isRunning = true
    const runType = options.runType || 'scheduled'
    const dryRun = options.dryRun || process.env.SITE_MONITOR_DRY_RUN === 'true'

    try {
      const results = await this.runChecks()
      const summary = summarizeResults(results)
      const issues = results.filter((result) => result.status !== 'ok')

      if (!dryRun && issues.length > 0 && this.shouldSendAlert()) {
        await slackNotifier.sendMessage({
          text: buildIssueMessage(results, summary, runType),
          blocks: slackNotifier.buildSiteMonitorBlocks(results, summary, runType)
        })
        this.lastAlertAt = Date.now()
      }

      return { success: true, summary, results }
    } finally {
      this.isRunning = false
    }
  }

  async runDailySummary() {
    const windowHours = Number(process.env.SITE_MONITOR_DAILY_WINDOW_HOURS || 24)
    const results = await this.runChecks()
    const summary = summarizeResults(results)

    await slackNotifier.sendMessage({
      text: buildSummaryMessage(results, summary, windowHours)
    })

    return { summary, results }
  }
}

module.exports = new SiteMonitorService()
