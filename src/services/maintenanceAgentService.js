// Semi-autonomous maintenance agent for RegCanary scrapers
// Analyzes issues, attempts auto-fixes, and generates reports for human review

const dbService = require('./dbService')
const aiAnalyzer = require('./aiAnalyzer')
const rssFetcher = require('./rssFetcher')

class MaintenanceAgentService {
  constructor() {
    this.isRunning = false
  }

  /**
   * Run the full maintenance cycle
   * 1. Get unanalyzed issues from recent scrape monitor runs
   * 2. Analyze each issue with AI
   * 3. Attempt advanced fixes for auto-fixable issues
   * 4. Mark issues requiring human attention
   * 5. Return summary for email report
   */
  async runMaintenance(options = {}) {
    if (this.isRunning) {
      return { success: false, error: 'Maintenance agent already running' }
    }

    this.isRunning = true
    const startedAt = new Date()
    const sinceHours = options.sinceHours || 24

    console.log('🔧 Starting maintenance agent...')

    try {
      await dbService.waitForInitialization()

      // Get unanalyzed issues
      const issues = await dbService.getUnanalyzedIssues(sinceHours)
      console.log(`📋 Found ${issues.length} unanalyzed issues`)

      const results = {
        analyzed: 0,
        autoFixed: 0,
        needsHuman: 0,
        skipped: 0,
        errors: 0,
        diagnoses: [],
        fixAttempts: []
      }

      // Debug: Log breakdown of issue statuses
      const statusCounts = {}
      const typeCounts = {}
      const categoryCounts = {}
      for (const issue of issues) {
        statusCounts[issue.status] = (statusCounts[issue.status] || 0) + 1
        typeCounts[issue.issue_type] = (typeCounts[issue.issue_type] || 0) + 1
        categoryCounts[issue.error_category] = (categoryCounts[issue.error_category] || 0) + 1
      }
      console.log(`📊 Issue breakdown:`)
      console.log(`   Statuses: ${JSON.stringify(statusCounts)}`)
      console.log(`   Types: ${JSON.stringify(typeCounts)}`)
      console.log(`   Categories: ${JSON.stringify(categoryCounts)}`)

      // Analyze each issue (limit to first 20 to avoid rate limits)
      const issuesToAnalyze = issues.filter(issue => {
        // Skip issues that were already fixed or successful
        if (issue.status === 'fixed' || issue.status === 'success') {
          return false
        }
        // Skip 'no_updates' - not errors
        if (issue.status === 'no_updates') {
          return false
        }
        // Include issues with actual error status
        return issue.status === 'error' || issue.status === 'stale'
      })

      console.log(`🔍 Filtering: ${issues.length} total → ${issuesToAnalyze.length} to analyze`)
      results.skipped = issues.length - issuesToAnalyze.length

      // Limit analysis to 20 issues per run to avoid rate limits
      const limitedIssues = issuesToAnalyze.slice(0, 20)
      if (issuesToAnalyze.length > 20) {
        console.log(`⚠️ Limiting analysis to 20 issues (${issuesToAnalyze.length - 20} deferred)`)
      }

      for (const issue of limitedIssues) {
        try {
          // Get AI diagnosis
          const diagnosis = await aiAnalyzer.diagnoseScraperFailure(issue)
          results.analyzed++

          // Store diagnosis in database
          await dbService.updateCheckWithAIDiagnosis(issue.id, {
            category: diagnosis.category,
            confidence: diagnosis.confidence,
            suggestedFix: diagnosis.suggestedFix,
            humanActionRequired: !diagnosis.autoFixable || diagnosis.humanActionRequired != null
          })

          results.diagnoses.push({
            sourceName: issue.source_name,
            sourceType: issue.source_type,
            diagnosis
          })

          // Attempt auto-fix for fixable issues
          if (diagnosis.autoFixable && diagnosis.confidence >= 0.7) {
            console.log(`🔄 Attempting auto-fix for ${issue.source_name}...`)
            const fixResult = await this.attemptAdvancedFix(issue, diagnosis)
            results.fixAttempts.push({
              sourceName: issue.source_name,
              ...fixResult
            })

            if (fixResult.success) {
              results.autoFixed++
            }
          } else if (!diagnosis.autoFixable) {
            results.needsHuman++
          }

          // Rate limit AI calls
          await this.delay(500)

        } catch (error) {
          console.error(`Error analyzing ${issue.source_name}:`, error.message)
          results.errors++
        }
      }

      // Get maintenance summary
      const summary = await dbService.getMaintenanceSummary(sinceHours)

      // Get issues requiring human attention
      const needsAttention = await dbService.getIssuesRequiringHumanAction(48)

      // Generate AI summary
      const aiSummary = await aiAnalyzer.generateMaintenanceSummary({
        healthScore: summary?.healthScore || 100,
        totals: summary?.totals || { total: 0, healthy: 0, autoFixed: 0, errors: 0, needsAttention: 0 },
        topIssues: needsAttention.slice(0, 5),
        recurringIssues: summary?.recurringIssues || []
      })

      const durationMs = Date.now() - startedAt.getTime()
      console.log(`✅ Maintenance completed in ${(durationMs / 1000).toFixed(1)}s`)
      console.log(`   Analyzed: ${results.analyzed}, Auto-fixed: ${results.autoFixed}, Needs human: ${results.needsHuman}`)

      return {
        success: true,
        durationMs,
        results,
        summary,
        needsAttention,
        aiSummary
      }

    } catch (error) {
      console.error('Maintenance agent error:', error)
      return {
        success: false,
        error: error.message
      }
    } finally {
      this.isRunning = false
    }
  }

  /**
   * Attempt advanced fixes based on AI diagnosis
   */
  async attemptAdvancedFix(issue, diagnosis) {
    const source = rssFetcher.feedSources.find(s => s.name === issue.source_name)
    if (!source) {
      return { success: false, error: 'Source not found in config' }
    }

    const startedAt = Date.now()

    try {
      switch (diagnosis.category) {
        case 'timeout':
          // Extended timeout retry
          return await this.fixWithExtendedTimeout(source, issue)

        case 'connection':
          // Fresh connection retry
          return await this.fixWithFreshConnection(source, issue)

        case 'rate_limit':
          // Backoff and retry
          console.log('⏳ Waiting for rate limit to clear...')
          await this.delay(10000) // Wait 10 seconds
          return await this.fixWithFreshConnection(source, issue)

        case 'ssl':
          // Try with relaxed SSL
          return await this.fixWithRelaxedSSL(source, issue)

        default:
          return { success: false, error: `No auto-fix strategy for ${diagnosis.category}` }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        durationMs: Date.now() - startedAt
      }
    }
  }

  async fixWithExtendedTimeout(source, issue) {
    const startedAt = Date.now()
    try {
      const updates = await rssFetcher.fetchFromSource(
        { ...source, timeout: 60000 },
        { timeoutMs: 60000, throwOnError: true }
      )

      const count = Array.isArray(updates) ? updates.length : 0
      if (count > 0) {
        const saved = await rssFetcher.saveUpdates(updates, source)
        return {
          success: true,
          fetched: count,
          saved,
          method: 'extended_timeout',
          durationMs: Date.now() - startedAt
        }
      }

      return { success: false, error: 'No updates fetched', durationMs: Date.now() - startedAt }
    } catch (error) {
      return { success: false, error: error.message, durationMs: Date.now() - startedAt }
    }
  }

  async fixWithFreshConnection(source, issue) {
    const startedAt = Date.now()
    try {
      const updates = await rssFetcher.fetchFromSource(
        { ...source, disableKeepAlive: true },
        { disableKeepAlive: true, throwOnError: true }
      )

      const count = Array.isArray(updates) ? updates.length : 0
      if (count > 0) {
        const saved = await rssFetcher.saveUpdates(updates, source)
        return {
          success: true,
          fetched: count,
          saved,
          method: 'fresh_connection',
          durationMs: Date.now() - startedAt
        }
      }

      return { success: false, error: 'No updates fetched', durationMs: Date.now() - startedAt }
    } catch (error) {
      return { success: false, error: error.message, durationMs: Date.now() - startedAt }
    }
  }

  async fixWithRelaxedSSL(source, issue) {
    const startedAt = Date.now()
    try {
      // For SSL issues, we can try with NODE_TLS_REJECT_UNAUTHORIZED=0 temporarily
      // This is risky but can help diagnose if it's a cert issue
      const updates = await rssFetcher.fetchFromSource(
        { ...source, rejectUnauthorized: false },
        { rejectUnauthorized: false, throwOnError: true }
      )

      const count = Array.isArray(updates) ? updates.length : 0
      if (count > 0) {
        const saved = await rssFetcher.saveUpdates(updates, source)
        return {
          success: true,
          fetched: count,
          saved,
          method: 'relaxed_ssl',
          durationMs: Date.now() - startedAt,
          warning: 'SSL verification was disabled - investigate certificate issue'
        }
      }

      return { success: false, error: 'No updates fetched', durationMs: Date.now() - startedAt }
    } catch (error) {
      return { success: false, error: error.message, durationMs: Date.now() - startedAt }
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

module.exports = new MaintenanceAgentService()
