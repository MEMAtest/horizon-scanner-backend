export function renderDeepQuickStats() {
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

export function renderOutcomeAnalysis() {
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

export function setupOutcomeAccordionHandlers(container) {
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

export async function fetchAndRenderBreachBreakdown(row, outcomeType) {
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
