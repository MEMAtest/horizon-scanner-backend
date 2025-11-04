/** @jest-environment jsdom */

const { TextEncoder, TextDecoder } = require('util')

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder
}

const { JSDOM } = require('jsdom')
const renderAiIntelligencePage = require('../src/routes/pages/aiIntelligence/index.js')
const { buildAiIntelligencePage } = require('../src/views/aiIntelligence/pageBuilder')

const baseSnapshot = {
  snapshotDate: '2025-11-03T00:00:00.000Z',
  heroInsight: {
    headline: 'Regulator issues urgent guidance',
    summary: 'A regulator has issued an urgent guidance note.',
    recommendation: 'Escalate to compliance lead.'
  },
  riskPulse: {
    score: 3.4,
    label: 'Elevated',
    delta: 1.2,
    components: [
      { label: 'Impact momentum', weight: 0.35, score: 6.5 },
      { label: 'Urgency mix', weight: 0.2, score: 4.2 }
    ]
  },
  quickStats: {
    totalUpdates: 5,
    highImpact: 2,
    activeAuthorities: 3,
    deadlinesSoon: 1,
    urgentUpdates: 1
  },
  streams: {
    high: [
      {
        updateId: 'alpha-1',
        headline: 'Priority enforcement action',
        authority: 'HMRC',
        urgency: 'High',
        impactLevel: 'Significant',
        summary: 'Summary goes here.',
        publishedAt: '2025-11-03T09:00:00.000Z',
        url: 'https://example.com/alpha-1',
        personas: ['executive', 'operations'],
        primarySector: 'Tax'
      }
    ],
    medium: [
      {
        updateId: 'beta-1',
        headline: 'Compliance reminder',
        authority: 'FCA',
        urgency: 'Medium',
        impactLevel: 'Moderate',
        summary: 'Another summary.',
        publishedAt: '2025-11-03T11:00:00.000Z',
        url: 'https://example.com/beta-1',
        personas: ['analyst'],
        primarySector: 'Banking'
      }
    ],
    low: []
  },
  personas: {
    executive: {
      count: 3,
      pins: 1,
      openTasks: 0,
      updates: [],
      briefing: { summary: 'Leadership focus on HMRC impact.', nextSteps: ['Escalate with ExCo: Priority enforcement action (HMRC)'] }
    },
    analyst: {
      count: 2,
      pins: 0,
      openTasks: 1,
      updates: [],
      briefing: { summary: 'Research queue targets FCA topics.', nextSteps: ['Draft impact briefing: Compliance reminder (FCA)'] }
    },
    operations: {
      count: 1,
      pins: 0,
      openTasks: 0,
      updates: [],
      briefing: { summary: 'Operational readiness steady.', nextSteps: ['Coordinate response: Priority enforcement action (HMRC)'] }
    }
  },
  workspace: {
    stats: {},
    tasks: 2,
    pinnedItems: [],
    savedSearches: [],
    customAlerts: [],
    annotationSummary: { total: 0, tasks: 0, flagged: 0 }
  },
  timeline: [],
  themes: [],
  personaBriefings: {}
}

function cloneSnapshot(overrides = {}) {
  return JSON.parse(JSON.stringify({ ...baseSnapshot, ...overrides }))
}

function flushTimers(window) {
  return new Promise(resolve => window.setTimeout(resolve, 0))
}

describe('renderAiIntelligencePage', () => {
  it('renders the intelligence page without throwing', async () => {
    const req = {}
    const result = {}

    const res = {
      headers: {},
      statusCode: 200,
      setHeader(key, value) {
        this.headers[key] = value
      },
      status(code) {
        this.statusCode = code
        return this
      },
      send(html) {
        result.html = html
      }
    }

    await renderAiIntelligencePage(req, res)

    expect(res.statusCode).toBe(200)
    expect(result.html).toBeDefined()
    expect(result.html).toContain('AI Intelligence Brief')
    expect(result.html).toContain('risk-pulse')
  })

  it('handles pin refresh and persona switching interactions', async () => {
    const refreshedSnapshot = cloneSnapshot({
      snapshotDate: '2025-11-04T00:00:00.000Z',
      heroInsight: {
        headline: 'Updated regulator briefing',
        summary: 'Fresh summary available.',
        recommendation: 'Coordinate analyst review.'
      },
      riskPulse: { ...baseSnapshot.riskPulse, score: 4.2, delta: 0.6 },
      quickStats: { ...baseSnapshot.quickStats, totalUpdates: 7 },
      workspace: {
        ...baseSnapshot.workspace,
        pinnedItems: [{ update_url: 'https://example.com/alpha-1' }]
      }
    })

    let fetchMock
    const togglePinMock = jest.fn().mockResolvedValue(true)

    const html = buildAiIntelligencePage({
      sidebar: '<nav></nav>',
      snapshot: cloneSnapshot(),
      workspaceBootstrapScripts: '<script></script>',
      clientScripts: '',
      commonStyles: '<style></style>'
    })

    const dom = new JSDOM(html, {
      runScripts: 'dangerously',
      resources: 'usable',
      pretendToBeVisual: true,
      beforeParse(window) {
        fetchMock = jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({ success: true, snapshot: refreshedSnapshot })
        })
        window.fetch = fetchMock
        window.WorkspaceModule = {
          togglePin: togglePinMock
        }
        window.alert = jest.fn()
      }
    })

    await new Promise(resolve => {
      dom.window.addEventListener('DOMContentLoaded', () => resolve())
    })

    const { document } = dom.window

    const initialHeroDate = document.querySelector('.hero-date')
    expect(initialHeroDate.textContent).toContain('3 Nov 2025')

    const activePersonaTab = document.querySelector('.persona-tab.active')
    expect(activePersonaTab.dataset.persona).toBe('executive')

    const analystTab = document.querySelector('.persona-tab[data-persona="analyst"]')
    analystTab.click()
    expect(document.querySelector('.persona-tab.active').dataset.persona).toBe('analyst')
    expect(document.querySelector('.persona-panel[data-persona-panel="analyst"]').classList.contains('active')).toBe(true)
    expect(document.querySelector('.persona-panel[data-persona-panel="executive"]').classList.contains('active')).toBe(false)

    const pinButton = document.querySelector('.stream-card .pin-toggle')
    pinButton.dispatchEvent(new dom.window.Event('click', { bubbles: true }))

    await flushTimers(dom.window)
    await flushTimers(dom.window)

    expect(togglePinMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('/api/intelligence/daily', expect.objectContaining({ headers: { Accept: 'application/json' } }))
    expect(document.querySelector('.hero-date').textContent).toContain('4 Nov 2025')
  })
})
