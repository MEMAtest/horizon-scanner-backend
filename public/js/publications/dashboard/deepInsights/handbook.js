export function renderHandbookBars() {
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
    const ruleInfo = this.findMatchingRule(ref, rules)
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
    const top1Info = this.findMatchingRule(top1.reference, rules)
    const top2Info = this.findMatchingRule(top2.reference, rules)
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

export function findMatchingRule(ref, rules) {
  if (!ref || !rules) return {}

  // Direct match first
  if (rules[ref]) return rules[ref]

  // Parse the reference
  const cleaned = ref.trim().toUpperCase()
  const match = cleaned.match(/^([A-Z]+)\s*(\d+)(?:\.(\d+))?(?:\.(\d+))?([RGD])?$/)

  if (!match) {
    // Try simpler match on sourcebook prefix
    const prefix = cleaned.split(/[\s\d]/)[0]
    for (const [key, rule] of Object.entries(rules)) {
      if (key.startsWith(prefix + ' ')) {
        return rule
      }
    }
    return {}
  }

  const [, sourcebook, chapter, section] = match

  // Try progressively less specific keys
  const keysToTry = []
  if (section) keysToTry.push(`${sourcebook} ${chapter}.${section}`)
  keysToTry.push(`${sourcebook} ${chapter}`)
  keysToTry.push(sourcebook)

  for (const key of keysToTry) {
    if (rules[key]) return rules[key]
  }

  // Try prefix match
  const prefix = `${sourcebook} ${chapter}`
  for (const [key, rule] of Object.entries(rules)) {
    if (key.startsWith(prefix)) {
      return rule
    }
  }

  return {}
}
