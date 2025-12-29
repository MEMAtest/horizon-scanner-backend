jest.mock('../src/services/aiAnalyzer', () => ({}))

const { router, setPipeline } = require('../src/routes/api/publications')

describe('publications api routes', () => {
  const originalDatabaseUrl = process.env.DATABASE_URL

  beforeEach(() => {
    setPipeline(null)
    process.env.DATABASE_URL = ''
  })

  afterAll(() => {
    setPipeline(null)
    if (originalDatabaseUrl) {
      process.env.DATABASE_URL = originalDatabaseUrl
    } else {
      delete process.env.DATABASE_URL
    }
  })

  function findRoute(stack, path, method) {
    for (const layer of stack) {
      if (layer.route) {
        if (layer.route.path === path && layer.route.methods[method]) {
          return layer.route
        }
        continue
      }

      if (layer.handle && layer.handle.stack) {
        const nested = findRoute(layer.handle.stack, path, method)
        if (nested) {
          return nested
        }
      }
    }
    return null
  }

  function getRoute(path, method) {
    return findRoute(router.stack, path, method.toLowerCase())
  }

  function runRoute(path, method, reqOverrides = {}) {
    return new Promise((resolve, reject) => {
      const route = getRoute(path, method)
      if (!route) {
        reject(new Error(`Route not found: ${method.toUpperCase()} ${path}`))
        return
      }

      const req = {
        method: method.toUpperCase(),
        url: path,
        headers: {},
        params: {},
        query: {},
        ...reqOverrides
      }

      const res = {
        statusCode: 200,
        status(code) {
          this.statusCode = code
          return this
        },
        json(body) {
          resolve({ status: this.statusCode, body })
        },
        send(body) {
          resolve({ status: this.statusCode, body })
        }
      }

      let idx = 0
      const next = (err) => {
        if (err) {
          reject(err)
          return
        }
        const layer = route.stack[idx++]
        if (!layer) return
        layer.handle(req, res, next)
      }

      next()
    })
  }

  it('returns 503 when no pipeline or database is available', async () => {
    const res = await runRoute('/status', 'get')
    expect(res.status).toBe(503)
    expect(res.body.success).toBe(false)
  })

  it('returns pipeline status when pipeline is available', async () => {
    const pipeline = {
      getStatus: jest.fn().mockResolvedValue({
        index: { total: 2, byStatus: { processed: 1, pending: 1 } },
        notices: { total: 1 }
      })
    }

    setPipeline(pipeline)

    const res = await runRoute('/status', 'get')
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.index.total).toBe(2)
    expect(pipeline.getStatus).toHaveBeenCalled()
  })

  it('returns pipeline stats when pipeline is available', async () => {
    const pipeline = {
      getStatus: jest.fn().mockResolvedValue({}),
      getStats: jest.fn().mockResolvedValue({
        outcomes: [{ outcome_type: 'Fine', count: 3 }]
      })
    }

    setPipeline(pipeline)

    const res = await runRoute('/stats', 'get')
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.outcomes.length).toBe(1)
    expect(pipeline.getStats).toHaveBeenCalled()
  })
})
