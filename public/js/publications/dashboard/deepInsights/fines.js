export function renderDeepTopFines() {
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

export function renderFineModifiers() {
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
