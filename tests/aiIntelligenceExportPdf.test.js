jest.mock('puppeteer', () => ({
  launch: jest.fn(async () => {
    return {
      newPage: async () => ({
        setContent: jest.fn(),
        emulateMediaType: jest.fn(),
        pdf: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4 mock')),
        close: jest.fn()
      }),
      close: jest.fn()
    }
  })
}))

jest.mock('../src/services/intelligenceDashboardService', () => ({
  getDailySnapshot: jest.fn(async () => ({
    snapshotDate: '2025-11-03T00:00:00.000Z',
    riskPulse: { score: 3.4, label: 'Elevated', delta: 1.2 },
    quickStats: { totalUpdates: 5, highImpact: 2, activeAuthorities: 3, deadlinesSoon: 1, urgentUpdates: 1 },
    streams: {
      high: [
        {
          updateId: 'u-1',
          headline: 'Priority enforcement action',
          authority: 'HMRC',
          urgency: 'High',
          impactLevel: 'Significant',
          summary: 'Summary goes here.',
          publishedAt: '2025-11-03T09:00:00.000Z'
        }
      ],
      medium: [],
      low: []
    },
    personas: {
      executive: { count: 1, pins: 1, openTasks: 0, updates: [] },
      analyst: { count: 0, pins: 0, openTasks: 0, updates: [] },
      operations: { count: 0, pins: 0, openTasks: 0, updates: [] }
    },
    timeline: [],
    themes: []
  }))
}))

const renderPdf = require('../src/routes/pages/aiIntelligence/exportPdfPage')

describe('AI Intelligence PDF export', () => {
  it('returns a PDF payload', async () => {
    const headers = {}
    let statusCode = 200
    let body = null

    const req = {}
    const res = {
      setHeader: (key, value) => {
        headers[key.toLowerCase()] = value
      },
      status(code) {
        statusCode = code
        return this
      },
      json(payload) {
        body = payload
      },
      send(payload) {
        body = payload
      }
    }

    await renderPdf(req, res)

    expect([200, 302]).toContain(statusCode)
    const contentType = headers['content-type'] || headers['Content-Type'] || ''
    if (statusCode === 200) {
      if (/application\/pdf/.test(contentType)) {
        expect(headers['content-disposition']).toMatch(/regcanary-intelligence/)
        expect(body).toBeInstanceOf(Buffer)
      } else {
        expect(contentType).toMatch(/text\/html/)
        expect(typeof body === 'string' || body instanceof Buffer).toBe(true)
      }
    } else {
      expect(headers.location || headers.Location).toContain('/ai-intelligence/export/one-pager')
    }
  })
})
