export async function renderRiskIndicators() {
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
