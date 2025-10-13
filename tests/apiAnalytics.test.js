jest.mock('../src/services/predictiveIntelligenceService', () => ({
  getPredictiveDashboard: jest.fn()
}))

jest.mock('../src/services/analyticsService', () => ({
  getAnalyticsDashboard: jest.fn()
}))

jest.mock('../src/services/dbService', () => ({}))

jest.mock('../src/services/aiAnalyzer', () => ({
  healthCheck: jest.fn().mockResolvedValue({ status: 'healthy' })
}))

const predictiveIntelligenceService = require('../src/services/predictiveIntelligenceService')
const analyticsService = require('../src/services/analyticsService')
const apiRoutes = require('../src/routes/apiRoutes')

const getAnalyticsHandler = () => {
  const layer = apiRoutes.stack.find(entry => entry.route && entry.route.path === '/analytics')
  if (!layer) {
    throw new Error('Analytics route not found')
  }
  return layer.route.stack[0].handle
}

const invokeAnalyticsRoute = async (query = {}) => {
  const handler = getAnalyticsHandler()
  const req = { query }
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  }

  await handler(req, res)
  return res
}

describe('/api/analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns predictive analytics dashboard when service succeeds', async () => {
    const mockDashboard = { generatedAt: '2025-10-06T00:00:00.000Z', predictions: { imminent: [], nearTerm: [], strategic: [] } }
    predictiveIntelligenceService.getPredictiveDashboard.mockResolvedValue(mockDashboard)

    const res = await invokeAnalyticsRoute()

    expect(predictiveIntelligenceService.getPredictiveDashboard).toHaveBeenCalledWith(null)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      source: 'predictive',
      dashboard: mockDashboard
    }))
  })

  it('passes parsed firm profile to predictive analytics service when provided', async () => {
    const mockDashboard = { generatedAt: '2025-10-06T00:00:00.000Z', predictions: { imminent: [], nearTerm: [], strategic: [] } }
    const firmProfile = { firmName: 'TestCo', primarySectors: ['Banking'] }
    predictiveIntelligenceService.getPredictiveDashboard.mockResolvedValue(mockDashboard)

    const res = await invokeAnalyticsRoute({ profile: JSON.stringify(firmProfile) })

    expect(predictiveIntelligenceService.getPredictiveDashboard).toHaveBeenCalledWith(firmProfile)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }))
  })

  it('falls back to legacy analytics service when predictive service fails', async () => {
    predictiveIntelligenceService.getPredictiveDashboard.mockRejectedValue(new Error('predictive offline'))
    const legacyDashboard = { overview: { totalUpdates: 10 } }
    analyticsService.getAnalyticsDashboard.mockResolvedValue(legacyDashboard)

    const res = await invokeAnalyticsRoute()

    expect(analyticsService.getAnalyticsDashboard).toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      source: 'legacy',
      dashboard: legacyDashboard,
      warning: expect.any(String)
    }))
  })
})
