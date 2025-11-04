const baseSnapshot = {
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
    medium: [
      {
        updateId: 'u-2',
        headline: 'Compliance reminder',
        authority: 'FCA',
        urgency: 'Medium',
        impactLevel: 'Moderate',
        summary: 'Another summary.',
        publishedAt: '2025-11-03T10:00:00.000Z'
      }
    ],
    low: []
  },
  personas: {
    executive: { count: 1, pins: 1, openTasks: 0, updates: [] },
    analyst: { count: 0, pins: 0, openTasks: 0, updates: [] },
    operations: { count: 0, pins: 0, openTasks: 0, updates: [] }
  },
  personaBriefings: {
    executive: { summary: 'Review enforcement update.', nextSteps: ['Escalate with ExCo'] },
    analyst: { summary: 'Analyse compliance reminder.', nextSteps: ['Draft impact briefing'] },
    operations: { summary: 'Coordinate preparations.', nextSteps: ['Coordinate response plan'] }
  },
  timeline: [],
  themes: []
}

function createFsMock() {
  return {
    readFile: jest.fn().mockResolvedValue(Buffer.from('fake-logo')),
    mkdtemp: jest.fn().mockResolvedValue('/tmp/mock-regcanary'),
    rm: jest.fn().mockResolvedValue()
  }
}

function createPuppeteerSuccessMock(pdfBuffer = Buffer.from('%PDF-1.4 mock')) {
  const page = {
    setContent: jest.fn().mockResolvedValue(),
    emulateMediaType: jest.fn().mockResolvedValue(),
    pdf: jest.fn().mockResolvedValue(pdfBuffer),
    close: jest.fn().mockResolvedValue()
  }
  const browser = {
    newPage: jest.fn().mockResolvedValue(page),
    close: jest.fn().mockResolvedValue()
  }
  return {
    launch: jest.fn().mockResolvedValue(browser)
  }
}

function createPuppeteerFailureMock(error = new Error('puppeteer error')) {
  return {
    launch: jest.fn().mockRejectedValue(error)
  }
}

function createPdfKitMock() {
  return class PDFDocumentMock {
    constructor() {
      this.handlers = {}
    }

    on(event, handler) {
      this.handlers[event] = handler
      return this
    }

    fontSize() {
      return this
    }

    fillColor() {
      return this
    }

    text() {
      return this
    }

    moveDown() {
      return this
    }

    addPage() {
      return this
    }

    end() {
      if (this.handlers.data) {
        this.handlers.data(Buffer.from('%PDF-1.4 fallback'))
      }
      if (this.handlers.end) {
        this.handlers.end()
      }
    }
  }
}

function createMockResponse() {
  const headers = {}
  const res = {
    statusCode: 200,
    body: null,
    setHeader(key, value) {
      headers[key.toLowerCase()] = value
    },
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.body = payload
      return this
    },
    send(payload) {
      this.body = payload
      return this
    }
  }
  return { res, headers }
}

describe('AI Intelligence PDF export', () => {
  afterEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('streams a PDF when Puppeteer succeeds', async () => {
    const fsMock = createFsMock()
    const puppeteerMock = createPuppeteerSuccessMock()
    const pdfKitMock = createPdfKitMock()

    jest.doMock('fs/promises', () => fsMock)
    jest.doMock('puppeteer', () => puppeteerMock)
    jest.doMock('pdfkit', () => pdfKitMock, { virtual: true })
    const serviceMock = { getDailySnapshot: jest.fn(async () => baseSnapshot) }
    jest.doMock('../src/services/intelligenceDashboardService', () => serviceMock)

    const renderPdf = require('../src/routes/pages/aiIntelligence/exportPdfPage')
    const { res, headers } = createMockResponse()

    await renderPdf({}, res)

    expect(res.statusCode).toBe(200)
    expect(headers['content-type']).toBe('application/pdf')
    expect(headers['content-disposition']).toContain('regcanary-intelligence-2025-11-03')
    expect(res.body).toBeInstanceOf(Buffer)
    expect(puppeteerMock.launch).toHaveBeenCalled()
    expect(serviceMock.getDailySnapshot).toHaveBeenCalledTimes(1)
  })

  it('falls back to pdfkit when Puppeteer fails', async () => {
    const fsMock = createFsMock()
    const puppeteerMock = createPuppeteerFailureMock()
    const pdfKitMock = createPdfKitMock()

    jest.doMock('fs/promises', () => fsMock)
    jest.doMock('puppeteer', () => puppeteerMock)
    jest.doMock('pdfkit', () => pdfKitMock, { virtual: true })
    const serviceMock = { getDailySnapshot: jest.fn(async () => baseSnapshot) }
    jest.doMock('../src/services/intelligenceDashboardService', () => serviceMock)

    const renderPdf = require('../src/routes/pages/aiIntelligence/exportPdfPage')
    const { res, headers } = createMockResponse()

    await renderPdf({}, res)

    expect(puppeteerMock.launch).toHaveBeenCalled()
    expect(res.statusCode).toBe(200)
    expect(headers['content-type']).toBe('application/pdf')
    expect(headers['content-disposition']).toContain('fallback.pdf')
    expect(res.body).toBeInstanceOf(Buffer)
    expect(serviceMock.getDailySnapshot).toHaveBeenCalledTimes(1)
  })

  it('returns printable HTML when no renderer succeeds', async () => {
    const fsMock = createFsMock()
    const puppeteerMock = createPuppeteerFailureMock()

    jest.doMock('fs/promises', () => fsMock)
    jest.doMock('puppeteer', () => puppeteerMock)
    jest.doMock('pdfkit', () => { throw new Error('missing module') }, { virtual: true })
    const serviceMock = { getDailySnapshot: jest.fn(async () => baseSnapshot) }
    jest.doMock('../src/services/intelligenceDashboardService', () => serviceMock)

    const renderPdf = require('../src/routes/pages/aiIntelligence/exportPdfPage')
    const { res, headers } = createMockResponse()

    await renderPdf({}, res)

    expect(headers['content-type']).toMatch(/text\/html/)
    expect(typeof res.body).toBe('string')
    expect(res.body).toContain('window.print()')
    expect(res.body).toContain('Automatic PDF generation is not available')
    expect(serviceMock.getDailySnapshot).toHaveBeenCalledTimes(1)
  })
})
