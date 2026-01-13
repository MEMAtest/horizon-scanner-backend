// AI-powered maintenance diagnostics for scraper issues

module.exports = function applyMaintenanceMethods(AIAnalyzerClass) {
  AIAnalyzerClass.prototype.diagnoseScraperFailure = async function diagnoseScraperFailure(issue) {
    if (!this.apiKey) {
      return this.createFallbackDiagnosis(issue)
    }

    const prompt = `Analyze this web scraper failure and provide diagnosis.

Source: ${issue.source_name || issue.sourceName}
Type: ${issue.source_type || issue.sourceType} (rss/web_scraping/puppeteer)
URL: ${issue.url || 'Not available'}
Error: ${issue.error_message || issue.errorMessage || 'Unknown error'}
HTTP Status: ${issue.http_status_code || issue.httpStatusCode || 'N/A'}
Error Category: ${issue.error_category || issue.errorCategory || 'unknown'}
Last Success: ${issue.lastSuccessAt || 'Unknown'}
Recent Failures: ${issue.recentFailureCount || 1} in last 7 days

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "category": "timeout|rate_limit|ssl|connection|selector|restructure|auth|site_down|dns|unknown",
  "confidence": 0.8,
  "rootCause": "Brief explanation of the likely cause",
  "autoFixable": true,
  "suggestedFix": "Specific action to take to fix this issue",
  "humanActionRequired": "What the human should do, if any (null if auto-fixable)",
  "priority": "high|medium|low",
  "expectedResolution": "How long until this might self-resolve, if applicable"
}`

    try {
      const response = await this.makeGroqRequest(prompt)
      const text = response?.choices?.[0]?.message?.content || ''

      // Parse JSON from response, handling markdown code blocks
      let diagnosis = null
      try {
        const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        diagnosis = JSON.parse(cleanText)
      } catch (e) {
        console.warn('Failed to parse AI response as JSON:', text.substring(0, 100))
      }

      if (diagnosis) {
        return {
          ...diagnosis,
          analyzedAt: new Date().toISOString(),
          model: this.currentModel
        }
      }

      return this.createFallbackDiagnosis(issue)
    } catch (error) {
      console.error('AI diagnosis failed:', error.message)
      return this.createFallbackDiagnosis(issue)
    }
  }

  AIAnalyzerClass.prototype.createFallbackDiagnosis = function createFallbackDiagnosis(issue) {
    const errorCategory = issue.error_category || issue.errorCategory || 'unknown'
    const errorMessage = issue.error_message || issue.errorMessage || ''

    // Rule-based fallback diagnosis
    const diagnoses = {
      timeout: {
        category: 'timeout',
        confidence: 0.9,
        rootCause: 'Server took too long to respond',
        autoFixable: true,
        suggestedFix: 'Retry with increased timeout (30-60 seconds)',
        humanActionRequired: null,
        priority: 'medium',
        expectedResolution: 'Usually resolves with retry'
      },
      connection: {
        category: 'connection',
        confidence: 0.85,
        rootCause: 'Network connection was interrupted',
        autoFixable: true,
        suggestedFix: 'Retry with fresh connection, disable keep-alive',
        humanActionRequired: null,
        priority: 'medium',
        expectedResolution: 'Usually resolves with retry'
      },
      rate_limit: {
        category: 'rate_limit',
        confidence: 0.9,
        rootCause: 'Too many requests sent to the server',
        autoFixable: true,
        suggestedFix: 'Wait 5-10 minutes then retry with exponential backoff',
        humanActionRequired: null,
        priority: 'low',
        expectedResolution: '5-30 minutes'
      },
      ssl: {
        category: 'ssl',
        confidence: 0.8,
        rootCause: 'SSL/TLS certificate issue',
        autoFixable: true,
        suggestedFix: 'Retry with relaxed SSL verification or wait for cert renewal',
        humanActionRequired: 'Check if site has valid certificate',
        priority: 'medium',
        expectedResolution: 'May self-resolve if cert is renewed'
      },
      auth: {
        category: 'auth',
        confidence: 0.9,
        rootCause: 'Access denied - authentication or authorization required',
        autoFixable: false,
        suggestedFix: 'Check if site requires login or API key',
        humanActionRequired: 'Investigate access requirements, may need to add credentials',
        priority: 'high',
        expectedResolution: 'Requires human intervention'
      },
      site_down: {
        category: 'site_down',
        confidence: 0.85,
        rootCause: 'Target website is experiencing issues',
        autoFixable: false,
        suggestedFix: 'Wait and monitor - site may be under maintenance',
        humanActionRequired: null,
        priority: 'low',
        expectedResolution: '1-24 hours typically'
      },
      selector: {
        category: 'selector',
        confidence: 0.7,
        rootCause: 'Page structure may have changed',
        autoFixable: false,
        suggestedFix: 'Inspect the page and update CSS/XPath selectors',
        humanActionRequired: 'Review page structure and update scraper selectors',
        priority: 'high',
        expectedResolution: 'Requires code update'
      },
      dns: {
        category: 'dns',
        confidence: 0.8,
        rootCause: 'DNS resolution failed',
        autoFixable: false,
        suggestedFix: 'Check if domain is still valid, may be temporary DNS issue',
        humanActionRequired: 'Verify the URL is correct',
        priority: 'medium',
        expectedResolution: '1-6 hours if temporary'
      },
      skipped: {
        category: 'skipped',
        confidence: 1.0,
        rootCause: 'Source was skipped in fast mode (not a failure)',
        autoFixable: false,
        suggestedFix: 'Run full scrape mode to include this source',
        humanActionRequired: null,
        priority: 'low',
        expectedResolution: 'Will run in next full scrape'
      }
    }

    const baseDiagnosis = diagnoses[errorCategory] || {
      category: 'unknown',
      confidence: 0.5,
      rootCause: `Unknown error: ${errorMessage.substring(0, 100)}`,
      autoFixable: false,
      suggestedFix: 'Investigate error logs and retry manually',
      humanActionRequired: 'Review error details and determine cause',
      priority: 'medium',
      expectedResolution: 'Unknown'
    }

    return {
      ...baseDiagnosis,
      analyzedAt: new Date().toISOString(),
      model: 'fallback-rules'
    }
  }

  AIAnalyzerClass.prototype.generateMaintenanceSummary = async function generateMaintenanceSummary(data) {
    if (!this.apiKey) {
      return this.createFallbackSummary(data)
    }

    const prompt = `Generate a brief executive summary for a regulatory scraper maintenance report.

Health Score: ${data.healthScore}%
Total Sources: ${data.totals.total}
Healthy: ${data.totals.healthy}
Auto-Fixed: ${data.totals.autoFixed}
Errors: ${data.totals.errors}
Needs Attention: ${data.totals.needsAttention}

Top Issues:
${data.topIssues?.map(i => `- ${i.source_name}: ${i.error_category || 'unknown'}`).join('\n') || 'None'}

Recurring Problems (3+ failures this week):
${data.recurringIssues?.map(r => `- ${r.source_name}: ${r.issue_count} failures`).join('\n') || 'None'}

Write 2-3 sentences summarizing the health status and key actions needed. Be concise and actionable.`

    try {
      const response = await this.makeGroqRequest(prompt)
      const text = response?.choices?.[0]?.message?.content || ''
      return text || this.createFallbackSummary(data)
    } catch (error) {
      console.error('AI summary failed:', error.message)
      return this.createFallbackSummary(data)
    }
  }

  AIAnalyzerClass.prototype.createFallbackSummary = function createFallbackSummary(data) {
    const status = data.healthScore >= 90 ? 'healthy' :
                   data.healthScore >= 70 ? 'experiencing some issues' :
                   'degraded and needs attention'

    let summary = `RegCanary scrapers are ${status} with a ${data.healthScore}% health score. `

    if (data.totals.autoFixed > 0) {
      summary += `${data.totals.autoFixed} issues were automatically fixed. `
    }

    if (data.totals.needsAttention > 0) {
      summary += `${data.totals.needsAttention} issue(s) require human attention. `
    }

    if (data.recurringIssues?.length > 0) {
      summary += `${data.recurringIssues.length} source(s) have recurring problems this week.`
    }

    return summary
  }
}
