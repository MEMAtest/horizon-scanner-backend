jest.mock('../src/services/smartBriefingService')

const express = require('express')
const request = require('supertest')
const smartBriefingService = require('../src/services/smartBriefingService')
const smartBriefingRoutes = require('../src/routes/smartBriefingRoutes')

function createApp() {
  const app = express()
  app.use(express.json())
  app.use('/api', smartBriefingRoutes)
  return app
}

describe('POST /api/weekly-briefings/run (synchronous)', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.useFakeTimers({ advanceTimers: true })
  })
  afterEach(() => {
    jest.useRealTimers()
  })

  it('returns completed briefing when run finishes quickly', async () => {
    const runId = 'test-run-123'
    smartBriefingService.startRun.mockResolvedValue({ runId, state: 'queued' })

    // First poll: preparing, second poll: completed
    let pollCount = 0
    smartBriefingService.getRunStatus.mockImplementation(() => {
      pollCount++
      if (pollCount === 1) return { runId, state: 'preparing', message: 'Building dataset' }
      return { runId, state: 'completed', briefingId: 'briefing-abc', cacheHit: false }
    })

    const app = createApp()
    const res = await request(app)
      .post('/api/weekly-briefings/run')
      .send({ start: '2026-03-17', end: '2026-03-23', force: false })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.briefingId).toBe('briefing-abc')
    expect(res.body.cacheHit).toBe(false)
    expect(res.body.durationMs).toBeDefined()
    expect(smartBriefingService.startRun).toHaveBeenCalledWith({
      start: '2026-03-17',
      end: '2026-03-23',
      force: false
    })
  })

  it('returns cached briefing on cache hit', async () => {
    const runId = 'test-run-cache'
    smartBriefingService.startRun.mockResolvedValue({ runId, state: 'queued' })
    smartBriefingService.getRunStatus.mockReturnValue({
      runId,
      state: 'completed',
      briefingId: 'cached-brief',
      cacheHit: true
    })

    const app = createApp()
    const res = await request(app)
      .post('/api/weekly-briefings/run')
      .send({ start: '2026-03-10', end: '2026-03-17' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.cacheHit).toBe(true)
  })

  it('returns 500 when run fails', async () => {
    const runId = 'test-run-fail'
    smartBriefingService.startRun.mockResolvedValue({ runId, state: 'queued' })
    smartBriefingService.getRunStatus.mockReturnValue({
      runId,
      state: 'failed',
      error: 'AI API rate limited'
    })

    const app = createApp()
    const res = await request(app)
      .post('/api/weekly-briefings/run')
      .send({ start: '2026-03-17', end: '2026-03-23' })

    expect(res.status).toBe(500)
    expect(res.body.success).toBe(false)
    expect(res.body.error).toBe('AI API rate limited')
  })

  it('returns 500 when startRun throws', async () => {
    smartBriefingService.startRun.mockRejectedValue(new Error('DB connection failed'))

    const app = createApp()
    const res = await request(app)
      .post('/api/weekly-briefings/run')
      .send({ start: '2026-03-17', end: '2026-03-23' })

    expect(res.status).toBe(500)
    expect(res.body.success).toBe(false)
    expect(res.body.error).toBe('DB connection failed')
  })

  it('returns 504 when polling exceeds maxWait', async () => {
    const runId = 'test-run-slow'
    smartBriefingService.startRun.mockResolvedValue({ runId, state: 'queued' })
    // Always return "preparing" — never completes
    smartBriefingService.getRunStatus.mockReturnValue({
      runId,
      state: 'preparing',
      message: 'Still working...'
    })

    const app = createApp()
    const res = await request(app)
      .post('/api/weekly-briefings/run')
      .send({ start: '2026-03-17', end: '2026-03-23' })

    expect(res.status).toBe(504)
    expect(res.body.success).toBe(false)
    expect(res.body.timedOut).toBe(true)
    expect(res.body.message).toContain('taking longer than expected')
  }, 150000) // Allow enough time for the 110s loop

  it('breaks out of loop when getRunStatus returns null', async () => {
    const runId = 'test-run-lost'
    smartBriefingService.startRun.mockResolvedValue({ runId, state: 'queued' })
    smartBriefingService.getRunStatus.mockReturnValue(null)

    const app = createApp()
    const res = await request(app)
      .post('/api/weekly-briefings/run')
      .send({ start: '2026-03-17', end: '2026-03-23' })

    // Should break the loop and return 504
    expect(res.status).toBe(504)
    expect(res.body.timedOut).toBe(true)
  })
})

describe('Removed GET polling route', () => {
  it('returns 404 for GET /api/weekly-briefings/run/:runId', async () => {
    const app = createApp()
    const res = await request(app).get('/api/weekly-briefings/run/test-run-123')
    // The route no longer exists, Express returns 404
    expect(res.status).toBe(404)
  })
})

describe('Other routes still work', () => {
  it('GET /api/weekly-briefings/latest returns briefing', async () => {
    smartBriefingService.getLatestBriefing.mockResolvedValue({
      id: 'latest-123',
      artifacts: { narrative: 'test' }
    })

    const app = createApp()
    const res = await request(app).get('/api/weekly-briefings/latest')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.briefing.id).toBe('latest-123')
  })

  it('GET /api/weekly-briefings/latest returns 404 when no briefing', async () => {
    smartBriefingService.getLatestBriefing.mockResolvedValue(null)

    const app = createApp()
    const res = await request(app).get('/api/weekly-briefings/latest')

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })

  it('GET /api/weekly-briefings lists briefings', async () => {
    smartBriefingService.listBriefings.mockResolvedValue([
      { id: 'b1' }, { id: 'b2' }
    ])

    const app = createApp()
    const res = await request(app).get('/api/weekly-briefings?limit=2')

    expect(res.status).toBe(200)
    expect(res.body.briefings).toHaveLength(2)
  })

  it('GET /api/weekly-briefings/:id returns specific briefing', async () => {
    smartBriefingService.getBriefing.mockResolvedValue({
      id: 'specific-456',
      artifacts: { narrative: 'test' }
    })

    const app = createApp()
    const res = await request(app).get('/api/weekly-briefings/specific-456')

    expect(res.status).toBe(200)
    expect(res.body.briefing.id).toBe('specific-456')
  })
})
