/** @jest-environment jsdom */
const path = require('path')

describe('predictive-dashboard client script', () => {
  const scriptPath = path.resolve(__dirname, '../public/js/predictive-dashboard.js')

  const buildDom = () => {
    document.body.innerHTML = `
      <form id="insightFilters">
        <select name="authority">
          <option value="">All</option>
          <option value="FCA">FCA</option>
          <option value="PRA">PRA</option>
        </select>
        <select name="sector">
          <option value="">All</option>
          <option value="Banking">Banking</option>
        </select>
        <select name="confidence">
          <option value="">All</option>
          <option value="CRITICAL">CRITICAL</option>
        </select>
      </form>
      <section class="lane-column" data-lane="act_now">
        <div class="lane-cards">
          <article class="insight-card" data-prediction="p1" data-authorities="FCA" data-sectors="Banking" data-confidence="CRITICAL">
            <div class="card-header"><h3>Test insight</h3></div>
            <div class="card-flags" data-flag-container></div>
            <button type="button" data-action="view-details">View details</button>
            <button type="button" data-action="acknowledge">Acknowledge</button>
            <button type="button" data-action="delegate">Delegate</button>
          </article>
        </div>
      </section>
      <div class="lane-column" data-lane="prepare_next"><div class="lane-cards"></div></div>
      <div class="lane-column" data-lane="plan_horizon"><div class="lane-cards"></div></div>
      <div class="insight-drawer" id="insightDrawer" aria-hidden="true">
        <div class="drawer-overlay" data-drawer-close="true"></div>
        <aside class="drawer-panel" role="dialog" aria-labelledby="drawerTitle">
          <header class="drawer-header"><h2 id="drawerTitle"></h2><button data-drawer-close="true"></button></header>
          <div class="drawer-body" id="drawerBody"></div>
        </aside>
      </div>
    `
  }

  const buildPayload = () => ({
    lanes: {
      act_now: [
        {
          id: 'p1',
          prediction_title: 'Test insight',
          why_this_matters: 'Testing the drawer rendering',
          timeframe: '7-14 days',
          urgency: 'CRITICAL',
          confidence: 88,
          confidence_bucket: 'CRITICAL',
          recommended_actions: ['Do a thing', 'Prepare follow-up'],
          confidence_factors: ['Velocity spike'],
          context: {
            why: 'Testing context',
            historicalAccuracy: { bucket: 'CRITICAL', statement: 'Model hit rate 80% across comparable calls.', window: '12-month window' },
            evidence: [{
              severity: 'critical',
              statement: 'Evidence one'
            }],
            triggeringUpdates: [{
              authority: 'FCA',
              headline: 'Update headline',
              date: '2025-01-01T00:00:00.000Z'
            }],
            confidenceDrivers: ['Driver one'],
            authorities: ['FCA'],
            sectors: ['Banking']
          }
        }
      ],
      prepare_next: [],
      plan_horizon: []
    }
  })

  const loadScript = () => {
    jest.resetModules()
    require(scriptPath)
  }

  beforeEach(() => {
    const storage = window.localStorage
    storage.clear()
    global.localStorage = storage
    buildDom()
    window.predictiveDashboard = buildPayload()
    window.prompt = jest.fn()
    loadScript()
  })

  it('applies acknowledged toggle state and persists to localStorage', () => {
    const card = document.querySelector('.insight-card')
    const button = card.querySelector('[data-action="acknowledge"]')

    expect(card.classList.contains('is-acknowledged')).toBe(false)
    button.click()
    expect(card.classList.contains('is-acknowledged')).toBe(true)
    expect(button.textContent).toBe('Acknowledged')

    // simulate reload
    jest.resetModules()
    buildDom()
    window.predictiveDashboard = buildPayload()
    localStorage.setItem('predictive_acknowledged_v1', JSON.stringify(['p1']))
    loadScript()

    const reloadedCard = document.querySelector('.insight-card')
    expect(reloadedCard.classList.contains('is-acknowledged')).toBe(true)
  })

  it('filters cards when authority filter changes', () => {
    const filterForm = document.getElementById('insightFilters')
    const authoritySelect = filterForm.elements.namedItem('authority')
    const card = document.querySelector('.insight-card')

    authoritySelect.value = 'PRA'
    authoritySelect.dispatchEvent(new Event('change', { bubbles: true }))

    expect(card.classList.contains('is-hidden')).toBe(true)
  })

  it('opens drawer with details when view button clicked', () => {
    const viewButton = document.querySelector('[data-action="view-details"]')
    const drawer = document.getElementById('insightDrawer')

    expect(drawer.classList.contains('is-visible')).toBe(false)
    viewButton.click()
    expect(drawer.classList.contains('is-visible')).toBe(true)
    expect(document.getElementById('drawerBody').innerHTML).toContain('Recommended actions')
  })

  it('stores delegation note when provided', () => {
    window.prompt.mockReturnValue('Alice')
    const delegateButton = document.querySelector('[data-action="delegate"]')
    delegateButton.click()

    const card = document.querySelector('.insight-card')
    expect(card.classList.contains('is-delegated')).toBe(true)
    expect(localStorage.getItem('predictive_delegated_v1')).toContain('p1')
    expect(localStorage.getItem('predictive_delegation_notes_v1')).toContain('Alice')
  })
})
