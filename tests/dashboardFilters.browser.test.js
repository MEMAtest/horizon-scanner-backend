/**
 * @jest-environment jsdom
 */

const { getClientScriptsContent } = require('../src/routes/templates/clientScripts')

function extractClientScript() {
  const scripts = []
  const content = getClientScriptsContent()
  const regex = /<script>([\s\S]*?)<\/script>/g
  let match
  while ((match = regex.exec(content)) !== null) {
    scripts.push(match[1])
  }
  return scripts.join('\n')
}

async function loadClientScripts() {
  const scriptSource = extractClientScript()
  // eslint-disable-next-line no-eval
  eval(scriptSource)
  document.dispatchEvent(new Event('DOMContentLoaded'))
  await new Promise(resolve => setTimeout(resolve, 0))
}

describe('Dashboard Filters (client-side)', () => {
  beforeEach(() => {
    jest.resetModules()
    global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({ success: false }) }))

    document.body.innerHTML = `
      <div class="quick-filters">
        <button class="quick-filter-btn" data-filter="all"></button>
        <button class="quick-filter-btn" data-filter="high-impact"></button>
        <button class="quick-filter-btn" data-filter="today"></button>
      </div>
      <div class="sort-buttons">
        <button class="sort-btn" data-sort="newest"></button>
        <button class="sort-btn" data-sort="impact"></button>
      </div>
      <div class="view-options">
        <button class="view-btn" data-view="cards"></button>
        <button class="view-btn" data-view="table"></button>
        <button class="view-btn" data-view="timeline"></button>
      </div>
      <div id="updates-container" class="updates-container"></div>
      <div id="results-count"></div>
    `

    window.WorkspaceModule = { init: jest.fn().mockResolvedValue() }
    window.dashboardStats = {}
    window.filterOptions = { authorities: [], sectors: [] }
    window.currentFilters = { category: 'all', sort: 'newest' }
    window.currentView = 'cards'

    window.initialUpdates = [
      {
        id: '1',
        headline: 'High impact enforcement action',
        summary: 'critical update',
        authority: 'FCA',
        impactLevel: 'Significant',
        urgency: 'High',
        business_impact_score: 8,
        publishedDate: new Date().toISOString(),
        category: 'enforcement',
        ai_tags: ['has:penalty']
      },
        {
        id: '2',
        headline: 'Background guidance note',
        summary: 'nothing urgent',
        authority: 'PRA',
        impactLevel: 'Informational',
        urgency: 'Low',
        business_impact_score: 2,
        publishedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'guidance',
        ai_tags: []
      }
    ]
  })

  test('quick category filter applies without manual clear', async () => {
    await loadClientScripts()

    expect(window.filteredUpdates.length).toBe(2)

    window.filterByCategory('high-impact')

    expect(window.currentFilters.category).toBe('high-impact')
    expect(window.filteredUpdates.length).toBe(1)
    expect(window.filteredUpdates[0].id).toBe('1')

    const highImpactBtn = document.querySelector('.quick-filter-btn[data-filter="high-impact"]')
    const allBtn = document.querySelector('.quick-filter-btn[data-filter="all"]')
    expect(highImpactBtn.classList.contains('active')).toBe(true)
    expect(allBtn.classList.contains('active')).toBe(false)
  })

  test('view switch renders filtered dataset consistently', async () => {
    await loadClientScripts()

    window.filterByCategory('high-impact')
    expect(window.filteredUpdates.length).toBe(1)

    window.switchView('table')
    const tableContainer = document.querySelector('.updates-container.table-view')
    expect(tableContainer).not.toBeNull()
    expect(tableContainer.innerHTML).toContain('table class="updates-table"')

    window.switchView('timeline')
    const timelineContainer = document.querySelector('.updates-container.timeline-view')
    expect(timelineContainer).not.toBeNull()
    expect(timelineContainer.innerHTML).toContain('timeline-wrapper')
  })
})

