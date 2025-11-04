const renderAiIntelligencePage = require('../src/routes/pages/aiIntelligence/index.js')

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
})
