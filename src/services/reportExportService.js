// Report Export Service
// Generates HTML/JSON bundles for Intelligence Center, Authority Momentum, and Sector Risk briefings.

const fs = require('fs').promises
const path = require('path')
const crypto = require('crypto')

const dbService = require('./dbService')
const annotationService = require('./annotationService')

const REPORT_TYPES = {
  INTELLIGENCE_CENTER: 'intelligence_center',
  AUTHORITY_MOMENTUM: 'authority_momentum',
  SECTOR_RISK: 'sector_risk'
}

class ReportExportService {
  constructor() {
    this.storageDir = path.join(process.cwd(), 'data', 'report_exports')
    this.ensureStoragePromise = null
  }

  async ensureStorage() {
    if (!this.ensureStoragePromise) {
      this.ensureStoragePromise = fs.mkdir(this.storageDir, { recursive: true })
    }
    await this.ensureStoragePromise
  }

  async generateReport(reportType, options = {}) {
    if (!reportType) {
      throw new Error('report_type is required')
    }

    await this.ensureStorage()

    const normalizedType = reportType.toLowerCase()
    let payload

    if (normalizedType === REPORT_TYPES.INTELLIGENCE_CENTER) {
      payload = await this.buildIntelligenceCenterReport(options)
    } else if (normalizedType === REPORT_TYPES.AUTHORITY_MOMENTUM) {
      payload = await this.buildAuthorityMomentumBrief(options)
    } else if (normalizedType === REPORT_TYPES.SECTOR_RISK) {
      payload = await this.buildSectorRiskBrief(options)
    } else {
      throw new Error(`Unsupported report_type: ${reportType}`)
    }

    const reportId = crypto.randomUUID()
    const generatedAt = new Date().toISOString()
    const filePath = path.join(this.storageDir, `${reportId}.html`)

    await fs.writeFile(filePath, payload.html, 'utf8')

    return {
      id: reportId,
      type: normalizedType,
      generatedAt,
      title: payload.title,
      format: 'html',
      path: filePath,
      metadata: payload.metadata,
      html: payload.html
    }
  }

  async buildIntelligenceCenterReport(options) {
    const limit = Math.min(Number(options.limit) || 50, 100)
    const updates = await dbService.getEnhancedUpdates({ limit, sort: 'newest' })
    const firmProfile = await dbService.getFirmProfile()

    const annotations = await annotationService.listAnnotations({
      status: options.annotation_status || [],
      visibility: options.annotation_visibility || []
    })

    const flagged = annotations
      .filter(note => (note.action_type || '').toLowerCase() === 'flag')
      .map(note => ({
        updateId: note.update_id,
        title: note.content || '',
        author: note.author || 'unknown',
        createdAt: note.created_at || note.createdAt || null,
        persona: note.persona || null
      }))

    const assignments = annotations
      .filter(note => (note.action_type || '').toLowerCase() === 'assign')
      .map(note => ({
        updateId: note.update_id,
        assignedTo: Array.isArray(note.assigned_to) ? note.assigned_to.join(', ') : '',
        content: note.content || '',
        priority: note.priority || null,
        createdAt: note.created_at || note.createdAt || null
      }))

    const summary = this.summarizeUpdates(updates)

    const html = this.renderHtmlDocument({
      title: 'Intelligence Center Report',
      subtitle: `Coverage window: last ${limit} updates`,
      sections: [
        {
          heading: 'Executive Summary',
          content: this.renderSummarySection(summary, firmProfile)
        },
        {
          heading: 'Flagged Items',
          content: this.renderFlaggedTable(flagged)
        },
        {
          heading: 'Assignments',
          content: this.renderAssignments(assignments)
        },
        {
          heading: 'Latest Updates',
          content: this.renderUpdateList(updates.slice(0, 20))
        }
      ]
    })

    return {
      title: 'Intelligence Center Report',
      metadata: {
        totalUpdates: updates.length,
        flagged: flagged.length,
        assignments: assignments.length
      },
      html
    }
  }

  async buildAuthorityMomentumBrief(options) {
    const authority = options.authority || options.authority_id
    if (!authority) {
      throw new Error('authority is required for authority_momentum report')
    }

    const limit = Math.min(Number(options.limit) || 75, 150)
    const updates = await dbService.getEnhancedUpdates({ authority, limit, sort: 'newest' })
    const metrics = this.calculateAuthorityMetrics(updates)

    const html = this.renderHtmlDocument({
      title: `Authority Momentum Brief – ${authority}`,
      subtitle: `Analyzing ${updates.length} recent updates`,
      sections: [
        {
          heading: 'Momentum Overview',
          content: this.renderAuthorityOverview(metrics)
        },
        {
          heading: 'Emerging Themes',
          content: this.renderAuthorityThemes(metrics.topics)
        },
        {
          heading: 'Forecast Outlook',
          content: this.renderAuthorityForecast(metrics.forecast)
        },
        {
          heading: 'Recent Updates',
          content: this.renderUpdateList(updates.slice(0, 20))
        }
      ]
    })

    return {
      title: `Authority Momentum Brief – ${authority}`,
      metadata: {
        authority,
        totalUpdates: updates.length,
        currentWeek: metrics.currentWeek,
        previousWeek: metrics.previousWeek
      },
      html
    }
  }

  async buildSectorRiskBrief(options) {
    const sector = options.sector || options.sector_id
    if (!sector) {
      throw new Error('sector is required for sector_risk report')
    }

    const limit = Math.min(Number(options.limit) || 100, 200)
    const updates = await dbService.getEnhancedUpdates({ limit, sort: 'newest' })
    const sectorUpdates = updates.filter(update =>
      update.sector === sector ||
      (Array.isArray(update.primarySectors) && update.primarySectors.includes(sector)) ||
      (Array.isArray(update.firmTypesAffected) && update.firmTypesAffected.includes(sector))
    )

    const metrics = this.calculateSectorMetrics(sector, sectorUpdates)

    const html = this.renderHtmlDocument({
      title: `Sector Risk Brief – ${sector}`,
      subtitle: `${sectorUpdates.length} relevant updates analysed`,
      sections: [
        {
          heading: 'Pressure Summary',
          content: this.renderSectorPressure(metrics)
        },
        {
          heading: 'Upcoming Deadlines',
          content: this.renderSectorTimeline(metrics.timeline)
        },
        {
          heading: 'Playbook Suggestions',
          content: this.renderPlaybookSuggestions(metrics.playbook)
        },
        {
          heading: 'Recommended Alert Rules',
          content: this.renderAlertRules(metrics.alerts)
        },
        {
          heading: 'Recent Updates',
          content: this.renderUpdateList(sectorUpdates.slice(0, 20))
        }
      ]
    })

    return {
      title: `Sector Risk Brief – ${sector}`,
      metadata: {
        sector,
        totalUpdates: sectorUpdates.length,
        pressureScore: metrics.pressureScore,
        riskLevel: metrics.riskLevel
      },
      html
    }
  }

  summarizeUpdates(updates) {
    const byImpact = { Significant: 0, Moderate: 0, Informational: 0 }
    const byAuthority = {}
    const now = new Date()
    let lastUpdate = null

    updates.forEach(update => {
      const impact = (update.impactLevel || update.impact_level || 'Informational').toLowerCase()
      if (impact.includes('significant') || impact.includes('high')) byImpact.Significant += 1
      else if (impact.includes('moderate') || impact.includes('medium')) byImpact.Moderate += 1
      else byImpact.Informational += 1

      const authority = update.authority || 'Unknown'
      byAuthority[authority] = (byAuthority[authority] || 0) + 1

      const published = update.publishedDate || update.published_date || update.fetchedDate || update.createdAt
      if (published) {
        const date = new Date(published)
        if (!lastUpdate || date > lastUpdate) {
          lastUpdate = date
        }
      }
    })

    const topAuthorities = Object.entries(byAuthority)
      .map(([authority, count]) => ({ authority, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      total: updates.length,
      byImpact,
      topAuthorities,
      lastUpdate: lastUpdate ? lastUpdate.toISOString() : now.toISOString()
    }
  }

  calculateAuthorityMetrics(updates) {
    const now = Date.now()
    const weekMs = 7 * 24 * 60 * 60 * 1000
    const currentWeekStart = now - weekMs
    const previousWeekStart = currentWeekStart - weekMs

    let currentWeek = 0
    let previousWeek = 0
    let highImpact = 0
    let consultations = 0
    let enforcementCount = 0
    const topics = new Map()

    updates.forEach(update => {
      const published = new Date(update.publishedDate || update.published_date || update.createdAt || update.fetchedDate || 0).getTime()
      if (!Number.isNaN(published)) {
        if (published >= currentWeekStart) currentWeek += 1
        else if (published >= previousWeekStart && published < currentWeekStart) previousWeek += 1
      }

      const impact = (update.impactLevel || update.impact_level || '').toLowerCase()
      if (impact.includes('significant') || (update.businessImpactScore || update.business_impact_score || 0) >= 7) {
        highImpact += 1
      }

      const content = `${update.headline || ''} ${update.impact || ''}`.toLowerCase()
      if (content.includes('consultation')) consultations += 1
      if (content.includes('enforcement') || content.includes('penalt') || content.includes('fine')) enforcementCount += 1

      const tags = Array.isArray(update.ai_tags) ? update.ai_tags : []
      tags.forEach(tag => {
        if (!tag) return
        const key = String(tag).trim()
        if (!key) return
        topics.set(key, (topics.get(key) || 0) + 1)
      })
    })

    const trendDelta = currentWeek - previousWeek
    const trendLabel = trendDelta > 0 ? 'Rising' : trendDelta < 0 ? 'Cooling' : 'Stable'
    const coordinationScore = this.calculateCoordinationScore(updates)

    const topTopics = Array.from(topics.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic, count]) => ({ topic, count }))

    const forecast = this.buildAuthorityForecastData({
      trendLabel,
      trendDelta,
      enforcementCount,
      consultations,
      highImpact,
      coordinationScore
    })

    return {
      currentWeek,
      previousWeek,
      trendDelta,
      trendLabel,
      enforcementRatio: updates.length ? Math.round((enforcementCount / updates.length) * 100) : 0,
      consultationRatio: updates.length ? Math.round((consultations / updates.length) * 100) : 0,
      highImpactRatio: updates.length ? Math.round((highImpact / updates.length) * 100) : 0,
      coordinationScore,
      topics: topTopics,
      forecast
    }
  }

  calculateSectorMetrics(sector, updates) {
    const now = Date.now()
    const weekMs = 7 * 24 * 60 * 60 * 1000
    const previousWeekStart = now - (2 * weekMs)
    const currentWeekStart = now - weekMs

    let currentWeek = 0
    let previousWeek = 0
    let highImpact = 0
    let enforcementCount = 0
    let consultationCount = 0

    const timeline = []

    updates.forEach(update => {
      const published = new Date(update.publishedDate || update.published_date || update.createdAt || update.fetchedDate || 0).getTime()
      if (!Number.isNaN(published)) {
        if (published >= currentWeekStart) currentWeek += 1
        else if (published >= previousWeekStart && published < currentWeekStart) previousWeek += 1
      }

      const impact = (update.impactLevel || update.impact_level || '').toLowerCase()
      if (impact.includes('significant') || (update.businessImpactScore || update.business_impact_score || 0) >= 7) {
        highImpact += 1
      }

      const content = `${update.headline || ''} ${update.impact || ''}`.toLowerCase()
      if (content.includes('enforcement') || content.includes('penalt') || content.includes('fine')) enforcementCount += 1
      if (content.includes('consultation')) consultationCount += 1

      const deadline = update.compliance_deadline || update.complianceDeadline
      if (deadline) {
        const due = new Date(deadline)
        if (!Number.isNaN(due.getTime())) {
          const daysUntil = Math.round((due.getTime() - now) / (1000 * 60 * 60 * 24))
          timeline.push({
            title: update.headline || 'Upcoming milestone',
            authority: update.authority || 'Unknown',
            dueDate: due.toISOString(),
            daysUntil,
            severity: daysUntil <= 14 ? 'critical' : daysUntil <= 30 ? 'elevate' : 'monitor',
            url: update.url || null
          })
        }
      }
    })

    const pressureScore = this.calculatePressureScore({
      total: updates.length,
      currentWeek,
      previousWeek,
      highImpact,
      enforcementCount,
      consultationCount
    })

    const riskLevel = pressureScore > 70 ? 'High' : pressureScore > 40 ? 'Medium' : 'Low'

    const sortedTimeline = timeline
      .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
      .slice(0, 10)

    const playbook = this.buildSectorPlaybook({
      sector,
      pressureScore,
      riskLevel,
      consultationCount,
      enforcementCount,
      timelineCount: sortedTimeline.length
    })

    const alerts = this.buildSectorAlerts({
      pressureScore,
      riskLevel,
      consultationCount,
      enforcementCount,
      currentWeek,
      previousWeek
    })

    return {
      sector,
      totalUpdates: updates.length,
      pressureScore,
      riskLevel,
      currentWeek,
      previousWeek,
      highImpact,
      enforcementCount,
      consultationCount,
      timeline: sortedTimeline,
      playbook,
      alerts
    }
  }

  calculateCoordinationScore(updates) {
    if (!updates.length) return 0

    const references = new Set()
    updates.forEach(update => {
      const content = `${update.headline || ''} ${update.summary || ''}`.toLowerCase()
      if (content.includes('joint') || content.includes('collaborat') || content.includes('coordinat')) {
        references.add(update.id || update.headline)
      }
    })

    return Math.min(100, Math.round((references.size / updates.length) * 120))
  }

  buildAuthorityForecastData(metrics) {
    const narrative = []

    if (metrics.trendLabel === 'Rising') {
      narrative.push('Publication velocity is rising week over week.')
    } else if (metrics.trendLabel === 'Cooling') {
      narrative.push('Cadence cooled versus last week.')
    } else {
      narrative.push('Cadence remains broadly stable.')
    }

    if (metrics.enforcementRatio >= 30) {
      narrative.push('Elevated enforcement share suggests closer legal alignment.')
    }
    if (metrics.consultationRatio >= 25) {
      narrative.push('Consultation volume signals policy shifts in motion.')
    }

    return {
      summary: narrative.join(' '),
      recommendations: [
        'Align analyst coverage with spike in publications.',
        metrics.enforcementRatio >= 25
          ? 'Prepare leadership talking points on enforcement actions.'
          : 'Track upcoming policy statements for impact analysis.',
        metrics.coordinationScore >= 40
          ? 'Coordinate with public policy team on cross-regulator messaging.'
          : 'Maintain weekly monitoring cadence.'
      ]
    }
  }

  calculatePressureScore({ total, currentWeek, previousWeek, highImpact, enforcementCount, consultationCount }) {
    const base = total * 2
    const recency = currentWeek * 10
    const momentum = Math.max(0, currentWeek - previousWeek) * 8
    const impact = highImpact * 12
    const enforcement = enforcementCount * 10
    const consultations = consultationCount * 6
    return Math.min(100, Math.round(base + recency + momentum + impact + enforcement + consultations))
  }

  buildSectorPlaybook({ sector, pressureScore, riskLevel, consultationCount, enforcementCount, timelineCount }) {
    const items = []

    if (riskLevel === 'High') {
      items.push({
        title: 'Activate sector war-room',
        detail: 'Schedule daily stand-up with compliance, legal, and business owners.'
      })
    } else if (riskLevel === 'Medium') {
      items.push({
        title: 'Escalate monitoring cadence',
        detail: 'Move to twice-weekly triage of sector-specific updates.'
      })
    }

    if (consultationCount > 0) {
      items.push({
        title: 'Consultation response workflow',
        detail: `Map accountable owners and draft speaking points for ${consultationCount} open consultation${consultationCount === 1 ? '' : 's'}.`
      })
    }

    if (enforcementCount > 0) {
      items.push({
        title: 'Enforcement readiness',
        detail: 'Brief legal/compliance on enforcement notices impacting this sector and confirm remediation playbooks.'
      })
    }

    if (timelineCount > 0) {
      items.push({
        title: 'Deadline readiness check',
        detail: 'Validate ownership and evidence for near-term sector deadlines.'
      })
    }

    if (!items.length) {
      items.push({
        title: `Maintain monitoring for ${sector}`,
        detail: 'No immediate escalations identified; continue weekly review cadence.'
      })
    }

    return items
  }

  buildSectorAlerts({ pressureScore, riskLevel, consultationCount, enforcementCount, currentWeek, previousWeek }) {
    return [
      {
        rule: 'Pressure score above 70',
        severity: pressureScore > 70 ? 'High' : 'Medium',
        action: 'Notify sector leadership and compliance mailbox.'
      },
      {
        rule: 'New consultation within 30 days',
        severity: consultationCount > 0 ? 'Medium' : 'Low',
        action: 'Trigger policy response workflow.'
      },
      {
        rule: 'Enforcement notice published',
        severity: enforcementCount > 0 ? 'Medium' : 'Low',
        action: 'Escalate to legal for case review.'
      },
      {
        rule: 'Velocity spike week-over-week',
        severity: currentWeek > previousWeek ? 'Medium' : 'Low',
        action: 'Ping sector channel with update summary.'
      }
    ]
  }

  renderHtmlDocument({ title, subtitle, sections }) {
    const sectionHtml = sections.map(section => `
        <section class="report-section">
          <h2>${section.heading}</h2>
          ${section.content}
        </section>
      `).join('\n')

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <title>${title}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; color: #1f2937; margin: 0; padding: 0; }
            .container { max-width: 960px; margin: 0 auto; padding: 40px 32px; background: #ffffff; }
            header { border-bottom: 1px solid #e2e8f0; margin-bottom: 32px; padding-bottom: 16px; }
            header h1 { margin: 0; font-size: 28px; }
            header p { margin: 8px 0 0; color: #475569; }
            .report-section { margin-bottom: 32px; }
            .report-section h2 { font-size: 20px; margin: 0 0 16px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
            th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; font-size: 14px; }
            th { background: #f1f5f9; }
            .meta { color: #64748b; font-size: 14px; }
            .tag { display: inline-block; padding: 4px 8px; border-radius: 999px; background: #e2e8f0; color: #334155; font-size: 12px; margin-right: 6px; }
            ul { padding-left: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <header>
              <h1>${title}</h1>
              <p class="meta">${subtitle}</p>
            </header>
            ${sectionHtml}
          </div>
        </body>
      </html>
    `
  }

  renderSummarySection(summary, firmProfile) {
    const lastUpdate = summary.lastUpdate ? new Date(summary.lastUpdate).toLocaleString('en-GB') : 'N/A'
    const sectors = Array.isArray(firmProfile?.primary_sectors || firmProfile?.primarySectors)
      ? firmProfile.primary_sectors || firmProfile.primarySectors
      : []
    const sectorStr = sectors.length ? sectors.join(', ') : 'Not configured'

    return `
      <p>Total updates analysed: <strong>${summary.total}</strong></p>
      <p>Last update captured: <strong>${lastUpdate}</strong></p>
      <p>Firm sectors: <strong>${sectorStr}</strong></p>
      <table>
        <thead>
          <tr>
            <th>Impact Level</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Significant</td><td>${summary.byImpact.Significant}</td></tr>
          <tr><td>Moderate</td><td>${summary.byImpact.Moderate}</td></tr>
          <tr><td>Informational</td><td>${summary.byImpact.Informational}</td></tr>
        </tbody>
      </table>
      <h3>Top Authorities</h3>
      <ul>
        ${summary.topAuthorities.map(entry => `<li>${entry.authority}: ${entry.count}</li>`).join('') || '<li>No authorities captured.</li>'}
      </ul>
    `
  }

  renderFlaggedTable(flagged) {
    if (!flagged.length) {
      return '<p>No flagged items captured during this window.</p>'
    }

    const rows = flagged.map(item => `
      <tr>
        <td>${item.updateId || '-'}</td>
        <td>${item.persona || 'N/A'}</td>
        <td>${this.escapeHtml(item.author)}</td>
        <td>${this.escapeHtml(item.content)}</td>
        <td>${item.createdAt ? new Date(item.createdAt).toLocaleString('en-GB') : 'N/A'}</td>
      </tr>
    `).join('')

    return `
      <table>
        <thead>
          <tr>
            <th>Update ID</th>
            <th>Persona</th>
            <th>Author</th>
            <th>Summary</th>
            <th>Flagged At</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `
  }

  renderAssignments(assignments) {
    if (!assignments.length) {
      return '<p>No assignments captured during this window.</p>'
    }

    return `
      <ul>
        ${assignments.map(item => `
          <li>
            <strong>${item.assignedTo || 'Unassigned'}</strong> → ${this.escapeHtml(item.content)} 
            (${item.priority ? `Priority: ${item.priority}` : 'No priority set'})
          </li>
        `).join('')}
      </ul>
    `
  }

  renderUpdateList(updates) {
    if (!updates.length) {
      return '<p>No updates found for the selected filters.</p>'
    }

    return `
      <ul>
        ${updates.map(update => `
          <li>
            <strong>${this.escapeHtml(update.headline || update.title || 'Untitled')}</strong>
            <span class="tag">${this.escapeHtml(update.authority || 'Unknown')}</span>
            <span class="tag">${this.escapeHtml(update.impactLevel || update.impact_level || 'Informational')}</span>
            ${update.url ? `<a href="${this.escapeAttribute(update.url)}" target="_blank" rel="noopener">Source</a>` : ''}
          </li>
        `).join('')}
      </ul>
    `
  }

  renderAuthorityOverview(metrics) {
    return `
      <p>Trend: <strong>${metrics.trendLabel}</strong> (${metrics.trendDelta >= 0 ? '+' : ''}${metrics.trendDelta} week over week)</p>
      <p>Current week updates: <strong>${metrics.currentWeek}</strong></p>
      <p>Previous week updates: <strong>${metrics.previousWeek}</strong></p>
      <table>
        <thead>
          <tr>
            <th>Indicator</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Enforcement ratio</td><td>${metrics.enforcementRatio}%</td></tr>
          <tr><td>Consultation ratio</td><td>${metrics.consultationRatio}%</td></tr>
          <tr><td>High impact ratio</td><td>${metrics.highImpactRatio}%</td></tr>
          <tr><td>Coordination score</td><td>${metrics.coordinationScore}</td></tr>
        </tbody>
      </table>
    `
  }

  renderAuthorityThemes(topics) {
    if (!topics.length) {
      return '<p>No dominant themes detected.</p>'
    }

    return `
      <ul>
        ${topics.map(topic => `<li>${this.escapeHtml(topic.topic)} (${topic.count})</li>`).join('')}
      </ul>
    `
  }

  renderAuthorityForecast(forecast) {
    return `
      <p>${this.escapeHtml(forecast.summary)}</p>
      <h3>Recommended Actions</h3>
      <ul>
        ${forecast.recommendations.map(item => `<li>${this.escapeHtml(item)}</li>`).join('')}
      </ul>
    `
  }

  renderSectorPressure(metrics) {
    return `
      <p>Pressure Score: <strong>${metrics.pressureScore}</strong> (${metrics.riskLevel} risk)</p>
      <p>This week vs last: <strong>${metrics.currentWeek}</strong> vs <strong>${metrics.previousWeek}</strong></p>
      <p>High impact updates: <strong>${metrics.highImpact}</strong></p>
      <p>Enforcement references: <strong>${metrics.enforcementCount}</strong></p>
      <p>Consultation mentions: <strong>${metrics.consultationCount}</strong></p>
    `
  }

  renderSectorTimeline(timeline) {
    if (!timeline.length) {
      return '<p>No upcoming deadlines recorded for this sector.</p>'
    }

    return `
      <table>
        <thead>
          <tr>
            <th>Due Date</th>
            <th>Authority</th>
            <th>Milestone</th>
            <th>Days Until</th>
          </tr>
        </thead>
        <tbody>
          ${timeline.map(item => `
            <tr>
              <td>${new Date(item.dueDate).toLocaleDateString('en-GB')}</td>
              <td>${this.escapeHtml(item.authority)}</td>
              <td>${this.escapeHtml(item.title)}</td>
              <td>${item.daysUntil}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `
  }

  renderPlaybookSuggestions(playbook) {
    if (!playbook.length) {
      return '<p>No playbook suggestions available.</p>'
    }

    return `
      <ul>
        ${playbook.map(item => `<li><strong>${this.escapeHtml(item.title)}:</strong> ${this.escapeHtml(item.detail)}</li>`).join('')}
      </ul>
    `
  }

  renderAlertRules(alerts) {
    return `
      <ul>
        ${alerts.map(alert => `<li><strong>${this.escapeHtml(alert.rule)} (${alert.severity}):</strong> ${this.escapeHtml(alert.action)}</li>`).join('')}
      </ul>
    `
  }

  escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  escapeAttribute(value) {
    return this.escapeHtml(value).replace(/\s/g, '%20')
  }
}

module.exports = new ReportExportService()
