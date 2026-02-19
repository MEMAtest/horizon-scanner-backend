const cron = require('node-cron')

const dbService = require('./dbService')
const rssFetcher = require('./rssFetcher')
const slackNotifier = require('./slackNotifier')
const puppeteerScraper = require('../scrapers/puppeteerScraper')

const DAY_MS = 24 * 60 * 60 * 1000
const DEFAULT_RECENCY_DAYS = 30

function formatFixActions(actions = []) {
  if (!actions.length) return ''
  return actions.map(action => {
    const base = action.method || action.step || 'fix'
    const detailParts = []
    if (action.timeoutMs) detailParts.push(`${action.timeoutMs}ms`)
    if (action.fetched != null) detailParts.push(`fetched:${action.fetched}`)
    const label = detailParts.length ? `${base}(${detailParts.join(',')})` : base
    const outcome = action.success ? 'ok' : 'fail'
    const detail = action.error ? ` (${action.error})` : ''
    return `${label}:${outcome}${detail}`
  }).join(', ')
}

function formatIssueDetail(check) {
  if (check.issueDetail) return check.issueDetail
  if (check.errorMessage) return check.errorMessage
  return 'Issue detected'
}

// Classify error messages into categories for the maintenance agent
function classifyError(errorMessage, httpStatusCode) {
  if (!errorMessage) return { category: 'unknown', autoFixable: false }

  const message = errorMessage.toLowerCase()

  // Timeout errors - auto-fixable with longer timeout
  if (message.includes('timeout') || message.includes('etimedout') || message.includes('timed out')) {
    return { category: 'timeout', autoFixable: true }
  }

  // Connection errors - auto-fixable with retry
  if (message.includes('econnreset') || message.includes('econnrefused') ||
      message.includes('connection reset') || message.includes('socket hang up')) {
    return { category: 'connection', autoFixable: true }
  }

  // Rate limiting - auto-fixable with backoff
  if (httpStatusCode === 429 || message.includes('rate limit') || message.includes('too many requests')) {
    return { category: 'rate_limit', autoFixable: true }
  }

  // SSL/TLS errors - may be auto-fixable
  if (message.includes('ssl') || message.includes('certificate') || message.includes('tls') ||
      message.includes('unable to verify')) {
    return { category: 'ssl', autoFixable: true }
  }

  // DNS errors - usually temporary
  if (message.includes('enotfound') || message.includes('getaddrinfo') || message.includes('dns')) {
    return { category: 'dns', autoFixable: false }
  }

  // Auth/forbidden - needs human
  if (httpStatusCode === 401 || httpStatusCode === 403 ||
      message.includes('unauthorized') || message.includes('forbidden') || message.includes('access denied')) {
    return { category: 'auth', autoFixable: false }
  }

  // Site down - temporary, skip
  if (httpStatusCode >= 500 || message.includes('502') || message.includes('503') ||
      message.includes('service unavailable') || message.includes('internal server error')) {
    return { category: 'site_down', autoFixable: false }
  }

  // Selector/parsing errors - needs AI analysis
  if (message.includes('selector') || message.includes('not found') ||
      message.includes('no elements') || message.includes('parsing') ||
      message.includes('cannot read') || message.includes('undefined')) {
    return { category: 'selector', autoFixable: false }
  }

  // Missing result (skipped in fast mode)
  if (message.includes('missing source result')) {
    return { category: 'skipped', autoFixable: false }
  }

  return { category: 'unknown', autoFixable: false }
}

// Extract HTTP status code from error message if present
function extractHttpStatusCode(errorMessage) {
  if (!errorMessage) return null
  const match = errorMessage.match(/\b(4\d{2}|5\d{2})\b/)
  return match ? parseInt(match[1], 10) : null
}

class ScrapeMonitorService {
  constructor() {
    this.isRunning = false
    this.monitorTask = null
    this.dailyTask = null
  }

  schedule() {
    if (this.monitorTask || this.dailyTask) {
      return { scheduled: true }
    }

    if (process.env.ENABLE_SCRAPE_MONITOR !== 'true') {
      console.log('ScrapeMonitor: scheduling disabled (set ENABLE_SCRAPE_MONITOR=true to activate)')
      return { scheduled: false }
    }

    const monitorCron = process.env.SCRAPE_MONITOR_CRON || '0 */6 * * *'
    const dailyCron = process.env.SCRAPE_MONITOR_DAILY_CRON || '0 8 * * *'
    const timezone = process.env.SCRAPE_MONITOR_TIMEZONE || 'Europe/London'

    this.monitorTask = cron.schedule(monitorCron, () => {
      this.runMonitor({ runType: 'scheduled' }).catch(error => {
        console.error('ScrapeMonitor: scheduled run failed', error)
      })
    }, { timezone })

    this.dailyTask = cron.schedule(dailyCron, () => {
      this.runDailySummary().catch(error => {
        console.error('ScrapeMonitor: daily summary failed', error)
      })
    }, { timezone })

    console.log(`ScrapeMonitor: scheduled monitor "${monitorCron}" and daily "${dailyCron}" (${timezone})`)
    return { scheduled: true }
  }

  getMonitorSources(options = {}) {
    const categoryFilter = Array.isArray(options.sourceCategories)
      ? options.sourceCategories
      : options.sourceCategory
        ? [options.sourceCategory]
        : null
    const normalizedCategoryFilter = categoryFilter
      ? new Set(categoryFilter.map(value => String(value || '').trim()).filter(Boolean))
      : null

    return rssFetcher.feedSources
      .filter(source => {
        if (source.priority === 'disabled') return false
        if (normalizedCategoryFilter && normalizedCategoryFilter.size > 0) {
          const sourceCategoryValue = source.source_category || source.sourceCategory || ''
          if (!normalizedCategoryFilter.has(String(sourceCategoryValue).trim())) {
            return false
          }
        }
        if (options.fastMode) {
          // Match the orchestrator's fast-mode filtering logic:
          // skip puppeteer and non-critical/high priority web scrapers
          if (source.type === 'puppeteer') return false
          if (source.type === 'web_scraping' &&
              source.priority !== 'critical' && source.priority !== 'high') {
            return false
          }
          if (source.priority !== 'critical' && source.priority !== 'high') return false
        }
        return true
      })
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
        const aRank = priorityOrder[a.priority] ?? 9
        const bRank = priorityOrder[b.priority] ?? 9
        return aRank - bRank
      })
  }

  async runMonitor(options = {}) {
    if (this.isRunning) {
      return { success: false, error: 'Scrape monitor already running' }
    }

    this.isRunning = true
    const startedAt = new Date()
    const runType = options.runType || 'scheduled'
    const fastMode = options.fastMode || process.env.SCRAPE_MONITOR_FAST_MODE === 'true'
    const dryRun = options.dryRun || process.env.SCRAPE_MONITOR_DRY_RUN === 'true'
    const fixIssues = options.fixIssues !== false

    try {
      await dbService.waitForInitialization()

      const runId = await dbService.createScrapeMonitorRun({
        runType,
        startedAt,
        status: 'running',
        metadata: {
          fastMode,
          dryRun,
          fixIssues,
          sourceCategory: options.sourceCategory || null,
          sourceCategories: options.sourceCategories || null
        }
      })

      const sources = this.getMonitorSources({ ...options, fastMode })
      const lastSuccessMap = await dbService.getScrapeMonitorLastSuccessTimes()
      const sourceResults = new Map()
      const issues = []

      let fetchResults

      try {
        fetchResults = await rssFetcher.fetchAllFeeds({
          fastMode,
          sourceCategory: options.sourceCategory,
          sourceCategories: options.sourceCategories,
          throwOnError: true,
          dryRun,
          onSourceComplete: (result) => {
            if (result && result.name) {
              sourceResults.set(result.name, result)
            }
          }
        })
      } catch (error) {
        await dbService.finishScrapeMonitorRun(runId, {
          status: 'error',
          completedAt: new Date(),
          durationMs: Date.now() - startedAt.getTime(),
          totals: {}
        })
        await slackNotifier.sendMessage({
          text: `Scrape monitor failed to run: ${error.message}`
        })
        return { success: false, error: error.message }
      }

      const checks = []
      let fixSavedTotal = 0

      for (const source of sources) {
      const result = sourceResults.get(source.name) || {
        name: source.name,
        authority: source.authority,
        type: source.type,
        priority: source.priority,
        fetched: 0,
        saved: 0,
        status: fastMode ? 'skipped' : 'error',
        error: fastMode ? 'Skipped in fast mode' : 'Missing source result'
      }

      const initialStatus = result.status || 'error'
      let status = initialStatus
      let issueType = null
      let issueDetail = null
      let errorMessage = result.error || null
      let fixActions = []
      let fetchedCount = result.fetched || 0
      let savedCount = result.saved || 0
      let durationMs = result.durationMs || 0

      if (initialStatus === 'error') {
        issueType = 'error'
        issueDetail = result.error || 'Error during scrape'
      } else if (initialStatus === 'no_updates') {
        const lastSuccessAt = lastSuccessMap[source.name]
        const recencyDays = source.recencyDays || DEFAULT_RECENCY_DAYS
        if (lastSuccessAt) {
          const ageDays = Math.floor((Date.now() - new Date(lastSuccessAt).getTime()) / DAY_MS)
          if (ageDays > recencyDays) {
            issueType = 'stale'
            issueDetail = `No successful scrape in ${ageDays}d (threshold ${recencyDays}d)`
          }
        }
      }

      if (issueType === 'stale') {
        status = 'stale'
      }

      if (issueType && fixIssues) {
        const fixResult = await this.attemptFix(source, { dryRun })
        fixActions = fixResult.actions
        durationMs += fixResult.durationMs
        if (fixResult.status === 'fixed') {
          status = 'fixed'
          fetchedCount = fixResult.fetched
          savedCount += fixResult.saved
          fixSavedTotal += fixResult.saved
          errorMessage = fixResult.error || errorMessage
        } else if (issueType === 'error') {
          status = 'error'
        }
      }

      // Classify the error for maintenance agent
      const httpStatusCode = extractHttpStatusCode(errorMessage)
      const errorClassification = errorMessage ? classifyError(errorMessage, httpStatusCode) : null

      const check = {
        sourceName: source.name,
        authority: source.authority,
        sourceType: source.type,
        priority: source.priority,
        initialStatus,
        status,
        issueType,
        issueDetail,
        fetchedCount,
        savedCount,
        errorMessage,
        durationMs,
        fixActions,
        // Error classification for maintenance agent
        errorCategory: errorClassification?.category || null,
        httpStatusCode: httpStatusCode
      }

        try {
          await dbService.recordScrapeMonitorCheck(runId, check)
        } catch (error) {
          console.error('Scrape monitor: failed to record check', error.message)
        }
      checks.push(check)

      if (issueType) {
        issues.push(check)
      }
    }

      const totals = this.summarizeChecks(checks, fetchResults, fixSavedTotal)
      const runStatus = totals.errorSources > 0 || totals.staleSources > 0 ? 'degraded' : 'success'

      await dbService.finishScrapeMonitorRun(runId, {
        status: runStatus,
        completedAt: new Date(),
        durationMs: Date.now() - startedAt.getTime(),
        totals,
        metadata: {
          ...totals,
          issues: issues.length
        }
      })

      if (issues.length > 0) {
        await slackNotifier.sendMessage({
          text: this.buildIssueMessage(runId, issues, totals),
          blocks: slackNotifier.buildScrapeMonitorBlocks(runId, issues, totals)
        })
      }

      return {
        success: true,
        runId,
        totals,
        issues
      }
    } finally {
      this.isRunning = false
    }
  }

  summarizeChecks(checks, fetchResults, fixSavedTotal) {
    const successSources = checks.filter(check => check.status === 'success' || check.status === 'fixed').length
    const fixedSources = checks.filter(check => check.status === 'fixed').length
    const noUpdateSources = checks.filter(check => check.status === 'no_updates').length
    const staleSources = checks.filter(check => check.status === 'stale').length
    const errorSources = checks.filter(check => check.status === 'error').length

    return {
      totalSources: checks.length,
      successSources,
      fixedSources,
      noUpdateSources,
      staleSources,
      errorSources,
      newUpdates: (fetchResults?.newUpdates || 0) + fixSavedTotal,
      totalProcessed: fetchResults?.total || 0
    }
  }

  buildIssueMessage(runId, issues, totals) {
    const lines = issues.slice(0, 8).map(check => {
      const fixSummary = formatFixActions(check.fixActions)
      const fixNote = fixSummary ? ` Fix: ${fixSummary}.` : ''
      return `- ${check.sourceName} (${check.sourceType}) ${check.issueType}: ${formatIssueDetail(check)}. Outcome: ${check.status}.${fixNote}`
    })

    const header = [
      `Scrape monitor issues detected (run ${runId})`,
      `Sources: ${totals.totalSources} | Errors: ${totals.errorSources} | Stale: ${totals.staleSources} | Fixed: ${totals.fixedSources}`
    ].join('\n')

    return `${header}\n${lines.join('\n')}`
  }

  async attemptFix(source, options = {}) {
    const actions = []
    const startedAt = Date.now()
    let updates = []
    let saved = 0
    let error = null

    const recordAction = (action) => {
      actions.push(action)
    }

    const runStep = async (action, fetchFn) => {
      const stepStart = Date.now()
      try {
        const stepUpdates = await fetchFn()
        const count = Array.isArray(stepUpdates) ? stepUpdates.length : 0
        const success = count > 0
        recordAction({
          ...action,
          success,
          fetched: count,
          durationMs: Date.now() - stepStart
        })
        if (success) {
          updates = stepUpdates
        }
        return success
      } catch (err) {
        recordAction({
          ...action,
          success: false,
          error: err.message,
          durationMs: Date.now() - stepStart
        })
        error = err.message
        return false
      }
    }

    if (source.type === 'rss') {
      const timeoutMs = Math.max(source.timeout || rssFetcher.fetchTimeout || 15000, 30000)
      await runStep(
        { step: 'retry', method: 'rss_timeout', timeoutMs },
        () => rssFetcher.fetchRSSFeed({ ...source, timeout: timeoutMs, disableKeepAlive: true }, {
          timeoutMs,
          disableKeepAlive: true,
          throwOnError: true
        })
      )
    } else if (source.type === 'web_scraping') {
      await runStep(
        { step: 'fallback', method: 'generic_parser' },
        () => rssFetcher.fetchWebScraping({ ...source, useGeneric: true }, {
          forceGeneric: true,
          throwOnError: true
        })
      )
    } else if (source.type === 'puppeteer') {
      await runStep(
        { step: 'restart', method: 'puppeteer_restart' },
        async () => {
          await puppeteerScraper.closeBrowser()
          return rssFetcher.fetchPuppeteer(source, { throwOnError: true })
        }
      )
    }

    if (updates.length > 0) {
      if (!options.dryRun) {
        try {
          saved = await rssFetcher.saveUpdates(updates, source)
        } catch (saveError) {
          error = saveError.message
          return {
            status: 'not_fixed',
            fetched: updates.length,
            saved: 0,
            durationMs: Date.now() - startedAt,
            actions,
            error
          }
        }
      }
      return {
        status: 'fixed',
        fetched: updates.length,
        saved,
        durationMs: Date.now() - startedAt,
        actions,
        error
      }
    }

    return {
      status: 'not_fixed',
      fetched: 0,
      saved: 0,
      durationMs: Date.now() - startedAt,
      actions,
      error
    }
  }

  async runDailySummary() {
    await dbService.waitForInitialization()
    const summary = await dbService.getScrapeMonitorSummary({
      sinceHours: Number(process.env.SCRAPE_MONITOR_DAILY_WINDOW_HOURS || 24)
    })

    const topIssues = summary.sourcesWithIssues.slice(0, 6).map(source => {
      return `- ${source.sourceName} (${source.sourceType}) issues: ${source.issueCount}`
    })

    const message = [
      `Daily scrape monitor summary (last ${process.env.SCRAPE_MONITOR_DAILY_WINDOW_HOURS || 24}h)`,
      `Runs: ${summary.runCount} | Checks: ${summary.checkCount} | Issues: ${summary.issueCount}`,
      `Errors: ${summary.issueTypes.error || 0} | Stale: ${summary.issueTypes.stale || 0}`,
      topIssues.length ? topIssues.join('\n') : 'No issues detected.'
    ].join('\n')

    await slackNotifier.sendMessage({ text: message })

    return summary
  }
}

module.exports = new ScrapeMonitorService()
