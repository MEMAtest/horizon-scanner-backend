/**
 * FCA Publications Dashboard Core
 *
 * Module Structure:
 * - modules/formatters.js - Standalone utility functions (formatCurrency, formatNumber, etc.)
 *
 * This class contains all dashboard logic. Methods are organized into sections:
 * - HELPERS: Formatting utilities (lines ~28-540)
 * - STATS: Stats loading and rendering (lines ~60-140)
 * - INSIGHTS: Basic insights rendering (lines ~140-540)
 * - DATA: Notice loading and filtering (lines ~545-670)
 * - TABLE: Table rendering and pagination (lines ~656-785)
 * - CHARTS: Chart rendering (lines ~845-1250)
 * - MODALS: Modal handling (lines ~1250-1340)
 * - EVENTS: Event listeners (lines ~1336-1435)
 * - DEEP INSIGHTS: Deep insights section (lines ~1436-2967)
 */

import {
  formatCurrency as formatCurrencyFn,
  formatNumber as formatNumberFn,
  escapeHtml as escapeHtmlFn,
  parseJson as parseJsonFn,
  formatOutcomeLabel as formatOutcomeLabelFn,
  formatBreachLabel as formatBreachLabelFn,
  outcomeColors
} from './modules/formatters.js'

export class PublicationsDashboard {
  constructor() {
    this.charts = {}
    this.notices = []
    this.filteredNotices = []
    this.currentPage = 1
    this.pageSize = 20
    this.sortBy = 'notice_date'
    this.sortDir = 'desc'
    this.filters = {}
    this.stats = {}

    // Deep insights data
    this.caseStudies = []
    this.currentCaseIndex = 0
    this.breachSummary = []
    this.handbookStats = []
    this.fineModifiers = { aggravating: [], mitigating: [] }

    this.init()
  }

  // ============ HELPERS ============
  formatCurrency(amount) {
    if (!amount || isNaN(amount)) return '£0'
    const num = Number(amount)
    if (num >= 1000000000) return '£' + (num / 1e9).toFixed(2) + 'B'
    if (num >= 1000000) return '£' + (num / 1e6).toFixed(1) + 'M'
    if (num >= 1000) return '£' + (num / 1000).toFixed(0) + 'K'
    return '£' + num.toLocaleString('en-GB')
  }

  formatNumber(num) {
    return num ? num.toLocaleString('en-GB') : '0'
  }

  async init() {
    try {
      await this.loadStats()
      await this.loadNotices()
      this.renderInsights()
      this.renderCharts()
      this.renderTopFines()
      this.setupEventListeners()

      // Load and render deep insights
      await this.loadDeepInsights()
      this.setupDeepInsightsEvents()

      console.log('[publications] Dashboard initialized')
    } catch (error) {
      console.error('[publications] Init error:', error)
    }
  }

  // ============ STATS ============
  async loadStats() {
    try {
      // Load both status and stats endpoints in parallel
      const [statusResponse, statsResponse] = await Promise.all([
        fetch('/api/publications/status'),
        fetch('/api/publications/stats')
      ])

      const statusData = await statusResponse.json()
      const statsData = await statsResponse.json()

      if (statusData.success) {
        this.renderStats(statusData, statsData?.data)
      }
    } catch (error) {
      console.error('[publications] Failed to load stats:', error)
    }
  }

  renderStats(data, finesData = null) {
    // Store stats for later use
    this.stats = data
    this.finesStats = finesData

    // Update stat cards
    const indexed = data.index?.total || 0
    const processed = data.index?.byStatus?.processed || 0
    const pending = (data.index?.byStatus?.pending || 0) +
                   (data.index?.byStatus?.parsing || 0) +
                   (data.index?.byStatus?.downloading || 0)

    document.getElementById('total-indexed').textContent = this.formatNumber(indexed)
    document.getElementById('total-processed').textContent = this.formatNumber(processed)
    document.getElementById('total-pending').textContent = this.formatNumber(pending)

    // Update Total Fines from stats API (not calculated from paginated notices)
    if (finesData?.fines) {
      const totalFines = finesData.fines.total || 0
      const finesCount = finesData.fines.count || 0
      document.getElementById('total-fines').textContent = this.formatCurrency(totalFines)

      const finesHelper = document.getElementById('fines-helper')
      if (finesHelper) {
        finesHelper.textContent = `${this.formatNumber(finesCount)} cases with financial penalties`
      }
    }

    // Add helper text
    const indexedHelper = document.getElementById('indexed-helper')
    if (indexedHelper) indexedHelper.textContent = 'FCA publications indexed'

    const processedHelper = document.getElementById('processed-helper')
    if (processedHelper) processedHelper.textContent = 'AI-analysed enforcement notices'

    const pendingHelper = document.getElementById('pending-helper')
    if (pendingHelper) {
      // These are non-enforcement docs that can't be AI-classified
      pendingHelper.textContent = pending > 0 ? 'Non-enforcement docs' : 'Pipeline complete'
    }

    // Update pipeline status with indicator
    // Note: "pending" includes non-enforcement docs that can't be AI-classified
    // Show "Complete" if we have processed enforcement notices
    const statusEl = document.getElementById('pipeline-status-value')
    const statusIndicator = document.querySelector('.status-indicator')

    if (processed > 0) {
      // All processable enforcement notices have been analysed
      statusEl.textContent = 'Complete'
      if (statusIndicator) statusIndicator.classList.remove('processing')
    } else if (indexed > 0) {
      statusEl.textContent = 'Ready to process'
      if (statusIndicator) statusIndicator.classList.add('processing')
    } else {
      statusEl.textContent = 'Ready'
      if (statusIndicator) statusIndicator.classList.remove('processing')
    }
  }

  // ============ INSIGHTS ============
  renderInsights() {
    this.renderOutcomeBreakdown()
    this.renderBreachAnalysis()
    this.renderFinesAnalysis()
    this.renderKeyTakeaways()
  }

  renderFinesAnalysis() {
    const container = document.getElementById('fines-metrics')
    const insightEl = document.getElementById('fines-insight')
    if (!container) return

    // Calculate fines metrics
    const fines = this.notices
      .filter(n => n.fine_amount && n.fine_amount > 0)
      .map(n => Number(n.fine_amount))
      .sort((a, b) => a - b)

    if (fines.length === 0) {
      container.innerHTML = '<div class="empty-insight">No fines data available</div>'
      return
    }

    const total = fines.reduce((a, b) => a + b, 0)
    const avg = total / fines.length
    const median = fines.length % 2 === 0
      ? (fines[fines.length/2 - 1] + fines[fines.length/2]) / 2
      : fines[Math.floor(fines.length/2)]
    const max = fines[fines.length - 1]

    // Categorize fines
    const small = fines.filter(f => f < 100000).length
    const medium = fines.filter(f => f >= 100000 && f < 1000000).length
    const large = fines.filter(f => f >= 1000000 && f < 10000000).length
    const mega = fines.filter(f => f >= 10000000).length

    container.innerHTML = `
      <div class="fines-summary">
        <div class="fine-metric">
          <div class="fine-metric-value">${this.formatCurrency(total)}</div>
          <div class="fine-metric-label">Total Fines</div>
        </div>
        <div class="fine-metric">
          <div class="fine-metric-value">${this.formatNumber(fines.length)}</div>
          <div class="fine-metric-label">Cases with Fines</div>
        </div>
        <div class="fine-metric">
          <div class="fine-metric-value">${this.formatCurrency(avg)}</div>
          <div class="fine-metric-label">Average Fine</div>
        </div>
        <div class="fine-metric">
          <div class="fine-metric-value">${this.formatCurrency(median)}</div>
          <div class="fine-metric-label">Median Fine</div>
        </div>
      </div>
      <div class="fines-distribution">
        <div class="fine-band">
          <span class="fine-band-label">&lt;£100K</span>
          <div class="fine-band-bar-wrapper">
            <div class="fine-band-bar" style="width: ${(small/fines.length*100).toFixed(0)}%; background: #10b981"></div>
          </div>
          <span class="fine-band-count">${small}</span>
        </div>
        <div class="fine-band">
          <span class="fine-band-label">£100K-£1M</span>
          <div class="fine-band-bar-wrapper">
            <div class="fine-band-bar" style="width: ${(medium/fines.length*100).toFixed(0)}%; background: #f59e0b"></div>
          </div>
          <span class="fine-band-count">${medium}</span>
        </div>
        <div class="fine-band">
          <span class="fine-band-label">£1M-£10M</span>
          <div class="fine-band-bar-wrapper">
            <div class="fine-band-bar" style="width: ${(large/fines.length*100).toFixed(0)}%; background: #f97316"></div>
          </div>
          <span class="fine-band-count">${large}</span>
        </div>
        <div class="fine-band">
          <span class="fine-band-label">&gt;£10M</span>
          <div class="fine-band-bar-wrapper">
            <div class="fine-band-bar" style="width: ${(mega/fines.length*100).toFixed(0)}%; background: #ef4444"></div>
          </div>
          <span class="fine-band-count">${mega}</span>
        </div>
      </div>
    `

    // Add insight
    if (insightEl) {
      const smallPercent = ((small / fines.length) * 100).toFixed(0)
      insightEl.innerHTML = `
        <div class="insight-highlight">
          <span class="insight-icon">💰</span>
          <span class="insight-text">
            <strong>${smallPercent}%</strong> of fines are under £100K. The largest fine was <strong>${this.formatCurrency(max)}</strong>.
            Median (${this.formatCurrency(median)}) is much lower than average due to a few mega-fines.
          </span>
        </div>
      `
    }
  }

  renderOutcomeBreakdown() {
    const container = document.getElementById('outcome-bars')
    const insightEl = document.getElementById('outcome-insight')
    if (!container) return

    // Calculate outcome distribution
    const outcomes = {}
    let total = 0
    this.notices.forEach(n => {
      const type = n.outcome_type || 'other'
      outcomes[type] = (outcomes[type] || 0) + 1
      total++
    })

    if (total === 0) {
      container.innerHTML = '<div class="empty-insight">No data available</div>'
      return
    }

    // Sort by count descending
    const sorted = Object.entries(outcomes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    // Color map for outcomes
    const colors = {
      cancellation: '#ef4444',
      fine: '#f59e0b',
      prohibition: '#8b5cf6',
      restriction: '#f97316',
      censure: '#6366f1',
      warning: '#eab308',
      supervisory_notice: '#3b82f6',
      public_statement: '#10b981',
      other: '#6b7280'
    }

    // Render percentage bars
    const topOutcome = sorted[0]
    const topPercent = ((topOutcome[1] / total) * 100).toFixed(1)

    container.innerHTML = sorted.map(([type, count]) => {
      const percent = ((count / total) * 100).toFixed(1)
      const color = colors[type] || '#6b7280'
      const label = this.formatOutcomeLabel(type)
      return `
        <div class="outcome-bar-row">
          <div class="outcome-label">${label}</div>
          <div class="outcome-bar-wrapper">
            <div class="outcome-bar" style="width: ${percent}%; background: ${color}"></div>
          </div>
          <div class="outcome-stats">
            <span class="outcome-percent">${percent}%</span>
            <span class="outcome-count">(${this.formatNumber(count)})</span>
          </div>
        </div>
      `
    }).join('')

    // Add insight callout
    if (insightEl) {
      const topLabel = this.formatOutcomeLabel(topOutcome[0])
      insightEl.innerHTML = `
        <div class="insight-highlight">
          <span class="insight-icon">💡</span>
          <span class="insight-text">
            <strong>${topPercent}%</strong> of FCA enforcement results in <strong>${topLabel.toLowerCase()}</strong>.
            ${topOutcome[0] === 'cancellation' ? 'Losing your license is more likely than receiving a fine.' : ''}
          </span>
        </div>
      `
    }
  }

  renderBreachAnalysis() {
    const container = document.getElementById('breach-rankings')
    const insightEl = document.getElementById('breach-insight')
    if (!container) return

    // Calculate breach distribution
    const breaches = {}
    let total = 0
    this.notices.forEach(n => {
      if (n.primary_breach_type) {
        const type = n.primary_breach_type
        breaches[type] = (breaches[type] || 0) + 1
        total++
      }
    })

    if (total === 0) {
      container.innerHTML = '<div class="empty-insight">No breach data available</div>'
      return
    }

    // Sort by count descending and take top 5
    const sorted = Object.entries(breaches)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    // Breach descriptions
    const descriptions = {
      PRINCIPLES: 'Fundamental conduct breaches',
      AML: 'Anti-money laundering failures',
      SYSTEMS_CONTROLS: 'Operational & control weaknesses',
      MARKET_ABUSE: 'Insider dealing & manipulation',
      MIS_SELLING: 'Product suitability failures',
      CLIENT_MONEY: 'Client asset protection issues',
      CONDUCT: 'Individual misconduct',
      PRUDENTIAL: 'Capital & liquidity failures',
      REPORTING: 'Regulatory reporting failures',
      GOVERNANCE: 'Corporate governance failures',
      FINANCIAL_CRIME: 'Financial crime prevention',
      COMPLAINTS: 'Complaints handling failures',
      FINANCIAL_PROMOTIONS: 'Marketing compliance issues',
      APPROVED_PERSONS: 'Fitness & propriety issues'
    }

    // Render rankings
    container.innerHTML = sorted.map(([type, count], index) => {
      const percent = ((count / total) * 100).toFixed(1)
      const desc = descriptions[type] || 'Regulatory breach'
      const label = this.formatBreachLabel(type)
      return `
        <div class="breach-rank-item">
          <div class="breach-rank">${index + 1}</div>
          <div class="breach-details">
            <div class="breach-name">${label}</div>
            <div class="breach-desc">${desc}</div>
          </div>
          <div class="breach-percent">${percent}%</div>
        </div>
      `
    }).join('')

    // Add insight callout
    if (insightEl && sorted.length > 0) {
      const topBreach = sorted[0]
      const topLabel = this.formatBreachLabel(topBreach[0])
      const topPercent = ((topBreach[1] / total) * 100).toFixed(1)
      insightEl.innerHTML = `
        <div class="insight-highlight">
          <span class="insight-icon">⚠️</span>
          <span class="insight-text">
            <strong>${topLabel}</strong> breaches account for <strong>${topPercent}%</strong> of enforcement actions.
            Focus controls on ${descriptions[topBreach[0]]?.toLowerCase() || 'this area'}.
          </span>
        </div>
      `
    }
  }

  renderKeyTakeaways() {
    const container = document.getElementById('takeaways-list')
    if (!container) return

    // Calculate comprehensive metrics
    const total = this.notices.length
    const outcomes = {}
    const breaches = {}
    const finesByBreach = {}
    let fineTotal = 0
    let fineCount = 0
    let highRiskCount = 0

    this.notices.forEach(n => {
      const outcomeType = n.outcome_type || 'other'
      outcomes[outcomeType] = (outcomes[outcomeType] || 0) + 1

      if (n.primary_breach_type) {
        breaches[n.primary_breach_type] = (breaches[n.primary_breach_type] || 0) + 1

        if (n.fine_amount && n.fine_amount > 0) {
          finesByBreach[n.primary_breach_type] = (finesByBreach[n.primary_breach_type] || 0) + Number(n.fine_amount)
        }
      }

      if (n.fine_amount && n.fine_amount > 0) {
        fineTotal += Number(n.fine_amount)
        fineCount++
      }

      if (n.risk_score && n.risk_score >= 70) {
        highRiskCount++
      }
    })

    // Get top outcome
    const sortedOutcomes = Object.entries(outcomes).sort((a, b) => b[1] - a[1])
    const topOutcome = sortedOutcomes[0]
    const topOutcomePercent = ((topOutcome[1] / total) * 100).toFixed(0)
    const secondOutcome = sortedOutcomes[1]
    const secondOutcomePercent = secondOutcome ? ((secondOutcome[1] / total) * 100).toFixed(0) : 0

    // Get top breaches
    const sortedBreaches = Object.entries(breaches).sort((a, b) => b[1] - a[1])
    const topBreach = sortedBreaches[0]
    const secondBreach = sortedBreaches[1]
    const totalBreachCount = Object.values(breaches).reduce((a, b) => a + b, 0)

    // Find breach with highest fines
    const topFineBreach = Object.entries(finesByBreach).sort((a, b) => b[1] - a[1])[0]

    // Generate takeaway cards
    const takeaways = [
      {
        icon: '⚖️',
        category: 'OUTCOME PATTERN',
        title: `${topOutcomePercent}% result in ${this.formatOutcomeLabel(topOutcome[0])}`,
        detail: topOutcome[0] === 'cancellation'
          ? 'License revocation is the most common FCA action - more than fines'
          : `${this.formatOutcomeLabel(topOutcome[0])} is the dominant enforcement outcome`,
        color: '#ef4444'
      },
      {
        icon: '🎯',
        category: 'TOP TRIGGER',
        title: `${this.formatBreachLabel(topBreach[0])} leads enforcement`,
        detail: `${((topBreach[1] / totalBreachCount) * 100).toFixed(0)}% of breaches - prioritize ${topBreach[0] === 'PRINCIPLES' ? 'conduct & culture' : 'this control area'}`,
        color: '#f59e0b'
      },
      {
        icon: '💷',
        category: 'HIGHEST FINES',
        title: `${this.formatBreachLabel(topFineBreach?.[0] || 'N/A')} attracts biggest penalties`,
        detail: topFineBreach ? `${this.formatCurrency(topFineBreach[1])} total in fines for this category` : 'No fine data',
        color: '#10b981'
      },
      {
        icon: '⚠️',
        category: 'RISK SIGNAL',
        title: `${this.formatNumber(highRiskCount)} high-risk notices (${((highRiskCount/total)*100).toFixed(0)}%)`,
        detail: 'Notices scored 70+ indicate systemic issues or major consumer harm',
        color: '#8b5cf6'
      },
      {
        icon: '🔄',
        category: 'SECOND TRIGGER',
        title: `${this.formatBreachLabel(secondBreach?.[0] || 'N/A')} is #2 breach type`,
        detail: secondBreach ? `${((secondBreach[1] / totalBreachCount) * 100).toFixed(0)}% of cases - ensure controls cover this area` : 'Limited data',
        color: '#3b82f6'
      },
      {
        icon: '📊',
        category: 'KEY STAT',
        title: `Only ${((fineCount/total)*100).toFixed(0)}% of actions include a fine`,
        detail: `Most enforcement is non-financial: prohibitions, cancellations, restrictions`,
        color: '#64748b'
      }
    ]

    container.innerHTML = takeaways.map(t => `
      <div class="takeaway-card">
        <div class="takeaway-card-header" style="border-left-color: ${t.color}">
          <span class="takeaway-card-icon">${t.icon}</span>
          <span class="takeaway-card-category">${t.category}</span>
        </div>
        <div class="takeaway-card-body">
          <div class="takeaway-card-title">${t.title}</div>
          <div class="takeaway-card-detail">${t.detail}</div>
        </div>
      </div>
    `).join('')
  }

  formatOutcomeLabel(type) {
    const labels = {
      cancellation: 'Cancellation',
      fine: 'Fine',
      prohibition: 'Prohibition',
      restriction: 'Restriction',
      censure: 'Censure',
      warning: 'Warning',
      supervisory_notice: 'Supervisory Notice',
      public_statement: 'Public Statement',
      voluntary_requirement: 'Voluntary Requirement',
      other: 'Other'
    }
    return labels[type] || type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ')
  }

  formatBreachLabel(type) {
    const labels = {
      PRINCIPLES: 'Principles',
      AML: 'AML',
      SYSTEMS_CONTROLS: 'Systems & Controls',
      MARKET_ABUSE: 'Market Abuse',
      MIS_SELLING: 'Mis-selling',
      CLIENT_MONEY: 'Client Money',
      CONDUCT: 'Conduct',
      PRUDENTIAL: 'Prudential',
      REPORTING: 'Reporting',
      GOVERNANCE: 'Governance',
      FINANCIAL_CRIME: 'Financial Crime',
      COMPLAINTS: 'Complaints',
      FINANCIAL_PROMOTIONS: 'Financial Promotions',
      APPROVED_PERSONS: 'Approved Persons'
    }
    return labels[type] || type.replace(/_/g, ' ').split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
  }

  // ============ NOTICES ============
  async loadNotices(filters = {}) {
    try {
      // Build query params - use server-side pagination
      const params = new URLSearchParams()
      const pageSize = this.pageSize || 20
      const offset = ((this.currentPage || 1) - 1) * pageSize
      params.set('limit', String(pageSize))
      params.set('offset', String(offset))
      params.set('sortBy', this.sortBy || 'notice_date')
      params.set('sortOrder', this.sortDir || 'desc')

      // Add filters
      if (filters.search) params.set('entity_name', filters.search)
      if (filters.outcome_type) params.set('outcome_type', filters.outcome_type)
      if (filters.breach_type) params.set('breach_type', filters.breach_type)

      const response = await fetch(`/api/publications/notices?${params}`)
      const data = await response.json()

      if (data.success) {
        this.notices = data.notices || []
        this.filteredNotices = [...this.notices]
        // Store server-side total for pagination
        this.totalNotices = data.pagination?.total || this.notices.length
        this.renderTable()
      }
    } catch (error) {
      console.error('[publications] Failed to load notices:', error)
      this.renderEmptyTable('Failed to load notices')
    }
  }

  updateFinesCount() {
    const noticesWithFines = this.notices.filter(n => n.fine_amount && n.fine_amount > 0)
    const finesCount = noticesWithFines.length
    const totalFines = noticesWithFines.reduce((sum, n) => sum + Number(n.fine_amount || 0), 0)

    // Update count
    document.getElementById('total-fines').textContent = this.formatCurrency(totalFines)

    // Update helper text
    const finesHelper = document.getElementById('fines-helper')
    if (finesHelper) {
      finesHelper.textContent = `${this.formatNumber(finesCount)} cases with financial penalties`
    }
  }

  applyFilters() {
    const searchInput = document.getElementById('search-input')?.value?.trim() || ''
    const outcomeFilter = document.getElementById('outcome-filter')?.value || ''
    const breachFilter = document.getElementById('breach-filter')?.value || ''
    const riskFilter = document.getElementById('risk-filter')?.value || ''

    // Use server-side search for entity name
    const filters = {}
    if (searchInput) filters.search = searchInput
    if (outcomeFilter) filters.outcome_type = outcomeFilter
    if (breachFilter) filters.breach_type = breachFilter

    // Store current filters for pagination
    this.currentFilters = filters
    this.currentPage = 1

    // Show loading state
    const tbody = document.getElementById('notices-tbody')
    if (tbody) {
      tbody.innerHTML = `
        <tr class="loading-row">
          <td colspan="8">
            <div class="loading-state">
              <div class="loading-spinner"></div>
              <span>Searching...</span>
            </div>
          </td>
        </tr>
      `
    }

    // Load filtered notices from server
    this.loadNotices(filters).then(() => {
      // Apply client-side risk filter (not supported by API)
      if (riskFilter) {
        this.filteredNotices = this.notices.filter(notice => {
          const score = notice.risk_score || 0
          if (riskFilter === 'high' && score < 70) return false
          if (riskFilter === 'medium' && (score < 40 || score >= 70)) return false
          if (riskFilter === 'low' && score >= 40) return false
          return true
        })
        this.renderTable()
      }
      this.updateResultsCount()
    })

    this.currentPage = 1
  }

  sortNotices(column) {
    if (this.sortBy === column) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'
    } else {
      this.sortBy = column
      this.sortDir = 'desc'
    }

    // Reset to first page and fetch from server with new sort order
    this.currentPage = 1
    this.loadNotices(this.currentFilters || {})
    this.updateSortIndicators()
  }

  renderTable() {
    const tbody = document.getElementById('notices-tbody')
    if (!tbody) return

    const start = (this.currentPage - 1) * this.pageSize
    const end = start + this.pageSize
    const pageNotices = this.filteredNotices.slice(start, end)

    if (pageNotices.length === 0) {
      this.renderEmptyTable('No notices found')
      return
    }

    tbody.innerHTML = pageNotices.map(notice => this.renderTableRow(notice)).join('')
    this.renderPagination()
    this.updateResultsCount()
  }

  renderTableRow(notice) {
    const fineAmount = notice.fine_amount
      ? `£${Number(notice.fine_amount).toLocaleString()}`
      : '<span class="fine-amount no-fine">-</span>'

    const riskClass = notice.risk_score >= 70 ? 'risk-high'
      : notice.risk_score >= 40 ? 'risk-medium'
      : 'risk-low'

    const outcomeClass = `outcome-${notice.outcome_type || 'other'}`

    const noticeDate = notice.notice_date
      ? new Date(notice.notice_date).toLocaleDateString('en-GB')
      : '-'

    return `
      <tr class="clickable" onclick="publicationsDashboard.showDetail('${notice.publication_id}')">
        <td><strong>${this.escapeHtml(notice.entity_name || 'Unknown')}</strong></td>
        <td>${notice.frn || '-'}</td>
        <td><span class="outcome-badge ${outcomeClass}">${notice.outcome_type || 'other'}</span></td>
        <td class="fine-amount">${fineAmount}</td>
        <td>${notice.primary_breach_type || '-'}</td>
        <td><span class="risk-badge ${riskClass}">${notice.risk_score || 0}</span></td>
        <td>${noticeDate}</td>
        <td>
          ${notice.pdf_url ? `<a href="${notice.pdf_url}" target="_blank" class="action-btn view-pdf" onclick="event.stopPropagation()">PDF</a>` : ''}
          <button class="action-btn" onclick="event.stopPropagation(); publicationsDashboard.showDetail('${notice.publication_id}')">Details</button>
        </td>
      </tr>
    `
  }

  renderEmptyTable(message) {
    const tbody = document.getElementById('notices-tbody')
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8">
            <div class="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              <h3>${message}</h3>
              <p>Try adjusting your filters or run a backfill to populate data.</p>
            </div>
          </td>
        </tr>
      `
    }
  }

  renderPagination() {
    // Use server-side total for accurate total pages
    const total = this.totalNotices || this.filteredNotices.length
    const totalPages = Math.ceil(total / this.pageSize)
    const prevBtn = document.getElementById('prev-page')
    const nextBtn = document.getElementById('next-page')
    const pageNumbers = document.getElementById('page-numbers')

    if (prevBtn) prevBtn.disabled = this.currentPage <= 1
    if (nextBtn) nextBtn.disabled = this.currentPage >= totalPages

    if (pageNumbers) {
      let pages = []
      // Show up to 5 page numbers centered around current page
      let startPage = Math.max(1, this.currentPage - 2)
      let endPage = Math.min(totalPages, startPage + 4)
      if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4)
      }
      for (let i = startPage; i <= endPage; i++) {
        pages.push(`<span class="page-num ${i === this.currentPage ? 'active' : ''}" onclick="publicationsDashboard.goToPage(${i})">${i}</span>`)
      }
      pageNumbers.innerHTML = pages.join('')
    }

    const showingEl = document.getElementById('pagination-showing')
    if (showingEl) {
      // Use server-side total for accurate pagination
      const total = this.totalNotices || this.filteredNotices.length
      const start = total > 0 ? (this.currentPage - 1) * this.pageSize + 1 : 0
      const end = Math.min((this.currentPage - 1) * this.pageSize + this.filteredNotices.length, total)
      showingEl.textContent = `Showing ${start}-${end} of ${this.formatNumber(total)}`
    }
  }

  updateResultsCount() {
    const countEl = document.getElementById('results-count')
    if (countEl) {
      // Use server-side total for accurate count
      const total = this.totalNotices || this.filteredNotices.length
      countEl.textContent = `${this.formatNumber(total)} notices found`
    }
  }

  updateSortIndicators() {
    document.querySelectorAll('.data-table th.sortable').forEach(th => {
      th.classList.remove('sort-asc', 'sort-desc')
      if (th.dataset.sort === this.sortBy) {
        th.classList.add(`sort-${this.sortDir}`)
      }
    })
  }

  goToPage(page) {
    this.currentPage = page
    // Fetch new page data from server
    this.loadNotices(this.currentFilters || {})
  }

  // ============ WIDGETS ============
  renderTopFines() {
    const container = document.getElementById('top-fines-list')
    if (!container) return

    // Sort notices by fine amount (descending) and take top 5
    const topFines = [...this.notices]
      .filter(n => n.fine_amount && n.fine_amount > 0)
      .sort((a, b) => Number(b.fine_amount) - Number(a.fine_amount))
      .slice(0, 5)

    if (topFines.length === 0) {
      container.innerHTML = '<div class="empty-widget">No fines data available</div>'
      return
    }

    container.innerHTML = topFines.map((notice, i) => `
      <div class="top-fine-item" onclick="publicationsDashboard.showDetail('${notice.publication_id}')">
        <div class="top-fine-rank">${i + 1}</div>
        <div class="top-fine-details">
          <div class="top-fine-entity">${this.escapeHtml(notice.entity_name || 'Unknown')}</div>
          <div class="top-fine-meta">${notice.outcome_type || 'Fine'} • ${notice.notice_date ? new Date(notice.notice_date).getFullYear() : 'N/A'}</div>
        </div>
        <div class="top-fine-amount">${this.formatCurrency(notice.fine_amount)}</div>
      </div>
    `).join('')
  }

  renderRecentNotices() {
    const container = document.getElementById('recent-notices-list')
    if (!container) return

    // Sort by date and take most recent 5
    const recentNotices = [...this.notices]
      .filter(n => n.notice_date)
      .sort((a, b) => new Date(b.notice_date) - new Date(a.notice_date))
      .slice(0, 5)

    if (recentNotices.length === 0) {
      container.innerHTML = '<div class="empty-widget">No recent notices</div>'
      return
    }

    container.innerHTML = recentNotices.map(notice => `
      <div class="recent-notice-item" onclick="publicationsDashboard.showDetail('${notice.publication_id}')">
        <div class="recent-notice-icon">
          <span class="outcome-dot outcome-${notice.outcome_type || 'other'}"></span>
        </div>
        <div class="recent-notice-details">
          <div class="recent-notice-entity">${this.escapeHtml(notice.entity_name || 'Unknown')}</div>
          <div class="recent-notice-meta">
            ${notice.outcome_type || 'Unknown'}
            ${notice.fine_amount ? '• ' + this.formatCurrency(notice.fine_amount) : ''}
            • ${new Date(notice.notice_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
      </div>
    `).join('')
  }

  // ============ CHARTS ============
  renderCharts() {
    this.renderOutcomeChart()
    this.renderBreachChart()
    this.renderRiskChart()
    this.renderStatusChart()
    this.renderRecentNotices()
    this.setupChartYearFilters()
  }

  setupChartYearFilters() {
    // Get years from notices
    const years = [...new Set(
      this.notices
        .filter(n => n.notice_date)
        .map(n => new Date(n.notice_date).getFullYear())
    )].sort((a, b) => a - b)

    if (years.length === 0) return

    // Populate outcome year filter
    const outcomeFilter = document.getElementById('outcome-year-filter')
    if (outcomeFilter) {
      outcomeFilter.innerHTML = '<option value="">All Years</option>' +
        years.map(y => `<option value="${y}">${y}</option>`).join('')
      outcomeFilter.addEventListener('change', () => this.renderOutcomeChart(outcomeFilter.value))
    }

    // Populate breach year filter
    const breachFilter = document.getElementById('breach-year-filter')
    if (breachFilter) {
      breachFilter.innerHTML = '<option value="">All Years</option>' +
        years.map(y => `<option value="${y}">${y}</option>`).join('')
      breachFilter.addEventListener('change', () => this.renderBreachChart(breachFilter.value))
    }
  }

  renderOutcomeChart(filterYear = '') {
    const canvas = document.getElementById('outcomeChart')
    if (!canvas) return

    // Filter notices by year if specified
    let filteredNotices = this.notices
    if (filterYear) {
      filteredNotices = this.notices.filter(n => {
        const year = n.notice_date ? new Date(n.notice_date).getFullYear() : null
        return year === parseInt(filterYear)
      })
    }

    const outcomes = {}
    filteredNotices.forEach(n => {
      const type = n.outcome_type || 'other'
      outcomes[type] = (outcomes[type] || 0) + 1
    })

    const labels = Object.keys(outcomes)
    const data = Object.values(outcomes)
    const colors = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#6b7280']

    // Find top outcome for callout
    const callout = document.getElementById('outcome-callout')
    if (data.length === 0) {
      if (callout) callout.innerHTML = '<span class="callout-highlight">No data</span>'
      return
    }

    const maxIndex = data.indexOf(Math.max(...data))
    const topOutcome = labels[maxIndex]
    const topPercent = ((data[maxIndex] / filteredNotices.length) * 100).toFixed(1)

    if (callout) {
      const filterNote = filterYear ? ` (${filterYear})` : ''
      callout.innerHTML = `<span class="callout-highlight">Top Outcome:</span> ${topOutcome.charAt(0).toUpperCase() + topOutcome.slice(1)} (${topPercent}%)${filterNote}`
    }

    // Destroy existing chart
    if (this.charts.outcome) {
      this.charts.outcome.destroy()
    }

    this.charts.outcome = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
        datasets: [{
          data,
          backgroundColor: colors.slice(0, labels.length),
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    })
  }

  renderBreachChart(filterYear = '') {
    const canvas = document.getElementById('breachChart')
    if (!canvas) return

    // Filter notices by year if specified
    let filteredNotices = this.notices
    if (filterYear) {
      filteredNotices = this.notices.filter(n => {
        const year = n.notice_date ? new Date(n.notice_date).getFullYear() : null
        return year === parseInt(filterYear)
      })
    }

    const breaches = {}
    filteredNotices.forEach(n => {
      const type = n.primary_breach_type || 'Unknown'
      breaches[type] = (breaches[type] || 0) + 1
    })

    const labels = Object.keys(breaches)
    const data = Object.values(breaches)
    const colors = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

    // Find top breach for callout
    const callout = document.getElementById('breach-callout')
    if (data.length === 0) {
      if (callout) callout.innerHTML = '<span class="callout-highlight">No data</span>'
      return
    }

    const maxIndex = data.indexOf(Math.max(...data))
    const topBreach = labels[maxIndex]
    const topPercent = ((data[maxIndex] / filteredNotices.length) * 100).toFixed(1)

    if (callout) {
      const filterNote = filterYear ? ` (${filterYear})` : ''
      callout.innerHTML = `<span class="callout-highlight">Most Common:</span> ${topBreach} (${topPercent}%)${filterNote}`
    }

    // Destroy existing chart
    if (this.charts.breach) {
      this.charts.breach.destroy()
    }

    this.charts.breach = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors.slice(0, labels.length)
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right' }
        }
      }
    })
  }

  renderRiskChart() {
    const canvas = document.getElementById('riskChart')
    if (!canvas) return

    const riskBands = { 'High (70+)': 0, 'Medium (40-69)': 0, 'Low (0-39)': 0 }
    this.notices.forEach(n => {
      const score = n.risk_score || 0
      if (score >= 70) riskBands['High (70+)']++
      else if (score >= 40) riskBands['Medium (40-69)']++
      else riskBands['Low (0-39)']++
    })

    this.charts.risk = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: Object.keys(riskBands),
        datasets: [{
          data: Object.values(riskBands),
          backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    })
  }

  async renderStatusChart() {
    const canvas = document.getElementById('statusChart')
    if (!canvas) return

    try {
      const response = await fetch('/api/publications/status')
      const data = await response.json()

      const statuses = data.index?.byStatus || {}
      const labels = Object.keys(statuses)
      const values = Object.values(statuses)
      const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280']

      this.charts.status = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
          datasets: [{
            data: values,
            backgroundColor: colors.slice(0, labels.length)
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right' }
          }
        }
      })
    } catch (error) {
      console.error('[publications] Failed to render status chart:', error)
    }
  }

  async renderFinesTimelineChart() {
    const canvas = document.getElementById('finesTimelineChart')
    if (!canvas) return

    // Fetch fines timeline data from API (full dataset, not limited notices)
    try {
      const response = await fetch('/api/publications/insights/timeline')
      const result = await response.json()

      if (!result.success || !result.data || result.data.length === 0) {
        const callout = document.getElementById('timeline-callout')
        if (callout) {
          callout.innerHTML = '<span class="callout-highlight">Peak Year:</span> No fine data available'
        }
        return
      }

      // Store full timeline data for filtering
      this.finesTimelineData = result.data
        .filter(d => d.year && d.totalFines > 0)
        .sort((a, b) => a.year - b.year)

      // Populate year filter dropdowns
      this.populateTimelineFilters()

      // Setup filter event listeners
      this.setupTimelineFilterEvents()

      // Render chart with all data
      this.updateTimelineChart()
    } catch (error) {
      console.error('[publications] Failed to load fines timeline:', error)
      const callout = document.getElementById('timeline-callout')
      if (callout) {
        callout.innerHTML = '<span class="callout-highlight">Peak Year:</span> Failed to load data'
      }
    }
  }

  populateTimelineFilters() {
    const startSelect = document.getElementById('timeline-start-year')
    const endSelect = document.getElementById('timeline-end-year')
    const outcomeFilter = document.getElementById('outcome-year-filter')
    const breachFilter = document.getElementById('breach-year-filter')

    if (!this.finesTimelineData) return

    const years = this.finesTimelineData.map(d => d.year).sort((a, b) => a - b)
    const minYear = years[0]
    const maxYear = years[years.length - 1]

    // Populate timeline range filters
    if (startSelect && endSelect) {
      startSelect.innerHTML = '<option value="">From</option>'
      endSelect.innerHTML = '<option value="">To</option>'
      for (let year = minYear; year <= maxYear; year++) {
        startSelect.innerHTML += `<option value="${year}">${year}</option>`
        endSelect.innerHTML += `<option value="${year}">${year}</option>`
      }
    }

    // Populate year filters for other charts
    const yearOptions = '<option value="">All Years</option>' +
      years.map(y => `<option value="${y}">${y}</option>`).join('')

    if (outcomeFilter) outcomeFilter.innerHTML = yearOptions
    if (breachFilter) breachFilter.innerHTML = yearOptions
  }

  setupTimelineFilterEvents() {
    const startSelect = document.getElementById('timeline-start-year')
    const endSelect = document.getElementById('timeline-end-year')
    const resetBtn = document.getElementById('timeline-reset-btn')

    if (startSelect) {
      startSelect.addEventListener('change', () => this.updateTimelineChart())
    }
    if (endSelect) {
      endSelect.addEventListener('change', () => this.updateTimelineChart())
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (startSelect) startSelect.value = ''
        if (endSelect) endSelect.value = ''
        this.updateTimelineChart()
      })
    }

    // Setup outcome chart filter
    const outcomeFilter = document.getElementById('outcome-year-filter')
    if (outcomeFilter) {
      outcomeFilter.addEventListener('change', () => this.renderOutcomeChart(outcomeFilter.value))
    }

    // Setup breach chart filter
    const breachFilter = document.getElementById('breach-year-filter')
    if (breachFilter) {
      breachFilter.addEventListener('change', () => this.renderBreachChart(breachFilter.value))
    }
  }

  updateTimelineChart() {
    const canvas = document.getElementById('finesTimelineChart')
    if (!canvas || !this.finesTimelineData) return

    const startYear = document.getElementById('timeline-start-year')?.value
    const endYear = document.getElementById('timeline-end-year')?.value

    // Filter data by year range
    let filteredData = [...this.finesTimelineData]
    if (startYear) {
      filteredData = filteredData.filter(d => d.year >= parseInt(startYear))
    }
    if (endYear) {
      filteredData = filteredData.filter(d => d.year <= parseInt(endYear))
    }

    const years = filteredData.map(d => String(d.year))
    const amounts = filteredData.map(d => d.totalFines)

    // Find peak year for callout
    const callout = document.getElementById('timeline-callout')
    if (amounts.length === 0) {
      if (callout) {
        callout.innerHTML = '<span class="callout-highlight">Peak Year:</span> No data in range'
      }
      return
    }

    const maxAmount = Math.max(...amounts)
    const peakYearIndex = amounts.indexOf(maxAmount)
    const peakYear = years[peakYearIndex]

    if (callout) {
      const filterNote = (startYear || endYear) ? ' (filtered)' : ''
      callout.innerHTML = `<span class="callout-highlight">Peak Year:</span> ${peakYear} (${this.formatCurrency(maxAmount)})${filterNote}`
    }

    // Destroy existing chart if any
    if (this.charts.timeline) {
      this.charts.timeline.destroy()
    }

    this.charts.timeline = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: years,
        datasets: [{
          label: 'Total Fines',
          data: amounts,
          backgroundColor: years.map((y, i) => amounts[i] === maxAmount ? '#f59e0b' : '#3b82f6'),
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `£${(ctx.raw / 1000000).toFixed(1)}M`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => '£' + (value / 1000000).toFixed(0) + 'M'
            }
          }
        }
      }
    })
  }

  // ============ DETAIL MODAL ============
  showDetail(publicationId) {
    const notice = this.notices.find(n => n.publication_id === publicationId)
    if (!notice) return

    const modal = document.getElementById('detail-modal')
    const title = document.getElementById('modal-entity-name')
    const body = document.getElementById('modal-body')

    title.textContent = notice.entity_name || 'Unknown Entity'

    body.innerHTML = `
      <div class="detail-grid">
        <div class="detail-section">
          <div class="detail-label">FRN</div>
          <div class="detail-value">${notice.frn || 'N/A'}</div>
        </div>
        <div class="detail-section">
          <div class="detail-label">Entity Type</div>
          <div class="detail-value">${notice.entity_type || 'N/A'}</div>
        </div>
        <div class="detail-section">
          <div class="detail-label">Outcome Type</div>
          <div class="detail-value"><span class="outcome-badge outcome-${notice.outcome_type || 'other'}">${notice.outcome_type || 'other'}</span></div>
        </div>
        <div class="detail-section">
          <div class="detail-label">Fine Amount</div>
          <div class="detail-value">${notice.fine_amount ? '£' + Number(notice.fine_amount).toLocaleString() : 'No fine'}</div>
        </div>
        <div class="detail-section">
          <div class="detail-label">Primary Breach</div>
          <div class="detail-value">${notice.primary_breach_type || 'N/A'}</div>
        </div>
        <div class="detail-section">
          <div class="detail-label">Risk Score</div>
          <div class="detail-value"><span class="risk-badge ${notice.risk_score >= 70 ? 'risk-high' : notice.risk_score >= 40 ? 'risk-medium' : 'risk-low'}">${notice.risk_score || 0}/100</span></div>
        </div>
        <div class="detail-section">
          <div class="detail-label">Consumer Impact</div>
          <div class="detail-value">${notice.consumer_impact_level || 'Unknown'}</div>
        </div>
        <div class="detail-section">
          <div class="detail-label">Notice Date</div>
          <div class="detail-value">${notice.notice_date ? new Date(notice.notice_date).toLocaleDateString('en-GB') : 'N/A'}</div>
        </div>
      </div>

      <div class="detail-section" style="margin-top: 20px;">
        <div class="detail-label">AI Summary</div>
        <div class="detail-value">${notice.ai_summary || 'No summary available'}</div>
      </div>

      ${notice.handbook_references ? `
      <div class="detail-section">
        <div class="detail-label">Handbook References</div>
        <div class="detail-tags">
          ${this.parseJson(notice.handbook_references).map(ref => `<span class="detail-tag">${ref}</span>`).join('')}
        </div>
      </div>
      ` : ''}

      ${notice.key_findings ? `
      <div class="detail-section">
        <div class="detail-label">Key Findings</div>
        <ul style="margin: 0; padding-left: 20px;">
          ${this.parseJson(notice.key_findings).map(f => `<li>${f}</li>`).join('')}
        </ul>
      </div>
      ` : ''}

      ${notice.pdf_url ? `
      <div class="detail-section" style="margin-top: 20px;">
        <a href="${notice.pdf_url}" target="_blank" class="btn btn-primary">View Original PDF</a>
      </div>
      ` : ''}
    `

    modal.style.display = 'flex'
  }

  closeModal() {
    const modal = document.getElementById('detail-modal')
    if (modal) modal.style.display = 'none'
  }

  // ============ EVENTS ============
  setupEventListeners() {
    // Filters
    document.getElementById('apply-filters')?.addEventListener('click', () => this.applyFilters())
    document.getElementById('reset-filters')?.addEventListener('click', () => this.resetFilters())
    document.getElementById('search-input')?.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') this.applyFilters()
    })

    // Sorting
    document.querySelectorAll('.data-table th.sortable').forEach(th => {
      th.addEventListener('click', () => this.sortNotices(th.dataset.sort))
    })

    // Pagination - use server-side pagination
    document.getElementById('prev-page')?.addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.goToPage(this.currentPage - 1)
      }
    })
    document.getElementById('next-page')?.addEventListener('click', () => {
      const total = this.totalNotices || this.filteredNotices.length
      const totalPages = Math.ceil(total / this.pageSize)
      if (this.currentPage < totalPages) {
        this.goToPage(this.currentPage + 1)
      }
    })
    document.getElementById('page-size')?.addEventListener('change', (e) => {
      this.pageSize = parseInt(e.target.value)
      this.currentPage = 1
      this.renderTable()
    })

    // Modal
    document.getElementById('close-modal')?.addEventListener('click', () => this.closeModal())
    document.getElementById('detail-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'detail-modal') this.closeModal()
    })

    // Refresh
    document.getElementById('refresh-btn')?.addEventListener('click', () => {
      this.loadStats()
      this.loadNotices()
    })

    // Export
    document.getElementById('export-btn')?.addEventListener('click', () => this.exportCsv())
  }

  resetFilters() {
    document.getElementById('search-input').value = ''
    document.getElementById('outcome-filter').value = ''
    document.getElementById('breach-filter').value = ''
    document.getElementById('risk-filter').value = ''
    this.filteredNotices = [...this.notices]
    this.currentPage = 1
    this.renderTable()
  }

  exportCsv() {
    const headers = ['Entity Name', 'FRN', 'Outcome', 'Fine Amount', 'Breach Type', 'Risk Score', 'Date', 'Summary']
    const rows = this.filteredNotices.map(n => [
      n.entity_name || '',
      n.frn || '',
      n.outcome_type || '',
      n.fine_amount || '',
      n.primary_breach_type || '',
      n.risk_score || '',
      n.notice_date || '',
      (n.ai_summary || '').replace(/"/g, '""')
    ])

    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `fca-publications-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ============ UTILS ============
  escapeHtml(str) {
    if (!str) return ''
    return str.replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c])
  }

  parseJson(val) {
    if (!val) return []
    if (Array.isArray(val)) return val
    try {
      return JSON.parse(val)
    } catch {
      return []
    }
  }

  // ============ DEEP INSIGHTS ============
  async loadDeepInsights() {
    try {
      // Load all deep insight data in parallel
      const [
        caseStudiesRes,
        outcomeAnalysisRes,
        breachSummaryRes,
        handbookRes,
        findingsRes,
        yearlyBreakdownRes,
        reoffendersRes,
        ruleCitationsRes
      ] = await Promise.all([
        fetch('/api/publications/insights/case-studies?limit=5'),
        fetch('/api/publications/insights/outcome-analysis'),
        fetch('/api/publications/insights/breach-summary'),
        fetch('/api/publications/insights/handbook-stats?limit=12'),
        fetch('/api/publications/insights/common-findings?limit=10'),
        fetch('/api/publications/insights/yearly-breakdown'),
        fetch('/api/publications/insights/reoffenders?limit=50'),
        fetch('/api/publications/insights/rule-citations')
      ])

      const [caseStudies, outcomeAnalysis, breachSummary, handbook, findings, yearlyBreakdown, reoffenders, ruleCitations] = await Promise.all([
        caseStudiesRes.json(),
        outcomeAnalysisRes.json(),
        breachSummaryRes.json(),
        handbookRes.json(),
        findingsRes.json(),
        yearlyBreakdownRes.json(),
        reoffendersRes.json(),
        ruleCitationsRes.json()
      ])

      // Store data
      this.caseStudies = caseStudies.data || []
      this.outcomeAnalysis = outcomeAnalysis.data || { outcomes: [], total: 0, insight: null }
      this.ruleCitations = ruleCitations.data || []
      this.breachSummary = breachSummary.data || []
      this.handbookStats = handbook.data || []
      this.commonFindings = findings.data || []
      this.yearlyBreakdown = yearlyBreakdown.data || []
      this.reoffenders = reoffenders.data || []

      // Render all sections
      this.renderDeepQuickStats()
      this.renderOutcomeAnalysis()
      this.renderCommonFindings()
      this.renderCaseStudySpotlight()
      this.renderBreachTypeGrid()
      this.renderHandbookBars()
      this.renderDeepTakeaways()
      this.renderYearlyBreakdown()
      this.renderReoffenders()
      this.renderRiskIndicators()

    } catch (error) {
      console.error('[publications] Failed to load deep insights:', error)
    }
  }

  renderDeepQuickStats() {
    // Total cases - use outcome analysis total (queries ALL records)
    const totalCases = this.outcomeAnalysis?.outcomes?.reduce((sum, o) => sum + (o.count || 0), 0) || 0
    const totalCasesEl = document.getElementById('total-cases-stat')
    if (totalCasesEl) totalCasesEl.textContent = this.formatNumber(totalCases)

    // Top outcome type
    const topOutcome = this.outcomeAnalysis?.outcomes?.[0]
    const topOutcomeEl = document.getElementById('top-outcome-stat')
    if (topOutcomeEl) topOutcomeEl.textContent = topOutcome?.label || '-'

    // Total fines stat - use stats API data (queries ALL records)
    const totalFines = this.finesStats?.fines?.total || 0
    const totalFinesEl = document.getElementById('total-fines-stat')
    if (totalFinesEl) totalFinesEl.textContent = this.formatCurrency(totalFines)

    // Top breach type
    const topBreach = this.breachSummary[0]
    const topBreachEl = document.getElementById('top-breach-stat')
    if (topBreachEl) topBreachEl.textContent = topBreach ? this.formatBreachLabel(topBreach.breachType) : '-'
  }

  renderOutcomeAnalysis() {
    const container = document.getElementById('outcome-analysis-grid')
    const insightBox = document.getElementById('outcome-insight-box')
    if (!container) return

    const outcomes = this.outcomeAnalysis?.outcomes || []
    if (outcomes.length === 0) {
      container.innerHTML = '<div class="empty-deep">No outcome data available</div>'
      return
    }

    const maxCount = outcomes[0]?.count || 1

    // Outcome colors
    const outcomeColors = {
      'cancellation': '#ef4444',
      'prohibition': '#f97316',
      'fine': '#f59e0b',
      'restriction': '#eab308',
      'censure': '#84cc16',
      'public_statement': '#22c55e',
      'warning': '#14b8a6',
      'supervisory_notice': '#06b6d4',
      'voluntary_requirement': '#3b82f6',
      'other': '#64748b'
    }

    // Render all outcome types with accordion structure
    container.innerHTML = outcomes.map(outcome => {
      const widthPercent = (outcome.count / maxCount * 100).toFixed(0)
      const color = outcomeColors[outcome.type] || '#64748b'
      return `
        <div class="outcome-row" data-outcome="${outcome.type}" data-color="${color}">
          <div class="outcome-header">
            <span class="expand-toggle">▶</span>
            <div class="outcome-info">
              <span class="outcome-label">${outcome.label}</span>
              <span class="outcome-desc">${outcome.description}</span>
            </div>
            <div class="outcome-bar-container">
              <div class="outcome-bar" style="width: ${widthPercent}%; background: ${color}"></div>
            </div>
            <div class="outcome-stats">
              <span class="outcome-count">${this.formatNumber(outcome.count)}</span>
              <span class="outcome-pct">${outcome.percentage}%</span>
            </div>
            <button class="filter-btn outcome-filter-btn" title="Filter table to show only ${outcome.label}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
              </svg>
            </button>
          </div>
          <div class="breach-breakdown" style="display: none;">
            <div class="breach-loading">Loading breach breakdown...</div>
          </div>
        </div>
      `
    }).join('')

    // Add insight
    if (insightBox && this.outcomeAnalysis?.insight) {
      insightBox.innerHTML = `
        <div class="outcome-insight-content">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <p>${this.outcomeAnalysis.insight}</p>
        </div>
      `
    }

    // Set up event handlers for accordion and filtering
    this.setupOutcomeAccordionHandlers(container)
  }

  setupOutcomeAccordionHandlers(container) {
    container.querySelectorAll('.outcome-row').forEach(row => {
      const header = row.querySelector('.outcome-header')
      const filterBtn = row.querySelector('.outcome-filter-btn')
      const outcomeType = row.dataset.outcome

      // Toggle accordion on header click (excluding filter button)
      header.addEventListener('click', async (e) => {
        if (e.target.closest('.filter-btn')) return // Don't toggle if clicking filter

        const breakdown = row.querySelector('.breach-breakdown')
        const toggle = row.querySelector('.expand-toggle')

        // Highlight selected row
        container.querySelectorAll('.outcome-row').forEach(r => r.classList.remove('selected'))
        row.classList.add('selected')

        if (breakdown.style.display === 'none') {
          // Fetch and show breach data
          await this.fetchAndRenderBreachBreakdown(row, outcomeType)
          breakdown.style.display = 'block'
          toggle.textContent = '▼'
          row.classList.add('expanded')
        } else {
          breakdown.style.display = 'none'
          toggle.textContent = '▶'
          row.classList.remove('expanded')
        }
      })

      // Filter button - filter table to this outcome
      filterBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        document.getElementById('outcome-filter').value = outcomeType
        document.getElementById('breach-filter').value = '' // Clear breach filter
        this.applyFilters()
        this.scrollToTable()
      })
    })
  }

  async fetchAndRenderBreachBreakdown(row, outcomeType) {
    const breakdown = row.querySelector('.breach-breakdown')

    try {
      const response = await fetch(`/api/publications/insights/outcome-breaches/${encodeURIComponent(outcomeType)}`)
      const data = await response.json()

      if (!data.success || !data.data?.breaches?.length) {
        breakdown.innerHTML = '<div class="breach-empty">No breach data for this outcome</div>'
        return
      }

      const breaches = data.data.breaches
      const maxCount = breaches[0]?.count || 1

      breakdown.innerHTML = `
        <div class="breach-list-header">Breach Types for ${this.formatOutcomeLabel(outcomeType)}:</div>
        <div class="breach-list">
          ${breaches.map(breach => {
            const widthPercent = (breach.count / maxCount * 100).toFixed(0)
            return `
              <div class="breach-item" data-breach="${breach.type}">
                <span class="breach-label">${breach.label}</span>
                <div class="breach-mini-bar-container">
                  <div class="breach-mini-bar" style="width: ${widthPercent}%"></div>
                </div>
                <span class="breach-count">${this.formatNumber(breach.count)}</span>
                <span class="breach-pct">${breach.percentage}%</span>
                <button class="filter-btn breach-filter-btn" title="Filter to ${this.formatOutcomeLabel(outcomeType)} + ${breach.label}">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                  </svg>
                </button>
              </div>
            `
          }).join('')}
        </div>
      `

      // Add click handlers for breach filter buttons
      breakdown.querySelectorAll('.breach-filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation()
          const breachItem = btn.closest('.breach-item')
          const breachType = breachItem.dataset.breach

          document.getElementById('outcome-filter').value = outcomeType
          document.getElementById('breach-filter').value = breachType
          this.applyFilters()
          this.scrollToTable()
        })
      })

    } catch (error) {
      console.error('[publications] Failed to fetch breach breakdown:', error)
      breakdown.innerHTML = '<div class="breach-empty">Failed to load breach data</div>'
    }
  }

  scrollToTable() {
    const table = document.getElementById('notices-table')
    if (table) {
      table.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  async renderRiskIndicators() {
    const container = document.getElementById('risk-indicators-list')
    if (!container) return

    try {
      const response = await fetch('/api/publications/insights/risk-indicators')
      const result = await response.json()

      if (!result.success || !result.data || result.data.length === 0) {
        container.innerHTML = '<div class="empty-deep">No risk indicator data available</div>'
        return
      }

      const indicators = result.data
      const totalCases = result.totalCases || 1
      const maxCases = indicators[0]?.caseCount || 1

      container.innerHTML = `
        ${indicators.slice(0, 8).map((indicator, index) => {
          const riskColor = {
            high: '#ef4444',
            medium: '#f97316',
            low: '#eab308'
          }[indicator.riskLevel] || '#64748b'

          const barWidth = (indicator.caseCount / maxCases * 100).toFixed(0)

          return `
            <div class="risk-bar-row" data-breach="${indicator.breachType}">
              <div class="risk-bar-rank">${index + 1}</div>
              <div class="risk-bar-content">
                <div class="risk-bar-header">
                  <span class="risk-bar-label">${this.escapeHtml(indicator.label)}</span>
                  <div class="risk-bar-badges">
                    <span class="risk-case-badge">${this.formatNumber(indicator.caseCount)} cases</span>
                    <span class="risk-fine-badge">${this.formatCurrency(indicator.totalFines)}</span>
                  </div>
                </div>
                <div class="risk-bar-track">
                  <div class="risk-bar-fill" style="width: ${barWidth}%; background: linear-gradient(90deg, ${riskColor}, ${riskColor}dd)"></div>
                  <span class="risk-bar-pct">${indicator.percentage}%</span>
                </div>
              </div>
              <button class="risk-view-btn" title="View ${indicator.label} cases">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </div>
          `
        }).join('')}
        <div class="risk-indicators-footer">
          <span>Based on ${this.formatNumber(totalCases)} enforcement actions</span>
        </div>
      `

      // Add click handlers for filtering
      container.querySelectorAll('.risk-bar-row').forEach(row => {
        const viewBtn = row.querySelector('.risk-view-btn')
        const breachType = row.dataset.breach

        const handleFilter = () => {
          document.getElementById('breach-filter').value = breachType
          document.getElementById('outcome-filter').value = ''
          this.applyFilters()
          this.scrollToTable()
        }

        row.addEventListener('click', handleFilter)
        viewBtn?.addEventListener('click', (e) => {
          e.stopPropagation()
          handleFilter()
        })
      })
    } catch (error) {
      console.error('[publications] Failed to render risk indicators:', error)
      container.innerHTML = '<div class="empty-deep">Failed to load risk indicators</div>'
    }
  }

  renderDeepTopFines() {
    const container = document.getElementById('top-fines-deep-list')
    if (!container) return

    if (!this.topFinesDeep || this.topFinesDeep.length === 0) {
      container.innerHTML = '<div class="empty-deep">No fines data available</div>'
      return
    }

    container.innerHTML = this.topFinesDeep.slice(0, 5).map((fine, i) => {
      const summary = fine.ai_summary || 'No summary available'
      const shortSummary = summary.length > 120 ? summary.slice(0, 120) + '...' : summary
      return `
        <div class="deep-fine-item">
          <div class="deep-fine-rank">${i + 1}</div>
          <div class="deep-fine-content">
            <div class="deep-fine-header">
              <span class="deep-fine-entity">${this.escapeHtml(fine.entity_name)}</span>
              <span class="deep-fine-amount">${this.formatCurrency(fine.fine_amount)}</span>
            </div>
            <div class="deep-fine-meta">
              ${fine.primary_breach_type || 'Unknown'} | ${fine.year || 'N/A'}
            </div>
            <div class="deep-fine-summary">${this.escapeHtml(shortSummary)}</div>
          </div>
        </div>
      `
    }).join('')
  }

  renderCommonFindings() {
    const container = document.getElementById('common-findings-list')
    if (!container) return

    if (!this.commonFindings || this.commonFindings.length === 0) {
      container.innerHTML = '<div class="empty-deep">No findings data available</div>'
      return
    }

    const maxFreq = this.commonFindings[0]?.frequency || 1

    container.innerHTML = this.commonFindings.slice(0, 8).map((item, i) => {
      const widthPercent = (item.frequency / maxFreq * 100).toFixed(0)
      return `
        <div class="finding-item">
          <div class="finding-rank">${i + 1}</div>
          <div class="finding-content">
            <div class="finding-text">${this.escapeHtml(item.finding)}</div>
            <div class="finding-bar-wrap">
              <div class="finding-bar" style="width: ${widthPercent}%"></div>
            </div>
          </div>
          <div class="finding-count">${item.frequency}</div>
        </div>
      `
    }).join('')
  }

  renderFineModifiers() {
    // Aggravating factors
    const aggContainer = document.getElementById('aggravating-factors-list')
    if (aggContainer) {
      if (!this.fineModifiers.aggravating || this.fineModifiers.aggravating.length === 0) {
        aggContainer.innerHTML = '<div class="empty-deep">No data available</div>'
      } else {
        aggContainer.innerHTML = this.fineModifiers.aggravating.slice(0, 6).map(item => `
          <div class="modifier-item">
            <div class="modifier-factor">${this.escapeHtml(item.factor)}</div>
            <div class="modifier-stats">
              <span class="modifier-count">${item.count} cases</span>
              <span class="modifier-avg">Avg: ${this.formatCurrency(item.avgFine)}</span>
            </div>
          </div>
        `).join('')
      }
    }

    // Mitigating factors
    const mitContainer = document.getElementById('mitigating-factors-list')
    if (mitContainer) {
      if (!this.fineModifiers.mitigating || this.fineModifiers.mitigating.length === 0) {
        mitContainer.innerHTML = '<div class="empty-deep">No data available</div>'
      } else {
        mitContainer.innerHTML = this.fineModifiers.mitigating.slice(0, 6).map(item => `
          <div class="modifier-item">
            <div class="modifier-factor">${this.escapeHtml(item.factor)}</div>
            <div class="modifier-stats">
              <span class="modifier-count">${item.count} cases</span>
              <span class="modifier-avg">Avg: ${this.formatCurrency(item.avgFine)}</span>
            </div>
          </div>
        `).join('')
      }
    }
  }

  renderCaseStudySpotlight() {
    const container = document.getElementById('case-study-spotlight')
    const dotsContainer = document.getElementById('case-dots')
    if (!container) return

    if (!this.caseStudies || this.caseStudies.length === 0) {
      container.innerHTML = '<div class="empty-deep">No case studies available</div>'
      return
    }

    // Render dots
    if (dotsContainer) {
      dotsContainer.innerHTML = this.caseStudies.map((_, i) =>
        `<span class="case-dot ${i === this.currentCaseIndex ? 'active' : ''}" data-index="${i}"></span>`
      ).join('')
    }

    // Render current case
    this.renderCurrentCase()
  }

  renderCurrentCase() {
    const container = document.getElementById('case-study-spotlight')
    if (!container || !this.caseStudies.length) return

    const caseData = this.caseStudies[this.currentCaseIndex]
    const keyFindings = this.parseJson(caseData.key_findings).slice(0, 4)
    const handbookRefs = this.parseJson(caseData.handbook_references).slice(0, 5)
    const aggFactors = this.parseJson(caseData.aggravating_factors).slice(0, 3)
    const mitFactors = this.parseJson(caseData.mitigating_factors).slice(0, 3)

    const noticeDate = caseData.notice_date
      ? new Date(caseData.notice_date).getFullYear()
      : 'N/A'

    container.innerHTML = `
      <div class="case-spotlight-card">
        <div class="case-spotlight-header">
          <div class="case-spotlight-badge">CASE STUDY ${this.currentCaseIndex + 1}/${this.caseStudies.length}</div>
          <div class="case-spotlight-fine">${this.formatCurrency(caseData.fine_amount)}</div>
        </div>

        <h3 class="case-spotlight-entity">${this.escapeHtml(caseData.entity_name)}</h3>
        <div class="case-spotlight-meta">
          ${caseData.frn ? `FRN: ${caseData.frn}` : ''} |
          ${caseData.outcome_type || 'Fine'} |
          ${noticeDate}
        </div>

        <div class="case-spotlight-summary">
          ${this.escapeHtml(caseData.ai_summary || 'No summary available')}
        </div>

        ${keyFindings.length > 0 ? `
          <div class="case-section">
            <h4>Key Findings</h4>
            <ul class="case-findings-list">
              ${keyFindings.map(f => `<li>${this.escapeHtml(f)}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${handbookRefs.length > 0 ? `
          <div class="case-section">
            <h4>Handbook Breaches</h4>
            <div class="case-tags">
              ${handbookRefs.map(ref => `<span class="case-tag">${this.escapeHtml(ref)}</span>`).join('')}
            </div>
          </div>
        ` : ''}

        <div class="case-factors-grid">
          ${aggFactors.length > 0 ? `
            <div class="case-factors agg">
              <h4><span class="factor-icon red">+</span> Aggravating</h4>
              <ul>
                ${aggFactors.map(f => `<li>${this.escapeHtml(f)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          ${mitFactors.length > 0 ? `
            <div class="case-factors mit">
              <h4><span class="factor-icon green">-</span> Mitigating</h4>
              <ul>
                ${mitFactors.map(f => `<li>${this.escapeHtml(f)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>

        ${caseData.pdf_url ? `
          <a href="${caseData.pdf_url}" target="_blank" class="case-view-link">
            View Full Notice
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        ` : ''}
      </div>
    `

    // Update dots
    document.querySelectorAll('.case-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === this.currentCaseIndex)
    })

    // Update nav buttons
    const prevBtn = document.getElementById('prev-case')
    const nextBtn = document.getElementById('next-case')
    if (prevBtn) prevBtn.disabled = this.currentCaseIndex === 0
    if (nextBtn) nextBtn.disabled = this.currentCaseIndex === this.caseStudies.length - 1
  }

  renderBreachTypeGrid() {
    const container = document.getElementById('breach-type-grid')
    if (!container) return

    if (!this.breachSummary || this.breachSummary.length === 0) {
      container.innerHTML = '<div class="empty-deep">No breach data available</div>'
      return
    }

    const totalFines = this.breachSummary.reduce((sum, b) => sum + b.totalFines, 0)

    container.innerHTML = this.breachSummary.map(breach => {
      const finesPercent = totalFines > 0 ? ((breach.totalFines / totalFines) * 100).toFixed(1) : 0
      return `
        <div class="breach-type-card" data-breach="${breach.breachType}">
          <div class="breach-type-header">
            <span class="breach-type-name">${this.formatBreachLabel(breach.breachType)}</span>
            <span class="breach-type-cases">${breach.caseCount} cases</span>
          </div>
          <div class="breach-type-fines">
            <span class="breach-type-total">${this.formatCurrency(breach.totalFines)}</span>
            <span class="breach-type-pct">${finesPercent}% of all fines</span>
          </div>
          <div class="breach-type-example">
            <span class="breach-example-label">Largest:</span>
            ${breach.topCase?.entity || 'N/A'} - ${this.formatCurrency(breach.topCase?.fine || 0)}
          </div>
          <button class="breach-expand-btn">View Details</button>
        </div>
      `
    }).join('')
  }

  async showBreachDetail(breachType) {
    const panel = document.getElementById('breach-detail-panel')
    const content = document.getElementById('breach-detail-content')
    if (!panel || !content) return

    content.innerHTML = '<div class="loading-deep">Loading breach details...</div>'
    panel.style.display = 'block'

    try {
      const response = await fetch(`/api/publications/insights/breach-analysis/${encodeURIComponent(breachType)}`)
      const data = await response.json()

      if (!data.success || !data.data) {
        content.innerHTML = '<div class="empty-deep">Failed to load breach details</div>'
        return
      }

      const breach = data.data

      content.innerHTML = `
        <div class="breach-detail-header">
          <h3>${this.formatBreachLabel(breach.breachType)}</h3>
          <div class="breach-detail-stats">
            <div class="breach-stat">
              <span class="breach-stat-value">${breach.stats.totalCases}</span>
              <span class="breach-stat-label">Cases</span>
            </div>
            <div class="breach-stat">
              <span class="breach-stat-value">${this.formatCurrency(breach.stats.totalFines)}</span>
              <span class="breach-stat-label">Total Fines</span>
            </div>
            <div class="breach-stat">
              <span class="breach-stat-value">${this.formatCurrency(breach.stats.avgFine)}</span>
              <span class="breach-stat-label">Average</span>
            </div>
            <div class="breach-stat">
              <span class="breach-stat-value">${this.formatCurrency(breach.stats.maxFine)}</span>
              <span class="breach-stat-label">Largest</span>
            </div>
          </div>
        </div>

        ${breach.topHandbookRefs?.length > 0 ? `
          <div class="breach-detail-section">
            <h4>Common Handbook References</h4>
            <div class="handbook-ref-list">
              ${breach.topHandbookRefs.map(ref => `
                <div class="handbook-ref-item">
                  <span class="handbook-ref-name">${this.escapeHtml(ref.ref)}</span>
                  <span class="handbook-ref-count">${ref.count} citations</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <div class="breach-detail-section">
          <h4>Example Cases</h4>
          <div class="breach-examples-list">
            ${breach.examples?.map(ex => `
              <div class="breach-example-card">
                <div class="breach-example-header">
                  <span class="breach-example-entity">${this.escapeHtml(ex.entity_name)}</span>
                  <span class="breach-example-fine">${this.formatCurrency(ex.fine_amount)}</span>
                </div>
                <div class="breach-example-year">${ex.year || 'N/A'}</div>
                <div class="breach-example-summary">${this.escapeHtml(ex.ai_summary || 'No summary')}</div>
              </div>
            `).join('') || '<div class="empty-deep">No examples available</div>'}
          </div>
        </div>
      `
    } catch (error) {
      console.error('[publications] Failed to load breach details:', error)
      content.innerHTML = '<div class="empty-deep">Failed to load breach details</div>'
    }
  }

  renderHandbookBars() {
    const container = document.getElementById('handbook-bars')
    const insightBox = document.getElementById('handbook-insight')
    if (!container) return

    // Merge handbook stats with rule citations for richer data
    const ruleCitationsMap = {}
    if (this.ruleCitations && this.ruleCitations.length > 0) {
      this.ruleCitations.forEach(citation => {
        // API returns 'rule' field for the handbook reference
        ruleCitationsMap[citation.rule] = citation
      })
    }

    // Use handbook stats as the primary source, enrich with rule citations
    const statsToUse = this.handbookStats && this.handbookStats.length > 0
      ? this.handbookStats
      : (this.ruleCitations || []).map(c => ({ reference: c.rule, count: c.caseCount }))

    if (!statsToUse || statsToUse.length === 0) {
      container.innerHTML = '<div class="empty-deep">No handbook data available</div>'
      return
    }

    const maxCount = statsToUse[0]?.count || 1
    const rules = window.FCA_HANDBOOK_RULES || {}

    container.innerHTML = statsToUse.slice(0, 12).map((item, index) => {
      const ref = item.reference || item.handbook_ref
      const ruleInfo = rules[ref] || {}
      const citation = ruleCitationsMap[ref] || {}
      const widthPercent = (item.count / maxCount * 100).toFixed(0)

      // Get category color
      const categoryColors = {
        'Principles': '#3b82f6',
        'Systems & Controls': '#8b5cf6',
        'Supervision': '#f59e0b',
        'Conduct of Business': '#10b981',
        'Client Assets': '#ef4444',
        'Market Conduct': '#ec4899',
        'Senior Managers': '#6366f1'
      }
      const categoryColor = categoryColors[ruleInfo.category] || '#64748b'

      // Use item.totalFines/avgFine first (from handbook-stats), fall back to ruleCitations
      const totalFines = item.totalFines || citation.totalFines || 0
      const avgFine = item.avgFine || citation.avgFine || 0
      const caseCount = item.count || citation.caseCount || 0

      return `
        <div class="handbook-rule-card" data-rule="${this.escapeHtml(ref)}">
          <div class="rule-card-header">
            <div class="rule-badge" style="background: ${categoryColor}20; color: ${categoryColor}; border-color: ${categoryColor}40">
              ${this.escapeHtml(ref)}
            </div>
            <span class="rule-case-count">${caseCount} cases</span>
          </div>
          <div class="rule-card-title">${this.escapeHtml(ruleInfo.title || ref)}</div>
          <div class="rule-card-summary">${this.escapeHtml(ruleInfo.summary || 'Regulatory requirement')}</div>
          <div class="rule-card-bar-wrap">
            <div class="rule-card-bar" style="width: ${widthPercent}%; background: ${categoryColor}"></div>
          </div>
          ${ruleInfo.implications ? `
          <div class="rule-card-implications">
            <strong>Common Issues:</strong> ${this.escapeHtml(ruleInfo.implications)}
          </div>
          ` : ''}
          <div class="rule-card-stats">
            <div class="rule-stat">
              <span class="rule-stat-value">${this.formatCurrency(totalFines)}</span>
              <span class="rule-stat-label">Total Fines</span>
            </div>
            <div class="rule-stat">
              <span class="rule-stat-value">${this.formatCurrency(avgFine)}</span>
              <span class="rule-stat-label">Avg Fine</span>
            </div>
          </div>
          ${ruleInfo.typicalBreaches && ruleInfo.typicalBreaches.length > 0 ? `
          <div class="rule-card-breaches">
            <div class="rule-breaches-label">Typical Breaches:</div>
            <ul class="rule-breaches-list">
              ${ruleInfo.typicalBreaches.slice(0, 3).map(b => `<li>${this.escapeHtml(b)}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
        </div>
      `
    }).join('')

    // Add insight
    if (insightBox && statsToUse.length >= 2) {
      const top1 = statsToUse[0]
      const top2 = statsToUse[1]
      const top1Info = rules[top1.reference] || {}
      const top2Info = rules[top2.reference] || {}
      insightBox.innerHTML = `
        <div class="handbook-insight-content">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <div>
            <p>
              <strong>${top1.reference}</strong> (${top1Info.title || 'Regulatory Rule'}) and
              <strong>${top2.reference}</strong> (${top2Info.title || 'Regulatory Rule'}) are the most frequently breached.
            </p>
            <p class="insight-action">Focus compliance training, policies, and internal controls on these areas to reduce enforcement risk.</p>
          </div>
        </div>
      `
    }
  }

  renderDeepTakeaways() {
    const container = document.getElementById('takeaways-deep-grid')
    if (!container) return

    // Generate takeaways based on enforcement patterns
    const takeaways = []

    // From outcome analysis - primary focus
    if (this.outcomeAnalysis?.outcomes?.length > 0) {
      const topOutcome = this.outcomeAnalysis.outcomes[0]
      const secondOutcome = this.outcomeAnalysis.outcomes[1]

      takeaways.push({
        icon: '1',
        title: `${topOutcome.percentage}% Result in ${topOutcome.label}`,
        content: topOutcome.type === 'cancellation'
          ? 'Most FCA enforcement leads to licence revocation - often before fines are even considered. Maintain your authorisation requirements.'
          : `${topOutcome.label} is the dominant enforcement action. Understand what triggers this outcome and focus controls accordingly.`,
        color: '#ef4444'
      })

      if (secondOutcome) {
        takeaways.push({
          icon: '2',
          title: `${secondOutcome.label}: ${secondOutcome.percentage}% of Actions`,
          content: secondOutcome.description || `The second most common outcome. Combined with ${topOutcome.label}, these two cover the majority of enforcement actions.`,
          color: '#f97316'
        })
      }
    }

    // From breach summary - what triggers enforcement
    if (this.breachSummary.length > 0) {
      const topBreach = this.breachSummary[0]
      takeaways.push({
        icon: '3',
        title: `${this.formatBreachLabel(topBreach.breachType)} Triggers Most Actions`,
        content: `${topBreach.caseCount} enforcement cases stem from this breach type. Prioritise controls and training in this area to reduce regulatory risk.`,
        color: '#f59e0b'
      })
    }

    // From handbook stats - which rules matter most
    if (this.handbookStats.length >= 2) {
      const top1 = this.handbookStats[0]
      const top2 = this.handbookStats[1]
      takeaways.push({
        icon: '4',
        title: `Focus on ${top1.reference} & ${top2.reference}`,
        content: `These handbook sections are most frequently cited in enforcement. Build your compliance framework around these foundational requirements.`,
        color: '#3b82f6'
      })
    }

    // From common findings - practical learnings
    if (this.commonFindings.length > 0) {
      const topFinding = this.commonFindings[0]
      takeaways.push({
        icon: '5',
        title: 'Basic Control Failures Dominate',
        content: `"${topFinding.finding}" appears in ${topFinding.frequency} cases. Most enforcement stems from fundamental control gaps, not complex regulatory failures.`,
        color: '#8b5cf6'
      })
    }

    // Practical advice
    takeaways.push({
      icon: '6',
      title: 'Early Action Reduces Severity',
      content: 'Self-reporting and prompt remediation significantly reduce enforcement outcomes. Build a rapid response capability for compliance issues.',
      color: '#10b981'
    })

    container.innerHTML = takeaways.map(t => `
      <div class="takeaway-deep-card">
        <div class="takeaway-deep-number" style="background: ${t.color}">${t.icon}</div>
        <div class="takeaway-deep-content">
          <h4>${t.title}</h4>
          <p>${t.content}</p>
        </div>
      </div>
    `).join('')
  }

  setupDeepInsightsEvents() {
    // Tab switching
    document.querySelectorAll('.insight-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabId = e.target.dataset.tab

        // Update tab buttons
        document.querySelectorAll('.insight-tab').forEach(t => t.classList.remove('active'))
        e.target.classList.add('active')

        // Update panels
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'))
        document.getElementById(`${tabId}-panel`)?.classList.add('active')
      })
    })

    // Case study navigation
    document.getElementById('prev-case')?.addEventListener('click', () => {
      if (this.currentCaseIndex > 0) {
        this.currentCaseIndex--
        this.renderCurrentCase()
      }
    })

    document.getElementById('next-case')?.addEventListener('click', () => {
      if (this.currentCaseIndex < this.caseStudies.length - 1) {
        this.currentCaseIndex++
        this.renderCurrentCase()
      }
    })

    // Case dots
    document.getElementById('case-dots')?.addEventListener('click', (e) => {
      if (e.target.classList.contains('case-dot')) {
        this.currentCaseIndex = parseInt(e.target.dataset.index)
        this.renderCurrentCase()
      }
    })

    // Breach type cards - expand
    document.getElementById('breach-type-grid')?.addEventListener('click', (e) => {
      const card = e.target.closest('.breach-type-card')
      if (card && (e.target.classList.contains('breach-expand-btn') || e.target.closest('.breach-type-card'))) {
        const breachType = card.dataset.breach
        this.showBreachDetail(breachType)
      }
    })

    // Close breach detail panel
    document.getElementById('close-breach-detail')?.addEventListener('click', () => {
      const panel = document.getElementById('breach-detail-panel')
      if (panel) panel.style.display = 'none'
    })

    // Close entity history modal
    document.getElementById('close-entity-history')?.addEventListener('click', () => {
      const modal = document.getElementById('entity-history-modal')
      if (modal) modal.style.display = 'none'
    })

    // Click outside modal to close
    document.getElementById('entity-history-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'entity-history-modal') {
        e.target.style.display = 'none'
      }
    })
  }

  // ============ YEARLY BREAKDOWN ============
  renderYearlyBreakdown() {
    const container = document.getElementById('yearly-breakdown-grid')
    if (!container || !this.yearlyBreakdown) return

    const years = this.yearlyBreakdown
    if (years.length === 0) {
      container.innerHTML = '<div class="empty-deep">No yearly data available</div>'
      return
    }

    // Update stats
    const yearsCount = years.length
    const peakYear = years.reduce((max, y) => y.totalCount > max.totalCount ? y : max, years[0])
    const peakFinesYear = years.reduce((max, y) => y.totalFines > max.totalFines ? y : max, years[0])

    document.getElementById('years-covered').textContent = yearsCount
    document.getElementById('peak-year').textContent = `${peakYear.year} (${this.formatNumber(peakYear.totalCount)})`
    document.getElementById('peak-fines-year').textContent = `${peakFinesYear.year} (${this.formatCurrency(peakFinesYear.totalFines)})`

    // Find max for bar scaling
    const maxCount = Math.max(...years.map(y => y.totalCount))

    // Outcome type labels
    const outcomeLabels = {
      cancellation: 'Cancellations',
      fine: 'Fines',
      prohibition: 'Prohibitions',
      restriction: 'Restrictions',
      censure: 'Censures',
      warning: 'Warnings',
      supervisory_notice: 'Supervisory',
      public_statement: 'Statements',
      voluntary_requirement: 'Voluntary',
      other: 'Other'
    }

    container.innerHTML = years.map(year => {
      const widthPercent = (year.totalCount / maxCount * 100).toFixed(0)

      // Get outcome breakdown
      const outcomes = Object.entries(year.outcomes || {})
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 4)
        .map(([type, data]) => `${outcomeLabels[type] || type}: ${data.count}`)
        .join(' · ')

      return `
        <div class="yearly-row" data-year="${year.year}">
          <div class="yearly-year">
            <span class="year-number">${year.year}</span>
            <button class="view-summary-btn" data-year="${year.year}" title="View ${year.year} Annual Summary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
            </button>
          </div>
          <div class="yearly-bar-container">
            <div class="yearly-bar" style="width: ${widthPercent}%"></div>
          </div>
          <div class="yearly-stats">
            <span class="yearly-count">${this.formatNumber(year.totalCount)} actions</span>
            <span class="yearly-fines">${this.formatCurrency(year.totalFines)}</span>
          </div>
          <div class="yearly-breakdown-summary">${outcomes || 'No breakdown available'}</div>
          ${year.biggestCase ? `
            <div class="yearly-biggest-case">
              <span class="biggest-label">Biggest:</span>
              <span class="biggest-entity">${year.biggestCase.entityName}</span>
              <span class="biggest-fine">${this.formatCurrency(year.biggestCase.fineAmount)}</span>
            </div>
          ` : ''}
        </div>
      `
    }).join('')

    // Add click handlers for year summary modal
    container.querySelectorAll('.view-summary-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        const year = btn.dataset.year
        this.openYearSummaryModal(parseInt(year))
      })
    })

    // Also make entire row clickable
    container.querySelectorAll('.yearly-row').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('.view-summary-btn')) return
        const year = row.dataset.year
        this.openYearSummaryModal(parseInt(year))
      })
    })
  }

  // ============ REOFFENDERS ============
  renderReoffenders() {
    const tbody = document.getElementById('reoffenders-tbody')
    const table = document.getElementById('reoffenders-table')
    if (!tbody || !this.reoffenders) return

    // Initialize sort state for reoffenders
    if (!this.reoffendersSortBy) this.reoffendersSortBy = 'actions'
    if (!this.reoffendersSortDir) this.reoffendersSortDir = 'desc'

    let data = [...this.reoffenders]
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-deep">No repeat offenders found</td></tr>'
      return
    }

    // Sort the data
    data.sort((a, b) => {
      let aVal, bVal
      switch (this.reoffendersSortBy) {
        case 'entity':
          aVal = a.entityName.toLowerCase()
          bVal = b.entityName.toLowerCase()
          break
        case 'actions':
          aVal = a.enforcementCount
          bVal = b.enforcementCount
          break
        case 'fines':
          aVal = a.totalFines
          bVal = b.totalFines
          break
        case 'years':
          aVal = a.years && a.years.length > 0 ? Math.max(...a.years) : 0
          bVal = b.years && b.years.length > 0 ? Math.max(...b.years) : 0
          break
        default:
          aVal = a.enforcementCount
          bVal = b.enforcementCount
      }
      if (this.reoffendersSortDir === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
      }
    })

    // Update summary stats
    const totalReoffenders = data.length
    const maxOffences = Math.max(...data.map(r => r.enforcementCount))
    const totalFines = data.reduce((sum, r) => sum + r.totalFines, 0)

    document.getElementById('total-reoffenders').textContent = this.formatNumber(totalReoffenders)
    document.getElementById('max-offences').textContent = maxOffences
    document.getElementById('total-reoffender-fines').textContent = this.formatCurrency(totalFines)

    // Format breach types
    const formatBreachTypes = (types) => {
      if (!types || types.length === 0) return '-'
      const labels = {
        'PRINCIPLES': 'Principles',
        'AML': 'AML',
        'SYSTEMS_CONTROLS': 'Systems',
        'MARKET_ABUSE': 'Market Abuse',
        'MIS_SELLING': 'Mis-selling',
        'CLIENT_MONEY': 'Client Money',
        'CONDUCT': 'Conduct',
        'PRUDENTIAL': 'Prudential',
        'REPORTING': 'Reporting',
        'GOVERNANCE': 'Governance',
        'FINANCIAL_CRIME': 'Fin Crime',
        'APPROVED_PERSONS': 'Approved Persons'
      }
      return types.slice(0, 2).map(t => labels[t] || t).join(', ')
    }

    tbody.innerHTML = data.map(r => {
      const yearRange = r.years && r.years.length > 0
        ? `${Math.min(...r.years)}-${Math.max(...r.years)}`
        : '-'

      return `
        <tr class="reoffender-row" data-entity="${encodeURIComponent(r.entityName)}">
          <td class="entity-name">${this.escapeHtml(r.entityName)}</td>
          <td class="action-count">${r.enforcementCount}</td>
          <td class="total-fines">${this.formatCurrency(r.totalFines)}</td>
          <td class="year-range">${yearRange}</td>
          <td class="breach-types">${formatBreachTypes(r.breachTypes)}</td>
        </tr>
      `
    }).join('')

    // Update sort indicators
    if (table) {
      table.querySelectorAll('th.sortable').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc')
        if (th.dataset.sort === this.reoffendersSortBy) {
          th.classList.add(`sort-${this.reoffendersSortDir}`)
        }
      })

      // Add sort click handlers (only once)
      if (!this.reoffendersSortHandlersAdded) {
        table.querySelectorAll('th.sortable').forEach(th => {
          th.addEventListener('click', () => {
            const field = th.dataset.sort
            if (this.reoffendersSortBy === field) {
              this.reoffendersSortDir = this.reoffendersSortDir === 'asc' ? 'desc' : 'asc'
            } else {
              this.reoffendersSortBy = field
              this.reoffendersSortDir = 'desc'
            }
            this.renderReoffenders()
          })
        })
        this.reoffendersSortHandlersAdded = true
      }
    }

    // Add click handlers for rows
    tbody.querySelectorAll('.reoffender-row').forEach(row => {
      row.addEventListener('click', () => {
        const entityName = decodeURIComponent(row.dataset.entity)
        this.showEntityHistory(entityName)
      })
    })
  }

  async showEntityHistory(entityName) {
    const modal = document.getElementById('entity-history-modal')
    const header = document.getElementById('entity-history-header')
    const timeline = document.getElementById('entity-history-timeline')

    if (!modal || !header || !timeline) return

    // Show modal with loading state
    modal.style.display = 'flex'
    header.innerHTML = `
      <div class="entity-loading">
        <div class="entity-loading-name">${entityName}</div>
        <div class="loading-deep">Loading enforcement history...</div>
      </div>
    `
    timeline.innerHTML = ''

    try {
      const res = await fetch(`/api/publications/entity/${encodeURIComponent(entityName)}/history`)
      const result = await res.json()

      if (!result.success || !result.data) {
        header.innerHTML = `<h2>${entityName}</h2><p>Failed to load history</p>`
        return
      }

      const data = result.data
      const actions = data.actions || []

      // Identify patterns
      const breachCounts = {}
      actions.forEach(a => {
        const breach = a.breachType || 'Unknown'
        breachCounts[breach] = (breachCounts[breach] || 0) + 1
      })
      const repeatedBreaches = Object.entries(breachCounts)
        .filter(([, count]) => count > 1)
        .sort((a, b) => b[1] - a[1])

      // Calculate time between actions
      const sortedDates = actions
        .map(a => a.date ? new Date(a.date).getTime() : null)
        .filter(d => d)
        .sort((a, b) => a - b)

      let avgInterval = null
      if (sortedDates.length > 1) {
        const intervals = []
        for (let i = 1; i < sortedDates.length; i++) {
          intervals.push(sortedDates[i] - sortedDates[i - 1])
        }
        avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
        avgInterval = Math.round(avgInterval / (1000 * 60 * 60 * 24 * 30)) // months
      }

      // Outcome colors
      const outcomeColors = {
        'fine': '#f59e0b',
        'cancellation': '#ef4444',
        'prohibition': '#f97316',
        'restriction': '#eab308',
        'censure': '#84cc16',
        'warning': '#14b8a6',
        'supervisory_notice': '#06b6d4'
      }

      // Build header with enhanced stats
      header.innerHTML = `
        <div class="entity-header-main">
          <h2 class="entity-name">${data.entityName}</h2>
          <div class="entity-meta">
            <span class="entity-period">${data.yearRange || 'Unknown period'}</span>
          </div>
        </div>
        <div class="entity-stats-grid">
          <div class="entity-stat-card">
            <span class="entity-stat-value">${data.enforcementCount}</span>
            <span class="entity-stat-label">Enforcement Actions</span>
          </div>
          <div class="entity-stat-card highlight">
            <span class="entity-stat-value">${this.formatCurrency(data.totalFines)}</span>
            <span class="entity-stat-label">Total Fines</span>
          </div>
          <div class="entity-stat-card">
            <span class="entity-stat-value">${avgInterval ? avgInterval + ' mo' : '-'}</span>
            <span class="entity-stat-label">Avg. Interval</span>
          </div>
        </div>
        ${repeatedBreaches.length > 0 ? `
          <div class="entity-pattern-alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><circle cx="12" cy="17" r="1"/>
            </svg>
            <span>Repeated violations: ${repeatedBreaches.map(([b, c]) => `${this.formatBreachLabel(b)} (${c}x)`).join(', ')}</span>
          </div>
        ` : ''}
      `

      // Build visual timeline
      const timelineHtml = `
        <div class="entity-timeline-visual">
          <div class="timeline-track">
            ${actions.map((action, idx) => {
              const color = outcomeColors[action.outcomeType] || '#64748b'
              const year = action.date ? new Date(action.date).getFullYear() : '?'
              return `
                <div class="timeline-point" data-idx="${idx}" style="--point-color: ${color}">
                  <div class="point-marker"></div>
                  <span class="point-year">${year}</span>
                </div>
              `
            }).join('')}
          </div>
        </div>
        <div class="entity-cards-container">
          ${actions.map((action, idx) => {
            const date = action.date ? new Date(action.date).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric'
            }) : 'Unknown date'
            const color = outcomeColors[action.outcomeType] || '#64748b'
            const outcomeLabel = (action.outcomeType || 'action').replace(/_/g, ' ')
            const isRepeated = breachCounts[action.breachType] > 1

            return `
              <div class="entity-action-card" data-idx="${idx}" style="--card-accent: ${color}">
                <div class="action-card-header">
                  <div class="action-date-badge">${date}</div>
                  <div class="action-outcome-badge" style="background: ${color}">${outcomeLabel.toUpperCase()}</div>
                </div>
                <div class="action-card-body">
                  ${action.fineAmount > 0 ? `
                    <div class="action-fine-display">
                      <span class="fine-amount">${this.formatCurrency(action.fineAmount)}</span>
                      <span class="fine-label">fine imposed</span>
                    </div>
                  ` : ''}
                  <div class="action-breach ${isRepeated ? 'repeated-breach' : ''}">
                    ${isRepeated ? '<span class="repeat-badge">Repeat</span>' : ''}
                    <span class="breach-text">${this.formatBreachLabel(action.breachType) || 'Breach details not specified'}</span>
                  </div>
                  ${action.summary ? `
                    <div class="action-summary">${action.summary}</div>
                  ` : ''}
                  ${action.handbookRefs && action.handbookRefs.length > 0 ? `
                    <div class="action-refs">
                      <span class="refs-label">Handbook:</span>
                      ${action.handbookRefs.slice(0, 3).map(r => `<span class="ref-tag">${r}</span>`).join('')}
                      ${action.handbookRefs.length > 3 ? `<span class="refs-more">+${action.handbookRefs.length - 3}</span>` : ''}
                    </div>
                  ` : ''}
                </div>
                <div class="action-card-footer">
                  ${action.pdfUrl ? `
                    <a href="${action.pdfUrl}" target="_blank" class="action-pdf-link">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                      </svg>
                      View Notice
                    </a>
                  ` : ''}
                  <button class="action-view-btn" onclick="window.dashboardInstance?.viewNotice('${action.noticeId || ''}')">
                    View Details →
                  </button>
                </div>
              </div>
            `
          }).join('')}
        </div>
      `

      timeline.innerHTML = timelineHtml

      // Add timeline point hover interaction
      setTimeout(() => {
        const points = timeline.querySelectorAll('.timeline-point')
        const cards = timeline.querySelectorAll('.entity-action-card')

        points.forEach(point => {
          point.addEventListener('mouseenter', () => {
            const idx = point.dataset.idx
            cards.forEach((card, i) => {
              card.classList.toggle('highlighted', i === parseInt(idx))
            })
          })
          point.addEventListener('click', () => {
            const idx = point.dataset.idx
            const targetCard = cards[parseInt(idx)]
            if (targetCard) {
              targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' })
              targetCard.classList.add('pulse')
              setTimeout(() => targetCard.classList.remove('pulse'), 1000)
            }
          })
        })
      }, 100)

    } catch (error) {
      console.error('[publications] Error loading entity history:', error)
      header.innerHTML = `<h2>${entityName}</h2><p class="error">Error loading history</p>`
    }
  }

  // ============ YEAR SUMMARY MODAL ============
  async openYearSummaryModal(year) {
    // Find the year data from loaded breakdown
    const yearData = this.yearlyBreakdown?.find(y => y.year === year)
    if (!yearData) {
      console.error('[publications] Year data not found:', year)
      return
    }

    // Create modal if it doesn't exist
    let modal = document.getElementById('year-summary-modal')
    if (!modal) {
      modal = document.createElement('div')
      modal.id = 'year-summary-modal'
      modal.className = 'year-summary-modal-overlay'
      document.body.appendChild(modal)
    }

    // Get outcome breakdown for the pie chart
    const outcomeLabels = {
      cancellation: 'Cancellations',
      fine: 'Fines',
      prohibition: 'Prohibitions',
      restriction: 'Restrictions',
      censure: 'Public Censures',
      warning: 'Warnings',
      supervisory_notice: 'Supervisory Notices',
      public_statement: 'Public Statements',
      voluntary_requirement: 'Voluntary Requirements',
      other: 'Other'
    }

    const outcomeColors = {
      cancellation: '#ef4444',
      fine: '#f59e0b',
      prohibition: '#f97316',
      restriction: '#eab308',
      censure: '#84cc16',
      warning: '#14b8a6',
      supervisory_notice: '#06b6d4',
      public_statement: '#22c55e',
      voluntary_requirement: '#3b82f6',
      other: '#64748b'
    }

    // Build outcome breakdown HTML
    const outcomes = Object.entries(yearData.outcomes || {})
      .sort((a, b) => b[1].count - a[1].count)

    const outcomesHtml = outcomes.map(([type, data]) => {
      const pct = ((data.count / yearData.totalCount) * 100).toFixed(1)
      const color = outcomeColors[type] || '#64748b'
      return `
        <div class="modal-outcome-row">
          <span class="outcome-color" style="background: ${color}"></span>
          <span class="outcome-name">${outcomeLabels[type] || type}</span>
          <span class="outcome-count">${data.count}</span>
          <span class="outcome-pct">${pct}%</span>
          ${data.totalFines > 0 ? `<span class="outcome-fines">${this.formatCurrency(data.totalFines)}</span>` : ''}
        </div>
      `
    }).join('')

    // Try to fetch AI summary if available
    let summaryHtml = ''
    try {
      const summaryRes = await fetch(`/api/publications/summary/${year}`)
      const summaryData = await summaryRes.json()
      if (summaryData.success && summaryData.data?.summary_html) {
        summaryHtml = `
          <div class="year-summary-narrative">
            <h4>Executive Summary</h4>
            <div class="summary-prose">${summaryData.data.summary_html}</div>
          </div>
        `
      }
    } catch (err) {
      console.log('[publications] No AI summary available for', year)
    }

    // Build modal content
    modal.innerHTML = `
      <div class="year-summary-modal-content">
        <button class="year-modal-close" id="close-year-modal">&times;</button>

        <div class="year-modal-header">
          <h2>FCA Enforcement Activity</h2>
          <div class="year-modal-year">${year}</div>
        </div>

        <div class="year-modal-stats">
          <div class="year-modal-stat">
            <span class="stat-value">${this.formatNumber(yearData.totalCount)}</span>
            <span class="stat-label">Enforcement Actions</span>
          </div>
          <div class="year-modal-stat">
            <span class="stat-value">${this.formatCurrency(yearData.totalFines)}</span>
            <span class="stat-label">Total Fines</span>
          </div>
          <div class="year-modal-stat">
            <span class="stat-value">${yearData.finesWithAmount || 0}</span>
            <span class="stat-label">Cases with Fines</span>
          </div>
        </div>

        ${yearData.biggestCase ? `
          <div class="year-modal-biggest">
            <h4>Largest Fine</h4>
            <div class="biggest-case-detail">
              <span class="biggest-entity">${yearData.biggestCase.entityName}</span>
              <span class="biggest-amount">${this.formatCurrency(yearData.biggestCase.fineAmount)}</span>
              <span class="biggest-breach">${yearData.biggestCase.breachType || 'Unknown breach'}</span>
            </div>
          </div>
        ` : ''}

        <div class="year-modal-breakdown">
          <h4>Breakdown by Outcome Type</h4>
          <div class="modal-outcomes-list">
            ${outcomesHtml}
          </div>
        </div>

        ${summaryHtml}

        <div class="year-modal-actions">
          <button class="btn btn-secondary" onclick="window.print()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 9V2h12v7"/>
              <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            Print
          </button>
          <button class="btn btn-primary" id="close-year-modal-btn">Close</button>
        </div>
      </div>
    `

    // Show modal
    modal.style.display = 'flex'
    document.body.style.overflow = 'hidden'

    // Close handlers
    const closeModal = () => {
      modal.style.display = 'none'
      document.body.style.overflow = ''
    }

    document.getElementById('close-year-modal').onclick = closeModal
    document.getElementById('close-year-modal-btn').onclick = closeModal
    modal.onclick = (e) => {
      if (e.target === modal) closeModal()
    }

    // ESC key closes modal
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        closeModal()
        document.removeEventListener('keydown', escHandler)
      }
    }
    document.addEventListener('keydown', escHandler)
  }
}
