export function renderReoffenders() {
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

export async function showEntityHistory(entityName) {
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
          <div class="entity-ai-summary" id="entity-ai-summary">
            <div class="ai-summary-loading">
              <span class="loading-dot"></span>
              <span class="loading-dot"></span>
              <span class="loading-dot"></span>
              <span class="loading-text">Generating analysis...</span>
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

    // Fetch AI summary asynchronously (for repeat offenders only)
    if (data.enforcementCount > 1) {
      this.fetchEntityAISummary(entityName)
    } else {
      // Hide summary section for single-offense entities
      const summaryEl = document.getElementById('entity-ai-summary')
      if (summaryEl) summaryEl.style.display = 'none'
    }

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

export async function fetchEntityAISummary(entityName) {
  const summaryEl = document.getElementById('entity-ai-summary')
  if (!summaryEl) return

  try {
    const res = await fetch(`/api/publications/entity/${encodeURIComponent(entityName)}/summary`)
    const result = await res.json()

    if (result.success && result.data?.summary) {
      const { summary, aiGenerated } = result.data
      summaryEl.innerHTML = `
            <div class="ai-summary-content">
              <div class="ai-summary-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2a4 4 0 0 1 4 4c0 1.5-.8 2.5-2 3.5-1.2 1-2 2-2 3.5v1"/>
                  <circle cx="12" cy="18" r="1"/>
                </svg>
                <span>AI Analysis</span>
                ${aiGenerated ? '<span class="ai-badge">AI Generated</span>' : ''}
              </div>
              <p class="ai-summary-text">${summary}</p>
            </div>
          `
    } else {
      summaryEl.style.display = 'none'
    }
  } catch (err) {
    console.error('Failed to fetch entity AI summary:', err)
    summaryEl.style.display = 'none'
  }
}
