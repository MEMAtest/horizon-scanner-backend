import { getBreachIcon } from '../modules/breachIcons.js'

export function applyInsightsMixin(klass) {
  Object.assign(klass.prototype, {
    renderInsights() {
      this.renderOutcomeBreakdown()
      this.renderBreachAnalysis()
      this.renderFinesAnalysis()
      this.renderKeyTakeaways()
    },
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
    },
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
    },
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
  
      // Render rankings with SVG icons
      container.innerHTML = sorted.map(([type, count], index) => {
        const percent = ((count / total) * 100).toFixed(1)
        const desc = descriptions[type] || 'Regulatory breach'
        const label = this.formatBreachLabel(type)
        const icon = getBreachIcon(type)
        return `
          <div class="breach-rank-item">
            <div class="breach-icon">${icon}</div>
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
    },
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
  })
}
