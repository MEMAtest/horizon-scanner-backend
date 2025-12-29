export function scrollToTable() {
  const table = document.getElementById('notices-table')
  if (table) {
    table.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

export function setupDeepInsightsEvents() {
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
