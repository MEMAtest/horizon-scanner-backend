// E2E test: deadline data flows from briefing through page render to sidebar HTML

jest.mock('../src/routes/templates/sidebar', () => ({
  getSidebar: jest.fn().mockResolvedValue('<aside>sidebar</aside>')
}))

jest.mock('../src/routes/templates/commonStyles', () => ({
  getCommonStyles: jest.fn().mockReturnValue('<style></style>')
}))

jest.mock('../src/routes/templates/clientScripts', () => ({
  getClientScripts: jest.fn().mockReturnValue('<script></script>')
}))

jest.mock('../src/services/smartBriefingService', () => ({
  getLatestBriefing: jest.fn(),
  listBriefings: jest.fn(),
  getBriefing: jest.fn()
}))

const cheerio = require('cheerio')
const smartBriefingService = require('../src/services/smartBriefingService')
const weeklyBriefingPage = require('../src/routes/pages/weeklyBriefingPage')

// Freeze date for deterministic deadline calculations
const MOCK_NOW = new Date('2026-03-23T00:00:00Z')
const realDate = global.Date
beforeAll(() => {
  global.Date = class extends realDate {
    constructor(...args) {
      if (args.length === 0) return new realDate(MOCK_NOW)
      return new realDate(...args)
    }
    static now() { return MOCK_NOW.getTime() }
  }
  global.Date.parse = realDate.parse
  global.Date.UTC = realDate.UTC
})
afterAll(() => { global.Date = realDate })

function renderPage(briefing) {
  return new Promise((resolve, reject) => {
    smartBriefingService.getLatestBriefing.mockResolvedValue(briefing)
    smartBriefingService.listBriefings.mockResolvedValue(briefing ? [{ id: briefing.id, generatedAt: briefing.generatedAt }] : [])

    const send = jest.fn()
    const res = { send, status: jest.fn().mockReturnThis() }

    weeklyBriefingPage({}, res).then(() => {
      if (send.mock.calls.length === 0) {
        reject(new Error('send() not called'))
        return
      }
      resolve(send.mock.calls[0][0])
    }).catch(reject)
  })
}

describe('Weekly briefing page with deadline data', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('renders deadline tracker in sidebar when briefing has deadlines', async () => {
    const briefing = {
      id: 'test-brief-1',
      generatedAt: '2026-03-23T10:00:00Z',
      dateRange: { start: '2026-03-17', end: '2026-03-23' },
      artifacts: {
        narrative: 'Test narrative',
        onePager: '<p>One pager content</p>'
      },
      dataset: {
        currentUpdates: [
          {
            id: 'u1',
            title: 'FCA Operational Resilience',
            authority: 'FCA',
            impact_level: 'Significant',
            compliance_deadline: '2027-03-31',
            published_date: '2026-03-20',
            summary: 'New rules on operational resilience'
          },
          {
            id: 'u2',
            title: 'PRA Capital Requirements',
            authority: 'PRA',
            impact_level: 'Moderate',
            compliance_deadline: '2026-04-15',
            published_date: '2026-03-19',
            summary: 'Updated capital requirements'
          },
          {
            id: 'u3',
            title: 'BoE Past Deadline',
            authority: 'BoE',
            impact_level: 'Significant',
            compliance_deadline: '2026-03-01',
            published_date: '2026-03-18',
            summary: 'Overdue requirement'
          }
        ],
        previousUpdates: [],
        historyUpdates: [],
        historyTimeline: [],
        stats: { totalUpdates: 3, byImpact: { Significant: 2, Moderate: 1, Informational: 0 } },
        annotations: [],
        annotationInsights: { totals: {}, flagged: [], assignments: [] }
      }
    }

    const html = await renderPage(briefing)
    const $ = cheerio.load(html)

    // Deadline tracker widget should be present
    expect($('.deadline-tracker').length).toBe(1)
    expect($('.deadline-tracker').text()).toContain('Compliance Deadlines')

    // Should show badge with count
    expect($('.deadline-badge').text()).toContain('3')

    // Should have groups
    expect($('.deadline-overdue').length).toBeGreaterThan(0)

    // Should have calendar link
    expect($('a[href="/regulatory-calendar"]').length).toBeGreaterThan(0)
  })

  it('renders empty state when no deadlines exist', async () => {
    const briefing = {
      id: 'test-brief-2',
      generatedAt: '2026-03-23T10:00:00Z',
      dateRange: { start: '2026-03-17', end: '2026-03-23' },
      artifacts: {
        narrative: 'Test narrative',
        onePager: '<p>Content</p>'
      },
      dataset: {
        currentUpdates: [
          {
            id: 'u1',
            title: 'Info update',
            authority: 'FCA',
            impact_level: 'Informational',
            published_date: '2026-03-20',
            summary: 'No deadline here'
          }
        ],
        previousUpdates: [],
        historyUpdates: [],
        historyTimeline: [],
        stats: { totalUpdates: 1, byImpact: { Significant: 0, Moderate: 0, Informational: 1 } },
        annotations: [],
        annotationInsights: { totals: {}, flagged: [], assignments: [] }
      }
    }

    const html = await renderPage(briefing)
    const $ = cheerio.load(html)

    expect($('.deadline-tracker').length).toBe(1)
    expect($('.deadline-tracker').text()).toContain('No upcoming deadlines')
    // No badge when count is 0
    expect($('.deadline-badge').length).toBe(0)
  })

  it('renders deadline chips on update cards', async () => {
    const briefing = {
      id: 'test-brief-3',
      generatedAt: '2026-03-23T10:00:00Z',
      dateRange: { start: '2026-03-17', end: '2026-03-23' },
      artifacts: {
        narrative: 'Narrative text',
        onePager: '<p>One pager</p>'
      },
      dataset: {
        currentUpdates: [
          {
            id: 'u1',
            title: 'With deadline',
            authority: 'FCA',
            impact_level: 'Significant',
            compliance_deadline: '2026-04-10',
            published_date: '2026-03-20',
            summary: 'Has a deadline chip'
          }
        ],
        previousUpdates: [],
        historyUpdates: [],
        historyTimeline: [],
        stats: { totalUpdates: 1, byImpact: { Significant: 1, Moderate: 0, Informational: 0 } },
        annotations: [],
        annotationInsights: { totals: {}, flagged: [], assignments: [] }
      }
    }

    const html = await renderPage(briefing)
    const $ = cheerio.load(html)

    // Update cards should have deadline chip
    expect($('.deadline-chip').length).toBeGreaterThan(0)
    expect($('.deadline-chip').text()).toContain('Due:')
  })

  it('renders page without crashing when briefing is null', async () => {
    const html = await renderPage(null)
    const $ = cheerio.load(html)

    // Page should still render
    expect($('.deadline-tracker').length).toBe(1)
    expect($('.deadline-tracker').text()).toContain('No upcoming deadlines')
  })
})
